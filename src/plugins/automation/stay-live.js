/*** /plugins/automation/stay-live.js
 * Stay Live.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let ClearIntent, twitch_pathnames, reserved_twitch_pathnames, WATCHED_LIVE, USER_INTENT;

plugin({
    id: 'stay_live',
    timer: 3000,

    /**
     * Initializes state and path patterns used to track live channel visits.
     */
    init() {
        ClearIntent = void null;
        WATCHED_LIVE = void null;       // The channel seen live during this visit
        USER_INTENT = void null;        // A channel the viewer chose themselves (see user-intent.js)
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

        const next = await GetNextStreamer(STREAMER.name)
            , { pathname } = location;

        try {
            await Cache.load('UserIntent', async({ UserIntent }) => {
                // `reserved_twitch_pathnames` was built from a copy of TWITCH_PATHNAMES, so pushing here never
                // counted; remember the intent and check it below (#50)
                if(parseBool(UserIntent))
                    TWITCH_PATHNAMES.push(USER_INTENT = UserIntent);

                Cache.remove('UserIntent');
            });
        } catch(error) {
            return StopWatch.stop('stay_live'), Cache.remove('UserIntent');
        }

        const ignoreReruns = parseBool(Settings.stay_live__ignore_channel_reruns);

        if(STREAMER.live && !(ignoreReruns && STREAMER.redo))
            WATCHED_LIVE = STREAMER.name;

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

            // Only move on when the stream ended while being watched, or the extension brought the viewer
            // here; a channel the viewer opened while it was offline is theirs to look at (#50)
            const broughtHere = defined(parseURL(location).searchParameters?.tool);

            if(USER_INTENT?.equals?.(STREAMER?.name) || !(WATCHED_LIVE?.equals?.(STREAMER?.name) || broughtHere))
                break NotLive;

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
            } else  {
                $warn(`${ STREAMER?.name } is no longer live. There doesn't seem to be any followed channels on right now`, new Date)
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
