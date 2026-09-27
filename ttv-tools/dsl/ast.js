/*** /dsl/ast.js - Node types, node factories, and a table-driven walker
 *              _____  _______              _   _____
 *      /\     / ____||__   __|            | | / ____|
 *     /  \   | (___     | |               | || (___
 *    / /\ \   \___ \    | |           _   | | \___ \
 *   / ____ \  ____) |   | |      _   | |__| | ____) |
 *  /_/    \_\|_____/    |_|     (_)   \____/ |_____/
 */

/** @file Defines the TTV DSL abstract syntax tree.
 *
 * Every node is a plain object — no classes — so a tree survives `JSON.stringify` and can
 * be shipped between the content script and the settings page without a serializer.
 * Traversal is driven by the {@link CHILD_KEYS} table rather than a hand-written switch,
 * so adding a node type is a one-line change in exactly two places (the enum and the
 * table) instead of an edit to `walk`.
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

globalThis.TTV_DSL ??= {};

(() => {
    /** Every kind of node the parser can produce.
     * @enum {String}
     */
    const NodeType = Object.freeze({
        /** The root. `body` is a list of statements. */
        Program: 'Program',
        /** An indented run of statements. */
        Block: 'Block',

        /** `await <subject> [with (<filter>)]` + optional body. */
        AwaitStatement: 'AwaitStatement',
        /** `using <subject> [<subject> ...]` + optional body. */
        UsingStatement: 'UsingStatement',
        /** `after <duration> [with (<filter>)]` + body — a one-shot timer. */
        AfterStatement: 'AfterStatement',
        /** `if <test>` + optional body, plus an optional `alternate` — the `when` that
         * follows it as a sibling. */
        IfStatement: 'IfStatement',
        /** `goto <target>`. */
        GotoStatement: 'GotoStatement',
        /** An uppercase word at statement start, e.g. `POST \`hi\``. */
        VerbStatement: 'VerbStatement',

        /** Two shapes in one node, told apart by `operator`.
         *
         * **Switch** (`operator` is `'is'` or `'in'`): `when <discriminant> is` followed by
         * an indented list of `WhenCase`s. **Chain** (`operator` is `null`): `when <test>`
         * with its own `body`, folded into the preceding `if`/`when`'s `alternate` by the
         * parser. Both may carry an `alternate` of their own. */
        WhenStatement: 'WhenStatement',
        /** One `<expr>:` label and its block, inside a switch-form `when`. */
        WhenCase: 'WhenCase',
        /** `with (<expr>)` + block — the statement form. Distinct from the `filter` an
         * `await` carries on its own line, which is not a node of its own. */
        WithStatement: 'WithStatement',
        /** `else` + block — the last branch of an `if`/`when` chain. Like the chain form of
         * `when`, it is written as a sibling and folded into the chain's final `alternate`
         * by the parser. */
        ElseClause: 'ElseClause',
        /** A statement that is only there for its value's side effect. Restricted to an
         * `AssignmentExpression`: a bare expression on a line is still an error. */
        ExpressionStatement: 'ExpressionStatement',

        /** `a and b`, `a is b`, `a in b`, `a .. b` — see `operator`. */
        BinaryExpression: 'BinaryExpression',
        /** `not a`, `-a`. */
        UnaryExpression: 'UnaryExpression',
        /** `<subject> where (<filter>)`. */
        WhereExpression: 'WhereExpression',
        /** `<left> <| <right>`. */
        PipeExpression: 'PipeExpression',
        /** `1 .. 10` / `1 ... 10`. */
        RangeExpression: 'RangeExpression',
        /** `any from ( ... )`. */
        AnyFromExpression: 'AnyFromExpression',
        /** `1st`, `-2nd` — carries the resolved 0-based `index`. */
        OrdinalIndex: 'OrdinalIndex',

        /** `<value> -> name` / `<value> => name`. An *expression*, not a statement, so
         * `await (5:00 -> wait_time)` can both bind the name and hand the duration on. */
        AssignmentExpression: 'AssignmentExpression',
        /** `_`, `__this__`, `__self__`, `__me__` — the current subject itself. */
        This: 'This',
        /** `&Date.now( ... )`. `path` is the dotted segments; resolution is a property
         * lookup against a host table, never compilation of text. */
        JSInvokeExpression: 'JSInvokeExpression',
        /** `<subject> %n%s <replacement>`. `letters` is the class run, `[]` for a bare `%`. */
        PercentExpression: 'PercentExpression',
        /** `.raider.name` — a property read off whatever the expression before it produced.
         * Only formed when the `.name` is glued to what precedes it. */
        MemberExpression: 'MemberExpression',
        /** `<value> ~ <pattern>` — renders a value (a duration, for now) through a pattern. */
        FormatExpression: 'FormatExpression',
        /** `calc( ... )` — `expression` is an `ArithmeticExpression` tree. */
        CalcExpression: 'CalcExpression',
        /** `a + b`, `-a` inside `calc( ... )`. `left` is null for a unary operator. */
        ArithmeticExpression: 'ArithmeticExpression',
        /** `( a, b, c )` — a group holding two or more items is a list. One item is just a
         * grouped expression, as before. */
        ListExpression: 'ListExpression',

        /** Any sigil: `#`, `#prop`, `/name`, `REALM/id`, `<badge>`, `@user`, `:emote:`, `.prop`. */
        Selector: 'Selector',
        /** A backtick template. */
        TemplateLiteral: 'TemplateLiteral',
        /** A string, number, or boolean. */
        Literal: 'Literal',
        /** A bare word, e.g. `USERNAME`. Resolved against the runtime's constant table.
         * Not a sigil — sigils name things *in* a channel, an identifier names a value the
         * host has published to the script. */
        Identifier: 'Identifier',
        /** `*` / `ANYTHING`, `SOMETHING`, `NOTHING` — a presence test, told apart by `kind`.
         * `*` is always this — never multiplication. */
        Wildcard: 'Wildcard',
        /** `15:00` / `1:30:00`, normalized to milliseconds. */
        Duration: 'Duration',
    });

    /** The `kind` values a {@link NodeType.Selector} may carry. */
    const SelectorKind = Object.freeze({
        CHANNEL: 'channel',
        PROP: 'prop',
        REALM: 'realm',
        BADGE: 'badge',
        USER: 'user',
        CONTEXT: 'context',
    });

    /** Which properties of each node type hold children.
     *
     * A value may be a single node or an array of nodes; {@link walk} handles both. Node
     * types absent from this table are leaves.
     * @type {Object<String, Array<String>>}
     */
    const CHILD_KEYS = Object.freeze({
        [NodeType.Program]: ['body'],
        [NodeType.Block]: ['body'],

        [NodeType.AwaitStatement]: ['subject', 'filter', 'body'],
        [NodeType.AfterStatement]: ['subject', 'filter', 'body'],
        // `permissions` is a list of plain strings, not of nodes, so it stays off this table.
        [NodeType.UsingStatement]: ['subjects', 'body'],
        [NodeType.IfStatement]: ['test', 'body', 'alternate'],
        [NodeType.GotoStatement]: ['target'],
        [NodeType.VerbStatement]: ['argument'],
        [NodeType.WhenStatement]: ['discriminant', 'cases', 'body', 'alternate'],
        [NodeType.WhenCase]: ['test', 'body'],
        [NodeType.WithStatement]: ['filter', 'body'],
        [NodeType.ElseClause]: ['body'],
        [NodeType.ExpressionStatement]: ['expression'],

        [NodeType.BinaryExpression]: ['left', 'right'],
        [NodeType.UnaryExpression]: ['argument'],
        [NodeType.WhereExpression]: ['subject', 'filter'],
        [NodeType.PipeExpression]: ['left', 'right'],
        [NodeType.RangeExpression]: ['start', 'end'],
        [NodeType.AnyFromExpression]: ['items'],
        [NodeType.AssignmentExpression]: ['value'],
        [NodeType.JSInvokeExpression]: ['arguments'],
        [NodeType.PercentExpression]: ['subject', 'replacement'],
        [NodeType.MemberExpression]: ['object'],
        [NodeType.FormatExpression]: ['subject', 'pattern'],
        [NodeType.ListExpression]: ['items'],
        [NodeType.CalcExpression]: ['expression'],
        [NodeType.ArithmeticExpression]: ['left', 'right'],

        [NodeType.TemplateLiteral]: ['expressions'],

        [NodeType.OrdinalIndex]: [],
        [NodeType.Selector]: [],
        [NodeType.Literal]: [],
        [NodeType.Identifier]: [],
        [NodeType.Wildcard]: [],
        [NodeType.Duration]: [],
        [NodeType.This]: [],
    });

    /** Stamps `type` and `loc` onto a set of fields.
     * @param {String} type
     * @param {Object} fields
     * @param {Object} loc
     * @return {Object}
     */
    let node = (type, fields, loc) => Object.assign({ type }, fields, { loc: (loc ?? null) });

    /** One factory per node type. Going through these rather than object literals keeps
     * field names honest — a typo'd key fails at the factory, not three passes later. */
    const factories = {
        /**
         * @param {Array<Object>} body
         * @param {Object} loc
         */
        program: (body, loc) => node(NodeType.Program, { body }, loc),

        /**
         * @param {Array<Object>} body
         * @param {Object} loc
         */
        block: (body, loc) => node(NodeType.Block, { body }, loc),

        /**
         * @param {Object} subject
         * @param {?Object} filter
         * @param {?Object} body
         * @param {Object} loc
         */
        awaitStatement: (subject, filter, body, loc) => node(NodeType.AwaitStatement, { subject, filter, body }, loc),

        /**
         * @param {Object} subject - evaluates to a duration
         * @param {?Object} filter
         * @param {?Object} body
         * @param {Object} loc
         */
        afterStatement: (subject, filter, body, loc) => node(NodeType.AfterStatement, { subject, filter, body }, loc),

        /**
         * @param {Array<Object>} subjects
         * @param {?Object} body
         * @param {Object} loc
         * @param {Array<String>} [permissions] - `+name` grants from the header
         * @param {?String} [scopeMode] - from `+scope[:mode]`; null when the header has none
         * @param {?String} [description] - from a trailing `-- "..."`; null when absent
         */
        usingStatement: (subjects, body, loc, permissions = [], scopeMode = null, description = null) =>
            node(NodeType.UsingStatement, { subjects, body, permissions, scopeMode, description }, loc),

        /**
         * @param {Object} test
         * @param {?Object} body
         * @param {Object} loc
         */
        ifStatement: (test, body, loc) => node(NodeType.IfStatement, { test, body, alternate: null }, loc),

        /** The switch form: `when <discriminant> is` + an indented list of case labels.
         * @param {Object} discriminant
         * @param {String} operator - `'is'` or `'in'`, from the dangling comparison
         * @param {Array<Object>} cases
         * @param {Object} loc
         */
        whenStatement: (discriminant, operator, cases, loc) =>
            node(NodeType.WhenStatement, { discriminant, operator, cases, body: null, alternate: null }, loc),

        /** The chain form: `when <test>` + block, standing as some earlier statement's
         * `alternate`. `operator` is null, which is what tells the two forms apart.
         * @param {Object} test
         * @param {?Object} body
         * @param {Object} loc
         */
        whenChain: (test, body, loc) =>
            node(NodeType.WhenStatement, { discriminant: test, operator: null, cases: [], body, alternate: null }, loc),

        /**
         * @param {Object} test
         * @param {?Object} body
         * @param {Object} loc
         */
        whenCase: (test, body, loc) => node(NodeType.WhenCase, { test, body }, loc),

        /**
         * @param {Object} filter
         * @param {?Object} body
         * @param {Object} loc
         */
        withStatement: (filter, body, loc) => node(NodeType.WithStatement, { filter, body }, loc),

        /**
         * @param {?Object} body
         * @param {Object} loc
         */
        elseClause: (body, loc) => node(NodeType.ElseClause, { body }, loc),

        /**
         * @param {Object} expression
         * @param {Object} loc
         */
        expressionStatement: (expression, loc) => node(NodeType.ExpressionStatement, { expression }, loc),

        /**
         * @param {Object} target
         * @param {Object} loc
         */
        gotoStatement: (target, loc) => node(NodeType.GotoStatement, { target }, loc),

        /**
         * @param {String} verb
         * @param {?Object} argument
         * @param {Object} loc
         */
        verbStatement: (verb, argument, loc) => node(NodeType.VerbStatement, { verb, argument }, loc),

        /**
         * @param {String} operator
         * @param {Object} left
         * @param {Object} right
         * @param {Object} loc
         */
        binaryExpression: (operator, left, right, loc) => node(NodeType.BinaryExpression, { operator, left, right }, loc),

        /**
         * @param {String} operator
         * @param {Object} argument
         * @param {Object} loc
         */
        unaryExpression: (operator, argument, loc) => node(NodeType.UnaryExpression, { operator, argument }, loc),

        /**
         * @param {Object} subject
         * @param {Object} filter
         * @param {Object} loc
         */
        whereExpression: (subject, filter, loc) => node(NodeType.WhereExpression, { subject, filter }, loc),

        /**
         * @param {Object} left
         * @param {Object} right
         * @param {Object} loc
         */
        pipeExpression: (left, right, loc) => node(NodeType.PipeExpression, { left, right }, loc),

        /**
         * @param {Object} start
         * @param {Object} end
         * @param {Boolean} inclusive
         * @param {Object} loc
         */
        rangeExpression: (start, end, inclusive, loc) => node(NodeType.RangeExpression, { start, end, inclusive }, loc),

        /**
         * @param {Array<Object>} items
         * @param {Object} loc
         */
        anyFromExpression: (items, loc) => node(NodeType.AnyFromExpression, { items }, loc),

        /**
         * @param {Number} index - already converted to 0-based; negatives count from the end
         * @param {Object} loc
         */
        ordinalIndex: (index, loc) => node(NodeType.OrdinalIndex, { index }, loc),

        /**
         * @param {String} kind - a {@link SelectorKind}
         * @param {?String} name
         * @param {Object} [extra] - `{ realm, path }` for realms, `{ channel }` for `/a#b`
         * @param {Object} loc
         */
        selector: (kind, name, extra, loc) => node(NodeType.Selector, Object.assign({ kind, name: (name ?? null) }, extra), loc),

        /**
         * @param {Array<String>} quasis
         * @param {Array<Object>} expressions
         * @param {Object} loc
         */
        templateLiteral: (quasis, expressions, loc) => node(NodeType.TemplateLiteral, { quasis, expressions }, loc),

        /**
         * @param {*} value
         * @param {String} raw
         * @param {Object} loc
         */
        literal: (value, raw, loc) => node(NodeType.Literal, { value, raw }, loc),

        /**
         * @param {String} name
         * @param {Boolean} isUpper
         * @param {Object} loc
         */
        identifier: (name, isUpper, loc) => node(NodeType.Identifier, { name, isUpper }, loc),

        /**
         * @param {Object} loc
         * @param {String} [kind = 'anything'] - `'anything'`, `'something'` or `'nothing'`
         */
        wildcard: (loc, kind = 'anything') => node(NodeType.Wildcard, { kind }, loc),

        /**
         * @param {Number} milliseconds
         * @param {Object} loc
         */
        duration: (milliseconds, loc) => node(NodeType.Duration, { milliseconds }, loc),

        /**
         * @param {String} name - already validated to carry an interior underscore
         * @param {String} arrow - `'->'` or `'=>'`; the two are synonyms, and the spelling is
         *   kept only so tooling can round-trip it. Where the name lands is decided by the
         *   enclosing `+scope` mode, never by the arrow.
         * @param {Object} value
         * @param {Object} loc
         */
        assignmentExpression: (name, arrow, value, loc) => node(NodeType.AssignmentExpression, { name, arrow, value }, loc),

        /**
         * @param {Object} loc
         */
        thisExpression: (loc) => node(NodeType.This, {}, loc),

        /**
         * @param {Array<String>} path
         * @param {Array<Object>} args
         * @param {Object} loc
         */
        jsInvokeExpression: (path, args, loc) => node(NodeType.JSInvokeExpression, { path, arguments: args }, loc),

        /**
         * @param {Object} subject
         * @param {Array<String>} letters - the class run; `[]` means the `%n%s` default
         * @param {Object} replacement
         * @param {Object} loc
         */
        percentExpression: (subject, letters, replacement, loc) => node(NodeType.PercentExpression, { subject, letters, replacement }, loc),

        /**
         * @param {Object} object
         * @param {String} property
         * @param {Object} loc
         */
        memberExpression: (object, property, loc) => node(NodeType.MemberExpression, { object, property }, loc),

        /**
         * @param {Object} subject
         * @param {Object} pattern
         * @param {Object} loc
         */
        formatExpression: (subject, pattern, loc) => node(NodeType.FormatExpression, { subject, pattern }, loc),

        /**
         * @param {Array<Object>} items - two or more
         * @param {Object} loc
         */
        listExpression: (items, loc) => node(NodeType.ListExpression, { items }, loc),

        /**
         * @param {Object} expression
         * @param {Object} loc
         */
        calcExpression: (expression, loc) => node(NodeType.CalcExpression, { expression }, loc),

        /**
         * @param {String} operator - `+ - * / % **`
         * @param {?Object} left - null for unary `-` / `+`
         * @param {Object} right
         * @param {Object} loc
         */
        arithmeticExpression: (operator, left, right, loc) => node(NodeType.ArithmeticExpression, { operator, left, right }, loc),
    };

    /**
     * @param {*} value
     * @return {Boolean} true when `value` looks like an AST node
     */
    let isNode = (value) => (null != value && typeof value === 'object' && typeof value.type === 'string' && value.type in CHILD_KEYS);

    /** Depth-first traversal.
     *
     * `visitors` may carry an `enter` and/or `exit` callback that fires for every node, and
     * a callback keyed by any {@link NodeType} that fires only for that type (after
     * `enter`, before descending). Each receives `(node, parent, key)`.
     * @param {Object} root
     * @param {Object} [visitors]
     * @return {Object} `root`, for chaining
     */
    let walk = (root, visitors = {}) => {
        let visit = (current, parent, key) => {
            if (!isNode(current))
                return;

            visitors.enter?.(current, parent, key);
            visitors[current.type]?.(current, parent, key);

            for (let childKey of CHILD_KEYS[current.type]) {
                let child = current[childKey];

                if (Array.isArray(child))
                    for (let entry of child)
                        visit(entry, current, childKey);
                else
                    visit(child, current, childKey);
            }

            visitors.exit?.(current, parent, key);
        };

        visit(root, null, null);

        return root;
    };

    globalThis.TTV_DSL.ast = Object.assign({ NodeType, SelectorKind, CHILD_KEYS, isNode, walk }, factories);
    globalThis.TTV_DSL.NodeType = NodeType;
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
