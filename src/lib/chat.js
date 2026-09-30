/*** /lib/chat.js
 * Chat messages and chat event hooks.
 * Moved verbatim from tools.js in Phase 3; see src/lib/index.js for how it reaches the page.
 */

import { createSendPacer } from './send-pacer.js';

// One queue for sends and replies, so a script's burst can't get dropped or the viewer muted
const PACER = createSendPacer({
    limit: () => (Chat.viewerBadges ?? []).some(badge => /^(broadcaster|moderator|vip)$/.test(badge)) ? 100 : 20,
});

function Chat(message = '', ...mentions) {
    if(!message.length)
        return Chat.get();

    const finalMsg = [message.trim()];

    for(const mention of [mentions].flat())
        finalMsg.push(mention.replace(/^(?!@)/, '@'));

    return Chat.send(finalMsg.join(' '));
}

Object.defineProperties(Chat, {
    element: { get() { return $('[data-test-selector$="message-container"i]').closest('section') } },

    badges: {
        get() {
            const badges = (null
                ?? JUMP_DATA?.[STREAMER.name.toLowerCase()]?.stream?.badges
                ?? {}
            );

            return {
                ...badges,

                get(type) {
                    return ({
                        everyone: 'https://static-cdn.jtvnw.net/user-default-pictures-uv/215b7342-def9-11e9-9a66-784f43822e80-profile_image-70x70.png',
                        subscriber: ((STREAMER.jump[STREAMER.name.toLowerCase()]?.stream?.badges?.[`${ STREAMER.sole }_subscriber_0`]?.href) || 'https://static-cdn.jtvnw.net/user-default-pictures-uv/215b7342-def9-11e9-9a66-784f43822e80-profile_image-70x70.png'),
                        regular: 'https://static-cdn.jtvnw.net/user-default-pictures-uv/215b7342-def9-11e9-9a66-784f43822e80-profile_image-70x70.png',
                        twitch_vip: 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3',
                        vip: 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3',
                        moderator: 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3',
                        mod: 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3',
                        admin: 'https://static-cdn.jtvnw.net/badges/v1/d97c37bd-a6f5-4c38-8f57-4e4bef88af34/3',
                        owner: 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/3',
                    }[(type ?? 'everyone').toString().toLowerCase()]);
                },
            };
        },
    },

    gang: { value: [] },
    mods: { value: [] },
    vips: { value: [] },

    get: {
        // Create an array of the current chat
            // Chat.get(mostRecent:number?, keepEmotes:boolean?) → [...object<{ style<string{ CSS }>, author<string>, emotes<array{ string }>, message<string>, mentions<array{ string }>, element?<Element>, uuid<string>, reply?<Element>, deleted?<boolean>, highlighted?<boolean> }>]
        value:
        function get(mostRecent = 250, keepEmotes = true) {
            const results = [];

            for(const [uuid, object] of [...Chat.__allmessages__].slice(-mostRecent)) {
                let { message, emotes } = object;

                if(!keepEmotes)
                    for(const emote of emotes)
                        message = message.replaceAll(emote, '');

                const O = Object.assign({}, object, { message });

                Object.defineProperties(O, {
                    deleted: {
                        get:(async function() {
                            return Promise.race([this, wait(100).then(() => null)]).then(self => {
                                return (self === null) || nullish(self?.parentElement) || $.defined('[data-a-target*="delete"i]:not([class*="spam-filter"i], [data-repetitive], [data-plagiarism])', self);
                            });
                        }).bind(object.element)
                    },
                });

                results.push(O);
            }

            return results;
        }
    },

    send: {
        // Sends a message via the current chat
            // Chat.send(message:string?) → undefined
        value:
        function send(message = '') {
            if(typeof message != 'string')
                return;

            when(() => TTV_IRC.socket.readyState === WebSocket.OPEN)
                .then(ready => PACER.push(() => {
                    TTV_IRC.socket.send(`PRIVMSG #${ STREAMER.name.toLowerCase() } :${ message }`);
                }));
        }
    },

    reply: {
        // Replies to a message via the current chat
            // Chat.send(to:string<IRC-Msg-Id>, message:string?) → undefined
        value:
        function reply(to = '', message = '') {
            if(typeof to != 'string' || to.length < 1 || typeof message != 'string' || message.length < 1)
                return;

            when(() => TTV_IRC.socket.readyState === WebSocket.OPEN)
                .then(ready => PACER.push(() => {
                    TTV_IRC.socket.send(`@reply-parent-msg-id=${ to } PRIVMSG #${ STREAMER.name.toLowerCase() } :${ message }`);
                }));
        }
    },

    // Deferred listener for new chat messages
    defer: {
        value: {
            set onmessage(callback) {
                const name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__deferredEvents__.__onmessage__.has(name))
                    return Chat.__deferredEvents__.__onmessage__.get(name);

                // $remark('Adding deferred [on new message] event listener', { [name]: callback });

                Chat.__deferredEvents__.__onmessage__.set(name, callback);

                return callback;
            },

            get onmessage() {
                return Chat.__deferredEvents__.__onmessage__.size;
            },

            set onpinned(callback) {
                const name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__deferredEvents__.__onpinned__.has(name))
                    return Chat.__deferredEvents__.__onpinned__.get(name);

                // $remark('Adding deferred [on new pinned] event listener', { [name]: callback });

                Chat.__deferredEvents__.__onpinned__.set(name, callback);

                return callback;
            },

            get onpinned() {
                return Chat.__deferredEvents__.__onpinned__.size;
            },

            set onwhisper(callback) {
                const name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__deferredEvents__.__onwhisper__.has(name))
                    return Chat.__deferredEvents__.__onwhisper__.get(name);

                // $remark('Adding deferred [on new whisper] event listener', { [name]: callback });

                return Chat.__deferredEvents__.__onwhisper__.set(name, callback);
            },

            get onwhisper() {
                return Chat.__deferredEvents__.__onwhisper__.size;
            },

            set onbullet(callback) {
                const name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__deferredEvents__.__onbullet__.has(name))
                    return Chat.__deferredEvents__.__onbullet__.get(name);

                // $remark('Adding deferred [on new newbullet] event listener', { [name]: callback });

                return Chat.__deferredEvents__.__onbullet__.set(name, callback);
            },

            get onbullet() {
                return Chat.__deferredEvents__.__onbullet__.size;
            },

            set oncommand(callback) {
                const name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__deferredEvents__.__oncommand__.has(name))
                    return Chat.__deferredEvents__.__oncommand__.get(name);

                // $remark('Adding deferred [on new command] event listener', { [name]: callback });

                return Chat.__deferredEvents__.__oncommand__.set(name, callback);
            },

            get oncommand() {
                return Chat.__deferredEvents__.__oncommand__.size;
            },
        },
    },
    __deferredEvents__: { value: { __onmessage__: new Map, __onpinned__: new Map, __onwhisper__: new Map, __onbullet__: new Map, __oncommand__: new Map } },

    // Single-use events... Requires the callback (promise) to return a boolean: true = ok to consume (delete) event; false = not ok
    consume: {
        value: {
            set onmessage(callback) {
                const name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__consumableEvents__.__onmessage__.has(name))
                    return Chat.__consumableEvents__.__onmessage__.get(name);

                // $remark('Adding consumable [on new message] event listener', { [name]: callback });

                Chat.__consumableEvents__.__onmessage__.set(name, callback);

                return callback;
            },

            get onmessage() {
                return Chat.__consumableEvents__.__onmessage__.size;
            },

            set onpinned(callback) {
                const name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__consumableEvents__.__onpinned__.has(name))
                    return Chat.__consumableEvents__.__onpinned__.get(name);

                // $remark('Adding consumable [on new pinned] event listener', { [name]: callback });

                Chat.__consumableEvents__.__onpinned__.set(name, callback);

                return callback;
            },

            get onpinned() {
                return Chat.__consumableEvents__.__onpinned__.size;
            },

            set onwhisper(callback) {
                const name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__consumableEvents__.__onwhisper__.has(name))
                    return Chat.__consumableEvents__.__onwhisper__.get(name);

                // $remark('Adding consumable [on new whisper] event listener', { [name]: callback });

                return Chat.__consumableEvents__.__onwhisper__.set(name, callback);
            },

            get onwhisper() {
                return Chat.__consumableEvents__.__onwhisper__.size;
            },

            set onbullet(callback) {
                const name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__consumableEvents__.__onbullet__.has(name))
                    return Chat.__consumableEvents__.__onbullet__.get(name);

                // $remark('Adding consumable [on new newbullet] event listener', { [name]: callback });

                return Chat.__consumableEvents__.__onbullet__.set(name, callback);
            },

            get onbullet() {
                return Chat.__consumableEvents__.__onbullet__.size;
            },

            set oncommand(callback) {
                const name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__consumableEvents__.__oncommand__.has(name))
                    return Chat.__consumableEvents__.__oncommand__.get(name);

                // $remark('Adding consumable [on new command] event listener', { [name]: callback });

                return Chat.__consumableEvents__.__oncommand__.set(name, callback);
            },

            get oncommand() {
                return Chat.__consumableEvents__.__oncommand__.size;
            },
        },
    },
    __consumableEvents__: { value: { __onmessage__: new Map, __onpinned__: new Map, __onwhisper__: new Map, __onbullet__: new Map, __oncommand__: new Map } },

    // Regular events...
    onmessage: {
        set(callback) {
            const name = callback.name || UUID.from(callback.toString()).value;

            if(Chat.__onmessage__.has(name))
                return Chat.__onmessage__.get(name);

            // $remark('Adding [on new message] event listener', { [name]: callback });

            Chat.__onmessage__.set(name, callback);

            return callback;
        },

        get() {
            return Chat.__onmessage__.size;
        },
    },
    __onmessage__: { value: new Map },

    onpinned: {
        set(callback) {
            const name = callback.name || UUID.from(callback.toString()).value;

            if(Chat.__onpinned__.has(name))
                return Chat.__onpinned__.get(name);

            // $remark('Adding [on new pinned] event listener', { [name]: callback });

            Chat.__onpinned__.set(name, callback);

            return callback;
        },

        get() {
            return Chat.__onpinned__.size;
        },
    },
    __onpinned__: { value: new Map },

    onwhisper: {
        set(callback) {
            const name = callback.name || UUID.from(callback.toString()).value;

            if(Chat.__onwhisper__.has(name))
                return Chat.__onwhisper__.get(name);

            // $remark('Adding [on new whisper] event listener', { [name]: callback });

            return Chat.__onwhisper__.set(name, callback);
        },

        get() {
            return Chat.__onwhisper__.size;
        },
    },
    __onwhisper__: { value: new Map },

    onbullet: {
        set(callback) {
            const name = callback.name || UUID.from(callback.toString()).value;

            if(Chat.__onbullet__.has(name))
                return Chat.__onbullet__.get(name);

            // $remark('Adding [on new bullet] event listener', { [name]: callback });

            return Chat.__onbullet__.set(name, callback);
        },

        get() {
            return Chat.__onbullet__.size;
        },
    },
    __onbullet__: { value: new Map },

    oncommand: {
        set(callback) {
            const name = callback.name || UUID.from(callback.toString()).value;

            if(Chat.__oncommand__.has(name))
                return Chat.__oncommand__.get(name);

            // $remark('Adding [on new command] event listener', { [name]: callback });

            return Chat.__oncommand__.set(name, callback);
        },

        get() {
            return Chat.__oncommand__.size;
        },
    },
    __oncommand__: { value: new Map },

    // Everything gathered...
    __allmessages__: { value: new Map },
    __allbullets__: { value: new Set },
    __allemotes__: { value: new Map },
    __allpinned__: { value: new Map },

    messages: {
        get() { return Chat.__allmessages__ },
        set(value) { return Chat.__allmessages__ },
    },

    bullets: {
        get() { return Chat.__allbullets__ },
        set(value) { return Chat.__allbullets__ },
    },

    emotes: {
        get() { return Chat.__allemotes__ },
        set(value) { return Chat.__allemotes__ },
    },

    pinned: {
        get() { return Chat.__allpinned__ },
        set(value) { return Chat.__allpinned__ },
    },

    // Chat restrictions
    restrictions: {
        set(value) {},

        get() {
            return TTV_IRC.restrictions.get(`#${ STREAMER.name.toLowerCase() }`) || ($('[class*="chat-restriction"i]')?.parentElement?.nextElementSibling?.textContent || '');
        },
    },
});

export { Chat };
