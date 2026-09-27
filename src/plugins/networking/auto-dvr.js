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

                                                MASTER_VIDEO.DEFAULT_RECORDING.then(Handlers.__MASTER_AUTO_DVR_HANDLER__);
                                            });
                                        });
                                }
                                // Remove the DVR...
                                else {
                                    message = `${ STREAMER.name } will not be recorded.`;

                                    delete DVRChannels[DVR_ID];

                                    MASTER_VIDEO.DEFAULT_RECORDING?.stop()?.save(DVR_CLIP_PRECOMP_NAME);
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

                                MASTER_VIDEO.DEFAULT_RECORDING.then(Handlers.__MASTER_AUTO_DVR_HANDLER__);
                            });
                        });

                    const leaveHandler = STREAMER.onraid = STREAMER.onhost = top.beforeleaving = top.onlocationchange = async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
                        if(STASH_SAVED)
                            return;
                        STASH_SAVED = true;

                        for(const [guid, { recording }] of Recording.__RECORDERS__)
                            if(recording == MASTER_VIDEO.DEFAULT_RECORDING)
                                recording?.stop()?.save(DVR_CLIP_PRECOMP_NAME);
                            else
                                recording?.stop()?.save();

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
                        const chunks = MASTER_VIDEO.getRecording(Recording.ANY)?.blobs;

                        if(!chunks?.length)
                            return new ClipName(2);

                        const now = new Date;

                        // File Name
                        return [
                            STREAMER.name,
                            now.toLocaleDateString().replace(/[\/\\:\*\?"<>\|]+/g, '-'),
                            `(${ (parseBool(Settings.show_stats) ? toTimeString(chunks.recordingLength, 'short') : ((now.getHours() % 12) || 12) + now.getMeridiem()).replace(/\b(0+[ydhms])+/ig, '') })`,
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

                for(const [guid, { recording }] of Recording.__RECORDERS__)
                    if(recording == MASTER_VIDEO.DEFAULT_RECORDING)
                        recording?.stop()?.save(DVR_CLIP_PRECOMP_NAME);
                    else
                        recording?.stop()?.save();

                const next = await GetNextStreamer();

                $log("Saving current DVR stash. Reason (beforeunload):", { hosting, raiding, raided, leaving: defined(from) }, "Moving onto:", next);
            });
        } catch(error) {
            /* Ignore these errors :P */
        }

        Handlers.__MASTER_AUTO_DVR_HANDLER__ = event => {
            MASTER_VIDEO.DEFAULT_RECORDING?.then(({ target }) => {
                const chunks = target.blobs;
                const feed = null /* No prompt exists for the master recording */
                    , halt = parseBool(feed?.getAttribute('halt'))
                    , name = (feed?.getAttribute('value') || DVR_CLIP_PRECOMP_NAME).replace(GetFileSystem().allIllegalFilenameCharacters, '-');
            })
                ?.stop()
                ?.save(DVR_CLIP_PRECOMP_NAME)
                ?.then(link => alert.silent(`
                <video controller controls
                    title="Video Saved &mdash; ${ link.download }"
                    src="${ link.href }" style="max-width:-webkit-fill-available"
                ></video>
                `)
                );
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
                            ? `\u{1f534} ${ STREAMER.name } - ${ toTimeString((new Date) - MASTER_VIDEO.getRecording(Recording.ANY)?.creationTime, 'clock') }`
                            : `${ STREAMER.name } - Twitch`
                    );
                }, 250);
        }, 1000);

        __AutoDVR__:
        if(parseBool(Settings?.video_clips__dvr)) {
            $remark("Adding DVR functionality...");

            /**
             * Manages the DVR recording during ad breaks by capturing ad chunks and merging them into the main recording.
             * @param {Element} adCountdown - The ad countdown element
             * @returns {void|Promise<void>}
             */
            function HandleAd(adCountdown) {
                const [main, mini] = $.all('video');

                if(false
                    || nullish(main)
                    || !main.hasRecording('AUTO_DVR')
                    || nullish(mini)
                )
                    return when.defined(() => $('[data-a-target*="ad-countdown"i]')).then(HandleAd);

                const blobs = main.getRecording('AUTO_DVR')?.blobs ?? [];

                const InsertChunksAt = blobs.length;

                const AdBreak = Recording.proxy(mini, { name: 'AUTO_DVR:AD_HANDLER', mimeType: main.mimeType });

                AdBreak.then(event => {
                    const chunks = event.target.blobs;

                    $notice(`Adding chunks to main <video> @ ${ InsertChunksAt }`, { blobs, chunks, event });

                    blobs.splice(InsertChunksAt, 0, ...chunks);
                });

                when.nullish(() => $('[data-a-target*="ad-countdown"i]'))
                    .then(() => {
                        const [main, mini] = $.all('video');

                        main?.resumeRecording('AUTO_DVR');
                        mini?.stopRecording('AUTO_DVR:AD_HANDLER');

                        when.defined(() => $('[data-a-target*="ad-countdown"i]'))
                            .then(HandleAd);

                        $notice(`Ad is done playing... ${ toTimeString((new Date) - main?.getRecording('AUTO_DVR')?.creationTime, 'clock') } | ${ (new Date).toJSON() }`, { main, mini, blobs, chunks: mini?.getRecording('AUTO_DVR:AD_HANDLER')?.blobs });
                    });

                main.pauseRecording('AUTO_DVR');

                $notice(`There is an ad playing... ${ toTimeString((new Date) - main.getRecording('AUTO_DVR')?.creationTime, 'clock') } | ${ (new Date).toJSON() }`, { main, mini });
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
                                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: (parseURL(removed).searchParameters?.redo ?? '') });

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
                                            const recordingKey = 'AUTO_DVR:AD_COUNTDOWN';

                                            SetQuality(VideoClips.quality, 'auto').then(() => {
                                                Recording.proxy(MASTER_VIDEO, { name: recordingKey, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats })
                                                    .then(Handlers.__MASTER_AUTO_DVR_HANDLER__);

                                                when(() => MASTER_VIDEO.hasRecording('AUTO_DVR')).then(() => {
                                                    MASTER_VIDEO.cancelRecording(recordingKey, `Master recording ("AUTO_DVR") already exists. Removing "AUTO_DVR:AD_COUNTDOWN"`).removeRecording(recordingKey);
                                                });

                                                wait(5000).then(() => {
                                                    if(!MASTER_VIDEO.hasRecording(recordingKey))
                                                        return;

                                                    MASTER_VIDEO.DEFAULT_RECORDING = MASTER_VIDEO.getRecording(recordingKey);

                                                    MASTER_VIDEO.DEFAULT_RECORDING.then(Handlers.__MASTER_AUTO_DVR_HANDLER__);
                                                });
                                            });
                                        });

                                    const leaveHandler = STREAMER.onraid = STREAMER.onhost = top.beforeleaving = top.onlocationchange = async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
                                        if(STASH_SAVED)
                                            return;
                                        STASH_SAVED = true;

                                        const DVR_ID = STREAMER.name.toLowerCase();

                                        for(const [guid, { recording }] of Recording.__RECORDERS__)
                                            if(recording == MASTER_VIDEO.DEFAULT_RECORDING)
                                                recording?.stop()?.save(DVR_CLIP_PRECOMP_NAME);
                                            else
                                                recording?.stop()?.save();

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
