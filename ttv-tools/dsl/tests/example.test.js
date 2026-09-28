/*** /dsl/tests/example.test.js - The example script the extension ships, kept working
 *
 * `hello-bot.ttv` is the first script a new user sees on the Settings page. It must stay
 * valid, keep its settings keys (users have saved values under them), and do what it says.
 */

;

(() => {
    const { run, createRuntime, check, inspect } = globalThis.TTV_DSL;
    const { createFakeClock, createSeededRandom, createTwitchRealm } = globalThis.TTV_DSL.runtime;

    let source = null;

    if (typeof require === 'function' && typeof __dirname !== 'undefined')
        source = require('fs').readFileSync(require('path').join(__dirname, '..', 'examples', 'hello-bot.ttv'), 'utf8');

    describe('example / hello-bot.ttv', () => {
        if (null === source)
            return it.skip('runs hello-bot.ttv', 'no filesystem in this runtime');

        it('is clean and asks for no permissions', () => {
            assert.deepEqual(check(source), []);
            assert.deepEqual(inspect(source).meta.permissions, []);
        });

        it('keeps the settings keys users have already saved values under', () => {
            let { meta } = inspect(source);

            assert.equal(meta.id, 'hello_bot');
            assert.deepEqual(meta.settings.hello_bot__reply, { type: 'text', default: 'Hi there!' });
            assert.deepEqual(meta.settings.hello_bot__reminders, { type: 'checkbox', default: true });
        });

        it('greets, remembers, salutes mods, waves, and reminds only while live', async () => {
            let clock = createFakeClock(0),
                realm = createTwitchRealm({ current: 'ginger_enby', channels: { ginger_enby: { live: true } } }),
                failures = [],
                runtime = createRuntime({
                    clock,
                    wallClock: () => 0,
                    random: createSeededRandom(1),
                    realms: { TWITCH: realm },
                    logger: { log() {}, warn() {}, error: (entry) => failures.push(String(entry)) },
                });

            await run(source, runtime, { channel: realm.current });

            let command = (command, sender, argument = '', badges = []) => runtime.dispatch({ command, argument, sender, badges });

            await command('who', 'zip');
            await command('hello', 'zip');
            await command('hello', 'mod1', '@shadyhen', ['moderator']);
            await command('who', 'zip');
            await command('bye', 'zip');
            await command('lurk', 'zip');
            await clock.advance(15 * 60000);

            realm.current.live = false;
            await clock.advance(15 * 60000);

            assert.deepEqual(runtime.sink.map(entry => `${ entry.at / 60000 } ${ entry.verb } ${ entry.text }`), [
                '0 REPLY Nobody has said !hello yet. Be the first!',
                '0 REPLY Hi there!',
                '0 POST Hi there! @shadyhen',
                '0 POST 🛡️ mod1 is on duty.',
                '0 REPLY The last person I said hi to was mod1.',
                '0 REPLY Thanks for stopping by 💜',
                '15 POST Type !hello and I\'ll say hi 🤖',
            ]);
            assert.deepEqual(failures, []);
        });

        it('uses the stored reply, and stays quiet with reminders off', async () => {
            let clock = createFakeClock(0),
                runtime = createRuntime({ clock, wallClock: () => 0, settings: { reply: 'Yo!', reminders: false } });

            await run(source, runtime, { channel: runtime.realm('TWITCH').current });
            await runtime.dispatch({ command: 'hello', argument: '', sender: 'zip', badges: [] });
            await clock.advance(60 * 60000);

            assert.deepEqual(runtime.sink.map(entry => entry.text), ['Yo!']);
        });
    });
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
