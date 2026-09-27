# `player.js` — section digests
> Generated in Phase 1 from Offser (`gemma4:31b-cloud`) digests plus facts extracted by script. Digests are summaries, not specs — verify against the code before relying on a detail.

<a id="player-1"></a>

## /player.js - Meant for features that can run on player (stream preview) pages — L1–71

**Purpose**

Initializes player-specific logic for Twitch stream preview pages and provides a `StopWatch` utility to monitor and warn about long-running jobs.

**Runs when**

Page load on `player.twitch.tv/*` sites.

**Defines**

`IS_A_FRAMED_CONTAINER` — boolean indicating if the script is executing within an iframe.
`Player__Initialize` — async function that sets up player features and the internal `StopWatch` class.
`StopWatch` — internal utility class to track execution spans and log warnings if they exceed a defined limit.

**Depends on**

`parseURL`, `Runtime`, `Timers`, `$warn`

**Twitch coupling**

`[href*="offline_embed"i]` — used to detect if a stream is offline.
`searchParameters.channel` — used to extract the streamer's name from the URL.

**Storage & messaging**

`FETCH_SHARED_DATA` — Runtime.sendMessage action to retrieve global data.

<a id="player-72"></a>

## Automation › Auto-Join › Recover Video — L72–152
- **Settings keys:** `auto_accept_mature`, `recover_video`
- **Handlers:** `auto_accept_mature`, `recover_video`
- **Timers:** `auto_accept_mature`, `recover_video`
- **RegisterJob:** `auto_accept_mature`, `recover_video`
- **Labels:** `__AutoMatureAccept__`, `__RecoverVideo__`

**Purpose**

Automates the dismissal of mature content/overlay warnings and handles stream playback errors by either clicking retry buttons or switching to the next available streamer.

**Runs when**

- `auto_accept_mature`: One-shot timeout (1s) if `Settings.auto_accept_mature` is true.
- `recover_video`: Every 5s if `Settings.recover_video` is true.

**Defines**

- `Handlers.auto_accept_mature` — Clicks buttons to dismiss mature content, watchparty, or home overlays.
- `Handlers.recover_video` — Detects player errors and attempts recovery via UI interaction or streamer switching.
- `Timers.auto_accept_mature` — Delay for mature content acceptance.
- `Timers.recover_video` — Interval for error checking.
- `RECOVERING_VIDEO` — Boolean flag to prevent concurrent recovery attempts.

**Depends on**

`$.all`, `$`, `parseBool`, `Settings`, `RegisterJob`, `nullish`, `StopWatch`, `$error`, `GetNextStreamer`, `defined`, `goto`, `parseURL`, `addToSearch`

**Twitch coupling**

- `[data-a-target*="overlay"i]`
- `[data-a-target*="watchparty"i]`
- `.home [data-a-target^="home"i]`
- `[data-test-selector*="mute"i][data-test-selector*="dismiss"i]`
- `[data-a-target*="player"i]:is([data-a-target*="content"i], [data-a-target*="gate"i]) [data-a-target*="text"i]`

**Storage & messaging**

`Settings.auto_accept_mature`, `Settings.recover_video`

<a id="player-153"></a>

## Customization › Hide Blank Ads — L153–215
- **Settings keys:** `hide_blank_ads`
- **Handlers:** `hide_blank_ads`
- **Timers:** `hide_blank_ads`
- **RegisterJob:** `hide_blank_ads`
- **Labels:** `__Hide_Blank_Ads__`

**Purpose**

Detects "blank" (purple banner) ads on the Twitch player using a CSS selector or image comparison of the video frame and reports their presence.

**Runs when**

Every 500ms (`Timers.hide_blank_ads`) if `Settings.hide_blank_ads` is enabled.

**Defines**

- `Handlers.hide_blank_ads` — logic to detect blank ads via countdown presence or frame analysis.
- `Timers.hide_blank_ads` — interval set to 500ms.
- `BLANK_AD_PRESENCE` — state tracker to prevent duplicate reporting of the same ad state.

**Depends on**

Runtime, Settings, RegisterJob, parseBool, nullish, resemble

**Twitch coupling**

- `[data-a-target*="ad-countdown"i]`
- `video` element

**Storage & messaging**

- `window.postMessage` (action: `report-blank-ad`)

<a id="player-216"></a>

## Networking › Video Clips — L216–280
- **Handlers:** `auto_dvr`
- **Timers:** `auto_dvr`
- **RegisterJob:** `auto_dvr`
- **Labels:** `__Auto_DVR__`

**Purpose**

Automatically records the video stream and triggers a file download when the URL contains `action=dvr`.

**Runs when**

Every 500ms (via `Timers.auto_dvr`) if `Settings.auto_dvr` is enabled or hardcoded to `true`.

**Defines**

`Handlers.auto_dvr` — handles the DVR recording process, blob creation, and file download.

**Depends on**

`parseURL`, `parseBool`, `Settings`, `RegisterJob`, `nullish`, `defined`, `furnish`, `window.MIME_Types`, `$.head`, `$warn`

**Twitch coupling**

`[class*="channel-status"i][class*="offline"i]` (offline status detector)

**Storage & messaging**

`window.postMessage` (action: `report-offline-dvr`)

<a id="player-281"></a>

## Miscellaneous — L281–329
- **Labels:** `__PopinButton__`, `__UnmuteEmbed__`

**Purpose**

Auto-unmutes embedded players and adds a "Go to channel" navigation button to private embeds.

**Runs when**

Player initialization (triggered via the `Miscellaneous` job block).

**Defines**

`Miscellaneous` — Logic container for embed-specific behaviors (`__UnmuteEmbed__`, `__PopinButton__`).

**Depends on**

`parseURL`, `parseBool`, `$`, `furnish`, `AddCustomCSSBlock`

**Twitch coupling**

- `figure[tt-svg-label~="unmute"i]`
- `[data-test-selector*="video-player"i][data-test-selector*="container"]`
- URL params: `channel`, `controls`, `muted`, `private`

<a id="player-330"></a>

## Miscellaneous — L330–472
- **Settings keys:** `get`, `onInstalledReason`

**Purpose**

Manages player initialization sequence (detecting ban status or readiness), monitors location changes within iframes, labels player SVGs via image comparison, and periodically restarts jobs based on setting updates.

**Runs when**

Page load (via 500ms polling for readiness and 250ms polling for settings reloading).

**Defines**

Player__PAGE_CHECKER — Interval polling for page readiness/ban status.
Player__WAIT_FOR_PAGE — Async logic to trigger either Safe Mode or standard initialization.
Player__SETTING_RELOADER — Interval polling that restarts jobs listed in `window.REFRESH_ON_CHILD`.

**Depends on**

STREAMER, Settings, wait, Player__Initialize_Safe_Mode, Player__Initialize, AddCustomCSSBlock, Storage, RestartJob, Glyphs, resemble

**Twitch coupling**

`[class*="banned"i]`, `[data-test-selector^="content-overlay-gate"i]`, `figure` elements, `svg` elements

**Storage & messaging**

Settings.get(), Storage.set ({ onInstalledReason: null }), CustomEvent('locationchange')
