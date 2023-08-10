/*** /player.js - Meant for features that can run on player (stream preview) pages
 *      _____  _                       _
 *     |  __ \| |                     (_)
 *     | |__) | | __ _ _   _  ___ _ __ _ ___
 *     |  ___/| |/ _` | | | |/ _ \ '__| / __|
 *     | |    | | (_| | |_| |  __/ |_ | \__ \
 *     |_|    |_|\__,_|\__, |\___|_(_)| |___/
 *                      __/ |        _/ |
 *                     |___/        |__/
 */
let here = parseURL(location);

let {
    USERNAME,
    LANGUAGE,
    THEME,

    PATHNAME = here.pathname,
    STREAMER = ({
        get href() { return `https://www.twitch.tv/${ STREAMER.name }` },
        get name() { return here.searchParameters.channel },
        get live() { return !$.all('[href*="offline_embed"i]').length },
    }),

    GLOBAL_EVENT_LISTENERS,
} = window;

/** Adds a CSS block to the CUSTOM_CSS string
 * AddCustomCSSBlock_Player(name:string, block:string) → undefined
 */
function AddCustomCSSBlock_Player(name, block) {
    name = name.trim();

    let regexp = RegExp(`(\\/\\*(${ name })\\*\\/(?:[^]+?)\\/\\*#\\2\\*\\/|$)`);

    let newHTML = ((Player__CUSTOM_CSS.innerHTML || '').replace(regexp, `/*${ name }*/${ block }/*#${ name }*/`));

    if(Player__CUSTOM_CSS.innerHTML.equals(newHTML))
        return;

    Player__CUSTOM_CSS.innerHTML = newHTML;
    Player__CUSTOM_CSS.remove();

    // Force styling update
    $('body').append(Player__CUSTOM_CSS);
}

/** Removes a CSS block from the Player__CUSTOM_CSS string
 * RemoveCustomCSSBlock_Player(name:string, flags:string?) → undefined
 */
function RemoveCustomCSSBlock_Player(name, flags = '') {
    name = name.trim();

    let regexp = RegExp(`\\/\\*(${ name })\\*\\/(?:[^]+?)\\/\\*#\\1\\*\\/`, flags);

    let newHTML = ((Player__CUSTOM_CSS.innerHTML || '').replace(regexp, ''));

    if(Player__CUSTOM_CSS.innerHTML.equals(newHTML))
        return;

    Player__CUSTOM_CSS.innerHTML = newHTML;
    Player__CUSTOM_CSS.remove();

    // Force styling update
    $('body').append(Player__CUSTOM_CSS);
}

