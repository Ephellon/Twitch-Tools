/*** /plugins/customization/watch-time.js
 * Watch Time Placement.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let WATCH_TIME_INTERVAL, WATCH_TIME_TOOLTIP, THIS_POLL, THAT_POLL, GET_TOP_100_INTERVAL, TOP_100_GAME, IN_TOP_100, ALL_WATCHTIME_COUNTS, ALL_WATCHTIME_VALUES;

plugin({
    id: 'watch_time_placement',
    timer: -1000,

    init() {
        WATCH_TIME_INTERVAL = void null;
        WATCH_TIME_TOOLTIP = void null;
        THIS_POLL = STREAMER.poll;
        THAT_POLL = 1;
        GET_TOP_100_INTERVAL = void null;
        TOP_100_GAME = STREAMER.game;
        IN_TOP_100 = void null;
        ALL_WATCHTIME_COUNTS = {};
        ALL_WATCHTIME_VALUES = {};
    },

    handler: async() => {
        let placement;

        if((placement = Settings.watch_time_placement ??= 'null').equals('null'))
            return;

        let parent, container
            , extra = () => {};

        const classes = element => [...element.classList].map(label => '.' + label).join('');

        const live_time = $('.live-time');

        if(nullish(live_time))
            return RestartJob('watch_time_placement', 'missing:live_time');

        switch(placement) {
            // Option 1 "over" - video overlay, volume control area
            case 'over': {
                container = live_time.closest(`*:not(${ classes(live_time) })`);
                parent = $('[data-a-target="player-controls"i] [class*="player-controls"i][class*="left-control-group"i]');
            } break;

            // Option 2 "under" - under quick actions, live count/live time area
            case 'under': {
                container = live_time.closest(`*:not(${ classes(live_time) })`);
                parent = container.closest(`*:not(${ classes(container) })`);

                extra = ({ live_time }) => {
                    live_time.modStyle('color:var(--color-text-live)');

                    if(parseBool(Settings.show_stats))
                        live_time.tooltipAnimation = setInterval(() => {
                            live_time.tooltip ??= new Tooltip(live_time, '');

                            const percentage = (STREAMER.time / (STREAMER.data?.dailyBroadcastTime ?? 16_200_000)).clamp(0, 1)
                                , timeLeft = (STREAMER.data?.dailyBroadcastTime ?? 16_200_000) - STREAMER.time;

                            live_time.tooltip.innerHTML = (timeLeft < 0 ? "+" : "") + toTimeString(Math.abs(timeLeft), 'clock');
                            live_time.tooltip.modStyle(`background:linear-gradient(90deg, hsla(${ (120 * percentage) | 0 }, 100%, 50%, 0.5) ${ (100 * percentage).toFixed(2) }%, #0000 0), var(--color-background-tooltip)`);
                        }, 2_5_0);
                };
            } break;

            default: { return }
        }

        const f = furnish;
        const watch_time = f(`${ container.tagName }${ classes(container) }`,
            { style: `color: var(--user-contrast-color)`, contrast: THEME__PREFERRED_CONTRAST },
            f(`${ live_time.tagName }#tt-watch-time${ classes(live_time).replace(/\blive-time\b/gi, 'watch-time') }`, { time: 0 })
        );

        WATCH_TIME_TOOLTIP ??= new Tooltip(watch_time);

        parent.append(watch_time);

        extra({ parent, container, live_time, placement });

        Cache.load([CURRENT_WATCHTIME_NAME, `Watching`], _ => {
            let { Watching } = _;

            if(!(Watching instanceof Array))
                Watching = [];

            if((Watching ??= [NORMALIZED_PATHNAME]).missing(NORMALIZED_PATHNAME)) {
                Watching.push(NORMALIZED_PATHNAME);
                STARTED_WATCHING = +($('#root').dataset.aPageLoaded ??= +new Date);
            }

            _[CURRENT_WATCHTIME_NAME] >>= 0;

            WATCH_TIME_INTERVAL = setInterval(() => {
                const watch_time = $('#tt-watch-time')
                    , time = GET_WATCH_TIME();

                if(nullish(watch_time) || !time) {
                    clearInterval(WATCH_TIME_INTERVAL);
                    return RestartJob('watch_time_placement', 'missing:watch_time|time');
                }

                watch_time.setAttribute('time', time);
                watch_time.innerHTML = toTimeString(time, 'clock');
                watch_time.modStyle(`mix-blend-mode:${ ANTITHEME }en;`);

                if(parseBool(Settings.show_stats))
                    WATCH_TIME_TOOLTIP.innerHTML = toTimeString(time, 'short-epoch');

                Cache.load(null, _ => {
                    for(let [key, val] of Object.entries(_).filter((key, val) => /^WatchTimes\/([\w\-]+)/.test(key))) {
                        fixer: if(UP_NEXT_ALLOW_THIS_TAB) {
                            if(key == CURRENT_WATCHTIME_NAME)
                                break fixer;

                            let count = ALL_WATCHTIME_COUNTS[key] >>= 0;
                            const value = ALL_WATCHTIME_VALUES[key] >>= 0;

                            if(value != val) {
                                ALL_WATCHTIME_COUNTS[key] = 0;
                                ALL_WATCHTIME_VALUES[key] = val;

                                continue;
                            }

                            if(++count > 60) {
                                Cache.remove(key);
                                delete ALL_WATCHTIME_COUNTS[key];
                                delete ALL_WATCHTIME_VALUES[key];

                                continue;
                            }

                            ALL_WATCHTIME_COUNTS[key] = count;
                        }

                        if(key == CURRENT_WATCHTIME_NAME)
                            val = time;

                        Cache.save({ [key]: val });
                    }
                });
            }, 500 + (Math.random() * 500));

            Cache.save({ Watching });
        });

        function getTop100(callback = $ => $) {
            const { filename } = parseURL(STREAMER.game.href);

            if(!filename?.length)
                return;

            fetchURL.idempotent(`https://gql.twitch.tv/gql`, {
                method: 'POST',
                headers: { "client-id": Search.anonID },
                body: JSON.stringify([{
                    operationName: 'DirectoryPage_Game',
                    variables: {
                        imageWidth: 50,
                        slug: filename,
                        options: {
                            sort: 'VIEWER_COUNT',
                            freeformTags: null,
                            tags: [],
                            broadcasterLanguages: [],
                            systemFilters: [],
                        },
                        sortTypeIsRecency: false,
                        limit: 100, // [1, 100]
                    },
                    extensions: {
                        persistedQuery: {
                            version: 1,
                            sha256Hash: `3c9a94ee095c735e43ed3ad6ce6d4cbd03c4c6f754b31de54993e0d48fd54e30`,
                        },
                    },
                }]),
            }).then(r => r.json()).then(json => {
                if(!json?.length)
                    throw `No query data available @ ${ filename }`;

                [json] = json;

                if(json.errors)
                    throw json.errors.join('; ');

                const edges = json
                    ?.data      // [...{ game:object }]
                    ?.game      // { displayName:string, id:string<int>, name:string, streams:object }
                    ?.streams   // { edges:array<object>, pageInfo:object<{ hasNextPage:boolean }> }
                    ?.edges     // [...{ broadcaster:object, freeFormTags:object|array, game:object, id:string<int~GameID>, previewImageURL:object<{ *:string<URL> }>, title:string, type:string, viewersCount:number<int> }]
                    ?? [];

                const { game, poll, sole } = STREAMER;

                let polls = [{ sole, poll }], spot = 1, place = null;

                for(const edge of edges) {
                    const { broadcaster, freeFormTags, game, id, previewImageURL, title, type, viewersCount } = edge.node;

                    if(sole == broadcaster.id)
                        place = spot;

                    polls.push({ sole: broadcaster.id, poll: viewersCount, spot: spot++ });
                }

                const container = $('[data-a-target*="viewer"i][data-a-target*="count"i]').parentElement;

                if(IN_TOP_100 = defined(place))
                    new Tooltip(container, `Top 100! #${ place } for <ins>${ game }</ins>`)
                        .setAttribute('rainbow-border', true);
                else if(nullish(IN_TOP_100 = null))
                    new Tooltip(container, `Viewer change: &${ 'du'[+(THIS_POLL >= THAT_POLL)] }arr; ${ Math.abs(THIS_POLL - THAT_POLL) }`)
                        .setAttribute('rainbow-border', false);

                callback();
            }).catch(error => {
                $warn(error);

                clearInterval(GET_TOP_100_INTERVAL);
            });
        }

        GET_TOP_100_INTERVAL = setInterval(() => {
            THIS_POLL = STREAMER.poll;

            const updt = () => THAT_POLL = THIS_POLL;
            const DIFF = Math.abs(THIS_POLL - THAT_POLL) / THAT_POLL;

            // The game has changed
            if(TOP_100_GAME.unlike(STREAMER.game))
                return (TOP_100_GAME = STREAMER.game) && getTop100(updt);
            // 15% change in polls
            if(THIS_POLL > 5000 && DIFF > .15)
                getTop100(updt); // for gradual changes
            // 10% change in polls
            if(THIS_POLL > 500 && THIS_POLL <= 5000 && DIFF > .10)
                getTop100(updt); // for gradual changes
            // 5% change in polls
            else if(THIS_POLL > 50 && THIS_POLL <= 500 && DIFF > .05)
                getTop100(updt); // for gradual changes
            // Any change in polls
            else if(THIS_POLL <= 50 && THIS_POLL != THAT_POLL)
                if(IN_TOP_100 || nullish(IN_TOP_100))
                    getTop100(updt); // for gradual changes

            // THAT_POLL = THIS_POLL; // for spikes
        }, 5_000);
    },

    unhandler: () => {
        clearInterval(WATCH_TIME_INTERVAL);

        $('#tt-watch-time')?.parentElement?.remove();

        const live_time = $('.live-time');

        live_time?.removeAttribute('style');
        live_time?.tooltip?.remove?.();
        clearInterval(live_time?.tooltipAnimation);

        if(UnregisterJob.__reason__.anyOf('modify', 'reinit'))
            return;

        Cache.save({ Watching: [] });
    },
});
