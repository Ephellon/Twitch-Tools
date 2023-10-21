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

/**
 * @file Defines the page-specific logic for the extension. Used for all {@link # twitch.tv/*} sites.
 * <style>[\.pill]{font-weight:bold;white-space:nowrap;border-radius:1rem;padding:.25rem .75rem}[\.good]{background:#e8f0fe66;color:#174ea6}[\.bad]{background:#fce8e666;color:#9f0e0e;}</style>
 * @author Ephellon Grey (GitHub {@link https://github.io/ephellon @ephellon})
 * @module
 */

;

let Queue = top.Queue = { balloons: [], bullets: [], bttv_emotes: [], emotes: [], messages: [], message_popups: [], popups: [] },
    Messages = top.Messages = new Map(),
    PostOffice = top.PostOffice = new Map(),
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
    SPECIAL_MODE = $.defined('[data-test-selector="exit-button"i]'),
    NORMAL_MODE = !SPECIAL_MODE,
    // Hmm...
    JUMPED_FRAMES = false,
    JUMP_DATA = {};

top.WINDOW_STATE = document.readyState;

Cache.large.load('JumpedData', ({ JumpedData }) => Object.assign(JUMP_DATA, JumpedData ?? {}));

// Populate the username field by quickly showing the menu
when.defined(() => UserMenuToggleButton ??= $('[data-a-target="user-menu-toggle"i]'))
    .then(() => {
        UserMenuToggleButton.click();
        ACTIVITY = window.ACTIVITY = $('[data-a-target="presence-text"i]')?.textContent ?? '';
        USERNAME = window.USERNAME = $('[data-a-target="user-display-name"i]')?.textContent ?? `User_Not_Logged_In_${ +new Date }`;
        THEME = window.THEME = [...$('html').classList].find(c => /theme-(\w+)/i.test(c)).replace(/[^]*theme-(\w+)/i, '$1').toLowerCase();
        ANTITHEME = window.ANTITHEME = ['light', 'dark'].filter(theme => theme != THEME).pop();

        $('[data-a-target^="language"i]')?.click();
        LITERATURE = window.LITERATURE = $('[data-language] svg')?.closest('button')?.dataset?.language ?? '';
        UserMenuToggleButton.click();
    });

top.onpagehide = ({ persisted }) => {
    top.WINDOW_STATE = (persisted? document.readyState: 'unloading');
};

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

;

// Displays a balloon (popup)
    // new Balloon({ title:string, icon:string? }, ...jobs:object<{ href:string<URL>, message:string?, src:string?, time:string<Date>, onremove:function? }>) → object
    // Balloon.prototype.add(...jobs:object<{ href:string<URL>, message:string?, src:string?, time:string<Date>, onremove:function? }>) → Element
    // Balloon.prototype.addButton({ left:boolean?, icon:string?<Glyphs>, onclick:function?, attributes:object? }) → Element
    // Balloon.prototype.remove() → undefined
class Balloon {
    static #BALLOONS = new Map()

    constructor({ title, icon = 'play', iconAttr = {} }, ...jobs) {
        let f = furnish;

        let [L_pane, C_pane, R_pane] = $.all('.top-nav__menu > div'),
            X = $('#tt-balloon', R_pane),
            I = Runtime.getURL('profile.png'),
            F, C, H, U, N;

        let uuid = U = UUID.from([title, JSON.stringify(jobs)].join(':')).value,
            existing = Balloon.#BALLOONS.get(title);

        if(defined(existing))
            return existing;

        if(defined(X)) {
            if(Queue.balloons.map(balloon => balloon.uuid).missing(uuid)) {
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
        f('.tt-align-self-center.tt-flex-grow-0.tt-flex-nowrap.tt-flex-shrink-0.tt-mg-x-05', { style: `animation:1s fade-in 1;` },
            f.div(
                f('.tt-relative').with(
                    // Navigation Icon
                    N = f(`div[@testSelector=toggle-balloon-wrapper__mouse-enter-detector]`,
                        {
                            style: 'display:inherit',
                        },
                        f('.tt-inline-flex.tt-relative').with(
                            f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative',
                                {
                                    'connected-to': U,

                                    onclick: event => {
                                        let { currentTarget } = event,
                                            connectedTo = currentTarget.getAttribute('connected-to');

                                        let balloon = $(`#tt-balloon-${ connectedTo }`);

                                        if(nullish(balloon))
                                            return;

                                        let display = balloon.getAttribute('display').equals('block')? 'none': 'block';

                                        balloon.setAttribute('style', `display:${ display }!important; z-index:9; left: -15rem`);
                                        balloon.setAttribute('display', display);
                                    },
                                },

                                f('div',
                                    {
                                        style: 'height:2rem; width:2rem',
                                        innerHTML: Glyphs.modify(icon, iconAttr),
                                    }
                                ),

                                // Notification counter
                                F = f(`#tt-notification-counter--${ U }.tt-absolute.tt-right-0.tt-top-0`, { style: 'visibility:hidden', 'connected-to': U, length: 0 },
                                    f('.tt-animation.tt-animation--animate.tt-animation--bounce-in.tt-animation--duration-medium.tt-animation--fill-mode-both.tt-animation--timing-ease-in[@aTarget=tt-animation-target]').with(
                                        f('.tt-c-background-base.tt-inline-flex.tt-number-badge.tt-relative').with(
                                            f(`#tt-notification-counter-output--${ U }.tt-number-badge__badge.tt-relative`, {
                                                'interval-id': setInterval(() => {
                                                    let counter = $(`#tt-notification-counter--${ uuid }`),
                                                        output = $(`#tt-notification-counter-output--${ uuid }`),
                                                        length = parseInt(counter?.getAttribute('length'));

                                                    if(nullish(counter) || nullish(output))
                                                        return;

                                                    let visibility = counter.getAttribute('style').replace(/[^]+:/, ''),
                                                        interval = parseInt(output.getAttribute('interval-id'));

                                                    output.textContent = length;

                                                    if(isNaN(length) || length > 0) {
                                                        counter.modStyle(`visibility:unset; font-size:75%`);
                                                    } else {
                                                        counter.modStyle(`visibility:hidden`);
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
                    f(`#tt-balloon-${ U }.tt-absolute.tt-balloon.tt-balloon--down.tt-balloon--right.tt-balloon-lg.tt-block`,
                        {
                            style: 'display:none!important',
                            display: 'none',
                            role: 'dialog',
                        },
                        f('.tt-border-radius-large.tt-c-background-base.tt-c-text-inherit.tt-elevation-4').with(
                            (C = f(`#tt-balloon-container-${ U }.tt-flex.tt-flex-column`,
                                {
                                    'tt-mix-blend': (Settings?.accent_color ?? 'twitch-purple/12'),

                                    style: 'min-height:22rem; max-height: 90vh; min-width:40rem; overflow-y: auto;',
                                    role: 'dialog',
                                },
                                // Header
                                f('.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-c-text-base.tt-elevation-1.tt-flex.tt-flex-shrink-0.tt-pd-x-1.tt-pd-y-05.tt-popover-header', { style: `background-color:inherit; position:sticky; top:0; z-index:99999;` },
                                    f('.tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-justify-content-center').with(
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

                                                let display = balloon.getAttribute('display').equals('block')? 'none': 'block';

                                                balloon.setAttribute('style', `display:${ display }!important`);
                                                balloon.setAttribute('display', display);
                                            },
                                        },
                                    )
                                ),
                                // Body
                                ...jobs.map((job, index) => {
                                    let { href, message, subheader, src = I, attributes = {}, onremove = ($=>$), animate = ($=>$) } = job,
                                        guid = UUID.from([href, message].join(':')).value;

                                    let container = f(`#tt-balloon-job-${ U }--${ guid }`, { ...attributes, uuid, guid, href: parseURL(href).href },
                                        f('.simplebar-scroll-content',
                                            {
                                                style: 'overflow: hidden;',
                                            },
                                            f('.simplebar-content',
                                                {
                                                    style: 'overflow: hidden; width:100%;',
                                                },
                                                f('.tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-overflow-hidden[@testSelector=center-window__content]').with(
                                                    f('.persistent-notification.tt-relative[@testSelector=persistent-notification]',
                                                        {
                                                            style: 'width:100%',
                                                        },
                                                        f('.persistent-notification__unread.tt-border-b.tt-flex.tt-flex-nowrap').with(
                                                            f('a.tt-block.tt-full-width.tt-interactable.tt-interactable--alpha.tt-interactable--hover-enabled.tt-interactive[@testSelector=persistent-notification__click]',
                                                                {
                                                                    'connected-to': `${ U }--${ guid }`,
                                                                    // Sometimes, Twitch likes to default to `_blank`
                                                                    'target': '_self',

                                                                    href,

                                                                    onclick: event => {
                                                                        let { currentTarget } = event,
                                                                            connectedTo = currentTarget.getAttribute('connected-to');

                                                                        let element = $(`#tt-balloon-job-${ connectedTo }`);

                                                                        if(defined(element)) {
                                                                            onremove({
                                                                                ...event,
                                                                                uuid, guid, href, element,
                                                                                canceled: false,

                                                                                callback(element) {
                                                                                    clearInterval(+element.getAttribute('animationID'));
                                                                                    element.remove();
                                                                                },
                                                                            });
                                                                        }
                                                                    },
                                                                },
                                                                f('.persistent-notification__area.tt-flex.tt-flex-nowrap.tt-pd-b-1.tt-pd-l-1.tt-pd-r-3.tt-pd-t-1').with(
                                                                    // Avatar
                                                                    f.div(
                                                                        f('.tt-border-radius-rounded.tt-card-img.tt-card-img--size-4.tt-flex-shrink-0.tt-overflow-hidden').with(
                                                                            f('.tt-aspect.tt-aspect--align-top').with(
                                                                                f('img.tt-balloon-avatar.tt-image', { src })
                                                                            )
                                                                        )
                                                                    ),
                                                                    // Message body
                                                                    f('.tt-flex.tt-flex-column.tt-flex-nowrap.tt-mg-x-1').with(
                                                                        f('.persistent-notification__body.tt-overflow-hidden[@testSelector=persistent-notification__body]').with(
                                                                            f('span.tt-c-text-alt').with(
                                                                                f('p.tt-balloon-message').html(message)
                                                                            )
                                                                        ),
                                                                        // Subheader
                                                                        f('.tt-align-items-center.tt-flex.tt-flex-shrink-0.tt-mg-t-05').with(
                                                                            f('.tt-mg-l-05').with(
                                                                                f('span.tt-balloon-subheader.tt-c-text-alt').html(subheader)
                                                                            )
                                                                        ),
                                                                        f('div').html(Glyphs.modify('navigation', { height: '20px', width: '20px', style: 'position:absolute; right:0; top:40%;' }))
                                                                    )
                                                                )
                                                            ),
                                                            // Repeat mini-button
                                                            // f('.persistent-notification__delete.tt-absolute', { style: `top:0; right:2rem; z-index:var(--always-on-top)` },
                                                            //     f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                                            //         f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__delete]',
                                                            //             {
                                                            //                 'connected-to': `${ U }--${ guid }`,
                                                            //
                                                            //                 onclick: event => {
                                                            //                     let { currentTarget } = event,
                                                            //                         connectedTo = currentTarget.getAttribute('connected-to');
                                                            //
                                                            //                     let element = $(`#tt-balloon-job-${ connectedTo }`),
                                                            //                         thisJob = $('a', element),
                                                            //                         repeat = parseBool(parseURL(thisJob.href).searchParameters?.redo);
                                                            //
                                                            //                     thisJob.setAttribute('new-href', parseURL(thisJob.href).addSearch({ redo: !repeat }, true).href);
                                                            //                 },
                                                            //             },
                                                            //             f('span.tt-button-icon__icon').with(
                                                            //                 f('div',
                                                            //                     {
                                                            //                         style: 'height:1.6rem; width:1.6rem',
                                                            //                         innerHTML: Glyphs.refresh,
                                                            //                     },
                                                            //                 )
                                                            //             )
                                                            //         )
                                                            //     )
                                                            // ),
                                                            // Delete mini-button
                                                            f('.persistent-notification__delete.tt-absolute', { style: `top:0; right:0; z-index:var(--always-on-top)` },
                                                                f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                                                    f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__delete]',
                                                                        {
                                                                            'connected-to': `${ U }--${ guid }`,

                                                                            onclick: event => {
                                                                                let { currentTarget } = event,
                                                                                    connectedTo = currentTarget.getAttribute('connected-to');

                                                                                let element = $(`#tt-balloon-job-${ connectedTo }`);

                                                                                if(defined(element)) {
                                                                                    onremove({
                                                                                        ...event,
                                                                                        uuid, guid, href, element,
                                                                                        canceled: true,

                                                                                        callback(element) {
                                                                                            clearInterval(+element.getAttribute('animationID'));
                                                                                            element.remove();
                                                                                        },
                                                                                    });
                                                                                }
                                                                            },
                                                                        },
                                                                        f('span.tt-button-icon__icon').with(
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

        R_pane.insertBefore(p, R_pane.children[1]);

        this.body = C;
        this.icon = N;
        this.uuid = U;
        this.header = H;
        this.parent = R_pane;
        this.counter = F;
        this.container = p;

        let cssName = title.replace(/\s+/g, '-').toLowerCase();

        for(let key of 'body icon header parent container'.split(' '))
            this[key].setAttribute(`${ cssName }--${ key }`, (+new Date).toString(36));

        this.tooltip ??= f('.tt-tooltip.tt-tooltip--align-center.tt-tooltip--down', { id: `balloon-tooltip-for-${ U }`, role: 'tooltip' }, this.title = title);

        Balloon.#BALLOONS.set(title, this);

        return this;
    }

    addButton({ left = false, icon = 'play', onclick = ($=>$), attributes = {} }) {
        let parent = this.header.closest('div[class*="header"i]');
        let uuid = UUID.from(onclick.toString()).value,
            existing = $(`[uuid="${ uuid }"i]`, parent);

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
        jobs = jobs.map((job, index) => {
            let { href, message, subheader, src = Runtime.getURL('profile.png'), attributes = {}, onremove = ($=>$), animate = ($=>$) } = job,
                { uuid } = this,
                guid = UUID.from(href).value,
                f = furnish;

            let existing = $(`#tt-balloon-job-${ uuid }--${ guid }`);

            if(defined(existing))
                return existing;

            ++this.length;

            let container = f(`#tt-balloon-job-${ uuid }--${ guid }`, { ...attributes, uuid, guid, href: parseURL(href).href },
                f('.simplebar-scroll-content',
                    {
                        style: 'overflow: hidden;',
                    },
                    f('.simplebar-content',
                        {
                            style: 'overflow: hidden; width:100%;',
                        },
                        f('.tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-overflow-hidden[@testSelector=center-window__content]').with(
                            f('.persistent-notification.tt-relative[@testSelector=persistent-notification]',
                                {
                                    style: 'width:100%',
                                },
                                f('.persistent-notification__unread.tt-border-b.tt-flex.tt-flex-nowrap').with(
                                    f('a.tt-block.tt-full-width.tt-interactable.tt-interactable--alpha.tt-interactable--hover-enabled.tt-interactive[@testSelector=persistent-notification__click]',
                                        {
                                            'connected-to': `${ uuid }--${ guid }`,

                                            href,

                                            onclick: event => {
                                                let { currentTarget } = event,
                                                    connectedTo = currentTarget.getAttribute('connected-to');

                                                let element = $(`#tt-balloon-job-${ connectedTo }`);

                                                if(defined(element)) {
                                                    onremove({
                                                        ...event,
                                                        uuid, guid, href, element,
                                                        canceled: false,

                                                        callback(element) {
                                                            clearInterval(+element.getAttribute('animationID'));
                                                            element.remove();
                                                        },
                                                    });
                                                }
                                            },
                                        },
                                        f('.persistent-notification__area.tt-flex.tt-flex-nowrap.tt-pd-b-1.tt-pd-l-1.tt-pd-r-3.tt-pd-t-1').with(
                                            // Avatar
                                            f.div(
                                                f('.tt-border-radius-rounded.tt-card-img.tt-card-img--size-4.tt-flex-shrink-0.tt-overflow-hidden').with(
                                                    f('.tt-aspect.tt-aspect--align-top').with(
                                                        f('img.tt-balloon-avatar.tt-image', { src })
                                                    )
                                                )
                                            ),
                                            // Message body
                                            f('.tt-flex.tt-flex-column.tt-flex-nowrap.tt-mg-x-1').with(
                                                f('.persistent-notification__body.tt-overflow-hidden[@testSelector=persistent-notification__body]').with(
                                                    f('span.tt-c-text-alt').with(
                                                        f('p.tt-balloon-message').html(message)
                                                    )
                                                ),
                                                // Subheader
                                                f('.tt-align-items-center.tt-flex.tt-flex-shrink-0.tt-mg-t-05').with(
                                                    f('.tt-mg-l-05').with(
                                                        f('span.tt-balloon-subheader.tt-c-text-alt').html(subheader)
                                                    )
                                                ),
                                                f('div').html(Glyphs.modify('navigation', { height: '20px', width: '20px', style: 'position:absolute; right:0; top:40%;' }))
                                            )
                                        )
                                    ),
                                    // Repeat mini-button
                                    // f('.persistent-notification__delete.tt-absolute', { style: `top:0; right:2rem; z-index:var(--always-on-top)` },
                                    //     f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                    //         f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__delete]',
                                    //             {
                                    //                 'connected-to': `${ uuid }--${ guid }`,
                                    //
                                    //                 onclick: event => {
                                    //                     let { currentTarget } = event,
                                    //                         connectedTo = currentTarget.getAttribute('connected-to');
                                    //
                                    //                     let element = $(`#tt-balloon-job-${ connectedTo }`),
                                    //                         thisJob = $('a', element),
                                    //                         repeat = parseBool(parseURL(thisJob.href).searchParameters?.redo);
                                    //
                                    //                     thisJob.setAttribute('new-href', parseURL(thisJob.href).addSearch({ redo: !repeat }, true).href);
                                    //                 },
                                    //             },
                                    //             f('span.tt-button-icon__icon').with(
                                    //                 f('div',
                                    //                     {
                                    //                         style: 'height:1.6rem; width:1.6rem',
                                    //                         innerHTML: Glyphs.refresh,
                                    //                     },
                                    //                 )
                                    //             )
                                    //         )
                                    //     )
                                    // ),
                                    // Remove mini-button
                                    f('.persistent-notification__delete.tt-absolute', { style: `top:0; right:0; z-index:var(--always-on-top)` },
                                        f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                            f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__delete]',
                                                {
                                                    'connected-to': `${ uuid }--${ guid }`,

                                                    onclick: event => {
                                                        let { currentTarget } = event,
                                                            connectedTo = currentTarget.getAttribute('connected-to');

                                                        let element = $(`#tt-balloon-job-${ connectedTo }`);

                                                        if(defined(element)) {
                                                            onremove({
                                                                ...event,
                                                                uuid, guid, href, element,
                                                                canceled: true,

                                                                callback(element) {
                                                                    clearInterval(+element.getAttribute('animationID'));
                                                                    element.remove();
                                                                },
                                                            });
                                                        }
                                                    },
                                                },
                                                f('span.tt-button-icon__icon').with(
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

// Creates a Twitch-style chat footer
    // new ChatFooter(title:string, options:object?) → Element<ChatFooter>
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
            f('#tt-chat-footer.tt-absolute.tt-border-radius-medium.tt-bottom-0.tt-mg-b-1',
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

                f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-core-button.tt-core-button--overlay.tt-core-button--text.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative', { style: 'padding: 0.5rem 1rem;', ...options },
                    f('.tt-align-items-center.tt-core-button-label.tt-flex.tt-flex-grow-0').with(
                        f('.tt-flex-grow-0', {
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
    // new Card({ title:string, subtitle:string?, fineTuning:object? }) → Element<Card>
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

            if(parseFloat(value) >= -Infinity)
                unit ??= "px";
            else
                unit ??= "";

            styling.push(`${ key }:${ value }${ unit }`);
        }

        styling = styling.join(';');

        let f = furnish;

        let container = $('[data-a-target*="card"i] [class*="card-layer"i]'),
            card = f(`.tt-absolute.tt-border-radius-large.viewer-card-layer__draggable[@aTarget=viewer-card-positioner]`, { style: styling }),
            uuid = UUID.from([title, subtitle].join('\n')).value;

        icon ??= { src: Runtime.getURL('profile.png'), alt: 'Profile' };

        card.id = uuid;

        // Remove current cards. Only one allowed at a time
        [...container.children].forEach(child => child.remove());

        // Furnish the card
        let iconElement = f('img.emote-card__big-emote.tt-image[@testSelector=big-emote]', { ...icon });

        card.append(
            f('.emote-card.tt-border-b.tt-border-l.tt-border-r.tt-border-radius-large.tt-border-t.tt-elevation-1[data-a-target="emote-card"]', { style: 'animation:1 fade-in .6s' },
                f('.emote-card__banner.tt-align-center.tt-align-items-center.tt-c-background-alt.tt-flex.tt-flex-grow-2.tt-flex-row.tt-full-width.tt-justify-content-start.tt-pd-l-1.tt-pd-y-1.tt-relative').with(
                    f('.tt-inline-flex.viewer-card-drag-cancel').with(
                        f('.tt-inline.tt-relative.tt-tooltip__container[@aTarget=emote-name]').with(iconElement)
                    ),
                    f('.emote-card__display-name.tt-align-items-center.tt-align-left.tt-ellipsis.tt-mg-1').with(
                        f('h4.tt-c-text-base.tt-ellipsis.tt-strong[@testSelector=emote-code-header]').with(title),
                        f('p.tt-c-text-alt-2.tt-ellipsis.tt-font-size-6[@testSelector=emote-type-copy]').with(subtitle)
                    )
                )
            ),
            f('.tt-absolute.tt-mg-r-05.tt-mg-t-05.tt-right-0.tt-top-0[@aTarget=viewer-card-close-button]',
                {
                    onmouseup: ({ button = -1 }) => {
                        !button && $.all('[data-a-target*="card"i] [class*="card-layer"] > *').forEach(node => node.remove());
                    },
                },
                f('.tt-inline-flex.viewer-card-drag-cancel').with(
                    f('button.tt-button-icon.tt-button-icon--secondary.tt-core-button[@testSelector=close-viewer-card]', {
                        'aria-label': "Hide",
                    },
                        f('span.tt-button-icon__icon').with(
                            f('div[style="width: 2rem; height: 2rem;"]').with(
                                f('.tt-icon').with(
                                    f('.tt-aspect').html(Glyphs.modify('x', { height: '20px', width: '20px' }).toString())
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
            $('div', card).append(
                // Tiny banner (live status)
                f('.emote-card__content.tt-full-width.tt-inline-flex.tt-pd-1.viewer-card-drag-cancel').with(
                    f.div(
                        f('.tt-align-items-center.tt-align-self-start.tt-mg-b-05').with(
                            f('.tt-align-items-center.tt-flex').with(
                                f('.tt-align-items-center.tt-flex.tt-mg-r-1').with(
                                    f('a.tt-link[rel="noopener noreferrer" target="_blank"]', { href: footer.href },
                                        f('.tt-flex', {
                                            innerHTML: `${
                                                Glyphs.modify('video', { height: '20px', width: '20px' })
                                            }${
                                                f('.tt-mg-l-05').with(
                                                    f('p.tt-c-text-link.tt-font-size-5.tt-strong').with(footer.name)
                                                ).outerHTML
                                            }`
                                        })
                                    )
                                ),
                                f('.tt-align-items-center.tt-flex').with(
                                    f(`div[tt-live-status-indicator="${ parseBool(footer.live) }"]`),
                                    f('.tt-flex.tt-mg-l-05').with(
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
                f('div[@aTestSelector=emote-card-content-description]', { style: 'padding:0 1rem; margin-bottom: 1rem', innerHTML: description })
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

    static deferred = class deferred {
        constructor(fineTuning = {}) {
            fineTuning.top ??= '7rem';
            fineTuning.left ??= '0px';
            fineTuning.cursor ??= 'auto';
            fineTuning.padding ??= '1rem';

            let styling = ['border:var(--border-width-default) solid var(--color-border-base);'];

            for(let key in fineTuning) {
                let [value, unit] = (fineTuning[key] ?? "").toString().split(/([\-\+]?[\d\.]+)([^\d\.]+)/).filter(string => string.length);

                if(nullish(value))
                    continue;

                if(parseFloat(value) >= -Infinity)
                    unit ??= "px";
                else
                    unit ??= "";

                styling.push(`${ key }:${ value }${ unit }`);
            }

            styling = styling.join(';');

            let f = furnish;

            let container = $('[data-a-target*="card"i] [class*="card-layer"i]'),
                card = f(`.tt-absolute.tt-border-radius-large.viewer-card-layer__draggable[@aTarget=viewer-card-positioner]`, { style: styling },
                    f('.tt-absolute.tt-mg-r-05.tt-mg-t-05.tt-right-0.tt-top-0[@aTarget=viewer-card-close-button]',
                        {
                            onmouseup: ({ button = -1 }) => {
                                !button && $.all('[data-a-target*="card"i] [class*="card-layer"] > *').forEach(node => node.remove());
                            },
                        },
                        f('.tt-inline-flex.viewer-card-drag-cancel').with(
                            f('button.tt-button-icon.tt-button-icon--secondary.tt-core-button[@testSelector=close-viewer-card]', {
                                'aria-label': "Hide",
                            },
                                f('span.tt-button-icon__icon').with(
                                    f('div[style="width: 2rem; height: 2rem;"]').with(
                                        f('.tt-icon').with(
                                            f('.tt-aspect').html(Glyphs.modify('x', { height: '20px', width: '20px' }).toString())
                                        )
                                    )
                                )
                            ),
                        )
                    )
                );

            // Remove current cards. Only one allowed at a time
            [...container.children].forEach(child => child.remove());

            // Furnish the card
            card.append(
                f('.tt-spinner')
            );

            // Add the card
            container.append(card);

            let uuid = UUID.from(card.getPath()).value;

            card.id = uuid;
            card.classList.add('tt-c-background-base');

            this.body = card;
            this.uuid = uuid;
            this.container = container;

            return this;
        }

        post(state) {
            this.body.remove();

            return new Card(state);
        }
    }
}

// Creates a Twitch-style context menu
    // new ContextMenu({ options:array, fineTuning:object? }) → Element<ContextMenu>
    // options = { text:string, icon:string, shortcut:string, favicon:string<HTML|SVG> }
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

            if(parseFloat(value) >= -Infinity)
                unit ??= "px";
            else
                unit ??= "";

            styling.push(`${ key }:${ value }${ unit }`);
        }

        styling = styling.join(';');

        let f = furnish;

        let container = $('#root'),
            menu = f(`.tt-context-menu.tt-absolute`, { style: styling }),
            uuid = UUID.from(options.map(Object.values).join('\n')).value;

        menu.id = uuid;

        // Remove current menus. Only one allowed at a time
        $.all('.tt-context-menu').forEach(menu => menu.remove());

        menu.append(
            f('.tt-border-radius-large', { style: 'background:var(--color-background-alt-2); position:absolute; z-index:9999', direction: 'top-right' },
                // The options...
                f('div', { style: 'display:inline-block; min-width:16rem; max-width:48rem; width:max-content', role: 'dialog' },
                    f('div', { style: 'padding:0.25rem;' },
                        ...options.map(({ text = "", icon = "", shortcut = "", favicon = "", action = () => {} }) => {
                            if(icon?.length)
                                icon = f('div', { style: 'display:inline-block; float:left; margin-left:calc(-1rem - 16px); margin-right:1rem', innerHTML: Glyphs.modify(icon, { height: '16px', width: '16px', style: 'vertical-align:-3px' }) });
                            if(text?.length)
                                text = f('.tt-hide-text-overflow').html(text);
                            if(shortcut?.length)
                                shortcut = f.pre(f.code(GetMacro(shortcut)));
                            if(favicon?.length)
                                favicon = f.pre(f.code().html(favicon)).css(`margin-top:-2.5rem; transform:translate(0,25%)`);

                            if(icon || text || shortcut || favicon)
                                return f('button.tt-context-menu-option', { onmouseup: event => action({ ...event, inheritance: inherit }), style: 'border-radius:0.6rem; display:inline-block; padding:0.5rem 0 0.5rem 3rem; width:-webkit-fill-available;width:-moz-available' }, icon, shortcut, text, favicon);
                            return f('hr', { style: 'border-top:1px solid var(--channel-color); margin:0.25rem 0;' });
                        })
                    )
                )
            )
        );

        container.append(menu);

        let offset = getOffset(menu.firstElementChild);

        if(offset.screenOverflow) {
            if(offset.screenOverflowX)
                menu.modStyle(`left:${ getOffset(menu).left + offset.screenCorrectX }px`);
            if(offset.screenOverflowY)
                menu.modStyle(`top:${ getOffset(menu).top + offset.screenCorrectY }px`);
        }
    }
}

// Search Twitch for channels/categories
    // new Search(ID:string|number?, type:string?) → Promise<object>
/** Returns a promised Object →
 * { data:object, extensions:object }
 */
class Search {
    static cookies = {
        ...((cookies = []) => {
            let object = ({});
            for(let cookie of cookies) {
                let [name, value] = cookie.split('=', 2);

                if(/^[\{\[]/.test(value))
                    value = JSON.parse(decodeURIComponent(value));

                object[name.replace(/\W+/g, '_')] = value;
            }

            return object;
        })(document?.cookie?.split(/;\s*/))
    };

    static #cache = new Map;
    static cacheLeaseTime = 300_000 * (parseInt(Settings.low_data_mode) || 1);

    constructor(ID = null, type = 'channel', as = null) {
        let spadeEndpoint = `https://spade.twitch.tv/track`,
            twilightBuildID = '5fc26188-666b-4bf4-bdeb-19bd4a9e13a4';

        let pathname = location.pathname.substr(1),
            options = ({
                method: 'POST',
                headers: {
                    "Accept-Language":  'en-US',
                    "Accept":           '*/*',
                    "Authorization":    Search.authorization,
                    "Client-ID":        Search.clientID,
                    "Content-Type":     `text/plain; charset=UTF-8`,
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
                && player.routes.exact.missing(pathname)
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

        if(type.equals('vod'))
            vodID = ID;

        if(type.equals('channel'))
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
                // https://api.twitch.tv/helix/channels?broadcaster_id=39367256
                // {
                //     "broadcaster_id": "39367256",
                //     "broadcaster_login": "aimzatchu",
                //     "broadcaster_name": "AimzAtchu",
                //     "broadcaster_language": "en",
                //     "game_id": "491487",
                //     "game_name": "Dead by Daylight",
                //     "title": "FriYAYY ❤️",
                //     "delay": 0,
                //     "tags": [
                //         "ClosedCaptions",
                //         "Ally",
                //         "English",
                //         "Interactive",
                //         "fogwhisperer",
                //         "PlayingwithViewers",
                //         "MentalHealth",
                //         "ChronicIllness"
                //     ]
                // }
                return fetchURL.idempotent(`https://api.twitch.tv/helix/channels?broadcaster_id=${ ID }`, { headers: { "Authorization": Search.authorization, "Client-ID": Search.clientID } })
                    .then(response => response.json())
                    .then(json => {
                        let id = parseInt(json?.data?.shift?.()?.broadcaster_id);

                        if(nullish(id))
                            throw `${ json.error }: ${ json.message }`;

                        return id;
                    });
            } break;

            case 'getID': {
                return fetchURL.idempotent(`https://api.twitch.tv/helix/users?login=${ ID }`, { headers: { "Authorization": Search.authorization, "Client-ID": Search.clientID } })
                    .then(response => response.json())
                    .then(json => {
                        let id = parseInt(json?.data?.shift?.()?.id);

                        if(nullish(id))
                            throw `${ json.error }: ${ json.message }`;

                        return id;
                    })
                    .catch(error => {
                        WARN(error);

                        Settings.remove('oauthToken', ReloadPage);
                    });
            } break;

            case 'getName': {
                return fetchURL.idempotent(`https://api.twitch.tv/helix/users?id=${ ID }`, { headers: { "Authorization": Search.authorization, "Client-ID": Search.clientID } })
                    .then(response => response.json())
                    .then(json => {
                        let login = json?.data?.shift?.()?.login;

                        if(nullish(login))
                            throw `${ json.error }: ${ json.message }`;

                        return login;
                    })
                    .catch(error => {
                        WARN(error);

                        Settings.remove('oauthToken', ReloadPage);
                    });
            } break;

            case 'status.live': {
                return fetchURL.idempotent(`/${ ID }`)
                    .then(response => response.text())
                    .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                    .then(DOM => parseBool(
                        /(["']?)isLiveBroadcast\1\s*:\s*(?<status>true|false)\b/
                            .exec(DOM.querySelector('head>script[type^="application"i][type$="json"i]')?.textContent)
                            ?.groups
                            ?.status
                    ));
            } break;

            default: {
                let languages = `bg cs da de el en es es-mx fi fr hu it ja ko nl no pl ro ru sk sv th tr vi zh-cn zh-tw x-default`.split(' ');
                let name = channelName?.toLowerCase();

                if(nullish(name) || type.unlike('channel'))
                    break;

                searchResults = fetchURL.idempotent(`./${ name }`)
                    .then(response => response.text())
                    .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                    .then(async doc => {
                        let alt_languages = $.all('link[rel^="alt"i][hreflang]', doc).map(link => link.hreflang),
                            [data] = JSON.parse($('head>script[type^="application"i][type$="json"i]', doc)?.textContent || "[{}]");

                        let display_name = (data?.name ?? `${ channelName } - Twitch`).split('-').slice(0, -1).join('-').trim(),
                            [language] = languages.filter(lang => alt_languages.missing(lang)),
                            name = display_name?.trim()?.toLowerCase(),
                            profile_image = ($('meta[property$="image"i]', doc)?.content || Runtime.getURL('profile.png')),
                            live = parseBool(data?.publication?.isLiveBroadcast),
                            started_at = new Date(data?.publication?.startDate).toJSON(),
                            status = (data?.description ?? $('meta[name$="description"i]', doc)?.content),
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
                                return JSON.stringify(json);
                            },

                            async formData() {
                                let form = new FormData;
                                for(let key of Object.keys(json))
                                    form.set(key, json[key]);
                                return form;
                            },
                        });
                    })
                    .catch(error => {
                        WARN(error);

                        return STREAMER?.jump?.[name];
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
        let pathname = location.pathname.substr(1),
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
                && player.routes.exact.missing(pathname)
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

        if(type.equals('vod'))
            vodID = ID;

        if(type.equals('channel'))
            channelName = ID;

        let searchID = UUID.from([ID, type, as, new Date((+new Date).floorToNearest(Search.cacheLeaseTime)).toJSON()].join('~')).value;

        SEARCH_CACHE.delete(ID?.toLowerCase());

        return Search.#cache.delete(searchID);
    }

    static retrieve(query) {
        if(typeof fetch == 'function')
            return fetchURL('https://gql.twitch.tv/gql', query);

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

            request.withCredentials = parseBool(query.credentials?.equals('include'));
            request.onerror = onError;
            request.onload = () => onSuccess({
                status: request.status,
                statusText: request.statusText,
                body: request.response || request.responseText,
                ok: request.status >= 200 && request.status < 300,
                json: () => new Promise((onsuccess, onerror) => {
                    try {
                        onsuccess(JSON.parse(query.body));
                    } catch(query) {
                        onerror(query);
                    }
                })
            });

            request.send(query.body);
        });
    }

    static async convertResults(response) {
        let json = (null
                ?? (await response?.json?.())
                ?? ({})
            ),
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

        return new Promise(resolve => resolve({ ok: parseBool(parseURL(data.icon).pathname?.startsWith('/jtv_user')), ...data }));
    }
}

function Chat(user = '', message = '') {
    if(!user.length && !message.length)
        return Chat.get();
}

Object.defineProperties(Chat, {
    element: { get() { return $('[data-test-selector$="message-container"i]').closest('section') } },

    badges: { get() { return JUMP_DATA?.[STREAMER.name.toLowerCase()]?.stream?.badges }, },

    gang: { value: [] },
    mods: { value: [] },
    vips: { value: [] },

    get: {
        // Create an array of the current chat
            // Chat.get(mostRecent:number?, keepEmotes:boolean?) → [...object<{ style, author, emotes, message, mentions, element?<Element>, uuid, reply?<Element>, highlighted?<boolean> }>]
        value:
        function get(mostRecent = 250, keepEmotes = true) {
            let results = [];

            for(let [uuid, object] of Chat.__allmessages__) {
                let { message, emotes } = object;

                if(!keepEmotes)
                    message = message.replaceAll(Object.keys(emotes).shift(), '');

                results.push({ ...object, message });
            }

            return results.slice(-mostRecent);
        }
    },

    send: {
        // Sends a message via the current chat
            // Chat.send(message:string?) → undefined
        value:
        function send(message = '') {
            if(typeof message != 'string')
                return;

            when(() => TTV_IRC.socket.readyState === WebSocket.OPEN)
                .then(ready => {
                    TTV_IRC.socket.send(`PRIVMSG #${ STREAMER.name.toLowerCase() } :${ message }`);
                });
        }
    },

    reply: {
        // Replies to a message via the current chat
            // Chat.send(to:string<IRC-Msg-Id>, message:string?) → undefined
        value:
        function reply(to = '', message = '') {
            if(typeof to != 'string' || to.length < 1 || typeof message != 'string')
                return;

            when(() => TTV_IRC.socket.readyState === WebSocket.OPEN)
                .then(ready => {
                    TTV_IRC.socket.send(`@reply-parent-msg-id=${ to } PRIVMSG #${ STREAMER.name.toLowerCase() } :${ message }`);
                });
        }
    },

    // Listener for new chat messages
    defer: {
        value: {
            set onmessage(callback) {
                let name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__deferredEvents__.__onmessage__.has(name))
                    return Chat.__deferredEvents__.__onmessage__.get(name);

                // REMARK('Adding deferred [on new message] event listener', { [name]: callback });

                Chat.__deferredEvents__.__onmessage__.set(name, callback);

                return callback;
            },

            get onmessage() {
                return Chat.__deferredEvents__.__onmessage__.size;
            },

            set onpinned(callback) {
                let name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__deferredEvents__.__onpinned__.has(name))
                    return Chat.__deferredEvents__.__onpinned__.get(name);

                // REMARK('Adding deferred [on new pinned] event listener', { [name]: callback });

                Chat.__deferredEvents__.__onpinned__.set(name, callback);

                return callback;
            },

            get onpinned() {
                return Chat.__deferredEvents__.__onpinned__.size;
            },

            set onwhisper(callback) {
                let name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__deferredEvents__.__onwhisper__.has(name))
                    return Chat.__onwhisper__.get(name);

                // REMARK('Adding deferred [on new whisper] event listener', { [name]: callback });

                return Chat.__deferredEvents__.__onwhisper__.set(name, callback);
            },

            get onwhisper() {
                return Chat.__deferredEvents__.__onwhisper__.size;
            },

            set onbullet(callback) {
                let name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__deferredEvents__.__onbullet__.has(name))
                    return Chat.__onbullet__.get(name);

                // REMARK('Adding deferred [on new newbullet] event listener', { [name]: callback });

                return Chat.__deferredEvents__.__onbullet__.set(name, callback);
            },

            get onbullet() {
                return Chat.__deferredEvents__.__onbullet__.size;
            },

            set oncommand(callback) {
                let name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__deferredEvents__.__oncommand__.has(name))
                    return Chat.__oncommand__.get(name);

                // REMARK('Adding deferred [on new command] event listener', { [name]: callback });

                return Chat.__deferredEvents__.__oncommand__.set(name, callback);
            },

            get oncommand() {
                return Chat.__deferredEvents__.__oncommand__.size;
            },
        },
    },
    __deferredEvents__: { value: { __onmessage__: new Map, __onpinned__: new Map, __onwhisper__: new Map, __onbullet__: new Map, __oncommand__: new Map } },

    onmessage: {
        set(callback) {
            let name = callback.name || UUID.from(callback.toString()).value;

            if(Chat.__onmessage__.has(name))
                return Chat.__onmessage__.get(name);

            // REMARK('Adding [on new message] event listener', { [name]: callback });

            Chat.__onmessage__.set(name, callback);

            return callback;
        },

        get() {
            return Chat.__onmessage__.size;
        },
    },
    __onmessage__: { value: new Map },

    onpinned: {
        set(callback) {
            let name = callback.name || UUID.from(callback.toString()).value;

            if(Chat.__onpinned__.has(name))
                return Chat.__onpinned__.get(name);

            // REMARK('Adding [on new pinned] event listener', { [name]: callback });

            Chat.__onpinned__.set(name, callback);

            return callback;
        },

        get() {
            return Chat.__onpinned__.size;
        },
    },
    __onpinned__: { value: new Map },

    onwhisper: {
        set(callback) {
            let name = callback.name || UUID.from(callback.toString()).value;

            if(Chat.__onwhisper__.has(name))
                return Chat.__onwhisper__.get(name);

            // REMARK('Adding [on new whisper] event listener', { [name]: callback });

            return Chat.__onwhisper__.set(name, callback);
        },

        get() {
            return Chat.__onwhisper__.size;
        },
    },
    __onwhisper__: { value: new Map },

    onbullet: {
        set(callback) {
            let name = callback.name || UUID.from(callback.toString()).value;

            if(Chat.__onbullet__.has(name))
                return Chat.__onbullet__.get(name);

            // REMARK('Adding [on new bullet] event listener', { [name]: callback });

            return Chat.__onbullet__.set(name, callback);
        },

        get() {
            return Chat.__onbullet__.size;
        },
    },
    __onbullet__: { value: new Map },

    oncommand: {
        set(callback) {
            let name = callback.name || UUID.from(callback.toString()).value;

            if(Chat.__oncommand__.has(name))
                return Chat.__oncommand__.get(name);

            // REMARK('Adding [on new command] event listener', { [name]: callback });

            return Chat.__oncommand__.set(name, callback);
        },

        get() {
            return Chat.__oncommand__.size;
        },
    },
    __oncommand__: { value: new Map },

    // Everything gathered...
    __allmessages__: { value: new Map },
    __allbullets__: { value: new Set },
    __allemotes__: { value: new Map },
    __allpinned__: { value: new Map },

    messages: {
        get() { return Chat.__allmessages__ },
        set(value) { return Chat.__allmessages__ },
    },

    bullets: {
        get() { return Chat.__allbullets__ },
        set(value) { return Chat.__allbullets__ },
    },

    emotes: {
        get() { return Chat.__allemotes__ },
        set(value) { return Chat.__allemotes__ },
    },

    pinned: {
        get() { return Chat.__allpinned__ },
        set(value) { return Chat.__allpinned__ },
    },

    // Chat restrictions
    restrictions: {
        set(value) {},

        get() {
            return TTV_IRC.restrictions.get(`#${ STREAMER.name.toLowerCase() }`) || ($('[class*="chat-restriction"i]')?.parentElement?.nextElementSibling?.textContent || '');
        },
    },
});

// Pushes parameters to the URL's search
    // PushToTopSearch(newParameters:object, reload:boolean?) → string<URL-Search>
function PushToTopSearch(newParameters, reload = false) {
    let url = parseURL(location).addSearch(newParameters, true);

    if(reload)
        location.search = url.search;
    else
        history?.pushState({ path: url.href }, document.title, url.href);

    return url.search;
}

// Removevs parameters from the URL's search
    // RemoveFromTopSearch(keys:array, reload:boolean?) → string<URL-Search>
function RemoveFromTopSearch(keys, reload = false) {
    let url = parseURL(location).delSearch(keys);

    if(reload)
        location.search = url.search;
    else
        history?.pushState({ path: url.href }, document.title, url.href);

    return url.search;
}

// Convert an SI number into a number
    // parseCoin(amount:string) → number
function parseCoin(amount = '') {
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

        let book = {}, index = 0;
        for(let symbol of booklet.split(' '))
            book[symbol] = index++;

        return book;
    };

    let units = getUnits(LITERATURE);
    let points = amount?.toString()?.replace(RegExp(`(\\d{1,3})(${ '(?:\\D\\d{1,3})?'.repeat(9) })?(?:\\s*(\\D))?`, 'i'), ($0, $1, $2 = '0', $3 = '_', $$, $_) => {
        $2 = $2.replace(/\D/g, '');

        return parseFloat([$1, $2].join($2.length > 2? '': '.')) * (1e3 ** units[$3.toUpperCase()]);
    });

    return parseInt(points) | 0;
}

// Get the video quality
    // GetQuality() → string<{ auto:boolean, high:boolean, low:boolean, source:boolean }>
async function GetQuality() {
    let detected = $('[class*="player"i][class*="controls"i]')?.getElementByText(/\d+p/i)?.textContent;

    if(detected?.length) {
        let quality = new String(detected),
            value = parseInt(quality);

        Object.defineProperties(quality, {
            auto:   { value: true },
            high:   { value: (value > 720) },
            mid:    { value: (value < 721 && value > 360) },
            low:    { value: (value < 361) },
            source: { value: quality.toLowerCase().contains('source') },
        });

        return quality;
    }

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

        if(nullish(quality) && nullish(options))
            try {
                settings?.click();
            } catch(error) {
                throw error;
            };
    })()
        .then(() => { buttons?.quality?.click() })
        .catch(error => { throw error });

    let qualities = $.all('[data-a-target$="-quality-option"i] input[type="radio"i]')
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
        low    = current.uuid == qualities[qualities.length - 1]?.uuid,
        lock   = { configurable: false, enumerable: true, writable: false };

    Object.defineProperties(quality, {
        auto:   { value: auto, ...lock },
        high:   { value: high, ...lock },
        low:    { value: low, ...lock },
        source: { value: source, ...lock },
    });

    if(defined(buttons.options))
        buttons.settings.click();

    return quality;
}

// Change the video quality
    // SetQuality(quality:string?, backup:string?) → Object<{ oldValue:object<{ input:Element, label:Element }>, newValue:object<{ input:Element, label:Element }> }>
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

        if(nullish(quality) && nullish(options))
            try {
                settings?.click();
            } catch(error) {
                throw error;
            };
    })()
        .then(() => buttons?.quality?.click())
        .catch(error => { throw error });

    let qualities = $.all('[data-a-target$="-quality-option"i] input[type="radio"i]')
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
            video = $.all('video').pop(),
            computed = (video?.videoHeight | 0) + 'p';

            if(desired !== computed) {
                clearInterval(checker);

                resolve({ oldValue: current, newValue: desired ?? computed });
            }
        }, 2_5_0);
    });
}

// Get the video volume
    // GetVolume(fromVideoElement:boolean?) → number<Percentage>
function GetVolume(fromVideoElement = true) {
    let video = $('[data-a-target="video-player"i] video'),
        slider = $('[data-a-target*="player"i][data-a-target*="volume"i]');

    return parseFloat(fromVideoElement? video?.volume: slider?.value);
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
    // SetVolume(volume:number<Percentage>) → undefined
function SetVolume(volume = 0.5) {
    let video = $('[data-a-target="video-player"i] video'),
        thumb = $('[data-a-target*="player"i][data-a-target*="volume"i]'),
        slider = $('video ~ * .player-controls + * [style]');

    volume = parseFloat(volume?.toFixed?.(2) || 1);

    if(defined(video))
        video.volume = volume;

    if(defined(thumb))
        thumb.value = volume;

    if(defined(slider))
        slider.setAttribute('style', `width: ${ 100 * volume }%`);
}

// Get the view mode
    // GetViewMode() → string<{ "fullscreen" | "fullwidth" | "theatre" | "default" }>
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
        ||= $.defined(`.home`)
    )
        mode = 'overview';

    if(fullwidth
        ||= $.defined(`[data-a-target*="right-column"i][data-a-target*="chat-bar"i][data-a-target*="collapsed"i] button[data-a-target*="collapse"i]`)
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
        || $.all(classes, container.parentElement).length <= 3
    )
        mode = 'fullscreen';

    return mode;
}

// Change the view mode
    // SetViewMode(mode:string<{ "fullscreen" | "fullwidth" | "theatre" | "default" }>) → undefined
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
    // GetActivity() → Promise<string | null>
async function GetActivity() {
    return when.defined(() => {
        let open = $.defined('[data-a-target="user-display-name"i], [class*="dropdown-menu-header"i]');

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
    // GetLanguage() → Promise<string | null>
async function GetLanguage() {
    return when.defined(() => {
        let open = $.defined('[data-a-target="user-display-name"i], [class*="dropdown-menu-header"i]');

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

// Reloads the webpage
    // ReloadPage(onlineOnly:boolean?) → undefined
async function ReloadPage(onlineOnly = true) {
    // Navigaotr is offline, do not reload
    if(true
        && onlineOnly
        && (false
            || navigator.connection?.type?.equals('none')
            || navigator.onLine === false
        )
    ) return;

    await top.beforeleaving?.({});

    location.reload();
}

// Import the glyphs
let { Glyphs } = top;

// Returns ordinal numbers
    // nth(n:number, s:string?) → string
let nth = (n, s = '') => {
    n += '';

    let c = (s = '') => {
        switch(s.trim()) {
            case 'ordinal-position': {
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

        case 'es': {
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

/** Adds a CSS block to the <code class=prettyprint>CUSTOM_CSS</code> string
 * @simply AddCustomCSSBlock(name:string, block:string) → undefined
 */
function AddCustomCSSBlock(name, block) {
    name = name.trim();

    let regexp = RegExp(`(\\/\\*(${ name })\\*\\/(?:[^]+?)\\/\\*#\\2\\*\\/|$)`);

    let newHTML = ((CUSTOM_CSS?.innerHTML || '').replace(regexp, `/*${ name }*/${ block }/*#${ name }*/`));

    if(nullish(CUSTOM_CSS?.innerHTML) || CUSTOM_CSS?.innerHTML?.equals(newHTML))
        return;

    CUSTOM_CSS.innerHTML = newHTML;
    CUSTOM_CSS.remove();

    // Force styling update
    $('body').append(CUSTOM_CSS);
}

/** Removes a CSS block from the <code class=prettyprint>CUSTOM_CSS</code> string
 * @simply RemoveCustomCSSBlock(name:string, flags:string?) → undefined
 */
function RemoveCustomCSSBlock(name, flags = '') {
    name = name.trim();

    let regexp = RegExp(`\\/\\*(${ name })\\*\\/(?:[^]+?)\\/\\*#\\1\\*\\/`, flags);

    let newHTML = ((CUSTOM_CSS?.innerHTML || '').replace(regexp, ''));

    if(CUSTOM_CSS?.innerHTML?.equals(newHTML))
        return;

    CUSTOM_CSS.innerHTML = newHTML;
    CUSTOM_CSS.remove();

    // Force styling update
    $('body').append(CUSTOM_CSS);
}

// Returns a unique list of channels (used with `Array..filter`)
    // uniqueChannels(channel:object<Channel>, index:number, channels:array) → boolean
let uniqueChannels = (channel, index, channels) =>
    channels.filter(channel => defined(channel?.name)).findIndex(ch => ch.name === channel?.name) == index;

// Returns whether or not a channel is live (used with `Array..filter`)
    // isLive(channel:object<Channel>) → boolean
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

;

// Update common variables
let PATHNAME = location.pathname,
    NORMALIZED_PATHNAME = PATHNAME
        // Remove common "modes"
        .replace(/^\/(?:moderator|popout)\/(\/[^\/]+?)/i, '$1')
        .replace(/^(\/[^\/]+?)\/(?:about|schedule|squad|videos)\b/i, '$1'),
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
        },

        MiniPlayer: {
            get() {
                return $('#tt-pip-player');
            },

            set(name) {
                let f = furnish;
                let src = `https://player.twitch.tv/?channel=${ name }&controls=false&muted=true&parent=twitch.tv&quality=360p&private=true`;

                let pbyp = $('[class*="picture-by-picture-player"i] video'),
                    pip = $('#tt-pip-player');

                $('#tt-exit-pip')?.remove();
                $('[data-test-selector="picture-by-picture-player-container"i]')?.modStyle('max-height:!delete');
                $('[data-test-selector="picture-by-picture-player-container"i]')?.classList?.remove('picture-by-picture-player--collapsed');

                if(nullish(pbyp))
                    $('.stream-chat').insertAdjacentElement('beforebegin',
                        f('[class="picture-by-picture-player"][data-test-selector=picture-by-picture-player-background]').with(
                            f('[class="picture-by-picture-player"][data-test-selector=picture-by-picture-player-container]').with(
                                f('.tw-aspect').with(
                                    f.div(),
                                    f('.pbyp-player-instance', { autodisplay: setTimeout(() => $('[data-test-selector="picture-by-picture-player-container"i]')?.classList?.remove('picture-by-picture-player--collapsed'), 500) },
                                        pbyp = f('video[webkit-playsinline][playsinline]', {
                                            oncontextmenu: () => false,
                                        })
                                    )
                                )
                            )
                        )
                    );

                if(defined(pip))
                    pip.src = src;
                else
                    pip = f('iframe#tt-pip-player', {
                        src,

                        style: 'height:auto;min-height:7em;width:-webkit-fill-available;width:-moz-available;margin-bottom:7em;position:relative;z-index:9',
                    });

                pip.remove();
                pbyp.modStyle('height:initial');
                pbyp.insertAdjacentElement('afterend', pip);

                pip.dataset.name = name;

                when.defined(() => $('.stream-chat-header'))
                    .then(parent => parent.insertAdjacentElement('afterbegin',
                        f('button#tt-exit-pip', {
                            style: 'position:absolute;left:0;margin-left:1rem;',

                            onmousedown(event) {
                                $.all('#tt-exit-pip, [class*="picture-by-picture-player"i] iframe[src*="player.twitch.tv"i]').map(el => el.modStyle('transition:opacity .5s; opacity:0;'));
                                $('[data-test-selector="picture-by-picture-player-container"i]')?.modStyle('max-height:0');

                                wait(500).then(() => {
                                    RemoveFromTopSearch(['mini']);

                                    $('#tt-exit-pip')?.remove();
                                    $('[class*="picture-by-picture-player"i] iframe[src*="player.twitch.tv"i]')?.remove();
                                    $('[data-test-selector="picture-by-picture-player-container"i]')?.classList?.add('picture-by-picture-player--collapsed');
                                });
                            },

                            innerHTML: Glyphs.modify('exit_picture_in_picture', { height: 15, width: 20, fill: 'currentcolor', style: 'vertical-align:middle' }),
                        })
                    ));

                function keepOpen() {
                    when.defined(() => $('[data-test-selector="picture-by-picture-player-container"i][class*="collapsed"i]'))
                        .then(player => {
                            let keep = $.defined('#tt-exit-pip');

                            if(keep)
                                player.classList.remove('picture-by-picture-player--collapsed');

                            return keep;
                        })
                        .then(keep => (keep? keepOpen(): null));
                }

                keepOpen();
                PushToTopSearch({ mini: name });
            },
        },
    });

    // Automatic garbage collection...
    REMARK(`Removing expired cache data...`, new Date);

    Cache.load(null, cache => {
        Object.keys(cache)
            .filter(key => key.startsWith('data/'))
            .map(async key => {
                let data;

                try {
                    data = JSON.parse(await Cache.load(key));
                } catch(error) {
                    data = await Cache.load(key);
                }

                let { dataRetrievedAt } = data;

                // If there isn't a proper date, remove the data...
                if(+dataRetrievedAt < 0)
                    return Cache.remove(key);

                let lastFetch = Math.abs(dataRetrievedAt - +new Date);

                // If the last fetch was more than 30 days ago, remove the data...
                if(lastFetch > (30 * 24 * 60 * 60 * 1000)) {
                    WARN(`\tThe last fetch for "${ key }" was ${ toTimeString(lastFetch) } ago. Marking as "expired"`);

                    Cache.remove(key);
                }
            });
    });

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
                // Title conversion legend
                .replace(/\$\$/g, ' | ')
                .replace(/\$(\D)/g, '/$1')
                .replace(/__/g, ' - ')
                .replace(/_/g, ' ')
                .replace(/\$1/g, '!')
                .replace(/\$2/g, '@')
                .replace(/\$3/g, '#')
                .replace(/\$5/g, '%')
                .replace(/\$6/g, '^')
                .replace(/\$7/g, '&')
                .replace(/\$8/g, '*')
                .replace(/\$9/g, '(')
                .replace(/\$0/g, ')')
                .replace(/\$4/g, '$')
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
                        let [documentLanguage] = (document.documentElement?.lang ?? navigator?.userLanguage ?? navigator?.language ?? 'en').toLowerCase().split('-');

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
            return ReloadPage();

        for(let job of refresh) {
            RestartJob(job, 'modify');
            (top.REFRESH_ON_CHILD ??= []).push(job);
        }
    });

    // Moved message listener → If nothing responds back, the page gets killed //

    // Jumping frames...
    REMARK(`Listening for jumped frame data...`);

    // Receive messages from other content scripts
    top.addEventListener('message', async event => {
        if(!/\b\.?twitch\.tv\b/i.test(event.origin))
            return /* Not meant for us... */;

        let R = RegExp;
        let { data } = event;

        switch(data?.action || data?.eventName) {
            case 'jump': {
                let BroadcastSettings = {},
                    Channel = {},
                    Badges = {},
                    Points = {},
                    Stream = {},
                    User = {},
                    Game = {},
                    Tags = {},
                    Form = {};

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
                        else if(/^(Freeform(?:Tag):[^$]+)/.test(key))
                            Form[R.$1] = data[key];
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
                        else if(/^CommunityPoints(Automatic|Custom)Reward:([^$]+)/.test(key)) {
                            let [type, id] = [R.$1, R.$2].map(s => s.toLowerCase());
                            let store = Points[type] ??= {};

                            if(type.equals('automatic')) {
                                let [channel, name] = id.split(':', 2);

                                if(STREAMER?.sole == parseInt(channel))
                                    store[name] = data[key];
                            } else {
                                store[id] = data[key];
                            }
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
                                    destructing: for(let stream in streams) {
                                        if(streams[stream]?.broadcaster?.__ref?.contains?.(channel)) {
                                            stream = streams[stream];

                                            stream.broadcaster = BroadcastSettings[channel];
                                            stream.game = Game[stream.game?.__ref];
                                        } else if(channel.equals(STREAMER?.sole)) {
                                            let { name, sole, live, desc, game, coin, tags, poll, shop } = STREAMER;

                                            stream = {
                                                broadcaster: {
                                                    id: sole,
                                                    title: desc,
                                                },
                                                broadcasterSoftware: 'unknown_rtmp',
                                                game: (game + ''),
                                                id: `stream:${ sole }`,
                                                [`previewImageURL({"height":720,"width":1280})`]: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${ name.toLowerCase() }-1280x720.jpg`,
                                                tags: [...tags],
                                                type: (live? "live": null),
                                                viewersCount: poll,
                                            };
                                        } else {
                                            continue destructing;
                                        }

                                        stream.tags = [
                                            stream.tags?.filter?.(defined)?.map(({ __ref }) => Tags[__ref]?.localizedName),
                                            stream.freeformTags?.map?.(({ __ref }) => Form[__ref]?.name),
                                        ].flat().filter(defined);

                                        // Preview images
                                        let previews = {};
                                        for(let key in stream)
                                            if(/^previewImageURL\(([^]+)\)\s*$/i.test(key)) {
                                                let { height, width } = JSON.parse(R.$1);

                                                previews[`${ width }x${ height }`] = stream[key];

                                                delete stream[key];
                                            }

                                        stream.previewImageURL = previews;

                                        // Badges
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

                                        // Community Points
                                        if(STREAMER?.sole == stream.broadcaster.id);
                                            stream.points = {
                                                ...Points,
                                                get balance() {
                                                    return Channel.self?.communityPoints?.balance
                                                },
                                            };

                                        return stream;
                                    }

                                    return null;
                                })(Stream);

                                JUMP_DATA[login] = { id: parseFloat(id), title, displayName, login, primaryColorHex, profileImageURL, stream };
                            }

                        Cache.large.save({ JumpedData: JUMP_DATA });
                        // LOG('Jumped frames, retrieved:', JUMP_DATA);
                    }
                }
            } break;

            case 'raid': {
                let { from, to, events, payable } = data,
                    method = Settings.prevent_raiding ?? "none";

                if(false
                    || (!top.UP_NEXT_ALLOW_THIS_TAB)
                    || (from.equals(STREAMER?.name))
                )
                    break;

                // "Would the user allow this raid condition?"
                if(true
                    && payable
                    && (false
                        || (["all", "greed"].contains(method))
                        || (method.equals("unfollowed") && STREAMERS.contains(({ name }) => RegExp(`^${ to }$`, 'i').test(name)))
                    )
                )
                    confirm
                        .timed(`<a href='./${ from }'><strong>${ from }</strong></a> is raiding <strong>${ to }</strong>. There is a chance to collect bonus channel points...`, 10_000)
                        .then(action => {
                            // The event timed out...
                            action ??= true;

                            if(action) {
                                // The user clicked "OK"
                                // Return to the current page eventually...
                                if(!parseBool(Settings.first_in_line_none)) {
                                    let { name, href } = STREAMER;

                                    Handlers.first_in_line({ href, innerText: `${ name } is live [Greedy Raiding]` });
                                }

                                goto(`./${ from }?tool=raid-stopper--${ method }`);
                            } else {
                                // The user clicked "Cancel"
                                LOG('Canceled Greedy Raiding event', { from, to });
                            }
                        });
            } break;

            case 'UPDATE_STATE':
            case 'report-blank-ad': {
                if(false
                    || data.from?.equals?.('player.js')
                    || isFinite(data.params?.duration)
                )
                    $('.tt-stream-preview')?.setAttribute('blank-ad', parseBool(data.purple));
            } break;

            case 'report-offline-dvr': {
                switch(data.from) {
                    case 'player.js': {
                        $(`#${ data.slug }`)?.remove();
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

    // Normal - Page body
    // Reload (Ctrl+R)
    // ----
    // Save as... (Ctrl+S)
    // Print... (Ctrl+P)
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
        let anchor = event.target.closest('a, [href]');

        // Selections
        let selectionText = getSelection(),
            { baseNode, baseOffset, extentNode, extentOffset } = selectionText;

        selectionText = (selectionText + '').trim().normalize('NFKD');

        // Images
        let image = event.target.closest('img, picture');

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
                        favicon: parseURL(href).origin.replace(/^(https?):\/\/.+$/i, ($0, $1, $$, $_) => furnish.span().text($1.toUpperCase()).css(`background:${ ($1.equals('https')? '#22FA7C': '#FCC21B') } !important!innate;`).html()),
                        action: event => top.open(href, '_blank'),
                    },{
                        text: `Copy link address`,
                        icon: 'bolt',
                        action: event => navigator.clipboard.writeText(href),
                    });
                } break;
            }

            extras.push({});
        }

        // Selections
        if(selectionText?.length) {
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
                    action: event => top.open(`https://www.twitch.tv/search?term=${ encodeURIComponent(selectionText.trim().replace(/\s+/g, ' ')).split(/(?:%20)+/).join(' ') }`, '_self'),
                },{
                    text: `Search Google for <strong>${ selectionText }</strong>`,
                    icon: 'search',
                    action: event => top.open(`https://www.google.com/search?q=${ encodeURIComponent(selectionText.trim().replace(/\s+/g, ' ')).split(/(?:%20)+/).join('+').replace(/%22\b/g, '"') }`, '_blank'),
                });
            }
        }

        // Image

        else if(defined(image)) {
            let { src } = image;
            let [name = image.alt, tail = 'png'] = parseURL(src).filename?.split('.') ?? [];
            let type = `image/${ tail }`,
                real = MIME_Types.find(type);

            if(type == real)
                [,real] = type.split('/');

            extras.push({
                text: `Open image in new tab`,
                icon: 'popout',
                action: event => top.open(src, '_blank'),
            },{
                text: `Save image as...`,
                icon: 'download',
                action: event => showSaveFilePicker({
                    suggestedName: image.alt || tail,
                    types: [{
                        description: `${ tail.toUpperCase() } Image`,
                        accept: { [type]: [`.${ real }`] },
                    }],
                }),
            },{
                text: `Copy image`,
                icon: 'loot',
                action: event => image.copy(),
            },{
                text: `Copy image address`,
                icon: 'bolt',
                action: event => navigator.clipboard.writeText(src),
            });
        }

        // Video
        else if(defined(video)) {
            let VideoClips = {
                dvr: parseBool(Settings.video_clips__dvr),
                filetype: (Settings.video_clips__file_type ?? 'webm'),
                quality: (Settings.video_clips__quality ?? 'auto'),
                length: parseInt(Settings.video_clips__length ?? 60) * 1000,
            };

            extras.push({
                text: `Open video in new tab`,
                icon: 'popout',
                action: event => top.open(`//player.twitch.tv/?channel=${ STREAMER.name }&parent=twitch.tv`, '_blank'),
            },{
                text: GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X.toTitle(),
                icon: 'loot',
                shortcut: (defined(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X)? 'alt+shift+x': ''),
                action: event => $.all('video').pop().copyFrame(),
            },{
                text: `Record the next ${ toTimeString(VideoClips.length) }`,
                icon: 'video',
                shortcut: (defined(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z)? 'alt+z': ''),
                action: event => {
                    SetQuality('auto').then(() => {
                        let video = $.all('video').pop();
                        let time = VideoClips.length;
                        let name = 'Event mousedown<right>';

                        let recording = new Recording(video, { name, maxTime: time, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats });

                        // CANNOT be chained with the above; removes `this` context (can no longer be aborted)
                        recording
                            .then(({ target }) => target.recording.save())
                            .then(link => alert.silent(`
                                <video controller controls
                                    title="Clip Saved - ${ link.download }"
                                    src="${ link.href }" style="max-width:-webkit-fill-available"
                                ></video>
                                `)
                            );

                        confirm.timed(`
                            <div hidden controller
                                icon="\uD83D\uDD34\uFE0F" title="Recording ${ (STREAMER?.name ?? top.location.pathname.slice(1)) }..."
                                okay="${ encodeHTML(Glyphs.modify('download', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Save"
                                deny="${ encodeHTML(Glyphs.modify('trash', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Discard"
                            ></div>`
                        , time)
                            .then(answer => {
                                if(answer === false)
                                    throw `Clip discarded!`;
                                recording.stop();
                            })
                            .catch(error => {
                                alert.silent(error);
                                recording.controller.abort(error);
                            });
                    });
                },
            });
        }

        // ---- ---- STOP ---- ---- //

        if(extras.length)
            extras.splice(0, 0, {});

        let MAX = 10;
        while(nullish(extras.at(-1)?.text) && --MAX > 0)
            extras.splice(-1, 1);

        new ContextMenu({
            inherit: event,

            options: [{
                text: `Reload page`,
                icon: 'rerun',
                shortcut: 'ctrl+r',
                action: event => top.ReloadPage(),
            },{
                // break
            },{
                text: `Save page (HTML)`,
                icon: 'download',
                shortcut: 'ctrl+s',
                action: async event => {
                    alert.timed(`Gathering resources. Saving page in the background...<p tt-x>${ (new UUID).value }</p>`, 7000);

                    let DOM = document.cloneNode(true);
                    let type = DOM.contentType,
                        name = DOM.title;

                    // Remove all TTV Tools helpers
                    for(let element of $.all('[id*="tt-"i], [class*="tt-"i], [data-a-target*="tt-"i]', DOM))
                        element.remove();

                    // Download all scripts
                    let scripts = $.all('script[src]', DOM).filter(script => /^(https?|\/\/)/i.test(parseURL(script.src).scheme)),
                        JS_index = 0, JS_length = scripts.length;

                    // Remove non-HTTP(s) sources
                    $.all('script[src]', DOM)
                        .filter(script => !/^(https?|\/)/i.test(parseURL(script.src).scheme))
                        .map(script => script.remove());

                    for(let script of scripts) {
                        fetchURL(script.src, { timeout: 10_000, native: true })
                            .then(response => response.text())
                            .then(js => {
                                LOG('Saving scripts...', script.src, (100 * (JS_index / JS_length)).suffix('%', 2), (js.length).suffix('B', 2, 'data'));

                                script.removeAttribute('src');
                                script.textContent = js;
                            })
                            .catch(error => {
                                if(error.name == 'AbortError')
                                    throw `The request to [ ${ script.src } ] timed out.`;
                                else
                                    script.setAttribute('src', `https://api.allorigins.win/raw?url=${ encodeURIComponent(script.src) }`);
                            })
                            .finally(() => ++JS_index);
                    }

                    // Download all styles
                    let styles = $.all('style[href], link[rel="stylesheet"i]', DOM).filter(style => /^(https?|\/\/)/i.test(parseURL(style.href).scheme)),
                        CSS_index = 0, CSS_length = styles.length;

                    // Remove non-HTTP(s) sources
                    $.all('style[href], link[rel="stylesheet"i]', DOM)
                        .filter(style => !/^(https?|\/)/i.test(parseURL(style.href).scheme))
                        .map(style => style.remove());

                    for(let style of styles) {
                        fetchURL(style.href, { timeout: 10_000, native: true })
                            .then(response => response.text())
                            .then(css => {
                                LOG('Saving styles...', style.href, (100 * (CSS_index / CSS_length)).suffix('%', 2), (css.length).suffix('B', 2, 'data'));

                                style.removeAttribute('href');
                                style.textContent = css;
                            })
                            .catch(error => {
                                if(error.name == 'AbortError')
                                    throw `The request to [ ${ style.href } ] timed out.`;
                                else
                                    style.setAttribute('href', `https://api.allorigins.win/raw?url=${ encodeURIComponent(style.href) }`);
                            })
                            .finally(() => ++CSS_index);
                    }

                    // Wait for completion
                    when(() => ((JS_index >= JS_length) && (CSS_index >= CSS_length))).then(() => {
                        let blob = new Blob([
                                `<!DOCTYPE ${ DOM.doctype.name }${ DOM.doctype.publicId.replace(/^([^$]+)$/, ' PUBLIC "$1"') }${ DOM.doctype.systemId.replace(/^([^$]+)$/, ' "$1"') }>\n${ DOM.documentElement.outerHTML }`
                            ], { type });
                        let link = furnish('a', { href: URL.createObjectURL(blob), download: `${ name }.html`, hidden: true }, [name, (new Date).toJSON()].join('/'));

                        document.head.append(link);
                        link.click();

                        alert.silent(`HTML content <a href="${ link.href }">ready to save</a>!`);
                    });
                },
            },{
                text: `Print...`,
                icon: 'export',
                shortcut: 'ctrl+p',
                action: event => top.print(),
            }, ...extras],

            fineTuning: { top: (y > innerHeight * (0.85 - extras.length * 0.05)? innerHeight * 0.7: y), left: (x > innerWidth * (0.85 - extras.length * 0.00)? innerWidth * 0.7: x) },
        });
    },{
        capture: false,
        once: false,
        passive: false,
    });
} catch(error) {
    // Most likely in a child frame...
    // REMARK("Moving to chat child frame...");
    if(!parseBool(parseURL(location).searchParameters?.hidden))
        WARN(error);
}

async function update() {
    // The location
    window.PATHNAME = PATHNAME = location.pathname;

    NORMALIZED_PATHNAME = PATHNAME
        // Remove common "modes"
        .replace(/^\/(?:moderator|popout)\/(\/[^\/]+?)/i, '$1')
        .replace(/^(\/[^\/]+?)\/(?:about|schedule|squad|videos)\b/i, '$1');

    // All Channels under Search
    window.SEARCH = SEARCH = [
        ...SEARCH,
        // Current (followed) streamers
        ...$.all(`.search-tray a[href^="/"]:not([href*="/search?"i]):not([href$="${ PATHNAME }"i])`)
            .map(element => {
                let icon = $('img', element)?.src;
                let channel = {
                    element,

                    from: 'SEARCH',
                    href: element.href,
                    icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                    get live() {
                        let { href } = element,
                            url = parseURL(href),
                            { pathname } = url;

                        let parent = $(`.search-tray [href$="${ pathname }"i]:not([href*="/search?"])`);

                        if(nullish(parent))
                            return true;

                        let live = $.defined(`[data-test-selector="live-badge"i]`, parent);

                        return live;
                    },
                    name: $('img', element)?.alt,
                };

                element.setAttribute('draggable', true);
                element.ondragstart ??= event => {
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
        ...$.all(`[id*="side"i][id*="nav"i] .side-nav-section a:not([href$="${ PATHNAME }"i])`)
            .map(element => {
                let icon = $('img', element)?.src;
                let streamer = {
                    from: 'CHANNELS',
                    href: element.href,
                    icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                    get live() {
                        let { href } = element,
                            url = parseURL(href),
                            { pathname } = url;

                        let parent = $(`[id*="side"i][id*="nav"i] .side-nav-section [href$="${ pathname }"i]`);

                        if(nullish(parent))
                            return false;

                        let live = defined(parent)
                                && $.nullish(`[class*="--offline"i]`, parent);

                        return live;
                    },
                    name: $('img', element)?.alt,
                };

                element.setAttribute('draggable', true);
                element.ondragstart ??= event => {
                    event.dataTransfer.dropEffect = 'move';
                };

                return streamer;
            }),
    ].filter(uniqueChannels);

    // All followed Channels
    window.STREAMERS = STREAMERS = [
        ...STREAMERS,
        // Current (followed) streamers
        ...$.all(`[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] a:not([href$="${ PATHNAME }"i])`)
            .map(element => {
                let icon = $('img', element)?.src;
                let streamer = {
                    from: 'STREAMERS',
                    href: element.href,
                    icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                    get live() {
                        let { href } = element,
                            url = parseURL(href),
                            { pathname } = url;

                        let parent = $(`[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] [href$="${ pathname }"i]`);

                        if(nullish(parent))
                            return false;

                        let live = defined(parent)
                                && $.nullish(`[class*="--offline"i]`, parent);

                        return live;
                    },
                    name: $('img', element)?.alt,
                };

                element.setAttribute('draggable', true);
                element.ondragstart ??= event => {
                    event.dataTransfer.dropEffect = 'move';
                };

                return streamer;
            }),
    ].filter(uniqueChannels);

    // All Notifications
    window.NOTIFICATIONS = NOTIFICATIONS = [
        ...NOTIFICATIONS,
        // Notification elements
        ...$.all('[data-test-selector^="onsite-notifications"i] [data-test-selector^="onsite-notification"i]').map(
            element => {
                let icon = $('img', element)?.src;
                let streamer = {
                    live: true,
                    href: $('a', element)?.href,
                    icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                    name: $('[class$="text"i]', element)?.textContent?.replace(/([^]+?) +(go(?:ing)?|is|went) +live\b([^$]+)/i, ($0, $1, $$, $_) => $1),
                };

                if(nullish(streamer.name))
                    return;

                element.setAttribute('draggable', true);
                element.ondragstart ??= event => {
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
    SENSITIVE_FEATURES = ['away_mode*~schedule', 'auto_accept_mature', 'fine_details', 'first_in_line*', 'prevent_#', 'soft_unban*', '!up_next+', 'view_mode'].map(AsteriskFn),

    // Features that need to be run on a "normal" page
    NORMALIZED_FEATURES = ['away_mode*~schedule', 'auto_follow+', 'first_in_line*', 'prevent_#', 'kill+'].map(AsteriskFn),

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
*/;

// A non-repeating token representing the current window
const PRIVATE_SYMBOL = Symbol(new UUID);

/** Streamer Array (Backup) - the current streamer/channel
 * @prop {string} call       - The streamer's login ID
 * @prop {string} date       - A date string representing the current stream's start time
 * @prop {number} game       - The current game/category
 * @prop {string} head       - The title of the stream
 * @prop {string} icon       - Link to the channel's icon/image
 * @prop {string} lang       - The language of the broadcast
 * @prop {boolean} live      - Is the channel currently live
 * @prop {string} name       - The channel's username
 * @prop {number} sole       - The channel's ID
 * @prop {array} tags        - Tags of the current stream
 */
let LIVE_CACHE = new Map();

let TWITCH_PATHNAMES = [
        '$', '[up]/',

        'activate',
        'bits(-checkout/?)?',
        'clips',
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

/*** First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon
 *      ______ _          _     _         _      _              _    _      _
 *     |  ____(_)        | |   (_)       | |    (_)            | |  | |    | |
 *     | |__   _ _ __ ___| |_   _ _ __   | |     _ _ __   ___  | |__| | ___| |_ __   ___ _ __ ___
 *     |  __| | | '__/ __| __| | | '_ \  | |    | | '_ \ / _ \ |  __  |/ _ \ | '_ \ / _ \ '__/ __|
 *     | |    | | |  \__ \ |_  | | | | | | |____| | | | |  __/ | |  | |  __/ | |_) |  __/ |  \__ \
 *     |_|    |_|_|  |___/\__| |_|_| |_| |______|_|_| |_|\___| |_|  |_|\___|_| .__/ \___|_|  |___/
 *                                                                           | |
 *                                                                           |_|
 */;
let FIRST_IN_LINE_JOB = null,           // The current job (interval)
    FIRST_IN_LINE_HREF = '#',            // The upcoming HREF
    FIRST_IN_LINE_BOOST,                // The "Up Next Boost" toggle
    FIRST_IN_LINE_TIMER,                // The current time left before the job is accomplished
    FIRST_IN_LINE_PAUSED = false,       // The pause-state
    FIRST_IN_LINE_BALLOON,              // The balloon controller
    FIRST_IN_LINE_DUE_DATE,             // The due date of the next job
    ALL_FIRST_IN_LINE_JOBS = [],        // All First in Line jobs
    FIRST_IN_LINE_WAIT_TIME,            // The wait time (from settings)
    FIRST_IN_LINE_LISTING_JOB,          // The job (interval) for listing all jobs (under the ballon)
    FIRST_IN_LINE_WARNING_JOB,          // The job for warning the user (via timed confirmation dialog)
    FIRST_IN_LINE_SAFETY_CATCH,         // Keeps the alert from not showing properly
    FIRST_IN_LINE_SORTING_HANDLER,      // The Sortable object to handle the balloon
    FIRST_IN_LINE_WARNING_TEXT_UPDATE;  // Sub-job for the warning text

let DO_NOT_AUTO_ADD = []; // List of names to ignore for auto-adding; the user already canceled the job

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
    class StopWatch {
        static #WATCHES = new Map;

        constructor(name, interval) {
            interval ??= Timers[name];

            StopWatch.#WATCHES.set(name, this);

            return Object.assign(this, {
                name, interval,

                start: new Date,
                stop: null,
                span: null,
                max: Math.abs(interval + new Date) * 1.1,
            });
        }

        static stop(name) {
            StopWatch.#WATCHES.get(name)?.time();
        }

        time() {
            let stop = this.stop = new Date;
            let span = this.span = Math.abs(this.start - stop);
            let { max, name } = this;

            if(span > max)
                WARN(`"${ name.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['',' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, '- ') }" took ${ (span / 1000).suffix('s', 2).replace(/\.0+/, '') } to complete (max time allowed is ${ (max / 1000).suffix('s', 2).replace(/\.0+/, '') }). Offense time: ${ new Date }. Offending site: ${ location.pathname }`)
                    ?.toNativeStack?.();
        }
    }

    // Initialize all settings/features //

    let GLOBAL_TWITCH_API = (window.GLOBAL_TWITCH_API ??= {}),
        GLOBAL_EVENT_LISTENERS = (window.GLOBAL_EVENT_LISTENERS ??= {
            KEYDOWN_ALT_X: function Clip() {/* Managed by Twitch */},
            KEYDOWN_ALT_T: function Toggle_Theatre_Mode() {/* Managed by Twitch */},
        });

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
        // GetNextStreamer() → Object<Channel>
    function GetNextStreamer() {
        // Next channel in "Up Next"
        if(!parseBool(Settings.first_in_line_none) && ALL_FIRST_IN_LINE_JOBS?.length)
            return GetNextStreamer.cachedStreamer = (null
                ?? ALL_CHANNELS.find(channel => parseURL(channel?.href)?.pathname?.equals(parseURL(ALL_FIRST_IN_LINE_JOBS[0]).pathname))
                ?? {
                    from: 'GET_NEXT_STREAMER',
                    href: parseURL(ALL_FIRST_IN_LINE_JOBS[0]).href,
                    name: parseURL(ALL_FIRST_IN_LINE_JOBS[0]).pathname.slice(1),
                }
            );

        if(parseBool(Settings.stay_live) && defined(GetNextStreamer?.cachedStreamer))
            return GetNextStreamer.cachedStreamer;

        Cache.load('ChannelPoints', ({ ChannelPoints = {} }) => {
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
                notEarned = parseInt(notEarned);
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

        return when.defined(() => GetNextStreamer.cachedStreamer);
    }

    /** Search Array - all channels/friends that appear in the search panel (except the currently viewed one)
     * @prop {string} href   - Link to the channel
     * @prop {string} icon   - Link to the channel's image
     * @prop {boolean} live  - Is the channel live (<b>getter</b>)
     * @prop {string} name   - The channel's name
     */
    SEARCH = [
        // Current (followed) streamers
        ...$.all(`.search-tray a[href^="/"]:not([href*="/search?"i]):not([href$="${ NORMALIZED_PATHNAME }"i]), [data-test-selector*="search-result"i][data-test-selector*="channel"i] a:not([href*="/search?"i])`)
            .map(element => {
                let icon = $('img', element)?.src;
                let channel = {
                    element,

                    from: 'SEARCH',
                    href: element.href,
                    icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                    get live() {
                        let { href } = element,
                            url = parseURL(href),
                            { pathname } = url;

                            let parent = $(`.search-tray [href$="${ pathname }"i]:not([href*="/search?"])`);

                            if(nullish(parent))
                                return false;

                            let live = $.defined(`[data-test-selector="live-badge"i]`, parent);

                        return live;
                    },
                    name: $('img', element)?.alt,
                };

                element.setAttribute('draggable', true);
                element.ondragstart ??= event => {
                    event.dataTransfer.dropEffect = 'move';
                };

                SEARCH_CACHE.set(channel.name?.toLowerCase?.(), { ...channel });

                return channel;
            }),
    ].filter(uniqueChannels);

    /** Streamer Array - the current streamer/channel
     * @prop {string} aego       - The channel's complementary accent color (if applicable)
     * @prop {array} chat        - An array of the current chat, sorted the same way messages appear. The last message is the last array entry
     * @prop {number} coin       - How many channel points (floored to the nearest 100) does the user have
     * @prop {array} coms        - Returns the channel commands (if available)
     * @prop {number} cult       - The estimated number of followers
     * @prop {object} data       - extra data about the channel
     * @prop {string} desc       - The status (description/title) of the stream
     * @prop {boolean} done      - Are all of the channel point rewards purchasable
     * @prop {string} face       - A URL to the channel points image (if applicable)
     * @prop {string} fiat       - Returns the name of the channel points (if applicable)
     * @prop {function} follow   - follows the current channel
     * @prop {string} from       - Returns where the data was collected for the object
     * @prop {string} game       - The name of the current game/category
     * @prop {string} href       - link to the channel (usually the current href)
     * @prop {string} icon       - link to the channel's icon/image
     * @prop {array} jump        - Extra data from the Apollo data-stream
     * @prop {boolean} like      - Is the user following the current channel
     * @prop {boolean} live      - Is the channel currently live
     * @prop {boolean} main      - Returns whether the stream is the user's Prime Subscription
     * @prop {number} mark       - Returns an activity score based on the channel's tags
     * @prop {string} name       - the channel's username
     * @prop {boolean} paid      - Is the user  subscribed
     * @prop {boolean} ping      - Does the user have notifications on
     * @prop {boolean} plug      - Is there an advertisement running
     * @prop {number} poll       - How many viewers are watching the channel
     * @prop {number} rank       - What is the user's assumed rank--based on the amount of channel points they possess
     * @prop {boolean} redo      - Is the channel streaming a rerun (VOD)
     * @prop {array} shop        - Returns a list (sorted, ascending price) of the channel's rewards
     * @prop {number} sole       - The channel's ID
     * @prop {array} tags        - Tags of the current stream
     * @prop {string} team       - The team the channel is affiliated with (if applicable)
     * @prop {number} time       - How long has the channel been live
     * @prop {string} tint       - The channel's accent color (if applicable)
     * @prop {string} tone       - The channel's opposing lightness color (if applicable)
     * @prop {function} unfollow - unfollows the current channel
     * @prop {boolean} veto      - Determines if the user is banned from the chat or not
     * @prop {array} vods        - Returns a list (up to 25) of the channel's VODs

     * Only available with Fine Details enabled
     * @prop {boolean} ally      - is the channel partnered?
     * @prop {boolean} fast      - is the channel using turbo?
     * @prop {boolean} nsfw      - is the channel deemed NSFW (mature)?
     */
    STREAMER = window.STREAMER = {
        get chat() {
            return Chat.get()
        },

        get coin() {
            let exact = STREAMER.jump?.[STREAMER?.name?.toLowerCase()]?.stream?.points?.balance,
                current = parseCoin($('[data-test-selector="balance-string"i]')?.textContent),
                _e = exact?.suffix('', 1, 'natural'),
                _c = current?.suffix('', 1, 'natural');

            if(nullish(exact))
                return current;
            return _e == _c? exact: current;
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
                    // cooldown: { user: 30, global: 30 }
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
                await fetchURL.idempotent(`https://api.streamelements.com/kappa/v2/channels/${ channel.name }`, { mode: 'cors' })
                    .then(r => r?.json?.())
                    .then(json => json?._id)
                    .then(async id => {
                        let commands = {};

                        if(nullish(id))
                            return [];

                        for(let type of ['public', 'default'])
                            await fetchURL.idempotent(`https://api.streamelements.com/kappa/v2/bot/commands/${ id }/${ type }`, { mode: 'cors' })
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
                await fetchURL.idempotent(`https://api.nightbot.tv/1/channels/t/${ channel.name }`, { mode: 'cors' })
                    .then(r => r?.json?.())
                    .then(json => json?.channel?._id)
                    .then(async id => {
                        let commands = [];

                        if(nullish(id))
                            return commands;

                        await fetchURL.idempotent('https://api.nightbot.tv/1/commands', { mode: 'cors', headers: { 'nightbot-channel': id } })
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
            return (STREAMER.data?.followers) || parseCoin($('.about-section span')?.getElementByText(/\d/)?.textContent)
        },

        // Gets values later...
        data: {},

        get desc() {
            return $('[data-a-target="stream-title"i]')?.textContent
        },

        get done() {
            return (async() => {
                let shop = (await STREAMER.shop)
                    .filter(({ enabled, hidden, premium }) => enabled && !(hidden || (premium && !STREAMER.paid)));

                for(let item of shop)
                    if(STREAMER.coin < item.cost)
                        return false;

                return true;
            })()
        },

        get face() {
            let balance = $('[data-test-selector="balance-string"i]');

            if(nullish(balance))
                return PostOffice.get('points_receipt_placement')?.coin_face;

            let container = balance?.closest('button'),
                icon = $('img[alt]', container);

            return icon?.src
        },

        get fiat() {
            let balance = $('[data-test-selector="balance-string"i]');

            if(nullish(balance))
                return PostOffice.get('points_receipt_placement')?.coin_name;

            let container = balance?.closest('button'),
                icon = $('img[alt]', container);

            return icon?.alt ?? 'Channel Points'
        },

        get from() {
            return 'STREAMER'
        },

        get game() {
            let element = $('[data-a-target$="game-link"i], [data-a-target$="game-name"i]'),
                name = element?.textContent,
                game = new String(name ?? "");

            Object.defineProperties(game, {
                href: {
                    value: Object.defineProperties(new String(element?.href ?? ""), {
                        steam: { get() { return $('#steam-link')?.href } },
                        playstation: { get() { return $('#playstation-link')?.href } },
                        xbox: { get() { return $('#xbox-link')?.href } },
                        nintendo: { get() { return $('#nintendo-link')?.href } },
                    }),
                },
            });

            return game ?? LIVE_CACHE.get('game')
        },

        get href() {
            return parseURL($(`a[href$="${ NORMALIZED_PATHNAME }"i]`)?.href).href
        },

        get icon() {
            let url = $(`[class*="channel"i] *:is(a[href$="${ NORMALIZED_PATHNAME }"i], [data-a-channel]) img`)?.src;

            if(typeof url == 'string')
                return Object.assign(new String(url), parseURL(url));
        },

        get jump() {
            return JUMP_DATA
        },

        get like() {
            return $.defined('[data-a-target="unfollow-button"i]')
        },

        get live() {
            return (false
                || SPECIAL_MODE
                || (true
                    && $.defined('[class*="channel"i][class*="info"i] [class*="home"i][class*="head"i] [status="live"i], [class*="channel"i][class*="info"i] [id*="live"i]:is([id*="channel"i], [id*="stream"i])')
                    && $.nullish('[class*="offline-recommendations"i], [data-test-selector="follow-panel-overlay"i]')
                    && !/(\b(?:offline|autohost)\b|^$)/i.test(null
                        ?? $.queryBy(`[class*="video-player"i] [class*="media-card"i], [class*="channel"i][class*="status"i]:is(:not([class*="offline"i], [class*="autohost"i]))`).first?.textContent
                        ?? $.queryBy(`[class*="video-player"i] [class*="media-card"i], [class*="channel"i][class*="status"i]`).first?.classList?.value
                        ?? 'offline'
                    )
                )
            )
        },

        get main() {
            return STREAMER.paid && defined($('[tt-svg-label="prime-subscription"i]')?.closest('button[data-a-target^="subscribe"i]'))
        },

        get mark() {
            let tags = [],
                f = furnish;

            $.all('.tw-tag').map(element => {
                let { href } = element.closest('a[href]');

                if(parseBool(Settings.show_stats)) {
                    let score = scoreTagActivity(href);

                    new Tooltip(element, `${ '+-'[+(score < 0)] }${ score }`, { from: 'top' });

                    element.modStyle(`border-color:#00c85a${ (255 * (score / 20)).clamp(0x40, 0xff).round().toString(16).padStart(2, '00') }`);
                }

                tags.push(href);
            });

            let score = scoreTagActivity(...tags);

            if(parseBool(Settings.show_stats) && $.nullish('#tt-mark-total'))
                when.defined(() => $('[id*="channel"i][id*="info"i] [class*="metadata"i][class*="support"i] + * div:not([class]) div[class] > *:last-child > div'))
                    .then(container => $.nullish('#tt-mark-total') && container.append(
                            f(`#tt-mark-total[style="font-size:var(--font-size-7)!important;display:inline-block!important;margin-bottom:0.5rem!important;margin-left:0.5rem!important;vertical-align:middle!important"]`).with(
                                f(`a[@score="${ score }" href="#!/score:${ score }" style="display:inline-block;border-radius:var(--border-radius-rounded);font-weight:var(--font-weight-semibold);background-color:var(--color-background-tooltip);border:var(--border-width-tag) solid #0000;color:var(--color-text-tooltip);height:2rem;max-width:100%;text-decoration:none;"]`).with(
                                    f(`[style="display:flex;-webkit-box-align:center;align-items:center;font-size:var(--font-size-7);padding:0 .8rem;"]`).with(
                                        f(`[style="white-space:nowrap;text-overflow:ellipsis;overflow:hidden"]`).with(
                                            f(`span`, {}, `Score: +${ score }`)
                                        )
                                    )
                                )
                            )
                        )
                    );

            return score
        },

        get name() {
            return $(`[class*="channel-info"i] a[href$="${ NORMALIZED_PATHNAME }"i]${ ['', ' h1'][+NORMAL_MODE] }`)?.textContent ?? LIVE_CACHE.get('name')
        },

        get paid() {
            return $.defined('[data-a-target="subscribed-button"i]')
        },

        mods: [],
        vips: [],

        /** User Levels → StreamElements | NightBot
         * Broadcaster      →   1500 | owner
         * Super Moderator  →   1000 | admin
         * Moderator        →   500  | moderator
         * VIP              →   400  | twitch_vip
         * Follower         →   300  | regular
         * Subscriber       →   250  | subscriber
         * Everyone         →   100  | everyone
         */
        get perm() {
            let level = 0;
            let levels = [
                (
                    STREAMER.name == USERNAME?
                        (level ||= 1500, 'owner'):
                    ''
                ),
                (
                    parseBool(Search.cookies?.twilight_user?.roles?.isStaff)?
                        (level ||= 1000, 'admin'):
                    ''
                ),
                (
                    (STREAMER.mods = Chat.mods).contains(mod => mod.equals(USERNAME))?
                        (level ||= 500, 'moderator'):
                    ''
                ),
                (
                    (STREAMER.vips = Chat.vips).contains(vip => vip.equals(USERNAME))?
                        (level ||= 400, 'vip'):
                    ''
                ),
                (
                    STREAMER.ping?
                        (level ||= 300, 'regular'):
                    ''
                ),
                (
                    STREAMER.paid?
                        (level ||= 250, 'subscriber'):
                    ''
                ),
                (level ||= 100, 'everyone')
            ].filter(level => level.length);

            let string = new String(levels[0]);

            Object.defineProperties(string, {
                find: {
                    value(permission) {
                        let levels = {
                            owner: 1500,
                            broadcaster: 1500,
                            administrator: 1000,
                            moderator: 500,
                            vip: 400,
                            subscriber: 300,
                            regular: 250,
                            follower: 250,
                            everyone: 100,
                            anyone: 100,
                        };

                        for(let level in levels)
                            if(level.startsWith(permission?.toLowerCase?.()))
                                return levels[level];

                        return permission;
                    }
                },
                level: { value: level },
                lacks: { value(permission) { return this.level < this.find(permission) } },
                not: { value(permission) { return this.level != this.find(permission) } },
                is: { value(permission) { return this.level == this.find(permission) } },
                has: { value(permission) { return this.level >= this.find(permission) } },
                all: { value: levels },
            });

            return string;
        },

        get ping() {
            return $.defined('[data-a-target^="live-notifications"i][data-a-target$="on"i]')
        },

        get plug() {
            return $.defined('[data-a-target*="ad-countdown"i]')
        },

        get poll() {
            return parseInt($('[data-a-target$="viewers-count"i], [class*="stream-info-card"i] [data-test-selector$="description"i]')?.textContent?.replace(/\D+/g, '')) | 0
        },

        get rank() {
            let epoch = +new Date('2019-12-16T00:00:00.000Z'),
                // epoch → when channel points where first introduced
                    // https://blog.twitch.tv/en/2019/12/16/channel-points-an-easy-way-to-engage-with-your-audience/
                start = +new Date(STREAMER.data.firstSeen),
                end = +new Date;

            start = epoch.max(start || epoch);

            let intervals = ((STREAMER.data.dailyBroadcastTime / 900_000) * (((end - start) / 86_400_000) * (STREAMER.data.activeDaysPerWeek / 7))), // How long the channel has been streaming (segmented)
                followers = (STREAMER.data.followers ?? STREAMER.cult), // The number of followers the channel has
                pointsPerInterval = 80, // The user normally gets 80 points per 15mins
                maximum = (intervals * pointsPerInterval).round();

            return (followers - (followers * (STREAMER.coin / maximum))).clamp(0, followers).round()
        },

        get redo() {
            return /^rerun$/i.test($(`[class*="video-player"i] [class*="media-card"i]`)?.textContent?.trim() ?? "")
        },

        __shop__: [],

        get shop() {
            let shop = STREAMER.jump?.[STREAMER.name?.toLowerCase?.()]?.stream?.points;

            if(nullish(shop))
                return STREAMER.__shop__;

            let { automatic = {}, custom = {} } = shop,
                inventory = [];

            let __ = { ...automatic, ...custom };
            for(let _ in __) {
                _ = __[_];

                inventory.push({
                    backgroundColor: (_.backgroundColor || _.defaultBackgroundColor || '#451093'),
                    cost: (_.cost || _.defaultCost || _.minimumCost),
                    id: _.id,
                    image: (_.image || _.defaultImage),
                    type: (_.type || "CUSTOM").toUpperCase(),

                    enabled: _.isEnabled,
                    available: parseBool(_.isInStock),
                    count: parseInt(_.redemptionsRedeemedCurrentStream) | 0,
                    hidden: (STREAMER.paid && _.isHiddenForSubs),
                    maximum: {
                        global: (_.maxPerStreamSetting?.maxPerStream * +!!_.maxPerStreamSetting?.isEnabled) | 0,
                        user: (_.maxPerUserSetting?.maxPerStream * +!!_.maxPerUserSetting?.isEnabled) | 0,
                    },
                    needsInput: parseBool(_.isUserInputRequired),
                    paused: parseBool(_.isPaused),
                    premium: parseBool(_.isSubOnly),
                    prompt: (_.prompt || ""),
                    skips: parseBool(_.shouldRedemptionsSkipRequestQueue),
                    title: (_.title || "").trim(),
                    updated: (_.updatedForIndicatorAt || _.globallyUpdatedForIndicatorAt),
                });
            }

            for(let __item__ of STREAMER.__shop__)
                if(inventory.missing(item => item.title.equals(__item__.title) && item.cost == __item__.cost))
                    inventory.push(__item__);

            return inventory.sort((a, b) => a.cost - b.cost)
        },

        get sole() {
            let [channel_id] = $.all('[data-test-selector="image_test_selector"i]').map(img => img.src).filter(src => src.contains('/panel-')).map(src => parseURL(src).pathname.split('-', 3).filter(parseFloat)).flat();

            return (0
                || parseInt(channel_id ?? LIVE_CACHE.get('sole'))
            )
        },

        get song() {
            let element = $('[class*="soundtrack"i]');
            let song = new String(element?.textContent);

            // Object.defineProperties(song, {
            //     href: { value: element?.closest('[href]')?.href }
            // });

            return song;
        },

        get tags() {
            let tags = [];

            $.all('.tw-tag').map(element => {
                let name = element.textContent.toLowerCase(),
                    { href } = element.closest('a[href]');

                tags.push(name);
                tags[name] = href;

                return name;
            });

            return tags ?? LIVE_CACHE.get('tags')
        },

        get team() {
            let element = $('[href^="/team"]'),
                team = new String((element?.textContent ?? "").trim());

            Object.defineProperties(team, {
                href: { value: element?.href }
            });

            return team
        },

        get time() {
            return parseTime($('.live-time')?.textContent ?? '0')
        },

        get tint() {
            let color = window
                ?.getComputedStyle?.($(`main a[href$="${ NORMALIZED_PATHNAME }"i]`) ?? $(':root'))
                ?.getPropertyValue?.('--color-accent');

            return (color || '#9147FF').toUpperCase()
        },

        get tone() {
            let { H, S, L, R, G, B } = Color.HEXtoColor(STREAMER.tint),
                [min, max] = [[0,30],[70,100]][+(THEME.equals('light'))];

            return Color.HSLtoRGB(H, S, (100 - L).clamp(min, max)).HEX.toUpperCase()
        },

        get aego() {
            let { H, S, L, R, G, B } = Color.HEXtoColor(STREAMER.tint);

            return Color.HSLtoRGB(H + 180, S, L).HEX.toUpperCase()
        },

        get veto() {
            return !!$.all('[id*="banned"i], [class*="banned"i]').length
        },

        get vods() {
            let { name, sole } = STREAMER;

            return fetchURL.idempotent(`https://www.twitchmetrics.net/c/${ sole }-${ name }/videos?sort=published_at-desc`)
                .then(response => response.text())
                .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                .then(DOM => $.all('[href*="/videos/"i]:not(:only-child)', DOM).map(a => ({ name: a.textContent.trim(), href: a.href })) )
                .then(vods => {
                    if(parseBool(vods.length))
                        return vods;

                    // Alternate method...
                    return fetchURL.idempotent(`https://www.twitch.tv/${ name }/videos`)
                        .then(r => r.text())
                        .then(html => {
                            let dom = (new DOMParser).parseFromString(html, 'text/html');
                            let scripts = $.all('script[type*="json"i]', dom);
                            let data = [];

                            for(let script of scripts)
                                data.push(JSON.parse(script?.innerText ?? null));
                            return data.filter(defined);
                        })
                        .then(json => {
                            for(let child of json)
                                if(child instanceof Array)
                                    for(let item of child)
                                        if(/^(ItemList)$/i.test(item['@type']))
                                            return item.itemListElement.map(({ name, url }) => (
                                                (parseURL(url).pathname.contains('/videos/'))?
                                                    { name, href: url }:
                                                null
                                            )).filter(defined);
                        });
                })
                .catch(WARN);
        },

        follow() {
            $('[data-a-target="follow-button"i]')?.click?.()
        },

        unfollow() {
            $('[data-a-target="unfollow-button"i]')?.click?.()
        },

        __eventlisteners__: {
            onhost: new Set,
            onraid: new Set,
        },

        set onhost(job) {
            STREAMER.__eventlisteners__.onhost.add(job)
        },

        set onraid(job) {
            STREAMER.__eventlisteners__.onraid.add(job)
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
    StreamerMainIcon.ondragstart ??= event => {
        event.dataTransfer.dropEffect = 'move';
    };

    // Handlers: on-raid | on-host
    STREAMER.onraid = STREAMER.onhost = async({ hosting = false, raiding = false, raided = false }) => {
        if(!hosting && !raiding && !raided)
            return;

        let next = await GetNextStreamer();

        LOG('Resetting timer. Reason:', { hosting, raiding, raided }, 'Moving onto:', next);

        Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE() });
    };

    /** Notification Array - the visible, actionable notifications
     * href:string   - link to the channel
     * icon:string   - link to the channel's image
     * live:boolean  - Is the channel live
     * name:string   - the channel's name
     */
    NOTIFICATIONS = [
        ...$.all('[data-test-selector^="onsite-notifications"i] [data-test-selector^="onsite-notification"i]')
            .map(element =>{
                let icon = $('img', element)?.src;

                return {
                    live: true,
                    href: $('a', element)?.href,
                    icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                    name: $('[class$="text"i]', element)?.textContent?.replace(/([^]+?) +(go(?:ing)?|is|went) +live\b([^$]+)/i, ($0, $1, $$, $_) => $1),
                };
            }),
    ].filter(uniqueChannels);

    // Expand the left-hand panel until the last live channel is visible
    __GetAllChannels__:
    if(true) {
        let element;

        // Is the nav open?
        let open = $.defined('[data-a-target="side-nav-search-input"i]'),
            sidenav = $('[data-a-target="side-nav-arrow"i]');

        // Open the Side Nav
        if(!open) // Only open it if it isn't already
            sidenav?.click();

        // Click "show more" as many times as possible
        show_more:
        while(defined(element = $('[id*="side"i][id*="nav"i] [data-a-target$="show-more-button"i]')))
            element.click();

        let ALL_LIVE_SIDE_PANEL_CHANNELS = $.all('[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] a').filter(e => $.nullish('[class*="--offline"i]', e));

        /** Hidden Channels Array - all channels/friends that appear on the side panel
         * href:string   - link to the channel
         * icon:string   - link to the channel's image
         * live:boolean  - Is the channel live
         * name:string   - the channel's name
         */
        ALL_CHANNELS = [
            // Current (followed) streamers
            ...$.all(`[id*="side"i][id*="nav"i] .side-nav-section a`)
                .map(element => {
                    let icon = $('img', element)?.src;
                    let streamer = {
                        from: 'ALL_CHANNELS',
                        href: element.href,
                        icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
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
                            let parent = $(`[id*="side"i][id*="nav"i] .side-nav-section [href$="${ pathname }"i]`);

                            if(nullish(parent))
                                return false;

                            // The "is it offline" result
                            let live = defined(parent) && $.nullish(`[class*="--offline"i]`, parent);

                            return live;
                        },
                        name: $('img', element)?.alt,
                    };

                    element.setAttribute('draggable', true);
                    element.ondragstart ??= event => {
                        event.dataTransfer.dropEffect = 'move';
                    };

                    // Activate (and set) the live status for the streamer
                    let { live } = streamer;

                    return streamer;
                }),
        ].filter(uniqueChannels);

        /** Channels Array - all channels/friends that appear on the side panel (except the currently viewed one)
         * @prop {string} href   - Link to the channel
         * @prop {string} icon   - Link to the channel's image
         * @prop {boolean} live  - Is the channel live
         * @prop {string} name   - The channel's name
         */
        CHANNELS = [
            // Current (followed) streamers
            ...$.all(`[id*="side"i][id*="nav"i] .side-nav-section a:not([href$="${ NORMALIZED_PATHNAME }"i])`)
                .map(element => {
                    let icon = $('img', element)?.src;
                    let streamer = {
                        from: 'CHANNELS',
                        href: element.href,
                        icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                        get live() {
                            let { href } = element,
                                url = parseURL(href),
                                { pathname } = url;

                            let parent = $(`[id*="side"i][id*="nav"i] .side-nav-section [href$="${ pathname }"i]`);

                            if(nullish(parent))
                                return false;

                            let live = defined(parent) && $.nullish(`[class*="--offline"i]`, parent);

                            return live;
                        },
                        name: $('img', element)?.alt,
                    };

                    element.setAttribute('draggable', true);
                    element.ondragstart ??= event => {
                        event.dataTransfer.dropEffect = 'move';
                    };

                    return streamer;
                }),
        ].filter(uniqueChannels);

        /** Streamers Array - all followed channels that appear on the "Followed Channels" list (except the currently viewed one)
         * @prop {string} href   - Link to the channel
         * @prop {string} icon   - Link to the channel's image
         * @prop {boolean} live  - Is the channel live
         * @prop {string} name   - The channel's name
         */
        STREAMERS = [
            // Current streamers
            ...$.all(`[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] a:not([href$="${ NORMALIZED_PATHNAME }"i])`)
                .map(element => {
                    let icon = $('img', element)?.src;
                    let streamer = {
                        from: 'STREAMERS',
                        href: element.href,
                        icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                        get live() {
                            let { href } = element,
                                url = parseURL(href),
                                { pathname } = url;

                            let parent = $(`[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] [href$="${ pathname }"i]`);

                            if(nullish(parent))
                                return false;

                            let live = defined(parent) && $.nullish(`[class*="--offline"i]`, parent);

                            return live;
                        },
                        name: $('img', element)?.alt,
                    };

                    element.setAttribute('draggable', true);
                    element.ondragstart ??= event => {
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
            && defined(element = $('[id*="side"i][id*="nav"i] [data-a-target$="show-more-button"i]'))
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
                element.ondragstart ??= event => {
                    event.dataTransfer.dropEffect = 'move';
                };

                /* Attempt to use the Twitch API */
                __FineDetails__:
                if(parseBool(Settings.fine_details)) {
                    // Get the cookie values
                    let { cookies } = Search;

                    USERNAME = window.USERNAME = cookies.login ?? USERNAME;

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
                        token = cookies.auth_token;

                    if(nullish(STREAMER.name))
                        break __FineDetails__;

                    // Get Twitch analytics data
                        // activeDaysPerWeek:number         → the average number of days the channel is live (per week)
                        // actualStartTime:Date             → the time (date) when the stream started
                        // dailyBroadcastTime:number        → the average number of hours streamed (per day)
                        // dailyStartTimes:array<string>    → an object of usual start times for the stream (strings are formatted as 24h time strings)
                        // dailyStopTimes:array<string>     → an object of usual stop times for the stream (strings are formatted as 24h time strings)
                        // dataRetrievedAt:Date             → when was the data last retrieved (successfully)
                        // dataRetrievedOK:boolean          → was the data retrieval successful
                        // daysStreaming:array<string>      → abbreviated names of days the stream is normally live
                        // projectedLastCall:Date           → the assumed last time to activate First in Line according to the user's settings
                        // projectedWindDownPeriod:Date     → the assumed "dying down" period before the stream ends (90% of the stream will have passed)
                        // projectedStopTime:Date           → the assumed time (date) when the stream will end
                        // usualStartTime:string            → the normal start time for the stream on the current day (formatted as 24h time string)
                        // usualStopTime:string             → the normal stop time for the stream on the current day (formatted as 24h time string)

                    // First, attempt to retrieve the cached data (no older than 4h)
                    try {
                        await Cache.load(`data/${ STREAMER.name }`, cache => {
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
                                STREAMER.data = { ...STREAMER.data, ...data, streamerID: STREAMER.sole };

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

                        let ErrGet = (null
                            ?? parseURL(top.location.href).searchParameters?.['tt-err-get']
                            ?? []
                        );

                        let FETCHED_OK = false;

                        // You have to make proper CORS requests to fetch HTML data! //

                        /***
                         *      _______       _ _       _       __  __      _        _
                         *     |__   __|     (_) |     | |     |  \/  |    | |      (_)
                         *        | |_      ___| |_ ___| |__   | \  / | ___| |_ _ __ _  ___ ___
                         *        | \ \ /\ / / | __/ __| '_ \  | |\/| |/ _ \ __| '__| |/ __/ __|
                         *        | |\ V  V /| | || (__| | | | | |  | |  __/ |_| |  | | (__\__ \
                         *        |_| \_/\_/ |_|\__\___|_| |_| |_|  |_|\___|\__|_|  |_|\___|___/
                         *
                         *
                         */
                        // Stream details (JSON) → /StreamerDisplayName
                            // activeDaysPerWeek:number<int>
                            // actualStartTime:string<Date-ISO>
                            // dailyBroadcastTime:number<int>
                            // dailyStartTimes:object<{ "${ Index }": string<Date-Time<{HH:MM}>>, ... }>
                            // dailyStopTimes:object<{ "${ Index }": string<Date-Time<{HH:MM}>>, ... }>
                            // dataRetrievedAt:number<Date-Absolute>
                            // dataRetrievedOK:boolean
                            // daysStreaming:array[@activeDaysPerWeek]<{ string<Date-DayName>, ... }>
                            // projectedLastCall:string<Date-ISO>
                            // projectedStopTime:string<Date-ISO>
                            // projectedWindDownPeriod:string<Date-ISO>
                            // usualStartTime:string<Date-Time<{HH:MM}>>
                            // usualStopTime:string<Date-Time<{HH:MM}>>
                        if(!FETCHED_OK) {
                            await fetchURL(`https://www.twitchmetrics.net/c/${ sole }-${ name.toLowerCase() }/stream_time_values`)
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
                                    data = { ...data, streamerID: STREAMER.sole, dataRetrievedOK: (FETCHED_OK ||= defined(data?.dailyBroadcastTime)), dataRetrievedAt: +new Date };

                                    Cache.save({ [`data/${ STREAMER.name }`]: data });
                                })
                                .catch(error => {
                                    WARN(`Failed to get STREAM details (1§1): ${ error }`)
                                        // .toNativeStack();

                                    if(!ErrGet.length)
                                        PushToTopSearch({ 'tt-err-get': 'st-tw-metrics' });
                                });

                            // Channel details (HTML → JSON)
                            await fetchURL(`https://www.twitchmetrics.net/c/${ sole }-${ name.toLowerCase() }`)
                                .then(response => response.text())
                                .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                .then(DOM => {
                                    let data = {};

                                    $.all('dt+dd', DOM).map(dd => {
                                        let name = dd.previousElementSibling.textContent.trim().toLowerCase().replace(/\s+(\w)/g, ($0, $1, $$, $_) => $1.toUpperCase()),
                                            value = dd.textContent.trim();

                                        value = (
                                            /^(followers)$/i.test(name)?
                                                parseInt(value.replace(/\D/g, '')):
                                            /^((first|last)seen)$/i.test(name)?
                                                new Date($('time', dd).getAttribute('datetime')):
                                            value
                                        );

                                        data[name] = value;
                                    });

                                    REMARK(`Channel details about "${ STREAMER.name }"`, data);

                                    return STREAMER.data = { ...STREAMER.data, ...data };
                                })
                                .then(data => {
                                    data = { ...data, streamerID: STREAMER.sole, dataRetrievedOK: (FETCHED_OK ||= defined(data?.firstSeen)), dataRetrievedAt: +new Date };

                                    Cache.save({ [`data/${ STREAMER.name }`]: data });
                                })
                                .catch(error => {
                                    WARN(`Failed to get CHANNEL details (1§2): ${ error }`)
                                        // .toNativeStack();

                                    if(!ErrGet.length)
                                        PushToTopSearch({ 'tt-err-get': 'ch-tw-metrics' });
                                });
                        }

                        /***
                         *      _______       _ _       _        _____ _        _
                         *     |__   __|     (_) |     | |      / ____| |      | |
                         *        | |_      ___| |_ ___| |__   | (___ | |_ __ _| |_ ___
                         *        | \ \ /\ / / | __/ __| '_ \   \___ \| __/ _` | __/ __|
                         *        | |\ V  V /| | || (__| | | |  ____) | || (_| | |_\__ \
                         *        |_| \_/\_/ |_|\__\___|_| |_| |_____/ \__\__,_|\__|___/
                         *
                         *
                         */
                        // Channel details (HTML → JSON) → /StreamerDisplayName
                            // TEAMS:string
                            // averageViewers:number<int>
                            // averageViewersRanked:number<int>
                            // firstSeen:object<Date>
                            // followers:number<int>
                            // followersRanked:number<int>
                            // games: object<{ "${ Game_Name }":number<int>, ... }>
                            // highestViewers:number<int>
                            // highestViewersRanked:number<int>
                            // lastSeen:object<Date>
                            // streamLang:string[2]<Language-Code>
                            // subCount:number<int>
                            // totalViews:number<int>
                            // totalViewsRanked:number<int>
                        if(!FETCHED_OK)
                            await fetchURL(`https://twitchstats.net/streamer/${ name.toLowerCase() }`)
                                .then(response => response.text())
                                .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                .then(dom => {
                                    let children = $.all('.conta > :not(:first-child, :last-child)', dom);
                                    let obj = { games: {} };

                                    let parse = (string = '') =>
                                        (
                                            /\b(da?y|h(?:ou)?r|min(?:ute)?)s?\b/i.test(string)?
                                                parseTime(string.replace(/([a-z\s,]+)/gi, ':').replace(/:?$/, '00')):
                                            /^([-])$/.test(string)?
                                                '':
                                            /^\d/.test(string)?
                                                parseFloat(string.replace(/[^\d\.]+/g, '')) + '':
                                            /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(string)?
                                                new Date(string) + '':
                                            string
                                        );

                                    parsing:
                                    for(let child of children)
                                        if($.nullish('#allgames', child))
                                            parsing_stats: for(let grandChild of child.children) {
                                                let [key, val, ...etc] = grandChild.children;

                                                key = key?.textContent?.trim();
                                                val = val?.textContent?.trim();

                                                if(!parseBool(key?.length))
                                                    continue parsing_stats;

                                                key = (key).replace(/\s+/g, '').replace(/^(?:[A-Z][a-z])/, ($0) => $0.toLowerCase());
                                                val = parse(val);

                                                switch(key) {
                                                    case 'accStart': {
                                                        key = 'firstSeen';
                                                    } break;

                                                    case 'lastOnline': {
                                                        key = 'lastSeen';

                                                        if(val.equals('now'))
                                                            val = new Date;
                                                        else
                                                            val = new Date((+new Date) - val);
                                                    } break;
                                                }

                                                obj[key] = val;

                                                for(let e of etc) {
                                                    let [k, v] = e.textContent.split(/\s+/);

                                                    obj[key + k] = parse(v);
                                                }
                                            }
                                        else
                                            parsing_games: for(let game of $.all('#allgames > *', child)) {
                                                let [name, time] = game.children;

                                                obj.games[name.textContent] = parse(time.textContent);
                                            }

                                    return obj;
                                })
                                .then(data => {
                                    data = { ...data, streamerID: STREAMER.sole, dataRetrievedOK: (FETCHED_OK ||= defined(data?.firstSeen)), dataRetrievedAt: +new Date };

                                    Cache.save({ [`data/${ STREAMER.name }`]: data });
                                })
                                .catch(error => {
                                    WARN(`Failed to get CHANNEL details (2): ${ error }`)
                                        // .toNativeStack();

                                    if(!ErrGet.length)
                                        PushToTopSearch({ 'tt-err-get': 'ch-tw-stats' });
                                });

                        /***
                         *      _______       _ _       _       _______             _
                         *     |__   __|     (_) |     | |     |__   __|           | |
                         *        | |_      ___| |_ ___| |__      | |_ __ __ _  ___| | _____ _ __
                         *        | \ \ /\ / / | __/ __| '_ \     | | '__/ _` |/ __| |/ / _ \ '__|
                         *        | |\ V  V /| | || (__| | | |    | | | | (_| | (__|   <  __/ |
                         *        |_| \_/\_/ |_|\__\___|_| |_|    |_|_|  \__,_|\___|_|\_\___|_|
                         *
                         *
                         */
                        // Channel details (JSON)
                        if(!FETCHED_OK)
                            await fetchURL(`https://twitchtracker.com/api/channels/summary/${ name.toLowerCase() }`)
                                .then(text => text.json())
                                .then(json => {
                                    let data = {};
                                    let table = {
                                        minutes_streamed: 'minutesStreamedThisMonth',
                                        avg_viewers: 'averageViewersThisMonth',
                                        max_viewers: 'maximumViewersThisMonth',
                                        hours_watched: 'hoursWatchedThisMonth',
                                        followers: 'followersThisMonth',
                                        views: 'viewsThisMonth',
                                        followers_total: 'followers',
                                        views_total: 'views',
                                    };

                                    for(let key in json)
                                        data[table[key]] = json[key];

                                    Cache.save({ [`data/${ STREAMER.name }`]: { ...data, streamerID: STREAMER.sole, dataRetrievedOK: (FETCHED_OK ||= defined(data?.followers)), dataRetrievedAt: +new Date } });
                                })
                                .catch(error => {
                                    WARN(`Failed to get CHANNEL details (3): ${ error }`)
                                        ?.toNativeStack?.();

                                    if(!ErrGet.length)
                                        PushToTopSearch({ 'tt-err-get': 'ch-tw-tracker' });
                                });

                        /*** OBSOLETE OBSOLETE OBSOLETE OBSOLETE OBSOLETE OBSOLETE OBSOLETE OBSOLETE
                         *      _______       _ _       _
                         *     |__   __|     (_) |     | |
                         *        | |_      ___| |_ ___| |__
                         *        | \ \ /\ / / | __/ __| '_ \
                         *        | |\ V  V /| | || (__| | | |
                         *        |_| \_/\_/ |_|\__\___|_| |_|
                         *
                         *
                         */
                        // Channel details (JSON)
                            // data:array<{
                            //     id:string«User ID»,
                            //     login:string«User login»,
                            //     display_name:string«User name»,
                            //     type:string<"admin" | "global_mod" | "staff" | "">,
                            //     broadcaster_type:string<"affiliate" | "partner" | "">,
                            //     description:string,
                            //     profile_image_url:string<URL>,
                            //     offline_image_url:string<URL>,
                            //     view_count:number?<integer>!Deprecated,
                            //     email:string?<e-mail>,
                            //     created_at:string<Date.UTC>,
                            // }>
                        if(!FETCHED_OK)
                            await fetchURL(`//api.twitch.tv/helix/users?id=${ STREAMER.sole }`, {
                                headers: {
                                    Authorization: Search.authorization,
                                    'Client-Id': Search.clientID,
                                },
                            })
                                .then(response => response.json())
                                .then(json => JSON.parse(json.data ?? "null"))
                                .then(json => {
                                    if(nullish(json))
                                        throw "Fine Detail JSON data could not be parsed...";

                                    REMARK('Getting fine details...', { [type]: value, cookies }, json);

                                    let conversion = {
                                        ally: 'broadcaster_type',
                                        perm: 'type',
                                        sole: 'id',
                                    };

                                    let data = {};
                                    for(let key in conversion)
                                        data[key] = json[conversion[key]];

                                    return data;
                                })
                                .then(data => {
                                    data = { ...data, streamerID: STREAMER.sole, dataRetrievedOK: (FETCHED_OK ||= defined(data?.ally)), dataRetrievedAt: +new Date };

                                    Cache.save({ [`data/${ STREAMER.name }`]: data });
                                })
                                .catch(error => {
                                    WARN(`Failed to get CHANNEL details (4): ${ error }`)
                                        .toNativeStack();

                                    if(!ErrGet.length)
                                        PushToTopSearch({ 'tt-err-get': 'ch-tw' });
                                });
                    }
                }
            };
        });

    setInterval(update, 2_5_0);

    let UP_NEXT_ALLOW_THIS_TAB = top.UP_NEXT_ALLOW_THIS_TAB = true, // Allow this tab to use Up Next
        LIVE_REMINDERS__LISTING_INTERVAL; // List the live time of Live Reminders

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
            '[data-a-target*="mature"i]:is([data-a-target*="overlay"i], [data-a-target*="accept"i]) button',
            '[data-a-target*="class"i]:is([data-a-target*="overlay"i], [data-a-target*="accept"i]) button',
            '[data-a-target*="watchparty"i] button',
            (IGNORE_ZOOM_STATE? '': '.home:not([user-intended="true"i]) [data-a-target^="home"i]')
        ].filter(s => s.length).join(','))?.click();
    };
    Timers.auto_accept_mature = 5000;

    __AutoMatureAccept__:
    if(parseBool(Settings.auto_accept_mature)) {
        RegisterJob('auto_accept_mature');

        $.all(`[class*="info"i] [href$="${ STREAMER.name }"i] [class*="title"i], main [href$="${ STREAMER.name }"i]`).map(element => {
            element.closest('div[class]').addEventListener('mousedown', async({ isTrusted, button = -1 }) => {
                !button && (await when.defined(() => $('.home')))?.setAttribute?.('user-intended', IGNORE_ZOOM_STATE = isTrusted);
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

        // Last directory in pathname
        try {
            tags = tags.map(tag => decodeURIComponent(tag.split(/\//).pop().toUpperCase()));
        } catch(error) {
            return;
        }

        scoring:
        for(let tag of tags)
            switch(tag) {
                case 'ACTION':      case '4D1EAA36-F750-4862-B7E9-D0A13970D535': // Action
                case 'ADVENTURE':   case '80427D95-BB46-42D3-BF4D-408E9BDCA49A': // Adventure
                case 'FPS':         case 'A69F7FFB-DDDA-4C05-8D7D-F0B24975A2C3': // FPS
                case 'PINBALL':     case '9386024F-DB7E-4E4F-B8DF-A73E354C5BC2': // Pinball
                case 'PLATFORMER':  case '5D289CF9-D75A-42B5-A635-0D117609E6A6': // Platformer
                case 'SHOOT':       case 'E607B115-8FA1-49C1-ACDF-F6927BE4CA1B': // Shoot
                case 'SHOOTER':     case '523FE736-FA95-44C7-B22F-13008CA2172C': // Shooter
                case 'SPORTS':      case '0D4233AF-7AC6-49DA-937D-E0F42B7DB187': // Sports
                case 'WRESTLING':   case '7199189A-0569-4854-908E-08E6C3667379': // Wrestling
                {
                    score += 20;
                } continue scoring;

                case '4X':          case '7304B834-D065-47D5-9865-C19CD17D2639': // 4X
                case 'BMX':         case 'E62CB1D5-A47D-4690-A373-FE4C0856F78B': // BMX
                case 'COSPLAY':     case '2FFD5C3E-B927-4749-BA53-79D3B626B2DA': // Cosplay
                case 'DRAG':        case '011F7C20-F533-4AD1-8093-8C6F8F75BC4C': // Drag
                case 'DRIVING':     case 'F5ED5BD0-78CB-4467-8E13-9172A210B64D': // Driving
                case 'E3':          case 'D27DA25E-1EE2-4207-BB11-DD8D54FA29EC': // E3
                case 'ESPORTS':     case '36A89A80-4FCD-4B74-B3D2-2C6FD9B30C95': // Esports
                case 'FASHION':     case '246D6E4B-B9C6-442B-9573-77028839F194': // Fashion
                case 'FIGHTING':    case '9751EE1D-0E5A-4FD3-8E9F-BC3C5D3230F0': // Fighting
                case 'GAME':        case '068C541B-DC07-4D7F-A689-5578F90905A9': // Game
                case 'IRL':         case '2610CFF9-10AE-4CB3-8500-778E6722FBB5': // IRL
                case 'MMO':         case '643FE658-C4FC-45F0-9AED-CBE54A7C1D10': // MMO
                case 'MOBA':        case '12510423-D1F6-4992-8AEA-1441A43D1DF4': // MOBA
                case 'PARTY':       case 'B1E92364-CBDA-4033-92FC-E01094C1753F': // Party
                case 'PVP':         case '8486F56B-8677-44F7-8004-000295391524': // PvP
                case 'POINT':       case '0C99BF18-5A92-4257-8974-D7A60088D1E8': // Point
                case 'RHYTHM':      case 'C8BB9D08-8202-42F8-B028-C59AC1AAFE76': // Rhythm
                case 'ROGUELIKE':   case 'CAD488FB-C95C-4BE1-B197-5B851D3A12FA': // Roguelike
                case 'VR':          case 'CA470745-C1DF-4C11-9474-9AB79DFC1863': // VR
                case 'VTUBER':      case '52D7E4CC-633D-46F5-818C-BB59102D9549': // Vtuber
                {
                    score += 15;
                } continue scoring;

                case '100%':            case 'E659959D-392F-44C5-83A5-FB959CDBACCC': // 100%
                case '12':              case 'A31DAEB5-EDC2-4B29-AFA1-84C96612836D': // 12
                case 'ACHIEVEMENT':     case '27937CEC-5CFC-4F56-B1D3-F6E1D67735E2': // Achievement
                case 'ANIME':           case '6606E54C-F92D-40F6-8257-74977889CCDD': // Anime
                case 'ARCADE':          case '7FF66192-68EF-4B69-8906-24736BF66ED0': // Arcade
                case 'ATHLETICS':       case '72340836-353F-49BF-B9BE-1AAC4F658AFE': // Athletics
                case 'AUTOBATTLER':     case 'CD2EE226-342B-4E6B-90D5-C14687006B04': // Autobattler
                case 'AUTOMOTIVE':      case '1400CA9C-84EA-414E-A85B-076A70D38ECF': // Automotive
                case 'BAKING':          case '31866A92-269D-4DF3-A2FB-58081BF97378': // Baking
                case 'BRICKBUILDING':   case 'F1E3759C-35B3-4858-A50F-8F9CAFC2660F': // Brickbuilding
                case 'CREATIVE':        case 'E36D0169-268A-4C62-A4F4-DDF61A0B3AE4': // Creative
                case 'FARMING':         case '3FFBEC21-97A2-43F9-BD73-4506A1B4D62C': // Farming
                case 'FLIGHT':          case '10D820BB-A0A9-40DF-B0D3-FE32B45419EE': // Flight
                case 'GAME SHOW':       case '6A0C6EA2-84EB-42B1-A8BB-59FD684BFE1A': // Game Show
                case 'HORROR':          case 'CF0F97AD-EFB8-4494-83EC-6A11CA30261B': // Horror
                case 'MOBILE':          case '6E23D976-33EC-47E8-B22B-3727ACD41862': // Mobile
                case 'MYSTERY':         case '6540ED8D-3282-44DF-A592-887B37881846': // Mystery
                case 'RPG':             case '9D38085E-EE62-4203-877B-81797052A18B': // RPG
                case 'RTS':             case '3E30C47A-26C0-4DD3-9C3A-9CD6AD35589C': // RTS
                case 'SURVIVAL':        case 'AE7D0652-8B2E-476B-8B51-A076550B234F': // Survival
                {
                    score += 10;
                } continue scoring;

                case 'ANIMALS':         case '3DC8F084-D886-4264-B20F-8BD5F90562B5': // Animals
                case 'ANIMATION':       case 'E3A6B378-232B-4EC2-9A82-86B72851E09A': // Animation
                case 'ART':             case 'DF448DA8-7082-45B2-92AD-C624DBA6551F': // Art
                case 'CARD':            case '8D39B307-D3AD-4F4A-98A4-D1951F55CEB7': // Card
                case 'DJ':              case 'D81D54C8-D705-4DF6-AAF0-01D715C1DBCC': // DJ
                case 'DRONES':          case 'AA971BDC-A28D-4A33-A686-F112C764E73B': // Drones
                case 'FANTASY':         case 'CB00CFE5-AE4E-4E4F-A8F1-8FA6DDEC6361': // Fantasy
                case 'GAMBLING':        case '71265475-E0B0-411E-A0CF-B93C33848B2B': // Gambling
                case 'HYPE':            case 'C2839AF5-F1D2-46C4-8EDC-1D0BFBD85070': // Hype
                case 'INDIE':           case 'D72D9DE6-1DF8-4C4E-B6A2-74E6F4C80557': // Indie
                case 'METROIDVANIA':    case '537F5D21-9CA0-4632-84F3-9A29A761D66D': // Metroidvania
                case 'OPEN':            case 'A682F560-5186-4871-B97A-8D8E3F4308E9': // Open
                case 'PUZZLE':          case '7616F6EA-7E3D-4501-A87C-C160D2BC1849': // Puzzle
                case 'SIMULATION':      case '22E434B6-CA88-46E8-91EF-C18EE1CB8A67': // Simulation
                case 'STEALTH':         case '0472BAB0-E068-49B3-9BB8-789FDFE3C66A': // Stealth
                case 'UNBOXING':        case 'CD9ED640-426D-4A08-B8E0-417A61197264': // Unboxing
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
        let detectionThreshold = (parseInt(Settings.auto_focus_detection_threshold) || STREAMER.mark).clamp(5, 75),
            pollInterval = parseInt(Settings.auto_focus_poll_interval),
            imageType = Settings.auto_focus_poll_image_type,
            detectedTrend = '&bull;';

        POLL_INTERVAL ??= pollInterval * 1000;
        STALLED_FRAMES = 0;

        if(CAPTURE_HISTORY.length > 90)
            CAPTURE_HISTORY.shift();

        CAPTURE_INTERVAL = setInterval(() => {
            let video = $.all('video').pop();

            if(nullish(video))
                return;

            let frame = video.captureFrame(`image/${ imageType }`),
                start = +new Date;

            wait(2_5_0).then(() => {
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
                        misMatchPercentage = parseFloat(misMatchPercentage) || 0;

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

                            diffDat.innerHTML = `Frame #${ totalVideoFrames.toString(36).toUpperCase() } / ${ detectedTrend } ${ misMatchPercentage }% &#866${ 3 + (trend[0].equals('d')) }; / ${ ((stop - start) / 1000).suffix('s', 2) } / ${ size.suffix('B', 2) } / ${ videoHeight }p`;
                            // diffDat.tooltip = new Tooltip(diffDat, `Frame ID / Overall Trend, Change Percentage, Current Trend / Time to Calculate Changes / Size of Changes (Bytes) / Image Resolution`, { from: 'left' });
                        } else {
                            diffImg?.remove();
                            diffDat?.remove();
                        }

                        /* Alter other settings according to the trend */
                        let changes = ['changing trend detection level'];

                        if(bias.length > 30 && GET_TIME_REMAINING() > 60_000) {
                            // Positive activity trend; disable Lurking, pause Up Next
                            if((nullish(POSITIVE_TREND) || POSITIVE_TREND === false) && bias.slice(-(30 / pollInterval)).filter(trend => trend.equals('down')).length < (30 / pollInterval) / 2) {
                                POSITIVE_TREND = true;

                                // Pause Up Next
                                __AutoFocus_Pause_UpNext__: if(UP_NEXT_ALLOW_THIS_TAB) {
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
                            else if((nullish(POSITIVE_TREND) || POSITIVE_TREND === true) && bias.slice(-(60 / pollInterval)).filter(trend => trend.equals('up')).length < (60 / pollInterval) / 5) {
                                POSITIVE_TREND = false;

                                // Resume Up Next
                                __AutoFocus_Resume_UpNext__: if(UP_NEXT_ALLOW_THIS_TAB) {
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
                            WARN('The stream seems to be stalling...', 'Increasing Auto-Focus job time...', (POLL_INTERVAL / 1000).toFixed(2) + 's →', (POLL_INTERVAL * 1.1 / 1000).toFixed(2) + 's');

                            POLL_INTERVAL *= 1.1;
                            STALLED_FRAMES = 0;

                            RestartJob('auto_focus', 'modify');
                        }
                    })
            });
        }, POLL_INTERVAL);
    };
    Timers.auto_focus = -1000;

    Unhandlers.auto_focus = () => {
        if(RestartJob.__reason__.unlike('modify'))
            $.all('#tt-auto-focus-differences, #tt-auto-focus-stats')
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
        new StopWatch('away_mode');

        let button = $('#away-mode'),
            currentQuality = (Handlers.away_mode.quality ??= await GetQuality());

        // Alt + A | Opt + A
        if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_A))
            $.on('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_A = function Toggle_Lurking({ key = '', altKey, ctrlKey, metaKey, shiftKey }) {
                if(!(ctrlKey || metaKey || shiftKey) && altKey && key.equals('a'))
                    $('#away-mode')?.click?.();
            });

        /** Return (don't activate) if
         * a) The toggle-button already exists
         * b) There is an advertisement playing
         * c) There are no quality controls
         * d) The page is a search
         */
        if(defined(button) || $.defined('[data-a-target*="ad-countdown"i]') || nullish(currentQuality) || /\/search\b/i.test(NORMALIZED_PATHNAME)) {
            // If the quality controls have failed to load for 1min, leave the page
            if(nullish(currentQuality) && ++NUMBER_OF_FAILED_QUALITY_FETCHES > 60) {
                let scapeGoat = await GetNextStreamer();

                WARN(`The following page failed to load correctly (no quality controls present): ${ STREAMER.name } @ ${ (new Date) }`)
                    ?.toNativeStack?.();

                goto(parseURL(scapeGoat.href).addSearch({ tool: 'away-mode--scape-goat' }).href);
            }

            return StopWatch.stop('away_mode');
        }

        await Cache.load({ AwayModeEnabled }, cache => AwayModeEnabled = cache.AwayModeEnabled ?? false);

        let enabled = AwayModeStatus = AwayModeEnabled || (currentQuality.low && !(currentQuality.auto || currentQuality.high || currentQuality.source));

        if(nullish(button)) {
            let sibling, parent, before,
                extra = () => {},
                placement = (Settings.away_mode_placement ??= "null");

            switch(placement) {
                // Option 1 "over" - video overlay, play button area
                case 'over': {
                    sibling = $('[data-a-target="player-controls"i] [class*="player-controls"i][class*="right-control-group"i] > :last-child');
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
                        let classes = $('button', container)?.closest('div')?.classList ?? [];

                        [...classes].map(value => {
                            if(/[-_]/.test(value))
                                return StopWatch.stop('away_mode');

                            classes.remove(value);
                        });
                    };
                } break;

                default: return StopWatch.stop('away_mode');
            }

            if(nullish(parent) || nullish(sibling))
                return StopWatch.stop('away_mode') /* || WARN('Unable to create the Lurking button') */;

            let container = furnish('#away-mode', {
                innerHTML: sibling.outerHTML.replace(/(?:[\w\-]*)(?:follow|header|notifications?|settings-menu)([\w\-]*)/ig, 'away-mode$1'),
            });

            // TODO: Add an animation for the Away Mode button appearing?
            // container.setAttribute('style', 'animation:1s fade-in-from-zero 1;');

            parent.insertBefore(container, parent[before + 'ElementChild']);

            if(['over'].contains(placement)) {
                container.firstElementChild.classList.remove('tt-mg-l-1');
            } else if(['under'].contains(placement)) {
                $('span', container)?.remove();
                $('[style]', container)?.setAttribute('style', 'opacity: 1; transform: translateX(15%) translateZ(0px);')
            }

            extra({ container, sibling, parent, before, placement });

            button = {
                enabled,
                container,
                icon: $('svg', container),
                background: $('button', container),
                get offset() { return getOffset(container) },
                tooltip: new Tooltip(container, `Turn lurking ${ ['on','off'][+enabled] } (${ GetMacro('alt+a') })`, { from: 'top', left: +5 }),
            };

            // button.tooltip.id = new UUID().toString().replace(/-/g, '');
            button.container.setAttribute('tt-away-mode-enabled', enabled);

            button.icon ??= $('svg', container);
            button.icon.outerHTML = [
                Glyphs.modify('show', { id: 'tt-away-mode--show', height: '20px', width: '20px' }).toString(),
                Glyphs.modify('hide', { id: 'tt-away-mode--hide', height: '20px', width: '20px' }).toString(),
            ].filter(defined).join('');
            button.icon = $('svg', container);
        } else {
            let container = $('#away-mode');

            button = {
                enabled,
                container,
                icon: $('svg', container),
                tooltip: Tooltip.get(container),
                get offset() { return getOffset(container) },
                background: $('button', container),
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

        let [accent, contrast] = (Settings.accent_color ?? 'blue/12').split('/');

        // if(init === true) →
        // Don't use above, event listeners won't work
        button.background?.setAttribute('style', `background:${ [`var(--user-accent-color)`, 'var(--color-background-button-secondary-default)'][+(button.container.getAttribute('tt-away-mode-enabled').equals("true"))] } !important;`);
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

            $('video ~ * .player-controls').dataset.automatic = MAINTAIN_VOLUME_CONTROL;

            // Sets the size according to the video's physical size
            let size = (parseBool(Settings.low_data_mode)? getOffset($('video')).height.floorToNearest(100): -1);

            switch(size) {
                case 0:
                case 100:
                    { size = '160p' } break;

                case 200:
                case 300:
                    { size = '360p' } break;

                case 400:
                case 500:
                    { size = '480p' } break;

                case 600:
                case 700:
                case 800:
                    { size = '720p' } break;

                default:
                    { size = 'auto' } break;
            }

            await SetQuality([size,'low'][+enabled])
                .then(() => {
                    if(parseBool(Settings.away_mode__volume_control))
                        SetVolume([InitialVolume, Settings.away_mode__volume][+enabled]);

                    if(parseBool(Settings.away_mode__hide_chat))
                        ([
                            () => SetViewMode(InitialViewMode),
                            () => SetViewMode('fullwidth'),
                        ][+enabled])();
                });

            Cache.save({ AwayModeEnabled: (AwayModeStatus = enabled) });
        };

        button.container.onmouseenter ??= event => {
            let { currentTarget } = event,
                svgContainer = $('figure', currentTarget),
                svgShow = $('svg#tt-away-mode--show', svgContainer),
                svgHide = $('svg#tt-away-mode--hide', svgContainer);
            let enabled = parseBool(currentTarget.closest('#away-mode').getAttribute('tt-away-mode-enabled'));

            svgShow?.setAttribute('preview', !enabled);
            svgHide?.setAttribute('preview', !!enabled);
        };

        button.container.onmouseleave ??= event => {
            let { currentTarget } = event,
                svgContainer = $('figure', currentTarget),
                svgShow = $('svg#tt-away-mode--show', svgContainer),
                svgHide = $('svg#tt-away-mode--hide', svgContainer);

            svgShow?.removeAttribute('preview');
            svgHide?.removeAttribute('preview');
        };

        AwayModeButton = button;

        StopWatch.stop('away_mode');
    };
    Timers.away_mode = 1000;

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

            $('video ~ * .player-controls').dataset.automatic = MAINTAIN_VOLUME_CONTROL;

            SetVolume(volume);
        };

        // Set the color and control scheme
        when.defined(() => $('video ~ * .player-controls'))
            .then(controls => controls.dataset.automatic = MAINTAIN_VOLUME_CONTROL);

        // Scheduling logic...
        when.defined(() => $('#away-mode'), 3000).then(awayMode => {
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

        if(parseInt($('[class*="pill"i]', container)?.textContent || 0) <= 0)
            return;
        let prime_btn = $('button', container);

        prime_btn.click();

        // Give the loots time to load
        when.sated(() => $.all('[href*="gaming.amazon.com"i]')).then(hrefs => {
            wait(30 *
                $.all('button[data-a-target^="prime-claim"i], [class*="prime-offer"i][class*="dismiss"i] button')
                    .map((offer, index, list) => {
                        // Give the loots time to be clicked
                        wait(30 * index, offer).then(offer => offer.click());
                    })
                .length
            ).then(() => prime_btn.click());
        });
    };
    Timers.claim_loot = -5000;

    __ClaimLoot__:
    if(parseBool(Settings.claim_loot)) {
        REMARK("Claiming Prime Gaming Loot...");

        RegisterJob('claim_loot');
    }

    /*** Claim Prime - Still requires trusted interaction
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
        Cache.load(['PrimeSubscription', 'PrimeSubscriptionReclaims'], ({ PrimeSubscription, PrimeSubscriptionReclaims }) => {
            PrimeSubscription ??= '';
            PrimeSubscriptionReclaims ??= 0;

            // Set the current streamer for auto-renewal...
            if(PrimeSubscription.length < 1 && STREAMER.main)
                Cache.save({ PrimeSubscription: (PrimeSubscription = STREAMER.sole.toString(36).toUpperCase()), PrimeSubscriptionReclaims: (PrimeSubscriptionReclaims = parseInt(Settings.claim_prime__max_claims)) });

            resubscribing:
            if(PrimeSubscription.equals(STREAMER.sole.toString(36))) {
                if(PrimeSubscriptionReclaims < 3)
                    confirm.timed(`Please review your settings. TTV Tools ${ ['was', 'is'][+!!PrimeSubscriptionReclaims] } still reclaiming your <strong>Prime Subscription</strong> for this channel!`)
                        .then(answer => {
                            // OK → Open the settings page
                            if(answer)
                                postMessage({ action: 'open-options-page' });
                            // Cancel → Remove the warning and reset the setting
                            else if(answer === false)
                                Cache.save({ PrimeSubscription: '', PrimeSubscriptionReclaims: 0 });
                        });

                if(PrimeSubscriptionReclaims < 1)
                    break resubscribing;

                let button = $('[data-a-target="subscribe-button"i]');

                if(nullish(button))
                    break resubscribing;
                button.click();

                when.defined(() => $('.channel-root .support-panel input[type="checkbox"i]:not(:checked)'))
                    .then(input => {
                        input.checked = true;
                        input.closest('.support-panel').querySelector('button:only-child')?.click();

                        when(() => STREAMER.main)
                            .then(() => {
                                Cache.save({ PrimeSubscriptionReclaims: --PrimeSubscriptionReclaims });

                                WARN(`[Prime Subscription] just renewed your subscription to ${ STREAMER.name } @ ${ (new Date).toJSON() }`)?.toNativeStack?.();
                            });
                    });
            }
        });
    };
    Timers.claim_prime = -5000;

    __ClaimPrime__:
    if(parseBool(Settings.claim_prime)) {
        REMARK("Claiming Prime Subscription...");

        RegisterJob('claim_prime');
    }

    /*** Claim Reward
     *       _____ _       _             _____                            _
     *      / ____| |     (_)           |  __ \                          | |
     *     | |    | | __ _ _ _ __ ___   | |__) |_____      ____ _ _ __ __| |
     *     | |    | |/ _` | | '_ ` _ \  |  _  // _ \ \ /\ / / _` | '__/ _` |
     *     | |____| | (_| | | | | | | | | | \ \  __/\ V  V / (_| | | | (_| |
     *      \_____|_|\__,_|_|_| |_| |_| |_|  \_\___| \_/\_/ \__,_|_|  \__,_|
     *
     *
     */
    let DISPLAY_BUY_LATER_BUTTON,
        REWARDS_ON_COOLDOWN = new Map;

    Handlers.claim_reward = () => {
        Cache.load(['AutoClaimRewards', 'AutoClaimAnswers'], async({ AutoClaimRewards, AutoClaimAnswers }) => {
            AutoClaimRewards ??= {};
            AutoClaimAnswers ??= {};

            for(let sole in AutoClaimRewards)
                if(sole == STREAMER.sole)
                    for(let rewardID of AutoClaimRewards[sole])
                        await STREAMER.shop
                            .filter(({ available, enabled, hidden, paused, premium }) => available && enabled && !(hidden || paused || (premium && !STREAMER.paid)))
                            .filter(({ id }) => id.equals(rewardID))
                            .map(async({ id, cost, title, needsInput = false, answer = null }) => {
                                if(REWARDS_ON_COOLDOWN.has(id))
                                    if(REWARDS_ON_COOLDOWN.get(id) < +new Date)
                                        REWARDS_ON_COOLDOWN.delete(id);
                                    else
                                        return;
                                else if(needsInput)
                                    // TODO - Find a way to send the message and redeem the item
                                    return; // answer = AutoClaimAnswers[sole][id];

                                cost = parseInt(cost);
                                title = title.trim();

                                await when.defined(() => $('[data-test-selector*="chat"i] [data-test-selector="community-points-summary"i] button'))
                                    .then(async rewardsMenuButton => {
                                        let { coin, fiat } = STREAMER;

                                        // LOG(`Can "${ title }" be bought yet? ${ ['No', 'Yes'][+(coin >= cost)] }`);

                                        if(coin < cost)
                                            return;

                                        rewardsMenuButton.click();

                                        LOG(`Purchasing "${ title }" for ${ cost } ${ fiat }...`);

                                        // Purchase and remove
                                        await when.defined(() => $('.rewards-list')?.getElementByText(title, 'i')?.closest('.reward-list-item')?.querySelector('button'))
                                            .then(async rewardButton => {
                                                rewardButton.click();

                                                when.defined(() => $('.reward-center-body [data-test-selector="RequiredPoints"i]')?.closest('button'), 500)
                                                    .then(purchaseButton => {
                                                        let cooldown = parseTime(purchaseButton.previousElementSibling?.getElementByText(parseTime.pattern)?.textContent);

                                                        if(cooldown > 0) {
                                                            LOG(`Unable to purchase "${ title }" right now. Waiting ${ toTimeString(cooldown) }`);
                                                            REWARDS_ON_COOLDOWN.set(id, +(new Date) + cooldown);

                                                            return false;
                                                        }

                                                        if(true
                                                            && parseBool(Settings.video_clips__trophy)
                                                            && ['SINGLE_MESSAGE_BYPASS_SUB_MODE', 'SEND_HIGHLIGHTED_MESSAGE', 'CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK', 'RANDOM_SUB_EMOTE_UNLOCK', 'CHOSEN_SUB_EMOTE_UNLOCK']
                                                                .missing(ID => ID.contains(id))
                                                        )   // Start recording, then click the button
                                                            SetQuality('auto').then(() => {
                                                                let video = $.all('video').pop();
                                                                let time = parseInt(Settings.video_clips__trophy_length) * 1000;
                                                                let name = [STREAMER.name, `${ title } (${ (new Date).toLocaleDateString(top.LANGUAGE, { dateStyle: 'short' }).replace(GetFileSystem().allIllegalFilenameCharacters, '-') })`].join(' - ');

                                                                video.dataset.trophyId = title;

                                                                let recording = new Recording(video, { name, as: name, maxTime: time, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats });

                                                                // CANNOT be chained with the above; removes `this` context (can no longer be aborted)
                                                                recording
                                                                    .then(({ target }) => target.recording.save())
                                                                    .then(link => alert.silent(`
                                                                        <video controller controls
                                                                            title="Trophy Clip Saved - ${ link.download }"
                                                                            src="${ link.href }" style="max-width:-webkit-fill-available"
                                                                        ></video>
                                                                        `)
                                                                    );

                                                                confirm.timed(`
                                                                    <div hidden controller
                                                                        icon="\uD83D\uDD34\uFE0F" title='Recording "${ STREAMER.name } - ${ title }"'
                                                                        okay="${ encodeHTML(Glyphs.modify('download', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Save"
                                                                        deny="${ encodeHTML(Glyphs.modify('trash', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Discard"
                                                                    ></div>`
                                                                , time)
                                                                    .then(answer => {
                                                                        if(answer === false)
                                                                            throw `Trophy clip discarded!`;
                                                                        recording.stop();
                                                                    })
                                                                    .catch(error => {
                                                                        alert.silent(error);
                                                                        recording.controller.abort(error);
                                                                    });
                                                            }).finally(() => {
                                                                // Click the button
                                                                purchaseButton.click();
                                                            });
                                                        else
                                                            // Click the button
                                                            purchaseButton.click();

                                                        return true;
                                                    })
                                                    .then(ok => {
                                                        if(ok)
                                                            AutoClaimRewards[sole] = AutoClaimRewards[sole].filter(i => i).filter(i => i.unlike(id));
                                                    })
                                                    .finally(() => Cache.save({ AutoClaimRewards }));
                                            });
                                    });
                            });
        });
    };
    Timers.claim_reward = 15_000;

    Unhandlers.claim_reward = () => {
        clearInterval(DISPLAY_BUY_LATER_BUTTON);
    };

    __ClaimReward__:
    // On by Default (ObD; v5.16)
    if(nullish(Settings.claim_reward) || parseBool(Settings.claim_reward)) {
        REMARK('Adding reward claimer...');

        RegisterJob('claim_reward');

        DISPLAY_BUY_LATER_BUTTON = setInterval(() => {
            let container = $('[data-test-selector="RequiredPoints"i]:not(:empty), button[disabled] [data-test-selector="RequiredPoints"i]:empty, [data-test-selector*="chat"i] svg[type*="warn"i]')
                    ?.closest?.('button, [class*="error"i]'),
                handler = $('#tt-auto-claim-reward-handler');

            // Rainbow border, Cooldown timer, Unlock all, and Modify many buttons //
            Unlock_All_Emotes: {
                let emoteCheckout = $('[class*="unlock"i][class*="emote"i][class*="checkout"i]');

                if(defined(emoteCheckout))
                    when.sated(() => $.all('[data-test-selector^="emote"i]', emoteCheckout))
                        .then(async available => {
                            available = available.length;

                            if($.defined('#tt-unlock-all-emotes') || available < 2)
                                return;

                            let item = await STREAMER.shop.find(({ title, id }) => $('#channel-points-reward-center-header')?.textContent?.equals(title) || id.toUpperCase().contains('CHOSEN_SUB_EMOTE_UNLOCK')),
                                cost = item?.cost | 0,
                                face = (STREAMER.face? furnish.img({ src: STREAMER.face }).outerHTML: Glyphs.modify('channelpoints', { height: 16, width: 16, fill: STREAMER.tint })),
                                coin = (STREAMER?.coin) | 0,
                                amount = (coin / cost).floor().clamp(0, available);

                            if(amount < 1)
                                return;

                            emoteCheckout.firstElementChild.lastElementChild.insertAdjacentElement('beforebegin', furnish(`button#tt-unlock-all-emotes.tt-button.purple[@available=${ available }][@cost=${ cost }]`, {
                                style: `margin:0.5rem 0`,

                                onmouseup({ currentTarget }) {
                                    let { available, cost } = currentTarget.dataset;

                                    // Auto-buy rewards
                                    function buyOut(count = 1) {
                                        count *= +$.defined('[class*="reward-center"i]');
                                        available |= 0;
                                        cost |= 0;

                                        if(count > 0)
                                            when.defined(() => $.all('[class*="unlock"i][class*="emote"i][class*="checkout"i] [data-test-selector^="emote"i]')?.random()?.closest('button'))
                                                .then(emote => {
                                                    emote.click();

                                                    when.defined(() => $('[class*="unlock"i][class*="emote"i][class*="checkout"i] button'))
                                                        .then(unlock => {
                                                            unlock.click();

                                                            when.defined(() => $('.reward-center-body [data-test-selector^="share"i][data-test-selector*="emote"i]'), 2_500)
                                                                .then(success => {
                                                                    EXACT_POINTS_SPENT += cost;
                                                                    $('[class*="reward-center"i] [class*="pop"i][class*="head"i] > [class*="left"i] button').click();

                                                                    wait(250).then(() => buyOut(--count));
                                                                });
                                                        });
                                                });
                                        else
                                            $('[class*="reward-center"i] [class*="pop"i][class*="head"i] > [class*="right"i]:last-of-type')?.click();
                                    }

                                    buyOut(amount);
                                },

                                innerHTML: `Unlock ${ amount >= available? `all (${ available })`: amount } ${ 'emote'.pluralSuffix(amount) }${ (cost > 0? ` for ${ (cost * amount).suffix('',1).replace('.0','') }`: '') }`
                            }));
                        });
            }

            Modify_All_Emotes: {
                let emoteCheckout = $('[class*="modify"i][class*="emote"i][class*="checkout"i]'),
                    modifiers = 'BW HF SG SQ TK'.split(' '),
                    modified = new Map;

                if(defined(emoteCheckout))
                    when.sated(() => $.all('[data-test-selector^="emote"i]', emoteCheckout))
                        .then(async available => {
                            available = available.length * modifiers.length;

                            if($.defined('#tt-modify-all-emotes') || available < 2)
                                return;

                            let item = await STREAMER.shop.find(({ title, id }) => $('#channel-points-reward-center-header')?.textContent?.equals(title) || id.toUpperCase().contains('MODIFY_SUB_EMOTE')),
                                cost = item?.cost | 0,
                                face = (STREAMER.face? furnish.img({ src: STREAMER.face }).outerHTML: Glyphs.modify('channelpoints', { height: 16, width: 16, fill: STREAMER.tint })),
                                coin = (STREAMER?.coin) | 0,
                                amount = (coin / cost).floor().clamp(0, available);

                            if(amount < 1)
                                return;

                            emoteCheckout.firstElementChild.lastElementChild.insertAdjacentElement('beforebegin', furnish(`button#tt-modify-all-emotes.tt-button.purple[@available=${ available }][@cost=${ cost }][@modifiers=${ modifiers }]`, {
                                style: `margin:0.5rem 0`,

                                onmouseup({ currentTarget }) {
                                    let { available, modifiers, cost } = currentTarget.dataset;

                                    modifiers = modifiers.split(',');

                                    // Auto-buy rewards
                                    function buyOut(count = 1) {
                                        let rewardsBackButton = $('[class*="reward-center"i] [class*="pop"i][class*="head"i] > [class*="left"i] button');

                                        count *= +$.defined('[class*="reward-center"i]');
                                        available |= 0;
                                        cost |= 0;

                                        if(count > 0)
                                            when.defined(() => $.all('[class*="modify"i][class*="emote"i][class*="checkout"i] [data-test-selector^="emote"i]')?.random()?.closest('button'), 500)
                                                .then(emote => {
                                                    emote.click();

                                                    when.defined(() => $.all('[class*="reward-center"i] button:not(:disabled) img')?.random()?.closest('button'), 1000)
                                                        .then(modifier => {
                                                            modifier.click();

                                                            when.defined(() => $('button [class*="selected"i] img')).then(img => {
                                                                let name = $('[class*="modify"i][class*="emote"i][class*="checkout"i] [data-test-selector*="modify"i][data-test-selector*="emote"i][data-test-selector*="preview"i]')?.textContent;

                                                                if(nullish(name))
                                                                    return /* There should always be a name */;

                                                                let [em, md] = name.split('_', 2);

                                                                if(!modified.has(em))
                                                                    modified.set(em, [md]);
                                                                else if(modified.get(em)?.missing(md))
                                                                    modified.set(em, [...modified.get(em), md]);
                                                                else // if(modified.get(em).length >= modifiers.length)
                                                                    return buyOut(count, rewardsBackButton?.click());

                                                                REMARK(`Buying emote: "${ name }" for ${ cost }`);

                                                                when.defined(() => $('[class*="modify"i][class*="emote"i][class*="checkout"i] [data-test-selector*="modify-emote-preview"i] ~ * ~ * button'), 250)
                                                                    .then(unlock => {
                                                                        unlock.click();

                                                                        when.defined(() => $(`[data-a-target*="animat"i] img[alt="${ name }"i]`), 2_500)
                                                                            .then(success => {
                                                                                EXACT_POINTS_SPENT += cost;
                                                                                rewardsBackButton?.click();

                                                                                wait(500).then(() => buyOut(--count));
                                                                            });
                                                                    });
                                                            });
                                                        });

                                                    wait(1200).then(() => {
                                                        if($.nullish('[class*="reward-center"i] button:not(:disabled) img')) {
                                                            rewardsBackButton?.click();

                                                            when.defined(() => $.all('[class*="modify"i][class*="emote"i][class*="checkout"i] [data-test-selector^="emote"i]')?.random()?.closest('button'), 500)
                                                                .then(emote => emote.click());
                                                        }
                                                    });
                                                });
                                        else
                                            $('[class*="reward-center"i] [class*="pop"i][class*="head"i] > [class*="right"i]:last-of-type')?.click();
                                    }

                                    buyOut(amount);
                                },

                                innerHTML: `Modify ${ amount >= available? available: amount } ${ 'emote'.pluralSuffix(amount) }${ (cost > 0? ` for ${ (cost * amount).suffix('',1).replace('.0','') }`: '') }`
                            }));
                        });
            }

            Wallet_Display: {
                let rewards = $.all('.rewards-list .reward-list-item:not([tt-wallet])');

                if(rewards.length < 1)
                    break Wallet_Display;

                Cache.load('AutoClaimRewards', async({ AutoClaimRewards }) => {
                    AutoClaimRewards ??= {};

                    rewards.map(async reward => {
                        let $image = $('img', reward)?.src,
                            $cost = parseCoin($('[data-test-selector="cost"i]', reward)?.textContent),
                            $title = ($('button ~ * [title]', reward)?.textContent || '').trim();

                        let [item] = await STREAMER.shop.filter(({ type = 'UNKNOWN', id = '', title = '', cost = 0, image = '' }) =>
                            (false
                                || (type.equals("unknown") && id.equals(UUID.from([$image, $title.mutilate(), $cost].join('|$|'), true).value))
                                || (title.equals($title) && (cost == $cost || image.url.equals($image.url)))
                            )
                        );

                        // Variable animataion speed depending on "completion" percentage
                        let child = $('[data-test-selector="cost"i]', reward);

                        // Rainbow border
                        child.setAttribute('style', `animation-duration:${ (1 / (STREAMER.coin / $cost)).clamp(1, 30).toFixed(2) }s`);
                        child.setAttribute('rainbow-border', (AutoClaimRewards[STREAMER.sole] ??= []).contains(item?.id));

                        // Cooldown timer
                        if(REWARDS_ON_COOLDOWN.has(item?.id))
                            child.closest('.reward-list-item').setAttribute('timed-out', toTimeString((REWARDS_ON_COOLDOWN.get(item?.id) - +new Date).clamp(0, +Infinity), 'clock'));
                    });
                });
            }

            if(nullish(container) || defined(handler))
                return;

            let f = furnish;

            Cache.load('AutoClaimRewards', async({ AutoClaimRewards }) => {
                AutoClaimRewards ??= {};

                let [head, body] = container.closest('[class*="reward"i][class*="content"i], [class*="chat"i][class*="input"i]:not([class*="error"i])').children,
                    $title = ($('#channel-points-reward-center-header', head)?.textContent || '').trim(),
                    $prompt = ($('.reward-center-body p', body)?.textContent || '').trim(),
                    $image = $('.reward-icon img', body)?.src,
                    [$cost = 0] = (($('[disabled]', body) ?? $('[class*="reward"i][class*="header"i]', head))?.innerText?.split(/\s/)?.map(parseCoin)?.filter(n => n > 0) ?? []);

                let [item] = await STREAMER.shop.filter(({ type = 'UNKNOWN', id = '', title = '', cost = 0, image = '' }) =>
                    (false
                        || (type.equals("unknown") && id.equals(UUID.from([$image, $title.mutilate(), $cost].join('|$|'), true).value))
                        || (type.unlike("custom") && cost == $cost && id.equals([STREAMER.sole, type].join(':')))
                        || (title.equals($title) && (cost == $cost || image?.url?.equals($image?.url)))
                    )
                );

                if(nullish(item))
                    return;

                let itemIDs = (AutoClaimRewards[STREAMER.sole] ??= []),
                    rewardID = item.id;

                let textContent = (
                    itemIDs.contains(rewardID)?
                        'Do not buy':
                    'Buy when available'
                );

                $('[id$="header"i], [class*="header"i]', head)?.setAttribute('style', `animation-duration:${ (1 / (STREAMER.coin / $cost)).clamp(1, 30).toFixed(2) }s`);
                $('[id$="header"i], [class*="header"i]', head)?.setAttribute('rainbow-text', itemIDs.contains(rewardID));

                container.insertAdjacentElement('afterend',
                    f(`#tt-auto-claim-reward-handler[data-tt-reward-id=${ rewardID }]`).with(
                        f('.tt-inline-flex.tt-relative').with(
                            f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative',
                                {
                                    style: `padding:1rem;text-align:center;min-width:fit-content;width:${ getOffset(container).width.ceil() }px!important`,

                                    async onmouseup({ currentTarget }) {
                                        let rewardID = currentTarget.closest('[data-tt-reward-id]')?.dataset?.ttRewardId;
                                        let [item] = await STREAMER.shop.filter(({ id }) => id.equals(rewardID));

                                        if(nullish(item))
                                            return;

                                        Cache.load(['AutoClaimRewards', 'AutoClaimAnswers'], async({ AutoClaimRewards, AutoClaimAnswers }) => {
                                            AutoClaimRewards ??= {};
                                            AutoClaimAnswers ??= {};

                                            let itemIDs = (AutoClaimRewards[STREAMER.sole] ??= []);
                                            let answers = (AutoClaimAnswers[STREAMER.sole] ??= {});
                                            let index = itemIDs.indexOf(rewardID);
                                            let ID = itemIDs[index];

                                            if(!!~index) {
                                                delete answers[ID];
                                                itemIDs.splice(index, 1);
                                            } else {
                                                if(item.needsInput) {
                                                    answers[ID] = await prompt.silent(`<div hidden controller title='Input required to redeem "${ item.title }"'></div>${ item.prompt || `Please provide input...` }`);

                                                    if(answers[ID] === null)
                                                        return /* The user pressed "Cancel" */;
                                                }

                                                itemIDs.push(rewardID);
                                            }
                                            itemIDs = itemIDs.filter(defined);
                                            answers = Object.filter(answers, itemIDs);

                                            if(!itemIDs.length) {
                                                // No more redemptions in this queue :D
                                                delete AutoClaimRewards[STREAMER.sole];
                                                delete AutoClaimAnswers[STREAMER.sole];
                                            } else {
                                                // There are some redemptions to watch for...
                                                AutoClaimRewards[STREAMER.sole] = itemIDs;
                                                AutoClaimAnswers[STREAMER.sole] = answers;
                                            }

                                            let [node] = [...currentTarget.childNodes].filter(node => node.nodeName.equals('#text'));

                                            node.textContent = (
                                                !~index?
                                                    'Do not buy':
                                                'Buy when available'
                                            );

                                            currentTarget.closest('[class*="reward"i][class*="content"i]')?.querySelector('[id$="header"i]')?.setAttribute('rainbow-text', !~index);

                                            Cache.save({ AutoClaimRewards, AutoClaimAnswers });
                                        });
                                    },
                                },

                                f('[style=height:2rem; width:2rem]', {
                                    innerHTML: Glyphs.modify('wallet', { style: 'padding-right:.2rem' })
                                }),

                                textContent
                            )
                        )
                    )
                );
            });

            $('.reward-center-body img')?.closest(':not(img,:only-child)')?.setAttribute('tt-rewards-calc', 'after');
        }, 300);
    }


    /*** Claim Drops
     *       _____ _       _             _____
     *      / ____| |     (_)           |  __ \
     *     | |    | | __ _ _ _ __ ___   | |  | |_ __ ___  _ __  ___
     *     | |    | |/ _` | | '_ ` _ \  | |  | | '__/ _ \| '_ \/ __|
     *     | |____| | (_| | | | | | | | | |__| | | | (_) | |_) \__ \
     *      \_____|_|\__,_|_|_| |_| |_| |_____/|_|  \___/| .__/|___/
     *                                                   | |
     *                                                   |_|
     */
    let TTV_DROPS_FRAME,
        TTV_DROPS_CHECKER,
        TTV_DROPS_REFRESHER;

    Handlers.claim_drops = () => {
        TTV_DROPS_FRAME = furnish('iframe#tt-drops-claimer[src="/drops/inventory"]', { style: 'display:none!important' });

        $.body.append(TTV_DROPS_FRAME);

        (TTV_DROPS_CHECKER = btn_str => {
            when(() => $.defined(btn_str, TTV_DROPS_FRAME.contentDocument)).then(() => {
                $.all(btn_str, TTV_DROPS_FRAME.contentDocument).map(btn => btn.click());
            }).then(() => TTV_DROPS_CHECKER(btn_str));
        })('.tw-tower *:not([class*="tooltip"i]) > button:not([class*="image"i])');

        TTV_DROPS_REFRESHER = setInterval(() => {
            TTV_DROPS_FRAME.src = parseURL(TTV_DROPS_FRAME.src).addSearch({ contentReload: Date.now() }).href;
        }, parseInt(Settings.claim_drops__interval ?? 10) * 60_000);
    };
    Timers.claim_drops = -5_000;

    Unhandlers.claim_drops = () => {
        TTV_DROPS_FRAME?.remove();
        clearInterval(TTV_DROPS_REFRESHER);
    };

    __ClaimDrops__:
    if(parseBool(Settings.claim_drops)) {
        REMARK('Creating Drop claimer...');

        RegisterJob('claim_drops');
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
        // REDO_FIRST_IN_LINE_QUEUE(url:string?<URL>, search:object?) → <Promise>?undefined
    top.REDO_FIRST_IN_LINE_QUEUE =
    async function REDO_FIRST_IN_LINE_QUEUE(url, search = null) {
        if(nullish(url) || (FIRST_IN_LINE_HREF === url && [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].filter(nullish).length <= 0))
            return;
        else if(nullish(search))
            url = parseURL(url);
        else
            url = parseURL(url).addSearch(search, true);

        let { href, pathname } = url,
            name = pathname.slice(1),
            channel = await(null
                ?? ALL_CHANNELS.find(channel => channel.name.equals(name))
                ?? new Search(name).then(Search.convertResults)
            );

        if(nullish(channel))
            return ERROR(`Unable to create job for "${ href }"`);

        [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

        FIRST_IN_LINE_HREF = href;
        GetNextStreamer.cachedStreamer = channel;
        name = (channel.name?.equals(name)? channel.name: name);

        if(!ALL_FIRST_IN_LINE_JOBS.filter(href => href?.length).length)
            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

        LOG(`[Queue Redo] Waiting ${ toTimeString(GET_TIME_REMAINING() | 0) } before leaving for "${ name }" → ${ href }`, new Date);

        FIRST_IN_LINE_WARNING_JOB = setInterval(() => {
            let timeRemaining = GET_TIME_REMAINING();

            timeRemaining = timeRemaining < 0? 0: timeRemaining;

            // TODO: Figure out a single pause controller for First in Line...
            if(!UP_NEXT_ALLOW_THIS_TAB)
                return;
            if(FIRST_IN_LINE_PAUSED)
                return; // Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) });
            if(timeRemaining > 60_000)
                return /* There's more than 1 minute left */;

            if(defined(STARTED_TIMERS.WARNING))
                return /* There is already a warning pending */;

            STARTED_TIMERS.WARNING = true;

            LOG('Heading to stream in', toTimeString(timeRemaining), FIRST_IN_LINE_HREF, new Date);

            let url = parseURL(FIRST_IN_LINE_HREF);
            let { name } = GetNextStreamer.cachedStreamer;

            if(url.pathname.slice(1).unlike(name))
                name = url.pathname.slice(1);

            confirm
                .timed(`<div hidden controller title="${ (Settings.stream_preview? `Up next: ${ name }`: 'Coming up next...') }" okay="Go now" deny="Skip ${ name }"></div>${ (Settings.stream_preview? '': `Up next: <a href="${ url.href }">${ name }</a>`) }`, timeRemaining)
                .then(action => {
                    if(nullish(action))
                        return /* The event timed out... */;

                    let thisJob = ALL_FIRST_IN_LINE_JOBS.indexOf(FIRST_IN_LINE_HREF),
                        [removed] = ALL_FIRST_IN_LINE_JOBS.splice(thisJob, 1),
                        name = parseURL(removed).pathname.slice(1);

                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(FIRST_IN_LINE_TIMER);

                    // Confirmation OK
                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: parseBool(parseURL(removed).searchParameters?.redo) });

                    // FIX-ME: Pressing "Skip" may destroy the queue (logically)
                    Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                        if(action) {
                            // The user clicked "OK"

                            goto(parseURL(FIRST_IN_LINE_HREF).addSearch({ tool: 'first-in-line--ok' }).href);
                        } else {
                            // The user clicked "Cancel"
                            LOG('Canceled First in Line event', FIRST_IN_LINE_HREF);

                            let { pathname } = parseURL(FIRST_IN_LINE_HREF);
                            let balloonChild = $(`[id^="tt-balloon-job"i][href$="${ pathname }"i]`),
                                animationID = (balloonChild?.getAttribute('animationID')) || -1;

                            $(`button[data-test-selector$="delete"i]`, balloonChild)?.click();

                            clearInterval(animationID);
                            balloonChild?.remove();
                        }
                    });
                });

            when.defined(() => $('.tt-confirm-container'))
                .then(container => {
                    $.body.append(furnish('style').with(`.tt-confirm-header { background:#0008 } .tt-confirm-body, .tt-confirm-footer { background:#0000; text-shadow:0 0 1rem #000 }`));
                    container.append(furnish(`iframe[src=https://player.twitch.tv/?channel=${ name }&controls=false&muted=true&parent=twitch.tv&quality=160p]`, { style: 'position:absolute;top:4px;z-index:-9;padding:0;max-width:calc(100% - 4px);max-height:calc(100% - 4px);border-radius:inherit' }));
                });
        }, 1000);

        FIRST_IN_LINE_JOB = setInterval(() => {
            // If the channel disappears (or goes offline), kill the job for it
            // FIX-ME: Reanimating First in Line jobs may cause reloading issues?
            let index = ALL_CHANNELS.findIndex(channel => RegExp(parseURL(channel.href).pathname + '\\b', 'i').test(FIRST_IN_LINE_HREF)),
                channel = ALL_CHANNELS[index],
                timeRemaining = GET_TIME_REMAINING();

            timeRemaining = timeRemaining < 0? 0: timeRemaining;

            // The timer is paused
            if(!UP_NEXT_ALLOW_THIS_TAB)
                return;
            if(FIRST_IN_LINE_PAUSED)
                return; // Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) });

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
                            icon: (typeof streamer.icon == 'string'? Object.assign(new String(streamer.icon), parseURL(streamer.icon)): null),
                            live: parseBool(streamer.live),
                            name: streamer.name,
                        });

                        ALL_CHANNELS = [...ALL_CHANNELS, restored].filter(defined).filter(uniqueChannels);
                        ALL_FIRST_IN_LINE_JOBS[index] = restored;
                    })
                    .catch(error => {
                        ALL_FIRST_IN_LINE_JOBS = ALL_FIRST_IN_LINE_JOBS.map(url => url?.toLowerCase?.()).isolate().filter(url => url?.length).filter(url => !RegExp(url, 'i').test(FIRST_IN_LINE_HREF));
                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                        Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                            WARN(error);
                        });
                    });
            }

            // Don't act until 1sec is left
            if(timeRemaining > 1000)
                return;

            /* After above is `false` */

            Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(), ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS = ALL_FIRST_IN_LINE_JOBS.filter(url => parseURL(url).pathname.toLowerCase() != parseURL(FIRST_IN_LINE_HREF).pathname.toLowerCase()) }, (href = channel?.href ?? FIRST_IN_LINE_HREF) => {
                LOG('Heading to stream now [Job Interval]', href);

                [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                goto(parseURL(href).addSearch({ tool: 'first-in-line--timeout' }).href);
            });
        }, 1000);
    };

    top.NEW_DUE_DATE =
    function NEW_DUE_DATE(offset) {
        if(!UP_NEXT_ALLOW_THIS_TAB)
            return (+new Date) + 3_600_000;

        return (+new Date) + (null
            ?? offset
            ?? FIRST_IN_LINE_WAIT_TIME * 60_000
        );
    };

    top.GET_TIME_REMAINING =
    function GET_TIME_REMAINING() {
        if(!UP_NEXT_ALLOW_THIS_TAB)
            return 3_600_000;

        let now = (+new Date),
            due = FIRST_IN_LINE_DUE_DATE;

        return (due - now);
    };

    if(parseBool(Settings.up_next__one_instance))
        Runtime.sendMessage({ action: 'CLAIM_UP_NEXT' }, async({ owner = true }) => {
            UP_NEXT_ALLOW_THIS_TAB = top.UP_NEXT_ALLOW_THIS_TAB = owner;

            LOG('This tab is the Up Next owner', owner);

            if(UP_NEXT_ALLOW_THIS_TAB) {
                // Search helpers...
                    // https://chrome.google.com/webstore/detail/twitch-username-and-user/laonpoebfalkjijglbjbnkfndibbcoon
                Cache.load(['clientID', 'oauthToken'], async({ clientID = 's8glgfv1nm23ts567xdsmwqu5wylof', oauthToken }) => {
                    if(clientID?.equals('.DENIED') || oauthToken?.equals('.DENIED'))
                        return;

                    if(nullish(clientID) || nullish(oauthToken)) {
                        fetchURL(`https://id.twitch.tv/oauth2/token`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: top['atоb']("zqlTBes8gqKcjgx6Bql2B2zlFm8Pxok9AEzouQk9FgWlWEvoueliBpBMFQKKF2kyYqvMYmv8je5czqRoxq5+Y2Lfugc8uOW2JgRoWEHsFEC8AQ69FUB2YmSrWSa8ugLKjeAnwevrWSaMYmvcBes8weSnYPB9WQS8BEhrWeln")
                        }).then(response => response.json()).then(({ access_token, expires_in, token_type, error, error_description }) => {
                            if(error && error_description)
                                throw new Error(`${ error }: ${ error_description }`);
                            oauthToken = access_token;

                            Cache.save({ oauthToken, clientID });

                            Search.authorization = `Bearer ${ oauthToken }`;
                            Search.clientID = clientID;
                        }).catch(error => {
                            WARN(error);

                            confirm(`<div controller
                                okay="Grant access"
                                deny="Never ask again"
                                >TTV Tools would like to use Twitch's APIs on your behalf.</div>`)
                            .then(answer => {
                                if(answer === false)
                                    return Cache.save({ clientID: '.DENIED', oauthToken: '.DENIED' });

                                let oauth = open(`https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${ clientID }&redirect_uri=${ encodeURIComponent("https://ephellon.github.io/") }&response_type=token&scope=${ encodeURIComponent(['user:read:follows', 'user:read:subscriptions', 'chat:read'].join('+')) }&state=${ (new UUID).value }`, '_blank');

                                when(() => oauth.closed).then(async() => {
                                    let { oauthToken } = await Settings.get('oauthToken');

                                    Cache.save({ oauthToken, clientID });

                                    Search.authorization = `Bearer ${ oauthToken }`;
                                    Search.clientID = clientID;
                                });
                            });
                        });
                    } else {
                        Cache.save({ oauthToken, clientID });

                        Search.authorization = `Bearer ${ oauthToken }`;
                        Search.clientID = clientID;
                    }
                });
            } else {
                Cache.load(['clientID', 'oauthToken'], async({ clientID = 's8glgfv1nm23ts567xdsmwqu5wylof', oauthToken }) => {
                    if(false
                        || nullish(clientID)
                        || nullish(oauthToken)
                        || clientID.equals('.DENIED')
                        || oauthToken.equals('.DENIED')
                    )
                        return;

                    fetchURL(`https://id.twitch.tv/oauth2/validate`, {
                        method: 'GET',
                        headers: { Authorization: `OAuth ${ oauthToken }` },

                        timeout: 30_000,
                    }).then(response => response.json()).then(({ client_id, login, scopes, user_id, expires_in, status, message }) => {
                        if(status && message)
                            throw new TypeError(`HTTP Error (${ status }): ${ message }`);

                        Search.authorization = `Bearer ${ oauthToken }`;
                        Search.clientID = client_id;

                        Cache.save({ clientID: clientID, oauthToken });
                    }).catch(error => {
                        WARN(error);

                        fetchURL(`https://id.twitch.tv/oauth2/token`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: top['atоb']("zqlTBes8gqKcjgx6Bql2B2zlFm8Pxok9AEzouQk9FgWlWEvoueliBpBMFQKKF2kyYqvMYmv8je5czqRoxq5+Y2Lfugc8uOW2JgRoWEHsFEC8AQ69FUB2YmSrWSa8ugLKjeAnwevrWSaMYmvcBes8weSnYPB9WQS8BEhrWeln")
                        }).then(response => response.json()).then(({ access_token, expires_in, token_type, error, error_description }) => {
                            if(error && error_description)
                                throw new Error(`${ error }: ${ error_description }`);
                            oauthToken = access_token;

                            Cache.save({ oauthToken, clientID });

                            Search.authorization = `Bearer ${ oauthToken }`;
                            Search.clientID = clientID;
                        }).catch(WARN);
                    });
                });
            }
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
            wait(60_000).then(() => {
                WARN(`Mitigation for Up Next: Loose interval @ ${ location } / ${ new Date }`)
                    ?.toNativeStack?.();

                let { name } = GetNextStreamer.cachedStreamer;

                confirm
                    .timed(`Coming up next: <a href='./${ name }'>${ name }</a>`, timeRemaining)
                    .then(action => {
                        if(nullish(action))
                            return /* The event timed out... */;

                        // Does NOT touch the cache

                        if(action) {
                            // The user clicked "OK"

                            goto(`./${ name }?tool=up-next--ok`);
                        } else {
                            // The user clicked "Cancel"
                            let balloonChild = $(`[id^="tt-balloon-job"i][href$="/${ name }"i]`),
                                animationID = (balloonChild?.getAttribute('animationID')) || -1;

                            clearInterval(animationID);
                            balloonChild?.remove();
                        }
                    });

                // top.open(href, '_self');
            });

        clearInterval(FIRST_IN_LINE_SAFETY_CATCH);
    }, 1000);

    let FIRST_IN_LINE_BALLOON__INSURANCE =
    setInterval(() => {
        if(NORMAL_MODE && nullish(FIRST_IN_LINE_BALLOON)) {
            FIRST_IN_LINE_BALLOON = new Balloon({ title: 'Up Next', icon: (UP_NEXT_ALLOW_THIS_TAB? 'calendar': 'error') });

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
                    speeding = (FIRST_IN_LINE_BOOST &&= ALL_FIRST_IN_LINE_JOBS?.length > 0);

                    currentTarget.querySelector('svg[fill]')?.setAttribute('fill', 'currentcolor');
                    currentTarget.querySelector('svg[fill]')?.setAttribute('style', `opacity:${ 2**-!speeding }; fill:currentcolor`);
                    currentTarget.setAttribute('speeding', speeding);

                    if(defined(currentTarget.tooltip))
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

                    $.all(`[up-next--body] [time]`).forEach(element => element.setAttribute('time', FIRST_IN_LINE_TIMER));

                    Cache.save({ FIRST_IN_LINE_BOOST, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME });
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
                        paused = parseBool(currentTarget.getAttribute('paused')?.equals('true'));

                    paused = !paused;

                    currentTarget.innerHTML = Glyphs[['pause','play'][+paused]];
                    currentTarget.setAttribute('paused', FIRST_IN_LINE_PAUSED = paused);

                    if(defined(currentTarget.tooltip))
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

                    Cache.load(['LiveReminders', 'ChannelPoints', 'DVRChannels'], async({ LiveReminders = null, ChannelPoints = {}, DVRChannels = null }) => {
                        try {
                            LiveReminders = JSON.parse(LiveReminders || '{}');
                        } catch(error) {
                            // Probably an object already...
                            LiveReminders ??= {};
                        }

                        try {
                            DVRChannels = JSON.parse(DVRChannels || '{}');
                        } catch(error) {
                            // Probably an object already...
                            DVRChannels ??= {};
                        }

                        let Hash = {
                            live_reminders: UUID.from(JSON.stringify(LiveReminders)).value,
                            dvr_channels: UUID.from(JSON.stringify(DVRChannels)).value,
                        };

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

                        body = f(`#tt-reminder-listing`);

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
                            return await alert.timed(`There are no Live Reminders to display<p tt-x>${ (new UUID) }</p>`, 7000);

                        listing:
                        for(let index = 0; index < reminders.length; ++index) {
                            if($.nullish(`#tt-reminder-listing`))
                                break listing;

                            let { length } = reminders;
                            let { name, time } = reminders[index];
                            let channel = await(null
                                ?? ALL_CHANNELS.find(channel => channel.name.equals(name))
                                ?? new Search(name).then(Search.convertResults)
                            ),
                                ok = parseBool(channel?.ok);

                            // Search did not complete...
                            let num = 3;
                            while(!ok && num-- > 0 && $.defined(`#tt-reminder-listing`)) {
                                Search.void(name);

                                channel = await when.defined(() => new Search(name).then(Search.convertResults), 500);
                                ok = parseBool(channel?.ok);

                                // WARN(`Re-search, ${ num } ${ 'retry'.pluralSuffix(num) } left [Catalog]: "${ name }" → OK = ${ ok }`);
                            }

                            let [amount, fiat, face, notEarned, pointsToEarnNext] = (ChannelPoints[name] ?? 0).toString().split('|'),
                                sole = face?.split('/')?.map(parseFloat)?.shift();

                            // Correct for changed usernames
                            if(!ok) {
                                let definitiveID = await new Search(name, 'sniffer', 'getID');

                                if(nullish(definitiveID)) {
                                    let real = await new Search(sole, 'sniffer', 'getName');

                                    WARN(`Updating details about (#${ sole }) "${ name }" → "${ real }"`);

                                    // Correct the cache...
                                    Cache.load(`data/${ name }`, cache => {
                                        Cache.save({ [`data/${ real }`]: cache[`data/${ name }`] });
                                        Cache.remove(`data/${ name }`);
                                    });

                                    // Correc the channel points...
                                    ChannelPoints[real] = ChannelPoints[name];
                                    delete ChannelPoints[name];

                                    Cache.save({ ChannelPoints });

                                    // Correct the live reminders...
                                    LiveReminders[real] = LiveReminders[name];
                                    delete LiveReminders[name];

                                    Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));

                                    // Continue with the new name...
                                    reminders.push({ name: real, time });

                                    continue listing;
                                }
                            }

                            // Legacy reminders... | v4.26 → v4.27
                            let legacy = +now < +time;

                            if(nullish(channel))
                                continue listing;

                            let day = time.toLocaleDateString(top.LANGUAGE, { dateStyle: 'short' }),
                                hour = time.toLocaleTimeString(top.LANGUAGE, { timeStyle: 'short' }),
                                recent = (abs(+now - +time) / 3_600_000 < 24),
                                live = (channel.live || await new Search(name, 'channel', 'status.live') || abs(+now - +time) / 3_600_000 < 1/3),
                                [since] = toTimeString(abs(+now - +time), '~hour hour|~minute minute|~second second').split('|').filter(parseFloat),
                                [tense_A, tense_B] = [['',' ago'],['in ','']][+legacy];

                            let _name = name.toLowerCase();
                            let { href = `./${ _name }`, icon = Runtime.getURL('profile.png'), desc = (STREAMER.jump?.[_name]?.title ?? '') } = channel;
                            let coinStyle = new CSSObject({ verticalAlign: 'bottom', height: '20px', width: '20px' }),
                                coinText =
                                    furnish('span.tt-live-reminder-point-amount[bottom-only]', {
                                        'rainbow-border': notEarned == 0,
                                        innerHTML: amount.toLocaleString(LANGUAGE),
                                    }).outerHTML,
                                coinIcon = (
                                    face?.contains('/')?
                                        furnish('span.tt-live-reminder-point-face', {
                                            innerHTML: furnish('img', { src: `https://static-cdn.jtvnw.net/channel-points-icons/${ face }`, style: coinStyle.toString() }).outerHTML,
                                        }):
                                    furnish('span.tt-live-reminder-point-face', {
                                        innerHTML: Glyphs.modify('channelpoints', { style: `vertical-align:bottom; ${ coinStyle.toString() }` }),
                                    })
                                ).outerHTML;

                            let game = (STREAMER.jump?.[_name]?.stream?.game?.name ?? ''),
                                primaryColor = Color.destruct(STREAMER.jump?.[_name]?.primaryColorHex || '9147ff'),
                                primaryColorDarker = `hsl(${ primaryColor.H }deg,${ primaryColor.S }%,${ (primaryColor.L * .9).clamp(0, 75) }%)`,
                                primaryColorLighter = `hsl(${ primaryColor.H }deg,${ primaryColor.S }%,${ (primaryColor.L * 1.1).clamp(25, 100) }%)`;

                            let liveFontColor = (THEME.equals('dark')? Color.white: Color.black);
                            let [liveBGColor] = [primaryColor.HEX, primaryColorDarker, primaryColorLighter].map(Color.destruct).sort((a, b) => Color.contrast(liveFontColor, [b.R, b.G, b.B]) - Color.contrast(liveFontColor, [a.R, a.G, a.B]));

                            let status = `<span class="tt-${ (live? 'live': 'offline') }" style="min-width:3.5em;${ (!live? '': `background-color:${ liveBGColor.HEX }`) }">${ (live? 'LIVE': recent? tense_A + since.pluralSuffix(parseFloat(since)) + tense_B: [day, hour].join(' ')) }</span>`;

                            let DVR_ON = parseBool(DVRChannels[_name]);

                            let container = f(`.tt-reminder`, { name, live, style: `animation:fade-in 1s 1; background:var(--color-background-base)` },
                                f('.simplebar-scroll-content',
                                    {
                                        style: 'overflow: hidden;',
                                    },
                                    f('.simplebar-content',
                                        {
                                            style: 'overflow: hidden; width:100%;',
                                        },
                                        f('.tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-overflow-hidden[@testSelector=center-window__content]').with(
                                            f('.persistent-notification.tt-relative[@testSelector=persistent-notification]',
                                                {
                                                    style: 'width:100%',
                                                },
                                                f('.persistent-notification__unread.tt-border-b.tt-flex.tt-flex-nowrap').with(
                                                    f('a.tt-block.tt-full-width.tt-interactable.tt-interactable--alpha.tt-interactable--hover-enabled.tt-interactive[@testSelector=persistent-notification__click]',
                                                        {
                                                            // Sometimes, Twitch likes to default to `_blank`
                                                            'target': '_self',

                                                            href,
                                                        },
                                                        f('.persistent-notification__area.tt-flex.tt-flex-nowrap.tt-pd-b-1.tt-pd-l-1.tt-pd-r-3.tt-pd-t-1').with(
                                                            // Avatar
                                                            f.div(
                                                                f('.tt-border-radius-rounded.tt-card-img.tt-card-img--size-4.tt-flex-shrink-0.tt-overflow-hidden', { style: (!live? '': `border:3px solid ${ primaryColor.HEX }`) },
                                                                    f('.tt-aspect.tt-aspect--align-top').with(
                                                                        f('img.tt-balloon-avatar.tt-image', { src: icon })
                                                                    )
                                                                )
                                                            ),
                                                            // Message body
                                                            f('.tt-flex.tt-flex-column.tt-flex-nowrap.tt-mg-x-1').with(
                                                                f('.persistent-notification__body.tt-overflow-hidden[@testSelector=persistent-notification__body]').with(
                                                                    f('span.tt-c-text-alt').with(
                                                                        f('p.tt-balloon-message').with(
                                                                            !live?
                                                                                f.strong(name):
                                                                            f.span(
                                                                                f(`strong`, { innerHTML: [name, game].filter(s => s.length).join(' &mdash; ') }),
                                                                                f(`span.tt-time-elapsed[start=${ time.toJSON() }]`).with(hour),
                                                                                f(`p.tt-hide-text-overflow[style=text-indent:.25em]`, { title: desc }).with(desc),
                                                                            )
                                                                        )
                                                                    )
                                                                ),
                                                                // Subheader
                                                                f('.tt-align-items-center.tt-flex.tt-flex-shrink-0.tt-mg-t-05').with(
                                                                    f('.tt-mg-l-05').with(
                                                                        f('span.tt-balloon-subheader.tt-c-text-alt').html([status, coinIcon + coinText].join(' &bull; '))
                                                                    )
                                                                ),
                                                                // Footer (persistent)
                                                                f('div', {/* ... */})
                                                            )
                                                        )
                                                    ),
                                                    f('.persistent-notification__delete.tt-absolute.tt-pd-l-1', { style: `top:0.0rem; right:0` },
                                                        f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                                            f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__delete]',
                                                                {
                                                                    name,

                                                                    onclick: event => {
                                                                        let { currentTarget } = event,
                                                                            name = currentTarget.getAttribute('name');

                                                                        Cache.load('LiveReminders', async({ LiveReminders }) => {
                                                                            try {
                                                                                LiveReminders = JSON.parse(LiveReminders || '{}');
                                                                            } catch(error) {
                                                                                // Probably an object already...
                                                                                LiveReminders ??= {};
                                                                            }

                                                                            let justInCase = { ...LiveReminders[name] };

                                                                            $(`.tt-reminder[name="${ name }"i]`)?.remove();
                                                                            delete LiveReminders[name];
                                                                            Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));

                                                                            await confirm
                                                                                .timed(`Reminder for <a href="/${ name }">${ name }</a> removed successfully!<p tt-x>${ UUID.from(name).value }</p>`, 5000)
                                                                                .then(ok => {
                                                                                    // The user pressed nothing, or pressed "OK"
                                                                                    if(nullish(ok) || ok)
                                                                                        return;

                                                                                    // The user pressed "Cancel"
                                                                                    Cache.save({ LiveReminders: { ...LiveReminders, [name]: justInCase } }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));
                                                                                });
                                                                        });
                                                                    },
                                                                },
                                                                f('span.tt-button-icon__icon').with(
                                                                    f('div',
                                                                        {
                                                                            style: 'height:1.6rem; width:1.6rem',
                                                                            innerHTML: Glyphs.ignore,
                                                                        },
                                                                    )
                                                                )
                                                            )
                                                        )
                                                    ),
                                                    f('.persistent-notification__popout.tt-absolute.tt-pd-l-1', { style: `top:2.5rem; right:0` },
                                                        f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                                            f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__popout]',
                                                                {
                                                                    name,

                                                                    onclick: event => {
                                                                        let { currentTarget } = event,
                                                                            name = currentTarget.getAttribute('name');

                                                                        MiniPlayer = name;
                                                                    },
                                                                },
                                                                f('span.tt-button-icon__icon').with(
                                                                    f('div',
                                                                        {
                                                                            style: 'height:1.6rem; width:1.6rem',
                                                                            innerHTML: Glyphs.picture_in_picture,
                                                                        },
                                                                    )
                                                                )
                                                            )
                                                        )
                                                    ),
                                                    (
                                                        parseBool(Settings.video_clips__dvr)?
                                                            f('.persistent-notification__popout.tt-absolute.tt-pd-l-1', { style: `top:5rem; right:0` },
                                                                f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                                                    f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__popout]',
                                                                        {
                                                                            name,

                                                                            onclick: event => {
                                                                                let { currentTarget } = event,
                                                                                    name = currentTarget.getAttribute('name');

                                                                                Cache.load('DVRChannels', async({ DVRChannels }) => {
                                                                                    DVRChannels = JSON.parse(DVRChannels || '{}');

                                                                                    let s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"),
                                                                                        DVR_ID = name.toLowerCase(),
                                                                                        enabled = nullish(DVRChannels[DVR_ID]),
                                                                                        [title, subtitle, icon] = [
                                                                                            ['Turn DVR on', `${ s(name) } live streams will be recorded`, 'host'],
                                                                                            ['Turn DVR off', `${ s(name) } live streams will no longer be recorded`, 'clip']
                                                                                        ][+!!enabled];

                                                                                    icon = Glyphs.modify(icon, { style: 'fill:var(--user-contrast-color)!important', height: '20px', width: '20px' });

                                                                                    $('.tt-button-icon__icon', currentTarget).innerHTML = icon;

                                                                                    // Add the DVR...
                                                                                    let message;
                                                                                    if(enabled) {
                                                                                        message = `${ s(name) } streams will be recorded.`;

                                                                                        DVRChannels[DVR_ID] = new ClipName(2);
                                                                                    }
                                                                                    // Remove the DVR...
                                                                                    else {
                                                                                        message = `${ name } will not be recorded.`;

                                                                                        delete DVRChannels[DVR_ID];
                                                                                    }

                                                                                    // FIX-ME: Live Reminder alerts will not display if another alert is present...
                                                                                    Cache.save({ DVRChannels: JSON.stringify(DVRChannels) }, () => Settings.set({ 'DVR_CHANNELS': Object.keys(DVRChannels) }).then(() => parseBool(message) && alert.timed(message, 7000)).catch(WARN));
                                                                                });
                                                                            },
                                                                        },
                                                                        f('span.tt-button-icon__icon').with(
                                                                            f('div',
                                                                                {
                                                                                    style: 'height:1.6rem; width:1.6rem',
                                                                                    innerHTML: Glyphs.modify(['host','clip'][+DVR_ON], { style: `fill:${ ['currentcolor','#f59b00'][+DVR_ON] }` }),
                                                                                },
                                                                            )
                                                                        )
                                                                    )
                                                                )
                                                            )
                                                        // DVR is NOT enabled, so don't show anything here...
                                                        : ''
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                            );

                            let lastOnline = $.all('.tt-reminder[live="true"i]', body).pop(),
                                firstOffline = $('.tt-reminder[live="false"i]:first-child', body);

                            if(defined(firstOffline) && live)
                                firstOffline.insertAdjacentElement('beforebegin', container);
                            else if(defined(lastOnline) && live)
                                lastOnline.insertAdjacentElement('afterend', container);
                            else
                                body.append(container);

                            // And remember kids, never ask a question on StackOverflow
                            // If anyone besides me ever reads this, I answered my own question eventually
                            // Remember to take breaks and tackle the problem at a later date
                                // https://stackoverflow.com/q/72803095/4211612
                            // Move the channels around to prioritize live ones... Does NOT need to be exact
                            if(live) {
                                let data = LiveReminders[name];

                                delete LiveReminders[name];

                                LiveReminders = { [name]: data, ...LiveReminders };
                            }

                            // Loading reminders (progress bar)...
                            $('[up-next--body] > *')?.modStyle(`border-bottom:2px solid #0000; transition:border .5s; border-image:linear-gradient(90deg, var(--user-complement-color) ${ (100 * (index / length)).toFixed(0) }%, #0000 0) 1;`);
                        }

                        wait(500)
                            .then(() => $('[up-next--body] > *').modStyle('border-bottom:2px solid #0000; transition:border .5s; border-image:linear-gradient(90deg, #0000, #0000) 1;'));

                        if(false
                            || (Hash.live_reminders != UUID.from(JSON.stringify(LiveReminders)).value)
                            || (Hash.dvr_channels != UUID.from(JSON.stringify(DVRChannels)).value)
                        )
                            Cache.save({ LiveReminders, DVRChannels: JSON.stringify(DVRChannels) }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders), 'DVR_CHANNELS': Object.keys(DVRChannels) }));
                    });
                },
            });

            live_reminders_catalog_button.tooltip ??= new Tooltip(live_reminders_catalog_button, 'View Live Reminders');

            LIVE_REMINDERS__LISTING_INTERVAL ??=
            setInterval(() => {
                for(let span of $.all('.tt-time-elapsed'))
                    span.innerHTML = toTimeString(+new Date - +new Date(span.getAttribute('start')), '!hour:!minute:!second');
            }, 1000);

            // Help Button
            let first_in_line_help_button = FIRST_IN_LINE_BALLOON?.addButton({
                attributes: {
                    id: 'up-next-help',
                    contrast: THEME__PREFERRED_CONTRAST,
                },

                icon: 'help',
                left: true,
            }),
                [accent, contrast] = (Settings.accent_color ?? 'blue/12').split('/'),
                [colorName] = accent.split('-').reverse();

            first_in_line_help_button.tooltip ??= new Tooltip(first_in_line_help_button, 'Drop a channel here to queue it');

            // Update the color name...
            setInterval(() => {
                first_in_line_help_button.tooltip.innerHTML = (
                    UP_NEXT_ALLOW_THIS_TAB?
                        `Drop a channel in the <span style="color:var(--user-accent-color)">${ colorName }</span> area to queue it`:
                    `Up Next is disabled for this tab`
                ).replace(/\bcolored\b/g, () => Color.getName(THEME.equals('dark')? THEME__CHANNEL_DARK: THEME__CHANNEL_LIGHT));
            }, 1000);

            // Load cache
            Cache.load(['ALL_FIRST_IN_LINE_JOBS', 'FIRST_IN_LINE_DUE_DATE', 'FIRST_IN_LINE_BOOST'], cache => {
                let oneMin = 60_000,
                    fiveMin = 5.5 * oneMin,
                    tenMin = 10 * oneMin;

                [FIRST_IN_LINE_HREF] = ALL_FIRST_IN_LINE_JOBS = (cache.ALL_FIRST_IN_LINE_JOBS ?? []);
                FIRST_IN_LINE_BOOST = parseBool(cache.FIRST_IN_LINE_BOOST) && parseBool(ALL_FIRST_IN_LINE_JOBS?.length);
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

                if(FIRST_IN_LINE_BOOST) {
                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(Math.min(GET_TIME_REMAINING(), fiveMin));

                    wait(5000).then(() => $.all('[up-next--body] [time]:not([index="0"])').forEach(element => element.setAttribute('time', FIRST_IN_LINE_TIMER = fiveMin)));

                    Cache.save({ FIRST_IN_LINE_DUE_DATE });

                    REMARK(`Up Next Boost is enabled → Waiting ${ toTimeString(GET_TIME_REMAINING() | 0) } before leaving for "${ parseURL(FIRST_IN_LINE_HREF).pathname?.slice(1) }"`);
                } else {
                    REMARK(`Up Next Boost is disabled`);
                }

                // Up Next Boost
                first_in_line_boost_button.setAttribute('speeding', FIRST_IN_LINE_BOOST);
                first_in_line_boost_button.querySelector('svg[fill]')?.setAttribute('fill', '');
                first_in_line_boost_button.querySelector('svg[fill]')?.setAttribute('style', `opacity:${ 2**-!FIRST_IN_LINE_BOOST }; fill:currentcolor`);
                first_in_line_boost_button.tooltip ??= new Tooltip(first_in_line_boost_button, `${ ['Start','Stop'][FIRST_IN_LINE_BOOST | 0] } Boost`);

                let up_next_button = $('[up-next--container] button');

                up_next_button?.setAttribute('allowed', parseBool(UP_NEXT_ALLOW_THIS_TAB));
                up_next_button?.setAttribute('speeding', parseBool(FIRST_IN_LINE_BOOST));

                // Pause
                first_in_line_pause_button.tooltip ??= new Tooltip(first_in_line_pause_button, `Pause the timer`);
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

                // Try to see if it's a link...
                let text = event.dataTransfer.getData('text');

                if(!parseURL.pattern.test(text))
                    return;

                let { href, hostname, pathname, domainPath } = parseURL(text),
                    name = pathname.slice(1).split('/').shift();

                // No idea what the user just dropped
                if(!hostname?.length || !pathname?.length)
                    return ERROR(`Unknown [ondrop] text: "${ text }"`);

                if(!/^tv\.twitch/i.test(domainPath.join('.')) || RESERVED_TWITCH_PATHNAMES.test(pathname))
                    return WARN(`Unable to add link to Up Next "${ href }"`);

                streamer = await(null
                    ?? ALL_CHANNELS.find(channel => parseURL(channel.href).pathname.equals('/' + name))
                    ?? (null
                        ?? new Search(name).then(Search.convertResults)
                        ?? new Promise((resolve, reject) => reject(`Unable to perform search for "${ name }"`))
                    )
                        .then(search => {
                            let found = ({
                                from: 'SEARCH',
                                href,
                                icon: (typeof search.icon == 'string'? Object.assign(new String(search.icon), parseURL(search.icon)): null),
                                live: parseBool(search.live),
                                name: search.name,
                            });

                            ALL_CHANNELS = [...ALL_CHANNELS, found].filter(defined).filter(uniqueChannels);

                            return found;
                        })
                        .catch(WARN)
                )

                LOG('Adding to Up Next [ondrop]:', { href, streamer });

                if(nullish(streamer?.icon)) {
                    let name = (streamer?.name ?? parseURL(href).pathname?.slice(1));

                    if(defined(name))
                        new Search(name)
                            .then(Search.convertResults)
                            .then(streamer => {
                                let restored = ({
                                    from: 'SEARCH',
                                    href,
                                    icon: (typeof streamer.icon == 'string'? Object.assign(new String(streamer.icon), parseURL(streamer.icon)): null),
                                    live: parseBool(streamer.live),
                                    name: streamer.name,
                                });

                                ALL_CHANNELS = [...ALL_CHANNELS, restored].filter(defined).filter(uniqueChannels);
                            });
                }

                // Jobs are unknown. Restart timer
                if(ALL_FIRST_IN_LINE_JOBS.length < 1)
                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                // LOG('Accessing here... #1');
                ALL_FIRST_IN_LINE_JOBS = [...ALL_FIRST_IN_LINE_JOBS, href].map(url => url?.toLowerCase?.()).isolate().filter(url => url?.length);

                Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                });
            };

            FIRST_IN_LINE_BALLOON.icon.onmouseenter ??= event => {
                let { container, tooltip, title } = FIRST_IN_LINE_BALLOON,
                    offset = getOffset(container);

                $('div#root > *').append(
                    furnish('.tt-tooltip-layer.tooltip-layer', { style: `transform: translate(${ offset.left }px, ${ offset.top }px); width: 30px; height: 30px; z-index: 9999;` },
                        furnish('.tt-inline-flex.tt-relative.tt-tooltip-wrapper', { 'aria-describedby': tooltip.id, 'show': true },
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
                    ALL_FIRST_IN_LINE_JOBS = ALL_FIRST_IN_LINE_JOBS.filter(defined);

                    // LOG('New array', [...ALL_FIRST_IN_LINE_JOBS]);
                    // LOG('Moved', { oldIndex, newIndex, moved });

                    let channel = ALL_CHANNELS.find(channel => RegExp(parseURL(channel.href).pathname + '\\b', 'i').test(moved));

                    if(nullish(channel))
                        return WARN('No channel found:', { oldIndex, newIndex, desiredChannel: channel, givenChannel: moved });

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

                    Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
                },
            });

            if(Settings.first_in_line_none)
                FIRST_IN_LINE_BALLOON.container.setAttribute('style', 'display:none!important');
            else
                FIRST_IN_LINE_LISTING_JOB ??= setInterval(async() => {
                    // Set the opacity...
                    // FIRST_IN_LINE_BALLOON.container.setAttribute('style', `opacity:${ (UP_NEXT_ALLOW_THIS_TAB? 1: 0.75) }!important`);

                    for(let index = 0, fails = 0; UP_NEXT_ALLOW_THIS_TAB && index < ALL_FIRST_IN_LINE_JOBS?.length; index++) {
                        let href = ALL_FIRST_IN_LINE_JOBS[index],
                            name = parseURL(href).pathname.slice(1),
                            channel = await(null
                                ?? ALL_CHANNELS.find(channel => channel.name.equals(name))
                                ?? new Search(name).then(Search.convertResults)
                            );

                        if(nullish(href) || nullish(channel))
                            continue;

                        let { live } = channel;
                        name = channel.name;

                        if($.defined(`[live][time][name="${ name }"i]`))
                            continue;

                        let [balloon] = FIRST_IN_LINE_BALLOON?.add({
                            href,
                            src: channel.icon,
                            message: `${ name } <span style="display:${ live? 'none': 'inline-block' }">is not live</span>`,
                            subheader: `Coming up next`,
                            onremove: event => {
                                let index = ALL_FIRST_IN_LINE_JOBS.findIndex(href => event.href == href),
                                    [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1),
                                    name = parseURL(removed).pathname?.slice(1);

                                NOTICE(`Removed from Up Next via Sorting Handler (${ nth(index + 1, 'ordinal-position') }):`, removed, 'Was it canceled?', event.canceled);

                                if(event.canceled)
                                    DO_NOT_AUTO_ADD.push(removed);
                                // Balloon.onremove
                                REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: parseBool(parseURL(removed).searchParameters?.redo) });

                                if(index > 0) {
                                    Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => event.callback(event.element));
                                } else {
                                    LOG('Destroying current job [Job Listings]...', { FIRST_IN_LINE_HREF, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME });

                                    [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                                    FIRST_IN_LINE_HREF = undefined;
                                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                                    Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => { REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]); event.callback(event.element) });
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
                                let subheader = $('.tt-balloon-subheader', container);

                                return setInterval(async() => {
                                    new StopWatch('up_next_balloon__subheader_timer_animation');

                                    let timeRemaining = GET_TIME_REMAINING();

                                    timeRemaining = timeRemaining < 0? 0: timeRemaining;

                                    /* First in Line is paused */
                                    if(FIRST_IN_LINE_PAUSED) {
                                        Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) });
                                        StopWatch.stop('up_next_balloon__subheader_timer_animation', 1000);

                                        return;
                                    }

                                    let name = container.getAttribute('name'),
                                        channel = await(null
                                            ?? ALL_CHANNELS.find(channel => name.equals(channel.name))
                                            ?? new Search(name).then(Search.convertResults)
                                        ),
                                        { live } = channel;
                                        name = channel.name;

                                    let time = timeRemaining,
                                        intervalID = parseInt(container.getAttribute('animationID')),
                                        index = $.all('[id][guid][uuid]', container.parentElement).indexOf(container),
                                        anchor = $.all('a[connected-to]', container.parentElement)[index];

                                    if(anchor.hasAttribute('new-href')) {
                                        let href = anchor.getAttribute('new-href');

                                        anchor.removeAttribute('new-href');
                                        ALL_FIRST_IN_LINE_JOBS.splice(index, 1, anchor.href = href);

                                        REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                                        Cache.save({ ALL_FIRST_IN_LINE_JOBS });
                                    }

                                    if(time < 60_000 && nullish(FIRST_IN_LINE_HREF)) {
                                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);

                                        WARN('Creating job to avoid [Job Listing] mitigation event', channel);

                                        return StopWatch.stop('up_next_balloon__subheader_timer_animation', 1000), REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = channel.href);
                                    }

                                    if(time < 1000)
                                        wait(5000, [container, intervalID]).then(([container, intervalID]) => {
                                            LOG('Mitigation event for [Job Listings]', { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_HREF }, new Date);
                                            // Mitigate 0 time bug?

                                            Cache.save({ ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS.filter(href => parseURL(href).pathname.unlike(parseURL(FIRST_IN_LINE_HREF).pathname)), FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE() }, () => {
                                                WARN(`Timer overdue [animation:first-in-line-balloon--initializer] » ${ FIRST_IN_LINE_HREF }`)
                                                    ?.toNativeStack?.();

                                                goto(FIRST_IN_LINE_HREF);
                                            });

                                            return clearInterval(intervalID);
                                        });

                                    container.setAttribute('time', time - (index > 0? 0: 1000));

                                    if(container.getAttribute('index') != index)
                                        container.setAttribute('index', index);

                                    let theme = { light: 'w', dark: 'b' }[THEME];

                                    $('a', container)
                                        .setAttribute('style', `background-color: var(--color-opac-${ theme }-${ index > 15? 1: 15 - index })`);

                                    if(container.getAttribute('live') != (live + '')) {
                                        $('.tt-balloon-message', container).innerHTML =
                                            `${ name } <span style="display:${ live? 'none': 'inline-block' }">is not live</span>`;
                                        container.setAttribute('style', `opacity: ${ 2**-!live }!important`);
                                        container.setAttribute('live', live);
                                    }

                                    subheader.innerHTML = index > 0? nth(index + 1, 'ordinal-position'): toTimeString(time, 'clock');

                                    StopWatch.stop('up_next_balloon__subheader_timer_animation', 1000);
                                }, 1000);
                            },
                        })
                            ?? [];
                    }

                    FIRST_IN_LINE_BALLOON.counter.setAttribute('length', $.all(`[up-next--body] [time]`).length);
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
        new StopWatch('first_in_line');

        let notifications = [...$.all('[data-test-selector*="notifications"i] [data-test-selector*="notification"i]'), ActionableNotification].filter(defined);

        // The Up Next empty status
        $('[up-next--body]')?.setAttribute?.('empty', !(UP_NEXT_ALLOW_THIS_TAB && ALL_FIRST_IN_LINE_JOBS.length));
        $('[up-next--body]')?.setAttribute?.('allowed', !!UP_NEXT_ALLOW_THIS_TAB);

        if(!UP_NEXT_ALLOW_THIS_TAB)
            return;

        for(let notification of notifications) {
            let action = (
                notification instanceof Element?
                    $('a[href^="/"]', notification):
                notification
            );

            if(nullish(action))
                continue;

            let { href, pathname } = parseURL(action.href.toLowerCase()),
                { innerText } = action,
                uuid = UUID.from(innerText).value;

            if(HANDLED_NOTIFICATIONS.contains(uuid))
                continue;
            HANDLED_NOTIFICATIONS.push(uuid);

            if(DO_NOT_AUTO_ADD.contains(href))
                continue;

            if(true
                && !/\blive\b/i.test(innerText)
                && $.nullish('[class*="toast"i][class*="action"i]', notification)
            )
                continue;

            LOG('Received an actionable notification:', innerText, new Date);

            if(defined(FIRST_IN_LINE_HREF ??= ALL_FIRST_IN_LINE_JOBS[0])) {
                if([...ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_HREF].missing(href)) {
                    LOG('Pushing to First in Line:', href, new Date);

                    // LOG('Accessing here... #2');
                    ALL_FIRST_IN_LINE_JOBS = [...ALL_FIRST_IN_LINE_JOBS, href].map(url => url?.toLowerCase?.()).isolate().filter(url => url?.length);
                } else {
                    WARN('Not pushing to First in Line:', href, new Date);
                    LOG('Reason(s):', [FIRST_IN_LINE_JOB, ...ALL_FIRST_IN_LINE_JOBS],
                        `It is the next job? ${ ['No', 'Yes'][+(FIRST_IN_LINE_HREF === href)] }`,
                        `It is in the queue already? ${ ['No', 'Yes'][+(ALL_FIRST_IN_LINE_JOBS.contains(href))] }`,
                    );
                }

                // To wait, or not to wait
                Cache.save({ ALL_FIRST_IN_LINE_JOBS });

                continue;
            } else {
                LOG('Pushing to First in Line (no contest):', href, new Date);

                // Add the new job...
                // LOG('Accessing here... #3');
                ALL_FIRST_IN_LINE_JOBS = [...ALL_FIRST_IN_LINE_JOBS, href].map(url => url?.toLowerCase?.()).isolate().filter(url => url?.length);
                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                // To wait, or not to wait
                Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                });
            }

            AddBalloon: {
                update();

                let index = ALL_FIRST_IN_LINE_JOBS.indexOf(href),
                    name = parseURL(href).pathname.slice(1),
                    channel = await(null
                        ?? ALL_CHANNELS.find(channel => channel.name.equals(name))
                        ?? new Search(name).then(Search.convertResults)
                    );

                if(nullish(channel))
                    continue;

                let { live } = channel;
                name = channel.name;

                if($.defined(`[live][time][name="${ name }"i]`))
                    continue;

                index = index < 0? ALL_FIRST_IN_LINE_JOBS.length: index;

                let [balloon] = FIRST_IN_LINE_BALLOON?.add({
                    href,
                    src: channel.icon,
                    message: `${ name } <span style="display:${ live? 'none': 'inline-block' }">is not live</span>`,
                    subheader: `Coming up next`,
                    onremove: event => {
                        let index = ALL_FIRST_IN_LINE_JOBS.findIndex(href => event.href == href),
                            [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1),
                            name = parseURL(removed).pathname?.slice(1);

                        NOTICE(`Removed from Up Next via Balloon (${ nth(index + 1, 'ordinal-position') }):`, removed, 'Was it canceled?', event.canceled);

                        if(event.canceled)
                            DO_NOT_AUTO_ADD.push(removed);
                        // AddBalloon.onremove
                        REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: parseBool(parseURL(removed).searchParameters?.redo) });

                        if(index > 0) {
                            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => event.callback(event.element));
                        } else {
                            LOG('Destroying current job [First in Line]...', { FIRST_IN_LINE_HREF, FIRST_IN_LINE_DUE_DATE });

                            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                            FIRST_IN_LINE_HREF = undefined;
                            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
                            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => { REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]); event.callback(event.element) });
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
                        let subheader = $('.tt-balloon-subheader', container);

                        if(!UP_NEXT_ALLOW_THIS_TAB)
                            return -1;

                        return setInterval(async() => {
                            new StopWatch('first_in_line__job_watcher');

                            let timeRemaining = GET_TIME_REMAINING();

                            timeRemaining = timeRemaining < 0? 0: timeRemaining;

                            /* First in Line is paused */
                            if(FIRST_IN_LINE_PAUSED) {
                                Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) });
                                StopWatch.stop('first_in_line__job_watcher', 1000);

                                return;
                            }

                            Cache.save({ FIRST_IN_LINE_BOOST });

                            let name = container.getAttribute('name'),
                                channel = await(null
                                    ?? ALL_CHANNELS.find(channel => name.equals(channel.name))
                                    ?? new Search(name).then(Search.convertResults)
                                ),
                                { live } = channel;
                                name = channel.name;

                            let time = timeRemaining,
                                intervalID = parseInt(container.getAttribute('animationID')),
                                index = $.all('[id][guid][uuid]', container.parentElement).indexOf(container),
                                anchor = $.all('a[connected-to]', container.parentElement)[index];

                            if(anchor.hasAttribute('new-href')) {
                                let href = anchor.getAttribute('new-href');

                                anchor.removeAttribute('new-href');
                                ALL_FIRST_IN_LINE_JOBS.splice(index, 1, anchor.href = href);

                                REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                                Cache.save({ ALL_FIRST_IN_LINE_JOBS });
                            }

                            if(time < 60_000 && nullish(FIRST_IN_LINE_HREF)) {
                                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);

                                WARN('Creating job to avoid [First in Line] mitigation event', channel);

                                return StopWatch.stop('first_in_line__job_watcher', 1000), REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = channel.href);
                            }

                            if(time < 1000)
                                wait(5000, [container, intervalID]).then(([container, intervalID]) => {
                                    LOG('Mitigation event from [First in Line]', { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_HREF }, new Date);
                                    // Mitigate 0 time bug?

                                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
                                    Cache.save({ ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS.filter(href => parseURL(href).pathname.unlike(parseURL(FIRST_IN_LINE_HREF).pathname)), FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE() }, () => {
                                        WARN(`Timer overdue [animation:first-in-line-balloon] » ${ FIRST_IN_LINE_HREF }`)
                                            ?.toNativeStack?.();

                                        goto(FIRST_IN_LINE_HREF);
                                    });

                                    return clearInterval(intervalID);
                                });

                            container.setAttribute('time', time - (index > 0? 0: 1000));

                            if(container.getAttribute('index') != index)
                                container.setAttribute('index', index);

                            let theme = { light: 'w', dark: 'b' }[THEME];

                            $('a', container)
                                .setAttribute('style', `background-color: var(--color-opac-${ theme }-${ index > 15? 1: 15 - index })`);

                            if(container.getAttribute('live') != (live + '')) {
                                $('.tt-balloon-message', container).innerHTML =
                                    `${ name } <span style="display:${ live? 'none': 'inline-block' }">is not live</span>`;
                                container.setAttribute('style', `opacity: ${ 2**-!live }!important`);
                                container.setAttribute('live', live);
                            }

                            subheader.innerHTML = index > 0? nth(index + 1, 'ordinal-position'): toTimeString(time, 'clock');

                            StopWatch.stop('first_in_line__job_watcher', 1000);
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

                    goto(parseURL(FIRST_IN_LINE_HREF).addSearch({ tool: 'first-in-line--killed' }).href);
                }
            }
        }

        FIRST_IN_LINE_BOOST &&= ALL_FIRST_IN_LINE_JOBS.length > 0;

        let filb = $('[speeding]');

        if(parseBool(filb?.getAttribute('speeding')) != parseBool(FIRST_IN_LINE_BOOST))
            filb?.click?.();

        StopWatch.stop('first_in_line');
    };
    Timers.first_in_line = 1000;

    Unhandlers.first_in_line = () => {
        if(defined(FIRST_IN_LINE_JOB))
            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

        if(UnregisterJob.__reason__.equals('default'))
            return;

        if(defined(FIRST_IN_LINE_HREF))
            FIRST_IN_LINE_HREF = '?';

        ALL_FIRST_IN_LINE_JOBS = [];
        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

        Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
    };

    __FirstInLine__:
    if(parseBool(Settings.first_in_line) || parseBool(Settings.first_in_line_plus) || parseBool(Settings.first_in_line_all)) {
        await Cache.load(['ALL_FIRST_IN_LINE_JOBS', 'FIRST_IN_LINE_DUE_DATE', 'FIRST_IN_LINE_BOOST'], cache => {
            let oneMin = 60_000,
                fiveMin = 5.5 * oneMin,
                tenMin = 10 * oneMin;

            [FIRST_IN_LINE_HREF] = ALL_FIRST_IN_LINE_JOBS = (cache.ALL_FIRST_IN_LINE_JOBS ?? []);
            FIRST_IN_LINE_BOOST = parseBool(cache.FIRST_IN_LINE_BOOST) && parseBool(ALL_FIRST_IN_LINE_JOBS?.length);
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

        // Redo entries
        if(parseBool(parseURL(top.location).searchParameters?.redo))
            if(false
                || (top.location.pathname.equals(`/${ STREAMER.name }`) && STREAMER.live)
                || (top.location.pathname.unlike(`/${ STREAMER.name }`))
            )
                REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: parseBool(parseURL(top.location).searchParameters?.redo) });

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
                first = (RegExp(parseURL(STREAMER.href).pathname + '\\b', 'i').test(href)),
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
                            icon: (typeof streamer.icon == 'string'? Object.assign(new String(streamer.icon), parseURL(streamer.icon)): null),
                            live: parseBool(streamer.live),
                            name: streamer.name,
                        });

                        ALL_CHANNELS = [...ALL_CHANNELS, restored].filter(defined).filter(uniqueChannels);
                        ALL_FIRST_IN_LINE_JOBS[index] = restored;

                        REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = href);
                    })
                    .catch(error => {
                        let [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1),
                            name = parseURL(removed).pathname.slice(1);

                            // Necromancer
                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: parseBool(parseURL(removed).searchParameters?.redo) });

                        Cache.save({ ALL_FIRST_IN_LINE_JOBS }, () => {
                            WARN(`Unable to perform search for "${ name }" - ${ error }`, removed);
                        });
                    });

                break __FirstInLine__;
            } else if(!first) {
                // Handlers.first_in_line({ href, innerText: `${ channel.name } is live [First in Line]` });

                // WARN('Forcing queue update for', href);
                REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = href);
            } else if(first) {
                let [removed] = ALL_FIRST_IN_LINE_JOBS.splice(0, 1),
                    name = parseURL(removed).pathname.slice(1);

                // Doppleganger
                REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: parseBool(parseURL(removed).searchParameters?.redo) });

                [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                Cache.save({ ALL_FIRST_IN_LINE_JOBS }, () => {
                    WARN('Removed duplicate job', removed);
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

    await Cache.load(['OLD_STREAMERS', 'BAD_STREAMERS'], cache => {
        OLD_STREAMERS = cache.OLD_STREAMERS ?? "";
        BAD_STREAMERS = cache.BAD_STREAMERS ?? "";
    });

    Handlers.first_in_line_plus = () => {
        new StopWatch('first_in_line_plus');

        let streamers = [...STREAMERS, STREAMER].filter(isLive).map(streamer => streamer.name).isolate().sort();

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

            Cache.save({ BAD_STREAMERS });

            // RemoveFromTopSearch(['tt-err-chn']);
        } else if(!/^User_Not_Logged_In_\d+$/.test(USERNAME) && $.nullish('[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] a[class*="side-nav-card"i]')) {
            try {
                $('[data-a-target="side-nav-arrow"i]')
                    .closest('[class*="expand"i]')
                    .querySelector('button')
                    .click();
            } catch(error) {
                WARN("[Followed Channels] is missing. Reloading...");

                Cache.save({ BAD_STREAMERS: OLD_STREAMERS });

                // Failed to get channel at...
                PushToTopSearch({ 'tt-err-chn': (+new Date).toString(36) }, true);
            }

            return /* Fail "gracefully" */;
        }

        if(OLD_STREAMERS == NEW_STREAMERS)
            return StopWatch.stop('first_in_line_plus'), Cache.save({ OLD_STREAMERS });

        new_names = new_names
            .filter(name => old_names.missing(name))
            .filter(name => bad_names.missing(name));

        if(new_names.length < 1)
            return StopWatch.stop('first_in_line_plus'), Cache.save({ OLD_STREAMERS });

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

            Handlers.first_in_line({ href, innerText: `${ name } is live [First in Line+]` });
        }

        OLD_STREAMERS = NEW_STREAMERS;

        Cache.save({ OLD_STREAMERS });

        StopWatch.stop('first_in_line_plus');
    };
    Timers.first_in_line_plus = 1000;

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
    Handlers.live_reminders = () => {
        new StopWatch('live_reminders');

        // Add the button to all channels
        let actionPanel = $('.about-section__actions');

        if(nullish(actionPanel))
            return StopWatch.stop('live_reminders');

        let action = $('[tt-svg-label="live-reminders"i], [tt-action="live-reminders"i]', actionPanel);

        if(defined(action))
            return StopWatch.stop('live_reminders');

        Cache.load('LiveReminders', async({ LiveReminders }) => {
            try {
                LiveReminders = JSON.parse(LiveReminders || '{}');
            } catch(error) {
                // Probably an object already...
                LiveReminders ??= {};
            }

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

            icon = Glyphs.modify(icon, { style: 'fill:var(--user-contrast-color)!important', height: '20px', width: '20px' });

            // Create the action button...
            action =
            f('div', { 'tt-action': 'live-reminders', 'for': reminderName, 'remind': hasReminder, 'action-origin': 'foreign', style: `animation:1s fade-in 1;` },
                f('button', {
                    onmouseup: async event => {
                        let { currentTarget, isTrusted = false, button = -1 } = event;

                        if(!!button)
                            return /* Not the primary button */;

                        Cache.load('LiveReminders', async({ LiveReminders }) => {
                            try {
                                LiveReminders = JSON.parse(LiveReminders || '{}');
                            } catch(error) {
                                // Probably an object already...
                                LiveReminders ??= {};
                            }

                            let s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"),
                                reminderName = STREAMER.name,
                                notReminded = nullish(LiveReminders[reminderName]),
                                tense = (parseBool(Settings.keep_live_reminders)? '': ' next'),
                                stream_s = 'stream'.pluralSuffix(+!!tense),
                                [title, subtitle, icon] = [
                                    ['Remind me', `Receive a notification for ${ s(STREAMER.name) }${ tense } live ${ stream_s }`, 'inform'],
                                    ['Reminder set', `You will receive a notification for ${ s(STREAMER.name) }${ tense } live ${ stream_s }`, 'notify']
                                ][+!!notReminded];

                            icon = Glyphs.modify(icon, { style: 'fill:var(--user-contrast-color)!important', height: '20px', width: '20px' });

                            $('.tt-action-icon', currentTarget).innerHTML = icon;
                            $('.tt-action-title', currentTarget).innerText = title;
                            $('.tt-action-subtitle', currentTarget).innerText = subtitle;

                            // Add the reminder...
                            let message;
                            if(notReminded) {
                                message = `You'll be notified when <a href="/${ reminderName }">${ reminderName }</a> goes live.`;
                                LiveReminders[reminderName] = (STREAMER.live? new Date(STREAMER?.data?.actualStartTime): STREAMER?.data?.lastSeen ?? new Date);
                            }
                            // Remove the reminder...
                            else {
                                message = `Reminder for <a href="/${ reminderName }">${ reminderName }</a> removed successfully!`;
                                delete LiveReminders[reminderName];
                            }

                            currentTarget.closest('[tt-action]').setAttribute('remind', notReminded);

                            // FIX-ME: Live Reminder alerts will not display if another alert is present...
                            Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }).then(() => parseBool(message) && alert.timed(message, 7000)).catch(WARN));
                        });
                    },
                }, f.div(
                    f('.tt-action-icon').html(icon),
                    f.div(
                        f('p.tw-title.tt-action-title').with(title),
                        f('p.tt-action-subtitle').with(subtitle)
                    )
                ))
            );

            actionPanel.append(action);
        });

        StopWatch.stop('live_reminders');
    };
    Timers.live_reminders = -2_500;

    Unhandlers.live_reminders = () => {
        $.all('[tt-action="live-reminders"i]').map(action => action.remove());
        [LIVE_REMINDERS__LISTING_INTERVAL].map(clearInterval);
    };

    __Live_Reminders__:
    // On by Default (ObD; v5.15) -- only on the tab that has Up Next enabled
    if(true
        // && parseBool(UP_NEXT_ALLOW_THIS_TAB)
        && (false
            || nullish(Settings.live_reminders)
            || parseBool(Settings.live_reminders)
        )
    ) {
        REMARK('Adding Live Reminders...');

        // See if there are any notifications to push...
        let REMINDERS_INDEX = -1, REMINDERS_LENGTH = 0, PARSED_REMINDERS = [];

        let LIVE_REMINDERS__CHECKER = () => {
            Cache.load('LiveReminders', async({ LiveReminders }) => {
                try {
                    LiveReminders = JSON.parse(LiveReminders || '{}');
                } catch(error) {
                    // Probably an object already...
                    LiveReminders ??= {};
                }

                REMINDERS_INDEX = 0;
                REMINDERS_LENGTH = Object.keys(LiveReminders).length;

                when(() => REMINDERS_INDEX >= REMINDERS_LENGTH).then(LIVE_REMINDERS__CHECKER);

                checking:
                // Only check for the stream when it's live; if the dates don't match, it just went live again
                for(let reminderName in LiveReminders) {
                    if(PARSED_REMINDERS.contains(reminderName))
                        continue;

                    let channel = await new Search(reminderName).then(Search.convertResults),
                        ok = parseBool(channel?.ok);

                    // Search did not complete...
                    let num = 3;
                    while(!ok && num-- > 0) {
                        Search.void(reminderName);

                        channel = await when.defined(() => new Search(reminderName).then(Search.convertResults), 500);
                        ok = parseBool(channel?.ok);

                        // WARN(`Re-search, ${ num } ${ 'retry'.pluralSuffix(num) } left [Reminders]: "${ reminderName }" → OK = ${ ok }`);
                    }

                    if(!channel.live) {
                        // Ignore this reminder (channel not live)
                        ++REMINDERS_INDEX;
                        continue checking;
                    }

                    let { name, live, icon, href, data = { actualStartTime: null, lastSeen: null } } = channel;
                    let lastOnline = new Date((+new Date(LiveReminders[reminderName])).floorToNearest(1000)).toJSON(),
                        justOnline = new Date((+new Date(data.actualStartTime)).floorToNearest(1000)).toJSON();

                    // The channel just went live!
                    if(lastOnline != justOnline) {
                        PARSED_REMINDERS.push(reminderName);

                        if(parseBool(Settings.keep_live_reminders)) {
                            LiveReminders[reminderName] = justOnline;
                        } else {
                            $(`[tt-action="live-reminders"i][for="${ reminderName }"i][remind="true"i] button`)
                                ?.dispatchEvent?.(new MouseEvent('mouseup', { bubbles: false }));
                            delete LiveReminders[reminderName];
                        }

                        Cache.save({ LiveReminders }, async() => {
                            // TODO: Currently, only one option looks for Live Reminder notifications...
                            Handle_phantom_notification: {
                                let notification = { href, innerText: `${ name } is live [Live Reminders]` },
                                    [page, note] = [STREAMER.href, href].map(url => parseURL(url).pathname);

                                // If already on the stream, break
                                if(page.equals(note))
                                    break Handle_phantom_notification;

                                // All of the Live Reminder handlers...
                                Handlers.first_in_line(notification);

                                let last = new Date(lastOnline);
                                let just = new Date(justOnline);
                                let instance = (last - just < 60_000)? 'just now': toTimeString((last - just).abs().floorToNearest(60_000), '?minutes minutes ago');

                                // Show a notification
                                Display_phantom_notification: {
                                    WARN(`Live Reminders: ${ name } went live ${ instance }`, new Date);
                                    await alert.timed(`<a href='/${ name }'>${ name }</a> went live ${ instance }!`, 7000);
                                }
                            }

                            // The reminder has been parsed
                            ++REMINDERS_INDEX;
                        });
                    } else {
                        // The reminder hasn't been changed
                        ++REMINDERS_INDEX;
                    }
                }

                // Send the length to the settings page
                Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) });
            });
        };

        // Add the panel & button
        let actionPanel = $('.about-section__actions');

        if(nullish(actionPanel)) {
            actionPanel = furnish('.about-section__actions', { style: `padding-left: 2rem; margin-bottom: 3rem; width: 24rem;` });

            $('.about-section')?.append?.(actionPanel);
        } else {
            for(let child of actionPanel.children)
                child.setAttribute('action-origin', 'native');
        }

        setTimeout(LIVE_REMINDERS__CHECKER, 2_500);
        RegisterJob('live_reminders');
    }

    /*** Game Overview Card | Store Integration
     *       _____                         ____                       _                  _____              _
     *      / ____|                       / __ \                     (_)                / ____|            | |
     *     | |  __  __ _ _ __ ___   ___  | |  | |_   _____ _ ____   ___  _____      __ | |     __ _ _ __ __| |
     *     | | |_ |/ _` | '_ ` _ \ / _ \ | |  | \ \ / / _ \ '__\ \ / / |/ _ \ \ /\ / / | |    / _` | '__/ _` |
     *     | |__| | (_| | | | | | |  __/ | |__| |\ V /  __/ |   \ V /| |  __/\ V  V /  | |___| (_| | | | (_| |
     *      \_____|\__,_|_| |_| |_|\___|  \____/  \_/ \___|_|    \_/ |_|\___| \_/\_/    \_____\__,_|_|  \__,_|
     *
     *
     */
    Handlers.game_overview_card = () => {
        let existing = $('#game-overview-card');

        if(existing?.dataset?.game?.equals(STREAMER.game))
            return;
        existing?.remove();

        let { href, origin, protocol, scheme, host, hostname, port, pathname, search, hash } = parseURL(STREAMER.game.href);

        if(!href?.length)
            return;

        let timerStart = +new Date;

        let MATURE_HINTS = ['ADULT', 'MATUR', 'NSFW', ...16..to(99)],
            RATING_STYLING = `max-height:10rem; max-width:6rem; position:absolute; left:50%; bottom:-9rem; transform:translate(-50%);`;

        /*await*/ fetchURL.idempotent(href)
            .then(response => response.text())
            .then(DOMParser.stripBody)
            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
            .catch(WARN)
            .then(DOM => {
                if(!(DOM instanceof Document))
                    throw TypeError(`No DOM available. Page not loaded`);

                let f = furnish;
                let get = property => DOM.get(property);

                let [title, description, image] = ["title", "description", "image"].map(get),
                    error = DOM.querySelector('parsererror')?.textContent;

                let ok = /\/ttv-boxart\//i.test(image);

                if(!ok)
                    throw `No metadata available for "${ STREAMER.game }"`;

                LOG(`Loaded page ${ href }`, { title, description, image, DOM, size: (DOM.documentElement.innerHTML.length * 8).suffix('B', 2, 'data'), time: ((+new Date - timerStart) / 1000).suffix('s', false) });

                if(!title?.length || !image?.length) {
                    if(!error?.length)
                        return;
                    else
                        throw error;
                }

                title = title.replace(/[\s\-]+twitch\s*$/i, '');

                let card = f('.tt-iframe-card.tt-border-radius-medium.tt-elevation-1').with(
                    f('.tt-border-radius-medium.tt-c-background-base.tt-flex.tt-full-width').with(
                        f('.tt-block.tt-border-radius-medium.tt-full-width.tt-interactable', { style: 'color:inherit; text-decoration:none; min-height:12rem; height:fit-content' },
                            f('.chat-card.tt-flex.tt-flex-nowrap.tt-pd-05', {
                                style: 'min-height:30rem',
                            },
                                // Preview image
                                f('.chat-card__preview-img.tt-align-items-center.tt-c-background-alt-2.tt-flex.tt-flex-shrink-0.tt-justify-content-center', {
                                    style: 'background-color:#0000!important;height:4.5rem;width:15rem'
                                },
                                    f('.tt-card-image').with(
                                        f('.tt-aspect', { style: 'transform:translate(0,40%)' },
                                            f('img.tt-image', {
                                                alt: title,
                                                src: image.replace(/^(?!(?:https?:)?\/\/[^\/]+)\/?/i, `${ top.location.protocol }//${ host }/`),
                                                style: 'height:15rem',
                                            }),
                                            f('img#tt-content-rating-placeholder', { src: `//image.api.playstation.com/grc/images/ratings/hd/esrb/rp.png`, style: RATING_STYLING })
                                        )
                                    )
                                ),
                                // Title & Subtitle
                                f('.tt-align-items-center.tt-flex.tt-overflow-hidden').with(
                                    f('.tt-full-width.tt-pd-l-1').with(
                                        // Title
                                        f('.chat-card__title.tt-ellipsis').with(
                                            f('h3.tt-strong.tt-ellipsis.tt-auto-marquee[@testSelector=chat-card-title]').with(title)
                                        ),
                                        // Subtitle
                                        f('.tt-ellipsis').with(
                                            f('p.tt-c-text-alt-2[@testSelector=chat-card-description][@twitch-provided-description]', { style: 'white-space:break-spaces;max-height:40vh;overflow:auto' }).with(description)
                                        ),
                                        // Footer
                                        f('#tt-purchase-container.tt-ellipsis').with(
                                            f.br(),
                                            f('#tt-steam-purchase'),
                                            f('#tt-playstation-purchase'),
                                            f('#tt-xbox-purchase'),
                                            f('#tt-nintendo-purchase'),
                                        )
                                    )
                                )
                            )
                        )
                    )
                );

                let container = f(`#game-overview-card.chat-line__message[@game="${ STREAMER.game }"][@aTarget=chat-line-message][@testSelector=chat-line-message]`, {
                    style: `animation:1s fade-in 1; max-width:fit-content; overflow:visible; overflow-wrap:normal; margin-bottom:3rem`
                },
                    f('.tt-relative').with(
                        f('.tt-relative.chat-line__message-container').with(
                            f('div').with(
                                f('.chat-line__no-background.tt-inline').with(
                                    card
                                )
                            )
                        )
                    )
                );

                new Tooltip($('[data-a-target$="game-link"i]'), `Read about <ins>${ title }</ins> below`, { from: 'top' });
                $('.about-section__panel--content')?.closest('*:not([style]):not([class]):not([id])')?.insertAdjacentElement('afterend', container);
            })
            .catch(ERROR);

            if(parseBool(Settings.simplify_look_auto_marquee))
                setInterval(() => {
                    for(let auto of $.all('.tt-auto-marquee')) {
                        let { textOverflowX = false } = getOffset(auto);

                        if(textOverflowX) {
                            let html = auto.innerHTML;

                            auto.innerHTML = furnish(`marquee[behavior=alternate][scrollamount=2]`).html(html).outerHTML;
                            auto.classList.remove('tt-auto-marquee');
                        }
                    }
                }, 3_000);

            /***
             *       _____ _                   _____       _                       _   _
             *      / ____| |                 |_   _|     | |                     | | (_)
             *     | (___ | |_ ___  _ __ ___    | |  _ __ | |_ ___  __ _ _ __ __ _| |_ _  ___  _ __
             *      \___ \| __/ _ \| '__/ _ \   | | | '_ \| __/ _ \/ _` | '__/ _` | __| |/ _ \| '_ \
             *      ____) | || (_) | | |  __/  _| |_| | | | ||  __/ (_| | | | (_| | |_| | (_) | | | |
             *     |_____/ \__\___/|_|  \___| |_____|_| |_|\__\___|\__, |_|  \__,_|\__|_|\___/|_| |_|
             *                                                      __/ |
             *                                                     |___/
             */

            // On by Default (ObD; v5.29)
            if(nullish(Settings.store_integration) || parseBool(Settings.store_integration)) {
                // Get the Country code and Language code
                // e.g. "en-US"
                let lang = navigator.language,
                    [langCode, counCode = ''] = lang.split('-'),
                    [langName] = (ISO_639_1[langCode]?.names || [navigator.language]),
                    game = STREAMER.game,
                    gameURI = encodeURIComponent(game);

                let timeout = 15_000;

                // Removes quotations and apostrophes
                let LE_QUOTES = /[\u2033\u2036\u275d\u275e]/gu,
                    LE_APOSTE = /[\u0312-\u0315\u031b\u2032\u2035\u275b\u275c\u2019\u201a]/gu;

                // Removes symbols like ™ ® © etc.
                let NON_ASCII = /[^\p{L}\d `\-=~!@#\$%^&\*\(\)\+\{\}\|\[\]\\:;"'<>\?,\.\/]/gu;

                // The item can not be found
                const ITEM_NOT_FOUND = Symbol('NOT_FOUND');

                // The imperfect match threshold percentage: 1.5%
                const PARTIAL_MATCH_THRESHOLD = .015;

                // Remove trademarks to better match games
                let PlayStationRegExp = /\bPS\s*(\d|one|p(ortable)?|v(ita)?|(plus|\+)|move|vr(\s*\d)?).*$/i,
                    // Removes common trademarks → PS one,PS1,PS2,PS3,PS4,PS5,PSP,PS Portable,PSV,PSVita,PS Plus,PS+,PS Move,PS VR,PS VR2

                    XboxRegExp = /\bXbox\s*(\d+|live|one\s*(series\s*)?([x\|s]+\s*)?(enhanced)?)?.*$/i,
                    // Removes common trademarks → Xbox,Xbox 360,Xbox Live,Xbox One,Xbox One X|S,Xbox One X,Xbox One X Enhanced,Xbox One S,Xbox One Series X|S,Xbox One Series X,Xbox One Series X Enhanced,Xbox One Series S

                    NintendoRegExp = /Nintendo\s*(64|[23]?DS\s*(i|XL)?|Switch|Game[\s-]?(Boy(\s*Advance)?|Cube)|Wii([\s-]?U)?)/i,
                    // Removes common trademarks → Nintendo Switch,Nintendo 3DS,Nintendo 2DS,Nintendo 64,Nintendo DSi,Nintendo DS,Nintendo GameBoy,Nintendo GameBoy Advance,Nintendo Wii,Nintendo Wii U

                    EditionsRegExp = /\s*(([-~:]\s*)?(\p{L}|[-']){3,}\s*)Editions?/iu;
                    // Removes common "editions" → Standard,Digital,Deluxe,Digital Deluxe,Definitive,Anniversary,Complete,Extended,Ultiamte,Collector's,Bronze,Silver,Gold,Platinum,Enhanced,Premium,etc.

                function normalize(string, ...conditions) {
                    conditions = [
                        [LE_QUOTES, '"'],
                        [LE_APOSTE, "'"],
                        [NON_ASCII, ''],
                    ].concat(conditions);

                    for(let [expression, replacement] of conditions)
                        string = string?.replace(expression, replacement);

                    return string?.replace(EditionsRegExp, '') ?? '';
                }

                /*** Get the Steam link (if applicable)
                 *       _____ _
                 *      / ____| |
                 *     | (___ | |_ ___  __ _ _ __ ___
                 *      \___ \| __/ _ \/ _` | '_ ` _ \
                 *      ____) | ||  __/ (_| | | | | | |
                 *     |_____/ \__\___|\__,_|_| |_| |_|
                 *
                 *
                 */
                Steam: if(parseBool(Settings.store_integration__steam)) {
                    async function fetchSteamGame(index = 1) {
                        return /*await*/ fetchURL.idempotent(`https://store.steampowered.com/search/suggest?term=${ gameURI }&f=games&cc=${ counCode }&realm=1&l=${ langName }&use_store_query=1&use_search_spellcheck=1`)
                            .then(r => r.text())
                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                            .then(DOM => {
                                for(let item of $.all('[data-ds-appid]', DOM)) {
                                    let href = item.href,
                                        name = normalize($('[class*="name"i]', item)?.textContent)?.normalize('NFKD'),
                                        img = $('[class*="img"i] img', item)?.src,
                                        price = $('[class*="price"i], [class*="subtitle"i]', item)?.textContent || 'More...',
                                        good = game.errs(name, true) < .05;

                                    if(good)
                                        return { game, name, href, img, price, good };
                                }

                                return {};
                            });
                    }

                    fetchSteamGame()
                        .then((info = {}) => {
                            let { game, name, href, img, price, good = false } = info;

                            if(!href?.length)
                                return;

                            let f = furnish;

                            let purchase =
                                f(`.tt-store-purchase--container.is-steam[name="${ name }"][@goodMatch=${ good }]`).with(
                                    // Price
                                    f('.tt-store-purchase--price').with(price),

                                    // Link to Steam
                                    f('.tt-store-purchase--handler').with(
                                        f(`a#steam-link[href="${ href }"][target=_blank]`).html(`Steam&reg;`)
                                    )
                                );

                            // $('.tt-store-purchase--price', purchase).setAttribute('style', `background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_steam) }") no-repeat center 100% / contain, #000;`);

                            when.defined(() => $('#tt-steam-purchase'))
                                .then(container => {
                                    // Load the maturity warning (if applicable)...
                                    fetchURL.idempotent(href.replace(/^\/\//, 'https:$&'))
                                        .then(r => r.text())
                                        .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                        .then(DOM => {
                                            $('.tt-store-purchase--container.is-steam').dataset.matureContent = (null
                                                // Steam will error-out if you try to load an adult-only game...
                                                // Or... There will be a mature label
                                                // Or... There will be an "Age Gate"
                                                // Or... The content descriptor will be defined

                                                // Too much text...
                                                // || $('[id*="age"i][id*="gate"i], [id*="content"i][id*="desc"i]', DOM)?.textContent
                                                || $.defined('[id*="error"i], [id*="mature"i], [id*="age"i][id*="gate"i], [id*="content"i][id*="desc"i]', DOM)
                                            )
                                        })
                                        .catch(error => {
                                            WARN(`Unable to fetch Steam pricing information for "${ game }"`, error);
                                        });

                                    container.replaceWith(purchase);
                                });

                            LOG(`Got "${ game }" data from Steam:`, info);
                        })
                        .catch(error => {
                            WARN(`Unable to connect to Steam. Tried to look for "${ game }"`, error);
                        });
                }

                /*** Get the PlayStation link (if applicable) · 1,662 Games 2022-11-22 16:37 CST
                 *      _____  _              _____ _        _   _
                 *     |  __ \| |            / ____| |      | | (_)
                 *     | |__) | | __ _ _   _| (___ | |_ __ _| |_ _  ___  _ __
                 *     |  ___/| |/ _` | | | |\___ \| __/ _` | __| |/ _ \| '_ \
                 *     | |    | | (_| | |_| |____) | || (_| | |_| | (_) | | | |
                 *     |_|    |_|\__,_|\__, |_____/ \__\__,_|\__|_|\___/|_| |_|
                 *                      __/ |
                 *                     |___/
                 */
                PlayStation: if(parseBool(Settings.store_integration__playstation)) {
                    async function fetchPlayStationGame(game, index = 1, pages = 1) {
                        return fetchURL.idempotent(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/psn/${ (game[0].toLowerCase().replace(/[^a-z]/, '_')) }.json`)
                            .then(r => r.json())
                            .then(data => {
                                let [best, ...othr] = data.sort((prev, next) =>
                                    normalize(prev.name, [PlayStationRegExp, ''])
                                        .errs(game)
                                    - normalize(next.name, [PlayStationRegExp, ''])
                                        .errs(game)
                                )
                                    .slice(0, 60)
                                    .sort((prev, next) =>
                                        normalize(prev.name, [PlayStationRegExp, ''])
                                            .toLowerCase()
                                            .distanceFrom(game.toLowerCase())
                                        - normalize(next.name, [PlayStationRegExp, ''])
                                            .toLowerCase()
                                            .distanceFrom(game.toLowerCase())
                                    );

                                if(false
                                    || best.name.equals(game)
                                    || normalize(best.name, [PlayStationRegExp, ''])
                                        .trim()
                                        .equals(game)
                                    || normalize(best.name, [PlayStationRegExp, ''])
                                        .errs(game) < PARTIAL_MATCH_THRESHOLD
                                ) return ({
                                    game,
                                    good: (
                                        normalize(best.name, [PlayStationRegExp, ''])
                                            .errs(game, true) < PARTIAL_MATCH_THRESHOLD
                                    ),
                                    name: best.name,
                                    href: best.href,
                                    img: best.image,
                                    price: best.price,
                                });

                                throw ITEM_NOT_FOUND;
                            })
                            .catch(error => {
                                // Fallback: Search the store normally
                                if(error == ITEM_NOT_FOUND)
                                    return /*await*/ fetchURL.idempotent(`https://store.playstation.com/${ lang }/search/${ gameURI }`)
                                        .then(r => r.text())
                                        .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                        .then(async DOM => {
                                            let items = [];

                                            for(let element of $.all('#main li > [data-qa^="search"i]', DOM))
                                                items.push({
                                                    id: $('[href]', element)?.href?.slice(1).split('/').pop(),
                                                    name: $('[data-qa*="product-name"i]', element)?.textContent,
                                                    href: $('[href]', element)?.href?.replace(/^\/([^\/].+)$/, 'https://store.playstation.com/$1'),
                                                    img: $('img[loading]', element)?.src,
                                                    price: $('[data-qa*="display-price"i]', element)?.textContent,
                                                    platforms: $.all('[data-qa*="game"i][data-qa*="tag"i]', element).map(tag => tag.textContent.trim()),
                                                });

                                            items = items.sort((prev, next) =>
                                                normalize(prev.name, [PlayStationRegExp, ''])
                                                    .errs(game)
                                                - normalize(next.name, [PlayStationRegExp, ''])
                                                    .errs(game)
                                            )
                                                .slice(0, 60)
                                                .sort((prev, next) =>
                                                    normalize(prev.name, [PlayStationRegExp, ''])
                                                        .toLowerCase()
                                                        .distanceFrom(game.toLowerCase())
                                                    - normalize(next.name, [PlayStationRegExp, ''])
                                                        .toLowerCase()
                                                        .distanceFrom(game.toLowerCase())
                                                );

                                            for(let item of items)
                                                if(true
                                                    && item.platforms?.length
                                                    && (false
                                                        || item.name?.equals(
                                                            normalize(game, [PlayStationRegExp, ''])
                                                        )
                                                        || normalize(item.name, [PlayStationRegExp, ''])
                                                            ?.errs(game) < PARTIAL_MATCH_THRESHOLD
                                                    )
                                                )
                                                    return ({
                                                        game,
                                                        good: (
                                                            normalize(item.name , [PlayStationRegExp, ''])
                                                                ?.errs(game, true) < PARTIAL_MATCH_THRESHOLD
                                                        ) || 0,
                                                        name: item.name,
                                                        href: `https://store.playstation.com/${ lang }/product/${ item.id }`,
                                                        img: item.img,
                                                        price: (item.price || 'More...'),
                                                    });

                                            return {};
                                        });

                                WARN(error);
                            });
                    }

                    if(/(?:^(?:The\s+)?Jackbox Party)/i.test(game)) {
                        // Multiple versions are available
                        let [, main, suff, vers = ''] = /^(?:The\s+)?(Jackbox Party)\s+(Pack)s?\s*(\d+)?/i.exec(game);

                        suff = suff.replace(/s$/, '');

                        let jbpp = `The ${ main } ${ suff } ${ vers }`.trim();

                        // Make multiples' links
                        fetchPlayStationGame(jbpp)
                            .then((info = {}) => {
                                let { game, name, href, img, price, good = false } = info;

                                if(!href?.length)
                                    return;

                                let f = furnish;

                                let purchase =
                                    f(`.tt-store-purchase--container.is-playstation[name="${ name }"][@goodMatch=${ good }]`).with(
                                        // Price
                                        f('.tt-store-purchase--price').with(price),

                                        // Link to PlayStation
                                        f('.tt-store-purchase--handler').with(
                                            f(`a#playstation-link[href="${ href }"][target=_blank]`).html(`PlayStation&reg;`)
                                        )
                                    );

                                // $('.tt-store-purchase--price', purchase).setAttribute('style', `background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_playstation) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-playstation-purchase'))
                                    .then(container => {
                                        // Load the maturity warning (if applicable)...
                                        fetchURL.idempotent(href.replace(/^\/\//, 'https:$&'))
                                            .then(r => r.text())
                                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                            .then(DOM => {
                                                let data = $('[class*="content"i][class*="rating"i] script[type*="json"i]', DOM)?.textContent,
                                                    description = $('[data-qa*="overview"i][data-qa*="description"i]', DOM)?.innerHTML;

                                                // Load an actual game description
                                                let gameDesc = $('[data-twitch-provided-description]');

                                                if(defined(gameDesc) && good) {
                                                    $('[data-test-selector="chat-card-title"]').innerHTML += ' &mdash; PlayStation&reg;';

                                                    gameDesc.innerHTML = description?.replace(/([\.!\?])\s*([^\.!\?]+(?:\.{3}|…))\s*$/, '$1') || gameDesc.innerHTML;
                                                    gameDesc.removeAttribute('data-twitch-provided-description');
                                                }

                                                if(!data?.length)
                                                    return;

                                                data = JSON.parse(data);

                                                finder: for(let key in data.cache)
                                                    if(/^product/i.test(key)) {
                                                        let { authority, description, name, url } = data.cache[key].contentRating;

                                                        $('.tt-store-purchase--container.is-playstation').dataset.matureContent = description?.replace(authority, '')?.trim() || parseBool(name?.contains(...MATURE_HINTS));
                                                        $('#tt-content-rating-placeholder')?.replaceWith(f.img({ alt: description, src: url, style: RATING_STYLING }));

                                                        break finder;
                                                    }
                                            })
                                            .catch(error => {
                                                WARN(`Unable to fetch PlayStation pricing information for "${ jbpp }"`, error);
                                            });

                                        container.replaceWith(purchase);
                                    });

                                LOG(`Got "${ jbpp }" data from PlayStation:`, info);
                            })
                            .catch(error => {
                                WARN(`Unable to connect to PlayStation. Tried to look for "${ jbpp }"`, error);
                            });
                    } else {
                        fetchPlayStationGame(game)
                            .then((info = {}) => {
                                let { game, name, href, img, price, good = false } = info;

                                if(!href?.length)
                                    return;

                                let f = furnish;

                                let purchase =
                                    f(`.tt-store-purchase--container.is-playstation[name="${ name }"][@goodMatch=${ good }]`).with(
                                        // Price
                                        f('.tt-store-purchase--price').with(price),

                                        // Link to PlayStation
                                        f('.tt-store-purchase--handler').with(
                                            f(`a#playstation-link[href="${ href }"][target=_blank]`).html(`PlayStation&reg;`)
                                        )
                                    );

                                // $('.tt-store-purchase--price', purchase).setAttribute('style', `background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_playstation) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-playstation-purchase'))
                                    .then(container => {
                                        href = href.replace(/^\/\//, 'https:$&');

                                        // Load the maturity warning (if applicable)...
                                        fetchURL.idempotent(href)
                                            .then(r => r.text())
                                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                            .then(DOM => {
                                                let data = $('[class*="content"i][class*="rating"i] script[type*="json"i]', DOM)?.textContent,
                                                    description = $('[data-qa*="overview"i][data-qa*="description"i]', DOM)?.innerHTML;

                                                // Load an actual game description
                                                let gameDesc = $('[data-twitch-provided-description]');

                                                if(defined(gameDesc) && good) {
                                                    $('[data-test-selector="chat-card-title"]').innerHTML += ' &mdash; PlayStation&reg;';

                                                    gameDesc.innerHTML = description || gameDesc.innerHTML;
                                                    gameDesc.removeAttribute('data-twitch-provided-description');
                                                }

                                                // Load the game's data
                                                if(!data?.length)
                                                    return;

                                                data = JSON.parse(data);

                                                finder: for(let key in data.cache)
                                                    if(/^product/i.test(key)) {
                                                        let { authority, description, name, url } = data.cache[key].contentRating;

                                                        $('.tt-store-purchase--container.is-playstation').dataset.matureContent = description?.replace(authority, '')?.trim() || parseBool(name?.contains(...MATURE_HINTS));
                                                        $('#tt-content-rating-placeholder')?.replaceWith(f.img({ alt: description, src: url, style: RATING_STYLING }));

                                                        break finder;
                                                    }
                                            })
                                            .catch(error => {
                                                WARN(`Unable to fetch PlayStation pricing information for "${ game }"`, error);
                                            });

                                        container.replaceWith(purchase);
                                    });

                                LOG(`Got "${ game }" data from PlayStation:`, info);
                            })
                            .catch(error => {
                                WARN(`Unable to connect to PlayStation. Tried to look for "${ game }"`, error);
                            });
                        }
                }

                /*** Get the Xbox link (if applicable) · 2,964 Games 2022-11-22 16:37 CST
                 *     __   ___
                 *     \ \ / / |
                 *      \ V /| |__   _____  __
                 *       > < | '_ \ / _ \ \/ /
                 *      / . \| |_) | (_) >  <
                 *     /_/ \_\_.__/ \___/_/\_\
                 *
                 *
                 */
                Xbox: if(parseBool(Settings.store_integration__xbox)) {
                    async function fetchXboxGame(game) {
                        return fetchURL.idempotent(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/xbox/${ (game[0].toLowerCase().replace(/[^a-z]/, '_')) }.json`)
                            .then(r => r.json())
                            .then(data => {
                                let [best, ...othr] = data.sort((prev, next) =>
                                    normalize(prev.name, [XboxRegExp, ''])
                                        .errs(game)
                                    - normalize(next.name, [XboxRegExp, ''])
                                        .errs(game)
                                )
                                    .slice(0, 60)
                                    .sort((prev, next) =>
                                        normalize(prev.name, [XboxRegExp, ''])
                                            .toLowerCase()
                                            .distanceFrom(game.toLowerCase())
                                        - normalize(next.name, [XboxRegExp, ''])
                                            .toLowerCase()
                                            .distanceFrom(game.toLowerCase())
                                    );

                                if(false
                                    || best.name.equals(game)
                                    || normalize(best.name, [XboxRegExp, ''])
                                        .trim()
                                        .equals(game)
                                    || normalize(best.name, [XboxRegExp, ''])
                                        .errs(game) < PARTIAL_MATCH_THRESHOLD
                                ) return ({
                                    game,
                                    good: (
                                        normalize(best.name, [XboxRegExp, ''])
                                            .errs(game, true) < PARTIAL_MATCH_THRESHOLD
                                    ),
                                    name: best.name,
                                    href: best.href,
                                    img: best.image,
                                    price: best.price,
                                });

                                throw ITEM_NOT_FOUND;
                            })
                            .catch(error => {
                                // Fallback: Search the store normally
                                if(error == ITEM_NOT_FOUND)
                                    return /*await*/ fetchURL.idempotent(`https://www.microsoft.com/msstoreapiprod/api/autosuggest?market=${ lang }&sources=DCatAll-Products&filter=%2BClientType%3AStoreWeb&query=${ gameURI }`)
                                        .then(r => r.json())
                                        .then(json => {
                                            let info = json
                                                ?.ResultSets
                                                ?.shift()
                                                ?.Suggests
                                                ?.find(({ Description, ImageUrl, Metas, Source, Title, Url }) => Source?.equals('games') && Title?.errs(game) < PARTIAL_MATCH_THRESHOLD);

                                            if(nullish(info))
                                                return {};

                                            let name = normalize(info.Title).normalize('NFKD'),
                                                href = info.Url,
                                                img = info.ImageUrl,
                                                price = 'More...',
                                                errs = parseBool(Title?.errs(game) < PARTIAL_MATCH_THRESHOLD);

                                            return { game, name, href, img, price, errs };
                                        });

                                WARN(error);
                            });
                    }

                    if(/(?:^(?:The\s+)?Jackbox Party)/i.test(game)) {
                        // Multiple versions are available
                        let [, main, suff, vers = ''] = /^(?:The\s+)?(Jackbox Party)\s+(Pack)s?\s*(\d+)?/i.exec(game);

                        suff = suff.replace(/s$/, '');

                        let jbpp = `The ${ main } ${ suff } ${ vers }`.trim();

                        // Make multiples' links
                        fetchXboxGame(jbpp)
                            .then((info = {}) => {
                                let { game, name, href, img, price, good = false } = info;

                                if(!href?.length)
                                    return;

                                let f = furnish;

                                let purchase =
                                    f(`.tt-store-purchase--container.is-xbox[name="${ name }"][@goodMatch=${ good }]`).with(
                                        // Price
                                        f('.tt-store-purchase--price').with(price),

                                        // Link to Xbox
                                        f('.tt-store-purchase--handler').with(
                                            f(`a#xbox-link[href="${ href }"][target=_blank]`).html(`Xbox&reg;`)
                                        )
                                    );

                                // $('.tt-store-purchase--price', purchase).setAttribute('style', `background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_xbox) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-xbox-purchase'))
                                    .then(container => {
                                        // Load the price & maturity warning (if applicable)...
                                        fetchURL.idempotent(href.replace(/^\/\//, 'https:$&'))
                                            .then(r => r.text())
                                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                            .then(DOM => {
                                                let price = (null
                                                    ?? $('[itemprop="price"i]', DOM)?.content
                                                    ?? (null
                                                        ?? $('[class^="price-mod"i][class*="discount"i]', DOM)
                                                        ?? $('[class^="price-mod"i][class*="original"i]', DOM)
                                                        ?? $('[class^="price-mod"i]', DOM)
                                                        ?? $('[class$="price-text"i] *', DOM)
                                                    )?.textContent?.trim()
                                                );
                                                let rating = $('[class*="age"i][class*="rating"i] img', DOM),
                                                    mature = rating?.alt?.toUpperCase()?.contains(...MATURE_HINTS);

                                                rating.modStyle(RATING_STYLING);

                                                $('.is-xbox .tt-store-purchase--price').textContent = /^\$?([\d\.]+|\w+)$/.test(price ?? '')? price: info.price;
                                                $('.tt-store-purchase--container.is-xbox').dataset.matureContent = (rating.alt || mature);
                                                $('#tt-content-rating-placeholder')?.replaceWith(rating);
                                            })
                                            .catch(error => {
                                                WARN(`Unable to fetch Xbox pricing information for "${ jbpp }"`, error);
                                            });

                                        // TODO: Make this faster somehow!
                                        // Slow as hell!
                                        fetchURL.idempotent(href.replace(/^\/\//, 'https:$&'))
                                            .then(r => r.text())
                                            .then(DOMParser.stripBody)
                                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                            .then(DOM => {
                                                let description = (null
                                                    ?? $('[id][class*="description"i]')?.textContent
                                                    ?? $('meta[name="description"i]', DOM)?.content
                                                );

                                                // Load an actual game description
                                                let gameDesc = $('[data-twitch-provided-description]');

                                                if(defined(gameDesc) && good) {
                                                    $('[data-test-selector="chat-card-title"]').innerHTML += ' &mdash; Xbox&reg;';

                                                    gameDesc.innerText = description || gameDesc.innerText;
                                                    gameDesc.removeAttribute('data-twitch-provided-description');
                                                }

                                                return /* TODO: Get this to work without freezing the machine */;

                                                let data = DOM.head.getElementByText('core2')?.textContent?.replace(/.*preload.*(\{[^$]+?\});/, '$1');

                                                if(data?.length) {
                                                    data = JSON.parse(data).core2?.products?.productSummaries?.[gameID];

                                                    if(nullish(data?.specificPrices))
                                                        return;

                                                    let mature = data.contentRating?.rating || '',
                                                        price = data.specificPrices?.purchaseable?.shift?.()?.listPrice;

                                                    $('.tt-store-purchase--container.is-xbox').dataset.matureContent = mature;
                                                    $('.is-xbox .tt-store-purchase--price').textContent = /^\$?([\d\.]+|\w+)$/.test(price ?? '')? price: info.price;
                                                }
                                            });

                                        container.replaceWith(purchase);
                                    });
                            })
                            .catch(error => {
                                WARN(`Unable to connect to Xbox. Tried to look for "${ jbpp }"`, error);
                            });
                    } else {
                        fetchXboxGame(game)
                            .then((info = {}) => {
                                let { game, name, href, img, price, good = false } = info;

                                if(!href?.length)
                                    return;

                                let f = furnish;

                                let purchase =
                                    f(`.tt-store-purchase--container.is-xbox[name="${ name }"][@goodMatch=${ good }]`).with(
                                        // Price
                                        f('.tt-store-purchase--price').with(price),

                                        // Link to Xbox
                                        f('.tt-store-purchase--handler').with(
                                            f(`a#xbox-link[href="${ href }"][target=_blank]`).html(`Xbox&reg;`)
                                        )
                                    );

                                // $('.tt-store-purchase--price', purchase).setAttribute('style', `background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_xbox) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-xbox-purchase'))
                                    .then(container => {
                                        // Load the price & maturity warning (if applicable)...
                                        fetchURL.idempotent(href.replace(/^\/\//, 'https:$&'))
                                            .then(r => r.text())
                                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                            .then(DOM => {
                                                let price = (null
                                                    ?? $('[itemprop="price"i]', DOM)?.content
                                                    ?? (null
                                                        ?? $('[class^="price-mod"i][class*="discount"i]', DOM)
                                                        ?? $('[class^="price-mod"i][class*="original"i]', DOM)
                                                        ?? $('[class^="price-mod"i]', DOM)
                                                        ?? $('[class$="price-text"i] *', DOM)
                                                    )?.textContent?.trim()
                                                );
                                                let rating = $('[class*="age"i][class*="rating"i] img', DOM),
                                                    mature = rating?.alt?.toUpperCase()?.contains(...MATURE_HINTS);

                                                rating?.modStyle(RATING_STYLING);

                                                $('.is-xbox .tt-store-purchase--price').textContent = /^\$?([\d\.]+|\w+)$/.test(price ?? '')? price: info.price;
                                                $('.tt-store-purchase--container.is-xbox').dataset.matureContent = (rating?.alt || mature);
                                                $('#tt-content-rating-placeholder')?.replaceWith(rating);
                                            })
                                            .catch(error => {
                                                WARN(`Unable to fetch Xbox pricing information for "${ game }"`, error);
                                            });

                                        // TODO: Make this faster somehow!
                                        // Slow as hell!
                                        fetchURL.idempotent(href.replace(/^\/\//, 'https:$&'))
                                            .then(r => r.text())
                                            .then(DOMParser.stripBody)
                                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                            .then(DOM => {
                                                let description = (null
                                                    ?? $('[id][class*="description"i]')?.textContent
                                                    ?? $('meta[name="description"i]', DOM)?.content
                                                );

                                                // Load an actual game description
                                                let gameDesc = $('[data-twitch-provided-description]');

                                                if(defined(gameDesc) && good) {
                                                    $('[data-test-selector="chat-card-title"]').innerHTML += ' &mdash; Xbox&reg;';

                                                    gameDesc.innerText = description || gameDesc.innerText;
                                                    gameDesc.removeAttribute('data-twitch-provided-description');
                                                }

                                                return /* TODO: Get this to work without freezing the machine */;

                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */
                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */
                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */
                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */
                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */
                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */
                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */
                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */
                                                /* 🍌🍌🍌🍌🍌🍌🍌🍌 */

                                                let data = DOM.head.getElementByText('core2')?.textContent?.replace(/.*preload.*(\{[^$]+?\});/, '$1');

                                                if(data?.length) {
                                                    // Xbox | Product Summaries
                                                        // accessibilityCapabilities: object<{ audio:array, gameplay:array, input:array, publisherInformationUri:string?, visual:array }>
                                                        // availableOn:array<["Xbox", "XboxOne", "XboxSeriesS", "XboxSeriesX"...]>
                                                        // averageRating:number<float>
                                                        // bundledProductIds:array<[...string]>
                                                        // bundlesBySeed:array<[...string]>
                                                        // capabilities:object<{ `CapabilityKey`:`CapabilityDescription` }>
                                                        // categories:array<[...string]>
                                                        // contentRating:object<{ boardName:string, description:string, disclaimers:array<[...string]>, descriptors:array<[...string]>, imageUri:string<URL>, imageLinkUri:string<URL>, interactiveDescriptions:array<[...string]>, rating:string, ratingAge:number<integer>, ratingDescription:string }>
                                                        // description:string
                                                        // developerName:string
                                                        // editions:array<[...string]>
                                                        // hasAddOns:boolean
                                                        // images:object<{ `ImageType`:object<{ url:string, width:number<integer:pixels>, height:number<integer:pixels> }> }>
                                                        // includedWithPassesProductIds:array<[...string]>
                                                        // languagesSupported:object<{ `Language`:object<{ areSubtitlesSupported:boolean, isAudioSupported:boolean, isInterfaceSupported:boolean, languageDisplayName:string }> }>
                                                        // legalNotices:array<[...string]> of @@capabilities@key
                                                        // maxInstallSize:number<integer:Bytes>
                                                        // optimalSatisfyingPassId:string
                                                        // optimalSkuId:string
                                                        // preferredSkuId:string
                                                        // productFamily:string
                                                        // productId:string
                                                        // publisherName:string
                                                        // ratingCount:number<integer>
                                                        // releaseDate:string<Date:ISO>
                                                        // shortDescription:string
                                                        // showSupportedLanguageDisclaimer:boolean
                                                        // specificPrices:object<{ `PriceType`:array<[ ...object<{ skuId:string, availabilityId:string, listPrice:number<float>, msrp:number<float>, discountPercentage:number<float>, currencyCode:string, remediations:array<[]>, affirmationId:string?, priceEligibilityInfo:object?, availabilityActions:array<[...string]>, endDate:string<Date:ISO>, hasXPriceOffer:boolean }> ]> }>
                                                        // systemRequirements:array<[ object<{ minimum:string, recommended:string, title:string<RequirementType> }> ]>
                                                        // title:string
                                                        // videos:array<[ object<{ title:string, url:string<URL>, width:number<integer:pixels>, height:number<integer:pixels>, previewImage: object<{ url:string, width:number<integer:pixels>, height:number<integer:pixels>, caption:string }>, purpose:string }> ]>
                                                    data = JSON.parse(data).core2?.products?.productSummaries?.[gameID];

                                                    if(nullish(data?.specificPrices))
                                                        return;

                                                    let mature = data.contentRating?.rating || '',
                                                        price = data.specificPrices?.purchaseable?.shift?.()?.listPrice;

                                                    $('.tt-store-purchase--container.is-xbox').dataset.matureContent = mature;
                                                    $('.is-xbox .tt-store-purchase--price').textContent = /^\$?([\d\.]+|\w+)$/.test(price ?? '')? price: info.price;
                                                }
                                            });

                                        container.replaceWith(purchase);
                                    });

                                LOG(`Got "${ game }" data from Xbox:`, info);
                            })
                            .catch(error => {
                                WARN(`Unable to connect to Xbox. Tried to look for "${ game }"`, error);
                            });
                        }
                }

                /*** Get the Nintendo link (if applicable) · 10,507 Games 2022-11-22 16:37 CST
                 *      _   _ _       _                 _
                 *     | \ | (_)     | |               | |
                 *     |  \| |_ _ __ | |_ ___ _ __   __| | ___
                 *     | . ` | | '_ \| __/ _ \ '_ \ / _` |/ _ \
                 *     | |\  | | | | | ||  __/ | | | (_| | (_) |
                 *     |_| \_|_|_| |_|\__\___|_| |_|\__,_|\___/
                 *
                 *
                 */
                Nintendo: if(parseBool(Settings.store_integration__nintendo)) {
                    async function fetchNintendoGame(game) {
                        return fetchURL.idempotent(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/nintendo/${ (game[0].toLowerCase().replace(/[^a-z]/, '_')) }.json`)
                            .then(r => r.json())
                            .then(data => {
                                let [best, ...othr] = data.sort((prev, next) =>
                                    normalize(prev.name, [NintendoRegExp, ''])
                                        .errs(game)
                                    - normalize(next.name, [NintendoRegExp, ''])
                                        .errs(game)
                                )
                                    .slice(0, 60)
                                    .sort((prev, next) =>
                                        normalize(prev.name, [NintendoRegExp, ''])
                                            .toLowerCase()
                                            .distanceFrom(game.toLowerCase())
                                        - normalize(next.name, [NintendoRegExp, ''])
                                            .toLowerCase()
                                            .distanceFrom(game.toLowerCase())
                                    );

                                if(false
                                    || best.name.equals(game)
                                    || normalize(best.name, [NintendoRegExp, ''])
                                        .trim()
                                        .equals(game)
                                    || normalize(best.name, [NintendoRegExp, ''])
                                        .errs(game) < .07
                                ) return ({
                                    game,
                                    good: (
                                        normalize(best.name, [NintendoRegExp, ''])
                                            .errs(game, true) < PARTIAL_MATCH_THRESHOLD
                                    ),
                                    name: best.name,
                                    href: best.href,
                                    img: best.image,
                                    price: best.price,
                                    rating: best.rating,
                                });

                                throw ITEM_NOT_FOUND;
                            })
                            .catch(error => {
                                // Fallback: Search the store normally
                                if(error == ITEM_NOT_FOUND)
                                    return /*await*/ fetchURL.idempotent(`https://u3b6gr4ua3-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(4.14.2)%3B%20Browser%3B%20JS%20Helper%20(3.11.1)%3B%20react%20(17.0.2)%3B%20react-instantsearch%20(6.38.0)`, {
                                        headers: {
                                            'accept': '*/*',
                                            'accept-language': 'en-US,en;q=0.9',
                                            'content-type': 'application/x-www-form-urlencoded',
                                            'sec-ch-ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
                                            'sec-ch-ua-mobile': '?0',
                                            'sec-ch-ua-platform': '"Windows"',
                                            'sec-fetch-dest': 'empty',
                                            'sec-fetch-mode': 'cors',
                                            'sec-fetch-site': 'cross-site',
                                            'x-algolia-api-key': 'a29c6927638bfd8cee23993e51e721c9',
                                            'x-algolia-application-id': 'U3B6GR4UA3'
                                        },
                                        referrer: 'https://www.nintendo.com/',
                                        referrerPolicy: 'strict-origin-when-cross-origin',
                                        body: JSON.stringify({
                                                requests: [{
                                                indexName: 'store_all_products_en_us',
                                                query: game,
                                                params: encodeURI`filters=&hitsPerPage=120&analytics=false&facetingAfterDistinct=true&clickAnalytics=false&highlightPreTag=^*^^&highlightPostTag=^*&attributesToHighlight=["description"]`,
                                            }]
                                        }),
                                        method: 'POST',
                                        mode: 'cors',
                                        credentials: 'omit'
                                    })
                                        .then(r => r.json())
                                        // Nintendo | Agolia Results (Object)
                                          // results:array<object<{
                                          //    exhaustive:object<{ nbHits:boolean, type:boolean }>
                                          //    exhaustiveNbHits:boolean
                                          //    exhaustiveTypo:boolean
                                          //    hits:array<object<{
                                          //        availability:array<string>
                                          //        categoryIds:array<string>
                                          //        collectionPriceRange:string
                                          //        contentRatingCode:string
                                          //        corePlatforms:array<string>
                                          //        createdAt:string<ISO-Date>
                                          //        demoNsuid:string?
                                          //        description:string
                                          //        dlcType:string?
                                          //        editions:array<string>
                                          //        eshopDetails:object<{ discountedPriceEnd:string?<ISO-Date>, goldPoints:number<int>, baseGoldPoints:number<int> }>
                                          //        esrbDescriptors:array<string>
                                          //        esrbRating:string
                                          //        exclusive:boolean
                                          //        featuredProduct:boolean
                                          //        franchises:array<?>
                                          //        genres:array<string>
                                          //        hasDlc:boolean
                                          //        nsoFeatures:array<?>?
                                          //        nsuid:string
                                          //        objectId:string
                                          //        platform:string
                                          //        platformCode:string
                                          //        platinumPoints:number?<int>
                                          //        playModes:array<string>
                                          //        playerCount:string
                                          //        price:object<{ finalPrice:number<float>, regPrice:number?<float>, salePrice:number<float> }>
                                          //        priceRange:string
                                          //        productImage:string<URL-pathname>
                                          //        relaseDateDisplay:string?<ISO-Date>
                                          //        sku:string
                                          //        softwareDeveloper:string
                                          //        softwarePublisher:string
                                          //        stockStatus:string
                                          //        storeId:string
                                          //        title:string
                                          //        topLevelCategory:string
                                          //        topLevelCategoryCode:string
                                          //        topLevelFilters:array<string>
                                          //        updatedAt:string<ISO-Date>
                                          //        url:string<URL-pathname>
                                          //        urlKey:string
                                          //        visibleInSearch:boolean
                                          //        _distinctSeqId:number<?>
                                          //        _highlightResult:object<{ description:object<{ fullyHighlighted:boolean, matchLevel:string, matchedWords:array<string>, value:string }> }>
                                          //    }>>
                                          //    hitsPerPage:number<int>
                                          //    index:string
                                          //    nbHits:number<int>
                                          //    nbPages:number<int>
                                          //    page:number<int>
                                          //    aprams:string<URL-search>
                                          //    processingTimeMS:number<int>
                                          //    processingTimingMS:object<{ total:number<int> }>
                                          //    query:string
                                          //    renderingContent:object<?>
                                          // }>>
                                        .then(j =>
                                            j.results.shift().hits
                                                .filter(item => item.topLevelCategoryCode.equals('GAMES') && item.topLevelFilters.missing('DLC', 'DLC bundle'))
                                                .map(item => ({
                                                    name: item.title,
                                                    price: (item.price?.regPrice || 'Free').toString().replace(/^\d/, '$$$&'),
                                                    image: item.productImage,
                                                    href: `https://www.nintendo.com${ item.url }`,
                                                    uuid: item.nsuid,
                                                    platforms: [item.platform],
                                                    rating: ({ 'E': 'everyone', 'E10': 'everyone 10+', 'RP': 'rating pending', 'T': 'teen', 'M': 'mature 17+' }[item.esrbRating]) || item.esrbRating || 'none',
                                                }))
                                        );

                                WARN(error);
                            });
                    }

                    if(/(?:^Pok[ée]mon)/i.test(game)) {
                        // Multiple versions are available
                        let [, main, vers] = /(^Pok[ée]mon)\s+(.+)$/i.exec(game);

                        vers = vers.split('/').map(v => v.trim());

                        // Make multiple links...
                        for(let ver of vers)
                            fetchNintendoGame(main + ver)
                                .then((info = {}) => {
                                    let { game, name, href, img, price, rating = 'none', good = false } = info;

                                    img = `https://assets.nintendo.com/image/upload/ar_16:9,b_auto:border,c_lpad/b_white/f_auto/q_auto/dpr_1.0/c_scale,w_700/${ img }`;

                                    if(!href?.length)
                                        return;

                                    fetchURL.idempotent(href.replace(/^\/\//, 'https:$&'))
                                        .then(r => r.text())
                                        .then(DOMParser.stripBody)
                                        .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                        .then(DOM => {
                                            let description = (null
                                                ?? JSON.parse($('script[id*="data"i][type$="json"i]')?.textContent ?? "{}").props?.pageProps?.meta?.description
                                                ?? $('meta[name="description"i]', DOM)?.content
                                            );

                                            // Load an actual game description
                                            let gameDesc = $('[data-twitch-provided-description]');

                                            if(defined(gameDesc) && good) {
                                                $('[data-test-selector="chat-card-title"]').innerHTML += ' &mdash; Nintendo&reg;';

                                                gameDesc.innerText = [description, gameDesc.innerText].sort((a, b) => b.length - a.length).pop().replace(/([\.!\?])\s*(?:\.{3}|…)\s*$/, '$1');
                                                gameDesc.removeAttribute('data-twitch-provided-description');
                                            }
                                        });

                                    let f = furnish;

                                    let purchase =
                                        f(`.tt-store-purchase--container.is-nintendo[name="${ name }"][@versionName="${ main } ${ ver }"][@goodMatch=${ good }]`).with(
                                            // Price
                                            f('.tt-store-purchase--price').with(price),

                                            // Link to Nintendo
                                            f('.tt-store-purchase--handler').with(
                                                f(`a#nintendo-link[href="${ href }"][target=_blank]`).html(`Nintendo&reg;`)
                                            )
                                        );

                                    // $('.tt-store-purchase--price', purchase).setAttribute('style', `background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_nintendo) }") no-repeat center 100% / contain, #000;`);

                                    when.defined(() => $('#tt-nintendo-purchase'))
                                        .then(container => {
                                            container.replaceWith(purchase);

                                            new Tooltip(purchase, `ESRB (USA): ${ rating.toUpperCase() }`, { from: 'top' });

                                            if($.all('.is-nintendo').length < vers.length)
                                                $('#tt-purchase-container').append(
                                                    f('#tt-nintendo-purchase')
                                                );
                                        });

                                    LOG(`Got "${ game }" data from Nintendo:`, info);
                                })
                                .catch(error => {
                                    WARN(`Unable to connect to Nintendo. Tried to look for "${ game }"`, error);
                                });
                    } else if(/(?:^(?:The\s+)?Jackbox Party)/i.test(game)) {
                        // Multiple versions are available
                        let [, main, suff, vers = ''] = /^(?:The\s+)?(Jackbox Party)\s+(Pack)s?\s*(\d+)?/i.exec(game);

                        suff = suff.replace(/s$/, '');

                        let jbpp = `The ${ main } ${ suff } ${ vers }`.trim();

                        // Make multiples' links
                        fetchNintendoGame(jbpp)
                            .then((info = {}) => {
                                let { game, name, href, img, price, rating = 'none', good = false } = info;

                                img = `https://assets.nintendo.com/image/upload/ar_16:9,b_auto:border,c_lpad/b_white/f_auto/q_auto/dpr_1.0/c_scale,w_700/${ img }`;

                                if(!href?.length)
                                    return;

                                let f = furnish;

                                let purchase =
                                    f(`.tt-store-purchase--container.is-nintendo[@matureContent="${ rating.toUpperCase() }"][name="${ name }"][@goodMatch=${ good }]`).with(
                                        // Price
                                        f('.tt-store-purchase--price').with(price),

                                        // Link to Nintendo
                                        f('.tt-store-purchase--handler').with(
                                            f(`a#nintendo-link[href="${ href }"][target=_blank]`).html(`Nintendo&reg;`)
                                        )
                                    );

                                // $('.tt-store-purchase--price', purchase).setAttribute('style', `background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_nintendo) }") no-repeat center 100% / contain, #000;`);

                                LOG(`Got "${ jbpp }" data from Nintendo:`, info);
                            })
                            .catch(error => {
                                WARN(`Unable to connect to Nintendo. Tried to look for "${ jbpp }"`, error);
                            });
                    } else {
                        // Just one version is available
                        fetchNintendoGame(game)
                            .then((info = {}) => {
                                let { game, name, href, img, price, rating = 'none', good = false } = info;

                                img = `https://assets.nintendo.com/image/upload/ar_16:9,b_auto:border,c_lpad/b_white/f_auto/q_auto/dpr_1.0/c_scale,w_700/${ img }`;

                                if(!href?.length)
                                    return;

                                fetchURL.idempotent(href.replace(/^\/\//, 'https:$&'))
                                    .then(r => r.text())
                                    .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                    .then(DOM => {
                                        let description = (null
                                            ?? JSON.parse($('script[id*="data"i][type$="json"i]')?.textContent ?? "{}").props?.pageProps?.meta?.description
                                            ?? $('meta[name="description"i]', DOM)?.content
                                        );

                                        // Load an actual game description
                                        let gameDesc = $('[data-twitch-provided-description]');

                                        if(defined(gameDesc) && good) {
                                            $('[data-test-selector="chat-card-title"]').innerHTML += ' &mdash; Nintendo&reg;';

                                            gameDesc.innerHTML = [description, gameDesc.innerText].sort((a, b) => b.length - a.length).pop()?.replace(/([\.!\?])\s*(?:\.{3}|…)\s*$/, '$1') || gameDesc.innerHTML;
                                            gameDesc.removeAttribute('data-twitch-provided-description');
                                        }
                                    });

                                let f = furnish;

                                let purchase =
                                    f(`.tt-store-purchase--container.is-nintendo[@matureContent="${ rating.toUpperCase() }"][name="${ name }"][@goodMatch=${ good }]`).with(
                                        // Price
                                        f('.tt-store-purchase--price').with(price),

                                        // Link to Nintendo
                                        f('.tt-store-purchase--handler').with(
                                            f(`a#nintendo-link[href="${ href }"][target=_blank]`).html(`Nintendo&reg;`)
                                        )
                                    );

                                // $('.tt-store-purchase--price', purchase).setAttribute('style', `background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_nintendo) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-nintendo-purchase'))
                                    .then(container => {
                                        container.replaceWith(purchase);
                                    });

                                LOG(`Got "${ game }" data from Nintendo:`, info);
                            })
                            .catch(error => {
                                WARN(`Unable to connect to Nintendo. Tried to look for "${ game }"`, error);
                            });
                    }
                }
            }
    };

    Timers.game_overview_card = 5_000;

    Unhandlers.game_overview_card = () => {
        $('#game-overview-card')?.remove();
    };

    __GameOverviewCard__:
    // On by Default (ObD; v5.23)
    if(nullish(Settings.game_overview_card) || parseBool(Settings.game_overview_card)) {
        REMARK('Adding game overview card...');

        RegisterJob('game_overview_card');
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

    Cache.load([`WatchTime${ (!UP_NEXT_ALLOW_THIS_TAB? 'Alt': '') }`], ({ WatchTime = 0, WatchTimeAlt = 0 }) => {
        STARTED_WATCHING -= (!UP_NEXT_ALLOW_THIS_TAB? WatchTimeAlt: WatchTime);
    });

    function GET_WATCH_TIME() {
        return (+new Date) - STARTED_WATCHING;
    }

    Handlers.auto_follow_raids = () => {
        new StopWatch('auto_follow_raids');

        if(nullish(STREAMER))
            return StopWatch.stop('auto_follow_raids');

        let url = parseURL(location),
            data = url.searchParameters;

        let { like, follow } = STREAMER,
            raid = parseBool(data.referrer?.equals('raid') || data.raided);

        if(!like && raid)
            follow();

        Cache.load('LastRaid', ({ LastRaid }) => {
            let { from, to, type } = LastRaid || {};

            if(!like && to?.equals?.(STREAMER.name))
                follow();
        });

        StopWatch.stop('auto_follow_raids');
    };
    Timers.auto_follow_raids = 1000;

    __AutoFollowRaid__:
    if(parseBool(Settings.auto_follow_raids) || parseBool(Settings.auto_follow_all)) {
        RegisterJob('auto_follow_raids');
    }

    let AUTO_FOLLOW_EVENT;
    Handlers.auto_follow_time = async() => {
        new StopWatch('auto_follow_time');

        let { like, follow } = STREAMER,
            mins = parseInt(Settings.auto_follow_time_minutes) | 0;

        if(!like) {
            let secs = GET_WATCH_TIME() / 1000;

            if(secs > (mins * 60))
                follow();

            AUTO_FOLLOW_EVENT ??= setTimeout(follow, mins * 60_000);
        }

        StopWatch.stop('auto_follow_time');
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
        new StopWatch('kill_extensions');

        let extension_views = $.all('[class^="extension-view"i]');

        for(let view of extension_views)
            view.setAttribute('style', 'display:none!important');

        StopWatch.stop('kill_extensions');
    };
    Timers.kill_extensions = -2_500;

    Unhandlers.kill_extensions = () => {
        let extension_views = $.all('[class^="extension-view"i]');

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
        for(let MAX_ITER = 3 * string.count('$'), regexp = /\$?(\([^\(\)]+?\)|\{[^\{\}]+?\}|\[[^\[\]]+?\])/; regexp.test(string) && --MAX_ITER > 0;)
            string = string.replace(regexp, ($0, $1, $$, $_) => {
                let path = $1.replace(/^[\(\[\{]|[\}\]\)]$/g, '').split(/[\s\.]+/).filter(string => !!string.length);

                let gameText = STREAMER.game + '';
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

                        lastmessage: Chat.get().filter(({ author }) => USERNAME.equals(author)).pop(),
                        lastseen: toTimeString(0, '!minute_m !second_s'),
                        lastactive: toTimeString(0, '!minute_m !second_s'),

                        time_online: toTimeString((parseCoin($('#tt-points-receipt')?.textContent) / 320) * 4000),
                        time_offline: toTimeString(+(new Date) - +new Date(STREAMER.data?.lastSeen || $('#root').dataset.aPageLoaded)),
                    },
                    user1: USERNAME,
                    '2': USERNAME,
                    user2: STREAMER.name,
                    '1': STREAMER.name,

                    channel: {
                        _: STREAMER.name,
                        [STREAMER.name]: STREAMER.name,
                        [USERNAME]: USERNAME,
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

                    game: {
                        _: gameText,
                        [STREAMER.name]: gameText,
                        [USERNAME]: gameText,
                    },

                    pointsname: STREAMER.fiat,

                    uptime: toTimeString(STREAMER.time),

                    // NightBot
                    channelid: STREAMER.sole,
                    userlevel: 'everyone',
                    sender: USERNAME,
                    touser: USERNAME,

                    // Either...
                    customapi: `ℂ𝕦𝕤𝕥𝕠𝕞 𝔸ℙ𝕀`,

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
            ?.replace(/^\/(?:\w\S+)\s*/, '');

        return string;
    }

    function decodeMD(string = '') {
        return string
            .replace(/(`{3})((?:[\w\-]+\s)?)([^$]+)\1/g, '<code type="$2">$3</code>')
            .replace(/([`]{1})([^\1]+)\1/g, '<code>$2</code>')
            .replace(/([\*_]{3})([^\1]+)\1/g, '<strong><em>$2</em></strong>')
            .replace(/([\*_]{2})([^\1]+)\1/g, '<strong>$2</strong>')
            .replace(/([\*_]{1})([^\1]+)\1/g, '<em>$2</em>')
            .replace(/!\[([^\[\]]+?)\]\(([^\(\)]+?)\)/g, '<img alt="$1" src="$2"/>')
            .replace(/\[([^\[\]]+?)\]\(([^\(\)]+?)\)/g, '<a href="$2" target="_blank">$1</a>')
            .replace(/([~]{1})([^$]+)\1/g, '<span style="text-decoration:1px line-through!important">$2</span>')
            .replace(/([#]{1,3})([^$]+)\1/g, ($0, $1, $2, $$, $_) => {
                /** Available scripting types:
                 * (1) OPF → 𝕋𝕙𝕖 𝕢𝕦𝕚𝕔𝕜 𝕓𝕣𝕠𝕨𝕟 𝕗𝕠𝕩 𝕛𝕦𝕞𝕡𝕖𝕕 𝕠𝕧𝕖𝕣 𝕥𝕙𝕖 𝕝𝕒𝕫𝕪 𝕕𝕠𝕨𝕟
                 * (2) SCR → 𝒯𝒽ℯ 𝓆𝓊𝒾𝒸𝓀 𝒷𝓇ℴ𝓌𝓃 𝒻ℴ𝓍 𝒿𝓊𝓂𝓅ℯ𝒹 ℴ𝓋ℯ𝓇 𝓉𝒽ℯ 𝓁𝒶𝓏𝓎 𝒹ℴ𝓌𝓃
                 * (3) FR  → 𝔗𝔥𝔢 𝔮𝔲𝔦𝔠𝔨 𝔟𝔯𝔬𝔴𝔫 𝔣𝔬𝔵 𝔧𝔲𝔪𝔭𝔢𝔡 𝔬𝔳𝔢𝔯 𝔱𝔥𝔢 𝔩𝔞𝔷𝔶 𝔡𝔬𝔴𝔫
                 */
                let type = ['opf','scr','fr'][$1.length - 1];

                let string = '';
                for(let char of $2)
                    string += (
                        /[a-z]/i.test(char)?
                            `&${ char }${ type };`:
                        char
                    );

                return string;
            })
            .replace(/([#]{1,5})([^$]+)/g, ($0, $1, $2) => `<h${ $1.length }>${ $2.trim() }</h${ $1.length }>`);
    }

    Handlers.parse_commands = async() => {
        let elements = $.all('[data-a-target="stream-title"i], [data-a-target="about-panel"i] *, [data-a-target^="panel"i] *')
            .map($0 => $0.getElementByText(/([!][\w\.\\\/\?\+\(\)\[\]\{\}\*\|]+)/))
            .isolate()
            .filter(defined)
            .filter(e => nullish(e.closest('a[href]')));

        for(let element of elements) {
            for(let { aliases, command, reply, availability, enabled, origin, variables } of await STREAMER.coms)
                // Wait here to keep from lagging the page...
                await wait(1).then(() => {
                    let regexp = RegExp(`([!](?:${ [command, ...aliases].map(s => s.replace(/[\.\\\/\?\+\(\)\[\]\{\}\$\*\|]/g, '\\$&')).join('|') })(?!\\p{L}))`, 'igu');

                    if(!regexp.test(element.innerHTML))
                        return;

                    element.innerHTML = element.innerHTML.replace(regexp, ($0, $1, $$, $_) => {
                        reply = parseCommands(reply, variables);

                        let { href } = parseURL(reply),
                            string;

                        if(parseBool(Settings.parse_commands__create_links) && defined(href))
                            string = `<code tt-code style="border:1px solid currentColor; color:var(--color-colored)!important; white-space:nowrap" contrast="${ THEME__PREFERRED_CONTRAST }" title="${ encodeHTML(reply) }"><a style="color:inherit!important" href="${ href.replace(/^(\w{3,}\.\w{2,})/, `https://$1`) }" target=_blank>${ decodeMD(encodeHTML($1)) } ${ Glyphs.modify('ne_arrow', { height:12, width:12, style:'vertical-align:middle!important' }) }</a></code>`;
                        else
                            string = `<code tt-code style="opacity:${ 2**-!enabled }; white-space:nowrap" title="${ encodeHTML(reply) }">${ decodeMD(encodeHTML($1)) }</code>`;

                        return `<span tt-parse-commands="${ btoa(escape(string)) }">${ $0.split('').join('&zwj;') }</span>`;
                    });
                });

            $.all('[tt-parse-commands]:not([tt-parsed="true"i])').map(element => {
                element.outerHTML = unescape(atob(element.getAttribute('tt-parse-commands')));
                element.setAttribute('tt-parsed', true);
            });
        }

        wait(elements.length * 100).then(() => {
            $.all('[tt-parsed][title]').map(element => {
                let title = decodeHTML(element.getAttribute('title'));

                if(title.length < 1)
                    return;

                new Tooltip(element, title, { from: 'top' });

                element.removeAttribute('title');
            });
        });
    };
    Timers.parse_commands = -1000;

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

        let TwitchRoleBadges = ({
            everyone: 'https://static-cdn.jtvnw.net/user-default-pictures-uv/215b7342-def9-11e9-9a66-784f43822e80-profile_image-70x70.png',
            subscriber: ((STREAMER.jump[STREAMER.name.toLowerCase()]?.stream?.badges?.[`${ STREAMER.sole }_subscriber_0`]?.href) || ''),
            regular: 'https://static-cdn.jtvnw.net/user-default-pictures-uv/215b7342-def9-11e9-9a66-784f43822e80-profile_image-70x70.png',
            twitch_vip: 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3',
            moderator: 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3',
            admin: 'https://static-cdn.jtvnw.net/badges/v1/d97c37bd-a6f5-4c38-8f57-4e4bef88af34/3',
            owner: 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/3',
        });

        $('[data-a-target="chat-input"i]')?.addEventListener('keyup', delay(async event => {
            let { target, code, altKey, ctrlKey, metaKey, shiftKey } = event,
                value = (target?.value ?? target?.textContent ?? target?.innerText),
                [tray, chat] = target.closest('div:not([class])').firstElementChild.children,
                f = furnish;

            if(['Tab', 'Space', 'Enter', 'Escape'].contains(code) || value?.contains(' ') || !value?.startsWith('!')) {
                let command = $('.tt-chat-input-suggestion')?.getAttribute('command');
                if(code.equals('Tab') && defined(command)) {
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

            value = value.slice(1).toLowerCase();

            let listable = (AvailableCommands ??= await STREAMER.coms)
                .sort((a, b) => (
                        (false
                            || (true
                                && a.command.toLowerCase().contains(value)
                                && b.command.toLowerCase().missing(value)
                            )
                            || (true
                                && defined(a.aliases.find(aka => aka.toLowerCase().contains(value)))
                                && nullish(b.aliases.find(aka => aka.toLowerCase().contains(value)))
                            )
                        )?
                            -1:
                        (false
                            || (true
                                && b.command.toLowerCase().contains(value)
                                && a.command.toLowerCase().missing(value)
                            )
                            || (true
                                && defined(b.aliases.find(aka => aka.toLowerCase().contains(value)))
                                && nullish(a.aliases.find(aka => aka.toLowerCase().contains(value)))
                            )
                        )?
                            +1:
                        0
                    )
                )
                .slice(0, 30)
                .map(data => ({ ...data, textDistance: Math.min(...[data.command, ...data.aliases].map(string => levenshtein(value, string.toLowerCase()))) }))
                .sort((a, b) => a.textDistance - b.textDistance)
                .slice(0, 5);

            tray.classList.add('tt-chat-input-tray__open');

            chat.classList.add('tt-chat-input-container__open');
            chat.firstElementChild.classList.add('tt-chat-input-container__input-wrapper');

            if(listable.length < 1) {
                $('#tt-tcito1')?.remove();

                tray.firstElementChild.append(
                    f('#tt-tcito1').with(
                        f('.tcito2').with(
                            f('.tcito3').with(
                                f('div', { style: `max-height:3rem!important` },
                                    f('div', { style: `padding: 0.05rem!important` },
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
                    f('#tt-tcito1').with(
                        f('.tcito2').with(
                            f('.tcito3').with(
                                f('div', { style: `max-height:18rem!important` },
                                    f.div(
                                        // f('div', { style: `text-align:center` },
                                        //     f('.tt-kb').with(
                                        //         f('p.tt-kb-text').with('Space')
                                        //     ),
                                        //     'insert selected command'
                                        // ),
                                        ...listable.map(({ aliases, command, reply, availability, enabled, origin, variables, textDistance }, index, array) => {
                                            reply = parseCommands(reply, variables);

                                            let { href } = parseURL(reply);

                                            if(defined(href))
                                                reply = f('a', { href: href.replace(/^(\w{3,}\.\w{2,})/, `https://$1`), style: `margin-right:0.75rem` }, reply);

                                            return f(`#tt-command--${ command.replace(/[^\w\-]+/g, '') }`).with(
                                                f('button.tcito7', {
                                                    style: `cursor:${ ['not-allowed','auto'][+enabled] }!important; color:${ ['inherit','var(--color-text-success)'][+(textDistance < 1)] }`,
                                                    onmouseup: ({ target, button = -1 }) => {
                                                        if(!!button)
                                                            return;

                                                        let command = $('.tt-chat-input-suggestion', target.closest('[id]'))?.getAttribute('command');
                                                        if(defined(command)) {
                                                            let target = $('[data-a-target="chat-input"i]');
                                                            let match = (target?.value ?? target?.textContent ?? target?.innerText).match(/!(\S+|$)/),
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
                                                    f('.tcito8').with(
                                                        f('.tcito9').with(
                                                            f('p.tt-chat-input-suggestion', { style: `word-break:break-word!important; color:${ ['inherit','var(--color-text-error)'][+!enabled] }`, command },
                                                                f('img.chat-badge', { src: TwitchRoleBadges[availability], availability, style: `margin:0 0.75rem 0 0; height:1.5rem; width:1.5rem` }),

                                                                `!${ command }`,

                                                                f('span.tt-hide-inline-text-overflow', { style: `color:var(--color-text-alt-2); padding:0 0.75rem 0 0; position:absolute; right:0; max-width:50%`, title: reply })
                                                                    .html(reply)
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
                    overflow: hidden !important;
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
                    -moz-box-align: center !important;
                    align-items: center !important;
                    display: flex !important;
                    padding-left: 0.5rem !important;
                    padding-right: 0.5rem !important;
                }

                .tcito9 {
                    padding: 0.5rem !important;
                    display: flex !important;
                    -webkit-box-pack: justify !important;
                    -moz-box-pack: justify !important;
                    justify-content: space-between !important;
                    -webkit-box-align: center !important;
                    -moz-box-align: center !important;
                    align-items: center !important;
                    -webkit-box-flex: 1 !important;
                    -moz-box-flex: 1 !important;
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
                    -moz-box-align: center !important;

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
        new StopWatch('prevent_hosting');

        let hosting = $.defined('[data-a-target="hosting-indicator"i], [class*="status"i][class*="hosting"i]'),
            next = await GetNextStreamer(),
            host_banner = $.all('[href^="/"] h1, [href^="/"] > p, [data-a-target="hosting-indicator"i]').map(element => element.textContent),
            host = (STREAMER.name ?? ''),
            [guest] = host_banner.filter(name => !RegExp(name, 'i').test(host));

        guest ??= "anonymous";

        let method = Settings.prevent_hosting ?? "none";

        host_stopper:
        if(hosting) {
            // Ignore followed channels
            if(["unfollowed"].contains(method)) {
                let streamer = STREAMERS.find(channel => RegExp(`^${ guest }$`, 'i').test(channel.name));

                // The channel being hosted (guest) is already in "followed." No need to leave
                if(defined(streamer)) {
                    LOG(`[HOSTING] ${ guest } is already followed. Just head to the channel`);

                    goto(parseURL(streamer.href).addSearch({ tool: `host-stopper--${ method }` }).href);
                    break host_stopper;
                }
            }

            for(let callback of STREAMER.__eventlisteners__.onhost)
                callback({ hosting });

            if(defined(next)) {
                LOG(`${ host } is hosting ${ guest }. Moving onto next channel (${ next.name })`, next.href, new Date);

                goto(parseURL(next.href).addSearch({ tool: `host-stopper--${ method }` }).href);
            } else {
                LOG(`${ host } is hosting ${ guest }. There doesn't seem to be any followed channels on right now`, new Date);

                // ReloadPage();
            }
        }

        StopWatch.stop('prevent_hosting');
    };
    Timers.prevent_hosting = 5000;

    __PreventHosting__:
    if(Settings.prevent_hosting.unlike("none")) {
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
    let CONTINUE_RAIDING = false,
        SHADOW_RAID = false;

    Handlers.prevent_raiding = async() => {
        new StopWatch('prevent_raiding');

        if(false
            || CONTINUE_RAIDING
            // || !UP_NEXT_ALLOW_THIS_TAB
            // ↑ Stops unfollowed channels from sticking around...
        )
            return StopWatch.stop('prevent_raiding');

        let url = parseURL(location),
            data = url.searchParameters,
            raided = parseBool(data.referrer?.equals('raid') || data.raided),
            raiding = $.defined('[data-test-selector="raid-banner"i]'),
            next = await GetNextStreamer(),
            raid_banner = $.all('[data-test-selector="raid-banner"i] strong').map(strong => strong?.textContent),
            from = (raided? null: STREAMER.name),
            [to] = (raided? [STREAMER.name]: raid_banner.filter(name => name.unlike(from)));

        let method = Settings.prevent_raiding ?? "none";

        raid_stopper:
        if(raiding || raided || SHADOW_RAID) {
            top.onlocationchange = () => wait(5000).then(() => CONTINUE_RAIDING = SHADOW_RAID = false);

            // Ignore followed channels
            if(["greed", "unfollowed"].contains(method, SHADOW_RAID)) {
                // #1 - Collect the channel points by participating in the raid, then leave
                // #3 should fire automatically after the page has successfully loaded
                if(raiding && method.equals("greed")) {
                    LOG(`[RAIDING] There is a possiblity to collect bonus points. Do not leave the raid.`, parseURL(`${ location.origin }/${ to }`).addSearch({ referrer: 'raid', raided: true }, true).href);

                    PushToTopSearch({ referrer: 'raid', raided: true });

                    Cache.save({ LastRaid: { from, to, type: method } });
                    CONTINUE_RAIDING = true;
                    break raid_stopper;
                }
                // #2 - The channel being raided (to) is already in "followed." No need to leave
                else if(raiding && defined(STREAMERS.find(channel => RegExp(`^${ to }$`, 'i').test(channel.name)))) {
                    LOG(`[RAIDING] ${ to } is already followed. No need to leave the raid`);

                    CONTINUE_RAIDING = true;
                    break raid_stopper;
                }
                // #3 - The channel that was raided (to) is already in "followed." No need to leave
                else if(raided && STREAMER.like) {
                    LOG(`[RAIDED] ${ to } is already followed. No need to abort the raid`);

                    Cache.save({ LastRaid: {} });
                    RemoveFromTopSearch(['referrer', 'raided']);
                    CONTINUE_RAIDING = true;
                    break raid_stopper;
                }
            }

            STREAMER.onraid = async({ raiding, raided }) => {
                CONTINUE_RAIDING = false;

                let next = await GetNextStreamer();

                raid_stopper:
                if(defined(next)) {
                    LOG(`${ STREAMER.name } ${ raiding? 'is raiding': 'was raided' }. Moving onto next channel (${ next.name })`, next.href, new Date);

                    // Don't leave if the raid is on this page...
                    if(raiding && ["greed"].contains(method))
                        break raid_stopper;

                    if(UP_NEXT_ALLOW_THIS_TAB)
                        goto(parseURL(next.href).addSearch({ tool: `raid-stopper--${ method }` }).href);
                    else
                        Runtime.sendMessage({ action: 'STEAL_UP_NEXT', next: next.href, from: STREAMER?.name, method }, ({ next, from, method }) => {
                            NOTICE(`Stealing an Up Next job (raid): ${ from } → ${ next }`);

                            goto(parseURL(next).addSearch({ tool: `raid-stopper--${ method }` }).href);
                        });

                    let index = ALL_FIRST_IN_LINE_JOBS.indexOf(FIRST_IN_LINE_HREF),
                        [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1);

                    if(UP_NEXT_ALLOW_THIS_TAB)
                        Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
                } else {
                    LOG(`${ STREAMER.name } ${ raiding? 'is raiding': 'was raided' }. There doesn't seem to be any followed channels on right now`, new Date);

                    // ReloadPage();
                }
            };

            // Leave the raided channel after 2mins to ensure points were collected
            CONTINUE_RAIDING = ["greed"].contains(method);

            for(let callback of STREAMER.__eventlisteners__.onraid)
                callback({ raiding, raided });
        }

        StopWatch.stop('prevent_raiding');
    };
    Timers.prevent_raiding = 10_000;

    __PreventRaiding__:
    if(Settings.prevent_raiding.unlike("none")) {
        RegisterJob('prevent_raiding');

        Cache.load('LastRaid', ({ LastRaid }) => {
            let { from, to, type } = LastRaid || {};

            SHADOW_RAID = to?.length > 0 && to?.equals?.(STREAMER?.name)? type: false;

            Cache.save({ LastRaid: {} });
        });
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
                ?? furnish('#tt-greedy-raiding--container', {
                    style: new CSSObject(`
                        display: none;
                        visibility: hidden;

                        position: absolute;
                        top: -100vh;
                        left: -100vw;

                        height: 0;
                        width: 0;
                    `, true).toString('all'),
                })
            );

        for(let channel of online) {
            let { name } = channel;
            let frame = (null
                ?? $(`#tt-greedy-raiding--${ name }`)
                ?? furnish(`iframe#tt-greedy-raiding--${ name }`, {
                    src: `./popout/${ name }/chat?hidden=true&parent=twitch.tv&current=${ (STREAMER.name == name) }&allow=greedy_raiding`,

                    // sandbox: `allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals`,
                })
            );

            GREEDY_RAIDING_FRAMES.set(channel.name, frame);

            if([...container.children].missing(frame))
                container.append(frame);
        }

        if([...$.body.children].missing(container))
            $.body.append(container);
    };
    Timers.greedy_raiding = 5000;

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
        new StopWatch('stay_live');

        let next = await GetNextStreamer(),
            { pathname } = location;

        try {
            await Cache.load('UserIntent', async({ UserIntent }) => {
                if(parseBool(UserIntent))
                    TWITCH_PATHNAMES.push(UserIntent);

                Cache.remove('UserIntent');
            });
        } catch(error) {
            return StopWatch.stop('stay_live'), Cache.remove('UserIntent');
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

                REDO_FIRST_IN_LINE_QUEUE( parseURL(FIRST_IN_LINE_HREF)?.addSearch?.({ from: STREAMER?.name })?.href );

                let index = ALL_FIRST_IN_LINE_JOBS.indexOf(FIRST_IN_LINE_HREF),
                    [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1);

                if(UP_NEXT_ALLOW_THIS_TAB)
                    Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => goto(`${ next.href }?obit=${ STREAMER?.name }&tool=stay-live`));
                else
                    Runtime.sendMessage({ action: 'STEAL_UP_NEXT', next: next.href, obit: STREAMER?.name }, ({ next, obit }) => {
                        NOTICE(`Stealing an Up Next job (stay live): ${ obit } → ${ next }`);

                        goto(`${ next }?obit=${ obit }&tool=stay-live`);
                    });
            } else  {
                WARN(`${ STREAMER?.name } is no longer live. There doesn't seem to be any followed channels on right now`, new Date);
            }

            // After 30 seconds, remove the intent
            ClearIntent ??= setTimeout(Cache.remove, 30_000, 'UserIntent');
        } else if(/\/search\b/i.test(pathname)) {
            let { term } = parseURL(location).searchParameters;

            Cache.save({ UserIntent: term });
        }

        StopWatch.stop('stay_live');
    };
    Timers.stay_live = 3000;

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
            // 3:00PM EST | 3PM EST | 3:00P EST | 3P EST | 3:00 EST | 3 EST | 3:00PM (EST) | 3PM (EST) | 3:00P (EST) | 3P (EST) | 3:00 (EST) | 3 (EST)
            /(?<![#\$\.+:\d%‰]|\p{Sc})\b(?<hour>2[0-3]|[01]?\d)(?<minute>:[0-5]\d)?(?!\d*(?:\p{Sc}|[%‰]))[ \t]*(?<meridiem>[ap]\.?m?\.?(?!\p{L}|\p{N}))?[ \t]*(?<timezone>(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-Y]{1,4}T)\b|\([ \t]*(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-Y]{1,4}T)[ \t]*\))/iu,
            // 15:00 EST | 1500 EST
            /(?<![#\$\.+:\d%‰]|\p{Sc})\b(?<hour>2[0-3]|[01]?\d)(?<minute>:?[0-5]\d)[ \t]*(?<timezone>(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-Y]{1,4}T)\b|\([ \t]*(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-Y]{1,4}T)[ \t]*\))/iu,
            // EST 3:00PM | EST 3PM | EST 3:00P | EST 3P | EST 3:00 | EST 3
            /(?<timezone>(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-Y]{1,4}T)\b|\([ \t]*(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-Y]{1,4}T)[ \t]*\))[ \t]*(?<hour>2[0-3]|[01]?\d)(?<minute>:[0-5]\d)?(?!\d*(?:\p{Sc}|[%‰])|[b-oq-z])[ \t]*(?<meridiem>[ap]\.?m?\.?(?!\p{L}|\p{N}))?/iu,
            // EST 15:00 | EST 1500
            /(?<timezone>(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-Y]{1,4}T)\b|\([ \t]*(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-Y]{1,4}T)[ \t]*\))[ \t]*(?<hour>2[0-3]|[01]?\d)(?<minute>:?[0-5]\d)(?!\d*(?:\p{Sc}|[%‰]))/iu,
            // 3:00PM | 3PM
            /(?<![#\$\.+:\d%‰]|\p{Sc})\b(?<hour>2[0-3]|[01]?\d)(?<minute>:[0-5]\d)?(?!\d*(?:\p{Sc}|[%‰]))[ \t]*(?<meridiem>[ap]\.?m?\.?(?!\p{L}|\p{N}))/iu,
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
        },

        NON_TIME_ZONE_WORDS = await fetchURL(`get:./ext/[A-Y]{2,4}T.json`).then(response => response.json());

    // Convert text to times
    function convertWordsToTimes(string = '') {
        return string.normalize('NFKD')
            // .replace(/\b(mornings?|dawn)\b/i, '06:00AM')
            .replace(/\b(after\s?noons?|evenings?)\b/i, '01:00PM')
            .replace(/\b(noons?|lunch[\s\-]?time)\b/i, '12:00PM')
            // .replace(/\b((?:to|2)?nights?|dusk)\b/i, '06:00PM')
            .replace(/\b(mid[\s\-]?nights?)\b/i, '12:00AM')

            // Ignores shorthands → "today" "2day" "tonight" "2night" "tomorrow" "2morrow"
            .replace(/\b(?:to|2)(?:day|night|morrow)\b/ig, ($0, $$, $_) => $0.split('').join('\u200d'))

            // Replaces ranges
            // 6 - 11P ET | 6:00 AM - 11:00 PM EST
            .replace(/\b(?<start>\d{1,2}(?::?\d\d)?)(?<premeridiem>\s*[ap]\.?m?\.?)?(?<delimeter>[\-\s]+)(?<stop>\d{1,2}(?::?\d\d)?)(?<postmeridiem>\s*[ap]\.?m?\.?)?\s*(?<timezone>\b(?:AOE|GMT|UTC|[A-Y]{1,4}T))\b/ig, ($0, start, premeridiem, delimeter, stop, postmeridiem, timezone) => {
                let automeridiem = "AP"[+(new Date(STREAMER.data?.actualStartTime || now).getHours() > 12)] + 'M';

                postmeridiem ||= automeridiem;
                premeridiem ||= postmeridiem;

                let _mm = /(?<!:\d\d)$/, _00 = ':00';

                start = start.replace(_mm, _00);
                stop = stop.replace(_mm, _00);

                return [start, premeridiem, delimeter, stop, postmeridiem, ' ', timezone].join('');
            })
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
        let cTitle = $.all('[data-a-target="stream-title"i], [data-a-target="about-panel"i], [data-a-target^="panel"i]'),
            rTitle = $('[class*="channel-tooltip"i]:not([class*="offline"i]) > p + p');

        parsing:
        for(let container of [...cTitle, rTitle].filter(defined)) {
            let [timezone, zone, type, trigger] = (null
                ?? (container?.innerText || '')
                    .normalize('NFKD')
                    .match(/(?:(?<zone>[a-z]{3,})[\s\-]+)(?:(?<type>[a-z]+)[\s\-]+)?(?<trigger>time)\b/i)
                ?? []
            );

            let MASTER_TIME_ZONE = (TIME_ZONE__CONVERSIONS[timezone?.length < 1? '': timezone = [zone, type ?? 'Standard', trigger].map((s = '') => s[0]).join('').toUpperCase()]?.length? timezone: '');

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
                        { hour, minute = ':00', offset = '', meridiem = '', timezone = MASTER_TIME_ZONE } = groups,
                        timesone = timezone.replace(/^([^s])t$/, '$1st').replace(/^([^S])T$/, '$1ST');

                    let misint = timezone.mutilate(),
                        MISINT = timezone.toUpperCase(),
                        missnt = timesone.mutilate(),
                        MISSNT = timesone.toUpperCase();

                    // This isn't a timezone... it's a word...
                    if(true
                        && !(false
                            || MISINT in TIME_ZONE__CONVERSIONS
                            || MISSNT in TIME_ZONE__CONVERSIONS
                        )
                        && NON_TIME_ZONE_WORDS[misint[0]]?.[misint.length]?.contains(misint)
                        && NON_TIME_ZONE_WORDS[missnt[0]]?.[missnt.length]?.contains(missnt)
                    )
                        continue searching;

                    let now = new Date,
                        year = now.getFullYear(),
                        month = now.getMonth() + 1,
                        day = now.getDate(),
                        autoMeridiem = "AP"[+(new Date(STREAMER.data?.actualStartTime || now).getHours() > 12)];

                    if(offset.length > 0 && isNaN(parseInt(offset)))
                        continue;

                    let houl = hour = parseInt(hour);
                    hour += (
                        Date.isDST()?
                            // Daylight Savings is inactive and Standard Time was detected
                            -/\Bs?t$/i.test(timezone):
                        // Daylight Savings is active and Daylight Time was detected
                        +/\Bdt$/i.test(timezone)
                    );

                    hour -= (/^a/i.test(meridiem) && (hour > 12)? 12: 0);
                    hour += (/^p/i.test(meridiem) && (hour < 13)? 12: 0);
                    hour %= 24;

                    timezone ||= (offset.length? 'GMT': '');

                    // Change the meridiem
                    if(hour < houl && (!(houl % 12) || autoMeridiem == 'P'))
                        hour += 12;
                    else if(hour > houl && (!(houl % 12) || autoMeridiem == 'A'))
                        hour -= 12;

                    if(timezone.length) {
                        let name = timezone = timezone.toUpperCase().replace(/[^\w\+\-]+/g, '');

                        if(timezone in TIME_ZONE__CONVERSIONS)
                            timezone = TIME_ZONE__CONVERSIONS[timezone].replace(/^[+-]/, 'GMT$&');
                        else if(/[\+\-]/.test(timezone))
                            timezone = timezone.replace(/^[+-]/, 'GMT$&');
                        else if(timesone in TIME_ZONE__CONVERSIONS)
                            timezone = TIME_ZONE__CONVERSIONS[timesone].replace(/^[+-]/, 'GMT$&');
                        else
                            continue searching;

                        MASTER_TIME_ZONE ||= name;
                    }

                    let newDate = new Date(`${ [year, month, day].join(' ') } ${ offset }${ hour + minute } ${ timezone }`),
                        newTime = newDate.toLocaleTimeString(top.LANGUAGE, { timeStyle: 'short' }),
                        noChange = convertWordsToTimes(originalText).equals(originalText);

                    if(isNaN(+newDate)) {
                        // Keep original text
                        let { groups, index, length } = regexp.exec(originalText);

                        container.innerHTML = `${ originalText.substr(0, index).split('').join('&zwj;') }{{time_zones?=${ btoa(escape(originalText.substr(index, length))) }}}${ originalText.substr(length).split('').join('&zwj;') }`;
                    } else {
                        // Convert to new text
                        container.innerText = convertedText
                            .replace(regexp, ($0, $$, $_) => `{{time_zones?=${ btoa(escape(newTime)) }|${ btoa(escape(noChange? $0.replace(/$/, (groups.timezone?.length? '': MASTER_TIME_ZONE?.length? ` (${ MASTER_TIME_ZONE })`: '')): convertWordsToTimes.inReverse($0))) }}}`);
                    }
                }
            }
        }

        let TZC = [];
        for(let MAX = 1000, regexp = /\{\{time_zones\?=(.+?)\}\}/, node; --MAX > 0 && defined(node = $.body.getElementByText(regexp));) {
            let text = RegExp['$&'],
                tzc = RegExp.$1;

            node.innerHTML = node.innerHTML.replace(text, `<!--!time#${ TZC.push(tzc) }-->`);
        }

        allNodes($.body)
            .filter(node => /\bcomment\b/i.test(node.nodeName) && node.textContent.startsWith('!time#'))
            .map(comment => {
                let index = parseInt(comment.textContent.replace('!time#', '')) - 1;
                let [newText, oldText] = TZC[index].split('|');

                let span = furnish('span', {
                    id: `tt-time-zone-${ (new UUID) }`,
                    style: 'color:var(--user-contrast-color); text-decoration:underline 2px; width:min-content; white-space:nowrap',
                    contrast: THEME__PREFERRED_CONTRAST,
                    innerHTML: unescape(atob(newText)).split('').join('&zwj;'),
                });

                if(oldText?.length)
                    span.setAttribute('tip-text--timezone', oldText);
                else
                    span.removeAttribute('style');

                comment.replaceWith(span);
            });

        wait(2_5_0).then(() => {
            $.all('[id^="tt-time-zone-"][tip-text--timezone]')
                .map(span => {
                    let oldText = span.getAttribute('tip-text--timezone');

                    new Tooltip(span, unescape(atob(oldText)), { from: 'top' });

                    // span.removeAttribute('tip-text--timezone');
                });
        });

        TIME_ZONE__TEXT_MATCHES = TIME_ZONE__TEXT_MATCHES.isolate();
    };
    Timers.time_zones = 250;

    __TimeZones__:
    if(parseBool(Settings.time_zones)) {
        REMARK('Converting time zones...');

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

    /*** Link maker
     *      _      _       _      __  __       _
     *     | |    (_)     | |    |  \/  |     | |
     *     | |     _ _ __ | | __ | \  / | __ _| | _____ _ __
     *     | |    | | '_ \| |/ / | |\/| |/ _` | |/ / _ \ '__|
     *     | |____| | | | |   <  | |  | | (_| |   <  __/ |
     *     |______|_|_| |_|_|\_\ |_|  |_|\__,_|_|\_\___|_|
     *
     *
     */
    // /chat.js

    /*** Auto-chat (VIP) · @dskw1
     *                    _                  _           _      ____      _______ _______
     *         /\        | |                | |         | |    / /\ \    / /_   _|  __ \ \
     *        /  \  _   _| |_ ___ ______ ___| |__   __ _| |_  | |  \ \  / /  | | | |__) | |
     *       / /\ \| | | | __/ _ \______/ __| '_ \ / _` | __| | |   \ \/ /   | | |  ___/| |
     *      / ____ \ |_| | || (_) |    | (__| | | | (_| | |_  | |    \  /   _| |_| |    | |
     *     /_/    \_\__,_|\__\___/      \___|_| |_|\__,_|\__| | |     \/   |_____|_|    | |
     *                                                         \_\                     /_/
     *
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
        new StopWatch('mention_audio');

        // Play sound on new message
        NOTIFICATION_EVENTS.onmention ??= Chat.onmessage = ({ mentions }) => {
            if(mentions.contains(USERNAME) && !NOTIFICATION_SOUND?.playing)
                NOTIFICATION_SOUND?.play();
        };

        StopWatch.stop('mention_audio');
    };
    Timers.mention_audio = -1000;

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
        new StopWatch('phrase_audio');

        // Play sound on new message
        NOTIFICATION_EVENTS.onphrase ??= Chat.onmessage = line => {
            when(line => (defined(line.element)? line: false), 250, line).then(element => {
                if(element.hasAttribute('tt-light') && !NOTIFICATION_SOUND?.playing)
                    NOTIFICATION_SOUND?.play();
            });
        };

        StopWatch.stop('phrase_audio');
    };
    Timers.phrase_audio = 1000;

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
        new StopWatch('whisper_audio');

        // Play sound on new message
        NOTIFICATION_EVENTS.onwhisper ??= Chat.onwhisper = ({ unread, from, message }) => {
            if(!unread && !from && !message)
                return;

            NOTIFICATION_SOUND?.play();
        };

        // Play message on pill-change
        let pill = $('.whispers__pill'),
            unread = parseInt(pill?.textContent) | 0;

        if(nullish(pill))
            return StopWatch.stop('whisper_audio'), NOTIFIED.whisper = 0;
        if(NOTIFIED.whisper >= unread)
            return StopWatch.stop('whisper_audio');
        NOTIFIED.whisper = unread;

        NOTIFICATION_SOUND?.play();

        StopWatch.stop('whisper_audio');
    };
    Timers.whisper_audio = 1000;

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
    let RECEIPT_TOOLTIP,
        COUNTING_POINTS,
        EXACT_POINTS_SPENT = 0,
        EXACT_POINTS_DEBTED = 0,
        EXACT_POINTS_EARNED = 0,
        COUNTING_HREF = NORMALIZED_PATHNAME,
        OBSERVED_COLLECTION_ANIMATIONS = new Map,
        DISPLAYING_RANK,
        RANK_TOOLTIP,
        TALLY = new Map;

    function UpdateReceiptDisplay() {
        let receipt = EXACT_POINTS_EARNED - (EXACT_POINTS_SPENT + EXACT_POINTS_DEBTED),
            glyph = Glyphs.modify('channelpoints', { height: '20px', width: '20px', style: 'vertical-align:bottom' }),
            { abs } = Math;

        receipt = receipt.floorToNearest(parseInt(Settings.channelpoints_receipt_display.replace('round', '')) || 1);

        RECEIPT_TOOLTIP.innerHTML = [abs(EXACT_POINTS_EARNED).suffix(' &uarr;', 1, 'natural'), abs(EXACT_POINTS_SPENT + EXACT_POINTS_DEBTED).suffix(' &darr;', 1, 'natural')].join(' | ');
        $('#tt-points-receipt').innerHTML = `${ glyph } ${ abs(receipt).suffix(`&${ 'du'[+(receipt >= 0)] }arr;`, 1, 'natural') }`;
    }

    Handlers.points_receipt_placement = () => {
        // Display the ranking
        new StopWatch('points_receipt_placement__ranking');

        DisplayRanking: {
            let placement;

            if((placement = Settings.points_receipt_placement ??= "null").equals("null")) {
                StopWatch.stop('points_receipt_placement__ranking');
                break DisplayRanking;
            }

            DISPLAYING_RANK = setInterval(async() => {
                let container = $('[data-test-selector="chat-input-buttons-container"i]'),
                    ranking = $('#tt-channel-point-ranking');

                if(nullish(container))
                    return StopWatch.stop('points_receipt_placement__ranking');

                let { cult, rank } = STREAMER,
                    place = (100 * (rank / cult)).clamp(1, 100) | 0,
                    string = nth(rank.toLocaleString(LANGUAGE)),
                    color = (null
                        ?? ['#FFD700', '#C0C0C0', '#CD7F32'][place - 1]
                        ?? '#91FF47'
                    );

                rank = (
                    rank < 1 || isNaN(rank)?
                        'Unknown':
                    place < 4?
                        `<span style="text-decoration:${ 4 - place }px underline ${ color }">${ string }</span>`:
                    string
                );

                if(nullish(ranking))
                    container.insertBefore(ranking = (
                        furnish('div', { style: 'animation:1s fade-in 1;' },
                            furnish('#tt-channel-point-ranking', { style: 'display:flex; position:relative; align-items:center; vertical-align:middle; height:100%;' })
                        )
                    ), container.lastElementChild);
                else
                    ranking.innerHTML = Glyphs.modify('trophy', { height: '16px', width: '16px', fill: color }) + rank;

                RANK_TOOLTIP ??= new Tooltip(ranking, rank, { from: 'top' });

                let placementString;

                if(rank.equals('unknown'))
                    placementString = `Unable to get your rank for this channel`;
                else
                    placementString = `You are in the top ${ place }%`;

                if(RANK_TOOLTIP.innerHTML.unlike(placementString))
                    RANK_TOOLTIP.innerHTML = placementString;
            }, 5000);
        }

        StopWatch.stop('points_receipt_placement__ranking');

        // Display the receipt
        new StopWatch('points_receipt_placement');

        DisplayReceipt: {
            let placement;

            if((placement = Settings.points_receipt_placement ??= "null").equals("null"))
                return StopWatch.stop('points_receipt_placement');

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

                let [chat] = $.all('[role] ~ *:is([role="log"i], [class~="chat-room"i], [data-a-target*="chat"i], [data-test-selector*="chat"i]), [data-test-selector*="banned"i][data-test-selector*="message"i], [data-test-selector^="video-chat"i]');

                if(nullish(chat)) {
                    let framedData = PostOffice.get('points_receipt_placement');

                    window.PostOffice = PostOffice;

                    if(nullish(framedData))
                        return;

                    balance ??= { textContent: framedData.balance };
                    exact_debt ??= { textContent: framedData.exact_debt };
                    exact_change ??= { textContent: framedData.exact_change };
                }

                EXACT_POINTS_DEBTED = parseCoin(exact_debt?.textContent ?? EXACT_POINTS_DEBTED) | 0;

                let animationID = ((exact_change?.textContent ?? exact_debt?.textContent ?? -EXACT_POINTS_SPENT) | 0).toString(),
                    animationTimeStamp = +new Date;

                if(!/^([\+\-, \d]+)$/.test(animationID))
                    return;

                // Don't keep adding the exact change while the animation is playing
                if(OBSERVED_COLLECTION_ANIMATIONS.has(animationID)) {
                    let time = OBSERVED_COLLECTION_ANIMATIONS.get(animationID);

                    // It's been less than 5 minutes
                    if(nullish(animationID) || !parseBool(animationID) || Math.abs(animationTimeStamp - time) < 300_000)
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

                EXACT_POINTS_EARNED += parseCoin(exact_change?.textContent);

                UpdateReceiptDisplay();
            }, 2_5_0);
        }

        StopWatch.stop('points_receipt_placement');
    };
    Timers.points_receipt_placement = -2_500;

    Unhandlers.points_receipt_placement = () => {
        [COUNTING_POINTS, DISPLAYING_RANK].map(clearInterval);

        $.all('#tt-points-receipt, #tt-channel-point-ranking')
            .forEach(span => span?.parentElement?.remove());

        if(UnregisterJob.__reason__.equals('modify'))
            return;
    };

    let REDEMPTION_LISTENERS = {};

    __PointsReceiptPlacement__:
    if(parseBool(Settings.points_receipt_placement)) {
        RegisterJob('points_receipt_placement');

        Chat.onbullet = async({ element, message, subject, mentions }) => {
            element = await element;

            if(!(true
                // The subject matches
                && subject.equals('coin')

                // And...
                && (false
                    // The message is from the user
                    || message.contains(USERNAME)

                    // The message is from the user (for embedded messages)
                    || $('[class*="message"i] [class*="username"i] [data-a-user]', element)?.dataset?.aUser?.equals(USERNAME)
                )
            )) return;

            let [item] = (await STREAMER.shop).filter(reward => reward.title.length && message.mutilate().contains(reward.title.mutilate()));

            if(nullish(item))
                return;

            EXACT_POINTS_SPENT += parseCoin(item.cost) | 0;

            UpdateReceiptDisplay();
        };

        AddRedemptionListener: {
            function addListener(address = 0b1111) {
                // Points spent on unlocked rewards
                if(address & 1) {
                    when.defined(() => $('[data-test-selector*="required"i]:empty'))
                        .then(element => {
                            if(defined(REDEMPTION_LISTENERS.UNLOCKED_REWARDS))
                                return;
                            REDEMPTION_LISTENERS.UNLOCKED_REWARDS = true;

                            element.closest('button').addEventListener('mouseup', ({ currentTarget }) => {
                                let title = $('[id*="reward"i][id*="header"i]').textContent.trim(),
                                    amount = parseCoin(currentTarget?.previousSibling?.nodeValue) | 0;

                                EXACT_POINTS_SPENT += amount;
                                TALLY.set(`Reward: "${ title }" @ ${ (new Date).toJSON() }`, amount);

                                delete REDEMPTION_LISTENERS.UNLOCKED_REWARDS;
                                addListener(1);

                                LOG(`Spent ${ amount } on "${ title }"`, new Date);
                            });
                        });

                    when.nullish(() => $('[data-test-selector*="required"i]:empty'))
                        .then(() => delete REDEMPTION_LISTENERS.UNLOCKED_REWARDS);
                }

                // Points spent on votes
                if(address & 2) {
                    when.defined(() => $('[class*="community"i][class*="stack"i] [data-test-selector^="expanded"i] button'))
                        .then(button => {
                            if(defined(REDEMPTION_LISTENERS.BRIBABLE_VOTES))
                                return;
                            REDEMPTION_LISTENERS.BRIBABLE_VOTES = true;

                            button.addEventListener('mouseup', ({ currentTarget }) => {
                                let title = $('[class*="community"i][class*="stack"i] [data-test-selector="header"i] ~ *').textContent,
                                    [amount] = /\p{N}+/u.exec(currentTarget.textContent) || '';

                                EXACT_POINTS_SPENT += (amount |= 0);
                                TALLY.set(`Poll: "${ title }" @ ${ (new Date).toJSON() }`, amount | 0);

                                delete REDEMPTION_LISTENERS.BRIBABLE_VOTES;
                                addListener(2);

                                LOG(`Spent ${ amount } on "${ title }"`, new Date);
                            });
                        });

                    when.nullish(() => $('[class*="community"i][class*="stack"i] [data-test-selector^="expanded"i] button'))
                        .then(() => delete REDEMPTION_LISTENERS.BRIBABLE_VOTES);
                }
            }

            addListener();
        }
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
        hasPointsEnabled = false;

    Handlers.point_watcher_placement = async() => {
        // Display the points
        new StopWatch('point_watcher_placement');

        if(top.WINDOW_STATE == "unloading")
            return;

        // Update the points (every 30s)
        if(++pointWatcherCounter % 120)
            Cache.load(['ChannelPoints'], async({ ChannelPoints }) => {
                ChannelPoints ??= {};

                let [amount, fiat, face, notEarned, pointsToEarnNext] = (ChannelPoints?.[STREAMER.name] ?? 0).toString().split('|'),
                    allRewards = (await STREAMER.shop).filter(reward => reward.enabled),
                    balance = STREAMER.coin;

                hasPointsEnabled ||= defined(balance);

                amount = (balance?.textContent ?? (hasPointsEnabled? amount: '&#128683;'));
                fiat = (STREAMER?.fiat ?? fiat ?? 0);
                face = (STREAMER?.face ?? face ?? `${ STREAMER.sole }`);
                notEarned = (
                    (allRewards?.length)?
                        allRewards.filter(({ cost = 0 }) => cost > STREAMER.coin).length:
                    (notEarned >= -Infinity)?
                        notEarned:
                    -1
                );
                pointsToEarnNext = (
                    (allRewards?.length)?
                        allRewards
                            .map(reward => (reward.cost > STREAMER.coin? reward.cost - STREAMER.coin: 0))
                            .sort((x, y) => (x > y? -1: +1))
                            .filter(x => x > 0)
                            .pop():
                    (notEarned >= -Infinity)?
                        pointsToEarnNext:
                    0
                );

                face = face?.replace(/^(?:https?:.*?)?([\d]+\/[\w\-\.\/]+)$/i, '$1');

                ChannelPoints[STREAMER.name] = [amount, fiat, face, notEarned, pointsToEarnNext].join('|');

                Cache.save({ ChannelPoints });
            });

        // Color the balance text
        let balance = $('[data-test-selector="balance-string"i]');

        balance?.setAttribute('rainbow-border', await STREAMER.done);
        balance?.setAttribute('bottom-only', '');

        let richTooltip = $('[class*="channel-tooltip"i]');

        if(nullish(richTooltip))
            return StopWatch.stop('point_watcher_placement', 30_000);

        let [title, subtitle, ...footers] = richTooltip.children,
            footer = footers[footers.length - 1],
            target = footer?.lastElementChild;

        if(nullish(subtitle)) {
            let [rTitle, rSubtitle] = $.all('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="metadata"i] > *'),
                rTarget = $('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="status"i]');

            title = rTitle;
            subtitle = rSubtitle;
            target = rTarget;
        }

        if(nullish(title) || nullish(target))
            return StopWatch.stop('point_watcher_placement', 2_600);

        let [name, game] = title.textContent.split(/[^\w\s]/);

        name = name?.trim();
        game = game?.trim();

        // Remove the old face and values...
        $.all(`:is(.tt-point-amount, .tt-point-face):not([name="${ name }"i])`).map(element => element?.remove());

        // Update the rich tooltip display
        Cache.load(['ChannelPoints'], async({ ChannelPoints = {} }) => {
            let [amount, fiat, face, notEarned, pointsToEarnNext] = (ChannelPoints[name] ?? 0).toString().split('|'),
                style = new CSSObject({ verticalAlign: 'bottom', height: '20px', width: '20px' }),
                upNext = !!~(ALL_FIRST_IN_LINE_JOBS ?? []).findIndex(href => RegExp(`/${ name }\\b`, 'i').test(href));

            notEarned = parseInt(notEarned);
            pointsToEarnNext = parseInt(
                (notEarned >= -Infinity)?
                    pointsToEarnNext:
                0
            );

            let amounter = $(`.tt-point-amount[name="${ name }"i]`, target);
            if(defined(amounter)) {
                amounter.setAttribute('rainbow-border', notEarned == 0);

                if(amounter.innerHTML.unlike(amount))
                    amounter.innerHTML = amount;
            } else {
                let pointAmount = `span.tt-point-amount[bottom-only][name=${ name }]`,
                    pointFace = `span.tt-point-face[name=${ name }]`;

                let text = furnish(pointAmount, {
                        'rainbow-border': notEarned == 0,
                        innerHTML: amount,
                    }),
                    icon = face?.contains('/')?
                        furnish(pointFace, {
                            innerHTML: ` | ${ furnish('img', { src: `https://static-cdn.jtvnw.net/channel-points-icons/${ face }`, style: style.toString() }).outerHTML } `,
                        }):
                    furnish(pointFace, {
                        innerHTML: ` | ${ Glyphs.modify('channelpoints', { style, ...style.toObject() }) } `,
                    });

                target.append(icon);
                target.append(text);

                target.closest('[role="dialog"i]')?.setAttribute('tt-in-up-next', upNext);
            }
        });

        StopWatch.stop('point_watcher_placement', 2_700);
    };
    Timers.point_watcher_placement = 250;

    Unhandlers.point_watcher_placement = () => {
        $.all('.tt-point-amount')
            .forEach(span => span?.remove());
    };

    __PointWatcherPlacement__:
    if(parseBool(Settings.point_watcher_placement)) {
        when.defined(() => $('[data-test-selector="balance-string"i]')?.closest('button'))
            .then(async balanceButton => {
                if(defined(balanceButton))
                    RegisterJob('point_watcher_placement');

                let shop = (await STREAMER.shop);

                when.defined(() => $('[data-test-selector="balance-string"i]'))
                    .then(balance => balance.closest('button'))
                    .then(button => {
                        button.click();

                        for(let reward of $.all('[class*="reward"i][class*="item"i]')) {
                            let [image, cost, title] = $.all('[class*="reward"i][class*="image"i] img[alt], [data-test-selector="cost"i], p[title]', reward),
                                backgroundColor = (false
                                    || $('button [style]')
                                        ?.getComputedStyle?.($(`main a[href$="${ NORMALIZED_PATHNAME }"i]`) ?? $(':root'))
                                        ?.getPropertyValue?.('background-color')
                                    || '#9147FF'
                                ).toUpperCase();

                            image = image.src;
                            cost = parseCoin(cost.textContent) | 0;
                            title = (title.textContent || "").trim();

                            let imgURL = parseURL(image),
                                imgPath = imgURL.pathname.slice(1),
                                [imgType, imgName, imgSub = ''] = imgPath.split('/'),
                                realId = (
                                    imgType.contains('auto') && imgType.contains('reward')?
                                        ({
                                            'subsonly': 'SINGLE_MESSAGE_BYPASS_SUB_MODE',
                                            SINGLE_MESSAGE_BYPASS_SUB_MODE: 'SINGLE_MESSAGE_BYPASS_SUB_MODE',

                                            'highlight': 'SEND_HIGHLIGHTED_MESSAGE',
                                            SEND_HIGHLIGHTED_MESSAGE: 'SEND_HIGHLIGHTED_MESSAGE',

                                            'modify-emote': 'CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK',
                                            CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK: 'CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK',

                                            'random-emote': 'RANDOM_SUB_EMOTE_UNLOCK',
                                            RANDOM_SUB_EMOTE_UNLOCK: 'RANDOM_SUB_EMOTE_UNLOCK',

                                            'choose-emote': 'CHOSEN_SUB_EMOTE_UNLOCK',
                                            CHOSEN_SUB_EMOTE_UNLOCK: 'CHOSEN_SUB_EMOTE_UNLOCK',
                                        }[imgName.replace(/(\W?\d+)?\.(gif|jpe?g|png)$/i, '').replace(/^(\d+)$/, imgSub.toUpperCase())]):
                                    null
                                );

                            let item = {
                                title, cost,
                                image: { url: image },

                                backgroundColor: Color.destruct(backgroundColor).HEX,
                                id: (realId ?? UUID.from([image, title, cost].join('|$|'), true).value),
                                type: (realId ?? "UNKNOWN"),

                                enabled: true,
                                available: true,
                                count: 0,
                                hidden: false,
                                maximum: {
                                    global: 0,
                                    user: 0,
                                },
                                needsInput: false,
                                paused: false,
                                premium: false,
                                prompt: "",
                                skips: false,
                                updated: (new Date).toJSON(),
                            };

                            STREAMER.__shop__.push(item);
                        }

                        when(() => STREAMER.__shop__.length > 1)
                            .then(() => button.click());
                    });
            });
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
        new StopWatch('stream_preview');

        let richTooltips = $.all(`:is([class*="channel"i], [class*="guest-star"i])[class*="tooltip"i][class*="body"i]`),
            [richTooltip] = richTooltips;

        if(nullish(richTooltip)) {
            if(parseBool(Settings.stream_preview_sound) && MAINTAIN_VOLUME_CONTROL)
                SetVolume(parseBool(Settings.away_mode__volume_control) && AwayModeStatus? Settings.away_mode__volume: InitialVolume ?? 1);
            else if(parseBool(Settings.stream_preview_sound) && defined(STREAM_PREVIEW?.element))
                SetVolume(InitialVolume);

            return StopWatch.stop('stream_preview'), STREAM_PREVIEW = { element: STREAM_PREVIEW?.element?.remove() };
        }

        let [title, subtitle] = $.all('[class*="channel-tooltip"i] > *', richTooltip),
            isOnline = parseBool(richTooltip.classList?.value?.missing('offline'));

        if(nullish(subtitle)) {
            let [rTitle, rSubtitle] = $.all('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="metadata"i] > *');

            title = rTitle;
            subtitle = rSubtitle;
        }

        if(nullish(title))
            return StopWatch.stop('stream_preview'), STREAM_PREVIEW?.element?.remove();

        let [alias] = title.textContent.split(/[^\p{L}*\w\s]/u);

        alias = alias?.trim();

        let name = (null
            ?? ALL_CHANNELS.find(({ name }) => (
                (name.contains('(') && name.contains(')'))?
                    name.contains(alias):
                name.equals(alias)
            ))
            ?? { name: alias.normalize('NFKD') }
        )?.name?.replace(/[^]*\(([^\(\)]+)\)[^]*/, '$1');

        // There is already a preview of the hovered tooltip
        if([STREAMER?.name, STREAM_PREVIEW?.name].contains(name))
            return StopWatch.stop('stream_preview');

        let { top, left, bottom, right, height, width } = getOffset(richTooltip),
            [body, video] = $.all('body, video').map(getOffset);

        STREAM_PREVIEW?.element?.remove();

        let scale = parseFloat(Settings.stream_preview_scale) || 1,
            muted = !parseBool(Settings.stream_preview_sound),
            quality = (scale > 1? 'auto': '720p'),
            watchParty = $.defined('[data-a-target^="watchparty"i][data-a-target*="overlay"i]'),
            controls = false;

        // Watch-party information...
        // TODO: Use this...
        // let partyInfo = $('[class*="watch"i][class*="party"i][class*="info"i]'),
        //     partyThumbnail = $('[data-test-selector*="thumbnail"i]', partyInfo),
        //     partyTitle = $('[data-test-selector*="title"i]', partyInfo),
        //     [partyRating, partyReviews, partyYear, partyContentRating] = $.all('[data-test-selector*="title"i] + * > *', partyInfo) ?? [];

        STREAM_PREVIEW = {
            name,
            element:
                furnish(`.tt-stream-preview.invisible[@position=${ (top + height / 2 < body.height / 2)? 'below': 'above' }][@vods=${ richTooltips.length > 1 }]`, {
                        style: (
                            (top + height / 2 < body.height / 2)?
                                // Below tooltip
                                `top: calc(${ bottom }px + 0.5em);`:
                            // Above tooltip
                            `top: calc(${ top }px - 0.5em - (15rem * ${ scale }));`
                        ) + `left: calc(${ (watchParty? getOffset($('[data-a-target^="side-nav-bar"i]'))?.width: video?.left) ?? 50 }px - 6rem); height: calc(15rem * ${ scale }); width: calc(26.75rem * ${ scale }); z-index: ${ '9'.repeat(1 + parseInt(Settings.stream_preview_position ?? 0)) };`,
                    },
                    furnish('.tt-stream-preview--poster', {
                        style: `background-image: url("https://static-cdn.jtvnw.net/previews-ttv/live_user_${ name.toLowerCase() }-1280x720.jpg?${ +new Date }");`,
                        onerror: event => {
                            // Do something if the stream's live preview poster doesn't load...
                        },
                    }),
                    furnish(`iframe#tt-stream-preview--iframe[@index=0][@name=${ name }][@live=${ isOnline }][@controls=${ controls }][@muted=${ muted }][@quality=${ quality }]`, {
                        allow: 'autoplay',
                        src: parseURL(`https://player.twitch.tv/`).addSearch(
                            isOnline?
                                ({
                                    channel: name,
                                    parent: 'twitch.tv',

                                    controls, muted, quality,
                                }):
                            ({
                                video: `v${ richTooltip.closest('[href^="/videos/"i]').href.split('/').pop() }`,
                                parent: 'twitch.tv',
                                autoplay: true,

                                controls, muted, quality,
                            })
                        ).href,

                        height: '100%',
                        width: '100%',

                        onload: event => {
                            $('.tt-stream-preview--poster')?.classList?.add('invisible');
                            $.all('[class*="channel-tooltip"i]').at($('#tt-stream-preview--iframe').dataset.index | 0)?.closest('[href^="/videos/"i]')?.setAttribute('style', `background:var(--color-twitch-purple-${ 6 + (THEME.equals('light')? 6: 0) })`);

                            if(!parseBool(Settings.stream_preview_sound))
                                return;

                            if(nullish(InitialVolume))
                                InitialVolume = GetVolume();

                            let hasAudio = element =>
                                parseBool(null
                                    ?? element?.webkitAudioDecodedByteCount
                                    ?? element?.audioTracks?.length
                                );

                            when.defined(() => $('#tt-stream-preview--iframe')).then(() => SetVolume(0));
                        },
                    })
                )
        };

        $.body.append(STREAM_PREVIEW.element);

        wait(2_5_0).then(() => $('.tt-stream-preview.invisible')?.classList?.remove('invisible'));

        StopWatch.stop('stream_preview');
    };
    Timers.stream_preview = 500;

    Unhandlers.stream_preview = () => {
        STREAM_PREVIEW = { element: STREAM_PREVIEW?.element?.remove() };
    };

    __StreamPreview__:
    if(parseBool(Settings.stream_preview)) {
        REMARK('Adding Stream previews...');

        top.onlocationchange = Unhandlers.stream_preview;

        // Add key event listeners to the card
        $.body.addEventListener('keyup', ({ key = '', altKey, ctrlKey, metaKey, shiftKey }) => {
            if(altKey || ctrlKey || metaKey || shiftKey)
                return;

            if(!/^Arrow(Up|Down)$/i.test(key))
                return;

            let richTooltips = $.all(`[class*="channel-tooltip"i]`),
                { length } = richTooltips,
                iframe = $('#tt-stream-preview--iframe');

            if(nullish(iframe))
                return;

            let { index = 0, controls = false, muted = true, quality = 'auto' } = iframe.dataset;

            index |= 0;
            controls = parseBool(controls);
            muted = parseBool(muted);

            richTooltips.at(index)?.closest('[href^="/videos/"i]')?.removeAttribute('style');

            if(key.equals('ArrowUp'))
                --index;
            else if(key.equals('ArrowDown'))
                ++index;

            if(index < 0)
                index = length - 1;
            else if(index >= length)
                index = 0;

            iframe.dataset.index = index;
            iframe.src = parseURL(`https://player.twitch.tv/`).addSearch({
                video: `v${ richTooltips[index].closest('[href^="/videos/"i]').href.split('/').pop() }`,
                parent: 'twitch.tv',
                autoplay: true,

                controls, muted, quality,
            }).href;
        });

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

        if((placement = Settings.watch_time_placement ??= "null").equals("null"))
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
                        }, 2_5_0);
                };
            } break;

            default: return;
        }

        let f = furnish;
        let watch_time = f(`${ container.tagName }${ classes(container) }`,
            { style: `color: var(--user-contrast-color)`, contrast: THEME__PREFERRED_CONTRAST },
            f(`${ live_time.tagName }#tt-watch-time${ classes(live_time).replace(/\blive-time\b/gi, 'watch-time') }`, { time: 0 })
        );

        WATCH_TIME_TOOLTIP ??= new Tooltip(watch_time);

        parent.append(watch_time);

        extra({ parent, container, live_time, placement });

        Cache.load([`WatchTime${ (!UP_NEXT_ALLOW_THIS_TAB? 'Alt': '') }`, `Watching${ (!UP_NEXT_ALLOW_THIS_TAB? 'Alt': '') }`], ({ WatchTime = 0, Watching = NORMALIZED_PATHNAME, WatchTimeAlt = 0, WatchingAlt = NORMALIZED_PATHNAME }) => {
            if(NORMALIZED_PATHNAME != (!UP_NEXT_ALLOW_THIS_TAB? WatchingAlt: Watching))
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

                Cache.save({ [`WatchTime${ (!UP_NEXT_ALLOW_THIS_TAB? 'Alt': '') }`]: time });
            }, 1000);
        }).then(() => Cache.save({ [`Watching${ (!UP_NEXT_ALLOW_THIS_TAB? 'Alt': '') }`]: NORMALIZED_PATHNAME }));
    };
    Timers.watch_time_placement = -1000;

    Unhandlers.watch_time_placement = () => {
        clearInterval(WATCH_TIME_INTERVAL);

        $('#tt-watch-time')?.parentElement?.remove();

        let live_time = $('.live-time');

        live_time?.removeAttribute('style');
        live_time?.tooltip?.remove?.();
        clearInterval(live_time?.tooltipAnimation);

        if(UnregisterJob.__reason__.equals('modify'))
            return;

        Cache.save({ [`Watching${ (!UP_NEXT_ALLOW_THIS_TAB? 'Alt': '') }`]: null, [`WatchTime${ (!UP_NEXT_ALLOW_THIS_TAB? 'Alt': '') }`]: 0 });
    };

    __WatchTimePlacement__:
    if(parseBool(Settings.watch_time_placement)) {
        RegisterJob('watch_time_placement');
    }

    /*** Networking
     *      _   _      _                      _    _
     *     | \ | |    | |                    | |  (_)
     *     |  \| | ___| |___      _____  _ __| | ___ _ __   __ _
     *     | . ` |/ _ \ __\ \ /\ / / _ \| '__| |/ / | '_ \ / _` |
     *     | |\  |  __/ |_ \ V  V / (_) | |  |   <| | | | | (_| |
     *     |_| \_|\___|\__| \_/\_/ \___/|_|  |_|\_\_|_| |_|\__, |
     *                                                      __/ |
     *                                                     |___/
     */
    /*** Auto DVR
     *                    _          _______      _______
     *         /\        | |        |  __ \ \    / /  __ \
     *        /  \  _   _| |_ ___   | |  | \ \  / /| |__) |
     *       / /\ \| | | | __/ _ \  | |  | |\ \/ / |  _  /
     *      / ____ \ |_| | || (_) | | |__| | \  /  | | \ \
     *     /_/    \_\__,_|\__\___/  |_____/   \/   |_|  \_\
     *
     *
     */
    let VideoClips = {
        dvr: parseBool(Settings.video_clips__dvr),
        filetype: (Settings.video_clips__file_type ?? 'webm'),
        quality: (Settings.video_clips__quality ?? 'auto'),
        length: parseInt(Settings.video_clips__length ?? 60) * 1000,
    };

    let AUTO_DVR__CHECKING, AUTO_DVR__CHECKING_INTERVAL,
        MASTER_VIDEO = $.all('video').pop();

    Handlers.video_clips__dvr = () => {
        new StopWatch('video_clips__dvr');

        // Add the button to all channels
        let actionPanel = $('.about-section__actions');

        if(nullish(actionPanel))
            return StopWatch.stop('video_clips__dvr');

        Cache.load('DVRChannels', async({ DVRChannels }) => {
            DVRChannels = JSON.parse(DVRChannels || '{}');

            let f = furnish,
                s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"),
                DVR_ID = STREAMER.name.toLowerCase(),
                enabled = defined(DVRChannels[DVR_ID]),
                [title, subtitle, icon] = [
                    ['Turn DVR on', `${ s(STREAMER.name) } live streams will be recorded`, 'host'],
                    ['Turn DVR off', `${ s(STREAMER.name) } live streams will no longer be recorded`, 'clip']
                ][+!!enabled];

            icon = Glyphs.modify(icon, { style: 'fill:var(--user-contrast-color)!important', height: '20px', width: '20px' });

            // Create the action button...
            action =
            f('div', { 'tt-action': 'auto-dvr', 'for': DVR_ID, enabled, 'action-origin': 'foreign', style: `animation:1s fade-in 1;` },
                f('button', {
                    onmouseup: async event => {
                        let { currentTarget, isTrusted = false, button = -1 } = event;

                        if(!!button)
                            return /* Not the primary button */;

                        Cache.load('DVRChannels', async({ DVRChannels }) => {
                            DVRChannels = JSON.parse(DVRChannels || '{}');

                            let s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"),
                                DVR_ID = STREAMER.name.toLowerCase(),
                                enabled = nullish(DVRChannels[DVR_ID]),
                                [title, subtitle, icon] = [
                                    ['Turn DVR on', `${ s(STREAMER.name) } live streams will be recorded`, 'host'],
                                    ['Turn DVR off', `${ s(STREAMER.name) } live streams will no longer be recorded`, 'clip']
                                ][+!!enabled];

                            icon = Glyphs.modify(icon, { style: 'fill:var(--user-contrast-color)!important', height: '20px', width: '20px' });

                            $('.tt-action-icon', currentTarget).innerHTML = icon;
                            $('.tt-action-title', currentTarget).textContent = title;
                            $('.tt-action-subtitle', currentTarget).textContent = subtitle;

                            // Add the DVR...
                            let message;
                            if(enabled) {
                                message = `${ s(STREAMER.name) } streams will be recorded.`;

                                DVRChannels[DVR_ID] = DVR_CLIP_PRECOMP_NAME;

                                when.nullish(() => $('[data-a-target*="ad-countdown"i]'))
                                    .then(() => {
                                        SetQuality(VideoClips.quality, 'auto').then(() => {
                                            MASTER_VIDEO.DEFAULT_RECORDING = MASTER_VIDEO.startRecording({ name: 'AUTO_DVR:ENABLE', as: DVR_CLIP_PRECOMP_NAME, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats });

                                            MASTER_VIDEO.DEFAULT_RECORDING.then(Handlers.__MASTER_AUTO_DVR_HANDLER__);
                                        });
                                    });
                            }
                            // Remove the DVR...
                            else {
                                message = `${ STREAMER.name } will not be recorded.`;

                                delete DVRChannels[DVR_ID];

                                MASTER_VIDEO.DEFAULT_RECORDING?.stop()?.save(DVR_CLIP_PRECOMP_NAME);
                            }

                            currentTarget.closest('[tt-action]').setAttribute('enabled', enabled);

                            // FIX-ME: Live Reminder alerts will not display if another alert is present...
                            Cache.save({ DVRChannels: JSON.stringify(DVRChannels) }, () => Settings.set({ 'DVR_CHANNELS': Object.keys(DVRChannels) }).then(() => parseBool(message) && alert.timed(message, 7000)).catch(WARN));
                        });
                    },
                }, f.div(
                    f('.tt-action-icon').html(icon),
                    f.div(
                        f('p.tw-title.tt-action-title').with(title),
                        f('p.tt-action-subtitle').with(subtitle)
                    )
                ))
            );

            actionPanel.append(action);

            // Run DVR if enabled...
            if(enabled && !STREAMER.redo) {
                when.nullish(() => $('[data-a-target*="ad-countdown"i]'))
                    .then(() => {
                        SetQuality(VideoClips.quality, 'auto').then(() => {
                            MASTER_VIDEO.DEFAULT_RECORDING = MASTER_VIDEO.startRecording({ name: 'AUTO_DVR', mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats });

                            MASTER_VIDEO.DEFAULT_RECORDING.then(Handlers.__MASTER_AUTO_DVR_HANDLER__);
                        });
                    });

                let leaveHandler = STREAMER.onraid = STREAMER.onhost = top.beforeleaving = top.onlocationchange = async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
                    let next = await GetNextStreamer();

                    LOG('Saving current DVR stash. Reason:', { hosting, raiding, raided, leaving: defined(from) }, 'Moving onto:', next);

                    for(let [guid, { recording }] of Recording.__RECORDERS__)
                        if(recording == MASTER_VIDEO.DEFAULT_RECORDING)
                            recording.stop().save(DVR_CLIP_PRECOMP_NAME);
                        else
                            recording.stop().save();
                };

                $.on('focusin', event => {
                    let DVR_ID = STREAMER.name.toLowerCase();

                    if(top.focusedin)
                        return;
                    top.focusedin = true;
                    top.addEventListener('beforeunload', leaveHandler);

                    // top.addEventListener('visibilitychange', leaveHandler);
                });
            }
        });

        StopWatch.stop('video_clips__dvr');
    };
    Timers.video_clips__dvr = -2_500;

    try {
        Object.defineProperties(top, {
            DVR_CLIP_PRECOMP_NAME: {
                get() {
                    let chunks = MASTER_VIDEO.getRecording(Recording.ANY)?.blobs;

                    if(!chunks?.length)
                        return '';

                    let now = new Date;

                    // File Name
                    return [
                        STREAMER.name,
                        now.toLocaleDateString().replace(/[\/\\:\*\?"<>\|]+/g, '-'),
                        `(${ (parseBool(Settings.show_stats)? toTimeString(chunks.recordingLength, 'short'): ((now.getHours() % 12) || 12) + now.getMeridiem()).replace(/\b(0+[ydhms])+/ig, '') })`,
                    ]
                        .filter(s => s?.length)
                        .map(s => s.trim())
                        .join(' ');
                },
            },
        });
    } catch(error) {
        /* Ignore this error :P */
    }

    Handlers.__MASTER_AUTO_DVR_HANDLER__ = event => {
        MASTER_VIDEO.DEFAULT_RECORDING?.stop()?.save(DVR_CLIP_PRECOMP_NAME);
    };

    Unhandlers.video_clips__dvr = () => {
        let DVR_ID = STREAMER.name.toLowerCase();

        MASTER_VIDEO.DEFAULT_RECORDING?.stop();
    };

    setInterval(() => {
        if(nullish(top.titleInterval))
            top.titleInterval = setInterval(() => {
                document.title = (
                    MASTER_VIDEO.hasRecording(Recording.ANY)?
                        `\u{1f534} ${ STREAMER.name } - ${ toTimeString((new Date) - MASTER_VIDEO.getRecording(Recording.ANY)?.creationTime, 'clock') }`:
                    `${ STREAMER.name } - Twitch`
                );
            }, 250);
    }, 1000);

    let InsertChunksAt;

    __AutoDVR__:
    if(parseBool(Settings?.video_clips__dvr)) {
        REMARK('Adding DVR functionality...');

        let HandleAd = adCountdown => {
            let [main, mini] = $.all('video');

            if(false
                || nullish(main)
                || !main.hasRecording('AUTO_DVR')
                || nullish(mini)
            )
                return when.defined(() => $('[data-a-target*="ad-countdown"i]')).then(HandleAd);

            let blobs = main.getRecording('AUTO_DVR')?.blobs ?? [];

            InsertChunksAt = blobs.length;

            let AdBreak = new Recording(mini, { name: 'AUTO_DVR:AD_HANDLER', mimeType: main.mimeType });

            AdBreak.then(({ target }) => {
                let chunks = AdBreak.blobs;

                NOTICE(`Adding chunks to main <video> @ ${ InsertChunksAt } |`, { blobs, chunks, event });

                blobs.push(...chunks);
            });

            when.nullish(() => $('[data-a-target*="ad-countdown"i]'))
                .then(() => {
                    let [main, mini] = $.all('video');

                    main?.resumeRecording();
                    mini?.stopRecording();

                    when.defined(() => $('[data-a-target*="ad-countdown"i]'))
                        .then(HandleAd);

                    NOTICE(`Ad is done playing... ${ toTimeString((new Date) - main?.getRecording()?.creationTime, 'clock') } | ${ (new Date).toJSON() } |`, { main, mini, blobs, chunks: mini?.getRecording()?.blobs });
                });

            main.pauseRecording();

            NOTICE(`There is an ad playing... ${ toTimeString((new Date) - main.getRecording()?.creationTime, 'clock') } | ${ (new Date).toJSON() } |`, { main, mini });
        };

        when.defined(() => $('[data-a-target*="ad-countdown"i]'))
            .then(HandleAd);

        // This is where the magic happens
            // Begin looking for DVR channels...
        AUTO_DVR__CHECKING_INTERVAL =
        setInterval(AUTO_DVR__CHECKING ??= () => {
            new StopWatch('video_clips__dvr__checking_interval');

            if(UP_NEXT_ALLOW_THIS_TAB)
                Cache.load('DVRChannels', async({ DVRChannels }) => {
                    DVRChannels = JSON.parse(DVRChannels || '{}');

                    checking:
                    // Only check for the stream when it's live; if the dates don't match, it just went live again
                    for(let DVR_ID in DVRChannels) {
                        let streamer = (DVR_ID + '').toLowerCase();
                        let channel = await new Search(streamer).then(Search.convertResults),
                            ok = parseBool(channel?.ok);

                        // Search did not complete...
                        let num = 3;
                        while(!ok && num-- > 0) {
                            Search.void(streamer);

                            channel = await when.defined(() => new Search(streamer).then(Search.convertResults), 500);
                            ok = parseBool(channel?.ok);

                            // WARN(`Re-search, ${ num } ${ 'retry'.pluralSuffix(num) } left [DVR]: "${ streamer }" → OK = ${ ok }`);
                        }

                        if(!parseBool(channel.live))
                            continue checking;

                        let { name, live, icon, href, data = { actualStartTime: null } } = channel,
                            slug = DVRChannels[name.toLowerCase()],
                            enabled = defined(slug);
                        let index = (ALL_FIRST_IN_LINE_JOBS.findIndex(href => parseURL(href).pathname.slice(1).equals(name))),
                            job = ALL_FIRST_IN_LINE_JOBS[index];

                        if(defined(job) && name.unlike(STREAMER.name) && enabled) {
                            // Skip the queue!
                            let [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1),
                                name = parseURL(removed).pathname.slice(1);

                            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(FIRST_IN_LINE_TIMER);

                            // Skipper
                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: parseBool(parseURL(removed).searchParameters?.redo) });

                            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                                LOG('Skipping queue in favor of a DVR channel', job);

                                goto(parseURL(job).addSearch({ dvr: true }).href);
                            });
                        }
                    }

                    // Send the length to the settings page
                    Settings.set({ 'DVR_CHANNELS': Object.keys(DVRChannels) });

                    StopWatch.stop('video_clips__dvr__checking_interval', 30_000);
                });
        }, 30_000);

        // Add the panel & button
        let actionPanel = $('.about-section__actions');

        if(nullish(actionPanel)) {
            actionPanel = furnish('.about-section__actions', { style: `padding-left: 2rem; margin-bottom: 3rem; width: 24rem;` });

            $('.about-section')?.append?.(actionPanel);
        } else {
            for(let child of actionPanel.children)
                child.setAttribute('action-origin', 'native');
        }

        // Pause Up Next and handle DVR events
        if(false
            || parseBool(parseURL(top.location.href).searchParameters?.dvr)
            || STREAMER?.redo === false
        )
            Cache.load('DVRChannels', async({ DVRChannels }) => {
                DVRChannels = JSON.parse(DVRChannels || '{}');

                for(let DVR_ID in DVRChannels) {
                    let streamer = (DVR_ID + '').toLowerCase();

                    if(parseBool(DVRChannels[DVR_ID]) && [STREAMER.name, STREAMER.sole].map(s => (s + '').toLowerCase()).contains(streamer))
                        when.defined(() => $('#up-next-control'))
                            .then(button => {
                                let paused = parseBool(button.getAttribute('paused'));

                                if(paused)
                                    return;

                                button?.click();
                            })
                            .then(() => {
                                confirm(`<div hidden controller deny="Why?" okay="Acknowledge (interact)"></div>
                                    To automatically save DVRs when this page navigates to another stream (or reloads unexpectedly), you must interact with this page.
                                `)
                                    .then(answer => {
                                        if(!answer)
                                            open('https://developer.mozilla.org/en-US/docs/Web/Security/User_activation', '_blank');
                                    });

                                // Extra handler. This is suppose to handle ad-recording. But it's above (see `enabled && !STREAMER.redo`)
                                if(MASTER_VIDEO.hasRecording('AUTO_DVR'))
                                    return /* Already recording over ads... */;

                                when.nullish(() => $('[data-a-target*="ad-countdown"i]'))
                                    .then(() => {
                                        let recordingKey = 'AUTO_DVR:AD_COUNTDOWN';

                                        SetQuality(VideoClips.quality, 'auto').then(() => {
                                            MASTER_VIDEO.startRecording({ name: recordingKey, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats })
                                                .then(Handlers.__MASTER_AUTO_DVR_HANDLER__);

                                            when(() => MASTER_VIDEO.hasRecording('AUTO_DVR')).then(() => {
                                                MASTER_VIDEO.cancelRecording(recordingKey, `Master recording ("AUTO_DVR") already exists. Removing "AUTO_DVR:AD_COUNTDOWN"`).removeRecording(recordingKey);
                                            });

                                            wait(5000).then(() => {
                                                if(!MASTER_VIDEO.hasRecording(recordingKey))
                                                    return;

                                                MASTER_VIDEO.DEFAULT_RECORDING = MASTER_VIDEO.getRecording(recordingKey);

                                                MASTER_VIDEO.DEFAULT_RECORDING.then(Handlers.__MASTER_AUTO_DVR_HANDLER__);
                                            });
                                        });
                                    });

                                let leaveHandler = STREAMER.onraid = STREAMER.onhost = top.beforeleaving = top.onlocationchange = async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
                                    let next = await GetNextStreamer();
                                    let DVR_ID = STREAMER.name.toLowerCase();

                                    LOG('Saving current DVR stash. Reason:', { hosting, raiding, raided, leaving: defined(from) }, 'Moving onto:', next);

                                    for(let [guid, { recording }] of Recording.__RECORDERS__)
                                        if(recording == MASTER_VIDEO.DEFAULT_RECORDING)
                                            recording.stop().save(DVR_CLIP_PRECOMP_NAME);
                                        else
                                            recording.stop().save();
                                };

                                $.on('focusin', event => {
                                    let DVR_ID = STREAMER.name.toLowerCase();

                                    if(top.focusedin)
                                        return;
                                    top.focusedin = true;
                                    top.addEventListener('beforeunload', leaveHandler);

                                    // top.addEventListener('visibilitychange', leaveHandler);
                                });
                            });
                }
            });

        AUTO_DVR__CHECKING?.();
        RegisterJob('video_clips__dvr');
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
        PAGE_HAS_FOCUS = document.visibilityState.equals("visible"),
        VIDEO_OVERRIDE = false;

    Handlers.recover_frames = () => {
        new StopWatch('recover_frames');

        let video = $('video') ?? $('video', $('#tt-embedded-video')?.contentDocument);

        if(nullish(video))
            return StopWatch.stop('recover_frames');

        let { paused } = video,
            isTrusted = $.defined('button[data-a-player-state="paused"i]'),
            isAdvert = $.defined('[data-a-target*="ad-countdown"i]'),
            { creationTime, totalVideoFrames } = video.getVideoPlaybackQuality();

        // Time that's passed since creation. Should constantly increase
        CREATION_TIME ??= creationTime;

        // The total number of frames created. Should constantly increase
        TOTAL_VIDEO_FRAMES ??= totalVideoFrames;

        // if the page isn't in focus, ignore this setting
        // if the video is paused by the user (trusted) move on
        if((paused && isTrusted) || PAGE_HAS_FOCUS === false)
            return StopWatch.stop('recover_frames');

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

                    container.append(iframe =
                        furnish(`iframe#tt-embedded-video`, {
                            allow: 'autoplay',
                            src: parseURL(`https://player.twitch.tv/`).addSearch({
                                channel: name,
                                parent: 'twitch.tv',

                                controls, muted,
                            }).href,

                            style: `border: 1px solid var(--color-warn)`,

                            height: '100%',
                            width: '100%',

                            onload: event => {
                                when.defined(() => {
                                    let doc = $('#tt-embedded-video')?.contentDocument;

                                    if(nullish(doc))
                                        return /* No document */;

                                    let video = $('video', doc);

                                    if(nullish(video))
                                        return /* No video */;

                                    if((video.currentTime || 0) <= 0)
                                        return /* Video not loading */;

                                    return VIDEO_OVERRIDE = true;
                                }, 2_5_0);
                            },
                        })
                    );

                    $('[data-a-player-state]')?.addEventListener?.('mouseup', ({ button = -1 }) => !button && ReloadPage());
                    $('video', container).setAttribute('style', `display:none`);

                    new Tooltip($('[data-a-player-state]'), `${ name }'${ /s$/.test(name)? '': 's' } stream ran into an error. Click to reload`);
                } else {
                    WARN(`Attempting to pause/play the video`);

                    if($('button[data-a-player-state]')?.dataset?.aPlayerState?.equals('playing')) {
                        $('button[data-a-player-state]').click();

                        wait(1000).then(() => $('button[data-a-player-state]')?.click());
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
            ReloadPage();

        StopWatch.stop('recover_frames');
    };
    Timers.recover_frames = 1000;

    __RecoverFrames__:
    if(parseBool(Settings.recover_frames)) {
        $.on('visibilitychange', event => PAGE_HAS_FOCUS = document.visibilityState.equals("visible"));

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
        new StopWatch('recover_stream');

        if(nullish(video))
            return StopWatch.stop('recover_stream');

        let { paused } = video,
            isTrusted = $.defined('button[data-a-player-state="paused"i]'),
            isAdvert = $.defined('[data-a-target*="ad-countdown"i]');

        // Leave the video alone
            // if the video isn't paused
            // if the video was paused by the user (trusted)
            // if the video is an ad AND auto-play ads is disabled
            // if the player event-timeout has been set
        if(!paused || isTrusted || (isAdvert && !parseBool(Settings.recover_ads)) || VIDEO_PLAYER_TIMEOUT > -1)
            return StopWatch.stop('recover_stream');

        // Wait before trying to press play again
        VIDEO_PLAYER_TIMEOUT = setTimeout(() => VIDEO_PLAYER_TIMEOUT = -1, 1000);

        __RecoverVideoProgramatically__:
        try {
            let playing = video.play();

            if(defined(playing))
                playing.catch(error => { throw error });
        } catch(error) {
            ERROR(error);

            let control = $('button[data-a-player-state]'),
                playing = control.dataset?.aPlayerState?.equals('playing'),
                attempts = control.dataset?.recoveryAttempts | 0;

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
                wait(250).then(control.click);
            }

            control.dataset.recoveryAttempts = ++attempts;

            wait(5000).then(() => {
                let control = $('button[data-a-player-state]'),
                    attempts = control.dataset?.recoveryAttempts | 0;

                control.dataset.recoveryAttempts = --attempts;
            });
        }

        StopWatch.stop('recover_stream');
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
        new StopWatch('recover_video');

        let errorMessage = $('[data-a-target^="player"i][data-a-target$="content-gate"i] [data-test-selector*="text"i], [data-a-target*="player"i][data-a-target*="gate"i] [data-a-target*="text"i]');

        if(nullish(errorMessage))
            return StopWatch.stop('recover_video');

        if(RECOVERING_VIDEO)
            return StopWatch.stop('recover_video');
        RECOVERING_VIDEO = true;

        if(/\b(subscribe|mature)\b/i.test(errorMessage.textContent)) {
            let next = await GetNextStreamer();

            // Subscriber only, etc.
            if(defined(next))
                goto(parseURL(next.href).addSearch({ tool: 'video-recovery--non-subscriber' }).href);
        } else {
            ERROR('The stream ran into an error:', errorMessage.textContent, new Date);

            // Failed to play video at...
            PushToTopSearch({ 'tt-err-vid': 'video-recovery--non-subscriber' });

            errorMessage.closest('button')?.click();
        }

        StopWatch.stop('recover_video');
    };
    Timers.recover_video = 5000;

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
    wait(1000).then(() => {
        $.all('[data-a-target="followed-channel"i], [id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] [href^="/"], [data-test-selector*="search-result"i][data-test-selector*="channel"i] a:not([href*="/search?"])').map(a => {
            a.addEventListener('mouseup', async event => {
                let { currentTarget, button = -1 } = event;

                if(!!button)
                    return /* Not the primary button */;

                let url = parseURL(currentTarget.href),
                    UserIntent = url.pathname.replace('/', '');

                Cache.save({ UserIntent });
            });
        });
    });

    /*** Private Viewing - NOT A SETTING. Create a "private viewing" button for live, searched streams
     *      _____      _            _        __      ___               _
     *     |  __ \    (_)          | |       \ \    / (_)             (_)
     *     | |__) | __ ___   ____ _| |_ ___   \ \  / / _  _____      ___ _ __   __ _
     *     |  ___/ '__| \ \ / / _` | __/ _ \   \ \/ / | |/ _ \ \ /\ / / | '_ \ / _` |
     *     | |   | |  | |\ V / (_| | ||  __/    \  /  | |  __/\ V  V /| | | | | (_| |
     *     |_|   |_|  |_| \_/ \__,_|\__\___|     \/   |_|\___| \_/\_/ |_|_| |_|\__, |
     *                                                                          __/ |
     *                                                                         |___/
     */
    setInterval(() => {
        $.all('.search-tray [role="cell"i] [data-a-target="nav-search-item"i]')
            .map(element => {
                let [thumbnail, searchTerm] = element.children;
                let image = $('img', thumbnail)?.src,
                    name = searchTerm.textContent.trim(),
                    live = $.defined('[data-test-selector="live-badge"i]', element);

                if(!live)
                    return;

                let f = furnish;
                let button = $('[tt-pip]', element.closest('[role]'));

                if(defined(button))
                    return;

                let anchor = element.closest('[href]');

                anchor.setAttribute('style', 'display:inline-block;width:calc(100% - 5rem)');
                anchor.insertAdjacentElement('afterend', f(`button[tt-pip]`, {
                    name, live, image,

                    onmousedown({ currentTarget }) {
                        MiniPlayer = currentTarget.getAttribute('name');
                    },

                    innerHTML: Glyphs.modify('picture_in_picture', { height: 20, width: 20, fill: 'currentcolor', style: 'vertical-align:middle' }),
                }));
            });
    }, 300);

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
    let RECOVER_PAGE_FROM_LAG,
        RECOVER_PAGE_FROM_LAG__EXACT,
        RECOVER_PAGE_FROM_LAG__WARNINGS = 0;

    Handlers.recover_pages = async() => {
        new StopWatch('recover_pages');

        let error = $('main :is([data-a-target*="error"i][data-a-target*="message"i], [data-test-selector*="content"i][data-test-selector*="overlay"i])');

        if(nullish(error))
            return StopWatch.stop('recover_pages');

        let message = error.textContent,
            next = await GetNextStreamer();

        ERROR(message);

        if(/content.*unavailable/i.test(message) && defined(next))
            goto(parseURL(next.href).addSearch({ tool: 'page-recovery--content-unavailable' }).href);
        else
            ReloadPage();

        StopWatch.stop('recover_pages');
    };
    Timers.recover_pages = 5000;

    Unhandlers.recover_pages = () => {
        clearInterval(RECOVER_PAGE_FROM_LAG);
    };

    __RecoverPages__:
    if(parseBool(Settings.recover_pages)) {
        RegisterJob('recover_pages');

        RECOVER_PAGE_FROM_LAG__EXACT = +(new Date);

        RECOVER_PAGE_FROM_LAG = setInterval(() => {
            let now = +(new Date),
                span = (now - RECOVER_PAGE_FROM_LAG__EXACT);

            // The time has drifted by more than 25%
            if(span > (Timers.recover_pages * 1.25))
                WARN(`The page seems to be lagging (${ span.suffix('s', false, 'time') })... This is the ${ nth(++RECOVER_PAGE_FROM_LAG__WARNINGS) } warning. Offending site: ${ location.href }`);
            else if(span < (Timers.recover_pages * 1.05) && RECOVER_PAGE_FROM_LAG__WARNINGS > 0)
                --RECOVER_PAGE_FROM_LAG__WARNINGS;

            if(RECOVER_PAGE_FROM_LAG__WARNINGS > 2)
                ReloadPage();

            RECOVER_PAGE_FROM_LAG__EXACT = now;
        }, Timers.recover_pages);
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
            $.on('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X = function Take_a_Screenshot({ key = '', altKey, ctrlKey, metaKey, shiftKey }) {
                if(!(ctrlKey || metaKey) && altKey && shiftKey && key.equals('x'))
                    $.all('video').pop().copyFrame()
                        .then(async copied => await alert.timed(`Screenshot saved to clipboard!<p tt-x>${ (new UUID).value }</p>`, 5000))
                        .catch(async error => await alert.timed(`Failed to take screenshot: ${ error }<p tt-x>${ (new UUID).value }</p>`, 7000));
            });

        // Begin recording the stream
        // Alt + Z | Opt + Z
        if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z))
            $.on('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z = function Start_$_Stop_a_Recording({ key = '', altKey, ctrlKey, metaKey, shiftKey }) {
                if(!(ctrlKey || metaKey || shiftKey) && altKey && key.equals('z')) {
                    let video = MASTER_VIDEO;

                    video.setAttribute('uuid', video.uuid ??= (new UUID).value);

                    let body = `<input hidden controller
                        icon="\uD83D\uDD34\uFE0F" title="Recording ${ (STREAMER?.name ?? top.location.pathname.slice(1)) }..."
                        placeholder="${ DEFAULT_CLIP_NAME }"
                        pattern="${ GetFileSystem().acceptableFilenames.source }"

                        okay="${ encodeHTML(Glyphs.modify('download', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Save"
                        deny="${ encodeHTML(Glyphs.modify('trash', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Discard"
                        />

                        <table is-hidden="${ !Settings.experimental_mode }">
                            <caption>Video details</caption>
                            <tbody>
                                <tr>
                                    <td>Slug</td>
                                    <td><code>${ DEFAULT_CLIP_NAME }</code></td>
                                </tr>
                                <tr>
                                    <td>Length</td>
                                    <td><code tt-clip-timer data-connected-to=${ video.uuid }></code></td>
                                </tr>
                                <tr>
                                    <td>Size</td>
                                    <td><code tt-clip-watcher data-connected-to=${ video.uuid }></code></td>
                                </tr>
                                <tr>
                                    <td style=padding-right:1em>Dimensions</td>
                                    <td><code tt-clip-sizer data-connected-to=${ video.uuid }></code></td>
                                </tr>
                                <tr>
                                    <td>Quality</td>
                                    <td tt-clip-rater data-connected-to=${ video.uuid }></td>
                                </tr>
                                <tr>
                                    <td>Type</td>
                                    <td tt-clip-typer data-connected-to=${ video.uuid }></td>
                                </tr>
                            </tbody>
                        </table>`;

                    let EVENT_NAME = GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z.name;
                    let SAVE_NAME = DEFAULT_CLIP_NAME;

                    if(!video.hasRecording(EVENT_NAME)) {
                        prompt.silent(body).then(value => {
                            let feed = $(`.tt-prompt[uuid="${ UUID.from(body).value }"i]`);

                            feed?.setAttribute('halt', nullish(value));
                            phantomClick($('.okay', feed));

                            video.stopRecording(EVENT_NAME).saveRecording(EVENT_NAME, SAVE_NAME = value);
                        });

                        video.startRecording({ name: EVENT_NAME, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats })
                            .then(({ target }) => {
                                let chunks = target.blobs;
                                let feed = $(`.tt-prompt[uuid="${ UUID.from(body).value }"i]`),
                                    halt = parseBool(feed?.getAttribute('halt')),
                                    name = (feed?.getAttribute('value') || SAVE_NAME);

                                return SAVE_NAME = name;
                            })
                            .catch(error => {
                                WARN(error);

                                alert.timed(error, 7000);
                            })
                            .finally(() => {
                                DEFAULT_CLIP_NAME = new ClipName(2);

                                video.stopRecording(EVENT_NAME).saveRecording(EVENT_NAME, SAVE_NAME);
                            });
                    } else {
                        let feed = $(`.tt-prompt[uuid="${ UUID.from(body).value }"i]`);

                        phantomClick($('.okay', feed));

                        video.stopRecording(EVENT_NAME).saveRecording(EVENT_NAME, SAVE_NAME);
                    }
                }
            });

        // Send the previewed channel to the miniplayer
        // <Stream Preview>:hover → Z
        if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_Z))
            $.on('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_Z = function Send_to_Miniplayer({ key = '', altKey, ctrlKey, metaKey, shiftKey }) {
                if(!(ctrlKey || metaKey || altKey || shiftKey) && key.equals('z') && $.defined('#tt-stream-preview--iframe') && parseBool($('#tt-stream-preview--iframe').dataset.live))
                    MiniPlayer = $('#tt-stream-preview--iframe').dataset.name;
            });

        // Send the previewed channel to Live Reminders
        // <Stream Preview>:hover → R
        if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_R))
            $.on('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_R = function Send_to_Live_Reminders({ key = '', altKey, ctrlKey, metaKey, shiftKey }) {
                if(!(ctrlKey || metaKey || altKey || shiftKey) && key.equals('r') && $.defined('#tt-stream-preview--iframe') && parseBool($('#tt-stream-preview--iframe').dataset.live)) {
                    let name = $('#tt-stream-preview--iframe').dataset.name;

                    Cache.load('LiveReminders', async({ LiveReminders }) => {
                        try {
                            LiveReminders = JSON.parse(LiveReminders || '{}');
                        } catch(error) {
                            // Probably an object already...
                            LiveReminders ??= {};
                        }

                        let justInCase = { ...LiveReminders };

                        if(defined(LiveReminders[name]))
                            return confirm
                                .timed(`<div hidden controller
                                    okay="${ encodeHTML(Glyphs.modify('checkmark', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } OK"
                                    deny="${ encodeHTML(Glyphs.modify('trash', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Stop"
                                    ></div>You're already getting notifications for <a href="/${ name }">${ name }</a>.`, 7000)
                                .then(ok => {
                                    // The user pressed nothing, or pressed "OK"
                                    if(nullish(ok) || ok)
                                        return;
                                    delete LiveReminders[name];

                                    // The user pressed "Cancel"
                                    Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));
                                });
                        let search = await new Search(name).then(Search.convertResults);

                        LiveReminders[name] = (search.live? new Date(search?.data?.actualStartTime): search?.data?.lastSeen ?? new Date);

                        Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));

                        await confirm
                            .timed(`You'll be notified when <a href="/${ name }">${ name }</a> goes live.`, 7000)
                            .then(ok => {
                                // The user pressed nothing, or pressed "OK"
                                if(nullish(ok) || ok)
                                    return;

                                // The user pressed "Cancel"
                                Cache.save({ LiveReminders: { ...justInCase } }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));
                            });
                    });
                }
            });

        // Display the enabled keyboard shortcuts
        let [help] = $.body.getElementsByInnerText('space/k', 'i').filter(element => element.tagName.equals('TBODY'));

        let f = furnish;
        if(defined(help) && $.nullish('.tt-extra-keyboard-shortcuts', help))
            for(let shortcut in GLOBAL_EVENT_LISTENERS)
                if(/^(key(?:up|down)_)/i.test(shortcut)) {
                    let name = GLOBAL_EVENT_LISTENERS[shortcut].toTitle(),
                        macro = GetMacro(shortcut.toLowerCase().split('_').slice(1).join('+'));

                    if(!name.length)
                        continue;

                    help.append(
                        f('tr.tw-table-row.tt-extra-keyboard-shortcuts').with(
                            f('td.tw-tabel-cell').with(
                                f.p(name)
                            ),
                            f('td.tw-table-cell').with(
                                f.span(macro)
                            )
                        )
                    );
                }
    };
    Timers.extra_keyboard_shortcuts = 2_5_0;

    __ExtraKeyboardShortcuts__:
    if(parseBool(Settings.extra_keyboard_shortcuts)) {
        RegisterJob('extra_keyboard_shortcuts');
    }

    let DEFAULT_CLIP_NAME = new ClipName(2);
    let GLOBAL_CLIP_HANDLER = setInterval(() => {
        let EVENT_NAME = GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z.name;

        // Maintains a timer of the clip
        $.all('[tt-clip-timer]')
            .map(element => {
                let video = $(`video[uuid="${ element.dataset.connectedTo }"]`),
                    recorder = video.getRecording(EVENT_NAME);

                element.closest('[icon]').setAttribute('icon', element.innerHTML = toTimeString((+new Date) - recorder?.creationTime, 'clock'));
            });

        // Gets the clip's dimensions
        $.all('[tt-clip-sizer]')
            .map(element => {
                let video = $(`video[uuid="${ element.dataset.connectedTo }"]`);

                element.innerHTML = `${ video.videoWidth }&times;${ video.videoHeight }`;
            });

        // Gets the clip's file type
        $.all('[tt-clip-typer]')
            .map(element => {
                let video = $(`video[uuid="${ element.dataset.connectedTo }"]`),
                    [type] = (video?.mimeType ?? 'video/x-unknown').split(';');

                element.innerHTML =  `<code>${ MIME_Types.find(type) }</code> <code>${ type }</code>`;
            });

        // Maintains the framerate of the clip
        $.all('[tt-clip-rater]')
            .map(element => {
                let video = $(`video[uuid="${ element.dataset.connectedTo }"]`),
                    recorder = video.getRecording(EVENT_NAME),
                    data = recorder?.blobs;

                element.innerHTML = `<code>${ video.videoHeight }p</code> <code>${ ((data?.reduce((total, { size = 0 }) => total += size, 0) / data?.length) | 0).suffix('bps', false, 'data') }</code>`;
            });

        // Maintains the file size of the clip
        $.all('[tt-clip-watcher]')
            .map(element => {
                let video = $(`video[uuid="${ element.dataset.connectedTo }"]`),
                    recorder = video.getRecording(EVENT_NAME),
                    data = recorder?.blobs;

                element.innerHTML = data?.reduce((total, { size = 0 }) => total += size, 0)?.suffix('B', 2);
            });

        // All unit targets
        $.all('[unit] input').map(input => {
            input.onfocus ??= ({ currentTarget }) => currentTarget.closest('[unit]').setAttribute('focus', true);
            input.onblur ??= ({ currentTarget }) => currentTarget.closest('[unit]').setAttribute('focus', false);

            if(input.disabled)
                input.closest('[unit]').setAttribute('valid', true);
            else
                input.oninput = ({ currentTarget }) => currentTarget.closest('[unit]').setAttribute('valid', currentTarget.checkValidity());
        });
    }, 1000);

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
        // The theme
        THEME = [...$('html').classList].find(c => /theme-(\w+)/i.test(c)).replace(/[^]*theme-(\w+)/i, '$1').toLowerCase();
        ANTITHEME = window.ANTITHEME = ['light', 'dark'].filter(theme => theme != THEME).pop();

        let [PRIMARY, SECONDARY] = [STREAMER.tint, STREAMER.tone]
            .map(Color.HEXtoColor)
            // Primary → Closest to theme; Secondary → Furthest from theme
            .sort((C1, C2) => {
                let background = (THEME.equals('dark')? Color.black: Color.white);

                return Color.contrast(background, [C1.R, C1.G, C1.B]) - Color.contrast(background, [C2.R, C2.G, C2.B]);
            })
            .map(color => color.HEX);

        THEME__CHANNEL_DARK = (THEME.equals('dark')? PRIMARY: SECONDARY);
        THEME__CHANNEL_LIGHT = (THEME.unlike('dark')? PRIMARY: SECONDARY);

        PRIMARY = Color.HEXtoColor(PRIMARY);
        SECONDARY = Color.HEXtoColor(SECONDARY);

        let contrastOf = (C1, C2) => Color.contrast(...[C1, C2].map(({ R, G, B }) => [R, G, B])),

            black = { R: 0, G: 0, B: 0 },
            white = { R: 255, G: 255, B: 255 },

            theme = (THEME.equals('dark')? black: white),
            antitheme = (THEME.unlike('dark')? black: white);

        THEME__BASE_CONTRAST = contrastOf(PRIMARY, SECONDARY);
        THEME__PREFERRED_CONTRAST = `${ THEME__BASE_CONTRAST.toString() } prefer ${ (contrastOf(PRIMARY, theme) > contrastOf(PRIMARY, antitheme)? THEME: ANTITHEME) }`;

        // Better styling. Will match the user's theme choice as best as possible
        AddCustomCSSBlock('better-themed-styling',
            `
            /* The user is using the light theme (like a crazy person) */
            :root {
                --channel-color: ${ STREAMER.tint };
                --channel-color-contrast: ${ STREAMER.tone };
                --channel-color-complement: ${ STREAMER.aego };
                --channel-color-dark: ${ THEME__CHANNEL_DARK };
                --channel-color-light: ${ THEME__CHANNEL_LIGHT };
            }

            :root[class*="light"i] {
                --color-colored: var(--channel-color-light);
                --color-colored-contrast: var(--channel-color-dark);
                --channel-color-opposite: var(--channel-color-complement);
            }

            /* The user is using the dark theme */
            :root[class*="dark"i] {
                --color-colored: var(--channel-color-dark);
                --color-colored-contrast: var(--channel-color-light);
                --channel-color-opposite: var(--channel-color-complement);
            }

            [up-next--body] *:is(button, h5) {
                --color: var(--user-contrast-color) !important;
                --fill: var(--user-contrast-color) !important;
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
            `);
    }

    __GET_UPDATE_INFO__: {
        // Getting the version information
        let installedFromWebstore = parseURL(Runtime.getURL('profile.png')).host.equals("fcfodihfdbiiogppbnhabkigcdhkhdjd");

        wait(3_600_000, installedFromWebstore).then(async installedFromWebstore => {
            let FETCHED_DATA = { wasFetched: false };
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

            await Settings.get(['buildVersion', 'chromeVersion', 'githubVersion', 'versionRetrivalDate'], async({ buildVersion, chromeVersion, githubVersion, versionRetrivalDate }) => {
                buildVersion ??= properties.version.installed;
                versionRetrivalDate ||= 0;

                // Only refresh if the data is older than 1h
                // The data has expired →
                __FetchingUpdates__:
                if((FETCHED_DATA.wasFetched === false) && (versionRetrivalDate + 3_600_000) < +new Date) {
                    let githubURL = 'https://api.github.com/repos/ephellon/twitch-tools/releases/latest';

                    fetchURL(githubURL)
                        .then(response => {
                            if(FETCHED_DATA.wasFetched)
                                throw 'Data was already fetched';

                            return response.json();
                        })
                        .then(metadata => {
                            LOG({ ['GitHub']: metadata });

                            return properties.version.github = metadata.tag_name;
                        })
                        .then(version => Settings.set({ githubVersion: version }))
                        .catch(async error => {
                            await Settings.get(['githubVersion'], ({ githubVersion }) => {
                                if(defined(githubVersion))
                                    properties.version.github = githubVersion;
                            });
                        })
                        .finally(() => {
                            let githubUpdateAvailable = compareVersions(`${ properties.version.installed } < ${ properties.version.github }`),
                                chromeUpdateAvailable = false;

                            FETCHED_DATA = { ...FETCHED_DATA, ...properties };
                            Settings.set({ githubUpdateAvailable });

                            // Only applies to versions installed from the Chrome Web Store
                            __ChromeOnly__:
                            if(installedFromWebstore)
                                Settings.set({ chromeUpdateAvailable: githubUpdateAvailable });

                            if((!installedFromWebstore && githubUpdateAvailable) || (installedFromWebstore && chromeUpdateAvailable))
                                confirm
                                    .timed(`There is an update available for ${ Manifest.name } (${ properties.version.installed } &rarr; ${ properties.version.github })`)
                                    .then(ok => {
                                        if(nullish(ok))
                                            return;

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

                        Settings.set({ versionRetrivalDate });
                    }
                }
                // The data hasn't expired yet
                else {
                    properties.version.github = githubVersion ?? properties.version.github;
                    properties.version.chrome = chromeVersion ?? properties.version.chrome;
                }
            });
        });
    }

    // End of Initialize
};
// End of Initialize

let CUSTOM_CSS,
    PAGE_CHECKER,
    WAIT_FOR_PAGE,
    PAGE_IS_READY = false,
    RECOVERY_TRIALS = 0,
    VIDEO_AD_COUNTDOWN,
    NORMALIZED_AD_VOLUME = false,
    NORMALIZED_AD_COUNTER = 0,
    NORMALIZED_AD_COUNTER_CURRENT = 1,
    LAST_TIME_AD_WAS_CHECKED,
    LAST_VALUE_WHEN_AD_WAS_CHECKED;

// Do NOT run on iframes...
if(top == window) {
    // Keep the background alive (every 3 minutes)
    setInterval(() => {
        let KeepAlive = Runtime.connect({ name: 'PING' });

        KeepAlive.postMessage('PING', () => KeepAlive.disconnect());
    }, 180e3);

    Runtime.sendMessage({ action: 'GET_VERSION' }, async({ version = null }) => {
        let isProperRuntime = Manifest.version === version;

        PAGE_CHECKER = !isProperRuntime?
            ERROR(`The current runtime (v${ Manifest.version }) is not correct (v${ version })`)
                ?.toNativeStack?.():
        setInterval(WAIT_FOR_PAGE = async() => {
            let sadOverlay = $('[data-test-selector*="sad"i][data-test-selector*="overlay"i]');
            let adCountdown = $('[data-a-target*="ad-countdown"i]');

            // Ensure settings are loaded
            if(nullish(Settings?.versionRetrivalDate))
                await Settings.get();

            // Set the ad volume, if applicable
            // Ensures the volume gets set once; just in case the user actually wants to hear it
            NORMALIZED_AD_VOLUME = true
                && $.defined('[data-a-target*="ad-countdown"i]')
                && (NORMALIZED_AD_COUNTER != NORMALIZED_AD_COUNTER_CURRENT)
                && (false
                    || SetVolume(Settings.away_mode__volume)
                    || (NORMALIZED_AD_COUNTER = NORMALIZED_AD_COUNTER_CURRENT)
                );

            // Ensures the ad does not freeze the page
            refresh_on_ad_freeze: if(defined(sadOverlay) || defined(adCountdown)) {
                if(nullish(LAST_TIME_AD_WAS_CHECKED)) {
                    LAST_TIME_AD_WAS_CHECKED = +new Date;
                    LAST_VALUE_WHEN_AD_WAS_CHECKED = adCountdown?.textContent;

                    break refresh_on_ad_freeze;
                }

                if(true
                    && (+new Date - LAST_TIME_AD_WAS_CHECKED) > (VIDEO_AD_COUNTDOWN + 2_500)
                    && LAST_VALUE_WHEN_AD_WAS_CHECKED.equals(adCountdown.textContent)
                ) {
                    WARN(`The advertisement seems to be stalled... Refreshing page...`);

                    ReloadPage(false);
                }
            }

            let ready = (true
                // There is a valid username
                && defined(USERNAME)

                // The follow button exists
                && $.defined(`[data-a-target="follow-button"i], [data-a-target="unfollow-button"i]`)

                // There are channel buttons on the side
                && parseBool($.all('[id*="side"i][id*="nav"i] .side-nav-section[aria-label]')?.length)

                // There isn't an advertisement playing
                && nullish(sadOverlay)
                && nullish(adCountdown)

                // There are proper containers
                && (false
                    // There is a message container
                    || $.defined('[data-test-selector$="message-container"i]')

                    // There is an ongoing search
                    || (true
                        && $.defined('[data-test-selector*="search-result"i][data-test-selector$="name"i]')
                        && $.defined('[data-a-target^="threads-box-"i]')
                    )

                    // The page is a channel viewing page
                    // || /^((?:Channel|Video)Watch|(?:Squad)Stream)Page$/i.test($('#root')?.dataset?.aPageLoadedName)

                    // There is an error message
                    || $.defined('[data-a-target*="error"i][data-a-target*="message"i], [data-test-selector*="content"i][data-test-selector*="overlay"i]')

                    // There is a "muted segments" warning
                    || $.defined('[data-test-selector*="muted"i][data-test-selector*="overlay"i]')
                )
            );

            if(!ready)
                return when.defined(() => $('[data-a-target*="ad-countdown"i]'))
                    .then(countdown => {
                        if(ready || defined(VIDEO_AD_COUNTDOWN))
                            return;

                        let { count = 1, time = 15 } = (/(?:(?<count>\d+)\D+)?(?<time>(?<minute>\d{1,2})(?<seconds>:[0-5]\d))/.exec(countdown.textContent)?.groups ?? {});

                        if('00:00'.contains(time))
                            return;

                        count = parseInt(count);
                        time = (parseTime(time) + 10).floorToNearest(15);

                        NORMALIZED_AD_COUNTER_CURRENT = count;

                        alert.timed(`${ Manifest.name } will resume after the ad-break.`, VIDEO_AD_COUNTDOWN = count * time);
                    });

            LOG("Main container ready");

            // Set the user's language
            let [documentLanguage] = (document.documentElement?.lang ?? navigator?.userLanguage ?? navigator?.language ?? 'en').toLowerCase().split('-');

            window.LANGUAGE = LANGUAGE = Settings.user_language_preference || documentLanguage;

            // Give the storage 3s to perform any "catch-up"
            wait(3000, ready).then(async ready => {
                await Initialize(ready)
                    .then(() => {
                        // TTV Tools has the max Timer amount to initilize correctly...
                        let REINIT_JOBS =
                        setTimeout(() => {
                            let NOT_LOADED_CORRECTLY = [],
                                ALL_LOADED_CORRECTLY = (true
                                    // Lurking
                                    && parseBool(
                                            parseBool(Settings.away_mode)?
                                                (false
                                                    || $.defined('#away-mode')

                                                    || !NOT_LOADED_CORRECTLY.push('away_mode')
                                                ):
                                            true
                                        )

                                    // Auto-Claim Bonuses
                                    && parseBool(
                                            parseBool(Settings.auto_claim_bonuses)?
                                                (false
                                                    || $.defined('#tt-auto-claim-bonuses')
                                                    || $.nullish('[data-test-selector="balance-string"i]')
                                                    || parseBool(Settings.view_mode)
                                                    || STREAMER.veto

                                                    || !NOT_LOADED_CORRECTLY.push('auto_claim_bonuses')
                                                ):
                                            true
                                        )

                                    // Up Next
                                    && parseBool(
                                            !parseBool(Settings.first_in_line_none)?
                                                (false
                                                    || $.defined('[up-next--container]')

                                                    || !NOT_LOADED_CORRECTLY.push('first_in_line')
                                                ):
                                            true
                                        )

                                    // Watch Time
                                    && parseBool(
                                            parseBool(Settings.watch_time_placement)?
                                                (false
                                                    || $.defined('#tt-watch-time')

                                                    || !NOT_LOADED_CORRECTLY.push('watch_time_placement')
                                                ):
                                            true
                                        )

                                    // Channel Points Receipt
                                    && parseBool(
                                            parseBool(Settings.points_receipt_placement)?
                                                (false
                                                    || $.defined('#tt-points-receipt')

                                                    || !NOT_LOADED_CORRECTLY.push('points_receipt_placement')
                                                ):
                                            true
                                        )
                                );

                            if(false
                                // This page shouldn't be touched...
                                || RESERVED_TWITCH_PATHNAMES.test(location.pathname)

                                // Everything loaded just fine
                                || ALL_LOADED_CORRECTLY
                            )
                                return PAGE_IS_READY = !clearInterval(REINIT_JOBS);

                            WARN(`The following did not activate properly: ${ NOT_LOADED_CORRECTLY }. Reloading...`);

                            for(let job of NOT_LOADED_CORRECTLY)
                                if(defined(job))
                                    RestartJob(job, 'FAILED_TO_ACTIVATE');

                            if(parseBool(Settings.recover_pages)) {
                                if(++RECOVERY_TRIALS > 10)
                                    return PushToTopSearch(NOT_LOADED_CORRECTLY.map(fail => 'fail_to_load--' + fail), true);
                                return false;
                            }

                            // Failed to activate job at...
                            // PushToTopSearch({ 'tt-err-job': (+new Date).toString(36) }, true);

                            Initialize.ready = ready;
                        }, Math.max(...Object.values(Timers)));
                    });

                // Handle coin related bulletins
                setInterval(async() => {
                    let { sole, name, fiat } = STREAMER;
                    let line = $('[data-test-selector="user-notice-line"i]:not([data-uuid])');

                    if(nullish(line))
                        return;

                    let [head, body] = line.children,
                        type = 'unknown';

                    if($.defined(`img[class*="channel-points"i][class*="icon"i][alt="${ fiat }"i], [class*="channel-points"i][class*="icon"i] svg`, head))
                        type = 'coin';
                    else if($.defined(`a[target="_blank"i]:is([rel~="noopener"i], [rel~="noreferrer"i])`))
                        type = 'shoutout';

                    let [user] = ($('[data-a-target$="username"i]', body) || head).textContent.split(' ');

                    let badges = $.all('img.chat-badge', body).map(badge => badge.alt.toLowerCase() + badge.src.replace(/^.*?\/(?:v(\d+))\/.*$/i, '/$1')),
                        color = Color.destruct($('[data-a-target$="username"i]', body)?.style?.color || '#9147FF').HEX,
                        mod = +STREAMER.perm.is('mod'),
                        sub = +STREAMER.paid,
                        shopID = await STREAMER.shop.find(entry => (true
                            && head.textContent.contains(entry.title)
                            && head.textContent.contains(comify(entry.cost))
                        ))?.id,
                        spotlight = $('a[target="_blank"i]', body)?.textContent;

                    line.dataset.uuid = UUID.from(line.getPath());

                    let data = `@color=${ color };display-name=${ user };login=${ user.toLowerCase() };mod=${ mod };msg-id=pointsredeemed;<!>;subscriber=${ sub } :tmi.twitch.tv USERNOTICE #${ name } :${ [head, body].filter(defined).map(element => element.innerText.trim().replace(/\s+/g, ' ')).join(' ') }`;

                    if(defined(shopID))
                        data = data.replace('<!>', `msg-param-shop-id=${ shopID }`);
                    else if(defined(spotlight))
                        data = data.replace('<!>', `msg-param-spotlight=${ spotlight }`);
                    data = data.replace('<!>;', '');

                    TTV_IRC.socket?.reflect?.({ data });
                }, 100);

                // Handle saved states...
                wait(1000).then(() => {
                    let { mini = '' } = parseURL(location).searchParameters;

                    if(mini.length)
                        MiniPlayer = mini;
                });
            });
            PAGE_CHECKER = clearInterval(PAGE_CHECKER);

            window.MAIN_CONTROLLER_READY = true;

            // Observe location changes
            LocationObserver: {
                let { body } = document,
                    observer = new MutationObserver(mutations => {
                        mutations.map(mutation => {
                            if(PATHNAME !== location.pathname) {
                                let OLD_HREF = PATHNAME;

                                PATHNAME = location.pathname;

                                NORMALIZED_PATHNAME = PATHNAME
                                    // Remove common "modes"
                                    .replace(/^\/(?:moderator|popout)\/(\/[^\/]+?)/i, '$1')
                                    .replace(/^(\/[^\/]+?)\/(?:about|schedule|squad|videos)\b/i, '$1');

                                for(let [name, func] of __ONLOCATIONCHANGE__)
                                    func(new CustomEvent('locationchange', { from: OLD_HREF, to: PATHNAME }));
                            }
                        });
                    });

                observer.observe(body, { childList: true, subtree: true });
            }

            // Observe the volume changes
            VolumeObserver: {
                $.all('video ~ * .player-controls *:is([data-a-target*="volume"i], [data-a-target*="mute"i])')
                    .map(element => {
                        element.addEventListener('mousedown', ({ currentTarget, isTrusted }) => {
                            currentTarget.closest('.player-controls').dataset.isTrusted = isTrusted;

                            for(let [name, callback] of GetVolume.__onchange__)
                                callback(currentTarget.value, { isTrusted });
                        });

                        element.addEventListener('mouseup', ({ currentTarget, isTrusted }) => {
                            currentTarget.closest('.player-controls').dataset.isTrusted = isTrusted;

                            for(let [name, callback] of GetVolume.__onchange__)
                                callback(currentTarget.value, { isTrusted });
                        });

                        element.addEventListener('change', ({ currentTarget, isTrusted }) => {
                            currentTarget.closest('.player-controls').dataset.isTrusted = isTrusted;

                            for(let [name, callback] of GetVolume.__onchange__)
                                callback(currentTarget.value, { isTrusted });
                        });
                    });
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

                for(let container of $.all('[id*="side"i][id*="nav"i] .side-nav-section[aria-label], .about-section__actions > * > *, [data-target^="channel-header"i] button')) {
                    let svg = $('svg', container);

                    if(nullish(svg))
                        continue;

                    comparing:
                    for(let glyph in Glyphs)
                        if(Glyphs.__exclusionList__.contains(glyph))
                            continue comparing;
                        else
                            resemble(svg.toImage())
                                .compareTo(Glyphs.modify(glyph, { height: '20px', width: '20px' }).asNode.toImage())
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
                    if(parseBool(Settings.keep_popout)) {
                        PAGE_CHECKER ??= setInterval(WAIT_FOR_PAGE, 500);

                        // Save states...
                        let states = {
                            mini: MiniPlayer?.dataset?.name,
                        };

                        for(let key in states)
                            if(parseBool(states[key]))
                                PushToTopSearch({ [key]: states[key] });

                        break Reinitialize;
                    }

                    ReloadPage();
                }
            };

            // Add custom styling
            CustomCSSInitializer: {
                CUSTOM_CSS = $('#tt-custom-css') ?? furnish('style#tt-custom-css');

                let [accent, contrast] = (Settings.accent_color || 'blue/12').split('/');

                CUSTOM_CSS.innerHTML =
                `
                :root {
                    --user-accent-color: var(--color-${ accent });
                    --user-contrast-color: var(--color-${ accent }-${ contrast });
                    --user-complement-color: var(--channel-color-opposite);

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

                [class*="theme"i][class*="dark"i] [tt-light], [class*="theme"i][class*="dark"i] [class*="chat"i][class*="status"i] { background-color: var(--color-opac-w-4) !important }
                [class*="theme"i][class*="light"i] [tt-light], [class*="theme"i][class*="light"i] [class*="chat"i][class*="status"i] { background-color: var(--color-opac-b-4) !important }

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
                    color: var(--color-hinted-grey-${ contrast });
                }

                [up-next--body][empty="true"i] {
                    background-image: url("${ Runtime.getURL('up-next-tutorial.png') }");
                    background-repeat: no-repeat;
                    background-size: 35rem;
                    background-position: bottom center;
                }

                [class*="theme"i][class*="dark"i] [up-next--body][empty="true"i]:is([tt-mix-blend$="contrast"i]) {
                    /* background-blend-mode: color-burn; */
                }

                [class*="theme"i][class*="light"i] [up-next--body][empty="true"i]:is([tt-mix-blend$="contrast"i]) {
                    /* background-blend-mode: darken; */
                }

                [up-next--body][allowed="false"i] {
                    background-image: url("${ Runtime.getURL('256.png') }") !important;
                    background-repeat: repeat !important;
                    background-size: 5rem !important;
                    background-position: center center !important;
                    background-blend-mode: difference !important;
                }

                #up-next-boost[speeding="true"i] {
                    animation: fade-in 1s alternate infinite;
                }

                /* Live Reminders */
                #tt-reminder-listing:not(:empty) ~ [live] { display:none }

                .tt-time-elapsed {
                    color: var(--color-text-live);
                    text-shadow: 0 0 3px var(--color-background-base);

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

                /* Change Up Next font color */
                [class*="theme"i][class*="dark"i] [tt-mix-blend$="contrast"i] { /* mix-blend-mode:lighten */ }
                [class*="theme"i][class*="light"i] [tt-mix-blend$="contrast"i] { /* mix-blend-mode:darken */ }

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

                #tt-stream-preview--iframe {
                    display: block;
                    border-radius: inherit;
                    opacity: 1;
                    visibility: inherit;
                }

                .invisible {
                    opacity: 0;
                }

                .tt-stream-preview[data-vods][data-position="above"i]::after, .tt-stream-preview[data-vods][data-position="below"i]::before {
                    content: "Choose VOD (↑ / ↓)";

                    background-color: var(--color-background-tooltip);
                    border-radius: .4rem;
                    color: var(--color-text-tooltip);
                    display: inline-block;
                    font-family: inherit;
                    font-size: 100%;
                    font-weight: 600;
                    line-height: 1.2;
                    padding: .5rem;
                    pointer-events: none;
                    text-align: left;
                    user-select: none;
                    white-space: nowrap;

                    position: absolute;
                    left: 50%;
                    transform: translate(-50%,0);
                    z-index: 9999;

                    animation: 1s fade-out 1 forwards 7s;
                }

                .tt-stream-preview[data-vods="false"i][data-position="above"i]::after, .tt-stream-preview[data-vods="false"i][data-position="below"i]::before {
                    content: "Send to miniplayer (z) \\b7  Add to Live Reminders (r)";
                }

                video ~ * .player-controls :is([data-a-target*="mute"i] svg, [data-test-selector*="fill-value"i], [data-a-target$="slider"i]::-webkit-slider-thumb, [data-a-target$="slider"i]::-moz-range-thumb) {
                    transition: all 1s;
                }

                video ~ * .player-controls[data-automatic="true"i] [data-a-target*="mute"i] svg {
                    fill: var(--color-warn);
                }

                video ~ * .player-controls[data-automatic="true"i] [data-test-selector*="fill-value"i] {
                    background-color: var(--color-warn);
                }

                video ~ * .player-controls[data-automatic="true"i] :is([data-a-target$="slider"i]::-webkit-slider-thumb, [data-a-target$="slider"i]::-moz-range-thumb) {
                    border: var(--border-width-default) solid var(--color-warn);
                    background-color: var(--color-warn);
                }

                [data-test-selector="picture-by-picture-player-background"i] ~ [data-test-selector="picture-by-picture-player-background"i] {
                    display: none !important;
                }

                /* Chat */
                [class*="chat-list"i] [class*="simple"i] {
                    overflow-x: hidden !important;

                    margin-bottom: -14px !important;
                }

                /* Ads */
                [class*="stream"][class*="-ad"i] {
                    display: none !important;
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
                        let [user_language_preference] = (document.documentElement?.lang ?? navigator?.userLanguage ?? navigator?.language ?? 'en').toUpperCase().split('-');

                        Settings.set({ user_language_preference });

                        // Point out the newly added buttons
                        wait(10_000).then(() => {
                            for(let element of $.all('#tt-auto-claim-bonuses, [up-next--container]'))
                                element.classList.add('tt-first-run');

                            let style = new CSSObject({ verticalAlign: 'bottom', height: '20px', width: '20px' });

                            // Make sure the user goes to the Settings page
                            alert
                                .timed(`Please visit the <a href="#" onmouseup="top.postMessage({action:'open-options-page'})">Settings</a> page or click the ${ Glyphs.modify('channelpoints', { style, ...style.toObject() }) } to finalize setup`, 30_000, true)
                                .then(action => $.all('.tt-first-run').forEach(element => element.classList.remove('tt-first-run')));
                        });
                    } break;
                }

                Settings.set({ onInstalledReason: null });
            }

            // Jump some frames
            FrameJumper: {
                document.head.append(
                    furnish('script', {
                        src: Runtime.getURL('ext/jump.js'),
                        onload() {
                            // Do something when the data is jumped...
                        },
                    })
                );
            }

            // Add message listeners; wait until the page is ready before adding this to ensure the background script can handle bad instances properly //
            // Receive messages from the background service worker
            Runtime.onMessage.addListener(async(request, sender, respond) => {
                if(sender.id.unlike(Runtime.id))
                    return /* Not meant for us... */;

                let R = RegExp;

                switch(request?.action) {
                    case 'report-back': {
                        respond({ ok: true, performance: (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize), timestamp: +new Date });
                    } break;

                    case 'consume-up-next': {
                        let { next, obit } = request,
                            name = parseURL(next).pathname.slice(1);

                        NOTICE(`Job stolen "${ name }" by "${ obit }" tab`);

                        when.defined(name => $(`[id^="tt-balloon-job"i][name="${ name }"i]`), 100, name)
                            .then(element => {
                                $('button[data-test-selector*="delete"i]', element)?.click();
                            });
                    } break;

                    case 'reload': {
                        if(UP_NEXT_ALLOW_THIS_TAB || request.forced) {
                            await top.beforeleaving?.({});

                            respond({ ok: true });
                        } else {
                            respond({ ok: false });
                        }
                    } break;

                    case 'close': {
                        await top.beforeleaving?.({});

                        respond({ ok: true });

                        wait(100).then(() => window.close());
                    } break;
                }
            });

            // Lag reporter
            Runtime.sendMessage({ action: 'BEGIN_REPORT' });
        }, 500);
    });

    document.body.onload = event => {
        // Move on from banned/moved channels
        AntiTimeMachine:
        when.defined(() => $('main [data-a-target*="error"i][data-a-target*="message"i] ~ * [href$="directory"i]'))
            .then(() => {
                let ErrorMessage = $('main [data-a-target*="error"i][data-a-target*="message"i]')?.textContent;

                when.defined(() => $(`[id*="side"i][id*="nav"i] .side-nav-section a:not([href$="${ PATHNAME }"i])`))
                    .then(channel => {
                        WARN(`${ location.pathname.slice(1) } is not available: ${ ErrorMessage }\nHeading to ${ channel.href }`);

                        goto(channel.href);
                    })
            });

        // Color compontents
        ColorComponents:
        if($.nullish('#tt-custom-css')) {
            let color = window
                ?.getComputedStyle?.($(`main a[href$="${ NORMALIZED_PATHNAME }"i]`) ?? $(':root'))
                ?.getPropertyValue?.('--color-accent');

            color = Color.destruct(color || '#9147FF');

            $.body.append(furnish('style#tt-custom-css').with(`:root { --user-accent-color:${ color.HSL }; --user-complement-color:hsl(${ [color.H + 180, color.S, color.L].map((v, i) => v+'%deg'.slice(+!i,1+3*!i)) }) }`));
        }

        // Alerts for users
        DisplayNews:
        Cache.load('ReadNews', async({ ReadNews }) => {
            let TTVToolsNewsURL = `https://github.com/Ephellon/Twitch-Tools/wiki/News?fetched-at=${ +new Date }`,
                TTVToolsNewsArticles = ReadNews || [];

            fetchURL(TTVToolsNewsURL)
                .then(r => r.text())
                .then(html => {
                    let dom = (new DOMParser).parseFromString(html, 'text/html');

                    return $('#wiki-body', dom)?.children ?? [];
                })
                .then(([main, footer]) => {
                    if(nullish(main))
                        return;

                    let articles = main.getElementsByInnerText(/(\d{4}-\d{2}-\d{2})/)
                        .filter(({ tagName }) => /^h\d$/i.test(tagName))
                        .map(header => {
                            let content = [];

                            let e = header;
                            while(defined(e = e.nextElementSibling) && !/^h\d$/i.test(e.tagName))
                                content.push(e);

                            return { header, content };
                        }).map(({ header, content }) => {
                            let articleID = UUID.from(header.textContent, true).value;

                            if(TTVToolsNewsArticles.contains(articleID))
                                return;
                            TTVToolsNewsArticles.push(articleID);

                            let article = furnish(`#tt-news-${ articleID }`).with(
                                header, ...content
                            );

                            $.all('a.anchor', article).map(a => a.remove());

                            return article.outerHTML;
                        })
                        .filter(defined);

                    if(articles.length)
                        confirm.silent(`<input hidden controller icon="${ Glyphs.utf8.unread }" title="News" deny="Ignore"/> ${ articles.join('<br>') }`)
                        .then(ok => ok && Cache.save({ ReadNews: TTVToolsNewsArticles.isolate() }));
                });
        });

        // Observe chat & whispers
        let CHAT_SELF_REFLECTOR;

        CommsObserver: if(!RESERVED_TWITCH_PATHNAMES.test(location.pathname)) {
            let [CHANNEL] = location.pathname.toLowerCase().slice(1).split('/').slice(+(top != window)),
                USERNAME = Search.cookies.login ?? `User_Not_Logged_In_${ +new Date }`;

            CHANNEL = `#${ CHANNEL }`;

            // Simple WebSocket → https://dev.twitch.tv/docs/irc
            if(defined(TTV_IRC.socket))
                return;

            Object.defineProperty(TTV_IRC, 'wsURL', {
                value: `wss://irc-ws.chat.twitch.tv:443`,

                writable: false,
                enumerable: false,
                configurable: false,
            });

            let socket = (TTV_IRC.socket = new WebSocket(TTV_IRC.wsURL));

            let START_WS = socket.onopen = event => {
                LOG(`Chat Relay (main) connected to "${ CHANNEL }"`);

                // CONNECTING → 0; OPEN → 1; CLOSING → 2; CLOSED → 3
                when(() => socket.readyState === WebSocket.OPEN)
                    .then(() => {
                        socket.send(`CAP REQ :twitch.tv/commands twitch.tv/membership twitch.tv/tags`);
                        socket.send(`PASS oauth:${ Search.cookies.auth_token }`);
                        socket.send(`NICK ${ USERNAME.toLowerCase() }`);
                    });

                let restrictions = (TTV_IRC.restrictions ??= new Map);

                socket.onmessage = socket.reflect = CHAT_SELF_REFLECTOR = async event => {
                    let messages = event.data.trim().split('\r\n').map(TTV_IRC.parseMessage).filter(defined);

                    // REMARK('Chat Relay received messages', messages);

                    for(let { command, parameters, source, tags } of messages) {
                        const channel = (command.channel ?? CHANNEL).toLowerCase();
                        const usable = parseBool(channel.equals(CHANNEL));

                        switch(command.command) {
                            // Successful login attempt
                            case '001': {
                                socket.send(`JOIN ${ CHANNEL }`);
                                socket.send(`PRIVMSG ${ CHANNEL } :/mods`);
                                socket.send(`PRIVMSG ${ CHANNEL } :/vips`);
                            } break;

                            // PONG the server back...
                            case 'PING': {
                                socket.send(`PONG ${ parameters }`);
                            } break;

                            // Someone joined the server
                            case 'JOIN': {
                                // LOG(`New user "${ source.nick }" on ${ channel }`);

                                Chat.gang.push(source.nick);
                            } break;

                            // Kicked!
                            case 'PART': {
                                // WARN(`Unable to relay messages from "${ source.nick }" on ${ channel }`);

                                if(USERNAME.equals(source.nick))
                                    socket.close();

                                Chat.gang = Chat.gang.filter(user => user.unlike(source.nick));
                            } break;

                            // Something happened...
                            case 'NOTICE': {
                                if('room_mods mod_success unmod_success no_mods vips_success vip_success unvip_success no_vips'.contains(tags?.msg_id)) {
                                    let msg = tags.msg_id,
                                        typ = msg.replace(/.*((?:mod|vip)s?).*/i, '$1').toLowerCase();

                                    if(msg.startsWith('no_'))
                                        /* Do nothing */;
                                    else if(/^(mod|vip)_/i.test(msg))
                                        Chat[typ].push(parameters.replace(/.*added\s+(\S+).*/i, '$1').toLowerCase());
                                    else if(/^un(mod|vip)_/i.test(msg))
                                        Chat[typ] = Chat[typ].filter(name => name.unlike(parameters.replace(/.*removed\s+(\S+).*/i, '$1')));
                                    else
                                        Chat[typ].push(...parameters.replace(/^[^:]*(.+?)\.?$/, ($0, $1) => $1.replace(/[:\s]+/g, '').toLowerCase()).split(','));
                                } else if('host_on host_off'.contains(tags?.msg_id)) {
                                    if(!usable) continue;

                                    when.defined(() => STREAMER)
                                        .then(() => {
                                            for(let callback of STREAMER.__eventlisteners__.onhost)
                                                when(() => PAGE_IS_READY, 250).then(() => callback({ hosting: parameters.toLowerCase().startsWith('now hosting') }));
                                        });
                                } else {
                                    if(/^((?:bad|msg|no|un(?:available|recognized))_|(?:invalid)|_(?:banned|error|limit|un(?:expected)))/i.test(tags?.msg_id))
                                        WARN(`There's an error on ${ channel }: ${ parameters }`, { command, parameters, source, tags });
                                    else
                                        WARN(`Something's happening on ${ channel }: ${ parameters }`, { command, parameters, source, tags });

                                    // socket.send(`PART ${ channel }`);
                                }
                            } break;

                            // Status(es) of the room
                            case 'ROOMSTATE': {
                                let { room_id, emote_only, followers_only, r9k, slow, subs_only } = tags;

                                restrictions.set(channel, {
                                    room_id,
                                    emote_only: parseBool(+emote_only),
                                    followers_only: (+followers_only > 0? +followers_only * 60_000: !1),
                                    r9k: parseBool(+r9k),
                                    slow: (+slow * 1000),
                                    subs_only: parseBool(+subs_only),
                                });
                            } break;

                            // Something happened (alert)
                            case 'USERNOTICE': {
                                let { id, msg_id, system_msg } = tags;

                                let message = (system_msg ?? parameters).replace(/\\s/g, ' '),
                                    mentions = message.split(/(@\S+)/).filter(s => s.startsWith('@')).map(s => s.slice(1).toLowerCase()),
                                    subject = (
                                        'sub resub'.split(' ').contains(msg_id)?
                                            'dues':
                                        'giftpaidupgrade anongiftpaidupgrade'.split(' ').contains(msg_id)?
                                            'keep':
                                        'subgift rewardgift submysterygift rewardmysterygift'.split(' ').contains(msg_id)?
                                            'gift':
                                        'raid'.split(' ').contains(msg_id)?
                                            'raid': // incoming raids
                                        'pointsredeemed'.split(' ').contains(msg_id)?
                                            'coin':
                                        'note'
                                    ),
                                    element = when.defined((message, subject) =>
                                        // TODO: get bullets via text content
                                        $.all('[role] ~ *:is([role="log"i], [class~="chat-room"i], [data-a-target*="chat"i], [data-test-selector*="chat"i]) *:is(.tt-accent-region, [data-test-selector="user-notice-line"i], [class*="notice"i][class*="line"i], [class*="gift"i], [data-test-selector="announcement-line"i], [class*="announcement"i][class*="line"i])')
                                            .find(element => {
                                                let [A, B] = [message, element.textContent].map(string => string.mutilate()).sort((a, b) => b.length - a.length);

                                                if(false
                                                    // The element already has a UUID and type
                                                    || (element.dataset.uuid && element.dataset.type)
                                                    // The text matches less than 40% of the message
                                                    || A.slice(0, B.length).errs(B) > .6
                                                )
                                                    return false;

                                                element.dataset.uuid ||= UUID.from(element.getPath());
                                                element.dataset.type ||= subject;

                                                return message.mutilate().errs(element.textContent.mutilate()) < .2;
                                            })
                                        , 100, message, subject);

                                let results = {
                                    element,
                                    usable,
                                    message,
                                    subject,
                                    mentions,
                                    timestamp: new Date,

                                    // TODO: see if there are extra `msg_id` values
                                    // msg_id,
                                };

                                Chat.__allbullets__.add(results);

                                for(let [name, callback] of Chat.__onbullet__)
                                    when(() => PAGE_IS_READY, 250).then(() => callback(results));

                                for(let [name, callback] of Chat.__deferredEvents__.__onbullet__)
                                    when.defined.pipe(async(callback, results) => await results?.element, 250, callback, results).then(([callback, results]) => callback(results));
                            } break;

                            // The channel is hosting...
                            case 'HOSTTARGET': {
                                if(!usable) continue;

                                let [to, amount] = parameters.split(' ', 2);

                                when.defined(() => STREAMER)
                                    .then(() => {
                                        for(let callback of STREAMER.__eventlisteners__.onhost)
                                            when(() => PAGE_IS_READY, 250).then(() => callback({ hosting: to.unlike('-') }));
                                    });
                            } break;

                            // Got a message...
                            case 'PRIVMSG': {
                                // REMARK('PRIVMSG:', { command, parameters, source, tags });

                                // Bot commands...
                                if(defined(command.botCommand)) {
                                    let results = { name: command.botCommand, arguments: command.botCommandParams };

                                    for(let [name, callback] of Chat.__oncommand__)
                                        when(() => PAGE_IS_READY, 250).then(() => callback(results));

                                    for(let [name, callback] of Chat.__deferredEvents__.__oncommand__)
                                        when.defined.pipe(async(callback, results) => await results?.element, 250, callback, results).then(([callback, results]) => callback(results));

                                    continue;
                                }

                                let author = source.nick,
                                    badges = Object.keys(tags?.badges ?? {}),
                                    message = parameters.replace(/^([\u0001-\u0007\u000e-\u001f])((?:\w+)\s*)([^]+)\1$/g, '$3').trim(),
                                    // Have to wait on the page to play catch-up...
                                    element = when.defined((message, uuid) =>
                                        $.all('[data-test-selector$="message-container"i] [data-a-target$="message"i]')
                                            .find(div =>
                                                $.all(`[data-a-user="${ author }"i]`, div)
                                                    .map(div => div.closest('[data-test-selector$="message"i], [data-a-target$="message"i]'))
                                                    .filter(defined)
                                                    .find(div => {
                                                        let text = [],
                                                            body = $('[data-test-selector$="message-body"i], [class*="message-container"i]', div);

                                                        if(nullish(body))
                                                            return;

                                                        for(let child of $.all('[class*="username"i][class*="container"i] ~ :last-child > *', body))
                                                            if(child.dataset.testSelector?.contains('emote')) {
                                                                text.push($('img', child).alt);
                                                            } else if(child.dataset.aTarget?.contains('timestamp')) {
                                                                continue;
                                                            } else if($.defined('var', child)) {
                                                                let { textContent } = child;

                                                                for(let v of $.all('var', child))
                                                                    textContent = textContent.replace(v.textContent, '');

                                                                child.textContent = textContent;
                                                            } else {
                                                                text.push(child.textContent);
                                                            }

                                                        let match = text.join('').mutilate(true).equals(message.mutilate(true));

                                                        if(match)
                                                            div.dataset.uuid = uuid;

                                                        return match
                                                    })
                                            )
                                        , 100, message, tags.id),
                                    emotes = Object.keys(tags.emotes ?? {}).map(key => {
                                        let emote = (tags.emotes[+key] || tags.emotes[key]).shift(),
                                            name = parameters.substring(+emote.startPosition, ++emote.endPosition),
                                            url = `https://static-cdn.jtvnw.net/emoticons/v2/${ key }/default/${ THEME }/1.0`;

                                        Chat.__allemotes__.set(name, url);

                                        return name;
                                    }),
                                    handle = tags.display_name,
                                    mentions = parameters.split(/(@\S+)/).filter(s => s.startsWith('@')).map(s => s.slice(1).toLowerCase()),
                                    raw = [(handle.unlike(author)? `${ handle } (${ author })`: handle), message].join(': '),
                                    reply = when.defined(e => e, 100, element).then(element => element?.querySelector('[class*="reply"i] button')),
                                    style = `color: ${ tags.color || '#9147FF' };`,
                                    uuid = tags.id,
                                    sent = (new Date).toJSON();

                                let results = {
                                    raw,
                                    sent,
                                    uuid,
                                    reply,
                                    style,
                                    author,
                                    emotes,
                                    badges,
                                    handle,
                                    usable,
                                    element,
                                    message,
                                    mentions,
                                    timestamp: new Date,
                                    highlighted: when.defined(e => e, 100, element).then(element => parseBool(element.dataset.testSelector?.contains('notice'))),
                                };

                                Object.defineProperties(results, {
                                    deleted: {
                                        get:(async function() {
                                            return nullish((await this)?.parentElement) || $.defined('[data-a-target*="delete"i]:not([class*="spam-filter"i], [repetitive], [plagiarism])', (await this));
                                        }).bind(element)
                                    },
                                });

                                Chat.__allmessages__.set(uuid, results);

                                for(let [name, callback] of Chat.__onmessage__)
                                    when(() => PAGE_IS_READY, 250).then(() => callback(results));

                                for(let [name, callback] of Chat.__deferredEvents__.__onmessage__)
                                    when.defined.pipe(async(callback, results) => await results?.element, 250, callback, results).then(([callback, results]) => callback(results));
                            } break;

                            // Got a whisper
                            case 'WHISPER': {
                                let results = { unread: 1, from: channel, message: parameters, timestamp: new Date };

                                for(let [name, callback] of Chat.__onwhisper__)
                                    when(() => PAGE_IS_READY, 250).then(() => callback(results));

                                for(let [name, callback] of Chat.__deferredEvents__.__onwhisper__)
                                    when.defined.pipe(async(callback, results) => await results?.element, 250, callback, results).then(([callback, results]) => callback(results));
                            } break;

                            default: continue;
                        };
                    }
                };
            };

            socket.onerror = event => {
                WARN(`Chat Relay (main) failed to connect to "${ CHANNEL }" → ${ JSON.stringify(event) }`);

                socket = (TTV_IRC.socket = new WebSocket(TTV_IRC.wsURL));
                START_WS(event);
            };

            socket.onclose = event => {
                WARN(`Chat Relay (main) closed unexpectedly → ${ JSON.stringify(event) }`);

                socket = (TTV_IRC.socket = new WebSocket(TTV_IRC.wsURL));
                START_WS(event);
            };

            // The socket closed...
            when(() => TTV_IRC.socket?.readyState === WebSocket.CLOSED, 1000)
                .then(closed => {
                    WARN(`The WebSocket closed... Restarting in 5s...`);

                    wait(5000)
                        .then(() => {
                            if(parseBool(Settings.recover_chat))
                                return ReloadPage(true);
                            return TTV_IRC.socket = new WebSocket(TTV_IRC.wsURL_chat);
                        })
                        .then(() => {
                            when(() => TTV_IRC.socket.readyState === WebSocket.OPEN, 500)
                                .then(() => TTV_IRC.socket.send(`JOIN ${ CHANNEL }`))
                                .then(() => TTV_IRC.socket.onmessage = TTV_IRC.socket.reflect = CHAT_SELF_REFLECTOR);
                        });
                });

            // Play catch-up...
            when.defined(() => $('[data-test-selector$="message-container"i]'), 100)
                .then(chat => {
                    let unhandled = $.all('[data-a-target="chat-line-message"i]:not([data-uuid])', chat);

                    for(let element of unhandled) {
                        let raw = $('[class*="message"i][class*="container"i]', element).textContent.trim().replace($('[data-a-target="chat-timestamp"]', element)?.textContent || '', ''),
                            uuid = UUID.from(raw).toString(),
                            reply = $('[class*="reply"i] button', element),
                            style = $('[data-a-user]', element)?.getAttribute('style')?.trim(),
                            author = $('[data-a-user]', element).dataset.aUser,
                            emotes = new Set,
                            badges = new Set,
                            __bs__ = $.all('[class*="username"i][class*="container"i] [data-a-target*="badge"i] img', element).map(e => badges.add(e.alt.toLowerCase())),
                            handle = $('[data-a-user]', element).textContent,
                            usable = false,
                            message = $.all('[class*="message"i][class*="body"i] *', element).map(e => {
                                if(e.dataset.testSelector?.contains('emote')) {
                                    let i = $('img', e);

                                    emotes.add(i.alt);
                                    Chat.__allemotes__.set(i.alt, i.src);

                                    return i.alt;
                                } else if(e.dataset.aTarget?.contains('timestamp')) {
                                    return '';
                                }

                                return e.textContent?.trim?.() || '';
                            }).join(' ').trim(),
                            mentions = $.all('[data-a-target*="mention"i]', element).map(e => e.textContent),
                            highlighted = parseBool(element.dataset.testSelector?.contains('notice'));

                        element.dataset.uuid = uuid;

                        emotes = [...emotes];
                        badges = [...badges];

                        let results = {
                            raw,
                            uuid,
                            reply,
                            style,
                            author,
                            emotes,
                            badges,
                            handle,
                            usable,
                            element,
                            message,
                            mentions,
                            highlighted,
                        };

                        Object.defineProperties(results, {
                            deleted: {
                                get:(function() {
                                    return nullish(this?.parentElement) || $.defined('[data-a-target*="delete"i]:not([class*="spam-filter"i], [repetitive], [plagiarism])', this);
                                }).bind(element)
                            },
                        });

                        Chat.__allmessages__.set(uuid, results);

                        for(let [name, callback] of Chat.__onmessage__)
                            when(() => PAGE_IS_READY, 250).then(() => callback(results));

                        for(let [name, callback] of Chat.__deferredEvents__.__onmessage__)
                            when.defined.pipe(async(callback, results) => await results?.element, 250, callback, results).then(([callback, results]) => callback(results));
                    }
                });
        }
    };
}
