/*** /plugins/video-recovery/recover-pages.js
 * Recover Pages.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'recover_pages',

    async install({ StopWatch }) {
        let RECOVER_PAGE_FROM_LAG,
            RECOVER_PAGE_FROM_LAG__EXACT,
            RECOVER_PAGE_FROM_LAG__WARNINGS = 0;

        Handlers.recover_pages = async() => {
            new StopWatch('recover_pages');

            let error = $('main :is([data-a-target*="error"i][data-a-target*="message"i], [data-test-selector*="content"i][data-test-selector*="overlay"i])');

            if(nullish(error))
                return StopWatch.stop('recover_pages');

            let message = error.textContent,
                next = await GetNextStreamer(STREAMER.name);

            $error(message);

            if(/content.*unavailable/i.test(message) && defined(next))
                goto(parseURL(next.href).addSearch({ tool: 'page-recovery--content-unavailable' }).href);
            else
                ReloadPage();

            StopWatch.stop('recover_pages');
        };
        Timers.recover_pages = 5000;

        Unhandlers.recover_pages = () => {
            clearInterval(RECOVER_PAGE_FROM_LAG);
        };

        __RecoverPages__:
        if(parseBool(Settings.recover_pages)) {
            RegisterJob('recover_pages');

            RECOVER_PAGE_FROM_LAG__EXACT = +(new Date);

            RECOVER_PAGE_FROM_LAG = setInterval(() => {
                let now = +(new Date),
                    span = (now - RECOVER_PAGE_FROM_LAG__EXACT);

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
        }
    },
});
