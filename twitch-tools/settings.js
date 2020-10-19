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
        // Kill Extensions
        'kill_extensions',

        /* Chat & Messaging */
        // Highlight Mentions
        'highlight_mentions',
        // Show Pop-ups
        'highlight_mentions_popup',
        // Filter Messages
        'filter_messages',
            'filter_rules',
        // Convert Emotes
        'convert_emotes',
        // Native Twitch Replies
        'native_twitch_reply',

        /* Currencies */
        // Convert Bits
        'convert_bits',

        /* Customization */
        // Button Placement
        'away_mode_placement',

        /* Data-Collection Features */
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

        /* Developer Options */
        // Log messages
        'display_in_console',
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

        parent.addEventListener('mouseleave', event => {
            $('div#root .twitch-tools-tooltip-layer.tooltip-layer')?.remove();

            tooltip?.setAttribute('style', 'display:none');
        });

        Tooltip.#TOOLTIPS.set(parent, tooltip);

        return tooltip;
    }

    static get(container) {
        return Tooltip.#TOOLTIPS.get(container);
    }
}

let Glyphs = {
    bonuschannelpoints: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M16.503 3.257L18 7v11H2V7l1.497-3.743A2 2 0 015.354 2h9.292a2 2 0 011.857 1.257zM5.354 4h9.292l1.2 3H4.154l1.2-3zM4 9v7h12V9h-3v4H7V9H4zm7 0v2H9V9h2z" clip-rule="evenodd"></path></g></svg>',
    channelpoints: '<svg fill="var(--purple)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 6a4 4 0 014 4h-2a2 2 0 00-2-2V6z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>',
    checkmark: '<svg fill="var(--green)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M4 10l5 5 8-8-1.5-1.5L9 12 5.5 8.5 4 10z"></path></g></svg>',
    favorite: '<svg fill="var(--red)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9.171 4.171A4 4 0 006.343 3H6a4 4 0 00-4 4v.343a4 4 0 001.172 2.829L10 17l6.828-6.828A4 4 0 0018 7.343V7a4 4 0 00-4-4h-.343a4 4 0 00-2.829 1.172L10 5l-.829-.829z" fill-rule="evenodd" clip-rule="evenodd"></path></g></svg>',
    emotes: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M7 11a1 1 0 100-2 1 1 0 000 2zM14 10a1 1 0 11-2 0 1 1 0 012 0zM10 14a2 2 0 002-2H8a2 2 0 002 2z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>',
    latest: '<svg fill="var(--yellow)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M13.39 4.305L12 5l1.404.702a2 2 0 01.894.894L15 8l.702-1.404a2 2 0 01.894-.894L18 5l-1.418-.709a2 2 0 01-.881-.869L14.964 2l-.668 1.385a2 2 0 01-.907.92z"></path><path fill-rule="evenodd" d="M5.404 9.298a2 2 0 00.894-.894L8 5h1l1.702 3.404a2 2 0 00.894.894L15 11v1l-3.404 1.702a2 2 0 00-.894.894L9 18H8l-1.702-3.404a2 2 0 00-.894-.894L2 12v-1l3.404-1.702zm2.683 0l.413-.826.413.826a4 4 0 001.789 1.789l.826.413-.826.413a4 4 0 00-1.789 1.789l-.413.826-.413-.826a4 4 0 00-1.789-1.789l-.826-.413.826-.413a4 4 0 001.789-1.789z" clip-rule="evenodd"></path></g></svg>',
    reply: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M8.5 5.5L7 4L2 9L7 14L8.5 12.5L6 10H10C12.2091 10 14 11.7909 14 14V16H16V14C16 10.6863 13.3137 8 10 8H6L8.5 5.5Z"></path></g></svg>',
    stats: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M7 10h2v4H7v-4zM13 6h-2v8h2V6z"></path><path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm12 2H4v12h12V4z" clip-rule="evenodd"></path></g></svg>',
    trash: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M12 2H8v1H3v2h14V3h-5V2zM4 7v9a2 2 0 002 2h8a2 2 0 002-2V7h-2v9H6V7H4z"></path><path d="M11 7H9v7h2V7z"></path></g></svg>',
    bits: '<svg fill="var(--purple)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 12l7-10 7 10-7 6-7-6zm2.678-.338L10 5.487l4.322 6.173-.85.728L10 11l-3.473 1.39-.849-.729z"></path></svg>',
    help: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9 8a1 1 0 011-1h.146a.87.87 0 01.854.871c0 .313-.179.6-.447.735A2.81 2.81 0 009 11.118V12h2v-.882a.81.81 0 01.447-.724A2.825 2.825 0 0013 7.871C13 6.307 11.734 5 10.146 5H10a3 3 0 00-3 3h2zM9 14a1 1 0 112 0 1 1 0 01-2 0z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm8 6a6 6 0 110-12 6 6 0 010 12z"></path></g></svg>',
    lock: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M14.001 5.99A3.992 3.992 0 0010.01 2h-.018a3.992 3.992 0 00-3.991 3.99V8H3.999v8c0 1.105.896 2 2 2h8c1.104 0 2-.895 2-2V8h-1.998V5.99zm-2 2.01V5.995A1.996 1.996 0 0010.006 4h-.01a1.996 1.996 0 00-1.995 1.995V8h4z" clip-rule="evenodd"></path></g></svg>',
    play: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M5 17.066V2.934a.5.5 0 01.777-.416L17 10 5.777 17.482A.5.5 0 015 17.066z"></path></g></svg>',
    eye: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M11.998 10a2 2 0 11-4 0 2 2 0 014 0z"></path><path fill-rule="evenodd" d="M16.175 7.567L18 10l-1.825 2.433a9.992 9.992 0 01-2.855 2.575l-.232.14a6 6 0 01-6.175 0 35.993 35.993 0 00-.233-.14 9.992 9.992 0 01-2.855-2.575L2 10l1.825-2.433A9.992 9.992 0 016.68 4.992l.233-.14a6 6 0 016.175 0l.232.14a9.992 9.992 0 012.855 2.575zm-1.6 3.666a7.99 7.99 0 01-2.28 2.058l-.24.144a4 4 0 01-4.11 0 38.552 38.552 0 00-.239-.144 7.994 7.994 0 01-2.28-2.058L4.5 10l.925-1.233a7.992 7.992 0 012.28-2.058 37.9 37.9 0 00.24-.144 4 4 0 014.11 0l.239.144a7.996 7.996 0 012.28 2.058L15.5 10l-.925 1.233z" clip-rule="evenodd"></path></g></svg>',
    mod: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M5.003 3.947A10 10 0 009.519 2.32L10 2l.48.32A10 10 0 0016.029 4H17l-.494 5.641a9 9 0 01-4.044 6.751L10 18l-2.462-1.608a9 9 0 01-4.044-6.75L3 4h.972c.346 0 .69-.018 1.031-.053zm.174 1.992l.309 3.528a7 7 0 003.146 5.25l1.368.894 1.368-.893a7 7 0 003.146-5.25l.309-3.529A12 12 0 0110 4.376 12 12 0 015.177 5.94z" clip-rule="evenodd"></path></g></svg>',
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
        href:             data[i++] || e,
        origin:           (data[i++] || e) + (data[i + 4] || e),
        protocol:         data[i++] || e,
        scheme:           data[i++] || e,
        username:         data[i++] || e,
        password:         data[i++] || e,
        host:             data[i++] || e,
        domainPath:       data[i].split('.').reverse(),
        hostname:         data[i++] || e,
        port:             data[i++] || e,
        pathname:         data[i++] || e,
        search:           data[i]   || e,
        searchParameters: (function(sd) {
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
        hash:             data[i++] || e
    };
};

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
                break;

            default:
                settings[id] = extractValue($(`#${ id }`));
                break;
        }

    return await Storage.set(settings);
}

