# TTV Tools &mdash; To-Do List

# TO-DO &mdash; Known Issues

1. Accessibility options?
    * Not sure what to add...
2. Instance (tab) data separation?
    * Simply separate each tab's data for certain things, e.g. "Up Next"
3. "Predictive Raiding"
    * Uses the streamers' `dailyBroadcastTime` to predict when their stream will end
        * OR - listen for notifications/channel-popups; then save a timer (`{streamsCounted}:{totalSecondsCountedLive}`) for how long the channel lives
    * Heads to the stream 5min before it **should** end
    * Only applies to streams that have a `raidsLastWeek` &ge; 3
4. "Away Mode Lurking Schedule"
    * Automatically enables &/ disables Away Mode at user defined times
5. "Reverse Emotes"
    * Sets all emotes back to their text and displays the image in a tooltip
6. Add the option to keep Up Next purely unique
    * Maybe the user wants to create a repeating queue
    * Up Next does not currently allow duplicates
7. Add the "Sync Activity across devices" option
    * If a channel is already being watched on a different machine, go to a different, unique channel
8. Remove more language dependencies
    * `parseCoin` is language dependent - it only reads "SI" units
    * All bulletin filters are language dependent - they only recognize English

- Make initial loading actions less intrusive
    - [x] "Prime Loot" open/close action
    - [x] "Convert Emotes" open/close action
    - [x] "BetterTTV Emotes" open/close action
- [ ] Clean up SVGs & IMGs
- [x] Provide more concise and informative console messages
- [ ] Add more translations
- ~~Listen for "on-subscribe" events to update the Channel Points Multiplier?~~
    * Too invasive. Does not match importance in proportion

----

# DONE &mdash; Notable Changes

> [4.11.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.11.1)
- Fixed rich tooltip v. main menu width styling
- Adjusted Up Next notification logic
- Fixed Up Next pausing ability
- Adjusted Up Next single instance logic

> [4.11](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.11)
- Removed some language dependencies

> [4.10.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.10.1)
- Fixed issue where the channel search would fail the extension altogether

> [4.10](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.10)
- Fixed First in Line Boost logic (state saving)
- Fixed First in Line timing logic
- Fixed Stream Preview returning the volume to its initial value

> [4.9](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.9)
- Adjusted Watch Time clock logic
- Fixed Up Next - One Instance wording
- Adjusted First in Line logic

> [4.8](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.8)
- Added the Up Next - One Instance option

> [4.7](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.7)
- Added job reconstruction logic
    + Should be able to re-add non-followed channels
- Adjusted the way the Up Next count is calculated
- Adjusted the Stream Preview positioning logic

> [4.6.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.6.1)
- Fixed Up Next boost

> [4.6](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.6)
- Adjusted Recover Video logic
- Adjusted Simplify Chat reloading mechanic
- Adjusted First in Line timer logic
    + Should make freezing less impactful

> [4.5](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.5)
- Updated settings' version pulling functionality
- Adjusted volume control release mechanic
- Added the "Ignore VODs" sub-option to Stay Live

> [4.4](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.4)
- Fixed version updating mechanic
- Added update availability notice for the Chrome version; uses the GitHub version
- Added `/core.js` to house shared functionality
- Added ability for "Auto Join" to work for framed pages (Stream previews)
- Added volume-control release logic (the user can change the volume without turning "Away Mode" off)

> [4.3.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.3.1)
- Moved some styling to `extras.css`
- Added logic to fade audio from the main video to the preview and vice versa
- Removed job restarting for the BTTV Emote populator (caused major CPU issues)

> [4.3](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.3)
- Adjusted Up Next logic
- Fixed Filter Bulletins logic
- Fixed styling, and other issues due to Twitch update

> [4.2.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.2.1)
- Fixed Settings styling
- Added `GetChat.defer` to run after completed events
- Fixed Dual Toning for Simplify Chat
- Fixed panel-opening logic
- Added Filter Bulletins to Filter Messages

> [4.2.0.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.2.0.1)
- Adjusted Point Watcher logic
- Added option to mute Stream Previews

