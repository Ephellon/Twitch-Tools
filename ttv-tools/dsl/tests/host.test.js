/*** /dsl/tests/host.test.js - The host contract, exercised against the fake page
 *
 * `HOST.md` promises a set of `&Html.*` calls, the permission each one needs, and a way for
 * a host to see what a script will ask for before running it. These tests hold the fake page
 * to that promise, so the real host has a working reference to match.
 */

;

(() => {
    const { run, createRuntime, parse } = globalThis.TTV_DSL;
    const { createFakeClock, createSeededRandom } = globalThis.TTV_DSL.runtime;
    const { createFakePage, HTML_PERMISSIONS } = globalThis.TTV_DSL.fakePage;

    const PAGE = [
        '<main id="chat">',
        '  <h1 class="title big">Stream &amp; chill</h1>',
        '  <ul class="messages">',
        '    <li class="msg" data-user="zip">hi</li>',
        '    <li class="msg mod" data-user="ginger_enby">welcome!</li>',
        '  </ul>',
        '  <img src="kappa.png" alt="Kappa">',
        '</main>',
    ].join('\n');

    /** A runtime wired to a fresh fake page. */
    let harness = () => {
        let page = createFakePage(PAGE),
            failures = [];

        let runtime = createRuntime({
            clock: createFakeClock(0),
            wallClock: () => 0,
            random: createSeededRandom(1),
            jsBindings: page.bindings,
            jsPermissions: page.permissions,
            logger: { log() {}, warn() {}, error: (entry) => failures.push(String(entry)) },
        });

        return { page, runtime, failures };
    };

    /** Runs a script under one block's grants, then fires one event. */
    let script = async (header, lines) => {
        let fixture = harness();

        await run([header, '    await *', ...lines.map(line => `        ${ line }`), ''].join('\n'), fixture.runtime, {});
        await fixture.runtime.dispatch({ kind: 'test' });

        return Object.assign(fixture, { texts: fixture.runtime.sink.map(entry => entry.text) });
    };

    describe('host / the fake page itself', () => {
        let page = createFakePage(PAGE);

        it('selects by tag, id, class, attribute and descendant', () => {
            assert.equal(page.query('li').length, 2);
            assert.equal(page.query('#chat').length, 1);
            assert.equal(page.query('li.mod').length, 1);
            assert.equal(page.query('[data-user=zip]').length, 1);
            assert.equal(page.query('main .messages li').length, 2);
            assert.equal(page.query('ul h1').length, 0);
        });

        it('decodes entities and keeps void elements childless', () => {
            let { Html } = page.bindings;

            assert.equal(Html.text('h1'), 'Stream & chill');
            assert.equal(Html.attr('img', 'alt'), 'Kappa');
            assert.equal(page.query('img')[0].children.length, 0);
        });

        it('maps every call to a permission on the default list', () => {
            let runtime = createRuntime({ jsPermissions: HTML_PERMISSIONS });

            for (let needed of Object.values(HTML_PERMISSIONS))
                assert.ok(runtime.permissions.has(needed), needed);
        });
    });

    describe('host / reading the page', () => {
        it('reads text, attributes and structure under the matching grants', async () => {
            let { texts, failures } = await script('using +read:html.*', [
                'POST `${ &Html.text("li.mod") } / ${ &Html.attr("li.mod", "data-user") } / ${ &Html.count(".msg") }`',
            ]);

            assert.deepEqual(failures, []);
            assert.deepEqual(texts, ['welcome! / ginger_enby / 2']);
        });

        it('refuses a read the block was not granted', async () => {
            let { texts, failures } = await script('using +read:html.text', ['POST `${ &Html.attr("img", "src") }`']);

            assert.deepEqual(texts, []);
            assert.ok(failures.some(entry => /not granted .\+read:html\.attributes/.test(entry)), failures.join('\n'));
        });
    });

    describe('host / writing the page', () => {
        it('lets a host call stand alone as a statement', () => {
            assert.like(parse('&Html.setText("h1", "hi")\n').body[0], { type: 'ExpressionStatement', expression: { type: 'JSInvokeExpression' } });
        });

        it('changes text and attributes under a described `write` grant', async () => {
            let { page, failures } = await script('using +write:html.* -- "renames the stream title"', [
                '&Html.setText("h1", "Now: speedruns")',
                '&Html.setAttr("li.mod", "data-flagged", "yes")',
            ]);

            assert.deepEqual(failures, []);
            assert.equal(page.bindings.Html.text('h1'), 'Now: speedruns');
            assert.equal(page.bindings.Html.attr('li.mod', 'data-flagged'), 'yes');
        });

        it('leaves the page alone without the grant', async () => {
            let { page, failures } = await script('using +read:html.*', ['&Html.setText("h1", "defaced")']);

            assert.equal(page.bindings.Html.text('h1'), 'Stream & chill');
            assert.ok(failures.some(entry => /not granted .\+write:html\.text/.test(entry)), failures.join('\n'));
        });
    });

    describe('host / parsing markup', () => {
        it('turns markup into serializable data', async () => {
            let { page } = harness(),
                { Html } = page.bindings,
                tree = Html.parse('<p class="a">x<b>y</b></p>');

            assert.deepEqual(tree, [{ tag: 'p', attributes: { class: 'a' }, children: ['x', { tag: 'b', attributes: {}, children: ['y'] }] }]);
            assert.deepEqual(JSON.parse(JSON.stringify(tree)), tree);
            assert.equal(Html.parseText('<p>a <i>b</i></p>'), 'a b');
            assert.deepEqual(Html.parseAttrs('<a href="/x" target=_blank>'), { href: '/x', target: '_blank' });
        });

        it('parses under `parse:html.*`, not under `read:html.*`', async () => {
            let allowed = await script('using +parse:html.*', ['POST `${ &Html.parseText("<b>ok</b>") }`']),
                refused = await script('using +read:html.*', ['POST `${ &Html.parseText("<b>ok</b>") }`']);

            assert.deepEqual(allowed.texts, ['ok']);
            assert.deepEqual(refused.texts, []);
        });
    });

    describe('host / `grants()` — what a script asks for, before it runs', () => {
        it('lists every granting block with its description, and every host call', () => {
            let report = globalThis.TTV_DSL.grants([
                'using +read:html.*',
                '    await *',
                '        POST `${ &Html.text("h1") }`',
                'using [moderator] +write:html.text -- "renames the title for mods"',
                '    await *',
                '        &Html.setText("h1", "hi")',
                'using -- "just a label"',
                '    POST `x`',
                '',
            ].join('\n'));

            assert.deepEqual(report.blocks, [
                { permissions: ['read:html.*'], description: null, line: 1 },
                { permissions: ['write:html.text'], description: 'renames the title for mods', line: 4 },
                { permissions: [], description: 'just a label', line: 7 },
            ]);
            assert.deepEqual(report.calls, [{ path: 'Html.text', line: 3 }, { path: 'Html.setText', line: 6 }]);
        });
    });
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
