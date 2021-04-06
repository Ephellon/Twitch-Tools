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
let $ = (selector, multiple = false, container = document) => multiple? [...container?.querySelectorAll(selector)]: container?.querySelector(selector);
let unknown = value => (value === undefined || value === null),
    defined = value => !unknown(value);

let Settings = {},
    UserMenuToggleButton = $('[data-a-target="user-menu-toggle"i]'),
    Jobs = {},
    Queue = { balloons: [], bullets: [], bttv_emotes: [], emotes: [], messages: [], message_popups: [], popups: [] },
    Timers = {},
    Handlers = {
        __reasons__: new Map(),
    },
    Unhandlers = {
        __reasons__: new Map(),
    },
    Messages = new Map(),
    PostOffice = new Map(),
    // These won't change (often)
    USERNAME,
    THEME,
    SPECIAL_MODE,
    NORMAL_MODE,
    NORMALIZED_PATHNAME;

// Populate the username field by quickly showing the menu
if(defined(UserMenuToggleButton)) {
    UserMenuToggleButton.click();
    USERNAME = top.USERNAME = $('[data-a-target="user-display-name"i]').innerText;
    THEME = [...$('html').classList].find(c => /theme-(\w+)/i.test(c)).replace(/[^]*theme-(\w+)/i, '$1').toLowerCase();
    UserMenuToggleButton.click();
}

let browser, Storage, Runtime, Manifest, Extension, Container, BrowserNamespace;

if(defined(browser?.runtime))
    BrowserNamespace = 'browser';
else if(defined(chrome?.extension))
    BrowserNamespace = 'chrome';

Container = top[BrowserNamespace];

switch(BrowserNamespace) {
    case 'browser':
        Runtime = Container.runtime;
        Storage = Container.storage;
        Extension = Container.extension;
        Manifest = Runtime.getManifest();

        Storage = Storage.sync ?? Storage.local;
        break;

    case 'chrome':
    default:
        Runtime = Container.runtime;
        Storage = Container.storage;
        Extension = Container.extension;
        Manifest = Runtime.getManifest();

        Storage = Storage.sync ?? Storage.local;
        break;
}

let { CHROME_UPDATE, INSTALL, SHARED_MODULE_UPDATE, UPDATE } = Runtime.OnInstalledReason;

// Logs messages (green)
    // LOG([...messages]) -> undefined
let LOG = (...messages) => {
    let CSS = `
        background-color: #00332b;
        border-bottom: 1px solid #0000;
        border-top: 1px solid #065;
        box-sizing: border-box;
        clear: right;
        color: #f5f5f5;
        display: block !important;
        line-height: 2;
        user-select: text;

        flex-basis: 1;
        flex-shrink: 1;

        margin: 0;
        overflow-wrap: break-word;
        padding: 0 6px;
        position: fixed;
        z-index: -1;

        min-height: 0;
        min-width: 100%;
        height: 100%;
        width: 100%;
    `;

    console.group(`%c\u22b3 [LOG] \u2014 ${ Manifest?.name }`, CSS);

    for(let message of messages) {
        let type = 'c';

        if(!isObj(message, Boolean, Number, Promise))
            try {
                message = message.toString();
            } catch(error) {
                /* Can't convert to string */
            }
        else
            type = 'o';

        (type/* == 'o'*/)?
            console.log(message):
        console.log(
            `%${ type }\u22b3 ${ message } `,
            CSS
        );
    }

    console.groupEnd();
};

// Logs warnings (yellow)
    // WARN([...messages]) -> undefined
let WARN = (...messages) => {
    let CSS = `
        background-color: #332b00;
        border-bottom: 1px solid #0000;
        border-top: 1px solid #650;
        box-sizing: border-box;
        clear: right;
        color: #f5f5f5;
        display: block !important;
        line-height: 2;
        user-select: text;

        flex-basis: 1;
        flex-shrink: 1;

        margin: 0;
        overflow-wrap: break-word;
        padding: 0 6px;
        position: fixed;
        z-index: -1;

        min-height: 0;
        min-width: 100%;
        height: 100%;
        width: 100%;
    `;

    console.group(`%c\u26a0 [WARNING] \u2014 ${ Manifest?.name }`, CSS);

    for(let message of messages) {
        let type = 'c';

        if(!isObj(message, Boolean, Number, Promise))
            try {
                message = message.toString();
            } catch(error) {
                /* Can't convert to string */
            }
        else
            type = 'o';

        (type/* == 'o'*/)?
            console.log(message):
        console.log(
            `%${ type }\u26a0 ${ message } `,
            CSS
        );
    }

    console.groupEnd();
};

// Logs errors (red)
    // ERROR([...messages]) -> undefined
let ERROR = (...messages) => {
    let CSS = `
        background-color: #290000;
        border-bottom: 1px solid #0000;
        border-top: 1px solid #5c0000;
        box-sizing: border-box;
        clear: right;
        color: #f5f5f5;
        display: block !important;
        line-height: 2;
        user-select: text;

        flex-basis: 1;
        flex-shrink: 1;

        margin: 0;
        overflow-wrap: break-word;
        padding: 0 6px;
        position: fixed;
        z-index: -1;

        min-height: 0;
        min-width: 100%;
        height: 100%;
        width: 100%;
    `;

    console.group(`%c\u2298 [ERROR] \u2014 ${ Manifest?.name }`, CSS);

    for(let message of messages) {
        let type = 'c';

        if(!isObj(message, Boolean, Number, Promise))
            try {
                message = message.toString();
            } catch(error) {
                /* Can't convert to string */
            }
        else
            type = 'o';

        (type/* == 'o'*/)?
            console.log(message):
        console.log(
            `%${ type }\u2298 ${ message } `,
            CSS
        );
    }

    console.groupEnd();
};

// Logs comments (blue)
    // LOG([...messages]) -> undefined
let REMARK = (...messages) => {
    let CSS = `
        background-color: #002b55;
        border-bottom: 1px solid #0000;
        border-top: 1px solid #057;
        box-sizing: border-box;
        clear: right;
        color: #f5f5f5;
        display: block !important;
        line-height: 2;
        user-select: text;

        flex-basis: 1;
        flex-shrink: 1;

        margin: 0;
        overflow-wrap: break-word;
        padding: 0 6px;
        position: fixed;
        z-index: -1;

        min-height: 0;
        min-width: 100%;
        height: 100%;
        width: 100%;
    `;

    console.group(`%c\u22b3 [COMMENT] \u2014 ${ Manifest?.name }`, CSS);

    for(let message of messages) {
        let type = 'c';

        if(!isObj(message, Boolean, Number, Promise))
            try {
                message = message.toString();
            } catch(error) {
                /* Can't convert to string */
            }
        else
            type = 'o';

        (type/* == 'o'*/)?
            console.log(message):
        console.log(
            `%${ type }\u22b3 ${ message } `,
            CSS
        );
    }

    console.groupEnd();
};

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
        key = (key ?? '').toString();

        let PRIVATE_KEY = `private-key=${ UUID.#BWT_SEED }`,
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

// Displays a popup
    // new Popup(subject:string, message:string[, options:object]) -> Object
    // Popup.prototype.remove() -> undefined
class Popup {
    static #POPUPS = new Map()

    constructor(subject, message, options = {}) {
        let f = furnish;

        let P = $('.stream-chat-header'),
            X = $('#tt-popup', false, P),
            I = Extension.getURL('profile.png'),
            N = 'Continue',
            D = 'Close',
            A = event => $('#tt-popup')?.remove(),
            C = event => $('#tt-popup')?.remove(),
            R = '_self',
            U, S, M, G, T, W, H;

        let uuid = U = UUID.from(subject).value,
            existing = Popup.#POPUPS.get(subject);

        if(defined(existing))
            return existing;

        if(defined(X)) {
            if(!Queue.popups.map(popup => popup.uuid).contains(uuid)) {
                let interval = setInterval(() => {
                    let existing = $('#tt-popup');

                    if(defined(existing))
                        return;

                    let { subject, message, options, uuid, interval } = Queue.popups.pop();

                    new Popup(subject, message, options);

                    clearInterval(interval);
                }, 500);

                Queue.popups.splice(0, 0, { subject, message, options, uuid, interval });
            }

            return;
        }

        for(let n in options)
            if(typeof options[n] == 'function')
                if(/\b(abandon|cancel|choke|close|drop|end|halt|kill|nix|plug|postpone|seal|scrap|scrub|stop)\b/i.test(n))
                    C = options[D = n] ?? C;
                else
                    A = options[N = n] ?? A;
            else if(/\b(figure|(?:fav)?icon|image|picture|profile|symbol)\b/i.test(n))
                I = options[n] ?? I;
            else if(/\b(href|link)\b/i.test(n))
                H = options[n] ?? H;
            else if(/\b(target|to)\b/i.test(n))
                H = options[n] ?? H;

        let p =
        f('div#tt-popup.tw-absolute.tw-mg-t-5', { 'tt-id': subject.replace(/\s+/g, '-'), style: 'z-index:9; bottom:10rem; right:1rem' },
            f('div.tw-animation.tw-animation--animate.tw-animation--bounce-in.tw-animation--duration-medium.tw-animation--fill-mode-both.tw-animation--timing-ease', { 'data-a-target': 'tw-animation-target' },
                f('div', {},
                    f('div.tw-border-b.tw-border-l.tw-border-r.tw-border-radius-small.tw-border-t.tw-c-background-base.tw-elevation-2.tw-flex.tw-flex-nowrap.tw-mg-b-1', {
                            style: 'background-color:#387aff!important;'
                        },
                        f('a', { href: H, target: R, style: 'text-decoration:none' },
                            f('div.tw-block.tw-full-width.tw-interactable.tw-interactable--alpha.tw-interactable--hover-enabled.tw-interactive', {},
                                f('div.tw-flex.tw-flex-nowrap.tw-pd-l-1.tw-pd-y-1', {},
                                    f('div', {},
                                        f('div', { style: 'height:4rem; width:4rem' },
                                            G = f('img.tw-border-radius-rounded.tw-full-height.tw-full-width.tw-image', {
                                                src: I,
                                                sizeinpixels: 40,
                                                borderradius: 'tw-border-radius-rounded',
                                            })
                                        )
                                    ),
                                    f('div.tw-flex.tw-flex-column.tw-flex-nowrap.tw-overflow-hidden.tw-pd-x-1', {},
                                        f('div.tw-full-height.tw-overflow-hidden', {},
                                            f('span.tw-c-text-alt', {},
                                                f('div', {},
                                                    S = f('p', {}, subject)
                                                )
                                            )
                                        ),
                                        f('div.tw-flex-shrink-0.tw-mg-t-05', {},
                                            M = f('div.tw-c-text-alt', {}, message)
                                        )
                                    )
                                )
                            )
                        ),
                        // Notification counter
                        f('div#tt-notification-counter--popup.tw-absolute.tw-font-size-7.tw-right-0.tw-top-0', { style: 'visibility:hidden' },
                            f('div.tw-animation.tw-animation--animate.tw-animation--bounce-in.tw-animation--duration-medium.tw-animation--fill-mode-both.tw-animation--timing-ease-in', {
                                    'data-a-target': 'tw-animation-target'
                                },
                                f('div.tw-c-background-base.tw-inline-flex.tw-number-badge.tw-relative', {},
                                    f('div#tt-notification-counter-output--popup.tw-c-text-overlay.tw-number-badge__badge.tw-relative', {
                                        'interval-id': setInterval(() => {
                                            let { length } = Queue.popups,
                                                counter = $('#tt-notification-counter--popup'),
                                                output = $('#tt-notification-counter-output--popup');

                                            if(!defined(counter) || !defined(output))
                                                return;

                                            let visibility = counter.getAttribute('style').replace(/[^]+:/, ''),
                                                interval = parseInt(output.getAttribute('interval-id'));

                                            output.textContent = length;

                                            if(length < 1) {
                                                counter.setAttribute('style', 'visibility:hidden');
                                            } else {
                                                counter.setAttribute('style', 'visibility:unset');
                                            }
                                        }, 100),
                                    }, Queue.popups.length)
                                )
                            )
                        ),
                        // Confirmation/Decline buttons
                        f('div.tw-align-content-stretch.tw-border-l.tw-flex.tw-flex-column.tw-flex-grow-0.tw-flex-shrink-0', {},
                            // Confirm
                            f('div.tw-align-content-stretch.tw-border-b.tw-flex.tw-flex-grow-1', {},
                                T = f('button.tw-block.tw-full-width.tw-interactable.tw-interactable--alpha.tw-interactable--hover-enabled.tw-interactive', {
                                        onclick: A,
                                    },
                                    f('div.tw-align-items-center.tw-flex.tw-flex-grow-1.tw-full-height.tw-justify-content-center.tw-pd-05', {},
                                        f('p.tw-c-text-alt', {}, N)
                                    )
                                )
                            ),
                            // Decline
                            f('div.tw-align-content-stretch.tw-border-b.tw-flex.tw-flex-grow-1', {},
                                W = f('button.tw-block.tw-full-width.tw-interactable.tw-interactable--alpha.tw-interactable--hover-enabled.tw-interactive', {
                                        onclick: C,
                                    },
                                    f('div.tw-align-items-center.tw-flex.tw-flex-grow-1.tw-full-height.tw-justify-content-center.tw-pd-05', {},
                                        f('p.tw-c-text-alt', {}, D)
                                    )
                                )
                            )
                        )
                    )
                )
            )
        );

        P.appendChild(p);

        this.uuid = U;
        this.next = A;
        this.close = C;
        this.parent = P;
        this.container = p;
        this.elements = {
            icon: G,
            accept: T,
            decline: W,
            message: M,
            subject: S,
            container: p,
        };

        Popup.#POPUPS.set(subject, this);

        return this;
    }

    remove() {
        if(this.container)
            this.container.remove();
    }

    static get(subject) {
        return Popup.#POPUPS.get(subject);
    }
}

// Displays a balloon (popup)
    // new Balloon({ title:string, icon:string? }[, ...jobs:object={ href:string=URL, message:string?, src:string?, time:string=Date, onremove:function? }]) -> Object
    // Balloon.prototype.add(...jobs:object={ href:string=URL, message:string?, src:string?, time:string=Date, onremove:function? }) -> Element
    // Balloon.prototype.addButton({ [left:boolean[, icon:string=Glyphs[, onclick:function[, attributes:object]]]] }) -> Element
    // Balloon.prototype.remove() -> undefined
class Balloon {
    static #BALLOONS = new Map()

