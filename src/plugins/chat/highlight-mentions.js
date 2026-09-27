/*** /plugins/chat/highlight-mentions.js
 * Message Highlighter.
 * Moved verbatim from chat.js (Chat__Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.highlight_mentions',

    async install(context) {
        Handlers.highlight_mentions = () => {
            Chat.get().map(Chat.onmessage = async line => {
                let usernames = [context.USERNAME];

                if(parseBool(Settings.highlight_mentions_extra))
                    usernames.push('all', 'chat', 'everyone');

                if(!~line.mentions.findIndex(username => RegExp(`^(${ usernames.join('|') })$`, 'i').test(username)))
                    return;

                if(Queue.messages.missing(line.uuid)) {
                    Queue.messages.push(line.uuid);

                    when(line => (defined(line.element)? line: false), 1000, line).then(async line => {
                        let { author, message, style } = line;
                        let element = await line.element;

                        // $log('Highlighting message:', { author, message });

                        let [color] = style.split(/color:([^;]+)/i).map(s => s.trim()).filter(s => s.length).map(Color.destruct);

                        element.modStyle(`background-color: var(--color-opac-p-8); border:1px solid ${ color }; border-radius:3px;`);
                    });
                }
            });
        };
        Timers.highlight_mentions = -500;

        __HighlightMentions__:
        if(parseBool(Settings.highlight_mentions)) {
            RegisterJob('highlight_mentions');
        }
    },
});
