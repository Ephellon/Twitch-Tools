/*** /plugins/automation/claim-loot.js
 * Claim Loot.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'claim_loot',
    timer: -1_000,

    handler: () => {
        when.defined(() => $('.prime-offers button')).then(prime_btn => {
            let handled = 0;
            prime_btn.click();

            // There's at least one offer...
            when.sated(() => $.all('[class*="prime"i][class*="offer"i][class*="header"i] ~ *'), 750).then(offerContainers => {
                for(let container of offerContainers)
                    when(container => {
                        let offerClaimLink = $('[data-a-target*="prime"i][data-a-target*="claim"i]', container);
                        let offerClaimButton = $('button[data-a-target*="prime-claim"i]', container);
                        let offerDismissButton = $('[class*="prime-offer"i][class*="dismiss"i] button', container);

                        if(nullish(offerClaimLink ?? offerClaimButton ?? offerDismissButton))
                            return false;

                        let gameTitle = $('[data-a-target*="prime-offer"i][data-a-target*="game"i][data-a-target*="title"i]', container)?.innerText?.trim();
                        let offerTitle = $('[data-a-target*="prime-offer"i][data-a-target*="title"i]:not([data-a-target*="game"i])', container)?.innerText?.trim();
                        let offerImage = $('img', container)?.src;
                        let offerDescription = $('[class*="prime-offer"i][class*="description"i]', container)?.innerText?.trim();
                        let offerPublisher = $('[class*="prime-offer"i][class*="publisher"i]', container)?.innerText?.trim();

                        $notice(`Claiming Prime Loot Offer:`, { title: offerTitle, game: gameTitle, description: offerDescription, publisher: offerPublisher, type: (offerClaimButton? 'BUTTON_CLAIM': 'LINK_CLAIM') });

                        if(defined(offerClaimButton))
                            offerClaimButton.click();
                        else if(defined(offerClaimLink))
                            offerDismissButton?.click();

                        ++handled;

                        return true;
                    }, 1e3, container).then(() => {
                        if(handled >= offerContainers.length)
                            prime_btn.click();
                    });
            });

            // There are no offers...
            when.defined(() => $('[class*="prime"i][class*="empty"i]')).then(() => prime_btn.click());
        });
    },

    enabled() {
        return UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.claim_loot);
    },

    setup() {
        $remark("Claiming Prime Gaming Loot...");
    },
});
