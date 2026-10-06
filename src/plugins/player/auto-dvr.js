/*** /plugins/player/auto-dvr.js
 * Video Clips.
 * Moved from player.js (Player__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'player.auto_dvr',
    job: 'auto_dvr',
    timer: 500,

    /**
     * Runs every tick: Automatically records a live stream if requested via URL and downloads the recording once the stream ends.
     */
    handler: () => {
        const { action = '', channel, autosave, controls, filetype, quality, slug, volume } = parseURL(window.location).searchParameters;

        if(action.unlike('dvr'))
            return;

        const video = $('video');
        const live = $.nullish('[class*="channel-status"i][class*="offline"i]');
        const recording = Recording.find('PLAYER_DVR');

        // Offline (or gone): stop; the recording saves itself below
        if(nullish(video) || !live)
            return void (parseBool(autosave) && recording?.stop());

        if(recording?.active)
            return;

        // Before the rewrite, `__recorder__` was never set: a new recorder started on every tick
        Recording.proxy(video, { name: 'PLAYER_DVR', as: slug, mimeType: `video/${ filetype }` })
            .done
            .then(({ target }) => target.save(slug))
            .catch($warn)
            .finally(() => window.postMessage({ action: 'report-offline-dvr', from: 'player.js', slug }, '*'));
    },

    /**
     * Determines if the auto-DVR feature should be enabled based on settings.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
        return true || parseBool(Settings?.auto_dvr);
    },
});
