/*** /plugins/chat/filter-messages.js
 * Filter Messages.
 * Moved verbatim from chat.js (Chat__Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.filter_messages',

    async install(context) {
        let MESSAGE_FILTER;

        // Rules may be patterns; one that doesn't compile is matched as plain text instead of throwing
        function MatchesRule(text, message) {
            try {
                return RegExp(text, 'i').test(message);
            } catch {
                return message.toLowerCase().includes(text.toLowerCase());
            }
        }

        Handlers.filter_messages = () => {
            new context.StopWatch('filter_messages');

            MESSAGE_FILTER ??= Chat.onmessage = Chat.onpinned = async line => {
                when(line => (defined(line.element)? line: false), 1000, line).then(async line => {
                    let Filter = context.UPDATE_RULES('filter');

                    let { message, mentions, author, badges, emotes, element } = line,
                        reason, match;

                    let censoring = parseBool(element.getAttribute('tt-hidden-message'));

                    if(censoring)
                        return;

                    let censor = parseBool(false
                        // Filter users on all channels
                        || (Filter.user.test(author)? (match = author, reason = 'user'): false)
                        // Filter badges on all channels
                        || (Filter.badge.test(badges)? (match = badges, reason = 'badge'): false)
                        // Filter emotes on all channels
                        || (Filter.emote.test(emotes)? (match = emotes, reason = 'emote'): false)
                        // Filter messages (RegExp) on all channels
                        || (Filter.text.test(message)? (match = message, reason = 'text'): false)
                        // Filter messages/users on specific a channel
                        || Filter.channel.map(({ name, badge, emote, user, text }) => {
                            let channel = (context.STREAMER?.name || "~Anonymous");

                            return (true
                                && (channel.replace(/^[^\/]/, '/$&').equals(name.replace(/^[^\/]/, '/$&')))
                                && (false
                                    || (author.replace(/^[^@]/, '@$&').equals(user?.replace(/^[^@]/, '@$&'))? (match = author, reason = 'channel user'): false)
                                    || (!!~badges.findIndex(medal => medal.toLowerCase().contains(badge?.toLowerCase()) && medal.length && badge.length)? (match = badges, reason = 'channel badge'): false)
                                    || (!!~emotes.findIndex(glyph => glyph.toLowerCase().contains(emote?.toLowerCase()) && glyph.length && emote.length)? (match = emotes, reason = 'channel emote'): false)
                                    || (MatchesRule(text, message)? (match = text, reason = 'channel text'): false)
                                )
                            )
                        }).contains(true)
                    );

                    if(!censor)
                        return;

                    let hidden = parseBool(element.getAttribute('tt-hidden-message'));

                    if(hidden || mentions.contains(context.USERNAME))
                        return;

                    $log(`Censoring message because the ${ reason } matches: ${ match }`, line);

                    element.setAttribute('tt-hidden-message', censor);
                });
            };

            if(defined(MESSAGE_FILTER))
                Chat.get().map(MESSAGE_FILTER);

            context.StopWatch.stop('filter_messages');
        };
        Timers.filter_messages = -2_500;

        Unhandlers.filter_messages = () => {
            let hidden = $.all('[tt-hidden-message]');

            hidden.map(element => element.removeAttribute('tt-hidden-message'));
        };

        __FilterMessages__:
        if(parseBool(Settings.filter_messages)) {
            $remark("Adding message filtering...");

            RegisterJob('filter_messages');
        }
    },
});
