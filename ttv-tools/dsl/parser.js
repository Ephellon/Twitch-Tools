/*** /dsl/parser.js - Recursive-descent statements, precedence-climbing expressions
 *   _____             _____    _____  ______  _____               _   _____
 *  |  __ \     /\    |  __ \  / ____||  ____||  __ \             | | / ____|
 *  | |__) |   /  \   | |__) || (___  | |__   | |__) |            | || (___
 *  |  ___/   / /\ \  |  _  /  \___ \ |  __|  |  _  /         _   | | \___ \
 *  | |      / ____ \ | | \ \  ____) || |____ | | \ \    _   | |__| | ____) |
 *  |_|     /_/    \_\|_|  \_\|_____/ |______||_|  \_\  (_)   \____/ |_____/
 */

/** @file Turns a TTV DSL token stream into an AST.
 *
 * Statements go through a `STATEMENT_PARSERS` dispatch map keyed on the leading keyword;
 * expressions go through precedence climbing driven by the `OPERATORS` table in
 * `tokens.js`, so the precedence of `where` relative to `<|` is stated in exactly one
 * place rather than being implied by the shape of a cascade of methods.
 *
 * On a syntax fault the parser records the error and resynchronizes at the next line
 * boundary (skipping the whole indented block if the broken line opened one), so a script
 * with three mistakes reports three errors instead of an avalanche.
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

globalThis.TTV_DSL ??= {};

if (typeof require === 'function' && typeof module === 'object') {
    require('./errors.js');
    require('./tokens.js');
    require('./tokenizer.js');
    require('./ast.js');
}

(() => {
    const { DSLParseError, DSLSyntaxError } = globalThis.TTV_DSL.errors;
    const { TokenType, OPERATORS, SELECTOR_KINDS, Associativity, LOWEST_PRECEDENCE, THIS_ALIASES, PRESENCE_WORDS, SCOPE_MODES, DEFAULT_SCOPE_MODE, VARIABLE_PATTERN } = globalThis.TTV_DSL.tokens;
    const { Tokenizer } = globalThis.TTV_DSL.tokenizer;
    const AST = globalThis.TTV_DSL.ast;
    const { NodeType } = AST;

    /** Token types that never carry meaning between statements.
     *
     * `COMMA` is deliberately **absent**. Commas are ignorable *inside* a list, not between
     * statements — putting one here would let a stray comma on its own line vanish instead
     * of being reported. */
    const SKIPPABLE = new Set([TokenType.NEWLINE]);

    /** Token types that separate items inside a bracketed list, a `using` header or a host
     * call. Newline still separates, exactly as in v1; the comma is merely *additional*, so
     * leading, trailing and repeated commas all collapse to nothing and two templates on one
     * line are still two items. */
    const SEPARATORS = new Set([TokenType.NEWLINE, TokenType.COMMA]);

    /** Builds the expression node for a binary operator. Anything not listed here becomes
     * a plain `BinaryExpression` carrying the operator's lexeme. */
    const BINARY_BUILDERS = {
        [TokenType.PIPE]: (left, right, loc) => AST.pipeExpression(left, right, loc),
        [TokenType.WHERE]: (left, right, loc) => AST.whereExpression(left, right, loc),
        [TokenType.RANGE_EXCLUSIVE]: (left, right, loc) => AST.rangeExpression(left, right, false, loc),
        [TokenType.RANGE_INCLUSIVE]: (left, right, loc) => AST.rangeExpression(left, right, true, loc),
        [TokenType.PERCENT]: (left, right, loc, token) => AST.percentExpression(left, token.value, right, loc),
        [TokenType.FORMAT]: (left, right, loc) => AST.formatExpression(left, right, loc),
    };

    /** The diagnostic each poisoned reserved word produces. They exist for no other reason.
     * @type {Object<String, String>}
     */
    const RESERVED_MESSAGES = {
        elif: '`elif` is not a keyword in TTV DSL; use `when <test>` for the next condition, or `else` for the last one',
        elseif: '`elseif` is not a keyword in TTV DSL; use `when <test>` for the next condition, or `else` for the last one',
        switch: '`switch` is not a keyword in TTV DSL; write `when <expression> is` and indent the cases',
        case: '`case` is not a keyword in TTV DSL; a `when` case is written `<value>:` and indented',
        default: '`default` is not a keyword in TTV DSL; put an `else` after the `when` cases',
    };

    /** Actions whose grants must carry a `-- "description"`: they change the page or run
     * code, and a host asking the viewer to allow them needs something to show. */
    const DESCRIBED_ACTIONS = new Set(['write', 'eval']);

    /** The one diagnostic the tokenizer can no longer produce for `:`, now that a bare colon
     * is a real token. Spelled out here because the parser is the only place that knows all
     * four readings were on the table. */
    const COLON_MESSAGE = 'Unexpected ":"; expected a duration like "15:00", or a `when` case label like `"help":`';

    /** @param {Object} node @return {Boolean} true for a template that still needs evaluating */
    let isInterpolated = (node) => (NodeType.TemplateLiteral === node?.type && node.expressions.length > 0);

    /** @param {Object} node @return {Boolean} true for a statement that continues the chain
     * before it: the `when <test>` form, or `else` */
    let isContinuation = (node) => ((NodeType.WhenStatement === node?.type && null === node.operator) || NodeType.ElseClause === node?.type);

    /** Spans two locations into one.
     * @param {Object} from
     * @param {Object} to
     * @return {Object}
     */
    let span = (from, to) => ({
        line: from.line,
        column: from.column,
        start: from.start,
        end: (to?.end ?? from.end),
    });

    /** Parses one token stream. */
    class Parser {
        #tokens;
        #index = 0;
        #source;
        #errors = [];

        /** Set only while reading a `when` head, where an `is`/`in` with nothing after it is
         * legal and means "switch on this". Everywhere else a dangling comparison is the
         * error it looks like. */
        #danglingAllowed = false;

        /** The dangling comparison token `#parseExpression` stopped at, if any. */
        #dangling = null;

        /** How many indented blocks deep the parser is. `+scope` is a whole-script switch,
         * so it is only legal in a `using` at depth 0. */
        #blockDepth = 0;

        /**
         * @param {Array<Object>} tokens
         * @param {String} source - the text locations refer to, used for code frames
         */
        constructor(tokens, source) {
            this.#tokens = tokens;
            this.#source = source;
        }

        /** Every error collected during the parse. */
        get errors() {
            return this.#errors;
        }

        // -- cursor -----------------------------------------------------------

        /** @param {Number} [ahead = 0] @return {Object} */
        #peek(ahead = 0) {
            let index = this.#index + ahead;

            return this.#tokens[index < this.#tokens.length? index: this.#tokens.length - 1];
        }

        /** @return {Object} */
        #next() {
            let token = this.#peek();

            if (this.#index < this.#tokens.length - 1)
                ++this.#index;

            return token;
        }

        /** @param {...String} types @return {Boolean} */
        #at(...types) {
            return types.includes(this.#peek().type);
        }

        /** Consumes the current token when it matches.
         * @param {String} type
         * @return {?Object}
         */
        #accept(type) {
            return (this.#at(type)? this.#next(): null);
        }

        /** Consumes the current token or fails.
         * @param {String} type
         * @param {String} [what] - a human phrase for the error message
         * @return {Object}
         */
        #expect(type, what) {
            if (this.#at(type))
                return this.#next();

            return this.#fail(`Expected ${ what ?? type }, found ${ this.#describe(this.#peek()) }`);
        }

        /** @param {Object} token @return {String} */
        #describe(token) {
            switch (token.type) {
                case TokenType.EOF:
                    return 'end of input';

                case TokenType.NEWLINE:
                    return 'end of line';

                case TokenType.INDENT:
                    return 'an indented block';

                case TokenType.DEDENT:
                    return 'the end of a block';

                default:
                    return JSON.stringify(token.lexeme);
            }
        }

        /** Raises the tailored diagnostic for a poisoned reserved word. */
        #failReserved(token) {
            return this.#fail(RESERVED_MESSAGES[token.lexeme] ?? `\`${ token.lexeme }\` is reserved`, token);
        }

        /** @param {String} message @param {Object} [token] */
        #fail(message, token) {
            throw new DSLParseError(message, (token ?? this.#peek()).loc, this.#source);
        }

        /** Skips insignificant tokens. */
        #skipNewlines() {
            while (SKIPPABLE.has(this.#peek().type))
                this.#next();
        }

        /** Skips item separators — newlines *and* commas. Used only inside a list context. */
        #skipSeparators() {
            while (SEPARATORS.has(this.#peek().type))
                this.#next();
        }

        /** Panic-mode recovery: discard the rest of the broken line, and the block it
         * opened, so the next statement starts clean. */
        #synchronize() {
            while (!this.#at(TokenType.NEWLINE, TokenType.EOF, TokenType.DEDENT))
                this.#next();

            this.#accept(TokenType.NEWLINE);

            if (!this.#at(TokenType.INDENT))
                return;

            let depth = 0;

            do {
                let type = this.#next().type;

                if (TokenType.INDENT === type)
                    ++depth;
                else if (TokenType.DEDENT === type)
                    --depth;
                else if (TokenType.EOF === type)
                    return;
            } while (depth > 0);
        }

        // -- program and blocks ------------------------------------------------

        /** @return {Object} a `Program` node */
        parseProgram() {
            let start = this.#peek().loc,
                body = this.#parseStatements(TokenType.EOF),
                end = this.#peek().loc;

            return AST.program(body, span(start, end));
        }

        /** Parses statements until `terminator`.
         * @param {String} terminator
         * @return {Array<Object>}
         */
        #parseStatements(terminator) {
            let body = [];

            while (true) {
                this.#skipNewlines();

                if (this.#at(terminator, TokenType.EOF))
                    break;

                // Only a fault can produce a stray INDENT here; a well-formed block was
                // already consumed by whichever statement opened it.
                if (this.#at(TokenType.INDENT)) {
                    this.#record(new DSLParseError('Unexpected indentation', this.#peek().loc, this.#source));
                    this.#synchronize();

                    continue;
                }

                let before = this.#index;

                try {
                    let statement = this.#parseStatement();

                    // The chain form of `when`, and `else`, are written as *siblings* of the
                    // `if` (or `when`) they continue, because that is how they read on the
                    // page. They are folded into that sibling's `alternate` here rather than
                    // being parsed as part of it, so the off-side rule stays uniform: every
                    // branch of a chain sits at the same indentation.
                    if (isContinuation(statement) && this.#foldAlternate(body, statement))
                        continue;

                    body.push(statement);
                } catch (error) {
                    // A `DSLSyntaxError` can arrive here too: a template's `${ ... }` is
                    // tokenized lazily, by the parser, so a lexical fault inside one surfaces
                    // mid-parse. It is recorded and recovered from like any other fault on
                    // the line, rather than escaping a parse that promised to collect.
                    if (!(error instanceof DSLParseError || error instanceof DSLSyntaxError))
                        throw error;

                    this.#record(error);
                    this.#synchronize();

                    // A parser that fails without consuming anything would spin forever.
                    if (this.#index === before)
                        this.#next();
                }
            }

            return body;
        }

        /** Attaches a chain-form `when`, or an `else`, to the innermost open `alternate` of
         * the statement before it.
         * @param {Array<Object>} body - the sibling list parsed so far
         * @param {Object} statement - the chain `when` or the `else`
         * @return {Boolean} true when it was folded away; false leaves the caller to report
         */
        #foldAlternate(body, statement) {
            let previous = body[body.length - 1],
                spelling = (NodeType.ElseClause === statement.type? '`else`': '`when <test>`');

            if (!previous || (NodeType.IfStatement !== previous.type && NodeType.WhenStatement !== previous.type)) {
                this.#record(new DSLParseError(`${ spelling } continues the \`if\` or \`when\` before it, but there is none here; either add one or use \`if\``, statement.loc, this.#source));

                return false;
            }

            let target = previous;

            while (target.alternate)
                target = target.alternate;

            // `else` closes the chain. A branch after it could never run, and silently
            // starting a fresh chain instead would hide that.
            if (NodeType.ElseClause === target.type) {
                this.#record(new DSLParseError(`${ spelling } cannot follow \`else\`; \`else\` is always the last branch of a chain`, statement.loc, this.#source));

                return true;
            }

            target.alternate = statement;

            return true;
        }

        /** @param {DSLParseError} error */
        #record(error) {
            this.#errors.push(error);
        }

        /** Parses the indented block belonging to the statement just read, if there is one.
         * @return {?Object} a `Block` node, or null when the statement has no body
         */
        #parseBlock() {
            this.#expect(TokenType.NEWLINE, 'end of line');

            if (!this.#at(TokenType.INDENT))
                return null;

            let open = this.#next().loc,
                body;

            ++this.#blockDepth;

            try {
                body = this.#parseStatements(TokenType.DEDENT);
            } finally {
                --this.#blockDepth;
            }

            let close = this.#peek().loc;

            this.#accept(TokenType.DEDENT);

            return AST.block(body, span(open, close));
        }

        // -- statements --------------------------------------------------------

        /** @return {Object} */
        #parseStatement() {
            let token = this.#peek(),
                parse = this.#statementParsers[token.type];

            if (parse)
                return parse.call(this, token);

            // Caught before anything else: `else`/`switch`/`calc` in statement position are
            // exactly the mistakes a reader arriving from another language makes, and the
            // generic "expected a statement" tells them nothing.
            if (TokenType.RESERVED === token.type)
                return this.#failReserved(token);

            // An all-caps bare word in statement position is a verb call. The decision is
            // made here, by position, rather than in the lexer — so the host can register
            // new verbs without touching the language.
            if (TokenType.IDENT === token.type && token.isUpper)
                return this.#parseVerbStatement(token);

            return this.#parseExpressionStatement(token);
        }

        /** A line whose only job is to bind a name, e.g. `any from ( ... ) -> mod_msg`.
         *
         * Deliberately narrow: the expression is parsed speculatively and *only* an
         * assignment is accepted. A bare expression on a line remains an error, because a
         * language whose statements are verbs has no use for a value nobody reads, and
         * accepting one would turn every misspelled verb into a silent no-op.
         */
        #parseExpressionStatement(token) {
            let before = this.#index,
                expression = null;

            try {
                expression = this.#parseExpression();
            } catch (error) {
                if (!(error instanceof DSLParseError))
                    throw error;

                this.#index = before;

                throw error;
            }

            // A host call may stand alone too: `&Html.setText("#title", "hi")` is done for
            // what it does, exactly as a verb is.
            if (NodeType.AssignmentExpression !== expression.type && NodeType.JSInvokeExpression !== expression.type) {
                this.#index = before;

                return this.#fail(`Expected a statement, found ${ this.#describe(token) }`);
            }

            this.#expect(TokenType.NEWLINE, 'end of line');

            return AST.expressionStatement(expression, span(token.loc, expression.loc));
        }

        /** `await <subject> [with <filter>]` */
        #parseAwaitStatement(token) {
            this.#next();

            let subject = this.#parseExpression(),
                filter = null;

            if (this.#accept(TokenType.WITH))
                filter = this.#parseExpression();

            let body = this.#parseBlock();

            return AST.awaitStatement(subject, filter, body, span(token.loc, (body ?? filter ?? subject).loc));
        }

        /** `after <duration> [with <filter>]` + block — fires once. The duration is any
         * expression, read when the statement is reached, so `after wait_time` works. */
        #parseAfterStatement(token) {
            this.#next();

            let subject = this.#parseExpression(),
                filter = null;

            if (this.#accept(TokenType.WITH))
                filter = this.#parseExpression();

            let body = this.#parseBlock();

            if (null === body)
                this.#record(new DSLParseError('`after` has no indented body', token.loc, this.#source));

            return AST.afterStatement(subject, filter, body, span(token.loc, (body ?? filter ?? subject).loc));
        }

        /** `using [<subject> ...] [+permission ...] [+scope[:mode]] [-- "description"]` */
        #parseUsingStatement(token) {
            this.#next();

            let subjects = [],
                permissions = [],
                scopeMode = null,
                description = null,
                dangerous = null;

            // Several subjects may sit on one line — `using <viewer> <everyone> <all>` —
            // with juxtaposition meaning "any of these". Grants may be interleaved with
            // them freely; they are read directly here rather than through
            // `#parseExpression`, which is what keeps a `+permission` from being a valid
            // operand anywhere else in the language.
            while (!this.#at(TokenType.NEWLINE, TokenType.EOF, TokenType.DEDENT)) {
                if (this.#accept(TokenType.COMMA))
                    continue;

                // `-- "why"` — says what the block is for, typically why it asks for the
                // grants it does. Always last: whatever follows the string is an error, so a
                // description can never swallow a subject that was meant to be live.
                if (this.#at(TokenType.DESCRIBE)) {
                    let marker = this.#next(),
                        text = this.#peek();

                    if (TokenType.STRING !== text.type)
                        this.#fail('`--` in a `using` header must be followed by a quoted description, e.g. `-- "needed for the raid timer"`', marker);

                    description = this.#next().value;

                    if (!this.#at(TokenType.NEWLINE, TokenType.EOF, TokenType.DEDENT))
                        this.#fail('A `--` description ends the `using` header; move anything after it before the `--`');

                    break;
                }

                if (this.#at(TokenType.PERMISSION)) {
                    let grant = this.#next();

                    // `+scope` looks like a grant but is a switch: it changes where `->` and
                    // `=>` put names, and grants nothing. Kept out of `permissions` so it can
                    // never satisfy a `requirePermission('scope')`.
                    if ('scope' === grant.value || grant.value.startsWith('scope:'))
                        scopeMode = this.#readScopeMode(grant, scopeMode);
                    else
                        permissions.push(grant.value);

                    if (null === dangerous && DESCRIBED_ACTIONS.has(grant.value.split(':')[0]))
                        dangerous = grant;

                    continue;
                }

                subjects.push(this.#parseExpression());
            }

            // A grant that can change the page or run code has to say why, in the header
            // itself — that text is what a host shows when it asks the viewer to allow it.
            if (null !== dangerous && null === description)
                this.#fail(`\`+${ dangerous.value }\` needs a description saying why: end the header with \`-- "..."\``, dangerous);

            // A header with no subject keeps the current one. That is what lets a grant or
            // a `+scope` switch stand on its own, without dragging a subject change in.
            if (!subjects.length && !permissions.length && null === scopeMode && null === description)
                this.#fail('`using` needs a subject, a `+permission`, `+scope`, or a `-- "description"`', token);

            let body = this.#parseBlock();

            return AST.usingStatement(subjects, body, span(token.loc, (body ?? token).loc), permissions, scopeMode, description);
        }

        /** Validates one `+scope[:mode]` in a `using` header.
         * @param {Object} grant - the `PERMISSION` token
         * @param {?String} previous - a mode this header already set, if any
         * @return {String}
         */
        #readScopeMode(grant, previous) {
            if (this.#blockDepth > 0)
                this.#fail('`+scope` sets the binding rule for a whole script, so it may only appear in a top-level `using`', grant);

            if (null !== previous)
                this.#fail('`+scope` may only be given once per `using`', grant);

            let mode = ('scope' === grant.value? DEFAULT_SCOPE_MODE: grant.value.slice('scope:'.length));

            if (!SCOPE_MODES.has(mode))
                this.#fail(`Unknown scope mode ${ JSON.stringify(mode) }; expected \`+scope:local\`, \`+scope:global\` or \`+scope:universal\``, grant);

            return mode;
        }

        /** `when <expr> is` + indented cases, or `when <test>` + block.
         *
         * The two are told apart by a single fact: whether the head ended on a comparison
         * with nothing after it. Nothing else about the line differs, and nothing has to be
         * looked ahead for.
         */
        #parseWhenStatement(token) {
            this.#next();

            let discriminant = this.#parseWhenHead(),
                dangling = this.#dangling;

            this.#dangling = null;

            if (!dangling) {
                let body = this.#parseBlock();

                if (null === body)
                    this.#record(new DSLParseError('`when` has no indented body', token.loc, this.#source));

                return AST.whenChain(discriminant, body, span(token.loc, (body ?? discriminant).loc));
            }

            this.#expect(TokenType.NEWLINE, 'end of line after `when ... is`');
            this.#expect(TokenType.INDENT, 'an indented list of `when` cases');

            let cases = [];

            this.#skipNewlines();

            while (!this.#at(TokenType.DEDENT, TokenType.EOF)) {
                cases.push(this.#parseWhenCase());
                this.#skipNewlines();
            }

            let close = this.#peek().loc;

            this.#accept(TokenType.DEDENT);

            if (!cases.length)
                this.#fail('`when ... is` needs at least one case', { loc: span(token.loc, close) });

            return AST.whenStatement(discriminant, dangling.lexeme, cases, span(token.loc, close));
        }

        /** Reads a `when` head with the dangling-comparison rule switched on. */
        #parseWhenHead() {
            this.#dangling = null;
            this.#danglingAllowed = true;

            try {
                return this.#parseExpression();
            } finally {
                this.#danglingAllowed = false;
            }
        }

        /** `<value>:` + block. A `*` label is the default for free: comparing anything
         * against the wildcard already means "is present". */
        #parseWhenCase() {
            let test = this.#parseExpression(),
                colon = this.#expect(TokenType.COLON, '`:` after a `when` case label'),
                body = this.#parseBlock();

            return AST.whenCase(test, body, span(test.loc, (body ?? colon).loc));
        }

        /** `with (<expr>)` + block — the statement form.
         *
         * The expression is read in the *current* scope, so `with (.links | ...)` filters
         * the enclosing subject's property; the block runs one scope deeper. */
        #parseWithStatement(token) {
            this.#next();

            let filter = this.#parseExpression(),
                body = this.#parseBlock();

            if (null === body)
                this.#record(new DSLParseError('`with` has no indented body', token.loc, this.#source));

            return AST.withStatement(filter, body, span(token.loc, (body ?? filter).loc));
        }

        /** `else` + block, or `else if <test>` + block.
         *
         * `else if` is another spelling of a chain `when <test>` and produces the same node,
         * so the fold, the "nothing after `else`" rule and the compiler all treat the two
         * alike. `else when` stays an error: `when` already means "else if" on its own, and
         * doubling it up says nothing new. */
        #parseElseStatement(token) {
            this.#next();

            if (this.#accept(TokenType.IF)) {
                let test = this.#parseExpression(),
                    body = this.#parseBlock();

                if (null === body)
                    this.#record(new DSLParseError('`else if` has no indented body', token.loc, this.#source));

                return AST.whenChain(test, body, span(token.loc, (body ?? test).loc));
            }

            if (this.#at(TokenType.WHEN))
                this.#fail('`else when` is not a thing; write `when <test>` or `else if <test>` for another branch', this.#peek());

            let body = this.#parseBlock();

            if (null === body)
                this.#record(new DSLParseError('`else` has no indented body', token.loc, this.#source));

            return AST.elseClause(body, span(token.loc, (body ?? token).loc));
        }

        /** `if <test>` */
        #parseIfStatement(token) {
            this.#next();

            let test = this.#parseExpression(),
                body = this.#parseBlock();

            if (null === body)
                this.#record(new DSLParseError('`if` has no indented body', token.loc, this.#source));

            return AST.ifStatement(test, body, span(token.loc, (body ?? test).loc));
        }

        /** `goto <target>` */
        #parseGotoStatement(token) {
            this.#next();

            let target = this.#parseExpression();

            this.#expect(TokenType.NEWLINE, 'end of line');

            return AST.gotoStatement(target, span(token.loc, target.loc));
        }

        /** `POST <argument>` / `REPLY <argument>` / any registered verb. */
        #parseVerbStatement(token) {
            this.#next();

            let argument = null;

            if (!this.#at(TokenType.NEWLINE, TokenType.EOF, TokenType.DEDENT))
                argument = this.#parseExpression();

            this.#expect(TokenType.NEWLINE, 'end of line');

            return AST.verbStatement(token.value, argument, span(token.loc, (argument ?? token).loc));
        }

        /** Keyword -> handler. Declared as a field so `this` stays bound through dispatch. */
        #statementParsers = {
            [TokenType.AWAIT]: this.#parseAwaitStatement,
            [TokenType.AFTER]: this.#parseAfterStatement,
            [TokenType.USING]: this.#parseUsingStatement,
            [TokenType.IF]: this.#parseIfStatement,
            [TokenType.GOTO]: this.#parseGotoStatement,
            [TokenType.WHEN]: this.#parseWhenStatement,
            [TokenType.ELSE]: this.#parseElseStatement,
            [TokenType.WITH]: this.#parseWithStatement,
        };

        // -- expressions -------------------------------------------------------

        /** Precedence climbing.
         * @param {Number} [minimum = LOWEST_PRECEDENCE] - the loosest operator this call
         *   is allowed to absorb
         * @return {Object}
         */
        #parseExpression(minimum = LOWEST_PRECEDENCE) {
            let left = this.#parseUnary();

            while (true) {
                let token = this.#peek(),
                    operator = OPERATORS[token.type];

                if (!operator || operator.precedence < minimum)
                    break;

                this.#next();

                // `when .command is` — a comparison with nothing after it is the switch
                // head. Legal only where `#danglingAllowed` says so; everywhere else the
                // right operand is parsed and the missing one reported as usual.
                if (this.#danglingAllowed && this.#at(TokenType.NEWLINE) && (TokenType.IS === token.type || TokenType.IN === token.type)) {
                    this.#dangling = token;

                    break;
                }

                // `is above 50` / `is or above 50`. The comparison word rides on `is` rather
                // than being an operator of its own, so it inherits `is`'s precedence and its
                // non-associativity without a second row in the table. `is or` can mean
                // nothing else — `or` never starts an operand — so reading it as "or equal"
                // steals no existing sentence.
                if (TokenType.IS === token.type && (this.#at(TokenType.COMPARE) || (this.#at(TokenType.OR) && TokenType.COMPARE === this.#peek(1).type))) {
                    let inclusive = !!this.#accept(TokenType.OR),
                        comparison = (inclusive? 'or ': '') + this.#next().lexeme,
                        right = this.#parseExpression(operator.precedence + 1);

                    left = AST.binaryExpression(comparison, left, right, span(left.loc, right.loc));

                    let ahead = OPERATORS[this.#peek().type];

                    if (ahead && ahead.precedence === operator.precedence)
                        this.#fail('`is` is not associative; parenthesize to say which comparison comes first');

                    continue;
                }

                // A left-associative operator forbids its own precedence on the right, so
                // `a or b or c` groups as `(a or b) or c`. A non-associative one does the
                // same, and then rejects a repeat outright.
                let next = (Associativity.RIGHT === operator.associativity? operator.precedence: operator.precedence + 1),
                    right = this.#parseExpression(next);

                if (TokenType.IS === token.type)
                    this.#rejectInterpolatedComparison(left, right, token);

                let build = BINARY_BUILDERS[token.type],
                    loc = span(left.loc, right.loc);

                left = (build? build(left, right, loc, token): AST.binaryExpression(operator.lexeme, left, right, loc));

                if (Associativity.NONE === operator.associativity) {
                    let ahead = OPERATORS[this.#peek().type];

                    if (ahead && ahead.precedence === operator.precedence)
                        this.#fail(`\`${ operator.lexeme }\` is not associative; parenthesize to say which comparison comes first`);
                }
            }

            // Assignment is the loosest thing in the language, and it is handled here rather
            // than as a row in `OPERATORS` because its right side is a *name*, not an
            // expression — there is nothing for precedence climbing to climb. Gating on the
            // outermost level is what makes it loosest for free, and is why `(5:00 -> a)`
            // works while `1st <| .links -> a` binds the piped result rather than `.links`.
            if (LOWEST_PRECEDENCE === minimum && this.#at(TokenType.ARROW_LOCAL, TokenType.ARROW_PARENT))
                return this.#parseAssignmentTail(left);

            // `.size above 50` — the `is` was left out.
            if (LOWEST_PRECEDENCE === minimum && this.#at(TokenType.COMPARE))
                this.#parsePrimary();

            // A `-` sitting after a complete expression can only have been meant as
            // subtraction. Saying where arithmetic lives beats "expected end of line".
            if (LOWEST_PRECEDENCE === minimum && this.#at(TokenType.MINUS))
                this.#fail('arithmetic only works inside `calc( ... )`, e.g. `calc(a - b)`; it needs the `eval:calc` permission');

            return left;
        }

        /** `<value> -> name` / `<value> => name`. */
        #parseAssignmentTail(value) {
            let arrow = this.#next(),
                target = this.#peek();

            if (TokenType.IDENT !== target.type)
                this.#fail(`Expected a variable name after \`${ arrow.lexeme }\`, found ${ this.#describe(target) }`);

            this.#next();

            let name = target.value;

            // Enforced here, at the binding site, and nowhere else. The lexer cannot tell
            // `USERNAME` from `mod_msg`, and a reference site must not try: a name with an
            // interior underscore resolves variable-then-constant, one without resolves
            // constant-only. Checking only where a name is *created* is also what makes the
            // subject aliases safe — they are only ever read, so they can never trip this.
            if (THIS_ALIASES.has(name))
                this.#fail(`\`${ name }\` always means the current subject and cannot be bound`, target);

            if (!VARIABLE_PATTERN.test(name))
                this.#fail('A variable name must contain an interior underscore, e.g. `mod_msg`; `x`, `_x` and `x_` are not variable names', target);

            if (this.#at(TokenType.ARROW_LOCAL, TokenType.ARROW_PARENT))
                this.#fail('Chained assignment is not allowed; bind one name per expression');

            return AST.assignmentExpression(name, arrow.lexeme, value, span(value.loc, target.loc));
        }

        /** `is` refuses a template that still carries an interpolation.
         *
         * `\`this template is cooked\`` is a fine thing to compare against — it is just
         * text. `\`still needs ${ parsing }\`` is not: comparing against a value that has yet
         * to be evaluated is almost always a half-written thought, and letting it through
         * would make the comparison depend on `stringify`'s rendering rules rather than on
         * anything the script said. */
        #rejectInterpolatedComparison(left, right, token) {
            if (isInterpolated(left) || isInterpolated(right))
                this.#fail('`is` does not accept a template with `${ ... }` in it; compare against a string, or bind the template to a name first', token);
        }

        /** `not <expr>` / `-<expr>` / `=<expr>` */
        #parseUnary() {
            let token = this.#peek();

            if (this.#at(TokenType.NOT, TokenType.MINUS, TokenType.EXACT)) {
                this.#next();

                let argument = this.#parseUnary(),
                    operator = (TokenType.NOT === token.type? 'not': TokenType.EXACT === token.type? '=': '-');

                return AST.unaryExpression(operator, argument, span(token.loc, argument.loc));
            }

            return this.#parseMembers(this.#parsePrimary());
        }

        /** `.raider.name` — a `.name` glued to whatever came before it reads a property off
         * that value. Glued means no space: `.raider .name` is still two subjects, which is
         * what keeps `using .a .b` meaning "either of these".
         * @param {Object} object
         * @return {Object}
         */
        #parseMembers(object) {
            while (this.#at(TokenType.SELECTOR_CONTEXT) && this.#peek().loc.start === object.loc.end) {
                let property = this.#next();

                object = AST.memberExpression(object, property.value, span(object.loc, property.loc));
            }

            return object;
        }

        /** @return {Object} */
        #parsePrimary() {
            let token = this.#peek();

            switch (token.type) {
                case TokenType.NUMBER:
                case TokenType.STRING:
                    this.#next();

                    return AST.literal(token.value, token.lexeme, token.loc);

                case TokenType.TRUE:
                case TokenType.FALSE:
                    this.#next();

                    return AST.literal(TokenType.TRUE === token.type, token.lexeme, token.loc);

                case TokenType.DURATION:
                    this.#next();

                    return AST.duration(token.value, token.loc);

                case TokenType.ORDINAL:
                    this.#next();

                    return AST.ordinalIndex(token.value, token.loc);

                case TokenType.WILDCARD:
                    // `* from ( ... )` — `*` is ANYTHING, so "anything from" is `any from`.
                    if (TokenType.FROM === this.#peek(1).type)
                        return this.#parseAnyFrom();

                    this.#next();

                    return AST.wildcard(token.loc);

                case TokenType.TEMPLATE:
                    this.#next();

                    return this.#buildTemplate(token);

                case TokenType.ANY:
                    return this.#parseAnyFrom();

                case TokenType.LPAREN:
                    return this.#parseGroup();

                case TokenType.JS_PATH:
                    return this.#parseJSInvoke();

                case TokenType.CALC:
                    return this.#parseCalc();

                case TokenType.IDENT:
                    this.#next();

                    // `_` and its long-winded spellings are the subject itself — the same
                    // thing `.prop` reads a property from, minus the read.
                    if (THIS_ALIASES.has(token.value))
                        return AST.thisExpression(token.loc);

                    // `ANYTHING` / `SOMETHING` / `NOTHING` are presence tests, the same kind
                    // of value `*` is. Resolved here rather than through the constant table so
                    // a host cannot shadow them.
                    if (token.value in PRESENCE_WORDS)
                        return AST.wildcard(token.loc, PRESENCE_WORDS[token.value]);

                    return AST.identifier(token.value, !!token.isUpper, token.loc);

                case TokenType.RESERVED:
                    return this.#failReserved(token);

                case TokenType.COMPARE:
                    return this.#fail(`\`${ token.lexeme }\` only follows \`is\`, as in \`.raid_size is ${ token.lexeme } 50\` or \`.raid_size is or ${ token.lexeme } 50\``, token);

                case TokenType.PERMISSION:
                    return this.#fail('A `+permission` may only appear in a `using` header', token);

                case TokenType.DESCRIBE:
                    return this.#fail('A `-- "description"` may only end a `using` header', token);

                case TokenType.COLON:
                    return this.#fail(COLON_MESSAGE, token);

                default:
                    break;
            }

            if (token.type in SELECTOR_KINDS)
                return this.#parseSelector();

            return this.#fail(`Expected an expression, found ${ this.#describe(token) }`);
        }

        /** `&Date.now( <arg> , <arg> )`.
         *
         * The path was lexed as one token and the arguments are ordinary expressions. There
         * is no string anywhere in this construct that becomes code: the compiler hands the
         * segment list to the runtime, which walks a host-supplied binding table. A script
         * naming a path the host never registered fails loudly, exactly as `DISCORD` does. */
        #parseJSInvoke() {
            let token = this.#next();

            this.#expect(TokenType.LPAREN, '`(` after a `&` host call');

            let args = [];

            this.#skipSeparators();

            while (!this.#at(TokenType.RPAREN, TokenType.EOF)) {
                args.push(this.#parseExpression());
                this.#skipSeparators();
            }

            let close = this.#expect(TokenType.RPAREN, '`)` closing the `&` argument list').loc;

            return AST.jsInvokeExpression(token.value, args, span(token.loc, close));
        }

        /** `calc( <arithmetic> )`.
         *
         * Inside the parentheses the tokenizer has already turned `+ - * / % **` into
         * `ARITH` tokens, and this is a small grammar of its own with JavaScript's
         * precedence: `**` (right-associative), then `* / %`, then `+ -`, with unary `-`/`+`.
         * As in JavaScript, a unary operator may not be the base of `**` — `-2 ** 2` is an
         * error; write `(-2) ** 2` or `-(2 ** 2)`. Operands are ordinary DSL values:
         * numbers, durations, variables, `.prop`, `#prop`, host calls. */
        #parseCalc() {
            let start = this.#next().loc;

            if (!this.#at(TokenType.LPAREN))
                this.#fail('`calc` needs its arithmetic in parentheses, e.g. `calc(.raid_size * 2)`');

            this.#next();
            this.#skipSeparators();

            let expression = this.#parseSum();

            this.#skipSeparators();

            let close = this.#expect(TokenType.RPAREN, '`)` closing `calc(`, or an arithmetic operator').loc;

            return AST.calcExpression(expression, span(start, close));
        }

        /** @param {...String} operators @return {?Object} the ARITH token, consumed */
        #acceptArith(...operators) {
            this.#skipSeparators();

            return ((this.#at(TokenType.ARITH) && operators.includes(this.#peek().value))? this.#next(): null);
        }

        #parseSum() {
            let left = this.#parseProduct(),
                operator;

            while ((operator = this.#acceptArith('+', '-'))) {
                let right = this.#parseProduct();

                left = AST.arithmeticExpression(operator.value, left, right, span(left.loc, right.loc));
            }

            return left;
        }

        #parseProduct() {
            let left = this.#parseArithUnary(),
                operator;

            while ((operator = this.#acceptArith('*', '/', '%'))) {
                let right = this.#parseArithUnary();

                left = AST.arithmeticExpression(operator.value, left, right, span(left.loc, right.loc));
            }

            return left;
        }

        #parseArithUnary() {
            let operator = this.#acceptArith('-', '+');

            if (!operator)
                return this.#parsePower();

            let argument = this.#parseArithSigned();

            if (this.#at(TokenType.ARITH) && '**' === this.#peek().value)
                this.#fail('A unary `-` or `+` cannot be the base of `**`; parenthesize: `(-2) ** 2` or `-(2 ** 2)`');

            return AST.arithmeticExpression(operator.value, null, argument, span(operator.loc, argument.loc));
        }

        /** The operand of a unary sign: more signs, then a bare operand — never `**`, which
         * is what leaves a following `**` visible to the check above. */
        #parseArithSigned() {
            let operator = this.#acceptArith('-', '+');

            if (!operator)
                return this.#parseArithOperand();

            let argument = this.#parseArithSigned();

            return AST.arithmeticExpression(operator.value, null, argument, span(operator.loc, argument.loc));
        }

        #parsePower() {
            let base = this.#parseArithOperand();

            if (!this.#acceptArith('**'))
                return base;

            // Right-associative: `2 ** 3 ** 2` is `2 ** 9`. The exponent may carry a sign.
            let exponent = this.#parseArithUnary();

            return AST.arithmeticExpression('**', base, exponent, span(base.loc, exponent.loc));
        }

        #parseArithOperand() {
            this.#skipSeparators();

            if (this.#at(TokenType.LPAREN)) {
                this.#next();

                let inner = this.#parseSum();

                this.#skipSeparators();
                this.#expect(TokenType.RPAREN, '`)`');

                return inner;
            }

            if (this.#at(TokenType.ARITH))
                this.#fail(`Expected a number before \`${ this.#peek().value }\``);

            return this.#parseMembers(this.#parsePrimary());
        }

        /** Any sigil. `/channel` glued directly to `#prop` collapses into one node. */
        #parseSelector() {
            let token = this.#next(),
                kind = SELECTOR_KINDS[token.type];

            if (TokenType.SELECTOR_REALM === token.type)
                return AST.selector(kind, token.value.path, { realm: token.value.realm, path: token.value.path }, token.loc);

            // `[vip moderator]` — `name` is the first, for display; `names` is what resolves.
            if (TokenType.SELECTOR_BADGE === token.type)
                return AST.selector(kind, token.value[0], { names: token.value }, token.loc);

            // `/ginger_enby#name` — two tokens, but only because they were written without
            // a space. Adjacency in the source is what makes them one selector.
            if (TokenType.SELECTOR_CHANNEL === token.type && this.#at(TokenType.SELECTOR_PROP) && this.#peek().loc.start === token.loc.end) {
                let property = this.#next();

                return AST.selector('prop', property.value, { channel: token.value }, span(token.loc, property.loc));
            }

            return AST.selector(kind, token.value, {}, token.loc);
        }

        /** `any from ( <item> \n <item> ... )`, `any from ( <range> )`, or `any from <value>` —
         * the last picks from a list bound earlier: `any from replies`. */
        #parseAnyFrom() {
            let start = (this.#accept(TokenType.WILDCARD) ?? this.#expect(TokenType.ANY, '`any`')).loc;

            this.#expect(TokenType.FROM, '`from` after `any`');

            if (!this.#at(TokenType.LPAREN)) {
                let source = this.#parseUnary();

                return AST.anyFromExpression([source], span(start, source.loc));
            }

            this.#expect(TokenType.LPAREN, '`(` after `any from`');

            let items = [];

            this.#skipSeparators();

            while (!this.#at(TokenType.RPAREN, TokenType.EOF)) {
                items.push(this.#parseExpression());

                // Items are separated by line; a comma is an *optional* extra separator, so
                // a leading, trailing or doubled one collapses to nothing and two items on
                // one line are still two items. Blank and comment-only lines were already
                // dropped by the tokenizer, so any run of these is one separator.
                this.#skipSeparators();
            }

            let close = this.#expect(TokenType.RPAREN, '`)` closing `any from`').loc;

            if (!items.length)
                this.#fail('`any from` needs at least one item', { loc: span(start, close) });

            return AST.anyFromExpression(items, span(start, close));
        }

        /** A parenthesized expression. May span lines. */
        #parseGroup() {
            let open = this.#expect(TokenType.LPAREN, '`(`').loc;

            this.#skipSeparators();

            // Re-entering at the outermost level is what makes `(5:00 -> wait_time)` bind:
            // the assignment tail pass is gated on that level, and a group is a fresh one.
            let items = [this.#parseExpression()];

            this.#skipSeparators();

            // Two or more items, separated the way `any from` separates them — by line or
            // by optional comma — make a list: `(\`hi\`, \`hey\`) => greetings`.
            while (!this.#at(TokenType.RPAREN, TokenType.EOF)) {
                items.push(this.#parseExpression());
                this.#skipSeparators();
            }

            this.#expect(TokenType.RPAREN, '`)`');

            let loc = span(open, this.#peek(-1).loc);

            if (items.length > 1)
                return AST.listExpression(items, loc);

            // A one-item group is transparent; only its span widens, so `(a) is b` and
            // `a is b` produce identical trees.
            return Object.assign({}, items[0], { loc });
        }

        /** Turns a `TEMPLATE` token into a node, recursively parsing each interpolation.
         *
         * Each sub-expression is re-tokenized in `fragment` mode against its absolute
         * offset in the original file, so an error inside `${ ... }` reports the real line
         * and column rather than a position inside a detached substring.
         * @param {Object} token
         * @return {Object}
         */
        #buildTemplate(token) {
            let { quasis, expressions } = token.value,
                parsed = expressions.map(({ source, offset }) => {
                    let tokens = new Tokenizer(source, { fragment: true, origin: { offset, source: this.#source } }).tokenize(),
                        parser = new Parser(tokens, this.#source);

                    return parser.parseInterpolation();
                });

            return AST.templateLiteral(quasis, parsed, token.loc);
        }

        /** Parses a lone expression — the body of a `${ ... }`.
         * @return {Object}
         */
        parseInterpolation() {
            this.#skipNewlines();

            let expression = this.#parseExpression();

            this.#skipNewlines();

            if (!this.#at(TokenType.EOF))
                this.#fail(`Unexpected ${ this.#describe(this.#peek()) } after the interpolated expression`);

            return expression;
        }
    }

    /** Parses source into an AST, collecting every recoverable error.
     * @param {String} source
     * @return {{ program: Object, errors: Array<DSLParseError> }}
     */
    let parseTolerant = (source) => {
        let text = String(source),
            tokens = new Tokenizer(text).tokenize(),
            parser = new Parser(tokens, text);

        return { program: parser.parseProgram(), errors: parser.errors };
    };

    /** Parses source into an AST.
     * @param {String} source
     * @return {Object} a `Program` node
     * @throws {DSLSyntaxError|DSLParseError} the first fault found
     */
    let parse = (source) => {
        let { program, errors } = parseTolerant(source);

        if (errors.length)
            throw errors[0];

        return program;
    };

    globalThis.TTV_DSL.parser = { Parser, parse, parseTolerant };
    globalThis.TTV_DSL.parse = parse;
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
