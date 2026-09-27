# `core.js` — section digests
> Generated in Phase 1 from Offser (`gemma4:31b-cloud`) digests plus facts extracted by script. Digests are summaries, not specs — verify against the code before relying on a detail.

<a id="core-1"></a>

## /core.js — L1–570

**Purpose**

Utility library providing unique identifier generation (UUID, NanoID) and string compression/encoding (LZW, hashing).

**Runs when**

All pages.

**Defines**

- `UUID` — Random and deterministic UUID generator featuring BWT, cyrb53, and SHA-256 hashing.
- `nanoid` — Secure, URL-friendly random string ID generator with customizable alphabets.
- `LZW` — LZW-based string compression, decompression, and Base64 encoding.

**Depends on**

Manifest, PrepareForGarbageCollection

<a id="core-571"></a>

## /core.js (cont.) — L571–1090

**Purpose**

Provides LZW-64 decoding, a custom Tooltip management system, an extended DOM query utility (`$`), various nullish/empty value checkers, and a recursive garbage collection helper.

**Runs when**

`Tooltip.#CLEANER` interval (every 100ms); `Tooltip` instance event listeners (`mouseenter`, `mouseleave`); manual function calls from other modules.

**Defines**

`Tooltip` — class for creating, positioning, and cleaning up Twitch-style tooltips
`$` — DOM query wrapper with shorthand properties (`all`, `first`, `last`, `on`, etc.)
`nullish` / `nullish.literal` — checks if a value is null, undefined, Promise, or NaN
`defined` / `defined.literal` — inverse of nullish checks
`empty` — checks if an iterable (Map, Set, Object, Array) is empty
`sated` — inverse of empty check
`PrepareForGarbageCollection` — recursively deletes object keys/indices to facilitate GC
`PrepareForGarbageCollection.Indiscriminately` — removes Elements from DOM and revokes Blob URLs

**Depends on**

`LZW`, `furnish`, `UUID`, `getDOMPath`, `getOffset`, `AddCustomCSSBlock`, `RemoveCustomCSSBlock`, `parseBool`

**Twitch coupling**

`.tooltip-layer` (CSS class)
`#root > *, body` (DOM structure)

<a id="core-1091"></a>

## /core.js (cont.) — L1091–1646

**Purpose**

General utility library providing asynchronous polling (`when`), timing (`wait`, `delay`), and network request (`fetchURL`) helpers.

**Runs when**

Called by other extension features/scripts.

**Defines**

- `when` — Promise-based polling utility with condition helpers (all, any, defined, nullish, empty, sated) and piping.
- `wait` — Promise-based timeout wrapper.
- `delay` — Function debounce/delay wrapper.
- `fetchURL` — Enhanced fetch wrapper with CORS and pathing support.

**Depends on**

parseBool, defined, nullish

<a id="core-1647"></a>

## /core.js (cont.) — L1647–2124

**Purpose**

Provides a robust network utility (`fetchURL`) featuring automatic CORS proxying, request deduplication, and persistent disk caching, alongside a global `Settings` manager for extension configuration.

**Runs when**

- `fetchURL` and methods: Called on demand by other features.
- `prevent_fetch_dragging` block: At script initialization if `top == window`.
- Cache cleanup: Every 3,600,000ms (1 hour) via `setInterval`.
- `Settings` methods: When reading/writing user options.

**Defines**

- `fetchURL.requests` — Map tracking active requests to prevent duplicates.
- `fetchURL.idempotent` — Wrapper to deduplicate requests within 60s.
- `fetchURL.fromDisk` — Fetch implementation with persistent cache and origin-freezing (rate-limit) logic.
- `fetchURL.origins` — Registry of available CORS proxy symbols.
- `fetchURL.origins.BEST` (and `JSON_BEST`, `HTML_BEST`, `TEXT_BEST`) — Promises resolving to the fastest working proxy for a given content type.
- `Settings` — Global object syncing extension storage with an in-memory cache.

**Depends on**

`parseURL`, `Runtime`, `Cache`, `Storage`, `$ignore`

**Twitch coupling**

- `static-cdn.jtvnw.net`
- Allowed sites: `betterttv`, `blerp`, `githubusercontent`, `nightbot`, `streamelements`, `streamloots`, `twitch`, `twitchinsights`, `twitchtokengenerator`

**Storage & messaging**

- `persistent-cache@fetchURL` — Key used by `Cache.large` for disk caching.
- `Storage.get`/`set`/`remove` — Extension storage API calls.

<a id="core-2125"></a>

## /core.js (cont.) — L2125–2722
- **Labels:** `__STATIC__`

**Purpose**

Provides a unified storage abstraction (`Cache`) for small (localStorage/sessionStorage) and large (IndexedDB/localForage) data, and a job management system (`RegisterJob`, etc.) to handle timed or repeated execution of extension features.

**Runs when**

The `__STATIC__` block runs once per page load to initialize global API wrappers and state.

**Defines**

- `Cache` — Storage manager with `save`, `load`, `remove`, `getBytesInUse`, and `keys` for standard and `large` storage.
- `AsteriskFn` — Helper converting custom pattern strings (using `*`, `+`, `#`, `~`) into Regular Expressions.
- `Runtime`/`Storage`/`Extension`/`Container`/`Manifest` — Global wrappers for browser-specific extension APIs.
- `CacheStorageArea`/`LargeCacheStorageArea` — Underlying storage backends (localStorage/sessionStorage and localForage).
- `Jobs` — Registry of active job interval/timeout IDs.
- `Timers` — Configuration object for job timings (positive for interval, negative for timeout).
- `Handlers`/`Unhandlers` — Registries for job execution and cleanup functions.
- `Limbo` — Map of jobs currently undergoing destruction/restart.
- `RegisterJob` — Starts a job using `Timers` and `Handlers`.
- `DelayJob` — Starts a job using the `delay` helper.
- `UnregisterJob` — Stops a job and triggers its corresponding `Unhandler`.
- `RestartJob` — Unregisters and then re-registers a job.

**Depends on**

`nullish`, `defined`, `UUID`, `localforage`, `delay`

**Twitch coupling**

- Storage keys are prefixed with `ext.twitch-tools/` (L2163, L2177, L2223, L2225, L2277, L2322).

**Storage & messaging**

- `localStorage`/`sessionStorage` (via `CacheStorageArea`).
- `IndexedDB` (via `LargeCacheStorageArea`/`localforage`).
- `chrome.storage.local`/`sync` (via `Storage`).
- `chrome.runtime` (via `Runtime`).
