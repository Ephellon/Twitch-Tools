# `tools.js` — section digests
> Generated in Phase 1 from Offser (`gemma4:31b-cloud`) digests plus facts extracted by script. Digests are summaries, not specs — verify against the code before relying on a detail.

<a id="tools-1"></a>

## /tools.js — L1–120

**Purpose**

Initializes global state, scrapes user profile data (username, theme, language) via simulated menu interactions, handles Twitch integrity failure alerts, and patches a UI bug related to channel point bonus buttons.

**Runs when**

Page load/init on `twitch.tv/*` sites; triggered by `document.readyState` changes and polling via `when`/`when.defined`.

**Defines**

`IS_A_FRAMED_CONTAINER` — boolean indicating if the page is in an iframe
`Queue` — global store for pending balloons, bullets, emotes, messages, and popups
`Messages` — Map for message storage
`PostOffice` — Map for communication/routing
`ACTIVITY` — current user's presence/activity text
`USERNAME` — current user's display name
`LANGUAGE` / `LITERATURE` — user's selected language
`THEME` — current UI theme (extracted from html class)
`ANTITHEME` — the opposite of the current theme (light vs dark)
`SPECIAL_MODE` — boolean based on presence of an exit button
`NORMAL_MODE` — boolean inverse of `SPECIAL_MODE`
`WINDOW_STATE` — mirrors `document.readyState`
`TWITCH_INTEGRITY_FAIL` — flag indicating a site-wide integrity failure

**Depends on**

`$`, `$.last`, `when`, `when.defined`, `nullish`, `Runtime`, `Cache`, `parseBool`

**Twitch coupling**

`[data-a-target="user-menu-toggle"i]`
`[data-test-target*="upsell"i][data-test-target*="banner"i]`
`[data-a-target="presence-text"i]`
`[data-a-target="user-display-name"i]`
`[data-a-target^="language"i]`
`[data-language] svg`
`[data-test-selector="exit-button"i]`
`[class*="bonus"i]`, `[data-test-selector*="points"i]`

**Storage & messaging**

`Runtime.sendMessage({ action: 'POST_SHARED_DATA', ... })`
`Cache.load('PREVENT_POPUPS', ...)`
`Cache.save({ PREVENT_POPUPS: ... })`

<a id="tools-121"></a>

## Setup (pre-init) - #MARK:classes #MARK:functions #MARK:methods — L121–697

**Purpose**

Provides a `Balloon` class to create and manage popup notification containers in the Twitch top navigation bar, allowing the addition of "jobs" (interactive notification items with links, messages, and avatars).

**Runs when**

Manually instantiated via `new Balloon()`; utilizes `setInterval` for notification counter updates.

**Defines**

`Balloon` — Class for managing popup notification containers and their contents.

**Depends on**

`furnish`, `$(sel)`, `$.all(sel)`, `Runtime`, `UUID`, `defined`, `nullish`, `Queue`, `Glyphs`, `Settings`, `THEME`, `THEME__PREFERRED_CONTRAST`, `parseURL`, `ALL_FIRST_IN_LINE_JOBS`, `Cache`, `REDO_FIRST_IN_LINE_QUEUE`, `Tooltip`

**Twitch coupling**

`.top-nav__menu > div:not(:only-child)`, `[testSelector=toggle-balloon-wrapper__mouse-enter-detector]`, `[aTarget=tt-animation-target]`, `[testSelector=center-window__content]`, `[testSelector=persistent-notification]`, `[testSelector=persistent-notification__click]`, `[testSelector=persistent-notification__body]`, `[testSelector=persistent-notification__delete]`

**Storage & messaging**

`Settings.accent_color`, `Cache` (key: `ALL_FIRST_IN_LINE_JOBS`), `Runtime.getURL`

<a id="tools-698"></a>

## Setup (pre-init) - #MARK:classes #MARK:functions #MARK:methods (cont.) — L698–1064

**Purpose**

Utility classes for creating Twitch-integrated UI components: temporary chat footers, informative viewer cards (with a deferred loading state), and a custom context menu.

**Runs when**

Instantiated via `new` calls; `ContextMenu` initializes a global `mouseup` listener on `#root` to handle menu dismissal.

**Defines**

- `ChatFooter` — Creates a temporary, self-destructing footer in the chat scroller.
- `Card` — Creates a draggable viewer information card with optional live-status footer.
- `Card.deferred` — Creates a placeholder card with a spinner, replaceable via `post()`.
- `ContextMenu` — Creates a custom right-click menu with support for icons, shortcuts, and screen-overflow correction.

**Depends on**

`furnish`, `UUID`, `Runtime`, `Glyphs`, `Tooltip`, `GetMacro`, `getOffset`, `when`, `defined`, `nullish`, `parseBool`, `$`, `$.all`

**Twitch coupling**

- `[data-a-target="chat-scroller"i]`
- `[data-a-target*="card"i] [class*="card-layer"i]`
- `viewer-card-layer__draggable`
- `[@aTarget=viewer-card-positioner]`
- `[data-a-target="emote-card"]`
- `[@aTarget=viewer-card-close-button]`
- `[@aTarget=emote-name]`
- `[@aTestSelector=emote-card-content-description]`

**Storage & messaging**

- `Runtime.getURL('profile.png')`

<a id="tools-1065"></a>

## Setup (pre-init) - #MARK:classes #MARK:functions #MARK:methods (cont.) — L1065–1684
- **Settings keys:** `low_data_mode`

**Purpose**

Utility class to fetch and normalize Twitch user, channel, and VOD data using various APIs (GQL, Helix, TwitchInsights) and a local cache.

**Runs when**

Called by other extension components to resolve IDs, usernames, or stream statuses.

**Defines**

- `Search` — Utility class for Twitch data retrieval
- `Search.cookies` — Static object containing parsed document cookies
- `Search.anonID` — Static hardcoded identifier
- `Search.cacheLeaseTime` — Static duration for cache validity based on data mode
- `Search.void` — Static method to clear cache for a specific item
- `Search.retrieve` — Static method to execute GQL requests via `fetchURL` or `XMLHttpRequest`
- `Search.convertResults` — Static method to map raw API JSON to standardized internal keys
- `Search.findUserID` — Static method to resolve username to ID via TwitchInsights
- `Search.findUsername` — Static method to resolve ID to username via TwitchInsights
- `Search.getUserStatus` — Static method to check if a user is live via CDN image probing

**Depends on**

`Settings`, `nullish`, `UUID`, `fetchURL`, `Runtime`, `SEARCH_CACHE`, `ALL_CHANNELS`, `uniqueChannels`, `defined`, `STREAMER`, `parseURL`, `parseBool`

**Twitch coupling**

- `https://gql.twitch.tv/gql` (GQL Endpoint)
- `https://api.twitch.tv/helix/channels` (Helix API)
- `https://api.twitchinsights.net/v1/user/status/` (TwitchInsights API)
- `https://spade.twitch.tv/track` (Tracking Endpoint)
- `https://static-cdn.jtvnw.net/previews-ttv/` (CDN live check)
- GQL Ops: `PlaybackAccessToken_Template`, `StreamChat`, `Chat_UserData`, `VideoAdBanner`, `WithIsStreamLiveQuery`
- URL patterns: `videos/`, `/` (channel path)

**Storage & messaging**

- `SEARCH_CACHE` (read/write)
- `ALL_CHANNELS` (write)
- `document.cookie` (read)

<a id="tools-1685"></a>

## Setup (pre-init) - #MARK:classes #MARK:functions #MARK:methods (cont.) — L1685–2235
- **Labels:** `__allbullets__`, `__allemotes__`, `__allmessages__`, `__allpinned__`, `__consumableEvents__`, `__deferredEvents__`, `__onbullet__`, `__oncommand__`, `__onmessage__`, `__onpinned__`, `__onwhisper__`

**Purpose**

Wrapper for Twitch chat interactions (sending, replying, reading, and event listening), SI-style coin number parsing, and video quality detection.

**Runs when**

Called by other extension modules or triggered by external event listeners.

**Defines**

- `Chat` — Global object for chat management (send/reply/get) and event dispatching.
- `parseCoin` — Converts localized SI strings (e.g., "1K", "1M") into integers.
- `GetQuality` — Async function to detect current stream resolution and quality flags.

**Depends on**

`$(sel)`, `$.all`, `when`, `when.defined`, `nullish`, `wait`, `STREAMER`, `TTV_IRC`, `UUID`, `LITERATURE`, `$error`

**Twitch coupling**

- `[data-test-selector$="message-container"i]`
- `[data-a-target*="delete"i]`
- `[class*="chat-restriction"i]`
- `[data-a-target="video-player"i] video`
- `[data-a-target*="player"i][data-a-target*="button"i]`
- `[data-a-target*="quality"i]`
- `PRIVMSG` (IRC protocol)
- `@reply-parent-msg-id` (IRC tag)

<a id="tools-2236"></a>

## Setup (pre-init) - #MARK:classes #MARK:functions #MARK:methods (cont.) — L2236–2684
- **Labels:** `__onchange__`

**Purpose**

Utility library for controlling Twitch video playback (quality, volume), detecting/changing view modes, retrieving user account metadata (activity, language), and providing localized string/channel filtering helpers.

**Runs when**

Called as helper functions by other extension features.

**Defines**

- `SetQuality` — changes video quality via UI interaction and polls for verification
- `GetVolume` — retrieves video volume from element or slider; includes a custom `onchange` callback registry
- `SetVolume` — updates video volume and syncs the UI slider/thumb
- `GetViewMode` — detects current layout (default, theatre, overview, fullwidth, fullscreen)
- `SetViewMode` — switches layout by clicking appropriate UI buttons
- `GetActivity` — extracts user presence text from the user menu
- `GetLanguage` — extracts user's language code from the user menu
- `ReloadPage` — refreshes page with connectivity checks and a `beforeleaving` hook
- `nth` — generates localized ordinal numbers based on `window.LANGUAGE`
- `uniqueChannels` — filter predicate to identify unique channels by name
- `isLive` — filter predicate to check if a channel is live

**Depends on**

$, $.all, when.defined, $error, nullish, defined, parseBool, UUID, top

**Twitch coupling**

- `[data-a-target*="player"i][data-a-target*="button"i]` / `[data-a-target*="item"i]` — player settings menu
- `[data-a-target*="quality"i]...input[type="radio"i]` — quality selection radio buttons
- `[data-a-target="video-player"i] video` — video element
- `[data-a-target*="player"i][data-a-target*="volume"i]` — volume slider
- `[data-test-selector*="video-container"i]` — theatre mode detection
- `[data-a-target*="fullscreen"i]` — fullscreen detection
- `[data-a-target="presence-text"i]` — user activity text
- `[data-language] svg` — user language selection

<a id="tools-2685"></a>

## Setup (pre-init) #MARK:globals #MARK:variables — L2685–3203
- **Settings keys:** `first_in_line_none`, `prevent_raiding`

**Purpose**

Initializes global state, implements a custom Picture-in-Picture (PiP) mini-player, manages cache expiration, handles dynamic settings synchronization, and processes cross-frame communication for data syncing and raid notifications.

**Runs when**

Page load (top frame), `Storage.onChanged` events, and `window.postMessage` events from `twitch.tv` origins.

**Defines**

- `PATHNAME`/`NORMALIZED_PATHNAME` — Current and cleaned URL paths.
- `STREAMER`/`STREAMERS`/`CHANNELS`/`SEARCH`/`NOTIFICATIONS`/`COMMANDS`/`ALL_CHANNELS` — Global state tracking for channels and UI elements.
- `SEARCH_CACHE` — Map for cached search results.
- `top.MiniPlayer` — Getter/Setter to manage a custom PiP iframe player.

**Depends on**

`$(sel)`, `$.all`, `furnish`, `nullish`, `defined`, `modStyle`, `when`, `wait`, `removeFromSearch`, `addToSearch`, `Glyphs`, `Cache`, `toTimeString`, `Storage`, `UnregisterJob`, `RegisterJob`, `RestartJob`, `ReloadPage`, `PostOffice`, `atob`, `parseURL`, `JUMP_DATA`, `LIVE_CACHE`, `confirm`, `goto`, `Runtime`

**Twitch coupling**

- `.stream-chat` — PiP insertion point.
- `.stream-chat-header` — PiP exit button insertion point.
- `[class*="picture-by-picture-player"i]` / `[data-test-selector="picture-by-picture-player-container"i]` — PiP container elements.
- `player.twitch.tv` — Mini-player iframe source.
- `.tt-stream-preview` — Target for ad-reporting state.

**Storage & messaging**

- `Cache`: Reads/removes `data/*` keys; saves `JumpedData`.
- `Storage.onChanged`: Listens for all setting changes to trigger `RegisterJob`/`RestartJob`.
- `Runtime.sendMessage`: Action `OPEN_OPTIONS_PAGE`.
- `window.postMessage`: Actions `jump`, `raid`, `UPDATE_STATE`, `report-blank-ad`, `report-offline-dvr`, `open-options-page`.

<a id="tools-3204"></a>

## Setup (pre-init) #MARK:globals #MARK:variables (cont.) — L3204–3709
- **Settings keys:** `context_menu_override`, `video_clips__dvr`, `video_clips__file_type`, `video_clips__length`, `video_clips__quality`

**Purpose**

