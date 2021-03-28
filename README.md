# Twitch-Tools

An extension that gives you a set of tools to control your Twitch&trade; experience.

Get for [Google Chrome](https://chrome.google.com/webstore/detail/twitch-tools/fcfodihfdbiiogppbnhabkigcdhkhdjd)

## Features/Settings

### Automation

- *Auto-Join* `off` &mdash; Automatically proceed to watch parties and mature streams
- *Away Mode* `on` &mdash; Toggle between **low** and **auto** quality
- *Claim Bonuses* `on` &mdash; When the Bonus Channel Points button appears, click it
- *First in Line/Up Next* &mdash; When a channel you follow begins streaming, automatically go to it
    - `default` Do not go to any channels automatically
    - When you receive a notification for a followed channel going live, head to it after `15` minutes
    - When a followed channel's icon appears, head to it after `15` minutes
    - Go to all streams after `15` minutes automatically
- *Follows* &mdash; When watching a stream, automatically follow the channel
    - `default` Do not follow any channels automatically
    - When participating in a raid, follow the channel being raided
    - After watching `15` minutes of content, follow the channel
    - Follow all channels automatically
- *Next Channel* &mdash; Decide how the next channel is chosen (after __Up Next__ is empty)
    - `default` Go to a random channel
    - Go with the least viewers
    - Go with the most viewers
    - Go with the least channel points
    - Go with the most channel points
- *Kill Extensions* `off` &mdash; *Currently under __Experimental Features__*
- *Prevent Hosting* &mdash; When a channel begins hosting, go to the __Next Channel__
    - `default` Allow all channels to be hosted
    - Prevent all channels from being hosted
    - Prevent channels you don't follow from being hosted
- *Prevent Raiding* &mdash; When a raid begins, go to the __Next Channel__
    - `default` Allow all channels to be raided
    - Only raid to collect the bonus points
    - Prevent all channels from being raided
    - Prevent channels you don't follow from being raided
- *Stay Live* `on` &mdash; When the stream you're watching ends, go to the __Next Channel__

### Chat & Messaging

- *Convert Emotes* `off` &mdash; *Currently under __Experimental Features__*
- *Filter Messages* `on` &mdash; Remove messages across all channels
    - `text` &mdash; will remove all messages containing *text*
    - `:emote:` &mdash; will remove all messages containing the emote named *emote*
    - `@username` &mdash; will remove all messages from *username*
    - `/channel text` &mdash; will remove all messages containing *text*, but only on *channel*
    - `[^\/*+?$]` &mdash; [JavaScript-based RegExps](https://javascript.info/regular-expressions) can also be used: `swears?` will remove "swear", "swears", "SWEAR", "SWEARS" and all other variations
- *Highlight Mentions* `on` &mdash; When someone mentions you (*@username*), highlight the message(s) in chat
- *Show pop-ups* `on` &mdash; When someone mentions you (*@username*), show a pop-up of the message(s)
- *Prevent Spam* `off` &mdash; *Currently under __Experimental Features__*
- *Whisper Audio* `off` &mdash; When someone sends you a whisper, play a notification sound

### Currencies

- *Convert Bits* `on` &mdash; When presented with Bits, show the true USD amount they represent
- *Channel Points Receipt* &mdash; Decide whether to display the exact number of channel points collected
    - `default` Display the exact amount collected
    - Round to the nearest hundred
- *Rewards Calculator* `off` &mdash; Estimates how long a stream needs to be watched non-stop to redeem a Channel Points reward

### Customization

- *Away Mode* &mdash; Choose where the **Away Mode** button is placed
    - *Where should the __Away Mode__ button be placed?* `Do not display`
- *Point Receipt* &mdash; Choose where the **Point Receipt** is placed
    - *Where should the __Point Receipt__ text be placed?* `Do not display`
- *Point Watcher* &mdash; Choose where the **Point Watcher** is placed
    - *Where should the __Point Watcher__ text be placed?* `Do not display`
- *Watch Time* &mdash; Choose where the **Watch Time** is placed
    - *Where should the __Watch Time__ text be placed?* `Do not display`

### Video Recovery

- *Keep Pop-out* `off` &mdash; Prevent the extension from destroying the pop-out of the stream
- *Recover Ads* `off` &mdash; When an advertisement freezes, attempt to recover it
- *Recover Frames* `on` &mdash; When the video fails to play for more than 15 seconds, reload the webpage
- *Recover Stream* `off` &mdash; When the stream freezes, attempt to recover it
- *Recover Video* `on` &mdash; When the video fails to download, reload the webpage

### Developer Mode

- *Display Console Messages* `off` &mdash; Allows the extension to display messages in the console
- *Display Statistics* `off` &mdash; Allow the extension to display statistics of the video
- *Experimental Features* `off` &mdash; Allows the extension to display, and use experimental features
- *Show Default Values* &mdash; Displays the default values

### Experimental Features

- *Auto-Focus* `off` &mdash; When there is an increase in video activity, automatically pause other features that would leave or alter the stream
- *BetterTTV emotes* `off` &mdash; Allow the extension to use and display BTTV emotes
- *Convert Emotes* `off` &mdash; When presented with emote-based text, convert the text into its corresponding emotes (without requiring a subscription)
- *Kill Extensions* `off` &mdash; Do not allow Twitch&trade; extensions to display
- *Native Reply* `off` &mdash; Attempt to display Twitch&trade; replies
- *Prevent spam* `off` &mdash; Hide repetitive messages in chat
- *Recover Pages* `off` &mdash; When the webpage or chat fails to display, reload the webpage
- *Use Fine Details* `off` &mdash; Allow the extension to use (not collect) Twitch&trade; API data
