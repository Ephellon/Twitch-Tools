# TTV DSL — Language Specification v2.1

TTV DSL is an event-driven scripting language for the **TTV Tools** Chrome extension. It
lets a viewer describe chat automation — "every five minutes, post one of these lines",
"when someone mentions me, reply" — declaratively, without writing JavaScript.

Scripts are stored as `.ttv` files. The implementation lives in `dsl/` and publishes a
single global, `globalThis.TTV_DSL`. It has no dependencies, no build step, and never calls
`eval` or `new Function`: the compiler lowers the syntax tree into a tree of ordinary
JavaScript closures, which is what lets it run under a strict extension content security
policy.

**v2 is a strict syntactic superset of v1.** Every v1 script parses, compiles and behaves
identically. The one behavioural change anywhere in the language is that a bare `:` is no
longer refused by the *tokenizer* — it is refused by the *parser*, with a better message
(§5.11). Everything else v2 adds is new spelling for things v1 could not say at all:
variables (§9.2), permissions (§6.8), `when` (§6.7), the `%` operator (§5.9), `with` as a
statement (§6.2), host calls (§5.12), and a handful of conveniences (§2.4, §2.6, §3.1,
§3.2, §5.7, §5.8, §5.10).

**v2.1 is not a superset of v2.** It came out of writing a real script (`realistic.ttv`)
and fixing what fought back. These behaviours changed, all listed in §14.1a:

- `*` now matches empty values too — it is `ANYTHING` (§3.7). The old meaning is `SOMETHING`.
- `->` and `=>` are synonyms; a `+scope` mode decides where both bind, and the default
  (`global`) shares a binding with siblings (§9.2). `=>` at the top level is no longer an
  error.
- A bare `%` matches any whitespace run containing a newline, not `%n%s` (§5.9).
- `else`, `above` and `below` are keywords.
- Badges are `[badge]` (or `[a b]`, "any of these"), emotes are plain text (`'kappa'`), and
  host calls are `&Path.fn()`; `<badge>`, `--badge`, `:emote:` and `$:` are errors.
- `using [badge]` is a gate that keeps the current subject (§6.3).
- A nested `await` installs once, and an enclosing `await … with (…)` filter stays in force
  for it (§6.1).

It also adds `else` (§6.7), `is above` / `is below` / `is or above` / `is or below` (§5.4),
`ANYTHING` / `SOMETHING` / `NOTHING` (§3.7), nested property reads `.a.b.c` (§5.13), a
`using` with no subject (§6.3), `after` (§6.9), the `~` format operator (§5.14), arithmetic
in `calc( ... )` (§5.15), lists (§8), and host calls as statements (§6.6).

What the language expects from whatever runs it — realms, events, verbs, host calls and the
permission prompt — is specified separately, in **`HOST.md`**.

- **Namespace:** `globalThis.TTV_DSL` — *not* `TTV_LANG`, and not `LANGUAGE`, which
  `ext/polyfill.js` already defines.
- **Folder:** `dsl/`
- **Script extension:** `.ttv`
- **Target:** ES2020 / Chrome 88.

---

## 1. Design goals and non-goals

### Goals

- A concise, declarative syntax for chat automation that reads like a description of intent.
- Event-driven triggers over channel state, chat messages, timers and commands.
- Indentation-based structure, so nesting is visible rather than punctuated.
- Hard resource limits, so a badly written script degrades the extension rather than the tab.
- Every fault carries a source location precise enough to underline in an editor.

### Non-goals

- General-purpose computation. There are no user-defined functions and no loop construct.
  v2 adds variables (§9.2), but only so that a value computed once can be named; there is
  still nowhere to put a *procedure*.
- Arithmetic. There is no multiplication operator (see §3.7), subtraction is unclaimed, and
  `calc` is reserved against the day it arrives (§14.2).
- Persistence. A script holds no state between runs.
- Sandboxing against a hostile author. Scripts are written by the user, for the user; the
  limits in §12 exist to catch mistakes, not attacks.

---

## 2. Lexical structure

### 2.1 The off-side rule

Indentation defines blocks. The tokenizer maintains a stack of indentation widths and emits
`INDENT` when a line is more indented than the last, and one `DEDENT` per level closed when
it is less.

```
await 5:00          <- level 0
    POST `hi`       <- INDENT, level 1
                    <- DEDENT at end of input
```

A dedent must land exactly on an enclosing level. Landing between two levels is an error:

```
await *
        POST `x`
    POST `y`        <- error: does not match any enclosing block
```

### 2.2 Tabs and spaces

Leading whitespace may use tabs or spaces, but **not both on the same line**. Mixing them
raises `DSLSyntaxError`. The check is per line; a file may use tabs in one region and spaces
in another, though nothing good comes of it.

### 2.3 `NEWLINE`

`NEWLINE` terminates a statement. Unlike most indentation-sensitive languages, TTV DSL keeps
emitting `NEWLINE` **inside brackets**, because `any from ( ... )` separates its items by
line rather than by comma (§8). `INDENT` and `DEDENT` *are* suppressed inside brackets, so a
continuation line may be indented freely.

Blank lines and comment-only lines produce no tokens at all — not even `NEWLINE` — and never
affect the indent stack, however they are indented.

### 2.4 Comments

`//` runs to the end of the line. `/* ... */` is a block comment and may span lines.

The tokenizer tests `//` and `/*` **before** the `/channel` selector. Without that ordering
every comment would scan as a channel named after its first word.

A block comment that owns its whole line is consumed at the **line head**, before
indentation is measured, so it can neither shift the indent stack nor emit a spurious
`NEWLINE` — exactly like a `//` line. One that is reached mid-line is skipped like
whitespace. The distinction matters for a line such as

```
    /* note */ POST `hi`
```

whose indentation still has to be measured. The tokenizer therefore looks ahead to the
closing `*/` and only takes the line-head path when nothing but whitespace follows it.

An unterminated `/*` is an error.

### 2.5 End of input

At end of input the tokenizer emits a final `NEWLINE` (if the last line produced tokens),
one `DEDENT` per open block, and then `EOF`. An unclosed `(` at end of input is an error.

### 2.6 Commas *(v2)*

A `,` is an **optional** item separator. It is legal — and entirely ignorable — inside
`any from ( ... )`, inside a parenthesized group, in a `using` header, and in a `&Path.fn(...)`
argument list. Leading, trailing and repeated commas collapse to nothing:

```
POST any from (
    , `burger`
    , `burrito`
    ,
)
```

Commas do **not** replace the newline rule. Items are still separated by line, so two
templates on one line are still two items whether or not a comma sits between them. And a
comma is *not* ignorable between statements: a stray `,` on its own line is an error rather
than being silently swallowed, which is the whole reason it is a separate skip-set from the
one the statement loop uses.

---

## 3. Literals

### 3.1 Strings

Single-line, in either quote: `"streamcord"` or `'streamcord'` *(v2)*. The two spellings
are the same literal — they scan through one routine with the quote as a parameter, so
there is no way for them to drift apart. Recognized escapes are `\n`, `\r`, `\t`, `\b`,
`\f`, `\v`, `\0`, and a backslash before any other character yields that character —
so `\"`, `\'` and `\\` work as expected. A newline inside a string is an error.

Unicode escapes use JavaScript's two spellings *(v2.1)*: `é` (exactly four hex digits)
and `\u{1F49C}` (one to six, up to `10FFFF`). Anything else after `\u` is an error — in v2 a
backslash before `u` was simply dropped, so `"é"` read as `u00e9`. The same escapes work
in templates.

### 3.2 Template literals

Backtick-delimited, and the normal way to write a message:

```
REPLY `what do you want now, ${ .sender }?`
```

`${ ... }` interpolates an expression. Braces that are not preceded by `$` are literal, as is
a `$` not followed by `{`:

```
POST `a { plain } brace, 100$ and a }`
```

Templates may span lines and may nest arbitrarily: an interpolation can contain a template,
which can contain another interpolation. The tokenizer tracks brace depth while stepping over
nested strings, templates and comments, so a `}` inside `` `a}b` `` does not close the
interpolation early.

A template is emitted as a **single** `TEMPLATE` token carrying `quasis` (the literal chunks,
always one more than the expressions) and `expressions` (each the raw substring plus its
absolute offset in the file). The parser re-parses those substrings against that offset, so a
fault inside `${ ... }` reports its real line and column.

#### A literal `${` *(v2)*

A `${` with **no matching `}`** is literal text. `` `cost: ${ dollars` `` is an ordinary
message, not a broken interpolation.

