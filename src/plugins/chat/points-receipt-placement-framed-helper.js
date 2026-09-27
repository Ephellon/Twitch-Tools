/*** /plugins/chat/points-receipt-placement-framed-helper.js
 * Points Receipt (Helper) - NOT A SETTING. This is a hlper for "Points Receipt (Placement)".
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.points_receipt_placement_framed_helper',
    job: 'points_receipt_placement_framed_helper',
    timer: 1000,

    handler: () => {
        let placement;

        if((placement = Settings.points_receipt_placement ??= "null").equals("null"))
            return;

        let coin = $.last('[data-test-selector*="balance-string"i]')?.closest('button')?.querySelector('img[alt]');

        let balance = $.last('[data-test-selector*="balance-string"i]')?.innerText,
            exact_debt = $('[data-test-selector^="prediction-checkout"i], [data-test-selector*="user-prediction"i][data-test-selector*="points"i], [data-test-selector*="user-prediction"i] p')?.innerText,
            exact_change = $('[class*="points"i][class*="summary"i][class*="add-text"i]')?.innerText;

        top.postMessage({ action: 'jump', points_receipt_placement: { balance, coin_face: coin?.src, coin_name: coin?.alt, exact_debt, exact_change } }, location.origin);
    },

    enabled() {
        return parseBool(Settings.points_receipt_placement);
    },
});
