/*** /plugins/video-recovery/private-viewing.js
 * Private Viewing - NOT A SETTING. Create a "private viewing" button for live, searched streams.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'private_viewing',

    async install() {
        setInterval(() => {
            $.all('.search-tray [role="cell"i] [data-a-target="nav-search-item"i]')
                .map(element => {
                    let [thumbnail, searchTerm] = element.children;
                    let image = $('img', thumbnail)?.src,
                        name = searchTerm.textContent.trim(),
                        live = $.defined('[data-test-selector="live-badge"i]', element);

                    if(!live)
                        return;

                    let f = furnish;
                    let button = $('[tt-pip]', element.closest('[role]'));

                    if(defined(button))
                        return;

                    let anchor = element.closest('[href]');

                    anchor.modStyle('display:inline-block;width:calc(100% - 5rem)');
                    anchor.insertAdjacentElement('afterend', f(`button[tt-pip]`, {
                        name, live, image,

                        onmousedown({ currentTarget }) {
                            MiniPlayer = currentTarget.getAttribute('name');
                        },

                        innerHTML: Glyphs.modify('picture_in_picture', { height: 20, width: 20, fill: 'currentcolor', style: 'vertical-align:middle' }),
                    }));
                });
        }, 300);
    },
});
