/*** /lib/card.js
 * Twitch-style info cards.
 * Moved verbatim from tools.js in Phase 3; see src/lib/index.js for how it reaches the page.
 */

// Creates a Twitch-style card
    // new Card({ title:string, subtitle:string?, fineTuning:object? }) → Element<Card>
class Card {
    static #CARDS = new Map();

    constructor({ title = '', subtitle = '', description = '', footer, icon, fineTuning = {} }) {
        fineTuning.top ??= '7rem';
        fineTuning.left ??= '0px';
        fineTuning.cursor ??= 'auto';

        let styling = [];

        for(const key in fineTuning) {
            let [value, unit] = (fineTuning[key] ?? '').toString().split(/([\-\+]?[\d\.]+)([^\d\.]+)/).filter(string => string.length);

            if(nullish(value))
                continue;

            if(parseFloat(value) >= -Infinity)
                unit ??= 'px';
            else
                unit ??= '';

            styling.push(`${ key }:${ value }${ unit }`);
        }

        styling = styling.join(';');

        const f = furnish;

        const container = $('[data-a-target*="card"i] [class*="card-layer"i]')
            , card = f(`.tt-absolute.tt-border-radius-large.viewer-card-layer__draggable[@aTarget=viewer-card-positioner]`, { style: styling })
            , uuid = UUID.from([title, subtitle].join('\n')).value;

        icon ??= { src: Runtime.getURL('profile.png'), alt: "Profile" };

        card.id = uuid;

        // Remove current cards. Only one allowed at a time
        [...container.children].forEach(child => child.remove());

        // Furnish the card
        const iconElement = f('img.emote-card__big-emote.tt-image[@testSelector=big-emote]', { ...icon }).setTooltip(icon.alt);

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
                        'aria-label': 'Hide',
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

        for(const [title, card] of Card.#CARDS)
            if(card === this)
                Card.#CARDS.delete(title);
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

            for(const key in fineTuning) {
                let [value, unit] = (fineTuning[key] ?? '').toString().split(/([\-\+]?[\d\.]+)([^\d\.]+)/).filter(string => string.length);

                if(nullish(value))
                    continue;

                if(parseFloat(value) >= -Infinity)
                    unit ??= 'px';
                else
                    unit ??= '';

                styling.push(`${ key }:${ value }${ unit }`);
            }

            styling = styling.join(';');

            const f = furnish;

            const container = $('[data-a-target*="card"i] [class*="card-layer"i]')
                , card = f(`.tt-absolute.tt-border-radius-large.viewer-card-layer__draggable[@aTarget=viewer-card-positioner]`, { style: styling },
                    f('.tt-absolute.tt-mg-r-05.tt-mg-t-05.tt-right-0.tt-top-0[@aTarget=viewer-card-close-button]',
                        {
                            onmouseup: ({ button = -1 }) => {
                                !button && $.all('[data-a-target*="card"i] [class*="card-layer"] > *').forEach(node => node.remove());
                            },
                        },
                        f('.tt-inline-flex.viewer-card-drag-cancel').with(
                            f('button.tt-button-icon.tt-button-icon--secondary.tt-core-button[@testSelector=close-viewer-card]', {
                                'aria-label': 'Hide',
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

            const uuid = UUID.from(card.getPath()).value;

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
    };
}

export { Card };
