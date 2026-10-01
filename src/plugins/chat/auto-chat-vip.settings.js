/*** /plugins/chat/auto-chat-vip.settings.js
 * Settings for "Lurking Message" (Chat & Messaging).
 */

export default {
    title: "Lurking Message",
    tr: 'auto-chat',
    glyph: 'thread',
    flags: ['white'],
    badges: {
        new: '5.32.5',
    },
    keywords: 'channels,charge,directive,handling,information,letter,management,manipulation,memo,memorandum,message,news,note,notice,oversight,plan,policy,report,strategy,transaction,treatment,vip,word',
    rows: [
        {
            text: "Send messages in chosen channels, based on your rules. If a rule has several messages, one is picked at random.",
        },
        {
            text: "With this <a href='https://help.twitch.tv/s/article/twitch-chat-badges-guide' top-tooltip='Chat Badges'>badge</a>, send a <em>general message</em> for you:",
        },
        {
            html: `<div>
                        <select id='auto_chat__vip'>
                            <option value='null' set='textContent→\\Glyphs.utf8.error \\this.textContent'>Disabled (never send)</option>
                            <option value='moderator' set='textContent→\\Glyphs.utf8.sword \\this.textContent'>Moderator</option>
                            <option value='vip' set='textContent→\\Glyphs.utf8.vip \\this.textContent'>VIP</option>
                            <option value='subscriber' set='textContent→\\Glyphs.utf8.fav \\this.textContent'>Subscriber</option>
                            <option value='everyone' set='textContent→\\Glyphs.utf8.intro \\this.textContent'>Everyone (always send)</option>
                        </select>
                    </div>`,
        },
        {
            tr: false,
            text: "",
        },
        {
            extras: {
                title: "Options",
                tr: 'options',
                subtitle: 'Adjust options for "Lurking Message"',
            },
            rows: [
                {
                    option: {
                        title: "Mentions",
                        tr: 'auto-chat:include-mentions',
                    },
                    attrs: {
                        disabled: '',
                    },
                    rows: [
                        {
                            text: "When someone mentions you <code purple>@username</code>:<br> {{auto_chat__mentions}}",
                        },
                    ],
                },
                {
                    option: {
                        title: "Message(s)",
                        tr: 'auto-chat:lurking-message',
                    },
                    rows: [
                        {
                            text: "{{lurking_rules-input}}",
                        },
                        {
                            extras: {
                                title: "Messages",
                                tr: 'lurking-message:options',
                                subtitle: 'View, or remove messages',
                            },
                            panelAttrs: {
                                type: 'list',
                                id: 'lurking_rules',
                            },
                            rows: [
                                {
                                    html: `<div lurking-type='channel' tr-id>
                                            <h2>Channel Specific Messages</h2>
                                        </div>`,
                                },
                                {
                                    html: `<div lurking-type='badge' tr-id>
                                            <h2>Badge Specific Messages</h2>
                                        </div>`,
                                },
                                {
                                    html: `<div lurking-type='text' tr-id>
                                            <h2>General Messages</h2>
                                        </div>`,
                                },
                                {
                                    html: `<div>
                                            <h2 tr-id>
                                                Get started by <a href='#lurking_rules-input' target='_self'>adding</a> some rules and messages.
                                            </h2>

                                            <details>
                                                <summary subtitle>Examples</summary>
                                                <ul>
                                                    <li>
                                                        Send a message on a specific channel (<em>DashDucks</em>):
                                                        <pre type='code'>/dashducks another day, another duck :D</pre>
                                                    </li>
                                                    <li>
                                                        Send a message where you have certain permissions (<em>moderator</em>):
                                                        <pre type='code'>&lt;mod&gt; modCheck I have risen modCheck</pre>
                                                    </li>
                                                    <li>
                                                        Send a message on a specific channel, where you have certain permissions (<em>DashDuck:moderator</em>):
                                                        <pre type='code'>/dashducks &lt;mod&gt; modCheck I have risen modCheck</pre>
                                                    </li>
                                                </ul>
                                            </details>
                                        </div>`,
                                },
                            ],
                        },
                    ],
                },
                {
                    option: {
                        title: "Wait Time",
                        tr: 'auto-chat:include-phrases',
                    },
                    rows: [
                        {
                            text: "Wait {{auto_chat__wait_time}} before sending the <b>message</b>.",
                        },
                    ],
                },
            ],
        },
    ],
    settings: {
        auto_chat__mentions: {
            type: 'select',
            options: [
                {
                    value: 'null',
                    label: "Do nothing",
                },
            ],
        },
        'lurking_rules-input': {
            type: 'text',
            default: '',
            placeholder: "/channel <badge> message",
            store: false,
            attrs: {
                'left-tooltip': 'Case insensitive • Semicolon separated',
            },
        },
        auto_chat__wait_time: {
            type: 'number',
            default: 5,
            min: 0,
            max: 30,
            step: 1,
            unit: 'min',
        },
        auto_chat__vip: {
            type: 'custom',
        },
        lurking_rules: {
            type: 'custom',
        },
    },
};
