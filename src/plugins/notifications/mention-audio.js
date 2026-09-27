/*** /plugins/notifications/mention-audio.js
 * Mention Audio.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'mention_audio',

    async install({ StopWatch }) {
        Handlers.mention_audio = () => {
            new StopWatch('mention_audio');

            // Play sound on new message
            NOTIFICATION_EVENTS.onmention ??= Chat.onmessage = ({ mentions }) => {
                if(mentions.contains(USERNAME) && !NOTIFICATION_SOUND?.playing)
                    NOTIFICATION_SOUND?.play();
            };

            StopWatch.stop('mention_audio');
        };
        Timers.mention_audio = -1000;

        Unhandlers.mention_audio = () => {
            NOTIFICATION_SOUND?.pause();
        };

        __NotificationSounds_Mentions__:
        if(parseBool(Settings.mention_audio)) {
            RegisterJob('mention_audio');
        }
    },
});
