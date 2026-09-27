/*** /dsl/tests/v2.test.js - Semantics of everything v2 added
 *
 * The parser tests pin the shapes; these pin what the shapes *do*. Same deterministic
 * apparatus as `runtime.test.js` — a fake clock and a seeded generator — because the
 * interesting v2 questions ("can a later sibling see this binding?", "does `+eval` open
 * `eval:calc`?") are all about what a script observes while it runs.
 */

;

(() => {
    const { run, createRuntime, parse } = globalThis.TTV_DSL;
    const { createFakeClock, createSeededRandom, createTwitchRealm, percent } = globalThis.TTV_DSL.runtime;
    const { DSLRuntimeError, DSLPermissionError } = globalThis.TTV_DSL.errors;

    /** Reads a `.ttv` fixture, or null in a browser where there is no filesystem. */
    let fixture = (name) => {
        if (typeof require !== 'function' || typeof __dirname === 'undefined')
            return null;

        return require('fs').readFileSync(require('path').join(__dirname, 'fixtures', `${ name }.ttv`), 'utf8');
    };

    /** A runtime on a fake clock, with whatever host bindings the test needs.
     * @return {{ runtime, clock, realm, failures }}
     */
    let harness = ({ seed = 1, jsBindings, jsPermissions, constants, channels } = {}) => {
        let clock = createFakeClock(0),
            failures = [],
            realm = createTwitchRealm({
                current: 'ginger_enby',
                channels: (channels ?? { ginger_enby: { live: true, badges: ['moderator', 'vip', 'subscriber'] } }),
            });

        let runtime = createRuntime({
            clock,
            wallClock: () => 0,
            random: createSeededRandom(seed),
            realms: { TWITCH: realm },
            constants: Object.assign({ USERNAME: 'ephellon' }, constants),
            jsBindings,
            jsPermissions,
            // Faults inside a detached timer loop are reported, not thrown, so a test that
            // wants to assert on one has to collect them here.
            logger: { log() {}, warn() {}, error: (entry) => failures.push(String(entry)) },
        });

        return { runtime, clock, realm, failures };
    };

    /** @return {Array<String>} the text of everything sent */
    let sent = (runtime) => runtime.sink.map(entry => entry.text);

    // -- variables ----------------------------------------------------------

    describe('v2 / variables and scope', () => {
        let source = fixture('variables');

        if (null === source)
            it.skip('runs variables.ttv', 'no filesystem in this runtime');
        else
            it('shares a binding with siblings under the default `+scope:global`, whichever arrow made it', async () => {
                let { runtime, clock } = harness();

                await run(source, runtime, { channel: runtime.defaultRealm.current });
                await clock.advance(90000);

                assert.deepEqual(sent(runtime), [
                    'first: checked in',
                    // One block's binding is visible to the next sibling.
                    'second: checked in',
                    // ...and to what that block nests.
                    'nested: also shared',
                    // Never bound at all: empty, not an error.
                    'missing: []',
                    // `->` made this one, and it is shared exactly as `=>` would have been.
                    'sibling: also shared',
                ]);
            });

        /** One script, three modes. `sib_note` is bound in an `await` body and read by that
         * body's child and by a sibling `await`; `deep_note` is bound one `using` deeper and
         * read by the sibling, which is a cousin of where it was made. */
        let modes = (mode) => [
            `using ${ mode }`,
            '    await 1:00',
            '        `a` -> sib_note',
            '        using *',
            '            `b` => deep_note',
            '            POST `inner: [${ sib_note }]`',
            '    await 1:10',
            '        POST `sibling: [${ sib_note }] deep: [${ deep_note }]`',
            '',
        ].join('\n');

        for (let [mode, expected] of [
            // Locked to the block that bound it and what that block nests.
            ['+scope:local', ['inner: [a]', 'sibling: [] deep: []']],
            // Shared one level out: siblings see it, a cousin two levels away does not.
            ['+scope:global', ['inner: [a]', 'sibling: [a] deep: []']],
            // A bare `+scope` is `global`.
            ['+scope', ['inner: [a]', 'sibling: [a] deep: []']],
            // Everything sees everything.
            ['+scope:universal', ['inner: [a]', 'sibling: [a] deep: [b]']],
        ])
            it(`decides where both arrows bind under \`${ mode }\``, async () => {
                let { runtime, clock } = harness();

                await run(modes(mode), runtime, { channel: runtime.defaultRealm.current });
                await clock.advance(75000);

                assert.deepEqual(sent(runtime), expected);
            });

        it('binds at the top level, where there is no parent to write into', async () => {
            let { runtime, clock } = harness();

            await run('`hi` => mod_msg\nawait 1:00\n    POST `${ mod_msg }`\n', runtime, {});
            await clock.advance(61000);

            assert.deepEqual(sent(runtime), ['hi']);
        });

        it('refuses `+scope` anywhere but a top-level `using`, and refuses unknown modes', () => {
            assert.throws(() => parse('await *\n    using +scope:local\n        POST `a`\n'), /top-level `using`/i);
            assert.throws(() => parse('using +scope:galactic\n    POST `a`\n'), /Unknown scope mode "galactic"/);
            assert.throws(() => parse('using +scope +scope:local\n    POST `a`\n'), /only be given once/i);
        });

        it('never treats `+scope` as a grant', () => {
            assert.like(parse('using +scope:local +read:datetime\n    POST `a`\n').body[0], {
                permissions: ['read:datetime'],
                scopeMode: 'local',
            });
        });

        it('binds through an `await` duration without turning it into an event-await', async () => {
            let { runtime, clock } = harness();

            // The duration-vs-event decision is syntactic, so an assignment wrapped around
            // the subject is exactly the shape that could silently stop the timer firing.
            await run('await (1:00 -> wait_time)\n    POST `waited ${ wait_time }`\n', runtime, {});

            assert.equal(runtime.listenerCount, 0, 'this must be a timer, not an event subscription');

            await clock.advance(61000);

            assert.deepEqual(sent(runtime), ['waited 60000']);
        });

        it('reads an unbound variable as empty but an unknown constant as an error', async () => {
            let { runtime, failures } = harness();

            await run('await *\n    POST `[${ not_bound }]`\n', runtime, {});
            await runtime.dispatch({ sender: 'a' });

            assert.deepEqual(sent(runtime), ['[]']);

            // A name with no interior underscore can only be a constant, and an unknown
            // constant still fails loudly — that is what the underscore rule buys.
            await run('await *\n    POST `${ NOPE }`\n', runtime, {});
            await runtime.dispatch({ sender: 'a' });

            assert.ok(failures.some(entry => /unknown name/i.test(entry)));
        });

        it('resolves a subject alias to the same thing `.prop` reads from', async () => {
            let { runtime } = harness();

            await run('await *\n    POST `${ .name } / ${ _ }`\n', runtime, {});
            await runtime.dispatch({ name: 'zip' });

            assert.deepEqual(sent(runtime), ['zip / zip']);
        });
    });

    // -- when ---------------------------------------------------------------

    describe('v2 / `when`', () => {
        let source = fixture('when');

        /** Dispatches one command and returns what both `when`s replied. */
        let ask = async (command) => {
            let { runtime } = harness();

            await run(source, runtime, { channel: runtime.defaultRealm.current });
            await runtime.dispatch({ command, sender: 'someone' });

            return sent(runtime);
        };

        if (null === source) {
            it.skip('runs when.ttv', 'no filesystem in this runtime');
        } else {
            it('picks the matching case in the switch form', async () => {
                assert.deepEqual(await ask('help'), ['switch: help', 'chain: help']);
                assert.deepEqual(await ask('gamble'), ['switch: gamble', 'chain: gamble']);
            });

            it('falls through to `*`, which needs no special casing', async () => {
                assert.deepEqual(await ask('whoami'), ['switch: other', 'chain: other']);
            });
        }

        it('runs at most one branch of a chain', async () => {
            let { runtime } = harness();

            await run([
                'await *',
                '    if .a is "x"',
                '        POST `first`',
                '    when .a is *',
                '        POST `second`',
                '',
            ].join('\n'), runtime, {});

            await runtime.dispatch({ a: 'x' });

            assert.deepEqual(sent(runtime), ['first']);
        });
    });

    // -- permissions --------------------------------------------------------

    describe('v2 / permissions', () => {
        let bindings = { Date: { now: () => 1234 }, Math: { random: () => 0.5 } },
            mapping = { 'Date.now': 'read:datetime' };

        let source = fixture('permissions');

        if (null === source)
            it.skip('runs permissions.ttv', 'no filesystem in this runtime');
        else
            it('honours a grant and refuses everything it does not cover', async () => {
                let { runtime, clock, failures } = harness({ jsBindings: bindings, jsPermissions: mapping });

                await run(source, runtime, { channel: runtime.defaultRealm.current });
                await clock.advance(90000);

                assert.deepEqual(sent(runtime), ['granted: 1234']);
                assert.equal(failures.filter(entry => /DSLPermissionError/.test(entry)).length, 2);
            });

        // The regression that matters. Nothing in the runtime does prefix matching, and
        // nothing ever should: a grant that silently widens is a grant nobody can audit.
        it('does not let `+eval` stand in for `eval:calc`, in either direction', async () => {
            let { runtime, failures } = harness({ jsBindings: bindings, jsPermissions: { 'Math.random': 'eval:calc' } });

            await run('using * +eval\n    await *\n        POST `${ &Math.random() }`\n', runtime, {});
            await runtime.dispatch({ a: 1 });

            assert.equal(sent(runtime).length, 0);
            assert.ok(failures.some(entry => /not granted .\+eval:calc/.test(entry)), failures.join('\n'));

            let narrow = harness({ jsBindings: bindings, jsPermissions: { 'Math.random': 'eval' } });

            await run('using * +eval:calc\n    await *\n        POST `${ &Math.random() }`\n', narrow.runtime, {});
            await narrow.runtime.dispatch({ a: 1 });

            assert.equal(sent(narrow.runtime).length, 0);
            assert.ok(narrow.failures.some(entry => /not granted .\+eval\b/.test(entry)), narrow.failures.join('\n'));
        });

        it('accumulates grants down the nesting tree, never sideways', async () => {
            let { runtime, failures } = harness({ jsBindings: bindings, jsPermissions: { 'Math.random': 'a:b' } });

            await run([
                'using * +a:b',
                '    using *',
                '        await *',
                '            POST `inner ${ &Math.random() }`',
                'using *',
                '    await *',
                '        POST `sibling ${ &Math.random() }`',
                '',
            ].join('\n'), runtime, {});

            await runtime.dispatch({ a: 1 });

            assert.deepEqual(sent(runtime), ['inner 0.5']);
            assert.ok(failures.some(entry => /DSLPermissionError/.test(entry)));
        });

        it('raises DSLPermissionError, not a generic runtime error', () => {
            let { runtime } = harness(),
                context = runtime.createContext({ permissions: ['a'] });

            assert.equal(runtime.requirePermission('a', context), true);
            assert.throws(() => runtime.requirePermission('a:b', context), DSLPermissionError);
        });
    });

    // -- host calls ---------------------------------------------------------

    describe('v2 / `&` host calls', () => {
        it('fails loudly when the host registered nothing', () => {
            let { runtime } = harness(),
                context = runtime.createContext({ permissions: ['eval:js'] });

            let error = assert.throws(() => runtime.invokeJS(['Date', 'now'], [], context), DSLRuntimeError);

            assert.match(error.message, /no host binding/i);
        });

        it('calls a registered binding with its arguments', () => {
            let { runtime } = harness({ jsBindings: { Math: { max: (...values) => Math.max(...values) } } }),
                context = runtime.createContext({ permissions: ['eval:js'] });

            assert.equal(runtime.invokeJS(['Math', 'max'], [1, 9, 3], context), 9);
        });

        it('defaults to requiring `eval:js`', () => {
            let { runtime } = harness({ jsBindings: { Date: { now: () => 1 } } }),
                context = runtime.createContext({ permissions: [] });

            assert.throws(() => runtime.invokeJS(['Date', 'now'], [], context), DSLPermissionError);
        });

        it('refuses to walk through `constructor` or `__proto__`', () => {
            let { runtime } = harness({ jsBindings: { Date: { now: () => 1 } } }),
                context = runtime.createContext({ permissions: ['eval:js'] });

            for (let segment of ['constructor', '__proto__', 'prototype'])
                assert.throws(() => runtime.invokeJS(['Date', segment, 'x'], [], context), /never allowed/i);
        });
    });

    // -- % ------------------------------------------------------------------

    describe('v2 / the `%` operator', () => {
        it('matches, with a bare `%`, any whitespace run containing a newline', () => {
            assert.equal(percent('a\n   b', [], '·'), 'a·b');
            assert.equal(percent('a  \n\n  b', [], '·'), 'a·b');
            // The two shapes `%n%s` (\n+\s+) would have let through.
            assert.equal(percent('a\nb', [], '·'), 'a·b');
            assert.equal(percent('a\r\nb', [], '·'), 'a·b');
            // Spaces within a line are content, not a line break.
            assert.equal(percent('a  b\nc', [], '·'), 'a  b·c');
            // Spelled out, `%n%s` still means exactly what it concatenates to.
            assert.equal(percent('a\nb', ['n', 's'], '·'), 'a\nb');
        });

        it('trims before replacing, always', () => {
            // The trim is unconditional; `%c` is accepted and ignored, so spelling the flag
            // out changes nothing.
            assert.equal(percent('\n   a\n   b\n   ', [], '·'), 'a·b');
            assert.equal(percent('\n   a\n   b\n   ', ['c'], '·'), 'a·b');
        });

        it('inserts the replacement verbatim, with no implicit padding', () => {
            // Spacing is opt-in and lives in the replacement string. An operator that padded
            // its own output would be impossible to turn off.
            assert.equal(percent('a\n   b', [], '·'), 'a·b');
            assert.equal(percent('a\n   b', [], ' · '), 'a · b');
            assert.equal(percent(['a', 'b'], [], ','), 'a,b');
            assert.equal(percent(['a', 'b'], [], ' · '), 'a · b');
        });

        it('reads `%w` as JavaScript\'s `\\w`, underscore included', () => {
            // Deliberate: `%` only ever works on strings, and `\w` is what this notation
            // means everywhere else. `%a` is the letters-only class.
            assert.equal(percent('a_1b', ['w'], '-'), '-');
            assert.equal(percent('a_1b', ['a'], '-'), '-_1-');
            assert.equal(percent('a-b', ['W'], '-'), 'a-b');
        });

        it('concatenates the classes in the order given', () => {
            // `%d%s` matches a run of digits followed by a run of spaces — and replaces the
            // whole thing, not just the tail.
            assert.equal(percent('a1  b', ['d', 's'], '-'), 'a-b');
            assert.equal(percent('a  1b', ['d', 's'], '-'), 'a  1b');
        });

        it('handles a zero-width class without quantifying it', () => {
            assert.equal(percent('ab cd', ['b'], '|'), '|ab| |cd|');
        });

        it('joins a list instead of replacing', () => {
            assert.equal(percent(['a', 'b', 'c'], [], ', '), 'a, b, c');
        });

        it('refuses an unknown class', () => {
            assert.throws(() => percent('a', ['q'], '-'), DSLRuntimeError);
        });

        it('produces idea.ttv\'s worked example', async () => {
            let { runtime } = harness();

            // Byte-for-byte the shape from idea.ttv lines 51-57, with the interpolation
            // resolved. The replacement goes in verbatim, so `% '·'` gives a bare separator;
            // the spaced form is `% ' · '`, asserted just below.
            await run([
                'await *',
                '    REPLY `',
                '        help → this help message',
                '        gamble → throw away all your monies',
                '        whoami → ${ .sender }, silly',
                '    ` % \'·\'',
                '',
            ].join('\n'), runtime, {});

            await runtime.dispatch({ sender: 'zip' });

            assert.deepEqual(sent(runtime), [
                'help → this help message·gamble → throw away all your monies·whoami → zip, silly',
            ]);
        });

        it('produces the spaced form when the replacement carries the spaces', async () => {
            let { runtime } = harness();

            await run([
                'await *',
                '    REPLY `',
                '        help → this help message',
                '        gamble → throw away all your monies',
                '        whoami → ${ .sender }, silly',
                '    ` % \' · \'',
                '',
            ].join('\n'), runtime, {});

            await runtime.dispatch({ sender: 'zip' });

            assert.deepEqual(sent(runtime), [
                'help → this help message · gamble → throw away all your monies · whoami → zip, silly',
            ]);
        });
    });

    // -- the remaining odds and ends ----------------------------------------

    describe('v2 / `=`, `with`, and commas', () => {
        it('makes a comparison case-sensitive, and leaves the default alone', async () => {
            let { runtime } = harness();

            await run([
                'await *',
                '    if .a is "HELP"',
                '        POST `loose`',
                '    if .a is ="HELP"',
                '        POST `exact-miss`',
                '    if .a is ="help"',
                '        POST `exact-hit`',
                '',
            ].join('\n'), runtime, {});

            await runtime.dispatch({ a: 'help' });

            assert.deepEqual(sent(runtime), ['loose', 'exact-hit']);
        });

        it('runs a `with` block once on a boolean and once per element on a list', async () => {
            let { runtime } = harness();

            await run([
                'await *',
                '    with (#live is true)',
                '        POST `once`',
                '    with (.links | ("twitch.tv" in .href))',
                '        POST `link ${ .href }`',
                '',
            ].join('\n'), runtime, { channel: runtime.defaultRealm.current });

            await runtime.dispatch({
                links: [{ href: 'https://twitch.tv/a' }, { href: 'https://example.com' }, { href: 'https://twitch.tv/b' }],
            });

            assert.deepEqual(sent(runtime), ['once', 'link https://twitch.tv/a', 'link https://twitch.tv/b']);
        });

        // A settled rule, pinned in both directions. `where` (and therefore `|`) binds
        // tighter than `is`/`in`, which is what makes `1st <| .links where (...)`
        // filter-then-index. The consequence is that a predicate containing a comparison has
        // to be parenthesized — that is the canonical spelling, not a workaround.
        it('reads a parenthesized predicate as a genuine `where` filter', () => {
            let { NodeType } = globalThis.TTV_DSL.ast;

            assert.like(parse('await (.links | ("x" in .href))\n').body[0].subject, {
                type: NodeType.WhereExpression,
                subject: { type: NodeType.Selector, kind: 'context', name: 'links' },
                filter: { type: NodeType.BinaryExpression, operator: 'in' },
            });
        });

        it('reads an unparenthesized predicate as a comparison, not a filter', () => {
            let { NodeType } = globalThis.TTV_DSL.ast;

            assert.like(parse('await (.links | "x" in .href)\n').body[0].subject, {
                type: NodeType.BinaryExpression,
                operator: 'in',
                left: { type: NodeType.WhereExpression },
            });
        });

        it('ignores commas wherever they are optional', async () => {
            let { runtime } = harness({ seed: 3 });

            await run('await *\n    POST any from (\n        , `a`\n        , `a`\n        ,\n    )\n', runtime, {});
            await runtime.dispatch({ x: 1 });

            assert.deepEqual(sent(runtime), ['a']);
        });
    });

    // -- batch 3: else, comparisons, presence, members, bare `using` -------

    /** Runs a script and fires the given events at it, in order.
     * @return {Promise<Array<String>>} everything sent */
    let fire = async (source, events) => {
        let { runtime } = harness();

        await run(source, runtime, { channel: runtime.defaultRealm.current });

        for (let event of events)
            await runtime.dispatch(event);

        return sent(runtime);
    };

    describe('v2 / `else`', () => {
        let chain = [
            'await *',
            '    if .n is "a"',
            '        POST `first`',
            '    when .n is "b"',
            '        POST `second`',
            '    else',
            '        POST `neither`',
            '',
        ].join('\n');

        it('runs only when every branch before it declined', async () => {
            assert.deepEqual(await fire(chain, [{ n: 'a' }, { n: 'b' }, { n: 'c' }]), ['first', 'second', 'neither']);
        });

        it('closes a switch-form `when` too', async () => {
            let source = 'await *\n    when .n is\n        "a":\n            POST `a`\n    else\n        POST `other`\n';

            assert.deepEqual(await fire(source, [{ n: 'a' }, { n: 'z' }]), ['a', 'other']);
        });

        it('accepts `else if` as another spelling of a chain `when`', async () => {
            let source = [
                'await *',
                '    if .n is "a"',
                '        POST `first`',
                '    else if .n is "b"',
                '        POST `second`',
                '    when .n is "c"',
                '        POST `third`',
                '    else',
                '        POST `none`',
                '',
            ].join('\n');

            assert.deepEqual(await fire(source, [{ n: 'a' }, { n: 'b' }, { n: 'c' }, { n: 'd' }]), ['first', 'second', 'third', 'none']);
        });

        it('refuses `else when`, and `else if` after a bare `else`', () => {
            assert.throws(() => parse('await *\n    if .a\n        POST `a`\n    else when .b\n        POST `b`\n'), /`else when` is not a thing/);
            assert.throws(() => parse('await *\n    if .a\n        POST `a`\n    else\n        POST `b`\n    else if .c\n        POST `c`\n'), /cannot follow `else`/);
        });

        it('must be last, and must continue something', () => {
            assert.throws(() => parse('await *\n    if .a\n        POST `a`\n    else\n        POST `b`\n    when .c\n        POST `c`\n'), /cannot follow `else`/);
            assert.throws(() => parse('await *\n    else\n        POST `b`\n'), /`else` continues the `if` or `when` before it/);
        });
    });

    describe('v2 / `* from`', () => {
        it('is `any from`', () => {
            let { NodeType } = globalThis.TTV_DSL.ast;

            assert.like(parse('await *\n    POST * from (`a`, `b`)\n').body[0].body.body[0].argument, {
                type: NodeType.AnyFromExpression,
                items: [{ type: NodeType.TemplateLiteral }, { type: NodeType.TemplateLiteral }],
            });
        });

        it('leaves a lone `*` alone', async () => {
            assert.deepEqual(await fire('await *\n    if .v is *\n        POST `yes`\n', [{ v: '' }]), ['yes']);
        });
    });

    describe('v2 / `above` and `below`', () => {
        let rows = [
            ['above', [false, false, true]],
            ['or above', [false, true, true]],
            ['below', [true, false, false]],
            ['or below', [true, true, false]],
        ];

        for (let [word, expected] of rows)
            it(`reads \`is ${ word }\` as a numeric comparison`, async () => {
                let source = `await *\n    if .size is ${ word } 50\n        POST \`\${ .size }\`\n`;

                assert.deepEqual(await fire(source, [{ size: 49 }, { size: 50 }, { size: 51 }]), [49, 50, 51].filter((_, index) => expected[index]).map(String));
            });

        it('coerces numeric strings and durations, and treats the unreadable as NaN (always false)', async () => {
            let source = [
                'await *',
                '    if .v is above 1:00',
                '        POST `above: ${ .v }`',
                '    when .v is or below 1:00',
                '        POST `at most: ${ .v }`',
                '    else',
                '        POST `neither: ${ .v }`',
                '',
            ].join('\n');

            assert.deepEqual(await fire(source, [{ v: '61000' }, { v: '0:30' }, { v: 'lots' }, { v: true }, {}]), [
                'above: 61000',
                'at most: 0:30',
                'neither: lots',
                'neither: true',
                'neither: ',
            ]);
        });

        it('only follows `is`', () => {
            assert.throws(() => parse('await *\n    if .a above 5\n        POST `a`\n'), /only follows `is`/);
            assert.throws(() => parse('await *\n    if .a is above 5 is above 3\n        POST `a`\n'), /not associative/);
        });

        it('leaves plain `or` alone', async () => {
            let source = 'await *\n    if .a is "x" or .a is "y"\n        POST `${ .a }`\n';

            assert.deepEqual(await fire(source, [{ a: 'x' }, { a: 'y' }, { a: 'z' }]), ['x', 'y']);
        });
    });

    describe('v2 / `ANYTHING`, `SOMETHING`, `NOTHING`', () => {
        /** Which of four values each test accepts: absent, "", [], "zip". */
        let probe = async (test) => {
            let source = `await *\n    if .v is ${ test }\n        POST \`\${ .tag }\`\n`;

            return fire(source, [{ tag: 'absent' }, { tag: 'empty', v: '' }, { tag: 'list', v: [] }, { tag: 'zip', v: 'zip' }]);
        };

        it('ANYTHING matches every present value, empty ones included', async () => {
            assert.deepEqual(await probe('ANYTHING'), ['empty', 'list', 'zip']);
        });

        it('`*` is ANYTHING', async () => {
            assert.deepEqual(await probe('*'), ['empty', 'list', 'zip']);
        });

        it('SOMETHING needs a non-empty value', async () => {
            assert.deepEqual(await probe('SOMETHING'), ['zip']);
        });

        it('NOTHING is absence or emptiness', async () => {
            assert.deepEqual(await probe('NOTHING'), ['absent', 'empty', 'list']);
        });

        it('cannot be shadowed by a host constant', async () => {
            let { runtime } = harness({ constants: { NOTHING: 'gotcha' } });

            await run('await *\n    if .v is NOTHING\n        POST `none`\n', runtime, {});
            await runtime.dispatch({});

            assert.deepEqual(sent(runtime), ['none']);
        });
    });

    describe('v2 / `.a.b.c`', () => {
        it('traverses nested properties', async () => {
            let source = 'await *\n    POST `${ .raider.name } / ${ .raider.last.category }`\n';

            assert.deepEqual(await fire(source, [{ raider: { name: 'shadyhen', last: { category: 'Elden Ring' } } }]), ['shadyhen / Elden Ring']);
        });

        it('reads a missing link as empty, not as an error', async () => {
            assert.deepEqual(await fire('await *\n    POST `[${ .a.b.c }]`\n', [{ a: { b: null } }, {}]), ['[]', '[]']);
        });

        it('only joins glued segments; a space still separates subjects', () => {
            let { NodeType } = globalThis.TTV_DSL.ast;

            assert.like(parse('using .a.b\n    POST `x`\n').body[0].subjects, [{ type: NodeType.MemberExpression, property: 'b' }]);
            assert.equal(parse('using .a .b\n    POST `x`\n').body[0].subjects.length, 2);
        });

        it('traverses off a variable, too', async () => {
            let source = 'await *\n    .raider -> raid_info\n    POST `${ raid_info.name }`\n';

            assert.deepEqual(await fire(source, [{ raider: { name: 'shadyhen' } }]), ['shadyhen']);
        });

        it('refuses `constructor` and friends', () => {
            let { runtime } = harness();

            assert.throws(() => globalThis.TTV_DSL.compile(parse('await *\n    POST `${ .a.constructor }`\n'), runtime), /may never be read/);
        });
    });

    describe('v2 / `[badge ...]`', () => {
        let channel = (badges) => ({ ginger_enby: { live: true, badges } });

        /** @return {Promise<Array<String>>} what one event sent under the given badges */
        let probe = async (header, badges) => {
            let { runtime } = harness({ channels: channel(badges) });

            await run(`await *\n    using ${ header }\n        POST \`ran\`\n`, runtime, { channel: runtime.defaultRealm.current });
            await runtime.dispatch({ kind: 'x' });

            return sent(runtime);
        };

        it('runs once when any listed badge is held, however many are', async () => {
            assert.deepEqual(await probe('[vip moderator]', ['vip', 'moderator']), ['ran']);
            assert.deepEqual(await probe('[vip moderator]', ['moderator']), ['ran']);
        });

        it('runs nothing when none is held', async () => {
            assert.deepEqual(await probe('[vip moderator]', ['subscriber']), []);
        });

        it('still reads separate brackets as separate subjects, one run each', async () => {
            assert.deepEqual(await probe('[vip] [moderator]', ['vip', 'moderator']), ['ran', 'ran']);
        });
    });

    describe('v2 / `using [badge]` is a gate, not a subject', () => {
        it('keeps the message as the subject inside the gate', async () => {
            let source = 'await (.command is SOMETHING)\n    using [moderator]\n        POST `${ .command } from ${ .sender } (${ _.sender })`\n';

            assert.deepEqual(await fire(source, [{ command: 'so', sender: 'zip', badges: ['moderator'] }]), ['so from zip (zip)']);
        });

        it('still runs nothing for a sender without the badge', async () => {
            let source = 'await (.command is SOMETHING)\n    using [moderator]\n        POST `${ .command }`\n';

            assert.deepEqual(await fire(source, [{ command: 'so', badges: ['viewer'] }]), []);
        });
    });

    describe('v2 / nested `await`s install once', () => {
        it('does not pile up handlers as the outer `await` keeps firing', async () => {
            let { runtime } = harness(),
                source = 'await *\n    await (.command is "help")\n        POST `help`\n';

            await run(source, runtime, {});

            for (let index = 0; index < 5; ++index)
                await runtime.dispatch({ n: index });

            // The outer handler, plus exactly one nested one.
            assert.equal(runtime.listenerCount, 2);

            await runtime.dispatch({ command: 'help' });

            assert.deepEqual(sent(runtime), ['help']);
        });

        it('does not pile up timers under a repeating timer', async () => {
            let { runtime, clock } = harness(),
                source = 'await 15:00\n    await 5:00\n        POST `tick`\n';

            await run(source, runtime, {});
            await clock.advance(60 * 60000);

            // Installed on the first outer tick (15m), then every 5m: 20, 25, … 60.
            assert.equal(sent(runtime).length, 9);
            assert.equal(clock.pending, 2);
        });

        it('builds on the latest outer event, not the one that installed it', async () => {
            let { runtime } = harness(),
                source = [
                    'using +scope:local',
                    '    await (.room is SOMETHING)',
                    '        .room -> room_name',
                    '        await (.ping is SOMETHING)',
                    '            POST `${ .ping } in ${ room_name }`',
                    '',
                ].join('\n');

            await run(source, runtime, {});
            await runtime.dispatch({ room: 'first' });
            await runtime.dispatch({ room: 'second' });
            await runtime.dispatch({ ping: 'hi' });

            // Under `local`, `room_name` lives in the outer event's own scope. The nested
            // handler was installed by the first event but reads through the second.
            assert.deepEqual(sent(runtime), ['hi in second']);
        });

        it('does not re-check the trigger: "after !start", not "while !start"', async () => {
            let source = 'await (.command is "start")\n    await (.message is SOMETHING)\n        POST `${ .message }`\n';

            assert.deepEqual(await fire(source, [{ message: 'too early' }, { command: 'start' }, { message: 'now' }]), ['now']);
        });

        it('keeps a `with` filter in force for everything nested: "while live"', async () => {
            let { runtime, realm } = harness(),
                source = 'await * with (#live is true)\n    await (.message is SOMETHING)\n        POST `${ .message }`\n';

            await run(source, runtime, { channel: realm.current });
            await runtime.dispatch({ kind: 'hello' });
            await runtime.dispatch({ message: 'live one' });

            realm.current.live = false;
            await runtime.dispatch({ message: 'offline' });

            realm.current.live = true;
            await runtime.dispatch({ message: 'live again' });

            assert.deepEqual(sent(runtime), ['live one', 'live again']);
        });

        it('installs once per `using` subject, not once in total', async () => {
            let { runtime } = harness({ channels: { ginger_enby: { live: true, badges: ['vip', 'moderator'] } } }),
                source = 'await *\n    using [vip] [moderator]\n        await (.ping is SOMETHING)\n            POST `pong`\n';

            await run(source, runtime, { channel: runtime.defaultRealm.current });

            for (let index = 0; index < 3; ++index)
                await runtime.dispatch({ n: index });

            assert.equal(runtime.listenerCount, 3);
        });
    });

    describe('v2 / `-- "description"` on a `using` header', () => {
        it('records the description and nothing else', () => {
            assert.like(parse('using +eval:calc -- "Needed for the raid-size based timer"\n    POST `a`\n').body[0], {
                permissions: ['eval:calc'],
                description: 'Needed for the raid-size based timer',
            });
        });

        it('accepts single quotes, subjects and grants before it', () => {
            assert.like(parse('using [vip] +read:datetime -- \'prints the time\'\n    POST `a`\n').body[0], {
                subjects: [{ kind: 'badge', names: ['vip'] }],
                permissions: ['read:datetime'],
                description: 'prints the time',
            });
        });

        it('needs a quoted string, and must end the header', () => {
            assert.throws(() => parse('using +eval -- why\n    POST `a`\n'), /must be followed by a quoted description/);
            assert.throws(() => parse('using -- "why" +eval\n    POST `a`\n'), /ends the `using` header/);
        });

        it('is refused anywhere but a `using` header', () => {
            assert.throws(() => parse('await *\n    POST -- "hi"\n'), /may only end a `using` header/);
        });

        it('changes nothing at run time', async () => {
            let { runtime } = harness();

            await run('using -- "just a label"\n    await *\n        POST `ran`\n', runtime, {});
            await runtime.dispatch({ a: 1 });

            assert.deepEqual(sent(runtime), ['ran']);
        });
    });

    describe('v2 / an unknown realm fails only its own block', () => {
        it('skips the block, reports once, and lets its siblings install', async () => {
            let { runtime, failures } = harness(),
                source = [
                    'await *',
                    '    using DISCORD/779741119520571456',
                    '        POST `discord`',
                    '    POST `twitch`',
                    '',
                ].join('\n');

            await run(source, runtime, {});
            await runtime.dispatch({ a: 1 });
            await runtime.dispatch({ a: 2 });

            assert.deepEqual(sent(runtime), ['twitch', 'twitch']);
            assert.equal(failures.filter(entry => /Unknown realm "DISCORD"/.test(entry)).length, 1);
        });
    });

    describe('v2 / tolerant parsing and templates', () => {
        it('collects a lexical fault inside `${ ... }` instead of throwing', () => {
            let { errors } = globalThis.TTV_DSL.parser.parseTolerant('await *\n    POST `a ${ $ } b`\n    POST `fine`\n');

            assert.equal(errors.length, 1);
        });
    });

    describe('v2 / `using` with no subject', () => {
        it('grants without changing the subject', async () => {
            let { runtime, clock } = harness({
                jsBindings: { Clock: { time: () => '9:42pm' } },
                jsPermissions: { 'Clock.time': 'read:datetime' },
            });

            await run('await *\n    using +read:datetime\n        POST `${ .who } at ${ &Clock.time() }`\n', runtime, {});
            await runtime.dispatch({ who: 'zip' });

            assert.deepEqual(sent(runtime), ['zip at 9:42pm']);
        });

        it('still needs something in the header', () => {
            assert.throws(() => parse('using\n    POST `a`\n'), /needs a subject, a `\+permission`, `\+scope`, or a `-- "description"`/);
        });
    });
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
