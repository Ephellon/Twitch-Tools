/*** /plugins/automation/claim-drops.js
 * Claim Drops.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let TTV_DROPS_FRAME, TTV_DROPS_CHECKER, TTV_DROPS_REFRESHER, TTV_DROPS_CLAIMED;

plugin({
    id: 'claim_drops',
    timer: -5_000,

    init() {
        TTV_DROPS_FRAME = undefined;
        TTV_DROPS_CHECKER = undefined;
        TTV_DROPS_REFRESHER = undefined;
        TTV_DROPS_CLAIMED = new Set;
    },

    handler: () => {
        TTV_DROPS_FRAME = furnish('iframe#tt-drops-claimer[src="/drops/inventory"]', { style: 'display:none!important' });

        $.body.append(TTV_DROPS_FRAME);

        (TTV_DROPS_CHECKER = (btn_str, svg_str) => {
            when(() => $.defined(btn_str, TTV_DROPS_FRAME.contentDocument)).then(() => {
                let claimed = 0;
                let dia_str = '[role*="dialog"i] [class*="combo"i] ~ * button';

                $.all(btn_str, TTV_DROPS_FRAME.contentDocument).map(btn => {
                    if($.nullish(svg_str, btn))
                        return;
                    if(TTV_DROPS_CLAIMED.has(getDOMPath(btn, getDOMPath.ANCHORED)))
                        return;
                    TTV_DROPS_CLAIMED.add(getDOMPath(btn, getDOMPath.ANCHORED));

                    ++claimed;
                    btn.click();

                    // when.sated(() => $.all(dia_str, TTV_DROPS_FRAME.contentDocument)).then(dialogs => dialogs.map(dia => dia.click(), top.focus()));
                });

                let error = $('.tw-alert-banner', TTV_DROPS_FRAME.contentDocument)?.innerText ?? '';

                if(claimed > 0) {
                    claimed = [claimed, 'drop'.pluralSuffix(claimed)].join(' ');

                    if(error.length > 0)
                        alert.timed(`An error occurred while trying to claim ${ claimed }`, 7000);
                    else
                        alert.timed(`Claiming ${ claimed }!`, 7000);
                }
            }).then(() => TTV_DROPS_CHECKER(btn_str, svg_str));
        })('.tw-tower *:not([class*="tooltip"i]) > button:not([class*="image"i]):not([disabled], [aria-label*="refresh"i])', 'path:is([clip-rule~="evenodd"i], [fill-rule~="evenodd"i])');

        TTV_DROPS_REFRESHER = setInterval(() => {
            TTV_DROPS_FRAME.src = parseURL(TTV_DROPS_FRAME.src).addSearch({ contentReload: Date.now() }).href;
        }, parseInt(Settings.claim_drops__interval ?? 10) * 60_000);
    },

    unhandler: () => {
        TTV_DROPS_FRAME?.remove();
        clearInterval(TTV_DROPS_REFRESHER);
    },

    enabled() {
        return UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.claim_drops);
    },

    setup() {
        $remark('Creating Drop claimer...');
    },
});
