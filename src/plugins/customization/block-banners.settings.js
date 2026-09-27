/*** /plugins/customization/block-banners.settings.js
 * Settings for "Block Banners" (Customization).
 */

export default {
    title: "Block Banners",
    tr: 'block-banners',
    glyph: 'hide',
    flags: ['small'],
    badges: {
        new: '5.33.4.8',
    },
    keywords: 'ads,advertisement,banners,block,hide,remove',
    rows: [
        {
            toggle: 'block_banners',
        },
        {
            text: "Remove (ad) banners for: <em>Bits</em>, <em>SUBtember</em>, <em>Turbo</em>, etc.",
        },
    ],
    settings: {
        block_banners: {
            type: 'checkbox',
            default: false,
        },
    },
};