let Player__Initialize = async(START_OVER = false) => {
    // Time how long jobs take to complete properly
    class StopWatch {
        static #WATCHES = new Map;

        constructor(name, interval) {
            interval ??= Timers[name];

            StopWatch.#WATCHES.set(name, this);

            return Object.assign(this, {
                name, interval,

                start: new Date,
                stop: null,
                span: null,
                max: Math.abs(interval + new Date) * 1.1,
            });
        }

        static stop(name) {
            StopWatch.#WATCHES.get(name)?.time();
        }

        time() {
            let stop = this.stop = new Date;
            let span = this.span = Math.abs(this.start - stop);
            let { max, name } = this;

            if(span > max)
                WARN(`"${ name.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['',' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, '- ') }" took ${ (span / 1000).suffix('s', 2).replace(/\.0+/, '') } to complete (max time allowed is ${ (max / 1000).suffix('s', 2).replace(/\.0+/, '') }). Offense time: ${ new Date }. Offending site: ${ location.pathname }`)
                    ?.toNativeStack?.();
        }
    }

    /*** Automation
     *                    _                        _   _
     *         /\        | |                      | | (_)
     *        /  \  _   _| |_ ___  _ __ ___   __ _| |_ _  ___  _ __
     *       / /\ \| | | | __/ _ \| '_ ` _ \ / _` | __| |/ _ \| '_ \
     *      / ____ \ |_| | || (_) | | | | | | (_| | |_| | (_) | | | |
     *     /_/    \_\__,_|\__\___/|_| |_| |_|\__,_|\__|_|\___/|_| |_|
     *
     *
     */
    /*** Auto-Join
     *                    _                  _       _
     *         /\        | |                | |     (_)
     *        /  \  _   _| |_ ___ ______    | | ___  _ _ __
     *       / /\ \| | | | __/ _ \______|   | |/ _ \| | '_ \
     *      / ____ \ |_| | || (_) |    | |__| | (_) | | | | |
     *     /_/    \_\__,_|\__\___/      \____/ \___/|_|_| |_|
     *
     *
     */
    Handlers.auto_accept_mature = () => {
        $.all(':is([data-a-target*="overlay"i], [data-a-target*="watchparty"i]) button, .home [data-a-target^="home"i], [data-test-selector*="mute"i][data-test-selector*="dismiss"i]')
            .map(button => button.click());
    };
    Timers.auto_accept_mature = -1_000;

    __AutoMatureAccept__:
    if(parseBool(Settings.auto_accept_mature)) {
        RegisterJob('auto_accept_mature');
    }

    /*** Customization
     *       _____          _                  _          _   _
     *      / ____|        | |                (_)        | | (_)
     *     | |    _   _ ___| |_ ___  _ __ ___  _ ______ _| |_ _  ___  _ __
     *     | |   | | | / __| __/ _ \| '_ ` _ \| |_  / _` | __| |/ _ \| '_ \
     *     | |___| |_| \__ \ || (_) | | | | | | |/ / (_| | |_| | (_) | | | |
     *      \_____\__,_|___/\__\___/|_| |_| |_|_/___\__,_|\__|_|\___/|_| |_|
     *
     *
     */
    /*** Hide Blank Ads
     *      _    _ _     _        ____  _             _                  _
     *     | |  | (_)   | |      |  _ \| |           | |        /\      | |
     *     | |__| |_  __| | ___  | |_) | | __ _ _ __ | | __    /  \   __| |___
     *     |  __  | |/ _` |/ _ \ |  _ <| |/ _` | '_ \| |/ /   / /\ \ / _` / __|
     *     | |  | | | (_| |  __/ | |_) | | (_| | | | |   <   / ____ \ (_| \__ \
     *     |_|  |_|_|\__,_|\___| |____/|_|\__,_|_| |_|_|\_\ /_/    \_\__,_|___/
     *
     *
     */
    let BLANK_AD_PRESENCE = false;

    Handlers.hide_blank_ads = () => {
        if($.defined('[data-a-target*="ad-countdown"i]'))
            return window.postMessage({ action: 'report-blank-ad', from: 'player.js', purple: true }, '*');

        let capture = $('video').captureFrame(),
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

                // WARN(`The Purple banner of death!`, { isBlankAd, matchPercentage, analysisTime });

                window.postMessage({ action: 'report-blank-ad', from: 'player.js', purple: isBlankAd }, '*');
            });
    };
    Timers.hide_blank_ads = 500;

    __Hide_Blank_Ads__:
    if(parseBool(Settings.hide_blank_ads)) {
        RegisterJob('hide_blank_ads');
    }

    /*** Networking
     *      _   _      _                      _    _
     *     | \ | |    | |                    | |  (_)
     *     |  \| | ___| |___      _____  _ __| | ___ _ __   __ _
     *     | . ` |/ _ \ __\ \ /\ / / _ \| '__| |/ / | '_ \ / _` |
     *     | |\  |  __/ |_ \ V  V / (_) | |  |   <| | | | | (_| |
     *     |_| \_|\___|\__| \_/\_/ \___/|_|  |_|\_\_|_| |_|\__, |
     *                                                      __/ |
     *                                                     |___/
     */
    /*** Video Clips
     *     __      ___     _               _____ _ _
     *     \ \    / (_)   | |             / ____| (_)
     *      \ \  / / _  __| | ___  ___   | |    | |_ _ __  ___
     *       \ \/ / | |/ _` |/ _ \/ _ \  | |    | | | '_ \/ __|
     *        \  /  | | (_| |  __/ (_) | | |____| | | |_) \__ \
     *         \/   |_|\__,_|\___|\___/   \_____|_|_| .__/|___/
     *                                              | |
     *                                              |_|
     */
    Handlers.auto_dvr = () => {
        let { action = '', channel, autosave, controls, filetype, quality, slug, volume } = parseURL(location).searchParameters;

        if(action.unlike('dvr'))
            return;

        let video = $('video');
        let live = $.nullish('[class*="channel-status"i][class*="offline"i]');

        if(nullish(video) || !live)
            return (
                parseBool(autosave)?
                    video.stopRecording():
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
            .catch(WARN)
            .finally(() => {
                let link = $(`#${ slug }`);

                // Free up the memory
                URL.revokeObjectURL(link?.href);
                link?.remove();

                window.postMessage({ action: 'report-offline-dvr', from: 'player.js', slug }, '*');
            });
    };
    Timers.auto_dvr = 500;

    __Hide_Blank_Ads__:
    if(true || parseBool(Settings?.auto_dvr)) {
        RegisterJob('auto_dvr');
    }

    /*** Miscellaneous
     *      __  __ _              _ _
     *     |  \/  (_)            | | |
     *     | \  / |_ ___  ___ ___| | | __ _ _ __   ___  ___  _   _ ___
     *     | |\/| | / __|/ __/ _ \ | |/ _` | '_ \ / _ \/ _ \| | | / __|
     *     | |  | | \__ \ (_|  __/ | | (_| | | | |  __/ (_) | |_| \__ \
     *     |_|  |_|_|___/\___\___|_|_|\__,_|_| |_|\___|\___/ \__,_|___/
     *
     *
     */
    Miscellaneous: {
        __UnmuteEmbed__: {
            let { channel, controls, muted, parent, quality } = parseURL(location).searchParameters;

            controls = parseBool(controls);
            muted = parseBool(muted);

            if(!controls && !muted)
                $('figure[tt-svg-label~="unmute"i]')?.click();
        }

        __PopinButton__: {
            let { channel, controls, muted, parent, quality, private = false } = parseURL(location).searchParameters

            controls = parseBool(controls);
            muted = parseBool(muted);
            private = parseBool(private);

            if(private) {
                $('[data-test-selector*="video-player"i][data-test-selector*="container"]').append(
                    furnish('a#player-to-top', {
                        href: `//www.twitch.tv/${ channel }`,
                        target: '_top',
                        style: `z-index:9;position:absolute;bottom:-100%;left:50%;transform:translate(-50%);text-shadow:0 0 4px #8888;transition:all 0.5s;background-color:var(--color-background-button-primary-default);padding:.25rem .5rem;border-radius:3px;color:white;text-decoration:none;`,

                        innerHTML: `&swarr; Go to ${ channel }`,
                    })
                );

                AddCustomCSSBlock_Player('player-to-top', `[data-test-selector*="video-player"i][data-test-selector*="container"]:hover #player-to-top{bottom:0!important} #player-to-top:hover{background-color:var(--color-background-button-primary-hover)!important}`);
            }
        }
    }

    // End of Player__Initialize
};
// End of Player__Initialize

