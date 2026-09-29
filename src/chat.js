/*** /chat.js - Meant for features that can run on chat-only pages
 *       _____ _           _     _
 *      / ____| |         | |   (_)
 *     | |    | |__   __ _| |_   _ ___
 *     | |    | '_ \ / _` | __| | / __|
 *     | |____| | | | (_| | |_ _| \__ \
 *      \_____|_| |_|\__,_|\__(_) |___/
 *                             _/ |
 *                            |__/
 */

/** @file Defines the chat-specific logic for the extension. Used for all {@link # twitch.tv/chat/*} sites.
 * <style>[pill]{font-weight:bold;white-space:nowrap;border-radius:1rem;padding:.25rem .75rem}[good]{background:#e8f0fe;color:#174ea6}[bad]{background:#fce8e6;color:#9f0e0e;}</style>
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

window.IS_A_FRAMED_CONTAINER = (top != window);

top.Queue ??= { balloons: [], bullets: [], bttv_emotes: [], emotes: [], messages: [], message_popups: [], popups: [] };

/**
 * Initializes the chat feature, setting up shared data, streamer context, and Twitch badges.
 * @param {boolean} [START_OVER=false] - Whether to restart the initialization process
 * @returns {Promise<void>}
 */
let Chat__Initialize = async(START_OVER = false) => {
    // Shared between this initializer's features and their plugins (src/plugins/)
    let CHANNEL_POINTS_MULTIPLIER, EmoteSearch, EmoteDragCommand, BTTV_EMOTES, REFURBISH_BTTV_EMOTE_TOOLTIPS, UPDATE_RULES;

    const here = parseURL(window.location.href);
    const fsData = Object.assign(await Runtime.sendMessage({ action: 'FETCH_SHARED_DATA' }), top);

    let {
        USERNAME = Search?.cookies?.name,
        LANGUAGE,
        THEME,

        PATHNAME = here.pathname,
        NORMALIZED_PATHNAME = here.pathname.replace(/^\/(?:moderator|popout)\/(\/[^\/]+?)/i, '$1').replace(/^(\/[^\/]+?)\/(?:about|schedule|squad|videos)\b/i, '$1'),
        STREAMER = ({
            get href() { return `https://www.twitch.tv/${ STREAMER.name }` },
            get name() { return here.searchParameters.channel },
            get live() { return !$.all('[href*="offline_embed"i]').length },
            get sole() { return parseInt($('img[class*="channel"i][class*="point"i][class*="icon"i]')?.src?.replace(/[^]*\/(\d+)\/[^]*/, '$1')) || null },
        }),

        GLOBAL_EVENT_LISTENERS = {},
    } = fsData;

    // Fill STREAMER
    const [path, name, endpoint] = location.pathname.split(/(?<!^)\//);

    // Get Twitch Badges
    let TTV_BADGES = {
        get(name) {
            for(const key in TTV_BADGES)
                if(name.equals(key))
                    return TTV_BADGES[key];
        },
    };

    fetch(Runtime.getURL(`ext/badges.json`))
        .then(r => r.json())
        .then(json => {
            for(const { name, uuid } of json)
                TTV_BADGES[name] = uuid;
        });

    // Time how long jobs take to complete properly
    class StopWatch {
        static #WATCHES = new Map;

        constructor(name, interval) {
            interval ??= Timers[name];

            StopWatch.#WATCHES.set(name, this);

            return Object.assign(this, {
                name, interval,

                start: new Date,
                stop: null,
                span: null,
                max: Math.abs(interval) * 1.1,
            });
        }

        static stop(name) {
            StopWatch.#WATCHES.get(name)?.time();
        }

        time() {
            const stop = this.stop = new Date;
            const span = this.span = Math.abs(this.start - stop);
            const { max, name } = this;

            if(span > max)
                $warn(`"${ name.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['', ' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, '- ') }" took ${ (span / 1000).suffix('s', 2).replace(/\.0+/, '') } to complete (max time allowed is ${ (max / 1000).suffix('s', 2).replace(/\.0+/, '') }). Offense time: ${ new Date }. Offending site: ${ location.pathname }`)
                    ?.toNativeStack?.();
        }
    }

    // What plugins (src/plugins/chat/) get from this scope; migrate.mjs --live adds live accessors
    const PLUGIN_CONTEXT = {
        get TTV_BADGES() { return TTV_BADGES }, set TTV_BADGES(value) { TTV_BADGES = value },
        get GLOBAL_EVENT_LISTENERS() { return GLOBAL_EVENT_LISTENERS }, set GLOBAL_EVENT_LISTENERS(value) { GLOBAL_EVENT_LISTENERS = value },
        get USERNAME() { return USERNAME }, set USERNAME(value) { USERNAME = value },
        get UPDATE_RULES() { return UPDATE_RULES }, set UPDATE_RULES(value) { UPDATE_RULES = value },
        get BTTV_EMOTES() { return BTTV_EMOTES }, set BTTV_EMOTES(value) { BTTV_EMOTES = value },
        get REFURBISH_BTTV_EMOTE_TOOLTIPS() { return REFURBISH_BTTV_EMOTE_TOOLTIPS }, set REFURBISH_BTTV_EMOTE_TOOLTIPS(value) { REFURBISH_BTTV_EMOTE_TOOLTIPS = value },
        get STREAMER() { return STREAMER }, set STREAMER(value) { STREAMER = value },
        get EmoteSearch() { return EmoteSearch }, set EmoteSearch(value) { EmoteSearch = value },
        get EmoteDragCommand() { return EmoteDragCommand }, set EmoteDragCommand(value) { EmoteDragCommand = value },
        get CHANNEL_POINTS_MULTIPLIER() { return CHANNEL_POINTS_MULTIPLIER }, set CHANNEL_POINTS_MULTIPLIER(value) { CHANNEL_POINTS_MULTIPLIER = value },
        get StopWatch() { return StopWatch },
    };

    // Auto-claim Channel Points → src/plugins/chat/auto-claim-bonuses.js
    await TTV.run('chat.auto_claim_bonuses', PLUGIN_CONTEXT);

    // Emote Searching - NOT A SETTING. This is a helper for "Convert Emotes" and "BTTV Emotes" → src/plugins/chat/emote-searching.js
    await TTV.run('chat.emote_searching', PLUGIN_CONTEXT);

    // BetterTTV Emotes → src/plugins/chat/bttv-emotes.js
    await TTV.run('chat.bttv_emotes', PLUGIN_CONTEXT);

    // Convert Emotes → src/plugins/chat/convert-emotes.js
    await TTV.run('chat.convert_emotes', PLUGIN_CONTEXT);

    // Filter Messages → src/plugins/chat/filter-messages.js
    await TTV.run('chat.filter_messages', PLUGIN_CONTEXT);

    // Easy Filter - NOT A SETTING. This is a helper for "Message Filter" → src/plugins/chat/easy-filter.js
    await TTV.run('chat.easy_filter', PLUGIN_CONTEXT);

    // Filter Bulletins → src/plugins/chat/filter-bulletins.js
    await TTV.run('chat.filter_bulletins', PLUGIN_CONTEXT);

    // Highlight Phrases → src/plugins/chat/highlight-phrases.js
    await TTV.run('chat.highlight_phrases', PLUGIN_CONTEXT);

    // Easy Highlighter - NOT A SETTING. This is a helper for "Highlight Phrases" → src/plugins/chat/easy-highlighter.js
    await TTV.run('chat.easy_highlighter', PLUGIN_CONTEXT);

    // Easy Helper Card Resizer - NOT A SETTING. This is a helper for "Filter Messages" and "Highlight Phrases" that adjusts the card height for hidden children → src/plugins/chat/easy-helper-card-resizer.js
    await TTV.run('chat.easy_helper_card_resizer', PLUGIN_CONTEXT);

    // Message Highlighter → src/plugins/chat/highlight-mentions.js
    await TTV.run('chat.highlight_mentions', PLUGIN_CONTEXT);

    // Message Highlighter - Popup → src/plugins/chat/highlight-mentions-popup.js
    await TTV.run('chat.highlight_mentions_popup', PLUGIN_CONTEXT);

    // Native Twitch Reply → src/plugins/chat/native-twitch-reply.js
    await TTV.run('chat.native_twitch_reply', PLUGIN_CONTEXT);

    // Link maker → src/plugins/chat/link-maker-chat.js
    await TTV.run('chat.link_maker__chat', PLUGIN_CONTEXT);

    // Auto-chat (VIP) · @dskw1 → src/plugins/chat/auto-chat-vip.js
    await TTV.run('chat.auto_chat__vip', PLUGIN_CONTEXT);

    // Prevent spam → src/plugins/chat/prevent-spam.js
    await TTV.run('chat.prevent_spam', PLUGIN_CONTEXT);

    // Simplify Chat → src/plugins/chat/simplify-chat.js
    await TTV.run('chat.simplify_chat', PLUGIN_CONTEXT);

    // Convert Bits → src/plugins/chat/convert-bits.js
    await TTV.run('chat.convert_bits', PLUGIN_CONTEXT);

    // Rewards Calculator → src/plugins/chat/rewards-calculator.js
    await TTV.run('chat.rewards_calculator', PLUGIN_CONTEXT);

    // Points Receipt (Helper) - NOT A SETTING. This is a hlper for "Points Receipt (Placement)" → src/plugins/chat/points-receipt-placement-framed-helper.js
    await TTV.run('chat.points_receipt_placement_framed_helper', PLUGIN_CONTEXT);

    // Recover Chat → src/plugins/chat/recover-chat.js
    await TTV.run('chat.recover_chat', PLUGIN_CONTEXT);

    // Reocver Messages → src/plugins/chat/recover-messages.js
    await TTV.run('chat.recover_messages', PLUGIN_CONTEXT);

    // The viewer's TTV DSL scripts
    await TTV.run('chat.user_scripts', PLUGIN_CONTEXT);

};
// End of Chat__Initialize

/**
 * Initializes a restricted set of chat plugins for safe mode operation.
 * @param {Object} options - Initialization options
 * @param {boolean} [options.banned=false] - Whether the user is banned
 * @param {boolean} [options.hidden=false] - Whether the chat is hidden
 * @returns {Promise<void>}
 */
let Chat__Initialize_Safe_Mode = async({ banned = false, hidden = false }) => {
    const here = parseURL(window.location.href);
    const fsData = Object.assign(await Runtime.sendMessage({ action: 'FETCH_SHARED_DATA' }), top);

    let {
        USERNAME = Search?.cookies?.name,
        LANGUAGE,
        THEME,

        PATHNAME = here.pathname,
        NORMALIZED_PATHNAME = here.pathname.replace(/^\/(?:moderator|popout)\/(\/[^\/]+?)/i, '$1').replace(/^(\/[^\/]+?)\/(?:about|schedule|squad|videos)\b/i, '$1'),
        STREAMER = ({
            get href() { return `https://www.twitch.tv/${ STREAMER.name }` },
            get name() { return here.searchParameters.channel },
            get live() { return !$.all('[href*="offline_embed"i]').length },
            get sole() { return parseInt($('img[class*="channel"i][class*="point"i][class*="icon"i]')?.src?.replace(/[^]*\/(\d+)\/[^]*/, '$1')) || null },
        }),

        GLOBAL_EVENT_LISTENERS = {},
    } = fsData;

    // Fill STREAMER
    const [path, name, endpoint] = location.pathname.split(/(?<!^)\//);

    // What plugins (src/plugins/chat/) get from this scope; migrate.mjs --live adds live accessors
    const PLUGIN_CONTEXT = {
        get THEME() { return THEME }, set THEME(value) { THEME = value },
        get STREAMER() { return STREAMER }, set STREAMER(value) { STREAMER = value },
    };

    // Greedy Raiding → src/plugins/chat/safe-greedy-raiding.js
    await TTV.run('chat-safe.greedy_raiding', PLUGIN_CONTEXT);

    // Point Watcher (Helper) → src/plugins/chat/safe-point-watcher-helper.js
    await TTV.run('chat-safe.point_watcher_helper', PLUGIN_CONTEXT);

    // Soft Unban | tmarenko @ GitHub | https://github.com/tmarenko/twitch_chat_antiban → src/plugins/chat/safe-soft-unban.js
    await TTV.run('chat-safe.soft_unban', PLUGIN_CONTEXT);

};
// End of Chat__Initialize_Safe_Mode

let Chat__PAGE_CHECKER
    , Chat__WAIT_FOR_PAGE
    , Chat__SETTING_RELOADER;

Chat__PAGE_CHECKER = setInterval(Chat__WAIT_FOR_PAGE = async() => {
    // Do NOT run on unsafe pages
    if(top.UNSAFE_TWITCH_PATHNAMES?.test(location.pathname))
        return false;

    // Only executes if the user is banned
    const banned = parseBool(STREAMER?.veto || $.all('[class*="banned"i]')?.length);
    let done = false;

    try {
        // Keep hidden iframes from loading resources
        const hidden = parseBool(parseURL(location).searchParameters?.hidden);

        if([banned, hidden].map(parseBool).contains(true)) {
            if(!parseBool(hidden))
                $warn("[NON_FATAL] Child container unavailable. Is it a ban? ", ['No', 'Yes'][+banned], "Is chat embedded and hidden?", ['No', 'Yes'][+hidden]);

            wait(5000).then(() => Chat__Initialize_Safe_Mode({ banned, hidden }));

            return await Settings.get();
        }

        // Only executes if the user is NOT banned
        const ready = (true
            // The main controller is ready
            && (false
                || parseBool(top.MAIN_CONTROLLER_READY)
                || (false
                    // This window is the main container
                    || (true
                        && top == window
                        && top.document.readyState.equals('complete')

                        // The follow button exists
                        && $.defined(`[data-a-target="follow-button"i], [data-a-target="unfollow-button"i]`)

                        // There are channel buttons on the side
                        && parseBool($.all('[id*="side"i][id*="nav"i] .side-nav-section[aria-label]')?.length)
                    )

                    // This window is not the main container
                    || (true
                        && IS_A_FRAMED_CONTAINER
                        && document.readyState.equals('complete')

                        // There is a welcome message container
                        && $.defined(`[data-a-target*="welcome"i]`)
                    )
                )
            )
            // There isn't an advertisement playing
            && $.nullish('[data-test-selector*="sad"i][data-test-selector*="overlay"i]')

            // There is at least one proper container
            && (false
                // There is a message container
                || $.defined('[data-test-selector$="message-container"i]')

                // There is an error message
                || $.defined('[data-a-target="core-error-message"i]')
            )
        );

        if(!ready)
            return;

        $log("Child container ready");

        // Fixes shift-left issue
        when(() => $.defined('[data-a-target*="chat"i][data-a-target*="welcome"i]')).then(() => {
            setTimeout(() => {
                const ebWabz = $('.Layout-sc-1xcs6mc-0.ebWabz');
                const root = $('.channel-root--home');

                $notice(`Unshifting webpage...`);

                if(defined(ebWabz) && defined(root))
                    ebWabz.scrollLeft = 0;
            }, 5e3);
        });

        await Settings.get();

        wait(5000).then(Chat__Initialize);
        clearInterval(Chat__PAGE_CHECKER);

        window.CHILD_CONTROLLER_READY = true;

        // Only re-execute if in an iframe
        if(IS_A_FRAMED_CONTAINER) {
            // Observe [top] location changes
            LocationObserver: {
                let { body } = document
                    , observer = new MutationObserver(mutations => {
                        mutations.map(mutation => {
                            if(PATHNAME !== window.location.pathname) {
                                const OLD_HREF = PATHNAME;

                                PATHNAME = window.location.pathname;

                                NORMALIZED_PATHNAME = PATHNAME
                                    // Remove common "modes"
                                    .replace(/^\/(?:moderator|popout)\/(\/[^\/]+?)/i, '$1')
                                    .replace(/^(\/[^\/]+?)\/(?:about|schedule|squad|videos)\b/i, '$1');

                                for(const [name, func] of (top?.__ONLOCATIONCHANGE__ ?? []))
                                    func(new CustomEvent('locationchange', { from: OLD_HREF, to: PATHNAME }));
                            }
                        });
                    });

                observer.observe(body, { childList: true, subtree: true });
            }

            // Observe chat
            let CHAT_SELF_REFLECTOR;

            ChatObserver: {
                // Only chat frames get a relay: a hidden page frame (e.g. Claim Drops' /drops/inventory) would join "#inventory"
                if(!/^\/(?:popout|embed)\/[^/]+\/chat\b/i.test(location.pathname))
                    break ChatObserver;

                let [CHANNEL] = location.pathname.toLowerCase().slice(1).split('/').slice(+IS_A_FRAMED_CONTAINER)
                    , USERNAME = Search.cookies.login ?? `User_Not_Logged_In_${ +new Date }`;

                CHANNEL = `#${ CHANNEL }`;

                // Simple WebSocket → https://dev.twitch.tv/docs/irc
                if(defined(TTV_IRC.sockets[CHANNEL]))
                    return;

                Object.defineProperty(TTV_IRC, 'wsURL_chat', {
                    value: `wss://irc-ws.chat.twitch.tv:443`,

                    writable: false,
                    enumerable: false,
                    configurable: false,
                });

                let socket = (TTV_IRC.sockets[CHANNEL] = new WebSocket(TTV_IRC.wsURL_chat));

                const START_WS = socket.onopen = event => {
                    $log(`Chat Relay (child) connected to "${ CHANNEL }"`);

                    // CONNECTING → 0; OPEN → 1; CLOSING → 2; CLOSED → 3
                    when(() => socket.readyState === WebSocket.OPEN)
                        .then(() => {
                            socket.send(`CAP REQ :twitch.tv/commands twitch.tv/membership twitch.tv/tags`);
                            socket.send(`PASS oauth:${ Search.cookies.auth_token }`);
                            socket.send(`NICK ${ USERNAME.toLowerCase() }`);
                        });

                    const restrictions = (TTV_IRC.restrictions ??= new Map);

                    socket.onmessage = socket.reflect = CHAT_SELF_REFLECTOR = async event => {
                        const messages = event.data.trim().split('\r\n').map(TTV_IRC.parseMessage).filter(defined);

                        // $remark('Chat Relay received messages', messages);

                        for(const { command, parameters, source, tags } of messages) {
                            const channel = (command.channel ?? CHANNEL).toLowerCase();
                            const usable = parseBool(channel.equals(CHANNEL));

                            switch(command.command) {

                                // The signed-in viewer's state in this channel: keep their badges (TTV DSL `[badge]` at the top level)
                                case 'USERSTATE': {
                                    Chat.viewerBadges = Object.keys(tags?.badges ?? {});
                                } break;

                                // Successful login attempt
                                case '001': {
                                    socket.send(`JOIN ${ CHANNEL }`);
                                    // TODO | To be removed Feb 18, 2024 → https://dev.twitch.tv/docs/irc/chat-commands/#migration-guide
                                    socket.send(`PRIVMSG ${ CHANNEL } :/mods`);
                                    socket.send(`PRIVMSG ${ CHANNEL } :/vips`);
                                } break;

                                // PONG the server back...
                                case 'PING': {
                                    socket.send(`PONG ${ parameters }`);
                                } break;

                                // Someone joined the server
                                case 'JOIN': {
                                    // $log(`New user "${ source.nick }" on ${ channel }`);

                                    Chat.gang?.push(source.nick);
                                } break;

                                // Kicked!
                                case 'PART': {
                                    // $warn(`Unable to relay messages from "${ source.nick }" on ${ channel }`);

                                    if(USERNAME.equals(source.nick))
                                        socket.close();

                                    Chat.gang = Chat.gang?.filter(user => user.unlike(source.nick));
                                } break;

                                // Something happened...
                                case 'NOTICE': {
                                    if('room_mods mod_success unmod_success no_mods vips_success vip_success unvip_success no_vips'.contains(tags?.msg_id)) {
                                        const msg = tags.msg_id
                                            , typ = msg.replace(/.*((?:mod|vip)s?).*/i, '$1').toLowerCase();

                                        Chat[CHANNEL] ??= { mods: [], vips: [] };

                                        if(msg.startsWith('no_'))
                                            /* Do nothing */;
                                        else if(/^(mod|vip)_/i.test(msg))
                                            Chat[CHANNEL][typ].push(parameters.replace(/.*added\s+(\S+).*/i, '$1').toLowerCase());
                                        else if(/^un(mod|vip)_/i.test(msg))
                                            Chat[CHANNEL][typ] = Chat[CHANNEL][typ].filter(name => name.unlike(parameters.replace(/.*removed\s+(\S+).*/i, '$1')));
                                        else
                                            Chat[CHANNEL][typ].push(...parameters.replace(/^[^:]*(.+?)\.?$/, ($0, $1, $$, $_) => $1.replace(/[:\s]+/g, '').toLowerCase()).split(','));
                                    } else {
                                        if(/^((?:bad|msg|no|un(?:available|recognized))_|(?:invalid)|_(?:banned|error|limit|un(?:expected)))/i.test(tags?.msg_id))
                                            $warn(`There's an error on ${ channel }: ${ parameters }`, { command, parameters, source, tags });
                                        else
                                            $warn(`Something's happening on ${ channel }: ${ parameters }`, { command, parameters, source, tags });

                                        // socket.send(`PART ${ channel }`);
                                    }
                                } break;

                                // Status(es) of the room
                                case 'ROOMSTATE': {
                                    const { room_id, emote_only, followers_only, r9k, slow, subs_only } = tags;

                                    restrictions.set(channel, {
                                        room_id,
                                        emote_only: parseBool(+emote_only),
                                        followers_only: (+followers_only > 0 ? +followers_only * 60_000 : !1),
                                        r9k: parseBool(+r9k),
                                        slow: (+slow * 1000),
                                        subs_only: parseBool(+subs_only),
                                    });
                                } break;

                                // Something happened (alert)
                                case 'USERNOTICE': {
                                    const { id, msg_id, system_msg } = tags;

                                    const message = (system_msg ?? parameters).replace(/\\s/g, ' ')
                                        , mentions = message.split(/(@\S+)/).filter(s => s.startsWith('@')).map(s => s.slice(1).toLowerCase())
                                        , subject = (
                                            'sub resub'.split(' ').contains(msg_id)
                                                ? 'dues'
                                                : 'giftpaidupgrade anongiftpaidupgrade'.split(' ').contains(msg_id)
                                                    ? 'keep'
                                                    : 'subgift rewardgift submysterygift rewardmysterygift'.split(' ').contains(msg_id)
                                                        ? 'gift'
                                                        : 'raid unraid'.split(' ').contains(msg_id)
                                                            ? 'raid' // incoming raids
                                                            : 'pointsredeemed'.split(' ').contains(msg_id)
                                                                ? 'coin'
                                                                // ritual (new_chatter, etc.); bitsbadgetier (100, 1000, 10000, etc.)
                                                                : 'note'
                                        )
                                        , element = when.defined(async(message, subject) =>
                                            // TODO: get bullets via text content
                                            $.all('[role] ~ *:is([role="log"i], [class~="chat-room"i], [data-a-target*="chat"i], [data-test-selector*="chat"i]) *:is(.tt-accent-region, [data-test-selector="user-notice-line"i], [class*="notice"i][class*="line"i], [class*="gift"i]:not([class*="count"i]), [data-test-selector="announcement-line"i], [class*="announcement"i][class*="line"i])')
                                                .find(element => {
                                                    let A = message.mutilate();
                                                    let B = element.textContent.mutilate();

                                                    if(A.length < B.length)
                                                        [A, B] = [B, A];

                                                    if(false
                                                        // The element already has a UUID and type
                                                        || (true
                                                            && element.dataset.uuid
                                                            && element.dataset.type
                                                        )
                                                        // The text matches less than 40% of the message
                                                        || A.slice(0, B.length).errs(B) > .6
                                                    )
                                                        return false;

                                                    if(subject?.equals('coin')) {
                                                        let I;

                                                        STREAMER.shop?.map(item => {
                                                            if(true
                                                                && item.prompt.length > (I?.prompt?.length | 0)
                                                                && item.prompt.mutilate().errs(A) < (I?.prompt?.mutilate()?.errs(A) ?? 1)
                                                                && item.available
                                                                && item.enabled
                                                                && !(item.hidden || item.paused)
                                                            )
                                                                I = item;
                                                        });

                                                        if(defined(I))
                                                            element.dataset.shopItemId = I.id;
                                                    }

                                                    element.dataset.uuid ||= UUID.from(element.getPath());
                                                    element.dataset.type ||= subject;

                                                    return message.mutilate().errs(element.textContent.mutilate()) < .2;
                                                })
                                        , 100, message, subject);

                                    const results = {
                                        element,
                                        usable,
                                        message,
                                        subject,
                                        mentions,
                                        timestamp: new Date,

                                        // An incoming raid: who, and with how many (TTV DSL `raid` events; never an `unraid`)
                                        ...(msg_id == 'raid' ? { raider: (tags.msg_param_login ?? '').toLowerCase(), raid_size: parseInt(tags.msg_param_viewerCount) | 0 } : {}),

                                        // TODO: see if there are extra `msg_id` values
                                        msg_id,
                                    };

                                    Chat.__allbullets__.add(results);

                                    for(const [name, callback] of Chat.__onbullet__)
                                        callback(results);

                                    for(const [name, callback] of Chat.__deferredEvents__.__onbullet__)
                                        when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                    for(const [name, callback] of Chat.__consumableEvents__.__onbullet__) {
                                        when(() => PAGE_IS_READY, 250).then(() =>
                                            callback(results).then(complete => {
                                                if(complete)
                                                    Chat.__consumableEvents__.__onbullet__.delete(name);
                                            })
                                        );
                                    }
                                } break; // switch command.command | 'USERNOTICE'

                                // The channel is hosting...
                                case 'HOSTTARGET': {
                                    if(!usable)
                                        continue;

                                    const [to, amount] = parameters.split(' ', 2);

                                    when.defined(() => STREAMER)
                                        .then(() => {
                                            for(const callback of STREAMER.__eventlisteners__.onhost)
                                                when(() => PAGE_IS_READY, 250).then(() => callback({ hosting: to.unlike('-') }));
                                        });
                                } break;

                                // Got a message...
                                case 'PRIVMSG': {
                                    // $remark('PRIVMSG:', { command, parameters, source, tags });

                                    // Bot commands...
                                    if(defined(command.botCommand)) {
                                        const results = { name: command.botCommand, arguments: command.botCommandParams };

                                        for(const [name, callback] of Chat.__oncommand__)
                                            callback(results);

                                        for(const [name, callback] of Chat.__deferredEvents__.__oncommand__)
                                            when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                        for(const [name, callback] of Chat.__consumableEvents__.__oncommand__) {
                                            when(() => PAGE_IS_READY, 250).then(() =>
                                                callback(results).then(complete => {
                                                    if(complete)
                                                        Chat.__consumableEvents__.__oncommand__.delete(name);
                                                })
                                            );
                                        }

                                        // A command is still a chat message: fall through to `onmessage` (TTV DSL scripts listen there)
                                    }

                                    const author = source.nick
                                        , badges = Object.keys(tags?.badges ?? {})
                                        , message = parameters.replace(/^([\u0001-\u0007\u000e-\u001f])((?:\w+)\s*)([^]+)\1$/g, '$3').trim()
                                        // Have to wait on the page to play catch-up...
                                        , element = when.defined((message, uuid) =>
                                            $.all('[data-test-selector$="message-container"i] [data-a-target$="message"i]')
                                                .find(div =>
                                                    $.all(`[data-a-user="${ author }"i]`, div)
                                                        .map(div => div.closest('[data-test-selector$="message"i], [data-a-target$="message"i]'))
                                                        .filter(defined)
                                                        .find(div => {
                                                            const text = []
                                                                , body = $('[data-test-selector$="message-body"i], [class*="message-container"i]', div);

                                                            if(nullish(body))
                                                                return;

                                                            for(const child of $.all('[class*="username"i][class*="container"i] ~ :last-child > *', body))
                                                                if(child.dataset.testSelector?.equals('emote-button')) {
                                                                    text.push($('img', child).alt)
                                                                } else if(child.dataset.aTarget?.contains('timestamp')) {
                                                                    continue
                                                                } else if($.defined('var', child)) {
                                                                    let { textContent } = child;

                                                                    for(const v of $.all('var', child))
                                                                        textContent = textContent.replace(v.textContent, '');

                                                                    child.textContent = textContent;
                                                                } else {
                                                                    text.push(child.textContent)
                                                                }

                                                            const match = text.join('').mutilate(true).equals(message.mutilate(true));

                                                            if(match)
                                                                div.dataset.uuid = uuid;

                                                            return match;
                                                        })
                                                )
                                        , 100, message, tags.id)
                                        , emotes = Object.keys(tags.emotes ?? {}).map(key => {
                                            const emote = (tags.emotes[+key] || tags.emotes[key]).shift()
                                                , name = parameters.substring(+emote.startPosition, ++emote.endPosition)
                                                , url = `https://static-cdn.jtvnw.net/emoticons/v2/${ key }/default/${ THEME }/1.0`;

                                            Chat.__allemotes__.set(name, url);

                                            return name;
                                        })
                                        , handle = tags.display_name
                                        , mentions = parameters.split(/(@\S+)/).filter(s => s.startsWith('@')).map(s => s.slice(1).toLowerCase())
                                        , raw = [(handle.unlike(author) ? `${ handle } (${ author })` : handle), message].join(': ')
                                        , reply = when.defined(e => e, 100, element).then(element => element?.querySelector('[class*="reply"i] button'))
                                        , style = `color: ${ tags.color || '#9147FF' };`
                                        , uuid = tags.id
                                        , sent = (new Date).toJSON();

                                    const results = {
                                        raw,
                                        sent,
                                        uuid,
                                        reply,
                                        style,
                                        author,
                                        emotes,
                                        badges,
                                        handle,
                                        usable,
                                        element,
                                        message,
                                        mentions,
                                        timestamp: new Date,
                                        highlighted: when.defined(e => e, 100, element).then(element => parseBool(element.dataset.testSelector?.contains('notice'))),
                                    };

                                    Object.defineProperties(results, {
                                        deleted: {
                                            get:(async function() {
                                                return Promise.race([this, wait(100).then(() => null)]).then(self => {
                                                    return (self == null) || nullish(self?.parentElement) || $.defined('[data-a-target*="delete"i]:not([class*="spam-filter"i], [data-repetitive], [data-plagiarism])', self);
                                                });
                                            }).bind(element)
                                        },
                                    });

                                    Chat.__allmessages__.set(uuid, results);

                                    for(const [name, callback] of Chat.__onmessage__)
                                        callback(results);

                                    for(const [name, callback] of Chat.__deferredEvents__.__onmessage__)
                                        when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                    for(const [name, callback] of Chat.__consumableEvents__.__onmessage__) {
                                        when(() => PAGE_IS_READY, 250).then(() =>
                                            callback(results).then(complete => {
                                                if(complete)
                                                    Chat.__consumableEvents__.__onmessage__.delete(name);
                                            })
                                        );
                                    }
                                } break; // switch command.command | 'PRIVMSG'

                                // Got a whisper
                                case 'WHISPER': {
                                    const results = { unread: 1, from: channel, message: parameters, timestamp: new Date };

                                    for(const [name, callback] of Chat.__onwhisper__)
                                        callback(results);

                                    for(const [name, callback] of Chat.__deferredEvents__.__onwhisper__)
                                        when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                    for(const [name, callback] of Chat.__consumableEvents__.__onwhisper__) {
                                        when(() => PAGE_IS_READY, 250).then(() =>
                                            callback(results).then(complete => {
                                                if(complete)
                                                    Chat.__consumableEvents__.__onwhisper__.delete(name);
                                            })
                                        );
                                    }
                                } break;

                                default: { continue }
                            } // switch command.command
                            ;
                        }
                    };
                };

                socket.onerror = event => {
                    $warn(`Chat Relay (child) failed to connect to "${ CHANNEL }" → ${ JSON.stringify(event) }`);

                    socket = (TTV_IRC.sockets[CHANNEL] = new WebSocket(TTV_IRC.wsURL_chat));
                    START_WS(event);
                };

                socket.onclose = event => {
                    $warn(`Chat Relay (child) closed unexpectedly → ${ JSON.stringify(event) }`);

                    socket = (TTV_IRC.sockets[CHANNEL] = new WebSocket(TTV_IRC.wsURL_chat));
                    START_WS(event);
                };

                // The socket closed...
                when(() => TTV_IRC.sockets[CHANNEL]?.readyState === WebSocket.CLOSED, 1000)
                    .then(closed => {
                        $warn(`The WebSocket closed... Restarting in 5s...`);

                        wait(5000)
                            .then(() => {
                                if(parseBool(Settings.recover_chat))
                                    return location.reload();
                                return TTV_IRC.sockets[CHANNEL] = new WebSocket(TTV_IRC.wsURL_chat);
                            })
                            .then(() => {
                                when(() => TTV_IRC.sockets[CHANNEL].readyState === WebSocket.OPEN, 500)
                                    .then(() => TTV_IRC.sockets[CHANNEL].send(`JOIN ${ CHANNEL }`))
                                    .then(() => TTV_IRC.sockets[CHANNEL].onmessage = TTV_IRC.sockets[CHANNEL].reflect = CHAT_SELF_REFLECTOR);
                            });
                    });

                // Play catch-up...
                when.defined(() => $('[data-test-selector$="message-container"i]'), 100)
                    .then(chat => {
                        const unhandled = $.all('[data-a-target="chat-line-message"i]:not([data-uuid])', chat);

                        for(const element of unhandled) {
                            let raw = $('[class*="message"i][class*="container"i]', element).textContent.trim().replace($('[data-a-target="chat-timestamp"]', element)?.textContent || '', '')
                                , uuid = UUID.from(raw).toString()
                                , reply = $('[class*="reply"i] button', element)
                                , style = $('[data-a-user]', element)?.getAttribute('style')?.trim()
                                , author = $('[data-a-user]', element).dataset.aUser
                                , emotes = new Set
                                , badges = new Set
                                , __bs__ = $.all('[class*="username"i][class*="container"i] [data-a-target*="badge"i] img', element).map(e => badges.add(e.alt.toLowerCase()))
                                , handle = $('[data-a-user]', element).textContent
                                , usable = false
                                , message = raw.replace(/^[^:]+?:/, '').trim()
                                , mentions = $.all('[data-a-target*="mention"i]', element).map(e => e.textContent)
                                , highlighted = parseBool(element.dataset.testSelector?.contains('notice'));

                            element.dataset.uuid = uuid;

                            emotes = [...emotes];
                            badges = [...badges];

                            const results = {
                                raw,
                                uuid,
                                reply,
                                style,
                                author,
                                emotes,
                                badges,
                                handle,
                                usable,
                                element,
                                message,
                                mentions,
                                highlighted,
                                deleted: $.defined('[data-a-target*="delete"i]', element),
                            };

                            Chat.__allmessages__.set(uuid, results);

                            for(const [name, callback] of Chat.__onmessage__)
                                when(() => PAGE_IS_READY, 250).then(() => callback(results));

                            for(const [name, callback] of Chat.__deferredEvents__.__onmessage__)
                                when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                            for(const [name, callback] of Chat.__consumableEvents__.__onmessage__) {
                                when(() => PAGE_IS_READY, 250).then(() =>
                                    callback(results).then(complete => {
                                        if(complete)
                                            Chat.__consumableEvents__.__onmessage__.delete(name);
                                    })
                                );
                            }
                        }
                    });
            } // :ChatObserver

            // Override variables
            Overrides: {
                window.ALLOWED_JOBS ??= (parseURL(location).searchParameters?.allow || '').split(',');

                // Registers a job
                    // @override RegisterJob(JobName:string) → Number<IntervalID>
                window.RegisterJob = function RegisterJob(JobName, JobReason = 'default') {
                    RegisterJob.__reason__ = JobReason;

                    // Prevent disallowed jobs...
                    if(ALLOWED_JOBS.length) {
                        // @performance
                        // Constaly clear the chat...
                        if(ALLOWED_JOBS.missing((v, i, a) => v.includes('chat')))
                            setInterval(() => {
                                for(const key in Chat)
                                    Chat[key].clear?.();
                            }, 15_000);

                        if(ALLOWED_JOBS.missing(JobName))
                            return;
                    }

                    return Jobs[JobName] ??= Timers[JobName] > 0
                        ? setInterval(Handlers[JobName], Timers[JobName])
                        : -setTimeout(Handlers[JobName], -Timers[JobName]);
                };
            }
        }

        top.onlocationchange = () => {
            $warn("[Child] Re-initializing...");

            // Do NOT soft-reset ("turn off, turn on") these settings
            // They will be destroyed, including any data they are using
            const VOLATILE = top?.VOLATILE ?? [].map(AsteriskFn);

            DestroyingJobs:
            for(const job in Jobs)
                if(~VOLATILE.findIndex(name => name.test(job)))
                    continue DestroyingJobs;
                else
                    RestartJob(job, 'job-destruction:chat.js');

            Reinitialize:
            if(NORMAL_MODE) {
                if(parseBool(Settings.keep_popout)) {
                    Chat__PAGE_CHECKER ??= setInterval(Chat__WAIT_FOR_PAGE, 500);

                    break Reinitialize;
                }

                // Handled by parent controller
                // ReloadPage();
            }
        };

        // Add custom styling
        CustomCSSInitializer: {
            AddCustomCSSBlock('chat.js', `
                /* [data-a-page-loaded-name="PopoutChatPage"i] [class*="chat"i][class*="header"i] { display: none !important; } */

                #tt-auto-claim-bonuses .tt-z-above { display: none }
                :is([data-plagiarism], [data-repetitive]):not([data-resurrected]) { display: none }
                #tt-hidden-emote-container::after {
                    content: 'Collecting emotes...\\A Do not close this window';
                    text-align: center;
                    white-space: break-spaces;

                    --background: #000e;
                    --text-align: center;

                    position: absolute;
                    --padding-top: 100%;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);

                    --height: 100%;
                    --width: 100%;
                }
                #tt-hidden-emote-container .simplebar-scroll-content { visibility: hidden }

                section[data-test-selector^="chat"i] :is([tt-hidden-message="true"i], [tt-hidden-bulletin="true"i]) { display: none }

                [class*="theme"i][class*="dark"i] [tt-light], [class*="theme"i][class*="dark"i] [class*="chat"i][class*="status"i] { background-color: var(--color-opac-w-4) !important }
                [class*="theme"i][class*="light"i] [tt-light], [class*="theme"i][class*="light"i] [class*="chat"i][class*="status"i] { background-color: var(--color-opac-b-4) !important }

                .chat-line__message[style] a {
                    color: var(--color-text-alt);
                    text-decoration: underline;
                }

                .tt-emote-captured [data-test-selector="badge-button-icon"i],
                .tt-emote-bttv [data-test-selector="badge-button-icon"i] {
                    left: 0;
                    top: 0;
                }
            `);
        }

        // Update the settings
        SettingsInitializer: {
            switch(Settings.onInstalledReason) {
                // Is this the first time the extension has run?
                // If so, then point out what's been changed
                case INSTALL: {
                    // Alert something for the chats...
                } break;
            }

            Settings.set({ onInstalledReason: null });
        }

        // Handle pinned messages...
        Pinned: {
            /**
             * Processes a pinned message, extracts its metadata, and notifies registered event listeners.
             * @param {Element} header - The pinned message header element
             */
            const PinnedMessageHandler = header => {
                const toggle = $('button', header.closest('[class*="pinned"i][class*="chat"i][class*="area"i]'))
                    , collapsed = defined(toggle?.closest('[class*="highlight"i][class*="collapsed"i]'));

                if(collapsed)
                    toggle.click();

                let element = header.closest('[class*="chat"][class*="content"i] > div:not([class])')
                    , message = $('[class*="pinned"i][class*="message"i]', element)
                    , handle = $('.chatter-name', element)
                    , badges = $.all('.chat-badge', element).map(img => img.alt).isolate()
                    , emotes = $.all('.chat-image', message).map(img => img.alt).isolate()
                    , author = handle?.textContent ?? 'Anonymous';

                if(nullish(header) || nullish(message)) {
                    if(collapsed)
                        toggle.click();
                    return;
                }

                header = header.textContent;
                message = message.textContent;

                const mentions = message.split(/(@\S+)/).filter(s => s.startsWith('@')).map(s => s.slice(1).toLowerCase())
                    , style = $('[style]', handle)?.getAttribute('style') ?? ''
                    , { hour, minute, meridiem } = (/(?<![#\$\.+:\d%‰]|\p{Sc})\b(?<hour>2[0-3]|[01]?\d)(?<minute>:[0-5]\d)?(?!\d*(?:\p{Sc}|[%‰]))[ \t]*(?<meridiem>[ap]m?(?!\p{L}|\p{N}))/iu.exec(handle?.parentElement?.textContent ?? '12:00AM')?.groups ?? {})
                    , sent = new Date([(new Date).toLocaleDateString(), ' ', +hour + 12 * meridiem?.[0]?.equals('P'), minute, ':00'].join('')).toJSON();

                if(nullish(hour) && nullish(minute) && nullish(meridiem))
                    return;

                handle = author.replace(/([^]*)\((.+)\)[^]*/, ($0, $1, $2 = '', $$, $_) => {
                    author = $2 || $1;

                    return $1;
                });

                const raw = `${ header } → ${ [(handle.unlike(author) ? `${ handle } (${ author })` : handle), message].join(': ') }`
                    , uuid = UUID.from([sent, message, author].join('@')).toString();

                const results = {
                    raw,
                    sent,
                    uuid,
                    style,
                    author,
                    emotes,
                    badges,
                    handle,
                    element,
                    message,
                    mentions,
                };

                if(collapsed)
                    toggle.click();

                Chat.__allpinned__.set(uuid, results);

                for(const [name, callback] of Chat.__onpinned__)
                    when(() => PAGE_IS_READY, 250).then(() => callback(results));

                for(const [name, callback] of Chat.__deferredEvents__.__onpinned__)
                    when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                for(const [name, callback] of Chat.__consumableEvents__.__onpinned__) {
                    when(() => PAGE_IS_READY, 250).then(() =>
                        callback(results).then(complete => {
                            if(complete)
                                Chat.__consumableEvents__.__onpinned__.delete(name);
                        })
                    );
                }

                when(() => $.nullish('[class*="pinned"i][class*="by"i]'))
                    .then(() => when.defined(() => $('[class*="pinned"i][class*="by"i]')).then(PinnedMessageHandler));
            };

            // FIX-ME: it's the time the page waits (5s) + time the function starts (2.5s)
            when.defined(() => $('[class*="pinned"i][class*="by"i]'), 8_000).then(PinnedMessageHandler);
        } // :Pinned

        done = true;
    } finally {
        if(done) {
            clearInterval(Chat__PAGE_CHECKER);
            Chat__PAGE_CHECKER = void null;
            $log("[Chat] Page-Checker interval cleared");
        }
    }
}, 500);

Chat__SETTING_RELOADER = setInterval(() => {
    for(let MAX_CALLS = 60; MAX_CALLS > 0 && top.REFRESH_ON_CHILD?.length; --MAX_CALLS)
        RestartJob(top.REFRESH_ON_CHILD.pop(), 'chat-setting-reloader:max-calls');
}, 250);
