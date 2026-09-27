# Offser bug candidates (unverified)

Raw "suspected bugs" from the Phase 1 digests. **None of these are verified.** Phase 2 checks each against the code; false positives get struck, real ones become fixes.

## `core.js` › /core.js (L1–570)

- `L245` — UUID formatting regex adds a trailing dash (`$4-`) to the resulting string, creating a non-standard UUID format — high

## `core.js` › /core.js (cont.) (L571–1090)

- L696 — `0 & offset.height` results in `0`, forcing tooltip height to 0px — high
- L705 — `0 & offset.height` results in `0`, forcing tooltip height to 0px — high
- L1007 — `locale === LOCALE` will always be false after the first call because `LOCALE` is redeclared as a new Symbol on every function entry, breaking the recursive "top-most" detection — high

## `core.js` › /core.js (cont.) (L1091–1646)

- `L1233`, `L1246`, `L1467`, `L1480`, `L1495`, `L1508`, `L1523`, `L1536`, `L1551`, `L1564` — `resolve.call(null, args)` is invoked immediately rather than passed as a callback to `.then()`, resolving the promise prematurely with the arguments array — confidence high.

## `core.js` › /core.js (cont.) (L1647–2124)

- `L1707` — `href` is appended to `alloworigin.com` without `encodeURIComponent`/`encodeURI`, risking malformed URLs — confidence high.
- `L2048-2052` — References `fetchURL.origins.TEXT` through `TEXT_5`, which are not defined in the `origins` object (L1975-1984) — confidence high.
- `L2115` — `properties instanceof String` fails for primitive strings, meaning the array conversion logic for single-string arguments will not run — confidence high.

## `core.js` › /core.js (cont.) (L2125–2722)

- `L2433` — `callback` is used but not declared in the `getBytesInUse` parameter list, causing a `ReferenceError` if called — confidence high.
- `L2705` — `return` inside the `Promise` executor prevents `resolve()` or `reject()` from being called, leaving the promise pending forever and blocking the `.then()` block — confidence high.

## `tools.js` › /tools.js (L1–120)

* L61, L70 — If no `theme-` class is found on the `html` element, `.find()` returns `undefined`, causing the subsequent `.replace()` call to throw a TypeError — confidence high.

## `tools.js` › Setup (pre-init) - #MARK:classes #MARK:functions #MARK:methods (L121–697)

* `L167` — `Queue.balloons.pop()` retrieves the last item while `L174` adds the new item to the front (`splice(0,0)`), causing the wrong balloon to be re-created if multiple are queued — confidence high.
* `L385` / `L619` — `ALL_FIRST_IN_LINE_JOBS.splice(...)` returns the removed elements, not the modified array, resulting in `Cache.save` storing the deleted item instead of the updated list — confidence high.
* `L222` — `setInterval` for the notification counter is never cleared via `clearInterval` when the balloon is removed (only the element is removed), causing a memory leak — confidence med.

## `tools.js` › Setup (pre-init) - #MARK:classes #MARK:functions #MARK:methods (cont.) (L698–1064)

- L890 — `Card.remove()` attempts to delete `this.title` from the map, but `this.title` is never defined in the constructor (only the local parameter `title` is used) — high.
- L1021 — `options.map(Object.values)` will throw if `options` is not an array or contains non-object elements — med.

## `tools.js` › Setup (pre-init) - #MARK:classes #MARK:functions #MARK:methods (cont.) (L1065–1684)

- `L1118`, `L1266` — Calls `.missing()` on arrays/collections, but this method is not listed as a provided polyfill — high.
- `L1503` — The `json()` method in `retrieve` parses `query.body` (the request payload) instead of the actual response body — high.

## `tools.js` › Setup (pre-init) - #MARK:classes #MARK:functions #MARK:methods (cont.) (L1685–2235)

- `L1749` — `Promise.race` is passed `this` (an Element) as the first argument; since Elements are not Promises, it resolves immediately, rendering the `wait(100)` timeout useless — confidence high.
- `L1834` — `Chat.defer.set onwhisper` checks `Chat.__onwhisper__` instead of `Chat.__deferredEvents__.__onwhisper__` — confidence high.
- `L1849` — `Chat.defer.set onbullet` checks `Chat.__onbullet__` instead of `Chat.__deferredEvents__.__onbullet__` — confidence high.
- `L1864` — `Chat.defer.set oncommand` checks `Chat.__oncommand__` instead of `Chat.__deferredEvents__.__oncommand__` — confidence high.
- `L1919` — `Chat.consume.set onwhisper` checks `Chat.__onwhisper__` instead of `Chat.__consumableEvents__.__onwhisper__` — confidence high.
- `L1934` — `Chat.consume.set onbullet` checks `Chat.__onbullet__` instead of `Chat.__consumableEvents__.__onbullet__` — confidence high.
- `L1949` — `Chat.consume.set oncommand` checks `Chat.__oncommand__` instead of `Chat.__consumableEvents__.__oncommand__` — confidence high.

