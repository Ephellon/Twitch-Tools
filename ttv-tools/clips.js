/*** /clips.js - Meant for features that can run on clip pages
 *       _____ _ _             _
 *      / ____| (_)           (_)
 *     | |    | |_ _ __  ___   _ ___
 *     | |    | | | '_ \/ __| | / __|
 *     | |____| | | |_) \__ \_| \__ \
 *      \_____|_|_| .__/|___(_) |___/
 *                | |        _/ |
 *                |_|       |__/
 */

/**
 * @file Defines the clips logic for the extension. Used for all {@link # clips.twitch.tv/*} sites.
 * <style>[\.pill]{font-weight:bold;white-space:nowrap;border-radius:1rem;padding:.25rem .75rem}[\.good]{background:#e8f0fe66;color:#174ea6}[\.bad]{background:#fce8e666;color:#9f0e0e;}</style>
 * @author Ephellon Grey (GitHub {@link https://github.io/ephellon @ephellon})
 * @module
 */

;

let here = parseURL(window.location.href);

Runtime.sendMessage({ action: 'FETCH_SHARED_DATA' }, data => Object.assign(window, data));

let {
    PATHNAME = here.pathname,
    STREAMER = ({
        get href() { return `https://www.twitch.tv/${ STREAMER.name }` },
        get name() { return here.searchParameters.channel },
        get live() { return !$.all('[href*="offline_embed"i]').length },
    }),

    GLOBAL_EVENT_LISTENERS,
} = window;

let Clips__Initialize = async(START_OVER = false) => {
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
                $warn(`"${ name.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['',' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, '- ') }" took ${ (span / 1000).suffix('s', 2).replace(/\.0+/, '') } to complete (max time allowed is ${ (max / 1000).suffix('s', 2).replace(/\.0+/, '') }). Offense time: ${ new Date }. Offending site: ${ location.pathname }`)
                    ?.toNativeStack?.();
        }
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
    Handlers.save_ttv_clips = () => {
        let EDITOR_MODE = location.pathname.equals('/create');
        let { src } = $('video');
        let title, author, original, textContainer, placeBefore, carryQuery;

        if(EDITOR_MODE) {
            title = new ClipName(2);
            author = USERNAME;

            original = $(carryQuery = '[data-a-target*="label"i][data-a-target*="text"i]').closest('[style]');
            placeBefore = original;

            $notice('Clip editor mode.');
        } else {
            let [streamerInfo,, clipInfo] = $.all('[class*="clip"i][class*="info"i]');
            let [views, meta] = clipInfo.children;
            let [clipTitle, data] = meta.children;
            let [timestamp, clipAuthor] = $.queryBy('span, a', data);

            views = parseInt(views.textContent.replace(/\D+/g, ''));
            title = clipTitle.innerText;
            timestamp = -parseTime(timestamp.innerText);
            author = clipAuthor.innerText;

            original = $('[class*="social"i][class*="button"i]:is([class*="copy"i], [class*="clip"i])').closest('[class*="social"i]:not(button, [class*="icon"i])').parentElement;
            placeBefore = original.parentElement.lastElementChild;
            carryQuery = '.tw-tooltip';

            $notice('Clip data!', { src, views, title, timestamp, author });
        }

        let { filename } = parseURL(src);
        let [ext, ...name] = filename.split('.').reverse();
        name = name.join('.');

        let parent = original.parentElement;
        let container = original.cloneNode(true);
        let button = $('button', container);
        let id = 'tt_download_link';

        for(let child of $.all('[class*="clip"i]', container))
            for(let key of child.classList)
                child.classList.replace(key, key.replaceAll('clip', 'download'));

        textContainer ??= $(carryQuery, container);

        button.parentElement.setAttribute('aria-describedby', textContainer.id = id);

        textContainer.innerText = `Download this clip`;

        if(EDITOR_MODE)
            textContainer.innerHTML = furnish(`a#tt-download__${ author.replace(/\W+/g, '') }__${ title.replace(/\W+/g, '_') }`, { href: src, download: title, style: `color:inherit!important` }, 'Download').outerHTML;
        else
            $('figure', button)?.replaceWith(furnish(`a#tt-download__${ author.replace(/\W+/g, '') }__${ title.replace(/\W+/g, '_') }`, { href: src, download: title }, Glyphs.utf8.download));

        parent.insertBefore(container, placeBefore);
    };
    Timers.save_ttv_clips = -500;

    __Save_TTV_Clips__:
    if(true || parseBool(Settings?.save_ttv_clips)) {
        RegisterJob('save_ttv_clips');
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
        // ...
    }

    // End of Clips__Initialize
};
// End of Clips__Initialize

let Clips__Initialize_Safe_Mode = async(START_OVER = false) => {
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

    // End of Clips__Initialize_Safe_Mode
};
// End of Clips__Initialize_Safe_Mode

let Clips__PAGE_CHECKER,
    Clips__WAIT_FOR_PAGE,
    Clips__SETTING_RELOADER;

Clips__PAGE_CHECKER = setInterval(Clips__WAIT_FOR_PAGE = async() => {
    // The user might not be bannable on `clips.twitch.tv`...
    // Only executes if the user is banned
    let banned = STREAMER?.veto || !!$.all('[class*="banned"i]').length;

    if([banned].contains(true)) {
        $warn('[NON_FATAL] Clip container unavailable. Reason:', { banned });

        await Settings.get();

        wait(5000).then(Clips__Initialize_Safe_Mode);
        clearInterval(Clips__PAGE_CHECKER);
    }

    // Only executes if the user is NOT banned
    let ready = (true /* Assume OK if this loads in the first place... */
        // The main controller is ready
        // && parseBool(top.MAIN_CONTROLLER_READY)

        // There is an error message
        || $.nullish('[data-test-selector^="content-overlay-gate"i]')
    );

    if(ready) {
        $log(`Clip container ready → ${ location.href }`);

        await Settings.get();

        wait(5000).then(Clips__Initialize);
        clearInterval(Clips__PAGE_CHECKER);

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
            let conversions = {},
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

                                // $log(`Labeling section "${ glyph }" (${ matchPercentage }% match)...`, container);

                                container.setAttribute('tt-svg-label', conversions[glyph]?.pop());
                            });
            }
        }

        // Add custom styling
        CustomCSSInitializer: {
            AddCustomCSSBlock('clips.js', ``);
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

Clips__SETTING_RELOADER = setInterval(() => {
    for(let MAX_CALLS = 60; MAX_CALLS > 0 && window.REFRESH_ON_CHILD?.length; --MAX_CALLS)
        RestartJob(window.REFRESH_ON_CHILD.pop());
}, 250);
