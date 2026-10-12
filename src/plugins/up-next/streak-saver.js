/*** /plugins/up-next/streak-saver.js
 * Streak Saver: lists the Watch Streaks you can still save (you missed a stream; Twitch gives you 24 hours) and saves
 * one with a click. A live channel goes to the front of Up Next (watching it live saves the streak); an offline one loads
 * Twitch's own save page, `/save-streak/<channel>`, in a small popup on this page. That page plays one of the channel's
 * clips from the last day, so a channel with no recent clip can't be saved this way (VODs don't count).
 *
 * Twitch shows "Your N-stream streak with <channel> is saved!" when it works, and "No Content Eligible" when there's no
 * clip, when the streak was already saved, or when one of its checks fails; the streak list itself decides.
 */

import { plugin } from '../../lib/plugins.js';

/**
 * Twitch's GQL queries for Watch Streaks, as plain queries (persisted-query hashes change whenever Twitch updates its
 * site). They need the viewer's sign-in, not Twitch's integrity token.
 */
export const STREAK_QUERIES = {
    // The streaks that can still be saved, with their deadline (the missed stream's end + 24 h)
    suspended: `query { suspendedWatchStreaks { expiresAt channel { name displayName } } }`,
    // Every streak's count, and whether the channel is live
    // (`profileImageURL` needs a width in a plain query: without it, the whole query fails)
    streaks: `query { batchGetWatchStreaks(filter: ALL) { value channel { stream { id } owner { login profileImageURL(width: 70) } } } }`,
    // A channel's clips from the last day: what the save page plays
    clips: `query($login: String!) { user(login: $login) { clips(first: 1, criteria: { period: LAST_DAY }) { edges { node { slug } } } } }`,
};

const POLL_EVERY = 15 * 60_000      // How often the list is read in the background (for the button's count)
    , SAVE_TIMEOUT = 90_000         // How long the save page gets to answer
    , LOG_FOR = 86_400_000;         // How long results are kept

/**
 * Runs a GQL query as the signed-in viewer.
 * @param {string} query
 * @param {object} [variables]
 * @returns {Promise<object>} The query's `data`
 */
async function gql(query, variables = {}) {
    const token = document.cookie.match(/(?:^|;\s*)auth-token=([^;]+)/)?.[1];

    if(!token)
        throw new Error("Not signed in");

    const json = await fetchURL('https://gql.twitch.tv/gql', {
        method: 'POST',
        headers: { 'Client-Id': Search.anonID, Authorization: `OAuth ${ token }` },
        body: JSON.stringify({ query, variables }),
    }).then(response => response.json());

    if(json?.errors?.length)
        throw new Error(json.errors.map(error => error?.message ?? error).join('; '));

    return json?.data ?? {};
}

