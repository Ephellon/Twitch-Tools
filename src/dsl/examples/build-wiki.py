"""Builds the wiki pages in `examples/wiki/` from the scripts in `examples/`.

Each page embeds its script verbatim, marked `<!-- example: <name>.ttv -->`, and
`tests/examples.test.js` fails if a page ever drifts from its file. Run this after changing an
example:

    python dsl/examples/build-wiki.py
"""

import pathlib

HERE = pathlib.Path(__file__).parent
WIKI = HERE / 'wiki'


def script(name):
    """The example's source, with its marker, as a fenced block."""
    source = (HERE / f'{name}.ttv').read_text(encoding='utf-8').replace('\r\n', '\n')

    return f'<!-- example: {name}.ttv -->\n```ttv\n{source}```'


INSTALL = """## Try it

1. In TTV Tools, open **Settings → User Scripts** and choose **New script** (or save the
   script below as a `.ttv` file and use **Import .ttv…**).
2. Paste the script and save. It appears in the list with its own switch and settings.
3. Turn it on. If it asks for permissions, you'll be shown what and why before it runs."""


PAGES = {}

# --------------------------------------------------------------------------- index
PAGES['TTV-DSL-Examples'] = """# TTV DSL examples

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
"""

# --------------------------------------------------------------------------- hello bot
PAGES['Example-Hello-Bot'] = f"""# Example: Hello Bot

Greets chat on `!hello`, waves on `!bye`, remembers who it greeted last, salutes moderators,
and reminds chat it's there every fifteen minutes — but only while you're live. This is the
script TTV Tools ships with, grown a little.

{script('hello-bot')}

## What to notice

- **One handler, many commands.** `await (.command is SOMETHING)` runs on every command;
  `when .command is` then picks the branch by name. Commands nobody handles (`!lurk`) are
  simply ignored.
- **Optional arguments.** `.argument` is the text after the command. `is SOMETHING` asks "was
  anything typed?" — a bare `!hello` has an empty argument.
- **Remembering.** `.sender -> last_greeted` saves a value under a name. The `!who` branch
  reads it back, even though it runs for a different message.
- **Random replies.** `any from ( … )` picks one line at random each time.
- **Moderators only.** `using [moderator]` runs its lines only when the sender is a mod.
  `[vip moderator]` would mean "either".
- **Live-only timers.** `await 15:00 with (#live is true)` fires every fifteen minutes, but only
  while the stream is live.
- **Settings.** `setting reply: text …` becomes a text box on the Settings page;
  `setting.reply` reads what the viewer typed there.

## Settings

| Setting | Type | Default |
| :--- | :--- | :--- |
| Reply with the following | text | `Hi there!` |
| Remind chat every 15 minutes | checkbox | on |

## In chat

```
zip:   !who
bot:   Nobody has said !hello yet. Be the first!
zip:   !hello
bot:   Hi there!                                   (a reply to zip)
mod1:  !hello @shadyhen                            (mod1 is a moderator)
bot:   Hi there! @shadyhen
bot:   🛡️ mod1 is on duty.
zip:   !who
bot:   The last person I said hi to was mod1.
zip:   !bye
bot:   Thanks for stopping by 💜                   (or another goodbye)
       … 15 minutes later, while live …
bot:   Type !hello and I'll say hi 🤖
```

{INSTALL}
"""

# --------------------------------------------------------------------------- stream info
PAGES['Example-Stream-Info'] = f"""# Example: Stream Info

`!game`, `!title`, `!viewers` and `!uptime` — answered from the channel's live data, so the
answers are always current.

{script('stream-info')}

## What to notice

- **Channel data.** `#game`, `#title`, `#viewers`, `#uptime` and `#live` read the channel you're
  watching, live, every time. Others: `#name`, `#tags`, `#following`, `#subscribed`, `#points`.
- **A value on its own.** `REPLY #title % " "` needs no template; a template (`` `…` ``) is only
  for mixing text with values.
- **Cleaning up text.** `%` replaces line breaks (and the spaces around them) with what follows
  it — here a single space — so a multi-line title fits in one chat message.
- **Formatting time.** `#uptime` is a duration. `as "h'h 'm'm'"` formats it: `h` and `m` are
  hours and minutes, and anything in single quotes is kept as written. `as "hh:mm:ss"` would
  give `02:03:00`. (`~` means the same as `as`.)
- **`if` / `else`.** `if #live` is true while streaming.

## In chat

```
zip:  !game
bot:  We're playing Elden Ring
zip:  !title
bot:  Souls-likes ALL NIGHT
zip:  !viewers
bot:  42 people are watching 👀
zip:  !uptime
bot:  Live for 2h 3m
```

{INSTALL}
"""

