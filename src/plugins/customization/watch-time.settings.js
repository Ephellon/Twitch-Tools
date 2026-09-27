/*** /plugins/customization/watch-time.settings.js
 * Settings for "Watch Time" (Customization).
 */

export default {
    title: "Watch Time",
    tr: 'placement:watch-time',
    glyph: 'latest',
    flags: ['small'],
    keywords: 'timepiece,watch,wristwatch',
    rows: [
        {
            text: "Where should the <b>Watch Time</b> be displayed?",
        },
        {
            select: 'watch_time_placement',
        },
    ],
    settings: {
        watch_time_placement: {
            type: 'select',
            options: [
                {
                    default: true,
                    value: 'null',
                    label: "Do not display",
                    attrs: {
                        'tr-id': 'placement:watch-time:options',
                    },
                },
                {
                    value: 'over',
                    label: "Over the video",
                    attrs: {
                        'tr-id': '',
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
