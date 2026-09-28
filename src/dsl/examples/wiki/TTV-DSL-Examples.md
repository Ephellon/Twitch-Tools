# TTV DSL examples

Ready-to-use scripts for **User Scripts** in TTV Tools, each one small enough to read in a
minute and each one showing a different part of the language. Copy one, change the words,
and it's yours.

| Example | What it does | What it shows | Permissions |
| :--- | :--- | :--- | :--- |
| [Hello Bot](Example-Hello-Bot) | `!hello`, `!bye`, `!who`, a reminder while live | commands, settings, remembering things, random replies, moderator-only reactions, timers | none |
| [Stream Info](Example-Stream-Info) | `!game`, `!title`, `!viewers`, `!uptime` | reading the channel's live data, formatting time, cleaning up text | none |
| [Stream Timers](Example-Stream-Timers) | hydration and stretch reminders, `!time` | repeating and one-off timers, live-only timers, the streamer's clock | `read:datetime` |
| [Link Guard](Example-Link-Guard) | asks viewers not to post outside links | reading links, filtering lists, checking badges | none |
| [Raid Shoutouts](Example-Raid-Shoutouts) | thanks raiders; mods re-shout with `!so` | raid events, number and dropdown settings, delays, arithmetic | `eval:calc` |
| [Dice & Games](Example-Dice-and-Games) | `!roll`, `!coin`, `!8ball` | your own functions, loops, lists, arithmetic | `eval:calc` |

Start with **Hello Bot** if you're new; each page after it introduces a little more.

## Reading a script

- **`plugin`** at the top names the script and declares its settings, which appear on the
  Settings page.
- **`await (…)`** waits for something — a chat message, a command, a raid — and runs the
  indented lines under it every time it happens. **`await 15:00`** runs every fifteen minutes.
- **`.name`** reads from what just happened: `.sender`, `.command`, `.argument`, `.links`.
  **`#name`** reads from the channel: `#live`, `#game`, `#viewers`, `#uptime`.
- **`POST`** sends a message to chat; **`REPLY`** answers the message that triggered it.
- **`setting.name`** reads one of your settings.
- **`// …`** is a comment.

## Permissions

Most scripts need none. A script that does something more — read the clock, do arithmetic —
asks for it in a `using` line, and TTV Tools shows you that request (with the script's reason)
before the script can run. Nothing is granted silently.
