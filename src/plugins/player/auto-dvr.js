/*** /plugins/player/auto-dvr.js
 * Video Clips.
 * Moved verbatim from player.js (Player__Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'player.auto_dvr',

    async install() {
        Handlers.auto_dvr = () => {
            let { action = '', channel, autosave, controls, filetype, quality, slug, volume } = parseURL(window.location).searchParameters;

            if(action.unlike('dvr'))
                return;

            let video = $('video');
            let live = $.nullish('[class*="channel-status"i][class*="offline"i]');

            if(nullish(video) || !live)
                return (
                    parseBool(autosave)?
                        video?.stopRecording():
                    null
                );

            if(defined(video.__recorder__))
                return;

            video.startRecording(Infinity, { mimeType: `video/${ filetype }` })
                .then(chunks => {
                    let blob = new Blob(chunks, { type: chunks.type });
                    let link = furnish(`a#${ slug }`, { href: URL.createObjectURL(blob), download: `${ slug }.${ window.MIME_Types.find(video.mimeType) }`, hidden: true }, slug);

                    $.head.append(link);
                    link.click();
                })
                .catch($warn)
                .finally(() => {
                    let link = $(`#${ slug }`);

                    // Free up the memory
                    URL.revokeObjectURL(link?.href);
                    link?.remove();

                    window.postMessage({ action: 'report-offline-dvr', from: 'player.js', slug }, '*');
                });
        };
        Timers.auto_dvr = 500;

        __Auto_DVR__:
        if(true || parseBool(Settings?.auto_dvr)) {
            RegisterJob('auto_dvr');
        }
    },
});
