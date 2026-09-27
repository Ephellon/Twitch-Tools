/*** /plugins/customization/store-integration.settings.js
 * Settings for "Store Integration" (Networking).
 */

export default {
    title: "Store Integration",
    tr: 'store-integration',
    glyph: 'gift',
    flags: ['small', 'gold'],
    badges: {
        new: '5.29',
    },
    keywords: 'acquisition,advance,asset,assimilation,association,boy,buy,channel,contact,cube,current,dsi,element,epic,examination,exploration,flood,flow,game,hookup,hunt,inquiry,inspection,integration,investigation,investment,link,network,nintendo,play,playstation,purchase,pursuit,quest,relationship,research,rush,search,spate,station,stock,store,steam,stream,surge,switch,tide,tie,torrent,tributary,wii,xbox',
    rows: [
        {
            toggle: 'store_integration',
        },
        {
            text: "When a stream is loaded and a game is detected, search for the game and create a purchase link.",
        },
        {
            extras: {
                title: "Options",
                tr: 'options',
                subtitle: 'Adjust options for "Store Integration"',
            },
            rows: [
                {
                    option: {
                        title: "Steam®",
                        tr: 'store-integration:steam',
                    },
                    rows: [
                        {
                            text: "Enable Steam® store integration.",
                        },
                        {
                            toggle: 'store_integration__steam',
                        },
                    ],
                },
                {
                    option: {
                        title: "PlayStation®",
                        tr: 'store-integration:playstation',
                    },
                    rows: [
                        {
                            text: "Enable PlayStation® store integration.",
                        },
                        {
                            toggle: 'store_integration__playstation',
                        },
                    ],
                },
                {
                    option: {
                        title: "Xbox®",
                        tr: 'store-integration:xbox',
                    },
                    rows: [
                        {
                            text: "Enable Xbox® store integration.",
                        },
                        {
                            toggle: 'store_integration__xbox',
                        },
                    ],
                },
                {
                    option: {
                        title: "Nintendo®",
                        tr: 'store-integration:nintendo',
                    },
                    rows: [
                        {
                            text: "Enable Nintendo® store integration.",
                        },
                        {
                            toggle: 'store_integration__nintendo',
                        },
                    ],
                },
                {
                    option: {
                        title: "Epic Games®",
                        tr: 'store-integration:epic',
                    },
                    rows: [
                        {
                            text: "Enable Epic Games® store integration.",
                        },
                        {
                            toggle: 'store_integration__epic',
                        },
                    ],
                },
            ],
        },
    ],
    settings: {
        store_integration: {
            type: 'checkbox',
            default: true,
        },
        store_integration__steam: {
            type: 'checkbox',
            default: true,
        },
        store_integration__playstation: {
            type: 'checkbox',
            default: true,
        },
        store_integration__xbox: {
            type: 'checkbox',
            default: true,
        },
        store_integration__nintendo: {
            type: 'checkbox',
            default: true,
        },
        store_integration__epic: {
            type: 'checkbox',
            default: true,
        },
    },
};
