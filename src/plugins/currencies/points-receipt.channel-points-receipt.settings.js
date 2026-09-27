/*** /plugins/currencies/points-receipt.channel-points-receipt.settings.js
 * Settings for "Channel Points Receipt" (Currencies).
 */

export default {
    title: "Channel Points Receipt",
    tr: 'channel-points-receipt',
    glyph: 'channelpoints',
    flags: ['small'],
    keywords: 'act,array,assemblage,assortment,avenue,carrier,certificate,channel,collection,compilation,demonstration,display,example,exhibit,lot,means,medium,number,parade,points,presentation,receipt,route,selection,set,store,tunnel,voucher',
    rows: [
        {
            text: "How should the receipt display <a href='https://help.twitch.tv/s/article/channel-points-guide' top-tooltip='Channel Points'><button style='background-color:var(--grey)!important'><span small purple glyph='channelpoints'></span></button></a> collection?",
        },
        {
            select: 'channelpoints_receipt_display',
        },
    ],
    settings: {
        channelpoints_receipt_display: {
            type: 'select',
            options: [
                {
                    default: true,
                    value: 'null',
                    label: "Display the exact amount collected",
                    attrs: {
                        'tr-id': 'channel-points-receipt:options',
                    },
                },
                {
                    value: 'round100',
                    label: "Round to the nearest 100",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'round50',
                    label: "Round to the nearest 50",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'round25',
                    label: "Round to the nearest 25",
                    attrs: {
                        'tr-id': '',
                    },
                },
            ],
        },
    },
};
