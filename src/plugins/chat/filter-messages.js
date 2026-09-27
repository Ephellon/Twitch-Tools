/*** /plugins/chat/filter-messages.js
 * Filter Messages.
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let MESSAGE_FILTER, MatchesRule;

plugin({
    id: 'chat.filter_messages',
    job: 'filter_messages',
    timer: -2_500,

    /**
     * Initializes message filtering rules and the matching utility.
     */
    init() {
        MatchesRule = function MatchesRule(text, message) {
            try {
                return RegExp(text, 'i').test(message);
            } catch {
                return message.toLowerCase().includes(text.toLowerCase());
            }
        };

        MESSAGE_FILTER = void null;
    },

    /**
     * Runs every tick: Hides chat messages that match user, badge, emote, or text-based filter rules.
     * @param {Object} context - The plugin context
     */
    handler: (context) => {
        new context.StopWatch('filter_messages');

        MESSAGE_FILTER ??= Chat.onmessage = Chat.onpinned = async line => {
            when(line => (defined(line.element) ? line : false), 1000, line).then(async line => {
                const Filter = context.UPDATE_RULES('filter');

                let { message, mentions, author, badges, emotes, element } = line
                    , reason, match;

                const censoring = parseBool(element.getAttribute('tt-hidden-message'));

                if(censoring)
                    return;

                const censor = parseBool(false
                    // Filter users on all channels
                    || (Filter.user.test(author) ? (match = author, reason = 'user') : false)
                    // Filter badges on all channels
                    || (Filter.badge.test(badges) ? (match = badges, reason = 'badge') : false)
                    // Filter emotes on all channels
                    || (Filter.emote.test(emotes) ? (match = emotes, reason = 'emote') : false)
                    // Filter messages (RegExp) on all channels
                    || (Filter.text.test(message) ? (match = message, reason = 'text') : false)
                    // Filter messages/users on specific a channel
                    || Filter.channel.map(({ name, badge, emote, user, text }) => {
                        const channel = (context.STREAMER?.name || '~Anonymous');

                        return (true
                            && (channel.replace(/^[^\/]/, '/$&').equals(name.replace(/^[^\/]/, '/$&')))
                            && (false
                                || (author.replace(/^[^@]/, '@$&').equals(user?.replace(/^[^@]/, '@$&')) ? (match = author, reason = 'channel user') : false)
                                || (~badges.findIndex(medal => medal.toLowerCase().contains(badge?.toLowerCase()) && medal.length && badge.length) ? (match = badges, reason = 'channel badge') : false)
                                || (~emotes.findIndex(glyph => glyph.toLowerCase().contains(emote?.toLowerCase()) && glyph.length && emote.length) ? (match = emotes, reason = 'channel emote') : false)
                                || (MatchesRule(text, message) ? (match = text, reason = 'channel text') : false)
                            )
                        );
                    }).contains(true)
                );

                if(!censor)
                    return;

                const hidden = parseBool(element.getAttribute('tt-hidden-message'));

                if(hidden || mentions.contains(context.USERNAME))
                    return;

                $log(`Censoring message because the ${ reason } matches: ${ match }`, line);

                element.setAttribute('tt-hidden-message', censor);
            });
        };

        if(defined(MESSAGE_FILTER))
            Chat.get().map(MESSAGE_FILTER);

        context.StopWatch.stop('filter_messages');
    },

    /**
     * Undoes message filtering by revealing all previously hidden messages.
     */
    unhandler: () => {
        const hidden = $.all('[tt-hidden-message]');

        hidden.map(element => element.removeAttribute('tt-hidden-message'));
    },

    /**
     * Sets up the message filtering system.
     */
    setup() {
        $remark("Adding message filtering...");
    },
});
