/*** /chat.js - Meant for features that can run on chat-only pages
 *       _____ _           _     _
 *      / ____| |         | |   (_)
 *     | |    | |__   __ _| |_   _ ___
 *     | |    | '_ \ / _` | __| | / __|
 *     | |____| | | | (_| | |_ _| \__ \
 *      \_____|_| |_|\__,_|\__(_) |___/
 *                             _/ |
 *                            |__/
 */

let Chat__Initialize = async(START_OVER = false) => {
    let { USERNAME, STREAMER, STREAMERS, ALL_CHANNELS, CHANNELS, PATHNAME, THEME, SEARCH, NOTIFICATIONS, GLOBAL_EVENT_LISTENERS } = top;

    /*** Automation
     *                    _                        _   _
     *         /\        | |                      | | (_)
     *        /  \  _   _| |_ ___  _ __ ___   __ _| |_ _  ___  _ __
     *       / /\ \| | | | __/ _ \| '_ ` _ \ / _` | __| |/ _ \| '_ \
     *      / ____ \ |_| | || (_) | | | | | | (_| | |_| | (_) | | | |
     *     /_/    \_\__,_|\__\___/|_| |_| |_|\__,_|\__|_|\___/|_| |_|
     *
     *
     */
    /*** Auto-claim Channel Points
     *                    _                  _       _              _____ _                            _   _____      _       _
     *         /\        | |                | |     (_)            / ____| |                          | | |  __ \    (_)     | |
     *        /  \  _   _| |_ ___ ______ ___| | __ _ _ _ __ ___   | |    | |__   __ _ _ __  _ __   ___| | | |__) |__  _ _ __ | |_ ___
     *       / /\ \| | | | __/ _ \______/ __| |/ _` | | '_ ` _ \  | |    | '_ \ / _` | '_ \| '_ \ / _ \ | |  ___/ _ \| | '_ \| __/ __|
     *      / ____ \ |_| | || (_) |    | (__| | (_| | | | | | | | | |____| | | | (_| | | | | | | |  __/ | | |  | (_) | | | | | |_\__ \
     *     /_/    \_\__,_|\__\___/      \___|_|\__,_|_|_| |_| |_|  \_____|_| |_|\__,_|_| |_|_| |_|\___|_| |_|   \___/|_|_| |_|\__|___/
     *
     *
     */
    Handlers.auto_claim_bonuses = () => {
        let ChannelPoints = $('[data-test-selector="community-points-summary"i] button[class*="--success"i]'),
            Enabled = (Settings.auto_claim_bonuses && parseBool($('#tt-auto-claim-bonuses')?.getAttribute('tt-auto-claim-bonus-channel-points-enabled') ?? $('[data-a-page-loaded-name="PopoutChatPage"i]')));

        if(Enabled && ChannelPoints)
            ChannelPoints.click();

        let parent = $('div:not(#tt-auto-claim-bonuses) > [data-test-selector="community-points-summary"i] [role="tooltip"i]'),
            tooltip = $('#tt-auto-claim-bonuses [role="tooltip"i]');

        if(tooltip && parent)
            tooltip.innerText = parent.innerText;

        // Actual jobbing
        let button = $('#tt-auto-claim-bonuses');

        if(!defined(button)) {
            let parent    = $('[data-test-selector="community-points-summary"i]'),
                heading   = $('.top-nav__menu > div', true).slice(-1)[0],
                container = furnish('div');

            if(!defined(parent) || !defined(heading)) {
                // setTimeout(Chat__Initialize, 5000);
                return;
            }

            container.innerHTML = parent.outerHTML;
            container.id = 'tt-auto-claim-bonuses';
            container.classList.add('community-points-summary', 'tw-align-items-center', 'tw-flex', 'tw-full-height');

            heading.insertBefore(container, heading.children[1]);

            $('#tt-auto-claim-bonuses [data-test-selector="community-points-summary"i] > div:last-child:not(:first-child)').remove();

            let textContainer = $('[class*="animate"i]', false, container);

            if(textContainer) {
                let { parentElement } = textContainer;
                parentElement.removeAttribute('data-test-selector');
            }

            button = {
                container,
                enabled: true,
                text: textContainer,
                icon: $('svg, img', false, container),
                get offset() { return getOffset(container) },
                tooltip: new Tooltip(container, `Collecting ${ STREAMER.fiat ?? 'Bonuses' }`, { top: -10 }),
            };

            button.tooltip.id = new UUID().toString();
            button.text.innerText = 'ON';
            button.container.setAttribute('tt-auto-claim-bonus-channel-points-enabled', true);

            button.icon ??= $('svg, img', false, container);

            if(!defined($('.channel-points-icon', false, container)))
                button.icon.outerHTML = Glyphs.channelpoints;

            button.icon = $('svg, img', false, container);
        } else {
            let container = button,
                textContainer = $('[class*="animate"i]', false, container);

            button = {
                container,
                enabled: true,
                text: textContainer,
                tooltip: Tooltip.get(container),
                icon: $('svg, img', false, container),
                get offset() { return getOffset(container) },
            };
        }

        button.container.onclick ??= event => {
            let enabled = button.container.getAttribute('tt-auto-claim-bonus-channel-points-enabled') !== 'true';

            button.container.setAttribute('tt-auto-claim-bonus-channel-points-enabled', enabled);
            button.text.innerText = ['OFF','ON'][+enabled];
            button.tooltip.innerHTML = `${ ['Ignor','Collect'][+enabled] }ing ${ STREAMER.fiat ?? 'Bonuses' }`;

            button.icon?.setAttribute('fill', `var(--color-${ ['red','accent'][+enabled] })`);
        };

        button.container.onmouseenter ??= event => {
            button.icon?.setAttribute('style', 'transform: translateX(0px) scale(1.2); transition: transform 300ms ease 0s');
        };

        button.container.onmouseleave ??= event => {
            button.icon?.setAttribute('style', 'transform: translateX(0px) scale(1); transition: transform 300ms ease 0s');
        };

        // Make sure the button is all the way to the left
        for(let max = 10; max > 0 && defined(button.container.previousElementSibling); --max)
            button.container.parentElement.insertBefore(button.container, button.container.previousElementSibling);
    };
    Timers.auto_claim_bonuses = 5_000;

    Unhandlers.auto_claim_bonuses = () => {
        $('#tt-auto-claim-bonuses')?.remove();
    };

    __AutoClaimBonuses__:
    if(parseBool(Settings.auto_claim_bonuses)) {
        RegisterJob('auto_claim_bonuses');
    }

    /*** Chat & Messaging
     *       _____ _           _              __  __                           _
     *      / ____| |         | |     ___    |  \/  |                         (_)
     *     | |    | |__   __ _| |_   ( _ )   | \  / | ___  ___ ___  __ _  __ _ _ _ __   __ _
     *     | |    | '_ \ / _` | __|  / _ \/\ | |\/| |/ _ \/ __/ __|/ _` |/ _` | | '_ \ / _` |
     *     | |____| | | | (_| | |_  | (_>  < | |  | |  __/\__ \__ \ (_| | (_| | | | | | (_| |
     *      \_____|_| |_|\__,_|\__|  \___/\/ |_|  |_|\___||___/___/\__,_|\__, |_|_| |_|\__, |
     *                                                                    __/ |         __/ |
     *                                                                   |___/         |___/
     */
    /*** Emote Searching - NOT A SETTING. This is a hlper for "Convert Emotes" and "BTTV Emotes"
     *      ______                 _          _____                     _     _
     *     |  ____|               | |        / ____|                   | |   (_)
     *     | |__   _ __ ___   ___ | |_ ___  | (___   ___  __ _ _ __ ___| |__  _ _ __   __ _
     *     |  __| | '_ ` _ \ / _ \| __/ _ \  \___ \ / _ \/ _` | '__/ __| '_ \| | '_ \ / _` |
     *     | |____| | | | | | (_) | ||  __/  ____) |  __/ (_| | | | (__| | | | | | | | (_| |
     *     |______|_| |_| |_|\___/ \__\___| |_____/ \___|\__,_|_|  \___|_| |_|_|_| |_|\__, |
     *                                                                                 __/ |
     *                                                                                |___/
     */
    let EmoteSearch = {};

    Handlers.emote_searching = () => {
        EmoteSearch.input = $('.emote-picker [type="search"i]');

        if(defined(EmoteSearch.input?.value))
            if(EmoteSearch.input.value != EmoteSearch.value)
                if((EmoteSearch.value = EmoteSearch.input.value)?.length >= 3)
                    for(let [name, callback] of EmoteSearch.__onquery__)
                        callback(EmoteSearch.value);
    };
    Timers.emote_searching = 100;

    __EmoteSearching__:
    if(parseBool(Settings.convert_emotes) || parseBool(Settings.bttv_emotes)) {
        Object.defineProperties(EmoteSearch, {
            onquery: {
                set(callback) {
                    let name = callback.name || UUID.from(callback.toString()).value;

                    if(EmoteSearch.__onquery__.has(name))
                        return EmoteSearch.__onquery__.get(name);

                    // REMARK('Adding [on query] event listener', { [name]: callback });

                    EmoteSearch.__onquery__.set(name, callback);

                    return callback;
                },

                get() {
                    return EmoteSearch.__onquery__.size;
                },
            },
            __onquery__: { value: new Map() },

            appendResults: {
                value: function appendResults(nodes, type) {
                    $(`[tt-${ type }-emote-search-result]`, true).forEach(node => node.remove());

                    let container = $('[class*="emote-picker"i] [class*="wrap"i]:last-child');

                    for(let node of nodes) {
                        if(!defined(node))
                            continue;

                        node.setAttribute(`tt-${ type }-emote-search-result`, UUID.from(node.innerHTML).value);

                        container.appendChild(node);
                    }

                    let title = $('[class*="emote-picker"i] p');

                    title.innerText = title.innerText.replace(/^.*("[^]+")/, `${ container.children.length } search results for $1`);
                },
            },
        });

        RegisterJob('emote_searching');
    }

    /*** BetterTTV Emotes
     *      ____       _   _         _______ _________      __  ______                 _
     *     |  _ \     | | | |       |__   __|__   __\ \    / / |  ____|               | |
     *     | |_) | ___| |_| |_ ___ _ __| |     | |   \ \  / /  | |__   _ __ ___   ___ | |_ ___  ___
     *     |  _ < / _ \ __| __/ _ \ '__| |     | |    \ \/ /   |  __| | '_ ` _ \ / _ \| __/ _ \/ __|
     *     | |_) |  __/ |_| ||  __/ |  | |     | |     \  /    | |____| | | | | | (_) | ||  __/\__ \
     *     |____/ \___|\__|\__\___|_|  |_|     |_|      \/     |______|_| |_| |_|\___/ \__\___||___/
     *
     *
     */
    let BTTV_EMOTES = top.BTTV_EMOTES ?? new Map(),
        BTTV_OWNERS = top.BTTV_OWNERS ?? new Map(),
        BTTV_LOADED_INDEX = 0,
        CONVERT_TO_BTTV_EMOTE = (emote, makeTooltip = true) => {
            let { name, src } = emote,
                existing = $(`img.bttv[alt="${ name }"]`);

            if(defined(existing))
                return existing.closest('div.tt-emote-bttv');

            let emoteContainer =
            furnish('div.tt-emote-bttv.tw-pd-x-05.tw-relative', {},
                furnish('div.emote-button', {},
                    furnish('div.tw-inline-flex', {},
                        furnish('button.emote-button__link.tw-align-items-center.tw-flex.tw-justify-content-center',
                            {
                                'data-test-selector': 'emote-button-clickable',
                                'aria-label': name,
                                name,
                                'data-a-target': name,

                                onclick: event => {
                                    let name = event.currentTarget.getAttribute('name'),
                                        chat = $('[data-a-target="chat-input"]');

                                    // chat.innerHTML = (chat.value += `${name} `);
                                },

                                ondragstart: event => {
                                    let { currentTarget } = event;

                                    event.dataTransfer.setData('text/plain', currentTarget.getAttribute('name').trim() + ' ');
                                    event.dataTransfer.dropEffect = 'move';
                                },
                            },

                            furnish('figure', {},
                                /*
                                <div class="emote-button__lock tw-absolute tw-border-radius-small tw-c-background-overlay tw-c-text-overlay tw-inline-flex tw-justify-content-center tw-z-above" data-test-selector="badge-button-lock">
                                    <figure class="ScFigure-sc-1j5mt50-0 laJGEQ tw-svg">
                                        <!-- badge icon -->
                                    </figure>
                                </div>
                                */
                                furnish('div.emote-button__lock.tw-absolute.tw-border-radius-small.tw-c-background-overlay.tw-c-text-overlay.tw-inline-flex.tw-justify-content-center.tw-z-above', { 'data-test-selector': 'badge-button-icon' },
                                    furnish('figure.tw-svg', { style: '-webkit-box-align:center; align-items:center; display:inline-flex;', innerHTML: Glyphs.modify('emotes', { height: '10px', width: '10px' }) })
                                ),
                                furnish('img.bttv.emote-picker__image', { src, alt: name, style: 'height:3.5rem;' })
                            )
                        )
                    )
                )
            );

            if(makeTooltip !== false)
                new Tooltip(emoteContainer, name);

            return emoteContainer;
        },
        LOAD_BTTV_EMOTES = async(keyword, provider) => {
            // Load some emotes (max 100 at a time)
                // [{ emote: { code:string, id:string, imageType:string, user: { displayName:string, id:string, name:string, providerId:string } } }]
                    // emote.code -> emote name
                    // emote.id -> emote ID (src)

            // Load emotes from a certain user
            if(defined(provider))
                await fetch(`//api.betterttv.net/3/cached/users/twitch/${ provider }`)
                    .then(response => response.json())
                    .then(json => {
                        let { channelEmotes, sharedEmotes } = json;

                        if(!defined(channelEmotes ?? sharedEmotes))
                            return;

                        let emotes = [...channelEmotes, ...sharedEmotes];

                        for(let { emote, code, user, id } of emotes) {
                            code ??= emote?.code;
                            user ??= emote?.user ?? { displayName: STREAMER.name, name: STREAMER.name.toLowerCase(), providerId: STREAMER.sole };

                            if(BTTV_EMOTES.has(code))
                                continue;

                            BTTV_EMOTES.set(code, `//cdn.betterttv.net/emote/${ id }/3x`);
                            BTTV_OWNERS.set(code, user);
                        }
                    });
            // Load emotes with a certain name
            else if(defined(keyword))
                for(let maxNumOfEmotes = parseInt(Settings.bttv_emotes_maximum ?? 30), offset = 0, allLoaded = false; allLoaded === false && BTTV_EMOTES.size < maxNumOfEmotes;)
                    await fetch(`//api.betterttv.net/3/emotes/shared/search?query=${ keyword }&offset=${ offset }&limit=100`)
                        .then(response => response.json())
                        .then(emotes => {
                            for(let { emote, code, user, id } of emotes) {
                                code ??= emote?.code;
                                user ??= emote?.user;

                                if(BTTV_EMOTES.has(code))
                                    continue;

                                BTTV_EMOTES.set(code, `//cdn.betterttv.net/emote/${ id }/3x`);
                                BTTV_OWNERS.set(code, user ?? {});
                            }

                            offset += emotes.length | 0;
                            allLoaded ||= emotes.length < 80;
                        });
            // Load all emotes from...
            else
                for(let maxNumOfEmotes = parseInt(Settings.bttv_emotes_maximum ?? 30), offset = 0; BTTV_EMOTES.size < maxNumOfEmotes;)
                    await fetch(`//api.betterttv.net/3/${ Settings.bttv_emotes_location ?? 'emotes/shared/trending' }?offset=${ offset }&limit=100`)
                        .then(response => response.json())
                        .then(emotes => {
                            for(let { emote } of emotes) {
                                let { code, user, id } = emote;

                                if(BTTV_EMOTES.has(code))
                                    continue;

                                BTTV_EMOTES.set(code, `//cdn.betterttv.net/emote/${ id }/3x`);
                                BTTV_OWNERS.set(code, user ?? {});
                            }

                            offset += emotes.length | 0;
                        });
        };

    Handlers.bttv_emotes = () => {
        let BTTVEmoteSection = $('#tt-bttv-emotes');

        if(defined(BTTVEmoteSection))
            return;

        let parent = $('[data-test-selector^="chat-room-component"i] .emote-picker__scroll-container > *');

        if(!defined(parent))
            return RestartJob('bttv_emotes');

        // Put all BTTV emotes into the emote-picker list
        let BTTVEmotes = [];

        for(let [name, src] of BTTV_EMOTES)
            BTTVEmotes.push({ name, src });

        BTTVEmoteSection =
        furnish('div#tt-bttv-emotes.emote-picker__content-block',
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

            furnish('div.tw-pd-b-1.tw-pd-t-05.tw-pd-x-1.tw-relative', {},
                // Emote Section Header
                furnish('div.emote-grid-section__header-title.tw-align-items-center.tw-flex.tw-pd-x-1.tw-pd-y-05', {},
                    furnish('p.tw-align-middle.tw-c-text-alt.tw-strong', {
                        innerHTML: "BetterTTV Emotes &mdash; Drag to use"
                    })
                ),

                // Emote Section Container
                furnish('div#tt-bttv-emotes-container.tw-flex.tw-flex-wrap',
                    {
                        class: 'tt-scrollbar-area',
                        style: 'max-height: 15rem; overflow: hidden scroll;',
                    },
                    ...BTTVEmotes.map(CONVERT_TO_BTTV_EMOTE)
                )
            )
        );

        parent.insertBefore(BTTVEmoteSection, parent.firstChild);
    };
    Timers.bttv_emotes = 5_000;

    __BetterTTVEmotes__:
    if(parseBool(Settings.bttv_emotes)) {
        REMARK('Loading BTTV emotes...');

        // Load streamer specific emotes
        if(parseBool(Settings.bttv_emotes_channel))
            await LOAD_BTTV_EMOTES(STREAMER.name, STREAMER.sole);
        // Load emotes (not to exceed the max size)
        await LOAD_BTTV_EMOTES()
            .then(async() => {
                // Load extra emotes
                for(let keyword of (Settings.bttv_emotes_extras ?? "").split(',').filter(string => string.length > 1))
                    await LOAD_BTTV_EMOTES(keyword);
            });

        REMARK('Adding BTTV emote event listener...');

        // Run the bttv-emote changer on pre-populated messages
        (GetChat.onnewmessage = chat => {
            let regexp;

            for(let line of chat) {
                // Replace BTTV emotes for the last 30 chat messages
                if(Queue.bttv_emotes.contains(line.uuid))
                    continue;
                if(Queue.bttv_emotes.length >= 30)
                    Queue.bttv_emotes = [];
                Queue.bttv_emotes.push(line.uuid);

                for(let [name, src] of BTTV_EMOTES)
                    if((regexp = RegExp('\\b' + name.replace(/(\W)/g, '\\$1') + '\\b', 'g')).test(line.message)) {
                        let alt = name,
                            owner = BTTV_OWNERS.get(alt),
                            own = owner?.displayName ?? 'Anonymous',
                            pid = owner?.providerId;

                        let f = furnish;
                        let img =
                        f('div.chat-line__message--emote-button', { 'data-test-selector': 'emote-button' },
                            f('span', { 'data-a-target': 'emote-name' },
                                f('div.class.chat-image__container.tw-align-center.tw-inline-block', {},
                                    f('img.bttv.chat-image.chat-line__message--emote', {
                                        alt, src,
                                    })
                                )
                            )
                        );

                        let { element } = line;

                        alt = alt.replace(/\s+/g, '_');

                        $(`.text-fragment:not([tt-converted-emotes~="${alt}"])`, true, element).map(fragment => {
                            let container = furnish('div.chat-line__message--emote-button', { 'data-test-selector': 'emote-button', 'data-bttv-emote': alt, 'data-bttv-owner': own, 'data-bttv-owner-id': pid, innerHTML: img.innerHTML }),
                                converted = (fragment.getAttribute('tt-converted-emotes') ?? "").split(' ');

                            converted.push(alt);

                            fragment.setAttribute('data-tt-emote', alt);
                            fragment.setAttribute('tt-converted-emotes', converted.join(' ').trim());
                            fragment.innerHTML = fragment.innerHTML.replace(regexp, container.outerHTML);

                            $('[data-bttv-emote]', true, fragment)
                                .forEach(element => {
                                    let { bttvEmote } = element.dataset,
                                        tooltip = new Tooltip(element, bttvEmote);

                                    element.addEventListener('mouseup', async event => {
                                        let { currentTarget } = event,
                                            { bttvEmote, bttvOwner, bttvOwnerId } = currentTarget.dataset,
                                            { top } = getOffset(currentTarget);

                                        top -= 150;

                                        await new Search(bttvOwner)
                                            .then(({ data }) => {
                                                let [streamer] = data.filter(({ id }) => id == bttvOwnerId);

                                                if(!defined(streamer))
                                                    throw "Emote owner not found...";

                                                let { broadcaster_login, display_name, is_live } = streamer;

                                                new Card({
                                                    title: bttvEmote,
                                                    subtitle: `BetterTTV Emote (${ bttvOwner })`,
                                                    icon: {
                                                        src: BTTV_EMOTES.get(bttvEmote),
                                                        alt: bttvEmote,
                                                    },
                                                    footer: {
                                                        href: `/${ broadcaster_login }`,
                                                        name: display_name,
                                                        live: parseBool(is_live),
                                                    },
                                                    fineTuning: { top }
                                                });
                                            })
                                            .catch(error => {
                                                WARN(error);

                                                new Card({
                                                    title: bttvEmote,
                                                    subtitle: `BetterTTV Emote (${ bttvOwner })`,
                                                    icon: {
                                                        src: BTTV_EMOTES.get(bttvEmote),
                                                        alt: bttvEmote,
                                                    },
                                                    fineTuning: { top }
                                                });
                                            });
                                    });
                                });
                        });
                    }
            }
        })(GetChat());

        REMARK('Adding BTTV emote search listener...');

        EmoteSearch.onquery = async query => {
            await LOAD_BTTV_EMOTES(query).then(() => {
                let results = [...BTTV_EMOTES]
                    .filter(([key, value]) => RegExp(query.replace(/(\W)/g, '\\$1'), 'i').test(key))
                    .map(([name, src]) => CONVERT_TO_BTTV_EMOTE({ name, src }));

                    EmoteSearch.appendResults(results, 'bttv');
            });
        };

        top.BTTV_EMOTES = BTTV_EMOTES;
        top.BTTV_OWNERS = BTTV_OWNERS;
        RegisterJob('bttv_emotes');
    }

    /*** Convert Emotes
     *       _____                          _     ______                 _
     *      / ____|                        | |   |  ____|               | |
     *     | |     ___  _ ____   _____ _ __| |_  | |__   _ __ ___   ___ | |_ ___  ___
     *     | |    / _ \| '_ \ \ / / _ \ '__| __| |  __| | '_ ` _ \ / _ \| __/ _ \/ __|
     *     | |___| (_) | | | \ V /  __/ |  | |_  | |____| | | | | | (_) | ||  __/\__ \
     *      \_____\___/|_| |_|\_/ \___|_|   \__| |______|_| |_| |_|\___/ \__\___||___/
     *
     *
     */
    let OWNED_EMOTES = top.OWNED_EMOTES ?? new Map(),
        CAPTURED_EMOTES = top.CAPTURED_EMOTES ?? new Map(),
        CONVERT_TO_CAPTURED_EMOTE = (emote, makeTooltip = true) => {
            let { name, src } = emote;

            // Try to filter out Twitch-provided emotes...
            if(/^\W/.test(name))
                return;

            let emoteContainer =
            furnish('div.tt-emote-captured.tw-pd-x-05.tw-relative', {},
                furnish('div.emote-button', {},
                    furnish('div.tw-inline-flex', {},
                        furnish('button.emote-button__link.tw-align-items-center.tw-flex.tw-justify-content-center',
                            {
                                'data-test-selector': 'emote-button-clickable',
                                'aria-label': name,
                                name,
                                'data-a-target': name,

                                onclick: event => {
                                    let name = event.currentTarget.getAttribute('name'),
                                        chat = $('[data-a-target="chat-input"]');

                                    // chat.innerHTML = (chat.value += `${name} `);
                                },

                                ondragstart: event => {
                                    let { currentTarget } = event;

                                    event.dataTransfer.setData('text/plain', currentTarget.getAttribute('name').trim() + ' ');
                                    event.dataTransfer.dropEffect = 'move';
                                },
                            },

                            furnish('figure', {},
                                /*
                                <div class="emote-button__lock tw-absolute tw-border-radius-small tw-c-background-overlay tw-c-text-overlay tw-inline-flex tw-justify-content-center tw-z-above" data-test-selector="badge-button-lock">
                                    <figure class="ScFigure-sc-1j5mt50-0 laJGEQ tw-svg">
                                        <!-- badge icon -->
                                    </figure>
                                </div>
                                */
                                furnish('div.emote-button__lock.tw-absolute.tw-border-radius-small.tw-c-background-overlay.tw-c-text-overlay.tw-inline-flex.tw-justify-content-center.tw-z-above', { 'data-test-selector': 'badge-button-icon' },
                                    furnish('figure.tw-svg', { style: '-webkit-box-align:center; align-items:center; display:inline-flex;', innerHTML: Glyphs.modify('emotes', { height: '10px', width: '10px' }) })
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
    let shrt = url => url.replace(/https:\/\/static-cdn\.jtvnw\.net\/emoticons\/v1\/(\d+)\/([\d\.]+)/i, ($0, $1, $2, $$, $_) => {
            let id = parseInt($1).toString(36),
                version = $2;

            return [id, version].join('-');
        });

    Handlers.convert_emotes = () => {
        let emoteSection = $('#tt-captured-emotes');

        if(defined(emoteSection))
            return;

        let parent = $('[data-test-selector^="chat-room-component"i] .emote-picker__scroll-container > *');

        if(!defined(parent))
            return RestartJob('convert_emotes');

        // Get the streamer's emotes and make them draggable
        let streamersEmotes = $(`[class^="emote-picker"] img[alt="${ STREAMER.name }"i]`)?.closest('div')?.nextElementSibling;

        if(!defined(streamersEmotes))
            return RegisterJob('convert_emotes');

        for(let lock of $('[data-test-selector*="lock"i]', true, streamersEmotes)) {
            let emote = lock.nextElementSibling,
                { alt, src } = emote,
                parent = emote.closest('[class^="emote-picker"]').parentElement,
                container = parent.parentElement;

            container.insertBefore(CONVERT_TO_CAPTURED_EMOTE({ name: alt, src }, false), parent);

            lock.remove();
            emote.remove();
            parent.remove();
        }

        // Put all collected emotes into the emote-picker list
        let caughtEmotes = [];

        for(let [name, src] of CAPTURED_EMOTES)
            caughtEmotes.push({ name, src });

        emoteSection =
        furnish('div#tt-captured-emotes.emote-picker__content-block',
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

            furnish('div.tw-pd-b-1.tw-pd-t-05.tw-pd-x-1.tw-relative', {},
                // Emote Section Header
                furnish('div.emote-grid-section__header-title.tw-align-items-center.tw-flex.tw-pd-x-1.tw-pd-y-05', {},
                    furnish('p.tw-align-middle.tw-c-text-alt.tw-strong', {
                        innerHTML: "Captured Emotes &mdash; Drag to use"
                    })
                ),

                // Emote Section Container
                furnish('div#tt-captured-emotes-container.tw-flex.tw-flex-wrap',
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
    Timers.convert_emotes = 5_000;

    __ConvertEmotes__:
    if(parseBool(Settings.convert_emotes)) {
        // Collect emotes
        let chat_emote_button = $('[data-a-target="emote-picker-button"i]');

        if(!defined(chat_emote_button))
            break __ConvertEmotes__;

        function CollectEmotes() {
            chat_emote_button.click();

            let chat_emote_scroll = $('.emote-picker .simplebar-scroll-content');

            if(!defined(chat_emote_scroll)) {
                chat_emote_button.click();
                return setTimeout(CollectEmotes, 1000);
            }

            $('.emote-picker [class*="tab-content"]').id = 'tt-hidden-emote-container';

            setTimeout(() => {
                // Grab locked emotes every couple of seconds
                [1, 2, 4, 8, 16, 32, 64].map(n =>
                    setTimeout(() => {
                        $('.emote-button [data-test-selector*="lock"i] ~ img:not(.bttv)', true)
                            .map(img => CAPTURED_EMOTES.set(img.alt, shrt(img.src)));

                        $('.emote-button img:not(.bttv)', true)
                            .filter(img => !CAPTURED_EMOTES.has(img.alt))
                            .map(img => OWNED_EMOTES.set(img.alt, shrt(img.src)));

                        $('#tt-hidden-emote-container')?.removeAttribute('id');
                    }, 1000 * n)
                );

                chat_emote_scroll.scrollTo(0, 0);
                chat_emote_button.click();
            }, 2500);
        }

        if(defined(chat_emote_button))
            CollectEmotes();
        else
            setTimeout(CollectEmotes, 1000);

        REMARK('Adding emote event listener...');

        // Run the emote catcher on pre-populated messages
        (GetChat.onnewmessage = chat => {
            let regexp;

            for(let emote in chat.emotes)
                if(!OWNED_EMOTES.has(emote) && !CAPTURED_EMOTES.has(emote) && !BTTV_EMOTES.has(emote)) {
                    // LOG(`Adding emote "${ emote }"`);

                    CAPTURED_EMOTES.set(emote, chat.emotes[emote]);

                    let capturedEmote = CONVERT_TO_CAPTURED_EMOTE({ name: emote, src: chat.emotes[emote] });

                    if(defined(capturedEmote))
                        $('#tt-captured-emotes-container')?.appendChild?.(capturedEmote);
                }

            for(let line of chat) {
                // Replace emotes for the last 30 chat messages
                if(Queue.emotes.contains(line.uuid))
                    continue;
                if(Queue.emotes.length >= 30)
                    Queue.emotes = [];
                Queue.emotes.push(line.uuid);

                for(let [emote, url] of CAPTURED_EMOTES)
                    if((regexp = RegExp('\\b' + emote.replace(/(\W)/g, '\\$1') + '\\b', 'g')).test(line.message)) {
                        let alt = emote,
                            src = '//static-cdn.jtvnw.net/emoticons/v1/' + url.split('-').map((v, i) => i == 0? parseInt(v, 36): v).join('/'),
                            srcset;

                        if(/\/https?:\/\//i.test(src))
                            src = src.replace(/[^]*\/(https?:\/\/[^]*)(?:\/https?:\/\/)?$/i, '$1');
                        else
                            srcset = [1, 2, 4].map((v, i) => src.replace(/[\d\.]+$/, `${ (i + 1).toFixed(1) } ${ v }x`)).join(',');

                        let f = furnish;
                        let img =
                        f('div.chat-line__message--emote-button', { 'data-test-selector': 'emote-button' },
                            f('span', { 'data-a-target': 'emote-name' },
                                f('div.class.chat-image__container.tw-align-center.tw-inline-block', {},
                                    f('img.chat-image.chat-line__message--emote', {
                                        srcset, alt, src,
                                    })
                                )
                            )
                        );

                        let { element } = line;

                        alt = alt.replace(/\s+/g, '_');

                        $(`.text-fragment:not([tt-converted-emotes~="${alt}"])`, true, element).map(fragment => {
                            let container = furnish('div.chat-line__message--emote-button', { 'data-test-selector': 'emote-button', 'data-captured-emote': alt, innerHTML: img.innerHTML }),
                                converted = (fragment.getAttribute('tt-converted-emotes') ?? "").split(' ');

                            converted.push(alt);

                            fragment.setAttribute('data-tt-emote', alt);
                            fragment.setAttribute('tt-converted-emotes', converted.join(' ').trim());
                            fragment.innerHTML = fragment.innerHTML.replace(regexp, container.outerHTML);

                            $('[data-captured-emote]', true, fragment)
                                .forEach(element => {
                                    let { capturedEmote } = element.dataset;
                                });
                        });
                    }
            }
        })(GetChat());

        REMARK('Adding emote search listener...');

        EmoteSearch.onquery = query => {
            let results = [...CAPTURED_EMOTES]
                .filter(([key, value]) => RegExp(query.replace(/(\W)/g, '\\$1'), 'i').test(key))
                .map(([name, src]) => CONVERT_TO_CAPTURED_EMOTE({ name, src }));

            EmoteSearch.appendResults(results, 'captured');
        };

        top.CAPTURED_EMOTES = CAPTURED_EMOTES;
        top.OWNED_EMOTES = OWNED_EMOTES;
        RegisterJob('convert_emotes');
    }

    /*** Filter Messages
     *      ______ _ _ _              __  __
     *     |  ____(_) | |            |  \/  |
     *     | |__   _| | |_ ___ _ __  | \  / | ___  ___ ___  __ _  __ _  ___  ___
     *     |  __| | | | __/ _ \ '__| | |\/| |/ _ \/ __/ __|/ _` |/ _` |/ _ \/ __|
     *     | |    | | | ||  __/ |    | |  | |  __/\__ \__ \ (_| | (_| |  __/\__ \
     *     |_|    |_|_|\__\___|_|    |_|  |_|\___||___/___/\__,_|\__, |\___||___/
     *                                                            __/ |
     *                                                           |___/
     */
    let UPDATED_FILTER = () => {
        let rules = Settings.filter_rules;

        let channel = [], user = [], badge = [], emote = [], text = [];

        if(defined(rules?.length)) {
            rules = rules.split(/\s*,\s*/).map(rule => rule.trim()).filter(rule => rule.length);

            for(let rule of rules)
                // /channel text
                if(/^\/[\w\-]+/.test(rule)) {
                    let { $_ } = RegExp;

                    let name, text, user, badge, emote;

                    $_.replace(/^\/([\w\-]+) +([<:]([^>]+?)[:>]|(@)?[^]*?)$/, ($0, $1, $2, $3, $4, $$, $_) => {
                        name = $1;

                        if($4 ?? false)
                            user = $2;
                        else if($3 ?? false)
                            if($2[0] == ':')
                                emote = $3;
                            else
                                badge = $3;
                        else
                            text = $2;
                    });

                    channel.push({ name, text, user, badge, emote });
                }
                // @username
                else if(/^@[\w\-]+$/.test(rule)) {
                    let { $_ } = RegExp;

                    user.push($_.replace(/^@/, ''));
                }
                // <badge>
                else if(/^<[\w\- ]+>$/.test(rule)) {
                    let { $_ } = RegExp;

                    badge.push($_.replace(/^<|>$/g, ''));
                }
                // :emote:
                else if(/^:[\w\- ]+:$/.test(rule)) {
                    let { $_ } = RegExp;

                    emote.push($_.replace(/^:|:$/g, ''));
                }
                // text
                else if(rule) {
                    let $_ = rule;

                    text.push(/^[\w\s]+$/.test($_)? `\\b${ $_.trim() }\\b`: $_);
                }
        }

        return {
            text: (text.length? RegExp(`(${ text.join('|') })`, 'i'): /^[\b]$/),
            user: (user.length? RegExp(`(${ user.join('|') })`, 'i'): /^[\b]$/),
            emote: (emote.length? RegExp(`(${ emote.join('|') })`, 'i'): /^[\b]$/),
            badge: (badge.length? RegExp(`(${ badge.join('|') })`, 'i'): /^[\b]$/),
            channel
        }
    };

    let MESSAGE_FILTER;

    Handlers.filter_messages = () => {
        REMARK('Adding message filter event listener...');

        MESSAGE_FILTER ??= GetChat.onnewmessage = chat => {
            let Filter = UPDATED_FILTER();

            censoring:
            for(let line of chat) {
                let { message, mentions, author, badges, emotes, element } = line,
                    reason;

                let censor = parseBool(false
                    // Filter users on all channels
                    || (Filter.user.test(author)? reason = 'user': false)
                    // Filter badges on all channels
                    || (Filter.badge.test(badges)? reason = 'badge': false)
                    // Filter emotes on all channels
                    || (Filter.emote.test(emotes)? reason = 'emote': false)
                    // Filter messges (RegExp) on all channels
                    || (Filter.text.test(message)? reason = 'text': false)
                    // Filter messages/users on specific a channel
                    || Filter.channel.map(({ name, text, user, badge, emote }) => {
                        if(!defined(STREAMER))
                            return;

                        let channel = STREAMER.name?.toLowerCase();

                        return parseBool(false
                            || channel == name.toLowerCase()
                        ) && parseBool(false
                            || (('@' + author) == user? reason = 'channel user': false)
                            || (!!~badges.findIndex(medal => !!~medal.indexOf(badge) && medal.length && badge.length)? reason = 'channel badge': false)
                            || (!!~emotes.findIndex(glyph => !!~glyph.indexOf(emote) && glyph.length && emote.length)? reason = 'channel emote': false)
                            || (text?.test?.(message)? reason = 'channel text': false)
                        )
                    }).contains(true)
                );

                if(!censor)
                    continue censoring;

                LOG(`Censoring message because the ${ reason } matches`, line);

                let hidden = element.getAttribute('tt-hidden') === 'true';

                if(hidden || mentions.contains(USERNAME))
                    return;

                element.setAttribute('tt-hidden', true);
            }
        };

        if(defined(MESSAGE_FILTER))
            MESSAGE_FILTER(GetChat(250, true));
    };
    Timers.filter_messages = -2500;

    Unhandlers.filter_messages = () => {
        let hidden = $('[tt-hidden]', true);

        hidden.map(element => element.removeAttribute('tt-hidden'));
    };

    __FilterMessages__:
    if(parseBool(Settings.filter_messages)) {
        RegisterJob('filter_messages');
    }

    /*** Easy Filter - NOT A SETTING. This is a helper for "Message Filter"
     *      ______                  ______ _ _ _
     *     |  ____|                |  ____(_) | |
     *     | |__   __ _ ___ _   _  | |__   _| | |_ ___ _ __
     *     |  __| / _` / __| | | | |  __| | | | __/ _ \ '__|
     *     | |___| (_| \__ \ |_| | | |    | | | ||  __/ |
     *     |______\__,_|___/\__, | |_|    |_|_|\__\___|_|
     *                       __/ |
     *                      |___/
     */
    Handlers.easy_filter = () => {
        let card = $('[data-a-target="viewer-card"i], [data-a-target="emote-card"i]'),
            existing = $('#tt-filter-rule-user, #tt-filter-rule-emote');

        if(!defined(card) || defined(existing))
            return;

        let title = $('h4', false, card),
            name = title.textContent.toLowerCase(),
            type = (card.getAttribute('data-a-target').toLowerCase() == 'viewer-card'? 'user': 'emote'),
            { filter_rules } = Settings;

        if(type == 'user') {
            /* Filter users */
            if(filter_rules && filter_rules.split(',').contains(`@${ name }`))
                return /* Already filtering messages from this person */;

            let filter = furnish('div#tt-filter-rule-user', {
                title: `Filter all messages from @${ name }`,
                style: 'cursor:pointer; fill:var(--color-red); font-size:1.1rem; font-weight:normal',
                username: name,

                onclick: event => {
                    let { currentTarget } = event,
                        username = currentTarget.getAttribute('username'),
                        { filter_rules } = Settings;

                    filter_rules = (filter_rules || '').split(',');
                    filter_rules.push(`@${ username }`);
                    filter_rules = filter_rules.join(',');

                    currentTarget.remove();

                    Storage.set({ filter_rules });
                },

                innerHTML: `${ Glyphs.trash } Filter messages from @${ name }`,
            });

            let svg = $('svg', false, filter);

            svg.setAttribute('style', 'vertical-align:bottom; height:20px; width:20px');

            title.appendChild(filter);
        } else if(type == 'emote') {
            /* Filter emotes */
            if(filter_rules && filter_rules.split(',').contains(`:${ name }:`))
                return /* Already filtering this emote */;

            let filter = furnish('div#tt-filter-rule-emote', {
                title: 'Filter this emote',
                style: 'cursor:pointer; fill:var(--color-red); font-size:1.1rem; font-weight:normal',
                emote: `:${ name }:`,

                onclick: event => {
                    let { currentTarget } = event,
                        emote = currentTarget.getAttribute('emote'),
                        { filter_rules } = Settings;

                    filter_rules = (filter_rules || '').split(',');
                    filter_rules.push(emote);
                    filter_rules = filter_rules.join(',');

                    currentTarget.remove();

                    Storage.set({ filter_rules });
                },

                innerHTML: `${ Glyphs.trash } Filter this emote`,
            });

            let svg = $('svg', false, filter);

            svg.setAttribute('style', 'vertical-align:bottom; height:20px; width:20px');

            title.appendChild(filter);
        }
    };
    Timers.easy_filter = 500;

    __EasyFilter__:
    if(parseBool(Settings.filter_messages)) {
        RegisterJob('easy_filter');
    }

    /*** Message Highlighter
     *      __  __                                  _    _ _       _     _ _       _     _
     *     |  \/  |                                | |  | (_)     | |   | (_)     | |   | |
     *     | \  / | ___  ___ ___  __ _  __ _  ___  | |__| |_  __ _| |__ | |_  __ _| |__ | |_ ___ _ __
     *     | |\/| |/ _ \/ __/ __|/ _` |/ _` |/ _ \ |  __  | |/ _` | '_ \| | |/ _` | '_ \| __/ _ \ '__|
     *     | |  | |  __/\__ \__ \ (_| | (_| |  __/ | |  | | | (_| | | | | | | (_| | | | | ||  __/ |
     *     |_|  |_|\___||___/___/\__,_|\__, |\___| |_|  |_|_|\__, |_| |_|_|_|\__, |_| |_|\__\___|_|
     *                                  __/ |                 __/ |           __/ |
     *                                 |___/                 |___/           |___/
     */
    Handlers.highlight_mentions = () => {
        let usernames = [USERNAME];

        if(parseBool(Settings.highlight_mentions_extra))
            usernames.push('all', 'chat', 'everyone');

        let chat = GetChat().filter(line => !!~line.mentions.findIndex(username => RegExp(`^(${usernames.join('|')})$`, 'i').test(username)));

        for(let line of chat)
            if(!Queue.messages.contains(line.uuid)) {
                Queue.messages.push(line.uuid);

                let { author, message, reply } = line;

                // LOG('Highlighting message:', { author, message });

                line.element.setAttribute('style', 'background-color: var(--color-background-button-primary-active)');
            }
    };
    Timers.highlight_mentions = 500;

    __HighlightMentions__:
    if(parseBool(Settings.highlight_mentions)) {
        RegisterJob('highlight_mentions');
    }

    /*** Message Highlighter - Popup
     *      __  __                                  _    _ _       _     _ _       _     _                       _____
     *     |  \/  |                                | |  | (_)     | |   | (_)     | |   | |                     |  __ \
     *     | \  / | ___  ___ ___  __ _  __ _  ___  | |__| |_  __ _| |__ | |_  __ _| |__ | |_ ___ _ __   ______  | |__) |__  _ __  _   _ _ __
     *     | |\/| |/ _ \/ __/ __|/ _` |/ _` |/ _ \ |  __  | |/ _` | '_ \| | |/ _` | '_ \| __/ _ \ '__| |______| |  ___/ _ \| '_ \| | | | '_ \
     *     | |  | |  __/\__ \__ \ (_| | (_| |  __/ | |  | | | (_| | | | | | | (_| | | | | ||  __/ |             | |  | (_) | |_) | |_| | |_) |
     *     |_|  |_|\___||___/___/\__,_|\__, |\___| |_|  |_|_|\__, |_| |_|_|_|\__, |_| |_|\__\___|_|             |_|   \___/| .__/ \__,_| .__/
     *                                  __/ |                 __/ |           __/ |                                        | |         | |
     *                                 |___/                 |___/           |___/                                         |_|         |_|
     */
    Handlers.highlight_mentions_popup = () => {
        let chat = GetChat().filter(line => !!~line.mentions.findIndex(username => RegExp(`^${USERNAME}$`, 'i').test(username)));

        for(let line of chat)
            if(!Queue.message_popups.contains(line.uuid)) {
                Queue.message_popups.push(line.uuid);

                let { author, message, reply } = line;

                let existing = $('#tt-chat-footer');

                if(defined(existing))
                    continue;

                // LOG('Generating footer:', { author, message });

                new ChatFooter(`@${ author } mentioned you.`, {
                    onclick: event => {
                        let chatbox = $('.chat-input__textarea textarea'),
                            existing = $('#tt-chat-footer');

                        if(defined(chatbox))
                            chatbox.focus();
                        if(defined(existing))
                            existing.remove();

                        reply?.click();
                    },
                });
            }
    };
    Timers.highlight_mentions_popup = 500;

    __HighlightMentionsPopup__:
    if(parseBool(Settings.highlight_mentions_popup)) {
        RegisterJob('highlight_mentions_popup');
    }

    /*** Native Twitch Reply
     *      _   _       _   _             _______       _ _       _       _____            _
     *     | \ | |     | | (_)           |__   __|     (_) |     | |     |  __ \          | |
     *     |  \| | __ _| |_ ___   _____     | |_      ___| |_ ___| |__   | |__) |___ _ __ | |_   _
     *     | . ` |/ _` | __| \ \ / / _ \    | \ \ /\ / / | __/ __| '_ \  |  _  // _ \ '_ \| | | | |
     *     | |\  | (_| | |_| |\ V /  __/    | |\ V  V /| | || (__| | | | | | \ \  __/ |_) | | |_| |
     *     |_| \_|\__,_|\__|_| \_/ \___|    |_| \_/\_/ |_|\__\___|_| |_| |_|  \_\___| .__/|_|\__, |
     *                                                                              | |       __/ |
     *                                                                              |_|      |___/
     */
    let NATIVE_REPLY_POLYFILL;

    Handlers.native_twitch_reply = () => {
        if(defined(NATIVE_REPLY_POLYFILL) || defined($('.chat-line__reply-icon')))
            return;

        if(!defined(GLOBAL_EVENT_LISTENERS.ENTER))
            $('[data-a-target="chat-input"i]')?.addEventListener('keydown', GLOBAL_EVENT_LISTENERS.ENTER = ({ key, altKey, ctrlKey, metaKey, shiftKey }) => {
                if(!(altKey || ctrlKey || metaKey || shiftKey) && key == 'Enter')
                    $('#tt-close-native-twitch-reply')?.click();
            });

        NATIVE_REPLY_POLYFILL ??= {
            // Button above chat elements
            NewReplyButton: ({ uuid, style, handle, message, mentions, }) => {
                let f = furnish;

                let addedClasses = {
                    bubbleContainer: ['chat-input-tray__open','tw-block','tw-border-b','tw-border-l','tw-border-r','tw-border-radius-large','tw-border-t','tw-c-background-base','tw-elevation-1','tw-left-0','tw-pd-05','tw-right-0','tw-z-below'],
                    chatContainer: ['chat-input-container__open','tw-block','tw-border-bottom-left-radius-large','tw-border-bottom-right-radius-large','tw-c-background-base','tw-pd-05'],
                    chatContainerChild: ['chat-input-container__input-wrapper'],
                },
                removedClasses = {
                    bubbleContainer: ['tw-block','tw-border-radius-large','tw-elevation-0','tw-left-0','tw-pd-0','tw-right-0','tw-z-below'],
                    chatContainer: ['tw-block','tw-border-radius-large','tw-pd-0'],
                };

                return f('div.chat-line__reply-icon.tw-absolute.tw-border-radius-medium.tw-c-background-base.tw-elevation-1', {},
                    f('button.tw-align-items-center.tw-align-middle.tw-border-bottom-left-radius-medium.tw-border-bottom-right-radius-medium.tw-border-top-left-radius-medium.tw-border-top-right-radius-medium.tw-button-icon.tw-core-button.tw-inline-flex.tw-interactive.tw-justify-content-center.tw-overflow-hidden.tw-relative',
                        {
                            'data-test-selector': 'chat-reply-button',

                            onclick: event => {
                                let { currentTarget } = event,
                                    messageElement = currentTarget.closest('div').previousElementSibling,
                                    chatInput = $('[data-a-target="chat-input"i]'),
                                    [bubbleContainer, chatContainer] = $('.chat-input > :last-child > :first-child > :not(:first-child)', true),
                                    chatContainerChild = $('div', false, chatContainer);

                                let f = furnish;

                                AddNativeReplyBubble: {
                                    bubbleContainer.classList.remove(...removedClasses.bubbleContainer);
                                    bubbleContainer.classList.add(...addedClasses.bubbleContainer);
                                    chatContainer.classList.remove(...removedClasses.chatContainer);
                                    chatContainer.classList.add(...addedClasses.chatContainer);
                                    chatContainerChild.classList.add(...addedClasses.chatContainerChild);

                                    bubbleContainer.appendChild(
                                        f(`div#tt-native-twitch-reply.tw-align-items-start.tw-flex.tw-flex-row.tw-pd-0`,
                                            {
                                                'data-test-selector': 'chat-input-tray',
                                            },

                                            f('div.tw-align-center.tw-mg-05', {},
                                                f('div.tw-align-items-center.tw-flex', { innerHTML: Glyphs.modify('reply', { height: '24px', width: '24px' }) })
                                            ),
                                            f('div.tw-flex-grow-1.tw-pd-l-05.tw-pd-y-05', {},
                                                f('span.tw-c-text-alt.tw-font-size-5.tw-strong.tw-word-break-word', {
                                                    'connected-to': uuid,

                                                    handle, message, mentions,

                                                    innerHTML: `Replying to <span style="${ style }">@${handle}</span>`,
                                                })
                                            ),
                                            f('div.tw-right-0.tw-top-0', {},
                                                f('button#tt-close-native-twitch-reply.tw-align-items-center.tw-align-middle.tw-border-bottom-left-radius-medium.tw-border-bottom-right-radius-medium.tw-border-top-left-radius-medium.tw-border-top-right-radius-medium.tw-button-icon.tw-core-button.tw-inline-flex.tw-interactive.tw-justify-content-center.tw-overflow-hidden.tw-relative',
                                                    {
                                                        onclick: event => {
                                                            let chatInput = $('[data-a-target="chat-input"i]'),
                                                                [bubbleContainer, chatContainer] = $('.chat-input > :last-child > :first-child > :not(:first-child)', true),
                                                                chatContainerChild = $('div', false, chatContainer);

                                                            RemoveNativeReplyBubble: {
                                                                bubbleContainer.classList.remove(...addedClasses.bubbleContainer);
                                                                bubbleContainer.classList.add(...removedClasses.bubbleContainer);
                                                                chatContainer.classList.remove(...addedClasses.chatContainer);
                                                                chatContainer.classList.add(...removedClasses.chatContainer);
                                                                chatContainerChild.classList.remove(...addedClasses.chatContainerChild);

                                                                $('[id^="tt-native-twitch-reply"i]', true).forEach(element => element.remove());

                                                                chatInput.setAttribute('placeholder', 'Send a message');
                                                            }
                                                        },

                                                        innerHTML: Glyphs.modify('x', { height: '24px', width: '24px' }),
                                                    },
                                                )
                                            )
                                        )
                                    );

                                    bubbleContainer.appendChild(
                                        f('div#tt-native-twitch-reply-message.font-scale--default.tw-pd-x-1.tw-pd-y-05.chat-line__message',
                                            {
                                                'data-a-target': 'chat-line-message',
                                                'data-test-selector': 'chat-line-message',
                                            },
                                            f('div.tw-relative', { innerHTML: messageElement.outerHTML })
                                        )
                                    );

                                    chatInput.setAttribute('placeholder', 'Send a reply');
                                }

                                chatInput.focus();
                            },
                        },
                        f('span.tw-button-icon__icon', {},
                            f('div',
                                { style: 'width: 2rem; height: 2rem;' },
                                f('div.tw-icon', {},
                                    f('div.tw-aspect', { innerHTML: Glyphs.reply })
                                )
                            )
                        )
                    )
                );
            },

            // Highlighter for chat elements
            AddNativeReplyButton: ({ uuid, style, handle, message, mentions, element }) => {
                if(!defined(element))
                    return;

                if(defined($('.chat-line__message-container', false, element)))
                    return;

                if(handle == USERNAME)
                    return;

                let parent = $('div', false, element);
                if(!defined(parent)) return;

                let target = $('div', false, parent);
                if(!defined(target)) return;

                let highlighter = furnish('div.chat-line__message-highlight.tw-absolute.tw-border-radius-medium', { 'data-test-selector': 'chat-message-highlight' });

                target.classList.add('chat-line__message-container');

                parent.insertBefore(highlighter, parent.firstElementChild);
                parent.appendChild(NATIVE_REPLY_POLYFILL.NewReplyButton({ uuid, style, handle, message, mentions, }));
            },
        };

        REMARK('Adding native reply buttons...');

        GetChat().forEach(NATIVE_REPLY_POLYFILL.AddNativeReplyButton);

        GetChat.onnewmessage = chat => chat.map(NATIVE_REPLY_POLYFILL.AddNativeReplyButton);
    };
    Timers.native_twitch_reply = 1000;

    __NativeTwitchReply__:
    if(parseBool(Settings.native_twitch_reply)) {
        RegisterJob('native_twitch_reply');
    }

    /*** Prevent spam
     *      _____                          _      _____
     *     |  __ \                        | |    / ____|
     *     | |__) | __ _____   _____ _ __ | |_  | (___  _ __   __ _ _ __ ___
     *     |  ___/ '__/ _ \ \ / / _ \ '_ \| __|  \___ \| '_ \ / _` | '_ ` _ \
     *     | |   | | |  __/\ V /  __/ | | | |_   ____) | |_) | (_| | | | | | |
     *     |_|   |_|  \___| \_/ \___|_| |_|\__| |_____/| .__/ \__,_|_| |_| |_|
     *                                                 | |
     *                                                 |_|
     */
    let SPAM = [];

    Handlers.prevent_spam = () => {
        REMARK("Adding spam event listener...");

        GetChat.onnewmessage = chat =>
            chat.forEach(async line => {
                let lookBack = parseInt(Settings.prevent_spam_look_back ?? 15),
                    minLen = parseInt(Settings.prevent_spam_minimum_length ?? 5),
                    minOcc = parseInt(Settings.prevent_spam_ignore_under ?? 3);

                let { handle, element, message } = line;

                let spam_placeholder = "chat-deleted-message-placeholder";

                function markAsSpam(element, type = 'spam', message) {
                    let span = furnish(`span.chat-line__message--deleted-notice.tiwtch-tools__spam-filter-${ type }`, { 'data-a-target': spam_placeholder, 'data-test-selector': spam_placeholder }, `message marked as ${ type }.`);

                    $('[data-test-selector="chat-message-separator"i] ~ *', true, element).forEach(sibling => sibling.remove());
                    $('[data-test-selector="chat-message-separator"i]', false, element).parentElement.appendChild(span);

                    element.setAttribute(type, message);

                    let tooltip = new Tooltip(element, message, { direction: 'up' });

                    // Re-make the tooltip if the tooltip is too long to display correctly
                    // if(getOffset(tooltip).width > getOffset(element).width)
                    if(message.length > 60) {
                        tooltip.closest('[class]:not([aria-describedby])')?.remove();

                        new Tooltip(element, message, { direction: 'up', style: `width:fit-content; height:auto; white-space:break-spaces;` });
                    }
                }

                function spamChecker(message) {
                    if(message.length < 1)
                        return "";

                    // The same message is already posted (within X lines)
                    if( defined([...SPAM].slice(-lookBack).find(text => text == message)) )
                        markAsSpam(element, 'plagiarism', message);

                    // The message contains repetitive (more than X instances) words/phrases
                    else if(RegExp(`(\\w{${ minLen },})${ "((?:.+)?\\b\\1)".repeat(minOcc) }`, 'i').test(message))
                        markAsSpam(element, 'repetitive', message);

                    return message;
                }

                // If not run asynchrounously, `SPAM = ...` somehow runs before `spamChecker` and causes all messages to be marked as plagiarism
                new Promise(resolve => {
                    resolve(spamChecker(message.trim()));
                }).then(message => {
                    SPAM = [...new Set([...SPAM, message])];
                });
            });
    };
    Timers.prevent_spam = -1000;

    __PreventSpam__:
    if(parseBool(Settings.prevent_spam)) {
        RegisterJob('prevent_spam');
    }

    /*** Currencies
     *       _____                               _
     *      / ____|                             (_)
     *     | |    _   _ _ __ _ __ ___ _ __   ___ _  ___  ___
     *     | |   | | | | '__| '__/ _ \ '_ \ / __| |/ _ \/ __|
     *     | |___| |_| | |  | | |  __/ | | | (__| |  __/\__ \
     *      \_____\__,_|_|  |_|  \___|_| |_|\___|_|\___||___/
     *
     *
     */
    /*** Convert Bits
     *       _____                          _     ____  _ _
     *      / ____|                        | |   |  _ \(_) |
     *     | |     ___  _ ____   _____ _ __| |_  | |_) |_| |_ ___
     *     | |    / _ \| '_ \ \ / / _ \ '__| __| |  _ <| | __/ __|
     *     | |___| (_) | | | \ V /  __/ |  | |_  | |_) | | |_\__ \
     *      \_____\___/|_| |_|\_/ \___|_|   \__| |____/|_|\__|___/
     *
     *
     */
    Handlers.convert_bits = () => {
        let dropdown = $('[class*="bits-buy"i]'),
            bits_counter = $('[class*="bits-count"]:not([tt-true-usd-amount])', true),
            bits_cheer = $('[class*="cheer-amount"i]:not([tt-true-usd-amount])', true),
            hype_trains = $('[class*="community-highlight-stack"i] p:not([tt-true-usd-amount])', true);

        let bits_num_regexp = /([\d,]+)(?: +bits)?/i,
            bits_alp_regexp = /([\d,]+) +bits/i;

        if(defined(dropdown))
            $('h5:not([tt-true-usd-amount])', true, dropdown).map(header => {
                let bits = parseInt(header.textContent.replace(/\D+/g, '')),
                    usd;

                usd = (bits * .01).toFixed(2);

                header.textContent += ` ($${ comify(usd) })`;

                header.setAttribute('tt-true-usd-amount', usd);
            });

        for(let counter of bits_counter) {
            let { innerHTML } = counter;

            if(bits_alp_regexp.test(innerHTML))
                counter.innerHTML = innerHTML.replace(bits_alp_regexp, ($0, $1, $$, $_) => {
                    let bits = parseInt($1.replace(/\D+/g, '')),
                        usd;

                    usd = (bits * .01).toFixed(2);

                    counter.setAttribute('tt-true-usd-amount', usd);

                    return `${ $0 } ($${ comify(usd) })`;
                });
        }

        for(let cheer of bits_cheer) {
            let { innerHTML } = cheer;

            if(bits_num_regexp.test(innerHTML))
                cheer.innerHTML = innerHTML.replace(bits_num_regexp, ($0, $1, $$, $_) => {
                    let bits = parseInt($1.replace(/\D+/g, '')),
                        usd;

                    usd = (bits * .01).toFixed(2);

                    cheer.setAttribute('tt-true-usd-amount', usd);

                    return `${ $0 } ($${ comify(usd) })`;
                });
        }

        for(let train of hype_trains) {
            let { innerHTML } = train;

            if(bits_alp_regexp.test(innerHTML))
                train.innerHTML = innerHTML.replace(bits_alp_regexp, ($0, $1, $$, $_) => {
                    let bits = parseInt($1.replace(/\D+/g, '')),
                        usd;

                    usd = (bits * .01).toFixed(2);

                    train.setAttribute('tt-true-usd-amount', usd);

                    return `${ $0 } ($${ comify(usd) })`;
                });
        }
    };
    Timers.convert_bits = 1000;

    __ConvertBits__:
    if(parseBool(Settings.convert_bits)) {
        RegisterJob('convert_bits');
    }

    /*** Rewards Calculator
     *      _____                            _        _____      _            _       _
     *     |  __ \                          | |      / ____|    | |          | |     | |
     *     | |__) |_____      ____ _ _ __ __| |___  | |     __ _| | ___ _   _| | __ _| |_ ___  _ __
     *     |  _  // _ \ \ /\ / / _` | '__/ _` / __| | |    / _` | |/ __| | | | |/ _` | __/ _ \| '__|
     *     | | \ \  __/\ V  V / (_| | | | (_| \__ \ | |___| (_| | | (__| |_| | | (_| | || (_) | |
     *     |_|  \_\___| \_/\_/ \__,_|_|  \__,_|___/  \_____\__,_|_|\___|\__,_|_|\__,_|\__\___/|_|
     *
     *
     */
    let CHANNEL_POINTS_MULTIPLIER,
        REWARDS_CALCULATOR_TOOLTIP;

    Handlers.rewards_calculator = () => {
        __GetMultiplierAmount__:
        if(!defined(CHANNEL_POINTS_MULTIPLIER)) {
            let button = $('[data-test-selector="community-points-summary"i] button');

            if(defined(button)) {
                button.click();

                CHANNEL_POINTS_MULTIPLIER = parseFloat($('#channel-points-reward-center-header h6')?.innerText) || 1;

                button.click();
            } else {
                CHANNEL_POINTS_MULTIPLIER = 1;
            }
        }

        let have = parseInt(parseCoin($('[data-test-selector="balance-string"i]')?.innerText) | 0),
            goal = parseInt($('[data-test-selector="RequiredPoints"]')?.previousSibling?.textContent?.replace(/\D+/g, '') ?? 0),
            need = goal - have;

        let container = $('[data-test-selector="RequiredPoints"i]:not(:empty)')?.parentElement;

        if(!defined(container))
            return REWARDS_CALCULATOR_TOOLTIP = null;

        let averageBroadcastTime = STREAMER.data?.dailyBroadcastTime ?? 4.5, // https://theemergence.co.uk/when-is-the-best-time-to-stream-on-twitch/#faq-question-1565821275069
            activeDaysPerWeek = STREAMER.data?.activeDaysPerWeek ?? 5,
            pointsEarnedPerHour = 120 + (200 * +Settings.auto_claim_bonuses); // https://help.twitch.tv/s/article/channel-points-guide

        let timeLeftInBroadcast = averageBroadcastTime - (STREAMER.time / 3_600_000);

        let tooltip = REWARDS_CALCULATOR_TOOLTIP ??= new Tooltip(container);

        let { ceil, floor, round } = Math;

        let hours = (need / (pointsEarnedPerHour * CHANNEL_POINTS_MULTIPLIER)),
            days = (hours / 24) * (24 / averageBroadcastTime),
            weeks = (days / 7) * (7 / (activeDaysPerWeek || (averageBroadcastTime / 24))),
                // ... OR fraction of active day
            months = weeks / 4,
            years = months / 12;

        let streams = ceil(hours / averageBroadcastTime),
            estimated = 'minute',
            timeEstimated = 60 * (ceil(hours * 4) / 4);

        if(hours > 1) {
            estimated = 'hour';
            timeEstimated = hours;
        } if(hours > 48) {
            estimated = 'day';
            timeEstimated = days;
        } if(days > 10) {
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

        tooltip.innerHTML =
            `Available ${ (streams < 1 || hours < timeLeftInBroadcast)? 'during this': `in ${ comify(streams) } more` } ${ "stream" + ["","s"][+(streams > 1)] } (${ comify(timeEstimated) } ${ estimated.pluralSuffix(timeEstimated) })`;
    };
    Timers.rewards_calculator = 100;

    __RewardsCalculator__:
    if(parseBool(Settings.rewards_calculator)) {
        RegisterJob('rewards_calculator');
    }

    /*** Customization
     *       _____          _                  _          _   _
     *      / ____|        | |                (_)        | | (_)
     *     | |    _   _ ___| |_ ___  _ __ ___  _ ______ _| |_ _  ___  _ __
     *     | |   | | | / __| __/ _ \| '_ ` _ \| |_  / _` | __| |/ _ \| '_ \
     *     | |___| |_| \__ \ || (_) | | | | | | |/ / (_| | |_| | (_) | | | |
     *      \_____\__,_|___/\__\___/|_| |_| |_|_/___\__,_|\__|_|\___/|_| |_|
     *
     *
     */
    /*** Points Receipt (Helper) - NOT A SETTING. This is a hlper for "Points Receipt (Placement)"
     *      _____      _       _         _____               _       _      ___    _      _               __
     *     |  __ \    (_)     | |       |  __ \             (_)     | |    / / |  | |    | |              \ \
     *     | |__) |__  _ _ __ | |_ ___  | |__) |___  ___ ___ _ _ __ | |_  | || |__| | ___| |_ __   ___ _ __| |
     *     |  ___/ _ \| | '_ \| __/ __| |  _  // _ \/ __/ _ \ | '_ \| __| | ||  __  |/ _ \ | '_ \ / _ \ '__| |
     *     | |  | (_) | | | | | |_\__ \ | | \ \  __/ (_|  __/ | |_) | |_  | || |  | |  __/ | |_) |  __/ |  | |
     *     |_|   \___/|_|_| |_|\__|___/ |_|  \_\___|\___\___|_| .__/ \__| | ||_|  |_|\___|_| .__/ \___|_|  | |
     *                                                        | |          \_\             | |            /_/
     *                                                        |_|                          |_|
     */
    Handlers.points_receipt_placement_framed_helper = () => {
        let placement,
            framed = (top != window);

        if(!framed || (placement = Settings.points_receipt_placement ??= "null") == "null")
            return;

        let coin = $('[data-test-selector="balance-string"i]')?.closest('button')?.querySelector('img[alt]');

        let balance = $('[data-test-selector="balance-string"i]')?.innerText,
            exact_debt = $('[data-test-selector^="prediction-checkout"i], [data-test-selector*="user-prediction"i][data-test-selector*="points"i], [data-test-selector*="user-prediction"i] p')?.innerText,
            exact_change = $('[class*="community-points-summary"i][class*="points-add-text"i]')?.innerText;

        top.postMessage({ points_receipt_placement: { balance, coin_face: coin?.src, coin_name: coin?.alt, exact_debt, exact_change } }, top.location.origin);
    };
    Timers.points_receipt_placement_framed_helper = 1000;

    __PointsReceiptPlacement__:
    if(parseBool(Settings.points_receipt_placement)) {
        RegisterJob('points_receipt_placement_framed_helper');
    }

    /*** Video Recovery
     *     __      ___     _              _____
     *     \ \    / (_)   | |            |  __ \
     *      \ \  / / _  __| | ___  ___   | |__) |___  ___ _____   _____ _ __ _   _
     *       \ \/ / | |/ _` |/ _ \/ _ \  |  _  // _ \/ __/ _ \ \ / / _ \ '__| | | |
     *        \  /  | | (_| |  __/ (_) | | | \ \  __/ (_| (_) \ V /  __/ |  | |_| |
     *         \/   |_|\__,_|\___|\___/  |_|  \_\___|\___\___/ \_/ \___|_|   \__, |
     *                                                                        __/ |
     *                                                                       |___/
     */
    /*** Recover Chat
     *      _____                                 _____ _           _
     *     |  __ \                               / ____| |         | |
     *     | |__) |___  ___ _____   _____ _ __  | |    | |__   __ _| |_
     *     |  _  // _ \/ __/ _ \ \ / / _ \ '__| | |    | '_ \ / _` | __|
     *     | | \ \  __/ (_| (_) \ V /  __/ |    | |____| | | | (_| | |_
     *     |_|  \_\___|\___\___/ \_/ \___|_|     \_____|_| |_|\__,_|\__|
     *
     *
     */
    Handlers.recover_chat = () => {
        let [chat] = $('[role="log"i], [role="tt-log"i], [data-test-selector="banned-user-message"i], [data-test-selector^="video-chat"]', true);

        if(defined(chat))
            return;

        // Add an iframe...
        let { name } = STREAMER,
            input = $('.chat-input'),
            iframe = furnish(`iframe.tw-c-text-base.tw-flex.tw-flex-column.tw-flex-grow-1.tw-flex-nowrap.tw-full-height.tw-relative[src="/popout/${name}/chat"][role="tt-log"]`),
            container = (input?.closest('section') ?? $('.chat-shell .stream-chat', false, top.document));

        container.replaceChild(iframe, container.firstChild);
    };
    Timers.recover_chat = 500;

    __RecoverChat__:
    if(parseBool(Settings.recover_chat)) {
        RegisterJob('recover_chat');
    }

    // End of Chat__Initialize
};
// End of Chat__Initialize

let Chat__CUSTOM_CSS,
    Chat__PAGE_CHECKER,
    Chat__WAIT_FOR_PAGE;

Chat__PAGE_CHECKER = setInterval(Chat__WAIT_FOR_PAGE = async() => {
    let ready = (true
        // The main controller is ready
        && parseBool(top.MAIN_CONTROLLER_READY)
        // The welcome message exists
        && defined($(`[data-a-target*="welcome"]`))
        && (false
            // There is a message container
            || defined($('[data-test-selector$="message-container"i]'))
        )
        // There is an error message
        || defined($('[data-a-target="core-error-message"i]'))
    );

    if(ready) {
        LOG('Child container ready');

        Settings = await GetSettings();

        setTimeout(Chat__Initialize, 5000);
        clearInterval(Chat__PAGE_CHECKER);

        // Observe location changes
        LocationObserver: {
            let { body } = document,
                observer = new MutationObserver(mutations => {
                    mutations.map(mutation => {
                        if(PATHNAME !== top.location.pathname) {
                            let OLD_HREF = PATHNAME;

                            PATHNAME = top.location.pathname;

                            for(let [name, func] of __ONLOCATIONCHANGE__)
                                func(new CustomEvent('locationchange', { detail: { from: OLD_HREF, to: PATHNAME }}));
                        }
                    });
                });

            observer.observe(body, { childList: true, subtree: true });
        }

        // Observe chat changes
        ChatObserver: {
            let chat = $('[data-test-selector$="message-container"i]'),
                observer = new MutationObserver(mutations => {
                    let emotes = {},
                        results = [];

                    mutations = mutations.filter(({ type }) => type == 'childList');

                    MutationToNode:
                    for(let mutation of mutations) {
                        let { addedNodes } = mutation;

                        NodeToObject:
                        for(let line of addedNodes) {
                            let keepEmotes = true;

                            let handle = $('.chat-line__username', true, line).map(element => element.innerText).toString()
                                author = handle.toLowerCase(),
                                message = $('[data-test-selector="chat-message-separator"i] ~ *', true, line),
                                mentions = $('.mention-fragment', true, line).map(element => element.innerText.replace('@', '').toLowerCase()).filter(text => /^[a-z_]\w+$/i.test(text)),
                                badges = $('.chat-badge', true, line).map(img => img.alt.toLowerCase()),
                                style = $('.chat-line__username [style]', true, line).map(element => element.getAttribute('style')).join(';'),
                                reply = $('button[data-test-selector="chat-reply-button"i]', false, line);

                            let raw = line.innerText?.trim(),
                                containedEmotes = [];

                            message = message
                                .map(element => {
                                    let string;

                                    if(keepEmotes && ((element.dataset.testSelector == 'emote-button') || element.dataset.ttEmote)) {
                                        let img = $('img', false, element);

                                        if(defined(img))
                                            containedEmotes.push(string = `:${ (i=>((emotes[i.alt]=i.src),i.alt))(img) }:`);
                                    } else {
                                        string = element.innerText;
                                    }

                                    return string;
                                })
                                .filter(defined)
                                .join(' ')
                                .trim()
                                .replace(/(\s){2,}/g, '$1');

                            style = style
                                .replace(/\brgba?\(([\d\s,]+)\)/i, ($0, $1, $$, $_) => '#' + $1.split(',').map(color => (+color.trim()).toString(16).padStart(2, '00')).join(''));

                            let uuid = UUID.from([author, mentions.join(','), message].join(':')).value;

                            if(defined(results.find(message => message.uuid == uuid)))
                                continue;

                            results.push({
                                raw,
                                uuid,
                                reply,
                                style,
                                author,
                                badges,
                                handle,
                                message,
                                mentions,
                                element: line,
                                emotes: [...new Set(containedEmotes.map(string => string.replace(/^:|:$/g, '')))],
                                deleted: defined($('[class*="--deleted-notice"i]', false, line)),
                                highlighted: !!(line.classList.value.split(' ').filter(value => /^chat-line--/i.test(value)).length),
                            });
                        }
                    }

                    results.emotes = emotes;

                    for(let [name, callback] of GetChat.__onnewmessage__)
                        callback(results);
                });

            if(!defined(chat))
                break ChatObserver;

            observer.observe(chat, { childList: true });
        }

        // Add custom styling
        CustomCSSInitializer: {
            Chat__CUSTOM_CSS = $('#tt-custom-chat-css') ?? furnish('style#tt-custom-chat-css', {});

Chat__CUSTOM_CSS.innerHTML =
`
[data-a-page-loaded-name="PopoutChatPage"i] [class*="chat"i][class*="header"i] {
    display: none !important;
}

#tt-auto-claim-bonuses .tw-z-above, [plagiarism], [repetitive] { display: none }
#tt-hidden-emote-container::after {
    content: 'Collecting emotes...\\A Do not close this window';
    text-align: center;
    white-space: break-spaces;

    --background: #000e;
    --text-align: center;

    position: absolute;
    --padding-top: 100%;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);

    --height: 100%;
    --width: 100%;
}
#tt-hidden-emote-container .simplebar-scroll-content { visibility: hidden }
.tt-first-run {
    border: 1px solid var(--color-blue);
    border-radius: 3px;

    transition: border 1s;
}
[animationID] a { cursor: grab }
[animationID] a:active { cursor: grabbing }
[tt-hidden] { display: none }
[up-next--body] {
    background-color: #387aff;
    border-radius: 0.5rem;
}
[up-next--body] > div[class]:first-child:only-child::after {
    content: 'Drag-and-drop channels here to queue them\\A They can be rearranged by dragging them';
    text-align: center;
    white-space: break-spaces;

    position: absolute;
    left: 50%;
    top: 50%;
    transform: translateX(-50%);

    width: 100%;
}

::-webkit-scrollbar {
    width: .6rem;
}
::-webkit-scrollbar-button {
    background: transparent;
    display: none;
    visibility: hidden;

    height: 0;
    width: 0;
}
::-webkit-scrollbar-thumb {
    background: #0008;
    border: 1px solid #fff4;
    border-radius: .5rem;
}
::-webkit-scrollbar-track {
    background: #0000;
}
::-webkit-scrollbar-corner {
    background: transparent;
}

.tt-emote-captured [data-test-selector="badge-button-icon"i],
.tt-emote-bttv [data-test-selector="badge-button-icon"i] {
    left: 0;
    top: 0;
}

[tt-live-status-indicator] {
    background-color: var(--color-hinted-grey-6);
    border-radius: var(--border-radius-rounded);
    width: 0.8rem;
    height: 0.8rem;
    display: inline-block;
    position: relative;
}

[tt-live-status-indicator="true"i] { background-color: var(--color-fill-live) }
`;

            Chat__CUSTOM_CSS?.remove();
            $('body').appendChild(Chat__CUSTOM_CSS);
        }

        // Update the settings
        SettingsInitializer: {
            switch(Settings.onInstalledReason) {
                // Is this the first time the extension has run?
                // If so, then point out what's been changed
                case INSTALL:
                    setTimeout(() => {
                        for(let element of $('#tt-auto-claim-bonuses', true))
                            element.classList.add('tt-first-run');

                        setTimeout(() => {
                            $('.tt-first-run', true)
                                .forEach(element => element.classList.remove('tt-first-run'));
                        }, 30_000);
                    }, 5_000);
                    break;
            }

            Storage.set({ onInstalledReason: null });
        }
    }
}, 500);
