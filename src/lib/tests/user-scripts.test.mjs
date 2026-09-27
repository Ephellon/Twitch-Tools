/*** /lib/tests/user-scripts.test.mjs
 * The user-script runner against the real TTV DSL, with fake chat, channel and storage.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import { createUserScripts, grantsOf, settingValues, SCRIPTS_KEY, CONSENT_KEY } from '../user-scripts.js';

const require = createRequire(import.meta.url);

require('../../dsl/index.js');

const { createFakeChat, createFakeStreamer } = require('../../dsl/host/host-conformance.test.js');
const DSL = globalThis.TTV_DSL;

const SCRIPT = [
    'plugin greeter -- "Greeter"',
    '    setting greeting: text "hello" -- "Greeting"',
    '    setting loud: checkbox false',
    '',
    'await *',
    '    POST `${ setting.greeting } ${ .sender }`',
    '',
].join('\n');

/**
 * Fake extension storage with change notifications.
 * @param {Object} initial - Stored values
 * @returns {Object} `{ get, onChanged, set, data }`
 */
function fakeStorage(initial) {
    const data = { ...initial }, listeners = [];

    return {
        data,
        get: async keys => Object.fromEntries(keys.filter(key => key in data).map(key => [key, data[key]])),
        onChanged: listener => listeners.push(listener),
        async set(values) {
            Object.assign(data, values);

            for(const listener of listeners)
                await listener(Object.fromEntries(Object.keys(values).map(key => [key, { newValue: values[key] }])));
        },
    };
}

/**
 * A runner over a fresh fake page.
 * @param {Object} stored - Initial storage
 * @param {string} [frame='main'] - The frame
 * @returns {Promise<Object>} `{ runner, Chat, STREAMER, storage, logs }`
 */
async function page(stored, frame = 'main') {
    const Chat = createFakeChat(), STREAMER = createFakeStreamer(), storage = fakeStorage(stored), logs = [];
    const log = { log() {}, warn: message => logs.push(message), error: message => logs.push(message) };
    const runner = createUserScripts({ DSL, storage, env: { Chat, STREAMER, USERNAME: 'me' }, frame, log });

    await runner.start();

    return { runner, Chat, STREAMER, storage, logs };
}

const approved = { [SCRIPTS_KEY]: [{ file: 'greeter.ttv', source: SCRIPT }], [CONSENT_KEY]: { greeter: grantsOf(DSL.inspect(SCRIPT).meta.permissions) } };

test('an enabled, approved script runs with its settings', async() => {
    const { runner, Chat } = await page({ ...approved, greeter: true, greeter__greeting: 'hi' });

    await Chat.emit({ author: 'zip', message: 'yo' });
    assert.deepEqual(Chat.sent, ['hi zip']);
    runner.stop();
});

test('a script that is off, or whose permissions are not approved, does not run', async() => {
    const asking = SCRIPT.replace('await *', 'using * +read:datetime\n    await *').replace('    POST', '        POST');
    const off = await page({ ...approved, greeter: false });
    const unapproved = await page({ [SCRIPTS_KEY]: [{ file: 'g.ttv', source: asking }], [CONSENT_KEY]: {}, greeter: true });

    assert.deepEqual([off.runner.running, unapproved.runner.running], [[], []]);
    assert.match(unapproved.logs[0], /permissions need approval/);
    off.runner.stop();
    unapproved.runner.stop();
});

test('changing a setting restarts the script with the new value; turning it off stops it', async() => {
    const { runner, Chat, storage } = await page({ ...approved, greeter: true });

    await storage.set({ greeter__greeting: 'hey' });
    await Chat.emit({ author: 'zip', message: 'yo' });
    await storage.set({ greeter: false });
    await Chat.emit({ author: 'zip', message: 'again' });

    assert.deepEqual(Chat.sent, ['hey zip']);
    assert.deepEqual(runner.running, []);
    runner.stop();
});

test('a main-only script does not run in pop-out chat', async() => {
    const source = SCRIPT.replace('-- "Greeter"', '-- "Greeter"\n    frames main');
    const stored = { [SCRIPTS_KEY]: [{ file: 'g.ttv', source }], [CONSENT_KEY]: { greeter: '' }, greeter: true };
    const popout = await page(stored, 'chat'), channel = await page(stored, 'main');

    assert.deepEqual([popout.runner.running, channel.runner.running], [[], ['greeter']]);
    popout.runner.stop();
    channel.runner.stop();
});

test('stored values are read in the declared types', () => {
    const { meta } = DSL.inspect(SCRIPT);

    assert.deepEqual(settingValues(meta, { greeter: true, greeter__greeting: 'x', greeter__loud: 'true' }), { greeting: 'x', loud: true });
});
