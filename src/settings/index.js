/*** /settings/index.js
 * Builds the Settings page from the declared layout, before settings.js runs.
 * Publishes the setting ids and their defaults for settings.js.
 */

import layout from './layout.js';
import { renderLayout, settingIds, settingDefaults } from './render.js';

document.getElementById('search-container').insertAdjacentHTML('beforebegin', renderLayout(layout));

window.SETTINGS_LAYOUT = layout;
window.SETTINGS_IDS = settingIds(layout);
window.SETTINGS_DEFAULTS = settingDefaults(layout);