## `tools.js` › Setup (pre-init) - #MARK:classes #MARK:functions #MARK:methods (cont.) (L2236–2684)

- L2297, L2298 — `video` and `computed` are assigned without declaration, creating implicit globals — confidence high
- L2300 — `desired` (an object) is compared to `computed` (a string), causing the quality check to always resolve as true/different — confidence high
- L2305 — `2_5_0` is an invalid numeric literal (syntax error) — confidence high
- L2457, L2460, L2475, L2479 — `ACTIVITY` and `LITERATURE` are assigned without declaration, creating implicit globals — confidence high

## `tools.js` › Setup (pre-init) #MARK:globals #MARK:variables (L2685–3203)

- L3103 — `size = max` assigns the current maximum to the size variable instead of updating the maximum (`max = size`), preventing the largest image from being selected — confidence high.
- L3114 — Trailing semicolon after `if` statement causes the following block (L3115–3120) to execute unconditionally — confidence high.

## `tools.js` › Setup (pre-init) #MARK:globals #MARK:variables (cont.) (L3204–3709)

* L3404 — Selector `video[uuid]` is missing the closing bracket `]`, which will throw a DOMException during `$` call — confidence high.
* L3502 — Calls `setAttribute('href', ...)` on elements that may be `<style>` tags (which do not support `href` attributes) — confidence med.

## `tools.js` › First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon (L3782–4185)

*   `L4083-4088` — `GetNextStreamer.cachedStreamer` is assigned as a single object, but L4085 checks `.length` and L4088 attempts array destructuring; this block will incorrectly return `randomChannel` at L4086 or fail to destructure — confidence high.

## `tools.js` › First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon (cont.) (L4186–4867)

- `L4310` — `commands.filter(command => command.reply?.contains(command))` shadows the `command` variable and attempts to check if a string contains the object itself — confidence high.
- `L4352` — `commands.filter(command => command.message.contains(name))` shadows the `command` variable (though here it uses `name`, the shadowing is still present) — confidence med.
- `L4650` — `STREAMER.data` is initialized as `{}` on `L4373` and never populated in this excerpt, meaning `dailyBroadcastTime` and `activeDaysPerWeek` will always fallback to defaults — confidence high.
- `L4814` — `fetchURL.fromDisk` call for VODs lacks a `.catch()` handler, unlike the subsequent call on `L4837`, potentially leading to unhandled promise rejections — confidence med.

## `tools.js` › First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon (cont.) (L4868–5529)

- `L5132` — `.replace(/\/g/, '')` treats `\/g` as a literal string instead of a regular expression; fails to remove all slashes — confidence high.
- `L5002`, `L5043` — `live` getters perform a DOM query (`$`) on every access rather than caching the result, causing significant performance degradation during list filtering — confidence high.
- `L4923` — `$.defined(...)` is used as a boolean check for existence, but the project conventions list `defined` as the helper; if `$.defined` is not a valid alias, this will throw — confidence med.

## `tools.js` › OBSOLETE OBSOLETE OBSOLETE OBSOLETE OBSOLETE OBSOLETE OBSOLETE OBSOLETE (L5530–5731)

*   L5569 — `type`, `value`, and `cookies` are undefined, causing `$remark` to fail — high.
*   L5613 — `$.getElementByText` may return null if the regex fails, causing a crash on `.innerText` — med.
*   L5627, L5711 — `top['atоb']` uses a Cyrillic 'о' (`\u043e`) instead of Latin 'o', which will fail to call the standard `atob` function — high.
*   L5663 — The OAuth URL contains duplicate `response_type` parameters (`code` and `token`) — med.

## `tools.js` › Automation › Auto-Join (L5732–5773)

- L5767 — Event listeners are only attached to elements present during initial execution; subsequent DOM updates or SPA navigation will leave new links unhandled — med.

## `tools.js` › Auto-Focus (L5774–6085)

- `L5935` — `threshold /= CAPTURE_HISTORY.length` results in `NaN` during the first execution because `CAPTURE_HISTORY` is empty — confidence high.

## `tools.js` › Lurking (L6086–6420)

- `L6175` — `return StopWatch.stop(...)` inside a `.map()` callback does not exit the parent `Handlers.away_mode` function — confidence high.
- `L6177` — `classes.remove(value)` will throw if `classes` falls back to the empty array `[]` — confidence med.
- `L6284` — `getOffset($('video'))` will throw if the video element is not yet present in the DOM — confidence med.

