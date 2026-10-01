/*** /settings/sections/automatic-tab-reloads.js
 * Settings for "Automatic Tab Reloads" (Developer Features).
 */

export default {
    title: "Automatic Tab Reloads",
    tr: '@auto-tab-reloads',
    glyph: 'refresh',
    flags: ['small'],
    keywords: 'cause,data,extension,loss,reload,reloads,tab,tabs',
    rows: [
        {
            toggle: 'auto_tab_reloads',
        },
        {
            text: "Let TTV Tools reload tabs when needed.",
        },
        {
            text: "Unsaved work in those tabs may be lost.",
            attrs: {
                'warning-text': '',
            },
        },
    ],
    settings: {
        auto_tab_reloads: {
            type: 'checkbox',
            default: true,
        },
    },
};
