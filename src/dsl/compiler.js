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

if(typeof require === 'function' && typeof module === 'object') {
    require('./errors.js');
    require('./tokens.js');
    require('./ast.js');
    require('./parser.js');
    require('./runtime.js');
}

(() => {
    const { DSLRuntimeError, DSLLimitError, DSLError } = globalThis.TTV_DSL.errors;
    const { NodeType } = globalThis.TTV_DSL.ast;
    const { VARIABLE_PATTERN } = globalThis.TTV_DSL.tokens;

    /** The value `*` evaluates to. A symbol, so no script-visible value can impersonate it. */
    const WILDCARD = Symbol('TTV_DSL.wildcard');

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
    const isExact = (value) => (value instanceof Exact);

    /** @param {*} value @return {*} */
    const unwrap = (value) => (isExact(value) ? value.value : value);

    /** @param {*} value @return {Boolean} */
    const isEmpty = (value) => (null == value || '' === value || (Array.isArray(value) && !value.length));

    /** Truthiness, DSL-flavoured: an empty list is false, and the wildcard is always true.
     * @param {*} value
     * @return {Boolean}
     */
    const truthy = (value) => (WILDCARD === value ? true : (Array.isArray(value) ? value.length > 0 : !!value));

    /** Renders a value for interpolation and for message text.
     * @param {*} value
     * @return {String}
     */
    const stringify = (value) => {
        if(isExact(value))
            return stringify(value.value);

        if(null == value)
            return '';

        if(WILDCARD === value)
            return '*';

        if(Array.isArray(value))
            return value.map(stringify).join(', ');

        if(typeof value === 'object')
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
    const equals = (left, right) => {
        // `=` on *either* side makes the whole comparison exact. One side asking for it is
        // enough: `#name is =NAME_VAR` and `=#name is NAME_VAR` say the same thing.
        if(isExact(left) || isExact(right)) {
            const exactLeft = unwrap(left)
                , exactRight = unwrap(right);

            if(WILDCARD === exactRight)
                return !isEmpty(exactLeft);

            if(WILDCARD === exactLeft)
                return !isEmpty(exactRight);

            if(null == exactLeft || null == exactRight)
                return (exactLeft === exactRight);

            return (stringify(exactLeft) === stringify(exactRight));
        }

        if(WILDCARD === right)
            return !isEmpty(left);

        if(WILDCARD === left)
            return !isEmpty(right);

        if(typeof left === 'string' && typeof right === 'string')
            return (left.toLowerCase() === right.toLowerCase());

        if(null != left && null != right && typeof left === 'object' && typeof right === 'object')
            return (left === right || (null != left.name && left.name === right.name));

        if(typeof left === 'object' || typeof right === 'object')
            return equals(stringify(left), stringify(right));

        // eslint-disable-next-line eqeqeq
        return (left == right);
    };

    /** Membership. A string haystack means substring; an array means "any element equals".
     * @param {*} needle
     * @param {*} haystack
     * @return {Boolean}
     */
    const contains = (needle, haystack) => {
        if(isExact(needle) || isExact(haystack)) {
            const exactNeedle = unwrap(needle)
                , exactHaystack = unwrap(haystack);

            if(null == exactHaystack)
                return false;

            if(WILDCARD === exactHaystack)
                return !isEmpty(exactNeedle);

            if(typeof exactHaystack === 'string')
                return exactHaystack.includes(stringify(exactNeedle));

            if(Array.isArray(exactHaystack))
                return exactHaystack.some(entry => equals(new Exact(entry), exactNeedle));

            if(typeof exactHaystack === 'object')
                return (stringify(exactNeedle) in exactHaystack);

            return false;
        }

        if(null == haystack)
            return false;

        if(WILDCARD === haystack)
            return !isEmpty(needle);

        if(typeof haystack === 'string')
            return haystack.toLowerCase().includes(stringify(needle).toLowerCase());

        if(Array.isArray(haystack))
            return haystack.some(entry => equals(entry, needle));

        if(typeof haystack === 'object')
            return (stringify(needle) in haystack);

        return false;
    };

    /** Coerces a value into something indexable. */
    const toList = (value) => (Array.isArray(value) ? value : (null == value ? [] : [value]));

    /** Applies a 0-based index, counting from the end when negative. */
    const at = (list, index) => {
        const items = toList(list);

        return (index < 0 ? items[items.length + index] : items[index]);
    };

    /** Compiles an AST into a closure tree.
     * @param {Object} node - usually a `Program`
     * @param {Object} runtime - from `createRuntime`
     * @return {Function} `async (context) => value`
     */
    const compile = (node, runtime) => compileNode(node, { runtime, depth: 0, parentDepth: null, permissions: EMPTY_PERMISSIONS });

    /** The grant set a program starts with: nothing. */
    const EMPTY_PERMISSIONS = Object.freeze(new Set());

    /** @param {Object} node @param {Object} scope @return {Function} */
    const compileNode = (node, scope) => {
        if(null == node)
            return null;

        const build = COMPILERS[node.type];

        if(!build)
            throw new DSLRuntimeError(`No compiler for node type ${ JSON.stringify(node.type) }`, node.loc);

        return build(node, scope);
    };

    /** Compiles a list of nodes at the same scope. */
    const compileAll = (nodes, scope) => (nodes ?? []).map(entry => compileNode(entry, scope));

    /** Opens a nested lexical scope — one deeper subject slot.
     *
     * `parentDepth` is what makes `=>` mean something: it remembers the slot one level out,
     * so a binding can be placed where later *siblings* will still see it. At the top level
     * it stays null, which is the only reason `=>` can be rejected at compile time instead
     * of silently writing into nowhere.
     * @param {Object} scope
     * @param {Object} [extra] - fields to override, e.g. a widened permission set
     * @return {Object}
     */
    const inner = (scope, extra) => Object.assign({
        runtime: scope.runtime,
        depth: scope.depth + 1,
        parentDepth: scope.depth,
        permissions: scope.permissions,
    }, extra);

    /** Reads a variable by walking outward from the scope it was referenced in.
     *
     * Slots are shared by reference between sibling subtrees (see `runtime.createContext`),
     * so an outward walk is all that separates "visible to my descendants" from "visible to
     * my later siblings too" — the two arrows differ only in which slot they wrote to.
     * @return {*} the bound value, or `UNBOUND`
     */
    const readVariable = (context, depth, name) => {
        const envs = context.envs;

        if(!envs || !envs.length)
            return UNBOUND;

        for(let level = Math.min(depth, envs.length - 1); level >= 0; --level) {
            const env = envs[level];

            if(env && env.has(name))
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
    const bindVariable = (context, slot, name, value) => {
        const envs = context.envs;

        if(!envs || !envs.length)
            return value;

        envs[Math.min(slot, envs.length - 1)].set(name, value);

        return value;
    };

    /** Runs a list of statement closures in order, charging one step each. */
    const sequence = (statements, runtime, loc) => async(context) => {
        for(const statement of statements) {
            if(context.signal.aborted)
                return;

            runtime.step(loc);

            await statement(context);
        }
    };

    /** Wraps a detached loop or handler so a fault is reported once and the script stops
     * rather than surfacing as an unhandled rejection. */
    const guard = (runtime, context, loc) => (error) => {
        const failure = (error instanceof DSLError ? error : new DSLRuntimeError(String(error?.message ?? error), loc));

        runtime.logger.error(failure.codeFrame ? failure.codeFrame() : failure);

        if(failure instanceof DSLLimitError)
            context.stop();
    };

    const COMPILERS = {
        [NodeType.Program](node, scope) {
            const body = compileAll(node.body, scope);

            return sequence(body, scope.runtime, node.loc);
        },

        [NodeType.Block](node, scope) {
            const body = compileAll(node.body, scope);

            return sequence(body, scope.runtime, node.loc);
        },

        /** `await` installs a recurring trigger and returns immediately, so the statements
         * after it still get a chance to install theirs. A duration awaits the clock; an
         * expression awaits an event that satisfies it. */
        [NodeType.AwaitStatement](node, scope) {
            let { runtime } = scope
                , nested = inner(scope)
                , filter = compileNode(node.filter, nested)
                , body = compileNode(node.body, nested);

            // The duration-vs-event decision is made *syntactically*, so an assignment
            // wrapped around the subject would silently turn `await (5:00 -> wait_time)`
            // into an event-await that never fires. Look through the binding, then bind the
            // name once at install time and carry on with the duration underneath.
            let bare = node.subject
                , binding = null;

            if(NodeType.AssignmentExpression === bare.type) {
                binding = bare;
                bare = bare.value;
            }

            if(NodeType.Duration === bare.type) {
                const milliseconds = bare.milliseconds
                    , bind = (binding ? compileNode(binding, scope) : null);

                return async(context) => {
                    if(bind)
                        await bind(context);

                    const loop = async() => {
                        while(!context.signal.aborted) {
                            if(!await runtime.sleep(milliseconds, context.signal))
                                return;

                            // Each tick is a fresh turn with a fresh budget; the minutes
                            // spent waiting are not the script's to account for.
                            runtime.beginTurn();
                            runtime.step(node.loc);

                            const child = context.child({ at: runtime.now(), kind: 'tick' }, { channel: context.channel });

                            if(filter && !truthy(await filter(child)))
                                continue;

                            if(body)
                                await body(child);
                        }
                    };

                    loop().catch(guard(runtime, context, node.loc));
                };
            }

            const condition = compileNode(node.subject, nested);

            return async(context) => {
                const off = runtime.subscribe(async(event) => {
                    if(context.signal.aborted)
                        return;

                    try {
                        // Handling one event is one turn.
                        runtime.beginTurn();
                        runtime.step(node.loc);

                        const child = context.child(event);

                        if(!truthy(await condition(child)))
                            return;

                        if(filter && !truthy(await filter(child)))
                            return;

                        if(body)
                            await body(child);
                    } catch(error) {
                        guard(runtime, context, node.loc)(error);
                    }
                });

                context.onAbort(off);
            };
        },

        /** `using` binds each subject in turn and runs the body under it. Several subjects
         * on one line mean "any of these", so the body runs once per subject that resolves. */
        [NodeType.UsingStatement](node, scope) {
            let { runtime } = scope
                , subjects = compileAll(node.subjects, scope);

            // Grants accumulate strictly downward: a block sees its own plus every
            // ancestor's, and never a sibling's. The union is computed once, here, and
            // frozen — a `Set` the runtime can only ask `has` of.
            const own = (node.permissions ?? [])
                , granted = (own.length ? Object.freeze(new Set([...scope.permissions, ...own])) : scope.permissions);

            const nested = inner(scope, { permissions: granted })
                , body = compileNode(node.body, nested);

            return async(context) => {
                for(const resolve of subjects) {
                    if(context.signal.aborted)
                        return;

                    runtime.step(node.loc);

                    let value = await resolve(context);

                    // A badge the viewer does not hold, or a channel that does not exist,
                    // simply contributes no iteration.
                    if(null == value)
                        continue;

                    if(WILDCARD === value)
                        value = (context.subject ?? context.channel);

                    if(body)
                        await body(context.child(value, { permissions: granted }));
                }
            };
        },

        [NodeType.IfStatement](node, scope) {
            // `if` does not rebind the subject, so it shares its parent's scope depth.
            let { runtime } = scope
                , test = compileNode(node.test, scope)
                , body = compileNode(node.body, scope)
                , alternate = compileNode(node.alternate, scope);

            return async(context) => {
                runtime.step(node.loc);

                if(truthy(await test(context))) {
                    if(body)
                        await body(context);

                    return;
                }

                if(alternate)
                    await alternate(context);
            };
        },

        /** Both forms of `when`. Neither rebinds the subject, so both stay at their parent's
         * depth — a case body reads the same `.prop` the head compared. */
        [NodeType.WhenStatement](node, scope) {
            let { runtime } = scope
                , alternate = compileNode(node.alternate, scope);

            // Chain form: this is somebody's `alternate`, and behaves as an `if`.
            if(null === node.operator) {
                const test = compileNode(node.discriminant, scope)
                    , body = compileNode(node.body, scope);

                return async(context) => {
                    runtime.step(node.loc);

                    if(truthy(await test(context))) {
                        if(body)
                            await body(context);

                        return;
                    }

                    if(alternate)
                        await alternate(context);
                };
            }

            const discriminant = compileNode(node.discriminant, scope)
                , matches = ('in' === node.operator ? contains : equals)
                , cases = node.cases.map(entry => ({
                    test: compileNode(entry.test, scope),
                    body: compileNode(entry.body, scope),
                }));

            return async(context) => {
                runtime.step(node.loc);

                const value = await discriminant(context);

                for(const entry of cases) {
                    runtime.step(node.loc);

                    // A `*` label needs no special case: `equals(x, WILDCARD)` already
                    // means "x is present", which is precisely what a default should ask.
                    if(!matches(value, await entry.test(context)))
                        continue;

                    if(entry.body)
                        await entry.body(context);

                    return;
                }

                if(alternate)
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
            let { runtime } = scope
                , filter = compileNode(node.filter, scope)
                , body = compileNode(node.body, inner(scope));

            return async(context) => {
                runtime.step(node.loc);

                const value = await filter(context);

                if(!body)
                    return;

                if(typeof value === 'boolean' || WILDCARD === value) {
                    if(truthy(value))
                        await body(context.child(context.subject));

                    return;
                }

                for(const item of toList(value)) {
                    if(context.signal.aborted)
                        return;

                    runtime.step(node.loc);

                    await body(context.child(item));
                }
            };
        },

        [NodeType.ExpressionStatement](node, scope) {
            let { runtime } = scope
                , expression = compileNode(node.expression, scope);

            return async(context) => {
                runtime.step(node.loc);

                await expression(context);
            };
        },

        [NodeType.GotoStatement](node, scope) {
            let { runtime } = scope
                , target = compileNode(node.target, scope);

            return async(context) => {
                runtime.step(node.loc);

                return runtime.goto(await target(context), context, node.loc);
            };
        },

        [NodeType.VerbStatement](node, scope) {
            let { runtime } = scope
                , argument = compileNode(node.argument, scope);

            return async(context) => {
                runtime.step(node.loc);

                const value = (argument ? await argument(context) : null);

                return runtime.invokeVerb(node.verb, context, value, node.loc);
            };
        },

        [NodeType.BinaryExpression](node, scope) {
            const left = compileNode(node.left, scope)
                , right = compileNode(node.right, scope);

            switch(node.operator) {
                case 'or': {
                    return async(context) => (truthy(await left(context)) || truthy(await right(context)));
                }

                case 'and': {
                    return async(context) => (truthy(await left(context)) && truthy(await right(context)));
                }

                case 'is': {
                    return async(context) => equals(await left(context), await right(context));
                }

                case 'in': {
                    return async(context) => contains(await left(context), await right(context));
                }

                default: {
                    throw new DSLRuntimeError(`Unsupported operator ${ JSON.stringify(node.operator) }`, node.loc);
                }
            } // switch node.operator
        },

        [NodeType.UnaryExpression](node, scope) {
            const argument = compileNode(node.argument, scope);

            if('not' === node.operator)
                return async(context) => !truthy(await argument(context));

            if('=' === node.operator)
                return async(context) => new Exact(await argument(context));

            return async(context) => -Number(await argument(context));
        },

        /** `<value> -> name` / `<value> => name`.
         *
         * Evaluates to the value it bound, which is the whole reason this is an expression:
         * `await (5:00 -> wait_time)` has to hand the duration on after recording it. */
        [NodeType.AssignmentExpression](node, scope) {
            const value = compileNode(node.value, scope)
                , slot = ('parent' === node.scope ? scope.parentDepth : scope.depth);

            if(null == slot)
                throw new DSLRuntimeError('`=>` has no parent scope here; use `->`', node.loc);

            const { name } = node;

            return async(context) => {
                const result = await value(context);

                bindVariable(context, slot, name, result);

                return result;
            };
        },

        /** `_` / `__this__` / `__self__` / `__me__` — the subject slot itself, with the
         * depth baked in at compile time exactly as `.prop` does. */
        [NodeType.This](node, scope) {
            const depth = scope.depth;

            return async(context) => context.subjects[depth];
        },

        /** `$:Path.fn( ... )`. The path is data all the way down: the runtime walks a host
         * binding table and calls what it finds. No text ever becomes code. */
        [NodeType.JSInvokeExpression](node, scope) {
            let { runtime } = scope
                , args = compileAll(node.arguments, scope)
                , { path } = node;

            return async(context) => {
                const values = [];

                for(const resolve of args)
                    values.push(unwrap(await resolve(context)));

                return runtime.invokeJS(path, values, context, node.loc);
            };
        },

        /** `<subject> %… <replacement>`. A list joins; anything else is trimmed and has its
         * matching runs replaced. */
        [NodeType.PercentExpression](node, scope) {
            let { runtime } = scope
                , subject = compileNode(node.subject, scope)
                , replacement = compileNode(node.replacement, scope)
                , { letters } = node;

            return async(context) => {
                const value = await subject(context)
                    , text = stringify(await replacement(context));

                return runtime.percent((Array.isArray(value) ? value.map(stringify) : stringify(value)), letters, text, node.loc);
            };
        },

        /** `<subject> where (<filter>)` — the filter runs once per item, one scope deeper,
         * so `.href` inside it means the item's property. */
        [NodeType.WhereExpression](node, scope) {
            let { runtime } = scope
                , subject = compileNode(node.subject, scope)
                , filter = compileNode(node.filter, inner(scope));

            return async(context) => {
                const items = toList(await subject(context))
                    , kept = [];

                for(const item of items) {
                    runtime.step(node.loc);

                    if(truthy(await filter(context.child(item))))
                        kept.push(item);
                }

                return kept;
            };
        },

        /** `<accessor> <| <collection>`. An ordinal on the left indexes the collection;
         * anything else is evaluated with the collection as its subject. */
        [NodeType.PipeExpression](node, scope) {
            const right = compileNode(node.right, scope);

            if(NodeType.OrdinalIndex === node.left.type) {
                const index = node.left.index;

                return async(context) => at(await right(context), index);
            }

            const left = compileNode(node.left, inner(scope));

            return async(context) => left(context.child(await right(context)));
        },

        [NodeType.RangeExpression](node, scope) {
            let { runtime } = scope
                , start = compileNode(node.start, scope)
                , end = compileNode(node.end, scope);

            return async(context) => runtime.range(await start(context), await end(context), node.inclusive, node.loc);
        },

        /** `any from ( ... )`. A range item contributes all of its members to the pool, so
         * `any from (1 .. 10)` chooses a number rather than choosing the list. */
        [NodeType.AnyFromExpression](node, scope) {
            let { runtime } = scope
                , items = compileAll(node.items, scope);

            return async(context) => {
                const pool = [];

                for(const resolve of items) {
                    const value = await resolve(context);

                    if(Array.isArray(value))
                        pool.push(...value);
                    else
                        pool.push(value);
                }

                return runtime.pick(pool, node.loc);
            };
        },

        [NodeType.OrdinalIndex](node) {
            const { index } = node;

            return async() => index;
        },

        [NodeType.Selector](node, scope) {
            return compileSelector(node, scope);
        },

        [NodeType.TemplateLiteral](node, scope) {
            let { quasis } = node
                , expressions = compileAll(node.expressions, scope);

            return async(context) => {
                let text = quasis[0];

                for(let index = 0; index < expressions.length; ++index)
                    text += stringify(await expressions[index](context)) + quasis[index + 1];

                return text;
            };
        },

        [NodeType.Literal](node) {
            const { value } = node;

            return async() => value;
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
            let { name } = node
                , depth = scope.depth
                , variable = VARIABLE_PATTERN.test(name);

            return async(context) => {
                if(variable) {
                    const bound = readVariable(context, depth, name);

                    if(UNBOUND !== bound)
                        return bound;
                }

                const table = context.runtime.constants;

                if(name in table)
                    return table[name];

                if(variable)
                    return void null;

                throw new DSLRuntimeError(`Unknown name ${ JSON.stringify(name) }. Known names: ${ Object.keys(table).join(', ') || 'none' }`, node.loc);
            };
        },

        [NodeType.Wildcard]() {
            return async() => WILDCARD;
        },

        [NodeType.Duration](node) {
            const { milliseconds } = node;

            return async() => milliseconds;
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
    const badgeHolder = (context) => {
        for(const candidate of [context.subject, context.channel, context.realm?.current])
            if(null != candidate && Array.isArray(candidate.badges))
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
    const compileSelector = (node, scope) => {
        let { name, loc } = node
            , depth = scope.depth;

        switch(node.kind) {
            case 'context': {
                return async(context) => {
                    const subject = context.subjects[depth];

                    if(null == subject)
                        return void null;

                    return subject[name];
                };
            }

            case 'channel': {
                return async(context) => {
                    if(null == name)
                        return (context.channel ?? context.realm?.current ?? null);

                    return (context.realm?.channel?.(name) ?? null);
                };
            }

            case 'prop': {
                return async(context) => {
                    const target = (null == node.channel
                        ? (context.channel ?? context.realm?.current ?? null)
                        : (context.realm?.channel?.(node.channel) ?? null));

                    return (null == target ? void null : target[name]);
                };
            }

            case 'realm': {
                return async(context) => {
                    const realm = context.runtime.realm(node.realm, loc);

                    return (realm.subject ? realm.subject(node.path) : null);
                };
            }

            case 'badge': {
                return async(context) => (context.realm?.badge?.(name, badgeHolder(context)) ?? null);
            }

            case 'user': {
                return async(context) => (context.realm?.user?.(name, (context.channel ?? context.realm?.current)) ?? null);
            }

            case 'emote': {
                return async(context) => (context.realm?.emote?.(name) ?? null);
            }

            default: {
                throw new DSLRuntimeError(`Unknown selector kind ${ JSON.stringify(node.kind) }`, loc);
            }
        } // switch node.kind
    };

    /** Parses, compiles, and starts a script.
     * @param {String} source
     * @param {Object} runtime - from `createRuntime`
     * @param {Object} [seed] - the root subject / channel / realm
     * @return {Promise<Object>} the root context; call `.stop()` to cancel everything
     */
    const run = async(source, runtime, seed = {}) => {
        const program = globalThis.TTV_DSL.parse(source)
            , compiled = compile(program, runtime)
            , context = runtime.createContext(seed);

        await compiled(context);

        return context;
    };

    globalThis.TTV_DSL.compiler = { compile, run, WILDCARD, Exact, truthy, equals, contains, stringify, at, toList };
    globalThis.TTV_DSL.compile = compile;
    globalThis.TTV_DSL.run = run;
})();

if(typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
