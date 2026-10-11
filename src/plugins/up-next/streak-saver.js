/*** /plugins/up-next/streak-saver.js
 * Streak Saver: lists the Watch Streaks you can still save (you missed a stream; Twitch gives you 24 hours) and saves
 * one with a click. A live channel goes to the front of Up Next (watching it live saves the streak); an offline one opens
 * Twitch's own save page, `/save-streak/<channel>`, which plays one of the channel's clips from the last day.
 *
 * Twitch shows "Your N-stream streak with <channel> is saved!" when it works, and "No Content Eligible" both when there's
 * nothing to save and when its integrity check fails, so the result is always checked against the streak list itself.
 */

import { plugin } from '../../lib/plugins.js';

/**
 * Twitch's persisted GQL queries for Watch Streaks. Their hashes change when Twitch updates its site: a failed query is
 * shown in the list ("Couldn't read your streaks") instead of guessing.
 */
export const STREAK_QUERIES = {
    // { suspendedWatchStreaks: [{ channel: { id, name, displayName }, startedAt, endedAt, expiresAt, state }] }
    suspended: { operationName: 'SuspendedWatchStreaks', sha256Hash: '', variables: {} },
    // Streak values (`value`) per channel
    streaks: { operationName: 'BatchGetWatchStreaks', sha256Hash: '', variables: { filter: 'ALL' } },
};

const POLL_EVERY = 15 * 60_000      // How often the list is read in the background
    , SAVE_TIMEOUT = 90_000         // How long a save page waits for Twitch's answer
    , PENDING_FOR = 3 * 60_000      // How long a click on "Save" marks the channel's next page as a save page
    , LOG_FOR = 86_400_000;         // How long results are kept

/**
 * Runs one of Twitch's persisted GQL queries as the signed-in viewer.
 * @param {{ operationName: string, sha256Hash: string, variables?: object }} query
 * @returns {Promise<object>} The query's `data`
 */
async function gql({ operationName, sha256Hash, variables = {} }) {
    const token = document.cookie.match(/(?:^|;\s*)auth-token=([^;]+)/)?.[1];

    if(!token)
        throw new Error("Not signed in");
    if(!sha256Hash)
        throw new Error(`No query for ${ operationName }`);

    const [json] = await fetchURL('https://gql.twitch.tv/gql', {
        method: 'POST',
        headers: { 'Client-Id': Search.anonID, Authorization: `OAuth ${ token }` },
        body: JSON.stringify([{ operationName, variables, extensions: { persistedQuery: { version: 1, sha256Hash } } }]),
    }).then(response => response.json());

    if(json?.errors?.length)
        throw new Error(`${ operationName }: ${ json.errors.map(error => error?.message ?? error).join('; ') }`);

    return json?.data ?? {};
}

/**
 * Finds the first array stored under `key`, however deep (Twitch nests its answers differently per query).
 * @param {*} value
 * @param {string} key
 * @returns {Array|null}
 */
function findArray(value, key) {
    if(nullish(value) || typeof value != 'object')
        return null;

    if(Array.isArray(value?.[key]))
        return value[key];

    for(const child of Object.values(value)) {
        const found = findArray(child, key);

        if(defined(found))
            return found;
    }

    return null;
}

export const StreakSaver = {
    /**
     * The streaks you can still save, soonest deadline first.
     * @returns {Promise<Array<{ name: string, display: string, expiresAt: number, value: number, live: boolean }>>}
     */
    async list() {
        const data = await gql(STREAK_QUERIES.suspended)
            , suspended = findArray(data, 'suspendedWatchStreaks') ?? [];

        // The streak counts are a nice-to-have: the list works without them
        const values = new Map;

        try {
            for(const streak of findArray(await gql(STREAK_QUERIES.streaks), 'watchStreaks') ?? [])
                if(defined(streak?.channel?.name))
                    values.set(streak.channel.name.toLowerCase(), { value: parseInt(streak.value) | 0, live: defined(streak.channel.stream) });
        } catch(error) {
            $warn("[Streak Saver] Streak counts unavailable:", error);
        }

        return suspended
            .filter(streak => defined(streak?.channel?.name))
            .map(streak => {
                const name = streak.channel.name.toLowerCase()
                    , known = values.get(name);

                return {
                    name,
                    display: streak.channel.displayName || streak.channel.name,
                    expiresAt: +new Date(streak.expiresAt),
                    value: known?.value ?? 0,
                    live: known?.live ?? false,
                };
            })
            .filter(({ expiresAt }) => !(expiresAt < +new Date))
            .sort((a, b) => a.expiresAt - b.expiresAt);
    },

    /**
     * Saves a streak: a live channel goes to the front of Up Next; otherwise Twitch's save page opens in a new tab.
     * @param {{ name: string, display: string, live: boolean }} streak
     */
    async save({ name, display, live }) {
        const href = `https://www.twitch.tv/${ name }`;

        if(live && UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.first_in_line ?? true)) {
            Handlers.first_in_line?.({ href, innerText: `${ display } is live [Streak Saver]` }, 'start');

            return StreakSaver.log({ name, action: 'queued', note: 'live: watching it saves the streak' });
        }

        // The page marks itself as a save page when it loads (Twitch rewrites `/save-streak/<channel>` to `/<channel>`)
        await Cache.load('StreakSaverPending', ({ StreakSaverPending }) =>
            Cache.save({ StreakSaverPending: { ...(StreakSaverPending ?? {}), [name]: +new Date } })
        );

        // Opened from a click, the tab is shown, so its player can start (a tab that has never been shown can't)
        open(`${ href.replace(/\/([^/]+)$/, '/save-streak/$1') }?tool=streak-saver`, '_blank');

        StreakSaver.log({ name, action: 'opened', note: (live ? 'live' : 'save page') });
    },

    /**
     * Keeps a result for a day (shown under the list).
     * @param {{ name: string, action: string, note?: string }} entry
     */
    log(entry) {
        const time = +new Date;

        return Cache.load('StreakSaverLog', ({ StreakSaverLog }) =>
            Cache.save({ StreakSaverLog: [...(StreakSaverLog ?? []).filter(entry => time - entry.time < LOG_FOR), { time, ...entry }].slice(-50) })
        );
    },
};

