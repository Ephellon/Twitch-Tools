/*** /settings/index.js
 * Builds the Settings page from the declared layout, before settings.js runs.
 * Publishes the setting ids and their defaults for settings.js.
 */

import layout from './layout.js';
import { renderLayout, settingIds, settingDefaults } from './render.js';
import { renderUserScripts } from './user-scripts.js';
import { renderSiteAccess } from './site-access.js';

document.getElementById('search-container').insertAdjacentHTML('beforebegin', renderLayout(layout));

window.SETTINGS_LAYOUT = layout;
window.SETTINGS_IDS = settingIds(layout);
window.SETTINGS_DEFAULTS = settingDefaults(layout);

// The viewer's scripts come from storage; settings.js waits for them before loading values
window.SETTINGS_EXTRA = renderUserScripts({ ids: window.SETTINGS_IDS, defaults: window.SETTINGS_DEFAULTS })
    .catch(error => console.error("User Scripts:", error));

// Site Access (Networking): the button that grants the optional host permissions
renderSiteAccess().catch(error => console.error("Site Access:", error));
