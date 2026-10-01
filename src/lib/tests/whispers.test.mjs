/**
 * Reading whispers from Twitch's Hermes frames.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseHermesWhisper } from '../whispers.js';

const notification = payload => JSON.stringify({ type: 'notification', notification: { subscription: { id: 'tt-whispers' }, type: 'pubsub', pubsub: JSON.stringify(payload) } });

test('a whisper_received notification becomes a whisper', () => {
    const data_object = { message_id: 'b9ab', thread_id: '1_2', body: 'banana 🍌', sent_ts: 1790813556, from_id: 1, tags: { login: 'ephellon', display_name: 'Ephellon' } };
    const whisper = parseHermesWhisper(notification({ type: 'whisper_received', data: JSON.stringify(data_object), data_object }));

    assert.equal(whisper.id, 'b9ab');
    assert.equal(whisper.from, 'ephellon');
    assert.equal(whisper.message, 'banana 🍌');
    assert.equal(whisper.unread, 1);
    assert.equal(+whisper.timestamp, 1790813556000);
});

test('other frames and other notifications are ignored', () => {
    assert.equal(parseHermesWhisper(JSON.stringify({ type: 'keepalive' })), null);
    assert.equal(parseHermesWhisper(JSON.stringify({ type: 'authenticateResponse', authenticateResponse: { result: 'ok' } })), null);
    assert.equal(parseHermesWhisper(notification({ type: 'thread', data_object: { tags: { login: 'x' } } })), null);
    assert.equal(parseHermesWhisper('not json'), null);
    assert.equal(parseHermesWhisper(JSON.stringify({ type: 'notification', notification: { pubsub: '{broken' } })), null);
});