## `tools.js` › Auto-claim Channel Points › Claim Loot (L6421–6491)

- L6445/L6474 — `handled` is initialized to 0 but never incremented; `handled >= offerContainers.length` will always be false if offers exist, preventing the menu from closing via the "all handled" path — high.

## `tools.js` › Claim Prime - Still requires trusted interaction (L6492–6557)

- L6514 — `confirm.timed` is not awaited; the subscription process (L6527+) executes immediately while the warning dialog is still visible, rendering the "confirmation" a non-blocking notification — confidence high.

## `tools.js` › Claim Reward (L6558–7296)

* `L6623` — `sole |= 0` inside an object indexer will convert the `sole` (likely a string ID) to a number, potentially causing key mismatches or `NaN` indices — confidence high.
* `L6901` — `buyOut` function clicks the first available button in the checkout UI without verifying it matches the specific emote selected in `L6897` — confidence med.
* `L6987` — `buyOut(count, rewardsBackButton?.click())` passes the result of a function call as the second argument to `buyOut`, but `buyOut` only accepts one parameter (`count`) — confidence high.

## `tools.js` › Claim Drops (L7297–7365)

- L7345 — recursive call to `TTV_DROPS_CHECKER` only passes `btn_str`, omitting `svg_str`; this causes `$.nullish(svg_str, btn)` at L7323 to return true on all subsequent iterations, stopping further claims — confidence high.

## `tools.js` › First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon (L7366–7915)

- `L7607` — `nullish('.tt-confirm')` checks if the string literal is null/undefined rather than checking for the existence of the element; the safety catch will likely never trigger — confidence high.

## `tools.js` › First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon (cont.) (L7916–8465)

- L8352 — `parseBool(message)` will return `false` for the sentence strings assigned to `message` at L8340/L8346, preventing the DVR alert from ever displaying — confidence high.

## `tools.js` › First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon (cont.) (L8466–8850)

- `L8641` & `L8642` — Use of `--oldIndex` and `--newIndex` inside `splice` likely targets the wrong array elements based on `Sortable` index output — confidence high.
- `L8665` — Calls `.href` on `ALL_FIRST_IN_LINE_JOBS[0]`, but the array contains strings (URLs), so this will be `undefined` — confidence high.

## `tools.js` › First in Line (L8851–9316)

- `L9293` — `break __FirstInLine__;` used to exit an `if` block; `break` is invalid outside of loops or switch statements, causing a SyntaxError — confidence high.

## `tools.js` › First in Line+ (on creation) (L9317–9449)

- `L9346` — `bad_names` are filtered by `parseBool`, but `BAD_STREAMERS` contains usernames (strings); `parseBool` will return false for names, making `bad_names` always empty and preventing the logic at `L9349` from running — confidence high.

## `tools.js` › Live Reminders (L9450–9725)

- L9570 — `LIVE_REMINDERS__LISTING_INTERVAL` is undefined, making `clearInterval` ineffective — high.
- L9650 — Attempting to dispatch `mouseup` on a DOM element to trigger reminder removal fails if the user is not currently viewing the About section — med.

## `tools.js` › Game Overview Card | Store Integration (L9726–9936)

- L9856 — `setInterval` is called inside the handler without being stored or cleared; repeated calls to the handler (e.g., on channel change) will leak multiple active intervals — confidence high.

## `tools.js` › Get the Steam link (if applicable) (L9937–10173)

* `L9949` — `game[0]` accesses only the first character of the game string for the URL filename, which will cause 404s for any game name longer than one character — confidence high.
* `L10004` — `item.uuid` is accessed on a DOM element; `uuid` is not a standard HTML property (likely intended to be `item.dataset.dsAppid`) — confidence high.

## `tools.js` › Get the PlayStation link (if applicable) (L10174–10473)

* `L10186` — `game[0]` will throw a TypeError if `game` is an empty string — confidence high.
* `L10358` / `L10453` — Selector `$('.tt-store-purchase--container.is-playstation')` attempts to update the DOM before the `purchase` element is actually inserted via `replaceWith` (L10368 / L10463) — confidence high.

## `tools.js` › Get the Xbox link (if applicable) (L10474–10837)

- `L10552` — `Title` is undefined; likely meant `info.Title`, causing the fallback return to fail — high.
- `L10645` / `L10767` — `return` statements followed by logic that will never execute (dead code) — high.
- `L10650` / `L10814` — `gameID` is not defined in the excerpt or passed through the promise chain — high.

## `tools.js` › Get the Nintendo link (if applicable) (L10838–11205)

