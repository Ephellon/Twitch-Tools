/*** /settings.js
 *       _____      _   _   _                   _
 *      / ____|    | | | | (_)                 (_)
 *     | (___   ___| |_| |_ _ _ __   __ _ ___   _ ___
 *      \___ \ / _ \ __| __| | '_ \ / _` / __| | / __|
 *      ____) |  __/ |_| |_| | | | | (_| \__ \_| \__ \
 *     |_____/ \___|\__|\__|_|_| |_|\__, |___(_) |___/
 *                                   __/ |    _/ |
 *                                  |___/    |__/
 */

let $ = (selector, multiple = false, container = document) => multiple? [...container.querySelectorAll(selector)]: container.querySelector(selector);
let nullish = value => (value === undefined || value === null),
    defined = value => !nullish(value);

function getURL(path = '') {
    let url = parseURL(top.location);

    return url.origin + path.replace(/^(?!\/)/, '/');
}

let browser, Storage, Runtime, Manifest, Container, BrowserNamespace;

const PRIVATE_OBJECT_CONFIGURATION = Object.freeze({
    writable: false,
    enumerable: false,
    configurable: false,
});

if(browser && browser.runtime)
    BrowserNamespace = 'browser';
else if(chrome && chrome.extension)
    BrowserNamespace = 'chrome';

Container = window[BrowserNamespace];

switch(BrowserNamespace) {
    case 'browser': {
        Runtime = Container.runtime;
        Storage = Container.storage;
        Manifest = Runtime.getManifest();

        Storage = Storage.sync || Storage.local;
    } break;

    case 'chrome':
    default:{
        Runtime = Container.extension;
        Storage = Container.storage;
        Manifest = Container.runtime.getManifest();

        Storage = Storage.sync || Storage.local;
    } break;
}

let // These are option names. Anything else will be removed
    usable_settings = [
        /* Automation */
        // Away Mode
        'away_mode',
            'away_mode__hide_chat',
            'away_mode__volume_control',
            'away_mode__volume',
            'away_mode_schedule',
        // Auto-claim Bonuses
        'auto_claim_bonuses',
        // Auto-Follow
        'auto_follow_none',
        'auto_follow_raids',
        'auto_follow_time',
            'auto_follow_time_minutes',
        'auto_follow_all',
        'live_reminders',
        'keep_live_reminders',
        // Keep Watching
        'stay_live',
            'stay_live__ignore_channel_reruns',
            // Up Next Preference
            'next_channel_preference',
        // First in Line
        'first_in_line_none',
        'first_in_line',
            'first_in_line_time_minutes',
        'first_in_line_plus',
            'first_in_line_plus_time_minutes',
        'first_in_line_all',
            'first_in_line_all_time_minutes',
        'up_next__one_instance',
        // Greedy Raiding
        'greedy_raiding',
            'greedy_raiding_leave_before',
        // Parse Commands
        'parse_commands',
            'parse_commands__create_links',
        // Prevent Raiding
        'prevent_raiding',
        // Prevent Hosting
        'prevent_hosting',
        // Prime Loot
        'claim_loot',
        // Prime Subscription
        'claim_prime',
            'claim_prime__max_claims',
        // Kill Extensions
        'kill_extensions',
        // Auto Accept Mature Content
        'auto_accept_mature',
        // Auto-Focus*
        'auto_focus',
            'auto_focus_detection_threshold',
            'auto_focus_poll_interval',
            'auto_focus_poll_image_type',
        // Time Zones
            'time_zones',
        // View Mode
        'view_mode',

        /* Chat & Messaging */
        // Highlight Mentions
        'highlight_mentions',
            // Extra
            'highlight_mentions_extra',
        // Show Pop-ups
        'highlight_mentions_popup',
        // Highlight phrases
        'highlight_phrases',
            // phrase Rules
            'phrase_rules',
        // Filter Messages
        'filter_messages',
            'filter_rules',
            'filter_messages__bullets_coin',
            'filter_messages__bullets_raid',
            'filter_messages__bullets_subs',
            'filter_messages__bullets_note',
        // BetterTTV Emotes
        'bttv_emotes',
            'auto_load_bttv_emotes',
            'bttv_emotes_maximum',
            'bttv_emotes_location',
            'bttv_emotes_channel',
            'bttv_emotes_extras',
        // Convert Emotes*
        'convert_emotes',
        // Link Maker (chat)
        'link_maker__chat',
        // Native Twitch Replies
        'native_twitch_reply',
        // Notification Sounds
        'mention_audio',
        'phrase_audio',
        'whisper_audio',
        'whisper_audio_sound',
        // Prevent spam
        'prevent_spam',
            'prevent_spam_look_back',
            'prevent_spam_minimum_length',
            'prevent_spam_ignore_under',
        // Simplify Chat
        'simplify_chat',
            'simplify_chat_monotone_usernames',
            'simplify_chat_font',
            // 'simplify_chat_reverse_emotes',
        // Recover chat
        'recover_chat',
        // Soft Unban
        'soft_unban',
            'soft_unban_keep_bots',
            'soft_unban_prevent_clipping',
            'soft_unban_fade_old_messages',

        /* Currencies */
        // Convert Bits
        'convert_bits',
        // Channel Points Receipt
        'channelpoints_receipt_display',
        // Rewards Calculator
        'rewards_calculator',

        /* Customization */
        // Away Mode Button Placement
        'away_mode_placement',
        // Hide Blank Ads
        'hide_blank_ads',
        // Watch Time Text Placement
        'watch_time_placement',
        // Points Collected Text Placement
        'points_receipt_placement',
        // Point Watcher Text placement
        'point_watcher_placement',
        // Stream Preview
        'stream_preview',
            'stream_preview_scale',
            'stream_preview_sound',
            'stream_preview_position',
        // Accent Color
        'accent_color',

        /* Data-Collection Features */
        // Fine Details
        'fine_details',

        // DVR Settings
        'video_clips__file_type',
        'video_clips__quality',
        'video_clips__length',
        'video_clips__dvr',

        /* Error Recovery */
        // Recover Video
        'recover_video',
        // Recover Stream
        'recover_stream',
        // Recover Ads
        'recover_ads',
        // Recover Frames
        'recover_frames',
            'recover_frames__allow_embed',
        // Recover Page
        'recover_pages',
        // Keep Pop-out
        'keep_popout',

        /* Developer Options */
        // Log messages
        'display_in_console',
            'display_in_console__log',
            'display_in_console__warn',
            'display_in_console__error',
            'display_in_console__remark',
        // Display stats
        'show_stats',
        // Enable emperimental features
        'experimental_mode',
        // Extra Keyboard Shortcuts
        'extra_keyboard_shortcuts',
        // Low Data Mode
        'low_data_mode',
        // User Defined Settings
        'user_language_preference',

        /* "Hidden" options */
        'sync-token',
    ];

// https://stackoverflow.com/a/2117523/4211612
// https://gist.github.com/jed/982883
// Creates a random UUID
    // new UUID() → object
    // UUID.BWT(string:string) → string
    // UUID.cyrb53(string:string, seed:number?) → string
    // UUID.from(string:string, traceable:boolean?) → object
    // UUID.prototype.toString() → string
class UUID {
    static #BWT_SEED = new UUID()

    constructor() {
        let native = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, x => (x ^ top.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> x / 4).toString(16));

        this.native = this.value = native;

        this[Symbol.toPrimitive] = type => {
            switch(type) {
                case 'boolean':
                    return true;

                case 'bigint':
                case 'number':
                    return NaN;

                case 'default':
                case 'string':
                case 'object':
                case 'symbol':
                default:
                    return native;
            }
        };