1. Implements a custom, context-aware right-click menu for Twitch, providing specific actions based on whether text, links, images, or videos are targeted.
2. Scans the DOM to maintain global registries of discovered streamers from search, navigation, and notifications.
3. Defines categorization lists for extension features based on their experimental status or reload requirements.

**Runs when**

* `contextmenu` event on `$.body` (if `Settings.context_menu_override` is enabled).
* `update()` function (called externally).

**Defines**

* `update` — Asynchronously updates global path variables and discovers channels from the DOM.
* `PATHNAME` / `NORMALIZED_PATHNAME` — Current window location path and a version stripped of specific modes.
* `SEARCH` / `CHANNELS` / `STREAMERS` / `NOTIFICATIONS` / `ALL_CHANNELS` — Global arrays tracking discovered channel objects.
* `EXPERIMENTAL_FEATURES` / `SENSITIVE_FEATURES` / `NORMALIZED_FEATURES` / `REFRESHABLE_FEATURES` — Lists of feature IDs grouped by their lifecycle/flag requirements.

**Depends on**

`Settings`, `getSelection`, `parseURL`, `defined`, `furnish`, `MIME_Types`, `STREAMER`, `parseBool`, `toTimeString`, `SetQuality`, `phantomClick`, `ContextMenu`, `UUID`, `alert`, `fetchURL`, `when`, `AsteriskFn`, `uniqueChannels`, `SEARCH_CACHE`, `$.body`

**Twitch coupling**

* `[data-a-target="video-player"i]`
* `//player.twitch.tv/`
* `.search-tray`
* `[data-test-selector="live-badge"i]`
* `[id*="side"i][id*="nav"i] .side-nav-section`
* `[data-test-selector^="onsite-notifications"i]`
* `twitch.tv/search?term=`

**Storage & messaging**

* Settings read: `context_menu_override`, `video_clips__dvr`, `video_clips__file_type`, `video_clips__quality`, `video_clips__length`.

<a id="tools-3710"></a>

## Initialization #MARK:initializer — L3710–3781

**Purpose**

Defines global constants and regular expressions for identifying specific Twitch URL paths and provides a cache for storing channel/streamer metadata.

**Runs when**

Script initialization.

**Defines**

- `PRIVATE_SYMBOL` — Unique token representing the current window.
- `LIVE_CACHE` — Map used to cache streamer/channel details (login, game, title, etc.).
- `TWITCH_PATHNAMES` — List of strings/patterns identifying Twitch URL path segments.
- `RESERVED_TWITCH_PATHNAMES` — Regex for matching reserved Twitch paths.
- `UNSAFE_PATHNAMES` / `window.UNSAFE_PATHNAMES` — List of path segments considered unsafe.
- `UNSAFE_TWITCH_PATHNAMES` / `window.UNSAFE_TWITCH_PATHNAMES` — Regex for matching unsafe Twitch paths.

**Depends on**

UUID

**Twitch coupling**

Twitch URL path segments (e.g., `/dashboard`, `/settings`, `/directory`, `/videos`, `/subs`).

<a id="tools-3782"></a>

## First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon — L3782–4185
- **Settings keys:** `display_in_console`, `display_in_console__error`, `display_in_console__ignore`, `display_in_console__log`, `display_in_console__notice`, `display_in_console__remark`, `display_in_console__warn`, `experimental_mode`, `first_in_line_none`, `next_channel_preference`, `stay_live`

**Purpose**

Initializes general extension settings (logging, feature toggles) and provides the core logic for determining the next streamer to visit based on user preferences, pinned channels, or scraped search results.

**Runs when**

*   Extension initialization (`Initialize` call).
*   Periodically every 250ms (global anchor observer).
*   When `GetNextStreamer()` is invoked.

**Defines**

*   `Initialize` — Async setup function for logging, feature filtering, and global helpers.
*   `StopWatch` — Class to monitor and warn about the execution time of named jobs.
*   `GetNextStreamer` — Logic engine that returns the next target channel based on priorities (explicit click $\rightarrow$ pinned $\rightarrow$ "Up Next" queue $\rightarrow$ preference-based selection).
*   `SEARCH` — Array of channel objects scraped from the Twitch search tray.

**Depends on**

`Settings`, `parseBool`, `$log`, `$warn`, `$error`, `$remark`, `$notice`, `Timers`, `Jobs`, `UnregisterJob`, `NORMALIZED_FEATURES`, `EXPERIMENTAL_FEATURES`, `$.all`, `parseURL`, `RESERVED_TWITCH_PATHNAMES`, `Cache`, `STREAMERS`, `isLive`, `parseCoin`, `when`, `Search`, `NORMALIZED_PATHNAME`, `SEARCH_CACHE`, `uniqueChannels`, `PrepareForGarbageCollection`

**Twitch coupling**

*   `a[href]` with `twitch.tv` regex
*   `.search-tray a[href^="/"]`
*   `[data-test-selector*="search-result"i][data-test-selector*="channel"i] a`
*   `[data-test-selector="live-badge"i]`
*   `https://www.twitch.tv/`

**Storage & messaging**

*   `Cache`: 'PinnedStreamer', 'ChannelPoints', 'LiveReminders'

<a id="tools-4186"></a>

## First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon (cont.) — L4186–4867
- **Settings keys:** `show_stats`
- **Labels:** `__eventlisteners__`, `__shop__`

**Purpose**

Centralized data provider (`STREAMER` object) that scrapes Twitch DOM and external APIs (StreamElements, NightBot, TwitchMetrics) to provide metadata about the current channel, user permissions, and stream status.

**Runs when**

Accessed on-demand via getters when other extension features request channel or user data.

**Defines**

`STREAMER` — global object providing read-access to channel state (name, game, points, sub status, permissions, etc.) and helper methods for following/unfollowing.

**Depends on**

`Chat`, `parseCoin`, `COMMANDS`, `fetchURL`, `PostOffice`, `parseURL`, `NORMALIZED_PATHNAME`, `LIVE_CACHE`, `SPECIAL_MODE`, `Settings`, `scoreTagActivity`, `Tooltip`, `USERNAME`, `Search`, `Color`, `THEME`, `parseTime`, `Cache`, `DOMParser`

**Twitch coupling**

- `[data-test-selector*="balance-string"i]` (Channel points balance)
- `[data-a-target="stream-title"i]` (Stream title)
- `[data-a-target$="game-link"i]`, `[data-a-target$="game-name"i]` (Game/Category)
- `[class*="video-player"i] [class*="media-card"i]` (Live/Rerun detection)
- `[data-a-target="subscribed-button"i]` (Subscription status)
- `[data-a-target^="live-notifications"i][data-a-target$="on"i]` (Notification status)
- `[data-a-target$="viewers-count"i]` (Viewer count)
- `[data-a-target="follow-button"i]`, `[data-a-target="unfollow-button"i]` (Follow status/actions)

**Storage & messaging**

- `Cache.large.load/save`: `points_shop_${ STREAMER.sole }`
- `Cache.load`: `ChannelPoints`

<a id="tools-4868"></a>

## First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon (cont.) — L4868–5529
- **Settings keys:** `fine_details`, `first_in_line`, `first_in_line_all`, `first_in_line_all_time_minutes`, `first_in_line_now`, `first_in_line_plus`, `first_in_line_plus_time_minutes`, `first_in_line_time_minutes`
- **Labels:** `__FineDetails__`, `__GetAllChannels__`

**Purpose**

Collects streamer data from the side navigation, notifications, and external analytics sites (TwitchMetrics, TwitchStats, TwitchTracker) to calculate stream end times for the "First in Line" feature and enables dragging of streamer icons.

**Runs when**

During extension initialization (implied L4873), on raid/host events (`STREAMER.onraid`, `STREAMER.onhost`), and conditionally when `Settings.fine_details` is enabled.

**Defines**

- `NOTIFICATIONS` — Array of scrapped onsite notification channel objects.
- `ALL_CHANNELS` — Consolidated list of all discovered channels/streamers.
- `CHANNELS` — Followed channels from side nav (excluding current).
- `STREAMERS` — Followed streamers from side nav (excluding current).
- `STREAMER.onraid`/`onhost` — Event handlers that reset the "First in Line" due date.

**Depends on**

`STREAMER`, `NORMALIZED_PATHNAME`, `GetNextStreamer`, `Cache`, `NEW_DUE_DATE`, `FIRST_IN_LINE_DUE_DATE`, `parseURL`, `uniqueChannels`, `ALREADY_EXPANDED`, `Search`, `LIVE_CACHE`, `Settings`, `USERNAME`, `fetchURL`, `toTimeString`, `addReport`, `parseTime`

**Twitch coupling**

- `main a[href$="${NORMALIZED_PATHNAME}"]` — Main streamer icon.
- `[data-test-selector^="onsite-notifications"i]` — Notification container.
- `[data-a-target="side-nav-arrow"i]` — Side nav toggle button.
- `[data-a-target$="show-more-button"i]` / `show-less-button` — Nav expansion buttons.
- `[id*="side"i][id*="nav"i] .side-nav-section` — Followed channels list.
- `[class*="--offline"i]` — Offline status indicator.
- `/videos/` — URL path for identifying VODs.

**Storage & messaging**

- `Cache.save`/`load`: `FIRST_IN_LINE_DUE_DATE`, `data/${STREAMER.name}`.
- `sessionStorage`: `TTV-Tools-failed-to-get`.
- `LIVE_CACHE`: Internal data store for backup streamer info.

<a id="tools-5530"></a>

## OBSOLETE OBSOLETE OBSOLETE OBSOLETE OBSOLETE OBSOLETE OBSOLETE OBSOLETE — L5530–5731
- **Settings keys:** `get`, `up_next__one_instance`

**Purpose**

Fetches detailed channel information via the Twitch Helix API and manages the OAuth2 authentication flow (token acquisition, validation, and storage).

**Runs when**

*   When `FETCHED_OK` is false.
*   Via `setInterval(update, 2_5_0)`.
*   On load/execution if `Settings.up_next__one_instance` is true.

**Defines**

`LIVE_REMINDERS__LISTING_INTERVAL` — listing interval for live reminders.

**Depends on**

`fetchURL`, `STREAMER`, `Search`, `nullish`, `$remark`, `defined`, `Cache`, `$warn`, `ErrGet`, `addReport`, `parseBool`, `Settings`, `$log`, `UP_NEXT_ALLOW_THIS_TAB`, `DOMParser`, `$.getElementByText`, `confirm`, `UUID`, `open`, `when`, `Runtime`

**Twitch coupling**

*   `https://api.twitch.tv/helix/users`
*   `https://id.twitch.tv/oauth2/token`
*   `https://id.twitch.tv/oauth2/authorize`
*   `https://id.twitch.tv/oauth2/validate`
*   `/directory/category/just-chatting`
*   `client_?id\s?[:=](["'`])(\w+)\1` (regex for client ID scraping)

**Storage & messaging**

*   `Cache`: `clientID`, `oauthToken`, `data/${STREAMER.name}`
*   `Settings`: `oauthToken`
*   `Runtime.sendMessage`: `WAIVE_UP_NEXT`

<a id="tools-5732"></a>

## Automation › Auto-Join — L5732–5773
- **Settings keys:** `auto_accept_mature`
- **Handlers:** `auto_accept_mature`
- **Timers:** `auto_accept_mature`
- **RegisterJob:** `auto_accept_mature`
- **Labels:** `__AutoMatureAccept__`

**Purpose**

Automates clicking bypass buttons for mature content warnings, watchparty overlays, and home-page redirects to join a stream.

**Runs when**

- Every 5000ms if `Settings.auto_accept_mature` is true.
- On `mousedown` of elements linking to the current streamer's channel.

**Defines**

- `Handlers.auto_accept_mature` — clicks maturity, watchparty, or home-page overlay buttons.
- `Timers.auto_accept_mature` — 5000ms interval for the auto-accept handler.
- `IGNORE_ZOOM_STATE` — tracks if the home state was triggered by a trusted user interaction.

**Depends on**

Handlers, Timers, RegisterJob, parseBool, Settings, $.all, STREAMER, when, $

**Twitch coupling**

- `[data-a-target*="mature"i]`
- `[data-a-target*="class"i]`
- `[data-a-target*="watchparty"i]`
- `.home`
- `[data-a-target^="home"i]`
- `[href$="${ STREAMER.name }"i]`

**Storage & messaging**

`Settings.auto_accept_mature`

<a id="tools-5774"></a>

## Auto-Focus — L5774–6085
- **Settings keys:** `auto_focus`, `auto_focus_detection_threshold`, `auto_focus_poll_image_type`, `auto_focus_poll_interval`, `show_stats`
- **Handlers:** `auto_focus`
- **Unhandlers:** `auto_focus`
- **Timers:** `auto_focus`
- **RegisterJob:** `auto_focus`
- **Labels:** `__AutoFocus_Disable_AwayMode__`, `__AutoFocus_Enable_AwayMode__`, `__AutoFocus_Pause_UpNext__`, `__AutoFocus_Resume_UpNext__`, `__AutoFocus__`

**Purpose**

Monitors stream visual activity by comparing video frames to detect movement trends, automatically toggling "Up Next" and "Away Mode" based on whether the stream is becoming more or less active.

**Runs when**

Triggered by `RegisterJob('auto_focus')` if `Settings.auto_focus` is true; executes periodically via `setInterval` (`CAPTURE_INTERVAL`).

**Defines**

- `scoreTagActivity` — Calculates a numeric activity score based on Twitch category tags.
- `Handlers.auto_focus` — Main logic for frame capture, image comparison via `resemble`, and trend-based setting adjustments.
- `Unhandlers.auto_focus` — Cleans up UI elements and clears the capture interval.
- `Timers.auto_focus` — One-shot timeout set to 1000ms.

**Depends on**

`Settings`, `STREAMER`, `$`, `$.all`, `nullish`, `wait`, `resemble`, `furnish`, `getOffset`, `parseBool`, `$log`, `$warn`, `GET_TIME_REMAINING`, `UP_NEXT_ALLOW_THIS_TAB`, `GetQuality`, `RestartJob`, `RegisterJob`, `Handlers`, `Unhandlers`, `Timers`

**Twitch coupling**

- `video` elements (via `$.all('video')`)
- `.chat-list--default` (UI parent for stats)
- `#up-next-control` (Up Next toggle button)
- `#away-mode` (Away Mode toggle button)
- Directory tag IDs/Names (e.g., `FPS`, `ACTION`, `4D1EAA36...`)

