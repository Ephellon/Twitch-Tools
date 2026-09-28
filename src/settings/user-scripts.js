/*** /settings/user-scripts.js
 * The "User Scripts" group of the Settings page: install, edit, approve and remove `.ttv` scripts (TTV DSL), and show
 * each script's own settings. The chat frames run them (src/lib/user-scripts.js).
 */

import { renderSection, settingDefaults } from './render.js';
import { grantsOf, SCRIPTS_KEY, CONSENT_KEY } from '../lib/user-scripts.js';

const STORAGE = (globalThis.browser ?? globalThis.chrome)?.storage?.local;

// The starter script: what the language can do, in a few lines
export const TEMPLATE = [
    'plugin hello_bot -- "Hello Bot"',
    '    about "Replies when someone says !hello, waves on !bye, and remembers who it greeted last."',
    '    setting reply: text "Hi there!" -- "Reply with the following"',
    '    setting reminders: checkbox true -- "Remind chat every 15 minutes"',
    '',
    '// Chat commands',
    'await (.command is SOMETHING)',
    '    when .command is',
    '        "hello":',
    '            // `!hello @zip` greets zip; a bare `!hello` replies to whoever asked',
    '            if .argument is SOMETHING',
    '                POST `${ setting.reply } ${ .argument }`',
    '            else',
    '                REPLY setting.reply',
    '',
    '            // Remembered for `!who` below',
    '            .sender -> last_greeted',
    '',
    '        "bye":',
    '            // A different goodbye each time',
    '            REPLY any from (',
    '                `See you later!`',
    '                `Thanks for stopping by 💜`',
    '                `Take care!`',
    '            )',
    '',
    '        "who":',
    '            if last_greeted is SOMETHING',
    '                REPLY `The last person I said hi to was ${ last_greeted }.`',
    '            else',
    '                REPLY `Nobody has said !hello yet. Be the first!`',
    '',
    '// Moderators get a salute when they say hello',
    'await (.command is "hello")',
    '    using [moderator]',
    '        POST `🛡️ ${ .sender } is on duty.`',
    '',
    '// Every 15 minutes, but only while the stream is live',
    'await 15:00 with (#live is true)',
    '    if setting.reminders',
    "        POST `Type !hello and I'll say hi 🤖`",
    '',
].join('\n');

/**
 * Reads extension storage.
 * @param {Array<string>} keys - The keys to read
 * @returns {Promise<Object>} The stored values
 */
const read = keys => new Promise(resolve => STORAGE.get(keys, resolve));

/**
 * Writes extension storage.
 * @param {Object} values - The values to store
 * @returns {Promise<void>}
 */
const write = values => new Promise(resolve => STORAGE.set(values, resolve));

/**
 * Escapes text for HTML.
 * @param {*} text - The text
 * @returns {string} Safe HTML
 */
/**
 * Asks a yes/no question. The page's `confirm` remembers answers by message, so each question is made unique.
 * @param {string} html - The question
 * @returns {Promise<boolean>} The answer
 */
const ask = async html => !!(await confirm(`${ html }<!-- ${ Date.now() } -->`));

const escape = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Inspects every installed script.
 * @param {Array<Object>} scripts - `[{ file, source }]`
 * @returns {Array<Object>} `[{ file, source, meta, diagnostics }]`
 */
function inspectAll(scripts) {
    return scripts.map(({ file, source }) => ({ file, source, ...TTV_DSL.inspect(source, { file }) }));
}

/**
 * A script's state, for the manager list.
 * @param {Object} script - An inspected script
 * @param {Object} consent - `user_scripts__consent`
 * @returns {{ label: string, kind: string }} What to show
 */
function statusOf(script, consent) {
    const required = grantsOf(script.meta.permissions);

    if(script.diagnostics.length)
        return { label: `${ script.diagnostics.length } problem${ script.diagnostics.length > 1 ? "s" : "" }`, kind: 'error' };

    if(required && consent[script.meta.id] !== required)
        return { label: "Needs approval", kind: 'warning' };

    return { label: "Ready", kind: 'ok' };
}

/**
 * Renders the highlighted copy of the editor's text.
 * @param {string} source - The script
 * @returns {string} HTML spans
 */
