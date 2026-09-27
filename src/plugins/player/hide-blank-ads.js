/*** /plugins/player/hide-blank-ads.js
 * Hide Blank Ads.
 * Moved from player.js (Player__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let BLANK_AD_PRESENCE;

plugin({
    id: 'player.hide_blank_ads',
    job: 'hide_blank_ads',
    timer: 500,

    init() {
        BLANK_AD_PRESENCE = false;
    },

    handler: () => {
        if($.defined('[data-a-target*="ad-countdown"i]'))
            return window.postMessage({ action: 'report-blank-ad', from: 'player.js', purple: true }, '*');

        const video = $('video');

        if(nullish(video))
            return;

        const capture = video.captureFrame()
            , banner = Runtime.getURL('twitch-banner.png');

        resemble(capture)
            .compareTo(banner)
            .ignoreColors()
            .scaleToSameSize()
            .onComplete(async data => {
                let { analysisTime, misMatchPercentage } = data;

                analysisTime = parseInt(analysisTime);
                misMatchPercentage = parseFloat(misMatchPercentage);

                const matchPercentage = 100 - misMatchPercentage
                    , isBlankAd = matchPercentage > 80;

                if(BLANK_AD_PRESENCE == isBlankAd)
                    return;
                BLANK_AD_PRESENCE = isBlankAd;

                // $warn(`The Purple banner of death!`, { isBlankAd, matchPercentage, analysisTime });

                window.postMessage({ action: 'report-blank-ad', from: 'player.js', purple: isBlankAd }, '*');
            });
    },
});
