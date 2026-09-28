# Example: Stream Timers

Hydration reminders every half hour and a stretch break every hour — only while live — a
one-time "I'm here" when the script starts, and `!time` for the streamer's local clock.

<!-- example: stream-timers.ttv -->
```ttv
plugin stream_timers -- "Stream Timers"
    about "Hydration and stretch reminders while live, a welcome when the bot starts, and !time."
    setting hydrate: checkbox true -- "Hydration reminder every 30 minutes"
    setting stretch: checkbox true -- "Stretch break every hour"

// Repeating timers. `with (#live is true)` keeps them quiet while offline
await 30:00 with (#live is true)
    if setting.hydrate
        POST `💧 Hydration check! We've been live for ${ #uptime as "h?:mm:ss" }`

await 1:00:00 with (#live is true)
    if setting.stretch
        POST `🧘 Stretch break! Roll those shoulders.`

// A one-off: `after` runs once, a minute after the script starts
after 1:00
    POST `The stream bot is up. Type !time to see the streamer's clock.`

// The streamer's local time. Reading the clock is a permission
using +read:datetime
    await (.command is "time")
        REPLY `It's ${ &datetime.time() } for the streamer.`
```

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

## Try it

1. In TTV Tools, open **Settings → User Scripts** and choose **New script** (or save the
   script below as a `.ttv` file and use **Import .ttv…**).
2. Paste the script and save. It appears in the list with its own switch and settings.
3. Turn it on. If it asks for permissions, you'll be shown what and why before it runs.
