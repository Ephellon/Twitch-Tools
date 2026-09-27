/*** /scripts/promote.mjs
 * Promotes variables that several feature sections share from an initializer's scope to page scope,
 * so each section can move into its own plugin and still see them (Phase 4).
 *
 *     node scripts/promote.mjs <file> <initializer> NAME [NAME...]
 *
 * `let A = 1, NAME = f(), B;` inside the initializer becomes `let A = 1;  NAME = f();  let B;` (same
 * order), `function NAME() {}` becomes `NAME = function NAME() {};`, and `let NAME;` is added once,
 * at the top level just above the initializer. A name that already exists at page level is refused.
 */

import fs from 'node:fs';
import * as espree from 'espree';
import * as eslintScope from 'eslint-scope';

let [file, initializer, ...names] = process.argv.slice(2);
let source = fs.readFileSync(file, 'utf8');
let ast = espree.parse(source, { ecmaVersion: 'latest', sourceType: 'script', loc: true, range: true, comment: true });
let scopes = eslintScope.analyze(ast, { ecmaVersion: 2024, sourceType: 'script' });

let holder, fn;
for(let node of ast.body)
    for(let d of node.type == 'VariableDeclaration'? node.declarations: [])
        if(d.id.name == initializer)
            [holder, fn] = [node, d.init];
if(!fn)
    throw new Error(`No initializer "${ initializer }"`);

let pageNames = new Set(scopes.globalScope.variables.map(v => v.name));
let fnScope = scopes.acquire(fn);
let edits = [];         // [start, end, text], applied back to front
let done = new Set;

for(let name of names) {
    if(pageNames.has(name))
        throw new Error(`"${ name }" already exists at page level in ${ file }`);

    let variable = fnScope.set.get(name);
    if(!variable)
        throw new Error(`"${ name }" is not declared directly in ${ initializer }`);

    let [def] = variable.defs;

    if(def.type == 'FunctionName') {
        let node = def.node;
        edits.push([node.range[0], node.range[1], `${ name } = ${ source.slice(node.range[0], node.range[1]) };`]);
    } else if(def.type == 'Variable') {
        let statement = def.parent;
        if(done.has(statement))
            continue;
        done.add(statement);

        let indent = ' '.repeat(statement.loc.start.column);
        // Each declarator's own text (keeps any parentheses around its initializer)
        let parts = statement.declarations.map(d => {
            let text = source.slice(d.range[0], d.range[1]);

            if(!names.includes(d.id.name))
                return `${ statement.kind } ${ text };`;

            return d.init? `${ text };`: `${ text } = undefined;`;
        });

        // Comments between declarators would be lost; keep them above the statement
        let comments = (ast.comments ?? []).filter(c => c.range[0] > statement.range[0] && c.range[1] < statement.range[1] && !statement.declarations.some(d => c.range[0] >= d.range[0] && c.range[1] <= d.range[1]));
        parts.unshift(...comments.map(c => source.slice(c.range[0], c.range[1])));

        edits.push([statement.range[0], statement.range[1], parts.join(`\n${ indent }`)]);
    } else {
        throw new Error(`"${ name }" is a ${ def.type }; promote it by hand`);
    }
}

edits.sort((a, b) => b[0] - a[0]);
for(let [start, end, text] of edits)
    source = source.slice(0, start) + text + source.slice(end);

// Declare them once, above the initializer
let marker = '// Shared between features and their plugins (src/plugins/); Initialize() assigns them\n';
let at = source.indexOf(source.slice(holder.range[0], holder.range[0] + 40));
let existing = source.lastIndexOf(marker, at);

if(existing > -1 && existing < at) {
    let lineEnd = source.indexOf(';\n', existing + marker.length);
    source = source.slice(0, lineEnd) + `, ${ names.join(', ') }` + source.slice(lineEnd);
} else {
    source = source.slice(0, at) + marker + `let ${ names.join(', ') };\n\n` + source.slice(at);
}

fs.writeFileSync(file, source);
console.log(`Promoted ${ names.join(', ') } to page scope in ${ file }`);
