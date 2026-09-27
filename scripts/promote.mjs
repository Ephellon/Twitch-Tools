/*** /scripts/promote.mjs
 * Promotes variables that several feature sections share from an initializer's scope to page scope,
 * so each section can move into its own plugin and still see them (Phase 4).
 *
 *     node scripts/promote.mjs <file> <initializer> NAME [NAME...] [--head]
 *
 * `let A = 1, NAME = f(), B;` inside the initializer becomes `let A = 1;  NAME = f();  let B;` (same
 * order), `function NAME() {}` becomes `NAME = function NAME() {};`, and `let NAME;` is added once,
 * at the top level just above the initializer. A name that already exists at page level is refused.
 *
 * `--head` declares them at the top of the initializer instead, for initializers whose variables
 * must stay private to them (chat.js shadows several tools.js globals); plugins then reach them
 * through PLUGIN_CONTEXT (see migrate.mjs --live).
 */

import fs from 'node:fs';
import * as espree from 'espree';
import * as eslintScope from 'eslint-scope';

const HEAD = process.argv.includes('--head');
const [file, initializer, ...names] = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
let source = fs.readFileSync(file, 'utf8');
const ast = espree.parse(source, { ecmaVersion: 'latest', sourceType: 'script', loc: true, range: true, comment: true });
const scopes = eslintScope.analyze(ast, { ecmaVersion: 2024, sourceType: 'script' });

let holder, fn;

for(const node of ast.body)
    for(const d of node.type == 'VariableDeclaration' ? node.declarations : [])
        if(d.id.name == initializer)
            [holder, fn] = [node, d.init];

if(!fn)
    throw new Error(`No initializer "${ initializer }"`);

const pageNames = new Set(scopes.globalScope.variables.map(v => v.name));
const fnScope = scopes.acquire(fn);
const edits = [];         // [start, end, text], applied back to front
const done = new Set;

for(const name of names) {
    if(pageNames.has(name) && !HEAD)
        throw new Error(`"${ name }" already exists at page level in ${ file }`);

    const variable = fnScope.set.get(name);

    if(!variable)
        throw new Error(`"${ name }" is not declared directly in ${ initializer }`);

    const [def] = variable.defs;

    if(def.type == 'FunctionName') {
        const node = def.node;

        edits.push([node.range[0], node.range[1], `${ name } = ${ source.slice(node.range[0], node.range[1]) };`]);
    } else if(def.type == 'Variable') {
        const statement = def.parent;

        if(done.has(statement))
            continue;
        done.add(statement);

        const indent = ' '.repeat(statement.loc.start.column);
        // Each declarator's own text (keeps any parentheses around its initializer)
        const parts = statement.declarations.map(d => {
            const text = source.slice(d.range[0], d.range[1]);

            if(!names.includes(d.id.name))
                return `${ statement.kind } ${ text };`;

            return d.init ? `${ text };` : `${ text } = undefined;`;
        });

        // Comments between declarators would be lost; keep them above the statement
        const comments = (ast.comments ?? []).filter(c => c.range[0] > statement.range[0] && c.range[1] < statement.range[1] && !statement.declarations.some(d => c.range[0] >= d.range[0] && c.range[1] <= d.range[1]));

        parts.unshift(...comments.map(c => source.slice(c.range[0], c.range[1])));

        edits.push([statement.range[0], statement.range[1], parts.join(`\n${ indent }`)]);
    } else {
        throw new Error(`"${ name }" is a ${ def.type }; promote it by hand`)
    }
}

edits.sort((a, b) => b[0] - a[0]);
for(const [start, end, text] of edits)
    source = source.slice(0, start) + text + source.slice(end);

// Declare them once: at the top of the initializer (--head), or above it
if(HEAD) {
    const open = fn.body.range[0] + 1;

    source = source.slice(0, open) + `\n    // Shared between this initializer's features and their plugins (src/plugins/)\n    let ${ names.join(', ') };\n` + source.slice(open);
    fs.writeFileSync(file, source);
    console.log(`Promoted ${ names.join(', ') } to the top of ${ initializer } in ${ file }`);
    process.exit(0);
}

const marker = '// Shared between features and their plugins (src/plugins/); Initialize() assigns them\n';
const at = source.indexOf(source.slice(holder.range[0], holder.range[0] + 40));
const existing = source.lastIndexOf(marker, at);

if(existing > -1 && existing < at) {
    const lineEnd = source.indexOf(';\n', existing + marker.length);

    source = source.slice(0, lineEnd) + `, ${ names.join(', ') }` + source.slice(lineEnd);
} else {
    source = source.slice(0, at) + marker + `let ${ names.join(', ') };\n\n` + source.slice(at)
}

fs.writeFileSync(file, source);
console.log(`Promoted ${ names.join(', ') } to page scope in ${ file }`);
