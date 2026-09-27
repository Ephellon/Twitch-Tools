/*** /plugins/chat/whisper-audio.js
 * Whisper Audio.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'whisper_audio',

    async install({ StopWatch }) {
        Handlers.whisper_audio = () => {
            new StopWatch('whisper_audio');

            // Play sound on new message
            NOTIFICATION_EVENTS.onwhisper ??= Chat.onwhisper = ({ unread, from, message }) => {
                if(!unread && !from && !message)
                    return;

                NOTIFICATION_SOUND?.play();
            };

            // Play message on pill-change
            let pill = $('.whispers__pill'),
                unread = parseInt(pill?.textContent) | 0;

            if(nullish(pill))
                return StopWatch.stop('whisper_audio'), NOTIFIED.whisper = 0;
            if(NOTIFIED.whisper >= unread)
                return StopWatch.stop('whisper_audio');
            NOTIFIED.whisper = unread;

            NOTIFICATION_SOUND?.play();

            StopWatch.stop('whisper_audio');
        };
        Timers.whisper_audio = 1000;

        Unhandlers.whisper_audio = () => {
            NOTIFICATION_SOUND?.pause();
        };

        __NotificationSounds_Whispers__:
        if(UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.whisper_audio)) {
            RegisterJob('whisper_audio');
        }
    },
});
