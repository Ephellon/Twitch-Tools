/*** /plugins/automation/first-in-line-plus.js
 * First in Line+ (on creation).
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'first_in_line_plus',

    async install({ StopWatch }) {
        let OLD_STREAMERS, NEW_STREAMERS, BAD_STREAMERS, ON_INSTALLED_REASON;

        await Cache.load(['OLD_STREAMERS', 'BAD_STREAMERS'], cache => {
            OLD_STREAMERS = cache.OLD_STREAMERS ?? '';
            BAD_STREAMERS = cache.BAD_STREAMERS ?? '';
        });

        Handlers.first_in_line_plus = async() => {
            new StopWatch('first_in_line_plus');

            const streamers = [...STREAMERS, STREAMER].filter(isLive).map(streamer => streamer.name).isolate().sort();

            NEW_STREAMERS = streamers.join(',').toLowerCase();

            if(nullish(OLD_STREAMERS))
                OLD_STREAMERS = NEW_STREAMERS;

            let old_names = OLD_STREAMERS.split(',').filter(defined)
                , new_names = NEW_STREAMERS.split(',').filter(defined)
                , bad_names = BAD_STREAMERS?.split(',')?.filter(defined)?.filter(parseBool);

            // Detect if the channels got removed incorrectly?
            if(bad_names?.length) {
                $warn("Twitch failed to add these channels correctly:", bad_names);
                // .toNativeStack();

                BAD_STREAMERS = '';

                Cache.save({ BAD_STREAMERS });

                // removeFromSearch(['tt-err-chn']);
            } else if($.nullish('[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] a[class*="side-nav-card"i]') && !/^User_Not_Logged_In_\d+$/.test(USERNAME)) {
                wait(3000).then(() => {
                    // Is the nav open?
                    const alreadyOpen = $.defined('[data-a-target="side-nav-search-input"i], [data-a-target="side-nav-header-expanded"i]')
                        , sidenav = $('[data-a-target="side-nav-arrow"i]')
                            ?.closest('[class*="expand"i]')
                            ?.querySelector('button');

                    // Toggle the Side Nav
                    if(alreadyOpen) {
                        sidenav?.click();

                        wait(1e3).then(() => sidenav?.click());
                    }

                    if($.nullish('[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] a[class*="side-nav-card"i]'))
                        return;

                    $warn("[Followed Channels] is missing. Reloading...");

                    Cache.save({ BAD_STREAMERS: OLD_STREAMERS });

                    // Failed to get channel at...
                    addReport({ 'TTV-Tools-failed-to-get-channel-details': new Date().toString() }, true);
                });

                return /* Fail "gracefully" */;
            }

            if(OLD_STREAMERS == NEW_STREAMERS)
                return StopWatch.stop('first_in_line_plus'), Cache.save({ OLD_STREAMERS });

            new_names = new_names
                .filter(name => old_names.missing(name))
                .filter(name => bad_names.missing(name));

            if(new_names.length < 1)
                return StopWatch.stop('first_in_line_plus'), Cache.save({ OLD_STREAMERS });

            // Try to detect if the extension was just re-installed?
            installation_viewer:
            switch(ON_INSTALLED_REASON ||= Settings.onInstalledReason) {
                case CHROME_UPDATE:
                case SHARED_MODULE_UPDATE: {
                    // Not used. Ignore
                } break;

                case INSTALL: {
                    // Ignore all current streamers; otherwise this will register them all
                    new_names = [];
                } break;

                case UPDATE:
                default: {
                    // Should function normally
                } break;
            } // :installation_viewer | switch ON_INSTALLED_REASON ||= Settings.onInsta

            creating_new_events:
            for(const name of new_names) {
                // TODID? `STREAMERS` → `ALL_CHANNELS`
                const streamer = STREAMERS.find(streamer => RegExp(name, 'i').test(streamer.name))
                    , { searchParameters } = parseURL(location.href);

                if(nullish(streamer) || searchParameters.obit?.equals(streamer.name) || !name?.length)
                    continue creating_new_events;

                const { href } = streamer;

                if(!streamer?.name?.length)
                    continue creating_new_events;

                $log("A channel just appeared:", name, new Date);

                Handlers.first_in_line({ href, innerText: `${ name } is live [First in Line+]` });
            }

            OLD_STREAMERS = NEW_STREAMERS;

            Cache.save({ OLD_STREAMERS });

            StopWatch.stop('first_in_line_plus');
        };

        Timers.first_in_line_plus = 1000;

        Unhandlers.first_in_line_plus = Unhandlers.first_in_line;

        __FirstInLinePlus__:
        if(parseBool(Settings.first_in_line_plus) || parseBool(Settings.first_in_line_all)) {
            RegisterJob('first_in_line_plus')
        }
    },
});
