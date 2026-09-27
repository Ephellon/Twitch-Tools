/*** /plugins/chat/highlight-phrases.js
 * Highlight Phrases.
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let PHRASE_HIGHLIGHTER;

plugin({
    id: 'chat.highlight_phrases',
    job: 'highlight_phrases',
    timer: -2_500,

    init() {
        PHRASE_HIGHLIGHTER = void null;
    },

    handler: (context) => {
        new context.StopWatch('highlight_phrases');

        PHRASE_HIGHLIGHTER ??= Chat.onmessage = async line => {
            when(line => (defined(line.element) ? line : false), 1000, line).then(async line => {
                const Phrases = context.UPDATE_RULES('phrase');

                let { message, mentions, author, badges, emotes, style, element } = line
                    , reason;

                const censor = parseBool(false
                    // Phrase of users on all channels
                    || (Phrases.user.test(author) ? reason = 'user' : false)
                    // Phrase of badges on all channels
                    || (Phrases.badge.test(badges) ? reason = 'badge' : false)
                    // Phrase of emotes on all channels
                    || (Phrases.emote.test(emotes) ? reason = 'emote' : false)
                    // Phrase of messages (RegExp) on all channels
                    || (Phrases.text.test(message) ? reason = 'text' : false)
                    // Phrase of messages/users on specific a channel
                    || Phrases.channel.map(({ name, text, user, badge, emote }) => {
                        if(nullish(context.STREAMER))
                            return;

                        const channel = context.STREAMER.name?.toLowerCase();

                        return parseBool(false
                            || channel == name.toLowerCase()
                        ) && parseBool(false
                            || (('@' + author) == user ? reason = 'channel user' : false)
                            || (~badges.findIndex(medal => medal.contains(badge) && medal.length && badge.length) ? reason = 'channel badge' : false)
                            || (~emotes.findIndex(glyph => glyph.contains(emote) && glyph.length && emote.length) ? reason = 'channel emote' : false)
                            || (text?.test?.(message) ? reason = 'channel text' : false)
                        );
                    }).contains(true)
                );

                if(!censor)
                    return;

                $log(`Highlighting message because the ${ reason } matches`, line);

                const highlight = parseBool(element.hasAttribute('tt-light'));

                if(highlight)
                    return;

                const [color] = style.split(/color:([^;]+)/i).map(s => s.trim()).filter(s => s.length).map(Color.destruct);

                element.setAttribute('tt-light', true);
                element.modStyle(`border:1px solid ${ color }; border-radius:3px;`);
            });
        };

        if(defined(PHRASE_HIGHLIGHTER))
            Chat.get().map(PHRASE_HIGHLIGHTER);

        context.StopWatch.stop('highlight_phrases');
    },

    unhandler: () => {
        const highlight = $.all('[tt-light]');

        highlight.map(element => element.removeAttribute('tt-light'));
    },

    setup() {
        $remark("Adding phrase highlighting...");
    },
});
