# TTV DSL — Host Contract

What the language needs from whatever runs it. The extension is the intended host, but
nothing here assumes it: the test suite, the playground and `fake-page.js` are hosts too.

The language side of this contract is implemented and tested (`tests/host.test.js`). The
host side is what the extension rewrite should provide. Where this document and `SPEC.md`
disagree about the *language*, `SPEC.md` wins; where they disagree about the *host*, this
wins.

---

## 1. Lifecycle

```js
let runtime = TTV_DSL.createRuntime({ /* §2 */ });

let report = TTV_DSL.grants(source);          // §6 — before running: what will it ask for?
let problems = TTV_DSL.check(source);         // diagnostics, for an editor

let context = await TTV_DSL.run(source, runtime, {
    channel: runtime.realm('TWITCH').current, // the channel `#` means at the top level
});

runtime.dispatch(event);                      // §4 — once per incoming event
context.stop();                               // cancels every timer and handler
```

- `run` parses, compiles and **starts** the script, then returns. It throws on a syntax
  error, an unknown grant, or a `write`/`eval` grant with no description — nothing has
  run at that point.
- Faults after start (a denied permission, an unknown verb, a missing host binding) do not
  throw out of `dispatch`: they go to `logger.error` and only the faulting handler stops.
  `DSLLimitError` (budget exhausted) stops the whole script.
- One runtime per script. Two scripts sharing a runtime share its event bus and sink.

## 2. `createRuntime(options)`

| Option | Default | Host provides |
| :--- | :--- | :--- |
| `realms` | `{ TWITCH }` in-memory | realm objects by name (§3). Unregistered realms skip their block. |
| `verbs` | `POST`, `REPLY` into `runtime.sink` | `{ NAME(context, value) }` — what statements like `POST` do (§5). |
| `constants` | `{}` | values bare upper-case names resolve to, e.g. `USERNAME`. |
| `jsBindings` | `{}` | the object `&Path.fn()` walks (§7). **Empty by default.** |
| `jsPermissions` | `{}` | `{ 'path.fn': 'permission' }`. **Every** bound function must be listed. |
| `permissions` | — | extra names for the permission list (§6). |
| `clock` | real timers | `{ now, setTimeout, clearTimeout }`. |
| `wallClock` | `datetime.now` | wall time for the budget. |
| `random` | `Math.random` | `[0, 1)`, for `any from`. |
| `logger` | `console` | `{ log, warn, error }`. |
| `limits` | `{ steps: 100000, wallMs: 30000 }` | per-turn budget. |

`createRuntime` throws — before any script runs — when a `jsPermissions` value is not on
the permission list, when a bound function has no entry in `jsPermissions`, or when a
binding is named after a built-in (`Math`, `Number`, `Date`, `JSON`, `Array`; §7.3).

## 3. Realms

A realm resolves the selectors. The built-in `TWITCH` realm is an in-memory stand-in; the
host should register a real one under the same name.

```ts
interface Realm {
    name: string;
    current: Channel | null;                       // what `#` means at the top level
    channel(name: string): Channel | null;         // `/name`
    subject(path: string): object | null;          // `REALM/path`
    badge(name: string, holder: object): string | null;   // `[name]` — return name if held
    user(name: string, channel: Channel): object;  // `@name`
    goto(target: unknown): void;                   // `goto`
}

