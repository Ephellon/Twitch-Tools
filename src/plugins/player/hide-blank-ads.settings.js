/*** /plugins/player/hide-blank-ads.settings.js
 * Settings for "Hide Blank Ads" (Customization).
 */

export default {
    title: "Hide Blank Ads",
    tr: 'hide-blank-ads',
    glyph: 'hide',
    flags: ['small', 'gold'],
    badges: {
        new: '4.15',
    },
    keywords: 'act,ad,ads,array,blink,demonstration,displays,example,exhibit,flutter,jerk,jiggle,parade,presentation,shudder,tremble,twitch',
    rows: [
        {
            toggle: 'hide_blank_ads',
        },
        {
            text: "Hide Twitch™'s <b attention-text top-tooltip='Purple Screen'>Blank Ads</b> while they play.",
        },
    ],
    settings: {
        hide_blank_ads: {
            type: 'checkbox',
            default: false,
        },
    },
};
