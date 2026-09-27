/*** /eslint.config.mjs
 * Lints `ttv-tools/` and codifies the project's hand-written style.
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

const ROOT = 'ttv-tools';
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

// Top-level names a classic script contributes to the shared global scope
function declaredNames(file) {
    let names = new Set;
    let source = read(file);
    let program;

    try {
        program = espree.parse(source, { ecmaVersion: 'latest', sourceType: 'script' });
    } catch {
        return names;
    }

    for(let node of program.body)
        if(node.type == 'VariableDeclaration')
            for(let { id } of node.declarations)
                collectPattern(id, names);
        else if(node.type == 'FunctionDeclaration' || node.type == 'ClassDeclaration')
            node.id && names.add(node.id.name);

    for(let [, name] of source.matchAll(/\b(?:window|globalThis|self|top)\.([A-Za-z_$][\w$]*)\s*=[^=]/g))
        names.add(name);

    return names;
}

function collectPattern(node, names) {
    switch(node?.type) {
        case 'Identifier': names.add(node.name); break;
        case 'ObjectPattern': node.properties.forEach(p => collectPattern(p.value ?? p.argument, names)); break;
        case 'ArrayPattern': node.elements.forEach(e => collectPattern(e, names)); break;
        case 'RestElement': collectPattern(node.argument, names); break;
        case 'AssignmentPattern': collectPattern(node.left, names); break;
    }
}

// Each group of scripts that share a scope: one per content-script entry, plus the settings page
const manifest = JSON.parse(read('manifest.json'));
const groups = manifest.content_scripts.map(({ js }) => js);
groups.push([...read('settings.html').matchAll(/<script[^>]*\bsrc=['"]([^'"]+)['"]/gi)].map(([, src]) => src));

const sharedGlobals = {};
for(let group of groups) {
    let names = {};
    for(let file of group)
        for(let name of declaredNames(file))
            names[name] = 'writable';
    for(let file of group)
        Object.assign(sharedGlobals[file] ??= {}, names);
}

const legacy = {
    'no-unused-vars': 'warn',
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

// The project's style, as written by hand. Warnings for now; `npm run format` fixes a file
const style = {
    '@stylistic/indent-binary-ops': 'off',
    '@stylistic/keyword-spacing': ['warn', {
        before: true, after: true,
        overrides: Object.fromEntries(['if', 'for', 'while', 'switch'].map(k => [k, { after: false }])),
    }],
    '@stylistic/space-before-function-paren': ['warn', { anonymous: 'never', named: 'never', asyncArrow: 'never', catch: 'never' }],
    '@stylistic/semi': ['warn', 'always', { omitLastInOneLineBlock: true, omitLastInOneLineClassBody: true }],
    '@stylistic/operator-linebreak': ['warn', 'before', { overrides: { '?': 'after', ':': 'after', '=': 'after' } }],
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
            globals: { ...globals.browser, ...globals.webextensions },
        },
        linterOptions: { reportUnusedDisableDirectives: 'off' },
        plugins: { '@stylistic': stylistic },
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
        // The DSL runs both as content scripts and under Node (its test runner)
        files: [`${ ROOT }/dsl/**/*.js`],
        languageOptions: { globals: { ...globals.node, describe: 'readonly', it: 'readonly', assert: 'readonly' } },
    },
    {
        files: ['*.mjs', 'scripts/**/*.mjs'],
        languageOptions: { sourceType: 'module', globals: globals.node },
        plugins: { '@stylistic': stylistic },
        rules: { ...style, 'no-unused-vars': ['error', { ignoreRestSiblings: true }] },
    },
];
