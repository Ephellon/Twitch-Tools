# Phase 2 triage

Sources: the 163 Offser candidates in [`offser-bug-candidates.md`](offser-bug-candidates.md), ESLint correctness rules, and notes from Phases 0–1. Each candidate was checked against the code before anything changed. Line numbers are pre-fix (v5.35.3.3).

## Fixed

| Where | Bug | Effect |
|---|---|---|
| core.js `PrepareForGarbageCollection` | The "top-most call" marker was set once and never reset | `LEDGER` was cleared on the first call only, then held every object passed in forever (leak) and skipped re-cleaning them |
| core.js `fetchURL.origins.*_BEST` | Probed eagerly at load; nothing reads them | ~25 requests to 7 third-party CORS proxies on every top-frame page load; now run only on first read |
| core.js `when.*.pipe` ×10 | `.then(resolve.call(null, args))` | Resolved immediately instead of after the condition |
| core.js `Settings.remove('key')` | `instanceof String` is false for primitives | A single key was iterated character by character |
| core.js `getBytesInUse` ×2 | `callback` undeclared | Callback never called |
| core.js `fetchURL` alloworigin | URL not encoded | Broken proxied URLs with `&`/`?` |
| core.js, background.js namespace | `let browser` shadowed the global; background preferred `browser` | Firefox background would get the promise-only `browser` API while passing callbacks; now `chrome` first everywhere |
| tools.js L385, L619 | `Cache.save({ ALL_FIRST_IN_LINE_JOBS: ….splice(…) })` | Saved the *removed* job as the whole Up Next queue |
| tools.js L12449 | `splice(indexOf(…), 1)` with `-1` | Stay Live dropped the **last** Up Next job when the current one wasn't queued |
| tools.js L1175 | `case 'chat.info'` fell through | Its template was overwritten by `chat.user` |
| tools.js L1834–1949 | Deferred/consumable whisper, bullet, command setters read the wrong map | Duplicate-registration check returned the wrong listener |
| tools.js L890 | `Card.remove()` deleted `this.title`, never set | Removed cards stayed registered |
| tools.js L1503 | XHR fallback `json()` parsed the request body | Wrong data when `fetch` is unavailable |
| tools.js L3103 | `size = max` | Badge image never picked the largest size |
| tools.js L3114 | `if(…);` | Every stream got the current channel's points object |
| tools.js, chat.js, player.js, clips.js `StopWatch` | `interval + new Date` is string concatenation → `NaN` | "Job took too long" warnings never fired |
| tools.js L4310 | Filter parameter shadowed `command` | StreamElements aliases never matched |
| tools.js L5132 | `/\/g/` matches the text `/g` | Slashes not stripped from video IDs |
| tools.js L6445 | `handled` never incremented | Prime Loot menu never closed itself |
| tools.js L7345 | Recursive drops check dropped `svg_str` | Drops only claimed on the first pass |
| tools.js L10082, L10631, L10753, L11036, L11159 | Store description queried the Twitch page, not the fetched store page | Game description replaced with unrelated Twitch text |
| tools.js L10552 | `Title` undeclared (meant `info.Title`) | Xbox fallback search threw |
| tools.js L11282 | `for…of undefined` | Epic lookup threw on an empty catalog |
| tools.js L12152 | Banner text used as a RegExp | Names with regex characters threw |
| tools.js time-zone table | Duplicate `EST`/`GMT`/`UTC`; the later `UTC: ":00"` won | Bad UTC offset |
| tools.js L14739–14740 | Unquoted `[name=…]` | Selector threw for names starting with a digit |
| tools.js L16131 | `.then(control.click)` | "Illegal invocation"; the second click never happened |
| tools.js L18373 | `TTV_IRC.wsURL_chat` doesn't exist | Reconnect opened `new WebSocket(undefined)` |
| tools.js L61, L70 | `.find(…).replace` with no theme class | TypeError on pages without a theme class; defaults to `dark` |
| tools.js misc | Implicit globals `video`, `computed`, `streamer`, `action`, `pinned`; `tw-tabel-cell` typo; duplicate `user2` key | Leaks into `window`; wrong class |
| chat.js L1292 | Filter rule compiled with `RegExp` unguarded | One malformed rule broke the whole filter |
| chat.js L2488 | `RemoveCustomCSSBlock` names didn't match `AddCustomCSSBlock` | Turning Simplify Chat off left its CSS until reload |
| chat.js L3162 | `error.textContent` when only `chat` was missing | TypeError in Recover Chat |
| chat.js L4194 | `data-a-atrget` typo | Mentions never detected during Soft Unban catch-up |
| player.js L130 | `GetNextStreamer` isn't loaded in player frames | ReferenceError; `RECOVERING_VIDEO` stuck `true` |
| player.js L248 | `video.stopRecording()` when `video` is null | TypeError |
| clips.js L99 | `USERNAME` isn't loaded on clip pages | Clip editor threw |
| settings.js L1808, L1840 | `id` vs `ID` | **JSON restore (#58) threw on the first setting** |
| settings.js L1970 | `.set()` on a plain object | Settings export threw when a control was missing |
| settings.js L2330 | `parseValue` doesn't exist | Unit fields threw on non-integer input |
| settings.js L1229, L2782 | `{ user_language_preference }` shorthand | Default was the `<select>` element (named-access global) |
| settings.js L2414 | Enter with no search results | TypeError |
| background.js L880 | `act` used outside its scope | **RAM Alarms audit threw whenever any tab was frozen**; frozen tabs now get `ignore` |
| background.js L708, L843, L948 | Out-of-scope `tab`/`id` in error paths | The error handlers themselves threw |

Tooling: ESLint now sees `window.X ??=` globals, Annex B block functions (`RegisterJob` & co.) and the UMD libs, so `no-undef` went from 139 findings to 17 real ones.

## Deferred to Phase 4 (Up Next, entangled with shared state)

- tools.js L7607 `nullish('.tt-confirm')` tests a string, so the "loose interval" mitigation never runs.
- tools.js L8641–8642 `--oldIndex`/`--newIndex` in the Sortable handler. This matches the known "irregular ordering" issue.
- tools.js L8665 `ALL_FIRST_IN_LINE_JOBS[0].href` on a string, which passes `undefined` to `REDO_FIRST_IN_LINE_QUEUE`.
- tools.js L4083 `GetNextStreamer.cachedStreamer ??= randomChannel` is then treated as an array. Relevant to #50 (Stay Live).
- tools.js L3809 `FIRST_IN_LINE_WARNING_TEXT_UPDATE` is never assigned.
- GitHub issues #44–#57, #52, #55, #56 (all Up Next).

## Needs owner input

1. **Auto DVR:** `DVR_CLIP_PRECOMP_NAME` is never defined, and `body` is undefined in `Handlers.__MASTER_AUTO_DVR_HANDLER__` (tools.js L15456–15843). Enabling DVR from the channel action and saving recordings throw. The Up Next DVR toggle uses `new ClipName(2)` instead. Is that the intended value?
2. **Stop Hosting / Prevent Hosting:** Twitch removed hosting in 2022. Remove the feature?
3. **Tooltip `from: 'down'`** (core.js L696–705): `0 & offset.height` always gives `0`, and the case falls through to `default`, which overrides it. Intentional?
4. **Frozen tabs in RAM Alarms:** they now get `ignore`. Should they use the `high` tier's action instead?

## Not bugs (false positives, by kind)

- **"Syntax errors" in code that parses.** Examples: `2_5_0`, the labeled `break`, `?.replace`, a claimed missing `]`.
- **Polyfilled or project helpers the model didn't know.** Examples: `$.defined`, `$(sel, context)`, `.missing()`, `parseBool('text') === true`, `String..contains(...many)`.
- **Intentional idioms.** Examples: `(false || …)` alignment, `buyOut(n, back.click())`, `sole |= 0`, the FIFO balloon queue, the 16-8-8-8-24 UUID grouping, and `RestartJob` skipping a job already in `Limbo`.
- **Behaviour that is correct on inspection.** Examples: `events = push()` (the count is what the caller shows), `parseBool(message)`, the WatchTimes filter, `LIVE_REMINDERS__LISTING_INTERVAL`, `[id^="tt-time-zone-"]`, `getter-return`.
- **Dead code after an intentional `return`.** Example: Xbox/Steam `gameID`.

## Not actioned (robustness notes, not defects)

About 40 candidates flag Twitch DOM that "may be null", brittle selectors, or `innerHTML` use. These are real risks, but there is no failing case to fix. They are addressed as each feature moves to a plugin in Phase 4.
