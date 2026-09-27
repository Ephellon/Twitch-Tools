/*** /scripts/structure.mjs
 * Converts "installed" plugins (a section moved verbatim, see migrate.mjs) into the structured form:
 * `init` / `handler` / `unhandler` / `enabled` / `setup` (see docs/PLUGINS.md).
 *
 *     node scripts/structure.mjs [--write] [src/plugins/…/file.js …]
 *
 * Without --write it only reports what would convert. A plugin converts when its install() is:
 *   [state and other start-up statements]  Handlers.J = fn;  [Timers.J = …;]  [Unhandlers.J = fn;]
 *   __Label__: if(condition) { …; RegisterJob('J'); }       ← last statement
 * Anything else (several jobs, `this`/`arguments` in a handler, code after the setup block) is left alone.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as espree from 'espree';

const WRITE = process.argv.includes('--write');
let targets = process.argv.slice(2).filter(arg => !arg.startsWith('--'));

if(!targets.length) {
    let visit = dir => fs.readdirSync(dir).flatMap(name => {
        let file = path.join(dir, name);
        return fs.statSync(file).isDirectory()? visit(file): file.endsWith('.js') && name != 'index.js'? [file]: [];
    });
    targets = visit('src/plugins');
}

const member = (node, object) => node?.type == 'MemberExpression' && !node.computed && node.object.name == object? node.property.name: null;

function walk(node, visit, parent = null) {
    if(!node || typeof node.type != 'string')
        return;
    if(visit(node, parent) === false)
        return;
    for(let key in node)
        if(key != 'loc' && key != 'range')
            for(let child of [].concat(node[key]))
                if(child && typeof child == 'object' && child.type)
                    walk(child, visit, node);
}

// `this`/`arguments` that belong to the function itself (not to a nested non-arrow function)
function usesOwnThis(fn) {
    let found = false;
    walk(fn.body, node => {
        if(node.type == 'FunctionExpression' || node.type == 'FunctionDeclaration')
            return false;
        if(node.type == 'ThisExpression' || (node.type == 'Identifier' && node.name == 'arguments'))
            found = true;
    });
    return found;
}

function hasTopLevelAwait(nodes) {
    let found = false;
    for(let node of nodes)
        walk(node, n => {
            if(/Function/.test(n.type))
                return false;
            if(n.type == 'AwaitExpression' || (n.type == 'ForOfStatement' && n.await))
                found = true;
        });
    return found;
}

function patternNames(node, names = []) {
    switch(node?.type) {
        case 'Identifier': names.push(node.name); break;
        case 'ObjectPattern': node.properties.forEach(p => patternNames(p.value ?? p.argument, names)); break;
        case 'ArrayPattern': node.elements.forEach(e => patternNames(e, names)); break;
        case 'RestElement': patternNames(node.argument, names); break;
        case 'AssignmentPattern': patternNames(node.left, names); break;
    }
    return names;
}

// Re-indent a multi-line slice: every line after the first moves by `delta` spaces
function shift(text, delta) {
    return text.split('\n').map((line, index) => {
        if(!index || !line.trim())
            return index? '': line;
        return delta < 0? line.replace(new RegExp(`^ {0,${ -delta }}`), ''): ' '.repeat(delta) + line;
    }).join('\n');
}

// Statements (at `from` indentation) re-indented to `to`
function block(source, statements, from, to) {
    if(!statements.length)
        return '';
    let start = statements[0].range[0], end = statements.at(-1).range[1];
    // Keep comments/blank lines between statements; start from the first statement's line
    let lineStart = source.lastIndexOf('\n', start) + 1;
    let text = source.slice(lineStart, end);
    return text.split('\n').map(line => line.trim()? (to > from? ' '.repeat(to - from) + line: line.replace(new RegExp(`^ {0,${ from - to }}`), '')): '').join('\n');
}

// Give a function expression a leading parameter (the plugin context)
function withParameter(source, fn, parameter) {
    let text = source.slice(fn.range[0], fn.range[1]);
    let offset = fn.range[0];

    if(fn.params.length) {
        let first = fn.params[0];
        let before = source.slice(offset, first.range[0]);
        if(fn.type == 'ArrowFunctionExpression' && !before.includes('('))
            return `(${ parameter }, ${ source.slice(first.range[0], first.range[1]) })` + source.slice(first.range[1], fn.range[1]);
        return source.slice(offset, first.range[0]) + `${ parameter }, ` + source.slice(first.range[0], fn.range[1]);
    }

    let open = text.indexOf('(');
    return text.slice(0, open + 1) + parameter + text.slice(open + 1);
}

let report = { converted: [], skipped: [] };

for(let file of targets) {
    let source = fs.readFileSync(file, 'utf8');
    let ast = espree.parse(source, { ecmaVersion: 'latest', sourceType: 'module', loc: true, range: true, comment: true });
    let call = ast.body.find(n => n.type == 'ExpressionStatement' && n.expression.callee?.name == 'plugin')?.expression;
    let definition = call?.arguments[0];
    let install = definition?.properties.find(p => p.key?.name == 'install');
    let skip = reason => report.skipped.push(`${ file.replace('src/plugins/', '') }: ${ reason }`);

    if(!install)
        continue;

    let id = definition.properties.find(p => p.key?.name == 'id').value.value;
    let fn = install.value;
    let parameter = fn.params[0]? source.slice(fn.params[0].range[0], fn.params[0].range[1]): '';
    let statements = fn.body.body;

    let handlers = [], timers = [], unhandlers = [], labels = [], other = [];
    for(let statement of statements) {
        let assignment = statement.type == 'ExpressionStatement' && statement.expression.type == 'AssignmentExpression' && statement.expression.operator == '='? statement.expression: null;

        if(member(assignment?.left, 'Handlers'))
            handlers.push(assignment);
        else if(member(assignment?.left, 'Timers'))
            timers.push(assignment);
        else if(member(assignment?.left, 'Unhandlers'))
            unhandlers.push(assignment);
        else if(statement.type == 'LabeledStatement' && statement.body.type == 'IfStatement')
            labels.push(statement);
        else
            other.push(statement);
    }

    if(handlers.length != 1 || timers.length > 1 || unhandlers.length > 1 || labels.length != 1)
        { skip(`shape: ${ handlers.length } handlers, ${ timers.length } timers, ${ unhandlers.length } unhandlers, ${ labels.length } setup blocks`); continue; }

    let job = member(handlers[0].left, 'Handlers');
    if([timers[0], unhandlers[0]].some(a => a && member(a.left, 'Timers') != job && member(a.left, 'Unhandlers') != job))
        { skip('timer/unhandler for another job'); continue; }

    let [label] = labels;
    if(statements.at(-1) !== label)
        { skip('code after the setup block'); continue; }
    if(label.body.alternate)
        { skip('setup block has an else'); continue; }

    let jobFunctions = [handlers[0].right, unhandlers[0]?.right].filter(Boolean);
    if(jobFunctions.some(f => !/FunctionExpression$/.test(f.type)))
        { skip('handler is not a function literal'); continue; }
    if(jobFunctions.some(usesOwnThis))
        { skip('handler uses this/arguments'); continue; }

    // Setup: the block's statements, minus a final top-level RegisterJob(job)
    let consequent = label.body.consequent;
    let body = consequent.type == 'BlockStatement'? consequent.body: [consequent];
    let registerAt = body.findIndex(s => s.type == 'ExpressionStatement' && s.expression.type == 'CallExpression' && s.expression.callee.name == 'RegisterJob' && s.expression.arguments[0]?.value == job);
    let register = registerAt > -1;
    let after = register? body.slice(registerAt + 1): [];
    let setup = register? body.filter((_, i) => i != registerAt): body;

    if(after.some(s => /\bJobs\b/.test(source.slice(s.range[0], s.range[1]))))
        { skip('reads Jobs after RegisterJob'); continue; }

    let labelUsed = false;
    walk(consequent, node => { if((node.type == 'BreakStatement' || node.type == 'ContinueStatement') && node.label?.name == label.label.name) labelUsed = true });

    // State: top-level declarations become module-level, assigned in init()
    let state = [], hoisted = [], initLines = [];
    let initIndent = 8;
    for(let statement of other) {
        let text = source.slice(statement.range[0], statement.range[1]);
        if(statement.type == 'VariableDeclaration') {
            for(let d of statement.declarations) {
                let names = patternNames(d.id);
                state.push(...names);
                let target = source.slice(d.id.range[0], d.id.range[1]);
                let value = d.init? source.slice(d.init.range[0], d.init.range[1]): 'undefined';
                initLines.push(d.id.type == 'ObjectPattern'? `(${ target } = ${ value });`: `${ target } = ${ value };`);
            }
        } else if(statement.type == 'FunctionDeclaration') {
            state.push(statement.id.name);
            hoisted.push(`${ statement.id.name } = ${ text };`);
        } else if(statement.type == 'ClassDeclaration') {
            state.push(statement.id.name);
            initLines.push(`${ statement.id.name } = ${ text };`);
        } else {
            initLines.push(text);
        }
    }

    // Anything in state must not already be a name this module uses otherwise (import, plugin)
    if(state.includes('plugin'))
        { skip('state named "plugin"'); continue; }

    let uses = (text, name) => new RegExp(`\\b${ name }\\b`).test(text);
    let needsParameter = text => parameter && (parameter == 'context'? uses(text, 'context'): uses(text, 'StopWatch'));
    let indentLines = (lines, spaces) => lines.map(line => shift(line, 0).split('\n').map((l, i) => i? l: ' '.repeat(spaces) + l).join('\n'));

    let cond = source.slice(label.body.test.range[0], label.body.test.range[1]);
    let defaultCondition = new RegExp(`^parseBool\\(Settings\\.${ job }\\)$`).test(cond);

    let initBody = [...indentLines(hoisted.map(h => h), initIndent), ...indentLines(initLines, initIndent)];
    // Multi-line pieces were sliced from 8-space code; they keep their own inner indentation
    let initText = initBody.join('\n');

    let setupStatements = [...setup.filter(s => !after.includes(s)), ...after];
    let setupText = labelUsed?
        `        ${ label.label.name }: {\n${ block(source, setupStatements, 12, 12) }\n        }`:
    block(source, setupStatements, 12, 8);

    let handlerFn = handlers[0].right;
    let handlerText = shift(needsParameter(source.slice(handlerFn.range[0], handlerFn.range[1])) || handlerFn.params.length? withParameter(source, handlerFn, parameter || 'context'): source.slice(handlerFn.range[0], handlerFn.range[1]), -4);
    let unhandlerFn = unhandlers[0]?.right;
    let unhandlerText = unhandlerFn && shift(needsParameter(source.slice(unhandlerFn.range[0], unhandlerFn.range[1])) || unhandlerFn.params.length? withParameter(source, unhandlerFn, parameter || 'context'): source.slice(unhandlerFn.range[0], unhandlerFn.range[1]), -4);

    let timerValue = timers[0] && source.slice(timers[0].right.range[0], timers[0].right.range[1]);
    let literalTimer = timers[0] && (timers[0].right.type == 'Literal' || (timers[0].right.type == 'UnaryExpression' && timers[0].right.argument.type == 'Literal'));
    if(timers[0] && !literalTimer)
        initText += `\n        Timers.${ job } = ${ timerValue };`;

    let asyncInit = hasTopLevelAwait(other)? 'async ': '';
    let asyncSetup = hasTopLevelAwait(setupStatements)? 'async ': '';
    let param = text => needsParameter(text)? parameter: '';

    // Header: keep the title, say how it was converted
    let header = source.slice(0, source.indexOf('import '))
        .replace(/ \* Moved verbatim from (.+?) in Phase 4; it wires its own jobs and settings\.\n/, ' * Moved from $1 in Phase 4 and converted to the structured form (docs/PLUGINS.md).\n');
    let importLine = source.slice(source.indexOf('import '), source.indexOf('\n', source.indexOf('import ')) + 1);

    let parts = [];
    parts.push(`    id: '${ id }',`);
    if(job != id)
        parts.push(`    job: '${ job }',`);
    if(literalTimer)
        parts.push(`    timer: ${ timerValue },`);
    if(!register)
        parts.push(`    register: false,          // setup() starts the job itself, when it should`);

    let sections = [];
    if(initText.trim())
        sections.push(`    ${ asyncInit }init(${ param(initText) }) {\n${ initText }\n    },`);
    sections.push(`    handler: ${ handlerText },`);
    if(unhandlerText)
        sections.push(`    unhandler: ${ unhandlerText },`);
    if(!defaultCondition)
        sections.push(`    enabled(${ needsParameter(cond)? `settings, ${ parameter }`: '' }) {\n        return ${ shift(cond, -4) };\n    },`);
    if(setupText.trim())
        sections.push(`    ${ asyncSetup }setup(${ param(setupText) }) {\n${ setupText }\n    },`);

    let stateLine = state.length? `\n// The feature's state; init() resets it whenever the page (re)initializes\nlet ${ [...new Set(state)].join(', ') };\n`: '';
    let output = `${ header }${ importLine }${ stateLine }\nplugin({\n${ parts.join('\n') }\n\n${ sections.join('\n\n') }\n});\n`;

    report.converted.push(`${ file.replace('src/plugins/', '') } (${ job }${ register? '': ', register:false' }${ state.length? `, ${ state.length } state`: '' })`);

    if(WRITE)
        fs.writeFileSync(file, output);
}

console.log(`Converted ${ report.converted.length }${ WRITE? '': ' (dry run)' }:`);
report.converted.forEach(line => console.log('  ' + line));
console.log(`Left installed ${ report.skipped.length }:`);
report.skipped.forEach(line => console.log('  ' + line));
