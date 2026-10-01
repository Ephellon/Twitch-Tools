/*** /plugins/chat/bttv-emotes.settings.js
 * Settings for "BetterTTV Emotes" (Chat & Messaging).
 */

export default {
    title: "BetterTTV Emotes",
    tr: 'bttv-emotes',
    glyph: 'emotes',
    flags: ['small', 'gold'],
    keywords: 'amount,anxiety,area,avenue,bundle,capacity,carrier,cause,channel,consignment,content,district,document,element,emotes,explanation,fluctuation,goods,haul,idea,insecurity,instability,loading,locale,location,matter,means,medium,motivation,motive,neighborhood,origin,packing,paragraph,part,passage,payload,point,position,principle,purpose,quotation,region,root,route,scene,section,shipment,site,situation,source,spot,station,storing,text,theme,tunnel,uncertainty,venue,verse,volatility,vulnerability,weakness,weight,whereabouts,wording,words',
    rows: [
        {
            toggle: 'bttv_emotes',
        },
        {
            text: "Use BetterTTV emotes in chat.",
        },
        {
            text: "Loading them can make the page less stable.",
            attrs: {
                'warning-text': '',
            },
        },
        {
            extras: {
                title: "Options",
                tr: 'options',
                subtitle: 'Adjust options for "BetterTTV emotes"',
            },
            rows: [
                {
                    option: {
                        title: "Auto-load Emotes",
                        tr: 'bttv-emotes:auto-load-bttv-emotes',
                    },
                    rows: [
                        {
                            toggle: 'auto_load_bttv_emotes',
                        },
                        {
                            text: "Automatically convert emote text to <b>BetterTTV</b> emotes.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Channel Specific Emotes",
                        tr: 'bttv-emotes:channel-specific-emotes',
                    },
                    rows: [
                        {
                            toggle: 'bttv_emotes_channel',
                        },
                        {
                            text: "Load channel specific <b>BetterTTV</b> emotes.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Emote Location",
                        tr: 'bttv-emotes:emote-location',
                    },
                    rows: [
                        {
                            text: "Load these <b>BetterTTV</b> emotes:",
                        },
                        {
                            select: 'bttv_emotes_location',
                        },
                    ],
                },
                {
                    option: {
                        title: "Extra Emotes",
                        tr: 'bttv-emotes:extra-emotes',
                    },
                    rows: [
                        {
                            text: "Add <b>BetterTTV</b> emotes with the words: {{bttv_emotes_extras}}",
                        },
                    ],
                },
                {
                    option: {
                        title: "Library Size",
                        tr: 'bttv-emotes:library-size',
                    },
                    rows: [
                        {
                            text: "Load up to {{bttv_emotes_maximum}}",
                        },
                    ],
                },
            ],
        },
    ],
    settings: {
        bttv_emotes: {
            type: 'checkbox',
            default: false,
        },
        auto_load_bttv_emotes: {
            type: 'checkbox',
            default: false,
        },
        bttv_emotes_channel: {
            type: 'checkbox',
            default: false,
        },
        bttv_emotes_location: {
            type: 'select',
            options: [
                {
                    default: true,
                    value: 'emotes/shared/trending',
                    label: "Most popular (Trending)",
                    attrs: {
                        'tr-id': 'bttv-emotes:emote-location:options',
                    },
                },
                {
                    value: 'emotes/shared',
                    label: "Most shared (Shared)",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'emotes/shared/top',
                    label: "Most used (Top)",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'cached/emotes/global',
                    label: "Most universal (Global)",
                    attrs: {
                        'tr-id': '',
                    },
                },
            ],
        },
        bttv_emotes_extras: {
            type: 'text',
            default: '',
            placeholder: "monka,flex,pls",
            attrs: {
                'left-tooltip': 'Case insensitive • Comma separated',
            },
        },
        bttv_emotes_maximum: {
            type: 'number',
            default: 150,
            min: 30,
            max: 3000,
            step: 30,
            wrap: {
                set: 'unit=Glyphs.utf8.emotes',
            },
        },
    },
};
