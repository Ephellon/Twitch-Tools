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

/** @file Defines the page-specific logic for the extension. Used for all {@link # twitch.tv/*} sites.
 * <style>[pill]{font-weight:bold;white-space:nowrap;border-radius:1rem;padding:.25rem .75rem}[good]{background:#e8f0fe;color:#174ea6}[bad]{background:#fce8e6;color:#9f0e0e;}</style>
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

window.IS_A_FRAMED_CONTAINER = (top != window);

let Queue = top.Queue = { balloons: [], bullets: [], bttv_emotes: [], emotes: [], messages: [], message_popups: [], popups: [] },
    Messages = top.Messages = new Map(),
    PostOffice = top.PostOffice = new Map(),
    UserMenuToggleButton, SignUpBanner,
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
    JUMP_DATA = {},
    STASH_SAVED = false,
    UP_NEXT_ALLOW_THIS_TAB;

top.WINDOW_STATE = document.readyState;
top.TWITCH_INTEGRITY_FAIL = false;

document.onreadystatechange = event => top.WINDOW_STATE = document.readyState;

// Populate the username field by quickly showing the menu
when.defined(() => {
    SignUpBanner ??= $('[data-test-target*="upsell"i][data-test-target*="banner"i]');
    return UserMenuToggleButton ??= $('[data-a-target="user-menu-toggle"i]');
})
    .then(() => {
        // User is logged in. A username is available
        if(nullish(SignUpBanner)) {
            UserMenuToggleButton.click();
            ACTIVITY = window.ACTIVITY = $('[data-a-target="presence-text"i]')?.textContent ?? '';
            USERNAME = window.USERNAME = $('[data-a-target="user-display-name"i]')?.textContent ?? `User_Not_Logged_In_${ +new Date }`;
            THEME = window.THEME = [...$('html').classList].find(c => /theme-(\w+)/i.test(c)).replace(/[^]*theme-(\w+)/i, '$1').toLowerCase();
            ANTITHEME = window.ANTITHEME = ['light', 'dark'].filter(theme => theme != THEME).pop();

            $('[data-a-target^="language"i]')?.click();
            LITERATURE = window.LITERATURE = $('[data-language] svg')?.closest('button')?.dataset?.language ?? '';
            UserMenuToggleButton.click();
        } else {
            ACTIVITY = window.ACTIVITY = '';
            USERNAME = window.USERNAME = `User_Not_Logged_In_${ +new Date }`;
            THEME = window.THEME = [...$('html').classList].find(c => /theme-(\w+)/i.test(c)).replace(/[^]*theme-(\w+)/i, '$1').toLowerCase();
            ANTITHEME = window.ANTITHEME = ['light', 'dark'].filter(theme => theme != THEME).pop();
        }

        Runtime.sendMessage({ action: 'POST_SHARED_DATA', data: { USERNAME, THEME, ANTITHEME, ACTIVITY } });
    });

top.onpagehide = ({ persisted }) => {
    top.WINDOW_STATE = (persisted? document.readyState: 'unloading');
};

// Twitch-wide errors
when(() => top.TWITCH_INTEGRITY_FAIL, 5_000).then(() => {
    let error = `<div hidden controller title="Twitch Integrity Fail" okay="OK" deny="OK. Do not show again">${ (new Date).toJSON() }</div>
    Unable to perform some Twitch-wide actions right now.

    <br><br>

    This issue typically resolves itself within 48 hours.

    <br><br>

    <strong>Do not</strong> log out. You <strong>will not</strong> be able to log back in.

    <br><br>

    It is <strong>not</strong> recommended you follow the <a href="//help.twitch.tv/s/article/supported-browsers#troubleshooting" target=_blank>troubleshooting steps</a> but, you are free to do so if you wish.
    `;

    Cache.load('PREVENT_POPUPS', ({ PREVENT_POPUPS = {} }) => {
        if(!parseBool(PREVENT_POPUPS?.integrity_fail))
            confirm.silent(error).then(continueDisplaying => {
                if(continueDisplaying === false)
                    Cache.save({ PREVENT_POPUPS: { ...PREVENT_POPUPS, integrity_fail: true } });
            });
        else
            alert.timed(error, 5_000, true);
    });
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

;

// Displays a balloon (popup)
    // new Balloon({ title:string, icon:string? }, ...jobs:object<{ href:string<URL>, message:string?, src:string?, time:string<Date>, onremove:function? }>) → object
    // Balloon.prototype.add(...jobs:object<{ href:string<URL>, message:string?, src:string?, time:string<Date>, onremove:function? }>) → Element
    // Balloon.prototype.addButton({ left:boolean?, icon:string?<Glyphs>, onclick:function?, attributes:object? }) → Element
    // Balloon.prototype.remove() → undefined
class Balloon {
    static #BALLOONS = new Map;

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

                                        balloon.modStyle(`display:${ display }!important; z-index:9; left: -15rem`);
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

                                                    if(nullish(counter) || nullish(output) || nullish(length))
                                                        return;

                                                    output.textContent = length;

                                                    if(length > 0) {
                                                        counter.modStyle(`visibility:unset; font-size:75%`);
                                                    } else {
                                                        counter.modStyle(`visibility:hidden`);
                                                    }
                                                }, 1000),
                                            })
                                        )
                                    )
                                )
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
                                f('.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-c-text-base.tt-elevation-1.tt-flex.tt-flex-shrink-0.tt-pd-x-1.tt-pd-y-05.tt-popover-header', { style: `background-color:#${ THEME.equals('dark')? '000': 'fff' }e; position:sticky; top:0; z-index:99999;` },
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

                                                balloon.modStyle(`display:${ display }!important`);
                                                balloon.setAttribute('display', display);
                                            },
                                        }
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
                                                            f('.persistent-notification__delete.tt-absolute', { style: `top:0; right:2rem; z-index:var(--always-on-top)` },
                                                                f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                                                    f('button.tt-redo-btn.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__delete]',
                                                                        {
                                                                            'connected-to': `${ U }--${ guid }`,

                                                                            onclick: event => {
                                                                                let { currentTarget } = event,
                                                                                    connectedTo = currentTarget.getAttribute('connected-to');

                                                                                let element = $(`#tt-balloon-job-${ connectedTo }`),
                                                                                    thisJob = $('a', element),
                                                                                    redo = !parseBool(parseURL(thisJob.href).searchParameters?.redo),
                                                                                    url = parseURL(thisJob.href).addSearch({ redo });

                                                                                thisJob.setAttribute('new-href', url.href);
                                                                                ALL_FIRST_IN_LINE_JOBS.map((job, index) => {
                                                                                    if(parseURL(job).pathname.equals(url.pathname))
                                                                                        if(index)
                                                                                            Cache.save({ ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS.splice(index, 1, url.href) });
                                                                                        else
                                                                                            REDO_FIRST_IN_LINE_QUEUE(job, { redo });
                                                                                });
                                                                            },
                                                                        },
                                                                        f('span.tt-button-icon__icon').with(
                                                                            f('div',
                                                                                {
                                                                                    style: 'height:1.6rem; width:1.6rem',
                                                                                    innerHTML: Glyphs.refresh,
                                                                                }
                                                                            )
                                                                        )
                                                                    )
                                                                )
                                                            ).setTooltip(`Toggle channel repeat`, { from: 'bottom' }),
                                                            // Delete mini-button
                                                            f('.persistent-notification__delete.tt-absolute', { style: `top:0; right:0; z-index:var(--always-on-top)` },
                                                                f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                                                    f('button.tt-del-btn.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__delete]',
                                                                        {
                                                                            'connected-to': `${ U }--${ guid }`,

                                                                            onclick: event => {
                                                                                let { currentTarget } = event,
                                                                                    connectedTo = currentTarget.getAttribute('connected-to');

                                                                                let element = $(`#tt-balloon-job-${ connectedTo }`);

                                                                                if(defined(element))
                                                                                    onremove({
                                                                                        ...event,
                                                                                        uuid, guid, href, element,
                                                                                        canceled: true,

                                                                                        callback(element) {
                                                                                            clearInterval(+element.getAttribute('animationID'));
                                                                                            element.remove();
                                                                                        },
                                                                                    });
                                                                            },
                                                                        },
                                                                        f('span.tt-button-icon__icon').with(
                                                                            f('div',
                                                                                {
                                                                                    style: 'height:1.6rem; width:1.6rem',
                                                                                    innerHTML: Glyphs.x,
                                                                                }
                                                                            )
                                                                        )
                                                                    )
                                                                )
                                                            ).setTooltip(`Remove from queue`, { from: 'bottom' })
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
            }
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
                                    f('.persistent-notification__delete.tt-absolute', { style: `top:0; right:2rem; z-index:var(--always-on-top)` },
                                        f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                            f('button.tt-redo-btn.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__delete]',
                                                {
                                                    'connected-to': `${ uuid }--${ guid }`,

                                                    onclick: event => {
                                                        let { currentTarget } = event,
                                                            connectedTo = currentTarget.getAttribute('connected-to');

                                                        let element = $(`#tt-balloon-job-${ connectedTo }`),
                                                            thisJob = $('a', element),
                                                            redo = !parseBool(parseURL(thisJob.href).searchParameters?.redo),
                                                            url = parseURL(thisJob.href).addSearch({ redo });

                                                        thisJob.setAttribute('new-href', url.href);
                                                        ALL_FIRST_IN_LINE_JOBS.map((job, index) => {
                                                            if(parseURL(job).pathname.equals(url.pathname))
                                                                if(index)
                                                                    Cache.save({ ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS.splice(index, 1, url.href) });
                                                                else
                                                                    REDO_FIRST_IN_LINE_QUEUE(job, { redo });
                                                        });
                                                    },
                                                },
                                                f('span.tt-button-icon__icon').with(
                                                    f('div',
                                                        {
                                                            style: 'height:1.6rem; width:1.6rem',
                                                            innerHTML: Glyphs.refresh,
                                                        }
                                                    )
                                                )
                                            )
                                        )
                                    ).setTooltip(`Toggle channel repeat`, { from: 'bottom' }),
                                    // Remove mini-button
                                    f('.persistent-notification__delete.tt-absolute', { style: `top:0; right:0; z-index:var(--always-on-top)` },
                                        f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                            f('button.tt-del-btn.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__delete]',
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
                                                        }
                                                    )
                                                )
                                            )
                                        )
                                    ).setTooltip(`Remove from queue`, { from: 'bottom' })
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
                    ...options,

                    style: `background-color: #387aff; left: 50%; margin-bottom: 5rem!important; transform: translateX(-50%); width: fit-content;`,
                },

                f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-core-button.tt-core-button--overlay.tt-core-button--text.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative', { style: 'padding: 0.5rem 1rem;' },
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
        let iconElement = f('img.emote-card__big-emote.tt-image[@testSelector=big-emote]', { ...icon }).setTooltip(icon.alt);

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
                    )
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
                            )
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
    static #RootCloseOnComplete = when.defined(() => $('#root'))
        .then(root => root
            .addEventListener('mouseup', event => {
                let { path, button = -1 } = event,
                    menu = $('.tt-context-menu');

                if(defined(menu))
                    menu.remove();
            })
        );

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
    // new Search(ID:string|number?, type:string?, as:string?) → Promise<object>
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

    static anonID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

    static #cache = new Map;
    static cacheLeaseTime = 300_000 * (parseInt(Settings.low_data_mode) || 1);

    constructor(ID = null, type = 'channel', as = null) {
        let spadeEndpoint = `https://spade.twitch.tv/track`,
            twilightBuildID = '5fc26188-666b-4bf4-bdeb-19bd4a9e13a4';

        let pathname = location.pathname.slice(1),
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
                return fetchURL.fromDisk(`https://api.twitch.tv/helix/channels?broadcaster_id=${ ID }`, { headers: { "Authorization": Search.authorization, "Client-ID": Search.clientID }, hoursUntilEntryExpires: 168 })
                    .then(response => response.json())
                    .then(json => {
                        let id = parseInt(json?.data?.shift?.()?.broadcaster_id);

                        if(nullish(id))
                            throw `${ json.error }: ${ json.message }`;

                        return id;
                    });
            } break;

            /** Twitch Insights JSON
             * id: string<number~int>
             * displayName: string
             * createdAt: string<Date~ISO>
             * updatedAt: string<#empty|Date~ISO>
             * deletedAt: string<#empty|Date~ISO>
             * userType: string
             * broadcasterType: string
             * unavailableReason: string
             */
            case 'getID': {
                return fetchURL.fromDisk(`https://api.twitchinsights.net/v1/user/status/${ ID }`)
                    .then(response => response.json())
                    .then(json => {
                        let id = parseInt(json?.id);

                        if(nullish(id))
                            throw `[${ json.status }] An error occurred: ${ json.error }`;

                        return id;
                    })
                    .catch($warn);
            } break;

            case 'getName': {
                return fetchURL.fromDisk(`https://api.twitchinsights.net/v1/user/status/${ ID }`)
                    .then(response => response.json())
                    .then(json => {
                        let name = json?.displayName;

                        if(nullish(name))
                            throw `[${ json.status }] An error occurred: ${ json.error }`;

                        return name;
                    })
                    .catch($warn);
            } break;

            case 'status.live': {
                return fetchURL.idempotent(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${ ID.toLowerCase() }-80x45.jpg`, { as: 'native', hoursUntilEntryExpires: 1/12, keepDefectiveEntry: true })
                    .then(response => {
                        let { pathname, filename } = parseURL(response.url);

                        return !(/\/404_/.test(pathname) || !/\/previews-ttv\//i.test(pathname));
                    });
            } break;

            default: {
                let languages = `bg cs da de el en es es-mx fi fr hu it ja ko nl no pl ro ru sk sv th tr vi zh-cn zh-tw x-default`.split(' ');
                let name = channelName?.toLowerCase();

                if(nullish(name) || type.unlike('channel'))
                    break;

                if(SEARCH_CACHE.has(name))
                    return Promise.resolve(SEARCH_CACHE.get(name));

                searchResults = fetchURL.idempotent(`./${ name }`)
                    .then(response => response.text())
                    .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                    .then(async doc => {
                        let alt_languages = $.all('link[rel^="alt"i][hreflang]', doc).map(link => link.hreflang),
                            data = $('head>script[type^="application"i][type$="json"i]', doc)?.textContent;

                        try {
                            [data] = JSON.parse(data || `{"@graph":[]}`)['@graph'];
                        } catch(error) {
                            // Not an object...
                            try {
                                [data] = JSON.parse(data || `[{}]`);
                            } catch(error) {
                                // Not an array...
                                throw new Error(`Unable to perform a search for "${ name }": ${ JSON.stringify(data) }`);
                            }
                        }

                        let display_name = (data?.name ?? `${ channelName } - Twitch`).split('-').slice(0, -1).join('-').trim(),
                            [language] = languages.filter(lang => alt_languages.missing(lang)),
                            name = display_name?.trim()?.toLowerCase(),
                            profile_image = ($('meta[property$="image"i]', doc)?.content || Runtime.getURL('profile.png')),
                            live = parseBool(data?.publication?.isLiveBroadcast),
                            started_at = new Date(data?.publication?.startDate).toJSON(),
                            status = (data?.description ?? $('meta[name$="description"i]', doc)?.content),
                            updated_at = new Date(data?.publication?.endDate).toJSON(),
                            broadcaster_id;

                        try {
                            broadcaster_id = parseInt(await fetchURL.fromDisk(`https://api.twitchinsights.net/v1/user/status/${ name }`, { hoursUntilEntryExpires: 744 }).then(r => r.json()).then(j => j.id)) | 0;
                        } catch(error) {
                            // Do nothing...
                        }

                        let json = { display_name, broadcaster_id, language, live, name, profile_image, started_at, status, updated_at, href: `https://www.twitch.tv/${ display_name }` };

                        Search.parseType = 'pure';

                        let channelData = await Search.convertResults({ async json() { return json } });

                        SEARCH_CACHE.set(display_name.toLowerCase(), channelData);
                        ALL_CHANNELS = [...ALL_CHANNELS, channelData].filter(defined).filter(uniqueChannels);

                        // Pre-reads the stream if converted into a proper `Response`
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
                        $warn(error);

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
        let pathname = location.pathname.slice(1),
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
                    $warn(error);
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
            broadcaster_id:     'sole',
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

function Chat(message = '', ...mentions) {
    if(!message.length)
        return Chat.get();

    let finalMsg = [message.trim()];
    for(let mention of [mentions].flat())
        finalMsg.push(mention.replace(/^(?!@)/, '@'));

    return Chat.send(finalMsg.join(' '));
}

Object.defineProperties(Chat, {
    element: { get() { return $('[data-test-selector$="message-container"i]').closest('section') } },

    badges: { get() { return JUMP_DATA?.[STREAMER.name.toLowerCase()]?.stream?.badges }, },

    gang: { value: [] },
    mods: { value: [] },
    vips: { value: [] },

    get: {
        // Create an array of the current chat
            // Chat.get(mostRecent:number?, keepEmotes:boolean?) → [...object<{ style<string{ CSS }>, author<string>, emotes<array{ string }>, message<string>, mentions<array{ string }>, element?<Element>, uuid<string>, reply?<Element>, deleted?<boolean>, highlighted?<boolean> }>]
        value:
        function get(mostRecent = 250, keepEmotes = true) {
            let results = [];

            for(let [uuid, object] of [...Chat.__allmessages__].slice(-mostRecent)) {
                let { message, emotes } = object;

                if(!keepEmotes)
                    for(let emote of emotes)
                        message = message.replaceAll(emote, '');

                let O = Object.assign({}, object, { message });

                Object.defineProperties(O, {
                    deleted: {
                        get:(async function() {
                            return Promise.race([this, wait(100).then(() => null)]).then(self => {
                                return (self === null) || nullish(self?.parentElement) || $.defined('[data-a-target*="delete"i]:not([class*="spam-filter"i], [data-repetitive], [data-plagiarism])', self);
                            });
                        }).bind(object.element)
                    },
                });

                results.push(O);
            }

            return results;
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
            if(typeof to != 'string' || to.length < 1 || typeof message != 'string' || message.length < 1)
                return;

            when(() => TTV_IRC.socket.readyState === WebSocket.OPEN)
                .then(ready => {
                    TTV_IRC.socket.send(`@reply-parent-msg-id=${ to } PRIVMSG #${ STREAMER.name.toLowerCase() } :${ message }`);
                });
        }
    },

    // Deferred listener for new chat messages
    defer: {
        value: {
            set onmessage(callback) {
                let name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__deferredEvents__.__onmessage__.has(name))
                    return Chat.__deferredEvents__.__onmessage__.get(name);

                // $remark('Adding deferred [on new message] event listener', { [name]: callback });

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

                // $remark('Adding deferred [on new pinned] event listener', { [name]: callback });

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

                // $remark('Adding deferred [on new whisper] event listener', { [name]: callback });

                return Chat.__deferredEvents__.__onwhisper__.set(name, callback);
            },

            get onwhisper() {
                return Chat.__deferredEvents__.__onwhisper__.size;
            },

            set onbullet(callback) {
                let name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__deferredEvents__.__onbullet__.has(name))
                    return Chat.__onbullet__.get(name);

                // $remark('Adding deferred [on new newbullet] event listener', { [name]: callback });

                return Chat.__deferredEvents__.__onbullet__.set(name, callback);
            },

            get onbullet() {
                return Chat.__deferredEvents__.__onbullet__.size;
            },

            set oncommand(callback) {
                let name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__deferredEvents__.__oncommand__.has(name))
                    return Chat.__oncommand__.get(name);

                // $remark('Adding deferred [on new command] event listener', { [name]: callback });

                return Chat.__deferredEvents__.__oncommand__.set(name, callback);
            },

            get oncommand() {
                return Chat.__deferredEvents__.__oncommand__.size;
            },
        },
    },
    __deferredEvents__: { value: { __onmessage__: new Map, __onpinned__: new Map, __onwhisper__: new Map, __onbullet__: new Map, __oncommand__: new Map } },

    // Single-use events... Requires the callback (promise) to return a boolean: true = ok to consume (delete) event; false = not ok
    consume: {
        value: {
            set onmessage(callback) {
                let name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__consumableEvents__.__onmessage__.has(name))
                    return Chat.__consumableEvents__.__onmessage__.get(name);

                // $remark('Adding consumable [on new message] event listener', { [name]: callback });

                Chat.__consumableEvents__.__onmessage__.set(name, callback);

                return callback;
            },

            get onmessage() {
                return Chat.__consumableEvents__.__onmessage__.size;
            },

            set onpinned(callback) {
                let name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__consumableEvents__.__onpinned__.has(name))
                    return Chat.__consumableEvents__.__onpinned__.get(name);

                // $remark('Adding consumable [on new pinned] event listener', { [name]: callback });

                Chat.__consumableEvents__.__onpinned__.set(name, callback);

                return callback;
            },

            get onpinned() {
                return Chat.__consumableEvents__.__onpinned__.size;
            },

            set onwhisper(callback) {
                let name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__consumableEvents__.__onwhisper__.has(name))
                    return Chat.__onwhisper__.get(name);

                // $remark('Adding consumable [on new whisper] event listener', { [name]: callback });

                return Chat.__consumableEvents__.__onwhisper__.set(name, callback);
            },

            get onwhisper() {
                return Chat.__consumableEvents__.__onwhisper__.size;
            },

            set onbullet(callback) {
                let name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__consumableEvents__.__onbullet__.has(name))
                    return Chat.__onbullet__.get(name);

                // $remark('Adding consumable [on new newbullet] event listener', { [name]: callback });

                return Chat.__consumableEvents__.__onbullet__.set(name, callback);
            },

            get onbullet() {
                return Chat.__consumableEvents__.__onbullet__.size;
            },

            set oncommand(callback) {
                let name = callback.name || UUID.from(callback.toString()).value;

                if(Chat.__consumableEvents__.__oncommand__.has(name))
                    return Chat.__oncommand__.get(name);

                // $remark('Adding consumable [on new command] event listener', { [name]: callback });

                return Chat.__consumableEvents__.__oncommand__.set(name, callback);
            },

            get oncommand() {
                return Chat.__consumableEvents__.__oncommand__.size;
            },
        },
    },
    __consumableEvents__: { value: { __onmessage__: new Map, __onpinned__: new Map, __onwhisper__: new Map, __onbullet__: new Map, __oncommand__: new Map } },

    // Regular events...
    onmessage: {
        set(callback) {
            let name = callback.name || UUID.from(callback.toString()).value;

            if(Chat.__onmessage__.has(name))
                return Chat.__onmessage__.get(name);

            // $remark('Adding [on new message] event listener', { [name]: callback });

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

            // $remark('Adding [on new pinned] event listener', { [name]: callback });

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

            // $remark('Adding [on new whisper] event listener', { [name]: callback });

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

            // $remark('Adding [on new bullet] event listener', { [name]: callback });

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

            // $remark('Adding [on new command] event listener', { [name]: callback });

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
    const lock = { configurable: false, enumerable: true, writable: false };

    let { videoHeight } = $('[data-a-target="video-player"i] video') ?? ({ videoHeight: $('[class*="player"i][class*="controls"i]')?.getElementByText(/\d+p/i)?.textContent });
    if((parseInt(videoHeight) | 0) > 0) {
        let value = parseInt(videoHeight),
            quality = new String(`${ value }p`);

        Object.defineProperties(quality, {
            auto:   { value: true, ...lock },
            high:   { value: (value > 720), ...lock },
            mid:    { value: (value < 721 && value > 360), ...lock },
            low:    { value: (value < 361), ...lock },
            source: { value: quality.toLowerCase().contains('source'), ...lock },
        });

        return quality;
    }

    let buttons = {
        get settings() {
            return $('[data-a-target*="player"i][data-a-target*="button"i]:is([data-a-target*="option"i], [data-a-target*="setting"i])');
        },

        get quality() {
            return $('[data-a-target*="player"i][data-a-target*="item"i]:is([data-a-target*="option"i], [data-a-target*="setting"i])');
        },

        get options() {
            return $.all('[data-a-target*="player"i][data-a-target*="item"i]');
        },
    };

    buttons.settings?.click();

    await when.defined(() => buttons.settings)
        .then(async() => {
            await when.defined(() => buttons.quality)
                .then(button => button.click());
        })
        .catch($error);

    let qualities = $.all('[data-a-target*="quality"i]:is([data-a-target*="option"i], [data-a-target*="setting"i]) input[type="radio"i]')
        .map(input => ({ input, label: input.parentElement.querySelector(`label[for="${ input.id }"]`), uuid: input.id }));

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
        auto:   { value: auto, ...lock },
        high:   { value: high, ...lock },
        low:    { value: low, ...lock },
        source: { value: source, ...lock },
    });

    buttons.settings?.click();

    return quality;
}

// Change the video quality
    // SetQuality(quality:string?, backup:string?) → Object<{ oldValue:object<{ input:Element, label:Element }>, newValue:object<{ input:Element, label:Element }> }>
