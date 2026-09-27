/*** /plugins/clips/save-ttv-clips.js
 * Video Clips.
 * Moved from clips.js (Clips__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'clips.save_ttv_clips',
    job: 'save_ttv_clips',
    timer: -500,

    handler: () => {
        const EDITOR_MODE = location.pathname.equals('/create');
        const { src } = $('video');
        let title, author, original, textContainer, placeBefore, carryQuery;

        if(EDITOR_MODE) {
            title = new ClipName(2);
            author = window.USERNAME ?? $('[data-a-target="user-display-name"i]')?.textContent ?? '';

            original = $(carryQuery = '[data-a-target*="label"i][data-a-target*="text"i]')?.closest('[style]');
            placeBefore = original;

            if(nullish(original))
                return;

            $notice("Clip editor mode.");
        } else {
            const [streamerInfo,, clipInfo] = $.all('[class*="clip"i][class*="info"i]');
            let [views, meta] = clipInfo.children;
            const [clipTitle, data] = meta.children;
            let [timestamp, clipAuthor] = $.queryBy('span, a', data);

            views = parseInt(views.textContent.replace(/\D+/g, ''));
            title = clipTitle.innerText;
            timestamp = -parseTime(timestamp.innerText);
            author = clipAuthor.innerText;

            original = $('[class*="social"i][class*="button"i]:is([class*="copy"i], [class*="clip"i])').closest('[class*="social"i]:not(button, [class*="icon"i])').parentElement;
            placeBefore = original.parentElement.lastElementChild;
            carryQuery = '.tw-tooltip';

            $notice("Clip data!", { src, views, title, timestamp, author });
        }

        const { filename } = parseURL(src);
        let [ext, ...name] = filename.split('.').reverse();
        name = name.join('.');

        const parent = original.parentElement;
        const container = original.cloneNode(true);
        const button = $('button', container);
        const id = 'tt_download_link';

        for(const child of $.all('[class*="clip"i]', container))
            for(const key of child.classList)
                child.classList.replace(key, key.replaceAll('clip', 'download'));

        textContainer ??= $(carryQuery, container);

        button.parentElement.setAttribute('aria-describedby', textContainer.id = id);

        textContainer.innerText = `Download this clip`;

        if(EDITOR_MODE)
            textContainer.innerHTML = furnish(`a#tt-download__${ author.replace(/\W+/g, '') }__${ title.replace(/\W+/g, '_') }`, { href: src, download: title, style: `color:inherit!important` }, 'Download').outerHTML;
        else
            $('figure', button)?.replaceWith(furnish(`a#tt-download__${ author.replace(/\W+/g, '') }__${ title.replace(/\W+/g, '_') }`, { href: src, download: title }, Glyphs.utf8.download));

        parent.insertBefore(container, placeBefore);
    },

    enabled() {
        return true || parseBool(Settings?.save_ttv_clips);
    },
});
