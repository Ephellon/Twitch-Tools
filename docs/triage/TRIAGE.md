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
| background.js L880 | `act` used outside its scope | **RAM Alarms audit threw whenever any tab was frozen**; frozen tabs now get the high tier's action |
| background.js L708, L843, L948 | Out-of-scope `tab`/`id` in error paths | The error handlers themselves threw |

| tools.js L15587 | Auto DVR master handler looked up a prompt with an undefined `body` | Every master save threw |

Tooling: ESLint now sees `window.X ??=` globals, `Object.defineProperties(top, …)`, Annex B block functions (`RegisterJob` & co.) and the UMD libs, so `no-undef` went from 139 findings to 3, all in dead code (`gameID` after an intentional `return`).

## Deferred to Phase 4 (Up Next, entangled with shared state)

- tools.js L7607 `nullish('.tt-confirm')` tests a string, so the "loose interval" mitigation never runs.
- tools.js L8641–8642 `--oldIndex`/`--newIndex` in the Sortable handler. This matches the known "irregular ordering" issue.
- tools.js L8665 `ALL_FIRST_IN_LINE_JOBS[0].href` on a string, which passes `undefined` to `REDO_FIRST_IN_LINE_QUEUE`.
- tools.js L4083 `GetNextStreamer.cachedStreamer ??= randomChannel` is then treated as an array. Relevant to #50 (Stay Live).
- tools.js L3809 `FIRST_IN_LINE_WARNING_TEXT_UPDATE` is never assigned.
- GitHub issues #44–#57, #52, #55, #56 (all Up Next).

## Low priority (reported during Phase 4 testing)

The owner can still reproduce these; none is fatal.