async function SetQuality(quality = 'auto', backup = 'source') {
    let buttons = {
        get settings() {
            return $('[data-a-target*="player"i][data-a-target*="button"i]:is([data-a-target*="option"i], [data-a-target*="setting"i])');
        },

        get quality() {
            return $('[data-a-target*="player"i][data-a-target*="item"i]:is([data-a-target*="option"i], [data-a-target*="setting"i])');
        },

        get options() {
            return $.all('[data-a-target*="player"i][data-a-target*="item"i]');
        },
    };

    buttons.settings?.click();

    await when.defined(() => buttons.settings)
        .then(async() => {
            await when.defined(() => buttons.quality)
                .then(button => button.click());
        })
        .catch($error);

    let qualities = $.all('[data-a-target*="quality"i]:is([data-a-target*="option"i], [data-a-target*="setting"i]) input[type="radio"i]')
        .map(input => ({ input, label: input.parentElement.querySelector(`label[for="${ input.id }"]`), uuid: input.id }));

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
    else if(defined(current?.input?.checked) && defined(desired?.input?.checked))
        /* The desired quality is available */
        desired.input.checked = !(current.input.checked = !1);

    desired?.input?.click?.();
    buttons.settings?.click();

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

            // $remark('Adding [on change] event listener', { [name]: callback });

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
        slider = $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls + * [style]');

    volume = parseFloat(volume?.toFixed?.(2) || 1);

    if(defined(video))
        video.volume = volume;

    if(defined(thumb))
        thumb.value = volume;

    if(defined(slider))
        slider.modStyle(`width: ${ 100 * volume }%`);
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
                off: `[data-test-selector*="video-container"i]:not([class*="theatre"i]) button[data-a-target*="theatre-mode"i], [tt-svg-label="theatre-mode-off"i]`,
                on: `[data-test-selector*="video-container"i][class*="theatre"i] button[data-a-target*="theatre-mode"i], [tt-svg-label="theatre-mode-on"i]`,
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

    for(let button of buttons) {
        button = $(button);

        if(nullish(button))
            continue;
        button.closest('button')?.click();
    }
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

    await top.beforeleaving?.(new CustomEvent('locationchange', { from: location.pathname, to: location.pathname, persisted: document.readyState.unlike('unloading') }));

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
let PATHNAME = top.location.pathname,
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

// Yes, I could make this fail go away... or I can use it to force once-a-page events...
// The following will only execute in the top frame, once
try {
    // Add onlocationchange containers
    Object.defineProperties(top, {
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
                                    removeFromSearch(['mini']);

                                    $('#tt-exit-pip')?.remove();
                                    $('[class*="picture-by-picture-player"i] iframe[src*="player.twitch.tv"i]')?.remove();
                                    $('[data-test-selector="picture-by-picture-player-container"i]')?.classList?.add('picture-by-picture-player--collapsed');
                                });
                            },

                            innerHTML: Glyphs.modify('exit_picture_in_picture', { height: 15, width: 20, fill: 'currentcolor', style: 'vertical-align:middle' }),
                        })
                    ));

                function keepOpen() {
                    when.defined(() => $('.picture-by-picture-player[class*="collapsed"i]'))
                        .then(player => {
                            let keep = $.defined('#tt-exit-pip');

                            if(keep)
                                player.classList.remove('picture-by-picture-player--collapsed');

                            return keep;
                        })
                        .then(keep => (keep? keepOpen(): null));
                }
                keepOpen();

                addToSearch({ mini: name });
            },
        },
    });

    // Automatic garbage collection...
    $remark(`Removing expired cache data...`, new Date);

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
                    $warn(`\tThe last fetch for "${ key }" was ${ toTimeString(lastFetch) } ago. Marking as "expired"`);

                    Cache.remove(key);
                }
            });

        // delete cache;
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
                    $warn(`Disabling experimental feature: ${ name }`, new Date);
                else
                    $remark(`Disabling feature: ${ name }`, new Date);

                UnregisterJob(key, 'disable');
            } else if(newValue === true) {
                if(!!~EXPERIMENTAL_FEATURES.findIndex(feature => feature.test(key)))
                    $warn(`Enabling experimental feature: ${ name }`, new Date);
                else
                    $remark(`Enabling feature: ${ name }`, new Date);

                RegisterJob(key, 'enable');
            } else {
                if(!!~EXPERIMENTAL_FEATURES.findIndex(feature => feature.test(key)))
                    $warn(`Modifying experimental feature: ${ name }`, { oldValue, newValue }, new Date);
                else
                    $remark(`Modifying feature: ${ name }`, { oldValue, newValue }, new Date);

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
    $remark(`Listening for jumped frame data...`);

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
                        // $log('Jumped frames, retrieved:', JUMP_DATA);
                    }
                }
            } break;

            case 'raid': {
                let { from, to, events, payable } = data,
                    method = Settings.prevent_raiding ?? "none";

                if(false
                    || (!UP_NEXT_ALLOW_THIS_TAB)
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

                                    Handlers.first_in_line({ href, innerText: `${ name } is live [Greedy Raiding]` }, 'start');
                                }

                                goto(parseURL(`./${ from }`).addSearch({ tool: `raid-stopper--${ method }` }).href);
                            } else {
                                // The user clicked "Cancel"
                                $log('Canceled Greedy Raiding event', { from, to });
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
    $remark(`Adding context menus...`);

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
            let [tail = 'png', ...name] = parseURL(src).filename?.split('.')?.reverse() ?? [];
            name = (name ?? [image.alt]).join('.');
            tail = /^(bmp|[gt]if+|ico|p?j(fif|p(e?g)?)|a?png|svg|webp)$/i.test(tail)? tail: 'jpeg';

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
                    SetQuality().then(() => {
                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', altKey: true }));

                        wait(VideoClips.length).then(() => phantomClick($(`.tt-prompt-footer button.okay`, $(`input[controller][anchor="${ $('video[uuid]').uuid }"i]`)?.closest('.tt-prompt-container'))));
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
                                $log('Saving scripts...', script.src, (100 * (JS_index / JS_length)).suffix('%', 2), (js.length).suffix('B', 2, 'data'));

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
                                $log('Saving styles...', style.href, (100 * (CSS_index / CSS_length)).suffix('%', 2), (css.length).suffix('B', 2, 'data'));

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
    // $remark("Moving to chat child frame...");
    if(!parseBool(parseURL(location).searchParameters?.hidden))
        $warn(error);
}

async function update() {
    // The location
    window.PATHNAME = PATHNAME = window.location.pathname;

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
                    name: ($('img', element)?.alt ?? parseURL(element.href).pathname.slice(1)),
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
                    name: ($('img', element)?.alt ?? parseURL(element.href).pathname.slice(1)),
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
                    name: ($('img', element)?.alt ?? parseURL(element.href).pathname.slice(1)),
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
    FIRST_IN_LINE_HREF = '#',           // The upcoming HREF
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
        $log =
        $warn =
        $error =
        $remark =
        $notice =
        $ignore = ($=>$);

    if(!parseBool(Settings.display_in_console__log))
        $log = ($=>$);

    if(!parseBool(Settings.display_in_console__warn))
        $warn = ($=>$);

    if(!parseBool(Settings.display_in_console__error))
        $error = ($=>$);

    if(!parseBool(Settings.display_in_console__remark))
        $remark = ($=>$);

    if(!parseBool(Settings.display_in_console__notice))
        $notice = ($=>$);

    if(!parseBool(Settings.display_in_console__ignore))
        $ignore = ($=>$);

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
                $warn(`"${ name.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['',' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, '- ') }" took ${ (span / 1000).suffix('s', 2).replace(/\.0+/, '') } to complete (max time allowed is ${ (max / 1000).suffix('s', 2).replace(/\.0+/, '') }). Offense time: ${ new Date }. Offending site: ${ location.pathname }`)
                    .toNativeStack();
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

        $warn(`Currently viewing ${ $1 } in "${ $2 }" mode. Several features will be disabled:`, normalized);
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

    top.GetNextStreamer =
    // Gets the next available channel (streamer)
        // GetNextStreamer(except:string?) → Object<Channel>
    function GetNextStreamer(except = '') {
        if(defined(GetNextStreamer.pinnedStreamer) && ((ALL_FIRST_IN_LINE_JOBS?.length | 0) < 1) && !STREAMER?.live) {
            Cache.remove(['PinnedStreamer']);

            return ({
                from: 'GET_NEXT_STREAMER__PINNED',
                href: `/${ GetNextStreamer.pinnedStreamer }`,
                name: GetNextStreamer.pinnedStreamer,
            });
        }

        // Next channel in "Up Next"
        if(ALL_FIRST_IN_LINE_JOBS?.length && !parseBool(Settings.first_in_line_none))
            return GetNextStreamer.cachedStreamer = (null
                ?? ALL_CHANNELS.find(channel => channel?.name?.unlike(except) && parseURL(channel?.href)?.pathname?.equals(parseURL(ALL_FIRST_IN_LINE_JOBS[0]).pathname))
                ?? {
                    from: 'GET_NEXT_STREAMER',
                    href: parseURL(ALL_FIRST_IN_LINE_JOBS[0]).href,
                    name: parseURL(ALL_FIRST_IN_LINE_JOBS[0]).pathname.slice(1).split('/').shift(),
                }
            );

        if(parseBool(Settings.stay_live) && defined(GetNextStreamer.cachedStreamer))
            return GetNextStreamer.cachedStreamer;

        Cache.load('ChannelPoints', ({ ChannelPoints = {} }) => {
            let { random, round } = Math;
            let online = [...STREAMERS, ...(GetNextStreamer.cachedReminders ??= [])].filter(isLive),
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

            let [randomChannel] = online.shuffle();

            filtering:
            for(let channel in ChannelPoints) {
                let [streamer] = online.filter(({ name }) => name.equals(channel));

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
                    GetNextStreamer.cachedStreamer = online.find(channel => channel.name.equals(mostWatched));
                } break;

                // Least watched channel (least channel points)
                case 'poor': {
                    GetNextStreamer.cachedStreamer = online.find(channel => channel.name.equals(leastWatched));
                } break;

                // Most un-earned Rewards & Challenges
                case 'furthest': {
                    GetNextStreamer.cachedStreamer = online.find(channel => channel.name.equals(furthestFromCompletion));
                } break;

                // Least un-earned Rewards & Challenges
                case 'closest': {
                    GetNextStreamer.cachedStreamer = online.find(channel => channel.name.equals(closestToCompletion));
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

                $warn(`No channel fits the "${ preference }" criteria. Assuming a random channel ("${ name }") is desired:`, channel);
            }

            // @performance
            PrepareForGarbageCollection(ChannelPoints);
        });

        return when.defined(() => GetNextStreamer.cachedStreamer);
    };

    Cache.load('PinnedStreamer', ({ PinnedStreamer }) => {
        GetNextStreamer.pinnedStreamer = PinnedStreamer;
    });

    if(true
        // && UP_NEXT_ALLOW_THIS_TAB
        && (top === window)
    )
        try {
            Cache.load('LiveReminders', async({ LiveReminders }) => {
                try {
                    LiveReminders = JSON.parse(LiveReminders || '{}');
                } catch(error) {
                    // Probably an object already...
                    LiveReminders ??= {};
                }

                let cachedReminders = [...(GetNextStreamer.cachedReminders ??= [])];
                for(let name in LiveReminders) {
                    let now = new Date,
                        time = new Date(LiveReminders[name]);

                    cachedReminders.push({
                        name,

                        from: 'LIVE_REMINDERS',
                        href: `https://www.twitch.tv/${ name }`,
                        live: await new Search(name, 'channel', 'status.live'),
                    });
                }

                // @performance
                PrepareForGarbageCollection(LiveReminders);

                GetNextStreamer.cachedReminders = cachedReminders.isolate();
            });
        } catch(error) {
            // Do nothing...
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
                    name: ($('img', element)?.alt ?? parseURL(element.href).pathname.slice(1)),
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
                current = parseCoin($.last('[data-test-selector*="balance-string"i]')?.textContent),
                _e = exact?.suffix('', 1, 'natural')?.replace('.0',''),
                _c = current?.suffix('', 1, 'natural')?.replace('.0','');

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
                await fetchURL.fromDisk(`https://api.streamelements.com/kappa/v2/channels/${ channel.name }`, { mode: 'cors', hoursUntilEntryExpires: 168 })
                    .then(r => r?.json?.())
                    .then(json => json?._id)
                    .then(async id => {
                        let commands = {};

                        if(nullish(id))
                            return [];

                        for(let type of ['public', 'default'])
                            await fetchURL.fromDisk(`https://api.streamelements.com/kappa/v2/bot/commands/${ id }/${ type }`, { mode: 'cors', hoursUntilEntryExpires: 168 })
                                .then(r => r.json())
                                .then(json => commands[type] ??= json);

                        return [...commands.public, ...commands.default];
                    })
                    .then(commands => {
                        for(let metadata of commands) {
                            let { aliases, command, reply, accessLevel, enabled, count = 0, cooldown, cost } = metadata;

                            COMMANDS.push({ aliases: [...aliases, ...commands.filter(command => command.reply?.contains(command))], command, reply, availability: match(accessLevel), enabled, origin: 'StreamElements', variables: { count, coolDown: cooldown.global, cost } });
                        }
                    })
                    .catch($warn);

                // NightBot
                    // coolDown: 30
                    // count: 0
                    // createdAt: "2021-07-31T05:33:56.000Z"
                    // message: "hello my cute little pogchamp kyootbHeart"
                    // name: "hi"
                    // updatedAt: "2021-07-31T05:33:56.305Z"
                    // userLevel: "everyone"
                    // _id: "6104e0c44038915692edaeed"
                await fetchURL.fromDisk(`https://api.nightbot.tv/1/channels/t/${ channel.name }`, { mode: 'cors', hoursUntilEntryExpires: 168 })
                    .then(r => r?.json?.())
                    .then(json => json?.channel?._id)
                    .then(async id => {
                        let commands = [];

                        if(nullish(id))
                            return commands;

                        await fetchURL.fromDisk(`https://api.nightbot.tv/1/commands?nid=${ id }`, { mode: 'cors', headers: { 'nightbot-channel': id }, hoursUntilEntryExpires: 168 })
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
                    })
                    .catch($warn);

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
            let balance = $.last('[data-test-selector*="balance-string"i]');

            if(nullish(balance))
                return PostOffice.get('points_receipt_placement')?.coin_face;

            let container = balance?.closest('button'),
                icon = $.last('img[alt]', container);

            return icon?.src
        },

        get fiat() {
            let balance = $.last('[data-test-selector*="balance-string"i]');

            if(nullish(balance))
                return PostOffice.get('points_receipt_placement')?.coin_name;

            let container = balance?.closest('button'),
                icon = $.last('img[alt]', container);

            return icon?.alt ?? 'Channel Points'
        },

        get from() {
            return 'STREAMER'
        },

        get game() {
            let element = $.all('[data-a-target$="game-link"i], [data-a-target$="game-name"i]').pop(),
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
            return $(`[class*="channel-info"i] a[href$="${ NORMALIZED_PATHNAME }"i]${ ['', ' h1'][+NORMAL_MODE] }`)?.textContent ?? LIVE_CACHE.get('name') ?? top.location.pathname.slice(1).split('/').shift()
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
                // epoch → when channel points were first introduced
                    // https://blog.twitch.tv/en/2019/12/16/channel-points-an-easy-way-to-engage-with-your-audience/
                start = +new Date(STREAMER.data.firstSeen),
                now = +new Date;

            start = epoch.max(start || epoch);

            let intervals = (((STREAMER.data?.dailyBroadcastTime ?? 16_200_000) / 900_000) * (((now - start) / 86_400_000) * ((STREAMER.data?.activeDaysPerWeek ?? 5) / 7))), // How long the channel has been streaming (15min segments)
                followers = (STREAMER.data.followers ?? STREAMER.cult), // The number of followers the channel has
                watchers = (STREAMER.poll || followers).ceilToNearest(1000), // The current number of people watching
                pointsPerInterval = 80, // The user normally gets 80 points per 15mins
                maximum = (intervals * pointsPerInterval).round(); // The absolute maximum nubmer of points anyone (except the streamer) on the channel can have

            return (followers - (followers * (STREAMER.coin / maximum))).clamp(0, followers).round()
        },

        get redo() {
            return /\brerun\b/i.test($(`[class*="video-player"i] [class*="media-card"i]`)?.textContent?.trim() ?? "")
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

            // Add any missing items...
            for(let __item__ of STREAMER.__shop__)
                if(inventory.missing(item => item.title.equals(__item__.title) && item.cost == __item__.cost))
                    inventory.push(__item__);

            let cachedShopAddress = `points_shop_${ STREAMER.sole }`;
            Cache.large.load(cachedShopAddress, shop => {
                shop = shop[cachedShopAddress];

                if(nullish(shop))
                    return;

                for(let item of shop)
                    if(!~inventory.findIndex(i => i.id == item.id)) {
                        let j;

                        if(!!~(j = inventory.findIndex(i => i.title.equals(item.title))))
                            inventory.splice(j, 1, item);
                        else
                            inventory.push(item);
                    }
            });

            Cache.large.save({ [cachedShopAddress]: inventory });

            return inventory.sort((a, b) => a.cost - b.cost)
        },

        get sole() {
            let [channel_id] = [
                ...$.all('[data-test-selector="image_test_selector"i]').map(img => img.src).filter(src => src.contains('/panel-')).map(src => parseURL(src).pathname.split('-', 3)),
                ...$.all('[src][class*="channel"i][class*="points"i][class*="icon"i]').map(img => img.src).filter(src => src.contains('-icons/')).map(src => parseURL(src).pathname.slice(1).split('/')),
            ].flat().filter(parseFloat);

            return (0
                || parseInt(channel_id ?? LIVE_CACHE.get('sole'))
            )
        },

        get song() {
            let element = $('[class*="soundtrack"i]');
            let song = new String(element?.textContent ?? "");

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
                [min, max] = [[0,30],[70,100]][+(THEME.unlike('dark'))];

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

            if(Number.isNaN(sole))
                return fetchURL.fromDisk(`https://www.twitch.tv/${ name }/videos`, { hoursUntilEntryExpires: 1 })
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

            return fetchURL.fromDisk(`https://www.twitchmetrics.net/c/${ sole }-${ name }/videos?sort=published_at-desc`)
                .then(response => response.text())
                .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                .then(DOM => $.all('[href*="/videos/"i]:not(:only-child)', DOM).map(a => ({ name: a.textContent.trim(), href: a.href })))
                .catch($warn);
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

        $log('Resetting timer. Reason:', { hosting, raiding, raided }, 'Moving onto:', next);

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
        let element, max_show_more = 10, max_show_less = 10, max_panel_size = 10;

        // Is the nav open?
        let alreadyOpen = $.defined('[data-a-target="side-nav-search-input"i], [data-a-target="side-nav-header-expanded"i]'),
            sidenav = $('[data-a-target="side-nav-arrow"i]');

        // Open the Side Nav
        if(!alreadyOpen) // Only open it if it isn't already
            sidenav?.click();

        // Click "show more" as many times as possible
        show_more: while(true
            && --max_show_more
            && defined(element = $('[id*="side"i][id*="nav"i] [data-a-target$="show-more-button"i]'))
        )
            element.click();

        let ALL_LIVE_SIDE_PANEL_CHANNELS = $.all('[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] a').filter(e => $.nullish('[class*="--offline"i]', e));

        try {
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

                                // Then the actual "does the channel show up" result
                                let parent = $(`[id*="side"i][id*="nav"i] .side-nav-section [href$="${ pathname }"i]`);

                                if(nullish(parent))
                                    return false;

                                // The "is it offline" result
                                let live = defined(parent) && $.nullish(`[class*="--offline"i]`, parent);

                                return live;
                            },
                            name: ($('img', element)?.alt ?? parseURL(element.href).pathname.slice(1)),
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
                            name: ($('img', element)?.alt ?? parseURL(element.href).pathname.slice(1)),
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
                            name: ($('img', element)?.alt ?? parseURL(element.href).pathname.slice(1)),
                        };

                        element.setAttribute('draggable', true);
                        element.ondragstart ??= event => {
                            event.dataTransfer.dropEffect = 'move';
                        };

                        return streamer;
                    }),
            ].filter(uniqueChannels);
        } catch(error) {
            $warn(error);
        }

        // Click "show less" as many times as possible
        show_less: while(true
            && --max_show_less
            && defined(element = $('[data-a-target$="show-less-button"i]'))
        )
            element.click();

        let PANEL_SIZE = 0;

        // Only re-open sections if they contain live channels
        show_more_again: while(true
            && --max_panel_size
            && defined(element = $('[id*="side"i][id*="nav"i] [data-a-target$="show-more-button"i]'))
            && (++PANEL_SIZE * 12) < ALL_LIVE_SIDE_PANEL_CHANNELS.length
        )
            element.click();

        // Close the Side Nav
        if(!alreadyOpen) // Only close it if it wasn't open in the first place
            wait().then(() => sidenav?.click());
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
        .catch($warn)
        .finally(async() => {
            if(nullish(STREAMER))
                return;

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

                USERNAME = window.USERNAME = cookies.login || USERNAME;

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

                if(!STREAMER.name?.length)
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
                            throw new Error(`The data was not saved correctly`);
                        else if((dataRetrievedAt + (4 * 60 * 60 * 1000)) < +new Date)
                            throw new Error(`The data has expired`);
                        else
                            STREAMER.data = { ...STREAMER.data, ...data, streamerID: STREAMER.sole };

                        $remark(`Cached details about "${ STREAMER.name }"`, data);

                        // PrepareForGarbageCollection(cache);
                    });
                } catch(exception) {
                    let { name, sole } = STREAMER;

                    if(!sole)
                        await new Search(name)
                            .then(Search.convertResults)
                            .then(streamer => sole = streamer.sole);

                    if(!sole)
                        break __FineDetails__;

                    let $ErrGet = `TTV-Tools-failed-to-get`;
                    let ErrGet = JSON.parse(null
                        ?? sessionStorage.getItem($ErrGet)
                        ?? '[]'
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
                    www_twitchmetrics_net: if(!FETCHED_OK) {
                        when(() => defined(STREAMER.sole)? STREAMER: false).then(({ name, sole }) => {
                            fetchURL(`https://www.twitchmetrics.net/c/${ sole }-${ name.toLowerCase() }/stream_time_values`)
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

                                    $remark(`Stream details about "${ STREAMER.name }"`, data);

                                    return STREAMER.data = { ...STREAMER.data, ...data };
                                })
                                .then(data => {
                                    data = { ...data, streamerID: STREAMER.sole, dataRetrievedOK: (FETCHED_OK ||= defined(data?.dailyBroadcastTime)), dataRetrievedAt: +new Date };

                                    Cache.save({ [`data/${ STREAMER.name }`]: data });
                                })
                                .catch(error => {
                                    $warn(`Failed to get STREAM details (1§1): ${ error }`)
                                        // .toNativeStack();

                                    if(!ErrGet.length)
                                        addReport({ [$ErrGet]: `https://www.twitchmetrics.net/c/${ sole }-${ name?.toLowerCase() }/stream_time_values` });
                                });

                            // Channel details (HTML → JSON)
                            fetchURL(`https://www.twitchmetrics.net/c/${ sole }-${ name.toLowerCase() }`)
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

                                    $remark(`Channel details about "${ STREAMER.name }"`, data);

                                    return STREAMER.data = { ...STREAMER.data, ...data };
                                })
                                .then(data => {
                                    data = { ...data, streamerID: STREAMER.sole, dataRetrievedOK: (FETCHED_OK ||= defined(data?.firstSeen)), dataRetrievedAt: +new Date };

                                    Cache.save({ [`data/${ STREAMER.name }`]: data });
                                })
                                .catch(error => {
                                    $warn(`Failed to get CHANNEL details (1§2): ${ error }`)
                                        // .toNativeStack();

                                    if(!ErrGet.length)
                                        addReport({ [$ErrGet]: `https://www.twitchmetrics.net/c/${ sole }-${ name?.toLowerCase() }` });
                                });
                        }, 1e3);
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
                    twitchstats_net: if(!FETCHED_OK)
                        fetchURL(`https://twitchstats.net/streamer/${ name.toLowerCase() }`)
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

                                parsing: for(let child of children)
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

                                                    if(val?.equals('now'))
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
                                $warn(`Failed to get CHANNEL details (2): ${ error }`)
                                    // .toNativeStack();

                                if(!ErrGet.length)
                                    addReport({ [$ErrGet]: `https://twitchstats.net/streamer/${ name?.toLowerCase() }` });
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
                    twitchtracker_com: if(!FETCHED_OK)
                        fetchURL(`https://twitchtracker.com/api/channels/summary/${ name.toLowerCase() }`)
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
                                $warn(`Failed to get CHANNEL details (3): ${ error }`)
                                    // .toNativeStack();

                                if(!ErrGet.length)
                                    addReport({ [$ErrGet]: `https://twitchtracker.com/api/channels/summary/${ name?.toLowerCase() }` });
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
                    api_twitch_tv: if(!FETCHED_OK)
                        fetchURL(`https://api.twitch.tv/helix/users?id=${ STREAMER.sole }`, {
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

                                $remark('Getting fine details...', { [type]: value, cookies }, json);

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
                                $warn(`Failed to get CHANNEL details (4): ${ error }`)
                                    // .toNativeStack();

                                if(!ErrGet.length)
                                    addReport({ [$ErrGet]: `https://api.twitch.tv/helix/users?id=${ STREAMER.sole }` });
                            });
                }
            }
        });

    setInterval(update, 2_5_0);

    let LIVE_REMINDERS__LISTING_INTERVAL; // List the live time of Live Reminders

    if(parseBool(Settings.up_next__one_instance)) {
        $log('This tab is the Up Next owner', UP_NEXT_ALLOW_THIS_TAB);

        // Set the anon-ID
        fetchURL.idempotent(`/directory/category/just-chatting`, { timeout: 5_000 })
            .then(response => response.text())
            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
            .then(DOM => {
                let regexp = /client_?id\s?[:=](["'`])(\w+)\1/gi;

                $.getElementByText.call(DOM, regexp).innerText.replace(regexp, ($0, stringBarrier, hardcodedID, $$, $_) => Search.anonID = hardcodedID);
            });

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
                        $warn(error);

                        confirm(`<div controller
                            okay="Grant access"
                            deny="Never ask again"
                            >TTV Tools would like to use Twitch's APIs on your behalf.</div>`)
                        .then(answer => {
                            if(answer === false)
                                return Cache.save({ clientID: '.DENIED', oauthToken: '.DENIED' });

                            let oauth = open(`https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=s8glgfv1nm23ts567xdsmwqu5wylof&redirect_uri=${ encodeURIComponent("https://ephellon.github.io/TTVAuth") }&response_type=token&scope=${ encodeURIComponent(['user:read:follows', 'user:read:subscriptions', 'chat:read'].join(' ')) }&state=${ (new UUID).value }`, '_blank');

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
                    $warn(error);

                    fetchURL(`https://id.twitch.tv/oauth2/token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: top['atоb']("zqlTBes8gqKcjgx6Bql2B2zlFm8Pxok9AEzouQk9FgWlWEvoueliBpBMFQKKF2kyYqvMYmv8je5czqRoxq5+Y2Lfugc8uOW2JgRoWEHsFEC8AQ69FUB2YmSrWSa8ugLKjeAnwevrWSaMYmvcBes8weSnYPB9WQS8BEhrWeln")
                    }).then(response => response.json()).then(({ access_token, expires_in, token_type, error, error_description }) => {
                        if(error && error_description) {

                            throw new Error(`${ error }: ${ error_description }`);
                        }
                        oauthToken = access_token;

                        Cache.save({ oauthToken, clientID });

                        Search.authorization = `Bearer ${ oauthToken }`;
                        Search.clientID = clientID;
                    }).catch($warn);
                });
            });
        }
    } else {
        top.UP_NEXT_ALLOW_THIS_TAB = UP_NEXT_ALLOW_THIS_TAB = true;
        Runtime.sendMessage({ action: 'WAIVE_UP_NEXT' });
    }

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
                                $log('Positive trend detected: ' + changes.join(', '));
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
                                $log('Negative trend detected: ' + changes.join(', '));
                            }
                        }

                        // Auto-increase the polling time if the job isn't fast enough
                        if(video.stalling)
                            ++STALLED_FRAMES;
                        else if(STALLED_FRAMES > 0)
                            --STALLED_FRAMES;

                        if(STALLED_FRAMES > 15 || (stop - start > POLL_INTERVAL * .75)) {
                            $warn('The stream seems to be stalling...', 'Increasing Auto-Focus job time...', (POLL_INTERVAL / 1000).toFixed(2) + 's →', (POLL_INTERVAL * 1.1 / 1000).toFixed(2) + 's');

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
        if(RestartJob.__reason__.noneOf('default', 'modify', 'reinit'))
            $.all('#tt-auto-focus-differences, #tt-auto-focus-stats')
                .forEach(element => element.remove());

        clearInterval(CAPTURE_INTERVAL);
    };

    __AutoFocus__:
    if(parseBool(Settings.auto_focus)) {
        RegisterJob('auto_focus');

        $warn("[Auto-Focus] is monitoring the stream...");
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
        if(false
            || defined(button)
            || $.defined('[data-a-target*="ad-countdown"i]')
            || nullish(currentQuality)
            || /\/search\b/i.test(NORMALIZED_PATHNAME)
        ) {
            // If the quality controls have failed to load for 1min, leave the page
            if(nullish(currentQuality) && ++NUMBER_OF_FAILED_QUALITY_FETCHES > 60) {
                let scapeGoat = await GetNextStreamer();

                $warn(`The following page failed to load correctly (no quality controls present): ${ STREAMER.name } @ ${ (new Date) }`)
                    // .toNativeStack();

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
                return StopWatch.stop('away_mode') /* || $warn('Unable to create the Lurking button') */;

            let container = $('#away-mode');

            if(nullish(container))
                container = furnish('#away-mode', {
                    innerHTML: sibling.outerHTML.replace(/(?:[\w\-]*)(?:follow|header|notifications?|settings-menu)([\w\-]*)/ig, 'away-mode$1'),
                });

            // TODO: Add an animation for the Away Mode button appearing?
            // container.modStyle('animation:1s fade-in-from-zero 1;');

            parent.insertBefore(container, parent[before + 'ElementChild']);

            if(['over'].contains(placement)) {
                container.firstElementChild.classList.remove('tt-mg-l-1');
            } else if(['under'].contains(placement)) {
                $('span', container)?.remove();
                $('[style]', container)?.modStyle('opacity: 1; transform: translateX(15%) translateZ(0px);')
            }

            extra({ container, sibling, parent, before, placement });

            button = {
                enabled,
                container,
                icon: $('svg', container),
                background: $('button', container),
                get offset() { return getOffset(container) },
                tooltip: new Tooltip(container, `${ ['Start','Stop'][+enabled] } Lurking (${ GetMacro('alt+a') })`, { from: 'top', left: +5 }),
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
        button.background?.modStyle(`background:${ [`var(--user-accent-color)`, 'var(--color-background-button-secondary-default)'][+(button.container.getAttribute('tt-away-mode-enabled').equals("true"))] } !important;`);
        // button.icon.setAttribute('height', '20px');
        // button.icon.setAttribute('width', '20px');

        button.container.onclick ??= async event => {
            let enabled = !parseBool(AwayModeButton.container.getAttribute('tt-away-mode-enabled')),
                { container, background, tooltip } = AwayModeButton;

            container.setAttribute('tt-away-mode-enabled', enabled);
            tooltip.innerHTML = `${ ['Start','Stop'][+enabled] } Lurking (${ GetMacro('alt+a') })`;
            background?.modStyle(`background:${ [`var(--user-accent-color)`, 'var(--color-background-button-secondary-default)'][+enabled] } !important;`);

            // Return control when Lurking is engaged
            MAINTAIN_VOLUME_CONTROL = true;

            let controls = $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls');

            if(defined(controls))
                controls.dataset.automatic = MAINTAIN_VOLUME_CONTROL;

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
        $remark("Adding & Scheduling the Lurking button...");

        RegisterJob('away_mode');

        // Maintain the volume until the user changes it
        GetVolume.onchange = (volume, { isTrusted = false }) => {
            if(!MAINTAIN_VOLUME_CONTROL || !isTrusted)
                return;

            $warn('[Lurking] is releasing volume control due to user interaction...');

            MAINTAIN_VOLUME_CONTROL = !isTrusted;

            $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls').dataset.automatic = MAINTAIN_VOLUME_CONTROL;

            SetVolume(volume);
        };

        // Set the color and control scheme
        when.defined(() => $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls'))
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

                $warn(`Lurking is scheduled to be "${ ['off','on'][+status] }" for ${ weekdays[day] } @ ${ time }:00 for ${ toTimeString(duration, '?hours_h') }`);

                // Found at least one schedule...
                if(defined(desiredStatus = status))
                    break;
            }

            // Scheduled state...
            // $log('Lurking needs to be:', desiredStatus, 'Currently:', currentStatus);
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
        when.defined(() => $('.prime-offers button')).then(prime_btn => {
            let handled = 0;
            prime_btn.click();

            // There's at least one offer...
            when.sated(() => $.all('[class*="prime"i][class*="offer"i][class*="header"i] ~ *'), 750).then(offerContainers => {
                for(let container of offerContainers)
                    when(container => {
                        let offerClaimLink = $('[data-a-target*="prime"i][data-a-target*="claim"i]', container);
                        let offerClaimButton = $('button[data-a-target*="prime-claim"i]', container);
                        let offerDismissButton = $('[class*="prime-offer"i][class*="dismiss"i] button', container);

                        if(nullish(offerClaimLink ?? offerClaimButton ?? offerDismissButton))
                            return false;

                        let gameTitle = $('[data-a-target*="prime-offer"i][data-a-target*="game"i][data-a-target*="title"i]', container)?.innerText?.trim();
                        let offerTitle = $('[data-a-target*="prime-offer"i][data-a-target*="title"i]:not([data-a-target*="game"i])', container)?.innerText?.trim();
                        let offerImage = $('img', container)?.src;
                        let offerDescription = $('[class*="prime-offer"i][class*="description"i]', container)?.innerText?.trim();
                        let offerPublisher = $('[class*="prime-offer"i][class*="publisher"i]', container)?.innerText?.trim();

                        $notice(`Claiming Prime Loot Offer:`, { title: offerTitle, game: gameTitle, description: offerDescription, publisher: offerPublisher, type: (offerClaimButton? 'BUTTON_CLAIM': 'LINK_CLAIM') });

                        if(defined(offerClaimButton))
                            offerClaimButton.click();
                        else if(defined(offerClaimLink))
                            offerDismissButton?.click();

                        return true;
                    }, 1e3, container).then(() => {
                        if(handled >= offerContainers.length)
                            prime_btn.click();
                    });
            });

            // There are no offers...
            when.defined(() => $('[class*="prime"i][class*="empty"i]')).then(() => prime_btn.click());
        });
    };
    Timers.claim_loot = -1_000;

    __ClaimLoot__:
    if(UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.claim_loot)) {
        $remark("Claiming Prime Gaming Loot...");

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

                                $warn(`[Prime Subscription] just renewed your subscription to ${ STREAMER.name } @ ${ (new Date).toJSON() }`)
                                    .toNativeStack();
                            });
                    });
            }
        });
    };
    Timers.claim_prime = -5000;

    __ClaimPrime__:
    if(UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.claim_prime)) {
        $remark("Claiming Prime Subscription...");

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
    let VideoClips = {
        dvr: parseBool(Settings.video_clips__dvr),
        filetype: (Settings.video_clips__file_type ?? 'webm'),
        quality: (Settings.video_clips__quality ?? 'auto'),
        length: parseInt(Settings.video_clips__length ?? 60) * 1000,
    };

    let DISPLAY_WALLET_BUTTONS,
        REWARDS_ON_COOLDOWN = new Map,
        TEXT_BOX_ALREADY_FOCUSED,
        USER_INVOKED_PAUSE = true;

    async function RECORD_PURCHASE({ updateRecords = true, fromUser = true, override = null, element, message, subject, mentions, AutoClaimRewards }) {
        element = await element;

        if(!(true
            // The subject matches
            && subject.equals('coin')

            // The message must* be from the user
            && fromUser

            == (false
                // The message is from the user
                || message.contains(USERNAME)
                || mentions.contains(USERNAME)

                // The message is from the user (for embedded messages)
                || $('[class*="message"i] [class*="username"i] [data-a-user]', element)?.dataset?.aUser?.equals(USERNAME)
            )
        )) return false;

        // Pause Up Next during recording...
        if(UP_NEXT_ALLOW_THIS_TAB) {
            let button = $('#up-next-control'),
                paused = parseBool(button?.getAttribute('paused'));

            if(!paused) {
                USER_INVOKED_PAUSE = false;
                button?.click();
            }
        }

        let rewardID = override?.rewardID ?? element.dataset?.shopItemId ?? element.closest('[data-tt-reward-id]')?.dataset?.ttRewardId ?? element.dataset.uuid;
        let [item] = override?.shop ?? await STREAMER.shop.filter(({ id, title }) => id.equals(rewardID) || (title?.length && message?.mutilate()?.contains(title.mutilate())));

        if(nullish(item))
            return false;

        let { title, cost, id } = item;

        // The user successfully purchased the item...
        if(updateRecords) {
            let { sole } = STREAMER;

            AutoClaimRewards[sole |= 0] = AutoClaimRewards[sole]?.filter(i => i)?.filter(i => i.unlike(id));
            Cache.save({ AutoClaimRewards });
        }

        // Begin recording...
        let video = $.all('video').pop();
        let time = parseInt(Settings.video_clips__trophy_length) * 1000;
        let name = [STREAMER.name, `${ title } (${ (new Date).toLocaleDateString(top.LANGUAGE, { dateStyle: 'short' }).replace(GetFileSystem().allIllegalFilenameCharacters, '-') })`].join(' - ');

        video.dataset.trophyId = title;

        SetQuality(VideoClips.quality, 'auto').then(() => {
            let recording = Recording.proxy(video, { name, as: name, maxTime: time, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats });

            // CANNOT be chained with the above; removes `this` context (can no longer be aborted)
            recording
                .then(({ target }) => target.recording.save())
                .then(link => alert.silent(`
                    <video controller controls
                        title="Trophy Clip Saved &mdash; ${ link.download }"
                        src="${ link.href }" style="max-width:-webkit-fill-available"
                    ></video>
                    `)
                );

            confirm.timed(`
                <input hidden controller
                    icon="\uD83D\uDD34\uFE0F" title='Recording "${ STREAMER.name } - ${ title }"'
                    okay="${ encodeHTML(Glyphs.modify('download', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Save"
                    deny="${ encodeHTML(Glyphs.modify('trash', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Discard"
                />
                ${ title } &mdash; ${ Glyphs.modify('channelpoints', { height: '20px', idth: '20px', style: 'display:inline-block;vertical-align:bottom;width:fit-content' }) }${ comify(cost) }`
            , time)
                .then(answer => {
                    if(answer === false)
                        throw `Trophy clip discarded!`;
                    recording.stop();
                })
                .catch(error => {
                    alert.silent(error);
                    recording.controller.abort(error);
                })
                .finally(() => {
                    // Unpause Up Next (if done automatically)
                    if(USER_INVOKED_PAUSE)
                        return;

                    let button = $('#up-next-control'),
                        paused = parseBool(button?.getAttribute('paused'));

                    if(!paused)
                        return;

                    button?.click();
                });
        });

        return true;
    };

    Handlers.claim_reward = () => {
        if(top.TWITCH_INTEGRITY_FAIL)
            return;

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
                                if(REWARDS_ON_COOLDOWN.has(id)) {
                                    if(REWARDS_ON_COOLDOWN.get(id) < +new Date)
                                        REWARDS_ON_COOLDOWN.delete(id);
                                    else
                                        return;
                                }

                                cost = parseInt(cost);
                                title = title.trim();

                                await when.defined(() => $('[data-test-selector*="chat"i] [data-test-selector*="points"i][data-test-selector*="summary"i] button'))
                                    .then(async rewardsMenuButton => {
                                        let { coin, fiat } = STREAMER;

                                        $notice(`Can "${ title }" be bought yet? ${ ['No', 'Yes'][+(coin >= cost)] }`);

                                        if(TEXT_BOX_ALREADY_FOCUSED)
                                            return;
                                        if(coin < cost)
                                            return;
                                        if($.defined('#tt_saved_input_for_redemption'))
                                            return;

                                        rewardsMenuButton.click();

                                        $log(`Purchasing "${ title }" for ${ cost } ${ fiat }...`);

                                        if(needsInput) {
                                            prompt
                                                .silent(`<input id=tt_saved_input_for_redemption hidden controller title="You have saved text for this redemption..." />${ title }<br><br><strong>${ parseBool(Settings.video_clips__trophy)? 'This redemption will be recorded</strong>': '' }`, AutoClaimAnswers[sole]?.[id] ?? '')
                                                .then(() => {
                                                    $('[data-a-target="chat-input"i]')?.modStyle(`background:!delete`);
                                                });

                                            when.defined(() => $('[data-a-target="chat-input"i]')).then(inputBox => {
                                                inputBox.addEventListener('keydown', ({ key = '', altKey, ctrlKey, metaKey, shiftKey, currentTarget }) => {
                                                    if(!(ctrlKey || metaKey || altKey || shiftKey) && key.equals('Enter')) {
                                                        $('[data-a-target="chat-input"i]')?.modStyle(`background:!delete`);
                                                        TEXT_BOX_ALREADY_FOCUSED = false;

                                                        // The user successfully purchased the item...
                                                        if(true
                                                            && parseBool(Settings.video_clips__trophy)
                                                            // && (currentTarget.value || currentTarget.textContent).length > 0
                                                        )
                                                            Chat.consume.onbullet = ({ element, message, subject, mentions }) =>
                                                                RECORD_PURCHASE({ element, message, subject, mentions, AutoClaimRewards }).then(recording => {
                                                                    if(!recording)
                                                                        alert.silent(`Recording "${ title }" ran into an error! Will try to salvage video.`);
                                                                    return true; // Event OK to consume
                                                                });
                                                    }
                                                });
                                                inputBox.modStyle(`background:#387aff`);
                                                inputBox.focus();

                                                TEXT_BOX_ALREADY_FOCUSED = true;
                                            });
                                        }

                                        // Purchase and remove
                                        await when.defined(() => $('.rewards-list')?.getElementByText(title, 'i')?.closest('.reward-list-item')?.querySelector('button'))
                                            .then(async rewardButton => {
                                                let { coin, fiat } = STREAMER;

                                                $notice(`Can "${ title }" be bought yet? ${ ['No', 'Yes'][+(coin >= cost)] }`);

                                                if(coin < cost)
                                                    return;

                                                rewardButton.click();

                                                when.defined(() => $('.reward-center-body [data-test-selector*="required"i][data-test-selector*="points"i]')?.closest('button'), 500)
                                                    .then(purchaseButton => {
                                                        let cooldown = parseTime(purchaseButton.previousElementSibling?.getElementByText(parseTime.pattern)?.textContent);

                                                        if(cooldown > 0) {
                                                            $log(`Unable to purchase "${ title }" right now. Waiting ${ toTimeString(cooldown) }`);
                                                            return REWARDS_ON_COOLDOWN.set(id, +(new Date) + cooldown);
                                                        }

                                                        if(true
                                                            && parseBool(Settings.video_clips__trophy)
                                                            && ['SINGLE_MESSAGE_BYPASS_SUB_MODE', 'SEND_HIGHLIGHTED_MESSAGE', 'CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK', 'RANDOM_SUB_EMOTE_UNLOCK', 'CHOSEN_SUB_EMOTE_UNLOCK']
                                                                .missing(ID => ID.contains(id))
                                                        ) {
                                                            // Add the recording listener, then purchase the item
                                                            Chat.consume.onbullet = ({ element, message, subject, mentions }) =>
                                                                RECORD_PURCHASE({ element, message, subject, mentions, AutoClaimRewards }).then(recording => {
                                                                    if(!recording)
                                                                        alert.silent(`Recording "${ title }" ran into an error! Will try to salvage video.`);
                                                                    return true; // Event OK to consume
                                                                });

                                                            purchaseButton.click();
                                                        } else {
                                                            // Purchase the item
                                                            purchaseButton.click();
                                                        }

                                                        wait(10_000).then(() => {
                                                            top.TWITCH_INTEGRITY_FAIL = defined($('[data-test-selector*="reward"i]')?.closest('[aria-label]')?.querySelector('[class*="load"i][class*="spin"i]'));
                                                        });
                                                    }).finally(() => {
                                                        rewardsMenuButton.click();
                                                    });
                                            });
                                    });
                            });

            // @performance
            PrepareForGarbageCollection(AutoClaimRewards, AutoClaimAnswers);
        });
    };
    Timers.claim_reward = 15_000;

    Unhandlers.claim_reward = () => {
        clearInterval(DISPLAY_WALLET_BUTTONS);
    };

    __ClaimReward__:
    // On by Default (ObD; v5.16)
    if(nullish(Settings.claim_reward) || parseBool(Settings.claim_reward)) {
        $remark('Adding reward claimer...');

        RegisterJob('claim_reward');

        // Correct "undefined" key for auto-answers...
        Cache.load(['AutoClaimRewards', 'AutoClaimAnswers'], ({ AutoClaimRewards, AutoClaimAnswers }) => {
            let streamers = STREAMER.jump;

            AutoClaimRewards ??= {};
            AutoClaimAnswers ??= {};

            for(let streamer in streamers) {
                let { id } = streamers[streamer];

                if((id in AutoClaimRewards) && (id in AutoClaimAnswers)) {
                    let rewards = AutoClaimRewards[id];
                    let answers = AutoClaimAnswers[id];

                    if(undefined in answers) {
                        answers[rewards[0]] = answers[undefined]; // Assume the first entry is the correct one :P

                        $notice(`Correcting auto-answer entry ${ streamer }@${ rewards[0] } → "${ answers[undefined] }"`);

                        delete answers[undefined];
                    }
                }
            }

            Cache.save({ AutoClaimRewards, AutoClaimAnswers });

            // @performance
            PrepareForGarbageCollection(AutoClaimRewards, AutoClaimAnswers);
        });

        DISPLAY_WALLET_BUTTONS = setInterval(() => {
            let container = $('[data-test-selector*="required"i][data-test-selector*="points"i]:not(:empty), button[disabled] [data-test-selector*="required"i][data-test-selector*="points"i]:empty, [data-test-selector*="chat"i] svg[type*="warn"i]')
                    ?.closest?.('button, [class*="error"i]'),
                handler = $('#tt-auto-claim-reward-handler, #tt-purchase-and-record-handler');

            let f = furnish;

            // Rainbow border, Cooldown timer, Unlock all, Modify many, and Buy + Record buttons //
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

                                                                $remark(`Buying emote: "${ name }" for ${ cost }`);

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
                        child.modStyle(`animation-duration:${ (1 / (STREAMER.coin / $cost)).clamp(1, 30).toFixed(2) }s`);
                        child.setAttribute('rainbow-border', (AutoClaimRewards[STREAMER.sole] ??= []).contains(item?.id));

                        // Cooldown timer
                        if(REWARDS_ON_COOLDOWN.has(item?.id))
                            child.closest('.reward-list-item').setAttribute('timed-out', toTimeString((REWARDS_ON_COOLDOWN.get(item?.id) - +new Date).clamp(0, +Infinity), 'clock'));
                    });

                    // @performance
                    PrepareForGarbageCollection(AutoClaimRewards);
                });
            }

            if(defined(handler))
                return void($('button', handler).disabled = top.TWITCH_INTEGRITY_FAIL);

            Buy_and_Record: if(nullish(container) && parseBool(Settings.video_clips__trophy)) {
                let purchaseButton = $('[data-test-selector*="required"i][data-test-selector*="points"i]:empty')?.closest?.('button');
                let cooldown = parseTime(purchaseButton?.previousElementSibling?.getElementByText(parseTime.pattern)?.textContent) | 0;

                if(nullish(purchaseButton) || cooldown > 0)
                    break Buy_and_Record;

                let [head, body] = purchaseButton.closest('[class*="reward"i][class*="content"i], [class*="chat"i][class*="input"i]:not([class*="error"i])').children,
                    $body = $('[class*="tray"i][class*="body"i]', head),
                    $title = (($('#channel-points-reward-center-header', head)?.textContent ?? $body?.previousElementSibling?.textContent) || '').trim(),
                    $prompt = (($('.reward-center-body p', body)?.textContent ?? $body?.textContent) || '').trim(),
                    $image = ($('[class*="reward-icon"i] img', body) ?? $('[class*="reward-icon"i] img', head))?.src,
                    [$cost = 0] = (($('[data-test-selector="RewardText"i]', body)?.parentElement ?? $('[class*="reward"i][class*="header"i]', head))?.innerText?.split(/\s/)?.map(parseCoin)?.filter(n => n > 0) ?? []);

                let [item] = STREAMER.shop.filter(({ type = 'UNKNOWN', id = '', title = '', cost = 0, image = '' }) =>
                    (false
                        || (type.equals("unknown") && id.equals(UUID.from([$image, $title.mutilate(), $cost].join('|$|'), true).value))
                        || (type.unlike("custom") && cost == $cost && id.equals([STREAMER.sole, type].join(':')))
                        || (title.equals($title) && (cost == $cost || image?.url?.equals($image?.url)))
                    )
                );

                if(nullish(item))
                    break Buy_and_Record;

                purchaseButton.dataset.ttAutoBuy = item.id;

                purchaseButton.insertAdjacentElement('afterend',
                    f(`#tt-purchase-and-record-handler[data-tt-reward-id=${ item.id }]`).with(
                        f('.tt-inline-flex.tt-relative').with(
                            f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative',
                                {
                                    style: `padding:1rem;text-align:center;min-width:fit-content;width:${ getOffset(purchaseButton).width.ceil() }px!important`,

                                    async onmouseup({ currentTarget }) {
                                        let rewardID = currentTarget.closest('[data-shop-item-id]')?.dataset?.shopItemId ?? currentTarget.closest('[data-tt-reward-id]')?.dataset?.ttRewardId;
                                        let [item] = await STREAMER.shop.filter(({ id }) => id.equals(rewardID));

                                        if(nullish(item))
                                            return;

                                        Chat.consume.onbullet = ({ element, message, subject, mentions }) =>
                                            RECORD_PURCHASE({ updateRecords: false, override: { rewardID, shop: [item] }, element, message, subject, mentions }).then(recording => {
                                                if(!recording)
                                                    alert.silent(`Recording "${ item.title }" ran into an error! Will try to salvage video.`);
                                                return true; // Event OK to consume
                                            });

                                        $(`[data-tt-auto-buy="${ rewardID }"i]`)?.click();

                                        wait(10_000).then(() => {
                                            top.TWITCH_INTEGRITY_FAIL = defined($('[data-test-selector*="reward"i]')?.closest('[aria-label]')?.querySelector('[class*="load"i][class*="spin"i]'));
                                        });
                                    },
                                },

                                f('[style=height:2rem; width:2rem]', {
                                    innerHTML: Glyphs.modify('video', { style: 'padding-right:.2rem' })
                                }),

                                `Buy + Record`
                            )
                        )
                    )
                );
            }

            if(nullish(container))
                return;

            // Adds "Buy when available" button
            Cache.load('AutoClaimRewards', async({ AutoClaimRewards }) => {
                AutoClaimRewards ??= {};

                let [head, body] = container.closest('[class*="reward"i][class*="content"i], [class*="chat"i][class*="input"i]:not([class*="error"i])').children,
                    $body = $('[class*="tray"i][class*="body"i]', head),
                    $title = (($('#channel-points-reward-center-header', head)?.textContent ?? $body?.previousElementSibling?.textContent) || '').trim(),
                    $prompt = (($('.reward-center-body p', body)?.textContent ?? $body?.textContent) || '').trim(),
                    $image = ($('[class*="reward-icon"i] img', body) ?? $('[class*="reward-icon"i] img', head))?.src,
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
                        `Do not buy`:
                    `Buy when available${ '*'.repeat(+item.needsInput) }`
                );

                $('[id$="header"i], [class*="header"i]', head)?.modStyle(`animation-duration:${ (1 / (STREAMER.coin / $cost)).clamp(1, 30).toFixed(2) }s`);
                $('[id$="header"i], [class*="header"i]', head)?.setAttribute('rainbow-text', itemIDs.contains(rewardID));

                container.insertAdjacentElement('afterend',
                    f(`#tt-auto-claim-reward-handler[data-tt-reward-id=${ rewardID }]`).with(
                        f('.tt-inline-flex.tt-relative').with(
                            f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative',
                                {
                                    style: `padding:1rem;text-align:center;min-width:fit-content;width:${ getOffset(container).width.ceil() }px!important`,

                                    async onmouseup({ currentTarget }) {
                                        let rewardID = currentTarget.closest('[data-shop-item-id]')?.dataset?.shopItemId ?? currentTarget.closest('[data-tt-reward-id]')?.dataset?.ttRewardId;
                                        let [item] = await STREAMER.shop.filter(({ id }) => id.equals(rewardID));

                                        if(nullish(item))
                                            return;

                                        Cache.load(['AutoClaimRewards', 'AutoClaimAnswers'], async({ AutoClaimRewards, AutoClaimAnswers }) => {
                                            AutoClaimRewards ??= {};
                                            AutoClaimAnswers ??= {};

                                            let itemIDs = (AutoClaimRewards[STREAMER.sole] ??= []);
                                            let answers = (AutoClaimAnswers[STREAMER.sole] ??= {});
                                            let index = itemIDs.indexOf(rewardID);

                                            if(!!~index) {
                                                delete answers[rewardID];
                                                itemIDs.splice(index, 1);
                                            } else {
                                                if(item.needsInput) {
                                                    answers[rewardID] = await prompt.silent(`<input hidden controller title='Input required to redeem "${ item.title.replace(/'/g, "&apos;") }"' />${ item.prompt || `Please provide input...` }`);

                                                    if(answers[rewardID] === null)
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
                                                    `Do not buy`:
                                                `Buy when available${ '*'.repeat(+item.needsInput) }`
                                            );

                                            currentTarget.closest('[class*="reward"i][class*="content"i]')?.querySelector('[id$="header"i]')?.setAttribute('rainbow-text', !~index);

                                            Cache.save({ AutoClaimRewards, AutoClaimAnswers });

                                            // @performance
                                            PrepareForGarbageCollection(AutoClaimRewards, AutoClaimAnswers);
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

                // @performance
                PrepareForGarbageCollection(AutoClaimRewards);
            });

            $('.reward-center-body img')?.closest(':not(img,:only-child)')?.setAttribute('tt-rewards-calc', 'after');
        }, 300);
    }

    __RecordForeignRewards__:
    if(parseBool(Settings.record_foreign_rewards)) {
        Chat.onbullet = async({ element, message, subject, mentions, usable }) => {
            if(!usable)
                return /* The bullet was created before the "Welcome to chat" message (i.e. "Already used") */;

            element = await element;
            subject ||= element.dataset.type;

            let rewardID = element.dataset?.shopItemId ?? element.closest('[data-tt-reward-id]')?.dataset?.ttRewardId ?? element.dataset.uuid;
            let [item] = await STREAMER.shop.filter(({ id }) => id.equals(rewardID));

            if(nullish(item))
                return;

            let { id, title } = item;
            let { sole } = STREAMER;

            Cache.load(['AutoClaimRewards'], async({ AutoClaimRewards }) => {
                AutoClaimRewards ??= {};

                let itemIDs = (AutoClaimRewards[sole] ??= []);
                let index = itemIDs.indexOf(rewardID);

                if(!~index)
                    return /* reward not asked for... */;

                RECORD_PURCHASE({ fromUser: false, element, message, subject, mentions, AutoClaimRewards });

                // @performance
                PrepareForGarbageCollection(AutoClaimRewards);
            });
        };
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
        TTV_DROPS_REFRESHER,
        TTV_DROPS_CLAIMED = new Set;

    Handlers.claim_drops = () => {
        TTV_DROPS_FRAME = furnish('iframe#tt-drops-claimer[src="/drops/inventory"]', { style: 'display:none!important' });

        $.body.append(TTV_DROPS_FRAME);

        (TTV_DROPS_CHECKER = btn_str => {
            when(() => $.defined(btn_str, TTV_DROPS_FRAME.contentDocument)).then(() => {
                let claimed = 0;

                $.all(btn_str, TTV_DROPS_FRAME.contentDocument).map(btn => {
                    if(TTV_DROPS_CLAIMED.has(getDOMPath(btn, -2)))
                        return;
                    TTV_DROPS_CLAIMED.add(getDOMPath(btn, -2));

                    ++claimed;
                    btn.click();
                });

                let error = $('.tw-alert-banner', TTV_DROPS_FRAME.contentDocument)?.innerText ?? '';

                if(claimed > 0) {
                    claimed = [claimed, 'drop'.pluralSuffix(claimed)].join(' ');

                    if(error.length > 0)
                        alert.timed(`An error occurred while trying to claim ${ claimed }`, 7000);
                    else
                        alert.timed(`Claimed ${ claimed }!`, 7000);
                }
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
    if(UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.claim_drops)) {
        $remark('Creating Drop claimer...');

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

    let ALREADY_RESTORING_DEAD_CHANNEL = false;

    // Restart the First in line que's timers
        // REDO_FIRST_IN_LINE_QUEUE(url:string?<URL>, search:object?) → <Promise>?undefined
    top.REDO_FIRST_IN_LINE_QUEUE =
    async function REDO_FIRST_IN_LINE_QUEUE(url, search = null) {
        if(nullish(url) || (FIRST_IN_LINE_HREF === url && [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].filter(nullish).length < 1))
            return;
        else if(nullish(search))
            url = parseURL(url).addSearch(location.search);
        else
            url = parseURL(url).addSearch(search);

        let { href, pathname } = url,
            name = pathname.slice(1),
            channel = await(null
                ?? ALL_CHANNELS.find(channel => channel.name.equals(name))
                ?? new Search(name).then(Search.convertResults)
            );

        if(nullish(channel))
            return $error(`Unable to create job for "${ href }"`);

        [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

        FIRST_IN_LINE_HREF = href;
        GetNextStreamer.cachedStreamer = channel;
        name = (channel.name?.equals(name)? channel.name: name);

        if(!ALL_FIRST_IN_LINE_JOBS.filter(href => href?.length).length)
            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

        $log(`[Queue Redo] Waiting ${ toTimeString(GET_TIME_REMAINING() | 0) } before leaving for "${ name }" → ${ href }`, new Date);

        FIRST_IN_LINE_WARNING_JOB = setInterval(async() => {
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

            $log('Heading to stream in', toTimeString(timeRemaining), FIRST_IN_LINE_HREF, new Date);

            let url = parseURL(FIRST_IN_LINE_HREF);

            if(nullish(url.pathname))
                return /* Unknown job */;

            let { name } = await GetNextStreamer();

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

                    $notice(`Heading to Up Next channel (confirmation):`, removed);

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
                            $log('Canceled First in Line event', FIRST_IN_LINE_HREF);

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

            if(nullish(channel) && !ALREADY_RESTORING_DEAD_CHANNEL) {
                if(nullish(FIRST_IN_LINE_HREF))
                    return;

                $log('Restoring dead channel (interval)...', FIRST_IN_LINE_HREF);

                let { href, pathname } = parseURL(FIRST_IN_LINE_HREF),
                    channelID = UUID.from(pathname).value;

                if(nullish(pathname))
                    return;
                ALREADY_RESTORING_DEAD_CHANNEL = true;

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

                        ALREADY_RESTORING_DEAD_CHANNEL = false;
                        ALL_CHANNELS = [...ALL_CHANNELS, restored].filter(defined).filter(uniqueChannels);
                        ALL_FIRST_IN_LINE_JOBS[index] = restored;
                    })
                    .catch(error => {
                        ALL_FIRST_IN_LINE_JOBS = ALL_FIRST_IN_LINE_JOBS.map(url => url?.toLowerCase?.()).isolate().filter(url => url?.length).filter(url => parseURL(url).pathname != parseURL(FIRST_IN_LINE_HREF).pathname);
                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                        Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                            $warn(error);
                        });
                    });
            }

            // Don't act until 1sec is left
            if(timeRemaining > 1000)
                return;

            /* After above is `false` */

            Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(), ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS = ALL_FIRST_IN_LINE_JOBS.filter(url => parseURL(url).pathname.toLowerCase() != parseURL(FIRST_IN_LINE_HREF).pathname.toLowerCase()) }, (href = parseURL(channel?.href ?? FIRST_IN_LINE_HREF).addSearch({ ...(parseURL(FIRST_IN_LINE_HREF).searchParameters ?? {}) }).href) => {
                $log('Heading to stream now [Job Interval]', href);

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

    FIRST_IN_LINE_SAFETY_CATCH =
    setInterval(() => {
        let job = $('[up-next--body] [name][time]');

        if(nullish(job))
            return;

        let timeRemaining = parseInt(job.getAttribute('time'));

        if(timeRemaining <= 60_000 && nullish('.tt-confirm'))
            wait(60_000).then(() => {
                $warn(`Mitigation for Up Next: Loose interval @ ${ location } / ${ new Date }`)
                    // .toNativeStack();

                let { name } = GetNextStreamer.cachedStreamer;

                confirm
                    .timed(`Coming up next: <a href='./${ name }'>${ name }</a>`, timeRemaining)
                    .then(action => {
                        if(nullish(action))
                            return /* The event timed out... */;

                        // Does NOT touch the cache

                        if(action) {
                            // The user clicked "OK"

                            goto(parseURL(`./${ name }`).addSearch({ tool: `up-next--ok` }).href);
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

            // Pin: Go to this person when the stream(s) end
            let pinned_button = FIRST_IN_LINE_BALLOON?.addButton({
                attributes: {
                    id: 'pinned-streamer',
                    contrast: THEME__PREFERRED_CONTRAST,
                },

                icon: 'pinned',
                onclick: async event => {
                    let { currentTarget } = event,
                        parent = currentTarget.closest('[id^="tt-balloon-container"i]');

                    let f = furnish;
                    let body = $('#tt-reminder-listing'),
                        search = $('#tt-pinned-search');

                    if(defined(body))
                        return body?.remove();
                    else
                        body = f(`#tt-reminder-listing`);

                    search = f(`input#tt-pinned-search.input.autocomplete[autocomplete=false][spellcheck=false][placeholder="Search for a streamer, game or description here... Esc to exit"]`, {
                        style: 'margin-top:1px',
                        onkeyup: delay(async event => {
                            let { target, code, altKey, ctrlKey, metaKey, shiftKey } = event,
                                value = (target?.value ?? target?.textContent ?? target?.innerText ?? "").trim();

                            let terms = value.split(/\s+/).map(term => ['name', 'game', 'desc'].map(type => `[${ type }*="${ term }"i]`).join(','));

                            if(value.length)
                                AddCustomCSSBlock(target.id, `#${ target.id }-form ~ :not(${ terms.join(',') }) { display: none }`);
                            else
                                RemoveCustomCSSBlock(target.id);
                            target.setAttribute('value', value);
                        }, 250),
                    });

                    body.with(
                        f(`form#${ search.id }-form[action=#]`, { style: 'position:sticky; top:4rem; z-index:99999' })
                            .with(search)
                    );

                    let SearchableNames = new Set(ALL_CHANNELS.map(c => c.name));
                    let WantedNames = new Set(STREAMERS.map(c => c.name));

                    Cache.load('LiveReminders', async({ LiveReminders }) => {
                        try {
                            LiveReminders = JSON.parse(LiveReminders || '{}');
                        } catch(error) {
                            // Probably an object already...
                            LiveReminders ??= {};
                        }

                        for(let { name } in LiveReminders) {
                            SearchableNames.add(name);
                            WantedNames.add(name);
                        }

                        // https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_autocomplete

                        // @performance
                        PrepareForGarbageCollection(LiveReminders);
                    });

                    parent.insertBefore(body, $('[up-next--body] > :nth-child(2)'));

                    listing:
                    for(let name of SearchableNames) {
                        if(nullish(name))
                            continue listing;

                        let channel = (null
                            ?? ALL_CHANNELS.find(c => c.name.equals(name))
                            ?? await new Search(name).then(Search.convertResults)
                        );

                        if(nullish(channel))
                            continue listing;

                        let _name = name.toLowerCase();
                        let { icon, live } = channel;
                        let pinned = parseBool(GetNextStreamer.pinnedStreamer?.equals(name));
                        let wanted = WantedNames.has(name);

                        let desc = (STREAMER.jump?.[_name]?.title ?? '');
                        let game = (STREAMER.jump?.[_name]?.stream?.game?.name ?? '');

                        autocomplete(search, { [name]: [name, game, desc].filter(s => s.length).join(' - ') });

                        let imgSize = '70px';

                        let container = f(`.tt-pinnable`, { name, game, desc, live, style: `animation:fade-in 1s 1; background:var(--color-background-${ pinned? 'chat': 'base' })` },
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

                                                        '@pinned': pinned,
                                                        '@name': name,
                                                        '@icon': icon,
                                                        'href': `#\uD83D\uDCCC${ name }`,

                                                        onmouseup({ currentTarget }) {
                                                            let pinned;

                                                            if(parseBool(currentTarget.dataset.pinned)) {
                                                                pinned = currentTarget.dataset.pinned = false;
                                                                delete GetNextStreamer.pinnedStreamer;
                                                                $('#pinned-streamer').innerHTML = Glyphs.pinned;

                                                                currentTarget.closest('.tt-pinnable').modStyle(`background:var(--color-background-base);`);
                                                                $('.tt-balloon-message strong', currentTarget).modStyle(`color:!delete`);
                                                                $('.tt-footer', currentTarget).html(``);

                                                                Cache.remove(['PinnedStreamer']);
                                                            } else {
                                                                if(defined(GetNextStreamer.pinnedStreamer)) {
                                                                    let pidged = $(`.tt-pinnable [data-name="${ GetNextStreamer.pinnedStreamer }"i]`);

                                                                    pidged.dataset.pinned = false;
                                                                    pidged.closest('.tt-pinnable').modStyle(`background:var(--color-background-base);`);
                                                                    $('.tt-balloon-message strong', pidged).modStyle(`color:!delete`);
                                                                    $('.tt-footer', pidged).html(``);
                                                                }

                                                                pinned = currentTarget.dataset.pinned = true;
                                                                GetNextStreamer.pinnedStreamer = currentTarget.dataset.name;
                                                                $('#pinned-streamer').innerHTML = furnish(`.tt-border-radius-rounded`).with(furnish.img({ src: currentTarget.dataset.icon, style: `min-width:calc(${ imgSize }/2); border-radius:${ imgSize }` })).outerHTML;

                                                                currentTarget.closest('.tt-pinnable').modStyle(`background:var(--color-background-chat);`);
                                                                $('.tt-balloon-message strong', currentTarget).modStyle(`color:var(--color-amazon)`);
                                                                $('.tt-footer', currentTarget).html(`Pinned. Will go to when needed`);

                                                                Cache.save({ PinnedStreamer: GetNextStreamer.pinnedStreamer });
                                                            }
                                                        },
                                                    },
                                                    f('.persistent-notification__area.tt-flex.tt-flex-nowrap.tt-pd-b-1.tt-pd-l-1.tt-pd-r-3.tt-pd-t-1').with(
                                                        // Avatar
                                                        f.div(
                                                            f('.tt-border-radius-rounded.tt-card-img.tt-card-img--size-4.tt-flex-shrink-0.tt-overflow-hidden').with(
                                                                f('.tt-aspect.tt-aspect--align-top').with(
                                                                    f('img.tt-balloon-avatar.tt-image', { src: icon, style: `min-width:${ imgSize }` })
                                                                )
                                                            )
                                                        ),
                                                        // Message body
                                                        f('.tt-flex.tt-flex-column.tt-flex-nowrap.tt-mg-x-1', { style: `max-width:calc(100% - ${ imgSize })` }).with(
                                                            f('.persistent-notification__body.tt-overflow-hidden[@testSelector=persistent-notification__body]').with(
                                                                f('span.tt-c-text-alt').with(
                                                                    f('p.tt-balloon-message').with(
                                                                        f.span(
                                                                            f(`strong`, { innerHTML: `${ name } `, style: (pinned? 'color:var(--color-amazon)': '') }),
                                                                            f(`span.tt-${ (live? 'live': 'offline') }`, {
                                                                                style: `min-width:3.5em; background-color:var(--color-background-${ (live? 'live': 'alt-2') }) }`
                                                                            }, (wanted? live? 'live': 'offline': 'suggested').toUpperCase())
                                                                        )
                                                                    )
                                                                )
                                                            ),
                                                            // Subheader
                                                            f('.tt-align-items-center.tt-flex.tt-flex-shrink-0.tt-mg-t-05', { style: `max-width:100%` }).with(
                                                                f('.tt-mg-l-05', { style: `max-width:inherit` }).with(
                                                                    f(`p.tt-hide-text-overflow`, { style: `text-indent:.25em; max-width:inherit` }).setTooltip(desc, { from: 'top' }).with(desc)
                                                                )
                                                            ),
                                                            // Footer (persistent)
                                                            f('.tt-footer').with(
                                                                `Click to ${ pinned? 'un': '' }pin ${ name }`
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

                        if(pinned)
                            search.insertAdjacentElement('afterend', container);
                        else
                            body.append(container);
                    }
                },
            });

            pinned_button.tooltip = new Tooltip(pinned_button, 'Pin a user to go to when the queue is <em>empty</em> and <em>offline</em>');

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
                    currentTarget.querySelector('svg[fill]')?.modStyle(`opacity:${ 2**-!speeding }; fill:currentcolor`);
                    currentTarget.setAttribute('speeding', speeding);

                    if(defined(currentTarget.tooltip))
                        currentTarget.tooltip.innerHTML = `${ ['Start','Stop'][+speeding] } rushing the queue`;

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
                        currentTarget.tooltip.innerHTML = `${ ['Pause','Resume'][+paused] } the queue`;
                },
            });

            // Live Reminders: Lists the live reminders onclick
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
                            head = $('[up-next--header]'),
                            search = $('#tt-reminder-search');

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

                        if(Object.keys(LiveReminders).length > 6) {
                            search = f(`input#tt-reminder-search.input.autocomplete[autocomplete=false][spellcheck=false][placeholder="Search for a streamer, game or description here... Esc to exit"]`, {
                                style: 'margin-top:1px',
                                onkeyup: delay(async event => {
                                    let { target, code, altKey, ctrlKey, metaKey, shiftKey } = event,
                                        value = (target?.value ?? target?.textContent ?? target?.innerText ?? "").trim();

                                    let terms = value.split(/\s+/).map(term => ['name', 'game', 'desc'].map(type => `[${ type }*="${ term }"i]`).join(','));

                                    if(value.length)
                                        AddCustomCSSBlock(target.id, `#${ target.id }-form ~ :not(${ terms.join(',') }) { display: none }`);
                                    else
                                        RemoveCustomCSSBlock(target.id);
                                    target.setAttribute('value', value);
                                }, 250),
                            });

                            // https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_autocomplete

                            autocomplete(search, LiveReminders);

                            body.with(
                                f(`form#${ search.id }-form[action=#]`, { style: 'position:sticky; top:4rem; z-index:99999' })
                                    .with(search)
                            );
                        }

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
                            let channel = await new Search(name).then(Search.convertResults),
                                ok = parseBool(channel?.ok);

                            // Search did not complete...
                            let num = 3;
                            while(!ok && num-- > 0 && $.defined(`#tt-reminder-listing`)) {
                                delete channel;

                                Search.void(name);

                                // @research
                                channel = await new Search(name).then(Search.convertResults);
                                ok = parseBool(channel?.ok);

                                // $warn(`Re-search, ${ num } ${ 'retry'.pluralSuffix(num) } left [Catalog]: "${ name }" → OK = ${ ok }`);
                            }

                            if(!num && !ok) {
                                channel = ALL_CHANNELS.find(channel => channel.name.equals(name));

                                if(nullish(channel?.name))
                                    continue listing;
                            }

                            let [amount, fiat, face, notEarned, pointsToEarnNext] = (ChannelPoints[name] ?? 0).toString().split('|'),
                                sole = face?.split('/')?.map(parseFloat)?.shift();

                            // Correct for changed usernames
                            if(!ok) try {
                                let definitiveID = await new Search(name, 'sniffer', 'getID');

                                if(nullish(definitiveID)) {
                                    let real = await new Search(sole, 'sniffer', 'getName');

                                    $warn(`Updating details about (#${ sole }) "${ name }" → "${ real }"`);

                                    // Correct the cache...
                                    Cache.load(`data/${ name }`, cache => {
                                        Cache.save({ [`data/${ real }`]: cache[`data/${ name }`] });
                                        Cache.remove(`data/${ name }`);
                                    });

                                    // Correct the channel points...
                                    ChannelPoints[real] = ChannelPoints[name];
                                    delete ChannelPoints[name];

                                    Cache.save({ ChannelPoints });

                                    // Correct the live reminders...
                                    LiveReminders[real] = LiveReminders[name];
                                    delete LiveReminders[name];

                                    Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));

                                    // Continue with the new name...
                                    reminders.push({ name: real, time });

                                    // @performance
                                    PrepareForGarbageCollection(LiveReminders);
                                    continue listing;
                                }
                            } catch(error) {
                                // Continue with the bad data?
                                if(nullish(channel))
                                    continue listing;
                            }

                            // Legacy reminders... | v4.26 → v4.27
                            let legacy = +now < +time;

                            if(nullish(channel))
                                continue listing;

                            let real = new Date(channel.data?.actualStartTime || 0);

                            let day = time.toLocaleDateString(top.LANGUAGE, { dateStyle: 'short' }),
                                hour = time.toLocaleTimeString(top.LANGUAGE, { timeStyle: 'short' }),
                                recent = (abs(+now - +time) / 3_600_000 < 24),
                                live = (+real > +time) || await new Search(name, 'channel', 'status.live'),
                                [since] = toTimeString((live && time < now? now - time: abs(now - time)), '~hour hour|~minute minute|~second second').split('|').filter(parseFloat),
                                [tense_A, tense_B] = [['',' ago'],['in ','']][+legacy];

                            let _name = name.toLowerCase();
                            let { href = `./${ _name }`, icon = Runtime.getURL('profile.png'), desc = (STREAMER.jump?.[_name]?.title ?? '') } = channel;
                            let coinStyle = new CSSObject({ verticalAlign: 'bottom', height: '20px', width: '20px' }),
                                coinText =
                                    furnish('span.tt-live-reminder-point-amount[bottom-only]', {
                                        'rainbow-border': notEarned == 0,
                                        innerHTML: amount.replace('.0', '').toLocaleString(LANGUAGE),
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

                            if((game || desc)?.length)
                                autocomplete(search, { [name]: [name, game, desc].filter(s => s.length).join(' - ') });

                            let imgSize = '70px';

                            let container = f(`.tt-reminder`, { name, game, desc, live, style: `animation:fade-in 1s 1; background:var(--color-background-base)` },
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
                                                                        f('img.tt-balloon-avatar.tt-image', { src: icon, style: `min-width:${ imgSize }` })
                                                                    )
                                                                )
                                                            ),
                                                            // Message body
                                                            f('.tt-flex.tt-flex-column.tt-flex-nowrap.tt-mg-x-1', { style: `max-width:calc(100% - ${ imgSize })` }).with(
                                                                f('.persistent-notification__body.tt-overflow-hidden[@testSelector=persistent-notification__body]').with(
                                                                    f('span.tt-c-text-alt').with(
                                                                        f('p.tt-balloon-message').with(
                                                                            !live?
                                                                                f.strong(name):
                                                                            f.span(
                                                                                f(`strong`, { innerHTML: [name, game].filter(s => s.length).join(' &mdash; ') }),
                                                                                f(`span.tt-time-elapsed[start=${ (+real > +time? real: time).toJSON() }]`).with(hour),
                                                                                f(`p.tt-hide-text-overflow[style=text-indent:.25em]`).setTooltip(desc, { from: 'top' }).with(desc)
                                                                            )
                                                                        )
                                                                    )
                                                                ),
                                                                // Subheader
                                                                f('.tt-align-items-center.tt-flex.tt-flex-shrink-0.tt-mg-t-05', { style: `max-width:100%` }).with(
                                                                    f('.tt-mg-l-05', { style: `max-width:inherit` }).with(
                                                                        f('span.tt-balloon-subheader.tt-c-text-alt', { style: `max-width:inherit` }).html([status, coinIcon + coinText].join(' &bull; '))
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

                                                                    onmouseup: event => {
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
                                                                                    // The user pressed "Cancel"
                                                                                    if(ok === false)
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
                                                                        }
                                                                    )
                                                                )
                                                            ).setTooltip(`Remove ${ name } from Live Reminders`, { from: 'top' })
                                                        )
                                                    ),
                                                    f('.persistent-notification__popout.tt-absolute.tt-pd-l-1', { style: `top:2.5rem; right:0` },
                                                        f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                                            f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__popout]',
                                                                {
                                                                    name,

                                                                    onmouseup: event => {
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
                                                                        }
                                                                    )
                                                                )
                                                            ).setTooltip(`Send to MiniPlayer`, { from: 'top' })
                                                        )
                                                    ),
                                                    (
                                                        parseBool(Settings.video_clips__dvr)?
                                                            f('.persistent-notification__popout.tt-absolute.tt-pd-l-1', { style: `top:5rem; right:0` },
                                                                f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                                                    f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__popout]',
                                                                        {
                                                                            name,

                                                                            onmouseup: event => {
                                                                                let { currentTarget } = event,
                                                                                    name = currentTarget.getAttribute('name');

                                                                                Cache.load('DVRChannels', async({ DVRChannels }) => {
                                                                                    try {
                                                                                        DVRChannels = JSON.parse(DVRChannels || '{}');
                                                                                    } catch(error) {
                                                                                        // Probably an object already...
                                                                                        DVRChannels ??= {};
                                                                                    }

                                                                                    let s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"),
                                                                                        DVR_ID = name.toLowerCase(),
                                                                                        enabled = !parseBool(DVRChannels[DVR_ID]?.length),
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
                                                                                    Cache.save({ DVRChannels }, () => Settings.set({ 'DVR_CHANNELS': Object.keys(DVRChannels) }).then(() => parseBool(message) && alert.timed(message, 7000)).catch($warn));
                                                                                });
                                                                            },
                                                                        },
                                                                        f('span.tt-button-icon__icon').with(
                                                                            f('div',
                                                                                {
                                                                                    style: 'height:1.6rem; width:1.6rem',
                                                                                    innerHTML: Glyphs.modify(['host','clip'][+DVR_ON], { style: `fill:${ ['currentcolor','#f59b00'][+DVR_ON] }` }),
                                                                                }
                                                                            )
                                                                        )
                                                                    ).setTooltip(`${ ['Start', 'Stop'][+DVR_ON] } recording ${ name }'${ /s$/.test(name)? '': 's' } streams`, { from: 'top' })
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
                                [firstOffline] = $.all('.tt-reminder[live="false"i]', body);

                            if(defined(firstOffline) && live)
                                firstOffline.insertAdjacentElement('beforebegin', container);
                            else if(defined(lastOnline) && live)
                                lastOnline.insertAdjacentElement('afterend', container);
                            else
                                body.append(container);

                            // Update to the new date...
                            if(+real > +time)
                                LiveReminders[name].time = real;

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
                            Cache.save({ LiveReminders, DVRChannels }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders), 'DVR_CHANNELS': Object.keys(DVRChannels) }));

                        // @performance
                        PrepareForGarbageCollection(LiveReminders, ChannelPoints, DVRChannels);
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
                let thematicColor = Color.getName(THEME.equals('dark')? THEME__CHANNEL_DARK: THEME__CHANNEL_LIGHT);
                let textShadow = (['black', 'white'].contains(thematicColor)? `text-shadow:0 0 2px ${ THEME.equals('dark')? 'black': 'white' }`: '');

                // Swap to correct :P
                thematicColor = ({ black: 'white', white: 'black' }[thematicColor]) ?? thematicColor;

                first_in_line_help_button.tooltip.innerHTML = (
                    UP_NEXT_ALLOW_THIS_TAB?
                        `Drop a channel in the <span style="color:var(--user-accent-color); ${ textShadow }">${ colorName }</span> area to queue it`:
                    `Up Next is disabled for this tab`
                ).replace(/\bcolored\b/g, () => thematicColor);
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

                    $remark(`Up Next Boost is enabled → Waiting ${ toTimeString(GET_TIME_REMAINING() | 0) } before leaving for "${ parseURL(FIRST_IN_LINE_HREF).pathname?.slice(1) }"`);
                } else {
                    $remark(`Up Next Boost is disabled`);
                }

                // Up Next Boost
                first_in_line_boost_button.setAttribute('speeding', FIRST_IN_LINE_BOOST);
                first_in_line_boost_button.querySelector('svg[fill]')?.setAttribute('fill', '');
                first_in_line_boost_button.querySelector('svg[fill]')?.modStyle(`opacity:${ 2**-!FIRST_IN_LINE_BOOST }; fill:currentcolor`);
                first_in_line_boost_button.tooltip ??= new Tooltip(first_in_line_boost_button, `${ ['Start','Stop'][FIRST_IN_LINE_BOOST | 0] } rushing the queue`);

                let up_next_button = $('[up-next--container] button');

                up_next_button?.setAttribute('allowed', parseBool(UP_NEXT_ALLOW_THIS_TAB));
                up_next_button?.setAttribute('speeding', parseBool(FIRST_IN_LINE_BOOST));

                // Pause
                first_in_line_pause_button.tooltip ??= new Tooltip(first_in_line_pause_button, `Pause the queue`);
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
                    return $error(`Unknown [ondrop] text: "${ text }"`);

                if(!/^tv\.twitch/i.test(domainPath.join('.')) || RESERVED_TWITCH_PATHNAMES.test(pathname))
                    return $warn(`Unable to add link to Up Next "${ href }"`);

                streamer = await(null
                    ?? ALL_CHANNELS.find(channel => parseURL(channel.href).pathname.equals('/' + name))
                    ?? (null
                        ?? new Search(name).then(Search.convertResults)
                        ?? Promise.reject(`Unable to perform search for "${ name }"`)
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
                        .catch($warn)
                );

                $log('Adding to Up Next [ondrop]:', { href, streamer });

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
                                    name,
                                });

                                ALL_CHANNELS = [...ALL_CHANNELS, restored].filter(defined).filter(uniqueChannels);
                            });
                }

                // Jobs are unknown. Restart timer
                if(ALL_FIRST_IN_LINE_JOBS.length < 1)
                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                // $log('Accessing here... #1');
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

                tooltip.modStyle('display:block');
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
                    // $log('Old array', [...ALL_FIRST_IN_LINE_JOBS]);

                    let [moved] = ALL_FIRST_IN_LINE_JOBS.splice(--oldIndex, 1);
                    ALL_FIRST_IN_LINE_JOBS.splice(--newIndex, 0, moved);
                    ALL_FIRST_IN_LINE_JOBS = ALL_FIRST_IN_LINE_JOBS.filter(defined);

                    // $log('New array', [...ALL_FIRST_IN_LINE_JOBS]);
                    // $log('Moved', { oldIndex, newIndex, moved });

                    let channel = ALL_CHANNELS.find(channel => RegExp(parseURL(channel.href).pathname + '\\b', 'i').test(moved));

                    if(nullish(channel))
                        return $warn('No channel found:', { oldIndex, newIndex, desiredChannel: channel, givenChannel: moved });

                    // This controls the new due date `NEW_DUE_DATE(time)` when the user drags a channel to the first position
                        // To create a new due date, `NEW_DUE_DATE(time)` → `NEW_DUE_DATE()`
                    if([oldIndex, newIndex].contains(0)) {
                        // `..._TIMER = ` will continue the queue (as if nothing changed) when a channel is removed
                        let first = ALL_CHANNELS.find(channel => RegExp(parseURL(channel.href).pathname + '\\b', 'i').test(FIRST_IN_LINE_HREF = ALL_FIRST_IN_LINE_JOBS[0]));
                        let time = /* FIRST_IN_LINE_TIMER = */ parseInt($(`[name="${ first?.name ?? '' }"i]`)?.getAttribute('time'));

                        $log('New First in Line event:', { ...first, time });

                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);
                    }

                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0].href);
                    // $log('Redid First in Line queue [Sorting Handler]...', { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME, FIRST_IN_LINE_HREF });

                    Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
                },
            });

            if(Settings.first_in_line_none)
                FIRST_IN_LINE_BALLOON.container.modStyle('display:none!important');
            else
                FIRST_IN_LINE_LISTING_JOB ??= setInterval(async() => {
                    // Set the opacity...
                    // FIRST_IN_LINE_BALLOON.container.modStyle(`opacity:${ (UP_NEXT_ALLOW_THIS_TAB? 1: 0.75) }!important`);

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

                                $notice(`Removed from Up Next via Sorting Handler (${ nth(index + 1, 'ordinal-position') }):`, removed, 'Was it canceled?', event.canceled);

                                if(event.canceled)
                                    DO_NOT_AUTO_ADD.push(removed);
                                // Balloon.onremove
                                REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: parseBool(parseURL(removed).searchParameters?.redo) });

                                if(index > 0) {
                                    Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => event.callback(event.element));
                                } else {
                                    $log('Destroying current job [Job Listings]...', { FIRST_IN_LINE_HREF, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME });

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
                                if(container.hasAttribute('time-ctrl'))
                                    return -1;
                                container.setAttribute('time-ctrl', true);

                                return setInterval(async() => {
                                    new StopWatch('up_next_balloon__subheader_timer_animation');

                                    let controller = getDOMPath(container);
                                    let timeRemaining = GET_TIME_REMAINING();

                                    timeRemaining = timeRemaining < 0? 0: timeRemaining;

                                    /* First in Line is paused */
                                    if(FIRST_IN_LINE_PAUSED) {
                                        // $remark('Adding time... Subheader Animation');
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
                                        container.setAttribute('href', href);

                                        REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                                        Cache.save({ ALL_FIRST_IN_LINE_JOBS });
                                    }

                                    if(time < 60_000 && nullish(FIRST_IN_LINE_HREF)) {
                                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);

                                        $warn('Creating job to avoid [Job Listing] mitigation event', channel);

                                        return StopWatch.stop('up_next_balloon__subheader_timer_animation', 1000), REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = channel.href);
                                    }

                                    if(time < 1000)
                                        wait(5000, [container, intervalID]).then(([container, intervalID]) => {
                                            $log('Mitigation event for [Job Listings]', { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_HREF }, new Date);
                                            // Mitigate 0 time bug?

                                            Cache.save({ ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS.filter(href => parseURL(href).pathname.unlike(parseURL(FIRST_IN_LINE_HREF).pathname)), FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE() }, () => {
                                                $warn(`Timer overdue [animation:first-in-line-balloon--initializer] » ${ FIRST_IN_LINE_HREF }`)
                                                    // .toNativeStack();

                                                goto(FIRST_IN_LINE_HREF);
                                            });

                                            return clearInterval(intervalID);
                                        });

                                    container.setAttribute('time', time - (index > 0? 0: 1000));

                                    if(container.getAttribute('index') != index)
                                        container.setAttribute('index', index);

                                    let theme = { light: 'w', dark: 'b' }[THEME];

                                    $('a', container)
                                        .modStyle(`background-color: var(--color-opac-${ theme }-${ index > 15? 1: 15 - index })`);

                                    if(container.getAttribute('live') != (live + '')) {
                                        $('.tt-balloon-message', container).innerHTML =
                                            `${ name } <span style="display:${ live? 'none': 'inline-block' }">is not live</span>`;
                                        container.modStyle(`opacity: ${ 2**-!live }!important`);
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

    Handlers.first_in_line = async(ActionableNotification, preferredPlace) => {
        new StopWatch('first_in_line');

        let notifications = [...$.all('[data-test-selector*="notifications"i] [data-test-selector*="notification"i]'), ActionableNotification].filter(defined);

        preferredPlace ??= 'last';

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

            $log('Received an actionable notification:', innerText, new Date);

            let ALL_JOBS_PREFERENCE_SORTED = (preferredPlace.toString().anyOf('begin', 'beginning', 'first', 'head', 'start', '0', '1', '^')? [href, ...ALL_FIRST_IN_LINE_JOBS]: [...ALL_FIRST_IN_LINE_JOBS, href]);

            if(defined(FIRST_IN_LINE_HREF ??= ALL_FIRST_IN_LINE_JOBS[0])) {
                if([...ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_HREF].missing(href)) {
                    $log('Pushing to First in Line:', href, new Date);

                    // $log('Accessing here... #2');
                    ALL_FIRST_IN_LINE_JOBS = ALL_JOBS_PREFERENCE_SORTED.map(url => url?.toLowerCase?.()).isolate().filter(url => url?.length);
                } else {
                    $warn('Not pushing to First in Line:', href, new Date);
                    $log('Reason(s):', [FIRST_IN_LINE_JOB, ...ALL_FIRST_IN_LINE_JOBS],
                        `It is the next job? ${ ['No', 'Yes'][+(FIRST_IN_LINE_HREF === href)] }`,
                        `It is in the queue already? ${ ['No', 'Yes'][+(ALL_FIRST_IN_LINE_JOBS.contains(href))] }`
                    );
                }

                // To wait, or not to wait
                Cache.save({ ALL_FIRST_IN_LINE_JOBS });

                continue;
            } else {
                $log('Pushing to First in Line (no contest):', href, new Date);

                // Add the new job...
                // $log('Accessing here... #3');
                ALL_FIRST_IN_LINE_JOBS = ALL_JOBS_PREFERENCE_SORTED.map(url => url?.toLowerCase?.()).isolate().filter(url => url?.length);
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

                        $notice(`Removed from Up Next via Balloon (${ nth(index + 1, 'ordinal-position') }):`, removed, 'Was it canceled?', event.canceled);

                        if(event.canceled)
                            DO_NOT_AUTO_ADD.push(removed);
                        // AddBalloon.onremove
                        REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: parseBool(parseURL(removed).searchParameters?.redo) });

                        if(index > 0) {
                            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => event.callback(event.element));
                        } else {
                            $log('Destroying current job [First in Line]...', { FIRST_IN_LINE_HREF, FIRST_IN_LINE_DUE_DATE });

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
                        if(container.hasAttribute('time-ctrl'))
                            return -1;
                        container.setAttribute('time-ctrl', true);

                        return setInterval(async() => {
                            new StopWatch('first_in_line__job_watcher');

                            let timeRemaining = GET_TIME_REMAINING();

                            timeRemaining = timeRemaining < 0? 0: timeRemaining;

                            /* First in Line is paused */
                            if(FIRST_IN_LINE_PAUSED) {
                                // $remark('Adding time... Job Watcher');
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
                                container.setAttribute('href', href);

                                REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                                Cache.save({ ALL_FIRST_IN_LINE_JOBS });
                            }

                            if(time < 60_000 && nullish(FIRST_IN_LINE_HREF)) {
                                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);

                                $warn('Creating job to avoid [First in Line] mitigation event', channel);

                                return StopWatch.stop('first_in_line__job_watcher', 1000), REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = channel.href);
                            }

                            if(time < 1000)
                                wait(5000, [container, intervalID]).then(([container, intervalID]) => {
                                    $log('Mitigation event from [First in Line]', { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_HREF }, new Date);
                                    // Mitigate 0 time bug?

                                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
                                    Cache.save({ ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS.filter(href => parseURL(href).pathname.unlike(parseURL(FIRST_IN_LINE_HREF).pathname)), FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE() }, () => {
                                        $warn(`Timer overdue [animation:first-in-line-balloon] » ${ FIRST_IN_LINE_HREF }`)
                                            // .toNativeStack();

                                        goto(FIRST_IN_LINE_HREF);
                                    });

                                    return clearInterval(intervalID);
                                });

                            container.setAttribute('time', time - (index > 0? 0: 1000));

                            if(container.getAttribute('index') != index)
                                container.setAttribute('index', index);

                            let theme = { light: 'w', dark: 'b' }[THEME];

                            $('a', container)
                                .modStyle(`background-color: var(--color-opac-${ theme }-${ index > 15? 1: 15 - index })`);

                            if(container.getAttribute('live') != (live + '')) {
                                $('.tt-balloon-message', container).innerHTML =
                                    `${ name } <span style="display:${ live? 'none': 'inline-block' }">is not live</span>`;
                                container.modStyle(`opacity: ${ 2**-!live }!important`);
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
                    $log('Redid First in Line queue [First in Line]...', { FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME, FIRST_IN_LINE_HREF });
                } else if(Settings.first_in_line_none) {
                    $log('Heading to stream now [First in Line] is OFF', FIRST_IN_LINE_HREF);

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

        if(UnregisterJob.__reason__.anyOf('default', 'reinit', 'job-destruction'))
            return;

        // Wait 5s before deleteing everything...
        // If the usr has turned the setting off, it'll still go thru; however, if if page is reloaded too fast nothing will happen
        wait(5_000).then(() => {
            if(defined(FIRST_IN_LINE_HREF))
                FIRST_IN_LINE_HREF = '?';

            ALL_FIRST_IN_LINE_JOBS = [];
            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
        });
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
        if(true
            && parseBool(parseURL(top.location).searchParameters?.redo)
            && top.location.pathname.equals(`/${ STREAMER.name }`)
            && STREAMER.live
        )
            Handlers.first_in_line({ href: top.location.href, innerText: `${ STREAMER.name } is live [Entry Redo]` });

        // Put a rainbow around repeating entries...
        setInterval(() =>
            $.all('[id^="tt-balloon"i][name][live][href*="redo"i]').map(el => {
                let { searchParameters } = parseURL(el.getAttribute('href'));
                let redo = parseBool(searchParameters?.redo);

                if(parseBool(el.getAttribute('rainbow-border')) != redo) {
                    el.setAttribute('rainbow-border', redo);

                    $('.tt-redo-btn svg', el).modStyle(
                        redo?
                            'animation: 1s linear 0s infinite normal none running spinner':
                        'animation: !delete'
                    );
                }
            })
        , 100);

        // Restart the timer if the user navigates away from the page
        top.onlocationchange = ({ from, to }) => {
            if(from == to)
                return;

            $remark('Resetting timer. Location change detected:', { from, to });

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

                $log('Restoring dead channel (initializer)...', dead);

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

                            $notice(`Necromancy work:`, removed);

                            // Necromancer
                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: parseBool(parseURL(removed).searchParameters?.redo) });

                        Cache.save({ ALL_FIRST_IN_LINE_JOBS }, () => {
                            $warn(`Unable to perform search for "${ name }" - ${ error }`, removed);
                        });
                    });

                break __FirstInLine__;
            } else if(!first) {
                // Handlers.first_in_line({ href, innerText: `${ channel.name } is live [First in Line]` });

                // $warn('Forcing queue update for', href);
                REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = href);
            } else if(first) {
                let [removed] = ALL_FIRST_IN_LINE_JOBS.splice(0, 1),
                    name = parseURL(removed).pathname.slice(1);

                $notice(`Doppleganger work:`, removed);

                // Doppleganger
                REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: parseBool(parseURL(removed).searchParameters?.redo) });

                [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                Cache.save({ ALL_FIRST_IN_LINE_JOBS }, () => {
                    $warn('Removed duplicate job', removed);
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

    Handlers.first_in_line_plus = async() => {
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
            $warn('Twitch failed to add these channels correctly:', bad_names)
                // .toNativeStack();

            BAD_STREAMERS = "";

            Cache.save({ BAD_STREAMERS });

            // removeFromSearch(['tt-err-chn']);
        } else if($.nullish('[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] a[class*="side-nav-card"i]') && !/^User_Not_Logged_In_\d+$/.test(USERNAME)) {
            $('[data-a-target="side-nav-arrow"i]')
                ?.closest('[class*="expand"i]')
                ?.querySelector('button')
                ?.click();

            wait(3000).then(() => {
                if($.nullish('[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] a[class*="side-nav-card"i]'))
                    return;

                $warn("[Followed Channels] is missing. Reloading...");

                Cache.save({ BAD_STREAMERS: OLD_STREAMERS });

                // Failed to get channel at...
                addReport({ 'TTV-Tools-failed-to-get-channel-details': new Date().toString() }, true);
            });

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

            if(nullish(streamer) || searchParameters.obit == streamer.name || !name?.length)
                continue creating_new_events;

            let { href } = streamer;

            if(!streamer?.name?.length)
                continue creating_new_events;

            $log('A channel just appeared:', name, new Date);

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
                            Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }).then(() => parseBool(message) && alert.timed(message, 7000)).catch($warn));
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

            // @performance
            PrepareForGarbageCollection(LiveReminders);
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
        && (false
            || nullish(Settings.live_reminders)
            || parseBool(Settings.live_reminders)
        )
    ) {
        $remark('Adding Live Reminders...');

        // See if there are any notifications to push...
        let REMINDERS_INDEX = -1, REMINDERS_LENGTH = 0, PARSED_REMINDERS = new Map;

        // Lists Live Reminders periodically...
        let LIVE_REMINDERS__CHECKER = () => {
            Cache.load('LiveReminders', async({ LiveReminders }) => {
                try {
                    LiveReminders = JSON.parse(LiveReminders || '{}');
                } catch(error) {
                    // Probably an object already...
                    LiveReminders ??= {};
                }

                checking: // Only check for the stream when it's live; if the dates don't match, it just went live again
                for(let reminderName in LiveReminders) {
                    culling: if(PARSED_REMINDERS.has(reminderName)) {
                        let repeats = PARSED_REMINDERS.get(reminderName) + 1;

                        PARSED_REMINDERS.set(reminderName, repeats);

                        // Let reminders refresh every 15mins
                        if(!(repeats % 3))
                            break culling;
                        continue checking;
                    }

                    let channel = await new Search(reminderName).then(Search.convertResults),
                        ok = parseBool(channel?.ok);

                    // Search did not complete...
                    let num = 3;
                    while(!ok && num-- > 0) {
                        delete channel;

                        Search.void(reminderName);

                        // @research
                        channel = await new Search(reminderName).then(Search.convertResults);
                        ok = parseBool(channel?.ok);

                        // $warn(`Re-search, ${ num } ${ 'retry'.pluralSuffix(num) } left [Reminders]: "${ reminderName }" → OK = ${ ok }`);
                    }

                    if(!num && !ok) {
                        channel = ALL_CHANNELS.find(channel => channel.name.equals(reminderName));

                        if(nullish(channel?.name))
                            continue checking;
                    }

                    if(!channel.live) {
                        // Ignore this reminder (channel not live)
                        continue checking;
                    }

                    let { name, live, icon, href, data = { actualStartTime: null, lastSeen: null } } = channel;
                    let lastOnline = new Date((+new Date(LiveReminders[reminderName])).floorToNearest(1000)).toJSON(),
                        justOnline = new Date((+new Date(data.actualStartTime)).floorToNearest(1000)).toJSON();

                    // The channel just went live!
                    if(lastOnline != justOnline) {
                        PARSED_REMINDERS.set(reminderName, 0);

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
                                    $warn(`Live Reminders: ${ name } went live ${ instance }`, new Date);
                                    alert.timed(`<a href='/${ name }'>${ name }</a> went live ${ instance }!`, 7000);
                                }

                                // Update the cached-streamer
                                Update_cached_streamer: {
                                    GetNextStreamer.cachedStreamer = null;
                                    (GetNextStreamer.cachedReminders ??= []).push({
                                        name, live, href,

                                        from: 'LIVE_REMINDERS__CHECKER',
                                    });

                                    GetNextStreamer();
                                }
                            }

                            // The reminder has been parsed...
                        });
                    } else {
                        // The reminder (date) hasn't been changed...
                    }

                    // Release memory... Doesn't actually do anything...
                    delete channel;
                }

                // Send the length to the settings page
                Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) });

                // @performance
                PrepareForGarbageCollection(LiveReminders);
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

        setTimeout(LIVE_REMINDERS__CHECKER, 5_000);
        setInterval(LIVE_REMINDERS__CHECKER, 300_000);
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

        let { href = '', origin, protocol, scheme, host, hostname, domainPath = [], port, pathname, search, hash } = parseURL(STREAMER.game.href);

        if(false
            || (href.trim().length < 4)
            || (domainPath.length < 2)
        )
            return;

        let timerStart = +new Date;

        let MATURE_HINTS = ['ADULT', 'MATUR', 'NSFW', ...16..to(99)],
            RATING_STYLING = `max-height:10rem; max-width:6rem; position:absolute; left:50%; bottom:-9rem; transform:translate(-50%);`;

        /*await*/ fetchURL.fromDisk(href, { hoursUntilEntryExpires: 8, keepDefectiveEntry: true })
            .then(response => response.text())
            .then(DOMParser.stripBody)
            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
            .catch($warn)
            .then(DOM => {
                if(!(DOM instanceof Document))
                    throw TypeError(`No DOM available. Page not loaded`);

                let f = furnish;
                let get = property => DOM.get(property);

                let [title, description, image] = ["title", "description", "image"].map(get),
                    error = DOM.querySelector('parsererror')?.textContent;

                let ok = $.defined('meta[property="og:image"i]');

                if(!ok)
                    throw `No metadata available for "${ STREAMER.game }"`;

                $log(`Loaded page: Game @ ${ href }`, { title, description, image, DOM, size: (DOM.documentElement.innerHTML.length * 8).suffix('B', 2, 'data'), time: ((+new Date - timerStart) / 1000).suffix('s', false) });

                if(!title?.length || !image?.length) {
                    if(!error?.length)
                        return;
                    else
                        throw error;
                }

                title = title.replace(/[\s\-]*twitch\s*$/i, '').replace(/^\s*$/, STREAMER.game);

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
                                            f('img.tt-image.game-card-img', {
                                                alt: title,
                                                src: image.replace(/^(?!(?:https?:)?\/\/[^\/]+)\/?/i, `${ top.location.protocol }//${ host }/`),
                                                style: 'height:15rem; object-fit:cover',
                                                ok: /\/ttv-boxart\//i.test(image),
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
                                            f('#tt-nintendo-purchase')
                                        )
                                    )
                                )
                            )
                        )
                    )
                );

                let container = f(`#game-overview-card[@game="${ STREAMER.game }"]`, {
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
            .catch($error);

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

                    EditionsRegExp = /\s*(([-~:]\s*)?([\p{L}\s'-]){3,}\s*)(Edition|Season|Episode)s?(\s+[:\-\dIVXLCD]+)?[^$]+/iu;
                    // Removes common "editions" → Standard,Digital,Deluxe,Digital Deluxe,Definitive,Anniversary,Complete,Extended,Ultiamte,Collector's,Bronze,Silver,Gold,Platinum,Enhanced,Premium,Complete Season,etc.

                function normalize(string, ...conditions) {
                    conditions = [
                        [LE_QUOTES, '"'],
                        [LE_APOSTE, "'"],
                        [NON_ASCII, ''],
                    ].concat(conditions);

                    for(let [expression, replacement] of conditions)
                        string = string?.replace(expression, replacement);

                    return string?.replace(/[\u2010-\u2015]/g, '-')?.replace(EditionsRegExp, '') ?? '';
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
                        return /*await*/ fetchURL.fromDisk(`https://store.steampowered.com/search/suggest?term=${ gameURI }&f=games&cc=${ counCode }&realm=1&l=${ langName }&use_store_query=1&use_search_spellcheck=1`)
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

                            // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_steam) }") no-repeat center 100% / contain, #000;`);

                            when.defined(() => $('#tt-steam-purchase'))
                                .then(container => {
                                    // Load the maturity warning (if applicable)...
                                    fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
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
                                            $warn(`Unable to fetch Steam pricing information for "${ game }"`, error);
                                        });

                                    container.replaceWith(purchase);
                                });

                            $log(`Got "${ game }" data from Steam:`, info);
                        })
                        .catch(error => {
                            $warn(`Unable to connect to Steam. Tried to look for "${ game }"`, error);
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
                        return fetchURL.fromDisk(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/psn/${ (game[0].toLowerCase().replace(/[^a-z]/, '_')) }.json`, { hoursUntilEntryExpires: 168 })
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
                                    return /*await*/ fetchURL.fromDisk(`https://store.playstation.com/${ lang }/search/${ gameURI }`, { hoursUntilEntryExpires: 168 })
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

                                $warn(error);
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

                                // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_playstation) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-playstation-purchase'))
                                    .then(container => {
                                        // Load the maturity warning (if applicable)...
                                        fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
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
                                                $warn(`Unable to fetch PlayStation pricing information for "${ jbpp }"`, error);
                                            });

                                        container.replaceWith(purchase);
                                    });

                                $log(`Got "${ jbpp }" data from PlayStation:`, info);
                            })
                            .catch(error => {
                                $warn(`Unable to connect to PlayStation. Tried to look for "${ jbpp }"`, error);
                            });
                    } else {
                        fetchPlayStationGame(game)
                            .then((info = {}) => {
                                let { game, name, href, img, price, good = false } = info;

                                if(!href?.length)
                                    return;

                                // Correct game image...
                                if($.defined('.game-card-img[ok="false"i]')) {
                                    let i = new Image;
                                    i.crossOrigin = "anonymous";
                                    i.addEventListener('load', event => {
                                        let I = $('.game-card-img[ok="false"i]');

                                        if(nullish(I))
                                            return;

                                        for(let { name, value } of I.attributes)
                                            if(['src', 'ok'].missing(name))
                                                i.setAttribute(name, value);
                                        I.replaceWith(i);
                                    });
                                    i.addEventListener('error', event => {
                                        i.setAttribute('ok', false);
                                    });

                                    i.src = img;
                                }

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

                                // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_playstation) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-playstation-purchase'))
                                    .then(container => {
                                        href = href.replace(/^\/\//, 'https:$&');

                                        // Load the maturity warning (if applicable)...
                                        fetchURL.fromDisk(href, { hoursUntilEntryExpires: 168 })
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
                                                $warn(`Unable to fetch PlayStation pricing information for "${ game }"`, error);
                                            });

                                        container.replaceWith(purchase);
                                    });

                                $log(`Got "${ game }" data from PlayStation:`, info);
                            })
                            .catch(error => {
                                $warn(`Unable to connect to PlayStation. Tried to look for "${ game }"`, error);
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
                        return fetchURL.fromDisk(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/xbox/${ (game[0].toLowerCase().replace(/[^a-z]/, '_')) }.json`, { hoursUntilEntryExpires: 168 })
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
                                    return /*await*/ fetchURL.fromDisk(`https://www.microsoft.com/msstoreapiprod/api/autosuggest?market=${ lang }&sources=DCatAll-Products&filter=%2BClientType%3AStoreWeb&query=${ gameURI }`, { hoursUntilEntryExpires: 168 })
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

                                $warn(error);
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

                                // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_xbox) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-xbox-purchase'))
                                    .then(container => {
                                        // Load the price & maturity warning (if applicable)...
                                        fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
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
                                                    mature = parseBool(rating?.alt?.toUpperCase()?.contains(...MATURE_HINTS));

                                                rating.modStyle(RATING_STYLING);

                                                $('.is-xbox .tt-store-purchase--price').textContent = /^\$?([\d\.]+|\w+)$/.test(price ?? '')? price: info.price;
                                                $('.tt-store-purchase--container.is-xbox').dataset.matureContent = (rating.alt || mature);
                                                $('#tt-content-rating-placeholder')?.replaceWith(rating);
                                            })
                                            .catch(error => {
                                                $warn(`Unable to fetch Xbox pricing information for "${ jbpp }"`, error);
                                            });

                                        // TODO: Make this faster somehow!
                                        // Slow as hell!
                                        fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
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
                                $warn(`Unable to connect to Xbox. Tried to look for "${ jbpp }"`, error);
                            });
                    } else {
                        fetchXboxGame(game)
                            .then((info = {}) => {
                                let { game, name, href, img, price, good = false } = info;

                                if(!href?.length)
                                    return;

                                // Correct game image...
                                if($.defined('.game-card-img[ok="false"i]')) {
                                    let i = new Image;
                                    i.crossOrigin = "anonymous";
                                    i.addEventListener('load', event => {
                                        let I = $('.game-card-img[ok="false"i]');

                                        if(nullish(I))
                                            return;

                                        for(let { name, value } of I.attributes)
                                            if(['src', 'ok'].missing(name))
                                                i.setAttribute(name, value);
                                        I.replaceWith(i);
                                    });
                                    i.addEventListener('error', event => {
                                        i.setAttribute('ok', false);
                                    });

                                    i.src = img;
                                }

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

                                // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_xbox) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-xbox-purchase'))
                                    .then(container => {
                                        // Load the price & maturity warning (if applicable)...
                                        fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
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
                                                    mature = parseBool(rating?.alt?.toUpperCase()?.contains(...MATURE_HINTS));

                                                rating?.modStyle(RATING_STYLING);

                                                $('.is-xbox .tt-store-purchase--price').textContent = /^\$?([\d\.]+|\w+)$/.test(price ?? '')? price: info.price;
                                                $('.tt-store-purchase--container.is-xbox').dataset.matureContent = (rating?.alt || mature);
                                                $('#tt-content-rating-placeholder')?.replaceWith(rating);
                                            })
                                            .catch(error => {
                                                $warn(`Unable to fetch Xbox pricing information for "${ game }"`, error);
                                            });

                                        // TODO: Make this faster somehow!
                                        // Slow as hell!
                                        fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
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

                                $log(`Got "${ game }" data from Xbox:`, info);
                            })
                            .catch(error => {
                                $warn(`Unable to connect to Xbox. Tried to look for "${ game }"`, error);
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
                        return fetchURL.fromDisk(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/nintendo/${ (game[0].toLowerCase().replace(/[^a-z]/, '_')) }.json`, { hoursUntilEntryExpires: 168 })
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
                                    return /*await*/ fetchURL.fromDisk(encodeURI`https://u3b6gr4ua3-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia for JavaScript (4.14.2); Browser; JS Helper (3.11.1); react (17.0.2); react-instantsearch (6.38.0)`, {
                                        hoursUntilEntryExpires: 168,    // 1 week lifetime
                                        keepDefectiveEntry: true,       // Keep bad requests

                                        headers: {
                                            'accept': '*/*',
                                            'accept-language': navigator.languages.join(','),
                                            'content-type': 'application/x-www-form-urlencoded',
                                            'sec-ch-ua': navigator.userAgentData.brands.map(b => [`"${ b.brand }"`, `v="${ b.version }"`].join(';')).join(', '),
                                            'sec-ch-ua-mobile': '?' + +navigator.userAgentData.mobile,
                                            'sec-ch-ua-platform': `"${ navigator.userAgentData.platform }"`,
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

                                $warn(error);
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

                                    fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
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

                                                gameDesc.innerText = [description, gameDesc.innerText].sort((a, b) => b?.length - a?.length).shift().replace(/([\.!\?])\s*(?:\.{3}|…)\s*$/, '$1');
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

                                    // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_nintendo) }") no-repeat center 100% / contain, #000;`);

                                    when.defined(() => $('#tt-nintendo-purchase'))
                                        .then(container => {
                                            container.replaceWith(purchase);

                                            new Tooltip(purchase, `ESRB (USA): ${ rating.toUpperCase() }`, { from: 'top' });

                                            if($.all('.is-nintendo').length < vers.length)
                                                $('#tt-purchase-container').append(
                                                    f('#tt-nintendo-purchase')
                                                );
                                        });

                                    $log(`Got "${ game }" data from Nintendo:`, info);
                                })
                                .catch(error => {
                                    $warn(`Unable to connect to Nintendo. Tried to look for "${ game }"`, error);
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

                                // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_nintendo) }") no-repeat center 100% / contain, #000;`);

                                $log(`Got "${ jbpp }" data from Nintendo:`, info);
                            })
                            .catch(error => {
                                $warn(`Unable to connect to Nintendo. Tried to look for "${ jbpp }"`, error);
                            });
                    } else {
                        // Just one version is available
                        fetchNintendoGame(game)
                            .then((info = {}) => {
                                let { game, name, href, img, price, rating = 'none', good = false } = info;

                                img = `https://assets.nintendo.com/image/upload/ar_16:9,b_auto:border,c_lpad/b_white/f_auto/q_auto/dpr_1.0/c_scale,w_700/${ img }`;

                                if(!href?.length)
                                    return;

                                // Correct game image...
                                if($.defined('.game-card-img[ok="false"i]')) {
                                    let i = new Image;
                                    i.crossOrigin = "anonymous";
                                    i.addEventListener('load', event => {
                                        let I = $('.game-card-img[ok="false"i]');

                                        if(nullish(I))
                                            return;

                                        for(let { name, value } of I.attributes)
                                            if(['src', 'ok'].missing(name))
                                                i.setAttribute(name, value);
                                        I.replaceWith(i);
                                    });
                                    i.addEventListener('error', event => {
                                        i.setAttribute('ok', false);
                                    });

                                    i.src = img;
                                }

                                fetchURL.fromDisk(href.replace(/^\/\//, 'https:$&'), { hoursUntilEntryExpires: 168 })
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

                                            console.log('Nintendo:', description, description?.length);
                                            console.log('Twitch:', gameDesc.innerText, gameDesc.innerText?.length);
                                            console.log([description, gameDesc.innerText].sort((a, b) => b?.length - a?.length));

                                            gameDesc.innerHTML = [description, gameDesc.innerText].sort((a, b) => b?.length - a?.length).shift().replace(/([\.!\?])\s*(?:\.{3}|…)\s*$/, '$1');
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

                                // $('.tt-store-purchase--price', purchase).modStyle(`background: url("data:image/svg+xml;base64,${ btoa(Glyphs.store_nintendo) }") no-repeat center 100% / contain, #000;`);

                                when.defined(() => $('#tt-nintendo-purchase'))
                                    .then(container => {
                                        container.replaceWith(purchase);
                                    });

                                $log(`Got "${ game }" data from Nintendo:`, info);
                            })
                            .catch(error => {
                                $warn(`Unable to connect to Nintendo. Tried to look for "${ game }"`, error);
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
        $remark('Adding game overview card...');

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
    let CURRENT_WATCHTIME_NAME = `WatchTimes/${ STREAMER.name.toLowerCase() }`;

    Cache.load(CURRENT_WATCHTIME_NAME, _ => {
        _[CURRENT_WATCHTIME_NAME] >>= 0;

        STARTED_WATCHING -= _[CURRENT_WATCHTIME_NAME];

        Cache.save(_);
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

        let extension_views = $.all('[class*="extension"i]:is([class*="view"i], [class*="popover"i])');

        for(let view of extension_views)
            view.modStyle('display:none!important');

        StopWatch.stop('kill_extensions');
    };
    Timers.kill_extensions = 2_500;

    Unhandlers.kill_extensions = () => {
        let extension_views = $.all('[class^="extension-view"i]');

        for(let view of extension_views)
            view.removeAttribute('style');
    };

    __KillExtensions__:
    if(parseBool(Settings.kill_extensions)) {
        $remark("Adding extension killer...");

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
            .map($0 => $0.getElementByText(/([!][\p{Alpha}\.\\\/\?\+\(\)\[\]\{\}\*\|]+)/u))
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

                        let url = parseURL(reply),
                            string;

                        // Find the "best" URL
                        let _href, _protocol, _host, _origin, _port, _pathname, _search, _hash;
                        let errors = [];

                        if(defined(url))
                            for(let s = reply, i = 0, maxURLs = 5; i < s.length && --maxURLs;) {
                                let found = parseURL.pattern.exec(s.slice(i));

                                if(nullish(found))
                                    continue;

                                let { index, groups } = found;
                                let { href, protocol, host, origin, port, pathname, search, hash } = groups;

                                if(false
                                    // Empty URL...
                                    || (false
                                        || (href && !_href)
                                        || (pathname && !_pathname)
                                        || (search && !_search)
                                        || (hash && !_hash)
                                    )

                                    // Longest URL...
                                    // || (href.length < _href.length)

                                    // Most complete URL...
                                    || (false
                                        || (protocol && !_protocol)
                                        || (host && !_host)
                                        || (origin && !_origin)
                                        || (port && !_port)
                                    )
                                ) {
                                    // Set the new "best" URL
                                    _href = href;
                                    _origin = origin;
                                    _protocol = protocol;
                                    _host = host;
                                    _port = port;
                                    _pathname = pathname;
                                    _search = search;
                                    _hash = hash;
                                }

                                if(index + href.length >= s.slice(i).length)
                                    break;

                                i = index + href.length;
                            }

                        let titleTo = new UUID + '';

                        if(parseBool(Settings.parse_commands__create_links) && defined(_href))
                            string = `<code tt-code style="border:1px solid currentColor; color:var(--color-colored)!important; white-space:nowrap;" contrast="${ THEME__PREFERRED_CONTRAST }" title-to="${ titleTo };${ encodeHTML(reply) }"><a style="color:inherit!important" href="${ _href.replace(/^(\w{3,}\.\w{2,})/, `https://$1`) }" target=_blank>${ decodeMD(encodeHTML($1)) } ${ Glyphs.modify('ne_arrow', { height:12, width:12, style:'vertical-align:middle!important' }) }</a></code>`;
                        else
                            string = `<code tt-code style="opacity:${ 2**-!enabled }; white-space:nowrap" title-to="${ titleTo };${ encodeHTML(reply) }">${ decodeMD(encodeHTML($1)) }</code>`;

                        return `<span title-to="${ titleTo }" tt-parse-commands="${ btoa(escape(string)) }">${ $0.split('').join('&zwj;') }</span>`;
                    });
                });

            // Controls whether the stream-title (description) has a native tooltip (false) or not (true)
            if(true)
                wait(500, element).then(element => {
                    let title = decodeHTML(element.getAttribute('title') ?? '');

                    if(title.length < 1)
                        return;

                    new Tooltip(element, title, { from: 'top' });

                    element.removeAttribute('title');
                });

            $.all('[tt-parse-commands]:not([tt-parsed="true"i])').map(element => {
                let titleTo = element.getAttribute('title-to');

                element.outerHTML = unescape(atob(element.getAttribute('tt-parse-commands')));

                when.defined(to => $(`[title-to^="${ to };"i]`), 30, titleTo).then(tooltip => {
                    let [to, title = ""] = tooltip.getAttribute('title-to').split(';');

                    if(title.trim().length)
                        new Tooltip(tooltip, title);
                    tooltip.removeAttribute('title-to');
                });

                element.setAttribute('tt-parsed', true);
            });
        }
    };
    Timers.parse_commands = -1000;

    Unhandlers.parse_commands = () => {
        let title = $('[data-a-target="stream-title"i]');

        if(defined(title))
            title.innerHTML = encodeHTML($('[data-a-target="stream-title"i]').innerText);
    };

    __ParseCommands__:
    if(parseBool(Settings.parse_commands)) {
        $remark("Parsing title commands...");

        RegisterJob('parse_commands');

        // Add the chat menu popup...
        let CSSBlockName = `Chat-Input-Menu:${ new UUID }`,
            AvailableCommands;

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
                .map(data => ({ ...data, textDistance: Math.min(...[data.command, ...data.aliases].map(string => value.distanceFrom(string.toLowerCase()))) }))
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
            AddCustomCSSBlock(CSSBlockName, `
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
            `);
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
                    $log(`[HOSTING] ${ guest } is already followed. Just head to the channel`);

                    goto(parseURL(streamer.href).addSearch({ tool: `host-stopper--${ method }` }).href);
                    break host_stopper;
                }
            }

            for(let callback of STREAMER.__eventlisteners__.onhost)
                callback({ hosting });

            if(defined(next)) {
                $log(`${ host } is hosting ${ guest }. Moving onto next channel (${ next.name })`, next.href, new Date);

                goto(parseURL(next.href).addSearch({ tool: `host-stopper--${ method }` }).href);
            } else {
                $log(`${ host } is hosting ${ guest }. There doesn't seem to be any followed channels on right now`, new Date);

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
                    $log(`[RAIDING] There is a possiblity to collect bonus points. Do not leave the raid.`, parseURL(`${ location.origin }/${ to }`).addSearch({ referrer: 'raid', raided: true }).href);

                    addToSearch({ referrer: 'raid', raided: true });
                    removeFromSearch(['redo']);

                    Cache.save({ LastRaid: { from, to, type: method } });
                    CONTINUE_RAIDING = true;
                    break raid_stopper;
                }
                // #2 - The channel being raided (to) is already in "followed." No need to leave
                else if(raiding && defined(STREAMERS.find(channel => RegExp(`^${ to }$`, 'i').test(channel.name)))) {
                    $log(`[RAIDING] ${ to } is already followed. No need to leave the raid`);

                    CONTINUE_RAIDING = true;
                    break raid_stopper;
                }
                // #3 - The channel that was raided (to) is already in "followed." No need to leave
                else if(raided && STREAMER.like) {
                    $log(`[RAIDED] ${ to } is already followed. No need to abort the raid`);

                    Cache.save({ LastRaid: {} });
                    removeFromSearch(['referrer', 'raided']);
                    CONTINUE_RAIDING = true;
                    break raid_stopper;
                }
            }

            STREAMER.onraid = async({ raiding, raided }) => {
                CONTINUE_RAIDING = false;

                let next = await GetNextStreamer();

                raid_stopper:
                if(defined(next)) {
                    $log(`${ STREAMER.name } ${ raiding? 'is raiding': 'was raided' }. Moving onto next channel (${ next.name })`, next.href, new Date);

                    // Don't leave if the raid is on this page...
                    if(raiding && ["greed"].contains(method))
                        break raid_stopper;

                    if(UP_NEXT_ALLOW_THIS_TAB)
                        goto(parseURL(next.href).addSearch({ tool: `raid-stopper--${ method }` }).href);
                    else
                        Runtime.sendMessage({ action: 'STEAL_UP_NEXT', next: next.href, from: STREAMER?.name, method }, ({ next, from, method }) => {
                            $notice(`Stealing an Up Next job (raid): ${ from } → ${ next }`);

                            goto(parseURL(next).addSearch({ tool: `raid-stopper--${ method }` }).href);
                        });

                    let index = ALL_FIRST_IN_LINE_JOBS.indexOf(FIRST_IN_LINE_HREF),
                        [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1);

                    if(UP_NEXT_ALLOW_THIS_TAB)
                        Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
                } else {
                    $log(`${ STREAMER.name } ${ raiding? 'is raiding': 'was raided' }. There doesn't seem to be any followed channels on right now`, new Date);

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

        top.beforeleaving = top.onlocationchange = async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
            if(raiding || raided)
                CONTINUE_RAIDING = false;
        };
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
        let online = [STREAMER, ...STREAMERS].filter(isLive).filter(({ name }) => name.unlike(STREAMER.name)),
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
                    src: `./popout/${ name }/chat?hidden=true&parent=twitch.tv&current=${ STREAMER.name.equals(name) }&allow=greedy_raiding`,
                    destroy: setTimeout(name => $(`#tt-greedy-raiding--${ name }`)?.remove(), 120_000, name),

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
    if(UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.greedy_raiding)) {
        $remark('Adding raid-watching logic...');

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

        let next = await GetNextStreamer(STREAMER.name),
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
                $warn(`${ STREAMER?.name } is no longer live. Moving onto next channel (${ next.name })`, next.href, new Date);

                REDO_FIRST_IN_LINE_QUEUE( parseURL(FIRST_IN_LINE_HREF)?.addSearch?.({ from: STREAMER?.name })?.href );

                let index = ALL_FIRST_IN_LINE_JOBS.indexOf(FIRST_IN_LINE_HREF),
                    [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1);

                if(UP_NEXT_ALLOW_THIS_TAB)
                    Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => goto(parseURL(next.href).addSearch({ obit: STREAMER?.name, tool: 'stay-live' }).href));
                else
                    Runtime.sendMessage({ action: 'STEAL_UP_NEXT', next: next.href, obit: STREAMER?.name }, ({ next, obit }) => {
                        $notice(`Stealing an Up Next job (stay live): ${ obit } → ${ next }`);

                        goto(parseURL(next).addSearch({ obit, tool: 'stay-live--steal' }).href);
                    });
            } else  {
                $warn(`${ STREAMER?.name } is no longer live. There doesn't seem to be any followed channels on right now`, new Date);
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
        $remark('Ensuring Twitch stays live...');

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
            // Z15:00 | Z1500 | +5:00 | -5:00 | +0500 | -0500
            /(?<![#\$\.+:\d%‰]|\p{Sc})\b(?<offset>Z|[+-])(?<hour>2[0-3]|[01]\d)(?<minute>:?[0-5]\d)(?!\d*(?:\p{Sc}|[%‰]))\b/iu,

            // GMT/UTC
            // GMT+5:00 | GMT-5:00 | GMT+0500 | GMT-0500 | GMT+05 | GMT-05 | GMT+5 | GMT-5 | UTC+5:00 | UTC-5:00 | UTC+0500 | UTC-0500 | UTC+05 | UTC-05 | UTC+5 | UTC-5
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
            ADT: "+04:00",
            AEDT: "+11:00",
            AEST: "+10:00",
            AFT: "+04:30",
            AKDT: "-08:00",
            AKST: "-09:00",
            ALMT: "+06:00",
            AMST: "-03:00",
            AMT: "-04:00",
            ANAST: "+12:00",
            ANAT: "+12:00",
            AQTT: "+05:00",
            AWDT: "+09:00",
            AWST: "+08:00",
            AZOST: "+0:00",
            AZOT: "-01:00",
            AZST: "+05:00",
            AZT: "+04:00",
            BNT: "+08:00",
            BOT: "-04:00",
            BRST: "-02:00",
            BRT: "-03:00",
            BTT: "+06:00",
            CAST: "+08:00",
            CCT: "+06:30",
            CEST: "+02:00",
            CET: "+01:00",
            CHADT: "+13:45",
            CHAST: "+12:45",
            CHOST: "+09:00",
            CHOT: "+08:00",
            CHUT: "+10:00",
            CIDST: "-04:00",
            CIST: "-05:00",
            CKT: "-10:00",
            CLST: "-03:00",
            CLT: "-04:00",
            COT: "-05:00",
            CVT: "-01:00",
            CXT: "+07:00",
            CHST: "+10:00",
            DAVT: "+07:00",
            DDUT: "+10:00",
            EASST: "-05:00",
            EAST: "-06:00",
            EEST: "+03:00",
            EGST: "+0:00",
            EGT: "-01:00",
            EST: "-05:00",
            FET: "+03:00",
            FJST: "+13:00",
            FJT: "+12:00",
            FKST: "-03:00",
            FKT: "-04:00",
            FNT: "-02:00",
            GALT: "-06:00",
            GAMT: "-09:00",
            GET: "+04:00",
            GFT: "-03:00",
            GILT: "+12:00",
            GMT: "+0:00",
            GST: "+04:00",
            GYT: "-04:00",
            HDT: "-09:00",
            HKT: "+08:00",
            HOVST: "+08:00",
            HOVT: "+07:00",
            ICT: "+07:00",
            IDT: "+03:00",
            IOT: "+06:00",
            IRDT: "+04:30",
            IRKST: "+09:00",
            IRKT: "+08:00",
            IRST: "+03:30",
            KGT: "+06:00",
            KOST: "+11:00",
            KRAST: "+08:00",
            KRAT: "+07:00",
            KST: "+09:00",
            KUYT: "+04:00",
            LHDT: "+11:00",
            LHST: "+10:30",
            LINT: "+14:00",
            MAGST: "+12:00",
            MAGT: "+11:00",
            MART: "-09:30",
            MAWT: "+05:00",
            MHT: "+12:00",
            MMT: "+06:30",
            MSD: "+04:00",
            MSK: "+03:00",
            MUT: "+04:00",
            MVT: "+05:00",
            MYT: "+08:00",
            NCT: "+11:00",
            NDT: "-02:30",
            NFDT: "+12:00",
            NFT: "+11:00",
            NOVST: "+07:00",
            NOVT: "+07:00",
            NPT: "+05:45",
            NRT: "+12:00",
            NUT: "-11:00",
            NZDT: "+13:00",
            NZST: "+12:00",
            OMSST: "+07:00",
            OMST: "+06:00",
            ORAT: "+05:00",
            PET: "-05:00",
            PETST: "+12:00",
            PETT: "+12:00",
            PGT: "+10:00",
            PHOT: "+13:00",
            PHT: "+08:00",
            PKT: "+05:00",
            PMDT: "-02:00",
            PMST: "-03:00",
            PONT: "+11:00",
            PWT: "+09:00",
            PYST: "-03:00",
            PYT: "-04:00",
            QYZT: "+06:00",
            RET: "+04:00",
            ROTT: "-03:00",
            SAKT: "+11:00",
            SAMT: "+04:00",
            SAST: "+02:00",
            SBT: "+11:00",
            SCT: "+04:00",
            SGT: "+08:00",
            SRET: "+11:00",
            SRT: "-03:00",
            SYOT: "+03:00",
            TAHT: "-10:00",
            TFT: "+05:00",
            TJT: "+05:00",
            TKT: "+13:00",
            TLT: "+09:00",
            TMT: "+05:00",
            TOST: "+14:00",
            TOT: "+13:00",
            TRT: "+03:00",
            TVT: "+12:00",
            ULAST: "+09:00",
            ULAT: "+08:00",
            UTC: ":00",
            UYST: "-02:00",
            UYT: "-03:00",
            UZT: "+05:00",
            VET: "-04:00",
            VLAST: "+11:00",
            VLAT: "+10:00",
            VOST: "+06:00",
            VUT: "+11:00",
            WAKT: "+12:00",
            WARST: "-03:00",
            WAST: "+02:00",
            WAT: "+01:00",
            WEST: "+01:00",
            WET: "+0:00",
            WFT: "+12:00",
            WGST: "-02:00",
            WGT: "-03:00",
            WIB: "+07:00",
            WIT: "+09:00",
            WITA: "+08:00",
            WST: "+13:00",
            YAKST: "+10:00",
            YAKT: "+09:00",
            YAPT: "+10:00",
            YEKST: "+06:00",
            YEKT: "+05:00",
        },

        // More timezones from: https://www.localeplanet.com/icu/zh-Hant-TW/timezone.html
        GEOGRAPHIC__CONVERSIONS = {
            "Acre": "-05:00",
            "Adak": "-10:00",
            "Adelaide": "+09:30",
            "Afghanistan": "+04:30",
            "Akrotiri": "+02:00",
            "Aktobe": "+05:00",
            "Åland Islands": "+02:00",
            "Alaska": "-09:00",
            "Albania": "+01:00",
            "Alberta": "-07:00",
            "Aleutian Islands": "-10:00",
            "Algeria": "+01:00",
            "Almaty": "+06:00",
            "Altai Krai": "+07:00",
            "Altai Republic": "+07:00",
            "Amapá": "-03:00",
            "Amazon": "-04:00",
            "Amazon (Campo Grande)": "-04:00",
            "Amazon (Cuiaba)": "-04:00",
            "Amazonas": "-04:00",
            "Amazonas State": "-04:00",
            "American Samoa": "-11:00",
            "Amsterdam Islands": "+05:00",
            "Amundsen–Scott": "+12:00",
            "Amundsen–Scott South Pole Station": "+12:00",
            "Amur Oblast": "+09:00",
            "Anadyr": "+12:00",
            "Anchorage": "-09:00",
            "Andorra": "+01:00",
            "Angola": "+01:00",
            "Anguilla": "-04:00",
            "Antigua & Barbuda": "-04:00",
            "Anywhere on Earth": "-12:00",
            "Apia": "-11:00",
            "Aqtau": "+05:00",
            "Aqtobe": "+05:00",
            "Arabian": "+03:00",
            "Araguaina": "-03:00",
            "Argentina": "-03:00",
            "Armenia": "+04:00",
            "Aruba": "-04:00",
            "Ascension": "+00:00",
            "Astrakhan": "+04:00",
            "Astrakhan Oblast": "+04:00",
            "Atikokan": "-05:00",
            "Atlantic": "-04:00",
            "Atyrau": "+05:00",
            "Austral Islands": "-10:00",
            "Australian Capital Territory": "+10:00",
            "Australian Central": "+09:30",
            "Australian Central Western": "+08:45",
            "Australian Eastern": "+09:30",
            "Australian Western": "+08:00",
            "Austria": "+01:00",
            "Autonomous Region of Bougainville": "+11:00",
            "Azerbaijan": "+04:00",
            "Azores": "-01:00",
            "Bahamas": "-05:00",
            "Bahia": "-03:00",
            "Bahia Banderas": "-06:00",
            "Bahrain": "+03:00",
            "Baja California": "-08:00",
            "Baja California Sur": "-07:00",
            "Baker Island": "-12:00",
            "Bali": "+08:00",
            "Bangka Belitung Islands": "+07:00",
            "Bangladesh": "+06:00",
            "Barbados": "-04:00",
            "Barnaul": "+07:00",
            "Bas-Uele": "+02:00",
            "Bashkortostan": "+05:00",
            "Bayan-Ölgii": "+07:00",
            "Belarus": "+03:00",
            "Belem": "-03:00",
            "Belgium": "+01:00",
            "Belize": "-06:00",
            "Benin": "+01:00",
            "Bermuda": "-04:00",
            "Beulah": "-06:00",
            "Bhutan": "+06:00",
            "Blanc-Sablon": "-04:00",
            "Boa Vista": "-04:00",
            "Boise": "-07:00",
            "Bolivia": "-04:00",
            "Bosnia & Herzegovina": "+01:00",
            "Botswana": "+02:00",
            "Bougainville": "+11:00",
            "Brasilia": "-03:00",
            "Brazil": "-03:00",
            "Brazzaville": "+01:00",
            "Brisbane": "+10:00",
            "British Columbia": "-08:00",
            "British Indian Ocean Territory": "+06:00",
            "British Virgin Islands": "-04:00",
            "Broken Hill": "+09:30",
            "Brunei": "+08:00",
            "Brunei Darussalam": "+08:00",
            "Buenos Aires": "-03:00",
            "Bulgaria": "+02:00",
            "Burkina Faso": "+00:00",
            "Burundi": "+02:00",
            "Buryatia": "+08:00",
            "Busingen": "+01:00",
            "Caicos Islands": "-05:00",
            "Cambodia": "+07:00",
            "Cambridge Bay": "-07:00",
            "Cameroon": "+01:00",
            "Campo Grande": "-04:00",
            "Canary": "+00:00",
            "Canary Islands": "+00:00",
            "Cancun": "-05:00",
            "Cantung Mine": "-08:00",
            "Cape Verde": "-01:00",
            "Caribbean Islands": "-04:00",
            "Caribbean Municipalities": "-04:00",
            "Caribbean Netherlands": "-04:00",
            "Casey": "+11:00",
            "Casey Station": "+11:00",
            "Catamarca": "-03:00",
            "Cayman Islands": "-05:00",
            "Center": "-06:00",
            "Central": "-06:00",
            "Central Africa": "-01:00",
            "Central African": "-01:00",
            "Central African Republic": "+01:00",
            "Central Australia": "+09:30",
            "Central European": "+01:00",
            "Central Indonesia": "+08:00",
            "Central Nunavut": "-06:00",
            "Central Sakha Republic": "+10:00",
            "Ceuta": "+01:00",
            "Chad": "+01:00",
            "Chamorro": "+10:00",
            "Chatham": "+12:45",
            "Chatham Islands": "+12:45",
            "Chelyabinsk Oblast": "+05:00",
            "Chicago": "-06:00",
            "Chihuahua": "-07:00",
            "Chile": "-04:00",
            "Chilean Antarctica": "-03:00",
            "China": "+08:00",
            "Chita": "+09:00",
            "Choibalsan": "+08:00",
            "Christmas Island": "+07:00",
            "Chukotka": "+12:00",
            "Chuuk": "+10:00",
            "Chuuk and Yap": "+10:00",
            "Clipperton Island": "-08:00",
            "Cocos (Keeling) Islands": "+06:30",
            "Cocos Islands": "+06:30",
            "Colombia": "-05:00",
            "Comoros": "+03:00",
            "Congo": "+01:00",
            "Cook Islands": "-10:00",
            "Coordinated Universal": "+00:00",
            "Cordoba": "-03:00",
            "Costa Rica": "-06:00",
            "Creston": "-07:00",
            "Croatia": "+01:00",
            "Crozet Islands": "+04:00",
            "Cuba": "-05:00",
            "Cuiaba": "-04:00",
            "Curaçao": "-04:00",
            "Currie": "+10:00",
            "Czechia": "+01:00",
            "Côte d’Ivoire": "+00:00",
            "Danmarkshavn": "+00:00",
            "Danmarkshavn Weather Station": "+00:00",
            "Darwin": "+09:30",
            "Davis": "+07:00",
            "Davis Station": "+07:00",
            "Dawson": "-08:00",
            "Dawson Creek": "-07:00",
            "Denmark": "+01:00",
            "Denver": "-07:00",
            "Detroit": "-05:00",
            "Dhekelia": "+02:00",
            "Distrito Federal": "-03:00",
            "Djibouti": "+03:00",
            "Dominica": "-04:00",
            "Dominican Republic": "-04:00",
            "Dumont d’Urville": "+10:00",
            "Dumont-d'Urville Station": "+10:00",
            "Dumont-d’Urville": "+10:00",
            "East Africa": "+03:00",
            "East African": "+03:00",
            "East Brazilian Islands": "-02:00",
            "East Greenland": "-01:00",
            "East Kalimantan": "+08:00",
            "East Kazakhstan": "+06:00",
            "East Nunavut": "-05:00",
            "East Nusa Tenggara": "+08:00",
            "East Ontario": "-05:00",
            "East Quebec": "-04:00",
            "East Sakha": "+11:00",
            "East Timor": "+09:00",
            "Easter": "-06:00",
            "Easter Island": "-06:00",
            "Eastern": "-05:00",
            "Eastern Africa": "+03:00",
            "Eastern Australia": "+10:00",
            "Eastern European": "+02:00",
            "Eastern Indonesia": "+09:00",
            "Ecuador": "-05:00",
            "Edmonton": "-07:00",
            "Egypt": "+02:00",
            "Egyptian": "+02:00",
            "Eire": "+00:00",
            "Eirunepe": "-05:00",
            "El Salvador": "-06:00",
            "Enderbury": "+13:00",
            "Équateur": "+01:00",
            "Equatorial Guinea": "+01:00",
            "Eritrea": "+03:00",
            "Estonia": "+02:00",
            "Ethiopia": "+03:00",
            "Eucla": "+08:45",
            "European Russia": "+03:00",
            "Falkland Islands": "-03:00",
            "Famagusta": "+02:00",
            "Faroe Islands": "+00:00",
            "Fernando de Noronha": "-02:00",
            "Fiji": "+12:00",
            "Finland": "+02:00",
            "Fort Nelson": "-07:00",
            "Fortaleza": "-03:00",
            "France": "+01:00",
            "French Guiana": "-03:00",
            "French Southern & Antarctic": "+05:00",
            "French Southern Territories": "+05:00",
            "Futuna": "+12:00",
            "Gabon": "+01:00",
            "Galapagos": "-06:00",
            "Galápagos Province": "-06:00",
            "Gambia": "+00:00",
            "Gambier": "-09:00",
            "Gambier Islands": "-09:00",
            "Gaza": "+02:00",
            "Georgia": "+04:00",
            "Germany": "+01:00",
            "Ghana": "+00:00",
            "Gibraltar": "+01:00",
            "Gilbert Islands": "+12:00",
            "Glace Bay": "-04:00",
            "Goiás": "-03:00",
            "Goose Bay": "-04:00",
            "Great Lakes": "-06:00",
            "Greece": "+02:00",
            "Greenland": "-03:00",
            "Greenwich Mean": "+00:00",
            "Grenada": "-04:00",
            "Guadeloupe": "-04:00",
            "Guam": "+10:00",
            "Guatemala": "-06:00",
            "Guernsey": "+00:00",
            "Guinea": "+00:00",
            "Guinea-Bissau": "+00:00",
            "Gulf": "+04:00",
            "Gulf Coast": "-06:00",
            "Guyana": "-04:00",
            "Haiti": "-05:00",
            "Halifax": "-04:00",
            "Haut-Katanga": "+02:00",
            "Haut-Lomami": "+02:00",
            "Haut-Uele": "+02:00",
            "Hawaii": "-10:00",
            "Hawaii-Aleutian": "-10:00",
            "Heard Islands": "+05:00",
            "Hebron": "+02:00",
            "Hermosillo": "-07:00",
            "Hobart": "+10:00",
            "Honduras": "-06:00",
            "Hong Kong": "+08:00",
            "Hong Kong SAR China": "+08:00",
            "Honolulu": "-10:00",
            "Hovd": "+07:00",
            "Howland Island": "-12:00",
            "Hungary": "+01:00",
            "Iceland": "+00:00",
            "India": "+05:30",
            "Indian": "",
            "Indian Ocean": "+06:00",
            "Indian Pacific (Port Augusta)": "+08:00",
            "Indianapolis": "-05:00",
            "Indochina": "+07:00",
            "Inuvik": "-07:00",
            "Iqaluit": "-05:00",
            "Iran": "+03:30",
            "Iraq": "+03:00",
            "Ireland": "+00:00",
            "Irkutsk": "+08:00",
            "Irkutsk Oblast": "+08:00",
            "Islands of Maluku Islands": "+09:00",
            "Islands of Sulawesi": "+08:00",
            "Islands of Sumatra": "+07:00",
            "Isle of Man": "+00:00",
            "Israel": "+02:00",
            "Italy": "+01:00",
            "Ittoqqortoormiit": "-01:00",
            "Ituri Interim Administration": "+02:00",
            "Jakarta": "+07:00",
            "Jamaica": "-05:00",
            "Japan": "+09:00",
            "Jarvis Island": "-11:00",
            "Java": "+07:00",
            "Jayapura": "+09:00",
            "Jersey": "+00:00",
            "Jewish Autonomous Oblast": "+10:00",
            "Jewish Oblast": "+10:00",
            "Johnston": "-10:00",
            "Johnston Atoll": "-10:00",
            "Jordan": "+02:00",
            "Jujuy": "-03:00",
            "Juneau": "-09:00",
            "Kalgoorlie": "+08:00",
            "Kalimantan": "+07:00",
            "Kaliningrad": "+02:00",
            "Kaliningrad Oblast": "+02:00",
            "Kamchatka": "+12:00",
            "Kamchatka Krai": "+12:00",
            "Kasaï": "+02:00",
            "Kasaï Oriental": "+02:00",
            "Kasaï-Central": "+02:00",
            "Keeling Islands": "+06:30",
            "Kemerovo": "+07:00",
            "Kemerovo Oblast": "+07:00",
            "Kenya": "+03:00",
            "Kerguelen Islands": "+05:00",
            "Khabarovsk Krai": "+10:00",
            "Khakassia": "+07:00",
            "Khandyga": "+09:00",
            "Khanty–Mansia": "+05:00",
            "Khovd": "+07:00",
            "Kingman Reef": "-11:00",
            "Kinshasa": "+01:00",
            "Kiritimati": "+14:00",
            "Kirov": "+03:00",
            "Knox": "-06:00",
            "Kongo Central": "+01:00",
            "Korean": "+09:00",
            "Kosrae": "+11:00",
            "Kosrae and Pohnpei": "+11:00",
            "Krasnoyarsk": "+07:00",
            "Krasnoyarsk Krai": "+07:00",
            "Kuching": "+08:00",
            "Kurgan Oblast": "+05:00",
            "Kuwait": "+03:00",
            "Kwajalein": "+12:00",
            "Kwango": "+01:00",
            "Kwilu": "+01:00",
            "Kyrgyzstan": "+06:00",
            "Kyzylorda": "+05:00",
            "La Rioja": "-03:00",
            "Labrador": "-04:00",
            "Laos": "+07:00",
            "Latvia": "+02:00",
            "Lebanon": "+02:00",
            "Lesotho": "+02:00",
            "Liberia": "+00:00",
            "Libya": "+02:00",
            "Liechtenstein": "+01:00",
            "Lindeman": "+10:00",
            "Line Islands": "+14:00",
            "Lithuania": "+02:00",
            "Lloydminster": "-07:00",
            "Lomami": "+02:00",
            "Lord Howe": "+10:30",
            "Lord Howe Island": "+10:30",
            "Los Angeles": "-08:00",
            "Louisville": "-05:00",
            "Lualaba": "+02:00",
            "Lubumbashi": "+02:00",
            "Luxembourg": "+01:00",
            "Macau SAR China": "+08:00",
            "Macedonia": "+01:00",
            "Maceio": "-03:00",
            "Macquarie": "+11:00",
            "Macquarie Island": "+11:00",
            "Madagascar": "+03:00",
            "Madeira": "+00:00",
            "Madura": "+07:00",
            "Magadan": "+11:00",
            "Magadan Oblast": "+11:00",
            "Magallanes": "-03:00",
            "Mai-Ndombe": "+01:00",
            "Makassar": "+08:00",
            "Malawi": "+02:00",
            "Malaysia": "+08:00",
            "Maldives": "+05:00",
            "Mali": "+00:00",
            "Malta": "+01:00",
            "Manaus": "-04:00",
            "Mangystau": "+05:00",
            "Maniema": "+02:00",
            "Manitoba": "-06:00",
            "Marengo": "-05:00",
            "Marquesas": "-09:30",
            "Marquesas Islands": "-09:30",
            "Marshall Islands": "+12:00",
            "Martim Vaz": "-02:00",
            "Martinique": "-04:00",
            "Matamoros": "-06:00",
            "Mato Grosso": "-04:00",
            "Mato Grosso do Sul": "-04:00",
            "Mauritania": "+00:00",
            "Mauritius": "+04:00",
            "Mawson": "+05:00",
            "Mawson Station": "+05:00",
            "Mayotte": "+03:00",
            "Mazatlan": "-07:00",
            "McDonald Islands": "+05:00",
            "McMurdo": "+12:00",
            "McMurdo Station": "+12:00",
            "Melbourne": "+10:00",
            "Mendoza": "-03:00",
            "Menominee": "-06:00",
            "Merida": "-06:00",
            "Metlakatla": "-09:00",
            "Mexican Pacific": "-07:00",
            "Mexico": "-06:00",
            "Mexico City": "-06:00",
            "Midway": "-11:00",
            "Midway Atoll": "-11:00",
            "Moldova": "+02:00",
            "Monaco": "+01:00",
            "Moncton": "-04:00",
            "Mongala": "+01:00",
            "Montenegro": "+01:00",
            "Monterrey": "-06:00",
            "Monticello": "-05:00",
            "Montreal": "-05:00",
            "Montserrat": "-04:00",
            "Morocco": "+00:00",
            "Moscow": "+03:00",
            "Mountain": "-07:00",
            "Moutain": "-07:00",
            "Mozambique": "-01:00",
            "Myanmar": "+06:30",
            "Myanmar (Burma)": "+06:30",
            "Namibia": "+02:00",
            "Nauru": "+12:00",
            "Nayarit": "-07:00",
            "Nepal": "+05:45",
            "Netherlands": "+01:00",
            "New Brunswick": "-04:00",
            "New Caledonia": "+11:00",
            "New Salem": "-06:00",
            "New South Wales": "+10:00",
            "New South Wales (Yancowinna County)": "+09:30",
            "New York": "-05:00",
            "New Zealand": "+12:00",
            "Newfoundland": "-03:30",
            "Nicaragua": "-06:00",
            "Nicosia": "+02:00",
            "Niger": "+01:00",
            "Nigeria": "+01:00",
            "Nipigon": "-05:00",
            "Niue": "-11:00",
            "Nome": "-09:00",
            "Nord-Kivu": "+02:00",
            "Nord-Ubangi": "+01:00",
            "Norfolk Island": "+11:00",
            "Noronha": "-02:00",
            "North Kalimantan": "+08:00",
            "North Korea": "+08:30",
            "North Mariana Islands": "+10:00",
            "North Territory": "+09:30",
            "North West Ontario": "-06:00",
            "Northeast Region": "-03:00",
            "Northern Mariana Islands": "+10:00",
            "Northwest Mexico": "-08:00",
            "Northwest Territories": "-07:00",
            "Norway": "+01:00",
            "Nova Scotia": "-04:00",
            "Novokuznetsk": "+07:00",
            "Novosibirsk": "+07:00",
            "Novosibirsk Oblast": "+07:00",
            "Nunavut (Kitikmeot Region)": "-07:00",
            "Nunavut (Southampton Island)": "-05:00",
            "Nuuk": "-03:00",
            "Ojinaga": "-07:00",
            "Oman": "+04:00",
            "Omsk": "+06:00",
            "Omsk Oblast": "+06:00",
            "Oral": "+05:00",
            "Orenburg Oblast": "+05:00",
            "Pacific": "-08:00",
            "Pakistan": "+05:00",
            "Palau": "+09:00",
            "Palmer": "-03:00",
            "Palmer Station": "-03:00",
            "Palmyra Atoll": "-11:00",
            "Panama": "-05:00",
            "Pangnirtung": "-05:00",
            "Papua New Guinea": "+10:00",
            "Paraguay": "-04:00",
            "Pará": "-03:00",
            "Perm Krai": "+05:00",
            "Perth": "+08:00",
            "Peru": "-05:00",
            "Petersburg": "-05:00",
            "Petropavlovsk-Kamchatski": "+12:00",
            "Philippine": "+08:00",
            "Philippines": "+08:00",
            "Phoenix": "-07:00",
            "Phoenix Islands": "+13:00",
            "Pitcairn": "-08:00",
            "Pitcairn Islands": "-08:00",
            "Pituffik": "-04:00",
            "Pituffik Space Base": "-04:00",
            "Pohnpei": "+11:00",
            "Poland": "+01:00",
            "Ponape": "+11:00",
            "Pontianak": "+07:00",
            "Port Augusta": "+08:00",
            "Port Moresby": "+10:00",
            "Porto Velho": "-04:00",
            "Portugal": "+00:00",
            "Primorsky Krai": "+10:00",
            "Prince Edward Island": "-04:00",
            "Prince Edward Islands": "+03:00",
            "Puerto Rico": "-04:00",
            "Punta Arenas": "-03:00",
            "Pyongyang": "+08:30",
            "Qatar": "+03:00",
            "Quebec": "-05:00",
            "Queensland": "+10:00",
            "Quintana Roo": "-05:00",
            "Qyzylorda": "+06:00",
            "Rainy River": "-06:00",
            "Rankin Inlet": "-06:00",
            "Recife": "-03:00",
            "Regina": "-06:00",
            "Resolute": "-06:00",
            "Reunion": "+04:00",
            "Riau Islands": "+07:00",
            "Rio Branco": "-05:00",
            "Rio Gallegos": "-03:00",
            "Rocas Atoll": "-02:00",
            "Romania": "+02:00",
            "Rondônia": "-04:00",
            "Roraima": "-04:00",
            "Rothera": "-03:00",
            "Rothera Station": "-03:00",
            "Rwanda": "+02:00",
            "Réunion": "+04:00",
            "Saint Barthélemy": "-04:00",
            "Saint Helena": "+00:00",
            "Saint Martin": "-04:00",
            "Saint Miquelon": "-03:00",
            "Saint Paul": "+05:00",
            "Saint Paul Archipelago": "-02:00",
            "Saint Peter": "-02:00",
            "Saint Pierre": "-03:00",
            "Sakhalin": "+11:00",
            "Sakhalin Oblast": "+11:00",
            "Salta": "-03:00",
            "Samara": "+04:00",
            "Samara Oblast": "+04:00",
            "Samarkand": "+05:00",
            "Samoa": "+13:00",
            "San Juan": "-03:00",
            "San Luis": "-03:00",
            "San Marino": "+01:00",
            "Sankuru": "+02:00",
            "Santa Isabel": "-08:00",
            "Santarem": "-03:00",
            "Sao Paulo": "-03:00",
            "Saratov": "+04:00",
            "Saratov Oblast": "+04:00",
            "Saskatchewan": "-06:00",
            "Saudi Arabia": "+03:00",
            "Scattered Islands": "+03:00",
            "Senegal": "+00:00",
            "Serbia": "+01:00",
            "Seychelles": "+04:00",
            "Sierra Leone": "+00:00",
            "Simferopol": "+03:00",
            "Sinaloa": "-07:00",
            "Singapore": "+08:00",
            "Sint Maarten": "-04:00",
            "Sitka": "-09:00",
            "Slovakia": "+01:00",
            "Slovenia": "+01:00",
            "Society Islands": "-10:00",
            "Solomon": "+11:00",
            "Solomon Islands": "+11:00",
            "Somalia": "+03:00",
            "Sonora": "-07:00",
            "South Africa": "+02:00",
            "South Australia": "+09:30",
            "South East Labrador": "-03:30",
            "South Georgia": "-02:00",
            "South Georgia & South Sandwich Islands": "-02:00",
            "South Kalimantan": "+08:00",
            "South Korea": "+09:00",
            "South Region": "-03:00",
            "South Sandwich Islands": "-02:00",
            "South Sudan": "+03:00",
            "South West Amazonas": "-05:00",
            "Southeast Region": "-03:00",
            "Spain": "+01:00",
            "Srednekolymsk": "+11:00",
            "Sri Lanka": "+05:30",
            "St. Barthélemy": "-04:00",
            "St. Helena": "+00:00",
            "St. John's": "-03:30",
            "St. John’s": "-03:30",
            "St. Kitts & Nevis": "-04:00",
            "St. Lucia": "-04:00",
            "St. Martin": "-04:00",
            "St. Pierre & Miquelon": "-03:00",
            "St. Vincent & Grenadines": "-04:00",
            "Sud-Kivu": "+02:00",
            "Sud-Ubangia": "+01:00",
            "Sudan": "+02:00",
            "Suriname": "-03:00",
            "Svalbard & Jan Mayen": "+01:00",
            "Sverdlovsk Oblast": "+05:00",
            "Swaziland": "+02:00",
            "Sweden": "+01:00",
            "Swift Current": "-06:00",
            "Switzerland": "+01:00",
            "Sydney": "+10:00",
            "Syowa": "+03:00",
            "Syowa Station": "+03:00",
            "Syria": "+02:00",
            "São Tomé & Príncipe": "+00:00",
            "Tahiti": "-10:00",
            "Taipei": "+08:00",
            "Taiwan": "+08:00",
            "Tajikistan": "+05:00",
            "Tanganyika": "+02:00",
            "Tanzania": "+03:00",
            "Tarawa": "+12:00",
            "Tasmania": "+10:00",
            "Tell City": "-06:00",
            "Thailand": "+07:00",
            "Thule": "-04:00",
            "Thunder Bay": "-05:00",
            "Tijuana": "-08:00",
            "Timor-Leste": "+09:00",
            "Tocantins": "-03:00",
            "Togo": "+00:00",
            "Tokelau": "+13:00",
            "Tomsk": "+07:00",
            "Tomsk Oblast": "+07:00",
            "Tonga": "+13:00",
            "Toronto": "-05:00",
            "Trindade": "-02:00",
            "Trinidad & Tobago": "-04:00",
            "Tristan da Cunha": "+00:00",
            "Troll": "+00:00",
            "Troll Station": "+00:00",
            "Tshopo Interim Administration": "+02:00",
            "Tshuapa": "+01:00",
            "Tuamotus": "-10:00",
            "Tucuman": "-03:00",
            "Tungsten": "-08:00",
            "Tunisia": "+01:00",
            "Tunu": "+00:00",
            "Turkey": "+03:00",
            "Turkmenistan": "+05:00",
            "Turks & Caicos Islands": "-05:00",
            "Turks Islands": "-05:00",
            "Tuva": "+07:00",
            "Tuvalu": "+12:00",
            "Tyumen Oblast": "+05:00",
            "U.S. Virgin Islands": "-04:00",
            "Udmurtia": "+04:00",
            "Uganda": "+03:00",
            "Ukraine": "+02:00",
            "Ulaanbaatar": "+08:00",
            "Ulyanovsk": "+04:00",
            "Ulyanovsk Oblast": "+04:00",
            "United Arab Emirates": "+04:00",
            "United Kingdom": "+00:00",
            "Universal": "+00:00",
            "Uruguay": "-03:00",
            "Urumqi": "+06:00",
            "Ushuaia": "-03:00",
            "Ust-Nera": "+10:00",
            "Uvs": "+07:00",
            "Uzbekistan": "+05:00",
            "Uzhhorod": "+02:00",
            "Vancouver": "-08:00",
            "Vanuatu": "+11:00",
            "Vatican City": "+01:00",
            "Venezuela": "-04:00",
            "Vevay": "-05:00",
            "Victoria": "+10:00",
            "Vietnam": "+07:00",
            "Vincennes": "-05:00",
            "Vladivostok": "+10:00",
            "Volgograd": "+03:00",
            "Vostok": "+06:00",
            "Vostok Station": "+06:00",
            "Wake": "+12:00",
            "Wake Island": "+12:00",
            "Wallis": "+12:00",
            "Wallis & Futuna": "+12:00",
            "West Africa": "+01:00",
            "West Australia": "+08:00",
            "West Greenland": "-03:00",
            "West Kazakhstan": "+05:00",
            "West Kazakhstan (Aktobe)": "+05:00",
            "West New Guinea": "+09:00",
            "West Nunavut": "-07:00",
            "West Nusa Tenggara": "+08:00",
            "West Russia": "+03:00",
            "West Sakha Republic": "+09:00",
            "Western Argentina": "-03:00",
            "Western European": "+00:00",
            "Western Indonesia": "+07:00",
            "Western Sahara": "+00:00",
            "Whitehorse": "-08:00",
            "Winamac": "-05:00",
            "Winnipeg": "-06:00",
            "Yakutat": "-09:00",
            "Yakutsk": "+09:00",
            "Yamalia": "+05:00",
            "Yekaterinburg": "+05:00",
            "Yellowknife": "-07:00",
            "Yemen": "+03:00",
            "Yukon": "-08:00",
            "Zabaykalsky Krai": "+09:00",
            "Zambia": "+02:00",
            "Zaporozhye": "+02:00",
            "Zimbabwe": "+02:00",
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
            .replace(/\b(?<start>\d{1,2}(?::?\d\d)?)(?<premeridiem>\s*[ap]\.?m?\.?)?(?<delimeter>[\-\s]+)(?<stop>\d{1,2}(?::?\d\d)?)(?<postmeridiem>\s*[ap]\.?m?\.?)?\s*(?<timezone>\b(?:AOE|GMT|UTC|[A-Y]{1,4}T))\b/ig, ($0, start, preMeridiem, delimeter, stop, postMeridiem, timezone) => {
                let autoMeridiem = "AP"[+(new Date(STREAMER.data?.actualStartTime ?? +new Date).getHours() > 11)] + 'M';

                postMeridiem ||= autoMeridiem;
                preMeridiem ||= postMeridiem;

                let _mm = /(?<!:\d\d)$/, _00 = ':00';

                start = start.replace(_mm, _00);
                stop = stop.replace(_mm, _00);

                return [start, preMeridiem, delimeter, stop, postMeridiem, ' ', timezone].join('');
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
            rTitle = $('[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i]):not([class*="offline"i]) > p + p');

        parsing:
        for(let container of [...cTitle, rTitle].filter(defined)) {
            let [timezone, zone, type, trigger] = (null
                ?? (container?.innerText || '')
                    .normalize('NFKD')
                    .match(/(?:(?<zone>\p{L}{3,})[\s\-]+)(?:(?<type>\p{L}+)[\s\-]+)?(?<trigger>time)\b/iu)
                ?? []
            );

            let MASTER_TIME_ZONE;

            locator: if(defined(zone)) {
                for(let place in GEOGRAPHIC__CONVERSIONS)
                    if(RegExp(place.replaceAll('-', '-?'), 'i').test(zone)) {
                        MASTER_TIME_ZONE = GEOGRAPHIC__CONVERSIONS[place];
                        break locator;
                    }

                // Try to not mistake common suffixes and titles...
                // From: https://translated-into.com/{word}
                if(false
                    // "the"
                    || /\b(y?a(h|ng?)?|c[aá]c|d(as|e[nt]?|ie|u)|e([lw]|ta)|i(he|l|ng|tu|yo)?|[lk]a|ny|o|quod|t(h?e|us)|u|y)\b/i
                        .test(zone)
                    // "of"
                    || /\b(a([fvz]|pie|utem)|d(ari|[ei])|e[ae]|[fvn]an|gada|ji|kohta|n([ae]k?|ing?|ke|tawm|y)|o([dif]|\s?ka)?|s(aka|e)|[tv]on|ti(na)?|vun|y[ae]|z)\b/i
                        .test(zone)
                    // "for"
                    || /\b(aua|(b|ch)o|canys|dla|eest|f([oö]a?r|un|yrir)|gia|hoki|kw?a(nggo|y)?|m(aka|ert)|ngoba|[ps](ara|[eëo]u?r?|r([eo]|iek))|quia|rau|til|untuk|v(arten|i|oo)r|ye|z(a|um))\b/i
                        .test(zone)
                    // "nor" or "or"
                    // || /\b(n?or)\b/i
                    //     .test(zone)
                    // "but" or "and"
                    || /\b(a([bw]?er?|g(a|us)|ka?|[ls][ei]|m(m[ao]|pak)|nd|ti?)?|b(aina|[eu]t)|d(an|he)|e(n(gari)?|s|ta?)?|izda|k(a[ij]|[ou]ma)|l(an|e)|ja|lebe|m(a([anr]{2}|i?s)?|en|utta)|no|[ou]g|s(ed|is)|(te)?ta(b|pi)|u(nd)?|v[ae]|y)\b/i
                        .test(zone)
                    // "yet"
                    // || /\b(yet)\b/i
                    //     .test(zone)
                    // tensed words
                    || /\B(i?e[ds]|ing)$/i
                        .test(zone)
                )
                    break locator;

                MASTER_TIME_ZONE ??= (TIME_ZONE__CONVERSIONS[timezone?.length < 1? '': timezone = [zone, type ?? 'Standard', trigger].map((s = '') => s[0]).join('').toUpperCase()]?.length? timezone: '');
            }

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
                        timesone = timezone?.replace(/^([^s])t$/, '$1st')?.replace(/^([^S])T$/, '$1ST') ?? '';

                    let misint = timezone?.mutilate(),
                        MISINT = timezone?.toUpperCase(),
                        missnt = timesone?.mutilate(),
                        MISSNT = timesone?.toUpperCase();

                    // This isn't a timezone... it's a word...
                    if(true
                        && !(false
                            || MISINT in TIME_ZONE__CONVERSIONS
                            || MISSNT in TIME_ZONE__CONVERSIONS
                        )
                        && NON_TIME_ZONE_WORDS[misint?.[0]]?.[misint?.length]?.contains(misint)
                        && NON_TIME_ZONE_WORDS[missnt?.[0]]?.[missnt?.length]?.contains(missnt)
                    )
                        continue searching;

                    let now = new Date,
                        year = now.getFullYear(),
                        month = now.getMonth() + 1,
                        day = now.getDate(),
                        _hr_ = new Date(STREAMER.data?.actualStartTime || now).getHours(),
                        autoMeridiem = "AP"[+(_hr_ > 11)];

                    if(offset.length > 0 && isNaN(parseInt(offset)))
                        continue;

                    let houl = hour = parseInt(hour);

                    hour += (
                        Date.isDST()?
                            // Daylight Savings is active and Standard Time was detected
                            -/\Bs?t$/i.test(timezone):
                        // Daylight Savings is inactive and Daylight Time was detected
                        +/\Bdt$/i.test(timezone)
                    );

                    if(meridiem[0]?.unlike(autoMeridiem)) {
                        if(autoMeridiem == 'A')
                            hour -= 12;
                        else
                            hour += 12;

                        if(hour < 0)
                            hour += 24;
                    } else if(meridiem[0]?.equals(autoMeridiem)) {
                        if(autoMeridiem == 'P' && hour < 13)
                            hour += 12;
                        else if(hour > 11)
                            hour -= 12;
                    }

                    hour %= 24;

                    timezone ||= (offset.length? 'GMT': '');

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
                    innerHTML: unescape(atob(newText)).split('').join('&zwj;').pad('&zwj;'),
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
        $remark('Converting time zones...');

        RegisterJob('time_zones');
    }

    /*** @notImplemented
     *      _____  _                        _   _                 _
     *     |  __ \| |                      | \ | |               | |
     *     | |__) | |__   ___  _ __   ___  |  \| |_   _ _ __ ___ | |__   ___ _ __
     *     |  ___/| '_ \ / _ \| '_ \ / _ \ | . ` | | | | '_ ` _ \| '_ \ / _ \ '__|
     *     | |    | | | | (_) | | | |  __/ | |\  | |_| | | | | | | |_) |  __/ |
     *     |_|    |_| |_|\___/|_| |_|\___| |_| \_|\__,_|_| |_| |_|_.__/ \___|_|
     *
     *
     */
    Handlers.phone_number = () => {
        let syntax = /(?<countryCode>\+?\d{1,3})?[\s\.\-\(]?(?<areaCode>\d{3})?[\)\.\-\s]?(?<officeCode>\d{3})[\s\.\-]?(?<lineNumber>\d{1,4})/;
    };
    Timers.phone_number = 250;

    __PhoneNumber__:
    if(parseBool(Settings.phone_number)) {
        $remark('Parsing phone numbers...');

        RegisterJob('phone_number');
    }

    /***
     *       _____                                        _____  _                          _______                  _       _   _
     *      / ____|                                      |  __ \| |                        |__   __|                | |     | | (_)
     *     | |     ___  _ __ ___  _ __ ___   ___  _ __   | |__) | |__  _ __ __ _ ___  ___     | |_ __ __ _ _ __  ___| | __ _| |_ _  ___  _ __  ___
     *     | |    / _ \| '_ ` _ \| '_ ` _ \ / _ \| '_ \  |  ___/| '_ \| '__/ _` / __|/ _ \    | | '__/ _` | '_ \/ __| |/ _` | __| |/ _ \| '_ \/ __|
     *     | |___| (_) | | | | | | | | | | | (_) | | | | | |    | | | | | | (_| \__ \  __/    | | | | (_| | | | \__ \ | (_| | |_| | (_) | | | \__ \
     *      \_____\___/|_| |_| |_|_| |_| |_|\___/|_| |_| |_|    |_| |_|_|  \__,_|___/\___|    |_|_|  \__,_|_| |_|___/_|\__,_|\__|_|\___/|_| |_|___/
     *
     *
     */
    Handlers.common_phrase_translations = () => {
        let translations = [
            [/(Twitch|T.?T.?V|The)(.?s)?\s+(T\W?o\W?S\W?|Terms(?:.+of.+Service)?)/i, [`<a href="/legal/terms-of-service/" target="_blank">$&</a>`, e => defined(e.closest('[href]'))]], // Twitch's ToS
        ];

        for(let [phrases, [replacement, ignoreIf]] of translations)
            for(let element of $.getAllElementsByText(phrases)) {
                if(element != element.getElementByText(phrases))
                    continue; // Not lowest child
                if(ignoreIf(element))
                    continue; // Already within a link...

                element.innerHTML = element.innerHTML.replace(phrases, replacement);
            }
    };
    Timers.common_phrase_translations = 250;

    __CommonPhraseTranslations__:
    if(true) {
        RegisterJob('common_phrase_translations');
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
            when(line => (defined(line.element)? line: false), 1000, line).then(element => {
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
    if(UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.whisper_audio)) {
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
        TALLY = new Map,
        CHANNEL_POINTS_MULTIPLIER;

    function UpdateReceiptDisplay() {
        let receipt = EXACT_POINTS_EARNED - (EXACT_POINTS_SPENT + EXACT_POINTS_DEBTED),
            glyph = Glyphs.modify('channelpoints', { height: '20px', width: '20px', style: 'vertical-align:bottom' }),
            { abs } = Math;

        receipt = receipt.floorToNearest(parseInt(Settings.channelpoints_receipt_display.replace('round', '')) || 1);

        let TIME_LEFT = ((STREAMER.data?.dailyBroadcastTime ?? 16_200_000) - STREAMER.time);
        let AVAILABLE_POINTS = TIME_LEFT < 1? -1: ((120 + 200 * +!top.TWITCH_INTEGRITY_FAIL) * CHANNEL_POINTS_MULTIPLIER * (TIME_LEFT / 3_600_000)) | 0;

        if(AVAILABLE_POINTS < 1)
            AVAILABLE_POINTS = Infinity;

        RECEIPT_TOOLTIP.innerHTML = [
            // Earned
            abs(EXACT_POINTS_EARNED).suffix(' &uarr;', 1, 'natural'),
            // Spent
            abs(EXACT_POINTS_SPENT + EXACT_POINTS_DEBTED).suffix(' &darr;', 1, 'natural'),
            // Available (according to stremer's average stream time)
            parseBool(Settings.show_stats)?
                [furnish(`marquee[direction=left][scrollamount=1]`, { style: 'width:fit-content;vertical-align:top' }).html(`&larr;`), Glyphs.modify('channelpoints', { height: '12px', width: '12px', style: 'vertical-align:-1px;position:relative' }).asNode, furnish(`span#tt-points-left-this-stream`).html(AVAILABLE_POINTS.prefix('', 1, 'natural'))].map(e => e.outerHTML).join(''):
            null
        ].filter(defined).join(' | ');
        $('#tt-points-receipt').innerHTML = `${ glyph } ${ abs(receipt).suffix(`&${ 'du'[+(receipt >= 0)] }arr;`, 1, 'natural') }`;
    }

    setInterval(() => {
        let container = $('#tt-points-left-this-stream');

        if(nullish(container))
            return;

        let TIME_LEFT = ((STREAMER.data?.dailyBroadcastTime ?? 16_200_000) - STREAMER.time);
        let AVAILABLE_POINTS = TIME_LEFT < 1? -1: ((120 + 200 * +!top.TWITCH_INTEGRITY_FAIL) * CHANNEL_POINTS_MULTIPLIER * (TIME_LEFT / 3_600_000)) | 0;

        if(AVAILABLE_POINTS < 1)
            AVAILABLE_POINTS = Infinity;

        container.innerHTML = AVAILABLE_POINTS.prefix('', 1, 'natural');
    }, 250);

    __GetMultiplierAmount__:
    if(nullish(CHANNEL_POINTS_MULTIPLIER)) {
        let button = $('[data-test-selector*="points"i][data-test-selector*="summary"i] button');

        if(defined(button)) {
            button.click();

            $('.reward-center-body [href*="//help.twitch.tv/"i]')
                ?.closest('.reward-center-body')
                ?.querySelector('button')
                ?.click();

            CHANNEL_POINTS_MULTIPLIER = parseFloat($('#channel-points-reward-center-header h6')?.innerText) || 1;

            button.click();
        } else {
            CHANNEL_POINTS_MULTIPLIER = 1;
        }
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
                        '&infin;':
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

                if(rank.equals('&infin;'))
                    placementString = `Unable to get your rank for this channel`;
                else
                    placementString = `You are in the top ${ place }% of ${ (STREAMER.ping? 'follow': 'view') }ers`;

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
                return RestartJob('points_receipt_placement', 'missing:live_time');

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
                    balance = $.last('[data-test-selector*="balance-string"i]'),
                    exact_debt = $('[data-test-selector^="prediction-checkout"i], [data-test-selector*="user-prediction"i][data-test-selector*="points"i], [data-test-selector*="user-prediction"i] p, [class*="points-icon"i] ~ p *:not(:empty)'),
                    exact_change = $('[class*="points"i][class*="summary"i][class*="add-text"i]');

                if(nullish(points_receipt))
                    return RestartJob('points_receipt_placement', 'missing:points_receipt');

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

                $log(`Observing "${ animationID }" @ ${ new Date }`, OBSERVED_COLLECTION_ANIMATIONS);

                if(!~[points_receipt, exact_change, balance].findIndex(defined)) {
                    points_receipt?.parentElement?.remove();

                    RestartJob('points_receipt_placement', 'missing:points_receipt,exact_change,balance');

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

                                $log(`Spent ${ amount } on "${ title }"`, new Date);
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
                                let title = $('[class*="community"i][class*="stack"i] [data-test-selector="header"i] ~ *')?.textContent ?? 'Something? No real title given',
                                    [amount] = /\p{N}+/u.exec(currentTarget?.textContent) || '';

                                EXACT_POINTS_SPENT += (amount |= 0);
                                TALLY.set(`Poll: "${ title }" @ ${ (new Date).toJSON() }`, amount | 0);

                                delete REDEMPTION_LISTENERS.BRIBABLE_VOTES;
                                addListener(2);

                                $log(`Spent ${ amount } on "${ title }"`, new Date);
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
    let POINT_WATCHER_COUNTER = 0,
        HAS_POINTS_BALANCE = false;

    Handlers.point_watcher_placement = async() => {
        // Display the points
        new StopWatch('point_watcher_placement');

        if(top.WINDOW_STATE == "unloading")
            return;

        // Color the balance text
        let balance = $.last('[data-test-selector*="balance-string"i]');

        balance?.setAttribute('rainbow-border', await STREAMER.done);
        balance?.setAttribute('bottom-only', '');

        let richTooltip = $('[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i])');

        if(nullish(richTooltip))
            return StopWatch.stop('point_watcher_placement', 30_000);

        let [title, subtitle, ...footers] = richTooltip.children,
            [target] = footers.map(footer => $('[class*="tooltip"i][class*="text"i]', footer)).filter(defined);

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

            amount = (amount ?? '')?.replace('.0', '');
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

            // Update the points (every 15s | 60 × 1/4)
            if(!(POINT_WATCHER_COUNTER++ % 60)) {
                let allRewards = (await STREAMER.shop).filter(reward => reward.enabled),
                    balance = STREAMER.coin || 0;

                HAS_POINTS_BALANCE ||= defined(balance);

                amount = ((balance? balance.suffix('', 1).replace('.0','').toUpperCase(): 0) || (HAS_POINTS_BALANCE? amount: '&#128683;'));
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
            }

            // @performance
            PrepareForGarbageCollection(ChannelPoints);
        });

        StopWatch.stop('point_watcher_placement', 2_700);
    };
    Timers.point_watcher_placement = 250;

    Unhandlers.point_watcher_placement = () => {
        $.all('.tt-point-amount')
            .forEach(span => span.remove());
    };

    __PointWatcherPlacement__:
    if(parseBool(Settings.point_watcher_placement)) {
        when.defined(() => $.last('[data-test-selector*="balance-string"i]')?.closest('button'))
            .then(async balanceButton => {
                RegisterJob('point_watcher_placement');

                let jump = (STREAMER.jump?.[STREAMER.name?.toLowerCase?.()]?.stream?.points);

                // $notice('[primary] How many channel points does the user have?', jump?.balance | 0);
                if(defined(jump?.balance))
                    return;

                let shop = (await STREAMER.shop);

                balanceButton.click();

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
                                    'SUBSONLY': 'SINGLE_MESSAGE_BYPASS_SUB_MODE',
                                    SINGLE_MESSAGE_BYPASS_SUB_MODE: 'SINGLE_MESSAGE_BYPASS_SUB_MODE',

                                    'HIGHLIGHT': 'SEND_HIGHLIGHTED_MESSAGE',
                                    SEND_HIGHLIGHTED_MESSAGE: 'SEND_HIGHLIGHTED_MESSAGE',

                                    'MODIFY-EMOTE': 'CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK',
                                    CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK: 'CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK',

                                    'RANDOM-EMOTE': 'RANDOM_SUB_EMOTE_UNLOCK',
                                    RANDOM_SUB_EMOTE_UNLOCK: 'RANDOM_SUB_EMOTE_UNLOCK',

                                    'CHOOSE-EMOTE': 'CHOSEN_SUB_EMOTE_UNLOCK',
                                    CHOSEN_SUB_EMOTE_UNLOCK: 'CHOSEN_SUB_EMOTE_UNLOCK',
                                }[imgName.replace(/(\W?\d+)?\.(gif|jpe?g|png)$/i, '').replace(/^(\d+)$/, imgSub).toUpperCase()]):
                            null
                        );

                    let item = {
                        title, cost,
                        image: { url: image },

                        backgroundColor: Color.destruct(backgroundColor).HEX,
                        id: (realId ?? UUID.from([image, title.mutilate(), cost].join('|$|'), true).value),
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

                wait(30).then(() => balanceButton.click());
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

        let [title, subtitle] = $.all('[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i]) > *', richTooltip),
            isOnline = parseBool(richTooltip.classList?.value?.missing('offline'));

        if(nullish(subtitle)) {
            let [rTitle, rSubtitle] = $.all('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="metadata"i] > *');

            title = rTitle;
            subtitle = rSubtitle;
        }

        if(nullish(title))
            return StopWatch.stop('stream_preview'), STREAM_PREVIEW?.element?.remove();

        let [alias] = title.textContent.split(/[^\p{L}\w\s]/u);

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
                            $.all('[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i])').at($('#tt-stream-preview--iframe').dataset.index | 0)?.closest('[href^="/videos/"i]')?.modStyle(`background:var(--color-twitch-purple-${ 6 + (THEME.equals('light')? 6: 0) })`);

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
        $remark('Adding Stream previews...');

        top.onlocationchange = Unhandlers.stream_preview;

        // Add key event listeners to the card
        $.body.addEventListener('keyup', ({ key = '', altKey, ctrlKey, metaKey, shiftKey }) => {
            if(altKey || ctrlKey || metaKey || shiftKey)
                return;

            if(!/^Arrow(Up|Down)$/i.test(key))
                return;

            let richTooltips = $.all(`[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i])`),
                { length } = richTooltips,
                iframe = $('#tt-stream-preview--iframe');

            if(nullish(iframe) || richTooltips.length < 1)
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
        WATCH_TIME_TOOLTIP,
        THIS_POLL = STREAMER.poll,
        THAT_POLL = 1,
        GET_TOP_100_INTERVAL,
        TOP_100_GAME = STREAMER.game,
        IN_TOP_100,
        ALL_WATCHTIME_COUNTS = {},
        ALL_WATCHTIME_VALUES = {};

    Handlers.watch_time_placement = async() => {
        let placement;

        if((placement = Settings.watch_time_placement ??= "null").equals("null"))
            return;

        let parent, container,
            extra = () => {};

        let classes = element => [...element.classList].map(label => '.' + label).join('');

        let live_time = $('.live-time');

        if(nullish(live_time))
            return RestartJob('watch_time_placement', 'missing:live_time');

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
                    live_time.modStyle('color:var(--color-text-live)');

                    if(parseBool(Settings.show_stats))
                        live_time.tooltipAnimation = setInterval(() => {
                            live_time.tooltip ??= new Tooltip(live_time, '');

                            let percentage = (STREAMER.time / (STREAMER.data?.dailyBroadcastTime ?? 16_200_000)).clamp(0, 1),
                                timeLeft = (STREAMER.data?.dailyBroadcastTime ?? 16_200_000) - STREAMER.time;

                            live_time.tooltip.innerHTML = (timeLeft < 0? '+': '') + toTimeString(Math.abs(timeLeft), 'clock');
                            live_time.tooltip.modStyle(`background:linear-gradient(90deg, hsla(${ (120 * percentage) | 0 }, 100%, 50%, 0.5) ${ (100 * percentage).toFixed(2) }%, #0000 0), var(--color-background-tooltip)`);
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

        Cache.load([CURRENT_WATCHTIME_NAME, `Watching`], _ => {
            let { Watching } = _;
            if(!(Watching instanceof Array))
                Watching = [];

            if((Watching ??= [NORMALIZED_PATHNAME]).missing(NORMALIZED_PATHNAME)) {
                Watching.push(NORMALIZED_PATHNAME);
                STARTED_WATCHING = +($('#root').dataset.aPageLoaded ??= +new Date);
            }

            _[CURRENT_WATCHTIME_NAME] >>= 0;

            WATCH_TIME_INTERVAL = setInterval(() => {
                let watch_time = $('#tt-watch-time'),
                    time = GET_WATCH_TIME();

                if(nullish(watch_time) || !time) {
                    clearInterval(WATCH_TIME_INTERVAL);
                    return RestartJob('watch_time_placement', 'missing:watch_time|time');
                }

                watch_time.setAttribute('time', time);
                watch_time.innerHTML = toTimeString(time, 'clock');
                watch_time.modStyle(`mix-blend-mode:${ ANTITHEME }en;`);

                if(parseBool(Settings.show_stats))
                    WATCH_TIME_TOOLTIP.innerHTML = toTimeString(time, 'short-epoch');

                Cache.load(null, _ => {
                    for(let [key, val] of Object.entries(_).filter((key, val) => /^WatchTimes\/([\w\-]+)/.test(key))) {
                        fixer: if(UP_NEXT_ALLOW_THIS_TAB) {
                            if(key == CURRENT_WATCHTIME_NAME)
                                break fixer;

                            let count = ALL_WATCHTIME_COUNTS[key] >>= 0;
                            let value = ALL_WATCHTIME_VALUES[key] >>= 0;

                            if(value != val) {
                                ALL_WATCHTIME_COUNTS[key] = 0;
                                ALL_WATCHTIME_VALUES[key] = val;
                                continue;
                            }

                            if(++count > 60) {
                                Cache.remove(key);
                                delete ALL_WATCHTIME_COUNTS[key];
                                delete ALL_WATCHTIME_VALUES[key];

                                continue;
                            }

                            ALL_WATCHTIME_COUNTS[key] = count;
                        }

                        if(key == CURRENT_WATCHTIME_NAME)
                            val = time;

                        Cache.save({ [key]: val });
                    }
                });
            }, 500 + (Math.random() * 500));

            Cache.save({ Watching });
        });

        function getTop100(callback = $ => $) {
            let { filename } = parseURL(STREAMER.game.href);

            if(!filename?.length)
                return;

            fetchURL.idempotent(`https://gql.twitch.tv/gql`, {
                method: "POST",
                headers: { "client-id": Search.anonID },
                body: JSON.stringify([{
            		operationName: "DirectoryPage_Game",
            		variables: {
            			imageWidth: 50,
            			slug: filename,
            			options: {
            				sort: "VIEWER_COUNT",
            				freeformTags: null,
            				tags: [],
            				broadcasterLanguages: [],
            				systemFilters: [],
            			},
            			sortTypeIsRecency: false,
            			limit: 100, // [1, 100]
            		},
                    extensions: {
                        persistedQuery: {
                            version: 1,
                            sha256Hash: `3c9a94ee095c735e43ed3ad6ce6d4cbd03c4c6f754b31de54993e0d48fd54e30`,
                        },
                    },
            	}]),
            }).then(r => r.json()).then(json => {
                if(!json?.length)
                    throw `No query data available @ ${ filename }`;

                [json] = json;

                if(json.errors)
                    throw json.errors.join('; ');
                let edges = json
                    ?.data      // [...{ game:object }]
                    ?.game      // { displayName:string, id:string<int>, name:string, streams:object }
                    ?.streams   // { edges:array<object>, pageInfo:object<{ hasNextPage:boolean }> }
                    ?.edges     // [...{ broadcaster:object, freeFormTags:object|array, game:object, id:string<int~GameID>, previewImageURL:object<{ *:string<URL> }>, title:string, type:string, viewersCount:number<int> }]
                ?? [];

                let { game, poll, sole } = STREAMER;

                let polls = [{ sole, poll }], spot = 1, place = null;
                for(let edge of edges) {
                    let { broadcaster, freeFormTags, game, id, previewImageURL, title, type, viewersCount } = edge.node;

                    if(sole == broadcaster.id)
                        place = spot;

                    polls.push({ sole: broadcaster.id, poll: viewersCount, spot: spot++ });
                }

                let container = $('[data-a-target*="viewer"i][data-a-target*="count"i]').parentElement;

                if(IN_TOP_100 = defined(place))
                    new Tooltip(container, `Top 100! #${ place } for <ins>${ game }</ins>`)
                        .setAttribute('rainbow-border', true);
                else if(nullish(IN_TOP_100 = null))
                    new Tooltip(container, `Viewer change: &${ 'du'[+(THIS_POLL >= THAT_POLL)] }arr; ${ Math.abs(THIS_POLL - THAT_POLL) }`)
                        .setAttribute('rainbow-border', false);

                callback();
            }).catch(error => {
                $warn(error);

                clearInterval(GET_TOP_100_INTERVAL);
            });
        }

        GET_TOP_100_INTERVAL = setInterval(() => {
            THIS_POLL = STREAMER.poll;

            let updt = () => THAT_POLL = THIS_POLL;
            let DIFF = Math.abs(THIS_POLL - THAT_POLL) / THAT_POLL;

            // The game has changed
            if(TOP_100_GAME.unlike(STREAMER.game))
                return (TOP_100_GAME = STREAMER.game) && getTop100(updt);
            // 15% change in polls
            if(THIS_POLL > 5000 && DIFF > .15)
                getTop100(updt); // for gradual changes
            // 10% change in polls
            if(THIS_POLL > 500 && THIS_POLL <= 5000 && DIFF > .10)
                getTop100(updt); // for gradual changes
            // 5% change in polls
            else if(THIS_POLL > 50 && THIS_POLL <= 500 && DIFF > .05)
                getTop100(updt); // for gradual changes
            // Any change in polls
            else if(THIS_POLL <= 50 && THIS_POLL != THAT_POLL)
                if(IN_TOP_100 || nullish(IN_TOP_100))
                    getTop100(updt); // for gradual changes

            // THAT_POLL = THIS_POLL; // for spikes
        }, 5_000);
    };
    Timers.watch_time_placement = -1000;

    Unhandlers.watch_time_placement = () => {
        clearInterval(WATCH_TIME_INTERVAL);

        $('#tt-watch-time')?.parentElement?.remove();

        let live_time = $('.live-time');

        live_time?.removeAttribute('style');
        live_time?.tooltip?.remove?.();
        clearInterval(live_time?.tooltipAnimation);

        if(UnregisterJob.__reason__.anyOf('modify', 'reinit'))
            return;

        Cache.save({ Watching: [] });
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
    let AUTO_DVR__CHECKING, AUTO_DVR__CHECKING_INTERVAL,
        MASTER_VIDEO = $('[data-a-player-state] video');

    // Might take a few seconds to fulfill...
    when.defined(() => $('[data-a-player-state] video')).then(_ => MASTER_VIDEO = _);

    Handlers.video_clips__dvr = () => {
        new StopWatch('video_clips__dvr');

        // Add the button to all channels
        let actionPanel = $('.about-section__actions');

        if(nullish(actionPanel))
            return StopWatch.stop('video_clips__dvr');

        Cache.load('DVRChannels', async({ DVRChannels }) => {
            try {
                DVRChannels = JSON.parse(DVRChannels || '{}');
            } catch(error) {
                // Probably an object already...
                DVRChannels ??= {};
            }

            let f = furnish,
                s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"),
                DVR_ID = STREAMER.name.toLowerCase(),
                enabled = parseBool(DVRChannels[DVR_ID]?.length),
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
                            try {
                                DVRChannels = JSON.parse(DVRChannels || '{}');
                            } catch(error) {
                                // Probably an object already...
                                DVRChannels ??= {};
                            }

                            let s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"),
                                DVR_ID = STREAMER.name.toLowerCase(),
                                enabled = !parseBool(DVRChannels[DVR_ID]?.length),
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
                                            MASTER_VIDEO.DEFAULT_RECORDING = Recording.proxy(MASTER_VIDEO, { name: 'AUTO_DVR', as: DVR_CLIP_PRECOMP_NAME, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats });

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
                            Cache.save({ DVRChannels }, () => Settings.set({ 'DVR_CHANNELS': Object.keys(DVRChannels) }).then(() => parseBool(message) && alert.timed(message, 7000)).catch($warn));
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
                            MASTER_VIDEO.DEFAULT_RECORDING = Recording.proxy(MASTER_VIDEO, { name: 'AUTO_DVR', mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats });

                            MASTER_VIDEO.DEFAULT_RECORDING.then(Handlers.__MASTER_AUTO_DVR_HANDLER__);
                        });
                    });

                let leaveHandler = STREAMER.onraid = STREAMER.onhost = top.beforeleaving = top.onlocationchange = async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
                    if(STASH_SAVED)
                        return;
                    STASH_SAVED = true;

                    for(let [guid, { recording }] of Recording.__RECORDERS__)
                        if(recording == MASTER_VIDEO.DEFAULT_RECORDING)
                            recording?.stop()?.save(DVR_CLIP_PRECOMP_NAME);
                        else
                            recording?.stop()?.save();

                    let next = await GetNextStreamer();

                    $log('Saving current DVR stash. Reason:', { hosting, raiding, raided, leaving: defined(from) }, 'Moving onto:', next);
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

            // @performance
            PrepareForGarbageCollection(DVRChannels);
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
                        return new ClipName(2);

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

        top.addEventListener('beforeunload', async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
            if(STASH_SAVED)
                return;
            STASH_SAVED = true;

            for(let [guid, { recording }] of Recording.__RECORDERS__)
                if(recording == MASTER_VIDEO.DEFAULT_RECORDING)
                    recording?.stop()?.save(DVR_CLIP_PRECOMP_NAME);
                else
                    recording?.stop()?.save();

            let next = await GetNextStreamer();

            $log('Saving current DVR stash. Reason:', { hosting, raiding, raided, leaving: defined(from) }, 'Moving onto:', next);
        });
    } catch(error) {
        /* Ignore these errors :P */
    }

    Handlers.__MASTER_AUTO_DVR_HANDLER__ = event => {
        MASTER_VIDEO.DEFAULT_RECORDING?.then(({ target }) => {
            let chunks = target.blobs;
            let feed = $(`.tt-prompt[uuid="${ UUID.from(body).value }"i]`),
                halt = parseBool(feed?.getAttribute('halt')),
                name = (feed?.getAttribute('value') || DVR_CLIP_PRECOMP_NAME).replace(GetFileSystem().allIllegalFilenameCharacters, '-');
        })
        ?.stop()
        ?.save(DVR_CLIP_PRECOMP_NAME)
        ?.then(link => alert.silent(`
            <video controller controls
                title="Video Saved &mdash; ${ link.download }"
                src="${ link.href }" style="max-width:-webkit-fill-available"
            ></video>
            `)
        );
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

    __AutoDVR__:
    if(parseBool(Settings?.video_clips__dvr)) {
        $remark('Adding DVR functionality...');

        function HandleAd(adCountdown) {
            let [main, mini] = $.all('video');

            if(false
                || nullish(main)
                || !main.hasRecording('AUTO_DVR')
                || nullish(mini)
            )
                return when.defined(() => $('[data-a-target*="ad-countdown"i]')).then(HandleAd);

            let blobs = main.getRecording('AUTO_DVR')?.blobs ?? [];

            let InsertChunksAt = blobs.length;

            let AdBreak = Recording.proxy(mini, { name: 'AUTO_DVR:AD_HANDLER', mimeType: main.mimeType });

            AdBreak.then(event => {
                let chunks = event.target.blobs;

                $notice(`Adding chunks to main <video> @ ${ InsertChunksAt }`, { blobs, chunks, event });

                blobs.splice(InsertChunksAt, 0, ...chunks);
            });

            when.nullish(() => $('[data-a-target*="ad-countdown"i]'))
                .then(() => {
                    let [main, mini] = $.all('video');

                    main?.resumeRecording('AUTO_DVR');
                    mini?.stopRecording('AUTO_DVR:AD_HANDLER');

                    when.defined(() => $('[data-a-target*="ad-countdown"i]'))
                        .then(HandleAd);

                    $notice(`Ad is done playing... ${ toTimeString((new Date) - main?.getRecording('AUTO_DVR')?.creationTime, 'clock') } | ${ (new Date).toJSON() }`, { main, mini, blobs, chunks: mini?.getRecording('AUTO_DVR:AD_HANDLER')?.blobs });
                });

            main.pauseRecording('AUTO_DVR');

            $notice(`There is an ad playing... ${ toTimeString((new Date) - main.getRecording('AUTO_DVR')?.creationTime, 'clock') } | ${ (new Date).toJSON() }`, { main, mini });
        }

        when.defined(() => $('[data-a-target*="ad-countdown"i]'))
            .then(HandleAd);

        // This is where the magic happens
            // Begin looking for DVR channels...
        AUTO_DVR__CHECKING_INTERVAL =
        setInterval(AUTO_DVR__CHECKING ??= () => {
            new StopWatch('video_clips__dvr__checking_interval');

            if(UP_NEXT_ALLOW_THIS_TAB)
                Cache.load('DVRChannels', async({ DVRChannels }) => {
                    try {
                        DVRChannels = JSON.parse(DVRChannels || '{}');
                    } catch(error) {
                        // Probably an object already...
                        DVRChannels ??= {};
                    }

                    checking:
                    // Only check for the stream when it's live; if the dates don't match, it just went live again
                    for(let DVR_ID in DVRChannels) {
                        let streamer = (DVR_ID + '').toLowerCase();
                        let channel = await new Search(streamer).then(Search.convertResults),
                            ok = parseBool(channel?.ok);

                        // Search did not complete...
                        let num = 3;
                        while(!ok && num-- > 0) {
                            delete channel;

                            Search.void(streamer);

                            // @research
                            channel = await new Search(streamer).then(Search.convertResults);
                            ok = parseBool(channel?.ok);

                            // $warn(`Re-search, ${ num } ${ 'retry'.pluralSuffix(num) } left [DVR]: "${ streamer }" → OK = ${ ok }`);
                        }

                        if(!num && !ok) {
                            channel = ALL_CHANNELS.find(channel => channel.name.equals(DVR_ID));

                            if(nullish(channel?.name))
                                continue checking;
                        }

                        if(!parseBool(channel.live)) {
                            // @performance
                            PrepareForGarbageCollection(channel, DVRChannels);

                            continue checking;
                        }

                        let { name, live, icon, href, data = { actualStartTime: null } } = channel,
                            slug = DVRChannels[name.toLowerCase()],
                            enabled = defined(slug);
                        let index = (ALL_FIRST_IN_LINE_JOBS.findIndex(href => parseURL(href).pathname.slice(1).equals(name))),
                            job = ALL_FIRST_IN_LINE_JOBS[index];

                        if(defined(job) && name.unlike(STREAMER.name) && enabled) {
                            // Skip the queue!
                            let [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1),
                                name = parseURL(removed).pathname.slice(1);

                            $notice(`Skipper work:`, removed);

                            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(FIRST_IN_LINE_TIMER);

                            // Skipper
                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: parseBool(parseURL(removed).searchParameters?.redo) });

                            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                                $log('Skipping queue in favor of a DVR channel', job);

                                goto(parseURL(job).addSearch({ dvr: true }).href);
                            });
                        }

                        // Release memory...
                        delete channel;
                    }

                    // Send the length to the settings page
                    Settings.set({ 'DVR_CHANNELS': Object.keys(DVRChannels) });

                    StopWatch.stop('video_clips__dvr__checking_interval', 30_000);

                    // @performance
                    PrepareForGarbageCollection(DVRChannels);
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
                try {
                    DVRChannels = JSON.parse(DVRChannels || '{}');
                } catch(error) {
                    // Probably an object already...
                    DVRChannels ??= {};
                }

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
                                if(compareVersions(`${ Manifest.version } ≥ 5.33.0.8`)) // @deprecated
                                    confirm.silent(`<div hidden controller deny="Why?" okay="Acknowledge (interact)" title="${ STREAMER.name } &mdash; DVR Notice"></div>
                                        To guarantee DVRs save when this page navigates to another stream (or reloads unexpectedly), you must interact with this page.
                                    `)
                                        .then(answer => {
                                            if(!answer)
                                                open('https://developer.mozilla.org/en-US/docs/Web/Security/User_activation', '_blank');
                                        });

                                if(parseBool($('[data-recording-status]')?.getAttribute('data-recording-status')))
                                    new Tooltip($('[data-recording-status]'), `Recording this stream: ${ STREAMER.name }`);

                                // Extra handler. This is suppose to handle ad-recording. But it's above (see `enabled && !STREAMER.redo`)
                                if(MASTER_VIDEO.hasRecording('AUTO_DVR'))
                                    return /* Already recording over ads... */;

                                when.nullish(() => $('[data-a-target*="ad-countdown"i]'))
                                    .then(() => {
                                        let recordingKey = 'AUTO_DVR:AD_COUNTDOWN';

                                        SetQuality(VideoClips.quality, 'auto').then(() => {
                                            Recording.proxy(MASTER_VIDEO, { name: recordingKey, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats })
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
                                    if(STASH_SAVED)
                                        return;
                                    STASH_SAVED = true;

                                    let DVR_ID = STREAMER.name.toLowerCase();

                                    for(let [guid, { recording }] of Recording.__RECORDERS__)
                                        if(recording == MASTER_VIDEO.DEFAULT_RECORDING)
                                            recording?.stop()?.save(DVR_CLIP_PRECOMP_NAME);
                                        else
                                            recording?.stop()?.save();

                                    let next = await GetNextStreamer();

                                    $log('Saving current DVR stash. Reason:', { hosting, raiding, raided, leaving: defined(from) }, 'Moving onto:', next);
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

                // @performance
                PrepareForGarbageCollection(DVRChannels);
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
    let SECONDS_VIDEO_PAUSED_UNSAFELY = 0,
        VIDEO_CREATION_TIME,
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
        VIDEO_CREATION_TIME ??= creationTime;

        // The total number of frames created. Should constantly increase
        TOTAL_VIDEO_FRAMES ??= totalVideoFrames;

        // if the page isn't in focus, ignore this setting
        // if the video is paused by the user (trusted) move on
        if((paused && isTrusted) || PAGE_HAS_FOCUS === false)
            return StopWatch.stop('recover_frames');

        // The video is stalling: either stuck on the same frame, or lagging behind 15 frames
        if(creationTime !== VIDEO_CREATION_TIME && (totalVideoFrames === TOTAL_VIDEO_FRAMES || totalVideoFrames - TOTAL_VIDEO_FRAMES < 15)) {
            if(SECONDS_VIDEO_PAUSED_UNSAFELY > 0 && !(SECONDS_VIDEO_PAUSED_UNSAFELY % 5))
                $warn(`The video has been stalling for ${ SECONDS_VIDEO_PAUSED_UNSAFELY }s`, { VIDEO_CREATION_TIME, TOTAL_VIDEO_FRAMES, SECONDS_VIDEO_PAUSED_UNSAFELY }, 'Frames fallen behind:', totalVideoFrames - TOTAL_VIDEO_FRAMES);

            if(SECONDS_VIDEO_PAUSED_UNSAFELY > 5 && !(SECONDS_VIDEO_PAUSED_UNSAFELY % 3)) {
                __RecoverFrames_Embed__:
                if(parseBool(Settings.recover_frames__allow_embed)) {
                    $warn(`Attempting to override the video`);
                    $('#tt-embedded-video')?.remove();

                    let container = $('video')?.closest('[class*="container"i]');

                    if(nullish(container))
                        break __RecoverFrames_Embed__;

                    let { name } = STREAMER,
                        controls = true,
                        iframe;

                    container.insertAdjacentElement('afterbegin', iframe =
                        furnish(`iframe#tt-embedded-video`, {
                            allow: 'autoplay',
                            src: parseURL(`https://player.twitch.tv/`).addSearch({
                                channel: name,
                                parent: 'twitch.tv',
                                [video.muted? 'muted': 'volume']: video[video.muted? 'muted': 'volume'],

                                controls,
                            }).href,

                            style: `border: 1px solid var(--color-warn); position:absolute; top:0; z-index:99999;`,

                            height: '100%',
                            width: '100%',

                            onload(event) {
                                when.defined(() => {
                                    let iDocument = $('#tt-embedded-video')?.contentDocument;

                                    if(nullish(iDocument))
                                        return /* No iframe document */;

                                    let iVideo = $('video', iDocument), video = $('video');

                                    if(nullish(iVideo))
                                        return /* No iframe video */;

                                    if((iVideo.currentTime || 0) <= 0)
                                        return /* iframe video not loading */;

                                    // Continue recordings...
                                    for(let [key, { recording }] of video.getRecording(Recording.ALL)) {
                                        let { name, as, maxTime } = recording;

                                        maxTime = parseFloat(maxTime);
                                        maxTime = maxTime < 0? Infinity: maxTime;

                                        if(!/^\[\[(.+)\]\]$/.test(key)) {
                                            recording.save();
                                            Recording.proxy(iVideo, { name, as, maxTime }).then(event => {
                                                let { target } = event;
                                                let { recording } = target;
                                                let { name, as } = recording;

                                                if(name.startsWith('AUTO_DVR'))
                                                    Handlers.__MASTER_AUTO_DVR_HANDLER__.call(target, event);
                                                else
                                                    recording.save(as);
                                            });
                                        }
                                    }

                                    return VIDEO_OVERRIDE = true;
                                }, 2_5_0);
                            },
                        })
                    );

                    $('video').muted = true;
                    $('video', container).modStyle(`display:none`);
                    $('[data-a-player-state]')?.setTooltip(`${ name }'${ /s$/.test(name)? '': 's' } stream ran into an error`);
                } else {
                    $warn(`Attempting to pause/play the video`);

                    if($('button[data-a-player-state]')?.dataset?.aPlayerState?.equals('playing')) {
                        $('button[data-a-player-state]').click();

                        wait(1000).then(() => $('button[data-a-player-state]')?.click());
                    }
                }
            }

            // Try constantly overwriting to see if the video plays
            // VIDEO_CREATION_TIME = creationTime; // Keep this from becoming true to force a re-run
            TOTAL_VIDEO_FRAMES = totalVideoFrames;

            ++SECONDS_VIDEO_PAUSED_UNSAFELY;

            video.stalling = true;
        }
        // The video is playing
        else {
            // Start over
            VIDEO_CREATION_TIME = creationTime;
            TOTAL_VIDEO_FRAMES = totalVideoFrames;

            video.stalling = false;

            // Reset the timer whenever the video is recovered
            return SECONDS_VIDEO_PAUSED_UNSAFELY = 0;
        }

        if(SECONDS_VIDEO_PAUSED_UNSAFELY > 15)
            ReloadPage();

        StopWatch.stop('recover_frames');
    };
    Timers.recover_frames = 1000;

    __RecoverFrames__:
    if(parseBool(Settings.recover_frames)) {
        $.on('visibilitychange', event => PAGE_HAS_FOCUS = document.visibilityState.equals("visible"));

        RegisterJob('recover_frames');

        $warn("[Recover-Frames] is monitoring the stream...");
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
                playing.catch($error);
        } catch(error) {
            $error(error);

            let control = $('button[data-a-player-state]'),
                playing = control.dataset?.aPlayerState?.equals('playing'),
                attempts = control.dataset?.recoveryAttempts | 0;

            if(nullish(control)) {
                $warn("No video controls presented.");

                break __RecoverVideoProgramatically__;
            } if(attempts > 3) {
                $warn("Automatic attempts are not helping.");

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

        let errorMessage = $('[data-a-target*="player"i]:is([data-a-target*="content"i], [data-a-target*="gate"i]) [data-a-target*="text"i]');

        if(nullish(errorMessage))
            return StopWatch.stop('recover_video');

        if(RECOVERING_VIDEO)
            return StopWatch.stop('recover_video');
        RECOVERING_VIDEO = true;

        $error('The stream ran into an error:', errorMessage.textContent, new Date);

        let latin = top.location.pathname.slice(1).split('/').shift();
        let native = $(`a[href$="${ latin }"i] [class*="title"]`)?.textContent ?? latin;

        if(errorMessage.closest('[class*="content"i]:is([role], [data-a-target])')?.textContent?.includes(native)) {
            let next = await GetNextStreamer(latin);

            // Subscriber only, etc.
            if(defined(next))
                goto(parseURL(next.href).addSearch({ tool: 'video-recovery--non-subscriber' }).href);
        } else {
            ($('button', errorMessage) ?? errorMessage.closest('button'))?.click();

            // Failed to play video at...
            addReport({ 'TTV-Tools-failed-to-recover-video': (errorMessage?.textContent ?? 'Unknown error') });

            RECOVERING_VIDEO = false;
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

                anchor.modStyle('display:inline-block;width:calc(100% - 5rem)');
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
            next = await GetNextStreamer(STREAMER.name);

        $error(message);

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
                $warn(`The page seems to be lagging (${ span.suffix('s', false, 'time') })... This is the ${ nth(++RECOVER_PAGE_FROM_LAG__WARNINGS) } warning. Offending site: ${ location.href }`);
            else if(span < (Timers.recover_pages * 1.05) && RECOVER_PAGE_FROM_LAG__WARNINGS > 0)
                --RECOVER_PAGE_FROM_LAG__WARNINGS;

            // The lag has exceeded 15s
            if(span > 15e3)
                RECOVER_PAGE_FROM_LAG__WARNINGS = Infinity;

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
        if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z)) {
            $.on('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z = function Start_$_Stop_a_Recording({ key = '', altKey, ctrlKey, metaKey, shiftKey }) {
                if(!(ctrlKey || metaKey || shiftKey) && altKey && key.equals('z')) {
                    let video = MASTER_VIDEO;
                    let system =  GetFileSystem();

                    video.setAttribute('uuid', video.uuid ??= (new UUID).value);

                    let body = `<input hidden controller anchor="${ video.uuid }"
                        icon="\uD83D\uDD34\uFE0F" title="Recording ${ (STREAMER?.name ?? top.location.pathname.slice(1).split('/').shift()) }..."
                        placeholder="${ DEFAULT_CLIP_NAME }"
                        pattern="${ system.acceptableFilenames.source }"

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
                        </table>

                        <div>
                            <h4>You can change the filename of this recording below.</h4>
                            <p>You <strong>cannot</strong> use the following characters: ${ system.unacceptableFilenameCharacters.filter(c => system.characterNames[c].composable).map(c => `<code title="${ system.characterNames[c] }">${ c }</code>`).join(' ') }</p>
                        </div>`;

                    let EVENT_NAME = GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z.name;
                    let SAVE_NAME = DEFAULT_CLIP_NAME;

                    if(!video.hasRecording(EVENT_NAME)) {
                        prompt.silent(body).then(value => {
                            let feed = $(`.tt-prompt[uuid="${ UUID.from(body).value }"i]`);
                            let temp = video.stopRecording(EVENT_NAME);

                            feed?.setAttribute('halt', nullish(value));

                            if(nullish(value)) {
                                phantomClick($('.deny', feed));
                            } else {
                                phantomClick($('.okay', feed));
                                temp.saveRecording(EVENT_NAME, SAVE_NAME = value || SAVE_NAME);
                            }

                            temp?.removeRecording(EVENT_NAME);
                        });

                        SetQuality(VideoClips.quality, 'auto').then(() => {
                            Recording.proxy(video, { name: EVENT_NAME, as: DEFAULT_CLIP_NAME, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats })
                                .then(({ target }) => {
                                    let chunks = target.blobs;
                                    let feed = $(`.tt-prompt[uuid="${ UUID.from(body).value }"i]`),
                                        halt = parseBool(feed?.getAttribute('halt')),
                                        name = (feed?.getAttribute('value') || SAVE_NAME).replace(GetFileSystem().allIllegalFilenameCharacters, '-');

                                    return SAVE_NAME = name;
                                })
                                .catch(error => {
                                    $warn(error);

                                    alert.timed(error, 7000);
                                })
                                .finally(() => {
                                    DEFAULT_CLIP_NAME = new ClipName(2);

                                    video.stopRecording(EVENT_NAME).saveRecording(EVENT_NAME, SAVE_NAME);

                                    when.defined(() => $(`[data-save-name="${ SAVE_NAME.replaceAll('"', '&quot;') }"i]`)).then(link => alert.silent(`
                                        <video controller controls
                                            title="Video Saved &mdash; ${ link.download }"
                                            src="${ link.href }" style="max-width:-webkit-fill-available"
                                        ></video>
                                        `)
                                    );
                                });
                        });
                    } else {
                        let feed = $(`.tt-prompt[uuid="${ UUID.from(body).value }"i]`);

                        phantomClick($('.okay', feed));
                    }
                }
            });

            // Save current recording(s) before leaving
            let leaveHandler = STREAMER.onraid = STREAMER.onhost = top.beforeleaving = top.onlocationchange = async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
                let next = await GetNextStreamer();

                $log('Saving current recording(s). Reason:', { hosting, raiding, raided, leaving: defined(from) }, 'Moving onto:', next);

                for(let [guid, { recording }] of Recording.__RECORDERS__)
                    recording?.stop()?.save();
            };

            $.on('focusin', event => {
                if(top.focusedin)
                    return;
                top.focusedin = true;
                top.addEventListener('beforeunload', leaveHandler);

                // top.addEventListener('visibilitychange', leaveHandler);
            });
        }

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
                                    // The user pressed "Cancel"
                                    if(ok === false) {
                                        delete LiveReminders[name];

                                        Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));
                                    }
                                });
                        let search = await new Search(name).then(Search.convertResults);

                        LiveReminders[name] = (search.live? new Date(search?.data?.actualStartTime): search?.data?.lastSeen ?? new Date);

                        Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));

                        await confirm
                            .timed(`You'll be notified when <a href="/${ name }">${ name }</a> goes live.`, 7000)
                            .then(ok => {
                                // The user pressed "Cancel"
                                if(ok === false)
                                    Cache.save({ LiveReminders: { ...justInCase } }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));
                            });

                        // @performance
                        PrepareForGarbageCollection(LiveReminders);
                    });
                }
            });

        // Display the enabled keyboard shortcuts
        let [help] = $.body.getAllElementsByText('space/k', 'i').filter(element => element.tagName.equals('TBODY'));

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
        ANTITHEME = window.ANTITHEME = ['light', 'dark'].filter(theme => theme.unlike(THEME)).pop();

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
        THEME__PREFERRED_CONTRAST = `${ THEME__BASE_CONTRAST.toString() } prefer ${ (contrastOf(PRIMARY, theme) > contrastOf(SECONDARY, theme)? THEME: ANTITHEME) }`;

        // Better styling. Will match the user's theme choice as best as possible
        AddCustomCSSBlock('Better-Themed Styling', `
            /* The user is using the light theme (like a crazy person) */
            :root {
                --channel-color: ${ STREAMER.tint };
                --channel-color-contrast: ${ STREAMER.tone };
                --channel-color-complement: ${ STREAMER.aego };
                --channel-color-dark: ${ THEME__CHANNEL_DARK };
                --channel-color-light: ${ THEME__CHANNEL_LIGHT };
            }

            /* The user likes hurting their eyes */
            :root[class*="light"i] {
                --color-colored: var(--channel-color-light);
                --color-colored-contrast: var(--channel-color-dark);
                --channel-color-opposite: var(--channel-color-complement);
            }

            /* The user is using the correct theme */
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
                            $log({ ['GitHub']: metadata });

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

let PAGE_CHECKER,
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
    // Load jump (cached) data
    Cache.large.load('JumpedData', ({ JumpedData }) => {
        Object.assign(JUMP_DATA, JumpedData ?? {});

        // @performance
        PrepareForGarbageCollection(JumpedData);
    });

    // Only releases the data from memory every 10:54.321
    setInterval(() => {
        // @performance
        PrepareForGarbageCollection(JUMP_DATA);

        Cache.large.load('JumpedData', ({ JumpedData }) => {
            Object.assign(JUMP_DATA, JumpedData ?? {});

            // @performance
            PrepareForGarbageCollection(JumpedData);
        });
    }, 654_321);

    top.beforeleaving = top.onlocationchange = async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
        // @performance
        PrepareForGarbageCollection(JUMP_DATA);
    };

    // Keep the background alive (every 3 minutes)
    /** @protected
     * @event PONG
     * @fires PING
     * @desc Keeps the background script alive.
     *
     * @author GitHub {@link https://github.io/wOxxOm @wOxxOm}
     *
     * @see https://stackoverflow.com/a/66618269/4211612
     */
    setInterval(() => {
        let KeepAlive = Runtime.connect({ name: 'PING' });

        KeepAlive.postMessage('PING', () => KeepAlive.disconnect());
    }, 180e3);

    Runtime.sendMessage({ action: 'GET_VERSION' }, async({ version = null }) => {
        let isProperRuntime = Manifest.version === version;

        PAGE_CHECKER = !isProperRuntime?
            $error(`The current runtime (v${ Manifest.version }) is not correct (v${ version })`)
                .toNativeStack():
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
                    $warn(`The advertisement seems to be stalled... Refreshing page...`);

                    ReloadPage(false);
                }
            }

            // Enables previews on the home page (#19)
            live_previews_on_hompage: if(top.location.pathname == '/') {
                let scale = parseFloat(Settings.stream_preview_scale) || 1,
                    muted = !parseBool(Settings.stream_preview_sound),
                    quality = (scale > 1? 'auto': '720p'),
                    controls = false;

                $.all('[data-a-target*="preview"i][data-a-target*="card"i]:not([data-test-selector])').map(a => {
                    a.addEventListener('mouseenter', ({ currentTarget }) => {
                        let { href } = currentTarget;
                        let name = (parseURL(href).pathname ?? '/').slice(1).split('/').shift();

                        if(!name?.length)
                            return;

                        let isOnline = $.defined('[class*="status"i][class*="indicator"i]', currentTarget);

                        if($.defined('#tt-stream-preview--iframe'))
                            return;

                        let iframe = furnish(`iframe#tt-stream-preview--iframe[@index=0][@name=${ name }][@live=${ isOnline }][@controls=${ controls }][@muted=${ muted }][@quality=${ quality }]`, {
                            allow: 'autoplay',
                            src: parseURL(`https://player.twitch.tv/`).addSearch(
                                isOnline?
                                    ({
                                        channel: name,
                                        parent: 'twitch.tv',

                                        controls, muted, quality,
                                    }):
                                href
                            ).href,

                            height: '100%',
                            width: '100%',
                            style: `display:block;position:absolute;z-index:99999;`,
                        });

                        currentTarget.insertAdjacentElement('afterbegin', iframe);
                    });

                    a.addEventListener('mouseleave', ({ currentTarget }) => {
                        $.all('#tt-stream-preview--iframe', currentTarget).map(iframe => iframe.remove());
                    });
                });
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

            Runtime.sendMessage({ action: 'CLAIM_UP_NEXT' }, async info => top.UP_NEXT_ALLOW_THIS_TAB = UP_NEXT_ALLOW_THIS_TAB = info?.owner ?? true);

            $log("Main container ready");

            // Set the user's language
            let [documentLanguage] = (document.documentElement?.lang ?? navigator?.userLanguage ?? navigator?.language ?? 'en').toLowerCase().split('-');

            window.LANGUAGE = LANGUAGE = Settings.user_language_preference || documentLanguage;

            // Give the storage 3s to perform any "catch-up"
            wait(3000, ready).then(async ready => {
                await Initialize(ready)
                    .then(() => {
                        // TTV Tools has the max Timer amount to initilize correctly...
                        let REINIT_JOBS =
                        when(() => {
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
                                                    || $.nullish('[data-test-selector*="balance-string"i]')
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

                            $warn(`The following did not activate properly: ${ NOT_LOADED_CORRECTLY }. Reloading...`);

                            for(let job of NOT_LOADED_CORRECTLY)
                                if(defined(job))
                                    RestartJob(job, 'FAILED_TO_ACTIVATE');

                            if(parseBool(Settings.recover_pages)) {
                                if(++RECOVERY_TRIALS > 10)
                                    addReport(NOT_LOADED_CORRECTLY.map(fail => ({ [`fail-to-load-${ fail }`]: true })), true);
                                return false;
                            }

                            // Failed to activate job at...
                            // addReport({ 'TTV-Tools-failed-to-load-module': new Date().toString() }, true);

                            return ready;
                        }, Math.max(...Object.values(Timers))).then(ready => Initialize.ready = ready);
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

            // Observe the volume changes
            VolumeObserver: {
                $.all(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls *:is([data-a-target*="volume"i], [data-a-target*="mute"i])')
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
                    ],

                    video: [
                        "related",
                        "suggested",
                    ],

                    people: [
                        "watch-channel-trailer",
                        "friends",
                    ],

                    inform: [
                        "live-reminders",
                    ],

                    checkmark: [
                        "live-reminders",
                    ],

                    rewind: [
                        "rewind-stream",
                    ],

                    crown: [
                        "prime-subscription",
                    ],

                    button_2to1_transparent: [
                        "theatre-mode-off"
                    ],

                    button_2to1_opaque: [
                        "theatre-mode-on"
                    ],
                };

                for(let container of $.all('[id*="side"i][id*="nav"i] .side-nav-section[aria-label], .about-section__actions > * > *, [data-target^="channel-header"i] button, :is([data-test-selector*="video-player"i], [data-test-selector*="video-container"i]) button')) {
                    let svg = $('svg', container);

                    if(nullish(svg))
                        continue;

                    comparing:
                    for(let glyph in Glyphs)
                        if(Glyphs.__exclusionList__.contains(glyph))
                            continue comparing;
                        else if(conversions[glyph]?.length)
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

                                    let family = conversions[glyph].pop();

                                    if(!family)
                                        return;

                                    // $notice(`Labeling section "${ family[family.length - 1] }" (${ matchPercentage }% match | "${ glyph }")...`, container);

                                    container.setAttribute('tt-svg-label', family);

                                    if(family.missing('-mode-'))
                                        return;

                                    // Auto-toggle
                                    let observer = new MutationObserver(function(mutations) {
                                        for(let { target, attributeName, oldValue } of mutations) {
                                            if(attributeName.unlike('aria-label'))
                                                continue;

                                            let [state, ...name] = target.getAttribute('tt-svg-label').split('-').reverse();
                                            name = name.reverse().join('-');

                                            target.setAttribute('tt-svg-label', [name, ['on', 'off'][+state.equals('on')]].join('-'));
                                        }
                                    });

                                    observer.observe(container, { attributes: true, subtree: true });
                                });
                }
            }

            top.onlocationchange = () => {
                $warn("[Parent] Re-initializing...");

                Balloon.get('Up Next')?.remove();

                // Do NOT soft-reset ("turn off, turn on") these settings
                // They will be destroyed, including any data they are using
                let VOLATILE = window.VOLATILE = ['first_in_line*'].map(AsteriskFn);

                DestroyingJobs:
                for(let job in Jobs)
                    if(!!~VOLATILE.findIndex(name => name.test(job)))
                        continue DestroyingJobs;
                    else
                        RestartJob(job, 'job-destruction');

                Reinitialize:
                if(NORMAL_MODE) {
                    if(parseBool(Settings.keep_popout)) {
                        PAGE_CHECKER ??= setInterval(WAIT_FOR_PAGE, 500);

                        // Save states...
                        let states = {
                            mini: (MiniPlayer?.dataset?.name),
                            redo: (parseURL(window.location).searchParameters?.redo),
                        };

                        for(let key in states)
                            if(parseBool(states[key]))
                                addToSearch({ [key]: states[key] });

                        break Reinitialize;
                    }

                    ReloadPage();
                }
            };

            // Add custom styling
            CustomCSSInitializer: {
                let [accent, contrast] = (Settings.accent_color || 'blue/12').split('/');

                AddCustomCSSBlock('tools.js', `
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

                    :is(video, [class*="video"i][class*="render"i]) ~ * .player-controls :is([data-a-target*="mute"i] svg, [data-test-selector*="fill-value"i], [data-a-target$="slider"i]::-webkit-slider-thumb, [data-a-target$="slider"i]::-moz-range-thumb) {
                        transition: all 1s;
                    }

                    :is(video, [class*="video"i][class*="render"i]) ~ * .player-controls[data-automatic="true"i] [data-a-target*="mute"i] svg {
                        fill: var(--color-warn);
                    }

                    :is(video, [class*="video"i][class*="render"i]) ~ * .player-controls[data-automatic="true"i] [data-test-selector*="fill-value"i] {
                        background-color: var(--color-warn);
                    }

                    :is(video, [class*="video"i][class*="render"i]) ~ * .player-controls[data-automatic="true"i] :is([data-a-target$="slider"i]::-webkit-slider-thumb, [data-a-target$="slider"i]::-moz-range-thumb) {
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
                `);
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

                            let style = new CSSObject({ verticalAlign: 'bottom', height: '20px', width: '20px', fill: '#ff9ab4' });

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

                        $notice(`Job stolen "${ name }" by "${ obit }" tab`);

                        // Can't be the next user if the job was stolen...
                        if(top.GetNextStreamer?.cachedStreamer?.name?.equals(name))
                            top.GetNextStreamer.cachedStreamer = null;

                        when.defined(name => $(`[id^="tt-balloon-job"i][name="${ name }"i]`), 100, name)
                            .then(element => {
                                $('button[class*="del-btn"i]', element)?.click();
                            });
                    } break;

                    case 'reload': {
                        if(UP_NEXT_ALLOW_THIS_TAB || request.forced) {
                            Cache.load([`Watching`], ({ Watching }) => {
                                Watching = Watching.filter(p => p.unlike(NORMALIZED_PATHNAME));

                                Cache.save({ Watching });
                            });

                            await top.beforeleaving?.(new CustomEvent('locationchange', { from: NORMALIZED_PATHNAME, to: NORMALIZED_PATHNAME, persisted: document.readyState.unlike('unloading') }));

                            respond({ ok: true });
                        } else {
                            respond({ ok: false });
                        }
                    } break;

                    case 'close': {
                        Cache.load([`Watching`], ({ Watching }) => {
                            Watching = Watching.filter(p => p.unlike(NORMALIZED_PATHNAME));

                            Cache.save({ Watching });
                        });

                        await top.beforeleaving?.(new CustomEvent('locationchange', { from: NORMALIZED_PATHNAME, to: '', persisted: document.readyState.unlike('unloading') }));

                        respond({ ok: true });

                        wait(500).then(() => window.close());
                    } break;
                }
            });

            // Lag reporter
            Runtime.sendMessage({ action: `${ (Settings.auto_tab_reloads? 'BEGIN': 'WAIVE') }_REPORT` });
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
                        $warn(`${ location.pathname.slice(1) } is not available: ${ ErrorMessage }\nHeading to ${ channel.href }`);

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

            AddCustomCSSBlock('Color Components', `:root { --user-accent-color:${ color.HSL }; --user-complement-color:hsl(${ [color.H + 180, color.S, color.L].map((v, i) => v+'%deg'.slice(+!i,1+3*!i)) }) }`);
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

                    let articles = main.getAllElementsByText(/(\d{4}-\d{2}-\d{2})/)
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

                            header.textContent = new Date(header.textContent).toLocaleDateString();

                            let article = furnish(`#tt-news-${ articleID }`).with(
                                furnish('details.details').with(
                                    furnish('summary').with(header),
                                    ...content
                                )
                            );

                            $.all('a.anchor, svg.action-link', article).map(a => a.remove());
                            $.all('[href]').map(a => a.target = '_blank');

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
            let [CHANNEL] = location.pathname.toLowerCase().slice(1).split('/').slice(+IS_A_FRAMED_CONTAINER),
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
                $log(`Chat Relay (main) connected to "${ CHANNEL }"`);

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

                    // $remark('Chat Relay received messages', messages);

                    for(let { command, parameters, source, tags } of messages) {
                        const channel = (command.channel ?? CHANNEL).toLowerCase();
                        const usable = parseBool(channel.equals(CHANNEL));

                        switch(command.command) {
                            // Successful login attempt
                            case '001': {
                                socket.send(`JOIN ${ CHANNEL }`);
                                // TODO | To be removed Feb 18, 2024 → https://dev.twitch.tv/docs/irc/chat-commands/#migration-guide
                                socket.send(`PRIVMSG ${ CHANNEL } :/mods`);
                                socket.send(`PRIVMSG ${ CHANNEL } :/vips`);
                            } break;

                            // PONG the server back...
                            case 'PING': {
                                socket.send(`PONG ${ parameters }`);
                            } break;

                            // Someone joined the server
                            case 'JOIN': {
                                // $log(`New user "${ source.nick }" on ${ channel }`);

                                Chat.gang.push(source.nick);
                            } break;

                            // Kicked!
                            case 'PART': {
                                // $warn(`Unable to relay messages from "${ source.nick }" on ${ channel }`);

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
                                        $warn(`There's an error on ${ channel }: ${ parameters }`, { command, parameters, source, tags });
                                    else
                                        $warn(`Something's happening on ${ channel }: ${ parameters }`, { command, parameters, source, tags });

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
                                        'raid unraid'.split(' ').contains(msg_id)?
                                            'raid': // incoming raids
                                        'pointsredeemed'.split(' ').contains(msg_id)?
                                            'coin':
                                        // ritual (new_chatter, etc.); bitsbadgetier (100, 1000, 10000, etc.)
                                        'note'
                                    ),
                                    element = when.defined((message, subject) =>
                                        // TODO: get bullets via text content
                                        $.all('[role] ~ *:is([role="log"i], [class~="chat-room"i], [data-a-target*="chat"i], [data-test-selector*="chat"i]) *:is(.tt-accent-region, [data-test-selector="user-notice-line"i], [class*="notice"i][class*="line"i], [class*="gift"i]:not([class*="count"i]), [data-test-selector="announcement-line"i], [class*="announcement"i][class*="line"i])')
                                            .find(element => {
                                                let A = message.mutilate();
                                                let B = element.textContent.mutilate();

                                                if(A.length < B.length)
                                                    [A, B] = [B, A];

                                                if(false
                                                    // The element already has a UUID and type
                                                    || (true
                                                        && element.dataset.uuid
                                                        && element.dataset.type
                                                    )
                                                    // The text matches less than 40% of the message
                                                    || A.slice(0, B.length).errs(B) > .6
                                                )
                                                    return false;

                                                if(subject?.equals('coin')) {
                                                    let I;

                                                    STREAMER.shop.map(item => {
                                                        if(true
                                                            && message.contains(item.title)
                                                            && item.title.mutilate().errs(A) < (I?.title?.mutilate()?.errs(A) ?? 1)
                                                            && item.available
                                                            && item.enabled
                                                            && !(item.hidden || item.paused)
                                                        ) I = item;
                                                    });

                                                    if(defined(I))
                                                        element.dataset.shopItemId = I.id;
                                                }

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

                                for(let [name, callback] of Chat.__consumableEvents__.__onbullet__) {
                                    when(() => PAGE_IS_READY, 250).then(() =>
                                        callback(results).then(complete => {
                                            if(complete)
                                                Chat.__consumableEvents__.__onbullet__.delete(name);
                                        })
                                    );
                                }
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
                                // $remark('PRIVMSG:', { command, parameters, source, tags });

                                // Bot commands...
                                if(defined(command.botCommand)) {
                                    let results = { name: command.botCommand, arguments: command.botCommandParams };

                                    for(let [name, callback] of Chat.__oncommand__)
                                        when(() => PAGE_IS_READY, 250).then(() => callback(results));

                                    for(let [name, callback] of Chat.__deferredEvents__.__oncommand__)
                                        when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                    for(let [name, callback] of Chat.__consumableEvents__.__oncommand__) {
                                        when(() => PAGE_IS_READY, 250).then(() =>
                                            callback(results).then(complete => {
                                                if(complete)
                                                    Chat.__consumableEvents__.__oncommand__.delete(name);
                                            })
                                        );
                                    }

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
                                            return Promise.race([this, wait(100).then(() => null)]).then(self => {
                                                return (self === null) || nullish(self?.parentElement) || $.defined('[data-a-target*="delete"i]:not([class*="spam-filter"i], [data-repetitive], [data-plagiarism])', self);
                                            });
                                        }).bind(element)
                                    },
                                });

                                Chat.__allmessages__.set(uuid, results);

                                for(let [name, callback] of Chat.__onmessage__)
                                    when(() => PAGE_IS_READY, 250).then(() => callback(results));

                                for(let [name, callback] of Chat.__deferredEvents__.__onmessage__)
                                    when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                for(let [name, callback] of Chat.__consumableEvents__.__onmessage__) {
                                    when(() => PAGE_IS_READY, 250).then(() =>
                                        callback(results).then(complete => {
                                            if(complete)
                                                Chat.__consumableEvents__.__onmessage__.delete(name);
                                        })
                                    );
                                }
                            } break;

                            // Got a whisper
                            case 'WHISPER': {
                                let results = { unread: 1, from: channel, message: parameters, timestamp: new Date };

                                for(let [name, callback] of Chat.__onwhisper__)
                                    when(() => PAGE_IS_READY, 250).then(() => callback(results));

                                for(let [name, callback] of Chat.__deferredEvents__.__onwhisper__)
                                    when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                for(let [name, callback] of Chat.__consumableEvents__.__onwhisper__) {
                                    when(() => PAGE_IS_READY, 250).then(() =>
                                        callback(results).then(complete => {
                                            if(complete)
                                                Chat.__consumableEvents__.__onwhisper__.delete(name);
                                        })
                                    );
                                }
                            } break;

                            default: continue;
                        };
                    }
                };
            };

            socket.onerror = event => {
                $warn(`Chat Relay (main) failed to connect to "${ CHANNEL }" → ${ JSON.stringify(event) }`);

                socket = (TTV_IRC.socket = new WebSocket(TTV_IRC.wsURL));
                START_WS(event);
            };

            socket.onclose = event => {
                $warn(`Chat Relay (main) closed unexpectedly → ${ JSON.stringify(event) }`);

                socket = (TTV_IRC.socket = new WebSocket(TTV_IRC.wsURL));
                START_WS(event);
            };

            // The socket closed...
            when(() => TTV_IRC.socket?.readyState === WebSocket.CLOSED, 1000)
                .then(closed => {
                    $warn(`The WebSocket closed... Restarting in 5s...`);

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
                            message = raw.replace(/^[^:]+?:/, '').trim(),
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
                            deleted: $.defined('[data-a-target*="delete"i]', element),
                        };

                        Chat.__allmessages__.set(uuid, results);

                        for(let [name, callback] of Chat.__onmessage__)
                            when(() => PAGE_IS_READY, 250).then(() => callback(results));

                        for(let [name, callback] of Chat.__deferredEvents__.__onmessage__)
                            when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                        for(let [name, callback] of Chat.__consumableEvents__.__onmessage__) {
                            when(() => PAGE_IS_READY, 250).then(() =>
                                callback(results).then(complete => {
                                    if(complete)
                                        Chat.__consumableEvents__.__onmessage__.delete(name);
                                })
                            );
                        }
                    }
                });
        }
    };
}
