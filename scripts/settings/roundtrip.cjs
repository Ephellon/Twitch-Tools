/*** /scripts/settings/roundtrip.cjs
 * Renders src/settings/layout.js and compares it with a hand-written settings.html, group by group and section by section.
 *
 *   git show <commit>:src/settings.html > original.html
 *   CHROMIUM=/path/to/chrome node scripts/settings/roundtrip.cjs original.html
 */

/* global Render, Layout */

const { chromium } = require('playwright-core');
const esbuild = require('esbuild');
const path = require('path');

(async() => {
    const [, , source] = process.argv;
    const { outputFiles: [bundle] } = await esbuild.build({
        stdin: { contents: `import * as R from './src/settings/render.js'; import layout from './src/settings/layout.js'; window.Render = R; window.Layout = layout;`, resolveDir: process.cwd() },
        bundle: true, write: false, format: 'iife',
    });
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM });
    const page = await browser.newPage();

    await page.route('**/*', route => route.request().resourceType() == 'document' ? route.continue() : route.abort());
    await page.goto('file://' + path.resolve(source));
    await page.addScriptTag({ content: bundle.text });

    const result = await page.evaluate(() => {
        // Structure and text, ignoring whitespace, comments and attribute order
        const normalize = node => {
            if(node.nodeType == Node.TEXT_NODE)
                return node.data.replace(/\s+/g, ' ').trim();
            if(node.nodeType != Node.ELEMENT_NODE)
                return '';

            const attrs = [...node.attributes].map(({ name, value }) => `${ name }=${ value }`).sort().join(' ');
            const kids = [...node.childNodes].map(normalize).filter(Boolean).join('|');

            return `<${ node.tagName.toLowerCase() } ${ attrs }>${ kids }</>`;
        };

        const parse = html => {
            const template = document.createElement('template');

            template.innerHTML = html;

            return template.content;
        };

        const failures = [];
        let compared = 0;

        const page = [...parse(Render.renderLayout(Layout)).children];

        document.querySelectorAll('body > header').forEach((header, index) => {
            const article = header.nextElementSibling
                , original = [header, ...article.children]
                , rendered = [page[index * 2], ...(page[index * 2 + 1]?.children ?? [])];

            // The article itself (its attributes)
            ++compared;

            if(normalize(article.cloneNode(false)) != normalize(page[index * 2 + 1]?.cloneNode(false) ?? document.createElement('x')))
                failures.push({ title: 'article ' + index, want: normalize(article.cloneNode(false)), got: normalize(page[index * 2 + 1]?.cloneNode(false)) });

            original.forEach((element, at) => {
                ++compared;

                const want = normalize(element)
                    , got = rendered[at] ? normalize(rendered[at]) : '(missing)';

                if(want != got) {
                    let from = 0;

                    while(want[from] == got[from])
                        ++from;

                    failures.push({ title: element.querySelector('.title')?.textContent.trim() ?? element.tagName, want: want.slice(Math.max(0, from - 60), from + 100), got: got.slice(Math.max(0, from - 60), from + 100) });
                }
            });
        });

        return { compared, failures };
    });

    for(const { title, want, got } of result.failures)
        console.log(`✗ ${ title }\n    want …${ want }\n    got  …${ got }`);

    console.log(`${ result.compared - result.failures.length }/${ result.compared } sections match`);
    await browser.close();
    process.exitCode = result.failures.length ? 1 : 0;
})();
