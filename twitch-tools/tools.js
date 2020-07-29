/*** /tools.js
 *      _______          _       _
 *     |__   __|        | |     (_)
 *        | | ___   ___ | |___   _ ___
 *        | |/ _ \ / _ \| / __| | / __|
 *        | | (_) | (_) | \__ \_| \__ \
 *        |_|\___/ \___/|_|___(_) |___/
 *                             _/ |
 *                            |__/
 */
let $ = (selector, multiple = false, container = document) => multiple? [...container.querySelectorAll(selector)]: container.querySelector(selector);
let empty = value => (value === undefined || value === null),
    defined = value => !empty(value);

let settings = {},
    display = $('[data-a-target="user-menu-toggle"i]'),
    visible = [],
    Jobs = {},
    Timers = {},
    Handlers = {},
    Unhandlers = {},
    // These won't change (often)
    USERNAME;

// Populate the username field by quickly showing the menu
if(display) {
    display.click();
    display.click();

    USERNAME = $('[data-a-target="user-display-name"i]').innerText.toLowerCase();
}

let browser, Runtime, Container, BrowserNamespace;

if(browser && browser.runtime)
    BrowserNamespace = 'browser';
else if(chrome && chrome.extension)
    BrowserNamespace = 'chrome';

Container = window[BrowserNamespace];

switch(BrowserNamespace) {
    case 'browser':
        Runtime = Container.runtime;
        Storage = Container.storage;

        Storage = Storage.sync || Storage.local;
        break;

    case 'chrome':
    default:
        Runtime = Container.extension;
        Storage = Container.storage;

        Storage = Storage.sync || Storage.local;
        break;
}

// https://stackoverflow.com/a/2117523/4211612
// https://gist.github.com/jed/982883
// Creates a random UUID
// new UUID() -> Object
// UUID.from(string:string) -> Object
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

	toArray() {
		return this.native;
	}

    toString() {
        return this.value;
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

        return this;
    }
}

// Displays a popup
// new Popup(subject:string, message:string[, actions:object]) -> Object
class Popup {
    constructor(subject, message, actions = {}) {
        let f = furnish;

        let P = $('.stream-chat-header'),
            X = $('#twitch-tools-popup', false, P),
            N = 'Continue',
            D = 'Close',
            A = event => {
                let existing = $('#twitch-tools-popup');

                existing.remove();
            },
            C = event => {
                let existing = $('#twitch-tools-popup');

                existing.remove();
            };

        if(defined(X))
            return X;

        for(let n in actions)
            if(typeof actions[n] == 'function')
                if(/\b(abandon|cancel|choke|close|drop|end|halt|kill|nix|plug|postpone|seal|scrap|scrub|stop)\b/i.test(n)) {
                    D = n;
                    C = actions[n];
                } else {
                    N = n;
                    A = actions[n];
                }

        let p =
        f('div#twitch-tools-popup.tw-absolute.tw-mg-t-5', { style: 'z-index:9; bottom:10rem; right:1rem' },
            f('div.tw-animation.tw-animation--animate.tw-animation--bounce-in.tw-animation--duration-medium.tw-animation--fill-mode-both.tw-animation--timing-ease', { 'data-a-target': 'tw-animation-target' },
                f('div', {},
                    f('div.tw-border-b.tw-border-l.tw-border-r.tw-border-radius-small.tw-border-t.tw-c-background-base.tw-elevation-2.tw-flex.tw-flex-nowrap.tw-mg-b-1', {
                        style: 'background-color:var(--color-twitch-purple-5)!important'
                    },
                        f('div', {},
                            f('div.tw-block.tw-full-width.tw-interactable.tw-interactable--alpha.tw-interactable--hover-enabled.tw-interactive', {},
                                f('div.tw-flex.tw-flex-nowrap.tw-pd-l-1.tw-pd-y-1', {},
                                    f('div', {},
                                        f('div', { style: 'height:4rem; width:4rem' },
                                            f('img.tw-border-radius-rounded.tw-full-height.tw-full-width.tw-image', {
                                                src: Runtime.getURL('profile.png'),
                                                sizeinpixels: 40,
                                                borderradius: 'tw-border-radius-rounded',
                                            })
                                        )
                                    ),
                                    f('div.tw-flex.tw-flex-column.tw-flex-nowrap.tw-overflow-hidden.tw-pd-x-1', {},
                                        f('div.tw-full-height.tw-overflow-hidden', {},
                                            f('span', {},
                                                f('div', {},
                                                    f('p', {}, subject)
                                                )
                                            )
                                        ),
                                        f('div.tw-flex-shrink-0.tw-mg-t-05', {},
                                            f('div.tw-c-text-alt-2', {}, message)
                                        )
                                    )
                                )
                            )
                        ),
                        f('div.tw-align-content-stretch.tw-border-l.tw-flex.tw-flex-column.tw-flex-grow-0.tw-flex-shrink-0', {},
                            f('div.tw-align-content-stretch.tw-border-b.tw-flex.tw-flex-grow-1', {},
                                f('button.tw-block.tw-full-width.tw-interactable.tw-interactable--alpha.tw-interactable--hover-enabled.tw-interactive', {
                                    onclick: A,
                                },
                                    f('div.tw-align-items-center.tw-flex.tw-flex-grow-1.tw-full-height.tw-justify-content-center.tw-pd-05', {},
                                        f('p.tw-c-text-alt', {}, N)
                                    )
                                )
                            ),
                            f('div.tw-align-content-stretch.tw-border-b.tw-flex.tw-flex-grow-1', {},
                                f('button.tw-block.tw-full-width.tw-interactable.tw-interactable--alpha.tw-interactable--hover-enabled.tw-interactive', {
                                    onclick: C,
                                },
                                    f('div.tw-align-items-center.tw-flex.tw-flex-grow-1.tw-full-height.tw-justify-content-center.tw-pd-05', {},
                                        f('p.tw-c-text-alt-2', {}, D)
                                    )
                                )
                            )
                        )
                    )
                )
            )
        );

        P.appendChild(p);

        return this.element = p;
    }

