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
    const fixture = (name) => {
        if(typeof require !== 'function' || typeof __dirname === 'undefined')
            return null;

        return require('fs').readFileSync(require('path').join(__dirname, 'fixtures', `${ name }.ttv`), 'utf8');
    };

    /** A runtime on a fake clock, with whatever host bindings the test needs.
     * @return {{ runtime, clock, realm, failures }}
     */
    const harness = ({ seed = 1, jsBindings, jsPermissions, constants, channels } = {}) => {
        const clock = createFakeClock(0)
            , failures = []
            , realm = createTwitchRealm({
                current: 'ginger_enby',
                channels: (channels ?? { ginger_enby: { live: true, badges: ['moderator', 'vip', 'subscriber'] } }),
            });

        const runtime = createRuntime({
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
    const sent = (runtime) => runtime.sink.map(entry => entry.text);

    // -- variables ----------------------------------------------------------

    describe('v2 / variables and scope', () => {
        const source = fixture('variables');

        if(null === source)
            it.skip('runs variables.ttv', 'no filesystem in this runtime');
        else
            it('makes `=>` visible to later siblings and `->` visible only downward', async() => {
                const { runtime, clock } = harness();

                await run(source, runtime, { channel: runtime.defaultRealm.current });
                await clock.advance(90000);

                assert.deepEqual(sent(runtime), [
                    'first: checked in',
                    // The `=>` binding made one block's work visible to the next.
                    'second: checked in',
                    // A `->` binding reaches its own descendants.
                    'nested: local only',
                    // Never bound at all: empty, not an error.
                    'missing: []',
                    // Still visible: `=>` put it where every sibling can see it.
                    'sibling: checked in',
                    // NOT visible: `->` put it in a scope this block was never inside.
                    'leaked: []',
                ]);
            });

        it('binds through an `await` duration without turning it into an event-await', async() => {
            const { runtime, clock } = harness();

            // The duration-vs-event decision is syntactic, so an assignment wrapped around
            // the subject is exactly the shape that could silently stop the timer firing.
            await run('await (1:00 -> wait_time)\n    POST `waited ${ wait_time }`\n', runtime, {});

            assert.equal(runtime.listenerCount, 0, 'this must be a timer, not an event subscription');

            await clock.advance(61000);

            assert.deepEqual(sent(runtime), ['waited 60000']);
        });

        it('refuses `=>` where there is no parent scope', () => {
            const { runtime } = harness()
                , program = parse('`hi` => mod_msg\n');

            assert.throws(() => globalThis.TTV_DSL.compile(program, runtime), /no parent scope/i);
        });

        it('reads an unbound variable as empty but an unknown constant as an error', async() => {
            const { runtime, failures } = harness();

            await run('await *\n    POST `[${ not_bound }]`\n', runtime, {});
            await runtime.dispatch({ sender: 'a' });

            assert.deepEqual(sent(runtime), ['[]']);

            // A name with no interior underscore can only be a constant, and an unknown
            // constant still fails loudly — that is what the underscore rule buys.
            await run('await *\n    POST `${ NOPE }`\n', runtime, {});
            await runtime.dispatch({ sender: 'a' });

            assert.ok(failures.some(entry => /unknown name/i.test(entry)));
        });

        it('resolves a subject alias to the same thing `.prop` reads from', async() => {
            const { runtime } = harness();

            await run('await *\n    POST `${ .name } / ${ _ }`\n', runtime, {});
            await runtime.dispatch({ name: 'zip' });

            assert.deepEqual(sent(runtime), ['zip / zip']);
        });
    });

    // -- when ---------------------------------------------------------------

    describe('v2 / `when`', () => {
        const source = fixture('when');

        /** Dispatches one command and returns what both `when`s replied. */
        const ask = async(command) => {
            const { runtime } = harness();

            await run(source, runtime, { channel: runtime.defaultRealm.current });
            await runtime.dispatch({ command, sender: 'someone' });

            return sent(runtime);
        };

        if(null === source) {
            it.skip('runs when.ttv', 'no filesystem in this runtime')
        } else {
            it('picks the matching case in the switch form', async() => {
                assert.deepEqual(await ask('help'), ['switch: help', 'chain: help']);
                assert.deepEqual(await ask('gamble'), ['switch: gamble', 'chain: gamble']);
            });

            it('falls through to `*`, which needs no special casing', async() => {
                assert.deepEqual(await ask('whoami'), ['switch: other', 'chain: other']);
            });
        }

        it('runs at most one branch of a chain', async() => {
            const { runtime } = harness();

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
        const bindings = { Date: { now: () => 1234 }, Math: { random: () => 0.5 } }
            , mapping = { 'Date.now': 'read:datetime' };

        const source = fixture('permissions');

        if(null === source)
            it.skip('runs permissions.ttv', 'no filesystem in this runtime');
        else
            it('honours a grant and refuses everything it does not cover', async() => {
                const { runtime, clock, failures } = harness({ jsBindings: bindings, jsPermissions: mapping });

                await run(source, runtime, { channel: runtime.defaultRealm.current });
                await clock.advance(90000);

                assert.deepEqual(sent(runtime), ['granted: 1234']);
                assert.equal(failures.filter(entry => /DSLPermissionError/.test(entry)).length, 2);
            });

        // The regression that matters. Nothing in the runtime does prefix matching, and
        // nothing ever should: a grant that silently widens is a grant nobody can audit.
        it('does not let `+eval` stand in for `eval:calc`, in either direction', async() => {
            const { runtime, failures } = harness({ jsBindings: bindings, jsPermissions: { 'Math.random': 'eval:calc' } });

            await run('using * +eval\n    await *\n        POST `${ $:Math.random() }`\n', runtime, {});
            await runtime.dispatch({ a: 1 });

            assert.equal(sent(runtime).length, 0);
            assert.ok(failures.some(entry => /not granted .\+eval:calc/.test(entry)), failures.join('\n'));

            const narrow = harness({ jsBindings: bindings, jsPermissions: { 'Math.random': 'eval' } });

            await run('using * +eval:calc\n    await *\n        POST `${ $:Math.random() }`\n', narrow.runtime, {});
            await narrow.runtime.dispatch({ a: 1 });

            assert.equal(sent(narrow.runtime).length, 0);
            assert.ok(narrow.failures.some(entry => /not granted .\+eval\b/.test(entry)), narrow.failures.join('\n'));
        });

        it('accumulates grants down the nesting tree, never sideways', async() => {
            const { runtime, failures } = harness({ jsBindings: bindings, jsPermissions: { 'Math.random': 'a:b' } });

            await run([
                'using * +a:b',
                '    using *',
                '        await *',
                '            POST `inner ${ $:Math.random() }`',
                'using *',
                '    await *',
                '        POST `sibling ${ $:Math.random() }`',
                '',
            ].join('\n'), runtime, {});

            await runtime.dispatch({ a: 1 });

            assert.deepEqual(sent(runtime), ['inner 0.5']);
            assert.ok(failures.some(entry => /DSLPermissionError/.test(entry)));
        });

        it('raises DSLPermissionError, not a generic runtime error', () => {
            const { runtime } = harness()
                , context = runtime.createContext({ permissions: ['a'] });

            assert.equal(runtime.requirePermission('a', context), true);
            assert.throws(() => runtime.requirePermission('a:b', context), DSLPermissionError);
        });
    });

    // -- host calls ---------------------------------------------------------

    describe('v2 / `$:` host calls', () => {
        it('fails loudly when the host registered nothing', () => {
            const { runtime } = harness()
                , context = runtime.createContext({ permissions: ['eval:js'] });

            const error = assert.throws(() => runtime.invokeJS(['Date', 'now'], [], context), DSLRuntimeError);

            assert.match(error.message, /no host binding/i);
        });

        it('calls a registered binding with its arguments', () => {
            const { runtime } = harness({ jsBindings: { Math: { max: (...values) => Math.max(...values) } } })
                , context = runtime.createContext({ permissions: ['eval:js'] });

            assert.equal(runtime.invokeJS(['Math', 'max'], [1, 9, 3], context), 9);
        });

        it('defaults to requiring `eval:js`', () => {
            const { runtime } = harness({ jsBindings: { Date: { now: () => 1 } } })
                , context = runtime.createContext({ permissions: [] });

            assert.throws(() => runtime.invokeJS(['Date', 'now'], [], context), DSLPermissionError);
        });

        it('refuses to walk through `constructor` or `__proto__`', () => {
            const { runtime } = harness({ jsBindings: { Date: { now: () => 1 } } })
                , context = runtime.createContext({ permissions: ['eval:js'] });

            for(const segment of ['constructor', '__proto__', 'prototype'])
                assert.throws(() => runtime.invokeJS(['Date', segment, 'x'], [], context), /never allowed/i);
        });
    });

    // -- % ------------------------------------------------------------------

    describe('v2 / the `%` operator', () => {
        it('expands a bare `%` to `%n%s`', () => {
            assert.equal(percent('a\n   b', [], '·'), 'a·b');
            assert.equal(percent('a\n   b', ['n', 's'], '·'), 'a·b');
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

        it('produces idea.ttv\'s worked example', async() => {
            const { runtime } = harness();

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

        it('produces the spaced form when the replacement carries the spaces', async() => {
            const { runtime } = harness();

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
        it('makes a comparison case-sensitive, and leaves the default alone', async() => {
            const { runtime } = harness();

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

        it('runs a `with` block once on a boolean and once per element on a list', async() => {
            const { runtime } = harness();

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
            const { NodeType } = globalThis.TTV_DSL.ast;

            assert.like(parse('await (.links | ("x" in .href))\n').body[0].subject, {
                type: NodeType.WhereExpression,
                subject: { type: NodeType.Selector, kind: 'context', name: 'links' },
                filter: { type: NodeType.BinaryExpression, operator: 'in' },
            });
        });

        it('reads an unparenthesized predicate as a comparison, not a filter', () => {
            const { NodeType } = globalThis.TTV_DSL.ast;

            assert.like(parse('await (.links | "x" in .href)\n').body[0].subject, {
                type: NodeType.BinaryExpression,
                operator: 'in',
                left: { type: NodeType.WhereExpression },
            });
        });

        it('ignores commas wherever they are optional', async() => {
            const { runtime } = harness({ seed: 3 });

            await run('await *\n    POST any from (\n        , `a`\n        , `a`\n        ,\n    )\n', runtime, {});
            await runtime.dispatch({ x: 1 });

            assert.deepEqual(sent(runtime), ['a']);
        });
    });
})();

if(typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
