/*** /lib/plugins.js
 * The plugin registry. Each feature describes itself once (its job, timer, clean-up and start-up
 * code), and `start()` wires every plugin for a frame into the job system in core.js.
 *
 * A plugin's `id` is its settings key and its job name, so turning the setting on or off (see
 * `Storage.onChanged` in tools.js) registers or unregisters the job like any legacy feature.
 */

// One registry per page, shared by every bundle that registers plugins (lib.js, chat-plugins.js)
const PLUGINS = (globalThis.__TTV_PLUGINS__ ??= new Map);

/**
 * Registers a feature.
 * @simply plugin(definition:object) → undefined
 *
 * @param {object}   definition
 * @param {string}   definition.id                  Unique plugin id; also the job name and settings key unless `job` says otherwise
 * @param {string}   [definition.job = id]           Job name (Handlers/Timers/Unhandlers key) when it differs from `id`
 * @param {string[]} [definition.frames = ['main']] Where it runs: `main` (www.twitch.tv), `chat`, `player`, `clips`
 * @param {number}   [definition.timer]             Job timer: > 0 repeats every N ms, < 0 runs once after N ms
 * @param {function} definition.handler             The job: `handler(context, ...args)`
 * @param {function} [definition.unhandler]         Undoes the job when the feature is turned off
 * @param {function} [definition.init]              Runs at start-up whether or not the feature is enabled (resets the feature's state)
 * @param {function} [definition.setup]             Runs once at start-up, before the job, when the feature is enabled
 * @param {function} [definition.enabled]           `enabled(Settings, context)`: whether to start; defaults to `parseBool(Settings[job])`
 * @param {boolean}  [definition.register = true]   `false` when `setup` decides for itself whether to call `RegisterJob`
 * @param {function} [definition.install]           A section moved verbatim from an initializer: it wires its own jobs
 *                                                  (Handlers/Timers/RegisterJob) and runs whether or not it's enabled
 * The feature's settings (controls, text, defaults) are declared beside it in `<plugin>.settings.js`; see docs/SETTINGS.md.
 */
export function plugin(definition) {
    const { id } = definition;

    if(PLUGINS.has(id))
        throw new Error(`Plugin "${ id }" is already registered`);

    const job = definition.job ?? id;

    PLUGINS.set(id, {
        frames: ['main'],
        /**
         * Determines if the feature is enabled based on the provided settings.
         * @param {Object} settings - The current configuration settings
         * @returns {boolean} True if the feature is enabled
         */
        enabled: settings => parseBool(settings[job]),
        ...definition,
        job,
    });
}

/**
 * Wires every plugin for `frame` into the job system, then starts the enabled ones.
 * Called by the frame's initializer; `context` carries what plugins need from it (e.g. `StopWatch`).
 * @simply start(frame:string, context:object?) → undefined
 */
export async function start(frame, context = {}) {
    for(const [id, feature] of PLUGINS)
        if(feature.frames.includes(frame) && !feature.started)
            await run(id, context);
}

/**
 * Wires and starts one plugin. Initializers call this where the feature's code used to be, so
 * features keep their original order relative to the code that hasn't moved yet.
 * @simply run(id:string, context:object?) → Promise~undefined
 */
export async function run(id, context = {}) {
    const feature = PLUGINS.get(id);

    if(!feature)
        throw new Error(`No plugin "${ id }"`);

    feature.started = true;

    if(feature.install)
        return await feature.install(context);

    const { job } = feature;

    await feature.init?.(context);

    Handlers[job] = (...args) => feature.handler(context, ...args);

    if('timer' in feature)
        Timers[job] = feature.timer;

    if(feature.unhandler)
        Unhandlers[job] = (...args) => feature.unhandler(context, ...args);

    if(await feature.enabled(Settings, context)) {
        await feature.setup?.(context);

        if(feature.register !== false)
            RegisterJob(job);
    }
}

export { PLUGINS as plugins };
