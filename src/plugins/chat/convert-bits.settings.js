/*** /plugins/chat/convert-bits.settings.js
 * Settings for "Convert Bits" (Currencies).
 */

export default {
    title: "Convert Bits",
    tr: 'convert-bits',
    glyph: 'bits',
    flags: ['small'],
    keywords: 'amount,bits,bulk,chunk,detritus,dollar,extent,junk,load,lot,measure,money,number,remains,rubbish,rubble,supply,ton,trash,usd,volume,wreck,wreckage',
    rows: [
        {
            toggle: 'convert_bits',
        },
        {
            text: "When presented with <a href='https://www.twitch.tv/creatorcamp/en/get-rewarded/bits-and-subscriptions/#bits' top-tooltip='Bits'><button style='background-color:var(--grey)!important'><img src='bits.gif' alt='Bits' height='20' width='20' type='glyph'></button></a> show the true <b>USD</b> amount they represent.",
        },
    ],
    settings: {
        convert_bits: {
            type: 'checkbox',
            default: true,
        },
    },
};
