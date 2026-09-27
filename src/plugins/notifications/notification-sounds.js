/*** /plugins/notifications/notification-sounds.js
 * Notification Sounds.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'notification_sounds',

    /**
     * Sets up the global notification state and creates the audio element for notification sounds.
     */
    async install() {
        NOTIFIED = { mention: 0, phrase: 0, whisper: 0 };
        NOTIFICATION_EVENTS = {};
        NOTIFICATION_SOUND = (null
            ?? $('audio#tt-notification-sound')
            ?? furnish('audio#tt-notification-sound', {
                style: 'display:none',

                innerHTML: [
                    // 'mp3',
                    'ogg',
                ]
                    .map(type => {
                        const types = { mp3: 'mpeg' }
                            , src = Runtime.getURL(`aud/${ Settings.whisper_audio_sound ?? 'goes-without-saying-608' }.${ type }`);

                        type = `audio/${ types[type] ?? type }`;

                        return furnish('source', { src, type }).outerHTML;
                    }).join('')
            })
        );
    },
});
