/*** /plugins/video-recovery/recover-stream.recover-ads.settings.js
 * Settings for "Recover Ads" (Video Recovery).
 */

export default {
    title: "Recover Ads",
    tr: 'recover-ads',
    glyph: 'play',
    flags: ['small'],
    keywords: 'ads,advertisement,announcement,attack,attempt,bid,broadcast,commercial,display,endeavor,endorsement,exhibit,experiment,literature,notice,placard,poster,propaganda,publication,publicity,pursuit,shot,struggle,try',
    rows: [
        {
            toggle: 'recover_ads',
        },
        {
            text: "When an advertisement <b attention-text top-tooltip='Fails to play for more than 5 seconds'>freezes</b>, try to fix it.",
        },
    ],
    settings: {
        recover_ads: {
            type: 'checkbox',
            default: false,
            attrs: {
                requires: '#recover_stream',
            },
        },
    },
};
