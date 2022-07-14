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
function AddCustomCSSBlock(name, block) {
    Chat__CUSTOM_CSS.innerHTML += `/*${ name }*/${ block }/*#${ name }*/`;

    Chat__CUSTOM_CSS?.remove();
    $('body').append(Chat__CUSTOM_CSS);
}

function RemoveCustomCSSBlock(name, flags = '') {
    let regexp = RegExp(`\\/\\*(${ name })\\*\\/(?:[^]+?)\\/\\*#\\1\\*\\/`, flags);

    Chat__CUSTOM_CSS.innerHTML = Chat__CUSTOM_CSS.innerHTML.replace(regexp, '');

    Chat__CUSTOM_CSS?.remove();
    $('body').append(Chat__CUSTOM_CSS);
}

let Chat__Initialize = async(START_OVER = false) => {
    let {
        USERNAME,
        LANGUAGE,
        THEME,

        PATHNAME,
        STREAMER,

        GLOBAL_EVENT_LISTENERS,
    } = top;

    // Fill STREAMER
    let [path, name, endpoint] = window.location.pathname.split(/(?<!^)\//),
        sole = parseInt($('img[class*="channel"i][class*="point"i][class*="icon"i]')?.src?.replace(/[^]*\/(\d+)\/[^]*/, '$1')) || null;

    USERNAME ??= Search?.cookies?.name;
    STREAMER ??= ({ name: (name ?? path.slice(1)), sole });

    // Fill GLOBAL_EVENT_LISTENERS
    GLOBAL_EVENT_LISTENERS ??= {};

    // Time how long jobs take to complete properly
    let STOP_WATCHES = new Map,
        JUDGE__STOP_WATCH = (JobName, JobTime = Timers[JobName]) => {
            let { abs } = Math;
            let start = STOP_WATCHES.get(JobName),
                stop = +new Date,
                span = abs(start - stop),
                max = abs(JobTime) * 1.1;

            if(span > max)
                WARN(`"${ JobName.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['',' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, '- ') }" took ${ (span / 1000).suffix('s', 2).replace(/\.0+/, '') } to complete (max time allowed is ${ (max / 1000).suffix('s', 2).replace(/\.0+/, '') }). Offense time: ${ new Date }. Offending site: ${ top.location.pathname }`)
                    ?.toNativeStack?.();
        },
        START__STOP_WATCH = (JobName, JobCreationDate = +new Date) => (STOP_WATCHES.set(JobName, JobCreationDate), JobCreationDate);

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
        START__STOP_WATCH('auto_claim_bonuses');

        let ChannelPoints = (null
                ?? $('[data-test-selector="community-points-summary"i] button[class*="--success"i]')
                ?? $('[class*="bonus"i]')?.closest('button')
            ),
            Enabled = (Settings.auto_claim_bonuses && parseBool($('#tt-auto-claim-bonuses')?.getAttribute('tt-auto-claim-enabled') ?? $('[data-a-page-loaded-name="PopoutChatPage"i]')));

        if(Enabled)
            ChannelPoints?.click();

        let BonusChannelPointsSVG = Glyphs.modify('bonuschannelpoints', {
            id: 'tt-auto-claim-indicator',
            height: '2rem',
            width: '2rem',
            style: `vertical-align: middle; margin-left: 0.5rem; background-color: #00ad96; fill: #000; border: 0; border-radius: .25rem;`
        });

        let parent = $('div:not(#tt-auto-claim-bonuses) > [data-test-selector="community-points-summary"i] [role="tooltip"i]'),
            tooltip = $('#tt-auto-claim-bonuses [role="tooltip"i]');

        if(tooltip && parent)
            tooltip.innerText = parent.innerText;

        // Actual jobbing
        let button = $('#tt-auto-claim-bonuses');

        if(nullish(button)) {
            let parent    = $('[data-test-selector="community-points-summary"i]'),
                heading   = $('.top-nav__menu > div', true).pop(),
                container = furnish();

            if(nullish(parent) || nullish(heading)) {
                // wait(5000).then(Chat__Initialize);
                return JUDGE__STOP_WATCH('auto_claim_bonuses');
            }

            container.innerHTML = parent.outerHTML;
            container.id = 'tt-auto-claim-bonuses';
            container.classList.add('community-points-summary', 'tt-align-items-center', 'tt-flex', 'tt-full-height');
            container.setAttribute('style', `animation:1s fade-in 1;`);

            heading.insertBefore(container, heading.children[1]);

            $('#tt-auto-claim-bonuses [data-test-selector="community-points-summary"i] > div:last-child:not(:first-child)').remove();

            let textContainer = $('[data-test-selector*="balance"i] *:not(:empty)', false, container);

            if(defined(textContainer)) {
                let { parentElement } = textContainer;
                parentElement.removeAttribute('data-test-selector');
            }

            button = {
                container,
                enabled: true,
                text: textContainer,
                icon: $('svg, img', false, container),
                get offset() { return getOffset(container) },
                tooltip: new Tooltip(container, Glyphs.modify('channelpoints', { style: `height: 1.5rem; width: 1.5rem; vertical-align: bottom` }) + ` ${ (320 * CHANNEL_POINTS_MULTIPLIER) | 0 } / h`, { top: -10 }),
            };

            // button.tooltip.id = new UUID().toString();
            button.text.innerHTML = '+' + BonusChannelPointsSVG;
            button.container.setAttribute('tt-auto-claim-enabled', true);

            button.icon ??= $('svg, img', false, container);

            if(nullish($('.channel-points-icon', false, container)))
                button.icon.outerHTML = Glyphs.channelpoints;

            button.icon = $('svg, img', false, container);
            button.icon.setAttribute('style', `height: 2rem; width: 2rem; margin-top: .25rem; margin-left: .25rem;`);
        } else {
            let container = button,
                textContainer = $('[data-test-selector*="balance"i] *:not(:empty)', false, container);

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
            let enabled = button.container.getAttribute('tt-auto-claim-enabled') !== 'true';

            button.container.setAttribute('tt-auto-claim-enabled', enabled);
            button.text.innerHTML = ['','+'][+enabled] + BonusChannelPointsSVG;
            button.tooltip.innerHTML = Glyphs.modify('channelpoints', { style: `height: 1.5rem; width: 1.5rem; vertical-align: bottom` }) + ` ${ ((120 + (200 * +enabled)) * CHANNEL_POINTS_MULTIPLIER) | 0 } / h`;
        };

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
        button.tooltip.classList.add('img-container');

        // Clean up leftovers from Twitch animations
        let junk = $(`#tt-auto-claim-bonuses ${ '> :last-child'.repeat(3) }`);
        junk && (junk.innerHTML = '');

        // Set the Channel Point icon's color & positioning
        $('svg:not([id])', false, button.container)
            ?.setAttribute('style', `fill:var(--channel-color-${ ANTITHEME })`);

        $('svg:not([id])', false, button.container)
            ?.closest('div:not([class*="channel"i])')
            ?.setAttribute('style', 'margin-top:0.1em');

        JUDGE__STOP_WATCH('auto_claim_bonuses');
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
                        setTimeout(() => {
                            if(EmoteSearch.value == EmoteSearch.input.value)
                                callback(EmoteSearch.value);
                        }, 250);
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

                    let container = $('[class*="emote-picker"i] [class*="emote-picker"i][class*="block"i] > *:last-child');

                    for(let node of nodes) {
                        if(nullish(node))
                            continue;

                        node.setAttribute(`tt-${ type }-emote-search-result`, UUID.from(node.innerHTML).value);

                        container.append(node);
                    }

                    let title = (null
                        ?? $('p', false, container.previousElementSibling)
                        ?? $('[class*="emote-picker"i] p')
                    );

                    title.innerText = title.innerText.replace(/^.*("[^]+").*?$/, `${ container.children.length } search results for $1`);
                },
            },

            getTextDistance: {
                // Text comparison
                // Calculates the Levenshtein's distance between two strings
                value: function levenshtein(A = '', B = '') {
                    let a = A.length,
                        b = B.length;

                    let track = Array(b + 1).fill(null).map(() => Array(a + 1).fill(null));

                    for(let i = 0; i <= a; ++i)
                        track[0][i] = i;

                    for(let j = 0; j <= b; ++j)
                        track[j][0] = j;

                    for(let j = 1; j <= b; ++j)
                        for(let i = 1; i <= a; ++i)
                            track[j][i] = Math.min(
                                // Deletion
                                track[j][i - 1] + 1,

                                // Insertion
                                track[j - 1][i] + 1,

                                // Substitution
                                track[j - 1][i - 1] + +(A[i - 1] !== B[j - 1]),
                            );

                    return track[b][a];
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
        BTTV_OWNERS = (top.BTTV_OWNERS ??= new Map),
        BTTV_LOADED_INDEX = 0,
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
            f(`div#bttv_emote__${ UUID.from(name).toStamp() }.tt-emote-bttv.tt-pd-x-05.tt-relative`, {},
                f('div.emote-button', {},
                    f('div.tt-inline-flex', {},
                        f('button.emote-button__link.tt-align-items-center.tt-flex.tt-justify-content-center',
                            {
                                'data-test-selector': 'emote-button-clickable',
                                'aria-label': name,
                                name,
                                'data-a-target': name,

                                onclick: event => {
                                    let name = event.currentTarget.getAttribute('name'),
                                        chat = $('[data-a-target="chat-input"i]');

                                    // chat.innerHTML = (chat.value += `${name} `);
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
                                f('div.emote-button__lock.tt-absolute.tt-border-radius-small.tt-c-background-overlay.tt-c-text-overlay.tt-inline-flex.tt-justify-content-center.tt-z-above', { 'data-test-selector': 'badge-button-icon' },
                                    f('figure.tt-svg', { style: '-webkit-box-align:center; align-items:center; display:inline-flex;', innerHTML: Glyphs.modify('emotes', { height: '10px', width: '10px' }) })
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
            if((keyword || '').trim().length < 1)
                return;

            if(QUEUED_EMOTES.has(keyword) || NON_EMOTE_PHRASES.has(keyword))
                return BTTV_EMOTES.get(keyword);
            QUEUED_EMOTES.add(keyword);

            // Load emotes from a certain user
            if(defined(provider))
                await fetch(`//api.betterttv.net/3/cached/users/twitch/${ provider }`)
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
                    .catch(WARN);
            // Load emotes with a certain name
            else if(defined(keyword))
                for(let maxNumOfEmotes = BTTV_MAX_EMOTES, offset = 0, allLoaded = false, MAX_REPEAT = 15; !allLoaded && (keyword || '').trim().length && (ignoreCap || BTTV_EMOTES.size < maxNumOfEmotes) && MAX_REPEAT > 0; (--MAX_REPEAT > 0? null: NON_EMOTE_PHRASES.add(keyword)))
                    await fetch(`//api.betterttv.net/3/emotes/shared/search?query=${ keyword }&offset=${ offset }&limit=100`)
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

                            WARN(error);
                        });
            // Load all emotes from...
            else
                for(let maxNumOfEmotes = BTTV_MAX_EMOTES, offset = 0, allLoaded = false; (ignoreCap || BTTV_EMOTES.size < maxNumOfEmotes);)
                    await fetch(`//api.betterttv.net/3/${ Settings.bttv_emotes_location ?? 'emotes/shared/trending' }?offset=${ offset }&limit=100`)
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
                        .catch(WARN);
        },
        REFURBISH_BTTV_EMOTE_TOOLTIPS = fragment => {
            $('[data-bttv-emote]', true, fragment)
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
                        await fetch(`./${ bttvOwner }`)
                            .then(response => response.text())
                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                            .then(({ documentElement }) => documentElement)
                            .then(async doc => {
                                let languages = `bg cs da de el en es es-mx fi fr hu it ja ko nl no pl ro ru sk sv th tr vi zh-cn zh-tw x-default`.split(' ');
                                let alt_languages = $('link[rel^="alt"i][hreflang]', true, doc).map(link => link.hreflang),
                                    [data] = JSON.parse($('script[type^="application"i][type$="json"i]', false, doc)?.textContent || "[]");

                                let display_name = await until(() => $('meta[name$="title"i]', false, doc)?.content?.split(/\s/, 1)?.pop()),
                                    [language] = languages.filter(lang => alt_languages.missing(lang)),
                                    name = display_name?.toLowerCase(),
                                    profile_image = $('meta[property$="image"i]', false, doc)?.content,
                                    live = parseBool(data?.publication?.isLiveBroadcast),
                                    started_at = new Date(data?.publication?.startDate).toJSON(),
                                    status = (data?.description ?? $('meta[name$="description"i]', false, doc)?.content),
                                    updated_at = new Date(data?.publication?.endDate).toJSON();

                                await Search.convertResults({
                                    json() { return { display_name, language, live, name, profile_image, started_at, status, updated_at }; }
                                })
                                .then(({ live = false }) => {
                                    let count = ownedEmotes.length,
                                        owner = BTTV_OWNERS.get(bttvEmote).userId,
                                        f = furnish;

                                    let list = ownedEmotes.slice(0, 8).map(({ emote, displayName, name, providerId }) =>
                                        f('div.chat-line__message--emote-button', { 'data-test-selector': 'emote-button' },
                                            f('span', { 'data-a-target': 'emote-name' },
                                                f('div.class.chat-image__container.tt-align-center.tt-inline-block', {},
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
                                        description: `Visit <a href="//betterttv.com/users/${ owner }" target="_blank">${ bttvOwner } ${ Glyphs.modify('ne_arrow', { height: 16, width: 16, style: 'vertical-align:-3px' }) }</a> to view more emotes. <!-- <p style="margin-top:1rem">${ list }</p> <!-- / -->`,

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
                                    WARN(error);

                                    resultCard.post({
                                        title: bttvEmote,
                                        subtitle: `BetterTTV Emote (${ bttvOwner })`,

                                        icon: {
                                            src: BTTV_EMOTES.get(bttvEmote),
                                            alt: bttvEmote,
                                        },
                                        fineTuning: { top }
                                    });
                                });
                            })
                            .finally(() => clearTimeout(redoSearch));
                    });
                });
        };

    Handlers.bttv_emotes = () => {
        START__STOP_WATCH('bttv_emotes');

        let BTTVEmoteSection = $('#tt-bttv-emotes');

        if(defined(BTTVEmoteSection))
            return JUDGE__STOP_WATCH('bttv_emotes');

        let parent = $('[data-test-selector^="chat-room-component"i] .emote-picker__scroll-container > *');

        if(nullish(parent))
            return JUDGE__STOP_WATCH('bttv_emotes');

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

            furnish('div.tt-pd-b-1.tt-pd-t-05.tt-pd-x-1.tt-relative', {},
                // Emote Section Header
                furnish('div.emote-grid-section__header-title.tt-align-items-center.tt-flex.tt-pd-x-1.tt-pd-y-05', {},
                    furnish('p.tt-align-middle.tt-c-text-alt.tt-strong', {
                        innerHTML: `BetterTTV Emotes &mdash; ${ EmoteDragCommand }`
                    })
                ),

                // Emote Section Container
                furnish('div#tt-bttv-emotes-container.tt-flex.tt-flex-wrap',
                    {
                        class: 'tt-scrollbar-area',
                        style: 'max-height: 15rem; overflow: hidden scroll;',
                    },
                    ...BTTVEmotes.map(CONVERT_TO_BTTV_EMOTE)
                )
            )
        );

        parent.insertBefore(BTTVEmoteSection, parent.firstChild);

        JUDGE__STOP_WATCH('bttv_emotes');
    };
    Timers.bttv_emotes = 2_500;

    __BetterTTVEmotes__:
    if(parseBool(Settings.bttv_emotes)) {
        REMARK("Loading BTTV emotes...");

        // Use 85% of available space to load "required" emotes
        BTTV_MAX_EMOTES = Math.round(parseInt(Settings.bttv_emotes_maximum) * 0.85);

        // Load streamer specific emotes
        if(parseBool(Settings.bttv_emotes_channel))
            LOAD_BTTV_EMOTES(STREAMER.name, STREAMER.sole);
        // Load emotes (not to exceed the max size)
        LOAD_BTTV_EMOTES()
            .then(async() => {
                // Allow the remaing 15% to be filled with extra emotes
                BTTV_MAX_EMOTES = parseInt(Settings.bttv_emotes_maximum);

                // Load extra emotes
                for(let keyword of (Settings.bttv_emotes_extras ?? "").split(',').filter(string => string.length > 1))
                    // FIX-ME: Adding BTTV emotes might cause loading issues?
                    await LOAD_BTTV_EMOTES(keyword);
            })
            .then(() => {
                let container = $('#tt-bttv-emotes-container');

                if(nullish(container))
                    return;

                // Put all BTTV emotes into the emote-picker list
                let BTTVEmotes = [];

                for(let [name, src] of BTTV_EMOTES)
                    BTTVEmotes.push({ name, src });

                container.append(...BTTVEmotes.map(CONVERT_TO_BTTV_EMOTE));
            })
            .then(() => {
                REMARK("Adding BTTV emote event listener...");

                // Run the bttv-emote changer on pre-populated messages
                (GetChat.onnewmessage = async chat => {
                    let regexp;

                    for(let line of chat) {
                        // Replace BTTV emotes for the last 15 chat messages
                        if(Queue.bttv_emotes.contains(line.uuid))
                            continue;

                        Queue.bttv_emotes.push(line.uuid);
                        Queue.bttv_emotes = Queue.bttv_emotes.slice(-15);

                        // This will recognise "emote" text, i.e. camel-cased text "emoteName" or all-caps "EMOTENAME"
                        if(parseBool(Settings.auto_load_bttv_emotes))
                            for(let word of line.message.split(/\s+/))
                                if(!NON_EMOTE_PHRASES.has(word) && !QUEUED_EMOTES.has(word) && !BTTV_EMOTES.has(word) && word.length > 3 && /[a-z\d][A-Z]|^[A-Z]+$/.test(word))
                                    await LOAD_BTTV_EMOTES(word, null, true);

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
                                        f('div.class.chat-image__container.tt-align-center.tt-inline-block', {},
                                            f('img.bttv.chat-image.chat-line__message--emote', {
                                                alt, src,
                                            })
                                        )
                                    )
                                );

                                let { element } = line;

                                alt = alt.replace(/\s+/g, '_');

                                $(`.text-fragment:not([tt-converted-emotes~="${alt}"i])`, true, element).map(fragment => {
                                    let container = furnish('div.chat-line__message--emote-button', { 'data-test-selector': 'emote-button', 'data-bttv-emote': alt, 'data-bttv-owner': own, 'data-bttv-owner-id': pid, innerHTML: img.innerHTML }),
                                        converted = (fragment.getAttribute('tt-converted-emotes') ?? "").split(' ');

                                    converted.push(alt);

                                    let tte = fragment.getAttribute('data-tt-emote') ?? '';

                                    fragment.setAttribute('data-tt-emote', [...tte.split(' '), alt].join(' '));
                                    fragment.setAttribute('tt-converted-emotes', converted.join(' ').trim());
                                    fragment.innerHTML = fragment.innerHTML.replace(regexp, container.outerHTML);

                                    REFURBISH_BTTV_EMOTE_TOOLTIPS(fragment);
                                });
                            }
                    }
                })(GetChat());
            });

        REMARK("Adding BTTV emote search listener...");

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
            furnish('div.tt-emote-captured.tt-pd-x-05.tt-relative', {},
                furnish('div.emote-button', {},
                    furnish('div.tt-inline-flex', {},
                        furnish('button.emote-button__link.tt-align-items-center.tt-flex.tt-justify-content-center',
                            {
                                'data-test-selector': 'emote-button-clickable',
                                'aria-label': name,
                                name,
                                'data-a-target': name,

                                onclick: event => {
                                    let name = event.currentTarget.getAttribute('name'),
                                        chat = $('[data-a-target="chat-input"i]');

                                    // chat.innerHTML = (chat.value += `${name} `);
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
                                furnish('div.emote-button__lock.tt-absolute.tt-border-radius-small.tt-c-background-overlay.tt-c-text-overlay.tt-inline-flex.tt-justify-content-center.tt-z-above', { 'data-test-selector': 'badge-button-icon' },
                                    furnish('figure.tt-svg', { style: '-webkit-box-align:center; align-items:center; display:inline-flex;', innerHTML: Glyphs.modify('emotes', { height: '10px', width: '10px' }) })
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
            return RestartJob('convert_emotes');

        // Get the streamer's emotes and make them draggable
        let streamersEmotes = $(`[class^="emote-picker"i] img[alt="${ STREAMER.name }"i]`)?.closest('div')?.nextElementSibling;

        if(nullish(streamersEmotes))
            return RegisterJob('convert_emotes');

        for(let lock of $('[data-test-selector*="lock"i]', true, streamersEmotes)) {
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

            furnish('div.tt-pd-b-1.tt-pd-t-05.tt-pd-x-1.tt-relative', {},
                // Emote Section Header
                furnish('div.emote-grid-section__header-title.tt-align-items-center.tt-flex.tt-pd-x-1.tt-pd-y-05', {},
                    furnish('p.tt-align-middle.tt-c-text-alt.tt-strong', {
                        innerHTML: `Captured Emotes &mdash; ${ EmoteDragCommand }`
                    })
                ),

                // Emote Section Container
                furnish('div#tt-captured-emotes-container.tt-flex.tt-flex-wrap',
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
            setTimeout(() => {
                // Collect the emotes
                $('.emote-button [data-test-selector*="lock"i] ~ img:not(.bttv)', true)
                    .map(img => CAPTURED_EMOTES.set(img.alt, shrt(img.src)));

                $('.emote-button img:not(.bttv)', true)
                    .filter(img => !CAPTURED_EMOTES.has(img.alt))
                    .map(img => OWNED_EMOTES.set(img.alt, shrt(img.src)));

                // Close and continue...
                // TODO: Add an `onscroll` event listener to close the emote panel dynamically...
                setTimeout(() => {
                    $('#tt-hidden-emote-container')?.removeAttribute('id');

                    chat_emote_scroll.scrollTo(0, 0);
                    chat_emote_button.click();
                }, 2_500);
            }, 250);
        }

        if(defined(chat_emote_button))
            CollectEmotes();
        else
            wait(250).then(CollectEmotes);

        REMARK("Adding emote event listener...");

        // Run the emote catcher on pre-populated messages
        (GetChat.onnewmessage = excerpt => {
            let regexp;

            for(let emote in excerpt.emotes)
                if(!OWNED_EMOTES.has(emote) && !CAPTURED_EMOTES.has(emote) && !BTTV_EMOTES.has(emote)) {
                    // LOG(`Adding emote "${ emote }"`);

                    CAPTURED_EMOTES.set(emote, excerpt.emotes[emote]);

                    let capturedEmote = CONVERT_TO_CAPTURED_EMOTE({ name: emote, src: excerpt.emotes[emote] });

                    if(defined(capturedEmote))
                        $('#tt-captured-emotes-container')?.append?.(capturedEmote);
                }

            for(let line of excerpt) {
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
                                f('div.class.chat-image__container.tt-align-center.tt-inline-block', {},
                                    f('img.chat-image.chat-line__message--emote', {
                                        srcset, alt, src,
                                    })
                                )
                            )
                        );

                        let { element } = line;

                        alt = alt.replace(/\s+/g, '_');

                        $(`.text-fragment:not([tt-converted-emotes~="${alt}"i])`, true, element).map(fragment => {
                            let container = furnish('div.chat-line__message--emote-button', { 'data-test-selector': 'emote-button', 'data-captured-emote': alt, innerHTML: img.innerHTML }),
                                converted = (fragment.getAttribute('tt-converted-emotes') ?? "").split(' ');

                            converted.push(alt);

                            let tte = fragment.getAttribute('data-tt-emote') ?? '';

                            fragment.setAttribute('data-tt-emote', [...tte.split(' '), alt].join(' '));
                            fragment.setAttribute('tt-converted-emotes', converted.join(' ').trim());
                            fragment.innerHTML = fragment.innerHTML.replace(regexp, container.outerHTML);

                            $('[data-captured-emote]', true, fragment)
                                .forEach(element => {
                                    let { capturedEmote } = element.dataset;
                                    // ... //
                                });
                            REFURBISH_BTTV_EMOTE_TOOLTIPS(fragment);
                        });
                    }
            }
        })(GetChat());

        REMARK("Adding emote search listener...");

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
        // UPDATE_RULES(ruleType:string={ "filter" "phrase" })
    let UPDATE_RULES = (ruleType) => {
        let rules = Settings[`${ ruleType }_rules`];
        let channel = [], user = [], badge = [], emote = [], text = [];

        if(defined(rules?.length)) {
            rules = rules.split(/\s*,\s*/).map(rule => rule.trim()).filter(rule => rule.length);

            let R = RegExp;
            for(let rule of rules)
                // /channel text
                if(/^\/[\w\-]+/.test(rule)) {
                    channel.push({ ...(/^\/(?<name>[\w\-]+) +(?:<(?<badge>[^>]+)>|:(?<emote>[^:]+):|@(?<user>[\w\-]+)|(?<text>[^$]*))$/.exec(rule).groups) });
                }
                // @username
                else if(/^@([\w\-]+)$/.test(rule) && ['@everyone', '@chat', '@all'].missing(rule.toLowerCase())) {
                    user.push(R.$1);
                }
                // <badge>
                else if(/^<([\w\- ]+)>$/.test(rule)) {
                    badge.push(R.$1);
                }
                // :emote:
                else if(/^:([\w\- ]+):$/.test(rule)) {
                    emote.push(R.$1);
                }
                // text
                else if(rule) {
                    text.push(/^[\w\s]+$/.test(rule)? `\\b${ rule.trim() }\\b`: rule);
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
        START__STOP_WATCH('filter_messages');

        MESSAGE_FILTER ??= GetChat.onnewmessage = excerpt => {
            let Filter = UPDATE_RULES('filter');

            censoring:
            for(let line of excerpt) {
                let { message, mentions, author, badges, emotes, element } = line,
                    reason, match;

                let censoring = parseBool(element.getAttribute('tt-hidden-message'));

                if(censoring)
                    continue censoring;

                let censor = parseBool(false
                    // Filter users on all channels
                    || (Filter.user.test(author)? (match = author, reason = 'user'): false)
                    // Filter badges on all channels
                    || (Filter.badge.test(badges)? (match = badges, reason = 'badge'): false)
                    // Filter emotes on all channels
                    || (Filter.emote.test(emotes)? (match = emotes, reason = 'emote'): false)
                    // Filter messges (RegExp) on all channels
                    || (Filter.text.test(message)? (match = message, reason = 'text'): false)
                    // Filter messages/users on specific a channel
                    || Filter.channel.map(({ name, text, user, badge, emote }) => {
                        if(nullish(STREAMER))
                            return;

                        let channel = (STREAMER.name || "~Anonymous");

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
                    continue censoring;

                let hidden = parseBool(element.getAttribute('tt-hidden-message'));

                if(hidden || mentions.contains(USERNAME))
                    continue;

                LOG(`Censoring message because the ${ reason } matches: ${ match }`, line);

                element.setAttribute('tt-hidden-message', censor);
            }
        };

        if(defined(MESSAGE_FILTER))
            MESSAGE_FILTER(GetChat(250, true));

        JUDGE__STOP_WATCH('filter_messages');
    };
    Timers.filter_messages = -2_500;

    Unhandlers.filter_messages = () => {
        let hidden = $('[tt-hidden-message]', true);

        hidden.map(element => element.removeAttribute('tt-hidden-message'));
    };

    __FilterMessages__:
    if(parseBool(Settings.filter_messages)) {
        REMARK("Adding message filtering...");

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

        let title = $('h1,h2,h3,h4,h5,h6', false, card),
            [name] = title.childNodes,
            type = (card.getAttribute('data-a-target').toLowerCase() == 'viewer-card'? 'user': 'emote'),
            { filter_rules } = Settings;

        name = name?.textContent?.replace(/[^]+?\((\w+)\)/, '$1');

        if(type == 'user') {
            /* Filter users */
            if(filter_rules && filter_rules.split(',').contains(`@${ name }`))
                return /* Already filtering messages from this person */;

            let filter = furnish('div#tt-filter-rule--user', {
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

            title.append(filter);
        } else if(type == 'emote') {
            /* Filter emotes */
            if(filter_rules && filter_rules.split(',').contains(`:${ name }:`))
                return /* Already filtering this emote */;

            let filter = furnish('div#tt-filter-rule--emote', {
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

                    currentTarget.remove();

                    Storage.set({ filter_rules });
                },

                innerHTML: `${ Glyphs.trash } Filter <strong>${ name }</strong>`,
            });

            let svg = $('svg', false, filter);

            svg.setAttribute('style', 'vertical-align:bottom; height:20px; width:20px');

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
    let BULLETIN_FILTER;

    Handlers.filter_bulletins = () => {
        START__STOP_WATCH('filter_bulletins');

        BULLETIN_FILTER ??= GetChat.onnewmessage = () => {
            let { bullets } = GetChat(),
                censor = false;

            censoring:
            for(let bullet of bullets) {
                let { element, mentions, message, subject } = bullet,
                    reason;

                let censor = parseBool(false
                    || (['coin'].contains(subject) && parseBool(Settings.filter_messages__bullets_coin)? reason = 'channel points': false)
                    || (['raid'].contains(subject) && parseBool(Settings.filter_messages__bullets_raid)? reason = 'raid(s)': false)
                    || (['dues', 'gift', 'keep'].contains(subject) && parseBool(Settings.filter_messages__bullets_subs)? reason = 'subscription(s)': false)
                    || (['note'].contains(subject) && parseBool(Settings.filter_messages__bullets_note)? reason = 'announcement(s)': false)
                ),
                    censoring = parseBool(element.getAttribute('tt-hidden-bulletin'));

                if(censoring || !censor)
                    continue censoring;

                if(mentions.contains(USERNAME))
                    continue;

                // LOG(`Censoring bulletin because its subject is "${ reason }"`, bullet);

                element.setAttribute('tt-hidden-bulletin', censor);
            }
        };

        if(defined(BULLETIN_FILTER))
            BULLETIN_FILTER(GetChat(250, true));

        // Apply rules to new &/ hidden bullets...
        setInterval(() => {
            let banners = {
                coin: null,
                raid: null,
                subs: $('[role="log"i] [class*="mystery"i]', true).map(bullet => bullet.closest(':is([data-a-target*="welcome"i], [tabindex]):not([tt-hidden-bulletin]) ~ *')),
                note: null,
            };

            banners.subs.isolate().filter(defined).map(bullet => bullet.setAttribute('tt-hidden-bulletin', parseBool(Settings.filter_messages__bullets_subs)));
        }, 250);

        JUDGE__STOP_WATCH('filter_bulletins');
    };
    Timers.filter_bulletins = -2_500;

    Unhandlers.filter_bulletins = () => {
        let hidden = $('[tt-hidden-bulletin]', true);

        hidden.map(element => element.removeAttribute('tt-hidden-bulletin'));
    };

    __FilterBulletins__:
    if([
        Settings.filter_messages__bullets_coin,
        Settings.filter_messages__bullets_raid,
        Settings.filter_messages__bullets_subs,
        Settings.filter_messages__bullets_note,
    ].map(parseBool).contains(true)) {
        REMARK("Adding bulletin filtering...");

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
        START__STOP_WATCH('highlight_phrases');

        PHRASE_HIGHLIGHTER ??= GetChat.onnewmessage = excerpt => {
            let Phrases = UPDATE_RULES('phrase');

            highlighting:
            for(let line of excerpt) {
                let { message, mentions, author, badges, emotes, element } = line,
                    reason;

                let censor = parseBool(false
                    // Phrase of users on all channels
                    || (Phrases.user.test(author)? reason = 'user': false)
                    // Phrase of badges on all channels
                    || (Phrases.badge.test(badges)? reason = 'badge': false)
                    // Phrase of emotes on all channels
                    || (Phrases.emote.test(emotes)? reason = 'emote': false)
                    // Phrase of messges (RegExp) on all channels
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
                    continue highlighting;

                LOG(`Highlighting message because the ${ reason } matches`, line);

                let highlight = element.getAttribute('tt-light') === 'true';

                if(highlight)
                    return;

                element.setAttribute('tt-light', true);
            }
        };

        if(defined(PHRASE_HIGHLIGHTER))
            PHRASE_HIGHLIGHTER(GetChat(250, true));

        JUDGE__STOP_WATCH('highlight_phrases');
    };
    Timers.highlight_phrases = -2_500;

    Unhandlers.highlight_phrases = () => {
        let highlight = $('[tt-light]', true);

        highlight.map(element => element.removeAttribute('tt-light'));
    };

    __HighlightPhrases__:
    if(parseBool(Settings.highlight_phrases)) {
        REMARK("Adding phrase highlighting...");

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

        let title = $('h1,h2,h3,h4,h5,h6', false, card),
            [name] = title.childNodes,
            type = (card.getAttribute('data-a-target').toLowerCase() == 'viewer-card'? 'user': 'emote'),
            { phrase_rules } = Settings;

        name = name?.textContent?.replace(/[^]+?\((\w+)\)/, '$1');

        if(type == 'user') {
            /* Highlight users */
            if(phrase_rules && phrase_rules.split(',').contains(`@${ name }`))
                return /* Already highlighting messages from this person */;

            let phrase = furnish('div#tt-highlight-rule--user', {
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

                    currentTarget.setAttribute('tt-hidden-message', true);

                    Storage.set({ phrase_rules });
                },

                innerHTML: `${ Glyphs.star } Highlight messages from @${ name }`,
            });

            let svg = $('svg', false, phrase);

            svg.setAttribute('style', 'vertical-align:bottom; height:20px; width:20px');

            title.append(phrase);
        } else if(type == 'emote') {
            /* Highlight emotes */
            if(phrase_rules && phrase_rules.split(',').contains(`:${ name }:`))
                return /* Already highlighting this emote */;

            let phrase = furnish('div#tt-highlight-rule--emote', {
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

                    currentTarget.remove();

                    Storage.set({ phrase_rules });
                },

                innerHTML: `${ Glyphs.star } Highlight <strong>${ name }</strong>`,
            });

            let svg = $('svg', false, phrase);

            svg.setAttribute('style', 'vertical-align:bottom; height:20px; width:20px');

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

        let title = $('h1,h2,h3,h4,h5,h6', false, card),
            { length } = title.children;

        if(length > 2)
            title.setAttribute('style', `height: ${ 3 * (length - 1) + 1 }rem`);
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
        (GetChat.onnewmessage = excerpt => {
            let usernames = [USERNAME];

            if(parseBool(Settings.highlight_mentions_extra))
                usernames.push('all', 'chat', 'everyone');

            excerpt = excerpt.filter(line => !!~line.mentions.findIndex(username => RegExp(`^(${usernames.join('|')})$`, 'i').test(username)));

            for(let line of excerpt)
                if(Queue.messages.missing(line.uuid)) {
                    Queue.messages.push(line.uuid);

                    let { author, message, reply } = line;

                    // LOG('Highlighting message:', { author, message });

                    line.element.setAttribute('style', 'background-color: var(--color-opac-p-8)');
                }
        })(GetChat());
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
        (GetChat.onnewmessage = excerpt => {
            excerpt = excerpt.filter(line => !!~line.mentions.findIndex(username => RegExp(`^${USERNAME}$`, 'i').test(username)));

            for(let line of excerpt)
                if(Queue.message_popups.missing(line.uuid)) {
                    Queue.message_popups.push(line.uuid);

                    let { author, message, reply } = line;

                    let existing = $('#tt-chat-footer');

                    if(defined(existing))
                        continue;

                    // LOG('Generating footer:', { author, message });

                    new ChatFooter(`@${ author } mentioned you.`, {
                        onclick: event => {
                            let chatbox = $('[class*="chat-input"i] textarea'),
                                existing = $('#tt-chat-footer');

                            if(defined(chatbox))
                                chatbox.focus();
                            if(defined(existing))
                                existing.remove();

                            LOG('Clicked [reply] button', { author, chatbox, existing, line, message, reply });

                            (reply ?? $('button[data-test-selector="chat-reply-button"i]', false, line.element))?.click();
                        },
                    });
                }
        })(GetChat());
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
        START__STOP_WATCH('native_twitch_reply');

        // Enter
        if(nullish(GLOBAL_EVENT_LISTENERS.ENTER))
            $('[data-a-target="chat-input"i]')?.addEventListener('keydown', GLOBAL_EVENT_LISTENERS.ENTER = ({ key, altKey, ctrlKey, metaKey, shiftKey }) => {
                if(!(altKey || ctrlKey || metaKey || shiftKey) && key == 'Enter')
                    $('#tt-close-native-twitch-reply')?.click();
            });

        if(defined(NATIVE_REPLY_POLYFILL) || defined($('.chat-line__reply-icon')))
            return JUDGE__STOP_WATCH('native_twitch_reply');

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

                return f('div.chat-line__reply-icon.tt-absolute.tt-border-radius-medium.tt-c-background-base.tt-elevation-1', {},
                    f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative',
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

                                    bubbleContainer.append(
                                        f(`div#tt-native-twitch-reply.tt-align-items-start.tt-flex.tt-flex-row.tt-pd-0`,
                                            {
                                                'data-test-selector': 'chat-input-tray',
                                            },

                                            f('div.tt-align-center.tt-mg-05', {},
                                                f('div.tt-align-items-center.tt-flex', { innerHTML: Glyphs.modify('reply', { height: '24px', width: '24px' }) })
                                            ),
                                            f('div.tt-flex-grow-1.tt-pd-l-05.tt-pd-y-05', {},
                                                f('span.tt-c-text-alt.tt-font-size-5.tt-strong.tt-word-break-word', {
                                                    'connected-to': uuid,

                                                    handle, message, mentions,

                                                    innerHTML: `Replying to <span style="${ style }">@${handle}</span>`,
                                                })
                                            ),
                                            f('div.tt-right-0.tt-top-0', {},
                                                f('button#tt-close-native-twitch-reply.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative',
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

                                    bubbleContainer.append(
                                        f('div#tt-native-twitch-reply-message.font-scale--default.tt-pd-x-1.tt-pd-y-05.chat-line__message',
                                            {
                                                'data-a-target': 'chat-line-message',
                                                'data-test-selector': 'chat-line-message',
                                            },
                                            f('div.tt-relative', { innerHTML: messageElement.outerHTML })
                                        )
                                    );

                                    chatInput.setAttribute('placeholder', 'Send a reply');
                                }

                                chatInput.focus();
                            },
                        },
                        f('span.tt-button-icon__icon', {},
                            f('div',
                                { style: 'width: 2rem; height: 2rem;' },
                                f('div.tt-icon', {},
                                    f('div.tt-aspect', { innerHTML: Glyphs.reply })
                                )
                            )
                        )
                    )
                );
            },

            // Highlighter for chat elements
            AddNativeReplyButton: ({ uuid, style, handle, message, mentions, element }) => {
                if(nullish(element))
                    return;

                if(defined($('.chat-line__message-container', false, element)))
                    return;

                if(handle == USERNAME)
                    return;

                let parent = $('div', false, element);
                if(nullish(parent)) return;

                let target = $('div', false, parent);
                if(nullish(target)) return;

                let highlighter = furnish('div.chat-line__message-highlight.tt-absolute.tt-border-radius-medium', { 'data-test-selector': 'chat-message-highlight' });

                target.classList.add('chat-line__message-container');

                parent.insertBefore(highlighter, parent.firstElementChild);
                parent.append(NATIVE_REPLY_POLYFILL.NewReplyButton({ uuid, style, handle, message, mentions, }));
            },
        };

        GetChat().forEach(NATIVE_REPLY_POLYFILL.AddNativeReplyButton);

        GetChat.onnewmessage = excerpt => excerpt.map(NATIVE_REPLY_POLYFILL.AddNativeReplyButton);

        JUDGE__STOP_WATCH('native_twitch_reply');
    };
    Timers.native_twitch_reply = 1000;

    __NativeTwitchReply__:
    if(parseBool(Settings.native_twitch_reply)) {
        REMARK("Adding native reply buttons...");

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
        CHAT_CARDIFIED = new Map;

    Handlers.link_maker__chat = () => {
        (GetChat.onnewmessage = async excerpt => {
            if(!LINK_MAKER_ENABLED)
                return;

            let HTMLParser = new DOMParser;

            cardifying:
            for(let line of excerpt) {
                let { message, mentions, author, element } = line;

                for(let { pattern } = parseURL, { length } = message, index = 0; pattern.test(message) && index < length | 0; ++index) {
                    let parsed = pattern.exec(message),
                        [match] = parsed,
                        { index, groups } = parsed,
                        { href, origin, protocol, scheme, host, hostname, port, pathname, search, hash } = groups;

                    message = message.slice(index + match.length);

                    let url = parseURL(href.replace(/^(https?:\/\/)?/i, `${ top.location.protocol }//`).trim()),
                        [topDom, secDom, ...subDom] = url.domainPath;

                    // Ignore pre-cardified links
                    if(subDom.contains('clips'))
                        continue;

                    // Mobilize laggy URLs
                    if('instagram twitter'.contains(secDom.toLowerCase()))
                        topDom = 'mobile';

                    href = url.href.replace(url.hostname, [...subDom, secDom, topDom].join('.'));

                    if(CHAT_CARDIFIED.has(href)) {
                        let card = CHAT_CARDIFIED.get(href);

                        if(nullish($(`#card-${ UUID.from(href).toStamp() }`, false, element)) && defined(card))
                            element.insertAdjacentElement('beforeend', card);

                        continue cardifying;
                    }

                    CHAT_CARDIFIED.set(href, null);

                    /*await*/ fetch(`https://api.allorigins.win/raw?url=${ encodeURIComponent(href) }`, { mode: 'cors' })
                        .then(response => response.text())
                        .then(html => {
                            html = html
                                .replace(/[^]*(<head\W[^]*?<\/head>)[^]*/i, '<html>$1<body></body></html>')
                                .replace(/(<\w+\s+([^>]+?)>)/g, ($0, $1, $2 = '', $$, $_) => {
                                    let attributes = {};

                                    let attr = '', val = '',
                                        isVal = false, delim = null,
                                        skip = false;

                                    for(let char of $2) {
                                        if(!isVal) {
                                            if(isVal = (char == '='))
                                                continue;

                                            attr += char;
                                        } else {
                                            if(skip) {
                                                val += char;
                                                skip = false;
                                                continue;
                                            }

                                            if(char == '\\') {
                                                val += char;
                                                skip = true;
                                                continue;
                                            }

                                            if(nullish(delim)) {
                                                delim = (
                                                    /["']/.test(char)?
                                                        char:
                                                    ' '
                                                );

                                                continue;
                                            }

                                            if(char == delim) {
                                                attributes[attr.trim()] ??= `"${ val }"`;

                                                isVal = false;
                                                delim = null;
                                                skip = false;
                                                attr = '';
                                                val = '';
                                                continue;
                                            }

                                            val += char;
                                        }
                                    }

                                    let defaults = {
                                        crossorigin: 'anonymous',
                                    };

                                    for(let [name, value] of Object.entries(attributes))
                                        attributes[name] ??= JSON.stringify(defaults[name]);

                                    return $1.replace($2, Object.entries(attributes).map(([name, value]) => [name, value].join('=')).join(' '));
                                });

                            return html;
                        })
                        .then(html => HTMLParser.parseFromString(html, 'text/html'))
                        .catch(WARN)
                        .then(DOM => {
                            if(!(DOM instanceof Document))
                                throw TypeError(`No DOM available. Page not loaded`);

                            let f = furnish;
                            let get = property => DOM.querySelector(`[name$="${ property }"i], [property$="${ property }"i]`)?.getAttribute('content');

                            let [title, description, image] = ["title", "description", "image"].map(get),
                                error = DOM.querySelector('parsererror')?.textContent;

                            LOG(`Loaded page ${ href }`, { title, description, image, DOM });

                            if(!title?.length || !image?.length) {
                                CHAT_CARDIFIED.set(href, f.span());

                                if(!error?.length)
                                    return;
                                else
                                    throw error;
                            }

                            let card = f('div.tt-iframe-card.tt-border-radius-medium.tt-elevation-1', {},
                                f('div.tt-border-radius-medium.tt-c-background-base.tt-flex.tt-full-width', {},
                                    f('a.tt-block.tt-border-radius-medium.tt-full-width.tt-interactable', { rel: 'noopener noreferrer', target: '_blank', href },
                                        f('div.chat-card.tt-flex.tt-flex-nowrap.tt-pd-05', {},
                                            // Preview image
                                            f('div.chat-card__preview-img.tt-align-items-center.tt-c-background-alt-2.tt-flex.tt-flex-shrink-0.tt-justify-content-center', {},
                                                f('div.tt-card-image', {},
                                                    f('div.tt-aspect', {},
                                                        f('div', {}),
                                                        f('img.tt-image', { alt: title, src: image.replace(/^(?!(?:https?:)?\/\/[^\/]+)\/?/i, `${ top.location.protocol }//${ host }/`), height: 45, style: 'max-height:45px' })
                                                    )
                                                )
                                            ),
                                            // Title & Subtitle
                                            f('div.tt-align-items-center.tt-flex.tt-overflow-hidden', {},
                                                f('div.tt-full-width.tt-pd-l-1', {},
                                                    // Title
                                                    f('div.chat-card__title.tt-ellipsis', {},
                                                        f('p.tt-strong.tt-ellipsis', { 'data-test-selector': 'chat-card-title' }, title)
                                                    ),
                                                    // Subtitle
                                                    f('div.tt-ellipsis', {},
                                                        f('p.tt-c-text-alt-2.tt-ellipsis', { 'data-test-selector': 'chat-card-description' }, description)
                                                    ),
                                                )
                                            )
                                        )
                                    )
                                )
                            );

                            let container = f(`div#card-${ UUID.from(href).toStamp() }.chat-line__message`, { 'data-a-target': 'chat-line-message', 'data-test-selector': 'chat-line-message' },
                                f('div.tt-relative', {},
                                    f('div.tt-relative.chat-line__message-container', {},
                                        f('div', {},
                                            f('div.chat-line__no-background.tt-inline', {},
                                                card
                                            )
                                        )
                                    )
                                )
                            );

                            CHAT_CARDIFIED.set(href, container);
                            element.insertAdjacentElement('beforeend', container);
                        })
                        .catch(ERROR);
                }
            }
        })(GetChat());
    };
    Timers.link_maker__chat = -500;

    Unhandlers.link_maker__chat = () => {
        LINK_MAKER_ENABLED = false;

        $('.tt-iframe-card', true)
            .map(card => card.remove());
    };

    __LinkMaker__:
    if(LINK_MAKER_ENABLED = parseBool(Settings.link_maker__chat)) {
        REMARK("Adding link maker (chat)...");

        RegisterJob('link_maker__chat');
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
        START__STOP_WATCH('prevent_spam');

        (GetChat.onnewmessage = excerpt => {
            excerpt.forEach(async line => {
                let lookBack = parseInt(Settings.prevent_spam_look_back ?? 15),
                    minLen = parseInt(Settings.prevent_spam_minimum_length ?? 3),
                    minOcc = parseInt(Settings.prevent_spam_ignore_under ?? 5);

                let { handle, element, message, author } = line;

                let spam_placeholder = "chat-deleted-message-placeholder";

                function markAsSpam(element, type = 'spam', message) {
                    let span = furnish(`span.chat-line__message--deleted-notice.tiwtch-tools__spam-filter-${ type }`, { 'data-a-target': spam_placeholder, 'data-test-selector': spam_placeholder }, `message marked as ${ type }.`);

                    $('[data-test-selector="chat-message-separator"i] ~ * > *', true, element).forEach(sibling => sibling.remove());
                    $('[data-test-selector="chat-message-separator"i]', false, element).parentElement.append(span);

                    element.setAttribute(type, message);

                    let tooltip = new Tooltip(element, message, { direction: 'up' });

                    // Re-make the tooltip if the tooltip is too long to display correctly
                    // if(getOffset(tooltip).width > getOffset(element).width)
                    if(message.length > 60) {
                        tooltip.closest('[class]:not([aria-describedby])')?.remove();

                        new Tooltip(element, message, { direction: 'up', style: `width:fit-content; height:auto; white-space:break-spaces;` });
                    }
                }

                function spamChecker(message, author) {
                    if(message.length < 1 || RegExp(`^${USERNAME}$`, 'i').test(author))
                        return message;

                    // The same message is already posted (within X lines)
                    if( [...SPAM].slice(-lookBack).contains(message) )
                        markAsSpam(element, 'plagiarism', message);

                    // The message contains repetitive (more than X instances) words/phrases
                    if(RegExp(`([^]{${ minLen },})${ "(?:(?:[^]+)?\\1)".repeat(minOcc - 1) }`, 'i').test(message))
                        markAsSpam(element, 'repetitive', message);

                    return message;
                }

                // If not run asynchronously, `SPAM = ...` somehow runs before `spamChecker` and causes all messages to be marked as plagiarism
                new Promise(resolve => {
                    resolve(spamChecker(message, author));
                }).then(message => {
                    SPAM = [...SPAM, message].isolate();
                });
            })
        })(GetChat());

        JUDGE__STOP_WATCH('prevent_spam');
    };
    Timers.prevent_spam = -1000;

    __PreventSpam__:
    if(parseBool(Settings.prevent_spam)) {
        REMARK("Adding spam event listener...");

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
        AddCustomCSSBlock('SimplifyChat', `.tt-visible-message-even { background-color: #8882 }`);

        if(parseBool(Settings.simplify_chat_monotone_usernames))
            AddCustomCSSBlock('SimplifyChatMonotoneUsernames', `[data-a-target="chat-message-username"i] { color: var(--color-text-base) !important }`);

        if(parseBool(Settings.simplify_chat_font))
            AddCustomCSSBlock('SimplifyChatFont', `[class*="tt-visible-message"i] { font-family: ${ Settings.simplify_chat_font }, Sans-Serif !important }`);

        (GetChat.defer.onnewmessage = chat => {
            let allNodes = node => (node.childNodes.length? [...node.childNodes].map(allNodes): [node]).flat();

            chat.filter(line => !line.deleted)
                .forEach(({ element }) => {
                    let keep = !(element.hasAttribute('plagiarism') || element.hasAttribute('repetitive') || element.hasAttribute('tt-hidden-message'));

                    if(keep) {
                        element.classList.add(`tt-visible-message-${ ['even', 'odd'][SimplifyChatIndexToggle ^= 1] }`);

                        allNodes(element)
                            .filter(node => /\btext\b/i.test(node.nodeName))
                            .map(text => text.nodeValue = text.nodeValue.normalize('NFKD'));
                    }
                });
        })(GetChat());
    };
    Timers.simplify_chat = -250;

    Unhandlers.simplify_chat = () => {
        ['SimplifyChat', 'SimplifyChatMonotoneUsernames', 'SimplifyChatFont'].map(block => RemoveCustomCSSBlock(block));
    };

    __SimplifyChat__:
    if(parseBool(Settings.simplify_chat)) {
        REMARK("Applying readability settings...");

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
        START__STOP_WATCH('convert_bits');

        let dropdown = $('[class*="bits-buy"i]'),
            bits_counter = $('[class*="bits-count"i]:not([tt-tusda])', true),
            bits_cheer = $('[class*="cheer-amount"i]:not([tt-tusda])', true),
            hype_trains = $('[class*="community-highlight-stack"i] p:not([tt-tusda])', true);

        let bits_num_regexp = /([\d,]+)(?: +bits)?/i,
            bits_alp_regexp = /([\d,]+) +bits/i;

        let _0 = /(\D\d)$/;

        if(defined(dropdown))
            $('h5:not([tt-tusda])', true, dropdown).map(header => {
                let bits = parseInt(header.textContent.replace(/\D+/g, '')),
                    usd;

                usd = (bits * .01).toFixed(2);

                header.textContent += ` ($${ comify(usd).replace(_0, '$10') })`;

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

                    return `${ $0 } ($${ comify(usd).replace(_0, '$10') })`;
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

                    return `${ $0 } ($${ comify(usd).replace(_0, '$10') })`;
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

                    return `${ $0 } ($${ comify(usd).replace(_0, '$10') })`;
                });
        }

        JUDGE__STOP_WATCH('convert_bits');
    };
    Timers.convert_bits = 1000;

    __ConvertBits__:
    if(parseBool(Settings.convert_bits)) {
        REMARK("Adding Bit converter...");

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
        START__STOP_WATCH('rewards_calculator');

        __GetMultiplierAmount__:
        if(nullish(CHANNEL_POINTS_MULTIPLIER)) {
            let button = $('[data-test-selector="community-points-summary"i] button');

            if(defined(button)) {
                button.click();

                $('.reward-center-body [href*="//help.twitch.tv/"i]')
                    ?.closest('.reward-center-body')
                    ?.querySelector('button')
                    ?.click();

                CHANNEL_POINTS_MULTIPLIER = parseFloat($('#channel-points-reward-center-header h6')?.innerText) || 1;

                button.click();
            } else {
                CHANNEL_POINTS_MULTIPLIER = 1;
            }
        }

        let container = $('[data-test-selector="RequiredPoints"i]:not(:empty)')?.closest?.('button');

        if(nullish(container)) {
            JUDGE__STOP_WATCH('rewards_calculator');

            return REWARDS_CALCULATOR_TOOLTIP = null;
        }

        // Average broadcast time is 4.5h
        // Average number of streamed days is 5 (Mon - Fri)
        let averageBroadcastTime = (STREAMER.data?.dailyBroadcastTime ?? 16_200_000) / 3_600_000, // https://theemergence.co.uk/when-is-the-best-time-to-stream-on-twitch/#faq-question-1565821275069
            activeDaysPerWeek = (STREAMER.data?.activeDaysPerWeek ?? 5),
            pointsEarnedPerHour = 120 + (200 * +Settings.auto_claim_bonuses); // https://help.twitch.tv/s/article/channel-points-guide
        let timeLeftInBroadcast = averageBroadcastTime - (STREAMER.time / 3_600_000);

        // Set the progress bar of the button
        let have = parseFloat(parseCoin($('[data-test-selector="balance-string"i]')?.innerText) | 0),
            este = parseFloat(timeLeftInBroadcast * pointsEarnedPerHour * CHANNEL_POINTS_MULTIPLIER),
            goal = parseFloat($('[data-test-selector="RequiredPoints"i]')?.previousSibling?.textContent?.replace(/\D+/g, '') | 0),
            need = goal - have;

        container.setAttribute('style', `background:linear-gradient(to right,var(--color-background-button-primary-default) 0 ${ (100 * (have / goal)).toFixed(3) }%,var(--color-opac-p-8) 0 ${ (100 * ((have + este) / goal)).toFixed(3) }%,var(--color-background-button-disabled) 0 0); color:var(--color-text-base)!important; text-shadow:0 0 1px var(--color-background-alt);`);

        REWARDS_CALCULATOR_TOOLTIP ??= new Tooltip(container);

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
            return fetch(Runtime.getURL(`_locales/${ language }/settings.json`))
                .then(response => response.json())
                .then(json => {
                    let _ = json['?'],
                        { minute, hour, day, week, month, year, century } = _;

                    minute ??= _['@@minute'];
                    hour ??= _['@@hour'];
                    day ??= _['@@day'];
                    week ??= _['@@week'];
                    month ??= _['@@month'];
                    year ??= _['@@year'];
                    century ??= _['@@century'];

                    return { minute, hour, day, week, month, year, century };
                });
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
                // Adopted from /_locales/bg/settings.json
                // Достъпно по време на този поток (33 минути)
                // Предлага се в още 33 потока (3 седмици)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `${ (streams < 1 || hours < timeLeftInBroadcast)? 'Достъпно по време на този': `Предлага се в още ${ comify(streams) }` } ${ "поток" + ["и","а"][+(streams > 1)] } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'cs': {
                // Adopted from /_locales/cs/settings.json
                // Dostupné během tohoto streamu (33 minut)
                // K dispozici v dalších 33 streamech (3 týdny)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `${ (streams < 1 || hours < timeLeftInBroadcast)? 'Dostupné během tohoto': `K dispozici v dalších ${ comify(streams) }` } ${ "stream" + ["u","ech"][+(streams > 1)] } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'da': {
                // Adopted from /_locales
                // Tilgængelig under denne stream (33 minutter)
                // Tilgængelig i 33 flere streams (3 uger)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `Tilgængelig ${ (streams < 1 || hours < timeLeftInBroadcast)? 'under denne': `i ${ comify(streams) } flere` } ${ "stream".pluralSuffix(streams, "s") } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'de': {
                // Adopted from /_locales/de/settings.json
                // In diesem Strom verfügbar (30 Minuten)
                // Erhältlich in 33 mehr Streams (3 Wochen)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `${ (streams < 1 || hours < timeLeftInBroadcast)? 'In diesem Strom': `Erhältlich in ${ comify(streams) } mehr` } ${ "Stream".pluralSuffix(streams, "s") } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'fi': {
                // Adopted from /_locales/fi/settings.json
                // Saatavilla tämän streamin aikana (33 minuuttia)
                // Saatavilla vielä 33 suorana (3 viikkoa)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `Saatavilla ${ (streams < 1 || hours < timeLeftInBroadcast)? 'tämän streamin aikana': `vielä ${ comify(streams) } suorana` } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'hu': {
                // Adopted from /_locales/hu/settings.json
                // Elérhető a stream alatt (33 perc)
                // 33 további adatfolyamban elérhető (3 hét)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `${ (streams < 1 || hours < timeLeftInBroadcast)? 'Elérhető a stream alatt': `${ comify(streams) } további adatfolyamban elérhető` } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'no': {
                // Adopted from /_locales/no/settings.json
                // Tilgjengelig under denne strømmen (33 minutter)
                // Tilgjengelig i 33 strømmer til (3 uker)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `Tilgjengelig ${ (streams < 1 || hours < timeLeftInBroadcast)? 'under denne strømmen': `i ${ comify(streams) } strømmer til` } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'pl': {
                // Adopted from /_locales/pl/settings.json
                // Dostępne podczas tej transmisji (33 minuty)
                // Dostępne w 33 kolejnych strumieniach (3 tygodnie)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `Dostępne ${ (streams < 1 || hours < timeLeftInBroadcast)? 'podczas tej transmisji': `w ${ comify(streams) } kolejnych strumieniach` } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'sk': {
                // Adopted from /_locales/sk/settings.json
                // Dostupné počas tohto streamu (33 minút)
                // Dostupné v 33 ďalších streamoch (3 týždne)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `Dostupné ${ (streams < 1 || hours < timeLeftInBroadcast)? 'počas tohto': `v ${ comify(streams) }` } ${ "stream" + ["u","och"][+(streams > 1)] } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'tr': {
                // Adopted from /_locales/tr/settings.json
                // Bu yayın sırasında kullanılabilir (33 dakika)
                // 33 akışta daha mevcuttur (3 hafta)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `${ (streams < 1 || hours < timeLeftInBroadcast)? 'Bu yayın sırasında kullanılabilir': `${ comify(streams) } akışta daha mevcuttur` } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'el': {
                // Adopted from /_locales/el/settings.json
                // Διαθέσιμο κατά τη διάρκεια αυτής της ροής (33 λεπτά)
                // Διαθέσιμο σε 33 ακόμη ροές (3 εβδομάδες)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `Διαθέσιμο ${ (streams < 1 || hours < timeLeftInBroadcast)? 'κατά τη διάρκεια αυτής της': `σε ${ comify(streams) } ακόμη` } ${ "ρο" + ["ής","ές"][+(streams > 1)] } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'fr': {
                // Adopted from /_locales/fr/settings.json
                // Disponible pendant ce stream (33 minutes)
                // Disponible dans 33 flux supplémentaires (3 semaines)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `Disponible ${ (streams < 1 || hours < timeLeftInBroadcast)? 'pendant ce stream': `dans ${ comify(streams) } flux supplémentaires` } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'nl': {
                // Adopted from /_locales/nl/settings.json
                // Beschikbaar tijdens deze stream (33 minuten)
                // Beschikbaar in nog 33 streams (3 weken)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `Beschikbaar ${ (streams < 1 || hours < timeLeftInBroadcast)? 'tijdens deze': `in nog ${ comify(streams) }` } ${ "stream".pluralSuffix(streams, "s") } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'it': {
                // Adopted from /_locales/it/settings.json
                // Disponibile durante questo streaming (33 minuti)
                // Disponibile in altri 33 stream (3 settimane)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `Disponibile ${ (streams < 1 || hours < timeLeftInBroadcast)? 'durante questo': `in altri ${ comify(streams) }` } ${ "stream" + ["ing",""][+(streams > 1)] } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'ro': {
                // Adopted from /_locales/ro/settings.json
                // Disponibil în timpul acestui flux (33 de minute)
                // Disponibil în încă 33 de fluxuri (3 săptămâni)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `Disponibil în ${ (streams < 1 || hours < timeLeftInBroadcast)? 'timpul acestui': `încă  ${ comify(streams) } de` } ${ "flux" + ["","uri"][+(streams > 1)] } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'ja': {
                // Adopted from /_locales/ja/settings.json
                // このストリーム中に利用可能（33分）
                // さらに33のストリームで利用可能（3週間）

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `${ (streams < 1 || hours < timeLeftInBroadcast)? 'このストリーム中に': `さらに${ comify(streams) }のストリームで` } ${ "利用可能" + ["_","s"][+(streams > 1)] } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'zh-ch': {
                // Adopted from /_locales/zh/settings.json
                // 在此直播期间可用（33 分钟）
                // 在另外 33 个流中可用（3 周）

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `${ (streams < 1 || hours < timeLeftInBroadcast)? '在此直播期间可用': `在另外 ${ comify(streams) } 个流中可用` } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'zh-tw': {
                // Adopted from /_locales/zh/settings.json
                // 在此直播期間可用（33 分鐘）
                // 在另外 33 個流中可用（3 週）

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `${ (streams < 1 || hours < timeLeftInBroadcast)? '在此直播期間可用': `在另外 ${ comify(streams) } 個流中可用` } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'ko': {
                // Adopted from /_locales/ko/settings.json
                // 이 스트림 동안 사용 가능(33분)
                // 33개 이상의 스트림에서 사용 가능(3주)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `${ (streams < 1 || hours < timeLeftInBroadcast)? '이 스트림 동안': `${ comify(streams) }개 이상의 스트림에서` } 사용 가능 (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'sv': {
                // Adopted from /_locales/sv/settings.json
                // Tillgänglig under denna stream (33 minuter)
                // Tillgänglig i ytterligare 33 streams (3 veckor)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `Tillgänglig ${ (streams < 1 || hours < timeLeftInBroadcast)? 'under denna': `i ytterligare ${ comify(streams) }` } ${ "stream".pluralSuffix(streams, "s") } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'th': {
                // Adopted from /_locales/th/settings.json
                // ได้ในสตรีมนี้ (33 นาที)
                // พร้อมให้บริการในอีก 33 สตรีม (3 สัปดาห์)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `${ (streams < 1 || hours < timeLeftInBroadcast)? 'ได้ในสตรีมนี้': `พร้อมให้บริการในอีก ${ comify(streams) } สตรีม` } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'vi': {
                // Adopted from /_locales/vi/settings.json
                // Có sẵn trong luồng này (33 phút)
                // Có sẵn trong 33 luồng khác (3 tuần)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `Có sẵn trong ${ (streams < 1 || hours < timeLeftInBroadcast)? '': comify(streams) } ${ "luồng " + ["này","khác"][+(streams > 1)] } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'es': {
                // Adopted from /_locales/es/settings.json
                // Disponible durante este arroyo (30 minutos)
                // Disponible en 33 arroyos más (3 semanas)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `Disponible ${ (streams < 1 || hours < timeLeftInBroadcast)? 'durante este arroyo': `en ${ comify(streams) } arroyos más` } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'ru': {
                // Adopted from /_locales/ru/settings.json
                // Доступно во время этого потока (30 минут)
                // Доступно в 33 ручьях (3 недели)

                estimates(T_L)
                    .then(estimates => {
                        estimated = estimates[estimated].pop();

                        REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                            `Доступно ${ (streams < 1 || hours < timeLeftInBroadcast)? 'во время этого потока': `в ${ comify(streams) } ручьях` } (${ correct(estimated, timeEstimated) })`;
                    });
            } break;

            case 'en':
            default: {
                // Available during this stream (30 minutes)
                // Available in 33 more streams (3 weeks)

                REWARDS_CALCULATOR_TOOLTIP.innerHTML =
                    `Available ${ (streams < 1 || hours < timeLeftInBroadcast)? 'during this': `in ${ comify(streams) } more` } ${ "stream".pluralSuffix(streams, "s") } (${ comify(timeEstimated) } ${ estimated.pluralSuffix(timeEstimated) })`;
            } break;
        }

        JUDGE__STOP_WATCH('rewards_calculator');
    };
    Timers.rewards_calculator = 250;

    __RewardsCalculator__:
    if(parseBool(Settings.rewards_calculator)) {
        REMARK("Adding Rewards Calculator...");

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

        top.postMessage({ action: 'jump', points_receipt_placement: { balance, coin_face: coin?.src, coin_name: coin?.alt, exact_debt, exact_change } }, top.location.origin);
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
        START__STOP_WATCH('recover_chat');

        let [chat] = $('[role="log"i], [role="tt-log"i], [data-test-selector="banned-user-message"i], [data-test-selector^="video-chat"i]', true),
            error = $('[class*="chat"i][class*="content"] .core-error');

        if(defined(error)) {
            $('[data-a-target*="welcome"i]')?.append(furnish('p', { style: 'text-decoration:underline var(--color-error)' }, `There was an error loading chat: ${error.textContent}`));
            error.remove();
        }

        if(defined(chat))
            return;

        // Add an iframe...
        let [,name] = ([,STREAMER?.name] ?? top.location.pathname.split(/\W/, 2)),
            input = $('.chat-input'),
            iframe = furnish(`iframe#tt-popup-container.stream-chat.tt-c-text-base.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-full-height.tt-relative`, {
                src: `./popout/${name}/chat`,
                role: "tt-log",
            }),
            container = $('.chat-shell', false, top.document);

        container?.parentElement?.replaceChild(iframe, container);

        JUDGE__STOP_WATCH('recover_chat');
    };
    Timers.recover_chat = 500;

    __RecoverChat__:
    if(parseBool(Settings.recover_chat)) {
        RegisterJob('recover_chat');
    }
    // End of Chat__Initialize
};
// End of Chat__Initialize

let Chat__Initialize_Safe_Mode = async(START_OVER = false) => {
    let USERNAME, LANGUAGE, THEME,
        PATHNAME, STREAMER,
        GLOBAL_EVENT_LISTENERS;

    // Fill STREAMER
    let [path, name, endpoint] = window.location.pathname.split(/(?<!^)\//),
        sole = parseInt($('img[class*="channel"i][class*="point"i][class*="icon"i]')?.innerText?.replace(/[^]*\/(\d+)\/[^]*/, '$1')) || null;

    USERNAME ??= Search?.cookies?.name;
    STREAMER ??= ({ name: (name ?? path), sole });

    // Fill GLOBAL_EVENT_LISTENERS
    GLOBAL_EVENT_LISTENERS ??= {};

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
        let raiding = defined($('[data-test-selector="raid-banner"i]')),
            atTop = (top == window);

        if(RAID_LOGGED || atTop || !raiding)
            return;
        RAID_LOGGED ||= raiding;

        let { current = false } = parseBool(parseURL(window.location).searchParameters);
        let raid_banner = $('[data-test-selector="raid-banner"i] strong', true).map(strong => strong?.innerText),
            [,from,] = window.location.pathname.split(/(?<!^)\//),
            [to] = raid_banner.filter(name => !RegExp(`^${ from }$`, 'i').test(name));

        // Already on the channeling that's raiding...
        if(current)
            return;

        WARN(`There is a raid happening on another channel... ${ from } → ${ to } (${ raid_banner.join(' to ') })`);

        Runtime.sendMessage({ action: 'LOG_RAID_EVENT', data: { from, to } }, async({ events }) => {
            WARN(`${ from } has raided ${ events } time${ (events != 1? 's': '') } this week. Current raid: ${ to } @ ${ (new Date) }`);

            let payable = defined($('[data-test-selector="balance-string"i]'));

            top.postMessage({ action: 'raid', from, to, events, payable }, top.location.origin);
        });
    };
    Timers.greedy_raiding = 5000;

    Unhandlers.greedy_raiding = () => {};

    __GreedyRaiding__:
    if(parseBool(Settings.greedy_raiding)) {
        // REMARK('[CHILD] Adding raid-watching logic...');

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
        balanceButton = $('[data-test-selector="balance-string"i]')?.closest('button'),
        hasPointsEnabled = false;

    Handlers.point_watcher_helper = async() => {
        LoadCache(['ChannelPoints'], ({ ChannelPoints }) => {
            let [amount, fiat, face, notEarned, pointsToEarnNext] = ((ChannelPoints ??= {})[STREAMER.name] ?? 0).toString().split('|'),
                allRewards = $('[data-test-selector="cost"i]', true),
                balance = $('[data-test-selector="balance-string"i]');

            hasPointsEnabled ||= defined(balance);

            amount = (STREAMER.coin = balance?.innerText ?? (hasPointsEnabled? amount: '&#128683;'));
            fiat = (STREAMER.fiat ??= fiat ?? 0);
            face = (STREAMER.face ??= face ?? '');
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

            SaveCache({ ChannelPoints });
        });
    };
    Timers.point_watcher_helper = 15_000;

    Unhandlers.point_watcher_helper = () => {
        $('.tt-point-amount', true)
            .forEach(span => span?.remove());
    };

    __PointWatcherHelper__:
    if(parseBool(Settings.point_watcher_placement)) {
        RegisterJob('point_watcher_helper');

        if(defined(balanceButton)) {
            balanceButton.click();
            wait(300).then(() => balanceButton.click());
        }
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

        LOG(`Performing Soft Unban...`);

        let f = furnish;

        let { name, fiat } = (STREAMER ?? { name: top.location.pathname.split(/\W/, 2)[1], fiat: 'Channel Points' }),
            url = parseURL(`https://nightdev.com/hosted/obschat/`).addSearch({
                theme: `bttv_${ THEME }`,
                channel: name,
                fade: parseBool(Settings.soft_unban_fade_old_messages),
                bot_activity: parseBool(Settings.soft_unban_keep_bots),
                prevent_clipping: parseBool(Settings.soft_unban_prevent_clipping),
            }),
            iframe = f(`iframe#tt-proxy-chat`, { src: url.href, style: `width: 100%; height: 100%` }),
            preBanner =
                f('div#tt-banned-banner.tt-pd-b-2.tt-pd-x-2', {},
                    f('div.tt-border-t.tt-pd-b-1.tt-pd-x-2'),
                    f('div.tt-align-center', {},
                        f('p.tt-c-text.tt-strong', { 'data-test-selector': "current-user-timed-out-text" },
                            `Messages from ${ name } chat.`
                        ),
                        f('p.tt-c-text-alt-2', {},
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
            WARN(`Could not perform "old" unban method`, error);

            chat = $('.chat-input');
            cont = chat.previousElementSibling;

            try {
                chat.insertBefore(
                    preBanner,
                    chat.firstElementChild
                );

                cont.replaceChild(iframe, cont.firstChild);
            } catch(error) {
                WARN(`Could not perform "new" unban method`, error);
            }
        }
    };
    Timers.soft_unban = -2_500;

    Unhandlers.soft_unban = () => {
        let iframe = $('iframe#tt-proxy-chat'),
            div = furnish('div.tt-flex');

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
    if(top != window) {
        if(parseBool(parseURL(window.location).searchParameters.current))
            until(() => $('button[data-a-target*="carousel"i]'))
                .then(button => {
                    button.click();

                    until(() => $('[data-badge-id]'))
                        .then(() => {
                            let IS_CHANNEL_VIP = defined($('[data-badge-id^="vip"i]')),
                                IS_CHANNEL_MODERATOR = defined($('[data-badge-id^="mod"i]'));

                            // LOG('VIP status →', IS_CHANNEL_VIP, '· Moderator status →', IS_CHANNEL_MODERATOR);

                            top.postMessage({ action: 'jump', IS_CHANNEL_VIP, IS_CHANNEL_MODERATOR }, top.location.origin);
                        })
                        .then(() => wait(1000).then(button.click()));
                });
    }
    // End of Chat__Initialize_Safe_Mode
};
// End of Chat__Initialize_Safe_Mode

let Chat__CUSTOM_CSS,
    Chat__PAGE_CHECKER,
    Chat__WAIT_FOR_PAGE,
    Chat__SETTING_RELOADER;

Chat__PAGE_CHECKER = setInterval(Chat__WAIT_FOR_PAGE = async() => {
    // Only executes if the user is banned
    let banned = STREAMER?.veto || parseBool($('[class*="banned"i]', true)?.length);

    // Keep hidden iframes from loading resources
    let { hidden } = parseURL(window.location).searchParameters;

    if([banned, hidden].map(parseBool).contains(true)) {
        if(!parseBool(hidden))
            WARN('[NON_FATAL] Child container unavailable. Reason:', { banned, hidden });

        wait(5000).then(Chat__Initialize_Safe_Mode);
        clearInterval(Chat__PAGE_CHECKER);

        return Settings = await GetSettings();
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
                    && top.document.readyState == 'complete'

                    // The follow button exists
                    && defined($(`[data-a-target="follow-button"i], [data-a-target="unfollow-button"i]`))

                    // There are channel buttons on the side
                    && parseBool($('#sideNav .side-nav-section[aria-label]', true)?.length)
                )

                // This window is not the main container
                || (true
                    && top != window
                    && window.document.readyState == 'complete'

                    // There is a welcome message container
                    && defined($(`[data-a-target*="welcome"i]`))
                )
            )
        )
        // There isn't an advertisement playing
        && nullish($('[data-a-target*="ad-countdown"i]'))

        // There is at least one proper container
        && (false
            // There is a message container
            || defined($('[data-test-selector$="message-container"i]'))

            // There is an error message
            || defined($('[data-a-target="core-error-message"i]'))
        )
    );

    if(!ready)
        return;

    LOG("Child container ready");

    Settings = await GetSettings();

    wait(5000).then(Chat__Initialize);
    clearInterval(Chat__PAGE_CHECKER);

    window.CHILD_CONTROLLER_READY = true;

    // Only re-execute if in an iframe
    if(top != window) {
        // Observe [top] location changes
        LocationObserver: {
            let { body } = document,
                observer = new MutationObserver(mutations => {
                    mutations.map(mutation => {
                        if(PATHNAME !== top.location.pathname) {
                            let OLD_HREF = PATHNAME;

                            PATHNAME = top.location.pathname;

                            for(let [name, func] of __ONLOCATIONCHANGE__)
                                func(new CustomEvent('locationchange', { from: OLD_HREF, to: PATHNAME }));
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
                                author = handle.toLowerCase().replace(/[^]+?\((\w+)\)/, '$1'),
                                message = $('[data-test-selector="chat-message-separator"i] ~ * > *', true, line),
                                mentions = $('.mention-fragment', true, line).map(element => element.innerText.replace('@', '').toLowerCase()).filter(text => /^[a-z_]\w+$/i.test(text)),
                                badges = $('.chat-badge', true, line).map(img => img.alt.toLowerCase()),
                                style = $('.chat-line__username [style]', true, line).map(element => element.getAttribute('style')).join(';'),
                                reply = $('button[data-test-selector="chat-reply-button"i]', false, line);

                            let raw = line.innerText?.trim(),
                                containedEmotes = [];

                            message = message
                                .map(element => {
                                    let string;

                                    if(keepEmotes && ((element.dataset.testSelector == 'emote-button') || element.dataset.ttEmote?.length)) {
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

                            // Replace all share URLs
                            // line.innerHTML = line.innerHTML.replace(/\bshare:([\w\-]{8,})/g, ($0, $1) => furnish('a', { href: Runtime.getURL(`settings.html?sync-token=${ $1 }`), target: '_blank', rel: 'noreferrer', referrerpolicy: 'no-referrer' }, `share://${ $1 }`).outerHTML);

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
                                emotes: containedEmotes.map(string => string.replace(/^:|:$/g, '')).isolate(),
                                deleted: defined($('[class*="--deleted-notice"i]', false, line)),
                                highlighted: !!(line.classList.value.split(' ').filter(value => /^chat-line--/i.test(value)).length),
                            });
                        }
                    }

                    results.emotes = emotes;

                    for(let [name, callback] of GetChat.__onnewmessage__)
                        callback(results);
                });

            if(nullish(chat))
                break ChatObserver;

            observer.observe(chat, { childList: true });
        }

        // Override variables
        Overrides: {
            window.ALLOWED_JOBS ??= (parseURL(window.location).searchParameters?.allow || '').split(',');

            // Registers a job
                // @override RegisterJob(JobName:string) → Number<IntervalID>
            window.RegisterJob = function RegisterJob(JobName, JobReason = 'default') {
                RegisterJob.__reason__ = JobReason;

                // Prevent disallowed jobs...
                if(ALLOWED_JOBS.length && ALLOWED_JOBS.missing(JobName))
                    return;

                return Jobs[JobName] ??= Timers[JobName] > 0?
                    setInterval(Handlers[JobName], Timers[JobName]):
                -setTimeout(Handlers[JobName], -Timers[JobName]);
            }
        }
    }

    top.onlocationchange = () => {
        WARN("[Child] Re-initializing...");

        // Do NOT soft-reset ("turn off, turn on") these settings
        // They will be destroyed, including any data they are using
        let VOLATILE = top?.VOLATILE ?? [].map(AsteriskFn);

        DestroyingJobs:
        for(let job in Jobs)
            if(!!~VOLATILE.findIndex(name => name.test(job)))
                continue DestroyingJobs;
            else
                RestartJob(job);

        Reinitialize:
        if(NORMAL_MODE) {
            if(Settings.keep_popout) {
                Chat__PAGE_CHECKER ??= setInterval(Chat__WAIT_FOR_PAGE, 500);

                break Reinitialize;
            }

            // Handled by parent controller
            // location.reload();
        }
    };

    // Add custom styling
    CustomCSSInitializer: {
        Chat__CUSTOM_CSS = $('#tt-custom-chat-css') ?? furnish('style#tt-custom-chat-css', {});

        Chat__CUSTOM_CSS.innerHTML =
        `
        /* [data-a-page-loaded-name="PopoutChatPage"i] [class*="chat"i][class*="header"i] { display: none !important; } */

        #tt-auto-claim-bonuses .tt-z-above, [plagiarism], [repetitive] { display: none }
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

        [class*="theme"i][class*="dark"i] [tt-light="true"i], [class*="theme"i][class*="dark"i] [class*="chat"i][class*="status"i] { background-color: var(--color-opac-w-4) !important }
        [class*="theme"i][class*="light"i] [tt-light="true"i], [class*="theme"i][class*="light"i] [class*="chat"i][class*="status"i] { background-color: var(--color-opac-b-4) !important }

        .chat-line__message[style] a {
            color: var(--color-text-alt);
            text-decoration: underline;
        }

        .tt-emote-captured [data-test-selector="badge-button-icon"i],
        .tt-emote-bttv [data-test-selector="badge-button-icon"i] {
            left: 0;
            top: 0;
        }
        `;

        Chat__CUSTOM_CSS?.remove();
        $('body').append(Chat__CUSTOM_CSS);
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

        Storage.set({ onInstalledReason: null });
    }
}, 500);

Chat__SETTING_RELOADER = setInterval(() => {
    for(let MAX_CALLS = 60; MAX_CALLS > 0 && top.REFRESH_ON_CHILD?.length; --MAX_CALLS)
        RestartJob(top.REFRESH_ON_CHILD.pop());
}, 250);
