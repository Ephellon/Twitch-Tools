/*** /plugins/chat/safe-soft-unban.js
 * Soft Unban | tmarenko @ GitHub | https://github.com/tmarenko/twitch_chat_antiban.
 * Moved verbatim from chat.js (Chat__Initialize_Safe_Mode) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat-safe.soft_unban',

    async install(context) {
        Handlers.soft_unban = () => {
            if(!context.STREAMER?.veto)
                return;

            $log(`Performing Soft Unban...`);

            let f = furnish;

            let name = (context.STREAMER.name || location.pathname.split(/\W/, 2)[1]).replace('/', ''),
                fiat = (context.STREAMER.fiat || 'Channel Points'),
                url = parseURL(`https://nightdev.com/hosted/obschat/`).addSearch({
                    theme: `bttv_${ context.THEME }`,
                    channel: name,
                    fade: parseBool(Settings.soft_unban_fade_old_messages),
                    bot_activity: parseBool(Settings.soft_unban_keep_bots),
                    prevent_clipping: parseBool(Settings.soft_unban_prevent_clipping),
                }),
                iframe = f(`iframe#tt-proxy-chat`, { src: url.href, style: `width: 100%; height: 100%` }),
                preBanner =
                    f('#tt-banned-banner.tt-pd-b-2.tt-pd-x-2').with(
                        f('.tt-border-t.tt-pd-b-1.tt-pd-x-2'),
                        f('.tt-align-center').with(
                            f('p.tt-c-text.tt-strong[@testSelector=current-user-timed-out-text]').with(
                                `Messages from ${ name } chat.`
                            ),
                            f('p.tt-c-text-alt-2').with(
                                `Unable to collect ${ fiat }.`
                            )
                        )
                    ),
                chat, cont, banner;

            name = name?.replace(/(.)$/, ($0, $1, $$, $_) => $1 + (/([s])/i.test($1)? "'": "'s")) || 'this';
            fiat = fiat.replace(/([^s])$/i, '$1s');

            // Try the "old" method, then the new one
            try {
                chat = $('.chat-room__content > .tt-flex');
                banner = $('.chat-input').closest('.tt-block');

                banner.insertBefore(
                    preBanner,
                    banner.firstElementChild
                );

                chat.classList.remove(...chat.classList);
                chat.classList.add("chat-list--default", "scrollable-area");
                chat.replaceChild(iframe, chat.firstChild);
            } catch(error) {
                $warn(`Could not perform "old" unban method`, error);

                chat = $('.chat-input');
                cont = chat.previousElementSibling;

                try {
                    chat.insertBefore(
                        preBanner,
                        chat.firstElementChild
                    );

                    cont.replaceChild(iframe, cont.firstChild);
                } catch(error) {
                    $warn(`Could not perform "new" unban method`, error);
                }
            }
        };
        Timers.soft_unban = -2_500;

        Unhandlers.soft_unban = () => {
            let iframe = $('iframe#tt-proxy-chat'),
                div = furnish('.tt-flex');

            if(nullish(iframe))
                return;

            iframe.parentElement.replaceChild(div, iframe);
        };

        __SoftUnban__:
        if(parseBool(Settings.soft_unban)) {
            RegisterJob('soft_unban');
        }

        // Helpers
        __Static_Helpers__:
        if(IS_A_FRAMED_CONTAINER) {
            // Do something to send up...
        }
        // End of Chat__Initialize_Safe_Mode
    },
});
