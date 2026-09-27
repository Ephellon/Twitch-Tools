/*** /plugins/chat/recover-chat.js
 * Recover Chat.
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.recover_chat',
    job: 'recover_chat',
    timer: 500,

    /**
     * Attempts to recover the chat by replacing the chat shell with a popout iframe if a loading error is detected.
     * @param {Object} context - Plugin context
     */
    handler: (context) => {
        new context.StopWatch('recover_chat');

        const [chat] = $.all('[role] ~ *:is([role="log"i], [class~="chat-room"i], [data-a-target*="chat"i], [data-test-selector*="chat"i]), [role="tt-log"i], [data-test-selector="banned-user-message"i], [data-test-selector^="video-chat"i]')
            , error = $('[class*="chat"i][class*="content"] .core-error');

        if(defined(error) || nullish(chat)) {
            $('[data-a-target*="welcome"i]')?.append(furnish('p', { style: 'text-decoration:underline var(--color-error)' }, `There was an error loading chat: ${ error?.textContent ?? 'no response' }`));
            error?.remove();
        }

        if(defined(chat))
            return;

        // Add an iframe...
        // An array is never nullish, so the path fallback never ran; fall back when there's no name instead
        let [,name] = (context.STREAMER?.name ? [, context.STREAMER.name] : location.pathname.split(/\W/, 2))
            , input = $('.chat-input')
            , iframe = furnish(`iframe#tt-popup-container.stream-chat.tt-c-text-base.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-full-height.tt-relative`, {
                src: `./popout/${ name }/chat`,
                role: 'tt-log',
            })
            , container = $('.chat-shell', top.document);

        container?.parentElement?.replaceChild(iframe, container);

        context.StopWatch.stop('recover_chat');
    },
});
