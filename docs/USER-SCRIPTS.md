# User Scripts

Write your own chat automation in the **TTV DSL** and run it inside TTV Tools. Each script is a small plugin with its own switch and settings.

## Where

Settings → **User Scripts**:

- **New script** starts from the Hello Bot example: commands, a remembered value, a random reply, a moderator-only line and a timed reminder.
- **Import .ttv…** loads a script from a file.
- **Edit** opens the editor. It highlights the script as you type, lists problems with their line and column, and won't save a script that has any.
- **Approve…** appears when a script asks for permissions (below).
- **Remove** uninstalls it. Its settings stay until you reset them.

Each installed script gets its own section under the list: a switch to turn it on, plus any settings its header declares. A new script starts **off**.

## A script

```
plugin my_script -- "My script"
    about "Replies when someone says !hello."
    setting reply: text "Hi there!" -- "Reply"

await (.command is "hello")
    REPLY setting.reply
```

- The `plugin` header names the script, says where it runs (`frames chat, main`; `chat` by default), and declares its settings: `checkbox`, `number`, `text` or `select`.
- The body reacts to chat (`await …`), posts (`POST`) and replies (`REPLY`), and reads the channel (`#live`, `#viewers`, …).
- More scripts to start from: `src/dsl/examples/`, published on the Wiki as [TTV DSL Examples](https://github.com/Ephellon/Twitch-Tools/wiki/TTV-DSL-Examples). Each one is tested against a real chat session.
- The full language is described in `src/dsl/SPEC.md`. What a script can see of Twitch is described in `docs/DSL-HOST.md`.

## Where scripts run

- `chat`: in chat, on channel pages. Pop-out chat doesn't host scripts yet (it has no chat relay).
- `main`: on channel pages only. `goto` (going to another channel) only works there.
- Scripts need a live channel and a signed-in viewer: like most of TTV Tools, they don't load on offline channels.
- A script restarts when you change its settings, and when you move to another channel.
- Your own messages don't trigger your scripts, because Twitch doesn't echo them back. To test a command, have someone else type it.
- Posts are paced for you: at least ~1 s apart, and at most 20 per 30 s (100 if you're the broadcaster, a moderator or a VIP). Extra posts wait in line, so a busy script replies late rather than getting you muted.

## Permissions

A script that uses something beyond chat asks for it in a `using … +permission` header, for example `+read:datetime` to read the time. Such a script only runs after you **approve** its permissions. If an edit changes what it asks for, it has to be approved again. A script that asks for nothing runs as soon as you switch it on.

## Backups

Scripts and approvals are included in **Export Settings** / **Restore** (`user_scripts`, `user_scripts__consent`), along with each script's settings.
