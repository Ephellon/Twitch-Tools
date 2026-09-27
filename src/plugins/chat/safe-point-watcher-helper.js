/*** /plugins/chat/safe-point-watcher-helper.js
 * Point Watcher (Helper).
 * Moved from chat.js (Chat__Initialize_Safe_Mode) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let pointWatcherCounter, hasPointsEnabled, ALL_CHANNEL_POINT_REWARDS;

plugin({
    id: 'chat-safe.point_watcher_helper',
    job: 'point_watcher_helper',
    timer: 15_000,
    register: false,          // setup() starts the job itself, when it should

    init() {
        pointWatcherCounter = 0;
        hasPointsEnabled = false;
        ALL_CHANNEL_POINT_REWARDS = undefined;
    },

    handler: async(context) => {
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
    },

    unhandler: () => {
        $.all('.tt-point-amount')
            .forEach(span => span?.remove());
    },

    enabled() {
        return parseBool(Settings.point_watcher_placement);
    },

    setup(context) {
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
    },
});
