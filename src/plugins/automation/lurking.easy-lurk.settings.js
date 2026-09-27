/*** /plugins/automation/lurking.easy-lurk.settings.js
 * Settings for "Easy Lurk" (Customization).
 */

export default {
    title: "Easy Lurk",
    tr: 'placement:away-mode',
    glyph: 'latest',
    flags: ['small'],
    keywords: 'button,knob',
    rows: [
        {
            text: "Where should the <b>Easy Lurk</b> button be displayed?",
        },
        {
            select: 'away_mode_placement',
        },
    ],
    settings: {
        away_mode_placement: {
            type: 'select',
            options: [
                {
                    default: true,
                    value: 'null',
                    label: "Do not display",
                    attrs: {
                        'tr-id': 'placement:away-mode:options',
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