* `L11036` & `L11159` — `$` query for the JSON script is executed against the global document instead of the fetched `DOM` object, preventing the Nintendo page description from being parsed — confidence high.

## `tools.js` › Get the Epic link (if applicable) (L11206–11403)

- `L11354` — `$('.tt-store-purchase--container.is-epic')` queries the document for the element before it has been inserted (insertion happens at `L11378`), meaning the maturity warning is applied to a non-existent or incorrect element — confidence high.
- `L11303` — `item.price.totalPrice.currencyInfo?.decimals || -1` will fallback to `-1` if `decimals` is exactly `0` — confidence med.

## `tools.js` › Auto-Follow (L11404–11484)

- L11473 — `setTimeout` captures the `follow` function from the `STREAMER` object at the time of the first handler execution; if the user switches channels via SPA navigation, the timeout will trigger a follow for the previous streamer — high.
- L11473 — `AUTO_FOLLOW_EVENT` is never cleared/reset, meaning the timeout persists even if `Settings.auto_follow_time` is disabled or the time limit is changed — med.

## `tools.js` › Kill Extensions › Parse Commands (L11485–12050)

* `L11611` — `?.replace(...)` is a syntax error (optional chain without a preceding object), which will crash `parseCommands`. — confidence high
* `L11766` — `Unhandlers.parse_commands` only reverts the stream title, leaving modified HTML in about-panels and other panels. — confidence med

## `tools.js` › Auto-Badge (L12051–12134)

- `L12062` — The event listener is attached to the chat input only once during registration; if Twitch re-renders the input element (common in React), the listener is lost — confidence high.
- `L12076` — If `$('p', element)` returns null, the subsequent calls to `$.nullish(..., p)` at `L12079`, `L12088`, and `L12097` may throw an error if the helper expects a valid Element — confidence med.

## `tools.js` › Stop Hosting (L12135–12195)

- L12152, L12162 — Using unescaped strings (`name`, `guest`) in `RegExp` constructors will cause crashes or logic errors if streamer names contain regex special characters (e.g., `+`, `.`, `*`) — confidence high.
- L12173 — Potential `TypeError` if `STREAMER.__eventlisteners__` is undefined — confidence med.

## `tools.js` › Stop Raiding (L12196–12328)

- L12239 — If `to` is undefined (no raid banner and not `raided`), the log/URL will contain `"undefined"`. — confidence high
- L12232 — `top.onlocationchange` is reassigned every 10s whenever a raid is detected, which can overwrite the initialization at L12323 or other global handlers. — confidence high

## `tools.js` › Greedy Raiding (L12329–12393)

- `L12364` — `STREAMER.name.equals(name)` will always be false because the `online` list was filtered to exclude `STREAMER.name` at `L12341` — confidence high.

## `tools.js` › Stay Live (L12394–12482)

- L12449 — `ALL_FIRST_IN_LINE_JOBS.splice(index, 1)` executes with `index = -1` if `FIRST_IN_LINE_HREF` is not found, causing the last element of the array to be deleted instead of nothing — high.
- L12465 — `setTimeout(Cache.remove, ...)` passes the `Cache.remove` method without binding, which may cause a `this` context error during execution — med.

## `tools.js` › Time Zones (L12483–13032)

- `L12615`, `L12627` — Duplicate keys `EST` and `GMT` in `TIME_ZONE__CONVERSIONS` (redundant) — confidence high.
- `L12712` — `UTC` value is `":00"` instead of a full offset (e.g., `"+00:00"`), likely causing parsing errors — confidence high.
- `L13023` — `Indian` value is an empty string, which will likely fail during offset calculation — confidence high.

## `tools.js` › Time Zones (cont.) (L13033–13738)

- `L13718` — selector `[id^="tt-time-zone-"]` fails to match elements created at `L13703` which use a double-dash prefix `tt-time-zone--`, preventing tooltips from being initialized — confidence high.
- `L13676`, `L13680` — uses `escape()` which is deprecated — confidence med.
- `L13668` — `new Date()` construction using template literals with potentially empty `offset` or concatenated `hour + minute` may lead to `Invalid Date` in some browser environments — confidence med.

## `tools.js` › @notImplemented (L13739–13792)

- `L13749` — `Handlers.phone_number` defines a regex but performs no action, resulting in a no-op handler — confidence high.
- `L13783` — `innerHTML` replacement on `element` destroys child DOM nodes and their associated event listeners — confidence high.

## `tools.js` › Notification Sounds › Mention Audio (L13977–14039)

- `L14022` — Overwrites `Chat.onmessage` directly instead of appending a listener, which will break any other functionality relying on that hook — confidence high.

## `tools.js` › Phrase Audio › Whisper Audio (L14040–14119)