A `${` **with** a matching `}` is still an interpolation, and is still an error when its
contents are ungrammatical. That asymmetry is deliberate and is the resolution of v1's open
question about escaping. Degrading a *matched* pair to text would silently swallow real
typos — `${ .sendr }` would become the literal string `${ .sendr }` rather than telling you
the property is misspelled. And the escape idiom the language actually offers,

```
POST `${ "${whatever}" }`
```

only means anything if the outer, matched pair is genuinely evaluated: it interpolates a
*string* that happens to read `${whatever}`.

The same rule governs a quote that never closes inside an interpolation. If the tokenizer
cannot find the end of a nested string while hunting for the `}`, it concludes that the
`${` was never an interpolation and treats it as text, rather than reporting an
unterminated string the author never wrote.

### 3.3 Numbers

Integers and decimals: `42`, `3.5`. A fractional part requires a digit after the dot, which
is what lets `1..9` scan as `1`, `..`, `9`.

### 3.4 Durations

`mm:ss` or `hh:mm:ss`, normalized to milliseconds:

| Literal | Meaning |
| :--- | :--- |
| `0:30` | 30 seconds |
| `5:00` | 5 minutes |
| `15:00` | 15 minutes |
| `1:30:00` | 1 hour 30 minutes |

The minutes and seconds fields must be two digits in `00`–`59`. The runtime additionally
accepts suffixed shorthand (`90s`, `5m`, `2h`, `3d`) wherever a duration is computed rather
than written literally, and defers to the extension's own `parseTime` when the page provides
one.

### 3.5 Ordinals

Ordinals index collections, **1-based in the source, 0-based after conversion**:

| Literal | Index | Meaning |
| :--- | :--- | :--- |
| `1st` | `0` | first |
| `2nd` | `1` | second |
| `3rd` | `2` | third |
| `10th` | `9` | tenth |
| `-1st` | `-1` | last |
| `-2nd` | `-2` | second to last |

The `th` suffix is **universal**: `1th`, `2th` and `3th` are legal and mean exactly what
`1st`, `2nd` and `3rd` mean. The suffix carries no meaning; only the digits do.

Pattern: `-?\d+(st|nd|rd|th)`. A leading `-` is part of the ordinal, not unary minus — but
only when the suffix is actually present, so `-1` is still negation applied to `1`.

### 3.6 Booleans

`true` and `false`.

### 3.7 The wildcard, and the reservation of `*`

`*` is **always** the wildcard literal. v1 has no multiplication operator, and `2 * 3` scans
as three tokens: number, wildcard, number.

This is a deliberate reservation, not an oversight. `*` is by far the most common token in
real scripts — `await *`, `using *`, `.message is *` — and making it context-dependent would
mean the lexer had to know whether it sat in operand or operator position. The language gives
up general arithmetic in exchange for a wildcard that is unambiguous everywhere.
Multiplication lives inside `calc( ... )` (§5.15), where `*` is an operator; outside it,
`*` is always the wildcard.

As an operand, the wildcard means "anything present":

- `.message is *` — there is a message.
- `.command is *` — a command was issued.
- `await *` — any event at all.

#### `ANYTHING`, `SOMETHING`, `NOTHING` *(v2.1)*

`*` is one of three presence tests, and is another spelling of the first:

| Test | `x is <test>` is true when `x` is… |
| :--- | :--- |
| `ANYTHING` (`*`) | any value at all — `""` and `[]` included. Only absence fails. |
| `SOMETHING` | present **and** not `""` or `[]`. |
| `NOTHING` | absent, `""`, or `[]`. |

The difference between the first two is the one a real script trips on. Twitch delivers a
bare `!so` with an **empty** argument, so `.argument is *` is true for it — something *was*
sent, it just says nothing. "Did they give a name?" is `.argument is SOMETHING`.

The three words are resolved by the parser, not the constant table, so a host constant
cannot shadow them. They work with `in`, with `=` (§5.8) and as `when` case labels, exactly
as `*` does. As a truth value, `ANYTHING` and `SOMETHING` are true and `NOTHING` is false.

> **Changed in v2.1.** In v2, `x is *` meant what `SOMETHING` means now.

---

## 4. Selectors and sigils

Every selector produces a `Selector` node tagged with a `kind`.

| Sigil | Example | Kind | Meaning |
| :--- | :--- | :--- | :--- |
| `#` | `#` | `channel` | The channel in scope. |
| `#prop` | `#name`, `#live` | `prop` | A property of the channel in scope. |
| `/channel` | `/ginger_enby` | `channel` | The channel with that name. |
| `/channel#prop` | `/ginger_enby#live` | `prop` | A property of a named channel. |
| `REALM/path` | `DISCORD/779741119520571456` | `realm` | A realm-qualified subject. |
| `[badge …]` | `[moderator]`, `[vip moderator]` | `badge` | The first listed badge the subject in scope holds — "any of these". |
| `@user` | `@ephellon` | `user` | A user in the channel in scope. |
| `.prop` | `.sender`, `.href` | `context` | A property of the enclosing subject (§9). |

Notes:

- A bare `/` is equivalent to a bare `#`: the channel in scope.
- `/channel#prop` is two tokens fused by the parser, and only when they are **adjacent** in
  the source. `/ginger_enby #name` with a space is two separate selectors — which is what
  makes `using [viewer] [everyone]` work by juxtaposition.
- `REALM/path` requires the realm name to be all-caps and glued directly to the path. The
  tokenizer will not read `TWITCH// note` as a realm, because `//` is checked first.
- An **unregistered realm fails only its own block** *(v2.1)*. It is reported once and
  resolves to nothing, so `using DISCORD/…` contributes no iteration and every sibling block
  still installs. In v2 it threw, which took the whole enclosing body down with it.
- `[badge …]` *(v2.1)* was `<badge>`. Several names in one bracket — `[vip moderator]`,
  commas optional — resolve **once**, to the first one held, so `using [vip moderator]` runs
  its body once for a viewer holding both. Separate brackets, `[vip] [moderator]`, are
  separate subjects and run once each. The list is one line; `[]` is an error. `<badge>` and
  the short-lived `--badge` are lexical errors that name the new spelling.
- **Emotes have no sigil** *(v2.1)*. An emote is text in chat, so it is written as text:
  `'kappa'`. `:kappa:` is a lexical error that says so.
- A badge list resolves against the innermost subject that actually carries badges, falling
  back to the channel. Inside `await * with (...)` the subject is the *event*, and an event
  has no badges, so `using [moderator]` there means the channel's badge — the reading the
  author intended.
- A bare word that is not a keyword is an **identifier**, resolved against the host's
  constant table (`USERNAME`, and whatever else the extension publishes). An identifier is
  not a sigil: sigils name things *inside* a channel, an identifier names a value the host
  handed to the script.

---

## 5. Expressions

### 5.1 Precedence

Lowest (loosest) to highest (tightest):

| # | Operator | Associativity | Meaning |
| :--- | :--- | :--- | :--- |
| 0 | `->`, `=>` | **non-chaining** | bind a name *(v2, §9.2)* |
| 1 | `or` | left | logical disjunction |
| 2 | `and` | left | logical conjunction |
| 3 | `is`, `in` | **non-associative** | equality, membership |
| 4 | `%…` | left | regex replacement / list join *(v2, §5.9)* |
| 5 | `<\|`, `of` | left | pipe |
| 6 | `where`, `\|` | left | filter *(`\|` is v2, §5.10)* |
| 7 | `..`, `...` | non-associative | exclusive, inclusive range |
| 8 | `not`, `-`, `=` | prefix | unary negation, exact comparison *(`=` is v2, §5.8)* |
| 9 | member / sigil access | — | tighter than every operator |

Row 0 is not a real row. Assignment is **not** in the operator table at all, because its
right-hand side is a name rather than an expression — there is nothing for precedence
climbing to climb. The parser handles it as a tail pass gated on the outermost precedence
level, which makes it the loosest construct in the language for free and keeps every other
row in the table honest about being a binary operator over two expressions. It is listed
here only so the reading order is complete.

### 5.2 Why `where` binds tighter than `<|` (`of`)

These are the single most consequential rows in the table.

```
1st <| .links where ("twitch.tv" in .href)
```

```
1st of .links where ("twitch.tv" in .href)
```

parses as

```
1st <| (.links where ("twitch.tv" in .href))
```

The filter narrows the collection, and *then* the ordinal indexes the narrowed result. The
other grouping — `(1st <| .links) where (...)` — would index first and filter a single
element, which is never what anyone means.

**A filter whose predicate contains `is` or `in` must be parenthesized.** `where` and `|`
bind tighter than the comparisons, so the parentheses are what mark where the predicate
begins and ends:

```
.links | ("twitch.tv" in .href)      // canonical
.links where ("twitch.tv" in .href)  // the same thing, spelled out
```

