/*** /scripts/migrate.mjs
 * Moves a feature section out of an initializer, verbatim, into a plugin file (Phase 4).
 *
 *     node scripts/migrate.mjs <file> <initializer> "<Section title>" <plugins/path.js> <id> [--force]
 *     node scripts/migrate.mjs <file> <initializer> "<Section title>" --delete
 *
 * The section becomes `plugin({ id, async install(context) { …section… } })`, and the initializer
 * gets `await TTV.run('<id>', PLUGIN_CONTEXT);` where the section was, so the order is unchanged.
 * Sections that share initializer variables with other sections are refused unless `--force`.
 * `--delete` removes a section that is only a banner (no code).
 */

import fs from 'node:fs';
import path from 'node:path';
import { analyze } from './sections.mjs';

let args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
let [file, initializer, title, target, id] = args;
let force = process.argv.includes('--force');
let remove = process.argv.includes('--delete');

let section = analyze(file, initializer).find(s => s.title == title);

if(!section)
    throw new Error(`No section "${ title }" in ${ initializer } (${ file })`);

if(!section.standalone && !force)
    throw new Error(`"${ title }" shares variables: needs ${ JSON.stringify(section.needs) }, used by ${ JSON.stringify(section.usedBy) }`);

let lines = fs.readFileSync(file, 'utf8').split('\n');
let [first, last] = section.lines.split('-').map(Number);
let body = lines.slice(first - 1, last);

// Drop the banner comment (ASCII art); the title goes in the plugin's header instead
let bannerEnd = body.findIndex(line => line.trim() == '*/');
let code = body.slice(bannerEnd + 1);

while(code.length && !code[0].trim())
    code.shift();
while(code.length && !code.at(-1).trim())
    code.pop();

if(remove) {
    if(code.some(line => line.trim()))
        throw new Error(`"${ title }" has code; refusing to delete`);

    lines.splice(first - 1, last - first + 1);
    fs.writeFileSync(file, lines.join('\n'));
    console.log(`Deleted empty section "${ title }" (${ section.lines })`);
    process.exit(0);
}

if(!target || !id)
    throw new Error('Usage: migrate.mjs <file> <initializer> "<Section title>" <plugins/path.js> <id>');

let uses = name => code.some(line => new RegExp(`\\b${ name }\\b`).test(line));
let context = ['StopWatch', 'PLUGIN_CONTEXT'].filter(uses).filter(name => name != 'PLUGIN_CONTEXT');
let source = path.basename(file);
let depth = target.split('/').length - 1;
let pluginFile = path.join('src', target);

if(fs.existsSync(pluginFile))
    throw new Error(`${ pluginFile } already exists`);

let text = [
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
    `    async install(${ context.length? `{ ${ context.join(', ') } }`: '' }) {`,
    ...code.map(line => line.trim()? '    ' + line: ''),
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
let index = 'src/plugins/index.js';
let entry = `import './${ path.relative('plugins', target).split(path.sep).join('/') }';`;
let current = fs.readFileSync(index, 'utf8');

if(!current.includes(entry))
    fs.writeFileSync(index, current.trimEnd() + '\n' + entry + '\n');

console.log(`${ title } (${ section.lines }, ${ code.length } lines) → src/${ target } as "${ id }"`);
