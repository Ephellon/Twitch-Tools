/*** /plugins/automation/auto-join.js
 * Auto-Join: accept mature-content and "classification" gates and join watch parties automatically.
 */

import { plugin } from '../../lib/plugins.js';

// Set once the user deliberately clicks the channel's name, so the home view is left alone
let IGNORE_ZOOM_STATE = false;

plugin({
    id: 'auto_accept_mature',
    timer: 5000,

    /**
     * Automatically clicks buttons to bypass mature content, class, or watchparty overlays.
     */
    handler() {
        $([
            '[data-a-target*="mature"i]:is([data-a-target*="overlay"i], [data-a-target*="accept"i]) button',
            '[data-a-target*="class"i]:is([data-a-target*="overlay"i], [data-a-target*="accept"i]) button',
            '[data-a-target*="watchparty"i] button',
            (IGNORE_ZOOM_STATE ? '' : '.home:not([user-intended="true"i]) [data-a-target^="home"i]')
        ].filter(s => s.length).join(','))?.click();
    },

    /**
     * Setup: Sets up listeners to mark home page visits as user-intended when clicking channel links.
     */
    setup() {
        $.all(`[class*="info"i] [href$="${ STREAMER.name }"i] [class*="title"i], main [href$="${ STREAMER.name }"i]`).map(element => {
            element.closest('div[class]').addEventListener('mousedown', async({ isTrusted, button = -1 }) => {
                !button && (await when.defined(() => $('.home')))?.setAttribute?.('user-intended', IGNORE_ZOOM_STATE = isTrusted);
            });
        });
    },
});