Without them the comparison swallows the filter instead:

```
.links | "twitch.tv" in .href        // (.links where "twitch.tv") in .href — a boolean
```

This is a settled rule, not a rough edge. The two readings cannot both be had: loosening
`where` below `in` would fix the unparenthesized line and break the ordinal-indexing shape
above, which is by far the more common one. Parenthesized is therefore the canonical
spelling throughout this document, and it is what every example uses.

### 5.3 Non-associativity of `is` and `in`

`a is b is c` is rejected outright rather than being silently read as `(a is b) is c`, which
would compare a boolean against `c`. Parenthesize to say which comparison comes first:

```
await (.a is .b) is .c      // legal, and obviously deliberate
await .a is .b is .c        // DSLParseError
```

### 5.4 Comparison semantics

- **`is`** — equality. Strings compare **case-insensitively**, because every identifier this
  language compares (channel names, user names, commands) is case-insensitive on Twitch, and
  scripts are written by hand: `.sender is "Jjay_89"` must match `jjay_89`. Objects compare
  by identity or by matching `name`. A presence operand (`*`, `SOMETHING`, `NOTHING`) asks
  the presence question instead (§3.7).
- **`in`** — membership. A string right-hand side means substring (case-insensitive), an
  array means "some element equals", an object means "has this key".
- **`not`** — logical negation over the truthiness rule below.
- **Truthiness** — an empty list is false, as are `null`, `undefined`, `""` and `0`. `*` and
  `SOMETHING` are always true; `NOTHING` is always false.

#### Numeric comparison *(v2.1)*

```
if .raid_size is above 50          // >
if .raid_size is below 50          // <
if .raid_size is or above 50       // >=
if .raid_size is or below 50       // <=
```

The comparison word follows `is`; the inclusive form puts `or` between them, so the line
reads as the sentence it is. `above` and `below` are keywords and are legal **only** after
`is` / `is or` — `.size above 50` is an error that says the `is` is missing. `is or` means
nothing else in the language (`or` never starts an operand), so this steals no existing
spelling, and plain `a or b` is unchanged. The comparisons share `is`'s precedence and its
non-associativity (§5.3).

Both sides are read as numbers:

- a number is itself; a duration (`1:00`) is its milliseconds;
- a string is read as a number, then as a duration (`"61000"`, `"0:30"`, `"90s"`);
- anything else — missing, a boolean, a list, an unreadable string — is `NaN`.

`NaN` answers every comparison **false**. A comparison against a value that is not there is
not an error; it is a question whose answer is "no".

### 5.5 Ranges

`..` is exclusive, `...` is inclusive:

| Expression | Members |
| :--- | :--- |
| `1 .. 10` | 1, 2, 3, 4, 5, 6, 7, 8, 9 |
| `1 ... 10` | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 |

A descending range counts down. Expanding a range charges the step budget per element, so an
absurd range raises `DSLLimitError` rather than hanging.

### 5.6 The pipe, `<|` (`of`)

`accessor <| collection` applies an accessor to a collection. With an ordinal on the left it
indexes:

```
goto 1st of .links       // the first link
goto -1st <| .links      // the last link
```

With anything else on the left, the left-hand expression is evaluated with the collection as
its subject.

### 5.7 The subject aliases `_`, `__this__`, `__self__`, `__me__` *(v2)*

All four name the current subject itself — the thing `.prop` reads a property *from*:

```
await *
    POST `${ .name } is the same as ${ __this__.name }`
```

They lex as ordinary identifiers and are recognized by the parser, which compiles them to a
read of `context.subjects[depth]` with `depth` baked in at compile time. That is the same
machinery `.prop` uses, minus the property read, so an alias inside a `where` filter means
the *item*, not the enclosing event — exactly as `.href` would.

They are **read-only**: none may appear on the right of a binding arrow. See §9.3 for why
that restriction costs nothing.

### 5.8 Case-sensitive comparison, `=` *(v2)*

`is` and `in` are case-insensitive by default (§5.4). Prefixing an operand with `=` makes
the comparison exact:

```
await (.message is 'HELP')      // matches "help", "Help", "HELP"
await (.message is ='HELP')     // matches "HELP" and nothing else
```

`=` is a **prefix on the operand**, not a binary operator and not a second spelling of `is`.
That is why it reads the way the script is written, and why it composes with `in` and with
`when` case labels without either of them needing to know it exists. It works on any
operand shape — `is ='TeXt'`, `is =<property>`, `is =<var_name>` — because what it wraps is
a *value*.

One `=` is enough. `=a is b` and `a is =b` are the same comparison; asking for exactness on
either side makes the whole comparison exact.

### 5.9 The replacement operator, `%` *(v2)*

`<subject> %… <replacement>` cleans up text.

```
REPLY `
    help → this help message
    gamble → throw away all your monies
` % '·'
```

**On a list**, `%` joins: `.links % ', '` renders each element and glues them with the
replacement. There is nothing to replace *within* a list, and joining is what the operator
is reaching for anyway.

**On anything else**, the value is rendered to text, **trimmed**, and every run matching the
class sequence is replaced.

The sequence is a run of `%X` pairs. The leading `%` belongs to the first class, so `%n%s`
is two classes and a bare `%` is zero — which is how `%` alone can mean the default without
a second spelling.

**A bare `%` matches any whitespace run that contains a newline** — `\s*\n\s*` — so it
flattens line breaks and the padding around them, and leaves the spaces *within* a line
alone. *(Changed in v2.1.)* It used to expand to `%n%s`, which concatenates to `\n+\s+`: a
newline *followed by* more whitespace. That let a lone `\n` and a `\r\n` slip through, which
is not what "flatten this block" means to anyone reading it. `%n%s` spelled out still means
exactly `\n+\s+`.

| Sequence | Meaning | Regex | Zero-width |
| :--- | :--- | :--- | :--- |
| `%0` | null | `\0` | no |
| `%a` | alphabetic | `[A-Za-z]` | no |
| `%A` | non-alphabetic | `[^A-Za-z]` | no |
| `%b` | word boundary | `\b` | **yes** |
| `%B` | non-word-boundary | `\B` | **yes** |
| `%d` | digit | `\d` | no |
| `%D` | non-digit | `\D` | no |
| `%f` | formfeed | `\f` | no |
| `%n` | newline | `\n` | no |
| `%r` | carriage return | `\r` | no |
| `%s` | space | `\s` | no |
| `%S` | non-space | `\S` | no |
| `%t` | tab | `\t` | no |
| `%v` | vertical tab | `\v` | no |
| `%w` | word character | `\w` | no |
| `%W` | non-word-character | `\W` | no |
| `%c` | trim first | *(flag, not a class)* | — |

Complement pairs: `%a`/`%A`, `%b`/`%B`, `%d`/`%D`, `%s`/`%S`, `%w`/`%W`. The rest have no
counterpart. An unknown letter is a `DSLRuntimeError`.

`%w` is JavaScript's `\w`, so it admits `_` as well as letters and digits — `%a` and `%w`
differ by both digits and the underscore. That is intended, and is not to be "tidied" into
`[A-Za-z0-9]`: `%` only ever operates on strings, so the underscore costs nothing, and `\w`
is what every other language carrying this notation means by it. Matching that expectation
beats internal consistency.

Classes **concatenate**, in the order given, and each non-zero-width class contributes a
`+`. So `%d%s` is `\d+\s+` — "a run of digits followed by a run of spaces". The **whole
match** is replaced, not just the last class. `%b` and `%B` match a position rather than a
character and therefore take no quantifier.

#### Three rules worth stating outright

**The trim is unconditional.** `%` always trims before replacing; `%c` is accepted and
ignored, so a script that spells the flag out behaves identically to one that does not.

**The whole matched run is replaced.** `%d%s` replaces the digits *and* the spaces. If the
digits should survive, write `%s`.

**The replacement is inserted verbatim.** `%` adds no padding of its own, so spacing is
opt-in and lives in the replacement string:

```
` ... ` % '·'        →  help → this help message·gamble → throw away all your monies
` ... ` % ' · '      →  help → this help message · gamble → throw away all your monies
```

An operator that quietly padded its output would be impossible to turn off, and `.links % ','`
would have no way to produce `a,b`.

### 5.10 `|` as an alias for `where` *(v2)*

`.links | pred` means exactly `.links where pred`. It is the *same token type*, so
precedence, associativity and the resulting AST node are identical by construction rather
than by agreement — the two spellings cannot drift apart. Likewise `of` and `<|`.

See §5.2 for the precedence gotcha this inherits.

### 5.11 The jobs of `:` *(v2)*

