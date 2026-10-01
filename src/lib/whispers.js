/*** /lib/whispers.js
 * Whisper relay. Twitch no longer sends `WHISPER` over IRC; whispers arrive on its Hermes socket as
 * the PubSub topic `whispers.<viewer id>`. This opens the extension's own Hermes connection with the
 * same cookie token the IRC relay uses (no new permission, nothing injected into the page) and
 * feeds `Chat.onwhisper` listeners.
 */

const HERMES_URL = 'wss://hermes.twitch.tv/v1?clientId=kimne78kx3ncx6brgo4mv6wki5h1ko';

/**
 * Reads a Hermes frame and returns the whisper it carries, if any.
 * @param {string} data - The raw frame
 * @returns {?{ id: string, unread: number, from: string, message: string, timestamp: Date }}
 */
export function parseHermesWhisper(data) {
    let frame, payload;

    try {
        frame = JSON.parse(data);

        if(frame?.type != 'notification')
            return null;

        payload = JSON.parse(frame.notification?.pubsub ?? '{}');
    } catch(error) {
        return null;
    }

    const whisper = payload?.data_object;

    if(payload?.type != 'whisper_received' || !whisper?.tags?.login)
        return null;

    return {
        id: String(whisper.message_id ?? ''),
        unread: 1,
        from: String(whisper.tags.login),
        message: String(whisper.body ?? ''),
        timestamp: new Date(Number(whisper.sent_ts) * 1000 || Date.now()),
    };
}

/**
 * Calls every `Chat.onwhisper` listener (plain, deferred and consumable) with a whisper.
 * @param {Object} whisper - `{ unread, from, message, timestamp }`
 */
export function dispatchWhisper(whisper) {
    for(const [, callback] of Chat.__onwhisper__)
        when(() => PAGE_IS_READY, 250).then(() => callback(whisper));

    // A whisper has no chat element to wait for, so deferred listeners only wait for the page
    for(const [, callback] of Chat.__deferredEvents__.__onwhisper__)
        when(() => PAGE_IS_READY, 250).then(() => callback(whisper));

    for(const [name, callback] of Chat.__consumableEvents__.__onwhisper__)
        when(() => PAGE_IS_READY, 250).then(() =>
            callback(whisper).then(complete => {
                if(complete)
                    Chat.__consumableEvents__.__onwhisper__.delete(name);
            })
        );
}

/**
 * Starts the relay once per page. Gives up quietly without a signed-in viewer or when Hermes
 * refuses the token; reconnects when the socket drops or Hermes asks it to move.
 * @param {Object} [cookies] - `Search.cookies`
 */
export function startWhisperRelay(cookies = Search.cookies) {
    const token = cookies?.auth_token, id = cookies?.twilight_user?.id;

    if(!token || !id || startWhisperRelay.socket)
        return;

    const seen = new Set;
    let url = HERMES_URL, refused = false, retries = 0;

    const connect = () => {
        const socket = startWhisperRelay.socket = new WebSocket(url);
        const stamp = () => new Date().toISOString();

        socket.onopen = () => {
            retries = 0;
            socket.send(JSON.stringify({ id: 'tt-auth', type: 'authenticate', authenticate: { token }, timestamp: stamp() }));
            socket.send(JSON.stringify({ id: 'tt-sub', type: 'subscribe', subscribe: { id: 'tt-whispers', type: 'pubsub', pubsub: { topic: `whispers.${ id }` } }, timestamp: stamp() }));
        };

        socket.onmessage = ({ data }) => {
            let frame;

            try { frame = JSON.parse(data) } catch(error) { return }

            switch(frame?.type) {
                case 'authenticateResponse':
                case 'subscribeResponse': {
                    if(frame[frame.type]?.result != 'ok') {
                        refused = true;
                        $warn(`Whisper relay: Hermes refused (${ frame[frame.type]?.error ?? frame[frame.type]?.result })`);
                        socket.close();
                    }
                } break;

                case 'reconnect': {
                    url = frame.reconnect?.url ?? url;
                    socket.close();
                } break;

                case 'notification': {
                    const whisper = parseHermesWhisper(data);

                    // The page's sockets may deliver the same whisper; ours is read once per message id
                    if(!whisper || seen.has(whisper.id))
                        return;

                    seen.add(whisper.id);

                    if(seen.size > 200)
                        seen.delete(seen.values().next().value);

                    dispatchWhisper(whisper);
                } break;
            }
        };

        socket.onclose = () => {
            if(refused)
                return void (startWhisperRelay.socket = null);

            setTimeout(connect, Math.min(5_000 * 2 ** retries++, 300_000));
        };
    };

    connect();
}
