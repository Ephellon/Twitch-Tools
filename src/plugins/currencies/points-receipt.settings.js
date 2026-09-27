/*** /plugins/currencies/points-receipt.settings.js
 * Settings for "Points Receipt & Rank" (Customization).
 */

export default {
    title: "Points Receipt &amp; Rank",
    tr: 'placement:points-receipt',
    glyph: 'channelpoints',
    flags: ['small', 'gold'],
    keywords: 'certificate,content,document,idea,musty,noxious,paragraph,passage,points,putrid,quotation,ranking,receipt,text,theme,verse,voucher,wording',
    rows: [
        {
            text: "Where should the <b>Points Receipt &amp; Point Rank</b> text be displayed?",
        },
        {
            select: 'points_receipt_placement',
        },
    ],
    settings: {
        points_receipt_placement: {
            type: 'select',
            options: [
                {
                    default: true,
                    value: 'null',
                    label: "Do not display",
                    attrs: {
                        'tr-id': 'placement:points-receipt:options',
                    },
                },
                {
                    value: 'under',
                    label: "Under the video",
                    attrs: {
                        'tr-id': '',
                    },
                },
            ],
        },
    },
};
