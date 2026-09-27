/*** /plugins/notifications/phrase-audio.js
 * Phrase Audio.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'phrase_audio',
    timer: 1000,

    /**
     * Plays a notification sound when a message matching a highlighted phrase is detected.
     * @param {Object} context - The plugin context
     */
    handler: ({ StopWatch }) => {
        new StopWatch('phrase_audio');

        // Play sound on new message
        NOTIFICATION_EVENTS.onphrase ??= Chat.onmessage = line => {
            when(line => (defined(line.element) ? line : false), 1000, line).then(element => {
                if(element.hasAttribute('tt-light') && !NOTIFICATION_SOUND?.playing)
                    NOTIFICATION_SOUND?.play();
            });
        };

        StopWatch.stop('phrase_audio');
    },

    /**
     * Undoes phrase audio by pausing the notification sound.
     */
    unhandler: () => {
        NOTIFICATION_SOUND?.pause();
    },
});
