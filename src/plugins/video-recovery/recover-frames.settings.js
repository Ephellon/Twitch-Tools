/*** /plugins/video-recovery/recover-frames.settings.js
 * Settings for "Recover Frames" (Video Recovery).
 */

export default {
    title: "Recover Frames",
    tr: 'recover-frames',
    glyph: 'video',
    flags: ['small'],
    badges: {
        new: '4.12.4',
    },
    keywords: 'abnormal,abrogate,annul,attack,attempt,bid,current,damaged,deficient,drops,endeavor,experiment,faulty,flawed,flood,flow,frames,inadequate,insufficient,nullify,override,pursuit,quash,refill,refresh,reload,restock,restore,reverse,revoke,rush,seconds,shot,spate,stream,struggle,surge,televised,tide,torrent,tributary,try,unhealthy,unsound,veto,video,video,webpage',
    rows: [
        {
            toggle: 'recover_frames',
        },
        {
            text: "When the video <b attention-text top-tooltip='Fails to play for longer than 15 seconds'>freezes</b>, reload the webpage.",
        },
        {
            extras: {
                title: "Extras",
                tr: 'extras',
                subtitle: 'Adjust settings for "Recover Frames"',
            },
            rows: [
                {
                    option: {
                        title: "Try Embed",
                        tr: 'recover-frames:extras',
                    },
                    rows: [
                        {
                            toggle: 'recover_frames__allow_embed',
                        },
                        {
                            text: "Attempt to override the video with an embedded stream.",
                        },
                    ],
                },
            ],
        },
    ],
    settings: {
        recover_frames: {
            type: 'checkbox',
            default: true,
        },
        recover_frames__allow_embed: {
            type: 'checkbox',
            default: false,
        },
    },
};
