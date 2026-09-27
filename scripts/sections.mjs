/*** /scripts/sections.mjs
 * Maps the feature sections inside an initializer (e.g. `Initialize` in tools.js) and how they
 * depend on each other through the initializer's own variables. Used to plan plugin migration.
 *
 *     node scripts/sections.mjs src/tools.js Initialize [--json]
 *
 * A section starts at a `/*** Title` banner directly inside the initializer. For each section it
 * reports the jobs it defines, the initializer variables it reads from other sections (`needs`),
 * and which other sections read its variables (`usedBy`). A section with neither can move as-is.
 */

import fs from 'node:fs';
import * as espree from 'espree';
import * as eslintScope from 'eslint-scope';

import { pathToFileURL } from 'node:url';

export function analyze(file, initializer) {
    const source = fs.readFileSync(file, 'utf8');
    const ast = espree.parse(source, { ecmaVersion: 'latest', sourceType: 'script', loc: true, range: true, comment: true });
    const scopes = eslintScope.analyze(ast, { ecmaVersion: 2024, sourceType: 'script' });

    // The initializer: `let Initialize = async() => { … }` or `function Initialize() { … }`
    let fn;

    for(const node of ast.body) {
        if(node.type == 'VariableDeclaration')
            for(const d of node.declarations)
                if(d.id.name == initializer)
                    fn = d.init;
        if(node.type == 'FunctionDeclaration' && node.id.name == initializer)
            fn = node;
    }

    if(!fn)
        throw new Error(`No initializer "${ initializer }" in ${ file }`);

    const [start, end] = [fn.body.loc.start.line, fn.body.loc.end.line];

    // Section banners: `/*** Title` comments at the initializer's top level
    const banners = ast.comments
        .filter(c => c.type == 'Block' && c.value.startsWith('** ') && c.loc.start.line > start && c.loc.end.line < end && c.loc.start.column == 4)
        .map(c => ({ title: c.value.slice(3).split('\n')[0].trim(), line: c.loc.start.line }));

    const sections = banners.map((b, i) => ({ ...b, end: (banners[i + 1]?.line ?? end) - 1, jobs: new Set, declares: new Set, needs: new Map, usedBy: new Set, settings: new Set }));
    const sectionAt = line => sections.findLast(s => s.line <= line) ?? { title: "(before first section)", line: start, jobs: new Set, declares: new Set, needs: new Map, usedBy: new Set, settings: new Set };

    // Variables of the initializer's own scope, plus the block scopes of its top-level statements (labeled `if` blocks)
    const fnScope = scopes.acquire(fn);
    const variables = fnScope.variables.filter(v => v.defs.length);

    for(const variable of variables) {
        const home = sectionAt(variable.defs[0].name.loc.start.line);
        home.declares.add(variable.name);

        for(const ref of variable.references) {
            const user = sectionAt(ref.identifier.loc.start.line);

            if(user !== home && !['StopWatch', 'PLUGIN_CONTEXT'].includes(variable.name)) {
                if(!user.needs.has(variable.name))
                    user.needs.set(variable.name, home.title);
                home.usedBy.add(user.title);
            }
        }
    }

    // Statements whose meaning changes once a section becomes its own function
    function scan(node, inside) {
        if(!node || typeof node.type != 'string')
            return;

        const nested = inside || /Function/.test(node.type) || node.type == 'ClassBody';

        if(!inside && node.type == 'ReturnStatement')
            (sectionAt(node.loc.start.line).returns ??= []).push(node.loc.start.line);
        if(!inside && node.type == 'AwaitExpression')
            sectionAt(node.loc.start.line).awaits = true;

        for(const key in node)
            if(key != 'loc' && key != 'range')
                for(const child of [].concat(node[key]))
                    if(child && typeof child == 'object' && child.type)
                        scan(child, nested && node !== fn);
    }
    for(const statement of fn.body.body)
        scan(statement, false);

    // Jobs and settings per section
    for(const [, match, line] of [...source.matchAll(/\b(?:Handlers|Timers|Unhandlers)\.(\w+)\s*=/g)].map(m => [m, m[1], source.slice(0, m.index).split('\n').length]))
        if(line > start && line < end)
            sectionAt(line).jobs.add(match);
    for(const m of source.matchAll(/\bSettings\.(\w+)/g)) {
        const line = source.slice(0, m.index).split('\n').length;

        if(line > start && line < end)
            sectionAt(line).settings.add(m[1]);
    }

    return sections.map(s => ({
        title: s.title, lines: `${ s.line }-${ s.end }`, size: s.end - s.line + 1,
        jobs: [...s.jobs], settings: [...s.settings],
        needs: Object.fromEntries(s.needs), usedBy: [...s.usedBy],
        returns: s.returns ?? [], awaits: !!s.awaits,
        standalone: !s.needs.size && !s.usedBy.size,
    }));
}

if(import.meta.url == pathToFileURL(process.argv[1]).href) {
    const [file = 'src/tools.js', initializer = 'Initialize'] = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
    const rows = analyze(file, initializer);

    if(process.argv.includes('--json'))
        console.log(JSON.stringify(rows, null, 2));
    else
        for(const r of rows)
        console.log(`${ r.standalone ? "✓" : " " } ${ r.lines.padEnd(12) } ${ r.title.slice(0, 48).padEnd(48) } jobs:${ r.jobs.length } needs:${ Object.keys(r.needs).length } usedBy:${ r.usedBy.length }${ r.awaits ? " await" : "" }${ r.returns.length ? " RETURN@" + r.returns : "" }`);
}
