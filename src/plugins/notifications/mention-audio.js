/*** /plugins/notifications/mention-audio.js
 * Mention Audio.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'mention_audio',
    timer: -1000,

    /**
     * Plays a notification sound when the user is mentioned in a chat message.
     * @param {Object} context - The plugin context
     */
    handler: ({ StopWatch }) => {
        new StopWatch('mention_audio');

        // Play sound on new message
        NOTIFICATION_EVENTS.onmention ??= Chat.onmessage = ({ mentions }) => {
            if(mentions.contains(USERNAME) && !NOTIFICATION_SOUND?.playing)
                NOTIFICATION_SOUND?.play();
        };

        StopWatch.stop('mention_audio');
    },

    /**
     * Undoes mention audio by pausing the notification sound.
     */
    unhandler: () => {
        NOTIFICATION_SOUND?.pause();
    },
});
