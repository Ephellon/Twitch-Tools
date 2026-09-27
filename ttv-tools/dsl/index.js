/*** /dsl/index.js - The public face of the TTV DSL
 *   _____  _   _  _____   ______  __   __             _   _____
 *  |_   _|| \ | ||  __ \ |  ____| \ \ / /            | | / ____|
 *    | |  |  \| || |  | || |__     \ V /             | || (___
 *    | |  | . ` || |  | ||  __|     > <          _   | | \___ \
 *   _| |_ | |\  || |__| || |____   / . \    _   | |__| | ____) |
 *  |_____||_| \_||_____/ |______| /_/ \_\  (_)   \____/ |_____/
 */

/** @file Assembles the façade. Load this last — as a content script it must follow the
 * other `dsl/*.js` files in the manifest, and under Node it pulls them in itself.
 *
 * Everything else in `dsl/` writes onto `globalThis.TTV_DSL` as it loads; this file only
 * names the supported surface, so the internals stay free to move.
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

globalThis.TTV_DSL ??= {};

if (typeof require === 'function' && typeof module === 'object')
    for (let name of ['./errors.js', './tokens.js', './tokenizer.js', './ast.js', './parser.js', './runtime.js', './compiler.js'])
        require(name);

(() => {
    const DSL = globalThis.TTV_DSL;

    /** Bumped whenever the language itself changes, independent of the extension version. */
    DSL.version = '2.1.0';

    /** The file extension a script is stored under. */
    DSL.extension = '.ttv';

    Object.assign(DSL, {
        // -- pipeline ---------------------------------------------------------
        /** `(source, options?) -> Array<Token>` */
        tokenize: DSL.tokenizer.tokenize,
        /** `(source) -> Program`, throwing on the first fault */
        parse: DSL.parser.parse,
        /** `(source) -> { program, errors }`, collecting every recoverable fault */
        parseTolerant: DSL.parser.parseTolerant,
        /** `(ast, runtime) -> async (context) => value` */
        compile: DSL.compiler.compile,
        /** `(source, runtime, seed?) -> Promise<context>` */
        run: DSL.compiler.run,
        /** `(options) -> runtime` */
        createRuntime: DSL.runtime.createRuntime,

        // -- vocabulary -------------------------------------------------------
        TokenType: DSL.tokens.TokenType,
        NodeType: DSL.ast.NodeType,
        SelectorKind: DSL.ast.SelectorKind,
        walk: DSL.ast.walk,

        // -- diagnostics ------------------------------------------------------
        errors: DSL.errors,
    });

    /** Parses without running, purely to collect diagnostics — what the settings-page
     * editor wants in order to underline mistakes as they are typed.
     * @param {String} source
     * @return {Array<Object>} `{ name, message, loc, frame }`, empty when the script is clean
     */
    DSL.check = (source) => {
        try {
            let { errors } = DSL.parseTolerant(source);

            return errors.map(error => ({
                name: error.name,
                message: error.message,
                loc: error.loc,
                frame: error.codeFrame(),
            }));
        } catch (error) {
            // A lexical fault aborts the scan outright, so it arrives here instead.
            if (!(error instanceof DSL.errors.DSLError))
                throw error;

            return [{ name: error.name, message: error.message, loc: error.loc, frame: error.codeFrame() }];
        }
    };
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
