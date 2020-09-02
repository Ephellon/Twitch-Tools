# Twitch-Tools

An extension that gives you a set of tools control your Twitch experience.

Get for [Google Chrome](https://chrome.google.com/webstore/detail/twitch-tools/fcfodihfdbiiogppbnhabkigcdhkhdjd)

## Features/Settings

### Automation

- *Away Mode* `on` &mdash; Toggle between **low** and **auto** quality
- *Claim Bonuses* `on` &mdash; When the Bonus Channel Points button appears, click it
- *First in Line* &mdash; When a channel you follow begins streaming, automatically go to it
    - `default` Do not go to any channels automatically
    - When you receive a notification for a followed channel going live, head to it after `X` (5) minutes
    - When a followed channel's icon appears, head to it after `X` (5) minutes
- *Follows* &mdash; When watching a stream, automatically follow the channel
    - `default` Do not follow any channels automatically
    - When participating in a raid, follow the channel being raided
    - After watching `X` (60) minutes of content, follow the channel
    - Follow all channels automatically
- *Kill Extensions* `off` &mdash; Do not allow Twitch&trade; extensions display
- *Prevent Hosting* `off` &mdash; When a channel begins hosting, go to a different, followed channel
- *Prevent Raiding* `off` &mdash; When a raid begins, go to a different, followed channel
- *Stay Live* `on` &mdash; When the current stream ends, got to a different, followed channel

### Chat & Messaging

- *Convert Emotes* `off` &mdash; When presented with emote-based text, convert the text into its corresponding emote (without requiring a subscription)
- *Filter Messages* `on` &mdash; Remove messages across all channels
    - `text` &mdash; will remove all messages containing *text*
    - `:emote` &mdash; will remove all messages containing the emote named *emote*
    - `@username` &mdash; will remove all messages from *username*
    - `/channel text` &mdash; will remove all messages containing *text*, but only on *channel*
    - `[^\/*+?$]` &mdash; [JavaScript-based RegExps](https://javascript.info/regular-expressions) can also be used: `swears?` will remove "swear", "swears", "SWEAR", "SWEARS" and all other variations
- *Highlight Mentions* `on` &mdash; When someone mentions you (*@username*), highlight the message(s) in chat
- *Show pop-ups* `on` &mdash; When someone mentions you (*@username*), show a pop-up of the message(s)

### Currencies

- *Convert Bits* `on` &mdash; When presented with Bits, show the true USD amount they represent

### Video Recovery

- *Recover Ads* `off` &mdash; When an advertisement freezes, attempt to recover it
- *Recover Stream* `off` &mdash; When the stream freezes, attempt to recover it
- *Recover Video* `on` &mdash; When the video fails to download, reload the webpage
