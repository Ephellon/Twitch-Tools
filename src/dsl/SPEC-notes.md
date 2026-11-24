# TTV DSL — Notes for Language Workers

This file is for people who change the language or build tools for it. Script writers need
only `SPEC.md`. Hosts need `HOST.md`.

It holds three things that were taken out of `SPEC.md` so they would not get in a reader's
way:

- **Part A — Why the rules are what they are.** Read this before changing a rule. Many rules
  look like rough edges and are not.
- **Part B — How the parts are built.** Tokens, the syntax tree, closures, scope slots.
- **Part C — Version history and open questions.**

Section numbers like "SPEC §7.8" point into `SPEC.md`.

---

# Part A — Why the rules are what they are

## A.1 Goals

- A short, declarative syntax for chat automation that reads like a description of intent.
- Triggers driven by events: channel state, chat messages, timers and commands.
- Structure by indentation, so nesting is visible instead of punctuated.
- Hard resource limits, so a badly written script slows the extension down instead of the
  tab.
- Every fault carries a source location exact enough to underline in an editor.

The non-goals are in SPEC §1.

## A.2 `*` is always the wildcard

`*` is the most common token in real scripts: `await *`, `using *`, `.message is *`. If it
also meant multiplication, the lexer would have to know whether it stands where a value goes
or where an operator goes. The language gives up arithmetic outside `calc( ... )` in exchange
for a wildcard that means one thing everywhere. Inside `calc`, `*` is an operator, the same
way CSS's `calc()` changes what its characters mean.

## A.3 `where` binds tighter than `of`, `is` and `in`

```text
1st of .links where ("twitch.tv" in .href)
```

parses as `1st of (.links where (...))`. The filter narrows the list, **then** the ordinal
picks from what is left. The other grouping, `(1st of .links) where (...)`, would pick first
and then filter a single item, which is never what anyone means.

The cost is that a filter whose test holds `is` or `in` must be in parentheses:
`.links | ("twitch.tv" in .href)`. The two readings cannot both be had. Loosening `where`
below `in` would fix the unparenthesized line and break the ordinal shape above, which is far
more common. So the parenthesized form is the canonical spelling, and every example uses it.
**This is a settled rule, not a defect awaiting a fix.**

## A.4 `is` and `in` do not chain

`a is b is c` is refused instead of being read as `(a is b) is c`. That reading would compare
a boolean with `c`, which is almost never meant. Parentheses make the intent obvious.

## A.5 Text compares without case

Every identifier the language compares — channel names, user names, commands — ignores case
on Twitch, and scripts are written by hand. `.sender is "Jjay_89"` must match `jjay_89`.

`=` (SPEC §7.6) is a **prefix on a value**, not a second operator. That is why it composes with
`in` and with `when` labels without either needing to know it exists, and why it works on any
value shape.

## A.6 `%`

- **`%w` is JavaScript's `\w`**, so it admits `_` as well as letters and digits. Do not tidy it
  into `[A-Za-z0-9]`. `%` only works on strings, so the underscore costs nothing, and `\w` is
  what every other language with this notation means. Matching that expectation beats internal
  consistency.
- **The replacement is inserted as written.** An operator that quietly padded its output could
  not be turned off, and `.links % ','` could never produce `a,b`.
- **A bare `%` is `\s*\n\s*`.** It used to be `%n%s` (`\n+\s+`: a newline *followed by* more
  whitespace). That let a lone `\n` and a `\r\n` slip through, which is not what "flatten this
  block" means to anyone. The class sequence is a run of `%X` pairs, and the leading `%`
  belongs to the first class, so a bare `%` is zero classes. That is how `%` alone can mean
  the default without a second spelling.

## A.7 Templates: a matched `${` is always code