**Storage & messaging**

- `Settings.auto_focus`
- `Settings.auto_focus_detection_threshold`
- `Settings.auto_focus_poll_interval`
- `Settings.auto_focus_poll_image_type`
- `Settings.show_stats`

<a id="tools-6086"></a>

## Lurking — L6086–6420
- **Settings keys:** `accent_color`, `away_mode`, `away_mode__hide_chat`, `away_mode__volume`, `away_mode__volume_control`, `away_mode_placement`, `low_data_mode`
- **Handlers:** `away_mode`
- **Unhandlers:** `away_mode`
- **Timers:** `away_mode`
- **RegisterJob:** `away_mode`
- **Labels:** `__AwayMode__`

**Purpose**

Implements an "Away Mode" (Lurking) feature that reduces stream quality, optionally lowers volume and hides chat to save bandwidth/resources. Adds a toggle button to the Twitch UI and supports time-based scheduling.

**Runs when**

- Every 1000ms (via `Timers.away_mode`).
- On page load if `Settings.away_mode` is enabled (via `RegisterJob`).
- On keyboard shortcut `Alt+A` / `Opt+A`.
- On click of the `#away-mode` button.
- On volume change (`GetVolume.onchange`).

**Defines**

- `Handlers.away_mode` — Main logic for creating/updating the Away Mode button and applying quality/volume/view settings.
- `Unhandlers.away_mode` — Removes the Away Mode button from the DOM.
- `Timers.away_mode` — Interval timer set to 1000ms.
- `AwayModeButton` — Global reference to the active Away Mode button object.
- `AwayModeStatus` / `AwayModeEnabled` — State trackers for whether lurking is currently active.

**Depends on**

StopWatch, GetQuality, GLOBAL_EVENT_LISTENERS, NORMALIZED_PATHNAME, GetNextStreamer, STREAMER, goto, parseURL, Cache, Settings, furnish, getOffset, Tooltip, Glyphs, SetQuality, GetVolume, SetVolume, GetViewMode, SetViewMode, GetMacro, toTimeString, RegisterJob, when

**Twitch coupling**

- `[data-a-target*="ad-countdown"i]`
- `[data-a-target="player-controls"i] [class*="player-controls"i][class*="right-control-group"i] > :last-child`
- `[data-test-selector="live-notifications-toggle"i]`
- `[data-target="channel-header-right"i] [style] div div:not([style])`
- `:is(video, [class*="video"i][class*="render"i]) ~ * .player-controls`
- `video` (element)

**Storage & messaging**

- `Cache.load`/`save` (`AwayModeEnabled`)
- `Settings` (`away_mode`, `away_mode_placement`, `away_mode__volume_control`, `away_mode__volume`, `away_mode__hide_chat`, `away_mode_schedule`)

<a id="tools-6421"></a>

## Auto-claim Channel Points › Claim Loot — L6421–6491
- **Settings keys:** `claim_loot`
- **Handlers:** `claim_loot`
- **Timers:** `claim_loot`
- **RegisterJob:** `claim_loot`
- **Labels:** `__ClaimLoot__`

**Purpose**

Auto-opens the Prime Gaming loot menu and automatically claims available rewards or dismisses them.

**Runs when**

`Settings.claim_loot` is enabled, `UP_NEXT_ALLOW_THIS_TAB` is truthy, and the `claim_loot` job timer (1s one-shot) triggers.

**Defines**

- `Handlers.claim_loot` — logic to toggle the loot menu, iterate through offers, and perform claim/dismiss actions.
- `Timers.claim_loot` — duration for the `claim_loot` job (-1000ms).

**Depends on**

`when`, `when.defined`, `when.sated`, `$`, `$.all`, `nullish`, `defined`, `$notice`, `$remark`, `parseBool`, `Settings`, `RegisterJob`, `Handlers`, `Timers`

**Twitch coupling**

- `.prime-offers button`
- `[class*="prime"i][class*="offer"i][class*="header"i] ~ *`
- `button[data-a-target*="prime-claim"i]`
- `[data-a-target*="prime"i][data-a-target*="claim"i]`
- `[class*="prime-offer"i][class*="dismiss"i] button`
- `[class*="prime"i][class*="empty"i]`
- `[data-a-target*="prime-offer"i][data-a-target*="game"i][data-a-target*="title"i]`
- `[data-a-target*="prime-offer"i][data-a-target*="title"i]:not([data-a-target*="game"i])`

**Storage & messaging**

`Settings.claim_loot`

<a id="tools-6492"></a>

## Claim Prime - Still requires trusted interaction — L6492–6557
- **Settings keys:** `claim_prime`, `claim_prime__max_claims`
- **Handlers:** `claim_prime`
- **Timers:** `claim_prime`
- **RegisterJob:** `claim_prime`
- **Labels:** `__ClaimPrime__`

**Purpose**

Automates the claiming and renewal of Twitch Prime subscriptions for a specific channel.

**Runs when**

- `Settings.claim_prime` is enabled.
- `UP_NEXT_ALLOW_THIS_TAB` is true.
- Triggered as a one-shot timer 5 seconds after registration via `RegisterJob('claim_prime')`.

**Defines**

- `Handlers.claim_prime` — Logic to detect, warn, and execute the Prime subscription claim process.
- `Timers.claim_prime` — One-shot timeout delay of 5000ms.

**Depends on**

`Cache`, `STREAMER`, `Settings`, `confirm`, `postMessage`, `when`, `nullish`, `parseBool`, `RegisterJob`, `$remark`, `$warn`

**Twitch coupling**

- `[data-a-target="subscribe-button"i]`
- `.channel-root .support-panel input[type="checkbox"i]`
- `.support-panel`

**Storage & messaging**

- Cache keys: `PrimeSubscription`, `PrimeSubscriptionReclaims`.
- Settings keys: `claim_prime`, `claim_prime__max_claims`.
- `postMessage` action: `open-options-page`.

<a id="tools-6558"></a>

## Claim Reward — L6558–7296
- **Settings keys:** `claim_reward`, `record_foreign_rewards`, `show_stats`, `video_clips__dvr`, `video_clips__file_type`, `video_clips__length`, `video_clips__quality`, `video_clips__trophy`, `video_clips__trophy_length`
- **Handlers:** `claim_reward`
- **Unhandlers:** `claim_reward`
- **Timers:** `claim_reward`
- **RegisterJob:** `claim_reward`
- **Labels:** `__ClaimReward__`, `__RecordForeignRewards__`

**Purpose**

Automates the purchase of Twitch channel point rewards, manages a "buy list" with pre-defined answers, provides mass-unlock/modify buttons for emotes, and records video clips of successful redemptions.

**Runs when**

* Timer: `claim_reward` every 15s.
* Interval: `DISPLAY_WALLET_BUTTONS` every 300ms.
* Event: `Chat.onbullet` (if `Settings.record_foreign_rewards` is enabled).
* Trigger: User interaction with custom UI buttons ("Unlock All", "Modify All", "Buy + Record", "Buy when available").
* Condition: `Settings.claim_reward` (on by default).

**Defines**

* `RECORD_PURCHASE` — Validates reward claims and triggers video recording of the event.
* `Handlers.claim_reward` — Orchestrates the auto-purchase process for queued rewards.
* `Unhandlers.claim_reward` — Stops the reward UI update interval.
* `VideoClips` — Configuration object for trophy recording settings.

**Depends on**

`Settings`, `STREAMER`, `Cache`, `Recording`, `SetQuality`, `Glyphs`, `parseBool`, `parseCoin`, `parseTime`, `toTimeString`, `furnish`, `when`, `$, $.all`, `comify`, `encodeHTML`, `GetFileSystem`, `Chat`, `prompt`, `alert`, `confirm`, `PrepareForGarbageCollection`, `getOffset`, `UUID`, `USERNAME`

**Twitch coupling**

* `[data-test-selector*="chat"i] [data-test-selector*="points"i][data-test-selector*="summary"i] button` (Reward menu toggle)
* `[data-a-target="chat-input"i]` (Chat input field)
* `.rewards-list .reward-list-item` (Reward list entries)
* `[data-test-selector*="required"i][data-test-selector*="points"i]` (Point cost indicator)
* `#channel-points-reward-center-header` (Current reward title)
* `[class*="unlock"i][class*="emote"i][class*="checkout"i]` (Emote unlock screen)
* `[class*="modify"i][class*="emote"i][class*="checkout"i]` (Emote modification screen)
* `.reward-center-body` (Reward detail container)

**Storage & messaging**

* `AutoClaimRewards` (Cache: mapped reward IDs per streamer)
* `AutoClaimAnswers` (Cache: pre-filled input answers per reward)

<a id="tools-7297"></a>

## Claim Drops — L7297–7365
- **Settings keys:** `claim_drops`, `claim_drops__interval`
- **Handlers:** `claim_drops`
- **Unhandlers:** `claim_drops`
- **Timers:** `claim_drops`
- **RegisterJob:** `claim_drops`
- **Labels:** `__ClaimDrops__`

**Purpose**

Auto-claims available Twitch Drops by loading the inventory page in a hidden iframe and programmatically clicking claim buttons.

**Runs when**

`Settings.claim_drops` and `UP_NEXT_ALLOW_THIS_TAB` are true; triggered by `Timers.claim_drops` (5s one-shot timeout).

**Defines**

- `Handlers.claim_drops` — creates hidden iframe, initializes the recursive claim checker, and sets up the refresh interval.
- `Unhandlers.claim_drops` — removes the iframe and clears the refresh interval.
- `Timers.claim_drops` — 5-second initial delay before starting the claim process.

**Depends on**

`furnish`, `when`, `$.defined`, `$.all`, `$.nullish`, `getDOMPath`, `pluralSuffix`, `alert.timed`, `parseURL`, `parseBool`, `Settings`, `RegisterJob`, `$remark`

**Twitch coupling**

- `/drops/inventory` (URL)
- `.tw-tower *:not([class*="tooltip"i]) > button:not([class*="image"i]):not([disabled], [aria-label*="refresh"i])` (button selector)
- `path:is([clip-rule~="evenodd"i], [fill-rule~="evenodd"i])` (SVG selector)
- `.tw-alert-banner` (error selector)

**Storage & messaging**

- `Settings.claim_drops` (read)
- `Settings.claim_drops__interval` (read)

<a id="tools-7366"></a>

## First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon — L7366–7915
- **Settings keys:** `first_in_line`, `first_in_line_all`, `first_in_line_all_time_minutes`, `first_in_line_now`, `first_in_line_plus`, `first_in_line_plus_time_minutes`, `first_in_line_time_minutes`, `stream_preview`

**Purpose**

Manages an "Up Next" queue of streamers, handling automatic redirection timers, user confirmation prompts, and a UI balloon for pinning streamers and adjusting queue speed.

**Runs when**

- `REDO_FIRST_IN_LINE_QUEUE` (manual/automatic trigger).
- `FIRST_IN_LINE_WARNING_JOB` (1s interval) — triggers confirmation prompt when < 1 min remains.
- `FIRST_IN_LINE_JOB` (1s interval) — monitors channel status and handles expiration/redirection.
- `FIRST_IN_LINE_SAFETY_CATCH` (1s interval) — mitigates missed intervals.
- `FIRST_IN_LINE_BALLOON__INSURANCE` (1s interval) — maintains the "Up Next" UI balloon.
- Balloon button clicks (pinned streamer management, queue boosting).

**Defines**

- `FIRST_IN_LINE_WAIT_TIME` — calculates wait duration based on `Settings`.
- `top.REDO_FIRST_IN_LINE_QUEUE` — resets queue timers and targets.
- `top.NEW_DUE_DATE` — calculates timestamp for the next redirection.
- `top.GET_TIME_REMAINING` — computes milliseconds until the current job expires.

**Depends on**

`Settings`, `parseBool`, `nullish`, `defined`, `furnish`, `wait`, `STREAMER`, `Runtime`, `Cache`, `parseURL`, `ALL_CHANNELS`, `Search`, `toTimeString`, `confirm`, `goto`, `Balloon`, `Tooltip`, `Glyphs`, `AddCustomCSSBlock`, `RemoveCustomCSSBlock`, `autocomplete`, `PrepareForGarbageCollection`, `delay`