async function LoadSettings() {
    let assignValue = (element, value) => {
        if(value === undefined)
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
        for(let id of using) {
            let element = $(`#${ id }`);

            switch(id) {
                case 'filter_rules':
                    let rules = settings[id];

                    if(!defined(rules))
                        break;

                    rules = rules.split(',');

                    for(let rule of rules) {
                        if(!(rule && rule.length))
                            continue;

                        let R = document.createElement('input');

                        R.type = 'button';
                        R.value = rule;
                        R.classList.add('remove');

                        R.onclick = event => {
                            let { currentTarget } = event;

                            currentTarget.remove();
                        };
                        R.setAttribute('up-tooltip', `Remove <code>${ rule }</code>`);

                        $('#filter_rules').appendChild(R);
                    }
                    break;

                default:
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

        summary.id = uuid;
        $('input, img, div, h1, h2, h3, h4, h5, h6, ol, ul, p'.split(',').map(e=>`#${uuid} > ${e}${ not.map(n=>`:not(${n})`).join('') }`).join(','), true, summary)
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
    }, 500);
};

$('#save', true).map(element => element.onclick = async event => {
    let { currentTarget } = event;

    currentTarget.classList.add('spin');

    await SaveSettings()
        .catch(error => {
            currentTarget.setAttribute('style', 'background-color:var(--red)');
        })
        .then(() => setTimeout(() => {
            currentTarget.removeAttribute('style');
            currentTarget.classList.remove('spin');
        }, 1500));
});

// $('#version').setAttribute('version', Manifest.version);

// Eveyting else
$('[glyph]', true).map(element => {
    let glyph = element.getAttribute('glyph');

    glyph = Glyphs[glyph];

    element.innerHTML = glyph;

    glyph = $('svg', false, element);

    if(glyph)
        glyph.setAttribute('style', 'height: inherit; width: inherit; vertical-align: text-bottom');
});

// All anchors without a target
$('a:not([target])', true).map(a => a.target = '_blank');

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
