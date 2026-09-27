// Records the computed style of every element (and its ::before/::after) on the Settings page, with sample
// alerts, prompts and tooltips shown, so two builds can be diffed for CSS refactors that must not change anything.
//
//   CHROMIUM=/path/to/chrome node scripts/smoke/styles.cjs dist/chrome out.txt [light]
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

(async() => {
    const [, , dist = 'dist/chrome', output = 'styles.txt', scheme = 'dark'] = process.argv;
    const ext = path.resolve(dist);
    const ctx = await chromium.launchPersistentContext(path.join(require('os').tmpdir(), 'ttv-styles-' + Date.now()), {
        executablePath: process.env.CHROMIUM || undefined,
        headless: true,
        colorScheme: scheme,
        viewport: { width: 1280, height: 900 },
        args: ['--headless=new', `--disable-extensions-except=${ ext }`, `--load-extension=${ ext }`],
    });
    let [sw] = ctx.serviceWorkers();

    sw ??= await ctx.waitForEvent('serviceworker', { timeout: 15000 });

    const id = sw.url().split('/')[2];
    const page = await ctx.newPage();

    await page.goto(`chrome-extension://${ id }/settings.html`);
    await page.waitForTimeout(3000);

    const lines = await page.evaluate(async() => {
        // Samples of the shared UI: popups and a tooltip
        alert.silent("Sample alert");
        confirm.silent("Sample confirmation");
        prompt.silent("Sample prompt", 'value');

        const anchor = document.querySelector('#save') ?? document.body;

        new Tooltip(anchor, "Sample tooltip");
        anchor.dispatchEvent(new MouseEvent('mouseenter'));

        for(const details of document.querySelectorAll('details'))
            details.open = true;

        await new Promise(resolve => setTimeout(resolve, 1500));

        // Animation state and generated ids vary between runs
        const SKIP = /^(animation|transition|will-change|cursor|caret-color|transform|perspective-origin|transform-origin|inline-size|block-size|width|height|left|top|right|bottom|inset|min-inline-size|min-block-size|max-inline-size|max-block-size|x|y|d|r|cx|cy)/;
        const pathOf = element => {
            const parts = [];

            for(let node = element; node && node.nodeType == 1; node = node.parentElement)
                parts.unshift(node.tagName.toLowerCase() + (node.id && !/^uuid|:/.test(node.id) ? '#' + node.id : '') + ':' + [...(node.parentElement?.children ?? [])].indexOf(node));

            return parts.join('>');
        };
        const describe = style => [...style].filter(name => !SKIP.test(name)).sort().map(name => `${ name }=${ style.getPropertyValue(name) }`).join(';');
        const out = [];

        for(const element of document.querySelectorAll('body *')) {
            if(element.closest('script, style'))
                continue;

            out.push(pathOf(element) + ' | ' + describe(getComputedStyle(element)));

            for(const pseudo of ['::before', '::after']) {
                const style = getComputedStyle(element, pseudo);

                if(style.content != 'none' && style.content != 'normal')
                    out.push(pathOf(element) + pseudo + ' | ' + describe(style));
            }
        }

        return out;
    });

    fs.writeFileSync(output, lines.join('\n'));
    console.log(`${ lines.length } elements`);
    await ctx.close();
})().catch(error => {
    console.error('STYLES FAILED', error);
    process.exit(1);
});
