# TTV DSL ↔ TTV Tools host contract

What the TTV Tools extension must provide for a `.ttv` script to run, and what it may rely on in
return. Written against **TTV DSL v2.1** — the version `dsl.patch` brings the canon to — and
the extension facilities in `ttv-dsl-canon/extension-api.md` and `chat.js`.

`host-conformance.test.js` checks an adapter against this document; `reference-adapter.js` is
a working adapter that passes it (18/18). The language-level contract is `dsl/HOST.md`; this
document specializes it to the extension. Where they disagree about the extension, this wins.

---

## 0. First: apply `dsl.patch`

The canon (`441fb33`, 208 tests) is **v2.0** in house style. The finalized language is v2.1
(340 tests): functions, loops, `[badge]`, `&host.calls`, the permission list, install-once
`await`s and more. `dsl.patch` upgrades `src/dsl/` to it.

- It applies with `patch -p0` from the folder that contains `dsl/`, and was verified on a clean
  copy of the canon: the result is byte-identical to the finalized source and
  `node dsl/tests/run.js` reports 340 passed, 0 failed.
- The patched files are in the **original** style, not house style. Run `npm run format` after
  applying; the only non-style difference in the canon was four breadcrumb comments
  (`// switch node.operator` …), which the formatter's `ttv/breadcrumbs` rule restores.
- **v2.1 is deliberately not a superset of v2** — the canon's "spec stays superset" rule does
  not hold. The operator approved each break: `<badge>` → `[badge]`, `$:path()` → `&path()`,
  `:emote:` → plain text, `*` now matches empty values, `->`/`=>` are synonyms, bare `%`
  changed, and variable names need a lower-case letter rather than an underscore. Every
  retired spelling is an error that names its replacement. `SPEC.md` §14.1a lists them all.
- New files: `HOST.md`, `fake-page.js` (test/playground only — do not ship it),
  `playground.html` (dev tool — do not ship it), three test files and a fixture.

## 1. The adapter's shape

An adapter is built from the extension's facilities and yields two things:

```js
const adapter = createAdapter({ Chat, STREAMER, USERNAME, clock, random, logger });

adapter.options;          // → TTV_DSL.createRuntime(adapter.options)
adapter.attach(runtime);  // → starts feeding chat in; returns detach()
```

That is the interface `runConformance(createAdapter)` drives. `clock`, `random` and `logger`
are optional in production (the runtime defaults to real timers, `Math.random` and `console`)
and are passed in by the tests.

## 2. The `TWITCH` realm

Registered as `options.realms.TWITCH`. Scripts reach it through selectors.

