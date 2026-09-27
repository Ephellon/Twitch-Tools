// Loads the built extension, then reports errors from the service worker and the Settings page
const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
    const ext = path.resolve(process.argv[2] || 'dist/chrome');
    const ctx = await chromium.launchPersistentContext(require('path').join(require('os').tmpdir(), 'ttv-smoke-' + Date.now()), {
        executablePath: process.env.CHROMIUM || undefined,
        headless: true,
        args: ['--headless=new', `--disable-extensions-except=${ ext }`, `--load-extension=${ ext }`],
    });
    let [sw] = ctx.serviceWorkers();
    sw ??= await ctx.waitForEvent('serviceworker', { timeout: 15000 });
    const id = sw.url().split('/')[2];
    const errors = [];
    sw.on('console', m => m.type() == 'error' && errors.push(['sw', m.text()]));
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(['settings:pageerror', e.message]));
    page.on('console', m => m.type() == 'error' && errors.push(['settings:console', m.text().slice(0, 200)]));
    await page.goto(`chrome-extension://${ id }/settings.html`);
    await page.waitForTimeout(4000);
    const info = await page.evaluate(() => ({ title: document.title, sections: document.querySelectorAll('section').length, inputs: document.querySelectorAll('input[id]').length }));
    console.log('extension id', id, JSON.stringify(info));
    if(process.argv[3]) await require(require('path').resolve(process.argv[3]))(page, errors, ctx, id);
    console.log(errors.length ? errors.map(e => e.join(' | ')).join('\n') : 'no errors');
    await ctx.close();
})().catch(e => { console.error('SMOKE FAILED', e); process.exit(1); });
