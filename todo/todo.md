# TTV Tools &mdash; To-Do List

# TO-DO &mdash; Known Issues

1. Accessibility options?
2. Add the **option** to keep Up Next purely unique
    * Maybe the user wants to create a repeating queue
    * Up Next does not currently allow duplicates
3. Add the "Sync Activity across devices" option
    * If a channel is already being watched on a different machine, go to a different, unique channel
4. Remove more language dependencies
    * All bulletin filters are language dependent - they only recognize English
5. Add an "Auto-Spend" feature for Channel Points
    * If an item is disabled (available in a few streams, or out of stock), attempt to purchase it when available
6. Up Next sometimes goes in an irregular order
    * Caused by not setting the new first in line href (`new Sortable ← onUpdate ← if([...].contains(0))`:5715@v4.28)
        * Tentative fix `4.29`
    * It might also not list jobs immediately
7. `chat.js` has an issue for card popups: `new Search` does not always complete
    * Changed to a raw search to remedy the issue
8. Dead channels get re-added to Up Next sometimes
    * May have something to do with case sensitivity in HREFs?
    * My wife: "It seems to be going thru every channel and adding what it believes is the best fit"
9. Break up debts into categories to be more precise, i.e. "gambled + spent = total debt"
10. Pause First in Line when observing a raid
11. Get better translations--or remove them altogether
    * The translations are incorrect and more confusing than the English version
    * All non-English language packs have been "disabled" (display a warning) as of `v4.30`
    * Tentative removal `v5.30`
12. Toggling Easy Lurk might cause theatre-mode to activate?
    * Tentative fix `5.8`
13. Live Reminders might re-add all live channels?
14. Get `redo:boolean` from URL and control First in Line accordingly (commented-out)
15. The page will freeze when loading either an Instagram or Twitter card

----

# DONE &mdash; Notable Changes
> [`5.19`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.19)
- Increased visibility of bordered/underlined text
- Fixed issue where some rewards could not be "walleted"
- Fixed issue with `furnish` not parsing multiple attributes
- Added Private Viewing (on by default)
- Fixed issue for auto-purchasing
- Modified BTTV emote loading logic
- Added some optimizations

> [`5.18`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.18)
- Modified `parseURL.pattern`
- Modified Card laying logic
- Modified `getDOMPath` logic
- Modified Auto Claim logic
- Fixed Channel Point logic

> [`5.17`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.17)
- Modified `UUID.from` logic
- Modified Link Maker logic
- Modified Claim Rewards logic

> [`5.16`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.16)
- Fixed issue with `parseURL(...).subSearch`
- Added cloud saving v2 skeleton
- Added Card loading animation (`Card.deferred`)
- Added `Element..getPath`
- Modified `Element..getElementsByInnerText`
- Fixed issue with recording
- Modified Live Reminder logic to list live channels first
- Improved `furnish` logic
- Fixed News logic
- Added `Element..isVisible`
- Added Claim Rewards logic (on by default)
- Fixed Time Zones
- Added Link Maker

> [`5.15`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.15)
- Fixed `parseBool` logic
- Fixed reloading issue with low viewership channels
- Changed Stream Preview to work with offline channels
- Added a recording feature
- Added a news system (for notices)
- Added `top.MIME_Types` `ClipName` `Array..isolate` `wait` `parseURL(...).{ addSearch | subSearch }` `Date..getAbsoluteDay` `HTMLVideoElement..{ getRecording | hasRecording | stopRecording | pauseRecording | startRecording | cancelRecording | removeRecording | resumeRecording }`
- Modified `toFormat` `GetOS` `Tooltip`

> [`5.14`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.14)
- Fixed helper menu
- Fixed preview point watcher

> [`5.13`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.13)
- Fixed Volume Release logic
- Fixed previewing issue
- Fixed issue with expanded channels

> [`5.12`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.12)
- Added `STREAMER.shop`
- Adjusted STREAMER.coin logic
- Adjusted Tooltip styling
- Adjusted GetChat logic
- Adjusted STREAMER.perm logic
- Adjusted extension-ready logic
- Replaced antiquated logic with STREAMER.shop
- Removed Portuguese functionalities
- Added more languages for the Rewards Calculator tooltip
- Added `Color.destruct(color:string?)`
- Adjusted Time Zone logic

