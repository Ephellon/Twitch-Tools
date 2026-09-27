/*** /lib/balloon.js
 * Twitch-style notification balloon (the "Up Next" popup).
 * Moved verbatim from tools.js in Phase 3; see src/lib/index.js for how it reaches the page.
 */

// Displays a balloon (popup)
    // new Balloon({ title:string, icon:string? }, ...jobs:object<{ href:string<URL>, message:string?, src:string?, time:string<Date>, onremove:function? }>) → object
    // Balloon.prototype.add(...jobs:object<{ href:string<URL>, message:string?, src:string?, time:string<Date>, onremove:function? }>) → Element
    // Balloon.prototype.addButton({ left:boolean?, icon:string?<Glyphs>, onclick:function?, attributes:object? }) → Element
    // Balloon.prototype.remove() → undefined
class Balloon {
    static #BALLOONS = new Map;

    constructor({ title, icon = 'play', iconAttr = {} }, ...jobs) {
        const f = furnish;

        let [L_pane, C_pane, R_pane] = $.all('.top-nav__menu > div:not(:only-child)')
            , X = $('#tt-balloon', R_pane)
            , I = Runtime.getURL('profile.png')
            , F, C, H, U, N;

        if([L_pane, C_pane, R_pane].filter(nullish).length)
            return;

        const uuid = U = UUID.from([title, JSON.stringify(jobs)].join(':')).value
            , existing = Balloon.#BALLOONS.get(title);

        if(defined(existing))
            return existing;

        if(defined(X)) {
            if(Queue.balloons.map(balloon => balloon.uuid).missing(uuid)) {
                const interval = setInterval(() => {
                    const existing = $('#tt-balloon');

                    if(defined(existing))
                        return;

                    const { title, icon, jobs, uuid, interval } = Queue.balloons.pop();

                    new Balloon({ title, icon }, ...jobs);

                    clearInterval(interval);
                }, 500);

                Queue.balloons.splice(0, 0, { title, icon, jobs, uuid, interval });
            }

            return;
        }

        const p =
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
                                        let { currentTarget } = event
                                            , connectedTo = currentTarget.getAttribute('connected-to');

                                        const balloon = $(`#tt-balloon-${ connectedTo }`);

                                        if(nullish(balloon))
                                            return;

                                        const display = balloon.getAttribute('display').equals('block') ? 'none' : 'block';

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
                                                    const counter = $(`#tt-notification-counter--${ uuid }`)
                                                        , output = $(`#tt-notification-counter-output--${ uuid }`)
                                                        , length = parseInt(counter?.getAttribute('length'));

                                                    if(nullish(counter) || nullish(output) || nullish(length))
                                                        return;

                                                    output.textContent = length;

                                                    if(length > 0) {
                                                        counter.modStyle(`visibility:unset; font-size:75%`)
                                                    } else {
                                                        counter.modStyle(`visibility:hidden`)
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
                                f('.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-c-text-base.tt-elevation-1.tt-flex.tt-flex-shrink-0.tt-pd-x-1.tt-pd-y-05.tt-popover-header', { style: `background-color:#${ THEME.equals('dark') ? '000' : 'fff' }e; position:sticky; top:0; z-index:99999;` },
                                    f('.tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-justify-content-center').with(
                                        (H = f(`h5#tt-balloon-header-${ U }.tt-align-center.tt-c-text-alt.tt-semibold`, { style: 'margin-left:4rem!important', contrast: THEME__PREFERRED_CONTRAST }, title))
                                    ),
                                    f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-button-icon--secondary.tt-core-button.tt-flex.tt-flex-column.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-justify-content-center.tt-mg-l-05.tt-overflow-hidden.tt-popover-header__icon-slot--right.tt-relative',
                                        {
                                            style: 'padding:0.5rem!important; height:3rem!important; width:3rem!important',
                                            contrast: THEME__PREFERRED_CONTRAST,
                                            innerHTML: Glyphs.x,

                                            'connected-to': U,

                                            onclick: event => {
                                                let { currentTarget } = event
                                                    , connectedTo = currentTarget.getAttribute('connected-to');

                                                const balloon = $(`#tt-balloon-${ connectedTo }`);

                                                if(nullish(balloon))
                                                    return;

                                                const display = balloon.getAttribute('display').equals('block') ? 'none' : 'block';

                                                balloon.modStyle(`display:${ display }!important`);
                                                balloon.setAttribute('display', display);
                                            },
                                        }
                                    )
                                ),
                                // Body
                                ...jobs.map((job, index) => {
                                    let { href, message, subheader, src = I, attributes = {}, onremove = ($=>$), animate = ($=>$) } = job
                                        , guid = UUID.from([href, message].join(':')).value;

                                    const container = f(`#tt-balloon-job-${ U }--${ guid }`, { ...attributes, uuid, guid, href: parseURL(href).href },
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
                                                                        let { currentTarget } = event
                                                                            , connectedTo = currentTarget.getAttribute('connected-to');

                                                                        const element = $(`#tt-balloon-job-${ connectedTo }`);

                                                                        if(defined(element)) {
                                                                            onremove({
                                                                                ...event,
                                                                                uuid, guid, href, element,
                                                                                canceled: false,

                                                                                callback(element) {
                                                                                    clearInterval(+element.getAttribute('animationID'));
                                                                                    element.remove();
                                                                                },
                                                                            })
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
                                                                            '@streamer-name': parseURL(href).pathname.slice(1),

                                                                            onclick: event => {
                                                                                let { currentTarget } = event
                                                                                    , connectedTo = currentTarget.getAttribute('connected-to');

                                                                                const element = $(`#tt-balloon-job-${ connectedTo }`)
                                                                                    , thisJob = $('a', element)
                                                                                    , redo = (parseURL(thisJob.href).searchParameters?.redo?.equals(currentTarget.dataset.streamerName) ? '' : currentTarget.dataset.streamerName)
                                                                                    , url = parseURL(thisJob.href).addSearch({ redo });

                                                                                thisJob.setAttribute('new-href', url.href);
                                                                                ALL_FIRST_IN_LINE_JOBS.map((job, index) => {
                                                                                    if(parseURL(job).pathname.equals(url.pathname))
                                                                                        if(index)
                                                                                            ALL_FIRST_IN_LINE_JOBS.splice(index, 1, url.href), Cache.save({ ALL_FIRST_IN_LINE_JOBS });
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
                                                                                let { currentTarget } = event
                                                                                    , connectedTo = currentTarget.getAttribute('connected-to');

                                                                                const element = $(`#tt-balloon-job-${ connectedTo }`);
                                                                                const tooltip = Tooltip.get(currentTarget.closest('.persistent-notification__delete'));

                                                                                if(defined(element))
                                                                                    onremove({
                                                                                        ...event,
                                                                                        uuid, guid, href, element,
                                                                                        canceled: true,

                                                                                        callback(element) {
                                                                                            clearInterval(+element.getAttribute('animationID'));
                                                                                            tooltip.remove();
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

        R_pane?.insertBefore(p, R_pane.firstElementChild);

        this.body = C;
        this.icon = N;
        this.uuid = U;
        this.header = H;
        this.parent = R_pane;
        this.counter = F;
        this.container = p;

        const cssName = title.replace(/\s+/g, '-').toLowerCase();

        for(const key of 'body icon header parent container'.split(' '))
            this[key].setAttribute(`${ cssName }--${ key }`, (+new Date).toString(36));

        this.tooltip ??= f('.tt-tooltip.tt-tooltip--align-center.tt-tooltip--down', { id: `balloon-tooltip-for-${ U }`, role: 'tooltip' }, this.title = title);

        Balloon.#BALLOONS.set(title, this);

        return this;
    }

    addButton({ left = false, icon = 'play', onclick = ($=>$), attributes = {} }) {
        const parent = this.header.closest('div[class*="header"i]');
        const uuid = UUID.from(onclick.toString()).value
            , existing = $(`[uuid="${ uuid }"i]`, parent);

        if(defined(existing))
            return existing;

        const button = furnish('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-button-icon--secondary.tt-core-button.tt-flex.tt-flex-column.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-justify-content-center.tt-mg-l-05.tt-overflow-hidden.tt-popover-header__icon-slot--right.tt-relative',
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
            let { href, message, subheader, src = Runtime.getURL('profile.png'), attributes = {}, onremove = ($=>$), animate = ($=>$) } = job
                , { uuid } = this
                , guid = UUID.from(href).value
                , f = furnish;

            const existing = $(`#tt-balloon-job-${ uuid }--${ guid }`);

            if(defined(existing))
                return existing;

            ++this.length;

            const container = f(`#tt-balloon-job-${ uuid }--${ guid }`, { ...attributes, uuid, guid, href: parseURL(href).href },
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
                                                let { currentTarget } = event
                                                    , connectedTo = currentTarget.getAttribute('connected-to');

                                                const element = $(`#tt-balloon-job-${ connectedTo }`);

                                                if(defined(element)) {
                                                    onremove({
                                                        ...event,
                                                        uuid, guid, href, element,
                                                        canceled: false,

                                                        callback(element) {
                                                            clearInterval(+element.getAttribute('animationID'));
                                                            element.remove();
                                                        },
                                                    })
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
                                                    '@streamer-name': parseURL(href).pathname.slice(1),

                                                    onclick: event => {
                                                        let { currentTarget } = event
                                                            , connectedTo = currentTarget.getAttribute('connected-to');

                                                        const element = $(`#tt-balloon-job-${ connectedTo }`)
                                                            , thisJob = $('a', element)
                                                            , redo = (parseURL(thisJob.href).searchParameters?.redo?.equals(currentTarget.dataset.streamerName) ? '' : currentTarget.dataset.streamerName)
                                                            , url = parseURL(thisJob.href).addSearch({ redo });

                                                        thisJob.setAttribute('new-href', url.href);
                                                        ALL_FIRST_IN_LINE_JOBS.map((job, index) => {
                                                            if(parseURL(job).pathname.equals(url.pathname))
                                                                if(index)
                                                                    ALL_FIRST_IN_LINE_JOBS.splice(index, 1, url.href), Cache.save({ ALL_FIRST_IN_LINE_JOBS });
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
                                                        let { currentTarget } = event
                                                            , connectedTo = currentTarget.getAttribute('connected-to');

                                                        const element = $(`#tt-balloon-job-${ connectedTo }`);
                                                        const tooltip = Tooltip.get(currentTarget.closest('.persistent-notification__delete'));

                                                        if(defined(element)) {
                                                            onremove({
                                                                ...event,
                                                                uuid, guid, href, element,
                                                                canceled: true,

                                                                callback(element) {
                                                                    clearInterval(+element.getAttribute('animationID'));
                                                                    tooltip.remove();
                                                                    element.remove();
                                                                },
                                                            })
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

export { Balloon };
