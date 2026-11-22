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
            text: "When a marked channel goes live, one of your other Twitch tabs goes to it right away and stays until the stream ends.",
        },
        {
            text: "Needs <b>Up Next</b> › <em>One Instance</em> on (the <b>Up Next</b> tab is never used), or <b>Up Next</b> off. Mark a channel with the <b>Max Watchtime</b> button on its About panel, under DVR.",
        },
    ],
    settings: {
        max_watchtime: {
            type: 'checkbox',
            default: true,
        },
    },
};
