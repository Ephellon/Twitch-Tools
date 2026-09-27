/*** /dsl/tests/realistic.test.js - One real script, driven end to end
 *
 * The other suites test constructs. This one tests a *script*: `realistic.ttv` is the kind
 * of thing a streamer would actually keep in their settings page — auto-shoutout raiders,
 * let a mod re-shout them later with a bare `!so`, and nag about overrunning.
 *
 * It exists to answer a question the per-construct tests cannot: does the language still
 * behave when several features are load-bearing at once? The `!so` fallback only works if
 * a binding really does reach a later sibling; the shoutout only reads correctly if `%` really
 * does flatten a multi-line title; the nag only runs if the permission grant really does
 * reach the `&` call three scopes down. So this asserts the exact messages, in order, with
 * the simulated time each was sent at.
 */

;

(() => {
    const { run, createRuntime } = globalThis.TTV_DSL;
    const { createFakeClock, createSeededRandom, createTwitchRealm } = globalThis.TTV_DSL.runtime;

    const MINUTE = 60000;

    /** Reads the fixture, or null in a browser where there is no filesystem. */
    let fixture = (name) => {
        if (typeof require !== 'function' || typeof __dirname === 'undefined')
            return null;

        return require('fs').readFileSync(require('path').join(__dirname, 'fixtures', `${ name }.ttv`), 'utf8');
    };

    const SOURCE = fixture('realistic');

    /** The host wiring this script expects: a formatted-time helper behind `read:datetime`.
     *
     * Deliberately *not* `Date.now` — a streamer wants "9:42pm" in chat, not a unix
     * timestamp, so the realistic host binding is a formatter. Frozen output so the
     * assertion is stable.
     * @param {Object} [options]
     * @return {{ runtime, clock, realm, failures }}
     */
    let harness = ({ seed = 1, bindings = true, mapped = true } = {}) => {
        let clock = createFakeClock(0),
            failures = [],
            realm = createTwitchRealm({
                current: 'ginger_enby',
                channels: { ginger_enby: { live: true, badges: [] } },
            });

        let runtime = createRuntime({
            clock,
            wallClock: () => 0,
            random: createSeededRandom(seed),
            realms: { TWITCH: realm },
            jsBindings: (bindings? { Clock: { time: () => '9:42pm' } }: {}),
            jsPermissions: (mapped? { 'Clock.time': 'read:datetime' }: {}),
            // A fault inside a detached timer loop is reported, not thrown.
            logger: { log() {}, warn() {}, error: (entry) => failures.push(String(entry)) },
        });

        return { runtime, clock, realm, failures };
    };

    /** @return {Array<String>} `"<simulated ms> <VERB>: <text>"`, in send order */
    let trace = (runtime) => runtime.sink.map(entry => `${ entry.at } ${ entry.verb }: ${ entry.text }`);

    /** A raid event, as the host would deliver it. The title is deliberately ugly: real
     * stream titles arrive with hard line breaks and runs of padding in them. */
    const RAID = Object.freeze({
        raider: 'shadyhen',
        raid_size: 212,
        raider_title: '  Souls-likes\n\n   ALL NIGHT   ',
    });

    if (null === SOURCE) {
        describe('realistic / raid shoutouts', () => {
            it.skip('drives realistic.ttv end to end', 'no filesystem in this runtime');
        });

        return;
    }

    describe('realistic / raid shoutouts', () => {
        it('parses and compiles clean, installing two handlers and one timer', async () => {
            let { runtime, clock, realm, failures } = harness();

            await run(SOURCE, runtime, { channel: realm.current });

            // Two `await`s on events, one on a duration. `await` installs and returns, so
            // all three are live before a single message has arrived.
            assert.equal(runtime.listenerCount, 2);
            assert.equal(clock.pending, 1);
            assert.deepEqual(failures, []);
        });

        it('drives a full session: raid, four commands, then the timer', async () => {
            let { runtime, clock, realm, failures } = harness({ seed: 1 });

            await run(SOURCE, runtime, { channel: realm.current });

            await runtime.dispatch(RAID);
            await runtime.dispatch({ command: 'so', argument: 'soulbewitch', badges: ['moderator'] });
            await runtime.dispatch({ command: 'so', badges: ['moderator'] });
            // A viewer is not a mod: `using [moderator]` contributes no iteration, so this
            // message produces nothing at all.
            await runtime.dispatch({ command: 'so', badges: ['viewer'] });
            await runtime.dispatch({ command: 'socials', badges: ['moderator'] });
            await runtime.dispatch({ command: 'lurk', badges: ['moderator'] });

            await clock.advance(30 * MINUTE);

            assert.deepEqual(trace(runtime), [
                // `%s ' '` flattened "  Souls-likes\n\n   ALL NIGHT   " to one chat line.
                '0 POST: 212 absolute gremlins incoming from @shadyhen (Souls-likes ALL NIGHT)',
                // 212 `is or above` 50, so the big-raid welcome goes out too.
                '0 POST: welcome in, all 212 of you — grab a seat, get comfy 💜',
                // `!so soulbewitch` — the explicit name wins the `if`.
                '0 POST: everyone go follow @soulbewitch 💜',
                // `!so` with no name — the chain `when` falls back to `last_raider`, which
                // only exists here because the default scope mode shares it with siblings.
                '0 POST: go follow @shadyhen, they raided us earlier 💜',
                // `!so` from a viewer produced nothing; the next line is `!socials`.
                '0 POST: twitch.tv/ginger_enby · everything else: linktr.ee/ginger_enby',
                // `!lurk` matched no named case, so the `*` case caught it.
                '0 POST: never heard of !lurk. try !so or !socials',
                // The 30-minute timer, one tick, reading the clock through `&`.
                '1800000 POST: it is 9:42pm and i said i would end at nine. send help',
            ]);

            assert.deepEqual(failures, []);
        });

        it('rotates the shoutout wording rather than repeating itself', async () => {
            let lines = new Set();

            for (let seed of [1, 2, 6, 11, 17]) {
                let { runtime, realm } = harness({ seed });

                await run(SOURCE, runtime, { channel: realm.current });
                await runtime.dispatch(RAID);

                lines.add(runtime.sink[0].text);
            }

            // The point of `any from` here is that it does not read like a bot.
            assert.ok(lines.size > 1, `expected more than one phrasing, got ${ [...lines].join(' / ') }`);

            // Whichever one is picked, it names the raider and what they were doing.
            for (let line of lines) {
                assert.match(line, /shadyhen/);
                assert.match(line, /Souls-likes ALL NIGHT/);
            }
        });

        it('says so politely when `!so` runs before anyone has raided', async () => {
            let { runtime, realm } = harness();

            await run(SOURCE, runtime, { channel: realm.current });
            await runtime.dispatch({ command: 'so', badges: ['moderator'] });

            // `last_raider` was never bound. Reading it yields empty rather than throwing,
            // so the `else` is what runs.
            assert.deepEqual(runtime.sink.map(entry => entry.text), [
                'nobody has raided yet — give me a name: !so <channel>',
            ]);
        });

        it('treats a bare `!so` with an empty argument as no argument', async () => {
            let { runtime, realm } = harness();

            await run(SOURCE, runtime, { channel: realm.current });
            await runtime.dispatch(RAID);
            // What Twitch actually delivers for a bare `!so`: an empty string, which is
            // ANYTHING (so `*` would have matched it) but not SOMETHING.
            await runtime.dispatch({ command: 'so', argument: '', badges: ['moderator'] });

            assert.equal(runtime.sink[runtime.sink.length - 1].text, 'go follow @shadyhen, they raided us earlier 💜');
        });

        it('keeps the big-raid welcome for big raids', async () => {
            let { runtime, realm } = harness();

            await run(SOURCE, runtime, { channel: realm.current });

            for (let raid_size of [4, 49, 50])
                await runtime.dispatch({ raider: 'jjay_89', raid_size, raider_title: 'chatting' });

            // One shoutout each, and one welcome (either wording) — for the 50, not the 49.
            assert.equal(runtime.sink.length, 4);
            assert.match(runtime.sink[3].text, / 50 /);
        });

        it('ignores commands from viewers, including the raid-adjacent ones', async () => {
            let { runtime, realm, failures } = harness();

            await run(SOURCE, runtime, { channel: realm.current });

            await runtime.dispatch(RAID);

            let afterRaid = runtime.sink.length;

            for (let badges of [[], ['viewer'], ['subscriber'], ['vip']])
                await runtime.dispatch({ command: 'so', badges });

            assert.equal(runtime.sink.length, afterRaid, 'a non-mod must not be able to shout out');
            assert.deepEqual(failures, []);
        });

        it('only remembers the most recent raider', async () => {
            let { runtime, realm } = harness();

            await run(SOURCE, runtime, { channel: realm.current });

            await runtime.dispatch(RAID);
            await runtime.dispatch({ raider: 'jjay_89', raid_size: 4, raider_title: 'chatting' });
            await runtime.dispatch({ command: 'so', badges: ['moderator'] });

            // The binding lands in the same shared slot each time, so the second raid
            // overwrites the first.
            assert.match(runtime.sink[runtime.sink.length - 1].text, /@jjay_89/);
        });

        it('repeats the nag every thirty minutes, not once', async () => {
            let { runtime, clock, realm } = harness();

            await run(SOURCE, runtime, { channel: realm.current });
            await clock.advance(95 * MINUTE);

            // `await <duration>` is a recurring trigger (SPEC §6.1), so 95 minutes is three
            // ticks — at 30, 60 and 90.
            assert.deepEqual(runtime.sink.map(entry => entry.at), [30 * MINUTE, 60 * MINUTE, 90 * MINUTE]);
        });
    });

    // The grant is the only thing standing between this script and the clock. These assert
    // it is load-bearing rather than decorative.
    describe('realistic / the `+read:datetime` grant is load-bearing', () => {
        if (null === SOURCE) {
            it.skip('checks the grant', 'no filesystem in this runtime');

            return;
        }

        it('refuses the nag when the host maps the path to something else', async () => {
            // Unmapped, so `Clock.time` falls back to requiring `eval:js` — which the script
            // never asked for. The raid handling is unaffected, which is the point of
            // scoping the grant to the block that needs it.
            let { runtime, clock, failures } = harness({ mapped: false });

            await run(SOURCE, runtime, {});
            await runtime.dispatch(RAID);
            await clock.advance(30 * MINUTE);

            assert.equal(runtime.sink.length, 2, 'the raid shoutout and welcome should still have gone out');
            assert.ok(failures.some(entry => /DSLPermissionError/.test(entry)), failures.join('\n'));
            assert.ok(failures.some(entry => /\+eval:js/.test(entry)), failures.join('\n'));
        });

        it('fails loudly when the host registered no binding at all', async () => {
            let { runtime, clock, failures } = harness({ bindings: false });

            await run(SOURCE, runtime, {});
            await clock.advance(30 * MINUTE);

            assert.equal(runtime.sink.length, 0);
            assert.ok(failures.some(entry => /No host binding for `\&Clock\.time`/.test(entry)), failures.join('\n'));
        });
    });
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
