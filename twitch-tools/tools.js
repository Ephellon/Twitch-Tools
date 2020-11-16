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
    Jobs = {},
    Queue = { balloons: [], bullets: [], emotes: [], messages: [], message_popups: [], popups: [] },
    Timers = {},
    Handlers = {},
    Unhandlers = {},
    // These won't change (often)
    USERNAME;

// Populate the username field by quickly showing the menu
if(defined(display)) {
    display.click();
    USERNAME = $('[data-a-target="user-display-name"i]').innerText;
    display.click();
}

let browser, Storage, Runtime, Extension, Container, BrowserNamespace;

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

        Storage = Storage.sync ?? Storage.local;
        break;

    case 'chrome':
    default:
        Runtime = Container.runtime;
        Storage = Container.storage;
        Extension = Container.extension;

        Storage = Storage.sync ?? Storage.local;
        break;
}

// https://stackoverflow.com/a/2117523/4211612
// https://gist.github.com/jed/982883
// Creates a random UUID
    // new UUID() -> Object
    // UUID.from(string:string) -> Object
    // UUID.BWT(string:string) -> String
    // UUID.prototype.toString() -> String
class UUID {
    static #BWT_SEED = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, x => (x ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> x / 4).toString(16))

    constructor() {
        let native = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, x => (x ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> x / 4).toString(16));

        this.native = native;

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
        let hash = Uint8Array.from(btoa([`private-key=${ UUID.#BWT_SEED }`, `content="${ key.replace(/[^\u0000-\u00ff]+/g, '').slice(-255) }"`,`public-key=${ USERNAME }`].map(UUID.BWT).join('<% PUB-BWT-KEY %>')).split('').map(character => character.charCodeAt(0))),
            l = hash.length,
            i = 0;

        hash = hash.map(n => hash[n & 255] ^ hash[n | 170] ^ hash[n ^ 85] ^ hash[-~n] ^ n);

