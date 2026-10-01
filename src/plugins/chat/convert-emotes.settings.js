/*** /plugins/chat/convert-emotes.settings.js
 * Settings for "Convert emotes" (Experimental Features).
 */

export default {
    title: "Convert emotes",
    tr: '@@convert-emotes',
    glyph: 'emotes',
    flags: ['small', 'gold'],
    keywords: 'blink,contribution,current,decipher,emotes,flood,flow,flutter,jerk,jiggle,management,rush,shudder,spate,stream,subscription,surge,tide,torrent,tremble,tributary,twitch,undo,unlock,unravel,usage,viewing',
    rows: [
        {
            toggle: 'convert_emotes',
        },
        {
            text: "Collect emotes from the stream you're watching, so you can use them without subscribing.",
        },
        {
            text: "This does <b>not</b> unlock or save them.",
            attrs: {
                'warning-text': '',
            },
        },
    ],
    settings: {
        convert_emotes: {
            type: 'checkbox',
            default: false,
        },
    },
};
