/*** /plugins/chat/auto-chat-vip.js
 * Auto-chat (VIP) · @dskw1.
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let AUTO_CHAT_NAME;

plugin({
    id: 'chat.auto_chat__vip',
    job: 'auto_chat__vip',
    timer: -5_000,

    init(context) {
        AUTO_CHAT_NAME = `auto-chat/${ context.STREAMER.sole }`;
    },

    handler: (context) => {
        if(Settings.auto_chat__vip === true)
            Settings.set({ auto_chat__vip: 'vip' });
        else if(Settings.auto_chat__vip === false)
            Settings.set({ auto_chat__vip: null });

        let goTime = (+new Date) + parseInt(Settings.auto_chat__wait_time) * 60_000;

        when(() => (+new Date) >= goTime, 5e3).then(ready => {
            Cache.load(AUTO_CHAT_NAME, results => {
                let old = results[AUTO_CHAT_NAME],
                    now = new Date;

                if(nullish(old))
                    old = now;
                else
                    old = new Date(old);

                // It's been less than 8h since the last auto-message was sent
                if((now - old) && (now - old < parseTime('8:00:00')))
                    return;

                let Rules = context.UPDATE_RULES('lurking', ';');
                let userSent = [...Chat.messages].find(([,{ author }]) => author.equals(context.USERNAME));

                // The user isn't lurking!
                if(defined(userSent)) {
                    let [uuid, line] = userSent;

                    now = defined(line.timestamp)? new Date(line.timestamp): now;

                    $notice(`The user already sent a message!`, line);
                } else {
                    let channel = context.STREAMER.name?.toLowerCase();
                    let badges = context.STREAMER.perm?.all ?? ['everyone'];
                    let message, messages, reason;

                    if(Rules.channel.test(channel)) {
                        message = (messages = Rules.rules.specific.channel?.filter(({ name, badge, text }) => {
                            if(nullish(context.STREAMER))
                                return;

                            return parseBool(true
                                && name.equals(channel)
                                && (false
                                    || nullish(badge)
                                    || badges.filter(medal => medal.toLowerCase().startsWith(badge.toLowerCase())).length
                                )
                            );
                        }))?.random()?.text;
                        reason = 'channel';
                    } else if(Rules.badge.test(badges.join(','))) {
                        message = (messages = Rules.rules.specific.badge?.filter(({ badge, text }) => {
                            return parseBool(false
                                || badges.filter(medal => medal.toLowerCase().startsWith(badge.toLowerCase())).length
                            );
                        }))?.random()?.text;
                        reason = 'badge';
                    } else if(context.STREAMER.perm?.has(Settings.auto_chat__vip)) {
                        message = (messages = Rules.rules.general).random();
                        reason = `permission (${ Settings.auto_chat__vip })`;
                    }

                    if(nullish(message))
                        return;

                    $notice(`Sending lurking message because the ${ reason } matches`, message, messages);

                    Chat.send(message);
                }

                Cache.save({ [AUTO_CHAT_NAME]: now.toJSON() });
            });
        });

        // Handle mentions while AFK
        Chat.onmessage = async({ uuid, author, usable, message, mentions, deleted }) => {
            // Don't reply to messages not meant for us...
            if(true
                && mentions.map(username => username.toLowerCase()).missing(context.USERNAME.toLowerCase())
                // Only accept exact matches, instead of partials; e.g. "Hey @SomeUserName, wyd?" vs. "Hey User, wyd?"
                && message.toLowerCase().missing(context.USERNAME)
            ) return;

            // Wouldn't make sense to reply to a deleted message...
            if(await deleted)
                return;

            // The UUID does not belong to a valid (captured) Twitch message...
                // usable = true → The message was sent AFTER the page was loaded
                // usable = false → The message was sent BEFORE the page was loaded
            if(!usable)
                return;

            // What do?
            switch(Settings.auto_chat__mentions) {
                case 'reply': {
                    Chat.reply(uuid, 'AFK. BRB');
                } break;

                default: return;
            }
        };
    },
});
