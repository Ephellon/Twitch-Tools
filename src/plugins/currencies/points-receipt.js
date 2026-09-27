/*** /plugins/currencies/points-receipt.js
 * Points Receipt & Ranking.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'points_receipt_placement',

    async install({ StopWatch }) {
        let RECEIPT_TOOLTIP;
        let COUNTING_POINTS;
        EXACT_POINTS_SPENT = 0;
        let EXACT_POINTS_DEBTED = 0;
        let EXACT_POINTS_EARNED = 0;
        const COUNTING_HREF = NORMALIZED_PATHNAME;
        const OBSERVED_COLLECTION_ANIMATIONS = new Map;
        let DISPLAYING_RANK;
        let RANK_TOOLTIP;
        const TALLY = new Map;
        let CHANNEL_POINTS_MULTIPLIER;

        function UpdateReceiptDisplay() {
            let receipt = EXACT_POINTS_EARNED - (EXACT_POINTS_SPENT + EXACT_POINTS_DEBTED)
                , glyph = Glyphs.modify('channelpoints', { height: '20px', width: '20px', style: 'vertical-align:bottom' })
                , { abs } = Math;

            receipt = receipt.floorToNearest(parseInt(String(Settings.channelpoints_receipt_display ?? '').replace('round', '')) || 1);

            const TIME_LEFT = ((STREAMER.data?.dailyBroadcastTime ?? 16_200_000) - STREAMER.time);
            let AVAILABLE_POINTS = TIME_LEFT < 1 ? -1 : ((120 + 200 * +!top.TWITCH_INTEGRITY_FAIL) * CHANNEL_POINTS_MULTIPLIER * (TIME_LEFT / 3_600_000)) | 0;

            if(AVAILABLE_POINTS < 1)
                AVAILABLE_POINTS = Infinity;

            RECEIPT_TOOLTIP.innerHTML = [
                // Earned
                abs(EXACT_POINTS_EARNED).suffix(' &uarr;', 1, 'natural'),
                // Spent
                abs(EXACT_POINTS_SPENT + EXACT_POINTS_DEBTED).suffix(' &darr;', 1, 'natural'),
                // Available (according to stremer's average stream time)
                parseBool(Settings.show_stats)
                    ? [furnish(`marquee[direction=left][scrollamount=1]`, { style: 'width:fit-content;vertical-align:top' }).html(`&larr;`), Glyphs.modify('channelpoints', { height: '12px', width: '12px', style: 'vertical-align:-1px;position:relative' }).asNode, furnish(`span#tt-points-left-this-stream`).html(AVAILABLE_POINTS.prefix('', 1, 'natural'))].map(e => e.outerHTML).join('')
                : null
            ].filter(defined).join(' | ');
            $('#tt-points-receipt').innerHTML = `${ glyph } ${ abs(receipt).suffix(`&${ 'du'[+(receipt >= 0)] }arr;`, 1, 'natural') }`;
        }

        setInterval(() => {
            const container = $('#tt-points-left-this-stream');

            if(nullish(container))
                return;

            const TIME_LEFT = ((STREAMER.data?.dailyBroadcastTime ?? 16_200_000) - STREAMER.time);
            let AVAILABLE_POINTS = TIME_LEFT < 1 ? -1 : ((120 + 200 * +!top.TWITCH_INTEGRITY_FAIL) * CHANNEL_POINTS_MULTIPLIER * (TIME_LEFT / 3_600_000)) | 0;

            if(AVAILABLE_POINTS < 1)
                AVAILABLE_POINTS = Infinity;

            container.innerHTML = AVAILABLE_POINTS.prefix('', 1, 'natural');
        }, 250);

        __GetMultiplierAmount__:
        if(nullish(CHANNEL_POINTS_MULTIPLIER)) {
            const button = $('[data-test-selector*="points"i][data-test-selector*="summary"i] button');

            if(defined(button)) {
                button.click();

                $('.reward-center-body [href*="//help.twitch.tv/"i]')
                    ?.closest('.reward-center-body')
                    ?.querySelector('button')
                    ?.click();

                CHANNEL_POINTS_MULTIPLIER = parseFloat($('#channel-points-reward-center-header h6')?.innerText) || 1;

                button.click();
            } else {
                CHANNEL_POINTS_MULTIPLIER = 1
            }
        }

        Handlers.points_receipt_placement = () => {
            // Display the ranking
            new StopWatch('points_receipt_placement__ranking');

            DisplayRanking: {
                let placement;

                if((placement = Settings.points_receipt_placement ??= 'null').equals('null')) {
                    StopWatch.stop('points_receipt_placement__ranking');

                    break DisplayRanking;
                }

                DISPLAYING_RANK = setInterval(async() => {
                    let container = $('[data-test-selector="chat-input-buttons-container"i]')
                        , ranking = $('#tt-channel-point-ranking');

                    if(nullish(container))
                        return StopWatch.stop('points_receipt_placement__ranking');

                    // Field tests show that generally (for established streams): ≤1% of followers are actively watching at any given time during a stream
                    const scale = n => n ** 9;
                    let { cult, poll, rank } = STREAMER
                        , place = (100 * scale(rank / cult)).clamp(1, 100) | 0
                        , string = nth((rank * scale(rank / cult)).clamp(1, cult).round().toLocaleString(LANGUAGE))
                        , color = (null
                            ?? ['#FFD700', '#C0C0C0', '#CD7F32'][((place / 10).ceil() || 1) - 1]
                            ?? '#91FF47'
                        );

                    rank = (
                        rank < 1 || isNaN(rank)
                            ? '&infin;'
                        : place <= 30
                            ? `<span style="text-decoration:${ 4 - ((place / 10).ceil() || 1) }px underline ${ color }">${ string }</span>`
                        : string
                    );

                    if(nullish(ranking))
                        container.insertBefore(ranking = (
                            furnish('div', { style: 'animation:1s fade-in 1;' },
                                furnish('#tt-channel-point-ranking', { style: 'display:flex; position:relative; align-items:center; vertical-align:middle; height:100%;' })
                            )
                        ), container.lastElementChild);
                    else
                        ranking.innerHTML = Glyphs.modify('trophy', { height: '16px', width: '16px', fill: color }) + rank;

                    RANK_TOOLTIP ??= new Tooltip(ranking, rank, { from: 'top' });

                    let placementString;

                    if(rank.equals('&infin;'))
                        placementString = `Unable to get your rank for this channel`;
                    else
                        placementString = `You are in the top ${ place }% of ${ (STREAMER.ping ? 'follow' : 'view') }ers`;

                    if(RANK_TOOLTIP.innerHTML.unlike(placementString))
                        RANK_TOOLTIP.innerHTML = placementString;
                }, 5000);
            }

            StopWatch.stop('points_receipt_placement__ranking');

            // Display the receipt
            new StopWatch('points_receipt_placement');

            DisplayReceipt: {
                let placement;

                if((placement = Settings.points_receipt_placement ??= 'null').equals('null'))
                    return StopWatch.stop('points_receipt_placement');

                const live_time = $('.live-time');

                if(nullish(live_time))
                    return RestartJob('points_receipt_placement', 'missing:live_time');

                const classes = element => [...element.classList].map(label => '.' + label).join('');

                const container = live_time.closest(`*:not(${ classes(live_time) })`)
                    , parent = container.closest(`*:not(${ classes(container) })`);

                const f = furnish;
                const points_receipt =
                    f(`${ container.tagName }${ classes(container) }`, { style: 'min-width:7rem; text-align:center' },
                        f(`${ live_time.tagName }#tt-points-receipt${ classes(live_time).replace(/\blive-time\b/gi, 'points-receipt') }`, { receipt: 0, innerHTML: `${ Glyphs.modify('channelpoints', { height: '20px', width: '20px', style: 'vertical-align:bottom' }) } 0 &uarr;` })
                    );

                parent.append(points_receipt);

                RECEIPT_TOOLTIP = new Tooltip(points_receipt);

                COUNTING_POINTS = setInterval(async() => {
                    let points_receipt = $('#tt-points-receipt')
                        , balance = $.last('[data-test-selector*="balance-string"i]')
                        , exact_debt = $('[data-test-selector^="prediction-checkout"i], [data-test-selector*="user-prediction"i][data-test-selector*="points"i], [data-test-selector*="user-prediction"i] p, [class*="points-icon"i] ~ p *:not(:empty)')
                        , exact_change = $('[class*="points"i][class*="summary"i][class*="add-text"i]');

                    if(nullish(points_receipt))
                        return RestartJob('points_receipt_placement', 'missing:points_receipt');

                    const [chat] = $.all('[role] ~ *:is([role="log"i], [class~="chat-room"i], [data-a-target*="chat"i], [data-test-selector*="chat"i]), [data-test-selector*="banned"i][data-test-selector*="message"i], [data-test-selector^="video-chat"i]');

                    if(nullish(chat)) {
                        const framedData = PostOffice.get('points_receipt_placement');

                        window.PostOffice = PostOffice;

                        if(nullish(framedData))
                            return;

                        balance ??= { textContent: framedData.balance };
                        exact_debt ??= { textContent: framedData.exact_debt };
                        exact_change ??= { textContent: framedData.exact_change };
                    }

                    EXACT_POINTS_DEBTED = parseCoin(exact_debt?.textContent ?? EXACT_POINTS_DEBTED) | 0;

                    const animationID = ((exact_change?.textContent ?? exact_debt?.textContent ?? -EXACT_POINTS_SPENT) | 0).toString()
                        , animationTimeStamp = +new Date;

                    if(!/^([\+\-, \d]+)$/.test(animationID))
                        return;

                    // Don't keep adding the exact change while the animation is playing
                    if(OBSERVED_COLLECTION_ANIMATIONS.has(animationID)) {
                        const time = OBSERVED_COLLECTION_ANIMATIONS.get(animationID);

                        // It's been less than 5 minutes
                        if(nullish(animationID) || !parseBool(animationID) || Math.abs(animationTimeStamp - time) < 300_000)
                            return;

                        // Continue executing...
                    }
                    OBSERVED_COLLECTION_ANIMATIONS.set(animationID, animationTimeStamp);

                    $log(`Observing "${ animationID }" @ ${ new Date }`, OBSERVED_COLLECTION_ANIMATIONS);

                    if(!~[points_receipt, exact_change, balance].findIndex(defined)) {
                        points_receipt?.parentElement?.remove();

                        RestartJob('points_receipt_placement', 'missing:points_receipt,exact_change,balance');

                        return clearInterval(COUNTING_POINTS);
                    }

                    EXACT_POINTS_EARNED += parseCoin(exact_change?.textContent);

                    UpdateReceiptDisplay();
                }, 2_5_0);
            } // :DisplayReceipt

            StopWatch.stop('points_receipt_placement');
        };
        Timers.points_receipt_placement = -2_500;

        Unhandlers.points_receipt_placement = () => {
            [COUNTING_POINTS, DISPLAYING_RANK].map(clearInterval);

            $.all('#tt-points-receipt, #tt-channel-point-ranking')
                .forEach(span => span?.parentElement?.remove());
        };

        const REDEMPTION_LISTENERS = {};

        __PointsReceiptPlacement__:
        if(parseBool(Settings.points_receipt_placement)) {
            RegisterJob('points_receipt_placement');

            Chat.onbullet = async({ element, message, subject, mentions }) => {
                element = await element;

                if(!(true
                    // The subject matches
                    && subject.equals('coin')

                    // And...
                    && (false
                        // The message is from the user
                        || message.contains(USERNAME)

                        // The message is from the user (for embedded messages)
                        || $('[class*="message"i] [class*="username"i] [data-a-user]', element)?.dataset?.aUser?.equals(USERNAME)
                    )
                ))
                    return;

                const [item] = (await STREAMER.shop).filter(reward => reward.title.length && message.mutilate().contains(reward.title.mutilate()));

                if(nullish(item))
                    return;

                EXACT_POINTS_SPENT += parseCoin(item.cost) | 0;

                UpdateReceiptDisplay();
            };

            AddRedemptionListener: {
                function addListener(address = 0b1111) {
                    // Points spent on unlocked rewards
                    if(address & 1) {
                        when.defined(() => $('[data-test-selector*="required"i]:empty'))
                            .then(element => {
                                if(defined(REDEMPTION_LISTENERS.UNLOCKED_REWARDS))
                                    return;
                                REDEMPTION_LISTENERS.UNLOCKED_REWARDS = true;

                                element.closest('button').addEventListener('mouseup', ({ currentTarget }) => {
                                    const title = $('[id*="reward"i][id*="header"i]').textContent.trim()
                                        , amount = parseCoin(currentTarget?.previousSibling?.nodeValue) | 0;

                                    EXACT_POINTS_SPENT += amount;
                                    TALLY.set(`Reward: "${ title }" @ ${ (new Date).toJSON() }`, amount);

                                    delete REDEMPTION_LISTENERS.UNLOCKED_REWARDS;
                                    addListener(1);

                                    $log(`Spent ${ amount } on "${ title }"`, new Date);
                                });
                            });

                        when.nullish(() => $('[data-test-selector*="required"i]:empty'))
                            .then(() => delete REDEMPTION_LISTENERS.UNLOCKED_REWARDS);
                    }

                    // Points spent on votes
                    if(address & 2) {
                        when.defined(() => $('[class*="community"i][class*="stack"i] [data-test-selector^="expanded"i] button'))
                            .then(button => {
                                if(defined(REDEMPTION_LISTENERS.BRIBABLE_VOTES))
                                    return;
                                REDEMPTION_LISTENERS.BRIBABLE_VOTES = true;

                                button.addEventListener('mouseup', ({ currentTarget }) => {
                                    let title = $('[class*="community"i][class*="stack"i] [data-test-selector="header"i] ~ *')?.textContent ?? 'Something? No real title given'
                                        , [amount] = /\p{N}+/u.exec(currentTarget?.textContent) || '';

                                    EXACT_POINTS_SPENT += (amount |= 0);
                                    TALLY.set(`Poll: "${ title }" @ ${ (new Date).toJSON() }`, amount | 0);

                                    delete REDEMPTION_LISTENERS.BRIBABLE_VOTES;
                                    addListener(2);

                                    $log(`Spent ${ amount } on "${ title }"`, new Date);
                                });
                            });

                        when.nullish(() => $('[class*="community"i][class*="stack"i] [data-test-selector^="expanded"i] button'))
                            .then(() => delete REDEMPTION_LISTENERS.BRIBABLE_VOTES);
                    }
                }

                addListener();
            }
        } // :__PointsReceiptPlacement__
    },
});
