/*** /plugins/customization/point-watcher.settings.js
 * Settings for "Point Watcher" (Customization).
 */

export default {
    title: "Point Watcher",
    tr: 'placement:point-watcher',
    glyph: 'channelpoints',
    flags: ['small', 'gold'],
    keywords: 'content,document,idea,paragraph,passage,quotation,text,theme,verse,watcher,wording',
    rows: [
        {
            text: "Where should the <b>Point Watcher</b> text be displayed?",
        },
        {
            select: 'point_watcher_placement',
        },
    ],
    settings: {
        point_watcher_placement: {
            type: 'select',
            options: [
                {
                    default: true,
                    value: 'null',
                    label: "Do not display",
                    attrs: {
                        'tr-id': 'placement:point-watcher:options',
                    },
                },
                {
                    value: 'on',
                    label: "On the tooltip",
                    attrs: {
                        'tr-id': '',
                    },
                },
            ],
        },
    },
};
