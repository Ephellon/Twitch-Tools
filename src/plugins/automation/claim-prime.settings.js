/*** /plugins/automation/claim-prime.settings.js
 * Settings for "Prime Subscription" (Automation).
 */

export default {
    title: "Prime Subscription",
    tr: 'claim-prime',
    glyph: 'crown',
    flags: ['small', 'gold'],
    badges: {
        beta: '5.28',
    },
    keywords: 'age,contribution,date,day,era,future,generation,hour,life,max,moment,month,occasion,pace,past,point,present,season,second,space,stage,subscription,subscription,term,turn,week,while,year',
    rows: [
        {
            toggle: 'claim_prime',
        },
        {
            text: "Renew your free <a href='https://help.twitch.tv/s/article/how-to-use-twitch-prime-subscriptions' top-tooltip='Prime Gaming Subscription'>Prime Subscription</a> each month.",
        },
        {
            extras: {
                title: "Options",
                tr: 'options',
                subtitle: 'Adjust options for "Prime Subscription"',
            },
            rows: [
                {
                    option: {
                        title: "Max Resubscriptions",
                        tr: 'claim-prime:max-claims',
                    },
                    rows: [
                        {
                            text: "<b>Prime Subscription</b> will resubscribe for {{claim_prime__max_claims}} months.",
                        },
                    ],
                },
            ],
        },
    ],
    settings: {
        claim_prime: {
            type: 'checkbox',
            default: false,
        },
        claim_prime__max_claims: {
            type: 'number',
            default: 3,
            min: 1,
            max: 48,
            step: 1,
            unit: '🔢',
        },
    },
};
