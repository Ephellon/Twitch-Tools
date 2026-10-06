/*** /lib/recording.js
 * Records a `<video>`, `<audio>` or `<canvas>` with `MediaRecorder`.
 *
 * - Chunks go to disk (the origin's private file system, OPFS) in small segment files, so an hours-long DVR doesn't
 *   grow the tab's memory, and what was recorded survives a crash or a closed tab (`Recording.leftovers()`). Without
 *   OPFS, or when the disk is full, chunks stay in memory.
 * - `Recording.proxy()` records a copy of a video drawn onto a canvas. Twitch swaps the video's media source on ads and
 *   quality changes, which would end a direct capture; the canvas track never changes. Frames are drawn on a timer
 *   (not animation frames, which stop in background tabs), and the audio goes through one Web Audio node, so the
 *   source can change (`retarget()`) without splitting the file.
 * - `await recording.stop()` (or `save()`) waits for the recorder's last chunk, so clips keep their ending.
 * - Recordings are kept per element (`Recording.of(video)`). The old `video.startRecording()` …
 *   `video.saveRecording()` methods are thin wrappers over this module.
 */

const DIRECTORY = 'tt-recordings';

// A segment file is written every 5 s or 8 MB, whichever comes first
const FLUSH_MS = 5_000, FLUSH_BYTES = 8 * 1024 * 1024;

const ACTIVE = new Set(['starting', 'recording', 'paused']);

// Tried in order when the asked-for type isn't supported
const FALLBACK_TYPES = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];

/** Element → Map(name → Recording) */
const registry = new WeakMap;

/** Every recording not yet removed, for `Recording.ANY` / `Recording.ALL` across elements */
const everything = new Set;

const later = (ms, fn) => setTimeout(fn, ms);
const newID = () => globalThis.crypto?.randomUUID?.() ?? `${ Date.now().toString(36) }-${ Math.random().toString(36).slice(2) }`;

/**
 * Keeps chunks in memory.
 */
class MemoryStore {
    kind = 'memory';
    chunks = [];
    size = 0;

    async append(blob) {
        this.chunks.push(blob);
        this.size += blob.size;
    }

    async flush() {}

    async blob(type) {
        return new Blob(this.chunks, { type });
    }

    async discard() {
        this.chunks.length = this.size = 0;
    }

    async describe() {}
}

/**
 * Writes chunks to `<OPFS>/tt-recordings/<id>/` as numbered segment files, plus `meta.json`.
 * A failed write (full disk) keeps the rest in memory; `blob()` joins both.
 */
class DiskStore {
    kind = 'disk';
    size = 0;
    #dir;
    #root;
    #id;
    #pending = [];
    #pendingSize = 0;
    #lastFlush = Date.now();
    #segments = 0;
    #queue = Promise.resolve();
    #failed = false;

    /**
     * @param {string} id - The recording's ID (its folder name)
     * @returns {Promise<DiskStore>}
     */
    static async open(id) {
        const store = new DiskStore;
        const root = await (await navigator.storage.getDirectory()).getDirectoryHandle(DIRECTORY, { create: true });

        store.#root = root;
        store.#id = id;
        store.#dir = await root.getDirectoryHandle(id, { create: true });

        return store;
    }

