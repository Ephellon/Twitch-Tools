/*** /settings/sections/accent-color.js
 * Settings for "Accent Color" (Customization).
 */

export default {
    title: "Accent Color",
    tr: 'accent-color',
    glyph: 'latest',
    flags: ['small'],
    badges: {
        new: '4.2.0',
    },
    keywords: 'accent,color,glow,hue,intensity,paint',
    rows: [
        {
            text: "What should the TTV Tools' accent color be?",
        },
        {
            select: 'accent_color',
        },
    ],
    settings: {
        accent_color: {
            type: 'select',
            options: [
                {
                    value: 'colored/contrast',
                    label: "Auto",
                    attrs: {
                        'tr-id': 'color:auto',
                    },
                },
                {
                    value: 'blue/12',
                    label: "Blue",
                    attrs: {
                        'tr-id': 'color:blue',
                    },
                },
                {
                    default: true,
                    value: 'twitch-purple/12',
                    label: "Purple",
                    attrs: {
                        'tr-id': 'color:purple',
                    },
                },
                {
                    value: 'red/15',
                    label: "Red",
                    attrs: {
                        'tr-id': 'color:red',
                    },
                },
            ],
        },
    },
};
