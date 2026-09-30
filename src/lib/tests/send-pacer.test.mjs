/**
 * The chat send pacer: a gap between sends, a cap per window, order kept.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createSendPacer } from '../send-pacer.js';

function clock() {
    let time = 0;
    const timers = [];

    return {
        now: () => time,
        later: (fn, ms) => timers.push({ at: time + ms, fn }),
        // Runs every timer due up to `until`, in order
        advance(until) {
            for(let next; (next = timers.sort((a, b) => a.at - b.at)[0]) && next.at <= until;) {
                timers.shift();
                time = next.at;
                next.fn();
            }
            time = until;
        },
    };
}

test('the first send goes at once; a burst is spaced by the gap, in order', () => {
    const c = clock(), log = [];
    const pacer = createSendPacer({ gap: 1000, now: c.now, later: c.later });

    for(const n of [1, 2, 3])
        pacer.push(() => log.push([n, c.now()]));

    assert.deepEqual(log, [[1, 0]]);
    c.advance(5000);
    assert.deepEqual(log, [[1, 0], [2, 1000], [3, 2000]]);
    assert.equal(pacer.size, 0);
});

test('no more than the limit per window', () => {
    const c = clock(), log = [];
    const pacer = createSendPacer({ gap: 100, window: 30_000, limit: () => 3, now: c.now, later: c.later });

    for(let n = 0; n < 5; ++n)
        pacer.push(() => log.push(c.now()));

    c.advance(60_000);
    assert.deepEqual(log, [0, 100, 200, 30_000, 30_100]);
});

test('a throwing send doesn\'t stall the queue', () => {
    const c = clock(), log = [];
    const pacer = createSendPacer({ gap: 10, now: c.now, later: c.later, warn: error => log.push(error.message) });

    pacer.push(() => { throw new Error('socket closed') });
    pacer.push(() => log.push('next'));
    c.advance(100);
    assert.deepEqual(log, ['socket closed', 'next']);
});