let Player__Initialize_Safe_Mode = async(START_OVER = false) => {
    /*** Miscellaneous
     *      __  __ _              _ _
     *     |  \/  (_)            | | |
     *     | \  / |_ ___  ___ ___| | | __ _ _ __   ___  ___  _   _ ___
     *     | |\/| | / __|/ __/ _ \ | |/ _` | '_ \ / _ \/ _ \| | | / __|
     *     | |  | | \__ \ (_|  __/ | | (_| | | | |  __/ (_) | |_| \__ \
     *     |_|  |_|_|___/\___\___|_|_|\__,_|_| |_|\___|\___/ \__,_|___/
     *
     *
     */
    Miscellaneous: {
        // ...
    }

    // End of Player__Initialize_Safe_Mode
};
// End of Player__Initialize_Safe_Mode

let Player__CUSTOM_CSS,
    Player__PAGE_CHECKER,
    Player__WAIT_FOR_PAGE,
    Player__SETTING_RELOADER;

Player__PAGE_CHECKER = setInterval(Player__WAIT_FOR_PAGE = async() => {
    // Only executes if the user is banned
    let banned = STREAMER?.veto || !!$.all('[class*="banned"i]').length;

    if([banned].contains(true)) {
        WARN('[NON_FATAL] Framed container unavailable. Reason:', { banned });

        await Settings.get();

        wait(5000).then(Player__Initialize_Safe_Mode);
        clearInterval(Player__PAGE_CHECKER);
    }

    // Only executes if the user is NOT banned
    let ready = (true /* Assume OK if this loads in the first place... */
        // The main controller is ready
        // && parseBool(top.MAIN_CONTROLLER_READY)

        // There is an error message
        || $.nullish('[data-test-selector^="content-overlay-gate"i]')
    );

    if(ready) {
        LOG(`Framed container ready → <iframe>@${ location.href }`);

        await Settings.get();

        wait(5000).then(Player__Initialize);
        clearInterval(Player__PAGE_CHECKER);

        window.FRAMED_CONTROLLER_READY = true;

        // Only re-execute if in an iframe
        if(top != window) {
            // Observe [top] location changes
            LocationObserver: {
                let { body } = document,
                    observer = new MutationObserver(mutations => {
                        mutations.map(mutation => {
                            if(PATHNAME !== location.pathname) {
                                let OLD_HREF = PATHNAME;

                                PATHNAME = location.pathname;

                                for(let [name, func] of (top?.__ONLOCATIONCHANGE__ ?? []))
                                    func(new CustomEvent('locationchange', { from: OLD_HREF, to: PATHNAME }));
                            }
                        });
                    });

                observer.observe(body, { childList: true, subtree: true });
            }
        }

        // Set the SVGs' section IDs
        SectionLabeling: {
            let conversions = {
                unmute: [
                            "unmute"
                        ].reverse(),
            },
                Glyphs = window.Glyphs;

            for(let container of $.all('figure')) {
                let svg = $('svg', container);

                if(nullish(svg))
                    continue;

                comparing:
                for(let glyph in Glyphs)
                    if(Glyphs.__exclusionList__.contains(glyph))
                        continue comparing;
                    else
                        resemble(svg.toImage())
                            .compareTo(Glyphs.modify(glyph, { height: 20, width: 20 }).asNode.toImage())
                            .ignoreColors()
                            .scaleToSameSize()
                            .onComplete(async data => {
                                let { analysisTime, misMatchPercentage } = data;

                                analysisTime = parseInt(analysisTime);
                                misMatchPercentage = parseFloat(misMatchPercentage);

                                let matchPercentage = 100 - misMatchPercentage;

                                if(matchPercentage < 80 || container.getAttribute('tt-svg-label')?.length)
                                    return;

                                // LOG(`Labeling section "${ glyph }" (${ matchPercentage }% match)...`, container);

                                container.setAttribute('tt-svg-label', conversions[glyph]?.pop());
                            });
            }
        }

        // Add custom styling
        CustomCSSInitializer: {
            Player__CUSTOM_CSS = $('#tt-custom-player-css') ?? furnish('style#tt-custom-player-css', {});

            Player__CUSTOM_CSS.innerHTML =
            `
            `;

            Player__CUSTOM_CSS?.remove();
            $('body').append(Player__CUSTOM_CSS);
        }

        // Update the settings
        SettingsInitializer: {
            switch(Settings.onInstalledReason) {
                // Is this the first time the extension has run?
                // If so, then point out what's been changed
                case INSTALL: {
                    // Alert something for the players...
                } break;
            }

            Storage.set({ onInstalledReason: null });
        }
    }
}, 500);

Player__SETTING_RELOADER = setInterval(() => {
    for(let MAX_CALLS = 60; MAX_CALLS > 0 && window.REFRESH_ON_CHILD?.length; --MAX_CALLS)
        RestartJob(window.REFRESH_ON_CHILD.pop());
}, 250);