- `L14054` — Assigning to `Chat.onmessage` replaces any previously assigned handler, potentially breaking other features that rely on this hook — confidence high.
- `L14088` — Assigning to `Chat.onwhisper` replaces any previously assigned handler, potentially breaking other features that rely on this hook — confidence high.

## `tools.js` › Currencies › Convert Bits › Rewards Calculator › Customization (L14120–14322)

- `L14275-14302` — The `path.push(LAST_ELEMENT)` and `return path.reduce(...)` calls are located inside the `for...of` loop but outside the `switch` block; this causes the parser to return the result after processing only the first character of every selector, ignoring the rest of the string — confidence high.

## `tools.js` › Point Watcher (L14660–14894)

- L14739, L14740 — Attribute selectors `[name=${ name }]` lack quotes; will fail if the streamer name contains spaces or special characters — confidence high.
- L14826 — `$('button [style]')` is too generic and likely selects an unrelated element — confidence med.

## `tools.js` › Stream Preview (L14895–15095)

- `L15085` — The `keyup` navigation handler exclusively attempts to load a VOD (`video: v${...closest('[href^="/videos/"i]')}`) regardless of whether the channel is live, whereas the main handler (L14991) correctly distinguishes between live and VOD — confidence high.

## `tools.js` › Watch Time Placement (L15096–15364)

- `L15204` — `Object.entries().filter((key, val) => ...)` passes the entry array as the first argument (`key`) and the index as the second (`val`), causing the regex to test against a stringified array — high.
- `L15206, L15209, L15229, L15232` — logic uses `key` (the entry array from `L15204`) for comparisons and as a cache key, which will fail or store incorrect keys — high.
- `L15303` — `nullish(IN_TOP_100 = null)` assigns `null` to `IN_TOP_100` inside the condition, making the expression always truthy and executing the `else if` block whenever the first `if` fails — high.

## `tools.js` › Networking › Auto DVR (L15365–15872)

- `L15479` — `parseBool(message)` is called on a natural language sentence, which will likely return `false` and prevent the `alert.timed` notification from appearing — high.
- `L15586` — `UUID.from(body)` references `body`, which is not defined in the scope — high.

## `tools.js` › Recover Stream (L16069–16159)

- `L16131` — `control.click` passed as reference to `.then()` loses its `this` context, causing the click to fail — confidence high.

## `tools.js` › Recover Video (L16160–16212)

- `L16196` — `$('button', errorMessage)` passes a context element as a second argument to a `querySelector` wrapper, which is unsupported; search will be global rather than scoped to the error message — confidence high.

## `tools.js` › User Intent Listener - NOT A SETTING. Observe the user's intent, and prevent over-riding i (L16213–16283)

* `L16255` — Destructuring `element.children` assumes a strict DOM order for search results; if Twitch inserts a wrapper or new element, `searchTerm` or `thumbnail` will be assigned the wrong element — high.

## `tools.js` › Recover Chat › Recover Pages (L16284–16362)

- L16342 — Lag detection using `setInterval` will trigger false positives (warnings and reloads) when the browser throttles background tabs — confidence high.

## `tools.js` › Developer Features (L16363–16673)

- `L16490` — `feed` is attempted to be found and clicked in the `else` branch, but `prompt.silent(body)` is only called in the `if` branch; `feed` will be undefined. — confidence high
- `L16595` — Typo in class name `tw-tabel-cell` (should be `tw-table-cell`), breaking styles. — confidence high
- `L16445` — `UUID.from(body)` is used to find the prompt, but `prompt.silent(body)` does not explicitly assign this UUID to the resulting element's attributes. — confidence med

## `tools.js` › Miscellaneous (cont.) (L17224–17773)

* L17327 — `conversions[glyph].pop()` mutates the source configuration array, meaning only the first element found for a specific glyph will be labeled; subsequent matches will eventually find an empty array and fail — high.

## `tools.js` › Miscellaneous (cont.) (L17774–18445)

* `L18299` — `Promise.race` receives `this` (an HTML element) as the first argument; since it is not a promise, the race resolves immediately with the element, bypassing the `wait(100)` timeout logic — confidence high.
* `L18373` — Reference to `TTV_IRC.wsURL_chat` which is not declared (only `TTV_IRC.wsURL` is defined on L17976) — confidence med.
* `L18421`, `L1843` — Calls `$.defined`, but the provided helper is the global `defined` — confidence high.

## `chat.js` › /chat.js - Meant for features that can run on chat-only pages (L1–97)

- L79 — `interval + new Date` adds a millisecond interval to a current timestamp rather than calculating a duration; `span > max` will almost always be false, disabling the warning — high.

## `chat.js` › Automation › Auto-claim Channel Points (L98–290)

