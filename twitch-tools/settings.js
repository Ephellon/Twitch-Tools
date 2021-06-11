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
let empty = value => (value === undefined || value === null),
    defined = value => !empty(value);
let encodeHTML = string => string.replace(/([<&>])/g, ($0, $1, $$, $_) => ({ '<': '&lt;', '&': '&amp;', '>': '&gt;' }[$1]));

let browser, Storage, Runtime, Manifest, Container, BrowserNamespace;

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
        // Auto-claim Bonuses
        'auto_claim_bonuses',
        // Auto-Follow
        'auto_follow_none',
        'auto_follow_raids',
        'auto_follow_time',
            'auto_follow_time_minutes',
        'auto_follow_all',
        // Keep Watching
        'stay_live',
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
        // Prevent Raiding
        'prevent_raiding',
        // Prevent Hosting
        'prevent_hosting',
        // Prime Loot
        'claim_loot',
        // Kill Extensions
        'kill_extensions',
        // Auto Accept Mature Content
        'auto_accept_mature',
        // Auto-Focus*
        'auto_focus',
            'auto_focus_detection_threshold',
            'auto_focus_poll_interval',
            'auto_focus_poll_image_type',
        // View Mode
        'view_mode',

        /* Chat & Messaging */
        // Highlight Mentions
        'highlight_mentions',
            // Extra
            'highlight_mentions_extra',
        // Show Pop-ups
        'highlight_mentions_popup',
        // Filter Messages
        'filter_messages',
            'filter_rules',
        // BetterTTV Emotes
        'bttv_emotes',
            'bttv_emotes_maximum',
            'bttv_emotes_location',
            'bttv_emotes_channel',
            'bttv_emotes_extras',
        // Convert Emotes*
        'convert_emotes',
        // Native Twitch Replies
        'native_twitch_reply',
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
        // Whisper Audio
        'whisper_audio',
            'whisper_audio_sound',

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
        // Watch Time Text Placement
        'watch_time_placement',
        // Points Collected Text Placement
        'points_receipt_placement',
        // Point Watcher Text placement
        'point_watcher_placement',

        /* Data-Collection Features */
        // Fine Details
        'fine_details',

        /* Error Recovery */
        // Recover Video
        'recover_video',
        // Recover Stream
        'recover_stream',
        // Recover Ads
        'recover_ads',
        // Recover Frames
        'recover_frames',
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
        // User Defined Settings
        'user_language_preference',
    ];

// https://stackoverflow.com/a/2117523/4211612
// https://gist.github.com/jed/982883
// Creates a random UUID
    // new UUID() -> Object
    // UUID.from(string:string) -> Object
    // UUID.BWT(string:string) -> String
    // UUID.prototype.toString() -> String
class UUID {
    static #BWT_SEED = new UUID()

    constructor() {
        let native = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, x => (x ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> x / 4).toString(16));

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

    static from(key = '', traceable = false) {
        key = (key ?? '').toString();

        let PRIVATE_KEY = (traceable? '': `private-key=${ UUID.#BWT_SEED }`),
            CONTENT_KEY = `content="${ encodeURIComponent(key) }"`,
            PUBLIC_KEY = `public-key=${ Manifest.version }`;

        let hash = Uint8Array.from(btoa([PRIVATE_KEY, CONTENT_KEY, PUBLIC_KEY].map(UUID.BWT).join('<% PUB-BWT-KEY %>')).split('').map(character => character.charCodeAt(0))),
            l = hash.length,
            i = 0;

        hash = hash.map(n => hash[n & 255] ^ hash[n | 170] ^ hash[n ^ 85] ^ hash[-~n] ^ n);

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
                    return native;
            }
        };

        this.toString = () => this.native;

        return this;
    }
}

