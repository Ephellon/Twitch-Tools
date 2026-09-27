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

if(typeof require === 'function' && typeof module === 'object')
    for(const name of ['./errors.js', './tokens.js', './tokenizer.js', './ast.js', './parser.js', './runtime.js', './compiler.js', './highlight.js', './fake-page.js'])
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

        // -- editor -----------------------------------------------------------
        /** `(source) -> Array<{ type, text, start, end }>`, covering every character */
        highlight: DSL.highlighter.highlight,
        /** The fixed list of span types `highlight` uses */
        HIGHLIGHT_TYPES: DSL.highlighter.HIGHLIGHT_TYPES,
    });

    /** Lists what a script will ask for, without running it — what a host shows the viewer
     * before a script starts.
     * @param {String} source
     * @return {{ blocks: Array<Object>, calls: Array<Object> }} `blocks` is every `using`
     *   that grants something or describes itself — `{ permissions, description, line }` —
     *   and `calls` is every `&` host call — `{ path, line }` — in source order.
     * @throws {DSLError} when the script does not parse
     */
    DSL.grants = (source) => {
        const program = DSL.parse(source)
            , blocks = []
            , calls = [];

        DSL.walk(program, {
            [DSL.NodeType.UsingStatement](node) {
                if(node.permissions.length || null !== node.description)
                    blocks.push({ permissions: node.permissions.slice(), description: node.description, line: node.loc?.line ?? null });
            },

            [DSL.NodeType.JSInvokeExpression](node) {
                calls.push({ path: node.path.join('.'), line: node.loc?.line ?? null });
            },
        });

        return { blocks, calls };
    };

    /** One diagnostic, in the shape the editor relies on. */
    const diagnostic = (error) => ({
        name: error.name,
        message: error.message,
        loc: error.loc,
        frame: (error.codeFrame ? error.codeFrame() : String(error.message)),
    });

    /** Finds a script's mistakes without running it — what the Settings editor underlines as
     * the script is typed.
     *
     * The shape is stable: an array of `{ name, message, loc, frame }`, in source order, empty
     * when the script is clean. `loc` is `{ line, column, start, end }` — `line` and `column`
     * **1-based**, `start` and `end` **0-based** character offsets with `end` exclusive, the
     * same offsets `highlight` uses. `name` is the error class (`DSLSyntaxError`,
     * `DSLParseError`, …); `frame` is a ready monospace excerpt with a caret.
     *
     * Parse errors are all reported (the parser recovers line by line). A lexical fault stops
     * the scan, so it is reported alone. When the script parses cleanly it is also
     * *compiled* — never run — so the mistakes only the compiler sees are caught too: a
     * permission not on the list, an undeclared `setting.name`, an unknown function or too
     * many arguments. Compile mistakes are reported one at a time.
     * @param {String} source
     * @param {{ runtime?: Object }} [options] - compile against the host's runtime, so its
     *   extra permissions and settings count; a default runtime otherwise
     * @return {Array<{ name: String, message: String, loc: Object, frame: String }>}
     */
    DSL.check = (source, { runtime } = {}) => {
        let program;

        try {
            const parsed = DSL.parseTolerant(source);

            if(parsed.errors.length)
                return parsed.errors.map(diagnostic);

            program = parsed.program;
        } catch(error) {
            // A lexical fault aborts the scan outright, so it arrives here instead.
            if(!(error instanceof DSL.errors.DSLError))
                throw error;

            return [diagnostic(error)];
        }

        // Compiling applies budget grants to `limits`; checking must not raise the host's, so
        // it compiles against a view of the runtime with a `limits` of its own.
        const base = (runtime ?? DSL.createRuntime({ logger: { log() {}, warn() {}, error() {} } }))
            , view = Object.create(base, { limits: { value: Object.assign({}, base.limits) } });

        try {
            DSL.compile(program, view);
        } catch(error) {
            if(!(error instanceof DSL.errors.DSLError))
                throw error;

            return [diagnostic(error)];
        }

        return [];
    };

    /** A script's plugin id when it has no header: its file name, cleaned to a settings key.
     * @param {String} [file] - e.g. `raid-shoutouts.ttv` or a full path
     * @return {String}
     */
    const idFromFile = (file) => {
        const base = String(file ?? 'script').split(/[\\/]/).pop().replace(/\.ttv$/i, '')
            , id = base.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');

        return (/^[a-z]/.test(id) ? id : `ttv_${ id || 'script' }`);
    };

    /** The `plugin` header of a script whose body does not scan, or null.
     * @param {String} source
     * @return {?Object}
     */
    const readHeaderAlone = (source) => {
        const rows = String(source).split(/\r?\n/)
            , start = rows.findIndex(row => /^plugin\b/.test(row));

        if(start < 0)
            return null;

        let end = start + 1;

        while(end < rows.length && (/^\s/.test(rows[end]) || /^\s*($|\/\/)/.test(rows[end])))
            ++end;

        try {
            return DSL.parse(rows.slice(start, end).join('\n') + '\n').body[0] ?? null;
        } catch {
            return null;
        }
    };

    /** Reads a script's plugin metadata without running it — what the extension needs to
     * register the script as a plugin and place its settings.
     *
     * `meta` is the plugin definition (`id`, `frames`) plus what a Settings section needs:
     * `settings` in the `SETTINGS.md` schema — the enable toggle under `<id>`, every declared
     * setting under `<id>__<name>` — and a ready-made `section`. `permissions` lists every
     * granting block with its description, for the prompt. A script without a header gets
     * defaults derived from `file`. `diagnostics` is `TTV_DSL.check`'s output; `meta` is still
     * returned when there are diagnostics, as far as the header could be read.
     * @param {String} source
     * @param {{ file?: String }} [options]
     * @return {{ meta: Object, diagnostics: Array<Object> }}
     */
    DSL.inspect = (source, { file } = {}) => {
        let diagnostics = DSL.check(source)
            , header = null
            , permissions = [];

        try {
            const { program } = DSL.parseTolerant(source);

            header = program.body.find(statement => DSL.NodeType.PluginHeader === statement.type) ?? null;

            DSL.walk(program, {
                [DSL.NodeType.UsingStatement](node) {
                    if(node.permissions.length)
                        permissions.push({ permissions: node.permissions.slice(), description: node.description, line: node.loc?.line ?? null });
                },
            });
        } catch(error) {
            if(!(error instanceof DSL.errors.DSLError))
                throw error;

            // A lexical fault anywhere aborts the whole scan. The header is still worth
            // having — the extension needs the id and settings to show the script as broken —
            // so read the header lines on their own: from `plugin` to the first line back at
            // the left margin.
            header = readHeaderAlone(source);
        }

        const id = (header?.id ?? idFromFile(file))
            , name = (header?.name ?? String(file ?? id).split(/[\\/]/).pop().replace(/\.ttv$/i, ''))
            , description = (header?.description ?? null)
            , frames = (header?.frames ?? ['chat'])
            , settings = { [id]: { type: 'checkbox', default: false } }
            , rows = [{ toggle: id }];

        if(description)
            rows.push({ text: description, tr: false });

        for(const setting of (header?.settings ?? [])) {
            const key = `${ id }__${ setting.name }`
                , entry = { type: setting.type };

            // A select marks its default on the option, as `SETTINGS.md` does; the others
            // carry `default` themselves.
            if('select' === setting.type)
                entry.options = setting.options.map(option => Object.assign({ value: option.value, label: option.label }, option.value === setting.default ? { default: true } : {}));
            else
                entry.default = setting.default;

            for(const field of ['min', 'max', 'step', 'unit', 'placeholder'])
                if(field in setting)
                    entry[field] = setting[field];

            settings[key] = entry;
            rows.push({ text: `${ setting.label ?? setting.name }: {{${ key }}}`, tr: false });
        }

        return {
            meta: {
                id,
                name,
                description,
                frames,
                settings,
                section: { title: name, rows, settings },
                permissions,
            },
            diagnostics,
        };
    };
})();

if(typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
