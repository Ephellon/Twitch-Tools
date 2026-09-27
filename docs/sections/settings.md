# `settings.js` — section digests
> Generated in Phase 1 from Offser (`gemma4:31b-cloud`) digests plus facts extracted by script. Digests are summaries, not specs — verify against the code before relying on a detail.

<a id="settings-1"></a>

## /settings.js — L1–579

**Purpose**

Provides the global configuration schema for the extension and implements UI helper classes (`DatePicker`, `CommandMaker`) for managing complex user settings like schedules and chat command authority.

**Runs when**

*   At script load: executes version-based storage migrations (IIFE).
*   On-demand: when `DatePicker` or `CommandMaker` are instantiated by other modules.

**Defines**

*   `getURL` — returns a modified extension resource URL.
*   `usable_settings` — whitelist of all valid setting keys used to prune storage.
*   `DatePicker` — class that generates a modal UI for scheduling days/times/durations.
*   `CommandMaker` — utility class for managing chat command authority levels and badge assets.
*   `PRIVATE_OBJECT_CONFIGURATION` — frozen configuration object for property definitions.

**Depends on**

`parseURL`, `compareVersions`, `Storage`, `alert`, `Container`, `parseBool`, `Manifest`, `defined`, `furnish`, `SETTINGS`, `toTimeString`, `Glyphs`, `GetMacro`, `wait`, `when`

**Twitch coupling**

*   `static-cdn.jtvnw.net` — used for user badge images in `CommandMaker.badges`.

**Storage & messaging**

*   **Read/Write**: `v5_32_4`, `auto_chat__vip`, `auto_chat__lurking_message`, `lurking_rules`.
*   **API**: `Container.storage.sync.get`, `Container.storage.local.set`.

<a id="settings-580"></a>

## /settings.js (cont.) — L580–1168
- **Settings keys:** `assignValue`

**Purpose**

Provides the UI and logic for creating custom chat commands and managing general extension settings, including rule-based filters, scheduled "away mode" intervals, and language preferences.

**Runs when**

- `new CommandMaker()`: triggered to create/edit a chat command.
- `LoadSettings()`: called during settings page initialization.
- `SaveSettings()`: triggered when saving the settings page.
- User interaction: `onchange` of authority/type selects, `onclick` of rule/schedule edit/remove buttons.

**Defines**

- `Glyphs` — SVG icon library for UI elements.
- `RedoRuleElements` — Renders editable rule buttons from a delimited string.
- `RedoTimeElements` — Renders editable schedule buttons from a JSON string.
- `CreateTimeElement` — Helper to generate a single schedule item button.
- `SaveSettings` — Extracts values from the settings DOM and persists them to storage.
- `LoadSettings` — Retrieves persisted settings and populates the settings DOM.

**Depends on**

`furnish`, `SETTINGS`, `CommandMaker`, `toTimeString`, `comify`, `when`, `wait`, `UUID`, `encodeHTML`, `parseBool`, `defined`, `nullish`, `DatePicker`, `usable_settings`, `Storage`, `PRIVATE_OBJECT_CONFIGURATION`

**Storage & messaging**

- `Storage.set`/`Storage.get`: reads/writes `filter_rules`, `phrase_rules`, `lurking_rules`, `away_mode_schedule`, `away_mode__volume`, `user_language_preference`, `simplify_chat_font`.

<a id="settings-1169"></a>

## /settings.js (cont.) — L1169–1792
- **Settings keys:** `assignValue`, `extractValue`

**Purpose**

Handles the extension's settings UI, including input validation, language selection, audio testing for notifications, and cloud-based synchronization (upload/download/sharing) of user settings via third-party URL shorteners.

**Runs when**

- **Interval**: Every 250ms to auto-generate tooltips for number inputs (L1174).
- **Events**: 
    - `onchange` for `#whisper_audio_sound`, `#user_language_preference`, and `#sync-settings--upload-json-input`.
    - `onclick` for `#whisper_audio_sound-test`, `#save`, `.save`, `#help`, and `.help`.
    - `onmouseup` for `#sync-settings--upload` and `#sync-settings--download`.
    - `onmousedown` for `#sync-settings--share`.
