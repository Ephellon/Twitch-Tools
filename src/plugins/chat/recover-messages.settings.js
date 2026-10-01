/*** /plugins/chat/recover-messages.settings.js
 * Settings for "Recover Messages" (Chat & Messaging).
 */

export default {
    title: "Recover Messages",
    tr: 'recover-messages',
    glyph: 'thread',
    flags: ['gold'],
    badges: {
        new: '5.28',
    },
    keywords: 'attack,attempt,bid,chatter,conversation,current,endeavor,experiment,flood,flow,gossip,pursuit,resurrect,rush,shot,spate,stream,struggle,surge,tide,torrent,tributary,try',
    rows: [
        {
            toggle: 'recover_messages',
        },
        {
            text: "When a message is deleted, try to bring it back.",
        },
    ],
    settings: {
        recover_messages: {
            type: 'checkbox',
            default: false,
        },
    },
};