# --------------------------------------------------------------------------- stream timers
PAGES['Example-Stream-Timers'] = f"""# Example: Stream Timers

Hydration reminders every half hour and a stretch break every hour — only while live — a
one-time "I'm here" when the script starts, and `!time` for the streamer's local clock.

{script('stream-timers')}

## What to notice

- **Repeating timers.** `await 30:00` runs every thirty minutes; `await 1:00:00` every hour.
  Durations are written `mm:ss` or `hh:mm:ss`.
- **Only while live.** `with (#live is true)` makes a timer skip its turn while you're offline,
  and pick up again when you go live.
- **One-off timers.** `after 1:00` waits once, then runs once.
- **Formatting durations.** `#uptime as "h?:mm:ss"` prints `2:03:00`. The `?` after `h` drops the
  hours entirely while they're zero, so twelve minutes in it prints `12:00`.
- **Asking for a permission.** Reading the streamer's clock is a permission, so the `!time`
  handler sits inside `using +read:datetime`. TTV Tools asks you before the script runs. The
  permission covers only the lines indented under it — the reminders don't need it.
- **Switching parts off.** Each reminder has its own checkbox on the Settings page.

## Settings

| Setting | Type | Default |
| :--- | :--- | :--- |
| Hydration reminder every 30 minutes | checkbox | on |
| Stretch break every hour | checkbox | on |

## Permissions

| Permission | Why |
| :--- | :--- |
| `read:datetime` | `!time` reads the streamer's clock |

## In chat

```
zip:  !time
bot:  It's 9:42 PM for the streamer.
      … one minute after the script starts …
bot:  The stream bot is up. Type !time to see the streamer's clock.
      … every 30 minutes, while live …
bot:  💧 Hydration check! We've been live for 2:03:00
      … every hour, while live …
bot:  🧘 Stretch break! Roll those shoulders.
```

{INSTALL}
"""

# --------------------------------------------------------------------------- link guard
PAGES['Example-Link-Guard'] = f"""# Example: Link Guard

Asks viewers not to post links — except to Twitch and YouTube. Moderators and VIPs can post
anything. (A script can't delete messages; this one just says something.)

{script('link-guard')}

## What to notice

- **Links come ready.** `.links` is every link in the message, each with an `.href`.
  `await (.links is SOMETHING)` only fires for messages that have at least one.
- **Filtering a list.** `.links | ( … )` keeps the links for which the part in parentheses is
  true — inside it, `.href` means *that* link's address. The parentheses matter: without them
  the line would be read as one yes/no question instead of a filter.
- **`not`, `and`, `or`, `in`.** `"twitch.tv" in .href` asks whether the address contains that
  text. Comparisons like this ignore upper and lower case.
- **Checking badges without `using`.** `.badges` is the sender's badges as a list, so
  `"vip" in .badges` works anywhere in a condition.
- **Picking from a list.** `1st of outside_links` is the first link that got through the filter;
  `.href` reads its address. `-1st` would be the last.

## Settings

| Setting | Type | Default |
| :--- | :--- | :--- |
| Warning | text | `Please don't post links in chat 🙏` |

## In chat

```
zip:  look https://twitch.tv/zip/clip/x
      (nothing — Twitch links are fine)
zip:  buy now https://spam.example/buy
bot:  Please don't post links in chat 🙏 (https://spam.example/buy)
vip1: https://spam.example/vip                     (vip1 is a VIP)
      (nothing — VIPs are exempt)
```

{INSTALL}
"""

