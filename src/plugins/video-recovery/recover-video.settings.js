/*** /plugins/video-recovery/recover-video.settings.js
 * Settings for "Recover Video" (Video Recovery).
 */

export default {
    title: "Recover Video",
    tr: 'recover-video',
    glyph: 'video',
    flags: ['small'],
    keywords: 'cover,curtain,download,load,log in,net,refill,refresh,reload,restock,restore,screen,televised,video,webpage',
    rows: [
        {
            toggle: 'recover_video',
        },
        {
            text: "When the video <b attention-text top-tooltip='Displays an error code or blank screen'>fails to download</b>, reload the webpage.",
        },
    ],
    settings: {
        recover_video: {
            type: 'checkbox',
            default: true,
        },
    },
};
