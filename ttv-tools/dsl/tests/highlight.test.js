/*** /dsl/tests/highlight.test.js - `TTV_DSL.highlight` and the editor's `TTV_DSL.check`
 *
 * The Settings editor colours a script with `highlight` on every keystroke, so it must cover
 * every character, in order, with a type from a fixed list — and must never throw, however
 * broken the script is mid-edit. `check` is what it underlines; its shape is pinned here.
 */

;

(() => {
    const { highlight, check, HIGHLIGHT_TYPES } = globalThis.TTV_DSL;

    /** Reads a `.ttv` fixture, or null in a browser. */
    let fixture = (name) => {
        if (typeof require !== 'function' || typeof __dirname === 'undefined')
            return null;

        return require('fs').readFileSync(require('path').join(__dirname, 'fixtures', `${ name }.ttv`), 'utf8');
    };

    /** Every fixture script on disk, by name; empty in a browser. */
    let fixtures = () => {
        if (typeof require !== 'function' || typeof __dirname === 'undefined')
            return [];

        return require('fs').readdirSync(require('path').join(__dirname, 'fixtures'))
            .filter(name => name.endsWith('.ttv'))
            .map(name => name.slice(0, -4));
    };

    /** Asserts the coverage contract, returning the spans. */
    let covers = (source, label = '') => {
        let spans = highlight(source),
            at = 0;

        for (let span of spans) {
            assert.equal(span.start, at, `${ label }: span starts where the last ended`);
            assert.ok(span.end > span.start, `${ label }: no empty spans`);
            assert.equal(span.text, source.slice(span.start, span.end), `${ label }: text matches`);
            assert.ok(HIGHLIGHT_TYPES.includes(span.type), `${ label }: unknown type ${ span.type }`);
            at = span.end;
        }

        assert.equal(at, source.length, `${ label }: covers the whole source`);

        return spans;
    };

    /** The spans of one type, as text. */
    let of = (spans, type) => spans.filter(span => span.type === type).map(span => span.text);

    describe('highlight / coverage', () => {
        for (let name of fixtures())
            it(`covers every character of ${ name }.ttv`, () => {
                let spans = covers(fixture(name), name);

                // A clean fixture should colour cleanly — only malformed.ttv is broken on purpose.
                if ('malformed' !== name)
                    assert.deepEqual(of(spans, 'invalid'), [], name);
            });

        it('covers the empty script, and whitespace-only ones', () => {
            assert.deepEqual(highlight(''), []);
            covers('\n\n   \n\t\n');
        });
    });

    describe('highlight / never throws', () => {
        let broken = [
            'POST `unterminated template\nPOST `next line`\n',
            'using <moderator>\n    POST `x`\n',
            'await (\n',
            'await )\n',
            '"unterminated string\nPOST `ok`\n',
            'POST :kappa: $:Date.now()\n',
            '/* unterminated block comment\nPOST `x`\n',
            '\tawait *\n        POST `mixed`\n',
            'POST `${ `${ ',
            'calc(1 + ',
            '+ ~ % & $ -- [ ] ` ${ } \\',
            '\u0000\u0001￿🎉',
        ];

        for (let source of broken)
            it(`covers ${ JSON.stringify(source.slice(0, 28)) }`, () => {
                covers(source, source);
            });

        it('survives random bytes', () => {
            let alphabet = 'await using POST `${}"\'#@./[]+-*%&$~:;,()\n\t 0123456789abcXYZ<|>=!',
                seed = 7;

            for (let round = 0; round < 200; ++round) {
                let text = '';

                for (let index = 0; index < 60; ++index) {
                    seed = (seed * 1103515245 + 12345) % 2147483648;
                    text += alphabet[seed % alphabet.length];
                }

                covers(text, `round ${ round }`);
            }
        });

        it('marks the faulty line invalid and resumes on the next', () => {
            let spans = covers('POST "broken\nPOST `fine`\n');

            assert.deepEqual(of(spans, 'invalid'), ['"broken']);
            assert.deepEqual(of(spans, 'template'), ['`fine`']);
            assert.deepEqual(of(spans, 'verb'), ['POST', 'POST']);
        });

        it('colours a half-typed bracket as code, not as an error', () => {
            let spans = covers('await (.message is "hi"');

            assert.deepEqual(of(spans, 'invalid'), []);
            assert.deepEqual(of(spans, 'string'), ['"hi"']);
        });

        it('reads an unterminated backtick the way the language does: a template can span lines', () => {
            // `broken ⏎ POST ` is one template; the last backtick is the one left open.
            let spans = covers('POST `broken\nPOST `fine`\n');

            assert.deepEqual(of(spans, 'invalid'), ['`']);
        });
    });

    describe('highlight / types', () => {
        let source = [
            '// a comment',
            'plugin bot -- "Bot"',
            'define TWICE(n)',
            '    return n',
            'using [moderator] +read:html.* -- "why"',
            '    await (.raid_size is or above 50) and #live',
            '        POST `hi ${ .raider } x${ TWICE 2 }`',
            '        wait_time -> clk_fmt',
            '        POST &html.text("h1") ~ "mm:ss" /*inline*/ <| 1st of .links',
            '        for 0; 3',
            '            POST `${ $ } ${ USERNAME } ${ 5:00 } ${ * }`',
            '',
        ].join('\n');

        let spans = covers(source);

        it('colours comments, keywords and verbs', () => {
            assert.deepEqual(of(spans, 'comment'), ['// a comment', '/*inline*/']);

            for (let word of ['plugin', 'define', 'return', 'using', 'await', 'is', 'or', 'above', 'and', 'of', 'for'])
                assert.ok(of(spans, 'keyword').includes(word), word);

            assert.deepEqual(of(spans, 'verb'), ['TWICE', 'POST', 'TWICE', 'POST', 'POST']);
        });

        it('splits sigils from what they name', () => {
            assert.ok(of(spans, 'sigil').includes('#'));
            assert.ok(of(spans, 'sigil').includes('&'));
            assert.ok(of(spans, 'sigil').includes('+'));
            assert.ok(of(spans, 'sigil').includes('$'));
            assert.ok(of(spans, 'selector').includes('raid_size'));
            assert.ok(of(spans, 'selector').includes('read:html.*'));
            assert.ok(of(spans, 'selector').includes('html.text'));
            assert.ok(of(spans, 'selector').includes('[moderator]'));
        });

        it('colours the code inside `${ }`, not just the template around it', () => {
            assert.ok(of(spans, 'template').includes('`hi '));
            assert.ok(of(spans, 'punctuation').includes('${'));
            assert.ok(of(spans, 'selector').includes('raider'));
            assert.ok(of(spans, 'duration').includes('5:00'));
        });

        it('tells names, numbers, strings and operators apart', () => {
            assert.ok(of(spans, 'identifier').includes('wait_time'));
            assert.ok(of(spans, 'identifier').includes('USERNAME'), 'a constant mid-line reads as a name');
            assert.ok(of(spans, 'number').includes('1st'));
            assert.ok(of(spans, 'string').includes('"mm:ss"'));
            assert.ok(of(spans, 'operator').includes('->'));
            assert.ok(of(spans, 'operator').includes('~'));
            assert.ok(of(spans, 'punctuation').includes(';'));
            assert.ok(of(spans, 'keyword').includes('*'));
        });
    });

    describe('check / stable editor shape', () => {
        it('returns [] for a clean script', () => {
            assert.deepEqual(check('await *\n    POST `hi`\n'), []);
        });

        it('returns { name, message, loc, frame } with 1-based line/column and 0-based offsets', () => {
            let [problem] = check('await *\n    POST `a` -\n');

            assert.deepEqual(Object.keys(problem).sort(), ['frame', 'loc', 'message', 'name']);
            assert.equal(problem.name, 'DSLParseError');
            assert.deepEqual(Object.keys(problem.loc).sort(), ['column', 'end', 'line', 'start']);
            assert.equal(problem.loc.line, 2);
            assert.equal('await *\n    POST `a` -\n'.slice(problem.loc.start, problem.loc.end), '-');
            assert.equal(problem.loc.column, problem.loc.start - 'await *\n'.length + 1);
            assert.match(problem.frame, /\^/);
        });

        it('reports every parse error, in source order', () => {
            let problems = check('await *\n    POST `a` -\nawait *\n    else\n        POST `b`\n');

            assert.equal(problems.length, 2);
            assert.ok(problems[0].loc.start < problems[1].loc.start);
        });

        it('catches what only the compiler sees', () => {
            assert.match(check('using +read:htlm.*\n    POST `x`\n')[0].message, /matches nothing on the permission list/);
            assert.match(check('await *\n    POST `${ setting.volume }`\n')[0].message, /No setting named `volume`/);
            assert.match(check('define ONE(a)\n    return a\nawait *\n    POST ONE 1, 2\n')[0].message, /takes 1 argument/);
        });

        it('compiles against the host runtime without changing it', () => {
            let runtime = globalThis.TTV_DSL.createRuntime({ permissions: ['read:chat.history'] });

            assert.deepEqual(check('using +read:chat.* +eval:budget_1M -- "big"\n    POST `x`\n', { runtime }), []);
            assert.equal(runtime.limits.steps, 100000, 'a budget grant must not leak into the host runtime');
        });
    });
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
