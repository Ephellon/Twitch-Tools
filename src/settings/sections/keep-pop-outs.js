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
            text: "Keep small stream videos (pop-outs) open when you move to another page.",
        },
    ],
    settings: {
        keep_popout: {
            type: 'checkbox',
            default: false,
        },
    },
};
