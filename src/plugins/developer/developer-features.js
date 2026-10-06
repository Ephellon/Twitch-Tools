/*** /plugins/developer/developer-features.js
 * Developer Features.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'extra_keyboard_shortcuts',

    /**
     * Install: Sets up developer shortcuts for taking stream screenshots and recording clips.
     */
    async install() {
        Handlers.extra_keyboard_shortcuts = () => {
            /* Add the shortcuts */

            // Take screenshots of the stream
            // Alt + Shift + X | Opt + Shift + X
            if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X))
                $.on('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X = function Take_a_Screenshot({ key = '', altKey, ctrlKey, metaKey, shiftKey }) {
                    if(!(ctrlKey || metaKey) && altKey && shiftKey && key.equals('x'))
                        $.all('video').pop().copyFrame()
                            .then(async copied => await alert.timed(`Screenshot saved to clipboard!<p tt-x>${ (new UUID).value }</p>`, 5000))
                            .catch(async error => await alert.timed(`Failed to take screenshot: ${ error }<p tt-x>${ (new UUID).value }</p>`, 7000));
                });

            // Begin recording the stream
            // Alt + Z | Opt + Z
            if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z)) {
                $.on('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z = function Start_$_Stop_a_Recording({ key = '', altKey, ctrlKey, metaKey, shiftKey }) {
                    if(!(ctrlKey || metaKey || shiftKey) && altKey && key.equals('z')) {
                        const video = MASTER_VIDEO;
                        const system =  GetFileSystem();

                        video.setAttribute('uuid', video.uuid ??= (new UUID).value);

                        const body = `<input hidden controller anchor="${ video.uuid }"
                            icon="\uD83D\uDD34\uFE0F" title="Recording ${ (STREAMER?.name ?? top.location.pathname.slice(1).split('/').shift()) }..."
                            placeholder="${ DEFAULT_CLIP_NAME }"
                            pattern="${ system.acceptableFilenames.source }"

                            okay="${ encodeHTML(Glyphs.modify('download', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Save"
                            deny="${ encodeHTML(Glyphs.modify('trash', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Discard"
                            />

                            <table is-hidden="${ !Settings.experimental_mode }">
                                <caption>Video details</caption>
                                <tbody>
                                    <tr>
                                        <td>Slug</td>
                                        <td><code>${ DEFAULT_CLIP_NAME }</code></td>
                                    </tr>
                                    <tr>
                                        <td>Length</td>
                                        <td><code tt-clip-timer data-connected-to=${ video.uuid }></code></td>
                                    </tr>
                                    <tr>
                                        <td>Size</td>
                                        <td><code tt-clip-watcher data-connected-to=${ video.uuid }></code></td>
                                    </tr>
                                    <tr>
                                        <td style=padding-right:1em>Dimensions</td>
                                        <td><code tt-clip-sizer data-connected-to=${ video.uuid }></code></td>
                                    </tr>
                                    <tr>
                                        <td>Quality</td>
                                        <td tt-clip-rater data-connected-to=${ video.uuid }></td>
                                    </tr>
                                    <tr>
                                        <td>Type</td>
                                        <td tt-clip-typer data-connected-to=${ video.uuid }></td>
                                    </tr>
                                </tbody>
                            </table>

                            <div>
                                <h4>You can change the filename of this recording below.</h4>
                                <p>You <strong>cannot</strong> use the following characters: ${ system.unacceptableFilenameCharacters.filter(c => system.characterNames[c].composable).map(c => `<code title="${ system.characterNames[c] }">${ c }</code>`).join(' ') }</p>
                            </div>`;

                        const EVENT_NAME = GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z.name;
                        let SAVE_NAME = DEFAULT_CLIP_NAME;

                        if(!video.hasRecording(EVENT_NAME)) {
                            prompt.silent(body).then(value => {
                                const feed = $(`.tt-prompt[uuid="${ UUID.from(body).value }"i]`);
                                const recording = Recording.find(EVENT_NAME, video);

                                feed?.setAttribute('halt', nullish(value));
                                DEFAULT_CLIP_NAME = new ClipName(2);

                                // Discard
                                if(nullish(value)) {
                                    phantomClick($('.deny', feed));
                                    return recording?.discard();
                                }

                                // Save (once the last chunk is in), show it, then let go of it
                                phantomClick($('.okay', feed));
                                SAVE_NAME = (value || SAVE_NAME).replace(GetFileSystem().allIllegalFilenameCharacters, '-');

                                recording?.stop().save(SAVE_NAME)
                                    .then(link => alert.silent(`
                                        <video controller controls
                                            title="Video Saved &mdash; ${ link.download }"
                                            src="${ link.href }" style="max-width:-webkit-fill-available"
                                        ></video>
                                        `)
                                    )
                                    .catch(error => {
                                        $warn(error);

                                        alert.timed(error, 7000);
                                    })
                                    .finally(() => recording.discard());
                            });

                            SetQuality(VideoClips.quality, 'auto').then(() => {
                                Recording.proxy(video, { name: EVENT_NAME, as: DEFAULT_CLIP_NAME, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats });
                            });
                        } else {
                            const feed = $(`.tt-prompt[uuid="${ UUID.from(body).value }"i]`);

                            phantomClick($('.okay', feed));
                        }
                    }
                });

                // Save current recording(s) before leaving
                const leaveHandler = STREAMER.onraid = STREAMER.onhost = top.beforeleaving = top.onlocationchange = async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
                    if(STASH_SAVED)
                        return;
                    STASH_SAVED = true;

                    const next = await GetNextStreamer();

                    $log("Saving current recording(s). Reason (keyboard shortcuts leave handler):", { hosting, raiding, raided, leaving: defined(from) }, "Moving onto:", next);

                    // What doesn't finish saving is offered again on the next page load (Recording.leftovers)
                    for(const recording of Recording.list({ active: true }))
                        recording.stop().save().catch($warn);
                };

                $.on('focusin', event => {
                    if(top.focusedin)
                        return;
                    top.focusedin = true;
                    top.addEventListener('beforeunload', leaveHandler);

                    // top.addEventListener('visibilitychange', leaveHandler);
                });
            }

            // Send the previewed channel to the miniplayer
            // <Stream Preview>:hover → Z
            if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_Z))
                $.on('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_Z = function Send_to_Miniplayer({ key = '', altKey, ctrlKey, metaKey, shiftKey }) {
                    if(!(ctrlKey || metaKey || altKey || shiftKey) && key.equals('z') && $.defined('#tt-stream-preview--iframe') && parseBool($('#tt-stream-preview--iframe').dataset.live))
                        MiniPlayer = $('#tt-stream-preview--iframe').dataset.name;
                });

            // Send the previewed channel to Live Reminders
            // <Stream Preview>:hover → R
            if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_R))
                $.on('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_R = function Send_to_Live_Reminders({ key = '', altKey, ctrlKey, metaKey, shiftKey }) {
                    if(!(ctrlKey || metaKey || altKey || shiftKey) && key.equals('r') && $.defined('#tt-stream-preview--iframe') && parseBool($('#tt-stream-preview--iframe').dataset.live)) {
                        const name = $('#tt-stream-preview--iframe').dataset.name;

                        Cache.load('LiveReminders', async({ LiveReminders }) => {
                            try {
                                LiveReminders = JSON.parse(LiveReminders || '{}');
                            } catch(error) {
                                // Probably an object already...
                                LiveReminders ??= {};
                            }

                            const justInCase = { ...LiveReminders };

                            if(defined(LiveReminders[name]))
                                return confirm
                                    .timed(`<div hidden controller
                                        okay="${ encodeHTML(Glyphs.modify('checkmark', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } OK"
                                        deny="${ encodeHTML(Glyphs.modify('trash', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Stop"
                                        ></div>You're already getting notifications for <a href="/${ name }">${ name }</a>.`, 7000)
                                    .then(ok => {
                                        // The user pressed "Cancel"
                                        if(ok === false) {
                                            delete LiveReminders[name];

                                            Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));
                                        }
                                    });

                            const search = await new Search(name).then(Search.convertResults);

                            LiveReminders[name] = (search.live ? new Date(search?.data?.actualStartTime) : search?.data?.lastSeen ?? new Date);

                            Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));

                            await confirm
                                .timed(`You'll be notified when <a href="/${ name }">${ name }</a> goes live.`, 7000)
                                .then(ok => {
                                    // The user pressed "Cancel"
                                    if(ok === false)
                                        Cache.save({ LiveReminders: { ...justInCase } }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));
                                });

                            // @performance
                            PrepareForGarbageCollection(LiveReminders);
                        });
                    }
                });

            // Display the enabled keyboard shortcuts
            const [help] = $.body.getAllElementsByText('space/k', 'i').filter(element => element.tagName.equals('TBODY'));

            const f = furnish;

            if(defined(help) && $.nullish('.tt-extra-keyboard-shortcuts', help))
                for(const shortcut in GLOBAL_EVENT_LISTENERS)
                    if(/^(key(?:up|down)_)/i.test(shortcut)) {
                        const name = GLOBAL_EVENT_LISTENERS[shortcut].toTitle()
                            , macro = GetMacro(shortcut.toLowerCase().split('_').slice(1).join('+'));

                        if(!name.length)
                            continue;

                        help.append(
                            f('tr.tw-table-row.tt-extra-keyboard-shortcuts').with(
                                f('td.tw-table-cell').with(
                                    f.p(name)
                                ),
                                f('td.tw-table-cell').with(
                                    f.span(macro)
                                )
                            )
                        );
                    }
        };

        Timers.extra_keyboard_shortcuts = 2_5_0;

        __ExtraKeyboardShortcuts__:
        if(parseBool(Settings.extra_keyboard_shortcuts)) {
            RegisterJob('extra_keyboard_shortcuts')
        }

        let DEFAULT_CLIP_NAME = new ClipName(2);
        const GLOBAL_CLIP_HANDLER = setInterval(() => {
            // The Alt+Z recorder only exists while Extra Keyboard Shortcuts is on (#53)
            if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z))
                return;

            const EVENT_NAME = GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z.name;

            // Maintains a timer of the clip
            $.all('[tt-clip-timer]')
                .map(element => {
                    const video = $(`video[uuid="${ element.dataset.connectedTo }"]`)
                        , recording = Recording.find(EVENT_NAME, video);

                    element.closest('[icon]').setAttribute('icon', element.innerHTML = toTimeString(recording?.duration ?? 0, 'clock'));
                });

            // Gets the clip's dimensions
            $.all('[tt-clip-sizer]')
                .map(element => {
                    const video = $(`video[uuid="${ element.dataset.connectedTo }"]`);

                    element.innerHTML = `${ video.videoWidth }&times;${ video.videoHeight }`;
                });

            // Gets the clip's file type
            $.all('[tt-clip-typer]')
                .map(element => {
                    const video = $(`video[uuid="${ element.dataset.connectedTo }"]`)
                        , [type] = (Recording.find(EVENT_NAME, video)?.mimeType || 'video/x-unknown').split(';');

                    element.innerHTML =  `<code>${ MIME_Types.find(type) }</code> <code>${ type }</code>`;
                });

            // Maintains the framerate of the clip
            $.all('[tt-clip-rater]')
                .map(element => {
                    const video = $(`video[uuid="${ element.dataset.connectedTo }"]`)
                        , recording = Recording.find(EVENT_NAME, video);

                    element.innerHTML = `<code>${ video.videoHeight }p</code> <code>${ (recording?.bitrate ?? 0).suffix('bps', false, 'data') }</code>`;
                });

            // Maintains the file size of the clip
            $.all('[tt-clip-watcher]')
                .map(element => {
                    const video = $(`video[uuid="${ element.dataset.connectedTo }"]`)
                        , recording = Recording.find(EVENT_NAME, video);

                    element.innerHTML = (recording?.size ?? 0).suffix('B', 2);
                });

            // All unit targets
            $.all('[unit] input').map(input => {
                input.onfocus ??= ({ currentTarget }) => currentTarget.closest('[unit]').setAttribute('focus', true);
                input.onblur ??= ({ currentTarget }) => currentTarget.closest('[unit]').setAttribute('focus', false);

                if(input.disabled)
                    input.closest('[unit]').setAttribute('valid', true);
                else
                    input.oninput = ({ currentTarget }) => currentTarget.closest('[unit]').setAttribute('valid', currentTarget.checkValidity());
            });
        }, 1000);
    },
});
