/*** /scripts/settings/write.cjs
 * One-off (Phase 5): writes extract.cjs's output as settings modules, one per section, beside the plugin
 * that owns it (or in src/settings/sections/), plus src/settings/layout.js.
 *
 *   node scripts/settings/write.cjs settings.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const [, , input = 'settings.json'] = process.argv;
const groups = JSON.parse(fs.readFileSync(input, 'utf8'));

// Sections whose settings no plugin reads directly, or that a weak match would misplace
const OVERRIDES = {
    'Accent Color': null,
    'Low Data Usage': null,
    'Display Statistics': null,
    'Next Channel': null,
};

const SAVE = /^<section save="" tr-id="save">\s*<button class="ripple save">Save<\/button>\s*<\/section>$/;

// Who owns which setting: plugin ids/jobs first, then the plugin that reads the setting most
const plugins = execSync('find src/plugins -name "*.js" ! -name "index.js" ! -name "*.settings.js"').toString().trim().split('\n');
const owners = {}, readers = {};

for(const file of plugins) {
    const text = fs.readFileSync(file, 'utf8');

    for(const [, id] of text.matchAll(/^\s{4}(?:id|job):\s*'([^']+)'/gm))
        (owners[id.replace(/^\w+\./, '')] ??= []).push(file);

    for(const [, id] of text.matchAll(/Settings\.(\w+)/g))
        (readers[id] ??= {})[file] = (readers[id]?.[file] | 0) + 1;
}

/**
 * Finds the plugin file that owns a section, if any.
 * @param {Object} section - An extracted section
 * @returns {string|null} The plugin's path
 */
function ownerOf(section) {
    const title = plain(section.title);

    if(title in OVERRIDES)
        return OVERRIDES[title];

    const ids = [...Object.keys(section.settings), ...(section.custom ?? [])];

    for(const id of ids)
        if(owners[id])
            return owners[id][0];

    const counts = {};

    for(const id of ids)
        for(const file in readers[id] ?? {})
            counts[file] = (counts[file] | 0) + readers[id][file];

    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
}

/**
 * Strips markup and entities from a title.
 * @param {string} html - Title markup
 * @returns {string} Plain text
 */
function plain(html) {
    return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
}

/**
 * A file-name slug for a title.
 * @param {string} title - The title
 * @returns {string} The slug
 */
