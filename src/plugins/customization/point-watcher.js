/*** /plugins/customization/point-watcher.js
 * Point Watcher.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'point_watcher_placement',

    async install({ StopWatch }) {
        let POINT_WATCHER_COUNTER = 0,
            HAS_POINTS_BALANCE = false;

        Handlers.point_watcher_placement = async() => {
            // Display the points
            new StopWatch('point_watcher_placement');

            if(top.WINDOW_STATE == "unloading")
                return;

            // Color the balance text
            let balance = $.last('[data-test-selector*="balance-string"i]');

            balance?.setAttribute('rainbow-border', await STREAMER.done);
            balance?.setAttribute('bottom-only', '');

            let richTooltip = $('[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i])');
            let { name, game } = STREAMER;
            let target = null;

            contextualizer: if(defined(richTooltip)) {
                let [title, subtitle, ...footers] = richTooltip.children,
                    [gTarget] = footers.map(footer => $('[class*="tooltip"i][class*="text"i]', footer)).filter(defined);

                if(nullish(subtitle)) {
                    let [rTitle, rSubtitle] = $.all('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="metadata"i] > *'),
                        rTarget = $('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="status"i]');

                    title = rTitle;
                    subtitle = rSubtitle;
                    gTarget = rTarget;
                }

                if(nullish(title) || nullish(gTarget))
                    break contextualizer;

                [name, game] = title.textContent.split(/[^\w\s]/);

                name = name?.trim();
                game = game?.trim();
                target = gTarget;
            }

            // Remove the old face and values...
            $.all(`:is(.tt-point-amount, .tt-point-face):not([name="${ name }"i])`).map(element => element?.remove());

            // Update the rich tooltip display
            Cache.load(['ChannelPoints'], async({ ChannelPoints }) => {
                ChannelPoints ??= {};

                let [amount, fiat, face, notEarned, pointsToEarnNext] = (ChannelPoints[name] ?? 0).toString().split('|'),
                    style = new CSSObject({ verticalAlign: 'bottom', height: '20px', width: '20px' }),
                    upNext = !!~(ALL_FIRST_IN_LINE_JOBS ?? []).findIndex(href => RegExp(`/${ name }\\b`, 'i').test(href));

                amount = (amount ?? '')?.replace('.0', '');
                notEarned = parseInt(notEarned);
                pointsToEarnNext = parseInt(
                    (notEarned >= -Infinity)?
                        pointsToEarnNext:
                    0
                );

                let amounter = $(`.tt-point-amount[name="${ name }"i]`, target);
                if(defined(amounter)) {
                    amounter.setAttribute('rainbow-border', notEarned == 0);

                    if(amounter.innerHTML.unlike(amount))
                        amounter.innerHTML = amount;
                } else if(defined(target)) {
                    let pointAmount = `span.tt-point-amount[bottom-only][name="${ name }"]`,
                        pointFace = `span.tt-point-face[name="${ name }"]`;

                    let text = furnish(pointAmount, {
                            'rainbow-border': notEarned == 0,
                            innerHTML: amount,
                        }),
                        icon = face?.contains('/')?
                            furnish(pointFace, {
                                innerHTML: ` | ${ furnish('img', { src: `https://static-cdn.jtvnw.net/channel-points-icons/${ face }`, style: style.toString() }).outerHTML } `,
                            }):
                        furnish(pointFace, {
                            innerHTML: ` | ${ Glyphs.modify('channelpoints', { style, ...style.toObject() }) } `,
                        });

                    target.append(icon);
                    target.append(text);

                    target.closest('[role="dialog"i]')?.setAttribute('tt-in-up-next', upNext);
                }

                // Update the points (every 15s | 60 × 1/4)
                if(!(POINT_WATCHER_COUNTER++ % 60)) {
                    let allRewards = (await STREAMER.shop).filter(reward => reward.enabled),
                        balance = STREAMER.coin || 0;

                    HAS_POINTS_BALANCE ||= defined(balance);

                    amount = ((balance? balance.suffix('', 1).replace('.0','').toUpperCase(): 0) || (HAS_POINTS_BALANCE? amount: '&#128683;'));
                    fiat = (STREAMER?.fiat ?? fiat ?? 0);
                    face = (STREAMER?.face ?? face ?? `${ STREAMER.sole }`);
                    notEarned = (
                        (allRewards?.length)?
                            allRewards.filter(({ cost = 0 }) => cost > STREAMER.coin).length:
                        (notEarned >= -Infinity)?
                            notEarned:
                        -1
                    );
                    pointsToEarnNext = (
                        (allRewards?.length)?
                            allRewards
                                .map(reward => (reward.cost > STREAMER.coin? reward.cost - STREAMER.coin: 0))
                                .sort((x, y) => (x > y? -1: +1))
                                .filter(x => x > 0)
                                .pop():
                        (notEarned >= -Infinity)?
                            pointsToEarnNext:
                        0
                    );

                    face = face?.replace(/^(?:https?:.*?)?([\d]+\/[\w\-\.\/]+)$/i, '$1');

                    ChannelPoints[STREAMER.name] = [amount, fiat, face, notEarned, pointsToEarnNext].join('|');

                    Cache.save({ ChannelPoints });
                }

                // @performance
                PrepareForGarbageCollection(ChannelPoints);
            });

            StopWatch.stop('point_watcher_placement', 2_700);
        };
        Timers.point_watcher_placement = 250;

        Unhandlers.point_watcher_placement = () => {
            $.all('.tt-point-amount')
                .forEach(span => span.remove());
        };

        __PointWatcherPlacement__:
        if(parseBool(Settings.point_watcher_placement)) {
            when.defined(() => $.last('[data-test-selector*="balance-string"i]')?.closest('button'))
                .then(async balanceButton => {
                    RegisterJob('point_watcher_placement');

                    let jump = (STREAMER.jump?.[STREAMER.name?.toLowerCase?.()]?.stream?.points);

                    // $notice('[primary] How many channel points does the user have?', jump?.balance | 0);
                    if(defined(jump?.balance))
                        return;

                    balanceButton.click();

                    for(let reward of $.all('[class*="reward"i][class*="item"i]')) {
                        let [image, cost, title] = $.all('[class*="reward"i][class*="image"i] img[alt], [data-test-selector="cost"i], p[title]', reward),
                            backgroundColor = (false
                                || $('button [style]')
                                    ?.getComputedStyle?.($(`main a[href$="${ NORMALIZED_PATHNAME }"i]`) ?? $(':root'))
                                    ?.getPropertyValue?.('background-color')
                                || '#9147FF'
                            ).toUpperCase();

                        image = image?.src ?? 'https://static-cdn.jtvnw.net/custom-reward-images/default-1.png';
                        cost = parseCoin(cost?.textContent) | 0;
                        title = (title?.textContent ?? "").trim();

                        if(!title.length && !cost)
                            continue;

                        let imgURL = parseURL(image),
                            imgPath = imgURL.pathname.slice(1),
                            [imgType, imgName, imgSub = ''] = imgPath.split('/'),
                            realId = (
                                imgType.contains('auto') && imgType.contains('reward')?
                                    ({
                                        'SUBSONLY': 'SINGLE_MESSAGE_BYPASS_SUB_MODE',
                                        SINGLE_MESSAGE_BYPASS_SUB_MODE: 'SINGLE_MESSAGE_BYPASS_SUB_MODE',

                                        'HIGHLIGHT': 'SEND_HIGHLIGHTED_MESSAGE',
                                        SEND_HIGHLIGHTED_MESSAGE: 'SEND_HIGHLIGHTED_MESSAGE',

                                        'MODIFY-EMOTE': 'CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK',
                                        CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK: 'CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK',

                                        'RANDOM-EMOTE': 'RANDOM_SUB_EMOTE_UNLOCK',
                                        RANDOM_SUB_EMOTE_UNLOCK: 'RANDOM_SUB_EMOTE_UNLOCK',

                                        'CHOOSE-EMOTE': 'CHOSEN_SUB_EMOTE_UNLOCK',
                                        CHOSEN_SUB_EMOTE_UNLOCK: 'CHOSEN_SUB_EMOTE_UNLOCK',
                                    }[imgName.replace(/(\W?\d+)?\.(gif|jpe?g|png)$/i, '').replace(/^(\d+)$/, imgSub).toUpperCase()]):
                                null
                            );

                        let item = {
                            title, cost,
                            image: { url: image },

                            backgroundColor: Color.destruct(backgroundColor).HEX,
                            id: (realId ?? UUID.from([image, title.mutilate(), cost].join('|$|'), true).value),
                            type: (realId ?? "UNKNOWN"),

                            enabled: true,
                            available: true,
                            count: 0,
                            hidden: false,
                            maximum: {
                                global: 0,
                                user: 0,
                            },
                            needsInput: false,
                            paused: false,
                            premium: false,
                            prompt: "",
                            skips: false,
                            updated: (new Date).toJSON(),
                        };

                        if(!~STREAMER.__shop__.findIndex(i => i.id == item.id))
                            STREAMER.__shop__.push(item);
                    }

                    wait(30).then(() => balanceButton.click());
                });
        }
    },
});
