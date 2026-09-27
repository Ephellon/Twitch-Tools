/*** /plugins/chat/safe-point-watcher-helper.js
 * Point Watcher (Helper).
 * Moved verbatim from chat.js (Chat__Initialize_Safe_Mode) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat-safe.point_watcher_helper',

    async install(context) {
        let pointWatcherCounter = 0,
            hasPointsEnabled = false,
            ALL_CHANNEL_POINT_REWARDS;

        Handlers.point_watcher_helper = async() => {
            if(top.__readyState__ == "unloading")
                return;

            Cache.load(['ChannelPoints'], ({ ChannelPoints }) => {
                let [amount, fiat, face, notEarned, pointsToEarnNext] = ((ChannelPoints ??= {})[context.STREAMER.name] ?? 0).toString().split('|'),
                    balance = $.last('[data-test-selector*="balance-string"i]'),
                    allRewards = ALL_CHANNEL_POINT_REWARDS;

                hasPointsEnabled ||= defined(balance);

                amount = (context.STREAMER.coin = balance?.innerText ?? (hasPointsEnabled? amount: '&#128683;'));
                fiat = (context.STREAMER.fiat ??= fiat ?? 0);
                face = (context.STREAMER.face ??= face ?? `${ context.STREAMER.sole }`);
                notEarned = (
                    (allRewards?.length)?
                        allRewards.filter(amount => parseCoin(amount?.innerText) > context.STREAMER.coin).length:
                    (notEarned > -Infinity)?
                        notEarned:
                    -1
                );
                pointsToEarnNext = (
                    (allRewards?.length)?
                        allRewards
                            .map(amount => (parseCoin(amount?.innerText) > context.STREAMER.coin? parseCoin(amount?.innerText) - context.STREAMER.coin: 0))
                            .sort((x, y) => (x > y? -1: +1))
                            .filter(x => x > 0)
                            .pop():
                    (notEarned > -Infinity)?
                        pointsToEarnNext:
                    0
                );

                face = face?.replace(/^(?:https?:.*?)?([\d]+\/[\w\-\.\/]+)$/i, '$1');

                ChannelPoints[context.STREAMER.name] = [amount, fiat, face, notEarned, pointsToEarnNext].join('|');

                Cache.save({ ChannelPoints });
            });
        };
        Timers.point_watcher_helper = 15_000;

        Unhandlers.point_watcher_helper = () => {
            $.all('.tt-point-amount')
                .forEach(span => span?.remove());
        };

        __PointWatcherHelper__:
        if(parseBool(Settings.point_watcher_placement)) {
            when.defined(() => $.last('[data-test-selector*="balance-string"i]')?.closest('button')).then(async balanceButton => {
                RegisterJob('point_watcher_helper');

                let jump = (context.STREAMER.jump?.[context.STREAMER.name?.toLowerCase?.()]?.stream?.points);

                // $notice('[secondary] How many channel points does the user have?', jump?.balance | 0);
                if(defined(jump?.balance))
                    return;

                balanceButton.click();

                ALL_CHANNEL_POINT_REWARDS = $.all('[data-test-selector="cost"i]').map(e => ({ innerText: e.innerText, innerHTML: e.innerHTML, outerHTML: e.outerHTML }));

                wait(30).then(() => balanceButton.click());
            });
        }
    },
});
