/*** /plugins/up-next/first-in-line.js
 * First in Line.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let HANDLED_NOTIFICATIONS;

plugin({
    id: 'first_in_line',
    timer: 1000,

    /**
     * Init: Initializes arrays and objects for tracking notifications and timers.
     */
    init() {
        HANDLED_NOTIFICATIONS = [];
        STARTED_TIMERS = {};
    },

    /**
     * Processes actionable notifications to queue them for automatic navigation.
     * @param {Object} params - Execution context
     * @param {StopWatch} params.StopWatch - Timer for performance tracking
     * @param {Element|*} ActionableNotification - A specific notification to process
     * @param {string} [preferredPlace] - Where to insert the job in the queue (e.g., 'first' or 'last')
     */
    handler: async({ StopWatch }, ActionableNotification, preferredPlace) => {
        new StopWatch('first_in_line');

        const notifications = [...$.all('[data-test-selector*="notifications"i] [data-test-selector*="notification"i]'), ActionableNotification].filter(defined);

        preferredPlace ??= 'last';

        // The Up Next empty status
        $('[up-next--body]')?.setAttribute?.('empty', !(UP_NEXT_ALLOW_THIS_TAB && ALL_FIRST_IN_LINE_JOBS.length));
        $('[up-next--body]')?.setAttribute?.('allowed', !!UP_NEXT_ALLOW_THIS_TAB);

        if(!UP_NEXT_ALLOW_THIS_TAB)
            return;

        for(const notification of notifications) {
            const action = (
                notification instanceof Element
                    ? $('a[href^="/"]', notification)
                    : notification
            );

            if(nullish(action))
                continue;

            const { href, pathname } = parseURL(action.href.toLowerCase())
                , { innerText } = action
                , uuid = UUID.from(innerText).value;

            if(HANDLED_NOTIFICATIONS.contains(uuid))
                continue;
            HANDLED_NOTIFICATIONS.push(uuid);

            if(DO_NOT_AUTO_ADD.contains(href) || RESERVED_TWITCH_PATHNAMES.test(href))
                continue;

            // Already on this channel's page: there's nothing to queue or redirect to (#55)
            if(parseURL(href).pathname?.equals(`/${ STREAMER?.name }`))
                continue;

            // A notification that links to Twitch's home page names no channel (it showed up as a bare
            // `https://www.twitch.tv/` job)
            if((parseURL(href).pathname ?? '/').length < 2)
                continue;

            if(true
                && !/\blive\b/i.test(innerText)
                && $.nullish('[class*="toast"i][class*="action"i]', notification)
            )
                continue;

            $log("Received an actionable notification:", innerText, new Date);

            const ALL_JOBS_PREFERENCE_SORTED = (preferredPlace.toString().anyOf('begin', 'beginning', 'first', 'head', 'start', '0', '1', '^') ? [href, ...ALL_FIRST_IN_LINE_JOBS] : [...ALL_FIRST_IN_LINE_JOBS, href]);

            if(defined(FIRST_IN_LINE_HREF ??= ALL_FIRST_IN_LINE_JOBS[0])) {
                if([...ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_HREF].missing(href)) {
                    $log("Pushing to First in Line:", href, new Date);

                    // $log('Accessing here... #2');
                    ALL_FIRST_IN_LINE_JOBS = ALL_JOBS_PREFERENCE_SORTED.map(url => url?.toLowerCase?.()).isolate().filter(url => url?.length);
                } else {
                    $warn("Not pushing to First in Line:", href, new Date);
                    $log("Reason(s):", [FIRST_IN_LINE_JOB, ...ALL_FIRST_IN_LINE_JOBS],
                        `It is the next job? ${ ['No', 'Yes'][+(FIRST_IN_LINE_HREF === href)] }`,
                        `It is in the queue already? ${ ['No', 'Yes'][+(ALL_FIRST_IN_LINE_JOBS.contains(href))] }`
                    );
                }

                // To wait, or not to wait
                Cache.save({ ALL_FIRST_IN_LINE_JOBS });

                continue;
            } else {
                $log("Pushing to First in Line (no contest):", href, new Date);

                // Add the new job...
                // $log('Accessing here... #3');
                ALL_FIRST_IN_LINE_JOBS = ALL_JOBS_PREFERENCE_SORTED.map(url => url?.toLowerCase?.()).isolate().filter(url => url?.length);
                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                // To wait, or not to wait
                Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                });
            }

            AddBalloon: {
                update();

                let index = ALL_FIRST_IN_LINE_JOBS.indexOf(href)
                    , name = parseURL(href).pathname.slice(1)
                    , channel = await (null
                        ?? ALL_CHANNELS.find(channel => channel.name.equals(name))
                        ?? new Search(name).then(Search.convertResults)
                    );

                if(nullish(channel))
                    continue;

                const { live } = channel;

                name = channel.name;

                if($.defined(`[live][time][name="${ name }"i]`))
                    continue;

                index = index < 0 ? ALL_FIRST_IN_LINE_JOBS.length : index;

                const [balloon] = FIRST_IN_LINE_BALLOON?.add({
                    href,
                    src: channel.icon,
                    message: `${ name } <span style="display:${ live ? "none" : "inline-block" }">is not live</span>`,
                    subheader: `Coming up next`,
                    onremove: event => {
                        const index = ALL_FIRST_IN_LINE_JOBS.findIndex(href => event.href == href)
                            , [removed] = (index < 0 ? [] : ALL_FIRST_IN_LINE_JOBS.splice(index, 1))
                            , purl = parseURL(removed)
                            , name = purl.pathname?.slice(1)
                            , redo = (purl.searchParameters?.redo ?? '');

                        $notice(`Removed from Up Next via Balloon (${ nth(index + 1, 'ordinal-position') }):`, removed, "Was it canceled?", event.canceled);
                        if(event.canceled)
                            DO_NOT_AUTO_ADD.push(removed);
                        else if(redo.equals(name))
                            ALL_FIRST_IN_LINE_JOBS.push(removed);
                        // AddBalloon.onremove
                        if(ALL_FIRST_IN_LINE_JOBS.length)
                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: (parseURL(ALL_FIRST_IN_LINE_JOBS[0]).searchParameters?.redo ?? '') });

                        if(index > 0) {
                            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => event.callback(event.element))
                        } else {
                            $log("Destroying current job [First in Line]...", { FIRST_IN_LINE_HREF, FIRST_IN_LINE_DUE_DATE });

                            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                            FIRST_IN_LINE_HREF = void null;
                            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
                            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                                REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                                event.callback(event.element);
                            });
                        }
                    },

                    attributes: {
                        name,
                        live,
                        index,
                        time: (index < 1 ? GET_TIME_REMAINING() : FIRST_IN_LINE_WAIT_TIME * 60_000),

                        style: `opacity: ${ 2 ** -!live }!important`,
                    },

                    animate: container => {
                        const subheader = $('.tt-balloon-subheader', container);

                        if(!UP_NEXT_ALLOW_THIS_TAB)
                            return -1;
                        if(container.hasAttribute('time-ctrl'))
                            return -1;
                        container.setAttribute('time-ctrl', true);

                        return setInterval(async() => {
                            new StopWatch('first_in_line__job_watcher');

                            let timeRemaining = GET_TIME_REMAINING();

                            timeRemaining = timeRemaining < 0 ? 0 : timeRemaining;

                            /* First in Line is paused */
                            if(FIRST_IN_LINE_PAUSED) {
                                // $remark('Adding time... Job Watcher');
                                if(FIRST_IN_LINE_PAUSED_AT.floorToNearest(1e3) === (+new Date).floorToNearest(1e3))
                                    return;

                                Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) });
                                StopWatch.stop('first_in_line__job_watcher', 1000);

                                return FIRST_IN_LINE_PAUSED_AT = +new Date;
                            }

                            Cache.save({ FIRST_IN_LINE_BOOST });

                            let name = container.getAttribute('name')
                                , channel = await (null
                                    ?? ALL_CHANNELS.find(channel => name.equals(channel.name))
                                    ?? new Search(name).then(Search.convertResults)
                                )
                                , { live } = channel;

                            name = channel.name;

                            const time = timeRemaining
                                , intervalID = parseInt(container.getAttribute('animationID'))
                                , index = $.all('[id][guid][uuid]', container.parentElement).indexOf(container)
                                , anchor = $.all('a[connected-to]', container.parentElement)[index];

                            if(anchor.hasAttribute('new-href')) {
                                const href = anchor.getAttribute('new-href');

                                anchor.removeAttribute('new-href');
                                ALL_FIRST_IN_LINE_JOBS.splice(index, 1, anchor.href = href);
                                container.setAttribute('href', href);

                                REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                                Cache.save({ ALL_FIRST_IN_LINE_JOBS });
                            }

                            // Start the first job whenever none is running: a live notification sets FIRST_IN_LINE_HREF
                            // without starting it, so waiting for `nullish(FIRST_IN_LINE_HREF)` left no prompt and no switch
                            if(index == 0 && (+new Date - (REDO_FIRST_IN_LINE_QUEUE.running?.at ?? 0)) > 5_000 && (+new Date - (REDO_FIRST_IN_LINE_QUEUE.restarted ?? 0)) > 5_000) {
                                REDO_FIRST_IN_LINE_QUEUE.restarted = +new Date;
                                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);

                                $warn("Creating job to avoid [First in Line] mitigation event", channel);

                                return StopWatch.stop('first_in_line__job_watcher', 1000), REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = channel.href);
                            }

                            if(time < 1000)
                                wait(5000, [container, intervalID]).then(([container, intervalID]) => {
                                    $log("Mitigation event from [First in Line]", { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_HREF }, new Date);
                                    // Mitigate 0 time bug?

                                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
                                    Cache.save({ ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS.filter(href => parseURL(href).pathname.unlike(parseURL(FIRST_IN_LINE_HREF).pathname)), FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE() }, () => {
                                        $warn(`Timer overdue [animation:first-in-line-balloon] » ${ FIRST_IN_LINE_HREF }`);
                                        // .toNativeStack();

                                        goto(FIRST_IN_LINE_HREF);
                                    });

                                    return clearInterval(intervalID);
                                });

                            container.setAttribute('time', time - (index > 0 ? 0 : 1000));

                            if(container.getAttribute('index') != index)
                                container.setAttribute('index', index);

                            const theme = { light: 'w', dark: 'b' }[THEME];

                            $('a', container)
                                .modStyle(`background-color: var(--color-opac-${ theme }-${ index > 15 ? 1 : 15 - index })`);

                            if(container.getAttribute('live') != (live + '')) {
                                $('.tt-balloon-message', container).innerHTML =
                                    `${ name } <span style="display:${ live ? "none" : "inline-block" }">is not live</span>`;

                                container.modStyle(`opacity: ${ 2 ** -!live }!important`);
                                container.setAttribute('live', live);
                            }

                            subheader.innerHTML = index > 0 ? nth(index + 1, 'ordinal-position') : toTimeString(time, 'clock');

                            StopWatch.stop('first_in_line__job_watcher', 1000);
                        }, 1000);
                    },
                })
                ?? [];

                if(defined(FIRST_IN_LINE_WAIT_TIME) && nullish(FIRST_IN_LINE_HREF)) {
                    REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = href);
                    $log("Redid First in Line queue [First in Line]...", { FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME, FIRST_IN_LINE_HREF });
                } else if(Settings.first_in_line_none) {
                    $log("Heading to stream now [First in Line] is OFF", FIRST_IN_LINE_HREF);

                    [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                    goto(parseURL(FIRST_IN_LINE_HREF).addSearch({ tool: 'first-in-line--killed' }).href);
                }
            } // :AddBalloon
        }

        FIRST_IN_LINE_BOOST &&= ALL_FIRST_IN_LINE_JOBS.length > 0;

        // The boost button itself: `[speeding]` matched the Up Next toggle button first (the boost button
        // marks it too), so once rushing ended this clicked the panel open and shut every second (#44)
        const filb = $('#up-next-boost');

        if(defined(filb) && parseBool(filb.getAttribute('speeding')) != parseBool(FIRST_IN_LINE_BOOST))
            filb.click();

        StopWatch.stop('first_in_line');
    },

    /**
     * Undoes first-in-line: Clears active timers and wipes the navigation queue.
     */
    unhandler: () => {
        if(defined(FIRST_IN_LINE_JOB))
            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

        if(UnregisterJob.__reason__.anyOf('default', 'reinit', 'job-destruction'))
            return;

        // Wait 5s before deleteing everything...
        // If the usr has turned the setting off, it'll still go thru; however, if if page is reloaded too fast nothing will happen
        wait(5_000).then(() => {
            if(defined(FIRST_IN_LINE_HREF))
                FIRST_IN_LINE_HREF = '?';

            ALL_FIRST_IN_LINE_JOBS = [];
            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
        });
    },

    /**
     * Checks if any version of the "First in Line" setting is enabled.
     * @returns {boolean} Whether the feature should be active
     */
    enabled() {
        return parseBool(Settings.first_in_line) || parseBool(Settings.first_in_line_plus) || parseBool(Settings.first_in_line_all) || parseBool(Settings.first_in_line_now);
    },

    /**
     * Sets up the "First in Line" feature: loads cached job data, calculates the next due date based on streamer status, and manages visual rainbow borders for redo entries.
     */
    async setup() {
        __FirstInLine__: {
            await Cache.load(['ALL_FIRST_IN_LINE_JOBS', 'FIRST_IN_LINE_DUE_DATE', 'FIRST_IN_LINE_BOOST'], cache => {
                const oneMin = 60_000
                    , fiveMin = 5.5 * oneMin
                    , tenMin = 10 * oneMin;

                [FIRST_IN_LINE_HREF] = ALL_FIRST_IN_LINE_JOBS = (cache.ALL_FIRST_IN_LINE_JOBS ?? []);
                FIRST_IN_LINE_BOOST = parseBool(cache.FIRST_IN_LINE_BOOST) && parseBool(ALL_FIRST_IN_LINE_JOBS?.length);
                FIRST_IN_LINE_DUE_DATE = (null
                    ?? cache.FIRST_IN_LINE_DUE_DATE
                    ?? (
                        NEW_DUE_DATE(
                            FIRST_IN_LINE_TIMER = (
                                // If the streamer hasn't been on for longer than 10mins, wait until then
                                STREAMER.time < tenMin
                                    ? (
                                        // Boost is enabled
                                        FIRST_IN_LINE_BOOST
                                            ? fiveMin + (tenMin - STREAMER.time)
                                            // Boost is disabled
                                            : FIRST_IN_LINE_WAIT_TIME * oneMin
                                    )
                                    // Streamer has been live longer than 10mins
                                    : (
                                        // Boost is enabled
                                        FIRST_IN_LINE_BOOST
                                            // Boost is enabled
                                            ? Math.min(GET_TIME_REMAINING(), fiveMin)
                                            // Boost is disabled
                                            : FIRST_IN_LINE_WAIT_TIME * oneMin
                                    )
                            )
                        )
                    )
                );
            });

            RegisterJob('first_in_line');

            // Redo entries
            if(true
                && (true
                    && decodeURIComponent(parseURL(top.location).searchParameters?.redo).toLowerCase().split(',').includes(STREAMER.name.toLowerCase())
                    && !decodeURIComponent(parseURL(top.location).searchParameters?.obit).toLowerCase().split(',').includes(STREAMER.name.toLowerCase())
                )
                && top.location.pathname.equals(`/${ STREAMER.name }`)
                && STREAMER.live
            )
                Handlers.first_in_line({ href: top.location.href, innerText: `${ STREAMER.name } is live [Entry Redo]` });

            // Put a rainbow around repeating entries...
            setInterval(() =>
                $.all('[id^="tt-balloon"i][name][live][href*="redo="i]').map(el => {
                    const { searchParameters } = parseURL(el.getAttribute('href'));
                    const name = el.getAttribute('name');
                    const redo = (searchParameters?.redo ?? '').equals(name);

                    if(parseBool(el.getAttribute('rainbow-border')) != redo) {
                        el.setAttribute('rainbow-border', redo);

                        $('.tt-redo-btn svg', el).modStyle(
                            redo
                                ? 'animation: 1s linear 0s infinite normal none running spinner'
                                : 'animation: !delete'
                        );
                    }
                })
            , 100);

            // Restart the timer if the user navigates away from the page
            top.onlocationchange = ({ from, to }) => {
                if(from == to)
                    return;

                $remark("Resetting timer. Location change detected:", { from, to });

                // If the user clicks on a channel, reset the timer
                if(!RESERVED_TWITCH_PATHNAMES.test(to))
                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
            };

            // Controls what's listed under the Up Next balloon
            if(nullish(FIRST_IN_LINE_HREF) && ALL_FIRST_IN_LINE_JOBS.length) {
                const [href] = ALL_FIRST_IN_LINE_JOBS
                    , first = (RegExp(parseURL(STREAMER.href).pathname + '\\b', 'i').test(href))
                    , channel = (null
                        // Attempts to find the channel via "cache"
                        ?? ALL_CHANNELS
                            // Get all live channels listed
                            .filter(isLive)
                            // Used below to control whether the channel is deemed a duplicate
                            .filter(channel => channel.href !== STREAMER.href)
                            // Gets the channel in question, if applicable
                            .find(channel => parseURL(channel.href).pathname === parseURL(href).pathname)
                            // Attempts to find the channel via a search

                            ?? new Search(parseURL(href).pathname.slice(1)).then(Search.convertResults)
                    );

                if(nullish(channel) && !first) {
                    const index = ALL_FIRST_IN_LINE_JOBS.findIndex(job => job == href)
                        , dead = ALL_FIRST_IN_LINE_JOBS[index];

                    $log("Restoring dead channel (initializer)...", dead);

                    const { pathname } = parseURL(dead)
                        , channelID = UUID.from(pathname).value;

                    const name = pathname.slice(1);

                    new Search(name).then(Search.convertResults)
                        .then(streamer => {
                            const restored = ({
                                from: 'SEARCH',
                                href,
                                icon: (typeof streamer.icon == 'string' ? Object.assign(new String(streamer.icon), parseURL(streamer.icon)) : null),
                                live: parseBool(streamer.live),
                                name: streamer.name,
                            });

                            // The queue keeps URLs; the job already holds this one (it used to be replaced by `restored`)
                            ALL_CHANNELS = [...ALL_CHANNELS, restored].filter(defined).filter(uniqueChannels);

                            REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = href);
                        })
                        .catch(error => {
                            const [removed] = (index < 0 ? [] : ALL_FIRST_IN_LINE_JOBS.splice(index, 1))
                                , name = parseURL(removed).pathname.slice(1);

                            $notice(`Necromancy work:`, removed);

                            // Necromancer
                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: (parseURL(ALL_FIRST_IN_LINE_JOBS[0]).searchParameters?.redo ?? '') });

                            Cache.save({ ALL_FIRST_IN_LINE_JOBS }, () => {
                                $warn(`Unable to perform search for "${ name }" - ${ error }`, removed);
                            });
                        });

                    break __FirstInLine__;
                } else if(!first) {
                    // Handlers.first_in_line({ href, innerText: `${ channel.name } is live [First in Line]` });

                    // $warn('Forcing queue update for', href);
                    REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = href)
                } else if(first) {
                    const [removed] = ALL_FIRST_IN_LINE_JOBS.splice(0, 1)
                        , name = parseURL(removed).pathname.slice(1);

                    $notice(`Doppleganger work:`, removed);

                    // Doppleganger
                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: (parseURL(ALL_FIRST_IN_LINE_JOBS[0]).searchParameters?.redo ?? '') });

                    [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                    Cache.save({ ALL_FIRST_IN_LINE_JOBS }, () => {
                        $warn("Removed duplicate job", removed);
                    });
                }
            }
        } // :__FirstInLine__
    },
});
