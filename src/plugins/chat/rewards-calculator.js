/*** /plugins/chat/rewards-calculator.js
 * Rewards Calculator.
 * Moved verbatim from chat.js (Chat__Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.rewards_calculator',

    async install(context) {
        context.CHANNEL_POINTS_MULTIPLIER = undefined;
        let REWARDS_CALCULATOR_TEXT;

        Handlers.rewards_calculator = () => {
            new context.StopWatch('rewards_calculator');

            __GetMultiplierAmount__:
            if(nullish(context.CHANNEL_POINTS_MULTIPLIER)) {
                let button = $('[data-test-selector*="points"i][data-test-selector*="summary"i] button');

                if(defined(button)) {
                    button.click();

                    $('.reward-center-body [href*="//help.twitch.tv/"i]')
                        ?.closest('.reward-center-body')
                        ?.querySelector('button')
                        ?.click();

                    let pop = $('[class*="rewards"i][class*="popover"i]');
                    let btn = $('img[class*="channel"i][class*="points"i], svg', pop)?.closest('button');

                    if(nullish(btn)) {
                        context.CHANNEL_POINTS_MULTIPLIER = 1;
                        break __GetMultiplierAmount__;
                    }

                    let mux = btn.textContent.replace(/.*\((.+)\).*/, ($0, $1, $$, $_) => parseFloat($1));
                    let bal = btn.ariaLabel?.replace(/.*([\d\.,]).*/, '$1') ?? 0;

                    context.CHANNEL_POINTS_MULTIPLIER = (mux | 0? mux: 1);

                    button.click();
                } else {
                    context.CHANNEL_POINTS_MULTIPLIER = 1;
                }
            }

            let container = $('[data-test-selector*="required"i][data-test-selector*="points"i]:not(:empty)')?.closest?.('button');

            if(nullish(container)) {
                context.StopWatch.stop('rewards_calculator');

                RemoveCustomCSSBlock('tt-rewards-calc');
            }

            // https://theemergence.co.uk/when-is-the-best-time-to-stream-on-twitch/#faq-question-1565821275069
                // Average broadcast time is 4.5h
                // Average number of streamed days is 5 (Mon - Fri)
            let averageBroadcastTime = ((context.STREAMER.data?.dailyBroadcastTime ?? 16_200_000) / 3_600_000).clamp(0, 24),
                activeDaysPerWeek = (context.STREAMER.data?.activeDaysPerWeek ?? 5).clamp(1, 7),
                pointsEarnedPerHour = 120 + (200 * +Settings.auto_claim_bonuses); // https://help.twitch.tv/s/article/channel-points-guide
            let timeLeftInBroadcast = averageBroadcastTime - (context.STREAMER.time / 3_600_000);

            // Set the progress bar of the button
            let have = parseFloat(parseCoin($.last('[data-test-selector*="balance-string"i]')?.innerText) | 0),
                este = parseFloat(timeLeftInBroadcast * pointsEarnedPerHour * context.CHANNEL_POINTS_MULTIPLIER),
                goal = parseFloat($('[data-test-selector*="required"i][data-test-selector*="points"i]')?.previousSibling?.textContent?.replace(/\D+/g, '') | 0),
                need = goal - have;

            container?.modStyle(`background:linear-gradient(to right,var(--color-background-button-primary-default) 0 ${ (100 * (have / goal)).toFixed(3) }%,var(--color-opac-p-8) 0 ${ (100 * ((have + este) / goal)).toFixed(3) }%,var(--color-background-button-disabled) 0 0); color:var(--color-text-base)!important; text-shadow:0 0 1px var(--color-background-alt);`);

            let { ceil, floor, round } = Math;

            let hours = (need / (pointsEarnedPerHour * context.CHANNEL_POINTS_MULTIPLIER)),
                days = (hours / 24) * (24 / averageBroadcastTime),
                weeks = (days / 7) * (7 / (activeDaysPerWeek || (averageBroadcastTime / 24))),
                    // ... OR fraction of active day
                months = weeks / 4,
                years = months / 12;

            let streams = ceil(hours / averageBroadcastTime),
                estimated = 'minute',
                timeEstimated = 60 * (ceil(hours * 4) / 4);

            if(hours < 0) {
                return;
            } if(hours > 1) {
                estimated = 'hour';
                timeEstimated = hours;
            } if(hours > averageBroadcastTime) {
                estimated = 'day';
                timeEstimated = days;
            } if(days > activeDaysPerWeek) {
                estimated = 'week';
                timeEstimated = weeks;
            } if(days > 30) {
                estimated = 'month';
                timeEstimated = months;
            } if(months > 12) {
                estimated = 'year';
                timeEstimated = years;
            } if(years > 100) {
                estimated = 'century';
                timeEstimated = years / 100;
            }

            timeEstimated = ceil(timeEstimated);

            function estimates(language) {
                return fetchURL(`get:ext/times.json`)
                    .then(response => response.json())
                    .then(json => json[language]);
            }

            function correct(string, number) {
                number ??= parseInt(string.replace(/[^]*?(\d+)[^]*/, '$1'));

                return string
                    .replace(/%d\b/g, comify(number))
                    .replace(/%([^>]*)>([^\s]*)/g, (number > 1? '$2': '$1'));
            }

            let T_L = top.LANGUAGE;
            switch(T_L) {
                case 'bg': {
                    // Adopted from /ext/times.json/#bg
                    // Достъпно по време на този поток (33 минути)
                    // Предлага се в още 33 потока (3 седмици)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `${ (streams < 1 || hours < timeLeftInBroadcast)? 'Достъпно по време на този': `Предлага се в още ${ comify(streams) }` } ${ "поток" + ["и","а"][+(streams > 1)] } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'cs': {
                    // Adopted from /ext/times.json/#cs
                    // Dostupné během tohoto streamu (33 minut)
                    // K dispozici v dalších 33 streamech (3 týdny)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `${ (streams < 1 || hours < timeLeftInBroadcast)? 'Dostupné během tohoto': `K dispozici v dalších ${ comify(streams) }` } ${ "stream" + ["u","ech"][+(streams > 1)] } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'da': {
                    // Adopted from /ext/times.json/#da
                    // Tilgængelig under denne stream (33 minutter)
                    // Tilgængelig i 33 flere streams (3 uger)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `Tilgængelig ${ (streams < 1 || hours < timeLeftInBroadcast)? 'under denne': `i ${ comify(streams) } flere` } ${ "stream".pluralSuffix(streams, "s") } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'de': {
                    // Adopted from /ext/times.json/#de
                    // In diesem Strom verfügbar (30 Minuten)
                    // Erhältlich in 33 mehr Streams (3 Wochen)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `${ (streams < 1 || hours < timeLeftInBroadcast)? 'In diesem Strom': `Erhältlich in ${ comify(streams) } mehr` } ${ "Stream".pluralSuffix(streams, "s") } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'fi': {
                    // Adopted from /ext/times.json/#fi
                    // Saatavilla tämän streamin aikana (33 minuuttia)
                    // Saatavilla vielä 33 suorana (3 viikkoa)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `Saatavilla ${ (streams < 1 || hours < timeLeftInBroadcast)? 'tämän streamin aikana': `vielä ${ comify(streams) } suorana` } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'hu': {
                    // Adopted from /ext/times.json/#hu
                    // Elérhető a stream alatt (33 perc)
                    // 33 további adatfolyamban elérhető (3 hét)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `${ (streams < 1 || hours < timeLeftInBroadcast)? 'Elérhető a stream alatt': `${ comify(streams) } további adatfolyamban elérhető` } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'no': {
                    // Adopted from /ext/times.json/#no
                    // Tilgjengelig under denne strømmen (33 minutter)
                    // Tilgjengelig i 33 strømmer til (3 uker)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `Tilgjengelig ${ (streams < 1 || hours < timeLeftInBroadcast)? 'under denne strømmen': `i ${ comify(streams) } strømmer til` } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'pl': {
                    // Adopted from /ext/times.json/#pl
                    // Dostępne podczas tej transmisji (33 minuty)
                    // Dostępne w 33 kolejnych strumieniach (3 tygodnie)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `Dostępne ${ (streams < 1 || hours < timeLeftInBroadcast)? 'podczas tej transmisji': `w ${ comify(streams) } kolejnych strumieniach` } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'sk': {
                    // Adopted from /ext/times.json/#sk
                    // Dostupné počas tohto streamu (33 minút)
                    // Dostupné v 33 ďalších streamoch (3 týždne)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `Dostupné ${ (streams < 1 || hours < timeLeftInBroadcast)? 'počas tohto': `v ${ comify(streams) }` } ${ "stream" + ["u","och"][+(streams > 1)] } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'tr': {
                    // Adopted from /ext/times.json/#tr
                    // Bu yayın sırasında kullanılabilir (33 dakika)
                    // 33 akışta daha mevcuttur (3 hafta)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `${ (streams < 1 || hours < timeLeftInBroadcast)? 'Bu yayın sırasında kullanılabilir': `${ comify(streams) } akışta daha mevcuttur` } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'el': {
                    // Adopted from /ext/times.json/#el
                    // Διαθέσιμο κατά τη διάρκεια αυτής της ροής (33 λεπτά)
                    // Διαθέσιμο σε 33 ακόμη ροές (3 εβδομάδες)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `Διαθέσιμο ${ (streams < 1 || hours < timeLeftInBroadcast)? 'κατά τη διάρκεια αυτής της': `σε ${ comify(streams) } ακόμη` } ${ "ρο" + ["ής","ές"][+(streams > 1)] } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'fr': {
                    // Adopted from /ext/times.json/#fr
                    // Disponible pendant ce stream (33 minutes)
                    // Disponible dans 33 flux supplémentaires (3 semaines)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `Disponible ${ (streams < 1 || hours < timeLeftInBroadcast)? 'pendant ce stream': `dans ${ comify(streams) } flux supplémentaires` } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'nl': {
                    // Adopted from /ext/times.json/#nl
                    // Beschikbaar tijdens deze stream (33 minuten)
                    // Beschikbaar in nog 33 streams (3 weken)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `Beschikbaar ${ (streams < 1 || hours < timeLeftInBroadcast)? 'tijdens deze': `in nog ${ comify(streams) }` } ${ "stream".pluralSuffix(streams, "s") } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'it': {
                    // Adopted from /ext/times.json/#it
                    // Disponibile durante questo streaming (33 minuti)
                    // Disponibile in altri 33 stream (3 settimane)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `Disponibile ${ (streams < 1 || hours < timeLeftInBroadcast)? 'durante questo': `in altri ${ comify(streams) }` } ${ "stream" + ["ing",""][+(streams > 1)] } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'ro': {
                    // Adopted from /ext/times.json/#ro
                    // Disponibil în timpul acestui flux (33 de minute)
                    // Disponibil în încă 33 de fluxuri (3 săptămâni)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `Disponibil în ${ (streams < 1 || hours < timeLeftInBroadcast)? 'timpul acestui': `încă  ${ comify(streams) } de` } ${ "flux" + ["","uri"][+(streams > 1)] } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'ja': {
                    // Adopted from /ext/times.json/#ja
                    // このストリーム中に利用可能（33分）
                    // さらに33のストリームで利用可能（3週間）

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `${ (streams < 1 || hours < timeLeftInBroadcast)? 'このストリーム中に': `さらに${ comify(streams) }のストリームで` } ${ "利用可能" + ["_","s"][+(streams > 1)] } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'zh-ch': {
                    // Adopted from /ext/times.json/#zh
                    // 在此直播期间可用（33 分钟）
                    // 在另外 33 个流中可用（3 周）

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `${ (streams < 1 || hours < timeLeftInBroadcast)? '在此直播期间可用': `在另外 ${ comify(streams) } 个流中可用` } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'zh-tw': {
                    // Adopted from /ext/times.json/#zh
                    // 在此直播期間可用（33 分鐘）
                    // 在另外 33 個流中可用（3 週）

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `${ (streams < 1 || hours < timeLeftInBroadcast)? '在此直播期間可用': `在另外 ${ comify(streams) } 個流中可用` } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'ko': {
                    // Adopted from /ext/times.json/#ko
                    // 이 스트림 동안 사용 가능(33분)
                    // 33개 이상의 스트림에서 사용 가능(3주)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `${ (streams < 1 || hours < timeLeftInBroadcast)? '이 스트림 동안': `${ comify(streams) }개 이상의 스트림에서` } 사용 가능 (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'sv': {
                    // Adopted from /ext/times.json/#sv
                    // Tillgänglig under denna stream (33 minuter)
                    // Tillgänglig i ytterligare 33 streams (3 veckor)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `Tillgänglig ${ (streams < 1 || hours < timeLeftInBroadcast)? 'under denna': `i ytterligare ${ comify(streams) }` } ${ "stream".pluralSuffix(streams, "s") } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'th': {
                    // Adopted from /ext/times.json/#th
                    // ได้ในสตรีมนี้ (33 นาที)
                    // พร้อมให้บริการในอีก 33 สตรีม (3 สัปดาห์)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `${ (streams < 1 || hours < timeLeftInBroadcast)? 'ได้ในสตรีมนี้': `พร้อมให้บริการในอีก ${ comify(streams) } สตรีม` } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'vi': {
                    // Adopted from /ext/times.json/#vi
                    // Có sẵn trong luồng này (33 phút)
                    // Có sẵn trong 33 luồng khác (3 tuần)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `Có sẵn trong ${ (streams < 1 || hours < timeLeftInBroadcast)? '': comify(streams) } ${ "luồng " + ["này","khác"][+(streams > 1)] } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'es': {
                    // Adopted from /ext/times.json/#es
                    // Disponible durante este arroyo (30 minutos)
                    // Disponible en 33 arroyos más (3 semanas)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `Disponible ${ (streams < 1 || hours < timeLeftInBroadcast)? 'durante este arroyo': `en ${ comify(streams) } arroyos más` } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'ru': {
                    // Adopted from /ext/times.json/#ru
                    // Доступно во время этого потока (30 минут)
                    // Доступно в 33 ручьях (3 недели)

                    estimates(T_L)
                        .then(estimates => {
                            estimated = estimates[estimated].pop();

                            REWARDS_CALCULATOR_TEXT =
                                `Доступно ${ (streams < 1 || hours < timeLeftInBroadcast)? 'во время этого потока': `в ${ comify(streams) } ручьях` } (${ correct(estimated, timeEstimated) })`;
                        });
                } break;

                case 'en':
                default: {
                    // Available during this stream (30 minutes)
                    // Available in 33 more streams (3 weeks)

                    REWARDS_CALCULATOR_TEXT =
                        `Available ${ (streams < 1 || hours < timeLeftInBroadcast)? 'during this': `in ${ comify(streams) } more` } ${ "stream".pluralSuffix(streams, "s") } (${ comify(timeEstimated) } ${ estimated.pluralSuffix(timeEstimated) })`;
                } break;
            }

            AddCustomCSSBlock('tt-rewards-calc', `
                [tt-rewards-calc="before"i]::before {
                    content: "${ REWARDS_CALCULATOR_TEXT }";
                }

                [tt-rewards-calc="after"i]::after {
                    content: "${ REWARDS_CALCULATOR_TEXT }";
                }
            `);

            context.StopWatch.stop('rewards_calculator');
        };
        Timers.rewards_calculator = 250;

        __RewardsCalculator__:
        if(parseBool(Settings.rewards_calculator)) {
            $remark("Adding Rewards Calculator...");

            RegisterJob('rewards_calculator');
        }
    },
});