export const StreakSaver = {
    /**
     * The streaks you can still save, soonest deadline first.
     * @returns {Promise<Array<{ name: string, display: string, expiresAt: number, value: number, live: boolean, icon: string, clips: (boolean|null) }>>}
     */
    async list() {
        const { suspendedWatchStreaks = [] } = await gql(STREAK_QUERIES.suspended);

        // The counts, live status and icons are extras: the list works without them
        const known = new Map;

        try {
            const { batchGetWatchStreaks = [] } = await gql(STREAK_QUERIES.streaks);

            for(const { value, channel } of batchGetWatchStreaks ?? [])
                if(defined(channel?.owner?.login))
                    known.set(channel.owner.login.toLowerCase(), { value: parseInt(value) | 0, live: defined(channel.stream), icon: channel.owner.profileImageURL });
        } catch(error) {
            $warn("[Streak Saver] Streak counts unavailable:", error);
        }

        const streaks = (suspendedWatchStreaks ?? [])
            .filter(streak => defined(streak?.channel?.name) && !(+new Date(streak.expiresAt) < +new Date))
            .map(streak => {
                const name = streak.channel.name.toLowerCase()
                    , { value = 0, live = false, icon = Runtime.getURL('profile.png') } = known.get(name) ?? {};

                return { name, display: streak.channel.displayName || streak.channel.name, expiresAt: +new Date(streak.expiresAt), value, live, icon, clips: null };
            })
            .sort((a, b) => a.expiresAt - b.expiresAt);

        // Can the save page save it? Only with a clip from the last day
        await Promise.all(streaks.map(async streak => {
            try {
                streak.clips = ((await gql(STREAK_QUERIES.clips, { login: streak.name }))?.user?.clips?.edges?.length > 0);
            } catch {
                // Unknown: offer the save page anyway
                streak.clips = null;
            }
        }));

        return streaks;
    },

    /**
     * Saves a streak: a live channel goes to the front of Up Next; otherwise Twitch's save page runs in a popup.
     * @param {{ name: string, display: string, live: boolean }} streak
     * @returns {Promise<string>} What happened: `queued`, `saved`, `not-saved` or `unknown`
     */
    async save({ name, display, live }) {
        if(live && UP_NEXT_ALLOW_THIS_TAB) {
            Handlers.first_in_line?.({ href: `https://www.twitch.tv/${ name }`, innerText: `${ display } is live [Streak Saver]` }, 'start');
            await StreakSaver.log({ name, action: 'queued', note: 'live: watching it saves the streak' });

            return 'queued';
        }

        if(live) {
            // No Up Next here: watch it in a new tab
            open(`https://www.twitch.tv/${ name }`, '_blank');
            await StreakSaver.log({ name, action: 'queued', note: 'live: opened in a new tab' });

            return 'queued';
        }

        return StreakSaver.popup({ name, display });
    },

    /**
     * Loads `/save-streak/<channel>` in a popup on this page (same origin, so this page can read it; TTV Tools doesn't run
     * inside frames), mutes it, waits for Twitch's answer, then checks the streak list.
     * @param {{ name: string, display: string }} streak
     * @returns {Promise<string>} `saved`, `not-saved` or `unknown`
     */
    async popup({ name, display }) {
        const f = furnish;

        $('#tt-streak-saver-popup')?.remove();

        const frame = f(`iframe[src="https://www.twitch.tv/save-streak/${ name }"][allow="autoplay"]`, { style: 'width:100%; height:calc(100% - 2.5rem); border:0; border-radius:0 0 var(--ttv-radius-xs) var(--ttv-radius-xs)' })
            , status = f('span').with(`Saving your streak with ${ display }...`)
            , popup = f('#tt-streak-saver-popup', {
                style: 'position:fixed; right:1.5rem; bottom:1.5rem; width:48rem; height:30rem; z-index:99999; background:var(--color-background-base); border:1px solid var(--color-border-base); border-radius:var(--ttv-radius-xs); box-shadow:0 0 2rem #0008; display:flex; flex-direction:column',
            },
                f('.tt-flex.tt-align-items-center', { style: 'justify-content:space-between; height:2.5rem; padding:0 1rem' },
                    status,
                    f('button', { title: "Close", style: 'background:none; color:inherit', onclick: () => popup.remove() }).with('✕')
                ),
                frame
            );

        $.body.append(popup);

        // Read the frame's page until Twitch answers (or the time runs out)
        const deadline = +new Date + SAVE_TIMEOUT;

        const answer = await when.defined(() => {
            if(+new Date > deadline || !popup.isConnected)
                return when.null;

            let page;

            try {
                page = frame.contentDocument;
            } catch {
                // The frame left twitch.tv: it can't be read
                return when.null;
            }

            if(nullish(page))
                return null;

            // Muted through the video, so the clip still plays
            for(const video of page.querySelectorAll('video'))
                video.muted = true;

            if([...page.querySelectorAll('.tw-snackbar-message')].some(message => /\bstreak\b.*\bsaved\b/i.test(message.textContent)))
                return 'saved';
            if([...page.querySelectorAll('.tw-modal h2')].some(header => /no content eligible/i.test(header.textContent)))
                return 'none';

            return null;
        }, 500).then(answer => answer, () => null);

        // Twitch goes on to play the channel's video (and an ad) after answering: keep the frame muted until the popup closes
        const muting = setInterval(() => {
            if(!popup.isConnected)
                return clearInterval(muting);

            try {
                for(const video of frame.contentDocument?.querySelectorAll('video') ?? [])
                    video.muted = true;
            } catch {
                clearInterval(muting);
            }
        }, 250);

        // Twitch's answer isn't the last word: the list is
        let stillListed = null;

        try {
            stillListed = (await gql(STREAK_QUERIES.suspended))?.suspendedWatchStreaks?.some(streak => streak?.channel?.name?.equals(name)) ?? null;
        } catch(error) {
            $warn("[Streak Saver] Unable to check the result:", error);
        }

        const result = (stillListed === false || (stillListed === null && answer == 'saved'))
            ? 'saved'
            : (answer == 'none')
                ? 'not-saved'
                : 'unknown';

        await StreakSaver.log({ name, action: result, note: ({ saved: 'Twitch: saved', none: 'Twitch: No Content Eligible' })[answer] ?? 'no answer from Twitch' });

        status.textContent = ({
            saved: `Your streak with ${ display } is saved!`,
            'not-saved': `${ display }'s streak couldn't be saved (no eligible clip). Watch them live before it resets.`,
            unknown: `No answer from Twitch about ${ display }. Try again later.`,
        })[result];

        wait(result == 'saved' ? 4_000 : 10_000).then(() => popup.remove());

        return result;
    },

    /**
     * Keeps a result for a day (shown under the list).
     * @param {{ name: string, action: string, note?: string }} entry
     */
    async log(entry) {
        const time = +new Date
            , StreakSaverLog = (await Cache.load('StreakSaverLog'))?.StreakSaverLog ?? [];

        return Cache.save({ StreakSaverLog: [...StreakSaverLog.filter(entry => time - entry.time < LOG_FOR), { time, ...entry }].slice(-50) });
    },
};

