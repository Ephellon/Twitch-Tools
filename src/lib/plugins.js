/*** /lib/plugins.js
 * The plugin registry. Each feature describes itself once (its job, timer, clean-up and start-up
 * code), and `start()` wires every plugin for a frame into the job system in core.js.
 *
 * A plugin's `id` is its settings key and its job name, so turning the setting on or off (see
 * `Storage.onChanged` in tools.js) registers or unregisters the job like any legacy feature.
 */

const PLUGINS = new Map;

/**
 * Registers a feature.
 * @simply plugin(definition:object) → undefined
 *
 * @param {object}   definition
 * @param {string}   definition.id                  Settings key; also the job name
 * @param {string[]} [definition.frames = ['main']] Where it runs: `main` (www.twitch.tv), `chat`, `player`, `clips`
 * @param {number}   [definition.timer]             Job timer: > 0 repeats every N ms, < 0 runs once after N ms
 * @param {function} definition.handler             The job: `handler(context, ...args)`
 * @param {function} [definition.unhandler]         Undoes the job when the feature is turned off
 * @param {function} [definition.setup]             Runs once at start-up, before the job, when the feature is enabled
 * @param {function} [definition.enabled]           Whether to start; defaults to `parseBool(Settings[id])`
 * @param {object}   [definition.settings]          The feature's settings and their defaults (used by the Settings page, Phase 5)
 */
export function plugin(definition) {
    let { id } = definition;

    if(PLUGINS.has(id))
        throw new Error(`Plugin "${ id }" is already registered`);

    PLUGINS.set(id, {
        frames: ['main'],
        enabled: settings => parseBool(settings[id]),
        ...definition,
    });
}

/**
 * Wires every plugin for `frame` into the job system, then starts the enabled ones.
 * Called by the frame's initializer; `context` carries what plugins need from it (e.g. `StopWatch`).
 * @simply start(frame:string, context:object?) → undefined
 */
export function start(frame, context = {}) {
    for(let [id, feature] of PLUGINS) {
        if(!feature.frames.includes(frame))
            continue;

        Handlers[id] = (...args) => feature.handler(context, ...args);

        if('timer' in feature)
            Timers[id] = feature.timer;

        if(feature.unhandler)
            Unhandlers[id] = (...args) => feature.unhandler(context, ...args);

        if(feature.enabled(Settings)) {
            feature.setup?.(context);

            RegisterJob(id);
        }
    }
}

export { PLUGINS as plugins };
