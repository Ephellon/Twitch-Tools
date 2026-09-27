/*** /plugins/chat/convert-emotes.js
 * Convert Emotes.
 * Moved verbatim from chat.js (Chat__Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.convert_emotes',

    async install(context) {
        const OWNED_EMOTES = (top.OWNED_EMOTES ??= new Map)
            , CAPTURED_EMOTES = (top.CAPTURED_EMOTES ??= new Map)
            , CONVERT_TO_CAPTURED_EMOTE = (emote, makeTooltip = true) => {
                const { name, src } = emote;

                // Try to filter out Twitch-provided emotes...
                if(/^\W/.test(name))
                    return;

                const emoteContainer =
                furnish('.tt-emote-captured.tt-pd-x-05.tt-relative').with(
                    furnish('.emote-button').with(
                        furnish('.tt-inline-flex').with(
                            furnish(`button.emote-button__link.tt-align-items-center.tt-flex.tt-justify-content-center[@testSelector=emote-button-clickable][@aTarget=${ name }]`,
                                {
                                    'aria-label': name,
                                    name,

                                    onclick: event => {
                                        const name = event.currentTarget.getAttribute('name')
                                            , chat = $('[data-a-target="chat-input"i]');

                                        // chat.innerHTML = (chat.value += `${ name } `);
                                    },

                                    ondragstart: event => {
                                        const { currentTarget } = event;

                                        event.dataTransfer.setData('text/plain', currentTarget.getAttribute('name').trim() + ' ');
                                        event.dataTransfer.dropEffect = 'move';
                                    },
                                },

                                furnish.figure(
                                    /*
                                    <div class="emote-button__lock tt-absolute tt-border-radius-small tt-c-background-overlay tt-c-text-overlay tt-inline-flex tt-justify-content-center tt-z-above" data-test-selector="badge-button-lock">
                                        <figure class="ScFigure-sc-1j5mt50-0 laJGEQ tt-svg">
                                            <!-- badge icon -->
                                        </figure>
                                    </div>
                                    */
                                    furnish('.emote-button__lock.tt-absolute.tt-border-radius-small.tt-c-background-overlay.tt-c-text-overlay.tt-inline-flex.tt-justify-content-center.tt-z-above[@testSelector=badge-button-icon]').with(
                                        furnish('figure.tt-svg', { style: '-webkit-box-align:center; -moz-box-align:center; align-items:center; display:inline-flex;', innerHTML: Glyphs.modify('emotes', { height: '10px', width: '10px' }) })
                                    ),
                                    furnish('img.emote-picker__image', { src, alt: name })
                                )
                            )
                        )
                    )
                );

                if(makeTooltip !== false)
                    new Tooltip(emoteContainer, name);

                return emoteContainer;
            };

        // Convert emote URL to a short url
        const shrt = url => url.replace(/https:\/\/static-cdn\.jtvnw\.net\/emoticons\/v1\/(\d+)\/([\d\.]+)/i, ($0, $1, $2, $$, $_) => {
                const id = parseInt($1).toString(36)
                    , version = $2;

                return [id, version].join('-');
            });

        Handlers.convert_emotes = () => {
            let emoteSection = $('#tt-captured-emotes');

            if(defined(emoteSection))
                return;

            const parent = $('[data-test-selector^="chat-room-component"i] .emote-picker__scroll-container > *');

            if(nullish(parent))
                return RestartJob('convert_emotes', 'missing:convert_emotes.parent');

            // Get the streamer's emotes and make them draggable
            const streamersEmotes = $(`[class^="emote-picker"i] img[alt="${ context.STREAMER.name }"i]`)?.closest('div')?.nextElementSibling;

            if(nullish(streamersEmotes))
                return RegisterJob('convert_emotes');

            for(const lock of $.all('[data-test-selector*="lock"i]', streamersEmotes)) {
                const emote = lock.nextElementSibling
                    , { alt, src } = emote
                    , parent = emote.closest('[class^="emote-picker"i]').parentElement
                    , container = parent.parentElement;

                container.insertBefore(CONVERT_TO_CAPTURED_EMOTE({ name: alt, src }, false), parent);

                lock.remove();
                emote.remove();
                parent.remove();
            }

            // Put all collected emotes into the emote-picker list
            const caughtEmotes = [];

            for(const [name, src] of CAPTURED_EMOTES)
                caughtEmotes.push({ name, src });

            emoteSection =
            furnish('#tt-captured-emotes.emote-picker__content-block',
                {
                    ondragover: event => {
                        event.preventDefault();
                        // event.dataTransfer.dropEffect = 'move';
                    },

                    ondrop: async event => {
                        event.preventDefault();

                        return event.dataTransfer.getData('text/plain');
                    },
                },

                furnish('.tt-pd-b-1.tt-pd-t-05.tt-pd-x-1.tt-relative').with(
                    // Emote Section Header
                    furnish('.emote-grid-section__header-title.tt-align-items-center.tt-flex.tt-pd-x-1.tt-pd-y-05').with(
                        furnish('p.tt-align-middle.tt-c-text-alt.tt-strong', {
                            innerHTML: `Captured Emotes &mdash; ${ context.EmoteDragCommand }`
                        })
                    ),

                    // Emote Section Container
                    furnish('#tt-captured-emotes-container.tt-flex.tt-flex-wrap',
                        {
                            class: 'tt-scrollbar-area',
                            style: 'max-height: 15rem; overflow: hidden scroll;',
                        },
                        ...caughtEmotes.map(CONVERT_TO_CAPTURED_EMOTE)
                    )
                )
            );

            parent.insertBefore(emoteSection, parent.firstChild);
        };
        Timers.convert_emotes = 2_500;

        __ConvertEmotes__:
        if(parseBool(Settings.convert_emotes)) {
            // Collect emotes
            const chat_emote_button = $('[data-a-target="emote-picker-button"i]');

            if(nullish(chat_emote_button))
                break __ConvertEmotes__;

            function CollectEmotes() {
                chat_emote_button.click();

                const chat_emote_scroll = $('.emote-picker .simplebar-scroll-content');

                if(nullish(chat_emote_scroll)) {
                    chat_emote_button.click();
                    return wait(250).then(CollectEmotes);
                }

                // Set the ID to display the "Hold on..." message
                $('.emote-picker [class*="tab-content"i]').id = 'tt-hidden-emote-container';

                // Click on the channel's tab
                $('[data-a-target="CHANNEL_EMOTES"i]')?.click();

                // Grab locked emotes when the page loads
                wait(250).then(() => {
                    // Collect the emotes
                    $.all('.emote-button [data-test-selector*="lock"i] ~ img:not(.bttv)')
                        .map(img => CAPTURED_EMOTES.set(img.alt, shrt(img.src)));

                    $.all('.emote-button img:not(.bttv)')
                        .filter(img => !CAPTURED_EMOTES.has(img.alt))
                        .map(img => OWNED_EMOTES.set(img.alt, shrt(img.src)));

                    // Close and continue...
                    // TODO: Add an `onscroll` event listener to close the emote panel dynamically...
                    wait(2_500).then(() => {
                        $('#tt-hidden-emote-container')?.removeAttribute('id');

                        chat_emote_scroll.scrollTo(0, 0);
                        chat_emote_button.click();
                    });
                });
            }

            if(defined(chat_emote_button))
                CollectEmotes();
            else
                wait(250).then(CollectEmotes);

            $remark("Adding emote event listener...");

            // Run the emote catcher on pre-populated messages
            Chat.get().map(Chat.onmessage = async line => {
                let regexp;

                for(const emote in line.emotes)
                    if(!OWNED_EMOTES.has(emote) && !CAPTURED_EMOTES.has(emote) && !context.BTTV_EMOTES.has(emote)) {
                        // $log(`Adding emote "${ emote }"`);

                        CAPTURED_EMOTES.set(emote, line.emotes[emote]);

                        const capturedEmote = CONVERT_TO_CAPTURED_EMOTE({ name: emote, src: line.emotes[emote] });

                        if(defined(capturedEmote))
                            $('#tt-captured-emotes-container')?.append?.(capturedEmote);
                    }

                // Replace emotes for the last 30 chat messages
                if(Queue.emotes.contains(line.uuid))
                    return;
                if(Queue.emotes.length >= 30)
                    Queue.emotes = [];
                Queue.emotes.push(line.uuid);

                for(const [emote, url] of CAPTURED_EMOTES)
                    if((regexp = RegExp('\\b' + emote.replace(/(\W)/g, '\\$1') + '\\b', 'g')).test(line.message)) {
                        let alt = emote
                            , src = 'https://static-cdn.jtvnw.net/emoticons/v1/' + url.split('-').map((v, i) => i == 0 ? parseInt(v, 36) : v).join('/')
                            , srcset;

                        if(/\/https?:\/\//i.test(src))
                            src = src.replace(/[^]*\/(https?:\/\/[^]*)(?:\/https?:\/\/)?$/i, '$1');
                        else
                            srcset = [1, 2, 4].map((v, i) => src.replace(/[\d\.]+$/, `${ (i + 1).toFixed(1) } ${ v }x`)).join(',');

                        const f = furnish;
                        const img =
                        f('.chat-line__message--emote-button[@testSelector=emote-button]').with(
                            f('span[@aTarget=emote-name]').with(
                                f('.class.chat-image__container.tt-align-center.tt-inline-block').with(
                                    f('img.chat-image.chat-line__message--emote', {
                                        srcset, alt, src,
                                    })
                                )
                            )
                        );

                        when(line => (defined(line.element) ? line : false), 1000, line).then(async element => {
                            alt = alt.replace(/\s+/g, '_');

                            $.all(`.text-fragment:not([tt-converted-emotes~="${ alt }"i])`, element).map(fragment => {
                                const container = furnish(`.chat-line__message--emote-button[@testSelector=emote-button][@capturedEmote=${ alt }]`).html(img.innerHTML)
                                    , converted = (fragment.getAttribute('tt-converted-emotes') ?? '').split(' ');

                                converted.push(alt);

                                const tte = fragment.getAttribute('data-tt-emote') ?? '';

                                fragment.setAttribute('data-tt-emote', [...tte.split(' '), alt].join(' '));
                                fragment.setAttribute('tt-converted-emotes', converted.join(' ').trim());
                                fragment.innerHTML = fragment.innerHTML.replace(regexp, container.outerHTML);

                                $.all('[data-captured-emote]', fragment)
                                    .forEach(element => {
                                        const { capturedEmote } = element.dataset;
                                        // ... //
                                    });
                                context.REFURBISH_BTTV_EMOTE_TOOLTIPS(fragment);
                            });
                        });
                    }
            });

            $remark("Adding emote search listener...");

            context.EmoteSearch.onquery = query => {
                const results = [...CAPTURED_EMOTES]
                    .filter(([key, value]) => {
                        const pattern = RegExp(query.replace(/(\W)/g, '\\$1'), 'i').test(key)
                            , distance = context.EmoteSearch.getTextDistance(query, key);

                        return pattern || (distance < query.length / 2);
                    })
                    .map(([name, src]) => CONVERT_TO_CAPTURED_EMOTE({ name, src }));

                context.EmoteSearch.appendResults(results, 'captured');
            };

            // top.CAPTURED_EMOTES = CAPTURED_EMOTES;
            // top.OWNED_EMOTES = OWNED_EMOTES;
            RegisterJob('convert_emotes');
        } // :__ConvertEmotes__

        // Update rules
            // UPDATE_RULES(ruleType:string<"filter" | "phrase" | "lurking">) → object<{ text:RegExp, user:RegExp, emote:RegExp, badge:RegExp, channel:array<object>, rules:array<string>{ specific:array<string{ channel:array<string>, user:array<string>, badge:array<string>, emote:array<string> }>, general:array<string> } }>
        context.UPDATE_RULES = (ruleType, delimeter = ',') => {
            let rules = Settings[`${ ruleType }_rules`];
            const channel = [], user = [], badge = [], emote = [], text = [];

            if(defined(rules?.length)) {
                rules = rules.split(RegExp(`\\s*${ delimeter }\\s*`)).map(rule => rule.trim()).filter(rule => rule.length);

                Object.defineProperties(rules, {
                    specific: { value: [] },
                    general: { value: [] },
                });

                const R = RegExp;

                for(const rule of rules)
                    // /channel `rule(s)`
                    if(/^\/[\w\-]+/.test(rule)) {
                        const caught = /^\/(?<name>[\w\-]+) +(?:(?:<(?<badge>[^>]+)>)?(?::(?<emote>[^:]+):|@(?<user>[\w\-]+)|(?<text>[^$]*))?)$/i.exec(rule).groups;

                        channel.push(caught);
                        rules.specific.push(rule);
                        (rules.specific.channel ??= []).push(caught);
                    }
                    // @username
                    else if(/^@([\w\-]+)/.test(rule) && ['@everyone', '@chat', '@all'].missing(rule.toLowerCase())) {
                        const caught = /^@(?<user>[\w\-]+)(?<text>.*)/.exec(rule).groups;

                        user.push(R.$1);
                        rules.specific.push(rule);
                        (rules.specific.user ??= []).push(caught);
                    }
                    // <badge>
                    else if(/^<([\w\- ]+)>/.test(rule)) {
                        const caught = /^<(?<badge>[\w\- ]+)>(?<text>.*)/.exec(rule).groups;

                        badge.push(R.$1);
                        rules.specific.push(rule);
                        (rules.specific.badge ??= []).push(caught);
                    }
                    // :emote:
                    else if(/^:([\w\- ]+):$/.test(rule)) {
                        emote.push(R.$1);
                        rules.specific.push(rule);
                        (rules.specific.emote ??= []).push(R.$1);
                    }
                    // text
                    else if(rule) {
                        text.push(/^[\w\s]+$/.test(rule) ? `\\b${ rule }\\b` : rule);
                        rules.general.push(rule);
                    }
            }

            const channels = RegExp(`^(${ (channel.length ? channel.map(({ name }) => name).join('|') : '[\\b]') })$`, 'i');
            Object.defineProperties(channel, {
                test: { value: channels.test.bind(channels) },
                exec: { value: channels.exec.bind(channels) },
            });

            return {
                text: (text.length ? RegExp(`(${ text.join('|') })`, 'i') : /^[\b]$/),
                user: (user.length ? RegExp(`^(${ user.join('|') })$`, 'i') : /^[\b]$/),
                emote: (emote.length ? RegExp(`(${ emote.join('|') })`, 'i') : /^[\b]$/),
                badge: (badge.length ? RegExp(`(${ badge.join('|') })`, 'i') : /^[\b]$/),
                channel, rules
            };
        };
    },
});
