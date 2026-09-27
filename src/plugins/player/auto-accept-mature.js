/*** /plugins/player/auto-accept-mature.js
 * Auto-Join.
 * Moved from player.js (Player__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'player.auto_accept_mature',
    job: 'auto_accept_mature',
    timer: -1_000,

    handler: () => {
        $.all(':is([data-a-target*="overlay"i], [data-a-target*="watchparty"i]) button, .home [data-a-target^="home"i], [data-test-selector*="mute"i][data-test-selector*="dismiss"i]')
            .map(button => button.click());
    },
});
