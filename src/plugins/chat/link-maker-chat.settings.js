/*** /plugins/chat/link-maker-chat.settings.js
 * Settings for "Link Maker" (Chat & Messaging).
 */

export default {
    title: "Link Maker",
    tr: 'link-maker',
    glyph: 'compass',
    flags: ['small', 'gold'],
    badges: {
        new: '5.16',
    },
    keywords: 'association,badge,builder,calendar,cards,channel,chatter,check,contact,conversation,element,examination,fairway,gossip,hookup,inventor,label,links,maker,manufacturer,network,poster,preview,producer,program,relationship,sheet,ticket,tie,viewing',
    rows: [
        {
            toggle: 'link_maker__chat',
        },
        {
            text: "Automatically convert links in chat to preview cards.",
        },
    ],
    settings: {
        link_maker__chat: {
            type: 'checkbox',
            default: false,
        },
    },
};
