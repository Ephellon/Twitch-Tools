/*** /settings/tests/layout.test.mjs
 * Keeps the declared settings consistent: every control is defined once and used once.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import layout from '../layout.js';
import { settingIds, settingDefaults } from '../render.js';

const sections = layout.flatMap(({ sections }) => sections);

/**
 * Lists the setting ids a section's rows place, with repeats.
 * @param {Array<Object>} rows - The rows
 * @returns {Array<string>} Placed ids
 */
function placed(rows) {
    return rows.flatMap(row => [
        row.toggle, row.select, row.choice,
        ...[row.text ?? ''].flatMap(text => [...text.matchAll(/\{\{([\w\-:]+)\}\}/g)].map(([, id]) => id)),
        ...placed(row.rows ?? []),
    ].filter(Boolean));
}

test('every placed control is defined in its section', () => {
    for(const section of sections)
        for(const id of placed(section.rows))
            assert.ok(id in section.settings, `"${ section.title }" places {{${ id }}} but doesn't define it`);
});

test('every defined control is placed exactly once', () => {
    for(const section of sections) {
        const ids = placed(section.rows);

        for(const [id, setting] of Object.entries(section.settings))
            if(setting.type != 'custom')
                assert.equal(ids.filter(other => other == id).length, 1, `"${ section.title }" defines ${ id } but places it ${ ids.filter(other => other == id).length } times`);
    }
});

test('setting ids are unique across the page', () => {
    const ids = settingIds(layout);

    assert.deepEqual(ids.filter((id, index) => ids.indexOf(id) != index), []);
});

test('each radio group has one default', () => {
    const groups = {};

    for(const section of sections)
        for(const setting of Object.values(section.settings))
            if(setting.type == 'radio')
                (groups[setting.group] ??= []).push(!!setting.default);

    for(const [group, defaults] of Object.entries(groups))
        assert.equal(defaults.filter(Boolean).length, 1, `radio group "${ group }"`);
});

test('each select has at most one default option', () => {
    for(const section of sections)
        for(const [id, setting] of Object.entries(section.settings))
            if(setting.type == 'select')
                assert.ok(setting.options.filter(option => option.default).length <= 1, id);
});

test('defaults use the saved form', () => {
    const defaults = settingDefaults(layout);

    assert.equal(defaults.away_mode, true);
    assert.equal(defaults.away_mode__volume, 0.25);
    assert.equal(defaults.claim_drops__interval, '10');
    assert.equal(defaults.next_channel_preference, 'random');
    assert.ok(!('filter_rules-input' in defaults), 'helper inputs are not saved');
});
