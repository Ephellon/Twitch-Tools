/*** /plugins/developer/debug-recording.js
 * Debug Recording (phase 1): keeps a rolling log of clicks, page changes, reloads, the video's status, and what TTV did
 * (jobs, logs, errors, Up Next, settings), with messages hidden. Alt + Shift + R saves it as an `.html` file to attach
 * to an issue. The log survives reloads (per tab, in `sessionStorage`). See lib/debug-recorder.js.
 */

import { plugin } from '../../lib/plugins.js';
import { DebugLog, buildRecording, describeElement, logLine, maskSetting } from '../../lib/debug-recorder.js';

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
        , stamp = new Date(saved).toISOString().replace(/\.\d+Z$/, '').replace(/:/g, '-');

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
    if(RECORDER)
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
            browser: navigator.userAgent.match(/(?:Edg|OPR|Firefox|Chrome)\/[\d.]+/)?.[0] ?? '',
        },
        events: kept?.events ?? [],
    });

    RECORDER = {
        log,
        listeners: [],
        logs: {},
        last: { path: pagePath(), video: '', time: -1, stuckSince: null, jobs: {}, queue: null, memory: 0, saved: 0 },
    };

    // How this page was reached (a reload keeps TTV's reason in the URL and its reports in sessionStorage)
    const how = performance.getEntriesByType?.('navigation')?.[0]?.type ?? 'navigate'
        , reason = new URLSearchParams(location.search).get('reload-reason') ?? ''
        , reports = Object.keys(sessionStorage).filter(key => /^TTV-Tools/i.test(key));

    log.add('load', { how, path: pagePath(), reason, reports });

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
    });

    on(document, 'visibilitychange', () => log.add('visibility', { state: document.visibilityState }));

    on(window, 'error', ({ message, filename, lineno }) => {
        log.add('error', { message: String(message), source: filename ? `${ filename.split('/').pop() }:${ lineno }` : '' });
    });

    on(window, 'unhandledrejection', ({ reason }) => {
        log.add('error', { message: logLine([reason ?? 'Promise rejected']), source: 'promise' });
    });

    // Alt + Shift + R saves the recording
    on(document, 'keydown', ({ key = '', altKey, ctrlKey, metaKey, shiftKey }) => {
        if(altKey && shiftKey && !(ctrlKey || metaKey) && key.equals('r'))
            saveRecording();
    }, { capture: true });

    // TTV's own logs (recorded even when they aren't shown in the console)
    for(const name of LOG_LEVELS) {
        const original = globalThis[name];

        if(typeof original != 'function')
            continue;

        RECORDER.logs[name] = original;
        globalThis[name] = function(...args) {
            RECORDER?.log.add('log', { level: name.slice(1), text: logLine(args) });

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
        RECORDER.storage?.();

        RECORDER = null;

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

