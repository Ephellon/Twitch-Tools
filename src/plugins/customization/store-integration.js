/*** /plugins/customization/store-integration.js
 * Game Overview Card | Store Integration.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'game_overview_card',
    timer: 5_000,

    handler: () => {
        let existing = $('#game-overview-card');

        if(existing?.dataset?.game?.equals(STREAMER.game))
            return;
        existing?.remove();

        let { href = '', origin, protocol, scheme, host, hostname, domainPath = [], port, pathname, search, hash } = parseURL(STREAMER.game.href);

        if(false
            || (href.trim().length < 4)
            || (domainPath.length < 2)
        )
            return;

        let timerStart = +new Date;

        let MATURE_HINTS = ['ADULT', 'MATUR', 'NSFW', ...16..to(99)],
            RATING_STYLING = `max-height:10rem; max-width:6rem; position:absolute; left:50%; bottom:-9rem; transform:translate(-50%);`;

        /*await*/ fetchURL.fromDisk(href, { hoursUntilEntryExpires: 8, keepDefectiveEntry: true })
            .then(response => response.text())
            .then(DOMParser.stripBody)
            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
            .catch($warn)
            .then(DOM => {
                if(!(DOM instanceof Document))
                    throw TypeError(`No DOM available. Page not loaded`);

                let f = furnish;
                let get = property => DOM.get(property);

                let [title, description, image] = ["title", "description", "image"].map(get),
                    error = DOM.querySelector('parsererror')?.textContent;

                let ok = $.defined('meta[property="og:image"i]');

                if(!ok)
                    throw `No metadata available for "${ STREAMER.game }"`;

                $log(`Loaded page: Game @ ${ href }`, { title, description, image, DOM, size: (DOM.documentElement.innerHTML.length * 8).suffix('B', 2, 'data'), time: ((+new Date - timerStart) / 1000).suffix('s', false) });

                if(!title?.length || !image?.length) {
                    if(!error?.length)
                        return;
                    else
                        throw error;
                }

                title = title.replace(/[\s\-]*twitch\s*$/i, '').replace(/^\s*$/, STREAMER.game);

                let card = f('.tt-iframe-card.tt-border-radius-medium.tt-elevation-1').with(
                    f('.tt-border-radius-medium.tt-c-background-base.tt-flex.tt-full-width').with(
                        f('.tt-block.tt-border-radius-medium.tt-full-width.tt-interactable', { style: 'color:inherit; text-decoration:none; min-height:12rem; height:fit-content' },
                            f('.chat-card.tt-flex.tt-flex-nowrap.tt-pd-05', {
                                style: 'min-height:30rem',
                            },
                                // Preview image
                                f('.chat-card__preview-img.tt-align-items-center.tt-c-background-alt-2.tt-flex.tt-flex-shrink-0.tt-justify-content-center', {
                                    style: 'background-color:#0000!important;height:4.5rem;width:15rem'
                                },
                                    f('.tt-card-image').with(
                                        f('.tt-aspect', { style: 'transform:translate(0,40%)' },
                                            f('img.tt-image.game-card-img', {
                                                alt: title,
                                                src: image.replace(/^(?!(?:https?:)?\/\/[^\/]+)\/?/i, `${ top.location.protocol }//${ host }/`),
                                                style: 'height:15rem; object-fit:cover',
                                                ok: /\/ttv-boxart\//i.test(image),
                                            }),
                                            f('img#tt-content-rating-placeholder', { src: `//image.api.playstation.com/grc/images/ratings/hd/esrb/rp.png`, style: RATING_STYLING })
                                        )
                                    )
                                ),
                                // Title & Subtitle
                                f('.tt-align-items-center.tt-flex.tt-overflow-hidden').with(
                                    f('.tt-full-width.tt-pd-l-1').with(
                                        // Title
                                        f('.chat-card__title.tt-ellipsis').with(
                                            f('h3.tt-strong.tt-ellipsis.tt-auto-marquee[@testSelector=chat-card-title]').with(title)
                                        ),
                                        // Subtitle
                                        f('.tt-ellipsis').with(
                                            f('p.tt-c-text-alt-2[@testSelector=chat-card-description][@twitch-provided-description]', { style: 'white-space:break-spaces;max-height:40vh;overflow:auto' }).with(description)
                                        ),
                                        // Footer
                                        f('#tt-purchase-container.tt-ellipsis').with(
                                            f.br(),
                                            f('#tt-steam-purchase'),
                                            f('#tt-playstation-purchase'),
                                            f('#tt-xbox-purchase'),
                                            f('#tt-nintendo-purchase'),
                                            f('#tt-epic-purchase')
                                        )
                                    )
                                )
                            )
                        )
                    )
                );

                let container = f(`#game-overview-card[@game="${ STREAMER.game }"]`, {
                    style: `animation:1s fade-in 1; max-width:fit-content; overflow:visible; overflow-wrap:normal; margin-bottom:3rem`
                },
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

                new Tooltip($('[data-a-target$="game-link"i]'), `Read about <ins>${ title }</ins> below`, { from: 'top' });
                $('.about-section__panel--content')?.closest('*:not([style]):not([class]):not([id])')?.insertAdjacentElement('afterend', container);
            })
            .catch($error);

            if(parseBool(Settings.simplify_look_auto_marquee))
                setInterval(() => {
                    for(let auto of $.all('.tt-auto-marquee')) {
                        let { textOverflowX = false } = getOffset(auto);

                        if(textOverflowX) {
                            let html = auto.innerHTML;

                            auto.innerHTML = furnish(`marquee[behavior=alternate][scrollamount=2]`).html(html).outerHTML;
                            auto.classList.remove('tt-auto-marquee');
                        }
                    }
                }, 3_000);

            /***
             *       _____ _                   _____       _                       _   _
             *      / ____| |                 |_   _|     | |                     | | (_)
             *     | (___ | |_ ___  _ __ ___    | |  _ __ | |_ ___  __ _ _ __ __ _| |_ _  ___  _ __
             *      \___ \| __/ _ \| '__/ _ \   | | | '_ \| __/ _ \/ _` | '__/ _` | __| |/ _ \| '_ \
             *      ____) | || (_) | | |  __/  _| |_| | | | ||  __/ (_| | | | (_| | |_| | (_) | | | |
             *     |_____/ \__\___/|_|  \___| |_____|_| |_|\__\___|\__, |_|  \__,_|\__|_|\___/|_| |_|
             *                                                      __/ |
             *                                                     |___/
             */

            // On by Default (ObD; v5.29)
            if(nullish(Settings.store_integration) || parseBool(Settings.store_integration)) {
                // Get the Country code and Language code
                // e.g. "en-US"
                let lang = navigator.language,
                    [langCode, counCode = ''] = lang.split('-'),
                    [langName] = (ISO_639_1[langCode]?.names || [navigator.language]),
                    game = STREAMER.game,
                    gameURI = encodeURIComponent(game);

                let timeout = 15_000;

                // Removes quotations and apostrophes
                let LE_QUOTES = /[\u2033\u2036\u275d\u275e]/gu,
                    LE_APOSTE = /[\u0312-\u0315\u031b\u2032\u2035\u275b\u275c\u2019\u201a]/gu;

                // Removes symbols like ™ ® © etc.
                let NON_ASCII = /[^\p{L}\d `\-=~!@#\$%^&\*\(\)\+\{\}\|\[\]\\:;"'<>\?,\.\/]/gu;

                // The item can not be found
                const ITEM_NOT_FOUND = Symbol('NOT_FOUND');

                // The imperfect match threshold percentage: 1.5%
                const PARTIAL_MATCH_THRESHOLD = .015;

                // Remove trademarks to better match games
                let PlayStationRegExp = /\bPS\s*(\d|one|p(ortable)?|v(ita)?|(plus|\+)|move|vr(\s*\d)?).*$/i,
                    // Removes common trademarks → PS one,PS1,PS2,PS3,PS4,PS5,PSP,PS Portable,PSV,PSVita,PS Plus,PS+,PS Move,PS VR,PS VR2

                    XboxRegExp = /\bXbox\s*(\d+|live|one\s*(series\s*)?([x\|s]+\s*)?(enhanced)?)?.*$/i,
                    // Removes common trademarks → Xbox,Xbox 360,Xbox Live,Xbox One,Xbox One X|S,Xbox One X,Xbox One X Enhanced,Xbox One S,Xbox One Series X|S,Xbox One Series X,Xbox One Series X Enhanced,Xbox One Series S

                    NintendoRegExp = /\bNintendo\s*(64|[23]?DS\s*(i|XL)?|Switch|Game[\s-]?(Boy(\s*Advance)?|Cube)|Wii([\s-]?U)?)/i,
                    // Removes common trademarks → Nintendo Switch,Nintendo 3DS,Nintendo 2DS,Nintendo 64,Nintendo DSi,Nintendo DS,Nintendo GameBoy,Nintendo GameBoy Advance,Nintendo Wii,Nintendo Wii U

                    SteamRegExp = /(Valve\s+)?\bSteam\s+(Deck(\s+O?LED)?)/i,
                    // Removes common trademarks → Steam

                    EpicRegExp = /(?:Epic\s+Games)/i,
                    // Removes common trademarks → Epic

                    EditionsRegExp = /\s*(([-~:]\s*)?([\p{L}\s'-]){3,}\s*)(Edition|Season|Episode)s?(\s+[:\-\dIVXLCD]+)?[^$]+/iu;
                    // Removes common "editions" → Standard,Digital,Deluxe,Digital Deluxe,Definitive,Anniversary,Complete,Extended,Ultiamte,Collector's,Bronze,Silver,Gold,Platinum,Enhanced,Premium,Complete Season,etc.

                function normalize(string, ...conditions) {
                    conditions = [
                        [LE_QUOTES, '"'],
                        [LE_APOSTE, "'"],
                        [NON_ASCII, ''],
                    ].concat(conditions);

                    for(let [expression, replacement] of conditions)
                        string = string?.replace(expression, replacement);

                    return string?.replace(/[\u2010-\u2015]/g, '-')?.replace(EditionsRegExp, '') ?? '';
                }

                /*** Get the Steam link (if applicable)
                 *       _____ _
                 *      / ____| |
                 *     | (___ | |_ ___  __ _ _ __ ___
                 *      \___ \| __/ _ \/ _` | '_ ` _ \
                 *      ____) | ||  __/ (_| | | | | | |
                 *     |_____/ \__\___|\__,_|_| |_| |_|
                 *
                 *
                 */
                Steam: if(parseBool(Settings.store_integration__steam)) {
                    async function fetchSteamGame(game) {
                        return fetchURL.fromDisk(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/steam/${ (game[0].toLowerCase().replace(/[^a-z]/, '_')) }.json`, { hoursUntilEntryExpires: 168 })
                            .then(r => r.json())
                            .then(data => {
                                let [best, ...othr] = data.sort((prev, next) =>
                                    normalize(prev.name, [SteamRegExp, ''])
                                        .errs(game)
                                    - normalize(next.name, [SteamRegExp, ''])
                                        .errs(game)
                                )
                                    .slice(0, 60)
                                    .sort((prev, next) =>
                                        normalize(prev.name, [SteamRegExp, ''])
                                            .toLowerCase()
                                            .distanceFrom(game.toLowerCase())
                                        - normalize(next.name, [SteamRegExp, ''])
                                            .toLowerCase()
                                            .distanceFrom(game.toLowerCase())
                                    )
                                    .sort((prev, next) =>
                                        !isNaN(parseFloat((next.price + '').replace(/^free$/i, '0')))
                                            ? +0
                                            : !isNaN(parseFloat((prev.price + '').replace(/^free$/i, '0')))
                                                ? -1
                                                : +1
                                    );

                                if(false
                                    || best.name.equals(game)
                                    || normalize(best.name, [SteamRegExp, ''])
                                        .trim()
                                        .equals(game)
                                    || normalize(best.name, [SteamRegExp, ''])
                                        .errs(game) < PARTIAL_MATCH_THRESHOLD
                                ) return ({
                                    game,
                                    good: (
                                        normalize(best.name, [SteamRegExp, ''])
                                            .errs(game, true) < PARTIAL_MATCH_THRESHOLD
                                    ),
                                    name: best.name,
                                    href: best.href,
                                    img: best.image,
                                    price: best.price,
                                });

                                throw ITEM_NOT_FOUND;
                            })
                            .catch(error => {
                                // Fallback: Search the store normally
                                if(error == ITEM_NOT_FOUND)
                                    return /*await*/ fetchURL.fromDisk(`https://store.steampowered.com/search/suggest?term=${ gameURI }&f=games&cc=${ counCode }&realm=1&l=${ langName }&use_store_query=1&use_search_spellcheck=1`)
                                        .then(r => r.text())
                                        .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                        .then(DOM => {
                                            for(let item of $.all('[data-ds-appid]', DOM)) {
                                                let href = item.href || `//store.steampowered.com/app/${ item.uuid }`,
                                                    name = normalize($('[class*="name"i]', item)?.textContent)?.normalize('NFKD'),
                                                    img = $('[class*="img"i] img', item)?.src,
                                                    price = $('[class*="price"i], [class*="subtitle"i]', item)?.textContent || 'More...',
                                                    good = game.errs(name, true) < PARTIAL_MATCH_THRESHOLD;

                                                if(good)
                                                    return { game, name, href, img, price, good };
                                            }

                                            return {};
                                        });

                                $warn(error);
                            });
                    }

                    if(/(?:^(?:The\s+)?Jackbox Party)/i.test(game)) {
                        // Multiple versions are available
                        let [, main, suff, vers = ''] = /^(?:The\s+)?(Jackbox Party)\s+(Pack)s?\s*(\d+)?/i.exec(game);

                        suff = suff.replace(/s$/, '');

                        let jbpp = `The ${ main } ${ suff } ${ vers }`.trim();

                        // Make multiples' links
                        fetchSteamGame(jbpp)
                            .then((info = {}) => {
                                let { game, name, href, img, price, good = false } = info;

                                if(!href?.length)
                                    return;

                                let f = furnish;

                                let purchase =
                                    f(`.tt-store-purchase--container.is-steam[name="${ name }"][@goodMatch=${ good }]`).with(
                                        // Price
                                        f('.tt-store-purchase--price').with(price),

                                        // Link to Steam
                                        f('.tt-store-purchase--handler').with(
                                            f(`a#steam-link[href="${ href }"][target=_blank]`).html(`Steam&reg;`)
                                        )
                                    );

                                // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_steam) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-steam-purchase'))
                                    .then(container => {
                                        // Load the price & maturity warning (if applicable)...
                                        fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
                                            .then(r => r.text())
                                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                            .then(DOM => {
                                                $('.tt-store-purchase--container.is-steam').dataset.matureContent = (null
                                                    // Steam will error-out if you try to load an adult-only game...
                                                    // Or... There will be a mature label
                                                    // Or... There will be an "Age Gate"
                                                    // Or... The content descriptor will be defined

                                                    // Too much text...
                                                    // || $('[id*="age"i][id*="gate"i], [id*="content"i][id*="desc"i]', DOM)?.textContent
                                                    || $.defined('[id*="error"i], [id*="mature"i], [id*="age"i][id*="gate"i], [id*="content"i][id*="desc"i]', DOM)
                                                )
                                            })
                                            .catch(error => {
                                                $warn(`Unable to fetch Steam pricing information for "${ jbpp }"`, error);
                                            });

                                        // @TODO: Make this faster somehow!
                                        // Slow as hell!
                                        fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
                                            .then(r => r.text())
                                            .then(DOMParser.stripBody)
                                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                            .then(DOM => {
                                                let description = (null
                                                    ?? $('[id][class*="description"i]', DOM)?.textContent
                                                    ?? $('meta[name="description"i]', DOM)?.content
                                                );

                                                // Load an actual game description
                                                let gameDesc = $('[data-twitch-provided-description]');

                                                if(defined(gameDesc) && good) {
                                                    $('[data-test-selector="chat-card-title"]').innerHTML += ' &mdash; Steam&reg;';

                                                    gameDesc.innerText = description || gameDesc.innerText;
                                                    gameDesc.removeAttribute('data-twitch-provided-description');
                                                }

                                                let data = DOM.head.getElementByText('core2')?.textContent?.replace(/.*preload.*(\{[^$]+?\});/, '$1');

                                                if(data?.length) {
                                                    data = JSON.parse(data).core2?.products?.productSummaries?.[gameID];

                                                    if(nullish(data?.specificPrices))
                                                        return;

                                                    let mature = data.contentRating?.rating || '',
                                                        price = data.specificPrices?.purchaseable?.shift?.()?.listPrice;

                                                    $('.tt-store-purchase--container.is-steam').dataset.matureContent = mature;
                                                    $('.is-steam .tt-store-purchase--price').textContent = /^\p{Sc}?(\d+(?:[\.,]\d+)?|\w+)$/u.test(price ?? '')? price: info.price;
                                                }
                                            });

                                        container.replaceWith(purchase);
                                    });
                            })
                            .catch(error => {
                                $warn(`Unable to connect to Steam. Tried to look for "${ jbpp }"`, error);
                            });
                    } else {
                        fetchSteamGame(game)
                            .then((info = {}) => {
                                let { game, name, href, img, price, good = false } = info;

                                if(!href?.length)
                                    return;

                                let f = furnish;

                                let purchase =
                                    f(`.tt-store-purchase--container.is-steam[name="${ name }"][@goodMatch=${ good }]`).with(
                                        // Price
                                        f('.tt-store-purchase--price').with(price),

                                        // Link to Steam
                                        f('.tt-store-purchase--handler').with(
                                            f(`a#steam-link[href="${ href }"][target=_blank]`).html(`Steam&reg;`)
                                        )
                                    );

                                // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_steam) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-steam-purchase'))
                                    .then(container => {
                                        // Load the maturity warning (if applicable)...
                                        fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
                                            .then(r => r.text())
                                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                            .then(DOM => {
                                                $('.tt-store-purchase--container.is-steam').dataset.matureContent = (null
                                                    // Steam will error-out if you try to load an adult-only game...
                                                    // Or... There will be a mature label
                                                    // Or... There will be an "Age Gate"
                                                    // Or... The content descriptor will be defined

                                                    // Too much text...
                                                    // || $('[id*="age"i][id*="gate"i], [id*="content"i][id*="desc"i]', DOM)?.textContent
                                                    || $.defined('[id*="error"i], [id*="mature"i], [id*="age"i][id*="gate"i], [id*="content"i][id*="desc"i]', DOM)
                                                )
                                            })
                                            .catch(error => {
                                                $warn(`Unable to fetch Steam pricing information for "${ game }"`, error);
                                            });

                                        container.replaceWith(purchase);
                                    });

                                $log(`Got "${ game }" data from Steam:`, info);
                            })
                            .catch(error => {
                                $warn(`Unable to connect to Steam. Tried to look for "${ game }"`, error);
                            });
                        }
                }

                /*** Get the PlayStation link (if applicable)
                 *      _____  _              _____ _        _   _
                 *     |  __ \| |            / ____| |      | | (_)
                 *     | |__) | | __ _ _   _| (___ | |_ __ _| |_ _  ___  _ __
                 *     |  ___/| |/ _` | | | |\___ \| __/ _` | __| |/ _ \| '_ \
                 *     | |    | | (_| | |_| |____) | || (_| | |_| | (_) | | | |
                 *     |_|    |_|\__,_|\__, |_____/ \__\__,_|\__|_|\___/|_| |_|
                 *                      __/ |
                 *                     |___/
                 */
                PlayStation: if(parseBool(Settings.store_integration__playstation)) {
                    async function fetchPlayStationGame(game, index = 1, pages = 1) {
                        return fetchURL.fromDisk(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/psn/${ (game[0].toLowerCase().replace(/[^a-z]/, '_')) }.json`, { hoursUntilEntryExpires: 168 })
                            .then(r => r.json())
                            .then(data => {
                                let [best, ...othr] = data.sort((prev, next) =>
                                    normalize(prev.name, [PlayStationRegExp, ''])
                                        .errs(game)
                                    - normalize(next.name, [PlayStationRegExp, ''])
                                        .errs(game)
                                )
                                    .slice(0, 60)
                                    .sort((prev, next) =>
                                        normalize(prev.name, [PlayStationRegExp, ''])
                                            .toLowerCase()
                                            .distanceFrom(game.toLowerCase())
                                        - normalize(next.name, [PlayStationRegExp, ''])
                                            .toLowerCase()
                                            .distanceFrom(game.toLowerCase())
                                    )
                                    .sort((prev, next) =>
                                        !isNaN(parseFloat((next.price + '').replace(/^free$/i, '0')))
                                            ? +0
                                            : !isNaN(parseFloat((prev.price + '').replace(/^free$/i, '0')))
                                                ? -1
                                                : +1
                                    );

                                if(false
                                    || best.name.equals(game)
                                    || normalize(best.name, [PlayStationRegExp, ''])
                                        .trim()
                                        .equals(game)
                                    || normalize(best.name, [PlayStationRegExp, ''])
                                        .errs(game) < PARTIAL_MATCH_THRESHOLD
                                ) return ({
                                    game,
                                    good: (
                                        normalize(best.name, [PlayStationRegExp, ''])
                                            .errs(game, true) < PARTIAL_MATCH_THRESHOLD
                                    ),
                                    name: best.name,
                                    href: best.href,
                                    img: best.image,
                                    price: best.price,
                                });

                                throw ITEM_NOT_FOUND;
                            })
                            .catch(error => {
                                // Fallback: Search the store normally
                                if(error == ITEM_NOT_FOUND)
                                    return /*await*/ fetchURL.fromDisk(`https://store.playstation.com/${ lang }/search/${ gameURI }`, { hoursUntilEntryExpires: 168 })
                                        .then(r => r.text())
                                        .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                        .then(async DOM => {
                                            let items = [];

                                            for(let element of $.all('#main li > [data-qa^="search"i]', DOM))
                                                items.push({
                                                    id: $('[href]', element)?.href?.slice(1).split('/').pop(),
                                                    name: $('[data-qa*="product-name"i]', element)?.textContent,
                                                    href: $('[href]', element)?.href?.replace(/^\/([^\/].+)$/, 'https://store.playstation.com/$1'),
                                                    img: $('img[loading]', element)?.src,
                                                    price: $('[data-qa*="display-price"i]', element)?.textContent,
                                                    platforms: $.all('[data-qa*="game"i][data-qa*="tag"i]', element).map(tag => tag.textContent.trim()),
                                                });

                                            items = items.sort((prev, next) =>
                                                normalize(prev.name, [PlayStationRegExp, ''])
                                                    .errs(game)
                                                - normalize(next.name, [PlayStationRegExp, ''])
                                                    .errs(game)
                                            )
                                                .slice(0, 60)
                                                .sort((prev, next) =>
                                                    normalize(prev.name, [PlayStationRegExp, ''])
                                                        .toLowerCase()
                                                        .distanceFrom(game.toLowerCase())
                                                    - normalize(next.name, [PlayStationRegExp, ''])
                                                        .toLowerCase()
                                                        .distanceFrom(game.toLowerCase())
                                                );

                                            for(let item of items)
                                                if(true
                                                    && item.platforms?.length
                                                    && (false
                                                        || item.name?.equals(
                                                            normalize(game, [PlayStationRegExp, ''])
                                                        )
                                                        || normalize(item.name, [PlayStationRegExp, ''])
                                                            ?.errs(game) < PARTIAL_MATCH_THRESHOLD
                                                    )
                                                )
                                                    return ({
                                                        game,
                                                        good: (
                                                            normalize(item.name , [PlayStationRegExp, ''])
                                                                ?.errs(game, true) < PARTIAL_MATCH_THRESHOLD
                                                        ) || 0,
                                                        name: item.name,
                                                        href: `https://store.playstation.com/${ lang }/product/${ item.id }`,
                                                        img: item.img,
                                                        price: (item.price || 'More...'),
                                                    });

                                            return {};
                                        });

                                $warn(error);
                            });
                    }

                    if(/(?:^(?:The\s+)?Jackbox Party)/i.test(game)) {
                        // Multiple versions are available
                        let [, main, suff, vers = ''] = /^(?:The\s+)?(Jackbox Party)\s+(Pack)s?\s*(\d+)?/i.exec(game);

                        suff = suff.replace(/s$/, '');

                        let jbpp = `The ${ main } ${ suff } ${ vers }`.trim();

                        // Make multiples' links
                        fetchPlayStationGame(jbpp)
                            .then((info = {}) => {
                                let { game, name, href, img, price, good = false } = info;

                                if(!href?.length)
                                    return;

                                let f = furnish;

                                let purchase =
                                    f(`.tt-store-purchase--container.is-playstation[name="${ name }"][@goodMatch=${ good }]`).with(
                                        // Price
                                        f('.tt-store-purchase--price').with(price),

                                        // Link to PlayStation
                                        f('.tt-store-purchase--handler').with(
                                            f(`a#playstation-link[href="${ href }"][target=_blank]`).html(`PlayStation&reg;`)
                                        )
                                    );

                                // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_playstation) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-playstation-purchase'))
                                    .then(container => {
                                        // Load the maturity warning (if applicable)...
                                        fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
                                            .then(r => r.text())
                                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                            .then(DOM => {
                                                let data = $('[class*="content"i][class*="rating"i] script[type*="json"i]', DOM)?.textContent,
                                                    description = $('[data-qa*="overview"i][data-qa*="description"i]', DOM)?.innerHTML;

                                                // Load an actual game description
                                                let gameDesc = $('[data-twitch-provided-description]');

                                                if(defined(gameDesc) && good) {
                                                    $('[data-test-selector="chat-card-title"]').innerHTML += ' &mdash; PlayStation&reg;';

                                                    gameDesc.innerHTML = description?.replace(/([\.!\?])\s*([^\.!\?]+(?:\.{3}|…))\s*$/, '$1') || gameDesc.innerHTML;
                                                    gameDesc.removeAttribute('data-twitch-provided-description');
                                                }

                                                if(!data?.length)
                                                    return;

                                                data = JSON.parse(data);

                                                finder: for(let key in data.cache)
                                                    if(/^product/i.test(key)) {
                                                        let { authority, description, name, url } = data.cache[key].contentRating;

                                                        $('.tt-store-purchase--container.is-playstation').dataset.matureContent = description?.replace(authority, '')?.trim() || parseBool(name?.contains(...MATURE_HINTS));
                                                        $('#tt-content-rating-placeholder')?.replaceWith(f.img({ alt: description, src: url, style: RATING_STYLING }));

                                                        break finder;
                                                    }
                                            })
                                            .catch(error => {
                                                $warn(`Unable to fetch PlayStation pricing information for "${ jbpp }"`, error);
                                            });

                                        container.replaceWith(purchase);
                                    });

                                $log(`Got "${ jbpp }" data from PlayStation:`, info);
                            })
                            .catch(error => {
                                $warn(`Unable to connect to PlayStation. Tried to look for "${ jbpp }"`, error);
                            });
                    } else {
                        fetchPlayStationGame(game)
                            .then((info = {}) => {
                                let { game, name, href, img, price, good = false } = info;

                                if(!href?.length)
                                    return;

                                // Correct game image...
                                if($.defined('.game-card-img[ok="false"i]')) {
                                    let i = new Image;
                                    i.crossOrigin = "anonymous";
                                    i.addEventListener('load', event => {
                                        let I = $('.game-card-img[ok="false"i]');

                                        if(nullish(I))
                                            return;

                                        for(let { name, value } of I.attributes)
                                            if(['src', 'ok'].missing(name))
                                                i.setAttribute(name, value);
                                        I.replaceWith(i);
                                    });
                                    i.addEventListener('error', event => {
                                        i.setAttribute('ok', false);
                                    });

                                    i.src = img;
                                }

                                let f = furnish;

                                let purchase =
                                    f(`.tt-store-purchase--container.is-playstation[name="${ name }"][@goodMatch=${ good }]`).with(
                                        // Price
                                        f('.tt-store-purchase--price').with(price),

                                        // Link to PlayStation
                                        f('.tt-store-purchase--handler').with(
                                            f(`a#playstation-link[href="${ href }"][target=_blank]`).html(`PlayStation&reg;`)
                                        )
                                    );

                                // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_playstation) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-playstation-purchase'))
                                    .then(container => {
                                        href = href.replace(/^\/\//, 'https:$&');

                                        // Load the maturity warning (if applicable)...
                                        fetchURL.fromDisk(href, { hoursUntilEntryExpires: 168 })
                                            .then(r => r.text())
                                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                            .then(DOM => {
                                                let data = $('[class*="content"i][class*="rating"i] script[type*="json"i]', DOM)?.textContent,
                                                    description = $('[data-qa*="overview"i][data-qa*="description"i]', DOM)?.innerHTML;

                                                // Load an actual game description
                                                let gameDesc = $('[data-twitch-provided-description]');

                                                if(defined(gameDesc) && good) {
                                                    $('[data-test-selector="chat-card-title"]').innerHTML += ' &mdash; PlayStation&reg;';

                                                    gameDesc.innerHTML = description || gameDesc.innerHTML;
                                                    gameDesc.removeAttribute('data-twitch-provided-description');
                                                }

                                                // Load the game's data
                                                if(!data?.length)
                                                    return;

                                                data = JSON.parse(data);

                                                finder: for(let key in data.cache)
                                                    if(/^product/i.test(key)) {
                                                        let { authority, description, name, url } = data.cache[key].contentRating;

                                                        $('.tt-store-purchase--container.is-playstation').dataset.matureContent = description?.replace(authority, '')?.trim() || parseBool(name?.contains(...MATURE_HINTS));
                                                        $('#tt-content-rating-placeholder')?.replaceWith(f.img({ alt: description, src: url, style: RATING_STYLING }));

                                                        break finder;
                                                    }
                                            })
                                            .catch(error => {
                                                $warn(`Unable to fetch PlayStation pricing information for "${ game }"`, error);
                                            });

                                        container.replaceWith(purchase);
                                    });

                                $log(`Got "${ game }" data from PlayStation:`, info);
                            })
                            .catch(error => {
                                $warn(`Unable to connect to PlayStation. Tried to look for "${ game }"`, error);
                            });
                        }
                }

                /*** Get the Xbox link (if applicable)
                 *     __   ___
                 *     \ \ / / |
                 *      \ V /| |__   _____  __
                 *       > < | '_ \ / _ \ \/ /
                 *      / . \| |_) | (_) >  <
                 *     /_/ \_\_.__/ \___/_/\_\
                 *
                 *
                 */
                Xbox: if(parseBool(Settings.store_integration__xbox)) {
                    async function fetchXboxGame(game) {
                        return fetchURL.fromDisk(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/xbox/${ (game[0].toLowerCase().replace(/[^a-z]/, '_')) }.json`, { hoursUntilEntryExpires: 168 })
                            .then(r => r.json())
                            .then(data => {
                                let [best, ...othr] = data.sort((prev, next) =>
                                    normalize(prev.name, [XboxRegExp, ''])
                                        .errs(game)
                                    - normalize(next.name, [XboxRegExp, ''])
                                        .errs(game)
                                )
                                    .slice(0, 60)
                                    .sort((prev, next) =>
                                        normalize(prev.name, [XboxRegExp, ''])
                                            .toLowerCase()
                                            .distanceFrom(game.toLowerCase())
                                        - normalize(next.name, [XboxRegExp, ''])
                                            .toLowerCase()
                                            .distanceFrom(game.toLowerCase())
                                    )
                                    .sort((prev, next) =>
                                        !isNaN(parseFloat((next.price + '').replace(/^free$/i, '0')))
                                            ? +0
                                            : !isNaN(parseFloat((prev.price + '').replace(/^free$/i, '0')))
                                                ? -1
                                                : +1
                                    );

                                if(false
                                    || best.name.equals(game)
                                    || normalize(best.name, [XboxRegExp, ''])
                                        .trim()
                                        .equals(game)
                                    || normalize(best.name, [XboxRegExp, ''])
                                        .errs(game) < PARTIAL_MATCH_THRESHOLD
                                ) return ({
                                    game,
                                    good: (
                                        normalize(best.name, [XboxRegExp, ''])
                                            .errs(game, true) < PARTIAL_MATCH_THRESHOLD
                                    ),
                                    name: best.name,
                                    href: best.href,
                                    img: best.image,
                                    price: best.price,
                                });

                                throw ITEM_NOT_FOUND;
                            })
                            .catch(error => {
                                // Fallback: Search the store normally
                                if(error == ITEM_NOT_FOUND)
                                    return /*await*/ fetchURL.fromDisk(`https://www.microsoft.com/msstoreapiprod/api/autosuggest?market=${ lang }&sources=DCatAll-Products&filter=%2BClientType%3AStoreWeb&query=${ gameURI }`, { hoursUntilEntryExpires: 168 })
                                        .then(r => r.json())
                                        .then(json => {
                                            let info = json
                                                ?.ResultSets
                                                ?.shift()
                                                ?.Suggests
                                                ?.find(({ Description, ImageUrl, Metas, Source, Title, Url }) => Source?.equals('games') && Title?.errs(game) < PARTIAL_MATCH_THRESHOLD);

                                            if(nullish(info))
                                                return {};

                                            let name = normalize(info.Title).normalize('NFKD'),
                                                href = info.Url,
                                                img = info.ImageUrl,
                                                price = 'More...',
                                                errs = parseBool(info.Title?.errs(game) < PARTIAL_MATCH_THRESHOLD);

                                            return { game, name, href, img, price, errs };
                                        });

                                $warn(error);
                            });
                    }

                    if(/(?:^(?:The\s+)?Jackbox Party)/i.test(game)) {
                        // Multiple versions are available
                        let [, main, suff, vers = ''] = /^(?:The\s+)?(Jackbox Party)\s+(Pack)s?\s*(\d+)?/i.exec(game);

                        suff = suff.replace(/s$/, '');

                        let jbpp = `The ${ main } ${ suff } ${ vers }`.trim();

                        // Make multiples' links
                        fetchXboxGame(jbpp)
                            .then((info = {}) => {
                                let { game, name, href, img, price, good = false } = info;

                                if(!href?.length)
                                    return;

                                let f = furnish;

                                let purchase =
                                    f(`.tt-store-purchase--container.is-xbox[name="${ name }"][@goodMatch=${ good }]`).with(
                                        // Price
                                        f('.tt-store-purchase--price').with(price),

                                        // Link to Xbox
                                        f('.tt-store-purchase--handler').with(
                                            f(`a#xbox-link[href="${ href }"][target=_blank]`).html(`Xbox&reg;`)
                                        )
                                    );

                                // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_xbox) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-xbox-purchase'))
                                    .then(container => {
                                        // Load the price & maturity warning (if applicable)...
                                        fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
                                            .then(r => r.text())
                                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                            .then(DOM => {
                                                let price = (null
                                                    ?? $('[itemprop="price"i]', DOM)?.content
                                                    ?? (null
                                                        ?? $('[class^="price-mod"i][class*="discount"i]', DOM)
                                                        ?? $('[class^="price-mod"i][class*="original"i]', DOM)
                                                        ?? $('[class^="price-mod"i]', DOM)
                                                        ?? $('[class$="price-text"i] *', DOM)
                                                    )?.textContent?.trim()
                                                );
                                                let rating = $('[class*="age"i][class*="rating"i] img', DOM),
                                                    mature = parseBool(rating?.alt?.toUpperCase()?.contains(...MATURE_HINTS));

                                                rating.modStyle(RATING_STYLING);

                                                $('.is-xbox .tt-store-purchase--price').textContent = /^\p{Sc}?(\d+(?:[\.,]\d+)?|\w+)$/u.test(price ?? '')? price: info.price;
                                                $('.tt-store-purchase--container.is-xbox').dataset.matureContent = (rating.alt || mature);

                                                if(rating)
                                                    $('#tt-content-rating-placeholder')?.replaceWith(rating);
                                            })
                                            .catch(error => {
                                                $warn(`Unable to fetch Xbox pricing information for "${ jbpp }"`, error);
                                            });

                                        // @TODO: Make this faster somehow!
                                        // Slow as hell!
                                        fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
                                            .then(r => r.text())
                                            .then(DOMParser.stripBody)
                                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                            .then(DOM => {
                                                let description = (null
                                                    ?? $('[id][class*="description"i]', DOM)?.textContent
                                                    ?? $('meta[name="description"i]', DOM)?.content
                                                );

                                                // Load an actual game description
                                                let gameDesc = $('[data-twitch-provided-description]');

                                                if(defined(gameDesc) && good) {
                                                    $('[data-test-selector="chat-card-title"]').innerHTML += ' &mdash; Xbox&reg;';

                                                    gameDesc.innerText = description || gameDesc.innerText;
                                                    gameDesc.removeAttribute('data-twitch-provided-description');
                                                }

                                                return /* TODO: Get this to work without freezing the machine */;

                                                let data = DOM.head.getElementByText('core2')?.textContent?.replace(/.*preload.*(\{[^$]+?\});/, '$1');

                                                if(data?.length) {
                                                    data = JSON.parse(data).core2?.products?.productSummaries?.[gameID];

                                                    if(nullish(data?.specificPrices))
                                                        return;

                                                    let mature = data.contentRating?.rating || '',
                                                        price = data.specificPrices?.purchaseable?.shift?.()?.listPrice;

                                                    $('.tt-store-purchase--container.is-xbox').dataset.matureContent = mature;
                                                    $('.is-xbox .tt-store-purchase--price').textContent = /^\p{Sc}?(\d+(?:[\.,]\d+)?|\w+)$/u.test(price ?? '')? price: info.price;
                                                }
                                            });

                                        container.replaceWith(purchase);
                                    });
                            })
                            .catch(error => {
                                $warn(`Unable to connect to Xbox. Tried to look for "${ jbpp }"`, error);
                            });
                    } else {
                        fetchXboxGame(game)
                            .then((info = {}) => {
                                let { game, name, href, img, price, good = false } = info;

                                if(!href?.length)
                                    return;

                                // Correct game image...
                                if($.defined('.game-card-img[ok="false"i]')) {
                                    let i = new Image;
                                    i.crossOrigin = "anonymous";
                                    i.addEventListener('load', event => {
                                        let I = $('.game-card-img[ok="false"i]');

                                        if(nullish(I))
                                            return;

                                        for(let { name, value } of I.attributes)
                                            if(['src', 'ok'].missing(name))
                                                i.setAttribute(name, value);
                                        I.replaceWith(i);
                                    });
                                    i.addEventListener('error', event => {
                                        i.setAttribute('ok', false);
                                    });

                                    i.src = img;
                                }

                                let f = furnish;

                                let purchase =
                                    f(`.tt-store-purchase--container.is-xbox[name="${ name }"][@goodMatch=${ good }]`).with(
                                        // Price
                                        f('.tt-store-purchase--price').with(price),

                                        // Link to Xbox
                                        f('.tt-store-purchase--handler').with(
                                            f(`a#xbox-link[href="${ href }"][target=_blank]`).html(`Xbox&reg;`)
                                        )
                                    );

                                // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_xbox) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-xbox-purchase'))
                                    .then(container => {
                                        // Load the price & maturity warning (if applicable)...
                                        fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
                                            .then(r => r.text())
                                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                            .then(DOM => {
                                                let price = (null
                                                    ?? $('[itemprop="price"i]', DOM)?.content
                                                    ?? (null
                                                        ?? $('[class^="price-mod"i][class*="discount"i]', DOM)
                                                        ?? $('[class^="price-mod"i][class*="original"i]', DOM)
                                                        ?? $('[class^="price-mod"i]', DOM)
                                                        ?? $('[class$="price-text"i] *', DOM)
                                                    )?.textContent?.trim()
                                                );
                                                let rating = $('[class*="age"i][class*="rating"i] img', DOM),
                                                    mature = parseBool(rating?.alt?.toUpperCase()?.contains(...MATURE_HINTS));

                                                rating?.modStyle(RATING_STYLING);

                                                $('.is-xbox .tt-store-purchase--price').textContent = /^\p{Sc}?(\d+(?:[\.,]\d+)?|\w+)$/u.test(price ?? '')? price: info.price;
                                                $('.tt-store-purchase--container.is-xbox').dataset.matureContent = (rating?.alt || mature);

                                                if(rating)
                                                    $('#tt-content-rating-placeholder')?.replaceWith(rating);
                                            })
                                            .catch(error => {
                                                $warn(`Unable to fetch Xbox pricing information for "${ game }"`, error);
                                            });

                                        // @TODO: Make this faster somehow!
                                        // Slow as hell!
                                        fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
                                            .then(r => r.text())
                                            .then(DOMParser.stripBody)
                                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                            .then(DOM => {
                                                let description = (null
                                                    ?? $('[id][class*="description"i]', DOM)?.textContent
                                                    ?? $('meta[name="description"i]', DOM)?.content
                                                );

                                                // Load an actual game description
                                                let gameDesc = $('[data-twitch-provided-description]');

                                                if(defined(gameDesc) && good) {
                                                    $('[data-test-selector="chat-card-title"]').innerHTML += ' &mdash; Xbox&reg;';

                                                    gameDesc.innerText = description || gameDesc.innerText;
                                                    gameDesc.removeAttribute('data-twitch-provided-description');
                                                }

                                                return /* TODO: Get this to work without freezing the machine */;

                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */
                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */
                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */
                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */
                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */
                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */
                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */
                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */
                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */

                                                let data = DOM.head.getElementByText('core2')?.textContent?.replace(/.*preload.*(\{[^$]+?\});/, '$1');

                                                if(data?.length) {
                                                    // Xbox | Product Summaries
                                                        // accessibilityCapabilities: object<{ audio:array, gameplay:array, input:array, publisherInformationUri:string?, visual:array }>
                                                        // availableOn:array<["Xbox", "XboxOne", "XboxSeriesS", "XboxSeriesX"...]>
                                                        // averageRating:number<float>
                                                        // bundledProductIds:array<[...string]>
                                                        // bundlesBySeed:array<[...string]>
                                                        // capabilities:object<{ `CapabilityKey`:`CapabilityDescription` }>
                                                        // categories:array<[...string]>
                                                        // contentRating:object<{ boardName:string, description:string, disclaimers:array<[...string]>, descriptors:array<[...string]>, imageUri:string<URL>, imageLinkUri:string<URL>, interactiveDescriptions:array<[...string]>, rating:string, ratingAge:number<integer>, ratingDescription:string }>
                                                        // description:string
                                                        // developerName:string
                                                        // editions:array<[...string]>
                                                        // hasAddOns:boolean
                                                        // images:object<{ `ImageType`:object<{ url:string, width:number<integer:pixels>, height:number<integer:pixels> }> }>
                                                        // includedWithPassesProductIds:array<[...string]>
                                                        // languagesSupported:object<{ `Language`:object<{ areSubtitlesSupported:boolean, isAudioSupported:boolean, isInterfaceSupported:boolean, languageDisplayName:string }> }>
                                                        // legalNotices:array<[...string]> of @@capabilities@key
                                                        // maxInstallSize:number<integer:Bytes>
                                                        // optimalSatisfyingPassId:string
                                                        // optimalSkuId:string
                                                        // preferredSkuId:string
                                                        // productFamily:string
                                                        // productId:string
                                                        // publisherName:string
                                                        // ratingCount:number<integer>
                                                        // releaseDate:string<Date:ISO>
                                                        // shortDescription:string
                                                        // showSupportedLanguageDisclaimer:boolean
                                                        // specificPrices:object<{ `PriceType`:array<[ ...object<{ skuId:string, availabilityId:string, listPrice:number<float>, msrp:number<float>, discountPercentage:number<float>, currencyCode:string, remediations:array<[]>, affirmationId:string?, priceEligibilityInfo:object?, availabilityActions:array<[...string]>, endDate:string<Date:ISO>, hasXPriceOffer:boolean }> ]> }>
                                                        // systemRequirements:array<[ object<{ minimum:string, recommended:string, title:string<RequirementType> }> ]>
                                                        // title:string
                                                        // videos:array<[ object<{ title:string, url:string<URL>, width:number<integer:pixels>, height:number<integer:pixels>, previewImage: object<{ url:string, width:number<integer:pixels>, height:number<integer:pixels>, caption:string }>, purpose:string }> ]>
                                                    data = JSON.parse(data).core2?.products?.productSummaries?.[gameID];

                                                    if(nullish(data?.specificPrices))
                                                        return;

                                                    let mature = data.contentRating?.rating || '',
                                                        price = data.specificPrices?.purchaseable?.shift?.()?.listPrice;

                                                    $('.tt-store-purchase--container.is-xbox').dataset.matureContent = mature;
                                                    $('.is-xbox .tt-store-purchase--price').textContent = /^\p{Sc}?(\d+(?:[\.,]\d+)?|\w+)$/u.test(price ?? '')? price: info.price;
                                                }
                                            });

                                        container.replaceWith(purchase);
                                    });

                                $log(`Got "${ game }" data from Xbox:`, info);
                            })
                            .catch(error => {
                                $warn(`Unable to connect to Xbox. Tried to look for "${ game }"`, error);
                            });
                        }
                }

                /*** Get the Nintendo link (if applicable)
                 *      _   _ _       _                 _
                 *     | \ | (_)     | |               | |
                 *     |  \| |_ _ __ | |_ ___ _ __   __| | ___
                 *     | . ` | | '_ \| __/ _ \ '_ \ / _` |/ _ \
                 *     | |\  | | | | | ||  __/ | | | (_| | (_) |
                 *     |_| \_|_|_| |_|\__\___|_| |_|\__,_|\___/
                 *
                 *
                 */
                Nintendo: if(parseBool(Settings.store_integration__nintendo)) {
                    async function fetchNintendoGame(game) {
                        return fetchURL.fromDisk(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/nintendo/${ (game[0].toLowerCase().replace(/[^a-z]/, '_')) }.json`, { hoursUntilEntryExpires: 168 })
                            .then(r => r.json())
                            .then(data => {
                                let [best, ...othr] = data.sort((prev, next) =>
                                    normalize(prev.name, [NintendoRegExp, ''])
                                        .errs(game)
                                    - normalize(next.name, [NintendoRegExp, ''])
                                        .errs(game)
                                )
                                    .slice(0, 60)
                                    .sort((prev, next) =>
                                        normalize(prev.name, [NintendoRegExp, ''])
                                            .toLowerCase()
                                            .distanceFrom(game.toLowerCase())
                                        - normalize(next.name, [NintendoRegExp, ''])
                                            .toLowerCase()
                                            .distanceFrom(game.toLowerCase())
                                    )
                                    .sort((prev, next) =>
                                        !isNaN(parseFloat((next.price + '').replace(/^free$/i, '0')))
                                            ? +0
                                            : !isNaN(parseFloat((prev.price + '').replace(/^free$/i, '0')))
                                                ? -1
                                                : +1
                                    );

                                if(false
                                    || best.name.equals(game)
                                    || normalize(best.name, [NintendoRegExp, ''])
                                        .trim()
                                        .equals(game)
                                    || normalize(best.name, [NintendoRegExp, ''])
                                        .errs(game) < .07
                                ) return ({
                                    game,
                                    good: (
                                        normalize(best.name, [NintendoRegExp, ''])
                                            .errs(game, true) < PARTIAL_MATCH_THRESHOLD
                                    ),
                                    name: best.name,
                                    href: best.href,
                                    img: best.image,
                                    price: best.price,
                                    rating: best.rating,
                                });

                                throw ITEM_NOT_FOUND;
                            })
                            .catch(error => {
                                // Fallback: Search the store normally
                                if(error == ITEM_NOT_FOUND)
                                    return /*await*/ fetchURL.fromDisk(encodeURI`https://u3b6gr4ua3-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia for JavaScript (4.14.2); Browser; JS Helper (3.11.1); react (17.0.2); react-instantsearch (6.38.0)`, {
                                        hoursUntilEntryExpires: 168,    // 1 week lifetime
                                        keepDefectiveEntry: true,       // Keep bad requests

                                        headers: {
                                            'accept': '*/*',
                                            'accept-language': navigator.languages.join(','),
                                            'content-type': 'application/x-www-form-urlencoded',
                                            'sec-ch-ua': navigator.userAgentData.brands.map(b => [`"${ b.brand }"`, `v="${ b.version }"`].join(';')).join(', '),
                                            'sec-ch-ua-mobile': '?' + +navigator.userAgentData.mobile,
                                            'sec-ch-ua-platform': `"${ navigator.userAgentData.platform }"`,
                                            'sec-fetch-dest': 'empty',
                                            'sec-fetch-mode': 'cors',
                                            'sec-fetch-site': 'cross-site',
                                            'x-algolia-api-key': 'a29c6927638bfd8cee23993e51e721c9',
                                            'x-algolia-application-id': 'U3B6GR4UA3'
                                        },
                                        referrer: 'https://www.nintendo.com/',
                                        referrerPolicy: 'strict-origin-when-cross-origin',
                                        body: JSON.stringify({
                                                requests: [{
                                                indexName: 'store_all_products_en_us',
                                                query: game,
                                                params: encodeURI`filters=&hitsPerPage=120&analytics=false&facetingAfterDistinct=true&clickAnalytics=false&highlightPreTag=^*^^&highlightPostTag=^*&attributesToHighlight=["description"]`,
                                            }]
                                        }),
                                        method: 'POST',
                                        mode: 'cors',
                                        credentials: 'omit'
                                    })
                                        .then(r => r.json())
                                        // Nintendo | Agolia Results (Object)
                                          // results:array<object<{
                                          //    exhaustive:object<{ nbHits:boolean, type:boolean }>
                                          //    exhaustiveNbHits:boolean
                                          //    exhaustiveTypo:boolean
                                          //    hits:array<object<{
                                          //        availability:array<string>
                                          //        categoryIds:array<string>
                                          //        collectionPriceRange:string
                                          //        contentRatingCode:string
                                          //        corePlatforms:array<string>
                                          //        createdAt:string<ISO-Date>
                                          //        demoNsuid:string?
                                          //        description:string
                                          //        dlcType:string?
                                          //        editions:array<string>
                                          //        eshopDetails:object<{ discountedPriceEnd:string?<ISO-Date>, goldPoints:number<int>, baseGoldPoints:number<int> }>
                                          //        esrbDescriptors:array<string>
                                          //        esrbRating:string
                                          //        exclusive:boolean
                                          //        featuredProduct:boolean
                                          //        franchises:array<?>
                                          //        genres:array<string>
                                          //        hasDlc:boolean
                                          //        nsoFeatures:array<?>?
                                          //        nsuid:string
                                          //        objectId:string
                                          //        platform:string
                                          //        platformCode:string
                                          //        platinumPoints:number?<int>
                                          //        playModes:array<string>
                                          //        playerCount:string
                                          //        price:object<{ finalPrice:number<float>, regPrice:number?<float>, salePrice:number<float> }>
                                          //        priceRange:string
                                          //        productImage:string<URL-pathname>
                                          //        relaseDateDisplay:string?<ISO-Date>
                                          //        sku:string
                                          //        softwareDeveloper:string
                                          //        softwarePublisher:string
                                          //        stockStatus:string
                                          //        storeId:string
                                          //        title:string
                                          //        topLevelCategory:string
                                          //        topLevelCategoryCode:string
                                          //        topLevelFilters:array<string>
                                          //        updatedAt:string<ISO-Date>
                                          //        url:string<URL-pathname>
                                          //        urlKey:string
                                          //        visibleInSearch:boolean
                                          //        _distinctSeqId:number<?>
                                          //        _highlightResult:object<{ description:object<{ fullyHighlighted:boolean, matchLevel:string, matchedWords:array<string>, value:string }> }>
                                          //    }>>
                                          //    hitsPerPage:number<int>
                                          //    index:string
                                          //    nbHits:number<int>
                                          //    nbPages:number<int>
                                          //    page:number<int>
                                          //    aprams:string<URL-search>
                                          //    processingTimeMS:number<int>
                                          //    processingTimingMS:object<{ total:number<int> }>
                                          //    query:string
                                          //    renderingContent:object<?>
                                          // }>>
                                        .then(j =>
                                            j.results.shift().hits
                                                .filter(item => item.topLevelCategoryCode.equals('GAMES') && item.topLevelFilters.missing('DLC', 'DLC bundle'))
                                                .map(item => ({
                                                    name: item.title,
                                                    price: (item.price?.regPrice || 'Free').toString().replace(/^\d/, '$$$&'),
                                                    image: item.productImage,
                                                    href: `https://www.nintendo.com${ item.url }`,
                                                    uuid: item.nsuid,
                                                    platforms: [item.platform],
                                                    rating: ({ 'E': 'everyone', 'E10': 'everyone 10+', 'RP': 'rating pending', 'T': 'teen', 'M': 'mature 17+' }[item.esrbRating]) || item.esrbRating || 'none',
                                                }))
                                        );

                                $warn(error);
                            });
                    }

                    if(/(?:^Pok[ée]mon)/i.test(game)) {
                        // Multiple versions are available
                        let [, main, vers] = /(^Pok[ée]mon)\s+(.+)$/i.exec(game);

                        vers = vers.split('/').map(v => v.trim());

                        // Make multiple links...
                        for(let ver of vers)
                            fetchNintendoGame(main + ver)
                                .then((info = {}) => {
                                    let { game, name, href, img, price, rating = 'none', good = false } = info;

                                    // img = `https://assets.nintendo.com/image/upload/ar_16:9,b_auto:border,c_lpad/b_white/f_auto/q_auto/dpr_1.0/c_scale,w_700/${ img }`;

                                    if(!href?.length)
                                        return;

                                    fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
                                        .then(r => r.text())
                                        .then(DOMParser.stripBody)
                                        .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                        .then(DOM => {
                                            let description = (null
                                                ?? JSON.parse($('script[id*="data"i][type$="json"i]', DOM)?.textContent ?? "{}").props?.pageProps?.meta?.description
                                                ?? $('meta[name="description"i]', DOM)?.content
                                            );

                                            // Load an actual game description
                                            let gameDesc = $('[data-twitch-provided-description]');

                                            if(defined(gameDesc) && good) {
                                                $('[data-test-selector="chat-card-title"]').innerHTML += ' &mdash; Nintendo&reg;';

                                                gameDesc.innerText = [description, gameDesc.innerText].sort((a, b) => b?.length - a?.length).shift().replace(/([\.!\?])\s*(?:\.{3}|…)\s*$/, '$1');
                                                gameDesc.removeAttribute('data-twitch-provided-description');
                                            }
                                        });

                                    let f = furnish;

                                    let purchase =
                                        f(`.tt-store-purchase--container.is-nintendo[name="${ name }"][@versionName="${ main } ${ ver }"][@goodMatch=${ good }]`).with(
                                            // Price
                                            f('.tt-store-purchase--price').with(price),

                                            // Link to Nintendo
                                            f('.tt-store-purchase--handler').with(
                                                f(`a#nintendo-link[href="${ href }"][target=_blank]`).html(`Nintendo&reg;`)
                                            )
                                        );

                                    // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_nintendo) }") no-repeat center 100% / contain, #000;`);

                                    when.defined(() => $('#tt-nintendo-purchase'))
                                        .then(container => {
                                            container.replaceWith(purchase);

                                            new Tooltip(purchase, `ESRB (USA): ${ rating.toUpperCase() }`, { from: 'top' });

                                            if($.all('.is-nintendo').length < vers.length)
                                                $('#tt-purchase-container').append(
                                                    f('#tt-nintendo-purchase')
                                                );
                                        });

                                    $log(`Got "${ game }" data from Nintendo:`, info);
                                })
                                .catch(error => {
                                    $warn(`Unable to connect to Nintendo. Tried to look for "${ game }"`, error);
                                });
                    } else if(/(?:^(?:The\s+)?Jackbox Party)/i.test(game)) {
                        // Multiple versions are available
                        let [, main, suff, vers = ''] = /^(?:The\s+)?(Jackbox Party)\s+(Pack)s?\s*(\d+)?/i.exec(game);

                        suff = suff.replace(/s$/, '');

                        let jbpp = `The ${ main } ${ suff } ${ vers }`.trim();

                        // Make multiples' links
                        fetchNintendoGame(jbpp)
                            .then((info = {}) => {
                                let { game, name, href, img, price, rating = 'none', good = false } = info;

                                // img = `https://assets.nintendo.com/image/upload/ar_16:9,b_auto:border,c_lpad/b_white/f_auto/q_auto/dpr_1.0/c_scale,w_700/${ img }`;

                                if(!href?.length)
                                    return;

                                let f = furnish;

                                let purchase =
                                    f(`.tt-store-purchase--container.is-nintendo[@matureContent="${ rating.toUpperCase() }"][name="${ name }"][@goodMatch=${ good }]`).with(
                                        // Price
                                        f('.tt-store-purchase--price').with(price),

                                        // Link to Nintendo
                                        f('.tt-store-purchase--handler').with(
                                            f(`a#nintendo-link[href="${ href }"][target=_blank]`).html(`Nintendo&reg;`)
                                        )
                                    );

                                // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_nintendo) }") no-repeat center 100% / contain, #000;`);

                                $log(`Got "${ jbpp }" data from Nintendo:`, info);
                            })
                            .catch(error => {
                                $warn(`Unable to connect to Nintendo. Tried to look for "${ jbpp }"`, error);
                            });
                    } else {
                        // Just one version is available
                        fetchNintendoGame(game)
                            .then((info = {}) => {
                                let { game, name, href, img, price, rating = 'none', good = false } = info;

                                // img = `https://assets.nintendo.com/image/upload/ar_16:9,b_auto:border,c_lpad/b_white/f_auto/q_auto/dpr_1.0/c_scale,w_700/${ img }`;

                                if(!href?.length)
                                    return;

                                // Correct game image...
                                if($.defined('.game-card-img[ok="false"i]')) {
                                    let i = new Image;
                                    i.crossOrigin = "anonymous";
                                    i.addEventListener('load', event => {
                                        let I = $('.game-card-img[ok="false"i]');

                                        if(nullish(I))
                                            return;

                                        for(let { name, value } of I.attributes)
                                            if(['src', 'ok'].missing(name))
                                                i.setAttribute(name, value);
                                        I.replaceWith(i);
                                    });
                                    i.addEventListener('error', event => {
                                        i.setAttribute('ok', false);
                                    });

                                    i.src = img;
                                }

                                fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
                                    .then(r => r.text())
                                    .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                    .then(DOM => {
                                        let description = (null
                                            ?? JSON.parse($('script[id*="data"i][type$="json"i]', DOM)?.textContent ?? "{}").props?.pageProps?.meta?.description
                                            ?? $('meta[name="description"i]', DOM)?.content
                                        );

                                        // Load an actual game description
                                        let gameDesc = $('[data-twitch-provided-description]');

                                        if(defined(gameDesc) && good) {
                                            $('[data-test-selector="chat-card-title"]').innerHTML += ' &mdash; Nintendo&reg;';

                                            console.log('Nintendo:', description, description?.length);
                                            console.log('Twitch:', gameDesc.innerText, gameDesc.innerText?.length);
                                            console.log([description, gameDesc.innerText].sort((a, b) => b?.length - a?.length));

                                            gameDesc.innerHTML = [description, gameDesc.innerText].sort((a, b) => b?.length - a?.length).shift().replace(/([\.!\?])\s*(?:\.{3}|…)\s*$/, '$1');
                                            gameDesc.removeAttribute('data-twitch-provided-description');
                                        }
                                    });

                                let f = furnish;

                                let purchase =
                                    f(`.tt-store-purchase--container.is-nintendo[@matureContent="${ rating.toUpperCase() }"][name="${ name }"][@goodMatch=${ good }]`).with(
                                        // Price
                                        f('.tt-store-purchase--price').with(price),

                                        // Link to Nintendo
                                        f('.tt-store-purchase--handler').with(
                                            f(`a#nintendo-link[href="${ href }"][target=_blank]`).html(`Nintendo&reg;`)
                                        )
                                    );

                                // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_nintendo) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-nintendo-purchase'))
                                    .then(container => {
                                        container.replaceWith(purchase);
                                    });

                                $log(`Got "${ game }" data from Nintendo:`, info);
                            })
                            .catch(error => {
                                $warn(`Unable to connect to Nintendo. Tried to look for "${ game }"`, error);
                            });
                    }
                }

                /*** Get the Epic link (if applicable)
                 *      ______       _
                 *     |  ____|     (_)
                 *     | |__   _ __  _  ___
                 *     |  __| | '_ \| |/ __|
                 *     | |____| |_) | | (__
                 *     |______| .__/|_|\___|
                 *            | |
                 *            |_|
                 */
                Epic: if(parseBool(Settings.store_integration__epic)) {
                    async function fetchEpicGame(game) {
                        return fetchURL.fromDisk(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/epic/${ (game[0].toLowerCase().replace(/[^a-z]/, '_')) }.json`, { hoursUntilEntryExpires: 168 })
                            .then(r => r.json())
                            .then(data => {
                                let [best, ...othr] = data.sort((prev, next) =>
                                    normalize(prev.name, [EpicRegExp, ''])
                                        .errs(game)
                                    - normalize(next.name, [EpicRegExp, ''])
                                        .errs(game)
                                )
                                    .slice(0, 60)
                                    .sort((prev, next) =>
                                        normalize(prev.name, [EpicRegExp, ''])
                                            .toLowerCase()
                                            .distanceFrom(game.toLowerCase())
                                        - normalize(next.name, [EpicRegExp, ''])
                                            .toLowerCase()
                                            .distanceFrom(game.toLowerCase())
                                    )
                                    .sort((prev, next) =>
                                        !isNaN(parseFloat((next.price + '').replace(/^free$/i, '0')))
                                            ? +0
                                            : !isNaN(parseFloat((prev.price + '').replace(/^free$/i, '0')))
                                                ? -1
                                                : +1
                                    );

                                if(false
                                    || best.name.equals(game)
                                    || normalize(best.name, [EpicRegExp, ''])
                                        .trim()
                                        .equals(game)
                                    || normalize(best.name, [EpicRegExp, ''])
                                        .errs(game) < PARTIAL_MATCH_THRESHOLD
                                ) return ({
                                    game,
                                    good: (
                                        normalize(best.name, [EpicRegExp, ''])
                                            .errs(game, true) < PARTIAL_MATCH_THRESHOLD
                                    ),
                                    name: best.name,
                                    href: best.href,
                                    img: best.image,
                                    price: best.price,
                                });

                                throw ITEM_NOT_FOUND;
                            })
                            .catch(error => {
                                // Fallback: Search the store normally
                                const variables = JSON.stringify({
                                    allowCountries: counCode,
                                    country: counCode,
                                    locale: lang,
                                    category: ["games/edition/base", "games/edition", "games/demo"].join('|'),
                                    count: 10,
                                    sortBy: null,
                                    sortDir: "DESC",
                                    keywords: game.replace(/\s+/g, '+'),
                                });

                                if(error == ITEM_NOT_FOUND)
                                    return /*await*/ fetchURL.fromDisk(`https://store.epicgames.com/graphql?operationName=primarySearchAutocomplete&variables=${ encodeURIComponent(variables) }`)
                                        .then(r => r.json())
                                        .then(async({ data = {} }) => {
                                            for(let element of data.Catalog?.searchStore?.elements ?? []) {
                                                const { offerId, sandboxId, title } = element;

                                                if(nullish(offerId))
                                                    continue;

                                                const offer = JSON.stringify({
                                                    country: counCode,
                                                    locale: lang,
                                                    offerId, sandboxId,
                                                });

                                                const item = (await fetch(`https://store.epicgames.com/graphql?operationName=getCatalogOffer&variables=${ encodeURIComponent(offer) }`).then(r => r.json()))
                                                    .data?.Catalog?.catalogOffer;

                                                if(nullish(item))
                                                    continue;

                                                let href = `//store.epicgames.com/en-US/p/${ item.urlSlug }`,
                                                    name = item.title.normalize('NFKD'),
                                                    img = item.keyImages.at(0),
                                                    price = item.price.totalPrice.fmtPrice?.originalPrice ?? (item.price.totalPrice.originalPrice / (10 ** (item.price.totalPrice.currencyInfo?.decimals || -1))),
                                                    good = game.errs(name, true) < PARTIAL_MATCH_THRESHOLD;

                                                if(good)
                                                    return { game, name, href, img, price, good };
                                            }

                                            return {
                                                game,
                                                name,
                                                href: `https://store.epicgames.com/en-US/browse?q=${ encodeURIComponent(game) }`,
                                                price: 'Unavailable',
                                                good: game.errs(name, true) < PARTIAL_MATCH_THRESHOLD,
                                            };
                                        });

                                $warn(error);
                            });
                    }

                    fetchEpicGame(game)
                        .then((info = {}) => {
                            let { game, name, href, img, price, good = false } = info;

                            if(!href?.length)
                                return;

                            href = parseURL(href).addSearch({ category: 'Game', count: 10, start: 0 }).href;

                            let f = furnish;

                            let purchase =
                                f(`.tt-store-purchase--container.is-epic[name="${ name }"][@goodMatch=${ good }]`).with(
                                    // Price
                                    f('.tt-store-purchase--price').with(price),

                                    // Link to Epic
                                    f('.tt-store-purchase--handler').with(
                                        f(`a#epic-link[href="${ href }"][target=_blank]`).html(`Epic Games&reg;`)
                                    )
                                );

                            // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_epic) }") no-repeat center 100% / contain, #000;`);

                            when.defined(() => $('#tt-epic-purchase'))
                                .then(container => {
                                    // Load the maturity warning (if applicable)...
                                    fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
                                        .then(r => r.text())
                                        .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                        .then(DOM => {
                                            $('.tt-store-purchase--container.is-epic').dataset.matureContent = (null
                                                ?? JSON.parse(
                                                    $.all('script', DOM).find(script => script.textContent.includes('__REACT_QUERY_INITIAL_QUERIES__'))
                                                        ?.textContent
                                                        ?.replace(/\b__REACT_QUERY_INITIAL_QUERIES__\s*=\s*(.+);\r?\n/, '$1')
                                                    ?? '{}'
                                                )
                                                    ?.queries
                                                    ?.find(({ queryKey }) => Array.isArray(queryKey) && queryKey.find(query => query.includes('age-rating')))
                                                    ?.state
                                                    ?.data
                                                    ?.ageGate
                                                    ?.gate
                                                    ?.toLowerCase()
                                                    // age-gate → Maturity warning
                                                    // no-gate → No warning
                                                    ?.startsWith('age')
                                                ?? ''
                                            )
                                        })
                                        .catch(error => {
                                            $warn(`Unable to fetch Epic pricing information for "${ game }"`, error);
                                        });

                                    container.replaceWith(purchase);
                                });

                            $log(`Got "${ game }" data from Epic:`, info);
                        })
                        .catch(error => {
                            $warn(`Unable to connect to Epic. Tried to look for "${ game }"`, error);
                        });
                }
            }
    },

    unhandler: () => {
        $('#game-overview-card')?.remove();
    },

    enabled() {
        return nullish(Settings.game_overview_card) || parseBool(Settings.game_overview_card);
    },

    setup() {
        $remark('Adding game overview card...');
    },
});