        return this;
	}

    toString() {
        return this.native;
    }

    toStamp() {
        let value = 0;

        this.native.split('-').map(hex => value ^= parseInt(hex, 16));

        return Math.abs(value).toString(16).padStart(8, '0');
    }

    /* BWT Sorting Algorithm */
    static BWT(string = '') {
        if(/^[\x32]*$/.test(string))
            return '';

        let _a = `\u0001${ string }`,
            _b = `\u0001${ string }\u0001${ string }`,
            p_ = [];

        for(let i = 0; i < _a.length; i++)
            p_.push(_b.slice(i, _a.length + i));

        p_ = p_.sort();

        return p_.map(P => P.slice(-1)[0]).join('');
    }

    // https://stackoverflow.com/a/52171480/4211612
    static cyrb53(string, seed = 0) {
        let H1 = 0xDEADBEEF ^ seed,
            H2 = 0x41C6CE57 ^ seed;

        for(let i = 0, code; i < string.length; ++i) {
            code = string.charCodeAt(i);

            H1 = Math.imul(H1 ^ code, 2654435761);
            H2 = Math.imul(H2 ^ code, 1597334677);
        }

        H1 = Math.imul(H1 ^ (H1 >>> 16), 2246822507) ^ Math.imul(H2 ^ (H2 >>> 13), 3266489909);
        H2 = Math.imul(H2 ^ (H2 >>> 16), 2246822507) ^ Math.imul(H1 ^ (H1 >>> 13), 3266489909);

        return (4294967296 * (2097151 & H2) + (H1 >>> 0)).toString(16);
    }

    static from(key = '', traceable = false) {
        key = JSON.stringify(
            (null
                ?? key?.toJSON?.()
                ?? key
            )
            || null
        );

        let PRIVATE_KEY = (traceable? '': `private-key="${ UUID.#BWT_SEED }"`),
            CONTENT_KEY = `content="${ encodeURIComponent(key) }"`,
            PUBLIC_KEY = `public-key="${ Manifest.name }"`;

        let hash = Uint8Array.from(
                btoa(
                    [PRIVATE_KEY, CONTENT_KEY, PUBLIC_KEY]
                        .map(string => UUID.cyrb53(string, parseInt(UUID.#BWT_SEED, 16) * +!traceable))
                        .join('~')
                )
                    .split('')
                    .map(character => character.charCodeAt(0))
            ),
            l = hash.length,
            i = 0;

        hash = hash.map((n, i, a) => a[n & 255] ^ a[n | 170] ^ a[n ^ 85] ^ a[-~n] ^ n + i);

        let native = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, x => (x ^ hash[++i<l?i:i=0] & 15 >> x / 4).toString(16));

        this.native = this.value = native;

        this[Symbol.toPrimitive] = type => {
            switch(type) {
                case 'boolean':
                    return true;

                case 'bigint':
                case 'number':
                    return NaN;

                case 'default':
                case 'string':
                case 'object':
                case 'symbol':
                default:
                    return this.native;
            }
        };

        this.toString = () => this.native;
        this.toStamp = () => UUID.prototype.toStamp.apply(this);

        return this;
    }

    static async ergo(key = '') {
        key = (key ?? '').toString();

        // Privatize (pre-hash) the message a bit
        let PRIVATE_KEY = `private-key=${ UUID.#BWT_SEED }`,
            CONTENT_KEY = `content="${ encodeURIComponent(key) }"`,
            PUBLIC_KEY = `public-key=${ Manifest.version }`;

        key = btoa([PRIVATE_KEY, CONTENT_KEY, PUBLIC_KEY].map(UUID.BWT).join('<% PUB-BWT-KEY %>'));

        // Digest the message
        // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
        const UTF8String = new TextEncoder().encode(key);                     // encode as (utf-8) Uint8Array
        const hashBuffer = await crypto.subtle.digest('SHA-256', UTF8String); // hash the message
        const hashString =
            [...new Uint8Array(hashBuffer)]                                   // convert buffer to byte array
                .map(B => B.toString(16).padStart(2, '0')).join('')           // convert bytes to hex string
                .replace(/(.{16})(.{8})(.{8})(.{8})/, '$1-$2-$3-$4-');        // format the string into a large UUID string

        return hashString;
    }
}

// Creates a Twitch-style tooltip
    // new Tooltip(parent:Element, text:string?, fineTuning:object<{ left:number<integer>, top:number<integer>, direction:string<"up" | "right" | "down" | "left">, lean:string<"center" | "right" | "left"> }>?) → Element<Tooltip>
    // Tooltip.get(parent:Element) → Element<Tooltip>
class Tooltip {
    static #TOOLTIPS = new Map()

    constructor(parent, text = '', fineTuning = {}) {
        let existing = Tooltip.#TOOLTIPS.get(parent);

        fineTuning.top |= 0;
        fineTuning.left |= 0;

        fineTuning.direction ??= '';

        parent.setAttribute('fine-tuning', JSON.stringify(fineTuning));

        if(defined(existing))
            return existing;

        let uuid;
        let tooltip = furnish(`div.tt-tooltip.tt-tooltip--align-${ fineTuning.lean || 'center' }.tt-tooltip--${ fineTuning.from || 'down' }`, { role: 'tooltip', innerHTML: text });

        let values = [parent.getAttribute('tt-tooltip-id'), parent.getAttribute('id'), UUID.from(parent.getPath(true)).value];
        for(let value, index = 0; nullish(value) && index < values.length; ++index) {
            value = values[index];
            uuid = value + (['', ':tooltip'][index] || '');
        }

        tooltip.id = uuid;

        parent.addEventListener('mouseenter', event => {
            $('.tooltip-layer', true).map(layer => layer.remove());

            let { currentTarget } = event,
                offset = getOffset(currentTarget),
                screen = getOffset(document.body),
                fineTuning = JSON.parse(currentTarget.getAttribute('fine-tuning'));

            let direction = fineTuning.direction.replace(/^[^]+--(up|down|left|right)$/i, '$1').toLowerCase();

            $('body').append(
                furnish('div.twitch-tools-tooltip-layer.tooltip-layer',
                    {
                        style: (() => {
                            let style = 'animation:.3s fade-in 1;';

                            switch(direction) {
                                // case 'up':
                                //     style += `transform: translate(${ offset.left + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 2000;`;

                                case 'down':
                                    style += `transform: translate(${ offset.left + fineTuning.left }px, ${ (offset.bottom - screen.height - offset.height) + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 2000;`;

                                // case 'left':
                                //     style += `transform: translate(${ offset.left + offset.width + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 2000;`;
                                //
                                // case 'right':
                                //     style += `transform: translate(${ (offset.right - screen.width - offset.width) + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 2000;`;

                                default:
                                    style += `transform: translate(${ offset.left + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 2000;`;
                            }

                            return style;
                        })()
                    },
                    furnish('div', { 'aria-describedby': tooltip.id, 'class': 'tt-inline-flex tt-relative tt-tooltip-wrapper tt-tooltip-wrapper--show' },
                        furnish('div', { style: `width: ${ offset.width }px; height: ${ offset.height }px;` }),
                        tooltip
                    )
                )
            );

            tooltip.setAttribute('style', `display:block;`);
        });

        let hideTooltip = event => {
            $('div#root .twitch-tools-tooltip-layer.tooltip-layer')?.remove();

            tooltip?.setAttribute('style', 'display:none');
        };

        parent.addEventListener('mouseleave', hideTooltip);
        parent.addEventListener('mousedown', hideTooltip);

        Tooltip.#TOOLTIPS.set(parent, tooltip);

        return tooltip;
    }

    static get(container) {
        return Tooltip.#TOOLTIPS.get(container);
    }
}

// Creates a new Twitch-style date input
    // new DatePicker() → Promise<array[object]>
class DatePicker {
    static values = [];
    static weekdays = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ');
    static months = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

    constructor(defaultDate, defaultStatus = false, defaultTime = null, defaultDuration = 1) {
        let date = +new Date(defaultDate ?? new Date),
            h = 60 * 60 * 1000,
            d = 24 * h,
            f = furnish;

        let locale = SETTINGS?.user_language_preference ?? 'en';
        let preExisting = defined(defaultDate) && (defined(defaultTime) || defaultDuration > 1);

        let now = new Date(date.floorToNearest(h)),
            timezone = (now + '').replace(/[^]+\(([^]+?)\)[^]*/, '$1').replace(/(?<=^|\s)(.)[^\s]*/g, '$1').replace(/\s+/g, ''),
            timeOptions = new Array(24).fill(0).map((v, i, a) => +now + (i * h)).map(d => new Date(d).getHours()),
            [timeDefault] = [defaultTime, ...timeOptions].filter(defined),
            [AM, PM] = [11, 23].map(h => new Date(`1970-01-01T${ h }:00:00Z`).toLocaleTimeString(locale).toLocaleUpperCase().replace(/(?:.+?)(\D*)$/, '$1').trim()),
            startingHour = now.getHours(),
            meridiem = (startingHour < 12? AM: PM);

        let durationOptions = new Array(23).fill(0).map((v, i, a) => i + 1);

        durationOptions = [...durationOptions, ...new Array(7).fill(0).map((v, i, a) => 24 * (i + 1))];

        let dayOptions = new Array(7).fill(0).map((v, i, a) => i),
            dayDefault = now.getDay();

        let statusOptions = new Array(2).fill(0).map((v, i, a) => !!i);

        let to12H = (time, symbols = [AM, PM]) => [(time == 0? 12: time > 12? time - 12: time), symbols[+(time > 11)]].join(' ');

        let daySelect = f(`select.edit`, { type: 'days', value: dayDefault, multiple: true, selected: 1, onchange: ({ currentTarget }) => currentTarget.setAttribute('selected', currentTarget.selectedOptions.length) },
                ...dayOptions.map(value => f(`option${ (value == dayDefault? '[selected]': '') }`, { value, 'tr-id': 'day-of-week' }, DatePicker.weekdays[value]))
            ),

            statusSelect = f(`select.edit`, { type: 'status', value: defaultStatus, 'tr-id': 'en|dis' },
                ...statusOptions.map(value => f(`option${ (value == defaultStatus? '[selected]': '') }`, { value }, 'off on'.split(' ')[+value]))
            ),

            timeSelect = f(`select.edit`, { type: 'time', value: timeDefault, 'tr-id': 'away-mode:schedule:create:hour' },
                ...timeOptions.map(value =>
                    f(`option${ (value == timeDefault? '[selected]': '') }`, { value, 'tr-id': '' },
                        (
                            AM.length && PM.length?
                                // Uses meridiem indicators
                                to12H(value, (value % 12? [AM, PM]: [' \u{1f31a}', ' \u{1f31e}'])):
                            // Uses 24H format only
                            value + (value % 12? '': [' \u{1f31a}', ' \u{1f31e}'][+(value > 11)])
                        )
                    )
                )
            ),

            durationSelect = f(`select.edit`, { type: 'duration', value: defaultDuration, 'tr-id': 'away-mode:schedule:create:duration' },
                ...durationOptions.map(value => {
                    let timeString = toTimeString(value * h),
                        timeType = timeString.replace(/[^a-z]|s$/ig, '').replace(/ie$/i, 'y');

                    return f(`option${ (value == defaultDuration? '[selected]': '') }`, { value, 'tr-id': timeType }, timeString);
                })
            );

        daySelect.value = dayDefault;

        let container =
            f(`div.tt-modal-wrapper.context-root`, {},
                f(`div.tt-modal-body`, {},
                    f(`div.tt-modal-container`, {},
                        // Header
                        f('div.tt-modal-header', {},
                            f('h3', { 'tr-id': 'away-mode:schedule:create', innerHTML: Glyphs.modify('calendar', { height: 30, width: 30 }).toString() }, ' Create a new schedule')
                        ),

                        // Body
                        f('div.tt-modal-content.details.context-body', {},
                            f('div', { style: 'width:-webkit-fill-available' },
                                // Frequency
                                f('div', { 'pad-bottom': '' },
                                    f('div.title', { 'tr-id': 'away-mode:schedule:create:frequency' }, 'Frequency'),
                                    f('div.summary', {},
                                        daySelect,

                                        f('div.subtitle', {
                                            'tr-id': 'away-mode:schedule:create:controls',
                                            innerHTML: `Use <code>${ GetMacro('Ctrl') }</code> and <code>${ GetMacro('Shift') }</code> to select multiple days.`
                                        })
                                    )
                                ),

                                // Status & Functionality
                                f('div', { 'pad-bottom': '' },
                                    f('div.title', { 'tr-id': 'away-mode:schedule:create:functionality' }, 'Functionality'),
                                    f('div.summary', { 'tr-id': '' },
                                        statusSelect,
                                        'at',
                                        timeSelect,
                                        'for',
                                        durationSelect,

                                        f('div.subtitle', {
                                            'tr-id': 'away-mode:schedule:create:notice',
                                            innerHTML: `Times will be saved in your current timezone <span>(${ timezone })</span>.`
                                        })
                                    )
                                ),

                                // Submit / Cancel
                                f('div', { 'pad-bottom': '' },
                                    // Add more
                                    f('div', { style: 'width:fit-content' },
                                        f('div.checkbox.left', { onmouseup: event => $('input', false, event.currentTarget).click() },
                                            f('input#add-more', { type: 'checkbox', name: 'add-more-times' }),
                                            f('label', { for: 'add-more-times', 'tr-id': 'away-mode:schedule:create:add-more' }, 'Add another schedule')
                                        )
                                    ),

                                    // Continue
                                    f('button', {
                                        'tr-id': 'ok',

                                        onmousedown: event => {
                                            let { currentTarget } = event;

                                            let values = $('select[type]', true, currentTarget.closest('.context-body')).map(select => [select.getAttribute('type'), (select.multiple? [...select.selectedOptions].map(option => option.value): select.value)]);

                                            let object = {};
                                            for(let [key, value] of values)
                                                object[key] = value;

                                            DatePicker.values.push(object);
                                        },

                                        onmouseup: event => {
                                            let { currentTarget } = event,
                                                addNew = $('#add-more', false, currentTarget.closest(':not(button)')).checked;

                                            if(addNew)
                                                new DatePicker();
                                            else
                                                $('#date-picker-value').value = JSON.stringify(DatePicker.values.filter(defined));

                                            setTimeout(() => currentTarget.closest('.context-root')?.remove(), 100);
                                        },
                                    }, ['Continue', 'Save'][+preExisting]),

                                    // Cancel
                                    f(`button.${ ['edit', 'remove'][+preExisting] }`, {
                                        'tr-id': ['nk', 'rm'][+preExisting],

                                        onmousedown: event => DatePicker.values.push(null),

                                        onmouseup: event => {
                                            let { currentTarget } = event;

                                            $('#date-picker-value').value = JSON.stringify(DatePicker.values.filter(defined));

                                            setTimeout(() => currentTarget.closest('.context-root')?.remove(), 100);
                                        },
                                    }, ['Cancel', 'Delete'][+preExisting]),

                                    // Hidden
                                    f('input#date-picker-value', { type: 'text', style: 'display:none!important' })
                                )
                            )
                        )
                    )
                )
            );

        Translate(locale, container);

        document.body.append(container);

        return until(() => JSON.parse($('#date-picker-value')?.value || 'null')).then(values => { DatePicker.values = []; return values });
    }
}

let Glyphs = {
    // Twitch
    ...top.Glyphs,

    // Accessibility
    accessible: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 1224 792" x="0px" y="0px" enable-background="new 0 0 1224 792" xml:space="preserve"><g><path d="M833.556,367.574c-7.753-7.955-18.586-12.155-29.656-11.549l-133.981,7.458l73.733-83.975   c10.504-11.962,13.505-27.908,9.444-42.157c-2.143-9.764-8.056-18.648-17.14-24.324c-0.279-0.199-176.247-102.423-176.247-102.423   c-14.369-8.347-32.475-6.508-44.875,4.552l-85.958,76.676c-15.837,14.126-17.224,38.416-3.097,54.254   c14.128,15.836,38.419,17.227,54.255,3.096l65.168-58.131l53.874,31.285l-95.096,108.305   c-39.433,6.431-74.913,24.602-102.765,50.801l49.66,49.66c22.449-20.412,52.256-32.871,84.918-32.871   c69.667,0,126.346,56.68,126.346,126.348c0,32.662-12.459,62.467-32.869,84.916l49.657,49.66   c33.08-35.166,53.382-82.484,53.382-134.576c0-31.035-7.205-60.384-20.016-86.482l51.861-2.889l-12.616,154.75   c-1.725,21.152,14.027,39.695,35.18,41.422c1.059,0.086,2.116,0.127,3.163,0.127c19.806,0,36.621-15.219,38.257-35.306   l16.193-198.685C845.235,386.445,841.305,375.527,833.556,367.574z"/><path d="M762.384,202.965c35.523,0,64.317-28.797,64.317-64.322c0-35.523-28.794-64.323-64.317-64.323   c-35.527,0-64.323,28.8-64.323,64.323C698.061,174.168,726.856,202.965,762.384,202.965z"/><path d="M535.794,650.926c-69.668,0-126.348-56.68-126.348-126.348c0-26.256,8.056-50.66,21.817-70.887l-50.196-50.195   c-26.155,33.377-41.791,75.393-41.791,121.082c0,108.535,87.983,196.517,196.518,196.517c45.691,0,87.703-15.636,121.079-41.792   l-50.195-50.193C586.452,642.867,562.048,650.926,535.794,650.926z"/></g></svg>',

    // Creative Commons
    cc: '<svg fill="var(--grey)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path d="M10.089 19.0119C15.0659 19.0119 19.1004 14.9773 19.1004 10.0005C19.1004 5.02361 15.0659 0.989075 10.089 0.989075C5.11217 0.989075 1.07764 5.02361 1.07764 10.0005C1.07764 14.9773 5.11217 19.0119 10.089 19.0119Z" fill="white"></path><path d="M9.98172 0C12.779 0 15.1606 0.976578 17.1246 2.9288C18.0647 3.86912 18.7794 4.94383 19.2675 6.15197C19.7553 7.36043 20 8.64295 20 10.0002C20 11.3692 19.7584 12.6521 19.2769 13.848C18.7947 15.0443 18.0831 16.1012 17.1431 17.0178C16.1671 17.9818 15.0599 18.7203 13.8215 19.2322C12.5836 19.7441 11.3036 20 9.98234 20C8.66107 20 7.39605 19.7475 6.1876 19.2409C4.97945 18.7353 3.896 18.0031 2.93755 17.045C1.97909 16.0868 1.25002 15.0062 0.750012 13.8037C0.250004 12.6011 0 11.3336 0 10.0002C0 8.67857 0.252816 7.40793 0.758762 6.1876C1.26471 4.96727 2.00003 3.87506 2.96411 2.91067C4.86883 0.97064 7.20793 0 9.98172 0ZM10.018 1.80378C7.73231 1.80378 5.80947 2.6016 4.24975 4.19663C3.4638 4.99445 2.85973 5.89009 2.43723 6.88417C2.01409 7.87825 1.80315 8.91701 1.80315 10.0005C1.80315 11.072 2.01409 12.1049 2.43723 13.0983C2.86004 14.093 3.4638 14.9799 4.24975 15.7596C5.03539 16.5396 5.92197 17.1343 6.91073 17.5456C7.89856 17.9562 8.93451 18.1615 10.018 18.1615C11.0892 18.1615 12.1274 17.9537 13.1346 17.5368C14.1405 17.1196 15.0474 16.519 15.8574 15.7334C17.4168 14.2096 18.1962 12.2989 18.1962 10.0008C18.1962 8.89358 17.9937 7.84606 17.589 6.85792C17.185 5.86978 16.5953 4.98914 15.8221 4.21475C14.214 2.60754 12.2799 1.80378 10.018 1.80378ZM9.89265 8.33982L8.55295 9.03639C8.40982 8.7392 8.2345 8.53045 8.02638 8.41138C7.81793 8.29263 7.62449 8.23294 7.44574 8.23294C6.55323 8.23294 6.10635 8.82201 6.10635 10.0008C6.10635 10.5364 6.21947 10.9645 6.44541 11.2861C6.67167 11.6077 7.00511 11.7686 7.44574 11.7686C8.02919 11.7686 8.43982 11.4827 8.67826 10.9114L9.91016 11.5364C9.64828 12.0249 9.28515 12.4086 8.82076 12.6883C8.35701 12.9683 7.84481 13.108 7.28511 13.108C6.39229 13.108 5.67165 12.8346 5.12414 12.2864C4.57663 11.7389 4.30288 10.977 4.30288 10.0011C4.30288 9.04858 4.57976 8.29294 5.13321 7.73325C5.68665 7.17386 6.38604 6.89386 7.23168 6.89386C8.47013 6.89323 9.35671 7.37543 9.89265 8.33982ZM15.6606 8.33982L14.339 9.03639C14.1962 8.7392 14.0202 8.53045 13.8121 8.41138C13.6033 8.29263 13.4036 8.23294 13.214 8.23294C12.3211 8.23294 11.8742 8.82201 11.8742 10.0008C11.8742 10.5364 11.9877 10.9645 12.2136 11.2861C12.4396 11.6077 12.7727 11.7686 13.214 11.7686C13.7968 11.7686 14.2077 11.4827 14.4455 10.9114L15.6956 11.5364C15.4221 12.0249 15.0527 12.4086 14.589 12.6883C14.1246 12.9683 13.6187 13.108 13.0711 13.108C12.1661 13.108 11.4433 12.8346 10.902 12.2864C10.3595 11.7389 10.0889 10.977 10.0889 10.0011C10.0889 9.04858 10.3655 8.29294 10.9195 7.73325C11.4727 7.17386 12.1721 6.89386 13.0174 6.89386C14.2555 6.89323 15.1371 7.37543 15.6606 8.33982Z"></path></svg>',

    // GitHub
    github: '<svg fill="currentColor" width="32" height="32" version="1.1" viewBox="0 0 16 16" x="0px" y="0px"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>',

    // Google Chrome
    chrome: '<svg width="100%" height="100%" version="1.1" viewbox="0 0 190 190" x="0px" y="0px"><circle fill="#FFF" cx="85.314" cy="85.713" r="83.805"/><path fill-opacity=".1" d="M138.644 100.95c0-29.454-23.877-53.331-53.33-53.331-29.454 0-53.331 23.877-53.331 53.331H47.22c0-21.039 17.055-38.094 38.093-38.094s38.093 17.055 38.093 38.094"/><circle fill-opacity=".1" cx="89.123" cy="96.379" r="28.951"/><linearGradient id="a" gradientUnits="userSpaceOnUse" x1="-149.309" y1="-72.211" x2="-149.309" y2="-71.45" gradientTransform="matrix(82 0 0 82 12328.615 5975.868)"><stop offset="0" stop-color="#81b4e0"/><stop offset="1" stop-color="#0c5a94"/></linearGradient><circle fill="url(#a)" cx="85.314" cy="85.712" r="31.236"/><linearGradient id="b" gradientUnits="userSpaceOnUse" x1="-114.66" y1="591.553" x2="-114.66" y2="660.884" gradientTransform="translate(202.64 -591.17)"><stop offset="0" stop-color="#f06b59"/><stop offset="1" stop-color="#df2227"/></linearGradient><path fill="url(#b)" d="M161.5 47.619C140.525 5.419 89.312-11.788 47.111 9.186a85.315 85.315 0 0 0-32.65 28.529l34.284 59.426c-6.313-20.068 4.837-41.456 24.905-47.77a38.128 38.128 0 0 1 10.902-1.752"/><linearGradient id="c" gradientUnits="userSpaceOnUse" x1="-181.879" y1="737.534" x2="-146.834" y2="679.634" gradientTransform="translate(202.64 -591.17)"><stop offset="0" stop-color="#388b41"/><stop offset="1" stop-color="#4cb749"/></linearGradient><path fill="url(#c)" d="M14.461 37.716c-26.24 39.145-15.78 92.148 23.363 118.39a85.33 85.33 0 0 0 40.633 14.175l35.809-60.948c-13.39 16.229-37.397 18.529-53.625 5.141a38.096 38.096 0 0 1-11.896-17.33"/><linearGradient id="d" gradientUnits="userSpaceOnUse" x1="-64.479" y1="743.693" x2="-101.81" y2="653.794" gradientTransform="translate(202.64 -591.17)"><stop offset="0" stop-color="#e4b022"/><stop offset=".3" stop-color="#fcd209"/></linearGradient><path fill="url(#d)" d="M78.457 170.28c46.991 3.552 87.965-31.662 91.519-78.653a85.312 85.312 0 0 0-8.477-44.007H84.552c21.036.097 38.014 17.23 37.917 38.269a38.099 38.099 0 0 1-8.205 23.443"/><linearGradient id="e" gradientUnits="userSpaceOnUse" x1="-170.276" y1="686.026" x2="-170.276" y2="625.078" gradientTransform="translate(202.64 -591.17)"><stop offset="0" stop-opacity=".15"/><stop offset=".3" stop-opacity=".06"/><stop offset="1" stop-opacity=".03"/></linearGradient><path fill="url(#e)" d="M14.461 37.716l34.284 59.426a38.093 38.093 0 0 1 1.523-25.904L15.984 35.43"/><linearGradient id="f" gradientUnits="userSpaceOnUse" x1="-86.149" y1="705.707" x2="-128.05" y2="748.37" gradientTransform="translate(202.64 -591.17)"><stop offset="0" stop-opacity=".15"/><stop offset=".3" stop-opacity=".06"/><stop offset="1" stop-opacity=".03"/></linearGradient><path fill="url(#f)" d="M78.457 170.28l35.809-60.948a38.105 38.105 0 0 1-22.095 12.951L76.933 170.28"/><linearGradient id="chrome-logo-gradient" gradientUnits="userSpaceOnUse" x1="-86.757" y1="717.981" x2="-80.662" y2="657.797" gradientTransform="translate(202.64 -591.17)"><stop offset="0" stop-opacity=".15"/><stop offset=".3" stop-opacity=".06"/><stop offset="1" stop-opacity=".03"/></linearGradient><path fill="url(#chrome-logo-gradient)" d="M161.5 47.619H84.552a38.094 38.094 0 0 1 29.712 14.476l48.759-12.189"/></svg>',
};

let SETTINGS,
    TRANSLATED = false,
    INITIAL_LOAD = true;
let SUPPORTED_LANGUAGES = ["bg","cs","da","de","el","es","fi","fr","hu","it","ja","ko","nl","no","pl","ro","ru","sk","sv","th","tr","vi"];

function RedoRuleElements(rules, ruleType) {
    if(nullish(rules))
        return;

    rules = rules.split(',').sort();

    for(let rule of rules) {
        if(!rule?.length)
            continue;

        let E = document.createElement('button'),
            R = document.createElement('button');

        let ruleID = UUID.from(rule).value;

        let itemType;
        switch(true) {
            case /^\/[\w+\-]+/.test(rule): {
                itemType = 'channel';
            } break;

            case /^@[\w+\-]+$/.test(rule): {
                itemType = 'user';
            } break;

            case /^<[^>]+>$/.test(rule): {
                itemType = 'badge';
            } break;

            case /^:[\w\-]+:$/.test(rule):{
                itemType = 'emote';
            } break;

            case /^[\w]+$/.test(rule): {
                itemType = 'text';
            } break;

            default: {
                itemType = 'regexp';
            } break;
        }

        if(defined($(`#${ ruleType }_rules [${ ruleType }-type="${ itemType }"i] [${ ruleType }-id="${ ruleID }"i]`)))
            continue;

        // "Edit" button
        E.innerHTML = `<code fill>${ encodeHTML(rule) }</code>`;
        E.classList.add('edit');
        E.setAttribute(`${ ruleType }-id`, ruleID);

        E.onclick = event => {
            let { currentTarget } = event,
                { textContent } = currentTarget,
                input = $(`#${ ruleType }_rules-input`);

            input.value = [...input.value.split(','), textContent].filter(v => v?.trim()?.length).join(',');

            currentTarget.remove();
        };
        E.setAttribute('up-tooltip', `Edit rule`);
        E.setAttribute('tr-skip', true);
        E.append(R);

        // "Remove" button
        R.id = ruleID;
        R.innerHTML = Glyphs.modify('trash', { fill: 'white', height: '20px', width: '20px' });
        R.classList.add('remove');

        R.onclick = event => {
            let { currentTarget } = event,
                { id } = currentTarget;

            $(`[${ ruleType }-id="${ id }"]`)?.remove();

            event.stopPropagation();
        };
        R.setAttribute('up-tooltip', `Remove rule`);

        $(`#${ ruleType }_rules [${ ruleType }-type="${ itemType }"i]`).setAttribute('not-empty', true);
        $(`#${ ruleType }_rules [${ ruleType }-type="${ itemType }"i]`)?.append(E);
        $(`#${ ruleType }_rules-input`).value = "";
    }
}

function RedoTimeElements(schedules, scheduleType) {
    if(!schedules?.length)
        return;

    schedules = JSON.parse(schedules);

    for(let schedule of schedules) {
        let { days, time, duration, status } = schedule;

        // Add buttons per day
        if(defined(days))
            for(let day of days)
                CreateTimeElement(({ day, time, duration, status }), scheduleType);
        else
            CreateTimeElement(schedule, scheduleType);
    }
}

function CreateTimeElement(self, scheduleType) {
    let { day, time, duration, status } = self,
        scheduleID = UUID.from(self).value;

    if(defined($(`#${ scheduleType }_schedule [day="${ day }"][time="${ time }"]`)))
        return;

    let E = document.createElement('button'),
        R = document.createElement('button');

    // "Edit" button
    E.innerHTML = `<code fill>${ encodeHTML(`${ ['\u{1f534}','\u{1f7e2}'][+parseBool(status)] } ${ time }:00 + ${ toTimeString(duration * 3_600_000, '?hours_h') }`) }</code>`;
    E.classList.add('edit');
    E.setAttribute(`${ scheduleType }-id`, scheduleID);

    for(let key in self)
        E.setAttribute(key, self[key]);

    E.onclick = event => {
        let { currentTarget } = event;

        let day = parseInt(currentTarget.getAttribute('day')),
            time = parseInt(currentTarget.getAttribute('time')),
            duration = parseInt(currentTarget.getAttribute('duration')),
            status = parseBool(currentTarget.getAttribute('status'));

        let date = new Date,
            dayOffset = (date.getDate() - (date.getDay() - day));

        dayOffset = (dayOffset > 0)?
            dayOffset:
        dayOffset + 7;

        let offset = new Date([DatePicker.months[date.getMonth()], dayOffset, date.getFullYear(), time].join(' '));

        new DatePicker(offset, status, time, duration).then(schedules => RedoTimeElements(JSON.stringify(schedules), scheduleType));

        currentTarget.remove();
    };
    E.setAttribute('up-tooltip', `Edit schedule`);
    E.setAttribute('tr-skip', true);
    E.append(R);

    // "Remove" button
    R.id = scheduleID;
    R.innerHTML = Glyphs.modify('trash', { fill: 'white', height: '20px', width: '20px' });
    R.classList.add('remove');

    R.onclick = event => {
        let { currentTarget } = event,
            { id } = currentTarget;

        $(`[${ scheduleType }-id="${ id }"]`)?.remove();

        event.stopPropagation();
    };
    R.setAttribute('up-tooltip', `Remove schedule`);

    // Add to parent container
    $(`#${ scheduleType }_schedule [day-of-week="${ day }"i]`)?.setAttribute('not-empty', true);
    $(`#${ scheduleType }_schedule [day-of-week="${ day }"i]`)?.append(E);
}

async function SaveSettings() {
    let { extractValue } = SaveSettings;

    let elements = $(usable_settings.map(name => '#' + name + ':not(:invalid)').join(', '), true),
        using = elements.map(element => element.id);

    // Edit settings before exporting them (if needed)
    for(let id of using)
        switch(id) {
            case 'filter_rules': {
                let rules = [],
                    input = extractValue($('#filter_rules-input'));

                if(parseBool(input))
                    rules = input.split(',');

                for(let rule of $('#filter_rules code', true))
                    rules.push(rule.textContent);
                rules = rules.isolate().filter(rule => rule.length);

                SETTINGS.filter_rules = rules.sort().join(',');

                RedoRuleElements(SETTINGS.filter_rules, 'filter');
            } break;

            case 'phrase_rules': {
                let rules = [],
                    input = extractValue($('#phrase_rules-input'));

                if(parseBool(input))
                    rules = input.split(',');

                for(let rule of $('#phrase_rules code', true))
                    rules.push(rule.textContent);
                rules = rules.isolate().filter(rule => rule.length);

                SETTINGS.phrase_rules = rules.sort().join(',');

                RedoRuleElements(SETTINGS.phrase_rules, 'phrase');
            } break;

            case 'away_mode_schedule': {
                let times = [];
                for(let button of $('#away_mode_schedule button[duration]', true)) {
                    let day = parseInt(button.getAttribute('day')),
                        time = parseInt(button.getAttribute('time')),
                        duration = parseInt(button.getAttribute('duration')),
                        status = parseBool(button.getAttribute('status'));

                    times.push({ day, time, duration, status });
                }

                let validTimes = [];
                for(let object of times) {
                    let { day, time, duration } = object;

                    if(false
                        || (day < 0 || day > 6)
                        || (time < 0 || time > 23)
                        || (duration < 1)
                    )
                        continue;

                    validTimes.push(object);
                }

                SETTINGS.away_mode_schedule = JSON.stringify(validTimes.isolate());

                RedoTimeElements(SETTINGS.away_mode_schedule, 'away_mode');
            } break;

            case 'away_mode__volume': {
                let volume = extractValue($('#away_mode__volume'));

                SETTINGS.away_mode__volume = parseFloat(volume) / 100;
            } break;

            case 'user_language_preference': {
                let preferred = extractValue($('#user_language_preference'));

                SETTINGS.user_language_preference = preferred.toLowerCase();
            } break;

            default:{
                SETTINGS[id] = extractValue($(`#${ id }`));
            } break;
        }

    return await Storage.set(SETTINGS);
}

Object.defineProperties(SaveSettings, {
    extractValue: {
        value: element => {
            return element[{
                'date': 'value',
                'text': 'value',
                'time': 'value',
                'radio': 'checked',
                'number': 'value',
                'checkbox': 'checked',
                'select-one': 'value',
            }[element.type]];
        },

        ...PRIVATE_OBJECT_CONFIGURATION
    },
});

async function LoadSettings(OVER_RIDE_SETTINGS = null) {
    let assignValue = LoadSettings.assignValue;

    let elements = $(usable_settings.map(name => '#' + name).join(', '), true),
        using = elements.map(element => element.id);

    return await Storage.get(null, settings => {
        SETTINGS = OVER_RIDE_SETTINGS ?? settings;

        loading:
        for(let id of using) {
            let element = $(`#${ id }`);

            switch(id) {
                case 'filter_rules': {
                    let rules = SETTINGS[id];

                    RedoRuleElements(rules, 'filter');
                } break;

                case 'phrase_rules': {
                    let rules = SETTINGS[id];

                    RedoRuleElements(rules, 'phrase');
                } break;

                case 'away_mode_schedule': {
                    let times = SETTINGS[id];

                    RedoTimeElements(times, 'away_mode');
                } break;

                case 'away_mode__volume': {
                    let volume = SETTINGS[id];

                    assignValue(element, volume * 100);
                } break;

                case 'user_language_preference': {
                    let preferred = (null
                        ?? SETTINGS[id]
                        ?? (top.navigator?.userLanguage ?? top.navigator?.language ?? 'en').toLowerCase().split('-').reverse().pop()
                    );

                    assignValue(element, preferred);

                    if(TRANSLATED) continue loading;

                    Translate(document.documentElement.lang = preferred.toLowerCase());
                } break;

                case 'simplify_chat_font': {
                    $(`#${ id }`).setAttribute('style', `font-family:${ SETTINGS[id] } !important`);

                    assignValue(element, SETTINGS[id]);
                } break;

                default: {
                    let selected = $('[selected]', false, element);

                    if(defined(selected))
                        selected.removeAttribute('selected');

                    assignValue(element, SETTINGS[id]);
                } break;
            }
        }
    });
}

Object.defineProperties(LoadSettings, {
    assignValue: {
        value: (element, value) => {
            if(nullish(value))
                return;

            return element[{
                'date': 'value',
                'text': 'value',
                'time': 'value',
                'radio': 'checked',
                'number': 'value',
                'checkbox': 'checked',
                'select-one': 'value',
            }[element.type]] = value;
        },

        ...PRIVATE_OBJECT_CONFIGURATION
    },
});

function depadName(string) {
    return string.replace(/(^|_)([a-z])/g, ($0, $1, $2, $$, $_) => ['',' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, ' -');
}

/* Auto-making tooltips */

$('input[type="number"i]:is([min], [max])', true)
    .map(input => {
        let parent = input.closest(':not(input)'),
            min = input.getAttribute('min') || input.getAttribute('value') || '0',
            max = input.getAttribute('max') || '&infin;';

        return ({ parent, min, max });
    })
    .map(({ parent, min, max }) => parent.setAttribute('top-tooltip', `${ min } &mdash; ${ max }`));

/* All of the "clickables" */

$('#whisper_audio_sound', true).map(element => element.onchange = async event => setTimeout(() => $('#whisper_audio_sound-test')?.click(), 10));

$('#whisper_audio_sound-test', true).map(button => button.onclick = async event => {
    let [selected] = $('#whisper_audio_sound').selectedOptions;
    let pathname = (/\b(568)$/.test(selected.value)? '/message-tones/': '/notification-sounds/') + selected.value;

    $('#sound-href').href = parseURL($('#sound-href').href).origin + pathname;

    let test_sound = furnish('audio#tt-test-sound', {
        style: 'display:none',

        innerHTML: ['mp3', 'ogg']
            .map(type => {
                let types = { mp3: 'mpeg' },
                    src = getURL(`aud/${ selected.value }.${ type }`);
                type = `audio/${ types[type] ?? type }`;

                return furnish('source', { src, type }).outerHTML;
            }).join('')
    });

    test_sound.play();
    test_sound.onended = event => test_sound.remove();
});

$('#user_language_preference', true).map(select => {
    let languages = SUPPORTED_LANGUAGES;

    listing:
    for(let language of languages) {
        let ISO = top.ISO_639_1[language];

        if(nullish(ISO))
            continue listing;

        let { name, code, dialect } = ISO,
            [latin, native, regional] = unescape(name).split('/', 3);

        select.append(furnish('option', { value: code, innerHTML: `${ native } (${ regional }) &mdash; ${ latin }`.replace(/\s*\(\s*(?:undefined|null)?\s*\)/i, '') }));
    }

    Storage.get({ user_language_preference }, ({ user_language_preference }) => {
        let lang = user_language_preference?.toLowerCase?.();

        $('option[selected]', false, select)?.removeAttribute?.('selected');
        $(`option[value="${ (select.value = lang) }"i]`, false, select).setAttribute('selected', true);
    });
});

$('#user_language_preference', true).map(select => select.onchange = async event => {
    let { currentTarget } = event,
        preferred = currentTarget.value;

    Translate(document.documentElement.lang = preferred.toLowerCase());

    await Storage.set({ ...SETTINGS, user_language_preference: preferred });
});

$('#save, .save', true).map(element => element.onclick = async event => {
    let { currentTarget } = event;

    currentTarget.classList.add('spin');

    until(() => {
        let invalid = $(usable_settings.map(name => '#' + name + ':invalid').join(', '));

        if(nullish(invalid))
            return true;

        let { top, left } = getOffset(invalid),
            valid = invalid.checkValidity();

        invalid.scrollTo({ top, left });

        return [,true][+valid];
    })
        .then(SaveSettings)
        .catch(error => {
            currentTarget.setAttribute('style', 'background-color:var(--red)');

            WARN(error);
        })
        .finally(() => {
            setTimeout(() => {
                currentTarget.removeAttribute('style');
                currentTarget.classList.remove('spin');
            }, 1500);
        });
});

function PostSyncStatus(message = '&nbsp;', type = 'alert') {
    clearTimeout(clearSyncStatus.clearID);

    $('#sync-status').setAttribute('style', $('#sync-status').getAttribute('style').replace(/;;[^]*$/, ';; opacity: 1'));

    message = $('#sync-status').innerHTML = `<span ${type}-text>${message}</span>`;

    clearSyncStatus.clearID = setTimeout(clearSyncStatus, message.split(/\s+/).length * 1_500);
}

Object.defineProperties(PostSyncStatus, {
    alert: { value: message => PostSyncStatus(message, 'alert'), ...PRIVATE_OBJECT_CONFIGURATION },
    error: { value: message => PostSyncStatus(message, 'error'), ...PRIVATE_OBJECT_CONFIGURATION },
    success: { value: message => PostSyncStatus(message, 'success'), ...PRIVATE_OBJECT_CONFIGURATION },
    warning: { value: message => PostSyncStatus(message, 'warning'), ...PRIVATE_OBJECT_CONFIGURATION },
});

function clearSyncStatus() {
    $('#sync-status').setAttribute('style', $('#sync-status').getAttribute('style').replace(/;;[^]*$/, ';; opacity: 0'));
}

clearSyncStatus.clearID = -1;

setTimeout(clearSyncStatus, 1000);

$('#sync-settings--upload').onmouseup = async event => {
    let syncToken = $('#sync-token'),
        { currentTarget } = event;

    await SaveSettings()
        .then(async() => {
            PostSyncStatus('Uploading...');
            currentTarget.classList.add('spin');

            let CloudExport = {
                ...SETTINGS,
                syncDate: new Date().toJSON()
            };

            for(let key of 'LIVE_REMINDERS_SIZE LIVE_REMINDERS RaidEvents SyncSettings'.split(' '))
                delete CloudExport[key];

            let id = parseURL(getURL('')).host;

            if(compareVersions(`${ Manifest.version } < 99`)) {
                let url = parseURL(`https://www.tinyurl.com/api-create.php`)
                    .addSearch({
                        url: encodeURIComponent(
                            parseURL(`json://${ id }.settings.js/`)
                                .addSearch({ json: btoa(escape(JSON.stringify(CloudExport))) })
                                .href
                        )
                    });

                await fetch(`https://api.allorigins.win/raw?url=${ encodeURIComponent(url.href) }`/*, { mode: 'cors' } */)
                    .then(response => response.text())
                    .then(token => {
                        let { pathname } = parseURL(token);

                        if(!pathname.length)
                            throw `Unable to upload`;

                        return `Uploaded. Your Upload ID is ${ (syncToken.value = pathname.slice(1)).toUpperCase() }`;
                    })
                    .then(PostSyncStatus.success)
                    .then(SaveSettings)
                    .catch(PostSyncStatus.warning)
                    .finally(() => currentTarget.classList.remove('spin'));
            } else {
                let url = parseURL(`https://is.gd/create.php`)
                    .addSearch({
                        format: 'json',
                        url: encodeURIComponent(
                            parseURL(`https://${ id }.settings.js/v2`)
                                .addSearch({ json: btoa(escape(JSON.stringify(CloudExport))) })
                                .href
                        )
                    });

                await fetch(url.href)
                    .then(response => response.json())
                    .then(({ shorturl, errorcode, errormessage }) => {
                        if(parseInt(errorcode) > 0)
                            throw `Unable to upload. ${ errormessage }`;

                        return `Uploaded. Your Upload ID is ${ (syncToken.value = shorturl) }`;
                    })
                    .then(PostSyncStatus.success)
                    .then(SaveSettings)
                    .catch(PostSyncStatus.warning)
                    .finally(() => currentTarget.classList.remove('spin'));
            }
        })
        .catch(PostSyncStatus.warning);
};

$('#sync-settings--download').onmouseup = async event => {
    let syncToken = $('#sync-token').value,
        { currentTarget } = event;

    if((syncToken?.replace(/\W+/g, '')?.length | 0) < 8)
        return PostSyncStatus.warning('Please use a valid Upload ID');

    PostSyncStatus('Downloading...');
    currentTarget.classList.add('spin');

    try {
        if(compareVersions(`${ Manifest.version } < 99`))
            throw 'ID-v2 not supported';

        await fetch(`https://is.gd/forward.php?format=json&shorturl=${ syncToken }`)
            .then(response => response.json())
            .catch(PostSyncStatus.warning)
            .then(({ url, errorcode, errormessage }) => {
                if(!url?.length) {
                    if(errorcode == 1)
                        throw '';
                    if(errorcode > 1)
                        throw `Invalid Upload ID "${ syncToken }"`;
                }

                let data;
                try {
                    data = JSON.parse(unescape(atob(decodeURIComponent(parseURL(url).searchParameters.json))));
                } catch(error) {
                    throw error;
                }

                return data;
            })
            .then(async settings => {
                await LoadSettings({ ...settings, 'sync-token': syncToken })
                    .then(() => {
                        let messages = ['Downloaded. Ready to save'],
                            uploadAge = +new Date() - +new Date(settings.syncDate);

                        if(uploadAge > 30 * 24 * 60 * 60 * 1000) {
                            messages.push(`<span warning-text>This upload is ${ toTimeString(uploadAge, '?days days') } old</span>`);

                            LOG('These settings were uploaded at', new Date(settings.syncDate), settings);
                        }

                        PostSyncStatus.success(messages.join('. '));
                    })
                    .catch(PostSyncStatus.warning);
            })
            .catch(error => {
                if(error.length < 1)
                    throw 'Non-existent';
                PostSyncStatus.warning(error);
            });
    } catch(error) {
        await fetch(`https://api.allorigins.win/raw?url=${ encodeURIComponent(`https://preview.tinyurl.com/${ syncToken }`) }`/*, { mode: 'cors' } */)
            .then(response => response.text())
            .catch(PostSyncStatus.warning)
            .then(html => {
                let parser = new DOMParser;
                let doc = parser.parseFromString(html, 'text/html');

                return doc?.documentElement?.getElementByText('json://');
            })
            .then(element => {
                let url = element?.textContent,
                    data;

                if(!url?.length)
                    throw `Invalid Upload ID "${ syncToken.toUpperCase() }"`;

                try {
                    data = JSON.parse(unescape(atob(decodeURIComponent(parseURL(url).searchParameters.json))));
                } catch(error) {
                    throw error;
                }

                return data;
            })
            .then(async settings => {
                await LoadSettings({ ...settings, 'sync-token': syncToken })
                    .then(() => {
                        let messages = ['Downloaded. Ready to save'],
                            uploadAge = +new Date() - +new Date(settings.syncDate);

                        if(uploadAge > 30 * 24 * 60 * 60 * 1000) {
                            messages.push(`<span warning-text>This upload is ${ toTimeString(uploadAge, '?days days') } old</span>`);

                            LOG('These settings were uploaded at', new Date(settings.syncDate), settings);
                        }

                        PostSyncStatus.success(messages.join('. '));
                    })
                    .catch(PostSyncStatus.warning);
            })
            .catch(PostSyncStatus.warning);
    } finally {
        currentTarget.classList.remove('spin');
    }
};

$('#sync-settings--share').onmousedown = async event => {
    let syncToken = $('#sync-token').value,
        { currentTarget } = event;

    if(!syncToken?.length)
        return PostSyncStatus.warning('Nothing to share');

    await navigator.clipboard.writeText(syncToken)
        .then(() => PostSyncStatus.success('Copied to clipboard'))
        .catch(PostSyncStatus.warning);
};

/* Adding new schedules */
$('#add-time').onmouseup = event => new DatePicker().then(schedules => RedoTimeElements(JSON.stringify(schedules), 'away_mode'));

$('#simplify_chat_font').onchange = event => event.target.setAttribute('style', `font-family:${ event.target.value } !important`);

// $('#version').setAttribute('version', Manifest.version);

/* Eveyting else... */
// Glyphs
$('[glyph]', true).map(element => {
    let glyph = element.getAttribute('glyph');

    glyph = Glyphs[glyph];

    element.innerHTML = glyph;

    glyph = $('svg', false, element);

    if(glyph)
        glyph.setAttribute('style', 'height: inherit; width: inherit; vertical-align: text-bottom');
});

// Getting the version information
let FETCHED_DATA = { wasFetched: false };

(async function(installedFromWebstore) {
    let properties = {
        context: {
            id: UUID.from(Manifest.version, true)
                .toStamp()
                .split(/(.{4})/)
                .filter(s => !!s.length)
                .join('-')
                .toUpperCase(),
        },
        origin: {
            github: !installedFromWebstore,
            chrome: installedFromWebstore,
        },
        version: {
            installed: Manifest.version,
            github: 'Learn more',
            chrome: 'Learn more',
        },
        Glyphs,
    };

    await Storage.get(['buildVersion', 'chromeVersion', 'githubVersion', 'versionRetrivalDate'], async({ buildVersion, chromeVersion, githubVersion, versionRetrivalDate }) => {
        buildVersion ??= properties.version.installed;
        versionRetrivalDate ||= 0;

        // Only refresh if the data is older than 1h
        // The data has expired →
        __FetchingUpdates__:
        if((FETCHED_DATA.wasFetched === false) && (versionRetrivalDate + 3_600_000) < +new Date) {
            let githubURL = 'https://api.github.com/repos/ephellon/twitch-tools/releases/latest';

            await fetch(githubURL)
                .then(response => {
                    if(FETCHED_DATA.wasFetched)
                        throw 'Data was already fetched';

                    return response.json();
                })
                .then(metadata => {
                    LOG({ ['GitHub']: metadata });

                    return properties.version.github = metadata.tag_name;
                })
                .then(version => Storage.set({ githubVersion: version }))
                .catch(async error => {
                    await Storage.get(['githubVersion'], ({ githubVersion }) => {
                        if(defined(githubVersion))
                            properties.version.github = githubVersion;
                    });
                })
                .finally(() => {
                    let githubUpdateAvailable = compareVersions(`${ properties.version.installed } < ${ properties.version.github }`);

                    FETCHED_DATA = { ...FETCHED_DATA, ...properties };
                    Storage.set({ githubUpdateAvailable });

                    // Only applies to versions installed from the Chrome Web Store
                    __ChromeOnly__:
                    if(installedFromWebstore)
                        Storage.set({ chromeUpdateAvailable: githubUpdateAvailable });
                });

            // GitHub-only logic - get Chrome version information

            if(FETCHED_DATA.wasFetched === false) {
                FETCHED_DATA.wasFetched = true;
                versionRetrivalDate = +new Date;

                Storage.set({ versionRetrivalDate });
            }
        }
        // The data hasn't expired yet
        else {
            properties.version.github = githubVersion ?? properties.version.github;
            properties.version.chrome = chromeVersion ?? properties.version.chrome;
        }

        // Set the build number, if applicable
        DisplayBuild: {
            let [version, build] = buildVersion.split('#');

            build |= 0;

            if(build > 0) {
                properties.version.installed += (compareVersions(`${ properties.version.installed } > ${ properties.version.github }`)? ` build ${ build }`: '');
                properties.context.id = UUID.from(properties.version.installed, true)
                    .toStamp()
                    .split(/(.{4})/)
                    .filter(s => !!s.length)
                    .join('-')
                    .toUpperCase();
            }
        }

        // Modify all [set] elements
        $('[set]', true).map(async(element) => {
            properties.this = Object.fromEntries([...element.attributes].map(({ name, value }) => [name, value]));

            // Continue with the data...
            let expressions = element.getAttribute('set').split(/(?<!&#?\w+);/);

            for(let expression of expressions) {
                // Literal (x=y)
                if(/^([\w\-]+)=/.test(expression)) {
                    let [attribute, property] = expression.split('=', 2),
                        value;

                    property = property.split('.');

                    // Traverse the property path...
                    for(value = properties; property.length;) {
                        let [key] = property.splice(0, 1);

                        value = value[key];
                    }

                    element.setAttribute(attribute, value);
                }
                // Metaphorical (x:y)
                else if(/^([\w\-]+):/.test(expression)) {
                    let [attribute, property] = expression.split(':', 2),
                        value = property.replace(/(\w+\.\w+(?:[\.\w])?)/g, ($0, $1, $$, $_) => {
                            let prop = $1.split('.'),
                                val;

                            // Traverse the property path...
                            for(val = properties; prop.length;) {
                                let [key] = prop.splice(0, 1);

                                val = val[key];
                            }

                            return val;
                        });

                    element.setAttribute(attribute, value);
                }
                // Symbolic (x->y)
                else if(/^([\w\-]+)->/.test(expression)) {
                    let [attribute, property] = expression.split('->', 2),
                        value = property.replace(/\\(\w+\.\w+(?:[\.\w])?)(?:::(\w+)(?:@(\w+))?(?::(\w+))?(?:\?(\d+)))?/g, ($0, $1, $2, $3, $4, $5, $$, $_) => {
                            let prop = $1.split('.'),
                                val;

                            // Traverse the property path...
                            for(val = properties; prop.length;) {
                                let [key] = prop.splice(0, 1);

                                val = val[key];
                            }

                            // Coerce to type...
                            switch($2 = $2?.toLowerCase()) {
                                case 'short':
                                case 'ushort':
                                case 'int':
                                case 'uint':
                                case 'long':
                                case 'ulong':
                                case 'float':
                                case 'ufloat':
                                case 'double':
                                case 'udouble':
                                case 'number':
                                case 'bigint':
                                {
                                    let u = $2.startsWith('u'),
                                        r = parseInt($3 || 10),
                                        R = parseInt($4 || r),
                                        t = parseInt($5 || 1);
                                    val = parseFloat(val.replace(/[^a-z\d\.]+/ig, '').split('.').map(n => parseInt(n, r)).join('.'));

                                    // 16b
                                    if($2.endsWith('short'))
                                        val = val.clamp(-(2**(15* +!u)), 2**(15+ +!u)).ceil();

                                    // 32b
                                    if($2.endsWith('int'))
                                        if($2.startsWith('big'))
                                            val = BigInt(val.ceil());
                                        else
                                            val = val.clamp(-(2**(31* +!u)), 2**(31+ +!u)).ceil();
                                    if($2.endsWith('float'))
                                        val = val.clamp(-(2**(31* +!u)), 2**(31+ +!u));

                                    // 64b
                                    if($2.endsWith('long'))
                                        val = val.clamp(-(2**(63* +!u)), 2**(63+ +!u)).ceil();
                                    if($2.endsWith('double'))
                                        val = val.clamp(-(2**(63* +!u)), 2**(63+ +!u));

                                    val = val.toString(R).padStart(t, '0');
                                } break;
                            }

                            return val;
                        });

                    element.setAttribute(attribute, value);
                }
            }
        });
    });
})(location.host === "fcfodihfdbiiogppbnhabkigcdhkhdjd");

// All anchors with the [continue-search] attribute
$('a[continue-search]', true).map(a => {
    let parameters = [];

    for(let target of [top.location, a]) {
        let { searchParameters } = parseURL(target.href);

        for(let parameter in searchParameters)
            parameters.push(`${ parameter }=${searchParameters[parameter]}`);
    }

    if(parameters.length < 1)
        return;

    a.href = a.href.replace(/\?[^$]*$/, '?' + parameters.join('&'));
});

// All anchors without a target
$('a:not([target])', true).map(a => a.target = '_blank');

// All "new" features for this version
$('[new]', true).map(element => {
    let { version } = Manifest,
        conception = element.getAttribute('new');

    if(compareVersions(`${ version } > ${ conception }`))
        element.removeAttribute('new');
});

// Any keys that need "translating"
$('[id^="key:"i]', true).map(element => element.textContent = GetMacro(element.textContent));

// Get the supported video types here...
$('#video_clips__file_type option', true).filter(o => !furnish('video').supports(`video/${ o.value }`)).map(o => o.remove());

// Set the browser storage usage...
until(() => SETTINGS)
    .then(() => {
        Storage.getBytesInUse(async BYTES_IN_USE => {
            let ESTIMATE = await navigator?.storage?.estimate?.();
            let MAX_BYTES = (Storage.QUOTA_BYTES || ESTIMATE?.quota),
                PERC_IN_USE = (100 * ((BYTES_IN_USE || ESTIMATE?.usage) / MAX_BYTES)).toFixed(3);

            $('[id*="data-usage"i][id*="browser-storage"i][type="number"i]', true).map(input => {
                let [amount, unit] = BYTES_IN_USE.suffix('B', false).split(/(\d+)(\D+)/).filter(s => s.length);

                input.value = amount;
                input.closest('[unit]')?.setAttribute('unit', unit);
            });

            $('[id*="data-usage"i][id*="browser-storage"i][type="range"i]', true).map(input => {
                input.value = PERC_IN_USE;

                // new Tooltip(input, `${ PERC_IN_USE }%`, { direction: 'left' });
            });

            $('[id*="data-usage"i][id*="browser-storage"i][id*="itemized"i]', true).map(table => {
                let allcBytes = 0,
                    miscBytes = 0;

                for(let key in SETTINGS)
                    if(usable_settings.contains(key))
                        allcBytes += JSON.stringify({ [key]: SETTINGS[key] }).length;
                    else
                        miscBytes += JSON.stringify({ [key]: SETTINGS[key] }).length;

                let total = allcBytes + miscBytes;
                let [value, unit] = total.suffix('B', false).split(/(\d+)(\D+)/).filter(s => s.length);

                let f = furnish;
                let body = f.tbody(
                    f.tr(
                        f.td( `Settings`),
                        f.td( allcBytes.suffix('B', 2)),
                        f.td( (100 * (allcBytes / total)).suffix('%', 1))
                    ),
                    f.tr(
                        f.td( `Miscellaneous`),
                        f.td( miscBytes.suffix('B', 2)),
                        f.td( (100 * (miscBytes / total)).suffix('%', 1))
                    ),

                    f.tr(
                        f.td( `Total`),
                        f.td( total.suffix('B', 2))
                    )
                );

                table.append(body);
            });
        });
    });

async function Translate(language = 'en', container = document) {
    await fetch(`/_locales/${ language }/settings.json`)
        .catch(error => {
            WARN(`Translations to "${ language.toUpperCase() }" are not available`);

            return { json() { return null } };
        })
        .then(text => text.json?.())
        .then(json => {
            if(json?.LANG_PACK_READY !== true) {
                let ISO = ISO_639_1[language];

                if(nullish(ISO))
                    return;

                let [latin] = ISO.name.split('/');
                let link = ($0, $1 = 'GitHub', $$, $_) => `<strong><a target="_blank" href="https://github.com/Ephellon/Twitch-Tools/issues/new?assignees=Ephellon&labels=enhancement%2C+help-wanted%2C+wiki&template=lang_help.md&title=Translations%3A+${ encodeURIComponent(latin) }">${ $1 }</a></strong>`;

                alert.silent(`
                    <div style=color:yellow!important>
                        <!-- English -->
                        <div style=text-align:center;margin:1rem>This document may contain translation errors. If you would like to help correct this document, please visit ${ link() }</div>
                        <hr>
                        <!-- ${ latin } -->
                        <div style=text-align:center;margin:1rem>${
                            json['[[ERROR]]'].replace(/(\S*GitHub\S*)/i, link)
                        }</div>
                    </div>
                `, document.body.classList.contains('popup'));
            }

            let lastTrID,
                placement = {};

            let { ELEMENT_NODE, TEXT_NODE } = document,
                PREV_NODE, SEND_BACK = 0;

            for(let element of $('[tr-id]', true, container)) {
                let translation_id = (element.getAttribute('tr-id') || lastTrID),
                    translations = (null
                        ?? json['?']?.[translation_id]
                        ?? json[translation_id]
                        ?? []
                    );

                element.setAttribute('tr-id', translation_id);

                if(!translations?.length)
                    continue;

                let nodes = [...element.childNodes]
                    .filter(node => [ELEMENT_NODE, TEXT_NODE].contains(node.nodeType))
                    .filter(node => /^[^\s\.\!\?]/i.test((node.textContent ?? "").trim()))
                    .map(node => {
                        let { attributes, nodeType } = node;

                        if([TEXT_NODE].contains(nodeType))
                            return node;

                        if(nullish(attributes) || ('tr-id' in attributes) || ('tr-skip' in attributes))
                            return;

                        return node;
                    })
                    .filter(defined);

                for(let node of nodes) {
                    let translation = translations[placement[translation_id] |= 0];
                    let padding = {
                        start: node.textContent.replace(/^([\s\.!:?,]*)[^]*?$/, '$1'),
                        stop: node.textContent.replace(/^[^]*?((?:&#?[\w\-]+?;)?[\s\.!:?,]*)$/, '$1'),
                    };

                    let number;
                    let pad = (string = '') =>
                        padding.start
                        + string
                            .replace(/%d\b/g, number = node.textContent.replace(/[^]*?(\d+)[^]*/, '$1'))
                            .replace(/%([^>]*)>([^\s]*)/g, parseInt(number) > 1? '$2': '$1')
                        + padding.stop;

                    let slim = (string = '') => string
                        .replace(/\([\s]+/g, '(')
                        .replace(/[\s,:;]+\)/g, ')')
                        .replace(/\s+(-\w)/g, '$1');

                    if(/^%%$/.test(translation ?? ''))
                        continue;

                    if(SEND_BACK > 0) {
                        PREV_NODE.innerHTML = PREV_NODE.textContent.replace(node.textContent, '').replace(/%</, slim(pad(node.outerHTML)));
                        node.remove();
                        --SEND_BACK;

                        continue;
                    }

                    if(defined(translation))
                        node.textContent = pad(translation);

                    if(translation?.length < 1)
                        node.textContent = node.textContent.trim();

                    node.textContent = slim(node.textContent);

                    placement[translation_id] = (placement[translation_id] + 1 < translations.length)?
                        placement[translation_id] + 1:
                    0;

                    if(SEND_BACK += +(/%</.test(translation ?? '')))
                        PREV_NODE = node.parentElement;
                }

                lastTrID = translation_id;
            }
        });
}

// Makes a Promised setInterval - https://levelup.gitconnected.com/how-to-turn-settimeout-and-setinterval-into-promises-6a4977f0ace3
    // until(callback:function, ms:number<integer>?) → Promise
async function until(callback, ms = 100) {
    return new Promise((resolve, reject) => {
        let interval = setInterval(async() => {
            let value = callback();

            if(defined(value)) {
                clearInterval(interval);
                resolve(
                    (value === until.null)?
                        null:
                    (value === until.void)?
                        void(''):
                    (value === until.undefined)?
                        undefined:
                    value
                );
            }
        }, ms);
    });
}

try {
    Object.defineProperties(until, {
        "null": { value: Symbol(null) },
        "void": { value: Symbol(void('')) },
        "undefined": { value: Symbol(undefined) },
    });
} catch(error) {
    /* Ignore the error... */
}

document.body.onload = async() => {
    let url = parseURL(location.href),
        search = url.searchParameters;

    /* The extension was just installed (most likely the first run) */
    await(async() => {
        if(nullish(search.installed))
            return;

        let onmousedown = event => event.currentTarget.classList.add('chosen'),
            onmouseup = event => event.currentTarget.closest('.language-select')?.remove();

        let detectedLanguage = '';

        Storage.get({ user_language_preference }, ({ user_language_preference = '' }) => {
            // if(/^[A-Z]+$/.test(user_language_preference))
                detectedLanguage = user_language_preference;
        });

        return until(() => {
            let languageOptions = $('.language-select');

            if(nullish(languageOptions))
                document.body.append(
                    furnish('div.language-select', {},
                        furnish('button.language-option', { value: 'en', onmousedown, onmouseup }, `English (North American)`),
                        ...(languages => {
                            let buttons = [];
                            for(let language of languages) {
                                let ISO = top.ISO_639_1[language];

                                if(nullish(ISO))
                                    continue;

                                let { name, code, dialect } = ISO,
                                    [latin, native, regional] = unescape(name).split('/', 3);

                                buttons.push(furnish('button.language-option', { value: code, onmousedown, onmouseup }, `${ native } (${ regional || latin })`));
                            }

                            return buttons;
                        })(SUPPORTED_LANGUAGES),
                    )
                );

            $(`.language-option[value="${ detectedLanguage }"i]`)
                ?.setAttribute?.('style', 'background-color:var(--baby-blue); text-decoration:underline');

            return $('.language-option.chosen')?.value;
        });
    })()

    /* Things needed before loading the page... */
        .then(async language => {
            if(defined(language))
                await Storage.set({ user_language_preference: language.toLowerCase() });

            await Storage.get(['user_language_preference'], ({ user_language_preference }) => {
                let lang = document.documentElement.lang = user_language_preference.toLowerCase();

                if(lang == 'en')
                    TRANSLATED = true;
                else
                    Translate(lang);
            });

            TRANSLATED = true;
        })

    /* Continue loading/parsing the page */
        .then(async() => {
            /* Continue loading the page after translations have been made/skipped */

            // Add classes to the body
            for(let attribute in search)
                $('body').classList.add(attribute);

            // Stop or continue loading settings
            if((search['show-defaults'] + '') != 'true')
                await LoadSettings();

            // Overwrite settings defined in the search
            for(let key in search)
                if(usable_settings.contains(key) && defined($(`#${ key }`)))
                    LoadSettings.assignValue($(`#${ key }`), search[key]);

            // Adjust summaries
            $('.summary', true).map(element => {
                let article = element.parentElement,
                    summary = element,
                    uuid = 'uuid-' + Math.random().toString(36).replace('.','');

                if(summary.children.length <= 2)
                    return;

                let margin = ['.5rem'],
                    getHeight = element => {
                        let style = getComputedStyle(element),
                            attributes = ['height'],
                            height = 0;

                        for(let attribute of attributes)
                            height += parseInt(style[attribute]);

                        return height;
                    };

                // summary *
                let not = [];

                // Dynamically adjust the elements' heights
                summary.id = uuid;
                $('details, summary, input, img, div, h1, h2, h3, h4, h5, h6, ol, ul, p'.split(',').map(e=>`#${uuid} > ${e}${ not.map(n=>`:not(${n})`).join('') }`).join(','), true, summary)
                    .map(element => {
                        let height = getHeight(element);

                        if(height)
                            margin.push(height + 'px');
                        else
                            element.setAttribute('style', 'display:none!important');
                    });

                summary.setAttribute('style', `${ summary.getAttribute('style')?.replace(/([^;])(?!;)$/, '$1; ') ?? '' }--padding-bottom:calc(${ margin.join(' + ') })`);
            });

            // Update links (hrefs), tooltips, and other items
            setTimeout(() => {
                // Adjust all audio URLs
                $('#whisper_audio_sound', true).map(element => {
                    let [selected] = element.selectedOptions;
                    let pathname = (/\b(568)$/.test(selected.value)? '/message-tones/': '/notification-sounds/') + selected.value;

                    $('#sound-href').href = parseURL($('#sound-href').href).origin + pathname;
                });

                // All developer features
                $('#est-data-usage', true).map(input => {
                    let estimate = async({ currentTarget }) =>
                        await Storage.get('LIVE_REMINDERS', ({ LIVE_REMINDERS }) => {
                            let output = currentTarget.closest('summary, .summary').querySelector('#est-data-usage'),
                                multiplier = currentTarget.closest('[class]').querySelector(':is([when-off], [when-on])'),
                                off = multiplier.getAttribute('when-off'),
                                on = multiplier.getAttribute('when-on');

                            let [value, unit] = ((LIVE_REMINDERS?.length | 0) * (60 / parseFloat(multiplier.checked? on: off)) * 2**20).suffix('B/h', false).split(/(\D+)/).filter(s => s.length);

                            output.value = value;
                            output.parentElement.setAttribute('unit', unit);
                        });

                    ($(input.getAttribute('controller')).onchange = estimate)({ currentTarget: input });
                });

                $([...['up', 'down', 'left', 'right', 'top', 'bottom'].map(dir => `[${dir}-tooltip]`), '[tooltip]'].join(','), true).map(element => {
                    let tooltip = [...element.attributes].map(attribute => attribute.name).find(attribute => /^(?:(up|top|down|bottom|left|right)-)?tooltip$/i.test(attribute)),
                        direction = tooltip.replace(/-?tooltip$/, '');

                    direction = ({ top: 'up', bottom: 'down', })[direction] ?? direction;

                    new Tooltip(element, element.getAttribute(tooltip), { direction });
                });

                // All experimental features - auto-enable "Experimental Features" if a feature is turned on
                $('[id=":settings--experimental"i] section > .summary .toggle input', true).map(input => {
                    let prerequisites = (input.getAttribute('requires') ?? '').split(',').filter(string => string.length);

                    prerequisites.push('#experimental_mode');

                    input.setAttribute('requires', prerequisites.join(','));
                });

                // All "required" parents
                // Adds `top....` to the <head>
                // function keysDeep(object) {
                //     let keys = [];
                //     for(let key in object)
                //         if(object.hasOwnProperty(key)) {
                //             let value = object[key];
                //
                //             if(object === value)
                //                 continue;
                //
                //             if(defined(value) && isObj(value))
                //                 keys.push(...keysDeep(value));
                //             keys.push(key);
                //         }
                //
                //     return keys;
                // }
                //
                // document.head.append(
                //     furnish(`meta.top.${ keysDeep(top).isolate().join('.') }`)
                // );

                $('[requires]', true).map(dependent => {
                    let providers = $(dependent.getAttribute('requires'), true);

                    Observing:
                    for(let provider of providers) {
                        // Apply the false status to `dependent` when the `provider` is set to false
                            // when(provider.checked === false) → dependent.checked = false
                        // Also apply the changes to `provider` in the opposing manner when `dependent` is set to true
                            // when(dependent.checked === true) → provider.checked = true
                        let dependents = (provider.getAttribute('dependents') ?? '').split(',');

                        provider.setAttribute('dependents', [...dependents, `#${ dependent.id }`].filter(string => string.length).join(','));

                        provider.addEventListener('change', event => {
                            let { currentTarget } = event,
                                { checked } = currentTarget,
                                dependents = currentTarget.getAttribute('dependents');

                            if(!checked)
                                $(dependents, true).filter(dependent => dependent.checked).map(dependent => dependent.click());
                        });
                    }

                    // Add "requires" event listeners
                    dependent.addEventListener('change', event => {
                        let { currentTarget } = event,
                            { checked } = currentTarget,
                            providers = currentTarget.getAttribute('requires');

                        if(checked)
                            $(providers, true).filter(provider => !provider.checked).map(provider => provider.click());
                    });

                    let tooltipContainer = dependent.closest(':not(input)');

                    tooltipContainer.setAttribute('right-tooltip', new Tooltip(tooltipContainer, `Requires ${ providers.map(provider => depadName(provider.id)).join(', ') }`, { direction: 'right' }));
                });

                // All unit targets
                $('[unit] input', true).map(input => {
                    input.onfocus = ({ currentTarget }) => currentTarget.closest('[unit]').setAttribute('focus', true);
                    input.onblur = ({ currentTarget }) => currentTarget.closest('[unit]').setAttribute('focus', false);

                    if(input.disabled)
                        input.closest('[unit]').setAttribute('valid', true);
                    else
                        input.oninput = ({ currentTarget }) => currentTarget.closest('[unit]').setAttribute('valid', currentTarget.checkValidity());
                });
            }, 1000);
        })

    /* Things needed after loading the page... */
        .then(() => {
            INITIAL_LOAD = false;
        });
};
