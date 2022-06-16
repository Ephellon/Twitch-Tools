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
let here = parseURL(window.location);

let {
    USERNAME,
    LANGUAGE,
    THEME,

    PATHNAME = here.pathname,
    STREAMER = ({
        get href() { return `https://www.twitch.tv/${ STREAMER.name }` },
        get name() { return here.searchParameters.channel },
        get live() { return !$('[href*="offline_embed"i]', true).length },
    }),

    GLOBAL_EVENT_LISTENERS,
} = top;

function AddCustomCSSBlock(name, block) {
    Player__CUSTOM_CSS.innerHTML += `/*${ name }*/${ block }/*#${ name }*/`;

    Player__CUSTOM_CSS?.remove();
    $('body').append(Player__CUSTOM_CSS);
}

function RemoveCustomCSSBlock(name, flags = '') {
    let regexp = RegExp(`\\/\\*(${ name })\\*\\/(?:[^]+?)\\/\\*#\\1\\*\\/`, flags);

    Player__CUSTOM_CSS.innerHTML = Player__CUSTOM_CSS.innerHTML.replace(regexp, '');

    Player__CUSTOM_CSS?.remove();
    $('body').append(Player__CUSTOM_CSS);
}

let Player__Initialize = async(START_OVER = false) => {
    // Time how long jobs take to complete properly
    let STOP_WATCHES = new Map,
        JUDGE__STOP_WATCH = (JobName, JobTime = Timers[JobName]) => {
            let { abs } = Math;

            let start = STOP_WATCHES.get(JobName),
                stop = +new Date,
                span = abs(start - stop),
                max = abs(JobTime) * 1.1;

            if(span > max)
                WARN(`"${ JobName.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['',' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, '- ') }" took ${ (span / 1000).suffix('s', 2).replace(/\.0+/, '') } to complete (max time allowed is ${ (max / 1000).suffix('s', 2).replace(/\.0+/, '') }). Offense time: ${ new Date }. Offending site: ${ parent.location.pathname }`)
                    ?.toNativeStack?.();
        },
        START__STOP_WATCH = (JobName, JobCreationDate = +new Date) => (STOP_WATCHES.set(JobName, JobCreationDate), JobCreationDate);

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
        $('[data-a-target="player-overlay-mature-accept"i], [data-a-target*="watchparty"i] button, .home [data-a-target^="home"i], [data-test-selector*="mute"i][data-test-selector*="dismiss"i]', true)
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

                parent.postMessage({ action: 'report-blank-ad', from: 'player.js', purple: isBlankAd }, parent.location.origin);
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
        let { action = '', channel, autosave, controls, filetype, quality, slug, volume } = parseURL(window.location).searchParameters;

        if(action.toLowerCase() != 'dvr')
            return;

        let video = $('video');
        let live = nullish($('[class*="channel-status"i][class*="offline"i]'));

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
                let link = furnish(`a#${ slug }`, { href: URL.createObjectURL(blob), download: `${ slug }.${ top.MIME_Types.find(video.mimeType) }`, hidden: true }, slug);

                document.head.append(link);
                link.click();
            })
            .catch(WARN)
            .finally(() => {
                let link = $(`#${ slug }`);

                // Free up the memory
                URL.revokeObjectURL(link?.href);
                link?.remove();

                parent.postMessage({ action: 'report-offline-dvr', from: 'player.js', slug }, parent.location.origin);
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
            let { channel, controls, muted, parent, quality } = parseURL(window.location).searchParameters;

            controls = parseBool(controls);
            muted = parseBool(muted);

            if(!controls && !muted)
            $('figure[tt-svg-label~="unmute"i]')?.click();
        }
    }

    // End of Player__Initialize
};
// End of Player__Initialize

let Player__Initialize_Safe_Mode = async(START_OVER = false) => {
    // End of Player__Initialize_Safe_Mode
};
// End of Player__Initialize_Safe_Mode

let Player__CUSTOM_CSS,
    Player__PAGE_CHECKER,
    Player__WAIT_FOR_PAGE,
    Player__SETTING_RELOADER;

Player__PAGE_CHECKER = setInterval(Player__WAIT_FOR_PAGE = async() => {
    // Only executes if the user is banned
    let banned = STREAMER?.veto || !!$('[class*="banned"i]', true).length;

    if([banned].contains(true)) {
        WARN('[NON_FATAL] Framed container unavailable. Reason:', { banned });

        Settings = await GetSettings();

        setTimeout(Player__Initialize_Safe_Mode, 5000);
        clearInterval(Player__PAGE_CHECKER);
    }

    // Only executes if the user is NOT banned
    let ready = (true
        // The main controller is ready
        && parseBool(parent.MAIN_CONTROLLER_READY)

        // There is an error message
        || defined($('[data-test-selector^="content-overlay-gate"i]'))
    );

    if(ready) {
        LOG("Framed container ready");

        Settings = await GetSettings();

        setTimeout(Player__Initialize, 5000);
        clearInterval(Player__PAGE_CHECKER);

        parent.FRAMED_CONTROLLER_READY = true;

        // Only re-execute if in an iframe
        if(top != window) {
            // Observe [top] location changes
            LocationObserver: {
                let { body } = document,
                    observer = new MutationObserver(mutations => {
                        mutations.map(mutation => {
                            if(PATHNAME !== parent.location.pathname) {
                                let OLD_HREF = PATHNAME;

                                PATHNAME = parent.location.pathname;

                                for(let [name, func] of __ONLOCATIONCHANGE__)
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
                Glyphs = parent.Glyphs;

            for(let container of $('figure', true)) {
                let svg = $('svg', false, container);

                comparing:
                for(let glyph in Glyphs)
                    if(Glyphs.__exclusionList__.contains(glyph))
                        continue comparing;
                    else
                        resemble(SVGtoImage(svg))
                            .compareTo(SVGtoImage(Glyphs.modify(glyph, { height: 20, width: 20 }).asNode))
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
    for(let MAX_CALLS = 60; MAX_CALLS > 0 && parent.REFRESH_ON_CHILD?.length; --MAX_CALLS)
        RestartJob(parent.REFRESH_ON_CHILD.pop());
}, 250);
