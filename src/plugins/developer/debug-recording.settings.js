/*** /plugins/developer/debug-recording.settings.js
 * Settings for "Debug Recording" (Troubleshooting).
 */

export default {
    title: "Debug Recording",
    tr: 'debug-recording',
    glyph: 'stats',
    flags: ['small'],
    badges: {
        new: '6.1',
    },
    keywords: 'bug,capture,debug,error,history,issue,log,problem,record,recording,replay,report,timeline,trace,troubleshoot',
    rows: [
        {
            toggle: 'debug_recording',
        },
        {
            text: "Keep a log of the last {{debug_recording__minutes}} of clicks, page changes, the video's status and what the extension did. <strong warning-text>Messages are hidden.</strong>",
        },
        {
            text: "Press <code>Ctrl</code> three times quickly on a Twitch page to save it as a file you can add to an issue.",
        },
        {
            html: '<hr>',
        },
        {
            text: "Saved files are signed. Check one you received before you open it: a real recording only runs TTV Tools' own code, and its log hasn't been changed.",
        },
        {
            html: "<p>This browser's key: <code id='debug-recording--key'>…</code></p>",
        },
        {
            html: "<input id='debug-recording--check-input' type='file' accept='.html, text/html' style='display:none!important'>",
        },
        {
            html: `<label id='debug-recording--check-label' for='debug-recording--check-input' type='button' top-tooltip='Check a recording without opening it'>
                    <span small glyph='checkmark'></span>
                    <span tr-id='debug-recording:check'>Check a file</span>
                </label>`,
        },
        {
            html: "<output id='debug-recording--check-result' aria-live='polite' style='display:block; margin-top:0.5rem'></output>",
        },
    ],
    settings: {
        debug_recording: {
            type: 'checkbox',
            default: false,
        },
        'debug-recording--check-input': {
            type: 'custom',
            store: false,
        },
        debug_recording__minutes: {
            type: 'number',
            default: 5,
            min: 1,
            max: 30,
            unit: 'min',
        },
    },
};
