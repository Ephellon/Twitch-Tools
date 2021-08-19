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
                WARN(`"${ JobName.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['',' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, '- ') }" took ${ (span / 1000).suffix('s', 2).replace(/\.0+/, '') } to complete (max time allowed is ${ (max / 1000).suffix('s', 2).replace(/\.0+/, '') }). Offense time: ${ new Date }. Offending site: ${ top.location.pathname }`)
                    .toNativeStack();
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
        $('[data-a-target="player-overlay-mature-accept"i], [data-a-target*="watchparty"i] button, .home [data-a-target^="home"i]')?.click();
    };
    Timers.auto_accept_mature = -1_000;

    __AutoMatureAccept__:
    if(parseBool(Settings.auto_accept_mature)) {
        RegisterJob('auto_accept_mature');
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
        && parseBool(top.MAIN_CONTROLLER_READY)

        // There is an error message
        || defined($('[data-test-selector^="content-overlay-gate"i]'))
    );

    if(ready) {
        LOG("Framed container ready");

        Settings = await GetSettings();

        setTimeout(Player__Initialize, 5000);
        clearInterval(Player__PAGE_CHECKER);

        top.FRAMED_CONTROLLER_READY = true;

        // Only re-execute if in an iframe
        if(top != window) {
            // Observe location changes
            LocationObserver: {
                let { body } = document,
                    observer = new MutationObserver(mutations => {
                        mutations.map(mutation => {
                            if(PATHNAME !== top.location.pathname) {
                                let OLD_HREF = PATHNAME;

                                PATHNAME = top.location.pathname;

                                for(let [name, func] of __ONLOCATIONCHANGE__)
                                    func(new CustomEvent('locationchange', { from: OLD_HREF, to: PATHNAME }));
                            }
                        });
                    });

                observer.observe(body, { childList: true, subtree: true });
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
                    setTimeout(() => {
                        // Add items to mark as "First Run"

                        setTimeout(() => {
                            $('.tt-first-run', true)
                                .forEach(element => element.classList.remove('tt-first-run'));
                        }, 30_000);
                    }, 5_000);
                } break;
            }

            Storage.set({ onInstalledReason: null });
        }
    }
}, 500);

Player__SETTING_RELOADER = setInterval(() => {
    for(let MAX_CALLS = 60; MAX_CALLS > 0 && top.REFRESH_ON_CHILD?.length; --MAX_CALLS)
        RestartJob(top.REFRESH_ON_CHILD.pop());
}, 250);
