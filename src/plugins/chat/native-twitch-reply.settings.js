/*** /plugins/chat/native-twitch-reply.settings.js
 * Settings for "Native Reply" (Chat & Messaging).
 */

export default {
    title: "Native Reply",
    tr: 'native-reply',
    glyph: 'reply',
    flags: ['small', 'gold'],
    keywords: 'acknowledgment,act,array,attack,attempt,bid,blink,channels,charge,demonstration,display,endeavor,example,exhibit,experiment,feedback,flutter,handling,jerk,jiggle,management,manipulation,oversight,parade,plan,policy,presentation,pursuit,reaction,rejoinder,replies,reply,response,retort,shot,shudder,strategy,struggle,transaction,treatment,tremble,try,twitch',
    rows: [
        {
            toggle: 'native_twitch_reply',
        },
        {
            text: "Show Twitch™'s own replies on every channel.",
        },
    ],
    settings: {
        native_twitch_reply: {
            type: 'checkbox',
            default: false,
        },
    },
};
