/**
 * Debug Recording: hiding text, settings and input boxes, the rolling log, and the saved page.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DebugLog, MASK, browserName, buildRecording, describeElement, isSensitive, logLine, maskSetting, maskText, mergeHistory, sensitiveTerms } from '../debug-recorder.js';

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

test('maskSetting keeps values as they are, except what the user writes themselves', () => {
    assert.equal(maskSetting('away_mode', true), true);
    assert.equal(maskSetting('away_mode__volume', 25), 25);
    assert.equal(maskSetting('UP_NEXT_OWNER_NAME', 'milkietatas'), 'milkietatas');
    assert.deepEqual(maskSetting('ALL_FIRST_IN_LINE_JOBS', ['a']), ['a']);
    assert.equal(maskSetting('phrase_rules', 'cat dog'), `${ MASK.repeat(3) } ${ MASK.repeat(3) }`);
    assert.equal(maskSetting('filter_rules', '@nightbot'), MASK.repeat(9));
    assert.equal(maskSetting('lurking_rules', 'hi;bye'), MASK.repeat(6));
    assert.equal(maskSetting('bttv_emotes_extras', 'KEKW'), MASK.repeat(4));
    assert.equal(maskSetting('sync-token', 'abc123'), MASK.repeat(6));
    assert.equal(maskSetting('gone', void null), null);
});

test('isSensitive knows keys and their logged names', () => {
    assert.ok(isSensitive('FILTER RULES'));
    assert.ok(isSensitive('phrase_rules-input'));
    assert.ok(!isSensitive('UP NEXT OWNER NAME'));
});

test('logLine joins arguments and cuts long lines', () => {
    assert.equal(logLine(['Up Next:', { a: 1 }, new Error('nope')]), 'Up Next: {"a":1} Error: nope');
    assert.equal(logLine(['x'.repeat(400)]).length, 300);
});

test('logLine hides messages, the user\'s rules, and changed values of their own settings', () => {
    const line = { raw: 'Nightbot: hi all', author: 'nightbot', style: 'color: red' };
    const text = logLine(['Censoring message because the user matches: nightbot', line], 300, sensitiveTerms({ filter_rules: '@nightbot,ok' }));

    assert.ok(!/nightbot|hi all/i.test(text), text);
    assert.match(text, /"style":"color: red"/);

    assert.equal(logLine(['Modifying feature: UP NEXT OWNER NAME', { oldValue: 'a', newValue: 'b' }]), 'Modifying feature: UP NEXT OWNER NAME {"oldValue":"a","newValue":"b"}');
    assert.ok(!/cat/.test(logLine(['Modifying feature: PHRASE RULES', { oldValue: '', newValue: 'cat' }])));
});

test('sensitiveTerms takes words of 3+ letters from the user\'s rules, longest first', () => {
    assert.deepEqual(sensitiveTerms({ filter_rules: '@nightbot,ok', phrase_rules: 'big cat,/regex/', bttv_emotes_extras: 'KEKW' }), ['nightbot', 'regex', 'KEKW', 'big', 'cat']);
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

test('mergeHistory keeps the newer history from before this page, then this page\'s own events', () => {
    const page = { meta: { started: 1 }, events: [{ t: 1, type: 'a' }, { t: 2, type: 'b' }, { t: 10, type: 'load' }] };

    // Nothing kept in the background: the page's own (sessionStorage) history stays
    assert.deepEqual(mergeHistory(page, null, 10).events.map(e => e.type), ['a', 'b', 'load']);
    assert.equal(mergeHistory(page, null, 10).fromKept, false);

    // After a navigation to another site (or a respawn), the background has newer history
    const kept = { meta: { started: 0 }, events: [{ t: 0, type: 'x' }, { t: 5, type: 'y' }, { t: 6, type: 'respawn' }] };
    const merged = mergeHistory(page, kept, 10);

    assert.deepEqual(merged.events.map(e => e.type), ['x', 'y', 'respawn', 'load']);
    assert.equal(merged.fromKept, true);
    assert.deepEqual(merged.meta, { started: 0 });

    // The background's copy of this page's own events isn't repeated
    const echo = { meta: {}, events: [...kept.events, { t: 10, type: 'load' }] };

    assert.deepEqual(mergeHistory(page, echo, 10).events.map(e => e.type), ['x', 'y', 'respawn', 'load']);
});

test('buildRecording shows clock times and respawns', () => {
    const html = buildRecording({ meta: {}, events: [{ t: Date.UTC(2026, 0, 1, 12, 0, 0, 5), type: 'respawn', from: 3, forced: true }] });

    assert.match(html, /getMilliseconds/);
    assert.match(html, /case 'respawn'/);
});

test('browserName finds Edge and Opera before the "Chrome/" they also carry', () => {
    const chrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36';

    assert.equal(browserName(chrome), 'Chrome/154.0.0.0');
    assert.equal(browserName(`${ chrome } Edg/154.0.3000.12`), 'Edg/154.0.3000.12');
    assert.equal(browserName(`${ chrome } OPR/120.0.0.1`), 'OPR/120.0.0.1');
    assert.equal(browserName('Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0'), 'Firefox/142.0');
    assert.equal(browserName(''), '');
});

test('mergeHistory puts a respawned tab\'s late events back in time order', () => {
    const kept = { meta: {}, events: [{ t: 1, type: 'a' }, { t: 5, type: 'respawn' }, { t: 3, type: 'visibility' }] };
    const merged = mergeHistory({ meta: {}, events: [{ t: 10, type: 'load' }] }, kept, 10);

    assert.deepEqual(merged.events.map(e => e.type), ['a', 'visibility', 'respawn', 'load']);
});
