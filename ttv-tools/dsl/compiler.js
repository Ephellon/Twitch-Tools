/*** /dsl/compiler.js - Lowers the AST into a tree of JavaScript closures
 *    _____   ____   __  __  _____   _____  _       ______  _____               _   _____
 *   / ____| / __ \ |  \/  ||  __ \ |_   _|| |     |  ____||  __ \             | | / ____|
 *  | |     | |  | || \  / || |__) |  | |  | |     | |__   | |__) |            | || (___
 *  | |     | |  | || |\/| ||  ___/   | |  | |     |  __|  |  _  /         _   | | \___ \
 *  | |____ | |__| || |  | || |      _| |_ | |____ | |____ | | \ \    _   | |__| | ____) |
 *   \_____| \____/ |_|  |_||_|     |_____||______||______||_|  \_\  (_)   \____/ |_____/
 */

/** @file Turns an AST into nested closures. There is no code generation anywhere in this
 * file — a Chrome extension may not call `eval` or `new Function` under a sane content
 * security policy, so every node becomes a real JavaScript function instead of a string.
 *
 * The important decision here is how `.prop` resolves. Each `using`, `await` and `where`
 * opens a lexical scope, and the compiler assigns it a fixed depth. A `.prop` inside that
 * scope compiles to a read of `context.subjects[depth]` with `depth` baked in at compile
 * time. It is *not* a dynamic "innermost subject" lookup: a `where` filter nested inside an
 * `await` body therefore cannot accidentally see the event when it meant the list item.
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

globalThis.TTV_DSL ??= {};

if (typeof require === 'function' && typeof module === 'object') {
    require('./errors.js');
    require('./tokens.js');
    require('./ast.js');
    require('./parser.js');
    require('./runtime.js');
}

(() => {
    const { DSLRuntimeError, DSLLimitError, DSLError } = globalThis.TTV_DSL.errors;
    const { NodeType } = globalThis.TTV_DSL.ast;
    const { VARIABLE_PATTERN, DEFAULT_SCOPE_MODE } = globalThis.TTV_DSL.tokens;

    /** The value `*` / `ANYTHING` evaluates to. A symbol, so no script-visible value can
     * impersonate it. */
    const WILDCARD = Symbol('TTV_DSL.wildcard');

    /** `SOMETHING` — present and not empty. */
    const SOMETHING = Symbol('TTV_DSL.something');

    /** `NOTHING` — absent, `""` or `[]`. */
    const NOTHING = Symbol('TTV_DSL.nothing');

    /** The three presence tests, by the `kind` a `Wildcard` node carries. */
    const PRESENCE = Object.freeze({ anything: WILDCARD, something: SOMETHING, nothing: NOTHING });

    /** Property names a member read may never traverse — the same set the host-path walk
     * refuses, for the same reason: a read of `constructor` hands back a function. */
    const FORBIDDEN_MEMBERS = Object.freeze(new Set(['__proto__', 'prototype', 'constructor']));

    /** Distinguishes "this name is bound to `undefined`" from "this name is not bound".
     * Never escapes this module. */
    const UNBOUND = Symbol('TTV_DSL.unbound');

    /** The wrapper `=` puts around an operand to make the comparison case-sensitive.
     *
     * A wrapper rather than a flag on the operator, because `=` is a prefix on the *value*:
     * it reads the way the script is written (`is ='TeXt'`), and it composes with `in` and
     * with `when` case labels without any of them having to know it exists. */
    class Exact {
        constructor(value) {
            this.value = value;
        }
    }

    /** @param {*} value @return {Boolean} */
    let isExact = (value) => (value instanceof Exact);

    /** @param {*} value @return {*} */
    let unwrap = (value) => (isExact(value)? value.value: value);

    /** @param {*} value @return {Boolean} */
    let isEmpty = (value) => (null == value || '' === value || (Array.isArray(value) && !value.length));

    /** @param {*} value @return {Boolean} */
    let isPresence = (value) => (WILDCARD === value || SOMETHING === value || NOTHING === value);

    /** Answers a presence test against a value.
     * @param {Symbol} test - `WILDCARD`, `SOMETHING` or `NOTHING`
     * @param {*} value
     * @return {Boolean}
     */
    let present = (test, value) => {
        if (NOTHING === test)
            return isEmpty(value);

        if (SOMETHING === test)
            return !isEmpty(value);

        // `ANYTHING` — any value at all, `""` and `[]` included; only absence fails.
        return (null != value);
    };

    /** Truthiness, DSL-flavoured: an empty list is false, `*` / `SOMETHING` are true and
     * `NOTHING` is false.
     * @param {*} value
     * @return {Boolean}
     */
    let truthy = (value) => {
        if (isPresence(value))
            return (NOTHING !== value);

        return (Array.isArray(value)? value.length > 0: !!value);
    };

    /** Reads a value as a number for `above` / `below`.
     *
     * Numbers and durations (already milliseconds) pass through; a string is read as a
     * number, then as a duration (`"5:00"`, `"90s"`). Anything else — a missing value, a
     * boolean, a list, an unreadable string — is `NaN`, which every comparison answers
     * `false` to. Never an error: a comparison against a value that is not there is a
     * question with the answer "no".
     * @param {*} value
     * @param {Object} runtime
     * @return {Number}
     */
    let toNumber = (value, runtime) => {
        value = unwrap(value);

        if (typeof value === 'number')
            return value;

        if (typeof value !== 'string' || !value.trim().length)
            return NaN;

        let number = Number(value.trim());

        if (!Number.isNaN(number))
            return number;

        try {
            return runtime.parseDuration(value);
        } catch {
            return NaN;
        }
    };

    /** The four numeric comparisons, keyed by the operator the parser recorded. */
    const COMPARISONS = Object.freeze({
        'above': (left, right) => (left > right),
        'below': (left, right) => (left < right),
        'or above': (left, right) => (left >= right),
        'or below': (left, right) => (left <= right),
    });

    /** Renders a value for interpolation and for message text.
     * @param {*} value
     * @return {String}
     */
    let stringify = (value) => {
        if (isExact(value))
            return stringify(value.value);

        if (null == value)
            return '';

        if (WILDCARD === value)
            return '*';

        if (SOMETHING === value)
            return 'SOMETHING';

        if (NOTHING === value)
            return 'NOTHING';

        if (Array.isArray(value))
            return value.map(stringify).join(', ');

        if (typeof value === 'object')
            return String(value.name ?? value.text ?? value.href ?? JSON.stringify(value));

        return String(value);
    };

    /** Equality.
     *
     * Strings compare case-insensitively, because every identifier this language actually
     * compares — channel names, user names, commands — is case-insensitive on Twitch, and
     * the mockup leans on it (`.sender is "Jjay_89"`).
     * @param {*} left
     * @param {*} right
     * @return {Boolean}
     */
    let equals = (left, right) => {
        // `=` on *either* side makes the whole comparison exact. One side asking for it is
        // enough: `#name is =NAME_VAR` and `=#name is NAME_VAR` say the same thing.
        if (isExact(left) || isExact(right)) {
            let exactLeft = unwrap(left),
                exactRight = unwrap(right);

            if (isPresence(exactRight))
                return present(exactRight, exactLeft);

            if (isPresence(exactLeft))
                return present(exactLeft, exactRight);

            if (null == exactLeft || null == exactRight)
                return (exactLeft === exactRight);

            return (stringify(exactLeft) === stringify(exactRight));
        }

        if (isPresence(right))
            return present(right, left);

        if (isPresence(left))
            return present(left, right);

        if (typeof left === 'string' && typeof right === 'string')
            return (left.toLowerCase() === right.toLowerCase());

        if (null != left && null != right && typeof left === 'object' && typeof right === 'object')
            return (left === right || (null != left.name && left.name === right.name));

        if (typeof left === 'object' || typeof right === 'object')
            return equals(stringify(left), stringify(right));

        // eslint-disable-next-line eqeqeq
        return (left == right);
    };

    /** Membership. A string haystack means substring; an array means "any element equals".
     * @param {*} needle
     * @param {*} haystack
     * @return {Boolean}
     */
    let contains = (needle, haystack) => {
        if (isExact(needle) || isExact(haystack)) {
            let exactNeedle = unwrap(needle),
                exactHaystack = unwrap(haystack);

            if (isPresence(exactHaystack))
                return present(exactHaystack, exactNeedle);

            if (null == exactHaystack)
                return false;

            if (typeof exactHaystack === 'string')
                return exactHaystack.includes(stringify(exactNeedle));

            if (Array.isArray(exactHaystack))
                return exactHaystack.some(entry => equals(new Exact(entry), exactNeedle));

            if (typeof exactHaystack === 'object')
                return (stringify(exactNeedle) in exactHaystack);

            return false;
        }

        if (isPresence(haystack))
            return present(haystack, needle);

        if (null == haystack)
            return false;

        if (typeof haystack === 'string')
            return haystack.toLowerCase().includes(stringify(needle).toLowerCase());

        if (Array.isArray(haystack))
            return haystack.some(entry => equals(entry, needle));

        if (typeof haystack === 'object')
            return (stringify(needle) in haystack);

        return false;
    };

    /** Coerces a value into something indexable. */
    let toList = (value) => (Array.isArray(value)? value: (null == value? []: [value]));

    /** Applies a 0-based index, counting from the end when negative. */
    let at = (list, index) => {
        let items = toList(list);

        return (index < 0? items[items.length + index]: items[index]);
    };

    /** Compiles an AST into a closure tree.
     * @param {Object} node - usually a `Program`
     * @param {Object} runtime - from `createRuntime`
     * @return {Function} `async (context) => value`
     */
    let compile = (node, runtime) => compileNode(node, { runtime, depth: 0, parentDepth: null, permissions: EMPTY_PERMISSIONS, mode: DEFAULT_SCOPE_MODE });

    /** The grant set a program starts with: nothing. */
    const EMPTY_PERMISSIONS = Object.freeze(new Set());

    /** @param {Object} node @param {Object} scope @return {Function} */
    let compileNode = (node, scope) => {
        if (null == node)
            return null;

        let build = COMPILERS[node.type];

        if (!build)
            throw new DSLRuntimeError(`No compiler for node type ${ JSON.stringify(node.type) }`, node.loc);

        return build(node, scope);
    };

    /** Compiles a list of nodes at the same scope. */
    let compileAll = (nodes, scope) => (nodes ?? []).map(entry => compileNode(entry, scope));

    /** Opens a nested lexical scope — one deeper subject slot.
     *
     * `parentDepth` remembers the slot one level out, which is where a `+scope:global`
     * binding lands so that later *siblings* still see it. `mode` is the `+scope` rule in
     * force, inherited unchanged by every nested scope.
     * @param {Object} scope
     * @param {Object} [extra] - fields to override, e.g. a widened permission set
     * @return {Object}
     */
    let inner = (scope, extra) => Object.assign({
        runtime: scope.runtime,
        depth: scope.depth + 1,
        parentDepth: scope.depth,
        permissions: scope.permissions,
        mode: scope.mode,
    }, extra);

    /** Which env slot a binding made in `scope` writes to. Both arrows ask the same
     * question; only the `+scope` mode answers it.
     *
     * | mode        | slot          | visible to                                   |
     * |-------------|---------------|----------------------------------------------|
     * | `local`     | `depth`       | this block and what it nests                 |
     * | `global`    | `parentDepth` | this block, its siblings, and what they nest |
     * | `universal` | `0`           | every block in the script                    |
     *
     * At the top level there is no parent, so `global` falls back to the top slot — which
     * is already visible to everything.
     * @param {Object} scope
     * @return {Number}
     */
    let bindingSlot = (scope) => {
        switch (scope.mode) {
            case 'local':
                return scope.depth;

            case 'universal':
                return 0;

            default:
                return (scope.parentDepth ?? scope.depth);
        }
    };

    /** Reads a variable by walking outward from the scope it was referenced in.
     *
     * Slots are shared by reference between sibling subtrees (see `runtime.createContext`),
     * so an outward walk is all that separates "visible to my descendants" from "visible to
     * my later siblings too" — the `+scope` modes differ only in which slot they write to.
     * @return {*} the bound value, or `UNBOUND`
     */
    let readVariable = (context, depth, name) => {
        let envs = context.envs;

        if (!envs || !envs.length)
            return UNBOUND;

        for (let level = Math.min(depth, envs.length - 1); level >= 0; --level) {
            let env = envs[level];

            if (env && env.has(name))
                return env.get(name);
        }

        return UNBOUND;
    };

    /** Writes a variable into a fixed slot.
     *
     * The slot index comes from the compiler, but the context at hand may be shallower than
     * the scope the binding was compiled in — a `where` filter reached through a different
     * path, say — so the index is clamped rather than trusted. A binding always lands
     * somewhere real.
     */
    let bindVariable = (context, slot, name, value) => {
        let envs = context.envs;

        if (!envs || !envs.length)
            return value;

        envs[Math.min(slot, envs.length - 1)].set(name, value);

        return value;
    };

    /** Decides whether an `await` statement, reached with `context`, should install.
     *
     * At the top level there is no enclosing `await`, and every execution installs — the
     * top level only runs once. Inside another `await`'s body, the body re-runs every time
     * that `await` fires; installing again each time would pile up handlers without bound.
     * So a nested `await` installs **once per site** — per statement, per loop iteration —
     * and every later arrival only refreshes the context the installed handler builds on,
     * so its outer `.prop`s read the most recent outer event.
     * @param {Object} node - the `AwaitStatement`
     * @param {Object} context
     * @return {?Object} a fresh site `{ base }` to install on, or null when already installed
     */
    let claimSite = (node, context) => {
        let hold = context.hold;

        if (!hold)
            return { base: context };

        let routes = hold.sites.get(node);

        if (!routes)
            hold.sites.set(node, routes = new Map());

        let site = routes.get(context.route);

        if (site) {
            site.base = context;

            return null;
        }

        routes.set(context.route, site = { base: context });

        return site;
    };

    /** Builds the installation record an `await` hands to its body.
     *
     * `admits(event)` is the `with (...)` rule: an `await ... with (<filter>)` keeps its
     * filter in force for everything nested inside it, so a nested handler only fires while
     * every enclosing filter still holds — which is what makes `await * with (#live is true)`
     * mean "while live". The *trigger* is deliberately not re-checked: `await (.command is
     * "start")` around a nested `await` means "after `!start`", and re-testing the trigger
     * against every later event would make that nested handler unreachable.
     * @param {?Object} parent - the enclosing installation
     * @param {?Function} filter - the compiled `with` filter, if any
     * @param {Object} site - `{ base }`, whose `base` may be refreshed later
     * @return {Object}
     */
    let installation = (parent, filter, site) => ({
        sites: new Map(),

        async admits(event) {
            if (parent && !(await parent.admits(event)))
                return false;

            return (!filter || truthy(await filter(site.base.child(event))));
        },
    });

    /** Runs a list of statement closures in order, charging one step each. */
    let sequence = (statements, runtime, loc) => async (context) => {
        for (let statement of statements) {
            if (context.signal.aborted)
                return;

            runtime.step(loc);

            await statement(context);
        }
    };

    /** Wraps a detached loop or handler so a fault is reported once and the script stops
     * rather than surfacing as an unhandled rejection. */
    let guard = (runtime, context, loc) => (error) => {
        let failure = (error instanceof DSLError? error: new DSLRuntimeError(String(error?.message ?? error), loc));

        runtime.logger.error(failure.codeFrame? failure.codeFrame(): failure);

        if (failure instanceof DSLLimitError)
            context.stop();
    };

    const COMPILERS = {
        [NodeType.Program](node, scope) {
            let body = compileAll(node.body, scope);

            return sequence(body, scope.runtime, node.loc);
        },

        [NodeType.Block](node, scope) {
            let body = compileAll(node.body, scope);

            return sequence(body, scope.runtime, node.loc);
        },

        /** `await` installs a recurring trigger and returns immediately, so the statements
         * after it still get a chance to install theirs. A duration awaits the clock; an
         * expression awaits an event that satisfies it. */
        [NodeType.AwaitStatement](node, scope) {
            let { runtime } = scope,
                nested = inner(scope),
                filter = compileNode(node.filter, nested),
                body = compileNode(node.body, nested);

            // The duration-vs-event decision is made *syntactically*, so an assignment
            // wrapped around the subject would silently turn `await (5:00 -> wait_time)`
            // into an event-await that never fires. Look through the binding, then bind the
            // name once at install time and carry on with the duration underneath.
            let bare = node.subject,
                binding = null;

            if (NodeType.AssignmentExpression === bare.type) {
                binding = bare;
                bare = bare.value;
            }

            if (NodeType.Duration === bare.type) {
                let milliseconds = bare.milliseconds,
                    bind = (binding? compileNode(binding, scope): null);

                return async (context) => {
                    let site = claimSite(node, context);

                    if (!site)
                        return;

                    if (bind)
                        await bind(context);

                    let parent = context.hold,
                        own = installation(parent, filter, site);

                    let loop = async () => {
                        while (!context.signal.aborted) {
                            if (!await runtime.sleep(milliseconds, context.signal))
                                return;

                            // Each tick is a fresh turn with a fresh budget; the minutes
                            // spent waiting are not the script's to account for.
                            runtime.beginTurn();
                            runtime.step(node.loc);

                            let tick = { at: runtime.now(), kind: 'tick' },
                                base = site.base;

                            if (parent && !(await parent.admits(tick)))
                                continue;

                            let child = base.child(tick, { channel: base.channel, hold: own, route: '' });

                            if (filter && !truthy(await filter(child)))
                                continue;

                            if (body)
                                await body(child);
                        }
                    };

                    loop().catch(guard(runtime, context, node.loc));
                };
            }

            let condition = compileNode(node.subject, nested);

            return async (context) => {
                let site = claimSite(node, context);

                if (!site)
                    return;

                let parent = context.hold,
                    own = installation(parent, filter, site);

                let off = runtime.subscribe(async (event) => {
                    if (context.signal.aborted)
                        return;

                    try {
                        // Handling one event is one turn.
                        runtime.beginTurn();
                        runtime.step(node.loc);

                        if (parent && !(await parent.admits(event)))
                            return;

                        let child = site.base.child(event, { hold: own, route: '' });

                        if (!truthy(await condition(child)))
                            return;

                        if (filter && !truthy(await filter(child)))
                            return;

                        if (body)
                            await body(child);
                    } catch (error) {
                        guard(runtime, context, node.loc)(error);
                    }
                });

                context.onAbort(off);
            };
        },

        /** `using` binds each subject in turn and runs the body under it. Several subjects
         * on one line mean "any of these", so the body runs once per subject that resolves.
         * With no subject at all — `using +read:datetime`, `using +scope:local` — the body
         * runs once under the subject already in force. */
        [NodeType.UsingStatement](node, scope) {
            let { runtime } = scope,
                subjects = compileAll(node.subjects, scope),
                keep = !subjects.length;

            // Grants accumulate strictly downward: a block sees its own plus every
            // ancestor's, and never a sibling's. The union is computed once, here, and
            // frozen — a `Set` the runtime can only ask `has` of.
            let own = (node.permissions ?? []),
                granted = (own.length? Object.freeze(new Set([...scope.permissions, ...own])): scope.permissions);

            // Against the fixed list, at compile time: a mistyped grant stops the script
            // before anything runs, instead of silently granting nothing.
            for (let grant of own)
                runtime.checkGrant(grant, node.loc);

            let nested = inner(scope, { permissions: granted, mode: (node.scopeMode ?? scope.mode) }),
                body = compileNode(node.body, nested);

            // A badge is a *gate*, not a subject. `using [moderator]` asks "does the sender
            // hold this?" and, if so, runs the body under the subject already in force — so
            // `.command` inside it still reads the message. Rebinding the subject to the
            // badge name instead would make every `.prop` inside read off a string.
            let gates = node.subjects.map(entry => (NodeType.Selector === entry.type && 'badge' === entry.kind));

            return async (context) => {
                if (keep) {
                    runtime.step(node.loc);

                    if (body)
                        await body(context.child(context.subject, { channel: context.channel, permissions: granted }));

                    return;
                }

                for (let index = 0; index < subjects.length; ++index) {
                    if (context.signal.aborted)
                        return;

                    runtime.step(node.loc);

                    let value = await subjects[index](context),
                        route = `${ context.route }/${ index }`;

                    // A badge the viewer does not hold, or a channel that does not exist,
                    // simply contributes no iteration.
                    if (null == value)
                        continue;

                    if (!body)
                        continue;

                    if (gates[index]) {
                        await body(context.child(context.subject, { channel: context.channel, permissions: granted, route }));

                        continue;
                    }

                    if (WILDCARD === value)
                        value = (context.subject ?? context.channel);

                    await body(context.child(value, { permissions: granted, route }));
                }
            };
        },

        [NodeType.IfStatement](node, scope) {
            // `if` does not rebind the subject, so it shares its parent's scope depth.
            let { runtime } = scope,
                test = compileNode(node.test, scope),
                body = compileNode(node.body, scope),
                alternate = compileNode(node.alternate, scope);

            return async (context) => {
                runtime.step(node.loc);

                if (truthy(await test(context))) {
                    if (body)
                        await body(context);

                    return;
                }

                if (alternate)
                    await alternate(context);
            };
        },

        /** Both forms of `when`. Neither rebinds the subject, so both stay at their parent's
         * depth — a case body reads the same `.prop` the head compared. */
        [NodeType.WhenStatement](node, scope) {
            let { runtime } = scope,
                alternate = compileNode(node.alternate, scope);

            // Chain form: this is somebody's `alternate`, and behaves as an `if`.
            if (null === node.operator) {
                let test = compileNode(node.discriminant, scope),
                    body = compileNode(node.body, scope);

                return async (context) => {
                    runtime.step(node.loc);

                    if (truthy(await test(context))) {
                        if (body)
                            await body(context);

                        return;
                    }

                    if (alternate)
                        await alternate(context);
                };
            }

            let discriminant = compileNode(node.discriminant, scope),
                matches = ('in' === node.operator? contains: equals),
                cases = node.cases.map(entry => ({
                    test: compileNode(entry.test, scope),
                    body: compileNode(entry.body, scope),
                }));

            return async (context) => {
                runtime.step(node.loc);

                let value = await discriminant(context);

                for (let entry of cases) {
                    runtime.step(node.loc);

                    // A `*` label needs no special case: `equals(x, WILDCARD)` already
                    // means "x is present", which is precisely what a default should ask.
                    if (!matches(value, await entry.test(context)))
                        continue;

                    if (entry.body)
                        await entry.body(context);

                    return;
                }

                if (alternate)
                    await alternate(context);
            };
        },

        /** `with (<expr>)` + block.
         *
         * One rule covers both readings the language promises. A **boolean** is a test, so
         * the block runs once under the current subject when it holds — which is what makes
         * `with (#live is true)` equivalent to `using * where (#live is true)`. Anything
         * else is a collection, so the block runs once per element with that element bound —
         * which is what makes `with (.links | "twitch.tv" in .href)` iterate the matches.
         * Branching on the *result* rather than on the syntax is why one statement can mean
         * both without the script having to say which. */
        [NodeType.WithStatement](node, scope) {
            let { runtime } = scope,
                filter = compileNode(node.filter, scope),
                body = compileNode(node.body, inner(scope));

            return async (context) => {
                runtime.step(node.loc);

                let value = await filter(context);

                if (!body)
                    return;

                if (typeof value === 'boolean' || WILDCARD === value) {
                    if (truthy(value))
                        await body(context.child(context.subject));

                    return;
                }

                let items = toList(value);

                for (let index = 0; index < items.length; ++index) {
                    if (context.signal.aborted)
                        return;

                    runtime.step(node.loc);

                    // Routed by position, so a nested `await` installs once per slot — the
                    // count stays bounded by the longest list seen, not by how often it ran.
                    await body(context.child(items[index], { route: `${ context.route }/w${ index }` }));
                }
            };
        },

        /** `else` — reached only as some chain's final `alternate`, so it has no test. */
        [NodeType.ElseClause](node, scope) {
            let body = compileNode(node.body, scope);

            return async (context) => {
                if (body)
                    await body(context);
            };
        },

        [NodeType.ExpressionStatement](node, scope) {
            let { runtime } = scope,
                expression = compileNode(node.expression, scope);

            return async (context) => {
                runtime.step(node.loc);

                await expression(context);
            };
        },

        [NodeType.GotoStatement](node, scope) {
            let { runtime } = scope,
                target = compileNode(node.target, scope);

            return async (context) => {
                runtime.step(node.loc);

                return runtime.goto(await target(context), context, node.loc);
            };
        },

        [NodeType.VerbStatement](node, scope) {
            let { runtime } = scope,
                argument = compileNode(node.argument, scope);

            return async (context) => {
                runtime.step(node.loc);

                let value = (argument? await argument(context): null);

                return runtime.invokeVerb(node.verb, context, value, node.loc);
            };
        },

        [NodeType.BinaryExpression](node, scope) {
            let left = compileNode(node.left, scope),
                right = compileNode(node.right, scope);

            switch (node.operator) {
                case 'or':
                    return async (context) => (truthy(await left(context)) || truthy(await right(context)));

                case 'and':
                    return async (context) => (truthy(await left(context)) && truthy(await right(context)));

                case 'is':
                    return async (context) => equals(await left(context), await right(context));

                case 'in':
                    return async (context) => contains(await left(context), await right(context));

                case 'above':
                case 'below':
                case 'or above':
                case 'or below': {
                    let { runtime } = scope,
                        compare = COMPARISONS[node.operator];

                    // `NaN` on either side answers every comparison `false`, which is the
                    // whole of the missing-value rule.
                    return async (context) => compare(toNumber(await left(context), runtime), toNumber(await right(context), runtime));
                }

                default:
                    throw new DSLRuntimeError(`Unsupported operator ${ JSON.stringify(node.operator) }`, node.loc);
            }
        },

        [NodeType.UnaryExpression](node, scope) {
            let argument = compileNode(node.argument, scope);

            if ('not' === node.operator)
                return async (context) => !truthy(await argument(context));

            if ('=' === node.operator)
                return async (context) => new Exact(await argument(context));

            return async (context) => -Number(await argument(context));
        },

        /** `<value> -> name` / `<value> => name` — synonyms. Where the name lands is the
         * `+scope` mode's decision, not the arrow's (see {@link bindingSlot}).
         *
         * Evaluates to the value it bound, which is the whole reason this is an expression:
         * `await (5:00 -> wait_time)` has to hand the duration on after recording it. */
        [NodeType.AssignmentExpression](node, scope) {
            let value = compileNode(node.value, scope),
                slot = bindingSlot(scope),
                { name } = node;

            return async (context) => {
                let result = await value(context);

                bindVariable(context, slot, name, result);

                return result;
            };
        },

        /** `_` / `__this__` / `__self__` / `__me__` — the subject slot itself, with the
         * depth baked in at compile time exactly as `.prop` does. */
        [NodeType.This](node, scope) {
            let depth = scope.depth;

            return async (context) => context.subjects[depth];
        },

        /** `&Path.fn( ... )`. The path is data all the way down: the runtime walks a host
         * binding table and calls what it finds. No text ever becomes code. */
        [NodeType.JSInvokeExpression](node, scope) {
            let { runtime } = scope,
                args = compileAll(node.arguments, scope),
                { path } = node;

            return async (context) => {
                let values = [];

                for (let resolve of args)
                    values.push(unwrap(await resolve(context)));

                return runtime.invokeJS(path, values, context, node.loc);
            };
        },

        /** `<subject> %… <replacement>`. A list joins; anything else is trimmed and has its
         * matching runs replaced. */
        [NodeType.PercentExpression](node, scope) {
            let { runtime } = scope,
                subject = compileNode(node.subject, scope),
                replacement = compileNode(node.replacement, scope),
                { letters } = node;

            return async (context) => {
                let value = await subject(context),
                    text = stringify(await replacement(context));

                return runtime.percent((Array.isArray(value)? value.map(stringify): stringify(value)), letters, text, node.loc);
            };
        },

        /** `.raider.name` — reads a property off whatever the expression produced. A missing
         * link anywhere in the chain reads as empty, exactly as `.prop` on a null subject
         * does. */
        [NodeType.MemberExpression](node, scope) {
            let object = compileNode(node.object, scope),
                { property } = node;

            if (FORBIDDEN_MEMBERS.has(property))
                throw new DSLRuntimeError(`\`.${ property }\` may never be read`, node.loc);

            return async (context) => {
                let value = unwrap(await object(context));

                if (null == value || typeof value !== 'object')
                    return undefined;

                return value[property];
            };
        },

        /** `<subject> where (<filter>)` — the filter runs once per item, one scope deeper,
         * so `.href` inside it means the item's property. */
        [NodeType.WhereExpression](node, scope) {
            let { runtime } = scope,
                subject = compileNode(node.subject, scope),
                filter = compileNode(node.filter, inner(scope));

            return async (context) => {
                let items = toList(await subject(context)),
                    kept = [];

                for (let item of items) {
                    runtime.step(node.loc);

                    if (truthy(await filter(context.child(item))))
                        kept.push(item);
                }

                return kept;
            };
        },

        /** `<accessor> <| <collection>`. An ordinal on the left indexes the collection;
         * anything else is evaluated with the collection as its subject. */
        [NodeType.PipeExpression](node, scope) {
            let right = compileNode(node.right, scope);

            if (NodeType.OrdinalIndex === node.left.type) {
                let index = node.left.index;

                return async (context) => at(await right(context), index);
            }

            let left = compileNode(node.left, inner(scope));

            return async (context) => left(context.child(await right(context)));
        },

        [NodeType.RangeExpression](node, scope) {
            let { runtime } = scope,
                start = compileNode(node.start, scope),
                end = compileNode(node.end, scope);

            return async (context) => runtime.range(await start(context), await end(context), node.inclusive, node.loc);
        },

        /** `any from ( ... )`. A range item contributes all of its members to the pool, so
         * `any from (1 .. 10)` chooses a number rather than choosing the list. */
        [NodeType.AnyFromExpression](node, scope) {
            let { runtime } = scope,
                items = compileAll(node.items, scope);

            return async (context) => {
                let pool = [];

                for (let resolve of items) {
                    let value = await resolve(context);

                    if (Array.isArray(value))
                        pool.push(...value);
                    else
                        pool.push(value);
                }

                return runtime.pick(pool, node.loc);
            };
        },

        [NodeType.OrdinalIndex](node) {
            let { index } = node;

            return async () => index;
        },

        [NodeType.Selector](node, scope) {
            return compileSelector(node, scope);
        },

        [NodeType.TemplateLiteral](node, scope) {
            let { quasis } = node,
                expressions = compileAll(node.expressions, scope);

            return async (context) => {
                let text = quasis[0];

                for (let index = 0; index < expressions.length; ++index)
                    text += stringify(await expressions[index](context)) + quasis[index + 1];

                return text;
            };
        },

        [NodeType.Literal](node) {
            let { value } = node;

            return async () => value;
        },

        /** A bare word: a variable, or a host constant.
         *
         * The shape of the name decides which lookups are even attempted. A name with an
         * interior underscore is variable-shaped, so it resolves variable-then-constant and
         * yields empty when neither has it — reading an unbound variable is *not* an error,
         * for the same reason `.prop` on a null subject is not: the script that wrote it is
         * describing a shape, and a script may perfectly well install a handler whose
         * sibling can never observe what it bound. A name without one can only be a
         * constant, and an unknown constant still fails loudly. */
        [NodeType.Identifier](node, scope) {
            let { name } = node,
                depth = scope.depth,
                variable = VARIABLE_PATTERN.test(name);

            return async (context) => {
                if (variable) {
                    let bound = readVariable(context, depth, name);

                    if (UNBOUND !== bound)
                        return bound;
                }

                let table = context.runtime.constants;

                if (name in table)
                    return table[name];

                if (variable)
                    return undefined;

                throw new DSLRuntimeError(`Unknown name ${ JSON.stringify(name) }. Known names: ${ Object.keys(table).join(', ') || 'none' }`, node.loc);
            };
        },

        [NodeType.Wildcard](node) {
            let value = (PRESENCE[node.kind] ?? WILDCARD);

            return async () => value;
        },

        [NodeType.Duration](node) {
            let { milliseconds } = node;

            return async () => milliseconds;
        },
    };

    /** Picks whose badges `<badge>` is asking about.
     *
     * The innermost subject is preferred, but only when it actually carries badges. Inside
     * `await * with (...)` the subject is the *event*, and an event has no badges — so
     * `using <moderator>` there has to mean the channel's moderator badge, not the chat
     * message's. Falling through on shape rather than on scope depth is what makes both
     * readings work without the script having to say which it meant.
     * @param {Object} context
     * @return {?Object}
     */
    let badgeHolder = (context) => {
        for (let candidate of [context.subject, context.channel, context.realm?.current])
            if (null != candidate && Array.isArray(candidate.badges))
                return candidate;

        return (context.subject ?? context.channel ?? context.realm?.current ?? null);
    };

    /** Builds the closure for one sigil.
     *
     * `.prop` is the interesting case: `depth` is captured here, at compile time, and the
     * closure reads exactly that slot.
     * @param {Object} node
     * @param {Object} scope
     * @return {Function}
     */
    let compileSelector = (node, scope) => {
        let { name, loc } = node,
            depth = scope.depth;

        switch (node.kind) {
            case 'context':
                return async (context) => {
                    let subject = context.subjects[depth];

                    if (null == subject)
                        return undefined;

                    return subject[name];
                };

            case 'channel':
                return async (context) => {
                    if (null == name)
                        return (context.channel ?? context.realm?.current ?? null);

                    return (context.realm?.channel?.(name) ?? null);
                };

            case 'prop':
                return async (context) => {
                    let target = (null == node.channel
                        ? (context.channel ?? context.realm?.current ?? null)
                        : (context.realm?.channel?.(node.channel) ?? null));

                    return (null == target? undefined: target[name]);
                };

            case 'realm': {
                // An unregistered realm fails only the block that names it: it is reported
                // once and resolves to nothing, so a `using` over it contributes no
                // iteration and every sibling block still installs. Throwing instead would
                // take the whole enclosing body down with it.
                let reported = false;

                return async (context) => {
                    if (!context.runtime.hasRealm(node.realm)) {
                        if (!reported) {
                            reported = true;

                            let error = new DSLRuntimeError(`Unknown realm ${ JSON.stringify(node.realm) }; this block is skipped`, loc);

                            context.runtime.logger.error(error.codeFrame? error.codeFrame(): error);
                        }

                        return null;
                    }

                    let realm = context.runtime.realm(node.realm, loc);

                    return (realm.subject? realm.subject(node.path): null);
                };
            }

            case 'badge': {
                // `[vip moderator]` means "any of these": the first held badge answers, and
                // the list as a whole resolves once — so a `using` over it runs its body
                // once, not once per badge the viewer happens to hold.
                let names = (node.names ?? [name]);

                return async (context) => {
                    let holder = badgeHolder(context);

                    for (let entry of names) {
                        let held = context.realm?.badge?.(entry, holder);

                        if (null != held)
                            return held;
                    }

                    return null;
                };
            }

            case 'user':
                return async (context) => (context.realm?.user?.(name, (context.channel ?? context.realm?.current)) ?? null);

            default:
                throw new DSLRuntimeError(`Unknown selector kind ${ JSON.stringify(node.kind) }`, loc);
        }
    };

    /** Parses, compiles, and starts a script.
     * @param {String} source
     * @param {Object} runtime - from `createRuntime`
     * @param {Object} [seed] - the root subject / channel / realm
     * @return {Promise<Object>} the root context; call `.stop()` to cancel everything
     */
    let run = async (source, runtime, seed = {}) => {
        let program = globalThis.TTV_DSL.parse(source),
            compiled = compile(program, runtime),
            context = runtime.createContext(seed);

        await compiled(context);

        return context;
    };

    globalThis.TTV_DSL.compiler = { compile, run, WILDCARD, SOMETHING, NOTHING, Exact, truthy, equals, contains, stringify, at, toList, toNumber };
    globalThis.TTV_DSL.compile = compile;
    globalThis.TTV_DSL.run = run;
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
