/*** /plugins/up-next/max-watchtime.js
 * Max Watchtime: a per-channel status, like DVR and Live Reminders. When a marked channel goes live, a tab with Up Next off
 * goes to it right away (no queue, no countdown) and stays until the stream ends (Stay Live moves it on then).
 * - One Twitch tab checks the marked channels every minute (a lock picks it; another tab takes over when it closes)
 * - The background picks the tab (`MaxWatchtime` in background.js): a random channel tab with Up Next off that isn't
 *   already on a marked live channel. None → nothing (it tries again on the next check). Several marked channels live:
 *   first come, first served
 * - The button sits under DVR on the channel's About panel
 */

import { plugin } from '../../lib/plugins.js';

/**
 * The marked channels: `{ login: display name }`.
 * @simply load() → Promise~object
 */
function load() {
    return new Promise(resolve => {
        Cache.load('MaxWatchtime', ({ MaxWatchtime }) => {
            try {
                MaxWatchtime = JSON.parse(MaxWatchtime || '{}');
            } catch {
                // Already an object
            }

            resolve((MaxWatchtime && typeof MaxWatchtime == 'object') ? MaxWatchtime : {});
        });
    });
}

/**
 * The button's title, subtitle and glyph.
 * @simply label(name:string, on:boolean) → array<string>
 */
function label(name, on) {
    return [
        ['Turn Max Watchtime on', `A tab with Up Next off goes to ${ name } as soon as they're live`, 'fire'],
        ['Turn Max Watchtime off', `A tab with Up Next off goes to ${ name } as soon as they're live`, 'leave'],
    ][+!!on];
}

/**
 * The button's glyph, drawn like DVR's.
 * @simply glyph(name:string) → string<SVG>
 */
function glyph(name) {
    return Glyphs.modify(name, { style: 'fill:var(--user-contrast-color)!important', height: '20px', width: '20px' });
}

/**
 * Starts the checker: one Twitch tab at a time (a lock held until the tab closes; the next tab in line takes it).
 * @simply startChecker() → undefined
 */
function startChecker() {
    if(top != window || defined(top.MAX_WATCHTIME_CHECKER) || nullish(navigator.locks))
        return;

    top.MAX_WATCHTIME_CHECKER = navigator.locks.request('tt-max-watchtime', async() => {
        while(true) {
            try {
                if(nullish(Settings.max_watchtime) || parseBool(Settings.max_watchtime)) {
                    const channels = await load()
                        , live = [];

                    for(const login in channels)
                        if(await FetchLiveStatus(login))
                            live.push({ name: login, href: `${ location.origin }/${ login }` });

                    if(Object.keys(channels).length)
                        Runtime.sendMessage({ action: 'MAX_WATCHTIME', live }, placed => {
                            void Runtime.lastError;

                            for(const { name, tab } of placed?.moved ?? [])
                                $remark(`Max Watchtime: ${ name } is live; sent tab #${ tab } to it`);
                        });
                }
            } catch {
                // The extension was reloaded (this page is about to be replaced), or a check failed: try again next time
            }

            await wait(60_000);
        }
    }).catch($ignore);
}

plugin({
    id: 'max_watchtime',
    timer: 1000,

    /**
     * On by default: it does nothing until a channel is marked.
     * @param {object} settings The settings
     * @returns {boolean}
     */
    enabled: settings => nullish(settings.max_watchtime) || parseBool(settings.max_watchtime),

    /**
     * Places the button under DVR on the channel's About panel (and keeps it there).
     * @param {object} context The plugin context
     * @param {StopWatch} context.StopWatch The StopWatch class
     * @returns {Promise<void>}
     */
    async handler({ StopWatch }) {
        new StopWatch('max_watchtime');

        const actionPanel = $('.about-section__actions')
            , login = location.pathname.split('/')[1]?.toLowerCase()
            , name = STREAMER?.name ?? login;

        if(nullish(actionPanel) || !/^\w+$/.test(login ?? '') || RESERVED_TWITCH_PATHNAMES.test(location.pathname))
            return StopWatch.stop('max_watchtime');

        const placed = $('[tt-action="max-watchtime"i]', actionPanel)
            , dvr = $('[tt-action="auto-dvr"i]', actionPanel);

        // Already there: keep it under DVR (DVR's button can come after it)
        if(defined(placed)) {
            if(defined(dvr) && dvr.nextElementSibling != placed)
                dvr.after(placed);

            return StopWatch.stop('max_watchtime');
        }

        const enabled = defined((await load())[login])
            , [title, subtitle, icon] = label(name, enabled)
            , f = furnish;

        // Another run placed it while this one waited
        if($.defined('[tt-action="max-watchtime"i]', actionPanel))
            return StopWatch.stop('max_watchtime');

        const action =
        f('div', { 'tt-action': 'max-watchtime', 'for': login, enabled, 'action-origin': 'foreign', style: `animation:1s fade-in 1;` },
            f('button', {
                onmouseup: async event => {
                    const { currentTarget, button = -1 } = event;

                    if(button)
                        return /* Not the primary button */;

                    const MaxWatchtime = await load()
                        , on = nullish(MaxWatchtime[login])
                        , [title, subtitle, icon] = label(name, on);

                    if(on)
                        MaxWatchtime[login] = name;
                    else
                        delete MaxWatchtime[login];

                    $('.tt-action-icon', currentTarget).innerHTML = glyph(icon);
                    $('.tt-action-title', currentTarget).textContent = title;
                    $('.tt-action-subtitle', currentTarget).textContent = subtitle;
                    currentTarget.closest('[tt-action]').setAttribute('enabled', on);

                    Cache.save({ MaxWatchtime }, () => Settings.set({ MAX_WATCHTIME: Object.keys(MaxWatchtime) })
                        .then(() => alert.timed(on ? `A tab with Up Next off will go to ${ name } as soon as they're live.` : `Max Watchtime is off for ${ name }.`, 7000))
                        .catch($warn)
                    );
                },
            }, f.div(
                f('.tt-action-icon').html(glyph(icon)),
                f.div(
                    f('p.tw-title.tt-action-title').with(title),
                    f('p.tt-action-subtitle').with(subtitle)
                )
            ))
        );

        if(defined(dvr))
            dvr.after(action);
        else
            actionPanel.append(action);

        StopWatch.stop('max_watchtime');
    },

    /**
     * Removes the buttons.
     */
    unhandler() {
        $.all('[tt-action="max-watchtime"i]').map(action => action.remove());
    },

    /**
     * Starts the checker.
     */
    setup() {
        $remark('Adding Max Watchtime...');

        startChecker();
    },
});
