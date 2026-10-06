/**
 * Recording: last chunk kept on stop, pauses, per-element registry, disk segments and leftovers, file types, and the
 * old video methods. MediaRecorder and OPFS are faked.
 */

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

class FakeRecorder extends EventTarget {
    static supported = type => !/mp4/.test(type);
    static isTypeSupported(type) { return FakeRecorder.supported(type) }

    constructor(stream, { mimeType }) {
        super();
        this.stream = stream;
        this.mimeType = mimeType;
        this.state = 'inactive';
        FakeRecorder.last = this;
    }

    emit(text) {
        const event = Object.assign(new Event('dataavailable'), { data: new Blob([text]) });

        this.ondataavailable?.(event);
        this.dispatchEvent(event);
    }

    start() { this.state = 'recording' }
    pause() { this.state = 'paused' }
    resume() { this.state = 'recording' }
    requestData() { setTimeout(() => this.emit('[now]'), 1) }

    // Like the real one: the last chunk comes after stop() returns, then `stop`
    stop() {
        setTimeout(() => {
            this.emit('[last]');
            this.state = 'inactive';
            this.onstop?.();
        }, 5);
    }
}

class FakeFile {
    kind = 'file';
    data = new Blob([]);

    async createWritable() {
        const parts = [];

        return { write: async part => parts.push(part), close: async() => { this.data = new Blob(parts) } };
    }

    async getFile() { return this.data }
}

class FakeDir {
    kind = 'directory';
    map = new Map;

    async getDirectoryHandle(name, { create } = {}) {
        if(!this.map.has(name)) {
            if(!create) throw new Error('NotFoundError');
            this.map.set(name, new FakeDir);
        }
        return this.map.get(name);
    }

    async getFileHandle(name, { create } = {}) {
        if(!this.map.has(name)) {
            if(!create) throw new Error('NotFoundError');
            this.map.set(name, new FakeFile);
        }
        return this.map.get(name);
    }

    async removeEntry(name) { this.map.delete(name) }

    async *entries() { yield* this.map.entries() }
}

let opfs;

globalThis.MediaRecorder = FakeRecorder;
globalThis.document = {
    head: { append() {} },
    querySelector() { return null },
    createElement: () => ({ dataset: {}, click() {}, cloneNode() { return this } }),
};
Object.defineProperty(globalThis.navigator, 'storage', { configurable: true, value: { getDirectory: async() => opfs } });

const { Recording, installVideoMethods } = await import('../recording.js');

const element = (name = 'HTMLVideoElement') => ({
    constructor: { name },
    captureStream: () => ({ getVideoTracks: () => [{}], getAudioTracks: () => [] }),
});
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const text = async recording => (await recording.blob()).text();

beforeEach(() => {
    opfs = new FakeDir;

    for(const recording of Recording.list())
        recording.discard();
});

test('stop() keeps the last chunk: done and save() wait for it', async() => {
    const recording = new Recording(element(), { name: 'clip' });

    assert.equal(recording.state, 'recording');
    FakeRecorder.last.emit('a');
    FakeRecorder.last.emit('b');

    const event = await recording.stop().done;

    assert.equal(event.target, recording);
    assert.equal(recording.state, 'stopped');
    assert.equal(await text(recording), 'ab[last]');
    assert.equal(recording.storage, 'disk');

    const link = await recording.save('My clip');

    assert.equal(link.download, 'My clip.webm');
    assert.equal(await recording.save('My clip'), link, 'no new data: same link');

    const [x, y] = await Promise.all([recording.save('Twice'), recording.save('Twice')]);

    assert.equal(x, y, 'saves at the same time: one download');
});

test('save() while recording saves what is there so far, without stopping', async() => {
    const recording = new Recording(element());

    FakeRecorder.last.emit('a');
    await recording.save();

    assert.equal(recording.state, 'recording');
    assert.equal(await text(recording), 'a[now][now]');
    await recording.stop().done;
});

test('pause/resume: states, events, and duration without the pause', async() => {
    const recording = new Recording(element()), seen = [];

    for(const type of ['pause', 'resume', 'stop'])
        recording.addEventListener(type, () => seen.push(type));

    await wait(20);
    recording.pause();
    assert.equal(recording.state, 'paused');

    const paused = recording.duration;

    await wait(40);
    assert.equal(recording.duration, paused, 'no time counted while paused');

    recording.resume();
    assert.equal(recording.state, 'recording');
    await recording.stop().done;
    assert.deepEqual(seen, ['pause', 'resume', 'stop']);
});

test('maxTime stops by itself', async() => {
    const recording = new Recording(element(), { maxTime: 20 });

    await recording.done;
    assert.equal(recording.state, 'stopped');
    assert.ok(recording.completionTime >= recording.creationTime);
});

