/*** /scripts/migrate.mjs
 * Moves a feature section out of an initializer, verbatim, into a plugin file (Phase 4).
 *
 *     node scripts/migrate.mjs <file> <initializer> "<Section title>" <plugins/path.js> <id> [--force]
 *     node scripts/migrate.mjs <file> <initializer> "<Section title>" --delete
 *
 * The section becomes `plugin({ id, async install(context) { …section… } })`, and the initializer
 * gets `await TTV.run('<id>', PLUGIN_CONTEXT);` where the section was, so the order is unchanged.
 * Sections that share initializer variables with other sections are refused unless `--force`.
 *
 * `--live` handles sections that read the initializer's own variables (e.g. chat.js's STREAMER):
 * each such reference becomes `context.NAME`, and the initializer's PLUGIN_CONTEXT gets a getter
 * and setter for NAME, so the plugin reads and writes the real variable.
 * `--index <file>` registers the plugin somewhere other than src/plugins/index.js.
 * `--delete` removes a section that is only a banner (no code).
 */

import fs from 'node:fs';
import path from 'node:path';
import * as espree from 'espree';
import * as eslintScope from 'eslint-scope';
import { analyze } from './sections.mjs';

const force = process.argv.includes('--force');
const live = process.argv.includes('--live');
const indexFile = process.argv.includes('--index') ? process.argv[process.argv.indexOf('--index') + 1] : 'src/plugins/index.js';
const args = process.argv.slice(2).filter(arg => !arg.startsWith('--') && arg != indexFile);
const [file, initializer, title, target, id] = args;
const remove = process.argv.includes('--delete');

const section = analyze(file, initializer).find(s => s.title == title);

if(!section)
    throw new Error(`No section "${ title }" in ${ initializer } (${ file })`);

if(!section.standalone && !force && !(live && !section.usedBy.length))
    throw new Error(`"${ title }" shares variables: needs ${ JSON.stringify(section.needs) }, used by ${ JSON.stringify(section.usedBy) }`);

let [first, last] = section.lines.split('-').map(Number);
const liveNames = [];

// --live: rewrite the section's references to initializer variables into `context.NAME`
if(live) {
    let source = fs.readFileSync(file, 'utf8');
    const ast = espree.parse(source, { ecmaVersion: 'latest', sourceType: 'script', loc: true, range: true });
    const scopes = eslintScope.analyze(ast, { ecmaVersion: 2024, sourceType: 'script' });
    let fn;

    for(const node of ast.body)
        for(const d of node.type == 'VariableDeclaration' ? node.declarations : [])
            if(d.id.name == initializer)
                fn = d.init;

    const inside = node => node.loc.start.line >= first && node.loc.end.line <= last;
    const parents = new Map;
    (function link(node, parent) {
        if(!node || typeof node.type != 'string')
            return;
        parents.set(node, parent);
        for(const key in node)
            if(key != 'loc' && key != 'range')
                for(const child of [].concat(node[key]))
                    if(child && typeof child == 'object' && child.type)
                        link(child, node);
    })(fn.body, fn);

    const edits = [];

    for(const variable of scopes.acquire(fn).variables) {
        const [def] = variable.defs;

        if(!def || inside(def.name) || variable.name == 'PLUGIN_CONTEXT')
            continue;

        const refs = variable.references.filter(ref => inside(ref.identifier));

        if(!refs.length)
            continue;

        liveNames.push([variable.name, def.kind ?? def.parent?.kind ?? def.type]);
        for(const { identifier } of refs) {
            const parent = parents.get(identifier);
            edits.push(parent?.type == 'Property' && parent.shorthand
                ? [parent.range[0], parent.range[1], `${ variable.name }: context.${ variable.name }`]
            : [identifier.range[0], identifier.range[1], `context.${ variable.name }`]);
        }
    }

    for(const [start, end, text] of edits.sort((a, b) => b[0] - a[0]))
        source = source.slice(0, start) + text + source.slice(end);

    // Give PLUGIN_CONTEXT a live accessor for each name
    const head = source.split('\n');
    const at = head.findIndex((line, index) => index >= fn.loc.start.line - 1 && /^\s*let PLUGIN_CONTEXT = \{/.test(line));

    if(at < 0)
        throw new Error(`${ initializer } has no \`let PLUGIN_CONTEXT = {\` to extend`);

    const indent = head[at].match(/^\s*/)[0] + '    ';
    const block = head.slice(at, head.findIndex((line, index) => index > at && /^\s*};/.test(line)));
    const accessors = liveNames
        .filter(([name]) => !block.some(line => line.includes(`get ${ name }()`)))
        .map(([name, kind]) => `${ indent }get ${ name }() { return ${ name } },${ ['const', 'ClassName', 'FunctionName'].includes(kind) ? '' : ` set ${ name }(value) { ${ name } = value },` }`);
    head.splice(at + 1, 0, ...accessors);

    // The section moved down by the lines just added
    first += accessors.length;
    last += accessors.length;
    fs.writeFileSync(file, head.join('\n'));
}

