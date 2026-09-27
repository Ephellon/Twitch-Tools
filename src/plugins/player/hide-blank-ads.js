/*** /plugins/player/hide-blank-ads.js
 * Hide Blank Ads.
 * Moved verbatim from player.js (Player__Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'player.hide_blank_ads',

    async install() {
        let BLANK_AD_PRESENCE = false;

        Handlers.hide_blank_ads = () => {
            if($.defined('[data-a-target*="ad-countdown"i]'))
                return window.postMessage({ action: 'report-blank-ad', from: 'player.js', purple: true }, '*');

            let video = $('video');

            if(nullish(video))
                return;

            let capture = video.captureFrame(),
                banner = Runtime.getURL('twitch-banner.png');

            resemble(capture)
                .compareTo(banner)
                .ignoreColors()
                .scaleToSameSize()
                .onComplete(async data => {
                    let { analysisTime, misMatchPercentage } = data;

                    analysisTime = parseInt(analysisTime);
                    misMatchPercentage = parseFloat(misMatchPercentage);

                    let matchPercentage = 100 - misMatchPercentage,
                        isBlankAd = matchPercentage > 80;

                    if(BLANK_AD_PRESENCE == isBlankAd)
                        return;
                    BLANK_AD_PRESENCE = isBlankAd;

                    // $warn(`The Purple banner of death!`, { isBlankAd, matchPercentage, analysisTime });

                    window.postMessage({ action: 'report-blank-ad', from: 'player.js', purple: isBlankAd }, '*');
                });
        };
        Timers.hide_blank_ads = 500;

        __Hide_Blank_Ads__:
        if(parseBool(Settings.hide_blank_ads)) {
            RegisterJob('hide_blank_ads');
        }
    },
});
