/**
 * Debug Recording: hiding text, settings and input boxes, the rolling log, and the saved page.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DebugLog, MASK, buildRecording, describeElement, logLine, maskSetting, maskText } from '../debug-recorder.js';

/** A small stand-in for an element: a tag, attributes, a parent, and the selectors it sits inside */
const element = (tag, { attrs = {}, text = '', parent = null, inside = [] } = {}) => ({
    tagName: tag.toUpperCase(),
    id: attrs.id ?? '',
    className: attrs.class ?? '',
    textContent: text,
    parentElement: parent,
    getAttribute: name => attrs[name] ?? null,
    closest: selector => (inside.includes(selector) ? {} : null),
});

test('maskText keeps length and spacing', () => {
    assert.equal(maskText('hi there  you'), `${ MASK.repeat(2) } ${ MASK.repeat(5) }  ${ MASK.repeat(3) }`);
    assert.equal(maskText(null), '');
    assert.equal(maskText('😀 ok').length, `${ MASK } ${ MASK }${ MASK }`.length);
});

test('maskSetting keeps switches and numbers, hides text and secrets', () => {
    assert.equal(maskSetting('away_mode', true), true);
    assert.equal(maskSetting('away_mode__volume', 25), 25);
    assert.equal(maskSetting('away_mode', 'true'), 'true');
    assert.equal(maskSetting('phrase_rules', 'cat dog'), `${ MASK.repeat(3) } ${ MASK.repeat(3) }`);
    assert.equal(maskSetting('sync-token', 'abc123'), '');
    assert.equal(maskSetting('list', [1, 2]), '[list of 2]');
    assert.equal(maskSetting('gone', void null), null);
});

test('logLine joins arguments and cuts long lines', () => {
    assert.equal(logLine(['Up Next:', { a: 1 }, new Error('nope')]), 'Up Next: {"a":1} Error: nope');
    assert.equal(logLine(['x'.repeat(400)]).length, 300);
});

test('describeElement names the element and hides messages', () => {
    const button = element('button', { attrs: { 'data-a-target': 'player-play-pause-button', 'aria-label': 'Pause' } });
    assert.deepEqual(describeElement(button), { path: 'button[data-a-target="player-play-pause-button"]', label: 'Pause' });

    const parent = element('div', { attrs: { class: 'chat-line__message x' } });
    const message = element('span', { text: 'secret words', parent });
    message.closest = selector => (/chat-line/.test(selector) ? {} : null);
    assert.equal(describeElement(message).label, `${ MASK.repeat(6) } ${ MASK.repeat(5) }`);
    assert.equal(describeElement(message).path, 'div.chat-line__message > span');
});

test('describeElement keeps nothing from input boxes but the main chat input', () => {
    const password = element('input', { attrs: { 'aria-label': 'hunter2' } });
    password.closest = selector => (/^input/.test(selector) ? {} : null);
    assert.equal(describeElement(password).label, '');

    const chat = element('textarea', { attrs: { 'data-a-target': 'chat-input', 'aria-label': 'Send a message' } });
    chat.closest = selector => (/chat-input/.test(selector) || /^input/.test(selector) ? {} : null);
    assert.equal(describeElement(chat).label, maskText('Send a message'));

    assert.deepEqual(describeElement(null), { path: '', label: '' });
});

test('DebugLog keeps only the last minutes, and at most `limit` events', () => {
    let now = 0;
    const log = new DebugLog({ minutes: 1, limit: 3, now: () => now });

    log.add('a');
    now = 30_000;
    log.add('b');
    now = 70_000;
    log.add('c');
    assert.deepEqual(log.events.map(e => e.type), ['b', 'c']);

    log.add('d');
    log.add('e');
    assert.deepEqual(log.events.map(e => e.type), ['c', 'd', 'e']);

    const copy = new DebugLog({ now: () => now, ...log.toJSON() });
    assert.equal(copy.events.length, 3);
});

test('buildRecording makes one page that can\'t be broken by what it holds', () => {
    const html = buildRecording({
        meta: { version: '6.1', channel: '<b>x</b>' },
        events: [{ t: 1, type: 'log', level: 'warn', text: '</script><script>alert(1)</script>' }],
    });

    assert.match(html, /^<!doctype html>/);
    assert.equal(html.match(/<\/script>/g).length, 2);
    assert.ok(!html.includes('<b>x</b>'));
    assert.ok(html.includes('\\u003c/script>'));
});