    remove() {
        if(this.element)
            this.element.remove();
    }
}

// Get the current settings
// GetSettings() -> Object
function GetSettings() {
    return new Promise((resolve, reject) => {
        function ParseSettings(settings) {
            for(let setting in settings)
                settings[setting] = settings[setting] || null;

            resolve(settings);
        }

        Storage.get(null, settings =>
            Runtime.lastError?
                Storage.get(null, ParseSettings):
            ParseSettings(settings)
        );
    });
}

let StorageSpace = localStorage || sessionStorage;
// Saves data to the page's storage
// SaveCache(keys:object[, callback:function]) -> undefined
async function SaveCache(keys = {}, callback = () => {}) {
    let set = (key, value) => StorageSpace.setItem(key, value);

    for(let key in keys)
        set(key, keys[key]);

    callback();
}

// Loads data from the page's storage
// LoadCache(keys:string|array|object[, callback:function]) -> undefined
async function LoadCache(keys = null, callback = () => {}) {
    let results = {},
        get = key => StorageSpace.getItem(key);

    if(keys === null) {
        keys = {};

        for(let key in StorageSpace)
            keys[key] = null;
    }

    switch(keys.constructor) {
        case String:
            results[keys] = get(keys);
            break;

        case Array:
            for(let key of keys)
                results[key] = get(key);
            break;

        case Object:
            for(let key in keys)
                results[key] = get(key) || keys[key];
            break;

        default: return;
    }

    callback(results);
}

// Removes data from the page's storage
// RemoveCache(keys:string|array[, callback:function])
async function RemoveCache(keys, callback = () => {}) {
    let remove = key => StorageSpace.removeItem(key);

    if(!defined(keys))
        return;

    switch(keys.constructor) {
        case String:
            remove(keys);
            break;

        case Array:
            for(let key of keys)
                remove(key);
            break;
    }

    callback();
}

