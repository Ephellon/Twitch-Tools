/*** /lib/debug-recorder.js
 * Debug Recording, phase 1: a rolling log of what happened on the page (clicks, page changes, reloads, the video's
 * status) and what TTV did at the same time (jobs, logs, Up Next, settings). It saves as one `.html` file that shows
 * the log as a timeline. Messages are hidden but keep their length; input boxes other than the main chat input keep
 * nothing. The page hooks live in `plugins/developer/debug-recording.js`; everything here is plain data, so it's tested.
 */

/** What hidden text is drawn with: one block per character, so lengths and line wraps stay real */
export const MASK = '█';

/** Where messages live: their text is hidden */
export const MESSAGE_AREAS = [
    '[data-a-target="chat-line-message"i]',
    '[class*="chat-line__message"i]',
    '[data-a-target="chat-input"i]',
    '[class*="whisper"i]',
    '[data-test-selector*="notification"i]',
].join(',');

/** The main chat input: its text is hidden, but its length is kept */
export const CHAT_INPUT = '[data-a-target="chat-input"i]';

/** Every other box someone types in keeps nothing (passwords, card numbers, whispers, search, …) */
export const INPUT_BOXES = 'input, textarea, select, [contenteditable]:not([contenteditable="false"i])';

/**
 * Hides text but keeps its length and spacing.
 * @simply maskText(text:string?) → string
 *
 * @param  {string} [text = ""] The text to hide
 * @return {string}             The same text with every visible character replaced by `MASK`
 */
export function maskText(text = '') {
    return String(text ?? '').replace(/\S/gu, MASK);
}

/** Settings the user writes themselves: their values are hidden (extra emotes, the rule lists, the export id) */
export const SENSITIVE_SETTINGS = ['bttv_emotes_extras', 'filter_rules', 'phrase_rules', 'lurking_rules', 'sync-token'];

/** Keys in logged objects that hold a message, or who wrote it: their text is hidden */
const MESSAGE_KEYS = /^(?:raw|message|messages|text|body|content|html|innerText|textContent|author|user|username|login|mentions?|reply|emotes)$/i;

/**
 * Whether a setting holds something the user wrote themselves (or a secret).
 * @simply isSensitive(key:string) → boolean
 *
 * @param  {string} key The setting's key (`filter_rules`), or its name as logged (`FILTER RULES`)
 * @return {boolean}
 */
export function isSensitive(key = '') {
    const normal = String(key).trim().toLowerCase().replace(/\s+/g, '_').replace(/-input$/, '');

    return SENSITIVE_SETTINGS.includes(normal) || /token|secret|password|cookie/i.test(normal);
}

/**
 * Hides every bit of text in a value, keeping its shape: strings become `MASK`s, lists and objects are hidden inside.
 * @simply maskDeep(value:any, depth:number?) → any
 *
 * @param  {*}      value       What to hide
 * @param  {number} [depth = 4] How deep to look inside lists and objects
 * @return {*}
 */
export function maskDeep(value, depth = 4) {
    if(typeof value == 'string')
        return maskText(value);
    if(value === null || typeof value != 'object' || depth < 1)
        return value;
    if(Array.isArray(value))
        return value.map(item => maskDeep(item, depth - 1));

    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, maskDeep(item, depth - 1)]));
}

/**
 * A setting's value, safe to keep: as it is, except for settings the user writes themselves (`SENSITIVE_SETTINGS`)
 * and secrets, whose text is hidden (its length kept).
 * @simply maskSetting(key:string, value:any) → any
 *
 * @param  {string} key   The setting's key
 * @param  {*}      value The setting's value
 * @return {*}
 */
export function maskSetting(key, value) {
    if(value === void null)
        return null;

    return isSensitive(key) ? maskDeep(value) : value;
}

/**
 * Hides messages inside a logged object: the text under message-like keys (`raw`, `message`, `author`, …).
 * @simply maskMessages(value:any, depth:number?) → any
 */
function maskMessages(value, depth = 4) {
    if(value === null || typeof value != 'object' || depth < 1)
        return value;
    if(Array.isArray(value))
        return value.map(item => maskMessages(item, depth - 1));

    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, MESSAGE_KEYS.test(key) ? maskDeep(item) : maskMessages(item, depth - 1)]));
}

/**
 * Turns log arguments into one short line, with messages and what the user wrote hidden:
 * - text under message-like keys of logged objects (`raw`, `message`, `author`, …);
 * - the old and new values when a setting the user writes themselves is logged as changed;
 * - any of `terms` (the user's own rules) found in the line.
 * @simply logLine(args:array, max:number?, terms:array<string>?) → string
 *
 * @param  {Array}         args        What was passed to `$log`, `$warn`, …
 * @param  {number}        [max = 300] The longest line kept
 * @param  {Array<string>} [terms=[]]  Words to hide wherever they appear (see `sensitiveTerms`)
 * @return {string}
 */
