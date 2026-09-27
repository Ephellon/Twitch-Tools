# `background.js` — section digests
> Generated in Phase 1 from Offser (`gemma4:31b-cloud`) digests plus facts extracted by script. Digests are summaries, not specs — verify against the code before relying on a detail.

<a id="background-1"></a>

## /background.js — L1–511

**Purpose**

Manages background lifecycle tasks, including browser API abstraction, extension installation/update logic, system pressure response (tab reloading), and global state tracking.

**Runs when**

- Extension installation or update (`Runtime.onInstalled`).
- Storage value changes (`Storage.onChanged`).
- Browser window focus changes (`Container.windows.onFocusChanged`).
- Messages received from content scripts (`Runtime.onMessage`).
- System compute pressure events (via `TabWatcher`).

**Defines**

- `RESERVED_TWITCH_PATHNAMES` — List of Twitch pathnames that cannot be used as usernames.
- `SHARED_DATA` — Global map for cross-context data.
- `ReloadTab` — Sends a reload signal to a tab and invokes browser reload.
- `RemoveTab` — Closes a tab, optionally duplicating it first with a 15s cooldown.
- `TabIsOffline` — Checks if a tab is pending, unloaded, or a Twitch URL.
- `TabWatcher` — System pressure handler that reloads Twitch tabs based on CPU/RAM state.
- `Container`, `Runtime`, `Storage`, `Extension`, `Manifest`, `Alarms` — Abstraction layer for `chrome` vs `browser` namespaces.
- `FOCUSED_TAB` — Tracks the ID of the currently active tab.

**Twitch coupling**

- `*://www.twitch.tv/*` (and variations: `player`, `clips`, `*.twitch.tv`) — Tab query filters.
- `RESERVED_TWITCH_PATHNAMES` — List of 60+ reserved URL segments (e.g., `/directory`, `/settings`).

**Storage & messaging**

- Storage keys: `onInstalledReason`, `chromeUpdateAvailable`, `githubUpdateAvailable`, `buildVersion`, `ram_onhigh`, `ram_onmedium`, `ram_onlow`, `ram_timescale`.
- Runtime messages (sent): `{ action: 'reload', forced }`, `{ action: 'close', forced }`.
- Alarms: `ttvMemoryAudit`.

<a id="background-512"></a>

## /background.js (cont.) — L512–1008

**Purpose**

Coordinates cross-tab state (Up Next ownership, shared data), monitors tab health (lag/crash detection), performs periodic memory audits to trigger tab respawns, and handles various background lifecycle requests.

**Runs when**

- `Runtime.onMessage` (various actions)
- `Alarms.onAlarm` (specifically `ttvMemoryAudit`)
- `Runtime.onConnect` (port name 'PING')
- Intervals: `LAG_REPORTER` (35s), `GALLOWS_CHECKER` (0.5s)

**Defines**

- `reloadTabs` — reloads all open Twitch-related tabs
- `auditMemory` — identifies high-RAM tabs and triggers notifications or respawns
- `Date.prototype.getWeek` — calculates the ISO week number of the date
- `REPORTS` / `GALLOWS` / `HANG_UP_CHECKER` — maps tracking tab health and timeout states

**Depends on**

Container, Storage, Runtime, Manifest, PressureObserver, Alarms, RemoveTab, ReloadTab, RESERVED_TWITCH_PATHNAMES, SHARED_DATA, IGNORE_REPORTS, TabWatcher, FOCUSED_TAB

**Twitch coupling**

- `*://www.twitch.tv/*`
- `*://player.twitch.tv/*`
- `*://clips.twitch.tv/*`
- `*://*.twitch.tv/*`

**Storage & messaging**

- **Storage**: `UP_NEXT_OWNER`, `UP_NEXT_OWNER_NAME`, `RaidEvents`, `ram_onhigh`, `ram_onmedium`, `ram_onlow`, `ram_timescale`, `memoryAudit`
- **Outgoing Messages**: `consume-up-next`, `report-back`, `close`, `heap-audit`, `notify`
- **Incoming Messages**: `STEAL_UP_NEXT`, `CLAIM_UP_NEXT`, `WAIVE_UP_NEXT`, `GET_VERSION`, `LOG_RAID_EVENT`, `OPEN_OPTIONS_PAGE`, `BEGIN_REPORT`, `WAIVE_REPORT`, `FETCH_SHARED_DATA`, `POST_SHARED_DATA`, `RESPAWN_THIS_TAB`
