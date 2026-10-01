/*** /plugins/chat/highlight-phrases.settings.js
 * Settings for "Highlight Phrases" (Chat & Messaging).
 */

export default {
    title: "Highlight Phrases",
    tr: 'highlight-phrases',
    glyph: 'star',
    flags: ['gold'],
    badges: {
        new: '4.1',
    },
    keywords: 'aid,appliance,assistance,attitude,backing,belief,benefit,character,climax,compensation,cooperation,determination,device,directive,expression,feature,focal point,gear,gizmo,help,highlight,idiom,information,leader,letter,machinery,means,mechanism,memorandum,message,motto,news,note,notice,official,phrases,phrasing,relief,remark,report,saying,sentiment,service,slogan,someone,stance,stand,star,support,terminology,tools,utterance,view,word,wording',
    rows: [
        {
            toggle: 'highlight_phrases',
        },
        {
            text: "Highlight messages that contain any of these phrases.",
        },
        {
            text: "Need help? See <a href='https://github.com/Ephellon/Twitch-Tools/wiki/Highlight-Phrases'>TTV Tools Wiki — Highlight Phrases</a>.",
        },
        {
            tr: false,
            text: "{{phrase_rules-input}}",
        },
        {
            extras: {
                title: "Rules",
                tr: 'highlight-phrases:options',
                subtitle: 'View, or remove rules',
            },
            panelAttrs: {
                type: 'list',
                id: 'phrase_rules',
            },
            rows: [
                {
                    html: `<div phrase-type='channel' tr-id>
                            <h2>Channel Rules</h2>
                        </div>`,
                },
                {
                    html: `<div phrase-type='badge' tr-id>
                            <h2>Badges</h2>
                        </div>`,
                },
                {
                    html: `<div phrase-type='user' tr-id>
                            <h2>Users</h2>
                        </div>`,
                },
                {
                    html: `<div phrase-type='emote' tr-id>
                            <h2>Emotes</h2>
                        </div>`,
                },
                {
                    html: `<div phrase-type='text' tr-id>
                            <h2>Text</h2>
                        </div>`,
                },
                {
                    html: `<div phrase-type='regexp' tr-id>
                            <h2>RegExp</h2>
                        </div>`,
                },
                {
                    html: `<div>
                            <h3 tr-id>
                                Get started by <a href='#phrase_rules-input' target='_self'>adding</a> some rules.
                            </h3>

                            <details>
                                <summary subtitle>Examples</summary>
                                <ul>
                                    <li>
                                        Highlight messages that contain certain words:
                                        <pre type='code'>merch,promo,sponsor</pre>
                                    </li>
                                    <li>
                                        Highlight messages that contain certain emotes:
                                        <pre type='code'>:LUL:,:KEKW:</pre>
                                    </li>
                                    <li>
                                        Highlight messages from certain users:
                                        <pre type='code'>@username,@otherUsername</pre>
                                    </li>
                                    <li>
                                        Highlight messages from certain badge users:
                                        <pre type='code'>&lt;badge&gt;,&lt;another badge&gt;</pre>
                                        Only part of the badge names are required:
                                        <pre type='code'>&lt;mod&gt; → &lt;moderator&gt;; &lt;cheer&gt; = &lt;cheer100&gt; &lt;cheer500&gt; ...</pre>
                                    </li>
                                    <li>
                                        Highlight messages that contain certain patterns (<a href='https://javascript.info/regular-expressions'>RegExp</a>):
                                        <pre type='code'>praises?|g[o0]+d w[o0]rd</pre>
                                    </li>
                                    <li>
                                        Highlight messages on certain channels:
                                        <pre type='code'>/DashDucks <em>highlight-rule</em></pre>
                                    </li>
                                </ul>
                            </details>
                        </div>`,
                },
            ],
        },
    ],
    settings: {
        highlight_phrases: {
            type: 'checkbox',
            default: false,
        },
        'phrase_rules-input': {
            type: 'text',
            default: '',
            placeholder: "/channel <badge> @user :emote: text reg.exp?",
            store: false,
            attrs: {
                'left-tooltip': 'Case insensitive • Comma separated',
            },
        },
        phrase_rules: {
            type: 'custom',
        },
    },
};
