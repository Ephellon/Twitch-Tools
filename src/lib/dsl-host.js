/*** /lib/dsl-host.js
 * The TTV DSL host adapter: wires the extension's `Chat`, `STREAMER` and `USERNAME` into a DSL runtime.
 * Implements docs/DSL-HOST.md; `src/dsl/host/host-conformance.test.js` checks it (npm test).
 */

/** Where a URL starts in chat text. */
const URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+/gi;

/** A chat command: `!name` then, optionally, the rest of the line. */
const COMMAND_PATTERN = /^!([^\s!]+)(?:\s+([\s\S]*))?$/;

/** Every channel property a script can read as `#prop`, and the `STREAMER` getter it comes from. */
export const CHANNEL_FIELDS = Object.freeze({
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
 * Turns a `Chat.onmessage` message into a DSL event: plain values only, no DOM nodes or Promises.
 * A message starting with `!` becomes a `command` event.
 * @param {Object} message - The `Chat.onmessage` message object
 * @returns {Object} The event for `runtime.dispatch`
 */
export function toMessageEvent(message) {
    const text = String(message.message ?? '')
        , event = {
            kind: 'message',
            id: String(message.uuid ?? ''),
            sender: String(message.author ?? '').toLowerCase(),
            display: String(message.handle ?? message.author ?? ''),
            message: text,
            mentions: [...(message.mentions ?? [])].map(name => String(name).toLowerCase()),
            // The relay gives badge names as a list (`['moderator']`); a `{ name: version }` map (IRC tags) is keyed by name
            badges: (Array.isArray(message.badges) ? message.badges : Object.keys(message.badges ?? {})).map(String),
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
 * Turns a `Chat.onwhisper` whisper into a DSL event.
 * @param {Object} whisper - The `Chat.onwhisper` object
 * @returns {Object} The event for `runtime.dispatch`
 */
export function toWhisperEvent(whisper) {
    return {
        kind: 'whisper',
        sender: String(whisper.from ?? '').toLowerCase(),
        message: String(whisper.message ?? ''),
        timestamp: Number(whisper.timestamp ?? Date.now()),
    };
}

/**
 * Turns a `Chat.onbullet` raid notice into a DSL event; other notices aren't events yet.
 * `raider_title` has no source (IRC doesn't carry it), so it is absent.
 * @param {Object} bullet - The `Chat.onbullet` object
 * @returns {Object|null} The event for `runtime.dispatch`, or `null`
 */
export function toRaidEvent(bullet) {
    if(bullet?.subject != 'raid' || !bullet.raider)
        return null;

    return {
        kind: 'raid',
        raider: String(bullet.raider).toLowerCase(),
        raid_size: Number(bullet.raid_size) | 0,
        timestamp: Number(bullet.timestamp ?? Date.now()),
    };
}

/**
 * Builds the adapter.
 * @param {Object} env - The extension facilities the adapter may use
 * @param {Object} env.Chat - The `Chat` API
 * @param {Object} env.STREAMER - The channel getters
 * @param {string} env.USERNAME - The signed-in viewer's login
 * @param {function} [env.goto] - Navigates to a channel name; omitted where navigating isn't allowed (pop-out chat)
 * @param {function} [env.viewerBadges] - The signed-in viewer's badges in this channel, or nothing when unknown
 * @param {Object} [env.clock] - `{ now, setTimeout, clearTimeout }`; real timers when omitted
 * @param {function} [env.random] - `[0, 1)`; `Math.random` when omitted
 * @param {Object} [env.logger] - `{ log, warn, error }`
 * @returns {{ options: Object, attach: function }} `createRuntime` options, and `attach(runtime)`
 */
export function createAdapter(env) {
    const { Chat, STREAMER, USERNAME } = env
        , hookName = `TTV_DSL_${ Math.random().toString(36).slice(2) }`;

    // One live object for the current channel: `run` receives it once and a script keeps it for hours
    const channel = {};

    for(const [field, source] of Object.entries(CHANNEL_FIELDS))
        Object.defineProperty(channel, field, {
            enumerable: true,
            get: () => field == 'name'
                ? String(STREAMER[source] ?? '').toLowerCase()
                : field == 'live'
                    ? !!STREAMER[source]
                    // `STREAMER.game` is a `String` object carrying an `href`, which a template would print instead
                    : (value => value instanceof String ? String(value) : value)(STREAMER[source]),
        });

    // The viewer's own badges, when the extension knows them (IRC USERSTATE)
    if(env.viewerBadges)
        Object.defineProperty(channel, 'badges', { enumerable: true, get: () => env.viewerBadges() ?? void null });

    Object.freeze(channel);

    const realm = {
        name: 'TWITCH',

        get current() {
            return channel;
        },

        channel(name) {
            return String(name).toLowerCase() == channel.name ? channel : null;
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

            if(!name)
                return;

            if(env.goto)
                env.goto(String(name).toLowerCase());
            else
                env.logger?.warn?.(`goto ${ name }: not available in this frame`);
        },
    };

    // Scripts only post into the channel the socket is in
    const inCurrentChannel = context => {
        const name = context.channel?.name;

        return name == null || String(name).toLowerCase() == channel.name;
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

            // Nothing to thread under (a timer, a whisper): post instead
            if(id)
                Chat.reply(id, text);
            else
                Chat.send(text);

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
         * @param {Object} runtime - From `TTV_DSL.createRuntime(options)`
         * @returns {function} Detach: removes every hook this call added
         */
        attach(runtime) {
            // `Chat` keys hooks by function name and has no removal API, so each hook gets a unique name
            const named = (suffix, callback) => Object.defineProperty(callback, 'name', { value: `${ hookName }_${ suffix }` });
            const onMessage = named('message', message => runtime.dispatch(toMessageEvent(message)));
            const onWhisper = named('whisper', whisper => runtime.dispatch(toWhisperEvent(whisper)));
            const onBullet = named('bullet', bullet => {
                const event = toRaidEvent(bullet);

                if(event)
                    runtime.dispatch(event);
            });

            Chat.onmessage = onMessage;
            Chat.onwhisper = onWhisper;
            Chat.onbullet = onBullet;

            return () => {
                Chat.__onmessage__?.delete(onMessage.name);
                Chat.__onwhisper__?.delete(onWhisper.name);
                Chat.__onbullet__?.delete(onBullet.name);
            };
        },
    };
}
