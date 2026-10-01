/*** /plugins/chat/highlight-mentions.settings.js
 * Settings for "Highlight Mentions" (Chat & Messaging).
 */

export default {
    title: "Highlight Mentions",
    tr: 'highlight-mentions',
    glyph: 'thread',
    flags: ['gold'],
    keywords: 'attitude,belief,character,climax,determination,directive,feature,focal point,highlight,information,leader,letter,memorandum,message,news,note,notice,official,report,sentiment,someone,stance,stand,star,view,word',
    rows: [
        {
            toggle: 'highlight_mentions',
        },
        {
            text: "Highlight messages that mention you (<code purple>@username</code>).",
        },
        {
            extras: {
                title: "Extras",
                tr: 'extras',
                subtitle: 'Adjust settings for "Highlight Mentions"',
            },
            rows: [
                {
                    html: "<div class='title' tr-id='highlight-mentions:options'>General Highlighting</div>",
                },
                {
                    html: `<div class='summary'>
                            <div class='toggle'>
                                <input id='highlight_mentions_extra' type='checkbox'>
                                <label for='highlight_mentions_extra'></label>
                            </div>
                            <p tr-id>
                                When someone sends a general mention <code purple>@all</code> <code purple>@chat</code> <code purple>@everyone</code>, make the message stand out by highlighting it.
                            </p>
                        </div>`,
                },
            ],
        },
    ],
    settings: {
        highlight_mentions: {
            type: 'checkbox',
            default: true,
        },
        highlight_mentions_extra: {
            type: 'custom',
        },
    },
};
