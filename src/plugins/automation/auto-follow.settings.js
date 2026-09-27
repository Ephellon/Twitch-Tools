/*** /plugins/automation/auto-follow.settings.js
 * Settings for "Follows" (Automation).
 */

export default {
    title: "Follows",
    tr: 'auto-follow',
    glyph: 'favorite',
    flags: ['small'],
    keywords: 'avenue,board,bulletin,bureau,button,cabinet,carrier,channels,charge,collectibles,commission,current,extras,flood,flow,follow,forum,group,handling,jury,knob,management,manipulation,means,medium,notice,notification,oversight,panel,plan,policy,proclamation,reminders,route,rush,spate,strategy,streams,surge,tab,task force,tide,torrent,transaction,treatment,tribunal,tributary,tunnel,warning',
    rows: [
        {
            text: "While watching a channel that is not followed, follow it automatically.",
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
                subtitle: 'Adjust options for "Follows"',
            },
            rows: [
                {
                    choice: 'auto_follow_none',
                    title: "Disabled",
                    tr: 'auto-follow:none',
                    text: "Do not use this feature",
                },
                {
                    choice: 'auto_follow_raids',
                    title: "Raids",
                    tr: 'auto-follow:raids',
                    text: "When participating in a raid, follow the channel being raided",
                },
                {
                    choice: 'auto_follow_time',
                    title: "Viewership",
                    tr: 'auto-follow:time',
                    text: "After watching {{auto_follow_time_minutes}} of content, follow the channel",
                },
                {
                    choice: 'auto_follow_all',
                    title: "Automatic",
                    tr: 'auto-follow:all',
                    text: "Follow all channels automatically",
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