test('recordings are kept per element; a repeat name on one element replaces (and stops) the older', async() => {
    const one = element(), two = element();
    const a = new Recording(one, { name: 'X' }), b = new Recording(two, { name: 'X' });

    assert.equal(Recording.of(one).get('X'), a);
    assert.equal(Recording.of(two).get('X'), b);
    assert.equal(Recording.find('X', one), a);

    const c = new Recording(one, { name: 'X' });

    await a.done;
    assert.equal(a.state, 'stopped');
    assert.equal(Recording.of(one).get('X'), c);
    assert.equal(Recording.find(Recording.ANY, one), c);

    await Promise.all([b.stop().done, c.stop().done]);
    assert.equal(Recording.find(Recording.ANY), undefined);
});

test('abort() rejects done but keeps the data; discard() forgets it and deletes the files', async() => {
    const recording = new Recording(element(), { name: 'gone' });

    FakeRecorder.last.emit('kept');
    recording.abort('nope');
    await assert.rejects(recording.done, /nope/);
    assert.equal(recording.state, 'aborted');
    assert.match(await text(recording), /^kept/);

    const folders = (await opfs.getDirectoryHandle('tt-recordings')).map;

    assert.ok(folders.has(recording.id));
    await recording.discard();
    assert.ok(!folders.has(recording.id));
    assert.ok(!Recording.list().includes(recording));
});

test('without OPFS, chunks stay in memory', async() => {
    const storage = navigator.storage;

    Object.defineProperty(navigator, 'storage', { configurable: true, value: undefined });

    try {
        const recording = new Recording(element());

        FakeRecorder.last.emit('m');
        await recording.stop().done;
        assert.equal(recording.storage, 'memory');
        assert.equal(await text(recording), 'm[last]');
    } finally {
        Object.defineProperty(navigator, 'storage', { configurable: true, value: storage });
    }
});

test('leftovers: folders from a closed tab are listed and recoverable; cleanup() removes saved ones', async() => {
    const root = await opfs.getDirectoryHandle('tt-recordings', { create: true });

    for(const [id, saved] of [['old', false], ['done', true]]) {
        const dir = await root.getDirectoryHandle(id, { create: true });

        for(const [name, data] of [['000000.part', 'ab'], ['000001.part', 'cd'], ['meta.json', JSON.stringify({ name: id, as: `Clip ${ id }`, mimeType: 'video/webm;codecs=vp9', saved })]]) {
            const stream = await (await dir.getFileHandle(name, { create: true })).createWritable();

            await stream.write(data);
            await stream.close();
        }
    }

    const leftovers = await Recording.leftovers();
    const old = leftovers.find(({ id }) => id == 'old');

    assert.equal(leftovers.length, 2);
    assert.equal(old.as, 'Clip old');
    assert.equal(old.size, 4);
    assert.equal(await (await old.blob()).text(), 'abcd');
    assert.equal((await old.blob()).type, 'video/webm');

    assert.equal(await Recording.cleanup(), 1);
    assert.deepEqual([...root.map.keys()], ['old']);

    const link = await old.save();

    assert.equal(link.download, 'Clip old.webm');
    assert.equal(await Recording.cleanup(), 1, 'saved: removed on the next cleanup');
    assert.deepEqual([...root.map.keys()], []);
});

test('an unsupported type falls back to a supported one', async() => {
    const recording = new Recording(element(), { mimeType: 'video/mp4' });

    assert.match(recording.mimeType, /^video\/webm/);
    await recording.stop().done;
});

test('guessMIMEType: declared type first, else the first bytes', async() => {
    const bytes = (...parts) => new Blob([new Uint8Array(parts.flatMap(part => typeof part == 'string' ? [...part].map(c => c.charCodeAt(0)) : part))]);

    assert.equal(await Recording.guessMIMEType(new Blob([''], { type: 'video/webm;codecs=vp9' })), 'webm');
    assert.equal(await Recording.guessMIMEType(bytes([0x1A, 0x45, 0xDF, 0xA3], 'xxxxwebm')), 'webm');
    assert.equal(await Recording.guessMIMEType(bytes([0x1A, 0x45, 0xDF, 0xA3], 'xxxxmatroska')), 'mkv');
    assert.equal(await Recording.guessMIMEType(bytes([0, 0, 0, 0x18], 'ftypisom')), 'mp4');
    assert.equal(await Recording.guessMIMEType(bytes([0, 0, 0, 0x14], 'ftypqt  ')), 'mov');
    assert.equal(await Recording.guessMIMEType(bytes('OggS')), 'ogv');
});

test('the old video methods wrap the module', async() => {
    class Video {
        constructor() { Object.assign(this, element()) }
    }

    installVideoMethods(Video);

    const video = new Video;
    const recording = video.startRecording({ name: 'R' });

    assert.ok(video.hasRecording('R'));
    assert.ok(video.hasRecording(Recording.ANY));
    assert.equal(video.getRecording('R'), recording);
    assert.equal(video.getRecording(Recording.ALL).get('R'), recording);

    video.pauseRecording('R');
    assert.equal(recording.state, 'paused');
    video.resumeRecording(Recording.ALL);
    assert.equal(recording.state, 'recording');

    FakeRecorder.last.emit('x');

    const link = await video.stopRecording('R').saveRecording('R', 'Named');

    assert.equal(link.download, 'Named.webm');
    assert.equal(await text(recording), 'x[last]');

    video.removeRecording('R');
    assert.ok(!video.hasRecording('R'));
});
