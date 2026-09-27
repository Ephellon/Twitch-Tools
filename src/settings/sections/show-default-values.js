/*** /settings/sections/show-default-values.js
 * Settings for "Show Default Values" (Developer Features).
 */

export default {
    title: "Show Default Values",
    tr: '@default',
    glyph: 'info',
    flags: ['small'],
    badges: {
        'hide-on': 'show-defaults',
    },
    keywords: 'default,delinquency,nonpayment,values',
    rows: [
        {
            html: `<div>
                    <a href='?show-defaults=true' target='_self' continue-search>
                        <button tr-id>Show</button>
                    </a>
                </div>`,
        },
        {
            text: "Show the default values.",
        },
    ],
    settings: {},
};
