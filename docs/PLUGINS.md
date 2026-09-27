# Writing a plugin

Every feature is a plugin: one file under `src/plugins/<group>/`. Plugins come in two shapes:

- **Structured:** the feature describes its job, timer, clean-up and start-up code. This is the form for new code (below).
- **Installed:** a feature moved verbatim from an initializer in Phase 4. Its `install(context)` runs the old section as-is, wiring its own `Handlers`/`Timers` and calling `RegisterJob`.

`scripts/structure.mjs` converted 53 of the 68 moved plugins to the structured form. Fifteen stay installed because they don't fit one job per plugin:

| Plugin(s) | Why |
|---|---|
| `automation/auto-follow`, `automation/not-implemented` | Two jobs each |
| `automation/claim-reward`, `chat/safe-soft-unban`, `currencies/points-receipt` | Two setup blocks |
| `networking/auto-dvr` | Two jobs |
| `chat/convert-emotes`, `developer/developer-features` | Code after the setup block |
| `automation/first-in-line-plus` | Handler isn't a function literal |
| `up-next/helpers`, `notifications/notification-sounds`, `video-recovery/user-intent`, `video-recovery/private-viewing`, `misc/miscellaneous`, `player/miscellaneous` | No job: start-up code only |

A structured plugin describes its job, timer, clean-up and start-up code once. `TTV.run()` then wires it into the job system in `core.js`, so it behaves like every legacy feature: toggling its setting starts or stops it (see [Architecture § 4](ARCHITECTURE.md#4-settings-lifecycle)).

## Example

```js
/*** /plugins/automation/kill-extensions.js
 * Kill Extensions: hide Twitch extension overlays and pop-overs on the player.
 */

import { plugin } from '../../lib/plugins.js';

const EXTENSION_VIEWS = '[class*="extension"i]:is([class*="view"i], [class*="popover"i])';

plugin({
    id: 'kill_extensions',                  // settings key = job name
    timer: 2_500,                           // > 0 repeats every N ms; < 0 runs once after N ms

    handler({ StopWatch }) {                // the job; receives the context from TTV.start()
        new StopWatch('kill_extensions');

        for(let view of $.all(EXTENSION_VIEWS))
            view.modStyle('display:none!important');

        StopWatch.stop('kill_extensions');
    },

    unhandler() {                           // undoes the job when the setting is turned off
        for(let view of $.all(EXTENSION_VIEWS))
            view.removeAttribute('style');
    },

    setup() {                               // runs once at start-up, before the job, if enabled
        $remark("Adding extension killer...");
    },
});
```

Its settings go beside it in `kill-extensions.settings.js` (see [Settings](SETTINGS.md)), which `src/settings/layout.js` places on the Settings page:

```js
export default {
    title: "Kill Extensions",
    tr: 'kill-extensions',
    glyph: 'extensions',
    rows: [
        { toggle: 'kill_extensions' },
        { text: "Hides Twitch extension overlays and pop-overs on the player." },
    ],
    settings: {
        kill_extensions: { type: 'checkbox', default: false },
    },
};
```

Styles that belong only to the feature go in `kill-extensions.css`, included into `extras.css` at a `/* @include … */` marker (see [Styles](STYLES.md)).

Then add the plugin to `src/plugins/index.js`, which sets the order plugins start in:

```js
import './automation/kill-extensions.js';
```

## The definition

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique plugin id; also the job name and settings key unless `job` is given |
| `job` | no | Job name (`Handlers[job]`, `Timers[job]`, `Unhandlers[job]`) when it differs from `id`. Chat plugins use ids like `chat.prevent_spam` for the job `prevent_spam` |
| `init(context)` | no | Runs at start-up whether or not the feature is enabled, before anything else. Resets module-level state (`let SPAM;` … `init() { SPAM = []; }`), so re-initializing the page starts clean |
| `handler(context, ...args)` | yes | The job |
| `timer` | no | Same meaning as `Timers[id]`; without it the job only runs when something calls `RegisterJob(id)` |
| `unhandler(context)` | no | Clean-up when the feature is turned off (`UnregisterJob`) |
| `setup(context)` | no | One-time start-up work. It replaces the legacy `__Label__: if(parseBool(Settings.id)) { … }` block, and like that block it only runs at page start |
| `enabled(settings, context)` | no | Whether to start; defaults to `parseBool(settings[job])` |
| `register` | no | `false` when `setup` decides for itself whether to call `RegisterJob(job)` |
| `install(context)` | no | Installed form: runs the moved section verbatim, whether or not the feature is enabled. If present, the fields above are ignored |
| `frames` | no | Where `TTV.start(frame)` runs it: `main` (www.twitch.tv; the default), `chat`, `player`, `clips`. The bundle a plugin is in decides which pages load it (see below) |

## Where plugins run

Each page type loads its own bundle (built from `src/plugins/<frame>/index.js` or, for www.twitch.tv, `src/lib/index.js`). The bundle loads just before the legacy script for that page. All bundles on a page share one registry.

| Folder(s) | Bundle | Loaded before | Started from |
|---|---|---|---|
| `automation/`, `customization/`, `currencies/`, `notifications/`, `up-next/`, `networking/`, `video-recovery/`, `developer/`, `misc/` | `lib.js` | `tools.js` | `Initialize()` |
| `chat/` | `chat-plugins.js` | `chat.js` (www.twitch.tv and pop-out chat) | `Chat__Initialize()`, `Chat__Initialize_Safe_Mode()` (`safe-*.js`) |
| `player/` | `player-plugins.js` | `player.js` | `Player__Initialize()` |
| `clips/` | `clips-plugins.js` | `clips.js` | `Clips__Initialize()` |

Initializers start plugins one at a time with `await TTV.run('<id>', PLUGIN_CONTEXT)`, placed where the feature's code used to be. That keeps the original order relative to code that hasn't moved. A new plugin needs its own `TTV.run` line in the right initializer. Otherwise `TTV.start(frame, context)` starts every plugin for a frame that hasn't run yet.

## What a plugin can use

- **Page globals from the legacy scripts:** `$`, `when`, `Settings`, `STREAMER`, `SetViewMode`, `$log` and the rest (see [Architecture § 2](ARCHITECTURE.md#2-layers)). Plugins are bundled into `lib.js`, which loads before `tools.js`. So read those globals inside `handler`/`setup`, never at the top of the module.
- **`context`:** the initializer's `PLUGIN_CONTEXT`.
  - In `tools.js`, `player.js` and `clips.js` it is `{ StopWatch }`.
  - In `chat.js` it has a getter and setter for each of `Chat__Initialize`'s own variables that plugins use (`STREAMER`, `USERNAME`, `EmoteSearch`, …). `context.STREAMER` is therefore always the live value; `chat.js` keeps its own `STREAMER`, separate from `tools.js`'s.
- **Page-scope state:** variables several `tools.js` features share (`VideoClips`, `MASTER_VIDEO`, the notification state, Lurking's volume flags, …) are declared at the top of `tools.js` and assigned in `Initialize()`.
- **Imports:** `src/lib/*` helpers can be imported directly (`import { Card } from '../../lib/card.js'`).

## Moving code (Phase 4 tools)

- `node scripts/sections.mjs src/<file>.js <Initializer>` lists an initializer's feature sections. It shows what each one shares with the rest and flags top-level `return`/`await`.
- `node scripts/promote.mjs <file> <Initializer> NAME…` moves shared variables to page scope, or to the top of the initializer with `--head`.
- `node scripts/migrate.mjs <file> <Initializer> "<Section>" <plugins/path.js> <id> [--live] [--index <file>]` moves one section into an installed plugin. `--live` rewrites references to initializer variables into `context.NAME` and adds the matching accessors.

Moved code runs as an ES module, so strict mode applies. esbuild and lint catch most of the difference (`delete x`, reserved words like `private`, implicit globals).

## Checks

- `npm test` runs the DSL tests and the plugin registry tests (`src/lib/tests/`).
- `npm run lint` lints plugins as ES modules sharing the page scope.
- `npm run build` (or `npm run watch`), then reload `dist/chrome` in the browser.
