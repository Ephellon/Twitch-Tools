/*** /plugins/automation/auto-badge.js
 * Auto-Badge.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'auto_badge',

    async install() {
        Handlers.auto_badge = () => {
            $('[data-a-target="chat-input"i]')?.addEventListener('keyup', delay(async event => {
                let { target, code, altKey, ctrlKey, metaKey, shiftKey } = event,
                    value = (target?.value ?? target?.textContent ?? target?.innerText),
                    f = furnish;

                if(['Tab', 'Space', 'Enter', 'Escape'].contains(code) || !value?.contains('@'))
                    return /* No username is present... */;

                let elements = $.all('[class*="autocomplete"i] button[data-a-target^="@"]')
                    .isolate()
                    .filter(defined);

                for(let element of elements) {
                    let name = element.dataset.aTarget.slice(1);
                    let p = $('p', element);

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
        };
        Timers.auto_badge = -1000;

        Unhandlers.auto_badge = () => {
            $.all('[class*="autocomplete"i] button[data-a-target^="@"] img[data-badge]')
                .isolate()
                .filter(defined)
                .map(e => e.remove());
        };

        __AutoBadge__:
        // On by Default (ObD; v5.33.4.11)
        if(nullish(Settings.auto_badge) || parseBool(Settings.auto_badge)) {
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
        }
    },
});