    constructor({ title, icon = 'play' }, ...jobs) {
        let f = furnish;

        let [P] = $('.top-nav__menu > div', true).slice(-1),
            X = $('#tt-balloon', false, P),
            I = Extension.getURL('profile.png'),
            F, C, H, U, N;

        let uuid = U = UUID.from([title, JSON.stringify(jobs)].join(':')).value,
            existing = Balloon.#BALLOONS.get(title);

        if(defined(existing))
            return existing;

        if(defined(X)) {
            if(!Queue.balloons.map(popup => popup.uuid).contains(uuid)) {
                let interval = setInterval(() => {
                    let existing = $('#tt-balloon');

                    if(defined(existing))
                        return;

                    let { title, icon, jobs, uuid, interval } = Queue.balloons.pop();

                    new Balloon({ title, icon }, ...jobs);

                    clearInterval(interval);
                }, 500);

                Queue.balloons.splice(0, 0, { title, icon, jobs, uuid, interval });
            }

            return;
        }

        let p =
        f('div.tw-align-self-center.tw-flex-grow-0.tw-flex-nowrap.tw-flex-shrink-0.tw-mg-x-05', {},
            f('div', {},
                f('div.tw-relative', {},
                    // Navigation Icon
                    N = f('div',
                        {
                            style: 'display:inherit',

                            'data-test-selector': 'toggle-balloon-wrapper__mouse-enter-detector',
                        },
                        f('div.tw-inline-flex.tw-relative', {},
                            f('button.tw-align-items-center.tw-align-middle.tw-border-bottom-left-radius-medium.tw-border-bottom-right-radius-medium.tw-border-top-left-radius-medium.tw-border-top-right-radius-medium.tw-button-icon.tw-core-button.tw-inline-flex.tw-interactive.tw-justify-content-center.tw-overflow-hidden.tw-relative',
                                {
                                    'connected-to': U,

                                    onclick: event => {
                                        let { currentTarget } = event,
                                            connectedTo = currentTarget.getAttribute('connected-to');

                                        let balloon = $(`#tt-balloon-${ connectedTo }`);

                                        if(!defined(balloon))
                                            return;

                                        let display = balloon.getAttribute('display') === 'block'? 'none': 'block';

                                        balloon.setAttribute('style', `display:${ display }!important`);
                                        balloon.setAttribute('display', display);
                                    },
                                },

                                f('div',
                                    {
                                        style: 'height:2rem; width:2rem',
                                        innerHTML: Glyphs[icon],
                                    }
                                ),

                                // Notification counter
                                F = f(`div#tt-notification-counter--${ U }.tw-absolute.tw-right-0.tw-top-0`, { style: 'visibility:hidden', 'connected-to': U, length: 0 },
                                    f('div.tw-animation.tw-animation--animate.tw-animation--bounce-in.tw-animation--duration-medium.tw-animation--fill-mode-both.tw-animation--timing-ease-in', {
                                            'data-a-target': 'tw-animation-target'
                                        },
                                        f('div.tw-c-background-base.tw-inline-flex.tw-number-badge.tw-relative', {},
                                            f(`div#tt-notification-counter-output--${ U }.tw-c-text-overlay.tw-number-badge__badge.tw-relative`, {
                                                'interval-id': setInterval(() => {
                                                    let counter = $(`#tt-notification-counter--${ uuid }`),
                                                        output = $(`#tt-notification-counter-output--${ uuid }`),
                                                        length = parseInt(counter?.getAttribute('length'));

                                                    if(!defined(counter) || !defined(output))
                                                        return;

                                                    let visibility = counter.getAttribute('style').replace(/[^]+:/, ''),
                                                        interval = parseInt(output.getAttribute('interval-id'));

                                                    output.textContent = length;

                                                    if(length < 1) {
                                                        counter.setAttribute('style', 'visibility:hidden');
                                                    } else {
                                                        counter.setAttribute('style', 'visibility:unset; font-size:75%');
                                                    }
                                                }, 1000),
                                            })
                                        )
                                    )
                                ),
                            )
                        )
                    ),
                    // Balloon
                    f(`div#tt-balloon-${ U }.tw-absolute.tw-balloon.tw-right-0.tw-balloon--down.tw-balloon--right.tw-balloon-lg.tw-block`,
                        {
                            style: 'display:none!important',
                            display: 'none',
                            role: 'dialog',
                        },
                        f('div.tw-border-radius-large.tw-c-background-base.tw-c-text-inherit.tw-elevation-4', {},
                            (C = f(`div#tt-balloon-container-${ U }.tw-flex.tw-flex-column`,
                                {
                                    style: 'min-height:20rem; min-width:40rem;',
                                    role: 'dialog',
                                },
                                // Header
                                f('div.tw-border-top-left-radius-medium.tw-border-top-right-radius-medium.tw-c-text-base.tw-elevation-1.tw-flex.tw-flex-shrink-0.tw-pd-x-1.tw-pd-y-05.tw-popover-header', {},
                                    f('div.tw-align-items-center.tw-flex.tw-flex-column.tw-flex-grow-1.tw-justify-content-center', {},
                                        (H = f(`h5#tt-balloon-header-${ U }.tw-align-center.tw-c-text-alt.tw-semibold`, { style: 'margin-left:4rem!important' }, title))
                                    ),
                                    f('button.tw-align-items-center.tw-align-middle.tw-border-bottom-left-radius-medium.tw-border-bottom-right-radius-medium.tw-border-top-left-radius-medium.tw-border-top-right-radius-medium.tw-button-icon.tw-button-icon--secondary.tw-core-button.tw-flex.tw-flex-column.tw-inline-flex.tw-interactive.tw-justify-content-center.tw-justify-content-center.tw-mg-l-05.tw-overflow-hidden.tw-popover-header__icon-slot--right.tw-relative',
                                        {
                                            style: 'padding:0.5rem!important; height:3rem!important; width:3rem!important',
                                            innerHTML: Glyphs.x,

                                            'connected-to': U,

                                            onclick: event => {
                                                let { currentTarget } = event,
                                                    connectedTo = currentTarget.getAttribute('connected-to');

                                                let balloon = $(`#tt-balloon-${ connectedTo }`);

                                                if(!defined(balloon))
                                                    return;

                                                let display = balloon.getAttribute('display') === 'block'? 'none': 'block';

                                                balloon.setAttribute('style', `display:${ display }!important`);
                                                balloon.setAttribute('display', display);
                                            },
                                        },
                                    )
                                ),
                                // Body
                                ...jobs.map(job => {
                                    let { href, message, subheader, src = I, attributes = {}, onremove = ($=>$), animate = ($=>$) } = job,
                                        guid = guid = UUID.from([href, message].join(':')).value;

                                    let container = f(`div#tt-balloon-job-${ U }--${ guid }`, { ...attributes, uuid, guid, href: parseURL(href).href },
                                        f('div.simplebar-scroll-content',
                                            {
                                                style: 'overflow: hidden;',
                                            },
                                            f('div.simplebar-content',
                                                {
                                                    style: 'overflow: hidden; width:100%;',
                                                },
                                                f('div.tw-align-items-center.tw-flex.tw-flex-column.tw-flex-grow-1.tw-flex-nowrap.tw-overflow-hidden',
                                                    { 'data-test-selector': 'center-window__content' },
                                                    f('div.persistent-notification.tw-relative',
                                                        {
                                                            style: 'width:100%',

                                                            'data-test-selector': 'persistent-notification',
                                                        },
                                                        f('div.persistent-notification__unread.tw-border-b.tw-flex.tw-flex-nowrap', {},
                                                            f('a.tw-block.tw-full-width.tw-interactable.tw-interactable--alpha.tw-interactable--hover-enabled.tw-interactive',
                                                                {
                                                                    'data-test-selector': 'persistent-notification__click',
                                                                    'connected-to': `${ U }--${ guid }`,

                                                                    href,

                                                                    onclick: event => {
                                                                        let { currentTarget } = event,
                                                                            connectedTo = currentTarget.getAttribute('connected-to');

                                                                        let element = $(`#tt-balloon-job-${ connectedTo }`);

                                                                        if(defined(element)) {
                                                                            onremove({ ...event, uuid, guid, href, canceled: false });
                                                                            clearInterval(+element.getAttribute('animationID'));
                                                                            element.remove();
                                                                        }
                                                                    },
                                                                },
                                                                f('div.presistent-notification__area.tw-flex.tw-flex-nowrap.tw-pd-b-1.tw-pd-l-1.tw-pd-r-3.tw-pd-t-1', {},
                                                                    // Avatar
                                                                    f('div', {},
                                                                        f('div.tw-border-radius-rounded.tw-card-img.tw-card-img--size-4.tw-flex-shrink-0.tw-overflow-hidden', {},
                                                                            f('div.tw-aspect.tw-aspect--align-top', {},
                                                                                f('img.tt-balloon-avatar.tw-image', { src })
                                                                            )
                                                                        )
                                                                    ),
                                                                    // Message body
                                                                    f('div.tw-flex.tw-flex-column.tw-flex-nowrap.tw-mg-x-1', {},
                                                                        f('div.persistent-notification__body.tw-overflow-hidden',
                                                                            {
                                                                                'data-test-selector': 'persistent-notification__body'
                                                                            },
                                                                            f('span.tw-c-text-alt', {},
                                                                                f('p.tt-balloon-message', { innerHTML: message })
                                                                            )
                                                                        ),
                                                                        // Subheader
                                                                        f('div.tw-align-items-center.tw-flex.tw-flex-shrink-0.tw-mg-t-05', {},
                                                                            f('div.tw-mg-l-05', {},
                                                                                f('span.tt-balloon-subheader.tw-c-text-alt', { innerHTML: subheader })
                                                                            )
                                                                        )
                                                                    )
                                                                )
                                                            ),
                                                            f('div.persistent-notification__delete.tw-absolute.tw-pd-l-1.tw-pd-r-05.tw-pd-t-1', {},
                                                                f('div.tw-align-items-start.tw-flex.tw-flex-nowrap', {},
                                                                    f('button.tw-align-items-center.tw-align-middle.tw-border-bottom-left-radius-small.tw-border-bottom-right-radius-small.tw-border-top-left-radius-small.tw-border-top-right-radius-small.tw-button-icon.tw-button-icon--small.tw-core-button.tw-core-button--small.tw-inline-flex.tw-interactive.tw-justify-content-center.tw-overflow-hidden.tw-relative',
                                                                        {
                                                                            'data-test-selector': 'persistent-notification__delete',
                                                                            'connected-to': `${ U }--${ guid }`,

                                                                            onclick: event => {
                                                                                let { currentTarget } = event,
                                                                                    connectedTo = currentTarget.getAttribute('connected-to');

                                                                                let element = $(`#tt-balloon-job-${ connectedTo }`);

                                                                                if(defined(element)) {
                                                                                    onremove({ ...event, uuid, guid, href, canceled: true });
                                                                                    clearInterval(+element.getAttribute('animationID'));
                                                                                    element.remove();
                                                                                }
                                                                            },
                                                                        },
                                                                        f('span.tw-button-icon__icon', {},
                                                                            f('div',
                                                                                {
                                                                                    style: 'height:1.6rem; width:1.6rem',
                                                                                    innerHTML: Glyphs.x,
                                                                                },
                                                                            )
                                                                        )
                                                                    )
                                                                )
                                                            )
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    );

                                    container.setAttribute('animationID', animate(container));

                                    return container;
                                })
                            ))
                            // Container
                        )
                    )
                )
            )
        );

        P.insertBefore(p, P.children[1]);

        this.body = C;
        this.icon = N;
        this.uuid = U;
        this.header = H;
        this.parent = P;
        this.counter = F;
        this.container = p;

        let cssName = title.replace(/\s+/g, '-').toLowerCase();

        for(let key of 'body icon header parent container'.split(' '))
            this[key].setAttribute(`${ cssName }--${ key }`, (+new Date).toString(36));

        this.tooltip = furnish('div.tw-tooltip.tw-tooltip--align-center.tw-tooltip--down', { id: `balloon-tooltip-for-${ U }`, role: 'tooltip' }, this.title = title);

        Balloon.#BALLOONS.set(title, this);

        return this;
    }

    addButton({ left = false, icon = 'play', onclick = ($=>$), attributes = {} }) {
        let parent = this.header.closest('div[class*="header"]');
        let uuid = UUID.from(onclick.toString()).value,
            existing = $(`[uuid="${ uuid }"i]`, false, parent);

        if(defined(existing))
            return existing;

        let button = furnish('button.tw-align-items-center.tw-align-middle.tw-border-bottom-left-radius-medium.tw-border-bottom-right-radius-medium.tw-border-top-left-radius-medium.tw-border-top-right-radius-medium.tw-button-icon.tw-button-icon--secondary.tw-core-button.tw-flex.tw-flex-column.tw-inline-flex.tw-interactive.tw-justify-content-center.tw-justify-content-center.tw-mg-l-05.tw-overflow-hidden.tw-popover-header__icon-slot--right.tw-relative',
            {
                ...attributes,

                uuid,
                onclick,

                style: 'padding:0.5rem!important; height:3rem!important; width:3rem!important;',
                innerHTML: Glyphs[icon],

                'connected-to': this.uuid,
            },
        );

        if(left)
            parent.insertBefore(button, parent.firstElementChild);
        else
            parent.insertBefore(button, parent.lastElementChild);

        return button;
    }

    remove() {
        this.container?.remove();
        Balloon.#BALLOONS.delete(this.title);
    }

    add(...jobs) {
        jobs = jobs.map(job => {
            let { href, message, subheader, src = Extension.getURL('profile.png'), attributes = {}, onremove = ($=>$), animate = ($=>$) } = job,
                { uuid } = this,
                guid = UUID.from(href).value,
                f = furnish;

            let existing = $(`#tt-balloon-job-${ uuid }--${ guid }`);

            if(defined(existing))
                return existing;

            ++this.length;

            let container = f(`div#tt-balloon-job-${ uuid }--${ guid }`, { ...attributes, uuid, guid, href: parseURL(href).href },
                f('div.simplebar-scroll-content',
                    {
                        style: 'overflow: hidden;',
                    },
                    f('div.simplebar-content',
                        {
                            style: 'overflow: hidden; width:100%;',
                        },
                        f('div.tw-align-items-center.tw-flex.tw-flex-column.tw-flex-grow-1.tw-flex-nowrap.tw-overflow-hidden',
                            { 'data-test-selector': 'center-window__content' },
                            f('div.persistent-notification.tw-relative',
                                {
                                    style: 'width:100%',

                                    'data-test-selector': 'persistent-notification',
                                },
                                f('div.persistent-notification__unread.tw-border-b.tw-flex.tw-flex-nowrap', {},
                                    f('a.tw-block.tw-full-width.tw-interactable.tw-interactable--alpha.tw-interactable--hover-enabled.tw-interactive',
                                        {
                                            'data-test-selector': 'persistent-notification__click',
                                            'connected-to': `${ uuid }--${ guid }`,

                                            href,

                                            onclick: event => {
                                                let { currentTarget } = event,
                                                    connectedTo = currentTarget.getAttribute('connected-to');

                                                let element = $(`#tt-balloon-job-${ connectedTo }`);

                                                if(defined(element)) {
                                                    onremove({ ...event, uuid, guid, href, canceled: false });
                                                    clearInterval(+element.getAttribute('animationID'));
                                                    element.remove();
                                                }
                                            },
                                        },
                                        f('div.presistent-notification__area.tw-flex.tw-flex-nowrap.tw-pd-b-1.tw-pd-l-1.tw-pd-r-3.tw-pd-t-1', {},
                                            // Avatar
                                            f('div', {},
                                                f('div.tw-border-radius-rounded.tw-card-img.tw-card-img--size-4.tw-flex-shrink-0.tw-overflow-hidden', {},
                                                    f('div.tw-aspect.tw-aspect--align-top', {},
                                                        f('img.tt-balloon-avatar.tw-image', { src })
                                                    )
                                                )
                                            ),
                                            // Message body
                                            f('div.tw-flex.tw-flex-column.tw-flex-nowrap.tw-mg-x-1', {},
                                                f('div.persistent-notification__body.tw-overflow-hidden',
                                                    {
                                                        'data-test-selector': 'persistent-notification__body'
                                                    },
                                                    f('span.tw-c-text-alt', {},
                                                        f('p.tt-balloon-message', { innerHTML: message })
                                                    )
                                                ),
                                                // Subheader
                                                f('div.tw-align-items-center.tw-flex.tw-flex-shrink-0.tw-mg-t-05', {},
                                                    f('div.tw-mg-l-05', {},
                                                        f('span.tt-balloon-subheader.tw-c-text-alt', { innerHTML: subheader })
                                                    )
                                                )
                                            )
                                        )
                                    ),
                                    f('div.persistent-notification__delete.tw-absolute.tw-pd-l-1.tw-pd-r-05.tw-pd-t-1', {},
                                        f('div.tw-align-items-start.tw-flex.tw-flex-nowrap', {},
                                            f('button.tw-align-items-center.tw-align-middle.tw-border-bottom-left-radius-small.tw-border-bottom-right-radius-small.tw-border-top-left-radius-small.tw-border-top-right-radius-small.tw-button-icon.tw-button-icon--small.tw-core-button.tw-core-button--small.tw-inline-flex.tw-interactive.tw-justify-content-center.tw-overflow-hidden.tw-relative',
                                                {
                                                    'data-test-selector': 'persistent-notification__delete',
                                                    'connected-to': `${ uuid }--${ guid }`,

                                                    onclick: event => {
                                                        let { currentTarget } = event,
                                                            connectedTo = currentTarget.getAttribute('connected-to');

                                                        let element = $(`#tt-balloon-job-${ connectedTo }`);

                                                        if(defined(element)) {
                                                            onremove({ ...event, uuid, guid, href, canceled: true });
                                                            clearInterval(+element.getAttribute('animationID'));
                                                            element.remove();
                                                        }
                                                    },
                                                },
                                                f('span.tw-button-icon__icon', {},
                                                    f('div',
                                                        {
                                                            style: 'height:1.6rem; width:1.6rem',
                                                            innerHTML: Glyphs.x,
                                                        },
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            );

            container.setAttribute('animationID', animate(container));

            this.body.appendChild(container);

            return container;
        });

        return jobs;
    }

    static get(title) {
        return Balloon.#BALLOONS.get(title);
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
            uuid = UUID.from(text).value;

        tooltip.id = uuid;

        parent.addEventListener('mouseenter', event => {
            let { currentTarget } = event,
                offset = getOffset(currentTarget),
                screen = getOffset(document.body),
                fineTuning = JSON.parse(currentTarget.getAttribute('fine-tuning'));

            let direction = fineTuning.direction.replace(/^[^]+--(up|down|left|right)$/i, '$1').toLowerCase();

            $('div#root > *').appendChild(
                furnish('div.tt-tooltip-layer.tooltip-layer',
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
                    furnish('div', { 'aria-describedby': tooltip.id, 'class': 'tw-inline-flex tw-relative tw-tooltip-wrapper--show' },
                        furnish('div', { style: `width: ${ offset.width }px; height: ${ offset.height }px;` }),
                        tooltip
                    )
                )
            );

            tooltip.setAttribute('style', `display:block;${ fineTuning.style ?? '' }`);
        });

        parent.addEventListener('mouseleave', event => {
            $('div#root .tt-tooltip-layer.tooltip-layer')?.remove();

            tooltip?.setAttribute('style', 'display:none');
        });

        Tooltip.#TOOLTIPS.set(parent, tooltip);

        return tooltip;
    }

    static get(container) {
        return Tooltip.#TOOLTIPS.get(container);
    }
}

// Creates a Twitch-style chat footer
    // new ChatFooter(title:string[, options:object]) -> Element~ChatFooter
class ChatFooter {
    static #FOOTERS = new Map()
    static #FOOTER_TIMEOUT = -1

    constructor(title, options = {}) {
        let f = furnish;

        let uuid = UUID.from(title).value,
            existing = ChatFooter.#FOOTERS.get(title);

        if(defined(existing))
            return existing;

        let parent = $('[data-a-target="chat-scroller"]'),
            footer =
            f('div#tt-chat-footer.tw-absolute.tw-border-radius-medium.tw-bottom-0.tw-c-text-overlay.tw-mg-b-1',
                {
                    uuid,

                    style:
                    `
                    background-color: #387aff;
                    left: 50%;
                    margin-bottom: 5rem!important;
                    transform: translateX(-50%);
                    width: fit-content;
                    `
                },

                f('button.tw-align-items-center tw-align-middle tw-border-bottom-left-radius-medium tw-border-bottom-right-radius-medium tw-border-top-left-radius-medium tw-border-top-right-radius-medium tw-core-button tw-core-button--overlay tw-core-button--text tw-inline-flex tw-interactive tw-justify-content-center tw-overflow-hidden tw-relative', { style: 'padding: 0.5rem 1rem;', ...options },
                    f('div.tw-align-items-center.tw-core-button-label.tw-flex.tw-flex-grow-0', {},
                        f('div.tw-flex-grow-0', {
                            innerHTML: title
                        })
                    )
                )
            );

        parent.appendChild(footer);

        this.uuid = uuid;
        this.parent = parent;
        this.container = footer;

        clearTimeout(ChatFooter.#FOOTER_TIMEOUT);

        ChatFooter.#FOOTER_TIMEOUT = setTimeout(() => this?.container?.remove(), 15_000);

        return this;
    }

    remove() {
        if(this.container)
            this.container.remove();
    }

    static get(title) {
        return ChatFooter.#FOOTERS.get(title);
    }
}

// Creates a Twitch-style card
    // new Card({ title:string[, subtitle:string[, fineTuning:object]] }) -> Element~Card
class Card {
    static #CARDS = new Map()

    constructor({ title, subtitle = "", footer, icon, fineTuning = {} }) {
        fineTuning.top ??= '7rem';
        fineTuning.left ??= '0px';
        fineTuning.cursor ??= 'auto';

        let styling = [];

        for(let key in fineTuning) {
            let [value, unit] = (fineTuning[key] ?? "").toString().split(/([\-\+]?[\d\.]+)(\D+)/).filter(string => string.length);

            if(!defined(value))
                continue;

            if(parseFloat(value) > -Infinity)
                unit ??= "px";
            else
                unit ??= "";

            styling.push(`${key}:${value}${unit}`);
        }

        styling = styling.join(';');

        let f = furnish;

        let container = $('[data-a-target*="card"i] [class*="card-layer"]'),
            card = f(`div.tw-absolute.tw-border-radius-large.viewer-card-layer__draggable[data-a-target="viewer-card-positioner"]`, { style: styling }),
            uuid = UUID.from([title, subtitle].join('\n')).value;

        icon ??= { src: Extension.getURL('profile.png'), alt: 'Profile' };

        card.id = uuid;

        // Remove current cards. Only one allowed at a time
        [...container.children].forEach(child => child.remove());

        // Furnish the card
        let iconElement = f('img.emote-card__big-emote.tw-image[data-test-selector="big-emote"]', { ...icon });

        card.append(
            f('div.emote-card.tw-border-b.tw-border-l.tw-border-r.tw-border-radius-large.tw-border-t.tw-elevation-1 [data-a-target="emote-card"]', {},
                f('div.emote-card__banner.tw-align-center.tw-align-items-center.tw-c-background-alt.tw-flex.tw-flex-grow-2.tw-flex-row.tw-full-width.tw-justify-content-start.tw-pd-l-1.tw-pd-y-1.tw-relative', {},
                    f('div.tw-inline-flex.viewer-card-drag-cancel', {},
                        f('div.tw-inline.tw-relative.tw-tooltip__container[data-a-target="emote-name"]', {},
                            iconElement,
                            new Tooltip(iconElement, icon.alt)
                        )
                    ),
                    f('div.emote-card__display-name.tw-align-items-center.tw-align-left.tw-ellipsis.tw-mg-1', {},
                        f('h4.tw-c-text-base.tw-ellipsis.tw-strong[data-test-selector="emote-code-header"]', {}, title),
                        f('p.tw-c-text-alt-2.tw-ellipsis.tw-font-size-6[data-test-selector="emote-type-copy"]', {}, subtitle)
                    )
                )
            ),
            f('div.tw-absolute.tw-mg-r-05.tw-mg-t-05.tw-right-0.tw-top-0[data-a-target="viewer-card-close-button"]',
                {
                    onmouseup: event => {
                        $('[data-a-target*="card"i] [class*="card-layer"] > *', true).forEach(node => node.remove());
                    },
                },
                f('div.tw-inline-flex.viewer-card-drag-cancel', {},
                    f('button.tw-button-icon.tw-button-icon--secondary.tw-core-button[aria-label="Hide"][data-test-selector="close-viewer-card"]', {},
                        f('span.tw-button-icon__icon', {},
                            f('div[style="width: 2rem; height: 2rem;"]', {},
                                f('div.tw-icon', {},
                                    f('div.tw-aspect', { innerHTML: Glyphs.modify('x', { height: '20px', width: '20px' }) })
                                )
                            )
                        )
                    ),
                )
            )
        );

        // Add the card
        container.appendChild(card);

        // Add the optional footer
        if(footer?.href?.length)
            $('div', false, card).append(
                f('div.emote-card__content.tw-c-background-base.tw-full-width.tw-inline-flex.tw-pd-1.viewer-card-drag-cancel', {},
                    f('div', {},
                        f('div.tw-align-items-center.tw-align-self-start.tw-mg-b-05', {},
                            f('div.tw-align-items-center.tw-flex', {},
                                f('div.tw-align-items-center.tw-flex.tw-mg-r-1', {},
                                    f('a.tw-link [rel="noopener noreferrer" target="_blank"]', { href: footer.href },
                                        f('div.tw-flex', {
                                            innerHTML: ""
                                                + Glyphs.modify('video', { height: '20px', width: '20px' })
                                                + f('div.tw-mg-l-05', {},
                                                    f('p.tw-c-text-link.tw-font-size-5.tw-strong', {}, footer.name)
                                                ).outerHTML
                                        })
                                    )
                                ),
                                f('div.tw-align-items-center.tw-flex', {},
                                    f(`div[tt-live-status-indicator="${ parseBool(footer.live) }"]`),
                                    f('div.tw-flex.tw-mg-l-05', {},
                                        f('p.tw-c-text-base.tw-font-size-6', { style: 'text-transform:uppercase' },
                                            ['offline', 'live'][+footer.live]
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            );

        this.body = card;
        this.icon = iconElement;
        this.uuid = uuid;
        this.footer = footer;
        this.container = container;

        Card.#CARDS.set(title, this);

        return this;
    }

    remove() {
        this.container?.remove();
        Card.#CARDS.delete(this.title);
    }

    static get(title) {
        return Card.#CARDS.get(title);
    }
}

// Search Twitch for channels/categories
    // new Search([query:string[, maximum:integer[, type:string="channels"|"categories"[, OVER_RIDE_CACHE:boolean]]]])
/** Returns an Array of Objects ->
 * broadcaster_language: String~I18N-Language
 * broadcaster_login: String
 * display_name: String
 * game_id: String~Integer
 * id: String~Integer
 * is_live: Boolean
 * started_at: String~Date
 * tag_ids: Array:String
 * thumbnail_url: String~URL
 * title: String:Unicode16
 */
class Search {
    static #TOKENS = JSON.parse(atob("WyJ2MnNnZWN5NWJ3eDNmc3pyYmpscm92OWtpYTVyMjkiLCJraW1uZTc4a3gzbmN4NmJyZ280bXY2d2tpNWgxa28iXQ=="))
    static #CACHE = new Map()

    constructor(query = "", maximum = 15, type = "channels", OVER_RIDE_CACHE = false) {
        let [bearer, clientID] = Search.#TOKENS,
            token = UUID.from(Object.values({ query, maximum, type }).join('|')).value;

        if(!query?.length)
            return;
        if(!parseBool(OVER_RIDE_CACHE) && Search.#CACHE.has(token))
            return new Promise((resolve, reject) => resolve(Search.#CACHE.get(token)));

        return fetch(`https://api.twitch.tv/helix/search/${ type }?first=${ maximum }&query=${ query }`, { headers: { 'Authorization': `Bearer ${ bearer }`, 'Client-ID': clientID, } })
            .then(response => response.json())
            .then(json => {
                Search.#CACHE.set(token, json);

                return json;
            })
            .catch(WARN);
    }
}

// https://stackoverflow.com/a/45205645/4211612
// Creates a CSS object that can be used to easily transform an object to a CSS string
    // new CSSObject({ ...css-properties }) -> Object~CSSObject
class CSSObject {
    constructor(properties = {}) {
        for(let key in properties)
            this[key] = properties[key];

        return this;
    }

    toString() {
        return Object.entries(this).map(([key, value]) => {
            key = key.replace(/([A-Z])/g, ($0, $1, $$, $_) => '-' + $1.toLowerCase());

            return [key, value].join(':');
        })
        .join(';');
    }

    toObject() {
        let object = {};

        for(let key in this) {
            let properKey = key.replace(/([A-Z])/g, ($0, $1, $$, $_) => '-' + $1.toLowerCase());

            object[properKey] = this[key];
        }

        return object;
    }
}

// Get the current settings
    // GetSettings() -> Object
function GetSettings() {
    return new Promise((resolve, reject) => {
        function ParseSettings(settings) {
            for(let setting in settings)
                settings[setting] ??= null;

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
    let set = (key, value) => StorageSpace.setItem(`ext.twitch-tools/${ encodeURI(key) }`, value);

    for(let key in keys)
        set(key, JSON.stringify(keys[key]));

    if(typeof callback == 'function')
        callback();
}

// Loads data from the page's storage
    // LoadCache(keys:string|array|object[, callback:function]) -> undefined
async function LoadCache(keys = null, callback = () => {}) {
    let results = {},
        get = key => {
            let value =
                // New save name
                StorageSpace.getItem(`ext.twitch-tools/${ encodeURI(key) }`);
                // Old save name
                // if (value === undefined)
                //     value = StorageSpace.getItem(key);

            try {
                value = JSON.parse(value);
            } catch(error) {
                value = value;
            }

            return value;
        };

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
                results[key] = get(key) ?? keys[key];
            break;

        default: return;
    }

    if(typeof callback == 'function')
        callback(results);
}

// Removes data from the page's storage
    // RemoveCache(keys:string|array[, callback:function])
async function RemoveCache(keys, callback = () => {}) {
    let remove = key => StorageSpace.removeItem(`ext.twitch-tools/${ encodeURI(key) }`);

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

    if(typeof callback == 'function')
        callback();
}

// Create an object of the current chat
    // GetChat([lines:number[, keepEmotes:boolean]]) -> Object { style, author, emotes, message, mentions, element, uuid, highlighted }
function GetChat(lines = 30, keepEmotes = false) {
    let chat = $('[data-test-selector$="message-container"i] [data-a-target="chat-line-message"i]', true).slice(-lines),
        emotes = {},
        results = [];

    for(let line of chat) {
        let handle = $('.chat-line__username', true, line).map(element => element.innerText).toString()
            author = handle.toLowerCase(),
            message = $('[data-test-selector="chat-message-separator"i] ~ *', true, line),
            mentions = $('.mention-fragment', true, line).map(element => element.innerText.replace('@', '').toLowerCase()).filter(text => /^[a-z_]\w+$/i.test(text)),
            badges = $('.chat-badge', true, line).map(img => img.alt.toLowerCase()),
            style = $('.chat-line__username [style]', true, line).map(element => element.getAttribute('style')).join(';'),
            reply = $('button[data-test-selector="chat-reply-button"i]', false, line);

        let raw = line.innerText?.trim(),
            containedEmotes = [];

        message = message
            .map(element => {
                let string;

                if(keepEmotes && ((element.dataset.testSelector == 'emote-button') || element.dataset.ttEmote)) {
                    let img = $('img', false, element);

                    if(defined(img))
                        containedEmotes.push(string = `:${ (i=>((emotes[i.alt]=i.src),i.alt))(img) }:`);
                } else {
                    string = element.innerText;
                }

                return string;
            })
            .filter(defined)
            .join(' ')
            .trim()
            .replace(/(\s){2,}/g, '$1');

        style = style
            .replace(/\brgba?\(([\d\s,]+)\)/i, ($0, $1, $$, $_) => '#' + $1.split(',').map(color => (+color.trim()).toString(16).padStart(2, '00')).join(''));

        let uuid = UUID.from([author, mentions.join(','), message].join(':')).value;

        if(defined(results.find(message => message.uuid == uuid)))
            continue;

        results.push({
            raw,
            uuid,
            reply,
            style,
            author,
            badges,
            handle,
            message,
            mentions,
            element: line,
            emotes: [...new Set(containedEmotes.map(string => string.replace(/^:|:$/g, '')))],
            deleted: defined($('[class*="--deleted-notice"i]', false, line)),
            highlighted: !!(line.classList.value.split(' ').filter(value => /^chat-line--/i.test(value)).length),
        });
    }

    let bullets = $('[role="log"i] .tw-accent-region, [role="log"i] [data-test-selector="user-notice-line"i], [role="log"i] [class*="gift"i]', true).slice(-lines);

    results.bullets = [];

    for(let bullet of bullets) {
        let message = $('[data-test-selector="chat-message-separator"i] ~ *', true, bullet),
            mentions = $('.chatter-name, strong', true, bullet).map(element => element.innerText.toLowerCase()).filter(text => /^[a-z_]\w+$/i.test(text)),
            subject = (text =>
                /\braid/i.test(text)?                'raid': // Incoming raid
                /\bredeem/i.test(text)?              'cash': // Redeeming (spending) channel points
                /\bcontinu/i.test(text)?             'keep': // Continuing a gifted subscription
                /\bgift/i.test(text)?                'gift': // Gifting a subscription
                /\b(re)?subs|\bconvert/i.test(text)? 'dues': // New subscription, continued subscription, or converted subscription
                null                                         // No subject
            )($('*:first-child', false, bullet)?.textContent);

        if(!defined(subject) && message.length < 1)
            continue;

        let raw = bullet.innerText?.trim();

        message = message
            .map(element => {
                let string;

                switch(element.dataset.testSelector) {
                    case 'emote-button':
                        if(keepEmotes)
                            string = `:${ (i=>((emotes[i.alt]=i.src),i.alt))($('img', false, element)) }:`;
                        break;

                    default:
                        string = element.innerText;
                        break;
                }

                return string;
            })
            .filter(defined)
            .join(' ')
            .trim()
            .replace(/(\s){2,}/g, '$1');

        let uuid = UUID.from([subject, mentions.join(','), message].join(':')).value;

        if(defined(results.bullets.find(bullet => bullet.uuid == uuid)))
            continue;

        results.bullets.push({
            raw,
            uuid,
            subject,
            message,
            mentions,
            element: bullet,
        });
    }

    results.emotes = emotes;

    return results;
}

// Listener for new chat messages
Object.defineProperties(GetChat, {
    onnewmessage: {
        set(callback) {
            let name = callback.name || UUID.from(callback.toString()).value;

            if(GetChat.__onnewmessage__.has(name))
                return GetChat.__onnewmessage__.get(name);

            // REMARK('Adding [on new message] event listener', { [name]: callback });

            GetChat.__onnewmessage__.set(name, callback);

            return callback;
        },

        get() {
            return GetChat.__onnewmessage__.size;
        },
    },
    __onnewmessage__: { value: new Map() },

    onwhisper: {
        set(callback) {
            let name = callback.name || UUID.from(callback.toString()).value;

            if(GetChat.__onwhisper__.has(name))
                return GetChat.__onwhisper__.get(name);

            // REMARK('Adding [on new whisper] event listener', { [name]: callback });

            return GetChat.__onwhisper__.set(name, callback);
        },

        get() {
            return GetChat.__onwhisper__.size;
        },
    },
    __onwhisper__: { value: new Map() },
});

// Pushes parameters to the URL's search
    // PushToTopSearch(newParameters:object[, reload:boolean]) -> String#URL.Search
function PushToTopSearch(newParameters, reload = true) {
    let { searchParameters } = parseURL(location),
        parameters = { ...searchParameters, ...newParameters };

    let search = [];
    for(let parameter in parameters)
        search.push(`${parameter}=${parameters[parameter]}`);
    search = '?' + search.join('&');

    return reload?
        location.search = search:
    search;
}

// Removevs parameters from the URL's search
    // RemoveFromTopSearch(keys:array[, reload:boolean]) -> String#URL.Search
function RemoveFromTopSearch(keys, reload = true) {
    let { searchParameters } = parseURL(location),
        parameters = { ...searchParameters };

    let search = [];
    for(let parameter in parameters)
        if(!keys.contains(parameter))
            search.push(`${parameter}=${parameters[parameter]}`);
    search = '?' + search.join('&');

    return reload?
        location.search = search:
    search;
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

// Create elements
    // furnish(tagname:string[, attributes:object[, ...children]]) -> Element
function furnish(TAGNAME, ATTRIBUTES = {}, ...CHILDREN) {
    let u = v => v && v.length,
        R = RegExp,
        name = TAGNAME,
        attributes = ATTRIBUTES,
        children = CHILDREN;

    if( !u(name) )
        throw TypeError(`TAGNAME cannot be ${ (name === '')? 'unknown': name }`);

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
        .forEach( child => element.append(child) );

    return element;
}

// Gets the X and Y offset (in pixels)
    // getOffset(element:Element) -> Object={ left:number, top:number }
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

// Convert milliseconds into a human-readable string
    // ConvertTime([milliseconds:number[, format:string]]) -> String
function ConvertTime(milliseconds = 0, format = 'natural') {
    let second = 1000,
        minute = 60 * second,
        hour   = 60 * minute,
        day    = 24 * hour,
        year   = 365 * day;

    let time = [],
        times = [
            ['year'  ,   year],
            ['day'   ,    day],
            ['hour'  ,   hour],
            ['minute', minute],
            ['second', second],
        ],
        result;

    let joining_symbol = ' ';

    switch(format) {
        case 'natural':
            for(let [name, value] of times)
                if(milliseconds >= value) {
                    let amount = (milliseconds / value) | 0;

                    time.push(`${ amount } ${ name.pluralSuffix(amount) }`);

                    milliseconds -= amount * value;
                }

            if(time.length > 1)
                time.splice(-1, 0, 'and');

            result = time;
            break;

        case 'clock':
            format = '!hour:!minute:!second';

        default:
            joining_symbol = '';

            for(let [name, value] of times)
                if(milliseconds >= value) {
                    let amount = (milliseconds / value) | 0;

                    time.push(time[name] = (amount + '').padStart(2, '00'));

                    milliseconds -= amount * value;
                }

            times.push(['millisecond', milliseconds]);

            result = format.split(/\!(year|day|hour|minute|(?:milli)?second)s?\b/g)
                .map($1 => {
                    for(let [name, value] of times)
                        if($1 == 'millisecond')
                            return milliseconds;
                        else if($1 == name)
                            return time[name] ?? '00';

                    return $1;
                })
            break;
    }

    return result.join(joining_symbol);
}

// Convert a time-formatted string into its corresponding millisecond value
    // parseTime([time:string]) -> Number
function parseTime(time = '') {
    let units = [1000, 60, 60, 24, 365].map((unit, index, array) => (array.slice(0, index).map(u => unit *= u), unit)),
        ms = 0;

    for(let unit of time.split(':').reverse())
        ms += parseInt(unit) * units.splice(0,1)[0];

    return ms;
}

// Convert an SI number into a number
    // parseCoin(amount:string) -> Number
function parseCoin(amount = '') {
    let points = 0,
        COIN, UNIT;

    amount = (amount + "").replace(/([\d\.,]+)\s*([kMBT])?/i, ($0, $1, $2, $$, $_) => {
        COIN = $1.replace(/,+/g, '');
        UNIT = ($2 ?? '').toUpperCase();
    });

    for(let index = 0, units = ['', 'K', 'M', 'B', 'T']; index < units.length; index++)
        if(units[index] == UNIT)
            points = parseFloat(COIN) * (1e3 ** index);

    return points;
}

// Convert boolean values
    // parseBool(*:value) -> Boolean
function parseBool(value = null) {
    switch(value) {
        case "undefined":
        case undefined:
        case "false":
        case "null":
        case false:
        case null:
        case "[]":
        case "{}":
        case "0":
        case "":
        case []:
        case {}:
        case 0:
            return false;

        default:
            return (["bigint", "number"].contains(typeof value)? !isNaN(value): true);
    }
}

// Get the video quality
    // GetQuality() -> String={ auto:boolean, high:boolean, low:boolean, source:boolean }
async function GetQuality() {
    let buttons = {
        get settings() {
            return $('[data-a-target="player-settings-button"i]');
        },

        get quality() {
            return $('[data-a-target$="-item-quality"i]');
        },

        get options() {
            return $('[data-a-target$="-quality-option"i]');
        },
    };

    await(async() => {
        let { settings, quality, options } = buttons;

        if(quality === null && options === null)
            try {
                settings?.click();
            } catch(error) {
                throw error;
            };
    })()
    .then(() => {
        let { quality } = buttons;

        if(quality)
            quality.click();
    })
    .catch(error => {
        throw error;
    });

    let qualities = $('[data-a-target$="-quality-option"i] input[type="radio"i]', true)
        .map(input => ({ input, label: input.nextElementSibling, uuid: input.id }));

    let textOf = text => (text?.textContent ?? text?.value ?? text);

    let current = qualities.find(({ input }) => input.checked);

    if(!defined(current)) {
        let { videoHeight } = $('[data-a-target="video-player"] video');

        if((videoHeight |= 0) < 1)
            return /* Is the streamer even live? */;

        // Assume ALL streams are progressive, HTML does not support interlaced video
        current = ({ label: { textContent: `${ videoHeight }p` } });
    }

    let quality = new String(current.label.textContent);

    let source = current.uuid == qualities.find(({ label }) => /source/i.test(textOf(label)))?.uuid,
        auto   = current.uuid == qualities.find(({ label }) => /auto/i.test(textOf(label)))?.uuid,
        high   = current.uuid == qualities.find(({ label }) => !/auto|source/i.test(textOf(label)))?.uuid,
        low    = current.uuid == qualities[qualities.length - 1]?.uuid;

    Object.defineProperties(quality, {
        auto:   { value: auto },
        high:   { value: high },
        low:    { value: low },
        source: { value: source },
    });

    if(defined(buttons.options))
        buttons.settings.click();

    return quality;
}

// Change the video quality
    // SetQuality([quality:string[, backup:string]]) -> Object#{ __old__:Object={ input:Element, label:Element }, __new__:Object={ input:Element, label:Element } }
async function SetQuality(quality = 'auto', backup = 'source') {
    let buttons = {
        get settings() {
            return $('[data-a-target="player-settings-button"i]');
        },

        get quality() {
            return $('[data-a-target$="-item-quality"i]');
        },

        get options() {
            return $('[data-a-target$="-quality-option"i]');
        },
    };

    await(async() => {
        let { settings, quality, options } = buttons;

        if(quality === null && options === null)
            try {
                settings?.click();
            } catch(error) {
                throw error;
            };
    })()
    .then(() => {
        let { quality } = buttons;

        if(quality)
            quality.click();
    })
    .catch(error => {
        throw error;
    });

    let qualities = $('[data-a-target$="-quality-option"i] input[type="radio"i]', true)
        .map(input => ({ input, label: input.nextElementSibling, uuid: input.id }));

    let textOf = text => (text?.textContent ?? text?.value ?? text);

    qualities.source = qualities.find(({ label }) => /source/i.test(textOf(label)));
    qualities.auto   = qualities.find(({ label }) => /auto/i.test(textOf(label)));
    qualities.high   = qualities.find(({ label }) => !/auto|source/i.test(textOf(label)));
    qualities.low    = qualities[qualities.length - 1];

    let current = qualities.find(({ input }) => input.checked),
        desired;

    if(/(auto|high|low|source)/i.test(quality))
        desired = qualities[RegExp.$1];
    else
        desired = qualities.find(({ label }) => textOf(label).indexOf(quality.toLowerCase())) ?? null;

    if(!defined(desired))
        /* The desired quality does not exist */
        desired = qualities.auto;
    else if(current?.uuid === desired?.uuid)
        /* Already on desired quality */
        /* Do nothing */;
    else
        /* The desired quality is available */
        current.input.checked = !(desired.input.checked = !0);

    desired?.input?.click?.();

    if(defined(buttons.options))
        buttons.settings.click();

    return { __old__: current, __new__: desired };
}

// Returns if an item is of an object class
    // isObj([object:*[, ...or:Function=Constructor]]) -> Boolean
function isObj(object, ...or) {
    return !![Object, Array, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, Map, Set, ...or]
        .find(constructor => object?.constructor === constructor || object instanceof constructor);
}

// Returns a number formatted with commas
function comify(number) {
    let [,decimalPlaces] = (number + '').split('.', 2);

    decimalPlaces ||= "";

    number = parseFloat(number).toFixed(decimalPlaces.length);

    return (number + '')
        .split('')
        .reverse()
        .join('')
        .replace(/(\d{3})/g, '$1,')
        .split('')
        .reverse()
        .join('')
        .replace(/^,+|,+$/g, '')
};

let DefaultFill = ({
    dark: '#ffffff',
    light: '#0e0e10',
})[THEME];

// Import the glyphs
let { Glyphs } = top;

// Returns ordinal numbers
    // nth(n:number) -> string
let nth = n => (n + '')
    .replace(/(1[123])$/, '$1th')
    .replace(/1$/, '1st')
    .replace(/2$/, '2nd')
    .replace(/3$/, '3rd')
    .replace(/(\d)$/, '$1th');

// Returns a unique list of channels (used with `Array..filter`)
    // uniqueChannels(channel:object#Channel, index:number, channels:array) -> boolean
let uniqueChannels = (channel, index, channels) =>
    channels.filter(channel => defined(channel?.name)).findIndex(ch => ch.name === channel?.name) == index;

// Returns whether or not a channel is live (used with `Array..filter`)
    // isLive(channel:object#Channel) -> boolean
let isLive = channel => channel?.live;

// Update common variables
let PATHNAME = top.location.pathname,
    // The current streamer
    STREAMER,
    // The followed streamers (excluding STREAMER)
    STREAMERS,
    // All channels on the side-panel (excluding STREAMER)
    CHANNELS,
    // The currently searched-for channels (excluding STREAMER)
    SEARCH,
    // Visible, actionable notifications
    NOTIFICATIONS,
    // All of the above
    ALL_CHANNELS;

let __ONLOCATIONCHANGE__ = new Map;

// Yes, I could make this fail go away... or I can use it to force once-a-page events...
// The following will only execute in the top frame, once
try {
    // Add onlocationchange containers
    Object.defineProperties(top, {
        onlocationchange: {
            get() {
                let last;

                for(let key of __ONLOCATIONCHANGE__)
                    last = key;

                return __ONLOCATIONCHANGE__.get(last);
            },

            set(listener) {
                __ONLOCATIONCHANGE__.set(UUID.from(listener.toString()).value, listener);

                return listener;
            }
        }
    });

    // Automatic garbage collection...
    REMARK(`Removing expired cache data...`);
    for(let key in StorageSpace) {
        if(!/^ext\.twitch-tools\/data\/(\w+)?/i.test(key))
            continue;

        let data = JSON.parse(StorageSpace[key]),
            { dataRetrievedAt } = data;

        // If there isn't a proper date, remove the data...
        if(+dataRetrievedAt < 0) {
            StorageSpace.removeItem(key);

            continue;
        }

        let lastFetch = Math.abs(dataRetrievedAt - +new Date);

        // If the last fetch was more than 30 days ago, remove the data...
        if(lastFetch > (30 * 24 * 60 * 60 * 1000)) {
            WARN(`\tThe last fetch for "${ RegExp.$1 }" was ${ ConvertTime(lastFetch) } ago. Marking as "expried"`);

            StorageSpace.removeItem(key);
        }
    }

    // Add storage listener
    Storage.onChanged.addListener((changes, namespace) => {
        let reload = false,
            refresh = [];

        for(let key in changes) {
            if(SPECIAL_MODE && !!~NORMALIZED_FEATURES.findIndex(feature => feature.test(key)))
                continue;

            let change = changes[key],
                { oldValue, newValue } = change;

            let name = key.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['',' '][+!!$1] + $2.toUpperCase());

            if(newValue === false) {

                if(!!~EXPERIMENTAL_FEATURES.findIndex(feature => feature.test(key)))
                    WARN(`Disabling experimental feature: ${ name }`, new Date);
                else
                    REMARK(`Disabling feature: ${ name }`, new Date);

                UnregisterJob(key, 'disable');
            } else if(newValue === true) {

                if(!!~EXPERIMENTAL_FEATURES.findIndex(feature => feature.test(key)))
                    WARN(`Enabling experimental feature: ${ name }`, new Date);
                else
                    REMARK(`Enabling feature: ${ name }`, new Date);

                RegisterJob(key, 'enable');
            } else {

                if(!!~EXPERIMENTAL_FEATURES.findIndex(feature => feature.test(key)))
                    WARN(`Modifying experimental feature: ${ name }`, { oldValue, newValue }, new Date);
                else
                    REMARK(`Modifying feature: ${ name }`, { oldValue, newValue }, new Date);

                switch(key) {
                    case 'filter_rules':
                        RestartJob('filter_messages', 'modify');
                        break;

                    case 'away_mode_placement':
                        RestartJob('away_mode', 'modify');
                        break;

                    case 'watch_time_placement':
                        RestartJob('watch_time_placement', 'modify');
                        RestartJob('points_receipt_placement', 'dependent');
                        break;

                    default: break;
                }

                // Adjust the timer to compensate for lost time
                // new-time-left = (old-wait-time - old-time-left) + (new-wait-time - old-wait-time)
                // if(/(\w+)_time_minutes$/i.test(key))
                //     FIRST_IN_LINE_TIMER = (FIRST_IN_LINE_WAIT_TIME - FIRST_IN_LINE_TIMER) + ((parseInt(settings[RegExp.$1] === true? newValue: 0) | 0) - FIRST_IN_LINE_WAIT_TIME);
            }

            reload ||= !!~[...EXPERIMENTAL_FEATURES, ...SENSITIVE_FEATURES].findIndex(feature => feature.test(key));
            if(!!~[...REFRESHABLE_FEATURES].findIndex(feature => feature.test(key)))
                refresh.push(key);

            Settings[key] = newValue;
        }

        if(reload)
            return location.reload();

        for(let job of refresh)
            RestartJob(job, 'modify');
    });

    // Add message listener
    top.addEventListener("message", async event => {
        if(event.origin != top.location.origin)
            return /* Not meant for us... */;

        let { data } = event;

        for(let target in data)
            PostOffice.set(target, data[target]);
    });
} catch(error) {
    // Most likely in aa child frame...
    // REMARK('Moving to chat child frame...');
    WARN(error);
}

async function update() {
    // The location
    top.PATHNAME = PATHNAME = top.location.pathname;

    // The theme
    top.THEME = THEME = [...$('html').classList].find(c => /theme-(\w+)/i.test(c)).replace(/[^]*theme-(\w+)/i, '$1').toLowerCase();

    // All Channels under Search
    top.SEARCH = SEARCH = [
        ...SEARCH,
        // Current (followed) streamers
        ...$(`.search-tray a:not([href*="/search?"]):not([href$="${ PATHNAME }"i])`, true)
            .map(element => {
                let channel = {
                    href: element.href,
                    icon: $('img', false, element)?.src,
                    get live() {
                        let { href } = element,
                            url = parseURL(href),
                            { pathname } = url;

                        let parent = $(`.search-tray [href$="${ pathname }"]:not([href*="/search?"])`);

                        if(!defined(parent))
                            return false;

                        let live = defined($(`[data-test-selector="live-badge"i]`, false, parent));

                        // if(LIVE_CACHE.has(pathname))
                        //     return LIVE_CACHE.get(pathname);
                        // LIVE_CACHE.set(pathname, live);

                        return live;
                    },
                    name: $('img', false, element)?.alt,
                };

                element.setAttribute('draggable', true);
                element.setAttribute('tt-streamer-data', JSON.stringify(channel));
                element.ondragstart ??= event => {
                    let { currentTarget } = event;

                    event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
                    event.dataTransfer.dropEffect = 'move';
                };

                return channel;
            }),
    ].filter(uniqueChannels);

    // All visible Channels
    top.CHANNELS = CHANNELS = [
        ...CHANNELS,
        // Current (followed) streamers
        ...$(`#sideNav .side-nav-section a:not([href$="${ PATHNAME }"i])`, true)
            .map(element => {
                let streamer = {
                    href: element.href,
                    icon: $('img', false, element)?.src,
                    get live() {
                        let { href } = element,
                            url = parseURL(href),
                            { pathname } = url;

                        let parent = $(`#sideNav .side-nav-section [href$="${ pathname }"]`);

                        if(!defined(parent))
                            return false;

                        let live = defined(parent)
                                && !defined($(`[class*="--offline"i]`, false, parent));

                        // if(!defined(parent) && LIVE_CACHE.has(pathname))
                        //     return LIVE_CACHE.get(pathname);
                        // LIVE_CACHE.set(pathname, live);

                        return live;
                    },
                    name: $('img', false, element)?.alt,
                };

                element.setAttribute('draggable', true);
                element.setAttribute('tt-streamer-data', JSON.stringify(streamer));
                element.ondragstart ??= event => {
                    let { currentTarget } = event;

                    event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
                    event.dataTransfer.dropEffect = 'move';
                };

                return streamer;
            }),
    ].filter(uniqueChannels);

    // All followed Channels
    top.STREAMERS = STREAMERS = [
        ...STREAMERS,
        // Current (followed) streamers
        ...$(`#sideNav .side-nav-section[aria-label*="followed"i] a:not([href$="${ PATHNAME }"i])`, true)
            .map(element => {
                let streamer = {
                    href: element.href,
                    icon: $('img', false, element)?.src,
                    get live() {
                        let { href } = element,
                            url = parseURL(href),
                            { pathname } = url;

                        let parent = $(`#sideNav .side-nav-section[aria-label*="followed"i] [href$="${ pathname }"]`);

                        if(!defined(parent))
                            return false;

                        let live = defined(parent)
                                && !defined($(`[class*="--offline"i]`, false, parent));

                        // if(!defined(parent) && LIVE_CACHE.has(pathname))
                        //     return LIVE_CACHE.get(pathname);
                        // LIVE_CACHE.set(pathname, live);

                        return live;
                    },
                    name: $('img', false, element)?.alt,
                };

                element.setAttribute('draggable', true);
                element.setAttribute('tt-streamer-data', JSON.stringify(streamer));
                element.ondragstart ??= event => {
                    let { currentTarget } = event;

                    event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
                    event.dataTransfer.dropEffect = 'move';
                };

                return streamer;
            }),
    ].filter(uniqueChannels);

    // All Notifications
    top.NOTIFICATIONS = NOTIFICATIONS = [
        ...NOTIFICATIONS,
        // Notification elements
        ...$('[data-test-selector^="onsite-notifications"i] [data-test-selector^="onsite-notification"i]', true).map(
            element => {
                let streamer = {
                    live: true,
                    href: $('a', false, element)?.href,
                    icon: $('img', false, element)?.src,
                    name: $('[class$="text"]', false, element)?.innerText?.replace(/([^]+?) +(go(?:ing)?|is|went) +live\b([^$]+)/i, ($0, $1, $$, $_) => $1),
                };

                if(!defined(streamer.name))
                    return;

                element.setAttribute('draggable', true);
                element.setAttribute('tt-streamer-data', JSON.stringify(streamer));
                element.ondragstart ??= event => {
                    let { currentTarget } = event;

                    event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
                    event.dataTransfer.dropEffect = 'move';
                };

                return streamer;
            }),
    ].filter(uniqueChannels);

    // Every channel
        // Putting the channels in this order guarantees channels already defined aren't overridden
    top.ALL_CHANNELS = ALL_CHANNELS = [...ALL_CHANNELS, ...SEARCH, ...NOTIFICATIONS, ...STREAMERS, ...CHANNELS, STREAMER].filter(defined).filter(uniqueChannels);
}

// Registers a job
    // RegisterJob(JobName:string) -> Number=IntervalID
function RegisterJob(JobName, JobReason = 'default') {
    RegisterJob.__reason__ = JobReason;

    return Jobs[JobName] ??= Timers[JobName] > 0?
        setInterval(Handlers[JobName], Timers[JobName]):
    -setTimeout(Handlers[JobName], -Timers[JobName]);
}
Handlers.__reasons__.set('RegisterJob', UUID.from(RegisterJob).value);

// Unregisters a job
    // UnregisterJob(JobName:string) -> undefined
function UnregisterJob(JobName, JobReason = 'default') {
    UnregisterJob.__reason__ = JobReason;

    let CurrentJob = Jobs[JobName];

    if(CurrentJob < 0)
        clearTimeout(-CurrentJob);
    else
        clearInterval(CurrentJob);

    let unhandler = Unhandlers[JobName];

    if(defined(unhandler))
        unhandler();

    // Both accomplish the same thing
    Jobs[JobName] = undefined;
    delete Jobs[JobName];
}
Unhandlers.__reasons__.set('UnregisterJob', UUID.from(UnregisterJob).value);

// Restarts (unregisters, then registers) a job
    // RestartJob(JobName:string) -> undefined
function RestartJob(JobName, JobReason = 'default') {
    RestartJob.__reason__ = JobReason;

    new Promise((resolve, reject) => {
        try {
            UnregisterJob(JobName, JobReason);

            resolve();
        } catch(error) {
            reject(error);
        }
    }).then(() => {
        RegisterJob(JobName, JobReason);
    });
}
Handlers.__reasons__.set('RestartJob', UUID.from(RestartJob).value);
Unhandlers.__reasons__.set('RestartJob', UUID.from(RestartJob).value);

// Settings have been saved
let AsteriskFn = feature => RegExp(`^${ feature.replace('*', '(\\w+)?').replace('#', '([^_]+)?') }$`, 'i'),
    // Features that require the experimental flag
    EXPERIMENTAL_FEATURES = ['auto_focus', 'convert_emotes'].map(AsteriskFn),

    // Features that need the page reloaded when changed
    SENSITIVE_FEATURES = ['away_mode', 'auto_accept_mature', 'fine_details', 'first_in_line*', 'prevent_#'].map(AsteriskFn),

    // Features that need to be run on a "normal" page
    NORMALIZED_FEATURES = ['away_mode', 'auto_follow*', 'first_in_line*', 'prevent_#', 'kill*'].map(AsteriskFn),

    // Features that need to be refreshed when changed
    REFRESHABLE_FEATURES = ['auto_focus*', 'bttv_emotes*', 'filter_messages', 'native_twitch_reply', '*placement'].map(AsteriskFn);

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
    // Initialize(START_OVER:boolean) -> undefined

let LIVE_CACHE = new Map();
const PRIVATE_SYMBOL = Symbol(new UUID);

let Initialize = async(START_OVER = false) => {
    let GLOBAL_TWITCH_API = top.GLOBAL_TWITCH_API = {},
        GLOBAL_EVENT_LISTENERS = top.GLOBAL_EVENT_LISTENERS = {};

    SPECIAL_MODE = defined($('[data-test-selector="exit-button"]'));
    NORMAL_MODE = !SPECIAL_MODE;
    NORMALIZED_PATHNAME = PATHNAME
        // Remove common "modes"
        .replace(/^(moderator)\/(\/[^\/]+?)/i, '$1')
        .replace(/^(\/[^\/]+?)\/(squad|videos)\b/i, '$1');

    if(SPECIAL_MODE) {
        let { $1, $2 } = RegExp;

        WARN(`Currently viewing ${ $1 } in "${ $2 }" mode. Several features will be disabled:`, NORMALIZED_FEATURES);
    }

    let ERRORS = Initialize.errors |= 0;
    if(START_OVER) {
        for(let job in Jobs)
            UnregisterJob(job, 'reinit');
        ERRORS = Initialize.errors++
    }

    // Modify the logging feature via the settings
    if(!Settings.display_in_console)
        LOG = WARN = ERROR = ($=>$);

    // Disable experimental features
    if(!Settings.experimental_mode) {
        for(let setting in Settings)
            if(!!~EXPERIMENTAL_FEATURES.findIndex(feature => feature.test(setting)))
                Settings[setting] = null;
    }

    // Disable normalized features
    if(SPECIAL_MODE) {
        for(let setting in Settings)
            if(!!~NORMALIZED_FEATURES.findIndex(feature => feature.test(setting)))
                Settings[setting] = null;
    }

    // Gets the next available channel (streamer)
        // GetNextStreamer() -> Object#Channel
    async function GetNextStreamer() {
        let online = STREAMERS.filter(isLive),
            mostWatched = null,
            mostPoints = 0,
            leastWatched = null,
            leastPoints = 1_000_000_000;

        await LoadCache('ChannelPoints', ({ ChannelPoints = {} }) => {
            for(let channel in ChannelPoints) {
                let [amount, fiat, face] = ChannelPoints[channel].split('|');

                amount = parseCoin(amount);

                if(amount > mostPoints) {
                    mostWatched = channel;
                    mostPoints = amount;
                } else if(amount < leastPoints) {
                    leastWatched = channel;
                    leastPoints = amount;
                }
            }
        });

        // Next channel in "Up Next"
        if(!parseBool(Settings.first_in_line_none) && ALL_FIRST_IN_LINE_JOBS?.length)
            return ALL_CHANNELS.filter(channel => channel.href !== STREAMER.href).find(channel => channel.href === ALL_FIRST_IN_LINE_JOBS[0]);

        let next;

        next_channel:
        switch(Settings.next_channel_preference) {
            // The most popular channel (most amoutn of current viewers)
            case 'popular':
                next = online[0];
                break;

            // The least popular channel (least amount of current viewers)
            case 'unpopular':
                next = online[online.length - 1];
                break;

            // Most watched channel (most channel points)
            case 'rich':
                next = STREAMERS.find(channel => channel.name === mostWatched);
                break;

            // Least watched channel (least channel points)
            case 'poor':
                next = STREAMERS.find(channel => channel.name === leastWatched);
                break;

            // A random channel
            default:
                next = online[(Math.random() * online.length)|0];
                break;
        }

        return next;
    }

    /** Search Array - all channels/friends that appear in the search panel (except the currently viewed one)
     * href:string   - link to the channel
     * icon:string   - link to the channel's image
     * live:boolean* - GETTER: is the channel live
     * name:string   - the channel's name
     */
    SEARCH = [
        // Current (followed) streamers
        ...$(`.search-tray a:not([href*="/search?"]):not([href$="${ NORMALIZED_PATHNAME }"i]), [data-test-selector*="search-result"i][data-test-selector*="channel"i] a:not([href*="/search?"])`, true)
            .map(element => {
                let channel = {
                    href: element.href,
                    icon: $('img', false, element)?.src,
                    get live() {
                        let { href } = element,
                            url = parseURL(href),
                            { pathname } = url;

                            let parent = $(`.search-tray [href$="${ pathname }"]:not([href*="/search?"])`);

                            if(!defined(parent))
                                return false;

                            let live = defined($(`[data-test-selector="live-badge"i]`, false, parent));

                        // if(LIVE_CACHE.has(pathname))
                        //     return LIVE_CACHE.get(pathname);
                        // LIVE_CACHE.set(pathname, live);

                        return live;
                    },
                    name: $('img', false, element)?.alt,
                };

                element.setAttribute('draggable', true);
                element.setAttribute('tt-streamer-data', JSON.stringify(channel));
                element.ondragstart ??= event => {
                    let { currentTarget } = event;

                    event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
                    event.dataTransfer.dropEffect = 'move';
                };

                return channel;
            }),
    ].filter(uniqueChannels);

    /** Streamer Array - the current streamer/channel
     * coin:number*      - GETTER: how many channel points (floored to the nearest 100) does the user have
     * chat:array*       - GETTER: an array of the current chat, sorted the same way messages appear. The last message is the last array entry
     * face:string       - GETTER: a URL to the channel points image, if applicable
     * fiat:string*      - GETTER: returns the name of the streamer's coin, if applicable
     * follow:function   - follows the current channel
     * game:string*      - GETTER: the name of the current game/category
     * href:string       - link to the channel (usually the current href)
     * icon:string       - link to the channel's icon/image
     * like:boolean*     - GETTER: is the user following the current channel
     * live:boolean*     - GETTER: is the channel currently live
     * name:string       - the channel's username
     * paid:boolean*     - GETTER: is the user  subscribed
     * ping:boolean*     - GETTER: does the user have notifications on
     * poll:number*      - GETTER: how many viewers are watching the channel
     * sole:number       - GETTER: the channel's ID
     * tags:array*       - GETTER: tags of the current stream
     * team:string*      - GETTER: the team the channel is affiliated with (if applicable)
     * time:number*      - GETTER: how long has the channel been live
     * unfollow:function - unfollows the current channel

     * Only available with Fine Details enabled
     * ally:boolean      - is the channel partnered?
     * fast:boolean      - is the channel using turbo?
     * nsfw:boolean      - is the channel deemed NSFW (mature)?
     */
    STREAMER = top.STREAMER = {
        get chat() {
            return GetChat();
        },

        get coin() {
            let balance = $('[data-test-selector="balance-string"i]'),
                points = parseCoin(balance?.textContent);

            return points;
        },

        get face() {
            let balance = $('[data-test-selector="balance-string"i]');

            if(!defined(balance))
                return PostOffice.get('points_receipt_placement')?.coin_face;

            let container = balance?.closest('button'),
                icon = $('img[alt]', false, container);

            return icon?.src;
        },

        get fiat() {
            let balance = $('[data-test-selector="balance-string"i]');

            if(!defined(balance))
                return PostOffice.get('points_receipt_placement')?.coin_name;

            let container = balance?.closest('button'),
                icon = $('img[alt]', false, container);

            return icon?.alt;
        },

        get game() {
            let element = $('[data-a-target$="game-link"i], [data-a-target$="game-name"i]'),
                name = element?.innerText,
                game = new String(name ?? "");

            Object.defineProperties(game, {
                href: { value: element?.href }
            });

            return game;
        },

        href: parseURL($(`a[href$="${ NORMALIZED_PATHNAME }"i]`)?.href).href,

        icon: $('img', false, $(`a[href$="${ NORMALIZED_PATHNAME }"i], [data-a-channel]`))?.src,

        get like() {
            return defined($('[data-a-target="unfollow-button"i]'))
        },

        get live() {
            return SPECIAL_MODE
                || (true
                    && defined($(`a[href$="${ NORMALIZED_PATHNAME }"i] [class*="status-text"i]`)) && !defined($(`[class*="offline-recommendations"i]`))
                    && !/^offline$/i.test($(`[class*="video-player"i] [class*="media-card"i]`)?.innerText?.trim() ?? "")
                )
        },

        name: $(`a[href$="${ NORMALIZED_PATHNAME }"i]${ ['', ' h1'][+NORMAL_MODE] }`)?.textContent,

        get paid() {
            return defined($('[data-a-target="subscribed-button"i]'))
        },

        get ping() {
            return defined($('[data-a-target^="live-notifications"i][data-a-target$="on"i]'))
        },

        get poll() {
            return parseInt($('[data-a-target$="viewers-count"i], [class*="stream-info-card"i] [data-test-selector$="description"i]')?.textContent?.replace(/\D+/g, ''))
        },

        get sole() {
            let [channel_id] = $('[data-test-selector="image_test_selector"i]', true).map(img => img.src).filter(src => !!~src.indexOf('/panel-')).map(src => parseURL(src).pathname.split('-', 3).filter(parseFloat)).flat();

            return parseInt(channel_id ?? NaN);
        },

        get tags() {
            let tags = [];

            $('.tw-tag', true).map(element => {
                let name = element.textContent.toLowerCase(),
                    { href } = element.closest('a[href]');

                tags.push(name);
                tags[name] = href;

                return name;
            });

            return tags;
        },

        get team() {
            let element = $('[href^="/team"]'),
                team = new String((element?.innerText ?? "").trim());

            Object.defineProperties(team, {
                href: { value: element?.href }
            });

            return team;
        },

        get time() {
            return parseTime($('.live-time')?.textContent ?? '0');
        },

        follow() {
            $('[data-a-target="follow-button"i]')?.click?.();
        },

        unfollow() {
            $('[data-a-target="unfollow-button"i]')?.click?.();
        },

        __eventlisteners__: {
            onhost: [],
            onraid: [],
        },

        set onhost(job) {
            STREAMER.__eventlisteners__.onhost.push(job);
        },

        set onraid(job) {
            STREAMER.__eventlisteners__.onraid.push(job);
        },
    };

    // Make the main icon draggable...
    let StreamerMainIcon = $(`main a[href$="${ NORMALIZED_PATHNAME }"i]`),
        StreamerFilteredData = { ...STREAMER };

    for(let key of 'chat coin paid ping poll tags team time __eventlisteners__'.split(' '))
        delete StreamerFilteredData[key];

    StreamerMainIcon.setAttribute('draggable', true);
    StreamerMainIcon.setAttribute('tt-streamer-data', JSON.stringify(STREAMER));
    StreamerMainIcon.ondragstart ??= event => {
        let { currentTarget } = event;

        event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
        event.dataTransfer.dropEffect = 'move';
    };

    /** Notification Array - the visible, actionable notifications
     * href:string   - link to the channel
     * icon:string   - link to the channel's image
     * live:boolean* - GETTER: is the channel live
     * name:string   - the channel's name
     */
    // Notifications
    NOTIFICATIONS = [
        ...$('[data-test-selector="onsite-notifications-toast-manager"i] [data-test-selector^="onsite-notification-toast"i]', true)
            .map(element =>
                ({
                    live: true,
                    href: $('a', false, element)?.href,
                    icon: $('img', false, element)?.src,
                    name: $('[class$="text"]', false, element)?.innerText?.replace(/([^]+?) +(go(?:ing)?|is|went) +live\b([^$]+)/i, ($0, $1, $$, $_) => $1),
                })
            ),
    ].filter(uniqueChannels);

    // Expand the left-hand panel until the last live channel is visible
    __GetAllChannels__:
    if(true) {
        let element;

        // Is the nav open?
        let open = defined($('[data-a-target="side-nav-search-input"]')),
            sidenav = $('[data-a-target="side-nav-arrow"i]');

        let SIDE_PANEL_CHILDREN = $('#sideNav .side-nav-section[aria-label*="followed"i] a', true),
            GET_PANEL_SIZE = (last = false) =>
                (SIDE_PANEL_CHILDREN = $('#sideNav .side-nav-section[aria-label*="followed"i] a', true))
                    [`find${last?'Last':''}Index`](e => $('[class*="--offline"i]', false, e)),
            SIDE_PANEL_SIZE = SIDE_PANEL_CHILDREN.length;

        // Open the Side Nav
        if(!open) // Only open it if it isn't already
            sidenav?.click();

        // Click "show more" as many times as possible
        show_more:
        while(defined(element = $('#sideNav [data-a-target$="show-more-button"]')))
            element.click();

        // Collect all channels
        /** Hidden Channels Array - all channels/friends that appear on the side panel
         * href:string   - link to the channel
         * icon:string   - link to the channel's image
         * live:boolean* - GETTER: is the channel live
         * name:string   - the channel's name
         */
        ALL_CHANNELS = [
            // Current (followed) streamers
            ...$(`#sideNav .side-nav-section a`, true)
                .map(element => {
                    let streamer = {
                        href: element.href,
                        icon: $('img', false, element)?.src,
                        get live() {
                            let { href } = element,
                                url = parseURL(href),
                                { pathname } = url;

                            let parent = $(`#sideNav .side-nav-section [href$="${ pathname }"]`);

                            if(!defined(parent))
                                return false;

                            let live = defined(parent) && !defined($(`[class*="--offline"i]`, false, parent));

                            // if(!defined(parent) && LIVE_CACHE.has(pathname))
                            //     return LIVE_CACHE.get(pathname);
                            // LIVE_CACHE.set(pathname, live);

                            return live;
                        },
                        name: $('img', false, element)?.alt,
                    };

                    element.setAttribute('draggable', true);
                    element.setAttribute('tt-streamer-data', JSON.stringify(streamer));
                    element.ondragstart ??= event => {
                        let { currentTarget } = event;

                        event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
                        event.dataTransfer.dropEffect = 'move';
                    };

                    // Activate (and set) the live status for the streamer
                    let { live } = streamer;

                    return streamer;
                }),
        ].filter(uniqueChannels);

        /** Channels Array - all channels/friends that appear on the side panel (except the currently viewed one)
         * href:string   - link to the channel
         * icon:string   - link to the channel's image
         * live:boolean* - GETTER: is the channel live
         * name:string   - the channel's name
         */
        CHANNELS = [
            // Current (followed) streamers
            ...$(`#sideNav .side-nav-section a:not([href$="${ NORMALIZED_PATHNAME }"i])`, true)
                .map(element => {
                    let streamer = {
                        href: element.href,
                        icon: $('img', false, element)?.src,
                        get live() {
                            let { href } = element,
                                url = parseURL(href),
                                { pathname } = url;

                            let parent = $(`#sideNav .side-nav-section [href$="${ pathname }"]`);

                            if(!defined(parent))
                                return false;

                            let live = defined(parent) && !defined($(`[class*="--offline"i]`, false, parent));

                            // if(!defined(parent) && LIVE_CACHE.has(pathname))
                            //     return LIVE_CACHE.get(pathname);
                            // LIVE_CACHE.set(pathname, live);

                            return live;
                        },
                        name: $('img', false, element)?.alt,
                    };

                    element.setAttribute('draggable', true);
                    element.setAttribute('tt-streamer-data', JSON.stringify(streamer));
                    element.ondragstart ??= event => {
                        let { currentTarget } = event;

                        event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
                        event.dataTransfer.dropEffect = 'move';
                    };

                    return streamer;
                }),
        ].filter(uniqueChannels);

        /** Streamers Array - all followed channels that appear on the "Followed Channels" list (except the currently viewed one)
         * href:string   - link to the channel
         * icon:string   - link to the channel's image
         * live:boolean* - GETTER: is the channel live
         * name:string   - the channel's name
         */
        STREAMERS = [
            // Current streamers
            ...$(`#sideNav .side-nav-section[aria-label*="followed"i] a:not([href$="${ NORMALIZED_PATHNAME }"i])`, true)
                .map(element => {
                    let streamer = {
                        href: element.href,
                        icon: $('img', false, element)?.src,
                        get live() {
                            let { href } = element,
                                url = parseURL(href),
                                { pathname } = url;

                            let parent = $(`#sideNav .side-nav-section[aria-label*="followed"i] [href$="${ pathname }"]`);

                            if(!defined(parent))
                                return false;

                            let live = defined(parent) && !defined($(`[class*="--offline"i]`, false, parent));

                            // if(!defined(parent) && LIVE_CACHE.has(pathname))
                            //     return LIVE_CACHE.get(pathname);
                            // LIVE_CACHE.set(pathname, live);

                            return live;
                        },
                        name: $('img', false, element)?.alt,
                    };

                    element.setAttribute('draggable', true);
                    element.setAttribute('tt-streamer-data', JSON.stringify(streamer));
                    element.ondragstart ??= event => {
                        let { currentTarget } = event;

                        event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
                        event.dataTransfer.dropEffect = 'move';
                    };

                    return streamer;
                }),
        ].filter(uniqueChannels);

        // Click "show less" as many times as possible
        show_less:
        while(
            defined(element = $('[data-a-target="side-nav-show-less-button"]'))
            // Only close sections if they don't contain any live channels
            // floor(last-dead-channel-index / panel-size) > floor(first-dead-channel-index / panel-size)
                // [live] ... [dead] ... [dead]
                // ^ keep     ^ stop?    ^ kill
            && ((GET_PANEL_SIZE(true) - GET_PANEL_SIZE()) / SIDE_PANEL_SIZE) | 0
        )
            element.click();

        // Close the Side Nav
        if(!open) // Only close it if it wasn't open in the first place
            sidenav?.click();
    }

    // Every channel
    ALL_CHANNELS = [...ALL_CHANNELS, ...SEARCH, ...NOTIFICATIONS, ...STREAMERS, ...CHANNELS, STREAMER].filter(defined).filter(uniqueChannels);

    if(defined(STREAMER)) {
        let element = $(`a[href$="${ NORMALIZED_PATHNAME }"i]`),
            { href, icon, live, name } = STREAMER;

        element.setAttribute('draggable', true);
        element.setAttribute('tt-streamer-data', JSON.stringify({ href, icon, live, name }));
        element.ondragstart ??= event => {
            let { currentTarget } = event;

            event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
            event.dataTransfer.dropEffect = 'move';
        };

        /* Attempt to use the Twitch API */
        __FineDetails__:
        if(parseBool(Settings.fine_details)) {
            // Get the cookie values
            let cookies = {};

            document.cookie.split(/(?:\s*;\s*)+/).map(cookie => {
                let [name, value = null] = cookie.split('=');

                cookies[name] = value;
            });

            USERNAME = top.USERNAME = cookies.name ?? USERNAME;

            // Get the channel/vod information
            let channelName,
                videoID;

            let { pathname } = location;

            if(pathname.startsWith('/videos/'))
                videoID = pathname.replace('/videos/', '').replace(/\/g/, '').replace(/^v/i, '');
            else
                channelName = pathname.replace(/^(moderator)\/(\/[^\/]+?)/i, '$1').replace(/^(\/[^\/]+?)\/(squad|videos)\b/i, '$1').replace(/\//g, '');

            // Fetch an API request
            let type = (defined(videoID)? 'vod': 'channel'),
                value = (defined(videoID)? videoID: channelName),
                token = cookies['auth-token'];

            if(!defined(STREAMER.name))
                break __FineDetails__;

            /** Get Twitch analytics data
             * activeDaysPerWeek:number     - the average number of days the channel is live (per week)
             * averageGamesPerStream:number - the average number of games played (per stream)
             * dailyBroadcastTime:number    - the average number of hours streamed (per day)
             * followersPerHour:number      - the average number of followers gained (per hour)
             * followersPerStream:number    - the average number of followers gained (per stream)
             * followersToDate:number       - the total number of followers
             * hoursWatchedDaily:number     - the average number of hours watched (per day)
             * totalGamesStreamed:number    - the number of games streamed
             * viewsPerHour:number          - the average number of views (per hour)
             * viewsPerStream:number        - the average number of views (per stream)
             * viewsToDate:number           - the total number of views
             */
            // First, attempt to retrieve the cached data (no older than 12h)
            try {
                await LoadCache(`data/${ STREAMER.name }`, cache => {
                    let data = cache[`data/${ STREAMER.name }`],
                        { dataRetrievedAt, dataRetrievedOK } = data;

                    dataRetrievedAt ||= 0;
                    dataRetrievedOK ||= false;

                    // Only refresh every 12h
                    if(!parseBool(dataRetrievedOK))
                        throw "The data wasn't saved correctly";
                    else if((dataRetrievedAt + 43_200_000) < +new Date)
                        throw "The data likely expired";
                    else
                        STREAMER.data = data;

                    REMARK(`Cached details about "${ STREAMER.name }"`, data);
                });
            } catch(exception) {
                // Proper CORS request to fetch the HTML data
                await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.twitchmetrics.net/c/${ STREAMER.sole }-${ STREAMER.name }/stream_time_values`)}`, { mode: 'cors' })
                    .then(response => response.json())
                    .then(json => {
                        let data = { dailyBroadcastTime: 0, activeDaysPerWeek: 0, },
                            today = new Date;

                        let averageStreamTime = 0,
                            daysWithStreams = new Set(),
                            totalStreamTime = (json ?? []).reverse()
                                .map(dates => dates.map(date => {
                                    date = new Date(date.toUpperCase().replace("T", " "));

                                    if(Math.abs(today - date) < 604_800_000)
                                        daysWithStreams.add(date.getDay());

                                    return date;
                                }))
                                .map(([start, stop]) => averageStreamTime += Math.abs(start - stop));

                        data.dailyBroadcastTime = (averageStreamTime / totalStreamTime.length) / 3_600_000;
                        data.activeDaysPerWeek = daysWithStreams.size;

                        REMARK(`Details about "${ STREAMER.name }"`, data);

                        return STREAMER.data = data;
                    })
                    .catch(WARN)
                    .then(data => {
                        data = { ...data, dataRetrievedOK: defined(data?.dailyBroadcastTime), dataRetrievedAt: +new Date };

                        SaveCache({ [`data/${ STREAMER.name }`]: data });
                    });

                //  OBSOLETE //
                // await fetch(`https://api.twitch.tv/api/${ type }s/${ value }/access_token?oauth_token=${ token }&need_https=true&platform=web&player_type=site&player_backend=mediaplayer`)
                //     .then(response => response.json())
                //     .then(json => GLOBAL_TWITCH_API = JSON.parse(json.token ?? "null"))
                //     .then(json => {
                //         if(!defined(json))
                //             throw "Fine Detail JSON data could not be parsed...";
                //
                //         REMARK('Getting fine details...', { [type]: value, cookies }, json);
                //
                //         let conversion = {
                //             paid: 'subscriber',
                //
                //             ally: 'partner',
                //             fast: 'turbo',
                //             nsfw: 'mature',
                //             sole: 'channel_id',
                //         };
                //
                //         for(let key in conversion)
                //             STREAMER[key] = GLOBAL_TWITCH_API[conversion[key]];
                //     })
                //     .catch(ERROR);

                // OBSOLETE //
                // await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://twitchtracker.com/${ STREAMER.name }/statistics`)}`, { mode: 'cors' })
                //     .then(text => text.text())
                //     /* Conversion => Text -> HTML -> Element -> JSON */
                //     .then(html => {
                //         let doc = (new DOMParser).parseFromString(html, 'text/html'),
                //             body = doc.body;
                //
                //         let data = {};
                //
                //         [...doc.querySelectorAll('#report .table tr')]
                //             .map(tr => {
                //                 let [name, value] = tr.querySelectorAll('td');
                //
                //                 /* Set initial name */
                //                 name = name
                //                     .innerText
                //                     .toLowerCase();
                //
                //                 /* Set initial value, and adjust name */
                //                 value = value
                //                     .innerText
                //                     .trim()
                //                     .replace(/\s+/g, ' ')
                //                     .replace(/\s*\/(\w+)/, ($0, $1, $$, $_) => {
                //                         name += " per " + $1;
                //
                //                         return '';
                //                     });
                //
                //                 /* Set final value */
                //                 value = (
                //                     /^([\d\.]+|[\d\.]+\s*(?:min|hr|day)s)$/.test(value)?
                //                         parseFloat(value):
                //                     value
                //                 );
                //
                //                 /* Set final name */
                //                 name = name
                //                     .replace(/\s+(\w)/g, ($0, $1, $$, $_) => $1.toUpperCase());
                //
                //                 /* Set property */
                //                 data[name] = value;
                //             });
                //
                //         REMARK(`Details about "${ STREAMER.name }"`, data, { bearer, clientID });
                //
                //         return STREAMER.data = data;
                //     })
                //     .catch(WARN)
                //     .then(data => {
                //         data = { ...data, dataRetrievedAt: +new Date };
                //
                //         SaveCache({ [`data/${ STREAMER.name }`]: data });
                //     });
            }
        }
    };

    // TODO - Add an "un-delete" feature
    // Keep a copy of all messages
    // REMARK("Keeping a log of all original messages");
    // Messages.set(STREAMER.name, new Set);
    //
    // GetChat(250).forEach(line => Messages.get(STREAMER.name).add(line));
    // GetChat.onnewmessage = chat =>
    //     chat.forEach(line => line.deleted? null: Messages.get(STREAMER.name).add(line));

    update();
    setInterval(update, 100);

    /*** Automation
     *                    _                        _   _
     *         /\        | |                      | | (_)
     *        /  \  _   _| |_ ___  _ __ ___   __ _| |_ _  ___  _ __
     *       / /\ \| | | | __/ _ \| '_ ` _ \ / _` | __| |/ _ \| '_ \
     *      / ____ \ |_| | || (_) | | | | | | (_| | |_| | (_) | | | |
     *     /_/    \_\__,_|\__\___/|_| |_| |_|\__,_|\__|_|\___/|_| |_|
     *
     *
     */
    /*** Auto-Join
     *                    _                  _       _
     *         /\        | |                | |     (_)
     *        /  \  _   _| |_ ___ ______    | | ___  _ _ __
     *       / /\ \| | | | __/ _ \______|   | |/ _ \| | '_ \
     *      / ____ \ |_| | || (_) |    | |__| | (_) | | | | |
     *     /_/    \_\__,_|\__\___/      \____/ \___/|_|_| |_|
     *
     *
     */
    Handlers.auto_accept_mature = () => {
        $('[data-a-target="player-overlay-mature-accept"i], [data-a-target*="watchparty"i] button, .home [data-a-target^="home"]')?.click();
    };
    Timers.auto_accept_mature = -1000;

    __AutoMatureAccept__:
    if(parseBool(Settings.auto_accept_mature)) {
        RegisterJob('auto_accept_mature');
    }

    /*** Auto-Focus
     *                    _              ______
     *         /\        | |            |  ____|
     *        /  \  _   _| |_ ___ ______| |__ ___   ___ _   _ ___
     *       / /\ \| | | | __/ _ \______|  __/ _ \ / __| | | / __|
     *      / ____ \ |_| | || (_) |     | | | (_) | (__| |_| \__ \
     *     /_/    \_\__,_|\__\___/      |_|  \___/ \___|\__,_|___/
     *
     *
     */
    let CAPTURE_HISTORY = [],
        CAPTURE_INTERVAL,
        POLL_INTERVAL,
        STALLED_FRAMES,
        POSITIVE_TREND;

    Handlers.auto_focus = () => {
        let detectionThreshold = parseInt(Settings.auto_focus_detection_threshold),
            pollInterval = parseInt(Settings.auto_focus_poll_interval),
            imageType = Settings.auto_focus_poll_image_type,
            detectedTrend = '&bull;';

        POLL_INTERVAL ??= pollInterval * 1000;
        STALLED_FRAMES = 0;

        if(CAPTURE_HISTORY.length > 90)
            CAPTURE_HISTORY.shift();

        CAPTURE_INTERVAL = setInterval(() => {
            let isAdvert = $('video', true).length > 1,
                video = $('video', true)[+isAdvert];

            if(!defined(video))
                return;

            let frame = video.captureFrame(`image/${ imageType }`),
                start = +new Date;

            setTimeout(() => {
                resemble(frame)
                    .compareTo(video.captureFrame(`image/${ imageType }`))
                    .ignoreColors()
                    .scaleToSameSize()
                    .outputSettings({ errorType: 'movementDifferenceIntensity', errorColor: { red: 0, green: 255, blue: 255 } })
                    .onComplete(async data => {
                        let { analysisTime, misMatchPercentage } = data,
                            threshold = detectionThreshold,
                            totalTime = 0,
                            bias = [];

                        analysisTime = parseInt(analysisTime);
                        misMatchPercentage = parseFloat(misMatchPercentage);

                        for(let [misMatchPercentage, analysisTime, trend] of CAPTURE_HISTORY) {
                            threshold += parseFloat(misMatchPercentage);
                            totalTime += analysisTime;
                            bias.push(trend);
                        }
                        threshold /= CAPTURE_HISTORY.length || 1;

                        let trend = misMatchPercentage > detectionThreshold? 'up': 'down';

                        CAPTURE_HISTORY.push([misMatchPercentage, analysisTime, trend]);

                        /* Display capture stats */
                        let diffImg = $('img#tt-auto-focus-differences'),
                            diffDat = $('span#tt-auto-focus-stats'),
                            stop = +new Date;

                        DisplayingAutoFocusDetails:
                        if(Settings.display_of_video) {
                            let parent = $('.chat-list--default');
                            // #twilight-sticky-header-root

                            if(!defined(parent))
                                break DisplayingAutoFocusDetails;

                            let { height, width } = getOffset(video);

                            height = parseInt(height * .25);
                            width = parseInt(width * .25);

                            if(!defined(diffImg)) {
                                diffImg = furnish('img#tt-auto-focus-differences', { style: `position: absolute; z-index: 3; width: ${ width }px; /* top: 20px; */` });
                                diffDat = furnish('span#tt-auto-focus-stats', { style: `position: absolute; z-index: 6; width: ${ width }px; height: 20px; background: #000; overflow: hidden; font-family: monospace;` });

                                parent.appendChild(diffImg);
                                parent.appendChild(diffDat);
                            }

                            diffImg.src = data.getImageDataUrl?.();

                            let size = diffImg.src.length,
                                { totalVideoFrames } = video.getVideoPlaybackQuality();

                            diffDat.innerHTML = `Frame #${ totalVideoFrames } / ${ detectedTrend } ${ misMatchPercentage }% &#866${ 3 + (trend[0] == 'd') }; / ${ ((stop - start) / 1000).suffix('s', 2) } / ${ size.suffix('B', 2) }`;
                            diffDat.title = `Frame Number / Overall Trend, Change Percentage, Current Trend / Time to Calculate Changes / Size of Changes (Bytes)`;
                        } else {
                            diffImg?.remove();
                            diffDat?.remove();
                        }

                        /* Alter other settings according to the trend */
                        let changes = [];

                        if(bias.length > 30 && FIRST_IN_LINE_TIMER > 60_000) {
                            // Positive activity trend; disable Away Mode, pause Up Next
                            if(!POSITIVE_TREND && bias.slice(-(30 / pollInterval)).filter(trend => trend === 'down').length < (30 / pollInterval) / 2) {
                                POSITIVE_TREND = true;

                                // Pause Up Next
                                __AutoFocus_Pause_UpNext__: {
                                    let button = $('#up-next-control'),
                                        paused = parseBool(button?.getAttribute('paused'));

                                    if(paused)
                                        break __AutoFocus_Pause_UpNext__;

                                    button?.click();

                                    changes.push('pausing up next');
                                }

                                // Disable Away Mode
                                __AutoFocus_Disable_AwayMode__: {
                                    let button = $('#away-mode'),
                                        quality = await GetQuality();

                                    if(quality.auto)
                                        break __AutoFocus_Disable_AwayMode__;

                                    button?.click();

                                    changes.push('disabling away mode');
                                }

                                detectedTrend = '&uArr;';
                                LOG('Positive trend detected: ' + changes.join(', '));
                            }
                            // Negative activity trend; enable Away Mode, resume Up Next
                            else if(POSITIVE_TREND && bias.slice(-(60 / pollInterval)).filter(trend => trend === 'up').length < (60 / pollInterval) / 5) {
                                POSITIVE_TREND = false;

                                // Resume Up Next
                                __AutoFocus_Resume_UpNext__: {
                                    let button = $('#up-next-control'),
                                        paused = parseBool(button?.getAttribute('paused'));

                                    if(!paused)
                                        break __AutoFocus_Resume_UpNext__;

                                    button?.click();

                                    changes.push('resuming up next');
                                }

                                // Enable Away Mode
                                __AutoFocus_Enable_AwayMode__: {
                                    let button = $('#away-mode'),
                                        quality = await GetQuality();

                                    if(quality.low)
                                        break __AutoFocus_Enable_AwayMode__;

                                    button?.click();

                                    changes.push('enabling away mode');
                                }

                                detectedTrend = '&dArr;';
                                LOG('Negative trend detected: ' + changes.join(', '));
                            }
                        }

                        // Auto-increase the polling time if the job isn't fast enough
                        if(video.stalling)
                            ++STALLED_FRAMES;
                        else if(STALLED_FRAMES > 0)
                            --STALLED_FRAMES;

                        if(STALLED_FRAMES > 15 || (stop - start > POLL_INTERVAL / 2)) {
                            WARN('The stream seems to be stalling...', 'Increasing Auto-Focus job time...', (POLL_INTERVAL / 1000).toFixed(2) + 's -> ' + (POLL_INTERVAL * 1.1 / 1000).toFixed(2) + 's');

                            POLL_INTERVAL *= 1.1;
                            STALLED_FRAMES = 0;

                            RestartJob('auto_focus');
                        }
                    })
            }, 100);
        }, POLL_INTERVAL);
    };
    Timers.auto_focus = -1_000;

    Unhandlers.auto_focus = () => {
        $('#tt-auto-focus-differences, #tt-auto-focus-stats', true)
            .forEach(element => element.remove());
        clearInterval(CAPTURE_INTERVAL);
    };

    __AutoFocus__:
    if(parseBool(Settings.auto_focus)) {
        RegisterJob('auto_focus');

        WARN("Auto-Focus is monitoring the stream...");
    }

    /*** Away Mode
     *                                   __  __           _
     *         /\                       |  \/  |         | |
     *        /  \__      ____ _ _   _  | \  / | ___   __| | ___
     *       / /\ \ \ /\ / / _` | | | | | |\/| |/ _ \ / _` |/ _ \
     *      / ____ \ V  V / (_| | |_| | | |  | | (_) | (_| |  __/
     *     /_/    \_\_/\_/ \__,_|\__, | |_|  |_|\___/ \__,_|\___|
     *                            __/ |
     *                           |___/
     */
    let AwayModeButton,
        AwayModeEnabled = false,
        SetupQuality = false;

    Handlers.away_mode = async() => {
        let button = $('#away-mode'),
            quality = (Handlers.away_mode.quality ??= await GetQuality());

        if(defined(button) || !defined(quality) || /\/search\b/i.test(NORMALIZED_PATHNAME))
            return;

        await LoadCache({ AwayModeEnabled }, cache => AwayModeEnabled = cache.AwayModeEnabled ?? false);

        let enabled = AwayModeEnabled || (quality.low && !(quality.auto || quality.high || quality.source));

        if(!defined(button)) {
            let sibling, parent, before,
                extra = () => {},
                container = furnish('div'),
                placement = (Settings.away_mode_placement ??= "null");

            switch(placement) {
                // Option 1 "over" - video overlay, play button area
                case 'over':
                    sibling = $('[data-a-target="player-controls"i] [class*="player-controls"][class*="right-control-group"i] > :last-child', false, parent);
                    parent = sibling?.parentElement;
                    before = 'first';
                    extra = ({ container }) => {
                        // Remove the old tooltip
                        container.querySelector('[role="tooltip"i]')?.remove();
                    };
                    break;

                // Option 2 "under" - quick actions, follow/notify/subscribe area
                case 'under':
                    sibling = $('[data-test-selector="live-notifications-toggle"]');
                    parent = sibling?.parentElement;
                    before = 'last';
                    break;

                default: return;
            }

            if(!defined(parent) || !defined(sibling))
                return;

            container.innerHTML = sibling.outerHTML.replace(/(?:[\w\-]*)(?:notifications?|settings-menu)([\w\-]*)/ig, 'away-mode$1');
            container.id = 'away-mode';

            parent.insertBefore(container, parent[before + 'ElementChild']);

            if(['over'].contains(placement))
                container.firstElementChild.classList.remove('tw-mg-l-1');
            extra({ container, sibling, parent, before, placement });

            button = {
                enabled,
                container,
                icon: $('svg', false, container),
                get offset() { return getOffset(container) },
                background: $('button[data-a-target="away-mode-toggle"i]', false, container),
                tooltip: new Tooltip(container, `${ ['','Exit '][+enabled] }Away Mode (alt+a)`, { direction: 'up', left: +5 }),
            };

            button.tooltip.id = new UUID().toString().replace(/-/g, '');
            button.container.setAttribute('tt-away-mode-enabled', enabled);

            button.icon ??= $('svg', false, container);
            button.icon.outerHTML = Glyphs.eye;
            button.icon = $('svg', false, container);
        } else {
            let container = $('#away-mode');

            button = {
                enabled,
                container,
                icon: $('svg', false, container),
                tooltip: Tooltip.get(container),
                get offset() { return getOffset(container) },
                background: $('button[data-a-target="away-mode-toggle"i]', false, container),
            };
        }

        // Change the quality when loaded
        if(!SetupQuality)
            SetupQuality = SetQuality(['auto','low'][+enabled]) && true;

        // if(init === true) ->
        // Don't use above, event listeners won't work
        button.background?.setAttribute('style', `background:#${ ['387aff', 'f5009b'][+(button.container.getAttribute('tt-away-mode-enabled') === "true")] } !important;`);
        button.icon.setAttribute('height', '20px');
        button.icon.setAttribute('width', '20px');

        button.container.onclick ??= event => {
            let enabled = !parseBool(AwayModeButton.container.getAttribute('tt-away-mode-enabled'));

            AwayModeButton.container.setAttribute('tt-away-mode-enabled', enabled);
            AwayModeButton.background?.setAttribute('style', `background:#${ ['387aff', 'f5009b'][+enabled] } !important;`);
            AwayModeButton.tooltip.innerHTML = `${ ['','Exit '][+enabled] }Away Mode (alt+a)`;

            SetQuality(['auto','low'][+enabled]);
            SaveCache({ AwayModeEnabled: enabled });
        };

        button.container.onmouseenter ??= event => {
            AwayModeButton.icon?.setAttribute('style', 'transform: translateX(0px) scale(1.2); transition: transform 300ms ease 0s');
        };

        button.container.onmouseleave ??= event => {
            AwayModeButton.icon?.setAttribute('style', 'transform: translateX(0px) scale(1); transition: transform 300ms ease 0s');
        };

        if(!defined(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_A))
            document.addEventListener('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_A = ({ key, altKey, ctrlKey, metaKey, shiftKey }) => {
                if(altKey && key == 'a')
                    $('#away-mode').click();
            });

        AwayModeButton = button;
    };
    Timers.away_mode = 2_500;

    Unhandlers.away_mode = () => {
        $('#away-mode')?.remove();
    };

    __AwayMode__:
    if(parseBool(Settings.away_mode)) {
        RegisterJob('away_mode');
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
    // /chat.js

    /*** First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon
     *      ______ _          _     _         _      _              _    _      _
     *     |  ____(_)        | |   (_)       | |    (_)            | |  | |    | |
     *     | |__   _ _ __ ___| |_   _ _ __   | |     _ _ __   ___  | |__| | ___| |_ __   ___ _ __ ___
     *     |  __| | | '__/ __| __| | | '_ \  | |    | | '_ \ / _ \ |  __  |/ _ \ | '_ \ / _ \ '__/ __|
     *     | |    | | |  \__ \ |_  | | | | | | |____| | | | |  __/ | |  | |  __/ | |_) |  __/ |  \__ \
     *     |_|    |_|_|  |___/\__| |_|_| |_| |______|_|_| |_|\___| |_|  |_|\___|_| .__/ \___|_|  |___/
     *                                                                           | |
     *                                                                           |_|
     */
    let FIRST_IN_LINE_JOB,                  // The current job (interval)
        FIRST_IN_LINE_HREF,                 // The upcoming HREF
        FIRST_IN_LINE_BOOST,                // The "Up Next Boost" toggle
        FIRST_IN_LINE_TIMER,                // The current time left before the job is accomplished
        FIRST_IN_LINE_PAUSED,               // The pause-state
        FIRST_IN_LINE_BALLOON,              // The balloon controller
        ALL_FIRST_IN_LINE_JOBS,             // All First in Line jobs
        FIRST_IN_LINE_WAIT_TIME,            // The wait time (from settings)
        FIRST_IN_LINE_LISTING_JOB,          // The job (interval) for listing all jobs (under the ballon)
        FIRST_IN_LINE_WARNING_JOB,          // The job for warning the user (via popup)
        FIRST_IN_LINE_SORTING_HANDLER,      // The Sortable object to handle the balloon
        FIRST_IN_LINE_WARNING_TEXT_UPDATE;  // Sub-job for the warning text

    let DO_NOT_AUTO_ADD = []; // List of names to ignore for auto-adding; the user already canceled the job

    // First in Line wait time
    FIRST_IN_LINE_WAIT_TIME = parseInt(
        parseBool(Settings.first_in_line)?
            Settings.first_in_line_time_minutes:
        parseBool(Settings.first_in_line_plus)?
            Settings.first_in_line_plus_time_minutes:
        parseBool(Settings.first_in_line_all)?
            Settings.first_in_line_all_time_minutes:
        0
    ) | 0;

    // Restart the First in line que's timers
        // REDO_FIRST_IN_LINE_QUEUE([href:string=URL]) -> undefined
    function REDO_FIRST_IN_LINE_QUEUE(href) {
        if(!defined(href) || FIRST_IN_LINE_HREF === href)
            return;

        href = parseURL(href).href;

        let channel = ALL_CHANNELS.find(channel => parseURL(channel.href).pathname == parseURL(href).pathname);

        if(!defined(channel))
            return ERROR(`Unable to create job for "${ href }"`);

        let { name } = channel;

        FIRST_IN_LINE_HREF = href;
        [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

        LOG(`Waiting ${ ConvertTime(FIRST_IN_LINE_TIMER | 0) } before leaving for "${ name }" -> ${ href }`, new Date);

        FIRST_IN_LINE_WARNING_JOB = setInterval(() => {
            if(FIRST_IN_LINE_PAUSED)
                return /* First in Line is paused */;
            // Don't act until 1min is left
            if(FIRST_IN_LINE_TIMER > 60_000)
                return;

            let existing = Popup.get(`Up Next \u2014 ${ name }`);

            if(!defined(STARTED_TIMERS.WARNING)) {
                STARTED_TIMERS.WARNING = true;

                LOG('Heading to stream in', ConvertTime(FIRST_IN_LINE_TIMER | 0), FIRST_IN_LINE_HREF, new Date);

                let popup = existing ?? new Popup(`Up Next \u2014 ${ name }`, `Heading to stream in \t${ ConvertTime(FIRST_IN_LINE_TIMER) }\t`, {
                    icon: ALL_CHANNELS.find(channel => channel.href === href)?.icon,
                    href: FIRST_IN_LINE_HREF,

                    onclick: event => {
                        SaveCache({ FIRST_IN_LINE_TIMER: FIRST_IN_LINE_WAIT_TIME * 60_000 });

                        $('#tt-popup')?.remove();
                    },

                    Hide: () => {
                        let existing = $('#tt-popup');

                        if(defined(existing))
                            existing.remove();
                    },

                    Cancel: () => {
                        let existing = $('#tt-popup'),
                            removal = $('button[connected-to][data-test-selector$="delete"i]'),
                            [thisJob] = ALL_FIRST_IN_LINE_JOBS;

                        if(defined(existing))
                            existing.remove();
                        LOG('Canceled First in Line event', thisJob);

                        removal?.click?.();

                        REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                    },
                });

                FIRST_IN_LINE_WARNING_TEXT_UPDATE = setInterval(() => {
                    if(FIRST_IN_LINE_PAUSED)
                        return /* First in Line is paused */;

                    if(defined(popup?.elements))
                        popup.elements.message.innerHTML
                            = popup.elements.message.innerHTML
                                .replace(/\t([^\t]+?)\t/i, ['\t', ConvertTime(FIRST_IN_LINE_TIMER, '!minute:!second'), '\t'].join(''));

                    if(FIRST_IN_LINE_TIMER < 1000) {
                        popup.remove();
                        clearInterval(FIRST_IN_LINE_WARNING_TEXT_UPDATE);
                    }
                }, 1000);
            }
        }, 1000);

        FIRST_IN_LINE_JOB = setInterval(() => {
            // If the channel disappears (or goes offline), kill the job for it
            let channel = ALL_CHANNELS.find(channel => channel.href == FIRST_IN_LINE_HREF);

            if(!defined(channel)) {
                LOG('Removing dead channel', FIRST_IN_LINE_HREF);

                update();

                let { pathname } = parseURL(FIRST_IN_LINE_HREF),
                    channelID = UUID.from(pathname).value;

                ALL_FIRST_IN_LINE_JOBS = [...new Set(ALL_FIRST_IN_LINE_JOBS)].filter(href => href != FIRST_IN_LINE_HREF).filter(defined);
                FIRST_IN_LINE_TIMER = FIRST_IN_LINE_WAIT_TIME * 60_000;

                SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_TIMER });

                return REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
            }

            if(FIRST_IN_LINE_PAUSED)
                return /* First in Line is paused */;
            // Save the current wait time (every 1sec)
            if((FIRST_IN_LINE_TIMER % 1000) === 0)
                SaveCache({ FIRST_IN_LINE_TIMER });
            // Don't act until 1sec is left
            if(FIRST_IN_LINE_TIMER > 1000)
                return FIRST_IN_LINE_TIMER -= 1000;

            /* After above is `false` */

            FIRST_IN_LINE_TIMER = FIRST_IN_LINE_WAIT_TIME * 60_000;
            SaveCache({ FIRST_IN_LINE_TIMER });

            LOG('Heading to stream now [Job Interval]', FIRST_IN_LINE_HREF);

            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);
            open(FIRST_IN_LINE_HREF, '_self');

            FIRST_IN_LINE_HREF = undefined;
        }, 1000);
    }

    if(NORMAL_MODE) {
        FIRST_IN_LINE_BALLOON = new Balloon({ title: 'Up Next', icon: 'stream' });

        // Up Next Boost Button
        let first_in_line_boost_button = FIRST_IN_LINE_BALLOON?.addButton({
            attributes: {
                id: 'up-next-boost'
            },

            icon: 'latest',
            onclick: event => {
                let { currentTarget } = event,
                    speeding = currentTarget.getAttribute('speeding') == 'true';

                speeding = !speeding;

                currentTarget.querySelector('svg[fill]')?.setAttribute('fill', `#${ ['dddb','e6cb00'][+speeding] }`);
                currentTarget.setAttribute('speeding', FIRST_IN_LINE_BOOST = speeding);

                currentTarget.tooltip.innerHTML = `${ ['Start','Stop'][+speeding] } Boost`;

                $('[up-next--container] button')?.setAttribute('style', `border-bottom: ${ +speeding }px solid var(--color-yellow)`);

                let oneMin = 60_000,
                    fiveMin = 5 * oneMin,
                    tenMin = 10 * oneMin;

                FIRST_IN_LINE_TIMER =
                    // If the streamer hasn't been on for longer than 10mins, wait until then
                    STREAMER.time < tenMin?
                        fiveMin + (tenMin - STREAMER.time):
                    // Streamer has been live longer than 10mins
                    (
                        // Boost is enabled
                        FIRST_IN_LINE_BOOST?
                            (
                                // Boost is enabled and the time left on "Up Next" is less than 5mins
                                (FIRST_IN_LINE_TIMER ?? fiveMin) < fiveMin?
                                    FIRST_IN_LINE_TIMER:
                                // ... greater than 5mins
                                fiveMin
                            ):
                        // Boost is disabled
                        FIRST_IN_LINE_WAIT_TIME * oneMin
                    );

                REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                $('[up-next--body] [time]', true).forEach(element => element.setAttribute('time', FIRST_IN_LINE_TIMER));

                SaveCache({ FIRST_IN_LINE_BOOST, FIRST_IN_LINE_WAIT_TIME });
            },
        });

        // Pause Button
        let first_in_line_pause_button = FIRST_IN_LINE_BALLOON?.addButton({
            attributes: {
                id: 'up-next-control'
            },

            icon: 'pause',
            onclick: event => {
                let { currentTarget } = event,
                    paused = currentTarget.getAttribute('paused') == 'true';

                paused = !paused;

                currentTarget.innerHTML = Glyphs[['pause','play'][+paused]];
                currentTarget.setAttribute('paused', FIRST_IN_LINE_PAUSED = paused);

                currentTarget.tooltip.innerHTML = `${ ['Pause','Continue'][+paused] } the timer`;
            },
        });

        // Help Button
        let first_in_line_help_button = FIRST_IN_LINE_BALLOON?.addButton({
            attributes: {
                id: 'up-next-help'
            },

            icon: 'help',
            left: true,
        });
        first_in_line_help_button.tooltip = new Tooltip(first_in_line_help_button, 'Drop a channel in the blue area to queue it');

        // Load cache
        await LoadCache(['ALL_FIRST_IN_LINE_JOBS', 'FIRST_IN_LINE_TIMER', 'FIRST_IN_LINE_BOOST'], cache => {
            ALL_FIRST_IN_LINE_JOBS = cache.ALL_FIRST_IN_LINE_JOBS ?? [];
            FIRST_IN_LINE_BOOST = parseBool(cache.FIRST_IN_LINE_BOOST) && ALL_FIRST_IN_LINE_JOBS.length > 0;
            FIRST_IN_LINE_TIMER = cache.FIRST_IN_LINE_TIMER ?? FIRST_IN_LINE_WAIT_TIME * 60_000;

            REMARK(`Up Next Boost is ${ ['dis','en'][+FIRST_IN_LINE_BOOST | 0] }abled`);

            if(FIRST_IN_LINE_BOOST) {
                let fiveMin = 300_000;

                FIRST_IN_LINE_TIMER = FIRST_IN_LINE_TIMER < fiveMin? FIRST_IN_LINE_TIMER: fiveMin;

                setTimeout(() => $('[up-next--body] [time]:not([index="0"])', true).forEach(element => element.setAttribute('time', fiveMin)), 5_000);

                SaveCache({ FIRST_IN_LINE_TIMER });
            }

            // Up Next Boost
            first_in_line_boost_button.setAttribute('speeding', FIRST_IN_LINE_BOOST);
            first_in_line_boost_button.querySelector('svg[fill]')?.setAttribute('fill', `#${ ['dddb','e6cb00'][+FIRST_IN_LINE_BOOST | 0] }`);
            first_in_line_boost_button.tooltip = new Tooltip(first_in_line_boost_button, `${ ['Start','Stop'][+FIRST_IN_LINE_BOOST | 0] } Boost`);

            $('[up-next--container] button')?.setAttribute('style', `border-bottom: ${ +FIRST_IN_LINE_BOOST | 0 }px solid var(--color-yellow)`);

            // Pause
            first_in_line_pause_button.tooltip = new Tooltip(first_in_line_pause_button, `Pause the timer`);
        });
    }

    if(defined(FIRST_IN_LINE_BALLOON)) {
        // FIRST_IN_LINE_BALLOON.header.closest('div').setAttribute('title', 'Drag a channel here to queue it');

        FIRST_IN_LINE_BALLOON.body.ondragover = event => {
            event.preventDefault();
            // event.dataTransfer.dropEffect = 'move';
        };

        FIRST_IN_LINE_BALLOON.body.ondrop = async event => {
            event.preventDefault();

            let streamer,
                // Did the event originate from within the ballon?
                from_container = !~event.path.slice(0, 5).indexOf(FIRST_IN_LINE_BALLOON.body);

            try {
                streamer = JSON.parse(event.dataTransfer.getData('application/tt-streamer'));
            } catch(error) {
                /* error suppression for sorting-related drops */;
                if(!from_container)
                    return ERROR(error);
            }

            if(from_container) {
                // Most likely a sorting event
            } else {
                let { href } = streamer;

                LOG('Adding to Up Next:', { href, streamer });

                // Jobs are unknown. Restart timer
                if(ALL_FIRST_IN_LINE_JOBS.length < 1)
                    FIRST_IN_LINE_TIMER = FIRST_IN_LINE_WAIT_TIME * 60_000;

                ALL_FIRST_IN_LINE_JOBS = [...new Set([...ALL_FIRST_IN_LINE_JOBS, href])];

                await SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_TIMER });

                REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
            }
        };

        FIRST_IN_LINE_BALLOON.icon.onmouseenter = event => {
            let { container, tooltip, title } = FIRST_IN_LINE_BALLOON,
                offset = getOffset(container);

            $('div#root > *').appendChild(
                furnish('div.tt-tooltip-layer.tooltip-layer', { style: `transform: translate(${ offset.left }px, ${ offset.top }px); width: 30px; height: 30px; z-index: 2000;` },
                    furnish('div', { 'aria-describedby': tooltip.id, 'class': 'tw-inline-flex tw-relative tw-tooltip-wrapper--show' },
                        furnish('div', { style: 'width: 30px; height: 30px;' }),
                        tooltip
                    )
                )
            );

            tooltip.setAttribute('style', 'display:block');
        };

        FIRST_IN_LINE_BALLOON.icon.onmouseleave = event => {
            $('div#root .tt-tooltip-layer.tooltip-layer')?.remove();

            FIRST_IN_LINE_BALLOON.tooltip.setAttribute('style', 'display:none');
        };

        FIRST_IN_LINE_SORTING_HANDLER = new Sortable(FIRST_IN_LINE_BALLOON.body, {
            animation: 150,
            draggable: '[name]',

            filter: '.tt-static',

            onUpdate: ({ oldIndex, newIndex }) => {
                // LOG('Old array', [...ALL_FIRST_IN_LINE_JOBS]);

                let [moved] = ALL_FIRST_IN_LINE_JOBS.splice(--oldIndex, 1);
                ALL_FIRST_IN_LINE_JOBS.splice(--newIndex, 0, moved);

                // LOG('New array', [...ALL_FIRST_IN_LINE_JOBS]);
                // LOG('Moved', { oldIndex, newIndex, moved });

                let channel = ALL_CHANNELS.find(channel => channel.href == ALL_FIRST_IN_LINE_JOBS[0]);

                if(!defined(channel))
                    return WARN('No channel found:', { oldIndex, newIndex, desiredChannel: channel });

                if([oldIndex, newIndex].contains(0)) {
                    LOG('New First in Line event:', channel);

                    FIRST_IN_LINE_TIMER = parseInt(
                        $(`[name="${ channel.name }"i]`).getAttribute('time')
                        ?? FIRST_IN_LINE_WAIT_TIME * 60_000
                    );

                    REDO_FIRST_IN_LINE_QUEUE(channel.href);
                    LOG('Redid First in Line queue [Sorting Handler]...', { FIRST_IN_LINE_TIMER: ConvertTime(FIRST_IN_LINE_TIMER, 'clock'), FIRST_IN_LINE_WAIT_TIME, FIRST_IN_LINE_HREF });
                }

                SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_TIMER });
            },
        });

        if(Settings.first_in_line_none)
            FIRST_IN_LINE_BALLOON.container.setAttribute('style', 'display:none!important');
        else
            FIRST_IN_LINE_LISTING_JOB = setInterval(() => {
                for(let index = 0, fails = 0; index < ALL_FIRST_IN_LINE_JOBS?.length; index++) {
                    let href = ALL_FIRST_IN_LINE_JOBS[index],
                        channel = ALL_CHANNELS.find(channel => parseURL(channel.href).href === href);

                    if(!defined(href) || !defined(channel)) {
                        ALL_FIRST_IN_LINE_JOBS.splice(index, 1);
                        SaveCache({ ALL_FIRST_IN_LINE_JOBS });

                        ++fails;

                        continue;
                    }

                    let { live, name } = channel;

                    let [balloon] = FIRST_IN_LINE_BALLOON?.add({
                        href,
                        src: channel.icon,
                        message: `${ name } <span style="display:${ live? 'none': 'inline-block' }">is ${ live? '': 'not ' }live</span>`,
                        subheader: `Coming up next`,
                        onremove: event => {
                            let index = ALL_FIRST_IN_LINE_JOBS.findIndex(href => event.href == href),
                                [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1);

                            LOG('Removed First in Line event:', removed, 'Was it canceled?', event.canceled);

                            if(event.canceled)
                                DO_NOT_AUTO_ADD.push(removed);

                            if(index > 0) {
                                SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_TIMER });
                            } else {
                                LOG('Destroying current job [Job Listings]...', { FIRST_IN_LINE_HREF, FIRST_IN_LINE_TIMER });

                                [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                                FIRST_IN_LINE_HREF = undefined;
                                FIRST_IN_LINE_TIMER = FIRST_IN_LINE_WAIT_TIME * 60_000;
                                SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_TIMER });
                            }
                        },

                        attributes: {
                            name,
                            live,
                            index,
                            time: (index < 1? FIRST_IN_LINE_TIMER: FIRST_IN_LINE_WAIT_TIME * 60_000),

                            style: (live? '': 'opacity: 0.3!important'),
                        },

                        animate: container => {
                            let subheader = $('.tt-balloon-subheader', false, container);

                            return setInterval(() => {
                                if(FIRST_IN_LINE_PAUSED)
                                    return /* First in Line is paused */;

                                let channel = (ALL_CHANNELS.find(channel => channel.name == container.getAttribute('name')) ?? {}),
                                    { name, live } = channel;

                                let time = parseInt(container.getAttribute('time')),
                                    intervalID = parseInt(container.getAttribute('animationID')),
                                    index = $('[id][guid][uuid]', true, container.parentElement).indexOf(container);

                                if(time < 60_000 && !defined(FIRST_IN_LINE_HREF)) {
                                    FIRST_IN_LINE_TIMER = time;

                                    WARN('Creating job to avoid [Job Listing] mitigation event', channel);

                                    return REDO_FIRST_IN_LINE_QUEUE(channel.href);
                                }

                                if(time < 0)
                                    setTimeout(() => {
                                        LOG('Mitigation event for [Job Listings]', { ALL_FIRST_IN_LINE_JOBS: [...new Set(ALL_FIRST_IN_LINE_JOBS)], FIRST_IN_LINE_TIMER, FIRST_IN_LINE_HREF }, new Date);
                                        // Mitigate 0 time bug?

                                        FIRST_IN_LINE_TIMER = FIRST_IN_LINE_WAIT_TIME * 60_000;
                                        SaveCache({ FIRST_IN_LINE_TIMER });

                                        open($('a', false, container)?.href ?? '?', '_self');
                                        return clearInterval(intervalID);
                                    }, 5000);

                                container.setAttribute('time', time - (index > 0? 0: 1000));

                                if(container.getAttribute('index') != index)
                                    container.setAttribute('index', index);

                                let theme = { light: 'w', dark: 'b' }[THEME];

                                $('a', false, container)
                                    .setAttribute('style', `background-color: var(--color-opac-${theme}-${ index > 15? 1: 15 - index })`);

                                if(container.getAttribute('live') != (live + '')) {
                                    $('.tt-balloon-message', false, container).innerHTML =
                                        `${ name } <span style="display:${ live? 'none': 'inline-block' }">is ${ live? '': 'not ' }live</span>`;
                                    container.setAttribute('style', (live? '': 'opacity: 0.3!important'));
                                    container.setAttribute('live', live);
                                }

                                subheader.innerHTML = index > 0? `${ nth(index + 1) } in line`: ConvertTime(time, 'clock');
                            }, 1000);
                        },
                    })
                        ?? [];
                }

                FIRST_IN_LINE_BALLOON.counter.setAttribute('length', [...new Set([...ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_HREF])].filter(defined).length);
            }, 1000);

        STREAMER.onraid = STREAMER.onhost = ({ hosting = false, raiding = false, raided = false, next }) => {
            LOG('Resetting timer. Reason:', { hosting, raiding, raided }, 'Moving onto:', next);

            FIRST_IN_LINE_TIMER = FIRST_IN_LINE_WAIT_TIME * 60_000;
            SaveCache({ FIRST_IN_LINE_TIMER });
        };
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
    let HANDLED_NOTIFICATIONS = [],
        STARTED_TIMERS = {};

    Handlers.first_in_line = (ActionableNotification) => {
        let notifications = $('[data-test-selector="onsite-notifications-toast-manager"i] [data-test-selector^="onsite-notification-toast"i]', true);

        for(let notification of [ActionableNotification, ...notifications].filter(defined)) {
            let action = (
                notification instanceof Element?
                    $('a[href^="/"]', false, notification):
                notification
            );

            if(!defined(action))
                continue;

            let { href, pathname } = parseURL(action.href),
                { innerText } = action,
                uuid = UUID.from(innerText).value;

            if(HANDLED_NOTIFICATIONS.contains(uuid))
                continue;
            HANDLED_NOTIFICATIONS.push(uuid);

            if(DO_NOT_AUTO_ADD.contains(href))
                continue;

            if(!/([^]+? +)(go(?:ing)?|is|went) +live\b/i.test(innerText))
                continue;

            LOG('Recieved an actionable notification:', innerText, new Date);

            if(defined(FIRST_IN_LINE_HREF)) {
                if(![...ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_HREF].contains(href)) {
                    LOG('Pushing to First in Line:', href, new Date);

                    ALL_FIRST_IN_LINE_JOBS = [...new Set([...ALL_FIRST_IN_LINE_JOBS, href])];
                } else {
                    WARN('Not pushing to First in Line:', href, new Date);
                    LOG('Reason?', [FIRST_IN_LINE_JOB, ...ALL_FIRST_IN_LINE_JOBS],
                        'It is the next job:', FIRST_IN_LINE_HREF === href,
                        'It is in the queue already:', ALL_FIRST_IN_LINE_JOBS.contains(href),
                    );
                }

                // To wait, or not to wait
                SaveCache({ ALL_FIRST_IN_LINE_JOBS });

                continue;
            } else {
                LOG('Pushing to First in Line (no contest):', href, new Date);

                // Add the new job (and prevent duplicates)
                ALL_FIRST_IN_LINE_JOBS = [...new Set([...ALL_FIRST_IN_LINE_JOBS, href])];

                // To wait, or not to wait
                SaveCache({ ALL_FIRST_IN_LINE_JOBS });

                REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
            }

            AddBalloon: {
                update();

                let channel = ALL_CHANNELS.find(channel => parseURL(channel.href).href === href);
                let index = ALL_FIRST_IN_LINE_JOBS.indexOf(href);

                if(!defined(channel))
                    continue;

                let { live, name } = channel;

                index = index < 0? ALL_FIRST_IN_LINE_JOBS.length: index;

                let [balloon] = FIRST_IN_LINE_BALLOON?.add({
                    href,
                    src: channel.icon,
                    message: `${ name } <span style="display:${ live? 'none': 'inline-block' }">is ${ live? '': 'not ' }live</span>`,
                    subheader: `Coming up next`,
                    onremove: event => {
                        let index = ALL_FIRST_IN_LINE_JOBS.findIndex(href => event.href == href),
                            [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1);

                        LOG('Removed from First in Line:', removed, 'Was it canceled?', event.canceled);

                        if(event.canceled)
                            DO_NOT_AUTO_ADD.push(removed);

                        if(index > 0) {
                            SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_TIMER });
                        } else {
                            LOG('Destroying current job [First in Line]...', { FIRST_IN_LINE_HREF, FIRST_IN_LINE_TIMER });

                            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                            FIRST_IN_LINE_HREF = undefined;
                            FIRST_IN_LINE_TIMER = FIRST_IN_LINE_WAIT_TIME * 60_000;
                            SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_TIMER });
                        }
                    },

                    attributes: {
                        name,
                        live,
                        index,
                        time: (index < 1? FIRST_IN_LINE_TIMER: FIRST_IN_LINE_WAIT_TIME * 60_000),

                        style: (live? '': 'opacity: 0.3!important'),
                    },

                    animate: container => {
                        let subheader = $('.tt-balloon-subheader', false, container);

                        return setInterval(() => {
                            if(FIRST_IN_LINE_PAUSED)
                                return /* First in Line is paused */;

                            let channel = (ALL_CHANNELS.find(channel => channel.name == container.getAttribute('name')) ?? {}),
                                { name, live } = channel;

                            let time = parseInt(container.getAttribute('time')),
                                intervalID = parseInt(container.getAttribute('animationID')),
                                index = $('[id][guid][uuid]', true, container.parentElement).indexOf(container);

                            if(time < 60_000 && !defined(FIRST_IN_LINE_HREF)) {
                                FIRST_IN_LINE_TIMER = time;

                                WARN('Creating job to avoid [First in Line] mitigation event', channel);

                                return REDO_FIRST_IN_LINE_QUEUE(channel.href);
                            }

                            if(time < 0)
                                setTimeout(() => {
                                    LOG('Mitigation event from [First in Line]', { ALL_FIRST_IN_LINE_JOBS: [...ALL_FIRST_IN_LINE_JOBS], FIRST_IN_LINE_TIMER, FIRST_IN_LINE_HREF }, new Date);
                                    // Mitigate 0 time bug?

                                    FIRST_IN_LINE_TIMER = FIRST_IN_LINE_WAIT_TIME * 60_000;
                                    SaveCache({ FIRST_IN_LINE_TIMER });

                                    open($('a', false, container)?.href ?? '?', '_self');
                                    return clearInterval(intervalID);
                                }, 5000);

                            container.setAttribute('time', time - (index > 0? 0: 1000));

                            if(container.getAttribute('index') != index)
                                container.setAttribute('index', index);

                            let theme = { light: 'w', dark: 'b' }[THEME];

                            $('a', false, container)
                                .setAttribute('style', `background-color: var(--color-opac-${theme}-${ index > 15? 1: 15 - index })`);

                            if(container.getAttribute('live') != (live + '')) {
                                $('.tt-balloon-message', false, container).innerHTML =
                                    `${ name } <span style="display:${ live? 'none': 'inline-block' }">is ${ live? '': 'not ' }live</span>`;
                                container.setAttribute('style', (live? '': 'opacity: 0.3!important'));
                                container.setAttribute('live', live);
                            }

                            subheader.innerHTML = index > 0? `${ nth(index + 1) } in line`: ConvertTime(time, 'clock');
                        }, 1000);
                    },
                })
                    ?? [];

                if(defined(FIRST_IN_LINE_WAIT_TIME) && !defined(FIRST_IN_LINE_HREF)) {
                    REDO_FIRST_IN_LINE_QUEUE(href);
                    LOG('Redid First in Line queue [First in Line]...', { FIRST_IN_LINE_TIMER: ConvertTime(FIRST_IN_LINE_TIMER, 'clock'), FIRST_IN_LINE_WAIT_TIME, FIRST_IN_LINE_HREF });
                } else if(Settings.first_in_line_none) {
                    let existing = $('#tt-popup');

                    if(defined(existing))
                        existing.remove();

                    LOG('Heading to stream now [First in Line] is OFF', FIRST_IN_LINE_HREF);

                    [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);
                    open(FIRST_IN_LINE_HREF, '_self');

                    FIRST_IN_LINE_HREF = undefined;
                }
            }
        }

        FIRST_IN_LINE_BOOST &&= ALL_FIRST_IN_LINE_JOBS.length > 0;

        let filb = $('[speeding]');

        if(parseBool(filb?.getAttribute('speeding')) != parseBool(FIRST_IN_LINE_BOOST))
            filb?.click?.();
    };
    Timers.first_in_line = 1000;

    Unhandlers.first_in_line = () => {
        if(defined(FIRST_IN_LINE_JOB))
            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

        if(defined(FIRST_IN_LINE_HREF))
            FIRST_IN_LINE_HREF = '?';

        ALL_FIRST_IN_LINE_JOBS = [];
        FIRST_IN_LINE_TIMER = FIRST_IN_LINE_WAIT_TIME * 60_000;

        SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_TIMER });
    };

    __FirstInLine__:
    if(parseBool(Settings.first_in_line) || parseBool(Settings.first_in_line_plus) || parseBool(Settings.first_in_line_all)) {
        await LoadCache(['ALL_FIRST_IN_LINE_JOBS', 'FIRST_IN_LINE_TIMER', 'FIRST_IN_LINE_BOOST'], cache => {
            ALL_FIRST_IN_LINE_JOBS = cache.ALL_FIRST_IN_LINE_JOBS ?? [];
            FIRST_IN_LINE_BOOST = parseBool(cache.FIRST_IN_LINE_BOOST) && ALL_FIRST_IN_LINE_JOBS.length > 0;
            FIRST_IN_LINE_TIMER = cache.FIRST_IN_LINE_TIMER ?? FIRST_IN_LINE_WAIT_TIME * 60_000;
        });

        RegisterJob('first_in_line');

        // Controls what's listed under the Up Next balloon
        if(!defined(FIRST_IN_LINE_HREF) && ALL_FIRST_IN_LINE_JOBS.length) {
            let [href] = ALL_FIRST_IN_LINE_JOBS,
                channel = ALL_CHANNELS.filter(isLive).filter(channel => channel.href !== STREAMER.href).find(channel => parseURL(channel.href).pathname === parseURL(href).pathname);

            if(!defined(channel)) {
                let index = ALL_FIRST_IN_LINE_JOBS.findIndex(job => job == href),
                    [killed]  = ALL_FIRST_IN_LINE_JOBS.splice(index, 1);

                SaveCache({ ALL_FIRST_IN_LINE_JOBS });

                WARN(`The First in Line job for "${ href }" no longer exists`, killed);

                break __FirstInLine__;
            } else {
                Handlers.first_in_line({ href, innerText: `${ channel.name } is live [First in Line]` });

                WARN('Forcing queue update for', href);
                REDO_FIRST_IN_LINE_QUEUE(href);
            }
        }
    }

    /*** First in Line+ (on creation)
     *      ______ _          _     _         _      _
     *     |  ____(_)        | |   (_)       | |    (_)             _
     *     | |__   _ _ __ ___| |_   _ _ __   | |     _ _ __   ___ _| |_
     *     |  __| | | '__/ __| __| | | '_ \  | |    | | '_ \ / _ \_   _|
     *     | |    | | |  \__ \ |_  | | | | | | |____| | | | |  __/ |_|
     *     |_|    |_|_|  |___/\__| |_|_| |_| |______|_|_| |_|\___|
     *
     *
     */
    let OLD_STREAMERS, NEW_STREAMERS, BAD_STREAMERS, ON_INSTALLED_REASON;

    await LoadCache(['OLD_STREAMERS', 'BAD_STREAMERS'], cache => {
        OLD_STREAMERS = cache.OLD_STREAMERS ?? "";
        BAD_STREAMERS = cache.BAD_STREAMERS ?? "";
    });

    Handlers.first_in_line_plus = () => {
        let streamers = [...new Set([...STREAMERS, STREAMER].filter(isLive).map(streamer => streamer.name))].sort();

        NEW_STREAMERS = streamers.join(',').toLowerCase();

        if(!defined(OLD_STREAMERS))
            OLD_STREAMERS = NEW_STREAMERS;

        let old_names = OLD_STREAMERS.split(',').filter(defined),
            new_names = NEW_STREAMERS.split(',').filter(defined),
            bad_names = BAD_STREAMERS?.split(',')?.filter(defined)?.filter(parseBool);

        // Detect if the channels got removed incorrectly?
        if(bad_names?.length) {
            WARN('Twitch failed to add these channels correctly:', bad_names);

            BAD_STREAMERS = "";

            SaveCache({ BAD_STREAMERS });
        } else if(!defined($('[role="group"i][aria-label*="followed"i] a[class*="side-nav-card"]'))) {
            WARN('"Followed Channels" is missing. Reloading...');

            SaveCache({ BAD_STREAMERS: OLD_STREAMERS });

            // Failed to get channel at...
            PushToTopSearch({ 'tt-ftgca': (+new Date).toString(36) });
        }

        if(OLD_STREAMERS == NEW_STREAMERS)
            return SaveCache({ OLD_STREAMERS });

        new_names = new_names
            .filter(name => !old_names.contains(name))
            .filter(name => !bad_names.contains(name));

        if(new_names.length < 1)
            return SaveCache({ OLD_STREAMERS });

        // Try to detect if the extension was just re-installed?
        installation_viewer:
        switch(ON_INSTALLED_REASON ||= Settings.onInstalledReason) {
            case CHROME_UPDATE:
            case SHARED_MODULE_UPDATE:
                // Not used. Ignore
                break;

            case INSTALL:
                // Ignore all current streamers; otherwise this will register them all
                new_names = [];
                break;

            case UPDATE:
            default:
                // Should function normally
                break;
        }

        creating_new_events:
        for(let name of new_names) {
            // TODID? `STREAMERS` -> `ALL_CHANNELS`
            let streamer = STREAMERS.find(streamer => RegExp(name, 'i').test(streamer.name)),
                { searchParameters } = parseURL(location.href);

            if(!defined(streamer) || searchParameters.obit == streamer.name)
                continue creating_new_events;

            let { href } = streamer;

            if(!defined(streamer?.name?.length))
                continue creating_new_events;

            LOG('A channel just appeared:', name, new Date);

            Handlers.first_in_line({ href, innerText: `${ name } is live [First in Line+]` });
        }

        OLD_STREAMERS = NEW_STREAMERS;

        SaveCache({ OLD_STREAMERS });
    };
    Timers.first_in_line_plus = 1000;

    Unhandlers.first_in_line_plus = Unhandlers.first_in_line;

    __FirstInLinePlus__:
    if(parseBool(Settings.first_in_line_plus) || parseBool(Settings.first_in_line_all)) {
        RegisterJob('first_in_line_plus');
    }

    /*** Auto-Follow
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
        if(!defined(STREAMER))
            return;

        let url = parseURL(top.location),
            data = url.searchParameters;

        let { like, follow } = STREAMER,
            raid = data.referrer === 'raid';

        if(!like && raid)
            follow();
    };
    Timers.auto_follow_raids = 1000;

    __AutoFollowRaid__:
    if(parseBool(Settings.auto_follow_raids) || parseBool(Settings.auto_follow_all)) {
        RegisterJob('auto_follow_raids');
    }

    let AUTO_FOLLOW_EVENT;
    Handlers.auto_follow_time = async() => {
        let { like, follow } = STREAMER,
            mins = parseInt(Settings.auto_follow_time_minutes) | 0;

        if(!like) {
            await LoadCache(['WatchTime'], ({ WatchTime = 0 }) => {
                let watch_time = $('#tt-watch-time'),
                    secs = parseInt(watch_time?.getAttribute('time')) | 0;

                if(!defined(watch_time))
                    return;

                if(secs > (mins * 60))
                    follow();
            });

            AUTO_FOLLOW_EVENT ??= setTimeout(follow, mins * 60_000);
        }
    };
    Timers.auto_follow_time = 1000;

    __AutoFollowTime__:
    if(parseBool(Settings.auto_follow_time) || parseBool(Settings.auto_follow_all)) {
        RegisterJob('auto_follow_time');
    }

    /*** Kill Extensions
     *      _  ___ _ _   ______      _                 _
     *     | |/ (_) | | |  ____|    | |               (_)
     *     | ' / _| | | | |__  __  _| |_ ___ _ __  ___ _  ___  _ __  ___
     *     |  < | | | | |  __| \ \/ / __/ _ \ '_ \/ __| |/ _ \| '_ \/ __|
     *     | . \| | | | | |____ >  <| ||  __/ | | \__ \ | (_) | | | \__ \
     *     |_|\_\_|_|_| |______/_/\_\\__\___|_| |_|___/_|\___/|_| |_|___/
     *
     *
     */
    Handlers.kill_extensions = () => {
        let extension_views = $('[class^="extension-view"i]', true);

        for(let view of extension_views)
            view.setAttribute('style', 'display:none!important');
    };
    Timers.kill_extensions = 5000;

    Unhandlers.kill_extensions = () => {
        let extension_views = $('[class^="extension-view"i]', true);

        for(let view of extension_views)
            view.removeAttribute('style');
    };

    __KillExtensions__:
    if(parseBool(Settings.kill_extensions)) {
        RegisterJob('kill_extensions');
    }

    /*** Stop Hosting
     *       _____ _                _    _           _   _
     *      / ____| |              | |  | |         | | (_)
     *     | (___ | |_ ___  _ __   | |__| | ___  ___| |_ _ _ __   __ _
     *      \___ \| __/ _ \| '_ \  |  __  |/ _ \/ __| __| | '_ \ / _` |
     *      ____) | || (_) | |_) | | |  | | (_) \__ \ |_| | | | | (_| |
     *     |_____/ \__\___/| .__/  |_|  |_|\___/|___/\__|_|_| |_|\__, |
     *                     | |                                    __/ |
     *                     |_|                                   |___/
     */
    Handlers.prevent_hosting = async() => {
        let hosting = defined($('[data-a-target="hosting-indicator"i], [class*="channel-status-info--hosting"]')),
            next = await GetNextStreamer(),
            [guest, host] = $('[href^="/"] h1, [href^="/"] > p, [data-a-target="hosting-indicator"i]', true);

        guest = guest?.innerText ?? $('[data-a-target="hosting-indicator"i]')?.innerText ?? "anonymous";
        host = host?.innerText ?? STREAMER.name;

        host_stopper:
        if(hosting) {
            // Ignore followed channels
            if(["unfollowed"].contains(Settings.prevent_hosting)) {
                let streamer = STREAMERS.find(channel => RegExp(`^${guest}$`, 'i').test(channel.name));

                // The channel being hosted (guest) is already in "followed." No need to leave
                if(defined(streamer)) {
                    LOG(`[HOSTING] ${ guest } is already followed. Just head to the channel`);

                    open(streamer.href, '_self');
                    break host_stopper;
                }
            }

            STREAMER.__eventlisteners__.onhost.forEach(job => job({ hosting, next }));

            if(defined(next)) {
                LOG(`${ host } is hosting ${ guest }. Moving onto next channel (${ next.name })`, next.href, new Date);

                open(next.href, '_self');
            } else {
                LOG(`${ host } is hosting ${ guest }. There doesn't seem to be any followed channels on right now`, new Date);
            }
        }
    };
    Timers.prevent_hosting = 5_000;

    __PreventHosting__:
    if(Settings.prevent_hosting != "none") {
        RegisterJob('prevent_hosting');
    }

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
    let CONTINUE_RAIDING = false;

    Handlers.prevent_raiding = async() => {
        if(CONTINUE_RAIDING)
            return;

        let url = parseURL(top.location),
            data = url.searchParameters,
            raided = data.referrer === 'raid',
            raiding = defined($('[data-test-selector="raid-banner"i]')),
            next = await GetNextStreamer(),
            [from, to] = $('[data-test-selector="raid-banner"i] strong', true);

        from = from?.innerText;
        to = to?.innerText ?? STREAMER.name;

        let method = Settings.prevent_raiding ?? "none";

        raid_stopper:
        if(raiding || raided) {
            top.onlocationchange = () => setTimeout(() => CONTINUE_RAIDING = false, 5_000);

            // Ignore followed channels
            if(["greed", "unfollowed"].contains(method)) {
                // #1
                // Collect the channel points by participating in the raid, then leave
                // #3 should fire automatically after the page has successfully loaded
                if(method == "greed" && raiding) {
                    LOG(`[RAIDING] There is a possiblity to collect bonus points. Do not leave the raid.`, parseURL(`${ location.origin }/${ to }`).pushToSearch({ referrer: 'raid' }, true).href);

                    CONTINUE_RAIDING = true;
                    break raid_stopper;
                }
                // #2
                // The channel being raided (to) is already in "followed." No need to leave
                else if(raiding && defined(STREAMERS.find(channel => RegExp(`^${to}$`, 'i').test(channel.name)))) {
                    LOG(`[RAIDING] ${ to } is already followed. No need to leave the raid`);

                    CONTINUE_RAIDING = true;
                    break raid_stopper;
                }
                // #3
                // The channel that was raided (to) is already in "followed." No need to leave
                else if(raided && STREAMER.like) {
                    LOG(`[RAIDED] ${ to } is already followed. No need to abort the raid`);

                    CONTINUE_RAIDING = true;
                    // RemoveFromTopSearch(['referrer']);
                    break raid_stopper;
                }
            }

            let leaveStream = () => {
                CONTINUE_RAIDING = false;

                STREAMER.__eventlisteners__.onraid.forEach(job => job({ raided, raiding, next }));

                if(defined(next)) {
                    LOG(`${ STREAMER.name } ${ raiding? 'is raiding': 'was raided' }. Moving onto next channel (${ next.name })`, next.href, new Date);

                    open(next.href, '_self');
                } else {
                    LOG(`${ STREAMER.name } ${ raiding? 'is raiding': 'was raided' }. There doesn't seem to be any followed channels on right now`, new Date);
                }
            };

            CONTINUE_RAIDING = !!setTimeout(leaveStream, 120_000 * +["greed"].contains(method));
        }
    };
    Timers.prevent_raiding = 15_000;

    __PreventRaiding__:
    if(Settings.prevent_raiding != "none") {
        RegisterJob('prevent_raiding');
    }

    /*** Stay Live
     *       _____ _                _      _
     *      / ____| |              | |    (_)
     *     | (___ | |_ __ _ _   _  | |     ___   _____
     *      \___ \| __/ _` | | | | | |    | \ \ / / _ \
     *      ____) | || (_| | |_| | | |____| |\ V /  __/
     *     |_____/ \__\__,_|\__, | |______|_| \_/ \___|
     *                       __/ |
     *                      |___/
     */
    let ClearIntent;

    Handlers.stay_live = async() => {
        let online = STREAMERS.filter(isLive),
            next = await GetNextStreamer(),
            { pathname } = top.location;

        let Paths = [USERNAME, '$', '[up]/', 'directory', 'downloads?', 'friends?', 'inventory', 'jobs?', 'moderator', 'search', 'settings', 'subscriptions?', 'team', 'turbo', 'user', 'videos?', 'wallet', 'watchparty'];

        try {
            await LoadCache('UserIntent', async({ UserIntent }) => {
                if(parseBool(UserIntent))
                    Paths.push(UserIntent);

                await RemoveCache('UserIntent');
            });
        } catch(error) {
            return RemoveCache('UserIntent');
        }

        let ValidTwitchPath = RegExp(`/(${ Paths.join('|') })`, 'i');

        IsLive:
        if(!STREAMER.live) {
            if(!RegExp(STREAMER.name, 'i').test(PATHNAME))
                break IsLive;

            if(!ValidTwitchPath.test(pathname)) {
                if(online.length) {
                    WARN(`${ STREAMER.name } is no longer live. Moving onto next channel (${ next.name })`, next.href, new Date);

                    REDO_FIRST_IN_LINE_QUEUE( parseURL(FIRST_IN_LINE_HREF)?.pushToSearch?.({ from: STREAMER.name })?.href );

                    open(`${ next.href }?obit=${ STREAMER.name }`, '_self');
                } else  {
                    WARN(`${ STREAMER.name } is no longer live. There doesn't seem to be any followed channels on right now`, new Date);
                }
            }

            // After 30 seconds, remove the intent
            ClearIntent ??= setTimeout(() => RemoveCache('UserIntent'), 30_000);
        } else if(/\/search\b/i.test(pathname)) {
            let { term } = parseURL(location).searchParameters;

            await SaveCache({ UserIntent: term });
        }
    };
    Timers.stay_live = 7_000;

    __StayLive__:
    if(parseBool(Settings.stay_live)) {
        RegisterJob('stay_live');
    }

    /*** Chat & Messaging
     *       _____ _           _              __  __                           _
     *      / ____| |         | |     ___    |  \/  |                         (_)
     *     | |    | |__   __ _| |_   ( _ )   | \  / | ___  ___ ___  __ _  __ _ _ _ __   __ _
     *     | |    | '_ \ / _` | __|  / _ \/\ | |\/| |/ _ \/ __/ __|/ _` |/ _` | | '_ \ / _` |
     *     | |____| | | | (_| | |_  | (_>  < | |  | |  __/\__ \__ \ (_| | (_| | | | | | (_| |
     *      \_____|_| |_|\__,_|\__|  \___/\/ |_|  |_|\___||___/___/\__,_|\__, |_|_| |_|\__, |
     *                                                                    __/ |         __/ |
     *                                                                   |___/         |___/
     */
    /*** Emote Searching - NOT A SETTING. This is a hlper for "Convert Emotes" and "BTTV Emotes"
     *      ______                 _          _____                     _     _
     *     |  ____|               | |        / ____|                   | |   (_)
     *     | |__   _ __ ___   ___ | |_ ___  | (___   ___  __ _ _ __ ___| |__  _ _ __   __ _
     *     |  __| | '_ ` _ \ / _ \| __/ _ \  \___ \ / _ \/ _` | '__/ __| '_ \| | '_ \ / _` |
     *     | |____| | | | | | (_) | ||  __/  ____) |  __/ (_| | | | (__| | | | | | | | (_| |
     *     |______|_| |_| |_|\___/ \__\___| |_____/ \___|\__,_|_|  \___|_| |_|_|_| |_|\__, |
     *                                                                                 __/ |
     *                                                                                |___/
     */
    // /chat.js

    /*** BetterTTV Emotes
     *      ____       _   _         _______ _________      __  ______                 _
     *     |  _ \     | | | |       |__   __|__   __\ \    / / |  ____|               | |
     *     | |_) | ___| |_| |_ ___ _ __| |     | |   \ \  / /  | |__   _ __ ___   ___ | |_ ___  ___
     *     |  _ < / _ \ __| __/ _ \ '__| |     | |    \ \/ /   |  __| | '_ ` _ \ / _ \| __/ _ \/ __|
     *     | |_) |  __/ |_| ||  __/ |  | |     | |     \  /    | |____| | | | | | (_) | ||  __/\__ \
     *     |____/ \___|\__|\__\___|_|  |_|     |_|      \/     |______|_| |_| |_|\___/ \__\___||___/
     *
     *
     */
    // /chat.js

    /*** Convert Emotes
     *       _____                          _     ______                 _
     *      / ____|                        | |   |  ____|               | |
     *     | |     ___  _ ____   _____ _ __| |_  | |__   _ __ ___   ___ | |_ ___  ___
     *     | |    / _ \| '_ \ \ / / _ \ '__| __| |  __| | '_ ` _ \ / _ \| __/ _ \/ __|
     *     | |___| (_) | | | \ V /  __/ |  | |_  | |____| | | | | | (_) | ||  __/\__ \
     *      \_____\___/|_| |_|\_/ \___|_|   \__| |______|_| |_| |_|\___/ \__\___||___/
     *
     *
     */
    // /chat.js

    /*** Filter Messages
     *      ______ _ _ _              __  __
     *     |  ____(_) | |            |  \/  |
     *     | |__   _| | |_ ___ _ __  | \  / | ___  ___ ___  __ _  __ _  ___  ___
     *     |  __| | | | __/ _ \ '__| | |\/| |/ _ \/ __/ __|/ _` |/ _` |/ _ \/ __|
     *     | |    | | | ||  __/ |    | |  | |  __/\__ \__ \ (_| | (_| |  __/\__ \
     *     |_|    |_|_|\__\___|_|    |_|  |_|\___||___/___/\__,_|\__, |\___||___/
     *                                                            __/ |
     *                                                           |___/
     */
    // /chat.js

    /*** Easy Filter - NOT A SETTING. This is a helper for "Message Filter"
     *      ______                  ______ _ _ _
     *     |  ____|                |  ____(_) | |
     *     | |__   __ _ ___ _   _  | |__   _| | |_ ___ _ __
     *     |  __| / _` / __| | | | |  __| | | | __/ _ \ '__|
     *     | |___| (_| \__ \ |_| | | |    | | | ||  __/ |
     *     |______\__,_|___/\__, | |_|    |_|_|\__\___|_|
     *                       __/ |
     *                      |___/
     */
    // /chat.js

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
    // /chat.js

    /*** Message Highlighter - Popup
     *      __  __                                  _    _ _       _     _ _       _     _                       _____
     *     |  \/  |                                | |  | (_)     | |   | (_)     | |   | |                     |  __ \
     *     | \  / | ___  ___ ___  __ _  __ _  ___  | |__| |_  __ _| |__ | |_  __ _| |__ | |_ ___ _ __   ______  | |__) |__  _ __  _   _ _ __
     *     | |\/| |/ _ \/ __/ __|/ _` |/ _` |/ _ \ |  __  | |/ _` | '_ \| | |/ _` | '_ \| __/ _ \ '__| |______| |  ___/ _ \| '_ \| | | | '_ \
     *     | |  | |  __/\__ \__ \ (_| | (_| |  __/ | |  | | | (_| | | | | | | (_| | | | | ||  __/ |             | |  | (_) | |_) | |_| | |_) |
     *     |_|  |_|\___||___/___/\__,_|\__, |\___| |_|  |_|_|\__, |_| |_|_|_|\__, |_| |_|\__\___|_|             |_|   \___/| .__/ \__,_| .__/
     *                                  __/ |                 __/ |           __/ |                                        | |         | |
     *                                 |___/                 |___/           |___/                                         |_|         |_|
     */
    // /chat.js

    /*** Native Twitch Reply
     *      _   _       _   _             _______       _ _       _       _____            _
     *     | \ | |     | | (_)           |__   __|     (_) |     | |     |  __ \          | |
     *     |  \| | __ _| |_ ___   _____     | |_      ___| |_ ___| |__   | |__) |___ _ __ | |_   _
     *     | . ` |/ _` | __| \ \ / / _ \    | \ \ /\ / / | __/ __| '_ \  |  _  // _ \ '_ \| | | | |
     *     | |\  | (_| | |_| |\ V /  __/    | |\ V  V /| | || (__| | | | | | \ \  __/ |_) | | |_| |
     *     |_| \_|\__,_|\__|_| \_/ \___|    |_| \_/\_/ |_|\__\___|_| |_| |_|  \_\___| .__/|_|\__, |
     *                                                                              | |       __/ |
     *                                                                              |_|      |___/
     */
    // /chat.js

    /*** Prevent spam
     *      _____                          _      _____
     *     |  __ \                        | |    / ____|
     *     | |__) | __ _____   _____ _ __ | |_  | (___  _ __   __ _ _ __ ___
     *     |  ___/ '__/ _ \ \ / / _ \ '_ \| __|  \___ \| '_ \ / _` | '_ ` _ \
     *     | |   | | |  __/\ V /  __/ | | | |_   ____) | |_) | (_| | | | | | |
     *     |_|   |_|  \___| \_/ \___|_| |_|\__| |_____/| .__/ \__,_|_| |_| |_|
     *                                                 | |
     *                                                 |_|
     */
    // /chat.js

    /*** Whisper Audio
     *     __          ___     _                                         _ _
     *     \ \        / / |   (_)                         /\            | (_)
     *      \ \  /\  / /| |__  _ ___ _ __   ___ _ __     /  \  _   _  __| |_  ___
     *       \ \/  \/ / | '_ \| / __| '_ \ / _ \ '__|   / /\ \| | | |/ _` | |/ _ \
     *        \  /\  /  | | | | \__ \ |_) |  __/ |     / ____ \ |_| | (_| | | (_) |
     *         \/  \/   |_| |_|_|___/ .__/ \___|_|    /_/    \_\__,_|\__,_|_|\___/
     *                              | |
     *                              |_|
     */
    let NOTIFIED = 0,
        NOTIFICATION_SOUND =
            furnish('audio#twich-tools-notification-sound',
                {
                    style: 'display:none',

                    innerHTML: ['mp3', 'ogg']
                        .map(type => {
                            let types = { mp3: 'mpeg' },
                                src = Extension.getURL(`aud/goes-without-saying-608.${ type }`);
                            type = `audio/${ types[type] ?? type }`;

                            return furnish('source', { src, type }).outerHTML;
                        }).join('')
                }),
        NOTIFICATION_EVENT;

    Handlers.whisper_audio = () => {
        // Play sound on new message
        NOTIFICATION_EVENT ??= GetChat.onwhisper = ({ unread, highlighted, message }) => {
            LOG('Got a new whisper', { unread, highlighted, message });

            if(!unread && !highlighted && !message)
                return;

            LOG('Playing notification sound...', NOTIFICATION_SOUND, { unread, highlighted, message });

            NOTIFICATION_SOUND?.play();
        };

        // Play message on pill-change
        let pill = $('.whispers__pill'),
            unread = parseInt(pill?.innerText) | 0;

        if(!defined(pill))
            return NOTIFIED = 0;
        if(NOTIFIED >= unread)
            return;
        NOTIFIED = unread;

        NOTIFICATION_SOUND?.play();
    };
    Timers.whisper_audio = 1000;

    __NotificationSounds__:
    if(parseBool(Settings.whisper_audio)) {
        RegisterJob('whisper_audio');
    }

    /*** Currencies
     *       _____                               _
     *      / ____|                             (_)
     *     | |    _   _ _ __ _ __ ___ _ __   ___ _  ___  ___
     *     | |   | | | | '__| '__/ _ \ '_ \ / __| |/ _ \/ __|
     *     | |___| |_| | |  | | |  __/ | | | (__| |  __/\__ \
     *      \_____\__,_|_|  |_|  \___|_| |_|\___|_|\___||___/
     *
     *
     */
    /*** Convert Bits
     *       _____                          _     ____  _ _
     *      / ____|                        | |   |  _ \(_) |
     *     | |     ___  _ ____   _____ _ __| |_  | |_) |_| |_ ___
     *     | |    / _ \| '_ \ \ / / _ \ '__| __| |  _ <| | __/ __|
     *     | |___| (_) | | | \ V /  __/ |  | |_  | |_) | | |_\__ \
     *      \_____\___/|_| |_|\_/ \___|_|   \__| |____/|_|\__|___/
     *
     *
     */
    // /chat.js

    /*** Rewards Calculator
     *      _____                            _        _____      _            _       _
     *     |  __ \                          | |      / ____|    | |          | |     | |
     *     | |__) |_____      ____ _ _ __ __| |___  | |     __ _| | ___ _   _| | __ _| |_ ___  _ __
     *     |  _  // _ \ \ /\ / / _` | '__/ _` / __| | |    / _` | |/ __| | | | |/ _` | __/ _ \| '__|
     *     | | \ \  __/\ V  V / (_| | | | (_| \__ \ | |___| (_| | | (__| |_| | | (_| | || (_) | |
     *     |_|  \_\___| \_/\_/ \__,_|_|  \__,_|___/  \_____\__,_|_|\___|\__,_|_|\__,_|\__\___/|_|
     *
     *
     */
    // /chat.js

    /*** Customization
     *       _____          _                  _          _   _
     *      / ____|        | |                (_)        | | (_)
     *     | |    _   _ ___| |_ ___  _ __ ___  _ ______ _| |_ _  ___  _ __
     *     | |   | | | / __| __/ _ \| '_ ` _ \| |_  / _` | __| |/ _ \| '_ \
     *     | |___| |_| \__ \ || (_) | | | | | | |/ / (_| | |_| | (_) | | | |
     *      \_____\__,_|___/\__\___/|_| |_| |_|_/___\__,_|\__|_|\___/|_| |_|
     *
     *
     */
    /*** Points Receipt
     *      _____      _       _         _____               _       _
     *     |  __ \    (_)     | |       |  __ \             (_)     | |
     *     | |__) |__  _ _ __ | |_ ___  | |__) |___  ___ ___ _ _ __ | |_
     *     |  ___/ _ \| | '_ \| __/ __| |  _  // _ \/ __/ _ \ | '_ \| __|
     *     | |  | (_) | | | | | |_\__ \ | | \ \  __/ (_|  __/ | |_) | |_
     *     |_|   \___/|_|_| |_|\__|___/ |_|  \_\___|\___\___|_| .__/ \__|
     *                                                        | |
     *                                                        |_|
     */
    let INITIAL_POINTS,
        RECEIPT_TOOLTIP,
        COUNTING_POINTS,
        EXACT_POINTS_SPENT = 0,
        EXACT_POINTS_EARNED = 0,
        COUNTING_HREF = NORMALIZED_PATHNAME,
        OBSERVED_COLLECTION_ANIMATIONS = new Map();

    Handlers.points_receipt_placement = () => {
        let placement;

        if((placement = Settings.points_receipt_placement ??= "null") == "null")
            return;

        let live_time = $('.live-time');

        if(!defined(live_time))
            return;

        let classes = element => [...element.classList].map(label => '.' + label).join('');

        let container = live_time.closest(`*:not(${ classes(live_time) })`),
            parent = container.closest(`*:not(${ classes(container) })`);

        let f = furnish;
        let points_receipt =
        f(`${ container.tagName }${ classes(container) }`, {},
            f(`${ live_time.tagName }#tt-points-receipt${ classes(live_time).replace(/\blive-time\b/gi, 'points-receipt') }`, { receipt: 0 })
        );

        parent.appendChild(points_receipt);

        RECEIPT_TOOLTIP ??= new Tooltip(points_receipt);

        COUNTING_POINTS = setInterval(() => {
            let points_receipt = $('#tt-points-receipt'),
                balance = $('[data-test-selector="balance-string"i]'),
                exact_debt = $('[data-test-selector^="prediction-checkout"i], [data-test-selector*="user-prediction"i][data-test-selector*="points"i], [data-test-selector*="user-prediction"i] p, [class*="points-icon"] ~ p *:not(:empty)'),
                exact_change = $('[class*="community-points-summary"i][class*="points-add-text"i]');

            let [chat] = $('[role="log"i], [data-test-selector="banned-user-message"i], [data-test-selector^="video-chat"]', true);

            if(!defined(chat)) {
                let framedData = PostOffice.get('points_receipt_placement');

                top.PostOffice = PostOffice;

                if(!defined(framedData))
                    return;

                balance ??= { innerText: framedData.balance };
                exact_debt ??= { innerText: framedData.exact_debt };
                exact_change ??= { innerText: framedData.exact_change };
            }

            let current = parseCoin(balance?.innerText);

            INITIAL_POINTS ??= current;
            EXACT_POINTS_SPENT = parseCoin(exact_debt?.innerText ?? (INITIAL_POINTS > current? INITIAL_POINTS - current: EXACT_POINTS_SPENT));

            let animationID = (exact_change?.innerText ?? exact_debt?.innerText ?? (INITIAL_POINTS > current? -EXACT_POINTS_SPENT + '': 0)),
                animationTimeStamp = +new Date;

            if(!/^([\+\-, \d]+)$/.test(animationID))
                return;

            // Don't keep adding the exact change while the animation is playing
            if(OBSERVED_COLLECTION_ANIMATIONS.has(animationID)) {
                let time = OBSERVED_COLLECTION_ANIMATIONS.get(animationID);

                // It's been less than 5 minutes
                if(!defined(animationID) || Math.abs(animationTimeStamp - time) < 300_000)
                    return;

                // Continue executing...
            }
            OBSERVED_COLLECTION_ANIMATIONS.set(animationID, animationTimeStamp);

            LOG(`Observing "${ animationID }" @ ${ new Date }`, OBSERVED_COLLECTION_ANIMATIONS);

            if(!~[points_receipt, exact_change, balance].findIndex(defined)) {
                points_receipt?.parentElement?.remove();

                RestartJob('points_receipt_placement');

                return clearInterval(COUNTING_POINTS);
            }

            EXACT_POINTS_EARNED += parseCoin(exact_change?.innerText);

            let receipt = EXACT_POINTS_EARNED - EXACT_POINTS_SPENT,
                glyph = Glyphs.modify('channelpoints', { height: '20px', width: '20px', style: 'vertical-align:bottom' }),
                { abs } = Math;

            switch(Settings.channelpoints_receipt_display) {
                case "round100":
                    // Round to nearest hundred
                    receipt = receipt.floorToNearest(100);
                    break;

                case "round50":
                    // Round to nearest fifty (half)
                    receipt = receipt.floorToNearest(50);
                    break;

                case "round25":
                    // Round to nearest twenty-five (quarter)
                    receipt = receipt.floorToNearest(25);
                    break;

                case "null":
                default:
                    // Do nothing...
                    break;
            }

            RECEIPT_TOOLTIP.innerHTML = `${ comify(abs(EXACT_POINTS_EARNED)) } earned / ${ comify(abs(EXACT_POINTS_SPENT)) } spent`;
            points_receipt.innerHTML = `${ glyph } ${ abs(receipt).suffix(`&${ 'du'[+(receipt >= 0)] }arr;`, 1).replace(/\.0+/, '') }`;
        }, 100);
    };
    Timers.points_receipt_placement = -2500;

    Unhandlers.points_receipt_placement = () => {
        clearInterval(COUNTING_POINTS);

        $('#tt-points-receipt')?.parentElement?.remove();

        if(UnregisterJob.__reason__ == 'modify')
            return;

        INITIAL_POINTS = null;
    };

    __PointsReceiptPlacement__:
    if(parseBool(Settings.points_receipt_placement)) {
        RegisterJob('points_receipt_placement');
    }

    /*** Point Watcher
     *      _____      _       _    __          __   _       _
     *     |  __ \    (_)     | |   \ \        / /  | |     | |
     *     | |__) |__  _ _ __ | |_   \ \  /\  / /_ _| |_ ___| |__   ___ _ __
     *     |  ___/ _ \| | '_ \| __|   \ \/  \/ / _` | __/ __| '_ \ / _ \ '__|
     *     | |  | (_) | | | | | |_     \  /\  / (_| | || (__| | | |  __/ |
     *     |_|   \___/|_|_| |_|\__|     \/  \/ \__,_|\__\___|_| |_|\___|_|
     *
     *
     */
    let pointWatcherCounter = 0;

    Handlers.point_watcher_placement = () => {
        let richTooltip = $('[class*="channel-tooltip"i]');

        // Update the points (every minute)
        if(++pointWatcherCounter % 600) {
            pointWatcherCounter = 0;

            LoadCache('ChannelPoints', ({ ChannelPoints = {} }) => {
                let [amount, fiat, face] = (ChannelPoints[STREAMER.name] ?? 0).toString().split('|');

                amount = ($('[data-test-selector="balance-string"i]')?.innerText ?? amount ?? 'Unavailable');
                fiat = (STREAMER?.fiat ?? fiat ?? 0);
                face = (STREAMER?.face ?? face ?? '');

                face = face?.replace(/^(?:https?:.*?)?([\d]+\/[\w\-\.\/]+)$/i, '$1');

                ChannelPoints[STREAMER.name] = [amount, fiat, face].join('|');

                SaveCache({ ChannelPoints });
            });
        }

        if(!defined(richTooltip))
            return;

        // Remove the old face and values...
        $('.tt-point-amount, .tt-point-face', true).map(element => element?.remove());

        let [title, subtitle, ...footers] = $('[class*="channel-tooltip"i] > *', true, richTooltip),
            footer = footers[footers.length - 1],
            target = footer?.lastElementChild;

        if(!defined(target))
            return;

        let [name, game] = title.innerText.split(/[^\w\s]/);

        name = name?.trim();
        game = game?.trim();

        // Update the display
        LoadCache('ChannelPoints', ({ ChannelPoints = {} }) => {
            let [amount, fiat, face] = (ChannelPoints[name] ?? 0).toString().split('|'),
                style = new CSSObject({ verticalAlign: 'bottom', height: '20px', width: '20px' });

            let text = furnish('span.tt-point-amount', {
                    innerHTML: amount,
                }),
                icon = face?.length?
                    furnish('span.tt-point-face', {
                        innerHTML: ` | ${ furnish('img', { src: `https://static-cdn.jtvnw.net/channel-points-icons/${face}`, style: style.toString() }).outerHTML } `,
                    }):
                furnish('span.tt-point-face', {
                    innerHTML: ` | ${ Glyphs.modify('channelpoints', { style, ...style.toObject() }) } `,
                });

            target.appendChild(icon);
            target.appendChild(text);
        });
    };
    Timers.point_watcher_placement = 250;

    Unhandlers.point_watcher_placement = () => {
        $('.tt-point-amount', true)
            .forEach(span => span?.remove());
    };

    __PointWatcherPlacement__:
    if(parseBool(Settings.point_watcher_placement)) {
        RegisterJob('point_watcher_placement');
    }

    /*** Watch Time Placement
     *     __          __   _       _       _______ _                  _____  _                                     _
     *     \ \        / /  | |     | |     |__   __(_)                |  __ \| |                                   | |
     *      \ \  /\  / /_ _| |_ ___| |__      | |   _ _ __ ___   ___  | |__) | | __ _  ___ ___ _ __ ___   ___ _ __ | |_
     *       \ \/  \/ / _` | __/ __| '_ \     | |  | | '_ ` _ \ / _ \ |  ___/| |/ _` |/ __/ _ \ '_ ` _ \ / _ \ '_ \| __|
     *        \  /\  / (_| | || (__| | | |    | |  | | | | | | |  __/ | |    | | (_| | (_|  __/ | | | | |  __/ | | | |_
     *         \/  \/ \__,_|\__\___|_| |_|    |_|  |_|_| |_| |_|\___| |_|    |_|\__,_|\___\___|_| |_| |_|\___|_| |_|\__|
     *
     *
     */
    let WATCH_TIME_INTERVAL,
        WATCH_TIME_TOOLTIP;

    Handlers.watch_time_placement = async() => {
        let placement;

        if((placement = Settings.watch_time_placement ??= "null") == "null")
            return;

        let parent, container,
            color = 'green',
            extra = () => {};

        let classes = element => [...element.classList].map(label => '.' + label).join('');

        let live_time = $('.live-time');

        if(!defined(live_time))
            return RestartJob('watch_time_placement');

        switch(placement) {
            // Option 1 "over" - video overlay, volume control area
            case 'over':
                container = live_time.closest(`*:not(${ classes(live_time) })`);
                parent = $('[data-a-target="player-controls"i] [class*="player-controls"][class*="left-control-group"i]');
                color = 'white';
                break;

            // Option 2 "under" - under quick actions, live count/live time area
            case 'under':
                container = live_time.closest(`*:not(${ classes(live_time) })`);
                parent = container.closest(`*:not(${ classes(container) })`);
                extra = ({ live_time }) => {
                    live_time.setAttribute('style', 'color: var(--color-text-live)');
                };
                break;

            default: return;
        }

        let f = furnish;
        let watch_time = f(`${ container.tagName }${ classes(container) }`,
            { style: `color: var(--color-${ color })` },
            f(`${ live_time.tagName }#tt-watch-time${ classes(live_time).replace(/\blive-time\b/gi, 'watch-time') }`, { time: 0 })
        );

        WATCH_TIME_TOOLTIP = new Tooltip(watch_time);

        parent.appendChild(watch_time);

        extra({ parent, container, live_time, placement });

        await LoadCache(['WatchTime', 'Watching'], ({ WatchTime = 0, Watching = NORMALIZED_PATHNAME }) => {
            if(NORMALIZED_PATHNAME == Watching)
                $('#tt-watch-time').setAttribute('time', WatchTime);

            WATCH_TIME_INTERVAL = setInterval(() => {
                let watch_time = $('#tt-watch-time'),
                    time = parseInt(watch_time?.getAttribute('time')) | 0;

                if(!defined(watch_time)) {
                    clearInterval(WATCH_TIME_INTERVAL);
                    return RestartJob('watch_time_placement');
                }

                // Time got set incorrectly
                if(parseTime($('.watch-time')?.innerText) > parseTime($('.live-time')?.innerText))
                    time = 0;

                watch_time.setAttribute('time', ++time);

                watch_time.innerHTML = ConvertTime(time * 1000, 'clock');

                WATCH_TIME_TOOLTIP.innerHTML = comify(time).replace(/\.[\d,]*$/, '') + " second".pluralSuffix(time);

                SaveCache({ WatchTime: time });
            }, 1000);
        });

        SaveCache({ Watching: NORMALIZED_PATHNAME });
    };
    Timers.watch_time_placement = -1000;

    Unhandlers.watch_time_placement = () => {
        clearInterval(WATCH_TIME_INTERVAL);

        $('#tt-watch-time')?.parentElement?.remove();
        $('.live-time')?.removeAttribute('style');

        if(UnregisterJob.__reason__ == 'modify')
            return;

        SaveCache({ Watching: null, WatchTime: 0 });
    };

    __WatchTimePlacement__:
    if(parseBool(Settings.watch_time_placement)) {
        RegisterJob('watch_time_placement');
    }

    /*** Video Recovery
     *     __      ___     _              _____
     *     \ \    / (_)   | |            |  __ \
     *      \ \  / / _  __| | ___  ___   | |__) |___  ___ _____   _____ _ __ _   _
     *       \ \/ / | |/ _` |/ _ \/ _ \  |  _  // _ \/ __/ _ \ \ / / _ \ '__| | | |
     *        \  /  | | (_| |  __/ (_) | | | \ \  __/ (_| (_) \ V /  __/ |  | |_| |
     *         \/   |_|\__,_|\___|\___/  |_|  \_\___|\___\___/ \_/ \___|_|   \__, |
     *                                                                        __/ |
     *                                                                       |___/
     */
    /*** Recover Frames
     *      _____                                ______
     *     |  __ \                              |  ____|
     *     | |__) |___  ___ _____   _____ _ __  | |__ _ __ __ _ _ __ ___   ___  ___
     *     |  _  // _ \/ __/ _ \ \ / / _ \ '__| |  __| '__/ _` | '_ ` _ \ / _ \/ __|
     *     | | \ \  __/ (_| (_) \ V /  __/ |    | |  | | | (_| | | | | | |  __/\__ \
     *     |_|  \_\___|\___\___/ \_/ \___|_|    |_|  |_|  \__,_|_| |_| |_|\___||___/
     *
     *
     */
    let SECONDS_PAUSED_UNSAFELY = 0,
        CREATION_TIME,
        TOTAL_VIDEO_FRAMES,
        PAGE_HAS_FOCUS = document.visibilityState === "visible";

    Handlers.recover_frames = () => {
        let video = $('video');

        if(!defined(video))
            return;

        let { paused } = video,
            isTrusted = defined($('button[data-a-player-state="paused"i]')),
            isAdvert = $('video', true).length > 1,
            { creationTime, totalVideoFrames } = video.getVideoPlaybackQuality();

        // Time that's passed since creation. Should constantly increase
        CREATION_TIME ??= creationTime;

        // The total number of frames created. Should constantly increase
        TOTAL_VIDEO_FRAMES ??= totalVideoFrames;

        // if the page isn't in focus, ignore this setting
        // if the video is paused by the user (trusted) move on
        if((paused && isTrusted) || PAGE_HAS_FOCUS === false)
            return;

        // The video is stalling: either stuck on the same frame, or lagging behind 15 frames
        if(CREATION_TIME != creationTime && (totalVideoFrames === TOTAL_VIDEO_FRAMES || totalVideoFrames - TOTAL_VIDEO_FRAMES < 15)) {
            if(SECONDS_PAUSED_UNSAFELY> 0 && !(SECONDS_PAUSED_UNSAFELY % 5))
                WARN(`The video has been stalling for ${ SECONDS_PAUSED_UNSAFELY }s`, { CREATION_TIME, TOTAL_VIDEO_FRAMES, SECONDS_PAUSED_UNSAFELY }, 'Frames fallen behind:', totalVideoFrames - TOTAL_VIDEO_FRAMES);

            // Try constantly overwriting to see if the video plays
            // CREATION_TIME = creationTime; // Keep this from becoming true to force a re-run
            TOTAL_VIDEO_FRAMES = totalVideoFrames;

            ++SECONDS_PAUSED_UNSAFELY;

            video.stalling = true;
        }
        // The video is playing
        else {
            // Start over
            CREATION_TIME = creationTime;
            TOTAL_VIDEO_FRAMES = totalVideoFrames;

            video.stalling = false;

            // Reset the timer whenever the video is recovered
            return SECONDS_PAUSED_UNSAFELY = 0;
        }

        if(SECONDS_PAUSED_UNSAFELY > 15)
            location.reload();
    };
    Timers.recover_frames = 1000;

    __RecoverFrames__:
    if(parseBool(Settings.recover_frames)) {
        document.addEventListener('visibilitychange', event => PAGE_HAS_FOCUS = document.visibilityState === "visible");

        RegisterJob('recover_frames');
    }

    /*** Recover Stream
     *      _____                                 _____ _
     *     |  __ \                               / ____| |
     *     | |__) |___  ___ _____   _____ _ __  | (___ | |_ _ __ ___  __ _ _ __ ___
     *     |  _  // _ \/ __/ _ \ \ / / _ \ '__|  \___ \| __| '__/ _ \/ _` | '_ ` _ \
     *     | | \ \  __/ (_| (_) \ V /  __/ |     ____) | |_| | |  __/ (_| | | | | | |
     *     |_|  \_\___|\___\___/ \_/ \___|_|    |_____/ \__|_|  \___|\__,_|_| |_| |_|
     *
     *
     */
    let VIDEO_PLAYER_TIMEOUT = -1;

    Handlers.recover_stream = (video = $('video')) => {
        if(!defined(video))
            return;

        let { paused } = video,
            isTrusted = defined($('button[data-a-player-state="paused"i]')),
            isAdvert = $('video', true).length > 1;

        // Leave the video alone
            // if the video isn't paused
            // if the video was paused by the user (trusted)
            // if the video is an ad AND auto-play ads is disabled
            // if the player event-timeout has been set
        if(!paused || isTrusted || (isAdvert && !parseBool(Settings.recover_ads)) || VIDEO_PLAYER_TIMEOUT > -1)
            return;

        // Wait before trying to press play again
        VIDEO_PLAYER_TIMEOUT = setTimeout(() => VIDEO_PLAYER_TIMEOUT = -1, 1000);

        __RecoverVideoProgramatically__:
        try {
            let playing = video.play();

            if(defined(playing))
                playing
                    .catch(error => { throw error });
        } catch(error) {
            ERROR(error);

            let control = $('button[data-a-player-state]'),
                playing = control.getAttribute('data-a-player-state') !== 'paused',
                attempts = parseInt(control.getAttribute('attempts')) | 0;

            if(!defined(control)) {
                WARN('No video controls presented.');

                break __RecoverVideoProgramatically__;
            } if(attempts > 3) {
                WARN('Automatic attempts are not helping.');

                break __RecoverVideoProgramatically__;
            }

            if(!playing) {
                // PAUSED -> PLAY
                control.click();
            } else if(playing) {
                // PLAYING -> PAUSE, PLAY
                control.click();
                control.click();
            }

            control.setAttribute('attempts', ++attempts);

            setTimeout(() => {
                let control = $('button[data-a-player-state]'),
                    attempts = parseInt(control.getAttribute('attempts')) | 0;

                control.setAttribute('attempts', --attempts);
            }, 5000);
        }
    };
    Timers.recover_stream = 2500;

    __RecoverStream__:
    if(parseBool(Settings.recover_stream)) {
        let video = $('video');

        if(!defined(video))
            break __RecoverStream__;

        video.addEventListener('pause', event => Handlers.recover_stream(event.currentTarget));

        RegisterJob('recover_stream');
    }

    /*** Recover Video
     *      _____                               __      ___     _
     *     |  __ \                              \ \    / (_)   | |
     *     | |__) |___  ___ _____   _____ _ __   \ \  / / _  __| | ___  ___
     *     |  _  // _ \/ __/ _ \ \ / / _ \ '__|   \ \/ / | |/ _` |/ _ \/ _ \
     *     | | \ \  __/ (_| (_) \ V /  __/ |       \  /  | | (_| |  __/ (_) |
     *     |_|  \_\___|\___\___/ \_/ \___|_|        \/   |_|\__,_|\___|\___/
     *
     *
     */
    let RECOVERING_VIDEO = false;

    Handlers.recover_video = () => {
        let errorMessage = $('[data-a-target="player-overlay-content-gate"i]');

        if(!defined(errorMessage))
            return;

        if(RECOVERING_VIDEO)
            return;
        RECOVERING_VIDEO = true;

        errorMessage = errorMessage.textContent;

        if(/subscribe/i.test(errorMessage)) {
            let next = GetNextStreamer();

            // Subscriber only, etc.
            if(defined(next))
                open(next.href, '_self');
        } else {
            ERROR('The stream ran into an error:', errorMessage, new Date);

            // Failed to play video at...
            PushToTopSearch({ 'tt-ftpva': (+new Date).toString(36) });
        }
    };
    Timers.recover_video = 5_000;

    __RecoverVideo__:
    if(parseBool(Settings.recover_video)) {
        RegisterJob('recover_video');
    }

    /*** User Intent Listener - NOT A SETTING. Observe the user's intent, and prevent over-riding it
     *
     *      _    _                 _       _             _
     *     | |  | |               (_)     | |           | |
     *     | |  | |___  ___ _ __   _ _ __ | |_ ___ _ __ | |_
     *     | |  | / __|/ _ \ '__| | | '_ \| __/ _ \ '_ \| __|
     *     | |__| \__ \  __/ |    | | | | | ||  __/ | | | |_
     *      \____/|___/\___|_|    |_|_| |_|\__\___|_| |_|\__|
     *
     *
     * Wait for the elements to populate
     * May not always be present
     */
    setTimeout(() => {
        $('[data-a-target="followed-channel"i], [role="group"i][aria-label*="followed"i] [href^="/"], [data-test-selector*="search-result"i][data-test-selector*="channel"i] a:not([href*="/search?"])', true).map(a => {
            a.addEventListener('mouseup', async event => {
                let { currentTarget } = event;

                let url = parseURL(currentTarget.href),
                    UserIntent = url.pathname.replace('/', '');

                await SaveCache({ UserIntent });
            });
        });
    }, 1000);

    /*** Recover Chat
     *      _____                                 _____ _           _
     *     |  __ \                               / ____| |         | |
     *     | |__) |___  ___ _____   _____ _ __  | |    | |__   __ _| |_
     *     |  _  // _ \/ __/ _ \ \ / / _ \ '__| | |    | '_ \ / _` | __|
     *     | | \ \  __/ (_| (_) \ V /  __/ |    | |____| | | | (_| | |_
     *     |_|  \_\___|\___\___/ \_/ \___|_|     \_____|_| |_|\__,_|\__|
     *
     *
     */
    // /chat.js
    Handlers.recover_chat = () => {
        let [chat] = $('[role="log"i], [role="tt-log"i], [data-test-selector="banned-user-message"i], [data-test-selector^="video-chat"]', true);

        if(defined(chat))
            return;

        // Add an iframe...
        let { name } = STREAMER,
            input = $('.chat-input'),
            iframe = furnish(`iframe.tw-c-text-base.tw-flex.tw-flex-column.tw-flex-grow-1.tw-flex-nowrap.tw-full-height.tw-relative[src="/popout/${name}/chat"][role="tt-log"]`),
            container = (input?.closest('section') ?? $('.chat-shell .stream-chat'));

        container.replaceChild(iframe, container.firstChild);
    };
    Timers.recover_chat = 500;

    __RecoverChat__:
    if(parseBool(Settings.recover_chat)) {
        RegisterJob('recover_chat');
    }

    /*** Recover Pages
     *      _____                                _____
     *     |  __ \                              |  __ \
     *     | |__) |___  ___ _____   _____ _ __  | |__) |_ _  __ _  ___  ___
     *     |  _  // _ \/ __/ _ \ \ / / _ \ '__| |  ___/ _` |/ _` |/ _ \/ __|
     *     | | \ \  __/ (_| (_) \ V /  __/ |    | |  | (_| | (_| |  __/\__ \
     *     |_|  \_\___|\___\___/ \_/ \___|_|    |_|   \__,_|\__, |\___||___/
     *                                                       __/ |
     *                                                      |___/
     */
    Handlers.recover_pages = () => {
        let error = $('[data-a-target="core-error-message"i]');

        if(!defined(error))
            return;

        let message = error.innerText,
            next = GetNextStreamer();

        ERROR(message);

        if(/content.*unavailable/i.test(message) && defined(next))
            open(next.href, '_self');
        else
            location.reload();
    };
    Timers.recover_pages = 5_000;

    __RecoverPages__:
    if(parseBool(Settings.recover_pages)) {
        RegisterJob('recover_pages');
    }

    // End of Initialize
};
// End of Initialize

let CUSTOM_CSS,
    PAGE_CHECKER,
    WAIT_FOR_PAGE;

PAGE_CHECKER = setInterval(WAIT_FOR_PAGE = async() => {
    let ready = (true
        // The follow button exists
        && defined($(`[data-a-target="follow-button"i], [data-a-target="unfollow-button"i]`))
        && (false
            // There is a message container
            || defined($('[data-test-selector$="message-container"i]'))
            // There is an ongoing search
            || (true
                && defined($('[data-test-selector*="search-result"i][data-test-selector$="name"]', true))
                && defined($('[data-a-target^="threads-box-"i]'))
            )
            // The page is a channel viewing page
            // || /^(ChannelWatch|SquadStream|VideoWatch)Page$/i.test($('#root')?.dataset?.aPageLoadedName)
        )
        // There is an error message
        || defined($('[data-a-target="core-error-message"i]'))
    );

    if(ready) {
        Settings = await GetSettings();

        setTimeout(Initialize, 1000);
        clearInterval(PAGE_CHECKER);

        top.MAIN_CONTROLLER_READY = true;

        // Observe location changes
        LocationObserver: {
            let { body } = document,
                observer = new MutationObserver(mutations => {
                    mutations.map(mutation => {
                        if(PATHNAME !== top.location.pathname) {
                            let OLD_HREF = PATHNAME;

                            PATHNAME = top.location.pathname;

                            for(let [name, func] of __ONLOCATIONCHANGE__)
                                func(new CustomEvent('locationchange', { detail: { from: OLD_HREF, to: PATHNAME }}));
                        }
                    });
                });

            observer.observe(body, { childList: true, subtree: true });
        }

        // Observe chat changes
        ChatObserver: {
            let chat = $('[data-test-selector$="message-container"i]'),
                observer = new MutationObserver(mutations => {
                    let emotes = {},
                        results = [];

                    mutations = mutations.filter(({ type }) => type == 'childList');

                    MutationToNode:
                    for(let mutation of mutations) {
                        let { addedNodes } = mutation;

                        NodeToObject:
                        for(let line of addedNodes) {
                            let keepEmotes = true;

                            let handle = $('.chat-line__username', true, line).map(element => element.innerText).toString()
                                author = handle.toLowerCase(),
                                message = $('[data-test-selector="chat-message-separator"i] ~ *', true, line),
                                mentions = $('.mention-fragment', true, line).map(element => element.innerText.replace('@', '').toLowerCase()).filter(text => /^[a-z_]\w+$/i.test(text)),
                                badges = $('.chat-badge', true, line).map(img => img.alt.toLowerCase()),
                                style = $('.chat-line__username [style]', true, line).map(element => element.getAttribute('style')).join(';'),
                                reply = $('button[data-test-selector="chat-reply-button"i]', false, line);

                            let raw = line.innerText?.trim(),
                                containedEmotes = [];

                            message = message
                                .map(element => {
                                    let string;

                                    if(keepEmotes && ((element.dataset.testSelector == 'emote-button') || element.dataset.ttEmote)) {
                                        let img = $('img', false, element);

                                        if(defined(img))
                                            containedEmotes.push(string = `:${ (i=>((emotes[i.alt]=i.src),i.alt))(img) }:`);
                                    } else {
                                        string = element.innerText;
                                    }

                                    return string;
                                })
                                .filter(defined)
                                .join(' ')
                                .trim()
                                .replace(/(\s){2,}/g, '$1');

                            style = style
                                .replace(/\brgba?\(([\d\s,]+)\)/i, ($0, $1, $$, $_) => '#' + $1.split(',').map(color => (+color.trim()).toString(16).padStart(2, '00')).join(''));

                            let uuid = UUID.from([author, mentions.join(','), message].join(':')).value;

                            if(defined(results.find(message => message.uuid == uuid)))
                                continue;

                            results.push({
                                raw,
                                uuid,
                                reply,
                                style,
                                author,
                                badges,
                                handle,
                                message,
                                mentions,
                                element: line,
                                emotes: [...new Set(containedEmotes.map(string => string.replace(/^:|:$/g, '')))],
                                deleted: defined($('[class*="--deleted-notice"i]', false, line)),
                                highlighted: !!(line.classList.value.split(' ').filter(value => /^chat-line--/i.test(value)).length),
                            });
                        }
                    }

                    results.emotes = emotes;

                    for(let [name, callback] of GetChat.__onnewmessage__)
                        callback(results);
                });

            if(!defined(chat))
                break ChatObserver;

            observer.observe(chat, { childList: true });
        }

        // Observe whisper changes
        WhisperObserver: {
            let chat = $('main'),
                chat_observer = new MutationObserver(mutations => {
                    mutations = mutations.filter(({ type }) => type == 'childList');

                    MutationToNode:
                    for(let mutation of mutations) {
                        let { addedNodes } = mutation;

                        NodeToObject:
                        for(let node of addedNodes) {
                            let highlighted = defined($('[class*="container--highlighted"i]', false, node)),
                                newmessage = ["whisper-message"].contains(node.dataset.aTarget);

                            if(false
                                || !highlighted
                                || !newmessage
                            )
                                continue;

                            for(let [name, callback] of GetChat.__onwhisper__)
                                if(highlighted) {
                                    callback({ highlighted });
                                } else if(newmessage) {
                                    let keepEmotes = true;

                                    let handle = $('[data-a-target="whisper-message-name"i]', false, node).innerText,
                                        author = handle.toLowerCase(),
                                        message = $('[data-test-selector="separator"i] ~ *', true, node),
                                        style = node.getAttribute('style');

                                    let raw = node.innerText;

                                    message = message
                                        .map(element => {
                                            let string;

                                            switch(element.dataset.aTarget) {
                                                case 'emote-name':
                                                    if(keepEmotes)
                                                        string = `:${ (i=>((emotes[i.alt]=i.src),i.alt))($('img', false, element)) }:`;
                                                    break;

                                                default:
                                                    string = element.innerText;
                                                    break;
                                            }

                                            return string;
                                        })
                                        .filter(defined)
                                        .join(' ')
                                        .trim()
                                        .replace(/(\s){2,}/g, '$1');

                                    style = style
                                        .replace(/\brgba?\(([\d\s,]+)\)/i, ($0, $1, $$, $_) => '#' + $1.split(',').map(color => (+color.trim()).toString(16).padStart(2, '00')).join(''));

                                    let uuid = UUID.from([author, new Date, message].join(':')).value;

                                    callback({
                                        raw,
                                        uuid,
                                        style,
                                        author,
                                        handle,
                                        message,
                                        element: node,
                                    });
                                }
                        }
                    }
                }),

                pill = $('[data-a-target^="threads-box-"i]')?.previousElementSibling,
                pill_observer = new MutationObserver(mutations => {
                    mutations = mutations.filter(({ type }) => type == 'childList');

                    // LOG('The Whisper Pill has mutated...', mutations);

                    MutationToNode:
                    for(let mutation of mutations) {
                        let { addedNodes } = mutation;

                        NodeToObject:
                        for(let node of addedNodes) {
                            if(!node.classList.contains('whispers__pill'))
                                continue;

                            let unread = parseInt(node.innerText) | 0;

                            for(let [name, callback] of GetChat.__onwhisper__)
                                callback({ unread });
                        }
                    }
                });

            if(defined(chat))
                chat_observer.observe(chat, { childList: true });

            if(defined(pill))
                pill_observer.observe(pill, { childList: true });
        }

        top.onlocationchange = () => {
            WARN('Re-initializing...');

            Balloon.get('Up Next')?.remove();

            // Do NOT soft-reset ("turn off, turn on") these settings
            // They will be destroyed, including any data they are using
            let NON_VOLATILE = ['first_in_line*'].map(AsteriskFn);

            DestroyingJobs:
            for(let job in Jobs)
                if(!!~NON_VOLATILE.findIndex(name => name.test(job)))
                    continue DestroyingJobs;
                else
                    RestartJob(job);

            Reinitialize:
            if(NORMAL_MODE) {
                if(Settings.keep_popout) {
                    PAGE_CHECKER = setInterval(WAIT_FOR_PAGE, 500);

                    break Reinitialize;
                }

                location.reload();
            }
        };

        // Add custom styling
        CustomCSSInitializer: {
            CUSTOM_CSS = $('#tt-custom-css') ?? furnish('style#tt-custom-css', {});

CUSTOM_CSS.innerHTML =
`
#tt-auto-claim-bonuses .tw-z-above, [plagiarism], [repetitive] { display: none }
#tt-hidden-emote-container::after {
    content: 'Collecting emotes...\\A Do not close this window';
    text-align: center;
    white-space: break-spaces;

    --background: #000e;
    --text-align: center;

    position: absolute;
    --padding-top: 100%;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);

    --height: 100%;
    --width: 100%;
}
#tt-hidden-emote-container .simplebar-scroll-content { visibility: hidden }
.tt-first-run {
    border: 1px solid var(--color-blue);
    border-radius: 3px;

    transition: border 1s;
}
[animationID] a { cursor: grab }
[animationID] a:active { cursor: grabbing }
[tt-hidden] { display: none }
[up-next--body] {
    background-color: #387aff;
    border-radius: 0.5rem;
}
[up-next--body] > div[class]:first-child:only-child::after {
    content: 'Drag-and-drop channels here to queue them\\A They can be rearranged by dragging them';
    text-align: center;
    white-space: break-spaces;

    position: absolute;
    left: 50%;
    top: 50%;
    transform: translateX(-50%);

    width: 100%;
}

::-webkit-scrollbar {
    width: .6rem;
}
::-webkit-scrollbar-button {
    background: transparent;
    display: none;
    visibility: hidden;

    height: 0;
    width: 0;
}
::-webkit-scrollbar-thumb {
    background: #0008;
    border: 1px solid #fff4;
    border-radius: .5rem;
}
::-webkit-scrollbar-track {
    background: #0000;
}
::-webkit-scrollbar-corner {
    background: transparent;
}

.tt-emote-captured [data-test-selector="badge-button-icon"i],
.tt-emote-bttv [data-test-selector="badge-button-icon"i] {
    left: 0;
    top: 0;
}

[tt-live-status-indicator] {
    background-color: var(--color-hinted-grey-6);
    border-radius: var(--border-radius-rounded);
    width: 0.8rem;
    height: 0.8rem;
    display: inline-block;
    position: relative;
}

[tt-live-status-indicator="true"i] { background-color: var(--color-fill-live) }

/*[class*="tw-number-badge"i] {
    background-color: var(--color-background-pill-notification);
    border-radius: var(--border-radius-rounded);
    color: var(--color-text-overlay);
    pointer-events: none;

    position: relative;

    padding: 0px 0.4725em;
}*/
`;

            CUSTOM_CSS?.remove();
            $('body').appendChild(CUSTOM_CSS);
        }

        // Update the settings
        SettingsInitializer: {
            switch(Settings.onInstalledReason) {
                // Is this the first time the extension has run?
                // If so, then point out what's been changed
                case INSTALL:
                    setTimeout(() => {
                        for(let element of $('#tt-auto-claim-bonuses, [up-next--container]', true))
                            element.classList.add('tt-first-run');

                        setTimeout(() => {
                            $('.tt-first-run', true)
                                .forEach(element => element.classList.remove('tt-first-run'));
                        }, 30_000);
                    }, 10_000);
                    break;
            }

            Storage.set({ onInstalledReason: null });
        }
    }
}, 500);
