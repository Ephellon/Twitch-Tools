/*** /plugins/automation/auto-join.settings.js
 * Settings for "Auto-Join" (Automation).
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
            text: "When presented with a warning that the stream is intended for <b warning-text>mature audiences</b>, proceed automatically.",
        },
        {
            text: "This will also join <a href='https://help.twitch.tv/s/article/watch-parties' top-tooltip='Watch Parties'>Watch Parties</a> automatically.",
        },
    ],
    settings: {
        auto_accept_mature: {
            type: 'checkbox',
            default: false,
        },
    },
};
