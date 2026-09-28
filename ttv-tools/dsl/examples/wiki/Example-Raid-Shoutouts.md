# Example: Raid Shoutouts

Thanks raiders automatically after a short pause, in the style you pick, and lets moderators
shout out the last raider again with a bare `!so`.

<!-- example: raid-shoutouts.ttv -->
```ttv
plugin raid_shoutouts -- "Raid Shoutouts"
    about "Thanks raiders automatically, and lets moderators shout out the last raider with !so."
    setting minimum: number 1 -- "Only thank raids with at least"
        min 1, max 1000, unit "viewers"
    setting delay: number 10 -- "Wait before thanking"
        min 0, max 120, step 5, unit "s"
    setting style: select "hype" -- "Thank-you style"
        option "hype" -- "Hype"
        option "chill" -- "Chill"

// A raid has arrived
await (.raider is SOMETHING)
    if .raid_size is or above setting.minimum
        // Remembered for the thank-you below, and for !so. Top-level blocks share
        // what they remember, so the !so handler further down can read these too
        .raider -> last_raider
        .raid_size -> raid_party

        // The delay setting is in seconds; `after` wants milliseconds. The permission
        // covers only the arithmetic that needs it
        using +eval:calc -- "Converts the delay setting from seconds to milliseconds"
            after calc(setting.delay * 1000)
                when setting.style is
                    "hype":
                        POST any from (
                            `RAID!!! Welcome in, ${ raid_party } raiders! Go follow @${ last_raider } 💜`
                            `${ raid_party } gremlins incoming from @${ last_raider }!! Thank you 💜`
                        )

                    "chill":
                        POST `Thanks for the raid, @${ last_raider }, and welcome, everyone 💜`

// Moderators can shout out anyone, or the last raider with a bare !so
await (.command is "so")
    using [moderator]
        if .argument is SOMETHING
            POST `Go check out ${ .argument }! 💜`
        else if last_raider is SOMETHING
            POST `Go follow @${ last_raider }, they raided us earlier 💜`
        else
            REPLY `Nobody has raided yet. Try !so <name>`
```

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

## Try it

1. In TTV Tools, open **Settings → User Scripts** and choose **New script** (or save the
   script below as a `.ttv` file and use **Import .ttv…**).
2. Paste the script and save. It appears in the list with its own switch and settings.
3. Turn it on. If it asks for permissions, you'll be shown what and why before it runs.
