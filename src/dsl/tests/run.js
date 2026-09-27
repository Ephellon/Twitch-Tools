/*** /dsl/tests/run.js - Node entry point for the TTV DSL test suite
 *   _____   _    _  _   _              _   _____
 *  |  __ \ | |  | || \ | |            | | / ____|
 *  | |__) || |  | ||  \| |            | || (___
 *  |  _  / | |  | || . ` |        _   | | \___ \
 *  | | \ \ | |__| || |\  |   _   | |__| | ____) |
 *  |_|  \_\ \____/ |_| \_|  (_)   \____/ |_____/
 */

/** @file Loads the DSL in dependency order, then every `*.test.js`, then reports.
 * Run with `node dsl/tests/run.js`. Exits non-zero when anything fails, so it drops
 * straight into a pre-commit hook or CI step.
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

const PATH = require('path');

const ROOT = PATH.join(__dirname, '..');

/** Load order matters: each module augments `globalThis.TTV_DSL` and reads the pieces
 * registered before it. `index.js` comes last and only assembles the façade. */
const MODULES = [
    'errors.js',
    'tokens.js',
    'tokenizer.js',
    'ast.js',
    'parser.js',
    'runtime.js',
    'compiler.js',
    'index.js',
];

const TESTS = [
    'tokenizer.test.js',
    'parser.test.js',
    'runtime.test.js',
    'v2.test.js',
];

for(const name of MODULES)
    require(PATH.join(ROOT, name));

require(PATH.join(__dirname, 'harness.js'));

for(const name of TESTS)
    require(PATH.join(__dirname, name));

globalThis.TTV_DSL.testing
    .run()
    .then(({ failed }) => {
        process.exitCode = (failed > 0 ? 1 : 0);
    })
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
