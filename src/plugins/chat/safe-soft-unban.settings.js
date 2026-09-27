/*** /plugins/chat/safe-soft-unban.settings.js
 * Settings for "Soft Unban" (Experimental Features).
 */

export default {
    title: "Soft Unban",
    tr: '@@soft-unban',
    glyph: 'chat',
    flags: ['small', 'gold'],
    badges: {
        new: '3.1',
    },
    keywords: 'channels,charge,chatter,conversation,gossip,handling,management,manipulation,oversight,plan,policy,strategy,transaction,treatment,viewing',
    rows: [
        {
            toggle: 'soft_unban',
        },
        {
            text: "Re-enable chat for channels you've been banned from.",
        },
        {
            text: "This only re-enables viewing the chat.",
            attrs: {
                'warning-text': '',
            },
        },
        {
            extras: {
                title: "Options",
                tr: 'options',
                subtitle: 'Adjust options for "Soft Unban"',
            },
            rows: [
                {
                    option: {
                        title: "Fade Messages",
                        tr: '@@soft-unban:options:fade-messages',
                    },
                    rows: [
                        {
                            toggle: 'soft_unban_fade_old_messages',
                        },
                        {
                            text: "Messages will be visible for <b>30s</b>.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Keep Bots",
                        tr: '@@soft-unban:options:keep-bots',
                    },
                    rows: [
                        {
                            toggle: 'soft_unban_keep_bots',
                        },
                        {
                            text: "Display bot messages.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Prevent Clips",
                        tr: '@@soft-unban:options:prevent-clips',
                    },
                    rows: [
                        {
                            toggle: 'soft_unban_prevent_clipping',
                        },
                        {
                            text: "Hide Twitch™ clips.",
                        },
                    ],
                },
            ],
        },
    ],
    settings: {
        soft_unban: {
            type: 'checkbox',
            default: false,
        },
        soft_unban_fade_old_messages: {
            type: 'checkbox',
            default: false,
        },
        soft_unban_keep_bots: {
            type: 'checkbox',
            default: false,
        },
        soft_unban_prevent_clipping: {
            type: 'checkbox',
            default: false,
        },
    },
};
