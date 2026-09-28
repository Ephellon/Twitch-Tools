# Example: Hello Bot

Greets chat on `!hello`, waves on `!bye`, remembers who it greeted last, salutes moderators,
and reminds chat it's there every fifteen minutes — but only while you're live. This is the
script TTV Tools ships with, grown a little.

<!-- example: hello-bot.ttv -->
```ttv
plugin hello_bot -- "Hello Bot"
    about "Replies when someone says !hello, waves on !bye, and remembers who it greeted last."
    setting reply: text "Hi there!" -- "Reply with the following"
    setting reminders: checkbox true -- "Remind chat every 15 minutes"

// Chat commands
await (.command is SOMETHING)
    when .command is
        "hello":
            // `!hello @zip` greets zip; a bare `!hello` replies to whoever asked
            if .argument is SOMETHING
                POST `${ setting.reply } ${ .argument }`
            else
                REPLY setting.reply

            // Remembered for `!who` below
            .sender -> last_greeted

        "bye":
            // A different goodbye each time
            REPLY any from (
                `See you later!`
                `Thanks for stopping by 💜`
                `Take care!`
            )

        "who":
            if last_greeted is SOMETHING
                REPLY `The last person I said hi to was ${ last_greeted }.`
            else
                REPLY `Nobody has said !hello yet. Be the first!`

// Moderators get a salute when they say hello
await (.command is "hello")
    using [moderator]
        POST `🛡️ ${ .sender } is on duty.`

// Every 15 minutes, but only while the stream is live
await 15:00 with (#live is true)
    if setting.reminders
        POST `Type !hello and I'll say hi 🤖`
```

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

## Try it

1. In TTV Tools, open **Settings → User Scripts** and choose **New script** (or save the
   script below as a `.ttv` file and use **Import .ttv…**).
2. Paste the script and save. It appears in the list with its own switch and settings.
3. Turn it on. If it asks for permissions, you'll be shown what and why before it runs.
