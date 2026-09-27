/*** /settings/sections/display-console-messages.js
 * Settings for "Display Console Messages" (Developer Features).
 */

export default {
    title: "Display Console Messages",
    tr: '@console',
    glyph: 'stats',
    flags: ['small', 'gold'],
    keywords: 'act,array,assuage,console,delay,demonstration,development,display,example,exhibit,expansion,extension,increase,messages,parade,postponement,presentation,soothe,writing',
    rows: [
        {
            toggle: 'display_in_console',
        },
        {
            text: "Allow the extension to display messages in the console.",
        },
        {
            extras: {
                title: "Extras",
                tr: 'extras',
                subtitle: 'Adjust settings for "Display Console Messages"',
            },
            rows: [
                {
                    option: {
                        title: "Allow logs",
                        tr: '@console.log',
                    },
                    rows: [
                        {
                            toggle: 'display_in_console__log',
                        },
                        {
                            text: "Display <code style:log>console.log</code> messages.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Allow warnings",
                        tr: '@console.warn',
                    },
                    rows: [
                        {
                            toggle: 'display_in_console__warn',
                        },
                        {
                            text: "Display <code style:warn>console.warn</code> messages.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Allow errors",
                        tr: '@console.error',
                    },
                    rows: [
                        {
                            toggle: 'display_in_console__error',
                        },
                        {
                            text: "Display <code style:error>console.error</code> messages.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Allow remarks",
                        tr: '@console.remark',
                    },
                    rows: [
                        {
                            toggle: 'display_in_console__remark',
                        },
                        {
                            text: "Display <code style:remark>console.remark</code> messages.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Allow notices",
                        tr: '@console.notice',
                    },
                    rows: [
                        {
                            toggle: 'display_in_console__notice',
                        },
                        {
                            text: "Display <code style:notice>console.notice</code> messages.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Allow ignores",
                        tr: '@console.ignore',
                    },
                    rows: [
                        {
                            toggle: 'display_in_console__ignore',
                        },
                        {
                            text: "Display <code style:ignore>console.ignore</code> messages.",
                        },
                    ],
                },
            ],
        },
    ],
    settings: {
        display_in_console: {
            type: 'checkbox',
            default: false,
        },
        display_in_console__log: {
            type: 'checkbox',
            default: true,
        },
        display_in_console__warn: {
            type: 'checkbox',
            default: true,
        },
        display_in_console__error: {
            type: 'checkbox',
            default: true,
        },
        display_in_console__remark: {
            type: 'checkbox',
            default: true,
        },
        display_in_console__notice: {
            type: 'checkbox',
            default: true,
        },
        display_in_console__ignore: {
            type: 'checkbox',
            default: true,
        },
    },
};