> [4.2.0](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.2.0)
- Removed `CRX` package
- Fixed edge-case where streamer data wouldn't be passed to `chat.js`
- Added Stream Preview
- Fixed Keep Popout
- Added Accent Color

> [4.1.9](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.9)
- Adjusted "Next Channel" logic

> [4.1.8](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.8)
- Fixed "Disabled" icon for rich tooltips
- Adjusted the Live Time tooltip (easier to understand)
- Added more options for "Next Channel"

> [4.1.7](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.7)
- Fixed Convert Bits
- Up Next is now scrollable

> [4.1.6](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.6)
- Fixed Stay Alive logic
- Fixed BTTV emote loading (initial rewrite)

> [4.1.5](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.5)
- Fixed Stay Alive logic

> [4.1.4](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.4)
- Fixed some styling issues

> [4.1.3](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.3)
- Fixed Easy Highlighter (emotes)
- Adjusted `comify` to include different locales

> [4.1.2](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.2)
- Fixed Easy Highlighter

> [4.1.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1.1)
- Fixed translation error for the Creative Commons License notice

> [4.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.1)
- Improved `String..pluralSuffix`
- Adjusted dynamic tooltip styling
- Added tooltips to stream tags (apart of `show_stats`)
- Added Highlight phrases
- Adjusted Whisper Audio to include: mentions, phrases, and whispers

> [4.0.3](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.0.3)
- Adjusted Auto-Focus logic
- Fixed Away Mode (Twitch update)

> [4.0.2](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.0.2)
- Fixed Pointer Watcher Placement error

> [4.0.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.0.1)
- Fixed Pointer Watcher Placement error

