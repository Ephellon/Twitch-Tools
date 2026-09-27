/*** /plugins/automation/not-implemented.js
 * @notImplemented.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'not_implemented',

    /**
     * Installs the phone number parsing and common phrase translation features, registering their respective handlers and timers.
     */
    async install() {
        Handlers.phone_number = () => {
            const syntax = /(?<countryCode>\+?\d{1,3})?[\s\.\-\(]?(?<areaCode>\d{3})?[\)\.\-\s]?(?<officeCode>\d{3})[\s\.\-]?(?<lineNumber>\d{1,4})/;
        };

        Timers.phone_number = 250;

        __PhoneNumber__:
        if(parseBool(Settings.phone_number)) {
            $remark("Parsing phone numbers...");

            RegisterJob('phone_number');
        }

        /***
         *       _____                                        _____  _                          _______                  _       _   _
         *      / ____|                                      |  __ \| |                        |__   __|                | |     | | (_)
         *     | |     ___  _ __ ___  _ __ ___   ___  _ __   | |__) | |__  _ __ __ _ ___  ___     | |_ __ __ _ _ __  ___| | __ _| |_ _  ___  _ __  ___
         *     | |    / _ \| '_ ` _ \| '_ ` _ \ / _ \| '_ \  |  ___/| '_ \| '__/ _` / __|/ _ \    | | '__/ _` | '_ \/ __| |/ _` | __| |/ _ \| '_ \/ __|
         *     | |___| (_) | | | | | | | | | | | (_) | | | | | |    | | | | | | (_| \__ \  __/    | | | | (_| | | | \__ \ | (_| | |_| | (_) | | | \__ \
         *      \_____\___/|_| |_| |_|_| |_| |_|\___/|_| |_| |_|    |_| |_|_|  \__,_|___/\___|    |_|_|  \__,_|_| |_|___/_|\__,_|\__|_|\___/|_| |_|___/
         *
         *
         */
        Handlers.common_phrase_translations = () => {
            const translations = [
                [/(Twitch|T.?T.?V|The)(.?s)?\s+(T\W?o\W?S\W?|Terms(?:.+of.+Service)?)/i, [`<a href="/legal/terms-of-service/" target="_blank">$&</a>`, e => defined(e.closest('[href]'))]], // Twitch's ToS
            ];

            for(const [phrases, [replacement, ignoreIf]] of translations)
                for(const element of $.getAllElementsByText(phrases)) {
                    if(element != element.getElementByText(phrases))
                        continue; // Not lowest child
                    if(ignoreIf(element))
                        continue; // Already within a link...

                    element.innerHTML = element.innerHTML.replace(phrases, replacement);
                }
        };

        Timers.common_phrase_translations = 250;

        __CommonPhraseTranslations__:
        if(true) {
            RegisterJob('common_phrase_translations')
        }
    },
});
