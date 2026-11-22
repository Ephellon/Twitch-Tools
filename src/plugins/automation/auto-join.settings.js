/*** /plugins/automation/auto-join.settings.js
 * Settings for "Auto-Join" (Up Next & Channel Hopping).
 */

export default {
    title: "Auto-Join",
    tr: 'auto-join',
    glyph: 'mod',
    flags: ['small'],
    keywords: 'audiences,auto join,celebration,congregation,crowd,current,dinner,flood,flow,gallery,gathering,market,ominous,parties,public,rush,spate,stream,surge,tide,timepiece,torrent,tributary,warning,watch,wristwatch',
    rows: [
        {
            toggle: 'auto_accept_mature',
        },
        {
            text: "Skip the <b warning-text>mature audiences</b> warning.",
        },
        {
            text: "Also joins <a href='https://help.twitch.tv/s/article/watch-parties' top-tooltip='Watch Parties'>Watch Parties</a> for you.",
        },
    ],
    settings: {
        auto_accept_mature: {
            type: 'checkbox',
            default: false,
        },
    },
};