A `${` **with** a matching `}` stays an interpolation, and stays an error when its contents are
wrong. Turning a *matched* pair into text would silently swallow real typos: `${ .sendr }`
would print `${ .sendr }` instead of saying the property is misspelled. The escape idiom,
`` `${ "${whatever}" }` ``, also only works if the outer, matched pair is really evaluated: it
interpolates a *string* that reads `${whatever}`.

An **unmatched** `${` is an error at the `${` *(v2.1.1)*, and `\${` is the literal spelling.
From v2 to v2.1 an unmatched `${` was text. That failed in a way no reader could predict:
while hunting for the `}`, the tokenizer reads the template's own closing backtick as the
start of a nested template, so any `}` later in the script — even in another template —
closed the `${`, and the error landed lines away from the mistake. From inside an
interpolation, "the template ends here" and "a nested template starts here" look the same, so
the fix uses line breaks instead: an interpolation may continue onto another line only inside
`( )` or `[ ]`, the one place valid scripts do it (`${ any from ( … ) }`). The first line break
outside them — the one right after the template that really ended — stops the search, and the
`${` is reported. A quote that never closes inside an interpolation is reported the same way.

*(v2.1.2)* A `${` that **ends its line** is read the other way: over lines, bounded by the
off-side rule. Every following line must be indented deeper than the `${` line (blank lines
aside), lines inside a nested template included; the first line back at that indentation must
start with the closing `}`, or the `${` is reported. This brings back the multi-line forms 2.1.1
had to refuse (`${` ⏎ `.sender` ⏎ `}`, and a nested template over lines), and a forgotten `}`
still cannot run past the indented block. The trigger is exact: nothing but spaces, tabs or a
`//` comment after the `${`. A `${` with code after it keeps the one-line rule, because
`` ${ `a `` ⏎ … is the bug's own shape. Indentation is measured on the whole script, even when the
`${` sits inside an interpolation that began mid-line (the tokenizer's `within` option; the
highlighter passes it too). Greedy reading — try each later `}` and keep the first whose
contents parse — was rejected: it silently accepts junk that happens to parse (an ALL-CAPS
function call swallowing a template), it makes the editor recolour far-away lines on every key,
and it cannot be explained in one rule.

## A.8 Host calls

- **No text ever becomes code.** There is no `eval` and no `new Function` anywhere, and
  `&Path.fn(...)` is the construct that would most obviously have wanted one. A path is data
  all the way down.
- **`__proto__`, `prototype` and `constructor` are refused** as path parts. That is no
  substitute for a host not registering dangerous objects, but walking into `constructor` is
  the one mistake that would turn a property lookup back into code evaluation.
- **Nothing is registered by default.** A script should not silently gain a capability because
  a name happened to exist in JavaScript.
- **Call or read, never hand over.** A function value never becomes a script value.
- **The `eval:js` set is a blocklist on purpose.** Names on these globals are only ever
  added, never changed, so whatever an engine adds later (`Math.f16round`, `JSON.rawJSON`) works
  without an edit. `Array.from` / `Array.fromAsync` are capped because an array-like with a huge
  `length` would otherwise exhaust memory in one call.
- **Every host binding must be mapped to a permission.** `createRuntime` refuses to start
  otherwise. There is no fallback.

## A.9 Permissions

- **The list is fixed** so that a typo like `+read:htlm.*` is an error instead of a grant of
  nothing.
- **Matching is exact, or one written-out level.** There is no implicit prefix logic, and that
  absence is the feature: the grant says how far it reaches. There are regression tests for
  every case in SPEC §10, so that a future implementer cannot "helpfully" add prefix matching.
- **`DSLPermissionError` is split out of `DSLRuntimeError`** for the same reason
  `DSLLimitError` is. A host wants to treat "this script asked for a capability you did not
  give it" as a permission prompt, not a bug report. Because matching is exact, the error is a
  reliable signal that a grant is truly missing, not merely written at the wrong level.
- **`write` and `eval` grants need a description** because they change the page or run code,
  and the description is what the host shows the viewer.

## A.10 Statements

- **Verbs are decided by position, not by the lexer.** `POST` at the start of a statement is a
  verb; `USERNAME` inside an expression is an identifier. This keeps the verb registry open:
  a host can register `WHISPER` without touching the language.
- **A bare value on a line is an error.** A language whose statements are verbs has no use
  for a value nobody reads, and accepting one would turn every misspelled verb into a silent
  no-op. Only verbs, function calls, assignments and host calls may stand alone.
- **`with` branches on its value's result, not its syntax.** One rule gives both readings, and
  the script never has to say which it meant: a filter that selects nothing gives an empty
  list and runs the block zero times, while a filter that asks a yes/no question gives a
  boolean and runs it at most once.
- **The two `with` forms never compete.** The filter form is consumed on the `await` line,
  before a block can open, so a `with` that reaches statement position is always the block
  form.
- **`using *`** means "each live channel" in the original mockup (`idea.ttv`).
- **Chain branches are siblings, not nested.** That is how they read on the page, and it keeps
  the off-side rule uniform: every branch sits at the same indentation instead of marching
  right.
- **`when` tells its forms apart by one fact** — whether the head ends on a comparison word
  with nothing after it. Nothing else differs, and nothing needs to be looked ahead for.
- **`else when` is an error** because `when` already means "else if".
- **The retired words** `elif`, `elseif`, `switch`, `case` and `default` exist only to give an
  error that points at `when` and `else`, instead of a generic "expected a statement".
- **`REPLY ""` is a no-op** that the original mockup uses on purpose.

## A.11 Nested `await`s install once

An `await` inside a handler used to install another copy on every firing (v2). Handlers and
timers piled up, and one command drew one reply per pile. Installing once per site, per loop
iteration, bounds the handler count by the source text. The outer `with (…)` filter staying in
force is the "binds a filter to a scope" reading, which is what `await * with (#live is true)`
was always meant to say. The outer **trigger** is not re-tested, because re-testing
`.command is "start"` against each later message would make the inner handler unreachable.

## A.12 Functions cannot install handlers

Installing on every call is exactly the pile-up nested `await`s were fixed to avoid (A.11).
A function also does not change grants mid-call. It sees no caller variables so that what it
needs comes in as arguments.

## A.13 Names: ALL-CAPS is the host's

`CLKFMT "..."` at the start of a line already reads as a verb call. So ALL-CAPS has to belong
to verbs and constants — the host's, and the script's own functions. That one fact is the
whole difference between a name the script made and a name the host published, because the
lexer sees both as the same `IDENT` token.

Binding checks the rule; a reference never does. So a variable is forgiven when it is absent
(it reads as empty), while an unknown constant fails loudly: the compiler knows which of the
two a name is, so it can be lenient about the one that is legitimately absent and strict about
the one that is certainly a typo.

**Why an unbound read must not throw:**

```text
using [moderator]
    await (5:00 -> wait_time)
        any from ( ... ) -> mod_msg

    POST `${ mod_msg } (${ wait_time })`
```

The `POST` is a *sibling* of the `await`, and `await` installs its trigger and returns at once.
Under **any** scoping rule that `POST` runs before the timer has ever fired, so it can never see
those bindings. The script shows syntax, not data flow, and it must compile and run instead of
throwing.

The subject aliases are refused as binding targets by name, and being read-only costs nothing,
since `.prop` already reads through them.

## A.14 Badges are gates

In v2, `using [moderator]` rebound the subject to the badge's name, so every `.prop` inside
came back empty, silently — inside `await (.command is …)`, `.command` read `[]`. A badge is a
yes/no question, so it now keeps the subject. Channels, realms and `*` still rebind.

## A.15 Limits are per turn

A per-script budget would be wrong both ways. An event-driven script is meant to run for days,
so a whole-script budget would kill every healthy script, while still letting a tight loop
inside one handler burn the whole allowance.

Elapsed time is measured with `wallClock`, never with `clock`. `clock` is the script's own
sense of time, and a script that waits five minutes has not *executed* for five minutes.

## A.16 Error recovery stays per line

A fault inside a long `any from` reports that fault and discards the construct. The author is
told exactly what was wrong, and that is the point. Lexical faults are fatal because the scan
cannot meaningfully continue past, say, an unterminated template.

## A.17 Unknown realms fail only their block

In v2 an unregistered realm threw, which took the whole enclosing body down with it. `DISCORD`
is deliberately unregistered: TTV Tools has no Discord integration, and the mockup's
`using DISCORD/...` is aspirational. A host that implements Discord registers it, and the same
script starts working.

---

# Part B — How the parts are built

## B.1 Files and namespace

- **Namespace:** `globalThis.TTV_DSL`. Not `TTV_LANG`, and not `LANGUAGE`, which
  `ext/polyfill.js` already defines.
- **Folder:** `dsl/` (v6: `src/dsl/`). **Script extension:** `.ttv`. **Target:** ES2020 /
  Chrome 88.
- No dependencies, no build step, and no `eval` or `new Function`. The compiler lowers the
  syntax tree into a tree of ordinary JavaScript closures, which is what lets it run under a
  strict extension content security policy.
- Pipeline: tokenizer → parser → syntax tree → compiler (closures) → runtime. Load order is in
  `HOST.md` §10.1.

## B.2 Tokens

- **The off-side rule.** The tokenizer keeps a stack of indentation widths. It emits `INDENT`
  when a line is more indented than the last, and one `DEDENT` per level closed when it is
  less. A dedent that lands between two levels is an error.
- **`NEWLINE` survives inside brackets**, unlike most indentation languages, because
  `any from ( ... )` separates items by line. `INDENT` and `DEDENT` *are* suppressed inside
  brackets. Blank and comment-only lines produce no tokens at all — not even `NEWLINE` — and
  never touch the indent stack.
- **`//` and `/*` are tested before the `/channel` selector.** Otherwise every comment would
  scan as a channel named after its first word. For the same reason `TWITCH// note` is never a
  realm.
- **A block comment that owns its whole line** is consumed at the line head, before indentation
  is measured, so it cannot shift the indent stack or emit a stray `NEWLINE` — exactly like a
  `//` line. One reached mid-line is skipped like whitespace. For `    /* note */ POST `hi``
  the indentation must still be measured, so the tokenizer looks ahead to the closing `*/` and
  takes the line-head path only when nothing but whitespace follows it.
- **End of input:** a final `NEWLINE` (if the last line produced tokens), one `DEDENT` per open
  block, then `EOF`.
- **Commas** are a separate skip-set from the one the statement loop uses. That is why a stray
  `,` between statements is an error instead of being swallowed.
- **Strings:** both quote styles scan through one routine with the quote as a parameter, so
  they cannot drift apart.
- **Templates** are one `TEMPLATE` token carrying `quasis` (the literal chunks, always one more
  than the expressions) and `expressions` (each the raw substring plus its absolute offset in
  the file). The parser re-parses those substrings against that offset, so a fault inside
  `${ ... }` reports its real line and column. While hunting for the closing `}`, the tokenizer
  tracks brace depth and steps over nested strings, templates and comments, so a `}` inside
  `` `a}b` `` does not close the interpolation early.
- **Numbers:** a fraction needs a digit after the dot, which is what lets `1..9` scan as `1`,
  `..`, `9`.
- **Ordinals** match `-?\d+(st|nd|rd|th)` and are converted to 0-based indexes (`1st` → `0`,
  `-1st` → `-1`). The leading `-` belongs to the ordinal only when the suffix is present.
- **Durations** are normalized to milliseconds. Where a duration is computed instead of
  written, the runtime also accepts `90s`, `5m`, `2h`, `3d`, and defers to the extension's own
  `parseTime` when the page provides one.
- **`:`** has three jobs: a duration (`15:00`), a permission segment (`+eval:calc`) and a
  `when` label (`"help":`). Durations are claimed at the leading digit and permissions at the
  leading `+`, so a `:` that reaches its own branch is a label. The tokenizer emits a `COLON`
  token, and the **parser** gives the error when one turns up anywhere else:

  ```text
  DSLParseError: Unexpected ":"; expected a duration like "15:00", or a `when` case label
  like `"help":`
  ```

- **Host-call paths** scan as one token whose value is the array of segments.
- **Grants** are read directly by the `using` parser, not through the expression grammar. That
  is what makes a `+permission` illegal everywhere else: a `+` in any other position is a parse
  error naming the `using` header, and a `+` that is not a permission at all is a lexical error
  naming the absence of arithmetic.

## B.3 Syntax tree

- Every selector is a `Selector` node with a `kind`: `channel`, `prop`, `realm`, `badge`,
  `user` or `context`.
- `/channel#prop` is two tokens that the parser fuses, and only when they are adjacent in the
  source. This is what makes `using [viewer] [everyone]` work by juxtaposition.
- A bare word that is not a keyword is an identifier, resolved against the host's constant
  table. An identifier is not a sigil: sigils name things *inside* a channel, an identifier
  names a value the host handed to the script.
- `ANYTHING`, `SOMETHING` and `NOTHING` are resolved by the parser, not the constant table, so
  a host constant cannot shadow them.
- `|` and `where` are the **same token type**, as are `<|` and `of`, and `~` and `as`. So
  precedence, associativity and the resulting node are identical by construction, not by
  agreement.
- **Assignment is not in the operator table**, because its right-hand side is a name, not an
  expression: there is nothing for precedence climbing to climb. The parser handles it as a
  tail pass gated on the outermost precedence level. That makes it the loosest construct for
  free, and keeps every row of the table honest about being a binary operator over two
  expressions.
- A chain `when` (and `else`, `else if`) is folded into the preceding statement's `alternate`,
  so three source statements become one tree.
- A `using` description is recorded on the node as `description`.
- `is` refuses a template that still carries an interpolation on its right.

## B.4 Compiler

- **The subject aliases** `_`, `__this__`, `__self__` and `__me__` compile to a read of
  `context.subjects[depth]`, with `depth` fixed at compile time. That is the same machinery
  `.prop` uses, minus the property read.
- **`await (5:00 -> wait_time)`**: `await` picks its duration form by *looking at* its subject,
  so the compiler unwraps the assignment before making that test. Without that, the line would
  silently become an event-await that never fires. This is the one place where the language's
  syntax decisions bite.
- **Grants**: a block's grant set is its own grants plus every ancestor's, computed once at
  compile time and carried as a frozen `Set`.

## B.5 Scope slots

`.prop` is **lexical and resolved at compile time**. Each scope-opening construct gets a depth,
and `.prop` compiles to a read of exactly that depth's slot. It is not a dynamic "innermost
subject" lookup: under a dynamic rule, a `where` filter would have to guess, and nested filters
would shadow each other unpredictably.

`subjects` is an array indexed by lexical depth. `envs` is the same idea for variables: one
`Map` per depth. A child scope copies the array with `concat`, which copies the **array** but
leaves every ancestor `Map` shared **by reference**. So:

- writing into `envs[depth]` lands in a `Map` only this subtree holds → visible downward only
  (`local`);
- writing into `envs[parentDepth]` lands in a `Map` every sibling subtree already holds →
  visible to siblings and what they nest (`global`; at the top level, where there is no parent,
  it falls back to slot 0);
- writing into `envs[0]` lands in the one `Map` every scope holds → visible everywhere
  (`universal`).

The three modes are the same operation against three slot indexes. A read is a plain outward
walk from the reference's own depth to zero, then the constant table. No scope-chain object, no
runtime linking.

## B.6 Errors

All errors derive from `DSLError` and carry `{ message, loc: { line, column, start, end },
source }`, plus `codeFrame()`, which renders the caret-underlined excerpt.

| Class | Raised by |
| :--- | :--- |
| `DSLSyntaxError` | tokenizer |
| `DSLParseError` | parser |
| `DSLRuntimeError` | runtime (and, for an unknown function or too many arguments, the compiler during `check`) |
| `DSLLimitError` | runtime |
| `DSLPermissionError` | compiler (off-list grants), runtime (missing grants) |

On a parse fault the parser records it, discards the rest of the line and the block that line
opened, and resumes. Faults after a script has started never throw out of `dispatch`: they go
to the logger, and only the faulting handler stops. An unregistered realm is reported as a
`DSLRuntimeError` through the logger, once.

## B.7 Runtime

Everything a script can reach is injected into `createRuntime({ ... })`; the options are in
`HOST.md` §2. `TWITCH` ships as an in-memory stub. Budgets are checked at every statement,
loop iteration and range element, against `limits.steps` and, through `wallClock`,
`limits.wallMs`. `any from` draws from the injected `random`, which is what makes it testable.

---

# Part C — Version history and open questions

## C.1 Overview

- **v2 is a strict superset of v1.** Every v1 script parses, compiles and behaves the same.
  The one behaviour change is that a bare `:` is no longer refused by the *tokenizer* — the
  *parser* refuses it, with a better message. Everything else v2 added was new spelling for
  things v1 could not say: variables, permissions, `when`, the `%` operator, `with` as a
  statement, host calls, block comments, optional commas, single-quoted strings, literal `${`,
  the subject aliases, `=` and `|`.
- **v2.1 is not a superset of v2.** It came from writing a real script (`realistic.ttv`) and
  fixing what fought back. Its behaviour changes are marked below.

## C.2 Resolved in v2

Each entry keeps the title v1 filed it under.

- **No variables or assignment** — Resolved. `expr -> name` bound into the current scope and
  `expr => name` into the parent, which made a binding visible to later siblings. Assignment is
  an expression, so `await (5:00 -> wait_time)` both binds and awaits. *(Changed in v2.1: the
  arrows are synonyms and `+scope` decides where names bind.)*
- **No `else` / `elif`** — Resolved by `when`, which covers the chain shape *and* the switch
  shape with one keyword. `else`, `elif`, `elseif`, `switch`, `case` and `default` were reserved
  only to produce an error that points at `when`. *(Changed in v2.1: `else` and `else if` are
  real.)*
- **`where` as a statement** — Resolved by `with` as a block statement, which branches on its
  expression's *result*.
- **Case-insensitive `is` is not configurable** — Resolved. Prefix a value with `=` for an exact
  comparison: `is ='TeXt'`. `is` also rejects a template that still carries an interpolation.
- **Identifier resolution is flat** — Resolved for variables, which are scoped by lexical depth.
  Host constants stay one flat namespace, which is correct: they are the host's, not the
  script's.
- **No `Identifier` in the original node inventory** — Resolved without a sigil. A variable was
  told from a constant by its shape: an interior underscore (`mod_msg`), checked only where a
  name is created. *(Changed in v2.1: a lower-case letter, not an underscore.)*
- **No escape syntax inside templates for `${`** — Resolved. An unterminated `${` is text; a
  matched one is still an interpolation. The escape idiom is `${ "${x}" }`. *(Changed in
  v2.1.1: an unterminated `${` is an error at the `${`, and `\${` is the literal spelling.)*
- **No block comments** — Resolved. `/* ... */` may span lines.

New in v2, with no v1 entry:

- **Permissions** — `+name` or `+name:sub` on a `using` header, accumulating downward and
  matching exactly. *(Changed in v2.1: a fixed list, one-level `.*`, and required descriptions.)*
- **The `%` operator** — trims, then replaces runs of named character classes; joins a list. A
  bare `%` meant `%n%s`. *(Changed in v2.1: `\s*\n\s*`.)*
- **`|` as a `where` alias**, and `of` for `<|` (which v1 documented but never implemented).
- **Host JavaScript calls** — `$:Date.now()` walked a host-supplied binding table. *(Changed in
  v2.1: spelled `&`, native calls lower-case, `eval:js` limited to built-ins.)*
- **Single-quoted strings**, **optional commas**, and the **subject aliases**.
- **The fourth job of `:`** — a bare `:` became a `when` label, so the tokenizer no longer
  refused it. This was the only v1 behaviour v2 changed: the fault is still reported at the same
  place with more information, but its class changed from `DSLSyntaxError` to `DSLParseError`.
  An unterminated `${` also stopped being a lexical fault and became legal. *(v2.1 removed the
  emote job of `:`, leaving three. v2.1.1 made an unterminated `${` a lexical fault again.)*

## C.3 Changed in v2.1

From writing `realistic.ttv` and ranking what fought back. **Behaviour change** marks an entry
that changes what an existing v2 script does.

- **`->` vs `=>` needed the scope tree in your head** — They are now synonyms. A per-script
  `+scope:local|global|universal` decides where both bind, defaulting to `global`. In v2, `->`
  wrote to the current scope and `=>` to the parent, and `=>` at the top level was a compile
  error. **Behaviour change.**
- **`=>` forced a do-nothing `using *` wrapper** — Resolved by the same change: `global` at the
  top level binds into slot 0.
- **No comparison operators** — `is above`, `is below`, `is or above`, `is or below`, over
  numbers and number-likes; unreadable values are `NaN`, and `NaN` is always false.
- **`.prop` read one level** — A glued `.name` reads a property off any expression.
- **`when true` as `else`** — `else` is a keyword, and `else if <test>` is a spelling of
  `when <test>`. `else when` is an error.
- **`* from ( ... )`** — New spelling of `any from`.
- **"Did they pass an argument?" was `is *`** — `*` is `ANYTHING`; `SOMETHING` and `NOTHING`
  join it. **Behaviour change:** `*` now matches `""` and `[]`; in v2 it meant what
  `SOMETHING` means now.
- **Bare `%` missed a lone `\n`** — A bare `%` matches `\s*\n\s*`. **Behaviour change.**
- **Unicode escapes** — `é` and `\u{1F49C}` are real escapes. In v2 a backslash before
  `u` was simply dropped, so `"é"` read as `u00e9`. **Behaviour change.**
- **New sigils** — `<badge>` became `[badge]`, with `[a b]` meaning "any of these" and resolving
  once; `:emote:` became plain text, `'kappa'`; `$:Path.fn()` became `&Path.fn()`. Every old
  spelling (and the short-lived `--badge`) is a lexical error that names the new one.
  **Behaviour change.**
- **`-- "description"` on a `using` header** — New.
- **`using [badge]` rebound the subject to the badge** — A badge is a gate; the body runs under
  the unchanged subject. **Behaviour change.**
- **Nested `await`s re-installed on every firing** — A nested `await` installs once per site,
  and an enclosing `with (…)` stays in force for it. **Behaviour change.**
- **An unknown realm broke its whole enclosing body** — It now fails only its own block.
  **Behaviour change.**
- **Scripts as extension plugins** — New: the `plugin` header, `setting.name`, and
  `TTV_DSL.inspect`.
- **No user-defined functions** — `define` makes a verb the script can call like `POST`.
- **No loops** — `for` over a numeric range or a list, with `$`, labels, `break` and `renew`;
  the budget can be raised with `+eval:budget_*`.
- **Variable names needed an interior underscore** — Any name with a lower-case letter is a
  variable; ALL-CAPS is the host's and the script's functions'. v2's rule made `mils` and
  `clkFmt` illegal for no reason a reader could see.
- **One-shot timers** — `after`.
- **Durations printed as milliseconds** — the `~` / `as` format operator.
- **No arithmetic** — `calc( ... )`, gated on `eval:calc`.
- **No way to share a list between blocks** — a multi-item group is a list, and `any from`
  takes any value.
- **Host calls could not stand alone** — a line may be a host call, for calls made for their
  effect.
- **`eval:js` was a catch-all for unmapped host calls** — It covers only the static members of
  `Math` / `Number` / `Date` / `JSON` / `Array`, minus a blocklist; every host binding must be
  mapped, and `createRuntime` refuses to start otherwise. **Behaviour change.**
- **Native host calls are lower-case**, keyed by permission resource: `&html.*`,
  `&datetime.*`.
- **Permissions are a fixed list** with `action:resource.part` names and an explicit one-level
  `.*`; unknown grants fail at compile time, and `write`/`eval` grants need a description.
  **Behaviour change:** `+a:b:c` and off-list names are errors.
- **Granting a permission forced a subject scope** — A `using` may carry grants or `+scope`
  and no subject.
- **`where` / `|` after a yes/no condition** — now a parse error that names `with` and `and`.
  `await (.command is "so") where ("moderator" in .badges)` used to filter a one-item list of
  `true`, find nothing, and never fire.
- **`TTV_DSL.check` also compiles**, so compile-time mistakes are reported in the editor.
- **`TTV_DSL.highlight`** — New.
- **The host** — The v6 extension implements `HOST.md` in `src/lib/dsl-host.js`, held to the
  contract by `host/host-conformance.test.js` and `host/extension-adapter.test.mjs`.

## C.4 Changed in v2.1.1

- **A lone `${` was closed by a much later `}`** — Found while rewriting `SPEC.md` for
  readability; the owner ruled to fix it. A `${` that never closes is now a `DSLSyntaxError`
  at the `${`: "This `${` is never closed. Close it with `}` on the same line, or write `\${`
  to show `${` as text". An interpolation may span lines only inside `( )` or `[ ]` (A.7).
  **Behaviour change:** a template holding a lone `${` (`` `cost: ${ dollars` ``) was text and
  is now an error — write `\${`. An interpolation whose `}` sits on a later line outside
  brackets (`` `${`` newline `.sender` newline `` }` ``) is now an error too; no known script
  wrote one. *(v2.1.2 allows it again.)*

## C.4a Changed in v2.1.2

- **A `${` that ends its line reads over lines** — Proposed by the owner ("fat" reading after a
  `${` that ends a line), bounded by indentation (A.7). Lines after the `${` must be deeper; a
  line back at its indentation must start with `}`. Restores `${` ⏎ `.sender` ⏎ `}` and nested
  templates over lines in that form. New message for this form: "This `${` is never closed.
  When `${` ends a line, indent the lines after it deeper, then close it with `}` at the start
  of a line. To show `${` as text, write `\${`". **Still refused**, by design: a `${` with code
  after it, then a nested template that runs onto the next line (`` ${ `first `` ⏎
  `` second` } ``) — the bug's own shape. Write it with the `${` ending the line instead.
- **Fixed on the way: exponential scanning.** 2.1.0 took exponential time on lines that each
  hold an unclosed `${` and a backtick (highlighting 38 lines of `` POST `a ${ `` took over 10 s;
  tokenizing 50 never finished). 2.1.1 and 2.1.2 scan them in linear time.

## C.5 Still open

- **`DISCORD` is unimplemented.** `idea.ttv` uses it; the runtime does not register it. A
  script naming it has that one block skipped, with one error reported.

## C.6 Settled — do not reopen by accident

- **`+` and `?` are reserved** for a later, distinct use. They will not become shorthands for
  `SOMETHING` / `NOTHING`.
- **Error recovery stays per line** (A.16).
- **`where` and `|` bind tighter than `is` / `in`** (A.3). Easy to mistake for a bug; it is
  not one.
