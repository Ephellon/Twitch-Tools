/*** /plugins/automation/claim-drops.settings.js
 * Settings for "Claim Drops" (Automation).
 */

export default {
    title: "Claim Drops",
    tr: 'claim-drops',
    glyph: 'loot',
    flags: ['small'],
    badges: {
        new: '5.32.14',
    },
    keywords: 'avenue,benefit,drop,bounty,button,carrier,channel,dividend,gift,gratuity,knob,loot,means,medium,perk,points,premium,prize,reward,route,tunnel',
    rows: [
        {
            toggle: 'claim_drops',
        },
        {
            text: "Claim your <a href='https://help.twitch.tv/s/article/mission-based-drops' top-tooltip='Drops'>Drops</a> every {{claim_drops__interval}} while you watch.",
        },
    ],
    settings: {
        claim_drops: {
            type: 'checkbox',
            default: true,
        },
        claim_drops__interval: {
            type: 'number',
            default: 10,
            min: 5,
            max: 60,
            step: 1,
            wrap: {
                'fix-unit': 'min',
            },
        },
    },
};
