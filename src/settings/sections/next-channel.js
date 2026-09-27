/*** /settings/sections/next-channel.js
 * Settings for "Next Channel" (Automation).
 */

export default {
    title: "Next Channel",
    tr: 'next-channel-preference',
    glyph: 'favorite',
    flags: ['small'],
    badges: {
        new: '4.1.8',
    },
    keywords: 'avenue,carrier,channel,current,flood,flow,means,medium,offline,route,rush,spate,stream,surge,tide,torrent,tributary,tunnel',
    rows: [
        {
            text: "How should the next channel be chosen when <b>Up Next</b> is empty?",
        },
        {
            text: "<b warning-text>This only activates when the current stream goes offline</b>.",
        },
        {
            select: 'next_channel_preference',
        },
    ],
    settings: {
        next_channel_preference: {
            type: 'select',
            options: [
                {
                    value: 'none',
                    label: "Disabled",
                    attrs: {
                        'tr-id': 'next-channel-preference:options',
                    },
                },
                {
                    default: true,
                    value: 'random',
                    label: "Go to a random channel",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'unpopular',
                    label: "Go with the least viewers",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'popular',
                    label: "Go with the most viewers",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'poor',
                    label: "Go with the least channel points",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'rich',
                    label: "Go with the most channel points",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'closest',
                    label: "Go with the closest to having all channel point rewards",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'furthest',
                    label: "Go with the furthest from having all channel point rewards",
                    attrs: {
                        'tr-id': '',
                    },
                },
            ],
        },
    },
};
