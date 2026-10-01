/*** /plugins/chat/auto-claim-bonuses.settings.js
 * Settings for "Claim Bonuses" (Automation).
 */

export default {
    title: "Claim Bonuses",
    tr: 'auto-claim-bonuses',
    glyph: 'channelpoints',
    flags: ['small'],
    keywords: 'avenue,benefit,bonus,bonus channel points,bounty,button,carrier,channel,dividend,gift,gratuity,knob,means,medium,perk,points,premium,prize,reward,route,tunnel',
    rows: [
        {
            toggle: 'auto_claim_bonuses',
        },
        {
            text: "When the <a href='https://help.twitch.tv/s/article/channel-points-guide' top-tooltip='Bonus Channel Points'><button style='background-color:var(--blue)!important'><span small black glyph='bonuschannelpoints'></span></button></a> button appears, click it for you.",
        },
    ],
    settings: {
        auto_claim_bonuses: {
            type: 'checkbox',
            default: true,
        },
    },
};
