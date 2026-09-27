/*** /settings/sections/context-menu-override.js
 * Settings for "Context Menu Override" (Customization).
 */

export default {
    title: "Context Menu Override",
    tr: 'context-menu-override',
    glyph: 'latest',
    flags: ['small'],
    badges: {
        new: '5.34',
    },
    keywords: 'click,context,custom,menu,right,over,popup,ride',
    rows: [
        {
            toggle: 'context_menu_override',
        },
        {
            text: "Use a custom context menu (right-click) on select Twitch pages.",
        },
    ],
    settings: {
        context_menu_override: {
            type: 'checkbox',
            default: false,
        },
    },
};
