/*** /scripts/docs-gaps.mjs
 * Lists what still needs a JSDoc header (docs/STYLEGUIDE.md, Header comments), per file, using the `ttv/jsdoc` rule.
 * Unlike `npm run lint`, it also reads `src/ext/` (the project's own files there; vendored libraries are skipped).
 *
 *     npm run docs:gaps              → a count per file
 *     npm run docs:gaps -- --list    → every finding
 *     npm run docs:gaps -- src/core.js
 */

import { ESLint } from 'eslint';

// Third-party code in src/ext: not ours to document
const VENDORED = /\/ext\/(?:localforage|sortable|resemble|tracking)\.js$/;

const args = process.argv.slice(2)
    , list = args.includes('--list')
    , targets = args.filter(arg => !arg.startsWith('--'));

const eslint = new ESLint({ ignore: false, overrideConfig: { linterOptions: { reportUnusedDisableDirectives: 'off' } } });
const results = await eslint.lintFiles(targets.length ? targets : ['src/**/*.js']);

let total = 0;
const rows = [];

for(const { filePath, messages } of results) {
    if(VENDORED.test(filePath) || /\/(?:dist|node_modules|archive)\//.test(filePath))
        continue;

    const gaps = messages.filter(({ ruleId }) => ruleId == 'ttv/jsdoc');

    if(!gaps.length)
        continue;

    total += gaps.length;
    rows.push([filePath.slice(process.cwd().length + 1), gaps]);
}

rows.sort(([, a], [, b]) => b.length - a.length);

for(const [file, gaps] of rows) {
    console.log(`${ String(gaps.length).padStart(4) }  ${ file }`);

    if(list)
        for(const { line, message } of gaps)
            console.log(`        ${ line }: ${ message }`);
}

console.log(`${ String(total).padStart(4) }  total`);