`:` means three things: a duration (`15:00`), a permission segment (`+eval:calc`), and a
`when` case label (`"help":`). *(v2.1 removed the fourth, the `:kappa:` emote.)*

Durations are claimed at the leading digit and permissions at the leading `+`, so a `:` that
reaches its own branch is a case label. The tokenizer emits a `COLON` token, and the
**parser** produces the diagnostic when one turns up somewhere else:

```
DSLParseError: Unexpected ":"; expected a duration like "15:00", or a `when` case label
like `"help":`
```

This is the only place where v2 changes a v1 behaviour. The fault is still reported, at the
same position, with strictly more information; only its class changed from
`DSLSyntaxError` to `DSLParseError`.

### 5.12 Host JavaScript calls, `&Path.fn(...)` *(v2)*

`&Path.fn( ... )` calls a function the **host** has published to the script.

```
POST `!lurk What time is it? It's ${ &Date.now() }`
POST `${ &Math.max(1, 9, 3) }`
```

The dotted path scans as a single token whose value is the segment array. The runtime walks
a host-supplied binding table — a plain object — and calls what it finds. **At no point does
a string become code.** There is no `eval` and no `new Function` anywhere in this
implementation, and `&Path.fn(...)` is the construct that would most obviously have wanted one. A path
is data all the way down.

Segments named `__proto__`, `prototype` or `constructor` are refused outright. That is not a
substitute for the host simply not registering dangerous objects, but walking into
`constructor` is the one mistake that would turn a property lookup back into code
evaluation.

**No bindings are registered by default.** `&Date.now()` fails as loudly as `DISCORD` does
(§11) until the host opts in — a script should not silently acquire capabilities because the
name happened to exist in JavaScript.

Every path maps to a required permission (§6.8). The host supplies the map; anything
unlisted requires `eval:js`:

```js
createRuntime({
    jsBindings: { Date: { now: () => Date.now() } },
    jsPermissions: { 'Date.now': 'read:datetime' },
});
```

An unregistered path, a path that resolves to a non-function, and a missing permission are
`DSLRuntimeError`, `DSLRuntimeError` and `DSLPermissionError` respectively.

---

### 5.13 Nested properties, `.a.b.c` *(v2.1)*

A `.name` **glued** to the expression before it reads a property off that expression's
value:

```
POST `${ .raider.name } was playing ${ .raider.last.category }`
.raider -> raid_info
POST `${ raid_info.name }`
```

It works off anything — a `.prop`, a `#prop`, a variable, a `&Path.fn(...)` result, a
parenthesized group. A missing link anywhere in the chain reads as empty, exactly as `.prop`
on a subject with no such property does; it is never an error. `constructor`, `prototype`
and `__proto__` may never be read.

**Glued means no space.** `.raider .name` is still two separate subjects, which is what keeps
`using .a .b` meaning "either of these". Member access binds tighter than every operator.

### 5.14 The format operator, `~` *(v2.1)*

`<value> ~ <pattern>` renders a duration as text:

```
POST `waited ${ wait_time ~ "hh?:mm:ss" }`      // 05:00, or 01:05:00 past the hour
```

| In the pattern | Means |
| :--- | :--- |
| `hh` `mm` `ss` | hours, minutes, seconds, padded to two digits |
| `h` `m` `s` | the same, unpadded |
| a unit then `?` | drop this unit — and the text straight after it — when it is zero and every unit before it was dropped |
| `'text'` | literal text, always (so `m' min'` is not read as minutes-then-"in") |
| anything else | literal |

The **largest** unit present absorbs the overflow: `"mm:ss"` on ninety minutes is `90:00`.
Seconds round down. The value is read as a number the way `above`/`below` read one (§5.4) —
a duration is its milliseconds — and anything that is not a number renders as empty.

`~` shares `%`'s precedence and is left-associative, so it formats what a pipe selected and
a comparison sees the formatted text. Durations are the only thing it formats today; the
pattern language leaves room for dates later.

### 5.15 Arithmetic, `calc( ... )` *(v2.1)*

Arithmetic lives inside `calc( ... )`, and only there:

```
using +eval:calc -- "scales the shoutout to the raid"
    await (.raider is SOMETHING)
        POST `that's ${ calc(.raid_size * 2 + 1) } half-gremlins`
```

Like CSS's `calc()`, the parentheses change what the characters inside mean: `+ - * / %`
and `**` are operators there, with **JavaScript's** precedence and semantics — `**` binds
tightest and is right-associative, then `* / %`, then `+ -`; `1 / 0` is `Infinity`. Outside
the parentheses, `*` is still the wildcard, `+` a permission, `%` the replacement operator
and `/` a channel.

- Operands are ordinary values — numbers, durations (as milliseconds), variables, `.prop`,
  `#prop`, host calls, and nested parentheses — read as numbers the way `above`/`below`
  read them. Anything unreadable is `NaN`, and `NaN` spreads, as in JavaScript.
- As in JavaScript, a unary sign cannot be the base of `**`: `-2 ** 2` is an error; write
  `(-2) ** 2` or `-(2 ** 2)`.
- Evaluating a `calc` needs the **`eval:calc`** permission, and like every `eval` grant it
  needs a description.
- A binary `-` outside `calc` is an error pointing here.

---

## 6. Statements

A statement occupies one line. Statements that open a block are followed by an indented
group of statements.

### 6.1 `await`

`await` installs a **recurring** trigger and returns immediately, so the statements after it
also get to install theirs. It does not block.

**Duration form** — runs its body every time the interval elapses, until the script stops:

```
await 5:00
    POST `modCheck`
```

**Event form** — runs its body every time an event satisfies the expression:

```
await (.message is *)
    REPLY `heard you`
```

The awaited expression is evaluated with the **event** as its subject, so `.sender` inside
both the condition and the body refers to the event.

#### Nested `await`s install once *(v2.1)*

An `await`'s body re-runs every time it fires. Its plain statements run every time — that is
the point of a handler — but an `await` **inside** it is installed only **once**, the first
time it is reached. Reaching it again does not install a second copy; it only updates the
context the installed handler builds on, so bindings the outer handler made are read from its
**most recent** firing.

```
await 15:00
    goto #                   // every 15 minutes
    await 5:00               // installed on the first tick; then every 5 minutes, once
        POST `modCheck`
```

"Once" is per statement **and per loop iteration**: an `await` inside `using [vip] [moderator]`
installs once for each of the two subjects, and one inside `with (<list>)` once per list
position. The number of handlers a script holds is therefore bounded by its source, never by
how long it has run. (In v2 every firing installed another copy, so handlers and timers piled
up and one command drew one reply per pile.)

#### `with (…)` stays in force for what is nested *(v2.1)*

The filter on `await … with (<filter>)` is re-checked every time a handler **nested inside
it** fires, against that handler's event. So

```
await * with (#live is true)
    await (.command is "help")
        REPLY `...`
```

answers `!help` only **while** the channel is live — it stops when the stream goes offline
and resumes when it comes back. That is the "binds a filter to a scope" reading.

The **trigger** — the expression right after `await` — is *not* re-checked. It says when the
nested handlers are installed, not when they may run:

```
await (.command is "start")
    await (.message is SOMETHING)     // every message AFTER `!start`
        REPLY `...`
```

Re-testing `.command is "start"` against each later message would make that inner handler
unreachable.

### 6.2 `with`

`with` has two forms. They never compete: the filter form is consumed on the `await` line,
before a block can open, so a `with` that reaches statement position is unambiguously the
block form.

**Filter form** — attaches a filter to an `await`. Both the condition and the filter must
hold:

```
await * with (#live is true)
    ...
```

The parentheses are ordinary grouping, not part of the syntax: `with #live is true` is
equally legal, and parsed identically.

**Block form** *(v2)* — opens a scope of its own:

```
await (.sender is "streamcord")
    with (.links | ("twitch.tv" in .href))
        goto .href
```

The expression is evaluated in the **current** scope, and the statement branches on its
**result**, not on its syntax:

- A **boolean** is a test. The block runs **once**, under the current subject, if it is
  true. This is what makes `with (#live is true)` equivalent to
  `using * where (#live is true)`.
- **Anything else** is a collection. The block runs **once per element**, with that element
  bound as the subject — so `.href` inside it means the link's property.

One rule, both readings, and the script never has to say which it meant. Branching on the
result is what buys that: a filter that happens to select nothing yields an empty list and
runs the block zero times, while a filter that asks a yes/no question yields a boolean and
runs it at most once.

A `with` that opens no indented body is a parse error.

### 6.3 `using`

`using` binds one or more subjects and runs its body once per subject that resolves. A
subject that resolves to nothing — a badge the viewer does not hold, a channel that does not
exist — simply contributes no iteration.