// Runs once per page: is this tab a save page the viewer asked for?
let CHECKED_SAVE_PAGE, LAST_POLL;

/**
 * On a save page: mutes the player, waits for Twitch's answer, checks the streak list, logs the result and closes the tab.
 * @param {string} name - The channel
 */
async function finishSave(name) {
    $log(`[Streak Saver] Saving the streak with ${ name }...`);

    // Muted through the video, so the clip still plays
    when.defined(() => $('[data-a-target="video-player"i] video')).then(video => video.muted = true);

    const deadline = +new Date + SAVE_TIMEOUT;

    const answer = await when.defined(() => {
        if(+new Date > deadline)
            return when.null;

        const saved = $.all('.tw-snackbar-message').find(message => /\bstreak\b.*\bsaved\b/i.test(message.textContent));
        const none = $.all('.tw-modal h2').find(header => /no content eligible/i.test(header.textContent));

        return (saved ? 'saved' : none ? 'none' : null);
    }, 500).then(answer => answer, () => null);

    // Twitch's answer can be wrong ("No Content Eligible" when its integrity check fails): the list decides
    let stillListed = null;

    try {
        stillListed = (await StreakSaver.list()).some(streak => streak.name == name);
    } catch(error) {
        $warn("[Streak Saver] Unable to check the result:", error);
    }

    const action = (stillListed === false || (stillListed === null && answer == 'saved'))
        ? 'saved'
        : (answer == 'none')
            ? 'not-saved'
            : 'unknown';

    await StreakSaver.log({ name, action, note: ({ saved: 'Twitch: saved', none: 'Twitch: No Content Eligible' })[answer] ?? 'no answer from Twitch' });

    await Cache.load('StreakSaverPending', ({ StreakSaverPending }) => {
        delete StreakSaverPending?.[name];

        return Cache.save({ StreakSaverPending: StreakSaverPending ?? {} });
    });

    // A tab the list opened closes itself after a moment (so Twitch's message can be seen)
    if(action == 'saved' && defined(window.opener))
        wait(4_000).then(() => window.close());
}

/**
 * Builds the list in the Up Next panel, or closes it.
 * @param {MouseEvent} event
 */