function slug(title) {
    return plain(title).toLowerCase().replace(/&/g, 'and').replace(/[^a-z\d]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Rewrites the tags in serialized markup the way the page was written: bare boolean attributes, single-quoted values.
 * @param {string} html - Markup from the DOM
 * @returns {string} The same markup, hand-style
 */
function handStyle(html) {
    return html.replace(/<[a-z][^>]*>/gi, tag => tag
        .replace(/ ([\w:@-]+)=""/g, ' $1')
        .replace(/ ([\w:@-]+)="([^"']*)"/g, ($0, $1, $2, $$, $_) => ` ${ $1 }='${ $2.replace(/&quot;/g, '"') }'`)
    );
}

// Reading order for a section's fields
const ORDER = ['toggle', 'select', 'choice', 'extras', 'option', 'title', 'tr', 'glyph', 'flags', 'text', 'titleAttrs', 'badges', 'keywords', 'summaryAttrs', 'type', 'default', 'value', 'label', 'group', 'min', 'max', 'step', 'unit', 'placeholder', 'store', 'options', 'attrs', 'panelAttrs', 'wrap', 'rows', 'settings', 'custom'];

/**
 * Serializes a value as a JavaScript literal (house style is applied afterwards by `npm run format`).
 * @param {*} value - The value
 * @param {string} [indent=''] - The current indentation
 * @returns {string} The literal
 */
function literal(value, indent = '') {
    const inner = indent + '    ';

    if(typeof value == 'string') {
        value = handStyle(value);

        // Markup kept as written reads best with its line breaks
        if(value.includes('\n'))
            return '`' + value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';

        return JSON.stringify(value);
    }

    // Short lists of plain values stay on one line
    if(Array.isArray(value) && value.every(item => typeof item != 'object') && JSON.stringify(value).length < 60)
        return `[${ value.map(item => literal(item, inner)).join(', ') }]`;

    if(Array.isArray(value))
        return value.length ? `[\n${ value.map(item => inner + literal(item, inner)).join(',\n') },\n${ indent }]` : '[]';

    if(value && typeof value == 'object') {
        const keys = Object.keys(value).sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));

        if(!keys.length)
            return '{}';

        return `{\n${ keys.map(key => `${ inner }${ /^[A-Za-z_$][\w$]*$/.test(key) ? key : `'${ key }'` }: ${ literal(value[key], inner) }`).join(',\n') },\n${ indent }}`;
    }

    return JSON.stringify(value);
}

/**
 * Lifts common input attributes into plain fields: `min`, `max`, `step`, `placeholder`, `group` (radio name), `unit`.
 * @param {Object} settings - A section's settings
 */
function tidy(settings) {
    for(const id in settings) {
        const setting = settings[id]
            , attrs = setting.attrs ?? {};

        for(const key of ['min', 'max', 'step'])
            if(key in attrs && attrs[key] !== '' && Number.isFinite(Number(attrs[key]))) {
                setting[key] = Number(attrs[key]);
                delete attrs[key];
            }

        if('placeholder' in attrs) {
            setting.placeholder = attrs.placeholder;
            delete attrs.placeholder;
        }

        if('name' in attrs && setting.type == 'radio') {
            setting.group = attrs.name;
            delete attrs.name;
        }

        if(setting.wrap && Object.keys(setting.wrap).length == 1 && 'unit' in setting.wrap) {
            setting.unit = setting.wrap.unit;
            delete setting.wrap;
        }

        if(!Object.keys(attrs).length)
            delete setting.attrs;
    }
}

// What settings.js saves today (its hand-kept list); commented-out entries don't count
const USABLE = new Set([...fs.readFileSync('src/settings.js', 'utf8').match(/usable_settings = \[([^\]]+)\]/)[1]
    .split('\n').filter(line => !/^\s*\/\//.test(line)).join('\n').matchAll(/'([^']+)'/g)].map(([, id]) => id));

// Saved values with no control of their own and no section: kept by the layout
const STORED = ['clientID', 'oauthToken'];

/**
 * Declares the section's custom widgets (markup kept as written) and marks helper inputs that aren't saved.
 * @param {Object} section - An extracted section
 */
function classify(section) {
    const markup = JSON.stringify(section.rows);

    // Elements a custom widget stores its value on: `id='…'` in kept markup or on a panel
    for(const [, id] of markup.matchAll(/(?:id=\\?["']?|"id":")([\w-]+)/g))
        if(USABLE.has(id) && !(id in section.settings))
            section.settings[id] = { type: 'custom' };

    for(const id of section.custom ?? [])
        if(!(id in section.settings))
            section.settings[id] = { type: 'custom' };

    delete section.custom;

    for(const id in section.settings)
        if(!USABLE.has(id))
            section.settings[id].store = false;
}

const layout = [], imports = [], used = new Set();

// Sections that match their plugin by id claim `<plugin>.settings.js` first
for(const group of groups)
    for(const section of group.sections)
        if(!section.html && Object.keys(section.settings).some(id => owners[id]?.[0] == ownerOf(section)))
            section.direct = true;

for(const group of groups) {
    const entry = { header: group.header, tr: group.tr, headerAttrs: group.headerAttrs, attrs: group.attrs, save: false, sections: [], footer: void 0 };

    for(const section of group.sections) {
        if(section.html) {
            if(SAVE.test(section.html.trim()))
                entry.save = true;
            else
                entry.footer = section.html;

            continue;
        }

        const owner = ownerOf(section);
        let file = owner
            ? owner.replace(/\.js$/, '.settings.js')
            : `src/settings/sections/${ slug(section.title) }.js`;

        // A plugin's second section (e.g. its placement under Customization) is named after its title
        const claimed = owner && groups.some(({ sections }) => sections.some(other => other != section && other.direct && ownerOf(other) == owner));

        if(used.has(file) || (owner && !section.direct && claimed))
            file = file.replace(/(\.settings)?\.js$/, `.${ slug(section.title) }$1.js`);

        delete section.direct;
        tidy(section.settings);
        classify(section);

        used.add(file);

        const name = slug(section.title).replace(/-(\w)/g, ($0, $1, $$, $_) => $1.toUpperCase()) + (imports.length + 1);
        const relative = path.relative('src/settings', file).replace(/\\/g, '/');

        imports.push(`import ${ name } from '${ relative.startsWith('.') ? relative : './' + relative }';`);
        entry.sections.push(name);

        const header = `/*** /${ path.relative('src', file).replace(/\\/g, '/') }\n * Settings for "${ plain(section.title) }" (${ plain(group.header) }).\n */\n\n`;

        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, `${ header }export default ${ literal(section) };\n`);
    }

    layout.push(entry);
}

layout.at(-1).stored = STORED;

const body = layout.map(({ sections, ...group }) => {
    const fields = Object.entries(group).filter(([, value]) => value !== void 0 && value !== false)
        .map(([key, value]) => `        ${ key }: ${ literal(value, '        ') },`);

    return `    {\n${ fields.join('\n') }\n        sections: [\n${ sections.map(name => `            ${ name },`).join('\n') }\n        ],\n    },`;
}).join('\n');

fs.writeFileSync('src/settings/layout.js', `/*** /settings/layout.js
 * The Settings page: its groups, in order, and the sections in each. Each section is declared beside the
 * plugin it configures (\`<plugin>.settings.js\`) or, for page-level settings, in \`settings/sections/\`.
 */

${ imports.join('\n') }

export default [
${ body }
];
`);

console.log(`${ imports.length } sections written`);
