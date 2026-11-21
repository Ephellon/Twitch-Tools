/*** /settings/index.js
 * Builds the Settings page from the declared layout, before settings.js runs.
 * Publishes the setting ids and their defaults for settings.js.
 */

import layout from './layout.js';
import { renderLayout, settingIds, settingDefaults } from './render.js';
import { renderUserScripts } from './user-scripts.js';
import { renderSiteAccess } from './site-access.js';
import { checkRecording, keyId } from '../lib/debug-recorder.js';

document.getElementById('search-container').insertAdjacentHTML('beforebegin', renderLayout(layout));

// Jump to a group: its settings land just under its (sticky) title. Listens on the document (settings.js re-renders
// translated text) and before settings.js, which opens links in a new tab
document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#group-"]');

    if(!link)
        return;

    event.preventDefault();
    event.stopImmediatePropagation();
    document.querySelector(link.getAttribute('href'))?.nextElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}, { capture: true });

// Debug Recording: this browser's signing key, and a check for received recordings that reads them without opening them
// (see "Signing" in lib/debug-recorder.js)
{
    const runtime = (globalThis.browser ?? globalThis.chrome)?.runtime;
    let ownKey = null;

    try {
        runtime?.sendMessage?.({ action: 'DEBUG_RECORDING_KEY' }, async answer => {
            void runtime.lastError;

            if(!answer?.key)
                return;

            ownKey = await keyId(answer.key);

            const shown = document.getElementById('debug-recording--key');

            if(shown)
                shown.textContent = ownKey;
        });
    } catch {
        // No background
    }

    document.getElementById('debug-recording--check-input')?.addEventListener('change', async event => {
        const input = event.currentTarget
            , [file] = input.files ?? []
            , shown = document.getElementById('debug-recording--check-result');

        if(!file || !shown)
            return;

        shown.textContent = `Checking "${ file.name }"...`;

        const result = await checkRecording(await file.text())
            , { version = '?', browser = '?', channel = '' } = result.meta ?? {}
            , about = `TTV Tools ${ version }, ${ browser }${ channel ? `, ${ channel }` : '' }`
            , whose = (result.key && result.key == ownKey) ? ' (this browser)' : '';

        shown.textContent = (false
            || (result.page && result.valid && `✔ "${ file.name }" is a real TTV Tools recording (${ about }), signed with key ${ result.key }${ whose }. Its log hasn't been changed. It's safe to open.`)
            || (result.page && result.signed && `✖ "${ file.name }" runs only TTV Tools' own code (safe to open), but ${ result.reason }.`)
            || (result.page && `⚠ "${ file.name }" runs only TTV Tools' own code (${ about }), so it's safe to open, but it's ${ result.reason }: its log can't be confirmed.`)
            || `✖ "${ file.name }": ${ result.reason }. Don't open it.`
        );

        input.value = '';
    });
}

window.SETTINGS_LAYOUT = layout;
window.SETTINGS_IDS = settingIds(layout);
window.SETTINGS_DEFAULTS = settingDefaults(layout);

// The viewer's scripts come from storage; settings.js waits for them before loading values
window.SETTINGS_EXTRA = renderUserScripts({ ids: window.SETTINGS_IDS, defaults: window.SETTINGS_DEFAULTS })
    .catch(error => console.error("User Scripts:", error));

// Site Access (Networking): the button that grants the optional host permissions
renderSiteAccess().catch(error => console.error("Site Access:", error));
