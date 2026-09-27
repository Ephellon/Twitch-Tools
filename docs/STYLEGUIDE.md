# Style Guide

The house style for TTV Tools. `npm run lint` reports every rule marked **lint**; `npm run format` fixes the ones marked **fix**. The rest are for review. The house rules live in [`scripts/eslint/style.mjs`](../scripts/eslint/style.mjs), and [`eslint.config.mjs`](../eslint.config.mjs) turns them on.

Rules are grouped by concern. Where a rule refers to another, it names that rule's section rather than a number.

---

## I. Environment

### Language target
- ES2022+ as Chromium and Firefox ship it (the build targets `chrome88` and `firefox142`). Use native forms: `??`, `??=`, `?.`, `**`, classes, and numeric separators (`15_000`).
- Content scripts (`tools.js`, `chat.js`, …) are classic scripts sharing one page scope; `src/lib` and `src/plugins` are ES modules bundled by esbuild. See [Architecture](ARCHITECTURE.md).

### Null and undefined
- Never write the bare identifier `undefined`. It can be shadowed; use `void null`. **lint, fix** (`ttv/void-null`)
- Use `??` and `??=` for defaults.
- Test for "missing" with the project helpers `nullish(x)` and `defined(x)`, or with `x == null`. Use `x === void null` only when you mean "undefined, not null".

---

## II. Names and declarations

### Naming
- **Variables and local functions:** `camelCase`.
- **Shared page-scope functions and classes:** `PascalCase` (`RegisterJob`, `GetVolume`, `StopWatch`).
- **Semantic constants and shared state:** `UPPER_CASE` (`FIRST_IN_LINE_JOB`, `STREAMER`).
- **Loop and block labels:** `snake_case`. Feature section labels from before Phase 4 (`__ClaimReward__:`) keep their names; the Phase 4 tools look for them.
- **Short names** (`$`, `_`, `k`, `v`, `i`, `j`) are fine in tight, obvious scopes. Use longer names in wider scopes.

### Declarations
- `const` for bindings that never change; `let` for ones that do; never `var`. **lint, fix** (`ttv/prefer-const`, `no-var`)
  - Exception: page-scope `let` declarations in classic scripts stay `let`, since other scripts on the page may assign them.
- Multiple declarations are comma-first, one per line, with the keyword only on the first line. **lint, fix** (`comma-style`)
  ```javascript
  let result = ''
      , parts = []
      , depth = 0;
  ```
- Write standalone updates in prefix form, `++i` and `--i`. A `for` header's step may use either form. **lint, fix** (`ttv/prefix-update`)

### Quotes
- **Single quotes** `'...'` for strings the code treats as symbols: selectors, keys, event and job names, flags, and anything compared or looked up.
  ```javascript
  $('[data-a-target="chat-input"i]');
  RegisterJob('claim_reward');
  ```
- **Double quotes** `"..."` for text people read: log and notice messages, `alert`/`confirm`/`prompt` text, error messages, and markup or text assigned to `textContent`, `innerHTML`, `title` and similar.
  ```javascript
  $remark("Adding reward claimer...");
  throw new Error("No channel data");
  ```
- Template literals are fine for either kind when they interpolate.
- Use the other quote only when the string contains the wanted one, so it needn't be escaped.
- **lint, fix** (`ttv/quotes`). It decides from context: arguments to `$log`/`$warn`/`$notice`/`$remark`/`alert`/`confirm`/`prompt`/`Error`/`console`, `throw`, and assignments or properties named `textContent`, `innerHTML`, `title`, `message`, `tooltip` and so on count as text. Anything else is a symbol.

### Types
- Types are documented in JSDoc (`@param {string} name`), not with inline type comments.

---

## III. Expressions

### Operator spacing
- One space on each side of binary, logical, assignment and ternary operators: `a + b`, `x ?? y`, `n **= 2`, `x ? y : z`. **lint, fix** (`space-infix-ops`)
- Symbol unary operators sit against their operand: `!flag`, `-value`, `~mask`, `++cursor`. Word operators take a space: `typeof x`, `void null`. **lint, fix** (`space-unary-ops`)
- A colon in an object literal isn't an operator; see **Object and array literals**.

### Object and array literals
- Object literals are padded inside the braces: `{ key: value }`. Empty objects are `{}`. **lint, fix**
- Array literals are not padded: `[1, 2, 3]`. Empty arrays are `[]`. **lint, fix**

### Conditionals
- If two conditions collapse into a shorter test (`.includes()`, a regular expression), use the shorter test:
  ```javascript
  if(/^(fr|sv)$/.test(language))
      suffix = 'e';
  ```
- Three or more conditions that don't collapse are broken one per line, with the operator **leading** each line. The first line is the operator's identity value: `false` for `||`, `true` for `&&`, `null` for `??`.
  ```javascript
  if(false
      || nullish(button)
      || button.disabled
      || coin < cost
  )
      return;
  ```
- When operators are mixed, show the grouping with parentheses; indentation alone doesn't show it.

### Ternaries
- A ternary that spans lines puts `?` and `:` at the **start** of each line. **lint, fix** (`operator-linebreak`)
  ```javascript
  let type = token.flag == 'paren'
      ? 'PARENTHESIS'
      : token.flag == 'brack'
          ? 'BRACKETS'
          : 'BRACES';
  ```
- A short ternary stays on one line: `x ? y : z`.

---

## IV. Statements and control flow

