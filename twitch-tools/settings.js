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
    case 'browser':
        Runtime = Container.runtime;
        Storage = Container.storage;
        Manifest = Runtime.getManifest();

        Storage = Storage.sync || Storage.local;
        break;

    case 'chrome':
    default:
        Runtime = Container.extension;
        Storage = Container.storage;
        Manifest = Container.runtime.getManifest();

        Storage = Storage.sync || Storage.local;
        break;
}

let // These are option names. Anything else will be removed
    usable_settings = [
        /* Automation */
        // Away Mode
        'away_mode',
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
        // Kill Extensions*
        'kill_extensions',
        // Auto Accept Mature Content
        'auto_accept_mature',
        // Auto-Focus*
        'auto_focus',
        'auto_focus_detection_threshold',
        'auto_focus_poll_interval',
        'auto_focus_poll_image_type',

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
        // Convert Emotes*
        'convert_emotes',
        // Native Twitch Replies*
        'native_twitch_reply',
        // Prevent spam
        'prevent_spam',
        // Whisper Audio
        'whisper_audio',

        /* Currencies */
        // Convert Bits
        'convert_bits',
        // Rewards Calculator
        'rewards_calculator',

        /* Customization */
        // Away Mode Button Placement
        'away_mode_placement',
        // Watch Time Text Placement
        'watch_time_placement',
        // Points Collected Text Placement
        'points_receipt_placecment',
        // Point Watcher Text Placecment
        'point_watcher_placecment',

        /* Data-Collection Features */
        // Fine Details*
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
        // Display stats
        'display_of_video',
        // Enable emperimental features
        'experimental_mode',
    ];

// https://stackoverflow.com/a/2117523/4211612
// https://gist.github.com/jed/982883
// Creates a random UUID
    // new UUID() -> Object
    // UUID.from(string:string) -> Object
    // UUID.BWT(string:string) -> String
    // UUID.prototype.toString() -> String
class UUID {
    constructor() {
        let native = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, x => (x ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> x / 4).toString(16));

        this.native = native;

