/*** /plugins/chat/native-twitch-reply.js
 * Native Twitch Reply.
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let NATIVE_REPLY_POLYFILL;

plugin({
    id: 'chat.native_twitch_reply',
    job: 'native_twitch_reply',
    timer: 1000,

    /**
     * Initializes the native reply polyfill state.
     */
    init() {
        NATIVE_REPLY_POLYFILL = void null;
    },

    /**
     * Implements a polyfill to add native-style reply buttons and input behavior to the chat.
     * @param {Object} context - The plugin context
     */
    handler: (context) => {
        new context.StopWatch('native_twitch_reply');

        // Enter
        if(nullish(context.GLOBAL_EVENT_LISTENERS.ENTER))
            $('[data-a-target="chat-input"i]')?.addEventListener('keydown', context.GLOBAL_EVENT_LISTENERS.ENTER = ({ key, altKey, ctrlKey, metaKey, shiftKey }) => {
                if(!(altKey || ctrlKey || metaKey || shiftKey) && key.equals('enter'))
                    $('#tt-close-native-twitch-reply')?.click();
            });

        if(defined(NATIVE_REPLY_POLYFILL) || $.defined('.chat-line__reply-icon'))
            return context.StopWatch.stop('native_twitch_reply');

        NATIVE_REPLY_POLYFILL ??= {
            // Button above chat elements
            NewReplyButton: ({ uuid, style, handle, message, mentions }) => {
                const f = furnish;

                const addedClasses = {
                        bubbleContainer: ['chat-input-tray__open', 'tt-block', 'tt-border-b', 'tt-border-l', 'tt-border-r', 'tt-border-radius-large', 'tt-border-t', 'tt-c-background-base', 'tt-elevation-1', 'tt-left-0', 'tt-pd-05', 'tt-right-0', 'tt-z-below'],
                        chatContainer: ['chat-input-container__open', 'tt-block', 'tt-border-bottom-left-radius-large', 'tt-border-bottom-right-radius-large', 'tt-c-background-base', 'tt-pd-05'],
                        chatContainerChild: ['chat-input-container__input-wrapper'],
                    }
                    , removedClasses = {
                        bubbleContainer: ['tt-block', 'tt-border-radius-large', 'tt-elevation-0', 'tt-left-0', 'tt-pd-0', 'tt-right-0', 'tt-z-below'],
                        chatContainer: ['tt-block', 'tt-border-radius-large', 'tt-pd-0'],
                    };

                return f('.chat-line__reply-icon.tt-absolute.tt-border-radius-medium.tt-c-background-base.tt-elevation-1').with(
                    f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=chat-reply-button]',
                        {
                            onclick: event => {
                                let { currentTarget } = event
                                    , messageElement = currentTarget.closest('div').previousElementSibling
                                    , chatInput = $('[data-a-target="chat-input"i]')
                                    , [bubbleContainer, chatContainer] = $.all('.chat-input > :last-child > :first-child > :not(:first-child)')
                                    , chatContainerChild = $('div', chatContainer);

                                const f = furnish;

                                AddNativeReplyBubble: {
                                    bubbleContainer.classList.remove(...removedClasses.bubbleContainer);
                                    bubbleContainer.classList.add(...addedClasses.bubbleContainer);
                                    chatContainer.classList.remove(...removedClasses.chatContainer);
                                    chatContainer.classList.add(...addedClasses.chatContainer);
                                    chatContainerChild.classList.add(...addedClasses.chatContainerChild);

                                    bubbleContainer.append(
                                        f(`#tt-native-twitch-reply.tt-align-items-start.tt-flex.tt-flex-row.tt-pd-0[@testSelector=chat-input-tray]`).with(
                                            f('.tt-align-center.tt-mg-05').with(
                                                f('.tt-align-items-center.tt-flex').html(Glyphs.modify('reply', { height: '24px', width: '24px' }))
                                            ),
                                            f('.tt-flex-grow-1.tt-pd-l-05.tt-pd-y-05').with(
                                                f('span.tt-c-text-alt.tt-font-size-5.tt-strong.tt-word-break-word', {
                                                    'connected-to': uuid,

                                                    handle, message, mentions,

                                                    innerHTML: `Replying to <span style="${ style }">@${ handle }</span>`,
                                                })
                                            ),
                                            f('.tt-right-0.tt-top-0').with(
                                                f('button#tt-close-native-twitch-reply.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative',
                                                    {
                                                        onclick: event => {
                                                            const chatInput = $('[data-a-target="chat-input"i]')
                                                                , [bubbleContainer, chatContainer] = $.all('.chat-input > :last-child > :first-child > :not(:first-child)')
                                                                , chatContainerChild = $('div', chatContainer);

                                                            RemoveNativeReplyBubble: {
                                                                bubbleContainer.classList.remove(...addedClasses.bubbleContainer);
                                                                bubbleContainer.classList.add(...removedClasses.bubbleContainer);
                                                                chatContainer.classList.remove(...addedClasses.chatContainer);
                                                                chatContainer.classList.add(...removedClasses.chatContainer);
                                                                chatContainerChild.classList.remove(...addedClasses.chatContainerChild);

                                                                $.all('[id^="tt-native-twitch-reply"i]').forEach(element => element.remove());

                                                                chatInput.setAttribute('placeholder', "Send a message");
                                                            }
                                                        },

                                                        innerHTML: Glyphs.modify('x', { height: '24px', width: '24px' }),
                                                    }
                                                )
                                            )
                                        )
                                    );

                                    bubbleContainer.append(
                                        f('#tt-native-twitch-reply-message.font-scale--default.tt-pd-x-1.tt-pd-y-05.chat-line__message[@aTarget=chat-line-message][@testSelector=chat-line-message]').with(
                                            f('.tt-relative').html(messageElement.outerHTML)
                                        )
                                    );

                                    chatInput.setAttribute('placeholder', "Send a reply");
                                }

                                chatInput.focus();
                            },
                        },
                        f('span.tt-button-icon__icon').with(
                            f('div',
                                { style: 'width: 2rem; height: 2rem;' },
                                f('.tt-icon').with(
                                    f('.tt-aspect').html(Glyphs.reply)
                                )
                            )
                        )
                    )
                );
            },

            // Highlighter for chat elements
            AddNativeReplyButton: line => {
                when(line => (defined(line.element) ? line : false), 1000, line).then(async line => {
                    const { uuid, style, handle, message, mentions, element } = line;

                    if($.defined('.chat-line__message-container', element))
                        return;

                    if(handle == context.USERNAME)
                        return;

                    const parent = $('div', element);

                    if(nullish(parent))
                        return;

                    const target = $('div', parent);

                    if(nullish(target))
                        return;

                    const highlighter = furnish('.chat-line__message-highlight.tt-absolute.tt-border-radius-medium[@testSelector=chat-message-highlight]', {});

                    target.classList.add('chat-line__message-container');

                    parent.insertBefore(highlighter, parent.firstElementChild);
                    parent.append(NATIVE_REPLY_POLYFILL.NewReplyButton({ uuid, style, handle, message, mentions }));
                });
            },
        };

        Chat.get().map(NATIVE_REPLY_POLYFILL.AddNativeReplyButton);

        Chat.onmessage = NATIVE_REPLY_POLYFILL.AddNativeReplyButton;

        context.StopWatch.stop('native_twitch_reply');
    },

    /**
     * Initializes the native reply button feature.
     */
    setup() {
        $remark("Adding native reply buttons...");
    },
});
