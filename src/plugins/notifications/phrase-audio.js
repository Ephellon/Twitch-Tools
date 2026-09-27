/*** /plugins/notifications/phrase-audio.js
 * Phrase Audio.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'phrase_audio',

    async install({ StopWatch }) {
        Handlers.phrase_audio = () => {
            new StopWatch('phrase_audio');

            // Play sound on new message
            NOTIFICATION_EVENTS.onphrase ??= Chat.onmessage = line => {
                when(line => (defined(line.element)? line: false), 1000, line).then(element => {
                    if(element.hasAttribute('tt-light') && !NOTIFICATION_SOUND?.playing)
                        NOTIFICATION_SOUND?.play();
                });
            };

            StopWatch.stop('phrase_audio');
        };
        Timers.phrase_audio = 1000;

        Unhandlers.phrase_audio = () => {
            NOTIFICATION_SOUND?.pause();
        };

        __NotificationSounds_Phrases__:
        if(parseBool(Settings.phrase_audio)) {
            RegisterJob('phrase_audio');
        }
    },
});
