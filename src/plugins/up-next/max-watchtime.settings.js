/*** /plugins/up-next/max-watchtime.settings.js
 * Settings for "Max Watchtime" (Up Next & Channel Hopping).
 */

export default {
    title: "Max Watchtime",
    tr: 'max-watchtime',
    glyph: 'fire',
    flags: ['small'],
    badges: {
        new: '6.1',
    },
    keywords: 'max watchtime,always,channel,favorite,immediately,live,maximum,priority,tab,watch time,watchtime',
    rows: [
        {
            toggle: 'max_watchtime',
        },
        {
            text: "When a channel you marked goes live, a tab with <b>Up Next</b> off goes to it right away and stays until the stream ends.",
        },
        {
            text: "Mark a channel with the <b>Max Watchtime</b> button on its About panel (under DVR). With no tab that has Up Next off, nothing happens.",
        },
    ],
    settings: {
        max_watchtime: {
            type: 'checkbox',
            default: true,
        },
    },
};
