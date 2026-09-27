/*** /plugins/player/auto-dvr.js
 * Video Clips.
 * Moved from player.js (Player__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'player.auto_dvr',
    job: 'auto_dvr',
    timer: 500,

    handler: () => {
        const { action = '', channel, autosave, controls, filetype, quality, slug, volume } = parseURL(window.location).searchParameters;

        if(action.unlike('dvr'))
            return;

        const video = $('video');
        const live = $.nullish('[class*="channel-status"i][class*="offline"i]');

        if(nullish(video) || !live)
            return (
                parseBool(autosave)
                    ? video?.stopRecording()
                    : null
            );

        if(defined(video.__recorder__))
            return;

        video.startRecording(Infinity, { mimeType: `video/${ filetype }` })
            .then(chunks => {
                const blob = new Blob(chunks, { type: chunks.type });
                const link = furnish(`a#${ slug }`, { href: URL.createObjectURL(blob), download: `${ slug }.${ window.MIME_Types.find(video.mimeType) }`, hidden: true }, slug);

                $.head.append(link);
                link.click();
            })
            .catch($warn)
            .finally(() => {
                const link = $(`#${ slug }`);

                // Free up the memory
                URL.revokeObjectURL(link?.href);
                link?.remove();

                window.postMessage({ action: 'report-offline-dvr', from: 'player.js', slug }, '*');
            });
    },

    enabled() {
        return true || parseBool(Settings?.auto_dvr);
    },
});
