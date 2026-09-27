/*** /plugins/player/recover-video.js
 * Recover Video.
 * Moved verbatim from player.js (Player__Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'player.recover_video',

    async install({ StopWatch }) {
        let RECOVERING_VIDEO = false;

        Handlers.recover_video = async() => {
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
        };
        Timers.recover_video = 5000;

        __RecoverVideo__:
        if(parseBool(Settings.recover_video)) {
            RegisterJob('recover_video');
        }
    },
});
