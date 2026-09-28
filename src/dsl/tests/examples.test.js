/*** /dsl/tests/examples.test.js - Every script in `examples/` runs, and does what its wiki page says
 *
 * The examples are published on the wiki as working scripts people will copy. Each is driven
 * here through a realistic chat session with the event shapes the extension delivers
 * (`host-contract.md`), and each wiki page's script must match its file exactly.
 */

;

(() => {
    const { run, createRuntime, check, inspect } = globalThis.TTV_DSL;
    const { createFakeClock, createSeededRandom, createTwitchRealm } = globalThis.TTV_DSL.runtime;

    const MINUTE = 60000;

    let fs = null
        , path = null;

    if(typeof require === 'function' && typeof __dirname !== 'undefined') {
        fs = require('fs');
        path = require('path');
    }

    const examplesDir = () => path.join(__dirname, '..', 'examples');

    /** @return {String} */
    const example = (name) => fs.readFileSync(path.join(examplesDir(), `${ name }.ttv`), 'utf8');

    /** Starts an example on a fake channel, fake clock and seeded dice. */
    const start = async(name, { settings = {}, channel = {}, seed = 1 } = {}) => {
        const clock = createFakeClock(0)
            , failures = []
            , realm = createTwitchRealm({
                current: 'ginger_enby',
                channels: { ginger_enby: Object.assign({ live: true, game: 'Elden Ring', title: "Souls-likes ALL NIGHT", viewers: 42, uptime: 2 * 60 * MINUTE + 3 * MINUTE }, channel) },
            });

        const runtime = createRuntime({
            clock,
            wallClock: () => 0,
            random: createSeededRandom(seed),
            realms: { TWITCH: realm },
            settings,
            jsBindings: { datetime: { time: () => '9:42 PM' } },
            jsPermissions: { 'datetime.time': 'read:datetime' },
            logger: { log() {}, warn() {}, error: (entry) => failures.push(String(entry)) },
        });

        await run(example(name), runtime, { channel: realm.current });

        return {
            clock,
            realm,
            failures,
            /** What was sent so far, as `"<minute> <VERB> <text>"`. */
            said: () => runtime.sink.map(entry => `${ entry.at / MINUTE } ${ entry.verb } ${ entry.text }`),
            texts: () => runtime.sink.map(entry => entry.text),
            /** A chat command, shaped as the extension delivers it. */
            command: (command, { argument = '', sender = 'zip', badges = [] } = {}) =>
                runtime.dispatch({ kind: 'command', command, argument, sender, badges, message: `!${ command } ${ argument }`.trim() }),
            /** A plain chat message. */
            message: (fields) => runtime.dispatch(Object.assign({ kind: 'message', sender: 'zip', badges: [], mentions: [], links: [] }, fields)),
            raid: (raider, raid_size) => runtime.dispatch({ kind: 'raid', raider, raid_size }),
        };
    };

    if(null === fs) {
        describe('examples', () => {
            it.skip('runs the examples', 'no filesystem in this runtime');
        });

        return;
    }

    describe('examples / every script', () => {
        for(const file of fs.readdirSync(examplesDir()).filter(name => name.endsWith('.ttv')))
            it(`${ file } is clean, and highlights without an invalid span`, () => {
                const source = fs.readFileSync(path.join(examplesDir(), file), 'utf8');

                assert.deepEqual(check(source), []);
                assert.deepEqual(globalThis.TTV_DSL.highlight(source).filter(span => 'invalid' === span.type), []);
                assert.equal(inspect(source).meta.id, file.replace(/\.ttv$/, '').replace(/-/g, '_'));
            });
    });

    describe('examples / Raid Shoutouts', () => {
        it('thanks a raid after the delay, then lets a mod re-shout it', async() => {
            const bot = await start('raid-shoutouts');

            await bot.raid('shadyhen', 25);
            assert.deepEqual(bot.texts(), [], 'nothing before the delay');

            await bot.clock.advance(10000);
            assert.equal(bot.texts().length, 1);
            assert.match(bot.texts()[0], /25 .*@shadyhen.*💜|@shadyhen.*25/);

            await bot.command('so', { badges: ['moderator'] });
            await bot.command('so', { badges: [] });
            await bot.command('so', { argument: 'soulbewitch', badges: ['moderator'] });

            assert.deepEqual(bot.texts().slice(1), [
                'Go follow @shadyhen, they raided us earlier 💜',
                'Go check out soulbewitch! 💜',
            ]);

            assert.deepEqual(bot.failures, []);
        });

        it('honours the minimum, the chill style, and a !so before any raid', async() => {
            const small = await start('raid-shoutouts', { settings: { minimum: 50 } });

            await small.raid('tiny', 3);
            await small.clock.advance(2 * MINUTE);
            assert.deepEqual(small.texts(), []);

            const chill = await start('raid-shoutouts', { settings: { style: 'chill', delay: 30 } });

            await chill.command('so', { badges: ['moderator'] });
            await chill.raid('shadyhen', 25);
            await chill.clock.advance(29000);
            assert.deepEqual(chill.texts(), ['Nobody has raided yet. Try !so <name>']);

            await chill.clock.advance(1000);
            assert.deepEqual(chill.texts().slice(1), ['Thanks for the raid, @shadyhen, and welcome, everyone 💜']);
        });
    });

    describe('examples / Stream Timers', () => {
        it('welcomes once, reminds while live, and answers !time', async() => {
            const bot = await start('stream-timers');

            await bot.command('time');
            await bot.clock.advance(60 * MINUTE);

            // Two timers due at the same instant may fire in either order; compare the set.
            assert.deepEqual(bot.said().sort(), [
                '0 REPLY It\'s 9:42 PM for the streamer.',
                '1 POST The stream bot is up. Type !time to see the streamer\'s clock.',
                '30 POST 💧 Hydration check! We\'ve been live for 2:03:00',
                '60 POST 💧 Hydration check! We\'ve been live for 2:03:00',
                '60 POST 🧘 Stretch break! Roll those shoulders.',
            ].sort());
        });

        it('stays quiet offline, and when a reminder is switched off', async() => {
            const offline = await start('stream-timers', { channel: { live: false } });

            await offline.clock.advance(2 * 60 * MINUTE);
            assert.deepEqual(offline.texts(), ['The stream bot is up. Type !time to see the streamer\'s clock.']);

            const noWater = await start('stream-timers', { settings: { hydrate: false } });

            await noWater.clock.advance(60 * MINUTE);
            assert.ok(!noWater.texts().some(text => text.includes('Hydration')));
            assert.ok(noWater.texts().some(text => text.includes('Stretch')));
        });
    });

    describe('examples / Stream Info', () => {
        it('answers from the channel\'s live data', async() => {
            const bot = await start('stream-info', { channel: { title: "Souls-likes\n\nALL NIGHT" } });

            for(const command of ['game', 'title', 'viewers', 'uptime', 'lurk'])
                await bot.command(command);

            bot.realm.current.live = false;
            await bot.command('uptime');

            assert.deepEqual(bot.texts(), [
                'We\'re playing Elden Ring',
                'Souls-likes ALL NIGHT',
                '42 people are watching 👀',
                'Live for 2h 3m',
                'We\'re offline right now. See you next stream!',
            ]);
        });
    });

    describe('examples / Link Guard', () => {
        it('warns about outside links only, and never mods or VIPs', async() => {
            const bot = await start('link-guard')
                , link = (href) => ({ href, text: href });

            await bot.message({ message: "clip!", links: [link('https://twitch.tv/zip/clip/x')] });
            await bot.message({ message: "buy", links: [link('https://spam.example/buy')] });
            await bot.message({ message: "both", links: [link('https://youtube.com/watch?v=1'), link('https://spam.example/two')] });
            await bot.message({ message: "vip", badges: ['vip'], links: [link('https://spam.example/vip')] });
            await bot.message({ message: "mod", badges: ['moderator'], links: [link('https://spam.example/mod')] });
            await bot.message({ message: "no links" });

            assert.deepEqual(bot.texts(), [
                'Please don\'t post links in chat 🙏 (https://spam.example/buy)',
                'Please don\'t post links in chat 🙏 (https://spam.example/two)',
            ]);
        });
    });

    describe('examples / Dice & Games', () => {
        /** Checks a roll reply: `n` faces from 1 to 6 that add up to the total. */
        const checkRoll = (text, count) => {
            const match = /^You rolled((?: 🎲[1-6])+) = (\d+)$/u.exec(text);

            assert.ok(match, text);

            const faces = [...match[1].matchAll(/🎲([1-6])/gu)].map(([, face]) => Number(face));

            assert.equal(faces.length, count, text);
            assert.equal(faces.reduce((sum, face) => sum + face, 0), Number(match[2]), text);
        };

        it('rolls one die, several, and at most ten', async() => {
            const bot = await start('dice-games', { seed: 3 });

            await bot.command('roll');
            await bot.command('roll', { argument: '3' });
            await bot.command('roll', { argument: '50' });
            await bot.command('roll', { argument: 'lots' });

            const [one, three, capped, fallback] = bot.texts();

            checkRoll(one, 1);
            checkRoll(three, 3);
            checkRoll(capped, 10);
            checkRoll(fallback, 1);
            assert.deepEqual(bot.failures, []);
        });

        it('flips a coin and shakes the 8-ball', async() => {
            const bot = await start('dice-games', { seed: 5 });

            await bot.command('coin');
            await bot.command('8ball');

            const [coin, ball] = bot.texts();

            assert.ok(['Heads!', 'Tails!'].includes(coin), coin);
            assert.ok(['Yes.', 'No.', 'Ask again later.', 'Without a doubt.', 'Very doubtful.'].map(answer => `🎱 ${ answer }`).includes(ball), ball);
        });
    });

    describe('examples / the wiki pages', () => {
        const wikiDir = () => path.join(examplesDir(), 'wiki');

        it('embed each script exactly as it is in `examples/`', () => {
            if(!fs.existsSync(wikiDir()))
                return;

            let pages = fs.readdirSync(wikiDir()).filter(name => name.endsWith('.md'))
                , checked = 0;

            for(const page of pages) {
                const text = fs.readFileSync(path.join(wikiDir(), page), 'utf8').replace(/\r\n/g, '\n')
                    , source = /<!-- example: ([a-z-]+)\.ttv -->\s*```ttv\n([\s\S]*?)```/.exec(text);

                if(!source)
                    continue;

                assert.equal(source[2], example(source[1]).replace(/\r\n/g, '\n'), `${ page } is out of date with ${ source[1] }.ttv`);
                ++checked;
            }

            assert.ok(checked >= 6, `only ${ checked } wiki pages embed an example`);
        });
    });
})();

if(typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
