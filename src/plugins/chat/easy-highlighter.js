/*** /plugins/chat/easy-highlighter.js
 * Easy Highlighter - NOT A SETTING. This is a helper for "Highlight Phrases".
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.easy_highlighter',
    job: 'easy_highlighter',
    timer: 500,

    /**
     * Adds "Highlight" buttons to viewer and emote cards to quickly add them to the phrase highlighting rules.
     */
    handler: () => {
        const card = $('[data-a-target="viewer-card"i], [data-a-target="emote-card"i]')
            , existing = $('#tt-highlight-rule--user, #tt-highlight-rule--emote');

        if(nullish(card) || defined(existing))
            return;

        let title = $('h1,h2,h3,h4,h5,h6', card)
            , [name] = title.childNodes
            , type = (card.getAttribute('data-a-target').equals('viewer-card') ? 'user' : 'emote')
            , { phrase_rules } = Settings;

        name = name?.textContent?.replace(/[^]+?\((\w+)\)/, '$1');

        if(type.equals('user')) {
            /* Highlight users */
            if(phrase_rules && phrase_rules.split(',').contains(`@${ name }`))
                return /* Already highlighting messages from this person */;

            const phrase = furnish('#tt-highlight-rule--user', {
                title: `Highlight all messages from @${ name }`,
                style: 'cursor:pointer; fill:var(--color-green); font-size:1.1rem; font-weight:normal',
                username: name,

                onclick: event => {
                    let { currentTarget } = event
                        , username = currentTarget.getAttribute('username')
                        , { phrase_rules } = Settings;

                    phrase_rules = (phrase_rules || '').split(',');
                    phrase_rules.push(`@${ username }`);
                    phrase_rules = phrase_rules.join(',');

                    $.all(`[data-a-user="${ username }"i]`).map(div => div.closest('[data-a-target="chat-line-message"i]').setAttribute('tt-light', true));

                    currentTarget.setAttribute('tt-hidden-message', true);

                    Settings.set({ phrase_rules });
                },

                innerHTML: `${ Glyphs.star } Highlight messages from @${ name }`,
            });

            const svg = $('svg', phrase);

            svg.modStyle('vertical-align:bottom; height:20px; width:20px');

            title.append(phrase);
        } else if(type.equals('emote')) {
            /* Highlight emotes */
            if(phrase_rules && phrase_rules.split(',').contains(`:${ name }:`))
                return /* Already highlighting this emote */;

            const phrase = furnish('#tt-highlight-rule--emote', {
                title: "Highlight this emote",
                style: 'cursor:pointer; fill:var(--color-green); font-size:1.1rem; font-weight:normal;',
                emote: `:${ name }:`,

                onclick: event => {
                    let { currentTarget } = event
                        , emote = currentTarget.getAttribute('emote')
                        , { phrase_rules } = Settings;

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

            const svg = $('svg', phrase);

            svg.modStyle('vertical-align:bottom; height:20px; width:20px');

            title.append(phrase);
        }
    },

    /**
     * Checks if the phrase highlighting feature is enabled in settings.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
        return parseBool(Settings.highlight_phrases);
    },
});
