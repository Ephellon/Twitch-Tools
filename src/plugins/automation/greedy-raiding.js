/*** /plugins/automation/greedy-raiding.js
 * Greedy Raiding.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let GREEDY_RAIDING_FRAMES;

/**
 * Greedy Raiding over EventSub: Twitch tells this tab when a watched channel raids (`channel.raid`, "No authorization
 * required"). Over WebSockets, one user token may hold subscriptions costing 10 in all, and each of these costs 1, so up
 * to 10 live followed channels are watched this way; the hidden chat takes turns on the rest. A channel keeps its place
 * while it's live; one that goes offline frees it for the next. Each notification is logged with its time, so a test
 * raid shows whether it comes during Twitch's countdown (in time to join the raid) or once the raid has gone.
 */
const RaidWatch = {
    MAX: 10,
    URL: 'wss://eventsub.wss.twitch.tv/ws',

    socket: null,
    session: null,
    watching: new Map,  // login → subscription ID (null while subscribing)
    failed: new Map,    // login → when its subscription failed (it isn't tried again for 5 minutes)

    /**
     * Whether a channel is watched over EventSub (the hidden chat skips it)
     * @param {string} login The channel's name
     */
    covers(login) {
        return defined(this.watching.get(login?.toLowerCase()));
    },

    /**
     * Opens the WebSocket (once; again 10s after Twitch closes it)
     * @param {string} [url] Where to connect (a reconnect URL from Twitch, or the usual one)
     */
    connect(url = this.URL) {
        if(defined(this.socket) && url == this.URL)
            return;

        let socket = new WebSocket(url),
            previous = this.socket;

        this.socket = socket;

        socket.onmessage = ({ data }) => {
            try {
                this.receive(JSON.parse(data), socket, previous);
            } catch(error) {
                $warn('[Greedy Raiding] EventSub: unreadable message', error);
            }
        };

        socket.onclose = () => {
            if(this.socket !== socket)
                return;

            this.socket = this.session = null;
            this.watching.clear();

            setTimeout(() => this.connect(), 10_000);
        };
    },

    /**
     * Handles one EventSub message
     * @param {object} message The message (`metadata` and `payload`)
     * @param {WebSocket} socket The connection it came on
     * @param {WebSocket} previous The connection before it (a reconnect closes it)
     */
    receive({ metadata = {}, payload = {} }, socket, previous) {
        switch(metadata.message_type) {
            case 'session_welcome': {
                this.session = payload.session?.id;

                // A reconnect: the subscriptions moved to this connection, so the old one can go
                if(previous && previous !== socket) {
                    previous.onclose = null;
                    previous.close();
                }
            } break;

            case 'session_reconnect': {
                this.connect(payload.session?.reconnect_url);
            } break;

            case 'notification': {
                if(payload.subscription?.type == 'channel.raid')
                    this.raided(payload.event ?? {});
            } break;

            case 'revocation': {
                for(let [login, id] of this.watching)
                    if(id == payload.subscription?.id)
                        this.watching.delete(login);
            } break;
        }
    },

    /**
     * Calls Helix's EventSub endpoint with the viewer's own token
     * @param {string} method The HTTP method
     * @param {object} [body] The request body
     * @param {string} [query] The query string
     */
    async helix(method, body = null, query = '') {
        await when.defined(() => Search.validated, 500);

        return fetch(`https://api.twitch.tv/helix/eventsub/subscriptions${ query }`, {
            method,
            headers: {
                'Authorization': Search.authorization,
                'Client-Id': Search.clientID,
                'Content-Type': 'application/json',
            },
            body: body && JSON.stringify(body),
        });
    },

    /**
     * Watches a channel's raids
     * @param {string} login The channel's name
     */
    async subscribe(login) {
        this.watching.set(login, null);

        try {
            let user = await Search.lookupUser({ login }),
                response = await this.helix('POST', {
                    type: 'channel.raid',
                    version: '1',
                    condition: { from_broadcaster_user_id: String(user?.id) },
                    transport: { method: 'websocket', session_id: this.session },
                }),
                json = await response.json();

            if(!response.ok || nullish(json?.data?.[0]?.id))
                throw `${ response.status } ${ json?.message ?? '' }`.trim();

            if(this.watching.has(login))
                this.watching.set(login, json.data[0].id);
            else
                this.helix('DELETE', null, `?id=${ json.data[0].id }`).catch($ignore);

            $remark(`[Greedy Raiding] EventSub: watching ${ login } (cost ${ json.total_cost }/${ json.max_total_cost })`);
        } catch(error) {
            this.watching.delete(login);
            this.failed.set(login, +new Date);

            $warn(`[Greedy Raiding] EventSub: couldn't watch ${ login } (the hidden chat takes it instead):`, error);
        }
    },

    /**
     * Stops watching a channel's raids
     * @param {string} login The channel's name
     */
    unsubscribe(login) {
        let id = this.watching.get(login);

        this.watching.delete(login);

        if(defined(id))
            this.helix('DELETE', null, `?id=${ id }`).catch($ignore);
    },

    /**
     * Watches up to 10 of the live followed channels (names: logins, in order)
     * @param {string[]} names The live followed channels' names
     */
    sync(names = []) {
        this.connect();

        if(nullish(this.session))
            return;

        names = names.map(name => name.toLowerCase());

        for(let login of [...this.watching.keys()])
            if(!names.includes(login))
                this.unsubscribe(login);

        for(let login of names) {
            if(this.watching.size >= this.MAX)
                break;

            if(this.watching.has(login) || (+new Date - (this.failed.get(login) ?? 0)) < 300_000)
                continue;

            this.subscribe(login);
        }
    },

    /**
     * A watched channel raided: the same as the hidden chat seeing a raid
     * @param {object} event The `channel.raid` event
     */
    raided(event) {
        let from = event.from_broadcaster_user_login ?? event.from_broadcaster_user_name,
            to = event.to_broadcaster_user_login ?? event.to_broadcaster_user_name;

        $warn(`[Greedy Raiding] EventSub: ${ from } raided ${ to } (${ event.viewers } viewers), heard ${ new Date().toISOString() }`);

        Runtime.sendMessage({ action: 'LOG_RAID_EVENT', data: { from, to } }, ({ events } = {}) => {
            void Runtime.lastError;

            // Channel points can't be seen from here: assume the channel has them
            top.postMessage({ action: 'raid', from, to, events, payable: true }, location.origin);
        });
    },

    /** Stops watching and closes the WebSocket (the feature was turned off, or its job restarts: the next run reopens it) */
    close() {
        let { socket } = this;

        for(let login of [...this.watching.keys()])
            this.unsubscribe(login);

        this.socket = this.session = null;

        if(socket) {
            socket.onclose = null;
            socket.close();
        }
    },
};

