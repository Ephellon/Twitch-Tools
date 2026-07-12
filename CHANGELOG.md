# TTV Tools Changelog

## To-Do & Known Issues

### Feature Requests
- [ ] **Accessibility:** Implement global accessibility options and font customization.
- [ ] **Up Next:**
    - Add option to keep queue purely unique vs. repeating.
    - Implement "Smart Sort" (sort by context/runtime).
- [ ] **Sync & Integration:**
    - Add "Sync Activity across devices" (auto-switch to unique channels).
    - Implement "Full Tab Captures" ([Chrome API](https://developer.chrome.com/docs/extensions/reference/tabCapture/)).
- [ ] **DVR & Recording:**
    - Modify logic to record over ads (substitute mini-video contents).
    - Add option to record specific games.
- [ ] **Chat & Interaction:**
    - Add option to handle chat commands/messages via a dedicated bot extension.
    - Parse and handle phone numbers.
- [ ] **General:** Garner user feedback ([JotForm](https://form.jotform.com/222442891146153)).

### Bug Fixes & Technical Debt
- [ ] **Up Next:**
    - Fix irregular ordering (Sortable `onUpdate` logic).
    - Prevent dead channels from being re-added.
    - Resolve "Up Next Owner" tab synchronization and URL mimicking.
- [ ] **Performance:**
    - Fix background script stalls when tabs disappear.
    - Resolve memory leaks related to Hardware Acceleration and excessive iframes.
    - Fix CPU spikes (>100%) during memory cleanup.
- [ ] **Recording:** Fix recording failures when pre-roll ads play.
- [ ] **Chat:** Fix chat bullets not registering in the main catcher/reflector.
- [ ] **Documentation:** Complete JSDoc for `polyfills.js`, `tools.js`, `chat.js`, `player.js`, `glyphs.js`, and `settings.js`.

---

## Release History

### Version 5.34.\*
- [`5.34.1.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.34.1.2) — Fixed reserved word issues in usernames; added "RAM Alarms".
- [`5.34.1.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.34.1.1) — Fixed #41; fixed content shifting during animation selection.
- [`5.34.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.34.1) — Fixed side panel collapsing for non-live/non-English channels; fixed `Handle.block_banners`.
- [`5.34.0.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.34.0.1) — Fixed Settings tooltips; added "Immediate Live" transition.
- [`5.34`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.34) — Added Epic Game Store; fixed context menu toggle (#36).

### Version 5.33.\*
- [`5.33.4.21`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.21) — Fixed Bonus Button Blunder.
- [`5.33.4.20`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.20) — Fixed drops and `class Recording` logic; removed `class Async`.
- [`5.33.4.19`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.19) — AI optimizations for `nullish`, `getDOMPath`, and `getElementByText`.
- [`5.33.4.18`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.18) — Updated Game Store Catalog.
- [`5.33.4.17`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.17) — Fixed notification URLs; modified Time Zone and Ad Blocking logic.
- [`5.33.4.16`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.16) — Modified ad banner logic; added `ƒ empty` and `ƒ sated`.
- [`5.33.4.15`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.15) — Fixed Up Next pausing logic.
- [`5.33.4.14`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.14) — Modified auto-purchasing, channel redo, and name-fetching logic; fixed exclamation point command issue.
- [`5.33.4.13`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.13) — Added game availability sorting; added locale-time to First in Line.
- [`5.33.4.12`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.12) — Modified Auto-Claim Bonus logic.
- [`5.33.4.11`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.11) — Added "Auto-Badge" feature; enabled Steam integration.
- [`5.33.4.10`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.10) — Fixed #32 (homepage preview); modified ranking and context-menu logic.
- [`5.33.4.9`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.9) — Fixed `Block Banners` fetch protocol.
- [`5.33.4.8`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.8) — Added `Block Banners` setting; updated Pinned Streamer styling; adjusted CPU usage on Settings page.
- [`5.33.4.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.7) — Added Automatic Tab Reloads (#24); fixed #12 (pinned user), #25 (Lurk button), #23 (Auto-purchase), and #28 (Sub-only messages).
- [`5.33.4.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.6) — Fixed homepage title hovering.
- [`5.33.4.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.5) — Fixed #19 (Live previews on home page).
- [`5.33.4.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.4) — Fixed #22 (Tab regrouping) and #21 (Hardcoded client-ID).
- [`5.33.4.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.3) — Fixed balance string viewing.
- [`5.33.4.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.2) — Fixed Away Mode button duplication; modified `Search` cache and channel restoration.
- [`5.33.4.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4.1) — Implemented `PressureObserver` in `background.js`; fixed Redo Channel sticking.
- [`5.33.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.4) — Added logic for new Bits/Channel Points layout; fixed `PrepareForGarbageCollection` recursion.
- [`5.33.3.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.3.2) — Fixed draggable object name generation.
- [`5.33.3.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.3.1) — Fixed volume control logic.
- [`5.33.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.3) — Fixed accidental queue clearing; transitioned Live Reminder logic to async.
- [`5.33.2.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.2.1) — Fixed Greedy Raiding removal and quality fetching.
- [`5.33.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.2) — Added `PrepareForGarbageCollection` to fix memory leaks; added "Live with..." rich tooltips.
- [`5.33.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.1) — Added `fetchURL.fromDisk` for persistent caching; updated DVR to record over ads.
- [`5.33.0.9`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.0.9) — Fixed auto-DVR and clip saver; adjusted live-detection for Live Reminders.
- [`5.33.0.8`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.0.8) — Added "Buy + Record" button; implemented automated DVR sessions; added Twitch Integrity Fail notices.
- [`5.33.0.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.0.7) — Fixed Prime Loot claims; added `Element..tooltip` for easier implementation.
- [`5.33.0.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.0.6) — Added `clips.js` (download button); improved game fetching for seasons/episodes.
- [`5.33.0.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.0.5) — Fixed forced tab-closing issue; modified Greedy Raiding to ignore current streamer.
- [`5.33.0.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.0.4) — Fixed Theatre view mode and SVG labeling.
- [`5.33.0.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.0.3) — Fixed Tooltips not disappearing; fixed `parseURL`.
- [`5.33.0.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.0.2) — Added `class MersenneTwister` for randomization; added search-ability to Live Reminders.
- [`5.33.0.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33.0.1) — Fixed `parseURL`.
- [`5.33`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.33) — Added accessibility font options; fixed live status fetching.

### Version 5.32.\*
- [`5.32.14.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.14.2) — Fixed critical memory leak; added Live Reminders as sources for Up Next.
- [`5.32.14.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.14.1) — Added logic to claim drops only on Up Next tab.
- [`5.32.14`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.14) — Added Claim Drops.
- [`5.32.13.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.13.2) — Fixed Pinned Banner and game filtering.
- [`5.32.13.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.13.1) — Fixed DVR name.
- [`5.32.13`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.13) — Fixed Live Reminder labeling and `parseURL` domain recognition.
- [`5.32.12`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.12) — (Duplicate of 5.32.13).
- [`5.32.11`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.11) — (Duplicate of 5.32.13).
- [`5.32.10.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.10.1) — Fixed Auto-claim wallet item recognition.
- [`5.32.10`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.10) — Added context-menu favicons; modified `SENSITIVE_FEATURES` to prevent page reload on Up Next changes.
- [`5.32.9`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.9) — Added data-usage zoom; added shortcut `r` to add channels to Live Reminders.
- [`5.32.8`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.8) — Fixed recording on non-up-next tabs; added `class Async`.
- [`5.32.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.7) — Added game descriptions from stores; improved recording logic (Promise-based).
- [`5.32.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.6) — Fixed Daylight Saving Time issue in Time Zones.
- [`5.32.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.5) — Integrated pull request #17 (Lurking Message improvements).
- [`5.32.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.4) — Added `Cache.large` (IndexedDB/localForage); added CSS to hide banner ads.
- [`5.32.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.3) — Fixed MiniPlayer display; changed attribute accessors to proxies.
- [`5.32.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.2) — Overhauled storage: `Settings` (extension) vs `Cache` (page).
- [`5.32.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32.1) — Updated game searching to find "editions."
- [`5.32`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.32) — Modified Up Next to consume events across tabs; enabled ID-v2 for settings.

### Version 5.31.\* to 5.0
- [`5.31.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.31.6) — DVRs no longer record ads; improved DVR filenames.
- [`5.31.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.31.5) — Added DVR control from Live Reminder listing.
- [`5.31`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.31) — Overhauled `$`; added option to hide pinned messages.
- [`5.30`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.30) — Enabled Redo option for Up Next; adjusted time zone detection.
- [`5.29`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.29) — Added Store Integration and Auto-Chat.
- [`5.28`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.28) — Integrated Twitch IRC capabilities; added Dyslexie font.
- [`5.27`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.27) — Enabled lag reporting; added `Array..shuffle` and `Array..random`.
- [`5.25`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.25) — Fixed First in Line ordering.
- [`5.23`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.23) — Added tab freeze detection; introduced Game Overview Card.
- [`5.16`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.16) — Added Link Maker; added Claim Rewards logic.
- [`5.15`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.15) — Introduced the recording feature and news system.
- [`5.0`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.0) — **Major Migration:** Migrated extension to Manifest V3.

### Version 4.\* (Legacy)
- [`4.30`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.30) — Added Low Data Usage mode; added cloud-saving for non-Latin characters.
- [`4.20`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.20) — Renamed "Away Mode" to "Easy Lurk."
- [`4.13`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.13) — Introduced the Live Reminders feature.
- [`4.12`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12) — Added Sync Settings (upload/download).
- [`4.0`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.0) — Project renamed to **TTV Tools**.

### Version 3.\* to 2.\* (Early Versions)
- [`3.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.3) — Finalized multi-language packs; added language picker.
- [`3.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1) — Added "Soft Unban" and "Simplify Chat."
- [`3.0`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0) — Moved chat features to `chat.js`.
- [`2.11`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.11) — Implemented searchable and channel-specific emotes.
- [`2.9`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9) — Added "Prevent Spam" settings; added "Recover Pages" detection.
- [`2.8`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8) — Added "Rewards Calculator" and "Points Receipt."
- [`2.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.7) — Introduced the "Point Watcher" feature.
- [`2.5.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.5.1) — Added "Recover Frames" (frame-drop detection).
