/*** /plugins/player/recover-video.js
 * Recover Video.
 * Moved from player.js (Player__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let RECOVERING_VIDEO;

plugin({
    id: 'player.recover_video',
    job: 'recover_video',
    timer: 5000,

    init() {
        RECOVERING_VIDEO = false;
    },

    handler: async({ StopWatch }) => {
        new StopWatch('recover_video');

        let errorMessage = $('[data-a-target*="player"i]:is([data-a-target*="content"i], [data-a-target*="gate"i]) [data-a-target*="text"i]');

        if(nullish(errorMessage))
            return StopWatch.stop('recover_video');

        if(RECOVERING_VIDEO)
            return StopWatch.stop('recover_video');
        RECOVERING_VIDEO = true;

        $error('The stream ran into an error:', errorMessage.textContent, new Date);

        if(/\b(subscribe|mature)\b/i.test(errorMessage.textContent)) {
            let next = await window.GetNextStreamer?.();

            // Subscriber only, etc.
            if(defined(next))
                goto(parseURL(next.href).addSearch({ tool: 'video-recovery--non-subscriber' }).href);
        } else {
            ($('button', errorMessage) ?? errorMessage.closest('button'))?.click();

            // Failed to play video at...
            addToSearch({ 'tt-err-vid': 'video-recovery--player-error' });

            RECOVERING_VIDEO = false;
        }

        StopWatch.stop('recover_video');
    },
});