- `L241` — `top.onintegritychange` is overwritten, permanently disabling the logic on `L239` that updates the indicator background color — confidence high.

## `chat.js` › Chat & Messaging › Emote Searching - NOT A SETTING. This is a helper for "Convert Emotes"  (L291–403)

- L380 — If `container` (L372) is not found, `container.append(node)` will throw a TypeError — high.
- L388 — If `title` (L383-386) is null because all selectors fail, accessing `.innerText` will throw a TypeError — high.

## `chat.js` › BetterTTV Emotes (L404–884)

- `L482` — `onclick` handler is commented out, rendering the emote picker buttons non-functional for clicking — confidence high.
- `L842` — `child.parentElement.replaceChild` may throw an error if the placeholder element was removed from the DOM before the 250ms interval executes — confidence med.
- `L628` — Internal "FIX-ME" note indicates that the `Search` logic for the owner info-card may be incomplete or failing — confidence med.

## `chat.js` › Convert Emotes (L885–1245)

- `L1007` — `ondrop` handler returns the dropped data but does not perform any action (e.g., adding to `CAPTURED_EMOTES` or updating the DOM), making the drop functionality useless — confidence high.
- `L1206, L1214, L1220` — Uses `RegExp.$1`, which is a deprecated static property and can be overwritten by other regex operations — confidence med.

## `chat.js` › Filter Messages (L1246–1331)

- L1292 — `RegExp(text, 'i')` will throw a `SyntaxError` and crash the handler if the user-provided `text` contains unescaped regex special characters — high.
- L1283 — `Filter.channel.map` will throw if `Filter.channel` is undefined/null — med.

## `chat.js` › Easy Filter - NOT A SETTING. This is a helper for "Message Filter" (L1332–1435)

- `L1350` — Accessing `.childNodes` on `title` will throw if no header element is found in the card — confidence high.
- `L1410` — Calls `$.getAllElementsByText`, but the method is polyfilled as an `Element` prototype method, not a property of the `$` helper — confidence high.

## `chat.js` › Filter Bulletins (L1436–1486)

- `L1460` — `PINNED_FILTER` is assigned a new interval without calling `clearInterval` on the previous value, causing a memory/CPU leak if the handler is executed multiple times — confidence high.

## `chat.js` › Highlight Phrases (L1487–1572)

- `L1502` — Direct assignment to `Chat.onmessage` overwrites any previous message handler instead of chaining/appending, which will break other features relying on this hook — confidence high.

## `chat.js` › Easy Highlighter - NOT A SETTING. This is a helper for "Highlight Phrases" (L1573–1676)

- L1591 — `title` can be null if no header is found in the card, causing a crash when accessing `.childNodes` — confidence high.
- L1616 — `div.closest(...)` can return null if the user element is not inside a chat line, causing `setAttribute` to throw — confidence high.
- L1653 — `div.closest(...)` can return null if the emote element is not inside a chat line, causing `setAttribute` to throw — confidence high.

## `chat.js` › Easy Helper Card Resizer - NOT A SETTING. This is a helper for "Filter Messages" and "High (L1677–1748)

- L1717 — `Chat.get().map(Chat.onmessage = async line => { ... })` performs an assignment inside a map call, effectively setting the same handler multiple times and executing it immediately for all existing chat lines; high confidence.

## `chat.js` › Message Highlighter - Popup (L1749–1803)

- `L1764` — `Queue.message_popups` is appended to but never cleared, potentially causing a memory leak during long sessions in high-traffic chats — confidence med.

## `chat.js` › Native Twitch Reply (L1804–1970)

- L1849 — `closest('div').previousElementSibling` relies on a strict DOM order; if Twitch inserts a wrapper, the wrong element (or null) is captured — high.
- L1851, L1882 — Extremely brittle CSS path (`.chat-input > :last-child > :first-child > :not(:first-child)`) will break upon any minor Twitch UI update — high.
- L1894 — Hard-coding the placeholder to "Send a message" may overwrite other extension settings or native Twitch states — med.

## `chat.js` › Link maker (L1971–2201)

- L2039 — `aliasContainer` searches for `[data-blerp=...]` but L2012 creates the element with `@blerp` (attribute `blerp`), causing the Blerp audio player to never be appended — high.
- L2074 — `pathname?.contains('/videos/', '/clip/')` passes two arguments to a string `contains` polyfill (which typically accepts only one), likely ignoring the second argument (`/clip/`) — med.

## `chat.js` › Auto-chat (VIP) · @dskw1 (L2202–2325)

- L2290 — Overwrites `Chat.onmessage` directly, which will destroy any other event listeners previously attached to that hook — confidence high.

## `chat.js` › Prevent spam (L2326–2401)

