/*** /plugins/automation/parse-commands.js
 * Parse Commands.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let parseCommands, decodeMD;

plugin({
    id: 'parse_commands',
    timer: -1000,

    init() {
        parseCommands = function parseCommands(string = '', variables = {}) {
            for(let MAX_ITER = 3 * string.count('$'), regexp = /\$?(\([^\(\)]+?\)|\{[^\{\}]+?\}|\[[^\[\]]+?\])/; regexp.test(string) && --MAX_ITER > 0;)
                string = string.replace(regexp, ($0, $1, $$, $_) => {
                    const path = $1.replace(/^[\(\[\{]|[\}\]\)]$/g, '').split(/[\s\.]+/).filter(string => !!string.length);

                    const gameText = STREAMER.game + '';
                    let properties = ({
                            // StreamElements
                            user: {
                                _: USERNAME,
                                name: USERNAME.toLocaleLowerCase(top.LANGUAGE),
                                level: 100,

                                points: STREAMER.coin,
                                points_rank: [STREAMER.rank, STREAMER.cult].join('/'),
                                points_alltime_rank: [STREAMER.rank, STREAMER.cult].join('/'),
                                time_online_rank: [STREAMER.rank, STREAMER.cult].join('/'),
                                time_offline_rank: [STREAMER.rank, STREAMER.cult].join('/'),

                                lastmessage: Chat.get().filter(({ author }) => USERNAME.equals(author)).pop(),
                                lastseen: toTimeString(0, '!minute_m !second_s'),
                                lastactive: toTimeString(0, '!minute_m !second_s'),

                                time_online: toTimeString((parseCoin($('#tt-points-receipt')?.textContent) / 320) * 4000),
                                time_offline: toTimeString(+(new Date) - +new Date(STREAMER.data?.lastSeen || $('#root').dataset.aPageLoaded)),
                            },
                            user1: USERNAME,
                            '2': USERNAME,
                            user2: STREAMER.name,
                            '1': STREAMER.name,

                            channel: {
                                _: STREAMER.name,
                                [STREAMER.name]: STREAMER.name,
                                [USERNAME]: USERNAME,
                                viewers: STREAMER.poll,
                                views: (STREAMER.cult * (1 + (STREAMER.poll / STREAMER.cult))).floor(),
                                followers: STREAMER.cult,
                                subs: STREAMER.poll,
                                display_name: STREAMER.name,
                                alias: STREAMER.name,
                            },

                            title: $('[data-a-target="stream-title"i]').textContent,
                            status: $('[data-a-target="stream-title"i]').textContent,

                            game: {
                                _: gameText,
                                [STREAMER.name]: gameText,
                                [USERNAME]: gameText,
                            },

                            pointsname: STREAMER.fiat,

                            uptime: toTimeString(STREAMER.time),

                            // NightBot
                            channelid: STREAMER.sole,
                            userlevel: 'everyone',
                            sender: USERNAME,
                            touser: USERNAME,

                            // Either...
                            customapi: `ℂ𝕦𝕤𝕥𝕠𝕞 𝔸ℙ𝕀`,

                            // Fetched...
                            ...variables
                        })
                        , value = properties;

                    dir:
                    for(const root of path)
                        if(nullish(value = value[root]))
                            return $0;
                    value = value?._ ?? value;

                    return value || $_;
                })
                    ?.replace(/^\/(?:\w\S+)\s*/, '');

            return string;
        };

        decodeMD = function decodeMD(string = '') {
            return string
                .replace(/(`{3})((?:[\w\-]+\s)?)([^$]+)\1/g, '<code type="$2">$3</code>')
                .replace(/([`]{1})([^\1]+)\1/g, '<code>$2</code>')
                .replace(/([\*_]{3})([^\1]+)\1/g, '<strong><em>$2</em></strong>')
                .replace(/([\*_]{2})([^\1]+)\1/g, '<strong>$2</strong>')
                .replace(/([\*_]{1})([^\1]+)\1/g, '<em>$2</em>')
                .replace(/!\[([^\[\]]+?)\]\(([^\(\)]+?)\)/g, '<img alt="$1" src="$2"/>')
                .replace(/\[([^\[\]]+?)\]\(([^\(\)]+?)\)/g, '<a href="$2" target="_blank">$1</a>')
                .replace(/([~]{1})([^$]+)\1/g, '<span style="text-decoration:1px line-through!important">$2</span>')
                .replace(/([#]{1,3})([^$]+)\1/g, ($0, $1, $2, $$, $_) => {
                    /** Available scripting types:
                     * (1) OPF → 𝕋𝕙𝕖 𝕢𝕦𝕚𝕔𝕜 𝕓𝕣𝕠𝕨𝕟 𝕗𝕠𝕩 𝕛𝕦𝕞𝕡𝕖𝕕 𝕠𝕧𝕖𝕣 𝕥𝕙𝕖 𝕝𝕒𝕫𝕪 𝕕𝕠𝕨𝕟
                     * (2) SCR → 𝒯𝒽ℯ 𝓆𝓊𝒾𝒸𝓀 𝒷𝓇ℴ𝓌𝓃 𝒻ℴ𝓍 𝒿𝓊𝓂𝓅ℯ𝒹 ℴ𝓋ℯ𝓇 𝓉𝒽ℯ 𝓁𝒶𝓏𝓎 𝒹ℴ𝓌𝓃
                     * (3) FR  → 𝔗𝔥𝔢 𝔮𝔲𝔦𝔠𝔨 𝔟𝔯𝔬𝔴𝔫 𝔣𝔬𝔵 𝔧𝔲𝔪𝔭𝔢𝔡 𝔬𝔳𝔢𝔯 𝔱𝔥𝔢 𝔩𝔞𝔷𝔶 𝔡𝔬𝔴𝔫
                     */
                    const type = ['opf', 'scr', 'fr'][$1.length - 1];

                    let string = '';

                    for(const char of $2)
                        string += (
                            /[a-z]/i.test(char)
                                ? `&${ char }${ type };`
                                : char
                        );

                    return string;
                })
                .replace(/([#]{1,5})([^$]+)/g, ($0, $1, $2, $$, $_) => `<h${ $1.length }>${ $2.trim() }</h${ $1.length }>`);
        };
    },

    handler: async() => {
        const elements = $.all('[data-a-target="stream-title"i], [data-a-target="about-panel"i] *, [data-a-target^="panel"i] *')
            .map($0 => $0.getElementByText(/([!][\p{Alpha}\.\\\/\?\+\(\)\[\]\{\}\*\|]+)/u))
            .isolate()
            .filter(defined)
            .filter(e => nullish(e.closest('a[href]')));

        for(const element of elements) {
            for(let { aliases, command, reply, availability, enabled, origin, variables } of await STREAMER.coms)
                // Wait here to keep from lagging the page...
                await wait(1).then(() => {
                    const regexp = RegExp(`([!](?:${ [command, ...aliases].filter(s => typeof s == 'string' && s.length).map(s => s.replace(/[\.\\\/\?\+\(\)\[\]\{\}\$\*\|]/g, '\\$&')).join('|') })(?!\\p{L}))`, 'igu');

                    if(!regexp.test(element.innerHTML))
                        return;

                    element.innerHTML = element.innerHTML.replace(regexp, ($0, $1, $$, $_) => {
                        if($0.trim().length <= 1)
                            return $0;

                        reply = parseCommands(reply, variables);

                        let url = parseURL(reply)
                            , string;

                        // Find the "best" URL
                        let _href, _protocol, _host, _origin, _port, _pathname, _search, _hash;
                        const errors = [];

                        if(defined(url))
                            for(let s = reply, i = 0, maxURLs = 5; i < s.length && --maxURLs;) {
                                const found = parseURL.pattern.exec(s.slice(i));

                                if(nullish(found))
                                    continue;

                                const { index, groups } = found;
                                const { href, protocol, host, origin, port, pathname, search, hash } = groups;

                                if(false
                                    // Empty URL...
                                    || (false
                                        || (href && !_href)
                                        || (pathname && !_pathname)
                                        || (search && !_search)
                                        || (hash && !_hash)
                                    )

                                    // Longest URL...
                                    // || (href.length < _href.length)

                                    // Most complete URL...
                                    || (false
                                        || (protocol && !_protocol)
                                        || (host && !_host)
                                        || (origin && !_origin)
                                        || (port && !_port)
                                    )
                                ) {
                                    // Set the new "best" URL
                                    _href = href;
                                    _origin = origin;
                                    _protocol = protocol;
                                    _host = host;
                                    _port = port;
                                    _pathname = pathname;
                                    _search = search;
                                    _hash = hash;
                                }

                                if(index + href.length >= s.slice(i).length)
                                    break;

                                i = index + href.length;
                            }

                        const titleTo = new UUID + '';

                        if(parseBool(Settings.parse_commands__create_links) && defined(_href))
                            string = `<code tt-code style="border:1px solid currentColor; color:var(--color-colored)!important; white-space:nowrap;" contrast="${ THEME__PREFERRED_CONTRAST }" title-to="${ titleTo };${ encodeHTML(reply) }"><a style="color:inherit!important" href="${ _href.replace(/^(\w{3,}\.\w{2,})/, `https://$1`) }" target=_blank>${ decodeMD(encodeHTML($1)) } ${ Glyphs.modify('ne_arrow', { height:12, width:12, style:'vertical-align:middle!important' }) }</a></code>`;
                        else
                            string = `<code tt-code style="opacity:${ 2 ** -!enabled }; white-space:nowrap" title-to="${ titleTo };${ encodeHTML(reply) }">${ decodeMD(encodeHTML($1)) }</code>`;

                        return `<span title-to="${ titleTo }" tt-parse-commands="${ btoa(escape(string)) }">${ $0.split('').join('&zwj;') }</span>`;
                    });
                });

            // Controls whether the stream-title (description) has a native tooltip (false) or not (true)
            if(true)
                wait(500, element).then(element => {
                    const title = decodeHTML(element.getAttribute('title') ?? '');

                    if(title.length < 1)
                        return;

                    new Tooltip(element, title, { from: 'top' });

                    element.removeAttribute('title');
                });

            $.all('[tt-parse-commands]:not([tt-parsed="true"i])').map(element => {
                const titleTo = element.getAttribute('title-to');

                element.outerHTML = unescape(atob(element.getAttribute('tt-parse-commands')));

                when.defined(to => $(`[title-to^="${ to };"i]`), 30, titleTo).then(tooltip => {
                    const [to, title = ''] = tooltip.getAttribute('title-to').split(';');

                    if(title.trim().length)
                        new Tooltip(tooltip, title);
                    tooltip.removeAttribute('title-to');
                });

                element.setAttribute('tt-parsed', true);
            });
        }
    },

    unhandler: () => {
        const title = $('[data-a-target="stream-title"i]');

        if(defined(title))
            title.innerHTML = encodeHTML($('[data-a-target="stream-title"i]').innerText);
    },

    setup() {
        $remark("Parsing title commands...");

        RegisterJob('parse_commands');

        // Add the chat menu popup...
        let CSSBlockName = `Chat-Input-Menu:${ new UUID }`
            , AvailableCommands;

        $('[data-a-target="chat-input"i]')?.addEventListener('keyup', delay(async event => {
            let { target, code, altKey, ctrlKey, metaKey, shiftKey } = event
                , value = (target?.value ?? target?.textContent ?? target?.innerText)
                , [tray, chat] = target.closest('div:not([class])')?.firstElementChild?.children ?? [,]
                , f = furnish;

            if(['Tab', 'Space', 'Enter', 'Escape'].contains(code) || value?.contains(' ') || !value?.startsWith('!')) {
                const command = $('.tt-chat-input-suggestion')?.getAttribute('command');

                if(code.equals('Tab') && defined(command)) {
                    const match = value.match(/!(\S+|$)/)
                        , { index } = match
                        , [text, word] = match;

                    target.setRangeText(`!${ command }`, index, index + text.length, 'end');
                }

                tray?.classList?.remove('tt-chat-input-tray__open');

                chat?.classList?.remove('tt-chat-input-container__open');
                chat?.firstElementChild?.classList?.remove('tt-chat-input-container__input-wrapper');

                $('#tt-tcito1')?.remove();

                return RemoveCustomCSSBlock(CSSBlockName);
            }

            value = value.slice(1).toLowerCase();

            const listable = (AvailableCommands ??= await STREAMER.coms)
                .sort((a, b) => (
                    (false
                        || (true
                            && a.command.toLowerCase().contains(value)
                            && b.command.toLowerCase().missing(value)
                        )
                        || (true
                            && defined(a.aliases.find(aka => aka.toLowerCase().contains(value)))
                            && nullish(b.aliases.find(aka => aka.toLowerCase().contains(value)))
                        )
                    )
                        ? -1
                        : (false
                            || (true
                                && b.command.toLowerCase().contains(value)
                                && a.command.toLowerCase().missing(value)
                            )
                            || (true
                                && defined(b.aliases.find(aka => aka.toLowerCase().contains(value)))
                                && nullish(a.aliases.find(aka => aka.toLowerCase().contains(value)))
                            )
                        )
                            ? +1
                            : 0
                )
                )
                .slice(0, 30)
                .map(data => ({ ...data, textDistance: Math.min(...[data.command, ...data.aliases].map(string => value.distanceFrom(string.toLowerCase()))) }))
                .sort((a, b) => a.textDistance - b.textDistance)
                .slice(0, 5);

            tray.classList.add('tt-chat-input-tray__open');

            chat.classList.add('tt-chat-input-container__open');
            chat.firstElementChild.classList.add('tt-chat-input-container__input-wrapper');

            if(listable.length < 1) {
                $('#tt-tcito1')?.remove();

                tray.firstElementChild.append(
                    f('#tt-tcito1').with(
                        f('.tcito2').with(
                            f('.tcito3').with(
                                f('div', { style: `max-height:3rem!important` },
                                    f('div', { style: `padding: 0.05rem!important` },
                                        f('span', { style: `color:var(--color-text-alt-2)!important` }, `No commands found.`)
                                    )
                                )
                            )
                        )
                    )
                );
            } else {
                $('#tt-tcito1')?.remove();

                tray.firstElementChild.append(
                    f('#tt-tcito1').with(
                        f('.tcito2').with(
                            f('.tcito3').with(
                                f('div', { style: `max-height:18rem!important` },
                                    f.div(
                                        // f('div', { style: `text-align:center` },
                                        //     f('.tt-kb').with(
                                        //         f('p.tt-kb-text').with('Space')
                                        //     ),
                                        //     'insert selected command'
                                        // ),
                                        ...listable.map(({ aliases, command, reply, availability, enabled, origin, variables, textDistance }, index, array) => {
                                            reply = parseCommands(reply, variables);

                                            const { href } = parseURL(reply);

                                            if(defined(href))
                                                reply = f('a', { href: href.replace(/^(\w{3,}\.\w{2,})/, `https://$1`), style: `margin-right:0.75rem` }, reply);

                                            return f(`#tt-command--${ command.replace(/[^\w\-]+/g, '') }`).with(
                                                f('button.tcito7', {
                                                    style: `cursor:${ ['not-allowed', 'auto'][+enabled] }!important; color:${ ['inherit', 'var(--color-text-success)'][+(textDistance < 1)] }`,
                                                    onmouseup: ({ target, button = -1 }) => {
                                                        if(button)
                                                            return;

                                                        const command = $('.tt-chat-input-suggestion', target.closest('[id]'))?.getAttribute('command');

                                                        if(defined(command)) {
                                                            const target = $('[data-a-target="chat-input"i]');
                                                            const match = (target?.value ?? target?.textContent ?? target?.innerText).match(/!(\S+|$)/)
                                                                , { index } = match
                                                                , [text, word] = match;

                                                            target.setRangeText(`!${ command }`, index, index + text.length, 'end');
                                                            target.focus();
                                                        }

                                                        tray.classList.remove('tt-chat-input-tray__open');

                                                        chat.classList.remove('tt-chat-input-container__open');
                                                        chat.firstElementChild.classList.remove('tt-chat-input-container__input-wrapper');

                                                        $('#tt-tcito1')?.remove();

                                                        return RemoveCustomCSSBlock(CSSBlockName);
                                                    },
                                                },
                                                    f('.tcito8').with(
                                                        f('.tcito9').with(
                                                            f('p.tt-chat-input-suggestion', { style: `word-break:break-word!important; color:${ ['inherit', 'var(--color-text-error)'][+!enabled] }`, command },
                                                                f('img.chat-badge', { src: Chat.badges.get(availability), availability, style: `margin:0 0.75rem 0 0; height:1.5rem; width:1.5rem` }),

                                                                `!${ command }`,

                                                                f('span.tt-hide-inline-text-overflow', { style: `color:var(--color-text-alt-2); padding:0 0.75rem 0 0; position:absolute; right:0; max-width:50%`, title: reply })
                                                                    .html(reply)
                                                            )
                                                        )
                                                    )
                                                )
                                            );
                                        })
                                    )
                                )
                            )
                        )
                    )
                );
            }

            // Change the input's styling...
            AddCustomCSSBlock(CSSBlockName, `
                .tt-chat-input-tray__open {
                    bottom: 100%;
                    margin: 0 -.5rem -.5rem;
                    min-width: 100%;

                    /* .bhOZBz */
                    background-color: var(--color-background-base) !important;
                    border: var(--border-width-default) solid var(--color-border-base) !important;
                    border-radius: 0.6rem !important;
                    display: block !important;

                    box-shadow: var(--shadow-elevation-1) !important;

                    position: absolute !important;
                    left: 0px !important;
                    right: 0px !important;
                    z-index: var(--z-index-below) !important;

                    padding: 0.5rem !important;
                }

                .tcito2 {
                    position: relative !important;
                    padding: 0.5rem 0.5rem 0 !important;
                }

                .tcito3 {
                    display: flex !important;
                    flex-direction: column !important;
                    overflow: hidden !important;
                }

                .tcito7 {
                    border-radius: var(--border-radius-small);
                    display: block;
                    width: 100%;
                    color: inherit;
                }

                .tcito7:hover {
                    background-color: var(--color-background-interactable-hover) !important;
                }

                .tcito8 {
                    -webkit-box-align: center !important;
                    -moz-box-align: center !important;
                    align-items: center !important;
                    display: flex !important;
                    padding-left: 0.5rem !important;
                    padding-right: 0.5rem !important;
                }

                .tcito9 {
                    padding: 0.5rem !important;
                    display: flex !important;
                    -webkit-box-pack: justify !important;
                    -moz-box-pack: justify !important;
                    justify-content: space-between !important;
                    -webkit-box-align: center !important;
                    -moz-box-align: center !important;
                    align-items: center !important;
                    -webkit-box-flex: 1 !important;
                    -moz-box-flex: 1 !important;
                    flex-grow: 1 !important;
                }

                .tt-chat-input-container__open {
                    border: 1px solid var(--color-border-base);
                    border-top: 0;
                    box-shadow: 0 2px 3px -1px rgba(0,0,0,.1),0 2px 2px -2px rgba(0,0,0,.02);
                    margin: 0 -.5rem -.5rem;
                    min-width: 100%;

                    /* .exNKnb */
                    background-color: var(--color-background-base)  !important;
                    border-bottom-left-radius: 0.6rem !important;
                    border-bottom-right-radius: 0.6rem !important;
                    display: block !important;
                    padding: 0.5rem !important;
                }

                .tt-chat-input-container__input-wrapper {
                    margin: 0 -1px -1px;
                }

                .tt-kb {
                    background-color: var(--color-background-alt) !important;
                    border: var(--border-width-default) solid var(--color-border-base) !important;
                    border-radius: 0.2rem !important;
                    display: inline-flex !important;
                    -webkit-box-align: center !important;
                    -moz-box-align: center !important;

                    align-items: center !important;
                    padding: 0 0.5rem !important;

                    /* .keyboard-prompt */
                    height: 1.5rem;
                    margin-right: .3rem;
                }

                .tt-kb-text {
                    color: var(--color-text-alt-2) !important;

                    /* .keyboard-prompt--text */
                    font-size: 1.1rem;
                }
            `);
        }, 250));
    },
});
