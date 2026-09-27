# Architecture

How TTV Tools is put together as of v5.35.3.3 (before the revamp). Written in Phase 1; see `REVAMP.md` for where it's heading.

- [Feature catalog](FEATURES.md): every Settings option → the code that reads it.
- [Section digests](sections/): what each part of each file does.

## 1. What runs where

`src/manifest.json` injects a different set of **classic scripts** per page. Scripts in one set share a single global scope (the extension's isolated world), so a top-level `let` in `core.js` is visible in `tools.js`. Load order matters.

| Page (match) | Scripts, in order | Entry point |
|---|---|---|
| `www.twitch.tv/*` | `ext/localforage` → `ext/polyfill` → `ext/resemble` → `ext/sortable` → `ext/glyphs` → `ext/irc` → **`core`** → **`tools`** → **`chat`** → `ext/tracking` → `ext/face` → `ext/eye` → `ext/mouth` (+ `core.css`, `extras.css`) | `Initialize()` in `tools.js`, `Chat__Initialize()` in `chat.js` |
| `www.twitch.tv/popout/*` | same libs, **`core`** → **`chat`** | `Chat__Initialize()` |
| `player.twitch.tv/*` | libs → **`core`** → **`player`** | `Player__Initialize()` |
| `clips.twitch.tv/*` | libs → **`core`** → **`clips`** | `Clips__Initialize()` |
| Options page / popup | `settings.html` → `ext/localforage`, `ext/polyfill`, `ext/glyphs`, **`core`**, **`settings`** | top-level code in `settings.js` |
| Background | `background.js` (module service worker; event page on Firefox) | top-level listeners |

All content scripts run with `all_frames: true`. `tools.js` guards its bootstrap with `if(top == window)`, so the main controller runs only in the top frame. `chat.js` also runs in embedded chat iframes and waits for either the top frame's `MAIN_CONTROLLER_READY` or its own frame to be ready.

## 2. Layers

| Layer | File(s) | Provides |
|---|---|---|
| Vendored libs | `ext/*.js` | `localforage` (IndexedDB), `Sortable`, `resemble` (image diff), face/eye/mouth tracking, `TTV_IRC` (chat IRC client), `Glyphs` (SVG icons) |
| Language/DOM polyfill | `ext/polyfill.js` | Prototype extensions (`String..equals/unlike/contains`, `Array..contains/missing/random`, `Element..getElementByText`, `HTMLVideoElement..startRecording`…), `$`/`$.all`/`$.defined`, `parseURL`, `parseBool`, `furnish`, `LANGUAGE` |
| Core | `core.js` | `UUID`, `nanoid`, `LZW`, `Tooltip`, `nullish`/`defined`/`empty`/`sated`, `when()` (poll-until promise family), `wait`/`delay`, `fetchURL`, **`Settings`**, **`Cache`**, extension-API aliases (`Runtime`, `Storage`, `Container`, `Manifest`), and the **job system** (`Jobs`, `Timers`, `Handlers`, `Unhandlers`, `Limbo`, `RegisterJob`, `UnregisterJob`, `RestartJob`, `DelayJob`) |
| Main page | `tools.js` | UI primitives (`Balloon`, `ChatFooter`, `Card`, `ContextMenu`, `Search`, `Chat`), player helpers (`Get/SetQuality`, `Get/SetVolume`, `Get/SetViewMode`), page state (`STREAMER`, `STREAMERS`, `CHANNELS`, `SEARCH`, `NOTIFICATIONS`…), then ~99 features inside `Initialize()` |
| Chat | `chat.js` | ~59 chat features inside `Chat__Initialize()`; a reduced `Chat__Initialize_Safe_Mode()` for banned / hidden chat |
| Player, clips | `player.js`, `clips.js` | Small `*__Initialize()` for the embedded player and clip pages |
| Settings UI | `settings.html/js/css` | Hand-written controls, `SaveSettings`/`LoadSettings`, JSON export/restore, translation |
| Background | `background.js` | Tab watching and respawning, Up Next ownership, update checks, raid log, shared data, memory audits (RAM alarms), keep-alive |

## 3. The feature pattern

Every feature in `tools.js`/`chat.js` follows the same shape inside its initializer:

```js
/*** Feature Name
 *   (ASCII-art banner)
 */
Handlers.feature_id = () => { … };          // does the work
Timers.feature_id = 5000;                   // >0 = setInterval, <0 = one-shot setTimeout
Unhandlers.feature_id = () => { … };        // optional: undoes it

__FeatureId__:
if(parseBool(Settings.feature_id)) {        // one-time setup, then start the job
    RegisterJob('feature_id');
}
```

- The job id **is** the settings key. That's what lets `Storage.onChanged` (below) start or stop a feature by name.
- Section banners that say `NOT A SETTING` are helpers other features rely on.
- Features share state through `Initialize()`'s closure variables and `window.*` globals, not through explicit imports. [`FEATURES.md`](FEATURES.md) and the section digests record those dependencies; they decide the order of Phase 4.

## 4. Settings lifecycle

1. **Storage.** Options live in `chrome.storage.local`. `background.js` merges any legacy `storage.sync` values into `local` on start-up.
2. **Load.** `Settings.get()` (`core.js`) copies every stored key onto the `Settings` object. Page checkers call it until `Settings.versionRetrivalDate` exists.
3. **Edit.** `settings.js` saves on input change via `SaveSettings()`.
4. **React.** `tools.js` listens with `Storage.onChanged`:
   - `true` → `RegisterJob(key)`, `false` → `UnregisterJob(key)`.
   - Other values → `RestartJob` for the feature(s) that depend on the key (a hard-coded `switch`).
   - Keys matching `EXPERIMENTAL_FEATURES` or `SENSITIVE_FEATURES` → reload the page.
   - Keys matching `REFRESHABLE_FEATURES` → restart, and flag child frames through `top.REFRESH_ON_CHILD`.
   - Keys matching `NORMALIZED_FEATURES` are ignored in `SPECIAL_MODE` pages.
   - Patterns are written with `AsteriskFn` (`*` = any suffix, `~`/`+`/`#`/`!` modifiers).
5. `chat.js`, `player.js`, `clips.js` poll with their own `*__SETTING_RELOADER` intervals instead.

## 5. Page bootstrap (top frame, `tools.js`)

1. Load `JumpedData` from `Cache.large`, and re-load it every ~11 min.
2. Open a `PING` port to the background every 3 min (keeps the service worker alive).
3. `GET_VERSION` from the background. If it doesn't match `Manifest.version`, the stale content script logs an error and stops.
4. Otherwise start `PAGE_CHECKER`, an interval (`WAIT_FOR_PAGE`) that:
   - skips `UNSAFE_TWITCH_PATHNAMES`;
   - makes sure `Settings` are loaded;
   - handles ad volume and ad-freeze refreshes;
   - calls `Initialize()` once the page is ready, then sets `window.MAIN_CONTROLLER_READY`.
5. `Initialize()` sets the log levels from settings, defines `StopWatch`, then runs every feature block in file order.

## 6. Persistence

| API | Scope | Used for |
|---|---|---|
| `Storage` (`chrome.storage.local`) | Extension-wide | Settings, `UP_NEXT_OWNER`, `buildVersion`/`githubVersion`/update flags, `RaidEvents`, `memoryAudit`, `ram_*` thresholds, `onInstalledReason`, `user_language_preference` |
| `Cache` (`core.js`, over page storage and IndexedDB via `localforage`) | Per twitch.tv origin | Feature state: `ALL_FIRST_IN_LINE_JOBS`, `FIRST_IN_LINE_DUE_DATE`, `FIRST_IN_LINE_BOOST`, `LiveReminders`, `ChannelPoints`, `AutoClaimRewards`, `DVRChannels`, `Watching`, `LastRaid`, `OLD_STREAMERS`, `BAD_STREAMERS`, `PinnedStreamer`, `UserIntent`, `PrimeSubscription*`, `oauthToken`, `clientID`, `ReadNews`, `ignoreNew`, `PREVENT_POPUPS` |
| `Cache.large` | Per origin, for >5 MiB | `JumpedData` |

Keys are prefixed `ext.twitch-tools/` in page storage.

## 7. Messaging (content ↔ background)

`Runtime.sendMessage({ action, … })`, handled by the `Runtime.onMessage` switch in `background.js`:

| Action | Purpose |
|---|---|
| `GET_VERSION` | Runtime version check at bootstrap |
| `CLAIM_UP_NEXT` / `STEAL_UP_NEXT` / `WAIVE_UP_NEXT` | Decide which tab owns the Up Next (First in Line) queue |
| `LOG_RAID_EVENT` | Append to `RaidEvents` |
| `OPEN_OPTIONS_PAGE` | Open Settings |
| `BEGIN_REPORT` / `WAIVE_REPORT` | Tab lag / hang reporting (`REPORTS`, `GALLOWS` checker) |
| `FETCH_SHARED_DATA` / `POST_SHARED_DATA` | In-memory data shared across tabs (`SHARED_DATA`) |
| `RESPAWN_THIS_TAB` | Reload or replace a crashed or stalled tab |

Other background duties:
- `Runtime.onConnect` answers `PING` with `PONG`.
- `Alarms` `ttvMemoryAudit` runs every 5 min and applies the `MEMORY_TIERS` / `ram_*` settings.
- A tab watcher sets the badge and tracks offline tabs.
- `windows.onFocusChanged` tracks the focused tab.
- `Storage.onChanged` handles the update-available flags.

## 8. Browser compatibility

- `core.js` and `background.js` pick `browser` or `chrome` as the API namespace. In `core.js` a local `let browser` shadows the global, so it always takes `chrome` (Phase 2 item).
- `scripts/build.mjs` writes a Firefox manifest: background `scripts` instead of `service_worker`, a gecko ID, and no Chrome-only keys.
