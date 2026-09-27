/*** /dsl/host/host-conformance.test.js
 * Conformance tests for a TTV DSL host adapter, per `host-contract.md`.
 *
 * `runConformance(createAdapter)` drives an adapter against a fake `Chat` and a fake `STREAMER`
 * that behave like `src/lib/chat.js` and the channel getters: hooks keyed by callback name,
 * `send`/`reply` fire-and-forget, `badges` as an object, live DOM and Promise fields on every
 * message. Run this file directly to check the reference adapter:
 *
 *     node host-conformance.test.js
 *
 * An adapter factory takes `{ Chat, STREAMER, USERNAME, clock, random, logger }` and returns
 * `{ options, attach }`: `createRuntime` options, and `attach(runtime)`, which starts feeding
 * chat into the runtime and returns a detach function.
 */

'use strict';

const CHANNEL = 'ginger_enby';

/**
 * Builds a fake `Chat` with the real API's shape.
 * @returns {function} `Chat`, plus `sent`, `replies` and `emit`/`whisper` for the tests
 */
function createFakeChat() {
    const Chat = (message = '', ...mentions) => Chat.send([message, ...mentions.map(name => `@${ name }`)].join(' '));

    Chat.sent = [];
    Chat.replies = [];

    Object.defineProperties(Chat, {
        __onmessage__: { value: new Map },
        __onwhisper__: { value: new Map },

        send: {
            value(message = '') {
                if(typeof message != 'string')
                    return;

                Chat.sent.push(message);
            },
        },

        reply: {
            value(to = '', message = '') {
                if(typeof to != 'string' || to.length < 1 || typeof message != 'string' || message.length < 1)
                    return;

                Chat.replies.push({ to, message });
            },
        },

        onmessage: {
            set(callback) {
                Chat.__onmessage__.set(callback.name, callback);
            },
            get() {
                return Chat.__onmessage__.size;
            },
        },

        onwhisper: {
            set(callback) {
                Chat.__onwhisper__.set(callback.name, callback);
            },
            get() {
                return Chat.__onwhisper__.size;
            },
        },
    });

    /** Delivers a chat message the way `chat.js` does, live fields included. */
    Chat.emit = async(fields) => {
        const message = {
            raw: '',
            sent: false,
            uuid: `msg-${ Chat.sent.length }-${ Math.random().toString(36).slice(2) }`,
            reply: Promise.resolve(null),
            style: '',
            author: 'zip',
            handle: 'Zip',
            emotes: [],
            badges: {},
            usable: true,
            element: Promise.resolve(null),
            message: "",
            mentions: [],
            timestamp: 0,
            highlighted: Promise.resolve(false),
            deleted: false,
            ...fields,
        };

        for(const callback of Chat.__onmessage__.values())
            await callback(message);

        return message;
    };

    /** Delivers a whisper. */
    Chat.whisper = async(fields) => {
        for(const callback of Chat.__onwhisper__.values())
            await callback({ unread: true, from: 'zip', message: "", timestamp: 0, ...fields });
    };

    return Chat;
}

/**
 * Builds a fake `STREAMER` with the getters the host reads.
 * @param {object} [overrides]
 * @returns {object}
 */
function createFakeStreamer(overrides = {}) {
    return {
        name: CHANNEL,
        sole: '12345',
        live: true,
        desc: 'Just chatting',
        game: 'Art',
        poll: 42,
        time: 3_600_000,
        coin: 900,
        fiat: 'Gems',
        paid: false,
        like: true,
        veto: false,
        redo: false,
        tags: ['English'],
        ...overrides,
    };
}

/**
 * Runs every conformance check against an adapter factory.
 * @param {function} createAdapter - `(env) => { options, attach }`
 * @param {object} [settings]
 * @param {object} [settings.dsl] - The `TTV_DSL` namespace; `require('../index.js')` when omitted
 * @param {function} [settings.report] - `(name, error?) => void`, called per check
 * @returns {Promise<{ passed: number, failed: number }>}
 */
