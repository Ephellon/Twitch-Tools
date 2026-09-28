# Example: Dice & Games

`!roll` (or `!roll 3`, up to ten dice), `!coin` and `!8ball`.

<!-- example: dice-games.ttv -->
```ttv
plugin dice_games -- "Dice & Games"
    about "!roll (or !roll 3 for up to 10 dice), !coin and !8ball."

// Answers for !8ball, kept in a list so they're easy to extend
(`Yes.`, `No.`, `Ask again later.`, `Without a doubt.`, `Very doubtful.`) -> answers

// A function is a verb you define. This one rolls one die with `sides` faces
define ROLL(sides)
    return any from (1 ... sides)

// Adding up the dice needs arithmetic
using +eval:calc -- "Adds up dice rolls"
    await (.command is SOMETHING)
        when .command is
            "roll":
                // `!roll 3` rolls three dice; no number rolls one; at most ten
                if .argument is or above 1
                    .argument -> dice_count
                else
                    1 -> dice_count

                if dice_count is above 10
                    10 -> dice_count

                0 -> total
                "" -> faces

                // `for 0; dice_count` counts from 0 up to, but not including, dice_count
                for 0; dice_count
                    ROLL 6 -> face
                    calc(total + face) -> total
                    `${ faces } 🎲${ face }` -> faces

                REPLY `You rolled${ faces } = ${ total }`

            "coin":
                REPLY any from (`Heads!`, `Tails!`)

            "8ball":
                REPLY `🎱 ${ any from answers }`
```

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

## Try it

1. In TTV Tools, open **Settings → User Scripts** and choose **New script** (or save the
   script below as a `.ttv` file and use **Import .ttv…**).
2. Paste the script and save. It appears in the list with its own switch and settings.
3. Turn it on. If it asks for permissions, you'll be shown what and why before it runs.
