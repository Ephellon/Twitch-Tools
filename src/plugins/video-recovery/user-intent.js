/*** /plugins/video-recovery/user-intent.js
 * User Intent Listener - NOT A SETTING. Observe the user's intent, and prevent over-riding it.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'user_intent',

    async install() {
        wait(1000).then(() => {
            $.all('[data-a-target="followed-channel"i], [id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] [href^="/"], [data-test-selector*="search-result"i][data-test-selector*="channel"i] a:not([href*="/search?"])').map(a => {
                a.addEventListener('mouseup', async event => {
                    const { currentTarget, button = -1 } = event;

                    if(button)
                        return /* Not the primary button */;

                    const url = parseURL(currentTarget.href)
                        , UserIntent = url.pathname.replace('/', '');

                    Cache.save({ UserIntent });
                });
            });
        });
    },
});
