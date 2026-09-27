/*** /plugins/notifications/phrase-audio.js
 * Phrase Audio.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'phrase_audio',
    timer: 1000,

    handler: ({ StopWatch }) => {
        new StopWatch('phrase_audio');

        // Play sound on new message
        NOTIFICATION_EVENTS.onphrase ??= Chat.onmessage = line => {
            when(line => (defined(line.element)? line: false), 1000, line).then(element => {
                if(element.hasAttribute('tt-light') && !NOTIFICATION_SOUND?.playing)
                    NOTIFICATION_SOUND?.play();
            });
        };

        StopWatch.stop('phrase_audio');
    },

    unhandler: () => {
        NOTIFICATION_SOUND?.pause();
    },
});
