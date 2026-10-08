/*** /plugins/up-next/helpers.js
 * First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

/**
 * Up Next's pause, kept for this tab (Keep Status, #69): `{ paused, by }` in the tab's session storage. Moving to another
 * channel in the same tab keeps it; a new tab starts fresh, and the browser clears it when the tab closes.
 */
const UpNextStatus = {
    key: 'tt-up-next-status',

    get() {
        try {
            return JSON.parse(sessionStorage.getItem(this.key) ?? 'null');
        } catch(error) {
            return null;
        }
    },

    set(state) {
        try {
            sessionStorage.setItem(this.key, JSON.stringify(state));
        } catch(error) {
            // Storage blocked: the tab just won't remember
        }
    },
};

plugin({
    id: 'up_next_helpers',

    /**
     * Installs the "First in Line" helper: configures wait times based on user settings and defines the `REDO_FIRST_IN_LINE_QUEUE` utility function.
     * @param {Object} options - Installation options
     * @param {StopWatch} options.StopWatch - StopWatch utility
     * @returns {Promise<void>}
     */
    async install({ StopWatch }) {
        // First in Line wait time
        FIRST_IN_LINE_WAIT_TIME = parseInt(
            parseBool(Settings.first_in_line)
                ? Settings.first_in_line_time_minutes
                : parseBool(Settings.first_in_line_plus)
                    ? Settings.first_in_line_plus_time_minutes
                    : parseBool(Settings.first_in_line_all)
                        ? Settings.first_in_line_all_time_minutes
                        : parseBool(Settings.first_in_line_now)
                            ? 0
                            : 0
        ) | 0;

        let ALREADY_RESTORING_DEAD_CHANNEL = false;

        // Restart the First in line que's timers
            // REDO_FIRST_IN_LINE_QUEUE(url:string?<URL>, search:object?) → <Promise>?undefined
        top.REDO_FIRST_IN_LINE_QUEUE =
        async function REDO_FIRST_IN_LINE_QUEUE(url, search = null) {
            // Skip only if a job for this URL is really running: cleared intervals keep their IDs, and callers often set
            // `FIRST_IN_LINE_HREF = url` first, so the old check skipped every restart until a drag passed another URL
            const { running } = REDO_FIRST_IN_LINE_QUEUE
                , requested = String(url ?? '');

            if(nullish(url) || (running?.url === requested && (+new Date - running.at) < 2_500))
                return;
            else if(nullish(search)) {
                // The page's search rides along, but never over the job's own, and never the job-only `redo`/`tool`:
                // the page's `redo` named another channel, so a redo job wasn't re-queued when it arrived (owner KI)
                const job = parseURL(url)
                    , { redo, tool, ...page } = (parseURL(location.href).searchParameters ?? {});

                url = job.addSearch({ ...page, ...(job.searchParameters ?? {}) });
            } else
                url = parseURL(url).addSearch((_ => {
                    for(const k in _)
                        if(_[k] === '')
                            delete _[k];
                    return _;
                })(search));

            let { href, pathname } = url
                , name = pathname.slice(1)
                , channel = await (null
                    ?? ALL_CHANNELS.find(channel => channel.name.equals(name))
                    ?? new Search(name).then(Search.convertResults)
                );

            if(nullish(channel))
                return $error(`Unable to create job for "${ href }"`);

            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

            // A new job gets its own "Coming up next" prompt (the flag was never reset, so after a Skip
            // the next channel switched without asking)
            delete STARTED_TIMERS?.WARNING;

            FIRST_IN_LINE_HREF = href;
            GetNextStreamer.cachedStreamer = channel;
            name = (channel.name?.equals(name) ? channel.name : name);

            if(!ALL_FIRST_IN_LINE_JOBS.filter(href => href?.length).length)
                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

            $log(`[Queue Redo] Waiting ${ toTimeString(GET_TIME_REMAINING() | 0) } before leaving for "${ name }" → ${ href }`, new Date);

            FIRST_IN_LINE_WARNING_JOB = setInterval(async() => {
                let timeRemaining = GET_TIME_REMAINING();

                timeRemaining = timeRemaining < 0 ? 0 : timeRemaining;

                // @TODO: Figure out a single pause controller for First in Line...
                if(!UP_NEXT_ALLOW_THIS_TAB)
                    return;
                if(FIRST_IN_LINE_PAUSED)
                    return; // Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) });
                if(timeRemaining > 60_000)
                    return /* There's more than 1 minute left */;

                if(defined(STARTED_TIMERS.WARNING))
                    return /* There is already a warning pending */;

                STARTED_TIMERS.WARNING = true;

                $log("Heading to stream in", toTimeString(timeRemaining), FIRST_IN_LINE_HREF, new Date);

                const url = parseURL(FIRST_IN_LINE_HREF);

                if(nullish(url.pathname))
                    return /* Unknown job */;

                let { name } = await GetNextStreamer();

                if(url.pathname.slice(1).unlike(name))
                    name = url.pathname.slice(1);

                confirm
                    .timed(`<div hidden controller title="${ (Settings.stream_preview ? `Up next: ${ name }` : "Coming up next...") }" okay="Go now" deny="Skip ${ name }"></div>${ (Settings.stream_preview ? "" : `Up next: <a href="${ url.href }">${ name }</a>`) }`, timeRemaining)
                    .then(action => {
                        if(nullish(action))
                            return /* The event timed out... */;

                        // Find the job by channel: FIRST_IN_LINE_HREF carries the page's search string, so
                        // `indexOf` could miss and `splice(-1)` would drop the last job instead (#52)
                        const current = parseURL(FIRST_IN_LINE_HREF).pathname
                            , thisJob = ALL_FIRST_IN_LINE_JOBS.findIndex(job => parseURL(job).pathname?.equals(current))
                            , [removed = FIRST_IN_LINE_HREF] = (thisJob < 0 ? [] : ALL_FIRST_IN_LINE_JOBS.splice(thisJob, 1))
                            , name = parseURL(removed).pathname.slice(1)
                            , [next] = ALL_FIRST_IN_LINE_JOBS;

                        $notice(`${ ['Skipping', 'Heading to'][+action] } Up Next channel (confirmation):`, removed);

                        // Stop this channel's countdown before anything else, so it can't fire after a Skip (#52)
                        [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);
                        FIRST_IN_LINE_HREF = void null;
                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(FIRST_IN_LINE_TIMER);

                        // The next job keeps its own `redo`: passing the removed job's overwrote it, so a redo channel
                        // arrived with another channel's name and wasn't re-queued (owner KI)
                        if(defined(next))
                            REDO_FIRST_IN_LINE_QUEUE(next, { redo: (parseURL(next).searchParameters?.redo ?? '') });

                        Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                            if(action) {
                                // The user clicked "OK" (the channel just taken off the queue, not whatever is next)
                                goto(parseURL(removed).addSearch({ tool: 'first-in-line--ok' }).href)
                            } else {
                                // The user clicked "Skip": it's already off the queue; drop its row
                                $log("Canceled First in Line event", removed);

                                const balloonChild = $(`[id^="tt-balloon-job"i][href$="/${ name }"i]`)
                                    , animationID = (balloonChild?.getAttribute('animationID')) || -1;

                                clearInterval(animationID);
                                balloonChild?.remove();
                            }
                        });
                    });

                when.defined(() => $('.tt-confirm-container'))
                    .then(container => {
                        $.body.append(furnish('style').with(`.tt-confirm-header { background:#0008 } .tt-confirm-body, .tt-confirm-footer { background:#0000; text-shadow:0 0 1rem #000 }`));
                        container.append(furnish(`iframe[src=https://player.twitch.tv/?channel=${ name }&controls=false&muted=true&parent=twitch.tv&quality=160p]`, { style: 'position:absolute;top:4px;z-index:-9;padding:0;max-width:calc(100% - 4px);max-height:calc(100% - 4px);border-radius:inherit' }));
                    });
            }, 1000);

            FIRST_IN_LINE_JOB = setInterval(() => {
                // Heartbeat: tells a later REDO_FIRST_IN_LINE_QUEUE which job is still running
                REDO_FIRST_IN_LINE_QUEUE.running = { url: requested, at: +new Date };

                // If the channel disappears (or goes offline), kill the job for it
                // @FIXME: Reanimating First in Line jobs may cause reloading issues?
                let index = ALL_CHANNELS.findIndex(channel => RegExp(parseURL(channel.href).pathname + '\\b', 'i').test(FIRST_IN_LINE_HREF))
                    , channel = ALL_CHANNELS[index]
                    , timeRemaining = GET_TIME_REMAINING();

                timeRemaining = timeRemaining < 0 ? 0 : timeRemaining;

                // The timer is paused
                if(!UP_NEXT_ALLOW_THIS_TAB)
                    return;
                if(FIRST_IN_LINE_PAUSED)
                    return; // Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) });

                if(nullish(channel) && !ALREADY_RESTORING_DEAD_CHANNEL) {
                    if(nullish(FIRST_IN_LINE_HREF))
                        return;

                    $log("Restoring dead channel (interval)...", FIRST_IN_LINE_HREF);

                    const { href, pathname } = parseURL(FIRST_IN_LINE_HREF)
                        , channelID = UUID.from(pathname).value;

                    if(nullish(pathname))
                        return;
                    ALREADY_RESTORING_DEAD_CHANNEL = true;

                    const name = pathname.slice(1);

                    new Search(name)
                        .then(Search.convertResults)
                        .then(streamer => {
                            const restored = ({
                                from: 'SEARCH',
                                href,
                                icon: (typeof streamer.icon == 'string' ? Object.assign(new String(streamer.icon), parseURL(streamer.icon)) : null),
                                live: parseBool(streamer.live),
                                name: streamer.name,
                            });

                            ALREADY_RESTORING_DEAD_CHANNEL = false;
                            ALL_CHANNELS = [...ALL_CHANNELS, restored].filter(defined).filter(uniqueChannels);
                            ALL_FIRST_IN_LINE_JOBS[index] = restored;
                        })
                        .catch(error => {
                            ALL_FIRST_IN_LINE_JOBS = ALL_FIRST_IN_LINE_JOBS.map(url => url?.toLowerCase?.()).isolate().filter(url => url?.length).filter(url => parseURL(url).pathname != parseURL(FIRST_IN_LINE_HREF).pathname);
                            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                                REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                                $warn(error);
                            });
                        });
                }

                // Don't act until 1sec is left
                if(timeRemaining > 1000)
                    return;

                /* After above is `false` */

                Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(), ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS = ALL_FIRST_IN_LINE_JOBS.filter(url => parseURL(url).pathname.toLowerCase() != parseURL(FIRST_IN_LINE_HREF).pathname.toLowerCase()) }, (href = parseURL(channel?.href ?? FIRST_IN_LINE_HREF).addSearch({ ...(parseURL(FIRST_IN_LINE_HREF).searchParameters ?? {}) }).href) => {
                    $log("Heading to stream now [Job Interval]", href);

                    [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                    goto(parseURL(href).addSearch({ tool: 'first-in-line--timeout' }).href);
                });
            }, 1000);
        };

        top.NEW_DUE_DATE =
        function NEW_DUE_DATE(offset) {
            if(!UP_NEXT_ALLOW_THIS_TAB)
                return (+new Date) + 3_600_000;

            return (+new Date) + (null
                ?? offset
                ?? FIRST_IN_LINE_WAIT_TIME * 60_000
            );
        };

        top.GET_TIME_REMAINING =
        function GET_TIME_REMAINING() {
            if(!UP_NEXT_ALLOW_THIS_TAB)
                return 3_600_000;

            const now = (+new Date)
                , due = FIRST_IN_LINE_DUE_DATE;

            return (due - now);
        };

        FIRST_IN_LINE_SAFETY_CATCH =
            setInterval(() => {
                const job = $('[up-next--body] [name][time]');

                if(nullish(job))
                    return;

                const timeRemaining = parseInt(job.getAttribute('time'));

                // If the normal Up Next switch hasn't happened a minute after it was due, ask instead
                if(timeRemaining <= 60_000 && $.nullish('.tt-confirm'))
                    wait(60_000).then(() => {
                        const name = GetNextStreamer.cachedStreamer?.name;

                        // Another prompt is up, or there's nowhere to go
                        if($.defined('.tt-confirm') || nullish(name))
                            return;

                        $warn(`Mitigation for Up Next: Loose interval @ ${ location } / ${ new Date }`);
                        // .toNativeStack();

                        confirm
                            .timed(`Coming up next: <a href='./${ name }'>${ name }</a>`, timeRemaining)
                            .then(action => {
                                if(nullish(action))
                                    return /* The event timed out... */;

                                // Does NOT touch the cache

                                if(action) {
                                    // The user clicked "OK"

                                    goto(parseURL(`./${ name }`).addSearch({ tool: `up-next--ok` }).href)
                                } else {
                                    // The user clicked "Cancel"
                                    const balloonChild = $(`[id^="tt-balloon-job"i][href$="/${ name }"i]`)
                                        , animationID = (balloonChild?.getAttribute('animationID')) || -1;

                                    clearInterval(animationID);
                                    balloonChild?.remove();
                                }
                            });

                        // top.open(href, '_self');
                    });

                clearInterval(FIRST_IN_LINE_SAFETY_CATCH);
            }, 1000);

        const FIRST_IN_LINE_BALLOON__INSURANCE =
            setInterval(() => {
                // A page change without a reload (Keep Pop-out) removes the balloon but not this reference: build it again (#46)
                if(defined(FIRST_IN_LINE_BALLOON?.container) && !FIRST_IN_LINE_BALLOON.container.isConnected) {
                    FIRST_IN_LINE_SORTING_HANDLER?.destroy?.();
                    FIRST_IN_LINE_BALLOON = FIRST_IN_LINE_SORTING_HANDLER = null;
                }

                if(NORMAL_MODE && nullish(FIRST_IN_LINE_BALLOON)) {
                    FIRST_IN_LINE_BALLOON = new Balloon({ title: "Up Next", icon: (UP_NEXT_ALLOW_THIS_TAB ? 'calendar' : 'error') });

                    const imgSize = '70px';

                    // Pin: Go to this person when the stream(s) end
                    const pinned_button = FIRST_IN_LINE_BALLOON?.addButton({
                        attributes: {
                            id: 'pinned-streamer',
                            contrast: THEME__PREFERRED_CONTRAST,
                        },

                        icon: 'pinned',
                        onclick: async event => {
                            let { currentTarget } = event
                                , parent = currentTarget.closest('[id^="tt-balloon-container"i]');

                            const f = furnish;
                            let body = $('#tt-reminder-listing')
                                , search = $('#tt-pinned-search');

                            if(defined(body))
                                return body?.remove();
                            else
                                body = f(`#tt-reminder-listing`);

                            search = f(`input#tt-pinned-search.input.autocomplete[autocomplete=false][spellcheck=false][placeholder="Search for a streamer, game or description here... Esc to exit"]`, {
                                style: 'margin-top:1px',
                                onkeyup: delay(async event => {
                                    let { target, code, altKey, ctrlKey, metaKey, shiftKey } = event
                                        , value = (target?.value ?? target?.textContent ?? target?.innerText ?? '').trim();

                                    const terms = value.split(/\s+/).map(term => ['name', 'game', 'desc'].map(type => `[${ type }*="${ term }"i]`).join(','));

                                    if(value.length)
                                        AddCustomCSSBlock(target.id, `#${ target.id }-form ~ :not(${ terms.join(',') }) { display: none }`);
                                    else
                                        RemoveCustomCSSBlock(target.id);
                                    target.setAttribute('value', value);
                                }, 250),
                            });

                            body.with(
                            f(`form#${ search.id }-form[action=#]`, { style: 'position:sticky; top:4rem; z-index:99999' })
                                .with(search)
                            );

                            const SearchableNames = new Set(ALL_CHANNELS.map(c => c.name));
                            const WantedNames = new Set(STREAMERS.map(c => c.name));

                            Cache.load('LiveReminders', async({ LiveReminders }) => {
                                try {
                                    LiveReminders = JSON.parse(LiveReminders || '{}');
                                } catch(error) {
                                    // Probably an object already...
                                    LiveReminders ??= {};
                                }

                                for(const { name } in LiveReminders) {
                                    SearchableNames.add(name);
                                    WantedNames.add(name);
                                }

                                // https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_autocomplete

                                // @performance
                                PrepareForGarbageCollection(LiveReminders);
                            });

                            parent.insertBefore(body, $('[up-next--body] > :nth-child(2)'));

                            listing:
                            for(const name of SearchableNames) {
                                if(nullish(name))
                                    continue listing;

                                const channel = (null
                                    ?? ALL_CHANNELS.find(c => c.name.equals(name))
                                    ?? await new Search(name).then(Search.convertResults)
                                );

                                if(nullish(channel))
                                    continue listing;

                                const _name = name.toLowerCase();
                                const { icon, live } = channel;
                                const pinned = parseBool(GetNextStreamer.pinnedStreamer?.equals(name));
                                const wanted = WantedNames.has(name);
                                const current = name.equals(STREAMER.name);

                                const desc = (STREAMER.jump?.[_name]?.title ?? '');
                                const game = (STREAMER.jump?.[_name]?.stream?.game?.name ?? '');

                                autocomplete(search, { [name]: [name, game, desc].filter(s => s.length).join(' - ') });

                                const container = f(`.tt-pinnable`, { name, game, desc, live, style: `animation:fade-in 1s 1; background:var(--color-background-${ pinned ? 'chat' : 'base' })` },
                                f('.simplebar-scroll-content',
                                    {
                                        style: 'overflow: hidden;',
                                    },
                                    f('.simplebar-content',
                                        {
                                            style: 'overflow: hidden; width:100%;',
                                        },
                                        f('.tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-overflow-hidden[@testSelector=center-window__content]').with(
                                            f('.persistent-notification.tt-relative[@testSelector=persistent-notification]',
                                                {
                                                    style: 'width:100%',
                                                },
                                                f('.persistent-notification__unread.tt-border-b.tt-flex.tt-flex-nowrap').with(
                                                    f('a.tt-block.tt-full-width.tt-interactable.tt-interactable--alpha.tt-interactable--hover-enabled.tt-interactive[@testSelector=persistent-notification__click]',
                                                        {
                                                            // Sometimes, Twitch likes to default to `_blank`
                                                            target: '_self',

                                                            '@pinned': pinned,
                                                            '@name': name,
                                                            '@icon': icon,
                                                            href: `#\uD83D\uDCCC${ name }`,
                                                            style: `color:inherit!important`,

                                                            onmouseup(event) {
                                                                event.preventDefault(true);

                                                                const { currentTarget } = event;
                                                                let pinned = parseBool(currentTarget.dataset.pinned);
                                                                let oldValue, newValue;

                                                                unpin: if(defined(GetNextStreamer.pinnedStreamer)) {
                                                                    const pidged = $(`.tt-pinnable [data-name="${ GetNextStreamer.pinnedStreamer }"i]`);

                                                                    if(nullish(pidged))
                                                                        break unpin;

                                                                    oldValue = { ...pidged.dataset };
                                                                    pidged.dataset.pinned = false;
                                                                    pidged.closest('.tt-pinnable').modStyle(`background:var(--color-background-base);`);
                                                                    $('.tt-balloon-message strong', pidged).modStyle(`color:!delete`);
                                                                    $('strong', pidged).html(`${ name } &bull; Click to pin \uD83D\uDCCC`);

                                                                    pidged.closest('form')?.insertAdjacentElement('afterend', pidged.closest('.tt-pinnable'));
                                                                }

                                                                if(pinned) {
                                                                    delete GetNextStreamer.pinnedStreamer;
                                                                    $('#pinned-streamer').innerHTML = Glyphs.pinned;

                                                                    Cache.remove(['PinnedStreamer']);
                                                                } else {
                                                                    newValue = { ...currentTarget.dataset };
                                                                    pinned = currentTarget.dataset.pinned = true;
                                                                    GetNextStreamer.pinnedStreamer = currentTarget.dataset.name;
                                                                    $('#pinned-streamer').innerHTML = furnish(`.tt-border-radius-rounded`).with(furnish.img({ src: currentTarget.dataset.icon, style: `min-width:calc(${ imgSize }/2); border-radius:${ imgSize }` })).outerHTML;

                                                                    currentTarget.closest('.tt-pinnable').modStyle(`background:var(--color-background-chat);`);
                                                                    $('.tt-balloon-message strong', currentTarget).modStyle(`color:var(--color-amazon)`);
                                                                    $('strong', currentTarget).html(`${ name } &bull; Pinned. Click to unpin`);

                                                                    currentTarget.closest('[id$="listing"i]').querySelector('form')?.insertAdjacentElement('beforeend', currentTarget.closest('.tt-pinnable'));

                                                                    Cache.save({ PinnedStreamer: GetNextStreamer.pinnedStreamer });
                                                                }

                                                                Runtime.sendMessage({ action: `UPDATE_PINNED_STREAMER`, oldValue, newValue  });
                                                            },
                                                        },
                                                        f('.persistent-notification__area.tt-flex.tt-flex-nowrap.tt-pd-b-1.tt-pd-l-1.tt-pd-r-3.tt-pd-t-1').with(
                                                            // Avatar
                                                            f.div(
                                                                f('.tt-border-radius-rounded.tt-card-img.tt-card-img--size-4.tt-flex-shrink-0.tt-overflow-hidden').with(
                                                                    f('.tt-aspect.tt-aspect--align-top').with(
                                                                        f('img.tt-balloon-avatar.tt-image', { src: icon, style: `min-width:${ imgSize }` })
                                                                    )
                                                                )
                                                            ),
                                                            // Message body
                                                            f('.tt-flex.tt-flex-column.tt-flex-nowrap.tt-mg-x-1', { style: `max-width:calc(100% - ${ imgSize })` }).with(
                                                                f('.persistent-notification__body.tt-overflow-hidden[@testSelector=persistent-notification__body]').with(
                                                                    f('span.tt-c-text-alt').with(
                                                                        f('p.tt-balloon-message').with(
                                                                            f.span(
                                                                                f(`strong`, { innerHTML: `${ name } &bull; ${ pinned ? "Pinned. Click to unpin" : "Click to pin \uD83D\uDCCC" }`, style: (pinned ? 'color:var(--color-amazon)' : '') })
                                                                            )
                                                                        )
                                                                    )
                                                                ),
                                                                // Subheader
                                                                f('.tt-align-items-center.tt-flex.tt-flex-shrink-0.tt-mg-t-05', { style: `max-width:100%` }).with(
                                                                    f(`[style="max-width:inherit"]`).with(
                                                                        f(`p.tt-hide-text-overflow`, { style: `text-indent:.25em; max-width:inherit` }).setTooltip(desc, { from: 'top' }).with(desc)
                                                                    )
                                                                ),
                                                                // Footer (persistent)
                                                                f('.tt-footer').with(
                                                                    f(`span.tt-${ (live ? 'live' : 'offline') }`, {
                                                                        style: `min-width:3.5em; background-color:var(--color-background-${ (current ? 'accent' : wanted ? live ? 'live' : 'alt-2' : 'brand') })`
                                                                    }, (current ? 'viewing' : wanted ? live ? 'live' : 'offline' : 'suggested').toUpperCase())
                                                                )
                                                            )
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                                );

                                if(pinned)
                                    search.insertAdjacentElement('afterend', container);
                                else
                                    body.append(container);
                            } // :listing
                        },
                    });

                    pinned_button.tooltip = new Tooltip(pinned_button, 'Pin a user to go to when the queue is <em>empty</em> and <em>offline</em>');
                    if(defined(GetNextStreamer.pinnedStreamer))
                        when.sated(() => ALL_CHANNELS).then(A_C =>
                            pinned_button.innerHTML = furnish(`.tt-border-radius-rounded`).with(
                            furnish.img({
                                src: (null
                                    ?? A_C.find(c => c.name.equals(GetNextStreamer.pinnedStreamer))?.icon
                                    ?? `https://static-cdn.jtvnw.net/ttv-static-metadata/twitch_logo3.jpg`
                                ),
                                style: `min-width:calc(${ imgSize }/2); border-radius:${ imgSize }`,
                            })
                            ).outerHTML
                        );

                    // Up Next Boost Button
                    const first_in_line_boost_button = FIRST_IN_LINE_BALLOON?.addButton({
                        attributes: {
                            id: 'up-next-boost',
                            contrast: THEME__PREFERRED_CONTRAST,
                        },

                        icon: 'latest',
                        onclick: event => {
                            let { currentTarget } = event
                                , speeding = parseBool(currentTarget.getAttribute('speeding'));

                            speeding = (FIRST_IN_LINE_BOOST = !speeding);
                            speeding = (FIRST_IN_LINE_BOOST &&= ALL_FIRST_IN_LINE_JOBS?.length > 0);

                            currentTarget.querySelector('svg[fill]')?.setAttribute('fill', 'currentcolor');
                            currentTarget.querySelector('svg[fill]')?.modStyle(`opacity:${ 2 ** -!speeding }; fill:currentcolor`);
                            currentTarget.setAttribute('speeding', speeding);

                            if(defined(currentTarget.tooltip))
                                currentTarget.tooltip.innerHTML = `${ ['Start', 'Stop'][+speeding] } rushing the queue`;

                            const up_next_button = $('[up-next--container] button');

                            up_next_button?.setAttribute('allowed', parseBool(UP_NEXT_ALLOW_THIS_TAB));
                            up_next_button?.setAttribute('speeding', parseBool(speeding));

                            const oneMin = 60_000
                                , fiveMin = 5.5 * oneMin
                                , tenMin = 10 * oneMin;

                            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(
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
                            );

                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                            $.all(`[up-next--body] [time]`).forEach(element => element.setAttribute('time', FIRST_IN_LINE_TIMER));

                            Cache.save({ FIRST_IN_LINE_BOOST, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME });
                        },
                    });

                    // Pause Button
                    const first_in_line_pause_button = FIRST_IN_LINE_BALLOON?.addButton({
                        attributes: {
                            id: 'up-next-control',
                            contrast: THEME__PREFERRED_CONTRAST,
                        },

                        icon: 'pause',
                        onclick: event => {
                            let { currentTarget } = event
                                , paused = parseBool(currentTarget.getAttribute('paused')?.equals('true'));

                            paused = !paused;

                            currentTarget.innerHTML = Glyphs[['pause', 'play'][+paused]];
                            currentTarget.setAttribute('paused', FIRST_IN_LINE_PAUSED = paused);
                            currentTarget.setAttribute('paused-at', FIRST_IN_LINE_PAUSED_AT = +new Date);

                            // Who paused: a viewer's click is trusted; Auto-Focus clicks the button from script (#56)
                            currentTarget.setAttribute('paused-by', paused ? ['auto', 'user'][+event.isTrusted] : '');

                            UpNextStatus.set({ paused, by: currentTarget.getAttribute('paused-by') });

                            if(defined(currentTarget.tooltip))
                                currentTarget.tooltip.innerHTML = `${ ['Pause', 'Resume'][+paused] } the queue`;
                        },
                    });

                    // Keep Status (#69): a pause carries over when this tab moves to another channel
                    if(parseBool(Settings.up_next__keep_status) && defined(first_in_line_pause_button)) {
                        const kept = UpNextStatus.get();

                        if(kept?.paused) {
                            first_in_line_pause_button.innerHTML = Glyphs.play;
                            first_in_line_pause_button.setAttribute('paused', FIRST_IN_LINE_PAUSED = true);
                            first_in_line_pause_button.setAttribute('paused-at', FIRST_IN_LINE_PAUSED_AT = +new Date);
                            first_in_line_pause_button.setAttribute('paused-by', kept.by || 'user');
                        }
                    }

                    // Live Reminders: Lists the live reminders onclick
                    const live_reminders_catalog_button = FIRST_IN_LINE_BALLOON?.addButton({
                        attributes: {
                            id: 'live-reminders-catalog',
                            contrast: THEME__PREFERRED_CONTRAST,
                        },

                        icon: 'notify',
                        left: true,
                        onclick: async event => {
                            let { currentTarget } = event
                                , parent = currentTarget.closest('[id^="tt-balloon-container"i]');

                            Cache.load(['LiveReminders', 'ChannelPoints', 'DVRChannels'], async({ LiveReminders = null, ChannelPoints = {}, DVRChannels = null }) => {
                                // A key never saved loads as `null` (not `undefined`), so the default above doesn't apply
                                ChannelPoints ??= {};

                                try {
                                    LiveReminders = JSON.parse(LiveReminders || '{}');
                                } catch(error) {
                                    // Probably an object already...
                                    LiveReminders ??= {};
                                }

                                try {
                                    DVRChannels = JSON.parse(DVRChannels || '{}');
                                } catch(error) {
                                    // Probably an object already...
                                    DVRChannels ??= {};
                                }

                                const Hash = {
                                    live_reminders: UUID.from(JSON.stringify(LiveReminders)).value,
                                    dvr_channels: UUID.from(JSON.stringify(DVRChannels)).value,
                                };

                                const f = furnish;
                                let body = $('#tt-reminder-listing')
                                    , head = $('[up-next--header]')
                                    , search = $('#tt-reminder-search');

                                if(defined(body)) {
                                    live_reminders_catalog_button.innerHTML = Glyphs.modify('notify', { height: '20px', width: '20px' });
                                    live_reminders_catalog_button.tooltip.innerHTML = "View Live Reminders";
                                    head.innerHTML = "Up Next";

                                    return body?.remove();
                                } else {
                                    live_reminders_catalog_button.innerHTML = Glyphs.modify('calendar', { height: '20px', width: '20px' });
                                    live_reminders_catalog_button.tooltip.innerHTML = "View Up Next";
                                    head.innerHTML = "Live Reminders";
                                }

                                body = f(`#tt-reminder-listing`);

                                if(Object.keys(LiveReminders).length > 6) {
                                    search = f(`input#tt-reminder-search.input.autocomplete[autocomplete=false][spellcheck=false][placeholder="Search for a streamer, game or description here... Esc to exit"]`, {
                                        style: 'margin-top:1px',
                                        onkeyup: delay(async event => {
                                            let { target, code, altKey, ctrlKey, metaKey, shiftKey } = event
                                                , value = (target?.value ?? target?.textContent ?? target?.innerText ?? '').trim();

                                            const terms = value.split(/\s+/).map(term => ['name', 'game', 'desc'].map(type => `[${ type }*="${ term }"i]`).join(','));

                                            if(value.length)
                                                AddCustomCSSBlock(target.id, `#${ target.id }-form ~ :not(${ terms.join(',') }) { display: none }`);
                                            else
                                                RemoveCustomCSSBlock(target.id);
                                            target.setAttribute('value', value);
                                        }, 250),
                                    });

                                    // https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_autocomplete

                                    autocomplete(search, LiveReminders);

                                    body.with(
                                    f(`form#${ search.id }-form[action=#]`, { style: 'position:sticky; top:4rem; z-index:99999' })
                                        .with(search)
                                    );
                                }

                                parent.insertBefore(body, $('[up-next--body] > :nth-child(2)'));

                                // List all reminders, in order of their last live time
                                const { abs, random, round } = Math;
                                let reminders = [];
                                const now = new Date
                                    , today = now.toLocaleDateString(top.LANGUAGE, { dateStyle: 'short' })
                                    , yesterday = new Date(+now - 86_400_000).toLocaleDateString(top.LANGUAGE, { dateStyle: 'short' });

                                sorting:
                                for(const reminderName in LiveReminders)
                                    reminders.push({ name: reminderName, time: new Date(LiveReminders[reminderName]) });
                                reminders = reminders.sort((a, b) => (abs(+now - +a.time) < abs(+now - +b.time)) ? -1 : +1);

                                // Nothing to list: close the (empty) listing and say so
                                const nothingToList = async() => {
                                    body?.remove();
                                    live_reminders_catalog_button.innerHTML = Glyphs.modify('notify', { height: '20px', width: '20px' });
                                    live_reminders_catalog_button.tooltip.innerHTML = "View Live Reminders";
                                    head.innerHTML = "Up Next";

                                    return await alert.timed(`There are no Live Reminders to display<p tt-x>${ (new UUID) }</p>`, 7000);
                                };

                                if(!reminders.length)
                                    return await nothingToList();

                                listing:
                                for(let index = 0; index < reminders.length; ++index) {
                                    if($.nullish(`#tt-reminder-listing`))
                                        break listing;

                                    const { length } = reminders;
                                    const { name, time } = reminders[index];
                                    let channel = await new Search(name).then(Search.convertResults)
                                        , ok = parseBool(channel?.ok);

                                    // Search did not complete...
                                    let num = 3;

                                    while(!ok && num-- > 0 && $.defined(`#tt-reminder-listing`)) {

                                        Search.void(name);

                                        // @research
                                        channel = await new Search(name).then(Search.convertResults);
                                        ok = parseBool(channel?.ok);

                                        // $warn(`Re-search, ${ num } ${ 'retry'.pluralSuffix(num) } left [Catalog]: "${ name }" → OK = ${ ok }`);
                                    }

                                    // Retries exhausted (`num` ends at -1, so `!num` never held): fall back to known channels, else skip
                                    if(!ok) {
                                        channel = ALL_CHANNELS.find(channel => channel.name.equals(name));

                                        if(nullish(channel?.name))
                                            continue listing;
                                    }

                                    const [amount, fiat, face, notEarned, pointsToEarnNext] = (ChannelPoints[name] ?? 0).toString().split('|')
                                        , sole = face?.split('/')?.map(parseFloat)?.shift();

                                    // Correct for changed usernames
                                    if(!ok)
                                        try {
                                            const definitiveID = await new Search(name, 'sniffer', 'getID');

                                            if(nullish(definitiveID)) {
                                                const real = await new Search(sole, 'sniffer', 'getName');

                                                $warn(`Updating details about (#${ sole }) "${ name }" → "${ real }"`);

                                                // Correct the cache...
                                                Cache.load(`data/${ name }`, cache => {
                                                    Cache.save({ [`data/${ real }`]: cache[`data/${ name }`] });
                                                    Cache.remove(`data/${ name }`);
                                                });

                                                // Correct the channel points...
                                                ChannelPoints[real] = ChannelPoints[name];
                                                delete ChannelPoints[name];

                                                Cache.save({ ChannelPoints });

                                                // Correct the live reminders...
                                                LiveReminders[real] = LiveReminders[name];
                                                delete LiveReminders[name];

                                                Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));

                                                // Continue with the new name...
                                                reminders.push({ name: real, time });

                                                // @performance
                                                PrepareForGarbageCollection(LiveReminders);

                                                continue listing;
                                            }
                                        } catch(error) {
                                            // Continue with the bad data?
                                            if(nullish(channel))
                                                continue listing;
                                        }

                                    // Legacy reminders... | v4.26 → v4.27
                                    const legacy = +now < +time;

                                    if(nullish(channel))
                                        continue listing;

                                    const real = new Date(channel.data?.actualStartTime || 0);

                                    const day = time.toLocaleDateString(top.LANGUAGE, { dateStyle: 'short' })
                                        , hour = time.toLocaleTimeString(top.LANGUAGE, { timeStyle: 'short' })
                                        , recent = (abs(+now - +time) / 3_600_000 < 24)
                                        , live = (+real > +time) || await Search.getUserStatus(name)
                                        , [since] = toTimeString((live && time < now ? now - time : abs(now - time)), '~hour hour|~minute minute|~second second').split('|').filter(parseFloat)
                                        , [tense_A, tense_B] = [['', ' ago'], ['in ', '']][+legacy];

                                    const _name = name.toLowerCase();
                                    const { href = `./${ _name }`, icon = Runtime.getURL('profile.png'), desc = (STREAMER.jump?.[_name]?.title ?? '') } = channel;
                                    const coinStyle = new CSSObject({ verticalAlign: 'bottom', height: '20px', width: '20px' })
                                        , coinText =
                                            furnish('span.tt-live-reminder-point-amount[bottom-only]', {
                                                'rainbow-border': notEarned == 0,
                                                innerHTML: amount.replace('.0', '').toLocaleString(LANGUAGE),
                                            }).outerHTML
                                        , coinIcon = (
                                            face?.contains('/')
                                                ? furnish('span.tt-live-reminder-point-face', {
                                                    innerHTML: furnish('img', { src: `https://static-cdn.jtvnw.net/channel-points-icons/${ face }`, style: coinStyle.toString() }).outerHTML,
                                                })
                                                : furnish('span.tt-live-reminder-point-face', {
                                                    innerHTML: Glyphs.modify('channelpoints', { style: `vertical-align:bottom; ${ coinStyle.toString() }` }),
                                                })
                                        ).outerHTML;

                                    const game = (STREAMER.jump?.[_name]?.stream?.game?.name ?? '')
                                        , primaryColor = Color.destruct(STREAMER.jump?.[_name]?.primaryColorHex || '9147ff')
                                        , primaryColorDarker = `hsl(${ primaryColor.H }deg,${ primaryColor.S }%,${ (primaryColor.L * .9).clamp(0, 75) }%)`
                                        , primaryColorLighter = `hsl(${ primaryColor.H }deg,${ primaryColor.S }%,${ (primaryColor.L * 1.1).clamp(25, 100) }%)`;

                                    const liveFontColor = (THEME.equals('dark') ? Color.white : Color.black);
                                    const [liveBGColor] = [primaryColor.HEX, primaryColorDarker, primaryColorLighter].map(Color.destruct).sort((a, b) => Color.contrast(liveFontColor, [b.R, b.G, b.B]) - Color.contrast(liveFontColor, [a.R, a.G, a.B]));

                                    const status = `<span class="tt-${ (live ? 'live' : 'offline') }" style="min-width:3.5em;${ (!live ? '' : `background-color:${ liveBGColor.HEX }`) }">${ (live ? 'LIVE' : recent ? tense_A + since.pluralSuffix(parseFloat(since)) + tense_B : [day, hour].join(' ')) }</span>`;

                                    const DVR_ON = parseBool(DVRChannels[_name]);

                                    // The search box only exists with more than 6 reminders
                                    if(defined(search) && (game || desc)?.length)
                                        autocomplete(search, { [name]: [name, game, desc].filter(s => s.length).join(' - ') });

                                    const imgSize = '70px';

                                    const container = f(`.tt-reminder`, { name, game, desc, live, style: `animation:fade-in 1s 1; background:var(--color-background-base)` },
                                    f('.simplebar-scroll-content',
                                        {
                                            style: 'overflow: hidden;',
                                        },
                                        f('.simplebar-content',
                                            {
                                                style: 'overflow: hidden; width:100%;',
                                            },
                                            f('.tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-overflow-hidden[@testSelector=center-window__content]').with(
                                                f('.persistent-notification.tt-relative[@testSelector=persistent-notification]',
                                                    {
                                                        style: 'width:100%',
                                                    },
                                                    f('.persistent-notification__unread.tt-border-b.tt-flex.tt-flex-nowrap').with(
                                                        f('a.tt-block.tt-full-width.tt-interactable.tt-interactable--alpha.tt-interactable--hover-enabled.tt-interactive[@testSelector=persistent-notification__click]',
                                                            {
                                                                // Sometimes, Twitch likes to default to `_blank`
                                                                'target': '_self',

                                                                href,
                                                            },
                                                            f('.persistent-notification__area.tt-flex.tt-flex-nowrap.tt-pd-b-1.tt-pd-l-1.tt-pd-r-3.tt-pd-t-1').with(
                                                                // Avatar
                                                                f.div(
                                                                    f('.tt-border-radius-rounded.tt-card-img.tt-card-img--size-4.tt-flex-shrink-0.tt-overflow-hidden', { style: (!live ? '' : `border:3px solid ${ primaryColor.HEX }`) },
                                                                        f('.tt-aspect.tt-aspect--align-top').with(
                                                                            f('img.tt-balloon-avatar.tt-image', { src: icon, style: `min-width:${ imgSize }` })
                                                                        )
                                                                    )
                                                                ),
                                                                // Message body
                                                                f('.tt-flex.tt-flex-column.tt-flex-nowrap.tt-mg-x-1', { style: `max-width:calc(100% - ${ imgSize })` }).with(
                                                                    f('.persistent-notification__body.tt-overflow-hidden[@testSelector=persistent-notification__body]').with(
                                                                        f('span.tt-c-text-alt').with(
                                                                            f('p.tt-balloon-message').with(
                                                                                !live
                                                                                    ? f.strong(name)
                                                                                    : f.span(
                                                                                    f(`strong`, { innerHTML: [name, game].filter(s => s.length).join(' &mdash; ') }),
                                                                                    f(`span.tt-time-elapsed[start=${ (+real > +time ? real : time).toJSON() }]`).with(hour),
                                                                                    f(`p.tt-hide-text-overflow[style=text-indent:.25em]`).setTooltip(desc, { from: 'top' }).with(desc)
                                                                                    )
                                                                            )
                                                                        )
                                                                    ),
                                                                    // Subheader
                                                                    f('.tt-align-items-center.tt-flex.tt-flex-shrink-0.tt-mg-t-05', { style: `max-width:100%` }).with(
                                                                        f('.tt-mg-l-05', { style: `max-width:inherit` }).with(
                                                                            f('span.tt-balloon-subheader.tt-c-text-alt', { style: `max-width:inherit` }).html([status, coinIcon + coinText].join(' &bull; '))
                                                                        )
                                                                    ),
                                                                    // Footer (persistent)
                                                                    f('div', {/* ... */})
                                                                )
                                                            )
                                                        ),
                                                        f('.persistent-notification__delete.tt-absolute.tt-pd-l-1', { style: `top:0.0rem; right:0` },
                                                            f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                                                f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__delete]',
                                                                    {
                                                                        name,

                                                                        onmouseup: event => {
                                                                            let { currentTarget } = event
                                                                                , name = currentTarget.getAttribute('name');

                                                                            Cache.load('LiveReminders', async({ LiveReminders }) => {
                                                                                try {
                                                                                    LiveReminders = JSON.parse(LiveReminders || '{}');
                                                                                } catch(error) {
                                                                                    // Probably an object already...
                                                                                    LiveReminders ??= {};
                                                                                }

                                                                                const justInCase = { ...LiveReminders[name] };

                                                                                $(`.tt-reminder[name="${ name }"i]`)?.remove();
                                                                                delete LiveReminders[name];
                                                                                Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));

                                                                                await confirm
                                                                                    .timed(`Reminder for <a href="/${ name }">${ name }</a> removed successfully!<p tt-x>${ UUID.from(name).value }</p>`, 5000)
                                                                                    .then(ok => {
                                                                                        // The user pressed "Cancel"
                                                                                        if(ok === false)
                                                                                            Cache.save({ LiveReminders: { ...LiveReminders, [name]: justInCase } }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));
                                                                                    });
                                                                            });
                                                                        },
                                                                    },
                                                                    f('span.tt-button-icon__icon').with(
                                                                        f('div',
                                                                            {
                                                                                style: 'height:1.6rem; width:1.6rem',
                                                                                innerHTML: Glyphs.ignore,
                                                                            }
                                                                        )
                                                                    )
                                                                ).setTooltip(`Remove ${ name } from Live Reminders`, { from: 'top' })
                                                            )
                                                        ),
                                                        f('.persistent-notification__popout.tt-absolute.tt-pd-l-1', { style: `top:2.5rem; right:0` },
                                                            f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                                                f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__popout]',
                                                                    {
                                                                        name,

                                                                        onmouseup: event => {
                                                                            let { currentTarget } = event
                                                                                , name = currentTarget.getAttribute('name');

                                                                            MiniPlayer = name;
                                                                        },
                                                                    },
                                                                    f('span.tt-button-icon__icon').with(
                                                                        f('div',
                                                                            {
                                                                                style: 'height:1.6rem; width:1.6rem',
                                                                                innerHTML: Glyphs.picture_in_picture,
                                                                            }
                                                                        )
                                                                    )
                                                                ).setTooltip(`Send to MiniPlayer`, { from: 'top' })
                                                            )
                                                        ),
                                                        (
                                                            parseBool(Settings.video_clips__dvr)
                                                                ? f('.persistent-notification__popout.tt-absolute.tt-pd-l-1', { style: `top:5rem; right:0` },
                                                                    f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                                                        f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__popout]',
                                                                            {
                                                                                name,

                                                                                onmouseup: event => {
                                                                                    let { currentTarget } = event
                                                                                        , name = currentTarget.getAttribute('name');

                                                                                    Cache.load('DVRChannels', async({ DVRChannels }) => {
                                                                                        try {
                                                                                            DVRChannels = JSON.parse(DVRChannels || '{}');
                                                                                        } catch(error) {
                                                                                            // Probably an object already...
                                                                                            DVRChannels ??= {};
                                                                                        }

                                                                                        let s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s")
                                                                                            , DVR_ID = name.toLowerCase()
                                                                                            , enabled = !parseBool(DVRChannels[DVR_ID]?.length)
                                                                                            , [title, subtitle, icon] = [
                                                                                                ['Turn DVR on', `${ s(name) } live streams will be recorded`, 'host'],
                                                                                                ['Turn DVR off', `${ s(name) } live streams will no longer be recorded`, 'clip']
                                                                                            ][+!!enabled];

                                                                                        icon = Glyphs.modify(icon, { style: 'fill:var(--user-contrast-color)!important', height: '20px', width: '20px' });

                                                                                        $('.tt-button-icon__icon', currentTarget).innerHTML = icon;

                                                                                        // Add the DVR...
                                                                                        let message;

                                                                                        if(enabled) {
                                                                                            message = `${ s(name) } streams will be recorded.`;

                                                                                            DVRChannels[DVR_ID] = new ClipName(2);
                                                                                        }
                                                                                        // Remove the DVR...
                                                                                        else {
                                                                                            message = `${ name } will not be recorded.`;

                                                                                            delete DVRChannels[DVR_ID];
                                                                                        }

                                                                                        // @FIXME: Live Reminder alerts will not display if another alert is present...
                                                                                        Cache.save({ DVRChannels }, () => Settings.set({ 'DVR_CHANNELS': Object.keys(DVRChannels) }).then(() => parseBool(message) && alert.timed(message, 7000)).catch($warn));
                                                                                    });
                                                                                },
                                                                            },
                                                                            f('span.tt-button-icon__icon').with(
                                                                                f('div',
                                                                                    {
                                                                                        style: 'height:1.6rem; width:1.6rem',
                                                                                        innerHTML: Glyphs.modify(['host', 'clip'][+DVR_ON], { style: `fill:${ ['currentcolor', '#f59b00'][+DVR_ON] }` }),
                                                                                    }
                                                                                )
                                                                            )
                                                                        ).setTooltip(`${ ['Start', 'Stop'][+DVR_ON] } recording ${ name }'${ /s$/.test(name) ? '' : 's' } streams`, { from: 'top' })
                                                                    )
                                                                )
                                                                // DVR is NOT enabled, so don't show anything here...
                                                                : ''
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    )
                                    );

                                    const lastOnline = $.all('.tt-reminder[live="true"i]', body).pop()
                                        , [firstOffline] = $.all('.tt-reminder[live="false"i]', body);

                                    if(defined(firstOffline) && live)
                                        firstOffline.insertAdjacentElement('beforebegin', container);
                                    else if(defined(lastOnline) && live)
                                        lastOnline.insertAdjacentElement('afterend', container);
                                    else
                                        body.append(container);

                                    // Update to the new date...
                                    if(+real > +time)
                                        LiveReminders[name].time = real;

                                    // And remember kids, never ask a question on StackOverflow
                                    // If anyone besides me ever reads this, I answered my own question eventually
                                    // Remember to take breaks and tackle the problem at a later date
                                        // https://stackoverflow.com/q/72803095/4211612
                                    // Move the channels around to prioritize live ones... Does NOT need to be exact
                                    if(live) {
                                        const data = LiveReminders[name];

                                        delete LiveReminders[name];

                                        LiveReminders = { [name]: data, ...LiveReminders };
                                    }

                                    // Loading reminders (progress bar)...
                                    $('[up-next--body] > *')?.modStyle(`border-bottom:2px solid #0000; transition:border .5s; border-image:linear-gradient(90deg, var(--user-complement-color) ${ (100 * (index / length)).toFixed(0) }%, #0000 0) 1;`);
                                } // :listing

                                // Every reminder was skipped (lookups failed): same as an empty list
                                if(body.isConnected && $.nullish('.tt-reminder', body))
                                    await nothingToList();

                                wait(500)
                                    .then(() => $('[up-next--body] > *').modStyle('border-bottom:2px solid #0000; transition:border .5s; border-image:linear-gradient(90deg, #0000, #0000) 1;'));

                                if(false
                                    || (Hash.live_reminders != UUID.from(JSON.stringify(LiveReminders)).value)
                                    || (Hash.dvr_channels != UUID.from(JSON.stringify(DVRChannels)).value)
                                )
                                    Cache.save({ LiveReminders, DVRChannels }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders), 'DVR_CHANNELS': Object.keys(DVRChannels) }));

                                // @performance
                                PrepareForGarbageCollection(LiveReminders, ChannelPoints, DVRChannels);
                            });
                        },
                    });

                    live_reminders_catalog_button.tooltip ??= new Tooltip(live_reminders_catalog_button, 'View Live Reminders');

                    LIVE_REMINDERS__LISTING_INTERVAL
                        ??= setInterval(() => {
                            for(const span of $.all('.tt-time-elapsed'))
                                span.innerHTML = toTimeString(+new Date - +new Date(span.getAttribute('start')), '<&days=:>!hour:!minute:!second');
                        }, 1000);

                    // Help Button
                    const first_in_line_help_button = FIRST_IN_LINE_BALLOON?.addButton({
                            attributes: {
                                id: 'up-next-help',
                                contrast: THEME__PREFERRED_CONTRAST,
                            },

                            icon: 'help',
                            left: true,
                        })
                        , [accent, contrast] = (Settings.accent_color ?? 'blue/12').split('/')
                        , [colorName] = accent.split('-').reverse();

                    first_in_line_help_button.tooltip ??= new Tooltip(first_in_line_help_button, 'Drop a channel here to queue it');

                    // Update the color name...
                    setInterval(() => {
                        let thematicColor = Color.getName(THEME.equals('dark') ? THEME__CHANNEL_DARK : THEME__CHANNEL_LIGHT);
                        const textShadow = (['black', 'white'].contains(thematicColor) ? `text-shadow:0 0 2px ${ THEME.equals('dark') ? 'black' : 'white' }` : '');

                        // Swap to correct :P
                        thematicColor = ({ black: 'white', white: 'black' }[thematicColor]) ?? thematicColor;

                        first_in_line_help_button.tooltip.innerHTML = (
                            UP_NEXT_ALLOW_THIS_TAB
                                ? `Drop a channel in the <span style="color:var(--user-accent-color); ${ textShadow }">${ colorName }</span> area to queue it`
                                : `Up Next is disabled for this tab`
                        ).replace(/\bcolored\b/g, ($0, $$, $_) => thematicColor);
                    }, 1000);

                    // Load cache
                    Cache.load(['ALL_FIRST_IN_LINE_JOBS', 'FIRST_IN_LINE_DUE_DATE', 'FIRST_IN_LINE_BOOST'], cache => {
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
                                                ? Math.min(GET_TIME_REMAINING(), fiveMin)
                                                // Boost is disabled
                                                : FIRST_IN_LINE_WAIT_TIME * oneMin
                                        )
                                )
                                )
                            )
                        );

                        if(FIRST_IN_LINE_BOOST) {
                            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(Math.min(GET_TIME_REMAINING(), fiveMin));

                            wait(5000).then(() => $.all('[up-next--body] [time]:not([index="0"])').forEach(element => element.setAttribute('time', FIRST_IN_LINE_TIMER = fiveMin)));

                            Cache.save({ FIRST_IN_LINE_DUE_DATE });

                            $remark(`Up Next Boost is enabled → Waiting ${ toTimeString(GET_TIME_REMAINING() | 0) } before leaving for "${ parseURL(FIRST_IN_LINE_HREF).pathname?.slice(1) }"`);
                        } else {
                            $remark(`Up Next Boost is disabled`)
                        }

                        // Up Next Boost
                        first_in_line_boost_button.setAttribute('speeding', FIRST_IN_LINE_BOOST);
                        first_in_line_boost_button.querySelector('svg[fill]')?.setAttribute('fill', '');
                        first_in_line_boost_button.querySelector('svg[fill]')?.modStyle(`opacity:${ 2 ** -!FIRST_IN_LINE_BOOST }; fill:currentcolor`);
                        first_in_line_boost_button.tooltip ??= new Tooltip(first_in_line_boost_button, `${ ['Start', 'Stop'][FIRST_IN_LINE_BOOST | 0] } rushing the queue`);

                        const up_next_button = $('[up-next--container] button');

                        up_next_button?.setAttribute('allowed', parseBool(UP_NEXT_ALLOW_THIS_TAB));
                        up_next_button?.setAttribute('speeding', parseBool(FIRST_IN_LINE_BOOST));

                        // Pause
                        first_in_line_pause_button.tooltip ??= new Tooltip(first_in_line_pause_button, `${ ['Pause', 'Resume'][+FIRST_IN_LINE_PAUSED] } the queue`);
                    });
                }

                if(defined(FIRST_IN_LINE_BALLOON)) {
                    // FIRST_IN_LINE_BALLOON.header.closest('div').setAttribute('title', (UP_NEXT_ALLOW_THIS_TAB? `Drop a channel here to queue it`: `Up Next is disabled for this tab`));

                    FIRST_IN_LINE_BALLOON.body.ondragover ??= event => {
                        event.preventDefault();

                        event.dataTransfer.dropEffect = (UP_NEXT_ALLOW_THIS_TAB ? 'move' : 'none');
                    };

                    FIRST_IN_LINE_BALLOON.body.ondrop ??= async event => {
                        event.preventDefault();

                        if(!UP_NEXT_ALLOW_THIS_TAB)
                            return;

                        // Try to see if it's a link...
                        const text = event.dataTransfer.getData('text');

                        if(!parseURL.pattern.test(text))
                            return;

                        const { href, hostname, pathname, domainPath } = parseURL(text)
                            , name = pathname.slice(1).split('/').shift();

                        // No idea what the user just dropped
                        if(!hostname?.length || !pathname?.length)
                            return $error(`Unknown [ondrop] text: "${ text }"`);

                        if(!/^tv\.twitch/i.test(domainPath.join('.')) || RESERVED_TWITCH_PATHNAMES.test(pathname))
                            return $warn(`Unable to add link to Up Next "${ href }"`);

                        const streamer = await (null
                            ?? ALL_CHANNELS.find(channel => parseURL(channel.href).pathname.equals('/' + name))
                            ?? (null
                                ?? new Search(name).then(Search.convertResults)
                                ?? Promise.reject(`Unable to perform search for "${ name }"`)
                            )
                                .then(search => {
                                    const found = ({
                                        from: 'SEARCH',
                                        href,
                                        icon: (typeof search.icon == 'string' ? Object.assign(new String(search.icon), parseURL(search.icon)) : null),
                                        live: parseBool(search.live),
                                        name: search.name,
                                    });

                                    ALL_CHANNELS = [...ALL_CHANNELS, found].filter(defined).filter(uniqueChannels);

                                    return found;
                                })
                                .catch($warn)
                        );

                        $log("Adding to Up Next [ondrop]:", { href, streamer });

                        if(nullish(streamer?.icon)) {
                            const name = (streamer?.name ?? parseURL(href).pathname?.slice(1));

                            if(defined(name))
                                new Search(name)
                                    .then(Search.convertResults)
                                    .then(streamer => {
                                        const restored = ({
                                            from: 'SEARCH',
                                            href,
                                            icon: (typeof streamer.icon == 'string' ? Object.assign(new String(streamer.icon), parseURL(streamer.icon)) : null),
                                            live: parseBool(streamer.live),
                                            name,
                                        });

                                        ALL_CHANNELS = [...ALL_CHANNELS, restored].filter(defined).filter(uniqueChannels);
                                    });
                        }

                        // Jobs are unknown. Restart timer
                        if(ALL_FIRST_IN_LINE_JOBS.length < 1)
                            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                        // $log('Accessing here... #1');
                        ALL_FIRST_IN_LINE_JOBS = [...ALL_FIRST_IN_LINE_JOBS, href].map(url => url?.toLowerCase?.()).isolate().filter(url => url?.length);

                        Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                        });
                    };

                    FIRST_IN_LINE_BALLOON.icon.onmouseenter ??= event => {
                        let { container, tooltip, title } = FIRST_IN_LINE_BALLOON
                            , offset = getOffset(container);

                        $('div#root > *').append(
                        furnish('.tt-tooltip-layer.tooltip-layer', { style: `transform: translate(${ offset.left }px, ${ offset.top }px); width: 30px; height: 30px; z-index: 9999;` },
                            furnish('.tt-inline-flex.tt-relative.tt-tooltip-wrapper', { 'aria-describedby': tooltip.id, 'show': true },
                                furnish('div', { style: 'width: 30px; height: 30px;' }),
                                tooltip
                            )
                        )
                        );

                        tooltip.modStyle('display:block');
                    };

                    FIRST_IN_LINE_BALLOON.icon.onmouseleave ??= event => {
                        $('div#root .tt-tooltip-layer.tooltip-layer')?.remove();

                        FIRST_IN_LINE_BALLOON.tooltip?.closest('[show]')?.setAttribute('show', false);
                    };

                    FIRST_IN_LINE_SORTING_HANDLER ??= new Sortable(FIRST_IN_LINE_BALLOON.body, {
                        animation: 150,
                        draggable: '[name]',

                        filter: '.tt-static',

                        onUpdate: ({ oldIndex, newIndex }) => {
                            // $log('Old array', [...ALL_FIRST_IN_LINE_JOBS]);

                            const [moved] = ALL_FIRST_IN_LINE_JOBS.splice(--oldIndex, 1);

                            ALL_FIRST_IN_LINE_JOBS.splice(--newIndex, 0, moved);
                            ALL_FIRST_IN_LINE_JOBS = ALL_FIRST_IN_LINE_JOBS.filter(defined);

                            // $log('New array', [...ALL_FIRST_IN_LINE_JOBS]);
                            // $log('Moved', { oldIndex, newIndex, moved });

                            const channel = ALL_CHANNELS.find(channel => RegExp(parseURL(channel.href).pathname + '\\b', 'i').test(moved));

                            if(nullish(channel))
                                return $warn("No channel found:", { oldIndex, newIndex, desiredChannel: channel, givenChannel: moved });

                            // This controls the new due date `NEW_DUE_DATE(time)` when the user drags a channel to the first position
                                // To create a new due date, `NEW_DUE_DATE(time)` → `NEW_DUE_DATE()`
                            if([oldIndex, newIndex].contains(0)) {
                                // `..._TIMER = ` will continue the queue (as if nothing changed) when a channel is removed
                                const first = ALL_CHANNELS.find(channel => RegExp(parseURL(channel.href).pathname + '\\b', 'i').test(FIRST_IN_LINE_HREF = ALL_FIRST_IN_LINE_JOBS[0]));
                                const time = /* FIRST_IN_LINE_TIMER = */ parseInt($(`[name="${ first?.name ?? '' }"i]`)?.getAttribute('time'));

                                $log("New First in Line event:", { ...first, time });

                                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);
                            }

                            // Jobs are URL strings; `.href` passed `undefined`, so reordering never reset the queue
                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                            // $log('Redid First in Line queue [Sorting Handler]...', { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME, FIRST_IN_LINE_HREF });

                            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
                        },
                    });

                    if(Settings.first_in_line_none)
                        FIRST_IN_LINE_BALLOON.container.modStyle('display:none!important');
                    else
                        FIRST_IN_LINE_LISTING_JOB ??= setInterval(async() => {
                            // Set the opacity...
                            // FIRST_IN_LINE_BALLOON.container.modStyle(`opacity:${ (UP_NEXT_ALLOW_THIS_TAB? 1: 0.75) }!important`);

                            for(let index = 0, fails = 0; UP_NEXT_ALLOW_THIS_TAB && index < ALL_FIRST_IN_LINE_JOBS?.length; index++) {
                                let href = ALL_FIRST_IN_LINE_JOBS[index]
                                    , name = parseURL(href).pathname.slice(1)
                                    , channel = await (null
                                        ?? ALL_CHANNELS.find(channel => channel.name.equals(name))
                                        ?? new Search(name).then(Search.convertResults)
                                    );

                                if(nullish(href) || nullish(channel))
                                    continue;

                                const { live } = channel;

                                name = channel.name;

                                if($.defined(`[live][time][name="${ name }"i]`))
                                    continue;

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

                                        $notice(`Removed from Up Next via Sorting Handler (${ nth(index + 1, 'ordinal-position') }):`, removed, "Was it canceled?", event.canceled);

                                        if(event.canceled)
                                            DO_NOT_AUTO_ADD.push(removed);
                                        else if(redo.equals(name))
                                            ALL_FIRST_IN_LINE_JOBS.push(removed);
                                        // Balloon.onremove
                                        if(ALL_FIRST_IN_LINE_JOBS.length)
                                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: (parseURL(ALL_FIRST_IN_LINE_JOBS[0]).searchParameters?.redo ?? '') });

                                        if(index > 0) {
                                            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => event.callback(event.element))
                                        } else {
                                            $log("Destroying current job [Job Listings]...", { FIRST_IN_LINE_HREF, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME });

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
                                            new StopWatch('up_next_balloon__subheader_timer_animation');

                                            const controller = getDOMPath(container);
                                            let timeRemaining = GET_TIME_REMAINING();

                                            timeRemaining = timeRemaining < 0 ? 0 : timeRemaining;

                                            /* First in Line is paused */
                                            if(FIRST_IN_LINE_PAUSED) {
                                                // $remark('Adding time... Subheader Animation');
                                                if(FIRST_IN_LINE_PAUSED_AT.floorToNearest(1e3) === (+new Date).floorToNearest(1e3))
                                                    return;

                                                Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) });
                                                StopWatch.stop('up_next_balloon__subheader_timer_animation', 1000);

                                                return FIRST_IN_LINE_PAUSED_AT = +new Date;
                                            }

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

                                            // Start the first job whenever none is running (see first-in-line.js)
                                            if(index == 0 && (+new Date - (REDO_FIRST_IN_LINE_QUEUE.running?.at ?? 0)) > 5_000 && (+new Date - (REDO_FIRST_IN_LINE_QUEUE.restarted ?? 0)) > 5_000) {
                                                REDO_FIRST_IN_LINE_QUEUE.restarted = +new Date;
                                                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);

                                                $warn("Creating job to avoid [Job Listing] mitigation event", channel);

                                                return StopWatch.stop('up_next_balloon__subheader_timer_animation', 1000), REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = ALL_FIRST_IN_LINE_JOBS[0] ?? channel.href);
                                            }

                                            if(time < 1000)
                                                wait(5000, [container, intervalID]).then(([container, intervalID]) => {
                                                    $log("Mitigation event for [Job Listings]", { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_HREF }, new Date);
                                                    // Mitigate 0 time bug?

                                                    Cache.save({ ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS.filter(href => parseURL(href).pathname.unlike(parseURL(FIRST_IN_LINE_HREF).pathname)), FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE() }, () => {
                                                        $warn(`Timer overdue [animation:first-in-line-balloon--initializer] » ${ FIRST_IN_LINE_HREF }`);
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

                                            subheader.innerHTML = index > 0
                                                ? `${ nth(index + 1, 'ordinal-position') } &mdash; ${ new Date((+new Date) + time + (index * FIRST_IN_LINE_WAIT_TIME * 60_000)).toLocaleTimeString(top.LANGUAGE, { timeStyle: 'short' }) }`
                                                : toTimeString(time, 'clock');

                                            StopWatch.stop('up_next_balloon__subheader_timer_animation', 1000);
                                        }, 1000);
                                    },
                                })
                                ?? [];
                            }

                            FIRST_IN_LINE_BALLOON.counter.setAttribute('length', $.all(`[up-next--body] [time]`).length);
                        }, 1000);
                }
            }, 1000);
    },
});
