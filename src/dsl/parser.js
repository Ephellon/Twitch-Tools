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

if(typeof require === 'function' && typeof module === 'object') {
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

    /** Inside an expression, a call's arguments bind no looser than the pipe: `%`, `~`/`as`,
     * the comparisons, `and`/`or` and assignment all apply to the call's *result*. */
    const CALL_ARGUMENT_PRECEDENCE = OPERATORS[TokenType.PIPE].precedence;

    /** Tokens that can begin an argument. Anything else after a function name means it was
     * called with none — `NOW` on its own. */
    const ARGUMENT_STARTS = [
        TokenType.NUMBER, TokenType.STRING, TokenType.TEMPLATE, TokenType.DURATION, TokenType.ORDINAL,
        TokenType.TRUE, TokenType.FALSE, TokenType.WILDCARD, TokenType.ANY, TokenType.LPAREN,
        TokenType.IDENT, TokenType.JS_PATH, TokenType.CALC, TokenType.COUNTER,
        TokenType.NOT, TokenType.MINUS, TokenType.EXACT,
        TokenType.SELECTOR_SELF, TokenType.SELECTOR_PROP, TokenType.SELECTOR_CHANNEL, TokenType.SELECTOR_REALM,
        TokenType.SELECTOR_BADGE, TokenType.SELECTOR_USER, TokenType.SELECTOR_CONTEXT,
    ];

    /** A plugin id: it becomes a settings key, so it is kept to what those allow. */
    const PLUGIN_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

    /** A setting's name — it becomes part of a settings key, `<id>__<name>`. */
    const SETTING_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

    /** Where a script may run. */
    const PLUGIN_FRAMES = new Set(['chat', 'main']);

    /** The setting types a header may declare, and what each one's block may carry. */
    const SETTING_KEYS = {
        checkbox: [],
        number: ['min', 'max', 'step', 'unit'],
        text: ['placeholder'],
        select: ['option'],
    };

    const SETTING_TYPES = new Set(Object.keys(SETTING_KEYS));

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

    /** Operators whose result is always `true` or `false`. */
    const CONDITION_OPERATORS = new Set(['is', 'in', 'and', 'or', 'above', 'below', 'or above', 'or below']);

    /** @param {Object} node @return {Boolean} true for an expression that can only be yes/no —
     * a comparison, `and`/`or`/`not`, or a `true`/`false` literal */
    const isCondition = (node) => (false
        || (NodeType.BinaryExpression === node?.type && CONDITION_OPERATORS.has(node.operator))
        || (NodeType.UnaryExpression === node?.type && 'not' === node.operator)
        || (NodeType.Literal === node?.type && typeof node.value === 'boolean'));

    /** @param {Object} node @return {Boolean} true for a template that still needs evaluating */
    const isInterpolated = (node) => (NodeType.TemplateLiteral === node?.type && node.expressions.length > 0);

    /** @param {Object} node @return {Boolean} true for a statement that continues the chain
     * before it: the `when <test>` form, or `else` */
    const isContinuation = (node) => ((NodeType.WhenStatement === node?.type && null === node.operator) || NodeType.ElseClause === node?.type);

    /** Spans two locations into one.
     * @param {Object} from
     * @param {Object} to
     * @return {Object}
     */
    const span = (from, to) => ({
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

        /** Set while reading a `define` body: `return` is legal, and `await`, `after` and
         * `using` are not. */
        #inFunction = false;

        /** The labels of the loops being read, innermost last (`null` for an unlabelled
         * one). Empty outside any loop — and reset inside a `define`, so `break` cannot
         * leave a function. */
        #loops = [];

        /** Every function name the script `define`s. Collected before parsing starts, because
         * a call reads exactly like a verb — `TOREADABLE wait_time` — and only the name tells
         * the parser which one it is looking at, wherever in the script the `define` sits. */
        #functions;

        /**
         * @param {Array<Object>} tokens
         * @param {String} source - the text locations refer to, used for code frames
         * @param {Set<String>} [functions] - handed down to the parsers of `${ ... }`
         * @param {Array<?String>} [loops] - likewise, so `${ $ }` inside a `for` is legal
         */
        constructor(tokens, source, functions, loops) {
            this.#tokens = tokens;
            this.#source = source;
            this.#loops = (loops ?? []).slice();
            this.#functions = functions ?? new Set(tokens
                .filter((token, index) => TokenType.IDENT === token.type && TokenType.DEFINE === tokens[index - 1]?.type)
                .map(token => token.value));
        }

        /** Every error collected during the parse. */
        get errors() {
            return this.#errors;
        }

        // -- cursor -----------------------------------------------------------

        /** @param {Number} [ahead = 0] @return {Object} */
        #peek(ahead = 0) {
            const index = this.#index + ahead;

            return this.#tokens[index < this.#tokens.length ? index : this.#tokens.length - 1];
        }

        /** @return {Object} */
        #next() {
            const token = this.#peek();

            if(this.#index < this.#tokens.length - 1)
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
            return (this.#at(type) ? this.#next() : null);
        }

        /** Consumes the current token or fails.
         * @param {String} type
         * @param {String} [what] - a human phrase for the error message
         * @return {Object}
         */
        #expect(type, what) {
            if(this.#at(type))
                return this.#next();

            return this.#fail(`Expected ${ what ?? type }, found ${ this.#describe(this.#peek()) }`);
        }

        /** @param {Object} token @return {String} */
        #describe(token) {
            switch(token.type) {
                case TokenType.EOF: {
                    return 'end of input';
                }

                case TokenType.NEWLINE: {
                    return 'end of line';
                }

                case TokenType.INDENT: {
                    return 'an indented block';
                }

                case TokenType.DEDENT: {
                    return 'the end of a block';
                }

                default: {
                    return JSON.stringify(token.lexeme);
                }
            } // switch token.type
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
            while(SKIPPABLE.has(this.#peek().type))
                this.#next();
        }

        /** Skips item separators — newlines *and* commas. Used only inside a list context. */
        #skipSeparators() {
            while(SEPARATORS.has(this.#peek().type))
                this.#next();
        }

        /** Panic-mode recovery: discard the rest of the broken line, and the block it
         * opened, so the next statement starts clean. */
        #synchronize() {
            while(!this.#at(TokenType.NEWLINE, TokenType.EOF, TokenType.DEDENT))
                this.#next();

            this.#accept(TokenType.NEWLINE);

            if(!this.#at(TokenType.INDENT))
                return;

            let depth = 0;

            do {
                const type = this.#next().type;

                if(TokenType.INDENT === type)
                    ++depth;
                else if(TokenType.DEDENT === type)
                    --depth;
                else if(TokenType.EOF === type)
                    return;
            } while(depth > 0);
        }

        // -- program and blocks ------------------------------------------------

        /** @return {Object} a `Program` node */
        parseProgram() {
            const start = this.#peek().loc
                , body = this.#parseStatements(TokenType.EOF)
                , end = this.#peek().loc;

            return AST.program(body, span(start, end));
        }

        /** Parses statements until `terminator`.
         * @param {String} terminator
         * @return {Array<Object>}
         */
        #parseStatements(terminator) {
            const body = [];

            while(true) {
                this.#skipNewlines();

                if(this.#at(terminator, TokenType.EOF))
                    break;

                // Only a fault can produce a stray INDENT here; a well-formed block was
                // already consumed by whichever statement opened it.
                if(this.#at(TokenType.INDENT)) {
                    this.#record(new DSLParseError('Unexpected indentation', this.#peek().loc, this.#source));
                    this.#synchronize();

                    continue;
                }

                const before = this.#index;

                try {
                    const statement = this.#parseStatement();

                    // The chain form of `when`, and `else`, are written as *siblings* of the
                    // `if` (or `when`) they continue, because that is how they read on the
                    // page. They are folded into that sibling's `alternate` here rather than
                    // being parsed as part of it, so the off-side rule stays uniform: every
                    // branch of a chain sits at the same indentation.
                    if(isContinuation(statement) && this.#foldAlternate(body, statement))
                        continue;

                    // The header describes the whole script, so it comes before anything the
                    // script does — and there is only one.
                    if(NodeType.PluginHeader === statement.type && (body.length || this.#blockDepth > 0))
                        this.#fail('`plugin` must be the first statement of a script', { loc: statement.loc });

                    body.push(statement);
                } catch(error) {
                    // A `DSLSyntaxError` can arrive here too: a template's `${ ... }` is
                    // tokenized lazily, by the parser, so a lexical fault inside one surfaces
                    // mid-parse. It is recorded and recovered from like any other fault on
                    // the line, rather than escaping a parse that promised to collect.
                    if(!(error instanceof DSLParseError || error instanceof DSLSyntaxError))
                        throw error;

                    this.#record(error);
                    this.#synchronize();

                    // A parser that fails without consuming anything would spin forever.
                    if(this.#index === before)
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
            const previous = body[body.length - 1]
                , spelling = (NodeType.ElseClause === statement.type ? '`else`' : '`when <test>`');

            if(!previous || (NodeType.IfStatement !== previous.type && NodeType.WhenStatement !== previous.type)) {
                this.#record(new DSLParseError(`${ spelling } continues the \`if\` or \`when\` before it, but there is none here; either add one or use \`if\``, statement.loc, this.#source));

                return false;
            }

            let target = previous;

            while(target.alternate)
                target = target.alternate;

            // `else` closes the chain. A branch after it could never run, and silently
            // starting a fresh chain instead would hide that.
            if(NodeType.ElseClause === target.type) {
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

            if(!this.#at(TokenType.INDENT))
                return null;

            let open = this.#next().loc
                , body;

            ++this.#blockDepth;

            try {
                body = this.#parseStatements(TokenType.DEDENT);
            } finally {
                --this.#blockDepth;
            }

            const close = this.#peek().loc;

            this.#accept(TokenType.DEDENT);

            return AST.block(body, span(open, close));
        }

        // -- statements --------------------------------------------------------

        /** @return {Object} */
        #parseStatement() {
            const token = this.#peek()
                , parse = this.#statementParsers[token.type];

            if(parse)
                return parse.call(this, token);

            // Caught before anything else: `else`/`switch`/`calc` in statement position are
            // exactly the mistakes a reader arriving from another language makes, and the
            // generic "expected a statement" tells them nothing.
            if(TokenType.RESERVED === token.type)
                return this.#failReserved(token);

            // An all-caps bare word in statement position is a verb call. The decision is
            // made here, by position, rather than in the lexer — so the host can register
            // new verbs without touching the language.
            // A defined function in statement position is called exactly like a verb, and its
            // arguments take the rest of the line the way a verb's argument does.
            // An arrow after the arguments binds the call's *result* — `FACT n -> rest` — so
            // the arguments stop just short of it (assignment is the only construct looser
            // than `or`).
            if(TokenType.IDENT === token.type && this.#functions.has(token.value)) {
                let statement = this.#parseCall(token, LOWEST_PRECEDENCE + 1);

                if(this.#at(TokenType.ARROW_LOCAL, TokenType.ARROW_PARENT))
                    statement = this.#parseAssignmentTail(statement);

                this.#expect(TokenType.NEWLINE, 'end of line');

                return AST.expressionStatement(statement, statement.loc);
            }

            if(TokenType.IDENT === token.type && token.isUpper)
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
            let before = this.#index
                , expression = null;

            try {
                expression = this.#parseExpression();
            } catch(error) {
                if(!(error instanceof DSLParseError))
                    throw error;

                this.#index = before;

                throw error;
            }

            // A host call may stand alone too: `&html.setText("#title", "hi")` is done for
            // what it does, exactly as a verb is.
            if(NodeType.AssignmentExpression !== expression.type && NodeType.JSInvokeExpression !== expression.type && NodeType.CallExpression !== expression.type) {
                this.#index = before;

                return this.#fail(`Expected a statement, found ${ this.#describe(token) }`);
            }

            this.#expect(TokenType.NEWLINE, 'end of line');

            return AST.expressionStatement(expression, span(token.loc, expression.loc));
        }

        /** `await <subject> [with <filter>]` */
        #parseAwaitStatement(token) {
            this.#refuseInFunction(token);
            this.#next();

            let subject = this.#parseExpression()
                , filter = null;

            if(this.#accept(TokenType.WITH))
                filter = this.#parseExpression();

            const body = this.#parseBlock();

            return AST.awaitStatement(subject, filter, body, span(token.loc, (body ?? filter ?? subject).loc));
        }

        /** A function computes; it does not install. An `await` inside one would install a
         * handler on every call, which is exactly the pile-up nested `await`s were fixed to
         * avoid, and a `using` would change grants mid-call. */
        #refuseInFunction(token) {
            if(this.#inFunction)
                this.#fail(`\`${ token.lexeme }\` is not allowed inside a \`define\`; a function computes a value, it does not install handlers`, token);
        }

        /** Reads a name that the script is creating — a function, parameter or loop label.
         * @param {String} what - for the error message
         * @return {Object} the IDENT token
         */
        #expectOwnName(what) {
            const token = this.#peek();

            if(TokenType.IDENT !== token.type)
                this.#fail(`Expected ${ what }, found ${ this.#describe(token) }`);

            if(THIS_ALIASES.has(token.value) || !VARIABLE_PATTERN.test(token.value))
                this.#fail(`${ what[0].toUpperCase() + what.slice(1) } needs a lower-case letter; ALL-CAPS names like \`${ token.value }\` are the host's constants and verbs`, token);

            return this.#next();
        }

        /** `plugin <id> [-- "Name"]` + an indented header of `about`, `frames` and `setting`
         * lines. Parsed as its own small grammar: none of these lines is a statement. */
        #parsePluginHeader(token) {
            this.#next();

            const idToken = this.#peek();

            if(TokenType.IDENT !== idToken.type || !PLUGIN_ID_PATTERN.test(idToken.value))
                this.#fail(`A plugin id is lower-case letters, digits and \`_\`, starting with a letter — e.g. \`plugin raid_shoutouts\`; found ${ this.#describe(idToken) }`, idToken);

            this.#next();

            const fields = { id: idToken.value, name: null, description: null, frames: null, settings: [] };

            if(this.#accept(TokenType.DESCRIBE))
                fields.name = this.#expect(TokenType.STRING, 'the plugin\'s name in quotes, after `--`').value;

            this.#expect(TokenType.NEWLINE, 'end of line');

            if(this.#accept(TokenType.INDENT)) {
                while(true) {
                    this.#skipNewlines();

                    if(this.#at(TokenType.DEDENT, TokenType.EOF))
                        break;

                    this.#parsePluginLine(fields);
                }

                this.#accept(TokenType.DEDENT);
            }

            return AST.pluginHeader(fields, span(token.loc, this.#peek(-1).loc));
        }

        /** One line of a `plugin` header. */
        #parsePluginLine(fields) {
            const token = this.#peek()
                , word = (TokenType.SETTING === token.type ? 'setting' : (TokenType.IDENT === token.type ? token.value : null));

            switch(word) {
                case 'about': {
                    this.#next();

                    if(null !== fields.description)
                        this.#fail('`about` is given twice', token);

                    fields.description = this.#expect(TokenType.STRING, 'the description in quotes').value;
                    this.#expect(TokenType.NEWLINE, 'end of line');

                    return;
                }

                case 'frames': {
                    this.#next();

                    if(null !== fields.frames)
                        this.#fail('`frames` is given twice', token);

                    fields.frames = [];

                    do {
                        const frame = this.#peek();

                        if(TokenType.IDENT !== frame.type || !PLUGIN_FRAMES.has(frame.value))
                            this.#fail(`Unknown frame ${ this.#describe(frame) }; a script runs in \`${ [...PLUGIN_FRAMES].join('`, `') }\``, frame);

                        this.#next();

                        if(!fields.frames.includes(frame.value))
                            fields.frames.push(frame.value);
                    } while(this.#accept(TokenType.COMMA));

                    this.#expect(TokenType.NEWLINE, 'end of line');

                    return;
                }

                case 'setting': {
                    return this.#parseSettingDeclaration(fields);
                }

                default: {
                    this.#fail(`A \`plugin\` header holds only \`about\`, \`frames\` and \`setting\` lines; found ${ this.#describe(token) }`, token);
                }
            } // switch word
        }

        /** `setting name: type default [-- "Label"]` + an optional block of limits/options. */
        #parseSettingDeclaration(fields) {
            const start = this.#next()
                , nameToken = this.#peek();

            if(TokenType.IDENT !== nameToken.type || !SETTING_NAME_PATTERN.test(nameToken.value))
                this.#fail(`A setting name is lower-case letters, digits and \`_\`, starting with a letter; found ${ this.#describe(nameToken) }`, nameToken);

            if(fields.settings.some(entry => entry.name === nameToken.value))
                this.#fail(`Setting \`${ nameToken.value }\` is declared twice`, nameToken);

            this.#next();
            this.#expect(TokenType.COLON, '`:` after the setting name');

            const typeToken = this.#peek();

            if(TokenType.IDENT !== typeToken.type || !SETTING_TYPES.has(typeToken.value))
                this.#fail(`Unknown setting type ${ this.#describe(typeToken) }; use \`${ [...SETTING_TYPES].join('`, `') }\``, typeToken);

            this.#next();

            const type = typeToken.value
                , valueToken = this.#peek()
                , value = this.#readSettingLiteral(`a default ${ type }`)
                , setting = { name: nameToken.value, type, default: value, label: null, loc: span(start.loc, valueToken.loc) };

            const expected = { checkbox: 'boolean', number: 'number', text: "string", select: 'string' }[type];

            if(typeof value !== expected)
                this.#fail(`A \`${ type }\` setting's default is a ${ expected }; found ${ this.#describe(valueToken) }`, valueToken);

            if(this.#accept(TokenType.DESCRIBE))
                setting.label = this.#expect(TokenType.STRING, 'the setting\'s label in quotes, after `--`').value;

            this.#expect(TokenType.NEWLINE, 'end of line');

            if(this.#accept(TokenType.INDENT)) {
                while(true) {
                    this.#skipNewlines();

                    if(this.#at(TokenType.DEDENT, TokenType.EOF))
                        break;

                    this.#parseSettingLine(setting);
                }

                this.#accept(TokenType.DEDENT);
            }

            if('select' === type) {
                if(!setting.options?.length)
                    this.#fail(`Select setting \`${ setting.name }\` needs at least one \`option\``, { loc: setting.loc });

                if(!setting.options.some(option => option.value === setting.default))
                    this.#fail(`Select setting \`${ setting.name }\` defaults to "${ setting.default }", which is not one of its options`, { loc: setting.loc });
            }

            if('number' === type) {
                if(null != setting.min && null != setting.max && setting.min > setting.max)
                    this.#fail(`Setting \`${ setting.name }\` has \`min\` above \`max\``, { loc: setting.loc });

                if((null != setting.min && setting.default < setting.min) || (null != setting.max && setting.default > setting.max))
                    this.#fail(`Setting \`${ setting.name }\` defaults to ${ setting.default }, outside its \`min\`/\`max\``, { loc: setting.loc });
            }

            fields.settings.push(setting);
        }

        /** One line inside a setting's block: `min 0, max 60, step 1, unit "s"`, `placeholder
         * "…"`, or `option "value" [-- "Label"]`. */
        #parseSettingLine(setting) {
            do {
                const token = this.#peek()
                    , key = (TokenType.IDENT === token.type ? token.value : null)
                    , allowed = SETTING_KEYS[setting.type];

                if(!key || !allowed.includes(key))
                    this.#fail(`A \`${ setting.type }\` setting takes ${ allowed.length ? `\`${ allowed.join('`, `') }\`` : 'nothing' } here; found ${ this.#describe(token) }`, token);

                this.#next();

                if('option' === key) {
                    const valueToken = this.#peek()
                        , value = this.#expect(TokenType.STRING, 'the option\'s value in quotes').value
                        , label = (this.#accept(TokenType.DESCRIBE) ? this.#expect(TokenType.STRING, 'the option\'s label in quotes, after `--`').value : value);

                    setting.options ??= [];

                    if(setting.options.some(option => option.value === value))
                        this.#fail(`Option "${ value }" is listed twice`, valueToken);

                    setting.options.push({ value, label });

                    continue;
                }

                if(key in setting)
                    this.#fail(`\`${ key }\` is given twice`, token);

                const valueToken = this.#peek()
                    , value = this.#readSettingLiteral(`a value for \`${ key }\``)
                    , expected = (('unit' === key || 'placeholder' === key) ? 'string' : 'number');

                if(typeof value !== expected)
                    this.#fail(`\`${ key }\` takes a ${ expected }; found ${ this.#describe(valueToken) }`, valueToken);

                if('step' === key && !(value > 0))
                    this.#fail('`step` must be above 0', valueToken);

                setting[key] = value;
            } while(this.#accept(TokenType.COMMA));

            this.#expect(TokenType.NEWLINE, 'end of line');
        }

        /** A plain literal in a header: a string, a boolean, or a (signed) number or duration. */
        #readSettingLiteral(what) {
            const negative = !!this.#accept(TokenType.MINUS)
                , token = this.#peek();

            switch(token.type) {
                case TokenType.NUMBER:
                case TokenType.DURATION: {
                    this.#next();

                    return (negative ? -token.value : token.value);
                }

                case TokenType.STRING:
                case TokenType.TRUE:
                case TokenType.FALSE: {
                    if(negative)
                        break;

                    this.#next();

                    return (TokenType.STRING === token.type ? token.value : TokenType.TRUE === token.type);
                }

                default: {
                    break;
                }
            } // switch token.type

            return this.#fail(`Expected ${ what }: a quoted string, a number, \`true\` or \`false\`; found ${ this.#describe(token) }`, token);
        }

        /** `define name(param, ...) [with +perm ...]` + block. */
        #parseDefineStatement(token) {
            this.#next();

            if(this.#blockDepth > 0 || this.#inFunction)
                this.#fail('`define` is only allowed at the top level of a script', token);

            const nameToken = this.#peek();

            // A function is a verb the script defines, so it is named like one.
            if(TokenType.IDENT !== nameToken.type || !nameToken.isUpper || nameToken.value in PRESENCE_WORDS)
                this.#fail(`A function is named in ALL-CAPS, like a verb — e.g. \`define TOREADABLE(mils)\`; found ${ this.#describe(nameToken) }`, nameToken);

            this.#next();

            const name = nameToken.value;

            if(!(this.#at(TokenType.LPAREN) && this.#peek().loc.start === this.#peek(-1).loc.end))
                this.#fail(`Expected \`(\` straight after \`${ name }\``);

            this.#next();

            const params = [];

            this.#skipSeparators();

            while(!this.#at(TokenType.RPAREN, TokenType.EOF)) {
                const param = this.#expectOwnName('a parameter name').value;

                if(params.includes(param))
                    this.#fail(`Parameter \`${ param }\` is listed twice`);

                params.push(param);
                this.#skipSeparators();
            }

            this.#expect(TokenType.RPAREN, '`)` closing the parameter list');

            const permissions = [];

            if(this.#accept(TokenType.WITH)) {
                while(this.#at(TokenType.PERMISSION, TokenType.COMMA)) {
                    const grant = this.#next();

                    if(TokenType.PERMISSION === grant.type)
                        permissions.push(grant.value);
                }

                if(!permissions.length)
                    this.#fail('`with` after a function lists the permissions it needs, e.g. `with +read:datetime +eval:calc`');
            }

            let saved = { inFunction: this.#inFunction, loops: this.#loops }
                , body;

            this.#inFunction = true;
            this.#loops = [];

            try {
                body = this.#parseBlock();
            } finally {
                this.#inFunction = saved.inFunction;
                this.#loops = saved.loops;
            }

            if(null === body)
                this.#fail(`\`define ${ name }\` has no indented body`, token);

            return AST.defineStatement(name, params, permissions, body, span(token.loc, body.loc));
        }

        /** `return [<value>]` */
        #parseReturnStatement(token) {
            this.#next();

            if(!this.#inFunction)
                this.#fail('`return` is only allowed inside a `define`', token);

            let argument = null;

            if(!this.#at(TokenType.NEWLINE, TokenType.EOF, TokenType.DEDENT))
                argument = this.#parseExpression();

            this.#expect(TokenType.NEWLINE, 'end of line');

            return AST.returnStatement(argument, span(token.loc, (argument ?? token).loc));
        }

        /** `for [as label:] start; stop[; step]` or `for [as label:] <list>` + block. */
        #parseForStatement(token) {
            this.#next();

            let label = null;

            if(this.#at(TokenType.FORMAT) && 'as' === this.#peek().lexeme) {
                this.#next();
                label = this.#expectOwnName('a loop label').value;

                if(this.#loops.includes(label))
                    this.#fail(`A loop inside \`${ label }\` cannot reuse its label`);

                this.#expect(TokenType.COLON, '`:` after the loop label');
            }

            let first = this.#parseExpression()
                , parts = { list: first };

            if(this.#accept(TokenType.SEMICOLON)) {
                parts = { start: first, stop: this.#parseExpression() };

                if(this.#accept(TokenType.SEMICOLON))
                    parts.step = this.#parseExpression();
            }

            this.#loops.push(label);

            let body;

            try {
                body = this.#parseBlock();
            } finally {
                this.#loops.pop();
            }

            if(null === body)
                this.#fail('`for` has no indented body', token);

            return AST.forStatement(label, parts, body, span(token.loc, body.loc));
        }

        /** `break [label]` / `renew [label]` */
        #parseLoopJump(token) {
            this.#next();

            let label = null;

            if(!this.#loops.length)
                this.#fail(`\`${ token.lexeme }\` is only allowed inside a \`for\``, token);

            if(this.#at(TokenType.IDENT)) {
                const target = this.#next();

                if(!this.#loops.includes(target.value))
                    this.#fail(`No enclosing loop is labelled \`${ target.value }\``, target);

                label = target.value;
            }

            this.#expect(TokenType.NEWLINE, 'end of line');

            return (TokenType.BREAK === token.type ? AST.breakStatement(label, token.loc) : AST.renewStatement(label, token.loc));
        }

        /** `after <duration> [with <filter>]` + block — fires once. The duration is any
         * expression, read when the statement is reached, so `after wait_time` works. */
        #parseAfterStatement(token) {
            this.#refuseInFunction(token);
            this.#next();

            let subject = this.#parseExpression()
                , filter = null;

            if(this.#accept(TokenType.WITH))
                filter = this.#parseExpression();

            const body = this.#parseBlock();

            if(null === body)
                this.#record(new DSLParseError('`after` has no indented body', token.loc, this.#source));

            return AST.afterStatement(subject, filter, body, span(token.loc, (body ?? filter ?? subject).loc));
        }

        /** `using [<subject> ...] [+permission ...] [+scope[:mode]] [-- "description"]` */
        #parseUsingStatement(token) {
            this.#refuseInFunction(token);
            this.#next();

            let subjects = []
                , permissions = []
                , scopeMode = null
                , description = null
                , dangerous = null;

            // Several subjects may sit on one line — `using <viewer> <everyone> <all>` —
            // with juxtaposition meaning "any of these". Grants may be interleaved with
            // them freely; they are read directly here rather than through
            // `#parseExpression`, which is what keeps a `+permission` from being a valid
            // operand anywhere else in the language.
            while(!this.#at(TokenType.NEWLINE, TokenType.EOF, TokenType.DEDENT)) {
                if(this.#accept(TokenType.COMMA))
                    continue;

                // `-- "why"` — says what the block is for, typically why it asks for the
                // grants it does. Always last: whatever follows the string is an error, so a
                // description can never swallow a subject that was meant to be live.
                if(this.#at(TokenType.DESCRIBE)) {
                    const marker = this.#next()
                        , text = this.#peek();

                    if(TokenType.STRING !== text.type)
                        this.#fail('`--` in a `using` header must be followed by a quoted description, e.g. `-- "needed for the raid timer"`', marker);

                    description = this.#next().value;

                    if(!this.#at(TokenType.NEWLINE, TokenType.EOF, TokenType.DEDENT))
                        this.#fail('A `--` description ends the `using` header; move anything after it before the `--`');

                    break;
                }

                if(this.#at(TokenType.PERMISSION)) {
                    const grant = this.#next();

                    // `+scope` looks like a grant but is a switch: it changes where `->` and
                    // `=>` put names, and grants nothing. Kept out of `permissions` so it can
                    // never satisfy a `requirePermission('scope')`.
                    if('scope' === grant.value || grant.value.startsWith('scope:'))
                        scopeMode = this.#readScopeMode(grant, scopeMode);
                    else
                        permissions.push(grant.value);

                    if(null === dangerous && DESCRIBED_ACTIONS.has(grant.value.split(':')[0]))
                        dangerous = grant;

                    continue;
                }

                subjects.push(this.#parseExpression());
            }

            // A grant that can change the page or run code has to say why, in the header
            // itself — that text is what a host shows when it asks the viewer to allow it.
            if(null !== dangerous && null === description)
                this.#fail(`\`+${ dangerous.value }\` needs a description saying why: end the header with \`-- "..."\``, dangerous);

            // A header with no subject keeps the current one. That is what lets a grant or
            // a `+scope` switch stand on its own, without dragging a subject change in.
            if(!subjects.length && !permissions.length && null === scopeMode && null === description)
                this.#fail('`using` needs a subject, a `+permission`, `+scope`, or a `-- "description"`', token);

            const body = this.#parseBlock();

            return AST.usingStatement(subjects, body, span(token.loc, (body ?? token).loc), permissions, scopeMode, description);
        }

        /** Validates one `+scope[:mode]` in a `using` header.
         * @param {Object} grant - the `PERMISSION` token
         * @param {?String} previous - a mode this header already set, if any
         * @return {String}
         */
        #readScopeMode(grant, previous) {
            if(this.#blockDepth > 0)
                this.#fail('`+scope` sets the binding rule for a whole script, so it may only appear in a top-level `using`', grant);

            if(null !== previous)
                this.#fail('`+scope` may only be given once per `using`', grant);

            const mode = ('scope' === grant.value ? DEFAULT_SCOPE_MODE : grant.value.slice('scope:'.length));

            if(!SCOPE_MODES.has(mode))
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

            const discriminant = this.#parseWhenHead()
                , dangling = this.#dangling;

            this.#dangling = null;

            if(!dangling) {
                const body = this.#parseBlock();

                if(null === body)
                    this.#record(new DSLParseError('`when` has no indented body', token.loc, this.#source));

                return AST.whenChain(discriminant, body, span(token.loc, (body ?? discriminant).loc));
            }

            this.#expect(TokenType.NEWLINE, 'end of line after `when ... is`');
            this.#expect(TokenType.INDENT, 'an indented list of `when` cases');

            const cases = [];

            this.#skipNewlines();

            while(!this.#at(TokenType.DEDENT, TokenType.EOF)) {
                cases.push(this.#parseWhenCase());
                this.#skipNewlines();
            }

            const close = this.#peek().loc;

            this.#accept(TokenType.DEDENT);

            if(!cases.length)
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
            const test = this.#parseExpression()
                , colon = this.#expect(TokenType.COLON, '`:` after a `when` case label')
                , body = this.#parseBlock();

            return AST.whenCase(test, body, span(test.loc, (body ?? colon).loc));
        }

        /** `with (<expr>)` + block — the statement form.
         *
         * The expression is read in the *current* scope, so `with (.links | ...)` filters
         * the enclosing subject's property; the block runs one scope deeper. */
        #parseWithStatement(token) {
            this.#next();

            const filter = this.#parseExpression()
                , body = this.#parseBlock();

            if(null === body)
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

            if(this.#accept(TokenType.IF)) {
                const test = this.#parseExpression()
                    , body = this.#parseBlock();

                if(null === body)
                    this.#record(new DSLParseError('`else if` has no indented body', token.loc, this.#source));

                return AST.whenChain(test, body, span(token.loc, (body ?? test).loc));
            }

            if(this.#at(TokenType.WHEN))
                this.#fail('`else when` is not a thing; write `when <test>` or `else if <test>` for another branch', this.#peek());

            const body = this.#parseBlock();

            if(null === body)
                this.#record(new DSLParseError('`else` has no indented body', token.loc, this.#source));

            return AST.elseClause(body, span(token.loc, (body ?? token).loc));
        }

        /** `if <test>` */
        #parseIfStatement(token) {
            this.#next();

            const test = this.#parseExpression()
                , body = this.#parseBlock();

            if(null === body)
                this.#record(new DSLParseError('`if` has no indented body', token.loc, this.#source));

            return AST.ifStatement(test, body, span(token.loc, (body ?? test).loc));
        }

        /** `goto <target>` */
        #parseGotoStatement(token) {
            this.#next();

            const target = this.#parseExpression();

            this.#expect(TokenType.NEWLINE, 'end of line');

            return AST.gotoStatement(target, span(token.loc, target.loc));
        }

        /** `POST <argument>` / `REPLY <argument>` / any registered verb. */
        #parseVerbStatement(token) {
            this.#next();

            let argument = null;

            if(!this.#at(TokenType.NEWLINE, TokenType.EOF, TokenType.DEDENT))
                argument = this.#parseExpression();

            this.#expect(TokenType.NEWLINE, 'end of line');

            return AST.verbStatement(token.value, argument, span(token.loc, (argument ?? token).loc));
        }

        /** Keyword -> handler. Declared as a field so `this` stays bound through dispatch. */
        #statementParsers = {
            [TokenType.AWAIT]: this.#parseAwaitStatement,
            [TokenType.AFTER]: this.#parseAfterStatement,
            [TokenType.PLUGIN]: this.#parsePluginHeader,
            [TokenType.DEFINE]: this.#parseDefineStatement,
            [TokenType.RETURN]: this.#parseReturnStatement,
            [TokenType.FOR]: this.#parseForStatement,
            [TokenType.BREAK]: this.#parseLoopJump,
            [TokenType.RENEW]: this.#parseLoopJump,
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

            while(true) {
                const token = this.#peek()
                    , operator = OPERATORS[token.type];

                if(!operator || operator.precedence < minimum)
                    break;

                this.#next();

                // `when .command is` — a comparison with nothing after it is the switch
                // head. Legal only where `#danglingAllowed` says so; everywhere else the
                // right operand is parsed and the missing one reported as usual.
                if(this.#danglingAllowed && this.#at(TokenType.NEWLINE) && (TokenType.IS === token.type || TokenType.IN === token.type)) {
                    this.#dangling = token;

                    break;
                }

                // `is above 50` / `is or above 50`. The comparison word rides on `is` rather
                // than being an operator of its own, so it inherits `is`'s precedence and its
                // non-associativity without a second row in the table. `is or` can mean
                // nothing else — `or` never starts an operand — so reading it as "or equal"
                // steals no existing sentence.
                if(TokenType.IS === token.type && (this.#at(TokenType.COMPARE) || (this.#at(TokenType.OR) && TokenType.COMPARE === this.#peek(1).type))) {
                    const inclusive = !!this.#accept(TokenType.OR)
                        , comparison = (inclusive ? 'or ' : '') + this.#next().lexeme
                        , right = this.#parseExpression(operator.precedence + 1);

                    left = AST.binaryExpression(comparison, left, right, span(left.loc, right.loc));

                    const ahead = OPERATORS[this.#peek().type];

                    if(ahead && ahead.precedence === operator.precedence)
                        this.#fail('`is` is not associative; parenthesize to say which comparison comes first');

                    continue;
                }

                // `where` / `|` filters a *list*. Put after a yes/no value —
                // `await (.command is "so") where ("moderator" in .badges)` — it filters a
                // one-item list of `true`, finds nothing, and the line silently never fires.
                // That is always a mistake for a condition, so say so here.
                if(TokenType.WHERE === token.type && isCondition(left))
                    this.#fail(`\`${ token.lexeme }\` filters a list, but what comes before it is a yes/no condition. To add a condition, use \`with\` after \`await\` — \`await (.command is "so") with ("moderator" in .badges)\` — or \`and\``, token);

                // A left-associative operator forbids its own precedence on the right, so
                // `a or b or c` groups as `(a or b) or c`. A non-associative one does the
                // same, and then rejects a repeat outright.
                const next = (Associativity.RIGHT === operator.associativity ? operator.precedence : operator.precedence + 1)
                    , right = this.#parseExpression(next);

                if(TokenType.IS === token.type)
                    this.#rejectInterpolatedComparison(left, right, token);

                const build = BINARY_BUILDERS[token.type]
                    , loc = span(left.loc, right.loc);

                left = (build ? build(left, right, loc, token) : AST.binaryExpression(operator.lexeme, left, right, loc));

                if(Associativity.NONE === operator.associativity) {
                    const ahead = OPERATORS[this.#peek().type];

                    if(ahead && ahead.precedence === operator.precedence)
                        this.#fail(`\`${ operator.lexeme }\` is not associative; parenthesize to say which comparison comes first`);
                }
            }

            // Assignment is the loosest thing in the language, and it is handled here rather
            // than as a row in `OPERATORS` because its right side is a *name*, not an
            // expression — there is nothing for precedence climbing to climb. Gating on the
            // outermost level is what makes it loosest for free, and is why `(5:00 -> a)`
            // works while `1st <| .links -> a` binds the piped result rather than `.links`.
            if(LOWEST_PRECEDENCE === minimum && this.#at(TokenType.ARROW_LOCAL, TokenType.ARROW_PARENT))
                return this.#parseAssignmentTail(left);

            // `.size above 50` — the `is` was left out.
            if(LOWEST_PRECEDENCE === minimum && this.#at(TokenType.COMPARE))
                this.#parsePrimary();

            // A `-` sitting after a complete expression can only have been meant as
            // subtraction. Saying where arithmetic lives beats "expected end of line".
            if(LOWEST_PRECEDENCE === minimum && this.#at(TokenType.MINUS))
                this.#fail('arithmetic only works inside `calc( ... )`, e.g. `calc(a - b)`; it needs the `eval:calc` permission');

            return left;
        }

        /** `<value> -> name` / `<value> => name`. */
        #parseAssignmentTail(value) {
            const arrow = this.#next()
                , target = this.#peek();

            if(TokenType.IDENT !== target.type)
                this.#fail(`Expected a variable name after \`${ arrow.lexeme }\`, found ${ this.#describe(target) }`);

            this.#next();

            const name = target.value;

            // Enforced here, at the binding site. A reference site cannot reject anything:
            // a name with a lower-case letter resolves variable-then-constant, an ALL-CAPS
            // one resolves constant-only. The subject aliases are only ever read, so they are
            // refused as targets by name rather than by shape.
            if(THIS_ALIASES.has(name))
                this.#fail(`\`${ name }\` always means the current subject and cannot be bound`, target);

            if(!VARIABLE_PATTERN.test(name))
                this.#fail(`A variable name needs a lower-case letter; ALL-CAPS names like \`${ name }\` are the host's constants and verbs`, target);

            if(this.#at(TokenType.ARROW_LOCAL, TokenType.ARROW_PARENT))
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
            if(isInterpolated(left) || isInterpolated(right))
                this.#fail('`is` does not accept a template with `${ ... }` in it; compare against a string, or bind the template to a name first', token);
        }

        /** `not <expr>` / `-<expr>` / `=<expr>` */
        #parseUnary() {
            const token = this.#peek();

            if(this.#at(TokenType.NOT, TokenType.MINUS, TokenType.EXACT)) {
                this.#next();

                const argument = this.#parseUnary()
                    , operator = (TokenType.NOT === token.type ? 'not' : TokenType.EXACT === token.type ? '=' : '-');

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
            while(this.#at(TokenType.SELECTOR_CONTEXT) && this.#peek().loc.start === object.loc.end) {
                const property = this.#next();

                object = AST.memberExpression(object, property.value, span(object.loc, property.loc));
            }

            return object;
        }

        /** @return {Object} */
        #parsePrimary() {
            const token = this.#peek();

            switch(token.type) {
                case TokenType.NUMBER:
                case TokenType.STRING: {
                    this.#next();

                    return AST.literal(token.value, token.lexeme, token.loc);
                }

                case TokenType.TRUE:
                case TokenType.FALSE: {
                    this.#next();

                    return AST.literal(TokenType.TRUE === token.type, token.lexeme, token.loc);
                }

                case TokenType.DURATION: {
                    this.#next();

                    return AST.duration(token.value, token.loc);
                }

                case TokenType.ORDINAL: {
                    this.#next();

                    return AST.ordinalIndex(token.value, token.loc);
                }

                case TokenType.WILDCARD: {
                    // `* from ( ... )` — `*` is ANYTHING, so "anything from" is `any from`.
                    if(TokenType.FROM === this.#peek(1).type)
                        return this.#parseAnyFrom();

                    this.#next();

                    return AST.wildcard(token.loc);
                }

                case TokenType.TEMPLATE: {
                    this.#next();

                    return this.#buildTemplate(token);
                }

                case TokenType.ANY: {
                    return this.#parseAnyFrom();
                }

                case TokenType.LPAREN: {
                    return this.#parseGroup();
                }

                case TokenType.JS_PATH: {
                    return this.#parseJSInvoke();
                }

                case TokenType.CALC: {
                    return this.#parseCalc();
                }

                case TokenType.IDENT: {
                    // `POST TOREADABLE wait_time` — a defined function, read like a verb.
                    // Inside an expression its arguments stop before `%`/`as`, the
                    // comparisons and the logic words, so `TOREADABLE x as "mm:ss"` formats
                    // the result rather than the argument.
                    if(this.#functions.has(token.value))
                        return this.#parseCall(token, CALL_ARGUMENT_PRECEDENCE);

                    this.#next();

                    // `_` and its long-winded spellings are the subject itself — the same
                    // thing `.prop` reads a property from, minus the read.
                    if(THIS_ALIASES.has(token.value))
                        return AST.thisExpression(token.loc);

                    // `ANYTHING` / `SOMETHING` / `NOTHING` are presence tests, the same kind
                    // of value `*` is. Resolved here rather than through the constant table so
                    // a host cannot shadow them.
                    if(token.value in PRESENCE_WORDS)
                        return AST.wildcard(token.loc, PRESENCE_WORDS[token.value]);

                    return AST.identifier(token.value, !!token.isUpper, token.loc);
                }

                case TokenType.SETTING: {
                    this.#next();

                    // `setting.delay` — the `.name` glued on, like any property read.
                    if(!(this.#at(TokenType.SELECTOR_CONTEXT) && this.#peek().loc.start === token.loc.end))
                        this.#fail('A setting is read as `setting.name`', token);

                    const property = this.#next();

                    return AST.settingRead(property.value, span(token.loc, property.loc));
                }

                case TokenType.COUNTER: {
                    this.#next();

                    if(!this.#loops.length)
                        this.#fail('`$` is the loop counter, and there is no `for` here', token);

                    return AST.counter(token.loc);
                }

                case TokenType.RESERVED: {
                    return this.#failReserved(token);
                }

                case TokenType.COMPARE: {
                    return this.#fail(`\`${ token.lexeme }\` only follows \`is\`, as in \`.raid_size is ${ token.lexeme } 50\` or \`.raid_size is or ${ token.lexeme } 50\``, token);
                }

                case TokenType.PERMISSION: {
                    return this.#fail('A `+permission` may only appear in a `using` header', token);
                }

                case TokenType.DESCRIBE: {
                    return this.#fail('A `-- "description"` may only end a `using` header', token);
                }

                case TokenType.COLON: {
                    return this.#fail(COLON_MESSAGE, token);
                }

                default: {
                    break;
                }
            } // switch token.type

            if(token.type in SELECTOR_KINDS)
                return this.#parseSelector();

            return this.#fail(`Expected an expression, found ${ this.#describe(token) }`);
        }

        /** `&datetime.now( <arg> , <arg> )`.
         *
         * The path was lexed as one token and the arguments are ordinary expressions. There
         * is no string anywhere in this construct that becomes code: the compiler hands the
         * segment list to the runtime, which walks a host-supplied binding table. A script
         * naming a path the host never registered fails loudly, exactly as `DISCORD` does. */
        #parseJSInvoke() {
            const token = this.#next();

            // `&Math.PI` — no parentheses glued on — reads a constant. `&Math.max(...)` calls.
            if(!(this.#at(TokenType.LPAREN) && this.#peek().loc.start === token.loc.end))
                return AST.jsInvokeExpression(token.value, null, token.loc);

            this.#expect(TokenType.LPAREN, '`(` after a `&` host call');

            const args = [];

            this.#skipSeparators();

            while(!this.#at(TokenType.RPAREN, TokenType.EOF)) {
                args.push(this.#parseExpression());
                this.#skipSeparators();
            }

            const close = this.#expect(TokenType.RPAREN, '`)` closing the `&` argument list').loc;

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
            const start = this.#next().loc;

            if(!this.#at(TokenType.LPAREN))
                this.#fail('`calc` needs its arithmetic in parentheses, e.g. `calc(.raid_size * 2)`');

            this.#next();
            this.#skipSeparators();

            const expression = this.#parseSum();

            this.#skipSeparators();

            const close = this.#expect(TokenType.RPAREN, '`)` closing `calc(`, or an arithmetic operator').loc;

            return AST.calcExpression(expression, span(start, close));
        }

        /** @param {...String} operators @return {?Object} the ARITH token, consumed */
        #acceptArith(...operators) {
            this.#skipSeparators();

            return ((this.#at(TokenType.ARITH) && operators.includes(this.#peek().value)) ? this.#next() : null);
        }

        #parseSum() {
            let left = this.#parseProduct()
                , operator;

            while((operator = this.#acceptArith('+', '-'))) {
                const right = this.#parseProduct();

                left = AST.arithmeticExpression(operator.value, left, right, span(left.loc, right.loc));
            }

            return left;
        }

        #parseProduct() {
            let left = this.#parseArithUnary()
                , operator;

            while((operator = this.#acceptArith('*', '/', '%'))) {
                const right = this.#parseArithUnary();

                left = AST.arithmeticExpression(operator.value, left, right, span(left.loc, right.loc));
            }

            return left;
        }

        #parseArithUnary() {
            const operator = this.#acceptArith('-', '+');

            if(!operator)
                return this.#parsePower();

            const argument = this.#parseArithSigned();

            if(this.#at(TokenType.ARITH) && '**' === this.#peek().value)
                this.#fail('A unary `-` or `+` cannot be the base of `**`; parenthesize: `(-2) ** 2` or `-(2 ** 2)`');

            return AST.arithmeticExpression(operator.value, null, argument, span(operator.loc, argument.loc));
        }

        /** The operand of a unary sign: more signs, then a bare operand — never `**`, which
         * is what leaves a following `**` visible to the check above. */
        #parseArithSigned() {
            const operator = this.#acceptArith('-', '+');

            if(!operator)
                return this.#parseArithOperand();

            const argument = this.#parseArithSigned();

            return AST.arithmeticExpression(operator.value, null, argument, span(operator.loc, argument.loc));
        }

        #parsePower() {
            const base = this.#parseArithOperand();

            if(!this.#acceptArith('**'))
                return base;

            // Right-associative: `2 ** 3 ** 2` is `2 ** 9`. The exponent may carry a sign.
            const exponent = this.#parseArithUnary();

            return AST.arithmeticExpression('**', base, exponent, span(base.loc, exponent.loc));
        }

        #parseArithOperand() {
            this.#skipSeparators();

            if(this.#at(TokenType.LPAREN)) {
                this.#next();

                const inner = this.#parseSum();

                this.#skipSeparators();
                this.#expect(TokenType.RPAREN, '`)`');

                return inner;
            }

            if(this.#at(TokenType.ARITH))
                this.#fail(`Expected a number before \`${ this.#peek().value }\``);

            return this.#parseMembers(this.#parsePrimary());
        }

        /** `NAME [<arg> [, <arg> ...]]` — a call, spelled like a verb.
         * @param {Object} token - the name
         * @param {Number} precedence - how loosely each argument may bind
         */
        #parseCall(token, precedence) {
            this.#next();

            const args = [];

            if(this.#at(...ARGUMENT_STARTS)) {
                args.push(this.#parseExpression(precedence));

                while(this.#accept(TokenType.COMMA))
                    args.push(this.#parseExpression(precedence));
            }

            const last = (args[args.length - 1] ?? token);

            return AST.callExpression(token.value, args, span(token.loc, last.loc));
        }

        /** Any sigil. `/channel` glued directly to `#prop` collapses into one node. */
        #parseSelector() {
            const token = this.#next()
                , kind = SELECTOR_KINDS[token.type];

            if(TokenType.SELECTOR_REALM === token.type)
                return AST.selector(kind, token.value.path, { realm: token.value.realm, path: token.value.path }, token.loc);

            // `[vip moderator]` — `name` is the first, for display; `names` is what resolves.
            if(TokenType.SELECTOR_BADGE === token.type)
                return AST.selector(kind, token.value[0], { names: token.value }, token.loc);

            // `/ginger_enby#name` — two tokens, but only because they were written without
            // a space. Adjacency in the source is what makes them one selector.
            if(TokenType.SELECTOR_CHANNEL === token.type && this.#at(TokenType.SELECTOR_PROP) && this.#peek().loc.start === token.loc.end) {
                const property = this.#next();

                return AST.selector('prop', property.value, { channel: token.value }, span(token.loc, property.loc));
            }

            return AST.selector(kind, token.value, {}, token.loc);
        }

        /** `any from ( <item> \n <item> ... )`, `any from ( <range> )`, or `any from <value>` —
         * the last picks from a list bound earlier: `any from replies`. */
        #parseAnyFrom() {
            const start = (this.#accept(TokenType.WILDCARD) ?? this.#expect(TokenType.ANY, '`any`')).loc;

            this.#expect(TokenType.FROM, '`from` after `any`');

            if(!this.#at(TokenType.LPAREN)) {
                const source = this.#parseUnary();

                return AST.anyFromExpression([source], span(start, source.loc));
            }

            this.#expect(TokenType.LPAREN, '`(` after `any from`');

            const items = [];

            this.#skipSeparators();

            while(!this.#at(TokenType.RPAREN, TokenType.EOF)) {
                items.push(this.#parseExpression());

                // Items are separated by line; a comma is an *optional* extra separator, so
                // a leading, trailing or doubled one collapses to nothing and two items on
                // one line are still two items. Blank and comment-only lines were already
                // dropped by the tokenizer, so any run of these is one separator.
                this.#skipSeparators();
            }

            const close = this.#expect(TokenType.RPAREN, '`)` closing `any from`').loc;

            if(!items.length)
                this.#fail('`any from` needs at least one item', { loc: span(start, close) });

            return AST.anyFromExpression(items, span(start, close));
        }

        /** A parenthesized expression. May span lines. */
        #parseGroup() {
            const open = this.#expect(TokenType.LPAREN, '`(`').loc;

            this.#skipSeparators();

            // Re-entering at the outermost level is what makes `(5:00 -> wait_time)` bind:
            // the assignment tail pass is gated on that level, and a group is a fresh one.
            const items = [this.#parseExpression()];

            this.#skipSeparators();

            // Two or more items, separated the way `any from` separates them — by line or
            // by optional comma — make a list: `(\`hi\`, \`hey\`) => greetings`.
            while(!this.#at(TokenType.RPAREN, TokenType.EOF)) {
                items.push(this.#parseExpression());
                this.#skipSeparators();
            }

            this.#expect(TokenType.RPAREN, '`)`');

            const loc = span(open, this.#peek(-1).loc);

            if(items.length > 1)
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
            const { quasis, expressions } = token.value
                , parsed = expressions.map(({ source, offset }) => {
                    const tokens = new Tokenizer(source, { fragment: true, origin: { offset, source: this.#source } }).tokenize()
                        , parser = new Parser(tokens, this.#source, this.#functions, this.#loops);

                    return parser.parseInterpolation();
                });

            return AST.templateLiteral(quasis, parsed, token.loc);
        }

        /** Parses a lone expression — the body of a `${ ... }`.
         * @return {Object}
         */
        parseInterpolation() {
            this.#skipNewlines();

            const expression = this.#parseExpression();

            this.#skipNewlines();

            if(!this.#at(TokenType.EOF))
                this.#fail(`Unexpected ${ this.#describe(this.#peek()) } after the interpolated expression`);

            return expression;
        }
    }

    /** Parses source into an AST, collecting every recoverable error.
     * @param {String} source
     * @return {{ program: Object, errors: Array<DSLParseError> }}
     */
    const parseTolerant = (source) => {
        const text = String(source)
            , tokens = new Tokenizer(text).tokenize()
            , parser = new Parser(tokens, text);

        return { program: parser.parseProgram(), errors: parser.errors };
    };

    /** Parses source into an AST.
     * @param {String} source
     * @return {Object} a `Program` node
     * @throws {DSLSyntaxError|DSLParseError} the first fault found
     */
    const parse = (source) => {
        const { program, errors } = parseTolerant(source);

        if(errors.length)
            throw errors[0];

        return program;
    };

    globalThis.TTV_DSL.parser = { Parser, parse, parseTolerant };
    globalThis.TTV_DSL.parse = parse;
})();

if(typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
