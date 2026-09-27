/*** /plugins/automation/auto-follow.js
 * Auto-Follow.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'auto_follow',

    /**
     * Installs the auto-follow feature, initializing watch-time tracking and registering jobs to follow streamers during raids or after a set duration.
     * @param {Object} options - Plugin options
     * @param {Object} options.StopWatch - Stopwatch utility for performance tracking
     */
    async install({ StopWatch }) {
        STARTED_WATCHING = (+new Date);
        CURRENT_WATCHTIME_NAME = `WatchTimes/${ STREAMER.name.toLowerCase() }`;

        Cache.load(CURRENT_WATCHTIME_NAME, _ => {
            _[CURRENT_WATCHTIME_NAME] >>= 0;

            STARTED_WATCHING -= _[CURRENT_WATCHTIME_NAME];

            Cache.save(_);
        });

        GET_WATCH_TIME = function GET_WATCH_TIME() {
            return (+new Date) - STARTED_WATCHING;
        };

        Handlers.auto_follow_raids = () => {
            new StopWatch('auto_follow_raids');

            if(nullish(STREAMER))
                return StopWatch.stop('auto_follow_raids');

            const url = parseURL(location)
                , data = url.searchParameters;

            let { like, follow } = STREAMER
                , raid = parseBool(data.referrer?.equals('raid') || data.raided);

            if(!like && raid)
                follow();

            Cache.load('LastRaid', ({ LastRaid }) => {
                const { from, to, type } = LastRaid || {};

                if(!like && to?.equals?.(STREAMER.name))
                    follow();
            });

            StopWatch.stop('auto_follow_raids');
        };

        Timers.auto_follow_raids = 1000;

        __AutoFollowRaid__:
        if(parseBool(Settings.auto_follow_raids) || parseBool(Settings.auto_follow_all)) {
            RegisterJob('auto_follow_raids')
        }

        let AUTO_FOLLOW_EVENT;

        Handlers.auto_follow_time = async() => {
            new StopWatch('auto_follow_time');

            let { like, follow } = STREAMER
                , mins = parseInt(Settings.auto_follow_time_minutes) | 0;

            if(!like) {
                const secs = GET_WATCH_TIME() / 1000;

                if(secs > (mins * 60))
                    follow();

                AUTO_FOLLOW_EVENT ??= setTimeout(follow, mins * 60_000);
            }

            StopWatch.stop('auto_follow_time');
        };

        Timers.auto_follow_time = 1000;

        __AutoFollowTime__:
        if(parseBool(Settings.auto_follow_time) || parseBool(Settings.auto_follow_all)) {
            RegisterJob('auto_follow_time')
        }
    },
});
