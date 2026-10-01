/*** /plugins/notifications/whisper-audio.js
 * Whisper Audio.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'whisper_audio',
    timer: 1000,

    /**
     * Plays a notification sound for new whispers or changes in the unread whisper count.
     * @param {Object} context - The plugin context
     */
    handler: ({ StopWatch }) => {
        new StopWatch('whisper_audio');

        // Play sound on new message
        NOTIFICATION_EVENTS.onwhisper ??= Chat.onwhisper = ({ unread, from, message }) => {
            // Nothing to say, or the pill check already chimed for this one
            if((!unread && !from && !message) || Date.now() - (NOTIFIED.whisperSoundAt ?? 0) < 10_000)
                return;

            NOTIFIED.whisperSoundAt = Date.now();
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

        // The whisper relay already chimed for this one
        if(Date.now() - (NOTIFIED.whisperSoundAt ?? 0) < 10_000)
            return StopWatch.stop('whisper_audio');

        NOTIFIED.whisperSoundAt = Date.now();
        NOTIFICATION_SOUND?.play();

        StopWatch.stop('whisper_audio');
    },

    /**
     * Undoes whisper audio by pausing the notification sound.
     */
    unhandler: () => {
        NOTIFICATION_SOUND?.pause();
    },

    /**
     * Checks if whisper audio notifications are enabled and permitted in the current tab.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
        return UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.whisper_audio);
    },
});