```
using [viewer everyone anyone all]
    await 5:00
        POST `i have risen`
```

Several selectors on one line are separate subjects, and the body runs once per one that
resolves. To mean "any of these badges" — run once if any is held — list them in one
bracket, as above. `using *` binds whatever is
already in scope, which is how the mockup's `using *` means "each live channel".

#### A `using` with no subject *(v2.1)*

A header may carry only grants (§6.8) or only `+scope` (§9.2). The body then runs **once,
under the subject already in force**:

```
using +read:datetime
    await 30:00
        POST `it is ${ &Clock.time() }`
```

This is what lets a permission be scoped to one block without also changing what `.prop`
means inside it. A `using` with nothing at all in its header is still an error.

#### Describing a `using` *(v2.1)*

A header may end with `--` and a quoted string, saying what the block is for — usually why
it asks for the grants it does:

```
using +eval:calc -- "Needed for the raid-size based timer"
    await 5:00
        ...
```

The description is recorded on the node (`description`) for a host to show — beside a
permission prompt, say — and changes nothing at run time. It must be a plain quoted string,
it must be the **last** thing on the header line, and there may be one. A header may carry a
description and nothing else, which makes a labelled section. `--` anywhere else is an error,
and `--name` glued together is the retired badge spelling.

#### A badge is a gate *(v2.1)*

`using [moderator]` asks whether the badge is held, and if it is, runs the body **under the
subject already in force** — it does not rebind the subject to the badge. Inside an
`await (.command is …)`, `.command`, `.argument` and `_` inside `using [moderator]` therefore
still read the message. (In v2 the subject became the badge's name, so every `.prop` inside
came back empty, silently.) Channels, realms and `*` still rebind as before.

### 6.4 `if`

```
if #name is "ginger_enby"
    POST `!lurk watching anime`
```

`if` does **not** rebind the subject — `.prop` inside an `if` still refers to whatever the
enclosing `using`/`await`/`where` bound.

An `if` that opens no indented body is a parse error.

Further branches are `when <test>` siblings, and the last may be `else` (§6.7). There is
no `elif`.

### 6.5 `goto`

```
goto #
goto 1st <| .links where ("twitch.tv" in .href)
```

Navigation is delegated to the realm in scope.

### 6.6 Verb calls, and host calls as statements

Any all-caps bare word in statement position is a verb call, optionally followed by an
expression:

```
POST `!lurk`
REPLY `hi ${ .sender }`
```

The decision is made by **position**, not by the lexer. `POST` at the start of a statement is
a verb; `USERNAME` inside an expression is an identifier. That keeps the verb registry open —
the host can register `WHISPER` without touching the language.

`POST` and `REPLY` ship by default. A verb that is not registered raises `DSLRuntimeError`.

Both built-in verbs **drop a blank message** rather than sending it: if the text matches
`/^\s*$/` nothing is sent. `REPLY ""` is therefore a deliberate no-op, and is used in the
mockup as one.

**Host calls as statements** *(v2.1)*. A line may also be a host call on its own, for a call
made for what it does rather than what it returns:

```
using +write:html.text -- "shows the last raider on the page"
    await (.raider is SOMETHING)
        &Html.setText("#last-raid", .raider)
```

That, a verb, and an assignment are the only expressions allowed to stand alone; any other
bare expression on a line is still an error (§9.2).

### 6.7 `when` *(v2)*

`when` is the language's whole branching vocabulary beyond `if`. It has two forms, told
apart by a single fact: **whether the head ends on a comparison with nothing after it.**
Nothing else about the line differs, and nothing has to be looked ahead for.

#### Switch form

`when <expression> is` with an empty right-hand side, then an indented list of `<value>:`
labels, each with its own block:

```
when .command is
    "help":
        REPLY `try: help, gamble, whoami`

    "gamble":
        REPLY `you lost`

    *:
        REPLY `no idea what that is`
```

The discriminant is evaluated once. Each label is compared against it with the operator from
the head — `is` uses equality (§5.4), `in` uses membership — and the **first** match runs.
At most one branch ever runs.

A `*` label matches any present value (§3.7) — so it is *almost* a default, but not when
the discriminant is missing entirely. The true default is an **`else` after the cases**, at
the same indentation as the `when`:

```
when .command is
    "help":
        REPLY `try: help, gamble, whoami`
else
    REPLY `no idea what that is`
```

#### Chain form

`when <test>` with a block, written as the **next sibling** of an `if` or another `when`:

```
if .command is "help"
    REPLY `help`
when .command is "gamble"
    REPLY `gamble`
else
    REPLY `something else`
```

`else if <test>` is accepted as another spelling of it (below). It is written as a sibling because that
is how it reads on the page, and because it keeps the off-side rule uniform — every branch
of a chain sits at the same indentation, rather than marching rightward. The parser folds
each chain `when` into the preceding statement's `alternate`, so three source statements
become one tree.

A chain `when` with no `if` or `when` before it is a parse error.

#### `else` *(v2.1)*

`else` + block, as the **last** sibling of a chain. It runs when every branch before it
declined — for a switch-form `when`, when no case matched. Like a chain `when`, it is folded
into the chain's final `alternate`.

A bare `else` takes **no condition**. **`else if <test>`** is the one exception: it is
another spelling of a chain `when <test>`, produces the same node, and may be followed by
further branches like any chain `when`:

```
if so_target is SOMETHING
    POST `everyone go follow @${ so_target }`
else if last_raider is SOMETHING
    POST `go follow @${ last_raider }`
else
    POST `give me a name`
```

`else when` is still an error — `when` already means "else if" on its own, so doubling it
says nothing new. Nothing may follow a bare `else` in the same chain — a branch there could
never run — and an `else` with no `if` or `when` before it is an error.

#### Neither form rebinds the subject

Like `if`, `when` leaves `.prop` meaning whatever the enclosing `using`/`await`/`where`
bound. A case body reads the same subject the head compared.

#### The poisoned words

`elif`, `elseif`, `switch`, `case` and `default` are reserved for exactly one purpose: so
that using them produces a diagnostic that points at `when` and `else`, instead of a generic
"expected a statement" that leaves the author guessing.

```
elif .a is "x"
→ `elif` is not a keyword in TTV DSL; use `when <test>` for the next condition, or `else` for the last one
```

### 6.8 Permissions *(v2)*

A `using` header may carry grants, spelled `+action:resource[.part…][.*]`:

```
using [vip] +read:datetime +eval:calc -- "Prints the time; calc is reserved for later"
    await 5:00
        POST `It's ${ &Date.now() }`
```

Permissions are checked by **host calls** (§5.12): the host maps each `&Path` it exposes to
the permission it needs, and an unmapped path needs `eval:js`. Nothing else in the language
checks a grant.

#### The permission list *(v2.1)*

The list of permissions is **fixed**. A grant that is not on it — or a `.*` that matches
nothing on it — is a `DSLPermissionError` **at compile time**, before anything runs. Without
that, a typo like `+read:htlm.*` would be accepted and silently grant nothing.

| Permission | Covers |
| :--- | :--- |
| `read:datetime` | the clock |
| `read:html.text` · `read:html.attributes` · `read:html.structure` | reading the page |
| `write:html.text` · `write:html.attributes` | changing the page |
| `parse:html.text` · `parse:html.attributes` · `parse:html.structure` | turning HTML text the script already has into serializable data |
| `eval:calc` | arithmetic (reserved; §14.2) |
| `eval:js` | any host call the host did not map to something narrower |

A host may add to the list (`createRuntime({ permissions: [...] })`). A host path mapped to
a permission that is not on the list is refused when the runtime is created, since no script
could ever be granted it.

#### `write` and `eval` grants need a description *(v2.1)*

Any `+write:…` or `+eval:…` grant must come with a `-- "…"` description in the same header
(§6.3) — it is a parse error otherwise. These are the grants that change the page or run
code, and the description is what a host shows the viewer when asking them to allow it.
`read` and `parse` grants need none.
Grants may be interleaved with subjects anywhere on the line, and a header may carry grants
and no subject at all (§6.3). `+scope` looks like a grant but is not one — it sets the
binding rule (§9.2), is never added to the grant set, and so can never satisfy a check for a
permission called `scope`. They are read directly by the
`using` parser rather than through the expression grammar, which is what makes a
`+permission` illegal everywhere else — a `+` that reaches any other position is a parse
error naming the `using` header, and a `+` that is not a permission at all is a *lexical*
error naming the absence of arithmetic.

#### Grants accumulate downward, never sideways

A block holds its own grants plus every ancestor's. It never sees a sibling's. The union is
computed once at compile time and carried as a frozen `Set`.

#### Matching is exact, or one written-out level

A grant covers a permission in exactly two cases: it **is** that permission, or it is the
permission's parent followed by `.*` — `+read:html.*` covers `read:html.text` and
`read:html.attributes`. That is all. There is **no implicit prefix logic**, and that absence
is the feature:

- `+read:html` does **not** grant `read:html.text`. Only `.*` widens, and only because the
  script wrote it out — the grant says how far it reaches.
- `+read:html.*` reaches **one** level: not `read:html.text.inner`, and never across actions
  (`write:html.text`) or into another resource.
- `+eval:calc` and `+eval:js` are unrelated permissions. Neither implies the other.

`*` may only be the last part, after a `.`: `+read:*`, `+read:html.*.text` and `+a:b:c` are
lexical errors. There are regression tests for every case above, so that a future
implementer cannot "helpfully" add prefix matching.

A missing grant raises **`DSLPermissionError`**, which is split out of `DSLRuntimeError` for
the same reason `DSLLimitError` is: a host wants to treat "this script asked for a
capability you did not give it" as a permissions prompt, not as a bug report. Because
matching is exact, the error is a reliable signal that a grant is genuinely absent rather
than merely written at the wrong granularity.

### 6.9 `after` *(v2.1)*

`after <duration>` waits **once**, then runs its body once:

```
after 1:00
    POST `one minute in — say hi to chat`
