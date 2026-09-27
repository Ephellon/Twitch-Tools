/*** /plugins/chat/simplify-chat.js
 * Simplify Chat.
 * Moved verbatim from chat.js (Chat__Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.simplify_chat',

    async install(context) {
        let SimplifyChatIndexToggle = 0;

        Handlers.simplify_chat = () => {
            if(parseBool(Settings.simplify_chat_monotone_usernames))
                AddCustomCSSBlock('Simplify Chat Monotone Usernames', `[data-a-target="chat-message-username"i] { color: var(--color-text-base) !important }`);

            if(parseBool(Settings.simplify_chat_font) || parseBool(Settings.simplify_page_font)) {
                let src = Runtime.getURL('/font');

                AddCustomCSSBlock('Simplify Page Font', `body { font-family: ${ Settings.simplify_page_font }, Sans-Serif !important }`);
                AddCustomCSSBlock('Simplify Chat Font', `[data-a-target*="chat"i][data-a-target*="message"i] { font-family: ${ Settings.simplify_chat_font }, Sans-Serif !important }`);

                AddCustomCSSBlock('Simplify Font (Head)', `
                @font-face {
                    font-family: Roobert;
                    font-weight: normal;
                    src: url("${ src }/Roobert.woff2") format("woff2");
                }

                @font-face {
                    font-family: Roobert;
                    font-weight: bold;
                    src: url("${ src }/Roobert-Bold.woff2") format("woff2");
                }

                @font-face {
                    font-family: Dyslexie;
                    font-weight: 100 400;
                    src: url("${ src }/Dyslexie-Regular.woff") format("woff");
                }

                @font-face {
                    font-family: Dyslexie;
                    font-weight: 500 900;
                    src: url("${ src }/Dyslexie-Bold.woff") format("woff");
                }

                @font-face {
                    font-family: "04b03";
                    font-weight: normal;
                    src: url("${ src }/04b03.woff2") format("woff2");
                }

                @font-face {
                    font-family: Inter;
                    font-style: normal;
                    font-weight: normal;
                    src: url("${ src }/Inter.woff") format("woff");
                    unicode-range:
                        U+00??, U+0131, U+0152-0153, U+02bb-02bc, U+02c6, U+02da, U+02dc, U+2000-206f,
                        U+2074, U+20ac, U+2122, U+2191, U+2193, U+2212, U+2215, U+feff, U+fffd;
                }
                `);
            }

            if(parseBool(Settings.simplify_chat))
                AddCustomCSSBlock('Simplify Chat', `.tt-visible-message-even { background-color: #8882 }`);

            Chat.get().map(Chat.defer.onmessage = async line => {
                let allNodes = node => (node.childNodes.length? [...node.childNodes].map(allNodes): [node]).flat();

                let element = await line.element;
                let keep = !(element.hasAttribute('data-plagiarism') || element.hasAttribute('data-repetitive') || element.hasAttribute('tt-hidden-message'));

                if(keep) {
                    element.classList.add(`tt-visible-message-${ ['even', 'odd'][SimplifyChatIndexToggle ^= 1] }`);

                    allNodes(element)
                        .filter(node => node.nodeName.equals('text'))
                        .map(text => text.nodeValue = text.nodeValue.normalize('NFKD'));
                }
            });
        };
        Timers.simplify_chat = -250;

        Unhandlers.simplify_chat = () => {
            ['Simplify Chat', 'Simplify Chat Monotone Usernames', 'Simplify Chat Font', 'Simplify Page Font', 'Simplify Font (Head)'].map(block => RemoveCustomCSSBlock(block));
        };

        __SimplifyChat__:
        // Always enabled
        if(true) {
            $remark("Applying readability settings...");

            RegisterJob('simplify_chat');
        }
    },
});
