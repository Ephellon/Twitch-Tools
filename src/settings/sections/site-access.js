/*** /settings/sections/site-access.js
 * Settings for "Site Access": lets the extension read the few non-Twitch sites it uses (stream statistics, store
 * prices, sync links) itself, instead of through a public CORS proxy. The list is the manifest's
 * `optional_host_permissions`; settings/site-access.js draws the button.
 */

export default {
    title: "Site Access",
    tr: 'site-access',
    glyph: 'globe',
    flags: ['small'],
    badges: {
        new: '6.0',
    },
    keywords: 'cors,proxy,permission,permissions,sites,network,statistics,store,steam,playstation,epic,xbox,tinyurl,twitchmetrics,twitchtracker',
    rows: [
        {
            text: "Let TTV Tools read stream stats, store prices and sync links straight from their sites. Without it, a public proxy is used, which can be slow or down.",
        },
        {
            html: "<div id='site-access-manager'></div>",
        },
    ],
    settings: {},
};
