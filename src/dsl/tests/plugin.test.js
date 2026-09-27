/*** /dsl/tests/plugin.test.js - The `plugin` header, `setting.name`, and `TTV_DSL.inspect`
 *
 * A `.ttv` script is registered as one extension plugin. Its header says what the plugin is
 * called, where it runs and which settings the viewer can tune; `inspect` turns that into the
 * plugin definition and the Settings section the extension renders, without running anything.
 */

;

(() => {
    const { run, createRuntime, parse, inspect } = globalThis.TTV_DSL;
    const { createFakeClock } = globalThis.TTV_DSL.runtime;

    const lines = (...rows) => rows.join('\n') + '\n';

    const HEADER = lines(
        'plugin raid_shoutouts -- "Raid shoutouts"',
        '    about "Shouts out raiders and lets mods re-shout them."',
        '    frames chat, main',
        '    setting delay: number 5 -- "Seconds before the shoutout"',
        '        min 0, max 60, step 1',
        '        unit "s"',
        '    setting loud: checkbox false -- "Shout in capitals"',
        '    setting greeting: text "welcome in!" -- "Greeting"',
        '        placeholder "what to say"',
        '    setting style: select "short" -- "Message length"',
        '        option "short" -- "Short"',
        '        option "long" -- "Long"',
    );

    /** Runs a script with the given stored settings and fires one event. */
    const fire = async(source, settings) => {
        const failures = []
            , runtime = createRuntime({
                clock: createFakeClock(0),
                wallClock: () => 0,
                settings,
                logger: { log() {}, warn() {}, error: (entry) => failures.push(String(entry)) },
            });

        await run(source, runtime, {});
        await runtime.dispatch({ message: "hi" });

        return { texts: runtime.sink.map(entry => entry.text), failures };
    };

    describe('plugin / `inspect`', () => {
        it('reads the header into a plugin definition and a Settings section', () => {
            const { meta, diagnostics } = inspect(HEADER + lines('using +read:datetime', '    POST `x`'));

            assert.deepEqual(diagnostics, []);
            assert.equal(meta.id, 'raid_shoutouts');
            assert.equal(meta.name, 'Raid shoutouts');
            assert.equal(meta.description, 'Shouts out raiders and lets mods re-shout them.');
            assert.deepEqual(meta.frames, ['chat', 'main']);

            assert.deepEqual(meta.settings, {
                raid_shoutouts: { type: 'checkbox', default: false },
                raid_shoutouts__delay: { type: 'number', default: 5, min: 0, max: 60, step: 1, unit: 's' },
                raid_shoutouts__loud: { type: 'checkbox', default: false },
                raid_shoutouts__greeting: { type: 'text', default: 'welcome in!', placeholder: "what to say" },
                raid_shoutouts__style: {
                    type: 'select',
                    options: [{ value: 'short', label: "Short", default: true }, { value: 'long', label: "Long" }],
                },
            });

            assert.deepEqual(meta.section.rows, [
                { toggle: 'raid_shoutouts' },
                { text: "Shouts out raiders and lets mods re-shout them.", tr: false },
                { text: "Seconds before the shoutout: {{raid_shoutouts__delay}}", tr: false },
                { text: "Shout in capitals: {{raid_shoutouts__loud}}", tr: false },
                { text: "Greeting: {{raid_shoutouts__greeting}}", tr: false },
                { text: "Message length: {{raid_shoutouts__style}}", tr: false },
            ]);

            assert.equal(meta.section.title, 'Raid shoutouts');
            assert.equal(meta.section.settings, meta.settings);

            assert.deepEqual(meta.permissions, [{ permissions: ['read:datetime'], description: null, line: 13 }]);
        });

        it('derives defaults from the file name when there is no header', () => {
            const { meta } = inspect(lines('await *', '    POST `x`'), { file: 'C:/scripts/My Raid-Bot.ttv' });

            assert.equal(meta.id, 'my_raid_bot');
            assert.equal(meta.name, 'My Raid-Bot');
            assert.deepEqual(meta.frames, ['chat']);
            assert.deepEqual(meta.settings, { my_raid_bot: { type: 'checkbox', default: false } });
            assert.equal(meta.description, null);
        });

        it('keeps an id that starts with a digit usable as a key', () => {
            assert.equal(inspect('', { file: '2fa.ttv' }).meta.id, 'ttv_2fa');
        });

        it('returns diagnostics without throwing, and meta as far as it could', () => {
            const { meta, diagnostics } = inspect(HEADER + lines('await *', '    POST `${ setting.nope'));

            assert.ok(diagnostics.length > 0);
            assert.equal(meta.id, 'raid_shoutouts');
        });

        it('does not run anything', () => {
            const runtime = createRuntime({});

            inspect(HEADER + lines('POST `should not send`'));

            assert.deepEqual(runtime.sink, []);
        });
    });

    describe('plugin / `setting.name`', () => {
        const script = HEADER + lines(
            'await *',
            '    if setting.loud',
            '        POST `${ setting.greeting % "" } LOUD ${ setting.style } after ${ setting.delay }s`',
            '    else',
            '        POST `${ setting.greeting } ${ setting.style } after ${ setting.delay }s`',
        );

        it('reads the declared default when the host stored nothing', async() => {
            assert.deepEqual((await fire(script, {})).texts, ['welcome in! short after 5s']);
        });

        it('reads what the host stored, by short name', async() => {
            assert.deepEqual((await fire(script, { loud: true, delay: 9, style: 'long' })).texts, ['welcome in! LOUD long after 9s']);
        });

        it('refuses a setting the header does not declare, before anything runs', async() => {
            let failed = null;

            try {
                await run(HEADER + lines('await *', '    POST `${ setting.volume }`'), createRuntime({}), {});
            } catch(error) {
                failed = error;
            }

            assert.match(failed?.message ?? '', /No setting named `volume`; the `plugin` header declares `delay`, `loud`, `greeting`, `style`/);
        });

        it('cannot be written', () => {
            assert.throws(() => parse(lines('`x` -> setting.loud')), /Expected a variable name after `->`/);
            assert.throws(() => parse(lines('await *', '    POST setting')), /read as `setting.name`/);
        });
    });

    describe('plugin / header rules', () => {
        const fails = (source, pattern) => assert.throws(() => parse(source), pattern);

        it('must come first, once, at the top level', () => {
            fails(lines('POST `x`', 'plugin late'), /must be the first statement/);
            fails(lines('await *', '    plugin inner'), /must be the first statement/);
            fails(lines('plugin one', 'plugin two'), /must be the first statement/);
        });

        it('checks the id, frames and line kinds', () => {
            fails(lines('plugin RaidBot'), /A plugin id is lower-case/);
            fails(lines('plugin bot', '    frames player'), /Unknown frame "player"/);
            fails(lines('plugin bot', '    POST `x`'), /holds only `about`, `frames` and `setting` lines/);
            fails(lines('plugin bot', '    about "a"', '    about "b"'), /`about` is given twice/);
        });

        it('checks each setting against its type', () => {
            fails(lines('plugin bot', '    setting n: number "five"'), /A `number` setting's default is a number/);
            fails(lines('plugin bot', '    setting n: dial 5'), /Unknown setting type "dial"/);
            fails(lines('plugin bot', '    setting n: number 5', '        placeholder "x"'), /A `number` setting takes `min`, `max`, `step`, `unit`/);
            fails(lines('plugin bot', '    setting n: number 5', '        min 10, max 1'), /`min` above `max`/);
            fails(lines('plugin bot', '    setting n: number 50', '        max 10'), /outside its `min`\/`max`/);
            fails(lines('plugin bot', '    setting n: number 5', '        step 0'), /`step` must be above 0/);
            fails(lines('plugin bot', '    setting s: select "a"'), /needs at least one `option`/);
            fails(lines('plugin bot', '    setting s: select "z"', '        option "a"'), /not one of its options/);
            fails(lines('plugin bot', '    setting n: checkbox true', '    setting n: checkbox true'), /declared twice/);
            fails(lines('plugin bot', '    setting Loud: checkbox true'), /A setting name is lower-case/);
        });

        it('accepts durations and negative numbers as number defaults', () => {
            const { meta } = inspect(lines('plugin bot', '    setting wait: number 1:30', '    setting offset: number -5', '        min -10'));

            assert.equal(meta.settings.bot__wait.default, 90000);
            assert.deepEqual(meta.settings.bot__offset, { type: 'number', default: -5, min: -10 });
        });
    });
})();

if(typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