function highlighted(source) {
    return TTV_DSL.highlight(source).map(({ type, text }) => `<span class="ttv-dsl-${ type }">${ escape(text) }</span>`).join('') + '\n';
}

/**
 * Opens the script editor.
 * @param {Object} options - `{ source, file, original, taken }`: the text, its file name, the id being edited (if any),
 * and ids already in use (built-in settings and other scripts)
 * @returns {Promise<Object|null>} `{ file, source }` when saved, `null` when cancelled
 */
function openEditor({ source, file, original, taken }) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');

        overlay.id = 'user-script-editor';
        overlay.innerHTML = `
            <div class="user-script-editor--dialog" role="dialog" aria-label="Script editor">
                <div class="user-script-editor--head"><strong>${ escape(file) }</strong><span class="user-script-editor--meta"></span></div>
                <div class="user-script-editor--code">
                    <div class="user-script-editor--gutter" aria-hidden="true"></div>
                    <pre aria-hidden="true"></pre>
                    <textarea spellcheck="false" autocomplete="off" autocapitalize="off"></textarea>
                </div>
                <ul class="user-script-editor--problems"></ul>
                <div class="user-script-editor--actions"><button class="user-script-editor--cancel">Cancel</button><button class="user-script-editor--save">Save</button></div>
            </div>`;

        const textarea = overlay.querySelector('textarea')
            , pre = overlay.querySelector('pre')
            , gutter = overlay.querySelector('.user-script-editor--gutter')
            , problems = overlay.querySelector('.user-script-editor--problems')
            , meta = overlay.querySelector('.user-script-editor--meta')
            , save = overlay.querySelector('.user-script-editor--save');

        let timer = null, faulty = new Set;

        // Line numbers, one per line of text; lines with a problem are marked
        const number = () => {
            const count = textarea.value.split('\n').length;

            gutter.innerHTML = Array.from({ length: count }, (_, index) => `<div${ faulty.has(index + 1) ? ' problem' : '' }>${ index + 1 }</div>`).join('');
            gutter.scrollTop = textarea.scrollTop;
        };

        const refresh = () => {
            const text = textarea.value
                , { meta: info } = TTV_DSL.inspect(text, { file })
                , found = TTV_DSL.check(text);

            pre.innerHTML = highlighted(text);

            // Every script's id is a setting key; it can't reuse a built-in setting or another script
            if(info.id != original && taken.has(info.id))
                found.unshift({ message: `The id "${ info.id }" is already used by another setting or script`, loc: { line: 1, column: 1 } });

            meta.textContent = ` — ${ info.name } (${ info.id })`;
            problems.innerHTML = found.map(({ message, loc }) => `<li><code>${ loc?.line ?? '?' }:${ loc?.column ?? '?' }</code> ${ escape(message) }</li>`).join('');
            save.disabled = found.length > 0;
            faulty = new Set(found.map(({ loc }) => loc?.line).filter(Boolean));
            number();
        };

        textarea.value = source;
        textarea.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(refresh, 150);
            pre.innerHTML = highlighted(textarea.value);
            number();
        });

        textarea.addEventListener('scroll', () => {
            pre.scrollTop = gutter.scrollTop = textarea.scrollTop;
            pre.scrollLeft = textarea.scrollLeft;
        });

        // Tab indents rather than leaving the editor
        textarea.addEventListener('keydown', event => {
            if(event.key != 'Tab' || event.ctrlKey || event.altKey || event.metaKey)
                return;

            event.preventDefault();
            document.execCommand('insertText', false, '    ');
        });

        const close = result => {
            overlay.remove();
            resolve(result);
        };

        overlay.querySelector('.user-script-editor--cancel').onclick = () => close(null);
        save.onclick = () => close({ file, source: textarea.value });

        document.body.append(overlay);
        refresh();
        textarea.focus();
    });
}

/**
 * Asks the viewer to approve what a script asks for.
 * @param {Object} script - An inspected script
 * @returns {Promise<boolean>} Whether they approved
 */
