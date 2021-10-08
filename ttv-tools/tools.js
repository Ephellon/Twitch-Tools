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
let Queue = { balloons: [], bullets: [], bttv_emotes: [], emotes: [], messages: [], message_popups: [], popups: [] },
    Messages = new Map(),
    PostOffice = new Map(),
    UserMenuToggleButton,
    // These won't change (often)
    ACTIVITY,
    USERNAME,
    LANGUAGE,
    THEME,
    LITERATURE,
    SPECIAL_MODE,
    NORMAL_MODE,
    NORMALIZED_PATHNAME,
    // Hmm...
    JUMPED_FRAMES = false,
    JUMP_DATA = {};

// Populate the username field by quickly showing the menu
awaitOn(() => UserMenuToggleButton ??= $('[data-a-target="user-menu-toggle"i]'))
    .then(() => {
        UserMenuToggleButton.click();
        ACTIVITY = top.ACTIVITY = $('[data-a-target="presence-text"i]')?.innerText ?? '';
        USERNAME = top.USERNAME = $('[data-a-target="user-display-name"i]')?.innerText ?? null;
        THEME = top.THEME = [...$('html').classList].find(c => /theme-(\w+)/i.test(c)).replace(/[^]*theme-(\w+)/i, '$1').toLowerCase();

        $('[data-a-target^="language"i]')?.click();
        LITERATURE = top.LITERATURE = $('[data-language] svg')?.closest('button')?.dataset?.language ?? '';
        UserMenuToggleButton.click();
    });

/*** Setup (pre-init) - #MARK:classes #MARK:functions #MARK:methods
 *       _____      _                  __                      _       _ _ __
 *      / ____|    | |                / /                     (_)     (_) |\ \
 *     | (___   ___| |_ _   _ _ __   | | _ __  _ __ ___        _ _ __  _| |_| |
 *      \___ \ / _ \ __| | | | '_ \  | || '_ \| '__/ _ \______| | '_ \| | __| |
 *      ____) |  __/ |_| |_| | |_) | | || |_) | | |  __/______| | | | | | |_| |
 *     |_____/ \___|\__|\__,_| .__/  | || .__/|_|  \___|      |_|_| |_|_|\__| |
 *                           | |      \_\ |                                /_/
 *                           |_|        |_|
 */

// Displays a popup
    // new Popup(subject:string, message:string[, options:object]) -> Object
    // Popup.prototype.remove() -> undefined
class Popup {
    static #POPUPS = new Map()