```

`await 1:00` would repeat; `after` does not. The duration is any value, read when the
statement is reached — `after wait_time` works — and something that is not a duration is a
runtime error. `after ... with (<filter>)` checks the filter when the timer fires.

Inside a handler, every arrival schedules its own `after`: `after 1:00` in a raid handler
means "a minute after *each* raid". That cannot pile up — each timer fires and is done. Its
body shares the enclosing handler's installation, so an `await` inside an `after` still
installs once (§6.1), and an enclosing `with (...)` still has to hold when it fires.

---

## 7. Blocks and nesting

A block is an indented run of statements belonging to the statement above it. Any statement
that can open a block may also omit it, except `if`, `when` and `with`, which require one.

There is no depth limit beyond the step budget.

---

## 8. `any from`

`any from ( ... )` chooses one item at random. `* from ( ... )` is the same construct
*(v2.1)* — `*` is `ANYTHING` (§3.7). A `*` counts as `* from` only when `from` follows it
directly; anywhere else it is the wildcard.

**Items are separated by whitespace, not commas:**

```
POST any from (
    `burger`
    `burrito`
    `taco` `tortilla`
)
```

This is why `NEWLINE` survives inside brackets (§2.3). Blank and comment-only lines between
items are ignored, so a comment may annotate a choice.

A range contributes **all of its members** to the pool, so `any from (1 .. 10)` picks a
number rather than picking the list:

```
REPLY `Congration. You'd done it. +${ any from(1 .. 10) }`
```

An empty `any from ()` is a parse error. The choice is drawn from the runtime's injected
random source, which is what makes it testable.

### Lists *(v2.1)*

A parenthesized group holding **two or more** items is a list, with items separated exactly
as in `any from` — by line or by optional comma. One item is still just a grouped value.

```
(`hi`, `hey`, `hello there`) -> greet_list

await (.message is SOMETHING)
    REPLY any from greet_list
```

`any from` and `* from` accept any value after `from`, not only a parenthesized group, so a
list bound once can be picked from anywhere. Ranges contribute their members to a list just
as they do to `any from`: `(1 ... 3, 9)` is `1, 2, 3, 9`. `%` joins a list (§5.9).

---

## 9. Scoping

### 9.1 The `.prop` rule

`.prop` refers to a property of the nearest enclosing **`using`**, **`await`**, **`where`**
or **`with`** subject. `if` and `when` do not open a scope.

The binding is **lexical and resolved at compile time**. Each scope-opening construct is
assigned a depth, and `.prop` compiles to a read of exactly that depth's slot. It is not a
dynamic "innermost subject" lookup.

That distinction is what makes this correct:

```
await (.links is *)                                  <- depth 1: subject is the event
    goto 1st <| .links where ("twitch.tv" in .href)
                ^^^^^^^^^^^^                 ^^^^^
                depth 1: the event           depth 2: the link being tested
```

`.links` reads the event's links. `.href` inside the `where` filter reads the individual
link. Under a dynamic rule the filter would have to guess, and nested filters would shadow
each other unpredictably.

### 9.2 Variables, the arrows, and `+scope` *(v2.1)*

A value can be given a name with either arrow. **`->` and `=>` are synonyms.**

```
`can I mod today?` -> mod_msg
`can I mod today?` => mod_msg     // identical
```

Where the name lands — and so who can read it — is decided once, for the whole script, by
its **scope mode**, set with `+scope` in a top-level `using`:

| Mode | A binding is visible to… |
| :--- | :--- |
| `+scope:local` | the block that made it, and what that block nests. The block is locked. |
| `+scope:global` *(default)* | that, **plus** the block's siblings and what they nest. |
| `+scope:universal` | every block in the script. |

A bare `+scope` is `+scope:global`, and a script with no `+scope` at all runs under
`global`. So the common case needs nothing:

```
await 1:00
    `checked in` -> shift_note

await 1:10
    POST `${ shift_note }`        // visible: the blocks are siblings
```

`+scope` is legal **only** in a top-level `using`; anywhere deeper it is a parse error, as is
an unknown mode or giving it twice. It applies to that `using`'s whole body:

```
using +scope:local
    await 1:00
        `a` -> sib_note
    await 1:10
        POST `${ sib_note }`      // empty: `local` keeps it in the first block
```

> **Changed in v2.1.** In v2 the two arrows differed — `->` wrote to the current scope and
> `=>` to the parent — and `=>` at the top level was a compile error. Remembering which was
> which, and wrapping scripts in a do-nothing `using *` so `=>` had a parent, were the two
> things writing `realistic.ttv` found most annoying. Picking the rule once, per script,
> removes both.

#### Assignment is an expression

It evaluates to the value it bound, which is what lets it appear where a value is expected:

```
await (5:00 -> wait_time)
    POST `waited ${ wait_time }`
```

The `await` still sees a duration and still installs a timer; the name is bound once, when
the timer is installed. (This is the one place where the language's syntactic decisions bite:
`await` chooses the duration form by *looking at* its subject, so the compiler unwraps the
assignment before making that test. Without that, the example above would silently become an
event-await that never fires.)

Assignment is the **loosest** construct in the language (§5.1) and does **not chain**:
`a -> b -> c` is a parse error. A binding on its own line is a statement:

```
any from (
    `can I mod today?`
    "modCheck"
) -> mod_msg
```

That is the *only* expression allowed to stand alone as a statement. A bare expression on a
line is still an error, because a language whose statements are verbs has no use for a value
nobody reads — and accepting one would turn every misspelled verb into a silent no-op.

### 9.3 The underscore rule *(v2)*

**A variable name must contain an interior underscore.** `mod_msg` and `wait_time` are
names; `x`, `_x`, `x_` and `USERNAME` are not.

This is the entire mechanism that distinguishes a variable from a host constant, and it has
to exist because the two are *lexically identical* — `USERNAME` and `mod_msg` are both just
`IDENT`. The lexer cannot tell them apart and neither can a reference site.

So the rule is enforced at the **binding site only**:

- Binding: the name must match `[A-Za-z0-9]+(_[A-Za-z0-9]+)+`, or it is a `DSLParseError`.
- Reference: **nothing is rejected.** A name with an interior underscore resolves
  variable-first, then constant. A name without one can only be a constant.

Enforcing only at creation is also why the subject aliases (§5.7) never collide with it:
`_`, `__this__`, `__self__` and `__me__` are only ever *read*, so they can never trip a
binding-site check. They are additionally refused as binding targets by name, so the error
says what is actually wrong rather than complaining about underscores.

### 9.4 Reading an unbound variable *(v2)*

**Reading a variable that was never bound yields empty. It is not an error.**

This mirrors `.prop` on a subject that has no such property, and it is load-bearing rather
than merely lenient. Consider:

```
using [moderator]
    await (5:00 -> wait_time)
        any from ( ... ) -> mod_msg

    POST `${ mod_msg } (${ wait_time })`
