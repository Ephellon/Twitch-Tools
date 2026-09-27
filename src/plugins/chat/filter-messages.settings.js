/*** /plugins/chat/filter-messages.settings.js
 * Settings for "Filter Messages" (Chat & Messaging).
 */

export default {
    title: "Filter Messages",
    tr: 'filter-messages',
    glyph: 'mod',
    flags: ['small', 'gold'],
    badges: {
        new: '5.8',
    },
    keywords: 'advertisement,aid,announcements,appliance,arrest,assault,assistance,avenue,backing,benefit,block,break in,briefing,broadcast,bulletins,capture,carrier,channels,charge,clean,compensation,contribution,cooperation,device,disclosure,dispatch,drain,dribble,filter,gear,gizmo,handling,handout,help,incursion,invasion,leak,machinery,management,manipulation,means,mechanism,medium,messages,news,notice,onslaught,oversight,penetrate,percolate,permeate,pin,pinned,plan,points,policy,prediction,publication,prevent,raids,refine,release,relief,report,revelation,route,rules,service,sift,sortie,statement,stop,strategy,subscriptions,support,surprise attack,sweep,tools,transaction,treatment,trickle,tunnel,winnow,writing',
    rows: [
        {
            toggle: 'filter_messages',
        },
        {
            text: "Remove messages/rules across all channels.",
        },
        {
            text: "Please see <a href='https://github.com/Ephellon/Twitch-Tools/wiki/Filter-Messages'>TTV Tools Wiki — Filter Messages</a> for assistance.",
        },
        {
            tr: false,
            text: "{{filter_rules-input}}",
        },
        {
            extras: {
                title: "Rules",
                tr: 'filter-messages:options',
                subtitle: 'View, or remove rules',
            },
            panelAttrs: {
                type: 'list',
                id: 'filter_rules',
            },
            rows: [
                {
                    html: `<div filter-type='channel' tr-id>
                            <h2>Channel Rules</h2>
                        </div>`,
                },
                {
                    html: `<div filter-type='badge' tr-id>
                            <h2>Badges</h2>
                        </div>`,
                },
                {
                    html: `<div filter-type='user' tr-id>
                            <h2>Users</h2>
                        </div>`,
                },
                {
                    html: `<div filter-type='emote' tr-id>
                            <h2>Emotes</h2>
                        </div>`,
                },
                {
                    html: `<div filter-type='text' tr-id>
                            <h2>Text</h2>
                        </div>`,
                },
                {
                    html: `<div filter-type='regexp' tr-id>
                            <h2>RegExp</h2>
                        </div>`,
                },
                {
                    html: `<div>
                            <h2 tr-id>
                                Get started by <a href='#filter_rules-input' target='_self'>adding</a> some rules.
                            </h2>

                            <details>
                                <summary subtitle>Examples</summary>
                                <ul>
                                    <li>
                                        Remove messages that contain certain words:
                                        <pre type='code'>merch,promo,sponsor</pre>
                                    </li>
                                    <li>
                                        Remove messages that contain certain emotes:
                                        <pre type='code'>:LUL:,:KEKW:</pre>
                                    </li>
                                    <li>
                                        Remove messages from certain users:
                                        <pre type='code'>@username,@otherUsername</pre>
                                    </li>
                                    <li>
                                        Remove messages from certain badge users:
                                        <pre type='code'>&lt;badge&gt;,&lt;another badge&gt;</pre>
                                        Only part of the badge names are required:
                                        <pre type='code'>&lt;mod&gt; → &lt;moderator&gt;; &lt;cheer&gt; = &lt;cheer100&gt; &lt;cheer500&gt; ...</pre>
                                    </li>
                                    <li>
                                        Remove messages that contain certain patterns (<a href='https://javascript.info/regular-expressions'>RegExp</a>):
                                        <pre type='code'>swears?|bad w[o0]rd</pre>
                                    </li>
                                    <li>
                                        Remove messages on certain channels:
                                        <pre type='code'>/DashDucks <em>filter-rule</em></pre>
                                    </li>
                                </ul>
                            </details>
                        </div>`,
                },
            ],
        },
        {
            extras: {
                title: "Bulletins",
                tr: 'filter-messages:bullets-options',
                subtitle: 'Control the display of bulletins (highlighted messages)',
            },
            rows: [
                {
                    option: {
                        title: "Raids",
                        tr: '',
                        glyph: 'raid',
                        flags: ['small', 'purple'],
                    },
                    rows: [
                        {
                            toggle: 'filter_messages__bullets_raid',
                        },
                        {
                            text: "Hide all raid related bulletins.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Channel Points",
                        tr: '',
                        glyph: 'channelpoints',
                        flags: ['small', 'purple'],
                    },
                    rows: [
                        {
                            toggle: 'filter_messages__bullets_coin',
                        },
                        {
                            text: "Hide all channel point related bulletins.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Subscriptions",
                        tr: '',
                        glyph: 'gift',
                        flags: ['small', 'gold'],
                    },
                    rows: [
                        {
                            toggle: 'filter_messages__bullets_subs',
                        },
                        {
                            text: "Hide all subscription related bulletins.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Announcements",
                        tr: '',
                        glyph: 'alert',
                        flags: ['small', 'gold'],
                    },
                    rows: [
                        {
                            toggle: 'filter_messages__bullets_note',
                        },
                        {
                            text: "Hide all announcement related bulletins.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Pinned Messages",
                        tr: '',
                        glyph: 'pinned',
                        flags: ['small', 'gold'],
                    },
                    rows: [
                        {
                            toggle: 'filter_messages__bullets_paid',
                        },
                        {
                            text: "Hide all pinned messages.",
                        },
                    ],
                },
            ],
        },
    ],
    settings: {
        filter_messages: {
            type: 'checkbox',
            default: true,
        },
        'filter_rules-input': {
            type: 'text',
            default: '',
            placeholder: "/channel <badge> @user :emote: text reg.exp?",
            store: false,
            attrs: {
                'left-tooltip': 'Case insensitive • Comma separated',
            },
        },
        filter_messages__bullets_raid: {
            type: 'checkbox',
            default: false,
        },
        filter_messages__bullets_coin: {
            type: 'checkbox',
            default: false,
        },
        filter_messages__bullets_subs: {
            type: 'checkbox',
            default: false,
        },
        filter_messages__bullets_note: {
            type: 'checkbox',
            default: false,
        },
        filter_messages__bullets_paid: {
            type: 'checkbox',
            default: false,
        },
        filter_rules: {
            type: 'custom',
        },
    },
};
