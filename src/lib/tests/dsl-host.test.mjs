/*** /lib/tests/dsl-host.test.mjs
 * The extension-specific parts of the DSL host adapter: raids, the viewer's badges, `goto`, hook names.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createAdapter, toRaidEvent } from '../dsl-host.js';

const STREAMER = { name: 'Some_Channel', sole: '42', live: true };
const Chat = { send() {}, reply() {} };

test('a raid notice becomes a raid event; other notices don\'t', () => {
    assert.deepEqual(toRaidEvent({ subject: 'raid', raider: 'Zip', raid_size: '12', timestamp: 5 }), { kind: 'raid', raider: 'zip', raid_size: 12, timestamp: 5 });
    assert.equal(toRaidEvent({ subject: 'raid' }), null, 'an unraid carries no raider');
    assert.equal(toRaidEvent({ subject: 'gift', raider: 'zip' }), null);
});

test('the channel exposes the viewer\'s badges only when the extension knows them', () => {
    const without = createAdapter({ Chat, STREAMER, USERNAME: 'me' }).options.realms.TWITCH.current;
    let badges = ['vip'];
    const with_ = createAdapter({ Chat, STREAMER, USERNAME: 'me', viewerBadges: () => badges }).options.realms.TWITCH.current;

    assert.ok(!('badges' in without));
    assert.deepEqual(with_.badges, ['vip']);
    badges = ['moderator'];
    assert.deepEqual(with_.badges, ['moderator'], 'live, not a copy');
});

test('goto navigates where allowed and warns elsewhere', () => {
    const went = [], warned = [];
    const logger = { log() {}, warn: message => warned.push(message), error() {} };

    createAdapter({ Chat, STREAMER, USERNAME: 'me', goto: name => went.push(name), logger }).options.realms.TWITCH.goto('Other');
    createAdapter({ Chat, STREAMER, USERNAME: 'me', logger }).options.realms.TWITCH.goto({ name: 'other' });

    assert.deepEqual(went, ['other']);
    assert.equal(warned.length, 1);
});

test('each attach adds its own named hooks, and detach removes them', () => {
    // Like src/lib/chat.js: hooks are keyed by name (else by source text), and a taken key is ignored
    const hooks = kind => Object.defineProperty({}, kind, {
        set(callback) {
            const key = callback.name || String(callback);

            if(!this[`__${ kind }__`].has(key))
                this[`__${ kind }__`].set(key, callback);
        },
    });
    const RealChat = { send() {}, reply() {}, __onmessage__: new Map, __onwhisper__: new Map, __onbullet__: new Map };

    for(const kind of ['onmessage', 'onwhisper', 'onbullet'])
        Object.defineProperties(RealChat, Object.getOwnPropertyDescriptors(hooks(kind)));

    const runtime = { dispatch() {} };
    const detachA = createAdapter({ Chat: RealChat, STREAMER, USERNAME: 'me' }).attach(runtime);
    const detachB = createAdapter({ Chat: RealChat, STREAMER, USERNAME: 'me' }).attach(runtime);

    assert.equal(RealChat.__onmessage__.size, 2, 'a second script still hears chat');
    assert.ok([...RealChat.__onmessage__.keys()].every(key => key.startsWith('TTV_DSL_')));

    detachA();
    detachB();

    assert.equal(RealChat.__onmessage__.size + RealChat.__onwhisper__.size + RealChat.__onbullet__.size, 0);
});
