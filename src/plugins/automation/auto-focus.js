/*** /plugins/automation/auto-focus.js
 * Auto-Focus.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let CAPTURE_HISTORY, CAPTURE_INTERVAL, POLL_INTERVAL, STALLED_FRAMES, POSITIVE_TREND;

// Paused by the viewer for this page (#60): no screenshots, no changes (#61). Survives re-inits, not reloads
let AUTO_FOCUS_HELD = false;

/**
 * Whether Auto-Focus still controls anything on this page: Up Next (this tab owns it and the viewer didn't pause it)
 * or Easy Lurk (the viewer didn't toggle it). With neither, it has nothing to do (#62).
 * @returns {boolean}
 */
function autoFocusHasWork() {
    const upNext = $('#up-next-control')
        , lurk = $('#away-mode');

    return false
        || (UP_NEXT_ALLOW_THIS_TAB && defined(upNext) && upNext.getAttribute('paused-by') != 'user')
        || (defined(lurk) && lurk.getAttribute('toggled-by') != 'user');
}

plugin({
    id: 'auto_focus',
    timer: -1000,

    /**
     * Initializes state variables for the auto-focus monitoring system.
     */
    init() {
        CAPTURE_HISTORY = [];
        CAPTURE_INTERVAL = void null;
        POLL_INTERVAL = void null;
        STALLED_FRAMES = void null;
        POSITIVE_TREND = void null;
    },

    /**
     * Runs the auto-focus monitoring loop, capturing and comparing video frames to detect movement and optionally displaying analysis statistics on the UI.
     */
    handler: () => {
        let detectionThreshold = (parseInt(Settings.auto_focus_detection_threshold) || STREAMER.mark).clamp(5, 75)
            , pollInterval = parseInt(Settings.auto_focus_poll_interval)
            , imageType = Settings.auto_focus_poll_image_type
            , detectedTrend = '&bull;';

        POLL_INTERVAL ??= pollInterval * 1000;
        STALLED_FRAMES = 0;

        if(CAPTURE_HISTORY.length > 90)
            CAPTURE_HISTORY.shift();

        CAPTURE_INTERVAL = setInterval(() => {
            // Paused by the viewer (#61), or nothing left to control (#62): take no screenshots at all
            const resting = (AUTO_FOCUS_HELD ? 'Paused' : autoFocusHasWork() ? null : 'Idle (Up Next and Lurk are under your control)');

            if(resting) {
                const readout = $('span#tt-auto-focus-stats');

                if(defined(readout))
                    readout.innerHTML = `&#9208; ${ resting }`;

                return;
            }

            const video = $.all('video').pop();

            if(nullish(video))
                return;

            const frame = video.captureFrame(`image/${ imageType }`)
                , start = +new Date;

            wait(2_5_0).then(() => {
                resemble(frame)
                    .compareTo(video.captureFrame(`image/${ imageType }`))
                    .ignoreColors()
                    .scaleToSameSize()
                    .outputSettings({ errorType: 'movementDifferenceIntensity', errorColor: { red: 0, green: 255, blue: 255 } })
                    .onComplete(async data => {
                        let { analysisTime, misMatchPercentage } = data
                            , threshold = detectionThreshold
                            , totalTime = 0
                            , bias = [];

                        analysisTime = parseInt(analysisTime);
                        misMatchPercentage = parseFloat(misMatchPercentage) || 0;

                        for(const [mismatch, time, trend] of CAPTURE_HISTORY) {
                            threshold += parseFloat(mismatch);
                            totalTime += time;
                            bias.push(trend);
                        }
                        threshold /= CAPTURE_HISTORY.length;

                        const trend = (misMatchPercentage > (parseBool(Settings.auto_focus_detection_threshold) ? detectionThreshold : threshold) ? 'up' : 'down');

                        (window.CAP_HIS = CAPTURE_HISTORY).push([misMatchPercentage, analysisTime, trend]);

                        /* Display capture stats */
                        let diffImg = $('img#tt-auto-focus-differences')
                            , diffDat = $('span#tt-auto-focus-stats')
                            , stop = +new Date;

                        DisplayingAutoFocusDetails:
                        if(Settings.show_stats) {
                            const parent = $('.chat-list--default');
                            // #twilight-sticky-header-root

                            if(nullish(parent))
                                break DisplayingAutoFocusDetails;

                            let { height, width } = getOffset(video)
                                , { videoHeight } = video;

                            height = parseInt(height * .25);
                            width = parseInt(width * .25);

                            if(nullish(diffImg)) {
                                diffDat = furnish('span#tt-auto-focus-stats', { style: `background: var(--color-background-tooltip); color: var(--color-text-tooltip); position: absolute; z-index: 6; width: 100%; height: 2rem; overflow: hidden; font-family: monospace; font-size: 1rem; text-align: center; padding: 0;` });
                                diffImg = furnish('img#tt-auto-focus-differences', { style: `position: absolute; z-index: 3; width: 100%; transition: all 0.5s;` });

                                parent.append(diffDat, diffImg);
                            }

                            // Click the readout to pause or resume Auto-Focus on this page (#60); resuming hands Easy
                            // Lurk back to Auto-Focus, undoing the viewer's earlier toggle
                            diffDat.style.cursor = 'pointer';
                            diffDat.title = `${ ['Pause', 'Resume'][+!!AUTO_FOCUS_HELD] } Auto-Focus on this page`;
                            diffDat.onclick ??= () => {
                                AUTO_FOCUS_HELD = !AUTO_FOCUS_HELD;

                                if(!AUTO_FOCUS_HELD)
                                    $('#away-mode')?.removeAttribute('toggled-by');

                                $log(`[Auto-Focus] ${ ['resumed', 'paused'][+AUTO_FOCUS_HELD] } on this page`);
                            };

                            diffImg.src = data.getImageDataUrl?.();

                            const size = diffImg.src.length
                                , { totalVideoFrames } = video.getVideoPlaybackQuality();

                            diffDat.innerHTML = (AUTO_FOCUS_HELD ? '&#9208; Paused / ' : '') + `Frame #${ totalVideoFrames.toString(36).toUpperCase() } / ${ detectedTrend } ${ misMatchPercentage }% &#866${ 3 + (trend[0].equals('d')) }; / ${ ((stop - start) / 1000).suffix('s', 2) } / ${ size.suffix('B', 2) } / ${ videoHeight }p`;
                            // diffDat.tooltip = new Tooltip(diffDat, `Frame ID / Overall Trend, Change Percentage, Current Trend / Time to Calculate Changes / Size of Changes (Bytes) / Image Resolution`, { from: 'left' });
                        } else {
                            diffImg?.remove();
                            diffDat?.remove();
                        }

                        /* Alter other settings according to the trend */
                        const changes = ['changing trend detection level'];

                        // Paused by the viewer while this capture was in flight: change nothing (#60)
                        if(!AUTO_FOCUS_HELD && bias.length > 30 && GET_TIME_REMAINING() > 60_000) {
                            // Positive activity trend; disable Lurking, pause Up Next
                            if((nullish(POSITIVE_TREND) || POSITIVE_TREND === false) && bias.slice(-(30 / pollInterval)).filter(trend => trend.equals('down')).length < (30 / pollInterval) / 2) {
                                POSITIVE_TREND = true;

                                // Pause Up Next
                                __AutoFocus_Pause_UpNext__: if(UP_NEXT_ALLOW_THIS_TAB) {
                                    const button = $('#up-next-control')
                                        , paused = parseBool(button?.getAttribute('paused'));

                                    if(paused)
                                        break __AutoFocus_Pause_UpNext__;

                                    button?.click();

                                    changes.push('pausing up next');
                                }

                                // Disable Lurking
                                __AutoFocus_Disable_AwayMode__: {
                                    const button = $('#away-mode')
                                        , quality = await GetQuality();

                                    if(quality.auto)
                                        break __AutoFocus_Disable_AwayMode__;

                                    // The viewer started or stopped lurking themselves: leave it (#60)
                                    if(button?.getAttribute('toggled-by') == 'user')
                                        break __AutoFocus_Disable_AwayMode__;

                                    button?.click();

                                    changes.push('disabling lurking');
                                }

                                detectedTrend = '&uArr;';
                                $log("Positive trend detected: " + changes.join(', '));
                            }
                            // Negative activity trend; enable Lurking, resume Up Next
                            else if((nullish(POSITIVE_TREND) || POSITIVE_TREND === true) && bias.slice(-(60 / pollInterval)).filter(trend => trend.equals('up')).length < (60 / pollInterval) / 5) {
                                POSITIVE_TREND = false;

                                // Resume Up Next
                                __AutoFocus_Resume_UpNext__: if(UP_NEXT_ALLOW_THIS_TAB) {
                                    const button = $('#up-next-control')
                                        , paused = parseBool(button?.getAttribute('paused'));

                                    // Only undo a pause Auto-Focus made; a viewer's pause stays (#56)
                                    if(!paused || button?.getAttribute('paused-by') == 'user')
                                        break __AutoFocus_Resume_UpNext__;

                                    button?.click();

                                    changes.push('resuming up next');
                                }

                                // Enable Lurking
                                __AutoFocus_Enable_AwayMode__: {
                                    const button = $('#away-mode')
                                        , quality = await GetQuality();

                                    if(quality.low)
                                        break __AutoFocus_Enable_AwayMode__;

                                    // The viewer started or stopped lurking themselves: leave it (#60)
                                    if(button?.getAttribute('toggled-by') == 'user')
                                        break __AutoFocus_Enable_AwayMode__;

                                    button?.click();

                                    changes.push('enabling lurking');
                                }

                                detectedTrend = '&dArr;';
                                $log("Negative trend detected: " + changes.join(', '));
                            }
                        }

                        // Auto-increase the polling time if the job isn't fast enough
                        if(video.stalling)
                            ++STALLED_FRAMES;
                        else if(STALLED_FRAMES > 0)
                            --STALLED_FRAMES;

                        if(STALLED_FRAMES > 15 || (stop - start > POLL_INTERVAL * .75)) {
                            $warn("The stream seems to be stalling...", "Increasing Auto-Focus job time...", (POLL_INTERVAL / 1000).toFixed(2) + "s →", (POLL_INTERVAL * 1.1 / 1000).toFixed(2) + "s");

                            POLL_INTERVAL *= 1.1;
                            STALLED_FRAMES = 0;

                            RestartJob('auto_focus', 'modify');
                        }
                    });
            });
        }, POLL_INTERVAL);
    },

    /**
     * Undoes auto-focus monitoring by clearing the capture interval and removing associated statistics and difference elements from the UI.
     */
    unhandler: () => {
        if(RestartJob.__reason__.noneOf('default', 'modify', 'reinit'))
            $.all('#tt-auto-focus-differences, #tt-auto-focus-stats')
                .forEach(element => element.remove());

        clearInterval(CAPTURE_INTERVAL);
    },

    /**
     * Sets up the auto-focus feature and logs a notification that the stream is being monitored.
     */
    setup() {
        $warn("[Auto-Focus] is monitoring the stream...");
    },
});
