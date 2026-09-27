/*** /plugins/video-recovery/recover-frames.js
 * Recover Frames.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let SECONDS_VIDEO_PAUSED_UNSAFELY, VIDEO_CREATION_TIME, TOTAL_VIDEO_FRAMES, PAGE_HAS_FOCUS, VIDEO_OVERRIDE, FRAME_HASH_ALLOWED, PREVIOUS_FRAME_HASH;

plugin({
    id: 'recover_frames',
    timer: 1000,

    /**
     * Initializes the state and constants for the video frame recovery system.
     */
    init() {
        SECONDS_VIDEO_PAUSED_UNSAFELY = 0;
        VIDEO_CREATION_TIME = void null;
        TOTAL_VIDEO_FRAMES = void null;
        PAGE_HAS_FOCUS = document.visibilityState.equals('visible');
        VIDEO_OVERRIDE = false;
        FRAME_HASH_ALLOWED = (navigator.deviceMemory ?? 0) > 1;
        PREVIOUS_FRAME_HASH = void null;
    },

    /**
     * Runs every tick: Monitors the video for stalling frames or playback lag and attempts to recover by replacing the video with an embedded player if enabled.
     * @param {Object} context - Contains the StopWatch utility
     */
    handler: ({ StopWatch }) => {
        new StopWatch('recover_frames');

        const video = $('video') ?? $('video', $('#tt-embedded-video')?.contentDocument);

        if(nullish(video))
            return StopWatch.stop('recover_frames');

        let { paused } = video
            , isTrusted = $.defined('button[data-a-player-state="paused"i]')
            , isAdvert = $.defined('[data-a-target*="ad-countdown"i]')
            , { creationTime, totalVideoFrames } = video.getVideoPlaybackQuality()
            , cframe = () => ($.defined('#tt-embedded-video') ? performance.now() : FRAME_HASH_ALLOWED ? UUID.from($('video').captureFrame()).value : null);

        // Time that's passed since creation. Should constantly increase
        VIDEO_CREATION_TIME ??= creationTime;

        // The total number of frames created. Should constantly increase
        TOTAL_VIDEO_FRAMES ??= totalVideoFrames;

        // The frame's hash. Used to detect black screens
        PREVIOUS_FRAME_HASH ??= cframe();

        // if the page isn't in focus, ignore this setting
        // if the video is paused by the user (trusted) move on
        if((paused && isTrusted) || PAGE_HAS_FOCUS === false)
            return StopWatch.stop('recover_frames');

        // The video is stalling: either stuck on the same frame, or lagging behind 15 frames
        if(true
            && (false
                || (creationTime !== VIDEO_CREATION_TIME)
                || (PREVIOUS_FRAME_HASH === cframe())
            )
            && (false
                || (totalVideoFrames === TOTAL_VIDEO_FRAMES)
                || (totalVideoFrames - TOTAL_VIDEO_FRAMES < 15)
            )
        ) {
            if(SECONDS_VIDEO_PAUSED_UNSAFELY > 0 && !(SECONDS_VIDEO_PAUSED_UNSAFELY % 5))
                $warn(`The video has been stalling for ${ SECONDS_VIDEO_PAUSED_UNSAFELY }s`, { VIDEO_CREATION_TIME, TOTAL_VIDEO_FRAMES, SECONDS_VIDEO_PAUSED_UNSAFELY }, "Frames fallen behind:", totalVideoFrames - TOTAL_VIDEO_FRAMES);

            // Give each recovery attempt 10s before the next one (#31)
            if(SECONDS_VIDEO_PAUSED_UNSAFELY > 5 && !(SECONDS_VIDEO_PAUSED_UNSAFELY % 10)) {
                __RecoverFrames_Embed__:
                if(parseBool(Settings.recover_frames__allow_embed)) {
                    $warn(`Attempting to override the video`);
                    $('#tt-embedded-video')?.remove();

                    const container = $('video')?.closest('[class*="container"i]');

                    if(nullish(container))
                        break __RecoverFrames_Embed__;

                    let { name } = STREAMER
                        , controls = true
                        , iframe;

                    container.insertAdjacentElement('afterbegin', iframe =
                        furnish(`iframe#tt-embedded-video`, {
                            allow: 'autoplay',
                            src: parseURL(`https://player.twitch.tv/`).addSearch({
                                channel: name,
                                parent: 'twitch.tv',
                                [video.muted ? 'muted' : 'volume']: video[video.muted ? 'muted' : 'volume'],

                                controls,
                            }).href,

                            style: `border: 1px solid var(--color-warn); position:absolute; top:0; z-index:99999;`,

                            height: '100%',
                            width: '100%',

                            onload(event) {
                                when.defined(() => {
                                    const iDocument = $('#tt-embedded-video')?.contentDocument;

                                    if(nullish(iDocument))
                                        return /* No iframe document */;

                                    const iVideo = $('video', iDocument), video = $('video');

                                    if(nullish(iVideo))
                                        return /* No iframe video */;

                                    if((iVideo.currentTime || 0) <= 0)
                                        return /* iframe video not loading */;

                                    // Continue recordings...
                                    for(const [key, { recording }] of video.getRecording(Recording.ALL)) {
                                        let { name, as, maxTime } = recording;

                                        maxTime = parseFloat(maxTime);
                                        maxTime = maxTime < 0 ? Infinity : maxTime;

                                        if(!/^\[\[(.+)\]\]$/.test(key)) {
                                            recording.save();
                                            Recording.proxy(iVideo, { name, as, maxTime }).then(event => {
                                                const { target } = event;
                                                const { recording } = target;
                                                const { name, as } = recording;

                                                if(name.startsWith('AUTO_DVR'))
                                                    Handlers.__MASTER_AUTO_DVR_HANDLER__.call(target, event);
                                                else
                                                    recording.save(as);
                                            });
                                        }
                                    }

                                    return VIDEO_OVERRIDE = true;
                                }, 2_5_0);
                            },
                        })
                    );

                    $('video').muted = true;
                    $('video', container).modStyle(`display:none`);
                    $('[data-a-player-state]')?.setTooltip(`${ name }'${ /s$/.test(name) ? '' : 's' } stream ran into an error`);
                } else {
                    $warn(`Attempting to pause/play the video`);

                    if($('button[data-a-player-state]')?.dataset?.aPlayerState?.equals('playing')) {
                        $('button[data-a-player-state]').click();

                        wait(1000).then(() => $('button[data-a-player-state]')?.click());
                    }
                } // :__RecoverFrames_Embed__
            }

            // Try constantly overwriting to see if the video plays
            // VIDEO_CREATION_TIME = creationTime; // Keep this from becoming true to force a re-run
            TOTAL_VIDEO_FRAMES = totalVideoFrames;
            PREVIOUS_FRAME_HASH = cframe();

            ++SECONDS_VIDEO_PAUSED_UNSAFELY;

            video.stalling = true;
        }
        // The video is playing
        else {
            // Start over
            VIDEO_CREATION_TIME = creationTime;
            TOTAL_VIDEO_FRAMES = totalVideoFrames;
            PREVIOUS_FRAME_HASH = cframe();

            video.stalling = false;

            // Reset the timer whenever the video is recovered
            return SECONDS_VIDEO_PAUSED_UNSAFELY = 0;
        }

        if(SECONDS_VIDEO_PAUSED_UNSAFELY > 30)
            ReloadPage();

        StopWatch.stop('recover_frames');
    },

    /**
     * Initializes the frame recovery feature by setting up a page visibility listener and registering the recovery job.
     */
    setup() {
        $.on('visibilitychange', event => PAGE_HAS_FOCUS = document.visibilityState.equals('visible'));

        RegisterJob('recover_frames');

        $warn("[Recover-Frames] is monitoring the stream...");
    },
});
