/*** /plugins/chat/prevent-spam.js
 * Prevent spam.
 * Moved verbatim from chat.js (Chat__Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.prevent_spam',

    async install(context) {
        let SPAM = [];

        Handlers.prevent_spam = () => {
            new context.StopWatch('prevent_spam');

            function markAsSpam(element, type = 'spam', message, phrase = '') {
                let spam_placeholder = "chat-deleted-message-placeholder";
                let span = furnish(`span.chat-line__message--deleted-notice.tt-spam-filter-${ type }[@aTarget=${ spam_placeholder }][@testSelector=${ spam_placeholder }]`).with(`message marked as ${ type }.`);

                $.all(':is([data-test-selector="chat-message-separator"i], [class*="username-container"i] + *) ~ * > *', element).forEach(sibling => sibling.remove());
                $('[data-test-selector="chat-message-separator"i], [class*="username-container"i] + *', element).parentElement.append(span);

                element.dataset[type] = message;

                if(phrase.length > 1) {
                    element.setAttribute(`${ type }-phrase`, phrase);
                    message = message.replace(RegExp(phrase.replace(/\W/g, '\\$&'), 'ig'), `<del>${ phrase }</del>`);
                }

                new Tooltip(element, message, { direction: 'up', fit: true });
            }

            async function spamChecker(element, message, author, lookBack, minLen, minOcc) {
                if(message.length < 1 || RegExp(`^${ context.USERNAME }$`, 'i').test(author))
                    return message;

                // The same message is already posted (within X lines)
                if(SPAM.slice(-lookBack).contains(message))
                    markAsSpam(await element, 'plagiarism', message);

                // The message contains repetitive (more than X instances) words/phrases
                let regexp = RegExp(`(?<phrase>[\\S]{${ minLen },}?)${ "(?:(?:[^]+)?\\1)".repeat(minOcc - 1) }`, 'i');

                if(regexp.test(message))
                    markAsSpam(await element, 'repetitive', message, regexp.exec(message).groups.phrase);

                return message;
            }

            Chat.get().map(Chat.onmessage = async line => {
                // If not run asynchronously, `SPAM = ...` somehow runs before `spamChecker` and causes all messages to be marked as plagiarism
                SPAM = [
                    ...SPAM,
                    await spamChecker(
                        line.element,
                        line.message,
                        line.author,
                        parseInt(Settings.prevent_spam_look_back ?? 15),
                        parseInt(Settings.prevent_spam_minimum_length ?? 3),
                        parseInt(Settings.prevent_spam_ignore_under ?? 5)
                    )
                ].isolate();
            });

            context.StopWatch.stop('prevent_spam');
        };
        Timers.prevent_spam = -1000;

        __PreventSpam__:
        if(parseBool(Settings.prevent_spam)) {
            $remark("Adding spam event listener...");

            RegisterJob('prevent_spam');
        }
    },
});
