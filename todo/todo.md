# Twitch Tools - To-Do List

### TO-DO (Known Issues)
1. Accessibility options?
    * Not sure what to add...
2. Instance (tab) data separation?
    * Simply separate each tab's data for certain things, e.g. "Up Next"

- Clean up SVGs and loading
- Provide more concise and informative console messages

----

# ACCOMPLISHED (Notable Changes)
> 3.0.7
- Fixed "Highlight mentions"
- Fixed iframe loading (Chat reload)
- Fixed iframe Popups
- Removed unnecessary awaits

> 3.0.6
- Fixed "Prevent Raiding"
- Fixed "Prevent Hosting"
- Fixed emote searching

> 3.0.5
- Fixed "Rewards Calculator"
- Fixed "Stay Live"

> 3.0.4
- Fixed BTTV emote loading (stability)
- Added `LIVE_CACHE` functionality as a `STREAMER` back-up
- Fixed "Recover Chat"
    > Fixed issue where Twitch could delete chat multiple times, preventing point collection
    - The extension will now rebuild the broken frame each time it malfunctions
- Quality of life changes
    - Made text gold for channels where all Rewards/Challenges are redeemable

> 3.0.3
- Fixed short icon URLs
- Fixed "Native Reply"

> 3.0.2
- Fixed point viewer on extended rich-tooltip
- Fixed issue with `parseTime` parsing integers instead of strings

> 3.0.1
- Fixed duplicate "Up Next" additions

> 3.0
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

> 2.11.5
- Added searching feature (for cards) `new Search(...)`

> 2.11.4
- Quality of life changes
    - Added emote cards `new Card({ ... })`
    - Enhanced message filtering, esp. emotes and BTTV emotes

> 2.11.3
- Fixed "Channel Specific BTTV Emotes"

> 2.11.2 **Chrome**
- Fixed Chrome icon color

> 2.11.1
- Fixed issue where `BAD_STREAMERS` was null by default and caused fail
- Added "number of emote results"

> 2.11
- Added sub-feature to load channel specific emotes
- Made emotes searchable

> *2.10.1*/*2.10.2* **GitHub**
- Fixed version information
- Fixed icon color

> 2.9.10
- Fixed issue that wouldn't register `ondrop` events
- Fixed issue that wouldn't add points collected from bets
- Fixed `STREAMER.ping` logic
- Added "BetterTTV Emotes"

> 2.9.9
- Fixed issue where points were doubled incorrectly

> 2.9.8
- Fixed plural suffixes
- Fixed issue where clicking a channel disabled "Stay Live"
- Fixed issue where channel points were counted incorrectly

> 2.9.7
- Fixed issue that would not proceed to the next channel

> 2.9.6
- Fixed issue that would filter all messages

> 2.9.5
- Fixed "Stay Live" issue that would continue the timer if the current stream ended

> 2.9.4
- Fixed issue where auto-join was disabled
- Added the "Channel Points Receipt (Display)" option

> 2.9.3
- Fixed issue where clicking Up Next wouldn't restart the timer
- Fixed issue where some offline channels still appeared as "live"

> 2.9.2
- Fixed issue where watching videos (past streams) would trigger some un-needed settings
- Changed badge filtering functionality: channels can now use pattern-badges like non-channels
- Changed "Auto-Follow (Time)" to also check the "Watch Time"

> 2.9.1
- Added "Greedy" option for "Prevent Raid" to collect bonus channel points
- Adjusted job reasoning functionality
- Fixed issue that would cause chat to be destroyed or inaccessible
- Added small border to notify the user "Up Next Boost" is enabled

> 2.9
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

> 2.8.7
- Added code to detect the Chrome version (GitHub version only)
- Fixed issue where the "Channel Points Receipt" would be persistent
- Adjusted wording and formula for the "Rewards Calculator"
- Adjusted wording on Settings page to make it easier to understand
- Added "update available" logic

> 2.8.6
- Added metrics-collection for channels
- Removed "tabs" permission (per Chrome's request)

> 2.8.5
- Added "Highlight Mentions Extras"
- Fixed "Convert Emotes"; now has a drag feature
- Adjusted "Auto-Focus" to be more sensitive to positive trends, and less to negative

> 2.8.4
- Added "Points Receipt"
- Added "Rewards Calculator"
- Fixed "Stop Hosting" and "Stop Raiding" wording

> 2.8.3
- Changed icon color to differentiate between GitHub (gold) and Chrome (purple) versions
- Added "Whisper Audio"
- Fixed emotes for `GetChat`
- Added "Auto-pause"
- When cancelling a First in Line event, ignore the event entirely
- When presented with a pay-wall, no longer treats it as an error message

> 2.8.2
- Added "Keep Pop-out"
- Added "Prevent spam"
- Fixed "Boost" feature
- Fixed "Up Next" feature (when disabled)
- Fixed "Prevent Hosting"
- Fixed "Prevent Raiding"

> 2.8.1
- Added "Boost" feature
- Corrected packages

> 2.8
- Updated `ConvertTime`
- Added subscription type "convert"
- Added Recover Pages feature
- Added skeleton for view modes (e.g. "squad")
    - Disabled page reloading for re-init events
- Added "continue raiding" logic

> 2.7.7
- Fixed a theme issue
- Clarified installation procedures, settings, and "Up Next"

> 2.7.6
- Added "fold dead only" feature (enabled; not under settings)
- Fixed an issue with "Recover Video" timing

> 2.7.5
- Updated settings layout
- Updated README
- Fixed duplicate job error

> 2.7.4
- Changed Up Next timing settings

> 2.7.3
- Fixed an edge-case issue for side-nav expansion

> 2.7.2
- Changed layout of settings
- Removed unused settings

> 2.7
- Added the "Point Watcher" feature

> 2.6.3
- Fixed First in Line+

> 2.6.2
- Fixed job duplicates

> 2.6.1
- Fixed onnewmessage event setter

> 2.6
- Fixed Native Chat Replies
- Added the "Watch Time" feature

> 2.5.1
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

# TO-DID (Fixed Issues)
> 2.9.*
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

> 2.8.8
1. Away-Mode displayed over the video keeps the "fullscreen" tooltip attached
    * Fixed. 2.8.8

> 2.8.3
1. Removing a channel from Up Next before it goes live re-adds it
    * Only when both First in Line features are enabled
    * Fixed: added code to ignore canceled jobs
        * Old "First in Line" Flow Chart:
            * `Twitch Notification` -> FirstInLine Event -> `User cancels event` -> FirstInLinePlus Event
        * New "First in Line" Flow Chart:
            * `Twitch Notification` -> FirstInLine Event -> `User cancels event` -> Interrupt @FirstInLine Event

> 2.8.2
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
    * O.K. Added an interval job to `background.js`
8. Remove unused settings' names from `settings.js`
    * Done.

> 2.5.1
1. New channels that give a notification before appearing count as dead until the page reloads
    - `FIRST_IN_LINE_JOB = setInterval(...)`
    - Forgot to return a value for `.map`. We don't talk about it
2. Notifications sometimes don't trigger First in Line (job addition)
    - See above note
3. The chat popups don't propagate
    - Fixed.

> 2.6
1. Fixed Native Chat Replies
2. Changed the usable namespace for saving settings
3. Added the "Watch Time" feature

> 2.6.2
1. Fixed onnewmessage event setter

> 2.6.3
1. Fixed First in Line+