// Creates a Twitch-style tooltip
    // new Tooltip(parent:Element[, text:string[, fineTuning:object]]) -> Element~Tooltip
        // fineTuning:object = { left:number=pixels, top:number=pixels, direction:string := "up"|"right"|"down"|"left", lean:string := "center"|"right"|"left" }
    // Tooltip.get(parent:Element) -> Element~Tooltip
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

        let tooltip = furnish(`div.tt-tooltip.tt-tooltip--align-${ fineTuning.lean || 'center' }.tt-tooltip--${ fineTuning.direction || 'down' }`, { role: 'tooltip', innerHTML: text }),
            uuid = UUID.from(text).value;

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
                            switch(direction) {
                                // case 'up':
                                //     return `transform: translate(${ offset.left + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 2000;`;

                                case 'down':
                                    return `transform: translate(${ offset.left + fineTuning.left }px, ${ (offset.bottom - screen.height - offset.height) + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 2000;`;

                                // case 'left':
                                //     return `transform: translate(${ offset.left + offset.width + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 2000;`;
                                //
                                // case 'right':
                                //     return `transform: translate(${ (offset.right - screen.width - offset.width) + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 2000;`;

                                default:
                                    return `transform: translate(${ offset.left + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 2000;`;
                            }
                        })()
                    },
                    furnish('div', { 'aria-describedby': tooltip.id, 'class': 'tt-inline-flex tt-relative tt-tooltip-wrapper tt-tooltip-wrapper--show' },
                        furnish('div', { style: `width: ${ offset.width }px; height: ${ offset.height }px;` }),
                        tooltip
                    )
                )
            );

            tooltip.setAttribute('style', 'display:block');
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

// Create elements
    // furnish(tagname:string[, attributes:object[, ...children]]) -> Element
