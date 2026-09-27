/*** /dsl/tests/runtime.test.js - End-to-end execution, made deterministic
 *
 * Every test here runs on a fake clock and a seeded generator, so `await 15:00` costs no
 * wall-clock time and `any from ( ... )` picks the same item on every run. That is the
 * entire reason the runtime takes its clock and its randomness as injected dependencies.
 */

;

(() => {
    const { run, createRuntime } = globalThis.TTV_DSL;
    const { createFakeClock, createSeededRandom, createTwitchRealm, parseDuration } = globalThis.TTV_DSL.runtime;
    const { DSLRuntimeError, DSLLimitError } = globalThis.TTV_DSL.errors;

    /** Builds a runtime wired to a fake clock and a seeded generator.
     * @param {Object} [options]
     * @return {Object} `{ runtime, clock, realm }`
     */
    const harness = ({ seed = 1, channels, current = 'ginger_enby', constants, limits, realms } = {}) => {
        const clock = createFakeClock(0)
            // The budget's sense of elapsed time is deliberately separate from the
            // script's, so a test can jump the script forward five minutes without
            // spending the handler's allowance.
            , wall = { at: 0 }
            , realm = createTwitchRealm({
                current,
                channels: (channels ?? {
                    ginger_enby: { live: true, badges: ['moderator', 'vip'] },
                    soulbewitch: { live: true, badges: ['subscriber'] },
                }),
            });

        const runtime = createRuntime({
            clock,
            wallClock: () => wall.at,
            random: createSeededRandom(seed),
            realms: Object.assign({ TWITCH: realm }, realms),
            constants: Object.assign({ USERNAME: 'ephellon' }, constants),
            logger: { log() {}, warn() {}, error() {} },
            limits,
        });

        return { runtime, clock, realm, wall };
    };

    /** @return {Array<String>} the text of everything sent */
    const sent = (runtime) => runtime.sink.map(entry => entry.text);

    describe('runtime / durations', () => {
        it('reads clock-style durations', () => {
            assert.equal(parseDuration('15:00'), 900000);
            assert.equal(parseDuration('1:30:00'), 5400000);
        });

        it('reads suffixed shorthand', () => {
            assert.equal(parseDuration('90s'), 90000);
            assert.equal(parseDuration('5m'), 300000);
            assert.equal(parseDuration('2h'), 7200000);
        });

        it('rejects nonsense', () => {
            assert.throws(() => parseDuration('soon'), DSLRuntimeError);
        });
    });

    describe('runtime / timers on a fake clock', () => {
        it('does not fire before its time', async() => {
            const { runtime, clock } = harness();

            await run('await 5:00\n    POST `tick`\n', runtime);
            await clock.advance(299000);

            assert.deepEqual(sent(runtime), []);
        });

        it('fires once the duration elapses', async() => {
            const { runtime, clock } = harness();

            await run('await 5:00\n    POST `tick`\n', runtime);
            await clock.advance(300000);

            assert.deepEqual(sent(runtime), ['tick']);
        });

        it('repeats, so `await 5:00` means "every five minutes"', async() => {
            const { runtime, clock } = harness();

            await run('await 5:00\n    POST `tick`\n', runtime);
            await clock.advance(900000);

            assert.deepEqual(sent(runtime), ['tick', 'tick', 'tick']);
        });

        it('stops when the context is cancelled', async() => {
            const { runtime, clock } = harness()
                , context = await run('await 5:00\n    POST `tick`\n', runtime);

            await clock.advance(300000);
            context.stop();
            await clock.advance(900000);

            assert.deepEqual(sent(runtime), ['tick']);
        });

        it('runs nested timers at their own cadence', async() => {
            const { runtime, clock } = harness();

            await run('await 15:00\n    await 5:00\n        POST `inner`\n', runtime);
            await clock.advance(900000);

            assert.deepEqual(sent(runtime), []);

            await clock.advance(300000);

            assert.equal(sent(runtime).length, 1);
        });
    });

    describe('runtime / events', () => {
        it('runs the body for an event that satisfies the condition', async() => {
            const { runtime } = harness();

            await run('await (.message is *)\n    REPLY `heard you`\n', runtime);
            await runtime.dispatch({ message: "hello", sender: 'jjay_89' });

            assert.deepEqual(sent(runtime), ['heard you']);
        });

        it('ignores an event that does not', async() => {
            const { runtime } = harness();

            await run('await (.command is *)\n    REPLY `command`\n', runtime);
            await runtime.dispatch({ message: "not a command" });

            assert.deepEqual(sent(runtime), []);
        });

        it('binds `.prop` to the event', async() => {
            const { runtime } = harness();

            await run('await (.message is *)\n    REPLY `hi ${ .sender }`\n', runtime);
            await runtime.dispatch({ message: "yo", sender: 'Jjay_89' });

            assert.deepEqual(sent(runtime), ['hi Jjay_89']);
        });

        it('applies a `with` filter on top of the condition', async() => {
            const { runtime } = harness();

            await run('await * with (.sender is "streamcord")\n    REPLY `bot`\n', runtime);
            await runtime.dispatch({ sender: 'streamcord' });
            await runtime.dispatch({ sender: 'someone_else' });

            assert.deepEqual(sent(runtime), ['bot']);
        });

        it('compares strings case-insensitively, as Twitch does', async() => {
            const { runtime } = harness();

            await run('await (.sender is "jjay_89")\n    REPLY `hey`\n', runtime);
            await runtime.dispatch({ sender: 'JJay_89' });

            assert.deepEqual(sent(runtime), ['hey']);
        });

        it('resolves a bare identifier from the constant table', async() => {
            const { runtime } = harness();

            await run('await (USERNAME in .message)\n    REPLY `you rang?`\n', runtime);
            await runtime.dispatch({ message: "hey ephellon look at this" });

            assert.deepEqual(sent(runtime), ['you rang?']);
        });

        it('refuses an unknown identifier loudly', async() => {
            const failures = []
                , { runtime } = harness();

            runtime.logger.error = (entry) => failures.push(entry);

            await run('await (NOPE in .message)\n    REPLY `x`\n', runtime);
            await runtime.dispatch({ message: "anything" });

            assert.equal(failures.length, 1);
        });
    });

    describe('runtime / verbs', () => {
        it('drops a blank message rather than sending it', async() => {
            const { runtime } = harness();

            await run('await (.message is *)\n    REPLY ``\n', runtime);
            await runtime.dispatch({ message: "hi", sender: 'a' });

            assert.deepEqual(runtime.sink, []);
        });

        it('records who a REPLY was aimed at', async() => {
            const { runtime } = harness();

            await run('await (.message is *)\n    REPLY `sup`\n', runtime);
            await runtime.dispatch({ message: "hi", sender: 'jjay_89' });

            assert.equal(runtime.sink[0].to, 'jjay_89');
            assert.equal(runtime.sink[0].verb, 'REPLY');
        });

        it('refuses an unregistered verb', async() => {
            const failures = []
                , { runtime } = harness();

            runtime.logger.error = (entry) => failures.push(entry);

            await run('await (.message is *)\n    WHISPER `psst`\n', runtime);
            await runtime.dispatch({ message: "hi" });

            assert.equal(failures.length, 1);
            assert.deepEqual(runtime.sink, []);
        });

        it('accepts a host-supplied verb', async() => {
            const seen = []
                , { runtime } = harness();

            runtime.verbs.SHOUT = (context, value) => seen.push(String(value).toUpperCase());

            await run('await (.message is *)\n    SHOUT `hello`\n', runtime);
            await runtime.dispatch({ message: "hi" });

            assert.deepEqual(seen, ['HELLO']);
        });
    });

    describe('runtime / `any from` with a seeded generator', () => {
        it('picks deterministically for a given seed', async() => {
            const first = harness({ seed: 7 })
                , second = harness({ seed: 7 });

            const script = 'await (.message is *)\n    REPLY any from (\n        `burger`\n        `burrito`\n        `taco`\n    )\n';

            await run(script, first.runtime);
            await first.runtime.dispatch({ message: "hi" });

            await run(script, second.runtime);
            await second.runtime.dispatch({ message: "hi" });

            assert.deepEqual(sent(first.runtime), sent(second.runtime));
            assert.equal(sent(first.runtime).length, 1);
        });

        it('only ever picks from the listed items', async() => {
            const { runtime } = harness({ seed: 3 })
                , options = ['burger', 'burrito', 'taco'];

            await run('await (.message is *)\n    REPLY any from (\n        `burger`\n        `burrito`\n        `taco`\n    )\n', runtime);

            for(let turn = 0; turn < 12; ++turn)
                await runtime.dispatch({ message: `hi ${ turn }` });

            assert.ok(sent(runtime).every(text => options.includes(text)));
            assert.equal(sent(runtime).length, 12);
        });

        it('draws a number from an exclusive range', async() => {
            const { runtime } = harness({ seed: 11 });

            await run('await (.message is *)\n    REPLY `${ any from (1 .. 10) }`\n', runtime);

            for(let turn = 0; turn < 20; ++turn)
                await runtime.dispatch({ message: `hi ${ turn }` });

            const drawn = sent(runtime).map(Number);

            assert.ok(drawn.every(value => value >= 1 && value <= 9), 'an exclusive range stops short of its end');
        });

        it('includes the end of an inclusive range', async() => {
            const { runtime } = harness();

            assert.deepEqual(runtime.range(1, 5, false), [1, 2, 3, 4]);
            assert.deepEqual(runtime.range(1, 5, true), [1, 2, 3, 4, 5]);
        });
    });

    describe('runtime / selectors and scoping', () => {
        it('reads a channel property through `#prop`', async() => {
            const { runtime } = harness();

            await run('await (.message is *)\n    REPLY `${ #name }`\n', runtime);
            await runtime.dispatch({ message: "hi" });

            assert.deepEqual(sent(runtime), ['ginger_enby']);
        });

        it('gates on a channel property', async() => {
            const { runtime } = harness();

            await run('await (.message is *)\n    if #name is "ginger_enby"\n        REPLY `right channel`\n', runtime);
            await runtime.dispatch({ message: "hi" });

            assert.deepEqual(sent(runtime), ['right channel']);
        });

        it('binds `.prop` lexically, so a `where` filter sees the item and not the event', async() => {
            const { runtime } = harness();

            // `.href` inside the filter is the link; `.sender` outside it is still the event.
            await run('await (.links is *)\n    goto 1st <| .links where ("twitch.tv" in .href)\n', runtime);
            await runtime.dispatch({
                sender: 'streamcord',
                links: [
                    { href: 'https://example.com/a' },
                    { href: 'https://twitch.tv/ginger_enby' },
                    { href: 'https://twitch.tv/soulbewitch' },
                ],
            });

            assert.deepEqual(runtime.realm('TWITCH').visited, [{ href: 'https://twitch.tv/ginger_enby' }]);
        });

        it('counts a negative ordinal from the end', async() => {
            const { runtime } = harness();

            await run('await (.links is *)\n    goto -1st <| .links\n', runtime);
            await runtime.dispatch({ links: [{ href: 'a' }, { href: 'b' }, { href: 'c' }] });

            assert.deepEqual(runtime.realm('TWITCH').visited, [{ href: 'c' }]);
        });

        it('runs a `using` body once per subject that resolves', async() => {
            const { runtime } = harness();

            await run('using <moderator>\n    await (.message is *)\n        REPLY `mod`\nusing <subscriber>\n    await (.message is *)\n        REPLY `sub`\n', runtime);
            await runtime.dispatch({ message: "hi" });

            // The current channel holds `moderator` but not `subscriber`.
            assert.deepEqual(sent(runtime), ['mod']);
        });
    });

    describe('runtime / realms', () => {
        it('leaves DISCORD unregistered, because the extension has no Discord support', async() => {
            const { runtime } = harness();

            assert.ok(runtime.hasRealm('TWITCH'));
            assert.ok(!runtime.hasRealm('DISCORD'));
            assert.throws(() => runtime.realm('DISCORD'), DSLRuntimeError);
        });

        it('accepts a realm the host registers', async() => {
            const { runtime } = harness({
                realms: {
                    DISCORD: {
                        name: 'DISCORD',
                        subject: (path) => ({ name: `guild:${ path }`, live: true }),
                        goto() {},
                    },
                },
            });

            assert.ok(runtime.hasRealm('DISCORD'));
            assert.equal(runtime.realm('DISCORD').subject('123').name, 'guild:123');
        });
    });

    describe('runtime / limits', () => {
        it('raises DSLLimitError once the step budget is spent', () => {
            const { runtime } = harness({ limits: { steps: 5 } });

            assert.throws(() => {
                for(let turn = 0; turn < 50; ++turn)
                    runtime.step();
            }, DSLLimitError);
        });

        it('raises DSLLimitError once the wall-clock budget is spent', () => {
            const { runtime, wall } = harness({ limits: { wallMs: 1000 } });

            runtime.step();
            wall.at = 5000;

            assert.throws(() => runtime.step(), DSLLimitError);
        });

        it('restores the budget at the start of each turn', () => {
            const { runtime, wall } = harness({ limits: { steps: 5, wallMs: 1000 } });

            for(let turn = 0; turn < 4; ++turn)
                runtime.step();

            wall.at = 5000;
            runtime.beginTurn();

            // A long-lived script must not accumulate its way into a limit error.
            for(let turn = 0; turn < 4; ++turn)
                runtime.step();
        });

        it('does not spend the budget while merely waiting', async() => {
            const { runtime, clock } = harness({ limits: { wallMs: 1000 } });

            await run('await 5:00\n    POST `tick`\n', runtime);
            await clock.advance(900000);

            assert.equal(sent(runtime).length, 3, 'simulated waiting time is not execution time');
        });

        it('caps an expensive range instead of hanging', () => {
            const { runtime } = harness({ limits: { steps: 100 } });

            assert.throws(() => runtime.range(1, 1000000, true), DSLLimitError);
        });
    });

    describe('runtime / the mockup end to end', () => {
        /** The mockup names DISCORD, so it needs a stub to get past `using DISCORD/...`. */
        const mockupHarness = () => harness({
            realms: {
                DISCORD: {
                    name: 'DISCORD',
                    subject: (path) => ({ name: `guild:${ path }`, live: true }),
                    channel: () => null,
                    badge: () => null,
                    user: (name) => ({ name }),
                    emote: (name) => ({ name }),
                    goto() {},
                },
            },
        });

        const source = (typeof require === 'function' && typeof __dirname !== 'undefined'
            ? require('fs').readFileSync(require('path').join(__dirname, 'fixtures', 'mockup.ttv'), 'utf8')
            : null);

        if(null === source) {
            it.skip('compiles and starts the mockup', 'no filesystem in this runtime');

            return;
        }

        it('compiles and starts the mockup without error', async() => {
            const { runtime } = mockupHarness()
                , failures = [];

            runtime.logger.error = (entry) => failures.push(entry);

            const context = await run(source, runtime);

            assert.ok(runtime.listenerCount > 0, 'the top-level `await` should have installed a listener');

            context.stop();

            assert.deepEqual(failures, []);
        });

        it('reacts to a live channel going live and drives the chat rules', async() => {
            const { runtime, clock } = mockupHarness()
                , failures = [];

            runtime.logger.error = (entry) => failures.push(entry);

            await run(source, runtime);

            // The top-level `await * with (#live is true)` fires for any event while the
            // channel in scope is live, installing the inner rules.
            await runtime.dispatch({ kind: 'live', message: "stream started" });
            await runtime.dispatch({ message: "hello there", sender: 'jjay_89' });
            await clock.advance(300000);

            assert.deepEqual(failures, []);
            assert.ok(runtime.sink.length > 0, 'the script should have sent something');
        });
    });
})();

if(typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