let LAST_POLL;

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

    // One list at a time: Live Reminders' list takes the same place. It closes (and resets the title) after a moment, so
    // wait for it before setting the title
    if($.defined('#tt-reminder-listing')) {
        $('#live-reminders-catalog')?.click();

        await when.defined(() => ($.nullish('#tt-reminder-listing') || null), 50);
    }

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

    const StreakSaverLog = (await Cache.load('StreakSaverLog'))?.StreakSaverLog ?? [];

    const rows = streaks.map(streak => {
        const { name, display, value, live, expiresAt, icon, clips } = streak
            , left = Math.max(0, expiresAt - +new Date)
            , hours = Math.floor(left / 3_600_000)
            , minutes = Math.floor(left % 3_600_000 / 60_000)
            , canSave = (live || clips !== false);

        return f(`.tt-streak.tt-flex.tt-align-items-center[name="${ name }"]`, { style: 'gap:0.75rem; padding:0.5rem 0; border-bottom:1px solid var(--color-border-base)' },
            f('img.tt-image', { src: icon, style: 'width:3rem; height:3rem; border-radius:50%; flex:none' }),
            f('div', { style: 'flex:1; min-width:0' },
                f(`a[href="/${ name }"]`).with(f.strong(display)),
                f('p.tt-c-text-alt-2').with([
                    (value ? `${ value }-stream streak` : 'Streak'),
                    (live ? 'live now' : null),
                    `resets in ${ hours ? `${ hours }h ` : '' }${ minutes }m`,
                    (canSave ? null : 'no clip from the last day yet: watch live to save it'),
                ].filter(defined).join(' · '))
            ),
            f('button.tt-streak-save', {
                disabled: !canSave,
                style: `flex:none; padding:0.25rem 1rem; border-radius:var(--ttv-radius-xs); background:var(--user-accent-color, var(--color-background-button-primary-default)); color:var(--color-text-button-primary); opacity:${ canSave ? 1 : 0.5 }`,
                title: (live ? "Go to the live stream (Up Next): watching it saves the streak" : canSave ? "Play a recent clip with Twitch's save page" : "Twitch can only save it with a clip from the last day"),
                onclick: async({ currentTarget }) => {
                    currentTarget.disabled = true;
                    currentTarget.textContent = (live ? "Queued" : "Saving...");

                    const result = await StreakSaver.save(streak);

                    currentTarget.textContent = ({ queued: 'Queued', saved: 'Saved', 'not-saved': 'Not saved', unknown: 'Try again' })[result] ?? "Done";
                    currentTarget.disabled = (result != 'unknown');
                },
            }).with(live ? 'Watch' : 'Save')
        );
    });

    const recent = StreakSaverLog
        .filter(entry => +new Date - entry.time < LOG_FOR && ['saved', 'not-saved', 'unknown', 'queued'].includes(entry.action))
        .slice(-5)
        .reverse()
        .map(({ time, name, action, note }) => f('p.tt-c-text-alt-2', { style: 'font-size:smaller' }).with(
            `${ new Date(time).toLocaleTimeString(top.LANGUAGE, { timeStyle: 'short' }) } · ${ name } · ${ ({ saved: 'Saved', 'not-saved': 'Not saved', unknown: 'Unknown', queued: 'Watching live' })[action] } (${ note })`
        ));

    body.replaceChildren(
        ...(rows.length ? rows : [f('p.tt-c-text-alt-2').with('No streaks to save right now.')]),
        ...(recent.length ? [f('h5', { style: 'margin-top:0.75rem' }).with('Recent'), ...recent] : [])
    );
}

plugin({
    id: 'streak_saver',
    timer: 5_000,

    /**
     * Adds the list button to Up Next, and reads the list every 15 minutes for the button's count (nothing is saved
     * without a click).
     */
    handler: async({ StopWatch }) => {
        new StopWatch('streak_saver');

        if(defined(FIRST_IN_LINE_BALLOON) && $.nullish('#streak-saver-catalog')) {
            const button = FIRST_IN_LINE_BALLOON.addButton({
                attributes: { id: 'streak-saver-catalog', contrast: THEME__PREFERRED_CONTRAST },
                icon: 'fire',
                left: true,
                onclick: toggleList,
            });

            if(defined(button))
                button.tooltip ??= new Tooltip(button, 'Save Your Streaks');
        }

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
        $('#tt-streak-saver-popup')?.remove();
    },
});
