/*** /settings/sections/keep-pop-outs.js
 * Settings for "Keep Pop-outs" (Video Recovery).
 */

export default {
    title: "Keep Pop-outs",
    tr: 'keep-popout',
    glyph: 'video',
    flags: ['small', 'gold'],
    keywords: 'another,current,delay,development,expansion,extension,flood,flow,increase,other,page,postponement,rush,spate,stream,surge,televised,that,tide,torrent,tributary,video',
    rows: [
        {
            toggle: 'keep_popout',
        },
        {
            text: "When moving to another page, prevent the extension from destroying the small videos (pop-outs) of any streams.",
        },
    ],
    settings: {
        keep_popout: {
            type: 'checkbox',
            default: false,
        },
    },
};
