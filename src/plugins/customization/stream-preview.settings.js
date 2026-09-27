/*** /plugins/customization/stream-preview.settings.js
 * Settings for "Stream Preview" (Customization).
 */

export default {
    title: "Stream Preview",
    tr: 'stream-preview',
    glyph: 'video',
    flags: ['small', 'gold'],
    badges: {
        new: '5.15',
    },
    keywords: 'act,advertisement,amount,announcement,array,breadth,broadcasts,capacity,channels,charge,content,current,demonstration,diameter,display,examination,example,exhibit,extent,extras,flawless,flood,flow,handling,height,intact,intensity,length,magnitude,management,manipulation,newscast,oversight,parade,performance,plan,policy,pop-ups,pop ups,presentation,preview,program,proportion,publication,range,robust,rush,safe,sane,scope,show,simulcast,size,solid,sound,spate,stable,stature,strategy,stream,sturdy,surge,thorough,tide,torrent,transaction,transmission,treatment,tributary,vibrant,viewing,vigorous,volume,width',
    rows: [
        {
            toggle: 'stream_preview',
        },
        {
            text: "When hovering over a streamer's icon, display a preview of their broadcast.",
        },
        {
            extras: {
                title: "Extras",
                tr: 'extras',
                subtitle: 'Adjust settings for "Stream Preview"',
            },
            rows: [
                {
                    option: {
                        title: "Preview Position",
                        tr: 'stream-preview:position',
                    },
                    rows: [
                        {
                            text: "Adjust the <b attention-text top-tooltip='In front of, or behind'>orthogonal</b> position of the preview.",
                        },
                        {
                            select: 'stream_preview_position',
                        },
                    ],
                },
                {
                    option: {
                        title: "Preview Size",
                        tr: 'stream-preview:size',
                    },
                    rows: [
                        {
                            text: "How large sould the preview be?",
                        },
                        {
                            select: 'stream_preview_scale',
                        },
                    ],
                },
                {
                    option: {
                        title: "Preview Sound",
                        tr: 'stream-preview:sound',
                    },
                    rows: [
                        {
                            text: "Should the preview be audible?",
                        },
                        {
                            text: "This will temporarily mute the current stream.",
                            attrs: {
                                'warning-text': '',
                            },
                        },
                        {
                            toggle: 'stream_preview_sound',
                        },
                    ],
                },
            ],
        },
    ],
    settings: {
        stream_preview: {
            type: 'checkbox',
            default: false,
        },
        stream_preview_position: {
            type: 'select',
            options: [
                {
                    default: true,
                    value: '3',
                    label: "Always in front (on top)",
                    attrs: {
                        'tr-id': 'stream-preview:position-options',
                    },
                },
                {
                    value: '2',
                    label: "Normal",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: '1',
                    label: "Always behind (on bottom)",
                    attrs: {
                        'tr-id': '',
                    },
                },
            ],
        },
        stream_preview_scale: {
            type: 'select',
            options: [
                {
                    default: true,
                    value: '1',
                    label: "Normal (×1)",
                    attrs: {
                        'tr-id': 'stream-preview:size-options',
                    },
                },
                {
                    value: '2',
                    label: "Large (×2)",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: '3',
                    label: "Extra-Large (×3)",
                    attrs: {
                        'tr-id': '',
                    },
                },
            ],
        },
        stream_preview_sound: {
            type: 'checkbox',
            default: false,
        },
    },
};