- **Timer**: Once after 1000ms to clear sync status (L1308).

**Defines**

- `depadName` — converts snake_case strings to Title Case with spaces/dashes.
- `PostSyncStatus` — displays timed status messages (alert, error, success, warning) in the UI.
- `clearSyncStatus` — hides the sync status element.
- `Sym` — compresses a setting key into a shortened symbolic representation.

**Depends on**

`$.all`, `$`, `furnish`, `wait`, `parseBool`, `nullish`, `defined`, `parseURL`, `Storage`, `SETTINGS`, `usable_settings`, `SaveSettings`, `getOffset`, `compareVersions`, `Manifest`, `fetchURL`, `LoadSettings`, `RedoRuleElements`, `RedoTimeElements`, `toTimeString`, `SUPPORTED_LANGUAGES`

**Twitch coupling**

— (This code manages the extension's internal settings page, not the twitch.tv DOM).

**Storage & messaging**

- `Storage.get`/`set`: `user_language_preference`, `SETTINGS`.
- `chrome.storage.sync.set`: Full settings export.
- `DOM`: `#sync-token` (stores/retrieves the Upload ID).

<a id="settings-1793"></a>

## /settings.js (cont.) — L1793–2345
- **Settings keys:** `extractValue`, `json`
- **Labels:** `__ChromeOnly__`, `__FetchingUpdates__`

**Purpose**

Handles settings synchronization (JSON import/export), version checking via GitHub API, and processing of custom DOM attributes (`[set]`, `[glyph]`, `[new]`, `[fix-unit]`) to populate and manage the settings UI.

**Runs when**

*   User triggers `#sync-settings--download-json` (onmouseup) or `#add-time` (onmouseup).
*   User changes `#simplify_chat_font` (onchange).
*   Page initialization (IIFE and global scripts).
*   Every 100ms (interval for `[fix-unit]` elements).

**Defines**

`FETCHED_DATA` — state tracking for version update retrieval.

**Depends on**

`usable_settings`, `RedoRuleElements`, `RedoTimeElements`, `assignValue`, `TRANSLATED`, `PostSyncStatus`, `SaveSettings`, `parseBool`, `furnish`, `Glyphs`, `UUID`, `Manifest`, `Storage`, `fetchURL`, `compareVersions`, `DatePicker`, `GetMacro`, `MediaRecorder`, `toTimeString`, `parseTime`, `parseValue`, `Cache`

**Storage & messaging**

*   `Storage`: `buildVersion`, `chromeVersion`, `githubVersion`, `versionRetrivalDate`, `githubUpdateAvailable`, `chromeUpdateAvailable`.
*   `Cache`: `ignoreNew`.

<a id="settings-2346"></a>

## /settings.js (cont.) — L2346–3015
- **Settings keys:** `assignValue`

**Purpose**

Implements a search system for settings, visualizes browser storage usage/quotas, handles UI localization, and manages the initialization sequence for the settings page (including dependency logic for setting toggles).

**Runs when**

- `document.body.onload` (main initialization).
- `$.body.onkeydown` (Ctrl+f shortcut).
- `#search` input focus, blur, and keydown events.
- `when.defined(() => SETTINGS)` (storage usage calculation).

**Defines**

- `Translate` — deprecated function to localize page text via `tr-id` attributes and `settings.json`.

**Depends on**

`parseBool`, `defined`, `nullish`, `furnish`, `wait`, `Storage`, `LoadSettings`, `Tooltip`, `parseURL`, `AsteriskFn`, `depadName`, `usable_settings`, `SETTINGS`, `SUPPORTED_LANGUAGES`, `ISO_639_1`

**Twitch coupling**

- `#search`, `#search-results` (settings search UI).
- `[tr-id]` (translation identifier).
- `.summary` (settings layout elements).
- `[unit]` (numeric input containers).
- `[requires]`, `[dependents]` (setting dependency attributes).

**Storage & messaging**

- `Storage.getBytesInUse` (quota calculation).
- `Storage.get`/`set`: `user_language_preference`, `LIVE_REMINDERS`.
