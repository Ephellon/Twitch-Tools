/*** /plugins/automation/view-mode.js
 * View Mode: switch the player to the preferred view mode (default, theatre, or full width) on load.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'view_mode',
    timer: -2_500,
    settings: { view_mode: null },

    handler(context, mode = Settings.view_mode) {
        SetViewMode(mode);
    },
});