    async append(blob) {
        this.#pending.push(blob);
        this.#pendingSize += blob.size;
        this.size += blob.size;

        if(this.#pendingSize >= FLUSH_BYTES || Date.now() - this.#lastFlush >= FLUSH_MS)
            return this.flush();
    }

    flush() {
        return this.#queue = this.#queue.then(async() => {
            if(this.#failed || !this.#pending.length)
                return;

            const parts = this.#pending.splice(0), size = this.#pendingSize;

            this.#pendingSize = 0;
            this.#lastFlush = Date.now();

            try {
                await write(this.#dir, `${ String(this.#segments).padStart(6, '0') }.part`, new Blob(parts));
                ++this.#segments;
            } catch(error) {
                // Keep what's left in memory from here on
                this.#failed = true;
                this.#pending.unshift(...parts);
                this.#pendingSize += size;
                console.warn("[recording] Disk write failed; keeping the rest in memory", error);
            }
        });
    }

    async blob(type) {
        await this.flush();

        // Segment files are disk-backed: the joined Blob doesn't load them into memory
        return new Blob([...await segments(this.#dir), ...this.#pending], { type });
    }

    async describe(meta) {
        await this.#queue;
        await write(this.#dir, 'meta.json', JSON.stringify(meta)).catch(() => {});
    }

    async discard() {
        await this.#queue.catch(() => {});
        this.#pending.length = this.#pendingSize = this.size = 0;
        await this.#root.removeEntry(this.#id, { recursive: true }).catch(() => {});
    }
}

async function write(dir, name, data) {
    const file = await dir.getFileHandle(name, { create: true });
    const stream = await file.createWritable();

    await stream.write(data);
    await stream.close();
}

/** The segment files of a recording's folder, in order */
async function segments(dir) {
    const files = [];

    for await (const [name, handle] of dir.entries())
        if(handle.kind == 'file' && name.endsWith('.part'))
            files.push([name, await handle.getFile()]);

    return files.sort(([a], [b]) => a.localeCompare(b)).map(([, file]) => file);
}

/**
 * A timer that keeps its pace in background tabs: a Worker's interval isn't throttled the way the page's is.
 * Falls back to `setInterval` when the page won't run a blob Worker.
 * @param {number} ms
 * @param {function} tick
 * @returns {function} Stops the timer
 */
function ticker(ms, tick) {
    try {
        const url = URL.createObjectURL(new Blob([`setInterval(() => postMessage(0), ${ ms | 0 })`], { type: 'text/javascript' }));
        const worker = new Worker(url);
        let fallback = null;

        worker.onmessage = tick;
        worker.onerror = () => {
            worker.terminate();
            fallback ??= setInterval(tick, ms);
        };

        return () => {
            worker.terminate();
            clearInterval(fallback);
            URL.revokeObjectURL(url);
        };
    } catch(error) {
        const id = setInterval(tick, ms);

        return () => clearInterval(id);
    }
}

/** Element → `{ stream, event }`: the one audio capture its recordings share */
const captures = new WeakMap;

/**
 * Clones of an element's captured audio tracks. Each `captureStream()` call takes the element's audio away from the
 * captures made before it (a Trophy clip or Alt+Z during a DVR silenced the DVR), so one capture is shared and every
 * recording gets its own clones. A new source (`loadedmetadata`) needs a fresh capture: every recording reacting to that
 * same event gets the same one.
 * @param {HTMLMediaElement} element
 * @param {Event} [event] - The `loadedmetadata` event that asks for a fresh capture
 * @returns {MediaStreamTrack[]}
 */
function captureAudio(element, event = null) {
    let entry = captures.get(element);

    if(!entry || (event && entry.event !== event) || !entry.stream.getAudioTracks().some(track => track.readyState == 'live'))
        captures.set(element, entry = { stream: element.captureStream(), event });

    return entry.stream.getAudioTracks().map(track => track.clone());
}

/**
 * Draws a video onto a canvas at `fps` and mixes its audio into one stable track.
 * The source can be swapped (`retarget`) while recording.
 */
class FrameProxy {
    canvas;
    stream;

    /** Resolves once the audio route is chosen (the recorder waits for it, so its track set never changes) */
    ready;

    #source;
    #context;
    #stop;
    #audio = null;
    #input = null;
    #inputTracks = [];
    #output = null;
    #listen;

    constructor(source, { fps = 30, canvas } = {}) {
        this.canvas = canvas ?? document.createElement('canvas');
        this.#context = this.canvas.getContext('2d');
        this.stream = this.canvas.captureStream(fps);
        this.#listen = event => this.#connectAudio(event);
        this.#source = source;
        this.#source.addEventListener('loadedmetadata', this.#listen);
        this.#draw();
        this.#stop = ticker(1000 / fps, () => this.#draw());
        this.ready = this.#route();
    }

    get source() {
        return this.#source;
    }

    retarget(source) {
        this.#source?.removeEventListener('loadedmetadata', this.#listen);
        this.#source = source;
        source.addEventListener('loadedmetadata', this.#listen);
        this.#draw();
        this.#connectAudio();
    }

    #draw() {
        const video = this.#source, canvas = this.canvas;

        if(!video || video.readyState < 2)
            return;

        const width = video.videoWidth || video.clientWidth, height = video.videoHeight || video.clientHeight;

        if(width && height && (canvas.width != width || canvas.height != height)) {
            canvas.width = width;
            canvas.height = height;
        }

        try {
            this.#context.drawImage(video, 0, 0, canvas.width, canvas.height);
        } catch(error) {
            // The frame isn't drawable yet
        }
    }

    #audioTracks(event = null) {
        try {
            return captureAudio(this.#source, event);
        } catch(error) {
            return [];
        }
    }

    // Web Audio when the page may play sound (one output track that survives source swaps); otherwise the captured track
    // itself, which goes silent after Twitch swaps its media source (as before the rewrite). A tab opened without a click
    // can't start an AudioContext, and a suspended one would record silence.
    async #route() {
        try {
            const context = new AudioContext;

            if(context.state != 'running')
                await Promise.race([context.resume(), new Promise(resolve => later(500, resolve))]);

            if(context.state != 'running') {
                context.close().catch(() => {});
                throw new Error("AudioContext not allowed to start");
            }

            this.#audio = context;
            this.#output = context.createMediaStreamDestination();

            for(const track of this.#output.stream.getAudioTracks())
                this.stream.addTrack(track);
        } catch(error) {
            for(const track of this.#audioTracks())
                this.stream.addTrack(track);

            return;
        }

        this.#connectAudio();
    }

    #connectAudio(event = null) {
        if(!this.#audio)
            return;

        const tracks = this.#audioTracks(event);

        if(!tracks.length)
            return;

        this.#input?.disconnect();

        for(const track of this.#inputTracks)
            track.stop();

        this.#inputTracks = tracks;
        this.#input = this.#audio.createMediaStreamSource(new MediaStream(tracks));
        this.#input.connect(this.#output);
    }

    stop() {
        this.#stop?.();
        this.#source?.removeEventListener('loadedmetadata', this.#listen);
        this.#input?.disconnect();
        this.#audio?.close().catch(() => {});

        for(const track of [...this.stream.getTracks(), ...this.#inputTracks])
            track.stop();
    }
}

/**
 * Downloads a Blob through a link (kept in `<head>` so the page can show it again).
 * @param {Blob} blob
 * @param {string} as - File name, without extension
 * @returns {Promise<HTMLAnchorElement>}
 */
async function download(blob, as) {
    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = `${ as }.${ await Recording.guessMIMEType(blob) }`;
    link.dataset.saveName = as;
    link.textContent = as;
    link.click();

    document.head.append(link.cloneNode(true));

    return link;
}

/** Sets `data-recording-status` on the player while any shown recording runs (styled in extras.css) */
function updateStatus() {
    let active = false;

    for(const recording of everything)
        if((active = !recording.hidden && ['recording', 'paused'].includes(recording.state)))
            break;

    globalThis.document?.querySelector?.('[data-a-player-state]')?.setAttribute('data-recording-status', active);
}

/** The first supported type: the asked-for one, else a fallback */
function supportedType(mimeType) {
    const supported = type => globalThis.MediaRecorder?.isTypeSupported?.(type) ?? true;

    return [mimeType, ...FALLBACK_TYPES].find(type => type && supported(type)) ?? '';
}

export class Recording extends EventTarget {
    static ANY = Symbol('Any');
    static ALL = Symbol('All');

    /** Used by tests to replace the storage (`(id) => store`); defaults to disk, else memory */
    static storage = null;

    id = newID();
    name;
    as;
    source;
    element;
    mimeType;
    hidden;
    maxTime;
    creationTime = Date.now();
    completionTime = null;
    state = 'starting';

    /** Resolves `{ type: 'stop', target }` once the last chunk is stored; rejects on `abort()` or a recorder error */
    done;

    #recorder = null;
    #store = null;
    #storeReady;
    #proxy = null;
    #resolve;
    #reject;
    #timer = null;
    #recorded = 0;
    #since = null;
    #writes = Promise.resolve();
    #link = null;
    #linkSize = -1;
    #saving = Promise.resolve();
    #count = 0;

    /**
     * Starts recording.
     * @param {HTMLMediaElement|HTMLCanvasElement} source - The element to record (and to file the recording under)
     * @param {Object} [options]
     * @param {string} [options.name='DEFAULT_RECORDING'] - Key for `Recording.of(source).get(name)`
     * @param {string} [options.as] - File name used by `save()` (no extension)
     * @param {number} [options.maxTime=Infinity] - Stops by itself after this many ms
     * @param {string} [options.mimeType='video/webm'] - Falls back to a supported type
     * @param {boolean} [options.hidden=false] - Don't show the player's recording indicator
     * @param {number} [options.chunksPerSecond=1]
     * @param {MediaStream} [options.stream] - Record this stream instead of `source.captureStream()`
     * @param {FrameProxy} [options.proxy] - Internal: set by `Recording.proxy()`
     */
    constructor(source, { name = 'DEFAULT_RECORDING', as, maxTime = Infinity, mimeType = 'video/webm', hidden = false, chunksPerSecond = 1, stream, proxy, ...options } = {}) {
        super();

        if(!stream && !proxy && typeof source?.captureStream != 'function')
            throw new TypeError(`new Recording(source) needs a <video>, <audio> or <canvas> that can be captured; not <${ source?.constructor?.name }>`);

        this.name = String(name);
        this.as = String(as ?? (globalThis.ClipName ? new globalThis.ClipName : this.name));
        this.source = source;
        this.element = proxy?.canvas ?? source;
        this.maxTime = Number(maxTime) > 0 ? Number(maxTime) : Infinity;
        this.hidden = !!hidden;
        this.mimeType = supportedType(mimeType);
        this.#proxy = proxy ?? null;

        this.done = new Promise((resolve, reject) => {
            this.#resolve = resolve;
            this.#reject = reject;
        });

        this.done.catch(() => {});

        // A newer recording under the same name on the same element replaces the older (which stops, keeping its data)
        const own = Recording.of(source);

        if(own.get(this.name)?.active)
            own.get(this.name).stop();

        own.set(this.name, this);
        everything.add(this);

        this.#storeReady = this.#openStore();

        try {
            stream ??= proxy?.stream ?? source.captureStream();
            this.#recorder = new MediaRecorder(stream, { ...options, mimeType: this.mimeType });
        } catch(error) {
            this.#fail(error);
            return;
        }

        const recorder = this.#recorder;

        recorder.ondataavailable = ({ data }) => {
            if(!data?.size)
                return;

            ++this.#count;
            this.#writes = this.#writes.then(() => this.#storeReady).then(store => store.append(data)).catch(error => console.warn("[recording]", error));
            this.dispatchEvent(Object.assign(new Event('data'), { data }));
        };

        recorder.onerror = ({ error }) => this.#fail(error ?? new Error("MediaRecorder error"));
        recorder.onstop = () => this.#finish();

        // Wait for a video track (a fresh capture can take a moment), then go
        const begin = (tries = 0) => {
            if(this.state != 'starting')
                return;

            const waiting = proxy
                ? proxy.source.readyState < 2
                : !stream.getVideoTracks().length && !stream.getAudioTracks().length;

            if(waiting && tries < 100)
                return void later(100, () => begin(tries + 1));

            try {
                recorder.start(Math.min(Math.max(Math.round(1000 / chunksPerSecond), 1), 1000));
            } catch(error) {
                return this.#fail(error);
            }

            this.mimeType = recorder.mimeType || this.mimeType;
            this.#setState('recording');
            this.#since = Date.now();
            this.dispatchEvent(new Event('start'));

            if(Number.isFinite(this.maxTime))
                this.#timer = later(this.maxTime, () => this.stop());
        };

        // A proxy picks its audio route first, so the recorder's track set never changes
        if(proxy)
            proxy.ready.then(() => begin());
        else
            begin();
    }

    async #openStore() {
        try {
            if(Recording.storage)
                return this.#store = await Recording.storage(this.id);

            if(globalThis.navigator?.storage?.getDirectory) {
                // Lock first: another tab's cleanup() would take a just-made (still empty) folder for a leftover
                await Recording.#lock(this.id, this.done);

                const store = await DiskStore.open(this.id);

                await store.describe(this.#meta());

                return this.#store = store;
            }
        } catch(error) {
            console.warn("[recording] No disk storage; recording to memory", error);
        }

        return this.#store = new MemoryStore;
    }

    // Holds a Web Lock while the recording lives, so another tab doesn't take its folder for a leftover
    static async #lock(id, until) {
        if(!globalThis.navigator?.locks)
            return;

        await new Promise(acquired =>
            navigator.locks.request(`${ DIRECTORY }:${ id }`, () => {
                acquired();

                return until.catch(() => {});
            })
        );
    }

    #meta(extra = {}) {
        return { id: this.id, name: this.name, as: this.as, mimeType: this.mimeType, creationTime: this.creationTime, completionTime: this.completionTime, saved: false, ...extra };
    }

    #setState(state) {
        this.state = state;
        updateStatus();
    }

    async #finish() {
        if(!ACTIVE.has(this.state) && this.state != 'stopping')
            return;

        clearTimeout(this.#timer);
        this.#account();
        this.#proxy?.stop();
        this.completionTime ??= Date.now();

        try {
            await this.#writes;

            const store = await this.#storeReady;

            await store.flush();
            await store.describe(this.#meta());
        } catch(error) {
            // The data that made it is still there
        }

        this.#setState('stopped');

        const event = new Event('stop');

        this.dispatchEvent(event);
        this.#resolve({ type: 'stop', target: this });
    }

    #fail(error, state = 'aborted') {
        if(!ACTIVE.has(this.state) && this.state != 'stopping')
            return;

        clearTimeout(this.#timer);
        this.#account();
        this.#proxy?.stop();
        this.completionTime ??= Date.now();

        try {
            if(this.#recorder?.state != 'inactive')
                this.#recorder?.stop();
        } catch(error) {
            // Already inactive
        }

        this.#setState(state);
        this.dispatchEvent(Object.assign(new Event('error'), { error }));
        this.#reject(error);
    }

    #account() {
        if(this.#since != null)
            this.#recorded += Date.now() - this.#since;
        this.#since = null;
    }

    /** Recording or paused (not yet stopped) */
    get active() {
        return ACTIVE.has(this.state);
    }

    /** Bytes recorded so far */
    get size() {
        return this.#store?.size ?? 0;
    }

    /** Number of chunks received */
    get count() {
        return this.#count;
    }

    /** Time recorded, in ms, not counting pauses */
    get duration() {
        return this.#recorded + (this.#since != null ? Date.now() - this.#since : 0);
    }

    /** Average bits per second so far */
    get bitrate() {
        return this.duration > 0 ? Math.round(this.size * 8000 / this.duration) : 0;
    }

    /** Where the chunks are kept: 'disk' or 'memory' (null until known) */
    get storage() {
        return this.#store?.kind ?? null;
    }

    /**
     * Pauses; resumes by itself after `resumeAfter` ms when given.
     * @param {number} [resumeAfter=Infinity]
     * @returns {Recording}
     */
    pause(resumeAfter = Infinity) {
        if(this.state == 'recording') {
            this.#recorder.pause();
            this.#account();
            this.#setState('paused');
            this.dispatchEvent(new Event('pause'));

            if(Number.isFinite(resumeAfter))
                later(resumeAfter, () => this.resume());
        }

        return this;
    }

    /** @returns {Recording} */
    resume() {
        if(this.state == 'paused') {
            this.#recorder.resume();
            this.#since = Date.now();
            this.#setState('recording');
            this.dispatchEvent(new Event('resume'));
        }

        return this;
    }

    /**
     * Stops recording. Chainable (`recording.stop().save()`); `await recording.done` (or `save()`) waits for the last
     * chunk.
     * @returns {Recording}
     */
    stop() {
        if(this.state == 'starting') {
            this.state = 'stopping';
            this.#finish();
        } else if(this.state == 'recording' || this.state == 'paused') {
            this.#account();
            this.state = 'stopping';

            try {
                this.#recorder.stop();
            } catch(error) {
                this.#finish();
            }
        }

        return this;
    }

    /**
     * Stops and rejects `done` with `reason`. The data is kept (salvageable with `save()`) until `discard()`.
     * @param {*} [reason]
     * @returns {Recording}
     */
    abort(reason = 'Recording has been canceled') {
        this.#fail(reason);

        return this;
    }

    /**
     * Everything recorded so far, as one Blob. While recording, asks the recorder for its latest chunk first.
     * @returns {Promise<Blob>}
     */
    async blob() {
        if(this.state == 'stopping')
            await this.done.catch(() => {});

        if(this.state == 'recording' || this.state == 'paused') {
            await new Promise(resolve => {
                this.#recorder.addEventListener('dataavailable', resolve, { once: true });
                this.#recorder.requestData();
                later(1000, resolve);
            })
        }

        await this.#writes;

        return (await this.#storeReady).blob(this.mimeType.split(';')[0]);
    }

    /**
     * Downloads what was recorded (stop first for the whole clip; while recording it saves what's there so far).
     * Saving again without new data returns the same link.
     * @param {string} [as] - File name, without extension
     * @returns {Promise<HTMLAnchorElement>}
     */
    save(as = null) {
        // One at a time, so two callers saving the same data get the same link (one download)
        return this.#saving = this.#saving.catch(() => {}).then(async() => {
            const blob = await this.blob();

            if(!blob.size)
                throw `Unable to save clip. No recording data available.`;

            as = String(as ?? this.as);

            if(this.#link && this.#linkSize == blob.size && this.#link.dataset.saveName == as)
                return this.#link;

            const link = await download(blob, as);

            this.#link = link;
            this.#linkSize = blob.size;
            this.#store?.describe(this.#meta({ saved: true }));

            return link;
        });
    }

    /**
     * Stops (if needed), deletes the data, and forgets the recording. A saved recording's files stay until the next
     * page load, so a download in progress can finish.
     */
    async discard() {
        if(this.active)
            this.abort('Recording discarded');

        everything.delete(this);

        const own = Recording.of(this.source);

        if(own.get(this.name) === this)
            own.delete(this.name);

        updateStatus();

        if(!this.#link)
            await (await this.#storeReady)?.discard();
    }

    /**
     * Records from another element from now on, in the same file (proxied recordings only).
     * @param {HTMLVideoElement} source
     * @returns {Recording}
     */
    retarget(source) {
        if(!this.#proxy)
            throw new TypeError("Only a proxied recording (Recording.proxy) can change its source");

        this.#proxy.retarget(source);

        return this;
    }

    /**
     * The recordings filed under an element (by name).
     * @param {Element} element
     * @returns {Map<string, Recording>}
     */
    static of(element) {
        let own = registry.get(element);

        if(!own)
            registry.set(element, own = new Map);

        return own;
    }

    /**
     * Every recording not yet discarded, oldest first.
     * @param {Object} [filter]
     * @param {boolean} [filter.active] - Only running (or only finished) ones
     * @returns {Recording[]}
     */
    static list({ active } = {}) {
        return [...everything].filter(recording => active === void null || recording.active === active);
    }

    /**
     * Finds a recording by name, or the first running one (`Recording.ANY`).
     * @param {string|symbol} name
     * @param {Element} [element] - Only look under this element
     * @returns {Recording|undefined}
     */
    static find(name, element = null) {
        const pool = element ? [...Recording.of(element).values()] : Recording.list();

        if(name === Recording.ANY)
            return pool.find(recording => recording.active);

        return pool.findLast(recording => recording.name == name);
    }

    /**
     * Records a copy of a video drawn onto a canvas (see the file header).
     * @param {HTMLVideoElement} from
     * @param {Object} [options] - As for `new Recording`, plus `fps` (30)
     * @returns {Recording}
     */
    static proxy(from, { fps = 30, canvas, ...options } = {}) {
        if(typeof from?.captureStream != 'function')
            throw new TypeError(`Recording.proxy(from) needs a <video> that can be captured; not <${ from?.constructor?.name }>`);

        return new Recording(from, { ...options, proxy: new FrameProxy(from, { fps, canvas }) });
    }

    /**
     * Recordings left on disk by a closed or crashed tab (not held by any open tab).
     * @returns {Promise<Array<{ id: string, name: string, as: string, mimeType: string, creationTime: number, saved: boolean, size: number, blob: function(): Promise<Blob>, save: function(string=): Promise<HTMLAnchorElement>, discard: function(): Promise<void> }>>}
     */
    static async leftovers() {
        if(!globalThis.navigator?.storage?.getDirectory)
            return [];

        const root = await (await navigator.storage.getDirectory()).getDirectoryHandle(DIRECTORY, { create: true });
        const found = [];

        for await (const [id, dir] of root.entries()) {
            if(dir.kind != 'directory' || [...everything].some(recording => recording.id == id))
                continue;

            if(globalThis.navigator?.locks) {
                const held = await navigator.locks.request(`${ DIRECTORY }:${ id }`, { ifAvailable: true }, lock => !lock);

                if(held)
                    continue;
            }

            let meta = {};

            try {
                meta = JSON.parse(await (await (await dir.getFileHandle('meta.json')).getFile()).text());
            } catch(error) {
                // No metadata: still recoverable
            }

            const files = await segments(dir);
            const type = String(meta.mimeType ?? 'video/webm').split(';')[0];

            const blob = () => new Blob(files, { type });

            found.push({
                id, saved: false, ...meta,
                size: files.reduce((total, file) => total + file.size, 0),
                blob: async() => blob(),
                async save(as = meta.as ?? id) {
                    const link = await download(blob(), as);

                    await write(dir, 'meta.json', JSON.stringify({ ...meta, saved: true })).catch(() => {});

                    return link;
                },
                discard: () => root.removeEntry(id, { recursive: true }).catch(() => {}),
            });
        }

        return found;
    }

    /**
     * Deletes leftovers that were already saved, and empty ones.
     * @returns {Promise<number>} How many were deleted
     */
    static async cleanup() {
        let count = 0;

        for(const leftover of await Recording.leftovers().catch(() => []))
            if(leftover.saved || !leftover.size)
                await leftover.discard(), ++count;

        return count;
    }

    /**
     * The file extension for a recording, from its declared type or its first bytes.
     * @param {Blob} blob
     * @returns {Promise<string>}
     */
    static async guessMIMEType(blob) {
        const find = type => globalThis.MIME_Types?.find?.(type) ?? ({ 'video/webm': 'webm', 'video/x-matroska': 'mkv', 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/ogg': 'ogv', 'audio/wav': 'wav', 'video/x-msvideo': 'avi' })[type] ?? 'bin';
        const declared = String(blob?.type ?? '').toLowerCase().split(';')[0];

        if(declared)
            return find(declared);

        const bytes = new Uint8Array(await blob.slice(0, 64).arrayBuffer());
        const ascii = (from, to) => String.fromCharCode(...bytes.slice(from, to));
        let type = 'application/octet-stream';

        // EBML (WebM/Matroska): 1A 45 DF A3, with the DocType ("webm" or "matroska") close behind
        if(bytes[0] == 0x1A && bytes[1] == 0x45 && bytes[2] == 0xDF && bytes[3] == 0xA3)
            type = ascii(0, 64).includes('webm') ? 'video/webm' : 'video/x-matroska';
        // ISO BMFF: "ftyp" at 4, brand at 8
        else if(ascii(4, 8) == 'ftyp')
            type = ascii(8, 10) == 'qt' ? 'video/quicktime' : 'video/mp4';
        // Ogg
        else if(ascii(0, 4) == 'OggS')
            type = 'video/ogg';
        // RIFF: WAVE or AVI
        else if(ascii(0, 4) == 'RIFF')
            type = ({ 'WAVE': 'audio/wav', 'AVI ': 'video/x-msvideo' })[ascii(8, 12)] ?? type;

        return find(type);
    }
}

/**
 * The old per-video methods, kept as thin wrappers. `key` is a name, `Recording.ANY` or `Recording.ALL`.
 */
export function installVideoMethods(Video = globalThis.HTMLVideoElement) {
    if(!Video)
        return;

    // Recording.ANY → the first running one; a name → the latest under it
    const pick = (element, key) =>
        key === Recording.ALL
            ? [...Recording.of(element).values()].filter(recording => recording.active)
            : [Recording.find(key, element)].filter(Boolean);

    Object.assign(Video.prototype, {
        startRecording(options = {}) {
            return new Recording(this, options);
        },
        getRecording(key = 'DEFAULT_RECORDING') {
            return key === Recording.ALL ? Recording.of(this) : Recording.find(key, this);
        },
        // Running (or paused) only, as before: a stopped recording no longer counts
        hasRecording(key = 'DEFAULT_RECORDING') {
            return !!Recording.find(key, this)?.active;
        },
        removeRecording(key = 'DEFAULT_RECORDING') {
            for(const recording of key === Recording.ALL ? [...Recording.of(this).values()] : pick(this, key))
                recording.discard();

            return this;
        },
        pauseRecording(key = 'DEFAULT_RECORDING') {
            pick(this, key).forEach(recording => recording.pause());

            return this;
        },
        resumeRecording(key = 'DEFAULT_RECORDING') {
            pick(this, key).forEach(recording => recording.resume());

            return this;
        },
        cancelRecording(key = 'DEFAULT_RECORDING', reason = 'Recording has been canceled') {
            pick(this, key).forEach(recording => recording.abort(reason));

            return this;
        },
        stopRecording(key = 'DEFAULT_RECORDING') {
            pick(this, key).forEach(recording => recording.stop());

            return this;
        },
        saveRecording(key = 'DEFAULT_RECORDING', name = null) {
            if(key === Recording.ALL)
                return [...Recording.of(this).values()].map((recording, index) => recording.save(index && name ? `${ name } (${ index + 1 })` : name));

            return Recording.find(key, this)?.save(name);
        },
    });
}
