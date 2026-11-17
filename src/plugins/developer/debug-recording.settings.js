/*** /plugins/developer/debug-recording.settings.js
 * Settings for "Debug Recording" (Developer Features).
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
            text: "Keep a log of the last {{debug_recording__minutes}} of clicks, page changes, the video's status and what TTV did. Messages are hidden.",
        },
        {
            text: "Press <code>Alt</code> + <code>Shift</code> + <code>R</code> on Twitch to save it as a file you can add to an issue.",
        },
    ],
    settings: {
        debug_recording: {
            type: 'checkbox',
            default: false,
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