> [`5.11`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.11)
- Fixed raid stopper logic
- Fixed Up Next owner logic (MV2 → MV3)

> [`5.10`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.10)
- Fixed issue where the raid stopper would activate on greedy channels
- Adjusted Claim Prime logic

> [`5.9`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.9)
- Fixed issue where the child container would fire before the main container
- Adjusted `parseCommands` logic

> [`5.8`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.8)
- Adjusted Live Reminder logic to list live channels at the top of the listing
- Adjusted `STREAMER.tone` logic
- Added Announcements as a valid bulletin feature option
- Adjusted First in Line Boost auto-off logic

> [`5.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.7)
- Adjusted `STREAMER.tone` logic
- Adjusted Time Zone logic
- Adjusted theme-switching logic

> [`5.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.6)
- Modified key event listener logic to include Caps Lock mode
- Added ability to cancel Live Reminder deletions
- Added update logic to `/tools.js`
- Modified Prime Loot logic to only collect when there are claims available
- Fixed issue with `parseCommands`

> [`5.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.5)
- Fixed color-naming error
- Updated screenshots
- Changed Up Next icon

> [`5.4.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.4.1)
- Fixed color-mapping error

> [`5.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.4)
- Adjusted color-naming logic
- Adjusted `STREAMER.tone` → opposite lightness of `STREAMER.tint`
- Adjusted Auto Emote Loading logic

> [`5.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.3)
- Fixed issue with `GetNextStreamer`

> [`5.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.2)
- Fixed `STREAMER.done`
- Adjusted `STREAMER.perm`
- Fixed issue with `STREAMER.cult`
- Fixed issue with `GetNextStreamer`

> [`5.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.1)
- Fixed frame jumping logic
- Fixed `STREAMER.coms` for non-compliant channels
- Added command prediction logic to the chat input
- Added `STREAMER.perm`
- Fixed `parseCommands` logic
- Fixed Extra Keyboard Shortcut listing
- Removed `STREAMER.cult` language dependency
- Adjusted Time Zone logic to handle `\d%` strings and more
- Added search parameters to programmatically controlled opens (`?tool=...`)
- Adjusted Up Next logic to force saving the list on ALL updates

