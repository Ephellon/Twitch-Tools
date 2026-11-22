/*** /plugins/automation/auto-follow.settings.js
 * Settings for "Auto-Follow" (Up Next & Channel Hopping).
 */

export default {
    title: "Auto-Follow",
    tr: 'auto-follow',
    glyph: 'favorite',
    flags: ['small'],
    keywords: 'follows,avenue,board,bulletin,bureau,button,cabinet,carrier,channels,charge,collectibles,commission,current,extras,flood,flow,follow,forum,group,handling,jury,knob,management,manipulation,means,medium,notice,notification,oversight,panel,plan,policy,proclamation,reminders,route,rush,spate,strategy,streams,surge,tab,task force,tide,torrent,transaction,treatment,tribunal,tributary,tunnel,warning',
    rows: [
        {
            text: "Follow channels automatically while you watch them.",
        },
        {
            html: `<div>
                    <!-- EMPTY OFFSET -->
                </div>`,
        },
        {
            extras: {
                title: "Options",
                tr: 'options',
                subtitle: 'Adjust options for "Auto-Follow"',
            },
            rows: [
                {
                    choice: 'auto_follow_none',
                    title: "Disabled",
                    tr: 'auto-follow:none',
                    text: "Off",
                },
                {
                    choice: 'auto_follow_raids',
                    title: "Raids",
                    tr: 'auto-follow:raids',
                    text: "When you join a raid, follow the raided channel",
                },
                {
                    choice: 'auto_follow_time',
                    title: "Viewership",
                    tr: 'auto-follow:time',
                    text: "After you watch a channel for {{auto_follow_time_minutes}}, follow it",
                },
                {
                    choice: 'auto_follow_all',
                    title: "Automatic",
                    tr: 'auto-follow:all',
                    text: "Follow every channel you watch",
                },
            ],
        },
    ],
    settings: {
        auto_follow_none: {
            type: 'radio',
            default: true,
            group: 'auto-follow',
        },
        auto_follow_raids: {
            type: 'radio',
            default: false,
            group: 'auto-follow',
        },
        auto_follow_time: {
            type: 'radio',
            default: false,
            group: 'auto-follow',
        },
        auto_follow_time_minutes: {
            type: 'number',
            default: 15,
            min: 5,
            step: 5,
            unit: 'min',
        },
        auto_follow_all: {
            type: 'radio',
            default: false,
            group: 'auto-follow',
        },
    },
};
