/*** /dsl/tests/parser.test.js - AST shape tests, one per construct in the mockup
 *
 * Assertions use `assert.like`, which matches a subset of the tree, so a test states only
 * the structure it cares about and stays readable when `loc` fields or new node
 * properties arrive later.
 */

;

(() => {
    const { parse } = globalThis.TTV_DSL;
    const { parseTolerant } = globalThis.TTV_DSL.parser;
    const { NodeType } = globalThis.TTV_DSL.ast;
    const { DSLParseError } = globalThis.TTV_DSL.errors;

    /** Reads a `.ttv` fixture, or returns null in a browser where there is no filesystem.
     * @param {String} name
     * @return {?String}
     */
    let fixture = (name) => {
        if (typeof require !== 'function' || typeof __dirname === 'undefined')
            return null;

        return require('fs').readFileSync(require('path').join(__dirname, 'fixtures', `${ name }.ttv`), 'utf8');
    };

    /** Parses a single statement and hands it back.
     * @param {String} source
     * @return {Object}
     */
    let statement = (source) => parse(source).body[0];

    /** Parses `await <source>` and hands back the awaited expression — the shortest route
     * to an expression node, since the DSL has no bare expression statement.
     * @param {String} source
     * @return {Object}
     */
    let expression = (source) => statement(`await ${ source }\n`).subject;

    describe('parser / statements', () => {
        it('parses `await` with a `with` filter and a body', () => {
            assert.like(statement('await * with (#live is true)\n    POST `x`\n'), {
                type: NodeType.AwaitStatement,
                subject: { type: NodeType.Wildcard },
                filter: { type: NodeType.BinaryExpression, operator: 'is' },
                body: { type: NodeType.Block, body: [{ type: NodeType.VerbStatement, verb: 'POST' }] },
            });
        });

        it('parses `await` with no filter as a null filter', () => {
            assert.like(statement('await 15:00\n'), {
                type: NodeType.AwaitStatement,
                subject: { type: NodeType.Duration, milliseconds: 900000 },
                filter: null,
                body: null,
            });
        });

        it('parses `using` with one subject', () => {
            assert.like(statement('using *\n'), {
                type: NodeType.UsingStatement,
                subjects: [{ type: NodeType.Wildcard }],
            });
        });

        it('parses several juxtaposed `using` subjects as a list', () => {
            assert.like(statement('using [viewer] [everyone] [anyone] [all]\n'), {
                type: NodeType.UsingStatement,
                subjects: [
                    { type: NodeType.Selector, kind: 'badge', name: 'viewer' },
                    { type: NodeType.Selector, kind: 'badge', name: 'everyone' },
                    { type: NodeType.Selector, kind: 'badge', name: 'anyone' },
                    { type: NodeType.Selector, kind: 'badge', name: 'all' },
                ],
            });
        });

        it('parses `if` with a body', () => {
            assert.like(statement('if #name is "ginger_enby"\n    POST `hi`\n'), {
                type: NodeType.IfStatement,
                test: { type: NodeType.BinaryExpression, operator: 'is' },
                body: { type: NodeType.Block },
            });
        });

        it('parses `goto`', () => {
            assert.like(statement('goto #\n'), {
                type: NodeType.GotoStatement,
                target: { type: NodeType.Selector, kind: 'channel' },
            });
        });

        it('treats an all-caps word at statement start as a verb', () => {
            assert.like(statement('POST `!lurk`\n'), {
                type: NodeType.VerbStatement,
                verb: 'POST',
                argument: { type: NodeType.TemplateLiteral },
            });
        });

        it('treats the same word inside an expression as an identifier', () => {
            assert.like(expression('(USERNAME in .message)'), {
                type: NodeType.BinaryExpression,
                operator: 'in',
                left: { type: NodeType.Identifier, name: 'USERNAME', isUpper: true },
            });
        });

        it('allows a verb with no argument', () => {
            assert.like(statement('REPLY\n'), { type: NodeType.VerbStatement, verb: 'REPLY', argument: null });
        });
    });

    describe('parser / operator precedence', () => {
        it('binds `and` tighter than `or`', () => {
            assert.like(expression('.a or .b and .c'), {
                type: NodeType.BinaryExpression,
                operator: 'or',
                right: { type: NodeType.BinaryExpression, operator: 'and' },
            });
        });

        it('binds `is` tighter than `and`', () => {
            assert.like(expression('.a is 1 and .b is 2'), {
                type: NodeType.BinaryExpression,
                operator: 'and',
                left: { type: NodeType.BinaryExpression, operator: 'is' },
                right: { type: NodeType.BinaryExpression, operator: 'is' },
            });
        });

        it('binds `where` tighter than `<|`', () => {
            // The whole point of the precedence table: the filter applies to the
            // collection, and the ordinal indexes the filtered result.
            assert.like(expression('1st <| .links where ("twitch.tv" in .href)'), {
                type: NodeType.PipeExpression,
                left: { type: NodeType.OrdinalIndex, index: 0 },
                right: {
                    type: NodeType.WhereExpression,
                    subject: { type: NodeType.Selector, kind: 'context', name: 'links' },
                    filter: { type: NodeType.BinaryExpression, operator: 'in' },
                },
            });
        });

        it('chains `where` to the left', () => {
            assert.like(expression('.links where (.a is 1) where (.b is 2)'), {
                type: NodeType.WhereExpression,
                subject: { type: NodeType.WhereExpression },
                filter: { type: NodeType.BinaryExpression, operator: 'is' },
            });
        });

        it('rejects a chained non-associative comparison', () => {
            let error = assert.throws(() => parse('await .a is .b is .c\n'), DSLParseError);

            assert.match(error.message, /not associative/i);
        });

        it('accepts the same comparison once parenthesized', () => {
            assert.like(expression('(.a is .b) is .c'), { type: NodeType.BinaryExpression, operator: 'is' });
        });

        it('binds unary `not` tighter than `and`', () => {
            assert.like(expression('not .a and .b'), {
                type: NodeType.BinaryExpression,
                operator: 'and',
                left: { type: NodeType.UnaryExpression, operator: 'not' },
            });
        });

        it('parses ranges, keeping the inclusive flag', () => {
            assert.like(expression('1 .. 10'), { type: NodeType.RangeExpression, inclusive: false });
            assert.like(expression('1 ... 10'), { type: NodeType.RangeExpression, inclusive: true });
        });
    });

    describe('parser / selectors', () => {
        it('tags each sigil with its kind', () => {
            assert.like(expression('#'), { type: NodeType.Selector, kind: 'channel' });
            assert.like(expression('#name'), { type: NodeType.Selector, kind: 'prop', name: 'name' });
            assert.like(expression('/shroud'), { type: NodeType.Selector, kind: 'channel', name: 'shroud' });
            assert.like(expression('[moderator]'), { type: NodeType.Selector, kind: 'badge', name: 'moderator' });
            assert.like(expression('@ephellon'), { type: NodeType.Selector, kind: 'user', name: 'ephellon' });
            assert.like(expression('.sender'), { type: NodeType.Selector, kind: 'context', name: 'sender' });
        });

        it('fuses an adjacent `/channel#prop` into one selector', () => {
            assert.like(expression('/ginger_enby#name'), {
                type: NodeType.Selector,
                kind: 'prop',
                name: 'name',
                channel: 'ginger_enby',
            });
        });

        it('keeps `/channel #prop` separate when a space breaks the adjacency', () => {
            assert.like(statement('using /ginger_enby #name\n'), {
                type: NodeType.UsingStatement,
                subjects: [
                    { type: NodeType.Selector, kind: 'channel' },
                    { type: NodeType.Selector, kind: 'prop', channel: undefined },
                ],
            });
        });

        it('carries the realm and path on a realm selector', () => {
            assert.like(expression('DISCORD/779741119520571456'), {
                type: NodeType.Selector,
                kind: 'realm',
                realm: 'DISCORD',
                path: '779741119520571456',
            });
        });
    });

    describe('parser / `any from`', () => {
        it('reads newline-separated items', () => {
            assert.like(expression('any from (\n    `a`\n    `b`\n    `c`\n)'), {
                type: NodeType.AnyFromExpression,
                items: [
                    { type: NodeType.TemplateLiteral },
                    { type: NodeType.TemplateLiteral },
                    { type: NodeType.TemplateLiteral },
                ],
            });
        });

        it('reads a range as a single item', () => {
            assert.like(expression('any from(1 .. 10)'), {
                type: NodeType.AnyFromExpression,
                items: [{ type: NodeType.RangeExpression, inclusive: false }],
            });
        });

        it('rejects an empty `any from`', () => {
            assert.throws(() => parse('await any from ()\n'), DSLParseError);
        });
    });

    describe('parser / templates', () => {
        it('parses each interpolation into a real sub-tree', () => {
            assert.like(expression('`hi ${ .sender }!`'), {
                type: NodeType.TemplateLiteral,
                quasis: ['hi ', '!'],
                expressions: [{ type: NodeType.Selector, kind: 'context', name: 'sender' }],
            });
        });

        it('parses an interpolation containing a nested `any from` of templates', () => {
            assert.like(expression('`v: ${ any from (\n    `a`\n    `b`\n) }`'), {
                type: NodeType.TemplateLiteral,
                expressions: [{ type: NodeType.AnyFromExpression, items: [{}, {}] }],
            });
        });

        it('reports a fault inside an interpolation at its real position in the file', () => {
            let error = assert.throws(() => parse('POST `a`\nPOST `b ${ .x is .y is .z }`\n'), DSLParseError);

            assert.equal(error.loc.line, 2, 'the error should point at line 2 of the file, not line 1 of the fragment');
        });

        it('keeps an empty template empty', () => {
            assert.like(expression('``'), { type: NodeType.TemplateLiteral, quasis: [''], expressions: [] });
        });
    });

    describe('parser / error recovery', () => {
        it('reports one error per broken line instead of cascading', () => {
            let { errors } = parseTolerant('using *\n    await .a is .b is .c\n        POST `x`\n    POST `ok`\n');

            assert.equal(errors.length, 1);
        });

        it('keeps parsing the statements after a broken one', () => {
            let { program } = parseTolerant('using *\n    await .a is .b is .c\n        POST `x`\n    POST `ok`\n');

            assert.like(program.body[0].body.body[program.body[0].body.body.length - 1], {
                type: NodeType.VerbStatement,
                verb: 'POST',
            });
        });

        it('flags an `if` that opens no block', () => {
            let { errors } = parseTolerant('using *\n    if .a is 1\n    POST `sibling`\n');

            assert.equal(errors.length, 1);
            assert.match(errors[0].message, /no indented body/i);
        });
    });

    describe('parser / fixtures', () => {
        let names = ['hello', 'nesting', 'templates', 'chains'];

        for (let name of names) {
            let source = fixture(name);

            if (null === source) {
                it.skip(`parses ${ name }.ttv`, 'no filesystem in this runtime');

                continue;
            }

            it(`parses ${ name }.ttv without error`, () => {
                let { errors } = parseTolerant(source);

                assert.deepEqual(errors.map(error => error.message), []);
            });
        }

        let mockup = fixture('mockup');

        if (null === mockup)
            it.skip('parses the full mockup', 'no filesystem in this runtime');
        else
            it('parses the full mockup end to end', () => {
                let program = parse(mockup);

                assert.equal(program.type, NodeType.Program);
                assert.equal(program.body.length, 1);
                assert.like(program.body[0], {
                    type: NodeType.AwaitStatement,
                    subject: { type: NodeType.Wildcard },
                    filter: { type: NodeType.BinaryExpression, operator: 'is' },
                });

                // Six `using` blocks hang off the top-level `await`.
                let usings = program.body[0].body.body.filter(node => NodeType.UsingStatement === node.type);

                assert.equal(usings.length, 6);
            });

        let malformed = fixture('malformed');

        if (null === malformed)
            it.skip('recovers from malformed.ttv', 'no filesystem in this runtime');
        else
            it('recovers from every fault in malformed.ttv', () => {
                let { errors } = parseTolerant(malformed);

                assert.equal(errors.length, 3);
                assert.match(errors[0].message, /not associative/i);
                assert.match(errors[1].message, /expected an expression/i);
                assert.match(errors[2].message, /no indented body/i);
            });

        for (let name of ['idea', 'variables', 'when', 'permissions']) {
            let source = fixture(name);

            if (null === source)
                it.skip(`parses ${ name }.ttv without a single error`, 'no filesystem in this runtime');
            else
                it(`parses ${ name }.ttv without a single error`, () => {
                    let { errors } = parseTolerant(source);

                    assert.deepEqual(errors.map(error => error.message), []);
                });
        }
    });

    // -- v2 -----------------------------------------------------------------

    describe('parser / variables and the two arrows', () => {
        it('reads `-> name` as an assignment expression', () => {
            assert.like(expression('(`hi` -> mod_msg)'), {
                type: NodeType.AssignmentExpression,
                name: 'mod_msg',
                arrow: '->',
                value: { type: NodeType.TemplateLiteral },
            });
        });

        it('reads `=> name` as the same assignment, keeping only the spelling', () => {
            assert.like(expression('(`hi` => mod_msg)'), { type: NodeType.AssignmentExpression, arrow: '=>' });
        });

        it('accepts an assignment as a whole statement, but not a bare expression', () => {
            assert.like(statement('`hi` -> mod_msg\n'), {
                type: NodeType.ExpressionStatement,
                expression: { type: NodeType.AssignmentExpression, name: 'mod_msg' },
            });

            assert.throws(() => parse('`hi`\n'), /expected a statement/i);
        });

        it('binds through a group, which is what makes `await (5:00 -> t)` work', () => {
            assert.like(statement('await (5:00 -> wait_time)\n'), {
                type: NodeType.AwaitStatement,
                subject: { type: NodeType.AssignmentExpression, name: 'wait_time', value: { type: NodeType.Duration } },
            });
        });

        it('requires an interior underscore in a bound name', () => {
            for (let name of ['x', '_x', 'x_', 'USERNAME'])
                assert.throws(() => parse(`\`hi\` -> ${ name }\n`), /interior underscore/i);

            assert.ok(parse('`hi` -> a_b\n'));
            assert.ok(parse('`hi` -> mod_msg_2\n'));
        });

        it('refuses to bind a subject alias', () => {
            for (let name of ['_', '__this__', '__self__', '__me__'])
                assert.throws(() => parse(`\`hi\` -> ${ name }\n`), /cannot be bound/i);
        });

        it('refuses a chained assignment', () => {
            assert.throws(() => parse('`hi` -> a_b -> c_d\n'), /chained assignment/i);
        });

        it('reads every subject alias as the same node, and never rejects it at a read', () => {
            for (let name of ['_', '__this__', '__self__', '__me__'])
                assert.like(expression(name), { type: NodeType.This });
        });
    });

    describe('parser / `when`', () => {
        /** @param {String} body @return {Array<Object>} the statements inside an `await` body */
        let inAwait = (body) => statement(`await *\n${ body }`).body.body;

        it('reads a dangling `is` as the switch form', () => {
            let [when] = inAwait('    when .command is\n        "help":\n            POST `a`\n        *:\n            POST `b`\n');

            assert.like(when, {
                type: NodeType.WhenStatement,
                operator: 'is',
                discriminant: { type: NodeType.Selector, kind: 'context', name: 'command' },
                cases: [
                    { type: NodeType.WhenCase, test: { type: NodeType.Literal, value: 'help' } },
                    { type: NodeType.WhenCase, test: { type: NodeType.Wildcard } },
                ],
            });
        });

        it('reads `when <test>` as a chain, and folds it into the preceding `if`', () => {
            let body = inAwait('    if .a is "x"\n        POST `a`\n    when .a is "y"\n        POST `b`\n    when .a is *\n        POST `c`\n');

            // Three source statements, one tree: the chain is nested, not flat.
            assert.equal(body.length, 1);
            assert.like(body[0], {
                type: NodeType.IfStatement,
                alternate: {
                    type: NodeType.WhenStatement,
                    operator: null,
                    alternate: { type: NodeType.WhenStatement, operator: null, alternate: null },
                },
            });
        });

        it('refuses a chain `when` with nothing to continue', () => {
            assert.throws(() => parse('await *\n    POST `a`\n    when .a is "y"\n        POST `b`\n'), /but there is none here/i);
        });

        it('points `elif` and friends at `when` and `else`', () => {
            for (let word of ['elif', 'elseif'])
                assert.throws(() => parse(`await *\n    ${ word } .a is "x"\n        POST \`a\`\n`), /use `when <test>` for the next condition, or `else`/i);

            assert.throws(() => parse('await *\n    switch .a\n        POST `a`\n'), /when <expression> is/i);
            assert.throws(() => parse('await *\n    default\n        POST `a`\n'), /put an `else` after/i);
        });

        it('points `calc` at the reservation note', () => {
            assert.throws(() => parse('await *\n    POST calc(1)\n'), /arithmetic is not implemented/i);
        });

        it('points a binary `-` at the same note', () => {
            assert.throws(() => parse('await *\n    POST 1 - 2\n'), /arithmetic is not implemented/i);
        });
    });

    describe('parser / permissions', () => {
        it('collects `+name` grants off a `using` header', () => {
            assert.like(statement('using [vip] +read:datetime +eval:calc\n    POST `a`\n'), {
                type: NodeType.UsingStatement,
                permissions: ['read:datetime', 'eval:calc'],
                subjects: [{ type: NodeType.Selector, kind: 'badge', name: 'vip' }],
            });
        });

        it('allows grants interleaved with subjects', () => {
            assert.like(statement('using [vip] +a:b [moderator]\n    POST `a`\n'), {
                permissions: ['a:b'],
                subjects: [{ name: 'vip' }, { name: 'moderator' }],
            });
        });

        it('refuses a `+permission` anywhere else', () => {
            assert.throws(() => parse('await *\n    POST +read:datetime\n'), /only appear in a `using` header/i);
        });
    });

    describe('parser / the rest of v2', () => {
        it('reads `with (...)` at statement position as a block statement', () => {
            assert.like(statement('with (.links | .a)\n    POST `x`\n'), {
                type: NodeType.WithStatement,
                filter: { type: NodeType.WhereExpression },
                body: { type: NodeType.Block },
            });
        });

        it('leaves `await ... with (...)` alone', () => {
            assert.like(statement('await * with (#live is true)\n    POST `x`\n'), {
                type: NodeType.AwaitStatement,
                filter: { type: NodeType.BinaryExpression, operator: 'is' },
            });
        });

        it('reads `|` as `where`, producing the identical node', () => {
            let strip = (node) => JSON.stringify(node, (key, value) => ('loc' === key? undefined: value));

            assert.equal(strip(expression('(.links | .a)')), strip(expression('(.links where .a)')));
        });

        it('groups `%` looser than `<|` and tighter than `is`', () => {
            assert.like(expression('(1st <| .links % `,`)'), {
                type: NodeType.PercentExpression,
                subject: { type: NodeType.PipeExpression },
            });

            assert.like(expression('(.a % `,` is `b`)'), {
                type: NodeType.BinaryExpression,
                operator: 'is',
                left: { type: NodeType.PercentExpression },
            });
        });

        it('carries the class run on the node, defaulting to empty', () => {
            assert.like(expression('(.a %d%s `x`)'), { letters: ['d', 's'] });
            assert.like(expression('(.a % `x`)'), { letters: [] });
        });

        it('reads `=` as a unary prefix on the operand', () => {
            assert.like(expression('(.a is =\'TeXt\')'), {
                operator: 'is',
                right: { type: NodeType.UnaryExpression, operator: '=', argument: { value: 'TeXt' } },
            });
        });

        it('refuses `is` against a template that still interpolates', () => {
            assert.throws(() => parse('await (.a is `x ${ .b }`)\n'), /does not accept a template/i);
            // A template with nothing to evaluate is just text, and is fine.
            assert.ok(parse('await (.a is `plain`)\n'));
        });

        it('reads `&` as a path plus an argument list', () => {
            assert.like(expression('&Date.now()'), {
                type: NodeType.JSInvokeExpression,
                path: ['Date', 'now'],
                arguments: [],
            });

            assert.like(expression('&Date.now(123)'), { arguments: [{ type: NodeType.Literal, value: 123 }] });
        });

        it('treats commas as optional separators inside a list', () => {
            assert.equal(expression('any from (\n`a`\n`b`\n)').items.length, 2);
            assert.equal(expression('any from (\n, `a`\n, `b`\n,\n)').items.length, 2);
        });

        it('does not let a comma separate statements', () => {
            assert.throws(() => parse('await *\n    POST `a`\n    ,\n'), DSLParseError);
        });

        it('still reads two templates on one line as two items', () => {
            assert.equal(expression('any from (\n`a` `b`\n)').items.length, 2);
        });

        it('names every reading of ":" when a bare one turns up', () => {
            let error = assert.throws(() => parse('await :\n'), DSLParseError);

            assert.match(error.message, /duration/i);
            assert.match(error.message, /`when` case label/i);
        });
    });
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