async function askApproval(script) {
    const lines = script.meta.permissions.map(({ permissions, description, line }) =>
        `<li><code>${ permissions.map(escape).join(', ') }</code>${ description ? ` — ${ escape(description) }` : '' } <small>(line ${ line })</small></li>`
    ).join('');

    return ask(`<strong>${ escape(script.meta.name) }</strong> asks for these permissions:<ul>${ lines }</ul>Only approve scripts you trust.`);
}

/**
 * Builds the User Scripts group: the manager list, and each script's own settings section.
 * Adds the scripts' settings to the page's saved settings before settings.js loads them.
 * @param {Object} page - `{ ids, defaults }`: the page's saved-setting ids and defaults, to extend
 * @returns {Promise<void>}
 */
export async function renderUserScripts({ ids, defaults }) {
    const manager = document.getElementById('user-scripts-manager');

    if(!manager || !STORAGE || !globalThis.TTV_DSL)
        return;

    const stored = await read([SCRIPTS_KEY, CONSENT_KEY])
        , scripts = inspectAll(stored[SCRIPTS_KEY] ?? [])
        , consent = { ...stored[CONSENT_KEY] }
        , builtIn = new Set(ids);

    // Each script's own section, after the manager
    const sections = scripts.filter(({ meta }) => !builtIn.has(meta.id)).map(({ meta }) => meta.section);
    const section = manager.closest('section');

    section.insertAdjacentHTML('afterend', sections.map(renderSection).join(''));

    for(const { meta } of scripts)
        for(const key of Object.keys(meta.settings ?? {}))
            if(!ids.includes(key))
                ids.push(key);

    Object.assign(defaults, settingDefaults([{ sections }]));

    // The manager list
    const reload = () => location.reload();
    const taken = () => new Set([...builtIn, ...scripts.map(({ meta }) => meta.id)]);

    const store = async list => {
        await write({ [SCRIPTS_KEY]: list.map(({ file, source }) => ({ file, source })) });
        reload();
    };

    manager.innerHTML = `
        <table class="user-scripts--list">${ scripts.map((script, index) => {
            const { label, kind } = statusOf(script, consent);

            return `<tr data-index="${ index }">
                <td><strong>${ escape(script.meta.name) }</strong> <code>${ escape(script.meta.id) }</code></td>
                <td><span class="user-scripts--status" status="${ kind }">${ label }</span></td>
                <td>${ kind == 'warning' ? '<button class="approve">Approve…</button> ' : '' }<button class="edit">Edit</button> <button class="remove">Remove</button></td>
            </tr>`;
        }).join('') || "<tr><td>No scripts yet.</td></tr>" }</table>
        <div class="user-scripts--actions">
            <button class="new">New script</button>
            <input type="file" accept=".ttv,text/plain" hidden>
            <button class="import">Import .ttv…</button>
        </div>`;

    for(const row of manager.querySelectorAll('tr[data-index]')) {
        const script = scripts[+row.dataset.index];

        row.querySelector('.edit').onclick = async() => {
            const others = taken();

            others.delete(script.meta.id);

            const result = await openEditor({ source: script.source, file: script.file, original: script.meta.id, taken: others });

            if(result)
                await store(scripts.map(other => other == script ? result : other));
        };

        row.querySelector('.remove').onclick = async() => {
            if(!await ask(`Remove <strong>${ escape(script.meta.name) }</strong>? Its settings are kept until you reinstall or reset.`))
                return;

            delete consent[script.meta.id];
            await write({ [CONSENT_KEY]: consent });
            await store(scripts.filter(other => other != script));
        };

        row.querySelector('.approve')?.addEventListener('click', async() => {
            if(!await askApproval(script))
                return;

            consent[script.meta.id] = grantsOf(script.meta.permissions);
            await write({ [CONSENT_KEY]: consent });
            reload();
        });
    }

    const add = async(source, file) => {
        const result = await openEditor({ source, file, original: null, taken: taken() });

        if(result)
            await store([...scripts, result]);
    };

    const picker = manager.querySelector('input[type="file"]');

    manager.querySelector('.new').onclick = () => add(TEMPLATE, 'hello-bot.ttv');
    manager.querySelector('.import').onclick = () => picker.click();
    picker.onchange = async() => {
        const [file] = picker.files;

        if(file)
            await add(await file.text(), file.name);
    };
}
