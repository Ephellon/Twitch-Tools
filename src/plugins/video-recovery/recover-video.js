/*** /plugins/video-recovery/recover-video.js
 * Recover Video.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'recover_video',

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

            let latin = top.location.pathname.slice(1).split('/').shift();
            let native = $(`a[href$="${ latin }"i] [class*="title"]`)?.textContent ?? latin;

            if(errorMessage.closest('[class*="content"i]:is([role], [data-a-target])')?.textContent?.includes(native)) {
                let next = await GetNextStreamer(latin);

                // Subscriber only, etc.
                if(defined(next))
                    goto(parseURL(next.href).addSearch({ tool: 'video-recovery--non-subscriber' }).href);
            } else {
                ($('button', errorMessage) ?? errorMessage.closest('button'))?.click();

                // Failed to play video at...
                addReport({ 'TTV-Tools-failed-to-recover-video': (errorMessage?.textContent ?? 'Unknown error') });

                RECOVERING_VIDEO = false;
            }

            StopWatch.stop('recover_video');
        };
        Timers.recover_video = 10_000;

        __RecoverVideo__:
        if(parseBool(Settings.recover_video)) {
            RegisterJob('recover_video');
        }
    },
});
