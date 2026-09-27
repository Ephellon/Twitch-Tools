/*** /dsl/tokens.js - Token types, keywords, punctuators, and the operator table
 *   _______   ____   _  __ ______  _   _   _____              _   _____
 *  |__   __| / __ \ | |/ /|  ____|| \ | | / ____|            | | / ____|
 *     | |   | |  | || ' / | |__   |  \| || (___              | || (___
 *     | |   | |  | ||  <  |  __|  | . ` | \___ \         _   | | \___ \
 *     | |   | |__| || . \ | |____ | |\  | ____) |   _   | |__| | ____) |
 *     |_|    \____/ |_|\_\|______||_| \_||_____/   (_)   \____/ |_____/
 */

/** @file Defines the lexical vocabulary of the TTV DSL: the frozen token-type enum,
 * the keyword map, the maximal-munch punctuator table, and the operator
 * precedence/associativity table that drives the parser's precedence climbing.
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

globalThis.TTV_DSL ??= {};

(() => {
    /** Every token type the tokenizer can emit.
     *
     * Frozen so a typo (`TokenType.AWAT`) reads as `undefined` and fails loudly at the
     * comparison site rather than silently creating a new property.
     * @enum {String}
     */
    const TokenType = Object.freeze({
        // -- structural -------------------------------------------------------
        /** A logical end-of-line. Emitted *even inside brackets* — `any from ( ... )`
         * separates its items by newline, so they carry meaning everywhere. */
        NEWLINE: 'NEWLINE',
        /** An increase in the leading-whitespace level. Suppressed inside brackets. */
        INDENT: 'INDENT',
        /** A decrease in the leading-whitespace level. Suppressed inside brackets. */
        DEDENT: 'DEDENT',
        /** End of input. Always the final token. */
        EOF: 'EOF',

        // -- keywords ---------------------------------------------------------
        AWAIT: 'AWAIT',
        WITH: 'WITH',
        USING: 'USING',
        IF: 'IF',
        GOTO: 'GOTO',
        ANY: 'ANY',
        FROM: 'FROM',
        WHERE: 'WHERE',
        IS: 'IS',
        IN: 'IN',
        AND: 'AND',
        OR: 'OR',
        NOT: 'NOT',
        TRUE: 'TRUE',
        FALSE: 'FALSE',
        /** `when` — both the switch head and the `if`-chain continuation. */
        WHEN: 'WHEN',
        /** `calc` — opens an arithmetic group: `calc( .raid_size * 2 + 1 )`. */
        CALC: 'CALC',
        /** `+ - * / % **` — an arithmetic operator. Only ever emitted **inside** the
         * parentheses of a `calc( ... )`; everywhere else those characters keep their
         * ordinary meanings. `value` is the operator. */
        ARITH: 'ARITH',
        /** `after <duration>` — a one-shot timer. `await <duration>` repeats; `after` fires
         * once. */
        AFTER: 'AFTER',
        /** `else` — the unconditional last branch of an `if`/`when` chain. Takes no test of
         * its own, so `else if` and `else when` are errors rather than shorthands. */
        ELSE: 'ELSE',
        /** `above` / `below` — the numeric comparisons. Only legal after `is` or `is or`
         * (`.raid_size is or above 50` is `>=`); the lexeme says which one. */
        COMPARE: 'COMPARE',
        /** A word reserved purely so that using it produces a *helpful* error instead of a
         * generic one: `elif`, `elseif`, `switch`, `case`, `default`. The parser keys its
         * diagnostic off the lexeme. */
        RESERVED: 'RESERVED',

        // -- literals ---------------------------------------------------------
        /** An integer or float; `value` is a `Number`. */
        NUMBER: 'NUMBER',
        /** A double-quoted string; `value` is the decoded text. */
        STRING: 'STRING',
        /** A backtick template. `value` is `{ quasis, expressions }` — see the tokenizer. */
        TEMPLATE: 'TEMPLATE',
        /** `15:00` / `1:30:00`; `value` is the duration in milliseconds. */
        DURATION: 'DURATION',
        /** `1st` / `-2nd` / `3th`; `value` is the converted 0-based index. */
        ORDINAL: 'ORDINAL',
        /** `*`. Always the wildcard literal — the DSL has no multiplication operator. */
        WILDCARD: 'WILDCARD',

        // -- selectors --------------------------------------------------------
        /** `#` or `/` standing alone: the current channel. */
        SELECTOR_SELF: 'SELECTOR_SELF',
        /** `#prop`: a property of the current channel. */
        SELECTOR_PROP: 'SELECTOR_PROP',
        /** `/name`: the channel called "name". */
        SELECTOR_CHANNEL: 'SELECTOR_CHANNEL',
        /** `DISCORD/123`: a realm-qualified subject; `value` is `{ realm, path }`. */
        SELECTOR_REALM: 'SELECTOR_REALM',
        /** `[moderator]` / `[vip moderator]`: badges the subject in scope may hold. `value`
         * is the list of names; several mean "any of these". */
        SELECTOR_BADGE: 'SELECTOR_BADGE',
        /** `@user`: a user in the current channel. */
        SELECTOR_USER: 'SELECTOR_USER',
        /** `.prop`: a property of the nearest enclosing `using`/`await`/`where` subject. */
        SELECTOR_CONTEXT: 'SELECTOR_CONTEXT',

        // -- operators & punctuators -----------------------------------------
        /** `<|` — feed the right-hand collection into the left-hand accessor. */
        PIPE: 'PIPE',
        /** `..` — exclusive range. */
        RANGE_EXCLUSIVE: 'RANGE_EXCLUSIVE',
        /** `...` — inclusive range. */
        RANGE_INCLUSIVE: 'RANGE_INCLUSIVE',
        /** `-` — unary negation (binary subtraction is still unclaimed). */
        MINUS: 'MINUS',
        LPAREN: 'LPAREN',
        RPAREN: 'RPAREN',

        /** `->` — bind the value on the left into the **current** scope. */
        ARROW_LOCAL: 'ARROW_LOCAL',
        /** `=>` — bind the value on the left into the **parent** scope, which makes it
         * visible to later siblings as well as to descendants. */
        ARROW_PARENT: 'ARROW_PARENT',
        /** `=` — the case-sensitivity prefix, as in `is ='TeXt'`. A prefix on an operand,
         * never a binary operator; the DSL has no assignment-by-equals. */
        EXACT: 'EXACT',
        /** `%`, `%n%s`, `%d%s` … — the regex-replacement operator. `value` is the array of
         * class letters, empty for a bare `%`. */
        PERCENT: 'PERCENT',
        /** `~` — the format operator: `wait_time ~ "hh?:mm:ss"`. */
        FORMAT: 'FORMAT',
        /** `,` — an *optional* item separator. Never required, never meaningful between
         * statements. */
        COMMA: 'COMMA',
        /** A `:` that is neither a duration nor an emote: a `when` case label. The
         * tokenizer no longer refuses it — the parser owns the diagnostic, because only the
         * parser knows which of the four readings was expected. */
        COLON: 'COLON',
        /** `+read:datetime` — a permission grant. `value` is the bare name. */
        PERMISSION: 'PERMISSION',
        /** `&datetime.now` — a dotted host-binding path. `value` is the array of segments. */
        JS_PATH: 'JS_PATH',
        /** `--` followed by whitespace — introduces the description at the end of a `using`
         * header: `using +eval:calc -- "why this block needs it"`. */
        DESCRIBE: 'DESCRIBE',

        /** A bare word. Carries an `isUpper` flag; the *parser* decides verb-vs-constant
         * by position, which keeps the verb registry open-ended. */
        IDENT: 'IDENT',
    });

    /** Reserved words, mapped to their token type.
     *
     * Note that `where`, `is`, `in`, `and`, `or` and `not` are *operators* spelled as
     * words; they appear both here and in {@link OPERATORS}.
     * @type {Object<String, String>}
     */
    const KEYWORDS = Object.freeze({
        await: TokenType.AWAIT,
        with: TokenType.WITH,
        using: TokenType.USING,
        if: TokenType.IF,
        goto: TokenType.GOTO,
        any: TokenType.ANY,
        from: TokenType.FROM,
        where: TokenType.WHERE,
        // `of` and `<|` are one operator with two spellings, as are `where` and `|`. Both
        // pairs share a token type rather than being normalized later, so neither spelling
        // can ever drift from the other in precedence or meaning.
        of: TokenType.PIPE,
        is: TokenType.IS,
        in: TokenType.IN,
        and: TokenType.AND,
        or: TokenType.OR,
        not: TokenType.NOT,
        true: TokenType.TRUE,
        false: TokenType.FALSE,
        when: TokenType.WHEN,
        after: TokenType.AFTER,
        else: TokenType.ELSE,

        // `is above 50` / `is or above 50`. The inclusive form reuses `or` rather than
        // minting `above_or`, so the line reads as the sentence it is.
        above: TokenType.COMPARE,
        below: TokenType.COMPARE,

        // Reserved solely to produce a better error than "expected a statement". `when` and
        // `else` cover every branching shape this language has, and `calc` is the
        // placeholder arithmetic will eventually be spelled with; a script that reaches for
        // the JavaScript-shaped word should be told where to look instead of being told
        // that its own variable name is unparseable.
        elif: TokenType.RESERVED,
        elseif: TokenType.RESERVED,
        switch: TokenType.RESERVED,
        case: TokenType.RESERVED,
        default: TokenType.RESERVED,
        calc: TokenType.CALC,
    });

    /** Every reserved word as a `Set`, for membership tests. */
    const KEYWORD_SET = Object.freeze(new Set(Object.keys(KEYWORDS)));

    /** Simple punctuators, **sorted longest-first**.
     *
     * Sorting is done here, once, rather than being maintained by hand — so a scanner
     * that walks this array and takes the first `startsWith` hit is maximal-munch by
     * construction. Adding `..<` tomorrow cannot break `..`.
     *
     * Context-sensitive lexemes are *not* in this table; the tokenizer has dedicated
     * branches that run first for `//` (comment, which must beat `/channel`), `"`, `'` and
     * `` ` `` (string/template), `:` (duration vs. emote vs. case label), `<` (pipe vs.
     * badge), `.` (range vs. context property), `%` (class run), `+` (permission), `$`
     * (host path) and digits (ordinal vs. number).
     *
     * The v2 additions are conflict-free *by construction* rather than by inspection:
     * `=>` outranks `=` and `->` outranks `-` because the sort puts them first, and `<|`
     * never reaches this table at all — it is claimed at the `<` branch — so a bare `|`
     * may safely live here as the `where` alias.
     * @type {Array<{ lexeme: String, type: String }>}
     */
    const PUNCTUATORS = Object.freeze([
        { lexeme: '...', type: TokenType.RANGE_INCLUSIVE },
        { lexeme: '..', type: TokenType.RANGE_EXCLUSIVE },
        { lexeme: '<|', type: TokenType.PIPE },
        { lexeme: '=>', type: TokenType.ARROW_PARENT },
        { lexeme: '->', type: TokenType.ARROW_LOCAL },
        { lexeme: '(', type: TokenType.LPAREN },
        { lexeme: ')', type: TokenType.RPAREN },
        { lexeme: '*', type: TokenType.WILDCARD },
        { lexeme: '-', type: TokenType.MINUS },
        { lexeme: '=', type: TokenType.EXACT },
        { lexeme: ',', type: TokenType.COMMA },
        { lexeme: '~', type: TokenType.FORMAT },
        // `|` is spelled differently from `where` and means exactly `where`. Mapping it to
        // the same token type — rather than giving it its own — is what guarantees the two
        // spellings can never drift apart in precedence, associativity or AST shape.
        { lexeme: '|', type: TokenType.WHERE },
    ].sort((a, b) => b.lexeme.length - a.lexeme.length));

    /** Associativity markers. `NONE` means chaining is a parse error. */
    const Associativity = Object.freeze({
        LEFT: 'LEFT',
        RIGHT: 'RIGHT',
        NONE: 'NONE',
    });

    /** The lowest precedence a binary operator can have. Used by the parser as the
     * starting floor for precedence climbing. */
    const LOWEST_PRECEDENCE = 0;

    /** Precedence of unary `not` / `-` / `=`. Higher binds tighter. */
    const UNARY_PRECEDENCE = 8;

    /** Precedence of member/sigil access — tighter than every operator, so a postfix
     * accessor never needs to consult this table. */
    const ACCESS_PRECEDENCE = 9;

    /** Binary operator table, keyed by token type.
     *
     * Precedence runs low (loosest) to high (tightest):
     *
     * | # | Operator      | Assoc | Meaning                            |
     * |---|---------------|-------|------------------------------------|
     * | 1 | `or`          | left  | logical disjunction                |
     * | 2 | `and`         | left  | logical conjunction                |
     * | 3 | `is` / `in`   | none  | equality / membership              |
     * | 4 | `%…` / `~`    | left  | replacement, list join / format    |
     * | 5 | `<|`          | left  | pipe                               |
     * | 6 | `where` (`|`) | left  | filter                             |
     * | 7 | `..` / `...`  | none  | exclusive / inclusive range        |
     * | 8 | `not`/`-`/`=` | —     | unary                              |
     * | 9 | member access | —     | sigil / property access            |
     *
     * `where` deliberately binds **tighter** than `<|`, so
     * `1st <| .links where ("twitch.tv" in .href)` groups as
     * `1st <| (.links where ("twitch.tv" in .href))` — the filter applies to the
     * collection, then the ordinal indexes the filtered result.
     *
     * `%` sits *looser* than `<|` and *tighter* than `is`, which is the only placement that
     * makes both of the shapes the language actually uses read correctly:
     * `1st <| .links % ','` groups as `(1st <| .links) % ','` — join what the pipe
     * selected, not pipe into a joined string — while `.message % '' is "x"` compares the
     * already-replaced text rather than replacing a boolean.
     *
     * `is` and `in` are non-associative: `a is b is c` is rejected rather than being
     * silently read as `(a is b) is c`, which would compare a boolean against `c`.
     *
     * Assignment (`->` / `=>`) is deliberately **absent** from this table. Its right-hand
     * side is a bare name, not an expression, so precedence climbing has nothing to climb;
     * the parser handles it as a tail pass gated on the outermost precedence level, which
     * makes it the loosest operator in the language for free and keeps every row here
     * honest about being a real binary operator over two expressions.
     * @type {Object<String, { precedence: Number, associativity: String, lexeme: String }>}
     */
    const OPERATORS = Object.freeze({
        [TokenType.OR]: { precedence: 1, associativity: Associativity.LEFT, lexeme: 'or' },
        [TokenType.AND]: { precedence: 2, associativity: Associativity.LEFT, lexeme: 'and' },
        [TokenType.IS]: { precedence: 3, associativity: Associativity.NONE, lexeme: 'is' },
        [TokenType.IN]: { precedence: 3, associativity: Associativity.NONE, lexeme: 'in' },
        [TokenType.PERCENT]: { precedence: 4, associativity: Associativity.LEFT, lexeme: '%' },
        [TokenType.FORMAT]: { precedence: 4, associativity: Associativity.LEFT, lexeme: '~' },
        [TokenType.PIPE]: { precedence: 5, associativity: Associativity.LEFT, lexeme: '<|' },
        [TokenType.WHERE]: { precedence: 6, associativity: Associativity.LEFT, lexeme: 'where' },
        [TokenType.RANGE_EXCLUSIVE]: { precedence: 7, associativity: Associativity.NONE, lexeme: '..' },
        [TokenType.RANGE_INCLUSIVE]: { precedence: 7, associativity: Associativity.NONE, lexeme: '...' },
    });

    /** Token types that may begin a unary expression. */
    const UNARY_OPERATORS = Object.freeze(new Set([TokenType.NOT, TokenType.MINUS, TokenType.EXACT]));

    /** Token types that introduce a statement. The parser keys its dispatch map on these.
     *
     * `WITH` appears here as well as inside `await`'s own grammar. The two readings never
     * compete: `await … with (…)` consumes its `with` on the same line, before a block can
     * open, so a `with` that reaches statement position is unambiguously the block form. */
    const STATEMENT_KEYWORDS = Object.freeze(new Set([
        TokenType.AWAIT,
        TokenType.USING,
        TokenType.IF,
        TokenType.GOTO,
        TokenType.WHEN,
        TokenType.AFTER,
        TokenType.ELSE,
        TokenType.WITH,
    ]));

    /** Names that denote the current subject rather than a host constant. All four are
     * read-only: none may appear on the right of a binding arrow. */
    const THIS_ALIASES = Object.freeze(new Set(['_', '__this__', '__self__', '__me__']));

    /** The presence tests, by the `kind` their `Wildcard` node carries. `*` is `ANYTHING`.
     *
     * | word        | matches                                 |
     * |-------------|-----------------------------------------|
     * | `ANYTHING`  | any value at all, including `""` / `[]` |
     * | `SOMETHING` | a value that is not `""` / `[]`         |
     * | `NOTHING`   | no value, `""` or `[]`                  |
     */
    const PRESENCE_WORDS = Object.freeze({
        ANYTHING: 'anything',
        SOMETHING: 'something',
        NOTHING: 'nothing',
    });

    /** What `+scope` may be set to, and what a bare `+scope` means. See SPEC §5.5. */
    const SCOPE_MODES = Object.freeze(new Set(['local', 'global', 'universal']));
    const DEFAULT_SCOPE_MODE = 'global';

    /** The shape a *variable* name must have: at least one interior underscore.
     *
     * This is the whole disambiguation between a variable and a host constant, and it is
     * enforced at the binding site only. `USERNAME` and `mod_msg` are lexically identical —
     * nothing but this pattern tells them apart — so a reference site cannot reject
     * anything without also rejecting one of the two legitimate readings. `_x`, `x_` and
     * `x` all fail it, which is exactly why `_`, `__this__` and friends can never be
     * mistaken for variables. */
    const VARIABLE_PATTERN = /^[A-Za-z0-9]+(?:_[A-Za-z0-9]+)+$/;

    /** The class letters a `%` run may carry, plus `c` (the always-on trim flag). */
    const PERCENT_CLASSES = Object.freeze(new Set(['0', 'a', 'A', 'b', 'B', 'd', 'D', 'f', 'n', 'r', 's', 'S', 't', 'v', 'w', 'W', 'c']));

    /** Every selector token type, mapped to the `kind` its AST node carries. */
    const SELECTOR_KINDS = Object.freeze({
        [TokenType.SELECTOR_SELF]: 'channel',
        [TokenType.SELECTOR_CHANNEL]: 'channel',
        [TokenType.SELECTOR_PROP]: 'prop',
        [TokenType.SELECTOR_REALM]: 'realm',
        [TokenType.SELECTOR_BADGE]: 'badge',
        [TokenType.SELECTOR_USER]: 'user',
        [TokenType.SELECTOR_CONTEXT]: 'context',
    });

    /** Looks up the binary operator description for a token type.
     * @param {String} type
     * @return {?Object} `undefined` when the token is not a binary operator
     */
    let getOperator = (type) => OPERATORS[type];

    /** @param {String} type @return {Boolean} */
    let isBinaryOperator = (type) => type in OPERATORS;

    /** @param {String} type @return {Boolean} */
    let isUnaryOperator = (type) => UNARY_OPERATORS.has(type);

    /** @param {String} type @return {Boolean} */
    let isSelector = (type) => type in SELECTOR_KINDS;

    /** Builds a token. Kept here so every producer stamps the same shape.
     * @param {String} type - a {@link TokenType} member
     * @param {String} lexeme - the exact source text consumed
     * @param {*} [value] - the decoded value, when it differs from the lexeme
     * @param {Object} loc - `{ line, column, start, end }`
     * @param {Object} [extra] - additional fields, e.g. `{ isUpper: true }`
     * @return {Object}
     */
    let createToken = (type, lexeme, value, loc, extra) =>
        Object.assign({ type, lexeme, value, loc }, extra);

    globalThis.TTV_DSL.tokens = {
        TokenType,
        KEYWORDS,
        KEYWORD_SET,
        PUNCTUATORS,
        OPERATORS,
        UNARY_OPERATORS,
        STATEMENT_KEYWORDS,
        SELECTOR_KINDS,
        THIS_ALIASES,
        PRESENCE_WORDS,
        SCOPE_MODES,
        DEFAULT_SCOPE_MODE,
        VARIABLE_PATTERN,
        PERCENT_CLASSES,
        Associativity,
        LOWEST_PRECEDENCE,
        UNARY_PRECEDENCE,
        ACCESS_PRECEDENCE,
        getOperator,
        isBinaryOperator,
        isUnaryOperator,
        isSelector,
        createToken,
    };

    globalThis.TTV_DSL.TokenType = TokenType;
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
