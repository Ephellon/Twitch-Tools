/*** /plugins/chat/filter-bulletins.js
 * Filter Bulletins.
 * Moved verbatim from chat.js (Chat__Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.filter_bulletins',

    async install(context) {
        let BULLETIN_FILTERS = new Map([
            ['filter_messages__bullets_coin', ['coin']],
            ['filter_messages__bullets_raid', ['raid']],
            ['filter_messages__bullets_subs', ['dues', 'gift', 'keep']],
            ['filter_messages__bullets_note', ['note']],
            ['filter_messages__bullets_paid', ['PINNED_MESSAGES']],
        ]),
            PINNED_FILTER = -1;

        Handlers.filter_bulletins = () => {
            new context.StopWatch('filter_bulletins');

            for(let [key, subjects] of BULLETIN_FILTERS)
                if(key.endsWith('bullets_paid') && parseBool(Settings[key]))
                    PINNED_FILTER = setInterval(() => $('[class*="pinned"i]:is([class*="by"i], [class*="card"i]), [class*="happening"i][class*="notification"i]')?.closest('[class*="chat"] > div:not([class])')?.remove(), 100);
                else if(parseBool(Settings[key]))
                    AddCustomCSSBlock(`FilterBulletType${ key.slice(-5) }`, `${ subjects.map(subject => `[data-uuid][data-type="${ subject }"i]`).join(',') } { display:none!important }`);

            context.StopWatch.stop('filter_bulletins');
        };
        Timers.filter_bulletins = -2_500;

        Unhandlers.filter_bulletins = () => {
            for(let [key, subjects] of BULLETIN_FILTERS)
                RemoveCustomCSSBlock(`FilterBulletType${ key.slice(-5) }`);
            clearInterval(PINNED_FILTER);
        };

        __FilterBulletins__:
        if([
            Settings.filter_messages__bullets_coin,
            Settings.filter_messages__bullets_raid,
            Settings.filter_messages__bullets_subs,
            Settings.filter_messages__bullets_note,
            Settings.filter_messages__bullets_paid,
        ].map(parseBool).contains(true)) {
            $remark("Adding bulletin filtering...");

            RegisterJob('filter_bulletins');
        }
    },
});
