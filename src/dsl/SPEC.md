# TTV DSL — Language Specification

**Language version 2.1.** TTV DSL is the script language of the **TTV Tools** browser
extension. A script tells the extension what to do in Twitch chat: "every five minutes, post
one of these lines", or "when someone types `!hello`, say hi back". You do not need to know
JavaScript to write one.

This document has three parts:

- **[Part 1 — Learn](#part-1--learn)** teaches the language. Read it from top to bottom.
- **[Part 2 — Reference](#part-2--reference)** lists every rule. Look things up here.
- **[Part 3 — A full example](#part-3--a-full-example)** shows a long script with notes.

Other files in this folder:

| File | For | Holds |
| :--- | :--- | :--- |
| `HOST.md` | people who build a host (the program that runs scripts) | events, realms, verbs, host calls, the permission prompt, the editor tools |
| `SPEC-notes.md` | people who work on the language | why the rules are what they are, how the parts are built, the version history |
| `GRAMMAR.ebnf` | tool builders | the formal grammar |
| `examples/` | everyone | working scripts with tests |

Script files end in `.ttv`.

---

# Part 1 — Learn

## 1. What a script is

A script is a list of **things to do when something happens**. Something happens when a
chat message arrives, when a command like `!hello` is typed, when a raid comes in, or when
some time has passed. The thing to do is usually to post a message.

A script does **not** do these things:

- **It is not for general programming.** It has functions and loops, but they exist to keep
  chat scripts short. Each burst of work has a size limit (§11).
- **It does not remember anything between runs.** When the script stops, its names and
  values are gone.
- **It is not a security wall.** Permissions (§10) let a viewer see and refuse what a shared
  script asks for. The language never runs text as code. But the limits exist to catch
  mistakes, not attackers. The host decides what it exposes.

### Words used in this document

| Word | Meaning |
| :--- | :--- |
| **statement** | one instruction. A statement takes one line. |
| **block** | the indented lines under a statement. They belong to that statement. |
| **event** | something that happened: a chat message, a command, a raid. |
| **handler** | a block that runs each time its event happens. |
| **subject** | the thing a block is about — for example, the chat message being handled. |
| **property** | a named value on a subject, like a message's `sender`. |
| **verb** | an ALL-CAPS command that does something, like `POST`. |
| **host** | the program that runs the script. Here, that is TTV Tools. |
| **grant** | a permission a script asks for, like `+read:datetime`. |
| **turn** | one burst of work: one timer tick, or the handling of one event. |

## 2. Your first script

```ttv
plugin hello -- "Hello"
    about "Says hi back when someone types !hello."

await (.command is "hello")
    REPLY `Hi, ${ .sender }!`
```

Line by line:

1. `plugin hello -- "Hello"` gives the script an id (`hello`) and a name people see
   (`Hello`).
2. `about "..."` is the text shown under the script's on/off switch in Settings.
3. `await (.command is "hello")` waits for an event. The test in the parentheses must be true.
   `.command` reads the `command` property of the event. For `!hello`, the command is
   `"hello"`.
4. `REPLY` answers the person who sent the command. The text is in backticks. `${ .sender }`
   puts the sender's name into the text.

In TTV Tools, add the script under **User Scripts** in Settings, then turn it on. A new script
is off until you turn it on.

Now add a timer. `await` with a time instead of a test runs its block again and again:

```ttv
plugin hello -- "Hello"
    about "Says hi back, and reminds chat every 15 minutes."

await (.command is "hello")
    REPLY `Hi, ${ .sender }!`

await 15:00 with (#live is true)
    POST `Type !hello and I will say hi.`
```

`15:00` means 15 minutes. `with (#live is true)` adds a condition: only while the channel is
live. `#live` reads the `live` property of the channel. `POST` sends a message to the chat.

## 3. Core ideas

### 3.1 Lines and blocks

Each statement takes one line. To put statements **inside** another one, indent them. The
indented lines are a **block**:

```ttv
await (.command is "dice")
    REPLY `You rolled a ${ any from (1 ... 6) }`
    POST `Good luck!`
```

Both lines run each time someone types `!dice`. Indent with spaces or with tabs, but do not
mix them on one line.

### 3.2 Waiting with `await`

`await` sets up a handler and moves on at once. The lines after it set up their handlers too.
Nothing waits in line.

- `await 5:00` runs its block every 5 minutes.
- `await (<test>)` runs its block every time an event makes the test true.
- `await *` runs its block for every event.

### 3.3 The subject, and `.prop`

Inside a handler, the **subject** is the event. `.name` reads a property of the subject:

| You write | You get |
| :--- | :--- |
| `.message` | the text of the chat message |
| `.sender` | who sent it (their login name) |
| `.command` | the command, without the `!` and in lower case: `"hello"` |
| `.argument` | the rest of a command line: for `!so zip`, `"zip"` |
| `.raider` | who raided |

Section 6.2 lists every event and its properties.

### 3.4 The channel, and `#prop`

`#` is the channel the script runs on. `#name` reads a property of the channel: `#live`,
`#title`, `#game`, `#viewers`. Section 6.2 lists them.

### 3.5 Messages

Write a message in backticks: `` `hello` ``. Inside it, `${ ... }` puts a value into the
text. A message may take several lines.

You can also write text in quotes, `"hello"` or `'hello'`. Quoted text takes one line and
cannot hold `${ ... }`.

### 3.6 Doing things: verbs

A **verb** is an ALL-CAPS word at the start of a line:

- `POST <message>` sends the message to the channel's chat.
- `REPLY <message>` answers the person who sent the event.

A message with no visible text is not sent.

### 3.7 Making choices

```ttv
await (.command is "hug")
    if .argument is SOMETHING
        POST `${ .sender } hugs ${ .argument }`
    else
        REPLY `Who do you want to hug?`
```

`SOMETHING` means "a value that is not empty". A bare `!hug` has an empty argument, so the
`else` block runs.

To pick by value, use `when`:

```ttv
await (.command is SOMETHING)
    when .command is
        "game":
            REPLY `We are playing ${ #game }`
        "title":
            REPLY #title
```

### 3.8 Names

`->` gives a value a name. You can read the name later:

```ttv
await (.command is "hello")
    .sender -> last_greeted

await (.command is "who")
    REPLY `The last person I greeted was ${ last_greeted }.`
```

A name must have at least one lower-case letter. ALL-CAPS words belong to the host and to
your verbs.

### 3.9 Asking permission

Some things need a **grant**. A grant goes on a `using` line, with a description that says
why:

```ttv
using +read:datetime -- "Tells chat the time"
    await (.command is "time")
        REPLY `It is ${ &datetime.time() }`
```

`&datetime.time()` calls the host to get the time. The viewer can see what each script asks
for before turning it on.

### 3.10 Where to go next

- More examples: `examples/` and the wiki page *TTV DSL Examples*.
- Every rule: Part 2.

---

# Part 2 — Reference

## 4. Layout · How lines work

### 4.1 Indentation · Blocks

A line that is indented more than the line before it starts a block. A line that is indented
less ends one or more blocks. It must line up exactly with an enclosing level:

```text
await *
        POST `x`
    POST `y`        <- error: this line matches no enclosing block
```

There is no limit on how deep blocks go, other than the step budget (§11).

Any statement that can have a block may leave it out, **except** `if`, `when` and `with`.
Those three need a block. Without one, the script does not start.

### 4.2 Tabs and spaces

Leading whitespace may be tabs or spaces, but **not both on the same line**. Mixing them on
one line is an error. The check is per line, so a file could use tabs in one place and
spaces in another (but it should not).

### 4.3 Lines and brackets

A statement ends at the end of its line.

Inside brackets `( ... )`, the end of a line still separates items (see `any from`, §5.11).
Indentation inside brackets does not matter, so you may indent continuation lines freely.

Blank lines and lines that hold only a comment are ignored, however they are indented.

An unclosed `(` at the end of the file is an error.

### 4.4 Comments

`//` starts a comment that runs to the end of the line. `/* ... */` is a block comment and
may span lines. An unclosed `/*` is an error.

A block comment may sit before code on a line, and the line's indentation still counts:

```ttv
await 5:00
    /* note */ POST `hi`
```

### 4.5 Commas

A comma is an **optional** separator. You may use commas, or leave them out, in these
places:

- between items in `any from ( ... )` and in lists,
- in a `using` line,
- between the arguments of a host call `&path.fn( ... )`.

Commas at the start, at the end, or twice in a row are ignored:

```ttv
POST any from (
    , `burger`
    , `burrito`
    ,
)
```

Commas do **not** replace line breaks. Two items on one line are still two items. Between
statements, a comma is an error: a stray `,` on its own line does not start the script.

Function calls are different: their arguments are separated by commas (§8.11).

## 5. Values · What you can write

### 5.1 Strings · Quoted text

Write a string in double or single quotes: `"streamcord"` or `'streamcord'`. Both mean the
same. A string takes one line; a line break inside a string is an error.

Escapes start with a backslash:

| Escape | Means |
| :--- | :--- |
| `\n` `\r` `\t` | line feed, carriage return, tab |
| `\b` `\f` `\v` `\0` | backspace, form feed, vertical tab, null |
| `é` | the character with that code: exactly four hex digits |
| `\u{1F49C}` | the character with that code: one to six hex digits, up to `10FFFF` |
| `\` + any other character | that character: `\"`, `\'`, `\\` |

Any other text after `\u` is an error. The same escapes work in templates.

### 5.2 Templates · Messages

A **template** is text in backticks. It is the normal way to write a message:

```ttv
await (.message is SOMETHING)
    REPLY `what do you want now, ${ .sender }?`
```

- `${ ... }` puts the value of an expression into the text.
- A `{` or `}` without a `$` before it is plain text. So is a `$` without a `{` after it:
  `` `a { plain } brace, 100$ and a }` ``.
- A template may span lines.
- Templates may nest: a `${ }` may hold a template, which may hold another `${ }`.
- An error inside `${ ... }` is reported at its real line and column.

**A `${` with no `}` anywhere after it is plain text.** `` `cost: ${ dollars` `` is an
ordinary message. But if a `}` comes later in the script, even in another template, that `}`
closes the `${`. So write a lone `${` only near the end of a script, or use the string trick
below.

**A `${` with a matching `}` is always code.** If the code inside is wrong, that is an
error. To write the characters `${x}` in a message, put them in a string inside the
interpolation:

```ttv
POST `${ "${whatever}" }`
```

If a quote inside `${ ... }` never closes before the end, the `${` is read as plain text, not
as an unclosed string.

### 5.3 Numbers

Whole numbers and decimals: `42`, `3.5`. A decimal needs a digit after the dot. That is
why `1..9` is the range from 1 to 9, not a number.

### 5.4 Durations · Lengths of time

Write a length of time as `mm:ss` or `hh:mm:ss`:

| You write | Means |
| :--- | :--- |
| `0:30` | 30 seconds |
| `5:00` | 5 minutes |
| `15:00` | 15 minutes |
| `1:30:00` | 1 hour 30 minutes |

The minutes and seconds must be two digits, from `00` to `59`. A duration's value is a number
of milliseconds.

Where a duration is read from a value instead of written out — for example, a setting or a
string — short forms also work: `90s`, `5m`, `2h`, `3d`.

### 5.5 Ordinals · Positions

An **ordinal** names a position in a list. Counting starts at `1st`:

| You write | Means |
| :--- | :--- |
| `1st` | the first item |
| `2nd` | the second item |
| `3rd` | the third item |
| `10th` | the tenth item |
| `-1st` | the last item |
| `-2nd` | the second to last item |

The `th` ending works for every number: `1th`, `2th` and `3th` mean the same as `1st`, `2nd`
and `3rd`. Only the digits matter.

The `-` in `-1st` is part of the ordinal. Without the ending, `-1` is minus one.

### 5.6 Booleans

`true` and `false`.

### 5.7 Presence words · Is there a value?

Three words ask whether a value is there:

| Word | `x is <word>` is true when `x` is… |
| :--- | :--- |
| `ANYTHING` (also written `*`) | any value at all, including `""` (empty text) and `[]` (an empty list). Only a missing value fails. |
| `SOMETHING` | there, **and** not `""` or `[]`. |
| `NOTHING` | missing, `""`, or `[]`. |

The difference between `ANYTHING` and `SOMETHING` matters. Twitch sends a bare `!so` with an
**empty** argument. So `.argument is *` is true for it: something *was* sent, but it is empty.
To ask "did they give a name?", write `.argument is SOMETHING`.

These words work with `is`, with `in`, with `=` (§7.6) and as `when` labels. A host constant
cannot replace them. As a yes/no value, `ANYTHING` and `SOMETHING` are true and `NOTHING` is
false.

### 5.8 The wildcard `*`

Outside `calc( ... )`, `*` is **always** the wildcard. It means `ANYTHING`:

- `.message is *` — there is a message.
- `await *` — any event at all.
- `using *` — whatever is already in scope (§8.4).
- `* from ( ... )` — the same as `any from ( ... )` (§5.11).

Because of this, `*` is never multiplication outside `calc( ... )`. `2 * 3` is three separate
values, not six. To multiply, use `calc(2 * 3)` (§7.12).

### 5.9 Lists

Parentheses holding **two or more** items make a list. Separate the items by line breaks or
by commas:

```ttv
(`hi`, `hey`, `hello there`) -> greet_list

await (.message is SOMETHING)
    REPLY any from greet_list
```

Parentheses holding one item are just grouping: `(5)` is `5`.

A range inside a list adds all of its members: `(1 ... 3, 9)` is `1, 2, 3, 9`.

### 5.10 Ranges

`..` leaves out the last number. `...` keeps it:

| You write | Members |
| :--- | :--- |
| `1 .. 10` | 1, 2, 3, 4, 5, 6, 7, 8, 9 |
| `1 ... 10` | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 |

A range from a bigger number to a smaller one counts down. Each member costs one step of the
budget (§11), so a huge range stops with a limit error instead of freezing.

### 5.11 `any from` · A random pick

`any from ( ... )` picks one item at random:

```ttv
POST any from (
    `burger`
    `burrito`
    `taco` `tortilla`
)
```

- Items are separated by line breaks or spaces. Commas are optional. The last line above
  holds two items.
- Blank lines and comment lines between items are ignored, so a comment can explain a choice.
- A range adds all of its members, so `any from (1 .. 10)` picks a number from 1 to 9.
- `any from` may pick from any value, not only from parentheses: `any from greet_list`.
- `* from` means the same as `any from`. A `*` means `* from` only when `from` comes right
  after it.
- An empty `any from ()` is an error.

## 6. Names · What you can read

### 6.1 Selectors · Pointing at things

A **selector** points at a channel, a user, a badge or a property:

| You write | Example | Points at |
| :--- | :--- | :--- |
| `#` | `#` | the channel in scope |
| `#prop` | `#name`, `#live` | a property of the channel in scope |
| `/channel` | `/ginger_enby` | the channel with that name |
| `/channel#prop` | `/ginger_enby#live` | a property of that channel |
| `REALM/path` | `DISCORD/779741119520571456` | something in another service (a **realm**) |
| `[badge]` | `[moderator]`, `[vip moderator]` | a badge, if the subject holds one of those listed |
| `@user` | `@ephellon` | a user in the channel in scope |
| `.prop` | `.sender`, `.href` | a property of the current subject (§9) |

Rules:

- A bare `/` means the same as a bare `#`: the channel in scope.
- `/channel#prop` must be written with **no space**. With a space, `/ginger_enby #name` is
  two selectors.
- `@user` means the same as `#@user`.
- **Realms.** The realm name is ALL-CAPS and is followed by `/` with no space. `TWITCH` is the
  default realm. A comment after a realm name, such as `TWITCH// note`, is a comment, not a
  path.
- **An unknown realm stops only its own block.** The error is reported once. That block does
  nothing, and every other block still runs. TTV Tools has no `DISCORD` realm today.
- **Badges.** Several names in one bracket, like `[vip moderator]`, mean "any of these". They
  match **once**, for the first one held. Commas between them are optional. The list must be
  on one line, and `[]` is an error.
- Separate brackets, like `[vip] [moderator]`, are separate subjects (§8.4).
- A badge is looked up on the nearest subject that has badges. A chat message has the
  sender's badges. If no subject has badges, the channel's badges are used: these are the
  viewer's own badges in that channel. Inside `await * with (...)` the subject is an event
  without badges, so `using [moderator]` there asks about the channel.
- **Emotes are plain text.** Write `'kappa'`. `:kappa:` is an error that says so.
- Old spellings are errors that name the new one: `<badge>` and `--badge` (now `[badge]`),
  `:emote:` (now `'emote'`), `$:Path.fn()` (now `&Path.fn()`).

### 6.2 Events and channels in TTV Tools

What an event carries:

| Event | Properties |
| :--- | :--- |
| chat message | `message`, `sender`, `badges` (a list), `mentions` (a list), `links` (a list of `{ href, text }`) |
| chat command (`!so zip`) | everything a chat message has, plus `command` (`"so"`: no `!`, lower case) and `argument` (`"zip"`, or `""` when there is none) |
| raid | `raider`, `raid_size` (a number) |

`sender`, `mentions` and `raider` are login names in lower case.

A property that does not apply is **missing**, not empty. This matters: `ANYTHING` matches
an empty `""`, but nothing matches a missing value (§5.7).

What a channel carries: `#name`, `#live` (true or false), `#title`, `#game`, `#viewers`,
`#uptime` (a duration). A host may add more; see `HOST.md`.

### 6.3 Properties · `.prop` and `.a.b`

`.name` reads a property of the current subject (§9). If the subject has no such property,
the value is empty. That is not an error.

A `.name` written **right after** a value, with no space, reads a property of that value.
This is for values that hold other values. In TTV Tools, `.raider` is only a name, but a host
could send a raid with more inside it:

```ttv
await (.raider is SOMETHING)
    POST `${ .raider.name } was playing ${ .raider.last.category }`
    .raider -> raid_info
    POST `${ raid_info.name }`
```

- This works after anything: `.prop`, `#prop`, a name, a host call, or parentheses.
- If any link in the chain is missing, the value is empty. It is never an error.
- The properties `constructor`, `prototype` and `__proto__` can never be read.
- **No space.** `.raider .name` is two separate subjects. That is what lets `using .a .b`
  mean "each of these".

### 6.4 Constants · The host's names

A bare word that is not a keyword is a **constant**: a value the host gives the script.
TTV Tools gives `USERNAME`, the signed-in viewer's login name in lower case. Reading a
constant the host does not have is an error.

### 6.5 Variables · Your names

`->` gives a value a name (§8.10). Rules for the name:

- **It needs at least one lower-case letter.** `clkFmt`, `mils`, `x` and `mod_msg` are names.
  `USERNAME` and `CLKFMT` are not. Binding an ALL-CAPS name is an error.
- The same rule applies to function parameters (§8.11) and loop labels (§8.12).
- ALL-CAPS words belong to the host's constants and verbs, and to your own functions.

Reading a name:

- A name with a lower-case letter is looked up as your variable first, then as a host
  constant.
- An ALL-CAPS name is a host constant, or a call to a function.
- **Reading a variable that was never set gives an empty value. It is not an error.** This
  matches `.prop` on a subject without that property. It also matters for timing: a line
  after an `await` runs before the handler ever fires, so it must still work.
- A misspelled **constant** is still an error, because the language can tell the two apart.

### 6.6 Subject words · `_`, `__this__`, `__self__`, `__me__`

All four words mean the current subject itself — the thing `.prop` reads from:

```ttv
await *
    POST `${ .name } is the same as ${ __this__.name }`
```

Inside a `where` filter, they mean the item being tested, as `.href` would. They are
**read-only**: you cannot give a value one of these names.

### 6.7 Settings · `setting.name`

`setting.<name>` reads a setting from the script's `plugin` header (§8.13). The value is what
the viewer chose, or the declared default. Settings are **read-only**.

- Reading a setting the header does not declare is an error before the script starts. The
  message names the settings that exist.
- `setting` is a keyword. `setting` alone, or `setting` as a name to bind, is an error.

## 7. Operators · Comparing and changing values

### 7.1 Order · Which operator goes first

From loosest (applied last) to tightest (applied first):

| Order | Operators | Meaning | Chains? |
| :--- | :--- | :--- | :--- |
| 1 (loosest) | `->`, `=>` | give a name (§8.10) | no |
| 2 | `or` | either is true | yes, left to right |
| 3 | `and` | both are true | yes, left to right |
| 4 | `is`, `in`, `is [or] above` / `below` | compare (§7.2–§7.5) | **no** |
| 5 | `%`, `~` / `as` | clean up text (§7.10), format (§7.11) | yes, left to right |
| 6 | `of`, `<\|` | pick from a list (§7.9) | yes, left to right |
| 7 | `where`, `\|` | filter a list (§7.8) | yes, left to right |
| 8 | `..`, `...` | range (§5.10) | no |
| 9 | `not`, `-`, `=` | in front of one value: not, minus, exact (§7.6) | — |
| 10 (tightest) | `#prop`, `.a.b`, other selectors | read a property | — |

Arithmetic is not in this table. It works only inside `calc( ... )` (§7.12). Outside it,
`+`, `*`, `/` and `%` are not arithmetic.

### 7.2 `is` · Equal

`a is b` is true when the values are equal.

- **Text compares without case.** `.sender is "Jjay_89"` matches `jjay_89`. On Twitch, the
  names you compare (channels, users, commands) ignore case anyway.
- Objects are equal when they are the same object, or have the same `name`.
- A presence word on the right (`*`, `ANYTHING`, `SOMETHING`, `NOTHING`) asks the presence
  question instead (§5.7).
- The right side of `is` may not be a template with `${ }` in it. Compare against a string,
  or give the template a name first.

### 7.3 `in` · Contains

`a in b` is true when `b` holds `a`:

- If `b` is text, `a` is part of it (without case): `"twitch.tv" in .href`.
- If `b` is a list, one of its items equals `a`: `"moderator" in .badges`.
- If `b` is an object, it has a property named `a`.

### 7.4 `above` and `below` · Bigger and smaller

```ttv
await (.raider is SOMETHING)
    if .raid_size is above 50          // more than 50
        POST `huge raid!`
    if .raid_size is below 50          // less than 50
        POST `welcome in!`
    if .raid_size is or above 50       // 50 or more
        POST `50 or more`
    if .raid_size is or below 50       // 50 or less
        POST `50 or less`
```

- `above` and `below` come only after `is` or `is or`. `.size above 50` is an error that says
  the `is` is missing.
- Plain `a or b` still means "either".
- These comparisons have the same order as `is`, and also do not chain.

Both sides are read as numbers:

- A number is itself. A duration (`1:00`) is its milliseconds.
- Text is read as a number, then as a duration: `"61000"`, `"0:30"`, `"90s"`.
- Anything else — missing, `true`/`false`, a list, unreadable text — is **not a number**.

A comparison with "not a number" on either side is **false**. It is not an error.

### 7.5 One comparison at a time

`a is b is c` is an error. Use parentheses to say which comparison comes first:

```text
await (.a is .b) is .c      // allowed
await .a is .b is .c        // error
```

### 7.6 `=` · Exact text

`is` and `in` ignore case. Put `=` in front of either value to make the comparison exact:

```ttv
await (.message is 'HELP')      // matches "help", "Help", "HELP"
    REPLY `case does not matter`
await (.message is ='HELP')     // matches "HELP" only
    REPLY `you shouted`
```

- `=` goes in front of a **value**. It is not an operator between two values, and it is not
  another way to write `is`.
- It works on any value: `is ='TeXt'`, `is =.property`, `is =name`.
- It works with `in` and with `when` labels.
- One `=` is enough. `=a is b` and `a is =b` are the same exact comparison.

### 7.7 `and`, `or`, `not` · Combining tests

`a and b` is true when both are true. `a or b` is true when either is true. `not a` is true
when `a` is false.

**What counts as false:** `false`, an empty list, `""`, `0`, and a missing value. Everything
else is true. `*`, `ANYTHING` and `SOMETHING` are always true. `NOTHING` is always false.

### 7.8 `where` and `|` · Filter a list

`list where (<test>)` keeps the items for which the test is true. `|` is a short way to write
`where`. They are the same in every way.

Inside the test, the subject is the **item** being tested. So `.href` reads each link's
`href`:

```text
.links | ("twitch.tv" in .href)       // the links that point to twitch.tv
.links where ("twitch.tv" in .href)   // the same
```

**Put the test in parentheses when it holds `is` or `in`.** `where` goes before `is` and `in`
(§7.1). Without parentheses, the comparison takes the filter instead:

```text
.links | "twitch.tv" in .href         // means (.links | "twitch.tv") in .href — wrong
```

**`where` filters a list. It does not add a condition to a yes/no test.** If the left side is a
comparison (`is`, `in`, `above`, …), `and`, `or`, `not`, `true` or `false`, that is an error.
The message names the fix:

```ttv
await (.command is "so") with ("moderator" in .badges)     // a condition on the await
    POST `ok`
await (.command is "so") and ("moderator" in .badges)      // or one combined test
    POST `ok`
```

### 7.9 `of` and `<|` · Pick from a list

`<ordinal> of <list>` picks one item. `<|` is a short way to write `of`:

```ttv
await (.links is SOMETHING)
    goto 1st of .links       // the first link
    goto -1st <| .links      // the last link
```

If the left side is not an ordinal, it is worked out with the list as its subject.

`where` goes before `of`. So this filters first, then picks:

```ttv
await (.links is SOMETHING)
    goto 1st of .links where ("twitch.tv" in .href)
```

It means "the first twitch.tv link", not "the first link, if it is a twitch.tv link".

### 7.10 `%` · Clean up text

`<value> % <replacement>` cleans up text.

**On a list**, `%` joins the items with the replacement between them: `.links % ', '`.

**On anything else**, the value becomes text and is **trimmed** (spaces at both ends are
removed). Then every run that matches the pattern is replaced:

```ttv
await (.command is "help")
    REPLY `
        help → this help message
        gamble → throw away all your monies
    ` % ' · '
```

This replies `help → this help message · gamble → throw away all your monies`.

**A bare `%` matches line breaks and the spaces around them.** It joins a block of lines into
one line. Spaces inside a line are kept.

**A pattern** is a run of `%` + letter pairs, written right after the `%`:

| Pattern | Matches | Like regex | Matches a position, not a character |
| :--- | :--- | :--- | :--- |
| `%0` | null | `\0` | no |
| `%a` | a letter | `[A-Za-z]` | no |
| `%A` | not a letter | `[^A-Za-z]` | no |
| `%b` | a word edge | `\b` | **yes** |
| `%B` | not a word edge | `\B` | **yes** |
| `%d` | a digit | `\d` | no |
| `%D` | not a digit | `\D` | no |
| `%f` | form feed | `\f` | no |
| `%n` | line feed | `\n` | no |
| `%r` | carriage return | `\r` | no |
| `%s` | whitespace | `\s` | no |
| `%S` | not whitespace | `\S` | no |
| `%t` | tab | `\t` | no |
| `%v` | vertical tab | `\v` | no |
| `%w` | a word character: a letter, a digit or `_` | `\w` | no |
| `%W` | not a word character | `\W` | no |
| `%c` | (trim first — always done anyway) | — | — |

- Pairs that are opposites: `%a`/`%A`, `%b`/`%B`, `%d`/`%D`, `%s`/`%S`, `%w`/`%W`.
- An unknown letter is an error when the line runs.
- Each letter matches **a run** of one or more characters. Letters join in order: `%d%s` is
  "digits, then whitespace" (`\d+\s+`). `%b` and `%B` match a position, so they match once.
- `%n%s` is "line feeds, then whitespace" (`\n+\s+`). A bare `%` is different: it is
  `\s*\n\s*`.
- **The whole match is replaced.** `%d%s` replaces the digits **and** the spaces. To keep the
  digits, use `%s`.
- **The trim always happens.** `%c` is allowed, but it changes nothing.
- **The replacement is used as written.** `%` adds no spaces of its own. Put any spaces you
  want in the replacement: `% ' · '`, not `% '·'`.

### 7.11 `~` and `as` · Format a duration

`<value> ~ <pattern>`, or `<value> as <pattern>`, turns a duration into text:

```ttv
5:00 -> wait_time
POST `waited ${ wait_time ~ "hh?:mm:ss" }`      // 05:00, or 01:05:00 after an hour
POST `waited ${ wait_time as "hh?:mm:ss" }`     // the same
```

`~` and `as` are the same operator.

| In the pattern | Means |
| :--- | :--- |
| `hh` `mm` `ss` | hours, minutes, seconds, with two digits |
| `h` `m` `s` | the same, with no extra zero |
| a unit and then `?` | leave out this unit, and the text right after it, when it is zero and every unit before it was left out |
| `'text'` | text, always — so in `m' min'` the `m` of `min` is not minutes |
| anything else | text |

- The **largest** unit in the pattern takes the overflow: `"mm:ss"` on 90 minutes is `90:00`.
- Seconds round down.
- The value is read as a number like `above` reads it (§7.4). A value that is not a number
  gives empty text.
- `~` has the same order as `%`, from left to right. So `~` formats what `of` picked, and a
  comparison sees the formatted text.
- Today `~` formats only durations. The pattern language leaves room for dates later.

### 7.12 `calc( ... )` · Arithmetic

Arithmetic works only inside `calc( ... )`:

```ttv
using +eval:calc -- "scales the shoutout to the raid"
    await (.raider is SOMETHING)
        POST `that's ${ calc(.raid_size * 2 + 1) } half-gremlins`
```

- Inside the parentheses, `+ - * / %` and `**` are arithmetic. They work as in JavaScript:
  `**` (power) goes first and groups from the right, then `* / %`, then `+ -`. `1 / 0` is
  `Infinity`.
- Outside `calc`, these characters keep their other meanings: `*` is the wildcard, `+` starts
  a grant, `%` cleans up text, and `/` names a channel.
- A value inside `calc` may be a number, a duration (its milliseconds), a name, `.prop`,
  `#prop`, a host call, or more parentheses. Values are read as numbers like `above` reads
  them (§7.4). A value that is not a number makes the whole result "not a number".
- A sign cannot be the base of `**`: `-2 ** 2` is an error. Write `(-2) ** 2` or `-(2 ** 2)`.
- `calc` needs the **`eval:calc`** grant, with a description (§10). Without the grant, the
  `calc` fails when it runs.
- A `-` between two values outside `calc` is an error that points to `calc`.
- A `+` that is not part of a grant is an error that says there is no arithmetic there.

### 7.13 `&path.fn()` · Host calls

`&path.fn( ... )` calls a function the **host** offers:

```ttv
using +read:datetime -- "reads the clock"
    await (.command is "time")
        REPLY `It's ${ &datetime.time() }`
```

- **With parentheses, it is a call. Without, it reads a value.** `&x.y( ... )` calls a
  function. `&x.y` reads a constant. Reading a function, or calling a constant, is an error.
  A script can never hold a function as a value.
- **Nothing is offered unless the host offers it.** A path the host does not offer is an
  error.
- **Every host call needs a grant.** The host says which grant each path needs. A missing
  grant is a permission error (§10).
- The path parts `__proto__`, `prototype` and `constructor` are always refused.
- Text never becomes code. A path is only looked up.

**In TTV Tools**, these host calls exist:

| Call | Gives | Grant |
| :--- | :--- | :--- |
| `&datetime.now()` | the time now, in milliseconds | `read:datetime` |
| `&datetime.time()` | the time now as text, like `9:41 PM` | `read:datetime` |

`HOST.md` §7 lists the calls a host may offer, such as `&html.*` for reading and changing the
page.

**Built-in calls (`eval:js`).** With the `eval:js` grant, a script can use the built-in
JavaScript objects `Math`, `Number`, `Date`, `JSON` and `Array`:

- Constants are read: `&Math.PI`. Functions are called: `&Math.max(1, 2)`, `&Date.now()`,
  `&JSON.parse(text)`, `&Array.from(list)`.
- Only the object's own static members work. Inherited members such as `toString` do not.
- These names are blocked: `prototype`, `constructor`, `length`, `name`, `caller`,
  `arguments`.
- `Array.from` and `Array.fromAsync` stop at 10,000 items.
- The host cannot add to, change or hide this set. `eval:js` never opens a host call.

## 8. Statements · What a line can do

### 8.1 `await` · Run on every event or tick

`await` sets up a handler that runs again and again. It does not stop the script: the lines
after it run at once, and set up their own handlers.

**With a duration**, the block runs each time that much time passes:

```ttv
await 5:00
    POST `modCheck`
```

**With a test**, the block runs each time an event makes the test true:

```ttv
await (.message is *)
    REPLY `heard you`
```

The test, and the block, see the **event** as the subject. So `.sender` in both means the
event's sender. The parentheses are optional: `await .message is SOMETHING` works too.

**An `await` inside a handler is set up only once.** The outer block runs every time it
fires. Its plain lines run every time. But an `await` inside it is set up the **first** time
it is reached, and never again:

```ttv
await 15:00
    goto #                   // every 15 minutes
    await 5:00               // set up on the first tick; then every 5 minutes
        POST `modCheck`
```

- When the inner handler runs, it sees the names the outer handler set on its **most recent**
  run.
- "Once" means once per place in the script **and** once per subject. An `await` inside
  `using [vip] [moderator]` is set up once for each of the two subjects. One inside
  `with (<list>)` is set up once per item.
- So the number of handlers is limited by the script's text, not by how long it runs.

**A `with (...)` filter on an outer `await` applies to everything inside it.** It is checked
again each time a handler inside it fires, against that handler's event:

```ttv
await * with (#live is true)
    await (.command is "help")
        REPLY `...`
```

This answers `!help` only **while** the channel is live. It stops when the stream ends, and
starts again when the stream comes back.

**The outer test is not checked again.** The test right after `await` says when the inner
handlers are set up, not when they may run:

```ttv
await (.command is "start")
    await (.message is SOMETHING)     // every message AFTER !start
        REPLY `...`
```

### 8.2 `after` · Run once, later

`after <duration>` waits **once**, then runs its block once:

```ttv
after 1:00
    POST `one minute in — say hi to chat`
```

- `await 1:00` repeats. `after 1:00` does not.
- The duration may be any value, such as a name: `after wait_time`. It is read when the line
  is reached. A value that is not a duration is an error when the line runs.
- `after ... with (<test>)` checks the test when the timer ends.
- Inside a handler, each run sets its own timer. `after 1:00` in a raid handler means "a
  minute after **each** raid". These timers cannot pile up: each one fires once and is done.
- An `await` inside an `after` is still set up only once (§8.1). A `with (...)` filter around
  the `after` must still be true when it fires.

### 8.3 `with` · A condition, or one run per item

`with` has two forms.

**On an `await` line**, `with` adds a condition. Both the `await` test and the `with` test must
be true:

```ttv
await * with (#live is true)
    POST `still live`
```

The parentheses are optional: `with #live is true` works the same.

**As a statement of its own**, `with (<value>)` opens a block:

```ttv
await (.sender is "streamcord")
    with (.links | ("twitch.tv" in .href))
        goto .href
```

What happens depends on the value:

- **`true` or `false`:** the block runs **once**, if the value is true. The subject does not
  change. `with (#live is true)` means the same as `using * where (#live is true)`.
- **Anything else** is treated as a list. The block runs **once per item**, and each item is
  the subject. So `.href` above reads the link's `href`. An empty list runs the block zero
  times.

A `with` statement without a block is an error.

### 8.4 `using` · Choose subjects and grants

`using` chooses one or more subjects, and runs its block once for each one that exists:

```ttv
using [viewer everyone anyone all]
    await 5:00
        POST `i have risen`
```

- A subject that does not exist adds no run. A badge the viewer does not hold, or a channel
  that does not exist, is skipped.
- Several selectors on one line are separate subjects: `using [vip] [moderator]` runs the
  block once for each badge held.
- One bracket with several badges means "any of these": the block runs once if any is held.
- `using *` uses whatever is already in scope. Under `await * with (#live is true)`, that is
  each live channel.
- Channels, realms and `*` change the subject for the block.

**A badge is a gate.** `using [moderator]` asks if the badge is held. If it is, the block runs
under the **same subject as before**. Inside `await (.command is ...)`, the `.command`,
`.argument` and `_` inside `using [moderator]` still read the message.

**A `using` line may have only grants**, or only `+scope` (§8.10). The block then runs once,
under the subject already in use:

```ttv
using +read:datetime
    await 30:00
        POST `it is ${ &datetime.time() }`
```

This gives a grant to one block without changing what `.prop` means there. A `using` with
nothing at all after it is an error.

**A `using` line may end with a description**: `--` and a quoted string. It says what the block
is for, and usually why it needs its grants:

```ttv
using +eval:calc -- "Needed for the raid-size based timer"
    await 5:00
        POST `${ calc(1 + 1) }`
```

- The host shows the description to the viewer, for example beside the permission question.
  It changes nothing when the script runs.
- It must be a plain quoted string, the **last** thing on the line, and there may be only
  one.
- A `using` line may hold only a description. That makes a labelled section.
- `--` anywhere else is an error. `--name` written together is the old badge spelling, and
  is an error.

Grants and subjects may come in any order on the line. Grants are explained in §10.

### 8.5 `if` · Run when a test is true

```ttv
using /ginger_enby
    if #name is "ginger_enby"
        POST `!lurk watching anime`
```

- `if` does **not** change the subject. `.prop` inside it reads what the enclosing `using`,
  `await`, `where` or `with` chose.
- `if` needs a block.
- More branches come after it, at the same indentation: `when <test>`, `else if <test>`, and
  last `else` (§8.6). There is no `elif`.

### 8.6 `when` and `else` · More branches

`when` has two forms. The difference is one fact: **does the line end with a comparison word
and nothing after it?**

**Pick by value.** `when <value> is` with nothing after `is`, then indented `<label>:` lines,
each with its own block:

```ttv
await (.command is SOMETHING)
    when .command is
        "help":
            REPLY `try: help, gamble, whoami`

        "gamble":
            REPLY `you lost`

        *:
            REPLY `no idea what that is`
```

- The value after `when` is worked out once.
- Each label is compared with it, using the word from the `when` line: `is` (equal, §7.2) or
  `in` (contains, §7.3). The **first** label that matches runs. At most one block runs.
- Labels may be strings, templates, numbers, presence words, or `=`-exact values (§7.6).
- A `*` label matches any value that is there (§5.7). It does not match a missing value.
- For a block that runs when nothing matched — even a missing value — put `else` after the
  labels, at the same indentation as the `when`:

```ttv
await (.command is SOMETHING)
    when .command is
        "help":
            REPLY `try: help, gamble, whoami`
    else
        REPLY `no idea what that is`
```

**One more test.** `when <test>` with a block, right after an `if` or another `when`, at the
same indentation:

```ttv
await (.command is SOMETHING)
    if .command is "help"
        REPLY `help`
    when .command is "gamble"
        REPLY `gamble`
    else
        REPLY `something else`
```

- `else if <test>` means the same as `when <test>`. Other branches may follow it.
- `else` with a block comes **last**. It runs when every branch before it said no. A bare
  `else` takes no test.
- `else when` is an error: `when` already means "else if".
- Nothing may follow a bare `else` in the same chain, because it could never run.
- A `when <test>` or an `else` with no `if` or `when` before it is an error.

```ttv
await (.command is "so")
    .argument -> so_target
    if so_target is SOMETHING
        POST `everyone go follow @${ so_target }`
    else if last_raider is SOMETHING
        POST `go follow @${ last_raider }`
    else
        POST `give me a name`
```

Like `if`, `when` and `else` **do not change the subject.**

The words `elif`, `elseif`, `switch`, `case` and `default` are not part of the language.
Using one is an error that points to `when` and `else`:

```text
elif .a is "x"
→ `elif` is not a keyword in TTV DSL; use `when <test>` for the next condition, or `else` for the last one
```

### 8.7 `goto` · Go to a page

```ttv
await (.links is SOMETHING)
    goto 1st of .links where ("twitch.tv" in .href)

await 15:00
    goto #
```

`goto` asks the realm in scope to go to a channel or a link.

### 8.8 Verbs · `POST`, `REPLY`, and others

An ALL-CAPS word at the **start** of a line is a verb call. A value may follow it:

```ttv
await (.message is SOMETHING)
    POST `!lurk`
    REPLY `hi ${ .sender }`
```

- The same ALL-CAPS word inside an expression is a constant, not a verb. Position decides.
- `POST` and `REPLY` always exist. `POST` sends to the chat of the channel in scope. `REPLY`
  answers the sender of the event.
- A host may add more verbs. A verb the host does not have is an error when the line runs.
- **A message with no visible text is not sent.** If the text is empty or only spaces,
  nothing is sent. So `REPLY ""` does nothing, on purpose.

### 8.9 Lines that stand alone

Only these may be a line on their own:

- a verb call: `POST ...`,
- a call to your own function: `GREET .sender`,
- a name binding: `<value> -> name`,
- a host call: `&html.setText("#last-raid", .raider)`.

Any other value alone on a line is an error. A value nobody reads is almost always a
misspelled verb, so the language says so.

A host call alone on a line is for what it **does**, not what it returns:

```text
using +write:html.text -- "shows the last raider on the page"
    await (.raider is SOMETHING)
        &html.setText("#last-raid", .raider)
```

(TTV Tools does not offer `&html.*` today; `HOST.md` §7.1 describes it.)

### 8.10 `->` and `=>` · Give a value a name

`<value> -> name` gives a value a name. `=>` means exactly the same as `->`:

```ttv
`can I mod today?` -> mod_msg
`can I mod today?` => mod_msg     // the same
```

- A binding on its own line is a statement:

  ```ttv
  any from (
      `can I mod today?`
      "modCheck"
  ) -> mod_msg
  ```

- A binding is also a value: the value it bound. So it can go where a value goes:

  ```ttv
  await (5:00 -> wait_time)
      POST `waited ${ wait_time }`
  ```

  This is still a timer. The name is set once, when the timer is set up.
- A binding is the **loosest** operator (§7.1), and it does not chain: `a -> b -> c` is an
  error.
- Name rules are in §6.5.

**Who can read a name** is decided once for the whole script, by its **scope mode**:

| Mode | A name is visible to… |
| :--- | :--- |
| `+scope:local` | the block that set it, and the blocks inside that block |
| `+scope:global` (the default) | the same, **plus** the block's siblings and the blocks inside them |
| `+scope:universal` | every block in the script |

Blocks are **siblings** when they sit side by side at the same indentation. In the default
mode, siblings share names:

```ttv
await 1:00
    `checked in` -> shift_note

await 1:10
    POST `${ shift_note }`        // visible: the blocks are siblings
```

To choose another mode, put `+scope:<mode>` on a `using` at the top level. It applies to the
whole block under it:

```ttv
using +scope:local
    await 1:00
        `a` -> sib_note
    await 1:10
        POST `${ sib_note }`      // empty: `local` keeps the name in the first block
```

- A bare `+scope` means `+scope:global`. A script with no `+scope` is `global`.
- `+scope` is allowed **only** on a `using` at the top level. Deeper, it is an error. An
  unknown mode is an error, and so is giving `+scope` twice.
- `+scope` looks like a grant but is not one (§10).

### 8.11 `define` and `return` · Your own verbs

A **function** is a verb you write yourself. Its name is ALL-CAPS, like `POST`. You call it
the same way: its name, then its arguments, with no parentheses:

```ttv
define TOREADABLE(mils)
    "hh?:mm:ss" -> clkFmt
    return mils as clkFmt

define CLAMP(value, low, high)
    if value is below low
        return low
    if value is above high
        return high
    return value

await (.raider is SOMETHING)
    5:00 -> wait_time
    POST TOREADABLE 5:00                 // "05:00"
    POST `took ${ TOREADABLE wait_time }`
    TOREADABLE 5:00 -> readable          // alone on a line; the arrow binds the result
    CLAMP .raid_size, 1, 100             // several arguments, with commas
```

**Defining a function**

- Write `define NAME(param, ...)` and an indented block, **at the top level only**.
- The name is ALL-CAPS. It may not be a verb or constant the host already has.
- Parameters follow the rules for names (§6.5). Each parameter is listed once.
- You may call a function before the line that defines it. A function may call itself.
  Calls may go at most 100 deep.

**Calling a function**

- Arguments are separated by commas. A call with no arguments is just the name.
- Alone on a line, the arguments take the rest of the line, like a verb's. The one exception
  is an arrow at the end: it binds the call's **result**.
- Inside an expression, the arguments stop before `%`, `~`/`as`, the comparisons,
  `and`/`or` and arrows. So `POST TOREADABLE x as "mm:ss"` formats the **result**. To put one
  of these inside an argument, use parentheses.
- Passing more arguments than there are parameters is an error before the script starts.
  Passing fewer leaves the rest empty.

**`return <value>`** ends the call with that value. A call that reaches the end of its block
returns empty. `return` outside a function is an error.

**What a function can see:** its parameters, its own names and the host's constants. It
**cannot** see the caller's names: pass what it needs as arguments. It does see the caller's
subject and channel, so `.sender` and `POST` work as they would where it was called.

**What a function may do:** work out values, branch, loop, call verbs and call functions. It
may **not** contain `await`, `after` or `using`. A function works out a result. It does not set
up handlers, and it does not change grants while it runs.

**Grants.** `define NAME(...) with +grant ...` lists what the function needs. The caller must
hold **all** of them, or the call is refused. The function then runs with **exactly** those
grants, whatever else the caller holds. A function that lists none runs with none:

```ttv
define ADD(a, b) with +eval:calc
    return calc(a + b)
```

### 8.12 `for`, `break`, `renew` · Loops

```ttv
for 0; 10; 2                 // start; stop; step — stop is left out, like `..`
    POST `${ $ }`            // $ is the loop's counter: 0, 2, 4, 6, 8

(`hi`, `hey`) -> greet_list

for as row: 0; 3             // a label names the loop, and its counter
    for greet_list           // or go through a list: $ is each item
        if $ is `hey`
            renew            // go to the next round now
        if row is 2
            break row        // leave the loop named `row`
        POST `${ row }: ${ $ }`
```

- **Counting:** `for start; stop[; step]`. The values are numbers or durations. `stop` itself
  is left out. `step` is 1 if not given, and may be negative to count down. A step of 0, or a
  step that points away from `stop`, is an error (not an empty or endless loop).
- **Going through a list:** `for <value>` takes each item in turn. The value may be a list,
  a range, or anything `any from` accepts.
- **`$`** is the counter of the innermost loop. A label (`for as name:`) also gives the
  counter that name, so an inner loop can read an outer loop's counter. `$` outside a loop is
  an error. `$name` is not allowed.
- **`break [label]`** leaves the innermost loop, or the loop with that label.
  **`renew [label]`** starts its next round.
- A label that no enclosing loop has is an error. `break` and `renew` cannot leave a
  function.
- Each round costs one step, so a runaway loop is stopped by the budget (§11).

### 8.13 `plugin` · The script's header

TTV Tools turns each script into **one plugin** with its own on/off switch in Settings. The
`plugin` header says what the plugin is called, where it runs, and what the viewer can
change:

```ttv
plugin raid_shoutouts -- "Raid shoutouts"
    about "Shouts out raiders and lets mods re-shout them."
    frames chat, main
    setting delay: number 5 -- "Seconds before the shoutout"
        min 0, max 60, step 1, unit "s"
    setting loud: checkbox false -- "Shout in capitals"
    setting greeting: text "welcome in!" -- "Greeting"
        placeholder "what to say"
    setting style: select "short" -- "Message length"
        option "short" -- "Short"
        option "long" -- "Long"

await (.raider is SOMETHING)
    if setting.loud
        POST `${ setting.greeting } @${ .raider }!!`
```

**Where it goes.** `plugin` is the **first statement** of the script, at the top level, at most
once. Comments may come before it. A script without a header still works; it gets a name from
its file name.

**The first line:** `plugin <id> [-- "Name"]`.

- The **id** is lower-case letters, digits and `_`, and starts with a letter. It becomes the
  plugin's id, its job's name, and the key of its on/off setting.
- The **name** is what the viewer sees. If it is left out, the id is used.

**The lines under it** — only these, each at most once, except `setting`:

| Line | Meaning |
| :--- | :--- |
| `about "<text>"` | the text shown under the on/off switch |
| `frames <frame>[, <frame>]` | where the script runs: `chat` (chat on www.twitch.tv, and pop-out chat) and/or `main` (the channel page). If left out: `chat`. |
| `setting <name>: <type> <default> [-- "Label"]` | a value the viewer can change (below) |

**Settings.** The `<name>` is lower-case letters, digits and `_`, and starts with a letter.
Each name is declared once. `<default>` is the value before the viewer changes it, and must
fit the type. The label is what the viewer sees; if left out, the name is used. An indented
block under a setting may add details, separated by commas or one per line:

| Type | Default | The block may hold |
| :--- | :--- | :--- |
| `checkbox` | `true` or `false` | — |
| `number` | a number, or a duration (as milliseconds); may be negative | `min <n>`, `max <n>`, `step <n>` (above 0), `unit "<text>"` |
| `text` | a quoted string | `placeholder "<text>"` |
| `select` | a quoted string: one of the options | `option "<value>" [-- "Label"]`, at least one |

- A number's default must be between its `min` and `max`. `min` may not be above `max`.
- A select's default must be one of its options.
- Read a setting with `setting.<name>` (§6.7).

**Grants are not listed in the header.** The `using` lines already say what the script asks
for, with descriptions (§10).

**Mistakes in the header**, and their messages:

| Mistake | Message |
| :--- | :--- |
| header not first, given twice, or indented | `` `plugin` must be the first statement of a script `` |
| bad id | `` A plugin id is lower-case letters, digits and `_`, starting with a letter — e.g. `plugin raid_shoutouts`; found … `` |
| another kind of line in the header | `` A `plugin` header holds only `about`, `frames` and `setting` lines; found … `` |
| `about` or `frames` twice | `` `about` is given twice `` |
| unknown frame | `` Unknown frame "…"; a script runs in `chat`, `main` `` |
| bad setting name | `` A setting name is lower-case letters, digits and `_`, starting with a letter; found … `` |
| a setting declared twice | `` Setting `…` is declared twice `` |
| unknown type | `` Unknown setting type "…"; use `checkbox`, `number`, `text`, `select` `` |
| a default of the wrong kind | `` A `number` setting's default is a number; found … `` |
| a detail the type does not take | `` A `number` setting takes `min`, `max`, `step`, `unit` here; found … `` |
| a detail or option twice | `` `min` is given twice `` / `` Option "…" is listed twice `` |
| number limits | `` Setting `…` has `min` above `max` `` · `` Setting `…` defaults to …, outside its `min`/`max` `` · `` `step` must be above 0 `` |
| select | `` Select setting `…` needs at least one `option` `` · `` Select setting `…` defaults to "…", which is not one of its options `` |
| reading a setting that is not declared | `` No setting named `…`; the `plugin` header declares `…`, `…` `` |
| `setting` used wrongly | `` A setting is read as `setting.name` `` |

How a host reads the header, and where settings are stored, is in `HOST.md` §9.

## 9. Scope · Which subject `.prop` reads

`.prop` reads a property of the subject chosen by the **nearest enclosing** `using`, `await`,
`where` or `with`. `if`, `when` and `else` do not choose a subject.

"Nearest" is decided by where the `.prop` is **written**, not by what is running:

```text
await (.links is *)                                  <- the subject is the event
    goto 1st <| .links where ("twitch.tv" in .href)
                ^^^^^^^^^^^^                 ^^^^^
                the event's links            the link being tested
```

`.links` reads the event's links. `.href` is inside the `where`, so it reads each link. Two
filters inside each other each read their own item.

Who can read a **name** (a variable) is a different question; see the scope modes in §8.10.

## 10. Permissions · Asking before acting

A **grant** asks for a permission. Grants go on a `using` line and are written
`+action:resource`, sometimes with more parts after a `.`:

```ttv
using [vip] +read:datetime +eval:calc -- "Prints the time, and does some sums"
    await 5:00
        POST `It's ${ &datetime.now() }, and 2 + 2 is ${ calc(2 + 2) }`
```

**What checks a grant.** Host calls (§7.13) and `calc` (§7.12). The host decides which grant
each host call needs. The built-in calls need `eval:js`. Nothing else checks a grant.

**The list of permissions is fixed:**

| Permission | Allows |
| :--- | :--- |
| `read:datetime` | reading the clock |
| `read:html.text` · `read:html.attributes` · `read:html.structure` | reading the page |
| `write:html.text` · `write:html.attributes` | changing the page |
| `parse:html.text` · `parse:html.attributes` · `parse:html.structure` | turning HTML text the script already has into plain data |
| `eval:calc` | arithmetic in `calc( ... )` |
| `eval:js` | the built-in `Math` / `Number` / `Date` / `JSON` / `Array` calls (§7.13) — never a host call |
| `eval:budget_1M` · `eval:budget_10M` · `eval:budget_100M` | a bigger step budget (§11) |

- A host may add permissions to the list. A host call tied to a permission that is not on the
  list is refused when the host starts, because no script could ever be granted it.
- A grant that is not on the list is an error **before the script starts**. So is a `.*`
  that matches nothing on the list. A typo like `+read:htlm.*` is caught, instead of silently
  granting nothing.

**`write` and `eval` grants need a description.** Every `+write:…` or `+eval:…` grant needs a
`-- "…"` description on the same `using` line (§8.4). Without one, it is an error. These
grants change the page or run code, and the host shows the description when it asks the
viewer. `read` and `parse` grants need no description.

**Grants pass down, never sideways.** A block has its own grants and the grants of every
block around it. It never has a sibling's grants.

**A grant matches exactly, or one level with `.*`.** A grant covers a permission in only two
cases:

1. The grant **is** that permission.
2. The grant is the permission's parent, then `.*`. `+read:html.*` covers `read:html.text`
   and `read:html.attributes`.

There is no other matching:

- `+read:html` does **not** cover `read:html.text`. Only a written `.*` reaches further.
- `+read:html.*` reaches **one** level. It does not cover `read:html.text.inner`, a different
  action (`write:html.text`) or a different resource.
- `+eval:calc` and `+eval:js` are unrelated. Neither covers the other.
- `*` may only be the last part, after a `.`. `+read:*`, `+read:html.*.text` and `+a:b:c` are
  errors.

**Other rules:**

- Grants and subjects may come in any order on a `using` line. A `using` may have grants and
  no subject (§8.4).
- A grant written anywhere except a `using` line (or a `define` line, §8.11) is an error.
- `+scope` is not a grant. It sets the scope mode (§8.10), and it can never count as a
  permission named `scope`.
- A script that reaches for something it was not granted gets a **permission error**. The
  host can treat this as "ask the viewer", not as a bug.

## 11. Limits · Stopping runaway scripts

The budgets are **per turn**. A turn is one burst of work: one timer tick, or the handling of
one event. A script that runs for days is fine. A loop that never ends inside one turn is not.

| Limit | Default | Checked at |
| :--- | :--- | :--- |
| steps | 100,000 | every statement, every loop round, every range member |
| time | 30 seconds | the same places |

The time is real time spent working. A script that waits five minutes has not worked for five
minutes.

**A bigger step budget.** A script that needs more steps, such as one with a long loop, may ask
for them:

```ttv
using +eval:budget_1M -- "walks the whole emote list"
    for 0; 200000
        renew
```

- `eval:budget_1M`, `eval:budget_10M` and `eval:budget_100M` raise the step limit to one,
  ten or a hundred million per turn.
- The budget is for the **whole script**, wherever the grant is written. If there are
  several, the largest wins.
- Like every `eval` grant, it needs a description. The time limit does not change.

Other limits: function calls go at most 100 deep (§8.11), and `Array.from` stops at 10,000
items (§7.13).

Going over a budget is a **limit error**. It stops the whole script.

## 12. Errors · When something is wrong

### 12.1 Before the script starts

The script is checked before it runs. Each mistake is reported with its line and column, and
a picture of the line with the mistake underlined:

```text
DSLSyntaxError: Indentation mixes tabs and spaces; pick one (2:1)
  1 | await *
> 2 |      POST `x`
    | ^^
```

The kinds of error:

| Kind | Means | Examples |
| :--- | :--- | :--- |
| `DSLSyntaxError` | a character or word that cannot be read | a stray character; bad indentation; an unclosed string, template or bracket; a bad grant or `\u` escape; an old spelling (`<badge>`, `:emote:`, `$:`) |
| `DSLParseError` | words in an order the language does not allow | a missing block; `where` after a yes/no test; a `write`/`eval` grant with no description; `+scope` below the top level |
| `DSLPermissionError` | a grant that does not exist, or a missing grant | `+read:htlm.*`; a host call without its grant |
| `DSLRuntimeError` | something wrong found when a line runs | an unknown verb or constant; a bad range; `after` given a non-duration; an unknown host call; reading a function or calling a constant |
| `DSLLimitError` | a turn went over its budget (§11) | a loop that never ends |

Some errors are found before the script starts even though they are run-time kinds: an
unknown function, or too many arguments to a function.

**Several mistakes are reported at once.** When a line is wrong, the rest of that line and
the block it opens are skipped, and checking goes on. A script with three mistakes reports
three errors. An error in reading characters (a `DSLSyntaxError`) stops the check at that
point.

### 12.2 While the script runs

A mistake inside a handler or a timer goes to the log. **Only that handler stops**; the rest
of the script keeps running. An unknown realm is reported once, and only its block is skipped
(§6.1).

A limit error (§11) is different: it stops the whole script.

---

# Part 3 — A full example

This script uses most of the language. The comments explain each part.

```ttv
// While the channel is live... The realm is Twitch unless another is named.
// The `with` filter applies to every `await` inside this block (§8.1).
await * with (#live is true)
    // #              → this channel (same as `/`)
    // #prop          → a property of this channel
    // /channel       → the channel named "channel"
    // /channel#prop  → a property of that channel
    // [badge]        → the sender holds this badge; [a b] → any of these (§6.1)
    // @user          → the user named "user" in this channel
    // .prop          → a property of the subject (§9)

    // Watch a Discord channel for announcements. TTV Tools has no DISCORD realm, so this
    // one block is skipped, and the rest still runs.
    using DISCORD/779741119520571456
        await (.sender is "streamcord") and ("twitch.tv" in .content)
            goto 1st <| .links where ("twitch.tv" in .href)
            // 1st = the first item, -1st = the last item; 1th, 2th, 3th also work

    // For each live channel...
    using *
        await 15:00
            goto #
            // Set up once, on the first tick — not again every 15 minutes (§8.1).
            await 5:00
                // Only on this channel...
                if #name is "ginger_enby"
                    POST `!lurk watching anime`
        // For every chat message...
        await (.message is *)
            REPLY ``
            // An empty message is not sent, so this does nothing.
        // For every message that mentions the viewer...
        await (USERNAME in .message) or (USERNAME in .mentions)
            if #name is "soulbewitch" and .sender is "Jjay_89"
                REPLY `what do you want now, ${ .sender }?`
        // For every command...
        await (.command is *)
            if .command is "gamble"
                REPLY any from (
                    `You lost. End of story :)`
                    // `..` leaves out the end: 1 .. 10 is 1 to 9
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
    // One bracket: runs once if any of these badges is held, not once per badge.
    using [viewer everyone anyone all]
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

## New in version 2.1

If you wrote scripts for version 2, these changed:

- `*` now matches empty values too. It is `ANYTHING`. The old meaning is now `SOMETHING`
  (§5.7).
- `->` and `=>` mean the same. `+scope` decides who can read a name (§8.10).
- A bare `%` matches any line break and the spaces around it (§7.10).
- Badges are `[badge]`, emotes are plain text (`'kappa'`), and host calls are `&path.fn()`
  (§6.1, §7.13).
- `using [badge]` keeps the current subject (§8.4).
- An `await` inside a handler is set up once, and an outer `with (...)` filter still applies
  to it (§8.1).
- `else`, `else if`, `above` and `below` are new keywords (§7.4, §8.6).
- Variable names need only a lower-case letter, not an underscore (§6.5).

Also new: `ANYTHING` / `SOMETHING` / `NOTHING`, `.a.b.c`, `using` without a subject, `after`,
`~` / `as`, `calc( ... )`, lists, host calls as statements, functions, loops, bigger budgets,
and the `plugin` header.

The full history, from version 1, is in `SPEC-notes.md`.
