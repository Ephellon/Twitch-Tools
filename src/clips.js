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

/** @file Defines the clips logic for the extension. Used for all {@link # clips.twitch.tv/*} sites.
 * <style>[pill]{font-weight:bold;white-space:nowrap;border-radius:1rem;padding:.25rem .75rem}[good]{background:#e8f0fe;color:#174ea6}[bad]{background:#fce8e6;color:#9f0e0e;}</style>
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

window.IS_A_FRAMED_CONTAINER = (top != window);

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
                max: Math.abs(interval) * 1.1,
            });
        }

        static stop(name) {
            StopWatch.#WATCHES.get(name)?.time();
        }

        time() {
            const stop = this.stop = new Date;
            const span = this.span = Math.abs(this.start - stop);
            const { max, name } = this;

            if(span > max)
                $warn(`"${ name.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['', ' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, '- ') }" took ${ (span / 1000).suffix('s', 2).replace(/\.0+/, '') } to complete (max time allowed is ${ (max / 1000).suffix('s', 2).replace(/\.0+/, '') }). Offense time: ${ new Date }. Offending site: ${ location.pathname }`)
                    ?.toNativeStack?.();
        }
    }

    // What plugins (src/plugins/clips/) get from this scope; see docs/PLUGINS.md
    const PLUGIN_CONTEXT = { StopWatch };

    // Video Clips → src/plugins/clips/save-ttv-clips.js
    await TTV.run('clips.save_ttv_clips', PLUGIN_CONTEXT);

};
// End of Clips__Initialize

let Clips__Initialize_Safe_Mode = async(START_OVER = false) => {
    const PLUGIN_CONTEXT = {};

};
// End of Clips__Initialize_Safe_Mode

let Clips__PAGE_CHECKER
    , Clips__WAIT_FOR_PAGE
    , Clips__SETTING_RELOADER;

Clips__PAGE_CHECKER = setInterval(Clips__WAIT_FOR_PAGE = async() => {
    // The user might not be bannable on `clips.twitch.tv`...
    // Only executes if the user is banned
    const banned = STREAMER?.veto || !!$.all('[class*="banned"i]').length;

    if([banned].contains(true)) {
        $warn("[NON_FATAL] Clip container unavailable. Reason:", { banned });

        await Settings.get();

        wait(5000).then(Clips__Initialize_Safe_Mode);
        clearInterval(Clips__PAGE_CHECKER);
    }

    // Only executes if the user is NOT banned
    const ready = (true /* Assume OK if this loads in the first place... */
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
        if(IS_A_FRAMED_CONTAINER) {
            // Observe [top] location changes
            LocationObserver: {
                let { body } = document
                    , observer = new MutationObserver(mutations => {
                        mutations.map(mutation => {
                            if(PATHNAME !== location.pathname) {
                                const OLD_HREF = PATHNAME;

                                PATHNAME = location.pathname;

                                for(const [name, func] of (top?.__ONLOCATIONCHANGE__ ?? []))
                                    func(new CustomEvent('locationchange', { from: OLD_HREF, to: PATHNAME }));
                            }
                        });
                    });

                observer.observe(body, { childList: true, subtree: true });
            }
        }

        // Set the SVGs' section IDs
        SectionLabeling: {
            const conversions = {}
                , Glyphs = window.Glyphs;

            for(const container of $.all('figure')) {
                const svg = $('svg', container);

                if(nullish(svg))
                    continue;

                comparing:
                for(const glyph in Glyphs)
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

                                const matchPercentage = 100 - misMatchPercentage;

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
        RestartJob(window.REFRESH_ON_CHILD.pop(), 'clips-setting-reloader:max-calls');
}, 250);