// Create an object of the current chat
// GetChat(lines:integer[, keepEmotes:boolean]) -> Object { style, author, emotes, message, mentions, element, uuid, highlighted }
function GetChat(lines = 30, keepEmotes = false) {
    let chat = $('[data-a-target^="chat-"i] .chat-list [data-a-target="chat-line-message"i]', true).slice(-lines),
        emotes = {},
        results = [];

    for(let line of chat) {
        let author = $('.chat-line__username', true, line).map(element => element.innerText).toString().toLowerCase(),
            message = $('.mention-fragment, .chat-line__username ~ .text-fragment, .chat-line__username ~ img, .chat-line__username ~ a, .chat-line__username ~ * .text-fragment, .chat-line__username ~ * img, .chat-line__username ~ * a, p, div[class*="inline"]:first-child:last-child', true, line)
                .map(element => element.alt && keepEmotes? `:${ (e=>{emotes[e.alt]=e.src;return e})(element).alt }:`: element.innerText)
                .filter(text => text)
                .join(' ')
                .trim()
                .replace(/(\s){2,}/g, '$1'),
            mentions = $('.mention-fragment', true, line).map(element => element.innerText.replace('@', '').toLowerCase()),
            badges = $('.chat-badge', true, line).map(img => img.alt.toLowerCase()),
            style = $('.chat-line__username [style]', true, line).map(element => element.getAttribute('style')).join(';');

        results.push({
            style,
            author,
            badges,
            message,
            mentions,
            element: line,
            uuid: (UUID.from([author, mentions.join(','), message].join(':')) + ''),
            deleted: defined($('[class*="--deleted-notice"i]', false, line)),
            highlighted: !!line.classList.value.split(' ').filter(value => /^chat-line--/i.test(value)).length,
        });
    }

    let bullets = $('[role="log"i] .tw-accent-region, [role="log"i] [data-test-selector="user-notice-line"i], [role="log"i] [class*="gift"i]', true).slice(-lines);

    results.bullets = [];

    for(let bullet of bullets) {
        let message = $('.mention-fragment, .chat-line__username ~ .text-fragment, .chat-line__username ~ img, .chat-line__username ~ a, .chat-line__username ~ * .text-fragment, .chat-line__username ~ * img, .chat-line__username ~ * a', true, bullet)
                .map(element => element.alt && keepEmotes? `:${ (e=>{emotes[e.alt]=e.src;return e})(element).alt }:`: element.innerText)
                .filter(text => text)
                .join(' ')
                .trim()
                .replace(/(\s){2,}/g, '$1'),
            mentions = $('.chatter-name, strong', true, bullet).map(element => element.innerText.toLowerCase()),
            subject = (subject =>
                /\braid/i.test(subject)?      'raid': // Incoming raid
                /\bredeem/i.test(subject)?    'cash': // Redeeming (spending) channel points
                /\bcontinu/i.test(subject)?   'keep': // Continuing a gifted subscription
                /\bgift/i.test(subject)?      'gift': // Gifting a subscription
                /\b(re)?subs/i.test(subject)? 'dues': // New subscription, or continued subscription
                null                                  // No subject
            )(($('*:first-child', false, bullet) || {}).textContent);

        results.bullets.push({
            subject,
            message,
            mentions,
            uuid: (UUID.from([subject, mentions.join(','), message].join(':')) + ''),
            element: bullet,
        });
    }

    results.emotes = emotes;

    return results;
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

// Create elements
// furnish(tagname:string[, attributes:object[, ...children]])
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
                attributes.classList = [].slice.call(attributes.classList || []).concat(v);
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
        .filter( child => defined(child) )
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

let Glyphs = {
    bonuschannelpoints: '<svg fill="#00e6cb" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M16.503 3.257L18 7v11H2V7l1.497-3.743A2 2 0 015.354 2h9.292a2 2 0 011.857 1.257zM5.354 4h9.292l1.2 3H4.154l1.2-3zM4 9v7h12V9h-3v4H7V9H4zm7 0v2H9V9h2z" clip-rule="evenodd"></path></g></svg>',
    channelpoints: '<svg fill="#9147ff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 6a4 4 0 014 4h-2a2 2 0 00-2-2V6z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>',
    checkmark: '<svg fill="#000" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M4 10l5 5 8-8-1.5-1.5L9 12 5.5 8.5 4 10z"></path></g></svg>',
    trash: '<svg fill="#fff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M12 2H8v1H3v2h14V3h-5V2zM4 7v9a2 2 0 002 2h8a2 2 0 002-2V7h-2v9H6V7H4z"></path><path d="M11 7H9v7h2V7z"></path></g></svg>',
    lock: '<svg fill="#fff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M14.001 5.99A3.992 3.992 0 0010.01 2h-.018a3.992 3.992 0 00-3.991 3.99V8H3.999v8c0 1.105.896 2 2 2h8c1.104 0 2-.895 2-2V8h-1.998V5.99zm-2 2.01V5.995A1.996 1.996 0 0010.006 4h-.01a1.996 1.996 0 00-1.995 1.995V8h4z" clip-rule="evenodd"></path></g></svg>'
};

// Update common variables
let streamers,
    streamer,
    { pathname } = top.location;

function update() {
    pathname = top.location.pathname;

    /* Streamers Object
     * href:string  - link to the streamer's channel
     * name:string  - the streamer's username
     * live:boolean - is the streamer live
     */
    streamers = [
        // Current streamers
        ...$(`a:not([href="${ pathname }"i])`, true, $('.side-bar-contents .side-nav-section:not(.recommended-channels)')).map(element => {
            return {
                href: element.href,
                name: $('figure img', false, element).alt,
                live: empty($('div[class*="--offline"i]', false, element)),
            };
        }),
    ];

    /* Streamer Object
     * href:string       - link to the streamer's channel (the current href)
     * name:string       - the streamer's username
     * like:boolean      - are you following
     * paid:boolean      - are you subscribed
     * game:string       - the name of the current game/category
     * tags:array        - tags of the strem
     * live:boolean      - the the streamer live
     * ping:boolean      - are notifications on
     * follow:function   - follows the current streamer
     * unfollow:function - unfollows the current streamer
     * chat:array*       - an array of the current chat; getter
     */
    streamer = {
        href: top.location,
        name: ($(`a[href="${ pathname }"i] h1`) || {}).textContent,
        like: defined($('[data-a-target="unfollow-button"i]')),
        paid: defined($('[data-a-target="subscribed-button"i]')),
        game: ($('[data-a-target="stream-game-link"i]') || {}).textContent,
        tags: $('.tw-tag', true).map(element => element.textContent.toLowerCase()),
        live: defined($(`a[href="${ pathname }"i] .tw-channel-status-text-indicator`)),
        ping: defined($('[data-a-target="notifications-toggle"i] [class*="--notificationbellfilled"i]')),

        follow: () => {
            let follow = $('[data-a-target="follow-button"i]');

            if(follow)
                follow.click();
        },
        unfollow: () => {
            let unfollow = $('[data-a-target="unfollow-button"i]');

            if(unfollow)
                unfollow.click();
        },

        get chat() {
            return GetChat()
        },

        get coin() {
            let points = $('div:not(#auto-community-points) > [data-test-selector="community-points-summary"i] [role="tooltip"i]');

            if(points)
                return parseInt(points.textContent.replace(/\D+/g, ''));
            return 0;
        },
    };
}

// Settings have been saved
Storage.onChanged.addListener((changes, namespace) => {
    for(let key in changes) {
        let change = changes[key],
            { oldValue, newValue } = change;

        if(newValue === false) {
            console.warn(`Turning off the ${ key } setting`, new Date);

            clearInterval(Jobs[key]);

            delete Jobs[key];

            let unhandler = Unhandlers[key];

            if(defined(unhandler))
                unhandler();
        } else if(newValue === true) {
            console.warn(`Turning on the ${ key } setting`, new Date);

            Jobs[key] = setInterval(Handlers[key], Timers[key]);
        } else {
            console.warn(`Changing the ${ key } setting`, { oldValue, newValue }, new Date);
        }

        settings[key] = newValue;
    }
});

/*** Initialization
*      _____       _ _   _       _ _          _   _
*     |_   _|     (_) | (_)     | (_)        | | (_)
*       | |  _ __  _| |_ _  __ _| |_ ______ _| |_ _  ___  _ __
*       | | | '_ \| | __| |/ _` | | |_  / _` | __| |/ _ \| '_ \
*      _| |_| | | | | |_| | (_| | | |/ / (_| | |_| | (_) | | | |
*     |_____|_| |_|_|\__|_|\__,_|_|_/___\__,_|\__|_|\___/|_| |_|
*
*
*/
// Intializes the extension
// Initialize(startover:boolean) -> undefined
let Initialize = async(startover = false) => {
    settings = await GetSettings();

    update();
    setInterval(update, 100);

    if(startover) {
        Initialize.errors |= 0;

        for(let job in Jobs)
            clearInterval(Jobs[job]);

        Initialize.errors++
    }

    /*** Auto-claim Channel Points
     *                    _                  _       _              _____ _                            _   _____      _       _
     *         /\        | |                | |     (_)            / ____| |                          | | |  __ \    (_)     | |
     *        /  \  _   _| |_ ___ ______ ___| | __ _ _ _ __ ___   | |    | |__   __ _ _ __  _ __   ___| | | |__) |__  _ _ __ | |_ ___
     *       / /\ \| | | | __/ _ \______/ __| |/ _` | | '_ ` _ \  | |    | '_ \ / _` | '_ \| '_ \ / _ \ | |  ___/ _ \| | '_ \| __/ __|
     *      / ____ \ |_| | || (_) |    | (__| | (_| | | | | | | | | |____| | | | (_| | | | | | | |  __/ | | |  | (_) | | | | | |_\__ \
     *     /_/    \_\__,_|\__\___/      \___|_|\__,_|_|_| |_| |_|  \_____|_| |_|\__,_|_| |_|_| |_|\___|_| |_|   \___/|_|_| |_|\__|___/
     *
     *
     */
    Handlers.auto_claim = () => {
        let ChannelPoints = $('[data-test-selector="community-points-summary"i] button[class*="--success"i]'),
            Enabled = (settings.auto_claim && $('#auto-community-points').getAttribute('twitch-tools-enabled') === 'true');

        if(Enabled && ChannelPoints)
            ChannelPoints.click();

        let parent = $('div:not(#auto-community-points) > [data-test-selector="community-points-summary"i] [role="tooltip"i]'),
            tooltip = $('#auto-community-points [role="tooltip"i]');

        if(tooltip && parent)
            tooltip.innerText = parent.innerText;
    };
    Timers.auto_claim = 5000;

    if(settings.auto_claim) {
        let button;
        let comify = number => (number + '').split('').reverse.join().replace(/(\d{3})/g, '$1,').split('').reverse().join('');

        if(!defined($('#auto-community-points'))) {
            let parent = $('[data-test-selector="community-points-summary"i]'),
                heading = $('.top-nav__menu > div', true).slice(-1)[0],
                element = furnish('div');

            if(!defined(parent)) {
                if(!Initialize.errors)
                    setTimeout(() => Initialize(true), 15000);

                if(empty(streamer.name))
                    throw `Currently not watching any stream. Re-initailizing in 15s`;
                else
                    throw `${ streamer.name } has not enabled Community Channel Points. Re-initailizing in 15s`;
            }

            element.innerHTML = parent.outerHTML;
            element.id = 'auto-community-points';
            element.classList.add('community-points-summary', 'tw-align-items-center', 'tw-flex', 'tw-full-height');

            heading.insertBefore(element, heading.children[1]);

            $('#auto-community-points [data-test-selector="community-points-summary"i] > div:last-child:not(:first-child)').remove();

            button = {
                element: element,
                icon: $('svg[class*="channel"i][class*="points"i], img[class*="channel"i][class*="points"i]', false, element),
                text: $('[class$="animated-number"i]', false, element),
                enabled: true
            };

            button.text.innerText = 'ON';
            button.icon.outerHTML = Glyphs.channelpoints;
            button.element.setAttribute('twitch-tools-enabled', true);

            button.icon = $('svg', false, element);
        }

        button.element.onclick = event => {
            let enabled = button.element.getAttribute('twitch-tools-enabled') !== 'true';

            button.element.setAttribute('twitch-tools-enabled', enabled);
            button.text.innerText = ['OFF','ON'][+enabled];
            button.icon.setAttribute('style', `fill:var(--color-${ ['red','accent'][+enabled] }) !important;`);
        };

        Jobs.auto_claim = setInterval(Handlers.auto_claim, Timers.auto_claim);
    }

    /*** Message Highlighter
     *      __  __                                  _    _ _       _     _ _       _     _
     *     |  \/  |                                | |  | (_)     | |   | (_)     | |   | |
     *     | \  / | ___  ___ ___  __ _  __ _  ___  | |__| |_  __ _| |__ | |_  __ _| |__ | |_ ___ _ __
     *     | |\/| |/ _ \/ __/ __|/ _` |/ _` |/ _ \ |  __  | |/ _` | '_ \| | |/ _` | '_ \| __/ _ \ '__|
     *     | |  | |  __/\__ \__ \ (_| | (_| |  __/ | |  | | | (_| | | | | | | (_| | | | | ||  __/ |
     *     |_|  |_|\___||___/___/\__,_|\__, |\___| |_|  |_|_|\__, |_| |_|_|_|\__, |_| |_|\__\___|_|
     *                                  __/ |                 __/ |           __/ |
     *                                 |___/                 |___/           |___/
     */
    Handlers.highlight_messages = () => {
        let chat = GetChat().filter(line => !!~line.mentions.indexOf(USERNAME));

        for(let line of chat)
            if(!~visible.indexOf(line.uuid)) {
                line.element.setAttribute('style', 'background-color: var(--color-background-button-primary-active)');
                visible.push(line.uuid);

                let { author, message } = line;

                let existing = $('#twitch-tools-popup');

                if(defined(existing))
                    continue;

                if(settings.highlight_messages_popup)
                    new Popup(`${ author } sent you a message`, message, {
                        Reply: event => {
                            let chatbox = $('.chat-input__textarea textarea'),
                                existing = $('#twitch-tools-popup');

                            chatbox.focus();
                            existing.remove();
                        }
                    });
            }
    };
    Timers.highlight_messages = 500;

    if(settings.highlight_messages)
        Jobs.highlight_messages = setInterval(Handlers.highlight_messages, Timers.highlight_messages);

     /*** Message Filter
     *      __  __                                  ______ _ _ _
     *     |  \/  |                                |  ____(_) | |
     *     | \  / | ___  ___ ___  __ _  __ _  ___  | |__   _| | |_ ___ _ __
     *     | |\/| |/ _ \/ __/ __|/ _` |/ _` |/ _ \ |  __| | | | __/ _ \ '__|
     *     | |  | |  __/\__ \__ \ (_| | (_| |  __/ | |    | | | ||  __/ |
     *     |_|  |_|\___||___/___/\__,_|\__, |\___| |_|    |_|_|\__\___|_|
     *                                  __/ |
     *                                 |___/
     */
    Handlers.filter_messages = () => {
        let rules = settings.filter_rules;

        if(!rules || !rules.length)
            return;

        rules = rules.split(/,/).filter(value => value.length);

        if(!rules.length)
            return;

        let channel = rules.filter(rule => /^\/[\w\-]+/.test(rule)).map((rule, index) => {
                let name, text;

                rule.replace(/^\/([\w\-]+) +([^]*?)$/, ($0, $1, $2, $$, $_) => {
                    name = $1;
                    text = $2;
                });

                if(name && text && text.length)
                    rules.splice(index, 1);

                return { name, text };
            }),

            user = rules.filter(rule => /^@[\w\-]+/.test(rule)).map((user, index) => {
                if(user)
                    rules.splice(index, 1);

                return user.replace(/^@/, '');
            }).join('|'),

            text = rules.filter(rule => !/^@[\w\-]+/.test(rule)).map((text, index) => {
                if(text)
                    rules.splice(index, 1);

                return /^\w+$/.test(text)? `\\b${ text }\\b`: text;
            }).join('|');

        let Filter = {
            text: (text.length? RegExp(`(${ text })`, 'i'): /^[\b]$/),
            user: (user.length? RegExp(`(${ user })`, 'i'): /^[\b]$/),
            channel
        };

        GetChat(10, true).filter(line => {
            return false
                // Filter messges (RegExp) on all channels
                || Filter.text.test(line.message)
                // Filter users on all channels
                || Filter.user.test(line.author)
                // Filter messages (verbatim) on specific a channel
                || !!~Filter.channel.map(({ name, text }) => {
                    if(!defined(streamer))
                        return;

                    let channel = streamer.name.toLowerCase();

                    return channel == name && !!~line.message.toLowerCase().indexOf(text);
                }).indexOf(true);
        }).map(line => {
            let { element, mentions } = line,
                hidden = element.getAttribute('twitch-tools-hidden') === 'true';

            if(hidden || !!~mentions.indexOf(USERNAME))
                return;

            element.setAttribute('style', 'display:none');
            element.setAttribute('twitch-tools-hidden', true);
        });
    };
    Timers.filter_messages = 100;

    Unhandlers.filter_messages = () => {
        let hidden = $('[twitch-tools-hidden]', true);

        hidden.map(element => {
            element.removeAttribute('[twitch-tools-hidden]');
            element.removeAttribute('[style]');
        });
    };

    if(settings.filter_messages)
        Jobs.filter_messages = setInterval(Handlers.filter_messages, Timers.filter_messages);

    /*** Keep Watching
     *      _  __                __          __   _       _     _
     *     | |/ /                \ \        / /  | |     | |   (_)
     *     | ' / ___  ___ _ __    \ \  /\  / /_ _| |_ ___| |__  _ _ __   __ _
     *     |  < / _ \/ _ \ '_ \    \ \/  \/ / _` | __/ __| '_ \| | '_ \ / _` |
     *     | . \  __/  __/ |_) |    \  /\  / (_| | || (__| | | | | | | | (_| |
     *     |_|\_\___|\___| .__/      \/  \/ \__,_|\__\___|_| |_|_|_| |_|\__, |
     *                   | |                                             __/ |
     *                   |_|                                            |___/
     */
    Handlers.keep_watching = async() => {
        let online = streamers.filter(streamer => streamer.live),
            next = online[(Math.random() * online.length)|0],
            { pathname } = window.location;

        let Paths = [USERNAME, '[up]/', 'videos', 'team', 'directory', 'downloads', 'jobs', 'turbo', 'friends', 'subscriptions', 'inventory', 'wallet', 'settings', 'search', '$'];

        await LoadCache('UserIntent', cache => {
            let { UserIntent } = cache;

            if(UserIntent)
                Paths.push(UserIntent);
        });

        let ValidTwitchPath = RegExp(`/(${ Paths.join('|') })`, 'i');

        if(!streamer.live && !ValidTwitchPath.test(pathname)) {
            if(online.length) {
                console.warn(`${ streamer.name } is no longer live. Moving onto next streamer (${ next.name })`, next.href, new Date);

                open(next.href, '_self');
            } else  {
                console.warn(`${ streamer.name } is no longer live. There doesn't seem to be any followed streamers on right now`, new Date);
            }
        } else if(/\/search/i.test(pathname)) {
            let { term } = parseURL(location).searchParameters;

            await SaveCache({ UserIntent: term });
        }
    };
    Timers.keep_watching = 5000;

    if(settings.keep_watching)
        Jobs.keep_watching = setInterval(Handlers.keep_watching, Timers.keep_watching);

    // Wait for the elements to populate
    // May not always be present
    setTimeout(() => {
        $('[data-a-target="followed-channel"i], [role="group"i][aria-label*="followed"i] [href^="/"]', true).map(a => {
            a.addEventListener('mousedown', async event => {
                let { currentTarget } = event;

                let url = parseURL(currentTarget.href),
                    UserIntent = url.pathname.replace('/', '');

                await SaveCache({ UserIntent });
            });
        });
    }, 1e3);

    /*** Stop Raiding
     *       _____ _                _____       _     _ _
     *      / ____| |              |  __ \     (_)   | (_)
     *     | (___ | |_ ___  _ __   | |__) |__ _ _  __| |_ _ __   __ _
     *      \___ \| __/ _ \| '_ \  |  _  // _` | |/ _` | | '_ \ / _` |
     *      ____) | || (_) | |_) | | | \ \ (_| | | (_| | | | | | (_| |
     *     |_____/ \__\___/| .__/  |_|  \_\__,_|_|\__,_|_|_| |_|\__, |
     *                     | |                                   __/ |
     *                     |_|                                  |___/
     */
    Handlers.stop_raiding = () => {
        let online = streamers.filter(streamer => streamer.live),
            next = online[(Math.random() * online.length)|0],
            raiding = defined($('[data-test-selector="raid-banner"i]'));

        if(raiding && next)
            if(online.length) {
                console.warn(`${ streamer.name } is raiding. Moving onto next streamer (${ next.name })`, next.href, new Date);

                open(next.href, '_self');
            } else {
                console.warn(`${ streamer.name } is raiding. There doesn't seem to be any followed streamers on right now`, new Date);
            }
    };
    Timers.stop_raiding = 5000;

    if(settings.stop_raiding)
        Jobs.stop_raiding = setInterval(Handlers.stop_raiding, Timers.stop_raiding);

    /*** Auto-Follow Raids
     *                    _              ______    _ _
     *         /\        | |            |  ____|  | | |
     *        /  \  _   _| |_ ___ ______| |__ ___ | | | _____      __
     *       / /\ \| | | | __/ _ \______|  __/ _ \| | |/ _ \ \ /\ / /
     *      / ____ \ |_| | || (_) |     | | | (_) | | | (_) \ V  V /
     *     /_/    \_\__,_|\__\___/      |_|  \___/|_|_|\___/ \_/\_/
     *
     *
     */
    Handlers.auto_follow_raids = () => {
        if(!defined(streamer))
            return;

        let url = parseURL(top.location),
            data = url.searchParameters;

        let { like, coin, follow } = streamer,
            raid = data.referrer == 'raid',
            aft = settings.auto_follow_time,
            mins = parseInt(settings.auto_follow_time_minutes) | 0;

        if(!like) {
            if(raid)
                follow();
            else if(aft)
                if(mins)
                    setTimeout(follow, mins * 60 * 1000);
                else
                    follow();
        }
    };
    Timers.auto_follow_raids = 1000;

    if(settings.auto_follow_raids)
        Jobs.auto_follow_raids = setInterval(Handlers.auto_follow_raids, Timers.auto_follow_raids);

    /*** Easy Filter - NOT A SETTING. THIS IS A HELPER FOR: MESSAGE FILTER
     *      ______                  ______ _ _ _
     *     |  ____|                |  ____(_) | |
     *     | |__   __ _ ___ _   _  | |__   _| | |_ ___ _ __
     *     |  __| / _` / __| | | | |  __| | | | __/ _ \ '__|
     *     | |___| (_| \__ \ |_| | | |    | | | ||  __/ |
     *     |______\__,_|___/\__, | |_|    |_|_|\__\___|_|
     *                       __/ |
     *                      |___/
     */

    Handlers.easy_filter = () => {
        let card = $('[data-a-target="viewer-card"i], [data-a-target="emote-card"i]'),
            existing = $('#twitch-tools-filter-rule-user, #twitch-tools-filter-rule-emote');

        if(!defined(card) || defined(existing))
            return;

        let title = $('h4', false, card),
            name = title.textContent.toLowerCase(),
            type = (card.getAttribute('data-a-target').toLowerCase() == 'viewer-card'? 'user': 'emote'),
            { filter_rules } = settings;

        if(type == 'user') {
            /* Filter users */
            if(filter_rules && !!~filter_rules.split(',').indexOf(`@${ name }`))
                return /* Already filtering messages from this person */;

            let filter = furnish('div#twitch-tools-filter-rule-user', {
                title: `Filter all messages from @${ name }`,
                style: 'cursor:pointer; fill:var(--color-white); font-size:1.1rem; font-weight:normal',
                username: name,

                onclick: event => {
                    let { currentTarget } = event,
                        username = currentTarget.getAttribute('username'),
                        { filter_rules } = settings;

                    filter_rules = (filter_rules || '').split(',');
                    filter_rules.push(`@${ username }`);
                    filter_rules = filter_rules.join(',');

                    currentTarget.remove();

                    Storage.set({ filter_rules });
                },

                innerHTML: `${ Glyphs.trash } Filter messages from @${ name }`,
            });

            let svg = $('svg', false, filter);

            svg.setAttribute('style', 'vertical-align:bottom; height:20px; width:20px');

            title.appendChild(filter);
        } else if(type == 'emote') {
            /* Filter emotes */
            if(filter_rules && !!~filter_rules.split(',').indexOf(`:${ name }:`))
                return /* Already filtering this emote */;

            let filter = furnish('div#twitch-tools-filter-rule-emote', {
                title: 'Filter this emote',
                style: 'cursor:pointer; fill:var(--color-white); font-size:1.1rem; font-weight:normal',
                emote: `:${ name }:`,

                onclick: event => {
                    let { currentTarget } = event,
                        emote = currentTarget.getAttribute('emote'),
                        { filter_rules } = settings;

                    filter_rules = (filter_rules || '').split(',');
                    filter_rules.push(emote);
                    filter_rules = filter_rules.join(',');

                    currentTarget.remove();

                    Storage.set({ filter_rules });
                },

                innerHTML: `${ Glyphs.trash } Filter this emote`,
            });

            let svg = $('svg', false, filter);

            svg.setAttribute('style', 'vertical-align:bottom; height:20px; width:20px');

            title.appendChild(filter);
        }
    };
    Timers.easy_filter = 500;

    Jobs.easy_filter = setInterval(Handlers.easy_filter, Timers.easy_filter);

    /*** Auto-Reload
     *                    _              _____      _                 _
     *         /\        | |            |  __ \    | |               | |
     *        /  \  _   _| |_ ___ ______| |__) |___| | ___   __ _  __| |
     *       / /\ \| | | | __/ _ \______|  _  // _ \ |/ _ \ / _` |/ _` |
     *      / ____ \ |_| | || (_) |     | | \ \  __/ | (_) | (_| | (_| |
     *     /_/    \_\__,_|\__\___/      |_|  \_\___|_|\___/ \__,_|\__,_|
     *
     *
     */
    Handlers.auto_reload = () => {
        let error_message = $('[data-a-target="player-overlay-content-gate"i]'),
            search = [];

        if(!defined(error_message))
            return;

        let url = parseURL(location),
            parameters = url.searchParameters;

        console.error('The stream ran into an error:', error_message.textContent, new Date);

        parameters.fail = (+new Date).toString(36);

        for(let key in parameters)
            search.push(`${key}=${parameters[key]}`);

        location.search = '?' + search.join('&');
    };
    Timers.auto_reload = 1000;

    Jobs.auto_reload = setInterval(Handlers.auto_reload, Timers.auto_reload);

    /*** Auto-Play
     *                    _              _____  _
     *         /\        | |            |  __ \| |
     *        /  \  _   _| |_ ___ ______| |__) | | __ _ _   _
     *       / /\ \| | | | __/ _ \______|  ___/| |/ _` | | | |
     *      / ____ \ |_| | || (_) |     | |    | | (_| | |_| |
     *     /_/    \_\__,_|\__\___/      |_|    |_|\__,_|\__, |
     *                                                   __/ |
     *                                                  |___/
     */
    Handlers.auto_play_stream = () => {
        let video = $('video');

        if(!video)
            return;

        let { paused } = video,
            isTrusted = defined($('[data-a-player-state="paused"i]')),
            isAdvert = defined($('video + div [class*="text-overlay"i]:not([class*="channel-status"i])'));

        // Leave the video alone
            // if the video isn't paused
            // if the video was paused by the user (trusted)
            // if the video is an ad and auto-play ads is disabled
        if(!paused || isTrusted || (isAdvert && !settings.auto_play_ads))
            return;

        let playing = video.play();

        if(defined(playing))
            playing.then(() => {
                // async playing
                return;
            })
            .catch(error => {
                // something went wrong
                throw error;
            });
    };
    Timers.auto_play_stream = 5000;

    if(settings.auto_play_stream) {
        let video = $('video');

        video.onpause = event => {
            let { currentTarget } = event,
                isTrusted = defined($('[data-a-player-state="paused"i]')),
                isAdvert = defined($('video + div [class*="text-overlay"i]:not([class*="channel-status"i])'));

            if(isTrusted || (isAdvert && !settings.auto_play_ads))
                return;

            currentTarget.play();
        };

        Jobs.auto_play_stream = setInterval(Handlers.auto_play_stream, Timers.auto_play_stream);
    }

    /*** First in Line
     *      ______ _          _     _         _      _
     *     |  ____(_)        | |   (_)       | |    (_)
     *     | |__   _ _ __ ___| |_   _ _ __   | |     _ _ __   ___
     *     |  __| | | '__/ __| __| | | '_ \  | |    | | '_ \ / _ \
     *     | |    | | |  \__ \ |_  | | | | | | |____| | | | |  __/
     *     |_|    |_|_|  |___/\__| |_|_| |_| |______|_|_| |_|\___|
     *
     *
     */
    let FiLH, FiLJ;

    Handlers.first_in_line = () => {
        let notifications = $('[data-test-selector="onsite-notifications-toast-manager"i] [data-test-selector^="onsite-notification-toast"i]', true);

        if(!notifications.length)
            return;

        let mins = parseInt(settings.first_in_line_timer) | 0;

        for(let notification of notifications) {
            let action = $('a[href^="/"]', false, notification);

            if(!defined(action) || defined(FiLH))
                continue;

            console.warn('Recieved an actionable notification:', action.textContent, new Date);
            console.warn(`Waiting ${ mins } minutes before leaving for stream`, new Date);

            let { href, textContent } = action,
                url = parseURL(href),
                { pathname } = url;

            if(/\b(go(?:ing)?|is|went) +live\b/i.test(textContent)) {
                FiLH = href;

                if(mins) {
                    setTimeout(() => {
                        console.warn('Heading to stream in 1 minute', FiLH, new Date);
                        new Popup(`First in line: TTV${ pathname }`, 'Heading to stream in 1 minute', {
                            Goto: () => {
                                let existing = $('#twitch-tools-popup');

                                existing.remove();
                                console.warn('Heading to stream now');

                                clearTimeout(FiLJ);
                                open(FiLH, '_self');

                                FiLH = undefined;
                            },
                            Cancel: () => {
                                let existing = $('#twitch-tools-popup');

                                existing.remove();
                                console.warn('Canceled First in Line event');

                                clearTimeout(FiLJ);
                                FiLH = undefined;
                            },
                        });
                    }, (mins - 1) * 60 * 1000);

                    FiLJ = setTimeout(() => {
                        let existing = $('#twitch-tools-popup');

                        existing.remove();

                        clearTimeout(FiLJ);
                        open(FiLH, '_self');

                        FiLH = undefined;
                    }, mins * 60 * 1000);
                } else {
                    let existing = $('#twitch-tools-popup');

                    existing.remove();

                    open(FiLH, '_self');

                    FiLH = undefined;
                }
            }
        }
    };
    Timers.first_in_line = 3000;

    Unhandlers.first_in_line = () => {
        if(defined(FiLH))
            FiLH = '?';
    };

    if(settings.first_in_line)
        Jobs.first_in_line = setInterval(Handlers.first_in_line, Timers.first_in_line);

    /*** Bits-to-Cents
     *      ____  _ _              _               _____           _
     *     |  _ \(_) |            | |             / ____|         | |
     *     | |_) |_| |_ ___ ______| |_ ___ ______| |     ___ _ __ | |_ ___
     *     |  _ <| | __/ __|______| __/ _ \______| |    / _ \ '_ \| __/ __|
     *     | |_) | | |_\__ \      | || (_) |     | |___|  __/ | | | |_\__ \
     *     |____/|_|\__|___/       \__\___/       \_____\___|_| |_|\__|___/
     *
     *
     */
    Handlers.bits_to_cents = () => {
        let dropdown = $('[class*="bits-buy"i]'),
            bits_counter = $('.bits-count:not([twitch-tools-true-amount])', true),
            hype_trains = $('[class*="community-highlight-stack"i] p:not([twitch-tools-true-amount])', true);

        let bits_regexp = /([\d,]+) +bits/i;

        if(defined(dropdown))
            $('h5:not([twitch-tools-true-amount])', true, dropdown).map(header => {
                let bits = parseInt(header.textContent.replace(/\D+/g, '')),
                    usd;

                usd = (bits * .01).toFixed(2).replace(/(\.\d)$/, '$10');

                header.textContent += ` ($${ usd })`;

                header.setAttribute('twitch-tools-true-amount', usd);
            });

        for(let counter of bits_counter) {
            let { innerHTML } = counter;

            if(bits_regexp.test(innerHTML))
                counter.innerHTML = innerHTML.replace(bits_regexp, ($0, $1, $$, $_) => {
                    let bits = parseInt($1.replace(/\D+/g, '')),
                        usd = bits * .01;

                    usd = (bits * .01).toFixed(2);

                    counter.setAttribute('twitch-tools-true-amount', usd);

                    return `${ $0 } ($${ usd })`;
                });
        }

        for(let train of hype_trains) {
            let { innerHTML } = train;

            if(bits_regexp.test(innerHTML))
                train.innerHTML = innerHTML.replace(bits_regexp, ($0, $1, $$, $_) => {
                    let bits = parseInt($1.replace(/\D+/g, '')),
                        usd = bits * .01;

                    usd = (bits * .01).toFixed(2);

                    train.setAttribute('twitch-tools-true-amount', usd);

                    return `${ $0 } ($${ usd })`;
                });
        }
    };
    Timers.bits_to_cents = 1000;

    if(settings.bits_to_cents)
        Jobs.bits_to_cents = setInterval(Handlers.bits_to_cents, Timers.bits_to_cents);

    /*** Emotes+ :D
     *      ______                 _                      _____
     *     |  ____|               | |             _     _|  __ \
     *     | |__   _ __ ___   ___ | |_ ___  ___ _| |_  (_) |  | |
     *     |  __| | '_ ` _ \ / _ \| __/ _ \/ __|_   _|   | |  | |
     *     | |____| | | | | | (_) | ||  __/\__ \ |_|    _| |__| |
     *     |______|_| |_| |_|\___/ \__\___||___/       (_)_____/
     *
     *
     */
    let EMOTES = {},
        shrt = url => url.replace(/https:\/\/static-cdn\.jtvnw\.net\/emoticons\/v1\/(\d+)\/([\d\.]+)/i, ($0, $1, $2, $$, $_) => {
            let id = parseInt($1).toString(36),
                version = $2;

            return [id, version].join('-');
        });

    Handlers.emotes_plus = () => {
        let chat = GetChat(5, true),
            regexp;

        for(let emote in chat.emotes)
            if(!(emote in EMOTES))
                EMOTES[emote] = shrt(chat.emotes[emote]);

        for(let line of chat)
            for(let emote in EMOTES)
                if((regexp = RegExp(emote.replace(/(\W)/g, '\\$1'))).test(line.message)) {
                    let alt = emote,
                        src = '//static-cdn.jtvnw.net/emoticons/v1/' + EMOTES[emote].split('-').map((v, i) => i == 0? parseInt(v, 36): v).join('/'),
                        srcset;

                    if(/\/https?:\/\//i.test(src))
                        src = src.replace(/[^]*\/(https?:\/\/[^]*)(?:\/https?:\/\/)?$/i, '$1');
                    else
                        srcset = [1, 2, 4].map((v, i) => src.replace(/[\d\.]+$/, `${ (i + 1).toFixed(1) } ${ v }x`)).join(',');

                    let f = furnish;
                    let img =
                    f('div.chat-line__message--emote-button', { 'data-test-selector': 'emote-button' },
                        f('span', { 'data-a-target': 'emote-name' },
                            f('div.class.chat-image__container.tw-align-center.tw-inline-block', {},
                                f('img.chat-image.chat-line__message--emote', {
                                    title: alt,
                                    srcset, alt, src,
                                })
                            )
                        )
                    );

                    let { element } = line;

                    $('.text-fragment:not([twitch-tools-emote-plus])', true, element).map(fragment => {
                        fragment.setAttribute('twitch-tools-emote-plus', alt);
                        fragment.innerHTML = fragment.innerHTML.replace(regexp, img.innerHTML);
                    });
                }
    };
    Timers.emotes_plus = 100;

    if(settings.emotes_plus) {
        // Collect emotes
        let chat_emote_button = $('[data-a-target="emote-picker-button"i]');

        function CollectEmotes() {
            chat_emote_button.click();

            setTimeout(() => {
                $('[class*="emote-picker"i] .emote-button img', true)
                    .map(img => {
                        EMOTES[img.alt] = shrt(img.src);
                    });

                top.EMOTES = EMOTES;

                chat_emote_button.click();
            }, 500);
        }

        if(defined(chat_emote_button))
            CollectEmotes();
        else
            setTimeout(CollectEmotes, 1000);

        Jobs.emotes_plus = setInterval(Handlers.emotes_plus, Timers.emotes_plus);
    }
};
// End of Initialize

let WaitForPageToLoad = setInterval(() => {
    let ready = defined($(`[data-a-target="follow-button"i], [data-a-target="unfollow-button"i]`));

    if(ready) {
        Initialize();
        clearInterval(WaitForPageToLoad);
    }
}, 500);
