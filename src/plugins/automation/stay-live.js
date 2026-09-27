/*** /plugins/automation/stay-live.js
 * Stay Live.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'stay_live',

    async install({ StopWatch }) {
        let ClearIntent;

        let twitch_pathnames = [
            USERNAME,

            ...TWITCH_PATHNAMES
        ];
        let reserved_twitch_pathnames = RegExp(`/(${ twitch_pathnames.join('|') })`, 'i');

        Handlers.stay_live = async() => {
            new StopWatch('stay_live');

            let next = await GetNextStreamer(STREAMER.name),
                { pathname } = location;

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

                if(defined(next)) {
                    $warn(`${ STREAMER?.name } is no longer live. Moving onto next channel (${ next.name })`, next.href, new Date);

                    REDO_FIRST_IN_LINE_QUEUE( parseURL(FIRST_IN_LINE_HREF)?.addSearch?.({ from: STREAMER?.name })?.href );

                    let index = ALL_FIRST_IN_LINE_JOBS.indexOf(FIRST_IN_LINE_HREF),
                        [removed] = (index < 0? []: ALL_FIRST_IN_LINE_JOBS.splice(index, 1));

                    if(UP_NEXT_ALLOW_THIS_TAB)
                        Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => goto(parseURL(next.href)?.addSearch?.({ obit: STREAMER?.name, tool: 'stay-live' })?.href ?? '?tool=stay-live'));
                    else
                        Runtime.sendMessage({ action: 'STEAL_UP_NEXT', next: next.href, obit: STREAMER?.name }, ({ next, obit }) => {
                            $notice(`Stealing an Up Next job (stay live): ${ obit } → ${ next }`);

                            goto(parseURL(next).addSearch({ obit, tool: 'stay-live--steal' }).href);
                        });
                } else  {
                    $warn(`${ STREAMER?.name } is no longer live. There doesn't seem to be any followed channels on right now`, new Date);
                }

                // After 30 seconds, remove the intent
                ClearIntent ??= setTimeout(Cache.remove, 30_000, 'UserIntent');
            } else if(/\/search\b/i.test(pathname)) {
                let { term } = parseURL(location).searchParameters;

                Cache.save({ UserIntent: term });
            }

            StopWatch.stop('stay_live');
        };
        Timers.stay_live = 3000;

        __StayLive__:
        if(parseBool(Settings.stay_live)) {
            $remark('Ensuring Twitch stays live...');

            RegisterJob('stay_live');
        }
    },
});
