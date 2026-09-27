/*** /lib/chat-footer.js
 * Twitch-style chat footer notices.
 * Moved verbatim from tools.js in Phase 3; see src/lib/index.js for how it reaches the page.
 */

// Creates a Twitch-style chat footer
    // new ChatFooter(title:string, options:object?) → Element<ChatFooter>
class ChatFooter {
    static #FOOTERS = new Map();
    static #FOOTER_TIMEOUT = -1;

    constructor(title, options = {}) {
        const f = furnish;

        const uuid = UUID.from(title).value
            , existing = ChatFooter.#FOOTERS.get(title);

        if(defined(existing))
            return existing;

        const parent = $('[data-a-target="chat-scroller"i]')
            , footer =
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

export { ChatFooter };