| Member | Type | Meaning | Source |
| :--- | :--- | :--- | :--- |
| `name` | `'TWITCH'` | realm name | constant |
| `current` | Channel | what `#` means at the top level | `STREAMER` (below) |
| `channel(name)` | Channel \| `null` | `/name`. The current channel when `name` matches it (case-insensitive); otherwise `null` — the extension only knows the channel it is on | `STREAMER.name` |
| `subject(path)` | Channel \| `null` | `TWITCH/path`; same as `channel(path)` | — |
| `badge(name, holder)` | `string` \| `null` | `[name]`: `name` when `holder.badges` (an array) includes it | the event's `badges` |
| `user(name)` | `{ name }` | `@name`, lower-cased | — |
| `goto(target)` | — | `goto`: navigate to a channel name (or a Channel's `name`) | host navigation |

**The Channel object must be live.** `TTV_DSL.run` receives `realm.current` once, and a script
runs for hours: every property must be a getter over `STREAMER`, not a copy. (The conformance
suite caught exactly this.) Freeze it so scripts cannot write to it.

| `#prop` | Type | `STREAMER` getter |
| :--- | :--- | :--- |
| `#name` | string, lower-case | `name` |
| `#id` | string | `sole` |
| `#live` | boolean | `live` |
| `#title` | string | `desc` |
| `#game` | string | `game` |
| `#viewers` | number | `poll` |
| `#uptime` | number, ms — formats with `as "h:mm"` | `time` |
| `#points` | number | `coin` |
| `#subscribed` | boolean | `paid` |
| `#following` | boolean | `like` |
| `#rerun` | boolean | `redo` |
| `#tags` | string[] | `tags` |

**Not exposed**, deliberately: `coms` (a Promise), `shop` (reward objects with methods),
`veto`, `fiat`, `href`, `icon`, `tint`. Scripts must never receive a Promise, a DOM node or an
object with callable members. Add a field only as a plain value.

`badges` on a Channel is not provided — there is no source for the viewer's own badges in
`extension-api.md`. So `[badge]` outside a message handler resolves to nothing. See open
question 3.

## 3. Events — `runtime.dispatch(event)`

The adapter subscribes to `Chat` hooks and dispatches **plain objects**. A field that does not
apply is **absent**, never `null` or `""` (scripts test presence with `SOMETHING`/`NOTHING`).

### Chat message — from `Chat.onmessage`

| Field | Type | From |
| :--- | :--- | :--- |
| `kind` | `'message'` (or `'command'`, below) | — |
| `id` | string | `uuid` — what `REPLY` threads under |
| `sender` | string, lower-case | `author` |
| `display` | string | `handle` |
| `message` | string | `message` |
| `mentions` | string[], lower-case, no `@` | `mentions` |
| `badges` | string[] | `Object.keys(badges)` — **the source is an object; the language needs an array** |
| `emotes` | string[] | `emotes[].name` |
| `links` | `{ href, text }[]` | URLs found in `message` (`https?://…`) |
| `timestamp` | number, ms | `timestamp` |

**Never forward** `element`, `reply`, `highlighted` (Promises / DOM), `raw`, `style`, `usable`
or `deleted`.

### Command — the same message, recognized

When the trimmed text matches `^!(\S+)(\s+(.*))?$`, the **same** event is dispatched once with
`kind: 'command'` and two more fields:

| Field | Type | Value |
| :--- | :--- | :--- |
| `command` | string, lower-case, no `!` | `so` for `!SO zip` |
| `argument` | string | `zip`; **`""` for a bare `!so`** — scripts use `.argument is SOMETHING` |

Derive it from `onmessage`, not `Chat.oncommand`: `oncommand`'s `{ name, arguments }` has no
sender, badges or id, so `REPLY` and `[moderator]` could not work.

### Whisper — from `Chat.onwhisper`

`{ kind: 'whisper', sender, message, timestamp }` — `sender` from `from`, lower-cased. `REPLY`
to a whisper posts to chat (it has no id); a `WHISPER` verb is future work.

### Notices and raids — `Chat.onbullet`

Not in this contract yet. The language's raid shape is `{ kind: 'raid', raider, raid_size:
number, raider_title }` (see `dsl/HOST.md` §4), but `onbullet` gives `{ message, subject,
mentions }` and parsing a raid out of that needs the real `subject` values. See open question 1.

## 4. Verbs

Passed as `options.verbs`, replacing the in-memory defaults. A verb is
`(context, value) => boolean`.

| Verb | Does | Maps to | Refuses (returns `false`, sends nothing) |
| :--- | :--- | :--- | :--- |
| `POST text` | Sends to the channel in scope | `Chat.send(text)` | blank text (`/^\s*$/`); a `context.channel` that is not the current channel |
| `REPLY text` | Threads under the event's message | `Chat.reply(context.subject.id, text)` | as `POST` |

- `value` is already rendered to a string by the language; coerce `null` to `""`.
- `REPLY` with no `context.subject.id` (a timer, a whisper) **falls back to `Chat.send`**.
- Both are fire-and-forget: `Chat.send`/`Chat.reply` return `undefined` and wait for the socket
  themselves. The verb returns whether it attempted to send.
- An unknown verb in a script is a runtime error the language raises; the host registers only
  these two unless it adds more.

## 5. Other runtime options

| Option | Value |
| :--- | :--- |
| `constants` | `{ USERNAME: USERNAME.toLowerCase() }`. Only ALL-CAPS names. Nothing else is needed. |
| `clock` | Omit in production (real timers). Tests pass a fake. |
| `random` | Omit in production. |
| `logger` | `{ log, warn, error }` routed to `$log` / `$warn` / `$error`, **prefixed with the plugin's name** (STYLEGUIDE §VIII). `error` receives a ready-made code frame string. |
| `limits` | Omit — defaults are `{ steps: 100_000, wallMs: 30_000 }` per turn. A script raises `steps` itself with a granted `+eval:budget_1M`/`10M`/`100M`. |
| `permissions` | Omit unless the host adds new permission names. |

## 6. Host calls — `jsBindings` / `jsPermissions`

Every function bound must be mapped to a permission on the list, or `createRuntime` throws.
Names are lower-case and keyed by the permission's resource. `eval:js` is **not** a host
permission: it covers only the built-in `Math`/`Number`/`Date`/`JSON`/`Array` set, which the
language provides itself.

**Recommended minimal set:**

| Path | Permission | Why |
| :--- | :--- | :--- |
| `datetime.now()` | `read:datetime` | Epoch ms. Read-only, no personal data. (`&Date.now()` exists too, under `eval:js`.) |
| `datetime.time()` | `read:datetime` | Local time formatted for chat (`"9:42 PM"`) — what scripts actually want to post. |

**Recommended next, once the permission prompt (§8) exists:**

| Path | Permission | Why |
| :--- | :--- | :--- |
| `html.text/attr/count/exists(selector)` | `read:html.*` | Read-only. **Confine to the chat pane** (query inside its root, not `document`) so a script cannot read other page content. |
| `html.parse/parseText/parseAttrs(markup)` | `parse:html.*` | Pure: `DOMParser` on a string the script already has; never touches the live page. Results must survive `JSON.stringify`. |

**Not recommended yet:** `html.setText` / `html.setAttr` (`write:html.*`). They change the page
Twitch renders; ship them only with the prompt in place and confined to extension-owned
elements. Signatures for all `html.*` calls: `dsl/HOST.md` §7.1; reference implementation:
`dsl/fake-page.js`.

## 7. Lifecycle

A `.ttv` script is one plugin (frame `chat`: `Chat` lives there). Per enabled script:

1. **Check.** `TTV_DSL.check(source)` → problems. Non-empty: do not start; show them (§9).
2. **Ask.** `TTV_DSL.grants(source)` → `{ blocks, calls }`. Show every block's permissions with
   its description; start only with the viewer's consent (§8).
3. **Build.** `adapter = createAdapter({ Chat, STREAMER, USERNAME, logger })`;
   `runtime = TTV_DSL.createRuntime(adapter.options)` — throws only on an adapter bug.
4. **Attach, then run.** `detach = adapter.attach(runtime)`;
   `context = await TTV_DSL.run(source, runtime, { channel: runtime.realm('TWITCH').current })`.
   `run` installs every handler and timer and returns; it throws on a syntax, parse or compile
   error (nothing has run).
5. **Stop** on plugin disable, channel change and page unload: `context.stop(); detach();`.
   On a channel change, start again from step 3 once `STREAMER` reflects the new channel.

**What `context.stop()` guarantees:** every timer is cancelled and every pending wait resolves
unfired; every `await` handler is unsubscribed from the runtime (`runtime.listenerCount` is
0); a handler already mid-flight stops at its next statement, so no further verb runs. It does
**not** remove the adapter's `Chat` hooks — that is `detach()`, which deletes them from
`Chat.__onmessage__` / `Chat.__onwhisper__` by callback name (`Chat` has no removal API; give
each attach a unique callback name).

## 8. The permission prompt

`grants()` reports what a script asks for before it runs. Every `write:` and `eval:` grant
(including `eval:budget_*`) carries a description by rule, so there is always text to show.
Store consent against the grant list; re-ask when a script's grants change, not on every load.

## 9. Errors

| When | What | Host does |
| :--- | :--- | :--- |
| Editing | `TTV_DSL.check(source)` → `[{ name, message, loc, frame }]` | Underline `loc.line`/`loc.column`; `frame` is a ready monospace excerpt. |
| `createRuntime` | throws `DSLRuntimeError` | Adapter bug (unmapped binding, bad permission, a binding named `Math` …). Log with `$error`; don't blame the script. |
| `run` | throws `DSLSyntaxError` / `DSLParseError` / `DSLPermissionError` / `DSLRuntimeError` | Show `error.codeFrame()`; keep the plugin stopped. |
| After start | faults go to `logger.error` as code frames | Only the faulting handler stops. `$warn` with the plugin name; don't rethrow. |
| After start | `DSLLimitError` | The whole script stopped itself. Surface it and mark the plugin stopped; suggest a budget grant if the script needs one. |

Nothing is thrown out of `runtime.dispatch`; the chat hook never needs a `try`.

## 10. Open questions for the manager

1. **Raids.** What `subject` values does `Chat.onbullet` produce for a raid, and where are the
   raider's login, the party size and their last title? The language expects
   `{ kind: 'raid', raider, raid_size, raider_title }`.
2. **Channel changes.** Which extension event marks one, so the host can stop and restart
   scripts (§7 step 5)?
3. **Viewer badges.** Is there a source for the signed-in viewer's badges in the current
   channel? Without one, `[moderator]` works on messages but not at the top level of a script.
4. **`goto`.** Should `goto` navigate the tab, or is it out of scope for chat-frame plugins?
