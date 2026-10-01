/*** /settings/sections/display-statistics.js
 * Settings for "Display Statistics" (Developer Features).
 */

export default {
    title: "Display Statistics",
    tr: '@stats',
    glyph: 'stats',
    flags: ['small', 'gold'],
    keywords: 'act,array,data,delay,demonstration,development,display,example,exhibit,expansion,extension,increase,parade,postponement,presentation,statistics,stats',
    rows: [
        {
            toggle: 'show_stats',
        },
        {
            text: "Show extra details from some features, like numbers, images and errors.",
        },
    ],
    settings: {
        show_stats: {
            type: 'checkbox',
            default: false,
        },
    },
};