async function toggleList(event) {
    const button = event.currentTarget
        , parent = button.closest('[id^="tt-balloon-container"i]')
        , head = $('[up-next--header]')
        , f = furnish;

    if($.defined('#tt-streak-listing')) {
        $('#tt-streak-listing').remove();
        head.innerHTML = "Up Next";

        return;
    }

    // One list at a time: Live Reminders' list takes the same place
    if($.defined('#tt-reminder-listing'))
        $('#live-reminders-catalog')?.click();

    head.innerHTML = "Save Your Streaks";

    const body = f('#tt-streak-listing', { style: 'padding:0.5rem 1rem' }).with(f('p.tt-c-text-alt-2').with('Reading your streaks...'));

    parent.insertBefore(body, $('[up-next--body] > :nth-child(2)'));

    let streaks;

    try {
        streaks = await StreakSaver.list();
    } catch(error) {
        body.replaceChildren(f('p.tt-c-text-alt-2').with(`Couldn't read your streaks (${ error.message ?? error }). Twitch may have changed something; try again later.`));

        return;
    }

    // A key never saved loads as `null`
    const StreakSaverLog = (await Cache.load('StreakSaverLog'))?.StreakSaverLog ?? [];
    const rows = streaks.map(streak => {
        const { name, display, value, live, expiresAt } = streak
            , left = Math.max(0, expiresAt - +new Date)
            , hours = Math.floor(left / 3_600_000)
            , minutes = Math.floor(left % 3_600_000 / 60_000)
            , icon = ALL_CHANNELS?.find(channel => channel?.name?.equals(name))?.icon ?? Runtime.getURL('profile.png');

        return f(`.tt-streak.tt-flex.tt-align-items-center[name="${ name }"]`, { style: 'gap:0.75rem; padding:0.5rem 0; border-bottom:1px solid var(--color-border-base)' },
            f('img.tt-image', { src: icon, style: 'width:3rem; height:3rem; border-radius:50%; flex:none' }),
            f('div', { style: 'flex:1; min-width:0' },
                f(`a[href="/${ name }"]`).with(f.strong(display)),
                f('p.tt-c-text-alt-2').with([
                    (value ? `${ value }-stream streak` : 'Streak'),
                    (live ? 'live now' : null),
                    `resets in ${ hours ? `${ hours }h ` : '' }${ minutes }m`,
                ].filter(defined).join(' · '))
            ),
            f('button.tt-streak-save', {
                style: 'flex:none; padding:0.25rem 1rem; border-radius:var(--ttv-radius-xs); background:var(--user-accent-color, var(--color-background-button-primary-default)); color:var(--color-text-button-primary)',
                title: (live ? "Go to the live stream (Up Next): watching it saves the streak" : "Open Twitch's save page for this streak"),
                onclick: async({ currentTarget }) => {
                    currentTarget.disabled = true;
                    currentTarget.textContent = (live ? "Queued" : "Opened");

                    await StreakSaver.save(streak);
                },
            }).with(live ? 'Watch' : 'Save')
        );
    });

    const recent = StreakSaverLog
        .filter(entry => +new Date - entry.time < LOG_FOR && ['saved', 'not-saved', 'unknown'].includes(entry.action))
        .slice(-5)
        .reverse()
        .map(({ time, name, action, note }) => f('p.tt-c-text-alt-2', { style: 'font-size:smaller' }).with(
            `${ new Date(time).toLocaleTimeString(top.LANGUAGE, { timeStyle: 'short' }) } · ${ name } · ${ ({ saved: 'Saved', 'not-saved': 'Not saved', unknown: 'Unknown' })[action] } (${ note })`
        ));

    body.replaceChildren(
        ...(rows.length ? rows : [f('p.tt-c-text-alt-2').with('No streaks to save right now.')]),
        ...(recent.length ? [f('h5', { style: 'margin-top:0.75rem' }).with('Recent'), ...recent] : [])
    );
}

plugin({
    id: 'streak_saver',
    timer: 5_000,

    init() {
        CHECKED_SAVE_PAGE = false;
    },

    /**
     * Adds the list button to Up Next, finishes a save on a save page, and reads the list every 15 minutes (only to update
     * the button's count; nothing is opened without a click).
     */
    handler: async({ StopWatch }) => {
        new StopWatch('streak_saver');

        // The list button
        if(defined(FIRST_IN_LINE_BALLOON) && $.nullish('#streak-saver-catalog')) {
            const button = FIRST_IN_LINE_BALLOON.addButton({
                attributes: { id: 'streak-saver-catalog', contrast: THEME__PREFERRED_CONTRAST },
                icon: 'trophy',
                left: true,
                onclick: toggleList,
            });

            if(defined(button))
                button.tooltip ??= new Tooltip(button, 'Save Your Streaks');
        }

        // A save page the viewer opened from the list
        if(!CHECKED_SAVE_PAGE && defined(STREAMER?.name)) {
            CHECKED_SAVE_PAGE = true;

            const name = STREAMER.name.toLowerCase()
                , StreakSaverPending = (await Cache.load('StreakSaverPending'))?.StreakSaverPending;

            if(+new Date - (StreakSaverPending?.[name] ?? 0) < PENDING_FOR)
                finishSave(name);
        }

        // The count on the button
        if(UP_NEXT_ALLOW_THIS_TAB && !(+new Date - (LAST_POLL ?? 0) < POLL_EVERY)) {
            LAST_POLL = +new Date;

            StreakSaver.list()
                .then(streaks => {
                    const button = $('#streak-saver-catalog');

                    button?.setAttribute('count', streaks.length);
                    if(defined(button?.tooltip))
                        button.tooltip.innerHTML = (streaks.length ? `Save Your Streaks (${ streaks.length })` : "Save Your Streaks");
                })
                .catch(error => $warn("[Streak Saver]", error));
        }

        StopWatch.stop('streak_saver');
    },

    unhandler() {
        $('#streak-saver-catalog')?.remove();
        $('#tt-streak-listing')?.remove();
    },
});
