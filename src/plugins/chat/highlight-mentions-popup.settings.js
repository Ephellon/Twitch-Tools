/*** /plugins/chat/highlight-mentions-popup.settings.js
 * Settings for "Show Pop-ups" (Chat & Messaging).
 */

export default {
    title: "Show Pop-ups",
    tr: 'highlight-mentions-popup',
    glyph: 'thread',
    flags: ['gold'],
    keywords: 'arrive,attitude,belief,blooper,character,come,come out,crop up,determination,develop,directive,emerge,information,leader,letter,looper,materialize,memorandum,message,news,note,notice,occur,official,pop ups,present,report,sentiment,show,show up,someone,stance,stand,star,surface,turn out,turn up,view,word',
    rows: [
        {
            toggle: 'highlight_mentions_popup',
        },
        {
            text: "When someone mentions you <code purple>@username</code>, make the message stand out by showing a pop-up.",
        },
    ],
    settings: {
        highlight_mentions_popup: {
            type: 'checkbox',
            default: true,
        },
    },
};
