/*** /plugins/automation/claim-reward.js
 * Claim Reward.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'claim_reward',

    async install() {
        VideoClips = {
            dvr: parseBool(Settings.video_clips__dvr),
            filetype: (Settings.video_clips__file_type ?? 'webm'),
            quality: (Settings.video_clips__quality ?? 'auto'),
            length: parseInt(Settings.video_clips__length ?? 60) * 1000,
        };

        let DISPLAY_WALLET_BUTTONS,
            REWARDS_ON_COOLDOWN = new Map,
            CLAIMING_REWARD = false,
            TEXT_BOX_ALREADY_FOCUSED,
            USER_INVOKED_PAUSE = true;

        async function RECORD_PURCHASE({ updateRecords = true, fromUser = true, override = null, element, message, subject, mentions, AutoClaimRewards }) {
            element = await element;

            if(!(true
                // The subject matches
                && subject.equals('coin')

                // The message must* be from the user
                && fromUser

                == (false
                    // The message is from the user
                    || message.contains(USERNAME)
                    || mentions.contains(USERNAME)

                    // The message is from the user (for embedded messages)
                    || $('[class*="message"i] [class*="username"i] [data-a-user]', element)?.dataset?.aUser?.equals(USERNAME)
                )
            )) return false;

            // Pause Up Next during recording...
            if(UP_NEXT_ALLOW_THIS_TAB) {
                let button = $('#up-next-control'),
                    paused = parseBool(button?.getAttribute('paused'));

                if(!paused) {
                    USER_INVOKED_PAUSE = false;
                    button?.click();
                }
            }

            let rewardID = override?.rewardID ?? element.dataset?.shopItemId ?? element.closest('[data-tt-reward-id]')?.dataset?.ttRewardId ?? element.dataset.uuid;
            let [item] = override?.shop ?? await STREAMER.shop.filter(({ id, title }) => id.equals(rewardID) || (title?.length && message?.mutilate()?.contains(title.mutilate())));

            if(nullish(item))
                return false;

            let { title, cost, id } = item;

            // The user successfully purchased the item...
            if(updateRecords) {
                let { sole } = STREAMER;

                AutoClaimRewards[sole |= 0] = AutoClaimRewards[sole]?.filter(i => i)?.filter(i => i.unlike(id));
                Cache.save({ AutoClaimRewards });
            }

            // Begin recording...
            let video = $.all('video').pop();
            let time = parseInt(Settings.video_clips__trophy_length) * 1000;
            let name = [STREAMER.name, `${ title } (${ (new Date).toLocaleDateString(top.LANGUAGE, { dateStyle: 'short' }).replace(GetFileSystem().allIllegalFilenameCharacters, '-') })`].join(' - ');

            video.dataset.trophyId = title;

            SetQuality(VideoClips.quality, 'auto').then(() => {
                let recording = Recording.proxy(video, { name, as: name, maxTime: time, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats });

                // CANNOT be chained with the above; removes `this` context (can no longer be aborted)
                recording
                    .then(async({ target }) => await target.recording.save())
                    .then(link => alert.silent(`
                        <video controller controls
                            title="Trophy Clip Saved &mdash; ${ link.download }"
                            src="${ link.href }" style="max-width:-webkit-fill-available"
                        ></video>
                        `)
                    );

                confirm.timed(`
                    <input hidden controller
                        icon="\uD83D\uDD34\uFE0F" title='Recording "${ STREAMER.name } - ${ title }"'
                        okay="${ encodeHTML(Glyphs.modify('download', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Save"
                        deny="${ encodeHTML(Glyphs.modify('trash', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Discard"
                    />
                    ${ title } &mdash; ${ Glyphs.modify('channelpoints', { height: '20px', width: '20px', style: 'display:inline-block;vertical-align:bottom;width:fit-content' }) }${ comify(cost) }`
                , time)
                    .then(answer => {
                        if(answer === false)
                            throw `Trophy clip discarded!`;
                        recording.stop();
                    })
                    .catch(error => {
                        alert.silent(error);
                        recording.controller.abort(error);
                    })
                    .finally(() => {
                        // Unpause Up Next (if done automatically)
                        if(USER_INVOKED_PAUSE)
                            return;

                        let button = $('#up-next-control'),
                            paused = parseBool(button?.getAttribute('paused'));

                        if(!paused)
                            return;

                        button?.click();
                    });
            });

            return true;
        };

        // Waits for `condition` to return an element; resolves `null` after `timeout` ms
        let WaitForElement = (condition, timeout = 10_000, ms = 100) => {
            let deadline = +new Date + timeout;

            return when.defined(() => condition() ?? (+new Date > deadline? when.null: null), ms);
        };

        Handlers.claim_reward = () => {
            if(top.TWITCH_INTEGRITY_FAIL)
                return;

            Cache.load(['AutoClaimRewards', 'AutoClaimAnswers'], async({ AutoClaimRewards, AutoClaimAnswers }) => {
                AutoClaimRewards ??= {};
                AutoClaimAnswers ??= {};

                for(let sole in AutoClaimRewards)
                    if(sole == STREAMER.sole)
                        for(let rewardID of AutoClaimRewards[sole])
                            await STREAMER.shop
                                .filter(({ available, enabled, hidden, paused, premium }) => available && enabled && !(hidden || paused || (premium && !STREAMER.paid)))
                                .filter(({ id }) => id.equals(rewardID))
                                .map(async({ id, cost, title, needsInput = false, answer = null }) => {
                                    if(REWARDS_ON_COOLDOWN.has(id)) {
                                        if(REWARDS_ON_COOLDOWN.get(id) < +new Date)
                                            REWARDS_ON_COOLDOWN.delete(id);
                                        else
                                            return;
                                    }

                                    cost = parseInt(cost);
                                    title = title.trim();

                                    await when.defined(() => $('[data-test-selector*="chat"i] [data-test-selector*="points"i][data-test-selector*="summary"i] button'))
                                        .then(async rewardsMenuButton => {
                                            let { coin, fiat } = STREAMER;

                                            $notice(`Can "${ title }" be bought yet? ${ ['No', 'Yes'][+(coin >= cost)] }`);

                                            if(TEXT_BOX_ALREADY_FOCUSED)
                                                return;
                                            if(coin < cost)
                                                return;
                                            if($.defined('#tt_saved_input_for_redemption'))
                                                return;
                                            // A purchase is still in progress; clicking again would close the menu
                                            if(CLAIMING_REWARD)
                                                return;

                                            CLAIMING_REWARD = true;
                                            rewardsMenuButton.click();

                                            $log(`Purchasing "${ title }" for ${ cost } ${ fiat }...`);

                                            if(needsInput) {
                                                prompt
                                                    .silent(`<input id=tt_saved_input_for_redemption hidden controller title="You have saved text for this redemption..." />${ title }<br><br><strong>${ parseBool(Settings.video_clips__trophy)? 'This redemption will be recorded</strong>': '' }`, AutoClaimAnswers[sole]?.[id] ?? '')
                                                    .then(() => {
                                                        $('[data-a-target="chat-input"i]')?.modStyle(`background:!delete`);
                                                    });

                                                when.defined(() => $('[data-a-target="chat-input"i]')).then(inputBox => {
                                                    inputBox.addEventListener('keydown', ({ key = '', altKey, ctrlKey, metaKey, shiftKey, currentTarget }) => {
                                                        if(!(ctrlKey || metaKey || altKey || shiftKey) && key.equals('Enter')) {
                                                            $('[data-a-target="chat-input"i]')?.modStyle(`background:!delete`);
                                                            TEXT_BOX_ALREADY_FOCUSED = false;

                                                            // The user successfully purchased the item...
                                                            if(true
                                                                && parseBool(Settings.video_clips__trophy)
                                                                // && (currentTarget.value || currentTarget.textContent).length > 0
                                                            )
                                                                Chat.consume.onbullet = ({ element, message, subject, mentions }) =>
                                                                    RECORD_PURCHASE({ element, message, subject, mentions, AutoClaimRewards }).then(recording => {
                                                                        if(!recording)
                                                                            alert.silent(`Recording "${ title }" ran into an error! Will try to salvage video.`);
                                                                        return true; // Event OK to consume
                                                                    });
                                                        }
                                                    });
                                                    inputBox.modStyle(`background:#387aff`);
                                                    inputBox.focus();

                                                    TEXT_BOX_ALREADY_FOCUSED = true;
                                                });
                                            }

                                            // Purchase and remove
                                            await WaitForElement(() => $('.rewards-list')?.getElementByText(title, 'i')?.closest('.reward-list-item')?.querySelector('button'))
                                                .then(async rewardButton => {
                                                    let { coin, fiat } = STREAMER;

                                                    $notice(`Can "${ title }" be bought yet? ${ ['No', 'Yes'][+(coin >= cost)] }`);

                                                    // Not listed (or not listed yet): close the menu, then try again later
                                                    if(nullish(rewardButton) || coin < cost || rewardButton.disabled) {
                                                        if(nullish(rewardButton) || rewardButton.disabled)
                                                            REWARDS_ON_COOLDOWN.set(id, +(new Date) + 60_000);

                                                        rewardsMenuButton.click();
                                                        return CLAIMING_REWARD = false;
                                                    }

                                                    rewardButton.click();

                                                    await WaitForElement(() => $('.reward-center-body [data-test-selector*="required"i][data-test-selector*="points"i]')?.closest('button'), 10_000, 500)
                                                        .then(purchaseButton => {
                                                            if(nullish(purchaseButton) || purchaseButton.disabled) {
                                                                $log(`Unable to purchase "${ title }" right now. Waiting ${ toTimeString(60_000) }`);
                                                                return REWARDS_ON_COOLDOWN.set(id, +(new Date) + 60_000);
                                                            }

                                                            let cooldown = parseTime(purchaseButton.previousElementSibling?.getElementByText(parseTime.pattern)?.textContent);

                                                            if(cooldown > 0) {
                                                                $log(`Unable to purchase "${ title }" right now. Waiting ${ toTimeString(cooldown) }`);
                                                                return REWARDS_ON_COOLDOWN.set(id, +(new Date) + cooldown);
                                                            }

                                                            if(true
                                                                && parseBool(Settings.video_clips__trophy)
                                                                && ['SINGLE_MESSAGE_BYPASS_SUB_MODE', 'SEND_HIGHLIGHTED_MESSAGE', 'CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK', 'RANDOM_SUB_EMOTE_UNLOCK', 'CHOSEN_SUB_EMOTE_UNLOCK']
                                                                    .missing(ID => ID.contains(id))
                                                            ) {
                                                                // Add the recording listener, then purchase the item
                                                                Chat.consume.onbullet = ({ element, message, subject, mentions }) =>
                                                                    RECORD_PURCHASE({ element, message, subject, mentions, AutoClaimRewards }).then(recording => {
                                                                        if(!recording)
                                                                            alert.silent(`Recording "${ title }" ran into an error! Will try to salvage video.`);
                                                                        return true; // Event OK to consume
                                                                    });

                                                                purchaseButton.click();
                                                            } else {
                                                                // Purchase the item
                                                                purchaseButton.click();
                                                            }

                                                            wait(10_000).then(() => {
                                                                top.TWITCH_INTEGRITY_FAIL = defined($('[data-test-selector*="reward"i]')?.closest('[aria-label]')?.querySelector('[class*="load"i][class*="spin"i]'));
                                                            });
                                                        }).finally(() => {
                                                            rewardsMenuButton.click();
                                                            CLAIMING_REWARD = false;
                                                        });
                                                });
                                        });
                                });

                // @performance
                PrepareForGarbageCollection(AutoClaimRewards, AutoClaimAnswers);
            });
        };
        Timers.claim_reward = 15_000;

        Unhandlers.claim_reward = () => {
            clearInterval(DISPLAY_WALLET_BUTTONS);
        };

        __ClaimReward__:
        // On by Default (ObD; v5.16)
        if(nullish(Settings.claim_reward) || parseBool(Settings.claim_reward)) {
            $remark('Adding reward claimer...');

            RegisterJob('claim_reward');

            // Correct "undefined" key for auto-answers...
            Cache.load(['AutoClaimRewards', 'AutoClaimAnswers'], ({ AutoClaimRewards, AutoClaimAnswers }) => {
                let streamers = STREAMER.jump;

                AutoClaimRewards ??= {};
                AutoClaimAnswers ??= {};

                for(let streamer in streamers) {
                    let { id } = streamers[streamer];

                    if((id in AutoClaimRewards) && (id in AutoClaimAnswers)) {
                        let rewards = AutoClaimRewards[id];
                        let answers = AutoClaimAnswers[id];

                        if(undefined in answers) {
                            answers[rewards[0]] = answers[undefined]; // Assume the first entry is the correct one :P

                            $notice(`Correcting auto-answer entry ${ streamer }@${ rewards[0] } → "${ answers[undefined] }"`);

                            delete answers[undefined];
                        }
                    }
                }

                Cache.save({ AutoClaimRewards, AutoClaimAnswers });

                // @performance
                PrepareForGarbageCollection(AutoClaimRewards, AutoClaimAnswers);
            });

            DISPLAY_WALLET_BUTTONS = setInterval(() => {
                let container = $('[data-test-selector*="required"i][data-test-selector*="points"i]:not(:empty), button[disabled] [data-test-selector*="required"i][data-test-selector*="points"i]:empty, [data-test-selector*="chat"i] svg[type*="warn"i]')
                        ?.closest?.('button, [class*="error"i]'),
                    handler = $('#tt-auto-claim-reward-handler, #tt-purchase-and-record-handler');

                let f = furnish;

                // Rainbow border, Cooldown timer, Unlock all, Modify many, and Buy + Record buttons //
                Unlock_All_Emotes: {
                    let emoteCheckout = $('[class*="unlock"i][class*="emote"i][class*="checkout"i]');

                    if(defined(emoteCheckout))
                        when.sated(() => $.all('[data-test-selector^="emote"i]', emoteCheckout))
                            .then(async available => {
                                available = available.length;

                                if($.defined('#tt-unlock-all-emotes') || available < 2)
                                    return;

                                let item = await STREAMER.shop.find(({ title, id }) => $('#channel-points-reward-center-header')?.textContent?.equals(title) || id.toUpperCase().contains('CHOSEN_SUB_EMOTE_UNLOCK')),
                                    cost = item?.cost | 0,
                                    face = (STREAMER.face? furnish.img({ src: STREAMER.face }).outerHTML: Glyphs.modify('channelpoints', { height: 16, width: 16, fill: STREAMER.tint })),
                                    coin = (STREAMER?.coin) | 0,
                                    amount = (coin / cost).floor().clamp(0, available);

                                if(amount < 1)
                                    return;

                                emoteCheckout.firstElementChild.lastElementChild.insertAdjacentElement('beforebegin', furnish(`button#tt-unlock-all-emotes.tt-button.purple[@available=${ available }][@cost=${ cost }]`, {
                                    style: `margin:0.5rem 0`,

                                    onmouseup({ currentTarget }) {
                                        let { available, cost } = currentTarget.dataset;

                                        // Auto-buy rewards
                                        function buyOut(count = 1) {
                                            count *= +$.defined('[class*="reward-center"i]');
                                            available |= 0;
                                            cost |= 0;

                                            if(count > 0)
                                                when.defined(() => $.all('[class*="unlock"i][class*="emote"i][class*="checkout"i] [data-test-selector^="emote"i]')?.random()?.closest('button'))
                                                    .then(emote => {
                                                        emote.click();

                                                        when.defined(() => $('[class*="unlock"i][class*="emote"i][class*="checkout"i] button'))
                                                            .then(unlock => {
                                                                unlock.click();

                                                                when.defined(() => $('.reward-center-body [data-test-selector^="share"i][data-test-selector*="emote"i]'), 2_500)
                                                                    .then(success => {
                                                                        EXACT_POINTS_SPENT += cost;

                                                                        when.defined(() => $('[class*="reward-center"i] [class*="pop"i][class*="head"i] button')).then(back => {
                                                                            back.click();
                                                                            wait(250).then(() => buyOut(--count));
                                                                        });
                                                                    });
                                                            });
                                                    });
                                            else
                                                $('[class*="reward-center"i] [class*="pop"i][class*="head"i] > [class*="right"i]:last-of-type')?.click();
                                        }

                                        buyOut(amount);
                                    },

                                    innerHTML: `Unlock ${ amount >= available? `all (${ available })`: amount } ${ 'emote'.pluralSuffix(amount) }${ (cost > 0? ` for ${ (cost * amount).suffix('',1).replace('.0','') }`: '') }`
                                }));
                            });
                }

                Modify_All_Emotes: {
                    let emoteCheckout = $('[class*="modify"i][class*="emote"i][class*="checkout"i]'),
                        modifiers = 'BW HF SG SQ TK'.split(' '),
                        modified = new Map;

                    if(defined(emoteCheckout))
                        when.sated(() => $.all('[data-test-selector^="emote"i]', emoteCheckout))
                            .then(async available => {
                                available = available.length * modifiers.length;

                                if($.defined('#tt-modify-all-emotes') || available < 2)
                                    return;

                                let item = await STREAMER.shop.find(({ title, id }) => $('#channel-points-reward-center-header')?.textContent?.equals(title) || id.toUpperCase().contains('MODIFY_SUB_EMOTE')),
                                    cost = item?.cost | 0,
                                    face = (STREAMER.face? furnish.img({ src: STREAMER.face }).outerHTML: Glyphs.modify('channelpoints', { height: 16, width: 16, fill: STREAMER.tint })),
                                    coin = (STREAMER?.coin) | 0,
                                    amount = (coin / cost).floor().clamp(0, available);

                                if(!amount)
                                    return;

                                emoteCheckout.firstElementChild.lastElementChild.insertAdjacentElement('beforebegin', furnish(`button#tt-modify-all-emotes.tt-button.purple[@available=${ available }][@cost=${ cost }][@modifiers=${ modifiers }]`, {
                                    style: `margin:0.5rem 0`,

                                    onmouseup({ currentTarget }) {
                                        let { available, modifiers, cost } = currentTarget.dataset;

                                        modifiers = modifiers.split(',');

                                        // Auto-buy rewards
                                        function buyOut(count = 1) {
                                            let rewardsBackButton = $('[class*="reward-center"i] [class*="pop"i][class*="head"i] button');

                                            count *= +$.defined('[class*="reward-center"i]');
                                            available |= 0;
                                            cost |= 0;

                                            if(count > 0)
                                                when.defined(() => $.all('[class*="modify"i][class*="emote"i][class*="checkout"i] [data-test-selector^="emote"i]')?.random()?.closest('button'), 500)
                                                    .then(emote => {
                                                        emote.click();

                                                        when.defined(() => $.all('[class*="reward-center"i] button:not(:disabled) img')?.random()?.closest('button'), 1000)
                                                            .then(modifier => {
                                                                modifier.click();

                                                                when.defined(() => $('button [class*="selected"i] img')).then(img => {
                                                                    let name = $('[data-test-selector*="preview"i], [class*="modify"i][class*="emote"i][class*="checkout"i] [data-a-target*="animation"i] ~ *')?.textContent;

                                                                    if(nullish(name))
                                                                        return /* There should always be a name */;

                                                                    let [em, md] = name.split('_', 2);

                                                                    if(!modified.has(em))
                                                                        modified.set(em, [md]);
                                                                    else if(modified.get(em)?.missing(md))
                                                                        modified.set(em, [...modified.get(em), md]);
                                                                    else // if(modified.get(em).length >= modifiers.length)
                                                                        return buyOut(count, rewardsBackButton?.click());

                                                                    $remark(`Buying emote: "${ name }" for ${ cost }`);

                                                                    when.defined(() => $(`[data-test-selector="RequiredPoints"i], [class*="modify"i][class*="emote"i][class*="checkout"i] img[class*="channel"i][class*="points"i]:not([alt="${ name }"i])`)?.closest('button'), 250)
                                                                        .then(unlock => {
                                                                            unlock.click();

                                                                            when.defined(() => $(`[class*="modify"i][class*="emote"i][class*="checkout"i] img[alt="${ name }"i]`), 2_500)
                                                                                .then(success => {
                                                                                    EXACT_POINTS_SPENT += cost;
                                                                                    rewardsBackButton?.click();

                                                                                    wait(500).then(() => buyOut(--count));
                                                                                });
                                                                        });
                                                                });
                                                            });

                                                        wait(1200).then(() => {
                                                            if($.nullish('[class*="reward-center"i] button:not(:disabled) img')) {
                                                                rewardsBackButton?.click();

                                                                when.defined(() => $.all('[class*="modify"i][class*="emote"i][class*="checkout"i] [data-test-selector^="emote"i]')?.random()?.closest('button'), 500)
                                                                    .then(emote => emote.click());
                                                            }
                                                        });
                                                    });
                                            else
                                                $('[class*="reward-center"i] [class*="pop"i][class*="head"i] > [class*="right"i]:last-of-type')?.click();
                                        }

                                        buyOut(amount);
                                    },

                                    innerHTML: `Modify ${ amount >= available? available: amount } ${ 'emote'.pluralSuffix(amount) }${ (cost > 0? ` for ${ (cost * amount).suffix('',1).replace('.0','') }`: '') }`
                                }));
                            });
                }

                Wallet_Display: {
                    let rewards = $.all('.rewards-list .reward-list-item:not([tt-wallet])');

                    if(rewards.length < 1)
                        break Wallet_Display;

                    Cache.load('AutoClaimRewards', async({ AutoClaimRewards }) => {
                        AutoClaimRewards ??= {};

                        for(let reward of rewards) {
                            let $image = $('img', reward)?.src,
                                $cost = parseCoin($('[data-test-selector="cost"i]', reward)?.textContent),
                                $title = ($('button ~ * [title]', reward)?.textContent || '').trim();

                            let [item] = await STREAMER.shop.filter(({ type = 'UNKNOWN', id = '', title = '', cost = 0, image = '' }) =>
                                (false
                                    || (type.equals("unknown") && id.equals(UUID.from([$image, $title.mutilate(), $cost].join('|$|'), true).value))
                                    || (title.equals($title) && ((cost == $cost) || image.url.equals($image.url)))
                                )
                            );

                            // Variable animataion speed depending on "completion" percentage
                            let child = $('[data-test-selector="cost"i]', reward);
                            let wanted = (AutoClaimRewards[STREAMER.sole] ??= []).contains(item?.id);

                            // Rainbow border
                            child.modStyle(`animation-duration:${ (1 / (STREAMER.coin / $cost)).clamp(1, 30).toFixed(2) }s`);
                            child.setAttribute('rainbow-border', wanted);

                            // Wallet
                            reward.setAttribute('tt-wallet-title', $title);
                            reward.setAttribute('tt-wallet-cost', $cost);
                            reward.setAttribute('tt-wallet', wanted);

                            // Cooldown timer
                            if(REWARDS_ON_COOLDOWN.has(item?.id))
                                child.closest('.reward-list-item').setAttribute('timed-out', toTimeString((REWARDS_ON_COOLDOWN.get(item?.id) - +new Date).clamp(0, +Infinity), 'clock'));
                        }

                        // @performance
                        PrepareForGarbageCollection(AutoClaimRewards);
                    });
                }

                if(defined(handler))
                    return void($('button', handler).disabled = top.TWITCH_INTEGRITY_FAIL);

                Buy_and_Record: if(nullish(container) && parseBool(Settings.video_clips__trophy)) {
                    let purchaseButton = $('[data-test-selector*="required"i][data-test-selector*="points"i]:empty')?.closest?.('button');
                    let cooldown = parseTime(purchaseButton?.previousElementSibling?.getElementByText(parseTime.pattern)?.textContent) | 0;

                    if(nullish(purchaseButton) || cooldown > 0)
                        break Buy_and_Record;

                    let [head, body] = purchaseButton.closest('[class*="reward"i][class*="content"i], [class*="chat"i][class*="input"i]:not([class*="error"i])').children,
                        $body = $('[class*="tray"i][class*="body"i]', head),
                        $title = (($('#channel-points-reward-center-header', head)?.textContent ?? $body?.previousElementSibling?.textContent) || '').trim(),
                        $prompt = (($('.reward-center-body p', body)?.textContent ?? $body?.textContent) || '').trim(),
                        $image = ($('[class*="reward-icon"i] img', body) ?? $('[class*="reward-icon"i] img', head))?.src,
                        [$cost = 0] = (($('[data-test-selector="RewardText"i]', body)?.parentElement ?? $('[class*="reward"i][class*="header"i]', head))?.innerText?.split(/\s/)?.map(parseCoin)?.filter(n => n > 0) ?? []);

                    let [item] = STREAMER.shop.filter(({ type = 'UNKNOWN', id = '', title = '', cost = 0, image = '' }) =>
                        (false
                            || (type.equals("unknown") && id.equals(UUID.from([$image, $title.mutilate(), $cost].join('|$|'), true).value))
                            || (type.unlike("custom") && cost == $cost && id.equals([STREAMER.sole, type].join(':')))
                            || (title.equals($title) && (cost == $cost || image?.url?.equals($image?.url)))
                        )
                    );

                    if(nullish(item))
                        break Buy_and_Record;

                    purchaseButton.dataset.ttAutoBuy = item.id;

                    purchaseButton.insertAdjacentElement('afterend',
                        f(`#tt-purchase-and-record-handler[data-tt-reward-id=${ item.id }]`).with(
                            f('.tt-inline-flex.tt-relative').with(
                                f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative',
                                    {
                                        style: `padding:1rem;text-align:center;min-width:fit-content;width:${ getOffset(purchaseButton).width.ceil() }px!important`,

                                        async onmouseup({ currentTarget }) {
                                            let rewardID = currentTarget.closest('[data-shop-item-id]')?.dataset?.shopItemId ?? currentTarget.closest('[data-tt-reward-id]')?.dataset?.ttRewardId;
                                            let [item] = await STREAMER.shop.filter(({ id }) => id.equals(rewardID));

                                            if(nullish(item))
                                                return;

                                            Chat.consume.onbullet = ({ element, message, subject, mentions }) =>
                                                RECORD_PURCHASE({ updateRecords: false, override: { rewardID, shop: [item] }, element, message, subject, mentions }).then(recording => {
                                                    if(!recording)
                                                        alert.silent(`Recording "${ item.title }" ran into an error! Will try to salvage video.`);
                                                    return true; // Event OK to consume
                                                });

                                            $(`[data-tt-auto-buy="${ rewardID }"i]`)?.click();

                                            wait(10_000).then(() => {
                                                top.TWITCH_INTEGRITY_FAIL = defined($('[data-test-selector*="reward"i]')?.closest('[aria-label]')?.querySelector('[class*="load"i][class*="spin"i]'));
                                            });
                                        },
                                    },

                                    f('[style=height:2rem; width:2rem]', {
                                        innerHTML: Glyphs.modify('video', { style: 'padding-right:.2rem' })
                                    }),

                                    `Buy + Record`
                                )
                            )
                        )
                    );
                }

                if(nullish(container))
                    return;

                // Adds "Buy when available" button
                Cache.load('AutoClaimRewards', async({ AutoClaimRewards }) => {
                    AutoClaimRewards ??= {};

                    let [head, body] = container.closest('[class*="reward"i][class*="content"i], [class*="chat"i][class*="input"i]:not([class*="error"i])').children,
                        $body = $('[class*="tray"i][class*="body"i]', head),
                        $title = (($('#channel-points-reward-center-header', head)?.textContent ?? $body?.previousElementSibling?.textContent) || '').trim(),
                        $prompt = (($('.reward-center-body p', body)?.textContent ?? $body?.textContent) || '').trim(),
                        $image = ($('[class*="reward-icon"i] img', body) ?? $('[class*="reward-icon"i] img', head))?.src,
                        [$cost = 0] = (($('[disabled]', body) ?? $('[class*="reward"i][class*="header"i]', head))?.innerText?.split(/\s/)?.map(parseCoin)?.filter(n => n > 0) ?? []);

                    let [item] = await STREAMER.shop.filter(({ type = 'UNKNOWN', id = '', title = '', cost = 0, image = '' }) =>
                        (false
                            || (type.equals("unknown") && id.equals(UUID.from([$image, $title.mutilate(), $cost].join('|$|'), true).value))
                            || (type.unlike("custom") && cost == $cost && id.equals([STREAMER.sole, type].join(':')))
                            || (title.equals($title) && (cost == $cost || image?.url?.equals($image?.url)))
                        )
                    );

                    if(nullish(item))
                        return;

                    let itemIDs = (AutoClaimRewards[STREAMER.sole] ??= []),
                        rewardID = item.id;

                    let textContent = (
                        itemIDs.contains(rewardID)?
                            `Do not buy`:
                        `Buy when available${ '*'.repeat(+item.needsInput) }`
                    );

                    $('[id$="header"i], [class*="header"i]', head)?.modStyle(`animation-duration:${ (1 / (STREAMER.coin / $cost)).clamp(1, 30).toFixed(2) }s`);
                    $('[id$="header"i], [class*="header"i]', head)?.setAttribute('rainbow-text', itemIDs.contains(rewardID));

                    container.insertAdjacentElement('afterend',
                        f(`#tt-auto-claim-reward-handler[data-tt-reward-id=${ rewardID }]`).with(
                            f('.tt-inline-flex.tt-relative').with(
                                f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative',
                                    {
                                        style: `padding:1rem;text-align:center;min-width:fit-content;width:${ getOffset(container).width.ceil() }px!important`,

                                        async onmouseup({ currentTarget }) {
                                            let rewardID = currentTarget.closest('[data-shop-item-id]')?.dataset?.shopItemId ?? currentTarget.closest('[data-tt-reward-id]')?.dataset?.ttRewardId;
                                            let [item] = await STREAMER.shop.filter(({ id }) => id.equals(rewardID));

                                            if(nullish(item))
                                                return;

                                            Cache.load(['AutoClaimRewards', 'AutoClaimAnswers'], async({ AutoClaimRewards, AutoClaimAnswers }) => {
                                                AutoClaimRewards ??= {};
                                                AutoClaimAnswers ??= {};

                                                let itemIDs = (AutoClaimRewards[STREAMER.sole] ??= []);
                                                let answers = (AutoClaimAnswers[STREAMER.sole] ??= {});
                                                let index = itemIDs.indexOf(rewardID);

                                                if(!!~index) {
                                                    delete answers[rewardID];
                                                    itemIDs.splice(index, 1);
                                                } else {
                                                    if(item.needsInput) {
                                                        answers[rewardID] = await prompt.silent(`<input hidden controller title='Input required to redeem "${ item.title.replace(/'/g, "&apos;") }"' />${ item.prompt || `Please provide input...` }`);

                                                        if(answers[rewardID] === null)
                                                            return /* The user pressed "Cancel" */;
                                                    }

                                                    itemIDs.push(rewardID);
                                                }
                                                itemIDs = itemIDs.filter(defined);
                                                answers = Object.filter(answers, itemIDs);

                                                if(!itemIDs.length) {
                                                    // No more redemptions in this queue :D
                                                    delete AutoClaimRewards[STREAMER.sole];
                                                    delete AutoClaimAnswers[STREAMER.sole];
                                                } else {
                                                    // There are some redemptions to watch for...
                                                    AutoClaimRewards[STREAMER.sole] = itemIDs;
                                                    AutoClaimAnswers[STREAMER.sole] = answers;
                                                }

                                                let [node] = [...currentTarget.childNodes].filter(node => node.nodeName.equals('#text'));

                                                node.textContent = (
                                                    !~index?
                                                        `Do not buy`:
                                                    `Buy when available${ '*'.repeat(+item.needsInput) }`
                                                );

                                                currentTarget.closest('[class*="reward"i][class*="content"i]')?.querySelector('[id$="header"i]')?.setAttribute('rainbow-text', !~index);

                                                Cache.save({ AutoClaimRewards, AutoClaimAnswers });

                                                // @performance
                                                PrepareForGarbageCollection(AutoClaimRewards, AutoClaimAnswers);
                                            });
                                        },
                                    },

                                    f('[style=height:2rem; width:2rem]', {
                                        innerHTML: Glyphs.modify('wallet', { style: 'padding-right:.2rem' })
                                    }),

                                    textContent
                                )
                            )
                        )
                    );

                    // @performance
                    PrepareForGarbageCollection(AutoClaimRewards);
                });

                $('.reward-center-body img')?.closest(':not(img,:only-child)')?.setAttribute('tt-rewards-calc', 'after');
            }, 300);
        }

        __RecordForeignRewards__:
        if(parseBool(Settings.record_foreign_rewards)) {
            Chat.onbullet = async({ element, message, subject, mentions, usable }) => {
                if(!usable)
                    return /* The bullet was created before the "Welcome to chat" message (i.e. "Already used") */;

                element = await element;
                subject ||= element.dataset.type;

                let rewardID = element.dataset?.shopItemId ?? element.closest('[data-tt-reward-id]')?.dataset?.ttRewardId ?? element.dataset.uuid;
                let [item] = await STREAMER.shop.filter(({ id }) => id.equals(rewardID));

                if(nullish(item))
                    return;

                let { id, title } = item;
                let { sole } = STREAMER;

                Cache.load(['AutoClaimRewards'], async({ AutoClaimRewards }) => {
                    AutoClaimRewards ??= {};

                    let itemIDs = (AutoClaimRewards[sole] ??= []);
                    let index = itemIDs.indexOf(rewardID);

                    if(!~index)
                        return /* reward not asked for... */;

                    RECORD_PURCHASE({ fromUser: false, element, message, subject, mentions, AutoClaimRewards });

                    // @performance
                    PrepareForGarbageCollection(AutoClaimRewards);
                });
            };
        }
    },
});
