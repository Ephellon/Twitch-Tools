/*** /plugins/automation/auto-focus.js
 * Auto-Focus.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'auto_focus',

    async install() {
        let CAPTURE_HISTORY = [],
            CAPTURE_INTERVAL,
            POLL_INTERVAL,
            STALLED_FRAMES,
            POSITIVE_TREND;

        Handlers.auto_focus = () => {
            let detectionThreshold = (parseInt(Settings.auto_focus_detection_threshold) || STREAMER.mark).clamp(5, 75),
                pollInterval = parseInt(Settings.auto_focus_poll_interval),
                imageType = Settings.auto_focus_poll_image_type,
                detectedTrend = '&bull;';

            POLL_INTERVAL ??= pollInterval * 1000;
            STALLED_FRAMES = 0;

            if(CAPTURE_HISTORY.length > 90)
                CAPTURE_HISTORY.shift();

            CAPTURE_INTERVAL = setInterval(() => {
                let video = $.all('video').pop();

                if(nullish(video))
                    return;

                let frame = video.captureFrame(`image/${ imageType }`),
                    start = +new Date;

                wait(2_5_0).then(() => {
                    resemble(frame)
                        .compareTo(video.captureFrame(`image/${ imageType }`))
                        .ignoreColors()
                        .scaleToSameSize()
                        .outputSettings({ errorType: 'movementDifferenceIntensity', errorColor: { red: 0, green: 255, blue: 255 } })
                        .onComplete(async data => {
                            let { analysisTime, misMatchPercentage } = data,
                                threshold = detectionThreshold,
                                totalTime = 0,
                                bias = [];

                            analysisTime = parseInt(analysisTime);
                            misMatchPercentage = parseFloat(misMatchPercentage) || 0;

                            for(let [mismatch, time, trend] of CAPTURE_HISTORY) {
                                threshold += parseFloat(mismatch);
                                totalTime += time;
                                bias.push(trend);
                            }
                            threshold /= CAPTURE_HISTORY.length;

                            let trend = (misMatchPercentage > (parseBool(Settings.auto_focus_detection_threshold)? detectionThreshold: threshold)? 'up': 'down');

                            (window.CAP_HIS = CAPTURE_HISTORY).push([misMatchPercentage, analysisTime, trend]);

                            /* Display capture stats */
                            let diffImg = $('img#tt-auto-focus-differences'),
                                diffDat = $('span#tt-auto-focus-stats'),
                                stop = +new Date;

                            DisplayingAutoFocusDetails:
                            if(Settings.show_stats) {
                                let parent = $('.chat-list--default');
                                // #twilight-sticky-header-root

                                if(nullish(parent))
                                    break DisplayingAutoFocusDetails;

                                let { height, width } = getOffset(video),
                                    { videoHeight } = video;

                                height = parseInt(height * .25);
                                width = parseInt(width * .25);

                                if(nullish(diffImg)) {
                                    diffDat = furnish('span#tt-auto-focus-stats', { style: `background: var(--color-background-tooltip); color: var(--color-text-tooltip); position: absolute; z-index: 6; width: 100%; height: 2rem; overflow: hidden; font-family: monospace; font-size: 1rem; text-align: center; padding: 0;` });
                                    diffImg = furnish('img#tt-auto-focus-differences', { style: `position: absolute; z-index: 3; width: 100%; transition: all 0.5s;` });

                                    parent.append(diffDat, diffImg);
                                }

                                diffImg.src = data.getImageDataUrl?.();

                                let size = diffImg.src.length,
                                    { totalVideoFrames } = video.getVideoPlaybackQuality();

                                diffDat.innerHTML = `Frame #${ totalVideoFrames.toString(36).toUpperCase() } / ${ detectedTrend } ${ misMatchPercentage }% &#866${ 3 + (trend[0].equals('d')) }; / ${ ((stop - start) / 1000).suffix('s', 2) } / ${ size.suffix('B', 2) } / ${ videoHeight }p`;
                                // diffDat.tooltip = new Tooltip(diffDat, `Frame ID / Overall Trend, Change Percentage, Current Trend / Time to Calculate Changes / Size of Changes (Bytes) / Image Resolution`, { from: 'left' });
                            } else {
                                diffImg?.remove();
                                diffDat?.remove();
                            }

                            /* Alter other settings according to the trend */
                            let changes = ['changing trend detection level'];

                            if(bias.length > 30 && GET_TIME_REMAINING() > 60_000) {
                                // Positive activity trend; disable Lurking, pause Up Next
                                if((nullish(POSITIVE_TREND) || POSITIVE_TREND === false) && bias.slice(-(30 / pollInterval)).filter(trend => trend.equals('down')).length < (30 / pollInterval) / 2) {
                                    POSITIVE_TREND = true;

                                    // Pause Up Next
                                    __AutoFocus_Pause_UpNext__: if(UP_NEXT_ALLOW_THIS_TAB) {
                                        let button = $('#up-next-control'),
                                            paused = parseBool(button?.getAttribute('paused'));

                                        if(paused)
                                            break __AutoFocus_Pause_UpNext__;

                                        button?.click();

                                        changes.push('pausing up next');
                                    }

                                    // Disable Lurking
                                    __AutoFocus_Disable_AwayMode__: {
                                        let button = $('#away-mode'),
                                            quality = await GetQuality();

                                        if(quality.auto)
                                            break __AutoFocus_Disable_AwayMode__;

                                        button?.click();

                                        changes.push('disabling lurking');
                                    }

                                    detectedTrend = '&uArr;';
                                    $log('Positive trend detected: ' + changes.join(', '));
                                }
                                // Negative activity trend; enable Lurking, resume Up Next
                                else if((nullish(POSITIVE_TREND) || POSITIVE_TREND === true) && bias.slice(-(60 / pollInterval)).filter(trend => trend.equals('up')).length < (60 / pollInterval) / 5) {
                                    POSITIVE_TREND = false;

                                    // Resume Up Next
                                    __AutoFocus_Resume_UpNext__: if(UP_NEXT_ALLOW_THIS_TAB) {
                                        let button = $('#up-next-control'),
                                            paused = parseBool(button?.getAttribute('paused'));

                                        if(!paused)
                                            break __AutoFocus_Resume_UpNext__;

                                        button?.click();

                                        changes.push('resuming up next');
                                    }

                                    // Enable Lurking
                                    __AutoFocus_Enable_AwayMode__: {
                                        let button = $('#away-mode'),
                                            quality = await GetQuality();

                                        if(quality.low)
                                            break __AutoFocus_Enable_AwayMode__;

                                        button?.click();

                                        changes.push('enabling lurking');
                                    }

                                    detectedTrend = '&dArr;';
                                    $log('Negative trend detected: ' + changes.join(', '));
                                }
                            }

                            // Auto-increase the polling time if the job isn't fast enough
                            if(video.stalling)
                                ++STALLED_FRAMES;
                            else if(STALLED_FRAMES > 0)
                                --STALLED_FRAMES;

                            if(STALLED_FRAMES > 15 || (stop - start > POLL_INTERVAL * .75)) {
                                $warn('The stream seems to be stalling...', 'Increasing Auto-Focus job time...', (POLL_INTERVAL / 1000).toFixed(2) + 's →', (POLL_INTERVAL * 1.1 / 1000).toFixed(2) + 's');

                                POLL_INTERVAL *= 1.1;
                                STALLED_FRAMES = 0;

                                RestartJob('auto_focus', 'modify');
                            }
                        })
                });
            }, POLL_INTERVAL);
        };
        Timers.auto_focus = -1000;

        Unhandlers.auto_focus = () => {
            if(RestartJob.__reason__.noneOf('default', 'modify', 'reinit'))
                $.all('#tt-auto-focus-differences, #tt-auto-focus-stats')
                    .forEach(element => element.remove());

            clearInterval(CAPTURE_INTERVAL);
        };

        __AutoFocus__:
        if(parseBool(Settings.auto_focus)) {
            RegisterJob('auto_focus');

            $warn("[Auto-Focus] is monitoring the stream...");
        }
    },
});
