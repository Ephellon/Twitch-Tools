// Serves a stub twitch.tv channel page so the content scripts load, and collects their errors
const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
    const ext = path.resolve(process.argv[2] || 'dist/chrome');
    const ctx = await chromium.launchPersistentContext(require('path').join(require('os').tmpdir(), 'ttv-smoke-' + Date.now()), {
        executablePath: process.env.CHROMIUM || undefined,
        headless: true,
        args: ['--headless=new', `--disable-extensions-except=${ ext }`, `--load-extension=${ ext }`],
    });
    await ctx.route(/^https:\/\/([a-z]+\.)?twitch\.tv\//, route => route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><html class="tw-root--theme-dark" lang="en"><head><title>stub - Twitch</title></head><body>
            <nav><button data-a-target="user-menu-toggle">menu</button><div data-a-target="user-display-name">tester</div></nav>
            <main><h1>stubchannel</h1><div data-a-player-state="playing"><video></video></div>
            <div data-a-target="player-overlay-mature-accept"><button onclick="document.body.dataset.matureClicked = 1">Start watching</button></div>
            <div class="extension-view__iframe" id="ext">extension</div>
            <button data-a-target="follow-button">Follow</button>
            <div data-test-selector="chat-scrollable-area__message-container"></div><div id="side-nav"><div class="side-nav-section" aria-label="Followed Channels"></div></div></main></body></html>`,
    }));
    await ctx.route(/^https?:\/\/(?!([a-z]+\.)?twitch\.tv\/)/, route => route.abort());
    if(process.env.ENABLE) {
        let [sw] = ctx.serviceWorkers(); sw ??= await ctx.waitForEvent('serviceworker');
        await sw.evaluate(() => chrome.storage.local.set({ auto_accept_mature: true, kill_extensions: true, view_mode: 'theatre' }));
    }
    const errors = [];
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    const counts = {}; page.on('console', m => { counts[m.type()] = (counts[m.type()] ?? 0) + 1; if(process.env.DUMP) console.log('[' + m.type() + '] ' + m.text().replace(/\d{4}-\d\d-\d\dT\S+|\d{10,}|\w{3} \w{3} \d\d \d{4}[^)]*\)/g, '#').slice(0, 140)); });
    page.on('console', m => ['error'].includes(m.type()) && !/Failed to load resource|ERR_FAILED/.test(m.text()) && errors.push('console: ' + m.text().slice(0, 240)));
    const early = await ctx.newCDPSession(page);
    early.on('Runtime.exceptionThrown', ({ exceptionDetails: d }) => errors.push(`exception: ${ (d.exception?.description ?? d.text).split('\n').slice(0, 3).join(' | ') } @ ${ d.url?.split('/').pop() }:${ d.lineNumber + 1 }`));
    await early.send('Runtime.enable');
    await page.goto('https://www.twitch.tv/stubchannel');
    await page.waitForTimeout(Number(process.argv[3] || 12000));
    console.log('effects:', JSON.stringify(await page.evaluate(() => ({ matureClicked: document.body.dataset.matureClicked ?? null, extensionStyle: document.getElementById('ext')?.getAttribute('style') ?? null }))));
    if(process.env.PROBE) {
        // Evaluate inside the extension's isolated world (where the content scripts live)
        const cdp = await ctx.newCDPSession(page);
        const worlds = [];
        cdp.on('Runtime.executionContextCreated', ({ context }) => worlds.push(context));
        await cdp.send('Runtime.enable');
        await page.waitForTimeout(500);
        const { frameTree } = await cdp.send('Page.getFrameTree');
        const world = worlds.find(c => c.auxData?.frameId == frameTree.frame.id && !c.auxData?.isDefault && c.origin?.startsWith('chrome-extension://'));
        const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', { contextId: world?.id, expression: process.env.PROBE, returnByValue: true, awaitPromise: true });
        console.log('probe:', JSON.stringify(result?.value ?? exceptionDetails?.exception?.description ?? result));
    }
    const globals = await page.evaluate(() => typeof window.Balloon);
    console.log('main-world typeof Balloon (should be undefined; content scripts are isolated):', globals);
    console.log('console messages by type:', JSON.stringify(counts), '| css blocks:', await page.evaluate(() => document.querySelectorAll('style, [css-block], link[rel=stylesheet]').length));
    console.log(errors.length ? [...new Set(errors)].join('\n') : 'no errors');
    await ctx.close();
})().catch(e => { console.error('SMOKE FAILED', e); process.exit(1); });
