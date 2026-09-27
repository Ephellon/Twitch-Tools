/*** /eslint.config.mjs
 * Lints `src/` and codifies the project's hand-written style.
 *
 * Content scripts that load together share one global scope, so a name declared at the top of
 * `core.js` is visible in `tools.js`. Rather than hand-maintain that list, the globals for each
 * file are derived from `manifest.json` (and `settings.html`): every top-level declaration and
 * every `window.NAME =` in the files loaded alongside it.
 *
 * Correctness findings in the legacy files are warnings until Phase 2 clears them; see REVAMP.md.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as espree from 'espree';
import js from '@eslint/js';
import globals from 'globals';
import stylistic from '@stylistic/eslint-plugin';
import house from './scripts/eslint/style.mjs';

const ROOT = 'src';
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

// Top-level names a classic script contributes to the shared global scope
// Built bundles listed in the manifest → the ES-module entry they come from (see scripts/build.mjs)
const BUNDLES = {
    'lib.js': 'lib/index.js',
    'chat-plugins.js': 'plugins/chat/index.js',
    'player-plugins.js': 'plugins/player/index.js',
    'clips-plugins.js': 'plugins/clips/index.js',
    'settings-ui.js': 'settings/index.js',
};

// Every ES-module source that ends up in a bundle
function moduleSources(entry) {
    const folder = path.join(ROOT, path.dirname(entry));
    const all = [];
    const visit = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(e => e.isDirectory() ? visit(path.join(dir, e.name)) : e.name.endsWith('.js') && all.push(path.relative(ROOT, path.join(dir, e.name))));

    visit(folder);
    visit(path.join(ROOT, 'plugins'));

    return all;
}

function declaredNames(file) {
    // A bundle publishes whatever its modules assign to window/top/globalThis
    if(file in BUNDLES)
        return new Set(moduleSources(BUNDLES[file]).flatMap(source => [...declaredNamesIn(source, true)]));

    return declaredNamesIn(file, false);
}

function declaredNamesIn(file, module) {
    const names = new Set;
    const source = read(file);
    let program;

    try {
        program = espree.parse(source, { ecmaVersion: 'latest', sourceType: module ? 'module' : 'script' });
    } catch {
        return names;
    }

    for(const node of program.body)
        collectStatement(node, names, true);

    // Object.defineProperties(top, { NAME: … }) and Object.defineProperty(window, 'NAME', …)
    walk(program, node => {
        const { callee, arguments: [target, what] = [] } = node.type == 'CallExpression' ? node : {};

        if(callee?.object?.name != 'Object' || !GLOBAL_OBJECTS.has(target?.name))
            return;

        if(callee.property?.name == 'assign' && what?.type == 'ObjectExpression')
            what.properties.forEach(({ key }) => key && names.add(key.name ?? key.value));
        else if(callee.property?.name == 'defineProperties' && what?.type == 'ObjectExpression')
            what.properties.forEach(({ key }) => key && names.add(key.name ?? key.value));
        else if(callee.property?.name == 'defineProperty' && typeof what?.value == 'string')
            names.add(what.value);
    });

    for(const [, name] of source.matchAll(/\b(?:window|globalThis|self|top)\.([A-Za-z_$][\w$]*)\s*(?:\?\?|\|\||&&)?=[^=]/g))
        names.add(name);

    return names;
}

const GLOBAL_OBJECTS = new Set(['window', 'top', 'globalThis', 'self']);

function walk(node, visit) {
    if(!node || typeof node.type != 'string')
        return;

    visit(node);

    for(const key in node)
        if(key != 'parent')
            for(const child of [].concat(node[key]))
                if(child && typeof child == 'object')
                    walk(child, visit);
}

// Sloppy-mode scripts also leak function declarations out of top-level blocks (Annex B), e.g. `__STATIC__: { function RegisterJob() {} }`
function collectStatement(node, names, topLevel = false) {
    switch(node?.type) {
        case 'VariableDeclaration': {
            if(topLevel || node.kind == 'var')
                node.declarations.forEach(({ id }) => collectPattern(id, names));
        } break;
        case 'FunctionDeclaration': {
            names.add(node.id.name);
        } break;
        case 'ClassDeclaration': {
            topLevel && names.add(node.id.name);
        } break;
        case 'LabeledStatement': {
            collectStatement(node.body, names);
        } break;
        case 'BlockStatement': {
            node.body.forEach(child => collectStatement(child, names));
        } break;
        case 'IfStatement': {
            collectStatement(node.consequent, names);
            collectStatement(node.alternate, names);
        } break;
    } // switch node?.type
}

function collectPattern(node, names) {
    switch(node?.type) {
        case 'Identifier': { names.add(node.name) } break;
        case 'ObjectPattern': { node.properties.forEach(p => collectPattern(p.value ?? p.argument, names)) } break;
        case 'ArrayPattern': { node.elements.forEach(e => collectPattern(e, names)) } break;
        case 'RestElement': { collectPattern(node.argument, names) } break;
        case 'AssignmentPattern': { collectPattern(node.left, names) } break;
    } // switch node?.type
}

// Each group of scripts that share a scope: one per content-script entry, plus the settings page
const manifest = JSON.parse(read('manifest.json'));
const groups = manifest.content_scripts.map(({ js }) => js);

groups.push([...read('settings.html').matchAll(/<script[^>]*\bsrc=['"]([^'"]+)['"]/gi)].map(([, src]) => src));

const sharedGlobals = {};

for(const group of groups) {
    const names = {};

    for(const file of group)
        for(const name of declaredNames(file))
            names[name] = 'writable';
    for(const file of group)
        Object.assign(sharedGlobals[file] ??= {}, names);
}

// UMD libraries in `ext/` that attach themselves through a wrapper the scan above can't see
const VENDORED = { localforage: 'readonly', Sortable: 'readonly', resemble: 'readonly' };

const legacy = {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^\\$' }],     // Replace callbacks list every positional parameter
    'no-useless-escape': 'warn',
    'no-unused-labels': 'off',                  // Features are wrapped in labeled blocks on purpose
    'no-constant-binary-expression': 'off',     // `(false || a || b)` is used for alignment
    'no-constant-condition': 'off',
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'no-setter-return': 'warn',
    'no-useless-assignment': 'warn',
    'no-extra-boolean-cast': 'warn',
    'no-unreachable': 'warn',
    'no-cond-assign': 'warn',
    'no-delete-var': 'warn',
    'no-redeclare': ['warn', { builtinGlobals: false }],
    'no-global-assign': 'warn',
    'no-dupe-keys': 'warn',
    'no-sparse-arrays': 'warn',
    'no-control-regex': 'warn',
    'no-case-declarations': 'warn',
    'no-unused-private-class-members': 'warn',
    'no-fallthrough': 'warn',
    'no-unassigned-vars': 'warn',
    'no-useless-catch': 'warn',
    'no-unsafe-optional-chaining': 'warn',
    'preserve-caught-error': 'off',
    'getter-return': 'warn',
    'no-undef': 'warn',
};

// The house style (docs/STYLEGUIDE.md). Warnings; `npm run format` fixes what it safely can
const PADDED = ['const', 'let', 'var', 'if', 'for', 'while'];
const DECLARATIONS = ['const', 'let', 'var'];
const style = {
    '@stylistic/indent': ['warn', 4, { SwitchCase: 1, MemberExpression: 1, CallExpression: { arguments: 'off' }, offsetTernaryExpressions: false, VariableDeclarator: 1, ignoreComments: true, ignoredNodes: ['ExpressionStatement > AssignmentExpression > FunctionExpression', 'ExpressionStatement > AssignmentExpression > ArrowFunctionExpression'] }],
    '@stylistic/indent-binary-ops': ['warn', 4],
    '@stylistic/keyword-spacing': ['warn', {
        before: true, after: true,
        overrides: Object.fromEntries(['if', 'for', 'while', 'switch'].map(k => [k, { after: false }])),
    }],
    '@stylistic/space-before-function-paren': ['warn', { anonymous: 'never', named: 'never', asyncArrow: 'never', catch: 'never' }],
    'ttv/semi': ['warn', 'always', { omitLastInOneLineBlock: true, omitLastInOneLineClassBody: true }],
    '@stylistic/operator-linebreak': ['warn', 'before', { overrides: { '=': 'after' } }],
    '@stylistic/space-infix-ops': 'warn',
    '@stylistic/space-unary-ops': ['warn', { words: true, nonwords: false }],
    '@stylistic/array-bracket-spacing': ['warn', 'never'],
    '@stylistic/comma-style': ['warn', 'first', { exceptions: Object.fromEntries([
        'ArrayExpression', 'ArrayPattern', 'ArrowFunctionExpression', 'CallExpression', 'FunctionDeclaration', 'FunctionExpression',
        'ImportDeclaration', 'ObjectExpression', 'ObjectPattern', 'NewExpression', 'ExportNamedDeclaration', 'ExportAllDeclaration',
    ].map(type => [type, true])) }],
    'ttv/body-below': 'warn',
    '@stylistic/comma-spacing': ['warn', { before: false, after: true }],
    'ttv/statement-per-line': 'warn',
    'ttv/comment-indent': 'warn',
    '@stylistic/brace-style': ['warn', '1tbs', { allowSingleLine: true }],
    '@stylistic/padding-line-between-statements': ['warn',
        { blankLine: 'always', prev: '*', next: ['break', 'continue'] },
        { blankLine: 'any', prev: 'block', next: 'break' },
        // Different kinds of block are separated; a run of the same kind needn't be
        ...PADDED.map(kind => ({
            blankLine: 'always', prev: kind,
            next: PADDED.filter(other => other != kind && !(DECLARATIONS.includes(kind) && DECLARATIONS.includes(other))),
        })),
        // A declaration group has a blank line before and after it
        { blankLine: 'always', prev: '*', next: DECLARATIONS },
        { blankLine: 'always', prev: DECLARATIONS, next: '*' },
        { blankLine: 'any', prev: DECLARATIONS, next: DECLARATIONS },
        // So does anything after a statement that spans lines (`…);`, `…];`, `…};`)
        { blankLine: 'always', prev: ['multiline-expression', 'multiline-const', 'multiline-let', 'multiline-var'], next: '*' },
    ],
    'no-var': 'warn',
    'ttv/prefer-const': ['warn', { destructuring: 'all' }],
    'ttv/void-null': 'warn',
    'ttv/switch-case-braces': 'warn',
    'ttv/prefix-update': 'warn',
    'ttv/if-braces': 'warn',
    'ttv/if-block-semi': 'warn',
    'ttv/quotes': 'warn',
    'ttv/regex-callback-params': 'warn',
    'ttv/breadcrumbs': 'warn',
    '@stylistic/comma-dangle': ['warn', 'only-multiline'],
    '@stylistic/object-curly-spacing': ['warn', 'always'],
    '@stylistic/template-curly-spacing': ['warn', 'always'],
    '@stylistic/no-trailing-spaces': 'warn',
    '@stylistic/no-tabs': 'warn',
    '@stylistic/eol-last': ['warn', 'always'],
};

export default [
    {
        ignores: ['dist/**', 'node_modules/**', 'archive/**', `${ ROOT }/ext/**`],
    },
    js.configs.recommended,
    {
        files: [`${ ROOT }/**/*.js`],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: { ...globals.browser, ...globals.webextensions, ...VENDORED },
        },
        linterOptions: { reportUnusedDisableDirectives: 'off' },
        plugins: { '@stylistic': stylistic, ttv: house },
        rules: { ...legacy, ...style },
    },
    ...Object.entries(sharedGlobals).map(([file, names]) => ({
        files: [`${ ROOT }/${ file }`],
        languageOptions: { globals: names },
    })),
    {
        files: [`${ ROOT }/background.js`],
        languageOptions: { sourceType: 'module', globals: globals.serviceworker },
    },
    {
        // ES modules bundled into lib.js (plugins included); they share the page scope of the scripts loaded alongside it
        files: [`${ ROOT }/lib/**/*.js`, `${ ROOT }/plugins/**/*.js`, `${ ROOT }/settings/**/*.js`],
        languageOptions: { sourceType: 'module', globals: sharedGlobals['lib.js'] },
    },
    {
        // The DSL runs both as content scripts and under Node (its test runner)
        files: [`${ ROOT }/dsl/**/*.js`],
        languageOptions: { globals: { ...globals.node, describe: 'readonly', it: 'readonly', assert: 'readonly' } },
    },
    {
        // Smoke scripts: Node, plus browser code they evaluate inside Chromium
        files: ['scripts/**/*.cjs'],
        languageOptions: { sourceType: 'commonjs', globals: { ...globals.node, ...globals.browser, ...globals.webextensions } },
        rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^\\$' }], 'no-constant-binary-expression': 'off' },
    },
    {
        files: ['*.mjs', 'scripts/**/*.mjs'],
        languageOptions: { sourceType: 'module', globals: globals.node },
        plugins: { '@stylistic': stylistic, ttv: house },
        rules: { ...style, 'no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^\\$' }], 'no-constant-binary-expression': 'off' },
    },
];
