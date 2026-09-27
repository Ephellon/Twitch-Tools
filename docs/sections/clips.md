# `clips.js` — section digests
> Generated in Phase 1 from Offser (`gemma4:31b-cloud`) digests plus facts extracted by script. Digests are summaries, not specs — verify against the code before relying on a detail.

<a id="clips-1"></a>

## /clips.js - Meant for features that can run on clip pages — L1–71

**Purpose**

Initializes environment and state for Twitch clip pages and defines a `StopWatch` utility to monitor the execution time of jobs against defined thresholds.

**Runs when**

Pages matching `clips.twitch.tv/*`.

**Defines**

- `IS_A_FRAMED_CONTAINER` — boolean; true if the window is not the top-level window.
- `here` — parsed URL object of the current page.
- `STREAMER` — object providing the clip's channel name, channel URL, and live status.
- `Clips__Initialize` — async function to bootstrap clip-specific features.
- `StopWatch` — class used to time operations and log warnings if they exceed a calculated maximum duration.

**Depends on**

`parseURL`, `Runtime`, `Timers`, `$warn`

**Twitch coupling**

- `clips.twitch.tv/*` (URL context)
- `[href*="offline_embed"i]` (selector used to determine if streamer is live)
- `searchParameters.channel` (URL parameter for channel name)

**Storage & messaging**

`Runtime.sendMessage({ action: 'FETCH_SHARED_DATA' })`

<a id="clips-72"></a>

## Networking › Video Clips — L72–158
- **Handlers:** `save_ttv_clips`
- **Timers:** `save_ttv_clips`
- **RegisterJob:** `save_ttv_clips`
- **Labels:** `__Save_TTV_Clips__`

**Purpose**

Adds a "Download this clip" link/button to the Twitch clip viewing page and the clip editor.

**Runs when**

Triggered by a one-shot timer (500ms) after page load if `Settings.save_ttv_clips` is enabled.

**Defines**

- `Handlers.save_ttv_clips` — Extracts clip metadata and injects a download link into the UI.
- `Timers.save_ttv_clips` — Sets the execution delay to 500ms.

**Depends on**

`Settings`, `RegisterJob`, `USERNAME`, `ClipName`, `parseBool`, `parseURL`, `parseTime`, `nullish`, `furnish`, `Glyphs`, `$`, `$.all`, `$.queryBy`, `$notice`

**Twitch coupling**

- `/create` (URL path for editor)
- `video` (element)
- `[data-a-target*="label"i][data-a-target*="text"i]` (editor label)
- `[class*="clip"i][class*="info"i]` (clip info container)
- `[class*="social"i][class*="button"i]:is([class*="copy"i], [class*="clip"i])` (social button)
- `[class*="social"i]:not(button, [class*="icon"i])` (social container)
- `.tw-tooltip` (tooltip class)

**Storage & messaging**

- `Settings.save_ttv_clips` (read)

<a id="clips-159"></a>

## Miscellaneous › Miscellaneous — L159–317
- **Settings keys:** `get`, `onInstalledReason`

**Purpose**

Orchestrates initialization for Twitch clips pages, handling ban detection, frame-aware navigation tracking, visual identification of SVGs, and settings synchronization.

**Runs when**

Page load (via 500ms polling interval) and periodically via a 250ms settings reloader.

**Defines**

- `Clips__Initialize_Safe_Mode` — Async initialization function for banned/restricted users.
- `Clips__PAGE_CHECKER` / `Clips__WAIT_FOR_PAGE` — Polling mechanism to determine page readiness or ban status.
- `Clips__SETTING_RELOADER` — Interval that restarts jobs queued in `window.REFRESH_ON_CHILD`.

**Depends on**

STREAMER, Settings, wait, Clips__Initialize, IS_A_FRAMED_CONTAINER, PATHNAME, Glyphs, resemble, AddCustomCSSBlock, Storage, INSTALL, RestartJob

**Twitch coupling**

- `[class*="banned"i]`
- `[data-test-selector^="content-overlay-gate"i]`
- `figure` elements containing `svg`

**Storage & messaging**

- `Settings.get()`
- `Storage.set({ onInstalledReason: null })`
