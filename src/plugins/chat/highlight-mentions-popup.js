/*** /plugins/chat/highlight-mentions-popup.js
 * Message Highlighter - Popup.
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.highlight_mentions_popup',
    job: 'highlight_mentions_popup',
    timer: -500,

    handler: (context) => {
        Chat.get().map(Chat.onmessage = async line => {
            if(line.message.missing(context.USERNAME))
                return;

            if(Queue.message_popups.missing(line.uuid)) {
                Queue.message_popups.push(line.uuid);

                when(line => (defined(line.element) ? line : false), 1000, line).then(async line => {
                    let { author, message, element } = line
                        , reply = await line.reply;

                    const existing = $('#tt-chat-footer');

                    if(defined(existing))
                        return;

                    // $log('Generating footer:', { author, message });

                    new ChatFooter(`@${ author } mentioned you.`, {
                        onclick: event => {
                            const chatbox = $('[class*="chat-input"i] textarea')
                                , existing = $('#tt-chat-footer');

                            if(defined(chatbox))
                                chatbox.focus();
                            if(defined(existing))
                                existing.remove();

                            $log("Clicked [reply] button", { author, chatbox, existing, line, message, reply });

                            (reply ?? $('button[data-test-selector*="reply"i]', element))?.click();
                        },
                    });
                });
            }
        });
    },
});
