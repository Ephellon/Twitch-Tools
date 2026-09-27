/*** /dsl/tests/harness.js - Zero-dependency test harness for the TTV DSL
 *   _    _            _____   _   _  ______   _____   _____              _   _____
 *  | |  | |    /\    |  __ \ | \ | ||  ____| / ____| / ____|            | | / ____|
 *  | |__| |   /  \   | |__) ||  \| || |__   | (___  | (___              | || (___
 *  |  __  |  / /\ \  |  _  / | . ` ||  __|   \___ \  \___ \         _   | | \___ \
 *  | |  | | / ____ \ | | \ \ | |\  || |____  ____) | ____) |   _   | |__| | ____) |
 *  |_|  |_|/_/    \_\|_|  \_\|_| \_||______||_____/ |_____/   (_)   \____/ |_____/
 */

/** @file A `describe` / `it` / `assert` harness small enough to read in one sitting.
 * The extension ships with no build step and no `node_modules`, so the DSL cannot lean on
 * a third-party runner; this file is the whole testing story for both Node and the browser.
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

globalThis.TTV_DSL ??= {};

(() => {
    /** Every registered suite. */
    let suites = [];

    /** The suite currently being populated by `describe`. */
    let current = null;

    /** Thrown by the `assert` helpers. Distinct from `Error` so an assertion failure is
     * never confused with the code under test blowing up. */
    class AssertionError extends Error {
        constructor(message, actual, expected) {
            super(message);

            this.name = 'AssertionError';
            this.actual = actual;
            this.expected = expected;
        }
    }

    /** Renders a value compactly for failure messages.
     * @param {*} value
     * @return {String}
     */
    let show = (value) => {
        if (typeof value === 'string')
            return JSON.stringify(value);

        if (typeof value === 'function')
            return `[function ${ value.name || 'anonymous' }]`;

        if (value instanceof Error)
            return `${ value.name }: ${ value.message }`;

        try {
            return JSON.stringify(value, (key, entry) => (undefined === entry? '<undefined>': entry)) ?? String(value);
        } catch (error) {
            return String(value);
        }
    };

    /** Structural equality over primitives, arrays, plain objects, `Date`, `RegExp`,
     * `Map` and `Set`.
     * @param {*} actual
     * @param {*} expected
     * @return {Boolean}
     */
    let deepEqual = (actual, expected) => {
        if (Object.is(actual, expected))
            return true;

        if (null == actual || null == expected)
            return false;

        if (typeof actual !== 'object' || typeof expected !== 'object')
            return false;

        if (actual instanceof Date || expected instanceof Date)
            return (actual instanceof Date && expected instanceof Date && actual.getTime() === expected.getTime());

        if (actual instanceof RegExp || expected instanceof RegExp)
            return (actual instanceof RegExp && expected instanceof RegExp && String(actual) === String(expected));

        if (Array.isArray(actual) || Array.isArray(expected)) {
            if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length)
                return false;

            return actual.every((entry, index) => deepEqual(entry, expected[index]));
        }

        if (actual instanceof Set || expected instanceof Set)
            return (actual instanceof Set && expected instanceof Set && deepEqual([...actual], [...expected]));

        if (actual instanceof Map || expected instanceof Map)
            return (actual instanceof Map && expected instanceof Map && deepEqual([...actual], [...expected]));

        let keys = Object.keys(actual),
            others = Object.keys(expected);

        if (keys.length !== others.length)
            return false;

        return keys.every(key => (key in expected) && deepEqual(actual[key], expected[key]));
    };

    /** Recursive *subset* matching: every key present in `expected` must match, but
     * `actual` may carry extra keys. Indispensable for asserting AST shape without having
     * to spell out every `loc` in every test.
     * @param {*} actual
     * @param {*} expected
     * @return {Boolean}
     */
    let matchesShape = (actual, expected) => {
        if (expected instanceof RegExp)
            return expected.test(String(actual));

        if (null === expected || typeof expected !== 'object')
            return Object.is(actual, expected);

        if (null == actual || typeof actual !== 'object')
            return false;

        if (Array.isArray(expected)) {
            if (!Array.isArray(actual) || actual.length !== expected.length)
                return false;

            return expected.every((entry, index) => matchesShape(actual[index], entry));
        }

        return Object.keys(expected).every(key => matchesShape(actual[key], expected[key]));
    };

    const assert = {
        /** @param {*} value @param {String} [message] */
        ok(value, message) {
            if (!value)
                throw new AssertionError(message ?? `Expected a truthy value, got ${ show(value) }`, value, true);
        },

        /** Strict (`Object.is`) equality. */
        equal(actual, expected, message) {
            if (!Object.is(actual, expected))
                throw new AssertionError(message ?? `Expected ${ show(expected) }, got ${ show(actual) }`, actual, expected);
        },

        /** Structural equality. */
        deepEqual(actual, expected, message) {
            if (!deepEqual(actual, expected))
                throw new AssertionError(message ?? `Expected ${ show(expected) }, got ${ show(actual) }`, actual, expected);
        },

        /** Subset matching — see {@link matchesShape}. */
        like(actual, expected, message) {
            if (!matchesShape(actual, expected))
                throw new AssertionError(message ?? `Expected a value matching ${ show(expected) }, got ${ show(actual) }`, actual, expected);
        },

        /** @param {String} value @param {RegExp} pattern @param {String} [message] */
        match(value, pattern, message) {
            if (!pattern.test(String(value)))
                throw new AssertionError(message ?? `Expected ${ show(value) } to match ${ pattern }`, value, pattern);
        },

        /** Asserts that `body` throws.
         * @param {Function} body
         * @param {Function|RegExp} [matcher] - a constructor the error must be an instance
         *   of, or a pattern its message must match
         * @param {String} [message]
         * @return {Error} the caught error, so callers can make further assertions
         */
        throws(body, matcher, message) {
            let caught = null;

            try {
                body();
            } catch (error) {
                caught = error;
            }

            if (null === caught)
                throw new AssertionError(message ?? 'Expected the call to throw, but it returned normally', undefined, matcher);

            if (caught instanceof AssertionError)
                throw caught;

            if (typeof matcher === 'function' && !(caught instanceof matcher))
                throw new AssertionError(message ?? `Expected a ${ matcher.name }, got ${ show(caught) }`, caught, matcher);

            if (matcher instanceof RegExp && !matcher.test(caught.message))
                throw new AssertionError(message ?? `Expected the message to match ${ matcher }, got ${ show(caught.message) }`, caught, matcher);

            return caught;
        },

        /** Unconditional failure. */
        fail(message) {
            throw new AssertionError(message ?? 'Failed');
        },
    };

    /** Opens a suite.
     * @param {String} name
     * @param {Function} body - calls `it` for each case
     */
    let describe = (name, body) => {
        let previous = current;

        current = { name, tests: [] };
        suites.push(current);

        try {
            body();
        } finally {
            current = previous;
        }
    };

    /** Registers a test case inside the current suite.
     * @param {String} name
     * @param {Function} body - may return a promise
     */
    let it = (name, body) => {
        if (null === current)
            throw new Error(`it(${ JSON.stringify(name) }) was called outside of a describe() block`);

        current.tests.push({ name, body, skipped: false });
    };

    /** Registers a case that is reported but never executed.
     * @param {String} name
     * @param {String} [reason]
     */
    it.skip = (name, reason) => {
        if (null === current)
            throw new Error(`it.skip(${ JSON.stringify(name) }) was called outside of a describe() block`);

        current.tests.push({ name, body: null, skipped: true, reason });
    };

    /** Runs every registered suite.
     * @param {Object} [options]
     * @param {function(String): void} [options.log = console.log]
     * @return {Promise<{ passed: Number, failed: Number, skipped: Number, failures: Array }>}
     */
    let run = async ({ log = console.log } = {}) => {
        let passed = 0,
            failed = 0,
            skipped = 0,
            failures = [];

        for (let suite of suites) {
            log(`\n  ${ suite.name }`);

            for (let test of suite.tests) {
                if (test.skipped) {
                    ++skipped;
                    log(`    - ${ test.name }${ test.reason? ` (${ test.reason })`: '' }`);

                    continue;
                }

                try {
                    await test.body();

                    ++passed;
                    log(`    + ${ test.name }`);
                } catch (error) {
                    ++failed;
                    failures.push({ suite: suite.name, test: test.name, error });
                    log(`    x ${ test.name }`);
                    log(`        ${ (error && error.stack)? String(error.stack).split('\n').slice(0, 4).join('\n        '): show(error) }`);
                }
            }
        }

        log(`\n  ${ passed } passed, ${ failed } failed, ${ skipped } skipped\n`);

        return { passed, failed, skipped, failures };
    };

    /** Discards every registered suite. Only useful when re-running in a live page. */
    let reset = () => {
        suites = [];
        current = null;
    };

    globalThis.TTV_DSL.testing = { describe, it, assert, run, reset, deepEqual, matchesShape, AssertionError };

    // Test files read far better without a `TTV_DSL.testing.` prefix on every line.
    globalThis.describe = describe;
    globalThis.it = it;
    globalThis.assert = assert;
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
