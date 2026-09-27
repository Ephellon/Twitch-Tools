/*** /plugins/player/miscellaneous.js
 * Miscellaneous.
 * Moved verbatim from player.js (Player__Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'player.miscellaneous',

    async install() {
        Miscellaneous: {
            __UnmuteEmbed__: {
                let { channel, controls, muted, parent, quality } = parseURL(window.location).searchParameters;

                controls = parseBool(controls);
                muted = parseBool(muted);

                if(!controls && !muted)
                    $('figure[tt-svg-label~="unmute"i]')?.click();

                // Embeds asked to be muted (e.g. the Up Next preview) can start with sound before the player
                // applies `muted=true` (#49); keep the video muted until the viewer uses the player themselves
                if(muted) {
                    let viewerTouched = false;
                    const silence = video => {
                        video.muted = true;
                        video.addEventListener('volumechange', () => viewerTouched || (video.muted = true));
                    };

                    $.on('pointerdown', ({ isTrusted }) => viewerTouched ||= isTrusted);
                    $.on('keydown', ({ isTrusted }) => viewerTouched ||= isTrusted);
                    when.defined(() => $('video')).then(silence);
                }
            }

            __PopinButton__: {
                // `private` is reserved in modules, so the parameter is read as `isPrivate`
                let { channel, controls, muted, parent, quality, private: isPrivate = false } = parseURL(window.location).searchParameters;

                controls = parseBool(controls);
                muted = parseBool(muted);
                isPrivate = parseBool(isPrivate);

                if(isPrivate) {
                    $('[data-test-selector*="video-player"i][data-test-selector*="container"]').append(
                        furnish('a#player-to-top', {
                            href: `//www.twitch.tv/${ channel }`,
                            target: '_top',
                            style: `z-index:9;position:absolute;bottom:-100%;left:50%;transform:translate(-50%);text-shadow:0 0 4px #8888;transition:all 0.5s;background-color:var(--color-background-button-primary-default);padding:.25rem .5rem;border-radius:3px;color:white;text-decoration:none;`,

                            innerHTML: `&swarr; Go to ${ channel }`,
                        })
                    );

                    AddCustomCSSBlock('player-to-top', `[data-test-selector*="video-player"i][data-test-selector*="container"]:hover #player-to-top{bottom:0!important} #player-to-top:hover{background-color:var(--color-background-button-primary-hover)!important}`);
                }
            }
        }

        // End of Player__Initialize
    },
});
