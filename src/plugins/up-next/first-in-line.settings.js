/*** /plugins/up-next/first-in-line.settings.js
 * Settings for "First in Line / Up Next" (Automation).
 */

export default {
    title: "First in Line / Up Next",
    tr: 'first-in-line',
    glyph: 'favorite',
    flags: ['small'],
    badges: {
        beta: '5.34.0.1',
    },
    keywords: 'avenue,blink,carrier,channel,current,flood,flow,flutter,jerk,jiggle,keep,keep reminders,live,live reminders,means,medium,route,rush,shudder,spate,stream,surge,tide,torrent,tremble,tributary,tunnel,twitch',
    rows: [
        {
            text: "Go to a channel's stream when it goes live.",
        },
        {
            text: "<b>Up Next</b> keeps a queue of channels to watch next.",
        },
        {
            extras: {
                title: "Options",
                tr: 'options',
                subtitle: 'Adjust options for "First in Line"',
            },
            rows: [
                {
                    choice: 'first_in_line_none',
                    title: "Disabled",
                    tr: 'first-in-line:disabled',
                    text: "Do not use this feature",
                },
                {
                    choice: 'first_in_line_now',
                    title: "Immediate",
                    tr: 'first-in-line:immediate',
                    text: "Go to all streams as soon as they go live",
                    attrs: {
                        beta: '',
                    },
                },
                {
                    choice: 'first_in_line',
                    title: "Notification",
                    tr: 'first-in-line:notification',
                    text: "When you receive a notification for a channel going live, go to its stream after {{first_in_line_time_minutes}}",
                },
                {
                    choice: 'first_in_line_plus',
                    title: "Appearance",
                    tr: 'first-in-line:appearance',
                    text: "When a channel appears in your Followed Channels, go to its stream after {{first_in_line_plus_time_minutes}}",
                },
                {
                    choice: 'first_in_line_all',
                    title: "Automatic",
                    tr: 'first-in-line:smart-notifications',
                    text: "Go to all streams automatically after {{first_in_line_all_time_minutes}}",
                    titleAttrs: {
                        bubble: 'Smart Notifications',
                    },
                },
            ],
        },
        {
            extras: {
                title: "Extras",
                tr: 'extras',
                subtitle: 'Adjust settings for "Up Next"',
            },
            rows: [
                {
                    option: {
                        title: "One Instance",
                        tr: 'up-next:extras',
                    },
                    rows: [
                        {
                            toggle: 'up_next__one_instance',
                        },
                        {
                            text: "Only the first tab to load <b>Up Next</b> is allowed to use it.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Keep Status",
                        tr: 'up-next:keep-status',
                    },
                    rows: [
                        {
                            toggle: 'up_next__keep_status',
                        },
                        {
                            text: "If you pause <b>Up Next</b>, it stays paused when you go to another channel in the same tab.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Rushing",
                        tr: 'up-next:rushing',
                    },
                    rows: [
                        {
                            select: 'up_next__rushing',
                        },
                        {
                            text: "What happens to the countdown when you start or stop rushing the queue.",
                        },
                    ],
                },
                {
                    option: {
                        title: "<span class='live'>LIVE</span> Reminders",
                        tr: 'auto-follow:live-reminders',
                    },
                    attrs: {
                        disabled: '',
                    },
                    rows: [
                        {
                            toggle: 'live_reminders',
                        },
                        {
                            text: "Add a <b attention-text top-tooltip='A notification will display when a channel goes live'>reminder</b> button to the channel's <b>About</b> panel.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Keep Reminders",
                        tr: 'auto-follow:keep-live-reminders',
                    },
                    rows: [
                        {
                            toggle: 'keep_live_reminders',
                        },
                        {
                            text: "Don't remove <span class='live'>LIVE</span> Reminders automatically.",
                        },
                    ],
                },
            ],
        },
    ],
    settings: {
        first_in_line_none: {
            type: 'radio',
            default: true,
            group: 'first-in-line',
        },
        first_in_line_now: {
            type: 'radio',
            default: false,
            group: 'first-in-line',
        },
        first_in_line: {
            type: 'radio',
            default: false,
            group: 'first-in-line',
        },
        first_in_line_time_minutes: {
            type: 'number',
            default: 15,
            min: 5,
            step: 5,
            unit: 'min',
        },
        first_in_line_plus: {
            type: 'radio',
            default: false,
            group: 'first-in-line',
        },
        first_in_line_plus_time_minutes: {
            type: 'number',
            default: 15,
            min: 5,
            step: 5,
            unit: 'min',
        },
        first_in_line_all: {
            type: 'radio',
            default: false,
            group: 'first-in-line',
        },
        first_in_line_all_time_minutes: {
            type: 'number',
            default: 15,
            min: 5,
            step: 5,
            unit: 'min',
        },
        up_next__one_instance: {
            type: 'checkbox',
            default: false,
        },
        up_next__keep_status: {
            type: 'checkbox',
            default: false,
        },
        up_next__rushing: {
            type: 'select',
            options: [
                {
                    default: true,
                    value: 'keep',
                    label: "Keep time left",
                    attrs: {
                        title: "Starting lowers the countdown to 5 minutes if more is left; stopping keeps the time that is left.",
                    },
                },
                {
                    value: 'reset',
                    label: "Reset",
                    attrs: {
                        title: "Stopping starts the full wait again.",
                    },
                },
                {
                    value: 'split',
                    label: "Two timers",
                    attrs: {
                        title: "Stopping goes back to where the normal countdown was.",
                    },
                },
                {
                    value: 'scale',
                    label: "Scale",
                    attrs: {
                        title: "The time left grows or shrinks by the same ratio as the wait.",
                    },
                },
                {
                    value: 'once',
                    label: "Rush once",
                    attrs: {
                        title: "Rushing turns itself off after the next channel.",
                    },
                },
            ],
        },
        live_reminders: {
            type: 'checkbox',
            default: true,
            attrs: {
                disabled: '',
            },
        },
        keep_live_reminders: {
            type: 'checkbox',
            default: false,
        },
    },
};
