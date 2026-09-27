/*** /plugins/automation/prevent-raiding.settings.js
 * Settings for "Prevent Raiding" (Automation).
 */

export default {
    title: "Prevent Raiding",
    tr: 'prevent-raiding',
    glyph: 'people',
    flags: ['small'],
    badges: {
        new: '4.12.11',
    },
    keywords: 'arrest,assault,avenue,break in,capture,carrier,channels,charge,handling,incursion,invasion,management,manipulation,means,medium,onslaught,oversight,plan,policy,raiding,route,sortie,strategy,surprise attack,sweep,transaction,treatment,tunnel',
    rows: [
        {
            text: "Prevent certain or all channels from raiding by going to the <b>Next Channel</b>.",
        },
        {
            select: 'prevent_raiding',
        },
        {
            extras: {
                title: "Extras",
                tr: 'extras',
                subtitle: 'Adjust settings for "Prevent Raiding"',
            },
            rows: [
                {
                    option: {
                        title: "Greedy Raiding",
                        tr: '@@greedy-raiding',
                    },
                    rows: [
                        {
                            toggle: 'greedy_raiding',
                        },
                        {
                            text: "Go to <b attention-text top-tooltip='Followed channels with Channel Points'>certain channels</b> when they begin a raid.",
                        },
                    ],
                },
            ],
        },
    ],
    settings: {
        prevent_raiding: {
            type: 'select',
            options: [
                {
                    default: true,
                    value: 'none',
                    label: "Allow all channels to raid",
                    attrs: {
                        'tr-id': 'prevent-raiding:options',
                    },
                },
                {
                    value: 'greed',
                    label: "Only raid to collect channel points",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'all',
                    label: "Prevent all channels from raiding",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'unfollowed',
                    label: "Prevent unfollowed channels from being raided",
                    attrs: {
                        'tr-id': '',
                    },
                },
            ],
        },
        greedy_raiding: {
            type: 'checkbox',
            default: false,
            attrs: {
                requires: '#prevent_raiding',
            },
        },
    },
};
