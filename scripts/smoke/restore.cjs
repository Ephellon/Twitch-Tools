// Feeds a settings JSON file to the "restore" input and reports what landed in storage
module.exports = async page => {
    const fs = require('fs');
    fs.writeFileSync(require('path').join(require('os').tmpdir(), 'ttv-restore.json'), JSON.stringify({ auto_accept_mature: true, simplify_chat_font: 'Comic Sans MS', view_mode: 'theatre' }));
    await page.setInputFiles('#sync-settings--upload-json-input', require('path').join(require('os').tmpdir(), 'ttv-restore.json'));
    await page.waitForTimeout(3000);
    const stored = await page.evaluate(() => new Promise(r => chrome.storage.local.get(['auto_accept_mature', 'simplify_chat_font', 'view_mode'], r)));
    console.log('form:', JSON.stringify(await page.evaluate(() => ({ auto_accept_mature: document.querySelector('#auto_accept_mature').checked, simplify_chat_font: document.querySelector('#simplify_chat_font').value, view_mode: document.querySelector('#view_mode').value }))));
    const status = await page.evaluate(() => document.querySelector('#sync-settings--status, [id*="sync"][id*="status"]')?.textContent?.trim());
    console.log('restore → storage', JSON.stringify(stored), 'status:', status);
};
