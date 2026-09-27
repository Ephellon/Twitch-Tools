/*** /plugins/chat/bttv-emotes.js
 * BetterTTV Emotes.
 * Moved verbatim from chat.js (Chat__Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.bttv_emotes',

    async install(context) {
        context.BTTV_EMOTES = (top.BTTV_EMOTES ??= new Map);
        let BTTV_OWNERS = (top.BTTV_OWNERS ??= new Map);

        // Size limit per key is 5MiB
        Cache.large.load(['BTTV_EMOTES', 'BTTV_OWNERS'], data => {
            Object.entries(data?.BTTV_EMOTES ?? {})
                .map(([name, id]) => context.BTTV_EMOTES.set(name, `//cdn.betterttv.net/emote/${ id }/3x`));

            Object.entries(data?.BTTV_OWNERS ?? {})
                .map(([ids, emotes]) => {
                    let [name, displayName, providerId, userId] = ids.split('/');

                    displayName ||= name;

                    for(let emote of emotes)
                        BTTV_OWNERS.set(emote, { name, displayName, providerId, userId });
                });
        });

        let BTTV_LOADER =
        setInterval(() => {
            let emotes = {};
            let emotesUUID = UUID.from([...context.BTTV_EMOTES.keys()].sort().join(',')).value;
            if(context.BTTV_EMOTES.uuid != emotesUUID) {
                context.BTTV_EMOTES.uuid = emotesUUID;

                [...context.BTTV_EMOTES].map(([name, src]) => emotes[name] = parseURL(src).pathname.slice(1).split('/').slice(-2).shift());

                Cache.large.save({ BTTV_EMOTES: emotes });
            }

            let owners = {};
            let ownersUUID = UUID.from([...BTTV_OWNERS.keys()].sort().join(',')).value;
            if(BTTV_OWNERS.uuid != ownersUUID) {
                BTTV_OWNERS.uuid = ownersUUID;

                [...BTTV_OWNERS].map(([emote, { name = '', displayName = '', providerId = '', userId = '' }]) => (owners[[name, displayName.replace(name, ''), providerId, userId].join('/')] ??= []).push(emote));

                Cache.large.save({ BTTV_OWNERS: owners });
            }
        }, 30_000);

        let BTTV_LOADED_INDEX = 0;
        let BTTV_MAX_EMOTES = parseInt(Settings.bttv_emotes_maximum ??= 30);
        let NON_EMOTE_PHRASES = new Set;
        let QUEUED_EMOTES = new Set;
        let CONVERT_TO_BTTV_EMOTE = (emote, makeTooltip = true) => {
                let { name, src } = emote,
                    existing = $(`img.bttv[alt="${ name }"i]`);

                if(defined(existing))
                    return existing.closest?.('div.tt-emote-bttv');

                let f = furnish;

                let emoteContainer =
                f(`#bttv_emote__${ UUID.from(name).toStamp() }.tt-emote-bttv.tt-pd-x-05.tt-relative`).with(
                    f('.emote-button').with(
                        f('.tt-inline-flex').with(
                            f(`button.emote-button__link.tt-align-items-center.tt-flex.tt-justify-content-center[@testSelector=emote-button-clickable][@aTarget=${ name }]`,
                                {
                                    'aria-label': name,
                                    name,

                                    onclick: event => {
                                        let name = event.currentTarget.getAttribute('name'),
                                            chat = $('[data-a-target="chat-input"i]');

                                        // chat.innerHTML = (chat.value += `${ name } `);
                                    },

                                    ondragstart: event => {
                                        let { currentTarget } = event;

                                        event.dataTransfer.setData('text/plain', currentTarget.getAttribute('name').trim() + ' ');
                                        event.dataTransfer.dropEffect = 'move';
                                    },
                                },

                                f.figure(
                                    /*
                                    <div class="emote-button__lock tt-absolute tt-border-radius-small tt-c-background-overlay tt-c-text-overlay tt-inline-flex tt-justify-content-center tt-z-above" data-test-selector="badge-button-lock">
                                        <figure class="ScFigure-sc-1j5mt50-0 laJGEQ tt-svg">
                                            <!-- badge icon -->
                                        </figure>
                                    </div>
                                    */
                                    f('.emote-button__lock.tt-absolute.tt-border-radius-small.tt-c-background-overlay.tt-c-text-overlay.tt-inline-flex.tt-justify-content-center.tt-z-above[@testSelector=badge-button-icon]').with(
                                        f('figure.tt-svg', { style: '-webkit-box-align:center; -moz-box-align:center; align-items:center; display:inline-flex;', innerHTML: Glyphs.modify('emotes', { height: '10px', width: '10px' }) })
                                    ),
                                    f('img.bttv.emote-picker__image', { src, alt: name, style: 'height:3.5rem;' })
                                )
                            )
                        )
                    )
                );

                if(makeTooltip !== false)
                    new Tooltip(emoteContainer, name);

                return emoteContainer;
            };
        let LOAD_BTTV_EMOTES = async(keyword = '', provider = null, ignoreCap = false) => {
                // Load some emotes (max 100 at a time)
                    // [{ emote: { code:string, id:string, imageType:string, user: { displayName:string, id:string, name:string, providerId:string } } }]
                        // emote.code → emote name
                        // emote.id → emote ID (src)
                keyword = (keyword || '').trim();
                provider = provider?.toString?.();

                if(/:(\w+):/.test(keyword) || keyword.length < 1)
                    return;

                if(nullish(provider) || Number.isNaN(provider)) {
                    if(QUEUED_EMOTES.has(keyword) || NON_EMOTE_PHRASES.has(keyword) || context.BTTV_EMOTES.has(keyword))
                        return context.BTTV_EMOTES.get(keyword);
                    QUEUED_EMOTES.add(keyword);
                }

                // Load emotes from a certain user
                if(provider?.length)
                    await fetchURL.fromDisk(`//api.betterttv.net/3/cached/users/twitch/${ provider }`, { hoursUntilEntryExpires: 744 })
                        .then(response => response.json())
                        .then(json => {
                            let { channelEmotes, sharedEmotes } = json;

                            if(nullish(channelEmotes ?? sharedEmotes))
                                return;

                            let emotes = [...channelEmotes, ...sharedEmotes];

                            for(let { emote, code, user, id, imageType, userId = null } of emotes) {
                                code ??= emote?.code;
                                user ??= emote?.user ?? { displayName: context.STREAMER.name, name: context.STREAMER.name.toLowerCase(), providerId: context.STREAMER.sole };

                                if(context.BTTV_EMOTES.has(code))
                                    continue;

                                context.BTTV_EMOTES.set(code, `//cdn.betterttv.net/emote/${ id }/3x`);
                                BTTV_OWNERS.set(code, { ...user, userId: userId ?? user.id });
                            }
                        })
                        .catch($warn);
                // Load emotes with a certain name
                else if(keyword?.length)
                    for(let maxNumOfEmotes = BTTV_MAX_EMOTES, offset = 0, allLoaded = false, MAX_REPEAT = 15; !allLoaded && keyword.trim().normalize('NFKD').length && (ignoreCap || context.BTTV_EMOTES.size < maxNumOfEmotes) && MAX_REPEAT > 0 && !NON_EMOTE_PHRASES.has(keyword); (--MAX_REPEAT > 0? null: NON_EMOTE_PHRASES.add(keyword)))
                        await fetchURL.fromDisk(`//api.betterttv.net/3/emotes/shared/search?query=${ keyword }&offset=${ offset }&limit=100`, { hoursUntilEntryExpires: 744 })
                            .then(response => response.json())
                            .then(emotes => {
                                if(!emotes?.length)
                                    return;

                                for(let { emote, code, user, id, userId = null } of emotes) {
                                    code ??= emote?.code;
                                    user ??= emote?.user ?? {};

                                    if(context.BTTV_EMOTES.has(code))
                                        continue;

                                    context.BTTV_EMOTES.set(code, `//cdn.betterttv.net/emote/${ id }/3x`);
                                    BTTV_OWNERS.set(code, { ...user, userId: userId ?? user.id });
                                }

                                offset += emotes.length | 0;
                                allLoaded ||= emotes.length > maxNumOfEmotes || emotes.length < 15;
                            })
                            .catch(error => {
                                NON_EMOTE_PHRASES.add(keyword);

                                $warn(error);
                            });
                // Load all emotes from...
                else
                    for(let maxNumOfEmotes = BTTV_MAX_EMOTES, offset = 0, allLoaded = false; (ignoreCap || context.BTTV_EMOTES.size < maxNumOfEmotes);)
                        await fetchURL.fromDisk(`//api.betterttv.net/3/${ Settings.bttv_emotes_location ?? 'emotes/shared/trending' }?offset=${ offset }&limit=100`, { hoursUntilEntryExpires: 744 })
                            .then(response => response.json())
                            .then(emotes => {
                                for(let { emote } of emotes) {
                                    let { code, user, id } = emote;

                                    if(context.BTTV_EMOTES.has(code))
                                        continue;

                                    context.BTTV_EMOTES.set(code, `//cdn.betterttv.net/emote/${ id }/3x`);
                                    BTTV_OWNERS.set(code, { ...user, userId: user.id });
                                }

                                offset += emotes.length | 0;
                                allLoaded ||= emotes.length > maxNumOfEmotes || emotes.length < 15;
                            })
                            .catch($warn);
            };
        context.REFURBISH_BTTV_EMOTE_TOOLTIPS = fragment => {
                $.all('[data-bttv-emote]', fragment)
                    .forEach(emote => {
                        let { bttvEmote } = emote.dataset,
                            tooltip = new Tooltip(emote, bttvEmote);

                        emote.addEventListener('mouseup', async event => {
                            let { currentTarget, isTrusted = false } = event,
                                { bttvEmote, bttvOwner, bttvOwnerId } = currentTarget.dataset,
                                { top } = getOffset(currentTarget),
                                ownedEmotes = [];

                            for(let [emote, meta] of BTTV_OWNERS)
                                if(meta.providerId == bttvOwnerId)
                                    ownedEmotes.push({ ...meta, emote });

                            top -= 150;

                            let redoSearch = !isTrusted? -1: setTimeout(() => currentTarget.dispatchEvent(new MouseEvent('mouseup', { bubbles: false, cancelable: false, view: window })), 5000);
                            let resultCard = new Card.deferred({ top });

                            // Raw Search...
                                // FIX-ME: New Search logic does not complete?
                            new Search(bttvOwner)
                                .then(Search.convertResults)
                                .then(({ ok = false, live = false }) => {
                                    let count = ownedEmotes.length,
                                        owner = BTTV_OWNERS.get(bttvEmote).userId,
                                        f = furnish;

                                    if(!ok)
                                        throw `Search failed to complete for "${ bttvOwner }"`;

                                    let list = ownedEmotes.slice(0, 8).map(({ emote, displayName, name, providerId }) =>
                                        f('.chat-line__message--emote-button[@testSelector=emote-button]').with(
                                            f('span[@aTarget=emote-name]').with(
                                                f('.class.chat-image__container.tt-align-center.tt-inline-block').with(
                                                    f('img.bttv.chat-image.chat-line__message--emote', {
                                                        src: context.BTTV_EMOTES.get(emote),
                                                        alt: emote,
                                                    })
                                                )
                                            )
                                        )
                                    ).map(div => div.outerHTML).join('');

                                    resultCard.post({
                                        title: bttvEmote,
                                        subtitle: `BetterTTV Emote (${ bttvOwner })`,
                                        description: `Visit <a href="https://betterttv.com/users/${ owner }" target="_blank">${ bttvOwner } ${ Glyphs.modify('ne_arrow', { height: 16, width: 16, style: 'vertical-align:-3px' }) }</a> to view more emotes. <!-- <p style="margin-top:1rem">${ list }</p> <!-- / -->`,

                                        icon: {
                                            src: context.BTTV_EMOTES.get(bttvEmote),
                                            alt: bttvEmote,
                                        },
                                        footer: {
                                            href: `./${ bttvOwner }`,
                                            name: bttvOwner,
                                            live,
                                        },
                                        fineTuning: { top }
                                    });
                                })
                                .catch(error => {
                                    $warn(error);

                                    resultCard.post({
                                        title: bttvEmote,
                                        subtitle: `BetterTTV Emote (${ bttvOwner })`,

                                        icon: {
                                            src: context.BTTV_EMOTES.get(bttvEmote),
                                            alt: bttvEmote,
                                        },
                                        fineTuning: { top }
                                    });
                                })
                                .finally(() => clearTimeout(redoSearch));
                        });
                    });
            };

        Handlers.bttv_emotes = () => {
            new context.StopWatch('bttv_emotes');

            let BTTVEmoteSection = $('#tt-bttv-emotes');

            if(defined(BTTVEmoteSection))
                return context.StopWatch.stop('bttv_emotes');

            let parent = $('[data-test-selector^="chat-room-component"i] .emote-picker__scroll-container > *');

            if(nullish(parent))
                return context.StopWatch.stop('bttv_emotes');

            // Put all BTTV emotes into the emote-picker list
            let BTTVEmotes = [];

            for(let [name, src] of context.BTTV_EMOTES)
                BTTVEmotes.push({ name, src });

            BTTVEmoteSection =
            furnish('#tt-bttv-emotes.emote-picker__content-block',
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
                            innerHTML: `BetterTTV Emotes &mdash; ${ context.EmoteDragCommand }`
                        })
                    ),

                    // Emote Section Container
                    furnish('#tt-bttv-emotes-container.tt-flex.tt-flex-wrap',
                        {
                            class: 'tt-scrollbar-area',
                            style: 'max-height: 15rem; overflow: hidden scroll; display: flex; flex-wrap: wrap;',
                        },
                        ...BTTVEmotes.shuffle().slice(0, 102).map(CONVERT_TO_BTTV_EMOTE)
                    )
                )
            );

            parent.insertBefore(BTTVEmoteSection, parent.firstChild);

            context.StopWatch.stop('bttv_emotes');
        };
        Timers.bttv_emotes = 5_000;

        __BetterTTVEmotes__:
        if(parseBool(Settings.bttv_emotes)) {
            $remark("Loading BTTV emotes...");

            // Use 85% of available space to load "required" emotes
            BTTV_MAX_EMOTES = Math.round(parseInt(Settings.bttv_emotes_maximum) * 0.85);

            // Load streamer specific emotes
            if(parseBool(Settings.bttv_emotes_channel))
                LOAD_BTTV_EMOTES(context.STREAMER.name, context.STREAMER.sole);
            // Load emotes (not to exceed the max size)
            LOAD_BTTV_EMOTES(context.STREAMER.name)
                .then(async() => {
                    // Allow the remaing 15% to be filled with extra emotes
                    BTTV_MAX_EMOTES = parseInt(Settings.bttv_emotes_maximum);

                    // Load extra emotes
                    for(let keyword of (Settings.bttv_emotes_extras ?? "").split(',').filter(string => string.length > 1))
                        // FIX-ME: Adding BTTV emotes might cause loading issues?
                        LOAD_BTTV_EMOTES(keyword);
                })
                .then(() => {
                    let container = $('#tt-bttv-emotes-container');

                    if(nullish(container))
                        return;

                    // Put all BTTV emotes into the emote-picker list
                    let BTTVEmotes = [];

                    for(let [name, src] of context.BTTV_EMOTES)
                        BTTVEmotes.push({ name, src });

                    container.append(...BTTVEmotes.shuffle().slice(0, 102).map(CONVERT_TO_BTTV_EMOTE));
                })
                .then(() => {
                    $remark("Adding BTTV emote event listener...");

                    // Run the bttv-emote changer on pre-populated messages
                    Chat.get().map(Chat.onmessage = async line => {
                        // Replace BTTV emotes for the last 15 chat messages
                        if(Queue.bttv_emotes.contains(line.uuid))
                            return;

                        Queue.bttv_emotes.push(line.uuid);
                        Queue.bttv_emotes = Queue.bttv_emotes.slice(-60);

                        for(let word of line.message.split(/\s+/)) {
                            // This will recognise "emote" text, i.e. camel-cased text "emoteName" or all-caps "EMOTENAME"
                            if(parseBool(Settings.auto_load_bttv_emotes))
                                if(!NON_EMOTE_PHRASES.has(word) && !QUEUED_EMOTES.has(word) && !context.BTTV_EMOTES.has(word) && word.length >= 3 && /[a-z\d][A-Z]|^[A-Z]+$/.test(word))
                                    await LOAD_BTTV_EMOTES(word, null, true);

                            // This will search for all emotes in the "library"
                            if(context.BTTV_EMOTES.has(word)) {
                                let regexp = RegExp(`${ word.replace(/(\W)/g, '\\$1').replace(/^\w/, '\\b$&').replace(/\w$/, '$&\\b') }`, 'g'),
                                    alt = word,
                                    src = context.BTTV_EMOTES.get(alt),
                                    owner = BTTV_OWNERS.get(alt),
                                    own = owner?.displayName ?? 'Anonymous',
                                    pid = owner?.providerId,
                                    style = `visibility:hidden!important`;

                                let element = await line.element,
                                    uuid = UUID.from(alt).value;

                                element.innerHTML = element.innerHTML.replace(regexp, uuid);

                                for(let child of $.all('*', element))
                                    for(let { name, value } of child.attributes)
                                        if(value == uuid)
                                            child.setAttribute(name, word);

                                element.innerHTML = element.innerHTML.replace(RegExp(uuid, 'g'), furnish('param.tt-convert-to-img', { alt, src, own, pid, style }).outerHTML);
                            }
                        }
                    });

                    setInterval(() => {
                        $.all(`param.tt-convert-to-img`).map(child => {
                            let f = furnish;
                            let fragment = child.closest('[data-a-target$="message"i]'),
                                converted = (fragment.getAttribute('tt-converted-emotes') ?? '').split(' '),
                                tte = (fragment.getAttribute('data-tt-emote') ?? '');

                            let alt = child.getAttribute('alt'),
                                src = child.getAttribute('src'),
                                own = child.getAttribute('own'),
                                pid = child.getAttribute('pid');

                            converted.push(alt);

                            fragment.setAttribute('tt-converted-emotes', converted.join(' ').trim());
                            fragment.dataset.ttEmote = [...tte.split(' '), alt].join(' ').trim();

                            child.parentElement.replaceChild(
                                f(`.chat-line__message--emote-button[@testSelector=emote-button][@bttvEmote=${ alt }][@bttvOwner=${ own }][@bttvOwnerId=${ pid }]`).with(
                                    f('.chat-line__message--emote-button[@testSelector=emote-button]').with(
                                        f('span[@aTarget=emote-name]').with(
                                            f('.class.chat-image__container.tt-align-center.tt-inline-block').with(
                                                f('img.bttv.chat-image.chat-line__message--emote', {
                                                    src,
                                                    alt: encodeHTML(alt),
                                                })
                                            )
                                        )
                                    )
                                )
                                , child
                            );

                            context.REFURBISH_BTTV_EMOTE_TOOLTIPS(fragment);
                        });
                    }, 250);
                });

            $remark("Adding BTTV emote search listener...");

            context.EmoteSearch.onquery = async query => {
                await LOAD_BTTV_EMOTES(query, null, true).then(() => {
                    let results = [...context.BTTV_EMOTES]
                        .filter(([key, value]) => {
                            let pattern = RegExp(query.replace(/(\W)/g, '\\$1'), 'i').test(key),
                                distance = context.EmoteSearch.getTextDistance(query, key);

                            return pattern || (distance < query.length / 2);
                        })
                        .map(([name, src]) => CONVERT_TO_BTTV_EMOTE({ name, src }));

                        context.EmoteSearch.appendResults(results, 'bttv');
                });
            };

            // top.BTTV_EMOTES = BTTV_EMOTES;
            // top.BTTV_OWNERS = BTTV_OWNERS;
            RegisterJob('bttv_emotes');
        }
    },
});
