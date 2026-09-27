/*** /dsl/tests/functions.test.js - `define` / `return`, `for` / `break` / `renew`, budgets
 *
 * Functions are verbs the script defines: ALL-CAPS, called like `POST` — `TOREADABLE 5:00` —
 * computing in a frame that holds only their parameters, their locals and exactly the grants
 * their `with` lists. Loops count with `$`, stop before `stop`, and are policed by the same
 * per-turn step budget as everything else — which a `+eval:budget_*` grant may raise.
 */

;

(() => {
    const { run, createRuntime, parse } = globalThis.TTV_DSL;
    const { createFakeClock, createSeededRandom } = globalThis.TTV_DSL.runtime;
    const { DSLParseError } = globalThis.TTV_DSL.errors;

    /** Runs a script, fires one event, and returns what was sent and what failed. */
    const fire = async(source, { limits, event = {} } = {}) => {
        const failures = []
            , runtime = createRuntime({
                clock: createFakeClock(0),
                wallClock: () => 0,
                random: createSeededRandom(1),
                limits,
                logger: { log() {}, warn() {}, error: (entry) => failures.push(String(entry)) },
            });

        await run(source, runtime, {});
        await runtime.dispatch(event);

        return { texts: runtime.sink.map(entry => entry.text), failures, runtime };
    };

    const lines = (...rows) => rows.join('\n') + '\n';

    describe('functions / `define` and calls', () => {
        it('runs the example: a verb-style call that returns a formatted duration', async() => {
            const { texts } = await fire(lines(
                'define TOREADABLE(mils)',
                '    "hh?:mm:ss" -> clkFmt',
                '    return mils as clkFmt',
                'await *',
                '    POST TOREADABLE 5:00',
                '    POST `took ${ TOREADABLE 3900000 }`',
            ));

            assert.deepEqual(texts, ['05:00', 'took 01:05:00']);
        });

        it('may be called before its definition, alone on a line, with several arguments', async() => {
            const { texts } = await fire(lines(
                'await *',
                '    SHOUT .who, "!"',
                'define SHOUT(name, mark)',
                '    POST `${ name }${ mark }`',
            ), { event: { who: 'zip' } });

            assert.deepEqual(texts, ['zip!']);
        });

        it('binds the call\'s result with an arrow on a statement line', () => {
            const statement = parse(lines('define ONE(x)', '    return x', 'ONE 1 or 2 -> got')).body[1];

            assert.like(statement.expression, {
                type: 'AssignmentExpression',
                name: 'got',
                value: { type: 'CallExpression', arguments: [{ type: 'BinaryExpression', operator: 'or' }] },
            });
        });

        it('binds its arguments tighter than `as`, `is` and friends when inside an expression', () => {
            const call = parse(lines('define TWICE(x)', '    return x', 'await *', '    POST TWICE 1 as "mm:ss"')).body[1].body.body[0].argument;

            assert.like(call, { type: 'FormatExpression', subject: { type: 'CallExpression', callee: 'TWICE' } });
        });

        it('returns empty without a `return`, and takes no arguments', async() => {
            const { texts } = await fire(lines('define NOTHING_HERE()', '    POST `side effect`', 'await *', '    POST `[${ NOTHING_HERE }]`'));

            assert.deepEqual(texts, ['side effect', '[]']);
        });

        it('cannot see the caller\'s variables', async() => {
            const { texts } = await fire(lines(
                '`outer` -> secret',
                'define PEEK()',
                '    return `[${ secret }]`',
                'await *',
                '    POST PEEK',
            ));

            assert.deepEqual(texts, ['[]']);
        });

        it('recurses, and stops runaway recursion', async() => {
            const good = await fire(lines(
                'define FACT(n) with +eval:calc',
                '    if n is or below 1',
                '        return 1',
                '    FACT calc(n - 1) -> rest',
                '    return calc(n * rest)',
                'using +eval:calc -- "factorial"',
                '    await *',
                '        POST FACT 5',
            ));

            assert.deepEqual(good.texts, ['120']);

            const runaway = await fire(lines('define LOOP_FOREVER()', '    return LOOP_FOREVER', 'await *', '    POST LOOP_FOREVER'));

            assert.ok(runaway.failures.some(entry => /nested more than 100 deep/.test(entry)), runaway.failures.join('\n'));
        });
    });

    describe('functions / rules', () => {
        const fails = (source, pattern) => assert.throws(() => parse(source), pattern);

        it('names functions in ALL-CAPS, and parameters with a lower-case letter', () => {
            fails(lines('define toReadable(mils)', '    return mils'), /named in ALL-CAPS/);
            fails(lines('define READ(MILS)', '    return 1'), /needs a lower-case letter/);
            fails(lines('define READ(a, a)', '    return 1'), /listed twice/);
        });

        it('is top-level only, and may not install handlers or change grants', () => {
            fails(lines('await *', '    define INNER()', '        return 1'), /only allowed at the top level/);

            for(const statement of ['await *', 'after 1:00', 'using +read:datetime'])
                fails(lines('define BAD()', `    ${ statement }`, '        POST `x`'), /not allowed inside a `define`/);
        });

        it('allows `return` only inside a function', () => {
            fails(lines('await *', '    return 1'), /only allowed inside a `define`/);
        });

        it('refuses unknown functions, too many arguments, and names the host owns', async() => {
            const reject = async(source, pattern) => {
                try {
                    await run(source, createRuntime({ logger: { log() {}, warn() {}, error() {} } }), {});
                } catch(error) {
                    return assert.match(error.message, pattern);
                }

                throw new Error(`expected ${ pattern }`);
            };

            await reject(lines('define ONE(a)', '    return a', 'await *', '    POST ONE 1, 2'), /takes 1 argument/);
            await reject(lines('define POST(a)', '    return a'), /already a verb/);
            await reject(lines('define ONE(a)', '    return a', 'define ONE(b)', '    return b'), /defined twice/);
        });

        it('needs the caller to hold what the function declares, and grants nothing else', async() => {
            const body = lines(
                'define ADD(a, b) with +eval:calc',
                '    return calc(a + b)',
                'define SNEAKY()',
                '    return calc(1 + 1)',
            );

            const held = await fire(body + lines('using +eval:calc -- "sums"', '    await *', '        POST ADD 2, 3'));
            const missing = await fire(body + lines('await *', '    POST ADD 2, 3'));
            const sneaky = await fire(body + lines('using +eval:calc -- "sums"', '    await *', '        POST SNEAKY'));

            assert.deepEqual(held.texts, ['5']);
            assert.ok(missing.failures.some(entry => /not granted .\+eval:calc/.test(entry)), missing.failures.join('\n'));
            // SNEAKY declared nothing, so it runs with nothing, whatever its caller holds.
            assert.ok(sneaky.failures.some(entry => /not granted .\+eval:calc/.test(entry)), sneaky.failures.join('\n'));
        });
    });

    describe('loops / `for`', () => {
        it('counts with `$`, stopping before `stop`', async() => {
            assert.deepEqual((await fire(lines('await *', '    for 0; 3', '        POST `${ $ }`'))).texts, ['0', '1', '2']);
            assert.deepEqual((await fire(lines('await *', '    for 10; 0; -5', '        POST `${ $ }`'))).texts, ['10', '5']);
            assert.deepEqual((await fire(lines('await *', '    for 0:00; 3:00; 1:00', '        POST `${ $ as "m" }`'))).texts, ['0', '1', '2']);
        });

        it('walks a list, with `$` as each item', async() => {
            assert.deepEqual((await fire(lines('(`a`, `b`) -> letters', 'await *', '    for letters', '        POST `${ $ }!`'))).texts, ['a!', 'b!']);
        });

        it('lets a label read an outer counter while `$` means the innermost', async() => {
            const { texts } = await fire(lines(
                'await *',
                '    for as row: 0; 2',
                '        for 0; 2',
                '            POST `${ row },${ $ }`',
            ));

            assert.deepEqual(texts, ['0,0', '0,1', '1,0', '1,1']);
        });

        it('`break` and `renew` act on the innermost loop, or the one they name', async() => {
            const { texts } = await fire(lines(
                'await *',
                '    for as outer: 0; 3',
                '        for 0; 3',
                '            if $ is 1',
                '                renew',
                '            if outer is 1',
                '                renew outer',
                '            if outer is 2',
                '                break outer',
                '            POST `${ outer },${ $ }`',
            ));

            assert.deepEqual(texts, ['0,0', '0,2']);
        });

        it('refuses a zero or backwards step, `$` outside a loop, and unknown labels', async() => {
            assert.ok((await fire(lines('await *', '    for 0; 3; 0', '        POST `x`'))).failures.some(entry => /cannot step by 0/.test(entry)));
            assert.ok((await fire(lines('await *', '    for 0; 3; -1', '        POST `x`'))).failures.some(entry => /steps away from its stop/.test(entry)));
            assert.throws(() => parse(lines('await *', '    POST `${ $ }`')), /no `for` here/);
            assert.throws(() => parse(lines('await *', '    for 0; 3', '        break nowhere')), /No enclosing loop is labelled `nowhere`/);
            assert.throws(() => parse(lines('await *', '    break')), /only allowed inside a `for`/);
        });

        it('is stopped by the step budget', async() => {
            const { failures } = await fire(lines('await *', '    for 0; 1000000', '        renew'), { limits: { steps: 500 } });

            assert.ok(failures.some(entry => /budget of 500 steps/.test(entry)), failures.join('\n'));
        });
    });

    describe('budgets / `+eval:budget_*`', () => {
        it('raises the per-turn step limit for the whole script', async() => {
            const source = lines(
                'using +eval:budget_1M -- "counts to 200,000"',
                '    await *',
                '        for 0; 200000',
                '            renew',
                '        POST `done`',
            );

            const { texts, runtime } = await fire(source);

            assert.equal(runtime.limits.steps, 1e6);
            assert.deepEqual(texts, ['done']);
        });

        it('keeps the default without one', async() => {
            const { failures } = await fire(lines('await *', '    for 0; 200000', '        renew'));

            assert.ok(failures.some(entry => /budget of 100000 steps/.test(entry)), failures.join('\n'));
        });

        it('needs a description, like every `eval` grant', () => {
            assert.throws(() => parse(lines('using +eval:budget_10M', '    POST `x`')), /needs a description/);
        });
    });
})();

if(typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