function furnish(TAGNAME, ATTRIBUTES = {}, ...CHILDREN) {
    let u = v => v && v.length,
        R = RegExp,
        name = TAGNAME,
        attributes = ATTRIBUTES,
        children = CHILDREN;

    if( !u(name) )
        throw TypeError(`TAGNAME cannot be ${ (name === '')? 'empty': name }`);

    let options = attributes.is === true? { is: true }: null;

    delete attributes.is;

    name = name.split(/([#\.][^#\.\[\]]+)/).filter( u );

    if(name.length <= 1)
        name = name[0].split(/^([^\[\]]+)(\[.+\])/).filter( u );

    if(name.length > 1)
        for(let n = name, i = 1, l = n.length, t, v; i < l; i++)
            if((v = n[i].slice(1, n[i].length)) && (t = n[i][0]) == '#')
                attributes.id = v;
            else if(t == '.')
                attributes.classList = [].slice.call(attributes.classList ?? []).concat(v);
            else if(/\[(.+)\]/.test(n[i]))
                R.$1.split('][').forEach(N => attributes[(N = N.replace(/\s*=\s*(?:("?)([^]*)\1)?/, '=$2').split('=', 2))[0]] = N[1] || '');
    name = name[0];

    let element = document.createElement(name, options);

    if(attributes.classList instanceof Array)
        attributes.classList = attributes.classList.join(' ');

    Object.entries(attributes).forEach(
        ([name, value]) => (/^(on|(?:(?:inner|outer)(?:HTML|Text)|textContent|class(?:List|Name)|value)$)/.test(name))?
            (/^on/.test(name))?
                element.addEventListener(name.replace(/^on/, ''), value):
            element[name] = value:
        element.setAttribute(name, value)
    );

    children
        .filter( defined )
        .forEach(
            child =>
                child instanceof Element?
                    element.append(child):
                child instanceof Node?
                    element.append(child):
                element.append(
                    document.createTextNode(child)
                )
        );

    return element;
}

// Gets the X and Y offset (in pixels)
    // getOffset(element:Element) -> Object#{ left:number, top:number }
function getOffset(element) {
    let bounds = element.getBoundingClientRect(),
        { height, width } = bounds;

    return {
        height, width,

        left:   bounds.left + (top.pageXOffset ?? document.documentElement.scrollLeft ?? 0) | 0,
        top:    bounds.top  + (top.pageYOffset ?? document.documentElement.scrollTop  ?? 0) | 0,

        right:  bounds.right  + (top.pageXOffset ?? document.documentElement.scrollLeft ?? 0) | 0,
        bottom: bounds.bottom + (top.pageYOffset ?? document.documentElement.scrollTop  ?? 0) | 0,
    };
}

// Parse a URL
    // parseURL(url:string) -> Object
function parseURL(url) {
    if(!defined(url))
        return {};

    url = url.toString();

    let data = url.match(/^((([^:\/?#]+):)?(?:\/{2})?)(?:([^:]+):([^@]+)@)?(([^:\/?#]*)?(?:\:(\d+))?)?([^?#]*)(\?[^#]*)?(#.*)?$/),
        i    = 0,
        e    = "";

    data = data || e;

    return {
        href:            (data[i++] ?? e),
        origin:          (data[i++] ?? e) + (data[i + 4] ?? e),
        protocol:        (data[i++] ?? e),
        scheme:          (data[i++] ?? e),
        username:        (data[i++] ?? e),
        password:        (data[i++] ?? e),
        host:            (data[i++] ?? e),
        domainPath:      (data[i]   ?? e).split('.').reverse(),
        hostname:        (data[i++] ?? e),
        port:            (data[i++] ?? e),
        pathname:        (data[i++] ?? e),
        search:          (data[i]   ?? e),
        searchParameters: (sd => {
            parsing:
            for(var i = 0, s = {}, e = "", d = sd.slice(1, sd.length).split('&'), n, p, c; sd != e && i < d.length; i++) {
                c = d[i].split('=');
                n = c[0] || e;

                p = c.slice(1, c.length).join('=');

                s[n] = (s[n] != undefined)?
                    s[n] instanceof Array?
                s[n].concat(p):
                    [s[n], p]:
                p;
            }

            return s;
        })(data[i++] || e),
        hash:            (data[i++] || e),

        pushToSearch(parameters, overwrite = false) {
            if(typeof url == 'string')
                url = parseURL(url);

            let { origin, pathname, hash, searchParameters } = url;

            if(overwrite)
                searchParameters = Object.entries({ ...searchParameters, ...parameters });
            else
                searchParameters = [searchParameters, parameters].map(Object.entries).flat();

            searchParameters = '?' + searchParameters.map(parameter => parameter.join('=')).join('&');

            return parseURL(origin + pathname + searchParameters + hash);
        },
    };
};

let SETTINGS,
    TRANSLATED = false,
    INITIAL_LOAD = true;

function RedoFilterRulesElement(rules) {
    if(!defined(rules))
        return;

    rules = rules.split(',').sort();

    for(let rule of rules) {
        if(!(rule && rule.length))
            continue;

        let E = document.createElement('button'),
            R = document.createElement('button');

        let fID = UUID.from(rule).value;

        let filterType;
        switch(true) {
            case /^\/[\w+\-]+/.test(rule): {
                filterType = 'channel';
            } break;

            case /^@[\w+\-]+$/.test(rule): {
                filterType = 'user';
            } break;

            case /^<[^>]+>$/.test(rule): {
                filterType = 'badge';
            } break;

            case /^:[\w\-]+:$/.test(rule):{
                filterType = 'emote';
            } break;

            case /^[\w]+$/.test(rule): {
                filterType = 'text';
            } break;

            default:{
                filterType = 'regexp';
            } break;
        }

        if(defined($(`#filter_rules [filter-type="${ filterType }"i] [filter-id="${ fID }"i]`)))
            continue;

        // "Edit" button
        E.innerHTML = `<code fill>${ encodeHTML(rule) }</code>`;
        E.classList.add('edit');
        E.setAttribute('filter-id', fID);

        E.onclick = event => {
            let { currentTarget } = event,
                { innerText } = currentTarget,
                input = $('#filter_rules-input');

            input.value = [...input.value.split(','), innerText].filter(v => v?.trim()?.length).join(',');

            currentTarget.remove();
        };
        E.setAttribute('up-tooltip', `Edit rule`);
        E.setAttribute('tr-skip', true);
        E.append(R);

        // "Remove" button
        R.id = fID;
        R.innerHTML = Glyphs.modify('trash', { fill: 'white', height: '20px', width: '20px' });
        R.classList.add('remove');

        R.onclick = event => {
            let { currentTarget } = event,
                { id } = currentTarget;

            $(`[filter-id="${ id }"]`)?.remove();

            event.stopPropagation();
        };
        R.setAttribute('up-tooltip', `Remove rule`);

        $(`#filter_rules [filter-type="${ filterType }"i]`).setAttribute('not-empty', true);
        $(`#filter_rules [filter-type="${ filterType }"i]`)?.append(E);
        $('#filter_rules-input').value = "";
    }
}

async function SaveSettings() {
    let extractValue = element => {
        return element[{
            'date': 'value',
            'text': 'value',
            'time': 'value',
            'radio': 'checked',
            'number': 'value',
            'checkbox': 'checked',
            'select-one': 'value',
        }[element.type]];
    };

    let elements = $(usable_settings.map(name => '#' + name).join(', '), true),
        using = elements.map(element => element.id),
        settings = {};

    // Edit settings before exporting them (if needed)
    for(let id of using)
        switch(id) {
            case 'filter_rules': {
                let rules = [],
                    input = extractValue($('#filter_rules-input'));

                if(input)
                    rules = [...input.split(',')];

                for(let rule of $('#filter_rules code', true))
                    rules.push(rule.innerText);
                rules = [...new Set(rules)].filter(value => value);

                settings.filter_rules = rules.sort().join(',');

                RedoFilterRulesElement(settings.filter_rules);
            } break;

            case 'away_mode__volume': {
                let volume = extractValue($('#away_mode__volume'));

                settings.away_mode__volume = parseFloat(volume) / 100;
            } break;

            case 'user_language_preference': {
                let preferred = extractValue($('#user_language_preference'));

                settings.user_language_preference = preferred;
            } break;

            default:{
                settings[id] = extractValue($(`#${ id }`));
            } break;
        }

    return await Storage.set(SETTINGS = settings);
}

async function LoadSettings() {
    let assignValue = (element, value) => {
        if(!defined(value))
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
    };

    let elements = $(usable_settings.map(name => '#' + name).join(', '), true),
        using = elements.map(element => element.id);

    return await Storage.get(null, settings => {
        SETTINGS = settings;

        loading:
        for(let id of using) {
            let element = $(`#${ id }`);

            switch(id) {
                case 'filter_rules': {
                    let rules = settings[id];

                    RedoFilterRulesElement(rules);
                } break;

                case 'away_mode__volume': {
                    let volume = settings[id];

                    assignValue(element, volume * 100);
                } break;

                case 'user_language_preference': {
                    if(TRANSLATED) continue loading;

                    let preferred = settings[id] || (top.navigator?.userLanguage ?? top.navigator?.language ?? 'en').toLocaleLowerCase().split('-').reverse().pop();

                    TranslatePageTo(preferred);

                    assignValue(element, preferred);
                } break;

                default: {
                    let selected = $('[selected]', false, element);

                    if(defined(selected))
                        selected.removeAttribute('selected');

                    assignValue(element, settings[id]);
                } break;
            }
        }
    });
}

function compareVersions(oldVersion = '', newVersion = '', returnType) {
    if(!oldVersion.length || !newVersion.length)
        throw 'Unable to compare empty versions.';

    oldVersion = oldVersion.split('.');
    newVersion = newVersion.split('.');

    let diff = 0;

    for(let index = 0, length = Math.max(oldVersion.length, newVersion.length); index < length; ++index) {
        let L = parseInt((oldVersion[index] ?? '').replace(/[^a-z0-9]+/gi), 36),
            R = parseInt((newVersion[index] ?? '').replace(/[^a-z0-9]+/gi), 36);

        if(L == R)
            continue;

        if(L < R)
            diff = -1;
        else
            diff = +1;

        break;
    }

    switch(returnType?.toLowerCase()) {
        case 'arrow':
            return ['\u2193', '\u2022', '\u2191'][diff + 1];

        case 'symbol':
            return ['<', '=', '>'][diff + 1];

        case 'string':
            return ['less than', 'equal to', 'greater than'][diff + 1];

        case 'update':
            return ['there is an update available', 'the installed version is the latest', 'the installed version is pre-built'][diff + 1];
    }

    return diff;
}

$('#whisper_audio_sound', true).map(element => element.onchange = async event => {
    let [selected] = event.currentTarget.selectedOptions;
    let pathname = (/\b(568)$/.test(selected.value)? '/message-tones/': '/notification-sounds/') + selected.value;

    $('#sound-href').href = parseURL($('#sound-href').href).origin + pathname;

    let test_sound = furnish('audio#tt-test-sound', {
        style: 'display:none',

        innerHTML: ['mp3', 'ogg']
            .map(type => {
                let types = { mp3: 'mpeg' },
                    src = Runtime.getURL(`aud/${ selected.value }.${ type }`);
                type = `audio/${ types[type] ?? type }`;

                return furnish('source', { src, type }).outerHTML;
            }).join('')
    });

    test_sound.play();
    test_sound.onended = event => test_sound.remove();
});

$('#user_language_preference', true).map(element => element.onchange = async event => {
    let { currentTarget } = event,
        preferred = currentTarget.value;

    TranslatePageTo(preferred);

    await Storage.set({ ...SETTINGS, user_language_preference: preferred });
});

$('#save, .save', true).map(element => element.onclick = async event => {
    let { currentTarget } = event;

    currentTarget.classList.add('spin');

    await SaveSettings()
        .catch(error => {
            currentTarget.setAttribute('style', 'background-color:var(--red)');
        })
        .then(() => {
            setTimeout(() => {
                currentTarget.removeAttribute('style');
                currentTarget.classList.remove('spin');
            }, 1500);
        });
});

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

$('[set]', true).map(async(element) => {
    let installedFromWebstore = (location.host === "fcfodihfdbiiogppbnhabkigcdhkhdjd");

    let properties = {
        context: {
            id: UUID.from(Manifest.version, true).value,
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
        this: Object.fromEntries([...element.attributes].map(({ name, value }) => [name, value])),
        Glyphs,
        ...FETCHED_DATA,
    };

    await Storage.get(['buildVersion', 'chromeVersion', 'githubVersion', 'versionRetrivalDate'], async({ buildVersion, chromeVersion, githubVersion, versionRetrivalDate }) => {
        buildVersion ??= properties.version.installed;
        versionRetrivalDate ||= 0;

        // Only refresh if the data is older than 1h
        // The data has expired ->
        __FetchingUpdates__:
        if((FETCHED_DATA.wasFetched === false) && (versionRetrivalDate + 3_600_000) < +new Date) {
            let githubURL = 'https://api.github.com/repos/ephellon/twitch-tools/releases/latest';

            await fetch(githubURL)
                .then(response => {
                    if(FETCHED_DATA.wasFetched)
                        throw 'Data was already fetched';

                    return response.json();
                })
                .then(metadata => properties.version.github = metadata.tag_name)
                .then(version => Storage.set({ githubVersion: version }))
                .catch(async error => {
                    await Storage.get(['githubVersion'], ({ githubVersion }) => {
                        if(defined(githubVersion))
                            properties.version.github = githubVersion;
                    });
                })
                .finally(() => {
                    let githubUpdateAvailable = compareVersions(properties.version.installed, properties.version.github) < 0;

                    FETCHED_DATA = { ...FETCHED_DATA, ...properties };
                    Storage.set({ githubUpdateAvailable });
                });

            // Unauthorized? See paragraph 4.4.2 of https://developer.chrome.com/docs/webstore/terms/#use
            __GitHubOnly__: {
                let chromeURL = `https://api.allorigins.win/raw?url=${ encodeURIComponent('https://chrome.google.com/webstore/detail/twitch-tools/fcfodihfdbiiogppbnhabkigcdhkhdjd') }`;

                await fetch(chromeURL, { mode: 'cors' })
                    .then(response => {
                        if(FETCHED_DATA.wasFetched)
                            throw 'Data was already fetched';

                        return response.text();
                    })
                    .then(html => {
                        let DOM = new DOMParser(),
                            doc = DOM.parseFromString(html, 'text/html');

                        if(!defined(doc.body))
                            throw 'Data could not be loaded';

                        let [, merchant,, extensionName, extensionID] = parseURL(decodeURIComponent(parseURL(chromeURL).searchParameters.url)).pathname.split('/');

                        let metadata = { merchant, extensionName, extensionID };

                        $('noscript hr ~ div div > span', true, doc)
                            .filter((span, index) => index % 2 == 0)
                            .map(span => {
                                let key = span.innerText.replace(':','').toLowerCase(),
                                    value = span.nextElementSibling.innerText;

                                    switch(key) {
                                        case 'languages': {
                                            value = parseFloat(value.replace(/\D+/g, ''));
                                        } break;

                                        case 'updated': {
                                            value = new Date(value).toISOString();
                                        } break;
                                    }

                                return metadata[key] = value;
                            });

                        $('[itemprop]', true, doc)
                            .map(element => {
                                let key = element.getAttribute('itemprop'),
                                    value = element.content ?? element.href ?? element.value ?? element.innerText;

                                    switch(key) {
                                        case 'applicationCategory':
                                        case 'availability':{
                                            value = parseURL(value).pathname.slice(1).replace(/(?!^)([A-Z])/g, ($0, $1, $$, $_) => '_' + $1).toUpperCase();
                                        } break;

                                        case 'interactionCount':{
                                            let obj = {};

                                            for(let pair of value.split(' ')) {
                                                let [k, v] = pair.split(':');

                                                k = k.replace(/^([A-Z])(_*[a-z])/, ($0, $1, $2, $$, $_) => $1.toLowerCase() + $2);

                                                obj[k] = /^[\d\.\,]+\+?$/.test(v)? parseFloat(v.replace(/[\,\.]/g, '')): v;
                                            }

                                            value = obj;
                                        } break;

                                        case 'price':{
                                            value = parseFloat(value);
                                        } break;
                                    }

                                return metadata[key] = value;
                            });

                        console.log({ metadata });

                        return metadata;
                    })
                    .then(metadata => properties.version.chrome = metadata.version)
                    .then(version => Storage.set({ chromeVersion: version }))
                    .catch(async error => {
                        await Storage.get(['chromeVersion'], ({ chromeVersion }) => {
                            if(defined(chromeVersion))
                                properties.version.chrome = chromeVersion;
                        });
                    })
                    .finally(() => {
                        let chromeUpdateAvailable = compareVersions(properties.version.installed, properties.version.chrome) < 0;

                        FETCHED_DATA = { ...FETCHED_DATA, ...properties };
                        Storage.set({ chromeUpdateAvailable });
                    });
            }

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
                properties.version.installed += (compareVersions(properties.version.installed, properties.version.github) > 0? ` build ${ build }`: '');
                properties.context.id = UUID.from(properties.version.installed, true).value;
            }
        }

        DisplayContextID: {
            let numbers = properties.context.id.split('-').map(n => parseInt(n, 16));

            let flop = false,
                value = 0;

            for(let number of numbers)
                value += flop? -number: number;

            properties.context.id = Math.abs(value).toString(16)
                .slice(0, 12)
                .split(/(.{4})/)
                .filter(s => !!s.length)
                .map(s => s.padStart(4, '0000'))
                .join('-')
                .toUpperCase();
        }

        // Continue with the data...
        let expressions = element.getAttribute('set').split(';');

        for(let expression of expressions) {
            let [attribute, property] = expression.split(':'),
                value;

            property = property.split('.');

            // Traverse the property path...
            for(value = properties; property.length;)
                value = value[property.splice(0,1)[0]];

            element.setAttribute(attribute, value);
        }
    });
});

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

    if(compareVersions(version, conception) > 0)
        element.removeAttribute('new');
});

async function TranslatePageTo(language = 'en') {
    await fetch(`/_locales/${ language }/settings.json`)
        .catch(error => {
            console.log(`Translations to "${ language.toUpperCase() }" are not available`);

            return { json() { return null } };
        })
        .then(text => text.json?.())
        .then(json => {
            if(json?.LANG_PACK_READY !== true)
                return console.log(`Translations to "${ language.toUpperCase() }" are not finalized`);

            let lastTrID,
                placement = {};

            let { ELEMENT_NODE, TEXT_NODE } = document;

            for(let element of $('[tr-id]', true)) {
                let translation_id = (element.getAttribute('tr-id') || lastTrID),
                    translations = (null
                        ?? json['?']?.[translation_id]
                        ?? json[translation_id]
                        ?? []
                    );

                let nodes = [...element.childNodes]
                    .filter(node => !!~[ELEMENT_NODE, TEXT_NODE].indexOf(node.nodeType))
                    .filter(node => /^[^\s\.\!\?]/i.test((node.textContent ?? "").trim()))
                    .map(node => {
                        let { attributes, nodeType } = node;

                        if(!!~[TEXT_NODE].indexOf(nodeType))
                            return node;

                        if(!defined(attributes) || ('tr-id' in attributes) || ('tr-skip' in attributes))
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

                    if(defined(translation))
                        node.textContent = padding.start + translation + padding.stop;

                    if(translation?.length < 1)
                        node.textContent = node.textContent.trim();

                    placement[translation_id] = (placement[translation_id] + 1 < translations.length)?
                        placement[translation_id] + 1:
                    0;
                }

                lastTrID = translation_id;
            }
        })
}

// Makes a Promised setInterval - https://levelup.gitconnected.com/how-to-turn-settimeout-and-setinterval-into-promises-6a4977f0ace3
    // awaitOn(callback:function[,ms:number~Integer:milliseconds]) -> Promise
let awaitOn = async(callback, ms = 100) =>
    new Promise((resolve, reject) => {
        let interval = setInterval(async() => {
            let value = callback();

            if(defined(value)) {
                clearInterval(interval);
                resolve(value);
            }
        }, ms);
    });

document.body.onload = async() => {
    let url = parseURL(location.href),
        search = url.searchParameters;

    /* The extension was just installed (most likely the first run) */
    await(async() => {
        if(!defined(search.installed))
            return;

        let onmousedown = event => event.currentTarget.classList.add('chosen'),
            onmouseup = event => event.currentTarget.closest('.language-select')?.remove();

        return awaitOn(() => {
            let languageOptions = $('.language-select');

            if(!defined(languageOptions))
                document.body.append(
                    furnish('div.language-select', {},
                        furnish('button.language-option', { value: 'en', onmousedown, onmouseup }, `English`),
                        furnish('button.language-option', { value: 'de', onmousedown, onmouseup }, `Deutsch`),
                        furnish('button.language-option', { value: 'es', onmousedown, onmouseup }, `espa\u00f1ol (Espa\u00f1a)`),
                        furnish('button.language-option', { value: 'pt', onmousedown, onmouseup }, `portugu\u00eas (Brasil)`),
                        furnish('button.language-option', { value: 'ru', onmousedown, onmouseup }, `\u0440\u0443\u0441\u0441\u043a\u0438\u0439`),
                    )
                );

            return $('.language-option.chosen')?.value;
        });
    })()

    /* Things needed before loading the page... */
        .then(async language => {
            if(defined(language))
                await Storage.set({ user_language_preference: language });

            await Storage.get(['user_language_preference'], ({ user_language_preference }) => TranslatePageTo(user_language_preference));

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

                summary.setAttribute('style', `padding-bottom:calc(${ margin.join(' + ') })`);
            });

            // Update links (hrefs), tooltips, and other items
            setTimeout(() => {
                $('#whisper_audio_sound', true).map(element => {
                    let [selected] = element.selectedOptions;
                    let pathname = (/\b(568)$/.test(selected.value)? '/message-tones/': '/notification-sounds/') + selected.value;

                    $('#sound-href').href = parseURL($('#sound-href').href).origin + pathname;
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
                $('[requires]', true).map(dependent => {
                    let providers = $(dependent.getAttribute('requires'), true);

                    Observing:
                    for(let provider of providers) {
                        // Apply the false status to `dependent` when the `provider` is set to false
                            // when(provider.checked === false) -> dependent.checked = false
                        // Also apply the changes to `provider` in the opposing manner when `dependent` is set to true
                            // when(dependent.checked === true) -> provider.checked = true
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
                });
            }, 1000);
        })

    /* Things needed after loading the page... */
        .then(() => {
            INITIAL_LOAD = false;
        });
};
