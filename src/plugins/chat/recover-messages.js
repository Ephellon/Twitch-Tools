/*** /plugins/chat/recover-messages.js
 * Reocver Messages.
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let RESTORED_MESSAGES;

plugin({
    id: 'chat.recover_messages',
    job: 'recover_messages',
    timer: +5000,

    init() {
        RESTORED_MESSAGES = new Set;
    },

    handler: async(context) => {
        new context.StopWatch('recover_messages');

        restoring: for(const [uuid, line] of Chat.messages) {
            if(RESTORED_MESSAGES.has(uuid))
                continue restoring;
            if($.defined(`main [data-test-selector*="chat"i][data-test-selector*="message"i][data-test-selector*="container"i] [data-uuid="${ uuid }"i]`))
                continue restoring;

            const { author, handle, message, emotes, badges, style } = line;
            const element = await line.element
                , deleted = await line.deleted;

            if(defined(element.dataset.plagiarism) || defined(element.dataset.repetitive) || parseBool(element.dataset.restored))
                continue restoring;

            element.dataset.uuid ||= uuid;

            if(!deleted || !message?.length || author.equals(context.USERNAME))
                continue restoring;

            const f = furnish;
            let container = $(`[data-a-target^="chat"i] [data-a-target*="deleted"i]`)?.closest(`[data-a-user]`);

            if(parseBool(container?.dataset?.resurrected))
                continue restoring;

            // The message was deleted before the element was placed
            if(nullish(container)) {
                container = f(`.chat-line__message[@aTarget="chat-line-message" @aUser="${ author }" @testSelector="chat-line-message" align-items="center" @uuid="${ uuid }"]`).with(
                    f('[style="position:relative"]').with(
                        f('.chat-line__message-highlight[@testSelector="chat-message-highlight" style="border-radius:.4rem; position:absolute"]'),
                        f('.chat-line__message-container[style="position:relative"]').with(
                            f('').with(
                                f('.chat-line__no-background[style="display:inline"]').with(
                                    f('.chat-line__username-container[style="display:inline-block"]').with(
                                        // Chat badges
                                        f('span').with(
                                            ...badges.map(name =>
                                                f('button[@aTarget=chat-badge]').with(
                                                    // /badges/{version}/{UUID}/{size}
                                                    // Broadcaster → https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1
                                                    f(`img.chat-badge[alt="${ name }"]`, { src: `//static-cdn.jtvnw.net/badges/v1/${ context.TTV_BADGES.get(name) }/1` })
                                                )
                                            )
                                        ),
                                        f('span.chat-line__username[role=button]').with(
                                            f.span(
                                                f(`span.chat-author__display-name[@aTarget="chat-message-username" @aUser="${ author }" @testSelector="message-username" style="${ style }"]`).text(handle)
                                            )
                                        )
                                    ),
                                    f('span[@testSelector=chat-message-separator]').text(': '),
                                    f('span[@testSelector=chat-line-message-placeholder]').text(message)
                                )
                            )
                        ),
                        f('.chat-line__icons')
                    )
                );

                $('[role] ~ *:is([role="log"i], [class~="chat-room"i], [data-test-selector*="chat"i][data-test-selector*="message"i][data-test-selector*="container"i]) [role]')?.append(container);
            }

            const body = $(`[data-test-selector$="message-placeholder"i]`, container)
                , user = $(`[data-a-user="${ author }"i]`, container)?.dataset?.aUser;

            if(nullish(body) || nullish(user))
                continue restoring;
            if(user.unlike(author) && user.unlike(handle))
                continue restoring;

            RESTORED_MESSAGES.add(uuid);

            $notice(`Restoring message (${ uuid }):`, line);

            // Fragmented...
            if(emotes.length > 0) {
                const inter = [], final = [];

                for(const word of message.split(' ').filter(s => s.length))
                    inter.push(
                        emotes.contains(word)
                            // Create an emote button...
                            ? f('.chat-line__message--emote-button[@testSelector=emote-button]').with(
                            f('div').with(
                                f('span[@aTarget=emote-name]').with(
                                    f('.chat-image__container').with(
                                        f(`img.chat-image.chat-line__message--emote[alt="${ word }"][src="${ Chat.emotes.get(word) }"]`)
                                    )
                                )
                            )
                            )
                            // Just push the message...
                            : word
                    );

                let fragments = [];

                for(const word of inter)
                    if(typeof word == 'string') {
                        fragments.push(word)
                    } else {
                        if(fragments.length)
                            final.push(f('.text-fragment[@aTarget=chat-message-text]').with(fragments.join(' ')));
                        final.push(word);

                        fragments = [];
                    }

                if(fragments.length)
                    final.push(f('.text-fragment[@aTarget=chat-message-text]').with(fragments.join(' ')));

                body.innerHTML = final.map(e => e.outerHTML).join(' ');
            } else {
                body.innerText = message
            }

            container.dataset.uuid = uuid;
            container.dataset.resurrected = true;

            const target = $('[data-a-target*="deleted"i]', container);

            if(defined(target))
                target.dataset.aTarget = 'chat-restored-message-placeholder';

            $notice(`Restored message "${ author }: ${ message }"`, { line, container });
        } // :restoring

        context.StopWatch.stop('recover_messages');
    },

    setup() {
        setInterval(() => {
            const actual = Timers.recover_messages
                , desired = Math.max(0
                    , actual
                    , (500 + (parseInt($('[data-a-target$="viewers-count"i], [class*="stream-info-card"i] [data-test-selector$="description"i]')?.textContent?.replace(/\D+/g, '')) | 0))
                ).floorToNearest(100).clamp(1e3, 10e3)
                , [min, max] = [desired, actual].sort((a, b) => a - b);

            // The timer has deviated by more than 15%
            if((min / max) < .85) {
                Timers.recover_messages = desired;

                RestartJob('recover_messages', `timer-deviation:Timer has deviated more than 15% → min:${ (min / 1000).suffix('s') }; max:${ (max / 1000).suffix('s') }`);
            }
        }, 1000);
    },
});
