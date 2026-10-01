/*** /settings/sections/use-fine-details.js
 * Settings for "Use Fine Details" (Developer Features).
 */

export default {
    title: "Use Fine Details",
    tr: '@fine-details',
    glyph: 'stats',
    flags: ['small'],
    keywords: 'accomplished,action,admirable,attractive,background,beautiful,blink,contact,cool,data,delay,details,development,dossier,elegant,evidence,exceptional,expansion,expensive,experience,exquisite,extension,fashionable,fine,first-rate,flutter,goods,great,handsome,increase,info,input,involvement,jerk,jiggle,know-how,knowledge,lovely,magnificent,maturity,minutiae,neat,outstanding,participation,patience,picture,pleasant,postponement,practice,rare,reality,refined,sense,shudder,skill,smart,solid,splendid,statistics,striking,struggle,subtle,superior,testimony,training,tremble,twitch,understanding,well-made,wisdom',
    rows: [
        {
            toggle: 'fine_details',
        },
        {
            text: "Use extra data from Twitch™ to improve features.",
        },
        {
            text: "Nothing new is collected; it only uses data Twitch™ already has.",
            attrs: {
                'warning-text': '',
            },
        },
    ],
    settings: {
        fine_details: {
            type: 'checkbox',
            default: false,
        },
    },
};
