/*** /plugins/chat/highlight-mentions.js
 * Message Highlighter.
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.highlight_mentions',
    job: 'highlight_mentions',
    timer: -500,

    handler: (context) => {
        Chat.get().map(Chat.onmessage = async line => {
            const usernames = [context.USERNAME];

            if(parseBool(Settings.highlight_mentions_extra))
                usernames.push('all', 'chat', 'everyone');

            if(!~line.mentions.findIndex(username => RegExp(`^(${ usernames.join('|') })$`, 'i').test(username)))
                return;

            if(Queue.messages.missing(line.uuid)) {
                Queue.messages.push(line.uuid);

                when(line => (defined(line.element) ? line : false), 1000, line).then(async line => {
                    const { author, message, style } = line;
                    const element = await line.element;

                    // $log('Highlighting message:', { author, message });

                    const [color] = style.split(/color:([^;]+)/i).map(s => s.trim()).filter(s => s.length).map(Color.destruct);

                    element.modStyle(`background-color: var(--color-opac-p-8); border:1px solid ${ color }; border-radius:3px;`);
                });
            }
        });
    },
});
