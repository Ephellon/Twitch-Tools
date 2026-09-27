/*** /settings/render.js
 * Turns declarative settings (docs/SETTINGS.md) into the Settings page's markup.
 * Every row kind renders the same markup the page was hand-written with, so settings.js and settings.css work unchanged.
 */

/**
 * Escapes text for use inside a double-quoted attribute.
 * @param {*} value - The attribute value
 * @returns {string} The escaped value
 */
const escapeAttribute = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * Serializes an attribute map; `''` renders a bare attribute.
 * @param {Object} [attrs={}] - Attribute names and values
 * @returns {string} The attributes, each with a leading space
 */
export function attributes(attrs = {}) {
    let html = '';

    for(const name in attrs) {
        const value = attrs[name];

        if(value === false || value == null)
            continue;

        html += value === '' || value === true ? ` ${ name }` : ` ${ name }="${ escapeAttribute(value) }"`;
    }

    return html;
}

/**
 * Renders one setting's control: an input (optionally wrapped, e.g. in a unit span) or a select.
 * @param {string} id - The setting's id
 * @param {Object} setting - The setting's definition
 * @returns {string} The control's markup
 */
export function control(id, setting) {
    if(setting == null)
        throw new Error(`Setting "${ id }" is used but not defined`);

    if(setting.type == 'select') {
        const options = setting.options.map(({ label, value, default: selected, attrs }) =>
            `<option${ attributes({ value, ...attrs, selected: selected ? '' : null }) }>${ label }</option>`
        ).join('');

        return `<select${ attributes({ id, ...setting.attrs }) }>${ options }</select>`;
    }

    const { type, default: value, group: name, min, max, step, placeholder, unit, attrs, wrap = unit ? { unit } : null } = setting;
    const toggled = type == 'checkbox' || type == 'radio';
    const input = `<input${ attributes({ id, type, name, min, max, step, placeholder, ...(toggled ? {} : { value }), ...attrs, ...(toggled && value ? { checked: '' } : {}) }) }>`;

    return wrap ? `<span${ attributes(wrap) }>${ input }</span>` : input;
}

/**
 * Replaces `{{id}}` placeholders in text with their controls.
 * @param {string} text - Row text (HTML)
 * @param {Object} settings - The section's settings
 * @returns {string} The text with controls in place
 */
function fill(text, settings) {
    return text.replace(/\{\{([\w\-:]+)\}\}/g, ($0, $1, $$, $_) => control($1, settings[$1]));
}

/**
 * Renders a title bar: glyph, then title.
 * @param {Object} title - `{ title, tr, glyph, flags, attrs }`
 * @returns {string} The `.title` markup
 */
function titleBar({ title, tr, glyph, flags = [], attrs }) {
    const icon = glyph ? `<span${ attributes(Object.fromEntries(flags.map(flag => [flag, '']))) } glyph="${ escapeAttribute(glyph) }"></span> ` : '';

    return `<div class="title"${ attributes({ 'tr-id': tr, ...attrs }) }>${ icon }${ title }</div>`;
}

/**
 * Renders a list of rows.
 * @param {Array<Object>} rows - The rows
 * @param {Object} settings - The section's settings
 * @returns {string} The rows' markup
 */
export function renderRows(rows, settings) {
    return rows.map(row => {
        // Kept as written (custom widgets)
        if('html' in row)
            return row.html;

        if('toggle' in row) {
            const id = row.toggle;

            return `<div class="toggle">${ control(id, settings[id]) }<label for="${ id }"></label></div>`;
        }

        if('select' in row)
            return control(row.select, settings[row.select]);

        if('choice' in row) {
            const id = row.choice;

            return `<div class="radio"${ attributes(row.attrs) }>${ control(id, settings[id]) }<label${ attributes({ 'tr-id': row.tr, for: id }) }><h2${ attributes(row.titleAttrs) }>${ row.title }</h2> ${ fill(row.text ?? '', settings) }</label></div>`;
        }

        if('text' in row) {
            const tr = row.tr === false ? null : (row.tr ?? '');

            return `<p${ attributes({ ...row.attrs, 'tr-id': tr }) }>${ fill(row.text, settings) }</p>`;
        }

        if('extras' in row) {
            const { title, tr, subtitle, attrs } = row.extras;

            return `<details${ attributes(row.attrs) }><summary${ attributes({ 'tr-id': tr, subtitle, ...attrs }) }>${ title }</summary><div${ attributes(row.panelAttrs) }>${ renderRows(row.rows, settings) }</div></details>`;
        }

        if('option' in row)
            return `<div opt${ attributes(row.attrs) }>${ titleBar(row.option) }<div class="summary">${ renderRows(row.rows, settings) }</div></div>`;

        throw new Error(`Unknown settings row: ${ JSON.stringify(row).slice(0, 80) }`);
    }).join('');
}

/**
 * Renders one section (one feature's settings).
 * @param {Object} section - The section definition
 * @returns {string} The `<section>` markup
 */
export function renderSection(section) {
    if('html' in section)
        return section.html;

    const { badges, summaryAttrs, rows, settings = {} } = section;

    return `<section${ attributes(badges) }>${ titleBar(section) }<div class="summary"${ attributes(summaryAttrs) }>${ renderRows(rows, settings) }</div></section>`;
}

/**
 * Renders the whole page: a header and an article per group, each ending with its Save button.
 * @param {Array<Object>} groups - The layout
 * @returns {string} The page's markup
 */
export function renderLayout(groups) {
    return groups.map(({ header, tr, headerAttrs, attrs, save, footer = '', sections }) => {
        const saveButton = save ? `<section save tr-id="save"><button class="ripple save">Save</button></section>` : '';

        return `<header${ attributes({ 'tr-id': tr, ...headerAttrs }) }>${ header }</header><article${ attributes(attrs) }>${ sections.map(renderSection).join('') }${ saveButton }${ footer }</article>`;
    }).join('');
}

/**
 * Lists every setting a layout defines, in page order.
 * @param {Array<Object>} groups - The layout
 * @returns {Array<string>} Setting ids
 */
export function settingIds(groups) {
    return groups.flatMap(({ sections, stored = [] }) => [
        ...sections.flatMap(({ settings = {} }) => Object.keys(settings).filter(id => settings[id].store !== false)),
        ...stored,
    ]);
}

/**
 * Collects every setting's default value.
 * @param {Array<Object>} groups - The layout
 * @returns {Object} Setting ids mapped to their defaults
 */
export function settingDefaults(groups) {
    const defaults = {};

    for(const { sections } of groups)
        for(const { settings = {} } of sections)
            for(const id in settings) {
                const setting = settings[id];

                if(setting.store === false)
                    continue;

                if(setting.type == 'select')
                    defaults[id] = (setting.options.find(option => option.default) ?? setting.options[0])?.value ?? null;
                else if('default' in setting)
                    defaults[id] = setting.default;
            }

    return defaults;
}
