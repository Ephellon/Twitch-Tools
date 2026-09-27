/*** /dsl/runtime.js - The injectable host a compiled TTV DSL script runs against
 *   _____   _    _  _   _  _______  _____  __  __  ______              _   _____
 *  |  __ \ | |  | || \ | ||__   __||_   _||  \/  ||  ____|            | | / ____|
 *  | |__) || |  | ||  \| |   | |     | |  | \  / || |__               | || (___
 *  |  _  / | |  | || . ` |   | |     | |  | |\/| ||  __|          _   | | \___ \
 *  | | \ \ | |__| || |\  |   | |    _| |_ | |  | || |____    _   | |__| | ____) |
 *  |_|  \_\ \____/ |_| \_|   |_|   |_____||_|  |_||______|  (_)   \____/ |_____/
 */

/** @file Everything a compiled script can reach is injected here — realms, verbs, the
 * clock, the random source, the logger and the resource budget. Nothing is imported from
 * the page.
 *
 * That indirection exists for one concrete reason: `await 15:00` and `any from ( ... )`
 * are otherwise untestable. With a fake clock and a seeded generator, a script that waits
 * five minutes and picks a random reply becomes a deterministic assertion that runs in
 * milliseconds under Node, with no browser and no Twitch connection.
 *
 * `TWITCH` ships as a working in-memory stub. `DISCORD` is deliberately **not** registered
 * — the extension has no Discord integration today, and a script naming it should fail
 * loudly rather than silently do nothing.
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

globalThis.TTV_DSL ??= {};

if (typeof require === 'function' && typeof module === 'object')
    require('./errors.js');

(() => {
    const { DSLRuntimeError, DSLLimitError, DSLPermissionError } = globalThis.TTV_DSL.errors;

    const MS_PER_SECOND = 1000;
    const MS_PER_MINUTE = 60 * MS_PER_SECOND;
    const MS_PER_HOUR = 60 * MS_PER_MINUTE;

    /** Default budget, applied **per turn** rather than per script.
     *
     * A turn is one uninterrupted burst of work: a timer tick, or the handling of one
     * event. Budgeting per turn is the only measure that makes sense here — an
     * event-driven script is meant to live for days, so a whole-script budget would kill
     * every healthy script while still letting a tight loop inside one handler run for the
     * full allowance. */
    const DEFAULT_LIMITS = Object.freeze({ steps: 100000, wallMs: 30000 });

    /** `mm:ss`, `hh:mm:ss`, or a suffixed shorthand like `90s` / `5m` / `2h`. */
    const DURATION_CLOCK = /^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/;
    const DURATION_SUFFIX = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)$/i;

    const SUFFIX_SCALE = Object.freeze({
        ms: 1,
        s: MS_PER_SECOND,
        m: MS_PER_MINUTE,
        h: MS_PER_HOUR,
        d: 24 * MS_PER_HOUR,
    });

    /** Converts a duration to milliseconds.
     *
     * Implemented locally so `dsl/` stays loadable under plain Node, but defers to the
     * extension's own `parseTime` when the page has one — that keeps a script's idea of
     * "5m" identical to the rest of the extension's.
     * @param {String|Number} value
     * @return {Number} milliseconds
     * @throws {DSLRuntimeError}
     */
    let parseDuration = (value) => {
        if (typeof value === 'number' && Number.isFinite(value))
            return value;

        let text = String(value).trim(),
            clock = DURATION_CLOCK.exec(text);

        if (clock) {
            let [, first, second, third] = clock;

            return (undefined === third
                ? (Number(first) * MS_PER_MINUTE) + (Number(second) * MS_PER_SECOND)
                : (Number(first) * MS_PER_HOUR) + (Number(second) * MS_PER_MINUTE) + (Number(third) * MS_PER_SECOND));
        }

        let suffix = DURATION_SUFFIX.exec(text);

        if (suffix)
            return Number(suffix[1]) * SUFFIX_SCALE[suffix[2].toLowerCase()];

        if (typeof globalThis.parseTime === 'function') {
            let delegated = globalThis.parseTime(text);

            if (Number.isFinite(delegated))
                return delegated;
        }

        throw new DSLRuntimeError(`Cannot read ${ JSON.stringify(text) } as a duration`);
    };

    /** The regex fragment each `%` class letter stands for.
     *
     * `%w` is JavaScript's `\w`, which admits `_` as well as letters and digits. That is
     * deliberate and is **not** to be "corrected" to `[A-Za-z0-9]`: `%` only ever operates
     * on strings, so the underscore costs nothing, and `\w` is what every other language
     * carrying this notation means by it — matching that expectation beats internal
     * tidiness. `%a` and `%w` therefore differ by both digits and `_`.
     * @type {Object<String, String>}
     */
    const PERCENT_CLASS_SOURCE = Object.freeze({
        '0': '\\0',
        a: '[A-Za-z]',
        A: '[^A-Za-z]',
        b: '\\b',
        B: '\\B',
        d: '\\d',
        D: '\\D',
        f: '\\f',
        n: '\\n',
        r: '\\r',
        s: '\\s',
        S: '\\S',
        t: '\\t',
        v: '\\v',
        w: '\\w',
        W: '\\W',
    });

    /** Classes that match a *position* rather than a character, and so cannot be quantified. */
    const PERCENT_ZERO_WIDTH = Object.freeze(new Set(['b', 'B']));

    /** What a bare `%` expands to. */
    const PERCENT_DEFAULT = Object.freeze(['n', 's']);

    /** The permission a `$:` path requires when the host has not said otherwise. */
    const DEFAULT_JS_PERMISSION = 'eval:js';

    /** Property names a host path may never traverse. Not a substitute for the host simply
     * not registering dangerous objects — but walking into `constructor` is the one mistake
     * that turns a property lookup back into the code evaluation this language promises not
     * to do, so it is refused outright. */
    const FORBIDDEN_SEGMENTS = Object.freeze(new Set(['__proto__', 'prototype', 'constructor']));

    /** `<text> %… <replacement>` — trim, then replace matching runs.
     *
     * Three rules, all recorded in SPEC §5.9:
     *
     * 1. **The trim is unconditional**, not gated on `%c`. `%c` is accepted and ignored so
     *    that scripts spelling it out still work.
     * 2. **The whole matched run is replaced.** The classes concatenate — `%d%s` is
     *    `\d+\s+` — and the replacement stands in for everything that matched, not just the
     *    trailing class.
     * 3. **The replacement is inserted verbatim**, with no implicit padding. Spacing is
     *    opt-in and belongs in the replacement itself: `% '·'` yields `a·b` and `% ' · '`
     *    yields `a · b`. An operator that quietly added spaces would be impossible to turn
     *    off.
     * @param {String|Array<String>} value - already rendered by the caller
     * @param {Array<String>} letters - the class run; empty means `%n%s`
     * @param {String} replacement
     * @return {String}
     */
    let percent = (value, letters, replacement, loc) => {
        // A list has nothing to replace *within*; joining is the only sensible reading, and
        // it is what makes `.links % ', '` a formatting operator as well as a cleaning one.
        if (Array.isArray(value))
            return value.join(replacement);

        // `%c` is a flag, not a class. It is stripped here rather than rejected so that the
        // spelling stays legal even though the trim it asks for is already unconditional.
        let run = (letters ?? []).filter(letter => 'c' !== letter);

        if (!run.length)
            run = PERCENT_DEFAULT;

        let source = '';

        for (let letter of run) {
            let piece = PERCENT_CLASS_SOURCE[letter];

            if (undefined === piece)
                throw new DSLRuntimeError(`Unknown \`%\` sequence "%${ letter }"`, loc);

            source += (PERCENT_ZERO_WIDTH.has(letter)? piece: `${ piece }+`);
        }

        return String(value).trim().replace(new RegExp(source, 'g'), replacement);
    };

    /** A deterministic generator (mulberry32). Seeded, so a test that asserts which reply
     * `any from` picked stays stable across runs.
     * @param {Number} [seed = 1]
     * @return {function(): Number} values in `[0, 1)`
     */
    let createSeededRandom = (seed = 1) => {
        let state = (seed >>> 0) || 1;

        return () => {
            state = (state + 0x6D2B79F5) >>> 0;

            let value = state;

            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

            return (((value ^ (value >>> 14)) >>> 0) / 4294967296);
        };
    };

    /** The real clock. */
    let createSystemClock = () => ({
        now: () => Date.now(),
        setTimeout: (body, delay) => setTimeout(body, delay),
        clearTimeout: (handle) => clearTimeout(handle),
    });

    /** Yields to the microtask queue a few times, so chained `await`s settle. */
    let flush = async () => {
        for (let turn = 0; turn < 8; ++turn)
            await new Promise(resolve => queueMicrotask(resolve));
    };

    /** A clock whose time only moves when a test says so.
     * @param {Number} [start = 0]
     * @return {Object} a clock with an extra `advance(ms)` and `pending` count
     */
    let createFakeClock = (start = 0) => {
        let time = start,
            sequence = 0,
            timers = new Map();

        return {
            now: () => time,

            setTimeout(body, delay) {
                let handle = ++sequence;

                timers.set(handle, { at: time + Math.max(0, delay | 0), body });

                return handle;
            },

            clearTimeout(handle) {
                timers.delete(handle);
            },

            get pending() {
                return timers.size;
            },

            /** Runs every timer that falls due within `span`, in order.
             * @param {Number} span - milliseconds to advance
             */
            async advance(span) {
                let target = time + span;

                while (true) {
                    let due = [...timers.entries()]
                        .filter(([, timer]) => timer.at <= target)
                        .sort((left, right) => left[1].at - right[1].at);

                    if (!due.length)
                        break;

                    let [handle, timer] = due[0];

                    timers.delete(handle);
                    time = timer.at;
                    timer.body();

                    await flush();
                }

                time = target;

                await flush();
            },
        };
    };

    /** An in-memory Twitch stand-in.
     *
     * Channels are plain records; everything a script can read off `#` or `/name` is just a
     * property. Enough to drive the language, and nothing more.
     * @param {Object} [options]
     * @param {Object<String, Object>} [options.channels]
     * @param {String} [options.current] - the channel `#` refers to
     * @return {Object}
     */
    let createTwitchRealm = ({ channels = {}, current = null } = {}) => {
        let records = new Map(Object.entries(channels).map(([name, record]) => [name.toLowerCase(), Object.assign({ name, live: false }, record)]));

        return {
            name: 'TWITCH',

            /** @param {String} name @return {?Object} */
            channel(name) {
                return (records.get(String(name).toLowerCase()) ?? null);
            },

            /** The channel `#` resolves to when nothing narrower is in scope. */
            get current() {
                return (null == current? null: this.channel(current));
            },

            set current(name) {
                current = name;
            },

            /** @param {String} name @param {Object} record @return {Object} */
            define(name, record) {
                let entry = Object.assign({ name, live: false }, record);

                records.set(name.toLowerCase(), entry);

                return entry;
            },

            /** A realm-qualified path, e.g. `TWITCH/shroud`. */
            subject(path) {
                return this.channel(path);
            },

            /** `<badge>` — does the subject carry this badge? */
            badge(name, subject) {
                let badges = (subject?.badges ?? []);

                return (badges.includes(name)? name: null);
            },

            /** `@user` */
            user(name, subject) {
                let users = (subject?.users ?? {});

                return (users[name] ?? { name });
            },

            /** `:emote:` */
            emote(name) {
                return { name };
            },

            /** Where `goto` lands. Recorded rather than performed. */
            visited: [],

            goto(target) {
                this.visited.push(target);

                if (null != target && typeof target === 'object' && 'name' in target)
                    current = target.name;
            },
        };
    };

    /** The default verb set: `POST` and `REPLY`, both writing to an in-memory sink.
     * @param {Array<Object>} sink
     * @return {Object<String, Function>}
     */
    let createDefaultVerbs = (sink) => ({
        /** Sends a message to the channel in scope. */
        POST(context, value) {
            return deliver(sink, 'POST', context, value, null);
        },

        /** Replies to whoever produced the event in scope. */
        REPLY(context, value) {
            return deliver(sink, 'REPLY', context, value, (context.subject?.sender ?? null));
        },
    });

    /** Shared body of `POST` / `REPLY`.
     *
     * A blank message is dropped rather than sent — the mockup's `REPLY \`\`` is a real
     * pattern, and Twitch would reject it anyway.
     * @return {Boolean} whether anything was sent
     */
    let deliver = (sink, verb, context, value, to) => {
        let text = (null == value? '': String(value));

        if (/^\s*$/.test(text)) {
            context.runtime.logger.warn(`${ verb } skipped: the message was empty`);

            return false;
        }

        sink.push({ verb, text, to, channel: (context.channel?.name ?? null), at: context.runtime.now() });

        return true;
    };

    /** Builds the object a compiled script executes against.
     * @param {Object} [options]
     * @param {Object<String, Object>} [options.realms] - extra realms, merged over `TWITCH`
     * @param {Object<String, Function>} [options.verbs] - extra verbs, merged over the defaults
     * @param {Object<String, *>} [options.constants] - values bare identifiers resolve to
     * @param {Object} [options.clock] - `{ now, setTimeout, clearTimeout }`
     * @param {Function} [options.random] - returns `[0, 1)`
     * @param {Object} [options.logger] - `{ log, warn, error }`
     * @param {{ steps: Number, wallMs: Number }} [options.limits]
     * @param {Object} [options.jsBindings] - the object `$:Path.fn()` walks. **Empty by
     *   default**, deliberately: a script naming `$:Date.now` should fail as loudly as one
     *   naming `DISCORD` until the host has decided to expose it.
     * @param {Object<String, String>} [options.jsPermissions] - dotted path -> required
     *   permission, e.g. `{ 'Date.now': 'read:datetime' }`. Unlisted paths require `eval:js`.
     * @return {Object}
     */
    let createRuntime = ({
        realms = {},
        verbs = {},
        constants = {},
        clock = createSystemClock(),
        wallClock = () => Date.now(),
        random = Math.random,
        logger = console,
        limits = {},
        jsBindings = {},
        jsPermissions = {},
    } = {}) => {
        let sink = [],
            budget = Object.assign({}, DEFAULT_LIMITS, limits),
            listeners = new Set(),
            steps = 0,
            startedAt = wallClock();

        let registry = Object.assign({ TWITCH: createTwitchRealm() }, realms);

        let runtime = {
            sink,
            limits: budget,
            logger,
            constants,
            verbs: Object.assign(createDefaultVerbs(sink), verbs),

            /** @return {Number} */
            now: () => clock.now(),

            /** @return {Number} the number of steps taken so far */
            get steps() {
                return steps;
            },

            /** Charges one unit of budget against the current turn.
             *
             * Called at every statement and every loop iteration, which is what makes a
             * runaway script terminate instead of hanging the page.
             *
             * Elapsed time comes from `wallClock`, never from `clock`: `clock` is the
             * script's own sense of time and a test moves it in five-minute jumps, which
             * has nothing to do with how long the handler actually ran.
             * @param {Object} [loc]
             * @throws {DSLLimitError}
             */
            step(loc) {
                if (++steps > budget.steps)
                    throw new DSLLimitError(`Script exceeded its budget of ${ budget.steps } steps in a single turn`, loc);

                if ((wallClock() - startedAt) > budget.wallMs)
                    throw new DSLLimitError(`A single turn ran longer than ${ budget.wallMs }ms`, loc);
            },

            /** Opens a new turn, restoring the full budget. Called by the compiler at each
             * timer tick and before each event handler. */
            beginTurn() {
                steps = 0;
                startedAt = wallClock();
            },

            /** @deprecated use `beginTurn` */
            resetBudget() {
                runtime.beginTurn();
            },

            /** @param {String} name @return {Object} @throws {DSLRuntimeError} */
            realm(name, loc) {
                let found = registry[name];

                if (!found)
                    throw new DSLRuntimeError(`Unknown realm ${ JSON.stringify(name) }. Registered realms: ${ Object.keys(registry).join(', ') || 'none' }`, loc);

                return found;
            },

            /** @return {Object} the default realm */
            get defaultRealm() {
                return registry.TWITCH;
            },

            /** @param {String} name @return {Boolean} */
            hasRealm: (name) => (name in registry),

            /** Waits, unless the script is already stopping.
             * @param {Number} milliseconds
             * @param {Object} signal - `{ aborted }`
             * @return {Promise<Boolean>} false when the wait was cut short
             */
            sleep(milliseconds, signal) {
                return new Promise(resolve => {
                    if (signal?.aborted)
                        return resolve(false);

                    let handle = clock.setTimeout(() => {
                        signal?.forget(cancel);
                        resolve(!signal?.aborted);
                    }, milliseconds);

                    let cancel = () => {
                        clock.clearTimeout(handle);
                        resolve(false);
                    };

                    signal?.onAbort(cancel);
                });
            },

            /** @param {Array} items @return {*} one item, chosen with the injected source */
            pick(items, loc) {
                if (!Array.isArray(items) || !items.length)
                    throw new DSLRuntimeError('`any from` was given nothing to choose from', loc);

                return items[Math.floor(random() * items.length) % items.length];
            },

            /** @return {Number} */
            random: () => random(),

            /** Expands a range into an array.
             * @param {Number} from
             * @param {Number} to
             * @param {Boolean} inclusive
             * @return {Array<Number>}
             */
            range(from, to, inclusive, loc) {
                let start = Number(from),
                    end = Number(to);

                if (!Number.isFinite(start) || !Number.isFinite(end))
                    throw new DSLRuntimeError('A range needs two numbers', loc);

                let step = (end < start? -1: 1),
                    last = (inclusive? end: end - step),
                    values = [];

                for (let value = start; (step > 0? value <= last: value >= last); value += step) {
                    this.step(loc);
                    values.push(value);
                }

                return values;
            },

            /** Registers an event handler. Returns its remover.
             * @param {Function} handler
             * @return {Function}
             */
            subscribe(handler) {
                listeners.add(handler);

                return () => listeners.delete(handler);
            },

            /** Delivers an event to every live `await`.
             * @param {Object} event
             * @return {Promise<void>}
             */
            async dispatch(event) {
                for (let handler of [...listeners])
                    await handler(event);
            },

            /** @return {Number} */
            get listenerCount() {
                return listeners.size;
            },

            /** Calls a verb.
             * @param {String} name
             * @param {Object} context
             * @param {*} value
             * @param {Object} [loc]
             * @return {Promise<*>}
             */
            async invokeVerb(name, context, value, loc) {
                let verb = runtime.verbs[name];

                if (typeof verb !== 'function')
                    throw new DSLRuntimeError(`Unknown verb ${ JSON.stringify(name) }. Registered verbs: ${ Object.keys(runtime.verbs).join(', ') }`, loc);

                return verb(context, value, loc);
            },

            /** Navigates. Delegates to the realm that owns the target. */
            goto(target, context, loc) {
                let realm = (context.realm ?? runtime.defaultRealm);

                if (typeof realm?.goto !== 'function')
                    throw new DSLRuntimeError('The realm in scope cannot handle `goto`', loc);

                return realm.goto(target);
            },

            parseDuration,
            percent,

            /** Asserts that the block in scope was granted `name`.
             *
             * The test is an exact `Set.has` and there is no prefix logic anywhere in this
             * file — that absence is the feature. `+eval` must not grant `eval:calc`,
             * because a grant that silently widens is a grant nobody can audit; and
             * `+eval:calc` must not grant `eval`, because the narrow spelling is the one a
             * cautious author reached for on purpose.
             * @param {String} name
             * @param {Object} context
             * @param {Object} [loc]
             * @throws {DSLPermissionError}
             */
            requirePermission(name, context, loc) {
                if (context?.permissions?.has(name))
                    return true;

                let held = [...(context?.permissions ?? [])].sort();

                throw new DSLPermissionError(`This block was not granted \`+${ name }\`. Add it to the enclosing \`using\` header. Granted here: ${ held.map(entry => `+${ entry }`).join(' ') || 'nothing' }`, loc);
            },

            /** Calls a host binding named by a dotted path.
             *
             * Resolution is a walk over a plain object the host supplied, followed by a
             * call. At no point does a string become code: there is no `eval` and no
             * `new Function` in this language's implementation, and `$:` is the construct
             * that would most obviously have wanted one.
             * @param {Array<String>} path
             * @param {Array<*>} args
             * @param {Object} context
             * @param {Object} [loc]
             * @return {*}
             */
            invokeJS(path, args, context, loc) {
                let key = path.join('.');

                runtime.requirePermission((jsPermissions[key] ?? DEFAULT_JS_PERMISSION), context, loc);

                let holder = null,
                    target = jsBindings;

                for (let segment of path) {
                    if (FORBIDDEN_SEGMENTS.has(segment))
                        throw new DSLRuntimeError(`\`$:${ key }\` walks through ${ JSON.stringify(segment) }, which is never allowed`, loc);

                    let container = (null != target && (typeof target === 'object' || typeof target === 'function'));

                    if (!container || !(segment in target))
                        throw new DSLRuntimeError(`No host binding for \`$:${ key }\`. Registered: ${ Object.keys(jsBindings).join(', ') || 'none' }`, loc);

                    holder = target;
                    target = target[segment];
                }

                if (typeof target !== 'function')
                    throw new DSLRuntimeError(`\`$:${ key }\` is not callable`, loc);

                return target.apply(holder, args);
            },

            /** Creates a root execution context. */
            createContext({ subject = null, channel = null, realm = null, permissions = [] } = {}) {
                return createContext(runtime, { subject, channel, realm: (realm ?? registry.TWITCH), permissions });
            },
        };

        return runtime;
    };

    /** A cancellation token. Kept deliberately small — `AbortController` exists, but the
     * scripts here need `onAbort`/`forget` more than they need DOM events. */
    let createSignal = () => {
        let handlers = new Set(),
            aborted = false;

        return {
            get aborted() {
                return aborted;
            },

            onAbort(handler) {
                if (aborted)
                    handler();
                else
                    handlers.add(handler);
            },

            forget(handler) {
                handlers.delete(handler);
            },

            abort() {
                if (aborted)
                    return;

                aborted = true;

                for (let handler of [...handlers])
                    handler();

                handlers.clear();
            },
        };
    };

    /** Builds an execution context.
     *
     * `subjects` is indexed by lexical depth: the compiler resolves each `.prop` to a fixed
     * slot at compile time, so a nested `where` reading `.href` cannot accidentally see the
     * enclosing `await`'s subject.
     *
     * `envs` is the same idea for variables, and its sharing rule is what makes the two
     * binding arrows differ. `child` builds the next array with `concat`, which copies the
     * *array* but leaves every ancestor `Map` shared **by reference**. So a write into
     * `envs[depth]` lands in a Map only this subtree holds, while a write into
     * `envs[parentDepth]` lands in one every sibling subtree is already holding — which is
     * precisely "visible to my later siblings too", achieved without a single scope-chain
     * walk at runtime.
     * @param {Object} runtime
     * @param {Object} seed
     * @return {Object}
     */
    let createContext = (runtime, { subject, channel, realm, permissions = [] }) => {
        let signal = createSignal();

        let make = (subjects, envs, currentChannel, currentRealm, granted) => ({
            runtime,
            signal,
            subjects,
            envs,
            permissions: granted,
            channel: currentChannel,
            realm: currentRealm,

            /** The innermost bound subject. */
            get subject() {
                return subjects[subjects.length - 1];
            },

            /** Opens a nested lexical scope.
             * @param {*} value - the new subject
             * @param {Object} [options]
             * @return {Object}
             */
            child(value, { channel: nextChannel, realm: nextRealm, permissions: nextPermissions } = {}) {
                let resolved = (nextChannel !== undefined
                    ? nextChannel
                    : (isChannelLike(value)? value: (value?.channel ?? currentChannel)));

                return make(subjects.concat([value]), envs.concat([new Map()]), resolved, (nextRealm ?? currentRealm), (nextPermissions ?? granted));
            },

            onAbort: (handler) => signal.onAbort(handler),

            /** Cancels every pending wait and subscription under this context. */
            stop: () => signal.abort(),
        });

        return make([subject], [new Map()], channel, realm, Object.freeze(new Set(permissions)));
    };

    /** @param {*} value @return {Boolean} true when the value looks like a channel record */
    let isChannelLike = (value) => (null != value && typeof value === 'object' && typeof value.name === 'string' && 'live' in value);

    globalThis.TTV_DSL.runtime = {
        createRuntime,
        createContext,
        createSignal,
        createTwitchRealm,
        createDefaultVerbs,
        createSystemClock,
        createFakeClock,
        createSeededRandom,
        parseDuration,
        percent,
        isChannelLike,
        flush,
        DEFAULT_LIMITS,
        PERCENT_CLASS_SOURCE,
        PERCENT_ZERO_WIDTH,
        PERCENT_DEFAULT,
        DEFAULT_JS_PERMISSION,
    };

    globalThis.TTV_DSL.createRuntime = createRuntime;
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
