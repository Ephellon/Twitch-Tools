/*** /lib/tests/plugins.test.mjs
 * `node --test src/lib/tests` — checks how plugins are wired into the job system from core.js.
 */

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Stand-ins for the globals core.js and polyfill.js provide on the page
let registered;
beforeEach(() => {
    delete globalThis.__TTV_PLUGINS__;
    registered = [];
    Object.assign(globalThis, {
        Handlers: {}, Timers: {}, Unhandlers: {},
        Settings: { on: true, off: false, chatty: true },
        parseBool: value => ![undefined, null, false, 0, '', 'false', 'null', '0'].includes(value),
        RegisterJob: id => registered.push(id),
    });
});

// Each test gets a fresh registry
let count = 0;
const load = async() => import(`../plugins.js?fresh=${ ++count }`);

test('wires handler, timer and unhandler under the plugin id', async() => {
    const { plugin, start } = await load();
    const context = { StopWatch: 'sw' };
    let seen;

    plugin({ id: 'on', timer: 2_500, handler: (ctx, ...args) => (seen = [ctx, args]), unhandler: () => 'undone' });
    await start('main', context);

    assert.equal(globalThis.Timers.on, 2_500);
    globalThis.Handlers.on('a', 1);
    assert.deepEqual(seen, [context, ['a', 1]]);
    assert.equal(globalThis.Unhandlers.on(), 'undone');
});

test('starts only enabled plugins, running setup first', async() => {
    const { plugin, start } = await load();
    const order = [];

    plugin({ id: 'on', handler() {}, setup: () => order.push('setup') });
    plugin({ id: 'off', handler() {}, setup: () => order.push('never') });
    globalThis.RegisterJob = id => order.push(`job:${ id }`);
    await start('main');

    assert.deepEqual(order, ['setup', 'job:on']);
    assert.equal(typeof globalThis.Handlers.off, 'function', 'a disabled plugin is still wired, so turning it on later works');
});

test('respects frames and custom enabled checks', async() => {
    const { plugin, start } = await load();

    plugin({ id: 'chatty', frames: ['chat'], handler() {} });
    plugin({ id: 'custom', handler() {}, enabled: settings => settings.off === false });
    await start('main');

    assert.equal(globalThis.Handlers.chatty, undefined);
    assert.deepEqual(registered, ['custom']);
});

test('refuses a duplicate id', async() => {
    const { plugin } = await load();

    plugin({ id: 'on', handler() {} });
    assert.throws(() => plugin({ id: 'on', handler() {} }), /already registered/);
});

test('run() starts one plugin; install() runs whether or not it is enabled', async() => {
    const { plugin, run, start } = await load();
    const seen = [];

    plugin({ id: 'off', async install(context) { seen.push(['install', context.tag]) } });
    plugin({ id: 'on', handler() {} });

    await run('off', { tag: 'ctx' });
    await start('main');

    assert.deepEqual(seen, [['install', 'ctx']], 'start() skips plugins run() already started');
    assert.deepEqual(registered, ['on']);
    await assert.rejects(run('missing'), /No plugin "missing"/);
});