**Twitch coupling**

- `https://player.twitch.tv/?channel=...` (embedded preview iframe)
- `https://static-cdn.jtvnw.net/ttv-static-metadata/twitch_logo3.jpg` (fallback icon)
- `STREAMER` (current channel object)

**Storage & messaging**

- **Storage (Cache):** `ALL_FIRST_IN_LINE_JOBS`, `FIRST_IN_LINE_DUE_DATE`, `LiveReminders`, `PinnedStreamer`.
- **Messaging:** `Runtime.sendMessage({ action: 'UPDATE_PINNED_STREAMER', ... })`.

<a id="tools-7916"></a>

## First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon (cont.) — L7916–8465
- **Settings keys:** `accent_color`, `set`, `video_clips__dvr`

**Purpose**

Manages the "Up Next" balloon UI, providing controls to pause the queue, a searchable catalog of live reminders with channel status and point information, and toggles for DVR recording of those channels.

**Runs when**

- User clicks "Pause" button in the balloon.
- User clicks "Live Reminders" catalog button.
- User types in the reminder search input.
- User interacts with reminder entries (Remove, MiniPlayer, or DVR toggle).
- Every 1s (via intervals) to update elapsed time and help tooltips.

**Defines**

- `first_in_line_pause_button` — UI button to toggle `FIRST_IN_LINE_PAUSED`.
- `live_reminders_catalog_button` — UI button to toggle between "Up Next" and "Live Reminders" views.
- `first_in_line_help_button` — UI button showing instructions for queuing channels.
- `LIVE_REMINDERS__LISTING_INTERVAL` — Interval updating `.tt-time-elapsed` labels.

**Depends on**

`$.all`, `parseBool`, `furnish`, `Cache`, `Glyphs`, `UUID`, `Search`, `AddCustomCSSBlock`, `RemoveCustomCSSBlock`, `autocomplete`, `alert`, `confirm`, `toTimeString`, `Runtime`, `STREAMER`, `CSSObject`, `Color`, `Tooltip`, `Settings`, `wait`, `MiniPlayer`, `ClipName`, `PrepareForGarbageCollection`

**Twitch coupling**

- `[up-next--body]`, `[up-next--header]` — Balloon UI structure.
- `https://static-cdn.jtvnw.net/channel-points-icons/` — Point icon assets.
- `[id^="tt-balloon-container"i]` — Balloon wrapper.
- `STREAMER.jump` — Channel metadata cache.
- `Search` — Twitch channel lookup utility.

**Storage & messaging**

- `Cache`: `FIRST_IN_LINE_BOOST`, `FIRST_IN_LINE_DUE_DATE`, `FIRST_IN_LINE_WAIT_TIME`, `LiveReminders`, `ChannelPoints`, `DVRChannels`, `ALL_FIRST_IN_LINE_JOBS`, `data/${ name }`.
- `Settings`: `LIVE_REMINDERS`, `DVR_CHANNELS`, `video_clips__dvr`, `accent_color`.

<a id="tools-8466"></a>

## First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon (cont.) — L8466–8850
- **Settings keys:** `first_in_line_none`

**Purpose**

Manages a queue of Twitch channels to visit ("Up Next"), including calculating execution timers, handling a "boost" mode to accelerate the queue, and providing a drag-and-drop UI balloon for queue management.

**Runs when**

- `setInterval` every 1s (listing updates and timer animations).
- `ondrop` event on `FIRST_IN_LINE_BALLOON.body` (adding channels via links).
- `onmouseenter`/`onmouseleave` on `FIRST_IN_LINE_BALLOON.icon` (tooltip display).
- `Sortable` `onUpdate` event (reordering the queue).

**Defines**

- `ALL_FIRST_IN_LINE_JOBS` — Array of URLs in the "Up Next" queue.
- `FIRST_IN_LINE_BOOST` — Boolean flag indicating if the queue is being rushed.
- `FIRST_IN_LINE_DUE_DATE` — Timestamp for when the next channel should be visited.
- `FIRST_IN_LINE_LISTING_JOB` — Interval ID for updating the UI list.
- `FIRST_IN_LINE_SORTING_HANDLER` — `Sortable` instance for the queue UI.

**Depends on**

`parseBool`, `NEW_DUE_DATE`, `STREAMER`, `GET_TIME_REMAINING`, `wait`, `toTimeString`, `parseURL`, `Tooltip`, `defined`, `nullish`, `Search`, `uniqueChannels`, `Cache.save`, `$log`, `$warn`, `$error`, `$remark`, `$notice`, `REDO_FIRST_IN_LINE_QUEUE`, `Sortable`, `furnish`, `getOffset`, `getDOMPath`, `StopWatch`, `goto`, `nth`, `THEME`

**Twitch coupling**

- `[up-next--body] [time]`
- `[up-next--container] button`
- `div#root`
- `[live][time][name="..."]`
- `.tt-balloon-subheader`
- `.tt-balloon-message`

**Storage & messaging**

- `Cache.save`: `ALL_FIRST_IN_LINE_JOBS`, `FIRST_IN_LINE_DUE_DATE`

<a id="tools-8851"></a>

## First in Line — L8851–9316
- **Settings keys:** `first_in_line`, `first_in_line_all`, `first_in_line_none`, `first_in_line_now`, `first_in_line_plus`
- **Handlers:** `first_in_line`
- **Unhandlers:** `first_in_line`
- **Timers:** `first_in_line`
- **RegisterJob:** `first_in_line`
- **Labels:** `__FirstInLine__`

**Purpose**

Manages a queue of channels to visit ("First in Line"), automatically detecting live notifications to populate the list and scheduling timed transitions to the next stream.

**Runs when**

- Every 1000ms via `Timers.first_in_line`.
- On initialization if `Settings.first_in_line` (or plus/all/now) is true.
- On `top.onlocationchange` event.
- Every 100ms via `setInterval` for rainbow border updates.

**Defines**

- `Handlers.first_in_line` — Processes notifications to add channels to the "Up Next" queue.
- `Unhandlers.first_in_line` — Clears timers and resets queue state after a 5s delay.
- `Timers.first_in_line` — Interval (1000ms) for the queue handler.

**Depends on**

StopWatch, parseURL, UUID, Cache, REDO_FIRST_IN_LINE_QUEUE, NEW_DUE_DATE, GET_TIME_REMAINING, FIRST_IN_LINE_BALLOON, Search, goto, nth, toTimeString, THEME, ALL_CHANNELS, isLive, uniqueChannels

**Twitch coupling**

- `[data-test-selector*="notifications"i] [data-test-selector*="notification"i]` — Notification elements.
- `[up-next--body]` — Up Next status element.
- `[class*="toast"i][class*="action"i]` — Actionable toast notifications.
- `[live][time][name="${ name }"i]` — Live status indicators.
- `/ ${ STREAMER.name }` — Channel URL pathname.

**Storage & messaging**

- Cache keys: `ALL_FIRST_IN_LINE_JOBS`, `FIRST_IN_LINE_DUE_DATE`, `FIRST_IN_LINE_BOOST`.

<a id="tools-9317"></a>

## First in Line+ (on creation) — L9317–9449
- **Settings keys:** `first_in_line_all`, `first_in_line_plus`, `onInstalledReason`
- **Handlers:** `first_in_line_plus`
- **Unhandlers:** `first_in_line_plus`
- **Timers:** `first_in_line_plus`
- **RegisterJob:** `first_in_line_plus`
- **Labels:** `__FirstInLinePlus__`

**Purpose**

Monitors the side navigation for new live streamers and triggers a "first in line" notification when a streamer who wasn't previously live appears.

**Runs when**

Every 1000ms (via `Timers.first_in_line_plus`) if `Settings.first_in_line_plus` or `Settings.first_in_line_all` is enabled.

**Defines**

- `Handlers.first_in_line_plus` — Logic to detect new live streamers and trigger notifications.
- `Timers.first_in_line_plus` — Polling interval (1000ms).
- `Unhandlers.first_in_line_plus` — Reference to `Unhandlers.first_in_line`.

**Depends on**

`Cache`, `StopWatch`, `STREAMERS`, `STREAMER`, `isLive`, `nullish`, `defined`, `parseBool`, `wait`, `USERNAME`, `Settings`, `CHROME_UPDATE`, `SHARED_MODULE_UPDATE`, `INSTALL`, `UPDATE`, `parseURL`, `location`, `addReport`, `Handlers.first_in_line`, `RegisterJob`

**Twitch coupling**

- `[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] a[class*="side-nav-card"i]` (Followed channels list)
- `[data-a-target="side-nav-search-input"i]` (Side nav search)
- `[data-a-target="side-nav-header-expanded"i]` (Side nav header)
- `[data-a-target="side-nav-arrow"i]` (Side nav arrow)
- `[class*="expand"i]` (Side nav expander)
- URL search parameter `obit`

**Storage & messaging**

- Cache keys: `OLD_STREAMERS`, `BAD_STREAMERS`.
- `addReport` (reporting failed channel details).

<a id="tools-9450"></a>

## Live Reminders — L9450–9725
- **Settings keys:** `keep_live_reminders`, `live_reminders`, `set`
- **Handlers:** `live_reminders`
- **Unhandlers:** `live_reminders`
- **Timers:** `live_reminders`
- **RegisterJob:** `live_reminders`
- **Labels:** `__Live_Reminders__`

**Purpose**

Adds a "Live Reminders" system allowing users to toggle notifications for when specific streamers go live via a button in the channel's About section and a background polling checker.

**Runs when**

- Page load (if `Settings.live_reminders` is enabled or undefined).
- `Timers.live_reminders` (-2500ms one-shot timeout).
- `LIVE_REMINDERS__CHECKER` (initial 5s delay, then every 300s).

**Defines**

- `Handlers.live_reminders` — Injects the reminder toggle button into the Twitch action panel.
- `Unhandlers.live_reminders` — Removes reminder buttons and clears polling intervals.
- `Timers.live_reminders` — Execution timing for the handler.
- `LIVE_REMINDERS__CHECKER` — Polls reminded streamers to detect when they transition to live.

**Depends on**

`StopWatch`, `Cache`, `STREAMER`, `Settings`, `furnish`, `Glyphs`, `sated`, `pluralSuffix`, `parseBool`, `empty`, `Search`, `ALL_CHANNELS`, `parseURL`, `toTimeString`, `GetNextStreamer`, `PrepareForGarbageCollection`, `RegisterJob`, `Handlers.first_in_line`, `alert.timed`

**Twitch coupling**

- `.about-section__actions` (action panel container)
- `.about-section` (about page container)
- `STREAMER.name`
- `STREAMER.live`
- `STREAMER.data.actualStartTime`
- `STREAMER.data.lastSeen`

**Storage & messaging**

- Cache: `LiveReminders`
- Settings: `keep_live_reminders`, `live_reminders`, `LIVE_REMINDERS`

<a id="tools-9726"></a>

## Game Overview Card | Store Integration — L9726–9936
- **Settings keys:** `simplify_look_auto_marquee`, `store_integration`
- **Handlers:** `game_overview_card`

**Purpose**

Fetches game metadata via Open Graph to render an information card in the about section and prepares string normalization logic for store integration.

**Runs when**

Triggered via `Handlers.game_overview_card`.

**Defines**

- `Handlers.game_overview_card` — Logic to fetch game metadata and render a visual overview card.
- `normalize` — Utility to strip trademarks and special characters from game titles for store searching.

**Depends on**

STREAMER, parseURL, fetchURL, DOMParser, furnish, Tooltip, Settings, getOffset, ISO_639_1, parseBool, nullish

**Twitch coupling**

- `STREAMER.game`
- `[data-a-target$="game-link"i]`
- `.about-section__panel--content`

**Storage & messaging**

- `Settings.simplify_look_auto_marquee`
- `Settings.store_integration`

<a id="tools-9937"></a>

## Get the Steam link (if applicable) — L9937–10173
- **Settings keys:** `store_integration__steam`

**Purpose**

Fetches Steam store metadata (links, pricing, maturity ratings) for the currently played game and injects a purchase link and updated description into the Twitch UI.

**Runs when**

Enabled via `Settings.store_integration__steam`.

**Defines**

`fetchSteamGame` — Async function that retrieves game data from a GitHub catalog or the Steam search suggestion API.

**Depends on**

`Settings`, `parseBool`, `fetchURL`, `normalize`, `SteamRegExp`, `PARTIAL_MATCH_THRESHOLD`, `ITEM_NOT_FOUND`, `$.all`, `furnish`, `when`, `defined`, `nullish`, `DOMParser`, `$warn`, `$log`, `Glyphs`, `gameURI`, `counCode`, `langName`, `gameID`

**Twitch coupling**

`#tt-steam-purchase`, `[data-twitch-provided-description]`, `[data-test-selector="chat-card-title"]`

**Storage & messaging**

`Settings.store_integration__steam` (read)

<a id="tools-10174"></a>

## Get the PlayStation link (if applicable) — L10174–10473
- **Settings keys:** `store_integration__playstation`

**Purpose**

Searches for the current game on the PlayStation Store (via a GitHub catalog or direct scraping) to provide pricing, direct purchase links, improved game descriptions, and content maturity ratings.

**Runs when**