> [4.0](https://github.com/Ephellon/Twitch-Tools/releases/tag/4.0)
- Re-named project to "TTV Tools"
- Added last translations to language packs

----

> [3.3.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.3.1)
- Added the Up Next tutorial image; removed English text
- Adjusted live-time tooltip appearance (apart of `show_stats`)
- Adjusted Auto-Focus logic and appearance
- Fixed preferred language loading for the Settings
- Added translations to `nth`

> [3.3](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.3)
- Added initial language picker to Settings page
- Finalized all language packs (also created "Help Translate" issue template)
- Added automatic (tag) detection option to `auto_focus`

> [3.2.2](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.2.2)
- Fixed Away Mode (video quality)

> [3.2.1.2](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.2.1.2)
- Finalized the English (`en`) language package
- Adjusted other language packs
- Fixed ad-detection for `tools.js`
- Adjusted Video Recovery console messages
- Added more sub-features to Show Statistics (`display_of_video` &rarr; `show_stats`)

> [3.2.1.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.2.1.1)
- Added the "User Language Preference" features
    - Applicable settings will update in real time to language changes
- Quality of life changes
    - Adjusted the "auto claim" button
        - Made it easier to toggle (CSS)
        - Fixed tooltip issue for channels with the default Channel Point icon

> [3.2.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.2.1)
- Adjusted the "Auto Claim" toggle button to describe its function pictorially
- Styling adjustments to Settings page (popup)
- Quality of life changes
    - Adjusted the "collected all points" color to accommodate the psychopaths using light mode

> [3.2](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.2)
- Added German, Spanish, Portuguese, and Russian translations
    - Only Spanish is available for the Settings page
    - Adjusted most language-dependent clues (tooltips)
- Added extra settings to Away Mode (lurking)
- Added the Prime Loot option
- Added `GetVolume` `SetVolume` `GetViewMode` `SetViewMode`

> [3.1.5.5](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.5.5)
- Fixed Tooltips (font)
- Quality of life changes
    - Updated settings page
- Added `UUID.ergo` (a more secure `UUID.from`)

> [3.1.5.4](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.5.4)
- Fixed emote searching

> [3.1.5.3](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.5.3)
- Fixed Soft Unban

> [3.1.5.2](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.5.2)
- Fixed Tooltips (again)
- Fixed Auto Claim

> [3.1.5.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.5.1)
- Fixed Tooltips

> [3.1.5](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.5)
- Added "View Mode"
- Fixed Tooltips

> [3.1.4](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.4)
- Updated Prevent Spam handling (can now handle bit donations)
- Added "You are banned" banner for Soft Unban
- Modified "Rewards Calculator" logic

> [3.1.3](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.3)
- Fixed an issue for message filtering

> [3.1.2](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.2)
- Fixed issue where clicking a channel from the side panel would remove all First in Line events

> *3.1.1.1* **Chrome**
- Fixed badge color

> [3.1.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1.1)
- Fixed sound linking on options page
- Added `chat.js` re-initializer
- Quality of life changes
    - Moved Whisper Audio from `SENSITIVE_FEATURES` to reload audio independent of the frame
    - Changed "Away Mode" `enabled` color to match neighbors
    - Updated settings page to enable/disable features that require one-another accordingly
    - Fixed input padding on settings page
- Fixed "Collect Emotes" logic
- Added extra options for "Display in Console"
- Modified BTTV emote loading

> [3.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.1)
- Added "Soft Unban"
- Added skeleton for "Adaptive Scheduling"
- Fixed mixed-emote handling
- Added "Simplify Chat" (first "real" accessibility option)
- Added optional notification sounds for "Whisper Audio"

> [3.0.8](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0.8)
- Fixed iframe loading (Chat reload)

> [3.0.7](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0.7)
- Fixed "Highlight mentions"
- Fixed iframe loading (Chat reload)
- Fixed iframe Popups
- Removed unnecessary awaits

> [3.0.6](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0.6)
- Fixed "Prevent Raiding"
- Fixed "Prevent Hosting"
- Fixed emote searching

> [3.0.5](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0.5)
- Fixed "Rewards Calculator"
- Fixed "Stay Live"

> [3.0.4](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0.4)
- Fixed BTTV emote loading (stability)
- Added `LIVE_CACHE` functionality as a `STREAMER` back-up
- Fixed "Recover Chat"
    > Fixed issue where Twitch could delete chat multiple times, preventing point collection
    - The extension will now rebuild the broken frame each time it malfunctions
- Quality of life changes
    - Made text gold for channels where all Rewards/Challenges are redeemable

> [3.0.3](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0.3)
- Fixed short icon URLs
- Fixed "Native Reply"

> [3.0.2](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0.2)
- Fixed point viewer on extended rich-tooltip
- Fixed issue with `parseTime` parsing integers instead of strings

> [3.0.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0.1)
- Fixed duplicate "Up Next" additions

> [3.0](https://github.com/Ephellon/Twitch-Tools/releases/tag/3.0)
- Moved features that can be run on the chat iFrame to `chat.js`
    - Moved "Recover Chat" to its own feature-space
- Fixed channel point receipt addition
- Fixed message filtering (plagiarized and repetitious)
- Quality of life changes
    - Added "New!" styling to the settings page
    - Made the large streamer icon draggable to "Up Next"
    - Added automatic garbage collector for cached data
    - Added custom channel point icons to the rich tooltip
    - Corrected "Available during this stream" logic
- Fixed issue where captured (esp. locked) emotes wouldn't be displayed under "Captured Emotes"
- Fixed issue that removed unfollowed channels from "Up Next"

----

> [2.11.5](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.11.5)
- Added searching feature (for cards) `new Search(...)`

> [2.11.4](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.11.4)
- Quality of life changes
    - Added emote cards `new Card({ ... })`
    - Enhanced message filtering, esp. emotes and BTTV emotes

> [2.11.3](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.11.3)
- Fixed "Channel Specific BTTV Emotes"

> [2.11.2](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.11.2) **Chrome**
- Fixed Chrome icon color

> [2.11.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.11.1)
- Fixed issue where `BAD_STREAMERS` was null by default and caused fail
- Added "number of emote results"

> [2.11](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.11)
- Added sub-feature to load channel specific emotes
- Made emotes searchable

> *2.10.1*/*2.10.2* **GitHub**
- Fixed version information
- Fixed icon color

> [2.9.10](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.10)
- Fixed issue that wouldn't register `ondrop` events
- Fixed issue that wouldn't add points collected from bets
- Fixed `STREAMER.ping` logic
- Added "BetterTTV Emotes"

> [2.9.9](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.9)
- Fixed issue where points were doubled incorrectly

> [2.9.8](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.8)
- Fixed plural suffixes
- Fixed issue where clicking a channel disabled "Stay Live"
- Fixed issue where channel points were counted incorrectly

> [2.9.7](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.7)
- Fixed issue that would not proceed to the next channel

> [2.9.6](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.6)
- Fixed issue that would filter all messages

> [2.9.5](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.5)
- Fixed "Stay Live" issue that would continue the timer if the current stream ended

> [2.9.4](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.4)
- Fixed issue where auto-join was disabled
- Added the "Channel Points Receipt (Display)" option

> [2.9.3](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.3)
- Fixed issue where clicking Up Next wouldn't restart the timer
- Fixed issue where some offline channels still appeared as "live"

> [2.9.2](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.2)
- Fixed issue where watching videos (past streams) would trigger some un-needed settings
- Changed badge filtering functionality: channels can now use pattern-badges like non-channels
- Changed "Auto-Follow (Time)" to also check the "Watch Time"

> [2.9.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9.1)
- Added "Greedy" option for "Prevent Raid" to collect bonus channel points
- Adjusted job reasoning functionality
- Fixed issue that would cause chat to be destroyed or inaccessible
- Added small border to notify the user "Up Next Boost" is enabled

> [2.9](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9)
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

> [2.8.7](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.7)
- Added code to detect the Chrome version (GitHub version only)
- Fixed issue where the "Channel Points Receipt" would be persistent
- Adjusted wording and formula for the "Rewards Calculator"
- Adjusted wording on Settings page to make it easier to understand
- Added "update available" logic

> [2.8.6](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.6)
- Added metrics-collection for channels
- Removed "tabs" permission (per Chrome's request)

> [2.8.5](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.5)
- Added "Highlight Mentions Extras"
- Fixed "Convert Emotes"; now has a drag feature
- Adjusted "Auto-Focus" to be more sensitive to positive trends, and less to negative

> [2.8.4](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.4)
- Added "Points Receipt"
- Added "Rewards Calculator"
- Fixed "Stop Hosting" and "Stop Raiding" wording

> [2.8.3](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.3)
- Changed icon color to differentiate between GitHub (gold) and Chrome (purple) versions
- Added "Whisper Audio"
- Fixed emotes for `GetChat`
- Added "Auto-pause"
- When cancelling a First in Line event, ignore the event entirely
- When presented with a pay-wall, no longer treats it as an error message

> [2.8.2](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.2)
- Added "Keep Pop-out"
- Added "Prevent spam"
- Fixed "Boost" feature
- Fixed "Up Next" feature (when disabled)
- Fixed "Prevent Hosting"
- Fixed "Prevent Raiding"

> [2.8.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.1)
- Added "Boost" feature
- Corrected packages

> [2.8](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8)
- Updated `ConvertTime`
- Added subscription type "convert"
- Added Recover Pages feature
- Added skeleton for view modes (e.g. "squad")
    - Disabled page reloading for re-init events
- Added "continue raiding" logic

> [2.7.7](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.7.7)
- Fixed a theme issue
- Clarified installation procedures, settings, and "Up Next"

> [2.7.6](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.7.6)
- Added "fold dead only" feature (enabled; not under settings)
- Fixed an issue with "Recover Video" timing

> [2.7.5](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.7.5)
- Updated settings layout
- Updated README
- Fixed duplicate job error

> [2.7.4](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.7.4)
- Changed Up Next timing settings

> [2.7.3](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.7.3)
- Fixed an edge-case issue for side-nav expansion

> [2.7.2](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.7.2)
- Changed layout of settings
- Removed unused settings

> [2.7](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.7)
- Added the "Point Watcher" feature

> [2.6.3](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.6.3)
- Fixed First in Line+

> [2.6.2](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.6.2)
- Fixed job duplicates

> [2.6.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.6.1)
- Fixed onnewmessage event setter

> [2.6](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.6)
- Fixed Native Chat Replies
- Added the "Watch Time" feature

> [2.5.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.5.1)
- Fixed the First in Line ordering mechanic
- Added the "Recover Frames" option (frame-drop detection)
- Added the "Customization" section
    - Added the "Button Placement" option
- Added the "Experimental Features" section
    - Added the "Use Fine Details" option
    - Moved experimental features to this section
- Channel notifications can now be properly dragged to the "First in Line" area
- Chat popups have been fixed

----

# FIXED &mdash; Fixed Issues

> [2.9](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.9)*
1. Some elements don't register (like SVG animations)
    * Fixed? 2.9
2. The Up Next timer resets when clicking a channel from the side-panel
    * In work...
    * Fine how it is?
3. `UserIntent` doesn't prevent faulty "no longer live" from firing
    * Causes reloads?
    * Fixed. Was issue with "Stay Live" and page reloading
4. If the page isn't fully reloaded, pausing the timer doesn't work
    * Since 2.8.3
    * Fixed? 2.8.3
5. When all channels are deleted (on the side-panel by Twitch), First in Line re-adds all channels
    * Added code to *detect* if the channels were deleted, and ignore the change
    * Fixed? 2.8.3

> [2.8.8](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.8)
1. Away-Mode displayed over the video keeps the "fullscreen" tooltip attached
    * Fixed. 2.8.8

> [2.8.3](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.3)
1. Removing a channel from Up Next before it goes live re-adds it
    * Only when both First in Line features are enabled
    * Fixed: added code to ignore canceled jobs
        * Old "First in Line" Flow Chart:
            * `Twitch Notification` &rarr; FirstInLine Event &rarr; `User cancels event` &rarr; FirstInLinePlus Event
        * New "First in Line" Flow Chart:
            * `Twitch Notification` &rarr; FirstInLine Event &rarr; `User cancels event` &rarr; Interrupt @FirstInLine Event

> [2.8.2](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.8.2)
1. If Up Next is set to off, the dead page will continue to reload
    - Change `GetNextStreamer` logic
2. If the Boost feature has anyone in the queue, the boost will activate by itself
    - Added `parseBool` function to check for actually falsy values
3. If too many channels are shown on the side-nav, others may be removed as they are seen as "dead"
    * Fixed? The extension loads more channels automatically
        * The jobs are marked as "dead" because there are too many elements and `isLive` can't access the elements properly
4. Switching to another channel causes the "Auto-Collect Bonus Points" to bleed into the next element
    * Fixable: there is a div with the "+X" points text that never gets deleted by Twitch
5. Jobs duplicate. From old job-names, and notifications (drop-down)
    * Fixed?
    * Fixed. Needed to ensure __all__ channels were added and not overridden
    * Also: needed to specify the location of the elements to watch (side-panel anchors v. all anchors)
6. Channels appearing but not counted in First in Line+
    * Fixed. Used `streamers` instead of `STREAMERS`
7. Added the ability for the extension to resolve crashed pages
    * OK. Added an interval job to `background.js`
8. Remove unused settings' names from `settings.js`
    * Done.

> [2.6.3](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.6.3)
1. Fixed First in Line+

> [2.6.2](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.6.2)
1. Fixed onnewmessage event setter

> [2.6](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.6)
1. Fixed Native Chat Replies
2. Changed the usable namespace for saving settings
3. Added the "Watch Time" feature

> [2.5.1](https://github.com/Ephellon/Twitch-Tools/releases/tag/2.5.1)
1. New channels that give a notification before appearing count as dead until the page reloads
    - `FIRST_IN_LINE_JOB = setInterval(...)`
    - Forgot to return a value for `.map`. We don't talk about it
2. Notifications sometimes don't trigger First in Line (job addition)
    - See above note
3. The chat popups don't propagate
    - Fixed.
