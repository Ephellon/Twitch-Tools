/*** /plugins/video-recovery/recover-stream.settings.js
 * Settings for "Recover Stream" (Video Recovery).
 */

export default {
    title: "Recover Stream",
    tr: 'recover-stream',
    glyph: 'video',
    flags: ['small'],
    keywords: 'attack,attempt,bid,current,endeavor,experiment,flood,flow,pursuit,rush,shot,spate,stream,struggle,surge,tide,torrent,tributary,try',
    rows: [
        {
            toggle: 'recover_stream',
        },
        {
            text: "When the stream <b attention-text top-tooltip='Fails to play for more than 5 seconds'>freezes</b>, try to fix it.",
        },
    ],
    settings: {
        recover_stream: {
            type: 'checkbox',
            default: false,
        },
    },
};
