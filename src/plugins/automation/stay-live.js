/*** /plugins/automation/stay-live.js
 * Stay Live.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let ClearIntent, twitch_pathnames, reserved_twitch_pathnames;

// The next-channel lookup still running (see the handler)
let pendingLookup = null;

// The channel the "no followed channels on" warning was last given for
let warnedAlone = null;

plugin({
    id: 'stay_live',
    timer: 3000,

    /**
     * Initializes state and path patterns used to track live channel visits.
     */
    init() {
        ClearIntent = void null;
        twitch_pathnames = [
            USERNAME,

            ...TWITCH_PATHNAMES
        ];

        reserved_twitch_pathnames = RegExp(`/(${ twitch_pathnames.join('|') })`, 'i');
    },

    /**
     * Automatically navigates to the next live followed channel when the current streamer goes offline.
     * @param {Object} params - Execution context
     * @param {StopWatch} params.StopWatch - Timer for performance tracking
     * @returns {Promise<void>}
     */
    handler: async({ StopWatch }) => {
        new StopWatch('stay_live');

        const { pathname } = location;

        try {
            await Cache.load('UserIntent', async({ UserIntent }) => {
                if(parseBool(UserIntent))
                    TWITCH_PATHNAMES.push(UserIntent);

                Cache.remove('UserIntent');
            });
        } catch(error) {
            return StopWatch.stop('stay_live'), Cache.remove('UserIntent');
        }

        NotLive:
        if(false
            || !STREAMER.live
            || (true
                && parseBool(Settings.stay_live__ignore_channel_reruns)
                && STREAMER.redo
            )
        ) {
            if(reserved_twitch_pathnames.test(pathname))
                break NotLive;

            if(!RegExp(STREAMER?.name, 'i').test(PATHNAME))
                break NotLive;

            // Look the next channel up only now, one lookup at a time, and never wait on it for long: with nothing to pick it
            // waits until a channel goes live, and Stay Live stalled on it every tick (while live too), piling up lookups
            const lookup = (pendingLookup ??= Promise.resolve(GetNextStreamer(STREAMER.name)).finally(() => pendingLookup = null))
                , next = await Promise.race([lookup, wait(5_000, null)]);

            if(defined(next)) {
                $warn(`${ STREAMER?.name } is no longer live. Moving onto next channel (${ next.name })`, next.href, new Date);

                REDO_FIRST_IN_LINE_QUEUE( parseURL(FIRST_IN_LINE_HREF)?.addSearch?.({ from: STREAMER?.name })?.href );

                const index = ALL_FIRST_IN_LINE_JOBS.indexOf(FIRST_IN_LINE_HREF)
                    , [removed] = (index < 0 ? [] : ALL_FIRST_IN_LINE_JOBS.splice(index, 1));

                if(UP_NEXT_ALLOW_THIS_TAB)
                    Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => goto(parseURL(next.href)?.addSearch?.({ obit: STREAMER?.name, tool: 'stay-live' })?.href ?? '?tool=stay-live'));
                else
                    Runtime.sendMessage({ action: 'STEAL_UP_NEXT', next: next.href, obit: STREAMER?.name }, ({ next, obit }) => {
                        $notice(`Stealing an Up Next job (stay live): ${ obit } → ${ next }`);

                        goto(parseURL(next).addSearch({ obit, tool: 'stay-live--steal' }).href);
                    });
            } else if(warnedAlone != STREAMER?.name) {
                // Once per channel: this ran every 3s
                warnedAlone = STREAMER?.name;
                $warn(`${ STREAMER?.name } is no longer live. There doesn't seem to be any followed channels on right now`, new Date);
            }

            // After 30 seconds, remove the intent
            ClearIntent ??= setTimeout(Cache.remove, 30_000, 'UserIntent');
        } else if(/\/search\b/i.test(pathname)) {
            const { term } = parseURL(location).searchParameters;

            Cache.save({ UserIntent: term });
        }

        StopWatch.stop('stay_live');
    },

    /**
     * Setup: Logs the initialization of the stay-live feature.
     */
    setup() {
        $remark("Ensuring Twitch stays live...");
    },
});