Triggered when `Settings.store_integration__playstation` is enabled and a game is identified.

**Defines**

`fetchPlayStationGame` — async helper to locate and validate game data from PSN via JSON catalog or HTML scraping.

**Depends on**

`Settings`, `parseBool`, `fetchURL`, `normalize`, `PlayStationRegExp`, `PARTIAL_MATCH_THRESHOLD`, `ITEM_NOT_FOUND`, `$.all`, `$`, `DOMParser`, `furnish`, `when`, `defined`, `nullish`, `MATURE_HINTS`, `RATING_STYLING`, `$warn`, `$log`

**Twitch coupling**

`#tt-playstation-purchase`, `[data-twitch-provided-description]`, `[data-test-selector="chat-card-title"]`, `.game-card-img[ok="false"i]`, `#tt-content-rating-placeholder`

**Storage & messaging**

`fetchURL.fromDisk` (local cache)

<a id="tools-10474"></a>

## Get the Xbox link (if applicable) — L10474–10837
- **Settings keys:** `store_integration__xbox`

**Purpose**

Fetches and displays Xbox store information (links, pricing, maturity ratings, and descriptions) for the current game, including special handling for Jackbox Party packs.

**Runs when**

Triggered when `Settings.store_integration__xbox` is enabled (likely during a game-detection process providing the `game` variable).

**Defines**

`fetchXboxGame` — Async function that retrieves game data from a GitHub catalog or the Microsoft Store API.

**Depends on**

`Settings`, `parseBool`, `fetchURL`, `normalize`, `XboxRegExp`, `PARTIAL_MATCH_THRESHOLD`, `ITEM_NOT_FOUND`, `lang`, `gameURI`, `nullish`, `furnish`, `when`, `DOMParser`, `MATURE_HINTS`, `RATING_STYLING`, `defined`, `Glyphs`, `$log`, `$warn`

**Twitch coupling**

- `#tt-xbox-purchase` (UI placeholder)
- `[data-twitch-provided-description]` (Description element)
- `[data-test-selector="chat-card-title"]` (Title element)
- `.game-card-img[ok="false"i]` (Image element)

**Storage & messaging**

`Settings.store_integration__xbox`

<a id="tools-10838"></a>

## Get the Nintendo link (if applicable) — L10838–11205
- **Settings keys:** `store_integration__nintendo`

**Purpose**

Fetches and integrates Nintendo eShop game data (price, links, images, and descriptions) into the Twitch UI, including updating game descriptions and adding purchase links to chat cards.

**Runs when**

Triggered when `Settings.store_integration__nintendo` is enabled (likely during game detection/page load).

**Defines**

`fetchNintendoGame` — async helper that retrieves game metadata via a GitHub catalog or Algolia search fallback.

**Depends on**

`Settings`, `parseBool`, `fetchURL`, `normalize`, `NintendoRegExp`, `PARTIAL_MATCH_THRESHOLD`, `ITEM_NOT_FOUND`, `encodeURI`, `furnish`, `when`, `Tooltip`, `DOMParser`, `defined`, `nullish`, `$warn`, `$log`

**Twitch coupling**

`[data-twitch-provided-description]`, `[data-test-selector="chat-card-title"]`, `.game-card-img[ok="false"i]`, `#tt-nintendo-purchase`, `#tt-purchase-container`

**Storage & messaging**

`Settings.store_integration__nintendo`

<a id="tools-11206"></a>

## Get the Epic link (if applicable) — L11206–11403
- **Settings keys:** `game_overview_card`, `store_integration__epic`
- **Unhandlers:** `game_overview_card`
- **Timers:** `game_overview_card`
- **RegisterJob:** `game_overview_card`
- **Labels:** `__GameOverviewCard__`

**Purpose**

Searches for the current game on the Epic Games Store (via a GitHub catalog or GraphQL API) to insert a purchase link, price, and maturity warning into the UI. Additionally, it configures the "Game Overview Card" feature.

**Runs when**

- `Settings.store_integration__epic` is enabled (for Epic link logic).
- `Settings.game_overview_card` is enabled (to register the `game_overview_card` job).

**Defines**

- `fetchEpicGame` — Async function that retrieves game metadata from Epic sources.
- `Timers.game_overview_card` — Interval for the game overview card job.
- `Unhandlers.game_overview_card` — Removes the `#game-overview-card` element.

**Depends on**

`parseBool`, `Settings`, `fetchURL`, `normalize`, `EpicRegExp`, `PARTIAL_MATCH_THRESHOLD`, `ITEM_NOT_FOUND`, `nullish`, `counCode`, `lang`, `furnish`, `parseURL`, `when`, `DOMParser`, `Glyphs`, `$log`, `$warn`, `$remark`, `RegisterJob`

**Twitch coupling**

- `#tt-epic-purchase` (Insertion point for Epic store link).
- `#game-overview-card` (Removal target for overview card).

**Storage & messaging**

- `Settings.store_integration__epic`
- `Settings.game_overview_card`

<a id="tools-11404"></a>

## Auto-Follow — L11404–11484
- **Settings keys:** `auto_follow_all`, `auto_follow_raids`, `auto_follow_time`, `auto_follow_time_minutes`
- **Handlers:** `auto_follow_raids`, `auto_follow_time`
- **Timers:** `auto_follow_raids`, `auto_follow_time`
- **RegisterJob:** `auto_follow_raids`, `auto_follow_time`
- **Labels:** `__AutoFollowRaid__`, `__AutoFollowTime__`

**Purpose**

Automatically follows streamers if the user arrives via a raid or watches the stream for a configurable minimum duration.

**Runs when**

Every 1000ms if `Settings.auto_follow_raids`, `Settings.auto_follow_time`, or `Settings.auto_follow_all` are enabled.

**Defines**

- `STARTED_WATCHING` — timestamp used to calculate elapsed session watch time.
- `CURRENT_WATCHTIME_NAME` — cache key for the current streamer's accumulated watch time.
- `GET_WATCH_TIME()` — returns total watch time in milliseconds.
- `Handlers.auto_follow_raids` — logic to follow streamer based on URL params or `LastRaid` cache.
- `Handlers.auto_follow_time` — logic to follow streamer after a set time threshold.
- `Timers.auto_follow_raids` — 1000ms interval.
- `Timers.auto_follow_time` — 1000ms interval.

**Depends on**

STREAMER, Cache, parseURL, parseBool, nullish, Settings, RegisterJob, StopWatch, Handlers, Timers

**Twitch coupling**

- `STREAMER.name`
- `STREAMER.like`
- `STREAMER.follow()`
- URL query parameters `referrer=raid` or `raided`

**Storage & messaging**

- Cache: `WatchTimes/{streamer_name}`
- Cache: `LastRaid`

<a id="tools-11485"></a>

## Kill Extensions › Parse Commands — L11485–12050
- **Settings keys:** `kill_extensions`, `parse_commands`, `parse_commands__create_links`
- **Handlers:** `kill_extensions`, `parse_commands`
- **Unhandlers:** `kill_extensions`, `parse_commands`
- **Timers:** `kill_extensions`, `parse_commands`
- **RegisterJob:** `kill_extensions`, `parse_commands`
- **Labels:** `__KillExtensions__`, `__ParseCommands__`

**Purpose**

Hides Twitch extension UI elements and parses `!command` text in the stream title/panels into styled elements with tooltips. It also provides a command suggestion autocomplete menu in the chat input.

**Runs when**

* **Kill Extensions**: Every 2,500ms if `Settings.kill_extensions` is enabled.
* **Parse Commands**: 1,000ms after load if `Settings.parse_commands` is enabled; on `keyup` event in the chat input.

**Defines**

* `Handlers.kill_extensions` — Hides extension views and popovers.
* `Unhandlers.kill_extensions` — Restores extension views by removing style attributes.
* `parseCommands` — Resolves placeholders (e.g., `(user.points)`) in strings using user, channel, and game data.
* `decodeMD` — Converts a custom Markdown subset (including special script fonts) to HTML.
* `Handlers.parse_commands` — Scans page for `!commands` and replaces them with tooltipped `<code>` elements.
* `Unhandlers.parse_commands` — Reverts parsed commands in the stream title to plain text.

**Depends on**

StopWatch, $.all, parseBool, Settings, RegisterJob, STREAMER, USERNAME, Chat, toTimeString, parseCoin, decodeHTML, encodeHTML, Tooltip, THEME__PREFERRED_CONTRAST, Glyphs, parseURL, AddCustomCSSBlock, RemoveCustomCSSBlock, delay, furnish, UUID

**Twitch coupling**

* `[class*="extension"i]:is([class*="view"i], [class*="popover"i])`
* `[class^="extension-view"i]`
* `[data-a-target="stream-title"i]`
* `[data-a-target="about-panel"i]`
* `[data-a-target^="panel"i]`
* `[data-a-target="chat-input"i]`
* `#root`
* `#tt-points-receipt`

**Storage & messaging**

* `Settings.kill_extensions`
* `Settings.parse_commands`
* `Settings.parse_commands__create_links`
* `STREAMER.coms`

<a id="tools-12051"></a>

## Auto-Badge — L12051–12134
- **Settings keys:** `auto_badge`
- **Handlers:** `auto_badge`
- **Unhandlers:** `auto_badge`
- **Timers:** `auto_badge`
- **RegisterJob:** `auto_badge`
- **Labels:** `__AutoBadge__`

**Purpose**

Adds broadcaster, moderator, and VIP status badges to the username suggestions in the Twitch chat autocomplete dropdown.

**Runs when**

`keyup` event on the chat input, provided `Settings.auto_badge` is enabled (or unset), the input contains `@`, and a 100ms debounce delay has passed.

**Defines**

- `Handlers.auto_badge` — logic to detect autocomplete elements and inject status badges.
- `Unhandlers.auto_badge` — removes all injected status badges from autocomplete elements.
- `Timers.auto_badge` — one-shot timeout (1000ms) for initializing the handler.

**Depends on**

`$(sel)`, `$.all`, `delay`, `furnish`, `STREAMER`, `Chat`, `$.nullish`, `Settings`, `parseBool`, `$remark`, `RegisterJob`, `AddCustomCSSBlock`, `UUID`

**Twitch coupling**

- `[data-a-target="chat-input"i]`
- `[class*="autocomplete"i] button[data-a-target^="@"]`
- `data-a-target` (attribute on autocomplete buttons)
- `p` (tag inside autocomplete buttons)
- `img[data-badge="owner"i]`
- `img[data-badge="mod"i]`
- `img[data-badge="vip"i]`

**Storage & messaging**

- `Settings.auto_badge` (read)

<a id="tools-12135"></a>

## Stop Hosting — L12135–12195
- **Settings keys:** `prevent_hosting`
- **Handlers:** `prevent_hosting`
- **Timers:** `prevent_hosting`
- **RegisterJob:** `prevent_hosting`
- **Labels:** `__PreventHosting__`

**Purpose**

Detects when the current Twitch channel is hosting another streamer and optionally navigates away to either the guest's channel (if unfollowed) or the next available followed streamer.

**Runs when**

Every 5000ms (via `Timers.prevent_hosting`) if `Settings.prevent_hosting` is not `"none"`.

**Defines**

- `Handlers.prevent_hosting` — Logic to detect hosting state and perform navigation/notifications.
- `Timers.prevent_hosting` — Interval duration (5000ms) for the hosting check.

**Depends on**

StopWatch, GetNextStreamer, STREAMER, STREAMERS, Settings, $log, goto, parseURL, defined, RegisterJob, $

**Twitch coupling**

- `[data-a-target="hosting-indicator"i]`
- `[class*="status"i][class*="hosting"i]`
- `[href^="/"] h1`
- `[href^="/"] > p`

**Storage & messaging**

- `Settings.prevent_hosting` (read)

<a id="tools-12196"></a>

## Stop Raiding — L12196–12328
- **Settings keys:** `prevent_raiding`
- **Handlers:** `prevent_raiding`
- **Timers:** `prevent_raiding`
- **RegisterJob:** `prevent_raiding`
- **Labels:** `__PreventRaiding__`

**Purpose**

Detects if the user is raiding or being raided; either redirects them to the next followed streamer or allows them to stay to collect channel points ("greed" mode) or if the target is already followed.

**Runs when**

Every 10 seconds via `Timers.prevent_raiding`, provided `Settings.prevent_raiding` is not `"none"`.

**Defines**

- `Handlers.prevent_raiding` — Logic to detect raid status and execute redirection or retention.
- `Timers.prevent_raiding` — 10s interval for the raid stopper check.
- `CONTINUE_RAIDING` — Global flag to bypass raid redirection.
- `SHADOW_RAID` — Global flag identifying a resumed raid session from `Cache`.

**Depends on**

`StopWatch`, `parseURL`, `parseBool`, `GetNextStreamer`, `STREAMER`, `Settings`, `addToSearch`, `removeFromSearch`, `Cache`, `goto`, `Runtime`, `ALL_FIRST_IN_LINE_JOBS`, `FIRST_IN_LINE_HREF`, `FIRST_IN_LINE_DUE_DATE`, `STREAMERS`

**Twitch coupling**

- `[data-test-selector="raid-banner"i]`
- `referrer=raid` (URL parameter)
- `raided=true` (URL parameter)

**Storage & messaging**

