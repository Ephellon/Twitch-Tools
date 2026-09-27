/*** /plugins/chat/rewards-calculator.settings.js
 * Settings for "Rewards Calculator" (Currencies).
 */

export default {
    title: "Rewards Calculator",
    tr: 'rewards-calculator',
    glyph: 'channelpoints',
    flags: ['small'],
    keywords: 'accolade,appraisal,assessment,award,benefit,bonus,bounty,calculator,compensation,conclusion,current,dividend,estimates,estimation,evaluation,flood,flow,guess,honor,measurement,needs,opinion,premium,profit,projection,punishment,rating,remuneration,rewards,rush,spate,stream,surge,survey,tide,torrent,tributary,valuation',
    rows: [
        {
            toggle: 'rewards_calculator',
        },
        {
            text: "Estimates how long a stream needs to be watched to redeem <a href='https://help.twitch.tv/s/article/channel-points-guide' top-tooltip='Channel Points'><button style='background-color:var(--grey)!important'><span small purple glyph='channelpoints'></span></button></a> rewards.",
        },
    ],
    settings: {
        rewards_calculator: {
            type: 'checkbox',
            default: false,
        },
    },
};
