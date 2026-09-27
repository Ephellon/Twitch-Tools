/*** /plugins/video-recovery/recover-stream.js
 * Recover Stream.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'recover_stream',

    async install({ StopWatch }) {
        let VIDEO_PLAYER_TIMEOUT = -1;

        Handlers.recover_stream = (video = $('video')) => {
            new StopWatch('recover_stream');

            if(nullish(video))
                return StopWatch.stop('recover_stream');

            let { paused } = video,
                isTrusted = $.defined('button[data-a-player-state="paused"i]'),
                isAdvert = $.defined('[data-a-target*="ad-countdown"i]');

            // Leave the video alone
                // if the video isn't paused
                // if the video was paused by the user (trusted)
                // if the video is an ad AND auto-play ads is disabled
                // if the player event-timeout has been set
            if(!paused || isTrusted || (isAdvert && !parseBool(Settings.recover_ads)) || VIDEO_PLAYER_TIMEOUT > -1)
                return StopWatch.stop('recover_stream');

            // Wait before trying to press play again
            VIDEO_PLAYER_TIMEOUT = setTimeout(() => VIDEO_PLAYER_TIMEOUT = -1, 1000);

            __RecoverVideoProgramatically__:
            try {
                let playing = video.play();

                if(defined(playing))
                    playing.catch($error);
            } catch(error) {
                $error(error);

                let control = $('button[data-a-player-state]'),
                    playing = control.dataset?.aPlayerState?.equals('playing'),
                    attempts = control.dataset?.recoveryAttempts | 0;

                if(nullish(control)) {
                    $warn("No video controls presented.");

                    break __RecoverVideoProgramatically__;
                } if(attempts > 3) {
                    $warn("Automatic attempts are not helping.");

                    break __RecoverVideoProgramatically__;
                }

                if(!playing) {
                    // PAUSED → PLAY
                    control.click();
                } else if(playing) {
                    // PLAYING → PAUSE, PLAY
                    control.click();
                    wait(250).then(() => control.click());
                }

                control.dataset.recoveryAttempts = ++attempts;

                wait(5000).then(() => {
                    let control = $('button[data-a-player-state]'),
                        attempts = control.dataset?.recoveryAttempts | 0;

                    control.dataset.recoveryAttempts = --attempts;
                });
            }

            StopWatch.stop('recover_stream');
        };
        Timers.recover_stream = 2_500;

        __RecoverStream__:
        if(parseBool(Settings.recover_stream)) {
            let video = $('video');

            if(nullish(video))
                break __RecoverStream__;

            video.addEventListener('pause', event => Handlers.recover_stream(event.currentTarget));

            RegisterJob('recover_stream');
        }
    },
});
