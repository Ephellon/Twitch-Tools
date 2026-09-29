# Settings

The Settings page is declared, not hand-written. Each feature's section sits beside its plugin as `<plugin>.settings.js`. Page-level sections, such as Language or Export Settings, go in `src/settings/sections/`. [`src/settings/layout.js`](../src/settings/layout.js) puts the sections in groups and orders them. At page load, `settings-ui.js` (built from `src/settings/index.js`) renders the layout, before `settings.js` runs.

## A section

```js
/*** /plugins/automation/lurking.settings.js
 * Settings for "Easy Lurk" (Automation).
 */

export default {
    title: "Easy Lurk",
    tr: 'away-mode',                        // translation id
    glyph: 'show',                          // icon before the title, with its flags
    flags: ['small'],
    badges: { new: '4.12' },                // `new`, `beta`, … badges on the section
    keywords: 'agenda,calendar,schedule',   // extra words the search matches
    rows: [
        { toggle: 'away_mode' },
        { text: "Adds a button to toggle <b attention-text>lurking</b>." },
        {
            extras: { title: "Extras", tr: 'extras', subtitle: 'Adjust settings for "Easy Lurk"' },
            rows: [
                {
                    option: { title: "Lurking Volume", tr: 'away-mode:volume' },
                    rows: [
                        { toggle: 'away_mode__volume_control' },
                        { text: "Set the volume to {{away_mode__volume}} while lurking." },
                    ],
                },
            ],
        },
    ],
    settings: {
        away_mode: { type: 'checkbox', default: true },
        away_mode__volume_control: { type: 'checkbox', default: false },
        away_mode__volume: { type: 'number', default: 25, min: 1, max: 25, unit: '%', scale: 0.01 },
    },
};
```

| Field | Meaning |
|---|---|
| `title`, `tr` | Title text (HTML) and its translation id |
| `glyph`, `flags` | Icon before the title and its display flags (`small`, `gold`, `white`, …) |
| `attrs`, `badges`, `summaryAttrs` | Extra attributes on the title, the `<section>` and the summary |
| `keywords` | Extra search words |
| `rows` | What the section shows, in order (below) |
| `settings` | Every control in the section, by id (below) |

## Rows

| Row | Renders |
|---|---|
| `{ toggle: id }` | The switch for a checkbox setting |
| `{ text, tr?, attrs? }` | A paragraph. `{{id}}` places that setting's control inline. `tr: false` leaves the paragraph out of translation |
| `{ select: id }` | A drop-down |
| `{ choice: id, title, text?, tr? }` | One radio option, with a heading and a description |
| `{ extras: { title, tr, subtitle }, rows, panelAttrs? }` | A collapsible "Extras"/"Options" panel |
| `{ option: { title, tr, glyph? }, rows }` | A titled row inside a panel |
| `{ html }` | Markup kept as written, for widgets with their own code in `settings.js`: rule editors, the lurking schedule, sync buttons, … |

Every row also takes `attrs` for extra attributes on its element.

## Settings

| Field | Meaning |
|---|---|
| `type` | `checkbox`, `radio`, `number`, `text`, `select`, or `custom` (a value a widget in `settings.js` stores itself) |
| `default` | The value before the user changes it. For a `select`, mark the option with `default: true`. A `custom` row has a default only when it declares one here (its HTML can't be read at build time) |
| `min`, `max`, `step`, `placeholder` | Input limits |
| `unit` | Unit label shown after a number (`'min'`, `'%'`, `'GB'`) |
| `group` | A radio group's name |
| `options` | A select's options: `{ value, label, default?, attrs? }` |
| `scale` | Multiplier from the shown value to the saved one (`0.01` saves 25 % as `0.25`) |
| `store: false` | A helper control whose value isn't saved, such as the text box of a rule editor |
| `attrs`, `wrap` | Extra attributes on the control, and on a wrapping `<span>` |

## Defaults

The declared defaults are the single source of truth:

- The build puts them into every content-script bundle as `SETTINGS_DEFAULTS`. `Settings.get()` falls back to them for any setting that was never saved, such as one added by an update.
- The Settings page starts any unsaved setting at its declared default, so the first save stores exactly these values.
- `usable_settings` (what the page saves, exports and restores) is every declared setting except `store: false` helpers, plus the layout's `stored` values: `clientID` and `oauthToken`.

## Checks

- `npm test` checks that every placed control is defined and placed exactly once, that ids are unique, that every radio group has one default, and that defaults come out in the saved form.
- `scripts/settings/roundtrip.cjs` renders the layout and compares it block by block with a hand-written `settings.html`. It was used once, for the Phase 5 migration, against the page before it: `git show f43946a~1:src/settings.html`.
- `scripts/settings/extract.cjs` and `write.cjs` performed that one-off migration and are kept for reference.