```

The `POST` is a *sibling* of the `await`, and `await` installs its trigger and returns
immediately (§6.1). Under **any** scoping rule, that `POST` runs before the timer has ever
fired, so it can never observe those bindings. The script is demonstrating syntax, not data
flow — and it must compile and run rather than throwing.

An unknown **constant** still fails loudly. That asymmetry is exactly what the underscore
rule buys: the compiler knows which of the two a name is, so it can be forgiving about the
one that is legitimately absent and strict about the one that is certainly a typo.

### 9.5 How the slots work

`subjects` is an array indexed by lexical depth (§9.1). `envs` is the same idea for
variables — one `Map` per depth.

The interesting part is how a child scope is built: the array is copied with `concat`, which
copies the **array** but leaves every ancestor `Map` shared **by reference**. So:

- writing into `envs[depth]` lands in a `Map` only this subtree holds → visible downward
  only (`local`);
- writing into `envs[parentDepth]` lands in a `Map` every sibling subtree is *already
  holding* → visible to siblings and what they nest (`global`; at the top level, where there
  is no parent, it falls back to slot 0);
- writing into `envs[0]` lands in the one `Map` every scope holds → visible everywhere
  (`universal`).

The three modes are therefore the same operation against three different slot indices, and a
read is a plain outward walk from the reference's own depth to zero, then the constant table.
No scope-chain object, no runtime linking.

---

## 10. Errors

All errors derive from `DSLError` and carry `{ message, loc: { line, column, start, end },
source }`, plus a `codeFrame()` that renders a caret-underlined excerpt:

```
DSLSyntaxError: Indentation mixes tabs and spaces; pick one (2:1)
  1 | await *
> 2 |      POST `x`
    | ^^
