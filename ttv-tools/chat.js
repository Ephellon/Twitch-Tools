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

/** @file Defines the chat-specific logic for the extension. Used for all {@link # twitch.tv/chat/*} sites.
 * <style>[pill]{font-weight:bold;white-space:nowrap;border-radius:1rem;padding:.25rem .75rem}[good]{background:#e8f0fe;color:#174ea6}[bad]{background:#fce8e6;color:#9f0e0e;}</style>
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

window.IS_A_FRAMED_CONTAINER = (top != window);

top.Queue ??= { balloons: [], bullets: [], bttv_emotes: [], emotes: [], messages: [], message_popups: [], popups: [] };

let Chat__Initialize = async(START_OVER = false) => {
    let here = parseURL(window.location.href);
    let fsData = Object.assign(await Runtime.sendMessage({ action: 'FETCH_SHARED_DATA' }), top);

    let {
        USERNAME = Search?.cookies?.name,
        LANGUAGE,
        THEME,

        PATHNAME = here.pathname,
        NORMALIZED_PATHNAME = here.pathname.replace(/^\/(?:moderator|popout)\/(\/[^\/]+?)/i, '$1').replace(/^(\/[^\/]+?)\/(?:about|schedule|squad|videos)\b/i, '$1'),
        STREAMER = ({
            get href() { return `https://www.twitch.tv/${ STREAMER.name }` },
            get name() { return here.searchParameters.channel },
            get live() { return !$.all('[href*="offline_embed"i]').length },
            get sole() { return parseInt($('img[class*="channel"i][class*="point"i][class*="icon"i]')?.src?.replace(/[^]*\/(\d+)\/[^]*/, '$1')) || null },
        }),

        GLOBAL_EVENT_LISTENERS = {},
    } = fsData;

    // Fill STREAMER
    let [path, name, endpoint] = location.pathname.split(/(?<!^)\//);

    // Get Twitch Badges
    let TTV_BADGES = {
        get(name) {
            for(let key in TTV_BADGES)
                if(name.equals(key))
                    return TTV_BADGES[key];
        },
    };

    fetch(Runtime.getURL(`ext/badges.json`))
        .then(r => r.json())
        .then(json => {
            for(let { name, uuid } of json)
                TTV_BADGES[name] = uuid;
        });

    // Time how long jobs take to complete properly
    class StopWatch {
        static #WATCHES = new Map;

        constructor(name, interval) {
            interval ??= Timers[name];

            StopWatch.#WATCHES.set(name, this);

            return Object.assign(this, {
                name, interval,

                start: new Date,
                stop: null,
                span: null,
                max: Math.abs(interval + new Date) * 1.1,
            });
        }

        static stop(name) {
            StopWatch.#WATCHES.get(name)?.time();
        }

        time() {
            let stop = this.stop = new Date;
            let span = this.span = Math.abs(this.start - stop);
            let { max, name } = this;

            if(span > max)
                $warn(`"${ name.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['',' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, '- ') }" took ${ (span / 1000).suffix('s', 2).replace(/\.0+/, '') } to complete (max time allowed is ${ (max / 1000).suffix('s', 2).replace(/\.0+/, '') }). Offense time: ${ new Date }. Offending site: ${ location.pathname }`)
                    ?.toNativeStack?.();
        }
    }

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
        new StopWatch('auto_claim_bonuses');

        let ChannelPoints = (null
                ?? $('[class*="bonus"i]')?.closest('button')
                ?? $('[data-test-selector*="points"i][data-test-selector*="summary"i] button[class*="success"i]')
                ?? $('[data-test-selector*="points"i][data-test-selector*="summary"i] button:is([class*="destruct"i], [class*="error"i])')
            ),
            Enabled = (Settings.auto_claim_bonuses && parseBool($('#tt-auto-claim-bonuses')?.getAttribute('tt-auto-claim-enabled') ?? $('[data-a-page-loaded-name="PopoutChatPage"i]')));

        if(Enabled && defined(ChannelPoints)) {
            ChannelPoints.click();

            let playedAnimation;

            when.defined(() => $('.pulse-animation [class*="channel"i][class*="points"i]')).then(ok => playedAnimation = ok);

            wait(10_000).then(() => top.TWITCH_INTEGRITY_FAIL = !playedAnimation);
        }

        let BonusChannelPointsSVG = Glyphs.modify('bonuschannelpoints', {
            id: 'tt-auto-claim-indicator',
            height: '2rem',
            width: '2rem',
            style: `vertical-align: middle; margin-left: 0.5rem; background-color: #00ad96; fill: #000; border: 0; border-radius: .25rem;`
        });

        let parent = $('div:not(#tt-auto-claim-bonuses) > [data-test-selector*="points"i][data-test-selector*="summary"i] [role="tooltip"i]'),
            tooltip = $('#tt-auto-claim-bonuses [role="tooltip"i]');

        if(tooltip && parent)
            tooltip.innerText = parent.innerText;

        // Actual jobbing
        let button = $('#tt-auto-claim-bonuses');

        if(nullish(button)) {
            let parent    = $('[data-test-selector*="points"i][data-test-selector*="summary"i]'),
                heading   = $.all('.top-nav__menu > div').pop(),
                container = furnish();

            if(nullish(parent) || nullish(heading)) {
                // wait(5000).then(Chat__Initialize);
                return StopWatch.stop('auto_claim_bonuses');
            }

            container.innerHTML = parent.outerHTML;
            container.id = 'tt-auto-claim-bonuses';
            container.classList.add('community-points-summary', 'tt-align-items-center', 'tt-flex', 'tt-full-height');
            container.modStyle(`animation:1s fade-in 1;`);

            heading.insertBefore(container, heading.children[1]);

            $('#tt-auto-claim-bonuses [data-test-selector*="points"i][data-test-selector*="summary"i] > div:last-child:not(:first-child)')?.remove();

            let textContainer = $('[data-test-selector*="balance"i] *:not(:empty)', container);

            if(defined(textContainer)) {
                let { parentElement } = textContainer;
                parentElement.removeAttribute('data-test-selector');
            } else {
                return StopWatch.stop('auto_claim_bonuses');
            }

            button = {
                container,
                enabled: true,
                text: textContainer,
                icon: $('svg, img', container),
                get offset() { return getOffset(container) },
                tooltip: new Tooltip(container, Glyphs.modify('channelpoints', { style: `height: 1.5rem; width: 1.5rem; vertical-align: bottom` }) + ` ${ (320 * CHANNEL_POINTS_MULTIPLIER) | 0 } / h`, { top: -10 }),
            };

            // button.tooltip.id = new UUID().toString();
            button.text.innerHTML = '+' + BonusChannelPointsSVG;
            button.container.setAttribute('tt-auto-claim-enabled', true);

            button.icon ??= $('svg, img', container);

            if($.nullish('.channel-points-icon', container)) {
                button.icon.outerHTML = Glyphs.channelpoints;
                button.icon = $('svg, img', container);
            }

            button.icon.modStyle(`height: 2rem; width: 2rem; margin-top: .25rem; margin-left: .25rem;`);

            when.defined(container => $('[data-test-selector*="balance"i][data-test-selector*="string"i]', container), 30, container).then(text => text.remove());
            when.defined(container => ($.all('svg, img', container).length > 2? container: null), 30, container).then(container => {
                let oldIcon = $('svg, img', container);
                let newIcon = $.last('svg, img', container);

                newIcon.closest('[data-a-target] *:last-child:not(:first-child)')?.remove();

                oldIcon.replaceWith(newIcon);
            });
        } else {
            let container = button,
                textContainer = $('[data-test-selector*="balance"i] *:not(:empty)', container);

            button = {
                container,
                enabled: true,
                text: textContainer,
                tooltip: Tooltip.get(container),
                icon: $('svg, img', container),
                get offset() { return getOffset(container) },
            };
        }

        button.container.onclick ??= event => {
            let enabled = button.container.getAttribute('tt-auto-claim-enabled').unlike('true');

            button.container.setAttribute('tt-auto-claim-enabled', enabled);
            button.text.innerHTML = ['','+'][+enabled] + BonusChannelPointsSVG;
            button.tooltip.innerHTML = Glyphs.modify('channelpoints', { style: `height: 1.5rem; width: 1.5rem; vertical-align: bottom` }) + ` ${ ((120 + (200 * +enabled)) * CHANNEL_POINTS_MULTIPLIER) | 0 } / h`;
        };

        top.onintegritychange = okay =>
            $('#tt-auto-claim-indicator')?.modStyle(`background-color:${ ['#ff4f4d','#00ad96'][+okay] }`);

        top.onintegritychange = okay =>
            button.tooltip.innerHTML = Glyphs.modify('channelpoints', { style: `height: 1.5rem; width: 1.5rem; vertical-align: bottom` }) + ` ${ ((120 + (200 * +okay)) * CHANNEL_POINTS_MULTIPLIER) | 0 } / h`;

        button.container.onmouseenter ??= event => {
            button.icon?.setAttribute('hover', true);
        };

        button.container.onmouseleave ??= event => {
            button.icon?.setAttribute('hover', false);
        };

        // Make sure the button is all the way to the left
        for(let max = 10; max > 0 && defined(button.container.previousElementSibling); --max)
            button.container.parentElement.insertBefore(button.container, button.container.previousElementSibling);

        // Adjust the text size
        button.text?.classList?.add('text');

        // Make the tooltip easier to manage
        button.tooltip?.classList?.add('img-container');

        // Clean up leftovers from Twitch animations
        let junk = $(`#tt-auto-claim-bonuses ${ '> :last-child'.repeat(3) }`);
        junk && (junk.innerHTML = '');

        // Set the Channel Point icon's color & positioning
        $('svg:not([id])', button.container)
            ?.modStyle(`fill:var(--channel-color-${ ANTITHEME })`);

        $('svg:not([id])', button.container)
            ?.closest('div:not([class*="channel"i])')
            ?.modStyle('margin-top:0.1em');

        StopWatch.stop('auto_claim_bonuses');
    };
    Timers.auto_claim_bonuses = 2_500;

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
    /*** Emote Searching - NOT A SETTING. This is a helper for "Convert Emotes" and "BTTV Emotes"
     *      ______                 _          _____                     _     _
     *     |  ____|               | |        / ____|                   | |   (_)
     *     | |__   _ __ ___   ___ | |_ ___  | (___   ___  __ _ _ __ ___| |__  _ _ __   __ _
     *     |  __| | '_ ` _ \ / _ \| __/ _ \  \___ \ / _ \/ _` | '__/ __| '_ \| | '_ \ / _` |
     *     | |____| | | | | | (_) | ||  __/  ____) |  __/ (_| | | | (__| | | | | | | | (_| |
     *     |______|_| |_| |_|\___/ \__\___| |_____/ \___|\__,_|_|  \___|_| |_|_|_| |_|\__, |
     *                                                                                 __/ |
     *                                                                                |___/
     */
    let EmoteSearch = {},
        EmoteDragCommand;

    Handlers.emote_searching = () => {
        EmoteSearch.input = $('.emote-picker [type="search"i]');

        EmoteDragCommand = (lang => {
            switch(lang) {
                case 'de':
                    return 'Ziehen, um zu benutzen';

                case 'es':
                    return 'Arrastre para usar';

                case 'ru':
                    return 'Перетащите для использования';

                case 'en':
                default:
                    return 'Drag to use';
            }
        })(top.LANGUAGE);

        if(defined(EmoteSearch.input?.value))
            if(EmoteSearch.input.value != EmoteSearch.value)
                if((EmoteSearch.value = EmoteSearch.input.value.trim())?.length >= 3)
                    for(let [name, callback] of EmoteSearch.__onquery__)
                        wait(250).then(() => {
                            if(EmoteSearch.value == EmoteSearch.input.value)
                                callback(EmoteSearch.value);
                        });
    };
    Timers.emote_searching = 250;

    __EmoteSearching__:
    if([Settings.convert_emotes, Settings.bttv_emotes].map(parseBool).contains(true)) {
        Object.defineProperties(EmoteSearch, {
            onquery: {
                set(callback) {
                    let name = callback.name || UUID.from(callback.toString()).value;

                    if(EmoteSearch.__onquery__.has(name))
                        return EmoteSearch.__onquery__.get(name);

                    // $remark('Adding [on query] event listener', { [name]: callback });

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
                    $.all(`[tt-${ type }-emote-search-result]`).forEach(node => node.remove());

                    let container = $('[class*="emote-picker"i] [class*="emote-picker"i][class*="block"i] > *:last-child');

                    for(let node of nodes) {
                        if(nullish(node))
                            continue;

                        node.setAttribute(`tt-${ type }-emote-search-result`, UUID.from(node.innerHTML).value);

                        container.append(node);
                    }

                    let title = (null
                        ?? $('p', container.previousElementSibling)
                        ?? $('[class*="emote-picker"i] p')
                    );

                    title.innerText = title.innerText.replace(/^.*("[^]+").*?$/, `${ container.children.length } search results for $1`);
                },
            },

            getTextDistance: {
                // Text comparison
                // Calculates the Levenshtein's distance between two strings
                value: function levenshtein(A = '', B = '') {
                    return A.distanceFrom(B);
                }
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
    let BTTV_EMOTES = (top.BTTV_EMOTES ??= new Map),
        BTTV_OWNERS = (top.BTTV_OWNERS ??= new Map);

    // Size limit per key is 5MiB
    Cache.large.load(['BTTV_EMOTES', 'BTTV_OWNERS'], data => {
        Object.entries(data?.BTTV_EMOTES ?? {})
            .map(([name, id]) => BTTV_EMOTES.set(name, `//cdn.betterttv.net/emote/${ id }/3x`));

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
        let emotesUUID = UUID.from([...BTTV_EMOTES.keys()].sort().join(',')).value;
        if(BTTV_EMOTES.uuid != emotesUUID) {
            BTTV_EMOTES.uuid = emotesUUID;

            [...BTTV_EMOTES].map(([name, src]) => emotes[name] = parseURL(src).pathname.slice(1).split('/').slice(-2).shift());

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

    let BTTV_LOADED_INDEX = 0,
        BTTV_MAX_EMOTES = parseInt(Settings.bttv_emotes_maximum ??= 30),
        NON_EMOTE_PHRASES = new Set,
        QUEUED_EMOTES = new Set,
        CONVERT_TO_BTTV_EMOTE = (emote, makeTooltip = true) => {
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
        },
        LOAD_BTTV_EMOTES = async(keyword = '', provider = null, ignoreCap = false) => {
            // Load some emotes (max 100 at a time)
                // [{ emote: { code:string, id:string, imageType:string, user: { displayName:string, id:string, name:string, providerId:string } } }]
                    // emote.code → emote name
                    // emote.id → emote ID (src)
            keyword = (keyword || '').trim();
            provider = provider?.toString?.();

            if(/:(\w+):/.test(keyword) || keyword.length < 1)
                return;

            if(nullish(provider) || Number.isNaN(provider)) {
                if(QUEUED_EMOTES.has(keyword) || NON_EMOTE_PHRASES.has(keyword) || BTTV_EMOTES.has(keyword))
                    return BTTV_EMOTES.get(keyword);
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
                            user ??= emote?.user ?? { displayName: STREAMER.name, name: STREAMER.name.toLowerCase(), providerId: STREAMER.sole };

                            if(BTTV_EMOTES.has(code))
                                continue;

                            BTTV_EMOTES.set(code, `//cdn.betterttv.net/emote/${ id }/3x`);
                            BTTV_OWNERS.set(code, { ...user, userId: userId ?? user.id });
                        }
                    })
                    .catch($warn);
            // Load emotes with a certain name
            else if(keyword?.length)
                for(let maxNumOfEmotes = BTTV_MAX_EMOTES, offset = 0, allLoaded = false, MAX_REPEAT = 15; !allLoaded && keyword.trim().normalize('NFKD').length && (ignoreCap || BTTV_EMOTES.size < maxNumOfEmotes) && MAX_REPEAT > 0 && !NON_EMOTE_PHRASES.has(keyword); (--MAX_REPEAT > 0? null: NON_EMOTE_PHRASES.add(keyword)))
                    await fetchURL.fromDisk(`//api.betterttv.net/3/emotes/shared/search?query=${ keyword }&offset=${ offset }&limit=100`, { hoursUntilEntryExpires: 744 })
                        .then(response => response.json())
                        .then(emotes => {
                            if(!emotes?.length)
                                return;

                            for(let { emote, code, user, id, userId = null } of emotes) {
                                code ??= emote?.code;
                                user ??= emote?.user ?? {};

                                if(BTTV_EMOTES.has(code))
                                    continue;

                                BTTV_EMOTES.set(code, `//cdn.betterttv.net/emote/${ id }/3x`);
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
                for(let maxNumOfEmotes = BTTV_MAX_EMOTES, offset = 0, allLoaded = false; (ignoreCap || BTTV_EMOTES.size < maxNumOfEmotes);)
                    await fetchURL.fromDisk(`//api.betterttv.net/3/${ Settings.bttv_emotes_location ?? 'emotes/shared/trending' }?offset=${ offset }&limit=100`, { hoursUntilEntryExpires: 744 })
                        .then(response => response.json())
                        .then(emotes => {
                            for(let { emote } of emotes) {
                                let { code, user, id } = emote;

                                if(BTTV_EMOTES.has(code))
                                    continue;

                                BTTV_EMOTES.set(code, `//cdn.betterttv.net/emote/${ id }/3x`);
                                BTTV_OWNERS.set(code, { ...user, userId: user.id });
                            }

                            offset += emotes.length | 0;
                            allLoaded ||= emotes.length > maxNumOfEmotes || emotes.length < 15;
                        })
                        .catch($warn);
        },
        REFURBISH_BTTV_EMOTE_TOOLTIPS = fragment => {
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
                                                    src: BTTV_EMOTES.get(emote),
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
                                        src: BTTV_EMOTES.get(bttvEmote),
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
                                        src: BTTV_EMOTES.get(bttvEmote),
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
        new StopWatch('bttv_emotes');

        let BTTVEmoteSection = $('#tt-bttv-emotes');

        if(defined(BTTVEmoteSection))
            return StopWatch.stop('bttv_emotes');

        let parent = $('[data-test-selector^="chat-room-component"i] .emote-picker__scroll-container > *');

        if(nullish(parent))
            return StopWatch.stop('bttv_emotes');

        // Put all BTTV emotes into the emote-picker list
        let BTTVEmotes = [];

        for(let [name, src] of BTTV_EMOTES)
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
                        innerHTML: `BetterTTV Emotes &mdash; ${ EmoteDragCommand }`
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

        StopWatch.stop('bttv_emotes');
    };
    Timers.bttv_emotes = 5_000;

    __BetterTTVEmotes__:
    if(parseBool(Settings.bttv_emotes)) {
        $remark("Loading BTTV emotes...");

        // Use 85% of available space to load "required" emotes
        BTTV_MAX_EMOTES = Math.round(parseInt(Settings.bttv_emotes_maximum) * 0.85);

        // Load streamer specific emotes
        if(parseBool(Settings.bttv_emotes_channel))
            LOAD_BTTV_EMOTES(STREAMER.name, STREAMER.sole);
        // Load emotes (not to exceed the max size)
        LOAD_BTTV_EMOTES(STREAMER.name)
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

                for(let [name, src] of BTTV_EMOTES)
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
                            if(!NON_EMOTE_PHRASES.has(word) && !QUEUED_EMOTES.has(word) && !BTTV_EMOTES.has(word) && word.length >= 3 && /[a-z\d][A-Z]|^[A-Z]+$/.test(word))
                                await LOAD_BTTV_EMOTES(word, null, true);

                        // This will search for all emotes in the "library"
                        if(BTTV_EMOTES.has(word)) {
                            let regexp = RegExp(`${ word.replace(/(\W)/g, '\\$1').replace(/^\w/, '\\b$&').replace(/\w$/, '$&\\b') }`, 'g'),
                                alt = word,
                                src = BTTV_EMOTES.get(alt),
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

                        REFURBISH_BTTV_EMOTE_TOOLTIPS(fragment);
                    });
                }, 250);
            });

        $remark("Adding BTTV emote search listener...");

        EmoteSearch.onquery = async query => {
            await LOAD_BTTV_EMOTES(query, null, true).then(() => {
                let results = [...BTTV_EMOTES]
                    .filter(([key, value]) => {
                        let pattern = RegExp(query.replace(/(\W)/g, '\\$1'), 'i').test(key),
                            distance = EmoteSearch.getTextDistance(query, key);

                        return pattern || (distance < query.length / 2);
                    })
                    .map(([name, src]) => CONVERT_TO_BTTV_EMOTE({ name, src }));

                    EmoteSearch.appendResults(results, 'bttv');
            });
        };

        // top.BTTV_EMOTES = BTTV_EMOTES;
        // top.BTTV_OWNERS = BTTV_OWNERS;
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
    let OWNED_EMOTES = (top.OWNED_EMOTES ??= new Map),
        CAPTURED_EMOTES = (top.CAPTURED_EMOTES ??= new Map),
        CONVERT_TO_CAPTURED_EMOTE = (emote, makeTooltip = true) => {
            let { name, src } = emote;

            // Try to filter out Twitch-provided emotes...
            if(/^\W/.test(name))
                return;

            let emoteContainer =
            furnish('.tt-emote-captured.tt-pd-x-05.tt-relative').with(
                furnish('.emote-button').with(
                    furnish('.tt-inline-flex').with(
                        furnish(`button.emote-button__link.tt-align-items-center.tt-flex.tt-justify-content-center[@testSelector=emote-button-clickable][@aTarget=${ name }]`,
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

        if(nullish(parent))
            return RestartJob('convert_emotes', 'missing:convert_emotes.parent');

        // Get the streamer's emotes and make them draggable
        let streamersEmotes = $(`[class^="emote-picker"i] img[alt="${ STREAMER.name }"i]`)?.closest('div')?.nextElementSibling;

        if(nullish(streamersEmotes))
            return RegisterJob('convert_emotes');

        for(let lock of $.all('[data-test-selector*="lock"i]', streamersEmotes)) {
            let emote = lock.nextElementSibling,
                { alt, src } = emote,
                parent = emote.closest('[class^="emote-picker"i]').parentElement,
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
                        innerHTML: `Captured Emotes &mdash; ${ EmoteDragCommand }`
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
        let chat_emote_button = $('[data-a-target="emote-picker-button"i]');

        if(nullish(chat_emote_button))
            break __ConvertEmotes__;

        function CollectEmotes() {
            chat_emote_button.click();

            let chat_emote_scroll = $('.emote-picker .simplebar-scroll-content');

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

            for(let emote in line.emotes)
                if(!OWNED_EMOTES.has(emote) && !CAPTURED_EMOTES.has(emote) && !BTTV_EMOTES.has(emote)) {
                    // $log(`Adding emote "${ emote }"`);

                    CAPTURED_EMOTES.set(emote, line.emotes[emote]);

                    let capturedEmote = CONVERT_TO_CAPTURED_EMOTE({ name: emote, src: line.emotes[emote] });

                    if(defined(capturedEmote))
                        $('#tt-captured-emotes-container')?.append?.(capturedEmote);
                }

            // Replace emotes for the last 30 chat messages
            if(Queue.emotes.contains(line.uuid))
                return;
            if(Queue.emotes.length >= 30)
                Queue.emotes = [];
            Queue.emotes.push(line.uuid);

            for(let [emote, url] of CAPTURED_EMOTES)
                if((regexp = RegExp('\\b' + emote.replace(/(\W)/g, '\\$1') + '\\b', 'g')).test(line.message)) {
                    let alt = emote,
                        src = 'https://static-cdn.jtvnw.net/emoticons/v1/' + url.split('-').map((v, i) => i == 0? parseInt(v, 36): v).join('/'),
                        srcset;

                    if(/\/https?:\/\//i.test(src))
                        src = src.replace(/[^]*\/(https?:\/\/[^]*)(?:\/https?:\/\/)?$/i, '$1');
                    else
                        srcset = [1, 2, 4].map((v, i) => src.replace(/[\d\.]+$/, `${ (i + 1).toFixed(1) } ${ v }x`)).join(',');

                    let f = furnish;
                    let img =
                    f('.chat-line__message--emote-button[@testSelector=emote-button]').with(
                        f('span[@aTarget=emote-name]').with(
                            f('.class.chat-image__container.tt-align-center.tt-inline-block').with(
                                f('img.chat-image.chat-line__message--emote', {
                                    srcset, alt, src,
                                })
                            )
                        )
                    );

                    when(line => (defined(line.element)? line: false), 1000, line).then(async element => {
                        alt = alt.replace(/\s+/g, '_');

                        $.all(`.text-fragment:not([tt-converted-emotes~="${ alt }"i])`, element).map(fragment => {
                            let container = furnish(`.chat-line__message--emote-button[@testSelector=emote-button][@capturedEmote=${ alt }]`).html(img.innerHTML),
                                converted = (fragment.getAttribute('tt-converted-emotes') ?? "").split(' ');

                            converted.push(alt);

                            let tte = fragment.getAttribute('data-tt-emote') ?? '';

                            fragment.setAttribute('data-tt-emote', [...tte.split(' '), alt].join(' '));
                            fragment.setAttribute('tt-converted-emotes', converted.join(' ').trim());
                            fragment.innerHTML = fragment.innerHTML.replace(regexp, container.outerHTML);

                            $.all('[data-captured-emote]', fragment)
                                .forEach(element => {
                                    let { capturedEmote } = element.dataset;
                                    // ... //
                                });
                            REFURBISH_BTTV_EMOTE_TOOLTIPS(fragment);
                        });
                    });
                }
        });

        $remark("Adding emote search listener...");

        EmoteSearch.onquery = query => {
            let results = [...CAPTURED_EMOTES]
                .filter(([key, value]) => {
                    let pattern = RegExp(query.replace(/(\W)/g, '\\$1'), 'i').test(key),
                        distance = EmoteSearch.getTextDistance(query, key);

                    return pattern || (distance < query.length / 2);
                })
                .map(([name, src]) => CONVERT_TO_CAPTURED_EMOTE({ name, src }));

            EmoteSearch.appendResults(results, 'captured');
        };

        // top.CAPTURED_EMOTES = CAPTURED_EMOTES;
        // top.OWNED_EMOTES = OWNED_EMOTES;
        RegisterJob('convert_emotes');
    }

    // Update rules
        // UPDATE_RULES(ruleType:string<"filter" | "phrase" | "lurking">) → object<{ text:RegExp, user:RegExp, emote:RegExp, badge:RegExp, channel:array<object>, rules:array<string>{ specific:array<string{ channel:array<string>, user:array<string>, badge:array<string>, emote:array<string> }>, general:array<string> } }>
    let UPDATE_RULES = (ruleType, delimeter = ',') => {
        let rules = Settings[`${ ruleType }_rules`];
        let channel = [], user = [], badge = [], emote = [], text = [];

        if(defined(rules?.length)) {
            rules = rules.split(RegExp(`\\s*${ delimeter }\\s*`)).map(rule => rule.trim()).filter(rule => rule.length);

            Object.defineProperties(rules, {
                specific: { value: [] },
                general: { value: [] },
            });

            let R = RegExp;
            for(let rule of rules)
                // /channel `rule(s)`
                if(/^\/[\w\-]+/.test(rule)) {
                    let caught = /^\/(?<name>[\w\-]+) +(?:(?:<(?<badge>[^>]+)>)?(?::(?<emote>[^:]+):|@(?<user>[\w\-]+)|(?<text>[^$]*))?)$/i.exec(rule).groups;

                    channel.push(caught);
                    rules.specific.push(rule);
                    (rules.specific.channel ??= []).push(caught);
                }
                // @username
                else if(/^@([\w\-]+)/.test(rule) && ['@everyone', '@chat', '@all'].missing(rule.toLowerCase())) {
                    let caught = /^@(?<user>[\w\-]+)(?<text>.*)/.exec(rule).groups;

                    user.push(R.$1);
                    rules.specific.push(rule);
                    (rules.specific.user ??= []).push(caught);
                }
                // <badge>
                else if(/^<([\w\- ]+)>/.test(rule)) {
                    let caught = /^<(?<badge>[\w\- ]+)>(?<text>.*)/.exec(rule).groups;

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
                    text.push(/^[\w\s]+$/.test(rule)? `\\b${ rule }\\b`: rule);
                    rules.general.push(rule);
                }
        }

        let channels = RegExp(`^(${ (channel.length? channel.map(({ name }) => name).join('|'): '[\\b]') })$`, 'i');
        Object.defineProperties(channel, {
            test: { value: channels.test.bind(channels) },
            exec: { value: channels.exec.bind(channels) },
        });

        return {
            text: (text.length? RegExp(`(${ text.join('|') })`, 'i'): /^[\b]$/),
            user: (user.length? RegExp(`^(${ user.join('|') })$`, 'i'): /^[\b]$/),
            emote: (emote.length? RegExp(`(${ emote.join('|') })`, 'i'): /^[\b]$/),
            badge: (badge.length? RegExp(`(${ badge.join('|') })`, 'i'): /^[\b]$/),
            channel, rules
        }
    };

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
    let MESSAGE_FILTER;

    Handlers.filter_messages = () => {
        new StopWatch('filter_messages');

        MESSAGE_FILTER ??= Chat.onmessage = Chat.onpinned = async line => {
            when(line => (defined(line.element)? line: false), 1000, line).then(async line => {
                let Filter = UPDATE_RULES('filter');

                let { message, mentions, author, badges, emotes, element } = line,
                    reason, match;

                let censoring = parseBool(element.getAttribute('tt-hidden-message'));

                if(censoring)
                    return;

                let censor = parseBool(false
                    // Filter users on all channels
                    || (Filter.user.test(author)? (match = author, reason = 'user'): false)
                    // Filter badges on all channels
                    || (Filter.badge.test(badges)? (match = badges, reason = 'badge'): false)
                    // Filter emotes on all channels
                    || (Filter.emote.test(emotes)? (match = emotes, reason = 'emote'): false)
                    // Filter messages (RegExp) on all channels
                    || (Filter.text.test(message)? (match = message, reason = 'text'): false)
                    // Filter messages/users on specific a channel
                    || Filter.channel.map(({ name, badge, emote, user, text }) => {
                        let channel = (STREAMER?.name || "~Anonymous");

                        return (true
                            && (channel.replace(/^[^\/]/, '/$&').equals(name.replace(/^[^\/]/, '/$&')))
                            && (false
                                || (author.replace(/^[^@]/, '@$&').equals(user?.replace(/^[^@]/, '@$&'))? (match = author, reason = 'channel user'): false)
                                || (!!~badges.findIndex(medal => medal.toLowerCase().contains(badge?.toLowerCase()) && medal.length && badge.length)? (match = badges, reason = 'channel badge'): false)
                                || (!!~emotes.findIndex(glyph => glyph.toLowerCase().contains(emote?.toLowerCase()) && glyph.length && emote.length)? (match = emotes, reason = 'channel emote'): false)
                                || (RegExp(text, 'i').test(message)? (match = text, reason = 'channel text'): false)
                            )
                        )
                    }).contains(true)
                );

                if(!censor)
                    return;

                let hidden = parseBool(element.getAttribute('tt-hidden-message'));

                if(hidden || mentions.contains(USERNAME))
                    return;

                $log(`Censoring message because the ${ reason } matches: ${ match }`, line);

                element.setAttribute('tt-hidden-message', censor);
            });
        };

        if(defined(MESSAGE_FILTER))
            Chat.get().map(MESSAGE_FILTER);

        StopWatch.stop('filter_messages');
    };
    Timers.filter_messages = -2_500;

    Unhandlers.filter_messages = () => {
        let hidden = $.all('[tt-hidden-message]');

        hidden.map(element => element.removeAttribute('tt-hidden-message'));
    };

    __FilterMessages__:
    if(parseBool(Settings.filter_messages)) {
        $remark("Adding message filtering...");

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
            existing = $('#tt-filter-rule--user, #tt-filter-rule--emote');

        if(nullish(card) || defined(existing))
            return;

        let title = $('h1,h2,h3,h4,h5,h6', card),
            [name] = title.childNodes,
            type = (card.getAttribute('data-a-target').equals('viewer-card')? 'user': 'emote'),
            { filter_rules } = Settings;

        name = name?.textContent?.replace(/[^]+?\((\w+)\)/, '$1');

        if(type.equals('user')) {
            /* Filter users */
            if(filter_rules && filter_rules.split(',').contains(`@${ name }`))
                return /* Already filtering messages from this person */;

            let filter = furnish('#tt-filter-rule--user', {
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

                    $.all(`[data-a-user="${ username }"i]`).map(div => div.closest('[data-a-target="chat-line-message"i]').remove());

                    currentTarget.remove();

                    Settings.set({ filter_rules });
                },

                innerHTML: `${ Glyphs.trash } Filter messages from @${ name }`,
            });

            let svg = $('svg', filter);

            svg.modStyle('vertical-align:bottom; height:20px; width:20px');

            title.append(filter);
        } else if(type.equals('emote')) {
            /* Filter emotes */
            if(filter_rules && filter_rules.split(',').contains(`:${ name }:`))
                return /* Already filtering this emote */;

            let filter = furnish('#tt-filter-rule--emote', {
                title: 'Filter this emote',
                style: 'cursor:pointer; fill:var(--color-red); font-size:1.1rem; font-weight:normal; --text-decoration:line-through;',
                emote: `:${ name }:`,

                onclick: event => {
                    let { currentTarget } = event,
                        emote = currentTarget.getAttribute('emote'),
                        { filter_rules } = Settings;

                    filter_rules = (filter_rules || '').split(',');
                    filter_rules.push(emote);
                    filter_rules = filter_rules.join(',');

                    [
                        ...$.getAllElementsByText(emote).filter(div => div.classList.contains('text-fragment')),
                        ...$.all(`img[alt="${ emote }"i]`),
                    ].map(div => div.closest('[data-a-target="chat-line-message"i]').remove());

                    currentTarget.remove();

                    Settings.set({ filter_rules });
                },

                innerHTML: `${ Glyphs.trash } Filter <strong>${ name }</strong>`,
            });

            let svg = $('svg', filter);

            svg.modStyle('vertical-align:bottom; height:20px; width:20px');

            title.append(filter);
        }
    };
    Timers.easy_filter = 500;

    __EasyFilter__:
    if(parseBool(Settings.filter_messages)) {
        RegisterJob('easy_filter');
    }

    /*** Filter Bulletins
     *      ______ _ _ _              ____        _ _      _   _
     *     |  ____(_) | |            |  _ \      | | |    | | (_)
     *     | |__   _| | |_ ___ _ __  | |_) |_   _| | | ___| |_ _ _ __  ___
     *     |  __| | | | __/ _ \ '__| |  _ <| | | | | |/ _ \ __| | '_ \/ __|
     *     | |    | | | ||  __/ |    | |_) | |_| | | |  __/ |_| | | | \__ \
     *     |_|    |_|_|\__\___|_|    |____/ \__,_|_|_|\___|\__|_|_| |_|___/
     *
     *
     */
    let BULLETIN_FILTERS = new Map([
        ['filter_messages__bullets_coin', ['coin']],
        ['filter_messages__bullets_raid', ['raid']],
        ['filter_messages__bullets_subs', ['dues', 'gift', 'keep']],
        ['filter_messages__bullets_note', ['note']],
        ['filter_messages__bullets_paid', ['PINNED_MESSAGES']],
    ]),
        PINNED_FILTER = -1;

    Handlers.filter_bulletins = () => {
        new StopWatch('filter_bulletins');

        for(let [key, subjects] of BULLETIN_FILTERS)
            if(key.endsWith('bullets_paid') && parseBool(Settings[key]))
                PINNED_FILTER = setInterval(() => $('[class*="pinned"i]:is([class*="by"i], [class*="card"i]), [class*="happening"i][class*="notification"i]')?.closest('[class*="chat"] > div:not([class])')?.remove(), 100);
            else if(parseBool(Settings[key]))
                AddCustomCSSBlock(`FilterBulletType${ key.slice(-5) }`, `${ subjects.map(subject => `[data-uuid][data-type="${ subject }"i]`).join(',') } { display:none!important }`);

        StopWatch.stop('filter_bulletins');
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

    /*** Highlight Phrases
     *      _    _ _       _     _ _       _     _     _____  _
     *     | |  | (_)     | |   | (_)     | |   | |   |  __ \| |
     *     | |__| |_  __ _| |__ | |_  __ _| |__ | |_  | |__) | |__  _ __ __ _ ___  ___  ___
     *     |  __  | |/ _` | '_ \| | |/ _` | '_ \| __| |  ___/| '_ \| '__/ _` / __|/ _ \/ __|
     *     | |  | | | (_| | | | | | | (_| | | | | |_  | |    | | | | | | (_| \__ \  __/\__ \
     *     |_|  |_|_|\__, |_| |_|_|_|\__, |_| |_|\__| |_|    |_| |_|_|  \__,_|___/\___||___/
     *                __/ |           __/ |
     *               |___/           |___/
     */
    let PHRASE_HIGHLIGHTER;

    Handlers.highlight_phrases = () => {
        new StopWatch('highlight_phrases');

        PHRASE_HIGHLIGHTER ??= Chat.onmessage = async line => {
            when(line => (defined(line.element)? line: false), 1000, line).then(async line => {
                let Phrases = UPDATE_RULES('phrase');

                let { message, mentions, author, badges, emotes, style, element } = line,
                    reason;

                let censor = parseBool(false
                    // Phrase of users on all channels
                    || (Phrases.user.test(author)? reason = 'user': false)
                    // Phrase of badges on all channels
                    || (Phrases.badge.test(badges)? reason = 'badge': false)
                    // Phrase of emotes on all channels
                    || (Phrases.emote.test(emotes)? reason = 'emote': false)
                    // Phrase of messages (RegExp) on all channels
                    || (Phrases.text.test(message)? reason = 'text': false)
                    // Phrase of messages/users on specific a channel
                    || Phrases.channel.map(({ name, text, user, badge, emote }) => {
                        if(nullish(STREAMER))
                            return;

                        let channel = STREAMER.name?.toLowerCase();

                        return parseBool(false
                            || channel == name.toLowerCase()
                        ) && parseBool(false
                            || (('@' + author) == user? reason = 'channel user': false)
                            || (!!~badges.findIndex(medal => medal.contains(badge) && medal.length && badge.length)? reason = 'channel badge': false)
                            || (!!~emotes.findIndex(glyph => glyph.contains(emote) && glyph.length && emote.length)? reason = 'channel emote': false)
                            || (text?.test?.(message)? reason = 'channel text': false)
                        )
                    }).contains(true)
                );

                if(!censor)
                    return;

                $log(`Highlighting message because the ${ reason } matches`, line);

                let highlight = parseBool(element.hasAttribute('tt-light'));

                if(highlight)
                    return;

                let [color] = style.split(/color:([^;]+)/i).map(s => s.trim()).filter(s => s.length).map(Color.destruct);

                element.setAttribute('tt-light', true);
                element.modStyle(`border:1px solid ${ color }; border-radius:3px;`);
            });
        };

        if(defined(PHRASE_HIGHLIGHTER))
            Chat.get().map(PHRASE_HIGHLIGHTER);

        StopWatch.stop('highlight_phrases');
    };
    Timers.highlight_phrases = -2_500;

    Unhandlers.highlight_phrases = () => {
        let highlight = $.all('[tt-light]');

        highlight.map(element => element.removeAttribute('tt-light'));
    };

    __HighlightPhrases__:
    if(parseBool(Settings.highlight_phrases)) {
        $remark("Adding phrase highlighting...");

        RegisterJob('highlight_phrases');
    }

    /*** Easy Highlighter - NOT A SETTING. This is a helper for "Highlight Phrases"
     *      ______                  _    _ _       _     _ _       _     _
     *     |  ____|                | |  | (_)     | |   | (_)     | |   | |
     *     | |__   __ _ ___ _   _  | |__| |_  __ _| |__ | |_  __ _| |__ | |_ ___ _ __
     *     |  __| / _` / __| | | | |  __  | |/ _` | '_ \| | |/ _` | '_ \| __/ _ \ '__|
     *     | |___| (_| \__ \ |_| | | |  | | | (_| | | | | | | (_| | | | | ||  __/ |
     *     |______\__,_|___/\__, | |_|  |_|_|\__, |_| |_|_|_|\__, |_| |_|\__\___|_|
     *                       __/ |            __/ |           __/ |
     *                      |___/            |___/           |___/
     */
    Handlers.easy_highlighter = () => {
        let card = $('[data-a-target="viewer-card"i], [data-a-target="emote-card"i]'),
            existing = $('#tt-highlight-rule--user, #tt-highlight-rule--emote');

        if(nullish(card) || defined(existing))
            return;

        let title = $('h1,h2,h3,h4,h5,h6', card),
            [name] = title.childNodes,
            type = (card.getAttribute('data-a-target').equals('viewer-card')? 'user': 'emote'),
            { phrase_rules } = Settings;

        name = name?.textContent?.replace(/[^]+?\((\w+)\)/, '$1');

        if(type.equals('user')) {
            /* Highlight users */
            if(phrase_rules && phrase_rules.split(',').contains(`@${ name }`))
                return /* Already highlighting messages from this person */;

            let phrase = furnish('#tt-highlight-rule--user', {
                title: `Highlight all messages from @${ name }`,
                style: 'cursor:pointer; fill:var(--color-green); font-size:1.1rem; font-weight:normal',
                username: name,

                onclick: event => {
                    let { currentTarget } = event,
                        username = currentTarget.getAttribute('username'),
                        { phrase_rules } = Settings;

                    phrase_rules = (phrase_rules || '').split(',');
                    phrase_rules.push(`@${ username }`);
                    phrase_rules = phrase_rules.join(',');

                    $.all(`[data-a-user="${ username }"i]`).map(div => div.closest('[data-a-target="chat-line-message"i]').setAttribute('tt-light', true));

                    currentTarget.setAttribute('tt-hidden-message', true);

                    Settings.set({ phrase_rules });
                },

                innerHTML: `${ Glyphs.star } Highlight messages from @${ name }`,
            });

            let svg = $('svg', phrase);

            svg.modStyle('vertical-align:bottom; height:20px; width:20px');

            title.append(phrase);
        } else if(type.equals('emote')) {
            /* Highlight emotes */
            if(phrase_rules && phrase_rules.split(',').contains(`:${ name }:`))
                return /* Already highlighting this emote */;

            let phrase = furnish('#tt-highlight-rule--emote', {
                title: 'Highlight this emote',
                style: 'cursor:pointer; fill:var(--color-green); font-size:1.1rem; font-weight:normal;',
                emote: `:${ name }:`,

                onclick: event => {
                    let { currentTarget } = event,
                        emote = currentTarget.getAttribute('emote'),
                        { phrase_rules } = Settings;

                    phrase_rules = (phrase_rules || '').split(',');
                    phrase_rules.push(emote);
                    phrase_rules = phrase_rules.join(',');

                    [
                        ...$.getAllElementsByText(emote).filter(div => div.classList.contains('text-fragment')),
                        ...$.all(`img[alt="${ emote }"i]`),
                    ].map(div => div.closest('[data-a-target="chat-line-message"i]').setAttribute('tt-light', true));

                    currentTarget.remove();

                    Settings.set({ phrase_rules });
                },

                innerHTML: `${ Glyphs.star } Highlight <strong>${ name }</strong>`,
            });

            let svg = $('svg', phrase);

            svg.modStyle('vertical-align:bottom; height:20px; width:20px');

            title.append(phrase);
        }
    };
    Timers.easy_highlighter = 500;

    __EasyHighlighter__:
    if(parseBool(Settings.highlight_phrases)) {
        RegisterJob('easy_highlighter');
    }

    /*** Easy Helper Card Resizer - NOT A SETTING. This is a helper for "Filter Messages" and "Highlight Phrases" that adjusts the card height for hidden children
     *      ______                  _    _      _                    _____              _   _____           _
     *     |  ____|                | |  | |    | |                  / ____|            | | |  __ \         (_)
     *     | |__   __ _ ___ _   _  | |__| | ___| |_ __   ___ _ __  | |     __ _ _ __ __| | | |__) |___  ___ _ _______ _ __
     *     |  __| / _` / __| | | | |  __  |/ _ \ | '_ \ / _ \ '__| | |    / _` | '__/ _` | |  _  // _ \/ __| |_  / _ \ '__|
     *     | |___| (_| \__ \ |_| | | |  | |  __/ | |_) |  __/ |    | |___| (_| | | | (_| | | | \ \  __/\__ \ |/ /  __/ |
     *     |______\__,_|___/\__, | |_|  |_|\___|_| .__/ \___|_|     \_____\__,_|_|  \__,_| |_|  \_\___||___/_/___\___|_|
     *                       __/ |               | |
     *                      |___/                |_|
     */
    Handlers.easy_helper_card_resizer = () => {
        let card = $('[data-a-target="viewer-card"i], [data-a-target="emote-card"i]');

        if(nullish(card))
            return;

        let title = $('h1,h2,h3,h4,h5,h6', card),
            { length } = title.children;

        if(length > 2)
            title.modStyle(`height: ${ 3 * (length - 1) + 1 }rem`);
    };
    Timers.easy_helper_card_resizer = 250;

    __EasyHelperCardResizer__:
    if(parseBool(Settings.filter_messages) || parseBool(Settings.highlight_phrases)) {
        RegisterJob('easy_helper_card_resizer');
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
        Chat.get().map(Chat.onmessage = async line => {
            let usernames = [USERNAME];

            if(parseBool(Settings.highlight_mentions_extra))
                usernames.push('all', 'chat', 'everyone');

            if(!~line.mentions.findIndex(username => RegExp(`^(${ usernames.join('|') })$`, 'i').test(username)))
                return;

            if(Queue.messages.missing(line.uuid)) {
                Queue.messages.push(line.uuid);

                when(line => (defined(line.element)? line: false), 1000, line).then(async line => {
                    let { author, message, style } = line;
                    let element = await line.element;

                    // $log('Highlighting message:', { author, message });

                    let [color] = style.split(/color:([^;]+)/i).map(s => s.trim()).filter(s => s.length).map(Color.destruct);

                    element.modStyle(`background-color: var(--color-opac-p-8); border:1px solid ${ color }; border-radius:3px;`);
                });
            }
        });
    };
    Timers.highlight_mentions = -500;

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
        Chat.get().map(Chat.onmessage = async line => {
            if(line.message.missing(USERNAME))
                return;

            if(Queue.message_popups.missing(line.uuid)) {
                Queue.message_popups.push(line.uuid);

                when(line => (defined(line.element)? line: false), 1000, line).then(async line => {
                    let { author, message, element } = line,
                        reply = await line.reply;

                    let existing = $('#tt-chat-footer');

                    if(defined(existing))
                        return;

                    // $log('Generating footer:', { author, message });

                    new ChatFooter(`@${ author } mentioned you.`, {
                        onclick: event => {
                            let chatbox = $('[class*="chat-input"i] textarea'),
                                existing = $('#tt-chat-footer');

                            if(defined(chatbox))
                                chatbox.focus();
                            if(defined(existing))
                                existing.remove();

                            $log('Clicked [reply] button', { author, chatbox, existing, line, message, reply });

                            (reply ?? $('button[data-test-selector*="reply"i]', element))?.click();
                        },
                    });
                });
            }
        });
    };
    Timers.highlight_mentions_popup = -500;

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
        new StopWatch('native_twitch_reply');

        // Enter
        if(nullish(GLOBAL_EVENT_LISTENERS.ENTER))
            $('[data-a-target="chat-input"i]')?.addEventListener('keydown', GLOBAL_EVENT_LISTENERS.ENTER = ({ key, altKey, ctrlKey, metaKey, shiftKey }) => {
                if(!(altKey || ctrlKey || metaKey || shiftKey) && key.equals('enter'))
                    $('#tt-close-native-twitch-reply')?.click();
            });

        if(defined(NATIVE_REPLY_POLYFILL) || $.defined('.chat-line__reply-icon'))
            return StopWatch.stop('native_twitch_reply');

        NATIVE_REPLY_POLYFILL ??= {
            // Button above chat elements
            NewReplyButton: ({ uuid, style, handle, message, mentions, }) => {
                let f = furnish;

                let addedClasses = {
                    bubbleContainer: ['chat-input-tray__open','tt-block','tt-border-b','tt-border-l','tt-border-r','tt-border-radius-large','tt-border-t','tt-c-background-base','tt-elevation-1','tt-left-0','tt-pd-05','tt-right-0','tt-z-below'],
                    chatContainer: ['chat-input-container__open','tt-block','tt-border-bottom-left-radius-large','tt-border-bottom-right-radius-large','tt-c-background-base','tt-pd-05'],
                    chatContainerChild: ['chat-input-container__input-wrapper'],
                },
                removedClasses = {
                    bubbleContainer: ['tt-block','tt-border-radius-large','tt-elevation-0','tt-left-0','tt-pd-0','tt-right-0','tt-z-below'],
                    chatContainer: ['tt-block','tt-border-radius-large','tt-pd-0'],
                };

                return f('.chat-line__reply-icon.tt-absolute.tt-border-radius-medium.tt-c-background-base.tt-elevation-1').with(
                    f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=chat-reply-button]',
                        {
                            onclick: event => {
                                let { currentTarget } = event,
                                    messageElement = currentTarget.closest('div').previousElementSibling,
                                    chatInput = $('[data-a-target="chat-input"i]'),
                                    [bubbleContainer, chatContainer] = $.all('.chat-input > :last-child > :first-child > :not(:first-child)'),
                                    chatContainerChild = $('div', chatContainer);

                                let f = furnish;

                                AddNativeReplyBubble: {
                                    bubbleContainer.classList.remove(...removedClasses.bubbleContainer);
                                    bubbleContainer.classList.add(...addedClasses.bubbleContainer);
                                    chatContainer.classList.remove(...removedClasses.chatContainer);
                                    chatContainer.classList.add(...addedClasses.chatContainer);
                                    chatContainerChild.classList.add(...addedClasses.chatContainerChild);

                                    bubbleContainer.append(
                                        f(`#tt-native-twitch-reply.tt-align-items-start.tt-flex.tt-flex-row.tt-pd-0[@testSelector=chat-input-tray]`).with(
                                            f('.tt-align-center.tt-mg-05').with(
                                                f('.tt-align-items-center.tt-flex').html(Glyphs.modify('reply', { height: '24px', width: '24px' }))
                                            ),
                                            f('.tt-flex-grow-1.tt-pd-l-05.tt-pd-y-05').with(
                                                f('span.tt-c-text-alt.tt-font-size-5.tt-strong.tt-word-break-word', {
                                                    'connected-to': uuid,

                                                    handle, message, mentions,

                                                    innerHTML: `Replying to <span style="${ style }">@${ handle }</span>`,
                                                })
                                            ),
                                            f('.tt-right-0.tt-top-0').with(
                                                f('button#tt-close-native-twitch-reply.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative',
                                                    {
                                                        onclick: event => {
                                                            let chatInput = $('[data-a-target="chat-input"i]'),
                                                                [bubbleContainer, chatContainer] = $.all('.chat-input > :last-child > :first-child > :not(:first-child)'),
                                                                chatContainerChild = $('div', chatContainer);

                                                            RemoveNativeReplyBubble: {
                                                                bubbleContainer.classList.remove(...addedClasses.bubbleContainer);
                                                                bubbleContainer.classList.add(...removedClasses.bubbleContainer);
                                                                chatContainer.classList.remove(...addedClasses.chatContainer);
                                                                chatContainer.classList.add(...removedClasses.chatContainer);
                                                                chatContainerChild.classList.remove(...addedClasses.chatContainerChild);

                                                                $.all('[id^="tt-native-twitch-reply"i]').forEach(element => element.remove());

                                                                chatInput.setAttribute('placeholder', 'Send a message');
                                                            }
                                                        },

                                                        innerHTML: Glyphs.modify('x', { height: '24px', width: '24px' }),
                                                    }
                                                )
                                            )
                                        )
                                    );

                                    bubbleContainer.append(
                                        f('#tt-native-twitch-reply-message.font-scale--default.tt-pd-x-1.tt-pd-y-05.chat-line__message[@aTarget=chat-line-message][@testSelector=chat-line-message]').with(
                                            f('.tt-relative').html(messageElement.outerHTML)
                                        )
                                    );

                                    chatInput.setAttribute('placeholder', 'Send a reply');
                                }

                                chatInput.focus();
                            },
                        },
                        f('span.tt-button-icon__icon').with(
                            f('div',
                                { style: 'width: 2rem; height: 2rem;' },
                                f('.tt-icon').with(
                                    f('.tt-aspect').html(Glyphs.reply)
                                )
                            )
                        )
                    )
                );
            },

            // Highlighter for chat elements
            AddNativeReplyButton: line => {
                when(line => (defined(line.element)? line: false), 1000, line).then(async line => {
                    let { uuid, style, handle, message, mentions, element } = line;

                    if($.defined('.chat-line__message-container', element))
                        return;

                    if(handle == USERNAME)
                        return;

                    let parent = $('div', element);
                    if(nullish(parent)) return;

                    let target = $('div', parent);
                    if(nullish(target)) return;

                    let highlighter = furnish('.chat-line__message-highlight.tt-absolute.tt-border-radius-medium[@testSelector=chat-message-highlight]', {});

                    target.classList.add('chat-line__message-container');

                    parent.insertBefore(highlighter, parent.firstElementChild);
                    parent.append(NATIVE_REPLY_POLYFILL.NewReplyButton({ uuid, style, handle, message, mentions, }));
                });
            },
        };

        Chat.get().map(NATIVE_REPLY_POLYFILL.AddNativeReplyButton);

        Chat.onmessage = NATIVE_REPLY_POLYFILL.AddNativeReplyButton;

        StopWatch.stop('native_twitch_reply');
    };
    Timers.native_twitch_reply = 1000;

    __NativeTwitchReply__:
    if(parseBool(Settings.native_twitch_reply)) {
        $remark("Adding native reply buttons...");

        RegisterJob('native_twitch_reply');
    }

    /*** Link maker
     *      _      _       _      __  __       _
     *     | |    (_)     | |    |  \/  |     | |
     *     | |     _ _ __ | | __ | \  / | __ _| | _____ _ __
     *     | |    | | '_ \| |/ / | |\/| |/ _` | |/ / _ \ '__|
     *     | |____| | | | |   <  | |  | | (_| |   <  __/ |
     *     |______|_|_| |_|_|\_\ |_|  |_|\__,_|_|\_\___|_|
     *
     *
     */
    let LINK_MAKER_ENABLED,
        CHAT_CARDIFIED = new Map,
        CHAT_CARDIFYING_TIMERS = new Map,
        REWARDS_CARDIFIER,
        REWARDS_CARDIFIED = new Map,
        LINK_PARSER = new DOMParser;

    Handlers.link_maker__chat = () => {
        // Channel Point rewards (Blerp)
        REWARDS_CARDIFIER = setInterval(() => {
            let f = furnish;
            let card = $('[class*="reward"i][class*="center"i][class*="body"i]');
            let timerStart = +new Date;

            if(nullish(card))
                return;

            let content = card.getElementByText(/\bblerp.com\//i),
                alias = card.closest('[class*="reward"i][class*="center"i][class*="content"i]')?.querySelector('[id*="reward"i][id*="center"i][id*="header"i]')?.textContent;

            if(nullish(content))
                return;

            let { href = '', origin, protocol, scheme, host, hostname, port, pathname, search, hash } = parseURL(content.innerText);

            if(href.trim().length < 2)
                return;

            content.innerHTML =
                f('a[target=_blank]', { href, style: 'padding:1rem;margin:1rem' },
                    f.img({ src: 'https://cdn.blerp.com/Favicons/favicon-16x16.png', style: 'margin-right:1rem;vertical-align:middle' }),
                    f(`span[@blerp=${ pathname }]`).with(`Blerp soundbite: ${ alias }`)
                ).outerHTML;

            fetchURL.idempotent(href)
                .then(response => response.text())
                .then(DOMParser.stripBody)
                .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                .catch($warn)
                .then(DOM => {
                    if(!(DOM instanceof Document))
                        throw TypeError(`No DOM available. Page not loaded`);

                    let f = furnish;
                    let get = property => DOM.get(property);

                    let [title, description, image, url, audio] = ["title", "description", "image", "url", "audio"].map(get),
                        error = DOM.querySelector('parsererror')?.textContent;

                    $log(`Loaded page: Blerp @ ${ href }`, { title, description, image, DOM, size: (DOM.documentElement.innerHTML.length * 8).suffix('B', 2, 'data'), time: ((+new Date - timerStart) / 1000).suffix('s', false) });

                    if(!title?.length || !image?.length) {
                        if(!error?.length)
                            return;
                        else
                            throw error;
                    }

                    let aliasContainer = $(`[data-blerp="${ parseURL(url).pathname }"i]`),
                        audioContainer = f(`audio[controls]`, { style: 'margin:1rem 0; min-width:50%;' }, f.source({ src: audio }));

                    if(nullish(aliasContainer))
                        return;

                    description = description.split(/memes?[\.!\?]/, 2).pop();

                    aliasContainer.innerHTML = encodeHTML(`Blerp soundbite: ${ title }`);
                    aliasContainer.title = description || title;
                    aliasContainer.append(audioContainer);
                });
        }, 1_000);

        // Chat messages
        Chat.get().map(Chat.onmessage = async line => {
            if(!LINK_MAKER_ENABLED)
                return;

            let { message, mentions, author, element } = line;

            let parsed = parseURL.pattern.exec(message);

            if(!parsed?.length)
                return;
            let { groups } = parsed,
                { href = '', origin, protocol, scheme, host, hostname, port, pathname, search, hash } = groups;

            if(href.trim().length < 2)
                return;
            let unknown = Symbol('UNKNOWN');
            let url = parseURL(href.replace(/^(https?:\/\/)?/i, `${ location.protocol }//`).trim()),
                [topDom = '', secDom = '', ...subDom] = url.domainPath ?? ['tv', 'twitch', 'clips'];

            // Ignore pre-cardified links
            if(subDom.contains('clips') || pathname?.contains('/videos/', '/clip/'))
                return;

            // Mobilize laggy URLs
            if('instagram twitter'.split(' ').contains(secDom.toLowerCase()))
                return; // subDom = ['mobile'];

            href = url.href.replace(url.hostname, [...subDom, secDom, topDom].filter(dom => dom.length).join('.'));
            element = await element;

            if(CHAT_CARDIFIED.has(href)) {
                let card = CHAT_CARDIFIED.get(href);

                if(nullish($(`#card-${ UUID.from(href).toStamp() }`, element)) && defined(card)) {
                    element.insertAdjacentElement('beforeend', card);

                    if($.nullish('[class*="chat-paused"i]'))
                        card.scrollIntoViewIfNeeded(true);
                }

                return;
            }

            CHAT_CARDIFIED.set(href, null);
            CHAT_CARDIFYING_TIMERS.set(href, +new Date);

            /*await*/ fetchURL.idempotent(href)
                .then(response => response.text?.() ?? `<!doctype html><html><head></head></html>`)
                .then(DOMParser.stripBody)
                .then(html => LINK_PARSER.parseFromString(html, 'text/html'))
                .then(DOM => {
                    if(!(DOM instanceof Document))
                        throw TypeError(`No DOM available. Page not loaded`);

                    let f = furnish;
                    let get = property => DOM.get(property);

                    let [title = '', description = '', image] = ["title", "description", "image"].map(get),
                        error = DOM.querySelector('parsererror')?.textContent;

                    $log(`Loaded page: Card @ ${ href }`, { title, description, image, DOM, size: (DOM.documentElement.innerHTML.length * 8).suffix('B', 2, 'data'), time: ((+new Date - CHAT_CARDIFYING_TIMERS.get(href)) / 1000).suffix('s', false) });

                    if(!title?.length || !image?.length) {
                        CHAT_CARDIFIED.set(href, f.span());

                        if(!error?.length)
                            return;
                        else
                            throw error;
                    }

                    let card = f('.tt-iframe-card.tt-border-radius-medium.tt-elevation-1').with(
                        f('.tt-border-radius-medium.tt-c-background-base.tt-flex.tt-full-width').with(
                            f('a.tt-block.tt-border-radius-medium.tt-full-width.tt-interactable', { rel: 'noopener noreferrer', target: '_blank', href },
                                f('.chat-card.tt-flex.tt-flex-nowrap.tt-pd-05').with(
                                    // Preview image
                                    f('.chat-card__preview-img.tt-align-items-center.tt-c-background-alt-2.tt-flex.tt-flex-shrink-0.tt-justify-content-center').with(
                                        f('.tt-card-image').with(
                                            f('.tt-aspect').with(
                                                f('div', {}),
                                                f('img.tt-image', {
                                                    alt: title,
                                                    src: image.replace(/^(?!(?:https?:)?\/\/[^\/]+)\/?/i, `${ location.protocol }//${ host }/`),
                                                    height: 45,
                                                    style: 'max-height:45px',

                                                    onerror({ currentTarget }) { currentTarget.src = STREAMER.icon }
                                                })
                                            )
                                        )
                                    ),
                                    // Title & Subtitle
                                    f('.tt-align-items-center.tt-flex.tt-overflow-hidden').with(
                                        f('.tt-full-width.tt-pd-l-1').with(
                                            // Title
                                            f('.chat-card__title.tt-ellipsis').with(
                                                f('p.tt-strong.tt-ellipsis[@testSelector=chat-card-title]').html(title)
                                            ),
                                            // Subtitle
                                            f('.tt-ellipsis').with(
                                                f('p.tt-c-text-alt-2.tt-ellipsis[@testSelector=chat-card-description]').html(description)
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    );

                    let container = f(`#card-${ UUID.from(href).toStamp() }.chat-line__message[@aTarget=chat-line-message][@testSelector=chat-line-message]`).with(
                        f('.tt-relative').with(
                            f('.tt-relative.chat-line__message-container').with(
                                f('div').with(
                                    f('.chat-line__no-background.tt-inline').with(
                                        card
                                    )
                                )
                            )
                        )
                    );

                    CHAT_CARDIFIED.set(href, container);
                    element.insertAdjacentElement('beforeend', container);

                    if($.nullish('[class*="chat-paused"i]'))
                        container.scrollIntoViewIfNeeded(true);
                })
                .catch($error);
        });
    };
    Timers.link_maker__chat = -500;

    Unhandlers.link_maker__chat = () => {
        LINK_MAKER_ENABLED = false;

        clearInterval(REWARDS_CARDIFIER);

        $.all('.tt-iframe-card')
            .map(card => card.remove());
    };

    __LinkMaker__:
    if(LINK_MAKER_ENABLED = parseBool(Settings.link_maker__chat)) {
        $remark("Adding link maker (chat)...");

        RegisterJob('link_maker__chat');
    }

    /*** Auto-chat (VIP) · @dskw1
     *                    _                  _           _      ____      _______ _______
     *         /\        | |                | |         | |    / /\ \    / /_   _|  __ \ \
     *        /  \  _   _| |_ ___ ______ ___| |__   __ _| |_  | |  \ \  / /  | | | |__) | |
     *       / /\ \| | | | __/ _ \______/ __| '_ \ / _` | __| | |   \ \/ /   | | |  ___/| |
     *      / ____ \ |_| | || (_) |    | (__| | | | (_| | |_  | |    \  /   _| |_| |    | |
     *     /_/    \_\__,_|\__\___/      \___|_| |_|\__,_|\__| | |     \/   |_____|_|    | |
     *                                                         \_\                     /_/
     *
     */
    let AUTO_CHAT_NAME = `auto-chat/${ STREAMER.sole }`;

    Handlers.auto_chat__vip = () => {
        if(Settings.auto_chat__vip === true)
            Settings.set({ auto_chat__vip: 'vip' });
        else if(Settings.auto_chat__vip === false)
            Settings.set({ auto_chat__vip: null });

        let goTime = (+new Date) + parseInt(Settings.auto_chat__wait_time) * 60_000;

        when(() => (+new Date) >= goTime, 5e3).then(ready => {
            Cache.load(AUTO_CHAT_NAME, results => {
                let old = results[AUTO_CHAT_NAME],
                    now = new Date;

                if(nullish(old))
                    old = now;
                else
                    old = new Date(old);

                // It's been less than 8h since the last auto-message was sent
                if((now - old) && (now - old < parseTime('8:00:00')))
                    return;

                let Rules = UPDATE_RULES('lurking', ';');
                let userSent = [...Chat.messages].find(([,{ author }]) => author.equals(USERNAME));

                // The user isn't lurking!
                if(defined(userSent)) {
                    let [uuid, line] = userSent;

                    now = defined(line.timestamp)? new Date(line.timestamp): now;

                    $notice(`The user already sent a message!`, line);
                } else {
                    let channel = STREAMER.name?.toLowerCase();
                    let badges = STREAMER.perm?.all ?? ['everyone'];
                    let message, messages, reason;

                    if(Rules.channel.test(channel)) {
                        message = (messages = Rules.rules.specific.channel?.filter(({ name, badge, text }) => {
                            if(nullish(STREAMER))
                                return;

                            return parseBool(true
                                && name.equals(channel)
                                && (false
                                    || nullish(badge)
                                    || badges.filter(medal => medal.toLowerCase().startsWith(badge.toLowerCase())).length
                                )
                            );
                        }))?.random()?.text;
                        reason = 'channel';
                    } else if(Rules.badge.test(badges.join(','))) {
                        message = (messages = Rules.rules.specific.badge?.filter(({ badge, text }) => {
                            return parseBool(false
                                || badges.filter(medal => medal.toLowerCase().startsWith(badge.toLowerCase())).length
                            );
                        }))?.random()?.text;
                        reason = 'badge';
                    } else if(STREAMER.perm?.has(Settings.auto_chat__vip)) {
                        message = (messages = Rules.rules.general).random();
                        reason = `permission (${ Settings.auto_chat__vip })`;
                    }

                    if(nullish(message))
                        return;

                    $notice(`Sending lurking message because the ${ reason } matches`, message, messages);

                    Chat.send(message);
                }

                Cache.save({ [AUTO_CHAT_NAME]: now.toJSON() });
            });
        });

        // Handle mentions while AFK
        Chat.onmessage = async({ uuid, author, usable, message, mentions, deleted }) => {
            // Don't reply to messages not meant for us...
            if(true
                && mentions.map(username => username.toLowerCase()).missing(USERNAME.toLowerCase())
                // Only accept exact matches, instead of partials; e.g. "Hey @SomeUserName, wyd?" vs. "Hey User, wyd?"
                && message.toLowerCase().missing(USERNAME)
            ) return;

            // Wouldn't make sense to reply to a deleted message...
            if(await deleted)
                return;

            // The UUID does not belong to a valid (captured) Twitch message...
                // usable = true → The message was sent AFTER the page was loaded
                // usable = false → The message was sent BEFORE the page was loaded
            if(!usable)
                return;

            // What do?
            switch(Settings.auto_chat__mentions) {
                case 'reply': {
                    Chat.reply(uuid, 'AFK. BRB');
                } break;

                default: return;
            }
        };
    };

    Timers.auto_chat__vip = -5_000;

    __AutoChat_VIP__:
    if(parseBool(Settings.auto_chat__vip)) {
        RegisterJob('auto_chat__vip');
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
        new StopWatch('prevent_spam');

        function markAsSpam(element, type = 'spam', message, phrase = '') {
            let spam_placeholder = "chat-deleted-message-placeholder";
            let span = furnish(`span.chat-line__message--deleted-notice.tt-spam-filter-${ type }[@aTarget=${ spam_placeholder }][@testSelector=${ spam_placeholder }]`).with(`message marked as ${ type }.`);

            $.all(':is([data-test-selector="chat-message-separator"i], [class*="username-container"i] + *) ~ * > *', element).forEach(sibling => sibling.remove());
            $('[data-test-selector="chat-message-separator"i], [class*="username-container"i] + *', element).parentElement.append(span);

            element.dataset[type] = message;

            if(phrase.length > 1) {
                element.setAttribute(`${ type }-phrase`, phrase);
                message = message.replace(RegExp(phrase.replace(/\W/g, '\\$&'), 'ig'), `<del>${ phrase }</del>`);
            }

            new Tooltip(element, message, { direction: 'up', fit: true });
        }

        async function spamChecker(element, message, author, lookBack, minLen, minOcc) {
            if(message.length < 1 || RegExp(`^${ USERNAME }$`, 'i').test(author))
                return message;

            // The same message is already posted (within X lines)
            if(SPAM.slice(-lookBack).contains(message))
                markAsSpam(await element, 'plagiarism', message);

            // The message contains repetitive (more than X instances) words/phrases
            let regexp = RegExp(`(?<phrase>[\\S]{${ minLen },}?)${ "(?:(?:[^]+)?\\1)".repeat(minOcc - 1) }`, 'i');

            if(regexp.test(message))
                markAsSpam(await element, 'repetitive', message, regexp.exec(message).groups.phrase);

            return message;
        }

        Chat.get().map(Chat.onmessage = async line => {
            // If not run asynchronously, `SPAM = ...` somehow runs before `spamChecker` and causes all messages to be marked as plagiarism
            SPAM = [
                ...SPAM,
                await spamChecker(
                    line.element,
                    line.message,
                    line.author,
                    parseInt(Settings.prevent_spam_look_back ?? 15),
                    parseInt(Settings.prevent_spam_minimum_length ?? 3),
                    parseInt(Settings.prevent_spam_ignore_under ?? 5)
                )
            ].isolate();
        });

        StopWatch.stop('prevent_spam');
    };
    Timers.prevent_spam = -1000;

    __PreventSpam__:
    if(parseBool(Settings.prevent_spam)) {
        $remark("Adding spam event listener...");

        RegisterJob('prevent_spam');
    }


    /*** Simplify Chat
     *       _____ _                 _ _  __          _____ _           _
     *      / ____(_)               | (_)/ _|        / ____| |         | |
     *     | (___  _ _ __ ___  _ __ | |_| |_ _   _  | |    | |__   __ _| |_
     *      \___ \| | '_ ` _ \| '_ \| | |  _| | | | | |    | '_ \ / _` | __|
     *      ____) | | | | | | | |_) | | | | | |_| | | |____| | | | (_| | |_
     *     |_____/|_|_| |_| |_| .__/|_|_|_|  \__, |  \_____|_| |_|\__,_|\__|
     *                        | |             __/ |
     *                        |_|            |___/
     */
    let SimplifyChatIndexToggle = 0;

    Handlers.simplify_chat = () => {
        if(parseBool(Settings.simplify_chat_monotone_usernames))
            AddCustomCSSBlock('Simplify Chat Monotone Usernames', `[data-a-target="chat-message-username"i] { color: var(--color-text-base) !important }`);

        if(parseBool(Settings.simplify_chat_font) || parseBool(Settings.simplify_page_font)) {
            let src = Runtime.getURL('/font');

            AddCustomCSSBlock('Simplify Page Font', `body { font-family: ${ Settings.simplify_page_font }, Sans-Serif !important }`);
            AddCustomCSSBlock('Simplify Chat Font', `[data-a-target*="chat"i][data-a-target*="message"i] { font-family: ${ Settings.simplify_chat_font }, Sans-Serif !important }`);

            AddCustomCSSBlock('Simplify Font (Head)', `
            @font-face {
                font-family: Roobert;
                font-weight: normal;
                src: url("${ src }/Roobert.woff2") format("woff2");
            }

            @font-face {
                font-family: Roobert;
                font-weight: bold;
                src: url("${ src }/Roobert-Bold.woff2") format("woff2");
            }

            @font-face {
                font-family: Dyslexie;
                font-weight: 100 400;
                src: url("${ src }/Dyslexie-Regular.woff") format("woff");
            }

            @font-face {
                font-family: Dyslexie;
                font-weight: 500 900;
                src: url("${ src }/Dyslexie-Bold.woff") format("woff");
            }

            @font-face {
                font-family: "04b03";
                font-weight: normal;
                src: url("${ src }/04b03.woff2") format("woff2");
            }

            @font-face {
                font-family: Inter;
                font-style: normal;
                font-weight: normal;
                src: url("${ src }/Inter.woff") format("woff");
                unicode-range:
                    U+00??, U+0131, U+0152-0153, U+02bb-02bc, U+02c6, U+02da, U+02dc, U+2000-206f,
                    U+2074, U+20ac, U+2122, U+2191, U+2193, U+2212, U+2215, U+feff, U+fffd;
            }
            `);
        }

        if(parseBool(Settings.simplify_chat))
            AddCustomCSSBlock('Simplify Chat', `.tt-visible-message-even { background-color: #8882 }`);

        Chat.get().map(Chat.defer.onmessage = async line => {
            let allNodes = node => (node.childNodes.length? [...node.childNodes].map(allNodes): [node]).flat();

            let element = await line.element;
            let keep = !(element.hasAttribute('data-plagiarism') || element.hasAttribute('data-repetitive') || element.hasAttribute('tt-hidden-message'));

            if(keep) {
                element.classList.add(`tt-visible-message-${ ['even', 'odd'][SimplifyChatIndexToggle ^= 1] }`);

                allNodes(element)
                    .filter(node => node.nodeName.equals('text'))
                    .map(text => text.nodeValue = text.nodeValue.normalize('NFKD'));
            }
        });
    };
    Timers.simplify_chat = -250;

    Unhandlers.simplify_chat = () => {
        ['SimplifyChat', 'SimplifyChatMonotoneUsernames', 'SimplifyChatFont'].map(block => RemoveCustomCSSBlock(block));
    };

    __SimplifyChat__:
    // Always enabled
    if(true) {
        $remark("Applying readability settings...");

        RegisterJob('simplify_chat');
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
        new StopWatch('convert_bits');

        let dropdown = $('[class*="bits-buy"i]'),
            bits_counter = $.all('[class*="bits-count"i]:not([tt-tusda])'),
            bits_cheer = $.all('[class*="cheer-amount"i]:not([tt-tusda])'),
            hype_trains = $.all('[class*="community-highlight-stack"i] p:not([tt-tusda])');

        let bits_num_regexp = /([\d,]+)(?: +bits)?/i,
            bits_alp_regexp = /([\d,]+) +bits/i;

        let _0 = /(\D\d)$/;

        if(defined(dropdown))
            $.all('h5:not([tt-tusda])', dropdown).map(header => {
                let bits = parseInt(header.textContent.replace(/\D+/g, '')),
                    usd;

                usd = (bits * .01).toFixed(2);

                header.append(furnish.var(` ($${ comify(usd).replace(_0, '$10') })`));

                header.setAttribute('tt-tusda', usd);
            });

        for(let counter of bits_counter) {
            let { innerHTML } = counter;

            if(bits_alp_regexp.test(innerHTML))
                counter.innerHTML = innerHTML.replace(bits_alp_regexp, ($0, $1, $$, $_) => {
                    let bits = parseInt($1.replace(/\D+/g, '')),
                        usd;

                    usd = (bits * .01).toFixed(2);

                    counter.setAttribute('tt-tusda', usd);

                    return `${ $0 } ${ furnish.var(`($${ comify(usd).replace(_0, '$10') })`).outerHTML }`;
                });
        }

        for(let cheer of bits_cheer) {
            let { innerHTML } = cheer;

            if(bits_num_regexp.test(innerHTML))
                cheer.innerHTML = innerHTML.replace(bits_num_regexp, ($0, $1, $$, $_) => {
                    let bits = parseInt($1.replace(/\D+/g, '')),
                        usd;

                    usd = (bits * .01).toFixed(2);

                    cheer.setAttribute('tt-tusda', usd);

                    return `${ $0 } ${ furnish.var(`($${ comify(usd).replace(_0, '$10') })`).outerHTML }`;
                });
        }

        for(let train of hype_trains) {
            let { innerHTML } = train;

            if(bits_alp_regexp.test(innerHTML))
                train.innerHTML = innerHTML.replace(bits_alp_regexp, ($0, $1, $$, $_) => {
                    let bits = parseInt($1.replace(/\D+/g, '')),
                        usd;

                    usd = (bits * .01).toFixed(2);

                    train.setAttribute('tt-tusda', usd);

                    return `${ $0 } ${ furnish.var(`($${ comify(usd).replace(_0, '$10') })`).outerHTML }`;
                });
        }

        StopWatch.stop('convert_bits');
    };
    Timers.convert_bits = 1000;

    __ConvertBits__:
    if(parseBool(Settings.convert_bits)) {
        $remark("Adding Bit converter...");

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
        REWARDS_CALCULATOR_TEXT;

    Handlers.rewards_calculator = () => {
        new StopWatch('rewards_calculator');

        __GetMultiplierAmount__:
        if(nullish(CHANNEL_POINTS_MULTIPLIER)) {
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
                    CHANNEL_POINTS_MULTIPLIER = 1;
                    break __GetMultiplierAmount__;
                }

                let mux = btn.textContent.replace(/.*\((.+)\).*/, ($0, $1, $$, $_) => parseFloat($1));
                let bal = btn.ariaLabel?.replace(/.*([\d\.,]).*/, '$1') ?? 0;

                CHANNEL_POINTS_MULTIPLIER = (mux | 0? mux: 1);

                button.click();
            } else {
                CHANNEL_POINTS_MULTIPLIER = 1;
            }
        }

        let container = $('[data-test-selector*="required"i][data-test-selector*="points"i]:not(:empty)')?.closest?.('button');

        if(nullish(container)) {
            StopWatch.stop('rewards_calculator');

            RemoveCustomCSSBlock('tt-rewards-calc');
        }

        // https://theemergence.co.uk/when-is-the-best-time-to-stream-on-twitch/#faq-question-1565821275069
            // Average broadcast time is 4.5h
            // Average number of streamed days is 5 (Mon - Fri)
        let averageBroadcastTime = ((STREAMER.data?.dailyBroadcastTime ?? 16_200_000) / 3_600_000).clamp(0, 24),
            activeDaysPerWeek = (STREAMER.data?.activeDaysPerWeek ?? 5).clamp(1, 7),
            pointsEarnedPerHour = 120 + (200 * +Settings.auto_claim_bonuses); // https://help.twitch.tv/s/article/channel-points-guide
        let timeLeftInBroadcast = averageBroadcastTime - (STREAMER.time / 3_600_000);

        // Set the progress bar of the button
        let have = parseFloat(parseCoin($.last('[data-test-selector*="balance-string"i]')?.innerText) | 0),
            este = parseFloat(timeLeftInBroadcast * pointsEarnedPerHour * CHANNEL_POINTS_MULTIPLIER),
            goal = parseFloat($('[data-test-selector*="required"i][data-test-selector*="points"i]')?.previousSibling?.textContent?.replace(/\D+/g, '') | 0),
            need = goal - have;

        container?.modStyle(`background:linear-gradient(to right,var(--color-background-button-primary-default) 0 ${ (100 * (have / goal)).toFixed(3) }%,var(--color-opac-p-8) 0 ${ (100 * ((have + este) / goal)).toFixed(3) }%,var(--color-background-button-disabled) 0 0); color:var(--color-text-base)!important; text-shadow:0 0 1px var(--color-background-alt);`);

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

        StopWatch.stop('rewards_calculator');
    };
    Timers.rewards_calculator = 250;

    __RewardsCalculator__:
    if(parseBool(Settings.rewards_calculator)) {
        $remark("Adding Rewards Calculator...");

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
        let placement;

        if((placement = Settings.points_receipt_placement ??= "null").equals("null"))
            return;

        let coin = $.last('[data-test-selector*="balance-string"i]')?.closest('button')?.querySelector('img[alt]');

        let balance = $.last('[data-test-selector*="balance-string"i]')?.innerText,
            exact_debt = $('[data-test-selector^="prediction-checkout"i], [data-test-selector*="user-prediction"i][data-test-selector*="points"i], [data-test-selector*="user-prediction"i] p')?.innerText,
            exact_change = $('[class*="points"i][class*="summary"i][class*="add-text"i]')?.innerText;

        top.postMessage({ action: 'jump', points_receipt_placement: { balance, coin_face: coin?.src, coin_name: coin?.alt, exact_debt, exact_change } }, location.origin);
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
        new StopWatch('recover_chat');

        let [chat] = $.all('[role] ~ *:is([role="log"i], [class~="chat-room"i], [data-a-target*="chat"i], [data-test-selector*="chat"i]), [role="tt-log"i], [data-test-selector="banned-user-message"i], [data-test-selector^="video-chat"i]'),
            error = $('[class*="chat"i][class*="content"] .core-error');

        if(defined(error)) {
            $('[data-a-target*="welcome"i]')?.append(furnish('p', { style: 'text-decoration:underline var(--color-error)' }, `There was an error loading chat: ${ error.textContent }`));
            error.remove();
        }

        if(defined(chat))
            return;

        // Add an iframe...
        let [,name] = ([,STREAMER?.name] ?? location.pathname.split(/\W/, 2)),
            input = $('.chat-input'),
            iframe = furnish(`iframe#tt-popup-container.stream-chat.tt-c-text-base.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-full-height.tt-relative`, {
                src: `./popout/${ name }/chat`,
                role: "tt-log",
            }),
            container = $('.chat-shell', top.document);

        container?.parentElement?.replaceChild(iframe, container);

        StopWatch.stop('recover_chat');
    };
    Timers.recover_chat = 500;

    __RecoverChat__:
    if(parseBool(Settings.recover_chat)) {
        RegisterJob('recover_chat');
    }

    /*** Reocver Messages
     *      _____                                __  __
     *     |  __ \                              |  \/  |
     *     | |__) |___  ___ _____   _____ _ __  | \  / | ___  ___ ___  __ _  __ _  ___  ___
     *     |  _  // _ \/ __/ _ \ \ / / _ \ '__| | |\/| |/ _ \/ __/ __|/ _` |/ _` |/ _ \/ __|
     *     | | \ \  __/ (_| (_) \ V /  __/ |    | |  | |  __/\__ \__ \ (_| | (_| |  __/\__ \
     *     |_|  \_\___|\___\___/ \_/ \___|_|    |_|  |_|\___||___/___/\__,_|\__, |\___||___/
     *                                                                       __/ |
     *                                                                      |___/
     */
    let RESTORED_MESSAGES = new Set;

    Handlers.recover_messages = async() => {
        new StopWatch('recover_messages');

        restoring: for(let [uuid, line] of Chat.messages) {
            if(RESTORED_MESSAGES.has(uuid))
                continue restoring;
            if($.defined(`main [data-test-selector*="chat"i][data-test-selector*="message"i][data-test-selector*="container"i] [data-uuid="${ uuid }"i]`))
                continue restoring;

            let { author, handle, message, emotes, badges, style } = line;
            let element = await line.element,
                deleted = await line.deleted;

            if(defined(element.dataset.plagiarism) || defined(element.dataset.repetitive) || parseBool(element.dataset.restored))
                continue restoring;

            element.dataset.uuid ||= uuid;

            if(!deleted || !message?.length || author.equals(USERNAME))
                continue restoring;

            let f = furnish;
            let container = $(`[data-a-target^="chat"i] [data-a-target*="deleted"i]`)?.closest(`[data-a-user]`);

            if(parseBool(container?.dataset?.resurrected))
                continue restoring;

            // The message was deleted before the element was placed
            if(nullish(container)) {
                container = f(`.chat-line__message[@aTarget="chat-line-message" @aUser="${ author }" @testSelector="chat-line-message" align-items="center" @uuid="${ uuid }"]`).with(
                    f('[style="position:relative"]').with(
                        f('.chat-line__message-highlight[@testSelector="chat-message-highlight" style="border-radius:.4rem; position:absolute"]'),
                        f('.chat-line__message-container[style="position:relative"]').with(
                            f('').with(
                                f('.chat-line__no-background[style="display:inline"]').with(
                                    f('.chat-line__username-container[style="display:inline-block"]').with(
                                        // Chat badges
                                        f('span').with(
                                            ...badges.map(name =>
                                                f('button[@aTarget=chat-badge]').with(
                                                    // /badges/{version}/{UUID}/{size}
                                                    // Broadcaster → https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1
                                                    f(`img.chat-badge[alt="${ name }"]`, { src: `//static-cdn.jtvnw.net/badges/v1/${ TTV_BADGES.get(name) }/1` })
                                                )
                                            )
                                        ),
                                        f('span.chat-line__username[role=button]').with(
                                            f.span(
                                                f(`span.chat-author__display-name[@aTarget="chat-message-username" @aUser="${ author }" @testSelector="message-username" style="${ style }"]`).text(handle)
                                            )
                                        )
                                    ),
                                    f('span[@testSelector=chat-message-separator]').text(': '),
                                    f('span[@testSelector=chat-line-message-placeholder]').text(message)
                                )
                            )
                        ),
                        f('.chat-line__icons')
                    )
                );

                $('[role] ~ *:is([role="log"i], [class~="chat-room"i], [data-test-selector*="chat"i][data-test-selector*="message"i][data-test-selector*="container"i]) [role]')?.append(container);
            }

            let body = $(`[data-test-selector$="message-placeholder"i]`, container),
                user = $(`[data-a-user="${ author }"i]`, container)?.dataset?.aUser;

            if(nullish(body) || nullish(user))
                continue restoring;
            if(user.unlike(author) && user.unlike(handle))
                continue restoring;

            RESTORED_MESSAGES.add(uuid);

            $notice(`Restoring message (${ uuid }):`, line);

            // Fragmented...
            if(emotes.length > 0) {
                let inter = [], final = [];

                for(let word of message.split(' ').filter(s => s.length))
                    inter.push(
                        emotes.contains(word)
                        // Create an emote button...
                        ? f('.chat-line__message--emote-button[@testSelector=emote-button]').with(
                            f('div').with(
                                f('span[@aTarget=emote-name]').with(
                                    f('.chat-image__container').with(
                                        f(`img.chat-image.chat-line__message--emote[alt="${ word }"][src="${ Chat.emotes.get(word) }"]`)
                                    )
                                )
                            )
                        )
                        // Just push the message...
                        : word
                    );

                let fragments = [];
                for(let word of inter)
                    if(typeof word == 'string') {
                        fragments.push(word);
                    } else {
                        if(fragments.length)
                            final.push(f('.text-fragment[@aTarget=chat-message-text]').with(fragments.join(' ')));
                        final.push(word);

                        fragments = [];
                    }

                if(fragments.length)
                    final.push(f('.text-fragment[@aTarget=chat-message-text]').with(fragments.join(' ')));

                body.innerHTML = final.map(e => e.outerHTML).join(' ');
            } else {
                body.innerText = message;
            }

            container.dataset.uuid = uuid;
            container.dataset.resurrected = true;

            let target = $('[data-a-target*="deleted"i]', container);

            if(defined(target))
                target.dataset.aTarget = 'chat-restored-message-placeholder';

            $notice(`Restored message "${ author }: ${ message }"`, { line, container });
        }

        StopWatch.stop('recover_messages');
    };
    // Variable timer...
    Timers.recover_messages = +5000;

    __RecoverChat__:
    if(parseBool(Settings.recover_messages)) {
        RegisterJob('recover_messages');

        // Adjust the tiemr dynamically...
        setInterval(() => {
            let actual = Timers.recover_messages,
                desired = Math.max(0
                    , actual
                    , (500 + (parseInt($('[data-a-target$="viewers-count"i], [class*="stream-info-card"i] [data-test-selector$="description"i]')?.textContent?.replace(/\D+/g, '')) | 0))
                ).floorToNearest(100).clamp(1e3, 10e3),
                [min, max] = [desired, actual].sort((a, b) => a - b);

            // The timer has deviated by more than 15%
            if((min / max) < .85) {
                Timers.recover_messages = desired;

                RestartJob('recover_messages', `timer-deviation:Timer has deviated more than 15% → min:${ (min / 1000).suffix('s') }; max:${ (max / 1000).suffix('s') }`);
            }
        }, 1000);
    }

    // End of Chat__Initialize
};
// End of Chat__Initialize

let Chat__Initialize_Safe_Mode = async({ banned = false, hidden = false }) => {
    let here = parseURL(window.location.href);
    let fsData = Object.assign(await Runtime.sendMessage({ action: 'FETCH_SHARED_DATA' }), top);

    let {
        USERNAME = Search?.cookies?.name,
        LANGUAGE,
        THEME,

        PATHNAME = here.pathname,
        NORMALIZED_PATHNAME = here.pathname.replace(/^\/(?:moderator|popout)\/(\/[^\/]+?)/i, '$1').replace(/^(\/[^\/]+?)\/(?:about|schedule|squad|videos)\b/i, '$1'),
        STREAMER = ({
            get href() { return `https://www.twitch.tv/${ STREAMER.name }` },
            get name() { return here.searchParameters.channel },
            get live() { return !$.all('[href*="offline_embed"i]').length },
            get sole() { return parseInt($('img[class*="channel"i][class*="point"i][class*="icon"i]')?.src?.replace(/[^]*\/(\d+)\/[^]*/, '$1')) || null },
        }),

        GLOBAL_EVENT_LISTENERS = {},
    } = fsData;

    // Fill STREAMER
    let [path, name, endpoint] = location.pathname.split(/(?<!^)\//);

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
    /*** Greedy Raiding
     *       _____                   _         _____       _     _ _
     *      / ____|                 | |       |  __ \     (_)   | (_)
     *     | |  __ _ __ ___  ___  __| |_   _  | |__) |__ _ _  __| |_ _ __   __ _
     *     | | |_ | '__/ _ \/ _ \/ _` | | | | |  _  // _` | |/ _` | | '_ \ / _` |
     *     | |__| | | |  __/  __/ (_| | |_| | | | \ \ (_| | | (_| | | | | | (_| |
     *      \_____|_|  \___|\___|\__,_|\__, | |_|  \_\__,_|_|\__,_|_|_| |_|\__, |
     *                                  __/ |                               __/ |
     *                                 |___/                               |___/
     */
    // May not always fire, sometimes Twitch prevents banners from being displayed in iframes
    let RAID_LOGGED = false;
    Handlers.greedy_raiding = () => {
        let raiding = $.defined('[data-test-selector="raid-banner"i]'),
            atTop = (top == window);

        if(RAID_LOGGED || atTop || !raiding)
            return;
        RAID_LOGGED ||= raiding;

        let { current = false } = parseBool(parseURL(location).searchParameters);
        let raid_banner = $.all('[data-test-selector="raid-banner"i] strong').map(strong => strong?.innerText),
            [,from,] = location.pathname.split(/(?<!^)\//),
            [to] = raid_banner.filter(name => !RegExp(`^${ from }$`, 'i').test(name));

        // Already on the channeling that's raiding...
        if(current)
            return;

        $warn(`There is a raid happening on another channel... ${ from } → ${ to } (${ raid_banner.join(' to ') })`);

        Runtime.sendMessage({ action: 'LOG_RAID_EVENT', data: { from, to } }, async({ events }) => {
            $warn(`${ from } has raided ${ events } time${ (events != 1? 's': '') } this week. Current raid: ${ to } @ ${ (new Date) }`);

            let payable = $.defined('[data-test-selector*="balance-string"i]');

            top.postMessage({ action: 'raid', from, to, events, payable }, location.origin);
        });
    };
    Timers.greedy_raiding = 5000;

    Unhandlers.greedy_raiding = () => {};

    __GreedyRaiding__:
    if(parseBool(Settings.greedy_raiding)) {
        // $remark('[CHILD] Adding raid-watching logic...');

        RegisterJob('greedy_raiding');
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
    /*** Point Watcher (Helper)
     *      _____      _       _    __          __   _       _
     *     |  __ \    (_)     | |   \ \        / /  | |     | |
     *     | |__) |__  _ _ __ | |_   \ \  /\  / /_ _| |_ ___| |__   ___ _ __
     *     |  ___/ _ \| | '_ \| __|   \ \/  \/ / _` | __/ __| '_ \ / _ \ '__|
     *     | |  | (_) | | | | | |_     \  /\  / (_| | || (__| | | |  __/ |
     *     |_|   \___/|_|_| |_|\__|     \/  \/ \__,_|\__\___|_| |_|\___|_|
     *
     *
     */
    let pointWatcherCounter = 0,
        hasPointsEnabled = false,
        ALL_CHANNEL_POINT_REWARDS;

    Handlers.point_watcher_helper = async() => {
        if(top.__readyState__ == "unloading")
            return;

        Cache.load(['ChannelPoints'], ({ ChannelPoints }) => {
            let [amount, fiat, face, notEarned, pointsToEarnNext] = ((ChannelPoints ??= {})[STREAMER.name] ?? 0).toString().split('|'),
                balance = $.last('[data-test-selector*="balance-string"i]'),
                allRewards = ALL_CHANNEL_POINT_REWARDS;

            hasPointsEnabled ||= defined(balance);

            amount = (STREAMER.coin = balance?.innerText ?? (hasPointsEnabled? amount: '&#128683;'));
            fiat = (STREAMER.fiat ??= fiat ?? 0);
            face = (STREAMER.face ??= face ?? `${ STREAMER.sole }`);
            notEarned = (
                (allRewards?.length)?
                    allRewards.filter(amount => parseCoin(amount?.innerText) > STREAMER.coin).length:
                (notEarned > -Infinity)?
                    notEarned:
                -1
            );
            pointsToEarnNext = (
                (allRewards?.length)?
                    allRewards
                        .map(amount => (parseCoin(amount?.innerText) > STREAMER.coin? parseCoin(amount?.innerText) - STREAMER.coin: 0))
                        .sort((x, y) => (x > y? -1: +1))
                        .filter(x => x > 0)
                        .pop():
                (notEarned > -Infinity)?
                    pointsToEarnNext:
                0
            );

            face = face?.replace(/^(?:https?:.*?)?([\d]+\/[\w\-\.\/]+)$/i, '$1');

            ChannelPoints[STREAMER.name] = [amount, fiat, face, notEarned, pointsToEarnNext].join('|');

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

            let jump = (STREAMER.jump?.[STREAMER.name?.toLowerCase?.()]?.stream?.points);

            // $notice('[secondary] How many channel points does the user have?', jump?.balance | 0);
            if(defined(jump?.balance))
                return;

            balanceButton.click();

            ALL_CHANNEL_POINT_REWARDS = $.all('[data-test-selector="cost"i]').map(e => ({ innerText: e.innerText, innerHTML: e.innerHTML, outerHTML: e.outerHTML }));

            wait(30).then(() => balanceButton.click());
        });
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
    /*** Soft Unban | tmarenko @ GitHub | https://github.com/tmarenko/twitch_chat_antiban
     *       _____        __ _     _    _       _
     *      / ____|      / _| |   | |  | |     | |
     *     | (___   ___ | |_| |_  | |  | |_ __ | |__   __ _ _ __
     *      \___ \ / _ \|  _| __| | |  | | '_ \| '_ \ / _` | '_ \
     *      ____) | (_) | | | |_  | |__| | | | | |_) | (_| | | | |
     *     |_____/ \___/|_|  \__|  \____/|_| |_|_.__/ \__,_|_| |_|
     *
     *
     */
    Handlers.soft_unban = () => {
        if(!STREAMER?.veto)
            return;

        $log(`Performing Soft Unban...`);

        let f = furnish;

        let name = (STREAMER.name || location.pathname.split(/\W/, 2)[1]).replace('/', ''),
            fiat = (STREAMER.fiat || 'Channel Points'),
            url = parseURL(`https://nightdev.com/hosted/obschat/`).addSearch({
                theme: `bttv_${ THEME }`,
                channel: name,
                fade: parseBool(Settings.soft_unban_fade_old_messages),
                bot_activity: parseBool(Settings.soft_unban_keep_bots),
                prevent_clipping: parseBool(Settings.soft_unban_prevent_clipping),
            }),
            iframe = f(`iframe#tt-proxy-chat`, { src: url.href, style: `width: 100%; height: 100%` }),
            preBanner =
                f('#tt-banned-banner.tt-pd-b-2.tt-pd-x-2').with(
                    f('.tt-border-t.tt-pd-b-1.tt-pd-x-2'),
                    f('.tt-align-center').with(
                        f('p.tt-c-text.tt-strong[@testSelector=current-user-timed-out-text]').with(
                            `Messages from ${ name } chat.`
                        ),
                        f('p.tt-c-text-alt-2').with(
                            `Unable to collect ${ fiat }.`
                        )
                    )
                ),
            chat, cont, banner;

        name = name?.replace(/(.)$/, ($0, $1, $$, $_) => $1 + (/([s])/i.test($1)? "'": "'s")) || 'this';
        fiat = fiat.replace(/([^s])$/i, '$1s');

        // Try the "old" method, then the new one
        try {
            chat = $('.chat-room__content > .tt-flex');
            banner = $('.chat-input').closest('.tt-block');

            banner.insertBefore(
                preBanner,
                banner.firstElementChild
            );

            chat.classList.remove(...chat.classList);
            chat.classList.add("chat-list--default", "scrollable-area");
            chat.replaceChild(iframe, chat.firstChild);
        } catch(error) {
            $warn(`Could not perform "old" unban method`, error);

            chat = $('.chat-input');
            cont = chat.previousElementSibling;

            try {
                chat.insertBefore(
                    preBanner,
                    chat.firstElementChild
                );

                cont.replaceChild(iframe, cont.firstChild);
            } catch(error) {
                $warn(`Could not perform "new" unban method`, error);
            }
        }
    };
    Timers.soft_unban = -2_500;

    Unhandlers.soft_unban = () => {
        let iframe = $('iframe#tt-proxy-chat'),
            div = furnish('.tt-flex');

        if(nullish(iframe))
            return;

        iframe.parentElement.replaceChild(div, iframe);
    };

    __SoftUnban__:
    if(parseBool(Settings.soft_unban)) {
        RegisterJob('soft_unban');
    }

    // Helpers
    __Static_Helpers__:
    if(IS_A_FRAMED_CONTAINER) {
        // Do something to send up...
    }
    // End of Chat__Initialize_Safe_Mode
};
// End of Chat__Initialize_Safe_Mode

let Chat__PAGE_CHECKER,
    Chat__WAIT_FOR_PAGE,
    Chat__SETTING_RELOADER;

Chat__PAGE_CHECKER = setInterval(Chat__WAIT_FOR_PAGE = async() => {
    // Only executes if the user is banned
    let banned = parseBool(STREAMER?.veto || $.all('[class*="banned"i]')?.length);

    // Keep hidden iframes from loading resources
    let hidden = parseBool(parseURL(location).searchParameters?.hidden);

    if([banned, hidden].map(parseBool).contains(true)) {
        if(!parseBool(hidden))
            $warn('[NON_FATAL] Child container unavailable. Is it a ban? ', ['No', 'Yes'][+banned], 'Is chat embedded and hidden?', ['No', 'Yes'][+hidden]);

        wait(5000).then(() => Chat__Initialize_Safe_Mode({ banned, hidden }));
        clearInterval(Chat__PAGE_CHECKER);

        return await Settings.get();
    }

    // Only executes if the user is NOT banned
    let ready = (true
        // The main controller is ready
        && (false
            || parseBool(top.MAIN_CONTROLLER_READY)
            || (false
                // This window is the main container
                || (true
                    && top == window
                    && top.document.readyState.equals('complete')

                    // The follow button exists
                    && $.defined(`[data-a-target="follow-button"i], [data-a-target="unfollow-button"i]`)

                    // There are channel buttons on the side
                    && parseBool($.all('[id*="side"i][id*="nav"i] .side-nav-section[aria-label]')?.length)
                )

                // This window is not the main container
                || (true
                    && IS_A_FRAMED_CONTAINER
                    && document.readyState.equals('complete')

                    // There is a welcome message container
                    && $.defined(`[data-a-target*="welcome"i]`)
                )
            )
        )
        // There isn't an advertisement playing
        && $.nullish('[data-test-selector*="sad"i][data-test-selector*="overlay"i]')

        // There is at least one proper container
        && (false
            // There is a message container
            || $.defined('[data-test-selector$="message-container"i]')

            // There is an error message
            || $.defined('[data-a-target="core-error-message"i]')
        )
    );

    if(!ready)
        return;

    $log("Child container ready");

    await Settings.get();

    wait(5000).then(Chat__Initialize);
    clearInterval(Chat__PAGE_CHECKER);

    window.CHILD_CONTROLLER_READY = true;

    // Only re-execute if in an iframe
    if(IS_A_FRAMED_CONTAINER) {
        // Observe [top] location changes
        LocationObserver: {
            let { body } = document,
                observer = new MutationObserver(mutations => {
                    mutations.map(mutation => {
                        if(PATHNAME !== window.location.pathname) {
                            let OLD_HREF = PATHNAME;

                            PATHNAME = window.location.pathname;

                            NORMALIZED_PATHNAME = PATHNAME
                                // Remove common "modes"
                                .replace(/^\/(?:moderator|popout)\/(\/[^\/]+?)/i, '$1')
                                .replace(/^(\/[^\/]+?)\/(?:about|schedule|squad|videos)\b/i, '$1');

                            for(let [name, func] of (top?.__ONLOCATIONCHANGE__ ?? []))
                                func(new CustomEvent('locationchange', { from: OLD_HREF, to: PATHNAME }));
                        }
                    });
                });

            observer.observe(body, { childList: true, subtree: true });
        }

        // Observe chat
        let CHAT_SELF_REFLECTOR;

        ChatObserver: {
            let [CHANNEL] = location.pathname.toLowerCase().slice(1).split('/').slice(+IS_A_FRAMED_CONTAINER),
                USERNAME = Search.cookies.login;

            CHANNEL = `#${ CHANNEL }`;

            // Simple WebSocket → https://dev.twitch.tv/docs/irc
            if(defined(TTV_IRC.sockets[CHANNEL]))
                return;

            Object.defineProperty(TTV_IRC, 'wsURL_chat', {
                value: `wss://irc-ws.chat.twitch.tv:443`,

                writable: false,
                enumerable: false,
                configurable: false,
            });

            let socket = (TTV_IRC.sockets[CHANNEL] = new WebSocket(TTV_IRC.wsURL_chat));

            let START_WS = socket.onopen = event => {
                $log(`Chat Relay (child) connected to "${ CHANNEL }"`);

                // CONNECTING → 0; OPEN → 1; CLOSING → 2; CLOSED → 3
                when(() => socket.readyState === WebSocket.OPEN)
                    .then(() => {
                        socket.send(`CAP REQ :twitch.tv/commands twitch.tv/membership twitch.tv/tags`);
                        socket.send(`PASS oauth:${ Search.cookies.auth_token }`);
                        socket.send(`NICK ${ USERNAME.toLowerCase() }`);
                    });

                let restrictions = (TTV_IRC.restrictions ??= new Map);

                socket.onmessage = socket.reflect = CHAT_SELF_REFLECTOR = async event => {
                    let messages = event.data.trim().split('\r\n').map(TTV_IRC.parseMessage).filter(defined);

                    // $remark('Chat Relay received messages', messages);

                    for(let { command, parameters, source, tags } of messages) {
                        const channel = (command.channel ?? CHANNEL).toLowerCase();
                        const usable = parseBool(channel.equals(CHANNEL));

                        switch(command.command) {
                            // Successful login attempt
                            case '001': {
                                socket.send(`JOIN ${ CHANNEL }`);
                                // TODO | To be removed Feb 18, 2024 → https://dev.twitch.tv/docs/irc/chat-commands/#migration-guide
                                socket.send(`PRIVMSG ${ CHANNEL } :/mods`);
                                socket.send(`PRIVMSG ${ CHANNEL } :/vips`);
                            } break;

                            // PONG the server back...
                            case 'PING': {
                                socket.send(`PONG ${ parameters }`);
                            } break;

                            // Someone joined the server
                            case 'JOIN': {
                                // $log(`New user "${ source.nick }" on ${ channel }`);

                                Chat.gang?.push(source.nick);
                            } break;

                            // Kicked!
                            case 'PART': {
                                // $warn(`Unable to relay messages from "${ source.nick }" on ${ channel }`);

                                if(USERNAME.equals(source.nick))
                                    socket.close();

                                Chat.gang = Chat.gang?.filter(user => user.unlike(source.nick));
                            } break;

                            // Something happened...
                            case 'NOTICE': {
                                if('room_mods mod_success unmod_success no_mods vips_success vip_success unvip_success no_vips'.contains(tags?.msg_id)) {
                                    let msg = tags.msg_id,
                                        typ = msg.replace(/.*((?:mod|vip)s?).*/i, '$1').toLowerCase();

                                    Chat[CHANNEL] ??= { mods: [], vips: [] };

                                    if(msg.startsWith('no_'))
                                        /* Do nothing */;
                                    else if(/^(mod|vip)_/i.test(msg))
                                        Chat[CHANNEL][typ].push(parameters.replace(/.*added\s+(\S+).*/i, '$1').toLowerCase());
                                    else if(/^un(mod|vip)_/i.test(msg))
                                        Chat[CHANNEL][typ] = Chat[CHANNEL][typ].filter(name => name.unlike(parameters.replace(/.*removed\s+(\S+).*/i, '$1')));
                                    else
                                        Chat[CHANNEL][typ].push(...parameters.replace(/^[^:]*(.+?)\.?$/, ($0, $1) => $1.replace(/[:\s]+/g, '').toLowerCase()).split(','));
                                } else {
                                    if(/^((?:bad|msg|no|un(?:available|recognized))_|(?:invalid)|_(?:banned|error|limit|un(?:expected)))/i.test(tags?.msg_id))
                                        $warn(`There's an error on ${ channel }: ${ parameters }`, { command, parameters, source, tags });
                                    else
                                        $warn(`Something's happening on ${ channel }: ${ parameters }`, { command, parameters, source, tags });

                                    // socket.send(`PART ${ channel }`);
                                }
                            } break;

                            // Status(es) of the room
                            case 'ROOMSTATE': {
                                let { room_id, emote_only, followers_only, r9k, slow, subs_only } = tags;

                                restrictions.set(channel, {
                                    room_id,
                                    emote_only: parseBool(+emote_only),
                                    followers_only: (+followers_only > 0? +followers_only * 60_000: !1),
                                    r9k: parseBool(+r9k),
                                    slow: (+slow * 1000),
                                    subs_only: parseBool(+subs_only),
                                });
                            } break;

                            // Something happened (alert)
                            case 'USERNOTICE': {
                                let { id, msg_id, system_msg } = tags;

                                let message = (system_msg ?? parameters).replace(/\\s/g, ' '),
                                    mentions = message.split(/(@\S+)/).filter(s => s.startsWith('@')).map(s => s.slice(1).toLowerCase()),
                                    subject = (
                                        'sub resub'.split(' ').contains(msg_id)?
                                            'dues':
                                        'giftpaidupgrade anongiftpaidupgrade'.split(' ').contains(msg_id)?
                                            'keep':
                                        'subgift rewardgift submysterygift rewardmysterygift'.split(' ').contains(msg_id)?
                                            'gift':
                                        'raid unraid'.split(' ').contains(msg_id)?
                                            'raid': // incoming raids
                                        'pointsredeemed'.split(' ').contains(msg_id)?
                                            'coin':
                                        // ritual (new_chatter, etc.); bitsbadgetier (100, 1000, 10000, etc.)
                                        'note'
                                    ),
                                    element = when.defined(async(message, subject) =>
                                        // TODO: get bullets via text content
                                        $.all('[role] ~ *:is([role="log"i], [class~="chat-room"i], [data-a-target*="chat"i], [data-test-selector*="chat"i]) *:is(.tt-accent-region, [data-test-selector="user-notice-line"i], [class*="notice"i][class*="line"i], [class*="gift"i]:not([class*="count"i]), [data-test-selector="announcement-line"i], [class*="announcement"i][class*="line"i])')
                                            .find(element => {
                                                let A = message.mutilate();
                                                let B = element.textContent.mutilate();

                                                if(A.length < B.length)
                                                    [A, B] = [B, A];

                                                if(false
                                                    // The element already has a UUID and type
                                                    || (true
                                                        && element.dataset.uuid
                                                        && element.dataset.type
                                                    )
                                                    // The text matches less than 40% of the message
                                                    || A.slice(0, B.length).errs(B) > .6
                                                )
                                                    return false;

                                                if(subject?.equals('coin')) {
                                                    let I;

                                                    STREAMER.shop?.map(item => {
                                                        if(true
                                                            && item.prompt.length > (I?.prompt?.length | 0)
                                                            && item.prompt.mutilate().errs(A) < (I?.prompt?.mutilate()?.errs(A) ?? 1)
                                                            && item.available
                                                            && item.enabled
                                                            && !(item.hidden || item.paused)
                                                        ) I = item;
                                                    });

                                                    if(defined(I))
                                                        element.dataset.shopItemId = I.id;
                                                }

                                                element.dataset.uuid ||= UUID.from(element.getPath());
                                                element.dataset.type ||= subject;

                                                return message.mutilate().errs(element.textContent.mutilate()) < .2;
                                            })
                                        , 100, message, subject);

                                let results = {
                                    element,
                                    usable,
                                    message,
                                    subject,
                                    mentions,
                                    timestamp: new Date,

                                    // TODO: see if there are extra `msg_id` values
                                    msg_id,
                                };

                                Chat.__allbullets__.add(results);

                                for(let [name, callback] of Chat.__onbullet__)
                                    callback(results);

                                for(let [name, callback] of Chat.__deferredEvents__.__onbullet__)
                                    when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                for(let [name, callback] of Chat.__consumableEvents__.__onbullet__) {
                                    when(() => PAGE_IS_READY, 250).then(() =>
                                        callback(results).then(complete => {
                                            if(complete)
                                                Chat.__consumableEvents__.__onbullet__.delete(name);
                                        })
                                    );
                                }
                            } break;

                            // The channel is hosting...
                            case 'HOSTTARGET': {
                                if(!usable) continue;

                                let [to, amount] = parameters.split(' ', 2);

                                when.defined(() => STREAMER)
                                    .then(() => {
                                        for(let callback of STREAMER.__eventlisteners__.onhost)
                                            when(() => PAGE_IS_READY, 250).then(() => callback({ hosting: to.unlike('-') }));
                                    });
                            } break;

                            // Got a message...
                            case 'PRIVMSG': {
                                // $remark('PRIVMSG:', { command, parameters, source, tags });

                                // Bot commands...
                                if(defined(command.botCommand)) {
                                    let results = { name: command.botCommand, arguments: command.botCommandParams };

                                    for(let [name, callback] of Chat.__oncommand__)
                                        callback(results);

                                    for(let [name, callback] of Chat.__deferredEvents__.__oncommand__)
                                        when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                    for(let [name, callback] of Chat.__consumableEvents__.__oncommand__) {
                                        when(() => PAGE_IS_READY, 250).then(() =>
                                            callback(results).then(complete => {
                                                if(complete)
                                                    Chat.__consumableEvents__.__oncommand__.delete(name);
                                            })
                                        );
                                    }

                                    continue;
                                }

                                let author = source.nick,
                                    badges = Object.keys(tags?.badges ?? {}),
                                    message = parameters.replace(/^([\u0001-\u0007\u000e-\u001f])((?:\w+)\s*)([^]+)\1$/g, '$3').trim(),
                                    // Have to wait on the page to play catch-up...
                                    element = when.defined((message, uuid) =>
                                        $.all('[data-test-selector$="message-container"i] [data-a-target$="message"i]')
                                            .find(div =>
                                                $.all(`[data-a-user="${ author }"i]`, div)
                                                    .map(div => div.closest('[data-test-selector$="message"i], [data-a-target$="message"i]'))
                                                    .filter(defined)
                                                    .find(div => {
                                                        let text = [],
                                                            body = $('[data-test-selector$="message-body"i], [class*="message-container"i]', div);

                                                        if(nullish(body))
                                                            return;

                                                        for(let child of $.all('[class*="username"i][class*="container"i] ~ :last-child > *', body))
                                                            if(child.dataset.testSelector?.equals('emote-button')) {
                                                                text.push($('img', child).alt);
                                                            } else if(child.dataset.aTarget?.contains('timestamp')) {
                                                                continue;
                                                            } else if($.defined('var', child)) {
                                                                let { textContent } = child;

                                                                for(let v of $.all('var', child))
                                                                    textContent = textContent.replace(v.textContent, '');

                                                                child.textContent = textContent;
                                                            } else {
                                                                text.push(child.textContent);
                                                            }

                                                        let match = text.join('').mutilate(true).equals(message.mutilate(true));

                                                        if(match)
                                                            div.dataset.uuid = uuid;

                                                        return match
                                                    })
                                            )
                                        , 100, message, tags.id),
                                    emotes = Object.keys(tags.emotes ?? {}).map(key => {
                                        let emote = (tags.emotes[+key] || tags.emotes[key]).shift(),
                                            name = parameters.substring(+emote.startPosition, ++emote.endPosition),
                                            url = `https://static-cdn.jtvnw.net/emoticons/v2/${ key }/default/${ THEME }/1.0`;

                                        Chat.__allemotes__.set(name, url);

                                        return name;
                                    }),
                                    handle = tags.display_name,
                                    mentions = parameters.split(/(@\S+)/).filter(s => s.startsWith('@')).map(s => s.slice(1).toLowerCase()),
                                    raw = [(handle.unlike(author)? `${ handle } (${ author })`: handle), message].join(': '),
                                    reply = when.defined(e => e, 100, element).then(element => element?.querySelector('[class*="reply"i] button')),
                                    style = `color: ${ tags.color || '#9147FF' };`,
                                    uuid = tags.id,
                                    sent = (new Date).toJSON();

                                let results = {
                                    raw,
                                    sent,
                                    uuid,
                                    reply,
                                    style,
                                    author,
                                    emotes,
                                    badges,
                                    handle,
                                    usable,
                                    element,
                                    message,
                                    mentions,
                                    timestamp: new Date,
                                    highlighted: when.defined(e => e, 100, element).then(element => parseBool(element.dataset.testSelector?.contains('notice'))),
                                };

                                Object.defineProperties(results, {
                                    deleted: {
                                        get:(async function() {
                                            return Promise.race([this, wait(100).then(() => null)]).then(self => {
                                                return (self == null) || nullish(self?.parentElement) || $.defined('[data-a-target*="delete"i]:not([class*="spam-filter"i], [data-repetitive], [data-plagiarism])', self);
                                            });
                                        }).bind(element)
                                    },
                                });

                                Chat.__allmessages__.set(uuid, results);

                                for(let [name, callback] of Chat.__onmessage__)
                                    callback(results);

                                for(let [name, callback] of Chat.__deferredEvents__.__onmessage__)
                                    when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                for(let [name, callback] of Chat.__consumableEvents__.__onmessage__) {
                                    when(() => PAGE_IS_READY, 250).then(() =>
                                        callback(results).then(complete => {
                                            if(complete)
                                                Chat.__consumableEvents__.__onmessage__.delete(name);
                                        })
                                    );
                                }
                            } break;

                            // Got a whisper
                            case 'WHISPER': {
                                let results = { unread: 1, from: channel, message: parameters, timestamp: new Date };

                                for(let [name, callback] of Chat.__onwhisper__)
                                    callback(results);

                                for(let [name, callback] of Chat.__deferredEvents__.__onwhisper__)
                                    when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                for(let [name, callback] of Chat.__consumableEvents__.__onwhisper__) {
                                    when(() => PAGE_IS_READY, 250).then(() =>
                                        callback(results).then(complete => {
                                            if(complete)
                                                Chat.__consumableEvents__.__onwhisper__.delete(name);
                                        })
                                    );
                                }
                            } break;

                            default: continue;
                        };
                    }
                };
            };

            socket.onerror = event => {
                $warn(`Chat Relay (child) failed to connect to "${ CHANNEL }" → ${ JSON.stringify(event) }`);

                socket = (TTV_IRC.sockets[CHANNEL] = new WebSocket(TTV_IRC.wsURL_chat));
                START_WS(event);
            };

            socket.onclose = event => {
                $warn(`Chat Relay (child) closed unexpectedly → ${ JSON.stringify(event) }`);

                socket = (TTV_IRC.sockets[CHANNEL] = new WebSocket(TTV_IRC.wsURL_chat));
                START_WS(event);
            };

            // The socket closed...
            when(() => TTV_IRC.sockets[CHANNEL]?.readyState === WebSocket.CLOSED, 1000)
                .then(closed => {
                    $warn(`The WebSocket closed... Restarting in 5s...`);

                    wait(5000)
                        .then(() => {
                            if(parseBool(Settings.recover_chat))
                                return location.reload();
                            return TTV_IRC.sockets[CHANNEL] = new WebSocket(TTV_IRC.wsURL_chat);
                        })
                        .then(() => {
                            when(() => TTV_IRC.sockets[CHANNEL].readyState === WebSocket.OPEN, 500)
                                .then(() => TTV_IRC.sockets[CHANNEL].send(`JOIN ${ CHANNEL }`))
                                .then(() => TTV_IRC.sockets[CHANNEL].onmessage = TTV_IRC.sockets[CHANNEL].reflect = CHAT_SELF_REFLECTOR);
                        });
                });

                // Play catch-up...
                when.defined(() => $('[data-test-selector$="message-container"i]'), 100)
                    .then(chat => {
                        let unhandled = $.all('[data-a-target="chat-line-message"i]:not([data-uuid])', chat);

                        for(let element of unhandled) {
                            let raw = $('[class*="message"i][class*="container"i]', element).textContent.trim().replace($('[data-a-target="chat-timestamp"]', element)?.textContent || '', ''),
                                uuid = UUID.from(raw).toString(),
                                reply = $('[class*="reply"i] button', element),
                                style = $('[data-a-user]', element)?.getAttribute('style')?.trim(),
                                author = $('[data-a-user]', element).dataset.aUser,
                                emotes = new Set,
                                badges = new Set,
                                __bs__ = $.all('[class*="username"i][class*="container"i] [data-a-target*="badge"i] img', element).map(e => badges.add(e.alt.toLowerCase())),
                                handle = $('[data-a-user]', element).textContent,
                                usable = false,
                                message = raw.replace(/^[^:]+?:/, '').trim(),
                                mentions = $.all('[data-a-atrget*="mention"i]', element).map(e => e.textContent),
                                highlighted = parseBool(element.dataset.testSelector?.contains('notice'));

                            element.dataset.uuid = uuid;

                            emotes = [...emotes];
                            badges = [...badges];

                            let results = {
                                raw,
                                uuid,
                                reply,
                                style,
                                author,
                                emotes,
                                badges,
                                handle,
                                usable,
                                element,
                                message,
                                mentions,
                                highlighted,
                                deleted: $.defined('[data-a-target*="delete"i]', element),
                            };

                            Chat.__allmessages__.set(uuid, results);

                            for(let [name, callback] of Chat.__onmessage__)
                                when(() => PAGE_IS_READY, 250).then(() => callback(results));

                            for(let [name, callback] of Chat.__deferredEvents__.__onmessage__)
                                when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                            for(let [name, callback] of Chat.__consumableEvents__.__onmessage__) {
                                when(() => PAGE_IS_READY, 250).then(() =>
                                    callback(results).then(complete => {
                                        if(complete)
                                            Chat.__consumableEvents__.__onmessage__.delete(name);
                                    })
                                );
                            }
                        }
                    });
        }

        // Override variables
        Overrides: {
            window.ALLOWED_JOBS ??= (parseURL(location).searchParameters?.allow || '').split(',');

            // Registers a job
                // @override RegisterJob(JobName:string) → Number<IntervalID>
            window.RegisterJob = function RegisterJob(JobName, JobReason = 'default') {
                RegisterJob.__reason__ = JobReason;

                // Prevent disallowed jobs...
                if(ALLOWED_JOBS.length) {
                    // @performance
                    // Constaly clear the chat...
                    if(ALLOWED_JOBS.missing((v,i,a) => v.includes('chat')))
                        setInterval(() => {
                            for(let key in Chat)
                                Chat[key].clear?.();
                        }, 15_000);

                    if(ALLOWED_JOBS.missing(JobName))
                        return;
                }

                return Jobs[JobName] ??= Timers[JobName] > 0?
                    setInterval(Handlers[JobName], Timers[JobName]):
                -setTimeout(Handlers[JobName], -Timers[JobName]);
            }
        }
    }

    top.onlocationchange = () => {
        $warn("[Child] Re-initializing...");

        // Do NOT soft-reset ("turn off, turn on") these settings
        // They will be destroyed, including any data they are using
        let VOLATILE = top?.VOLATILE ?? [].map(AsteriskFn);

        DestroyingJobs:
        for(let job in Jobs)
            if(!!~VOLATILE.findIndex(name => name.test(job)))
                continue DestroyingJobs;
            else
                RestartJob(job, 'job-destruction:chat.js');

        Reinitialize:
        if(NORMAL_MODE) {
            if(parseBool(Settings.keep_popout)) {
                Chat__PAGE_CHECKER ??= setInterval(Chat__WAIT_FOR_PAGE, 500);

                break Reinitialize;
            }

            // Handled by parent controller
            // ReloadPage();
        }
    };

    // Add custom styling
    CustomCSSInitializer: {
        AddCustomCSSBlock('chat.js', `
            /* [data-a-page-loaded-name="PopoutChatPage"i] [class*="chat"i][class*="header"i] { display: none !important; } */

            #tt-auto-claim-bonuses .tt-z-above { display: none }
            :is([data-plagiarism], [data-repetitive]):not([data-resurrected]) { display: none }
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

            section[data-test-selector^="chat"i] :is([tt-hidden-message="true"i], [tt-hidden-bulletin="true"i]) { display: none }

            [class*="theme"i][class*="dark"i] [tt-light], [class*="theme"i][class*="dark"i] [class*="chat"i][class*="status"i] { background-color: var(--color-opac-w-4) !important }
            [class*="theme"i][class*="light"i] [tt-light], [class*="theme"i][class*="light"i] [class*="chat"i][class*="status"i] { background-color: var(--color-opac-b-4) !important }

            .chat-line__message[style] a {
                color: var(--color-text-alt);
                text-decoration: underline;
            }

            .tt-emote-captured [data-test-selector="badge-button-icon"i],
            .tt-emote-bttv [data-test-selector="badge-button-icon"i] {
                left: 0;
                top: 0;
            }
        `);
    }

    // Update the settings
    SettingsInitializer: {
        switch(Settings.onInstalledReason) {
            // Is this the first time the extension has run?
            // If so, then point out what's been changed
            case INSTALL: {
                // Alert something for the chats...
            } break;
        }

        Settings.set({ onInstalledReason: null });
    }

    // Handle pinned messages...
    Pinned: {
        let PinnedMessageHandler = header => {
            let toggle = $('button', header.closest('[class*="pinned"i][class*="chat"i][class*="area"i]')),
                collapsed = defined(toggle?.closest('[class*="highlight"i][class*="collapsed"i]'));

            if(collapsed)
                toggle.click();

            let element = header.closest('[class*="chat"][class*="content"i] > div:not([class])'),
                message = $('[class*="pinned"i][class*="message"i]', element),
                handle = $('.chatter-name', element),
                badges = $.all('.chat-badge', element).map(img => img.alt).isolate(),
                emotes = $.all('.chat-image', message).map(img => img.alt).isolate(),
                author = handle?.textContent ?? 'Anonymous';

            if(nullish(header) || nullish(message)) {
                if(collapsed)
                    toggle.click();
                return;
            }

            header = header.textContent;
            message = message.textContent;

            let mentions = message.split(/(@\S+)/).filter(s => s.startsWith('@')).map(s => s.slice(1).toLowerCase()),
                style = $('[style]', handle)?.getAttribute('style') ?? '',
                { hour, minute, meridiem } = (/(?<![#\$\.+:\d%‰]|\p{Sc})\b(?<hour>2[0-3]|[01]?\d)(?<minute>:[0-5]\d)?(?!\d*(?:\p{Sc}|[%‰]))[ \t]*(?<meridiem>[ap]m?(?!\p{L}|\p{N}))/iu.exec(handle?.parentElement?.textContent ?? '12:00AM')?.groups ?? {}),
                sent = new Date([(new Date).toLocaleDateString(), ' ', +hour + 12 * meridiem?.[0]?.equals('P'), minute, ':00'].join('')).toJSON();

            if(nullish(hour) && nullish(minute) && nullish(meridiem))
                return;

            handle = author.replace(/([^]*)\((.+)\)[^]*/, ($0, $1, $2 = '', $$, $_) => {
                author = $2 || $1;

                return $1;
            });

            let raw = `${ header } → ${ [(handle.unlike(author)? `${ handle } (${ author })`: handle), message].join(': ') }`,
                uuid = UUID.from([sent, message, author].join('@')).toString();

            let results = {
                raw,
                sent,
                uuid,
                style,
                author,
                emotes,
                badges,
                handle,
                element,
                message,
                mentions,
            };

            if(collapsed)
                toggle.click();

            Chat.__allpinned__.set(uuid, results);

            for(let [name, callback] of Chat.__onpinned__)
                when(() => PAGE_IS_READY, 250).then(() => callback(results));

            for(let [name, callback] of Chat.__deferredEvents__.__onpinned__)
                when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

            for(let [name, callback] of Chat.__consumableEvents__.__onpinned__) {
                when(() => PAGE_IS_READY, 250).then(() =>
                    callback(results).then(complete => {
                        if(complete)
                            Chat.__consumableEvents__.__onpinned__.delete(name);
                    })
                );
            }

            when(() => $.nullish('[class*="pinned"i][class*="by"i]'))
                .then(() => when.defined(() => $('[class*="pinned"i][class*="by"i]')).then(PinnedMessageHandler));
        };

        // FIX-ME: it's the time the page waits (5s) + time the function starts (2.5s)
        when.defined(() => $('[class*="pinned"i][class*="by"i]'), 8_000).then(PinnedMessageHandler);
    }
}, 500);

Chat__SETTING_RELOADER = setInterval(() => {
    for(let MAX_CALLS = 60; MAX_CALLS > 0 && top.REFRESH_ON_CHILD?.length; --MAX_CALLS)
        RestartJob(top.REFRESH_ON_CHILD.pop(), 'chat-setting-reloader:max-calls');
}, 250);
