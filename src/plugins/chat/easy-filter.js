/*** /plugins/chat/easy-filter.js
 * Easy Filter - NOT A SETTING. This is a helper for "Message Filter".
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.easy_filter',
    job: 'easy_filter',
    timer: 500,

    handler: () => {
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
    },

    enabled() {
        return parseBool(Settings.filter_messages);
    },
});