- ~~**Left navbar bounces**~~ (#42): fixed. Twitch dropped the section icon the labeler matched, so First in Line+ re-rendered the nav every second. The followed section is now found by its cards, and re-rendered at most once per page.
- ~~**Fine Details (4)** fails~~: fixed. 401 replies were cached for a week, the request ran before the token, the reply was mis-parsed, and the saved Client-Id didn't match the token.
- **Streamer Data (1§1)** fails (non-fatal): external. The corsfix proxy has no active plan and its error arrives as a 200.
- **Pop-out chat runs no chat features** (an old bug): its readiness check needs the main controller, a follow button or a frame, and it opens no chat relay. User Scripts only run on channel pages until it has one.
- ~~**The one-minute timer doesn't show**~~ unless the drag-and-drop has been used: fixed. `REDO_FIRST_IN_LINE_QUEUE` skipped every restart after the first job, and live notifications set `FIRST_IN_LINE_HREF` without starting one. Verified live (prompt, Skip, next prompt, tagged switch).
- **Up Next job URLs repeat `?tool=`** (seen in the timer recheck). Harmless so far.
- **Up Next's Skip button can sit off-screen** (seen in the timer recheck).

## Owner decisions

1. **Auto DVR:** not a bug. `DVR_CLIP_PRECOMP_NAME` is a getter defined on `top` (tools.js L15542), and it already falls back to `new ClipName(2)`; the lint config now sees such globals. The master handler's undefined `body` is fixed. It had no prompt to look up.
2. **Stop Hosting / Prevent Hosting:** to be removed in Phase 4. Twitch dropped hosting in 2022.
3. **Tooltip `from: 'down'`** (core.js): resolved in Phase 6. The 'down' placement fell through to the default one, which overrode it, so the dead branch was removed with no change in behaviour.
4. **Frozen tabs in RAM Alarms:** they use the `high` tier's action (`ram_onhigh`, else `ignore`).

## Not bugs (false positives, by kind)

- **"Syntax errors" in code that parses.** Examples: `2_5_0`, the labeled `break`, `?.replace`, a claimed missing `]`.
- **Polyfilled or project helpers the model didn't know.** Examples: `$.defined`, `$(sel, context)`, `.missing()`, `parseBool('text') === true`, `String..contains(...many)`.
- **Intentional idioms.** Examples: `(false || …)` alignment, `buyOut(n, back.click())`, `sole |= 0`, the FIFO balloon queue, the 16-8-8-8-24 UUID grouping, and `RestartJob` skipping a job already in `Limbo`.
- **Behaviour that is correct on inspection.** Examples: `events = push()` (the count is what the caller shows), `parseBool(message)`, the WatchTimes filter, `LIVE_REMINDERS__LISTING_INTERVAL`, `[id^="tt-time-zone-"]`, `getter-return`.
- **Dead code after an intentional `return`.** Example: Xbox/Steam `gameID`.

## Not actioned (robustness notes, not defects)

About 40 candidates flag Twitch DOM that "may be null", brittle selectors, or `innerHTML` use. These are real risks, but there is no failing case to fix. They are addressed as each feature moves to a plugin in Phase 4.

## GitHub issues

| Issue | Status |
|---|---|
| #53 `reading 'name'` spam | **Fixed.** The clip-timer interval read `GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z.name` every tick, but that listener only exists while Extra Keyboard Shortcuts is on |
| #31 Recover Frames too aggressive | **Fixed.** Recovery attempts are now 10s apart (were 3s), and the page reloads after 30s of stalling (was 15s). Background tabs were already skipped |
| #57 memory | **Partly addressed** by the `PrepareForGarbageCollection` leak fix; the rest is Up Next (Phase 4) |
| #27 CPU | **Partly addressed** by the leak fix and by removing the proxy probes; the settings-page CPU use is Phase 5 |
| #18, #40, #43 reload loops | **Addressed** (owner chose defer + cap). A hidden tab now waits until it's visible before `ReloadPage` reloads it. The background skips tabs that are still loading, and respawns a tab (by ID or URL) at most once per 2 min. A skipped respawn leaves the tab open instead of closing it without a replacement |
| #52 Skip doesn't skip | **Fixed (Phase 4).** Skipping the last queued channel left its countdown running. Skip also removed a second job, and "Go now" could go to the next channel instead of the confirmed one. The next job never got a prompt |
| #55 open channel gets queued | **Fixed (Phase 4).** A channel going live while you're on its page isn't queued; bare `https://www.twitch.tv/` notifications are ignored |
| #56 Auto-Focus un-pauses Up Next | **Fixed (Phase 4).** The pause button records who paused; Auto-Focus only resumes its own pauses |
| #44 Up Next panel flashing | **Fixed (Phase 4).** The boost sync clicked the panel's toggle button (`$('[speeding]')`) every second |
| #49 loud Up Next preview | **Mitigated (Phase 4).** Player pages embedded with `muted=true` stay muted until the viewer uses them. Needs a live check |
| #50 Stay Live on offline channels | **Fixed (Phase 4).** Stay Live only moves on when the stream ended while being watched, or the extension brought you there. The viewer's intent is honoured (it never counted before) |
| #26 Lurking volume released | **Fixed (Phase 4).** Lurking restores its volume when Twitch resets it. Found with Offser (`nemotron-3-ultra`), with the fix narrowed by hand |
| #57 Up Next memory | **Partly addressed** by the Phase 2 `PrepareForGarbageCollection` leak fix. No other unbounded timer or list found by reading the code; needs a memory profile from a live tab |
| #45, #46, #54 | Need live reproduction: sidebar-based live status, the button lost on SPA navigation, and tab ownership after a manual navigation |
| #27 CPU | **Partly addressed** by the leak fix and by removing the proxy probes; the settings-page CPU use is Phase 5 |
| #34 Stay Live with 7TV | Phase 4 fixes to Stay Live may help; needs a live check with 7TV |
| #48 Buy when available toggles the menu | **Fixed (Phase 4).** Nothing stopped a new claim while one was still running, and the wait for the reward row never timed out. So every 15 s it clicked the rewards menu again (open, close) and left another poller running. Claims now run one at a time and give up after 10 s. A missing or disabled reward waits 60 s. If the row never matches, Twitch's reward-list markup has changed; needs a live check |
| #35 shop data | Twitch's `jump` data no longer carries the shop, so it is scraped from the menu. Scraped items are always "available", with no input flag; needs live data |
| #42 collapsing, #37 Auto-Focus, #13 DVR ads, #11 desync, #7 blank videos | Need live Twitch testing |
| #3 Firefox | Build exists since Phase 0; needs a gecko ID decision and a real test pass |

## Live round 4 (GitHub issues)

- ~~**#46** Up Next button gone after an in-app page change~~: fixed (2d6f7f5). Keep Pop-out's page change detached the balloon, which was never rebuilt.
- ~~**#45** a channel you don't follow shows offline~~: fixed (3e7d3c9). `Search` read `@graph[0]`, but Twitch's JSON-LD now lists `ItemList` first, so every lookup read offline. This also caused **Live Reminders sometimes not firing** (v5 has the same bug; a hand-apply write-up was sent to the owner).
- ~~**#57** Up Next memory~~: fixed (d748334). `when.defined` stacked one pending await per tick on conditions that never settle, +115 MB in 10 min. Flat after the fix.
- ~~Search results never refreshed~~: fixed (762a54f). `live` is re-read every 5 min.
- ~~v6 regression: Up Next button lost on offline channels~~: fixed (4fbc5d0). The reload cap had also stopped the watchdog. The owner's own offline channel still fails (no follow button); v5 behaves the same.
- **Verified live:** #52, #44, #49, #50, #56 (pause held), and the PR #59 security fix. #55 was N/A (no candidate channel).
- **Noted:** `new Search(x).then(Search.convertResults)` races on the global `Search.parseType`. The sidebar getters report "not listed" as offline.

## Live round 5

- ~~`Search.parseType` race~~: fixed (a739c63). Channel results now carry their own parse type.
- ~~Auto-Focus polls nonstop when its options were never opened~~: fixed (7ab71bd). Custom rows can now declare defaults, and Auto-Focus declares 0 / 3 s / webp.
- ~~Unlisted sidebar channels read offline, and every sidebar entry had an empty name~~: fixed (39f1a39). The getter half was verified live; the name half still needs a live check (`ttv-live-verify-names`).
- **#54** (Up Next error icon, 1 h timer): not reproduced in 25 min. The symptom is the non-owner tab state. Suggested fixes: re-claim ownership on `visibilitychange`/`pageshow` and every ~30 s; handle `tabs.onReplaced` in the background; don't save a due date computed while not the owner. Capture steps are in the `ttv-live-issue-54` report.

## Round 6

- ~~**Streamer Data (1§1)** crash~~: fixed (d367edb). A CORS proxy's error object reached `.slice`, and the channel ID was read twice (`/c/undefined-…`). The proxy itself is still dead (external).
- ~~**#54** ownership lost when Chrome replaces a tab~~: fixed (4d1d286, `tabs.onReplaced`). The other suggested fixes wait for a repro.
- ~~**Up Next job URLs repeat `?tool=`**~~: fixed (bc07899). `parseURL.addSearch` treated `key=value` strings as bare keys. Also in v5's `ext/polyfill.js`.
- **Open:** Up Next's Skip button can sit off-screen.

## Round 7 (owner-reported KIs)

- ~~**Not all settings are saved** (Live Reminders)~~: fixed (73fada7), **verified live**. `Cache` is twitch.tv's localStorage, which the Settings page can't read. Reminders are now mirrored to extension storage, included in Export, and merged on Restore.
- ~~**Redo jobs (†) disappear**~~: fixed (2707bea). The next job inherited the removed job's `?redo=`, and the page's search overwrote the job's own. Live verify in progress (`ttv-live-redo-jobs`).
- ~~**Blocklist doesn't block sometimes**~~: fixed (1772ddc). The rule parser dropped everything outside `[...]`, and one invalid rule aborted the whole run, so the hiding CSS was never added. Live verify in progress (`ttv-live-blocklist`).
- ~~**Silent-dialog 31px peek**~~: fixed with a 10px peek (2ce4b48).
- **Offline-stagnant state**: in progress (`ttv-live-offline-stagnant`; the owner can go live on `@ephellon`).
- **RAM ≥1 GB on `@novapovie`**: in progress (`ttv-live-ram-usage`, measured against an extension-off baseline).

## Round 7, continued (after midnight)

- ~~**Blocklist**~~: the list never arrived (Corsfix 403 was parsed as rules). It's fetched directly now (83b1023), and the parser fix is 1772ddc. **Verified live.**
- ~~**Redo jobs**~~: also the #55 guard and job restarts (89b73a5) on top of 2707bea. **Verified live** (two laps).
- ~~**Page shifted left**~~: the unshift no longer uses a hashed class (c968610). **Verified live.**
- ~~**Corsfix down (all proxied fetches)**~~: Site Access, owner's choice of optional host permissions granted in Settings (5f4528b, 8f9979d). A background `FETCH_URL` relay with proxy fallback. **Verified live** (Nintendo hosts added).
- ~~**Offline-stagnant**~~: `STREAMER.live` missed Twitch's live-home layout (3317188, **verified live** 4 runs). Follow-ups: Stay Live memory survives a reload (ede448a), Away Mode no longer flickers the quality menu on a dead player (f1e8ec0), and the watchdog tolerates an ended stream (657d9d4). Recheck pending.
- ~~**RAM**~~: no leak (heap flat). Store catalogs moved out of the JS heap (heap 200 → 115 MB), and the store card's `og:image` check read the wrong page, causing a re-parse every 5 s (ed57376). Recheck pending.
- **Open (note):** the unshift is one-shot, so a later shift (SPA back) isn't undone.

