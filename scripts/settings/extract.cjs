/*** /scripts/settings/extract.cjs
 * One-off converter (Phase 5): reads the hand-written settings.html in Chromium and writes its sections as
 * declarative settings (see docs/SETTINGS.md). Anything that isn't a known row shape is kept as `{ html }`.
 *
 *   CHROMIUM=/path/to/chrome node scripts/settings/extract.cjs src/settings.html out.json
 */

const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

// Runs inside the page: DOM → declarative settings
function extract() {
    // Every attribute of an element, minus the ones a row spells out itself
    const attrsOf = (element, skip = []) => {
        const attrs = {};

        for(const { name, value } of element.attributes)
            if(!skip.includes(name))
                attrs[name] = value;

        return Object.keys(attrs).length ? attrs : void null;
    };

    // `<input …>` → a setting; `value`/`checked` become its default
    const inputOf = (input, wrap = null) => {
        const { type = 'text' } = input;
        const setting = { type };

        if(type == 'checkbox' || type == 'radio')
            setting.default = input.hasAttribute('checked');
        else if(input.hasAttribute('value'))
            setting.default = type == 'number' || type == 'range' ? Number(input.getAttribute('value')) : input.getAttribute('value');

        const attrs = attrsOf(input, ['id', 'type', 'value', 'checked']);

        if(attrs)
            setting.attrs = attrs;

        if(wrap)
            setting.wrap = attrsOf(wrap) ?? {};

        return setting;
    };

    // `<select id=…><option …>…</option></select>` → a setting with options
    const selectOf = element => {
        const setting = { type: 'select', options: [] }
            , attrs = attrsOf(element, ['id']);

        for(const option of element.children) {
            const entry = { label: option.innerHTML.trim() }
                , optionAttrs = attrsOf(option, ['value', 'selected']);

            if(option.hasAttribute('value'))
                entry.value = option.getAttribute('value');
            if(option.hasAttribute('selected'))
                entry.default = true;
            if(optionAttrs)
                entry.attrs = optionAttrs;

            setting.options.push(entry);
        }

        if(attrs)
            setting.attrs = attrs;

        return setting;
    };

    // A paragraph's HTML, with inline inputs and selects lifted out as `{{id}}`
    const textOf = (element, inputs) => {
        const clone = element.cloneNode(true);

        for(const select of clone.querySelectorAll('select[id]')) {
            if(![...select.children].every(child => child.tagName == 'OPTION'))
                continue;

            inputs[select.id] = selectOf(element.querySelector(`#${ CSS.escape(select.id) }`));
            select.replaceWith(`{{${ select.id }}}`);
        }

        for(const input of clone.querySelectorAll('input[id]')) {
            const wrap = input.parentElement != clone && input.parentElement.tagName == 'SPAN' && input.parentElement.children.length == 1 && !input.parentElement.textContent.trim()
                ? input.parentElement
                : null;
            const original = element.querySelector(`#${ CSS.escape(input.id) }`);

            inputs[input.id] = inputOf(original, wrap);
            (wrap ?? input).replaceWith(`{{${ input.id }}}`);
        }

        return clone.innerHTML.trim().replace(/\s*\n\s*/g, ' ');
    };

    // `<div class=title>` → { title, tr, glyph, flags }
    const titleOf = element => {
        const title = {}
            , glyph = element.querySelector(':scope > span[glyph]:first-child');

        if(glyph) {
            title.glyph = glyph.getAttribute('glyph');

            const flags = [...glyph.attributes].map(({ name }) => name).filter(name => name != 'glyph');

            if(flags.length)
                title.flags = flags;
        }

        const clone = element.cloneNode(true);

        clone.querySelector(':scope > span[glyph]:first-child')?.remove();

        title.title = clone.innerHTML.trim();

        if(element.hasAttribute('tr-id'))
            title.tr = element.getAttribute('tr-id');

        const attrs = attrsOf(element, ['class', 'tr-id']);

        if(attrs)
            title.attrs = attrs;

        return title;
    };

    // The rows inside `.summary` or an extras panel
    const rowsOf = (container, inputs) => {
        const rows = [];

        for(const element of container.children) {
            const tag = element.tagName;

            // Toggle: <div class=toggle><input …><label for=…></label></div>
            if(true
                && tag == 'DIV'
                && element.className == 'toggle'
                && element.children.length == 2
                && element.children[0].matches('input[id]')
                && element.children[1].matches('label:empty')
                && element.children[1].getAttribute('for') == element.children[0].id
                && element.attributes.length == 1
                && element.children[1].attributes.length == 1
            ) {
                const input = element.children[0];

                inputs[input.id] = inputOf(input);
                rows.push({ toggle: input.id });

                continue;
            }

            // Text: <p tr-id …>
            if(tag == 'P' && !element.querySelector('textarea, details, div, select:not([id]), input:not([id])')) {
                const row = { text: textOf(element, inputs) }
                    , tr = element.getAttribute('tr-id')
                    , attrs = attrsOf(element, ['tr-id']);

                if(tr)
                    row.tr = tr;
                if(!element.hasAttribute('tr-id'))
                    row.tr = false;
                if(attrs)
                    row.attrs = attrs;

                rows.push(row);

                continue;
            }

            // Select: <select id=…><option …>…</option></select>
            if(tag == 'SELECT' && element.id && [...element.children].every(child => child.tagName == 'OPTION')) {
                inputs[element.id] = selectOf(element);
                rows.push({ select: element.id });

                continue;
            }

            // Choice: <div class=radio><input type=radio …><label for=…><h2>Title</h2> text</label></div>
            if(true
                && tag == 'DIV'
                && element.classList.contains('radio')
                && element.children.length == 2
                && element.children[0].matches('input[type=radio][id]')
                && element.children[1].matches('label')
                && element.children[1].firstElementChild?.tagName == 'H2'
            ) {
                const [input, label] = element.children
                    , heading = label.firstElementChild
                    , body = label.cloneNode(true);

                body.firstElementChild.remove();

                inputs[input.id] = inputOf(input);

                const row = { choice: input.id, title: heading.innerHTML.trim() }
                    , text = textOf(body, inputs)
                    , attrs = attrsOf(element, ['class'])
                    , headingAttrs = attrsOf(heading);

                if(text)
                    row.text = text;
                if(label.hasAttribute('tr-id'))
                    row.tr = label.getAttribute('tr-id');
                if(headingAttrs)
                    row.titleAttrs = headingAttrs;
                if(attrs)
                    row.attrs = attrs;

                rows.push(row);

                continue;
            }

            // Extras: <details><summary …>Title</summary><div>…rows…</div></details>
            if(true
                && tag == 'DETAILS'
                && element.children.length == 2
                && element.children[0].tagName == 'SUMMARY'
                && element.children[1].tagName == 'DIV'
            ) {
                const [summary, panel] = element.children;
                const row = { extras: { title: summary.innerHTML.trim() }, rows: [] };

                if(summary.hasAttribute('tr-id'))
                    row.extras.tr = summary.getAttribute('tr-id');
                if(summary.hasAttribute('subtitle'))
                    row.extras.subtitle = summary.getAttribute('subtitle');

                const summaryAttrs = attrsOf(summary, ['tr-id', 'subtitle'])
                    , attrs = attrsOf(element);

                const panelAttrs = attrsOf(panel);

                if(summaryAttrs)
                    row.extras.attrs = summaryAttrs;
                if(panelAttrs)
                    row.panelAttrs = panelAttrs;
                if(attrs)
                    row.attrs = attrs;

                row.rows = rowsOf(panel, inputs);
                rows.push(row);

                continue;
            }

            // Option: <div opt><div class=title>…</div><div class=summary>…rows…</div></div>
            if(true
                && tag == 'DIV'
                && element.hasAttribute('opt')
                && element.children.length == 2
                && element.children[0].matches('div.title')
                && element.children[1].matches('div.summary')
                && element.children[1].attributes.length == 1
            ) {
                const row = { option: titleOf(element.children[0]), rows: rowsOf(element.children[1], inputs) }
                    , attrs = attrsOf(element, ['opt']);

                if(attrs)
                    row.attrs = attrs;

                rows.push(row);

                continue;
            }

            // Anything else stays as written; its inputs still count as settings
            for(const input of element.matches('input[id], select[id], textarea[id]') ? [element] : element.querySelectorAll('input[id], select[id], textarea[id]'))
                if(input.id != 'search')
                    (inputs.__raw__ ??= []).push(input.id);

            rows.push({ html: element.outerHTML });
        }

        return rows;
    };

    // Keywords live in the comment before each section: `<!-- Title → a,b,c -->`
    const keywordsOf = section => {
        for(let node = section.previousSibling; node; node = node.previousSibling) {
            if(node.nodeType == Node.ELEMENT_NODE)
                return null;
            if(node.nodeType == Node.COMMENT_NODE)
                return node.data.includes('→') ? node.data.split('→').slice(1).join('→').trim() : null;
        }

        return null;
    };

    const groups = [];

    for(const header of document.querySelectorAll('body > header')) {
        const article = header.nextElementSibling
            , group = { header: header.innerHTML.trim(), sections: [] };

        if(header.hasAttribute('tr-id'))
            group.tr = header.getAttribute('tr-id');

        const headerAttrs = attrsOf(header, ['tr-id'])
            , articleAttrs = attrsOf(article);

        if(headerAttrs)
            group.headerAttrs = headerAttrs;
        if(articleAttrs)
            group.attrs = articleAttrs;

        for(const element of article.children) {
            if(element.tagName != 'SECTION' || element.children.length != 2 || !element.children[0].matches('div.title') || !element.children[1].matches('div.summary')) {
                group.sections.push({ html: element.outerHTML });

                continue;
            }

            const inputs = {}
                , section = { ...titleOf(element.children[0]) }
                , badges = attrsOf(element)
                , keywords = keywordsOf(element);

            if(badges)
                section.badges = badges;
            if(keywords)
                section.keywords = keywords;

            const summaryAttrs = attrsOf(element.children[1], ['class']);

            if(summaryAttrs)
                section.summaryAttrs = summaryAttrs;

            section.rows = rowsOf(element.children[1], inputs);

            const raw = inputs.__raw__;

            delete inputs.__raw__;

            section.settings = inputs;

            if(raw?.length)
                section.custom = raw;

            group.sections.push(section);
        }

        groups.push(group);
    }

    return groups;
}

(async() => {
    const [, , source = 'src/settings.html', output = 'settings.json'] = process.argv;
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM });
    const page = await browser.newPage();

    // Only the page itself; no scripts, so the markup is exactly as written
    await page.route('**/*', route => route.request().resourceType() == 'document' ? route.continue() : route.abort());
    await page.goto('file://' + path.resolve(source));

    const groups = await page.evaluate(extract);

    fs.writeFileSync(output, JSON.stringify(groups, null, 4));
    await browser.close();
})();
