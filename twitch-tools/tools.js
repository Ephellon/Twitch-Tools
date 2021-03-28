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
    // These won't change (often)
    USERNAME,
    THEME,
    SPECIAL_MODE,
    NORMAL_MODE,
    NORMALIZED_PATHNAME;

// Populate the username field by quickly showing the menu
if(defined(UserMenuToggleButton)) {
    UserMenuToggleButton.click();
    USERNAME = $('[data-a-target="user-display-name"i]').innerText;
    THEME = [...$('html').classList].find(c => /theme-(\w+)/i.test(c)).replace(/[^]*theme-(\w+)/i, '$1').toLowerCase();
    UserMenuToggleButton.click();
}

let browser, Storage, Runtime, Manifest, Extension, Container, BrowserNamespace;

if(defined(browser?.runtime))
    BrowserNamespace = 'browser';
else if(defined(chrome?.extension))
    BrowserNamespace = 'chrome';

Container = window[BrowserNamespace];

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
            X = $('#twitch-tools-popup', false, P),
            I = Extension.getURL('profile.png'),
            N = 'Continue',
            D = 'Close',
            A = event => $('#twitch-tools-popup')?.remove(),
            C = event => $('#twitch-tools-popup')?.remove(),
            R = '_self',
            U, S, M, G, T, W, H;

        let uuid = U = UUID.from(subject).value,
            existing = Popup.#POPUPS.get(subject);

        if(defined(existing))
            return existing;

        if(defined(X)) {
            if(!Queue.popups.map(popup => popup.uuid).contains(uuid)) {
                let interval = setInterval(() => {
                    let existing = $('#twitch-tools-popup');

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
        f('div#twitch-tools-popup.tw-absolute.tw-mg-t-5', { 'twitch-tools-id': subject.replace(/\s+/g, '-'), style: 'z-index:9; bottom:10rem; right:1rem' },
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
                        f('div#twitch-tools-notification-counter--popup.tw-absolute.tw-font-size-7.tw-right-0.tw-top-0', { style: 'visibility:hidden' },
                            f('div.tw-animation.tw-animation--animate.tw-animation--bounce-in.tw-animation--duration-medium.tw-animation--fill-mode-both.tw-animation--timing-ease-in', {
                                    'data-a-target': 'tw-animation-target'
                                },
                                f('div.tw-c-background-base.tw-inline-flex.tw-number-badge.tw-relative', {},
                                    f('div#twitch-tools-notification-counter-output--popup.tw-c-text-overlay.tw-number-badge__badge.tw-relative', {
                                        'interval-id': setInterval(() => {
                                            let { length } = Queue.popups,
                                                counter = $('#twitch-tools-notification-counter--popup'),
                                                output = $('#twitch-tools-notification-counter-output--popup');

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
            X = $('#twitch-tools-balloon', false, P),
            I = Extension.getURL('profile.png'),
            F, C, H, U, N;

        let uuid = U = UUID.from([title, JSON.stringify(jobs)].join(':')).value,
            existing = Balloon.#BALLOONS.get(title);

        if(defined(existing))
            return existing;

        if(defined(X)) {
            if(!Queue.balloons.map(popup => popup.uuid).contains(uuid)) {
                let interval = setInterval(() => {
                    let existing = $('#twitch-tools-balloon');

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

                                        let balloon = $(`#twitch-tools-balloon-${ connectedTo }`);

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
                                F = f(`div#twitch-tools-notification-counter--${ U }.tw-absolute.tw-right-0.tw-top-0`, { style: 'visibility:hidden', 'connected-to': U, length: 0 },
                                    f('div.tw-animation.tw-animation--animate.tw-animation--bounce-in.tw-animation--duration-medium.tw-animation--fill-mode-both.tw-animation--timing-ease-in', {
                                            'data-a-target': 'tw-animation-target'
                                        },
                                        f('div.tw-c-background-base.tw-inline-flex.tw-number-badge.tw-relative', {},
                                            f(`div#twitch-tools-notification-counter-output--${ U }.tw-c-text-overlay.tw-number-badge__badge.tw-relative`, {
                                                'interval-id': setInterval(() => {
                                                    let counter = $(`#twitch-tools-notification-counter--${ uuid }`),
                                                        output = $(`#twitch-tools-notification-counter-output--${ uuid }`),
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
                    f(`div#twitch-tools-balloon-${ U }.tw-absolute.tw-balloon.tw-right-0.tw-balloon--down.tw-balloon--right.tw-balloon-lg.tw-block`,
                        {
                            style: 'display:none!important',
                            display: 'none',
                            role: 'dialog',
                        },
                        f('div.tw-border-radius-large.tw-c-background-base.tw-c-text-inherit.tw-elevation-4', {},
                            (C = f(`div#twitch-tools-balloon-container-${ U }.tw-flex.tw-flex-column`,
                                {
                                    style: 'min-height:20rem; min-width:40rem;',
                                    role: 'dialog',
                                },
                                // Header
                                f('div.tw-border-top-left-radius-medium.tw-border-top-right-radius-medium.tw-c-text-base.tw-elevation-1.tw-flex.tw-flex-shrink-0.tw-pd-x-1.tw-pd-y-05.tw-popover-header', {},
                                    f('div.tw-align-items-center.tw-flex.tw-flex-column.tw-flex-grow-1.tw-justify-content-center', {},
                                        (H = f(`h5#twitch-tools-balloon-header-${ U }.tw-align-center.tw-c-text-alt.tw-semibold`, { style: 'margin-left:4rem!important' }, title))
                                    ),
                                    f('button.tw-align-items-center.tw-align-middle.tw-border-bottom-left-radius-medium.tw-border-bottom-right-radius-medium.tw-border-top-left-radius-medium.tw-border-top-right-radius-medium.tw-button-icon.tw-button-icon--secondary.tw-core-button.tw-flex.tw-flex-column.tw-inline-flex.tw-interactive.tw-justify-content-center.tw-justify-content-center.tw-mg-l-05.tw-overflow-hidden.tw-popover-header__icon-slot--right.tw-relative',
                                        {
                                            style: 'padding:0.5rem!important; height:3rem!important; width:3rem!important',
                                            innerHTML: Glyphs.x,

                                            'connected-to': U,

                                            onclick: event => {
                                                let { currentTarget } = event,
                                                    connectedTo = currentTarget.getAttribute('connected-to');

                                                let balloon = $(`#twitch-tools-balloon-${ connectedTo }`);

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

                                    let container = f(`div#twitch-tools-balloon-job-${ U }--${ guid }`, { ...attributes, uuid, guid, href: parseURL(href).href },
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

                                                                        let element = $(`#twitch-tools-balloon-job-${ connectedTo }`);

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
                                                                                f('img.twitch-tools-balloon-avatar.tw-image', { src })
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
                                                                                f('p.twitch-tools-balloon-message', { innerHTML: message })
                                                                            )
                                                                        ),
                                                                        // Subheader
                                                                        f('div.tw-align-items-center.tw-flex.tw-flex-shrink-0.tw-mg-t-05', {},
                                                                            f('div.tw-mg-l-05', {},
                                                                                f('span.twitch-tools-balloon-subheader.tw-c-text-alt', { innerHTML: subheader })
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

                                                                                let element = $(`#twitch-tools-balloon-job-${ connectedTo }`);

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

            let existing = $(`#twitch-tools-balloon-job-${ uuid }--${ guid }`);

            if(defined(existing))
                return existing;

            ++this.length;

            let container = f(`div#twitch-tools-balloon-job-${ uuid }--${ guid }`, { ...attributes, uuid, guid, href: parseURL(href).href },
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

                                                let element = $(`#twitch-tools-balloon-job-${ connectedTo }`);

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
                                                        f('img.twitch-tools-balloon-avatar.tw-image', { src })
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
                                                        f('p.twitch-tools-balloon-message', { innerHTML: message })
                                                    )
                                                ),
                                                // Subheader
                                                f('div.tw-align-items-center.tw-flex.tw-flex-shrink-0.tw-mg-t-05', {},
                                                    f('div.tw-mg-l-05', {},
                                                        f('span.twitch-tools-balloon-subheader.tw-c-text-alt', { innerHTML: subheader })
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

                                                        let element = $(`#twitch-tools-balloon-job-${ connectedTo }`);

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
                    furnish('div', { 'aria-describedby': tooltip.id, 'class': 'tw-inline-flex tw-relative tw-tooltip-wrapper--show' },
                        furnish('div', { style: `width: ${ offset.width }px; height: ${ offset.height }px;` }),
                        tooltip
                    )
                )
            );

            tooltip.setAttribute('style', `display:block;${ fineTuning.style ?? '' }`);
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
            f('div#twitch-tools-chat-footer.tw-absolute.tw-border-radius-medium.tw-bottom-0.tw-c-text-overlay.tw-mg-b-1',
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

    constructor({ title, subtitle = "", icon, fineTuning = {} }) {
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

        this.body = card;
        this.icon = iconElement;
        this.uuid = uuid;
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

                    time.push(`${ amount } ${ name }${ (amount == 1? '': 's') }`);

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

            result = format.split(/!(year|day|hour|minute|(?:milli)?second)s?\b/g)
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

    amount = amount.replace(/([\d\.,]+)\s*([kMBT])?/i, ($0, $1, $2, $$, $_) => {
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

    if(!defined(current))
        return /* Is the streamer live? */;

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
    channels.filter(defined).findIndex(ch => ch.name === channel?.name) == index;

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

async function update() {
    // The location
    PATHNAME = top.location.pathname;

    // The theme
    THEME = [...$('html').classList].find(c => /theme-(\w+)/i.test(c)).replace(/[^]*theme-(\w+)/i, '$1').toLowerCase();

    // All Channels under Search
    SEARCH = [
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
                element.setAttribute('twitch-tools-streamer-data', JSON.stringify(channel));
                element.ondragstart ??= event => {
                    let { currentTarget } = event;

                    event.dataTransfer.setData('application/twitch-tools-streamer', currentTarget.getAttribute('twitch-tools-streamer-data'));
                    event.dataTransfer.dropEffect = 'move';
                };

                return channel;
            }),
    ].filter(uniqueChannels);

    // All visible Channels
    CHANNELS = [
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
                element.setAttribute('twitch-tools-streamer-data', JSON.stringify(streamer));
                element.ondragstart ??= event => {
                    let { currentTarget } = event;

                    event.dataTransfer.setData('application/twitch-tools-streamer', currentTarget.getAttribute('twitch-tools-streamer-data'));
                    event.dataTransfer.dropEffect = 'move';
                };

                return streamer;
            }),
    ].filter(uniqueChannels);

    // All followed Channels
    STREAMERS = [
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
                element.setAttribute('twitch-tools-streamer-data', JSON.stringify(streamer));
                element.ondragstart ??= event => {
                    let { currentTarget } = event;

                    event.dataTransfer.setData('application/twitch-tools-streamer', currentTarget.getAttribute('twitch-tools-streamer-data'));
                    event.dataTransfer.dropEffect = 'move';
                };

                return streamer;
            }),
    ].filter(uniqueChannels);

    // All Notifications
    NOTIFICATIONS = [
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
                element.setAttribute('twitch-tools-streamer-data', JSON.stringify(streamer));
                element.ondragstart ??= event => {
                    let { currentTarget } = event;

                    event.dataTransfer.setData('application/twitch-tools-streamer', currentTarget.getAttribute('twitch-tools-streamer-data'));
                    event.dataTransfer.dropEffect = 'move';
                };

                return streamer;
            }),
    ].filter(uniqueChannels);

    // Every channel
        // Putting the channels in this order guarantees channels already defined aren't overridden
    ALL_CHANNELS = [...ALL_CHANNELS, ...SEARCH, ...NOTIFICATIONS, ...STREAMERS, ...CHANNELS, STREAMER].filter(defined).filter(uniqueChannels);
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
let AsteriskFn = feature => RegExp(`^${ feature.replace('*', '(\\w+)?').replace('#', '([^_]+)?') }$`, 'i');

let EXPERIMENTAL_FEATURES = ['auto_focus', 'bttv_emotes*', 'convert_emotes', 'fine_details', 'native_twitch_reply', 'prevent_spam'].map(AsteriskFn),
    SENSITIVE_FEATURES = ['away_mode', 'auto_accept_mature', 'first_in_line*', 'prevent_#'].map(AsteriskFn),
    NORMALIZED_FEATURES = ['away_mode', 'auto_follow*', 'first_in_line*', 'prevent_#', 'kill*'].map(AsteriskFn),
    REFRESHABLE_FEATURES = ['auto_focus*', 'filter_messages', '*placement'].map(AsteriskFn);

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

let Initialize = async(START_OVER = false) => {
    let TWITCH_API = {},
        GLOBAL_EVENT_LISTENERS = {};

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

        await LoadCache('ChannelPoints', cache => {
            let counter = cache.ChannelPoints;

            for(let channel in counter) {
                let points = parseCoin(counter[channel]);

                if(points > mostPoints) {
                    mostWatched = channel;
                    mostPoints = points;
                } else if(points < leastPoints) {
                    leastWatched = channel;
                    leastPoints = points;
                }
            }
        });

        // Next channel in "Up Next"
        if(!parseBool(Settings.first_in_line_none) && ALL_FIRST_IN_LINE_JOBS?.length)
            return ALL_CHANNELS.find(channel => channel.href === ALL_FIRST_IN_LINE_JOBS[0]);

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
                element.setAttribute('twitch-tools-streamer-data', JSON.stringify(channel));
                element.ondragstart ??= event => {
                    let { currentTarget } = event;

                    event.dataTransfer.setData('application/twitch-tools-streamer', currentTarget.getAttribute('twitch-tools-streamer-data'));
                    event.dataTransfer.dropEffect = 'move';
                };

                return channel;
            }),
    ].filter(uniqueChannels);

    /** Streamer Array - the current streamer/channel
     * coin:number*      - GETTER: how many channel points (floored to the nearest 100) does the user have
     * chat:array*       - GETTER: an array of the current chat, sorted the same way messages appear. The last message is the last array entry
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
    STREAMER = {
        get chat() {
            return GetChat();
        },

        get coin() {
            let balance = $('[data-test-selector="balance-string"i]'),
                points = parseCoin(balance?.textContent);

            return points;
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
            return parseTime($('.live-time')?.textContent ?? 0);
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
                    element.setAttribute('twitch-tools-streamer-data', JSON.stringify(streamer));
                    element.ondragstart ??= event => {
                        let { currentTarget } = event;

                        event.dataTransfer.setData('application/twitch-tools-streamer', currentTarget.getAttribute('twitch-tools-streamer-data'));
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
                    element.setAttribute('twitch-tools-streamer-data', JSON.stringify(streamer));
                    element.ondragstart ??= event => {
                        let { currentTarget } = event;

                        event.dataTransfer.setData('application/twitch-tools-streamer', currentTarget.getAttribute('twitch-tools-streamer-data'));
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
                    element.setAttribute('twitch-tools-streamer-data', JSON.stringify(streamer));
                    element.ondragstart ??= event => {
                        let { currentTarget } = event;

                        event.dataTransfer.setData('application/twitch-tools-streamer', currentTarget.getAttribute('twitch-tools-streamer-data'));
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
        element.setAttribute('twitch-tools-streamer-data', JSON.stringify({ href, icon, live, name }));
        element.ondragstart ??= event => {
            let { currentTarget } = event;

            event.dataTransfer.setData('application/twitch-tools-streamer', currentTarget.getAttribute('twitch-tools-streamer-data'));
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

            USERNAME = cookies.name ?? USERNAME;

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

            // Get Twitch specific data
            // await fetch(`https://api.twitch.tv/api/${ type }s/${ value }/access_token?oauth_token=${ token }&need_https=true&platform=web&player_type=site&player_backend=mediaplayer`)
            //     .then(response => response.json())
            //     .then(json => TWITCH_API = JSON.parse(json.token ?? "null"))
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
            //             STREAMER[key] = TWITCH_API[conversion[key]];
            //     })
            //     .catch(ERROR);

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
                        { dataRetrievedAt } = data;

                    dataRetrievedAt ||= 0;

                    // Only refresh every 12h
                    if((dataRetrievedAt + 43_200_000) < +new Date)
                        throw "The data likely expired";
                    else
                        STREAMER.data = data;

                    REMARK(`Cached details about "${ STREAMER.name }"`, data);
                });
            } catch(exception) {
                // Proper CORS request to fetch the HTML data
                await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://twitchtracker.com/${ STREAMER.name }/statistics`)}`, { mode: 'cors' })
                    .then(text => text.text())
                    // Conversion => Text -> HTML -> Element -> JSON
                    .then(html => {
                        let doc = (new DOMParser).parseFromString(html, 'text/html'),
                            body = doc.body;

                        let data = {};

                        [...doc.querySelectorAll('#report .table tr')]
                            .map(tr => {
                                let [name, value] = tr.querySelectorAll('td');

                                // Set initial name
                                name = name
                                    .innerText
                                    .toLowerCase();

                                // Set initial value, and adjust name
                                value = value
                                    .innerText
                                    .trim()
                                    .replace(/\s+/g, ' ')
                                    .replace(/\s*\/(\w+)/, ($0, $1, $$, $_) => {
                                        name += " per " + $1;

                                        return '';
                                    });

                                // Set final value
                                value = (
                                    /^([\d\.]+|[\d\.]+\s*(?:min|hr|day)s)$/.test(value)?
                                        parseFloat(value):
                                    value
                                );

                                // Set final name
                                name = name
                                    .replace(/\s+(\w)/g, ($0, $1, $$, $_) => $1.toUpperCase());

                                // Set property
                                data[name] = value;
                            });

                        REMARK(`Details about "${ STREAMER.name }"`, data);

                        return STREAMER.data = data;
                    })
                    .catch(WARN)
                    .then(data => {
                        data = { ...data, dataRetrievedAt: +new Date };

                        SaveCache({ [`data/${ STREAMER.name }`]: data });
                    });
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
                        let diffImg = $('img#twitch-tools-auto-focus-differences'),
                            diffDat = $('span#twitch-tools-auto-focus-stats'),
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
                                diffImg = furnish('img#twitch-tools-auto-focus-differences', { style: `position: absolute; z-index: 3; width: ${ width }px; /* top: 20px; */` });
                                diffDat = furnish('span#twitch-tools-auto-focus-stats', { style: `position: absolute; z-index: 6; width: ${ width }px; height: 20px; background: #000; overflow: hidden; font-family: monospace;` });

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
        $('#twitch-tools-auto-focus-differences, #twitch-tools-auto-focus-stats', true)
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
            button.container.setAttribute('twitch-tools-away-mode-enabled', enabled);

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
        button.background?.setAttribute('style', `background:#${ ['387aff', 'f5009b'][+(button.container.getAttribute('twitch-tools-away-mode-enabled') === "true")] } !important;`);
        button.icon.setAttribute('height', '20px');
        button.icon.setAttribute('width', '20px');

        button.container.onclick ??= event => {
            let enabled = !parseBool(AwayModeButton.container.getAttribute('twitch-tools-away-mode-enabled'));

            AwayModeButton.container.setAttribute('twitch-tools-away-mode-enabled', enabled);
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
    Handlers.auto_claim_bonuses = () => {
        let ChannelPoints = $('[data-test-selector="community-points-summary"i] button[class*="--success"i]'),
            Enabled = (Settings.auto_claim_bonuses && $('#twitch-tools-auto-claim-bonuses')?.getAttribute('twitch-tools-auto-claim-bonus-channel-points-enabled') === 'true');

        if(Enabled && ChannelPoints)
            ChannelPoints.click();

        let parent = $('div:not(#twitch-tools-auto-claim-bonuses) > [data-test-selector="community-points-summary"i] [role="tooltip"i]'),
            tooltip = $('#twitch-tools-auto-claim-bonuses [role="tooltip"i]');

        if(tooltip && parent)
            tooltip.innerText = parent.innerText;

        // Actual jobbing
        let button = $('#twitch-tools-auto-claim-bonuses');

        if(!defined(button)) {
            let parent    = $('[data-test-selector="community-points-summary"i]'),
                heading   = $('.top-nav__menu > div', true).slice(-1)[0],
                container = furnish('div');

            if(!defined(parent) || !defined(heading)) {
                // setTimeout(Initialize, 5000);
                return;
            }

            container.innerHTML = parent.outerHTML;
            container.id = 'twitch-tools-auto-claim-bonuses';
            container.classList.add('community-points-summary', 'tw-align-items-center', 'tw-flex', 'tw-full-height');

            heading.insertBefore(container, heading.children[1]);

            $('#twitch-tools-auto-claim-bonuses [data-test-selector="community-points-summary"i] > div:last-child:not(:first-child)').remove();

            let textContainer = $('[class$="animated-number"i]', false, container);

            if(textContainer) {
                let { parentElement } = textContainer;
                parentElement.removeAttribute('data-test-selector');
            }

            button = {
                container,
                enabled: true,
                text: textContainer,
                icon: $('svg, img', false, container),
                get offset() { return getOffset(container) },
                tooltip: new Tooltip(container, `Collecting Bonuses`, { top: -10 }),
            };

            button.tooltip.id = new UUID().toString();
            button.text.innerText = 'ON';
            button.container.setAttribute('twitch-tools-auto-claim-bonus-channel-points-enabled', true);

            button.icon ??= $('svg, img', false, container);

            if(!defined($('.channel-points-icon', false, container)))
                button.icon.outerHTML = Glyphs.channelpoints;

            button.icon = $('svg, img', false, container);
        } else {
            let container = button,
                textContainer = $('[class$="animated-number"i]', false, container);

            button = {
                container,
                enabled: true,
                text: textContainer,
                tooltip: Tooltip.get(container),
                icon: $('svg, img', false, container),
                get offset() { return getOffset(container) },
            };
        }

        button.container.onclick ??= event => {
            let enabled = button.container.getAttribute('twitch-tools-auto-claim-bonus-channel-points-enabled') !== 'true';

            button.container.setAttribute('twitch-tools-auto-claim-bonus-channel-points-enabled', enabled);
            button.text.innerText = ['OFF','ON'][+enabled];
            button.tooltip.innerHTML = `${ ['Ignor','Collect'][+enabled] }ing Bonuses`;

            button.icon?.setAttribute('fill', `var(--color-${ ['red','accent'][+enabled] })`);
        };

        button.container.onmouseenter ??= event => {
            button.icon?.setAttribute('style', 'transform: translateX(0px) scale(1.2); transition: transform 300ms ease 0s');
        };

        button.container.onmouseleave ??= event => {
            button.icon?.setAttribute('style', 'transform: translateX(0px) scale(1); transition: transform 300ms ease 0s');
        };

        // Make sure the button is all the way to the left
        for(let max = 10; max > 0 && defined(button.container.previousElementSibling); --max)
            button.container.parentElement.insertBefore(button.container, button.container.previousElementSibling);
    };
    Timers.auto_claim_bonuses = 5_000;

    Unhandlers.auto_claim_bonuses = () => {
        $('#twitch-tools-auto-claim-bonuses')?.remove();
    };

    __AutoClaimBonuses__:
    if(parseBool(Settings.auto_claim_bonuses)) {
        RegisterJob('auto_claim_bonuses');
    }

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

                        $('#twitch-tools-popup')?.remove();
                    },

                    Hide: () => {
                        let existing = $('#twitch-tools-popup');

                        if(defined(existing))
                            existing.remove();
                    },

                    Cancel: () => {
                        let existing = $('#twitch-tools-popup'),
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
                streamer = JSON.parse(event.dataTransfer.getData('application/twitch-tools-streamer'));
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
                furnish('div.twitch-tools-tooltip-layer.tooltip-layer', { style: `transform: translate(${ offset.left }px, ${ offset.top }px); width: 30px; height: 30px; z-index: 2000;` },
                    furnish('div', { 'aria-describedby': tooltip.id, 'class': 'tw-inline-flex tw-relative tw-tooltip-wrapper--show' },
                        furnish('div', { style: 'width: 30px; height: 30px;' }),
                        tooltip
                    )
                )
            );

            tooltip.setAttribute('style', 'display:block');
        };

        FIRST_IN_LINE_BALLOON.icon.onmouseleave = event => {
            $('div#root .twitch-tools-tooltip-layer.tooltip-layer')?.remove();

            FIRST_IN_LINE_BALLOON.tooltip.setAttribute('style', 'display:none');
        };

        FIRST_IN_LINE_SORTING_HANDLER = new Sortable(FIRST_IN_LINE_BALLOON.body, {
            animation: 150,
            draggable: '[name]',

            filter: '.twitch-tools-static',

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
                            let subheader = $('.twitch-tools-balloon-subheader', false, container);

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
                                    $('.twitch-tools-balloon-message', false, container).innerHTML =
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
                        let subheader = $('.twitch-tools-balloon-subheader', false, container);

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
                                $('.twitch-tools-balloon-message', false, container).innerHTML =
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
                    let existing = $('#twitch-tools-popup');

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
                channel = STREAMERS.filter(isLive).find(channel => parseURL(channel.href).pathname === parseURL(href).pathname);

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
            PushToTopSearch({ 'twitch-tools-ftgca': (+new Date).toString(36) });
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
                let watch_time = $('#twitch-tools-watch-time'),
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
            window.onlocationchange = () => setTimeout(() => CONTINUE_RAIDING = false, 5_000);

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

            CONTINUE_RAIDING = !!setTimeout(leaveStream, 60_000 * +["greed"].contains(method));
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
            { pathname } = window.location;

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
    let EmoteSearch = {};

    Handlers.emote_searching = () => {
        EmoteSearch.input = $('.emote-picker [type="search"i]');

        if(defined(EmoteSearch.input?.value))
            if(EmoteSearch.input.value != EmoteSearch.value)
                if((EmoteSearch.value = EmoteSearch.input.value)?.length >= 3)
                    for(let [name, callback] of EmoteSearch.__onquery__)
                        callback(EmoteSearch.value);
    };
    Timers.emote_searching = 100;

    __EmoteSearching__:
    if(parseBool(Settings.convert_emotes) || parseBool(Settings.bttv_emotes)) {
        Object.defineProperties(EmoteSearch, {
            onquery: {
                set(callback) {
                    let name = callback.name || UUID.from(callback.toString()).value;

                    if(EmoteSearch.__onquery__.has(name))
                        return EmoteSearch.__onquery__.get(name);

                    // REMARK('Adding [on query] event listener', { [name]: callback });

                    EmoteSearch.__onquery__.set(name, callback);

                    return callback;
                },

                get() {
                    return EmoteSearch.__onquery__.size;
                },
            },
            __onquery__: { value: new Map() },

            appendResults: {
                value: function appendResults(nodes, type) {
                    $(`[tt-${ type }-emote-search-result]`, true).forEach(node => node.remove());

                    let container = $('[class*="emote-picker"i] [class*="wrap"i]:last-child');

                    for(let node of nodes) {
                        if(!defined(node))
                            continue;

                        node.setAttribute(`tt-${ type }-emote-search-result`, UUID.from(node.innerHTML));

                        container.appendChild(node);
                    }

                    let title = $('[class*="emote-picker"i] p');

                    title.innerText = title.innerText.replace(/^.*("[^]+")/, `${ container.children.length } search results for $1`);
                },
            },
        });

        RegisterJob('emote_searching');
    }

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
    let BTTV_EMOTES = new Map(),
        BTTV_OWNERS = new Map(),
        BTTV_LOADED_INDEX = 0,
        CONVERT_TO_BTTV_EMOTE = (emote, makeTooltip = true) => {
            let { name, src } = emote,
                existing = $(`img.bttv[alt="${ name }"]`);

            if(defined(existing))
                return existing.closest('div.tt-emote-bttv');

            let emoteContainer =
            furnish('div.tt-emote-bttv.tw-pd-x-05.tw-relative', {},
                furnish('div.emote-button', {},
                    furnish('div.tw-inline-flex', {},
                        furnish('button.emote-button__link.tw-align-items-center.tw-flex.tw-justify-content-center',
                            {
                                'data-test-selector': 'emote-button-clickable',
                                'aria-label': name,
                                name,
                                'data-a-target': name,

                                onclick: event => {
                                    let name = event.currentTarget.getAttribute('name'),
                                        chat = $('[data-a-target="chat-input"]');

                                    // chat.innerHTML = (chat.value += `${name} `);
                                },

                                ondragstart: event => {
                                    let { currentTarget } = event;

                                    event.dataTransfer.setData('text/plain', currentTarget.getAttribute('name').trim() + ' ');
                                    event.dataTransfer.dropEffect = 'move';
                                },
                            },

                            furnish('figure', {},
                                /*
                                <div class="emote-button__lock tw-absolute tw-border-radius-small tw-c-background-overlay tw-c-text-overlay tw-inline-flex tw-justify-content-center tw-z-above" data-test-selector="badge-button-lock">
                                    <figure class="ScFigure-sc-1j5mt50-0 laJGEQ tw-svg">
                                        <!-- badge icon -->
                                    </figure>
                                </div>
                                */
                                furnish('div.emote-button__lock.tw-absolute.tw-border-radius-small.tw-c-background-overlay.tw-c-text-overlay.tw-inline-flex.tw-justify-content-center.tw-z-above', { 'data-test-selector': 'badge-button-icon' },
                                    furnish('figure.tw-svg', { style: '-webkit-box-align:center; align-items:center; display:inline-flex;', innerHTML: Glyphs.modify('emotes', { height: '10px', width: '10px' }) })
                                ),
                                furnish('img.bttv.emote-picker__image', { src, alt: name, style: 'height:3.5rem;' })
                            )
                        )
                    )
                )
            );

            if(makeTooltip !== false)
                new Tooltip(emoteContainer, name);

            return emoteContainer;
        },
        LOAD_BTTV_EMOTES = async(keyword, provider) => {
            // Load some emotes (max 100 at a time)
                // [{ emote: { code:string, id:string, imageType:string, user: { displayName:string, id:string, name:string, providerId:string } } }]
                    // emote.code -> emote name
                    // emote.id -> emote ID (src)

            // Load emotes from a certain user
            if(defined(provider))
                await fetch(`//api.betterttv.net/3/cached/users/twitch/${ provider }`)
                    .then(response => response.json())
                    .then(json => {
                        let { channelEmotes, sharedEmotes } = json;

                        if(!defined(channelEmotes ?? sharedEmotes))
                            return;

                        let emotes = [...channelEmotes, ...sharedEmotes];

                        for(let { emote, code, user, id } of emotes) {
                            code ??= emote?.code;
                            user ??= emote?.user ?? { displayName: STREAMER.name, name: STREAMER.name.toLowerCase(), providerId: STREAMER.sole };

                            BTTV_EMOTES.set(code, `//cdn.betterttv.net/emote/${ id }/3x`);
                            BTTV_OWNERS.set(code, user);
                        }
                    });
            // Load emotes with a certain name
            else if(defined(keyword))
                for(let batchSize = 0, batchMax = 50, maxEmotes = 100, allLoaded = false; allLoaded === false && batchSize < maxEmotes; batchSize += batchMax)
                    await fetch(`//api.betterttv.net/3/emotes/shared/search?query=${ keyword }&offset=${ batchSize }&limit=${ batchMax }`)
                        .then(response => response.json())
                        .then(emotes => {
                            for(let { emote, code, user, id } of emotes) {
                                code ??= emote?.code;
                                user ??= emote?.user;

                                BTTV_EMOTES.set(code, `//cdn.betterttv.net/emote/${ id }/3x`);
                                BTTV_OWNERS.set(code, user ?? {});
                            }

                            allLoaded ||= emotes.length < maxEmotes;
                        });
            // Load all emotes from...
            else
                for(let batchSize = BTTV_EMOTES.size, batchMax = 30, maxEmotes = parseInt(Settings.bttv_emotes_maximum ?? 30); batchSize < maxEmotes; batchSize += batchMax)
                    await fetch(`//api.betterttv.net/3/${ Settings.bttv_emotes_location ?? 'emotes/shared/trending' }?offset=${ batchSize }&limit=${ batchMax }`)
                        .then(response => response.json())
                        .then(emotes => {
                            for(let { emote } of emotes) {
                                let { code, user, id } = emote;

                                BTTV_EMOTES.set(code, `//cdn.betterttv.net/emote/${ id }/3x`);
                                BTTV_OWNERS.set(code, user ?? {});
                            }
                        });
        };

    Handlers.bttv_emotes = () => {
        let BTTVEmoteSection = $('#twitch-tools-bttv-emotes');

        if(defined(BTTVEmoteSection))
            return;

        let parent = $('[data-test-selector^="chat-room-component"i] .emote-picker__scroll-container > *');

        if(!defined(parent))
            return RestartJob('bttv_emotes');

        // Put all BTTV emotes into the emote-picker list
        let BTTVEmotes = [];

        for(let [name, src] of BTTV_EMOTES)
            BTTVEmotes.push({ name, src });

        BTTVEmoteSection =
        furnish('div#twitch-tools-bttv-emotes.emote-picker__content-block',
            {
                ondragover: event => {
                    event.preventDefault();
                    // event.dataTransfer.dropEffect = 'move';
                },

                ondrop: async event => {
                    event.preventDefault();

                    return event.dataTransfer.getData('text/plain');
                },
            },

            furnish('div.tw-pd-b-1.tw-pd-t-05.tw-pd-x-1.tw-relative', {},
                // Emote Section Header
                furnish('div.emote-grid-section__header-title.tw-align-items-center.tw-flex.tw-pd-x-1.tw-pd-y-05', {},
                    furnish('p.tw-align-middle.tw-c-text-alt.tw-strong', {
                        innerHTML: "BetterTTV Emotes &mdash; Drag to use"
                    })
                ),

                // Emote Section Container
                furnish('div#twitch-tools-bttv-emotes-container.tw-flex.tw-flex-wrap',
                    {
                        class: 'twitch-tools-scrollbar-area',
                        style: 'max-height: 15rem; overflow: hidden scroll;',
                    },
                    ...BTTVEmotes.map(CONVERT_TO_BTTV_EMOTE)
                )
            )
        );

        parent.insertBefore(BTTVEmoteSection, parent.firstChild);
    };
    Timers.bttv_emotes = 5_000;

    __BetterTTVEmotes__:
    if(parseBool(Settings.bttv_emotes)) {
        REMARK('Loading BTTV emotes...');

        if(parseBool(Settings.bttv_emotes_channel))
            await LOAD_BTTV_EMOTES(STREAMER.name, STREAMER.sole);
        await LOAD_BTTV_EMOTES();

        REMARK('Adding BTTV emote event listener...');

        // Run the bttv-emote changer on pre-populated messages
        (GetChat.onnewmessage = chat => {
            let regexp;

            for(let line of chat) {
                // Replace BTTV emotes for the last 30 chat messages
                if(Queue.bttv_emotes.contains(line.uuid))
                    continue;
                if(Queue.bttv_emotes.length >= 30)
                    Queue.bttv_emotes = [];
                Queue.bttv_emotes.push(line.uuid);

                for(let [name, src] of BTTV_EMOTES)
                    if((regexp = RegExp('\\b' + name.replace(/(\W)/g, '\\$1') + '\\b', 'g')).test(line.message)) {
                        let alt = name,
                            own = BTTV_OWNERS.get(alt)?.displayName ?? 'Anonymous';

                        let f = furnish;
                        let img =
                        f('div.chat-line__message--emote-button', { 'data-test-selector': 'emote-button' },
                            f('span', { 'data-a-target': 'emote-name' },
                                f('div.class.chat-image__container.tw-align-center.tw-inline-block', {},
                                    f('img.bttv.chat-image.chat-line__message--emote', {
                                        alt, src,
                                    })
                                )
                            )
                        );

                        let { element } = line;

                        alt = alt.replace(/\s+/g, '_');

                        $(`.text-fragment:not([twitch-tools-converted-emotes~="${alt}"])`, true, element).map(fragment => {
                            let container = furnish('div.chat-line__message--emote-button', { 'data-test-selector': 'emote-button', 'data-bttv-emote': alt, 'data-bttv-owner': own, innerHTML: img.innerHTML }),
                                converted = (fragment.getAttribute('twitch-tools-converted-emotes') ?? "").split(' ');

                            converted.push(alt);

                            fragment.setAttribute('data-tt-emote', alt);
                            fragment.setAttribute('twitch-tools-converted-emotes', converted.join(' ').trim());
                            fragment.innerHTML = fragment.innerHTML.replace(regexp, container.outerHTML);

                            $('[data-bttv-emote]', true, fragment)
                                .forEach(element => {
                                    let { bttvEmote } = element.dataset,
                                        tooltip = new Tooltip(element, bttvEmote);

                                    element.addEventListener('mouseup', event => {
                                        let { currentTarget } = event,
                                            { bttvEmote, bttvOwner } = currentTarget.dataset,
                                            { left, top } = getOffset(currentTarget);

                                        top -= 100;

                                        let card = new Card({ title: bttvEmote, subtitle: `BetterTTV Emote (${ bttvOwner })`, icon: { src: BTTV_EMOTES.get(bttvEmote), alt: bttvEmote }, fineTuning: { top } });
                                    });
                                });
                        });
                    }
            }

            top.BTTV_EMOTES = BTTV_EMOTES;
        })(GetChat());

        REMARK('Adding BTTV emote search listener...');

        EmoteSearch.onquery = async query => {
            await LOAD_BTTV_EMOTES(query).then(() => {
                let results = [...BTTV_EMOTES]
                    .filter(([key, value]) => RegExp(query.replace(/(\W)/g, '\\$1'), 'i').test(key))
                    .map(([name, src]) => CONVERT_TO_BTTV_EMOTE({ name, src }));

                    EmoteSearch.appendResults(results, 'bttv');
            });
        };

        RegisterJob('bttv_emotes');
    }

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
    let EMOTES = new Map(),
        CAPTURED_EMOTES = new Map(),
        CONVERT_TO_CAPTURED_EMOTE = (emote, makeTooltip = true) => {
            let { name, src } = emote;

            // Try to filter out Twitch-provided emotes...
            if(/^\W/.test(name))
                return;

            let emoteContainer =
            furnish('div.tt-emote-captured.tw-pd-x-05.tw-relative', {},
                furnish('div.emote-button', {},
                    furnish('div.tw-inline-flex', {},
                        furnish('button.emote-button__link.tw-align-items-center.tw-flex.tw-justify-content-center',
                            {
                                'data-test-selector': 'emote-button-clickable',
                                'aria-label': name,
                                name,
                                'data-a-target': name,

                                onclick: event => {
                                    let name = event.currentTarget.getAttribute('name'),
                                        chat = $('[data-a-target="chat-input"]');

                                    // chat.innerHTML = (chat.value += `${name} `);
                                },

                                ondragstart: event => {
                                    let { currentTarget } = event;

                                    event.dataTransfer.setData('text/plain', currentTarget.getAttribute('name').trim() + ' ');
                                    event.dataTransfer.dropEffect = 'move';
                                },
                            },

                            furnish('figure', {},
                                /*
                                <div class="emote-button__lock tw-absolute tw-border-radius-small tw-c-background-overlay tw-c-text-overlay tw-inline-flex tw-justify-content-center tw-z-above" data-test-selector="badge-button-lock">
                                    <figure class="ScFigure-sc-1j5mt50-0 laJGEQ tw-svg">
                                        <!-- badge icon -->
                                    </figure>
                                </div>
                                */
                                furnish('div.emote-button__lock.tw-absolute.tw-border-radius-small.tw-c-background-overlay.tw-c-text-overlay.tw-inline-flex.tw-justify-content-center.tw-z-above', { 'data-test-selector': 'badge-button-icon' },
                                    furnish('figure.tw-svg', { style: '-webkit-box-align:center; align-items:center; display:inline-flex;', innerHTML: Glyphs.modify('emotes', { height: '10px', width: '10px' }) })
                                ),
                                furnish('img.emote-picker__image', { src, alt: name })
                            )
                        )
                    )
                )
            );

            if(makeTooltip !== false)
                new Tooltip(emoteContainer, name);

            return emoteContainer;
        };

    // Convert emote URL to a short url
    let shrt = url => url.replace(/https:\/\/static-cdn\.jtvnw\.net\/emoticons\/v1\/(\d+)\/([\d\.]+)/i, ($0, $1, $2, $$, $_) => {
            let id = parseInt($1).toString(36),
                version = $2;

            return [id, version].join('-');
        });

    Handlers.convert_emotes = () => {
        let emoteSection = $('#twitch-tools-captured-emotes');

        if(defined(emoteSection))
            return;

        let parent = $('[data-test-selector^="chat-room-component"i] .emote-picker__scroll-container > *');

        if(!defined(parent))
            return RestartJob('convert_emotes');

        // Get the streamer's emotes and make them draggable
        let streamersEmotes = $(`[class^="emote-picker"] img[alt="${ STREAMER.name }"i]`)?.closest('div')?.nextElementSibling;

        if(!defined(streamersEmotes))
            return RegisterJob('convert_emotes');

        for(let lock of $('[data-test-selector*="lock"i]', true, streamersEmotes)) {
            let emote = lock.nextElementSibling,
                { alt, src } = emote,
                parent = emote.closest('[class^="emote-picker"]').parentElement,
                container = parent.parentElement;

            container.insertBefore(CONVERT_TO_CAPTURED_EMOTE({ name: alt, src }, false), parent);

            lock.remove();
            emote.remove();
            parent.remove();
        }

        // Put all collected emotes into the emote-picker list
        let caughtEmotes = [];

        for(let [name, src] of CAPTURED_EMOTES)
            caughtEmotes.push({ name, src });

        emoteSection =
        furnish('div#twitch-tools-captured-emotes.emote-picker__content-block',
            {
                ondragover: event => {
                    event.preventDefault();
                    // event.dataTransfer.dropEffect = 'move';
                },

                ondrop: async event => {
                    event.preventDefault();

                    return event.dataTransfer.getData('text/plain');
                },
            },

            furnish('div.tw-pd-b-1.tw-pd-t-05.tw-pd-x-1.tw-relative', {},
                // Emote Section Header
                furnish('div.emote-grid-section__header-title.tw-align-items-center.tw-flex.tw-pd-x-1.tw-pd-y-05', {},
                    furnish('p.tw-align-middle.tw-c-text-alt.tw-strong', {
                        innerHTML: "Captured Emotes &mdash; Drag to use"
                    })
                ),

                // Emote Section Container
                furnish('div#twitch-tools-captured-emotes-container.tw-flex.tw-flex-wrap',
                    {
                        class: 'twitch-tools-scrollbar-area',
                        style: 'max-height: 15rem; overflow: hidden scroll;',
                    },
                    ...caughtEmotes.map(CONVERT_TO_CAPTURED_EMOTE)
                )
            )
        );

        parent.insertBefore(emoteSection, parent.firstChild);
    };
    Timers.convert_emotes = 5_000;

    __ConvertEmotes__:
    if(parseBool(Settings.convert_emotes)) {
        // Collect emotes
        let chat_emote_button = $('[data-a-target="emote-picker-button"i]');

        if(!defined(chat_emote_button))
            break __ConvertEmotes__;

        function CollectEmotes() {
            chat_emote_button.click();

            let chat_emote_scroll = $('.emote-picker .simplebar-scroll-content');

            if(!defined(chat_emote_scroll)) {
                chat_emote_button.click();
                return setTimeout(CollectEmotes, 1000);
            }

            $('.emote-picker [class*="tab-content"]').id = 'twitch-tools-hidden-emote-container';

            setTimeout(() => {
                // Grab emotes every couple of seconds
                [1, 2, 4, 8, 16, 32, 64].map(n =>
                    setTimeout(() => {
                        $('.emote-button img:not(.bttv)', true)
                            .map(img => EMOTES.set(img.alt, shrt(img.src)));

                        top.EMOTES = EMOTES;

                        $('#twitch-tools-hidden-emote-container')?.removeAttribute('id');
                    }, 1000 * n)
                );

                chat_emote_scroll.scrollTo(0, 0);
                chat_emote_button.click();
            }, 5000);
        }

        if(defined(chat_emote_button))
            CollectEmotes();
        else
            setTimeout(CollectEmotes, 1000);

        REMARK('Adding emote event listener...');

        // Run the emote catcher on pre-populated messages
        (GetChat.onnewmessage = chat => {
            let regexp;

            for(let emote in chat.emotes)
                if(!EMOTES.has(emote)) {
                    // LOG(`Adding emote "${ emote }"`);

                    EMOTES.set(emote, shrt(chat.emotes[emote]));
                    CAPTURED_EMOTES.set(emote, chat.emotes[emote]);

                    let capturedEmote = CONVERT_TO_CAPTURED_EMOTE({ name: emote, src: chat.emotes[emote] });

                    if(defined(capturedEmote))
                        $('#twitch-tools-captured-emotes-container')?.appendChild?.(capturedEmote);
                }

            for(let line of chat) {
                // Replace emotes for the last 30 chat messages
                if(Queue.emotes.contains(line.uuid))
                    continue;
                if(Queue.emotes.length >= 30)
                    Queue.emotes = [];
                Queue.emotes.push(line.uuid);

                for(let [emote, url] of EMOTES)
                    if((regexp = RegExp('\\b' + emote.replace(/(\W)/g, '\\$1') + '\\b', 'g')).test(line.message)) {
                        let alt = emote,
                            src = '//static-cdn.jtvnw.net/emoticons/v1/' + url.split('-').map((v, i) => i == 0? parseInt(v, 36): v).join('/'),
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
                                        srcset, alt, src,
                                    })
                                )
                            )
                        );

                        let { element } = line;

                        alt = alt.replace(/\s+/g, '_');

                        $(`.text-fragment:not([twitch-tools-converted-emotes~="${alt}"])`, true, element).map(fragment => {
                            let container = furnish('div.chat-line__message--emote-button', { 'data-test-selector': 'emote-button', 'data-captured-emote': alt, innerHTML: img.innerHTML }),
                                converted = (fragment.getAttribute('twitch-tools-converted-emotes') ?? "").split(' ');

                            converted.push(alt);

                            fragment.setAttribute('data-tt-emote', alt);
                            fragment.setAttribute('twitch-tools-converted-emotes', converted.join(' ').trim());
                            fragment.innerHTML = fragment.innerHTML.replace(regexp, container.outerHTML);

                            $('[data-captured-emote]', true, fragment)
                                .forEach(element => {
                                    let { capturedEmote } = element.dataset;
                                });
                        });
                    }
            }

            top.EMOTES = EMOTES;
        })(GetChat());

        REMARK('Adding emote search listener...');

        EmoteSearch.onquery = query => {
            let results = [...EMOTES]
                .filter(([key, value]) => RegExp(query.replace(/(\W)/g, '\\$1'), 'i').test(key))
                .map(([name, src]) => CONVERT_TO_CAPTURED_EMOTE({ name, src }));

            EmoteSearch.appendResults(results, 'captured');
        };

        RegisterJob('convert_emotes');
    }

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
    let UPDATED_FILTER = () => {
        let rules = Settings.filter_rules;

        let channel = [], user = [], badge = [], emote = [], text = [];

        if(defined(rules?.length)) {
            rules = rules.split(/\s*,\s*/).map(rule => rule.trim()).filter(rule => rule.length);

            for(let rule of rules)
                // /channel text
                if(/^\/[\w\-]+/.test(rule)) {
                    let { $_ } = RegExp;

                    let name, text, user, badge, emote;

                    $_.replace(/^\/([\w\-]+) +([<:]([^>]+?)[:>]|(@)?[^]*?)$/, ($0, $1, $2, $3, $4, $$, $_) => {
                        name = $1;

                        if($4 ?? false)
                            user = $2;
                        else if($3 ?? false)
                            if($2[0] == ':')
                                emote = $3;
                            else
                                badge = $3;
                        else
                            text = $2;
                    });

                    channel.push({ name, text, user, badge, emote });
                }
                // @username
                else if(/^@[\w\-]+$/.test(rule)) {
                    let { $_ } = RegExp;

                    user.push($_.replace(/^@/, ''));
                }
                // <badge>
                else if(/^<[\w\- ]+>$/.test(rule)) {
                    let { $_ } = RegExp;

                    badge.push($_.replace(/^<|>$/g, ''));
                }
                // :emote:
                else if(/^:[\w\- ]+:$/.test(rule)) {
                    let { $_ } = RegExp;

                    emote.push($_.replace(/^:|:$/g, ''));
                }
                // text
                else if(rule) {
                    let $_ = rule;

                    text.push(/^[\w\s]+$/.test($_)? `\\b${ $_.trim() }\\b`: $_);
                }
        }

        return {
            text: (text.length? RegExp(`(${ text.join('|') })`, 'i'): /^[\b]$/),
            user: (user.length? RegExp(`(${ user.join('|') })`, 'i'): /^[\b]$/),
            emote: (emote.length? RegExp(`(${ emote.join('|') })`, 'i'): /^[\b]$/),
            badge: (badge.length? RegExp(`(${ badge.join('|') })`, 'i'): /^[\b]$/),
            channel
        }
    };

    let MESSAGE_FILTER;

    Handlers.filter_messages = () => {
        REMARK('Adding message filter event listener...');

        MESSAGE_FILTER ??= GetChat.onnewmessage = chat => {
            let Filter = UPDATED_FILTER();

            censoring:
            for(let line of chat) {
                let { message, mentions, author, badges, emotes, element } = line,
                    reason;

                let censor = parseBool(false
                    // Filter users on all channels
                    || (Filter.user.test(author)? reason = 'user': false)
                    // Filter badges on all channels
                    || (Filter.badge.test(badges)? reason = 'badge': false)
                    // Filter emotes on all channels
                    || (Filter.emote.test(emotes)? reason = 'emote': false)
                    // Filter messges (RegExp) on all channels
                    || (Filter.text.test(message)? reason = 'text': false)
                    // Filter messages/users on specific a channel
                    || Filter.channel.map(({ name, text, user, badge, emote }) => {
                        if(!defined(STREAMER))
                            return;

                        let channel = STREAMER.name?.toLowerCase();

                        return parseBool(false
                            || channel == name.toLowerCase()
                        ) && parseBool(false
                            || (('@' + author) == user? reason = 'channel user': false)
                            || (!!~badges.findIndex(medal => !!~medal.indexOf(badge) && medal.length && badge.length)? reason = 'channel badge': false)
                            || (!!~emotes.findIndex(glyph => !!~glyph.indexOf(emote) && glyph.length && emote.length)? reason = 'channel emote': false)
                            || (text?.test?.(message)? reason = 'channel text': false)
                        )
                    }).contains(true)
                );

                if(!censor)
                    continue censoring;

                LOG(`Censoring message because the ${ reason } matches`, line);

                let hidden = element.getAttribute('twitch-tools-hidden') === 'true';

                if(hidden || mentions.contains(USERNAME))
                    return;

                element.setAttribute('twitch-tools-hidden', true);
            }
        };

        if(defined(MESSAGE_FILTER))
            MESSAGE_FILTER(GetChat(250, true));
    };
    Timers.filter_messages = -2500;

    Unhandlers.filter_messages = () => {
        let hidden = $('[twitch-tools-hidden]', true);

        hidden.map(element => element.removeAttribute('twitch-tools-hidden'));
    };

    __FilterMessages__:
    if(parseBool(Settings.filter_messages)) {
        RegisterJob('filter_messages');
    }

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
    Handlers.easy_filter = () => {
        let card = $('[data-a-target="viewer-card"i], [data-a-target="emote-card"i]'),
            existing = $('#twitch-tools-filter-rule-user, #twitch-tools-filter-rule-emote');

        if(!defined(card) || defined(existing))
            return;

        let title = $('h4', false, card),
            name = title.textContent.toLowerCase(),
            type = (card.getAttribute('data-a-target').toLowerCase() == 'viewer-card'? 'user': 'emote'),
            { filter_rules } = Settings;

        if(type == 'user') {
            /* Filter users */
            if(filter_rules && filter_rules.split(',').contains(`@${ name }`))
                return /* Already filtering messages from this person */;

            let filter = furnish('div#twitch-tools-filter-rule-user', {
                title: `Filter all messages from @${ name }`,
                style: 'cursor:pointer; fill:var(--color-red); font-size:1.1rem; font-weight:normal',
                username: name,

                onclick: event => {
                    let { currentTarget } = event,
                        username = currentTarget.getAttribute('username'),
                        { filter_rules } = Settings;

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
            if(filter_rules && filter_rules.split(',').contains(`:${ name }:`))
                return /* Already filtering this emote */;

            let filter = furnish('div#twitch-tools-filter-rule-emote', {
                title: 'Filter this emote',
                style: 'cursor:pointer; fill:var(--color-red); font-size:1.1rem; font-weight:normal',
                emote: `:${ name }:`,

                onclick: event => {
                    let { currentTarget } = event,
                        emote = currentTarget.getAttribute('emote'),
                        { filter_rules } = Settings;

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

    __EasyFilter__:
    if(parseBool(Settings.filter_messages)) {
        RegisterJob('easy_filter');
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
    Handlers.highlight_mentions = () => {
        let usernames = [USERNAME];

        if(parseBool(Settings.highlight_mentions_extra))
            usernames.push('all', 'chat', 'everyone');

        let chat = GetChat().filter(line => !!~line.mentions.findIndex(username => RegExp(`^(${usernames.join('|')})$`, 'i').test(username)));

        for(let line of chat)
            if(!Queue.messages.contains(line.uuid)) {
                Queue.messages.push(line.uuid);

                let { author, message, reply } = line;

                // LOG('Highlighting message:', { author, message });

                line.element.setAttribute('style', 'background-color: var(--color-background-button-primary-active)');
            }
    };
    Timers.highlight_mentions = 500;

    __HighlightMentions__:
    if(parseBool(Settings.highlight_mentions)) {
        RegisterJob('highlight_mentions');
    }

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
    Handlers.highlight_mentions_popup = () => {
        let chat = GetChat().filter(line => !!~line.mentions.findIndex(username => RegExp(`^${USERNAME}$`, 'i').test(username)));

        for(let line of chat)
            if(!Queue.message_popups.contains(line.uuid)) {
                Queue.message_popups.push(line.uuid);

                let { author, message, reply } = line;

                let existing = $('#twitch-tools-chat-footer');

                if(defined(existing))
                    continue;

                // LOG('Generating footer:', { author, message });

                new ChatFooter(`@${ author } mentioned you.`, {
                    onclick: event => {
                        let chatbox = $('.chat-input__textarea textarea'),
                            existing = $('#twitch-tools-chat-footer');

                        if(defined(chatbox))
                            chatbox.focus();
                        if(defined(existing))
                            existing.remove();

                        reply?.click();
                    },
                });
            }
    };
    Timers.highlight_mentions_popup = 500;

    __HighlightMentionsPopup__:
    if(parseBool(Settings.highlight_mentions_popup)) {
        RegisterJob('highlight_mentions_popup');
    }

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
    let NATIVE_REPLY_POLYFILL;

    Handlers.native_twitch_reply = () => {
        if(defined(NATIVE_REPLY_POLYFILL) || defined($('.chat-line__reply-icon')))
            return;

        if(!defined(GLOBAL_EVENT_LISTENERS.ENTER))
            $('[data-a-target="chat-input"i]')?.addEventListener('keydown', GLOBAL_EVENT_LISTENERS.ENTER = ({ key, altKey, ctrlKey, metaKey, shiftKey }) => {
                if(!(altKey || ctrlKey || metaKey || shiftKey) && key == 'Enter')
                    $('#twitch-tools-close-native-twitch-reply')?.click();
            });

        NATIVE_REPLY_POLYFILL ??= {
            // Button above chat elements
            NewReplyButton: ({ uuid, style, handle, message, mentions, }) => {
                let f = furnish;

                let addedClasses = {
                    bubbleContainer: ['chat-input-tray__open','tw-block','tw-border-b','tw-border-l','tw-border-r','tw-border-radius-large','tw-border-t','tw-c-background-base','tw-elevation-1','tw-left-0','tw-pd-05','tw-right-0','tw-z-below'],
                    chatContainer: ['chat-input-container__open','tw-block','tw-border-bottom-left-radius-large','tw-border-bottom-right-radius-large','tw-c-background-base','tw-pd-05'],
                    chatContainerChild: ['chat-input-container__input-wrapper'],
                },
                removedClasses = {
                    bubbleContainer: ['tw-block','tw-border-radius-large','tw-elevation-0','tw-left-0','tw-pd-0','tw-right-0','tw-z-below'],
                    chatContainer: ['tw-block','tw-border-radius-large','tw-pd-0'],
                };

                return f('div.chat-line__reply-icon.tw-absolute.tw-border-radius-medium.tw-c-background-base.tw-elevation-1', {},
                    f('button.tw-align-items-center.tw-align-middle.tw-border-bottom-left-radius-medium.tw-border-bottom-right-radius-medium.tw-border-top-left-radius-medium.tw-border-top-right-radius-medium.tw-button-icon.tw-core-button.tw-inline-flex.tw-interactive.tw-justify-content-center.tw-overflow-hidden.tw-relative',
                        {
                            'data-test-selector': 'chat-reply-button',

                            onclick: event => {
                                let { currentTarget } = event,
                                    messageElement = currentTarget.closest('div').previousElementSibling,
                                    chatInput = $('[data-a-target="chat-input"i]'),
                                    bubbleContainer = chatInput.closest('div[class=""]').firstElementChild,
                                    chatContainer = bubbleContainer.nextElementSibling,
                                    chatContainerChild = $('div', false, chatContainer);

                                let f = furnish;

                                AddNativeReplyBubble: {
                                    chatContainerChild.classList.add(...addedClasses.chatContainerChild);
                                    bubbleContainer.classList.remove(...removedClasses.bubbleContainer);
                                    bubbleContainer.classList.add(...addedClasses.bubbleContainer);
                                    chatContainer.classList.remove(...removedClasses.chatContainer);
                                    chatContainer.classList.add(...addedClasses.chatContainer);

                                    bubbleContainer.appendChild(
                                        f(`div#twitch-tools-native-twitch-reply.tw-align-items-start.tw-flex.tw-flex-row.tw-pd-0`,
                                            {
                                                'data-test-selector': 'chat-input-tray',
                                            },

                                            f('div.tw-align-center.tw-mg-05', {},
                                                f('div.tw-align-items-center.tw-flex', { innerHTML: Glyphs.modify('reply', { height: '24px', width: '24px' }) })
                                            ),
                                            f('div.tw-flex-grow-1.tw-pd-l-05.tw-pd-y-05', {},
                                                f('span.tw-c-text-alt.tw-font-size-5.tw-strong.tw-word-break-word', {
                                                    'connected-to': uuid,

                                                    handle, message, mentions,

                                                    innerHTML: `Replying to <span style="${ style }">@${handle}</span>`,
                                                })
                                            ),
                                            f('div.tw-right-0.tw-top-0', {},
                                                f('button#twitch-tools-close-native-twitch-reply.tw-align-items-center.tw-align-middle.tw-border-bottom-left-radius-medium.tw-border-bottom-right-radius-medium.tw-border-top-left-radius-medium.tw-border-top-right-radius-medium.tw-button-icon.tw-core-button.tw-inline-flex.tw-interactive.tw-justify-content-center.tw-overflow-hidden.tw-relative',
                                                    {
                                                        onclick: event => {
                                                            let chatInput = $('[data-a-target="chat-input"i]'),
                                                                bubbleContainer = chatInput.closest('div[class=""]').firstElementChild,
                                                                chatContainer = bubbleContainer.nextElementSibling,
                                                                chatContainerChild = $('div', false, chatContainer);

                                                            RemoveNativeReplyBubble: {
                                                                bubbleContainer.classList.remove(...addedClasses.bubbleContainer);
                                                                bubbleContainer.classList.add(...removedClasses.bubbleContainer);
                                                                chatContainer.classList.remove(...addedClasses.chatContainer);
                                                                chatContainer.classList.add(...removedClasses.chatContainer);
                                                                chatContainerChild.classList.remove(...addedClasses.chatContainerChild);

                                                                $('[id^="twitch-tools-native-twitch-reply"i]', true).forEach(element => element.remove());

                                                                chatInput.setAttribute('placeholder', 'Send a message');
                                                            }
                                                        },

                                                        innerHTML: Glyphs.modify('x', { height: '24px', width: '24px' }),
                                                    },
                                                )
                                            )
                                        )
                                    );

                                    bubbleContainer.appendChild(
                                        f('div#twitch-tools-native-twitch-reply-message.font-scale--default.tw-pd-x-1.tw-pd-y-05.chat-line__message',
                                            {
                                                'data-a-target': 'chat-line-message',
                                                'data-test-selector': 'chat-line-message',
                                            },
                                            f('div.tw-relative', { innerHTML: messageElement.outerHTML })
                                        )
                                    );

                                    chatInput.setAttribute('placeholder', 'Send a reply');
                                }

                                chatInput.focus();
                            },
                        },
                        f('span.tw-button-icon__icon', {},
                            f('div',
                                { style: 'width: 2rem; height: 2rem;' },
                                f('div.tw-icon', {},
                                    f('div.tw-aspect', { innerHTML: Glyphs.reply })
                                )
                            )
                        )
                    )
                );
            },

            // Highlighter for chat elements
            AddNativeReplyButton: ({ uuid, style, handle, message, mentions, element }) => {
                if(!defined(element))
                    return;

                if(defined($('.chat-line__message-container', false, element)))
                    return;

                if(handle == USERNAME)
                    return;

                let parent = $('div', false, element);
                if(!defined(parent)) return;

                let target = $('div', false, parent);
                if(!defined(target)) return;

                let highlighter = furnish('div.chat-line__message-highlight.tw-absolute.tw-border-radius-medium', { 'data-test-selector': 'chat-message-highlight' });

                target.classList.add('chat-line__message-container');

                parent.insertBefore(highlighter, parent.firstElementChild);
                parent.appendChild(NATIVE_REPLY_POLYFILL.NewReplyButton({ uuid, style, handle, message, mentions, }));
            },
        };

        REMARK('Adding native reply buttons...');

        GetChat().forEach(NATIVE_REPLY_POLYFILL.AddNativeReplyButton);

        GetChat.onnewmessage = chat => chat.map(NATIVE_REPLY_POLYFILL.AddNativeReplyButton);
    };
    Timers.native_twitch_reply = 1000;

    __NativeTwitchReply__:
    if(parseBool(Settings.native_twitch_reply)) {
        RegisterJob('native_twitch_reply');
    }

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
    let SPAM = [];

    Handlers.prevent_spam = () => {
        REMARK("Adding spam event listener...");

        GetChat.onnewmessage = chat =>
            chat.forEach(line => {
                let lookBack = parseInt(Settings.prevent_spam_look_back ?? 15),
                    minLen = parseInt(Settings.prevent_spam_minimum_length ?? 5),
                    minOcc = parseInt(Settings.prevent_spam_ignore_under ?? 3);

                let { handle, element, message } = line;

                let spam_placeholder = "chat-deleted-message-placeholder";

                function markAsSpam(element, type = 'spam', message) {
                    let span = furnish(`span.chat-line__message--deleted-notice.tiwtch-tools__spam-filter-${ type }`, { 'data-a-target': spam_placeholder, 'data-test-selector': spam_placeholder }, `message marked as ${ type }.`);

                    $('[data-test-selector="chat-message-separator"i] ~ *', true, element).forEach(sibling => sibling.remove());
                    $('[data-test-selector="chat-message-separator"i]', false, element).parentElement.appendChild(span);

                    element.setAttribute(type, message);

                    let tooltip = new Tooltip(element, message, { direction: 'up' });

                    // Re-make the tooltip if the tooltip is too long to display correctly
                    // if(getOffset(tooltip).width > getOffset(element).width)
                    if(message.length > 60) {
                        tooltip.closest('[class]:not([aria-describedby])')?.remove();

                        new Tooltip(element, message, { direction: 'up', style: `width:fit-content; height:auto; white-space:break-spaces;` });
                    }
                }

                // The same message is already posted (within X lines)
                if( defined([...SPAM].slice(-lookBack).find(item => item == message.trim())) ) {
                    message = message.trim();

                    if(message.length < 1)
                        return;

                    markAsSpam(element, 'plagiarism', message);
                }

                // The message contains repetitive (more than X instances) words/phrases
                else if(RegExp(`(\\w{${ minLen },})${ "((?:.+)?\\b\\1)".repeat(minOcc) }`, 'i').test(message)) {
                    message = message.trim();

                    if(message.length < 1)
                        return;

                    markAsSpam(element, 'repetitive', message);
                }

                SPAM = [...SPAM, message.trim()];
            });
    };
    Timers.prevent_spam = -1000;

    __PreventSpam__:
    if(parseBool(Settings.prevent_spam)) {
        RegisterJob('prevent_spam');
    }

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
    Handlers.convert_bits = () => {
        let dropdown = $('[class*="bits-buy"i]'),
            bits_counter = $('[class*="bits-count"]:not([twitch-tools-true-usd-amount])', true),
            bits_cheer = $('[class*="cheer-amount"i]:not([twitch-tools-true-usd-amount])', true),
            hype_trains = $('[class*="community-highlight-stack"i] p:not([twitch-tools-true-usd-amount])', true);

        let bits_num_regexp = /([\d,]+)(?: +bits)?/i,
            bits_alp_regexp = /([\d,]+) +bits/i;

        if(defined(dropdown))
            $('h5:not([twitch-tools-true-usd-amount])', true, dropdown).map(header => {
                let bits = parseInt(header.textContent.replace(/\D+/g, '')),
                    usd;

                usd = (bits * .01).toFixed(2);

                header.textContent += ` ($${ comify(usd) })`;

                header.setAttribute('twitch-tools-true-usd-amount', usd);
            });

        for(let counter of bits_counter) {
            let { innerHTML } = counter;

            if(bits_alp_regexp.test(innerHTML))
                counter.innerHTML = innerHTML.replace(bits_alp_regexp, ($0, $1, $$, $_) => {
                    let bits = parseInt($1.replace(/\D+/g, '')),
                        usd;

                    usd = (bits * .01).toFixed(2);

                    counter.setAttribute('twitch-tools-true-usd-amount', usd);

                    return `${ $0 } ($${ comify(usd) })`;
                });
        }

        for(let cheer of bits_cheer) {
            let { innerHTML } = cheer;

            if(bits_num_regexp.test(innerHTML))
                cheer.innerHTML = innerHTML.replace(bits_num_regexp, ($0, $1, $$, $_) => {
                    let bits = parseInt($1.replace(/\D+/g, '')),
                        usd;

                    usd = (bits * .01).toFixed(2);

                    cheer.setAttribute('twitch-tools-true-usd-amount', usd);

                    return `${ $0 } ($${ comify(usd) })`;
                });
        }

        for(let train of hype_trains) {
            let { innerHTML } = train;

            if(bits_alp_regexp.test(innerHTML))
                train.innerHTML = innerHTML.replace(bits_alp_regexp, ($0, $1, $$, $_) => {
                    let bits = parseInt($1.replace(/\D+/g, '')),
                        usd;

                    usd = (bits * .01).toFixed(2);

                    train.setAttribute('twitch-tools-true-usd-amount', usd);

                    return `${ $0 } ($${ comify(usd) })`;
                });
        }
    };
    Timers.convert_bits = 1000;

    __ConvertBits__:
    if(parseBool(Settings.convert_bits)) {
        RegisterJob('convert_bits');
    }

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
    let CHANNEL_POINTS_MULTIPLIER,
        REWARDS_CALCULATOR_TOOLTIP;

    Handlers.rewards_calculator = () => {
        __GetMultiplierAmount__:
        if(!defined(CHANNEL_POINTS_MULTIPLIER)) {
            let button = $('[data-test-selector="community-points-summary"i] button');

            if(defined(button)) {
                button.click();

                CHANNEL_POINTS_MULTIPLIER = parseFloat($('#channel-points-reward-center-header h6')?.innerText) || 1;

                button.click();
            } else {
                CHANNEL_POINTS_MULTIPLIER = 1;
            }
        }

        let have = parseInt(parseCoin($('[data-test-selector="balance-string"i]')?.innerText) | 0),
            goal = parseInt($('[data-test-selector="RequiredPoints"]')?.previousSibling?.textContent?.replace(/\D+/g, '') ?? 0),
            need = goal - have;

        let container = $('[data-test-selector="RequiredPoints"i]:not(:empty)')?.parentElement;

        if(!defined(container))
            return REWARDS_CALCULATOR_TOOLTIP = null;

        let averageBroadcastTime = STREAMER.data?.dailyBroadcastTime ?? 4.5, // https://theemergence.co.uk/when-is-the-best-time-to-stream-on-twitch/#faq-question-1565821275069
            activeDaysPerWeek = STREAMER.data?.activeDaysPerWeek ?? 5,
            pointsEarnedPerHour = 120 + (200 * +Settings.auto_claim_bonuses); // https://help.twitch.tv/s/article/channel-points-guide

        let tooltip = REWARDS_CALCULATOR_TOOLTIP ??= new Tooltip(container);

        let hours = parseInt(need / (pointsEarnedPerHour * CHANNEL_POINTS_MULTIPLIER)),
            days = (hours / 24) * (24 / averageBroadcastTime),
            weeks = (days / 7) * (7 / activeDaysPerWeek),
            months = weeks / 4,
            years = months / 12;

        let streams = Math.round(hours / averageBroadcastTime),
            estimated = 'minute',
            timeEstimated = 60 * (Math.ceil((need / pointsEarnedPerHour) * 4) / 4);

        if(hours > 1) {
            estimated = 'hour';
            timeEstimated = hours;
        } if(hours > 48) {
            estimated = 'day';
            timeEstimated = days;
        } if(days > 10) {
            estimated = 'week';
            timeEstimated = weeks;
        } if(days > 30) {
            estimated = 'month';
            timeEstimated = months;
        } if(months > 12) {
            estimated = 'year';
            timeEstimated = years;
        } if(years > 100) {
            estimated = 'century';
            timeEstimated = years / 100;
        }

        timeEstimated = parseInt(timeEstimated);

        tooltip.innerHTML =
            `Available ${ (streams < 1 || hours < averageBroadcastTime)? 'during this': `in ${ comify(streams) } more` } ${ "stream".pluralSuffix(streams) } (${ comify(timeEstimated) } ${ estimated.pluralSuffix(timeEstimated) })`;
    };
    Timers.rewards_calculator = 100;

    __RewardsCalculator__:
    if(parseBool(Settings.rewards_calculator)) {
        RegisterJob('rewards_calculator');
    }

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
            f(`${ live_time.tagName }#twitch-tools-points-receipt${ classes(live_time).replace(/\blive-time\b/gi, 'points-receipt') }`, { receipt: 0 })
        );

        parent.appendChild(points_receipt);

        RECEIPT_TOOLTIP ??= new Tooltip(points_receipt);

        COUNTING_POINTS = setInterval(() => {
            let points_receipt = $('#twitch-tools-points-receipt'),
                balance = $('[data-test-selector="balance-string"i]'),
                exact_debt = $('[data-test-selector^="prediction-checkout"i], [data-test-selector*="user-prediction"i][data-test-selector*="points"i], [data-test-selector*="user-prediction"i] p'),
                exact_change = $('[class*="community-points-summary"i][class*="points-add-text"i]');

            let current = parseCoin(balance?.innerText);

            INITIAL_POINTS ??= current;
            EXACT_POINTS_SPENT = parseCoin(exact_debt?.innerText) || (INITIAL_POINTS > current? INITIAL_POINTS - current: EXACT_POINTS_SPENT);

            let animationID = (exact_change?.innerText ?? exact_debt?.innerText ?? (INITIAL_POINTS > current? -EXACT_POINTS_SPENT + '': null)),
                animationTimeStamp = +new Date;

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

        $('#twitch-tools-points-receipt')?.parentElement?.remove();

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
        let rich_tooltip = $('[class*="channel-tooltip"i]');

        // Update the points (every minute)
        if(++pointWatcherCounter % 600) {
            pointWatcherCounter = 0;

            LoadCache('ChannelPoints', ({ ChannelPoints }) => {
                (ChannelPoints ??= {})[STREAMER.name] = $('[data-test-selector="balance-string"i]')?.innerText ?? ChannelPoints[STREAMER.name] ?? 'Unavailable';
                SaveCache({ ChannelPoints });
            });
        }

        if(!defined(rich_tooltip))
            return;

        let pointDisplay = $('.twitch-tools-point-display');
        let [title, subtitle, footer] = $('[class*="online-side-nav-channel-tooltip"i] > *', true, rich_tooltip),
            target = footer?.lastElementChild;

        if(!defined(target))
            return;

        let [name, game] = title.innerText.split(/[^\w\s]/);

        name = name?.trim();
        game = game?.trim();

        // Update the display
        if(defined(pointDisplay))
            LoadCache('ChannelPoints', ({ ChannelPoints }) => pointDisplay.innerHTML = (ChannelPoints ??= {})[name] ?? 0);
        else
            LoadCache('ChannelPoints', ({ ChannelPoints }) => {
                    let text = furnish('span.twitch-tools-point-display', {
                            innerHTML: (ChannelPoints ??= {})[name] ?? 0,
                        }),
                        icon = furnish('span', {
                            innerHTML: ` | ${ Glyphs.channelpoints.replace(/(height|width)="100%"/g, '$1="20px"') } `,
                        });

                    target.appendChild(icon);
                    target.appendChild(text);

                    let svg = $('svg', false, icon);

                    svg.setAttribute('style', 'vertical-align:bottom; height:20px; width:20px');
                }
            );
    };
    Timers.point_watcher_placement = 100;

    Unhandlers.point_watcher_placement = () => {
        $('.twitch-tools-point-display', true)
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
            f(`${ live_time.tagName }#twitch-tools-watch-time${ classes(live_time).replace(/\blive-time\b/gi, 'watch-time') }`, { time: 0 })
        );

        WATCH_TIME_TOOLTIP = new Tooltip(watch_time);

        parent.appendChild(watch_time);

        extra({ parent, container, live_time, placement });

        await LoadCache(['WatchTime', 'Watching'], ({ WatchTime = 0, Watching = NORMALIZED_PATHNAME }) => {
            if(NORMALIZED_PATHNAME == Watching)
                $('#twitch-tools-watch-time').setAttribute('time', WatchTime);

            WATCH_TIME_INTERVAL = setInterval(() => {
                let watch_time = $('#twitch-tools-watch-time'),
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

        $('#twitch-tools-watch-time')?.parentElement?.remove();
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
            PushToTopSearch({ 'twitch-tools-ftpva': (+new Date).toString(36) });
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
        let error = $('[data-a-target="core-error-message"i]'),
            [chat] = $('[role="log"i], [data-test-selector="banned-user-message"i], [data-test-selector^="video-chat"]', true);

        if(!defined(chat))
            error ??= ({ innerText: `The chat element is missing` });
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

        window.onlocationchange = () => {
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
            CUSTOM_CSS = $('#twitch-tools-custom-css') ?? furnish('style#twitch-tools-custom-css', {});

CUSTOM_CSS.innerHTML =
`
#twitch-tools-auto-claim-bonuses .tw-z-above, [plagiarism], [repetitive] { display: none }
#twitch-tools-hidden-emote-container::after {
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
#twitch-tools-hidden-emote-container .simplebar-scroll-content { visibility: hidden }
.twitch-tools-first-run {
    border: 1px solid var(--color-blue);
    border-radius: 3px;

    transition: border 1s;
}
[animationID] a { cursor: grab }
[animationID] a:active { cursor: grabbing }
[twitch-tools-hidden] { display: none }
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
                        for(let element of $('#twitch-tools-auto-claim-bonuses, [up-next--container]', true))
                            element.classList.add('twitch-tools-first-run');

                        setTimeout(() => {
                            $('.twitch-tools-first-run', true)
                                .forEach(element => element.classList.remove('twitch-tools-first-run'));
                        }, 30_000);
                    }, 5_000);
                    break;
            }

            Storage.set({ onInstalledReason: null });
        }
    }
}, 500);