        this[Symbol.toPrimitive] = type => {
            switch(type) {
                case 'boolean':
                    return true;

                case 'default':
                case 'string':
                    return native;

                case 'number':
                    return NaN;

                case 'object':
                    return native;

                default:
                    break;
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

    static from(key = '') {
        let hash = Uint8Array.from(btoa(UUID.BWT(key.replace(/[^\u0000-\u00ff]+/g, '').slice(-1024))).split('').map(character => character.charCodeAt(0))),
            l = hash.length,
            i = 0;

        let native = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, x => (x ^ hash[(++i<l?i:(i=0))] & 15 >> x / 4).toString(16));

        this.native = native;

        this[Symbol.toPrimitive] = type => {
            switch(type) {
                case 'boolean':
                    return true;

                case 'default':
                case 'string':
                    return native;

                case 'number':
                    return NaN;

                case 'object':
                    return native;

                default:
                    break;
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

        let tooltip = furnish(`div.tw-tooltip.tw-tooltip--align-${ fineTuning.lean || 'center' }.tw-tooltip--${ fineTuning.direction || 'down' }`, { role: 'tooltip', innerHTML: text }),
            uuid = UUID.from(text).toString();

        tooltip.id = uuid;

        parent.addEventListener('mouseenter', event => {
            let { currentTarget } = event,
                offset = getOffset(currentTarget),
                screen = getOffset(document.body),
                fineTuning = JSON.parse(currentTarget.getAttribute('fine-tuning'));

            let direction = fineTuning.direction.replace(/^[^]+--(up|down|left|right)$/i, '$1').toLowerCase();

            $('body').appendChild(
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
                    furnish('div', { 'aria-describedby': tooltip.id, 'class': 'tw-inline-flex tw-relative tw-tooltip-wrapper tw-tooltip-wrapper--show' },
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
    bonuschannelpoints: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M16.503 3.257L18 7v11H2V7l1.497-3.743A2 2 0 015.354 2h9.292a2 2 0 011.857 1.257zM5.354 4h9.292l1.2 3H4.154l1.2-3zM4 9v7h12V9h-3v4H7V9H4zm7 0v2H9V9h2z" clip-rule="evenodd"></path></g></svg>',
    channelpoints: '<svg fill="var(--purple)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 6a4 4 0 014 4h-2a2 2 0 00-2-2V6z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>',
    extensions: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M4 16h11a1 1 0 001-1V7h-5V5.5a1.5 1.5 0 00-3 0V7H4v1.035a3.5 3.5 0 010 6.93V16zM2 5v5h1.5a1.5 1.5 0 010 3H2v5h13c1.5 0 3-1.5 3-3V5h-5a3 3 0 00-3-3H9a3 3 0 00-3 3H2z" clip-rule="evenodd"></path></g></svg>',
    checkmark: '<svg fill="var(--green)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M4 10l5 5 8-8-1.5-1.5L9 12 5.5 8.5 4 10z"></path></g></svg>',
    favorite: '<svg fill="var(--red)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9.171 4.171A4 4 0 006.343 3H6a4 4 0 00-4 4v.343a4 4 0 001.172 2.829L10 17l6.828-6.828A4 4 0 0018 7.343V7a4 4 0 00-4-4h-.343a4 4 0 00-2.829 1.172L10 5l-.829-.829z" fill-rule="evenodd" clip-rule="evenodd"></path></g></svg>',
    chevron: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M6.5 5.5L11 10l-4.5 4.5L8 16l6-6-6-6-1.5 1.5z"></path></g></svg>',
    emotes: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M7 11a1 1 0 100-2 1 1 0 000 2zM14 10a1 1 0 11-2 0 1 1 0 012 0zM10 14a2 2 0 002-2H8a2 2 0 002 2z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>',
    latest: '<svg fill="var(--yellow)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M13.39 4.305L12 5l1.404.702a2 2 0 01.894.894L15 8l.702-1.404a2 2 0 01.894-.894L18 5l-1.418-.709a2 2 0 01-.881-.869L14.964 2l-.668 1.385a2 2 0 01-.907.92z"></path><path fill-rule="evenodd" d="M5.404 9.298a2 2 0 00.894-.894L8 5h1l1.702 3.404a2 2 0 00.894.894L15 11v1l-3.404 1.702a2 2 0 00-.894.894L9 18H8l-1.702-3.404a2 2 0 00-.894-.894L2 12v-1l3.404-1.702zm2.683 0l.413-.826.413.826a4 4 0 001.789 1.789l.826.413-.826.413a4 4 0 00-1.789 1.789l-.413.826-.413-.826a4 4 0 00-1.789-1.789l-.826-.413.826-.413a4 4 0 001.789-1.789z" clip-rule="evenodd"></path></g></svg>',
    stream: '<svg fill="var(--live-red)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M11.414 8.586c.362.362.586.862.586 1.414 0 .552-.224 1.052-.586 1.414l1.414 1.415A3.987 3.987 0 0014 10a3.987 3.987 0 00-1.172-2.828l-1.414 1.414zM5.757 5.757L4.343 4.343A7.975 7.975 0 002 10c0 2.21.895 4.21 2.343 5.657l1.414-1.414A5.981 5.981 0 014 10c0-1.657.672-3.157 1.757-4.243zM7.172 12.829l1.414-1.415A1.994 1.994 0 018 10c0-.552.224-1.052.586-1.414L7.172 7.172A3.987 3.987 0 006 10c0 1.105.448 2.105 1.172 2.829zM14.243 14.243l1.414 1.414A7.975 7.975 0 0018 10c0-2.209-.895-4.209-2.343-5.657l-1.414 1.414A5.981 5.981 0 0116 10a5.981 5.981 0 01-1.757 4.243z"></path></g></svg>',
    thread: '<svg fill="var(--purple)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M5 6H7V8H5V6Z"></path><path d="M9 6H11V8H9V6Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M8 14L10 12H13C13.5523 12 14 11.5523 14 11V3C14 2.44772 13.5523 2 13 2H3C2.44772 2 2 2.44772 2 3V11C2 11.5523 2.44772 12 3 12H6L8 14ZM6.82843 10H4V4H12V10H9.17157L8 11.1716L6.82843 10Z"></path></g></svg>',
    reply: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M8.5 5.5L7 4L2 9L7 14L8.5 12.5L6 10H10C12.2091 10 14 11.7909 14 14V16H16V14C16 10.6863 13.3137 8 10 8H6L8.5 5.5Z"></path></g></svg>',
    stats: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M7 10h2v4H7v-4zM13 6h-2v8h2V6z"></path><path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm12 2H4v12h12V4z" clip-rule="evenodd"></path></g></svg>',
    trash: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M12 2H8v1H3v2h14V3h-5V2zM4 7v9a2 2 0 002 2h8a2 2 0 002-2V7h-2v9H6V7H4z"></path><path d="M11 7H9v7h2V7z"></path></g></svg>',
    bits: '<svg fill="var(--purple)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 12l7-10 7 10-7 6-7-6zm2.678-.338L10 5.487l4.322 6.173-.85.728L10 11l-3.473 1.39-.849-.729z"></path></svg>',
    chat: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M7.828 13L10 15.172 12.172 13H15V5H5v8h2.828zM10 18l-3-3H5a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2l-3 3z" clip-rule="evenodd"></path></g></svg>',
    help: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9 8a1 1 0 011-1h.146a.87.87 0 01.854.871c0 .313-.179.6-.447.735A2.81 2.81 0 009 11.118V12h2v-.882a.81.81 0 01.447-.724A2.825 2.825 0 0013 7.871C13 6.307 11.734 5 10.146 5H10a3 3 0 00-3 3h2zM9 14a1 1 0 112 0 1 1 0 01-2 0z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm8 6a6 6 0 110-12 6 6 0 010 12z"></path></g></svg>',
    lock: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M14.001 5.99A3.992 3.992 0 0010.01 2h-.018a3.992 3.992 0 00-3.991 3.99V8H3.999v8c0 1.105.896 2 2 2h8c1.104 0 2-.895 2-2V8h-1.998V5.99zm-2 2.01V5.995A1.996 1.996 0 0010.006 4h-.01a1.996 1.996 0 00-1.995 1.995V8h4z" clip-rule="evenodd"></path></g></svg>',
    play: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M5 17.066V2.934a.5.5 0 01.777-.416L17 10 5.777 17.482A.5.5 0 015 17.066z"></path></g></svg>',
    eye: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M11.998 10a2 2 0 11-4 0 2 2 0 014 0z"></path><path fill-rule="evenodd" d="M16.175 7.567L18 10l-1.825 2.433a9.992 9.992 0 01-2.855 2.575l-.232.14a6 6 0 01-6.175 0 35.993 35.993 0 00-.233-.14 9.992 9.992 0 01-2.855-2.575L2 10l1.825-2.433A9.992 9.992 0 016.68 4.992l.233-.14a6 6 0 016.175 0l.232.14a9.992 9.992 0 012.855 2.575zm-1.6 3.666a7.99 7.99 0 01-2.28 2.058l-.24.144a4 4 0 01-4.11 0 38.552 38.552 0 00-.239-.144 7.994 7.994 0 01-2.28-2.058L4.5 10l.925-1.233a7.992 7.992 0 012.28-2.058 37.9 37.9 0 00.24-.144 4 4 0 014.11 0l.239.144a7.996 7.996 0 012.28 2.058L15.5 10l-.925 1.233z" clip-rule="evenodd"></path></g></svg>',
    mod: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M5.003 3.947A10 10 0 009.519 2.32L10 2l.48.32A10 10 0 0016.029 4H17l-.494 5.641a9 9 0 01-4.044 6.751L10 18l-2.462-1.608a9 9 0 01-4.044-6.75L3 4h.972c.346 0 .69-.018 1.031-.053zm.174 1.992l.309 3.528a7 7 0 003.146 5.25l1.368.894 1.368-.893a7 7 0 003.146-5.25l.309-3.529A12 12 0 0110 4.376 12 12 0 015.177 5.94z" clip-rule="evenodd"></path></g></svg>',

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
                    element.appendChild(child):
                element.appendChild(
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
        hash:            (data[i++] || e)
    };
};

let SETTINGS;

function RedoFilterRulesElement(rules) {
    if(!defined(rules))
        return;

    rules = rules.split(',').sort();

    for(let rule of rules) {
        if(!(rule && rule.length))
            continue;

        let R = document.createElement('input');

        let fID = UUID.from(rule).toString();

        let filterType;
        switch(true) {
            case /^\/[\w+\-]+/.test(rule):
                filterType = 'channel';
                break;

            case /^@[\w+\-]+$/.test(rule):
                filterType = 'user';
                break;

            case /^<[^>]+>$/.test(rule):
                filterType = 'badge';
                break;

            case /^:[\w\-]+:$/.test(rule):
                filterType = 'emote';
                break;

            case /^[\w]+$/.test(rule):
                filterType = 'text';
                break;

            default:
                filterType = 'regexp';
                break;
        }

        if(defined($(`#filter_rules [filter-type="${ filterType }"i] [filter="${ fID }"i]`)))
            continue;

        R.type = 'button';
        R.value = rule;
        R.classList.add('remove');
        R.setAttribute('filter', fID);

        R.onclick = event => {
            let { currentTarget } = event;

            currentTarget.remove();
        };
        R.setAttribute('up-tooltip', `Remove <code>${ encodeHTML(rule) }</code>`);

        $(`#filter_rules [filter-type="${ filterType }"i]`).setAttribute('not-empty', true);
        $(`#filter_rules [filter-type="${ filterType }"i]`)?.appendChild(R);
        $('#filter_rules-input').value = "";
    }
}

async function SaveSettings() {
    let extractValue = element => {
        return element[{
            'text': 'value',
            'radio': 'checked',
            'number': 'value',
            'checkbox': 'checked',
            'select-one': 'value',
        }[element.type]];
    };

    let elements = $(usable_settings.map(name => '#' + name).join(', '), true),
        using = elements.map(element => element.id),
        settings = {};

    for(let id of using)
        switch(id) {
            case 'filter_rules':
                let rules = [],
                    input = extractValue($('#filter_rules-input'));

                if(input)
                    rules = [...input.split(',')];

                for(let rule of $('#filter_rules input[value]', true))
                    rules.push(rule.value);

                settings.filter_rules = rules.join(',').split(',').filter(value => value).join(',');

                RedoFilterRulesElement(settings.filter_rules);
                break;

            default:
                settings[id] = extractValue($(`#${ id }`));
                break;
        }

    return await Storage.set(settings);
}

async function LoadSettings() {
    let assignValue = (element, value) => {
        if(!defined(value))
            return;

        return element[{
            'text': 'value',
            'radio': 'checked',
            'number': 'value',
            'checkbox': 'checked',
            'select-one': 'value',
        }[element.type]] = value;
    };

    let elements = $(usable_settings.map(name => '#' + name).join(', '), true),
        using = elements.map(element => element.id);

    return await Storage.get(null, settings => {
        SETTINGS ??= settings;

        for(let id of using) {
            let element = $(`#${ id }`);

            switch(id) {
                case 'filter_rules':
                    let rules = settings[id];

                    RedoFilterRulesElement(rules);
                    break;

                default:
                    let selected = $('[selected]', false, element);

                    if(defined(selected))
                        selected.removeAttribute('selected');

                    assignValue(element, settings[id]);
                    break;
            }
        }
    });
}

document.body.onload = async() => {
    let url = parseURL(location.href),
        search = url.searchParameters;

    for(let attribute in search)
        $('body').classList.add(attribute);

    if((search['show-defaults'] + '') != 'true')
        await LoadSettings();

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

    setTimeout(() => {
        $([...['up', 'down', 'left', 'right', 'top', 'bottom'].map(dir => `[${dir}-tooltip]`), '[tooltip]'].join(','), true).map(element => {
            let tooltip = [...element.attributes].map(attribute => attribute.name).find(attribute => /^(?:(up|top|down|bottom|left|right)-)?tooltip$/i.test(attribute)),
                direction = tooltip.replace(/-?tooltip$/, '');

            direction = ({ top: 'up', bottom: 'down', })[direction] ?? direction;

            new Tooltip(element, element.getAttribute(tooltip), { direction });
        });

        // All "required" parents
        $('[requires]', true).map(dependent => {
            let providers = $(dependent.getAttribute('requires'), true).map(element => element.closest('div'));

            Observing:
            for(let provider of providers) {
                let observer = new MutationObserver(mutations => {
                    // TODO
                    // Apply the false status to `dependent` when the `provider` is set to false
                        // when(provider.checked === false) -> dependent.checked = false
                    // Also apply the changes to `provider` in the opposing manner when `dependent` is set to true
                        // when(dependent.checked === true) -> provider.checked = true
                });

                observer.observe(provider, { attributes: true, childList: true, subtree: true });
            }
        });
    }, 1000);
};

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
$('[set]', true).map(async(element) => {
    let [attribute, property] = element.getAttribute('set').split(':'),
        value;

    property = property.split('.');

    let properties = {
        version: {
            installed: Manifest.version,
            github: 'Learn more',
            chrome: 'Learn more',
        },
    };

	await fetch('https://api.github.com/repos/ephellon/twitch-tools/releases/latest')
		.then(response => response.json())
		.then(version => properties.version.github = version.tag_name)
        .then(version => Storage.set({ githubVersion: version }))
        .catch(async error => {
            await Storage.get(['githubVersion'], ({ githubVersion }) => {
                if(defined(githubVersion))
                    properties.version.github = githubVersion;
            });
        });

    // Traverse the property path...
    for(value = properties; property.length;)
        value = value[property.splice(0,1)[0]];

    element.setAttribute(attribute, value);
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
