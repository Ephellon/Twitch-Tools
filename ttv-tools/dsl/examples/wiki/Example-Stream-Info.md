# Example: Stream Info

`!game`, `!title`, `!viewers` and `!uptime` — answered from the channel's live data, so the
answers are always current.

<!-- example: stream-info.ttv -->
```ttv
plugin stream_info -- "Stream Info"
    about "!game, !title, !viewers and !uptime answer from the channel's live data."

await (.command is SOMETHING)
    when .command is
        "game":
            REPLY `We're playing ${ #game }`

        "title":
            // Titles can hold line breaks; `%` flattens them to one line
            REPLY #title % " "

        "viewers":
            REPLY `${ #viewers } people are watching 👀`

        "uptime":
            if #live
                REPLY `Live for ${ #uptime as "h'h 'm'm'" }`
            else
                REPLY `We're offline right now. See you next stream!`
```

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

## Try it

1. In TTV Tools, open **Settings → User Scripts** and choose **New script** (or save the
   script below as a `.ttv` file and use **Import .ttv…**).
2. Paste the script and save. It appears in the list with its own switch and settings.
3. Turn it on. If it asks for permissions, you'll be shown what and why before it runs.
