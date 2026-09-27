/*** /plugins/chat/link-maker-chat.js
 * Link maker.
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let LINK_MAKER_ENABLED, CHAT_CARDIFIED, CHAT_CARDIFYING_TIMERS, REWARDS_CARDIFIER, REWARDS_CARDIFIED, LINK_PARSER;

plugin({
    id: 'chat.link_maker__chat',
    job: 'link_maker__chat',
    timer: -500,

    /**
     * Initializes state and caches for the chat link maker.
     */
    init() {
        LINK_MAKER_ENABLED = void null;
        CHAT_CARDIFIED = new Map;
        CHAT_CARDIFYING_TIMERS = new Map;
        REWARDS_CARDIFIER = void null;
        REWARDS_CARDIFIED = new Map;
        LINK_PARSER = new DOMParser;
    },

    /**
     * Converts Blerp links in chat and reward cards into rich cards or audio players.
     * @param {Object} context - Plugin context
     */
    handler: (context) => {
        // Channel Point rewards (Blerp)
        REWARDS_CARDIFIER = setInterval(() => {
            const f = furnish;
            const card = $('[class*="reward"i][class*="center"i][class*="body"i]');
            const timerStart = +new Date;

            if(nullish(card))
                return;

            const content = card.getElementByText(/\bblerp.com\//i)
                , alias = card.closest('[class*="reward"i][class*="center"i][class*="content"i]')?.querySelector('[id*="reward"i][id*="center"i][id*="header"i]')?.textContent;

            if(nullish(content))
                return;

            const { href = '', origin, protocol, scheme, host, hostname, port, pathname, search, hash } = parseURL(content.innerText);

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

                    const f = furnish;
                    /**
                     * Retrieves a specific property from a DOM object.
                     * @param {string} property - The property name to retrieve
                     * @returns {*} The value of the property
                     */
                    const get = property => DOM.get(property);

                    let [title, description, image, url, audio] = ['title', 'description', 'image', 'url', 'audio'].map(get)
                        , error = DOM.querySelector('parsererror')?.textContent;

                    $log(`Loaded page: Blerp @ ${ href }`, { title, description, image, DOM, size: (DOM.documentElement.innerHTML.length * 8).suffix('B', 2, 'data'), time: ((+new Date - timerStart) / 1000).suffix('s', false) });

                    if(!title?.length || !image?.length) {
                        if(!error?.length)
                            return;
                        else
                            throw error;
                    }

                    const aliasContainer = $(`[data-blerp="${ parseURL(url).pathname }"i]`)
                        , audioContainer = f(`audio[controls]`, { style: 'margin:1rem 0; min-width:50%;' }, f.source({ src: audio }));

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

            const parsed = parseURL.pattern.exec(message);

            if(!parsed?.length)
                return;

            let { groups } = parsed
                , { href = '', origin, protocol, scheme, host, hostname, port, pathname, search, hash } = groups;

            if(href.trim().length < 2)
                return;

            const unknown = Symbol('UNKNOWN');
            const url = parseURL(href.replace(/^(https?:\/\/)?/i, `${ location.protocol }//`).trim())
                , [topDom = '', secDom = '', ...subDom] = url.domainPath ?? ['tv', 'twitch', 'clips'];

            // Ignore pre-cardified links
            if(subDom.contains('clips') || pathname?.contains('/videos/', '/clip/'))
                return;

            // Mobilize laggy URLs
            if('instagram twitter'.split(' ').contains(secDom.toLowerCase()))
                return; // subDom = ['mobile'];

            href = url.href.replace(url.hostname, [...subDom, secDom, topDom].filter(dom => dom.length).join('.'));
            element = await element;

            if(CHAT_CARDIFIED.has(href)) {
                const card = CHAT_CARDIFIED.get(href);

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

                    const f = furnish;
                    /**
                     * Retrieves a specific property from a DOM object.
                     * @param {string} property - The property name to retrieve
                     * @returns {*} The value of the property
                     */
                    const get = property => DOM.get(property);

                    const [title = '', description = '', image] = ['title', 'description', 'image'].map(get)
                        , error = DOM.querySelector('parsererror')?.textContent;

                    $log(`Loaded page: Card @ ${ href }`, { title, description, image, DOM, size: (DOM.documentElement.innerHTML.length * 8).suffix('B', 2, 'data'), time: ((+new Date - CHAT_CARDIFYING_TIMERS.get(href)) / 1000).suffix('s', false) });

                    if(!title?.length || !image?.length) {
                        CHAT_CARDIFIED.set(href, f.span());

                        if(!error?.length)
                            return;
                        else
                            throw error;
                    }

                    const card = f('.tt-iframe-card.tt-border-radius-medium.tt-elevation-1').with(
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

                                                    onerror({ currentTarget }) { currentTarget.src = context.STREAMER.icon }
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

                    const container = f(`#card-${ UUID.from(href).toStamp() }.chat-line__message[@aTarget=chat-line-message][@testSelector=chat-line-message]`).with(
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
    },

    /**
     * Undoes the link maker feature by cleaning up intervals and removing generated cards.
     */
    unhandler: () => {
        LINK_MAKER_ENABLED = false;

        clearInterval(REWARDS_CARDIFIER);

        $.all('.tt-iframe-card')
            .map(card => card.remove());
    },

    /**
     * Checks if the chat link maker is enabled in settings.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
        return LINK_MAKER_ENABLED = parseBool(Settings.link_maker__chat);
    },

    /**
     * Sets up the chat link maker and logs the action.
     */
    setup() {
        $remark("Adding link maker (chat)...");
    },
});
