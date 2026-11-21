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
    - The Pin list's unpinned names are hard to read (dark on dark); not reproduced in a live test, needs a screenshot and the theme used.
    - The Pin list can show a stream title (from a lookup) as a channel.
    - The channel list (`ALL_CHANNELS`) can hold only a few channels and one without a name, so Pins can't tell which channels are live (the first pin is used even when offline) and show no avatars. Matching the full side bar's followed section (5.35.5.49) froze pages: every followed channel counted as newly live for Up Next+, so this needs a live-check that works in the full side bar first.
- [ ] **Performance:**
    - Fix background script stalls when tabs disappear.
    - Resolve memory leaks related to Hardware Acceleration and excessive iframes.
    - Fix CPU spikes (>100%) during memory cleanup.
    - A respawned tab (Recover Pages, RAM Alarms) is a new tab, so per-tab state is lost: the tab's own Lurk state (#65) and a Keep Status pause.
- [ ] **Search Actions (#79):** after a change from the search bar, the channel page's own Reminder and DVR buttons show the old state until a reload.
- [ ] **Streak Saver:** a real save works hands-off in v6 (the popup presses play itself; v5 has the same code but no real save yet); the live **Watch** route is only tested on a faked row, not on a real streak. Any save Twitch doesn't answer is logged as "Twitch Integrity Fail", whatever the cause.
- [ ] **Recording:** Fix recording failures when pre-roll ads play.
- [ ] **Chat:** Fix chat bullets not registering in the main catcher/reflector.
- [ ] **Documentation:** Complete JSDoc for `polyfills.js`, `tools.js`, `chat.js`, `player.js`, `glyphs.js`, and `settings.js`.

---

## Release History

### Version 5.35.\*
- [`5.35.6.11`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.6.11) — Stay Live's memory of the channel each tab watched live now survives extension updates too (5.35.6.10 kept it somewhere an update clears)
- [`5.35.6.10`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.6.10) — Stay Live moves on from dead channels again after the extension updates or a tab respawns: the tab remembers the channel it watched live (it used to forget it, so every dead channel counted as one you opened yourself)
- [`5.35.6.9`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.6.9) — More fixes brought over from v6: channels missing from the side bar are checked directly instead of counted as offline; the side bar is opened and closed more gently when reading channels; a page that can't get ready reloads at most once every 5 minutes; chat works when not logged in; Store Integration stops re-fetching game pages every 5 seconds and keeps store catalogs in the browser cache (old copies, ~50 MB, are cleared); Settings Export/Restore now carries Live Reminders, saves after a restore, lists any skipped settings, and works with non-Latin text
- [`5.35.6.8`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.6.8) — Fixes brought over from v6: Up Next restarts its job (and the one-minute "Coming up next" prompt) when none is running, its safety prompt works, and redo channels keep their own mark; channel details load again ("Failed to get CHANNEL details (4)", "STREAM details (1§1)"); a looked-up channel's live status refreshes every 5 minutes; Parse Commands handles StreamElements aliases; hidden page frames no longer join chat; a hidden dialog peeks 10px so its buttons can be clicked; Lurk only colours the volume controls while it controls them
- [`5.35.6.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.6.7) — On an offline channel's page, TTV no longer reloads every couple of minutes over the Lurk button (it has no place there) or restarts Watch Time and the Points Receipt every second, so Up Next can move on again; Debug Recording hides rule words only as whole words
- [`5.35.6.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.6.6) — A channel queued while Up Next is paused gets the set wait, not more (#98)
- [`5.35.6.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.6.5) — Debug Recording reads whether chat is shown or collapsed correctly (it said "collapsed" while chat was shown) (#93)
- [`5.35.6.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.6.4) — Up Next no longer shows an hour-long countdown after moving to a channel (a tab not running Up Next could save its one-hour filler), and no longer keeps the channel it just opened at the front of the queue when a channel was added as it left (#92); Debug Recording notes when chat is shown or collapsed (#93)
- [`5.35.6.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.6.3) — Debug Recording names Edge and Opera correctly (not "Chrome"), and keeps a respawned tab's events in time order
- [`5.35.6.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.6.2) — Up Next no longer jumps from channel to channel right after each page loads (#92): switching Rush on or off no longer makes the time left the wait for every channel after, and a long pause no longer runs the countdown down to 0
- [`5.35.6.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.6.1) — Debug Recording keeps its log when the tab goes to another Twitch site or is respawned (RAM Alarms, Recover Pages), and TTV's hidden frames no longer overwrite it; recordings show the time of day for each event
- [`5.35.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.6) — New Settings layout: 12 groups named for what you want to do (Up Next & Channel Hopping, Lurking, Free Points & Loot, Points & Bits Info, Reading Chat, Talking in Chat, Fix Broken Streams, Looks & Extras, Data & Sync, Troubleshooting, Experimental, About), a jump-to list, and group titles that stay in view; Easy Lurk's button placement moves into Easy Lurk; some sections renamed (old names still found by search). Your settings don't change
- [`5.35.5.54`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.54) — The Settings page no longer asks about the "new storage system" (from 5.32.4)
- [`5.35.5.53`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.53) — Debug Recording shows settings as they are, but hides what you write yourself (extra emotes, filter, highlight and lurking rules, the export id), chat lines in TTV's logs, and your rule words wherever they're logged
- [`5.35.5.52`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.52) — Debug Recording saves with Ctrl tapped three times (Alt + Shift + R is the browser's Reading Mode); "Save Debugging Report..." in the right-click menu works
- [`5.35.5.51`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.51) — New: Debug Recording (Developer Features) keeps a log of the last 1–30 minutes of clicks, page changes, reloads, the video's status and what TTV did, with messages hidden; Alt + Shift + R saves it as a file to add to an issue
- [`5.35.5.50`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.50) — Undoes 5.35.5.49, which froze pages (high memory and CPU, constant reloads)
- [`5.35.5.49`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.49) — Followed channels are found again with the full side bar open, so Up Next and the Pin list see them
- [`5.35.5.48`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.48) — No more reloads on an offline channel's page when Watch Time or the Points Receipt is shown (#91)
- [`5.35.5.47`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.47) — No more reloads every few minutes with Recover Pages on, or on a channel's About/Schedule/Videos/Clips page (#91); the side nav stops opening and closing with Use Fine Details (#89); the Pin list shows every pin (#71)
- [`5.35.5.46`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.46) — TTV Tools no longer runs on VOD pages (#90): Up Next, Lurk and reloads stay off them, as before 5.35.5.38
- [`5.35.5.45`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.45) — Auto-Claim's indicator changes color with Twitch's integrity check again
- [`5.35.5.44`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.44) — More robust fix for #90, all reserved pages are ignored
- [`5.35.5.43`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.43) — Fixed #90, VODs are no longer affected by Live Reminders; fixed CSP issue in core.js
- [`5.35.5.42`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.42) — Fixed #89, the sidenav may open up to once per page load
- [`5.35.5.41`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.41) — Followed channels in the side bar count again (Twitch dropped their names from the avatars, so all of them merged into one nameless channel); on a VOD, the channel is its owner, not "videos"
- [`5.35.5.40`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.40) — TTV Tools starts on VOD pages (for real this time); Stream Preview names the hovered channel, not a word from its title; the preview hint no longer covers the tooltip; the Pin list and MiniPlayer fixes from 5.35.5.37 are back
- [`5.35.5.39`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.39) — Point Watcher no longer saves the Watch Streak as points right after a load; Recover Pages waits until a hidden page is seen before reloading it
- [`5.35.5.38`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.38) — Auto-Focus: doesn't pause Up Next on an offline player; TTV Tools starts on VOD pages; no more "hasRecording" console spam
- [`5.35.5.37`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.37) — Pin list: one row per channel when names differ only in case; the console no longer shows "Cannot redefine property: MiniPlayer"
- [`5.35.5.36`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.36) — Lag reporter: a hung tab no longer gets extra rounds; silent tabs are logged as silent, not "did not respond"
- [`5.35.5.35`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.35) — Search Actions: no buttons on Twitch's "Go to <name>" row
- [`5.35.5.34`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.34) — Player: Lurk's quality check, Claim Reward and Copy Frame use the stream's own video, not the MiniPlayer's
- [`5.35.5.33`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.33) — Block Banners: works in tabs you aren't using, not only after a click
- [`5.35.5.32`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.32) — Up Next: the timer moves on right on time after a page load or a reorder
- [`5.35.5.31`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.31) — Up Next: moves on from offline channels again instead of waiting out the timer
- [`5.35.5.30`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.30) — Auto-Focus watches only the stream (#83); Streak Saver saves wait their turn (#80); Live Reminder, Pin and DVR buttons on Twitch search results (#79)
- [`5.35.5.29`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.29) — Stay Live: leaves offline channels you open yourself alone (#82)
- [`5.35.5.28`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.28) — Up Next: the **Pin** list includes your Live Reminders again
- [`5.35.5.27`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.27) — Settings: JSON restores are fixed
- [`5.35.5.26`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.26) — Settings: JSON restores are fixed
- [`5.35.5.25`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.25) — Up Next: **Pin** several channels, in order; the first live one is used when the queue is empty and the stream ends ([#71](https://github.com/Ephellon/Twitch-Tools/issues/71))
- [`5.35.5.24`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.24) — Up Next: **Redo** channels re-queue when Up Next reaches them
- [`5.35.5.23`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.23) — **Streak Saver** stays hidden while Twitch is slow to answer
- [`5.35.5.22`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.22) — **Convert Emotes** works with Twitch's new emote panel, and no longer turns words like "random" into emotes ([#75](https://github.com/Ephellon/Twitch-Tools/issues/75))
- [`5.35.5.21`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.21) — **Convert Emotes** no longer flashes the emote panel ([#75](https://github.com/Ephellon/Twitch-Tools/issues/75))
- [`5.35.5.20`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.20) — **Streak Saver:** the shown frame stays clear of Up Next; Recent Saves skips repeated notes
- [`5.35.5.19`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.19) — **Streak Saver:** saves out of sight; the frame only shows (centered) when you're needed
- [`5.35.5.18`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.18) — Up Next: **Redo** re-queues channels again
- [`5.35.5.17`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.17) — **Streak Saver:** changed logs and messages to be easier for humans to read. "Recent Saves" is a statistic, now hidden if the **Show Stats** setting is *disabled*.
- [`5.35.5.16`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.16) — **Streak Saver:** the "Intended for certain audiences" label no longer makes the Save popup ask you to confirm a content warning
- [`5.35.5.15`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.15) — **Streak Saver:** the Save popup presses play when Twitch's player stops before the clip (the first real save worked once play was pressed)
- [`5.35.5.14`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.14) — **Streak Saver:** with **Auto-Join** on, the Save popup confirms Twitch's content warning by itself
- [`5.35.5.13`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.13) — **Streak Saver:** "Recent" updates as soon as a save finishes; when Twitch shows a content warning, the popup grows and asks you to confirm it. A fresh install (no saved settings) no longer stops every feature after Prevent Hosting from starting
- [`5.35.5.12`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.12) — **Streak Saver:** the **Save** buttons work, the list has a solid background, and its button sits right of the help button at the same size
- [`5.35.5.11`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.11) — Added **Streak Saver** (off by default; testing): Up Next lists the Watch Streaks you can still save, each with a one-click **Save** (a live channel goes to the front of Up Next; otherwise Twitch's save page plays a recent clip in a small muted popup)
- [`5.35.5.10`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.10) — A repeated channel lookup returns the same channel (whose live status keeps updating), not a copy; Logged Alarms table columns are spaced
- [`5.35.5.9`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.9) — "Buy when available" no longer opens and closes the rewards menu over and over (#48); looking up a channel a second time no longer comes back empty; a stray click on a channel link no longer overrides the Up Next pin (#71)
- [`5.35.5.8`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.8) — Made Logged RAM Alarms UI pretty
- [`5.35.5.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.7) — Tooltips no longer stay on screen after the pointer leaves (or the element is replaced while hovered)
- [`5.35.5.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.6) — Store buttons wrap inside the game card instead of running past it; each store's grey box fits its price and link, and a "Mature" label no longer pushes the other stores down
- [`5.35.5.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.5) — Lurk puts its volume back when Twitch resets it (player reload, ad break) (#26, #65); a hidden tab waits until it is visible before reloading (#40); a tab is reloaded or respawned at most once every 2 minutes, and never while it is still loading (#18, #43)
- [`5.35.5.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.4) — Live Reminders lists every reminder again (it could stop after the first); the Bits balance is no longer read as channel points; Point Watcher shows points in Twitch's new side-bar tooltip; a reminder added on a live channel saves its start time
- [`5.35.5.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.3) — Up Next panel no longer flashes after rushing ends (#44); Skip stops the skipped countdown and removes only that channel, "Go now" goes to the right channel, and each new channel asks again (#52); Live Reminders shows current channel points
- [`5.35.5.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.2) — Automatic Tab Reloads leaves frozen, reloading and not-yet-ready background tabs alone; they were respawned as "not responding", sometimes every few minutes (#67)
- [`5.35.5.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5.1) — Up Next no longer queues (and reloads) the channel you are already on when it goes live, and removing a job can no longer drop the last one (#55); the Up Next preview stays muted (#49); stopped the repeating "reading 'name'" console error (#53)
- [`5.35.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.5) — Release of the 5.35.4.x fixes (#54–#71): Lurk on offline and ended streams, RAM Alarms (editable limits, no reload loops, a one-day log), Up Next (Rushing, Keep Status, pin, tab ownership), News, Auto-Focus and the rewritten recording.
- [`5.35.4.15`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.4.15) — Background tabs are no longer respawned as "not responding" (wrong memory measure, quiet hidden tabs), and those respawns are logged (#67); Stay Live goes to the pinned channel instead of reloading the current one (#71)
- [`5.35.4.14`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.4.14) — RAM Alarms: editable limits, no respawn loop for pages under 10 minutes old, and a one-day log in Settings (#67); a respawned tab keeps Up Next (#68); the Up Next pin is kept across channel changes (#71)
- [`5.35.4.13`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.4.13) — A stream that ends while Twitch still shows the live page no longer makes Lurk leave the channel after a minute (#63)
- [`5.35.4.12`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.4.12) — Lurk no longer opens and closes the quality menu when the channel you are watching goes offline, and Auto-Focus stops switching Lurk on an ended stream (#63)
- [`5.35.4.11`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.4.11) — Fixed #66 for good (closing News marks it read); Keep Status no longer brings back an old pause when you turn it on (#69).
- [`5.35.4.10`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.4.10) — Added **Rushing** to Up Next's Extras: choose what the countdown does when you start or stop rushing (Keep time left (default), Reset, Two timers, Scale, Rush once); the rush button's tooltip shows the time before you click (#70).
- [`5.35.4.9`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.4.9) — Added **Keep Status** to Up Next's Extras (off by default): a pause stays when you go to another channel in the same tab (#69).
- [`5.35.4.8`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.4.8) — Fixed #66 (News spam).
- [`5.35.4.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.4.7) — Store cards load again (store catalogs are fetched directly, not through a proxy); RAM Alarms: a page over 2 GB now reaches the HIGH level (#64).
- [`5.35.4.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.4.6) — Pruned obsolete CORS proxies.
- [`5.35.4.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.4.5) — Fixed #63 (on offline channels, Lurk no longer opens and closes the quality menu over and over), #64 (RAM Alarms now match the levels shown in Settings: 500 MB, 1 GB, 2 GB) and #65 (each tab keeps its own Lurk state).
- [`5.35.4.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.4.4) — Rewrote recording (DVR, trophy clips, Alt+Z). Recordings are saved to disk as they go, and one a closed or crashed tab didn't save is offered on the next load, with a preview. Clips keep their last seconds. Recording keeps going in background tabs. Two recordings at once both keep their sound. The DVR pauses during ads instead of splicing them in, which could break the file. Saved files get the right type. DVR files are named for their own length. The player-frame DVR no longer starts a new recorder every half second.
- [`5.35.4.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.4.3) — Fixed #61 and #62 (Auto-Focus takes no screenshots while paused, and rests by itself when it has nothing to control); Auto-Focus reads Lurk's real state; the page-shift fix keeps watching; proxy checks no longer share one request; the channel ID is looked up on Twitch when the page doesn't show it (Twitch Insights now refuses requests); the page-shift fix also runs on live pages; store cards no longer skip games with a price (Steam, PlayStation); picking a chat command suggestion inserts it again; the Auto-Focus readout says "Resume" while paused or idle, and one click resumes it; fixed errors in Parse Commands and Recover Stream.
- [`5.35.4.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.4.2) — Fixed #57 (Up Next memory leak), #56 and #60 (Auto-Focus no longer undoes your own Up Next pause or Lurk toggle; click the statistics readout to pause or resume Auto-Focus), and #54 (Up Next keeps its tab when the browser replaces it); Up Next, Stay Live and Next Channel resume after a browser restart; Block Banners works again; error replies are no longer cached; offline pages no longer reload every ~40 s; fixed live detection on Twitch's new channel layout, empty or fake Live Reminders listings, whisper senders and the page shifting left; icons use less memory.
- [`5.35.4.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.4) — Fixed doubled `?tool=` in Up Next URLs; fixed issue where Live Reminders sometimes don't fire.
- [`5.35.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.4) — Fixed #59 (CWE-20 possibility).
- [`5.35.3.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.3.3) — Fixed #58 (added JSON export/restore).
- [`5.35.3.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.3.2) — Added outline for `TTV` language.
- [`5.35.3.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.3.1) — Made some logic static for `Search`.
- [`5.35.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.3) — "RAM Alarms" now ignore pages that are active.
- [`5.35.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.2) — Fixed issue with new feature notices; fixed "RAM Alarms"; dropped the `scripting` permission.
- [`5.35.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.35.1) — Fixed reserved word issues in usernames; added "RAM Alarms".

### Version 5.34.\*
- [`5.34.1.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.34.1.2) — Fixed reserved word issues in usernames.
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
