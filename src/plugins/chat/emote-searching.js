/*** /plugins/chat/emote-searching.js
 * Emote Searching - NOT A SETTING. This is a helper for "Convert Emotes" and "BTTV Emotes".
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.emote_searching',
    job: 'emote_searching',
    timer: 250,

    /**
     * Initializes the emote search and drag command state.
     * @param {Object} context - The plugin context
     */
    init(context) {
        context.EmoteSearch = {};
        context.EmoteDragCommand = void null;
    },

    /**
     * Monitors the emote picker search input and triggers registered query callbacks.
     * @param {Object} context - The plugin context
     */
    handler: (context) => {
        context.EmoteSearch.input = $('.emote-picker [type="search"i]');

        context.EmoteDragCommand = (lang => {
            switch(lang) {
                case 'de': {
                    return 'Ziehen, um zu benutzen';
                }

                case 'es': {
                    return 'Arrastre para usar';
                }

                case 'ru': {
                    return 'Перетащите для использования';
                }

                case 'en':
                default: {
                    return 'Drag to use';
                }
            } // switch lang
        })(top.LANGUAGE);

        if(defined(context.EmoteSearch.input?.value))
            if(context.EmoteSearch.input.value != context.EmoteSearch.value)
                if((context.EmoteSearch.value = context.EmoteSearch.input.value.trim())?.length >= 3)
                    for(const [name, callback] of context.EmoteSearch.__onquery__)
                        wait(250).then(() => {
                            if(context.EmoteSearch.value == context.EmoteSearch.input.value)
                                callback(context.EmoteSearch.value);
                        });
    },

    /**
     * Checks if emote conversion or BTTV emote settings are enabled.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
        return [Settings.convert_emotes, Settings.bttv_emotes].map(parseBool).contains(true);
    },

    /**
     * Configures the emote search functionality, including result appending and text distance calculations.
     * @param {Object} context - The plugin context
     */
    setup(context) {
        Object.defineProperties(context.EmoteSearch, {
            onquery: {
                set(callback) {
                    const name = callback.name || UUID.from(callback.toString()).value;

                    if(context.EmoteSearch.__onquery__.has(name))
                        return context.EmoteSearch.__onquery__.get(name);

                    // $remark('Adding [on query] event listener', { [name]: callback });

                    context.EmoteSearch.__onquery__.set(name, callback);

                    return callback;
                },

                get() {
                    return context.EmoteSearch.__onquery__.size;
                },
            },
            __onquery__: { value: new Map() },

            appendResults: {
                value: function appendResults(nodes, type) {
                    $.all(`[tt-${ type }-emote-search-result]`).forEach(node => node.remove());

                    const container = $('[class*="emote-picker"i] [class*="emote-picker"i][class*="block"i] > *:last-child');

                    for(const node of nodes) {
                        if(nullish(node))
                            continue;

                        node.setAttribute(`tt-${ type }-emote-search-result`, UUID.from(node.innerHTML).value);

                        container.append(node);
                    }

                    const title = (null
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
    },
});