- `Cache`: `LastRaid`, `ALL_FIRST_IN_LINE_JOBS`, `FIRST_IN_LINE_DUE_DATE`
- `Runtime.sendMessage`: `STEAL_UP_NEXT`

<a id="tools-12329"></a>

## Greedy Raiding — L12329–12393
- **Settings keys:** `greedy_raiding`
- **Handlers:** `greedy_raiding`
- **Unhandlers:** `greedy_raiding`
- **Timers:** `greedy_raiding`
- **RegisterJob:** `greedy_raiding`
- **Labels:** `__GreedyRaiding__`

**Purpose**

Maintains hidden iframes of popout chats for other live streamers to simulate presence/activity (greedy raiding).

**Runs when**

Every 5000ms if `UP_NEXT_ALLOW_THIS_TAB` is truthy and `Settings.greedy_raiding` is enabled.

**Defines**

- `GREEDY_RAIDING_FRAMES` — Map tracking active raiding iframes by channel name.
- `Handlers.greedy_raiding` — Logic to create/refresh hidden popout chat iframes for live channels.
- `Timers.greedy_raiding` — Execution interval (5s).
- `Unhandlers.greedy_raiding` — Cleanup function to remove all raiding iframes.

**Depends on**

`STREAMER`, `STREAMERS`, `isLive`, `$`, `furnish`, `CSSObject`, `Settings`, `parseBool`, `$remark`, `RegisterJob`, `Handlers`, `Unhandlers`, `Timers`

**Twitch coupling**

- Popout chat URL: `./popout/${name}/chat`
- `twitch.tv` (as URL parent)

**Storage & messaging**

- `Settings.greedy_raiding` (read)

<a id="tools-12394"></a>

## Stay Live — L12394–12482
- **Settings keys:** `stay_live`, `stay_live__ignore_channel_reruns`
- **Handlers:** `stay_live`
- **Timers:** `stay_live`
- **RegisterJob:** `stay_live`
- **Labels:** `__StayLive__`

**Purpose**

Automatically redirects the user to the next live followed channel when the current streamer goes offline or is playing a rerun.

**Runs when**

Every 3000ms via `Timers.stay_live` if `Settings.stay_live` is enabled.

**Defines**

- `Handlers.stay_live` — Logic to detect offline/rerun status and navigate to the next available stream.
- `Timers.stay_live` — Interval timer (3000ms) for the stay live check.

**Depends on**

StopWatch, GetNextStreamer, STREAMER, Cache, parseBool, TWITCH_PATHNAMES, $warn, REDO_FIRST_IN_LINE_QUEUE, parseURL, FIRST_IN_LINE_HREF, ALL_FIRST_IN_LINE_JOBS, UP_NEXT_ALLOW_THIS_TAB, goto, Runtime.sendMessage, $notice, Settings, RegisterJob, USERNAME, PATHNAME

**Twitch coupling**

- `STREAMER.live` (online status)
- `STREAMER.redo` (rerun status)
- `STREAMER.name` (channel identifier)
- `/search` (URL path for search pages)

**Storage & messaging**

- Cache: `UserIntent` (read/write/remove)
- Runtime.sendMessage: `STEAL_UP_NEXT`

<a id="tools-12483"></a>

## Time Zones — L12483–13032

**Purpose**

Provides regular expressions and mapping tables (abbreviations and geographic names) to identify and convert various time zone formats to UTC offsets.

**Defines**

- `TIME_ZONE__TEXT_MATCHES` — Array to store detected time zone text matches.
- `TIME_ZONE__REGEXPS` — Collection of regex patterns for parsing natural time, Zulu, and GMT/UTC formats.
- `TIME_ZONE__CONVERSIONS` — Map of timezone abbreviations (e.g., EST, JST) to UTC offsets.
- `GEOGRAPHIC__CONVERSIONS` — Map of city/region names to UTC offsets.

<a id="tools-13033"></a>

## Time Zones (cont.) — L13033–13738
- **Settings keys:** `time_zones`
- **Handlers:** `time_zones`
- **Timers:** `time_zones`
- **RegisterJob:** `time_zones`
- **Labels:** `__TimeZones__`

**Purpose**

Detects time zone mentions in stream titles and panels and converts them to the user's local time.

**Runs when**

Every 250ms via `Timers.time_zones` if `Settings.time_zones` is enabled.

**Defines**

- `convertWordsToTimes` — normalizes text and replaces time-related words/ranges with standardized time strings.
- `convertWordsToTimes.inReverse` — converts standardized time strings back into descriptive words.
- `Handlers.time_zones` — main loop that scans DOM elements for time zones, calculates local equivalents, and renders them as interactive spans.

**Depends on**

`fetchURL`, `STREAMER`, `$.all`, `$`, `defined`, `nullish`, `GEOGRAPHIC__CONVERSIONS`, `TIME_ZONE__CONVERSIONS`, `TIME_ZONE__REGEXPS`, `NON_TIME_ZONE_WORDS`, `TIME_ZONE__TEXT_MATCHES`, `furnish`, `nanoid`, `THEME__PREFERRED_CONTRAST`, `Tooltip`, `wait`, `parseBool`, `Settings`, `RegisterJob`, `$remark`

**Twitch coupling**

- `[data-a-target="stream-title"i]`
- `[data-a-target="about-panel"i]`
- `[data-a-target^="panel"i]`
- `[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i]):not([class*="offline"i]) > p + p`
- `STREAMER.data?.actualStartTime`

<a id="tools-13739"></a>

## @notImplemented — L13739–13792
- **Settings keys:** `phone_number`
- **Handlers:** `common_phrase_translations`, `phone_number`
- **Timers:** `common_phrase_translations`, `phone_number`
- **RegisterJob:** `common_phrase_translations`, `phone_number`
- **Labels:** `__CommonPhraseTranslations__`, `__PhoneNumber__`

**Purpose**

Identifies phone numbers (currently unimplemented) and automatically converts common phrases (e.g., "Twitch ToS") into hyperlinks.

**Runs when**

- `phone_number`: Every 250ms if `Settings.phone_number` is enabled.
- `common_phrase_translations`: Every 250ms unconditionally.

**Defines**

- `Handlers.phone_number` — logic to parse phone numbers (currently no-op).
- `Timers.phone_number` — interval for phone number handler.
- `Handlers.common_phrase_translations` — replaces common phrases with legal links.
- `Timers.common_phrase_translations` — interval for translation handler.

**Depends on**

`Handlers`, `Timers`, `parseBool`, `Settings`, `$remark`, `RegisterJob`, `defined`

**Twitch coupling**

- `/legal/terms-of-service/` (URL)
- `/(Twitch|T.?T.?V|The)(.?s)?\s+(T\W?o\W?S\W?|Terms(?:.+of.+Service)?)/i` (ToS phrase regex)

**Storage & messaging**

`Settings.phone_number`

<a id="tools-13793"></a>

## View Mode › Chat & Messaging › Emote Searching - NOT A SETTING. This is a hlper for "Conve — L13793–13832
- **Settings keys:** `view_mode`
- **Handlers:** `view_mode`
- **Timers:** `view_mode`
- **RegisterJob:** `view_mode`
- **Labels:** `__ViewMode__`

**Purpose**

Manages the activation and execution of "View Mode" by calling `SetViewMode`.

**Runs when**

`Settings.view_mode` is truthy; triggered via `RegisterJob('view_mode')` with a 2.5s one-shot timeout.

**Defines**

`Handlers.view_mode` — wrapper function that calls `SetViewMode` with the current setting or a provided mode.

**Depends on**

Settings, Handlers, Timers, parseBool, RegisterJob, SetViewMode

**Storage & messaging**

`Settings.view_mode`

<a id="tools-13833"></a>

## BetterTTV Emotes › Convert Emotes › Filter Messages › Easy Filter - NOT A SETTING. This is — L13833–13880

**Purpose**

Visual section headers (ASCII art) organizing code for BetterTTV Emotes, Convert Emotes, Filter Messages, and the Easy Filter helper.

<a id="tools-13881"></a>

## Highlight Phrases › Easy Highlighter - NOT A SETTING. This is a helper for "Highlight Phra — L13881–13928

**Purpose**

Section headers and ASCII art for phrase and message highlighting features.

<a id="tools-13929"></a>

## Native Twitch Reply › Link maker › Auto-chat (VIP) · @dskw1 › Prevent spam — L13929–13976

**Purpose**

- Organizational banners for "Native Twitch Reply", "Link maker", "Auto-chat (VIP) · @dskw1", and "Prevent spam" sections.

<a id="tools-13977"></a>

## Notification Sounds › Mention Audio — L13977–14039
- **Settings keys:** `mention_audio`, `whisper_audio_sound`
- **Handlers:** `mention_audio`
- **Unhandlers:** `mention_audio`
- **Timers:** `mention_audio`
- **RegisterJob:** `mention_audio`
- **Labels:** `__NotificationSounds_Mentions__`

**Purpose**

Plays an audio notification when the user is mentioned in Twitch chat.

**Runs when**

`Settings.mention_audio` is enabled; triggered by new messages via `Chat.onmessage`.

**Defines**

- `NOTIFIED` — State tracking for mention, phrase, and whisper notifications.
- `NOTIFICATION_EVENTS` — Registry for notification-related event handlers.
- `NOTIFICATION_SOUND` — Audio element utilizing a user-configurable sound file.
- `Handlers.mention_audio` — Setup logic to listen for mentions and trigger audio playback.
- `Unhandlers.mention_audio` — Logic to pause the notification sound.
- `Timers.mention_audio` — One-shot timeout (1000ms) before the handler runs.

**Depends on**

$, furnish, Runtime, Settings, Handlers, StopWatch, Chat, USERNAME, Timers, Unhandlers, parseBool, RegisterJob

**Twitch coupling**

- `Chat.onmessage`
- `mentions` (property of chat message object)

**Storage & messaging**

- `Settings.whisper_audio_sound` (read)
- `Settings.mention_audio` (read)

<a id="tools-14040"></a>

## Phrase Audio › Whisper Audio — L14040–14119
- **Settings keys:** `phrase_audio`, `whisper_audio`
- **Handlers:** `phrase_audio`, `whisper_audio`
- **Unhandlers:** `phrase_audio`, `whisper_audio`
- **Timers:** `phrase_audio`, `whisper_audio`
- **RegisterJob:** `phrase_audio`, `whisper_audio`
- **Labels:** `__NotificationSounds_Phrases__`, `__NotificationSounds_Whispers__`

**Purpose**

Plays notification sounds when specific chat messages (marked as `tt-light`) are received or when whispers are received/whisper counts increase.

**Runs when**

- Every 1000ms if `Settings.phrase_audio` is enabled.
- Every 1000ms if `UP_NEXT_ALLOW_THIS_TAB` and `Settings.whisper_audio` are enabled.
- Triggered by `Chat.onmessage` and `Chat.onwhisper` events.

**Defines**

- `Handlers.phrase_audio` — logic for playing sounds on specific chat messages.
- `Unhandlers.phrase_audio` — stops notification sound for phrases.
- `Timers.phrase_audio` — 1000ms interval for phrase audio checks.
- `Handlers.whisper_audio` — logic for playing sounds on whispers or whisper pill updates.
- `Unhandlers.whisper_audio` — stops notification sound for whispers.
- `Timers.whisper_audio` — 1000ms interval for whisper audio checks.

**Depends on**

StopWatch, NOTIFICATION_EVENTS, Chat, when, defined, NOTIFICATION_SOUND, parseBool, Settings, RegisterJob, $, nullish, NOTIFIED, UP_NEXT_ALLOW_THIS_TAB

**Twitch coupling**

- `.whispers__pill` (selector for whisper count pill).
- `tt-light` (attribute on chat elements).

**Storage & messaging**

- `Settings.phrase_audio` (read).
- `Settings.whisper_audio` (read).

<a id="tools-14120"></a>

## Currencies › Convert Bits › Rewards Calculator › Customization — L14120–14322
- **Settings keys:** `block_banners`
- **Handlers:** `block_banners`
- **Unhandlers:** `block_banners`
- **Timers:** `block_banners`
- **Labels:** `__BlockBanners__`

**Purpose**

Fetches remote banner-blocking rules, parses them using a custom traversal syntax, marks matching DOM elements with a random data attribute, and hides them via a global CSS rule.

**Runs when**

`Settings.block_banners` is true; triggered every 2500ms (`Timers.block_banners`) and on `mouseup` events on `$.body`.

**Defines**

- `Handlers.block_banners` — fetches, parses, and marks banner elements for hiding.
- `Unhandlers.block_banners` — removes the custom CSS rule used to hide banners.
- `Timers.block_banners` — polling interval (2500ms) for the blocking handler.
- `UNWANTED_BANNER_AD_SELECTOR` — unique random string used as a data attribute key to mark banned elements.
- `LAST_ELEMENT` — symbol marker for the selector parsing logic.
- `EMPTY_ELEMENT_SUBSTITUTE` — fallback object for empty selector paths.

**Depends on**

`nanoid`, `fetchURL`, `$.all`, `defined`, `parseBool`, `$remark`, `AddCustomCSSBlock`, `RemoveCustomCSSBlock`, `DelayJob`, `Settings`, `Handlers`, `Unhandlers`, `Timers`

**Storage & messaging**

`Settings.block_banners`

<a id="tools-14323"></a>