### One statement per line
- Every statement gets its own line. **lint, fix** (`ttv/statement-per-line`)

### One-line bodies
- The body of a brace-less `if`, `else`, `for` or `while` goes on its own line, indented. **lint, fix** (`ttv/body-below`)
  ```javascript
  while(i < s.length && /\s/.test(s[i]))
      ++i;
  ```

### Block separation
Leave room to breathe. All of these are **lint, fix** (`padding-line-between-statements`):
- A **declaration group** (`const`/`let`/`var`) has a blank line before its first declaration and after its last. Declarations within a group stay together.
- A **statement that spans lines**, one ending `…);`, `…];` or `…};`, is followed by a blank line.
- **Different kinds of block** are separated by a blank line. The kinds are: `if`/`else` chains (a whole chain counts as one), `for` loops and `while` loops. A run of the same kind may stay together.
  ```javascript
  const [streamer] = online.filter(({ name }) => name.equals(channel));

  if(nullish(streamer))
      continue filtering;

  Cache.save({
      FIRST_IN_LINE_DUE_DATE,
  });

  RegisterJob('up_next');
  ```
- A standalone `break` or `continue` has a blank line before it. The `} break;` form of a switch case doesn't. **lint, fix**

### Labels
- A `break` or `continue` that leaves more than the innermost loop names its label. Labels are `snake_case`.

---

## V. Functions

### Declarations
- Prefer named function declarations at outer scope.
- A function inside a `case` block is written `const name = (...) => {}`.
- Helpers used by only one function are defined inside it; shared helpers go in `src/lib` (or `core.js`/`utils.js` for page-scope helpers).

### Header comments
- Every named or top-level function, plugin hook and exported helper has a JSDoc header. It says what the function does, what it takes and what it returns, at a high level. Inline arrows and callbacks don't need one.
  ```javascript
  /**
   * Waits for `condition` to return an element.
   * @param {function} condition - Returns the element, or nothing yet
   * @param {number} [timeout=10000] - Give up after this many ms
   * @returns {Promise<Element|null>} The element, or `null` on timeout
   */
  ```

### Regular expression callbacks
- A `replace` callback lists every positional parameter, used or not, named `$0, $1…$n, $$, $_` (match, groups, offset, input). **lint, fix** (`ttv/regex-callback-params`)
  ```javascript
  name.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['', ' '][+!!$1] + $2.toUpperCase());
  ```
- Use arrow functions for these callbacks.

---

## VI. Blocks and switches

### Cases
- Each non-empty `case` body is wrapped in braces, and the closing brace shares a line with its `break`: `} break;`. Cases that fall through with no body of their own stay bare. **lint, fix** (`ttv/switch-case-braces`; the fix is skipped when a case's declarations are used by another case)
  ```javascript
  switch(frame) {
      case 'chat':
      case 'popout': {
          StartChat();
      } break;

      default: {
          return;
      }
  }
  ```

### Sibling blocks
- If any branch of an `if`/`else` chain has braces, every branch does. **lint, fix** (`ttv/if-braces`)
- A braced `if`/`else` branch with exactly one statement leaves that statement's semicolon off. **lint, fix** (`ttv/if-block-semi`)
  ```javascript
  if(paused) {
      ++pauses
  } else {
      Resume()
  }
  ```
- Everywhere else, statements end with a semicolon. **lint, fix** (`ttv/semi`)

---

## VII. Comments

### Inline comments
- Comments explain **why**, not what. Save them for logic that isn't obvious: Twitch markup quirks, timing, sentinel values, workarounds.

### Closing-brace breadcrumbs
- The closing brace of a labeled block, a switch, or a case block gets a comment giving its path when any of these holds:
  - it's more than three blocks deep;
  - it's a switch nested inside another switch;
  - it's a switch with more than three cases;
  - it spans more than sixty lines.
  ```javascript
  } // :scanning | switch syntax | 'template'
  ```
- **lint, fix** (`ttv/breadcrumbs`). The fix leaves a brace alone if something else already follows it on the line.

---

## VIII. Code organisation
- One feature per plugin (`src/plugins/<group>/<feature>.js`; see [Writing a plugin](PLUGINS.md)). Shared helpers go in `src/lib`.
- Features never throw into the page: an error in one job must not stop the others. Catch errors and report them with `$warn`/`$error`, with the feature's name in the message.
- Error messages are written inline in the `throw` or log call, as template literals.

---

## IX. Formatting
- Indent with **4 spaces**, never tabs: one level per block, case, continued declaration (`, next`), leading operator (`|| x`, `? y`) and chained call (`.then(…)`). **lint, fix** (`indent`, `indent-binary-ops`)
  - Exception: the arguments of a call keep their hand indentation. `furnish(…)`/`f(…)` DOM trees indent children under their parent to show nesting.
  - Exception: a function assigned on the next line (`top.Name =` then `function Name() {…}`) stays level with the assignment.
- A comment is indented like the code after it. A group of comments moves together and keeps its internal indentation, so a signature line stays one level under its description. **lint, fix** (`ttv/comment-indent`)
- No space between a control keyword and its parenthesis: `if(`, `for(`, `while(`, `switch(`. **lint, fix**
- No space before a function's parameter list: `function name(`, `async(x) =>`. **lint, fix**
- Braces follow 1TBS (`} else {`). **lint, fix**
- A short inline comment goes on the same line as the code it explains, where it fits.
