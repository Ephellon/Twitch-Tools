/*** /plugins/automation/prevent-raiding.js
 * Stop Raiding.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'prevent_raiding',

    async install({ StopWatch }) {
        let CONTINUE_RAIDING = false,
            SHADOW_RAID = false;

        Handlers.prevent_raiding = async() => {
            new StopWatch('prevent_raiding');

            if(false
                || CONTINUE_RAIDING
                // || !UP_NEXT_ALLOW_THIS_TAB
                // ↑ Stops unfollowed channels from sticking around...
            )
                return StopWatch.stop('prevent_raiding');

            let url = parseURL(location),
                data = url.searchParameters,
                raided = parseBool(data.referrer?.equals('raid') || data.raided),
                raiding = $.defined('[data-test-selector="raid-banner"i]'),
                next = await GetNextStreamer(),
                raid_banner = $.all('[data-test-selector="raid-banner"i] strong').map(strong => strong?.textContent),
                from = (raided? null: STREAMER.name),
                [to] = (raided? [STREAMER.name]: raid_banner.filter(name => name.unlike(from)));

            let method = Settings.prevent_raiding ?? "none";

            raid_stopper:
            if(raiding || raided || SHADOW_RAID) {
                top.onlocationchange = () => wait(5000).then(() => CONTINUE_RAIDING = SHADOW_RAID = false);

                // Ignore followed channels
                if(["greed", "unfollowed"].contains(method, SHADOW_RAID)) {
                    // #1 - Collect the channel points by participating in the raid, then leave
                    // #3 should fire automatically after the page has successfully loaded
                    if(raiding && method.equals("greed")) {
                        $log(`[RAIDING] There is a possiblity to collect bonus points. Do not leave the raid.`, parseURL(`${ location.origin }/${ to }`).addSearch({ referrer: 'raid', raided: true }).href);

                        addToSearch({ referrer: 'raid', raided: true });
                        removeFromSearch(['redo']);

                        Cache.save({ LastRaid: { from, to, type: method } });
                        CONTINUE_RAIDING = true;
                        break raid_stopper;
                    }
                    // #2 - The channel being raided (to) is already in "followed." No need to leave
                    else if(raiding && defined(STREAMERS.find(channel => RegExp(`^${ to }$`, 'i').test(channel.name)))) {
                        $log(`[RAIDING] ${ to } is already followed. No need to leave the raid`);

                        CONTINUE_RAIDING = true;
                        break raid_stopper;
                    }
                    // #3 - The channel that was raided (to) is already in "followed." No need to leave
                    else if(raided && STREAMER.like) {
                        $log(`[RAIDED] ${ to } is already followed. No need to abort the raid`);

                        Cache.save({ LastRaid: {} });
                        removeFromSearch(['referrer', 'raided']);
                        CONTINUE_RAIDING = true;
                        break raid_stopper;
                    }
                }

                STREAMER.onraid = async({ raiding, raided }) => {
                    CONTINUE_RAIDING = false;

                    let next = await GetNextStreamer();

                    raid_stopper:
                    if(defined(next)) {
                        $log(`${ STREAMER.name } ${ raiding? 'is raiding': 'was raided' }. Moving onto next channel (${ next.name })`, next.href, new Date);

                        // Don't leave if the raid is on this page...
                        if(raiding && ["greed"].contains(method))
                            break raid_stopper;

                        if(UP_NEXT_ALLOW_THIS_TAB)
                            goto(parseURL(next.href).addSearch({ tool: `raid-stopper--${ method }` }).href);
                        else
                            Runtime.sendMessage({ action: 'STEAL_UP_NEXT', next: next.href, from: STREAMER?.name, method }, ({ next, from, method }) => {
                                $notice(`Stealing an Up Next job (raid): ${ from } → ${ next }`);

                                goto(parseURL(next).addSearch({ tool: `raid-stopper--${ method }` }).href);
                            });

                        let index = ALL_FIRST_IN_LINE_JOBS.indexOf(FIRST_IN_LINE_HREF),
                            [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1);

                        if(UP_NEXT_ALLOW_THIS_TAB)
                            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
                    } else {
                        $log(`${ STREAMER.name } ${ raiding? 'is raiding': 'was raided' }. There doesn't seem to be any followed channels on right now`, new Date);

                        // ReloadPage();
                    }
                };

                // Leave the raided channel after 2mins to ensure points were collected
                CONTINUE_RAIDING = ["greed"].contains(method);

                for(let callback of STREAMER.__eventlisteners__.onraid)
                    callback({ raiding, raided });
            }

            StopWatch.stop('prevent_raiding');
        };
        Timers.prevent_raiding = 10_000;

        __PreventRaiding__:
        if((Settings.prevent_raiding ?? "none").unlike("none")) {
            RegisterJob('prevent_raiding');

            Cache.load('LastRaid', ({ LastRaid }) => {
                let { from, to, type } = LastRaid || {};

                SHADOW_RAID = to?.length > 0 && to?.equals?.(STREAMER?.name)? type: false;

                Cache.save({ LastRaid: {} });
            });

            top.beforeleaving = top.onlocationchange = async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
                if(raiding || raided)
                    CONTINUE_RAIDING = false;
            };
        }
    },
});