## Points Receipt & Ranking — L14323–14659
- **Settings keys:** `channelpoints_receipt_display`, `points_receipt_placement`, `show_stats`
- **Handlers:** `points_receipt_placement`
- **Unhandlers:** `points_receipt_placement`
- **Timers:** `points_receipt_placement`
- **RegisterJob:** `points_receipt_placement`
- **Labels:** `__GetMultiplierAmount__`, `__PointsReceiptPlacement__`

**Purpose**

Tracks and displays a "receipt" of channel points earned and spent during a session, and calculates/displays the user's point rank relative to the channel's audience.

**Runs when**

Triggered by `RegisterJob('points_receipt_placement')` (if `Settings.points_receipt_placement` is enabled); `Chat.onbullet` for 'coin' subjects; `mouseup` events on specific reward/vote buttons.

**Defines**

- `UpdateReceiptDisplay` — updates the receipt UI with calculated earnings, spending, and estimated available points.
- `Handlers.points_receipt_placement` — initializes the point ranking and receipt display elements.
- `Unhandlers.points_receipt_placement` — clears tracking intervals and removes receipt/ranking UI.
- `Timers.points_receipt_placement` — sets a -2,500ms one-shot timeout for job startup.

**Depends on**

`Settings`, `Glyphs`, `STREAMER`, `$(sel)`, `$.all`, `furnish`, `parseBool`, `defined`, `nullish`, `parseCoin`, `StopWatch`, `RestartJob`, `PostOffice`, `Chat`, `Tooltip`, `USERNAME`, `LANGUAGE`, `nth`

**Twitch coupling**

- `[data-test-selector="chat-input-button-container"i]`
- `.live-time`
- `[data-test-selector*="balance-string"i]`
- `[data-test-selector^="prediction-checkout"i]`
- `[data-test-selector*="user-prediction"i]`
- `#channel-points-reward-center-header h6`
- `[data-test-selector*="points"i][data-test-selector*="summary"i] button`
- `[class*="community"i][class*="stack"i] [data-test-selector^="expanded"i] button`

**Storage & messaging**

`PostOffice.get('points_receipt_placement')`

<a id="tools-14660"></a>

## Point Watcher — L14660–14894
- **Settings keys:** `point_watcher_placement`
- **Handlers:** `point_watcher_placement`
- **Unhandlers:** `point_watcher_placement`
- **Timers:** `point_watcher_placement`
- **RegisterJob:** `point_watcher_placement`
- **Labels:** `__PointWatcherPlacement__`

**Purpose**

Displays channel point balances in tooltips and the balance string; scrapes streamer reward data into `STREAMER.__shop__`.

**Runs when**

Enabled via `Settings.point_watcher_placement`; starts after the balance button is detected; runs every 250ms via `Timers.point_watcher_placement`.

**Defines**

- `Handlers.point_watcher_placement` — Updates point display elements and caches point data.
- `Unhandlers.point_watcher_placement` — Removes `.tt-point-amount` elements from the DOM.
- `Timers.point_watcher_placement` — Sets the handler interval to 250ms.

**Depends on**

StopWatch, STREAMER, CSSObject, ALL_FIRST_IN_LINE_JOBS, Cache, furnish, Glyphs, PrepareForGarbageCollection, parseBool, Settings, when, RegisterJob, parseCoin, parseURL, Color, UUID, wait, NORMALIZED_PATHNAME

**Twitch coupling**

- `[data-test-selector*="balance-string"i]`
- `[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i])`
- `[data-a-target*="side-nav-header-"i]`
- `[data-a-target$="metadata"i]` / `[data-a-target$="status"i]`
- `https://static-cdn.jtvnw.net/channel-points-icons/`
- `[class*="reward"i][class*="item"i]`
- `[data-test-selector="cost"i]`

**Storage & messaging**

- `Cache.load(['ChannelPoints'])`
- `Cache.save({ ChannelPoints })`

<a id="tools-14895"></a>

## Stream Preview — L14895–15095
- **Settings keys:** `away_mode__volume`, `away_mode__volume_control`, `stream_preview`, `stream_preview_position`, `stream_preview_scale`, `stream_preview_sound`
- **Handlers:** `stream_preview`
- **Unhandlers:** `stream_preview`
- **Timers:** `stream_preview`
- **RegisterJob:** `stream_preview`
- **Labels:** `__StreamPreview__`

**Purpose**

Displays a floating preview window (iframe) of a channel's live stream or VOD when hovering over channel or guest tooltips.

**Runs when**

- Every 500ms via `Timers.stream_preview` (if `Settings.stream_preview` is enabled).
- On `keyup` events (ArrowUp/ArrowDown) to navigate between visible tooltips.
- On `top.onlocationchange` to trigger cleanup.

**Defines**

- `STREAM_PREVIEW` — State object storing the current preview's channel name and DOM element.
- `Handlers.stream_preview` — Main logic for detecting tooltips, calculating position, and rendering the preview iframe.
- `Unhandlers.stream_preview` — Removes the preview element from the DOM.
- `Timers.stream_preview` — Poll interval (500ms) for the preview handler.

**Depends on**

StopWatch, Settings, SetVolume, InitialVolume, AwayModeStatus, ALL_CHANNELS, getOffset, furnish, parseURL, GetVolume, THEME, RegisterJob, parseBool, nullish, defined, wait, when

**Twitch coupling**

- `:is([class*="channel"i], [class*="guest-star"i])[class*="tooltip"i][class*="body"i]` (Rich tooltip body)
- `[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i]) > *` (Tooltip title/subtitle)
- `[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="metadata"i] > *` (Fallback metadata)
- `[data-a-target^="watchparty"i][data-a-target*="overlay"i]` (Watch party overlay)
- `[data-a-target^="side-nav-bar"i]` (Side nav bar)
- `[href^="/videos/"i]` (VOD link detection)
- `https://player.twitch.tv/` (Embedded player endpoint)
- `https://static-cdn.jtvnw.net/previews-ttv/live_user_...` (Live preview poster)

**Storage & messaging**

- `Settings.stream_preview`
- `Settings.stream_preview_sound`
- `Settings.stream_preview_scale`
- `Settings.stream_preview_position`
- `Settings.away_mode__volume_control`
- `Settings.away_mode__volume`

<a id="tools-15096"></a>

## Watch Time Placement — L15096–15364
- **Settings keys:** `show_stats`, `watch_time_placement`
- **Handlers:** `watch_time_placement`
- **Unhandlers:** `watch_time_placement`
- **Timers:** `watch_time_placement`
- **RegisterJob:** `watch_time_placement`
- **Labels:** `__WatchTimePlacement__`

**Purpose**

Tracks and displays a timer for the current stream's watch time and monitors the streamer's rank within the top 100 for the current game via GQL.

**Runs when**

`Settings.watch_time_placement` is enabled; triggered by `Timers.watch_time_placement` (1s one-shot delay).

**Defines**

- `Handlers.watch_time_placement` — initializes UI placement and intervals for watch time and rank tracking.
- `Unhandlers.watch_time_placement` — removes UI elements and clears associated intervals.
- `Timers.watch_time_placement` — start delay for the job.

**Depends on**

`Settings`, `STREAMER`, `RestartJob`, `parseBool`, `Tooltip`, `toTimeString`, `furnish`, `Cache`, `GET_WATCH_TIME`, `CURRENT_WATCHTIME_NAME`, `NORMALIZED_PATHNAME`, `STARTED_WATCHING`, `THEME__PREFERRED_CONTRAST`, `ANTITHEME`, `UP_NEXT_ALLOW_THIS_TAB`, `parseURL`, `fetchURL`, `Search.anonID`, `UnregisterJob`, `RegisterJob`

**Twitch coupling**

- `.live-time`
- `[data-a-target="player-controls"i] [class*="player-controls"i][class*="left-control-group"i]`
- `https://gql.twitch.tv/gql` (Operation: `DirectoryPage_Game`)
- `[data-a-target*="viewer"i][data-a-target*="count"i]`
- `#root` (dataset `aPageLoaded`)

**Storage & messaging**

`Cache` read/write: `CURRENT_WATCHTIME_NAME`, `Watching`, `WatchTimes/[channel]`

<a id="tools-15365"></a>

## Networking › Auto DVR — L15365–15872
- **Settings keys:** `set`, `show_stats`
- **Handlers:** `__MASTER_AUTO_DVR_HANDLER__`, `video_clips__dvr`
- **Unhandlers:** `video_clips__dvr`
- **Timers:** `video_clips__dvr`
- **RegisterJob:** `video_clips__dvr`
- **Labels:** `__AutoDVR__`

**Purpose**

Automatically records live streams for specified channels (DVR), handles ad-break splicing to maintain recording continuity, and manages automatic navigation/queue-jumping when DVR targets go live.

**Runs when**

- `Settings.video_clips__dvr` is enabled.
- `RegisterJob('video_clips__dvr')` is called.
- Periodic interval (30s) for channel checking.
- Page events: `focusin`, `beforeunload`.
- UI triggers: `[data-a-target*="ad-countdown"i]` presence/absence.

**Defines**

- `Handlers.video_clips__dvr` — adds DVR toggle button to about section and initiates recording.
- `Unhandlers.video_clips__dvr` — stops the active DVR recording.
- `Timers.video_clips__dvr` — one-shot delay (2.5s) before running the handler.
- `top.DVR_CLIP_PRECOMP_NAME` — getter that generates a formatted filename for recordings.
- `Handlers.__MASTER_AUTO_DVR_HANDLER__` — stops recording, saves the file, and alerts the user with a preview.
- `AUTO_DVR__CHECKING` — function to scan DVR-enabled channels for live status and manage queue jumping.

**Depends on**

StopWatch, Cache, STREAMER, parseBool, furnish, Glyphs, VideoClips, Recording, SetQuality, Settings, GetNextStreamer, toTimeString, ClipName, UUID, GetFileSystem, Search, ALL_CHANNELS, ALL_FIRST_IN_LINE_JOBS, parseURL, goto, REDO_FIRST_IN_LINE_QUEUE, Manifest, compareVersions, confirm, Tooltip, PrepareForGarbageCollection

**Twitch coupling**

- `.about-section__actions` / `.about-section`
- `[data-a-player-state] video`
- `[data-a-target*="ad-countdown"i]`
- `#up-next-control`
- `[data-recording-status]`

**Storage & messaging**

- Cache: `DVRChannels`, `ALL_FIRST_IN_LINE_JOBS`, `FIRST_IN_LINE_DUE_DATE`
- Settings: `video_clips__dvr`, `DVR_CHANNELS`, `show_stats`

<a id="tools-15873"></a>

## Video Recovery › Recover Frames — L15873–16068
- **Settings keys:** `recover_frames`, `recover_frames__allow_embed`
- **Handlers:** `recover_frames`
- **Timers:** `recover_frames`
- **RegisterJob:** `recover_frames`
- **Labels:** `__RecoverFrames_Embed__`, `__RecoverFrames__`

**Purpose**

Detects Twitch video stream stalls (freezes or lag) and attempts recovery by either toggling play/pause or replacing the player with an embedded Twitch iframe.

**Runs when**

Every 1000ms via `Timers.recover_frames` if `Settings.recover_frames` is enabled, the page is visible, and the video is not paused by the user.

**Defines**

- `Handlers.recover_frames` — monitors playback quality (creation time, frame count, and frame hashes) to detect stalls and trigger recovery.
- `Timers.recover_frames` — execution interval (1000ms).

**Depends on**

`StopWatch`, `parseBool`, `Settings`, `furnish`, `parseURL`, `STREAMER`, `Recording`, `Handlers.__MASTER_AUTO_DVR_HANDLER__`, `ReloadPage`, `UUID`, `when`, `wait`

**Twitch coupling**

- `video` element
- `#tt-embedded-video`
- `button[data-a-player-state="paused"i]`
- `[data-a-target*="ad-countdown"i]`
- `[class*="container"i]`
- `https://player.twitch.tv/`
- `[data-a-player-state]`

**Storage & messaging**

- `Settings.recover_frames`
- `Settings.recover_frames__allow_embed`

<a id="tools-16069"></a>

## Recover Stream — L16069–16159
- **Settings keys:** `recover_ads`, `recover_stream`
- **Handlers:** `recover_stream`
- **Timers:** `recover_stream`
- **RegisterJob:** `recover_stream`
- **Labels:** `__RecoverStream__`, `__RecoverVideoProgramatically__`

**Purpose**

Automatically detects and resumes Twitch stream playback when it pauses unexpectedly, using both programmatic `.play()` calls and simulated UI clicks.

**Runs when**

- Every 2500ms (via `Timers.recover_stream` and `RegisterJob`).
- On the `pause` event of the `<video>` element.
- Condition: `Settings.recover_stream` is enabled.

**Defines**

- `Handlers.recover_stream` — attempts to resume playback if conditions (pause state, trust, ads) are met.
- `Timers.recover_stream` — interval (2500ms) for the recovery job.

**Depends on**

`StopWatch`, `Settings`, `parseBool`, `nullish`, `defined`, `$error`, `$warn`, `wait`

**Twitch coupling**

- `button[data-a-player-state="paused"i]`
- `[data-a-target*="ad-countdown"i]`
- `button[data-a-player-state]`
- `dataset.aPlayerState`
- `video` tag

**Storage & messaging**

