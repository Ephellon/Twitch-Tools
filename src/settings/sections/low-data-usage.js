/*** /settings/sections/low-data-usage.js
 * Settings for "Low Data Usage" (Developer Features).
 */

export default {
    title: "Low Data Usage",
    tr: '@low-data-mode',
    glyph: 'stats',
    flags: ['small'],
    badges: {
        new: '4.30',
    },
    keywords: 'appraisal,assessment,conclusion,data,delay,development,dossier,estimate,estimation,evaluation,evidence,expansion,extension,freedom,goods,guess,hour,increase,info,input,knowledge,management,measurement,opinion,opportunity,picture,postponement,projection,rating,statistics,survey,testimony,usage,valuation',
    rows: [
        {
            toggle: 'low_data_mode',
        },
        {
            text: "Use less data each hour.",
        },
        {
            text: "Current estimate {{est-data-usage}}",
        },
    ],
    settings: {
        low_data_mode: {
            type: 'checkbox',
            default: false,
            attrs: {
                'when-off': '5',
                'when-on': '15',
            },
        },
        'est-data-usage': {
            type: 'number',
            default: 0,
            store: false,
            attrs: {
                disabled: '',
                visible: '',
                controller: '#low_data_mode',
            },
            wrap: {},
        },
    },
};
