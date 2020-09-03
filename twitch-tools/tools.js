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
    Queue = { balloons: [], bullets: [], emotes: [], messages: [], popups: [] },
    Timers = {},
    Handlers = {},
    Unhandlers = {},
    // These won't change (often)
    USERNAME;

// Populate the username field by quickly showing the menu
if(defined(display)) {
    display.click();
    display.click();

    USERNAME = $('[data-a-target="user-display-name"i]')?.innerText?.toLowerCase();
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

        Storage = Storage.sync || Storage.local;
        break;

    case 'chrome':
    default:
        Runtime = Container.runtime;
        Storage = Container.storage;
        Extension = Container.extension;

        Storage = Storage.sync || Storage.local;
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

// Displays a popup
    // new Popup(subject:string, message:string[, options:object]) -> Object
    // Popup.prototype.remove() -> undefined
class Popup {
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

        let uuid = U = UUID.from([subject, message].join(':')).toString();

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
                        f('div#twitch-tools-notification-counter.t-absolute.tw-font-size-7.tw-left-0.tw-top-0', { style: 'visibility:hidden' },
                            f('div.tw-animation.tw-animation--animate.tw-animation--bounce-in.tw-animation--duration-medium.tw-animation--fill-mode-both.tw-animation--timing-ease-in', {
                                    'data-a-target': 'tw-animation-target'
                                },
                                f('div.tw-c-background-base.tw-inline-flex.tw-number-badge.tw-relative', {},
                                    f('div#twitch-tools-notification-counter-output.tw-c-text-overlay.tw-number-badge__badge.tw-relative', {
                                        'interval-id': setInterval(() => {
                                            let { length } = Queue.popups,
                                                counter = $('#twitch-tools-notification-counter'),
                                                output = $('#twitch-tools-notification-counter-output');

                                            if(!defined(counter) || !defined(output))
                                                return;

                                            let visibility = counter.getAttribute('style').replace(/[^]+:/, ''),
                                                interval = parseInt(output.getAttribute('interval-id'));

                                            output.textContent = length;

                                            if(length < 1) {
                                                counter.setAttribute('style', 'visibility:hidden');
                                                clearInterval(interval);
                                            } else {
                                                counter.setAttribute('style', 'visibility:unset');
                                            }
                                        }, 100),
                                    }, Queue.popups.length)
                                )
                            )
                        ),
                        f('div.tw-align-content-stretch.tw-border-l.tw-flex.tw-flex-column.tw-flex-grow-0.tw-flex-shrink-0', {},
                            f('div.tw-align-content-stretch.tw-border-b.tw-flex.tw-flex-grow-1', {},
                                T = f('button.tw-block.tw-full-width.tw-interactable.tw-interactable--alpha.tw-interactable--hover-enabled.tw-interactive', {
                                        onclick: A,
                                    },
                                    f('div.tw-align-items-center.tw-flex.tw-flex-grow-1.tw-full-height.tw-justify-content-center.tw-pd-05', {},
                                        f('p.tw-c-text-alt', {}, N)
                                    )
                                )
                            ),
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

        return this;
    }

    remove() {
        if(this.container)
            this.container.remove();
    }
}

// Displays a balloon (popup)
    // new Balloon({ title:string, icon:string? }[, ...jobs:object#{ href:string#URL, message:string?, src:string?, time:string#Date, onremove:function? }]) -> Object
    // Balloon.prototype.add(...jobs:object#{ href:string#URL, message:string?, src:string?, time:string#Date, onremove:function? }) -> Element
    // Balloon.prototype.remove() -> undefined
class Balloon {
    static #BALLOONS = {}

    constructor({ title, icon = 'play' }, ...jobs) {
        let f = furnish;

        let [P] = $('.top-nav__menu > div', true).slice(-1),
            X = $('#twitch-tools-balloon', false, P),
            I = Extension.getURL('profile.png'),
            C, H, U;

        let uuid = U = UUID.from([title, JSON.stringify(jobs)].join(':')).toString(),
            existing = Balloon.#BALLOONS['_' + title];

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
                    f('div',
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
                                )
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
                                        (H = f(`h5#twitch-tools-balloon-header-${ U }.tw-align-center.tw-c-text-alt.tw-semibold`, {}, title))
                                    ),
                                    f('button.tw-align-items-center.tw-align-middle.tw-border-bottom-left-radius-medium.tw-border-bottom-right-radius-medium.tw-border-top-left-radius-medium.tw-border-top-right-radius-medium.tw-button-icon.tw-button-icon--secondary.tw-core-button.tw-flex.tw-flex-column.tw-inline-flex.tw-interactive.tw-justify-content-center.tw-justify-content-center.tw-mg-l-05.tw-overflow-hidden.tw-popover-header__icon-slot--right.tw-relative',
                                        {
                                            style: 'height:2rem!important; width:2rem!important',
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
                                                                    href,
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
                                                                                    onremove({ ...event, uuid, guid, href });
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

        this.uuid = U;
        this.header = H;
        this.body = C;
        this.parent = P;
        this.container = p;

        this.title = title;

        Balloon.#BALLOONS.length |= 0;
        Balloon.#BALLOONS.length++;

        return Balloon.#BALLOONS['_' + title] = this;
    }

    remove() {
        Balloon.#BALLOONS['_' + this.title] = this.container?.remove();
    }

    add(...jobs) {
        jobs = jobs.map(job => {
            let { href, message, subheader, src = Extension.getURL('profile.png'), attributes = {}, onremove = ($=>$), animate = ($=>$) } = job,
                { uuid } = this,
                guid = UUID.from([href, message].join(':')).toString(),
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

                                            href,
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
                                                            onremove({ ...event, uuid, guid, href });
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
        });

        for(let job of jobs)
            this.body.appendChild(job);
    }

    static get(title) {
        return Balloon.#BALLOONS['_' + title]
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
        set(key, JSON.stringify(keys[key]));

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
            results[keys] = JSON.parse(get(keys));
            break;

        case Array:
            for(let key of keys)
                results[key] = JSON.parse(get(key));
            break;

        case Object:
            for(let key in keys)
                results[key] = JSON.parse(get(key)) || keys[key];
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
    // GetChat([lines:number[, keepEmotes:boolean]]) -> Object { style, author, emotes, message, mentions, element, uuid, highlighted }
function GetChat(lines = 30, keepEmotes = false) {
    let chat = $('[data-a-target^="chat-"i] .chat-list [data-a-target="chat-line-message"i]', true).slice(-lines),
        emotes = {},
        results = [];

    for(let line of chat) {
        let author = $('.chat-line__username', true, line).map(element => element.innerText).toString().toLowerCase(),
            message = $('.chat-line__message .text-fragment, .chat-line__message img, .chat-line__message a, p, div[class*="inline"]:first-child:last-child', true, line)
                .map(element => element.alt && keepEmotes? `:${ (e=>(emotes[e.alt]=e.src,e)).alt }:`: element.innerText)
                .filter(text => text)
                .join(' ')
                .trim()
                .replace(/(\s){2,}/g, '$1'),
            mentions = $('.mention-fragment', true, line).map(element => element.innerText.replace('@', '').toLowerCase()).filter(text => /^[a-z_]\w+$/i.test(text)),
            badges = $('.chat-badge', true, line).map(img => img.alt.toLowerCase()),
            style = $('.chat-line__username [style]', true, line).map(element => element.getAttribute('style')).join(';'),
            reply = $('button[data-test-selector="chat-reply-button"i]', false, line);

        message = message
            .replace(RegExp(`^((?:${ author })[\\s:]+)`, 'i'), '')
            .replace(/([^]{3,}) +\1/, '$1');

        let uuid = UUID.from([author, mentions.join(','), message].join(':')).toString();

        if(defined(results.find(message => message.uuid == uuid)))
            continue;

        results.push({
            uuid,
            reply,
            style,
            author,
            badges,
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
        let message = $('.mention-fragment, .chat-line__username, .chat-line__message .text-fragment, .chat-line__message img, .chat-line__message a, p, [class^="tw-c-text-"i]', true, bullet)
                .map(element => element.alt && keepEmotes? `:${ (e=>{emotes[e.alt]=e.src;return e})(element).alt }:`: element.innerText)
                .filter(text => text)
                .join(' ')
                .trim()
                .replace(/(\s){2,}/g, '$1'),
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

        message = message
            .replace(RegExp(`( +(?:${ mentions.join('|') }))+$`, 'gi'), '')
            .replace(/([^]{3,}) +(?:\1)+/, '$1');

        let uuid = UUID.from([subject, mentions.join(','), message].join(':')).toString();

        if(defined(results.bullets.find(bullet => bullet.uuid == uuid)))
            continue;

        results.bullets.push({
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
        href:             data[i++] ?? e,
        origin:          (data[i++] ?? e) + (data[i + 4] ?? e),
        protocol:         data[i++] ?? e,
        scheme:           data[i++] ?? e,
        username:         data[i++] ?? e,
        password:         data[i++] ?? e,
        host:             data[i++] ?? e,
        domainPath:       (data[i]  ?? e).split('.').reverse(),
        hostname:         data[i++] ?? e,
        port:             data[i++] ?? e,
        pathname:         data[i++] ?? e,
        search:           data[i]   ?? e,
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

// Gets the X and Y offset (in pixels)
    // getOffset(element:Element) -> Object#{ left:number, top:number }
function getOffset(element) {
    let bounds = element.getBoundingClientRect(),
        { height, width } = bounds;

    return {
        height, width,

        left: bounds.left + (top.pageXOffset ?? document.documentElement.scrollLeft ?? 0) | 0,
        top:  bounds.top  + (top.pageYOffset ?? document.documentElement.scrollTop  ?? 0) | 0,
    };
}

// Convert milliseconds into a human-readable string
    // ConvertTime([date:number[, format:string]]) -> String
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

            time = format.split(/(year|day|hour|minute|(?:milli)?second)s?/g)
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
    // ParseTime([time:string]) -> Number
function ParseTime(time = '') {
    let units = [1000, 60, 60, 24, 365].map((unit, index, array) => (array.slice(0, index).map(u => unit *= u), unit)),
        ms = 0;

    for(let unit of time.split(':').reverse())
        ms += parseInt(unit) * units.splice(0,1)[0];

    return ms;
}

// Get the video quality
    // GetQuality() -> String#{ auto:boolean, high:boolean, low:boolean, source:boolean }
async function GetQuality() {
    let buttons = {
        get settings() {
            return $('[data-a-target="player-settings-button"i]') || null;
        },

        get quality() {
            return $('[data-a-target$="-item-quality"i]') || null;
        },

        get options() {
            return $('[data-a-target$="-quality-option"i]') || null;
        },
    };

    await(async() => {
        let { settings, quality, options } = buttons;

        if(quality === null && options === null)
            try {
                settings.click();
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

    let current = qualities.find(({ input }) => input.checked),
        quality = new String(current.label.textContent);

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
    // ChangeQuality([quality:string[, backup:string]]) -> Object#{ OLD:Object#{ input:Element, label:Element }, NEW:Object#{ input:Element, label:Element } }
async function ChangeQuality(quality = 'auto', backup = 'source') {
    let buttons = {
        get settings() {
            return $('[data-a-target="player-settings-button"i]') || null;
        },

        get quality() {
            return $('[data-a-target$="-item-quality"i]') || null;
        },

        get options() {
            return $('[data-a-target$="-quality-option"i]') || null;
        },
    };

    await(async() => {
        let { settings, quality, options } = buttons;

        if(quality === null && options === null)
            try {
                settings.click();
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

    return { OLD: current, NEW: desired }
}

let Glyphs = {
    bonuschannelpoints: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M16.503 3.257L18 7v11H2V7l1.497-3.743A2 2 0 015.354 2h9.292a2 2 0 011.857 1.257zM5.354 4h9.292l1.2 3H4.154l1.2-3zM4 9v7h12V9h-3v4H7V9H4zm7 0v2H9V9h2z" clip-rule="evenodd"></path></g></svg>',

    more_horizontal: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M2 10a2 2 0 114 0 2 2 0 01-4 0zM8 10a2 2 0 114 0 2 2 0 01-4 0zM16 8a2 2 0 100 4 2 2 0 000-4z"></path></g></svg>',

    more_vertical: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 18a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM8 4a2 2 0 104 0 2 2 0 00-4 0z"></path></g></svg>',
    channelpoints: '<svg fill="#9147ff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 6a4 4 0 014 4h-2a2 2 0 00-2-2V6z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>',

    checkmark: '<svg fill="#22fa7c" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M4 10l5 5 8-8-1.5-1.5L9 12 5.5 8.5 4 10z"></path></g></svg>',

    favorite: '<svg fill="#bb1411" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9.171 4.171A4 4 0 006.343 3H6a4 4 0 00-4 4v.343a4 4 0 001.172 2.829L10 17l6.828-6.828A4 4 0 0018 7.343V7a4 4 0 00-4-4h-.343a4 4 0 00-2.829 1.172L10 5l-.829-.829z" fill-rule="evenodd" clip-rule="evenodd"></path></g></svg>',

    emotes: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M7 11a1 1 0 100-2 1 1 0 000 2zM14 10a1 1 0 11-2 0 1 1 0 012 0zM10 14a2 2 0 002-2H8a2 2 0 002 2z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>',
    search: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M13.192 14.606a7 7 0 111.414-1.414l3.101 3.1-1.414 1.415-3.1-3.1zM14 9A5 5 0 114 9a5 5 0 0110 0z" clip-rule="evenodd"></path></g></svg>',
    trophy: '<svg fill="#ff9147" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path fill-rule="evenodd" clip-rule="evenodd" d="M5 10h.1A5.006 5.006 0 009 13.9V16H7v2h6v-2h-2v-2.1a5.006 5.006 0 003.9-3.9h.1a3 3 0 003-3V4h-3V2H5v2H2v3a3 3 0 003 3zm2-6h6v5a3 3 0 11-6 0V4zm8 2v2a1 1 0 001-1V6h-1zM4 6h1v2a1 1 0 01-1-1V6z"></path></svg>',
    upload: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M2 16v-3h2v3h12v-3h2v3a2 2 0 01-2 2H4a2 2 0 01-2-2zM15 7l-1.5 1.5L11 6v7H9V6L6.5 8.5 5 7l5-5 5 5z"></path></g></svg>',
    wallet: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M12 11h2v2h-2v-2z"></path><path fill-rule="evenodd" d="M13.45 2.078L2 6v12h14a2 2 0 002-2V8a2 2 0 00-2-2V4.001a2 2 0 00-2.55-1.923zM14 6V4.004L8.172 6H14zM4 8v8h12V8H4z" clip-rule="evenodd"></path></g></svg>',

    close: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M4 16V4H2v12h2zM13 15l-1.5-1.5L14 11H6V9h8l-2.5-2.5L13 5l5 5-5 5z"></path></g></svg>',
    globe: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M10 2c4.415 0 8 3.585 8 8s-3.585 8-8 8-8-3.585-8-8 3.585-8 8-8zm5.917 9a6.015 6.015 0 01-3.584 4.529A10 10 0 0013.95 11h1.967zm0-2a6.015 6.015 0 00-3.584-4.529A10 10 0 0113.95 9h1.967zm-3.98 0A8.002 8.002 0 0010 4.708 8.002 8.002 0 008.063 9h3.874zm-3.874 2A8.002 8.002 0 0010 15.292 8.002 8.002 0 0011.937 11H8.063zM6.05 11a10 10 0 001.617 4.529A6.014 6.014 0 014.083 11H6.05zm0-2a10 10 0 011.617-4.529A6.014 6.014 0 004.083 9H6.05z" clip-rule="evenodd"></path></g></svg>',
    leave: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M16 18h-4a2 2 0 01-2-2v-2h2v2h4V4h-4v2h-2V4a2 2 0 012-2h4a2 2 0 012 2v12a2 2 0 01-2 2z"></path><path d="M7 5l1.5 1.5L6 9h8v2H6l2.5 2.5L7 15l-5-5 5-5z"></path></g></svg>',
    music: '<svg fill="#9147ff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M18 4.331a2 2 0 00-2.304-1.977l-9 1.385A2 2 0 005 5.716v7.334A2.5 2.5 0 106.95 16H7V9.692l9-1.385v2.743A2.5 2.5 0 1017.95 14H18V4.33zm-2 0L7 5.716v1.953l9-1.385V4.33z" clip-rule="evenodd"></path></g></svg>',
    pause: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M8 3H4v14h4V3zM16 3h-4v14h4V3z"></path></g></svg>',
    trash: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M12 2H8v1H3v2h14V3h-5V2zM4 7v9a2 2 0 002 2h8a2 2 0 002-2V7h-2v9H6V7H4z"></path><path d="M11 7H9v7h2V7z"></path></g></svg>',

    bits: '<svg fill="#9147ff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 12l7-10 7 10-7 6-7-6zm2.678-.338L10 5.487l4.322 6.173-.85.728L10 11l-3.473 1.39-.849-.729z"></path></svg>',
    chat: '<svg fill="#ffffff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M7.828 13L10 15.172 12.172 13H15V5H5v8h2.828zM10 18l-3-3H5a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2l-3 3z" clip-rule="evenodd"></path></g></svg>',
    gift: '<svg fill="#9147ff" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M16 6h2v6h-1v6H3v-6H2V6h2V4.793c0-2.507 3.03-3.762 4.803-1.99.131.131.249.275.352.429L10 4.5l.845-1.268a2.81 2.81 0 01.352-.429C12.969 1.031 16 2.286 16 4.793V6zM6 4.793V6h2.596L7.49 4.341A.814.814 0 006 4.793zm8 0V6h-2.596l1.106-1.659a.814.814 0 011.49.451zM16 8v2h-5V8h5zm-1 8v-4h-4v4h4zM9 8v2H4V8h5zm0 4H5v4h4v-4z" clip-rule="evenodd"></path></g></svg>',
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

// Update common variables
let PATHNAME = top.location.pathname,
    STREAMER, STREAMERS;

let __ONLOCATIONCHANGE__ = [];

Object.defineProperties(top, {
    onlocationchange: {
        get() {
            return __ONLOCATIONCHANGE__[__ONLOCATIONCHANGE__.length - 1] ?? null
        },

        set(listener) {
            return __ONLOCATIONCHANGE__.push(listener), listener
        }
    }
});

function update() {
    STREAMERS = [
        // Current streamers
        ...$(`a:not([href="${ PATHNAME }"i])`, true, $('.side-bar-contents .side-nav-section:not(.recommended-channels)'))
            .map(element => {
                    let streamer = {
                        href: element.href,
                        icon: $('figure img', false, element).src,
                        get live() {
                            return empty($('div[class*="--offline"i]', false, element))
                        },
                        name: $('figure img', false, element).alt,
                    };

                    element.setAttribute('draggable', true);
                    element.setAttribute('twitch-tools-streamer-data', JSON.stringify(streamer));
                    element.ondragstart ??= event => {
                        let { currentTarget } = event;

                        event.dataTransfer.setData('application/twitch-tools-streamer', currentTarget.getAttribute('twitch-tools-streamer-data'));
                        event.dataTransfer.dropEffect = 'move';
                    };

                    return streamer;
                }
            ),
    ];
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

    /* Streamers Object - all followed streamers that appear on the "Followed Channels" list (except the currently viewed one)
     * href:string   - link to the streamer's channel
     * icon:string   - link to the streamer's image
     * live:boolean* - GETTER: is the streamer live
     * name:string   - the streamer's username
     */
    STREAMERS = [
        // Current streamers
        ...$(`a:not([href="${ PATHNAME }"i])`, true, $('.side-bar-contents .side-nav-section:not(.recommended-channels)'))
            .map(element => {
                    let streamer = {
                        href: element.href,
                        icon: $('figure img', false, element).src,
                        get live() {
                            return empty($('div[class*="--offline"i]', false, element))
                        },
                        name: $('figure img', false, element).alt,
                    };

                    element.setAttribute('draggable', true);
                    element.setAttribute('twitch-tools-streamer-data', JSON.stringify(streamer));
                    element.ondragstart = event => {
                        let { currentTarget } = event;

                        event.dataTransfer.setData('application/twitch-tools-streamer', currentTarget.getAttribute('twitch-tools-streamer-data'));
                        event.dataTransfer.dropEffect = 'move';
                    };

                    return streamer;
                }
            ),
    ];

    /* Streamer Object - the current streamer
     * coin:number*      - GETTER: how many channel points (floored to the nearest 100) the user has
     * chat:array*       - GETTER: an array of the current chat
     * follow:function   - follows the current streamer
     * game:string*      - GETTER: the name of the current game/category
     * href:string       - link to the streamer's channel (usually the current href)
     * icon:string       - link to the streamer's image
     * like:boolean*     - GETTER: are you following
     * live:boolean*     - GETTER: the the streamer live
     * name:string       - the streamer's username
     * paid:boolean*     - GETTER: are you subscribed
     * ping:boolean*     - GETTER: are notifications on
     * poll:number*      - GETTER: how many viewers are watching
     * tags:array*       - GETTER: tags of the stream
     * team:string*      - GETTERL the team the streamer is affiliated with, if applicable
     * time:number*      - GETTER: how long has the channel been live
     * unfollow:function - unfollows the current streamer
     */
    STREAMER = {
        get chat() {
            return GetChat();
        },

        get coin() {
            let balance = $('[data-test-selector="balance-string"i]'),
                points = 0;

            if(defined(balance)) {
                let { textContent } = balance,
                    COIN, UNIT;

                textContent = textContent.replace(/([\d\.]+)\s*([kMBT])?/i, ($0, $1, $2, $$, $_) => {
                    COIN = $1;
                    UNIT = $2 ?? '';
                });

                for(let index = 0, units = ['', 'K', 'M', 'B', 'T']; index < units.length; index++)
                    if(units[index] == UNIT)
                        points = parseFloat(COIN) * (1e3 ** index);
            }

            return points;
        },

        get game() {
            return $('[data-a-target="stream-game-link"i]')?.textContent
        },

        href: parseURL($(`a[href$="${ PATHNAME }"i]`).href).href,

        icon: $('figure img', false, $(`a[href$="${ PATHNAME }"i]`)).src,

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
            return ParseTime($('.live-time')?.textContent)
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
    };

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
    }

    update();
    setInterval(update, 100);

    let ERRORS = Initialize.errors |= 0;
    if(startover) {
        for(let job in Jobs)
            clearInterval(Jobs[job]);
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

    if(settings.auto_follow_raids || settings.auto_follow_all)
        Jobs.auto_follow_raids = setInterval(Handlers.auto_follow_raids, Timers.auto_follow_raids);

    if(settings.auto_follow_time || settings.auto_follow_all) {
        let { like, coin, follow } = STREAMER,
            mins = parseInt(settings.auto_follow_time_minutes) | 0;

        if(!like)
            setTimeout(follow, mins * 60 * 1000);
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
    if(startover)
        Balloon.get('Up Next').remove();

    let FiLH, FiLJ, FiLP,
       FIL_JOBS = [],
       FIL_BALL = new Balloon({ title: 'Up Next' });

    await LoadCache('FIL_JOBS', cache => FIL_JOBS = cache.FIL_JOBS ?? []);

    FIL_BALL.body.ondragover = event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };

    FIL_BALL.body.ondrop = event => {
        event.preventDefault();

        let streamer = JSON.parse(event.dataTransfer.getData('application/twitch-tools-streamer')),
            { href } = streamer;

        FIL_JOBS.push(href);

        SaveCache({ FIL_JOBS });
    };

    Handlers.first_in_line = (ActionableNotification) => {
        let notifications = $('[data-test-selector="onsite-notifications-toast-manager"i] [data-test-selector^="onsite-notification-toast"i]', true);

        let mins = parseInt(settings.first_in_line_time_minutes) | 0;

        for(let notification of [ActionableNotification, ...notifications].filter(notification => defined(notification))) {
            let action = (
                notification instanceof Element?
                    $('a[href^="/"]', false, notification):
                notification
            );

            if(!defined(action))
                continue;

            let { href, pathname } = parseURL(action.href);
            let { textContent } = action;

            console.warn('Recieved an actionable notification:', textContent, new Date);

            if(defined(FiLH)) {
                if(FiLH !== href && !~FIL_JOBS.indexOf(href))
                    FIL_JOBS.push(href);

                console.warn('Pushing to Jobs:', href);

                // To wait, or not to wait
                SaveCache({ FIL_JOBS });

                continue;
            }

            if(/\b(go(?:ing)?|is|went) +live\b/i.test(textContent)) {
                let streamer = STREAMERS.find(streamer => parseURL(streamer.href).href === href);

                if(!defined(streamer))
                    continue;

                FiLH = href;

                FIL_BALL.add({
                    href,
                    src: streamer.icon,
                    message: `${ streamer.name } <span style="display:none">is live</span>`,
                    subheader: `Up next`,
                    onremove: event => {
                        let removed = event.href;

                        console.log('Removed', removed);
                    },

                    attributes: {
                        time: mins * 60 * 1000,
                    },

                    animate: container => {
                        let subheader = $('.twitch-tools-balloon-subheader', false, container);

                        return setInterval(() => {
                            let time = parseInt(container.getAttribute('time')) - 1000;

                            container.setAttribute('time', time);
                            subheader.innerHTML = ConvertTime(time, 'clock');
                        }, 1000);
                    },
                });

                if(mins) {
                    console.warn(`Waiting ${ mins } minutes before leaving for stream`, new Date);

                    setTimeout(() => {
                        console.warn('Heading to stream in 1 minute', FiLH, new Date);

                        let secs = 60 * 1000;

                        let popup = new Popup(`First in line: TTV${ pathname }`, 'Heading to stream in \t1 minute\t', {
                            Icon: STREAMERS.find(streamer => streamer.href === href)?.icon,

                            Goto: () => {
                                let existing = $('#twitch-tools-popup');

                                if(defined(existing))
                                    existing.remove();
                                console.warn('Heading to stream now');

                                clearInterval(FiLP);
                                clearTimeout(FiLJ);
                                open(FiLH, '_self');

                                FiLH = undefined;
                            },
                            Cancel: () => {
                                let existing = $('#twitch-tools-popup');

                                if(defined(existing))
                                    existing.remove();
                                console.warn('Canceled First in Line event');

                                let balloon_job = $(`[uuid][guid][href="${ FiLH }"]`),
                                    timeleft = parseInt($('[id^="twitch-tools-balloon-job-"]', false, balloon_job).getAttribute('time'));

                                balloon_job.remove();

                                $('[id^="twitch-tools-balloon-job-"]', true).map(
                                    container => {
                                        let subheader = $('.twitch-tools-balloon-subheader', false, container);

                                        container.setAttribute('time', parseInt(container.getAttribute('time')) - timeleft);
                                    }
                                );

                                clearInterval(FiLP);
                                clearTimeout(FiLJ);
                                FiLH = undefined;
                            },
                        });

                        FiLP = setInterval(() => {
                            if(defined(popup?.elements))
                                popup.elements.message.innerHTML
                                    = popup.elements.message.innerHTML
                                        .replace(/\t(.+?)\t/i, ['\t', ConvertTime(secs -= 1000, 'minute:second'), '\t'].join(''));

                            if(secs < 1) {
                                popup.remove();
                                clearInterval(FiLP);
                            }
                        }, 1000);
                    }, (mins - 1) * 60 * 1000);

                    FiLJ = setTimeout(() => {
                        let existing = $('#twitch-tools-popup');

                        if(defined(existing))
                            existing.remove();

                        clearTimeout(FiLJ);
                        open(FiLH, '_self');

                        FiLH = undefined;
                    }, mins * 60 * 1000);
                } else {
                    let existing = $('#twitch-tools-popup');

                    if(defined(existing))
                        existing.remove();

                    open(FiLH, '_self');

                    FiLH = undefined;
                }
            }
        }

        for(let index = 0, fails = 0; index < FIL_JOBS.length; index++) {
            let href = FIL_JOBS[index],
                streamer = STREAMERS.find(streamer => parseURL(streamer.href).href === href);

            // Replaces up to 3 places
            let nth = n => (n + '')
                .replace(/^1[123]$/, '$1th')
                .replace(/1$/, '1st')
                .replace(/2$/, '2nd')
                .replace(/3$/, '3rd')
                .replace(/(\d)$/, '$1th');

            if(!defined(href) || !defined(streamer)) {
                FIL_JOBS.splice(index, 1);
                SaveCache({ FIL_JOBS });

                ++fails;

                continue;
            }

            FIL_BALL.add({
                href,
                src: streamer.icon,
                message: `${ streamer.name } <span style="display:none">is live</span>`,
                subheader: `${ nth(index + 1) } in line`,
                onremove: event => {
                    let [removed] = FIL_JOBS.splice(
                            FIL_JOBS.findIndex(href => event.href == href)
                        , 1);

                    console.log('Removed', removed);

                    // TODO remove and shift

                    SaveCache({ FIL_JOBS });
                },

                attributes: {
                    index,
                    time: (index + 1 - fails) * mins * 60 * 1000,
                },

                animate: container => {
                    let subheader = $('.twitch-tools-balloon-subheader', false, container),
                        index = parseInt(subheader.closest('[id^="twitch-tools-balloon-job"]').getAttribute('index'));

                    if(index > 0)
                        return -1;

                    return setInterval(() => {
                        let time = parseInt(container.getAttribute('time')) - 1000;

                        container.setAttribute('time', time);
                        subheader.innerHTML = ConvertTime(time, 'clock');
                    }, 1000);
                },
            });
        }

        if(!defined(FiLH)) {
            let [href] = FIL_JOBS,
                streamer = STREAMERS.find(streamer => parseURL(streamer.href).href === href);

            if(!defined(href) || !defined(streamer)) {
                FIL_JOBS.splice(0, 1);
                SaveCache({ FIL_JOBS });
            }

            if(defined(streamer))
                Handlers.first_in_line({ href, textContent: `${ streamer.name } is live` });
        }
    };
    Timers.first_in_line = 3000;

    Unhandlers.first_in_line = () => {
        if(defined(FiLJ))
            clearTimeout(FiLJ);
        if(defined(FiLH))
            FiLH = '?';

        SaveCache({ FIL_JOBS: [] });
    };

    window.onlocationchange = () => FIL_BALL.remove();

    if(settings.first_in_line)
        Jobs.first_in_line = setInterval(Handlers.first_in_line, Timers.first_in_line);

    /*** First in Line+
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

    Handlers.first_in_line_plus = () => {
        let streamers = STREAMERS.filter(streamer => streamer.live).map(streamer => streamer.name).sort();

        NEW_STREAMERS = streamers.map(name => UUID.from(name).toString()).join(',');

        if(!defined(OLD_STREAMERS))
            OLD_STREAMERS = NEW_STREAMERS;

        if(OLD_STREAMERS == NEW_STREAMERS)
            return /* No new streamer(s) */;

        let old_uuids = OLD_STREAMERS.split(','),
            new_uuids = NEW_STREAMERS.split(',');

        new_uuids = new_uuids.filter(uuid => !~old_uuids.indexOf(uuid));

        if(new_uuids.length < 1)
            return;

        let mins = parseInt(settings.first_in_line_plus_time_minutes) | 0;

        for(let uuid of new_uuids) {
            let streamer = STREAMERS.find(streamer => UUID.from(streamer.name).toString() == uuid);
            let { name, href } = streamer,
                url = parseURL(href),
                { pathname } = url;

            if(!defined(streamer))
                continue;
            console.warn('A channel just appeared:', name, new Date);

            Handlers.first_in_line({ href, textContent: `${ name } is going live` });
        }

        OLD_STREAMERS = NEW_STREAMERS;
    };
    Timers.first_in_line_plus = 1000;

    if(settings.first_in_line_plus)
        Jobs.first_in_line_plus = setInterval(Handlers.first_in_line_plus, Timers.first_in_line_plus);

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
    Timers.kill_extensions = 2500;

    Unhandlers.kill_extensions = () => {
        let extension_views = $('[class^="extension-view"i]', true);

        for(let view of extension_views)
            view.removeAttribute('style');
    };

    if(settings.kill_extensions)
        Jobs.kill_extensions = setInterval(Handlers.kill_extensions, Timers.kill_extensions);

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
    Handlers.prevent_hosting = () => {
        let online = STREAMERS.filter(streamer => streamer.live),
            next = online[(Math.random() * online.length)|0],
            hosting = defined($('[data-a-target="hosting-indicator"i]'));

        if(hosting && next)
            if(online.length) {
                console.warn(`${ STREAMER.name } is hosting. Moving onto next streamer (${ next.name })`, next.href, new Date);

                open(next.href, '_self');
            } else {
                console.warn(`${ STREAMER.name } is hosting. There doesn't seem to be any followed streamers on right now`, new Date);
            }
    };
    Timers.prevent_hosting = 5000;

    if(settings.prevent_hosting)
        Jobs.prevent_hosting = setInterval(Handlers.prevent_hosting, Timers.prevent_hosting);

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
    Handlers.prevent_raiding = () => {
        let url = parseURL(top.location),
            data = url.searchParameters,
            raided = data.referrer === 'raid',
            raiding = defined($('[data-test-selector="raid-banner"i]')),
            online = STREAMERS.filter(streamer => streamer.live),
            next = online[(Math.random() * online.length)|0];

        if((raiding || raided) && next)
            if(online.length) {
                console.warn(`${ STREAMER.name } is raiding. Moving onto next streamer (${ next.name })`, next.href, new Date);

                open(next.href, '_self');
            } else {
                console.warn(`${ STREAMER.name } is raiding. There doesn't seem to be any followed streamers on right now`, new Date);
            }
    };
    Timers.prevent_raiding = 5000;

    if(settings.prevent_raiding)
        Jobs.prevent_raiding = setInterval(Handlers.prevent_raiding, Timers.prevent_raiding);

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
    Handlers.stay_live = async() => {
        let online = STREAMERS.filter(streamer => streamer.live),
            next = online[(Math.random() * online.length)|0],
            { pathname } = window.location;

        let Paths = [USERNAME, '[up]/', 'watchparty', 'videos?', 'team', 'directory', 'downloads?', 'jobs?', 'turbo', 'friends?', 'subscriptions?', 'inventory', 'wallet', 'settings', 'search', '$'];

        try {
            await LoadCache('UserIntent', intent => {
                let { UserIntent } = intent;

                if(UserIntent)
                    Paths.push(UserIntent);
            });
        } catch(error) {
            return RemoveCache('UserIntent');
        }

        let ValidTwitchPath = RegExp(`/(${ Paths.join('|') })`, 'i');

        if(!STREAMER.live && !ValidTwitchPath.test(pathname)) {
            if(online.length) {
                console.warn(`${ STREAMER.name } is no longer live. Moving onto next streamer (${ next.name })`, next.href, new Date);

                open(next.href, '_self');
            } else  {
                console.warn(`${ STREAMER.name } is no longer live. There doesn't seem to be any followed streamers on right now`, new Date);
            }
        } else if(/\/search/i.test(pathname)) {
            let { term } = parseURL(location).searchParameters;

            await SaveCache({ UserIntent: term });
        }
    };
    Timers.stay_live = 5000;

    if(settings.stay_live)
        Jobs.stay_live = setInterval(Handlers.stay_live, Timers.stay_live);

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
    let EMOTES = {},
        shrt = url => url.replace(/https:\/\/static-cdn\.jtvnw\.net\/emoticons\/v1\/(\d+)\/([\d\.]+)/i, ($0, $1, $2, $$, $_) => {
            let id = parseInt($1).toString(36),
                version = $2;

            return [id, version].join('-');
        });

    Handlers.convert_emotes = () => {
        let chat = GetChat(5, true),
            regexp;

        for(let emote in chat.emotes)
            if(!(emote in EMOTES))
                EMOTES[emote] = shrt(chat.emotes[emote]);

        for(let line of chat) {
            if(!!~Queue.emotes.indexOf(line.uuid))
                return;
            if(Queue.emotes.length >= 100)
                Queue.emotes = [];
            Queue.emotes.push(line.uuid);

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
        }
    };
    Timers.convert_emotes = 100;

    if(settings.convert_emotes) {
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

        Jobs.convert_emotes = setInterval(Handlers.convert_emotes, Timers.convert_emotes);
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
    Handlers.filter_messages = () => {
        let rules = settings.filter_rules;

        if(!rules || !rules.length)
            return;

        rules = rules.split(/,/).filter(value => value.length);

        if(!rules.length)
            return;

        let channel = rules.filter(rule => /^\/[\w\-]+/.test(rule)).map((rule, index) => {
                let name, text, user;

                rule.replace(/^\/([\w\-]+) +((@)?[^]*?)$/, ($0, $1, $2, $3, $$, $_) => {
                    name = $1;

                    if($3 ?? false)
                        user = $2;
                    else
                        text = $2;
                });

                if(name && (user?.length || text?.length))
                    rules.splice(index, 1);

                return { name, text, user };
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
    }, 1000);

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
        let chat = GetChat().filter(line => !!~line.mentions.indexOf(USERNAME));

        for(let line of chat)
            if(!~Queue.messages.indexOf(line.uuid)) {
                Queue.messages.push(line.uuid);
                line.element.setAttribute('style', 'background-color: var(--color-background-button-primary-active)');

                let { author, message, reply } = line;

                let existing = $('#twitch-tools-popup');

                if(defined(existing))
                    continue;

                if(settings.highlight_mentions_popup)
                    new Popup(`@${ author } sent you a message`, message, {
                        Reply: event => {
                            let chatbox = $('.chat-input__textarea textarea'),
                                existing = $('#twitch-tools-popup');

                            if(defined(chatbox))
                                chatbox.focus();
                            if(defined(existing))
                                existing.remove();

                            reply?.click();
                        }
                    });
            }
    };
    Timers.highlight_mentions = 500;

    if(settings.highlight_mentions)
        Jobs.highlight_mentions = setInterval(Handlers.highlight_mentions, Timers.highlight_mentions);

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

    if(settings.convert_bits)
        Jobs.convert_bits = setInterval(Handlers.convert_bits, Timers.convert_bits);

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
    Handlers.recover_video = () => {
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
    Timers.recover_video = 1000;

    Jobs.recover_video = setInterval(Handlers.recover_video, Timers.recover_video);

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
        if(!paused || isTrusted || (isAdvert && !settings.recover_ads) || VIDEO_PLAYER_TIMEOUT > -1)
            return;

        // Wait .5s before trying to press play again
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
            console.warn(error);

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
    Timers.recover_stream = 5000;

    if(settings.recover_stream) {
        let video = $('video');

        if(!defined(video))
            return;

        video.onpause = event => Handlers.recover_stream(event.currentTarget);

        Jobs.recover_stream = setInterval(Handlers.recover_stream, Timers.recover_stream);
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
    /*** away mode
     *                                    ____              _ _ _
     *         /\                        / __ \            | (_) |
     *        /  \__      ____ _ _   _  | |  | |_   _  __ _| |_| |_ _   _
     *       / /\ \ \ /\ / / _` | | | | | |  | | | | |/ _` | | | __| | | |
     *      / ____ \ V  V / (_| | |_| | | |__| | |_| | (_| | | | |_| |_| |
     *     /_/    \_\_/\_/ \__,_|\__, |  \___\_\\__,_|\__,_|_|_|\__|\__, |
     *                            __/ |                              __/ |
     *                           |___/                              |___/
     */
    Handlers.away_mode = () => {
        // No interval code yet
    };
    Timers.away_mode = 1000;

    if(settings.away_mode) {
        let button,
            uuid = new UUID().toString().replace(/-/g, ''),
            quality = await GetQuality(),
            enabled = (quality.low && !(quality.auto || quality.high || quality.source));

        if(!defined($('#away-mode'))) {
            let sibling   = $('[data-test-selector="live-notifications-toggle"]'),
                parent    = sibling?.parentElement,
                container = furnish('div');

            if(!defined(parent) || !defined(sibling))
                return setTimeout(Initialize, 1000);

            container.innerHTML = sibling.outerHTML.replace(/(?:[\w\-]*)notifications?([\w\-]*)/ig, 'away-mode$1');
            container.id = 'away-mode';

            parent.insertBefore(container, parent.lastElementChild);

            button = {
                enabled,
                container,
                icon: $('svg', false, container),
                get offset() { return getOffset(container) },
                background: $('button[data-a-target="away-mode-toggle"i]', false, container),
                tooltip: furnish('div.tw-tooltip.tw-tooltip--align-center.tw-tooltip--up', { role: 'tooltip', uuid }, `You're ${ ['','not'][+enabled] } watching ${ STREAMER.name }. Quality set to ${ ['AUTO','LOW'][+enabled] }`),
            };

            button.icon.outerHTML = Glyphs.eye;
            button.container.setAttribute('twitch-tools-away-mode-enabled', false);

            button.icon = $('svg', false, container);
        } else {
            let container = $('#away-mode');

            button = {
                enabled,
                container,
                icon: $('svg', false, container),
                tooltip: $(`div[role="tooltip"i][uuid]`),
                get offset() { return getOffset(container) },
                background: $('button[data-a-target="away-mode-toggle"i]', false, container),
            };
        }

        button.tooltip.id = uuid;
        button.background.setAttribute('style', `background:var(--color-accent-primary-${ '31'[+enabled] }) !important;`);
        button.icon.setAttribute('height', '20px');
        button.icon.setAttribute('width', '20px');

        button.container.onclick = event => {
            let enabled = button.container.getAttribute('twitch-tools-away-mode-enabled') !== 'true';

            button.container.setAttribute('twitch-tools-away-mode-enabled', enabled);
            button.background.setAttribute('style', `background:var(--color-accent-primary-${ '31'[+enabled] }) !important;`);
            button.tooltip.innerHTML = `You're ${ ['','not'][+enabled] } watching ${ STREAMER.name }. Quality set to ${ ['AUTO','LOW'][+enabled] }`;

            ChangeQuality(['auto','low'][+enabled]);
        };

        button.container.onmouseenter = event => {
            $('div#root > *').appendChild(
                furnish('div.tooltip-layer', { style: `transform: translate(${ button.offset.left + 10 }px, ${ button.offset.top }px); width: 40px; height: 30px;` },
                    furnish('div', { 'aria-describedby': button.tooltip.id, 'class': 'tw-inline-flex tw-relative tw-tooltip-wrapper tw-tooltip-wrapper--show' },
                        furnish('div', { style: 'width: 40px; height: 30px;' }),
                        button.tooltip
                    )
                )
            );

            button.tooltip.setAttribute('style', 'display:block');
            button.icon.setAttribute('style', 'transform: translateX(0px) scale(1.2); transition: transform 300ms ease 0s');
        };

        button.container.onmouseleave = event => {
            $('div#root .tooltip-layer')?.remove();

            button.tooltip.setAttribute('style', 'display:none');
            button.icon.setAttribute('style', 'transform: translateX(0px) scale(1); transition: transform 300ms ease 0s');
        };

        Jobs.away_mode = setInterval(Handlers.away_mode, Timers.away_mode);
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
            Enabled = (settings.auto_claim_bonuses && $('#auto-community-points').getAttribute('twitch-tools-auto-claim-bonus-channel-points-enabled') === 'true');

        if(Enabled && ChannelPoints)
            ChannelPoints.click();

        let parent = $('div:not(#auto-community-points) > [data-test-selector="community-points-summary"i] [role="tooltip"i]'),
            tooltip = $('#auto-community-points [role="tooltip"i]');

        if(tooltip && parent)
            tooltip.innerText = parent.innerText;
    };
    Timers.auto_claim_bonuses = 5000;

    if(settings.auto_claim_bonuses) {
        let button,
            uuid = new UUID().toString();

        let comify = number => (number + '').split('').reverse.join().replace(/(\d{3})/g, '$1,').split('').reverse().join('');

        if(!defined($('#auto-community-points'))) {
            let parent    = $('[data-test-selector="community-points-summary"i]'),
                heading   = $('.top-nav__menu > div', true).slice(-1)[0],
                container = furnish('div');

            if(!defined(parent) || !defined(heading))
                return setTimeout(Initialize, 1000);

            container.innerHTML = parent.outerHTML;
            container.id = 'auto-community-points';
            container.classList.add('community-points-summary', 'tw-align-items-center', 'tw-flex', 'tw-full-height');

            heading.insertBefore(container, heading.children[1]);

            $('#auto-community-points [data-test-selector="community-points-summary"i] > div:last-child:not(:first-child)').remove();

            let textContainer = $('[class$="animated-number"i]', false, container);

            if(textContainer) {
                let { parentElement } = textContainer;
                parentElement.removeAttribute('data-test-selector');
            }

            button = {
                container,
                enabled: true,
                text: textContainer,
                get offset() { return getOffset(container) },
                icon: $('svg[class*="channel"i][class*="points"i], img[class*="channel"i][class*="points"i]', false, container),
                tooltip: furnish('div.tw-tooltip.tw-tooltip--align-center.tw-tooltip--down', { role: 'tooltip' }, `Collecting Bonus Channel Points`),
            };

            button.text.innerText = 'ON';
            button.icon.outerHTML = Glyphs.channelpoints;
            button.container.setAttribute('twitch-tools-auto-claim-bonus-channel-points-enabled', true);

            button.icon = $('svg', false, container);
        } else {
            let container = $('#auto-community-points'),
                textContainer = $('[class$="animated-number"i]', false, container);

            button = {
                container,
                enabled: true,
                text: textContainer,
                get offset() { return getOffset(container) },
                tooltip: $('div[role="tooltip"i]'),
                icon: $('svg[class*="channel"i][class*="points"i], img[class*="channel"i][class*="points"i]', false, container),
            };
        }

        button.tooltip.id = uuid;

        button.container.onclick = event => {
            let enabled = button.container.getAttribute('twitch-tools-auto-claim-bonus-channel-points-enabled') !== 'true';

            button.container.setAttribute('twitch-tools-auto-claim-bonus-channel-points-enabled', enabled);
            button.text.innerText = ['OFF','ON'][+enabled];
            button.icon.setAttribute('style', `fill:var(--color-${ ['red','accent'][+enabled] }) !important;`);
            button.tooltip.innerHTML = `${ ['Ignor','Collect'][+enabled] }ing Bonus Channel Points`;
        };

        button.container.onmouseenter = event => {
            $('div#root > *').appendChild(
                furnish('div.tooltip-layer', { style: `transform: translate(${ button.offset.left + 10 }px, ${ button.offset.top - 10 }px); width: ${ button.offset.width }px; height: ${ button.offset.height }px; z-index: 2000;` },
                    furnish('div', { 'aria-describedby': button.tooltip.id, 'class': 'tw-inline-flex tw-relative tw-tooltip-wrapper tw-tooltip-wrapper--show' },
                        furnish('div', { style: `width: ${ button.offset.width }px; height: ${ button.offset.height }px;` }),
                        button.tooltip
                    )
                )
            );

            button.tooltip?.setAttribute('style', 'display:block');
            button.icon?.setAttribute('style', 'transform: translateX(0px) scale(1.2); transition: transform 300ms ease 0s');
        };

        button.container.onmouseleave = event => {
            $('div#root .tooltip-layer')?.remove();

            button.tooltip?.setAttribute('style', 'display:none');
            button.icon?.setAttribute('style', 'transform: translateX(0px) scale(1); transition: transform 300ms ease 0s');
        };

        Jobs.auto_claim_bonuses = setInterval(Handlers.auto_claim_bonuses, Timers.auto_claim_bonuses);
    }
};
// End of Initialize

let WaitForPageToLoad = setInterval(() => {
    let ready = defined($(`[data-a-target="follow-button"i], [data-a-target="unfollow-button"i]`));

    if(ready) {
        setTimeout(Initialize, 1000);
        clearInterval(WaitForPageToLoad);

        // Observe location changes
        (() => {
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
        })();

        window.onlocationchange = () => Initialize();
    }
}, 500);
