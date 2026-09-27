/*** /plugins/notifications/whisper-audio.js
 * Whisper Audio.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'whisper_audio',
    timer: 1000,

    handler: ({ StopWatch }) => {
        new StopWatch('whisper_audio');

        // Play sound on new message
        NOTIFICATION_EVENTS.onwhisper ??= Chat.onwhisper = ({ unread, from, message }) => {
            if(!unread && !from && !message)
                return;

            NOTIFICATION_SOUND?.play();
        };

        // Play message on pill-change
        const pill = $('.whispers__pill')
            , unread = parseInt(pill?.textContent) | 0;

        if(nullish(pill))
            return StopWatch.stop('whisper_audio'), NOTIFIED.whisper = 0;
        if(NOTIFIED.whisper >= unread)
            return StopWatch.stop('whisper_audio');
        NOTIFIED.whisper = unread;

        NOTIFICATION_SOUND?.play();

        StopWatch.stop('whisper_audio');
    },

    unhandler: () => {
        NOTIFICATION_SOUND?.pause();
    },

    enabled() {
        return UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.whisper_audio);
    },
});