- L2346 — `$('...', element)` may return `null` if selectors aren't found, causing `.parentElement` to throw a TypeError — confidence high.
- L2377 — `SPAM` array grows indefinitely for every processed message, leading to a memory leak over long sessions — confidence high.

## `chat.js` › Simplify Chat (L2402–2498)

- L2488 — `RemoveCustomCSSBlock` keys ('SimplifyChat', etc.) do not match the keys used in `AddCustomCSSBlock` ('Simplify Chat', etc.), meaning CSS blocks will not be removed — confidence high.
- L2488 — The CSS block 'Simplify Font (Head)' is never removed by the unhandler — confidence high.

## `chat.js` › Currencies › Convert Bits (L2499–2602)

- `L2539, L2556, L2572, L2588` — `replace(_0, '$10')` applied to a string already processed by `toFixed(2)` will incorrectly append an extra zero to values ending in 0 (e.g., "$1.50" becomes "$1.500") — confidence high.

## `chat.js` › Rewards Calculator (L2603–3093)

- `L2712` — `fetchURL` is called inside a handler running every 250ms, causing massive network spam for `times.json` — confidence high.
- `L2732` (and similar blocks) — The `.then()` callback updates `REWARDS_CALCULATOR_TEXT` asynchronously, but `AddCustomCSSBlock` at `L3073` is called synchronously, meaning the UI will always be one cycle behind or empty — confidence high.
- `L2669` — Use of `previousSibling?.textContent` is brittle and depends on Twitch not changing the DOM order of reward costs — confidence med.

## `chat.js` › Video Recovery › Recover Chat (L3135–3188)

- `L3162` — `error.textContent` is accessed inside a block that runs if `nullish(chat)` is true, even if `defined(error)` is false, leading to a TypeError — confidence high.

## `chat.js` › Reocver Messages (L3189–3383)

* `L3219` — `USERNAME` is used in the handler but is declared as a local variable inside `Chat__Initialize_Safe_Mode` (L3365), resulting in a ReferenceError or `undefined` during the check — confidence high.
* `L3345` — `min` and `max` are assigned without `let/const/var`, creating implicit globals — confidence high.

## `chat.js` › Automation › Greedy Raiding (L3384–3443)

- L3412 — `RAID_LOGGED` is set to true but never reset, preventing the detection of any subsequent raids until the page is reloaded — confidence high.

## `chat.js` › Customization › Point Watcher (Helper) (L3444–3533)

- `L3484`, `L3492` — `STREAMER.coin` is compared as a raw string (`innerText`) against a parsed number; if the balance contains commas or symbols, the comparison will be mathematically incorrect — high.

## `chat.js` › Video Recovery › Soft Unban | tmarenko @ GitHub | https://github.com/tmarenko/twitch_chat_ (L3534–4083)

- `L4021` — `$.all` uses `author` directly in a CSS selector; if the username contains special characters (e.g., quotes), it will throw a DOMException — confidence high.
- `L3800` — `socket.onmessage` is assigned an `async` function; errors within the handler will result in unhandled promise rejections as the browser does not await event handlers — confidence med.

## `chat.js` › Video Recovery › Soft Unban | tmarenko @ GitHub | https://github.com/tmarenko/twitch_chat_ (cont.) (L4084–4451)

- `L4194` — Typo `[data-a-atrget*="mention"i]` (should be `target`) prevents mention detection during catch-up — confidence high.
- `L4264` — `RegisterJob` returns `-setTimeout(...)`; returning a negative ID will make the returned value incompatible with `clearTimeout` — confidence high.
- `L4381` — Date construction via `toLocaleDateString()` and string joining is locale-dependent and likely to produce `Invalid Date` in many environments — confidence med.

## `player.js` › /player.js - Meant for features that can run on player (stream preview) pages (L1–71)

- L50, L62 — `new Date` is the constructor function, not an instance; missing parentheses `()` prevents capturing current timestamps, resulting in `NaN` calculations in L63 and L53 — confidence high.
- L53 — `interval + new Date` performs string concatenation (Number + Function), resulting in `max` being `NaN` — confidence high.

## `player.js` › Automation › Auto-Join › Recover Video (L72–152)

- `L141` — `RECOVERING_VIDEO` is only reset to `false` in the `else` block; if the "subscribe/mature" condition is met, the flag remains `true` indefinitely, blocking all future recovery attempts until the page is reloaded — confidence high.

## `player.js` › Customization › Hide Blank Ads (L153–215)

- L176 — Returns `purple: true` immediately if any ad-countdown is found, potentially misidentifying standard ads as "blank/purple" ads before image analysis can occur — confidence med.