        let native = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, x => (x ^ hash[++i<l?i:i=0] & 15 >> x / 4).toString(16));

        this.native = native;

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
            U, S, M, G, T, W;

        let uuid = U = UUID.from(subject).toString(),
            existing = Popup.#POPUPS.get(subject);

        if(defined(existing))
            return existing;

        if(defined(X)) {
            if(!~Queue.popups.map(popup => popup.uuid).indexOf(uuid)) {
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

        let p =
        f('div#twitch-tools-popup.tw-absolute.tw-mg-t-5', { 'twitch-tools-id': subject.replace(/\s+/g, '-'), style: 'z-index:9; bottom:10rem; right:1rem' },
            f('div.tw-animation.tw-animation--animate.tw-animation--bounce-in.tw-animation--duration-medium.tw-animation--fill-mode-both.tw-animation--timing-ease', { 'data-a-target': 'tw-animation-target' },
                f('div', {},
                    f('div.tw-border-b.tw-border-l.tw-border-r.tw-border-radius-small.tw-border-t.tw-c-background-base.tw-elevation-2.tw-flex.tw-flex-nowrap.tw-mg-b-1', {
                            style: 'background-color:var(--color-twitch-purple-4)!important'
                        },
                        f('div', {},
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
                                            f('span', {},
                                                f('div', {},
                                                    S = f('p', {}, subject)
                                                )
                                            )
                                        ),
                                        f('div.tw-flex-shrink-0.tw-mg-t-05', {},
                                            M = f('div.tw-c-text-alt-2', {}, message)
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

        let uuid = U = UUID.from([title, JSON.stringify(jobs)].join(':')).toString(),
            existing = Balloon.#BALLOONS.get(title);

        if(defined(existing))
            return existing;

        if(defined(X)) {
            if(!~Queue.balloons.map(popup => popup.uuid).indexOf(uuid)) {
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
                        f('div.tw-inline-flex.tw-relative.tw-tooltip-wrapper', {},
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
                    f(`div#twitch-tools-balloon-${ U }.tw-absolute.tw-balloon.tw-balloon--down.tw-balloon--right.tw-balloon-lg.tw-block`,
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

                                                if(empty(balloon))
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
                                        guid = guid = UUID.from([href, message].join(':')).toString();

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
                                                                                f('span.twitch-tools-balloon-subheader.tw-c-text-alt-2', { innerHTML: subheader })
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

        this.tooltip = furnish('div.tw-tooltip.tw-tooltip--align-center.tw-tooltip--down', { id: `balloon-tooltip-for-${ U }`, role: 'tooltip' }, this.title = title);

        Balloon.#BALLOONS.set(title, this);

        return this;
    }

    addButton({ left = false, icon = 'play', onclick = ($=>$), attributes = {} }) {
        let parent = this.header.closest('div[class*="header"]');
        let uuid = UUID.from(onclick.toString()).toString(),
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
                guid = UUID.from(href).toString(),
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
                                                        f('span.twitch-tools-balloon-subheader.tw-c-text-alt-2', { innerHTML: subheader })
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
            uuid = UUID.from(text).toString();

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

// Creates a Twitch-style chat footer
    // new ChatFooter(title:string[, options:object]) -> Element~ChatFooter
class ChatFooter {
    static #FOOTERS = new Map()

    constructor(title, options = {}) {
        let f = furnish;

        let uuid = UUID.from(title).toString(),
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
                    background-color: var(--color-twitch-purple);
                    margin-bottom: 5rem!important;
                    left: 50%;
                    transform: translateX(-50%);
                    `
                },

                f('button.tw-align-items-center tw-align-middle tw-border-bottom-left-radius-medium tw-border-bottom-right-radius-medium tw-border-top-left-radius-medium tw-border-top-right-radius-medium tw-core-button tw-core-button--overlay tw-core-button--text tw-inline-flex tw-interactive tw-justify-content-center tw-overflow-hidden tw-relativ', { ...options },
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
            message = $('.chat-line__message .text-fragment, .chat-line__message img, .chat-line__message a, p, div[class*="inline"]:first-child:last-child', true, line),
            mentions = $('.mention-fragment', true, line).map(element => element.innerText.replace('@', '').toLowerCase()).filter(text => /^[a-z_]\w+$/i.test(text)),
            badges = $('.chat-badge', true, line).map(img => img.alt.toLowerCase()),
            style = $('.chat-line__username [style]', true, line).map(element => element.getAttribute('style')).join(';'),
            reply = $('button[data-test-selector="chat-reply-button"i]', false, line);

        let [raw] = message.splice(0, 1);

        raw = raw?.innerText;

        message = message
            .map(element => element.alt && keepEmotes? `:${ (e=>(emotes[e.alt]=e.src,e)).alt }:`: element.innerText)
            .filter(defined)
            .join(' ')
            .trim()
            .replace(/(\s){2,}/g, '$1');

        let uuid = UUID.from([author, mentions.join(','), message].join(':')).toString();

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
            deleted: defined($('[class*="--deleted-notice"i]', false, line)),
            highlighted: !!(line.classList.value.split(' ').filter(value => /^chat-line--/i.test(value)).length),
        });
    }

    let bullets = $('[role="log"i] .tw-accent-region, [role="log"i] [data-test-selector="user-notice-line"i], [role="log"i] [class*="gift"i]', true).slice(-lines);

    results.bullets = [];

    for(let bullet of bullets) {
        let message = $('.mention-fragment, .chat-line__username, .chat-line__message .text-fragment, .chat-line__message img, .chat-line__message a, p, [class^="tw-c-text-"i]', true, bullet),
            mentions = $('.chatter-name, strong', true, bullet).map(element => element.innerText.toLowerCase()).filter(text => /^[a-z_]\w+$/i.test(text)),
            subject = (subject =>
                /\braid/i.test(subject)?      'raid': // Incoming raid
                /\bredeem/i.test(subject)?    'cash': // Redeeming (spending) channel points
                /\bcontinu/i.test(subject)?   'keep': // Continuing a gifted subscription
                /\bgift/i.test(subject)?      'gift': // Gifting a subscription
                /\b(re)?subs/i.test(subject)? 'dues': // New subscription, or continued subscription
                null                                  // No subject
            )($('*:first-child', false, bullet)?.textContent);

        if(!defined(subject) && message.length < 1)
            continue;

        let [raw] = message.splice(0, 1);

        raw = raw?.innerText;

        message = message
            .map(element => element.alt && keepEmotes? `:${ (e=>{emotes[e.alt]=e.src;return e})(element).alt }:`: element.innerText)
            .filter(defined)
            .join(' ')
            .trim()
            .replace(/(\s){2,}/g, '$1');

        let uuid = UUID.from([subject, mentions.join(','), message].join(':')).toString();

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
            let name = callback.name || UUID.from(callback.toString()).toString();

            if(GetChat.__onnewmessage__.has(name))
                return GetChat.__onnewmessage__.get(name);

            LOG('Adding [on new message] event listener', { [name]: callback });

            return GetChat.__onnewmessage__.set(name, callback);
        },

        get() {
            return GetChat.__onnewmessage__.size;
        },
    },
    __onnewmessage__: { value: new Map() },
});

// Pushes parameters to the URL's search
    // PushToSearch(newParameters:object[, reload:boolean]) -> String#URL.Search
function PushToSearch(newParameters, reload = true) {
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
    // RemoveFromSearch(keys:array[, reload:boolean]) -> String#URL.Search
function RemoveFromSearch(keys, reload = true) {
    let { searchParameters } = parseURL(location),
        parameters = { ...searchParameters };

    let search = [];
    for(let parameter in parameters)
        if(!~keys.indexOf(parameter))
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
        hash:            (data[i++] || e)
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
        ];

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
            break;

        case 'clock':
            format = 'hour:minute:second';

        default:
            joining_symbol = '';

            for(let [name, value] of times)
                if(milliseconds >= value) {
                    let amount = (milliseconds / value) | 0;

                    time.push(time[name] = ('00' + amount).slice(-2));

                    milliseconds -= amount * value;
                }

            times.push(['millisecond', milliseconds]);

            time = format.split(/\b(year|day|hour|minute|(?:milli)?second)s?\b/g)
                .map($1 => {
                    for(let [name, value] of times)
                        if($1 == 'millisecond')
                            return milliseconds;
                        else if(name == $1)
                            return time[name] ?? '00';

                    return $1;
                })
            break;
    }

    return time.join(joining_symbol);
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
function parseCoin(amount) {
    let points = 0,
        COIN, UNIT;

    amount = amount.replace(/([\d\.]+)\s*([kMBT])?/i, ($0, $1, $2, $$, $_) => {
        COIN = $1;
        UNIT = ($2 ?? '').toUpperCase();
    });

    for(let index = 0, units = ['', 'K', 'M', 'B', 'T']; index < units.length; index++)
        if(units[index] == UNIT)
            points = parseFloat(COIN) * (1e3 ** index);

    return points;
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

    let smol = text => (text?.textContent ?? text?.value ?? text).toLowerCase();

    let current = qualities.find(({ input }) => input.checked);

    if(!defined(current))
        return /* Is the streamer live? */;

    let quality = new String(current.label.textContent);

    let source = current.uuid == qualities.find(({ label }) => /source/i.test(smol(label)))?.uuid,
        auto   = current.uuid == qualities.find(({ label }) => /auto/i.test(smol(label)))?.uuid,
        high   = current.uuid == qualities.find(({ label }) => !/auto|source/i.test(smol(label)))?.uuid,
        low    = current.uuid == qualities[qualities.length - 1]?.uuid;

    Object.defineProperties(quality, {
        auto:   { value: auto },
        high:   { value: high },
        low:    { value: low },
        source: { value: source },
    });

    if(buttons.options)
        buttons.settings.click();

    return quality;
}

// Change the video quality
    // ChangeQuality([quality:string[, backup:string]]) -> Object#{ __old__:Object={ input:Element, label:Element }, __new__:Object={ input:Element, label:Element } }
async function ChangeQuality(quality = 'auto', backup = 'source') {
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

    let smol = text => (text?.textContent ?? text?.value ?? text).toLowerCase();

    qualities.source = qualities.find(({ label }) => /source/i.test(smol(label)));
    qualities.auto   = qualities.find(({ label }) => /auto/i.test(smol(label)));
    qualities.high   = qualities.find(({ label }) => !/auto|source/i.test(smol(label)));
    qualities.low    = qualities[qualities.length - 1];

    let current = qualities.find(({ input }) => input.checked),
        desired;

    if(/(auto|high|low|source)/i.test(quality))
        desired = qualities[RegExp.$1];
    else
        desired = qualities.find(({ label }) => !!~smol(label).indexOf(quality.toLowerCase())) ?? null;

    if(desired === null)
        /* The desired quality does not exist */
        desired = qualities.auto;
    else if(current?.uuid === desired?.uuid)
        /* Already on desired quality */
        /* Do nothing */;
    else
        /* The desired quality is available */
        current.input.checked = !(desired.input.checked = !0);

    desired.input.click();

    if(buttons.options)
        buttons.settings.click();

    return { __old__: current, __new__: desired }
}

// Returns if an item is of an object class
    // isObj([object:*[, ...or:Function=Constructor]]) -> Boolean
function isObj(object, ...or) {
    return !![Object, Array, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, Map, Set, ...or]
        .find(constructor => object?.constructor === constructor || object instanceof constructor);
}

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

    console.group(`%c\u22b3 [LOG] \u2014 Twitch Tools`, CSS);

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

    console.group(`%c\u26a0 [WARNING] \u2014 Twitch Tools`, CSS);

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

    console.group(`%c\u2298 [ERROR] \u2014 Twitch Tools`, CSS);

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

/*** Available SVG glyphs
 * bonuschannelpoints
 * more_horizontal
 * more_vertical
 * channelpoints
 * checkmark
 * favorite
 * emotes
 * search
 * stream
 * trophy
 * upload
 * wallet
 * close
 * globe
 * leave
 * music
 * pause
 * reply
 * stats
 * trash
 * bits
 * chat
 * gift
 * help
 * lock
 * loot
 * moon
 * play
 * star
 * eye
 * mod
 * cog
 * x
 */
let Glyphs = {
    bonuschannelpoints: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M16.503 3.257L18 7v11H2V7l1.497-3.743A2 2 0 015.354 2h9.292a2 2 0 011.857 1.257zM5.354 4h9.292l1.2 3H4.154l1.2-3zM4 9v7h12V9h-3v4H7V9H4zm7 0v2H9V9h2z" clip-rule="evenodd"></path></g></svg>',

    more_horizontal: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M2 10a2 2 0 114 0 2 2 0 01-4 0zM8 10a2 2 0 114 0 2 2 0 01-4 0zM16 8a2 2 0 100 4 2 2 0 000-4z"></path></g></svg>',

    more_vertical: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 18a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM8 4a2 2 0 104 0 2 2 0 00-4 0z"></path></g></svg>',
    channelpoints: '<svg fill="#9147ff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 6a4 4 0 014 4h-2a2 2 0 00-2-2V6z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>',

    checkmark: '<svg fill="#22fa7c" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M4 10l5 5 8-8-1.5-1.5L9 12 5.5 8.5 4 10z"></path></g></svg>',

    favorite: '<svg fill="#bb1411" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9.171 4.171A4 4 0 006.343 3H6a4 4 0 00-4 4v.343a4 4 0 001.172 2.829L10 17l6.828-6.828A4 4 0 0018 7.343V7a4 4 0 00-4-4h-.343a4 4 0 00-2.829 1.172L10 5l-.829-.829z" fill-rule="evenodd" clip-rule="evenodd"></path></g></svg>',

    emotes: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M7 11a1 1 0 100-2 1 1 0 000 2zM14 10a1 1 0 11-2 0 1 1 0 012 0zM10 14a2 2 0 002-2H8a2 2 0 002 2z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>',
    search: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M13.192 14.606a7 7 0 111.414-1.414l3.101 3.1-1.414 1.415-3.1-3.1zM14 9A5 5 0 114 9a5 5 0 0110 0z" clip-rule="evenodd"></path></g></svg>',
    stream: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9 8l3 2-3 2V8z"></path><path fill-rule="evenodd" d="M4 2H2v16h2v-2h12v2h2V2h-2v2H4V2zm12 4H4v8h12V6z" clip-rule="evenodd"></path></g></svg>',
    trophy: '<svg fill="#ff9147" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M5 10h.1A5.006 5.006 0 009 13.9V16H7v2h6v-2h-2v-2.1a5.006 5.006 0 003.9-3.9h.1a3 3 0 003-3V4h-3V2H5v2H2v3a3 3 0 003 3zm2-6h6v5a3 3 0 11-6 0V4zm8 2v2a1 1 0 001-1V6h-1zM4 6h1v2a1 1 0 01-1-1V6z"></path></g></svg>',
    upload: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M2 16v-3h2v3h12v-3h2v3a2 2 0 01-2 2H4a2 2 0 01-2-2zM15 7l-1.5 1.5L11 6v7H9V6L6.5 8.5 5 7l5-5 5 5z"></path></g></svg>',
    wallet: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M12 11h2v2h-2v-2z"></path><path fill-rule="evenodd" d="M13.45 2.078L2 6v12h14a2 2 0 002-2V8a2 2 0 00-2-2V4.001a2 2 0 00-2.55-1.923zM14 6V4.004L8.172 6H14zM4 8v8h12V8H4z" clip-rule="evenodd"></path></g></svg>',

    close: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M4 16V4H2v12h2zM13 15l-1.5-1.5L14 11H6V9h8l-2.5-2.5L13 5l5 5-5 5z"></path></g></svg>',
    globe: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M10 2c4.415 0 8 3.585 8 8s-3.585 8-8 8-8-3.585-8-8 3.585-8 8-8zm5.917 9a6.015 6.015 0 01-3.584 4.529A10 10 0 0013.95 11h1.967zm0-2a6.015 6.015 0 00-3.584-4.529A10 10 0 0113.95 9h1.967zm-3.98 0A8.002 8.002 0 0010 4.708 8.002 8.002 0 008.063 9h3.874zm-3.874 2A8.002 8.002 0 0010 15.292 8.002 8.002 0 0011.937 11H8.063zM6.05 11a10 10 0 001.617 4.529A6.014 6.014 0 014.083 11H6.05zm0-2a10 10 0 011.617-4.529A6.014 6.014 0 004.083 9H6.05z" clip-rule="evenodd"></path></g></svg>',
    leave: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M16 18h-4a2 2 0 01-2-2v-2h2v2h4V4h-4v2h-2V4a2 2 0 012-2h4a2 2 0 012 2v12a2 2 0 01-2 2z"></path><path d="M7 5l1.5 1.5L6 9h8v2H6l2.5 2.5L7 15l-5-5 5-5z"></path></g></svg>',
    music: '<svg fill="#9147ff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M18 4.331a2 2 0 00-2.304-1.977l-9 1.385A2 2 0 005 5.716v7.334A2.5 2.5 0 106.95 16H7V9.692l9-1.385v2.743A2.5 2.5 0 1017.95 14H18V4.33zm-2 0L7 5.716v1.953l9-1.385V4.33z" clip-rule="evenodd"></path></g></svg>',
    pause: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M8 3H4v14h4V3zM16 3h-4v14h4V3z"></path></g></svg>',
    reply: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M8.5 5.5L7 4L2 9L7 14L8.5 12.5L6 10H10C12.2091 10 14 11.7909 14 14V16H16V14C16 10.6863 13.3137 8 10 8H6L8.5 5.5Z"></path></g></svg>',
    stats: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M7 10h2v4H7v-4zM13 6h-2v8h2V6z"></path><path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm12 2H4v12h12V4z" clip-rule="evenodd"></path></g></svg>',
    trash: '<svg fill="#bb1411" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M12 2H8v1H3v2h14V3h-5V2zM4 7v9a2 2 0 002 2h8a2 2 0 002-2V7h-2v9H6V7H4z"></path><path d="M11 7H9v7h2V7z"></path></g></svg>',

    bits: '<svg fill="#9147ff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M3 12l7-10 7 10-7 6-7-6zm2.678-.338L10 5.487l4.322 6.173-.85.728L10 11l-3.473 1.39-.849-.729z"></path></g></svg>',
    chat: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M7.828 13L10 15.172 12.172 13H15V5H5v8h2.828zM10 18l-3-3H5a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2l-3 3z" clip-rule="evenodd"></path></g></svg>',
    gift: '<svg fill="#9147ff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M16 6h2v6h-1v6H3v-6H2V6h2V4.793c0-2.507 3.03-3.762 4.803-1.99.131.131.249.275.352.429L10 4.5l.845-1.268a2.81 2.81 0 01.352-.429C12.969 1.031 16 2.286 16 4.793V6zM6 4.793V6h2.596L7.49 4.341A.814.814 0 006 4.793zm8 0V6h-2.596l1.106-1.659a.814.814 0 011.49.451zM16 8v2h-5V8h5zm-1 8v-4h-4v4h4zM9 8v2H4V8h5zm0 4H5v4h4v-4z" clip-rule="evenodd"></path></g></svg>',
    help: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9 8a1 1 0 011-1h.146a.87.87 0 01.854.871c0 .313-.179.6-.447.735A2.81 2.81 0 009 11.118V12h2v-.882a.81.81 0 01.447-.724A2.825 2.825 0 0013 7.871C13 6.307 11.734 5 10.146 5H10a3 3 0 00-3 3h2zM9 14a1 1 0 112 0 1 1 0 01-2 0z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm8 6a6 6 0 110-12 6 6 0 010 12z"></path></g></svg>',
    lock: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M14.001 5.99A3.992 3.992 0 0010.01 2h-.018a3.992 3.992 0 00-3.991 3.99V8H3.999v8c0 1.105.896 2 2 2h8c1.104 0 2-.895 2-2V8h-1.998V5.99zm-2 2.01V5.995A1.996 1.996 0 0010.006 4h-.01a1.996 1.996 0 00-1.995 1.995V8h4z" clip-rule="evenodd"></path></g></svg>',
    loot: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M11 2H9v3h2V2z"></path><path fill-rule="evenodd" d="M18 18v-7l-1.447-2.894A2 2 0 0014.763 7H5.237a2 2 0 00-1.789 1.106L2 11v7h16zM5.236 9h9.528l1 2H4.236l1-2zM4 13v3h12v-3h-5v1H9v-1H4z" clip-rule="evenodd"></path><path d="M4 3h2v2H4V3zM14 3h2v2h-2V3z"></path></g></svg>',
    moon: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M8.614 2.134a8.001 8.001 0 001.388 15.879 8.003 8.003 0 007.884-6.635 6.947 6.947 0 01-2.884.62 7.004 7.004 0 01-6.388-9.864zM6.017 5.529a5.989 5.989 0 00-2.015 4.484c0 3.311 2.69 6 6 6a5.99 5.99 0 004.495-2.028 9.006 9.006 0 01-8.48-8.456z" clip-rule="evenodd"></path></g></svg>',
    play: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M5 17.066V2.934a.5.5 0 01.777-.416L17 10 5.777 17.482A.5.5 0 015 17.066z"></path></g></svg>',
    star: '<svg fill="#ff9147" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M11.456 8.255L10 5.125l-1.456 3.13-3.49.485 2.552 2.516-.616 3.485L10 13.064l3.01 1.677-.616-3.485 2.553-2.516-3.491-.485zM7.19 6.424l-4.2.583c-.932.13-1.318 1.209-.664 1.853l3.128 3.083-.755 4.272c-.163.92.876 1.603 1.722 1.132L10 15.354l3.579 1.993c.846.47 1.885-.212 1.722-1.132l-.755-4.272 3.128-3.083c.654-.644.268-1.723-.664-1.853l-4.2-.583-1.754-3.77c-.406-.872-1.706-.872-2.112 0L7.19 6.424z" clip-rule="evenodd"></path></g></svg>',

    eye: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M11.998 10a2 2 0 11-4 0 2 2 0 014 0z"></path><path fill-rule="evenodd" d="M16.175 7.567L18 10l-1.825 2.433a9.992 9.992 0 01-2.855 2.575l-.232.14a6 6 0 01-6.175 0 35.993 35.993 0 00-.233-.14 9.992 9.992 0 01-2.855-2.575L2 10l1.825-2.433A9.992 9.992 0 016.68 4.992l.233-.14a6 6 0 016.175 0l.232.14a9.992 9.992 0 012.855 2.575zm-1.6 3.666a7.99 7.99 0 01-2.28 2.058l-.24.144a4 4 0 01-4.11 0 38.552 38.552 0 00-.239-.144 7.994 7.994 0 01-2.28-2.058L4.5 10l.925-1.233a7.992 7.992 0 012.28-2.058 37.9 37.9 0 00.24-.144 4 4 0 014.11 0l.239.144a7.996 7.996 0 012.28 2.058L15.5 10l-.925 1.233z" clip-rule="evenodd"></path></g></svg>',
    mod: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M5.003 3.947A10 10 0 009.519 2.32L10 2l.48.32A10 10 0 0016.029 4H17l-.494 5.641a9 9 0 01-4.044 6.751L10 18l-2.462-1.608a9 9 0 01-4.044-6.75L3 4h.972c.346 0 .69-.018 1.031-.053zm.174 1.992l.309 3.528a7 7 0 003.146 5.25l1.368.894 1.368-.893a7 7 0 003.146-5.25l.309-3.529A12 12 0 0110 4.376 12 12 0 015.177 5.94z" clip-rule="evenodd"></path></g></svg>',
    cog: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 8a2 2 0 100 4 2 2 0 000-4z"></path><path fill-rule="evenodd" d="M9 2h2a2.01 2.01 0 001.235 1.855l.53.22a2.01 2.01 0 002.185-.439l1.414 1.414a2.01 2.01 0 00-.439 2.185l.22.53A2.01 2.01 0 0018 9v2a2.01 2.01 0 00-1.855 1.235l-.22.53a2.01 2.01 0 00.44 2.185l-1.415 1.414a2.01 2.01 0 00-2.184-.439l-.531.22A2.01 2.01 0 0011 18H9a2.01 2.01 0 00-1.235-1.854l-.53-.22a2.009 2.009 0 00-2.185.438L3.636 14.95a2.009 2.009 0 00.438-2.184l-.22-.531A2.01 2.01 0 002 11V9c.809 0 1.545-.487 1.854-1.235l.22-.53a2.009 2.009 0 00-.438-2.185L5.05 3.636a2.01 2.01 0 002.185.438l.53-.22A2.01 2.01 0 009 2zm-4 8l1.464 3.536L10 15l3.535-1.464L15 10l-1.465-3.536L10 5 6.464 6.464 5 10z" clip-rule="evenodd"></path></g></svg>',

    x: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M8.5 10L4 5.5 5.5 4 10 8.5 14.5 4 16 5.5 11.5 10l4.5 4.5-1.5 1.5-4.5-4.5L5.5 16 4 14.5 8.5 10z"></path></g></svg>',
};

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
    channels.findIndex(ch => ch.name === channel.name) == index;

// Returns whether or not a channel is live (used with `Array..filter`)
    // isLive(channel:object#Channel) -> boolean
let isLive = channel => channel?.live;

// Opens the side panel to expose all channels. Returns whether the panel was already open
    // OpenPanel([close:boolean]) -> boolean
async function OpenPanel(close = false) {
    // Open the side panel
    let element;

    // Is the nav open?
    let open = defined($('[data-a-target="side-nav-search-input"]')),
        sidenav = $('[data-a-target="side-nav-arrow"i]');

    // Open the Side Nav
    if(!open) // Only open it if it isn't already
        sidenav?.click();

    // Click "show more" as many times as possible
    while(defined(element = $('[data-a-target="side-nav-show-more-button"]')))
        element.click();

    if(close)
        await ClosePanel(open);

    return open;
}

// Closes the side panel
    // ClosePanel([open:boolean]) -> undefined
async function ClosePanel(open = false) {
    // Close the side panel
    let element;

    // Is the nav open?
    let sidenav = $('[data-a-target="side-nav-arrow"i]');

    // Click "show less" as many times as possible
    while(defined(element = $('[data-a-target="side-nav-show-less-button"]')))
        element.click();

    // Close the Side Nav
    if(!open) // Only close it if it wasn't open in the first place
        sidenav?.click();
}

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

let __ONLOCATIONCHANGE__ = [];

Object.defineProperties(top, {
    onlocationchange: {
        get() {
            return __ONLOCATIONCHANGE__[__ONLOCATIONCHANGE__.length - 1] ?? null;
        },

        set(listener) {
            __ONLOCATIONCHANGE__.push(listener);

            return listener;
        }
    }
});

async function update() {
    // The location
    PATHNAME = top.location.pathname;

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

                            let parent = $(`.search-tray [href$="${ pathname }"]:not([href*="/search?"])`),
                                live = defined($(`[data-test-selector="live-badge"i]`, false, parent));

                            // if(LIVE_CACHE.has(pathname))
                            //     return LIVE_CACHE.get(pathname);
                            // LIVE_CACHE.set(pathname, live);

                            return live;
                        },
                        name: $('img', false, element)?.alt,
                    };

                    element.setAttribute('draggable', true);
                    element.setAttribute('twitch-tools-streamer-data', JSON.stringify(channel));
                    element.ondragstart ||= event => {
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

                            let parent = $(`#sideNav .side-nav-section [href$="${ pathname }"]`),
                                live = defined(parent) && empty($(`[class*="--offline"i]`, false, parent));

                            // if(!defined(parent) && LIVE_CACHE.has(pathname))
                            //     return LIVE_CACHE.get(pathname);
                            // LIVE_CACHE.set(pathname, live);

                            return live;
                        },
                        name: $('img', false, element)?.alt,
                    };

                    element.setAttribute('draggable', true);
                    element.setAttribute('twitch-tools-streamer-data', JSON.stringify(streamer));
                    element.ondragstart ||= event => {
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

                            let parent = $(`#sideNav .side-nav-section[aria-label*="followed"i] [href$="${ pathname }"]`),
                                live = defined(parent) && empty($(`[class*="--offline"i]`, false, parent));

                            // if(!defined(parent) && LIVE_CACHE.has(pathname))
                            //     return LIVE_CACHE.get(pathname);
                            // LIVE_CACHE.set(pathname, live);

                            return live;
                        },
                        name: $('img', false, element)?.alt,
                    };

                    element.setAttribute('draggable', true);
                    element.setAttribute('twitch-tools-streamer-data', JSON.stringify(streamer));
                    element.ondragstart ||= event => {
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
        $('[data-test-selector="onsite-notifications-toast-manager"i] [data-test-selector^="onsite-notification-toast"i]', true).map(
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
            }
        )
    ].filter(uniqueChannels);

    // Every channel
        // Putting the channels in this order guarantees channels already defined aren't overridden
    ALL_CHANNELS = [...ALL_CHANNELS, ...SEARCH, ...NOTIFICATIONS, ...STREAMERS, ...CHANNELS, STREAMER].filter(defined).filter(uniqueChannels);
}

// Registers a job
    // RegisterJob(JobName:string) -> Number=IntervalID
function RegisterJob(JobName) {
    return Jobs[JobName] ??= Timers[JobName] > 0?
        setInterval(Handlers[JobName], Timers[JobName]):
    setTimeout(Handlers[JobName], -Timers[JobName]);
}

// Unregisters a job
    // UnregisterJob(JobName:string) -> undefined
function UnregisterJob(JobName) {
    clearInterval(Jobs[JobName]);
    delete Jobs[JobName];

    let unhandler = Unhandlers[JobName];

    if(defined(unhandler))
        unhandler();
}

// Settings have been saved
let EXPERIMENTAL_FEATURES = ['convert_emotes', 'kill_extensions', 'fine_details', 'native_twitch_reply'],
    SENSITIVE_FEATURES = ['away_mode', 'away_mode_placement', 'auto_accept_mature', 'prevent_hosting', 'prevent_raiding', 'watch_time_placement'];

Storage.onChanged.addListener((changes, namespace) => {
    let reload = false;

    for(let key in changes) {
        let change = changes[key],
            { oldValue, newValue } = change;

        let name = key.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['',' '][+!!$1] + $2.toUpperCase());

        if(newValue === false) {

            if(!!~EXPERIMENTAL_FEATURES.indexOf(key))
                WARN(`Disabling experimental setting: ${ name }`, new Date);
            else
                LOG(`Disabling setting: ${ name }`, new Date);

            UnregisterJob(key);
        } else if(newValue === true) {

            if(!!~EXPERIMENTAL_FEATURES.indexOf(key))
                WARN(`Enabling experimental setting: ${ name }`, new Date);
            else
                LOG(`Enabling setting: ${ name }`, new Date);

            RegisterJob(key);
        } else {

            if(!!~EXPERIMENTAL_FEATURES.indexOf(key))
                WARN(`Modifying experimental setting: ${ name }`, { oldValue, newValue }, new Date);
            else
                LOG(`Modifying setting: ${ name }`, { oldValue, newValue }, new Date);

            // Adjust the timer to compensate for lost time
            // new-time-left = (old-wait-time - old-time-left) + (new-wait-time - old-wait-time)
            // if(/(\w+)_time_minutes$/i.test(key))
            //     FIRST_IN_LINE_TIMER = (FIRST_IN_LINE_WAIT_TIME - FIRST_IN_LINE_TIMER) + ((parseInt(settings[RegExp.$1] === true? newValue: 0) | 0) - FIRST_IN_LINE_WAIT_TIME);
        }

        reload ||= !!~[...EXPERIMENTAL_FEATURES, ...SENSITIVE_FEATURES].indexOf(key);

        settings[key] = newValue;
    }

    if(reload)
        location.reload();
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
        EVENT_LISTENER = {};

    settings = await GetSettings();

    // Modify the logging feature via the settings
    if(!settings.display_in_console)
        LOG = WARN = ERROR = ($=>$);

    // Enable experimental features
    if(!settings.experimental_mode)
        for(let feature of EXPERIMENTAL_FEATURES)
            settings[feature] = false;

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

        return (
            // Next channel in "Up Next"
            ALL_FIRST_IN_LINE_JOBS?.length?
                ALL_CHANNELS.find(channel => channel.href === ALL_FIRST_IN_LINE_JOBS[0]):
            // The most popular channel (most amoutn of current viewers)
            settings.next_channel_preference === 'popular'?
                online[0]:
            // The least popular channel (least amount of current viewers)
            settings.next_channel_preference === 'unpopular'?
                online[online.length - 1]:
            // Most watched channel (most channel points)
            settings.next_channel_preference === 'rich'?
                STREAMERS.find(channel => channel.name === mostWatched):
            // Least watched channel (least channel points)
            settings.next_channel_preference === 'poor'?
                STREAMERS.find(channel => channel.name === leastWatched):
            // A random channel
            online[(Math.random() * online.length)|0]
        );
    }

    /** Search Array - all channels/friends that appear in the search panel (except the currently viewed one)
     * href:string   - link to the channel
     * icon:string   - link to the channel's image
     * live:boolean* - GETTER: is the channel live
     * name:string   - the channel's name
     */
    SEARCH = [
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

                            let parent = $(`.search-tray [href$="${ pathname }"]:not([href*="/search?"])`),
                                live = defined($(`[data-test-selector="live-badge"i]`, false, parent));

                            // if(LIVE_CACHE.has(pathname))
                            //     return LIVE_CACHE.get(pathname);
                            // LIVE_CACHE.set(pathname, live);

                            return live;
                        },
                        name: $('img', false, element)?.alt,
                    };

                    element.setAttribute('draggable', true);
                    element.setAttribute('twitch-tools-streamer-data', JSON.stringify(channel));
                    element.ondragstart ||= event => {
                        let { currentTarget } = event;

                        event.dataTransfer.setData('application/twitch-tools-streamer', currentTarget.getAttribute('twitch-tools-streamer-data'));
                        event.dataTransfer.dropEffect = 'move';
                    };

                    return channel;
                }),
    ];

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
     * tags:array*       - GETTER: tags of the current stream
     * team:string*      - GETTER: the team the channel is affiliated with (if applicable)
     * time:number*      - GETTER: how long has the channel been live
     * unfollow:function - unfollows the current channel

     * Only available with Fine Details enabled
     * ally:boolean      - is the channel partnered?
     * fast:boolean      - is the channel using turbo?
     * nsfw:boolean      - is the channel deemed NSFW (mature)?
     * sole:number       - the channel's channel ID
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
            return $('[data-a-target="stream-game-link"i]')?.textContent
        },

        href: parseURL($(`a[href$="${ PATHNAME }"i]`).href).href,

        icon: $('img', false, $(`a[href$="${ PATHNAME }"i]`))?.src,

        get like() {
            return defined($('[data-a-target="unfollow-button"i]'))
        },

        get live() {
            return defined($(`a[href$="${ PATHNAME }"i] .tw-channel-status-text-indicator`))
        },

        name: $(`a[href$="${ PATHNAME }"i] h1`)?.textContent,

        get paid() {
            return defined($('[data-a-target="subscribed-button"i]'))
        },

        get ping() {
            return defined($('[data-a-target="notifications-toggle"i] [class*="--notificationbellfilled"i]'))
        },

        get poll() {
            return parseInt($('[data-a-target$="viewers-count"i]')?.textContent?.replace(/\D+/g, ''))
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
            return $('[href^="/team"]')?.textContent?.trim();
        },

        get time() {
            return parseTime($('.live-time')?.textContent)
        },

        follow() {
            let follow = $('[data-a-target="follow-button"i]');

            if(defined(follow))
                follow.click();
        },

        unfollow() {
            let unfollow = $('[data-a-target="unfollow-button"i]');

            if(defined(unfollow))
                unfollow.click();
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
            )
    ];

    __GetAllChannels__: {
        let element;

        // Is the nav open?
        let open = defined($('[data-a-target="side-nav-search-input"]')),
            sidenav = $('[data-a-target="side-nav-arrow"i]');

        // Open the Side Nav
        if(!open) // Only open it if it isn't already
            sidenav?.click();

        // Click "show more" as many times as possible
        while(defined(element = $('[data-a-target="side-nav-show-more-button"]')))
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

                                let parent = $(`#sideNav .side-nav-section [href$="${ pathname }"]`),
                                    live = defined(parent) && empty($(`[class*="--offline"i]`, false, parent));

                                // if(!defined(parent) && LIVE_CACHE.has(pathname))
                                //     return LIVE_CACHE.get(pathname);
                                // LIVE_CACHE.set(pathname, live);

                                return live;
                            },
                            name: $('img', false, element)?.alt,
                        };

                        element.setAttribute('draggable', true);
                        element.setAttribute('twitch-tools-streamer-data', JSON.stringify(streamer));
                        element.ondragstart ||= event => {
                            let { currentTarget } = event;

                            event.dataTransfer.setData('application/twitch-tools-streamer', currentTarget.getAttribute('twitch-tools-streamer-data'));
                            event.dataTransfer.dropEffect = 'move';
                        };

                        // Activate (and set) the live status for the streamer
                        let { live } = streamer;

                        return streamer;
                    }),
        ];

        /** Channels Array - all channels/friends that appear on the side panel (except the currently viewed one)
         * href:string   - link to the channel
         * icon:string   - link to the channel's image
         * live:boolean* - GETTER: is the channel live
         * name:string   - the channel's name
         */
        CHANNELS = [
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

                                let parent = $(`#sideNav .side-nav-section [href$="${ pathname }"]`),
                                    live = defined(parent) && empty($(`[class*="--offline"i]`, false, parent));

                                // if(!defined(parent) && LIVE_CACHE.has(pathname))
                                //     return LIVE_CACHE.get(pathname);
                                // LIVE_CACHE.set(pathname, live);

                                return live;
                            },
                            name: $('img', false, element)?.alt,
                        };

                        element.setAttribute('draggable', true);
                        element.setAttribute('twitch-tools-streamer-data', JSON.stringify(streamer));
                        element.ondragstart ||= event => {
                            let { currentTarget } = event;

                            event.dataTransfer.setData('application/twitch-tools-streamer', currentTarget.getAttribute('twitch-tools-streamer-data'));
                            event.dataTransfer.dropEffect = 'move';
                        };

                        return streamer;
                    }),
        ];

        /** Streamers Array - all followed channels that appear on the "Followed Channels" list (except the currently viewed one)
         * href:string   - link to the channel
         * icon:string   - link to the channel's image
         * live:boolean* - GETTER: is the channel live
         * name:string   - the channel's name
         */
        STREAMERS = [
            // Current streamers
            ...$(`#sideNav .side-nav-section[aria-label*="followed"i] a:not([href$="${ PATHNAME }"i])`, true)
                .map(element => {
                        let streamer = {
                            href: element.href,
                            icon: $('img', false, element)?.src,
                            get live() {
                                let { href } = element,
                                    url = parseURL(href),
                                    { pathname } = url;

                                let parent = $(`#sideNav .side-nav-section[aria-label*="followed"i] [href$="${ pathname }"]`),
                                    live = defined(parent) && empty($(`[class*="--offline"i]`, false, parent));

                                // if(!defined(parent) && LIVE_CACHE.has(pathname))
                                //     return LIVE_CACHE.get(pathname);
                                // LIVE_CACHE.set(pathname, live);

                                return live;
                            },
                            name: $('img', false, element)?.alt,
                        };

                        element.setAttribute('draggable', true);
                        element.setAttribute('twitch-tools-streamer-data', JSON.stringify(streamer));
                        element.ondragstart ||= event => {
                            let { currentTarget } = event;

                            event.dataTransfer.setData('application/twitch-tools-streamer', currentTarget.getAttribute('twitch-tools-streamer-data'));
                            event.dataTransfer.dropEffect = 'move';
                        };

                        return streamer;
                    }
                ),
        ];

        // Click "show less" as many times as possible
        while(defined(element = $('[data-a-target="side-nav-show-less-button"]')))
            element.click();

        // Close the Side Nav
        if(!open) // Only close it if it wasn't open in the first place
            sidenav?.click();
    }

    // Every channel
    ALL_CHANNELS = [...ALL_CHANNELS, ...SEARCH, ...NOTIFICATIONS, ...STREAMERS, ...CHANNELS, STREAMER].filter(defined).filter(uniqueChannels);

    if(STREAMER) {
        let element = $(`a[href$="${ PATHNAME }"i]`),
            { href, icon, live, name } = STREAMER;

        element.setAttribute('draggable', true);
        element.setAttribute('twitch-tools-streamer-data', JSON.stringify({ href, icon, live, name }));
        element.ondragstart = event => {
            let { currentTarget } = event;

            event.dataTransfer.setData('application/twitch-tools-streamer', currentTarget.getAttribute('twitch-tools-streamer-data'));
            event.dataTransfer.dropEffect = 'move';
        };

        /* Attempt to use the Twitch API */
        if(settings.fine_details) __FineDetails__: {
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
                channelName = pathname.replace(/\//g, '');

            // Fetch an API request
            let type = (defined(videoID)? 'vod': 'channel'),
                value = (defined(videoID)? videoID: channelName),
                token = cookies['auth-token'];

            await fetch(`https://api.twitch.tv/api/${ type }s/${ value }/access_token?oauth_token=${ token }&need_https=true&platform=web&player_type=site&player_backend=mediaplayer`)
                .then(response => response.json())
                .then(json => TWITCH_API = JSON.parse(json.token))
                .then(json => LOG('Getting fine details...', { [type]: value, cookies }, json))
                .catch(ERROR);

            let conversion = {
                paid: 'subscriber',

                ally: 'partner',
                fast: 'turbo',
                nsfw: 'mature',
                sole: 'channel_id',
            };

            for(let key in conversion)
                STREAMER[key] = TWITCH_API[conversion[key]];
        }
    };

    update();
    setInterval(update, 100);

    let ERRORS = Initialize.errors |= 0;
    if(START_OVER) {
        for(let job in Jobs)
            UnregisterJob(job);
        ERRORS = Initialize.errors++
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

        let { like, coin, follow } = STREAMER,
            raid = data.referrer === 'raid';

        if(!like && raid)
            follow();
    };
    Timers.auto_follow_raids = 1000;

    if(settings.auto_follow_raids || settings.auto_follow_all) __AutoFollowRaid__: {
        RegisterJob('auto_follow_raids');
    }

    if(settings.auto_follow_time || settings.auto_follow_all) __AutoFollowTime__: {
        let { like, follow } = STREAMER,
            mins = parseInt(settings.auto_follow_time_minutes) | 0;

        if(!like)
            setTimeout(follow, mins * 60_000);
    }

    /*** Auto Accept Mature Content
     *                    _                                     _     __  __       _                     _____            _             _
     *         /\        | |            /\                     | |   |  \/  |     | |                   / ____|          | |           | |
     *        /  \  _   _| |_ ___      /  \   ___ ___ ___ _ __ | |_  | \  / | __ _| |_ _   _ _ __ ___  | |     ___  _ __ | |_ ___ _ __ | |_
     *       / /\ \| | | | __/ _ \    / /\ \ / __/ __/ _ \ '_ \| __| | |\/| |/ _` | __| | | | '__/ _ \ | |    / _ \| '_ \| __/ _ \ '_ \| __|
     *      / ____ \ |_| | || (_) |  / ____ \ (_| (_|  __/ |_) | |_  | |  | | (_| | |_| |_| | | |  __/ | |___| (_) | | | | ||  __/ | | | |_
     *     /_/    \_\__,_|\__\___/  /_/    \_\___\___\___| .__/ \__| |_|  |_|\__,_|\__|\__,_|_|  \___|  \_____\___/|_| |_|\__\___|_| |_|\__|
     *                                                   | |
     *                                                   |_|
     */
    Handlers.auto_accept_mature = () => {
        $('[data-a-target="player-overlay-mature-accept"i], [data-a-target="watchparty-overlay-main"i] button')?.click();
    };
    Timers.auto_accept_mature = 1000;

    if(settings.auto_accept_mature) __AutoMatureAccept__: {
        RegisterJob('auto_accept_mature');
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
        FIRST_IN_LINE_TIMER,                // The current time left before the job is accomplished
        FIRST_IN_LINE_PAUSED,               // The pause-state
        FIRST_IN_LINE_BALLOON,              // The balloon controller
        ALL_FIRST_IN_LINE_JOBS,             // All First in Line jobs
        FIRST_IN_LINE_WAIT_TIME,            // The wait time (from settings)
        FIRST_IN_LINE_LISTING_JOB,          // The job (interval) for listing all jobs (under the ballon)
        FIRST_IN_LINE_WARNING_JOB,          // The job for warning the user (via popup)
        FIRST_IN_LINE_SORTING_HANDLER,      // The Sortable object to handle the balloon
        FIRST_IN_LINE_WARNING_TEXT_UPDATE;  // Sub-job for the warning text

    // Restart the First in line que's timers
        // REDO_FIRST_IN_LINE_QUEUE([href:string=URL]) -> undefined
    function REDO_FIRST_IN_LINE_QUEUE(href) {
        if(!defined(href))
            return;

        href = parseURL(href).href;

        let channel = ALL_CHANNELS.find(channel => channel.href == href);

        if(!defined(channel))
            return ERROR(`Unable to create job for < ${ href } >`);

        let { name } = channel;

        FIRST_IN_LINE_HREF = href;
        [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

        LOG(`Waiting ${ ConvertTime(FIRST_IN_LINE_TIMER) } before leaving for "${ name }" stream < ${ href } >`, new Date);

        FIRST_IN_LINE_WARNING_JOB = setInterval(() => {
            if(FIRST_IN_LINE_PAUSED)
                return /* First in Line is paused */;
            // Don't act until 1min is left
            if(FIRST_IN_LINE_TIMER > 60_000)
                return;

            let existing = Popup.get(`Up Next \u2014 ${ name }`);

            if(!defined(STARTED_TIMERS.WARNING)) {
                STARTED_TIMERS.WARNING = true;

                LOG('Heading to stream in', ConvertTime(FIRST_IN_LINE_TIMER), FIRST_IN_LINE_HREF, new Date);

                let popup = existing ?? new Popup(`Up Next \u2014 ${ name }`, `Heading to stream in \t${ ConvertTime(FIRST_IN_LINE_TIMER) }\t`, {
                    Icon: ALL_CHANNELS.find(channel => channel.href === href)?.icon,

                    Goto: () => {
                        let existing = $('#twitch-tools-popup'),
                            [thisJob] = ALL_FIRST_IN_LINE_JOBS.splice(0, 1);

                        if(defined(existing))
                            existing.remove();
                        LOG('Heading to stream now', thisJob);

                        FIRST_IN_LINE_TIMER = FIRST_IN_LINE_WAIT_TIME * 60_000;
                        SaveCache({ FIRST_IN_LINE_TIMER });

                        [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                        open(FIRST_IN_LINE_HREF, '_self');

                        FIRST_IN_LINE_HREF = undefined;
                    },
                    Cancel: () => {
                        let existing = $('#twitch-tools-popup'),
                            removal = $('button[connected-to][data-test-selector$="delete"i]'),
                            [thisJob] = ALL_FIRST_IN_LINE_JOBS.splice(0, 1);

                        if(defined(existing))
                            existing.remove();
                        LOG('Canceled First in Line event', thisJob);

                        removal.click();
                    },
                });

                FIRST_IN_LINE_WARNING_TEXT_UPDATE = setInterval(() => {
                    if(FIRST_IN_LINE_PAUSED)
                        return /* First in Line is paused */;

                    if(defined(popup?.elements))
                        popup.elements.message.innerHTML
                            = popup.elements.message.innerHTML
                                .replace(/\t(.+?)\t/i, ['\t', ConvertTime(FIRST_IN_LINE_TIMER, 'minute:second'), '\t'].join(''));

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
                    channelID = UUID.from(pathname).toString();

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

            FIRST_IN_LINE_TIMER = FIRST_IN_LINE_WAIT_TIME * 60_000;
            SaveCache({ FIRST_IN_LINE_TIMER });

            LOG('Heading to stream now [Job Interval]', FIRST_IN_LINE_HREF);

            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);
            open(FIRST_IN_LINE_HREF, '_self');

            FIRST_IN_LINE_HREF = undefined;
        }, 1000);
    }

    if(START_OVER) {
        FIRST_IN_LINE_BALLOON = Balloon.get('Up Next');
    } else {
        FIRST_IN_LINE_BALLOON = new Balloon({ title: 'Up Next', icon: 'stream' });

        let first_in_line_pause_button = FIRST_IN_LINE_BALLOON.addButton({
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

        first_in_line_pause_button.tooltip = new Tooltip(first_in_line_pause_button, `Pause the timer`);

        let first_in_line_help_button = FIRST_IN_LINE_BALLOON.addButton({
            icon: 'help',
            left: true,
        });

        new Tooltip(first_in_line_help_button, 'Drag-n-drop channels here to queue them<br>They can be rearranged by dragging');
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

                LOG('Adding job:', { href, streamer });

                ALL_FIRST_IN_LINE_JOBS = [...new Set([...ALL_FIRST_IN_LINE_JOBS, href])];
                await SaveCache({ ALL_FIRST_IN_LINE_JOBS });
            }
        };

        FIRST_IN_LINE_BALLOON.icon.onmouseenter = event => {
            let { container, tooltip, title } = FIRST_IN_LINE_BALLOON,
                offset = getOffset(container);

            $('div#root > *').appendChild(
                furnish('div.twitch-tools-tooltip-layer.tooltip-layer', { style: `transform: translate(${ offset.left }px, ${ offset.top }px); width: 30px; height: 30px; z-index: 2000;` },
                    furnish('div', { 'aria-describedby': tooltip.id, 'class': 'tw-inline-flex tw-relative tw-tooltip-wrapper tw-tooltip-wrapper--show' },
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
                    return WARN('No channel given', { oldIndex, newIndex, desiredChannel: channel });

                if(!!~[oldIndex, newIndex].indexOf(0)) {
                    LOG('New First in Line', channel);

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

        FIRST_IN_LINE_WAIT_TIME = parseInt(
            settings.first_in_line?
                settings.first_in_line_time_minutes:
            settings.first_in_line_plus?
                settings.first_in_line_plus_time_minutes:
            settings.first_in_line_all?
                settings.first_in_line_all_time_minutes:
            0
        ) | 0;

        if(settings.first_in_line_none)
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

                    let [balloon] = FIRST_IN_LINE_BALLOON.add({
                        href,
                        src: channel.icon,
                        message: `${ name } <span style="display:${ live? 'none': 'inline-block' }">is ${ live? '': 'not ' }live</span>`,
                        subheader: `Coming up next`,
                        onremove: event => {
                            let index = ALL_FIRST_IN_LINE_JOBS.findIndex(href => event.href == href),
                                [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1);

                            LOG('Removed', removed, 'Canceled?', event.canceled);

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

                                    WARN('Creating job [avoiding job listing mitigation]', channel);

                                    return REDO_FIRST_IN_LINE_QUEUE(channel.href);
                                }

                                if(time < 0)
                                    setTimeout(() => {
                                        LOG('Mitigation: Job Listings', { ALL_FIRST_IN_LINE_JOBS: [...new Set(ALL_FIRST_IN_LINE_JOBS)], FIRST_IN_LINE_TIMER, FIRST_IN_LINE_HREF }, new Date);
                                        // Mitigate 0 time bug?

                                        FIRST_IN_LINE_TIMER = FIRST_IN_LINE_WAIT_TIME * 60_000;
                                        SaveCache({ FIRST_IN_LINE_TIMER });

                                        open($('a', false, container)?.href ?? '?', '_self');
                                        return clearInterval(intervalID);
                                    }, 5000);

                                container.setAttribute('time', time - (index > 0? 0: 1000));

                                if(container.getAttribute('index') != index)
                                    container.setAttribute('index', index);

                                $('a', false, container)
                                    .setAttribute('style', `background-color: var(--color-opac-p-${ index > 8? 1: 9 - index })`);

                                if(container.getAttribute('live') != (live + '')) {
                                    $('.twitch-tools-balloon-message', false, container).innerHTML =
                                        `${ name } <span style="display:${ live? 'none': 'inline-block' }">is ${ live? '': 'not ' }live</span>`;
                                    container.setAttribute('style', (live? '': 'opacity: 0.3!important'));
                                    container.setAttribute('live', live);
                                }

                                if(live)
                                    subheader.innerHTML = /*index > 0? `${ nth(index + 1) } in line`:*/ ConvertTime(time, 'clock');
                            }, 1000);
                        },
                    });
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
                uuid = UUID.from(innerText).toString();

            if(!!~HANDLED_NOTIFICATIONS.indexOf(uuid))
                continue;
            HANDLED_NOTIFICATIONS.push(uuid);

            if(!/([^]+? +)(go(?:ing)?|is|went) +live\b/i.test(innerText))
                continue;

            LOG('Recieved an actionable notification:', innerText, new Date);

            if(defined(FIRST_IN_LINE_HREF)) {
                if(!~[...ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_HREF].indexOf(href)) {
                    LOG('Pushing to Jobs:', href, new Date);

                    ALL_FIRST_IN_LINE_JOBS = [...new Set([...ALL_FIRST_IN_LINE_JOBS, href])];
                } else {
                    WARN('Not pushing to Jobs:', href, new Date);
                    LOG('Reason?', [FIRST_IN_LINE_JOB, ...ALL_FIRST_IN_LINE_JOBS],
                        'Is it the next job?', FIRST_IN_LINE_HREF === href,
                        'Is it in the queue already?', !!~ALL_FIRST_IN_LINE_JOBS.indexOf(href),
                    );
                }

                // To wait, or not to wait
                SaveCache({ ALL_FIRST_IN_LINE_JOBS });

                continue;
            } else {
                LOG('Pushing to Jobs (no contest):', href, new Date);

                // Add the new job (while preventing duplicates)
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

                let [balloon] = FIRST_IN_LINE_BALLOON.add({
                    href,
                    src: channel.icon,
                    message: `${ name } <span style="display:${ live? 'none': 'inline-block' }">is ${ live? '': 'not ' }live</span>`,
                    subheader: `Coming up next`,
                    onremove: event => {
                        let index = ALL_FIRST_IN_LINE_JOBS.findIndex(href => event.href == href),
                            [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1);

                        LOG('Removed', removed, 'Canceled?', event.canceled);

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

                                WARN('Creating job [avoiding first in line mitigation]', channel);

                                return REDO_FIRST_IN_LINE_QUEUE(channel.href);
                            }

                            if(time < 0)
                                setTimeout(() => {
                                    LOG('Mitigation: First in Line', { ALL_FIRST_IN_LINE_JOBS: [...ALL_FIRST_IN_LINE_JOBS], FIRST_IN_LINE_TIMER, FIRST_IN_LINE_HREF }, new Date);
                                    // Mitigate 0 time bug?

                                    FIRST_IN_LINE_TIMER = FIRST_IN_LINE_WAIT_TIME * 60_000;
                                    SaveCache({ FIRST_IN_LINE_TIMER });

                                    open($('a', false, container)?.href ?? '?', '_self');
                                    return clearInterval(intervalID);
                                }, 5000);

                            container.setAttribute('time', time - (index > 0? 0: 1000));

                            if(container.getAttribute('index') != index)
                                container.setAttribute('index', index);

                            $('a', false, container)
                                .setAttribute('style', `background-color: var(--color-opac-p-${ index > 8? 1: 9 - index })`);

                            if(container.getAttribute('live') != (live + '')) {
                                $('.twitch-tools-balloon-message', false, container).innerHTML =
                                    `${ name } <span style="display:${ live? 'none': 'inline-block' }">is ${ live? '': 'not ' }live</span>`;
                                container.setAttribute('style', (live? '': 'opacity: 0.3!important'));
                                container.setAttribute('live', live);
                            }

                            if(live)
                                subheader.innerHTML = /*index > 0? `${ nth(index + 1) } in line`:*/ ConvertTime(time, 'clock');
                        }, 1000);
                    },
                });

                if(defined(FIRST_IN_LINE_WAIT_TIME) && !defined(FIRST_IN_LINE_HREF)) {
                    REDO_FIRST_IN_LINE_QUEUE(href);
                    LOG('Redid First in Line queue [First in Line]...', { FIRST_IN_LINE_TIMER: ConvertTime(FIRST_IN_LINE_TIMER, 'clock'), FIRST_IN_LINE_WAIT_TIME, FIRST_IN_LINE_HREF });
                } else if(defined(settings.first_in_line_none)) {
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

    // window.onlocationchange = () => FIRST_IN_LINE_BALLOON.remove();

    if(settings.first_in_line || settings.first_in_line_plus || settings.first_in_line_all) __FirstInLine__: {
        await LoadCache(['ALL_FIRST_IN_LINE_JOBS', 'FIRST_IN_LINE_TIMER'], cache => {
            ALL_FIRST_IN_LINE_JOBS = cache.ALL_FIRST_IN_LINE_JOBS ?? [];
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

                WARN(`The job for < ${ href } > no longer exists`, killed);

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
    let OLD_STREAMERS, NEW_STREAMERS;

    await LoadCache('OLD_STREAMERS', cache => OLD_STREAMERS = cache.OLD_STREAMERS);

    Handlers.first_in_line_plus = () => {
        let streamers = [...new Set([...STREAMERS, STREAMER].filter(isLive).map(streamer => streamer.name))].sort();

        NEW_STREAMERS = streamers.join(',').toLowerCase();

        if(!defined(OLD_STREAMERS))
            OLD_STREAMERS = NEW_STREAMERS;

        if(OLD_STREAMERS == NEW_STREAMERS)
            return SaveCache({ OLD_STREAMERS });

        let old_names = OLD_STREAMERS.split(','),
            new_names = NEW_STREAMERS.split(',');

        new_names = new_names.filter(name => !~old_names.indexOf(name));

        // Try to detect if the extension was just re-installed?
        installation_viewer:
        switch(settings.onInstalledReason) {
            case 'chrome_update':
            case 'shared_module_update':
                // Not used. Ignore
                break;

            case 'install':
                // Ignore all current streamers; otherwise this will register them all
                new_names = [];
                break;

            case 'update':
            default:
                // Should function normally
                break;
        }

        if(defined(settings.onInstalledReason))
            delete settings.onInstalledReason;

        if(new_names.length >= STREAMERS.length) {
            WARN('New streamers are being added incorrectly...',
                'New names:',
                [...new_names],

                'Old names:',
                [...old_names],

                'New streamers:',
                [NEW_STREAMERS],

                'Old streamers',
                [OLD_STREAMERS],

                'Followed channels (side-panel):',
                [...STREAMERS],

                'All channels (side-panel):',
                [...ALL_CHANNELS],

                new Date,
            );

            SaveCache(`ERROR-LOG/${ new Date }`, { new_names, old_names, NEW_STREAMERS, OLD_STREAMERS, STREAMERS, ALL_CHANNELS });
        }

        creating_new_events:
        for(let name of new_names) {
            let streamer = STREAMERS.find(streamer => RegExp(name, 'i').test(streamer.name));

            if(!defined(streamer))
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

    if(settings.first_in_line_plus || settings.first_in_line_all) __FirstInLinePlus__: {
        RegisterJob('first_in_line_plus');
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

    if(settings.kill_extensions) __KillExtensions__: {
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
            online = STREAMERS.filter(isLive),
            next = await GetNextStreamer(),
            [guest, host] = $('[href^="/"] h1, [href^="/"] > p', true);

        guest = guest?.innerText ?? $('[data-a-target="hosting-indicator"i]')?.innerText;
        host = host?.innerText ?? STREAMER.name;

        host_stopper:
        if(hosting && defined(next)) {
            // Ignore followed channels
            if(settings.prevent_hosting == "unfollowed") {
                let streamer = STREAMERS.find(channel => RegExp(`^${guest}$`, 'i').test(channel.name));

                // The channel being hosted (guest) is already in "followed." No need to leave
                if(hosting && defined(streamer)) {
                    LOG(`[HOSTING] ${ guest } is already followed. Just head to the stream`);

                    open(streamer.href, '_self');
                    break host_stopper;
                }
            }

            STREAMER.__eventlisteners__.onhost.forEach(job => job({ hosting, next }));

            if(online.length) {
                WARN(`${ host } is hosting ${ guest ?? "" }. Moving onto next streamer (${ next.name })`, next.href, new Date);

                open(next.href, '_self');
            } else {
                WARN(`${ host } is hosting ${ guest ?? "" }. There doesn't seem to be any followed streamers on right now`, new Date);
            }
        }
    };
    Timers.prevent_hosting = 5000;

    if(settings.prevent_hosting != "none") __PreventHosting__: {
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
    Handlers.prevent_raiding = async() => {
        let url = parseURL(top.location),
            data = url.searchParameters,
            raided = data.referrer === 'raid',
            raiding = defined($('[data-test-selector="raid-banner"i]')),
            online = STREAMERS.filter(isLive),
            next = await GetNextStreamer(),
            [from, to] = ($('[data-test-selector="raid-banner"i] strong', true) ?? [,STREAMER.name]);

        from = from?.innerText;
        to = to?.innerText;

        raid_stopper:
        if((raiding || raided) && defined(next)) {
            // Ignore followed channels
            if(settings.prevent_raiding == "unfollowed") {
                // The channel being raided (to) is already in "followed." No need to leave
                if(raiding && defined(STREAMERS.find(channel => RegExp(`^${to}$`, 'i').test(channel.name)))) {
                    LOG(`[RAIDING] ${ to } is already followed. No need to leave the raid`);
                    break raid_stopper;
                } // The channel that was raided (to) is already in "followed." No need to leave
                else if(raided && STREAMER.like) {
                    LOG(`[RAIDED] ${ to } is already followed. No need to abort the raid`);

                    RemoveFromSearch(['referrer']);
                    break raid_stopper;
                }
            }

            STREAMER.__eventlisteners__.onraid.forEach(job => job({ raided, raiding, next }));

            if(online.length) {
                WARN(`${ STREAMER.name } is raiding. Moving onto next streamer (${ next.name })`, next.href, new Date);

                open(next.href, '_self');
            } else {
                WARN(`${ STREAMER.name } is raiding. There doesn't seem to be any followed streamers on right now`, new Date);
            }
        }
    };
    Timers.prevent_raiding = 5000;

    if(settings.prevent_raiding != "none") __PreventRaiding__: {
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

        let Paths = [USERNAME, '[up]/', 'user', 'watchparty', 'videos?', 'team', 'directory', 'downloads?', 'jobs?', 'turbo', 'friends?', 'subscriptions?', 'inventory', 'wallet', 'settings', 'search', '$'];

        try {
            await LoadCache('UserIntent', ({ UserIntent }) => {
                if(UserIntent)
                    Paths.push(UserIntent);
            });
        } catch(error) {
            return RemoveCache('UserIntent');
        }

        let ValidTwitchPath = RegExp(`/(${ Paths.join('|') })`, 'i');

        if(!STREAMER.live) {
            if(!ValidTwitchPath.test(pathname)) {
                if(online.length) {
                    WARN(`${ STREAMER.name } is no longer live. Moving onto next streamer (${ next.name })`, next.href, new Date);

                    open(next.href, '_self');
                } else  {
                    WARN(`${ STREAMER.name } is no longer live. There doesn't seem to be any followed streamers on right now`, new Date);
                }
            }

            // After 30 seconds, remove the intent
            ClearIntent ??= setTimeout(() => RemoveCache('UserIntent'), 30_000);
        } else if(/\/search\b/i.test(pathname)) {
            let { term } = parseURL(location).searchParameters;

            await SaveCache({ UserIntent: term });
        }
    };
    Timers.stay_live = 5000;

    if(settings.stay_live) __StayLive__: {
        RegisterJob('stay_live');
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
        shrt = url => url.replace(/https:\/\/static-cdn\.jtvnw\.net\/emoticons\/v1\/(\d+)\/([\d\.]+)/i, ($0, $1, $2, $$, $_) => {
            let id = parseInt($1).toString(36),
                version = $2;

            return [id, version].join('-');
        });

    Handlers.convert_emotes = () => {
        GetChat(30, true);
    };
    Timers.convert_emotes = -1000;

    if(settings.convert_emotes) __ConvertEmotes__: {
        // Collect emotes
        let chat_emote_button = $('[data-a-target="emote-picker-button"i]');

        function CollectEmotes() {
            chat_emote_button.click();

            setTimeout(() => {
                $('[class*="emote-picker"i] .emote-button img', true)
                    .map(img => {
                        EMOTES.set(img.alt, shrt(img.src));
                    });

                top.EMOTES = EMOTES;

                chat_emote_button.click();
            }, 500);
        }

        if(defined(chat_emote_button))
            CollectEmotes();
        else
            setTimeout(CollectEmotes, 1000);

        LOG('Adding emote event listener...');

        GetChat.onnewmessage = chat => {
            let regexp;

            for(let emote in chat.emotes)
                if(!EMOTES.has(emote))
                    EMOTES.set(emote, shrt(chat.emotes[emote]));

            for(let line of chat) {
                // Replace emotes for the last 25 chat messages
                if(!!~Queue.emotes.indexOf(line.uuid))
                    continue;
                if(Queue.emotes.length >= 25)
                    Queue.emotes = [];
                Queue.emotes.push(line.uuid);

                for(let [emote, url] of EMOTES)
                    if((regexp = RegExp(emote.replace(/(\W)/g, '\\$1'), 'g')).test(line.message)) {
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
            }
        };

        RegisterJob('convert_emotes');
    }

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
    let UPDATED_FILTER = () => {
        let rules = settings.filter_rules;

        let channel = [], user = [], text = [];

        if(defined(rules?.length)) {
            rules = rules.split(/\s*,\s*/).filter(rule => rule.length);

            for(let rule of rules)
                if(/^\/[\w\-]+/.test(rule)) {
                    let { $_ } = RegExp;

                    let name, text, user;

                    $_.replace(/^\/([\w\-]+) +((@)?[^]*?)$/, ($0, $1, $2, $3, $$, $_) => {
                        name = $1;

                        if($3 ?? false)
                            user = $2;
                        else
                            text = $2;
                    });

                    channel.push({ name, text, user });
                } else if(/^@[\w\-]+/.test(rule)) {
                    let { $_ } = RegExp;

                    user.push($_.replace(/^@/, ''));
                } else if(rule) {
                    let $_ = rule;

                    text.push(/^[\w\s]+$/.test($_)? `\\b${ $_.trim() }\\b`: $_);
                }
        }

        return {
            text: (text.length? RegExp(`(${ text.join('|') })`, 'i'): /^[\b]$/),
            user: (user.length? RegExp(`(${ user.join('|') })`, 'i'): /^[\b]$/),
            channel
        }
    };

    Handlers.filter_messages = () => {
        let Filter = UPDATED_FILTER();

        GetChat(15, true).filter(line => {
            return false
                // Filter messges (RegExp) on all channels
                || Filter.text.test(line.message)
                // Filter users on all channels
                || Filter.user.test(line.author)
                // Filter messages/users on specific a channel
                || !!~Filter.channel.map(({ name, text, user }) => {
                    if(!defined(STREAMER))
                        return;

                    let channel = STREAMER.name.toLowerCase();

                    return channel == name
                        && (
                            ('@' + line.author) == user
                            || !!~line.message.toLowerCase().indexOf(text)
                        )
                }).indexOf(true);
        }).map(line => {
            let { element, mentions } = line,
                hidden = element.getAttribute('twitch-tools-hidden') === 'true';

            if(hidden || !!~mentions.indexOf(USERNAME))
                return;

            element.setAttribute('style', 'display:none');
            element.setAttribute('twitch-tools-hidden', true);
        });

        LOG('Adding message filter event listener...');

        GetChat.onnewmessage = chat => {
            let Filter = UPDATED_FILTER();

            for(let line of chat) {
                let { message, mentions, author, element } = line;

                let censor = false
                    // Filter messges (RegExp) on all channels
                    || Filter.text.test(message)
                    // Filter users on all channels
                    || Filter.user.test(author)
                    // Filter messages/users on specific a channel
                    || !!~Filter.channel.map(({ name, text, user }) => {
                        if(!defined(STREAMER))
                            return;

                        let channel = STREAMER.name.toLowerCase();

                        return channel == name
                            && (
                                ('@' + author) == user
                                || !!~message.toLowerCase().indexOf(text)
                            )
                    }).indexOf(true);

                if(!censor)
                    return;

                LOG('Censoring message', line);

                let hidden = element.getAttribute('twitch-tools-hidden') === 'true';

                if(hidden || !!~mentions.indexOf(USERNAME))
                    return;

                element.setAttribute('style', 'display:none');
                element.setAttribute('twitch-tools-hidden', true);
            }
        };
    };
    Timers.filter_messages = -2500;

    Unhandlers.filter_messages = () => {
        let hidden = $('[twitch-tools-hidden]', true);

        hidden.map(element => {
            element.removeAttribute('[twitch-tools-hidden]');
            element.removeAttribute('[style]');
        });
    };

    if(settings.filter_messages) __FilterMessages__: {
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
            { filter_rules } = settings;

        if(type == 'user') {
            /* Filter users */
            if(filter_rules && !!~filter_rules.split(',').indexOf(`@${ name }`))
                return /* Already filtering messages from this person */;

            let filter = furnish('div#twitch-tools-filter-rule-user', {
                title: `Filter all messages from @${ name }`,
                style: 'cursor:pointer; fill:var(--color-red); font-size:1.1rem; font-weight:normal',
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
                style: 'cursor:pointer; fill:var(--color-red); font-size:1.1rem; font-weight:normal',
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

    if(settings.filter_messages) __EasyFilter__: {
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
        let chat = GetChat().filter(line => !!~line.mentions.findIndex(username => RegExp(`^${USERNAME}$`, 'i').test(username)));

        for(let line of chat)
            if(!~Queue.messages.indexOf(line.uuid)) {
                Queue.messages.push(line.uuid);

                let { author, message, reply } = line;

                LOG('Highlighting message:', { author, message });

                line.element.setAttribute('style', 'background-color: var(--color-background-button-primary-active)');
            }
    };
    Timers.highlight_mentions = 500;

    if(settings.highlight_mentions) __HighlightMentions__: {
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
            if(!~Queue.message_popups.indexOf(line.uuid)) {
                Queue.message_popups.push(line.uuid);

                let { author, message, reply } = line;

                let existing = $('#twitch-tools-popup');

                if(defined(existing))
                    continue;

                LOG('Generating popup:', { author, message });

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

                // new Popup(`@${ author } sent you a message`, message, {
                //     Reply: event => {
                //         let chatbox = $('.chat-input__textarea textarea'),
                //             existing = $('#twitch-tools-popup');
                //
                //         if(defined(chatbox))
                //             chatbox.focus();
                //         if(defined(existing))
                //             existing.remove();
                //
                //         reply?.click();
                //     }
                // });
            }
    };
    Timers.highlight_mentions_popup = 500;

    if(settings.highlight_mentions_popup) __HighlightMentionsPopup__: {
        RegisterJob('highlight_mentions_popup');
    }

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

                header.textContent += ` ($${ usd })`;

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

                    return `${ $0 } ($${ usd })`;
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

                    return `${ $0 } ($${ usd })`;
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

                    return `${ $0 } ($${ usd })`;
                });
        }
    };
    Timers.convert_bits = 1000;

    if(settings.convert_bits) __ConvertBits__: {
        RegisterJob('convert_bits');
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
        let errorMessage = $('[data-a-target="player-overlay-content-gate"i]'),
            search = [];

        if(!defined(errorMessage))
            return;

        if(RECOVERING_VIDEO)
            return;
        RECOVERING_VIDEO = true;

        ERROR('The stream ran into an error:', errorMessage.textContent, new Date);

        PushToSearch({ 'twitch-tools-failed-to-play-video-at': (+new Date).toString(36) });
    };
    Timers.recover_video = 15_0000;

    if(settings.recover_video) __RecoverVideo__: {
        RegisterJob('recover_video');
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
            isAdvert = defined($('video + div [class*="text-overlay"i]:not([class*="channel-status"i])'));

        // Leave the video alone
            // if the video isn't paused
            // if the video was paused by the user (trusted)
            // if the video is an ad AND auto-play ads is disabled
            // if the player event-timeout has been set
        if(!paused || isTrusted || (isAdvert && !settings.recover_ads) || VIDEO_PLAYER_TIMEOUT > -1)
            return;

        // Wait before trying to press play again
        VIDEO_PLAYER_TIMEOUT = setTimeout(() => VIDEO_PLAYER_TIMEOUT = -1, 1000);

        try {
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
        } catch(error) {
            ERROR(error);

            let control = $('button[data-a-player-state]'),
                playing = control.getAttribute('data-a-player-state') !== 'paused';

            if(!playing) {
                // PAUSED -> PLAY
                control.click();
            } else {
                // PLAYING -> PAUSE, PLAY
                control.click();
                control.click();
            }
        }
    };
    Timers.recover_stream = 2500;

    if(settings.recover_stream) __RecoverStream__: {
        let video = $('video');

        if(!defined(video))
            return;

        video.addEventListener('pause', event => Handlers.recover_stream(event.currentTarget));

        RegisterJob('recover_stream');
    }

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
            isAdvert = defined($('video + div [class*="text-overlay"i]:not([class*="channel-status"i])')),
            { creationTime, totalVideoFrames } = video.getVideoPlaybackQuality();

        // Time that's passed since creation. Should constantly increase
        CREATION_TIME ??= creationTime;
        // The total number of frames created. Should constantly increase
        TOTAL_VIDEO_FRAMES ??= totalVideoFrames;

        // if the page isn't in focus, ignore this setting
        // if the video is paused by the user (trusted) move on
        if((paused && isTrusted) || PAGE_HAS_FOCUS === false)
            return;

        // The video is paused (or stalling)
        if(paused || (CREATION_TIME != creationTime && TOTAL_VIDEO_FRAMES == totalVideoFrames)) {
            // Try constantly overwriting to see if the video plays
            // CREATION_TIME = creationTime; // Keep this from becoming true to force a re-run
            TOTAL_VIDEO_FRAMES = totalVideoFrames;

            if(!(SECONDS_PAUSED_UNSAFELY % 5))
                WARN(`The video has been stalling for ${ SECONDS_PAUSED_UNSAFELY }s`, { CREATION_TIME, TOTAL_VIDEO_FRAMES, SECONDS_PAUSED_UNSAFELY });

            ++SECONDS_PAUSED_UNSAFELY;
        }
        // The video is playing
        else {
            // Start over
            CREATION_TIME = creationTime;
            TOTAL_VIDEO_FRAMES = totalVideoFrames;

            // Reset the timer whenever the video is recovered
            return SECONDS_PAUSED_UNSAFELY = 0;
        }

        if(SECONDS_PAUSED_UNSAFELY > 15)
            location.reload();
    };
    Timers.recover_frames = 1000;

    if(settings.recover_frames) __RecoverFrames__: {
        document.addEventListener('visibilitychange', event => PAGE_HAS_FOCUS = document.visibilityState === "visible");

        RegisterJob('recover_frames');
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
        $('[data-a-target="followed-channel"i], [role="group"i][aria-label*="followed"i] [href^="/"]', true).map(a => {
            a.addEventListener('mousedown', async event => {
                let { currentTarget } = event;

                let url = parseURL(currentTarget.href),
                    UserIntent = url.pathname.replace('/', '');

                await SaveCache({ UserIntent });
            });
        });
    }, 1000);

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
                                    let modifyAttributes = (glyph, attributes) => {
                                        for(let attribute in attributes) {
                                            let value = attributes[attribute];

                                            glyph = glyph.replace(
                                                RegExp(`(${ attribute })=(["'])[^\\2]*?\\2`, 'ig'),
                                                `$1=$2${value}$2`
                                            );
                                        }

                                        return glyph;
                                    };

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
                                                f('div.tw-align-items-center.tw-flex', { innerHTML: modifyAttributes(Glyphs.reply, { height: 24, width: 24 }) })
                                            ),
                                            f('div.tw-flex-grow-1.tw-pd-l-05.tw-pd-y-05', {},
                                                f('span.tw-c-text-alt.tw-font-size-5.tw-strong.tw-word-break-word', {
                                                    'connected-to': uuid,

                                                    handle, message, mentions,

                                                    innerHTML: `Replying to <span style="${ style }">@${handle}</span>`,
                                                })
                                            ),
                                            f('div.tw-right-0.tw-top-0', {},
                                                f('button.tw-align-items-center.tw-align-middle.tw-border-bottom-left-radius-medium.tw-border-bottom-right-radius-medium.tw-border-top-left-radius-medium.tw-border-top-right-radius-medium.tw-button-icon.tw-core-button.tw-inline-flex.tw-interactive.tw-justify-content-center.tw-overflow-hidden.tw-relative',
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

                                                                [...bubbleContainer.children].forEach(child => child.remove());

                                                                chatInput.setAttribute('placeholder', 'Send a message');
                                                            }
                                                        },

                                                        innerHTML: modifyAttributes(Glyphs.x, { height: 24, width: 24 }),
                                                    },
                                                )
                                            )
                                        )
                                    );

                                    bubbleContainer.appendChild(
                                        f('div.font-scale--default.tw-pd-x-1.tw-pd-y-05.chat-line__message',
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

        LOG('Adding native reply buttons...');

        GetChat().forEach(NATIVE_REPLY_POLYFILL.AddNativeReplyButton);

        GetChat.onnewmessage = chat => chat.map(NATIVE_REPLY_POLYFILL.AddNativeReplyButton);
    };
    Timers.native_twitch_reply = 1000;

    if(settings.native_twitch_reply) __NativeTwitchReply__: {
        RegisterJob('native_twitch_reply');
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
    Handlers.watch_time_placement = async() => {
        let placement;

        if((placement = settings.watch_time_placement ??= "null") == "null")
            return;

        let live_time = $('.live-time');

        if(!defined(live_time))
            return;

        let classes = element => [...element.classList].map(label => '.' + label).join('');

        let container = live_time.closest(`*:not(${ classes(live_time) })`),
            parent = container.closest(`*:not(${ classes(container) })`);

        let f = furnish;
        let watch_time = f(`${ container.tagName }${ classes(container) }`,
            { style: 'color: var(--color-green)' },
            f(`${ live_time.tagName }#twitch-tools-watch-time${ classes(live_time).replace(/live-time/i, 'watch-time') }`, { time: 0 })
        );

        parent.appendChild(watch_time);
        container.setAttribute('style', 'color: var(--color-text-live)');

        await LoadCache(['WatchTime', 'Watching'], ({ WatchTime = 0, Watching = PATHNAME }) => {
            if(PATHNAME == Watching)
                $('#twitch-tools-watch-time').setAttribute('time', WatchTime);

            setInterval(() => {
                let watch_time = $('#twitch-tools-watch-time'),
                    time = parseInt(watch_time?.getAttribute('time')) | 0;

                if(!defined(watch_time))
                    return;

                watch_time.setAttribute('time', ++time);

                watch_time.innerHTML = ConvertTime(time * 1000, 'clock');

                SaveCache({ WatchTime: time });
            }, 1000);
        });

        SaveCache({ Watching: PATHNAME });
    };
    Timers.watch_time_placement = -1000;

    window.onlocationchange = event => {
        $('#twitch-tools-watch-time')?.setAttribute('time', 0);

        SaveCache({ Watching: null, WatchTime: 0 });
    };

    if(settings.watch_time_placement) __WatchTimePlacement__: {
        RegisterJob('watch_time_placement');
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

    Handlers.point_watcher_placecment = () => {
        let rich_tooltip = $('.rich-content-tooltip');

        // Update the points (every minute)
        if(++pointWatcherCounter % 600) {
            pointWatcherCounter = 0;

            LoadCache('ChannelPoints', ({ ChannelPoints }) => {
                (ChannelPoints ??= {})[STREAMER.name] = $('[data-test-selector="balance-string"i]')?.innerText ?? ChannelPoints[STREAMER.name] ?? 'Not available';
                SaveCache({ ChannelPoints });
            });
        }

        if(!defined(rich_tooltip))
            return;

        let pointDisplay = $('.twitch-tools-point-display');
        let [title, subtitle, footer] = $('.rich-content-tooltip [class*="online-side-nav-channel-tooltip"i] > *', true),
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
    Timers.point_watcher_placecment = 100;

    if(settings.point_watcher_placecment != "null") __PointWatcherPlacement__: {
        RegisterJob('point_watcher_placecment');
    }

    /*** Scoped under Initialize
     *      _______             _____
     *     |__   __|           / ____|
     *        | | ___  _ __   | (___   ___ ___  _ __   ___
     *        | |/ _ \| '_ \   \___ \ / __/ _ \| '_ \ / _ \
     *        | | (_) | |_) |  ____) | (_| (_) | |_) |  __/
     *        |_|\___/| .__/  |_____/ \___\___/| .__/ \___|
     *                | |                      | |
     *                |_|                      |_|
     */
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
    let AwayModeEnabled = false,
        SetupQuality = false;

    Handlers.away_mode = async() => {
        let button = $('#away-mode'),
            quality = (Handlers.away_mode.quality ??= await GetQuality());

        if(!defined(quality) || /\/search\b/i.test(PATHNAME))
            return;

        await LoadCache({ AwayModeEnabled }, cache => AwayModeEnabled = cache.AwayModeEnabled ?? false);

        let enabled = AwayModeEnabled || (quality.low && !(quality.auto || quality.high || quality.source));

        if(!defined(button)) {
            let sibling, parent, before,
                container = furnish('div'),
                placement = (settings.away_mode_placement ??= "under");

            switch(placement) {
                // Option 1 "over" - video overlay, play button area
                case 'over':
                    sibling = $('[data-a-target="player-controls"i] [class*="player-controls"][class*="right-control-group"i] > :last-child', false, parent);
                    parent = sibling?.parentElement;
                    before = 'first';
                    break;

                // Option 2 "under" - quick actions, follow/notify/subscribe area
                case 'under':
                    sibling = $('[data-test-selector="live-notifications-toggle"]');
                    parent = sibling?.parentElement;
                    before = 'last';
                    break;
            }

            if(!defined(parent) || !defined(sibling))
                return;

            container.innerHTML = sibling.outerHTML.replace(/(?:[\w\-]*)(?:notifications?|settings-menu)([\w\-]*)/ig, 'away-mode$1');
            container.id = 'away-mode';

            parent.insertBefore(container, parent[before + 'ElementChild']);

            if(!!~['over'].indexOf(placement))
                container.firstElementChild.classList.remove('tw-mg-l-1');

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
            SetupQuality = ChangeQuality(['auto','low'][+enabled]) && true;

        // if(init === true) ->
        // Don't use above, event listeners won't work
        button.background?.setAttribute('style', `background:var(--color-twitch-purple-${ '49'[+(button.container.getAttribute('twitch-tools-away-mode-enabled') === "true")] }) !important;`);
        button.icon.setAttribute('height', '20px');
        button.icon.setAttribute('width', '20px');

        button.container.onclick ??= event => {
            let enabled = button.container.getAttribute('twitch-tools-away-mode-enabled') !== 'true';

            button.container.setAttribute('twitch-tools-away-mode-enabled', enabled);
            button.background?.setAttribute('style', `background:var(--color-twitch-purple-${ '49'[+enabled] }) !important;`);
            button.tooltip.innerHTML = `${ ['','Exit '][+enabled] }Away Mode (alt+a)`;

            ChangeQuality(['auto','low'][+enabled]);
            SaveCache({ AwayModeEnabled: enabled });
        };

        button.container.onmouseenter ??= event => {
            button.icon?.setAttribute('style', 'transform: translateX(0px) scale(1.2); transition: transform 300ms ease 0s');
        };

        button.container.onmouseleave ??= event => {
            button.icon?.setAttribute('style', 'transform: translateX(0px) scale(1); transition: transform 300ms ease 0s');
        };

        if(!defined(EVENT_LISTENER.KEYDOWN_ALT_A))
            document.addEventListener('keydown', EVENT_LISTENER.KEYDOWN_ALT_A = ({ key, altKey, ctrlKey, metaKey, shiftKey }) => {
                if(altKey && key == 'a')
                    $('#away-mode').click();
            });
    };
    Timers.away_mode = 1000;

    if(settings.away_mode) __AwayMode__: {
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
            Enabled = (settings.auto_claim_bonuses && $('#twitch-tools-auto-claim-bonuses')?.getAttribute('twitch-tools-auto-claim-bonus-channel-points-enabled') === 'true');

        if(Enabled && ChannelPoints)
            ChannelPoints.click();

        let parent = $('div:not(#twitch-tools-auto-claim-bonuses) > [data-test-selector="community-points-summary"i] [role="tooltip"i]'),
            tooltip = $('#twitch-tools-auto-claim-bonuses [role="tooltip"i]');

        if(tooltip && parent)
            tooltip.innerText = parent.innerText;

        // Actual jobbing
        let button = $('#twitch-tools-auto-claim-bonuses');

        let comify = number => (number + '').split('').reverse.join().replace(/(\d{3})/g, '$1,').split('').reverse().join('');

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
                tooltip: new Tooltip(container, `Collecting Bonus Channel Points`, { top: -10 }),
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
            button.tooltip.innerHTML = `${ ['Ignor','Collect'][+enabled] }ing Bonus Channel Points`;

            button.icon?.setAttribute('fill', `var(--color-${ ['red','accent'][+enabled] })`);
        };

        button.container.onmouseenter ??= event => {
            button.icon?.setAttribute('style', 'transform: translateX(0px) scale(1.2); transition: transform 300ms ease 0s');
        };

        button.container.onmouseleave ??= event => {
            button.icon?.setAttribute('style', 'transform: translateX(0px) scale(1); transition: transform 300ms ease 0s');
        };
    };
    Timers.auto_claim_bonuses = 5000;

    if(settings.auto_claim_bonuses) __AutoClaimBonuses__: {
        RegisterJob('auto_claim_bonuses');
    }
};
// End of Initialize

let CUSTOM_CSS;

let WaitForPageToLoad = setInterval(() => {
    let ready = defined($(`[data-a-target="follow-button"i], [data-a-target="unfollow-button"i]`)) && defined($('[data-test-selector$="message-container"i]'));

    if(ready) {
        setTimeout(Initialize, 1000);
        clearInterval(WaitForPageToLoad);

        // Observe location changes
        LocationObserver: {
            let { body } = document,
                observer = new MutationObserver(mutations => {
                    mutations.map(mutation => {
                        if(PATHNAME !== top.location.pathname) {
                            let OLD_HREF = PATHNAME;

                            PATHNAME = top.location.pathname;

                            for(let listener of __ONLOCATIONCHANGE__)
                                listener(new CustomEvent('locationchange', { detail: { from: OLD_HREF, to: PATHNAME }}));
                        }
                    });
                });

            observer.observe(body, { childList: true, subtree: true });
        }

        // Observe chat changes
        ChatObserver: {
            let chat = $('[data-test-selector$="message-container"i]'),
                observer = new MutationObserver(mutations => {
                    let results = [];

                    mutations = mutations.filter(({ type }) => type == 'childList');

                    MutationToNode:
                    for(let mutation of mutations) {
                        let { addedNodes } = mutation;

                        NodeToObject:
                        for(let line of addedNodes) {
                            let keepEmotes = settings.convert_emotes;

                            let handle = $('.chat-line__username', true, line).map(element => element.innerText).toString()
                                author = handle.toLowerCase(),
                                message = $('.chat-line__message .text-fragment, .chat-line__message img, .chat-line__message a, p, div[class*="inline"]:first-child:last-child', true, line),
                                mentions = $('.mention-fragment', true, line).map(element => element.innerText.replace('@', '').toLowerCase()).filter(text => /^[a-z_]\w+$/i.test(text)),
                                badges = $('.chat-badge', true, line).map(img => img.alt.toLowerCase()),
                                style = $('.chat-line__username [style]', true, line).map(element => element.getAttribute('style')).join(';'),
                                reply = $('button[data-test-selector="chat-reply-button"i]', false, line);

                            let [raw] = message.splice(0, 1);

                            raw = raw?.innerText;

                            message = message
                                .map(element => element.alt && keepEmotes? `:${ (e=>(emotes[e.alt]=e.src,e)).alt }:`: element.innerText)
                                .filter(defined)
                                .join(' ')
                                .trim()
                                .replace(/(\s){2,}/g, '$1');

                            let uuid = UUID.from([author, mentions.join(','), message].join(':')).toString();

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
                                deleted: defined($('[class*="--deleted-notice"i]', false, line)),
                                highlighted: !!(line.classList.value.split(' ').filter(value => /^chat-line--/i.test(value)).length),
                            });
                        }
                    }

                    for(let [name, func] of GetChat.__onnewmessage__)
                        func(results);
                });

            observer.observe(chat, { childList: true });
        }

        window.onlocationchange = () => {
            WARN('Re-initializing...');

            // Initialize();
            location.reload();
        };

        // Add custom styling
        CustomCSSInitializer: {
            CUSTOM_CSS = furnish('style#twitch-tools-custom-css', {},
            `
                [animationID] a { cursor: grab }
                [animationID] a:active { cursor: grabbing }
            `
            );

            $('body').appendChild(CUSTOM_CSS);
        }
    }
}, 500);