interface Channel {
    name: string;          // required
    live: boolean;         // required — `#live`, and how channels are recognized
    badges?: string[];     // the viewer's badges here, for `[badge]` outside a message
    [prop: string]: unknown;   // anything else is readable as `#prop`
}
```

`[badge]` asks the innermost subject that has a `badges` array — the chat message inside a
message handler, else the channel.

## 4. Events

`runtime.dispatch(event)` hands one plain object to every `await` handler. The language
reads events **only** through `.prop` / `.a.b` — there is no schema check — so the shapes
below are the contract. A property that does not apply is **absent**, not `null` or `""`
(`""` matters: `ANYTHING` matches it, `SOMETHING` does not).

| Event | Properties |
| :--- | :--- |
| chat message | `message`, `sender`, `badges: string[]`, `mentions: string[]`, `links: { href, text }[]` |
| chat command (`!so zip`) | the chat-message properties, plus `command` (`"so"`, no `!`, lower-case) and `argument` (`"zip"`, or `""` when bare) |
| raid | `raider`, `raid_size: number`, `raider_title` |
| realm post (e.g. Discord) | `sender`, `content`, `links` |

Rules:

- Every event may also carry `kind: string` naming its type. Scripts should not need it.
- Names are **snake_case** and flat where possible; nesting (`raider.last.category`) is
  allowed and readable with `.a.b.c`.
- `sender` is a login, not a display name. Comparisons are case-insensitive anyway.
- Timers are internal: `await 5:00` / `after 5:00` never need a dispatched event.

## 5. Verbs

A verb is `(context, value) => any`. `value` is the evaluated argument (usually a string).
Useful context fields:

| Field | Meaning |
| :--- | :--- |
| `context.channel` | the channel in scope — where a `POST` goes |
| `context.subject` | the innermost subject — the event, inside a handler |
| `context.subject.sender` | who a `REPLY` answers |
| `context.runtime` | the runtime (for `logger`, `now()`) |

A blank message is skipped by the defaults; custom verbs should do the same.

## 6. Permissions

Only host calls (§7) check permissions. A script grants them per block:

```
using +write:html.text -- "renames the stream title for mods"
```

**The list** (hosts may add to it with `permissions`):

| Permission | Covers |
| :--- | :--- |
| `read:datetime` | the clock |
| `read:html.text` · `.attributes` · `.structure` | reading the page |
| `write:html.text` · `.attributes` | changing the page |
| `parse:html.text` · `.attributes` · `.structure` | markup the script already has → serializable data |
| `eval:calc` | `calc( ... )` arithmetic |
| `eval:js` | the built-in JavaScript set only (§7.3) — never a host binding |

A grant ending in `.*` covers exactly one more level. `write` and `eval` grants always carry
a `-- "description"`.

**Asking the viewer.** Before running a script, call `TTV_DSL.grants(source)`:

```js
{
    blocks: [ { permissions: ['write:html.text'], description: 'renames …', line: 4 }, … ],
    calls:  [ { path: 'html.setText', line: 6 }, … ],
}
```

Show each block's permissions with its description. `calls` lets the host warn about paths
it has not registered before anything runs.

## 7. Host calls (`&Path.fn()`)

`&html.text("h1")` looks up `jsBindings.html.text` and calls it with the evaluated
arguments. No text is ever evaluated as code, and `constructor` / `prototype` /
`__proto__` can never be walked. A call may return a value or a promise; either is
awaited. A call may stand alone on a line, for calls made for what they do.

**Naming.** Native calls are **lower-case**, and the top-level key is the permission's
resource: `read:html.*` / `write:html.*` / `parse:html.*` cover the calls under the `html`
key the host passes in, `read:datetime` covers `datetime`, and `eval:calc` covers the
built-in `calc( ... )`, which needs no binding at all. A host-specific extra needs its own
permission on the list (add one with `permissions`); there is no fallback. `eval:js` is not
a catch-all — it covers only the built-in set (§7.3).

A method is only ever **called** and a constant only ever **read** — `&x.y( ... )` versus
`&x.y`, the parentheses glued on. So no function value, and no live host object, ever lands
in a script: reading a method or calling a constant is an error.

### 7.1 `html` — the page

The host must provide these names with these semantics and this permission map
(`TTV_DSL.fakePage.HTML_PERMISSIONS`). `fake-page.js` is the reference implementation.

| Call | Permission | Returns |
| :--- | :--- | :--- |
| `html.text(selector)` | `read:html.text` | text of the first match, or `""` |
| `html.attr(selector, name)` | `read:html.attributes` | attribute of the first match, or `""` |
| `html.count(selector)` | `read:html.structure` | number of matches |
| `html.exists(selector)` | `read:html.structure` | `true` / `false` |
| `html.setText(selector, text)` | `write:html.text` | number of elements changed (all matches) |
| `html.setAttr(selector, name, value)` | `write:html.attributes` | number of elements changed |
| `html.parse(markup)` | `parse:html.structure` | `[{ tag, attributes, children }]`, text children as strings |
| `html.parseText(markup)` | `parse:html.text` | the markup's text |
| `html.parseAttrs(markup)` | `parse:html.attributes` | the first element's attributes |

Selectors are CSS. The fake page supports tags, `#id`, `.class`, `[attr]`, `[attr=value]`
and the descendant combinator; the real host should accept whatever `querySelectorAll`
does. `parse*` must never touch the live page, and their results must survive
`JSON.stringify`.

**Scope.** What "the page" is — the whole document, or only the chat pane — is the host's
decision. Restricting `write:html.*` to extension-owned regions is recommended.

### 7.2 Others

| Call | Permission | Returns |
| :--- | :--- | :--- |
| `datetime.time()` | `read:datetime` | the local time, formatted for chat (e.g. `"9:42pm"`) |

### 7.3 Built-ins — `eval:js`

The language itself provides a small slice of JavaScript, under `eval:js`: the static
members of five globals, minus a blocklist. The host cannot add to it, remap it, or bind
anything under these names.

Every **own static member** of `Math`, `Number`, `Date`, `JSON` and `Array` is reachable
— constants read (`&Math.PI`), methods called (`&Math.max(1, 2)`, `&Date.now()`,
`&JSON.parse(text)`, `&Array.from(list)`) — **except** a short blocklist: `prototype`,
`constructor`, `length`, `name`, `caller`, `arguments`. Nothing inherited (`toString`,
`valueOf`, …) is reachable, and symbol-keyed members cannot be named.

It is a blocklist on purpose: names on these globals are only ever added, never changed, so
whatever an engine adds later (`Math.f16round`, `JSON.rawJSON`) is available without an
edit. `Array.from` and `Array.fromAsync` are capped at 10,000 items, since an array-like
with a huge `length` would otherwise exhaust memory in one call.

Anything else — `&Object.keys`, `&Math.toString`, `&Array.prototype` — is refused.

## 8. Testing a host

`tests/host.test.js` runs the contract against `fake-page.js`. A real host can be checked
the same way: swap `createFakePage(html).bindings` for the host's `jsBindings` and run the
same scripts.
