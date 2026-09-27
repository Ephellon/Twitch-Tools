/*** /plugins/chat/emote-searching.js
 * Emote Searching - NOT A SETTING. This is a helper for "Convert Emotes" and "BTTV Emotes".
 * Moved verbatim from chat.js (Chat__Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.emote_searching',

    async install(context) {
        context.EmoteSearch = {};
        context.EmoteDragCommand = undefined;

        Handlers.emote_searching = () => {
            context.EmoteSearch.input = $('.emote-picker [type="search"i]');

            context.EmoteDragCommand = (lang => {
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

            if(defined(context.EmoteSearch.input?.value))
                if(context.EmoteSearch.input.value != context.EmoteSearch.value)
                    if((context.EmoteSearch.value = context.EmoteSearch.input.value.trim())?.length >= 3)
                        for(let [name, callback] of context.EmoteSearch.__onquery__)
                            wait(250).then(() => {
                                if(context.EmoteSearch.value == context.EmoteSearch.input.value)
                                    callback(context.EmoteSearch.value);
                            });
        };
        Timers.emote_searching = 250;

        __EmoteSearching__:
        if([Settings.convert_emotes, Settings.bttv_emotes].map(parseBool).contains(true)) {
            Object.defineProperties(context.EmoteSearch, {
                onquery: {
                    set(callback) {
                        let name = callback.name || UUID.from(callback.toString()).value;

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
    },
});
