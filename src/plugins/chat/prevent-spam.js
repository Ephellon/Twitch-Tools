/*** /plugins/chat/prevent-spam.js
 * Prevent spam.
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let SPAM;

plugin({
    id: 'chat.prevent_spam',
    job: 'prevent_spam',
    timer: -1000,

    /**
     * Initializes the spam tracking list.
     */
    init() {
        SPAM = [];
    },

    /**
     * Runs every tick: Monitors chat messages for plagiarism or repetitive patterns and marks them as spam.
     * @param {Object} context - The plugin context
     */
    handler: (context) => {
        new context.StopWatch('prevent_spam');

        /**
         * Replaces a chat message with a spam notice and adds a descriptive tooltip.
         * @param {Element} element - The chat message element
         * @param {string} [type='spam'] - The category of spam
         * @param {string} message - The original message content
         * @param {string} [phrase=''] - The specific repetitive phrase found
         */
        function markAsSpam(element, type = 'spam', message, phrase = '') {
            const spam_placeholder = 'chat-deleted-message-placeholder';
            const span = furnish(`span.chat-line__message--deleted-notice.tt-spam-filter-${ type }[@aTarget=${ spam_placeholder }][@testSelector=${ spam_placeholder }]`).with(`message marked as ${ type }.`);

            $.all(':is([data-test-selector="chat-message-separator"i], [class*="username-container"i] + *) ~ * > *', element).forEach(sibling => sibling.remove());
            $('[data-test-selector="chat-message-separator"i], [class*="username-container"i] + *', element).parentElement.append(span);

            element.dataset[type] = message;

            if(phrase.length > 1) {
                element.setAttribute(`${ type }-phrase`, phrase);
                message = message.replace(RegExp(phrase.replace(/\W/g, '\\$&'), 'ig'), `<del>${ phrase }</del>`);
            }

            new Tooltip(element, message, { direction: 'up', fit: true });
        }

        /**
         * Checks if a message should be flagged as plagiarism or repetitive based on provided thresholds.
         * @param {Element} element - The chat message element
         * @param {string} message - The message text
         * @param {string} author - The message author
         * @param {number} lookBack - Number of recent messages to check for plagiarism
         * @param {number} minLen - Minimum length of a phrase to be considered repetitive
         * @param {number} minOcc - Minimum occurrences of a phrase to be considered repetitive
         * @returns {Promise<string>} The original message
         */
        async function spamChecker(element, message, author, lookBack, minLen, minOcc) {
            if(message.length < 1 || RegExp(`^${ context.USERNAME }$`, 'i').test(author))
                return message;

            // The same message is already posted (within X lines)
            if(SPAM.slice(-lookBack).contains(message))
                markAsSpam(await element, 'plagiarism', message);

            // The message contains repetitive (more than X instances) words/phrases
            const regexp = RegExp(`(?<phrase>[\\S]{${ minLen },}?)${ '(?:(?:[^]+)?\\1)'.repeat(minOcc - 1) }`, 'i');

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
    },

    /**
     * Sets up the spam filter event listener.
     */
    setup() {
        $remark("Adding spam event listener...");
    },
});
