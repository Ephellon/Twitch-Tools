/*** /plugins/player/auto-accept-mature.js
 * Auto-Join.
 * Moved verbatim from player.js (Player__Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'player.auto_accept_mature',

    async install() {
        Handlers.auto_accept_mature = () => {
            $.all(':is([data-a-target*="overlay"i], [data-a-target*="watchparty"i]) button, .home [data-a-target^="home"i], [data-test-selector*="mute"i][data-test-selector*="dismiss"i]')
                .map(button => button.click());
        };
        Timers.auto_accept_mature = -1_000;

        __AutoMatureAccept__:
        if(parseBool(Settings.auto_accept_mature)) {
            RegisterJob('auto_accept_mature');
        }
    },
});
