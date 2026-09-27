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
            text: "When presented with Twitch™ emotes, collect them for usage (without requiring a subscription).",
        },
        {
            text: "This only works for the current stream you are viewing.",
        },
        {
            text: "This does <b>not</b> save/unlock the emote.",
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
