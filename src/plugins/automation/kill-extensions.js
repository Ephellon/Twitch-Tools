/*** /plugins/automation/kill-extensions.js
 * Kill Extensions: hide Twitch extension overlays and pop-overs on the player.
 */

import { plugin } from '../../lib/plugins.js';

const EXTENSION_VIEWS = '[class*="extension"i]:is([class*="view"i], [class*="popover"i])';

plugin({
    id: 'kill_extensions',
    timer: 2_500,
    settings: { kill_extensions: false },

    handler({ StopWatch }) {
        new StopWatch('kill_extensions');

        for(const view of $.all(EXTENSION_VIEWS))
            view.modStyle('display:none!important');

        StopWatch.stop('kill_extensions');
    },

    // Un-hide the same views the handler hid (it used to look for `[class^="extension-view"i]` only)
    unhandler() {
        for(const view of $.all(EXTENSION_VIEWS))
            view.removeAttribute('style');
    },

    setup() {
        $remark("Adding extension killer...");
    },
});
