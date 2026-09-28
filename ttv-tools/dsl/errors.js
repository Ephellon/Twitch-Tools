/*** /dsl/errors.js - Error types and source-location reporting for the TTV DSL
 *   ______  _____   _____    ____   _____    _____              _   _____
 *  |  ____||  __ \ |  __ \  / __ \ |  __ \  / ____|            | | / ____|
 *  | |__   | |__) || |__) || |  | || |__) || (___              | || (___
 *  |  __|  |  _  / |  _  / | |  | ||  _  /  \___ \         _   | | \___ \
 *  | |____ | | \ \ | | \ \ | |__| || | \ \  ____) |   _   | |__| | ____) |
 *  |______||_|  \_\|_|  \_\ \____/ |_|  \_\|_____/   (_)   \____/ |_____/
 */

/** @file Defines the error hierarchy for the TTV DSL. Every error carries a source
 * location so the (future) settings-page script editor can underline the offending
 * span without the compiler having to be retrofitted.
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

globalThis.TTV_DSL ??= {};

(() => {
    /** The number of source lines shown on either side of the offending line. */
    const CONTEXT_LINES = 2;

    /** Clamps a value into an inclusive range.
     * @param {Number} value
     * @param {Number} low
     * @param {Number} high
     * @return {Number}
     */
    const clamp = (value, low, high) => (value < low ? low : value > high ? high : value);

    /** Normalizes a partial location object into a complete one.
     * @param {Object} [loc]
     * @return {{ line: Number, column: Number, start: Number, end: Number }}
     */
    const normalizeLocation = (loc) => {
        loc ??= {};

        const start = (loc.start | 0)
            , end = (null == loc.end ? start : loc.end | 0);

        return {
            line: (loc.line | 0) || 1,
            column: (loc.column | 0) || 1,
            start,
            end: (end < start ? start : end),
        };
    };

    /** The base class for everything the DSL throws. Never thrown directly. */
    class DSLError extends Error {
        /**
         * @param {String} message - human readable description of the fault
         * @param {Object} [loc] - `{ line, column, start, end }`; missing fields are filled in
         * @param {String} [source] - the complete script text, retained for `codeFrame`
         */
        constructor(message, loc, source) {
            super(message);

            this.name = new.target.name;
            this.loc = normalizeLocation(loc);
            this.source = (null == source ? '' : String(source));

            // `Error` is not reliably subclassable across every engine this ships to.
            if(typeof Error.captureStackTrace === 'function')
                Error.captureStackTrace(this, new.target);
        }

        /** Renders a caret-underlined excerpt of the offending source.
         * @param {Object} [options]
         * @param {Number} [options.context = 2] - lines of context on either side
         * @param {Boolean} [options.header = true] - prefix the frame with `Name: message`
         * @return {String} a multi-line string, or just the header when no source is available
         */
        codeFrame({ context = CONTEXT_LINES, header = true } = {}) {
            const head = `${ this.name }: ${ this.message } (${ this.loc.line }:${ this.loc.column })`;

            if(!this.source.length)
                return (header ? head : '');

            const lines = this.source.split(/\r\n|\r|\n/)
                , target = clamp(this.loc.line, 1, lines.length)
                , first = clamp(target - context, 1, lines.length)
                , last = clamp(target + context, 1, lines.length)
                , gutter = String(last).length
                , frame = [];

            for(let n = first; n <= last; ++n) {
                const text = lines[n - 1]
                    , number = String(n).padStart(gutter, ' ')
                    , marker = (n === target ? '>' : ' ');

                frame.push(`${ marker } ${ number } | ${ text }`);

                if(n !== target)
                    continue;

                // The span may run past the end of the line (or be zero-width at EOF);
                // always underline at least one column so the caret is visible.
                const column = clamp(this.loc.column, 1, text.length + 1)
                    , width = clamp((this.loc.end - this.loc.start) || 1, 1, (text.length - column) + 2);

                frame.push(`  ${ ' '.repeat(gutter) } | ${ ' '.repeat(column - 1) }${ '^'.repeat(width) }`);
            }

            return (header ? [head, ...frame] : frame).join('\n');
        }

        /** A plain, structured-clone-safe view of the error, for `postMessage` and storage.
         * @return {Object}
         */
        toJSON() {
            return {
                name: this.name,
                message: this.message,
                loc: { ...this.loc },
            };
        }

        /** @return {String} */
        toString() {
            return `${ this.name }: ${ this.message } (${ this.loc.line }:${ this.loc.column })`;
        }
    }

    /** Raised by the tokenizer: an unrecognizable character, bad indentation, or an
     * unterminated string/template. */
    class DSLSyntaxError extends DSLError {}

    /** Raised by the parser: the token stream is well-formed but ungrammatical. */
    class DSLParseError extends DSLError {}

    /** Raised while a compiled script is executing. */
    class DSLRuntimeError extends DSLError {}

    /** Raised when a script exceeds its step budget or wall-clock budget. Kept distinct
     * from `DSLRuntimeError` so a host can treat runaway scripts differently from buggy
     * ones (throttle vs. surface to the user). */
    class DSLLimitError extends DSLError {}

    /** Raised when a script reaches for something its `using` header was never granted.
     *
     * Split out of `DSLRuntimeError` for the same reason `DSLLimitError` is: a host wants to
     * treat "this script asked for a capability you did not give it" as a permissions
     * prompt, not as a bug report. Matching is always exact — `+eval` never implies
     * `eval:calc` — so this error is a reliable signal that a grant is genuinely missing
     * rather than merely misspelled at the wrong granularity. */
    class DSLPermissionError extends DSLError {}

    globalThis.TTV_DSL.errors = {
        DSLError,
        DSLSyntaxError,
        DSLParseError,
        DSLRuntimeError,
        DSLLimitError,
        DSLPermissionError,
    };
})();

if(typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