export function logLine(args, max = 300, terms = []) {
    const list = [...args]
        , naming = list.find(arg => typeof arg == 'string') ?? ''
        , setting = /\bfeature: (.+)$/i.exec(naming)?.[1];

    let line = list.map(arg => {
        if(arg instanceof Error)
            return `${ arg.name }: ${ arg.message }`;

        if(arg && typeof arg == 'object') {
            if(typeof arg.tagName == 'string')
                return `<${ arg.tagName.toLowerCase() }>`;

            const safe = setting && isSensitive(setting) ? maskDeep(arg) : maskMessages(arg);

            try {
                return JSON.stringify(safe);
            } catch {
                return String(arg);
            }
        }

        return String(arg);
    }).join(' ');

    for(const term of terms)
        line = line.split(term).join(maskText(term));

    return line.length > max ? `${ line.slice(0, max - 1) }…` : line;
}

/**
 * The words in the user's own rules (filter, highlight and lurking rules, extra emotes), to hide in log lines.
 * Words shorter than 3 letters are left, since they'd hide too much.
 * @simply sensitiveTerms(settings:object) → array<string>
 *
 * @param  {object} [settings={}] The current settings
 * @return {Array<string>}         Longest first, so a longer word is hidden whole
 */
export function sensitiveTerms(settings = {}) {
    const terms = new Set;

    for(const key of SENSITIVE_SETTINGS)
        for(const rule of String(settings?.[key] ?? '').split(/[,;\n]/))
            for(const word of rule.replace(/^[\s@:/]+|[\s/:]+$/g, '').split(/\s+/))
                if(word.length >= 3)
                    terms.add(word);

    return [...terms].sort((a, b) => b.length - a.length);
}

/**
 * Describes an element for the log: a short path to it, and a label (its name, or its text; hidden when it's a message,
 * empty when it's an input box other than the main chat input).
 * @simply describeElement(element:Element?) → { path:string, label:string }
 *
 * @param  {Element} [element] The element (anything with `tagName`, `getAttribute`, `parentElement`, `closest`)
 * @return {{ path: string, label: string }}
 */
export function describeElement(element) {
    if(!element?.tagName)
        return { path: '', label: "" };

    let parts = []
        , node = element;

    for(let depth = 0; node?.tagName && depth < 4; ++depth, node = node.parentElement) {
        let part = node.tagName.toLowerCase()
            , id = node.id
            , target = node.getAttribute?.('data-a-target')
            , test = node.getAttribute?.('data-test-selector');

        if(id)
            part += `#${ id }`;
        if(target)
            part += `[data-a-target="${ target }"]`;
        else if(test)
            part += `[data-test-selector="${ test }"]`;
        else if(typeof node.className == 'string' && node.className.trim().length)
            part += `.${ node.className.trim().split(/\s+/)[0] }`;

        parts.unshift(part);

        if(id || target)
            break;
    }

    let label = (null
        ?? element.getAttribute?.('aria-label')
        ?? element.getAttribute?.('title')
        ?? element.textContent
        ?? ''
    ).trim().replace(/\s+/g, ' ').slice(0, 60);

    if(element.closest?.(CHAT_INPUT))
        label = maskText(label);
    else if(element.closest?.(INPUT_BOXES))
        label = '';
    else if(element.closest?.(MESSAGE_AREAS))
        label = maskText(label);

    return { path: parts.join(' > '), label };
}

/**
 * The rolling log: the newest events of the last few minutes, oldest dropped first.
 */
export class DebugLog {
    /**
     * @param {object}   [options]
     * @param {number}   [options.minutes = 5]      How far back to keep
     * @param {number}   [options.limit = 20_000]   The most events kept
     * @param {function} [options.now = Date.now]   The clock (for tests)
     * @param {object}   [options.meta = {}]        About the recording: version, browser, …
     * @param {Array}    [options.events = []]      Events kept from before (a reload)
     */
    constructor({ minutes = 5, limit = 20_000, now = Date.now, meta = {}, events = [] } = {}) {
        this.minutes = minutes;
        this.limit = limit;
        this.now = now;
        this.meta = meta;
        this.events = [...events];
    }

    /**
     * Adds an event, then drops what's too old.
     * @simply DebugLog#add(type:string, data:object?) → object
     *
     * @param  {string} type      The kind of event: `click`, `nav`, `load`, `video`, `job`, `log`, …
     * @param  {object} [data={}] What happened
     * @return {object}           The event as kept
     */
    add(type, data = {}) {
        const event = { t: this.now(), type, ...data };

        this.events.push(event);
        this.trim();

        return event;
    }