## `player.js` › Networking › Video Clips (L216–280)

* `L248` — `video.stopRecording()` is called when `nullish(video)` is true, causing a TypeError if the video element is missing — high.

## `player.js` › Miscellaneous (L281–329)

- `L293`, `L303` — Destructuring `searchParameters` directly; if this is a `URLSearchParams` object, variables will be `undefined` as it is not a plain object — confidence high.

## `player.js` › Miscellaneous (L330–472)

- L390 — `.map()` used for side effects instead of `.forEach()`, creating an unused array of undefined values — confidence high.
- L443 — `.pop()` mutates the `conversions` array; if the same glyph is matched multiple times, the label will only be applied to the first instance — confidence med.

## `clips.js` › /clips.js - Meant for features that can run on clip pages (L1–71)

- `L53` — `interval + new Date` results in string concatenation rather than numeric addition, causing `max` to be `NaN` and rendering the duration check in `L66` always false — confidence high.

## `clips.js` › Networking › Video Clips (L72–158)

- `L109-112` — Destructuring `$.all` and `.children` without existence checks; throws TypeError if DOM structure differs from expectations — confidence high.
- `L119` — Calls `.closest()` directly on the result of `$('...')`, which will throw if no element matches — confidence high.
- `L141` — Calls `.parentElement` on `button`, which will throw if `$('button', container)` returned null — confidence high.

## `clips.js` › Miscellaneous › Miscellaneous (L159–317)

- L215 — `ready` is hardcoded to `true`, rendering the subsequent check for `content-overlay-gate` dead code — confidence high.
- L288 — `conversions` is initialized as `{}` and never populated; `conversions[glyph]?.pop()` will always return `undefined` — confidence high.

## `settings.js` › /settings.js (L1–579)

*   `L343` — Reference to `SETTINGS` (all caps) instead of the conventional `Settings` global; will likely result in `undefined` and fallback to `'en'`. — confidence high.
*   `L469` — `new DatePicker()` is called without `await`; creates a second modal and a floating promise without tracking its resolution. — confidence med.

## `settings.js` › /settings.js (cont.) (L580–1168)

- `L613` — `type` is assigned without declaration, creating a global variable leak — confidence high.
- `L625` — `each` is assigned without declaration, creating a global variable leak — confidence high.
- `L1065` / `L1162` — `extractValue` and `assignValue` will throw if `element.type` is not one of the predefined keys (e.g., a new input type is added to `usable_settings`) — confidence med.

## `settings.js` › /settings.js (cont.) (L1169–1792)

- `L1434` — `if(false || ...)` creates a dead branch/redundant check — confidence high.
- `L1662` — `top.navigator` is used; `navigator` is a global object, not a property of the window (`top`) — confidence med.
- `L1782` — The `onchange` handler for `#sync-settings--upload-json-input` is incomplete, ending immediately after checking file length without processing the file — confidence high.

## `settings.js` › /settings.js (cont.) (L1793–2345)

*   L1808 — `switch(id)` refers to undefined `id` instead of `ID` (L1799), breaking the JSON import logic — confidence high.
*   L1840 — `$('#${ id }')` refers to undefined `id` instead of `ID` — confidence high.
*   L1970 — `settings.set(ID, 'X')` calls `.set()` on a plain object (`settings = {}` at L1878), which will throw a TypeError — confidence high.

## `settings.js` › /settings.js (cont.) (L2346–3015)

- `L2414` — `dispatchEvent` called on the result of a selector that may return null if no results match, causing a crash — high.
- `L2484` — `output.innerHTML += result.outerHTML` inside a loop destroys all previously added DOM nodes and their event listeners — high.
- `L2432` — Assignment `output.dataset.empty = query.length < 3` used as a boolean condition — med.
- `L2737` — `PREV_NODE.innerHTML` replacement destroys existing DOM elements and event listeners within that node — med.

## `background.js` › /background.js (L1–511)

- `L270-275` — `TabIsOffline` returns `true` if the URL ends with `.twitch.tv`, meaning all healthy Twitch tabs are flagged as "offline", causing `TabWatcher` (L431, L449) to potentially reload them indefinitely — confidence high.

## `background.js` › /background.js (cont.) (L512–1008)

- `L641` — `events` is assigned the return value of `.push()`, which is the new array length (number) rather than the array of events, causing `respond({ events })` at `L649` to return a count — confidence high.
- `L708` — attempts to access `tab.id` in the `else` block, but `tab` is scoped only to the callback at `L697` — confidence high.
- `L843` — references `id` (lowercase) instead of `ID` (uppercase) in `console.warn` — confidence high.
- `L880` — references `act` inside the `if(frozen)` block, but `act` is not defined until `L910` — confidence high.
