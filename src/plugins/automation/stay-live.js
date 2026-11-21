/*** /plugins/automation/stay-live.js
 * Stay Live.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let ClearIntent, twitch_pathnames, reserved_twitch_pathnames, WATCHED_LIVE, WATCHED_LIVE_PATH, USER_INTENT;

const WATCHED_LIVE_KEY = 'ttv-tools:watched-live';

/**
 * The current page's first path part, lowercase (a channel's name on its pages).
 * @simply WatchedLivePath() → string
 */
const WatchedLivePath = () => (location.pathname.split('/')[1] ?? '').toLowerCase();

/**
 * Tells the background about this tab's watched-live channel (`null` forgets it).
 * @simply TellBackground(kept:object?) → undefined
 */
function TellBackground(kept) {
    try {
        Runtime.sendMessage({ action: 'WATCHED_LIVE', name: kept }, () => void Runtime.lastError);
    } catch(error) {
        // The extension was reloaded: this page is about to be respawned
    }
}

/**
 * Remembers (or, without a name, forgets) the channel this tab watched live. A reload keeps it (`sessionStorage`); a
 * respawn is a new tab, so the background keeps a copy and hands it over: losing it (every tab respawns when the
 * extension updates) made Stay Live treat every dead channel as one the viewer opened (#82). It's forgotten once the
 * tab is on another page, so a channel the viewer comes back to later stays theirs to look at.
 * Only the tab's own page keeps it: frames share its `sessionStorage`.
 * @simply KeepWatchedLive(name:string?, path:string?) → undefined
 */
function KeepWatchedLive(name = null, path = WatchedLivePath()) {
    if(top != window)
        return;

    const changed = (WATCHED_LIVE ?? null) !== (name ?? null) || (WATCHED_LIVE_PATH ?? null) !== (name? path: null);

    WATCHED_LIVE = name ?? void null;
    WATCHED_LIVE_PATH = name? path: void null;

    try {
        if(name)
            sessionStorage.setItem(WATCHED_LIVE_KEY, JSON.stringify({ name, path }));
        else
            sessionStorage.removeItem(WATCHED_LIVE_KEY);
    } catch(error) {
        // No storage: the background's copy still counts
    }

    if(changed)
        TellBackground(name? { name, path }: null);
}

plugin({
    id: 'stay_live',
    timer: 3000,

    /**
     * Initializes state and path patterns used to track live channel visits.
     */
    init() {
        ClearIntent = void null;
        WATCHED_LIVE = void null;       // The channel seen live in this tab (its display name)
        WATCHED_LIVE_PATH = void null;  // ...and its path (`/name`'s name, lowercase)

        if(top == window) {
            let kept = {};

            try {
                kept = JSON.parse(sessionStorage.getItem(WATCHED_LIVE_KEY) ?? '{}') ?? {};
            } catch(error) {
                // No storage
            }

            if(kept.name && kept.path == WatchedLivePath()) {
                WATCHED_LIVE = kept.name;
                WATCHED_LIVE_PATH = kept.path;
            } else if(kept.name) {
                // This tab is on another page now: forget it here and in the background
                try {
                    sessionStorage.removeItem(WATCHED_LIVE_KEY);
                } catch(error) {
                    // No storage
                }

                TellBackground(null);
            } else {
                // Nothing kept in this tab: a respawned tab gets its old tab's channel from the background
                try {
                    Runtime.sendMessage({ action: 'WATCHED_LIVE' }, saved => {
                        void Runtime.lastError;

                        if(nullish(WATCHED_LIVE) && saved?.name)
                            if(saved.path == WatchedLivePath())
                                KeepWatchedLive(saved.name, saved.path);
                            else
                                TellBackground(null);
                    });
                } catch(error) {
                    // The extension was reloaded
                }
            }
        }
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

        // The tab moved on (Twitch changes pages without a reload)
        if(defined(WATCHED_LIVE) && WATCHED_LIVE_PATH != WatchedLivePath())
            KeepWatchedLive(null);

        if(STREAMER.live && !(ignoreReruns && STREAMER.redo) && defined(STREAMER.name))
            KeepWatchedLive(STREAMER.name);

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
