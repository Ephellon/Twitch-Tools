/*** /plugins/automation/claim-prime.js
 * Claim Prime - Still requires trusted interaction.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'claim_prime',
    timer: -5000,

    handler: () => {
        Cache.load(['PrimeSubscription', 'PrimeSubscriptionReclaims'], ({ PrimeSubscription, PrimeSubscriptionReclaims }) => {
            PrimeSubscription ??= '';
            PrimeSubscriptionReclaims ??= 0;

            // Set the current streamer for auto-renewal...
            if(PrimeSubscription.length < 1 && STREAMER.main)
                Cache.save({ PrimeSubscription: (PrimeSubscription = STREAMER.sole.toString(36).toUpperCase()), PrimeSubscriptionReclaims: (PrimeSubscriptionReclaims = parseInt(Settings.claim_prime__max_claims)) });

            resubscribing:
            if(PrimeSubscription.equals(STREAMER.sole.toString(36))) {
                if(PrimeSubscriptionReclaims < 3)
                    confirm.timed(`Please review your settings. TTV Tools ${ ['was', 'is'][+!!PrimeSubscriptionReclaims] } still reclaiming your <strong>Prime Subscription</strong> for this channel!`)
                        .then(answer => {
                            // OK → Open the settings page
                            if(answer)
                                postMessage({ action: 'open-options-page' });
                            // Cancel → Remove the warning and reset the setting
                            else if(answer === false)
                                Cache.save({ PrimeSubscription: '', PrimeSubscriptionReclaims: 0 });
                        });

                if(PrimeSubscriptionReclaims < 1)
                    break resubscribing;

                const button = $('[data-a-target="subscribe-button"i]');

                if(nullish(button))
                    break resubscribing;
                button.click();

                when.defined(() => $('.channel-root .support-panel input[type="checkbox"i]:not(:checked)'))
                    .then(input => {
                        input.checked = true;
                        input.closest('.support-panel').querySelector('button:only-child')?.click();

                        when(() => STREAMER.main)
                            .then(() => {
                                Cache.save({ PrimeSubscriptionReclaims: --PrimeSubscriptionReclaims });

                                $warn(`[Prime Subscription] just renewed your subscription to ${ STREAMER.name } @ ${ (new Date).toJSON() }`)
                                    .toNativeStack();
                            });
                    });
            }
        });
    },

    enabled() {
        return UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.claim_prime);
    },

    setup() {
        $remark("Claiming Prime Subscription...");
    },
});