# --------------------------------------------------------------------------- raid shoutouts
PAGES['Example-Raid-Shoutouts'] = f"""# Example: Raid Shoutouts

Thanks raiders automatically after a short pause, in the style you pick, and lets moderators
shout out the last raider again with a bare `!so`.

{script('raid-shoutouts')}

## What to notice

- **Raid events.** A raid arrives with `.raider` (who) and `.raid_size` (how many).
- **Comparing numbers.** `.raid_size is or above setting.minimum` means "at least". The others:
  `is above`, `is below`, `is or below`.
- **Sharing between handlers.** The raid handler remembers `last_raider`; the `!so` handler, a
  separate block at the top level, reads it. Blocks side by side share what they remember.
- **Waiting inside a handler.** `after …` waits once and then runs — "ten seconds after *each*
  raid", not once overall.
- **Arithmetic.** Arithmetic goes in `calc( … )` and needs the `eval:calc` permission, with a
  reason after `--`. That reason is what TTV Tools shows you when asking.
- **Every kind of setting.** A number with limits and a unit, and a dropdown (`select`) whose
  options become a `when` switch.
- **`else if`.** `!so` with a name shouts out that name; otherwise the last raider; otherwise it
  explains itself.

## Settings

| Setting | Type | Default |
| :--- | :--- | :--- |
| Only thank raids with at least | number, 1–1000 viewers | 1 |
| Wait before thanking | number, 0–120 s in steps of 5 | 10 |
| Thank-you style | dropdown: Hype / Chill | Hype |

## Permissions

| Permission | Why |
| :--- | :--- |
| `eval:calc` | Converts the delay setting from seconds to milliseconds |

## In chat

```
      shadyhen raids with 25 viewers
      … 10 seconds later …
bot:  RAID!!! Welcome in, 25 raiders! Go follow @shadyhen 💜     (or another hype line)
mod1: !so
bot:  Go follow @shadyhen, they raided us earlier 💜
mod1: !so soulbewitch
bot:  Go check out soulbewitch! 💜
zip:  !so
      (nothing — only moderators can use !so)
```

{INSTALL}
"""

# --------------------------------------------------------------------------- dice
PAGES['Example-Dice-and-Games'] = f"""# Example: Dice & Games

`!roll` (or `!roll 3`, up to ten dice), `!coin` and `!8ball`.

{script('dice-games')}

## What to notice

- **Lists.** A list is values in parentheses, separated by commas or new lines:
  `( … ) -> answers` keeps one for later, and `any from answers` picks from it. Ranges work too:
  `1 ... 6` is 1 to 6, and `1 .. 6` is 1 to 5.
- **Your own functions.** `define ROLL(sides)` makes a new verb. Call it like one — `ROLL 6` —
  and `-> face` keeps what it `return`s. Functions are named in capitals, like `POST`.
- **Loops.** `for 0; dice_count` runs its lines once per die. `$` is the current count if you
  need it; `break` stops early, and `renew` skips to the next round.
- **Arithmetic.** `calc(total + face)` adds; it needs the `eval:calc` permission.
- **Numbers from chat.** `.argument` is text, but `is or above 1` reads `"3"` as the number 3 —
  and anything that isn't a number (`!roll lots`) simply isn't "above 1", so it rolls one die.

## Permissions

| Permission | Why |
| :--- | :--- |
| `eval:calc` | Adds up dice rolls |

## In chat

```
zip:  !roll
bot:  You rolled 🎲4 = 4
zip:  !roll 3
bot:  You rolled 🎲2 🎲6 🎲1 = 9
zip:  !coin
bot:  Tails!
zip:  !8ball will I win?
bot:  🎱 Without a doubt.
```

(Dice, coins and the 8-ball are random, so your results will differ.)

{INSTALL}
"""


def main():
    WIKI.mkdir(exist_ok=True)

    for name, text in PAGES.items():
        (WIKI / f'{name}.md').write_text(text, encoding='utf-8', newline='\n')
        print(f'wrote {name}.md')


if __name__ == '__main__':
    main()
