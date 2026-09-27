/*** /scripts/build.mjs
 * Builds the loadable extension for each browser.
 *
 *     node scripts/build.mjs              → dist/chrome/, dist/firefox/
 *     node scripts/build.mjs --zip        → also dist/ttv-tools.zip, dist/ttv-tools-firefox.zip
 *
 * `ttv-tools/` stays the source of truth and still loads unpacked in Chrome as-is. The build
 * copies it (minus dev-only files), then rewrites `manifest.json` per target. Bundling with
 * esbuild joins this step once plugins land in Phase 3 (see REVAMP.md).
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const SOURCE = 'ttv-tools';
const OUTPUT = 'dist';
const ZIP = process.argv.includes('--zip');

// Firefox needs a stable add-on ID; changing it after publishing orphans existing installs
const GECKO_ID = 'ttv-tools@ephellon.github.io';
const GECKO_MIN_VERSION = '142.0';

// Paths (relative to SOURCE, forward slashes) left out of every build
const EXCLUDE = [
    /^dsl\/tests\//,
    /^dsl\/.+\.(md|ebnf)$/,
    /(^|\/)-[^/]*$/,            // Local scratch files, e.g. `-test.js` (see .gitignore)
    /(^|\/)\.[^/]*$/,           // Dotfiles
];

const TARGETS = {
    chrome(manifest) {
        return manifest;
    },

    firefox(manifest) {
        let { background, web_accessible_resources, ...rest } = manifest;

        delete rest.minimum_chrome_version;
        delete rest.options_page;       // Firefox only reads `options_ui`

        return {
            ...rest,

            // Firefox has no extension service workers; the same file runs as an event page
            background: { scripts: [background.service_worker], type: background.type },

            web_accessible_resources: web_accessible_resources.map(({ use_dynamic_url, ...resource }) => resource),

            browser_specific_settings: {
                gecko: {
                    id: GECKO_ID,
                    strict_min_version: GECKO_MIN_VERSION,
                    data_collection_permissions: { required: ['none'] },
                },
            },
        };
    },
};

function listFiles(directory, base = directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        let full = path.join(directory, entry.name);

        return entry.isDirectory()?
            listFiles(full, base):
        [path.relative(base, full).split(path.sep).join('/')];
    });
}

const files = listFiles(SOURCE).filter(file => !EXCLUDE.some(pattern => pattern.test(file))).sort();
const manifest = JSON.parse(fs.readFileSync(path.join(SOURCE, 'manifest.json'), 'utf8'));

fs.rmSync(OUTPUT, { recursive: true, force: true });

for(let [target, transform] of Object.entries(TARGETS)) {
    let directory = path.join(OUTPUT, target);
    let entries = [];

    for(let file of files) {
        let data = file == 'manifest.json'?
            Buffer.from(JSON.stringify(transform(structuredClone(manifest)), null, 4) + '\n'):
        fs.readFileSync(path.join(SOURCE, file));

        fs.mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
        fs.writeFileSync(path.join(directory, file), data);
        entries.push({ name: file, data });
    }

    console.log(`${ target }: ${ entries.length } files → ${ directory }`);

    if(ZIP) {
        let name = target == 'chrome'? 'ttv-tools.zip': `ttv-tools-${ target }.zip`;

        fs.writeFileSync(path.join(OUTPUT, name), zip(entries));
        console.log(`${ target }: ${ path.join(OUTPUT, name) }`);
    }
}

// Minimal ZIP writer (deflate, forward-slash paths) so the build needs no platform `zip` tool
function zip(entries) {
    let locals = [], centrals = [], offset = 0;
    let [time, date] = dosDateTime(new Date);

    for(let { name, data } of entries) {
        let nameBuffer = Buffer.from(name, 'utf8');
        let compressed = zlib.deflateRawSync(data, { level: 9 });
        let [method, body] = compressed.length < data.length? [8, compressed]: [0, data];
        let crc = crc32(data);

        let header = Buffer.alloc(30);
        header.writeUInt32LE(0x04034b50, 0);
        header.writeUInt16LE(20, 4);
        header.writeUInt16LE(0x0800, 6);           // UTF-8 names
        header.writeUInt16LE(method, 8);
        header.writeUInt16LE(time, 10);
        header.writeUInt16LE(date, 12);
        header.writeUInt32LE(crc, 14);
        header.writeUInt32LE(body.length, 18);
        header.writeUInt32LE(data.length, 22);
        header.writeUInt16LE(nameBuffer.length, 26);

        let central = Buffer.alloc(46);
        central.writeUInt32LE(0x02014b50, 0);
        central.writeUInt16LE(20, 4);
        central.writeUInt16LE(20, 6);
        central.writeUInt16LE(0x0800, 8);
        central.writeUInt16LE(method, 10);
        central.writeUInt16LE(time, 12);
        central.writeUInt16LE(date, 14);
        central.writeUInt32LE(crc, 16);
        central.writeUInt32LE(body.length, 20);
        central.writeUInt32LE(data.length, 24);
        central.writeUInt16LE(nameBuffer.length, 28);
        central.writeUInt32LE(offset, 42);

        locals.push(header, nameBuffer, body);
        centrals.push(central, nameBuffer);
        offset += header.length + nameBuffer.length + body.length;
    }

    let directory = Buffer.concat(centrals);
    let end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(entries.length, 8);
    end.writeUInt16LE(entries.length, 10);
    end.writeUInt32LE(directory.length, 12);
    end.writeUInt32LE(offset, 16);

    return Buffer.concat([...locals, directory, end]);
}

function dosDateTime(when) {
    return [
        (when.getHours() << 11) | (when.getMinutes() << 5) | (when.getSeconds() >> 1),
        ((when.getFullYear() - 1980) << 9) | ((when.getMonth() + 1) << 5) | when.getDate(),
    ];
}

function crc32(buffer) {
    crc32.table ??= Array.from({ length: 256 }, (_, n) => {
        for(let k = 0; k < 8; ++k)
            n = n & 1? 0xEDB88320 ^ (n >>> 1): n >>> 1;
        return n >>> 0;
    });

    let crc = ~0;
    for(let byte of buffer)
        crc = crc32.table[(crc ^ byte) & 0xFF] ^ (crc >>> 8);

    return ~crc >>> 0;
}
