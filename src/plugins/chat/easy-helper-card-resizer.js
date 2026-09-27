/*** /plugins/chat/easy-helper-card-resizer.js
 * Easy Helper Card Resizer - NOT A SETTING. This is a helper for "Filter Messages" and "Highlight Phrases" that adjusts the card height for hidden children.
 * Moved verbatim from chat.js (Chat__Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.easy_helper_card_resizer',

    async install(context) {
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
    },
});