const lines = fs.readFileSync(file, 'utf8').split('\n');

// Stop at a plugin that already ran from here (`// Title → src/plugins/…` + its `TTV.run`); it stays put
const pointer = lines.slice(first - 1, last).findIndex(line => /^\s*\/\/ .+ → src\/plugins\//.test(line));

if(pointer > 0)
    last = first - 1 + pointer;

const body = lines.slice(first - 1, last);

// Drop the banner comment (ASCII art); the title goes in the plugin's header instead
const bannerEnd = body.findIndex(line => line.trim() == '*/');
const code = body.slice(bannerEnd + 1);

while(code.length && !code[0].trim())
    code.shift();
while(code.length && !code.at(-1).trim())
    code.pop();

if(remove) {
    if(code.some(line => line.trim() && !line.trim().startsWith('//')))
        throw new Error(`"${ title }" has code; refusing to delete`);

    lines.splice(first - 1, last - first + 1);
    fs.writeFileSync(file, lines.join('\n'));
    console.log(`Deleted empty section "${ title }" (${ section.lines })`);
    process.exit(0);
}

if(!target || !id)
    throw new Error('Usage: migrate.mjs <file> <initializer> "<Section title>" <plugins/path.js> <id>');

const uses = name => code.some(line => new RegExp(`\\b${ name }\\b`).test(line));
const context = ['StopWatch', 'PLUGIN_CONTEXT'].filter(uses).filter(name => name != 'PLUGIN_CONTEXT');
const parameter = live ? 'context' : context.length ? `{ ${ context.join(', ') } }` : '';
const source = path.basename(file);
const depth = target.split('/').length - 1;
const pluginFile = path.join('src', target);

if(fs.existsSync(pluginFile))
    throw new Error(`${ pluginFile } already exists`);

const text = [
    `/*** /${ target }`,
    ` * ${ title }.`,
    ` * Moved verbatim from ${ source } (${ initializer }) in Phase 4; it wires its own jobs and settings.`,
    ` */`,
    ``,
    `import { plugin } from '${ '../'.repeat(depth) }lib/plugins.js';`,
    ``,
    `plugin({`,
    `    id: '${ id }',`,
    ``,
    `    async install(${ parameter }) {`,
    ...code.map(line => line.trim() ? '    ' + line : ''),
    `    },`,
    `});`,
    ``,
].join('\n');

fs.mkdirSync(path.dirname(pluginFile), { recursive: true });
fs.writeFileSync(pluginFile, text);

// Leave a pointer and the run call where the section was
lines.splice(first - 1, last - first + 1,
    `    // ${ title } → src/${ target }`,
    `    await TTV.run('${ id }', PLUGIN_CONTEXT);`,
    ``,
);
fs.writeFileSync(file, lines.join('\n'));

// Register it
const index = indexFile;
const entry = `import './${ path.relative(path.dirname(path.relative('src', index)), target).split(path.sep).join('/') }';`;
const current = fs.readFileSync(index, 'utf8');

if(!current.includes(entry))
    fs.writeFileSync(index, current.trimEnd() + '\n' + entry + '\n');

console.log(`${ title } (${ section.lines }, ${ code.length } lines) → src/${ target } as "${ id }"`);
