/*** /lib/user-scripts.js
 * Runs the viewer's `.ttv` scripts: each one is a plugin with its own toggle and settings (TTV DSL `plugin` header).
 * Follows the lifecycle in docs/DSL-HOST.md §7: check, consent, build, attach and run, stop.
 *
 * Storage keys:
 * - `user_scripts`: `[{ file, source }]`, the installed scripts
 * - `user_scripts__consent`: `{ [id]: grants }`, the permissions the viewer approved for each script
 * - `<id>`: a script's enable toggle; `<id>__<name>`: its settings
 */

import { createAdapter } from './dsl-host.js';

export const SCRIPTS_KEY = 'user_scripts';
export const CONSENT_KEY = 'user_scripts__consent';

/**
 * A stable fingerprint of what a script asks for; consent is stored against it, so a changed script asks again.
 * @param {Array<Object>} permissions - `inspect(…).meta.permissions`
 * @returns {string} The sorted permission names, joined
 */
export function grantsOf(permissions = []) {
    return [...new Set(permissions.flatMap(({ permissions }) => permissions))].sort().join(' ');
}

/**
 * Reads a script's stored settings by short name, in the types its header declares.
 * Settings pages save numbers as text; anything unsaved is left out and reads as its default.
 * @param {Object} meta - `inspect(…).meta`
 * @param {Object} stored - Stored values by full key (`<id>__<name>`)
 * @returns {Object} Values by short name, for `createRuntime({ settings })`
 */
export function settingValues(meta, stored) {
    const values = {};

    for(const [key, setting] of Object.entries(meta.settings ?? {})) {
        if(key == meta.id || !(key in stored) || stored[key] == null)
            continue;

        const name = key.slice(meta.id.length + 2)
            , value = stored[key];

        switch(setting.type) {
            case 'checkbox': {
                values[name] = value === true || value === 'true';
            } break;

            case 'number': {
                const number = Number(value) * (setting.scale ? 1 / setting.scale : 1);

                if(Number.isFinite(number))
                    values[name] = number;
            } break;

            default: {
                values[name] = String(value);
            } break;
        }
    }

    return values;
}

/**
 * Builds the runner.
 * @param {Object} deps - What the runner needs
 * @param {Object} deps.DSL - `TTV_DSL`
 * @param {Object} deps.storage - `{ get(keys) → Promise<Object>, onChanged(callback(changes)) }`
 * @param {Object} deps.env - Adapter facilities: `{ Chat, STREAMER, USERNAME, goto?, viewerBadges? }`
 * @param {string} deps.frame - `main` (a channel page) or `chat` (pop-out chat)
 * @param {Object} deps.log - `{ log, warn, error }`
 * @returns {Object} `{ start(), stop(), running }`
 */
export function createUserScripts({ DSL, storage, env, frame, log }) {
    const running = new Map();          // id → { stop }
    let scripts = [], consent = {}, channel = null, watcher = null;

    // Where a script may run: `chat` runs on channel pages and pop-out chat; `main` only on channel pages
    const allowed = meta => meta.frames?.includes('chat') || (frame == 'main' && meta.frames?.includes('main'));

    const prefix = meta => message => `[${ meta.name ?? meta.id }] ${ message }`;

    /**
     * Starts one script, if it's enabled, error-free and approved.
     * @param {Object} script - `{ file, source, meta, diagnostics }`
     * @returns {Promise<void>}
     */
    async function launch(script) {
        const { meta, diagnostics, source } = script
            , stored = await storage.get(Object.keys(meta.settings ?? {}));

        if(stored[meta.id] !== true || !allowed(meta))
            return;

        if(diagnostics.length)
            return log.warn(prefix(meta)(`not started: ${ diagnostics.length } problem(s) — ${ diagnostics[0].message }`));

        // Turning a script on is consent enough, unless it asks for permissions: those are approved in Settings
        const required = grantsOf(meta.permissions);

        if(required && consent[meta.id] !== required)
            return log.warn(prefix(meta)(`not started: its permissions need approval in Settings`));

        const say = prefix(meta)
            , logger = { log: message => log.log(say(message)), warn: message => log.warn(say(message)), error: message => log.error(say(message)) }
            , adapter = createAdapter({ ...env, logger })
            , runtime = DSL.createRuntime({ ...adapter.options, settings: settingValues(meta, stored) })
            , detach = adapter.attach(runtime);

        try {
            const context = await DSL.run(source, runtime, { channel: runtime.realm('TWITCH').current });

            running.set(meta.id, {
                stop() {
                    context.stop();
                    detach();
                },
            });
        } catch(error) {
            detach();
            log.error(say(error?.codeFrame?.() ?? error?.message ?? String(error)));
        }
    }

    /**
     * Stops one script.
     * @param {string} id - The script's plugin id
     */
    function halt(id) {
        running.get(id)?.stop();
        running.delete(id);
    }

    /**
     * Reads the installed scripts and approvals, then (re)starts every script.
     * @returns {Promise<void>}
     */
    async function reload() {
        for(const id of [...running.keys()])
            halt(id);

        const stored = await storage.get([SCRIPTS_KEY, CONSENT_KEY]);

        consent = stored[CONSENT_KEY] ?? {};
        scripts = (stored[SCRIPTS_KEY] ?? []).map(({ file, source }) => ({ file, source, ...DSL.inspect(source, { file }) }));

        for(const script of scripts)
            await launch(script);
    }

    /**
     * Restarts the scripts a storage change affects.
     * @param {Object} changes - `{ key: { oldValue, newValue } }`
     * @returns {Promise<void>}
     */
    async function changed(changes) {
        const keys = Object.keys(changes);

        if(keys.includes(SCRIPTS_KEY) || keys.includes(CONSENT_KEY))
            return reload();

        for(const script of scripts) {
            const { id } = script.meta;

            if(keys.some(key => key == id || key.startsWith(`${ id }__`))) {
                halt(id);
                await launch(script);
            }
        }
    }

    return {
        get running() {
            return [...running.keys()];
        },

        /**
         * Starts every enabled script and follows storage and channel changes.
         * @returns {Promise<void>}
         */
        async start() {
            storage.onChanged(changed);
            channel = env.STREAMER?.name;

            // No event marks a channel change; a script bound to the old channel restarts on the new one
            watcher = setInterval(() => {
                if(env.STREAMER?.name && env.STREAMER.name != channel) {
                    channel = env.STREAMER.name;
                    reload();
                }
            }, 1000);

            await reload();
        },

        /** Stops every script. */
        stop() {
            clearInterval(watcher);

            for(const id of [...running.keys()])
                halt(id);
        },
    };
}
