/*** /plugins/chat/recover-chat.settings.js
 * Settings for "Recover Chat" (Chat & Messaging).
 */

export default {
    title: "Recover Chat",
    tr: 'recover-chat',
    glyph: 'thread',
    keywords: 'attack,attempt,bid,chatter,conversation,current,endeavor,experiment,flood,flow,gossip,pursuit,resurrect,rush,shot,spate,stream,struggle,surge,tide,torrent,tributary,try',
    rows: [
        {
            toggle: 'recover_chat',
        },
        {
            text: "When the chat object is not loaded (or suddenly destroyed), attempt to recover it.",
        },
    ],
    settings: {
        recover_chat: {
            type: 'checkbox',
            default: false,
        },
    },
};
