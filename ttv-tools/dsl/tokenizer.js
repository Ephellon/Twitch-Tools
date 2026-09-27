/*** /dsl/tokenizer.js - Single-pass, indentation-aware scanner for the TTV DSL
 *   _______   ____   _  __ ______  _   _  _____  ______ ______  _____               _   _____
 *  |__   __| / __ \ | |/ /|  ____|| \ | ||_   _||___  /|  ____||  __ \             | | / ____|
 *     | |   | |  | || ' / | |__   |  \| |  | |     / / | |__   | |__) |            | || (___
 *     | |   | |  | ||  <  |  __|  | . ` |  | |    / /  |  __|  |  _  /         _   | | \___ \
 *     | |   | |__| || . \ | |____ | |\  | _| |_  / /__ | |____ | | \ \    _   | |__| | ____) |
 *     |_|    \____/ |_|\_\|______||_| \_||_____|/_____||______||_|  \_\  (_)   \____/ |_____/
 */

/** @file Turns TTV DSL source into a flat token stream, including the synthetic
 * `INDENT` / `DEDENT` / `NEWLINE` / `EOF` tokens that give the language its off-side rule.
 *
 * Two behaviours here are deliberately unlike a conventional lexer, and both are
 * load-bearing:
 *
 * 1. Newlines inside `(` ... `)` are **still emitted**. `any from ( ... )` separates its
 *    items by line, not by comma, so a lexer that swallowed newlines inside brackets
 *    would make the construct unparseable. `INDENT`/`DEDENT` *are* suppressed inside
 *    brackets, since continuation lines may be indented freely.
 * 2. Uppercase bare words are emitted as `IDENT` carrying an `isUpper` flag rather than
 *    being classified as verbs. The parser decides verb-vs-constant by position, which
 *    keeps the host's verb registry open — adding a `WHISPER` verb needs no lexer change.
 *
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

globalThis.TTV_DSL ??= {};

if (typeof require === 'function' && typeof module === 'object') {
    require('./errors.js');
    require('./tokens.js');
}

(() => {
    const { DSLSyntaxError } = globalThis.TTV_DSL.errors;
    const { TokenType, KEYWORDS, PUNCTUATORS, createToken } = globalThis.TTV_DSL.tokens;

    /** Matches `1st`, `2nd`, `-1st`, `3th` — the universal `th` suffix is accepted. */
    const ORDINAL_PATTERN = /^-?\d+(?:st|nd|rd|th)\b/;

    /** Matches `mm:ss` and `hh:mm:ss`. Anchored; applied only at a digit. */
    const DURATION_PATTERN = /^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?\b/;

    /** Matches an integer or float.
     *
     * The trailing `(?!\w)` rejects `1abc` but deliberately permits a following `.`, so
     * `1..9` scans as `1`, `..`, `9` rather than dying on the range operator. A fractional
     * part needs a digit after the dot, which is what keeps `1..9` from eating `..`. */
    const NUMBER_PATTERN = /^\d+(?:\.\d+)?(?!\w)/;

    /** A bare word. */
    const IDENT_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*/;

    /** A channel / realm path segment. Channel names permit digits and underscores; realm
     * ids are frequently long numeric snowflakes. */
    const PATH_PATTERN = /^[A-Za-z0-9_.-]+/;

    /** A badge list, e.g. `[moderator]`, `[vip moderator]`, `[vip, sub-gifter]`. One line
     * only; the names are split out by {@link BADGE_NAME_PATTERN}. */
    const BADGE_LIST_PATTERN = /^\[([^\]\n]*)\]/;

    /** One badge name inside `[ ... ]`. */
    const BADGE_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;

    /** The two retired badge spellings, `<moderator>` (v2) and `--moderator` (v2.1 draft),
     * recognized only to point at `[moderator]`. */
    const OLD_BADGE_PATTERN = /^(?:<([A-Za-z0-9_-]+)>|--([A-Za-z][A-Za-z0-9_-]*))/;

    /** The retired emote spelling, `:kappa:`. Emotes are plain text now — `'kappa'` — so
     * this is recognized only to say so. */
    const EMOTE_PATTERN = /^:([A-Za-z0-9_]+):/;

    /** A permission grant: `+action:resource[.part...][.*]` — `+read:datetime`,
     * `+write:html.attributes`, `+read:html.*`. Also `+scope[:mode]`, which the parser
     * diverts.
     *
     * The `:` is consumed *here*, by this pattern, which is the only reason the case-label
     * branch never sees it. `*` may only be the last part, after a `.`. */
    const PERMISSION_PATTERN = /^\+([A-Za-z_][A-Za-z0-9_]*(?::[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*(?:\.\*)?)?)/;

    /** What may not directly follow a scanned permission: anything that would have made it
     * a different, malformed one (`+read:*`, `+read:html.*.x`, `+a:b:c`). */
    const PERMISSION_TAIL = /^[:.*A-Za-z0-9_]/;

    /** A host-binding path: `&Date.now`, `&Intl.DateTimeFormat`. */
    const JS_PATH_PATTERN = /^&([A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*)/;

    /** A `%` class run. The leading `%` belongs to the *first* class, so `%n%s` is two
     * classes and a bare `%` is zero — which is what lets `%` alone mean "the default run"
     * without a separate spelling. */
    const PERCENT_PATTERN = /^%(?:[0aAbBdDfnrsStvwWc](?:%[0aAbBdDfnrsStvwWc])*)?/;

    /** An all-caps word — the shape the parser treats as a verb at statement start and as
     * a host constant everywhere else. */
    const UPPER_PATTERN = /^[A-Z][A-Z0-9_]*$/;

    /** Recognized backslash escapes inside strings and templates. */
    const ESCAPES = Object.freeze({
        n: '\n',
        r: '\r',
        t: '\t',
        b: '\b',
        f: '\f',
        v: '\v',
        '0': '\0',
    });

    const MS_PER_SECOND = 1000;
    const MS_PER_MINUTE = 60 * MS_PER_SECOND;
    const MS_PER_HOUR = 60 * MS_PER_MINUTE;

    /** Builds an offset -> `{ line, column }` resolver over a source string.
     *
     * Positions are derived from absolute offsets rather than being tracked incrementally,
     * so a lookahead that backtracks can never desynchronize the reported location.
     * @param {String} source
     * @return {function(Number): { line: Number, column: Number }}
     */
    let makeLocator = (source) => {
        let starts = [0];

        for (let index = 0; index < source.length; ++index)
            if (source[index] === '\n')
                starts.push(index + 1);

        return (offset) => {
            let low = 0,
                high = starts.length - 1;

            while (low < high) {
                let mid = (low + high + 1) >> 1;

                if (starts[mid] <= offset)
                    low = mid;
                else
                    high = mid - 1;
            }

            return { line: low + 1, column: (offset - starts[low]) + 1 };
        };
    };

    /** Scans TTV DSL source into tokens. */
    class Tokenizer {
        #source;
        #length;
        #index = 0;
        #tokens = [];
        #indents = [0];
        #brackets = 0;

        /** Set by a `calc` keyword; the next `(` opens arithmetic mode. */
        #calcPending = false;

        /** The bracket depth each open `calc( ... )` started at, innermost last. While this
         * is non-empty, `+ - * / %` are arithmetic operators. */
        #calcDepths = [];
        #lineHasToken = false;
        #originOffset = 0;
        #fragment = false;
        #locate;
        #reportSource;

        /**
         * @param {String} source - the text to scan
         * @param {Object} [options]
         * @param {{ offset: Number, source: String }} [options.origin] - when scanning a
         *   fragment carved out of a larger script (a template interpolation), this maps
         *   every emitted location back onto the original file.
         * @param {Boolean} [options.fragment = false] - suppress `INDENT`/`DEDENT`
         *   entirely. A template interpolation begins mid-line, so its leading whitespace
         *   is an artifact of the enclosing script and must not be read as structure.
         */
        constructor(source, { origin = null, fragment = false } = {}) {
            this.#source = String(source);
            this.#length = this.#source.length;

            this.#fragment = !!fragment;
            this.#originOffset = (origin? origin.offset | 0: 0);
            this.#reportSource = (origin? origin.source: this.#source);
            this.#locate = makeLocator(this.#reportSource);
        }

        /** Scans the whole input.
         * @return {Array<Object>} the token stream, always terminated by `EOF`
         * @throws {DSLSyntaxError}
         */
        tokenize() {
            while (this.#index < this.#length) {
                // A skipped blank/comment line leaves the cursor at the head of the *next*
                // line, whose indentation still has to be measured — hence the `continue`.
                if (this.#atLineStart() && this.#scanLineStart())
                    continue;

                if (this.#index >= this.#length)
                    break;

                this.#scanToken();
            }

            this.#finish();

            return this.#tokens;
        }

        // -- position helpers -------------------------------------------------

        /** @return {Boolean} true when the cursor sits at the first column of a line */
        #atLineStart() {
            if (0 === this.#index)
                return true;

            let previous = this.#source[this.#index - 1];

            return ('\n' === previous);
        }

        /** @param {Number} offset @return {Object} an absolute, report-ready location */
        #locationAt(offset, end) {
            let absolute = this.#originOffset + offset,
                { line, column } = this.#locate(absolute);

            return { line, column, start: absolute, end: this.#originOffset + (null == end? offset: end) };
        }

        /** @param {String} message @param {Number} offset @param {Number} [end] */
        #fail(message, offset, end) {
            throw new DSLSyntaxError(message, this.#locationAt(offset, end), this.#reportSource);
        }

        /** @param {String} type @param {Number} start @param {Number} end @param {*} [value] @param {Object} [extra] */
        #emit(type, start, end, value, extra) {
            let lexeme = this.#source.slice(start, end);

            this.#tokens.push(createToken(type, lexeme, (undefined === value? lexeme: value), this.#locationAt(start, end), extra));
            this.#lineHasToken = true;
        }

        /** @param {RegExp} pattern @return {?Array} the match at the cursor, or null */
        #match(pattern) {
            return pattern.exec(this.#source.slice(this.#index));
        }

        // -- line structure ---------------------------------------------------

        /** Handles leading whitespace: validates it, skips insignificant lines, and emits
         * `INDENT` / `DEDENT` when the level changes.
         * @return {Boolean} true when the whole line was skipped as blank or comment-only
         */
        #scanLineStart() {
            let start = this.#index,
                spaces = 0,
                tabs = 0;

            while (this.#index < this.#length) {
                let character = this.#source[this.#index];

                if (' ' === character)
                    ++spaces;
                else if ('\t' === character)
                    ++tabs;
                else
                    break;

                ++this.#index;
            }

            if (spaces > 0 && tabs > 0)
                this.#fail('Indentation mixes tabs and spaces; pick one', start, this.#index);

            // A blank or comment-only line carries no structure. Consume it whole so it can
            // neither shift the indent stack nor emit a spurious NEWLINE.
            if (this.#atInsignificantLine()) {
                this.#skipInsignificant();

                return true;
            }

            // Inside brackets a continuation line may be indented however it likes, and a
            // fragment has no meaningful indentation at all.
            if (this.#brackets > 0 || this.#fragment)
                return false;

            let width = spaces + tabs,
                top = this.#indents[this.#indents.length - 1];

            if (width > top) {
                this.#indents.push(width);
                this.#emit(TokenType.INDENT, start, this.#index, width);

                return false;
            }

            while (width < this.#indents[this.#indents.length - 1]) {
                this.#indents.pop();
                this.#emit(TokenType.DEDENT, this.#index, this.#index, width);
            }

            if (width !== this.#indents[this.#indents.length - 1])
                this.#fail(`Dedent to column ${ width + 1 } does not match any enclosing block`, start, this.#index);

            return false;
        }

        /** @return {Boolean} true when the remainder of the line is empty or a comment */
        #atInsignificantLine() {
            if (this.#index >= this.#length)
                return true;

            let character = this.#source[this.#index];

            if ('\n' === character || '\r' === character)
                return true;

            if ('/' === character && '/' === this.#source[this.#index + 1])
                return true;

            // A block comment only makes the *line* insignificant when nothing but
            // whitespace follows its close. `/* note */ POST \`hi\`` still has to measure
            // its indentation, so it must not take this path.
            if ('/' === character && '*' === this.#source[this.#index + 1]) {
                let close = this.#source.indexOf('*/', this.#index + 2);

                if (close < 0)
                    return true;

                let tail = close + 2;

                while (tail < this.#length && (' ' === this.#source[tail] || '\t' === this.#source[tail] || '\r' === this.#source[tail]))
                    ++tail;

                return (tail >= this.#length || '\n' === this.#source[tail]);
            }

            return false;
        }

        /** Consumes a run of blank and comment-only lines' worth of text, leaving the cursor
         * at the head of the next line. A `/* … *\/` may span lines, so this is not simply
         * "skip to the newline". */
        #skipInsignificant() {
            while (this.#index < this.#length) {
                let character = this.#source[this.#index];

                if ('\n' === character) {
                    ++this.#index;

                    return;
                }

                if ('/' === character && '/' === this.#source[this.#index + 1]) {
                    this.#skipToLineEnd();

                    continue;
                }

                if ('/' === character && '*' === this.#source[this.#index + 1]) {
                    this.#skipBlockComment();

                    continue;
                }

                ++this.#index;
            }
        }

        /** Steps over a `/* … *\/`, however many lines it covers. */
        #skipBlockComment() {
            let start = this.#index,
                close = this.#source.indexOf('*/', start + 2);

            if (close < 0)
                this.#fail('Unterminated "/*" comment', start, this.#length);

            this.#index = close + 2;
        }

        /** Advances the cursor to just before the next newline (or to the end of input). */
        #skipToLineEnd() {
            while (this.#index < this.#length && '\n' !== this.#source[this.#index])
                ++this.#index;
        }

        /** Emits the trailing `NEWLINE`, unwinds the indent stack, and appends `EOF`. */
        #finish() {
            if (this.#brackets > 0)
                this.#fail('Unclosed "(" at end of input', this.#length);

            if (this.#lineHasToken)
                this.#emit(TokenType.NEWLINE, this.#length, this.#length, '\n');

            while (this.#indents.length > 1) {
                this.#indents.pop();
                this.#emit(TokenType.DEDENT, this.#length, this.#length, 0);
            }

            this.#tokens.push(createToken(TokenType.EOF, '', null, this.#locationAt(this.#length)));
        }

        // -- token scanning ---------------------------------------------------

        /** Dispatches a single token. Branch order encodes the language's disambiguation
         * rules; see the per-branch comments. */
        #scanToken() {
            let start = this.#index,
                character = this.#source[start];

            // Insignificant horizontal whitespace.
            if (' ' === character || '\t' === character) {
                ++this.#index;

                return;
            }

            if ('\r' === character) {
                ++this.#index;

                return;
            }

            if ('\n' === character) {
                ++this.#index;

                if (this.#lineHasToken) {
                    this.#emit(TokenType.NEWLINE, start, this.#index, '\n');
                    this.#lineHasToken = false;
                }

                return;
            }

            // `calc` arms arithmetic mode for the `(` straight after it, and only that.
            if (this.#calcPending && '(' !== character)
                this.#calcPending = false;

            // `//` must be tested BEFORE `/channel`, otherwise every comment scans as a
            // channel selector named after its first word.
            if ('/' === character && '/' === this.#source[start + 1]) {
                this.#skipToLineEnd();

                return;
            }

            // A block comment reached mid-line. The whole-line case was already handled at
            // the line head, where it had to be, so that indentation is still measured.
            if ('/' === character && '*' === this.#source[start + 1])
                return this.#skipBlockComment();

            // Inside `calc( ... )`, the arithmetic characters are operators — and are
            // claimed here, before `+` can become a permission, `*` the wildcard, `%` a class
            // run, `/` a channel or `-` a badge marker.
            if (this.#calcDepths.length && '+-*/%'.includes(character))
                return this.#scanArithmetic();

            if ('`' === character)
                return this.#scanTemplate();

            // `'` and `"` are the same literal with two spellings; the quote is a parameter
            // rather than a second scanner, so an escape fixed in one is fixed in both.
            if ('"' === character || '\'' === character)
                return this.#scanString(character);

            // Digits: ordinal beats duration beats number, because `1st` and `15:00` both
            // begin with something a naive number scanner would happily eat.
            if (character >= '0' && character <= '9')
                return this.#scanNumeric();

            // `-` is a negative ordinal only when the ordinal suffix is actually present;
            // otherwise it is unary minus and the digits are scanned separately.
            if ('-' === character && ORDINAL_PATTERN.test(this.#source.slice(start)))
                return this.#scanNumeric();

            // `-- "..."` describes a `using` header. `--moderator`, glued, was briefly the
            // badge spelling. Both are caught before the punctuator table so `--` never
            // reads as two unary minuses.
            if ('-' === character && '-' === this.#source[start + 1])
                return this.#scanDoubleDash();

            // `[moderator]` / `[vip moderator]`.
            if ('[' === character)
                return this.#scanBadge();

            if (':' === character)
                return this.#scanColon();

            // `<` is the pipe operator, or nothing.
            if ('<' === character)
                return this.#scanAngle();

            // `.` is `...`, `..`, or `.prop` — longest first.
            if ('.' === character)
                return this.#scanDot();

            if ('#' === character)
                return this.#scanHash();

            if ('/' === character)
                return this.#scanSlash();

            if ('@' === character)
                return this.#scanUser();

            // `+` is never arithmetic. Claiming the whole `+name:sub` here is what keeps the
            // `:` out of the emote branch.
            if ('+' === character)
                return this.#scanPermission();

            // `&` is only ever the head of a host-binding path.
            if ('&' === character)
                return this.#scanJSPath();

            // `$` outside a template was the v2 host-call head. Named here so the error
            // says what to write instead.
            if ('$' === character)
                this.#fail('Unexpected "$"; host calls are written "&Date.now()"', start, start + 1);

            if ('%' === character)
                return this.#scanPercent();

            if (IDENT_PATTERN.test(character))
                return this.#scanWord();

            return this.#scanPunctuator();
        }

        /** `1st` / `-2nd` / `15:00` / `1:30:00` / `42` / `3.5`. */
        #scanNumeric() {
            let start = this.#index,
                ordinal = this.#match(ORDINAL_PATTERN);

            if (ordinal) {
                this.#index += ordinal[0].length;

                let digits = parseInt(ordinal[0], 10);

                // `1st` -> 0, `2nd` -> 1; `-1st` -> -1 (last), `-2nd` -> -2.
                this.#emit(TokenType.ORDINAL, start, this.#index, (digits < 0? digits: digits - 1));

                return;
            }

            let duration = this.#match(DURATION_PATTERN);

            if (duration) {
                this.#index += duration[0].length;

                let [, first, second, third] = duration,
                    milliseconds = (undefined === third
                        ? (Number(first) * MS_PER_MINUTE) + (Number(second) * MS_PER_SECOND)
                        : (Number(first) * MS_PER_HOUR) + (Number(second) * MS_PER_MINUTE) + (Number(third) * MS_PER_SECOND));

                this.#emit(TokenType.DURATION, start, this.#index, milliseconds);

                return;
            }

            let number = this.#match(NUMBER_PATTERN);

            if (!number)
                this.#fail(`Malformed number near ${ JSON.stringify(this.#source.slice(start, start + 8)) }`, start);

            this.#index += number[0].length;
            this.#emit(TokenType.NUMBER, start, this.#index, Number(number[0]));
        }

        /** A bare `:` — a `when` case label.
         *
         * Durations are claimed at the leading digit and permission segments at the leading
         * `+`, so a `:` that reaches this branch can only be a case label. The one exception
         * is the retired `:kappa:` emote spelling, which is refused with a pointer at the
         * plain-text form. */
        #scanColon() {
            let start = this.#index,
                emote = this.#match(EMOTE_PATTERN);

            if (emote)
                this.#fail(`Emotes are plain text: write '${ emote[1] }', not ":${ emote[1] }:"`, start, start + emote[0].length);

            ++this.#index;
            this.#emit(TokenType.COLON, start, this.#index);
        }

        /** `+read:datetime` — a permission grant. Legal only in a `using` header, but that
         * is the parser's rule to enforce; the tokenizer's job is to refuse the *other*
         * readings of `+` outright, so nobody mistakes this language for one with sums. */
        #scanPermission() {
            let start = this.#index,
                grant = this.#match(PERMISSION_PATTERN);

            if (!grant)
                this.#fail('Unexpected "+"; TTV DSL has no arithmetic. `+name` grants a permission and is only legal in a `using` header.', start, start + 1);

            if (PERMISSION_TAIL.test(this.#source.slice(start + grant[0].length)))
                this.#fail('Malformed permission; write `+action:resource`, with parts separated by "." and an optional final ".*" — e.g. "+read:html.*"', start, start + grant[0].length + 1);

            this.#index += grant[0].length;
            this.#emit(TokenType.PERMISSION, start, this.#index, grant[1]);
        }

        /** `&Date.now` — the path only. The argument list is grammar, so the parser reads
         * it; nothing here ever turns text into code. */
        #scanJSPath() {
            let start = this.#index,
                path = this.#match(JS_PATH_PATTERN);

            if (!path)
                this.#fail('Unexpected "&"; expected a host call like "&Date.now()"', start, start + 1);

            this.#index += path[0].length;
            this.#emit(TokenType.JS_PATH, start, this.#index, path[1].split('.'));
        }

        /** `%`, `%n%s`, `%d%s`, … — one token carrying the whole class run. */
        #scanPercent() {
            let start = this.#index,
                run = this.#match(PERCENT_PATTERN);

            this.#index += run[0].length;

            // `run[0]` is `%` followed by `X%Y%Z`; dropping the leading `%` and splitting on
            // the remaining ones leaves the letters, and leaves `[]` for a bare `%`.
            let letters = run[0].slice(1).split('%').filter(entry => entry.length > 0);

            this.#emit(TokenType.PERCENT, start, this.#index, letters);
        }

        /** `<|` (pipe). */
        #scanAngle() {
            let start = this.#index;

            if ('|' === this.#source[start + 1]) {
                this.#index += 2;
                this.#emit(TokenType.PIPE, start, this.#index);

                return;
            }

            if (this.#match(OLD_BADGE_PATTERN))
                return this.#failOldBadge();

            this.#fail('Unexpected "<"; expected the pipe operator "<|"', start);
        }

        /** `--` + whitespace is a description marker; anything glued to it is refused. */
        #scanDoubleDash() {
            let start = this.#index,
                next = this.#source[start + 2];

            if (undefined === next || /\s/.test(next)) {
                this.#index += 2;
                this.#emit(TokenType.DESCRIBE, start, this.#index);

                return;
            }

            return this.#failOldBadge();
        }

        /** Refuses a retired badge spelling, naming the current one. */
        #failOldBadge() {
            let start = this.#index,
                old = this.#match(OLD_BADGE_PATTERN);

            if (!old)
                this.#fail('Unexpected "--"; TTV DSL has no decrement', start, start + 2);

            let name = (old[1] ?? old[2]);

            this.#fail(`Badges are written "[${ name }]", not "${ old[0] }"`, start, start + old[0].length);
        }

        /** `[moderator]` / `[vip moderator]` / `[vip, sub-gifter]` — one token whose value
         * is the list of names. Several names mean "any of these". */
        #scanBadge() {
            let start = this.#index,
                list = this.#match(BADGE_LIST_PATTERN);

            if (!list)
                this.#fail('Unclosed "["; a badge list is written "[moderator]" or "[vip moderator]" on one line', start, start + 1);

            let names = list[1].split(/[\s,]+/).filter(entry => entry.length > 0);

            if (!names.length)
                this.#fail('Empty badge list; write a badge name inside, e.g. "[moderator]"', start, start + list[0].length);

            for (let name of names)
                if (!BADGE_NAME_PATTERN.test(name))
                    this.#fail(`${ JSON.stringify(name) } is not a badge name`, start, start + list[0].length);

            this.#index += list[0].length;
            this.#emit(TokenType.SELECTOR_BADGE, start, this.#index, names);
        }

        /** `...`, `..`, or `.prop`. */
        #scanDot() {
            let start = this.#index;

            if ('.' === this.#source[start + 1] && '.' === this.#source[start + 2]) {
                this.#index += 3;
                this.#emit(TokenType.RANGE_INCLUSIVE, start, this.#index);

                return;
            }

            if ('.' === this.#source[start + 1]) {
                this.#index += 2;
                this.#emit(TokenType.RANGE_EXCLUSIVE, start, this.#index);

                return;
            }

            let name = IDENT_PATTERN.exec(this.#source.slice(start + 1));

            if (!name)
                this.#fail('Unexpected "."; expected a property name, ".." or "..."', start);

            this.#index += 1 + name[0].length;
            this.#emit(TokenType.SELECTOR_CONTEXT, start, this.#index, name[0]);
        }

        /** `#` (this channel) or `#prop`. */
        #scanHash() {
            let start = this.#index,
                name = IDENT_PATTERN.exec(this.#source.slice(start + 1));

            if (!name) {
                ++this.#index;
                this.#emit(TokenType.SELECTOR_SELF, start, this.#index, null);

                return;
            }

            this.#index += 1 + name[0].length;
            this.#emit(TokenType.SELECTOR_PROP, start, this.#index, name[0]);
        }

        /** `/` (this channel) or `/channel`. The `//` case was already taken by comments. */
        #scanSlash() {
            let start = this.#index,
                name = PATH_PATTERN.exec(this.#source.slice(start + 1));

            if (!name) {
                ++this.#index;
                this.#emit(TokenType.SELECTOR_SELF, start, this.#index, null);

                return;
            }

            this.#index += 1 + name[0].length;
            this.#emit(TokenType.SELECTOR_CHANNEL, start, this.#index, name[0]);
        }

        /** `@user`. */
        #scanUser() {
            let start = this.#index,
                name = PATH_PATTERN.exec(this.#source.slice(start + 1));

            if (!name)
                this.#fail('Unexpected "@"; expected a user name like "@ephellon"', start);

            this.#index += 1 + name[0].length;
            this.#emit(TokenType.SELECTOR_USER, start, this.#index, name[0]);
        }

        /** A keyword, a realm selector (`DISCORD/123`), or a bare identifier. */
        #scanWord() {
            let start = this.#index,
                word = this.#match(IDENT_PATTERN)[0];

            this.#index += word.length;

            let keyword = KEYWORDS[word];

            if (undefined !== keyword) {
                this.#emit(keyword, start, this.#index);

                if (TokenType.CALC === keyword)
                    this.#calcPending = true;

                return;
            }

            let isUpper = UPPER_PATTERN.test(word);

            // `DISCORD/779741119520571456` — an all-caps word glued directly to a path is a
            // realm selector. The `//` guard keeps `TWITCH// note` reading as a comment.
            if (isUpper && '/' === this.#source[this.#index] && '/' !== this.#source[this.#index + 1]) {
                let path = PATH_PATTERN.exec(this.#source.slice(this.#index + 1));

                if (path) {
                    this.#index += 1 + path[0].length;
                    this.#emit(TokenType.SELECTOR_REALM, start, this.#index, { realm: word, path: path[0] });

                    return;
                }
            }

            this.#emit(TokenType.IDENT, start, this.#index, word, { isUpper });
        }

        /** `+ - * / % **` inside `calc( ... )`. */
        #scanArithmetic() {
            let start = this.#index,
                operator = ('**' === this.#source.slice(start, start + 2)? '**': this.#source[start]);

            this.#index += operator.length;
            this.#emit(TokenType.ARITH, start, this.#index, operator);
        }

        /** Any remaining fixed lexeme, matched longest-first out of {@link PUNCTUATORS}. */
        #scanPunctuator() {
            let start = this.#index,
                rest = this.#source.slice(start);

            for (let { lexeme, type } of PUNCTUATORS) {
                if (!rest.startsWith(lexeme))
                    continue;

                this.#index += lexeme.length;

                if (TokenType.LPAREN === type) {
                    ++this.#brackets;

                    if (this.#calcPending) {
                        this.#calcPending = false;
                        this.#calcDepths.push(this.#brackets);
                    }
                } else if (TokenType.RPAREN === type) {
                    if (this.#calcDepths[this.#calcDepths.length - 1] === this.#brackets)
                        this.#calcDepths.pop();

                    if (--this.#brackets < 0)
                        this.#fail('Unmatched ")"', start, this.#index);
                }

                this.#emit(type, start, this.#index);

                return;
            }

            this.#fail(`Unexpected character ${ JSON.stringify(this.#source[start]) }`, start, start + 1);
        }

        // -- strings and templates --------------------------------------------

        /** A quoted string. Does not span lines.
         * @param {String} [quote = '"'] - the delimiter, `"` or `'`
         */
        #scanString(quote = '"') {
            let start = this.#index,
                text = '';

            ++this.#index;

            while (true) {
                if (this.#index >= this.#length || '\n' === this.#source[this.#index])
                    this.#fail('Unterminated string', start, this.#index);

                let character = this.#source[this.#index];

                if ('\\' === character) {
                    text += this.#readEscape();

                    continue;
                }

                ++this.#index;

                if (character === quote)
                    break;

                text += character;
            }

            this.#emit(TokenType.STRING, start, this.#index, text);
        }

        /** A backtick template.
         *
         * Emits a single `TEMPLATE` token whose value is `{ quasis, expressions }`, where
         * `quasis` are the decoded literal chunks (always one more than `expressions`) and
         * each expression is `{ source, offset }` — the raw substring plus its absolute
         * offset in the file. The parser re-parses those substrings with that offset as its
         * origin, so interpolated code reports real file positions. Re-lexing inline would
         * have meant threading template state through every branch above. */
        #scanTemplate() {
            let start = this.#index,
                quasis = [],
                expressions = [],
                chunk = '';

            ++this.#index;

            while (true) {
                if (this.#index >= this.#length)
                    this.#fail('Unterminated template literal', start, this.#length);

                let character = this.#source[this.#index];

                if ('\\' === character) {
                    chunk += this.#readEscape();

                    continue;
                }

                if ('`' === character) {
                    ++this.#index;

                    break;
                }

                if ('$' === character && '{' === this.#source[this.#index + 1]) {
                    let open = this.#index + 2,
                        close = this.#skipInterpolation(open);

                    // An unterminated `${` is literal text, not a fault — a chat message
                    // that mentions `${` is ordinary. Note that a *matched* `${ … }` stays
                    // an interpolation and stays an error when its contents are
                    // ungrammatical: degrading that to text would silently swallow real
                    // typos, and the escape idiom `${ "${x}" }` only means anything if the
                    // outer, matched pair is genuinely evaluated.
                    if (close < 0) {
                        chunk += '${';
                        this.#index += 2;

                        continue;
                    }

                    quasis.push(chunk);
                    chunk = '';

                    expressions.push({
                        source: this.#source.slice(open, close),
                        offset: this.#originOffset + open,
                    });

                    this.#index = close + 1;

                    continue;
                }

                chunk += character;
                ++this.#index;
            }

            quasis.push(chunk);
            this.#emit(TokenType.TEMPLATE, start, this.#index, { quasis, expressions });
        }

        /** Finds the `}` that closes an interpolation opened just before `from`.
         *
         * Tracks brace depth while stepping over nested strings, nested templates (which
         * may themselves interpolate) and line comments, so a `}` inside `` `a}b` `` does
         * not close the interpolation early.
         * @param {Number} from - index of the first character of the expression
         * @return {Number} index of the closing `}`, or `-1` when there is none
         */
        #skipInterpolation(from) {
            let index = from,
                depth = 1;

            while (index < this.#length) {
                let character = this.#source[index];

                if ('"' === character || '\'' === character || '`' === character) {
                    let past = this.#skipQuoted(index);

                    // A quote that never closes means this `${` cannot be shown to have a
                    // matching `}` either, so it is text — `\`cost: ${ dollars\`` is an
                    // ordinary message, not a broken interpolation.
                    if (past < 0)
                        return -1;

                    index = past;

                    continue;
                }

                if ('/' === character && '/' === this.#source[index + 1]) {
                    while (index < this.#length && '\n' !== this.#source[index])
                        ++index;

                    continue;
                }

                if ('{' === character) {
                    ++depth;
                } else if ('}' === character) {
                    --depth;

                    if (0 === depth)
                        return index;
                }

                ++index;
            }

            return -1;
        }

        /** Steps over a complete string or template beginning at `from`.
         *
         * Only ever called while looking for the `}` of an interpolation, so an unterminated
         * quote is not a fault here — it is evidence that the `${` was never an
         * interpolation at all. The caller turns that into literal text.
         * @param {Number} from - index of the opening quote or backtick
         * @return {Number} index just past the closing quote, or `-1` when there is none
         */
        #skipQuoted(from) {
            let quote = this.#source[from],
                index = from + 1;

            while (index < this.#length) {
                let character = this.#source[index];

                if ('\\' === character) {
                    index += 2;

                    continue;
                }

                if (character === quote)
                    return index + 1;

                if ('`' === quote && '$' === character && '{' === this.#source[index + 1]) {
                    let close = this.#skipInterpolation(index + 2);

                    // Same rule as `#scanTemplate`: no closing brace means those two
                    // characters were text, so step over them and keep looking for the
                    // backtick.
                    index = (close < 0? index + 2: close + 1);

                    continue;
                }

                ++index;
            }

            return -1;
        }

        /** Consumes a backslash escape at the cursor.
         * @return {String} the decoded character
         */
        #readEscape() {
            let start = this.#index;

            if (start + 1 >= this.#length)
                this.#fail('Trailing "\\" at end of input', start);

            let character = this.#source[start + 1];

            this.#index += 2;

            // `é` / `\u{1F49C}` — JavaScript's two Unicode spellings.
            if ('u' === character)
                return this.#readUnicodeEscape(start);

            return (ESCAPES[character] ?? character);
        }

        /** The rest of a `\u` escape, the cursor just past the `u`.
         * @param {Number} start - where the backslash was, for the error span
         * @return {String}
         */
        #readUnicodeEscape(start) {
            let braced = /^\{([0-9A-Fa-f]{1,6})\}/.exec(this.#source.slice(this.#index)),
                plain = /^[0-9A-Fa-f]{4}/.exec(this.#source.slice(this.#index)),
                hex = (braced? braced[1]: plain?.[0]);

            if (!hex || parseInt(hex, 16) > 0x10FFFF)
                this.#fail('Malformed Unicode escape; write "\\u00e9" (four hex digits) or "\\u{1F49C}"', start, this.#index + 1);

            this.#index += (braced? braced[0]: plain[0]).length;

            return String.fromCodePoint(parseInt(hex, 16));
        }
    }

    /** Scans TTV DSL source into a token stream.
     * @param {String} source
     * @param {Object} [options] - forwarded to {@link Tokenizer}
     * @return {Array<Object>}
     * @throws {DSLSyntaxError}
     */
    let tokenize = (source, options) => new Tokenizer(source, options).tokenize();

    globalThis.TTV_DSL.tokenizer = { Tokenizer, tokenize, makeLocator };
    globalThis.TTV_DSL.tokenize = tokenize;
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
