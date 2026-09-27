/*** /plugins/chat/link-maker-chat.js
 * Link maker.
 * Moved verbatim from chat.js (Chat__Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.link_maker__chat',

    async install(context) {
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
    },
});
