/*** /settings/index.js
 * Builds the Settings page from the declared layout, before settings.js runs.
 * Publishes the setting ids and their defaults for settings.js.
 */

import layout from './layout.js';
import { renderLayout, settingIds, settingDefaults } from './render.js';
import { renderUserScripts } from './user-scripts.js';
import { renderSiteAccess } from './site-access.js';

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

window.SETTINGS_LAYOUT = layout;
window.SETTINGS_IDS = settingIds(layout);
window.SETTINGS_DEFAULTS = settingDefaults(layout);

// The viewer's scripts come from storage; settings.js waits for them before loading values
window.SETTINGS_EXTRA = renderUserScripts({ ids: window.SETTINGS_IDS, defaults: window.SETTINGS_DEFAULTS })
    .catch(error => console.error("User Scripts:", error));

// Site Access (Networking): the button that grants the optional host permissions
renderSiteAccess().catch(error => console.error("Site Access:", error));
