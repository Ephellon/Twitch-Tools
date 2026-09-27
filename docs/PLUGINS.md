# Writing a plugin

A plugin is one feature in one file under `src/plugins/<group>/`. It describes its job, timer, clean-up and start-up code once. `TTV.start()` then wires it into the job system in `core.js`, so it behaves like every legacy feature: toggling its setting starts or stops it (see [Architecture § 4](ARCHITECTURE.md#4-settings-lifecycle)).

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
    settings: { kill_extensions: false },   // the settings it owns, with defaults

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

Then add it to `src/plugins/index.js`, which sets the order plugins start in:

```js
import './automation/kill-extensions.js';
```

## The definition

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Settings key and job name (`Handlers[id]`, `Timers[id]`, `Unhandlers[id]`) |
| `handler(context, ...args)` | yes | The job |
| `timer` | no | Same meaning as `Timers[id]`; without it the job only runs when something calls `RegisterJob(id)` |
| `unhandler(context)` | no | Clean-up when the feature is turned off (`UnregisterJob`) |
| `setup(context)` | no | One-time start-up work. It replaces the legacy `__Label__: if(parseBool(Settings.id)) { … }` block, and like that block it only runs at page start |
| `enabled(settings)` | no | Whether to start; defaults to `parseBool(settings[id])` |
| `frames` | no | Where it runs: `main` (www.twitch.tv, top frame; the default), `chat`, `player`, `clips`. Only `main` is started today |
| `settings` | no | The settings it owns, with defaults; the Settings page will be generated from these in Phase 5 |

## What a plugin can use

- **Page globals from the legacy scripts:** `$`, `when`, `Settings`, `STREAMER`, `SetViewMode`, `$log` and the rest (see [Architecture § 2](ARCHITECTURE.md#2-layers)). Plugins are bundled into `lib.js`, which loads before `tools.js`. So read those globals inside `handler`/`setup`, never at the top of the module.
- **`context`:** what `Initialize()` hands over from its own scope. Today that is `StopWatch`. When a migrated feature needs more of `Initialize()`'s state, add it to the `TTV.start('main', { … })` call in `tools.js`.
- **Imports:** `src/lib/*` helpers can be imported directly (`import { Card } from '../../lib/card.js'`).

## Checks

- `npm test` runs the DSL tests and the plugin registry tests (`src/lib/tests/`).
- `npm run lint` lints plugins as ES modules sharing the page scope.
- `npm run build` (or `npm run watch`), then reload `dist/chrome` in the browser.
