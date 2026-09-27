/*** /plugins/automation/auto-badge.js
 * Auto-Badge.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'auto_badge',
    timer: -1000,

    /**
     * Adds broadcaster, moderator, and VIP badges to the Twitch chat autocomplete suggestions.
     */
    handler: () => {
        $('[data-a-target="chat-input"i]')?.addEventListener('keyup', delay(async event => {
            let { target, code, altKey, ctrlKey, metaKey, shiftKey } = event
                , value = (target?.value ?? target?.textContent ?? target?.innerText)
                , f = furnish;

            if(['Tab', 'Space', 'Enter', 'Escape'].contains(code) || !value?.contains('@'))
                return /* No username is present... */;

            const elements = $.all('[class*="autocomplete"i] button[data-a-target^="@"]')
                .isolate()
                .filter(defined);

            for(const element of elements) {
                const name = element.dataset.aTarget.slice(1);
                const p = $('p', element);

                // Broadcaster
                if(STREAMER.name.equals(name) && $.nullish('img[data-badge="owner"i]', p))
                    p.append(
                        f.img({
                            '@badge': 'owner',
                            src: Chat.badges.get('owner'),
                        })
                    );

                // Moderator
                if(Chat.mods.includes(name) && $.nullish('img[data-badge="mod"i]', p))
                    p.append(
                        f.img({
                            '@badge': 'mod',
                            src: Chat.badges.get('mod'),
                        })
                    );

                // VIP
                if(Chat.vips.includes(name) && $.nullish('img[data-badge="vip"i]', p))
                    p.append(
                        f.img({
                            '@badge': 'vip',
                            src: Chat.badges.get('vip'),
                        })
                    );
            }
        }, 100));
    },

    /**
     * Undoes auto-badge: Removes the added badges from the autocomplete suggestions.
     */
    unhandler: () => {
        $.all('[class*="autocomplete"i] button[data-a-target^="@"] img[data-badge]')
            .isolate()
            .filter(defined)
            .map(e => e.remove());
    },

    /**
     * Checks if the auto-badge feature is enabled in settings.
     * @returns {boolean} Whether the feature should be active
     */
    enabled() {
        return nullish(Settings.auto_badge) || parseBool(Settings.auto_badge);
    },

    /**
     * Setup: Registers the auto-badge job and applies custom CSS for the badges.
     */
    setup() {
        $remark("Adding username-suggestion badges...");

        RegisterJob('auto_badge');

        // Change the img's styling...
        AddCustomCSSBlock(`Username-Suggestion-Badges:${ new UUID }`, `
            img[data-badge] {
                display:inline-block;

                height:2rem;

                margin: 0 0 0 .75rem;
            }
        `);
    },
});
