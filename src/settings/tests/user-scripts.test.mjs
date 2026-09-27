/*** /settings/tests/user-scripts.test.mjs
 * The starter script offered by "New script" must stay a valid TTV DSL plugin.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import { TEMPLATE } from '../user-scripts.js';

createRequire(import.meta.url)('../../dsl/index.js');

test('the starter script checks clean and declares its plugin', () => {
    const { meta, diagnostics } = globalThis.TTV_DSL.inspect(TEMPLATE, { file: 'hello-bot.ttv' });

    assert.deepEqual(diagnostics, []);
    assert.deepEqual(globalThis.TTV_DSL.check(TEMPLATE), []);
    assert.equal(meta.id, 'hello_bot');
    assert.deepEqual(Object.keys(meta.settings), ['hello_bot', 'hello_bot__reply', 'hello_bot__reminders']);
});