plugin({
    id: 'greedy_raiding',
    timer: 5000,

    /**
     * Init: Initializes the map used to track greedy raiding frames.
     */
    init() {
        GREEDY_RAIDING_FRAMES = new Map;
    },

    /**
     * Watches the live followed channels for raids through one hidden chat frame, one channel at a time.
     */
    handler: () => {
        const online = [STREAMER, ...STREAMERS].filter(isLive).filter(({ name }) => name.unlike(STREAMER.name))
            , container = (null
                ?? $('#tt-greedy-raiding--container')
                ?? furnish('#tt-greedy-raiding--container', {
                    style: new CSSObject(`
                        display: none;
                        visibility: hidden;

                        position: absolute;
                        top: -100vh;
                        left: -100vw;

                        height: 0;
                        width: 0;
                    `, true).toString('all'),
                })
            );

        // One channel at a time, at all times: each hidden frame is a whole Twitch chat page, and one per live followed channel
        // froze pages once the followed channels could be read (v5 #99). The frame watches a channel for 2 minutes, then moves
        // on to the next live one, in name order. The turn outlives the page (kept in localStorage: only the Up Next tab
        // runs this): Up Next moves on every few minutes, and starting over on each page left channels without a turn
        const frames = [...container.querySelectorAll('iframe[id^="tt-greedy-raiding--"i]')]
            , now = +new Date;

        let names = online.map(channel => channel.name).sort((a, b) => a.localeCompare(b));

        // Up to 10 channels are watched over EventSub (see `RaidWatch`); the hidden chat takes turns on the rest
        RaidWatch.sync(names);

        const watched = names.filter(name => RaidWatch.covers(name));

        let [frame] = frames
            , turn = {};

        for(const extra of frames.slice(1))
            extra.remove();

        try {
            turn = JSON.parse(localStorage.getItem('ttv-tools:greedy-raiding') ?? '{}') ?? {};
        } catch {
            // No storage: this page's frame is the turn
        }

        let name = frame?.getAttribute('channel') ?? turn.name
            , since = parseInt(frame?.getAttribute('since') ?? turn.since) || 0;

        names = names.filter(name => !watched.includes(name));

        // The turn is over (2 minutes), or its channel isn't live (or chat-watched) any more: the next channel's turn
        if(!names.includes(name) || now - since >= 120_000) {
            name = names.find(next => next.localeCompare(name ?? '') > 0) ?? names[0];
            since = now;
        }

        // One frame for good: it goes to the next channel instead of being removed and made again (removing it gave no memory
        // back any sooner). `replace` keeps the turns out of the tab's Back history
        const goto = (frame, src) => {
            try {
                frame.contentWindow.location.replace(new URL(src, location.href).href);
            } catch {
                frame.src = src;
            }
        };

        if(nullish(name)) {
            // No live followed channel: the frame waits on a blank page
            if(defined(frame) && frame.getAttribute('channel')?.length) {
                goto(frame, 'about:blank');
                frame.setAttribute('channel', '');
            }

            GREEDY_RAIDING_FRAMES.clear();
        } else if(frame?.getAttribute('channel') != name) {
            const src = `./popout/${ name }/chat?hidden=true&parent=twitch.tv&current=${ STREAMER.name.equals(name) }&allow=greedy_raiding`;

            GREEDY_RAIDING_FRAMES.clear();

            if(defined(frame)) {
                goto(frame, src);
                frame.setAttribute('channel', name);
                frame.setAttribute('since', since);
            } else {
                frame = furnish('iframe#tt-greedy-raiding--frame', {
                    src,
                    channel: name,
                    since,

                    // sandbox: `allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals`,
                });

                container.append(frame);
            }

            GREEDY_RAIDING_FRAMES.set(name, frame);

            try {
                localStorage.setItem('ttv-tools:greedy-raiding', JSON.stringify({ name, since }));
            } catch {
                // No storage
            }
        }
        if([...$.body.children].missing(container))
            $.body.append(container);
    },

    /**
     * Undoes greedy-raiding: Removes all created raiding iframes.
     */
    unhandler: () => {
        for(const [name, frame] of GREEDY_RAIDING_FRAMES)
            frame?.remove();

        RaidWatch.close();
    },

    /**
     * Checks if greedy raiding is enabled in settings and allowed in the current tab.
     * @returns {boolean} Whether the feature should be active
     */
    enabled() {
        return UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.greedy_raiding);
    },

    setup() {
        $remark("Adding raid-watching logic...");
    },
});
