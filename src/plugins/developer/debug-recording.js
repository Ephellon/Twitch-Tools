/*** /plugins/developer/debug-recording.js
 * Debug Recording (phase 1): keeps a rolling log of clicks, page changes, reloads, the video's status, and what TTV did
 * (jobs, logs, errors, Up Next, settings), with messages hidden. Tapping Ctrl three times (or "Save Debugging Report..." in
 * the right-click menu) saves it as an `.html` file to attach to an issue. Only the tab's top page records (not TTV's
 * hidden frames). The log survives reloads (`sessionStorage`), and navigations to other sites and respawned tabs (the
 * background keeps each tab's log: `DEBUG_RECORDING` in background.js). See lib/debug-recorder.js.
 */

import { plugin } from '../../lib/plugins.js';
import { DebugLog, browserName, buildRecording, describeElement, logLine, maskSetting, mergeHistory, sensitiveTerms } from '../../lib/debug-recorder.js';

const STORE_KEY = 'ttv-debug-recording';
const LOG_LEVELS = ['$log', '$warn', '$error', '$remark', '$notice'];

/** The recorder's state while it's on; `null` while it's off */
let RECORDER = null;

/**
 * The page's path, without its query (it can hold tokens).
 * @simply pagePath() → string
 */
function pagePath() {
    return location.pathname;
}

/**
 * The video's status for the log.
 * @simply videoStatus(video:HTMLVideoElement?) → string
 */
function videoStatus(video) {
    if($.defined('[data-a-target*="ad-countdown"i]'))
        return 'ad';
    if(nullish(video))
        return 'none';
    if(!STREAMER?.live)
        return 'offline';
    if(STREAMER?.redo)
        return 'rerun';
    return 'live';
}

/**
 * Saves the log so a reload keeps it. Halves the log when storage is full.
 * @simply persist() → undefined
 */
function persist() {
    if(!RECORDER)
        return;

    for(let tries = 0; tries < 4; ++tries)
        try {
            return sessionStorage.setItem(STORE_KEY, JSON.stringify(RECORDER.log));
        } catch {
            RECORDER.log.events.splice(0, Math.ceil(RECORDER.log.events.length / 2));
        }
}

/**
 * Tells the background about the tab's log (the events it hasn't seen yet), so it outlives the page.
 * @simply share(message:object?, callback:function?) → undefined
 *
 * @param {object}   [message={}] Extra fields: `load` (ask for the tab's log), `replace` (send all of it), `clear`
 * @param {function} [callback]   Gets the background's reply
 */
function share(message = {}, callback) {
    if(!RECORDER && !message.clear)
        return;

    const { log, pending = [] } = RECORDER ?? {}
        , body = { action: 'DEBUG_RECORDING', ...message };

    if(log && !message.clear && !message.load) {
        Object.assign(body, { meta: log.meta, minutes: log.minutes, limit: log.limit });

        if(message.replace)
            body.events = log.events;
        else if(pending.length)
            body.append = [...pending];
        else
            return;

        pending.length = 0;
    }

    try {
        Runtime?.sendMessage?.(body, reply => {
            // Read, so a page the background doesn't answer (it's restarting) doesn't log an error
            void (globalThis.browser ?? globalThis.chrome)?.runtime?.lastError;
            callback?.(reply);
        });
    } catch {
        // The extension was reloaded: this page can't reach the background any more
    }
}

/**
 * Downloads the log as an `.html` file.
 * @simply saveRecording() → undefined
 */
function saveRecording() {
    if(!RECORDER)
        return;

    const { log } = RECORDER
        , saved = Date.now()
        , channel = STREAMER?.name ?? pagePath().split('/')[1] ?? 'twitch'
        , html = buildRecording({ meta: { ...log.meta, channel, saved }, events: log.events })
        , link = document.createElement('a')
        , local = new Date(saved - new Date(saved).getTimezoneOffset() * 60_000)
        , stamp = local.toISOString().replace(/\.\d+Z$/, '').replace(/:/g, '-');

    link.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    link.download = `ttv-recording-${ channel }-${ stamp }.html`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(link.href), 10_000);

    alert.timed?.(`Debug recording saved (${ log.events.length } events).`, 5000);
}

/**
 * Starts recording: restores the log kept before a reload, notes how the page was reached, and adds the listeners.
 * Runs at start-up, or on the first job run when the feature is turned on later.
 * @simply startRecording() → undefined
 */