> [`5.0`](https://github.com/Ephellon/Twitch-Tools/releases/tag/5.0)
- Migrated extension to [`manifest V3`](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/)
- Fixed issue with Time Zone conversions
- Added support for special, Latin characters to Simplify Chat and Time Zones
- Adjusted Parse Commands logic
- Added `get STREAMER.coms`
- Added `Function..toTitle` and `Number..to`
- Adjusted Time Zone logic
- Eased viewing for "X amount of points required" buttons
- Updated `Number..suffix` logic
- Adjusted `parseURL` logic
- Added Prime Subscription
- Renamed `awaitOn` to `until`
- Changed icon color to IGOR pink
- Adjusted Time Zone logic
- Added logic to keep an empty Up Next queue from displaying incorrectly

----

> [`4.30`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.30)
- Adjusted message filtering logic
- Adjusted color-naming logic
- Added `GetChat(...).commands`
- Adjusted Greedy Raiding logic
- Added `get GetChat.restrictions`
- Fixed some styling issues
- Fixed issue with Live Reminder alerts
- Added Parse Commands
- Adjusted Time Zone logic
- Adjusted Live Reminder logic
- Added Low Data Usage
- Added styling to "X amount of points required" buttons
- Added support for cloud-saving non-Latin characters

> [`4.29`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.29)
- Fixed First in Line sorting issue
- Adjusted Time Zone logic to include prefixed zones
- Minor QoL improvements
- Adjusted Stream Preview positioning
- Adjusted `alert` `confirm` and `prompt` styling
- Fixed an issue where Live Reminders could remove themselves
- Adjusted color naming logic
- Added more language packs (**not** finalized)
- Adjusted `DatePicker` to be language and region independent
- Added logic to auto-detect the user's language (pre-setup)
- Added logic to no longer zoom-in on a stream when the user zooms-out
- Adjusted "completed correctly" logic
- Added "PvP" with an activity score of 15
- Fixed an issue with emote filtering

> [`4.28`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.28)
- Fixed Settings page

> [`4.27`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.27)
- Added the Live Reminders catalog
- Added Emote Searching logic for spelling mistakes (Levenshtein distance)
- Adjusted Live Reminder logic to use the last confirmed online date instead of predictions
- Adjusted `Number..suffix` to include data-oriented sizes
- Added `encodeHTML` and `decodeHTML`
- Adjusted color naming logic
- Fixed Point ranking issue (graphical)

> [`4.26`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.26)
- Added Persistent Live Reminders option
- Fixed translation errors
- Added Tooltip functionality to Time Zones
- Fixed Up Next re-sorting
- Fixed Context Menu positioning
- Adjusted Channel Rank algorithm
- Fixed issue with Time Zones

> [`4.25`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.25)
- Fixed issue with Stay Live

> [`4.24`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.24)
- Fixed Settings link for initial setup
- Minor color wording adjustment
- Fixed Global Event Listeners & their wording
- Added custom context menus
- Adjusted color mapping algorithm
- Fixed issue with Time Zones
- Fixed issue with Up Next & Initializer not working together

> [`4.23`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.23)
- Fixed issue where pressing "OK" for First in Line erases the queue
- Minor QoL updates
- Fixed issue with Greedy Raiding
- Fixed issue with double-adding Live Reminders
- Adjusted Live Reminder logic to default to the hour the current stream started
- Changed Up Next Boost to 5:30

> [`4.22`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.22)
- Adjusted ranking algorithm
- Adjusted logic to ignore auto-claim in different viewing modes

> [`4.21`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.21)
- Adjusted Stay Live logic to better handle Up Next - One Instance
- Added Point Ranking
- Fixed issue where non-Up Next owner tabs would continue greedy raids

> [`4.20.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.20.1)
- Fixed issue with Auto loading BTTV emotes
- Fixed issue with Time Zones not loading for the About Me panel recursively
- Fixed issue where bulletins would traverse up to the root element(s)

> [`4.20`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.20)
- Added logic to load emote-based text to the initial library
- Removed infinite loading issue for Prevent Hosting
- Renamed "Away Mode" to "Easy Lurk" (superficial only)
- Adjusted Time Zone logic to include the About Me panels

> [`4.19`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.19)
- Fixed an issue with Time Zones not recognizing capital meridiem
- Added logic to detect Gift banners (Filter Bulletins)
- Adjusted color-name logic
- Adjusted BetterTTV emote panels
- Fixed an issue with BetterTTV listing

> [`4.18`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.18)
- Fixed issue where Up Next would add jobs multiple times (case-sensitive)
- Increased Live Reminder timer to 2min
- Adjusted Live Reminder logic
- Adjusted Auto-focus logic
- Fixed infinite reload issue if chat isn't loaded correctly
- Fixed an issue with Recover Chat not loading content

> [`4.17`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.17)
- Fixed issue restoring dead channels in Up Next
- Fixed issue with Up Next sorting

> [`4.16`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.16)
- Minor QoL update for Live Reminders
- Minor QoL update for Up Next Boost
- Fixed minor issue with `GetNextStreamer`
- Fixed color naming scheme
- Fixed issue where Up Next wouldn't count some channels as live
- Increased visibility of Up Next Boost status

> [`4.15.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.15.4)
- Fixed minor issue with "Earned All" not waiting for the cache
- Fixed an issue with turning Live Reminders off (automatically)

> [`4.15.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.15.3)
- Minor Live Reminder update (added "checkmark" as a valid icon to detect native support)
- Fixed an issue with Greedy Raiding looping

> [`4.15.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.15.2)
- Fixed issue with Live Reminders not firing correctly

> [`4.15.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.15.1)
- Removed the pause for "[Someone] is raiding"
- Minor bug fixes

> [`4.15`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.15)
- Added Hide Blank Ads option
- Applied an auto-translator to non-English language packs

> [`4.14`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.14)
- Removed e-mail support link
- Adjusted look of Up Next to better depict the drag-n-drop feature of channels
- Fixed issue where Live Reminders would not fire on followed channels
    - Changed Live Reminders to also be allowed on followed channels
- Changed First in Line / Up Next to ignore case sensitivity when adding channels

> [`4.13`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.13)
- Added more time zones for Time Zones
- Added better Search logic to re-add unknown ("hidden") channels back to Up Next
- Added logic to not hide user-generated messages in chat
- Adjusted Up Next tutorial image
- Added the Live Reminders feature
- Added a rudimentary que to `alert` `confirm` and `prompt`

> [`4.12.14`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12.14)
- Added Time Zones to translate times in the title/rich-tooltip to a local time
- Fixed an issue where Filter Rules would not be saved

> [`4.12.13`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12.13)
- [Added contrast correction](https://webdesign.tutsplus.com/articles/css-tips-for-better-color-and-contrast-accessibility--cms-34472)
- Added Extra Keyboard shortcuts
- Fixed an issue where channels without channel points would reload infinitely

> [`4.12.12.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12.12.1)
- Fixed an issue with an issue with First in Line (I'm about done with Chrome)

> [`4.12.12`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12.12)
- Fixed an issue with First in Line not going to channels at 0s

> [`4.12.11`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12.11)
- Adjusted iframe logic that affects Greedy Raiding (detected streamer)
- Adjusted receipt logic
- Adjusted wording for the Automatic Accent Color option (now calculates the color's name)
- Adjusted watch time logic (now counts the moment the page loads)
- Adjusted first run notices (made some elements more noticeable)
- Fixed issue with pausing First in Line
- Added a point watcher helper to framed chats (now updates the amount correctly no matter what channel is displayed)

> [`4.12.10`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12.10)
- Removed some `toNativeStack` messages
- Added better styling functionality
- Added "Auto" option for Accent Color
- Added Greedy Raiding functionality (previously known as "Predictive Raiding")
- Added logic to detect undead channels (offline but still loaded)

> [`4.12.9`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12.9)
- Adjusted page reload logic to restart the job(s) instead
- Adjusted due date logic for Up Next

> [`4.12.8`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12.8)
- Adjusted `scoreTagActivity` to ignore language barriers
- Adjusted page checker logic to ignore reserved pathnames
- Added more glyphs
- Removed `class Popup`
- Added custom `alert` `confirm` and `prompt` logic
- Fixed `STREAMER.icon`
- Added fade-in animations
- Fixed issue with Stay Live not going to cached streams
- Adjusted `GetNextStreamer` logic; now synchronous
- Added logic to reload the page if certain elements were missing

> [`4.12.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12.7)
- Adjusted `chat.js` card logic
- Adjusted `ReservedTwitchPathnames`
- Fixed issue for Away Mode Schedule
- Added functionality to allow picking multiple days for `DatePicker`
- Added "overview" option to `GetViewMode` and `SetViewMode`
- Added a page checker to determine if TTV Tools loaded correctly
- Added user intention logic to prevent re-closing the channel overview

> [`4.12.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12.6)
- Reverted minor changes

> [`4.12.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12.5)
- Added Stream Preview: Position to adjust the preview's z-index
- Adjusted `onlocationchange` logic (minor)
- Fixed Up Next pausing mechanic
- Added `ondrop` logic to include raw links
- Adjusted Settings' descriptions
- Added version-checker logic

> [`4.12.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12.4)
- Changed emote card styling
- Changed "Earned All" channel point balance styling
- Added logic to unmute embedded channels (if the user has the "Stream Preview Audio" setting enabled)
- Added Try Embed to Recover Frames
- Adjusted `Search` logic
- Added `STREAMER.done`

> [`4.12.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12.3)
- Re-enabled `STREAMER.data` caching

> [`4.12.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12.2)
- Fixed Stop Host and Stop Raid logic
- Adjusted some caching logic `STREAMER.data`

> [`4.12.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12.1)
- Fixed #2 - audio bug with Stream Preview & Away Mode

> [`4.12`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.12)
- Added Sync Settings (upload/download settings)
- Fixed issue where clicking the next channel's popup did not reset the timer
- Enabled the Away Mode Schedule feature
- Fixed issue where the next channel would `blank`

> [`4.11.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.11.7)
- Fixed Highlight Phrases' CSS
- Added side-panel labeling logic
- Fixed issue where Up Next would not go to all channels due to Followed Channel edge-case

> [`4.11.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.11.6)
- Fixed issue where Up Next would instantly go to channels
- Changed Auto-Join to be cyclic
- Fixed issue where reloading the page would reset First in Line events
- Fixed issue where Watch Parties would skew the Stream Preview

> [`4.11.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.11.5)
- Added ability to disable the Next Channel feature

> [`4.11.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.11.4)
- Added "cache next streamer" logic
- Fixed Up Next adding unfollowed channels to Up Next
- Added logic to detect if the user is logged out (do not run the extension...)

> [`4.11.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.11.3)
- Adjusted `author` logic for Filter Messages - to include translated names `Username (Translated Username)`
- Fixed Up Next Boost not loading to the page initially
- Fixed a chat filtering bug

> [`4.11.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.11.2)
- Fixed an edge-case issue where non-URLs would be saved to Up Next
- Fixed Up Next issue - left unwanted return

> [`4.11.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.11.1)
- Fixed rich tooltip v. main menu width styling
- Adjusted Up Next notification logic
- Fixed Up Next pausing ability
- Adjusted Up Next single instance logic

> [`4.11`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.11)
- Removed some language dependencies

> [`4.10.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.10.1)
- Fixed issue where the channel search would fail the extension altogether

> [`4.10`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.10)
- Fixed First in Line Boost logic (state saving)
- Fixed First in Line timing logic
- Fixed Stream Preview returning the volume to its initial value

> [`4.9`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.9)
- Adjusted Watch Time clock logic
- Fixed Up Next - One Instance wording
- Adjusted First in Line logic

> [`4.8`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.8)
- Added the Up Next - One Instance option

> [`4.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.7)
- Added job reconstruction logic
    + Should be able to re-add non-followed channels
- Adjusted the way the Up Next count is calculated
- Adjusted the Stream Preview positioning logic

> [`4.6.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.6.1)
- Fixed Up Next boost

> [`4.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.6)
- Adjusted Recover Video logic
- Adjusted Simplify Chat reloading mechanic
- Adjusted First in Line timer logic
    + Should make freezing less impactful

> [`4.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.5)
- Adjusted settings' version pulling functionality
- Adjusted volume control release mechanic
- Added the "Ignore VODs" sub-option to Stay Live

> [`4.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.4)
- Fixed version updating mechanic
- Added update availability notice for the Chrome version; uses the GitHub version
- Added `/core.js` to house shared functionality
- Added ability for "Auto Join" to work for framed pages (Stream previews)
- Added volume-control release logic (the user can change the volume without turning "Away Mode" off)

> [`4.3.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.3.1)
- Moved some styling to `extras.css`
- Added logic to fade audio from the main video to the preview and vice versa
- Removed job restarting for the BTTV Emote populator (caused major CPU issues)

> [`4.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.3)
- Adjusted Up Next logic
- Fixed Filter Bulletins logic
- Fixed styling, and other issues due to Twitch update

> [`4.2.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.2.1)
- Fixed Settings styling
- Added `GetChat.defer` to run after completed events
- Fixed Dual Toning for Simplify Chat
- Fixed panel-opening logic
- Added Filter Bulletins to Filter Messages

> [`4.2.0.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.2.0.1)
- Adjusted Point Watcher logic
- Added option to mute Stream Previews

> [`4.2.0`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.2.0)
- Removed `CRX` package
- Fixed edge-case where streamer data would not be passed to `chat.js`
- Added Stream Preview
- Fixed Keep Popout
- Added Accent Color

> [`4.1.9`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.9)
- Adjusted "Next Channel" logic

> [`4.1.8`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.8)
- Fixed "Disabled" icon for rich tooltips
- Adjusted the Live Time tooltip (easier to understand)
- Added more options for "Next Channel"

> [`4.1.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.7)
- Fixed Convert Bits
- Up Next is now scrollable

> [`4.1.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.6)
- Fixed Stay Alive logic
- Fixed BTTV emote loading (initial rewrite)

> [`4.1.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.5)
- Fixed Stay Alive logic

> [`4.1.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.4)
- Fixed some styling issues

> [`4.1.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.3)
- Fixed Easy Highlighter (emotes)
- Adjusted `comify` to include different locales

> [`4.1.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.2)
- Fixed Easy Highlighter

> [`4.1.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.1)
- Fixed translation error for the Creative Commons License notice

> [`4.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1)
- Improved `String..pluralSuffix`
- Adjusted dynamic tooltip styling
- Added tooltips to stream tags (apart of `show_stats`)
- Added Highlight phrases
- Adjusted Whisper Audio to include: mentions, phrases, and whispers

> [`4.0.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.0.3)
- Adjusted Auto-Focus logic
- Fixed Away Mode (Twitch update)

> [`4.0.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.0.2)
- Fixed Pointer Watcher Placement error

> [`4.0.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.0.1)
- Fixed Pointer Watcher Placement error

> [`4.0`](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.0)
- Re-named project to "TTV Tools"
- Added last translations to language packs

----

> [`3.3.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.3.1)
- Added the Up Next tutorial image; removed English text
- Adjusted live-time tooltip appearance (apart of `show_stats`)
- Adjusted Auto-Focus logic and appearance
- Fixed preferred language loading for the Settings
- Added translations to `nth`

> [`3.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.3)
- Added initial language picker to Settings page
- Finalized all language packs (also created "Help Translate" issue template)
- Added automatic (tag) detection option to `auto_focus`

> [`3.2.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.2.2)
- Fixed Away Mode (video quality)

> [`3.2.1.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.2.1.2)
- Finalized the English (`en`) language package
- Adjusted other language packs
- Fixed ad-detection for `tools.js`
- Adjusted Video Recovery console messages
- Added more sub-features to Show Statistics (`display_of_video` &rarr; `show_stats`)

> [`3.2.1.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.2.1.1)
- Added the "User Language Preference" features
    - Applicable settings will update in real time to language changes
- QoL changes
    - Adjusted the "auto claim" button
        - Made it easier to toggle (CSS)
        - Fixed tooltip issue for channels with the default Channel Point icon

> [`3.2.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.2.1)
- Adjusted the "Auto Claim" toggle button to describe its function pictorially
- Styling adjustments to Settings page (popup)
- QoL changes
    - Adjusted the "collected all points" color to accommodate the psychopaths using light mode

> [`3.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.2)
- Added German, Spanish, Portuguese, and Russian translations
    - Only Spanish is available for the Settings page
    - Adjusted most language-dependent clues (tooltips)
- Added extra settings to Away Mode (lurking)
- Added the Prime Loot option
- Added `GetVolume` `SetVolume` `GetViewMode` `SetViewMode`

> [`3.1.5.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.5.5)
- Fixed Tooltips (font)
- QoL changes
    - Adjusted settings page
- Added `UUID.ergo` (a more secure `UUID.from`)

> [`3.1.5.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.5.4)
- Fixed emote searching

> [`3.1.5.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.5.3)
- Fixed Soft Unban

> [`3.1.5.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.5.2)
- Fixed Tooltips (again)
- Fixed Auto Claim

> [`3.1.5.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.5.1)
- Fixed Tooltips

> [`3.1.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.5)
- Added "View Mode"
- Fixed Tooltips

> [`3.1.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.4)
- Adjusted Prevent Spam handling (can now handle bit donations)
- Added "You are banned" banner for Soft Unban
- Adjusted "Rewards Calculator" logic

> [`3.1.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.3)
- Fixed an issue for message filtering

> [`3.1.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.2)
- Fixed issue where clicking a channel from the side panel would remove all First in Line events

> *3.1.1.1* **Chrome**
- Fixed badge color

> [`3.1.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.1)
- Fixed sound linking on options page
- Added `chat.js` re-initializer
- QoL changes
    - Moved Whisper Audio from `SENSITIVE_FEATURES` to reload audio independent of the frame
    - Changed "Away Mode" `enabled` color to match neighbors
    - Adjusted settings page to enable/disable features that require one-another accordingly
    - Fixed input padding on settings page
- Fixed "Collect Emotes" logic
- Added extra options for "Display in Console"
- Adjusted BTTV emote loading

> [`3.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1)
- Added "Soft Unban"
- Added skeleton for "Adaptive Scheduling"
- Fixed mixed-emote handling
- Added "Simplify Chat" (first "real" accessibility option)
- Added optional notification sounds for "Whisper Audio"

> [`3.0.8`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0.8)
- Fixed iframe loading (Chat reload)

> [`3.0.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0.7)
- Fixed "Highlight mentions"
- Fixed iframe loading (Chat reload)
- Fixed iframe Popups
- Removed unnecessary awaits

> [`3.0.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0.6)
- Fixed "Prevent Raiding"
- Fixed "Prevent Hosting"
- Fixed emote searching

> [`3.0.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0.5)
- Fixed "Rewards Calculator"
- Fixed "Stay Live"

> [`3.0.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0.4)
- Fixed BTTV emote loading (stability)
- Added `LIVE_CACHE` functionality as a `STREAMER` back-up
- Fixed "Recover Chat"
    > Fixed issue where Twitch could delete chat multiple times, preventing point collection
    - The extension will now rebuild the broken frame each time it malfunctions
- QoL changes
    - Made text gold for channels where all Rewards/Challenges are redeemable

> [`3.0.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0.3)
- Fixed short icon URLs
- Fixed "Native Reply"

> [`3.0.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0.2)
- Fixed point viewer on extended rich-tooltip
- Fixed issue with `parseTime` parsing integers instead of strings

> [`3.0.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0.1)
- Fixed duplicate "Up Next" additions

> [`3.0`](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0)
- Moved features that can be run on the chat iFrame to `chat.js`
    - Moved "Recover Chat" to its own feature-space
- Fixed channel point receipt addition
- Fixed message filtering (plagiarized and repetitious)
- QoL changes
    - Added "New!" styling to the settings page
    - Made the large streamer icon draggable to "Up Next"
    - Added automatic garbage collector for cached data
    - Added custom channel point icons to the rich tooltip
    - Corrected "Available during this stream" logic
- Fixed issue where captured (esp. locked) emotes would not be displayed under "Captured Emotes"
- Fixed issue that removed unfollowed channels from "Up Next"

----

> [`2.11.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.11.5)
- Added searching feature (for cards) `new Search(...)`

> [`2.11.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.11.4)
- QoL changes
    - Added emote cards `new Card({ ... })`
    - Enhanced message filtering, esp. emotes and BTTV emotes

> [`2.11.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.11.3)
- Fixed "Channel Specific BTTV Emotes"

> [`2.11.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.11.2) **Chrome**
- Fixed Chrome icon color

> [`2.11.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.11.1)
- Fixed issue where `BAD_STREAMERS` was null by default and caused fail
- Added "number of emote results"

> [`2.11`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.11)
- Added sub-feature to load channel specific emotes
- Made emotes searchable

> *2.10.1*/*2.10.2* **GitHub**
- Fixed version information
- Fixed icon color

> [`2.9.10`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.10)
- Fixed issue that would not register `ondrop` events
- Fixed issue that would not add points collected from bets
- Fixed `STREAMER.ping` logic
- Added "BetterTTV Emotes"

> [`2.9.9`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.9)
- Fixed issue where points were doubled incorrectly

> [`2.9.8`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.8)
- Fixed plural suffixes
- Fixed issue where clicking a channel disabled "Stay Live"
- Fixed issue where channel points were counted incorrectly

> [`2.9.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.7)
- Fixed issue that would not proceed to the next channel

> [`2.9.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.6)
- Fixed issue that would filter all messages

> [`2.9.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.5)
- Fixed "Stay Live" issue that would continue the timer if the current stream ended

> [`2.9.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.4)
- Fixed issue where auto-join was disabled
- Added the "Channel Points Receipt (Display)" option

> [`2.9.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.3)
- Fixed issue where clicking Up Next would not restart the timer
- Fixed issue where some offline channels still appeared as "live"

> [`2.9.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.2)
- Fixed issue where watching videos (past streams) would trigger some un-needed settings
- Changed badge filtering functionality: channels can now use pattern-badges like non-channels
- Changed "Auto-Follow (Time)" to also check the "Watch Time"

> [`2.9.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.1)
- Added "Greedy" option for "Prevent Raid" to collect bonus channel points
- Adjusted job reasoning functionality
- Fixed issue that would cause chat to be destroyed or inaccessible
- Added small border to notify the user "Up Next Boost" is enabled

> [`2.9`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9)
- Added settings for "Prevent Spam"
- Adjusted spam filter settings to look prettier
- Added "proper" unhandling method for page traversing (restarts certain jobs)
- Adjusted "Stay Live" timer. Conflicts with "Prevent Host" and "Prevent Raid"
- Added ability for "Recover Pages" to detect if chat is missing
- Adjusted Settings page to be more uniform
    - Added Twitch fonts
- Fixed issue that left the old tooltip for Away Mode => "over"
- Adjusted `tools.js` to unregister `*placement` features more subtly
- Added job reasoning functionality
- Fixed issue where "Recover Pages" could not be enabled
- Fixed issue where pressing [Enter] on polyfilled replies would remove some required elements

> [`2.8.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.7)
- Added code to detect the Chrome version (GitHub version only)
- Fixed issue where the "Channel Points Receipt" would be persistent
- Adjusted wording and formula for the "Rewards Calculator"
- Adjusted wording on Settings page to make it easier to understand
- Added "update available" logic

> [`2.8.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.6)
- Added metrics-collection for channels
- Removed "tabs" permission (per Chrome's request)

> [`2.8.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.5)
- Added "Highlight Mentions Extras"
- Fixed "Convert Emotes"; now has a drag feature
- Adjusted "Auto-Focus" to be more sensitive to positive trends, and less to negative

> [`2.8.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.4)
- Added "Points Receipt"
- Added "Rewards Calculator"
- Fixed "Stop Hosting" and "Stop Raiding" wording

> [`2.8.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.3)
- Changed icon color to differentiate between GitHub (gold) and Chrome (purple) versions
- Added "Whisper Audio"
- Fixed emotes for `GetChat`
- Added "Auto-pause"
- When cancelling a First in Line event, ignore the event entirely
- When presented with a pay-wall, no longer treats it as an error message

> [`2.8.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.2)
- Added "Keep Pop-out"
- Added "Prevent spam"
- Fixed "Boost" feature
- Fixed "Up Next" feature (when disabled)
- Fixed "Prevent Hosting"
- Fixed "Prevent Raiding"

> [`2.8.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.1)
- Added "Boost" feature
- Corrected packages

> [`2.8`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8)
- Adjusted `ConvertTime`
- Added subscription type "convert"
- Added Recover Pages feature
- Added skeleton for view modes (e.g. "squad")
    - Disabled page reloading for re-init events
- Added "continue raiding" logic

> [`2.7.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.7.7)
- Fixed a theme issue
- Clarified installation procedures, settings, and "Up Next"

> [`2.7.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.7.6)
- Added "fold dead only" feature (enabled; not under settings)
- Fixed an issue with "Recover Video" timing

> [`2.7.5`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.7.5)
- Adjusted settings layout
- Adjusted README
- Fixed duplicate job error

> [`2.7.4`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.7.4)
- Changed Up Next timing settings

> [`2.7.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.7.3)
- Fixed an edge-case issue for side-nav expansion

> [`2.7.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.7.2)
- Changed layout of settings
- Removed unused settings

> [`2.7`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.7)
- Added the "Point Watcher" feature

> [`2.6.3`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.6.3)
- Fixed First in Line+

> [`2.6.2`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.6.2)
- Fixed job duplicates

> [`2.6.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.6.1)
- Fixed onnewmessage event setter

> [`2.6`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.6)
- Fixed Native Chat Replies
- Added the "Watch Time" feature

> [`2.5.1`](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.5.1)
- Fixed the First in Line ordering mechanic
- Added the "Recover Frames" option (frame-drop detection)
- Added the "Customization" section
    - Added the "Button Placement" option
- Added the "Experimental Features" section
    - Added the "Use Fine Details" option
    - Moved experimental features to this section
- Channel notifications can now be properly dragged to the "First in Line" area
- Chat popups have been fixed