    constructor(subject, message, options = {}) {
        let f = furnish;

        // The document (container)
        top.CHILD_CONTROLLER_CONTAINER = $('#tt-popup-container', false, top.document)?.contentDocument ?? top.document;

        let P = $('.stream-chat-header', false, top.CHILD_CONTROLLER_CONTAINER),
            X = $('#tt-popup', false, P),
            I = Extension.getURL('profile.png'),
            N = 'Continue',
            D = 'Close',
            A = event => $('#tt-popup', false, top.CHILD_CONTROLLER_CONTAINER)?.remove(),
            C = event => $('#tt-popup', false, top.CHILD_CONTROLLER_CONTAINER)?.remove(),
            R = '_self',
            U, S, M, G, T, W, H;

        let uuid = U = UUID.from(subject).value,
            existing = Popup.#POPUPS.get(uuid);

        if(defined(existing))
            return existing;

        if(defined(X)) {
            if(!Queue.popups.map(popup => popup.uuid).contains(uuid)) {
                let interval = setInterval(() => {
                    let existing = $('#tt-popup', false, top.CHILD_CONTROLLER_CONTAINER);

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

        let [accent] = (Settings.accent_color ?? 'blue/12').split('/');

        let p =
        f('div#tt-popup.tt-absolute.tt-mg-t-5', { uuid, style: 'z-index:9; bottom:10rem; right:1rem' },
            f('div.tt-animation.tt-animation--animate.tt-animation--bounce-in.tt-animation--duration-medium.tt-animation--fill-mode-both.tt-animation--timing-ease', { 'data-a-target': 'tt-animation-target' },
                f('div', {},
                    f('div.tt-border-b.tt-border-l.tt-border-r.tt-border-radius-small.tt-border-t.tt-c-background-base.tt-elevation-2.tt-flex.tt-flex-nowrap.tt-mg-b-1', {
                            style: `background-color:var(--color-${ accent })!important;`
                        },
                        f('a', { href: H, target: R, style: 'text-decoration:none' },
                            f('div.tt-block.tt-full-width.tt-interactable.tt-interactable--alpha.tt-interactable--hover-enabled.tt-interactive', {},
                                f('div.tt-flex.tt-flex-nowrap.tt-pd-l-1.tt-pd-y-1', {},
                                    f('div', {},
                                        f('div', { style: 'height:4rem; width:4rem' },
                                            G = f('img.tt-border-radius-rounded.tt-full-height.tt-full-width.tt-image', {
                                                src: I,
                                                sizeinpixels: 40,
                                                borderradius: 'tt-border-radius-rounded',
                                            })
                                        )
                                    ),
                                    f('div.tt-flex.tt-flex-column.tt-flex-nowrap.tt-overflow-hidden.tt-pd-x-1', {},
                                        f('div.tt-full-height.tt-overflow-hidden', {},
                                            f('span.tt-c-text-alt', {},
                                                f('div', {},
                                                    S = f('p', {}, subject)
                                                )
                                            )
                                        ),
                                        f('div.tt-flex-shrink-0.tt-mg-t-05', {},
                                            M = f('div.tt-c-text-alt', {}, message)
                                        )
                                    )
                                )
                            )
                        ),
                        // Notification counter
                        f('div#tt-notification-counter--popup.tt-absolute.tt-font-size-7.tt-right-0.tt-top-0', { style: 'visibility:hidden' },
                            f('div.tt-animation.tt-animation--animate.tt-animation--bounce-in.tt-animation--duration-medium.tt-animation--fill-mode-both.tt-animation--timing-ease-in', {
                                    'data-a-target': 'tt-animation-target'
                                },
                                f('div.tt-c-background-base.tt-inline-flex.tt-number-badge.tt-relative', {},
                                    f('div#tt-notification-counter-output--popup.tt-c-text-overlay.tt-number-badge__badge.tt-relative', {
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
                        f('div.tt-align-content-stretch.tt-border-l.tt-flex.tt-flex-column.tt-flex-grow-0.tt-flex-shrink-0', {},
                            // Confirm
                            f('div.tt-align-content-stretch.tt-border-b.tt-flex.tt-flex-grow-1', {},
                                T = f('button.tt-block.tt-full-width.tt-interactable.tt-interactable--alpha.tt-interactable--hover-enabled.tt-interactive', {
                                        onclick: A,
                                    },
                                    f('div.tt-align-items-center.tt-flex.tt-flex-grow-1.tt-full-height.tt-justify-content-center.tt-pd-05', {},
                                        f('p.tt-c-text-alt', {}, N)
                                    )
                                )
                            ),
                            // Decline
                            f('div.tt-align-content-stretch.tt-border-b.tt-flex.tt-flex-grow-1', {},
                                W = f('button.tt-block.tt-full-width.tt-interactable.tt-interactable--alpha.tt-interactable--hover-enabled.tt-interactive', {
                                        onclick: C,
                                    },
                                    f('div.tt-align-items-center.tt-flex.tt-flex-grow-1.tt-full-height.tt-justify-content-center.tt-pd-05', {},
                                        f('p.tt-c-text-alt', {}, D)
                                    )
                                )
                            )
                        )
                    )
                )
            )
        );

        P?.append(p);

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

        Popup.#POPUPS.set(uuid, this);

        return this;
    }

    static remove(uuid) {
        let popup = Popup.#POPUPS.get(uuid);

        popup.container?.remove();

        Popup.#POPUPS.delete(uuid);
    }

    static get(uuid) {
        return Popup.#POPUPS.get(uuid);
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
        f('div.tt-align-self-center.tt-flex-grow-0.tt-flex-nowrap.tt-flex-shrink-0.tt-mg-x-05', {},
            f('div', {},
                f('div.tt-relative', {},
                    // Navigation Icon
                    N = f('div',
                        {
                            style: 'display:inherit',

                            'data-test-selector': 'toggle-balloon-wrapper__mouse-enter-detector',
                        },
                        f('div.tt-inline-flex.tt-relative', {},
                            f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative',
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
                                F = f(`div#tt-notification-counter--${ U }.tt-absolute.tt-right-0.tt-top-0`, { style: 'visibility:hidden', 'connected-to': U, length: 0 },
                                    f('div.tt-animation.tt-animation--animate.tt-animation--bounce-in.tt-animation--duration-medium.tt-animation--fill-mode-both.tt-animation--timing-ease-in', {
                                            'data-a-target': 'tt-animation-target'
                                        },
                                        f('div.tt-c-background-base.tt-inline-flex.tt-number-badge.tt-relative', {},
                                            f(`div#tt-notification-counter-output--${ U }.tt-c-text-overlay.tt-number-badge__badge.tt-relative`, {
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
                    f(`div#tt-balloon-${ U }.tt-absolute.tt-balloon.tt-right-0.tt-balloon--down.tt-balloon--right.tt-balloon-lg.tt-block`,
                        {
                            style: 'display:none!important',
                            display: 'none',
                            role: 'dialog',
                        },
                        f('div.tt-border-radius-large.tt-c-background-base.tt-c-text-inherit.tt-elevation-4', {},
                            (C = f(`div#tt-balloon-container-${ U }.tt-flex.tt-flex-column`,
                                {
                                    style: 'min-height:22rem; max-height: 90vh; min-width:40rem; overflow-y: auto;',
                                    role: 'dialog',
                                },
                                // Header
                                f('div.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-c-text-base.tt-elevation-1.tt-flex.tt-flex-shrink-0.tt-pd-x-1.tt-pd-y-05.tt-popover-header', {},
                                    f('div.tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-justify-content-center', {},
                                        (H = f(`h5#tt-balloon-header-${ U }.tt-align-center.tt-c-text-alt.tt-semibold`, { style: 'margin-left:4rem!important' }, title))
                                    ),
                                    f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-button-icon--secondary.tt-core-button.tt-flex.tt-flex-column.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-justify-content-center.tt-mg-l-05.tt-overflow-hidden.tt-popover-header__icon-slot--right.tt-relative',
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
                                                f('div.tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-overflow-hidden',
                                                    { 'data-test-selector': 'center-window__content' },
                                                    f('div.persistent-notification.tt-relative',
                                                        {
                                                            style: 'width:100%',

                                                            'data-test-selector': 'persistent-notification',
                                                        },
                                                        f('div.persistent-notification__unread.tt-border-b.tt-flex.tt-flex-nowrap', {},
                                                            f('a.tt-block.tt-full-width.tt-interactable.tt-interactable--alpha.tt-interactable--hover-enabled.tt-interactive',
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
                                                                f('div.persistent-notification__area.tt-flex.tt-flex-nowrap.tt-pd-b-1.tt-pd-l-1.tt-pd-r-3.tt-pd-t-1', {},
                                                                    // Avatar
                                                                    f('div', {},
                                                                        f('div.tt-border-radius-rounded.tt-card-img.tt-card-img--size-4.tt-flex-shrink-0.tt-overflow-hidden', {},
                                                                            f('div.tt-aspect.tt-aspect--align-top', {},
                                                                                f('img.tt-balloon-avatar.tt-image', { src })
                                                                            )
                                                                        )
                                                                    ),
                                                                    // Message body
                                                                    f('div.tt-flex.tt-flex-column.tt-flex-nowrap.tt-mg-x-1', {},
                                                                        f('div.persistent-notification__body.tt-overflow-hidden',
                                                                            {
                                                                                'data-test-selector': 'persistent-notification__body'
                                                                            },
                                                                            f('span.tt-c-text-alt', {},
                                                                                f('p.tt-balloon-message', { innerHTML: message })
                                                                            )
                                                                        ),
                                                                        // Subheader
                                                                        f('div.tt-align-items-center.tt-flex.tt-flex-shrink-0.tt-mg-t-05', {},
                                                                            f('div.tt-mg-l-05', {},
                                                                                f('span.tt-balloon-subheader.tt-c-text-alt', { innerHTML: subheader })
                                                                            )
                                                                        )
                                                                    )
                                                                )
                                                            ),
                                                            f('div.persistent-notification__delete.tt-absolute.tt-pd-l-1.tt-pd-r-05.tt-pd-t-1', {},
                                                                f('div.tt-align-items-start.tt-flex.tt-flex-nowrap', {},
                                                                    f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative',
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
                                                                        f('span.tt-button-icon__icon', {},
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

        this.tooltip = furnish('div.tt-tooltip.tt-tooltip--align-center.tt-tooltip--down', { id: `balloon-tooltip-for-${ U }`, role: 'tooltip' }, this.title = title);

        Balloon.#BALLOONS.set(title, this);

        return this;
    }

    addButton({ left = false, icon = 'play', onclick = ($=>$), attributes = {} }) {
        let parent = this.header.closest('div[class*="header"i]');
        let uuid = UUID.from(onclick.toString()).value,
            existing = $(`[uuid="${ uuid }"i]`, false, parent);

        if(defined(existing))
            return existing;

        let button = furnish('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-button-icon--secondary.tt-core-button.tt-flex.tt-flex-column.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-justify-content-center.tt-mg-l-05.tt-overflow-hidden.tt-popover-header__icon-slot--right.tt-relative',
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
                        f('div.tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-overflow-hidden',
                            { 'data-test-selector': 'center-window__content' },
                            f('div.persistent-notification.tt-relative',
                                {
                                    style: 'width:100%',

                                    'data-test-selector': 'persistent-notification',
                                },
                                f('div.persistent-notification__unread.tt-border-b.tt-flex.tt-flex-nowrap', {},
                                    f('a.tt-block.tt-full-width.tt-interactable.tt-interactable--alpha.tt-interactable--hover-enabled.tt-interactive',
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
                                        f('div.persistent-notification__area.tt-flex.tt-flex-nowrap.tt-pd-b-1.tt-pd-l-1.tt-pd-r-3.tt-pd-t-1', {},
                                            // Avatar
                                            f('div', {},
                                                f('div.tt-border-radius-rounded.tt-card-img.tt-card-img--size-4.tt-flex-shrink-0.tt-overflow-hidden', {},
                                                    f('div.tt-aspect.tt-aspect--align-top', {},
                                                        f('img.tt-balloon-avatar.tt-image', { src })
                                                    )
                                                )
                                            ),
                                            // Message body
                                            f('div.tt-flex.tt-flex-column.tt-flex-nowrap.tt-mg-x-1', {},
                                                f('div.persistent-notification__body.tt-overflow-hidden',
                                                    {
                                                        'data-test-selector': 'persistent-notification__body'
                                                    },
                                                    f('span.tt-c-text-alt', {},
                                                        f('p.tt-balloon-message', { innerHTML: message })
                                                    )
                                                ),
                                                // Subheader
                                                f('div.tt-align-items-center.tt-flex.tt-flex-shrink-0.tt-mg-t-05', {},
                                                    f('div.tt-mg-l-05', {},
                                                        f('span.tt-balloon-subheader.tt-c-text-alt', { innerHTML: subheader })
                                                    )
                                                )
                                            )
                                        )
                                    ),
                                    f('div.persistent-notification__delete.tt-absolute.tt-pd-l-1.tt-pd-r-05.tt-pd-t-1', {},
                                        f('div.tt-align-items-start.tt-flex.tt-flex-nowrap', {},
                                            f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative',
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
                                                f('span.tt-button-icon__icon', {},
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

            this.body.append(container);

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
        // fineTuning:object = { left:number=pixels, top:number=pixels, from:string := "up"|"right"|"down"|"left", lean:string := "center"|"right"|"left" }
    // Tooltip.get(parent:Element) -> Element~Tooltip
class Tooltip {
    static #TOOLTIPS = new Map()

    constructor(parent, text = '', fineTuning = {}) {
        let existing = Tooltip.#TOOLTIPS.get(parent);

        fineTuning.top |= 0;
        fineTuning.left |= 0;

        fineTuning.from ??= '';

        parent.setAttribute('fine-tuning', JSON.stringify(fineTuning));

        if(defined(existing))
            return existing;

        let tooltip = furnish(`div.tt-tooltip.tt-tooltip--align-${ fineTuning.lean || 'center' }.tt-tooltip--${ fineTuning.from || 'down' }`, { role: 'tooltip', innerHTML: text }),
            uuid = UUID.from(text).value;

        tooltip.id = uuid;

        parent.addEventListener('mouseenter', event => {
            let { currentTarget } = event,
                offset = getOffset(currentTarget),
                screen = getOffset(document.body),
                fineTuning = JSON.parse(currentTarget.getAttribute('fine-tuning'));

            let from = fineTuning.from.replace(/^[^]+--(up|down|left|right)$/i, '$1').toLowerCase();

            $('div#root > *').append(
                furnish('div.tt-tooltip-layer.tooltip-layer',
                    {
                        style: (() => {
                            switch(from) {
                                // case 'up':
                                //     return `transform: translate(${ offset.left + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 9000;`;

                                case 'down':
                                    return `transform: translate(${ offset.left + fineTuning.left }px, ${ (offset.bottom - screen.height - offset.height) + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 9000;`;

                                // case 'left':
                                //     return `transform: translate(${ offset.left + offset.width + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 9000;`;
                                //
                                // case 'right':
                                //     return `transform: translate(${ (offset.right - screen.width - offset.width) + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 9000;`;

                                default:
                                    return `transform: translate(${ offset.left + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 9000;`;
                            }
                        })()
                    },
                    furnish('div.tt-inline-flex.tt-relative.tt-tooltip-wrapper', { 'aria-describedby': tooltip.id, 'show': true },
                        furnish('div', { style: `width: ${ offset.width }px; height: ${ offset.height }px;` }),
                        tooltip
                    )
                )
            );

            tooltip.setAttribute('style', (fineTuning.style ?? ''));
        });

        parent.addEventListener('mouseleave', event => {
            $('div#root .tt-tooltip-layer.tooltip-layer')?.remove();

            tooltip?.closest('[show]')?.setAttribute('show', false);
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

        let parent = $('[data-a-target="chat-scroller"i]'),
            footer =
            f('div#tt-chat-footer.tt-absolute.tt-border-radius-medium.tt-bottom-0.tt-c-text-overlay.tt-mg-b-1',
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

                f('button.tt-align-items-center tt-align-middle tt-border-bottom-left-radius-medium tt-border-bottom-right-radius-medium tt-border-top-left-radius-medium tt-border-top-right-radius-medium tt-core-button tt-core-button--overlay tt-core-button--text tt-inline-flex tt-interactive tt-justify-content-center tt-overflow-hidden tt-relative', { style: 'padding: 0.5rem 1rem;', ...options },
                    f('div.tt-align-items-center.tt-core-button-label.tt-flex.tt-flex-grow-0', {},
                        f('div.tt-flex-grow-0', {
                            innerHTML: title
                        })
                    )
                )
            );

        parent.append(footer);

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

    constructor({ title = "", subtitle = "", footer, icon, fineTuning = {} }) {
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

        let container = $('[data-a-target*="card"i] [class*="card-layer"i]'),
            card = f(`div.tt-absolute.tt-border-radius-large.viewer-card-layer__draggable[data-a-target="viewer-card-positioner"]`, { style: styling }),
            uuid = UUID.from([title, subtitle].join('\n')).value;

        icon ??= { src: Extension.getURL('profile.png'), alt: 'Profile' };

        card.id = uuid;

        // Remove current cards. Only one allowed at a time
        [...container.children].forEach(child => child.remove());

        // Furnish the card
        let iconElement = f('img.emote-card__big-emote.tt-image[data-test-selector="big-emote"]', { ...icon });

        card.append(
            f('div.emote-card.tt-border-b.tt-border-l.tt-border-r.tt-border-radius-large.tt-border-t.tt-elevation-1 [data-a-target="emote-card"]', {},
                f('div.emote-card__banner.tt-align-center.tt-align-items-center.tt-c-background-alt.tt-flex.tt-flex-grow-2.tt-flex-row.tt-full-width.tt-justify-content-start.tt-pd-l-1.tt-pd-y-1.tt-relative', {},
                    f('div.tt-inline-flex.viewer-card-drag-cancel', {},
                        f('div.tt-inline.tt-relative.tt-tooltip__container[data-a-target="emote-name"]', {},
                            iconElement
                        )
                    ),
                    f('div.emote-card__display-name.tt-align-items-center.tt-align-left.tt-ellipsis.tt-mg-1', {},
                        f('h4.tt-c-text-base.tt-ellipsis.tt-strong[data-test-selector="emote-code-header"]', {}, title),
                        f('p.tt-c-text-alt-2.tt-ellipsis.tt-font-size-6[data-test-selector="emote-type-copy"]', {}, subtitle)
                    )
                )
            ),
            f('div.tt-absolute.tt-mg-r-05.tt-mg-t-05.tt-right-0.tt-top-0[data-a-target="viewer-card-close-button"]',
                {
                    onmouseup: event => {
                        $('[data-a-target*="card"i] [class*="card-layer"] > *', true).forEach(node => node.remove());
                    },
                },
                f('div.tt-inline-flex.viewer-card-drag-cancel', {},
                    f('button.tt-button-icon.tt-button-icon--secondary.tt-core-button[aria-label="Hide"][data-test-selector="close-viewer-card"]', {},
                        f('span.tt-button-icon__icon', {},
                            f('div[style="width: 2rem; height: 2rem;"]', {},
                                f('div.tt-icon', {},
                                    f('div.tt-aspect', { innerHTML: Glyphs.modify('x', { height: '20px', width: '20px' }).toString() })
                                )
                            )
                        )
                    ),
                )
            )
        );

        // Add the card
        container.append(card);

        // Add the optional footer
        if(footer?.href?.length)
            $('div', false, card).append(
                f('div.emote-card__content.tt-c-background-base.tt-full-width.tt-inline-flex.tt-pd-1.viewer-card-drag-cancel', {},
                    f('div', {},
                        f('div.tt-align-items-center.tt-align-self-start.tt-mg-b-05', {},
                            f('div.tt-align-items-center.tt-flex', {},
                                f('div.tt-align-items-center.tt-flex.tt-mg-r-1', {},
                                    f('a.tt-link [rel="noopener noreferrer" target="_blank"]', { href: footer.href },
                                        f('div.tt-flex', {
                                            innerHTML: `${
                                                Glyphs.modify('video', { height: '20px', width: '20px' })
                                            }${
                                                f('div.tt-mg-l-05', {},
                                                    f('p.tt-c-text-link.tt-font-size-5.tt-strong', {}, footer.name)
                                                ).outerHTML
                                            }`
                                        })
                                    )
                                ),
                                f('div.tt-align-items-center.tt-flex', {},
                                    f(`div[tt-live-status-indicator="${ parseBool(footer.live) }"]`),
                                    f('div.tt-flex.tt-mg-l-05', {},
                                        f('p.tt-c-text-base.tt-font-size-6', { style: 'text-transform:uppercase' },
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
        this.icon.tooltip = new Tooltip(iconElement, icon.alt);
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
    // new Search([ID:string|number[, type:string]]) -> Promise~Object
/** Returns a promised Object ->
 * { data:object, extensions:object }
 */
class Search {
    static cookies = {
        ...((cookies = []) => {
            let object = ({});
            for(let cookie of cookies) {
                let [name, value] = cookie.split('=', 2);

                object[name] = value;
            }

            return object;
        })(document?.cookie?.split(/;\s*/))
    };

    static authorization = (
        defined(Search.cookies['auth-token'])?
            `OAuth ${ Search.cookies['auth-token'] }`:
        void null
    );

    constructor(ID = null, type = 'channel', as = null) {
        let spadeEndpoint = `https://spade.twitch.tv/track`,
            twilightBuildID = '5fc26188-666b-4bf4-bdeb-19bd4a9e13a4';

        let pathname = top.location.pathname.substr(1),
            options = ({
                method: 'POST',
                headers: {
                    "Accept-Language":  'en-US',
                    "Accept":           '*/*',
                    "Authorization":    Search.authorization,
                    "Client-ID":        'kimne78kx3ncx6brgo4mv6wki5h1ko',
                    "Content-Type":     `text/plain; charset=UTF-8`,
                    "Device-ID":        Search.cookies.unique_id,
                }
            }),
            player = ({
                type: 'site',
                routes: {
                    exact: ['activate', 'bits', 'bits-checkout', 'directory', 'following', 'popout', 'prime', 'store', 'subs'],
                    start: ['bits-checkout/', 'checkout/', 'collections/', 'communities/', 'dashboard/', 'directory/', 'event/', 'prime/', 'products/', 'settings/', 'store/', 'subs/'],
                },
            });

        let vodID = null, channelName = null;
        if(!defined(ID) && /^auto(?:matic)?$/i.test(type)) {
            if(true
                && !player.routes.exact.contains(pathname)
                && !player.routes.start.filter(route => pathname.startsWith(route)).length
                && (
                    // Is a VOD
                    pathname.startsWith('videos/')?
                        (
                            vodID = pathname
                                .replace('videos/', '')
                                .replace(/\//g, '')
                                .replace(/^v/, '')
                        ):
                    // Is a channel
                    (
                        channelName = pathname.replace(/\//g, '')
                    )
                )
            )
                /* All good */;
            else
                throw `Unable to parse Search data`;

            if(vodID?.length) {
                ID = vodID;
                type = 'vod';
            } else if(channelName?.length) {
                ID = channelName;
                type = 'channel';
            }
        }

        if(type == 'vod')
            vodID = ID;

        if(type == 'channel')
            channelName = ID;

        let template;
        switch(Search.parseType = as) {
            case 'query': {
                let query = ('query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!) { streamPlaybackAccessToken(channelName: $login, params: { platform: "web", playerBackend: "mediaplayer", playerType: $playerType }) @include(if: $isLive) { value signature __typename } videoPlaybackAccessToken(id: $vodID, params: { platform: "web", playerBackend: "mediaplayer", playerType: $playerType }) @include(if: $isVod) { value signature __typename }}');

                template = ({ operationName: 'PlaybackAccessToken_Template', query });
            } break;

            case 'chat.info': {
                let variables = { login: channelName },
                    extensions = { persistedQuery: "SHA-256", version: 1 };

                template = ({ operationName: 'StreamChat', variables, extensions });
            };

            case 'chat.user': {
                let variables = {},
                    extensions = { persistedQuery: "SHA-256", version: 1 };

                template = ({ operationName: 'Chat_UserData', variables, extensions });
            } break;

            case 'video.ad': {
                let variables = { login: channelName, ownsCollectionID: null, ownsVideoID: vodID },
                    extensions = { persistedQuery: "SHA-256", version: 1 };

                template = ({ operationName: 'VideoAdBanner', variables, extensions });
            } break;

            case 'video.info': {
                let variables = { id: STREAMER.sole },
                    extensions = { persistedQuery: "SHA-256", version: 1 };

                template = ({ operationName: 'WithIsStreamLiveQuery', variables, extensions });
            } break;

            case '.legacy': {
                // https://api.twitch.tv/kraken/channels/39367256
                //     broadcaster_language: "en"
                //     broadcaster_software: "unknown_rtmp"
                //     broadcaster_type: "partner"
                //     created_at: "2013-01-15T20:07:57Z"
                //     description: "I stream a lot of Dead by Daylight but I also like occasionally playing a variety of games. My gaming/content creator roots started in Runescape (making RSMVs ~2007) and since then I’ve branched out to so much more! My stream is about community so be sure to talk in chat and introduce yourself!"
                //     display_name: "AimzAtchu"
                //     followers: 157824
                //     game: "Dead by Daylight"
                //     language: "en"
                //     logo: "https://static-cdn.jtvnw.net/jtv_user_pictures/6a3138ef-333d-4932-b891-1b5a88accc0f-profile_image-300x300.jpg"
                //     mature: false
                //     name: "aimzatchu"
                //     partner: true
                //     privacy_options_enabled: false
                //     private_video: false
                //     profile_banner: "https://static-cdn.jtvnw.net/jtv_user_pictures/3887c3fa-9ed8-4465-b873-03c78dbec505-profile_banner-480.png"
                //     profile_banner_background_color: "#030303"
                //     status: "🎃Happy !PTB Day!👻Are Boons OP? Let's Find Out!  #DeadbyDaylightPartner"
                //     updated_at: "2021-09-29T01:39:51Z"
                //     url: "https://www.twitch.tv/aimzatchu"
                //     video_banner: "https://static-cdn.jtvnw.net/jtv_user_pictures/aimzatchu-channel_offline_image-c8fb4fef334d2afa-1920x1080.png"
                //     views: 5919706
                //     _id: "39367256"
            } break;

            default: {
                let languages = `bg cs da de el en es es-mx fi fr hu it ja ko nl no pl pt pt-br ro ru sk sv th tr vi zh-cn zh-tw x-default`.split(' ');
                let name = channelName;

                if(!defined(name) || type != 'channel')
                    break;

                return (async({ name, languages }) =>
                    await fetch(`./${ name }`, { mode: 'cors' })
                        .then(response => response.text())
                        .then(html => {
                            let parser = new DOMParser;

                            return parser.parseFromString(html, 'text/html');
                        })
                        .then(async doc => {
                            let alt_languages = $('link[rel^="alt"i][hreflang]', true, doc).map(link => link.hreflang),
                                [data] = JSON.parse($('script[type^="application"i][type$="json"i]', false, doc)?.textContent || "[]");

                            let display_name = await awaitOn(() => $('meta[name$="title"i]', false, doc)?.content?.split(/\s/, 1)?.pop()),
                                [language] = languages.filter(lang => !alt_languages.contains(lang)),
                                name = display_name?.toLowerCase(),
                                profile_image = $('meta[property$="image"i]', false, doc)?.content,
                                live = parseBool(data?.publication?.isLiveBroadcast),
                                started_at = new Date(data?.publication?.startDate).toJSON(),
                                status = (data?.description ?? $('meta[name$="description"i]', false, doc)?.content),
                                updated_at = new Date(data?.publication?.endDate).toJSON();

                            Search.parseType = 'pure';

                            let json = { display_name, language, live, name, profile_image, started_at, status, updated_at };

                            return ({
                                async arrayBuffer() {
                                    return new Blob([JSON.stringify(json, null, 0)], { type: 'application/json' }).arrayBuffer();
                                },

                                async blob() {
                                    return new Blob([JSON.stringify(json, null, 4)], { type: 'application/json' });
                                },

                                async json() {
                                    return json;
                                },

                                async text() {
                                    JSON.stringify(json);
                                },

                                async formData() {
                                    let form = new FormData;
                                    for(let key in json)
                                        form.set(key, json[key]);
                                    return form;
                                },
                            });
                        })
                )({ name, languages });
            } break;
        }

        let body, results;
        switch(type) {
            case 'vod': {
                body = JSON.stringify({
                    ...template,
                    variables: {
                        isLive: !1,
                        login: '',
                        isVod: !0,
                        vodID: ID,
                        playerType: player.type,
                    }
                });

                results = {
                    contentType: 'vod',
                    id: ID,
                    playerType: player.type,
                    request: Search.retrieve({ ...options, body }),
                };
            } break;

            case 'channel': {
                body = JSON.stringify({
                    ...template,
                    variables: {
                        isLive: !0,
                        login: ID,
                        isVod: !1,
                        vodID: '',
                        playerType: player.type,
                    }
                });

                results = {
                    contentType: 'live',
                    id: ID,
                    playerType: player.type,
                    request: Search.retrieve({ ...options, body }),
                };
            } break;

            default: throw `Unable to search for item of type "${ type }"`;
        }

        let blob = new Blob([
            `data=${
                encodeURIComponent(
                    btoa(
                        JSON.stringify({
                            event: 'benchmark_template_loaded',
                            properties: {
                                app_version: twilightBuildID,
                                benchmark_server_id: Search.cookies.server_session_id,
                                client_time: (Date.now() / 1e3),
                                device_id: Search.cookies.unique_id,
                                duration: Math.round(performance.now()),
                                url: `${ location.protocol }//${ [location.hostname, location.pathname, location.search].join('') }`,
                            }
                        })
                    )
                )
            }`
        ], {
            type: `application/x-www-form-urlencoded; charset=UTF-8`
        });

        let request = new XMLHttpRequest;

        request.open('POST', spadeEndpoint);
        request.send(blob);

        return results.request;
    }

    static retrieve(query) {
        if(typeof fetch == 'function')
            return fetch('https://gql.twitch.tv/gql', query);

        return new Promise((onSuccess, onError) => {
            let request = new XMLHttpRequest;

            request.open('POST', `https://gql.twitch.tv/gql`);

            Object.keys(query.headers).map(key => {
                try {
                    request.setRequestHeader(key, query.headers[key]);
                } catch(error) {
                    WARN(error);
                }
            });

            request.withCredentials = 'include' == query.credentials;
            request.onerror = onError;
            request.onload = () => onSuccess({
                status: request.status,
                statusText: request.statusText,
                body: request.response || request.responseText,
                ok: request.status >= 200 && request.status < 300,
                json: () => new Promise((onSuccess, onError) => {
                    try {
                        onSuccess(JSON.parse(query.body));
                    } catch(query) {
                        onError(query);
                    }
                })
            });

            request.send(query.body);
        });
    }

    static async convertResults(response) {
        let json = await response.json(),
            data = {};

        let ConversionKey = {
            banStatus:          'veto',
            channel:            'name',
            channel_id:         'sole',
            createdAt:          'date',
            displayName:        'name',
            hosting:            'host',
            id:                 'sole',
            isMature:           'nsfw',
            login:              'name',
            mature:             'nsfw',
            partner:            'ally',
            profileImageURL:    'icon',
            role:               'role',
            subscriber:         'paid',
            turbo:              'fast',

            display_name:       'name',
            live:               'live',
            profile_image:      'icon',
        },
            deeper = [];

        switch(Search.parseType) {
            case 'advanced': {
                // TODO: parse advanced results...
            } break;

            case 'pure': {
                /* Do nothing... */
            } break;

            case 'chat.info': {
                try {
                    json = JSON.parse(json?.data?.channel ?? 'null');
                    deeper = ['self'];
                } catch(error) {
                    throw `Unable to parse results: ${ error }`;
                }
            } break;

            case 'chat.user': {
                try {
                    json = JSON.parse(json?.data?.user ?? 'null');
                } catch(error) {
                    throw `Unable to parse results: ${ error }`;
                }
            } break;

            case 'video.ad': {
                try {
                    json = JSON.parse(json?.data?.userByAttribute ?? 'null');
                } catch(error) {
                    throw `Unable to parse results: ${ error }`;
                }
            } break;

            case 'video.info': {
                try {
                    json = JSON.parse(json?.data?.user?.stream ?? 'null');
                } catch(error) {
                    throw `Unable to parse results: ${ error }`;
                }
            } break;

            default: {
                try {
                    json = JSON.parse(json?.data?.streamPlaybackAccessToken?.value ?? 'null');
                } catch(error) {
                    throw `Unable to parse results: ${ error }`;
                }
            } break;
        }

        let deeperLevels = {};
        for(let key in json) {
            let to = ConversionKey[key];

            if(to?.length)
                data[to] = json[key];
            if(deeper.contains(to))
                deeperLevels[to] = json[key];
        }

        for(let key in deeperLevels) {
            let to = ConversionKey[key];

            if(to?.length)
                data[to] = deeperLevels[key];
        }

        return new Promise(resolve => resolve(data));
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

// Create an array of the current chat
    // GetChat([lines:number[, keepEmotes:boolean]]) -> [...Object { style, author, emotes, message, mentions, element, uuid, highlighted }]
function GetChat(lines = 250, keepEmotes = false) {
    let chat = $('[data-test-selector$="message-container"i] [data-a-target="chat-line-message"i]', true).slice(-lines),
        emotes = {},
        results = [];

    for(let line of chat) {
        let handle = $('.chat-line__username', true, line).map(element => element.innerText).toString()
            author = handle.toLowerCase().replace(/[^]+?\((\w+)\)/, '$1'),
            message = $('[data-test-selector="chat-message-separator"i] ~ * > *', true, line),
            mentions = $('.mention-fragment', true, line).map(element => element.innerText.replace('@', '').toLowerCase()).filter(text => /^[a-z_]\w+$/i.test(text)),
            badges = $('.chat-badge', true, line).map(img => img.alt.toLowerCase()),
            style = $('.chat-line__username [style]', true, line).map(element => element.getAttribute('style')).join(';'),
            reply = $('button[data-test-selector="chat-reply-button"i]', false, line);

        let raw = line.innerText?.trim(),
            containedEmotes = [];

        message = message
            .map(element => {
                let string;

                if(keepEmotes && ((element.dataset.testSelector == 'emote-button') || element.dataset.ttEmote?.length)) {
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

    let bullets = $('[role="log"i] .tt-accent-region, [role="log"i] [data-test-selector="user-notice-line"i], [role="log"i] [class*="gift"i]', true).slice(-lines);

    results.bullets = [];

    for(let bullet of bullets) {
        let message = $('*', true, bullet),
            mentions = $('.chatter-name, strong', true, bullet).map(element => element.innerText.toLowerCase()).filter(text => /^[a-z_]\w+$/i.test(text)),
            subject = (text =>
                /\braid/i.test(text)?                'raid': // Incoming raid
                /\bredeem/i.test(text)?              'coin': // Redeeming (spending) channel points
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
                    case 'emote-button': {
                        if(keepEmotes)
                            string = `:${ (i=>((emotes[i.alt]=i.src),i.alt))($('img', false, element)) }:`;
                    } break;

                    default: {
                        string = element.innerText;
                    } break;
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
    defer: {
        value: {
            set onnewmessage(callback) {
                let name = callback.name || UUID.from(callback.toString()).value;

                if(GetChat.__deferredEvents__.__onnewmessage__.has(name))
                    return GetChat.__deferredEvents__.__onnewmessage__.get(name);

                // REMARK('Adding deferred [on new message] event listener', { [name]: callback });

                GetChat.__deferredEvents__.__onnewmessage__.set(name, callback);

                return callback;
            },

            get onnewmessage() {
                return GetChat.__deferredEvents__.__onnewmessage__.size;
            },

            set onwhisper(callback) {
                let name = callback.name || UUID.from(callback.toString()).value;

                if(GetChat.__deferredEvents__.__onwhisper__.has(name))
                    return GetChat.__onwhisper__.get(name);

                // REMARK('Adding deferred [on new whisper] event listener', { [name]: callback });

                return GetChat.__deferredEvents__.__onwhisper__.set(name, callback);
            },

            get onwhisper() {
                return GetChat.__deferredEvents__.__onwhisper__.size;
            },
        },
    },
    __deferredEvents__: { value: { __onnewmessage__: new Map(), __onwhisper__: new Map() } },

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

// Convert an SI number into a number
    // parseCoin(amount:string) -> Number
function parseCoin(amount = '') {
    let points = 0,
        COIN, UNIT;

    amount = (amount + "").replace(/([\d\.,]+)\s*([^\d\.]+)?/i, ($0, $1, $2 = '_', $$, $_) => {
        COIN = $1.replace(/,+/g, '');
        UNIT = ($2 ?? '').toUpperCase();
    });

    function getUnits(lang) {
        let booklet;

        switch(lang?.toLowerCase()) {
            case 'bg': { booklet = '_ ХИЛ МИЛ' } break;

            case 'cs':
            case 'sk': { booklet = '_ TIS' } break;

            case 'fi':
            case 'da': { booklet = '_ T M' } break;

            case 'el': { booklet = '_ ΧΙΛ ΕΚΑ' } break;

            case 'hu': { booklet = '_ E' } break;

            case 'ja': { booklet = '_ 千 百万' } break;

            case 'ko': { booklet = '_ 천 백만' } break;

            case 'pl': { booklet = '_ TYS MIL' } break;

            case 'pt': { booklet = '_ MIL' } break;

            case 'ru': { booklet = '_ ТЫС МИЛ' } break;

            case 'sv': { booklet = '_ TN' } break;

            case 'tr': { booklet = '_ B' } break;

            case 'vi': { booklet = '_ N M' } break;

            case 'zh-cn': { booklet = '_ 千 百万' } break;

            case 'zh-tw': { booklet = '_ 千 百萬' } break;

            case 'en':
            default: {
                booklet = '_ K M B T';
            } break;
        }

        return booklet.split(/\s+/);
    };

    for(let index = 0, units = getUnits(LITERATURE); index < units.length; index++)
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

    let textOf = text => (text?.textContent ?? text?.value ?? text);

    let current = qualities.find(({ input }) => input.checked);

    if(!defined(current)) {
        let { videoHeight = 0 } = $('[data-a-target="video-player"i] video') ?? ({});

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
    // SetQuality([quality:string[, backup:string]]) -> Object#{ oldValue:Object={ input:Element, label:Element }, newValue:Object={ input:Element, label:Element } }
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
        desired = qualities.find(({ label }) => textOf(label).contains(quality.toLowerCase())) ?? null;

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

    return new Promise((resolve, reject) => {
        let checker = setInterval(() => {
            isAdvert = defined($('[data-a-target*="ad-countdown"i]')),
            video = $('video', true)[+isAdvert],
            computed = (video?.videoHeight | 0) + 'p';

            if(desired !== computed) {
                clearInterval(checker);

                resolve({ oldValue: current, newValue: desired ?? computed });
            }
        }, 100);
    });
}

// Get the video volume
    // GetVolume([fromVideoElement:boolean]) -> Number#Float
function GetVolume(fromVideoElement = true) {
    let video = $('[data-a-target="video-player"i] video'),
        slider = $('[data-a-target*="player"i][data-a-target*="volume"i]');

    return parseFloat(fromVideoElement? video.volume: slider.value);
}

Object.defineProperties(GetVolume, {
    onchange: {
        set(callback) {
            let name = callback.name || UUID.from(callback.toString()).value;

            if(GetVolume.__onchange__.has(name))
                return GetVolume.__onchange__.get(name);

            // REMARK('Adding [on change] event listener', { [name]: callback });

            return GetVolume.__onchange__.set(name, callback);
        },

        get() {
            return GetVolume.__onchange__.size;
        },
    },
    __onchange__: { value: new Map() },
});

// Change the video volume
    // SetVolume([volume:number#Float]) -> undefined
function SetVolume(volume = 0.5) {
    let video = $('[data-a-target="video-player"i] video'),
        thumb = $('[data-a-target*="player"i][data-a-target*="volume"i]'),
        slider = $('[data-a-target^="player-volume"i] + * [style]');

    if(defined(video))
        video.volume = parseFloat(volume);

    if(defined(thumb))
        thumb.value = parseFloat(volume);

    if(defined(slider))
        slider.setAttribute('style', `width: ${ 100 * parseFloat(volume) }%`);
}

// Get the view mode
    // GetViewMode() -> string={ "fullscreen" | "fullwidth" | "theatre" | "default" }
function GetViewMode() {
    let mode = 'default',
        theatre = false,
        fullwidth = false;

    if(theatre
        ||= /theatre/i.test([...$(`[data-test-selector*="video-container"i]`).classList].join(' '))
    )
        mode = 'theatre';

    if(fullwidth
        ||= defined($(`[data-a-target*="right-column"i][data-a-target*="chat-bar"i][data-a-target*="collapsed"i] button[data-a-target*="collapse"i]`))
    )
        mode = 'fullwidth';

    let container = $(`button[data-a-target*="fullscreen"i]`)?.closest('div');

    if(!defined(container))
        return mode;

    let classes = ['', ...container.classList].join('.');

    if(false
        || (true
                && theatre
                && fullwidth
            )
        || $(classes, true, container.parentElement).length <= 3
    )
        mode = 'fullscreen';

    return mode;
}

// Change the view mode
    // SetViewMode(mode:string={ "fullscreen" | "fullwidth" | "theatre" | "default" }) -> undefined
function SetViewMode(mode = 'default') {
    let buttons = [],
        toggles = {
            theatre: {
                off: `[data-test-selector*="video-container"i]:not([class*="theatre"i]) button[data-a-target*="theatre-mode"i]`,
                on: `[data-test-selector*="video-container"i][class*="theatre"i] button[data-a-target*="theatre-mode"i]`,
            },
            chat: {
                off: `[data-a-target*="right-column"i][data-a-target*="chat-bar"i]:not([data-a-target*="collapsed"i]) button[data-a-target*="collapse"i]`,
                on: `[data-a-target*="right-column"i][data-a-target*="chat-bar"i][data-a-target*="collapsed"i] button[data-a-target*="collapse"i]`,
            },
        };

    switch(mode) {
        case 'fullscreen': {
            buttons.push(toggles.theatre.off, toggles.chat.off);
        } break;

        case 'fullwidth': {
            buttons.push(toggles.theatre.on, toggles.chat.off);
        } break;

        case 'theatre': {
            buttons.push(toggles.theatre.off, toggles.chat.on);
        } break;

        case 'default': {
            buttons.push(toggles.theatre.on, toggles.chat.on);
        } break;
    }

    for(let button of buttons)
        $(button)?.click?.();
}

// Get the current user activity
    // GetActivity() -> Promise <String | null>
async function GetActivity() {
    return awaitOn(() => {
        let open = defined($('[data-a-target="user-display-name"i], [class*="dropdown-menu-header"i]'));

        if(open) {
            ACTIVITY = top.ACTIVITY = $('[data-a-target="presence-text"i]')?.innerText;
        } else {
            UserMenuToggleButton?.click();
            ACTIVITY = top.ACTIVITY = $('[data-a-target="presence-text"i]')?.innerText;
            UserMenuToggleButton?.click();
        }

        return ACTIVITY;
    });
}

// Get the current page's language
    // GetLanguage() -> Promise <String | null>
async function GetLanguage() {
    return awaitOn(() => {
        let open = defined($('[data-a-target="user-display-name"i], [class*="dropdown-menu-header"i]'));

        if(open) {
            LITERATURE = top.LITERATURE = $('[data-language] svg')?.closest('button')?.dataset?.language;
        } else {
            UserMenuToggleButton?.click();
            $('[data-a-target^="language"i]')?.click();
            LITERATURE = top.LITERATURE = $('[data-language] svg')?.closest('button')?.dataset?.language;
            UserMenuToggleButton?.click();
        }

        return LITERATURE;
    });
}

// Import the glyphs
let { Glyphs } = top;

// Returns ordinal numbers
    // nth(n:number) -> string
let nth = n => {
    n += '';

    switch(top.LANGUAGE) {
        case 'de': {
            // 1. 2. 3. 4. ... 11. 12. 13. ... 21. 22. 23.

            n = n
                .replace(/(\d)$/, '$1.')
            + ' Reihe';
        } break;

        case 'es': {
            // 1° 2° 3° 4° ... 11° 12° 13° ... 21° 22° 23°

            n = n
                .replace(/(\d)$/, '$1°')
            + ' en línea';
        } break;

        case 'pt': {
            // 1° 2° 3° 4° ... 11° 12° 13° ... 21° 22° 23°

            n = n
                .replace(/(\d)$/, '$1°')
            + ' na linha';
        } break;

        case 'ru': {
            // 1-й 2-й 3-й 4-й ... 11-й 12-й 13-й ... 21-й 22-й 23-й

            n = n
                .replace(/(\d)$/, '$1-й')
            + ' в строке';
        } break;

        case 'en':
        default: {
            // 1st 2nd 3rd 4th ... 11th 12th 13th ... 21st 22nd 23rd

            n = n
                .replace(/(0|1[123]|[4-9])$/, '$1th')
                .replace(/1$/, '1st')
                .replace(/2$/, '2nd')
                .replace(/3$/, '3rd')
            + ' in line';
        } break;
    }

    return n;
}

// Returns a unique list of channels (used with `Array..filter`)
    // uniqueChannels(channel:object#Channel, index:number, channels:array) -> boolean
let uniqueChannels = (channel, index, channels) =>
    channels.filter(channel => defined(channel?.name)).findIndex(ch => ch.name === channel?.name) == index;

// Returns whether or not a channel is live (used with `Array..filter`)
    // isLive(channel:object#Channel) -> boolean
let isLive = channel => channel?.live;

/*** Setup (pre-init) #MARK:globals #MARK:variables
 *       _____      _                  __                      _       _ _ __
 *      / ____|    | |                / /                     (_)     (_) |\ \
 *     | (___   ___| |_ _   _ _ __   | | _ __  _ __ ___        _ _ __  _| |_| |
 *      \___ \ / _ \ __| | | | '_ \  | || '_ \| '__/ _ \______| | '_ \| | __| |
 *      ____) |  __/ |_| |_| | |_) | | || |_) | | |  __/______| | | | | | |_| |
 *     |_____/ \___|\__|\__,_| .__/  | || .__/|_|  \___|      |_|_| |_|_|\__| |
 *                           | |      \_\ |                                /_/
 *                           |_|        |_|
 */

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
    SEARCH_CACHE = new Map(),
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

    purging:
    for(let key in StorageSpace) {
        if(!/^ext\.twitch-tools\/data\/(\w+)?/i.test(key))
            continue purging;

        let data = JSON.parse(StorageSpace[key]),
            { dataRetrievedAt } = data;

        // If there isn't a proper date, remove the data...
        if(+dataRetrievedAt < 0) {
            StorageSpace.removeItem(key);

            continue purging;
        }

        let lastFetch = Math.abs(dataRetrievedAt - +new Date);

        // If the last fetch was more than 30 days ago, remove the data...
        if(lastFetch > (30 * 24 * 60 * 60 * 1000)) {
            WARN(`\tThe last fetch for "${ key }" was ${ toTimeString(lastFetch) } ago. Marking as "expired"`);

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

            let name = key.replace(/(^|_)([a-z])/g, ($0, $1, $2, $$, $_) => ['',' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, ' -');

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
                    case 'away_mode_placement': {
                        RestartJob('away_mode', 'modify');
                    } break;

                    case 'filter_rules': {
                        RestartJob('filter_messages', 'modify');
                    } break;

                    case 'phrase_rules': {
                        RestartJob('highlight_phrases', 'modify');
                    } break;

                    case 'user_language_preference': {
                        top.LANGUAGE = LANGUAGE = newValue;
                    } break;

                    case 'watch_time_placement': {
                        RestartJob('watch_time_placement', 'modify');
                        RestartJob('points_receipt_placement', 'dependent');
                    } break;

                    case 'whisper_audio_sound': {
                        RestartJob('mention_audio', 'modify');
                        RestartJob('phrase_audio', 'modify');
                        RestartJob('whisper_audio', 'modify');
                    } break;

                    default: break;
                }
            }

            reload ||= !!~[...EXPERIMENTAL_FEATURES, ...SENSITIVE_FEATURES].findIndex(feature => feature.test(key));
            if(!!~[...REFRESHABLE_FEATURES].findIndex(feature => feature.test(key)))
                refresh.push(key);

            Settings[key] = newValue;
        }

        if(reload)
            return location.reload();

        for(let job of refresh) {
            RestartJob(job, 'modify');
            (top.REFRESH_ON_CHILD ??= []).push(job);
        }
    });

    // Add message listener
    // Jumping frames...
    top.addEventListener('message', event => {
        if(event.origin != top.location.origin)
            return /* Not meant for us... */;

        let R = RegExp;
        let { data } = event,
            BroadcastSettings = {},
            User = {},
            Stream = {},
            Channel = {};

        // Not  jump data
        if(!('ROOT_QUERY' in data)) {
            for(let target in data)
                PostOffice.set(target, data[target]);
        } else {
            for(let key in data) {
                if(/^BroadcastSettings:([^$]+)/.test(key))
                    BroadcastSettings[R.$1] = data[key];
                else if(/^Channel:([^$]+)/.test(key))
                    Channel = data[key];
                else if(/^User:([^$]+)/.test(key))
                    User[R.$1] = data[key];
                else if(/^Stream:([^$]+)/.test(key))
                    Stream[R.$1] = data[key];

                JUMPED_FRAMES = true;
            }

            if(Channel?.id?.length) {
                LIVE_CACHE?.set('coin', Channel.self?.communityPoints?.balance);
                LIVE_CACHE?.set('sole', Channel.id);

                if(JUMPED_FRAMES)
                    for(let channel in BroadcastSettings) {
                        let { id, title } = BroadcastSettings[channel],
                            { displayName, login, primaryColorHex } = User[channel];

                        let profileImageURL = (channel => {
                            for(let key in channel)
                                if(/^profileImageURL/i.test(key))
                                    return channel[key];
                        })(User[channel]);

                        let stream = (streams => {
                            for(let stream in streams)
                                if(streams[stream]?.broadcaster?.__ref?.contains?.(channel)) {
                                    stream = streams[stream];

                                    stream.broadcaster = BroadcastSettings[channel];

                                    let previews = {};
                                    for(let key in stream)
                                        if(/^previewImageURL\(([^]+)\)\s*$/i.test(key)) {
                                            let { height, width } = JSON.parse(R.$1);

                                            previews[`${ width }x${ height }`] = stream[key];

                                            delete stream[key];
                                        }

                                    stream.previewImageURL = previews;

                                    return stream;
                                }
                            return null;
                        })(Stream);

                        JUMP_DATA[login] = { id: parseFloat(id), title, displayName, login, primaryColorHex, profileImageURL, stream };
                    }

                // LOG('Jumped frames, retrieved:', JUMP_DATA);
            }
        }
    });
} catch(error) {
    // Most likely in a child frame...
    // REMARK("Moving to chat child frame...");
    WARN(error);
}

async function update() {
    // The location
    top.PATHNAME = PATHNAME = top.location.pathname;

    NORMALIZED_PATHNAME = PATHNAME
        // Remove common "modes"
        .replace(/^(moderator)\/(\/[^\/]+?)/i, '$1')
        .replace(/^(\/[^\/]+?)\/(about|schedule|squad|videos)\b/i, '$1');

    // The theme
    top.THEME = THEME = [...$('html').classList].find(c => /theme-(\w+)/i.test(c)).replace(/[^]*theme-(\w+)/i, '$1').toLowerCase();

    // All Channels under Search
    top.SEARCH = SEARCH = [
        ...SEARCH,
        // Current (followed) streamers
        ...$(`.search-tray a:not([href*="/search?"]):not([href$="${ PATHNAME }"i])`, true)
            .map(element => {
                let channel = {
                    from: 'SEARCH',
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

                        return live;
                    },
                    name: $('img', false, element)?.alt,
                };

                element.setAttribute('draggable', true);
                element.setAttribute('tt-streamer-data', JSON.stringify({ ...channel, chat: null, jump: null }));
                element.ondragstart ??= event => {
                    let { currentTarget } = event;

                    event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
                    event.dataTransfer.dropEffect = 'move';
                };

                SEARCH_CACHE.set(channel.name, { ...channel });

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
                    from: 'CHANNELS',
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

                        return live;
                    },
                    name: $('img', false, element)?.alt,
                };

                element.setAttribute('draggable', true);
                element.setAttribute('tt-streamer-data', JSON.stringify({ ...streamer, chat: null, jump: null }));
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
        ...$(`#sideNav .side-nav-section[aria-label][tt-section-label="followed"i] a:not([href$="${ PATHNAME }"i])`, true)
            .map(element => {
                let streamer = {
                    from: 'STREAMERS',
                    href: element.href,
                    icon: $('img', false, element)?.src,
                    get live() {
                        let { href } = element,
                            url = parseURL(href),
                            { pathname } = url;

                        let parent = $(`#sideNav .side-nav-section[aria-label][tt-section-label="followed"i] [href$="${ pathname }"]`);

                        if(!defined(parent))
                            return false;

                        let live = defined(parent)
                                && !defined($(`[class*="--offline"i]`, false, parent));

                        return live;
                    },
                    name: $('img', false, element)?.alt,
                };

                element.setAttribute('draggable', true);
                element.setAttribute('tt-streamer-data', JSON.stringify({ ...streamer, chat: null, jump: null }));
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
                    name: $('[class$="text"i]', false, element)?.innerText?.replace(/([^]+?) +(go(?:ing)?|is|went) +live\b([^$]+)/i, ($0, $1, $$, $_) => $1),
                };

                if(!defined(streamer.name))
                    return;

                element.setAttribute('draggable', true);
                element.setAttribute('tt-streamer-data', JSON.stringify({ ...streamer, chat: null, jump: null }));
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

let // Features that require the experimental flag
    EXPERIMENTAL_FEATURES = ['auto_focus', 'convert_emotes', 'soft_unban'].map(AsteriskFn),

    // Features that need the page reloaded when changed
    SENSITIVE_FEATURES = ['away_mode*~schedule', 'auto_accept_mature', 'fine_details', 'first_in_line*', 'prevent_#', 'soft_unban*', 'up_next*', 'view_mode'].map(AsteriskFn),

    // Features that need to be run on a "normal" page
    NORMALIZED_FEATURES = ['away_mode*~schedule', 'auto_follow*', 'first_in_line*', 'prevent_#', 'kill*'].map(AsteriskFn),

    // Features that need to be refreshed when changed
    REFRESHABLE_FEATURES = ['auto_focus*', 'bttv_emotes*', 'filter_messages', 'highlight_phrases', 'native_twitch_reply', '*placement'].map(AsteriskFn);

/*** Initialization #MARK:initializer
*      _____       _ _   _       _ _          _   _
*     |_   _|     (_) | (_)     | (_)        | | (_)
*       | |  _ __  _| |_ _  __ _| |_ ______ _| |_ _  ___  _ __
*       | | | '_ \| | __| |/ _` | | |_  / _` | __| |/ _ \| '_ \
*      _| |_| | | | | |_| | (_| | | |/ / (_| | |_| | (_) | | | |
*     |_____|_| |_|_|\__|_|\__,_|_|_/___\__,_|\__|_|\___/|_| |_|
*
*
*/
// A non-repeating token representing the current window
const PRIVATE_SYMBOL = Symbol(new UUID);

/** Streamer Array (Backup) - the current streamer/channel
 * call:string       - the streamer's login ID
 * date:string       - a date string representing the current stream's start time
 * game:number       - the current game/category
 * head:string       - the title of the stream
 * icon:string       - link to the channel's icon/image
 * lang:string       - the language of the broadcast
 * live:boolean      - is the channel currently live
 * name:string       - the channel's username
 * sole:number       - the channel's ID
 * tags:array        - tags of the current stream
 */
let LIVE_CACHE = new Map();

// Intializes the extension
    // Initialize(START_OVER:boolean) -> undefined
let Initialize = async(START_OVER = false) => {
    // Modify the logging feature via the settings
    if(!parseBool(Settings.display_in_console))
        LOG =
        WARN =
        ERROR =
        REMARK = ($=>$);

    if(!parseBool(Settings.display_in_console__log))
        LOG = ($=>$);

    if(!parseBool(Settings.display_in_console__warn))
        WARN = ($=>$);

    if(!parseBool(Settings.display_in_console__error))
        ERROR = ($=>$);

    if(!parseBool(Settings.display_in_console__remark))
        REMARK = ($=>$);

    // Time how long jobs take to complete properly
    let STOP_WATCHES = new Map,
        JUDGE__STOP_WATCH = (JobName, JobTime = Timers[JobName]) => {
            let { abs } = Math;

            let start = STOP_WATCHES.get(JobName),
                stop = +new Date,
                span = abs(start - stop),
                max = abs(JobTime) * 1.1;

            if(span > max)
                WARN(`"${ JobName.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['',' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, '- ') }" took ${ (span / 1000).suffix('s', 2).replace(/\.0+/, '') } to complete (max time allowed is ${ (max / 1000).suffix('s', 2).replace(/\.0+/, '') }). Offense time: ${ new Date }. Offending site: ${ top.location.pathname }`)
                    .toNativeStack();
        },
        START__STOP_WATCH = (JobName, JobCreationDate = +new Date) => (STOP_WATCHES.set(JobName, JobCreationDate), JobCreationDate);

    // Initialize all settings/features //

    let GLOBAL_TWITCH_API = (top.GLOBAL_TWITCH_API ??= {}),
        GLOBAL_EVENT_LISTENERS = (top.GLOBAL_EVENT_LISTENERS ??= {});

    SPECIAL_MODE = defined($('[data-test-selector="exit-button"i]'));
    NORMAL_MODE = !SPECIAL_MODE;

    NORMALIZED_PATHNAME = PATHNAME
        // Remove common "modes"
        .replace(/^(moderator)\/(\/[^\/]+?)/i, '$1')
        .replace(/^(\/[^\/]+?)\/(about|schedule|squad|videos)\b/i, '$1');

    if(SPECIAL_MODE) {
        let { $1, $2 } = RegExp,
            normalized = [];

        for(let key in Settings)
            if(!!~NORMALIZED_FEATURES.findIndex(regexp => regexp.test(key)))
                normalized.push(key);

        WARN(`Currently viewing ${ $1 } in "${ $2 }" mode. Several features will be disabled:`, normalized);
    }

    let ERRORS = Initialize.errors |= 0;
    if(START_OVER) {
        for(let job in Jobs)
            UnregisterJob(job, 'reinit');
        ERRORS = Initialize.errors++
    }

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
            mostLeft = 0,
            mostProgressNeeded = 0,
            furthestFromCompletion = null,
            leastWatched = null,
            leastPoints = +Infinity,
            leastLeft = +Infinity,
            leastProgressNeeded = 0,
            closestToCompletion = null;

        // Next channel in "Up Next"
        if(!parseBool(Settings.first_in_line_none) && ALL_FIRST_IN_LINE_JOBS?.length)
            return GetNextStreamer.cachedStreamer = ALL_CHANNELS.find(channel => channel.href.contains(parseURL(ALL_FIRST_IN_LINE_JOBS[0]).pathname));

        await LoadCache('ChannelPoints', ({ ChannelPoints = {} }) => {
            filtering:
            for(let channel in ChannelPoints) {
                let [streamer] = online.filter(({ name }) => name == channel);

                if(!defined(streamer))
                    continue filtering;

                let [amount, fiat, face, notEarned, pointsToEarnNext] = ChannelPoints[channel].split('|');

                amount = parseCoin(amount);
                notEarned = parseFloat(notEarned);
                pointsToEarnNext = parseFloat(pointsToEarnNext);

                wealth:
                // this channel has the most points
                if(amount > mostPoints) {
                    mostWatched = channel;
                    mostPoints = amount;
                }
                // this channel has the least points
                else if(amount < leastPoints) {
                    leastWatched = channel;
                    leastPoints = amount;
                }

                progress:
                // this channel is the furthest from having all rewards & challenges
                if(notEarned >= mostLeft) {
                    // Pick the channel that needs the most points to reach the closest goal
                    if(notEarned == mostLeft && pointsToEarnNext > mostProgressNeeded) {
                        furthestFromCompletion = channel;
                        mostProgressNeeded = pointsToEarnNext;

                        continue filtering;
                    }

                    furthestFromCompletion = channel;
                    mostLeft = notEarned;
                }
                // this channel is the closest to having all rewards & challenges; but not completed
                else if(notEarned <= leastLeft && notEarned > 0) {
                    // Pick the channel that needs the least points to reach the closest goal
                    if(notEarned == leastLeft && pointsToEarnNext < leastProgressNeeded) {
                        closestToCompletion = channel;
                        leastProgressNeeded = pointsToEarnNext;

                        continue filtering;
                    }

                    closestToCompletion = channel;
                    leastLeft = notEarned;
                }
            }
        });

        let next,
            { random, round } = Math;

        next_channel:
        switch(Settings.next_channel_preference) {
            // The most popular channel (most amount of current viewers)
            case 'popular': {
                next = online[0];
            } break;

            // The least popular channel (least amount of current viewers)
            case 'unpopular': {
                next = online[online.length - 1];
            } break;

            // Most watched channel (most channel points)
            case 'rich': {
                next = STREAMERS.find(channel => channel.name === mostWatched);
            } break;

            // Least watched channel (least channel points)
            case 'poor': {
                next = STREAMERS.find(channel => channel.name === leastWatched);
            } break;

            // Most un-earned Rewards & Challenges
            case 'furthest': {
                next = STREAMERS.find(channel => channel.name === furthestFromCompletion);
            } break;

            // Least un-earned Rewards & Challenges
            case 'closest': {
                next = STREAMERS.find(channel => channel.name === closestToCompletion);
            } break;

            // Do not use this feature
            case 'none': {
                return null;
            } break;

            // A random channel
            default: {
                next = online[round(random() * online.length)];
            } break;
        }

        let cache = online.sort(() => random() >= 0.5? +1: -1);

        cache = cache[round(random() * cache.length)];

        // There isn't a channel that fits the criteria
        if(parseBool(Settings.stay_live) && !defined(next) && !defined(GetNextStreamer?.cachedStreamer) && online?.length) {
            next ??= GetNextStreamer.cachedStreamer ??= cache;

            WARN(`No channel fits the "${ Settings.next_channel_preference }" criteria. Assuming a random channel is desired:`, next);
        } else if(parseBool(Settings.stay_live) && defined(next)) {
            GetNextStreamer.cachedStreamer = next;
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
                    from: 'SEARCH',
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

                        return live;
                    },
                    name: $('img', false, element)?.alt,
                };

                element.setAttribute('draggable', true);
                element.setAttribute('tt-streamer-data', JSON.stringify({ ...channel, chat: null, jump: null }));
                element.ondragstart ??= event => {
                    let { currentTarget } = event;

                    event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
                    event.dataTransfer.dropEffect = 'move';
                };

                SEARCH_CACHE.set(channel.name, { ...channel });

                return channel;
            }),
    ].filter(uniqueChannels);

    /** Streamer Array - the current streamer/channel
     * coin:number*      - GETTER: how many channel points (floored to the nearest 100) does the user have
     * chat:array*       - GETTER: an array of the current chat, sorted the same way messages appear. The last message is the last array entry
     * cult:number*      - GETTER: the estimated number of followers
     * done:boolean*     - GETTER: are all of the channel point rewards purchasable
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
     * plug:boolean*     - GETTER: is there an advertisement running
     * poll:number*      - GETTER: how many viewers are watching the channel
     * sole:number       - GETTER: the channel's ID
     * tags:array*       - GETTER: tags of the current stream
     * team:string*      - GETTER: the team the channel is affiliated with (if applicable)
     * time:number*      - GETTER: how long has the channel been live
     * unfollow:function - unfollows the current channel
     * veto:boolean      - GETTER: determines if the user is banned from the streamer's chat or not

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

        get cult() {
            let followers = $.getElementByText(/([\d\W]+[a-z]?) follow/i)? RegExp.$1: 0;

            return parseCoin(followers);
        },

        get done() {
            return STREAMER.__done__ ?? (async() => {
                let done = false;

                await LoadCache(['ChannelPoints'], ({ ChannelPoints = {} }) => {
                    let { name } = STREAMER,
                        [amount, fiat, face, notEarned, pointsToEarnNext] = (ChannelPoints[name] ?? 0).toString().split('|'),
                        allRewards = $('[data-test-selector="cost"i]', true);

                    notEarned = (
                        (allRewards?.length)?
                            allRewards.filter(amount => parseCoin(amount?.innerText) > STREAMER.coin).length:
                        (notEarned > -Infinity)?
                            notEarned:
                        -1
                    );

                    return done = (notEarned == 0);
                });

                return STREAMER.__done__ = done;
            })();
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

            return icon?.alt ?? 'Channel Points';
        },

        get from() {
            return 'STREAMER';
        },

        get game() {
            let element = $('[data-a-target$="game-link"i], [data-a-target$="game-name"i]'),
                name = element?.innerText,
                game = new String(name ?? "");

            Object.defineProperties(game, {
                href: { value: element?.href }
            });

            return game ?? LIVE_CACHE.get('game');
        },

        get href() {
            return parseURL($(`a[href$="${ NORMALIZED_PATHNAME }"i]`)?.href).href
        },

        get icon() {
            return $('img', false, $(`a[href$="${ NORMALIZED_PATHNAME }"i], [data-a-channel]`))?.src
        },

        get jump() {
            return JUMP_DATA;
        },

        get like() {
            return defined($('[data-a-target="unfollow-button"i]'))
        },

        get live() {
            return SPECIAL_MODE
                || (true
                    && defined($('[status] [class*="status-text"i]')) && !defined($(`[class*="offline-recommend"i]`))
                    && !/^offline$/i.test($(`[class*="video-player"i] [class*="media-card"i], [class*="channel"i][class*="status"i]`)?.innerText?.trim() ?? "")
                )
        },

        get name() {
            return $(`[class*="channel-info"i] a[href$="${ NORMALIZED_PATHNAME }"i]${ ['', ' h1'][+NORMAL_MODE] }`)?.textContent ?? LIVE_CACHE.get('name')
        },

        get paid() {
            return defined($('[data-a-target="subscribed-button"i]'))
        },

        get ping() {
            return defined($('[data-a-target^="live-notifications"i][data-a-target$="on"i]'))
        },

        get plug() {
            return defined($('[data-a-target*="ad-countdown"i]'));
        },

        get poll() {
            return parseInt($('[data-a-target$="viewers-count"i], [class*="stream-info-card"i] [data-test-selector$="description"i]')?.textContent?.replace(/\D+/g, '')) || 0
        },

        get redo() {
            return /^rerun$/i.test($(`[class*="video-player"i] [class*="media-card"i]`)?.innerText?.trim() ?? "");
        },

        get sole() {
            let [channel_id] = $('[data-test-selector="image_test_selector"i]', true).map(img => img.src).filter(src => src.contains('/panel-')).map(src => parseURL(src).pathname.split('-', 3).filter(parseFloat)).flat();

            return parseInt(channel_id ?? LIVE_CACHE.get('sole')) || 0;
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

            return tags ?? LIVE_CACHE.get('tags');
        },

        get mark() {
            let tags = [];

            $('.tw-tag', true).map(element => {
                let name = element.textContent.toLowerCase(),
                    { href } = element.closest('a[href]');

                if(parseBool(Settings.show_stats)) {
                    let score = scoreTagActivity(name);

                    new Tooltip(element, `${ '+-'[+(score < 0)] }${ score }`, { from: 'up' });
                }

                tags.push(name);
                tags[name] = href;

                return name;
            });

            return scoreTagActivity(...tags);
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

        get veto() {
            return !!$('[class*="banned"i]', true).length;
        },

        follow() {
            $('[data-a-target="follow-button"i]')?.click?.();
        },

        unfollow() {
            $('[data-a-target="unfollow-button"i]')?.click?.();
        },

        __eventlisteners__: {
            onhost: new Set,
            onraid: new Set,
        },

        set onhost(job) {
            STREAMER.__eventlisteners__.onhost.add(job);
        },

        set onraid(job) {
            STREAMER.__eventlisteners__.onraid.add(job);
        },
    };

    // Make the main icon draggable...
    let StreamerMainIcon = $(`main a[href$="${ NORMALIZED_PATHNAME }"i]`),
        StreamerFilteredData = { ...STREAMER };

    if(!defined(StreamerMainIcon))
        return /* Leave the main function (Initialize) if there's no streamer icon... Probably not in a stream */;

    for(let key of 'chat coin paid ping poll tags team time __eventlisteners__'.split(' '))
        delete StreamerFilteredData[key];

    StreamerMainIcon.setAttribute('draggable', true);
    StreamerMainIcon.setAttribute('tt-streamer-data', JSON.stringify({ ...STREAMER, chat: null, jump: null }));
    StreamerMainIcon.ondragstart ??= event => {
        let { currentTarget } = event;

        event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
        event.dataTransfer.dropEffect = 'move';
    };

    // Handlers: on-raid | on-host
    STREAMER.onraid = STREAMER.onhost = async({ hosting = false, raiding = false, raided = false }) => {
        let next = await GetNextStreamer();

        LOG('Resetting timer. Reason:', { hosting, raiding, raided }, 'Moving onto:', next);

        SaveCache({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE() });
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
                    name: $('[class$="text"i]', false, element)?.innerText?.replace(/([^]+?) +(go(?:ing)?|is|went) +live\b([^$]+)/i, ($0, $1, $$, $_) => $1),
                })
            ),
    ].filter(uniqueChannels);

    // Expand the left-hand panel until the last live channel is visible
    __GetAllChannels__:
    if(true) {
        let element;

        // Is the nav open?
        let open = defined($('[data-a-target="side-nav-search-input"i]')),
            sidenav = $('[data-a-target="side-nav-arrow"i]');

        // Open the Side Nav
        if(!open) // Only open it if it isn't already
            sidenav?.click();

        // Click "show more" as many times as possible
        show_more:
        while(defined(element = $('#sideNav [data-a-target$="show-more-button"i]')))
            element.click();

        let ALL_LIVE_SIDE_PANEL_CHANNELS = $('#sideNav .side-nav-section[aria-label][tt-section-label="followed"i] a', true).filter(e => !defined($('[class*="--offline"i]', false, e)));

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
                        from: 'ALL_CHANNELS',
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

                            return live;
                        },
                        name: $('img', false, element)?.alt,
                    };

                    element.setAttribute('draggable', true);
                    element.setAttribute('tt-streamer-data', JSON.stringify({ ...streamer, chat: null, jump: null }));
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
                        from: 'CHANNELS',
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

                            return live;
                        },
                        name: $('img', false, element)?.alt,
                    };

                    element.setAttribute('draggable', true);
                    element.setAttribute('tt-streamer-data', JSON.stringify({ ...streamer, chat: null, jump: null }));
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
            ...$(`#sideNav .side-nav-section[aria-label][tt-section-label="followed"i] a:not([href$="${ NORMALIZED_PATHNAME }"i])`, true)
                .map(element => {
                    let streamer = {
                        from: 'STREAMERS',
                        href: element.href,
                        icon: $('img', false, element)?.src,
                        get live() {
                            let { href } = element,
                                url = parseURL(href),
                                { pathname } = url;

                            let parent = $(`#sideNav .side-nav-section[aria-label][tt-section-label="followed"i] [href$="${ pathname }"]`);

                            if(!defined(parent))
                                return false;

                            let live = defined(parent) && !defined($(`[class*="--offline"i]`, false, parent));

                            return live;
                        },
                        name: $('img', false, element)?.alt,
                    };

                    element.setAttribute('draggable', true);
                    element.setAttribute('tt-streamer-data', JSON.stringify({ ...streamer, chat: null, jump: null }));
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
        while(defined(element = $('[data-a-target$="show-less-button"i]')))
            element.click();

        let PANEL_SIZE = 0;

        // Only re-open sections if they contain live channels
        show_more_again:
        while(true
            && defined(element = $('#sideNav [data-a-target$="show-more-button"i]'))
            && (++PANEL_SIZE * 12) < ALL_LIVE_SIDE_PANEL_CHANNELS.length
        )
            element.click();

        // Close the Side Nav
        if(!open) // Only close it if it wasn't open in the first place
            sidenav?.click();
    }

    // Every channel
    ALL_CHANNELS = [...ALL_CHANNELS, ...SEARCH, ...NOTIFICATIONS, ...STREAMERS, ...CHANNELS, STREAMER].filter(defined).filter(uniqueChannels);

    // Load the streamer's data from Twitch as a backup...
    await new Search(null, 'auto')
        .then(Search.convertResults)
        .then(streamer => {
            for(let key in streamer)
                LIVE_CACHE.set(key, streamer[key]);
        })
        .catch(WARN)
        .finally(async() => {
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
                    let { cookies } = Search;

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
                     * actualStartTime:Date         - the time (date) when the stream started
                     * dailyBroadcastTime:number    - the average number of hours streamed (per day)
                     * dailyStartTimes:array~string - an object of usual start times for the stream (strings are formatted as 24h time strings)
                     * dailyStopTimes:array~string  - an object of usual stop times for the stream (strings are formatted as 24h time strings)
                     * dataRetrievedAt:Date         - when was the data last retrieved (successfully)
                     * dataRetrievedOK:boolean      - was the data retrieval successful
                     * daysStreaming:array~string   - abbreviated names of days the stream is normally live
                     * projectedLastCall:Date       - the assumed last time to activate First in Line according to the user's settings
                     * projectedWindDownPeriod:Date - the assumed "dying down" period before the stream ends (90% of the stream will have passed)
                     * projectedStopTime:Date       - the assumed time (date) when the stream will end
                     * usualStartTime:string        - the normal start time for the stream on the current day (formatted as 24h time string)
                     * usualStopTime:string         - the normal stop time for the stream on the current day (formatted as 24h time string)

                        activeDaysPerWeek: 6
                        actualStartTime: "2021-06-11T20:49:47.997Z"
                        dailyBroadcastTime: 18566233
                        dailyStartTimes: { 0: "15:45", 1: "15:45", 2: "14:45", 3: "14:45", 4: "14:45", 5: "15:45", Mon: "15:45", Tue: "15:45", Wed: "14:45", … }
                        dailyStopTimes: { 0: "20:45", 1: "20:45", 2: "19:45", 3: "19:45", 4: "19:45", 5: "20:45", Mon: "20:45", Tue: "20:45", Wed: "19:45", … }
                        dataRetrievedAt: 1623458262999
                        dataRetrievedOK: true
                        daysStreaming: (6) ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                        projectedStopTime: "2021-06-12T01:59:14.230Z"
                        usualStartTime: "14:45"
                        usualStopTime: "19:45"
                     */
                    // First, attempt to retrieve the cached data (no older than 4h)
                    try {
                        await LoadCache(`data/${ STREAMER.name }`, cache => {
                            let data = cache[`data/${ STREAMER.name }`],
                                { dataRetrievedAt, dataRetrievedOK } = data;

                            dataRetrievedAt ||= 0;
                            dataRetrievedOK ||= false;

                            // Only refresh every 4h
                            if(!parseBool(dataRetrievedOK))
                                throw "The data wasn't saved correctly";
                            else if((dataRetrievedAt + (4 * 60 * 60 * 1000)) < +new Date)
                                throw "The data likely expired";
                            else
                                STREAMER.data = data;

                            REMARK(`Cached details about "${ STREAMER.name }"`, data);
                        });
                    } catch(exception) {
                        let { name, sole } = STREAMER;

                        if(!sole)
                            await new Search(name)
                                .then(Search.convertResults)
                                .then(streamer => sole = streamer.sole);

                        // Proper CORS request to fetch the HTML data
                        await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.twitchmetrics.net/c/${ sole }-${ name }/stream_time_values`)}`, { mode: 'cors' })
                            .then(response => response.json())
                            .then(json => {
                                let data = { dailyBroadcastTime: 0, activeDaysPerWeek: 0, usualStartTime: '00:00', usualStopTime: '00:00', daysStreaming: [], dailyStartTimes: {}, dailyStopTimes: {} },
                                    today = new Date;

                                let getWeekDays = (...days) => days.sort().map(day => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day]);

                                let avgStartTime = [], avgStreamSpan = [], avgStopTime = [], dlyStartTime = {}, dlyStopTime = {};

                                let daysWithStreams = new Set(),
                                    totalStreamHistory = (json ?? [])
                                        // All except today
                                        .slice(0, -1)
                                        // Last 2 weeks (excluding today)
                                        // .slice(-14)
                                        .reverse()
                                        .map(([start, stop]) => {
                                            let date = new Date(start.toUpperCase());

                                            if(Math.abs(today - date) < (30 * 24 * 60 * 60 * 1000))
                                                daysWithStreams.add(date.getDay());

                                            return [start, stop];
                                        })
                                        .reverse()
                                        .map(([start, stop]) => {
                                            // Set the average start/stop times (overall)
                                            let [S_, _S] = [start, stop].map(date => new Date(date));

                                            avgStartTime.push([ S_.getHours(), S_.getMinutes(), S_.getDay() ]);
                                            avgStreamSpan.push(Math.abs(+S_ - +_S));
                                            avgStopTime.push([ _S.getHours(), _S.getMinutes(), _S.getDay() ]);

                                            return [start, stop];
                                        });

                                // Set the daily start time
                                avgStartTime.map(([h, m, d]) => (dlyStartTime[d] ??= []).push([h, m]));

                                for(let day in dlyStartTime) {
                                    let avgH = 0, avgM = 0;

                                    dlyStartTime[day]
                                        .map(([h, m]) => { avgH += h; avgM += m })
                                        .filter((v, i, a) => !i)
                                        .map(() => {
                                            let { length } = dlyStartTime[day];

                                            avgH = Math.round(avgH / length);
                                            avgM = (avgM / length).floorToNearest(15);

                                            data.dailyStartTimes[day] = data.dailyStartTimes[getWeekDays(day)] = [avgH, avgM].map(t => ('00' + t).slice(-2)).join(':');
                                        });
                                }

                                // Set the average stream length
                                avgStreamSpan.map(t => data.dailyBroadcastTime += t);
                                data.dailyBroadcastTime = (data.dailyBroadcastTime / avgStreamSpan.length) | 0;

                                // Set the daily stop time
                                avgStopTime.map(([h, m, d]) => (dlyStopTime[d] ??= dlyStartTime[d]));

                                for(let day in dlyStartTime) {
                                    let [H, M] = toTimeString(data.dailyBroadcastTime, '!hour:!minute').split(':').map(parseFloat);

                                    data.dailyStopTimes[day] = data.dailyStopTimes[getWeekDays(day)] =
                                        data.dailyStartTimes[day]
                                            .split(':')
                                            .map(parseFloat)
                                            .map((v, i) => ([H, M][i] + v) % [24, 60][i])
                                            .map((v, i) => !!i? v.floorToNearest(15): v)
                                            .map(t => ('00' + t).slice(-2))
                                            .join(':');
                                }

                                // Set today's start/stop times
                                data.usualStartTime = data.dailyStartTimes[today.getDay()];
                                data.usualStopTime = data.dailyStopTimes[today.getDay()];

                                data.daysStreaming = getWeekDays(...daysWithStreams);
                                data.activeDaysPerWeek = data.daysStreaming.length;

                                data.actualStartTime = new Date(+new Date - STREAMER.time);
                                data.projectedStopTime = new Date(+data.actualStartTime + data.dailyBroadcastTime);
                                data.projectedWindDownPeriod = new Date(+data.actualStartTime + (data.dailyBroadcastTime * .9));
                                data.projectedLastCall = new Date(+data.projectedStopTime - (
                                    (
                                        parseBool(Settings.first_in_line)?
                                            Settings.first_in_line_time_minutes:
                                        parseBool(Settings.first_in_line_plus)?
                                            Settings.first_in_line_plus_time_minutes:
                                        parseBool(Settings.first_in_line_all)?
                                            Settings.first_in_line_all_time_minutes:
                                        15
                                    )
                                    * 60_000
                                ));

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
        });

    // TODO - Add an "un-delete" feature
    // Keep a copy of all messages
    // REMARK("Keeping a log of all original messages");
    // Messages.set(STREAMER.name, new Set);

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
        $('[data-a-target="player-overlay-mature-accept"i], [data-a-target*="watchparty"i] button, .home [data-a-target^="home"i]')?.click();
    };
    Timers.auto_accept_mature = 5_000;

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

    // Estimated level of screen activity
        // See https://www.twitch.tv/directory/all/tags
    function scoreTagActivity(...tags) {
        let score = 0;

        tags = tags.map(tag => tag.split(/\W/).reverse().pop().toLowerCase());

        scoring:
        for(let tag of tags)
            switch(tag) {
                case 'action':
                case 'adventure':
                case 'fps':
                case 'pinball':
                case 'platformer':
                case 'shoot':
                case 'shooter':
                case 'sports':
                case 'wrestling': {
                    score += 20;
                } continue scoring;

                case '4x':
                case 'bmx':
                case 'cosplay':
                case 'drag':
                case 'driving':
                case 'e3':
                case 'esports':
                case 'fashion':
                case 'fighting':
                case 'game':
                case 'irl':
                case 'mmo':
                case 'moba':
                case 'party':
                case 'point':
                case 'rhythm':
                case 'roguelike':
                case 'vr':
                case 'vtuber': {
                    score += 15;
                } continue scoring;

                case '100':
                case '12':
                case 'achievement':
                case 'anime':
                case 'arcade':
                case 'athletics':
                case 'autobattler':
                case 'automotive':
                case 'baking':
                case 'brickbuilding':
                case 'creative':
                case 'farming':
                case 'flight':
                case 'horror':
                case 'mobile':
                case 'mystery':
                case 'rpg':
                case 'rts':
                case 'survival': {
                    score += 10;
                } continue scoring;

                case 'animals':
                case 'animation':
                case 'art':
                case 'card':
                case 'dj':
                case 'drones':
                case 'fantasy':
                case 'gambling':
                case 'hype': // hype trains are a special occasion
                case 'indie':
                case 'metroidvania':
                case 'open':
                case 'puzzle':
                case 'simulation':
                case 'stealth':
                case 'unboxing': {
                    score += 5;
                } continue scoring;

                default: {
                    ++score;
                } continue scoring;
            };

        return score;
    }

    Handlers.auto_focus = () => {
        let detectionThreshold = parseInt(Settings.auto_focus_detection_threshold) || STREAMER.mark,
            pollInterval = parseInt(Settings.auto_focus_poll_interval),
            imageType = Settings.auto_focus_poll_image_type,
            detectedTrend = '&bull;';

        POLL_INTERVAL ??= pollInterval * 1000;
        STALLED_FRAMES = 0;

        if(CAPTURE_HISTORY.length > 90)
            CAPTURE_HISTORY.shift();

        CAPTURE_INTERVAL = setInterval(() => {
            let isAdvert = defined($('[data-a-target*="ad-countdown"i]')),
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
                            threshold = 0,
                            totalTime = 0,
                            bias = [];

                        analysisTime = parseInt(analysisTime);
                        misMatchPercentage = parseFloat(misMatchPercentage);

                        for(let [misMatchPercentage, analysisTime, trend] of CAPTURE_HISTORY) {
                            threshold += parseFloat(misMatchPercentage);
                            totalTime += analysisTime;
                            bias.push(trend);
                        }
                        threshold /= CAPTURE_HISTORY.length;

                        let trend = (misMatchPercentage > (parseBool(Settings.auto_focus_detection_threshold)? detectionThreshold: threshold)? 'up': 'down');

                        CAPTURE_HISTORY.push([misMatchPercentage, analysisTime, trend]);

                        /* Display capture stats */
                        let diffImg = $('img#tt-auto-focus-differences'),
                            diffDat = $('span#tt-auto-focus-stats'),
                            stop = +new Date;

                        DisplayingAutoFocusDetails:
                        if(Settings.show_stats) {
                            let parent = $('.chat-list--default');
                            // #twilight-sticky-header-root

                            if(!defined(parent))
                                break DisplayingAutoFocusDetails;

                            let { height, width } = getOffset(video),
                                { videoHeight } = video;

                            height = parseInt(height * .25);
                            width = parseInt(width * .25);

                            if(!defined(diffImg)) {
                                diffDat = furnish('span#tt-auto-focus-stats', { style: `background: var(--color-background-tooltip); color: var(--color-text-tooltip); position: absolute; z-index: 6; width: 100%; height: 2rem; overflow: hidden; font-family: monospace; font-size: 1rem; text-align: center; padding: 0;` });
                                diffImg = furnish('img#tt-auto-focus-differences', { style: `position: absolute; z-index: 3; width: 100%; transition: all 0.5s;` });

                                parent.append(diffDat, diffImg);
                            }

                            diffImg.src = data.getImageDataUrl?.();

                            let size = diffImg.src.length,
                                { totalVideoFrames } = video.getVideoPlaybackQuality();

                            diffDat.innerHTML = `Frame #${ totalVideoFrames.toString(36).toUpperCase() } / ${ detectedTrend } ${ misMatchPercentage }% &#866${ 3 + (trend[0] == 'd') }; / ${ ((stop - start) / 1000).suffix('s', 2) } / ${ size.suffix('B', 2) } / ${ videoHeight }p`;
                            diffDat.tooltip = new Tooltip(diffDat, `Frame ID / Overall Trend, Change Percentage, Current Trend / Time to Calculate Changes / Size of Changes (Bytes) / Image Resolution`, { from: 'left' });
                        } else {
                            diffImg?.remove();
                            diffDat?.remove();
                        }

                        /* Alter other settings according to the trend */
                        let changes = [];

                        if(bias.length > 30 && GET_TIME_REMAINING() > 60_000) {
                            // Positive activity trend; disable Away Mode, pause Up Next
                            if((!defined(POSITIVE_TREND) || POSITIVE_TREND === false) && bias.slice(-(30 / pollInterval)).filter(trend => trend === 'down').length < (30 / pollInterval) / 2) {
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
                            else if((!defined(POSITIVE_TREND) || POSITIVE_TREND === true) && bias.slice(-(60 / pollInterval)).filter(trend => trend === 'up').length < (60 / pollInterval) / 5) {
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

                        if(STALLED_FRAMES > 15 || (stop - start > POLL_INTERVAL * .75)) {
                            WARN('The stream seems to be stalling...', 'Increasing Auto-Focus job time...', (POLL_INTERVAL / 1000).toFixed(2) + 's -> ' + (POLL_INTERVAL * 1.1 / 1000).toFixed(2) + 's');

                            POLL_INTERVAL *= 1.1;
                            STALLED_FRAMES = 0;

                            RestartJob('auto_focus', 'modify');
                        }
                    })
            }, 100);
        }, POLL_INTERVAL);
    };
    Timers.auto_focus = -1_000;

    Unhandlers.auto_focus = () => {
        if(RestartJob.__reason__ !== 'modify')
            $('#tt-auto-focus-differences, #tt-auto-focus-stats', true)
                .forEach(element => element.remove());

        clearInterval(CAPTURE_INTERVAL);
    };

    __AutoFocus__:
    if(parseBool(Settings.auto_focus)) {
        RegisterJob('auto_focus');

        WARN("[Auto-Focus] is monitoring the stream...");
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
        AwayModeStatus = false,
        AwayModeEnabled = false,
        InitialQuality,
        InitialVolume,
        InitialViewMode,
        MAINTAIN_VOLUME_CONTROL = true;

    Handlers.away_mode = async() => {
        START__STOP_WATCH('away_mode');

        let button = $('#away-mode'),
            currentQuality = (Handlers.away_mode.quality ??= await GetQuality());

        /** Return (don't activate) if
         * a) The toggle-button already exists
         * b) There is an advertisement playing
         * c) There are no quality controls
         * d) The page is a search
         */
        if(defined(button) || defined($('[data-a-target*="ad-countdown"i]')) || !defined(currentQuality) || /\/search\b/i.test(NORMALIZED_PATHNAME))
            return JUDGE__STOP_WATCH('away_mode');

        await LoadCache({ AwayModeEnabled }, cache => AwayModeEnabled = cache.AwayModeEnabled ?? false);

        let enabled = AwayModeStatus = AwayModeEnabled || (currentQuality.low && !(currentQuality.auto || currentQuality.high || currentQuality.source));

        if(!defined(button)) {
            let sibling, parent, before,
                extra = () => {},
                container = furnish('div'),
                placement = (Settings.away_mode_placement ??= "null");

            switch(placement) {
                // Option 1 "over" - video overlay, play button area
                case 'over': {
                    sibling = $('[data-a-target="player-controls"i] [class*="player-controls"i][class*="right-control-group"i] > :last-child', false);
                    parent = sibling?.parentElement;
                    before = 'first';
                    extra = ({ container }) => {
                        // Remove the old tooltip
                        container.querySelector('[role="tooltip"i]')?.remove();
                    };
                } break;

                // Option 2 "under" - quick actions, follow/notify/subscribe area
                case 'under': {
                    sibling = $('[data-test-selector="live-notifications-toggle"i]') ?? $('[data-target="channel-header-right"i] [style] div div:not([style])');
                    parent = sibling?.parentElement;
                    before = 'last';
                    extra = ({ container }) => {
                        // Remove extra classes
                        let classes = $('button', false, container)?.closest('div')?.classList ?? [];

                        [...classes].map(value => {
                            if(/[-_]/.test(value))
                                return JUDGE__STOP_WATCH('away_mode');

                            classes.remove(value);
                        });
                    };
                } break;

                default: return JUDGE__STOP_WATCH('away_mode');
            }

            if(!defined(parent) || !defined(sibling))
                return JUDGE__STOP_WATCH('away_mode') /* WARN('Unable to create the Away Mode button') */;

            container.innerHTML = sibling.outerHTML.replace(/(?:[\w\-]*)(?:follow|header|notifications?|settings-menu)([\w\-]*)/ig, 'away-mode$1');
            container.id = 'away-mode';

            parent.insertBefore(container, parent[before + 'ElementChild']);

            if(['over'].contains(placement)) {
                container.firstElementChild.classList.remove('tt-mg-l-1');
            } else if(['under'].contains(placement)) {
                $('span', false, container)?.remove();
                $('[style]', false, container)?.setAttribute('style', 'opacity: 1; transform: translateX(15%) translateZ(0px);')
            }

            extra({ container, sibling, parent, before, placement });

            button = {
                enabled,
                container,
                icon: $('svg', false, container),
                background: $('button', false, container),
                get offset() { return getOffset(container) },
                tooltip: new Tooltip(container, `Turn away mode ${ ['on','off'][+enabled] } (${ GetMacro('alt+a') })`, { from: 'up', left: +5 }),
            };

            button.tooltip.id = new UUID().toString().replace(/-/g, '');
            button.container.setAttribute('tt-away-mode-enabled', enabled);

            button.icon ??= $('svg', false, container);
            button.icon.outerHTML = [
                Glyphs.modify('show', { id: 'tt-away-mode--show', height: '20px', width: '20px' }).toString(),
                Glyphs.modify('hide', { id: 'tt-away-mode--hide', height: '20px', width: '20px' }).toString(),
            ].filter(defined).join('');
            button.icon = $('svg', false, container);
        } else {
            let container = $('#away-mode');

            button = {
                enabled,
                container,
                icon: $('svg', false, container),
                tooltip: Tooltip.get(container),
                get offset() { return getOffset(container) },
                background: $('button', false, container),
            };
        }

        // Enable lurking when loaded
        if(!defined(InitialQuality)) {
            InitialQuality = (Handlers.away_mode.quality ??= await GetQuality());
            InitialVolume = (Handlers.away_mode.volume ??= GetVolume());
            InitialViewMode = (Handlers.away_mode.viewMode ??= GetViewMode());

            await SetQuality(['auto','low'][+enabled])
                .then(() => {
                    if(parseBool(Settings.away_mode__volume_control))
                        SetVolume([InitialVolume, Settings.away_mode__volume][+enabled]);

                    if(parseBool(Settings.away_mode__hide_chat))
                        ([
                            () => SetViewMode(InitialViewMode),
                            () => SetViewMode('fullwidth'),
                        ][+enabled])();
                });
        }

        let [accent, compliment] = (Settings.accent_color ?? 'blue/12').split('/');

        // if(init === true) ->
        // Don't use above, event listeners won't work
        button.background?.setAttribute('style', `background:${ [`var(--color-${ accent })`, 'var(--color-background-button-secondary-default)'][+(button.container.getAttribute('tt-away-mode-enabled') === "true")] } !important;`);
        // button.icon.setAttribute('height', '20px');
        // button.icon.setAttribute('width', '20px');

        button.container.onclick ??= async event => {
            let enabled = !parseBool(AwayModeButton.container.getAttribute('tt-away-mode-enabled')),
                { container, background, tooltip } = AwayModeButton;

            container.setAttribute('tt-away-mode-enabled', enabled);
            tooltip.innerHTML = `Turn away mode ${ ['on','off'][+enabled] } (${ GetMacro('alt+a') })`;
            background?.setAttribute('style', `background:${ [`var(--color-${ accent })`, 'var(--color-background-button-secondary-default)'][+enabled] } !important;`);

            // Return control when Away Mode is engaged
            MAINTAIN_VOLUME_CONTROL = true;

            await SetQuality(['auto','low'][+enabled])
                .then(() => {
                    if(parseBool(Settings.away_mode__volume_control))
                        SetVolume([InitialVolume, Settings.away_mode__volume][+enabled]);

                    if(parseBool(Settings.away_mode__hide_chat))
                        ([
                            () => SetViewMode(InitialViewMode),
                            () => SetViewMode('fullwidth'),
                        ][+enabled])();
                });

            SaveCache({ AwayModeEnabled: (AwayModeStatus = enabled) });
        };

        button.container.onmouseenter ??= event => {
            let { currentTarget } = event,
                svgContainer = $('figure', false, currentTarget),
                svgShow = $('svg#tt-away-mode--show', false, svgContainer),
                svgHide = $('svg#tt-away-mode--hide', false, svgContainer);
            let enabled = parseBool(currentTarget.closest('#away-mode').getAttribute('tt-away-mode-enabled'));

            svgShow?.setAttribute('preview', !enabled);
            svgHide?.setAttribute('preview', !!enabled);
        };

        button.container.onmouseleave ??= event => {
            let { currentTarget } = event,
                svgContainer = $('figure', false, currentTarget),
                svgShow = $('svg#tt-away-mode--show', false, svgContainer),
                svgHide = $('svg#tt-away-mode--hide', false, svgContainer);

            svgShow?.removeAttribute('preview');
            svgHide?.removeAttribute('preview');
        };

        // Alt + A | Opt + A
        if(!defined(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_A))
            document.addEventListener('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_A = ({ key, altKey, ctrlKey, metaKey, shiftKey }) => {
                if(altKey && key == 'a')
                    $('#away-mode').click();
            });

        AwayModeButton = button;

        JUDGE__STOP_WATCH('away_mode');
    };
    Timers.away_mode = 1_000;

    Unhandlers.away_mode = () => {
        $('#away-mode')?.remove();
    };

    __AwayMode__:
    if(parseBool(Settings.away_mode)) {
        RegisterJob('away_mode');

        // Maintain the volume until the user changes it
        GetVolume.onchange = (volume, { isTrusted = false }) => {
            if(!MAINTAIN_VOLUME_CONTROL || !isTrusted)
                return;

            WARN('[Away Mode] is releasing volume control due to user interaction...');

            MAINTAIN_VOLUME_CONTROL = !isTrusted;

            SetVolume(volume);
        };

        // Scheduling logic...
        awaitOn(() => $('#away-mode'), 3_000).then(() => {
            let schedules = JSON.parse(Settings?.away_mode_schedule || '[]');
            let today = new Date(),
                YEAR = today.getFullYear(),
                MONTH = today.getMonth(),
                DATE = today.getDate(),
                TODAY = today.getDay(),
                H = today.getHours(),
                M = today.getMinutes(),
                S = today.getSeconds();

            let weekdays = 'Sun Mon Tue Wed Thu Fri Sat'.split(' '),
                months = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

            let enableAwayMode,
                currentAwayMode = parseBool($('#away-mode')?.getAttribute('tt-away-mode-enabled'));

            for(let schedule of schedules) {
                let { day, time, duration, status } = schedule;

                if(TODAY != day)
                    continue;

                if((H < time) || (H > (time + duration) % 24))
                    continue;

                duration *= 3_600_000;

                WARN(`Away Mode is scheduled to be "${ ['off','on'][+status] }" for ${ weekdays[day] } @ ${ time }:00 for ${ toTimeString(duration, '?hours_h') }`);

                // Found at least one schedule...
                if(defined(enableAwayMode = status))
                    break;
            }

            // Scheduled state...
            // LOG('Away Mode needs to be:', enableAwayMode, 'Current status:', currentAwayMode);
            if(defined(enableAwayMode) && enableAwayMode != currentAwayMode)
                $('#away-mode').click();
        });
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

    /*** Claim Loot
     *       _____ _       _             _                 _
     *      / ____| |     (_)           | |               | |
     *     | |    | | __ _ _ _ __ ___   | |     ___   ___ | |_
     *     | |    | |/ _` | | '_ ` _ \  | |    / _ \ / _ \| __|
     *     | |____| | (_| | | | | | | | | |___| (_) | (_) | |_
     *      \_____|_|\__,_|_|_| |_| |_| |______\___/ \___/ \__|
     *
     *
     */
    Handlers.claim_loot = () => {
        let prime_loots_button = $('[data-a-target^="prime-offers"i]');

        prime_loots_button.click();

        // Give the loots time to load
        let waiter = setInterval(() => {
            let stop = $('[href*="gaming.amazon.com"]', true).length;

            if(!stop) return;

            clearInterval(waiter);

            $('button[data-a-target^="prime-claim"i]', true).map(button => button.click());
            $('[class*="prime-offer"i][class*="dismiss"i] button', true).map(button => button.click());

            // Give the loots time to be clicked
            setTimeout(() => prime_loots_button.click(), 100 * stop);
        }, 100);
    };
    Timers.claim_loot = -5_000;

    __ClaimPrime__:
    if(parseBool(Settings.claim_loot)) {
        REMARK("Claiming Prime Gaming Loot...");

        RegisterJob('claim_loot');
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
        FIRST_IN_LINE_DUE_DATE,             // The due date of the next job
        ALL_FIRST_IN_LINE_JOBS,             // All First in Line jobs
        FIRST_IN_LINE_WAIT_TIME,            // The wait time (from settings)
        FIRST_IN_LINE_LISTING_JOB,          // The job (interval) for listing all jobs (under the ballon)
        FIRST_IN_LINE_WARNING_JOB,          // The job for warning the user (via popup)
        FIRST_IN_LINE_SORTING_HANDLER,      // The Sortable object to handle the balloon
        FIRST_IN_LINE_WARNING_TEXT_UPDATE;  // Sub-job for the warning text

    let UP_NEXT_ALLOW_THIS_TAB = true;      // Allow this tab to use Up Next

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
    function REDO_FIRST_IN_LINE_QUEUE(url) {
        if(!defined(url) || (FIRST_IN_LINE_HREF === url && [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].filter(unknown).length <= 0))
            return;

        url = parseURL(url);

        let { href } = url,
            channel = ALL_CHANNELS.find(channel => parseURL(channel.href).pathname == url.pathname);

        if(!defined(channel))
            return ERROR(`Unable to create job for "${ href }"`);

        let { name } = channel;

        FIRST_IN_LINE_HREF = href;
        [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

        if(!ALL_FIRST_IN_LINE_JOBS.filter(defined).length)
            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

        LOG(`Waiting ${ toTimeString(GET_TIME_REMAINING() | 0) } before leaving for "${ name }" -> ${ href }`, new Date);

        FIRST_IN_LINE_WARNING_JOB = setInterval(() => {
            let timeRemaining = GET_TIME_REMAINING();

            timeRemaining = timeRemaining < 0? 0: timeRemaining;

            if(FIRST_IN_LINE_PAUSED)
                return /* First in Line is paused */;
            if(timeRemaining > 60_000)
                return /* There's more than 1 minute left */;

            let existing = Popup.get(`Up Next \u2014 ${ name }`);

            if(defined(STARTED_TIMERS.WARNING))
                return /* There is already a warning pending */;

            STARTED_TIMERS.WARNING = true;

            LOG('Heading to stream in', toTimeString(timeRemaining), FIRST_IN_LINE_HREF, new Date);

            let popup = existing ?? new Popup(`Up Next \u2014 ${ name }`, `Heading to stream in \t${ toTimeString(timeRemaining) }\t`, {
                icon: ALL_CHANNELS.find(channel => channel.href === href)?.icon,
                href: FIRST_IN_LINE_HREF,

                onmousedown: event => {
                    let existing = $('#tt-popup', false, top.CHILD_CONTROLLER_CONTAINER),
                        uuid = existing?.getAttribute('uuid');

                    Popup.remove(uuid);

                    SaveCache({ FIRST_IN_LINE_DUE_DATE: NEW_DUE_DATE() });
                },

                Hide: event => {
                    let existing = $('#tt-popup', false, top.CHILD_CONTROLLER_CONTAINER),
                        uuid = existing?.getAttribute('uuid');

                    Popup.remove(uuid);
                },

                Cancel: event => {
                    let existing = $('#tt-popup', false, top.CHILD_CONTROLLER_CONTAINER),
                        uuid = existing?.getAttribute('uuid'),
                        removal = $('button[connected-to][data-test-selector$="delete"i]'),
                        [thisJob] = ALL_FIRST_IN_LINE_JOBS;

                    Popup.remove(uuid);

                    LOG('Canceled First in Line event', thisJob);

                    removal?.click?.();

                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                },
            });

            FIRST_IN_LINE_WARNING_TEXT_UPDATE = setInterval(() => {
                let timeRemaining = GET_TIME_REMAINING();

                timeRemaining = timeRemaining < 0? 0: timeRemaining;

                if(FIRST_IN_LINE_PAUSED)
                    return /* First in Line is paused */;

                if(defined(popup?.elements))
                    popup.elements.message.innerHTML
                        = popup.elements.message.innerHTML
                            .replace(/\t([^\t]+?)\t/i, ['\t', toTimeString(timeRemaining, '!minute:!second'), '\t'].join(''));

                if(timeRemaining < 1000) {
                    popup?.remove?.();
                    clearInterval(FIRST_IN_LINE_WARNING_TEXT_UPDATE);
                }
            }, 1000);
        }, 1000);

        FIRST_IN_LINE_JOB = setInterval(() => {
            // If the channel disappears (or goes offline), kill the job for it
            // TO-NOTICE: this may cause reloading issues?
            let channel = ALL_CHANNELS.find(channel => channel.href == FIRST_IN_LINE_HREF),
                timeRemaining = GET_TIME_REMAINING();

            timeRemaining = timeRemaining < 0? 0: timeRemaining;

            if(!defined(channel)) {
                LOG('Restoring dead channel (interval)...', FIRST_IN_LINE_HREF);

                let { href, pathname } = parseURL(FIRST_IN_LINE_HREF),
                    channelID = UUID.from(pathname).value;

                let name = pathname.slice(1).toLowerCase();

                new Search(name)
                    .then(Search.convertResults)
                    .then(streamer => {
                        let restored = ({
                            from: 'SEARCH',
                            href,
                            icon: streamer.icon,
                            live: streamer.live,
                            name: streamer.name,
                        });

                        ALL_CHANNELS = [...ALL_CHANNELS, restored];
                        ALL_FIRST_IN_LINE_JOBS[index] = restored;
                    })
                    .catch(error => {
                        ALL_FIRST_IN_LINE_JOBS = [...new Set(ALL_FIRST_IN_LINE_JOBS)].filter(url => url?.length).filter(href => href != FIRST_IN_LINE_HREF);
                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                        SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });

                        REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                        WARN(error, killed);
                    });
            }

            // The timer is paused
            if(FIRST_IN_LINE_PAUSED)
                return SaveCache({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) });
            // Don't act until 1sec is left
            if(timeRemaining > 1000)
                return;

            /* After above is `false` */

            SaveCache({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE() }, () => {
                LOG('Heading to stream now [Job Interval]', FIRST_IN_LINE_HREF);

                [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);
                open(FIRST_IN_LINE_HREF, '_self');
            });
        }, 1000);
    }

    function NEW_DUE_DATE(offset) {
        if(!UP_NEXT_ALLOW_THIS_TAB)
            return (+new Date) + 24 * 3_600_000;

        return (+new Date) + (null
            ?? offset
            ?? FIRST_IN_LINE_WAIT_TIME * 60_000
        );
    }

    function GET_TIME_REMAINING() {
        if(!UP_NEXT_ALLOW_THIS_TAB)
            return 24 * 3_600_000;

        let now = (+new Date),
            due = FIRST_IN_LINE_DUE_DATE;

        return (due - now);
    }

    if(Settings.up_next__one_instance)
        Runtime.sendMessage({ action: 'CLAIM_UP_NEXT' }, async({ owner = true }) => {
            UP_NEXT_ALLOW_THIS_TAB = owner;

            LOG('This tab is the Up Next owner', owner);
        });
    else
        Runtime.sendMessage({ action: 'WAIVE_UP_NEXT' });

    let FIRST_IN_LINE_BALLOON__INSURANCE =
    setInterval(() => {
        if(NORMAL_MODE && !defined(FIRST_IN_LINE_BALLOON)) {
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

                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(
                        FIRST_IN_LINE_TIMER = (
                            // If the streamer hasn't been on for longer than 10mins, wait until then
                            STREAMER.time < tenMin?
                                (
                                    // Boost is enabled
                                    FIRST_IN_LINE_BOOST?
                                        fiveMin + (tenMin - STREAMER.time):
                                    // Boost is disabled
                                    FIRST_IN_LINE_WAIT_TIME * oneMin
                                ):
                            // Streamer has been live longer than 10mins
                            (
                                // Boost is enabled
                                FIRST_IN_LINE_BOOST?
                                    // Boost is enabled
                                    Math.min(GET_TIME_REMAINING(), fiveMin):
                                // Boost is disabled
                                FIRST_IN_LINE_WAIT_TIME * oneMin
                            )
                        )
                    );

                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                    $(`[up-next--body] [time]`, true).forEach(element => element.setAttribute('time', FIRST_IN_LINE_TIMER));

                    SaveCache({ FIRST_IN_LINE_BOOST, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME });
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
            }),
                [accent, compliment] = (Settings.accent_color ?? 'blue/12').split('/'),
                [colorName] = accent.split('-').reverse();

            first_in_line_help_button.tooltip = new Tooltip(first_in_line_help_button, (UP_NEXT_ALLOW_THIS_TAB? `Drop a channel in the <span style="color:var(--color-${ accent })">${ colorName }</span> area to queue it`: `Up Next is disabled for this tab`));

            // Load cache
            LoadCache(['ALL_FIRST_IN_LINE_JOBS', 'FIRST_IN_LINE_DUE_DATE', 'FIRST_IN_LINE_BOOST'], cache => {
                let oneMin = 60_000,
                    fiveMin = 5 * oneMin,
                    tenMin = 10 * oneMin;

                ALL_FIRST_IN_LINE_JOBS = cache.ALL_FIRST_IN_LINE_JOBS ?? [];
                FIRST_IN_LINE_BOOST = parseBool(cache.FIRST_IN_LINE_BOOST) && ALL_FIRST_IN_LINE_JOBS.length > 0;
                FIRST_IN_LINE_DUE_DATE = (null
                    ?? cache.FIRST_IN_LINE_DUE_DATE
                    ?? (
                        NEW_DUE_DATE(
                            FIRST_IN_LINE_TIMER = (
                                // If the streamer hasn't been on for longer than 10mins, wait until then
                                STREAMER.time < tenMin?
                                    (
                                        // Boost is enabled
                                        FIRST_IN_LINE_BOOST?
                                            fiveMin + (tenMin - STREAMER.time):
                                        // Boost is disabled
                                        FIRST_IN_LINE_WAIT_TIME * oneMin
                                    ):
                                // Streamer has been live longer than 10mins
                                (
                                    // Boost is enabled
                                    FIRST_IN_LINE_BOOST?
                                        // Boost is enabled
                                        Math.min(GET_TIME_REMAINING(), fiveMin):
                                    // Boost is disabled
                                    FIRST_IN_LINE_WAIT_TIME * oneMin
                                )
                            )
                        )
                    )
                );

                REMARK(`Up Next Boost is ${ ['dis','en'][FIRST_IN_LINE_BOOST | 0] }abled`);


                if(FIRST_IN_LINE_BOOST) {
                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(Math.min(GET_TIME_REMAINING(), fiveMin));

                    setTimeout(() => $('[up-next--body] [time]:not([index="0"])', true).forEach(element => element.setAttribute('time', FIRST_IN_LINE_TIMER = fiveMin)), 5_000);

                    SaveCache({ FIRST_IN_LINE_DUE_DATE });
                }

                // Up Next Boost
                first_in_line_boost_button.setAttribute('speeding', FIRST_IN_LINE_BOOST);
                first_in_line_boost_button.querySelector('svg[fill]')?.setAttribute('fill', `#${ ['dddb','e6cb00'][FIRST_IN_LINE_BOOST | 0] }`);
                first_in_line_boost_button.tooltip = new Tooltip(first_in_line_boost_button, `${ ['Start','Stop'][FIRST_IN_LINE_BOOST | 0] } Boost`);

                $('[up-next--container] button')?.setAttribute('style', `border-bottom: ${ (FIRST_IN_LINE_BOOST || !UP_NEXT_ALLOW_THIS_TAB) | 0 }px solid var(--color-${ ['yellow', 'red'][!UP_NEXT_ALLOW_THIS_TAB | 0] })`);

                // Pause
                first_in_line_pause_button.tooltip = new Tooltip(first_in_line_pause_button, `Pause the timer`);
            });
        }

        if(defined(FIRST_IN_LINE_BALLOON)) {
            // FIRST_IN_LINE_BALLOON.header.closest('div').setAttribute('title', (UP_NEXT_ALLOW_THIS_TAB? `Drop a channel here to queue it`: `Up Next is disabled for this tab`));

            FIRST_IN_LINE_BALLOON.body.ondragover ??= event => {
                event.preventDefault();

                event.dataTransfer.dropEffect = (UP_NEXT_ALLOW_THIS_TAB? 'move': 'none');
            };

            FIRST_IN_LINE_BALLOON.body.ondrop ??= async event => {
                event.preventDefault();

                if(!UP_NEXT_ALLOW_THIS_TAB)
                    return;

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

                    LOG('Adding to Up Next [ondrop]:', { href, streamer });

                    if(!defined(streamer?.icon)) {
                        let name = (streamer?.name ?? parseURL(href).pathname.slice(1)).toLowerCase();

                        new Search(name)
                            .then(Search.convertResults)
                            .then(streamer => {
                                let restored = ({
                                    from: 'SEARCH',
                                    href,
                                    icon: streamer.icon,
                                    live: streamer.live,
                                    name: streamer.name,
                                });

                                ALL_CHANNELS = [...ALL_CHANNELS, restored];
                            });
                    }

                    // Jobs are unknown. Restart timer
                    if(ALL_FIRST_IN_LINE_JOBS.length < 1)
                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                    // LOG('Accessing here... #1');
                    ALL_FIRST_IN_LINE_JOBS = [...new Set([...ALL_FIRST_IN_LINE_JOBS, href])].filter(url => url?.length);

                    SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });

                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                }
            };

            FIRST_IN_LINE_BALLOON.icon.onmouseenter ??= event => {
                let { container, tooltip, title } = FIRST_IN_LINE_BALLOON,
                    offset = getOffset(container);

                $('div#root > *').append(
                    furnish('div.tt-tooltip-layer.tooltip-layer', { style: `transform: translate(${ offset.left }px, ${ offset.top }px); width: 30px; height: 30px; z-index: 9000;` },
                        furnish('div.tt-inline-flex.tt-relative.tt-tooltip-wrapper', { 'aria-describedby': tooltip.id, 'show': true },
                            furnish('div', { style: 'width: 30px; height: 30px;' }),
                            tooltip
                        )
                    )
                );

                tooltip.setAttribute('style', 'display:block');
            };

            FIRST_IN_LINE_BALLOON.icon.onmouseleave ??= event => {
                $('div#root .tt-tooltip-layer.tooltip-layer')?.remove();

                FIRST_IN_LINE_BALLOON.tooltip?.closest('[show]')?.setAttribute('show', false);
            };

            FIRST_IN_LINE_SORTING_HANDLER ??= new Sortable(FIRST_IN_LINE_BALLOON.body, {
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

                    // This controls the new due date `NEW_DUE_DATE(time)` when the user drags a channel to the first position
                        // To create a new due date, `NEW_DUE_DATE(time)` -> `NEW_DUE_DATE()`
                    if([oldIndex, newIndex].contains(0)) {
                        let time = FIRST_IN_LINE_TIMER = parseInt($(`[name="${ channel.name }"i]`).getAttribute('time'));

                        LOG('New First in Line event:', { ...channel, time  });

                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);

                        REDO_FIRST_IN_LINE_QUEUE(channel.href);
                        LOG('Redid First in Line queue [Sorting Handler]...', { FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME, FIRST_IN_LINE_HREF });
                    }

                    SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
                },
            });

            if(Settings.first_in_line_none)
                FIRST_IN_LINE_BALLOON.container.setAttribute('style', 'display:none!important');
            else
                FIRST_IN_LINE_LISTING_JOB = setInterval(() => {
                    // Set the opacity...
                    // FIRST_IN_LINE_BALLOON.container.setAttribute('style', `opacity:${ (UP_NEXT_ALLOW_THIS_TAB? 1: 0.75) }!important`);

                    for(let index = 0, fails = 0; UP_NEXT_ALLOW_THIS_TAB && index < ALL_FIRST_IN_LINE_JOBS?.length; index++) {
                        let href = ALL_FIRST_IN_LINE_JOBS[index],
                            channel = ALL_CHANNELS.find(channel => parseURL(channel.href).pathname === parseURL(href).pathname);

                        if(!defined(href) || !defined(channel))
                            continue;

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
                                    SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
                                } else {
                                    LOG('Destroying current job [Job Listings]...', { FIRST_IN_LINE_HREF, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME });

                                    [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                                    FIRST_IN_LINE_HREF = undefined;
                                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                                    SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
                                }
                            },

                            attributes: {
                                name,
                                live,
                                index,
                                time: (index < 1? GET_TIME_REMAINING(): FIRST_IN_LINE_WAIT_TIME * 60_000),

                                style: (live? '': 'opacity: 0.3!important'),
                            },

                            animate: container => {
                                let subheader = $('.tt-balloon-subheader', false, container);

                                return setInterval(() => {
                                    START__STOP_WATCH('up_next_balloon__subheader_timer_animation');

                                    if(FIRST_IN_LINE_PAUSED)
                                        return JUDGE__STOP_WATCH('up_next_balloon__subheader_timer_animation', 1000) /* First in Line is paused */;

                                    let channel = (ALL_CHANNELS.find(channel => channel.name == container.getAttribute('name')) ?? {}),
                                        { name, live } = channel;

                                    live ||= SEARCH_CACHE.get(name)?.live;

                                    let time = GET_TIME_REMAINING(),
                                        intervalID = parseInt(container.getAttribute('animationID')),
                                        index = $('[id][guid][uuid]', true, container.parentElement).indexOf(container);

                                    if(time < 60_000 && !defined(FIRST_IN_LINE_HREF)) {
                                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);

                                        WARN('Creating job to avoid [Job Listing] mitigation event', channel);

                                        return JUDGE__STOP_WATCH('up_next_balloon__subheader_timer_animation', 1000), REDO_FIRST_IN_LINE_QUEUE(channel.href);
                                    }

                                    if(time < 0)
                                        setTimeout(() => {
                                            LOG('Mitigation event for [Job Listings]', { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_HREF }, new Date);
                                            // Mitigate 0 time bug?

                                            SaveCache({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE() }, () => {
                                                open($('a', false, container)?.href ?? '?', '_self');
                                            });

                                            return clearInterval(intervalID);
                                        }, 5000);

                                    container.setAttribute('time', GET_TIME_REMAINING() - (index > 0? 0: 1000));

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

                                    subheader.innerHTML = index > 0? nth(index + 1): toTimeString(time, 'clock');

                                    JUDGE__STOP_WATCH('up_next_balloon__subheader_timer_animation', 1000);
                                }, 1000);
                            },
                        })
                            ?? [];
                    }

                    FIRST_IN_LINE_BALLOON.counter.setAttribute('length', $(`[up-next--body] [time]`, true).length);
                }, 1000);
        }
    }, 1000);

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
        START__STOP_WATCH('first_in_line');

        let notifications = [...$('[data-test-selector="onsite-notifications-toast-manager"i] [data-test-selector^="onsite-notification-toast"i]', true), ActionableNotification].filter(defined);

        // The Up Next empty status
        $('[up-next--body]')?.setAttribute?.('empty', !(UP_NEXT_ALLOW_THIS_TAB && ALL_FIRST_IN_LINE_JOBS.length));
        $('[up-next--body]')?.setAttribute?.('allowed', !!UP_NEXT_ALLOW_THIS_TAB);

        if(!UP_NEXT_ALLOW_THIS_TAB)
            return;

        for(let notification of notifications) {
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

            LOG('Received an actionable notification:', innerText, new Date);

            if(defined(FIRST_IN_LINE_HREF ??= ALL_FIRST_IN_LINE_JOBS[0])) {
                if(![...ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_HREF].contains(href)) {
                    LOG('Pushing to First in Line:', href, new Date);

                    // LOG('Accessing here... #2');
                    ALL_FIRST_IN_LINE_JOBS = [...new Set([...ALL_FIRST_IN_LINE_JOBS, href])].filter(url => url?.length);
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

                // Add the new job...
                // LOG('Accessing here... #3');
                ALL_FIRST_IN_LINE_JOBS = [...new Set([...ALL_FIRST_IN_LINE_JOBS, href])].filter(url => url?.length);
                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                // To wait, or not to wait
                SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                });
            }

            AddBalloon: {
                update();

                let channel = ALL_CHANNELS.find(channel => parseURL(channel.href).pathname === parseURL(href).pathname);
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
                            SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
                        } else {
                            LOG('Destroying current job [First in Line]...', { FIRST_IN_LINE_HREF, FIRST_IN_LINE_DUE_DATE });

                            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                            FIRST_IN_LINE_HREF = undefined;
                            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
                            SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
                        }
                    },

                    attributes: {
                        name,
                        live,
                        index,
                        time: (index < 1? GET_TIME_REMAINING(): FIRST_IN_LINE_WAIT_TIME * 60_000),

                        style: (live? '': 'opacity: 0.3!important'),
                    },

                    animate: container => {
                        let subheader = $('.tt-balloon-subheader', false, container);

                        if(!UP_NEXT_ALLOW_THIS_TAB)
                            return -1;

                        return setInterval(() => {
                            START__STOP_WATCH('first_in_line__job_watcher');

                            if(FIRST_IN_LINE_PAUSED)
                                return JUDGE__STOP_WATCH('first_in_line__job_watcher', 1000) /* First in Line is paused */;

                            SaveCache({ FIRST_IN_LINE_BOOST });

                            let channel = (ALL_CHANNELS.find(channel => channel.name == container.getAttribute('name')) ?? {}),
                                { name, live } = channel;

                            live ||= SEARCH_CACHE.get(name)?.live;

                            let time = GET_TIME_REMAINING(),
                                intervalID = parseInt(container.getAttribute('animationID')),
                                index = $('[id][guid][uuid]', true, container.parentElement).indexOf(container);

                            if(time < 60_000 && !defined(FIRST_IN_LINE_HREF)) {
                                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);

                                WARN('Creating job to avoid [First in Line] mitigation event', channel);

                                return JUDGE__STOP_WATCH('first_in_line__job_watcher', 1000), REDO_FIRST_IN_LINE_QUEUE(channel.href);
                            }

                            if(time < 0)
                                setTimeout(() => {
                                    LOG('Mitigation event from [First in Line]', { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_HREF }, new Date);
                                    // Mitigate 0 time bug?

                                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
                                    SaveCache({ FIRST_IN_LINE_DUE_DATE }, () => {
                                        open($('a', false, container)?.href ?? '?', '_self');
                                    });

                                    return clearInterval(intervalID);
                                }, 5000);

                            container.setAttribute('time', GET_TIME_REMAINING() - (index > 0? 0: 1000));

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

                            subheader.innerHTML = index > 0? nth(index + 1): toTimeString(time, 'clock');

                            JUDGE__STOP_WATCH('first_in_line__job_watcher', 1000);
                        }, 1000);
                    },
                })
                    ?? [];

                if(defined(FIRST_IN_LINE_WAIT_TIME) && !defined(FIRST_IN_LINE_HREF)) {
                    REDO_FIRST_IN_LINE_QUEUE(href);
                    LOG('Redid First in Line queue [First in Line]...', { FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME, FIRST_IN_LINE_HREF });
                } else if(Settings.first_in_line_none) {
                    let existing = $('#tt-popup', false, top.CHILD_CONTROLLER_CONTAINER);

                    if(defined(existing))
                        existing.remove();

                    LOG('Heading to stream now [First in Line] is OFF', FIRST_IN_LINE_HREF);

                    [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);
                    open(FIRST_IN_LINE_HREF, '_self');
                }
            }
        }

        FIRST_IN_LINE_BOOST &&= ALL_FIRST_IN_LINE_JOBS.length > 0;

        let filb = $('[speeding]');

        if(parseBool(filb?.getAttribute('speeding')) != parseBool(FIRST_IN_LINE_BOOST))
            filb?.click?.();

        JUDGE__STOP_WATCH('first_in_line');
    };
    Timers.first_in_line = 1_000;

    Unhandlers.first_in_line = () => {
        if(defined(FIRST_IN_LINE_JOB))
            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

        if(UnregisterJob.__reason__ == 'default')
            return;

        if(defined(FIRST_IN_LINE_HREF))
            FIRST_IN_LINE_HREF = '?';

        ALL_FIRST_IN_LINE_JOBS = [];
        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

        SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
    };

    __FirstInLine__:
    if(parseBool(Settings.first_in_line) || parseBool(Settings.first_in_line_plus) || parseBool(Settings.first_in_line_all)) {
        await LoadCache(['ALL_FIRST_IN_LINE_JOBS', 'FIRST_IN_LINE_DUE_DATE', 'FIRST_IN_LINE_BOOST'], cache => {
            let oneMin = 60_000,
                fiveMin = 5 * oneMin,
                tenMin = 10 * oneMin;

            ALL_FIRST_IN_LINE_JOBS = cache.ALL_FIRST_IN_LINE_JOBS ?? [];
            FIRST_IN_LINE_BOOST = parseBool(cache.FIRST_IN_LINE_BOOST) && ALL_FIRST_IN_LINE_JOBS.length > 0;
            FIRST_IN_LINE_DUE_DATE = (null
                ?? cache.FIRST_IN_LINE_DUE_DATE
                ?? (
                    NEW_DUE_DATE(
                        FIRST_IN_LINE_TIMER = (
                            // If the streamer hasn't been on for longer than 10mins, wait until then
                            STREAMER.time < tenMin?
                                (
                                    // Boost is enabled
                                    FIRST_IN_LINE_BOOST?
                                        fiveMin + (tenMin - STREAMER.time):
                                    // Boost is disabled
                                    FIRST_IN_LINE_WAIT_TIME * oneMin
                                ):
                            // Streamer has been live longer than 10mins
                            (
                                // Boost is enabled
                                FIRST_IN_LINE_BOOST?
                                    // Boost is enabled
                                    Math.min(GET_TIME_REMAINING(), fiveMin):
                                // Boost is disabled
                                FIRST_IN_LINE_WAIT_TIME * oneMin
                            )
                        )
                    )
                )
            );
        });

        RegisterJob('first_in_line');

        // Restart the timer if the user navigates away from the page
        top.onlocationchange = ({ from, to }) => {
            if(from == to)
                return;

            REMARK('Resetting timer. Location change detected:', { from, to });

            // If the user clicks on a channel, reset the timer
            if(!ReservedTwitchPathnames.test(to))
                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
        };

        // Controls what's listed under the Up Next balloon
        if(!defined(FIRST_IN_LINE_HREF) && ALL_FIRST_IN_LINE_JOBS.length) {
            let [href] = ALL_FIRST_IN_LINE_JOBS,
                first = !ALL_FIRST_IN_LINE_JOBS.filter(defined).indexOf(STREAMER.href),
                channel = ALL_CHANNELS.filter(isLive).filter(channel => channel.href !== STREAMER.href).find(channel => parseURL(channel.href).pathname === parseURL(href).pathname);

            if(!defined(channel) && !first) {
                let index = ALL_FIRST_IN_LINE_JOBS.findIndex(job => job == href),
                    dead = ALL_FIRST_IN_LINE_JOBS[index];

                LOG('Restoring dead channel (initializer)...', dead);

                let { pathname } = parseURL(dead),
                    channelID = UUID.from(pathname).value;

                let name = pathname.slice(1).toLowerCase();

                (null
                    ?? new Search(name).then(Search.convertResults)
                    ?? new Promise((resolve, reject) => reject(`Unable to perform search for "${ name }"`))
                )
                    .then(streamer => {
                        let restored = ({
                            from: 'SEARCH',
                            href,
                            icon: streamer.icon,
                            live: streamer.live,
                            name: streamer.name,
                        });

                        ALL_CHANNELS = [...ALL_CHANNELS, restored].filter(uniqueChannels);
                        ALL_FIRST_IN_LINE_JOBS[index] = restored;

                        REDO_FIRST_IN_LINE_QUEUE(href);
                    })
                    .catch(error => {
                        let [killed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1);

                        SaveCache({ ALL_FIRST_IN_LINE_JOBS });

                        WARN(error, killed);
                    });

                break __FirstInLine__;
            } else if(!first) {
                // Handlers.first_in_line({ href, innerText: `${ channel.name } is live [First in Line]` });

                // WARN('Forcing queue update for', href);
                // REDO_FIRST_IN_LINE_QUEUE(href);

                LOG(`Waiting ${ toTimeString(GET_TIME_REMAINING() | 0) } before leaving for ${ href }`, new Date);
            } else if(first) {
                let [popped] = ALL_FIRST_IN_LINE_JOBS.splice(0, 1);

                [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                SaveCache({ ALL_FIRST_IN_LINE_JOBS });
                WARN('Removed duplicate job', popped);
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
        START__STOP_WATCH('first_in_line_plus');

        let streamers = [...new Set([...STREAMERS, STREAMER].filter(isLive).map(streamer => streamer.name))].sort();

        NEW_STREAMERS = streamers.join(',').toLowerCase();

        if(!defined(OLD_STREAMERS))
            OLD_STREAMERS = NEW_STREAMERS;

        let old_names = OLD_STREAMERS.split(',').filter(defined),
            new_names = NEW_STREAMERS.split(',').filter(defined),
            bad_names = BAD_STREAMERS?.split(',')?.filter(defined)?.filter(parseBool);

        // Detect if the channels got removed incorrectly?
        if(bad_names?.length) {
            WARN('Twitch failed to add these channels correctly:', bad_names, JSON.stringify({ ...STREAMER, chat: null, jump: null, date: new Date })).toNativeStack();

            BAD_STREAMERS = "";

            SaveCache({ BAD_STREAMERS });
        } else if(!defined($('#sideNav .side-nav-section[aria-label][tt-section-label="followed"i] a[class*="side-nav-card"i]'))) {
            WARN("[Followed Channels] is missing. Reloading...");

            SaveCache({ BAD_STREAMERS: OLD_STREAMERS });

            // Failed to get channel at...
            PushToTopSearch({ 'tt-ftgca': (+new Date).toString(36) });
        }

        if(OLD_STREAMERS == NEW_STREAMERS)
            return JUDGE__STOP_WATCH('first_in_line_plus'), SaveCache({ OLD_STREAMERS });

        new_names = new_names
            .filter(name => !old_names.contains(name))
            .filter(name => !bad_names.contains(name));

        if(new_names.length < 1)
            return JUDGE__STOP_WATCH('first_in_line_plus'), SaveCache({ OLD_STREAMERS });

        // Try to detect if the extension was just re-installed?
        installation_viewer:
        switch(ON_INSTALLED_REASON ||= Settings.onInstalledReason) {
            case CHROME_UPDATE:
            case SHARED_MODULE_UPDATE: {
                // Not used. Ignore
            } break;

            case INSTALL: {
                // Ignore all current streamers; otherwise this will register them all
                new_names = [];
            } break;

            case UPDATE:
            default: {
                // Should function normally
            } break;
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

        JUDGE__STOP_WATCH('first_in_line_plus');
    };
    Timers.first_in_line_plus = 1_000;

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
    let STARTED_WATCHING = (+new Date);

    LoadCache(['WatchTime'], ({ WatchTime = 0 }) => {
        STARTED_WATCHING -= WatchTime;
    });

    function GET_WATCH_TIME() {
        return (+new Date) - STARTED_WATCHING;
    }

    Handlers.auto_follow_raids = () => {
        START__STOP_WATCH('auto_follow_raids');

        if(!defined(STREAMER))
            return JUDGE__STOP_WATCH('auto_follow_raids');

        let url = parseURL(top.location),
            data = url.searchParameters;

        let { like, follow } = STREAMER,
            raid = data.referrer === 'raid';

        if(!like && raid)
            follow();

        JUDGE__STOP_WATCH('auto_follow_raids');
    };
    Timers.auto_follow_raids = 1_000;

    __AutoFollowRaid__:
    if(parseBool(Settings.auto_follow_raids) || parseBool(Settings.auto_follow_all)) {
        RegisterJob('auto_follow_raids');
    }

    let AUTO_FOLLOW_EVENT;
    Handlers.auto_follow_time = async() => {
        START__STOP_WATCH('auto_follow_time');

        let { like, follow } = STREAMER,
            mins = parseInt(Settings.auto_follow_time_minutes) | 0;

        if(!like) {
            let secs = GET_WATCH_TIME() / 1000;

            if(secs > (mins * 60))
                follow();

            AUTO_FOLLOW_EVENT ??= setTimeout(follow, mins * 60_000);
        }

        JUDGE__STOP_WATCH('auto_follow_time');
    };
    Timers.auto_follow_time = 1_000;

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
        START__STOP_WATCH('kill_extensions');

        let extension_views = $('[class^="extension-view"i]', true);

        for(let view of extension_views)
            view.setAttribute('style', 'display:none!important');

        JUDGE__STOP_WATCH('kill_extensions');
    };
    Timers.kill_extensions = 5_000;

    Unhandlers.kill_extensions = () => {
        let extension_views = $('[class^="extension-view"i]', true);

        for(let view of extension_views)
            view.removeAttribute('style');
    };

    __KillExtensions__:
    if(parseBool(Settings.kill_extensions)) {
        REMARK("Adding extension killer...");

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
        START__STOP_WATCH('prevent_hosting');

        let hosting = defined($('[data-a-target="hosting-indicator"i], [class*="channel-status-info--hosting"i]')),
            next = await GetNextStreamer(),
            host_banner = $('[href^="/"] h1, [href^="/"] > p, [data-a-target="hosting-indicator"i]', true).map(element => element.innerText),
            host = (STREAMER.name ?? ''),
            [guest] = host_banner.filter(name => name.toLowerCase() != host.toLowerCase());

        guest ??= "anonymous";

        let method = Settings.prevent_hosting ?? "none";

        host_stopper:
        if(hosting) {
            // Ignore followed channels
            if(["unfollowed"].contains(method)) {
                let streamer = STREAMERS.find(channel => RegExp(`^${guest}$`, 'i').test(channel.name));

                // The channel being hosted (guest) is already in "followed." No need to leave
                if(defined(streamer)) {
                    LOG(`[HOSTING] ${ guest } is already followed. Just head to the channel`);

                    open(streamer.href, '_self');
                    break host_stopper;
                }
            }

            for(let job of STREAMER.__eventlisteners__.onhost)
                job({ hosting });

            if(defined(next)) {
                LOG(`${ host } is hosting ${ guest }. Moving onto next channel (${ next.name })`, next.href, new Date);

                open(next.href, '_self');
            } else {
                LOG(`${ host } is hosting ${ guest }. There doesn't seem to be any followed channels on right now`, new Date);

                location.reload();
            }
        }

        JUDGE__STOP_WATCH('prevent_hosting');
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
        START__STOP_WATCH('prevent_raiding');

        if(CONTINUE_RAIDING)
            return JUDGE__STOP_WATCH('prevent_raiding');

        let url = parseURL(top.location),
            data = url.searchParameters,
            raided = data.referrer === 'raid',
            raiding = defined($('[data-test-selector="raid-banner"i]')),
            next = await GetNextStreamer(),
            raid_banner = $('[data-test-selector="raid-banner"i] strong', true).map(strong => strong?.innerText),
            from = (raided? null: STREAMER.name),
            [to] = (raided? [STREAMER.name]: raid_banner.filter(name => name.toLowerCase() != from.toLowerCase()));

        let method = Settings.prevent_raiding ?? "none";

        raid_stopper:
        if(raiding || raided) {
            top.onlocationchange = () => setTimeout(() => CONTINUE_RAIDING = false, 5_000);

            // Ignore followed channels
            if(["greed", "unfollowed"].contains(method)) {
                // #1 - Collect the channel points by participating in the raid, then leave
                // #3 should fire automatically after the page has successfully loaded
                if(method == "greed" && raiding) {
                    LOG(`[RAIDING] There is a possiblity to collect bonus points. Do not leave the raid.`, parseURL(`${ location.origin }/${ to }`).pushToSearch({ referrer: 'raid' }, true).href);

                    CONTINUE_RAIDING = true;
                    break raid_stopper;
                }
                // #2 - The channel being raided (to) is already in "followed." No need to leave
                else if(raiding && defined(STREAMERS.find(channel => RegExp(`^${to}$`, 'i').test(channel.name)))) {
                    LOG(`[RAIDING] ${ to } is already followed. No need to leave the raid`);

                    CONTINUE_RAIDING = true;
                    break raid_stopper;
                }
                // #3 - The channel that was raided (to) is already in "followed." No need to leave
                else if(raided && STREAMER.like) {
                    LOG(`[RAIDED] ${ to } is already followed. No need to abort the raid`);

                    CONTINUE_RAIDING = true;
                    // RemoveFromTopSearch(['referrer']);
                    break raid_stopper;
                }
            }

            let leaveStream = () => {
                CONTINUE_RAIDING = false;

                for(let job of STREAMER.__eventlisteners__.onraid)
                    job({ raided, raiding, next });

                if(defined(next)) {
                    LOG(`${ STREAMER.name } ${ raiding? 'is raiding': 'was raided' }. Moving onto next channel (${ next.name })`, next.href, new Date);

                    open(next.href, '_self');
                } else {
                    LOG(`${ STREAMER.name } ${ raiding? 'is raiding': 'was raided' }. There doesn't seem to be any followed channels on right now`, new Date);

                    location.reload();
                }
            };

            // Leave the raided channel after 2mins to ensure points were collected
            CONTINUE_RAIDING = !!setTimeout(leaveStream, 120_000 * +["greed"].contains(method));
        }

        JUDGE__STOP_WATCH('prevent_raiding');
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
    let ClearIntent,
        TwitchPathnames = [USERNAME, '$', '[up]/', 'directory', 'downloads?', 'friends?', 'inventory', 'jobs?', 'moderator', 'search', 'settings', 'subscriptions?', 'team', 'turbo', 'user', 'videos?', 'wallet', 'watchparty'],
        ReservedTwitchPathnames = RegExp(`/(${ TwitchPathnames.join('|') })`, 'i');

    Handlers.stay_live = async() => {
        START__STOP_WATCH('stay_live');

        let next = await GetNextStreamer(),
            { pathname } = top.location;

        try {
            await LoadCache('UserIntent', async({ UserIntent }) => {
                if(parseBool(UserIntent))
                    TwitchPathnames.push(UserIntent);

                RemoveCache('UserIntent');
            });
        } catch(error) {
            return JUDGE__STOP_WATCH('stay_live'), RemoveCache('UserIntent');
        }

        IsntLive:
        if(
            parseBool(Settings.stay_live__ignore_channel_reruns)?
                (true
                    && STREAMER.live
                    && STREAMER.redo
                ):
            !STREAMER.live
        ) {
            if(ReservedTwitchPathnames.test(pathname))
                break IsntLive;

            if(!RegExp(STREAMER?.name, 'i').test(PATHNAME))
                break IsntLive;

            if(defined(next)) {
                WARN(`${ STREAMER?.name } is no longer live. Moving onto next channel (${ next.name })`, next.href, new Date);

                REDO_FIRST_IN_LINE_QUEUE( parseURL(FIRST_IN_LINE_HREF)?.pushToSearch?.({ from: STREAMER?.name })?.href );

                open(`${ next.href }?obit=${ STREAMER?.name }`, '_self');
            } else  {
                WARN(`${ STREAMER?.name } is no longer live. There doesn't seem to be any followed channels on right now`, new Date);
            }

            // After 30 seconds, remove the intent
            ClearIntent ??= setTimeout(RemoveCache, 30_000, 'UserIntent');
        } else if(/\/search\b/i.test(pathname)) {
            let { term } = parseURL(location).searchParameters;

            SaveCache({ UserIntent: term });
        }

        JUDGE__STOP_WATCH('stay_live');
    };
    Timers.stay_live = 7_000;

    __StayLive__:
    if(parseBool(Settings.stay_live)) {
        RegisterJob('stay_live');
    }

    /*** View Mode
     *     __      ___                 __  __           _
     *     \ \    / (_)               |  \/  |         | |
     *      \ \  / / _  _____      __ | \  / | ___   __| | ___
     *       \ \/ / | |/ _ \ \ /\ / / | |\/| |/ _ \ / _` |/ _ \
     *        \  /  | |  __/\ V  V /  | |  | | (_) | (_| |  __/
     *         \/   |_|\___| \_/\_/   |_|  |_|\___/ \__,_|\___|
     *
     *
     */
    Handlers.view_mode = (mode = Settings.view_mode) => SetViewMode(mode);
    Timers.view_mode = -2_500;

    __ViewMode__:
    if(parseBool(Settings.view_mode)) {
        RegisterJob('view_mode');
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

    /*** Highlight Phrases
     *      _    _ _       _     _ _       _     _     _____  _
     *     | |  | (_)     | |   | (_)     | |   | |   |  __ \| |
     *     | |__| |_  __ _| |__ | |_  __ _| |__ | |_  | |__) | |__  _ __ __ _ ___  ___  ___
     *     |  __  | |/ _` | '_ \| | |/ _` | '_ \| __| |  ___/| '_ \| '__/ _` / __|/ _ \/ __|
     *     | |  | | | (_| | | | | | | (_| | | | | |_  | |    | | | | | | (_| \__ \  __/\__ \
     *     |_|  |_|_|\__, |_| |_|_|_|\__, |_| |_|\__| |_|    |_| |_|_|  \__,_|___/\___||___/
     *                __/ |           __/ |
     *               |___/           |___/
     */
    // /chat.js

    /*** Easy Highlighter - NOT A SETTING. This is a helper for "Highlight Phrases"
     *      ______                  _    _ _       _     _ _       _     _
     *     |  ____|                | |  | (_)     | |   | (_)     | |   | |
     *     | |__   __ _ ___ _   _  | |__| |_  __ _| |__ | |_  __ _| |__ | |_ ___ _ __
     *     |  __| / _` / __| | | | |  __  | |/ _` | '_ \| | |/ _` | '_ \| __/ _ \ '__|
     *     | |___| (_| \__ \ |_| | | |  | | | (_| | | | | | | (_| | | | | ||  __/ |
     *     |______\__,_|___/\__, | |_|  |_|_|\__, |_| |_|_|_|\__, |_| |_|\__\___|_|
     *                       __/ |            __/ |           __/ |
     *                      |___/            |___/           |___/
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

    /*** Notification Sounds
     *      _   _       _   _  __ _           _   _                _____                       _
     *     | \ | |     | | (_)/ _(_)         | | (_)              / ____|                     | |
     *     |  \| | ___ | |_ _| |_ _  ___ __ _| |_ _  ___  _ __   | (___   ___  _   _ _ __   __| |___
     *     | . ` |/ _ \| __| |  _| |/ __/ _` | __| |/ _ \| '_ \   \___ \ / _ \| | | | '_ \ / _` / __|
     *     | |\  | (_) | |_| | | | | (_| (_| | |_| | (_) | | | |  ____) | (_) | |_| | | | | (_| \__ \
     *     |_| \_|\___/ \__|_|_| |_|\___\__,_|\__|_|\___/|_| |_| |_____/ \___/ \__,_|_| |_|\__,_|___/
     *
     *
     */
    let NOTIFIED = { mention: 0, phrase: 0, whisper: 0 },
        NOTIFICATION_EVENTS = {},
        NOTIFICATION_SOUND = (null
            ?? $('audio#tt-notification-sound')
            ?? furnish('audio#tt-notification-sound', {
                style: 'display:none',

                innerHTML: [
                    // 'mp3',
                    'ogg',
                ]
                    .map(type => {
                        let types = { mp3: 'mpeg' },
                            src = Extension.getURL(`aud/${ Settings.whisper_audio_sound ?? "goes-without-saying-608" }.${ type }`);
                        type = `audio/${ types[type] ?? type }`;

                        return furnish('source', { src, type }).outerHTML;
                    }).join('')
            })
        );

    /*** Mention Audio
     *      __  __            _   _                                 _ _
     *     |  \/  |          | | (_)                 /\            | (_)
     *     | \  / | ___ _ __ | |_ _  ___  _ __      /  \  _   _  __| |_  ___
     *     | |\/| |/ _ \ '_ \| __| |/ _ \| '_ \    / /\ \| | | |/ _` | |/ _ \
     *     | |  | |  __/ | | | |_| | (_) | | | |  / ____ \ |_| | (_| | | (_) |
     *     |_|  |_|\___|_| |_|\__|_|\___/|_| |_| /_/    \_\__,_|\__,_|_|\___/
     *
     *
     */
    Handlers.mention_audio = () => {
        START__STOP_WATCH('mention_audio');

        // Play sound on new message
        NOTIFICATION_EVENTS.onmention ??= GetChat.onnewmessage = lines => {
            for(let { mentions } of lines)
                if(mentions.contains(USERNAME) && !NOTIFICATION_SOUND?.playing)
                    NOTIFICATION_SOUND?.play();
        };

        JUDGE__STOP_WATCH('mention_audio');
    };
    Timers.mention_audio = 1_000;

    Unhandlers.mention_audio = () => {
        NOTIFICATION_SOUND?.pause();
    };

    __NotificationSounds_Mentions__:
    if(parseBool(Settings.mention_audio)) {
        RegisterJob('mention_audio');
    }

    /*** Phrase Audio
     *      _____  _                                            _ _
     *     |  __ \| |                            /\            | (_)
     *     | |__) | |__  _ __ __ _ ___  ___     /  \  _   _  __| |_  ___
     *     |  ___/| '_ \| '__/ _` / __|/ _ \   / /\ \| | | |/ _` | |/ _ \
     *     | |    | | | | | | (_| \__ \  __/  / ____ \ |_| | (_| | | (_) |
     *     |_|    |_| |_|_|  \__,_|___/\___| /_/    \_\__,_|\__,_|_|\___/
     *
     *
     */
    Handlers.phrase_audio = () => {
        START__STOP_WATCH('phrase_audio');

        // Play sound on new message
        NOTIFICATION_EVENTS.onphrase ??= GetChat.onnewmessage = lines => {
            for(let { element } of lines)
                if(element.hasAttribute('tt-light') && !NOTIFICATION_SOUND?.playing)
                    NOTIFICATION_SOUND?.play();
        };

        JUDGE__STOP_WATCH('phrase_audio');
    };
    Timers.phrase_audio = 1_000;

    Unhandlers.phrase_audio = () => {
        NOTIFICATION_SOUND?.pause();
    };

    __NotificationSounds_Phrases__:
    if(parseBool(Settings.phrase_audio)) {
        RegisterJob('phrase_audio');
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
    Handlers.whisper_audio = () => {
        START__STOP_WATCH('whisper_audio');

        // Play sound on new message
        NOTIFICATION_EVENTS.onwhisper ??= GetChat.onwhisper = ({ unread, highlighted, message }) => {
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
            return JUDGE__STOP_WATCH('whisper_audio'), NOTIFIED.whisper = 0;
        if(NOTIFIED.whisper >= unread)
            return JUDGE__STOP_WATCH('whisper_audio');
        NOTIFIED.whisper = unread;

        NOTIFICATION_SOUND?.play();

        JUDGE__STOP_WATCH('whisper_audio');
    };
    Timers.whisper_audio = 1_000;

    Unhandlers.whisper_audio = () => {
        NOTIFICATION_SOUND?.pause();
    };

    __NotificationSounds_Whispers__:
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
        START__STOP_WATCH('points_receipt_placement');

        let placement;

        if((placement = Settings.points_receipt_placement ??= "null") == "null")
            return JUDGE__STOP_WATCH('points_receipt_placement');

        let live_time = $('.live-time');

        if(!defined(live_time))
            return JUDGE__STOP_WATCH('points_receipt_placement');

        let classes = element => [...element.classList].map(label => '.' + label).join('');

        let container = live_time.closest(`*:not(${ classes(live_time) })`),
            parent = container.closest(`*:not(${ classes(container) })`);

        let f = furnish;
        let points_receipt =
        f(`${ container.tagName }${ classes(container) }`, {},
            f(`${ live_time.tagName }#tt-points-receipt${ classes(live_time).replace(/\blive-time\b/gi, 'points-receipt') }`, { receipt: 0 })
        );

        parent.append(points_receipt);

        RECEIPT_TOOLTIP ??= new Tooltip(points_receipt);

        COUNTING_POINTS = setInterval(() => {
            let points_receipt = $('#tt-points-receipt'),
                balance = $('[data-test-selector="balance-string"i]'),
                exact_debt = $('[data-test-selector^="prediction-checkout"i], [data-test-selector*="user-prediction"i][data-test-selector*="points"i], [data-test-selector*="user-prediction"i] p, [class*="points-icon"i] ~ p *:not(:empty)'),
                exact_change = $('[class*="community-points-summary"i][class*="points-add-text"i]');

            let [chat] = $('[role="log"i], [data-test-selector="banned-user-message"i], [data-test-selector^="video-chat"i]', true);

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

            if(+animationID)
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
                case "round100": {
                    // Round to nearest hundred
                    receipt = receipt.floorToNearest(100);
                } break;

                case "round50": {
                    // Round to nearest fifty (half)
                    receipt = receipt.floorToNearest(50);
                } break;

                case "round25": {
                    // Round to nearest twenty-five (quarter)
                    receipt = receipt.floorToNearest(25);
                } break;

                case "null":
                default: {
                    // Do nothing...
                } break;
            }

            RECEIPT_TOOLTIP.innerHTML = `${ comify(abs(EXACT_POINTS_EARNED)) } &uarr; | ${ comify(abs(EXACT_POINTS_SPENT)) } &darr;`;
            points_receipt.innerHTML = `${ glyph } ${ abs(receipt).suffix(`&${ 'du'[+(receipt >= 0)] }arr;`, 1, 'natural').replace(/\.0+/, '') }`;
        }, 100);

        JUDGE__STOP_WATCH('points_receipt_placement');
    };
    Timers.points_receipt_placement = -2_500;

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
    let pointWatcherCounter = 0,
        balanceButton = $('[data-test-selector="balance-string"i]')?.closest('button'),
        hasPointsEnabled = false;

    Handlers.point_watcher_placement = async() => {
        START__STOP_WATCH('point_watcher_placement');

        let richTooltip = $('[class*="channel-tooltip"i]');

        // Update the points (every minute)
        if(++pointWatcherCounter % 240) {
            pointWatcherCounter = 0;

            LoadCache(['ChannelPoints'], ({ ChannelPoints }) => {
                let [amount, fiat, face, notEarned, pointsToEarnNext] = ((ChannelPoints ??= {})[STREAMER.name] ?? 0).toString().split('|'),
                    allRewards = $('[data-test-selector="cost"i]', true),
                    balance = $('[data-test-selector="balance-string"i]');

                hasPointsEnabled ||= defined(balance);

                amount = (balance?.innerText ?? (hasPointsEnabled? amount: '&#128683;'));
                fiat = (STREAMER?.fiat ?? fiat ?? 0);
                face = (STREAMER?.face ?? face ?? '');
                notEarned = (
                    (allRewards?.length)?
                        allRewards.filter(amount => parseCoin(amount?.innerText) > STREAMER.coin).length:
                    (notEarned > -Infinity)?
                        notEarned:
                    -1
                );
                pointsToEarnNext = (
                    (allRewards?.length)?
                        allRewards
                            .map(amount => (parseCoin(amount?.innerText) > STREAMER.coin? parseCoin(amount?.innerText) - STREAMER.coin: 0))
                            .sort((x, y) => (x > y? -1: +1))
                            .filter(x => x > 0)
                            .pop():
                    (notEarned > -Infinity)?
                        pointsToEarnNext:
                    0
                );

                face = face?.replace(/^(?:https?:.*?)?([\d]+\/[\w\-\.\/]+)$/i, '$1');

                ChannelPoints[STREAMER.name] = [amount, fiat, face, notEarned, pointsToEarnNext].join('|');

                SaveCache({ ChannelPoints });
            });
        }

        // Color the balance text
        $('[data-test-selector="balance-string"i]')?.setAttribute('tt-earned-all', await STREAMER.done);

        if(!defined(richTooltip))
            return JUDGE__STOP_WATCH('point_watcher_placement');

        // Remove the old face and values...
        $('.tt-point-amount, .tt-point-face', true).map(element => element?.remove());

        let [title, subtitle, ...footers] = $('[class*="channel-tooltip"i] > *', true, richTooltip),
            footer = footers[footers.length - 1],
            target = footer?.lastElementChild;

        if(!defined(subtitle)) {
            let [rTitle, rSubtitle] = $('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="metadata"i] > *', true),
                rTarget = $('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="status"i]');

            title = rTitle;
            subtitle = rSubtitle;
            target = rTarget;
        }

        if(!defined(title) || !defined(target))
            return JUDGE__STOP_WATCH('point_watcher_placement');

        let [name, game] = title.innerText.split(/[^\w\s]/);

        name = name?.trim();
        game = game?.trim();

        // Update the display
        LoadCache(['ChannelPoints'], ({ ChannelPoints = {} }) => {
            let [amount, fiat, face, notEarned, pointsToEarnNext] = (ChannelPoints[name] ?? 0).toString().split('|'),
                style = new CSSObject({ verticalAlign: 'bottom', height: '20px', width: '20px' }),
                allRewards = $('[data-test-selector="cost"i]', true),
                upNext = !!~(ALL_FIRST_IN_LINE_JOBS ?? []).findIndex(href => RegExp(`/${ name }\\b`, 'i').test(href));

            notEarned = (
                (allRewards?.length)?
                    allRewards.filter(amount => parseCoin(amount?.innerText) > STREAMER.coin).length:
                (notEarned > -Infinity)?
                    notEarned:
                -1
            );
            pointsToEarnNext = (
                (allRewards?.length)?
                    allRewards
                        .map(amount => (parseCoin(amount?.innerText) > STREAMER.coin? parseCoin(amount?.innerText) - STREAMER.coin: 0))
                        .sort((x, y) => (x > y? -1: +1))
                        .filter(x => x > 0)
                        .pop():
                (notEarned > -Infinity)?
                    pointsToEarnNext:
                0
            );

            let text = furnish('span.tt-point-amount', {
                    'tt-earned-all': notEarned == 0,
                    innerHTML: amount.toLocaleString(),
                }),
                icon = face?.length?
                    furnish('span.tt-point-face', {
                        innerHTML: ` | ${ furnish('img', { src: `https://static-cdn.jtvnw.net/channel-points-icons/${face}`, style: style.toString() }).outerHTML } `,
                    }):
                furnish('span.tt-point-face', {
                    innerHTML: ` | ${ Glyphs.modify('channelpoints', { style, ...style.toObject() }) } `,
                });

            target.append(icon);
            target.append(text);

            target.closest('[role="dialog"i]')?.setAttribute('tt-in-up-next', upNext);
        });

        JUDGE__STOP_WATCH('point_watcher_placement');
    };
    Timers.point_watcher_placement = 250;

    Unhandlers.point_watcher_placement = () => {
        $('.tt-point-amount', true)
            .forEach(span => span?.remove());
    };

    __PointWatcherPlacement__:
    if(parseBool(Settings.point_watcher_placement)) {
        RegisterJob('point_watcher_placement');

        if(defined(balanceButton)) {
            balanceButton.click();
            setTimeout(() => balanceButton.click(), 300);
        }
    }

    // Stream Preview
    let STREAM_PREVIEW;

    Handlers.stream_preview = async() => {
        START__STOP_WATCH('stream_preview');

        let richTooltip = $('[class*="channel-tooltip"i]:not([class*="offline"i])');

        if(!defined(richTooltip)) {
            if(parseBool(Settings.stream_preview_sound) && MAINTAIN_VOLUME_CONTROL)
                SetVolume(parseBool(Settings.away_mode__volume_control) && AwayModeStatus? Settings.away_mode__volume: InitialVolume ?? 1);
            else if(parseBool(Settings.stream_preview_sound) && defined(STREAM_PREVIEW?.element))
                SetVolume(InitialVolume);

            return JUDGE__STOP_WATCH('stream_preview'), STREAM_PREVIEW = { element: STREAM_PREVIEW?.element?.remove() };
        }

        let [title, subtitle, ...footers] = $('[class*="channel-tooltip"i] > *', true, richTooltip);

        if(!defined(subtitle)) {
            let [rTitle, rSubtitle] = $('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="metadata"i] > *', true);

            title = rTitle;
            subtitle = rSubtitle;
        }

        if(!defined(title))
            return JUDGE__STOP_WATCH('stream_preview'), STREAM_PREVIEW?.element?.remove();

        let [name] = title.innerText.split(/[^\w\s]/);

        name = name?.trim()?.toLowerCase();

        // There is already a preview of the hovered tooltip
        if([STREAMER?.name, STREAM_PREVIEW?.name].map(name => name?.toLowerCase()).contains(name))
            return JUDGE__STOP_WATCH('stream_preview');

        let { top, left, bottom, right, height, width } = getOffset(richTooltip),
            [body, video] = $('body, video', true).map(getOffset);

        STREAM_PREVIEW?.element?.remove();

        let scale = parseFloat(Settings.stream_preview_scale) || 1,
            muted = !parseBool(Settings.stream_preview_sound),
            quality = (scale > 1? 'auto': '720p'),
            watchParty = defined($('[data-a-target^="watchparty"i][data-a-target*="overlay"i]')),
            controls = false;

        STREAM_PREVIEW = {
            name,
            element:
                furnish('div.tt-stream-preview.invisible', {
                        style: (
                            (top < body.height / 2)?
                                // Below tooltip
                                `--below: tooltip; top: calc(${ bottom + height }px);`:
                            // Above tooltip
                            `--above: tooltip; top: calc(${ top - height }px - (15rem * ${ scale }));`
                        ) + `left: calc(${ (watchParty? getOffset($('[data-a-target^="side-nav-bar"i]'))?.width: video?.left) ?? 50 }px - 6rem); height: calc(15rem * ${ scale }); width: calc(26.75rem * ${ scale });`,
                    },
                    furnish('div.tt-stream-preview--poster', {
                        style: `background-image: url("https://static-cdn.jtvnw.net/previews-ttv/live_user_${ name }-1280x720.jpg?${ +new Date }");`,
                        onerror: event => {
                            // Do something if the stream's live preview poster doesn't load...
                        },
                    }),
                    furnish(`iframe.tt-stream-preview--iframe`, {
                        allow: 'autoplay',
                        src: parseURL(`https://player.twitch.tv/`).pushToSearch({
                            channel: name,
                            parent: 'twitch.tv',

                            controls, muted, quality,
                        }).href,

                        height: '100%',
                        width: '100%',

                        onload: event => {
                            $('.tt-stream-preview--poster')?.classList?.add('invisible');

                            if(!parseBool(Settings.stream_preview_sound))
                                return;

                            if(!defined(InitialVolume))
                                InitialVolume = GetVolume();

                            let hasAudio = element =>
                                parseBool(null
                                    ?? element?.webkitAudioDecodedByteCount
                                    ?? element?.audioTracks?.length
                                );

                            let audioChecker =
                            setInterval(() => {
                                let doc = $('.tt-stream-preview--iframe')?.contentDocument;

                                if(!defined(doc))
                                    return;

                                let playingAudio = hasAudio($('video', false, doc));

                                if(!playingAudio)
                                    return;

                                SetVolume(0);
                                clearInterval(audioChecker);
                            }, 100);
                        },
                    })
                )
        };

        document.body.append(STREAM_PREVIEW.element);

        setTimeout(() => $('.tt-stream-preview.invisible')?.classList?.remove('invisible'), 100);

        JUDGE__STOP_WATCH('stream_preview');
    };
    Timers.stream_preview = 500;

    Unhandlers.stream_preview = () => {
        STREAM_PREVIEW = { element: STREAM_PREVIEW?.element?.remove() };
    };

    __StreamPreview__:
    if(parseBool(Settings.stream_preview)) {
        REMARK('Adding Stream previews...');

        top.onlocationchange = Unhandlers.stream_preview;

        RegisterJob('stream_preview');
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
            case 'over': {
                container = live_time.closest(`*:not(${ classes(live_time) })`);
                parent = $('[data-a-target="player-controls"i] [class*="player-controls"i][class*="left-control-group"i]');
                color = 'white';
            } break;

            // Option 2 "under" - under quick actions, live count/live time area
            case 'under': {
                container = live_time.closest(`*:not(${ classes(live_time) })`);
                parent = container.closest(`*:not(${ classes(container) })`);

                extra = ({ live_time }) => {
                    live_time.setAttribute('style', 'color:var(--color-text-live)');

                    if(parseBool(Settings.show_stats))
                        live_time.tooltipAnimation = setInterval(() => {
                            live_time.tooltip ??= new Tooltip(live_time, '');

                            let percentage = (STREAMER.time / (STREAMER.data?.dailyBroadcastTime ?? 16_200_000)).clamp(0, 1),
                                timeLeft = (STREAMER.data?.dailyBroadcastTime ?? 16_200_000) - STREAMER.time;

                            live_time.tooltip.innerHTML = (timeLeft < 0? '+': '') + toTimeString(Math.abs(timeLeft), 'clock');
                            live_time.tooltip.setAttribute('style', `background:linear-gradient(90deg, hsla(${ (120 * percentage) | 0 }, 100%, 50%, 0.5) ${ (100 * percentage).toFixed(2) }%, #0000 0), var(--color-background-tooltip)`);
                        }, 100);
                };
            } break;

            default: return;
        }

        let f = furnish;
        let watch_time = f(`${ container.tagName }${ classes(container) }`,
            { style: `color: var(--color-${ color })` },
            f(`${ live_time.tagName }#tt-watch-time${ classes(live_time).replace(/\blive-time\b/gi, 'watch-time') }`, { time: 0 })
        );

        WATCH_TIME_TOOLTIP = new Tooltip(watch_time);

        parent.append(watch_time);

        extra({ parent, container, live_time, placement });

        LoadCache(['WatchTime', 'Watching'], ({ WatchTime = 0, Watching = NORMALIZED_PATHNAME }) => {
            if(NORMALIZED_PATHNAME != Watching)
                STARTED_WATCHING = (+new Date);

            WATCH_TIME_INTERVAL = setInterval(() => {
                let watch_time = $('#tt-watch-time'),
                    time = GET_WATCH_TIME();

                if(!defined(watch_time)) {
                    clearInterval(WATCH_TIME_INTERVAL);
                    return RestartJob('watch_time_placement');
                }

                watch_time.setAttribute('time', time);
                watch_time.innerHTML = toTimeString(time, 'clock');

                if(parseBool(Settings.show_stats))
                    WATCH_TIME_TOOLTIP.innerHTML = comify(parseInt(time / 1000)) + 's';

                SaveCache({ WatchTime: time });
            }, 1000);
        }).then(() => SaveCache({ Watching: NORMALIZED_PATHNAME }));
    };
    Timers.watch_time_placement = -1_000;

    Unhandlers.watch_time_placement = () => {
        clearInterval(WATCH_TIME_INTERVAL);

        $('#tt-watch-time')?.parentElement?.remove();

        let live_time = $('.live-time');

        live_time?.removeAttribute('style');
        live_time?.tooltip?.remove?.();
        clearInterval(live_time?.tooltipAnimation);

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
        PAGE_HAS_FOCUS = document.visibilityState === "visible",
        VIDEO_OVERRIDE = false;

    Handlers.recover_frames = () => {
        START__STOP_WATCH('recover_frames');

        let video = $('video') ?? $('video', false, $('#tt-embedded-video')?.contentDocument);

        if(!defined(video))
            return JUDGE__STOP_WATCH('recover_frames');

        let { paused } = video,
            isTrusted = defined($('button[data-a-player-state="paused"i]')),
            isAdvert = defined($('[data-a-target*="ad-countdown"i]')),
            { creationTime, totalVideoFrames } = video.getVideoPlaybackQuality();

        // Time that's passed since creation. Should constantly increase
        CREATION_TIME ??= creationTime;

        // The total number of frames created. Should constantly increase
        TOTAL_VIDEO_FRAMES ??= totalVideoFrames;

        // if the page isn't in focus, ignore this setting
        // if the video is paused by the user (trusted) move on
        if((paused && isTrusted) || PAGE_HAS_FOCUS === false)
            return JUDGE__STOP_WATCH('recover_frames');

        // The video is stalling: either stuck on the same frame, or lagging behind 15 frames
        if(creationTime !== CREATION_TIME && (totalVideoFrames === TOTAL_VIDEO_FRAMES || totalVideoFrames - TOTAL_VIDEO_FRAMES < 15)) {
            if(SECONDS_PAUSED_UNSAFELY > 0 && !(SECONDS_PAUSED_UNSAFELY % 5))
                WARN(`The video has been stalling for ${ SECONDS_PAUSED_UNSAFELY }s`, { CREATION_TIME, TOTAL_VIDEO_FRAMES, SECONDS_PAUSED_UNSAFELY }, 'Frames fallen behind:', totalVideoFrames - TOTAL_VIDEO_FRAMES);

            if(SECONDS_PAUSED_UNSAFELY > 5 && !(SECONDS_PAUSED_UNSAFELY % 3)) {
                __RecoverFrames_Embed__:
                if(parseBool(Settings.recover_frames__allow_embed)) {
                    WARN(`Attempting to override the video`);

                    let container = $('video')?.closest('[class*="container"i]');

                    if(!defined(container))
                        break __RecoverFrames_Embed__;

                    let { name } = STREAMER,
                        controls = true,
                        muted = true;

                    container.replaceChild(
                        furnish(`iframe#tt-embedded-video`, {
                            allow: 'autoplay',
                            src: parseURL(`https://player.twitch.tv/`).pushToSearch({
                                channel: name,
                                parent: 'twitch.tv',

                                controls, muted,
                            }).href,

                            style: `border: 1px solid var(--color-warn)`,

                            height: '100%',
                            width: '100%',

                            onload: event => {
                                let hasVideo = element => defined(element) && /(video)/i.test(element.tagName);

                                awaitOn(() => {
                                    let doc = $('#video')?.contentDocument;

                                    if(!defined(doc))
                                        return /* No document */;

                                    let loadedVideo = hasVideo($('video', false, doc));

                                    if(!loadedVideo)
                                        return /* No video */;

                                    let video = $('video', false, doc);

                                    if((video.currentTime || 0) <= 0)
                                        return /* Video not loading */;

                                    return VIDEO_OVERRIDE = true;
                                }, 100);
                            },
                        }),

                        container.firstElementChild
                    );

                    new Tooltip($('#tt-embedded-video'), `${ name }'${ /s$/.test(name)? '': 's' } stream ran into an error`);
                } else {
                    WARN(`Attempting to pause/play the video`);

                    let state = $('button[data-a-player-state]')?.getAttribute('data-a-player-state')?.toLowerCase?.();

                    if(state == "playing") {
                        $('button[data-a-player-state]').click();

                        setTimeout(() => $('button[data-a-player-state]').click(), 1000);
                    }
                }
            }

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

        JUDGE__STOP_WATCH('recover_frames');
    };
    Timers.recover_frames = 1_000;

    __RecoverFrames__:
    if(parseBool(Settings.recover_frames)) {
        document.addEventListener('visibilitychange', event => PAGE_HAS_FOCUS = document.visibilityState === "visible");

        RegisterJob('recover_frames');

        WARN("[Recover-Frames] is monitoring the stream...");
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
        START__STOP_WATCH('recover_stream');

        if(!defined(video))
            return JUDGE__STOP_WATCH('recover_stream');

        let { paused } = video,
            isTrusted = defined($('button[data-a-player-state="paused"i]')),
            isAdvert = defined($('[data-a-target*="ad-countdown"i]'));

        // Leave the video alone
            // if the video isn't paused
            // if the video was paused by the user (trusted)
            // if the video is an ad AND auto-play ads is disabled
            // if the player event-timeout has been set
        if(!paused || isTrusted || (isAdvert && !parseBool(Settings.recover_ads)) || VIDEO_PLAYER_TIMEOUT > -1)
            return JUDGE__STOP_WATCH('recover_stream');

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
                WARN("No video controls presented.");

                break __RecoverVideoProgramatically__;
            } if(attempts > 3) {
                WARN("Automatic attempts are not helping.");

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

        JUDGE__STOP_WATCH('recover_stream');
    };
    Timers.recover_stream = 2_500;

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

    Handlers.recover_video = async() => {
        START__STOP_WATCH('recover_video');

        let errorMessage = $('[data-a-target^="player"i][data-a-target$="content-gate"i] [data-test-selector*="text"i]');

        if(!defined(errorMessage))
            return JUDGE__STOP_WATCH('recover_video');

        if(RECOVERING_VIDEO)
            return JUDGE__STOP_WATCH('recover_video');
        RECOVERING_VIDEO = true;

        errorMessage = errorMessage.textContent;

        if(/subscribe|mature/i.test(errorMessage)) {
            let next = await GetNextStreamer();

            // Subscriber only, etc.
            if(defined(next))
                open(next.href, '_self');
        } else {
            ERROR('The stream ran into an error:', errorMessage, new Date);

            // Failed to play video at...
            PushToTopSearch({ 'tt-ftpva': (+new Date).toString(36) });
        }

        JUDGE__STOP_WATCH('recover_video');
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
        $('[data-a-target="followed-channel"i], #sideNav .side-nav-section[aria-label][tt-section-label="followed"i] [href^="/"], [data-test-selector*="search-result"i][data-test-selector*="channel"i] a:not([href*="/search?"])', true).map(a => {
            a.addEventListener('mouseup', async event => {
                let { currentTarget } = event;

                let url = parseURL(currentTarget.href),
                    UserIntent = url.pathname.replace('/', '');

                SaveCache({ UserIntent });
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
    Handlers.recover_pages = async() => {
        START__STOP_WATCH('recover_pages');

        let error = $('[data-a-target="core-error-message"i]');

        if(!defined(error))
            return JUDGE__STOP_WATCH('recover_pages');

        let message = error.innerText,
            next = await GetNextStreamer();

        ERROR(message);

        if(/content.*unavailable/i.test(message) && defined(next))
            open(next.href, '_self');
        else
            location.reload();

        JUDGE__STOP_WATCH('recover_pages');
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
        // There is a valid username
        && defined(USERNAME)
        // The follow button exists
        && defined($(`[data-a-target="follow-button"i], [data-a-target="unfollow-button"i]`))
        // There are channel buttons on the side
        && $('#sideNav .side-nav-section[aria-label]', true)?.length
        && (false
            // There is a message container
            || defined($('[data-test-selector$="message-container"i]'))
            // There is an ongoing search
            || (true
                && defined($('[data-test-selector*="search-result"i][data-test-selector$="name"i]', true))
                && defined($('[data-a-target^="threads-box-"i]'))
            )
            // The page is a channel viewing page
            // || /^(ChannelWatch|SquadStream|VideoWatch)Page$/i.test($('#root')?.dataset?.aPageLoadedName)
            // There is an error message
            || defined($('[data-a-target="core-error-message"i]'))
        )
    );

    if(ready) {
        LOG("Main container ready");

        Settings = await GetSettings();

        // Set the usre's language
        let [documentLanguage] = (top.navigator?.userLanguage ?? top.navigator?.language ?? 'en').toLocaleLowerCase().split('-').reverse().pop();

        top.LANGUAGE = LANGUAGE = Settings.user_language_preference ?? documentLanguage;

        // Give the storage 1s to perform any "catch-up"
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

                            NORMALIZED_PATHNAME = PATHNAME
                                // Remove common "modes"
                                .replace(/^(moderator)\/(\/[^\/]+?)/i, '$1')
                                .replace(/^(\/[^\/]+?)\/(about|schedule|squad|videos)\b/i, '$1');

                            for(let [name, func] of __ONLOCATIONCHANGE__)
                                func(new CustomEvent('locationchange', { from: OLD_HREF, to: PATHNAME }));
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
                                author = handle.toLowerCase().replace(/[^]+?\((\w+)\)/, '$1'),
                                message = $('[data-test-selector="chat-message-separator"i] ~ * > *', true, line),
                                mentions = $('.mention-fragment', true, line).map(element => element.innerText.replace('@', '').toLowerCase()).filter(text => /^[a-z_]\w+$/i.test(text)),
                                badges = $('.chat-badge', true, line).map(img => img.alt.toLowerCase()),
                                style = $('.chat-line__username [style]', true, line).map(element => element.getAttribute('style')).join(';'),
                                reply = $('button[data-test-selector="chat-reply-button"i]', false, line);

                            let raw = line.innerText?.trim(),
                                containedEmotes = [];

                            message = message
                                .map(element => {
                                    let string;

                                    if(keepEmotes && ((element.dataset.testSelector == 'emote-button') || element.dataset.ttEmote?.length)) {
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

                            // Replace all share URLs
                            // line.innerHTML = line.innerHTML.replace(/\bshare:([\w\-]{8,})/g, ($0, $1) => furnish('a', { href: Runtime.getURL(`settings.html?sync-token=${ $1 }`), target: '_blank', rel: 'noreferrer', referrerpolicy: 'no-referrer' }, `share://${ $1 }`).outerHTML);

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

                    setTimeout(async(results) => {
                        for(let [name, callback] of GetChat.__deferredEvents__.__onnewmessage__)
                            await callback(results);
                    }, 50, results);
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

                            async function parse(callback, { node, highlighted, newmessage }) {
                                if(highlighted) {
                                    await callback({ highlighted });
                                } else if(newmessage) {
                                    let keepEmotes = true;

                                    let handle = $('[data-a-target="whisper-message-name"i]', false, node).innerText,
                                        author = handle.toLowerCase().replace(/[^]+?\((\w+)\)/, '$1'),
                                        message = $('[data-test-selector="separator"i] ~ * > *', true, node),
                                        style = node.getAttribute('style');

                                    let raw = node.innerText;

                                    message = message
                                        .map(element => {
                                            let string;

                                            switch(element.dataset.aTarget) {
                                                case 'emote-name': {
                                                    if(keepEmotes)
                                                        string = `:${ (i=>((emotes[i.alt]=i.src),i.alt))($('img', false, element)) }:`;
                                                } break;

                                                default: {
                                                    string = element.innerText;
                                                } break;
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

                                    await callback({
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

                            for(let [name, callback] of GetChat.__onwhisper__)
                                parse(callback, { node, highlighted, newmessage });

                            setTimeout(async({ node, highlighted, newmessage }) => {
                                for(let [name, callback] of GetChat.__deferredEvents__.__onwhisper__)
                                    await parse(callback, { node, highlighted, newmessage });
                            }, 50, { node, highlighted, newmessage });
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

        // Observe the volume changes
        VolumeObserver: {
            $('[data-a-target^="player-volume"i]')?.addEventListener('mousedown', ({ currentTarget }) => {
                $('[isTrusted], [style]', false, currentTarget.nextElementSibling)?.setAttribute('isTrusted', true);
            });

            $('[data-a-target^="player-volume"i]')?.addEventListener('mouseup', ({ currentTarget }) => {
                $('[isTrusted], [style]', false, currentTarget.nextElementSibling)?.setAttribute('isTrusted', false);
            });

            let target = $('[data-a-target^="player-volume"i] + * [style]'),
                observer = new MutationObserver(mutations => {
                    mutations.map(mutation => {
                        let { style = '', isTrusted = false } = mutation.target?.attributes,
                            css = {};

                        for(let rule of style.value.split(';')) {
                            let [name, value] = rule.split(':', 2);

                            if(name?.length)
                                css[ name.trim() ] = value?.trim();
                        }

                        let volume = parseFloat(css?.width ?? 50) / 100;

                        for(let [name, callback] of GetVolume.__onchange__)
                            callback(volume, { isTrusted: parseBool(isTrusted) });
                    });
                });

            if(!defined(target))
                break VolumeObserver;

            observer.observe(target, { attributes: true, childList: false, subtree: false });
        }

        // Set the SVGs' section IDs
        SectionLabeling: {
            let conversions = {
                favorite:   [
                                "followed"
                            ].reverse(),

                video:      [
                                "suggested",
                                "related",
                            ].reverse(),

                people:     [
                                "friends"
                            ].reverse(),
            };

            for(let container of $('#sideNav .side-nav-section[aria-label]', true)) {
                let svg = $('svg', false, container);

                comparing:
                for(let glyph in Glyphs)
                    if(Glyphs.__exclusionList__.contains(glyph))
                        continue comparing;
                    else
                        resemble(SVGtoImage(svg))
                            .compareTo(SVGtoImage(Glyphs.modify(glyph, { height: 20, width: 20 }).asNode))
                            .ignoreColors()
                            .scaleToSameSize()
                            .onComplete(async data => {
                                let { analysisTime, misMatchPercentage } = data;

                                analysisTime = parseInt(analysisTime);
                                misMatchPercentage = parseFloat(misMatchPercentage);

                                let matchPercentage = 100 - misMatchPercentage;

                                if(matchPercentage < 80 || container.getAttribute('tt-section-label')?.length)
                                    return;

                                // LOG(`Labeling section "${ glyph }" (${ matchPercentage }% match)...`, container);

                                container.setAttribute('tt-section-label', conversions[glyph].pop());
                            });
            }
        }

        top.onlocationchange = () => {
            WARN("[Parent] Re-initializing...");

            Balloon.get('Up Next')?.remove();

            // Do NOT soft-reset ("turn off, turn on") these settings
            // They will be destroyed, including any data they are using
            let VOLATILE = top.VOLATILE = ['first_in_line*'].map(AsteriskFn);

            DestroyingJobs:
            for(let job in Jobs)
                if(!!~VOLATILE.findIndex(name => name.test(job)))
                    continue DestroyingJobs;
                else
                    RestartJob(job);

            Reinitialize:
            if(NORMAL_MODE) {
                if(Settings.keep_popout) {
                    PAGE_CHECKER ??= setInterval(WAIT_FOR_PAGE, 500);

                    break Reinitialize;
                }

                location.reload();
            }
        };

        // Add custom styling
        CustomCSSInitializer: {
            CUSTOM_CSS = $('#tt-custom-css') ?? furnish('style#tt-custom-css', {});

            let [accent, compliment] = (Settings.accent_color ?? 'blue/12').split('/');

            CUSTOM_CSS.innerHTML =
            `
            .tt-first-run {
                border: 1px solid var(--color-blue);
                border-radius: 3px;

                transition: border 1s;
            }

            [animationID] a { cursor: grab }
            [animationID] a:active { cursor: grabbing }

            [class*="theme"i][class*="dark"i] [tt-light="true"i], [class*="theme"i][class*="dark"i] [class*="chat"i][class*="status"i] { background-color: var(--color-opac-w-4) !important }
            [class*="theme"i][class*="light"i] [tt-light="true"i], [class*="theme"i][class*="light"i] [class*="chat"i][class*="status"i] { background-color: var(--color-opac-b-4) !important }

            /* Up Next */
            [up-next--body] {
                background-color: var(--color-${ accent });
                border-radius: 0.5rem;
                color: var(--color-hinted-grey-${ compliment });
            }

            [up-next--body][empty="true"i] {
                background-image: url("${ Extension.getURL('up-next-tutorial.png') }");
                background-repeat: no-repeat;
                background-size: 35rem;
                background-position: bottom left;
                background-blend-mode: normal;
            }

            [up-next--body][allowed="false"i] {
                background-image: url("${ Extension.getURL('256.png') }") !important;
                background-repeat: repeat !important;
                background-size: 5rem !important;
                background-position: center center !important;
                background-blend-mode: soft-light !important;
            }

            [tt-auto-claim-enabled="false"i] { --filter: grayscale(1) }

            [tt-auto-claim-enabled] .text, [tt-auto-claim-enabled] #tt-auto-claim-indicator { font-size: 2rem; transition: all .3s }
            [tt-auto-claim-enabled="false"i] .text { margin-right: -4rem }
            [tt-auto-claim-enabled="false"i] #tt-auto-claim-indicator { margin-left: 2rem !important }

            [tt-auto-claim-enabled] svg, [tt-auto-claim-enabled] img { transition: transform .3s ease 0s }
            [tt-auto-claim-enabled] svg[hover="true"i], [tt-auto-claim-enabled] img[hover="true"i] { transform: translateX(0px) scale(1.2) }

            #tt-auto-focus-stats:not(:hover) ~ #tt-auto-focus-differences {
                opacity: 0.7;
                margin-top: -100%;
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

            [tt-in-up-next="true"i] { border: 1px solid var(--color-${ accent }) !important }
            [role="dialog"i] [tt-earned-all="true"i] { text-decoration: underline 1px var(--color-${ accent }) }
            [data-test-selector="balance-string"i][tt-earned-all="true"i] { text-decoration: underline 3px var(--color-${ accent }) }

            /* Away Mode */
            #away-mode svg[id^="tt-away-mode"i] {
                display: inline-block;

                transform: translateX(0px) scale(1);
                transition: all 100ms ease-in;
            }

            #tt-away-mode--hide {
                position: absolute;
            }

            [tt-away-mode-enabled="true"i] #tt-away-mode--hide, [tt-away-mode-enabled="false"i] #tt-away-mode--show, svg[id^="tt-away-mode"i][preview="false"i] {
                opacity: 0;
            }

            svg[id^="tt-away-mode"i][preview="true"i] {
                opacity: 1 !important;
                transform: translateX(0px) scale(1.2) !important;
            }

            /* Rich tooltips */
            [role] [data-popper-placement="right-start"i] [role] {
                width: max-content;
            }

            /* Bits */
            [aria-describedby*="bits"i] [data-test-selector*="wrapper"i], [aria-labelledby*="bits"i] [data-test-selector*="wrapper"i] {
                max-width: 45rem;
            }

            /* Stream Preview */
            .tt-stream-preview {
                border-radius: 0.6rem;
                box-shadow: #000 0 4px 8px, #000 0 0 4px;
                display: block;
                visibility: visible;

                transition: all 0.5s ease-in;

                position: fixed;
                margin-left: 7rem;
                z-index: 9;

                height: 9rem;
                width: 16rem;
            }

            .tt-stream-preview--poster {
                background-color: #0008;
                background-size: cover;
                border-radius: inherit;
                display: block;

                transition: all 1.5s ease-in;

                position: absolute;
                margin: 0;
                padding: 0;
                left: 0;
                top: 0;
                z-index: 99;

                height: 100% !important;
                width: 100% !important;
            }

            .tt-stream-preview--iframe {
                display: block;
                border-radius: inherit;
                opacity: 1;
                visibility: inherit;
            }

            .invisible {
                opacity: 0;
            }
            `;

            CUSTOM_CSS?.remove();
            $('body').append(CUSTOM_CSS);
        }

        // Update the settings
        SettingsInitializer: {
            switch(Settings.onInstalledReason) {
                // Is this the first time the extension has run?
                // If so, then point out what's been changed
                case INSTALL: {
                    setTimeout(() => {
                        for(let element of $('#tt-auto-claim-bonuses, [up-next--container]', true))
                            element.classList.add('tt-first-run');

                        setTimeout(() => {
                            $('.tt-first-run', true)
                                .forEach(element => element.classList.remove('tt-first-run'));
                        }, 30_000);
                    }, 10_000);
                } break;
            }

            Storage.set({ onInstalledReason: null });
        }

        // Jump some frames
        FrameJumper: {
            top.open('javascript:top.postMessage(__APOLLO_CLIENT__?.cache?.data?.data)', '_self');
        }
    }
}, 500);