function startRecording() {
    // Only the tab's own page: TTV loads Twitch pages in hidden frames too, and they share the tab's storage
    if(RECORDER || top !== window)
        return;

    $remark("Adding Debug Recording...");

    let kept = null;

    try {
        kept = JSON.parse(sessionStorage.getItem(STORE_KEY) ?? 'null');
    } catch {
        // Nothing kept, or storage is blocked
    }

    const log = new DebugLog({
        minutes: parseFloat(Settings.debug_recording__minutes) || 5,
        meta: kept?.meta ?? {
            started: Date.now(),
            version: (globalThis.browser ?? globalThis.chrome)?.runtime?.getManifest?.()?.version,
            browser: browserName(navigator.userAgent),
        },
        events: kept?.events ?? [],
    });

    RECORDER = {
        log,
        pending: [],
        listeners: [],
        logs: {},
        last: { path: pagePath(), video: '', time: -1, stuckSince: null, jobs: {}, queue: null, memory: 0, saved: 0 },
    };

    // How this page was reached (a reload keeps TTV's reason in the URL and its reports in sessionStorage)
    const how = performance.getEntriesByType?.('navigation')?.[0]?.type ?? 'navigate'
        , reason = new URLSearchParams(location.search).get('reload-reason') ?? ''
        , reports = Object.keys(sessionStorage).filter(key => /^TTV-Tools/i.test(key));

    // New events wait in `pending` until they're shared with the background
    const add = log.add.bind(log);

    log.add = (type, data) => {
        const event = add(type, data);

        RECORDER?.pending.push(event);

        return event;
    };

    const since = Date.now();

    log.add('load', { how, path: pagePath(), reason, reports });

    // The tab's log from before this page: newer in the background after a navigation to another site or a respawn
    share({ load: true }, kept => {
        if(!RECORDER || RECORDER.log !== log)
            return;

        const { meta, events, fromKept } = mergeHistory(log, kept, since);

        log.meta = meta;
        log.events = events;
        log.trim();

        // The background missed this tab's history (it restarted, or the feature was just turned on): send all of it
        if(!fromKept && events.some(event => event.t < since))
            share({ replace: true });
    });

    /**
     * Listens, and remembers the listener so turning the feature off removes it.
     * @simply on(target:EventTarget, type:string, listener:function, options:object?) → undefined
     */
    const on = (target, type, listener, options = { capture: true, passive: true }) => {
        target.addEventListener(type, listener, options);
        RECORDER.listeners.push([target, type, listener, options]);
    };

    on(document, 'click', ({ target, clientX, clientY, isTrusted, button }) => {
        log.add('click', { ...describeElement(target), x: Math.round(clientX), y: Math.round(clientY), trusted: isTrusted, button });
    });

    on(window, 'pagehide', () => {
        log.add('unload', { path: pagePath() });
        persist();
        share();
    });

    on(document, 'visibilitychange', () => log.add('visibility', { state: document.visibilityState }));

    on(window, 'error', ({ message, filename, lineno }) => {
        log.add('error', { message: String(message), source: filename ? `${ filename.split('/').pop() }:${ lineno }` : '' });
    });

    on(window, 'unhandledrejection', ({ reason }) => {
        log.add('error', { message: logLine([reason ?? 'Promise rejected']), source: 'promise' });
    });

    // Ctrl tapped three times quickly saves the recording (Alt + Shift + R is the browser's Reading Mode)
    // A tap is a Ctrl press and release with nothing else pressed, so Ctrl + C and holding Ctrl don't count
    let presses = []
        , tainted = false;

    /**
     * Saves the recording on a triple Ctrl tap, or right away when the right-click menu calls it (with a copy of the click).
     * @param {KeyboardEvent|object} event The key press or release, or the menu's copy of the click
     */
    GLOBAL_EVENT_LISTENERS.KEYDOWN_CTRL_CTRL_CTRL = function Save_the_Debug_Recording(event) {
        const { type, key = '', repeat, altKey, metaKey, shiftKey, timeStamp } = event ?? {};

        // From the menu: a copy of the click, not a key
        if(!/^key(?:down|up)$/.test(type ?? ''))
            return saveRecording();

        if(type == 'keydown') {
            if(key != 'Control' || repeat || altKey || metaKey || shiftKey) {
                presses = [];
                tainted = true;
            }

            return;
        }

        if(key != 'Control')
            return;

        if(tainted)
            return tainted = false;

        presses = [...presses, timeStamp].filter(time => timeStamp - time < 750);

        if(presses.length >= 3) {
            presses = [];
            saveRecording();
        }
    };

    on(document, 'keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_CTRL_CTRL_CTRL, { capture: true });
    on(document, 'keyup', GLOBAL_EVENT_LISTENERS.KEYDOWN_CTRL_CTRL_CTRL, { capture: true });

    // TTV's own logs (recorded even when they aren't shown in the console)
    for(const name of LOG_LEVELS) {
        const original = globalThis[name];

        if(typeof original != 'function')
            continue;

        RECORDER.logs[name] = original;
        globalThis[name] = function(...args) {
            RECORDER?.log.add('log', { level: name.slice(1), text: logLine(args, 300, sensitiveTerms(Settings)) });

            return original.apply(this, args);
        };
    }

    /**
     * Notes settings that change (their values hidden where they're text).
     * @param {object} changes What changed, by key
     */
    const storageListener = changes => {
        for(const [key, { newValue }] of Object.entries(changes))
            if(key in (Settings ?? {}))
                log.add('setting', { key, value: maskSetting(key, newValue) });
    };

    Storage?.onChanged?.addListener?.(storageListener);
    RECORDER.storage = () => Storage?.onChanged?.removeListener?.(storageListener);

    // Long tasks: the page is too busy to respond
    try {
        RECORDER.observer = new PerformanceObserver(list => {
            for(const entry of list.getEntries())
                if(entry.duration >= 200)
                    log.add('lag', { ms: Math.round(entry.duration) });
        });

        RECORDER.observer.observe({ type: 'longtask', buffered: false });
    } catch {
        // Long tasks aren't reported in this browser
    }
}

plugin({
    id: 'debug_recording',
    timer: 250,

    /**
     * Samples what can't be listened for: page changes, the video, jobs, the Up Next queue, and memory.
     */
    handler() {
        if(!RECORDER)
            startRecording();

        if(!RECORDER)
            return;

        const { log, last } = RECORDER
            , now = Date.now();

        // Page changes (Twitch changes pages without reloading)
        const path = pagePath();

        if(path != last.path) {
            log.add('nav', { from: last.path, to: path });
            last.path = path;
        }

        // The video
        const video = MASTER_VIDEO ?? $('[data-a-player-state] video') ?? $('video')
            , state = {
                status: videoStatus(video),
                paused: !!video?.paused,
                ready: video?.readyState ?? 0,
                time: +(video?.currentTime ?? 0).toFixed(1),
                buffered: +(video?.buffered?.length ? video.buffered.end(video.buffered.length - 1) : 0).toFixed(1),
                height: video?.videoHeight ?? 0,
                muted: !!video?.muted,
                volume: +(video?.volume ?? 0).toFixed(2),
            }
            , key = [state.status, state.paused, state.ready, state.height, state.muted, state.volume].join('|');

        if(key != last.video) {
            log.add('video', state);
            last.video = key;
        }

        // A playing video that doesn't move
        if(!state.paused && state.status != 'none' && state.time == last.time) {
            last.stuckSince ??= now
        } else {
            if(last.stuckSince && now - last.stuckSince >= 2_000)
                log.add('stall', { time: state.time, seconds: +((now - last.stuckSince) / 1000).toFixed(1), status: state.status });
            last.stuckSince = null;
        }
        last.time = state.time;

        // Jobs starting and stopping
        for(const [name, id] of Object.entries(Jobs ?? {})) {
            if(name == 'debug_recording')
                continue;

            const running = id != null;

            if(running != (last.jobs[name] ?? false)) {
                log.add('job', { name, state: running ? 'started' : 'stopped' });
                last.jobs[name] = running;
            }
        }

        // The Up Next queue
        const queue = (ALL_FIRST_IN_LINE_JOBS ?? []).map(href => parseURL(href).pathname.slice(1).split('/')[0])
            , joined = queue.join(',');

        if(joined != last.queue) {
            log.add('upnext', { queue });
            last.queue = joined;
        }

        // Memory, every 10s (Chrome only)
        if(performance.memory && now - last.memory >= 10_000) {
            log.add('memory', { mb: Math.round(performance.memory.usedJSHeapSize / 2 ** 20) });
            last.memory = now;
        }

        if(now - last.saved >= 2_000) {
            persist();
            share();
            last.saved = now;
        }
    },

    unhandler() {
        if(!RECORDER)
            return;

        for(const [target, type, listener, options] of RECORDER.listeners)
            target.removeEventListener(type, listener, options);

        for(const [name, original] of Object.entries(RECORDER.logs))
            globalThis[name] = original;

        RECORDER.observer?.disconnect();
        delete GLOBAL_EVENT_LISTENERS.KEYDOWN_CTRL_CTRL_CTRL;
        RECORDER.storage?.();

        RECORDER = null;
        share({ clear: true });

        try {
            sessionStorage.removeItem(STORE_KEY);
        } catch {
            // Storage is blocked: nothing was kept
        }
    },

    setup() {
        startRecording();

    },
});

