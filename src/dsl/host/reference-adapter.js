/*** /dsl/host/reference-adapter.js
 * Reference TTV DSL host adapter: wires `Chat`, `STREAMER` and `USERNAME` into a DSL runtime.
 *
 * A working model of `host-contract.md`, and the adapter `host-conformance.test.js` checks
 * itself against. The extension's own adapter may differ in how it is wired, but not in what
 * a script can observe.
 */

'use strict';

/** Where a URL starts in chat text. */
const URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+/gi;

/** A chat command: `!name` then, optionally, the rest of the line. */
const COMMAND_PATTERN = /^!([^\s!]+)(?:\s+([\s\S]*))?$/;

/** Every channel property a script can read as `#prop`, and where it comes from on `STREAMER`. */
const CHANNEL_FIELDS = Object.freeze({
    name: 'name',
    id: 'sole',
    live: 'live',
    title: "desc",
    game: 'game',
    viewers: 'poll',
    uptime: 'time',
    points: 'coin',
    subscribed: 'paid',
    following: 'like',
    rerun: 'redo',
    tags: 'tags',
});

/**
 * Turns a `Chat.onmessage` message object into a DSL event.
 * Only plain, serializable values cross over: no DOM elements, no Promises.
 * @param {object} message - The `Chat.onmessage` message object
 * @returns {object} The event for `runtime.dispatch`
 */
function toMessageEvent(message) {
    const text = String(message.message ?? '')
        , event = {
            kind: 'message',
            id: String(message.uuid ?? ''),
            sender: String(message.author ?? '').toLowerCase(),
            display: String(message.handle ?? message.author ?? ''),
            message: text,
            mentions: [...(message.mentions ?? [])].map(name => String(name).toLowerCase()),
            badges: Object.keys(message.badges ?? {}),
            emotes: [...(message.emotes ?? [])].map(emote => String(emote?.name ?? emote)),
            links: [...text.matchAll(URL_PATTERN)].map(([href]) => ({ href, text: href })),
            timestamp: Number(message.timestamp ?? Date.now()),
        }
        , command = COMMAND_PATTERN.exec(text.trim());

    if(command) {
        event.kind = 'command';
        event.command = command[1].toLowerCase();
        event.argument = (command[2] ?? '').trim();
    }

    return event;
}

/**
 * Turns a `Chat.onwhisper` object into a DSL event.
 * @param {object} whisper - The `Chat.onwhisper` object
 * @returns {object} The event for `runtime.dispatch`
 */
function toWhisperEvent(whisper) {
    return {
        kind: 'whisper',
        sender: String(whisper.from ?? '').toLowerCase(),
        message: String(whisper.message ?? ''),
        timestamp: Number(whisper.timestamp ?? Date.now()),
    };
}

/**
 * Builds the adapter.
 * @param {object} env - The extension facilities the adapter may use
 * @param {object} env.Chat - The `Chat` API
 * @param {object} env.STREAMER - The channel getters
 * @param {string} env.USERNAME - The signed-in user's login
 * @param {object} [env.clock] - `{ now, setTimeout, clearTimeout }`; real timers when omitted
 * @param {function} [env.random] - `[0, 1)`; `Math.random` when omitted
 * @param {object} [env.logger] - `{ log, warn, error }`
 * @param {object} [env.page] - Optional `{ root }`: the element `&html.*` reads are confined to
 * @returns {{ options: object, attach: function }} `createRuntime` options, and `attach(runtime)`
 */
function createReferenceAdapter(env) {
    const { Chat, STREAMER, USERNAME } = env
        , handlerName = `TTV_DSL_${ Math.random().toString(36).slice(2) }`;

    /** The current channel. One object whose every property is a getter over `STREAMER`: a
     * script holds on to it for hours (`run` receives it once), so a copy would go stale. */
    const channel = {};

    for(const [field, source] of Object.entries(CHANNEL_FIELDS))
        Object.defineProperty(channel, field, {
            enumerable: true,
            get: () => field == 'name'
                ? String(STREAMER[source] ?? '').toLowerCase()
                : field == 'live'
                    ? !!STREAMER[source]
                    : STREAMER[source],
        });

    Object.freeze(channel);

    const currentChannel = () => channel;

    const realm = {
        name: 'TWITCH',

        get current() {
            return currentChannel();
        },

        channel(name) {
            const current = currentChannel();

            return String(name).toLowerCase() == current.name ? current : null;
        },

        subject(path) {
            return this.channel(path);
        },

        badge(name, holder) {
            return (holder?.badges ?? []).includes(name) ? name : null;
        },

        user(name) {
            return { name: String(name).toLowerCase() };
        },

        goto(target) {
            const name = typeof target == 'string' ? target : target?.name;

            if(name)
                env.goto?.(String(name).toLowerCase());
        },
    };

    /** Refuses to post into a channel the socket is not in. */
    const inCurrentChannel = (context) => {
        const name = context.channel?.name;

        return nullish(name) || String(name).toLowerCase() == currentChannel().name;
    };

    const verbs = {
        POST(context, value) {
            const text = value == null ? '' : String(value);

            if(/^\s*$/.test(text) || !inCurrentChannel(context))
                return false;

            Chat.send(text);

            return true;
        },

        REPLY(context, value) {
            const text = value == null ? '' : String(value)
                , id = context.subject?.id;

            if(/^\s*$/.test(text) || !inCurrentChannel(context))
                return false;

            // No message to thread under (a timer, a whisper): a plain post is the honest fallback.
            if(!id) {
                Chat.send(text);

                return true;
            }

            Chat.reply(id, text);

            return true;
        },
    };

    const datetime = {
        now: () => Date.now(),
        time: () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };

    return {
        options: {
            realms: { TWITCH: realm },
            verbs,
            constants: { USERNAME: String(USERNAME ?? '').toLowerCase() },
            jsBindings: { datetime },
            jsPermissions: {
                'datetime.now': 'read:datetime',
                'datetime.time': 'read:datetime',
            },
            ...(env.clock ? { clock: env.clock } : {}),
            ...(env.random ? { random: env.random } : {}),
            ...(env.logger ? { logger: env.logger } : {}),
        },

        /**
         * Starts feeding chat into a runtime.
         * @param {object} runtime - From `createRuntime(options)`
         * @returns {function} Detach: removes every hook this call added
         */
        attach(runtime) {
            const onMessage = { [handlerName](message) {
                return runtime.dispatch(toMessageEvent(message));
            } }[handlerName];

            const onWhisper = { [`${ handlerName }_whisper`](whisper) {
                return runtime.dispatch(toWhisperEvent(whisper));
            } }[`${ handlerName }_whisper`];

            Chat.onmessage = onMessage;
            Chat.onwhisper = onWhisper;

            return () => {
                // `Chat` keys hooks by function name and has no removal API; delete by that key.
                Chat.__onmessage__?.delete(onMessage.name);
                Chat.__onwhisper__?.delete(onWhisper.name);
            };
        },
    };
}

/**
 * `x == null`, as the project helper spells it.
 * @param {*} value
 * @returns {boolean}
 */
function nullish(value) {
    return value == null;
}

module.exports = { createReferenceAdapter, toMessageEvent, toWhisperEvent, CHANNEL_FIELDS };
