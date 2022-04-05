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
    ANTITHEME,
    THEME__CHANNEL_DARK,
    THEME__CHANNEL_LIGHT,
    THEME__BASE_CONTRAST,
    THEME__PREFERRED_CONTRAST,
    LITERATURE,
    SPECIAL_MODE,
    NORMAL_MODE,
    NORMALIZED_PATHNAME,
    // Hmm...
    JUMPED_FRAMES = false,
    JUMP_DATA = {},
    // Yes...
    IS_TWITCH_ADMIN,
    IS_CHANNEL_MODERATOR,
    IS_CHANNEL_VIP;

// Populate the username field by quickly showing the menu
until(() => UserMenuToggleButton ??= $('[data-a-target="user-menu-toggle"i]'))
    .then(() => {
        UserMenuToggleButton.click();
        ACTIVITY = window.ACTIVITY = $('[data-a-target="presence-text"i]')?.textContent ?? '';
        USERNAME = window.USERNAME = $('[data-a-target="user-display-name"i]')?.textContent ?? null;
        THEME = window.THEME = [...$('html').classList].find(c => /theme-(\w+)/i.test(c)).replace(/[^]*theme-(\w+)/i, '$1').toLowerCase();
        ANTITHEME = window.ANTITHEME = ['light', 'dark'].filter(theme => theme != THEME).pop();

        $('[data-a-target^="language"i]')?.click();
        LITERATURE = window.LITERATURE = $('[data-language] svg')?.closest('button')?.dataset?.language ?? '';
        UserMenuToggleButton.click();

        // Setting the statuses...
        fetch(`https://api.twitchinsights.net/v1/user/status/${ USERNAME }`)
            .then(response => response?.json())
            .then(({ broadcasterType, createdAt, deletedAt, displayName, id, unavailableReason, updatedAt, userType }) => {
                IS_TWITCH_ADMIN = ['admin', 'staff'].contains(userType);
            })
            .catch(WARN);
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

// Displays a balloon (popup)
    // new Balloon({ title:string, icon:string? }[, ...jobs:object={ href:string=URL, message:string?, src:string?, time:string=Date, onremove:function? }]) → Object
    // Balloon.prototype.add(...jobs:object={ href:string=URL, message:string?, src:string?, time:string=Date, onremove:function? }) → Element
    // Balloon.prototype.addButton({ [left:boolean[, icon:string=Glyphs[, onclick:function[, attributes:object]]]] }) → Element
    // Balloon.prototype.remove() → undefined
class Balloon {
    static #BALLOONS = new Map()

    constructor({ title, icon = 'play' }, ...jobs) {
        let f = furnish;

        let [P] = $('.top-nav__menu > div', true).slice(-1),
            X = $('#tt-balloon', false, P),
            I = Runtime.getURL('profile.png'),
            F, C, H, U, N;

        let uuid = U = UUID.from([title, JSON.stringify(jobs)].join(':')).value,
            existing = Balloon.#BALLOONS.get(title);

        if(defined(existing))
            return existing;

        if(defined(X)) {
            if(!Queue.balloons.map(balloon => balloon.uuid).contains(uuid)) {
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
        f('div.tt-align-self-center.tt-flex-grow-0.tt-flex-nowrap.tt-flex-shrink-0.tt-mg-x-05', { style: `animation:1s fade-in 1;` },
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

                                        if(nullish(balloon))
                                            return;

                                        let display = balloon.getAttribute('display') === 'block'? 'none': 'block';

                                        balloon.setAttribute('style', `display:${ display }!important; z-index:9`);
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
                                            f(`div#tt-notification-counter-output--${ U }.tt-number-badge__badge.tt-relative`, {
                                                'interval-id': setInterval(() => {
                                                    let counter = $(`#tt-notification-counter--${ uuid }`),
                                                        output = $(`#tt-notification-counter-output--${ uuid }`),
                                                        length = parseInt(counter?.getAttribute('length'));

                                                    if(nullish(counter) || nullish(output))
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
                                    'tt-mix-blend': (Settings?.accent_color ?? 'twitch-purple/12'),

                                    style: 'min-height:22rem; max-height: 90vh; min-width:40rem; overflow-y: auto;',
                                    role: 'dialog',
                                },
                                // Header
                                f('div.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-c-text-base.tt-elevation-1.tt-flex.tt-flex-shrink-0.tt-pd-x-1.tt-pd-y-05.tt-popover-header', { style: `background-color:inherit; position:sticky; top:0; z-index:99999;` },
                                    f('div.tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-justify-content-center', {},
                                        (H = f(`h5#tt-balloon-header-${ U }.tt-align-center.tt-c-text-alt.tt-semibold`, { style: 'margin-left:4rem!important', contrast: THEME__PREFERRED_CONTRAST, }, title))
                                    ),
                                    f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-button-icon--secondary.tt-core-button.tt-flex.tt-flex-column.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-justify-content-center.tt-mg-l-05.tt-overflow-hidden.tt-popover-header__icon-slot--right.tt-relative',
                                        {
                                            style: 'padding:0.5rem!important; height:3rem!important; width:3rem!important',
                                            contrast: THEME__PREFERRED_CONTRAST,
                                            innerHTML: Glyphs.x,

                                            'connected-to': U,

                                            onclick: event => {
                                                let { currentTarget } = event,
                                                    connectedTo = currentTarget.getAttribute('connected-to');

                                                let balloon = $(`#tt-balloon-${ connectedTo }`);

                                                if(nullish(balloon))
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
                                                                    // Sometimes, Twitch likes to default to `_blank`
                                                                    'target': '_self',

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
                                                                        ),
                                                                        f('div', { innerHTML: Glyphs.modify('navigation', { height: '20px', width: '20px', style: 'position:absolute; right:0; top:40%;' }) })
                                                                    )
                                                                )
                                                            ),
                                                            f('div.persistent-notification__delete.tt-absolute.tt-pd-l-1', { style: `top:0; right:0` },
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
            let { href, message, subheader, src = Runtime.getURL('profile.png'), attributes = {}, onremove = ($=>$), animate = ($=>$) } = job,
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
                                                ),
                                                f('div', { innerHTML: Glyphs.modify('navigation', { height: '20px', width: '20px', style: 'position:absolute; right:0; top:40%;' }) })
                                            )
                                        )
                                    ),
                                    f('div.persistent-notification__delete.tt-absolute.tt-pd-l-1', { style: `top:0; right:0` },
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
    // new Tooltip(parent:Element[, text:string[, fineTuning:object]]) → Element~Tooltip
        // fineTuning:object = { left:number=pixels, top:number=pixels, from:string := "up"|"right"|"down"|"left", lean:string := "center"|"right"|"left" }
    // Tooltip.get(parent:Element) → Element~Tooltip
class Tooltip {
    static #TOOLTIPS = new Map()

    constructor(parent, text = '', fineTuning = {}) {
        let existing = Tooltip.#TOOLTIPS.get(parent);

        fineTuning.top |= 0;
        fineTuning.left |= 0;

        fineTuning.from ??= '';
        fineTuning.from = ({ top: 'up', bottom: 'down', above: 'up', below: 'down' })[fineTuning.from] ?? fineTuning.from

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
                            let style = 'animation:.3s fade-in 1;';

                            switch(from) {
                                // case 'up':
                                //     style += `transform: translate(${ offset.left + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 9999;`;

                                case 'down':
                                    style += `transform: translate(${ offset.left + fineTuning.left }px, ${ (offset.bottom - screen.height - offset.height) + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 9999;`;

                                // case 'left':
                                //     style += `transform: translate(${ offset.left + offset.width + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 9999;`;
                                //
                                // case 'right':
                                //     style += `transform: translate(${ (offset.right - screen.width - offset.width) + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 9999;`;

                                default:
                                    style += `transform: translate(${ offset.left + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 9999;`;
                            }

                            return style;
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
    // new ChatFooter(title:string[, options:object]) → Element~ChatFooter
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
            f('div#tt-chat-footer.tt-absolute.tt-border-radius-medium.tt-bottom-0.tt-mg-b-1',
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
    // new Card({ title:string[, subtitle:string[, fineTuning:object]] }) → Element~Card
class Card {
    static #CARDS = new Map()

    constructor({ title = "", subtitle = "", description = "", footer, icon, fineTuning = {} }) {
        fineTuning.top ??= '7rem';
        fineTuning.left ??= '0px';
        fineTuning.cursor ??= 'auto';

        let styling = [];

        for(let key in fineTuning) {
            let [value, unit] = (fineTuning[key] ?? "").toString().split(/([\-\+]?[\d\.]+)([^\d\.]+)/).filter(string => string.length);

            if(nullish(value))
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
            card = f(`div.tt-absolute.tt-border-radius-large.viewer-card-layer__draggable`, { style: styling, 'data-a-target': "viewer-card-positioner" }),
            uuid = UUID.from([title, subtitle].join('\n')).value;

        icon ??= { src: Runtime.getURL('profile.png'), alt: 'Profile' };

        card.id = uuid;

        // Remove current cards. Only one allowed at a time
        [...container.children].forEach(child => child.remove());

        // Furnish the card
        let iconElement = f('img.emote-card__big-emote.tt-image', { ...icon, 'data-test-selector': "big-emote" });

        card.append(
            f('div.emote-card.tt-border-b.tt-border-l.tt-border-r.tt-border-radius-large.tt-border-t.tt-elevation-1 [data-a-target="emote-card"]', { style: 'animation:1 fade-in .6s' },
                f('div.emote-card__banner.tt-align-center.tt-align-items-center.tt-c-background-alt.tt-flex.tt-flex-grow-2.tt-flex-row.tt-full-width.tt-justify-content-start.tt-pd-l-1.tt-pd-y-1.tt-relative', {},
                    f('div.tt-inline-flex.viewer-card-drag-cancel', {},
                        f('div.tt-inline.tt-relative.tt-tooltip__container', { 'data-a-target': "emote-name" },
                            iconElement
                        )
                    ),
                    f('div.emote-card__display-name.tt-align-items-center.tt-align-left.tt-ellipsis.tt-mg-1', {},
                        f('h4.tt-c-text-base.tt-ellipsis.tt-strong', { 'data-test-selector': "emote-code-header" }, title),
                        f('p.tt-c-text-alt-2.tt-ellipsis.tt-font-size-6', { 'data-test-selector': "emote-type-copy" }, subtitle)
                    )
                )
            ),
            f('div.tt-absolute.tt-mg-r-05.tt-mg-t-05.tt-right-0.tt-top-0',
                {
                    'data-a-target': "viewer-card-close-button",
                    onmouseup: ({ button = -1 }) => {
                        !button && $('[data-a-target*="card"i] [class*="card-layer"] > *', true).forEach(node => node.remove());
                    },
                },
                f('div.tt-inline-flex.viewer-card-drag-cancel', {},
                    f('button.tt-button-icon.tt-button-icon--secondary.tt-core-button', {
                        'aria-label': "Hide",
                        'data-test-selector': "close-viewer-card",
                    },
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
                // Tiny banner (live status)
                f('div.emote-card__content.tt-full-width.tt-inline-flex.tt-pd-1.viewer-card-drag-cancel', {},
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
                ),

                // "This useer has X emotes"
                f('div', { 'data-a-test-selector': "emote-card-content-description", style: 'padding:0 1rem; margin-bottom: 1rem', innerHTML: description })
            );

        card.classList.add('tt-c-background-base');

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

// Creates a Twitch-style context menu
    // new ContextMenu({ options:array[, fineTuning:object] }) → Element~ContextMenu
    // options = { text:string, icon:string, shortcut:string }
class ContextMenu {
    static #RootCloseOnComplete = $('#root').addEventListener('mouseup', event => {
        let { path, button = -1 } = event,
            menu = $('.tt-context-menu');

        if(defined(menu))
            menu.remove();
    });

    constructor({ inherit = {}, options = [], fineTuning = {} }) {
        fineTuning.top ??= '5rem';
        fineTuning.left ??= '5rem';
        fineTuning.cursor ??= 'auto';

        let styling = [];

        for(let key in fineTuning) {
            let [value, unit] = (fineTuning[key] ?? "").toString().split(/([\-\+]?[\d\.]+)([^\d\.]+)/).filter(string => string.length);

            if(nullish(value))
                continue;

            if(parseFloat(value) > -Infinity)
                unit ??= "px";
            else
                unit ??= "";

            styling.push(`${key}:${value}${unit}`);
        }

        styling = styling.join(';');

        let f = furnish;

        let container = $('#root'),
            menu = f(`div.tt-context-menu.tt-absolute`, { style: styling }),
            uuid = UUID.from(options.map(Object.values).join('\n')).value;

        menu.id = uuid;

        // Remove current menus. Only one allowed at a time
        $('.tt-context-menu', true).forEach(menu => menu.remove());

        menu.append(
            f('div.tt-border-radius-large', { style: 'background:var(--color-background-alt-2); position:absolute; z-index:9999', direction: 'top-right' },
                // The options...
                f('div', { style: 'display:inline-block; min-width:16rem; max-width:48rem; width:max-content', role: 'dialog' },
                    f('div', { style: ' padding: 0.25rem;' },
                        ...options.map(({ text = "", icon = "", shortcut = "", action = () => {} }) => {
                            if(icon?.length)
                                icon = f('div', { style: 'display:inline-block; float:left; margin-left:calc(-1rem - 16px); margin-right:1rem', innerHTML: Glyphs.modify(icon, { height: 16, width: 16, style: 'vertical-align:-3px' }) });
                            if(text?.length)
                                text = f('div.tt-hide-text-overflow', { innerHTML: text });
                            if(shortcut?.length)
                                shortcut = f('pre', { style: 'display:inline-block; font-family:monospace!important; float:right; margin-right:1rem' }, f('code', {}, GetMacro(shortcut)));

                            if(icon || text || shortcut)
                                return f('button.tt-context-menu-option', { onmouseup: event => action({ ...event, inheritance: inherit }), style: 'border-radius:0.6rem; display:inline-block; padding:0.5rem 0 0.5rem 3rem; width:-webkit-fill-available' }, icon, shortcut, text);
                            return f('hr', { style: 'border-top:1px solid var(--channel-color); margin:0.25rem 0;' });
                        })
                    )
                )
            )
        );

        container.append(menu);
    }
}

// Search Twitch for channels/categories
    // new Search([ID:string|number[, type:string]]) → Promise~Object
/** Returns a promised Object →
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

    static #cache = new Map;
    static cacheLeaseTime = 300_000 * (parseInt(Settings.low_data_mode) || 1);

    constructor(ID = null, type = 'channel', as = null) {
        let spadeEndpoint = `https://spade.twitch.tv/track`,
            twilightBuildID = '5fc26188-666b-4bf4-bdeb-19bd4a9e13a4';

        let pathname = window.location.pathname.substr(1),
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
        if(nullish(ID) && /^auto(?:matic)?$/i.test(type)) {
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

        let searchID = UUID.from([ID, type, as, new Date((+new Date).floorToNearest(Search.cacheLeaseTime)).toJSON()].join('~')).value,
            searchResults;

        if(Search.#cache.has(searchID))
            return Search.#cache.get(searchID);

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
                //     status: "🎃Happy !PTB Day!👻Are Boons OP? Let's Find Out! #DeadbyDaylightPartner"
                //     updated_at: "2021-09-29T01:39:51Z"
                //     url: "https://www.twitch.tv/aimzatchu"
                //     video_banner: "https://static-cdn.jtvnw.net/jtv_user_pictures/aimzatchu-channel_offline_image-c8fb4fef334d2afa-1920x1080.png"
                //     views: 5919706
                //     _id: "39367256"
            } break;

            default: {
                let languages = `bg cs da de el en es es-mx fi fr hu it ja ko nl no pl pt pt-br ro ru sk sv th tr vi zh-cn zh-tw x-default`.split(' ');
                let name = channelName;

                if(nullish(name) || type != 'channel')
                    break;

                searchResults = fetch(`./${ name }`)
                    .then(response => response.text())
                    .then(html => {
                        let parser = new DOMParser;

                        return parser.parseFromString(html, 'text/html');
                    })
                    .then(async doc => {
                        let alt_languages = $('link[rel^="alt"i][hreflang]', true, doc).map(link => link.hreflang),
                            [data] = JSON.parse($('script[type^="application"i][type$="json"i]', false, doc)?.textContent || "[{}]");

                        let display_name = (data?.name ?? `${ channelName } - Twitch`).split('-').slice(0, -1).join('-').trim(),
                            [language] = languages.filter(lang => !alt_languages.contains(lang)),
                            name = display_name?.trim(),
                            profile_image = $('meta[property$="image"i]', false, doc)?.content,
                            live = parseBool(data?.publication?.isLiveBroadcast),
                            started_at = new Date(data?.publication?.startDate).toJSON(),
                            status = (data?.description ?? $('meta[name$="description"i]', false, doc)?.content),
                            updated_at = new Date(data?.publication?.endDate).toJSON();

                        let json = { display_name, language, live, name, profile_image, started_at, status, updated_at, href: `https://www.twitch.tv/${ display_name }` };

                        Search.parseType = 'pure';

                        let channelData = await Search.convertResults({ async json() { return json } });

                        SEARCH_CACHE.set(display_name.toLowerCase(), channelData);
                        ALL_CHANNELS = [...ALL_CHANNELS, channelData].filter(defined).filter(uniqueChannels);

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
                    .catch(error => {
                        WARN(error);

                        return STREAMER.jump[name.toLowerCase()];
                    });

                Search.#cache.set(searchID, searchResults);

                return searchResults;
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

        Search.#cache.set(searchID, searchResults = results.request);

        return searchResults;
    }

    static void(ID = null, type = 'channel', as = null) {
        let pathname = window.location.pathname.substr(1),
            player = ({
                type: 'site',
                routes: {
                    exact: ['activate', 'bits', 'bits-checkout', 'directory', 'following', 'popout', 'prime', 'store', 'subs'],
                    start: ['bits-checkout/', 'checkout/', 'collections/', 'communities/', 'dashboard/', 'directory/', 'event/', 'prime/', 'products/', 'settings/', 'store/', 'subs/'],
                },
            });

        let vodID = null, channelName = null;
        if(nullish(ID) && /^auto(?:matic)?$/i.test(type)) {
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

        let searchID = UUID.from([ID, type, as, new Date((+new Date).floorToNearest(Search.cacheLeaseTime)).toJSON()].join('~')).value;

        return Search.#cache.delete(searchID);
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
            primaryColorHex:    'tint',
            profileImageURL:    'icon',
            role:               'role',
            subscriber:         'paid',
            turbo:              'fast',
            viewersCount:       'poll',

            display_name:       'name',
            status:             'desc',
            title:              'desc',
            live:               'live',
            href:               'href',
            profile_image:      'icon',
        },
        DataConversionKey = {
            started_at:         'actualStartTime',
            updated_at:         'lastSeen',
            stream:             'broadcast',
        },
            deeper = [];

        switch(Search.parseType) {
            case 'advanced': {
                // TODO: Parse advanced Search results...
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

        // Deeper levels
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

        // Deeper data levels
        data.data ??= {};

        let deeperDataLevels = {};
        for(let key in json) {
            let to = DataConversionKey[key];

            if(to?.length)
                data.data[to] ??= json[key];
            if(deeper.contains(to))
                deeperDataLevels[to] = json[key];
        }

        for(let key in deeperDataLevels) {
            let to = DataConversionKey[key];

            if(to?.length)
                data.data[to] ??= deeperDataLevels[key];
        }

        return new Promise(resolve => resolve(data));
    }
}

// https://stackoverflow.com/a/45205645/4211612
// Creates a CSS object that can be used to easily transform an object to a CSS string
    // new CSSObject({ ...css-properties }) → Object~CSSObject
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

// CSS-Tricks - Jon Kantner 26 JAN 2021 @ https://css-tricks.com/converting-color-spaces-in-javascript/
// Creates a Color object
class Color {
    static LOW_CONTRAST     = "LOW";
    static NORMAL_CONTRAST  = "NORMAL";
    static HIGH_CONTRAST    = "HIGH";
    static PERFECT_CONTRAST = "PERFECT";

    static CONTRASTS = [Color.LOW_CONTRAST, Color.NORMAL_CONTRAST, Color.HIGH_CONTRAST, Color.PERFECT_CONTRAST];

    constructor() {}

    // Converts Hex color values to a color-object
        // Color.HEXtoColor(hex:String~/#?RGB/i) → Object~Color.RGBtoHSL(...)
    static HEXtoColor(hex = '#000') {
        let [R, G, B] = hex.split(/^#([\da-f]{1,2}?)([\da-f]{1,2}?)([\da-f]{1,2}?)$/i).filter(string => string.length).map(string => parseInt(string, 16));

        return Color.RGBtoHSL(R, G, B);
    }

    // https://stackoverflow.com/a/9493060/4211612 →
        // https://www.rapidtables.com/convert/color/rgb-to-hsl.html
    // Converts RGB to HSL
        // Color.RGBtoHSL(red:Number~UInt8, green:Number~UInt8, blue:Number~UInt8[, alpha:Number]) → Object~{ RGB, R, G, B, red, green, blue, HSL, H, S, L, hue, saturation, lightness }
    static RGBtoHSL(R, G, B, A = 1) {
        // Convert RGB to fractions of 1
        let r = R / 255,
            g = G / 255,
            b = B / 255;

        // Find channel values
        let Cmin = Math.min(r, g, b),
            Cmax = Math.max(r, g, b),
            delta = Cmax - Cmin;

        let H = 0, S = 0, L = 0;

        // Calculate the hue
        if(delta == 0)
            H = 0;
        else if(r == Cmax)
            H = ((g - b) / delta) % 6;
        else if (g == Cmax)
            H = ((b - r) / delta) + 2;
        else
            H = ((r - g) / delta) + 4;

        H = Math.round(H * 60);

        if(H < 0)
            H += 360;

        // Calculate lightness
        L = (Cmax + Cmin) / 2;

        // Calculate saturation
        S = (delta == 0? 0: delta / (1 - Math.abs(2 * L - 1)));

        H = +(H * 1/1).round();
        S = +(S * 100).round();
        L = +(L * 100).round();
        A = A.clamp(0, 1);

        return {
            H, S, L, A,
            hue: H, saturation: S, lightness: L, alpha: A,
            HSL: `hsl(${ H }deg,${ S }%,${ L }%)`,
            HSLA: `hsl(${ H }deg,${ S }%,${ L }%,${ A.toFixed(1) })`,

            R, G, B,
            red: R, green: G, blue: B,
            RGB: `#${ [R, G, B].map(v => v.toString(16).padStart(2, '0')).join('') }`,
            RGBA: `#${ [R, G, B, A * 255].map(v => v.toString(16).padStart(2, '0')).join('') }`,
        };
    }

    // https://stackoverflow.com/a/9493060/4211612 →
        // https://www.rapidtables.com/convert/color/hsl-to-rgb.html
    // Converts HSL to RGB
        // Color.HSLtoRGB([hue:Number~Degrees[, saturation:Number~Percentage[, lightness:Number~Percentage[, alpha:Number]]]]) → Object~{ RGB, R, G, B, red, green, blue, HSL, H, S, L, hue, saturation, lightness }
    static HSLtoRGB(hue = 0, saturation = 0, lightness = 0, alpha = 1) {
        let H = (hue % 360),
            S = (saturation / 100),
            L = (lightness / 100),
            A = alpha.clamp(0, 1);

        let { abs } = Math;
        let C = (1 - abs(2*L - 1)) * S,
            X = C * (1 - abs(((H / 60) % 2) - 1)),
            m = L - C/2;

        let [r, g, b] =
        (H >= 0 && H < 60)?
            [C, X, 0]:
        (H >= 60 && H < 120)?
            [X, C, 0]:
        (H >= 120 && H < 180)?
            [0, C, X]:
        (H >= 180 && H < 240)?
            [0, X, C]:
        (H >= 240 && H < 300)?
            [X, 0, C]:
        (H >= 300 && H < 360)?
            [C, 0, X]:
        [0, 0, 0];

        let [R, G, B] = [(r+m)*255, (g+m)*255, (b+m)*255].map(v => v.abs().round().clamp(0, 255));

        H = +(H * 1/1).round();
        S = +(S * 100).round();
        L = +(L * 100).round();

        return {
            H, S, L, A,
            hue, saturation, lightness, alpha: A,
            HSL: `hsl(${ H }deg,${ S }%,${ L }%)`,
            HSLA: `hsl(${ H }deg,${ S }%,${ L }%,${ A.toFixed(1) })`,

            R, G, B,
            red: R, green: G, blue: B,
            RGB: `#${ [R, G, B].map(v => v.toString(16).padStart(2, '0')).join('') }`,
            RGBA: `#${ [R, G, B, A * 255].map(v => v.toString(16).padStart(2, '0')).join('') }`,
        };
    }

    // https://stackoverflow.com/a/9733420/4211612
    // Gets the luminance of a color
        // Color.luminance(Number~UInt8, Number~Uint8, Number~Uint8) → Number~Float@[0, 1]
    static luminance(R, G, B) {
        let l = [R, G, B].map(c => {
            c /= 255;

            return (
                c <= 0.03928?
                    c / 12.92:
                ((c + 0.055) / 1.055)**2.4
            );
        });

        return l[0] * 0.2126 + l[1] * 0.7152 + l[2] * 0.0722;
    }

    // https://stackoverflow.com/a/9733420/4211612
    // Gets the contrast of two colors
        // Color.contrast(Array=[Number~UInt8, Number~UInt8, Number~UInt8], Array=[Number~UInt8, Number~UInt8, Number~UInt8]) → Number@[0, 21]
    static contrast(C1, C2) {
        let L1 = Color.luminance(...C1),
            L2 = Color.luminance(...C2),
            L = Math.max(L1, L2),
            D = Math.min(L1, L2);

        let value = new Number((L + 0.05) / (D + 0.05));

        Object.defineProperties(value, {
            toString: {
                value() {
                    return Color.CONTRASTS[(3 * (this / 21)) | 0];
                },
            },
        });

        return value;
    }

    // Gets the distance between two RGB colors
    // https://tomekdev.com/posts/sorting-colors-in-js
        // Color.distance(C1:Array=[R, G, B], C2:Array=[R, G, B]) → Number
    static distance(C1, C2) {
        let [R, G, B] = C1,
            [r, g, b] = C2;

        return Math.sqrt( (R - r)**2 + (G - g)**2 + (B - b)**2 );
    }

    // Retrns a color's name
        // Color.getName(color:string~Color) → String
    static getName(color = '#000') {
        if(nullish(color))
            return '';

        color = color.toString().trim();

        let colorRegExps = [
            // #RGB #RRGGBB
            /^(#)([\da-f]{1,2}?)([\da-f]{1,2}?)([\da-f]{1,2}?)$/i,

            // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/rgb
            // rgb(red, green, blue) rgb(red green blue) rgba(red, green, blue, alpha) rgba(red green blue / alpha)
            /^(rgb)a?\((?<red>\d+)[\s,]+(?<green>\d+)[\s,]+(?<blue>\d+)(?:[\s,\/]+(?<alpha>[\d\.]+))?\)$/i,

            // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl
            // hsl(hue, saturation, lightness) hsl(hue saturation lightness) hsla(hue, saturation, lightness, alpha) hsla(hue saturation lightness / alpha)
            /^(hsl)a?\((?<hue>\d+)(?:deg(?:rees?)?|)?[\s,]+(?<saturation>\d+)(?:[%])?[\s,]+(?<lightness>\d+)(?:[%])?(?:[\s,\/]+(?<alpha>[\d\.]+))?\)$/i,
        ];

        for(let regexp of colorRegExps)
            if(regexp.test(color))
                return color.replace(regexp, ($0, $1, $2, $3, $4, $5) => {
                    let color;
                    switch($1.toLowerCase()) {
                        case '#': {
                            color = Color.HEXtoColor($0);
                        } break;

                        case 'rgb': {
                            color = Color.RGBtoHSL(...[$2, $3, $4].map(parseFloat));
                        } break;

                        case 'hsl': {
                            color = Color.HSLtoRGB(...[$2, $3, $4].map(parseFloat));
                        } break;

                        default: return;
                    }

                    // TODO: Add more colors &/ better detection...
                    let { H, S, L, R, G, B } = color;
                    let maxDist = Color.distance([0,0,0],[255,255,255]),
                        colorDifference = (C1, C2) => Color.distance(C1, C2) / maxDist;

                    let colors = {
                        // Extremes
                        white: ({ R, G, B, L }) => (false
                            || (colorDifference([255, 255, 255], [R, G, B]) < 0.05)
                            || (true
                                && colors.grey({ R, G, B, S, L })
                                && (L > 90)
                            )
                        ),
                        light: ({ S, L }) => (false
                            || (L > 80)
                            || (S < 15)
                        ),

                        black: ({ R, G, B, S, L }) => (false
                            || (colorDifference([0, 0, 0], [R, G, B]) < 0.05)
                            || (true
                                && colors.grey({ R, G, B, S })
                                && (L < 5)
                            )
                            || (true
                                && colors.green({ R, G, B, S })
                                && (L < 5)
                            )
                            || (true
                                && colors.brown({ S, L })
                                && (L <= 1)
                            )
                        ),
                        dark: ({ S, L }) => (L < 15),

                        grey: ({ R, G, B, S }) => (false
                            || (colorDifference([B, R, G].map(C => C.floorToNearest(8)), [R, G, B]) < 0.05)
                            || (S < 5)
                        ),

                        // Reds {130°} → (0° < Hue ≤ 60°) U (290° < Hue ≤ 360°)
                        red: ({ H, S }) => (true
                            && (S >= 5)
                            && (false
                                || (H > 345)
                                || (H <= 10)
                            )
                        ),
                        pink: ({ H, S, L }) => (false
                            || (true
                                && (S >= 5)
                                && (H > 290 && H <= 345)
                            )
                            || (true
                                && colors.light({ S, L })
                                && colors.red({ H, S })
                            )
                        ),
                        orange: ({ H, S }) => (false
                            || (true
                                && (S >= 5)
                                && (H > 10 && H <= 45)
                            )
                            || (true
                                && colors.red({ H, S })
                                && colors.yellow({ H, S })
                            )
                        ),
                        yellow: ({ H, S }) => (true
                            && (S >= 5)
                            && (H > 45 && H <= 60)
                        ),
                        brown: ({ H, S, L }) => (true
                            && (false
                                || colors.yellow({ H, S })
                                || colors.orange({ H, S })
                                || colors.red({ H, S })
                            )
                            && (false
                                || (S > 10 && S <= 30)
                                || (L > 10 && L <= 30)
                            )
                        ),

                        // Greens {110°} → (60° < Hue ≤ 170°)
                        green: ({ H, S }) => (true
                            && (S >= 5)
                            && (H > 60 && H <= 170)
                        ),

                        // Blues {120°} → (170° < Hue ≤ 290°)
                        blue: ({ H, S }) => (true
                            && (S >= 5)
                            && (H > 170 && H <= 260)
                        ),
                        purple: ({ H, S, L }) => (false
                            || (true
                                && (S >= 5)
                                && (H > 260 && H <= 290)
                            )
                            || (false
                                || (true
                                    && (H >= 245 && H < 290)
                                    && (L <= 50)
                                )
                            )
                            || (true
                                && colors.pink({ H, S, L })
                                && (L < 30)
                            )
                        ),
                    };

                    let name = [];

                    naming:
                    for(let key in colors) {
                        let condition = colors[key];

                        if(condition({ H, S, L, R, G, B })) {
                            name.push(key);

                            if(/^(black|white)$/i.test(key)) {
                                name = [key];

                                break naming;
                            }
                        }
                    }

                    return name
                        .sort()
                        .sort((primary, secondary) => {
                            return (
                                /^(light|dark)$/i.test(primary)?
                                    -1:
                                /^(grey|brown)$/i.test(primary)?
                                    +1:
                                /^(light|dark)$/i.test(secondary)?
                                    +1:
                                /^(grey|brown)$/i.test(secondary)?
                                    -1:
                                0
                            )
                        })
                        .join(' ')

                        .replace(/light( pink)? red/, 'pink')
                        .replace(/red orange/, 'orange')
                        .replace(/light yellow/, 'yellow')
                        .replace(/orange brown/, 'light brown')
                        .replace(/blue purple/, 'purple')

                        .replace(/^(light|dark).+(grey|brown)$/i, '$1 $2')
                        .replace(/^(light|dark) (black|white)(?:\s[\s\w]+)?/i, '$1')
                        .replace(/(\w+) (\1)/g, '$1')
                        .replace(/(\w+) (\w+)$/i, ($0, $1, $2, $$, $_) => {
                            if([$1, $2].contains('light', 'dark'))
                                return $_;

                            let suffix = $1.slice(-1);

                            return $1.slice(0, -1) + ({
                                d: 'dd',
                                e: '',
                            }[suffix] ?? suffix) + 'ish-' + $2;
                        })

                        .replace(/light$/i, 'white')
                        .replace(/dark$/i, 'black');
                });

        return '';
    }
}

// Get the current settings
    // GetSettings() → Object
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
    // GetChat([lines:number[, keepEmotes:boolean]]) → [...Object { style, author, emotes, message, mentions, element, uuid, highlighted }]
function GetChat(lines = 250, keepEmotes = false) {
    let chat = $('[data-test-selector$="message-container"i] [data-a-target="chat-line-message"i]', true).slice(-lines),
        emotes = {},
        results = [];

    for(let line of chat) {
        let handle = $('.chat-line__username', true, line).map(element => element.textContent).toString()
            author = handle.toLowerCase().replace(/[^]+?\((\w+)\)/, '$1'),
            message = $('[data-test-selector="chat-message-separator"i] ~ * > *', true, line),
            mentions = $('.mention-fragment', true, line).map(element => element.textContent.replace('@', '').toLowerCase()).filter(text => /^[a-z_]\w+$/i.test(text)),
            badges = $('.chat-badge', true, line).map(img => img.alt.toLowerCase()),
            style = $('.chat-line__username [style]', true, line).map(element => element.getAttribute('style')).join(';'),
            reply = $('button[data-test-selector="chat-reply-button"i]', false, line);

        let raw = line.textContent?.trim(),
            containedEmotes = [];

        message = message
            .map(element => {
                let string;

                if(keepEmotes && ((element.dataset.testSelector == 'emote-button') || element.dataset.ttEmote?.length)) {
                    let img = $('img', false, element);

                    if(defined(img))
                        containedEmotes.push(string = `:${ (i=>((emotes[i.alt]=i.src),i.alt))(img) }:`);
                } else {
                    string = element.textContent;
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
            mentions = $('.chatter-name, strong', true, bullet).map(element => element.textContent.toLowerCase()).filter(text => /^[a-z_]\w+$/i.test(text)),
            subject = (text =>
                /\braid/i.test(text)?                'raid': // Incoming raid
                /\bredeem/i.test(text)?              'coin': // Redeeming (spending) channel points
                /\bcontinu/i.test(text)?             'keep': // Continuing a gifted subscription
                /\bgift/i.test(text)?                'gift': // Gifting a subscription
                /\b(re)?subs|\bconvert/i.test(text)? 'dues': // New subscription, continued subscription, or converted subscription
                null                                         // No subject
            )($('*:first-child', false, bullet)?.textContent);

        if(nullish(subject) && message.length < 1)
            continue;

        let raw = bullet.textContent?.trim();

        message = message
            .map(element => {
                let string;

                switch(element.dataset.testSelector) {
                    case 'emote-button': {
                        if(keepEmotes)
                            string = `:${ (i=>((emotes[i.alt]=i.src),i.alt))($('img', false, element)) }:`;
                    } break;

                    default: {
                        string = element.textContent;
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

    let commands = $('[class*="line__status"i]', true);

    results.commands = [];

    for(let result of commands) {
        let raw = result.textContent,
            uuid = UUID.from(raw).value,
            [head, body] = raw.split(/[^\w\s\-,]+/).filter(r => r.length).map(r => r.trim());

        if([head, body].filter(nullish).length)
            continue;

        let [type] = head.toLowerCase().split(/\s/).filter(r => !/^(an?d?|but|for|n?or|th(?:e|is)|yet)$/i.test(r)).map(r => r.replace(/^(\w{3})([^aeiouy s]+)?(?:.*)$/, '$1$2s')),
            value = body.split(/[^\w\s]/).filter(r => r.length).map(r => r.trim());

        results.commands.push({
            raw,
            uuid,
            type,
            head,
            body,
            value,
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

    restrictions: {
        set(value) {},

        get() {
            return ($('[class*="chat-restriction"i]')?.parentElement?.nextElementSibling?.textContent || '');
        },
    },
});

// Pushes parameters to the URL's search
    // PushToTopSearch(newParameters:object[, reload:boolean]) → String#URL.Search
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
    // RemoveFromTopSearch(keys:array[, reload:boolean]) → String#URL.Search
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
    // parseCoin(amount:string) → Number
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
    // GetQuality() → String={ auto:boolean, high:boolean, low:boolean, source:boolean }
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

    if(nullish(current)) {
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
    // SetQuality([quality:string[, backup:string]]) → Object#{ oldValue:Object={ input:Element, label:Element }, newValue:Object={ input:Element, label:Element } }
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

    if(nullish(desired))
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
    // GetVolume([fromVideoElement:boolean]) → Number#Float
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
    // SetVolume([volume:number#Float]) → undefined
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
    // GetViewMode() → string={ "fullscreen" | "fullwidth" | "theatre" | "default" }
function GetViewMode() {
    let mode = 'default',
        theatre = false,
        overview = false,
        fullwidth = false;

    if(theatre
        ||= /theatre/i.test([...$(`[data-test-selector*="video-container"i]`).classList].join(' '))
    )
        mode = 'theatre';

    if(overview
        ||= defined($(`.home`))
    )
        mode = 'overview';

    if(fullwidth
        ||= defined($(`[data-a-target*="right-column"i][data-a-target*="chat-bar"i][data-a-target*="collapsed"i] button[data-a-target*="collapse"i]`))
    )
        mode = 'fullwidth';

    let container = $(`button[data-a-target*="fullscreen"i]`)?.closest('div');

    if(nullish(container))
        return mode;

    let classes = ['', ...container.classList].join('.');

    if(false
        || (true
                && theatre
                && fullwidth
                && !overview
            )
        || $(classes, true, container.parentElement).length <= 3
    )
        mode = 'fullscreen';

    return mode;
}

// Change the view mode
    // SetViewMode(mode:string={ "fullscreen" | "fullwidth" | "theatre" | "default" }) → undefined
function SetViewMode(mode = 'default') {
    let buttons = [],
        toggles = {
            overview: {
                off: `[class*="root"i][class*="home"i] [href]`,
                on: `[class*="root"i][class*="chat"i] [href]`,
            },
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

        case 'overview': {
            buttons.push(toggles.overview.on);
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
    // GetActivity() → Promise <String | null>
async function GetActivity() {
    return until(() => {
        let open = defined($('[data-a-target="user-display-name"i], [class*="dropdown-menu-header"i]'));

        if(open) {
            ACTIVITY = window.ACTIVITY = $('[data-a-target="presence-text"i]')?.textContent;
        } else {
            UserMenuToggleButton?.click();
            ACTIVITY = window.ACTIVITY = $('[data-a-target="presence-text"i]')?.textContent;
            UserMenuToggleButton?.click();
        }

        return ACTIVITY;
    });
}

// Get the current page's language
    // GetLanguage() → Promise <String | null>
async function GetLanguage() {
    return until(() => {
        let open = defined($('[data-a-target="user-display-name"i], [class*="dropdown-menu-header"i]'));

        if(open) {
            LITERATURE = window.LITERATURE = $('[data-language] svg')?.closest('button')?.dataset?.language;
        } else {
            UserMenuToggleButton?.click();
            $('[data-a-target^="language"i]')?.click();
            LITERATURE = window.LITERATURE = $('[data-language] svg')?.closest('button')?.dataset?.language;
            UserMenuToggleButton?.click();
        }

        return LITERATURE;
    });
}

// Import the glyphs
let { Glyphs } = top;

// Returns ordinal numbers
    // nth(n:number[, s:string]) → string
let nth = (n, s = 'line-position') => {
    n += '';

    let c = (s = '', l = '') => {
        switch(s.trim()) {
            case 'line-position': {
                switch(window.LANGUAGE) {
                    case 'bg': return ' място';
                    case 'cs': return ' místo';
                    case 'da': return ' plads';
                    case 'de': return ' Reihe';
                    case 'en': return ' in line';
                    case 'el': return ' θέση';
                    case 'es': return ' en línea';
                    case 'fi': return ' sija';
                    case 'fr': return 'ème en ligne';
                    case 'hu': return ' a sorban';
                    case 'it': return ' di fila';
                    case 'nl': return 'e in de rij';
                    case 'no': return ' i rekken';
                    case 'pl': return ' w kolejce';
                    case 'pt': return ' na linha';
                    case 'ro': return ' pe linie';
                    case 'ru': return ' в строке';
                    case 'sk': return ' v poradí';
                    case 'sv': return 'a i raden';
                    case 'tr': return ' sırada';
                    case 'vi': return ' trong dòng';

                    default: return '';
                }
            } break;

            default: switch(window.LANGUAGE) {
                case 'fr':
                case 'sv':
                    return 'e';
                case 'ro': return '';
            }
        }

        return s;
    };

    switch(window.LANGUAGE) {
        case 'bg': {
            // 1-то 2-то 3-то ... 11-то 12-то 13-то ... 21-то 22-то 23-то

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1-то')
            + c(s);
        } break;

        case 'cs':
        case 'da':
        case 'de':
        case 'fi':
        case 'hu':
        case 'no':
        case 'pl':
        case 'sk':
        case 'tr': {
            // 1. 2. 3. 4. ... 11. 12. 13. ... 21. 22. 23.

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1.')
            + c(s);
        } break;

        case 'el': {
            // 1η 2η 3η 4η ... 11η 12η 13η ... 21η 22η 23η

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1η')
            + c(s);
        } break;

        case 'es':
        case 'pt': {
            // 1° 2° 3° 4° ... 11° 12° 13° ... 21° 22° 23°

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1°')
            + c(s);
        } break;

        case 'fr':
        case 'nl': {
            // 1e 2e 3e 4e ... 11e 12e 13e ... 21e 22e 23e

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1')
            + c(s);
        } break;

        case 'it':
        case 'ro': {
            // 1 2 3 4 ... 11 12 13 ... 21 22 23

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1')
            + c(s);
        } break;

        case 'ja':
        case 'zh-ch':
        case 'zh-tw': {
            // 1号 2号 3号 4号 ... 11号 12号 13号 ... 21号 22号 23号

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1号')
            + c(s);
        } break;

        case 'ko': {
            // 1번 2번 3번 4번 ... 11번 12번 13번 ... 21번 22번 23번
            n = n
                .replace(/([\d\s\,\.]+)$/, '$1번')
            + c(s);
        } break;

        case 'ru': {
            // 1-й 2-й 3-й 4-й ... 11-й 12-й 13-й ... 21-й 22-й 23-й

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1-й')
            + c(s);
        } break;

        case 'sv': {
            // 1:e 2:e 3:e 4:e ... 11:e 12:e 13:e ... 21:e 22:e 23:e

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1:')
            + c(s);
        } break;

        case 'th': {
            // หมายเลข #

            n = n
                .replace(/([\d\s\,\.]+)$/, 'หมายเลข $1')
            + c(s);
        } break;

        case 'vi': {
            // Thứ #

            n = n
                .replace(/([\d\s\,\.]+)$/, 'Thứ $1')
            + c(s);
        } break;

        case 'en':
        default: {
            // 1st 2nd 3rd 4th ... 11th 12th 13th ... 21st 22nd 23rd

            n = n
                .replace(/(0|1[123]|[4-9])$/, '$1th')
                .replace(/1$/, '1st')
                .replace(/2$/, '2nd')
                .replace(/3$/, '3rd')
            + c(s);
        } break;
    }

    return n;
}

/** Adds a CSS block to the CUSTOM_CSS string
 * AddCustomCSSBlock(name:string, block:string) → undefined
 */
function AddCustomCSSBlock(name, block) {
    name = name.trim();

    let regexp = RegExp(`(\\/\\*(${ name })\\*\\/(?:[^]+?)\\/\\*#\\1\\*\\/|$)`);

    CUSTOM_CSS.innerHTML = CUSTOM_CSS.innerHTML.replace(regexp, `/*${ name }*/${ block }/*#${ name }*/`);

    CUSTOM_CSS?.remove();
    $('body').append(CUSTOM_CSS);
}

/** Removes a CSS block from the CUSTOM_CSS string
 * RemoveCustomCSSBlock(name:string[, flags:string]) → undefined
 */
function RemoveCustomCSSBlock(name, flags = '') {
    name = name.trim();

    let regexp = RegExp(`\\/\\*(${ name })\\*\\/(?:[^]+?)\\/\\*#\\1\\*\\/`, flags);

    CUSTOM_CSS.innerHTML = CUSTOM_CSS.innerHTML.replace(regexp, '');

    CUSTOM_CSS?.remove();
    $('body').append(CUSTOM_CSS);
}

// Returns a unique list of channels (used with `Array..filter`)
    // uniqueChannels(channel:object#Channel, index:number, channels:array) → boolean
let uniqueChannels = (channel, index, channels) =>
    channels.filter(channel => defined(channel?.name)).findIndex(ch => ch.name === channel?.name) == index;

// Returns whether or not a channel is live (used with `Array..filter`)
    // isLive(channel:object#Channel) → boolean
let isLive = channel => parseBool(channel?.live);

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
let PATHNAME = window.location.pathname,
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
    // All channel commands
    COMMANDS = [],
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

                for(let [key, func] of __ONLOCATIONCHANGE__)
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
    REMARK(`Removing expired cache data...`, new Date);

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

            let name = key
                .replace(/\$\$/g, ' | ')
                .replace(/\$/g, '/')
                .replace(/__/g, ' - ')
                .replace(/_/g, ' ')
                .trim();

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
                        let [documentLanguage] = (document.documentElement?.lang ?? window.navigator?.userLanguage ?? window.navigator?.language ?? 'en').toLowerCase().split('-');

                        window.LANGUAGE = LANGUAGE = newValue || documentLanguage;
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
    REMARK(`Listening for jumped frame data...`);

    top.addEventListener('message', async event => {
        if(!/\b\.?twitch\.tv\b/i.test(event.origin))
            return /* Not meant for us... */;

        let R = RegExp;
        let { data } = event;

        switch(data?.action) {
            case 'jump': {
                let BroadcastSettings = {},
                    Channel = {},
                    Badges = {},
                    Stream = {},
                    User = {},
                    Game = {},
                    Tags = {};

                if(nullish(data))
                    break;
                delete data.action;
                data = (data?.data ?? data);

                // Not jump data
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
                        else if(/^(Game:[^$]+)/.test(key))
                            Game[R.$1] = data[key];
                        else if(/^(Tag:[^$]+)/.test(key))
                            Tags[R.$1] = data[key];
                        else if(/^Badge:([^$]+)/.test(key)) {
                            let [type, length, owner] = atob(R.$1).split(';'),
                                badge = data[key],
                                id = [owner, type, length].join('_');

                            Badges[id] = ({
                                id,
                                type,
                                owner,
                                length,
                                title: badge.title,
                                version: badge.version,

                                meta: badge,
                            });
                        }

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
                                            stream.game = Game[stream.game?.__ref];
                                            stream.tags = stream.tags?.map?.(({ __ref }) => Tags[__ref]?.localizedName);

                                            let previews = {};
                                            for(let key in stream)
                                                if(/^previewImageURL\(([^]+)\)\s*$/i.test(key)) {
                                                    let { height, width } = JSON.parse(R.$1);

                                                    previews[`${ width }x${ height }`] = stream[key];

                                                    delete stream[key];
                                                }

                                            stream.previewImageURL = previews;

                                            let badges = { ...Badges };
                                            for(let badge in badges) {
                                                badge = badges[badge];

                                                let max = 0;
                                                for(let key in badge.meta)
                                                    if(/^imageURL\b/i.test(key)) {
                                                        let href = badge.meta[key],
                                                            [path, version, uuid, size] = parseURL(href).pathname.slice(0).split('/');
                                                        size = parseInt(size);

                                                        if(size > max) {
                                                            size = max;
                                                            badge.href = href;
                                                        }
                                                    }

                                                delete badge.meta;
                                            }

                                            stream.badges = badges;

                                            return stream;
                                        }
                                    return null;
                                })(Stream);

                                JUMP_DATA[login] = { id: parseFloat(id), title, displayName, login, primaryColorHex, profileImageURL, stream };
                            }

                        // LOG('Jumped frames, retrieved:', JUMP_DATA);
                    }
                }
            } break;

            case 'raid': {
                let { from, to, events, payable } = data,
                    method = Settings.prevent_raiding ?? "none";

                if(!top.UP_NEXT_ALLOW_THIS_TAB)
                    break;

                // "Would the user allow this raid condition?"
                if(true
                    && payable
                    && (false
                        || (["all", "greed"].contains(method))
                        || (method == "unfollowed" && STREAMERS.contains(({ name }) => RegExp(`^${ to }$`, 'i').test(name)))
                    )
                )
                    confirm
                        .timed(`<a href='./${ from }'><strong>${ from }</strong></a> is raiding <strong>${ to }</strong>. There is a chance to collect bonus channel points...`, 15_000)
                        .then(action => {
                            // The event timed out...
                            action ??= true;

                            if(action) {
                                // The user clicked "OK"
                                // Return to the current page eventually...
                                if(!parseBool(Settings.first_in_line_none)) {
                                    let { name, href } = STREAMER;

                                    Handlers.first_in_line({ href, textContent: `${ name } is live [Greedy Raiding]` });
                                }

                                open(`./${ from }?tool=raid-stopper--${ method }`, '_self');
                            } else {
                                // The user clicked "Cancel"
                                LOG('Canceled Greedy Raiding event', { from, to });
                            }
                        });
            } break;

            case 'report-blank-ad': {
                switch(data.from) {
                    case 'player.js': {
                        $('.tt-stream-preview').setAttribute('blank-ad', parseBool(data.purple));
                    } break;
                }
            } break;

            case 'open-options-page': {
                Runtime.sendMessage({ action: 'OPEN_OPTIONS_PAGE' });
            } break;
        }
    });

    // Add custom context menus
    REMARK(`Adding context menus...`);

    /* Normal - Page body
     * Reload (Ctrl+R)
     * ----
     * Save as... (Ctrl+S)
     * Print... (Ctrl+P)
     */
    $('main')?.addEventListener?.('contextmenu', event => {
        if(!event.isTrusted)
            return;
        event.preventDefault(true);
        // event.stopPropagation();

        let extras = [];
        let { x, y } = event,
            { availHeight, availWidth } = screen,
            { innerHeight, innerWidth } = window;

        // Anchors
        let anchor = event.target.closest('a');

        // Selections
        let selectionText = getSelection(),
            { baseNode, baseOffset, extentNode, extentOffset } = selectionText;

        selectionText = (selectionText + '').trim().normalize('NFKD');

        // Videos
        let video = event.target.closest('[data-a-target="video-player"i]');

        // ---- ---- START ---- ---- //

        // Anchors
        if(defined(anchor)) {
            let { href, scheme, host } = parseURL(anchor.href),
                text = anchor.textContent;

            switch(scheme.toLowerCase()) {
                case 'mailto': {
                    extras.push({
                        text: `E-mail <strong>${ text }</strong>`,
                        icon: 'chat',
                        action: event => top.open(href, '_blank'),
                    },{
                        text: `Copy e-mail address`,
                        icon: 'bolt',
                        action: event => navigator.clipboard.writeText(host),
                    });
                } break;

                case 'tel': {
                    extras.push({
                        text: `Dial <strong>${ text }</strong>`,
                        icon: 'chat',
                        action: event => top.open(href, '_blank'),
                    },{
                        text: `Copy telephone number`,
                        icon: 'bolt',
                        action: event => navigator.clipboard.writeText(host),
                    });
                } break;

                default: {
                    extras.push({
                        text: `Open link in new tab`,
                        icon: 'ne_arrow',
                        action: event => top.open(href, '_blank'),
                    },{
                        text: `Copy link address`,
                        icon: 'bolt',
                        action: event => navigator.clipboard.writeText(href),
                    });
                } break;
            }
        }

        // Selections
        else if(selectionText?.length) {
            let email = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i
            if(email.test(selectionText)) {
                let address = RegExp['$&'];

                extras.push({
                    text: `E-mail <strong>${ address }</strong>`,
                    icon: 'chat',
                    action: event => top.open(`mailto:${ address }`, '_blank'),
                },{});
            }

            let phone = /(?<country>[\+]?\d{1,3})?[\.\-\s\(]{0,2}(?<area>[2-9]\d{2})[\)\.\-\s]{0,2}(?<office>[2-9][02-9]1|[2-9]1[02-9]|[2-9][02-9][02-9])[\.\-\s]?(?<line>\d{4})/;
            if(phone.test(selectionText)) {
                let number = RegExp['$&'];

                extras.push({
                    text: `Dial <strong>${ number }</strong>`,
                    icon: 'chat',
                    action: event => top.open(`tel:${ number.replace(/[^\d\+]/g, '') }`, '_blank'),
                },{});
            }

            let website = /(https?:\/\/)?([^\/?#]+?\.\w{2,}\/)([^?#]*)(\?[^#]*)?(#.*)?/i;
            if(website.test(selectionText)) {
                let { protocol, host, pathname, search, hash } = parseURL(selectionText),
                    url = [(protocol || 'https:') + '//', host, pathname, search, hash].join('');

                extras.push({
                    text: `Open link in new tab`,
                    icon: 'ne_arrow',
                    action: event => top.open(url, '_blank'),
                },{
                    text: `Copy link address`,
                    icon: 'bolt',
                    action: event => navigator.clipboard.writeText(url),
                });
            } else {
                extras.push({
                    text: `Search Twitch for <strong>${ selectionText }</strong>`,
                    icon: 'twitch',
                    action: event => top.open(`https://www.twitch.tv/search?term=${ encodeURIComponent(selectionText).split(/(?:%20\b)+/).join(' ') }`, '_self'),
                },{
                    text: `Search Google for <strong>${ selectionText }</strong>`,
                    icon: 'search',
                    action: event => top.open(`https://www.google.com/search?q=${ encodeURIComponent(selectionText).split(/(?:%20\b)+/).join('+').replace(/%22\b/g, '"') }`, '_blank'),
                });
            }
        }

        // Video
        else if(defined(video)) {
            extras.push({
                text: GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X.toTitle(),
                icon: 'bolt',
                shortcut: (defined(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X)? 'alt+shift+x': ''),
                action: event => $('video', true).pop().copyFrame(),
            });
        }

        // ---- ---- STOP ---- ---- //

        if(extras.length)
            extras.splice(0, 0, {});

        new ContextMenu({
            inherit: event,

            options: [{
                text: `Reload page`,
                icon: 'rerun',
                shortcut: 'ctrl+r',
                action: event => top.location.reload(),
            },{
                // break
            },{
                text: `Save page (HTML)`,
                icon: 'download',
                shortcut: 'ctrl+s',
                action: async event => {
                    await alert.timed('Saving page...', 3_000);

                    let DOM = document.cloneNode(true);
                    let type = DOM.contentType,
                        name = DOM.title;

                    let scripts = [...DOM.scripts].filter(script => script.src?.length);
                    for(let script of scripts)
                        await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(script.src)}`, { mode: 'cors' })
                            .then(response => response.text())
                            .then(javascript => {
                                script.removeAttribute('src');
                                script.innerText = javascript;
                            });

                    let styles = [...DOM.styleSheets].filter(style => style.href?.length);
                    for(let style of styles)
                        await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(style.href)}`, { mode: 'cors' })
                            .then(response => response.text())
                            .then(css => {
                                style.removeAttribute('href');
                                style.innerText = css;
                            });

                    for(let element of $('[id*="tt-"i], [class*="tt-"i], [data-a-target*="tt-"i]', true, DOM))
                        element.remove();

                    let blob = new Blob([
                            `<!DOCTYPE ${ DOM.doctype.name }${ DOM.doctype.publicId.replace(/^([^$]+)$/, ' PUBLIC "$1"') }${ DOM.doctype.systemId.replace(/^([^$]+)$/, ' "$1"') }>\n${ DOM.documentElement.outerHTML }`
                        ], { type }),
                        link = furnish('a', { href: URL.createObjectURL(blob), download: `${ name }.html`, hidden: true }, [name, (new Date).toJSON()].join('/'));

                    document.head.append(link);
                    link.click();
                },
            },{
                text: `Print...`,
                icon: 'export',
                shortcut: 'ctrl+p',
                action: event => top.print(),
            }, ...extras],

            fineTuning: { top: (y > innerHeight * (0.85 - extras.length * 0.05)? innerHeight * 0.75: y), left: (x > innerWidth * (0.85 - extras.length * 0.00)? innerWidth * 0.75: x) },
        });
    },{
        capture: false,
        once: false,
        passive: false,
    });
} catch(error) {
    // Most likely in a child frame...
    // REMARK("Moving to chat child frame...");
    if(!parseBool(parseURL(window.location).searchParameters?.hidden))
        WARN(error);
}

async function update() {
    // The location
    window.PATHNAME = PATHNAME = window.location.pathname;

    NORMALIZED_PATHNAME = PATHNAME
        // Remove common "modes"
        .replace(/^(moderator)\/(\/[^\/]+?)/i, '$1')
        .replace(/^(\/[^\/]+?)\/(about|schedule|squad|videos)\b/i, '$1');

    // The theme
    window.THEME = THEME = [...$('html').classList].find(c => /theme-(\w+)/i.test(c)).replace(/[^]*theme-(\w+)/i, '$1').toLowerCase();
    ANTITHEME = window.ANTITHEME = ['light', 'dark'].filter(theme => theme != THEME).pop();

    let [PRIMARY, SECONDARY] = [STREAMER.tint, STREAMER.tone]
        .map(Color.HEXtoColor)
        // Sort furthest from white (descending)
        .sort((C1, C2) => {
            let background = (THEME == 'dark'? [0, 0, 0]: [255, 255, 255]);

            C1 = [C1.R, C1.G, C1.B];
            C2 = [C2.R, C2.G, C2.B];

            if(Color.contrast(background, C1) > Color.contrast(background, C2))
                return +1;
            else if(Color.contrast(background, C1) < Color.contrast(background, C2))
                return -1;
            return 0;
        })
        .map(color => color.RGB);

    THEME__CHANNEL_DARK = (THEME == 'dark'? PRIMARY: SECONDARY);
    THEME__CHANNEL_LIGHT = (THEME != 'dark'? PRIMARY: SECONDARY);

    PRIMARY = Color.HEXtoColor(PRIMARY);
    SECONDARY = Color.HEXtoColor(SECONDARY);

    let contrastOf = (C1, C2) => Color.contrast(...[C1, C2].map(({ R, G, B }) => [R, G, B])),

        black = { R: 0, G: 0, B: 0 },
        white = { R: 255, G: 255, B: 255 },

        theme = (THEME == 'dark'? black: white),
        antitheme = (THEME != 'dark'? black: white);

    THEME__BASE_CONTRAST = contrastOf(PRIMARY, SECONDARY);
    THEME__PREFERRED_CONTRAST = `${ THEME__BASE_CONTRAST.toString() } prefer ${ (contrastOf(PRIMARY, theme) > contrastOf(PRIMARY, antitheme)? THEME: ANTITHEME) }`;

    // All Channels under Search
    window.SEARCH = SEARCH = [
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

                        let parent = $(`.search-tray [href$="${ pathname }"i]:not([href*="/search?"])`);

                        if(nullish(parent))
                            return true;

                        let live = defined($(`[data-test-selector="live-badge"i]`, false, parent));

                        return live;
                    },
                    name: $('img', false, element)?.alt,
                };

                element.setAttribute('draggable', true);
                element.setAttribute('tt-streamer-data', JSON.stringify({ ...channel, chat: null, jump: null, vods: null }));
                element.ondragstart ??= event => {
                    let { currentTarget } = event;

                    event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
                    event.dataTransfer.dropEffect = 'move';
                };

                SEARCH_CACHE.set(channel.name?.toLowerCase?.(), { ...channel });

                return channel;
            }),
    ].filter(uniqueChannels);

    // All visible Channels
    window.CHANNELS = CHANNELS = [
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

                        let parent = $(`#sideNav .side-nav-section [href$="${ pathname }"i]`);

                        if(nullish(parent))
                            return false;

                        let live = defined(parent)
                                && nullish($(`[class*="--offline"i]`, false, parent));

                        return live;
                    },
                    name: $('img', false, element)?.alt,
                };

                element.setAttribute('draggable', true);
                element.setAttribute('tt-streamer-data', JSON.stringify({ ...streamer, chat: null, jump: null, vods: null }));
                element.ondragstart ??= event => {
                    let { currentTarget } = event;

                    event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
                    event.dataTransfer.dropEffect = 'move';
                };

                return streamer;
            }),
    ].filter(uniqueChannels);

    // All followed Channels
    window.STREAMERS = STREAMERS = [
        ...STREAMERS,
        // Current (followed) streamers
        ...$(`#sideNav .side-nav-section[aria-label][tt-svg-label="followed"i] a:not([href$="${ PATHNAME }"i])`, true)
            .map(element => {
                let streamer = {
                    from: 'STREAMERS',
                    href: element.href,
                    icon: $('img', false, element)?.src,
                    get live() {
                        let { href } = element,
                            url = parseURL(href),
                            { pathname } = url;

                        let parent = $(`#sideNav .side-nav-section[aria-label][tt-svg-label="followed"i] [href$="${ pathname }"i]`);

                        if(nullish(parent))
                            return false;

                        let live = defined(parent)
                                && nullish($(`[class*="--offline"i]`, false, parent));

                        return live;
                    },
                    name: $('img', false, element)?.alt,
                };

                element.setAttribute('draggable', true);
                element.setAttribute('tt-streamer-data', JSON.stringify({ ...streamer, chat: null, jump: null, vods: null }));
                element.ondragstart ??= event => {
                    let { currentTarget } = event;

                    event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
                    event.dataTransfer.dropEffect = 'move';
                };

                return streamer;
            }),
    ].filter(uniqueChannels);

    // All Notifications
    window.NOTIFICATIONS = NOTIFICATIONS = [
        ...NOTIFICATIONS,
        // Notification elements
        ...$('[data-test-selector^="onsite-notifications"i] [data-test-selector^="onsite-notification"i]', true).map(
            element => {
                let streamer = {
                    live: true,
                    href: $('a', false, element)?.href,
                    icon: $('img', false, element)?.src,
                    name: $('[class$="text"i]', false, element)?.textContent?.replace(/([^]+?) +(go(?:ing)?|is|went) +live\b([^$]+)/i, ($0, $1, $$, $_) => $1),
                };

                if(nullish(streamer.name))
                    return;

                element.setAttribute('draggable', true);
                element.setAttribute('tt-streamer-data', JSON.stringify({ ...streamer, chat: null, jump: null, vods: null }));
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
    window.ALL_CHANNELS = ALL_CHANNELS = [...ALL_CHANNELS, ...SEARCH, ...NOTIFICATIONS, ...STREAMERS, ...CHANNELS, STREAMER].filter(defined).filter(uniqueChannels);
}

let // Features that require the experimental flag
    EXPERIMENTAL_FEATURES = ['auto_focus', 'convert_emotes', 'greedy_raiding', 'soft_unban'].map(AsteriskFn),

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

let TWITCH_PATHNAMES = [
        '$', '[up]/',

        'activate',
        'bits(-checkout/?)?',
        'checkout/', 'collections/?', 'communities/?',
        'dashboard/?', 'directory/?', 'downloads?', 'drops/?',
        'event/?',
        'following', 'friends?',
        'inventory',
        'jobs?',
        'moderator',
        'popout', 'prime/?', 'products/?',
        'search', 'settings/?', 'store/?', 'subs/?', 'subscriptions?',
        'team', 'turbo',
        'user',
        'videos?',
        'wallet', 'watchparty',
    ],
    RESERVED_TWITCH_PATHNAMES = RegExp(`/(${ TWITCH_PATHNAMES.join('|') })`, 'i');

// Intializes the extension
    // Initialize(START_OVER:boolean) → undefined
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
                WARN(`"${ JobName.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['',' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, '- ') }" took ${ (span / 1000).suffix('s', 2).replace(/\.0+/, '') } to complete (max time allowed is ${ (max / 1000).suffix('s', 2).replace(/\.0+/, '') }). Offense time: ${ new Date }. Offending site: ${ window.location.pathname }`)
                    ?.toNativeStack?.();
        },
        START__STOP_WATCH = (JobName, JobCreationDate = +new Date) => (STOP_WATCHES.set(JobName, JobCreationDate), JobCreationDate);

    // Initialize all settings/features //

    let GLOBAL_TWITCH_API = (window.GLOBAL_TWITCH_API ??= {}),
        GLOBAL_EVENT_LISTENERS = (window.GLOBAL_EVENT_LISTENERS ??= {});

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
        // GetNextStreamer() → Object#Channel
    function GetNextStreamer() {
        // Next channel in "Up Next"
        if(!parseBool(Settings.first_in_line_none) && UP_NEXT_ALLOW_THIS_TAB && ALL_FIRST_IN_LINE_JOBS?.length)
            return GetNextStreamer.cachedStreamer = (null
                ?? ALL_CHANNELS.find(channel => channel?.href?.contains?.(parseURL(ALL_FIRST_IN_LINE_JOBS[0]).pathname))
                ?? {
                    from: 'GET_NEXT_STREAMER',
                    href: parseURL(ALL_FIRST_IN_LINE_JOBS[0]).href,
                    name: parseURL(ALL_FIRST_IN_LINE_JOBS[0]).pathname.slice(1),
                }
            );

        if(parseBool(Settings.stay_live) && defined(GetNextStreamer?.cachedStreamer))
            return GetNextStreamer.cachedStreamer;

        LoadCache('ChannelPoints', ({ ChannelPoints = {} }) => {
            let { random, round } = Math;
            let online = STREAMERS.filter(isLive),
                mostWatched = null,
                mostPoints = 0,
                mostLeft = 0,
                mostProgressNeeded = 0,
                furthestFromCompletion = null,
                leastWatched = null,
                leastPoints = +Infinity,
                leastLeft = +Infinity,
                leastProgressNeeded = +Infinity,
                closestToCompletion = null;

            let [randomChannel] = online.sort(() => random() >= 0.5? +1: -1);

            filtering:
            for(let channel in ChannelPoints) {
                let [streamer] = online.filter(({ name }) => name == channel);

                if(nullish(streamer))
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

            next_channel:
            switch(Settings.next_channel_preference) {
                // The most popular channel (most amount of current viewers)
                case 'popular': {
                    GetNextStreamer.cachedStreamer = online[0];
                } break;

                // The least popular channel (least amount of current viewers)
                case 'unpopular': {
                    GetNextStreamer.cachedStreamer = online[online.length - 1];
                } break;

                // Most watched channel (most channel points)
                case 'rich': {
                    GetNextStreamer.cachedStreamer = STREAMERS.find(channel => channel.name === mostWatched);
                } break;

                // Least watched channel (least channel points)
                case 'poor': {
                    GetNextStreamer.cachedStreamer = STREAMERS.find(channel => channel.name === leastWatched);
                } break;

                // Most un-earned Rewards & Challenges
                case 'furthest': {
                    GetNextStreamer.cachedStreamer = STREAMERS.find(channel => channel.name === furthestFromCompletion);
                } break;

                // Least un-earned Rewards & Challenges
                case 'closest': {
                    GetNextStreamer.cachedStreamer = STREAMERS.find(channel => channel.name === closestToCompletion);
                } break;

                // Do not use this feature
                case 'none': {
                    return null;
                } break;

                // A random channel
                case 'random':
                default: {
                    GetNextStreamer.cachedStreamer = randomChannel;
                } break;
            }

            // There isn't a channel that fits the criteria
            if(parseBool(Settings.stay_live) && nullish(GetNextStreamer?.cachedStreamer) && online?.length) {
                let preference = Settings.next_channel_preference,
                    channels = (GetNextStreamer.cachedStreamer ??= randomChannel);

                if(!channels?.length)
                    return randomChannel;

                let [channel] = channels,
                    { name } = channel;

                WARN(`No channel fits the "${ preference }" criteria. Assuming a random channel is desired:`, channel);
            }
        });

        return until(() => GetNextStreamer.cachedStreamer);
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

                            let parent = $(`.search-tray [href$="${ pathname }"i]:not([href*="/search?"])`);

                            if(nullish(parent))
                                return false;

                            let live = defined($(`[data-test-selector="live-badge"i]`, false, parent));

                        return live;
                    },
                    name: $('img', false, element)?.alt,
                };

                element.setAttribute('draggable', true);
                element.setAttribute('tt-streamer-data', JSON.stringify({ ...channel, chat: null, jump: null, vods: null }));
                element.ondragstart ??= event => {
                    let { currentTarget } = event;

                    event.dataTransfer.setData('application/tt-streamer', currentTarget.getAttribute('tt-streamer-data'));
                    event.dataTransfer.dropEffect = 'move';
                };

                SEARCH_CACHE.set(channel.name?.toLowerCase?.(), { ...channel });

                return channel;
            }),
    ].filter(uniqueChannels);

    /** Streamer Array - the current streamer/channel
     * chat:array*       - GETTER: an array of the current chat, sorted the same way messages appear. The last message is the last array entry
     * coin:number*      - GETTER: how many channel points (floored to the nearest 100) does the user have
     * coms:array*       - GETTER: returns the channel commands (if available)
     * cult:number*      - GETTER: the estimated number of followers
     * data:object       - extra data about the channel
     * desc:string*      - GETTER: the status (description/title) of the stream
     * done:boolean*     - GETTER: are all of the channel point rewards purchasable
     * face:string       - GETTER: a URL to the channel points image (if applicable)
     * fiat:string*      - GETTER: returns the name of the channel points (if applicable)
     * follow:function   - follows the current channel
     * from:string*      - GETTER: returns where the data was collected for the object
     * game:string*      - GETTER: the name of the current game/category
     * href:string       - link to the channel (usually the current href)
     * icon:string       - link to the channel's icon/image
     * jump:array*       - GETTER: extra data from the Apollo data-stream
     * like:boolean*     - GETTER: is the user following the current channel
     * live:boolean*     - GETTER: is the channel currently live
     * main:boolean*     - GETTER: returns whether the stream is the user's Prime Subscription
     * mark:number*      - GETTER: returns an activity score based on the channel's tags
     * name:string       - the channel's username
     * paid:boolean*     - GETTER: is the user  subscribed
     * ping:boolean*     - GETTER: does the user have notifications on
     * plug:boolean*     - GETTER: is there an advertisement running
     * poll:number*      - GETTER: how many viewers are watching the channel
     * rank:number*      - GETTER: what is the user's assumed rank--based on the amount of channel points they possess
     * redo:boolean*     - GETTER: is the channel streaming a rerun (VOD)
     * sole:number       - GETTER: the channel's ID
     * tags:array*       - GETTER: tags of the current stream
     * team:string*      - GETTER: the team the channel is affiliated with (if applicable)
     * time:number*      - GETTER: how long has the channel been live
     * tint:string*      - GETTER: the channel's accent color (if applicable)
     * tone:string*      - GETTER: the channel's complementary accent color (if applicable)
     * unfollow:function - unfollows the current channel
     * veto:boolean      - GETTER: determines if the user is banned from the chat or not
     * vods:array*       - GETTER: returns a list (up to 25) of the channel's VODs

     * Only available with Fine Details enabled
     * ally:boolean      - is the channel partnered?
     * fast:boolean      - is the channel using turbo?
     * nsfw:boolean      - is the channel deemed NSFW (mature)?
     */
    STREAMER = window.STREAMER = {
        get chat() {
            return GetChat();
        },

        get coin() {
            let balance = $('[data-test-selector="balance-string"i]'),
                points = parseCoin(balance?.textContent);

            return points;
        },

        get coms() {
            return(async channel => {
                if(COMMANDS?.length > 0)
                    return COMMANDS;
                COMMANDS = [{ aliases: [], command: STREAMER.name, reply: '$(channel.display_name) is streaming $(game) for $(channel.viewers) viewers', availability: 'owner', enabled: false, cost: 0 }];

                /** User Levels → StreamElements | NightBot
                 * Everyone         →   100 | everyone
                 * Subscriber       →   250 | subscriber
                 * Regular          →   300 | regular
                 * VIP              →   400 | twitch_vip
                 * Moderator        →   500 | moderator
                 * Super Moderator  →   1000 | admin
                 * Broadcaster      →   1500 | owner
                 */
                let USER_LEVELS = ({
                    everyone:           [100, 'everyone'],
                    subscriber:         [250, 'subscriber'],
                    regular:            [300, 'regular'],
                    vip:                [400, 'twitch_vip'],
                    moderator:          [500, 'moderator'],
                    admin:              [1000, 'admin'],
                    broadcaster:        [1500, 'owner'],
                });

                let match = level => Object.keys(USER_LEVELS).find(key => USER_LEVELS[key].contains(level));

                // StreamElements
                    // accessLevel: 100
                    // aliases: []
                    // channel: "5f5989e007c66e281ad711ac"
                    // command: "uptime"
                    // cooldown: {user: 30, global: 30}
                    // cost: 0
                    // createdAt: "2020-09-10T02:07:05.487Z"
                    // enabled: true
                    // enabledOffline: true
                    // enabledOnline: true
                    // hidden: false
                    // keywords: []
                    // reply: "$(twitch $(channel) \"{{displayName}} has been live for {{uptimeLength}}\")"
                    // type: "say"
                    // updatedAt: "2020-09-10T02:07:05.487Z"
                    // _id: "5f598a4986ca683315a3f402"
                await fetch(`https://api.streamelements.com/kappa/v2/channels/${ channel.name }`, { mode: 'cors' })
                    .then(r => r?.json?.())
                    .then(json => json?._id)
                    .then(async id => {
                        let commands = {};

                        if(nullish(id))
                            return [];

                        for(let type of ['public', 'default'])
                            await fetch(`https://api.streamelements.com/kappa/v2/bot/commands/${ id }/${ type }`)
                                .then(r => r.json())
                                .then(json => commands[type] ??= json);

                        return [...commands.public, ...commands.default];
                    })
                    .then(commands => {
                        for(let metadata of commands) {
                            let { aliases, command, reply, accessLevel, enabled, count = 0, cooldown, cost } = metadata;

                            COMMANDS.push({ aliases: [...aliases, ...commands.filter(command => command.reply?.contains(command))], command, reply, availability: match(accessLevel), enabled, origin: 'StreamElements', variables: { count, coolDown: cooldown.global, cost } });
                        }
                    });

                // NightBot
                    // coolDown: 30
                    // count: 0
                    // createdAt: "2021-07-31T05:33:56.000Z"
                    // message: "hello my cute little pogchamp kyootbHeart"
                    // name: "hi"
                    // updatedAt: "2021-07-31T05:33:56.305Z"
                    // userLevel: "everyone"
                    // _id: "6104e0c44038915692edaeed"
                await fetch(`https://api.nightbot.tv/1/channels/t/${ channel.name }`, { mode: 'cors' })
                    .then(r => r?.json?.())
                    .then(json => json?.channel?._id)
                    .then(async id => {
                        let commands = [];

                        if(nullish(id))
                            return commands;

                        await fetch('https://api.nightbot.tv/1/commands', { headers: { 'nightbot-channel': id } })
                            .then(r => r.json())
                            .then(json => {
                                if(!json.status.toString().startsWith('2'))
                                    return [];

                                commands = [...commands, ...json.commands];
                            });

                        return commands;
                    })
                    .then(commands => {
                        for(let metadata of commands) {
                            let { name, message, userLevel, enabled = true, count, coolDown, cost = 0 } = metadata,
                                regexp = /^[!]/;

                            if(!regexp.test(name))
                                continue;

                            COMMANDS.push({ aliases: commands.filter(command => command.message.contains(name)).map(command => command.name.replace(regexp, '')), command: name.replace(regexp, ''), reply: message, availability: match(userLevel), enabled, origin: 'NightBot', variables: { count, coolDown, cost } });
                        }
                    });

                let commands = new Map;
                for(let command of await COMMANDS)
                    commands.set(command.command, command);

                return COMMANDS = [[...commands].map(([name, value]) => value)]
                    .flat()
                    .filter(c => defined(c.command))
                    .sort((a, b) => a.command.length > b.command.length? -1: +1);
            })(STREAMER);
        },

        get cult() {
            return (STREAMER.data?.followers) || parseCoin($('.about-section span')?.getElementByText(/\d/)?.textContent);
        },

        // Gets values later...
        data: {},

        get desc() {
            return $('[data-a-target="stream-title"i]')?.textContent;
        },

        get done() {
            return STREAMER.__done__ ?? (async() => {
                let done;

                await LoadCache(['ChannelPoints'], ({ ChannelPoints = {} }) => {
                    let { name } = STREAMER,
                        [amount, fiat, face, notEarned, pointsToEarnNext] = (ChannelPoints[name] ?? 0).toString().split('|'),
                        allRewards = $('[data-test-selector="cost"i]', true);

                    notEarned = (
                        (allRewards?.length)?
                            allRewards.filter(amount => parseCoin(amount?.textContent) > STREAMER.coin).length:
                        (notEarned > -Infinity)?
                            notEarned:
                        -1
                    );

                    return STREAMER.__done__ = done = (notEarned == 0);
                });

                return await until(() => done);
            })();
        },

        get face() {
            let balance = $('[data-test-selector="balance-string"i]');

            if(nullish(balance))
                return PostOffice.get('points_receipt_placement')?.coin_face;

            let container = balance?.closest('button'),
                icon = $('img[alt]', false, container);

            return icon?.src;
        },

        get fiat() {
            let balance = $('[data-test-selector="balance-string"i]');

            if(nullish(balance))
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
                name = element?.textContent,
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
            return $(`[class*="channel"i] *:is(a[href$="${ NORMALIZED_PATHNAME }"i], [data-a-channel]) img`)?.src
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
                    && defined($('[status] [class*="status-text"i]')) && nullish($(`[class*="offline-recommend"i]`))
                    && !/^offline$/i.test($(`[class*="video-player"i] [class*="media-card"i], [class*="channel"i][class*="status"i]`)?.textContent?.trim() ?? "")
                )
        },

        get main() {
            return STREAMER.paid && defined($('[tt-svg-label="prime-subscription"i]')?.closest('button[data-a-target^="subscribe"i]'))
        },

        get mark() {
            let tags = [];

            $('.tw-tag', true).map(element => {
                let { href } = element.closest('a[href]');

                if(parseBool(Settings.show_stats)) {
                    let score = scoreTagActivity(href);

                    new Tooltip(element, `${ '+-'[+(score < 0)] }${ score }`, { from: 'top' });
                }

                tags.push(href);
            });

            return scoreTagActivity(...tags);
        },

        get name() {
            return $(`[class*="channel-info"i] a[href$="${ NORMALIZED_PATHNAME }"i]${ ['', ' h1'][+NORMAL_MODE] }`)?.textContent ?? LIVE_CACHE.get('name')
        },

        get paid() {
            return defined($('[data-a-target="subscribed-button"i]'))
        },

        get perm() {
            /** User Levels → StreamElements | NightBot
             * Everyone         →   100 | everyone
             * Subscriber       →   250 | subscriber
             * Regular          →   300 | regular
             * VIP              →   400 | twitch_vip
             * Moderator        →   500 | moderator
             * Super Moderator  →   1000 | admin
             * Broadcaster      →   1500 | owner
             */
            return (
                (STREAMER.name == USERNAME)?
                    'owner':
                (IS_TWITCH_ADMIN)?
                    'admin':
                (IS_CHANNEL_MODERATOR = PostOffice.get('IS_CHANNEL_MODERATOR'))?
                    'moderator':
                (IS_CHANNEL_VIP = PostOffice.get('IS_CHANNEL_VIP'))?
                    'vip':
                (STREAMER.paid)?
                    'subscriber':
                (STREAMER.ping)?
                    'regular':
                'everyone'
            );
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

        get rank() {
            let { max, sqrt, round } = Math;
            let epoch = +new Date('2019-12-16T00:00:00.000Z'),
                // epoch → when channel points where first introduced - https://blog.twitch.tv/en/2019/12/16/channel-points-an-easy-way-to-engage-with-your-audience/
                start = +new Date(STREAMER.data.firstSeen),
                end = +new Date;

            start = max((start || epoch), epoch);

            let length = ((end - start) / 60_000),
                height = (STREAMER.data.followers ?? STREAMER.cult),

                viewed = ((STREAMER.coin | 1) * 3/7/2),
                amount = (viewed / length),
                rank = (height / height**amount);

            return round(rank.clamp(0, length));
        },

        get redo() {
            return /^rerun$/i.test($(`[class*="video-player"i] [class*="media-card"i]`)?.textContent?.trim() ?? "");
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

        get team() {
            let element = $('[href^="/team"]'),
                team = new String((element?.textContent ?? "").trim());

            Object.defineProperties(team, {
                href: { value: element?.href }
            });

            return team;
        },

        get time() {
            return parseTime($('.live-time')?.textContent ?? '0');
        },

        get tint() {
            let color = window
                ?.getComputedStyle?.($(`main a[href$="${ NORMALIZED_PATHNAME }"i]`) ?? $(':root'))
                ?.getPropertyValue?.('--color-accent');

            return (color || '#9147FF').toUpperCase();
        },

        get tone() {
            let { H, S, L } = Color.HEXtoColor(STREAMER.tint);

            return Color.HSLtoRGB(H, S, (100 - L).clamp(15, 85)).RGB.toUpperCase();
        },

        get veto() {
            return !!$('[id*="banned"i], [class*="banned"i]', true).length;
        },

        get vods() {
            let { name, sole } = STREAMER;

            return fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.twitchmetrics.net/c/${ sole }-${ name }/videos?sort=published_at-desc`)}`, { mode: 'cors' })
                .then(response => response.text())
                .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                .then(DOM => $('[href*="/videos/"i]:not(:only-child)', true, DOM).map(a => ({ name: a.textContent.trim(), href: a.href })) )
                .catch(WARN);
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

    if(nullish(StreamerMainIcon))
        return /* Leave the main function (Initialize) if there's no streamer icon... Probably not in a stream */;

    for(let key of 'chat coin paid ping poll tags team time __eventlisteners__'.split(' '))
        delete StreamerFilteredData[key];

    StreamerMainIcon.setAttribute('draggable', true);
    StreamerMainIcon.setAttribute('tt-streamer-data', JSON.stringify({ ...STREAMER, chat: null, jump: null, vods: null }));
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
        ...$('[data-test-selector^="onsite-notifications"i] [data-test-selector^="onsite-notification"i]', true)
            .map(element =>
                ({
                    live: true,
                    href: $('a', false, element)?.href,
                    icon: $('img', false, element)?.src,
                    name: $('[class$="text"i]', false, element)?.textContent?.replace(/([^]+?) +(go(?:ing)?|is|went) +live\b([^$]+)/i, ($0, $1, $$, $_) => $1),
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

        let ALL_LIVE_SIDE_PANEL_CHANNELS = $('#sideNav .side-nav-section[aria-label][tt-svg-label="followed"i] a', true).filter(e => nullish($('[class*="--offline"i]', false, e)));

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
                                { pathname } = url,
                                name = pathname.slice(1).toLowerCase();

                            // Return the cached results first...
                            let cache = SEARCH_CACHE.get(name);

                            if(defined(cache))
                                return cache.live;

                            // Then the actual "does the channel show up" result
                            let parent = $(`#sideNav .side-nav-section [href$="${ pathname }"i]`);

                            if(nullish(parent))
                                return false;

                            // The "is it offline" result
                            let live = defined(parent) && nullish($(`[class*="--offline"i]`, false, parent));

                            return live;
                        },
                        name: $('img', false, element)?.alt,
                    };

                    element.setAttribute('draggable', true);
                    element.setAttribute('tt-streamer-data', JSON.stringify({ ...streamer, chat: null, jump: null, vods: null }));
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

                            let parent = $(`#sideNav .side-nav-section [href$="${ pathname }"i]`);

                            if(nullish(parent))
                                return false;

                            let live = defined(parent) && nullish($(`[class*="--offline"i]`, false, parent));

                            return live;
                        },
                        name: $('img', false, element)?.alt,
                    };

                    element.setAttribute('draggable', true);
                    element.setAttribute('tt-streamer-data', JSON.stringify({ ...streamer, chat: null, jump: null, vods: null }));
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
            ...$(`#sideNav .side-nav-section[aria-label][tt-svg-label="followed"i] a:not([href$="${ NORMALIZED_PATHNAME }"i])`, true)
                .map(element => {
                    let streamer = {
                        from: 'STREAMERS',
                        href: element.href,
                        icon: $('img', false, element)?.src,
                        get live() {
                            let { href } = element,
                                url = parseURL(href),
                                { pathname } = url;

                            let parent = $(`#sideNav .side-nav-section[aria-label][tt-svg-label="followed"i] [href$="${ pathname }"i]`);

                            if(nullish(parent))
                                return false;

                            let live = defined(parent) && nullish($(`[class*="--offline"i]`, false, parent));

                            return live;
                        },
                        name: $('img', false, element)?.alt,
                    };

                    element.setAttribute('draggable', true);
                    element.setAttribute('tt-streamer-data', JSON.stringify({ ...streamer, chat: null, jump: null, vods: null }));
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

                    USERNAME = window.USERNAME = cookies.name ?? USERNAME;

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

                    if(nullish(STREAMER.name))
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
                                STREAMER.data = { ...STREAMER.data, ...data };

                            REMARK(`Cached details about "${ STREAMER.name }"`, data);
                        });
                    } catch(exception) {
                        let { name, sole } = STREAMER;

                        if(!sole)
                            await new Search(name)
                                .then(Search.convertResults)
                                .then(streamer => sole = streamer.sole);

                        if(!sole)
                            break __FineDetails__;

                        // Proper CORS requests to fetch the HTML data
                        // Stream details
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
                                    ) * 60_000
                                ));

                                REMARK(`Stream details about "${ STREAMER.name }"`, data);

                                return STREAMER.data = { ...STREAMER.data, ...data };
                            })
                            .then(data => {
                                data = { ...data, dataRetrievedOK: defined(data?.dailyBroadcastTime), dataRetrievedAt: +new Date };

                                SaveCache({ [`data/${ STREAMER.name }`]: data });
                            });

                        // Channel details
                        await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.twitchmetrics.net/c/${ sole }-${ name }`)}`, { mode: 'cors' })
                            .then(response => response.text())
                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                            .then(DOM => {
                                let data = {};

                                $('dt+dd', true, DOM).map(dd => {
                                    let name = dd.previousElementSibling.textContent.trim().toLowerCase().replace(/\s+(\w)/g, ($0, $1, $$, $_) => $1.toUpperCase()),
                                        value = dd.textContent.trim();

                                    value = (
                                        /^(followers)$/i.test(name)?
                                            parseInt(value.replace(/\D/g, '')):
                                        /^((first|last)seen)$/i.test(name)?
                                            new Date($('time', false, dd).getAttribute('datetime')):
                                        value
                                    );

                                    data[name] = value;
                                });

                                REMARK(`Channel details about "${ STREAMER.name }"`, data);

                                return STREAMER.data = { ...STREAMER.data, ...data };
                            })
                            .then(data => {
                                data = { ...data, dataRetrievedOK: defined(data?.firstSeen), dataRetrievedAt: +new Date };

                                SaveCache({ [`data/${ STREAMER.name }`]: data });
                            });;

                        //  OBSOLETE //
                        // await fetch(`https://api.twitch.tv/api/${ type }s/${ value }/access_token?oauth_token=${ token }&need_https=true&platform=web&player_type=site&player_backend=mediaplayer`)
                        //     .then(response => response.json())
                        //     .then(json => GLOBAL_TWITCH_API = JSON.parse(json.token ?? "null"))
                        //     .then(json => {
                        //         if(nullish(json))
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
                        //     /* Conversion => Text → HTML → Element → JSON */
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
                        //                     .textContent
                        //                     .toLowerCase();
                        //
                        //                 /* Set initial value, and adjust name */
                        //                 value = value
                        //                     .textContent
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
                        //         return STREAMER.data = { ...STREAMER.data, ...data };
                        //     })
                        //     .then(data => {
                        //         data = { ...data, dataRetrievedAt: +new Date };
                        //
                        //         SaveCache({ [`data/${ STREAMER.name }`]: data });
                        //     });
                    }
                }
            };
        });

    // TODO: Add an "un-delete" feature for chat...
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
    let IGNORE_ZOOM_STATE = false;
    Handlers.auto_accept_mature = () => {
        $([
            '[data-a-target="player-overlay-mature-accept"i]',
            '[data-a-target*="watchparty"i] button',
            (IGNORE_ZOOM_STATE? '': '.home:not([user-intended="true"i]) [data-a-target^="home"i]')
        ].filter(s => s.length).join(','))?.click();
    };
    Timers.auto_accept_mature = 5_000;

    __AutoMatureAccept__:
    if(parseBool(Settings.auto_accept_mature)) {
        RegisterJob('auto_accept_mature');

        $(`[class*="info"i] [href$="${ STREAMER.name }"i] [class*="title"i], main [href$="${ STREAMER.name }"i]`, true).map(element => {
            element.closest('div[class]').addEventListener('mousedown', async({ isTrusted, button = -1 }) => {
                !button && (await until(() => $('.home')))?.setAttribute?.('user-intended', IGNORE_ZOOM_STATE = isTrusted);
            })
        });
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

        tags = tags.map(tag => tag.split(/\//).pop().toUpperCase());

        scoring:
        for(let tag of tags)
            switch(tag) {
                case '4D1EAA36-F750-4862-B7E9-D0A13970D535': // Action
                case '80427D95-BB46-42D3-BF4D-408E9BDCA49A': // Adventure
                case 'A69F7FFB-DDDA-4C05-8D7D-F0B24975A2C3': // FPS
                case '9386024F-DB7E-4E4F-B8DF-A73E354C5BC2': // Pinball
                case '5D289CF9-D75A-42B5-A635-0D117609E6A6': // Platformer
                case 'E607B115-8FA1-49C1-ACDF-F6927BE4CA1B': // Shoot
                case '523FE736-FA95-44C7-B22F-13008CA2172C': // Shooter
                case '0D4233AF-7AC6-49DA-937D-E0F42B7DB187': // Sports
                case '7199189A-0569-4854-908E-08E6C3667379': // Wrestling
                {
                    score += 20;
                } continue scoring;

                case '7304B834-D065-47D5-9865-C19CD17D2639': // 4X
                case 'E62CB1D5-A47D-4690-A373-FE4C0856F78B': // BMX
                case '2FFD5C3E-B927-4749-BA53-79D3B626B2DA': // Cosplay
                case '011F7C20-F533-4AD1-8093-8C6F8F75BC4C': // Drag
                case 'F5ED5BD0-78CB-4467-8E13-9172A210B64D': // Driving
                case 'D27DA25E-1EE2-4207-BB11-DD8D54FA29EC': // E3
                case '36A89A80-4FCD-4B74-B3D2-2C6FD9B30C95': // Esports
                case '246D6E4B-B9C6-442B-9573-77028839F194': // Fashion
                case '9751EE1D-0E5A-4FD3-8E9F-BC3C5D3230F0': // Fighting
                case '068C541B-DC07-4D7F-A689-5578F90905A9': // Game
                case '2610CFF9-10AE-4CB3-8500-778E6722FBB5': // IRL
                case '643FE658-C4FC-45F0-9AED-CBE54A7C1D10': // MMO
                case '12510423-D1F6-4992-8AEA-1441A43D1DF4': // MOBA
                case 'B1E92364-CBDA-4033-92FC-E01094C1753F': // Party
                case '8486F56B-8677-44F7-8004-000295391524': // PvP
                case '0C99BF18-5A92-4257-8974-D7A60088D1E8': // Point
                case 'C8BB9D08-8202-42F8-B028-C59AC1AAFE76': // Rhythm
                case 'CAD488FB-C95C-4BE1-B197-5B851D3A12FA': // Roguelike
                case 'CA470745-C1DF-4C11-9474-9AB79DFC1863': // VR
                case '52D7E4CC-633D-46F5-818C-BB59102D9549': // Vtuber
                {
                    score += 15;
                } continue scoring;

                case 'E659959D-392F-44C5-83A5-FB959CDBACCC': // 100%
                case 'A31DAEB5-EDC2-4B29-AFA1-84C96612836D': // 12
                case '27937CEC-5CFC-4F56-B1D3-F6E1D67735E2': // Achievement
                case '6606E54C-F92D-40F6-8257-74977889CCDD': // Anime
                case '7FF66192-68EF-4B69-8906-24736BF66ED0': // Arcade
                case '72340836-353F-49BF-B9BE-1AAC4F658AFE': // Athletics
                case 'CD2EE226-342B-4E6B-90D5-C14687006B04': // Autobattler
                case '1400CA9C-84EA-414E-A85B-076A70D38ECF': // Automotive
                case '31866A92-269D-4DF3-A2FB-58081BF97378': // Baking
                case 'F1E3759C-35B3-4858-A50F-8F9CAFC2660F': // Brickbuilding
                case 'E36D0169-268A-4C62-A4F4-DDF61A0B3AE4': // Creative
                case '3FFBEC21-97A2-43F9-BD73-4506A1B4D62C': // Farming
                case '10D820BB-A0A9-40DF-B0D3-FE32B45419EE': // Flight
                case 'CF0F97AD-EFB8-4494-83EC-6A11CA30261B': // Horror
                case '6E23D976-33EC-47E8-B22B-3727ACD41862': // Mobile
                case '6540ED8D-3282-44DF-A592-887B37881846': // Mystery
                case '9D38085E-EE62-4203-877B-81797052A18B': // RPG
                case '3E30C47A-26C0-4DD3-9C3A-9CD6AD35589C': // RTS
                case 'AE7D0652-8B2E-476B-8B51-A076550B234F': // Survival
                {
                    score += 10;
                } continue scoring;

                case '3DC8F084-D886-4264-B20F-8BD5F90562B5': // Animals
                case 'E3A6B378-232B-4EC2-9A82-86B72851E09A': // Animation
                case 'DF448DA8-7082-45B2-92AD-C624DBA6551F': // Art
                case '8D39B307-D3AD-4F4A-98A4-D1951F55CEB7': // Card
                case 'D81D54C8-D705-4DF6-AAF0-01D715C1DBCC': // DJ
                case 'AA971BDC-A28D-4A33-A686-F112C764E73B': // Drones
                case 'CB00CFE5-AE4E-4E4F-A8F1-8FA6DDEC6361': // Fantasy
                case '71265475-E0B0-411E-A0CF-B93C33848B2B': // Gambling
                case 'C2839AF5-F1D2-46C4-8EDC-1D0BFBD85070': // Hype
                case 'D72D9DE6-1DF8-4C4E-B6A2-74E6F4C80557': // Indie
                case '537F5D21-9CA0-4632-84F3-9A29A761D66D': // Metroidvania
                case 'A682F560-5186-4871-B97A-8D8E3F4308E9': // Open
                case '7616F6EA-7E3D-4501-A87C-C160D2BC1849': // Puzzle
                case '22E434B6-CA88-46E8-91EF-C18EE1CB8A67': // Simulation
                case '0472BAB0-E068-49B3-9BB8-789FDFE3C66A': // Stealth
                case 'CD9ED640-426D-4A08-B8E0-417A61197264': // Unboxing
                {
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

            if(nullish(video))
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

                        for(let [mismatch, time, trend] of CAPTURE_HISTORY) {
                            threshold += parseFloat(mismatch);
                            totalTime += time;
                            bias.push(trend);
                        }
                        threshold /= CAPTURE_HISTORY.length;

                        let trend = (misMatchPercentage > (parseBool(Settings.auto_focus_detection_threshold)? detectionThreshold: threshold)? 'up': 'down');

                        (window.CAP_HIS = CAPTURE_HISTORY).push([misMatchPercentage, analysisTime, trend]);

                        /* Display capture stats */
                        let diffImg = $('img#tt-auto-focus-differences'),
                            diffDat = $('span#tt-auto-focus-stats'),
                            stop = +new Date;

                        DisplayingAutoFocusDetails:
                        if(Settings.show_stats) {
                            let parent = $('.chat-list--default');
                            // #twilight-sticky-header-root

                            if(nullish(parent))
                                break DisplayingAutoFocusDetails;

                            let { height, width } = getOffset(video),
                                { videoHeight } = video;

                            height = parseInt(height * .25);
                            width = parseInt(width * .25);

                            if(nullish(diffImg)) {
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
                            // Positive activity trend; disable Lurking, pause Up Next
                            if((nullish(POSITIVE_TREND) || POSITIVE_TREND === false) && bias.slice(-(30 / pollInterval)).filter(trend => trend === 'down').length < (30 / pollInterval) / 2) {
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

                                // Disable Lurking
                                __AutoFocus_Disable_AwayMode__: {
                                    let button = $('#away-mode'),
                                        quality = await GetQuality();

                                    if(quality.auto)
                                        break __AutoFocus_Disable_AwayMode__;

                                    button?.click();

                                    changes.push('disabling lurking');
                                }

                                detectedTrend = '&uArr;';
                                LOG('Positive trend detected: ' + changes.join(', '));
                            }
                            // Negative activity trend; enable Lurking, resume Up Next
                            else if((nullish(POSITIVE_TREND) || POSITIVE_TREND === true) && bias.slice(-(60 / pollInterval)).filter(trend => trend === 'up').length < (60 / pollInterval) / 5) {
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

                                // Enable Lurking
                                __AutoFocus_Enable_AwayMode__: {
                                    let button = $('#away-mode'),
                                        quality = await GetQuality();

                                    if(quality.low)
                                        break __AutoFocus_Enable_AwayMode__;

                                    button?.click();

                                    changes.push('enabling lurking');
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
                            WARN('The stream seems to be stalling...', 'Increasing Auto-Focus job time...', (POLL_INTERVAL / 1000).toFixed(2) + 's → ' + (POLL_INTERVAL * 1.1 / 1000).toFixed(2) + 's');

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

    /*** Lurking
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
        MAINTAIN_VOLUME_CONTROL = true,
        NUMBER_OF_FAILED_QUALITY_FETCHES = 0;

    Handlers.away_mode = async() => {
        START__STOP_WATCH('away_mode');

        let button = $('#away-mode'),
            currentQuality = (Handlers.away_mode.quality ??= await GetQuality());

        // Alt + A | Opt + A
        if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_A))
            document.addEventListener('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_A = function Toggle_Lurking({ key, altKey, ctrlKey, metaKey, shiftKey }) {
                if(!(ctrlKey || metaKey || shiftKey) && altKey && 'aA'.contains(key))
                    $('#away-mode')?.click?.();
            });

        /** Return (don't activate) if
         * a) The toggle-button already exists
         * b) There is an advertisement playing
         * c) There are no quality controls
         * d) The page is a search
         */
        if(defined(button) || defined($('[data-a-target*="ad-countdown"i]')) || nullish(currentQuality) || /\/search\b/i.test(NORMALIZED_PATHNAME)) {
            // If the quality controls have failed to load for 1min, leave the page
            if(nullish(currentQuality) && ++NUMBER_OF_FAILED_QUALITY_FETCHES > 60) {
                let scapeGoat = await GetNextStreamer();

                WARN(`The following page failed to load correctly (no quality controls present): ${ STREAMER.name } @ ${ (new Date) }`)
                    ?.toNativeStack?.();

                open(parseURL(scapeGoat.href).pushToSearch({ tool: 'away-mode--scape-goat' }).href, '_self');
            }

            return JUDGE__STOP_WATCH('away_mode');
        }

        await LoadCache({ AwayModeEnabled }, cache => AwayModeEnabled = cache.AwayModeEnabled ?? false);

        let enabled = AwayModeStatus = AwayModeEnabled || (currentQuality.low && !(currentQuality.auto || currentQuality.high || currentQuality.source));

        if(nullish(button)) {
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

            if(nullish(parent) || nullish(sibling))
                return JUDGE__STOP_WATCH('away_mode') /* || WARN('Unable to create the Lurking button') */;

            container.innerHTML = sibling.outerHTML.replace(/(?:[\w\-]*)(?:follow|header|notifications?|settings-menu)([\w\-]*)/ig, 'away-mode$1');
            container.id = 'away-mode';
            // TODO: Add an animation for the Away Mode button appearing?
            // container.setAttribute('style', 'animation:1s fade-in-from-zero 1;');

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
                tooltip: new Tooltip(container, `Turn lurking ${ ['on','off'][+enabled] } (${ GetMacro('alt+a') })`, { from: 'top', left: +5 }),
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
        if(nullish(InitialQuality)) {
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

        let [accent, complement] = (Settings.accent_color ?? 'blue/12').split('/');

        // if(init === true) →
        // Don't use above, event listeners won't work
        button.background?.setAttribute('style', `background:${ [`var(--user-accent-color)`, 'var(--color-background-button-secondary-default)'][+(button.container.getAttribute('tt-away-mode-enabled') === "true")] } !important;`);
        // button.icon.setAttribute('height', '20px');
        // button.icon.setAttribute('width', '20px');

        button.container.onclick ??= async event => {
            let enabled = !parseBool(AwayModeButton.container.getAttribute('tt-away-mode-enabled')),
                { container, background, tooltip } = AwayModeButton;

            container.setAttribute('tt-away-mode-enabled', enabled);
            tooltip.innerHTML = `Turn lurking ${ ['on','off'][+enabled] } (${ GetMacro('alt+a') })`;
            background?.setAttribute('style', `background:${ [`var(--user-accent-color)`, 'var(--color-background-button-secondary-default)'][+enabled] } !important;`);

            // Return control when Lurking is engaged
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

        AwayModeButton = button;

        JUDGE__STOP_WATCH('away_mode');
    };
    Timers.away_mode = 1_000;

    Unhandlers.away_mode = () => {
        $('#away-mode')?.remove();
    };

    __AwayMode__:
    if(parseBool(Settings.away_mode)) {
        REMARK("Adding & Scheduling the Lurking button...");

        RegisterJob('away_mode');

        // Maintain the volume until the user changes it
        GetVolume.onchange = (volume, { isTrusted = false }) => {
            if(!MAINTAIN_VOLUME_CONTROL || !isTrusted)
                return;

            WARN('[Lurking] is releasing volume control due to user interaction...');

            MAINTAIN_VOLUME_CONTROL = !isTrusted;

            SetVolume(volume);
        };

        // Scheduling logic...
        until(() => $('#away-mode'), 3_000).then(awayMode => {
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

            let desiredStatus,
                currentStatus = parseBool(awayMode.getAttribute('tt-away-mode-enabled'));

            for(let schedule of schedules) {
                let { day, time, duration, status } = schedule;

                if(TODAY != day)
                    continue;

                if((H < time) || (H > (time + duration) % 24))
                    continue;

                duration *= 3_600_000;

                WARN(`Lurking is scheduled to be "${ ['off','on'][+status] }" for ${ weekdays[day] } @ ${ time }:00 for ${ toTimeString(duration, '?hours_h') }`);

                // Found at least one schedule...
                if(defined(desiredStatus = status))
                    break;
            }

            // Scheduled state...
            // LOG('Lurking needs to be:', desiredStatus, 'Currently:', currentStatus);
            if(defined(desiredStatus) && desiredStatus != currentStatus)
                awayMode.click();
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
        let container = $('.prime-offers');

        if(parseInt($('[class*="pill"i]', false, container)?.textContent || 0) <= 0)
            return;
        let button = $('button', false, container);

        button.click();

        // Give the loots time to load
        let waiter = setInterval(() => {
            let stop = $('[href*="gaming.amazon.com"]', true).length;

            if(!stop) return;

            clearInterval(waiter);

            $('button[data-a-target^="prime-claim"i]', true).map(button => button.click());
            $('[class*="prime-offer"i][class*="dismiss"i] button', true).map(button => button.click());

            // Give the loots time to be clicked
            setTimeout(() => button.click(), 100 * stop);
        }, 100);
    };
    Timers.claim_loot = -5_000;

    __ClaimLoot__:
    if(parseBool(Settings.claim_loot)) {
        REMARK("Claiming Prime Gaming Loot...");

        RegisterJob('claim_loot');
    }

    /*** Claim Prime
     *       _____ _       _             _____      _
     *      / ____| |     (_)           |  __ \    (_)
     *     | |    | | __ _ _ _ __ ___   | |__) | __ _ _ __ ___   ___
     *     | |    | |/ _` | | '_ ` _ \  |  ___/ '__| | '_ ` _ \ / _ \
     *     | |____| | (_| | | | | | | | | |   | |  | | | | | | |  __/
     *      \_____|_|\__,_|_|_| |_| |_| |_|   |_|  |_|_| |_| |_|\___|
     *
     *
     */
    Handlers.claim_prime = () => {
        LoadCache(['PrimeSubscription', 'PrimeSubscriptionReclaims'], ({ PrimeSubscription, PrimeSubscriptionReclaims }) => {
            PrimeSubscription ??= '';
            PrimeSubscriptionReclaims ??= 0;

            // Set the current streamer for auto-renewal...
            if(PrimeSubscription.length < 1 && STREAMER.main)
                SaveCache({ PrimeSubscription: (PrimeSubscription = STREAMER.sole.toString(36).toUpperCase()), PrimeSubscriptionReclaims: (PrimeSubscriptionReclaims = parseInt(Settings.claim_prime__max_claims)) });

            resubscribing:
            if(PrimeSubscription.toUpperCase() == STREAMER.sole.toString(36).toUpperCase()) {
                if(PrimeSubscriptionReclaims <= 2)
                    confirm.timed(`Please review your settings. TTV Tools ${ ['was', 'is'][+!!PrimeSubscriptionReclaims] } still reclaiming your <strong>Prime Subscription</strong> for this channel!`)
                        .then(answer => {
                            // OK → Open the settings page
                            if(answer)
                                postMessage({ action: 'open-options-page' });
                            // Cancel → Remove the warning
                            else if(answer === false)
                                /* SaveCache({ PrimeSubscription: (PrimeSubscription = ''), PrimeSubscriptionReclaims: 0 }) */;
                        });

                if(PrimeSubscriptionReclaims < 1)
                    break resubscribing;

                let button = $('[data-a-target="subscribe-button"i]');

                if(nullish(button))
                    break resubscribing;
                button.click();

                until(() => $('.channel-root .support-panel input[type="checkbox"i]:not(:checked)'))
                    .then(input => {
                        input.checked = true;
                        input.closest('.support-panel').querySelector('button[state]:only-child')?.click();

                        until(() => STREAMER.main? true: null).then(ok => {
                            SaveCache({ PrimeSubscriptionReclaims: --PrimeSubscriptionReclaims });

                            WARN(`[Prime Subscription] just renewed your subscription to ${ STREAMER.name } @ ${ (new Date).toJSON() }`).toNativeStack();
                        });
                    });
            }
        });
    };
    Timers.claim_prime = -5_000;

    __ClaimLoot__:
    if(parseBool(Settings.claim_prime)) {
        REMARK("Claiming Prime Subscription...");

        RegisterJob('claim_prime');
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
        FIRST_IN_LINE_WARNING_JOB,          // The job for warning the user (via timed confirmation dialog)
        FIRST_IN_LINE_SAFETY_CATCH,         // Keeps the alert from not showing properly
        FIRST_IN_LINE_SORTING_HANDLER,      // The Sortable object to handle the balloon
        FIRST_IN_LINE_WARNING_TEXT_UPDATE;  // Sub-job for the warning text

    let UP_NEXT_ALLOW_THIS_TAB = top.UP_NEXT_ALLOW_THIS_TAB = true,     // Allow this tab to use Up Next
        LIVE_REMINDERS__LISTING_INTERVAL;                                // List the live time of Live Reminders

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
        // REDO_FIRST_IN_LINE_QUEUE([href:string=URL]) → undefined
    async function REDO_FIRST_IN_LINE_QUEUE(url) {
        if(nullish(url) || (FIRST_IN_LINE_HREF === url && [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].filter(nullish).length <= 0))
            return;

        url = parseURL(url);

        let { href, pathname } = url,
            name = pathname.slice(1),
            channel = await(ALL_CHANNELS.find(channel => RegExp(name, 'i').test(channel.name)) ?? new Search(name).then(Search.convertResults));

        if(nullish(channel))
            return ERROR(`Unable to create job for "${ href }"`);

        GetNextStreamer.cachedStreamer = channel;
        name = channel.name;

        FIRST_IN_LINE_HREF = href;
        [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

        if(!ALL_FIRST_IN_LINE_JOBS.filter(href => href?.length).length)
            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

        LOG(`Waiting ${ toTimeString(GET_TIME_REMAINING() | 0) } before leaving for "${ name }" → ${ href }`, new Date);

        FIRST_IN_LINE_WARNING_JOB = setInterval(() => {
            let timeRemaining = GET_TIME_REMAINING();

            timeRemaining = timeRemaining < 0? 0: timeRemaining;

            // TODO: Figure out a single pause controller for First in Line...
            if(FIRST_IN_LINE_PAUSED)
                return SaveCache({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) });
            if(timeRemaining > 60_000)
                return /* There's more than 1 minute left */;

            if(defined(STARTED_TIMERS.WARNING))
                return /* There is already a warning pending */;

            STARTED_TIMERS.WARNING = true;

            LOG('Heading to stream in', toTimeString(timeRemaining), FIRST_IN_LINE_HREF, new Date);

            confirm
                .timed(`Coming up next: <a href='./${ name }'>${ name }</a>`, timeRemaining)
                .then(action => {
                    if(nullish(action))
                        return /* The event timed out... */;

                    let thisJob = ALL_FIRST_IN_LINE_JOBS.indexOf(FIRST_IN_LINE_HREF);

                    ALL_FIRST_IN_LINE_JOBS.splice(thisJob, 1);
                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(FIRST_IN_LINE_TIMER);

                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                    SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                        if(action) {
                            // The user clicked "OK"
                            open(parseURL(FIRST_IN_LINE_HREF).pushToSearch({ tool: 'first-in-line--ok' }).href, '_self');
                        } else {
                            // The user clicked "Cancel"
                            LOG('Canceled First in Line event', FIRST_IN_LINE_HREF);

                            let { pathname } = parseURL(FIRST_IN_LINE_HREF);
                            let balloonChild = $(`[id^="tt-balloon-job"i][href$="${ pathname }"i]`),
                                animationID = (balloonChild?.getAttribute('animationID')) || -1;

                            $(`button[data-test-selector$="delete"i]`, false, balloonChild)?.click();

                            clearInterval(animationID);
                            balloonChild?.remove();
                        }
                    });
                });
        }, 1000);

        FIRST_IN_LINE_JOB = setInterval(() => {
            // If the channel disappears (or goes offline), kill the job for it
            // FIX-ME: Reanimating First in Line jobs may cause reloading issues?
            let index = ALL_CHANNELS.findIndex(channel => RegExp(channel.href, 'i').test(FIRST_IN_LINE_HREF)),
                channel = ALL_CHANNELS[index],
                timeRemaining = GET_TIME_REMAINING();

            timeRemaining = timeRemaining < 0? 0: timeRemaining;

            // The timer is paused
            if(FIRST_IN_LINE_PAUSED)
                return /* SaveCache({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) }) */;

            if(nullish(channel)) {
                LOG('Restoring dead channel (interval)...', FIRST_IN_LINE_HREF);

                let { href, pathname } = parseURL(FIRST_IN_LINE_HREF),
                    channelID = UUID.from(pathname).value;

                let name = pathname.slice(1);

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
                        ALL_FIRST_IN_LINE_JOBS = [...new Set(ALL_FIRST_IN_LINE_JOBS.map(url => url?.toLowerCase?.()))].filter(url => url?.length).filter(url => !RegExp(url, 'i').test(FIRST_IN_LINE_HREF));
                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                        SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                            WARN(error);
                        });
                    });
            }

            // Don't act until 1sec is left
            if(timeRemaining > 1000)
                return;

            /* After above is `false` */

            SaveCache({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(), ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS = ALL_FIRST_IN_LINE_JOBS.filter(url => parseURL(url).pathname.toLowerCase() != parseURL(FIRST_IN_LINE_HREF).pathname.toLowerCase()) }, (href = channel?.href ?? FIRST_IN_LINE_HREF) => {
                LOG('Heading to stream now [Job Interval]', href);

                [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                open(parseURL(href).pushToSearch({ tool: 'first-in-line--timeout' }).href, '_self');
            });
        }, 1000);
    }

    function NEW_DUE_DATE(offset) {
        if(!UP_NEXT_ALLOW_THIS_TAB)
            return (+new Date) + 3_600_000;

        return (+new Date) + (null
            ?? offset
            ?? FIRST_IN_LINE_WAIT_TIME * 60_000
        );
    }

    function GET_TIME_REMAINING() {
        if(!UP_NEXT_ALLOW_THIS_TAB)
            return 3_600_000;

        let now = (+new Date),
            due = FIRST_IN_LINE_DUE_DATE;

        return (due - now);
    }

    if(Settings.up_next__one_instance)
        Runtime.sendMessage({ action: 'CLAIM_UP_NEXT' }, async({ owner = true }) => {
            UP_NEXT_ALLOW_THIS_TAB = top.UP_NEXT_ALLOW_THIS_TAB = owner;

            LOG('This tab is the Up Next owner', owner);
        });
    else
        Runtime.sendMessage({ action: 'WAIVE_UP_NEXT' });

    FIRST_IN_LINE_SAFETY_CATCH =
    setInterval(() => {
        let job = $('[up-next--body] [name][time]');

        if(nullish(job))
            return;

        let timeRemaining = parseInt(job.getAttribute('time'));

        if(timeRemaining <= 60_000 && nullish('.tt-confirm'))
            setTimeout(() => {
                WARN(`Mitigation for Up Next: Loose interval @ ${ window.location } / ${ new Date }`)
                    ?.toNativeStack?.();

                let name = $('[up-next--body] [name][time]').name;

                confirm
                    .timed(`Coming up next: <a href='./${ name }'>${ name }</a>`, timeRemaining)
                    .then(action => {
                        if(nullish(action))
                            return /* The event timed out... */;

                        // Does NOT touch the cache

                        if(action) {
                            // The user clicked "OK"
                            open(`./${ name }?tool=up-next--ok`, '_self');
                        } else {
                            // The user clicked "Cancel"
                            let balloonChild = $(`[id^="tt-balloon-job"i][href$="/${ name }"i]`),
                                animationID = (balloonChild?.getAttribute('animationID')) || -1;

                            clearInterval(animationID);
                            balloonChild?.remove();
                        }
                    });

                top.open(href, '_self');
            }, 60_000);

        clearInterval(FIRST_IN_LINE_SAFETY_CATCH);
    }, 1000);

    let FIRST_IN_LINE_BALLOON__INSURANCE =
    setInterval(() => {
        if(NORMAL_MODE && nullish(FIRST_IN_LINE_BALLOON)) {
            FIRST_IN_LINE_BALLOON = new Balloon({ title: 'Up Next', icon: 'calendar' });

            // Up Next Boost Button
            let first_in_line_boost_button = FIRST_IN_LINE_BALLOON?.addButton({
                attributes: {
                    id: 'up-next-boost',
                    contrast: THEME__PREFERRED_CONTRAST,
                },

                icon: 'latest',
                onclick: event => {
                    let { currentTarget } = event,
                        speeding = parseBool(currentTarget.getAttribute('speeding'));

                    speeding = (FIRST_IN_LINE_BOOST = !speeding);
                    speeding = (FIRST_IN_LINE_BOOST &&= ALL_FIRST_IN_LINE_JOBS?.length > 0 && FIRST_IN_LINE_HREF?.length > 0);

                    currentTarget.querySelector('svg[fill]')?.setAttribute('fill', 'currentcolor');
                    currentTarget.querySelector('svg[fill]')?.setAttribute('style', `opacity:${ 2**-!speeding }; fill:currentcolor`);
                    currentTarget.setAttribute('speeding', speeding);

                    currentTarget.tooltip.innerHTML = `${ ['Start','Stop'][+speeding] } Boost`;

                    let up_next_button = $('[up-next--container] button');

                    up_next_button?.setAttribute('allowed', parseBool(UP_NEXT_ALLOW_THIS_TAB));
                    up_next_button?.setAttribute('speeding', parseBool(speeding));

                    let oneMin = 60_000,
                        fiveMin = 5.5 * oneMin,
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
                    id: 'up-next-control',
                    contrast: THEME__PREFERRED_CONTRAST,
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

            // Live Reminders
            let live_reminders_catalog_button = FIRST_IN_LINE_BALLOON?.addButton({
                attributes: {
                    id: 'live-reminders-catalog',
                    contrast: THEME__PREFERRED_CONTRAST,
                },

                icon: 'notify',
                left: true,
                onclick: async event => {
                    let { currentTarget } = event,
                        parent = currentTarget.closest('[id^="tt-balloon-container"i]');

                    LoadCache(['LiveReminders', 'ChannelPoints'], async({ LiveReminders = null, ChannelPoints = {} }) => {
                        LiveReminders = JSON.parse(LiveReminders || '{}');

                        let f = furnish;
                        let body = $('#tt-reminder-listing'),
                            head = $('[up-next--header]');

                        if(defined(body)) {
                            live_reminders_catalog_button.innerHTML = Glyphs.modify('notify', { height: '20px', width: '20px' });
                            live_reminders_catalog_button.tooltip.innerHTML = 'View Live Reminders';
                            head.innerHTML = 'Up Next';

                            return body?.remove();
                        } else {
                            live_reminders_catalog_button.innerHTML = Glyphs.modify('calendar', { height: '20px', width: '20px' });
                            live_reminders_catalog_button.tooltip.innerHTML = 'View Up Next';
                            head.innerHTML = 'Live Reminders';
                        }

                        body = f('div#tt-reminder-listing', {});

                        parent.insertBefore(body, $('[up-next--body] > :nth-child(2)'));

                        // List all reminders, in order of their last live time
                        let { abs, random, round } = Math;
                        let reminders = [];
                        let now = new Date,
                            today = now.toLocaleDateString(top.LANGUAGE, { dateStyle: 'short' }),
                            yesterday = new Date(+now - 86_400_000).toLocaleDateString(top.LANGUAGE, { dateStyle: 'short' });

                        sorting:
                        for(let reminderName in LiveReminders)
                            reminders.push({ name: reminderName, time: new Date(LiveReminders[reminderName]) });
                        reminders = reminders.sort((a, b) => (abs(+now - +a.time) < abs(+now - +b.time))? -1: +1);

                        if(!reminders.length)
                            return await alert.timed('There are no Live Reminders to display', 7_000);

                        listing:
                        for(let { name, time } of reminders) {
                            let channel = await new Search(name).then(Search.convertResults),
                                ok = /\/jtv_user/i.test(channel.icon);

                            // Search did not complete...
                            let max = 5;
                            while(!ok && --max > 0) {
                                Search.void(name);

                                channel = await until(() => new Search(name).then(Search.convertResults), 500);
                                ok = /\/jtv_user/i.test(channel.icon);
                            }

                            // Legacy reminders... | v4.26 → v4.27
                            let legacy = +now < +time;

                            if(nullish(channel))
                                continue listing;

                            let day = time.toLocaleDateString(top.LANGUAGE, { dateStyle: 'short' }),
                                hour = time.toLocaleTimeString(top.LANGUAGE, { timeStyle: 'short' }),
                                recent = (abs(+now - +time) / 3_600_000 < 24),
                                since = toTimeString(abs(+now - +time), '?hour hour|?minute minute|?second second').split('|').filter(parseFloat).reverse().pop(),
                                [tense_A, tense_B] = [['',' ago'],['in ','']][+legacy],
                                when = `<span class="tt-${ (channel.live? 'live': 'offline') }" style="min-width:3.5em">${ (channel.live? 'LIVE': recent? tense_A + since.pluralSuffix(parseFloat(since)) + tense_B: [day, hour].join(' ')) }</span>`;

                            let { href, icon, live, desc = '' } = channel;
                            let [amount, fiat, face, notEarned, pointsToEarnNext] = (ChannelPoints[name] ?? 0).toString().split('|'),
                                coinStyle = new CSSObject({ verticalAlign: 'bottom', height: '20px', width: '20px' }),
                                coinText =
                                    furnish('span.tt-live-reminder-point-amount', {
                                        'tt-earned-all': notEarned == 0,
                                        innerHTML: amount.toLocaleString(LANGUAGE),
                                    }).outerHTML,
                                coinIcon = (
                                    face?.length?
                                        furnish('span.tt-live-reminder-point-face', {
                                            innerHTML: furnish('img', { src: `https://static-cdn.jtvnw.net/channel-points-icons/${face}`, style: coinStyle.toString() }).outerHTML,
                                        }):
                                    furnish('span.tt-live-reminder-point-face', {
                                        innerHTML: Glyphs.modify('channelpoints', { style: `vertical-align:bottom; ${ coinStyle.toString() }` }),
                                    })
                                ).outerHTML;
                            let container = f(`div.tt-reminder`, { name, style: `animation:fade-in 1s 1; background:var(--color-background-base)` },
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
                                                            // Sometimes, Twitch likes to default to `_blank`
                                                            'target': '_self',

                                                            href,
                                                        },
                                                        f('div.persistent-notification__area.tt-flex.tt-flex-nowrap.tt-pd-b-1.tt-pd-l-1.tt-pd-r-3.tt-pd-t-1', {},
                                                            // Avatar
                                                            f('div', {},
                                                                f('div.tt-border-radius-rounded.tt-card-img.tt-card-img--size-4.tt-flex-shrink-0.tt-overflow-hidden', {},
                                                                    f('div.tt-aspect.tt-aspect--align-top', {},
                                                                        f('img.tt-balloon-avatar.tt-image', { src: icon })
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
                                                                        f('p.tt-balloon-message', {
                                                                            innerHTML: (!live? `<strong>${ name }</strong>`: `<strong>${ name }</strong> <span class="tt-time-elapsed" start="${ time.toJSON() }">${ hour }</span><p class="tt-hide-text-overflow" style="text-indent:0.25em" title="${ encodeHTML(desc) }">${ desc }</p>`)
                                                                        })
                                                                    )
                                                                ),
                                                                // Subheader
                                                                f('div.tt-align-items-center.tt-flex.tt-flex-shrink-0.tt-mg-t-05', {},
                                                                    f('div.tt-mg-l-05', {},
                                                                        f('span.tt-balloon-subheader.tt-c-text-alt', { innerHTML: [when, coinIcon + coinText].join(' &bull; ') })
                                                                    )
                                                                ),
                                                                // Footer (persistent)
                                                                f('div', {/* ... */})
                                                            )
                                                        )
                                                    ),
                                                    f('div.persistent-notification__delete.tt-absolute.tt-pd-l-1', { style: `top:0; right:0` },
                                                        f('div.tt-align-items-start.tt-flex.tt-flex-nowrap', {},
                                                            f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative',
                                                                {
                                                                    'data-test-selector': 'persistent-notification__delete',
                                                                    name,

                                                                    onclick: event => {
                                                                        let { currentTarget } = event,
                                                                            name = currentTarget.getAttribute('name');

                                                                        LoadCache('LiveReminders', async({ LiveReminders }) => {
                                                                            LiveReminders = JSON.parse(LiveReminders || '{}');

                                                                            let justInCase = { ...LiveReminders[name] };

                                                                            $(`.tt-reminder[name="${ name }"i]`)?.remove();
                                                                            delete LiveReminders[name];
                                                                            SaveCache({ LiveReminders: JSON.stringify(LiveReminders) }, () => Storage.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));

                                                                            await confirm
                                                                                .timed(`Reminder removed successfully!`, 5_000)
                                                                                .then(ok => {
                                                                                    // The user pressed nothing, or pressed "OK"
                                                                                    if(nullish(ok) || ok)
                                                                                        return;

                                                                                    // The user pressed "Cancel"
                                                                                    SaveCache({ LiveReminders: JSON.stringify({ ...LiveReminders, [name]: justInCase }) }, () => Storage.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));
                                                                                });
                                                                        });
                                                                    },
                                                                },
                                                                f('span.tt-button-icon__icon', {},
                                                                    f('div',
                                                                        {
                                                                            style: 'height:1.6rem; width:1.6rem',
                                                                            innerHTML: Glyphs.ignore,
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

                            body.append(container);
                        }
                    });
                },
            });

            live_reminders_catalog_button.tooltip = new Tooltip(live_reminders_catalog_button, 'View Live Reminders');

            LIVE_REMINDERS__LISTING_INTERVAL ??=
            setInterval(() => {
                for(let span of $('.tt-time-elapsed', true))
                    span.innerHTML = toTimeString(+new Date - +new Date(span.getAttribute('start')), 'clock');
            }, 100);

            // Help Button
            let first_in_line_help_button = FIRST_IN_LINE_BALLOON?.addButton({
                attributes: {
                    id: 'up-next-help',
                    contrast: THEME__PREFERRED_CONTRAST,
                },

                icon: 'help',
                left: true,
            }),
                [accent, complement] = (Settings.accent_color ?? 'blue/12').split('/'),
                [colorName] = accent.split('-').reverse();

            first_in_line_help_button.tooltip = new Tooltip(first_in_line_help_button, 'Drop a channel here to queue it');

            // Update the color name...
            setInterval(() => {
                first_in_line_help_button.tooltip.innerHTML = (
                    UP_NEXT_ALLOW_THIS_TAB?
                        `Drop a channel in the <span style="color:var(--user-accent-color)">${ colorName }</span> area to queue it`:
                    `Up Next is disabled for this tab`
                ).replace(/\bcolored\b/g, () => Color.getName(THEME == 'dark'? THEME__CHANNEL_DARK: THEME__CHANNEL_LIGHT));
            }, 1000);

            // Load cache
            LoadCache(['ALL_FIRST_IN_LINE_JOBS', 'FIRST_IN_LINE_DUE_DATE', 'FIRST_IN_LINE_BOOST'], cache => {
                let oneMin = 60_000,
                    fiveMin = 5.5 * oneMin,
                    tenMin = 10 * oneMin;

                ALL_FIRST_IN_LINE_JOBS = (cache.ALL_FIRST_IN_LINE_JOBS ?? []);
                FIRST_IN_LINE_BOOST = parseBool(cache.FIRST_IN_LINE_BOOST) && ALL_FIRST_IN_LINE_JOBS.length > 0 && FIRST_IN_LINE_HREF?.length > 0;
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
                first_in_line_boost_button.querySelector('svg[fill]')?.setAttribute('fill', '');
                first_in_line_boost_button.querySelector('svg[fill]')?.setAttribute('style', `opacity:${ 2**-!FIRST_IN_LINE_BOOST }; fill:currentcolor`);
                first_in_line_boost_button.tooltip = new Tooltip(first_in_line_boost_button, `${ ['Start','Stop'][FIRST_IN_LINE_BOOST | 0] } Boost`);

                let up_next_button = $('[up-next--container] button');

                up_next_button?.setAttribute('allowed', parseBool(UP_NEXT_ALLOW_THIS_TAB));
                up_next_button?.setAttribute('speeding', parseBool(FIRST_IN_LINE_BOOST));

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
                    if(!from_container) {
                        // Try to see if it's a link...
                        let { href, hostname, pathname, domainPath } = parseURL(event.dataTransfer.getData('text'));

                        // No idea what the user just dropped
                        if(!hostname?.length || !pathname?.length)
                            return ERROR(error);

                        if(!/^tv\.twitch/i.test(domainPath.join('.')) || RESERVED_TWITCH_PATHNAMES.test(pathname))
                            return WARN(`Unable to add link to Up Next "${ href }"`);

                        streamer = await(null
                            ?? ALL_CHANNELS.find(channel => channel.href.toLowerCase().contains(pathname.toLowerCase()))
                            ?? (null
                                ?? new Search(pathname.slice(1)).then(Search.convertResults)
                                ?? new Promise((resolve, reject) => reject(`Unable to perform search for "${ name }"`))
                            )
                                .then(search => {
                                    let found = ({
                                        from: 'SEARCH',
                                        href,
                                        icon: search.icon,
                                        live: search.live,
                                        name: search.name,
                                    });

                                    ALL_CHANNELS = [...ALL_CHANNELS, found].filter(uniqueChannels);

                                    return found;
                                })
                                .catch(WARN)
                        )
                    }
                } finally {
                    if(from_container) {
                        // Most likely a sorting event
                    } else {
                        let { href } = (streamer ??= {});

                        LOG('Adding to Up Next [ondrop]:', { href, streamer });

                        if(nullish(streamer?.icon)) {
                            let name = (streamer?.name ?? parseURL(href).pathname.slice(1));

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
                        ALL_FIRST_IN_LINE_JOBS = [...new Set([...ALL_FIRST_IN_LINE_JOBS, href].map(url => url?.toLowerCase?.()))].filter(url => url?.length);

                        SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                        });
                    }
                }
            };

            FIRST_IN_LINE_BALLOON.icon.onmouseenter ??= event => {
                let { container, tooltip, title } = FIRST_IN_LINE_BALLOON,
                    offset = getOffset(container);

                $('div#root > *').append(
                    furnish('div.tt-tooltip-layer.tooltip-layer', { style: `transform: translate(${ offset.left }px, ${ offset.top }px); width: 30px; height: 30px; z-index: 9999;` },
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

                    let channel = ALL_CHANNELS.find(channel => RegExp(parseURL(channel.href).pathname + '\\b', 'i').test(moved));

                    if(nullish(channel))
                        return WARN('No channel found:', { oldIndex, newIndex, desiredChannel: channel });

                    // This controls the new due date `NEW_DUE_DATE(time)` when the user drags a channel to the first position
                        // To create a new due date, `NEW_DUE_DATE(time)` → `NEW_DUE_DATE()`
                    if([oldIndex, newIndex].contains(0)) {
                        // `..._TIMER = ` will continue the timer (as if nothing changed) when a channel is removed
                        let first = ALL_CHANNELS.find(channel => RegExp(parseURL(channel.href).pathname + '\\b', 'i').test(FIRST_IN_LINE_HREF = ALL_FIRST_IN_LINE_JOBS[0]));
                        let time = /* FIRST_IN_LINE_TIMER = */ parseInt($(`[name="${ first.name }"i]`)?.getAttribute('time'));

                        LOG('New First in Line event:', { ...first, time });

                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);
                    }

                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0].href);
                    // LOG('Redid First in Line queue [Sorting Handler]...', { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME, FIRST_IN_LINE_HREF });

                    SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
                },
            });

            if(Settings.first_in_line_none)
                FIRST_IN_LINE_BALLOON.container.setAttribute('style', 'display:none!important');
            else
                FIRST_IN_LINE_LISTING_JOB = setInterval(async() => {
                    // Set the opacity...
                    // FIRST_IN_LINE_BALLOON.container.setAttribute('style', `opacity:${ (UP_NEXT_ALLOW_THIS_TAB? 1: 0.75) }!important`);

                    for(let index = 0, fails = 0; UP_NEXT_ALLOW_THIS_TAB && index < ALL_FIRST_IN_LINE_JOBS?.length; index++) {
                        let href = ALL_FIRST_IN_LINE_JOBS[index],
                            name = parseURL(href).pathname.slice(1),
                            channel = await(ALL_CHANNELS.find(channel => RegExp(name, 'i').test(channel.name)) ?? new Search(name).then(Search.convertResults));

                        if(nullish(href) || nullish(channel))
                            continue;

                        let { live } = channel;
                        name = channel.name;

                        let [balloon] = FIRST_IN_LINE_BALLOON?.add({
                            href,
                            src: channel.icon,
                            message: `${ name } <span style="display:${ live? 'none': 'inline-block' }">is not live</span>`,
                            subheader: `Coming up next`,
                            onremove: event => {
                                let index = ALL_FIRST_IN_LINE_JOBS.findIndex(href => event.href == href),
                                    [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1);

                                LOG(`Removed from Up Next (${ nth(index + 1) }):`, removed, 'Was it canceled?', event.canceled);

                                if(event.canceled)
                                    DO_NOT_AUTO_ADD.push(removed);

                                if(index > 0) {
                                    SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
                                } else {
                                    LOG('Destroying current job [Job Listings]...', { FIRST_IN_LINE_HREF, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME });

                                    [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                                    FIRST_IN_LINE_HREF = undefined;
                                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                                    SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]));
                                }
                            },

                            attributes: {
                                name,
                                live,
                                index,
                                time: (index < 1? GET_TIME_REMAINING(): FIRST_IN_LINE_WAIT_TIME * 60_000),

                                style: `opacity: ${ 2**-!live }!important`,
                            },

                            animate: container => {
                                let subheader = $('.tt-balloon-subheader', false, container);

                                return setInterval(async() => {
                                    START__STOP_WATCH('up_next_balloon__subheader_timer_animation');

                                    let timeRemaining = GET_TIME_REMAINING();

                                    timeRemaining = timeRemaining < 0? 0: timeRemaining

                                    /* First in Line is paused */
                                    if(FIRST_IN_LINE_PAUSED) {
                                        // SaveCache({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) });
                                        JUDGE__STOP_WATCH('up_next_balloon__subheader_timer_animation', 1000);

                                        return;
                                    }

                                    let name = container.getAttribute('name'),
                                        channel = await(ALL_CHANNELS.find(channel => RegExp(name, 'i').test(channel.name)) ?? new Search(name).then(Search.convertResults)),
                                        { live } = channel;
                                        name = channel.name;

                                    let time = timeRemaining,
                                        intervalID = parseInt(container.getAttribute('animationID')),
                                        index = $('[id][guid][uuid]', true, container.parentElement).indexOf(container);

                                    if(time < 60_000 && nullish(FIRST_IN_LINE_HREF)) {
                                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);

                                        WARN('Creating job to avoid [Job Listing] mitigation event', channel);

                                        return JUDGE__STOP_WATCH('up_next_balloon__subheader_timer_animation', 1000), REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = channel.href);
                                    }

                                    if(time < 1_000)
                                        setTimeout(() => {
                                            LOG('Mitigation event for [Job Listings]', { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_HREF }, new Date);
                                            // Mitigate 0 time bug?

                                            SaveCache({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE() }, () => {
                                                WARN(`Timer overdue [animation:first-in-line-balloon--initializer] » ${ FIRST_IN_LINE_HREF }`)
                                                    ?.toNativeStack?.();

                                                open($('a', false, container)?.href ?? '?', '_self');
                                            });

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
                                            `${ name } <span style="display:${ live? 'none': 'inline-block' }">is not live</span>`;
                                        container.setAttribute('style', `opacity: ${ 2**-!live }!important`);
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

    Handlers.first_in_line = async(ActionableNotification) => {
        START__STOP_WATCH('first_in_line');

        let notifications = [...$('[data-test-selector^="onsite-notifications"i] [data-test-selector^="onsite-notification"i]', true), ActionableNotification].filter(defined);

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

            if(nullish(action))
                continue;

            let { href, pathname } = parseURL(action.href.toLowerCase()),
                { textContent } = action,
                uuid = UUID.from(textContent).value;

            if(HANDLED_NOTIFICATIONS.contains(uuid))
                continue;
            HANDLED_NOTIFICATIONS.push(uuid);

            if(DO_NOT_AUTO_ADD.contains(href))
                continue;

            if(!/([^]+? +)(go(?:ing)?|is|went) +live\b/i.test(textContent))
                continue;

            LOG('Received an actionable notification:', textContent, new Date);

            if(defined(FIRST_IN_LINE_HREF ??= ALL_FIRST_IN_LINE_JOBS[0])) {
                if(![...ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_HREF].contains(href)) {
                    LOG('Pushing to First in Line:', href, new Date);

                    // LOG('Accessing here... #2');
                    ALL_FIRST_IN_LINE_JOBS = [...new Set([...ALL_FIRST_IN_LINE_JOBS, href].map(url => url?.toLowerCase?.()))].filter(url => url?.length);
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
                ALL_FIRST_IN_LINE_JOBS = [...new Set([...ALL_FIRST_IN_LINE_JOBS, href].map(url => url?.toLowerCase?.()))].filter(url => url?.length);
                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                // To wait, or not to wait
                SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                });
            }

            AddBalloon: {
                update();

                let index = ALL_FIRST_IN_LINE_JOBS.indexOf(href),
                    name = parseURL(href).pathname.slice(1),
                    channel = await(ALL_CHANNELS.find(channel => RegExp(name, 'i').test(channel.name)) ?? new Search(name).then(Search.convertResults));

                if(nullish(channel))
                    continue;

                let { live } = channel;
                name = channel.name;

                index = index < 0? ALL_FIRST_IN_LINE_JOBS.length: index;

                let [balloon] = FIRST_IN_LINE_BALLOON?.add({
                    href,
                    src: channel.icon,
                    message: `${ name } <span style="display:${ live? 'none': 'inline-block' }">is not live</span>`,
                    subheader: `Coming up next`,
                    onremove: event => {
                        let index = ALL_FIRST_IN_LINE_JOBS.findIndex(href => event.href == href),
                            [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1);

                        LOG('Removed from Up Next:', removed, 'Was it canceled?', event.canceled);

                        if(event.canceled)
                            DO_NOT_AUTO_ADD.push(removed);

                        if(index > 0) {
                            SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
                        } else {
                            LOG('Destroying current job [First in Line]...', { FIRST_IN_LINE_HREF, FIRST_IN_LINE_DUE_DATE });

                            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                            FIRST_IN_LINE_HREF = undefined;
                            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
                            SaveCache({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]));
                        }
                    },

                    attributes: {
                        name,
                        live,
                        index,
                        time: (index < 1? GET_TIME_REMAINING(): FIRST_IN_LINE_WAIT_TIME * 60_000),

                        style: `opacity: ${ 2**-!live }!important`,
                    },

                    animate: container => {
                        let subheader = $('.tt-balloon-subheader', false, container);

                        if(!UP_NEXT_ALLOW_THIS_TAB)
                            return -1;

                        return setInterval(async() => {
                            START__STOP_WATCH('first_in_line__job_watcher');

                            let timeRemaining = GET_TIME_REMAINING();

                            timeRemaining = timeRemaining < 0? 0: timeRemaining;

                            /* First in Line is paused */
                            if(FIRST_IN_LINE_PAUSED) {
                                // SaveCache({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) });
                                JUDGE__STOP_WATCH('first_in_line__job_watcher', 1000);

                                return;
                            }

                            SaveCache({ FIRST_IN_LINE_BOOST });

                            let name = container.getAttribute('name'),
                                channel = await(ALL_CHANNELS.find(channel => RegExp(name, 'i').test(channel.name)) ?? new Search(name).then(Search.convertResults)),
                                { live } = channel;
                                name = channel.name;

                            let time = timeRemaining,
                                intervalID = parseInt(container.getAttribute('animationID')),
                                index = $('[id][guid][uuid]', true, container.parentElement).indexOf(container);

                            if(time < 60_000 && nullish(FIRST_IN_LINE_HREF)) {
                                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);

                                WARN('Creating job to avoid [First in Line] mitigation event', channel);

                                return JUDGE__STOP_WATCH('first_in_line__job_watcher', 1000), REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = channel.href);
                            }

                            if(time < 1_000)
                                setTimeout(() => {
                                    LOG('Mitigation event from [First in Line]', { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_HREF }, new Date);
                                    // Mitigate 0 time bug?

                                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
                                    SaveCache({ FIRST_IN_LINE_DUE_DATE }, () => {
                                        WARN(`Timer overdue [animation:first-in-line-balloon] » ${ FIRST_IN_LINE_HREF }`);

                                        open($('a', false, container)?.href ?? '?', '_self');
                                    });

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
                                    `${ name } <span style="display:${ live? 'none': 'inline-block' }">is not live</span>`;
                                container.setAttribute('style', `opacity: ${ 2**-!live }!important`);
                                container.setAttribute('live', live);
                            }

                            subheader.innerHTML = index > 0? nth(index + 1): toTimeString(time, 'clock');

                            JUDGE__STOP_WATCH('first_in_line__job_watcher', 1000);
                        }, 1000);
                    },
                })
                    ?? [];

                if(defined(FIRST_IN_LINE_WAIT_TIME) && nullish(FIRST_IN_LINE_HREF)) {
                    REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = href);
                    LOG('Redid First in Line queue [First in Line]...', { FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME, FIRST_IN_LINE_HREF });
                } else if(Settings.first_in_line_none) {
                    LOG('Heading to stream now [First in Line] is OFF', FIRST_IN_LINE_HREF);

                    [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);
                    open(parseURL(FIRST_IN_LINE_HREF).pushToSearch({ tool: 'first-in-line--killed' }).href, '_self');
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
                fiveMin = 5.5 * oneMin,
                tenMin = 10 * oneMin;

            ALL_FIRST_IN_LINE_JOBS = (cache.ALL_FIRST_IN_LINE_JOBS ?? []);
            FIRST_IN_LINE_BOOST = parseBool(cache.FIRST_IN_LINE_BOOST) && ALL_FIRST_IN_LINE_JOBS.length > 0 && FIRST_IN_LINE_HREF?.length > 0;
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
            if(!RESERVED_TWITCH_PATHNAMES.test(to))
                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
        };

        // Controls what's listed under the Up Next balloon
        if(nullish(FIRST_IN_LINE_HREF) && ALL_FIRST_IN_LINE_JOBS.length) {
            let [href] = ALL_FIRST_IN_LINE_JOBS,
                first = (parseURL(STREAMER.href).pathname.toLowerCase() == parseURL(href).pathname.toLowerCase()),
                channel = (null
                    // Attempts to find the channel via "cache"
                    ?? ALL_CHANNELS
                        // Get all live channels listed
                        .filter(isLive)
                        // Used below to control whether the channel is deemed a duplicate
                        .filter(channel => channel.href !== STREAMER.href)
                        // Gets the channel in question, if applicable
                        .find(channel => parseURL(channel.href).pathname === parseURL(href).pathname)
                    // Attempts to find the channel via a search
                    ?? new Search(parseURL(href).pathname.slice(1)).then(Search.convertResults)
                );

            if(nullish(channel) && !first) {
                let index = ALL_FIRST_IN_LINE_JOBS.findIndex(job => job == href),
                    dead = ALL_FIRST_IN_LINE_JOBS[index];

                LOG('Restoring dead channel (initializer)...', dead);

                let { pathname } = parseURL(dead),
                    channelID = UUID.from(pathname).value;

                let name = pathname.slice(1);

                new Search(name).then(Search.convertResults)
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

                        REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = href);
                    })
                    .catch(error => {
                        let [killed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1),
                            name = parseURL(killed).pathname.slice(1);

                        SaveCache({ ALL_FIRST_IN_LINE_JOBS }, () => {
                            WARN(`Unable to perform search for "${ name }" - ${ error }`, killed);
                        });
                    });

                break __FirstInLine__;
            } else if(!first) {
                // Handlers.first_in_line({ href, textContent: `${ channel.name } is live [First in Line]` });

                // WARN('Forcing queue update for', href);
                REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = href);
            } else if(first) {
                let [popped] = ALL_FIRST_IN_LINE_JOBS.splice(0, 1);

                [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                SaveCache({ ALL_FIRST_IN_LINE_JOBS }, () => {
                    WARN('Removed duplicate job', popped);
                });
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

        if(nullish(OLD_STREAMERS))
            OLD_STREAMERS = NEW_STREAMERS;

        let old_names = OLD_STREAMERS.split(',').filter(defined),
            new_names = NEW_STREAMERS.split(',').filter(defined),
            bad_names = BAD_STREAMERS?.split(',')?.filter(defined)?.filter(parseBool);

        // Detect if the channels got removed incorrectly?
        if(bad_names?.length) {
            WARN('Twitch failed to add these channels correctly:', bad_names)
                ?.toNativeStack?.();

            BAD_STREAMERS = "";

            SaveCache({ BAD_STREAMERS });

            // RemoveFromTopSearch(['tt-err-chn']);
        } else if(nullish($('#sideNav .side-nav-section[aria-label][tt-svg-label="followed"i] a[class*="side-nav-card"i]'))) {
            WARN("[Followed Channels] is missing. Reloading...");

            SaveCache({ BAD_STREAMERS: OLD_STREAMERS });

            // Failed to get channel at...
            PushToTopSearch({ 'tt-err-chn': (+new Date).toString(36) });
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
            // TODID? `STREAMERS` → `ALL_CHANNELS`
            let streamer = STREAMERS.find(streamer => RegExp(name, 'i').test(streamer.name)),
                { searchParameters } = parseURL(location.href);

            if(nullish(streamer) || searchParameters.obit == streamer.name)
                continue creating_new_events;

            let { href } = streamer;

            if(nullish(streamer?.name?.length))
                continue creating_new_events;

            LOG('A channel just appeared:', name, new Date);

            Handlers.first_in_line({ href, textContent: `${ name } is live [First in Line+]` });
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

    /*** Live Reminders
     *      _      _             _____                _           _
     *     | |    (_)           |  __ \              (_)         | |
     *     | |     ___   _____  | |__) |___ _ __ ___  _ _ __   __| | ___ _ __ ___
     *     | |    | \ \ / / _ \ |  _  // _ \ '_ ` _ \| | '_ \ / _` |/ _ \ '__/ __|
     *     | |____| |\ V /  __/ | | \ \  __/ | | | | | | | | | (_| |  __/ |  \__ \
     *     |______|_| \_/ \___| |_|  \_\___|_| |_| |_|_|_| |_|\__,_|\___|_|  |___/
     *
     *
     */
    let LIVE_REMINDERS__CHECKING_INTERVAL;
    Handlers.live_reminders = () => {
        START__STOP_WATCH('live_reminders');

        // Add the button to unfollowed channels
        let actionPanel = $('.about-section__actions');

        if(nullish(actionPanel))
            return JUDGE__STOP_WATCH('live_reminders');

        let action = $('[tt-svg-label="live-reminders"i], [tt-action="live-reminders"i]', false, actionPanel);

        if(defined(action))
            return JUDGE__STOP_WATCH('live_reminders');

        LoadCache('LiveReminders', async({ LiveReminders }) => {
            LiveReminders = JSON.parse(LiveReminders || '{}');

            let f = furnish,
                s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"),
                reminderName = STREAMER.name,
                hasReminder = defined(LiveReminders[reminderName]),
                tense = (parseBool(Settings.keep_live_reminders)? '': ' next'),
                stream_s = 'stream'.pluralSuffix(+!!tense),
                [title, subtitle, icon] = [
                    ['Remind me', `Receive a notification for ${ s(STREAMER.name) }${ tense } live ${ stream_s }`, 'inform'],
                    ['Reminder set', `You will receive a notification for ${ s(STREAMER.name) }${ tense } live ${ stream_s }`, 'notify']
                ][+!!hasReminder];

            icon = Glyphs.modify(icon, { style: 'fill:var(--user-complement-color)!important', height: '20px', width: '20px' });

            // Create the action button...
            action =
            f('div', { 'tt-action': 'live-reminders', 'for': reminderName, 'remind': hasReminder, 'action-origin': 'foreign', style: `animation:1s fade-in 1;` },
                f('button', {
                    onmouseup: async event => {
                        let { currentTarget, isTrusted = false, button = -1 } = event;

                        if(!!button)
                            return /* Not the primary button */;

                        LoadCache('LiveReminders', async({ LiveReminders }) => {
                            LiveReminders = JSON.parse(LiveReminders || '{}');

                            let s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"),
                                reminderName = STREAMER.name,
                                notReminded = nullish(LiveReminders[reminderName]),
                                tense = (parseBool(Settings.keep_live_reminders)? '': ' next'),
                                stream_s = 'stream'.pluralSuffix(+!!tense),
                                [title, subtitle, icon] = [
                                    ['Remind me', `Receive a notification for ${ s(STREAMER.name) }${ tense } live ${ stream_s }`, 'inform'],
                                    ['Reminder set', `You will receive a notification for ${ s(STREAMER.name) }${ tense } live ${ stream_s }`, 'notify']
                                ][+!!notReminded];

                            icon = Glyphs.modify(icon, { style: 'fill:var(--user-complement-color)!important', height: '20px', width: '20px' });

                            $('.tt-action-icon', false, currentTarget).innerHTML = icon;
                            $('.tt-action-title', false, currentTarget).textContent = title;
                            $('.tt-action-subtitle', false, currentTarget).textContent = subtitle;

                            // Add the reminder...
                            let message;
                            if(notReminded) {
                                message = `You'll be notified when ${ STREAMER.name } goes live.`;
                                LiveReminders[reminderName] = (STREAMER.live? new Date(STREAMER?.data?.actualStartTime): STREAMER?.data?.lastSeen ?? new Date);
                            }
                            // Remove the reminder...
                            else {
                                message = `Reminder removed successfully!`;
                                delete LiveReminders[reminderName];
                            }

                            currentTarget.closest('[tt-action]').setAttribute('remind', notReminded);

                            // FIX-ME: Live Reminder alerts will not display if another alert is present...
                            SaveCache({ LiveReminders: JSON.stringify(LiveReminders) }, () => Storage.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }).then(() => parseBool(message) && alert.timed(message, 7_000)).catch(WARN));
                        });
                    },
                }, f('div', {},
                    f('div.tt-action-icon', { innerHTML: icon }),
                    f('div', {},
                        f('p.tw-title.tt-action-title', {}, title),
                        f('p.tt-action-subtitle', {}, subtitle)
                    )
                ))
            );

            actionPanel.append(action);
        });

        JUDGE__STOP_WATCH('live_reminders');
    };
    Timers.live_reminders = -2_500;

    Unhandlers.live_reminders = () => {
        $('[tt-action]', true).map(action => action.remove());
        [LIVE_REMINDERS__CHECKING_INTERVAL, LIVE_REMINDERS__LISTING_INTERVAL].map(clearInterval);
    };

    __Live_Reminders__:
    if(parseBool(Settings.live_reminders)) {
        REMARK('Adding Live Reminders...');

        // See if there are any notifications to push...
        LIVE_REMINDERS__CHECKING_INTERVAL =
        setInterval(() => {
            START__STOP_WATCH('live_reminders__reminder_checking_interval');

            LoadCache('LiveReminders', async({ LiveReminders }) => {
                LiveReminders = JSON.parse(LiveReminders || '{}');

                checking:
                // Only check for the stream when it's live; if the dates don't match, it just went live again
                for(let reminderName in LiveReminders) {
                    let channel = await new Search(reminderName).then(Search.convertResults),
                        ok = /\/jtv_user/i.test(channel.icon);

                    // Search did not complete...
                    let max = 5;
                    while(!ok && --max > 0) {
                        Search.void(reminderName);

                        channel = await until(() => new Search(reminderName).then(Search.convertResults), 500);
                        ok = /\/jtv_user/i.test(channel.icon);
                    }

                    if(!channel.live)
                        continue checking;

                    let { name, live, icon, href, data = { actualStartTime: null, lastSeen: null } } = channel;
                    let lastOnline = new Date((+new Date(LiveReminders[reminderName])).floorToNearest(1_000)).toJSON(),
                        justOnline = new Date((+new Date(data.actualStartTime)).floorToNearest(1_000)).toJSON();

                    // The channel just went live!
                    if(lastOnline != justOnline) {
                        if(parseBool(Settings.keep_live_reminders)) {
                            LiveReminders[reminderName] = new Date(justOnline);
                        } else {
                            $(`[tt-action="live-reminders"i][for="${ reminderName }"i][remind="true"i] button`)
                                ?.dispatchEvent?.(new MouseEvent('mouseup', { bubbles: false }));
                            delete LiveReminders[reminderName];
                        }

                        SaveCache({ LiveReminders: JSON.stringify(LiveReminders) }, async() => {
                            // TODO: Currently, only one option looks for Live Reminder notifications...
                            Handle_phantom_notification: {
                                let notification = { href, textContent: `${ name } is live [Live Reminders]` },
                                    [page, note] = [STREAMER.href, href].map(parseURL).map(({ pathname }) => pathname);

                                // If already on the stream, break
                                if(page.toLowerCase() == note.toLowerCase())
                                    break Handle_phantom_notification;

                                // All of the Live Reminder handlers...
                                Handlers.first_in_line(notification);

                                // Show a notification
                                Display_phantom_notification: {
                                    WARN(`Live Reminders: ${ name } just went live`, new Date);
                                    await alert.timed(`${ name } just went live!`, 7_000);
                                }
                            }

                        });
                    }
                }

                // Send the length to the settings page
                Storage.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) });
            });

            JUDGE__STOP_WATCH('live_reminders__reminder_checking_interval', 30_000);
        }, 30_000);

        // Add the panel & button
        let actionPanel = $('.about-section__actions');

        if(nullish(actionPanel)) {
            actionPanel = furnish('div.about-section__actions', { style: `padding-left: 2rem; margin-bottom: 3rem; width: 24rem;` });

            $('.about-section')?.append?.(actionPanel);
        } else {
            for(let child of actionPanel.children)
                child.setAttribute('action-origin', 'native');
        }

        RegisterJob('live_reminders');
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

        if(nullish(STREAMER))
            return JUDGE__STOP_WATCH('auto_follow_raids');

        let url = parseURL(window.location),
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

    /*** Parse Commands
     *      _____                       _____                                          _
     *     |  __ \                     / ____|                                        | |
     *     | |__) |_ _ _ __ ___  ___  | |     ___  _ __ ___  _ __ ___   __ _ _ __   __| |___
     *     |  ___/ _` | '__/ __|/ _ \ | |    / _ \| '_ ` _ \| '_ ` _ \ / _` | '_ \ / _` / __|
     *     | |  | (_| | |  \__ \  __/ | |___| (_) | | | | | | | | | | | (_| | | | | (_| \__ \
     *     |_|   \__,_|_|  |___/\___|  \_____\___/|_| |_| |_|_| |_| |_|\__,_|_| |_|\__,_|___/
     *
     *
     */
    // Parses textual commands
    function parseCommands(string = '', variables = {}) {
        return string?.replace(/\$?(\([^\)]+?\)|\{[^\}]+?\}|\[[^\]]+?\])/g, ($0, $1, $$, $_) => {
            let path = $1.replace(/^[\(\[\{]+|[\}\]\)]+$/g, '').split('.');
            let properties = ({
                // StreamElements
                user: {
                    _: USERNAME,
                    name: USERNAME.toLocaleLowerCase(top.LANGUAGE),
                    level: 100,

                    points: STREAMER.coin,
                    points_rank: [STREAMER.rank, STREAMER.cult].join('/'),
                    points_alltime_rank: [STREAMER.rank, STREAMER.cult].join('/'),
                    time_online_rank: [STREAMER.rank, STREAMER.cult].join('/'),
                    time_offline_rank: [STREAMER.rank, STREAMER.cult].join('/'),

                    lastmessage: GetChat().filter(({ author }) => USERNAME.contains(author)),
                    lastseen: toTimeString(0, '!minute_m !second_s'),
                    lastactive: toTimeString(0, '!minute_m !second_s'),

                    time_online: toTimeString((parseCoin($('#tt-points-receipt').textContent) / 320) * 4_000),
                    time_offline: toTimeString(+(new Date) - +new Date(STREAMER.data.lastSeen || $('#root').dataset.aPageLoaded)),
                },
                user1: USERNAME,

                channel: {
                    _: STREAMER.name,
                    viewers: STREAMER.poll,
                    views: (STREAMER.cult * (1 + (STREAMER.poll / STREAMER.cult))).floor(),
                    followers: STREAMER.cult,
                    subs: STREAMER.poll,
                    display_name: STREAMER.name,
                    alias: STREAMER.name,
                },
                user2: STREAMER.name,

                title: $('[data-a-target="stream-title"i]').textContent,
                status: $('[data-a-target="stream-title"i]').textContent,

                game: $('[data-a-target="stream-game-link"i]').textContent,

                pointsname: STREAMER.fiat,

                uptime: toTimeString(STREAMER.time),

                // NightBot
                channelid: STREAMER.sole,
                userlevel: 'everyone',
                touser: `@${ USERNAME }`,
                urlfetch: `External website`,

                // Fetched...
                ...variables
            }),
                value = properties;

            dir:
            for(let root of path)
                if(nullish(value = value[root]))
                    return $0;
            value = value?._ ?? value;

            return value || $_;
        })
        ?.replace(/^\/(?:\w\S+)/, '');
    }

    Handlers.parse_commands = async() => {
        let elements = $('[data-a-target="stream-title"i], [data-a-target="about-panel"i] *, [data-a-target^="panel"i] *', true);

        for(let element of elements) {
            for(let { aliases, command, reply, availability, enabled, origin, variables } of await STREAMER.coms)
                // Wait here to keep from lagging the page...
                await until(() => {
                    element.innerHTML = element.innerHTML.replace(RegExp(`([!](?:${ [command, ...aliases].map(s => s.replace(/[\.\\\/\?\+\(\)\[\]\{\}\$\*\|]/g, '\\$&')).join('|') })(?:\\p{L}*))`, 'igu'), ($0, $1, $$, $_) => {
                        reply = parseCommands(reply, variables);

                        let { href } = (/\b(?<href>(?:https?:\/\/\S+|(?<!\$?[\(\[\{])\w{3,}\.\w{2,}(?:\/\S*)?(?![\}\]\)])))/i.exec(reply)?.groups ?? {}),
                            string;

                        if(parseBool(Settings.parse_commands__create_links) && defined(href))
                            string = `<a style="opacity:${ 2**-!enabled }" href="${ href.replace(/^(\w{3,}\.\w{2,})/, `https://$1`) }" target=_blank title="${ encodeHTML(reply) }">${ encodeHTML($1) }</a>`;
                        else
                            string = `<span style="text-decoration:2px solid underline;opacity:${ 2**-!enabled }" title="${ encodeHTML(reply) }">${ encodeHTML($1) }</span>`;

                        return `<span tt-parse-commands="${ btoa(escape(string)) }">${ $0.split('').join('&zwj;') }</span>`;
                    });

                    return true;
                }, 1);

            $('[tt-parse-commands]', true).map(element => element.outerHTML = unescape(atob(element.getAttribute('tt-parse-commands'))));
        }
    };
    Timers.parse_commands = -2_500;

    Unhandlers.parse_commands = () => {
        let title = $('[data-a-target="stream-title"i]');

        if(defined(title))
            title.innerHTML = encodeHTML($('[data-a-target="stream-title"i]').innerText);
    };

    __ParseCommands__:
    if(parseBool(Settings.parse_commands)) {
        REMARK("Parsing title commands...");

        RegisterJob('parse_commands');

        // Add the chat menu popup...
        let CSSBlockName = `Chat-Input-Menu:${ new UUID }`,
            AvailableCommands;

        function levenshtein(A = '', B = '') {
            let a = A.length,
                b = B.length;

            let track = Array(b + 1).fill(null).map(() => Array(a + 1).fill(null));

            for(let i = 0; i <= a; ++i)
                track[0][i] = i;

            for(let j = 0; j <= b; ++j)
                track[j][0] = j;

            for(let j = 1; j <= b; ++j)
                for(let i = 1; i <= a; ++i)
                    track[j][i] = Math.min(
                        // Deletion
                        track[j][i - 1] + 1,

                        // Insertion
                        track[j - 1][i] + 1,

                        // Substitution
                        track[j - 1][i - 1] + +(A[i - 1] !== B[j - 1]),
                    );

            return track[b][a];
        }

        let AvailabilityStickers = ({
            everyone: 'https://static-cdn.jtvnw.net/user-default-pictures-uv/215b7342-def9-11e9-9a66-784f43822e80-profile_image-70x70.png',
            subscriber: ((STREAMER.jump[STREAMER.name.toLowerCase()]?.stream?.badges?.[`${ STREAMER.sole }_subscriber_0`]?.href) || ''),
            regular: 'https://static-cdn.jtvnw.net/user-default-pictures-uv/215b7342-def9-11e9-9a66-784f43822e80-profile_image-70x70.png',
            twitch_vip: 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3',
            moderator: 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3',
            admin: 'https://static-cdn.jtvnw.net/badges/v1/d97c37bd-a6f5-4c38-8f57-4e4bef88af34/3',
            owner: 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/3',
        });

        $('[data-a-target="chat-input"i]').addEventListener('keyup', delay(async event => {
            let { target, code, altKey, ctrlKey, metaKey, shiftKey } = event,
                { value } = target,
                [tray, chat] = target.closest('div:not([class])').firstElementChild.children,
                f = furnish;

            if(['Tab', 'Space', 'Enter', 'Escape'].contains(code) || value?.contains(' ') || !value?.startsWith('!')) {
                let command = $('.tt-chat-input-suggestion')?.getAttribute('command');
                if(code == 'Tab' && defined(command)) {
                    let match = value.match(/!(\S+|$)/),
                        { index } = match,
                        [text, word] = match;

                    target.setRangeText(`!${ command }`, index, index + text.length, 'end');
                }

                tray.classList.remove('tt-chat-input-tray__open');

                chat.classList.remove('tt-chat-input-container__open');
                chat.firstElementChild.classList.remove('tt-chat-input-container__input-wrapper');

                $('#tt-tcito1')?.remove();

                return RemoveCustomCSSBlock(CSSBlockName);
            }

            value = value.slice(1);

            let listable = (AvailableCommands ??= await STREAMER.coms)
                .sort((a, b) => a.command.contains(value) && !b.command.contains(value)? -1: b.command.contains(value) && !a.command.contains(value)? +1: 0)
                .slice(0, 60)
                .map(data => ({ ...data, textDistance: levenshtein(value.toLowerCase(), data.command.toLowerCase()) }))
                .sort((a, b) => a.textDistance < b.textDistance? -1: +1)
                .slice(0, 5);

            tray.classList.add('tt-chat-input-tray__open');

            chat.classList.add('tt-chat-input-container__open');
            chat.firstElementChild.classList.add('tt-chat-input-container__input-wrapper');

            if(listable.length < 1) {
                $('#tt-tcito1')?.remove();

                tray.firstElementChild.append(
                    f('div#tt-tcito1', {},
                        f('div.tcito2', {},
                            f('div.tcito3', {},
                                f('div', { style: `max-height:3rem!important` },
                                    f('div', { style: `padding: 00.5rem!important` },
                                        f('span', { style: `color:var(--color-text-alt-2)!important` }, `No commands found.`)
                                    )
                                )
                            )
                        )
                    )
                );
            } else {
                $('#tt-tcito1')?.remove();

                tray.firstElementChild.append(
                    f('div#tt-tcito1', {},
                        f('div.tcito2', {},
                            f('div.tcito3', {},
                                f('div', { style: `max-height:18rem!important` },
                                    f('div', {},
                                        // f('div', { style: `text-align:center` },
                                        //     f('div.tt-kb', {},
                                        //         f('p.tt-kb-text', {}, 'Space')
                                        //     ),
                                        //     'insert selected command'
                                        // ),
                                        ...listable.map(({ aliases, command, reply, availability, enabled, origin, variables, textDistance }, index, array) => {
                                            reply = parseCommands(reply, variables);

                                            let { href } = (/\b(?<href>(?:https?:\/\/\S+|\w{3,}\.\w{2,}(?:\/\S*)?))/i.exec(reply)?.groups ?? {});

                                            if(defined(href))
                                                reply = f('a', { href: href.replace(/^(\w{3,}\.\w{2,})/, `https://$1`), title: reply, style: `margin-right:0.75rem` }, reply);

                                            return f(`div#tt-command--${ command.replace(/[^\w\-]+/g, '') }`, {},
                                                f('button.tcito7', {
                                                    style: `cursor:${ ['not-allowed','auto'][+enabled] }!important; color:${ ['inherit','var(--color-text-success)'][+(textDistance < 1)] }`,
                                                    onmouseup: ({ target, button = -1 }) => {
                                                        if(!!button)
                                                            return;

                                                        let command = $('.tt-chat-input-suggestion', false, target.closest('[id]'))?.getAttribute('command');
                                                        if(defined(command)) {
                                                            let target = $('[data-a-target="chat-input"i]');
                                                            let match = target.value.match(/!(\S+|$)/),
                                                                { index } = match,
                                                                [text, word] = match;

                                                                target.setRangeText(`!${ command }`, index, index + text.length, 'end');
                                                                target.focus();
                                                        }

                                                        tray.classList.remove('tt-chat-input-tray__open');

                                                        chat.classList.remove('tt-chat-input-container__open');
                                                        chat.firstElementChild.classList.remove('tt-chat-input-container__input-wrapper');

                                                        $('#tt-tcito1')?.remove();

                                                        return RemoveCustomCSSBlock(CSSBlockName);
                                                    },
                                                },
                                                    f('div.tcito8', {},
                                                        f('div.tcito9', {},
                                                            f('p.tt-chat-input-suggestion', { style: `word-break:break-word!important; color:${ ['inherit','var(--color-text-error)'][+!enabled] }`, command },
                                                                f('img.chat-badge', { src: AvailabilityStickers[availability], availability, style: `margin:0 0.75rem 0 0; height:1.5rem; width:1.5rem` }),

                                                                `!${ command }`,

                                                                f('span.tt-hide-inline-text-overflow', { style: `color:var(--color-text-alt-2); padding-right:0 0.75rem 0 0; position:absolute; right:0; max-width:50%`, title: reply },
                                                                    reply
                                                                )
                                                            )
                                                        )
                                                    )
                                                )
                                            )
                                        })
                                    )
                                )
                            )
                        )
                    )
                );
            }

            // Change the input's styling...
            AddCustomCSSBlock(CSSBlockName,
                `
                .tt-chat-input-tray__open {
                    bottom: 100%;
                    margin: 0 -.5rem -.5rem;
                    min-width: 100%;

                    /* .bhOZBz */
                    background-color: var(--color-background-base) !important;
                    border: var(--border-width-default) solid var(--color-border-base) !important;
                    border-radius: 0.6rem !important;
                    display: block !important;

                    box-shadow: var(--shadow-elevation-1) !important;

                    position: absolute !important;
                    left: 0px !important;
                    right: 0px !important;
                    z-index: var(--z-index-below) !important;

                    padding: 0.5rem !important;
                }

                .tcito2 {
                    position: relative !important;
                    padding: 0.5rem 0.5rem 0 !important;
                }

                .tcito3 {
                    display: flex !important;
                    flex-direction: column !important;
                    overflow: hiden !important;
                }

                .tcito7 {
                    border-radius: var(--border-radius-small);
                    display: block;
                    width: 100%;
                    color: inherit;
                }

                .tcito7:hover {
                    background-color: var(--color-background-interactable-hover) !important;
                }

                .tcito8 {
                    -webkit-box-align: center !important;
                    align-items: center !important;
                    display: flex !important;
                    padding-left: 0.5rem !important;
                    padding-right: 0.5rem !important;
                }

                .tcito9 {
                    padding: 0.5rem !important;
                    display: flex !important;
                    -webkit-box-pack: justify !important;
                    justify-content: space-between !important;
                    -webkit-box-align: center !important;
                    align-items: center !important;
                    -webkit-box-flex: 1 !important;
                    flex-grow: 1 !important;
                }

                .tt-chat-input-container__open {
                    border: 1px solid var(--color-border-base);
                    border-top: 0;
                    box-shadow: 0 2px 3px -1px rgba(0,0,0,.1),0 2px 2px -2px rgba(0,0,0,.02);
                    margin: 0 -.5rem -.5rem;
                    min-width: 100%;

                    /* .exNKnb */
                    background-color: var(--color-background-base)  !important;
                    border-bottom-left-radius: 0.6rem !important;
                    border-bottom-right-radius: 0.6rem !important;
                    display: block !important;
                    padding: 0.5rem !important;
                }

                .tt-chat-input-container__input-wrapper {
                    margin: 0 -1px -1px;
                }

                .tt-kb {
                    background-color: var(--color-background-alt) !important;
                    border: var(--border-width-default) solid var(--color-border-base) !important;
                    border-radius: 0.2rem !important;
                    display: inline-flex !important;
                    -webkit-box-align: center !important;

                    align-items: center !important;
                    padding: 0 0.5rem !important;

                    /* .keyboard-prompt */
                    height: 1.5rem;
                    margin-right: .3rem;
                }

                .tt-kb-text {
                    color: var(--color-text-alt-2) !important;

                    /* .keyboard-prompt--text */
                    font-size: 1.1rem;
                }
                `
            );
        }, 250));
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

        let hosting = defined($('[data-a-target="hosting-indicator"i], [class*="status"i][class*="hosting"i]')),
            next = await GetNextStreamer(),
            host_banner = $('[href^="/"] h1, [href^="/"] > p, [data-a-target="hosting-indicator"i]', true).map(element => element.textContent),
            host = (STREAMER.name ?? ''),
            [guest] = host_banner.filter(name => !RegExp(name, 'i').test(host));

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

                    open(parseURL(streamer.href).pushToSearch({ tool: `host-stopper--${ method }` }).href, '_self');
                    break host_stopper;
                }
            }

            for(let job of STREAMER.__eventlisteners__.onhost)
                job({ hosting });

            if(defined(next)) {
                LOG(`${ host } is hosting ${ guest }. Moving onto next channel (${ next.name })`, next.href, new Date);

                open(parseURL(next.href).pushToSearch({ tool: `host-stopper--${ method }` }).href, '_self');
            } else {
                LOG(`${ host } is hosting ${ guest }. There doesn't seem to be any followed channels on right now`, new Date);

                // location.reload();
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

        let url = parseURL(window.location),
            data = url.searchParameters,
            raided = data.referrer === 'raid',
            raiding = defined($('[data-test-selector="raid-banner"i]')),
            next = await GetNextStreamer(),
            raid_banner = $('[data-test-selector="raid-banner"i] strong', true).map(strong => strong?.textContent),
            from = (raided? null: STREAMER.name),
            [to] = (raided? [STREAMER.name]: raid_banner.filter(name => !RegExp(name, 'i').test(from)));

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

                    RemoveFromTopSearch(['referrer']);
                    CONTINUE_RAIDING = true;
                    break raid_stopper;
                }
            }

            let leaveStream = () => {
                CONTINUE_RAIDING = false;

                for(let job of STREAMER.__eventlisteners__.onraid)
                    job({ raided, raiding, next });

                if(defined(next)) {
                    LOG(`${ STREAMER.name } ${ raiding? 'is raiding': 'was raided' }. Moving onto next channel (${ next.name })`, next.href, new Date);

                    open(parseURL(next.href).pushToSearch({ tool: `raid-stopper--${ method }` }).href, '_self');
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

    /*** Greedy Raiding
     *       _____                   _         _____       _     _ _
     *      / ____|                 | |       |  __ \     (_)   | (_)
     *     | |  __ _ __ ___  ___  __| |_   _  | |__) |__ _ _  __| |_ _ __   __ _
     *     | | |_ | '__/ _ \/ _ \/ _` | | | | |  _  // _` | |/ _` | | '_ \ / _` |
     *     | |__| | | |  __/  __/ (_| | |_| | | | \ \ (_| | | (_| | | | | | (_| |
     *      \_____|_|  \___|\___|\__,_|\__, | |_|  \_\__,_|_|\__,_|_|_| |_|\__, |
     *                                  __/ |                               __/ |
     *                                 |___/                               |___/
     */
    let GREEDY_RAIDING_FRAMES = new Map;
    Handlers.greedy_raiding = () => {
        let online = [STREAMER, ...STREAMERS].filter(isLive),
            container = (null
                ?? $('#tt-greedy-raiding--container')
                ?? furnish('div#tt-greedy-raiding--container', { style: 'display:none!important' })
            );

        for(let channel of online) {
            let { name } = channel;
            let frame = (null
                ?? $(`#tt-greedy-raiding--${ name }`)
                ?? furnish(`iframe#tt-greedy-raiding--${ name }`, {
                    src: `./popout/${ name }/chat?hidden=true&parent=twitch.tv&current=${ (STREAMER.name == name) }`,

                    // sandbox: `allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals`,
                })
            );

            GREEDY_RAIDING_FRAMES.set(channel.name, frame);

            if(![...container.children].contains(frame))
                container.append(frame);
        }

        if(![...document.body.children].contains(container))
            document.body.append(container);
    };
    Timers.greedy_raiding = 5_000;

    Unhandlers.greedy_raiding = () => {
        for(let [name, frame] of GREEDY_RAIDING_FRAMES)
            frame?.remove();
    };

    __GreedyRaiding__:
    if(parseBool(Settings.greedy_raiding)) {
        REMARK('Adding raid-watching logic...');

        RegisterJob('greedy_raiding');
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

    TWITCH_PATHNAMES = [
        USERNAME,

        ...TWITCH_PATHNAMES
    ];
    RESERVED_TWITCH_PATHNAMES = RegExp(`/(${ TWITCH_PATHNAMES.join('|') })`, 'i');

    Handlers.stay_live = async() => {
        START__STOP_WATCH('stay_live');

        let next = await GetNextStreamer(),
            { pathname } = window.location;

        try {
            await LoadCache('UserIntent', async({ UserIntent }) => {
                if(parseBool(UserIntent))
                    TWITCH_PATHNAMES.push(UserIntent);

                RemoveCache('UserIntent');
            });
        } catch(error) {
            return JUDGE__STOP_WATCH('stay_live'), RemoveCache('UserIntent');
        }

        NotLive:
        if(false
            || !STREAMER.live
            || (true
                && parseBool(Settings.stay_live__ignore_channel_reruns)
                && STREAMER.redo
            )
        ) {
            if(RESERVED_TWITCH_PATHNAMES.test(pathname))
                break NotLive;

            if(!RegExp(STREAMER?.name, 'i').test(PATHNAME))
                break NotLive;

            if(defined(next)) {
                WARN(`${ STREAMER?.name } is no longer live. Moving onto next channel (${ next.name })`, next.href, new Date);

                REDO_FIRST_IN_LINE_QUEUE( parseURL(FIRST_IN_LINE_HREF)?.pushToSearch?.({ from: STREAMER?.name })?.href );

                open(`${ next.href }?obit=${ STREAMER?.name }&tool=stay-live`, '_self');
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
        REMARK('Ensuring Twitch stays live...');

        RegisterJob('stay_live');
    }

    /*** Time Zones
     *      _______ _                  ______
     *     |__   __(_)                |___  /
     *        | |   _ _ __ ___   ___     / / ___  _ __   ___  ___
     *        | |  | | '_ ` _ \ / _ \   / / / _ \| '_ \ / _ \/ __|
     *        | |  | | | | | | |  __/  / /_| (_) | | | |  __/\__ \
     *        |_|  |_|_| |_| |_|\___| /_____\___/|_| |_|\___||___/
     *
     *
     */
    let TIME_ZONE__TEXT_MATCHES = [],

        // Time-zone RegExps
        TIME_ZONE__REGEXPS = [
            // Natural
            // 3:00PM EST | 3PM EST | 3:00P EST | 3P EST | 3:00 EST | 3 EST
            /(?<![#\$\.+:\d%‰]|\p{Sc})\b(?<hour>2[0-3]|[01]?\d)(?<minute>:[0-5]\d)?(?!\d*(?:\p{Sc}|[%‰]))[ \t]*(?<meridiem>[ap]m?(?!\p{L}))?[ \t]*(?<timezone>(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-WY]{2,4}T)\b|\([ \t]*(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-WY]{2,4}T)[ \t]*\))/iu,
            // 15:00 EST | 1500 EST
            /(?<![#\$\.+:\d%‰]|\p{Sc})\b(?<hour>2[0-3]|[01]?\d)(?<minute>:?[0-5]\d)[ \t]*(?<timezone>(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-WY]{2,4}T)\b|\([ \t]*(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-WY]{2,4}T)[ \t]*\))/iu,
            // EST 3:00PM | EST 3PM | EST 3:00P | EST 3P | EST 3:00 | EST 3
            /(?<timezone>(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-WY]{2,4}T)\b|\([ \t]*(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-WY]{2,4}T)[ \t]*\))[ \t]*(?<hour>2[0-3]|[01]?\d)(?<minute>:[0-5]\d)?(?!\d*(?:\p{Sc}|[%‰]))[ \t]*(?<meridiem>[ap]m?(?!\p{L}))?/iu,
            // EST 15:00 | EST 1500
            /(?<timezone>(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-WY]{2,4}T)\b|\([ \t]*(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-WY]{2,4}T)[ \t]*\))[ \t]*(?<hour>2[0-3]|[01]?\d)(?<minute>:?[0-5]\d\b)(?!\d*(?:\p{Sc}|[%‰]))/iu,
            // 3:00PM | 3PM
            /(?<![#\$\.+:\d%‰]|\p{Sc})\b(?<hour>2[0-3]|[01]?\d)(?<minute>:[0-5]\d)?(?!\d*(?:\p{Sc}|[%‰]))[ \t]*(?<meridiem>[ap]m?(?!\p{L}))/iu,
            // 15:00
            /(?<![#\$\.+:\d%‰]|\p{Sc})\b(?<hour>2[0-3]|[01]?\d)(?<minute>:[0-5]\d)[ \t]*/iu,

            // Zulu - https://stackoverflow.com/a/23421472/4211612
            // Z15:00 | Z1500 | +05:00 | -05:00 | +0500 | -0500
            /(?<![#\$\.+:\d%‰]|\p{Sc})\b(?<offset>Z|[+-])(?<hour>2[0-3]|[01]\d)(?<minute>:?[0-5]\d)(?!\d*(?:\p{Sc}|[%‰]))\b/iu,

            // GMT/UTC
            // GMT+05:00 | GMT-05:00 | GMT+0500 | GMT-0500 | GMT+05 | GMT-05 | GMT+5 | GMT-5 | UTC+05:00 | UTC-05:00 | UTC+0500 | UTC-0500 | UTC+05 | UTC-05 | UTC+5 | UTC-5
            /(?<![#\$\.+:\d%‰]|\p{Sc})\b(?:GMT[ \t]*|UTC[ \t]*)(?<offset>[+-])(?<hour>2[0-3]|[01]?\d)(?<minute>:?[0-5]\d)?(?!\d*(?:\p{Sc}|[%‰]))\b/iu,
        ],

        // FIX-ME: Fix conflicting Time Zone entries...
        TIME_ZONE__CONVERSIONS = {
            AOE: "-12:00",
            GMT: "+00:00",
            UTC: "+00:00",

            // "Normal" timezones
            ACT: "+09:30",
            AET: "+10:00",
            AGT: "-03:00",
            ART: "+02:00",
            AST: "-09:00",
            BET: "-03:00",
            BST: "+06:00",
            CAT: "-01:00",
            CNT: "-03:30",
            CST: "-06:00",
                CDT: "-05:00",
            CTT: "+08:00",
            EAT: "+03:00",
            ECT: "+01:00",
            EET: "+02:00",
            EST: "-05:00",
                EDT: "-04:00",
            HST: "-10:00",
            IET: "-05:00",
            IST: "+05:30",
            JST: "+09:00",
            MET: "+03:30",
            MIT: "-11:00",
            MST: "-07:00",
                MDT: "-06:00",
            NET: "+04:00",
            NST: "+12:00",
            PLT: "+05:00",
            PNT: "-07:00",
            PRT: "-04:00",
            PST: "-08:00",
                PDT: "-07:00",
            SST: "+11:00",
            VST: "+07:00",

            // "Other" timezones - https://www.timeanddate.com/time/zones/
                // There are some conflicting entries--I chose to stick with the first entry
            ACDT: "+10:30",
            ACST: "+09:30",
            ACWST: "+08:45",
            ADT: "+4:00",
            AEDT: "+11:00",
            AEST: "+10:00",
            AFT: "+04:30",
            AKDT: "-8:00",
            AKST: "-9:00",
            ALMT: "+6:00",
            AMST: "-3:00",
            AMT: "-4:00",
            ANAST: "+12:00",
            ANAT: "+12:00",
            AQTT: "+5:00",
            AWDT: "+9:00",
            AWST: "+8:00",
            AZOST: "+0:00",
            AZOT: "-1:00",
            AZST: "+5:00",
            AZT: "+4:00",
            BNT: "+8:00",
            BOT: "-4:00",
            BRST: "-2:00",
            BRT: "-3:00",
            BTT: "+6:00",
            CAST: "+8:00",
            CCT: "+06:30",
            CEST: "+2:00",
            CET: "+1:00",
            CHADT: "+13:45",
            CHAST: "+12:45",
            CHOST: "+9:00",
            CHOT: "+8:00",
            CHUT: "+10:00",
            CIDST: "-4:00",
            CIST: "-5:00",
            CKT: "-10:00",
            CLST: "-3:00",
            CLT: "-4:00",
            COT: "-5:00",
            CVT: "-1:00",
            CXT: "+7:00",
            CHST: "+10:00",
            DAVT: "+7:00",
            DDUT: "+10:00",
            EASST: "-5:00",
            EAST: "-6:00",
            EEST: "+3:00",
            EGST: "+0:00",
            EGT: "-1:00",
            EST: "-5:00",
            FET: "+3:00",
            FJST: "+13:00",
            FJT: "+12:00",
            FKST: "-3:00",
            FKT: "-4:00",
            FNT: "-2:00",
            GALT: "-6:00",
            GAMT: "-9:00",
            GET: "+4:00",
            GFT: "-3:00",
            GILT: "+12:00",
            GMT: "+0:00",
            GST: "+4:00",
            GYT: "-4:00",
            HDT: "-9:00",
            HKT: "+8:00",
            HOVST: "+8:00",
            HOVT: "+7:00",
            ICT: "+7:00",
            IDT: "+3:00",
            IOT: "+6:00",
            IRDT: "+04:30",
            IRKST: "+9:00",
            IRKT: "+8:00",
            IRST: "+03:30",
            KGT: "+6:00",
            KOST: "+11:00",
            KRAST: "+8:00",
            KRAT: "+7:00",
            KST: "+9:00",
            KUYT: "+4:00",
            LHDT: "+11:00",
            LHST: "+10:30",
            LINT: "+14:00",
            MAGST: "+12:00",
            MAGT: "+11:00",
            MART: "-09:30",
            MAWT: "+5:00",
            MHT: "+12:00",
            MMT: "+06:30",
            MSD: "+4:00",
            MSK: "+3:00",
            MUT: "+4:00",
            MVT: "+5:00",
            MYT: "+8:00",
            NCT: "+11:00",
            NDT: "-02:30",
            NFDT: "+12:00",
            NFT: "+11:00",
            NOVST: "+7:00",
            NOVT: "+7:00",
            NPT: "+05:45",
            NRT: "+12:00",
            NUT: "-11:00",
            NZDT: "+13:00",
            NZST: "+12:00",
            OMSST: "+7:00",
            OMST: "+6:00",
            ORAT: "+5:00",
            PET: "-5:00",
            PETST: "+12:00",
            PETT: "+12:00",
            PGT: "+10:00",
            PHOT: "+13:00",
            PHT: "+8:00",
            PKT: "+5:00",
            PMDT: "-2:00",
            PMST: "-3:00",
            PONT: "+11:00",
            PWT: "+9:00",
            PYST: "-3:00",
            PYT: "-4:00",
            QYZT: "+6:00",
            RET: "+4:00",
            ROTT: "-3:00",
            SAKT: "+11:00",
            SAMT: "+4:00",
            SAST: "+2:00",
            SBT: "+11:00",
            SCT: "+4:00",
            SGT: "+8:00",
            SRET: "+11:00",
            SRT: "-3:00",
            SYOT: "+3:00",
            TAHT: "-10:00",
            TFT: "+5:00",
            TJT: "+5:00",
            TKT: "+13:00",
            TLT: "+9:00",
            TMT: "+5:00",
            TOST: "+14:00",
            TOT: "+13:00",
            TRT: "+3:00",
            TVT: "+12:00",
            ULAST: "+9:00",
            ULAT: "+8:00",
            UTC: ":00",
            UYST: "-2:00",
            UYT: "-3:00",
            UZT: "+5:00",
            VET: "-4:00",
            VLAST: "+11:00",
            VLAT: "+10:00",
            VOST: "+6:00",
            VUT: "+11:00",
            WAKT: "+12:00",
            WARST: "-3:00",
            WAST: "+2:00",
            WAT: "+1:00",
            WEST: "+1:00",
            WET: "+0:00",
            WFT: "+12:00",
            WGST: "-2:00",
            WGT: "-3:00",
            WIB: "+7:00",
            WIT: "+9:00",
            WITA: "+8:00",
            WST: "+13:00",
            YAKST: "+10:00",
            YAKT: "+9:00",
            YAPT: "+10:00",
            YEKST: "+6:00",
            YEKT: "+5:00",
        };

    // Convert text to times
    function convertWordsToTimes(string = '') {
        return string.normalize('NFKD')
            // .replace(/\b(mornings?|dawn)\b/i, '06:00AM')
            .replace(/\b(after\s?noons?|evenings?)\b/i, '01:00PM')
            .replace(/\b(noons?|lunch[\s\-]?time)\b/i, '12:00PM')
            // .replace(/\b((?:to|2)?nights?|dusk)\b/i, '06:00PM')
            .replace(/\b(mid[\s\-]?nights?)\b/i, '12:00AM')

            // Ignores shorthands → "today" "2day" "tonight" "2night" "tomorrow" "2morrow"
            .replace(/\b(?:to|2)(?:day|night|morrow)\b/ig, ($0, $$, $_) => $0.split('').join('\u200d'));
    }

    convertWordsToTimes.inReverse ??= (string = '') => {
        return string.normalize('NFKD')
            // .replace(/\b(06:00AM)\b/i, 'morning')
            .replace(/\b(01:00PM)\b/i, 'evening')
            .replace(/\b(12:00PM)\b/i, 'noon')
            // .replace(/\b(06:00PM)\b/i, 'night')
            .replace(/\b(12:00AM)\b/i, 'midnight');
    };

    Handlers.time_zones = () => {
        let allNodes = node => (node.childNodes.length? [...node.childNodes].map(allNodes): [node]).flat();
        let cTitle = $('[data-a-target="stream-title"i], [data-a-target="about-panel"i], [data-a-target^="panel"i]', true),
            rTitle = $('[class*="channel-tooltip"i]:not([class*="offline"i]) > p + p');

        parsing:
        for(let container of [...cTitle, rTitle].filter(defined)) {
            let [timezone, zone, type, trigger] = (null
                ?? (container?.innerText || '')
                    .normalize('NFKD')
                    .match(/(?:(?<zone>\w+)[\s\-]+)?(?:(?<type>\w+)[\s\-]+)(?<trigger>time)\b/i)
                ?? []
            );
            let MASTER_TIME_ZONE = (TIME_ZONE__CONVERSIONS[timezone?.length < 1? '': timezone = [zone, type, trigger].map((s = '') => s[0]).join('').toUpperCase()]?.length? timezone: '');

            searching:
            for(let regexp of TIME_ZONE__REGEXPS) {

                replacing:
                for(let MAX = Object.keys(TIME_ZONE__CONVERSIONS).length; --MAX > 0 && regexp.test(convertWordsToTimes(container?.innerText));) {
                    container = container.getElementByText(regexp) ?? container.getElementByText(/\b(after\s?noons?|evenings?|noons?|lunch[\s\-]?time|mid[\s\-]?nights?)\b/iu);

                    if(nullish(container))
                        continue searching;

                    let convertedText = convertWordsToTimes(container.innerText.trim()),
                        originalText = container.innerText;

                    if(convertedText.length < 1)
                        continue searching;

                    let { groups, index, length } = regexp.exec(convertedText),
                        { hour, minute = ':00', offset = '', meridiem = '', timezone = MASTER_TIME_ZONE } = groups;
                    let now = new Date,
                        year = now.getFullYear(),
                        month = now.getMonth() + 1,
                        day = now.getDate();

                    hour = parseInt(hour);
                    hour += (/^p/i.test(meridiem) && hour < 12? 12: 0);

                    timezone ||= (offset.length? 'GMT': '');

                    if(timezone.length) {
                        let name = timezone = timezone.toUpperCase().replace(/[^\w\+\-]+/g, '');

                        if(timezone in TIME_ZONE__CONVERSIONS)
                            timezone = TIME_ZONE__CONVERSIONS[timezone].replace(/^[+-]/, 'GMT$&');
                        else if(/[\+\-]/.test(timezone))
                            timezone = timezone.replace(/^[+-]/, 'GMT$&');
                        else
                            continue searching;

                        MASTER_TIME_ZONE ||= name;
                    }

                    let newDate = new Date(`${ [year, month, day].join(' ') } ${ offset }${ hour + minute } ${ timezone }`),
                        newTime = newDate.toLocaleTimeString(top.LANGUAGE, { timeStyle: 'short' }),
                        noChange = convertWordsToTimes(originalText).trim() == originalText.trim();

                    // Keep original text
                    if(Number.isNaN(+newDate))
                        container.innerHTML = `${ originalText.substr(0, index).split('').join('&zwj;') }{{time_zones?=${ btoa(escape(originalText.substr(index, length))) }}}${ originalText.substr(length).split('').join('&zwj;') }`;
                    // Convert to new text
                    else
                        container.innerText = convertedText
                            .replace(regexp, ($0, $$, $_) => `{{time_zones?=${ btoa(escape(newTime)) }|${ btoa(escape(noChange? $0.replace(/$/, (groups.timezone?.length? '': MASTER_TIME_ZONE?.length? ` (${ MASTER_TIME_ZONE })`: '')): convertWordsToTimes.inReverse($0))) }}}`);
                }
            }
        }

        let TZC = [];
        for(let MAX = 1000, regexp = /\{\{time_zones\?=(.+?)\}\}/, node; --MAX > 0 && defined(node = $.body.getElementByText(regexp));) {
            let text = RegExp['$&'],
                tzc = RegExp.$1;

            node.innerHTML = node.innerHTML.replace(text, `<!--!time#${ TZC.push(tzc) }-->`);
        }

        allNodes(document.body)
            .filter(node => /\bcomment\b/i.test(node.nodeName) && node.textContent.startsWith('!time#'))
            .map(comment => {
                let index = parseInt(comment.textContent.replace('!time#', '')) - 1;
                let [newText, oldText] = TZC[index].split('|');

                let span = furnish('span', {
                    id: `tt-time-zone-${ (new UUID) }`,
                    style: 'color:var(--user-complement-color); text-decoration:underline 2px; width:min-content; white-space:nowrap',
                    contrast: THEME__PREFERRED_CONTRAST,
                    innerHTML: unescape(atob(newText)).split('').join('&zwj;'),
                });

                if(oldText?.length)
                    span.setAttribute('tip-text--timezone', oldText);
                else
                    span.removeAttribute('style');

                comment.replaceWith(span);
            });

        setTimeout(() => {
            $('[id^="tt-time-zone-"][tip-text--timezone]', true)
                .map(span => {
                    let oldText = span.getAttribute('tip-text--timezone');

                    new Tooltip(span, unescape(atob(oldText)).split('').join('&zwj;'), { from: 'top' });

                    // span.removeAttribute('tip-text--timezone');
                });
        }, 100);

        TIME_ZONE__TEXT_MATCHES = [...new Set(TIME_ZONE__TEXT_MATCHES)];
    };
    Timers.time_zones = 250;

    __TimeZones__:
    if(parseBool(Settings.time_zones)) {
        REMARK('Converting times in the title...');

        RegisterJob('time_zones');
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
                            src = Runtime.getURL(`aud/${ Settings.whisper_audio_sound ?? "goes-without-saying-608" }.${ type }`);
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
            unread = parseInt(pill?.textContent) | 0;

        if(nullish(pill))
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
    /*** Points Receipt & Ranking
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
        OBSERVED_COLLECTION_ANIMATIONS = new Map(),
        DISPLAYING_RANK,
        RANK_TOOLTIP;

    Handlers.points_receipt_placement = () => {
        // Display the ranking
        START__STOP_WATCH('points_receipt_placement__ranking');

        DisplayRanking: {
            let placement;

            if((placement = Settings.points_receipt_placement ??= "null") == "null") {
                JUDGE__STOP_WATCH('points_receipt_placement__ranking');
                break DisplayRanking;
            }

            DISPLAYING_RANK = setInterval(async() => {
                let container = $('[data-test-selector="chat-input-buttons-container"i]'),
                    ranking = $('#tt-channel-point-ranking');

                if(nullish(container))
                    return JUDGE__STOP_WATCH('points_receipt_placement__ranking');

                let { rank } = STREAMER,
                    string = nth(rank.toLocaleString(LANGUAGE), ''),
                    color = (null
                        ?? ['#FFD700', '#C0C0C0', '#CD7F32'][rank - 1]
                        ?? '#91FF47'
                    );

                rank = (
                    rank < 1?
                        '?':
                    rank < 4?
                        `<span style="text-decoration:${ 4 - rank }px underline ${ color }">${ string }</span>`:
                    string
                );

                if(nullish(ranking))
                    container.insertBefore(ranking = (
                        furnish('div', { style: 'animation:1s fade-in 1;' },
                            furnish('div#tt-channel-point-ranking', { style: 'display:flex; position:relative; align-items:center; vertical-align:middle; height:100%;' })
                        )
                    ), container.lastElementChild);
                else
                    ranking.innerHTML = Glyphs.modify('trophy', { height: '16px', width: '16px', fill: color }) + rank;

                if(rank == '?')
                    return ranking?.remove() || JUDGE__STOP_WATCH('points_receipt_placement__ranking');

                let place = (100 * (STREAMER.rank / STREAMER.cult)).clamp(1, 100).round() | 0;

                RANK_TOOLTIP ??= new Tooltip(ranking, "", { from: 'top' });
                RANK_TOOLTIP.innerHTML = `You are in the top ${ place || '?' }%`;
            }, 250);
        }

        JUDGE__STOP_WATCH('points_receipt_placement__ranking');

        // Display the receipt
        START__STOP_WATCH('points_receipt_placement');

        DisplayReceipt: {
            let placement;

            if((placement = Settings.points_receipt_placement ??= "null") == "null")
                return JUDGE__STOP_WATCH('points_receipt_placement');

            let live_time = $('.live-time');

            if(nullish(live_time))
                return RestartJob('points_receipt_placement');

            let classes = element => [...element.classList].map(label => '.' + label).join('');

            let container = live_time.closest(`*:not(${ classes(live_time) })`),
                parent = container.closest(`*:not(${ classes(container) })`);

            let f = furnish;
            let points_receipt =
            f(`${ container.tagName }${ classes(container) }`, { style: 'min-width:7rem; text-align:center' },
                f(`${ live_time.tagName }#tt-points-receipt${ classes(live_time).replace(/\blive-time\b/gi, 'points-receipt') }`, { receipt: 0, innerHTML: `${ Glyphs.modify('channelpoints', { height: '20px', width: '20px', style: 'vertical-align:bottom' }) } 0 &uarr;` })
            );

            parent.append(points_receipt);

            RECEIPT_TOOLTIP = new Tooltip(points_receipt);

            COUNTING_POINTS = setInterval(async() => {
                let points_receipt = $('#tt-points-receipt'),
                    balance = $('[data-test-selector="balance-string"i]'),
                    exact_debt = $('[data-test-selector^="prediction-checkout"i], [data-test-selector*="user-prediction"i][data-test-selector*="points"i], [data-test-selector*="user-prediction"i] p, [class*="points-icon"i] ~ p *:not(:empty)'),
                    exact_change = $('[class*="community-points-summary"i][class*="points-add-text"i]');

                if(nullish(points_receipt))
                    return RestartJob('points_receipt_placement');

                let [chat] = $('[role="log"i], [data-test-selector="banned-user-message"i], [data-test-selector^="video-chat"i]', true);

                if(nullish(chat)) {
                    let framedData = PostOffice.get('points_receipt_placement');

                    window.PostOffice = PostOffice;

                    if(nullish(framedData))
                        return;

                    balance ??= { textContent: framedData.balance };
                    exact_debt ??= { textContent: framedData.exact_debt };
                    exact_change ??= { textContent: framedData.exact_change };
                }

                let current = parseCoin(balance?.textContent);

                INITIAL_POINTS ??= current;

                let debt = INITIAL_POINTS - current;

                EXACT_POINTS_SPENT = parseCoin(exact_debt?.textContent ?? (debt? EXACT_POINTS_SPENT > debt? EXACT_POINTS_SPENT: debt: EXACT_POINTS_SPENT));

                let animationID = (exact_change?.textContent ?? exact_debt?.textContent ?? (INITIAL_POINTS > current? -EXACT_POINTS_SPENT + '': 0)),
                    animationTimeStamp = +new Date;

                if(!/^([\+\-, \d]+)$/.test(animationID))
                    return;

                // Don't keep adding the exact change while the animation is playing
                if(OBSERVED_COLLECTION_ANIMATIONS.has(animationID)) {
                    let time = OBSERVED_COLLECTION_ANIMATIONS.get(animationID);

                    // It's been less than 5 minutes
                    if(nullish(animationID) || Math.abs(animationTimeStamp - time) < 300_000)
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

                EXACT_POINTS_EARNED += parseCoin(exact_change?.textContent);

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
        }

        JUDGE__STOP_WATCH('points_receipt_placement');
    };
    Timers.points_receipt_placement = -2_500;

    Unhandlers.points_receipt_placement = () => {
        [COUNTING_POINTS, DISPLAYING_RANK].map(clearInterval);

        $('#tt-points-receipt, #tt-channel-point-ranking', true)
            .forEach(span => span?.parentElement?.remove());

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
        // Display the points
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

                amount = (balance?.textContent ?? (hasPointsEnabled? amount: '&#128683;'));
                fiat = (STREAMER?.fiat ?? fiat ?? 0);
                face = (STREAMER?.face ?? face ?? '');
                notEarned = (
                    (allRewards?.length)?
                        allRewards.filter(amount => parseCoin(amount?.textContent) > STREAMER.coin).length:
                    (notEarned > -Infinity)?
                        notEarned:
                    -1
                );
                pointsToEarnNext = (
                    (allRewards?.length)?
                        allRewards
                            .map(amount => (parseCoin(amount?.textContent) > STREAMER.coin? parseCoin(amount?.textContent) - STREAMER.coin: 0))
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

        if(nullish(richTooltip))
            return JUDGE__STOP_WATCH('point_watcher_placement');

        // Remove the old face and values...
        $('.tt-point-amount, .tt-point-face', true).map(element => element?.remove());

        let [title, subtitle, ...footers] = $('[class*="channel-tooltip"i] > *', true, richTooltip),
            footer = footers[footers.length - 1],
            target = footer?.lastElementChild;

        if(nullish(subtitle)) {
            let [rTitle, rSubtitle] = $('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="metadata"i] > *', true),
                rTarget = $('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="status"i]');

            title = rTitle;
            subtitle = rSubtitle;
            target = rTarget;
        }

        if(nullish(title) || nullish(target))
            return JUDGE__STOP_WATCH('point_watcher_placement');

        let [name, game] = title.textContent.split(/[^\w\s]/);

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
                    allRewards.filter(amount => parseCoin(amount?.textContent) > STREAMER.coin).length:
                (notEarned > -Infinity)?
                    notEarned:
                -1
            );
            pointsToEarnNext = (
                (allRewards?.length)?
                    allRewards
                        .map(amount => (parseCoin(amount?.textContent) > STREAMER.coin? parseCoin(amount?.textContent) - STREAMER.coin: 0))
                        .sort((x, y) => (x > y? -1: +1))
                        .filter(x => x > 0)
                        .pop():
                (notEarned > -Infinity)?
                    pointsToEarnNext:
                0
            );

            let text = furnish('span.tt-point-amount', {
                    'tt-earned-all': notEarned == 0,
                    innerHTML: amount.toLocaleString(LANGUAGE),
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

    /*** Stream Preview
     *       _____ _                              _____                _
     *      / ____| |                            |  __ \              (_)
     *     | (___ | |_ _ __ ___  __ _ _ __ ___   | |__) | __ _____   ___  _____      __
     *      \___ \| __| '__/ _ \/ _` | '_ ` _ \  |  ___/ '__/ _ \ \ / / |/ _ \ \ /\ / /
     *      ____) | |_| | |  __/ (_| | | | | | | | |   | | |  __/\ V /| |  __/\ V  V /
     *     |_____/ \__|_|  \___|\__,_|_| |_| |_| |_|   |_|  \___| \_/ |_|\___| \_/\_/
     *
     *
     */
    let STREAM_PREVIEW;

    Handlers.stream_preview = async() => {
        START__STOP_WATCH('stream_preview');

        let richTooltip = $('[class*="channel-tooltip"i]:not([class*="offline"i])');

        if(nullish(richTooltip)) {
            if(parseBool(Settings.stream_preview_sound) && MAINTAIN_VOLUME_CONTROL)
                SetVolume(parseBool(Settings.away_mode__volume_control) && AwayModeStatus? Settings.away_mode__volume: InitialVolume ?? 1);
            else if(parseBool(Settings.stream_preview_sound) && defined(STREAM_PREVIEW?.element))
                SetVolume(InitialVolume);

            return JUDGE__STOP_WATCH('stream_preview'), STREAM_PREVIEW = { element: STREAM_PREVIEW?.element?.remove() };
        }

        let [title, subtitle, ...footers] = $('[class*="channel-tooltip"i] > *', true, richTooltip);

        if(nullish(subtitle)) {
            let [rTitle, rSubtitle] = $('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="metadata"i] > *', true);

            title = rTitle;
            subtitle = rSubtitle;
        }

        if(nullish(title))
            return JUDGE__STOP_WATCH('stream_preview'), STREAM_PREVIEW?.element?.remove();

        let [name] = title.textContent.split(/[^\w\s]/);

        name = name?.trim();

        // There is already a preview of the hovered tooltip
        if([STREAMER?.name, STREAM_PREVIEW?.name].contains(name))
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
                            (top + height / 2 < body.height / 2)?
                                // Below tooltip
                                `--below: tooltip; top: calc(${ bottom }px + 0.5em);`:
                            // Above tooltip
                            `--above: tooltip; top: calc(${ top }px - 0.5em - (15rem * ${ scale }));`
                        ) + `left: calc(${ (watchParty? getOffset($('[data-a-target^="side-nav-bar"i]'))?.width: video?.left) ?? 50 }px - 6rem); height: calc(15rem * ${ scale }); width: calc(26.75rem * ${ scale }); z-index: ${ '9'.repeat(1 + parseInt(Settings.stream_preview_position ?? 0)) };`,
                    },
                    furnish('div.tt-stream-preview--poster', {
                        style: `background-image: url("https://static-cdn.jtvnw.net/previews-ttv/live_user_${ name.toLowerCase() }-1280x720.jpg?${ +new Date }");`,
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

                            if(nullish(InitialVolume))
                                InitialVolume = GetVolume();

                            let hasAudio = element =>
                                parseBool(null
                                    ?? element?.webkitAudioDecodedByteCount
                                    ?? element?.audioTracks?.length
                                );

                            let audioChecker =
                            setInterval(() => {
                                let doc = $('.tt-stream-preview--iframe')?.contentDocument;

                                if(nullish(doc))
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
            extra = () => {};

        let classes = element => [...element.classList].map(label => '.' + label).join('');

        let live_time = $('.live-time');

        if(nullish(live_time))
            return RestartJob('watch_time_placement');

        switch(placement) {
            // Option 1 "over" - video overlay, volume control area
            case 'over': {
                container = live_time.closest(`*:not(${ classes(live_time) })`);
                parent = $('[data-a-target="player-controls"i] [class*="player-controls"i][class*="left-control-group"i]');
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
            { style: `color: var(--user-complement-color)`, contrast: THEME__PREFERRED_CONTRAST },
            f(`${ live_time.tagName }#tt-watch-time${ classes(live_time).replace(/\blive-time\b/gi, 'watch-time') }`, { time: 0 })
        );

        WATCH_TIME_TOOLTIP = new Tooltip(watch_time);

        parent.append(watch_time);

        extra({ parent, container, live_time, placement });

        LoadCache(['WatchTime', 'Watching'], ({ WatchTime = 0, Watching = NORMALIZED_PATHNAME }) => {
            if(NORMALIZED_PATHNAME != Watching)
                STARTED_WATCHING = +($('#root').dataset.aPageLoaded ??= +new Date);

            WATCH_TIME_INTERVAL = setInterval(() => {
                let watch_time = $('#tt-watch-time'),
                    time = GET_WATCH_TIME();

                if(nullish(watch_time)) {
                    clearInterval(WATCH_TIME_INTERVAL);
                    return RestartJob('watch_time_placement');
                }

                watch_time.setAttribute('time', time);
                watch_time.innerHTML = toTimeString(time, 'clock');
                watch_time.setAttribute('style', `mix-blend-mode:${ ANTITHEME }en;`);

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

        if(nullish(video))
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

                    if(nullish(container))
                        break __RecoverFrames_Embed__;

                    let { name } = STREAMER,
                        controls = true,
                        muted = true,
                        iframe;

                    container.append(
                        iframe = furnish(`iframe#tt-embedded-video`, {
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

                                until(() => {
                                    let doc = $('#video')?.contentDocument;

                                    if(nullish(doc))
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
                        })
                    );

                    $('[data-a-player-state]')?.addEventListener?.('mouseup', ({ button = -1 }) => !button && window.location.reload());
                    $('video', false, container).setAttribute('style', `display:none`);

                    new Tooltip($('[data-a-player-state]'), `${ name }'${ /s$/.test(name)? '': 's' } stream ran into an error. Click to reload`);
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

        if(nullish(video))
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

            if(nullish(control)) {
                WARN("No video controls presented.");

                break __RecoverVideoProgramatically__;
            } if(attempts > 3) {
                WARN("Automatic attempts are not helping.");

                break __RecoverVideoProgramatically__;
            }

            if(!playing) {
                // PAUSED → PLAY
                control.click();
            } else if(playing) {
                // PLAYING → PAUSE, PLAY
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

        if(nullish(video))
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

        if(nullish(errorMessage))
            return JUDGE__STOP_WATCH('recover_video');

        if(RECOVERING_VIDEO)
            return JUDGE__STOP_WATCH('recover_video');
        RECOVERING_VIDEO = true;

        errorMessage = errorMessage.textContent;

        if(/subscribe|mature/i.test(errorMessage)) {
            let next = await GetNextStreamer();

            // Subscriber only, etc.
            if(defined(next))
                open(parseURL(next.href).pushToSearch({ tool: 'video-recovery--non-subscriber' }).href, '_self');
        } else {
            ERROR('The stream ran into an error:', errorMessage, new Date);

            // Failed to play video at...
            PushToTopSearch({ 'tt-err-vid': (+new Date).toString(36) });
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
        $('[data-a-target="followed-channel"i], #sideNav .side-nav-section[aria-label][tt-svg-label="followed"i] [href^="/"], [data-test-selector*="search-result"i][data-test-selector*="channel"i] a:not([href*="/search?"])', true).map(a => {
            a.addEventListener('mouseup', async event => {
                let { currentTarget, button = -1 } = event;

                if(!!button)
                    return /* Not the primary button */;

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

        let error = $('main [data-a-target="core-error-message"i]');

        if(nullish(error))
            return JUDGE__STOP_WATCH('recover_pages');

        let message = error.textContent,
            next = await GetNextStreamer();

        ERROR(message);

        if(/content.*unavailable/i.test(message) && defined(next))
            open(parseURL(next.href).pushToSearch({ tool: 'page-recovery--content-unavailable' }).href, '_self');
        else
            location.reload();

        JUDGE__STOP_WATCH('recover_pages');
    };
    Timers.recover_pages = 5_000;

    __RecoverPages__:
    if(parseBool(Settings.recover_pages)) {
        RegisterJob('recover_pages');
    }

    /*** Developer Features
     *      _____                 _                         ______         _
     *     |  __ \               | |                       |  ____|       | |
     *     | |  | | _____   _____| | ___  _ __   ___ _ __  | |__ ___  __ _| |_ _   _ _ __ ___  ___
     *     | |  | |/ _ \ \ / / _ \ |/ _ \| '_ \ / _ \ '__| |  __/ _ \/ _` | __| | | | '__/ _ \/ __|
     *     | |__| |  __/\ V /  __/ | (_) | |_) |  __/ |    | | |  __/ (_| | |_| |_| | | |  __/\__ \
     *     |_____/ \___| \_/ \___|_|\___/| .__/ \___|_|    |_|  \___|\__,_|\__|\__,_|_|  \___||___/
     *                                   | |
     *                                   |_|
     */
    Handlers.extra_keyboard_shortcuts = () => {
        /* Add the shortcuts */

        // Take screenshots of the stream
        // Alt + Shift + X | Opt + Shift + X
        if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X))
            document.addEventListener('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X = function Take_a_Screenshot({ key, altKey, ctrlKey, metaKey, shiftKey }) {
                if(!(ctrlKey || metaKey) && altKey && shiftKey && 'xX'.contains(key))
                    $('video', true).pop().copyFrame()
                        .then(async copied => await alert.timed('Screenshot saved to clipboard!', 5_000))
                        .catch(async error => await alert.timed(`Failed to take screenshot: ${ error }`, 7_000));
            });

        // Display the enabled keyboard shortcuts
        let help = $.body.getElementByText('space/k', 'i')?.closest('tbody');

        let f = furnish;
        if(defined(help) && nullish($('.tt-extra-keyboard-shortcuts', false, help)))
            for(let shortcut in GLOBAL_EVENT_LISTENERS)
                if(/^(key(?:up|down)_)/i.test(shortcut)) {
                    let name = GLOBAL_EVENT_LISTENERS[shortcut].toTitle(),
                        macro = GetMacro(shortcut.toLowerCase().split('_').slice(1).join('+'));

                    if(!name.length)
                        continue;

                    help.append(
                        f('tr.tw-table-row.tt-extra-keyboard-shortcuts', {},
                            f('td.tw-tabel-cell', {},
                                f('p', {}, name)
                            ),
                            f('td.tw-table-cell', {},
                                f('span', {}, macro)
                            )
                        )
                    );
                }
    };
    Timers.extra_keyboard_shortcuts = 100;

    __ExtraKeyboardShortcuts__:
    if(parseBool(Settings.extra_keyboard_shortcuts)) {
        RegisterJob('extra_keyboard_shortcuts');
    }

    /*** Miscellaneous
     *      __  __ _              _ _
     *     |  \/  (_)            | | |
     *     | \  / |_ ___  ___ ___| | | __ _ _ __   ___  ___  _   _ ___
     *     | |\/| | / __|/ __/ _ \ | |/ _` | '_ \ / _ \/ _ \| | | / __|
     *     | |  | | \__ \ (_|  __/ | | (_| | | | |  __/ (_) | |_| \__ \
     *     |_|  |_|_|___/\___\___|_|_|\__,_|_| |_|\___|\___/ \__,_|___/
     *
     *
     */
    Miscellaneous: {
        // Better styling. Will match the user's theme choice as best as possible
        CUSTOM_CSS.innerHTML +=
            `
            /* The user is using the light theme (like a crazy person) */
            :root {
                --channel-color: ${ STREAMER.tint };
                --channel-color-complement: ${ STREAMER.tone };
                --channel-color-dark: ${ THEME__CHANNEL_DARK };
                --channel-color-light: ${ THEME__CHANNEL_LIGHT };
            }

            :root[class*="light"i] {
                --color-colored: ${ THEME__CHANNEL_LIGHT };
                --color-colored-complement: ${ THEME__CHANNEL_DARK };
            }

            /* The user is using the dark theme */
            :root[class*="dark"i] {
                --color-colored: ${ THEME__CHANNEL_DARK };
                --color-colored-complement: ${ THEME__CHANNEL_LIGHT };
            }

            [up-next--body] *:is(button, h5) {
                --color: var(--user-complement-color) !important;
                --fill: var(--user-complement-color) !important;
            }

            /* Apply contrast correction... div[contrast="low prefer dark"] */
            :root[class*="light"i] [contrast~="low"i][contrast~="light"i],
            [contrast~="low"i][contrast~="dark"i] {
                color: #000 !important;
                fill: #000 !important;

                /** Over complicated method
                 * background-color: #0000;
                 * mix-blend-mode: lighten;
                 * text-shadow: 0 0 5px #000;
                 */
            }

            :root[class*="dark"i] [contrast~="low"i][contrast~="dark"i],
            [contrast~="low"i][contrast~="light"i] {
                color: #fff !important;
                fill: #fff !important;

                /** Over complicated method
                 * background-color: #fff0;
                 * mix-blend-mode: darken;
                 * text-shadow: 0 0 5px #fff;
                 */
            }
            `;
    }

    __GET_UPDATE_NFO__: {
        // Getting the version information
        setTimeout(() => {
            let FETCHED_DATA = { wasFetched: false };

            (async function(installedFromWebstore) {
                let properties = {
                    origin: {
                        github: !installedFromWebstore,
                        chrome: installedFromWebstore,
                    },
                    version: {
                        installed: Manifest.version,
                        github: '5.6',
                        chrome: '5.6',
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

                                if((!installedFromWebstore && githubUpdateAvailable) || (installedFromWebstore && chromeUpdateAvailable))
                                    confirm
                                        .timed(`There is an update available for ${ Manifest.name } (${ properties.version.installed } &rarr; ${ properties.version.github })`)
                                        .then(ok => {
                                            if(nullish(ok))
                                                return;

                                            if(ok)
                                                open([
                                                    'https://github.com/Ephellon/Twitch-Tools/releases',
                                                    'https://chrome.google.com/webstore/detail/ttv-tools/fcfodihfdbiiogppbnhabkigcdhkhdjd',
                                                ][+installedFromWebstore], '_blank');
                                        });
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
                });
            })(parseURL(Runtime.getURL('profile.png')).host === "fcfodihfdbiiogppbnhabkigcdhkhdjd");
        }, 3_600_000);
    }

    // End of Initialize
};
// End of Initialize

let CUSTOM_CSS,
    PAGE_CHECKER,
    WAIT_FOR_PAGE;

Runtime.sendMessage({ action: 'GET_VERSION' }, async({ version = null }) => {
    let isProperRuntime = Manifest.version == version;

    PAGE_CHECKER = !isProperRuntime?
        ERROR(`The current runtime (v${ Manifest.version }) is not correct (${ version })`)
            ?.toNativeStack?.():
    setInterval(WAIT_FOR_PAGE = async() => {
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
            let [documentLanguage] = (document.documentElement?.lang ?? window.navigator?.userLanguage ?? window.navigator?.language ?? 'en').toLowerCase().split('-');

            window.LANGUAGE = LANGUAGE = Settings.user_language_preference || documentLanguage;

            // Give the storage 1s to perform any "catch-up"
            setTimeout(async() => {
                await Initialize(ready)
                    .then(() => {
                        // TTV Tools has the max Timer amount to initilize correctly...
                        let REINIT_JOBS =
                        setTimeout(() => {
                            let NOT_LOADED_CORRECTLY = [],
                                ALL_LOADED_CORRECTLY = (true
                                    // Lurking
                                    &&  parseBool(
                                            parseBool(Settings.away_mode)?
                                                (false
                                                    || defined($('#away-mode'))
                                                    || !NOT_LOADED_CORRECTLY.push('away_mode')
                                                ):
                                            true
                                        )
                                    // Auto-Claim Bonuses
                                    && parseBool(
                                            parseBool(Settings.auto_claim_bonuses)?
                                                (false
                                                    || defined($('#tt-auto-claim-bonuses'))
                                                    || nullish($('[data-test-selector="balance-string"i]'))
                                                    || parseBool(Settings.view_mode)
                                                    || STREAMER.veto
                                                    || !NOT_LOADED_CORRECTLY.push('auto_claim_bonuses')
                                                ):
                                            true
                                        )
                                    // Up Next
                                    &&  parseBool(
                                            !parseBool(Settings.first_in_line_none)?
                                                (false
                                                    || defined($('[up-next--container]'))
                                                    || !NOT_LOADED_CORRECTLY.push('first_in_line')
                                                ):
                                            true
                                        )
                                    // Watch Time
                                    &&  parseBool(
                                            parseBool(Settings.watch_time_placement)?
                                                (false
                                                    || defined($('#tt-watch-time'))
                                                    || !NOT_LOADED_CORRECTLY.push('watch_time_placement')
                                                ):
                                            true
                                        )
                                    // Channel Points Receipt
                                    &&  parseBool(
                                            parseBool(Settings.points_receipt_placement)?
                                                (false
                                                    || defined($('#tt-points-receipt'))
                                                    || !NOT_LOADED_CORRECTLY.push('points_receipt_placement')
                                                ):
                                            true
                                        )
                                );

                            if(false
                                // This page shouldn't be touched...
                                || RESERVED_TWITCH_PATHNAMES.test(window.location.pathname)

                                // Everything loaded just fine
                                || ALL_LOADED_CORRECTLY
                            )
                                return clearInterval(REINIT_JOBS);

                            WARN(`The following did not activate properly: ${ NOT_LOADED_CORRECTLY }. Reloading...`);

                            if(parseBool(Settings.recover_pages))
                                return location.reload();
                            else
                                for(let job of NOT_LOADED_CORRECTLY)
                                    RestartJob(job, 'failure_to_activate');

                            // Failed to activate job at...
                            // PushToTopSearch({ 'tt-err-job': (+new Date).toString(36) });
                        }, Math.max(...Object.values(Timers)));
                    });
            }, 1000);
            clearInterval(PAGE_CHECKER);

            window.MAIN_CONTROLLER_READY = true;

            // Observe location changes
            LocationObserver: {
                let { body } = document,
                    observer = new MutationObserver(mutations => {
                        mutations.map(mutation => {
                            if(PATHNAME !== window.location.pathname) {
                                let OLD_HREF = PATHNAME;

                                PATHNAME = window.location.pathname;

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

                                let handle = $('.chat-line__username', true, line).map(element => element.textContent).toString()
                                    author = handle.toLowerCase().replace(/[^]+?\((\w+)\)/, '$1'),
                                    message = $('[data-test-selector="chat-message-separator"i] ~ * > *', true, line),
                                    mentions = $('.mention-fragment', true, line).map(element => element.textContent.replace('@', '').toLowerCase()).filter(text => /^[a-z_]\w+$/i.test(text)),
                                    badges = $('.chat-badge', true, line).map(img => img.alt.toLowerCase()),
                                    style = $('.chat-line__username [style]', true, line).map(element => element.getAttribute('style')).join(';'),
                                    reply = $('button[data-test-selector="chat-reply-button"i]', false, line);

                                let raw = line.textContent?.trim(),
                                    containedEmotes = [];

                                message = message
                                    .map(element => {
                                        let string;

                                        if(keepEmotes && ((element.dataset.testSelector == 'emote-button') || element.dataset.ttEmote?.length)) {
                                            let img = $('img', false, element);

                                            if(defined(img))
                                                containedEmotes.push(string = `:${ (i=>((emotes[i.alt]=i.src),i.alt))(img) }:`);
                                        } else {
                                            string = element.textContent;
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

                if(nullish(chat))
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

                                        let handle = $('[data-a-target="whisper-message-name"i]', false, node).textContent,
                                            author = handle.toLowerCase().replace(/[^]+?\((\w+)\)/, '$1'),
                                            message = $('[data-test-selector="separator"i] ~ * > *', true, node),
                                            style = node.getAttribute('style');

                                        let raw = node.textContent;

                                        message = message
                                            .map(element => {
                                                let string;

                                                switch(element.dataset.aTarget) {
                                                    case 'emote-name': {
                                                        if(keepEmotes)
                                                            string = `:${ (i=>((emotes[i.alt]=i.src),i.alt))($('img', false, element)) }:`;
                                                    } break;

                                                    default: {
                                                        string = element.textContent;
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

                                let unread = parseInt(node.textContent) | 0;

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
                $('[data-a-target^="player-volume"i]')?.addEventListener('mousedown', ({ currentTarget, button = -1 }) => {
                    !button && $('[isTrusted], [style]', false, currentTarget.nextElementSibling)?.setAttribute('isTrusted', true);
                });

                $('[data-a-target^="player-volume"i]')?.addEventListener('mouseup', ({ currentTarget, button = -1 }) => {
                    !button && $('[isTrusted], [style]', false, currentTarget.nextElementSibling)?.setAttribute('isTrusted', false);
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

                if(nullish(target))
                    break VolumeObserver;

                observer.observe(target, { attributes: true, childList: false, subtree: false });
            }

            // Set the SVGs' section IDs
            SectionLabeling: {
                let conversions = {
                    favorite: [
                        "followed",
                    ].reverse(),

                    video: [
                        "suggested",
                        "related",
                    ].reverse(),

                    people: [
                        "friends",
                        "watch-channel-trailer",
                    ].reverse(),

                    inform: [
                        "live-reminders",
                    ].reverse(),

                    checkmark: [
                        "live-reminders",
                    ].reverse(),

                    rewind: [
                        "rewind-stream",
                    ].reverse(),

                    crown: [
                        "prime-subscription",
                    ],
                };

                for(let container of $('#sideNav .side-nav-section[aria-label], .about-section__actions > * > *, [data-target^="channel-header"i] button', true)) {
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

                                    if(matchPercentage < 80 || container.getAttribute('tt-svg-label')?.length)
                                        return;

                                    // LOG(`Labeling section "${ glyph }" (${ matchPercentage }% match)...`, container);

                                    let family = conversions[glyph];

                                    if(family?.length)
                                        container.setAttribute('tt-svg-label', family.pop());
                                });
                }
            }

            top.onlocationchange = () => {
                WARN("[Parent] Re-initializing...");

                Balloon.get('Up Next')?.remove();

                // Do NOT soft-reset ("turn off, turn on") these settings
                // They will be destroyed, including any data they are using
                let VOLATILE = window.VOLATILE = ['first_in_line*'].map(AsteriskFn);

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

                let [accent, complement] = (Settings.accent_color ?? 'blue/12').split('/');

                CUSTOM_CSS.innerHTML =
                `
                :root {
                    --user-accent-color: var(--color-${ accent });
                    --user-complement-color: var(--color-${ accent }-${ complement });

                    /* z-index meanings */
                    --always-on-top:    9999;
                    --normal:           999;
                    --always-on-bottom: 99;
                    --baseline:         9;
                }

                /* Little fixes */
                .social-media-link {
                    min-width: 20rem;
                }

                /* First Run */
                .tt-first-run {
                    background-color: var(--color-blue);
                    border-radius: 3px;

                    transition: background-color 1s;
                }

                [animationID] a { cursor: grab }
                [animationID] a:active { cursor: grabbing }

                [class*="theme"i][class*="dark"i] [tt-light="true"i], [class*="theme"i][class*="dark"i] [class*="chat"i][class*="status"i] { background-color: var(--color-opac-w-4) !important }
                [class*="theme"i][class*="light"i] [tt-light="true"i], [class*="theme"i][class*="light"i] [class*="chat"i][class*="status"i] { background-color: var(--color-opac-b-4) !important }

                /* Keyborad Shortcuts */
                .tt-extra-keyboard-shortcuts td {
                    padding: 0.5rem;
                }

                .tt-extra-keyboard-shortcuts td:first-child {
                    text-align: left;
                }

                .tt-extra-keyboard-shortcuts td:last-child {
                    text-align: right;
                }

                /* Up Next */
                [up-next--body] {
                    background-color: var(--user-accent-color);
                    border-radius: 0.5rem;
                    color: var(--color-hinted-grey-${ complement });
                }

                [up-next--body][empty="true"i] {
                    background-image: url("${ Runtime.getURL('up-next-tutorial.png') }");
                    background-repeat: no-repeat;
                    background-size: 35rem;
                    background-position: bottom center;
                }

                [class*="theme"i][class*="dark"i] [up-next--body][empty="true"i]:is([tt-mix-blend$="complement"i]) {
                    background-blend-mode: lighten;
                }

                [class*="theme"i][class*="light"i] [up-next--body][empty="true"i]:is([tt-mix-blend$="complement"i]) {
                    background-blend-mode: darken;
                }

                [up-next--body][allowed="false"i] {
                    background-image: url("${ Runtime.getURL('256.png') }") !important;
                    background-repeat: repeat !important;
                    background-size: 5rem !important;
                    background-position: center center !important;
                    background-blend-mode: soft-light !important;
                }

                #up-next-boost[speeding="true"i] {
                    animation: fade-in 1s alternate infinite;
                }

                /* Live Reminders */
                #tt-reminder-listing:not(:empty) ~ [live] { display:none }

                .tt-time-elapsed {
                    color: var(--color-text-live);

                    float: right;
                }

                /** Old CSS...
                #tt-reminder-listing:not(:empty)::before, #tt-reminder-listing:not(:empty)::after {
                    animation: fade-in 1s 1;

                    display: block;
                    text-align: center;

                    margin: 0.5em 0px;

                    width: 100%;
                }

                #tt-reminder-listing:not(:empty)::before { content: "Live Reminders" }
                #tt-reminder-listing:not(:empty)::after { content: "Up Next" }
                */

                /* Auto-Focus */
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

                [class*="theme"i][class*="dark"i] [tt-in-up-next="true"i] { border: 1px solid var(--channel-color-light) !important }
                [class*="theme"i][class*="dark"i] [role="dialog"i] [tt-earned-all="true"i] { text-decoration: underline 2px var(--channel-color-light) }
                [class*="theme"i][class*="dark"i] [data-test-selector="balance-string"i][tt-earned-all="true"i] { text-decoration: underline 3px var(--channel-color-light) }

                [class*="theme"i][class*="light"i] [tt-in-up-next="true"i] { border: 1px solid var(--channel-color-dark) !important }
                [class*="theme"i][class*="light"i] [role="dialog"i] [tt-earned-all="true"i] { text-decoration: underline 2px var(--channel-color-dark) }
                [class*="theme"i][class*="light"i] [data-test-selector="balance-string"i][tt-earned-all="true"i] { text-decoration: underline 3px var(--channel-color-dark) }

                /* Change Up Next font color */
                [class*="theme"i][class*="dark"i] [tt-mix-blend$="complement"i] { /* mix-blend-mode:lighten */ }
                [class*="theme"i][class*="light"i] [tt-mix-blend$="complement"i] { /* mix-blend-mode:darken */ }

                /* Lurking */
                #away-mode svg[id^="tt-away-mode"i] {
                    display: inline-block;

                    transform: translateX(0px) scale(1);
                    transition: all 100ms ease-in;
                }

                #tt-away-mode--hide {
                    position: absolute;
                }

                #tt-away-mode--hide, #tt-away-mode--show {
                    fill: var(--color-text-base);
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

                [role="tooltip"i][class*="tt-tooltip"i] {
                    white-space: normal;

                    max-width: 50em;
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
                    z-index: 999;

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
                    z-index: 999;

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
                        // Detect the user's desired language
                            // Capitalizing the language code notifies the Settings page the code was not manually input
                        let [user_language_preference] = (document.documentElement?.lang ?? window.navigator?.userLanguage ?? window.navigator?.language ?? 'en').toUpperCase().split('-');

                        Storage.set({ user_language_preference });

                        // Point out the newly added buttons
                        setTimeout(() => {
                            for(let element of $('#tt-auto-claim-bonuses, [up-next--container]', true))
                                element.classList.add('tt-first-run');

                            let style = new CSSObject({ verticalAlign: 'bottom', height: '20px', width: '20px' });

                            // Make sure the user goes to the Settings page
                            alert
                                .timed(`Please visit the <a href="#" onmouseup="top.postMessage({action:'open-options-page'})">Settings</a> page or click the ${ Glyphs.modify('channelpoints', { style, ...style.toObject() }) } to finalize setup`, 30_000, true)
                                .then(action => $('.tt-first-run', true).forEach(element => element.classList.remove('tt-first-run')));
                        }, 10_000);
                    } break;
                }

                Storage.set({ onInstalledReason: null });
            }

            // Jump some frames
            FrameJumper: {
                document.head.append(
                    furnish('script', { src: Runtime.getURL('ext/jump.js'), onload() {/* Do something when the data is jumped... */} })
                );
            }
        }
    }, 500);
});
