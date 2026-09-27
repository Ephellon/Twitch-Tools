/*** /plugins/chat/filter-bulletins.js
 * Filter Bulletins.
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let BULLETIN_FILTERS, PINNED_FILTER;

plugin({
    id: 'chat.filter_bulletins',
    job: 'filter_bulletins',
    timer: -2_500,

    /**
     * Initializes the bulletin filter rules and pinned message filter state.
     */
    init() {
        BULLETIN_FILTERS = new Map([
            ['filter_messages__bullets_coin', ['coin']],
            ['filter_messages__bullets_raid', ['raid']],
            ['filter_messages__bullets_subs', ['dues', 'gift', 'keep']],
            ['filter_messages__bullets_note', ['note']],
            ['filter_messages__bullets_paid', ['PINNED_MESSAGES']],
        ]);

        PINNED_FILTER = -1;
    },

    /**
     * Applies filters to hide specific types of chat bulletins using CSS or removal intervals.
     * @param {Object} context - The plugin context
     */
    handler: (context) => {
        new context.StopWatch('filter_bulletins');

        for(const [key, subjects] of BULLETIN_FILTERS)
            if(key.endsWith('bullets_paid') && parseBool(Settings[key]))
                PINNED_FILTER = setInterval(() => $('[class*="pinned"i]:is([class*="by"i], [class*="card"i]), [class*="happening"i][class*="notification"i]')?.closest('[class*="chat"] > div:not([class])')?.remove(), 100);
            else if(parseBool(Settings[key]))
                AddCustomCSSBlock(`FilterBulletType${ key.slice(-5) }`, `${ subjects.map(subject => `[data-uuid][data-type="${ subject }"i]`).join(',') } { display:none!important }`);

        context.StopWatch.stop('filter_bulletins');
    },

    /**
     * Undoes bulletin filtering by removing custom CSS blocks and clearing pinned message intervals.
     */
    unhandler: () => {
        for(const [key, subjects] of BULLETIN_FILTERS)
            RemoveCustomCSSBlock(`FilterBulletType${ key.slice(-5) }`);
        clearInterval(PINNED_FILTER);
    },

    /**
     * Checks if any bulletin filtering options are enabled.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
        return [
            Settings.filter_messages__bullets_coin,
            Settings.filter_messages__bullets_raid,
            Settings.filter_messages__bullets_subs,
            Settings.filter_messages__bullets_note,
            Settings.filter_messages__bullets_paid,
        ].map(parseBool).contains(true);
    },

    /**
     * Initializes the bulletin filtering feature.
     */
    setup() {
        $remark("Adding bulletin filtering...");
    },
});