```

| Class | Raised by | Meaning |
| :--- | :--- | :--- |
| `DSLSyntaxError` | tokenizer | Unscannable input: a stray character, bad indentation, an unterminated string or template, an unclosed bracket. |
| `DSLParseError` | parser | Scannable but ungrammatical. |
| `DSLRuntimeError` | runtime | An unknown verb, realm or identifier; a malformed range; an unregistered `&Path.fn(...)` path. |
| `DSLLimitError` | runtime | A turn exceeded its step or time budget (§12). |
| `DSLPermissionError` | runtime | A block reached for something its `using` header was not granted (§6.8). |

`DSLSyntaxError`'s remit narrowed slightly in v2: a bare `:` (§5.11) and an unterminated
`${` (§3.2) are no longer lexical faults. The first became a `DSLParseError` with a better
message; the second became legal.

### 10.1 Recovery

Lexical faults are fatal — the scan cannot meaningfully continue past an unterminated
template.

Parse faults are **recovered**. On a fault the parser records it, discards the rest of the
line and the block that line opened, and resumes. A script with three mistakes reports three
errors rather than an avalanche. `TTV_DSL.parseTolerant(source)` returns
`{ program, errors }`; `TTV_DSL.parse(source)` throws the first.

`TTV_DSL.check(source)` returns a plain array of `{ name, message, loc, frame }` — the shape
an editor wants.

---

## 11. The runtime

Everything a script can reach is injected into `createRuntime({ ... })`:

| Option | Purpose |
| :--- | :--- |
| `realms` | Named realms. `TWITCH` is registered by default. |
| `verbs` | Verb implementations, merged over `POST` / `REPLY`. |
| `constants` | What bare identifiers resolve to. |
| `clock` | `{ now, setTimeout, clearTimeout }` — the script's sense of time. |
| `wallClock` | `() => Number` — real elapsed time, for budgeting only. |
| `random` | `() => [0, 1)` — drives `any from`. |
| `logger` | `{ log, warn, error }`. |
| `limits` | `{ steps, wallMs }`. |

The injection is not ceremony. A fake clock and a seeded generator are what make
`await 15:00` and `any from ( ... )` assertable: the whole test suite runs under Node in
milliseconds, with no browser and no Twitch connection.

`TWITCH` ships as an in-memory stub. **`DISCORD` is deliberately unregistered** — the
extension has no Discord integration today, and the mockup's `using DISCORD/...` is
aspirational. A script naming an unregistered realm fails loudly rather than doing nothing
quietly. A host that implements Discord registers it and the same script starts working.

---

## 12. Limits

Budgets are **per turn**, not per script. A turn is one uninterrupted burst of work: a timer
tick, or the handling of one event.

Per-script budgeting would be wrong in both directions here — an event-driven script is meant
to run for days, so a whole-script budget would kill every healthy script, while still
allowing a tight loop inside a single handler to burn the entire allowance.

| Limit | Default | Checked at |
| :--- | :--- | :--- |
| `steps` | 100000 | every statement, loop iteration and range element |
| `wallMs` | 30000 | the same points, against `wallClock` |

Elapsed time is measured with `wallClock`, never with `clock`: `clock` is the script's own
sense of time, and a script that waits five minutes has not *executed* for five minutes.

---

## 13. The annotated example

```
// When any channel goes live... Defaults to Twitch if no realm is specified
await * with (#live is true)
    // # → this channel (same as `/`)
    // #prop → a property of this channel (same as `/#`)
    // /channel → the channel by the name "channel"
    // /channel#prop → a property of `channel`
    // [badge] → a badge on this channel
    // @user → a user named "user" on this channel (`#@user`)
    // .prop → property of parent `using` or `where` block

    // Watch Discord for announcement messages
    // Shadyhen's `Skyward Sanctuary/Announcements`
    using DISCORD/779741119520571456
        await (.sender is "streamcord") and ("twitch.tv" in .content)
            goto 1st <| .links where ("twitch.tv" in .href)
            // 1-index array access → 1st = 0, 2nd = 1, ..., -1st = last item, -2nd = second to last
            // accepts universal "th" suffix → 1th, 2th, 3th, etc.

    // Always do this for each live channel (`with #live is true → using *`)...
    using *
        await 15:00
            goto #
            await 5:00
                // Only send the message(s) on this channel...
                if #name is "ginger_enby"
                    POST `!lurk watching anime`
        // Do this for ALL messages received in the chat...
        await (.message is *)
            REPLY ``
            // Use with caution; if the message matches /^\s*$/, the message is NOT sent
        // Do this for ALL messages mentioning the user...
        await (USERNAME in .message) or (USERNAME in .mentions)
            if #name is "soulbewitch" and .sender is "Jjay_89"
                REPLY `what do you want now, ${ .sender }?`
        // Do this for commands seen in chat...
        await (.command is *)
            if .command is "gamble"
                REPLY any from (
                    `You lost. End of story :)`
                    // .. → exclusive = 1..9; ... → inclusive = 1..10
                    `Congration. You'd done it. +${ any from(1 .. 10) }`
                )
    using [moderator]
        await 5:00
            POST any from (
                `can I mod today?`
                `modCheck`
                `who needs ban?`
            )
    using [subscriber]
        await 5:00
            POST any from (
                `burger`
                `burrito`
                `chimichanga`
                `churro`
                `quessadilla`
                `taco`
            )
    using [vip]
        await 5:00
            POST any from (
                `!lurk`
                `!lurk + sound`
                `!lurk into the shadows`
                `!lurk watching tv`
                `${ #name } is stinky :P`
            )
    using [viewer] [everyone] [anyone] [all]
        await 5:00
            POST any from (
                `!lurk homework :P`
                `!lurk i sleep`
                `!lurk time to eat`
                `UwU mfs`
                `g'day chat`
                `i have risen`
            )
```

---

## 14. Changelog and open questions

### 14.1 Resolved in v2

Each entry keeps the title v1 filed it under.

- **No variables or assignment** — Resolved. `expr -> name` binds into the current scope and
  `expr => name` into the parent, which is what makes a binding visible to later siblings
  (§9.2). Assignment is an expression, so `await (5:00 -> wait_time)` both binds and awaits.
- **No `else` / `elif`** — Resolved by `when` (§6.7), which covers the chain shape *and* the
  switch shape with one keyword. `else`, `elif`, `elseif`, `switch`, `case` and `default`
  are now reserved solely to produce an error that points at `when`.
- **`where` as a statement** — Resolved by `with` as a block statement (§6.2), which
  branches on its expression's *result*: a boolean runs the block once, anything else
  iterates it.
- **Case-insensitive `is` is not configurable** — Resolved. Prefix an operand with `=` for
  an exact comparison: `is ='TeXt'` (§5.8). `is` additionally now rejects a template that
  still carries an interpolation.
- **Identifier resolution is flat** — Resolved for variables, which are scoped by lexical
  depth (§9.5). Host constants remain one flat namespace, which is correct: they are the
  host's, not the script's.
- **No `Identifier` in the original node inventory** — Resolved without a sigil. A variable
  is told from a constant by its *shape*: a variable name must contain an interior
  underscore (§9.3). `mod_msg` is a name, `USERNAME` is a constant, and the rule is checked
  only where a name is created.
- **No escape syntax inside templates for `${`** — Resolved. An **unterminated** `${` is
  literal text; a **matched** one is still an interpolation, and still an error if its
  contents are ungrammatical (§3.2). The escape idiom is `${ "${x}" }`.
- **No block comments** — Resolved. `/* ... */` may span lines (§2.4). One that owns its
  whole line is consumed before indentation is measured, so it cannot shift the indent stack.

New in v2, with no v1 entry to answer to:

- **Permissions** — A `using` header may grant `+name` or `+name:sub`. Grants accumulate
  downward and match **exactly**: `+eval` does not grant `eval:calc`, and `+eval:calc` does
  not grant `eval` (§6.8).
- **The `%` operator** — Trims, then replaces runs of named character classes; joins a list
  instead (§5.9). A bare `%` means `%n%s`.
- **`|` as a `where` alias** — Same token type, so precedence and AST shape cannot drift
  (§5.10). Likewise `of` for `<|`, which v1 documented but never implemented.
- **Host JavaScript calls** — `&Date.now()` walks a host-supplied binding table. Property
  lookup and call, never code from text; nothing registered by default (§5.12).
- **Single-quoted strings** — `'text'` is the same literal as `"text"` (§3.1).
- **Optional commas** — Ignorable separators inside lists, `using` headers and `&Path.fn(...)` argument
  lists; never meaningful between statements (§2.6).
- **Subject aliases** — `_`, `__this__`, `__self__` and `__me__` name the current subject
  (§5.7).
- **The fourth job of `:`** — A bare `:` is a `when` case label, so the tokenizer no longer
  refuses it; the parser owns the diagnostic (§5.11). This is the only v1 behaviour v2
  changed.

### 14.1a Changed in v2.1

From writing `realistic.ttv` and ranking what fought back:

- **`->` vs `=>` needed the scope tree in your head** — Resolved. They are synonyms; a
  per-script `+scope:local|global|universal` decides where both bind, defaulting to
  `global` (§9.2).
- **`=>` forced a do-nothing wrapper `using *`** — Resolved by the same change: `global` at
  the top level binds into slot 0, so there is always somewhere to write.
- **No comparison operators** — Resolved. `is above`, `is below`, `is or above`,
  `is or below`, over numbers and number-likes; anything unreadable is `NaN`, and `NaN` is
  always false (§5.4).
- **`.prop` read one level** — Resolved. A glued `.name` reads a property off any
  expression: `.raider.last.category` (§5.13).
- **`when true` as `else`** — Resolved. `else` is a keyword (§6.7), and `else if <test>` is
  accepted as a spelling of `when <test>`. `else when` is an error.
- **`* from ( ... )`** — New. Another spelling of `any from`: `*` is `ANYTHING`, so "anything
  from" reads the same (§8).
- **"Did they pass an argument?" was `is *`** — Resolved. `*` is `ANYTHING`; `SOMETHING` and
  `NOTHING` join it (§3.7). **Behaviour change:** `*` now matches `""` and `[]`.
- **Bare `%` missed a lone `\n`** — Resolved. A bare `%` matches `\s*\n\s*` (§5.9).
  **Behaviour change.**
- **`<badge>` became `[badge]`**, with `[a b]` meaning "any of these" and resolving once;
  **`:emote:` became plain text**, `'kappa'`; and **`$:Path.fn()` became `&Path.fn()`**
  (§4, §5.12). Every old spelling is a lexical error that names the new one.
- **`-- "description"` on a `using` header** — New (§6.3).
- **`using [badge]` rebound the subject to the badge** — Resolved. A badge is a gate; the
  body runs under the unchanged subject (§6.3). **Behaviour change.**
- **Nested `await`s re-installed on every firing** — Resolved. A nested `await` installs once
  per site, and an enclosing `with (…)` stays in force for it: `await * with (#live is true)`
  means "while live" (§6.1). **Behaviour change.**
- **An unknown realm broke its whole enclosing body** — Resolved. It now fails only its own
  block (§4).
- **One-shot timers** — Resolved by `after` (§6.9).
- **Durations printed as milliseconds** — Resolved by the `~` format operator (§5.14).
- **No arithmetic** — Resolved by `calc( ... )` (§5.15), gated on `eval:calc`.
- **No way to share a list between blocks** — Resolved: a multi-item group is a list, and
  `any from` takes any value (§8).
- **Host calls could not stand alone** — Resolved: a line may be a host call, for calls made
  for their effect (§6.6).
- **Permissions are a fixed list** with `action:resource.part` names and an explicit
  one-level `.*`; unknown grants fail at compile time, and `write`/`eval` grants need a
  `-- "description"` (§6.8). **Behaviour change:** `+a:b:c` and off-list names are errors.
- **Granting a permission forced a subject scope** — Resolved. A `using` may carry grants
  or `+scope` and no subject (§6.3).

### 14.2 Still open

- **No user-defined functions.** Variables (§9.2) name a *value* — including a list (§8) —
  not a procedure.
- **No loops.** `await` is still the only repetition, and it is driven by time or events.
- **DISCORD is unimplemented.** `idea.ttv` uses it; the runtime does not register it. A
  script naming it has that one block skipped, with one error reported (§4).
- **The host.** `HOST.md` specifies it; the extension, being rewritten, does not implement it
  yet.

Settled, and recorded so they are not reopened by accident:

- **`+` and `?` are reserved** for a later, distinct use. They will not become shorthands for
  `SOMETHING` / `NOTHING`.
- **Error recovery stays per line.** A fault inside a long `any from` reports that fault and
  discards the construct; the author is told exactly what was wrong, and that is the point.
Not open, but easy to mistake for a bug, so recorded here too: **`where` and `|` bind
tighter than `is`/`in`**, so a filter whose predicate contains a comparison must be
parenthesized — `.links | ("twitch.tv" in .href)`. That is the canonical spelling and a
settled rule (§5.2), not a defect awaiting a fix.

---

## 15. Integration

The host contract — options, realms, events, verbs, host calls, permission prompts — is
**`HOST.md`**. This section keeps only the extension-specific wiring notes. `fake-page.js`
and `playground.html` are a working host to compare against.

### 15.1 `manifest.json`

The DSL files must load **in dependency order**, before any script that calls into them, and
`index.js` must come last. In the content-script entry that already lists `ext/*.js`, the
`js` array gains, immediately before the first file that uses the DSL:

```json
"dsl/errors.js", "dsl/tokens.js", "dsl/tokenizer.js", "dsl/ast.js", "dsl/parser.js", "dsl/runtime.js", "dsl/compiler.js", "dsl/index.js"
```

(`fake-page.js` is for tests and the playground; the extension does not load it.)

No new permission is required. The compiler emits closures, never source text, so no
`unsafe-eval` relaxation of `content_security_policy` is needed.

### 15.2 `settings.html`

The editor hook is a `<textarea>` plus a diagnostics panel:

1. Add a `<textarea id="dsl-editor">` in a new settings section.
2. On `input` (debounced), call `TTV_DSL.check(textarea.value)`.
3. Render each returned `{ message, loc, frame }` into the panel; `loc.line` / `loc.column`
   place the marker, and `frame` is a ready-made monospace excerpt.
4. Persist the script text through the extension's existing settings storage, under a key
   such as `dslScript`.

Locations are already threaded through the tokenizer, the parser and template interpolations
precisely so this step needs no changes to `dsl/`.

### 15.3 Host wiring

See `HOST.md` for the full contract. In outline, the content script supplies:

```js
let runtime = TTV_DSL.createRuntime({
    realms: { TWITCH: /* an adapter over the real channel/chat state */ },
    verbs: { POST: /* send to chat */, REPLY: /* send a reply */ },
    constants: { USERNAME: window.USERNAME },

    // Nothing here is registered by default. A script naming a path the host has not
    // published fails loudly rather than silently acquiring the capability (§5.12).
    jsBindings: { Date: { now: () => Date.now() } },
    jsPermissions: { 'Date.now': 'read:datetime' },
});

let context = await TTV_DSL.run(scriptText, runtime);
// ... and `context.stop()` on teardown.
```

Chat messages are delivered with `runtime.dispatch(event)`; every live `await` sees them.

### 15.4 Tests

`node dsl/tests/run.js` runs the suite under Node. `dsl/tests/index.html` runs the same suite
in a browser with plain `<script>` tags. Neither requires a build step or `node_modules`.

### 15.5 Playground

`dsl/playground.html` is an editor with highlighting and live diagnostics, the permission
report from `TTV_DSL.grants`, a fake clock, a fake channel, an event composer and a fake page
for `&Html.*`. Browsers refuse `<script src>` over `file://` in some configurations; any
static server works, e.g. `python -m http.server --directory ttv-tools/dsl`.
