# Twitch Tools - To-Do List

### TO-DO (Known Issues)
1. Some elements don't register (like SVG animations)
    * Fixed?
2. The Up Next timer resets when clicking a channel from the side-panel
    * In work...
    * Fine how it is?
3. `UserIntent` doesn't prevent faulty "no longer live" from firing
    * Causes reloads?
    * Not sure where to begin...
4. If the page isn't fully reloaded, pausing the timer doesn't work
    * Since 2.8.3
    * Fixed? 2.8.3
5. When all channels are deleted (on the side-panel by Twitch), First in Line re-adds all channels
    * Added code to *detect* if the channels were deleted, and ignore the change
    * Fixed? 2.8.3
6. Away-Mode displayed over the video keeps the "fullscreen" tooltip attached

- Clean up SVGs and loading
- Provide more concise and informative console messages

========

# TO-DID (Fixed Issues)
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

========

# ACCOMPLISHED (Notable Changes)
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
