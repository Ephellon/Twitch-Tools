/*** /plugins/video-recovery/recover-pages.js
 * Recover Pages.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let RECOVER_PAGE_FROM_LAG, RECOVER_PAGE_FROM_LAG__EXACT, RECOVER_PAGE_FROM_LAG__WARNINGS;

plugin({
    id: 'recover_pages',
    timer: 5000,

    /**
     * Initializes the page recovery state and lag tracking variables.
     */
    init() {
        RECOVER_PAGE_FROM_LAG = void null;
        RECOVER_PAGE_FROM_LAG__EXACT = void null;
        RECOVER_PAGE_FROM_LAG__WARNINGS = 0;
    },

    /**
     * Runs every tick: Detects page-level errors and attempts to recover by reloading the page or navigating to the next available streamer.
     * @param {Object} context - Contains the StopWatch utility
     */
    handler: async({ StopWatch }) => {
        new StopWatch('recover_pages');

        const error = $('main :is([data-a-target*="error"i][data-a-target*="message"i], [data-test-selector*="content"i][data-test-selector*="overlay"i])');

        if(nullish(error))
            return StopWatch.stop('recover_pages');

        const message = error.textContent
            , next = await GetNextStreamer(STREAMER.name);

        $error(message);

        if(/content.*unavailable/i.test(message) && defined(next))
            goto(parseURL(next.href).addSearch({ tool: 'page-recovery--content-unavailable' }).href);
        else
            ReloadPage();

        StopWatch.stop('recover_pages');
    },

    /**
     * Undoes the page recovery setup by clearing the lag-monitoring interval.
     */
    unhandler: () => {
        clearInterval(RECOVER_PAGE_FROM_LAG);
    },

    /**
     * Initializes a timer to monitor page timing drift and reloads the page if excessive lag is detected.
     */
    setup() {
        RECOVER_PAGE_FROM_LAG__EXACT = +(new Date);

        RECOVER_PAGE_FROM_LAG = setInterval(() => {
            const now = +(new Date)
                , span = (now - RECOVER_PAGE_FROM_LAG__EXACT);

            // The time has drifted by more than 25%
            if(span > (Timers.recover_pages * 1.25))
                $warn(`The page seems to be lagging (${ span.suffix('s', false, 'time') })... This is the ${ nth(++RECOVER_PAGE_FROM_LAG__WARNINGS) } warning. Offending site: ${ location.href }`);
            else if(span < (Timers.recover_pages * 1.05) && RECOVER_PAGE_FROM_LAG__WARNINGS > 0)
                --RECOVER_PAGE_FROM_LAG__WARNINGS;

            // The lag has exceeded 15s
            if(span > 15e3)
                RECOVER_PAGE_FROM_LAG__WARNINGS = Infinity;

            if(RECOVER_PAGE_FROM_LAG__WARNINGS > 2)
                ReloadPage();

            RECOVER_PAGE_FROM_LAG__EXACT = now;
        }, Timers.recover_pages);
    },
});
