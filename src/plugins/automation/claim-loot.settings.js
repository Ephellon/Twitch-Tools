/*** /plugins/automation/claim-loot.settings.js
 * Settings for "Claim Prime Loot" (Automation).
 */

export default {
    title: "Claim Prime Loot",
    tr: 'claim-loot',
    glyph: 'crown',
    flags: ['small', 'gold'],
    badges: {
        new: '3.2',
    },
    keywords: 'action,allegation,application,assertion,booty,call,case,claim,demand,endless,gaming,interest,loads,loot,myriad,page,petition,plea,request,requirement,spoils,suit,uncounted,untold',
    rows: [
        {
            toggle: 'claim_loot',
        },
        {
            text: "Automatically claim and dismiss <b>Prime Gaming Loot</b> offers when the page loads.",
        },
    ],
    settings: {
        claim_loot: {
            type: 'checkbox',
            default: false,
        },
    },
};