    /**
     * Drops events older than `minutes`, then the oldest ones over `limit`.
     * @simply DebugLog#trim() → undefined
     */
    trim() {
        let oldest = this.now() - this.minutes * 60_000
            , start = this.events.findIndex(event => event.t >= oldest);

        if(start < 0)
            start = this.events.length;

        start = Math.max(start, this.events.length - this.limit);

        if(start > 0)
            this.events.splice(0, start);
    }

    /**
     * What gets stored between reloads, and saved.
     * @simply DebugLog#toJSON() → { meta:object, events:array }
     */
    toJSON() {
        return { meta: this.meta, events: this.events };
    }
}

/**
 * Builds the `.html` file: the log, and a small page that shows it as a timeline with filters. It works offline, with
 * nothing loaded from elsewhere.
 * @simply buildRecording(recording:object) → string<HTML>
 *
 * @param  {object} recording        From `DebugLog#toJSON()`
 * @param  {object} recording.meta   About the recording
 * @param  {Array}  recording.events The events, oldest first
 * @return {string}
 */
export function buildRecording({ meta = {}, events = [] }) {
    // `<` can't end the script early once escaped
    const data = JSON.stringify({ meta, events }).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    const title = `TTV Tools debug recording${ meta.channel ? ` — ${ meta.channel }` : '' }`.replace(/[<>&"]/g, (c, $$, $_) => `&#${ c.charCodeAt(0) };`);

    return `<!doctype html>
<html lang=en>
<head>
<meta charset=utf-8>
<meta name=viewport content="width=device-width, initial-scale=1">
<title>${ title }</title>
<style>
:root { --bg:#fff; --fg:#1f1f23; --dim:#6b6b76; --line:#e4e4ea; --row:#f6f6f9; --accent:#9147ff;
    --live:#2e9d4d; --rerun:#c28b00; --offline:#7a7a85; --ad:#d6336c; --none:#d0d0d8; }
@media (prefers-color-scheme: dark) { :root { --bg:#0e0e10; --fg:#efeff1; --dim:#9a9aa5; --line:#2a2a2f; --row:#18181b; --none:#3a3a40; } }
* { box-sizing:border-box }
body { margin:0; background:var(--bg); color:var(--fg); font:14px/1.4 system-ui, sans-serif }
header { padding:16px; border-bottom:1px solid var(--line) }
h1 { font-size:18px; margin:0 0 4px }
.meta { color:var(--dim); font-size:12px; display:flex; flex-wrap:wrap; gap:4px 16px }
#strip { display:flex; height:14px; margin:12px 16px 0; border-radius:4px; overflow:hidden; background:var(--none) }
#strip span { height:100% }
.legend { margin:4px 16px 0; font-size:12px; color:var(--dim); display:flex; gap:12px; flex-wrap:wrap }
.legend i { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:4px; vertical-align:-1px }
#controls { position:sticky; top:0; background:var(--bg); padding:8px 16px; border-bottom:1px solid var(--line); display:flex; flex-wrap:wrap; gap:6px 12px; align-items:center; z-index:1 }
#controls label { font-size:13px; white-space:nowrap }
#search { flex:1 1 200px; min-width:0; padding:4px 8px; border:1px solid var(--line); border-radius:4px; background:var(--row); color:inherit }
table { width:100%; border-collapse:collapse; font-size:13px }
td { padding:3px 8px; border-bottom:1px solid var(--line); vertical-align:top }
tr:nth-child(even) td { background:var(--row) }
td.t { white-space:nowrap; color:var(--dim); font-variant-numeric:tabular-nums }
td.k { white-space:nowrap; font-weight:600 }
td.d { word-break:break-word; font-family:ui-monospace, monospace; font-size:12px }
tr[data-type=error] td.k, tr[data-level=error] td.k { color:var(--ad) }
tr[data-level=warn] td.k { color:var(--rerun) }
tr[data-type=load] td, tr[data-type=unload] td { font-weight:600 }
.masked { filter:blur(3px); user-select:none }
.wrap { overflow-x:auto }
</style>
</head>
<body>
<header>
<h1>${ title }</h1>
<div class=meta id=meta></div>
</header>
<div id=strip title="Video status over time"></div>
<div class=legend><span><i style="background:var(--live)"></i>live</span><span><i style="background:var(--rerun)"></i>rerun</span><span><i style="background:var(--offline)"></i>offline</span><span><i style="background:var(--ad)"></i>ad</span><span><i style="background:var(--none)"></i>no video</span></div>
<div id=controls><input id=search type=search placeholder="Filter (text)"><span id=types></span></div>
<div class=wrap><table><tbody id=rows></tbody></table></div>
<script type="application/json" id=data>${ data }</script>
<script>
(() => {
    const { meta, events } = JSON.parse(document.getElementById('data').textContent);
    const first = events[0]?.t ?? meta.started ?? 0, last = events.at(-1)?.t ?? first;
    const pad = (n, s = 2) => String(n).padStart(s, '0');
    const offset = t => { const ms = Math.max(0, t - first); return pad(Math.floor(ms / 60000)) + ':' + pad(Math.floor(ms / 1000) % 60) + '.' + pad(ms % 1000, 3); };
    const clock = t => new Date(t).toLocaleTimeString([], { hour12: false });
    const esc = s => String(s ?? '').replace(/[&<>"]/g, c => '&#' + c.charCodeAt(0) + ';');
    const masked = s => esc(s).replace(/█+/g, m => '<span class=masked>' + m + '</span>');

    const summary = e => {
        switch(e.type) {
            case 'click': return (e.trusted ? 'user' : 'script') + ' click on ' + esc(e.path) + (e.label ? ' — "' + masked(e.label) + '"' : '') + ' @' + e.x + ',' + e.y;
            case 'nav': return esc(e.from) + ' → ' + esc(e.to);
            case 'load': return 'page ' + esc(e.how) + ': ' + esc(e.path) + (e.reason ? ' (reason: ' + esc(e.reason) + ')' : '') + (e.reports?.length ? ' reports: ' + esc(e.reports.join(', ')) : '');
            case 'unload': return 'leaving ' + esc(e.path);
            case 'video': return esc(e.status) + (e.paused ? ', paused' : '') + ', ready ' + e.ready + ', at ' + e.time + 's, buffered to ' + e.buffered + 's' + (e.height ? ', ' + e.height + 'p' : '') + (e.muted ? ', muted' : ', volume ' + e.volume);
            case 'stall': return 'video stuck at ' + e.time + 's for ' + e.seconds + 's (' + esc(e.status) + ')';
            case 'job': return esc(e.name) + ' ' + esc(e.state);
            case 'log': return masked(e.text);
            case 'error': return esc(e.message) + (e.source ? ' (' + esc(e.source) + ')' : '');
            case 'upnext': return e.queue.length ? e.queue.map(esc).join(' → ') : '(empty)';
            case 'setting': return esc(e.key) + ' = ' + masked(JSON.stringify(e.value));
            case 'lag': return 'page busy for ' + e.ms + ' ms';
            case 'memory': return e.mb + ' MB in use';
            case 'visibility': return esc(e.state);
            default: return masked(JSON.stringify(e));
        }
    };

    const metaParts = [
        ['TTV Tools', meta.version], ['Browser', meta.browser], ['Channel', meta.channel],
        ['From', meta.started && new Date(meta.started).toLocaleString()], ['Saved', meta.saved && new Date(meta.saved).toLocaleString()],
        ['Events', events.length],
    ].filter(([, v]) => v != null && v !== '');
    document.getElementById('meta').innerHTML = metaParts.map(([k, v]) => '<span>' + k + ': <b>' + esc(v) + '</b></span>').join('');

    // The video's status over time
    const strip = document.getElementById('strip'), span = Math.max(1, last - first);
    let status = 'none', since = first;
    const segment = (from, to, s) => strip.insertAdjacentHTML('beforeend', '<span style="width:' + ((to - from) / span * 100) + '%;background:var(--' + s + ')" title="' + s + ' ' + offset(from) + '–' + offset(to) + '"></span>');
    for(const e of events)
        if(e.type == 'video' && e.status != status) { segment(since, e.t, status); status = e.status; since = e.t; }
        else if(e.type == 'load' || e.type == 'unload') { segment(since, e.t, status); status = 'none'; since = e.t; }
    segment(since, last, status);

    // Filters
    const counts = {};
    for(const e of events) counts[e.type] = (counts[e.type] ?? 0) + 1;
    const shown = new Set(Object.keys(counts));
    document.getElementById('types').innerHTML = Object.entries(counts).sort().map(([type, n]) => '<label><input type=checkbox checked value="' + esc(type) + '"> ' + esc(type) + ' (' + n + ')</label>').join(' ');

    const rows = document.getElementById('rows');
    rows.innerHTML = events.map((e, i) => '<tr data-i=' + i + ' data-type="' + esc(e.type) + '"' + (e.level ? ' data-level="' + esc(e.level) + '"' : '') + '><td class=t title="' + clock(e.t) + '">' + offset(e.t) + '</td><td class=k>' + esc(e.level ?? e.type) + '</td><td class=d>' + summary(e) + '</td></tr>').join('');

    const search = document.getElementById('search');
    const filter = () => {
        const term = search.value.trim().toLowerCase();
        for(const row of rows.children)
            row.hidden = !shown.has(row.dataset.type) || (term && !row.textContent.toLowerCase().includes(term));
    };
    document.getElementById('types').addEventListener('change', ({ target }) => { target.checked ? shown.add(target.value) : shown.delete(target.value); filter(); });
    search.addEventListener('input', filter);
})();
</script>
</body>
</html>
`;
}