async function runConformance(createAdapter, settings = {}) {
    const DSL = settings.dsl ?? globalThis.TTV_DSL ?? require(process.env.TTV_DSL_INDEX ?? '../index.js')
        , { createFakeClock, createSeededRandom } = DSL.runtime
        , report = settings.report ?? ((name, error) => console.log(error ? `  x ${ name }\n      ${ error.message }` : `  + ${ name }`))
        , checks = [];

    /** Registers one check. */
    const check = (name, body) => checks.push({ name, body });

    /** A fresh host: fake chat, fake channel, adapter, runtime, started script. */
    const host = async(source, { streamer, limits } = {}) => {
        const Chat = createFakeChat()
            , STREAMER = createFakeStreamer(streamer)
            , clock = createFakeClock(0)
            , failures = []
            , logger = { log() {}, warn() {}, error: (entry) => failures.push(String(entry)) }
            , adapter = createAdapter({ Chat, STREAMER, USERNAME: 'ephellon', clock, random: createSeededRandom(1), logger })
            , runtime = DSL.createRuntime({ ...adapter.options, ...(limits ? { limits } : {}) })
            , detach = adapter.attach(runtime)
            , context = await DSL.run(source, runtime, { channel: runtime.realm('TWITCH').current });

        return { Chat, STREAMER, clock, failures, runtime, detach, context };
    };

    const lines = (...rows) => `${ rows.join('\n') }\n`;

    const equal = (actual, expected, label = '') => {
        const a = JSON.stringify(actual)
            , b = JSON.stringify(expected);

        if(a !== b)
            throw new Error(`${ label }expected ${ b }, got ${ a }`);
    };

    const ok = (value, label) => {
        if(!value)
            throw new Error(label);
    };

    // -- options -------------------------------------------------------------

    check('options build a runtime with a TWITCH realm and USERNAME', async() => {
        const { runtime } = await host('');

        ok(runtime.hasRealm('TWITCH'), 'no TWITCH realm');
        equal(runtime.constants.USERNAME, 'ephellon', 'USERNAME: ');
    });

    check('every bound function is mapped to a listed permission', async() => {
        // `createRuntime` refuses otherwise; building one at all is the check.
        await host('');
    });

    // -- the realm -------------------------------------------------------------

    check('channel reads come live from STREAMER', async() => {
        const { Chat, STREAMER } = await host(lines(
            'await *',
            '    POST `${ #name } ${ #live } ${ #title } ${ #game } ${ #viewers } ${ #uptime as "h:mm" }`',
        ));

        await Chat.emit({ message: "hi" });
        STREAMER.live = false;
        STREAMER.poll = 7;
        await Chat.emit({ message: "again" });

        equal(Chat.sent, ['ginger_enby true Just chatting Art 42 1:00', 'ginger_enby false Just chatting Art 7 1:00']);
    });

    check('a channel other than the current one resolves to nothing', async() => {
        const { Chat } = await host(lines(
            'await *',
            '    using /someone_else',
            '        POST `leaked`',
            '    if /ginger_enby#live is true',
            '        POST `live`',
        ));

        await Chat.emit({ message: "hi" });

        equal(Chat.sent, ['live']);
    });

    // -- events ----------------------------------------------------------------

    check('a chat message becomes a plain event', async() => {
        const { Chat } = await host(lines(
            'await (.message is SOMETHING)',
            '    POST `${ .kind }|${ .sender }|${ .display }|${ .message }|${ .mentions % "," }|${ .badges % "," }|${ .emotes % "," }`',
            '    if .element is NOTHING and .reply is NOTHING and .highlighted is NOTHING',
            '        POST `no live fields`',
        ));

        await Chat.emit({
            author: 'Zip',
            handle: 'ZipZap',
            message: "hello @Ephellon Kappa",
            mentions: ['ephellon'],
            badges: { moderator: '1', subscriber: '12' },
            emotes: [{ name: 'Kappa', url: 'https://example.invalid/k.png' }],
        });

        equal(Chat.sent, ['message|zip|ZipZap|hello @Ephellon Kappa|ephellon|moderator,subscriber|Kappa', 'no live fields']);
    });

    check('the message id reaches the script as `.id`', async() => {
        const { Chat } = await host(lines('await *', '    POST `${ .id }`'));
        const message = await Chat.emit({ message: "hi" });

        equal(Chat.sent, [message.uuid]);
    });

    check('links are extracted from the text', async() => {
        const { Chat } = await host(lines('await (.links is SOMETHING)', '    POST `${ 1st of .links }`'));

        await Chat.emit({ message: "go to https://twitch.tv/zip now" });
        await Chat.emit({ message: "no links here" });

        equal(Chat.sent, ['https://twitch.tv/zip']);
    });

    check('a `!command` carries `.command` and `.argument`', async() => {
        const { Chat } = await host(lines(
            'await (.command is SOMETHING)',
            '    if .argument is SOMETHING',
            '        POST `${ .kind } ${ .command } -> ${ .argument }`',
            '    else',
            '        POST `${ .command } bare`',
        ));

        await Chat.emit({ message: "!SO zip" });
        await Chat.emit({ message: "!so" });
        await Chat.emit({ message: "not ! a command" });

        equal(Chat.sent, ['command so -> zip', 'so bare']);
    });

    check('badges gate on the sender', async() => {
        const { Chat } = await host(lines('await *', '    using [moderator]', '        POST `mod: ${ .sender }`'));

        await Chat.emit({ author: 'viewer1', message: "hi" });
        await Chat.emit({ author: 'mod1', message: "hi", badges: { moderator: '1' } });

        equal(Chat.sent, ['mod: mod1']);
    });

    check('USERNAME matches mentions', async() => {
        const { Chat } = await host(lines('await (USERNAME in .mentions)', '    POST `pinged by ${ .sender }`'));

        await Chat.emit({ message: "hey @ephellon", mentions: ['ephellon'] });
        await Chat.emit({ message: "hey all" });

        equal(Chat.sent, ['pinged by zip']);
    });

    check('whispers arrive as `kind` whisper', async() => {
        const { Chat } = await host(lines('await (.kind is "whisper")', '    POST `whisper from ${ .sender }: ${ .message }`'));

        await Chat.whisper({ from: 'Zip', message: "psst" });

        equal(Chat.sent, ['whisper from zip: psst']);
    });

    // -- verbs -----------------------------------------------------------------

    check('POST sends to chat, and never sends a blank message', async() => {
        const { Chat } = await host(lines('await *', '    POST `hello`', '    POST ""', '    POST `   `'));

        await Chat.emit({ message: "hi" });

        equal(Chat.sent, ['hello']);
    });

    check('REPLY threads under the message', async() => {
        const { Chat } = await host(lines('await (.message is SOMETHING)', '    REPLY `hi ${ .sender }`'));
        const message = await Chat.emit({ message: "hello" });

        equal(Chat.replies, [{ to: message.uuid, message: "hi zip" }]);
        equal(Chat.sent, []);
    });

    check('REPLY with nothing to reply to posts instead', async() => {
        const { Chat, clock } = await host(lines('await 1:00', '    REPLY `tick`'));

        await clock.advance(60_000);

        equal(Chat.sent, ['tick']);
        equal(Chat.replies, []);
    });

    // -- host calls ----------------------------------------------------------------

    check('`&datetime.time()` works under `read:datetime` only', async() => {
        const granted = await host(lines('using +read:datetime', '    await *', '        POST `t=${ &datetime.time() }`'))
            , refused = await host(lines('await *', '    POST `t=${ &datetime.time() }`'));

        await granted.Chat.emit({ message: "hi" });
        await refused.Chat.emit({ message: "hi" });

        ok(/^t=\S/.test(granted.Chat.sent[0] ?? ''), `granted: got ${ JSON.stringify(granted.Chat.sent) }`);
        equal(refused.Chat.sent, [], 'refused: ');
        ok(refused.failures.some(entry => /not granted .\+read:datetime/.test(entry)), 'no permission error was logged');
    });

    // -- lifecycle -------------------------------------------------------------

    check('stop + detach silence the script and remove every hook', async() => {
        const { Chat, clock, context, detach, runtime } = await host(lines(
            'await *',
            '    POST `seen`',
            'await 1:00',
            '    POST `tick`',
        ));

        context.stop();
        detach();

        await Chat.emit({ message: "hi" });
        await clock.advance(120_000);

        equal(Chat.sent, [], 'sent: ');
        equal(Chat.__onmessage__.size + Chat.__onwhisper__.size, 0, 'hooks left: ');
        equal(runtime.listenerCount, 0, 'listeners left: ');
        equal(clock.pending, 0, 'timers left: ');
    });

    check('a fault in one handler does not stop another', async() => {
        const { Chat, failures } = await host(lines(
            'await *',
            '    POST `${ &datetime.now() }`',
            'await *',
            '    POST `still here`',
        ));

        await Chat.emit({ message: "hi" });

        equal(Chat.sent, ['still here']);
        ok(failures.some(entry => /DSLPermissionError/.test(entry)), 'the fault was not logged');
    });

    check('the step budget stops a runaway script', async() => {
        const { Chat, failures } = await host(lines('await *', '    for 0; 1000000', '        renew', '    POST `unreachable`'), { limits: { steps: 1_000 } });

        await Chat.emit({ message: "hi" });
        await Chat.emit({ message: "again" });

        equal(Chat.sent, []);
        ok(failures.some(entry => /DSLLimitError/.test(entry)), 'no DSLLimitError was logged');
    });

    // -- run -----------------------------------------------------------------------

    let passed = 0
        , failed = 0;

    for(const { name, body } of checks) {
        try {
            await body();
            ++passed;
            report(name);
        } catch(error) {
            ++failed;
            report(name, error);
        }
    }

    return { passed, failed };
}

module.exports = { runConformance, createFakeChat, createFakeStreamer };

if(require.main === module) {
    const { createReferenceAdapter } = require('./reference-adapter.js');

    runConformance(createReferenceAdapter).then(({ passed, failed }) => {
        console.log(`\n  ${ passed } passed, ${ failed } failed`);
        process.exitCode = failed ? 1 : 0;
    });
}