- `Settings.recover_stream` (read)
- `Settings.recover_ads` (read)

<a id="tools-16160"></a>

## Recover Video — L16160–16212
- **Settings keys:** `recover_video`
- **Handlers:** `recover_video`
- **Timers:** `recover_video`
- **RegisterJob:** `recover_video`
- **Labels:** `__RecoverVideo__`

**Purpose**

Detects Twitch video playback errors and attempts recovery by either clicking a retry button or redirecting to a different streamer if the stream is restricted (e.g., subscriber-only).

**Runs when**

Every 10 seconds via `Timers.recover_video` if `Settings.recover_video` is enabled.

**Defines**

- `RECOVERING_VIDEO` — flag to prevent concurrent recovery attempts
- `Handlers.recover_video` — async logic to detect player errors and trigger recovery
- `Timers.recover_video` — polling interval for recovery check (10,000ms)

**Depends on**

StopWatch, $, nullish, $error, GetNextStreamer, defined, goto, parseURL, addReport

**Twitch coupling**

- `[data-a-target*="player"i]:is([data-a-target*="content"i], [data-a-target*="gate"i]) [data-a-target*="text"i]` (error message element)
- `a[href$="${ latin }"i] [class*="title"]` (channel title element)
- `[class*="content"i]:is([role], [data-a-target])` (error container)

**Storage & messaging**

- `Settings.recover_video` (read)

<a id="tools-16213"></a>

## User Intent Listener - NOT A SETTING. Observe the user's intent, and prevent over-riding i — L16213–16283

**Purpose**

1. Tracks user navigation to channels (via side nav or search) to store "UserIntent" and prevent automatic overrides.
2. Periodically adds a "Private Viewing" (PiP) button to live stream entries in the search tray.

**Runs when**

* 1 second after page load (User Intent Listener).
* Every 300ms (Private Viewing button injector).

**Depends on**

`wait`, `$.all`, `parseURL`, `Cache`, `$`, `$.defined`, `defined`, `furnish`, `modStyle`, `Glyphs`

**Twitch coupling**

* `[data-a-target="followed-channel"i]`
* `[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i]`
* `[data-test-selector*="search-result"i][data-test-selector*="channel"i]`
* `.search-tray [role="cell"i] [data-a-target="nav-search-item"i]`
* `[data-test-selector="live-badge"i]`

**Storage & messaging**

* `Cache` (writes `UserIntent`)

<a id="tools-16284"></a>

## Recover Chat › Recover Pages — L16284–16362
- **Settings keys:** `recover_pages`
- **Handlers:** `recover_pages`
- **Unhandlers:** `recover_pages`
- **Timers:** `recover_pages`
- **RegisterJob:** `recover_pages`
- **Labels:** `__RecoverPages__`

**Purpose**

Detects and recovers from page crashes, "content unavailable" errors, or severe browser lag by reloading the page or navigating to the next streamer.

**Runs when**

`Settings.recover_pages` is true; periodically every 5000ms (via `RegisterJob` and `setInterval`).

**Defines**

- `Handlers.recover_pages` — checks for error overlays and triggers page reload or redirection to next streamer.
- `Unhandlers.recover_pages` — clears the lag detection interval.
- `Timers.recover_pages` — interval duration (5000ms).

**Depends on**

StopWatch, nullish, GetNextStreamer, STREAMER, $error, goto, parseURL, ReloadPage, parseBool, Settings, RegisterJob, $warn, nth

**Twitch coupling**

- `main :is([data-a-target*="error"i][data-a-target*="message"i], [data-test-selector*="content"i][data-test-selector*="overlay"i])` — error overlay detection.
- `/content.*unavailable/i` — error message matching for redirection.

**Storage & messaging**

- `Settings.recover_pages` (read)

<a id="tools-16363"></a>

## Developer Features — L16363–16673
- **Settings keys:** `experimental_mode`, `extra_keyboard_shortcuts`, `set`, `show_stats`
- **Handlers:** `extra_keyboard_shortcuts`
- **Timers:** `extra_keyboard_shortcuts`
- **RegisterJob:** `extra_keyboard_shortcuts`
- **Labels:** `__ExtraKeyboardShortcuts__`

**Purpose**

Adds developer shortcuts for taking stream screenshots, recording video clips, and quick-adding channels to the miniplayer or live reminders. It also provides a real-time metadata overlay for active recordings.

**Runs when**

- `Settings.extra_keyboard_shortcuts` is enabled.
- Keyboard events: `Alt+Shift+X` (screenshot), `Alt+Z` (record), `Z` (miniplayer), `R` (reminders).
- Window events: `focusin` (attaches `beforeunload` handler to save clips).
- Interval: Every 1000ms (`GLOBAL_CLIP_HANDLER`) to update recording UI.

**Defines**

- `Handlers.extra_keyboard_shortcuts` — Registers keyboard listeners and injects shortcuts into the Twitch help menu.
- `Timers.extra_keyboard_shortcuts` — Execution interval for the handler (250ms).
- `DEFAULT_CLIP_NAME` — Global state for the current clip's filename.
- `GLOBAL_CLIP_HANDLER` — Interval that updates timer, size, type, and bitrate for recording elements.

**Depends on**

`GLOBAL_EVENT_LISTENERS`, `UUID`, `MASTER_VIDEO`, `GetFileSystem`, `encodeHTML`, `Glyphs`, `prompt`, `phantomClick`, `SetQuality`, `VideoClips`, `Recording`, `ClipName`, `GetNextStreamer`, `Cache`, `Search`, `confirm`, `PrepareForGarbageCollection`, `furnish`, `GetMacro`, `toTimeString`, `MIME_Types`

**Twitch coupling**

- `video` elements (via `$.all('video')` and `MASTER_VIDEO`)
- `#tt-stream-preview--iframe` (to extract channel names)
- `TBODY` containing "space/k" (Twitch keyboard shortcuts help table)
- `.tw-table-row` / `.tw-tabel-cell` (Twitch UI classes)
- `top.location.pathname` (fallback for streamer name)

**Storage & messaging**

- `Cache`: reads/writes `LiveReminders`.
- `Settings`: reads `extra_keyboard_shortcuts`, `experimental_mode`, `show_stats`; writes `LIVE_REMINDERS`.

<a id="tools-16674"></a>

## Miscellaneous — L16674–17223
- **Settings keys:** `auto_claim_bonuses`, `away_mode`, `away_mode__volume`, `first_in_line_none`, `get`, `points_receipt_placement`, `recover_pages`, `set`, `stream_preview_scale`, `stream_preview_sound`, `user_language_preference`, `view_mode`, `watch_time_placement`
- **Labels:** `__ChromeOnly__`, `__FetchingUpdates__`, `__GET_UPDATE_INFO__`

**Purpose**

Calculates and applies theme-based contrast styling, manages extension update checks (GitHub/Web Store), detects page readiness, monitors for ad-stalls to trigger reloads, implements home page stream previews, and mirrors channel point notices to the IRC socket.

**Runs when**

- Page load (top window only).
- Fixed intervals: keep-alive PINGs (3m), update checks (1h), page readiness/ad-monitoring, and coin bulletin polling (100ms).
- User interaction: `mouseenter`/`mouseleave` on home page stream cards.
- Browser events: `beforeleaving` or `onlocationchange`.

**Defines**

- `THEME` — Current detected Twitch theme (light/dark).
- `ANTITHEME` — The opposite of the current theme.
- `THEME__CHANNEL_DARK`/`LIGHT` — Theme-optimized channel colors.
- `THEME__BASE_CONTRAST`/`PREFERRED_CONTRAST` — Calculated color contrast values.
- `PAGE_CHECKER` — Interval handler for the `WAIT_FOR_PAGE` loop.
- `PAGE_IS_READY` — Boolean flag indicating full extension initialization.
- `VIDEO_AD_COUNTDOWN` — Calculated duration of the current ad break.

**Depends on**

`Color`, `AddCustomCSSBlock`, `parseURL`, `Runtime`, `Manifest`, `Settings`, `fetchURL`, `compareVersions`, `confirm`, `open`, `Cache`, `PrepareForGarbageCollection`, `SetVolume`, `ReloadPage`, `parseBool`, `furnish`, `Initialize`, `RestartJob`, `addReport`, `UUID`, `comify`, `TTV_IRC`, `parseTime`

**Twitch coupling**

- `html.classList` (theme detection via `theme-` classes)
- `[data-test-selector*="sad"i][data-test-selector*="overlay"i]` (sad overlay)
- `[data-a-target*="ad-countdown"i]` (ad countdown)
- `[data-a-target="follow-button"i], [data-a-target="unfollow-button"i]` (follow/unfollow buttons)
- `[id*="side"i][id*="nav"i] .side-nav-section[aria-label]` (sidebar navigation)
- `[data-test-selector$="message-container"i]` (chat message container)
- `[data-test-selector*="search-result"i][data-test-selector$="name"i]` (search result names)
- `[data-test-selector="user-notice-line"i]` (channel point/notice lines)

**Storage & messaging**

- **Storage Keys**: `buildVersion`, `chromeVersion`, `githubVersion`, `versionRetrivalDate`, `githubUpdateAvailable`, `chromeUpdateAvailable`, `away_mode__volume`, `stream_preview`, `stream_preview_scale`, `stream_preview_sound`, `recover_pages`, `away_mode`, `auto_claim_bonuses`, `view_mode`, `first_in_line_none`, `watch_time_placement`, `points_receipt_placement`, `user_language_preference`.
- **Messaging**: `Runtime.sendMessage({ action: 'GET_VERSION' })`, `Runtime.sendMessage({ action: 'CLAIM_UP_NEXT' })`, `Runtime.connect({ name: 'PING' })`.
- **Cache**: `Cache.large` key `JumpedData`.

<a id="tools-17224"></a>

## Miscellaneous (cont.) — L17224–17773
- **Settings keys:** `accent_color`, `keep_popout`, `onInstalledReason`, `set`

**Purpose**

Performs general utility initialization: monitors player volume, identifies/labels SVG icons via image comparison, manages page navigation state, injects custom CSS, handles first-run onboarding, and manages communication with the background script.

**Runs when**

Main controller initialization, `top.onlocationchange` event, first-time installation (`Settings.onInstalledReason === INSTALL`), and upon receiving background messages via `Runtime.onMessage`.

**Defines**

`MAIN_CONTROLLER_READY` — global flag indicating the main controller has finished initializing.
`VOLATILE` — list of job patterns to be preserved during page re-initialization.

**Depends on**

`GetVolume`, `Glyphs`, `resemble`, `Balloon`, `Jobs`, `RestartJob`, `Settings`, `AddCustomCSSBlock`, `Runtime`, `CSSObject`, `alert`, `confirm`, `furnish`, `$.all`, `$`, `nullish`, `parseBool`, `addToSearch`, `parseURL`, `ReloadPage`, `WAIT_FOR_PAGE`, `PAGE_CHECKER`, `$notice`, `$warn`

**Twitch coupling**

`.player-controls`, `[data-a-target*="volume"i]`, `[data-a-target*="mute"i]`, `.side-nav-section[aria-label]`, `.about-section__actions`, `[data-target^="channel-header"i]`, `[data-test-selector*="video-player"i]`, `[class*="stream"][class*="-ad"i]`

**Storage & messaging**

`Settings` (user_language_preference, onInstalledReason), `Runtime.onMessage` (heap-audit, notify, report-back), `Runtime.sendMessage` (onAccept, onDeny, onIgnore)

<a id="tools-17774"></a>

## Miscellaneous (cont.) — L17774–18445
- **Settings keys:** `auto_tab_reloads`, `recover_chat`

**Purpose**

Handles specific request actions (reload, close, pin streamer), implements a parallel IRC WebSocket relay to monitor and process Twitch chat events and system notices, and manages news alerts and channel accessibility checks.

**Runs when**

Message listener (cases `consume-up-next`, `reload`, `close`, `update-pinned-streamer`), `document.body.onload`, WebSocket events (`onopen`, `onmessage`, `onerror`, `onclose`).

**Depends on**

`parseURL`, `nullish`, `$notice`, `top.GetNextStreamer`, `when`, `Cache`, `NORMALIZED_PATHNAME`, `top.beforeleaving`, `respond`, `UP_NEXT_ALLOW_THIS_TAB`, `wait`, `$log`, `furnish`, `Glyphs`, `Color`, `AddCustomCSSBlock`, `fetchURL`, `DOMParser`, `UUID`, `confirm.silent`, `RESERVED_TWITCH_PATHNAMES`, `Search`, `TTV_IRC`, `Chat`, `parseBool`, `STREAMER`, `PAGE_IS_READY`, `goto`, `PATHNAME`, `ReloadPage`, `Settings`, `THEME`

**Twitch coupling**

`wss://irc-ws.chat.twitch.tv:443`, `main [data-a-target*="error"i][data-a-target*="message"i]`, `[data-test-selector$="message-container"i] [data-a-target$="message"i]`, `[data-a-user]`, `https://static-cdn.jtvnw.net/emoticons/v2/`, `[id*="side"i][id*="nav"i] .side-nav-section a`

**Storage & messaging**

`Cache`: `Watching`, `PinnedStreamer`, `ReadNews`; `Runtime.sendMessage`: `BEGIN_REPORT`, `WAIVE_REPORT`
