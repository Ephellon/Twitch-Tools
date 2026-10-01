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
            text: "Show a pop-up when someone mentions you (<code purple>@username</code>).",
        },
    ],
    settings: {
        highlight_mentions_popup: {
            type: 'checkbox',
            default: true,
        },
    },
};
