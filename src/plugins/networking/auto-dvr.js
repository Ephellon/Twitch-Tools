/*** /plugins/networking/auto-dvr.js
 * Auto DVR.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'video_clips__dvr',

    /**
     * Installs the Auto-DVR feature, adding recording controls to the channel about section.
     * @param {Object} context - The plugin context
     * @param {StopWatch} context.StopWatch - The StopWatch class for timing operations
     * @returns {Promise<void>}
     */
    async install({ StopWatch }) {
        let AUTO_DVR__CHECKING;
        let AUTO_DVR__CHECKING_INTERVAL;

        MASTER_VIDEO = $('[data-a-player-state] video');

        // Recordings a closed or crashed tab didn't save: offer them once (one tab asks; the others skip)
        Recording.cleanup()
            .then(() => navigator.locks?.request('tt-recordings:recovery', { ifAvailable: true }, async lock => {
                if(!lock)
                    return;

                for(const leftover of await Recording.leftovers())
                    await confirm.silent(`
                        <input hidden controller
                            icon="\uD83D\uDCBE\uFE0F" title="Unsaved recording"
                            okay="${ encodeHTML(Glyphs.modify('download', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Save"
                            deny="${ encodeHTML(Glyphs.modify('trash', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Discard"
                        />
                        This recording wasn't saved before its tab closed: <strong>${ encodeHTML(leftover.as ?? leftover.name ?? 'Recording') }</strong> (${ leftover.size.suffix('B', 2) })`
                    )
                        .then(answer => answer === false ? leftover.discard() : answer ? leftover.save() : null)
                        .catch($warn);
            }))
            .catch($warn);

        // Might take a few seconds to fulfill...
        when.defined(() => $('[data-a-player-state] video')).then(_ => MASTER_VIDEO = _);

        Handlers.video_clips__dvr = () => {
            new StopWatch('video_clips__dvr');

            // Add the button to all channels
            const actionPanel = $('.about-section__actions');

            if(nullish(actionPanel))
                return StopWatch.stop('video_clips__dvr');

            Cache.load('DVRChannels', async({ DVRChannels }) => {
                try {
                    DVRChannels = JSON.parse(DVRChannels || '{}');
                } catch(error) {
                    // Probably an object already...
                    DVRChannels ??= {};
                }

                let f = furnish
                    , s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s")
                    , DVR_ID = STREAMER.name.toLowerCase()
                    , enabled = parseBool(DVRChannels[DVR_ID]?.length)
                    , [title, subtitle, icon] = [
                        ['Turn DVR on', `${ s(STREAMER.name) } live streams will be recorded`, 'host'],
                        ['Turn DVR off', `${ s(STREAMER.name) } live streams will no longer be recorded`, 'clip']
                    ][+!!enabled];

                icon = Glyphs.modify(icon, { style: 'fill:var(--user-contrast-color)!important', height: '20px', width: '20px' });

                // Create the action button...
                const action =
                    f('div', { 'tt-action': 'auto-dvr', 'for': DVR_ID, enabled, 'action-origin': 'foreign', style: `animation:1s fade-in 1;` },
                    f('button', {
                        onmouseup: async event => {
                            const { currentTarget, isTrusted = false, button = -1 } = event;

                            if(button)
                                return /* Not the primary button */;

                            Cache.load('DVRChannels', async({ DVRChannels }) => {
                                try {
                                    DVRChannels = JSON.parse(DVRChannels || '{}');
                                } catch(error) {
                                    // Probably an object already...
                                    DVRChannels ??= {};
                                }

                                /**
                                 * Converts a string to its possessive form.
                                 * @param {string} string - The string to modify
                                 * @returns {string} The possessive version of the string
                                 */
                                let s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s")
                                    , DVR_ID = STREAMER.name.toLowerCase()
                                    , enabled = !parseBool(DVRChannels[DVR_ID]?.length)
                                    , [title, subtitle, icon] = [
                                        ['Turn DVR on', `${ s(STREAMER.name) } live streams will be recorded`, 'host'],
                                        ['Turn DVR off', `${ s(STREAMER.name) } live streams will no longer be recorded`, 'clip']
                                    ][+!!enabled];

                                icon = Glyphs.modify(icon, { style: 'fill:var(--user-contrast-color)!important', height: '20px', width: '20px' });

                                $('.tt-action-icon', currentTarget).innerHTML = icon;
                                $('.tt-action-title', currentTarget).textContent = title;
                                $('.tt-action-subtitle', currentTarget).textContent = subtitle;

                                // Add the DVR...
                                let message;

                                if(enabled) {
                                    message = `${ s(STREAMER.name) } streams will be recorded.`;

                                    DVRChannels[DVR_ID] = DVR_CLIP_PRECOMP_NAME;

                                    when.nullish(() => $('[data-a-target*="ad-countdown"i]'))
                                        .then(() => {
                                            SetQuality(VideoClips.quality, 'auto').then(() => {
                                                MASTER_VIDEO.DEFAULT_RECORDING = Recording.proxy(MASTER_VIDEO, { name: 'AUTO_DVR', as: DVR_CLIP_PRECOMP_NAME, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats });

                                                MASTER_VIDEO.DEFAULT_RECORDING.done.then(Handlers.__MASTER_AUTO_DVR_HANDLER__).catch($warn);
                                            });
                                        });
                                }
                                // Remove the DVR...
                                else {
                                    message = `${ STREAMER.name } will not be recorded.`;

                                    delete DVRChannels[DVR_ID];

                                    // The DVR's handler saves it once the last chunk is in
                                    MASTER_VIDEO.DEFAULT_RECORDING?.stop();
                                }

                                currentTarget.closest('[tt-action]').setAttribute('enabled', enabled);

                                // @FIXME: Live Reminder alerts will not display if another alert is present...
                                Cache.save({ DVRChannels }, () => Settings.set({ 'DVR_CHANNELS': Object.keys(DVRChannels) }).then(() => parseBool(message) && alert.timed(message, 7000)).catch($warn));
                            });
                        },
                    }, f.div(
                        f('.tt-action-icon').html(icon),
                        f.div(
                            f('p.tw-title.tt-action-title').with(title),
                            f('p.tt-action-subtitle').with(subtitle)
                        )
                    ))
                    );

                actionPanel.append(action);

                // Run DVR if enabled...
                if(enabled && !STREAMER.redo) {
                    when.nullish(() => $('[data-a-target*="ad-countdown"i]'))
                        .then(() => {
                            SetQuality(VideoClips.quality, 'auto').then(() => {
                                MASTER_VIDEO.DEFAULT_RECORDING = Recording.proxy(MASTER_VIDEO, { name: 'AUTO_DVR', mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats });

                                MASTER_VIDEO.DEFAULT_RECORDING.done.then(Handlers.__MASTER_AUTO_DVR_HANDLER__).catch($warn);
                            });
                        });

                    const leaveHandler = STREAMER.onraid = STREAMER.onhost = top.beforeleaving = top.onlocationchange = async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
                        if(STASH_SAVED)
                            return;
                        STASH_SAVED = true;

                        // The DVR's handler saves it; anything else is saved here. What doesn't finish is offered on the next load
                        for(const recording of Recording.list({ active: true }))
                            if(recording == MASTER_VIDEO.DEFAULT_RECORDING)
                                recording.stop();
                            else
                                recording.stop().save().catch($warn);

                        const next = await GetNextStreamer();

                        $log("Saving current DVR stash. Reason (DVR leave handler):", { hosting, raiding, raided, leaving: defined(from) }, "Moving onto:", next);
                    };

                    $.on('focusin', event => {
                        const DVR_ID = STREAMER.name.toLowerCase();

                        if(top.focusedin)
                            return;
                        top.focusedin = true;
                        top.addEventListener('beforeunload', leaveHandler);

                        // top.addEventListener('visibilitychange', leaveHandler);
                    });
                }

                // @performance
                PrepareForGarbageCollection(DVRChannels);
            });

            StopWatch.stop('video_clips__dvr');
        };

        Timers.video_clips__dvr = -2_500;

        try {
            Object.defineProperties(top, {
                DVR_CLIP_PRECOMP_NAME: {
                    get() {
                        const recording = MASTER_VIDEO?.DEFAULT_RECORDING ?? Recording.find(Recording.ANY);

                        if(!recording?.size)
                            return new ClipName(2);

                        const now = new Date;

                        // File Name
                        return [
                            STREAMER.name,
                            now.toLocaleDateString().replace(/[\/\\:\*\?"<>\|]+/g, '-'),
                            `(${ (parseBool(Settings.show_stats) ? toTimeString(recording.duration, 'short') : ((now.getHours() % 12) || 12) + now.getMeridiem()).replace(/\b(0+[ydhms])+/ig, '') })`,
                        ]
                            .filter(s => s?.length)
                            .map(s => s.trim())
                            .join(' ');
                    },
                },
            });

            top.addEventListener('beforeunload', async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
                if(STASH_SAVED)
                    return;
                STASH_SAVED = true;

                // The DVR's handler saves it; anything else is saved here. What doesn't finish is offered on the next load
                for(const recording of Recording.list({ active: true }))
                    if(recording == MASTER_VIDEO.DEFAULT_RECORDING)
                        recording.stop();
                    else
                        recording.stop().save().catch($warn);

                const next = await GetNextStreamer();

                $log("Saving current DVR stash. Reason (beforeunload):", { hosting, raiding, raided, leaving: defined(from) }, "Moving onto:", next);
            });
        } catch(error) {
            /* Ignore these errors :P */
        }

        // Saves a finished DVR recording and shows it (`recording.done` resolves `{ target: recording }`)
        Handlers.__MASTER_AUTO_DVR_HANDLER__ = ({ target: recording } = {}) => {
            recording ??= MASTER_VIDEO.DEFAULT_RECORDING;

            return recording
                ?.save(DVR_CLIP_PRECOMP_NAME.replace(GetFileSystem().allIllegalFilenameCharacters, '-'))
                ?.then(link => alert.silent(`
                <video controller controls
                    title="Video Saved &mdash; ${ link.download }"
                    src="${ link.href }" style="max-width:-webkit-fill-available"
                ></video>
                `)
                )
                ?.catch($warn);
        };

        Unhandlers.video_clips__dvr = () => {
            const DVR_ID = STREAMER.name.toLowerCase();

            MASTER_VIDEO.DEFAULT_RECORDING?.stop();
        };

        setInterval(() => {
            if(nullish(top.titleInterval))
                top.titleInterval = setInterval(() => {
                    document.title = (
                        MASTER_VIDEO.hasRecording(Recording.ANY)
                            ? `\u{1f534} ${ STREAMER.name } - ${ toTimeString(Recording.find(Recording.ANY, MASTER_VIDEO)?.duration, 'clock') }`
                            : `${ STREAMER.name } - Twitch`
                    );
                }, 250);
        }, 1000);

        __AutoDVR__:
        if(parseBool(Settings?.video_clips__dvr)) {
            $remark("Adding DVR functionality...");

            /**
             * Pauses the DVR while an ad plays and resumes it after, so the file holds no ad footage (one clean file).
             * @returns {Promise<void>}
             */
            function HandleAd() {
                const recording = Recording.find('AUTO_DVR');
                const paused = (recording?.state == 'recording');

                if(paused) {
                    recording.pause();
                    $notice(`There is an ad playing... DVR paused at ${ toTimeString(recording.duration, 'clock') }`);
                }

                return when.nullish(() => $('[data-a-target*="ad-countdown"i]'))
                    .then(() => {
                        if(paused) {
                            recording.resume();
                            $notice(`Ad is done playing... DVR resumed`);
                        }

                        return when.defined(() => $('[data-a-target*="ad-countdown"i]')).then(HandleAd);
                    });
            }

            when.defined(() => $('[data-a-target*="ad-countdown"i]'))
                .then(HandleAd);

            // This is where the magic happens
                // Begin looking for DVR channels...
            AUTO_DVR__CHECKING_INTERVAL =
                setInterval(AUTO_DVR__CHECKING ??= () => {
                    new StopWatch('video_clips__dvr__checking_interval');

                    if(UP_NEXT_ALLOW_THIS_TAB)
                        Cache.load('DVRChannels', async({ DVRChannels }) => {
                            try {
                                DVRChannels = JSON.parse(DVRChannels || '{}');
                            } catch(error) {
                                // Probably an object already...
                                DVRChannels ??= {};
                            }

                            checking:
                            // Only check for the stream when it's live; if the dates don't match, it just went live again
                            for(const DVR_ID in DVRChannels) {
                                const streamer = (DVR_ID + '').toLowerCase();
                                let channel = await new Search(streamer).then(Search.convertResults)
                                    , ok = parseBool(channel?.ok);

                                // Search did not complete...
                                let num = 3;

                                while(!ok && num-- > 0) {

                                    Search.void(streamer);

                                    // @research
                                    channel = await new Search(streamer).then(Search.convertResults);
                                    ok = parseBool(channel?.ok);

                                    // $warn(`Re-search, ${ num } ${ 'retry'.pluralSuffix(num) } left [DVR]: "${ streamer }" → OK = ${ ok }`);
                                }

                                if(!num && !ok) {
                                    channel = ALL_CHANNELS.find(channel => channel.name.equals(DVR_ID));

                                    if(nullish(channel?.name))
                                        continue checking;
                                }

                                if(!parseBool(channel.live)) {
                                    // @performance
                                    PrepareForGarbageCollection(channel, DVRChannels);

                                    continue checking;
                                }

                                let { name, live, icon, href, data = { actualStartTime: null } } = channel
                                    , slug = DVRChannels[name.toLowerCase()]
                                    , enabled = defined(slug);

                                const index = (ALL_FIRST_IN_LINE_JOBS.findIndex(href => parseURL(href).pathname.slice(1).equals(name)))
                                    , job = ALL_FIRST_IN_LINE_JOBS[index];

                                if(defined(job) && name.unlike(STREAMER.name) && enabled) {
                                    // Skip the queue!
                                    const [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1)
                                        , name = parseURL(removed).pathname.slice(1);

                                    $notice(`Skipper work:`, removed);

                                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(FIRST_IN_LINE_TIMER);

                                    // Skipper
                                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: (parseURL(ALL_FIRST_IN_LINE_JOBS[0]).searchParameters?.redo ?? '') });

                                    Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                                        $log("Skipping queue in favor of a DVR channel", job);

                                        goto(parseURL(job).addSearch({ dvr: true }).href);
                                    });
                                }

                            } // :checking

                            // Send the length to the settings page
                            Settings.set({ 'DVR_CHANNELS': Object.keys(DVRChannels) });

                            StopWatch.stop('video_clips__dvr__checking_interval', 30_000);

                            // @performance
                            PrepareForGarbageCollection(DVRChannels);
                        });
                }, 30_000);

            // Add the panel & button
            let actionPanel = $('.about-section__actions');

            if(nullish(actionPanel)) {
                actionPanel = furnish('.about-section__actions', { style: `padding-left: 2rem; margin-bottom: 3rem; width: 24rem;` });

                $('.about-section')?.append?.(actionPanel);
            } else {
                for(const child of actionPanel.children)
                    child.setAttribute('action-origin', 'native');
            }

            // Pause Up Next and handle DVR events
            if(false
                || parseBool(parseURL(top.location.href).searchParameters?.dvr)
                || STREAMER?.redo === false
            )
                Cache.load('DVRChannels', async({ DVRChannels }) => {
                    try {
                        DVRChannels = JSON.parse(DVRChannels || '{}');
                    } catch(error) {
                        // Probably an object already...
                        DVRChannels ??= {};
                    }

                    for(const DVR_ID in DVRChannels) {
                        const streamer = (DVR_ID + '').toLowerCase();

                        if(parseBool(DVRChannels[DVR_ID]) && [STREAMER.name, STREAMER.sole].map(s => (s + '').toLowerCase()).contains(streamer))
                            when.defined(() => $('#up-next-control'))
                                .then(button => {
                                    const paused = parseBool(button.getAttribute('paused'));

                                    if(paused)
                                        return;

                                    button?.click();
                                })
                                .then(() => {
                                    if(compareVersions(`${ Manifest.version } ≥ 5.33.0.8`)) // @deprecated
                                        confirm.silent(`<div hidden controller deny="Why?" okay="Acknowledge (interact)" title="${ STREAMER.name } &mdash; DVR Notice"></div>
                                            To guarantee DVRs save when this page navigates to another stream (or reloads unexpectedly), you must interact with this page.
                                        `)
                                            .then(answer => {
                                                if(!answer)
                                                    open('https://developer.mozilla.org/en-US/docs/Web/Security/User_activation', '_blank');
                                            });

                                    if(parseBool($('[data-recording-status]')?.getAttribute('data-recording-status')))
                                        new Tooltip($('[data-recording-status]'), `Recording this stream: ${ STREAMER.name }`);

                                    // Extra handler. This is suppose to handle ad-recording. But it's above (see `enabled && !STREAMER.redo`)
                                    if(MASTER_VIDEO.hasRecording('AUTO_DVR'))
                                        return /* Already recording over ads... */;

                                    when.nullish(() => $('[data-a-target*="ad-countdown"i]'))
                                        .then(() => {
                                            SetQuality(VideoClips.quality, 'auto').then(() => {
                                                // Another start (the channel panel's) may have begun meanwhile
                                                if(MASTER_VIDEO.hasRecording('AUTO_DVR'))
                                                    return;

                                                MASTER_VIDEO.DEFAULT_RECORDING = Recording.proxy(MASTER_VIDEO, { name: 'AUTO_DVR', mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats });

                                                MASTER_VIDEO.DEFAULT_RECORDING.done.then(Handlers.__MASTER_AUTO_DVR_HANDLER__).catch($warn);
                                            });
                                        });

                                    const leaveHandler = STREAMER.onraid = STREAMER.onhost = top.beforeleaving = top.onlocationchange = async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
                                        if(STASH_SAVED)
                                            return;
                                        STASH_SAVED = true;

                                        const DVR_ID = STREAMER.name.toLowerCase();

                                        // The DVR's handler saves it; anything else is saved here. What doesn't finish is offered on the next load
                                        for(const recording of Recording.list({ active: true }))
                                            if(recording == MASTER_VIDEO.DEFAULT_RECORDING)
                                                recording.stop();
                                            else
                                                recording.stop().save().catch($warn);

                                        const next = await GetNextStreamer();

                                        $log("Saving current DVR stash. Reason (panel leave handler):", { hosting, raiding, raided, leaving: defined(from) }, "Moving onto:", next);
                                    };

                                    $.on('focusin', event => {
                                        const DVR_ID = STREAMER.name.toLowerCase();

                                        if(top.focusedin)
                                            return;
                                        top.focusedin = true;
                                        top.addEventListener('beforeunload', leaveHandler);

                                        // top.addEventListener('visibilitychange', leaveHandler);
                                    });
                                });
                    }

                    // @performance
                    PrepareForGarbageCollection(DVRChannels);
                });

            AUTO_DVR__CHECKING?.();
            RegisterJob('video_clips__dvr');
        } // :__AutoDVR__
    },
});
