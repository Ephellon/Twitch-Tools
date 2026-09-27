/*** /plugins/chat/simplify-chat.settings.js
 * Settings for "Accessibility" (Chat & Messaging).
 */

export default {
    title: "Accessibility",
    tr: 'simplify-chat',
    glyph: 'accessible',
    flags: ['large', 'help'],
    badges: {
        new: '5.32.7',
        id: 'accessibility',
    },
    keywords: 'accent,act,array,chatter,colors,conversation,demonstration,display,emphasis,example,exhibit,font,fount,gossip,homogeneous,inflection,inflexible,monotone,orderly,parade,presentation,reliable,resonance,rigid,strength,systematic,timbre,tones,uniform',
    rows: [
        {
            text: "Make Twitch™ easier to navigate and use.",
        },
        {
            html: `<details>
                    <summary tr-id='options' subtitle='Adjust accessibility options'>Options</summary>

                    <div sect>
                        <h2><span small gold glyph='chat'></span> Chat</h2>

                        <div opt>
                            <div class='title' tr-id='simplify-chat:options'>Dual-tone Chat</div>
                            <div class='summary'>
                                <div class='toggle'>
                                    <input id='simplify_chat' type='checkbox'>
                                    <label for='simplify_chat'></label>
                                </div>
                                <p tr-id>
                                    Display the chat dual-toned to make it easier to read.
                                </p>
                            </div>
                        </div>

                        <div opt>
                            <div class='title' tr-id='simplify-chat:options'>Monotone Usernames</div>
                            <div class='summary'>
                                <div class='toggle'>
                                    <input id='simplify_chat_monotone_usernames' type='checkbox'>
                                    <label for='simplify_chat_monotone_usernames'></label>
                                </div>
                                <p tr-id>
                                    Keep username colors uniform.
                                </p>
                            </div>
                        </div>

                        <div opt>
                            <div class='title' tr-id>Chat Font</div>
                            <div class='summary'>
                                <p tr-id>
                                    Display chat in the following font:
                                </p>

                                <select id='simplify_chat_font'>
                                    <option value='Roobert' style='font-family:Roobert!important' selected>Roobert → TWITCH.tv™</option>
                                    <option value='Arial' style='font-family:Arial!important'>Arial → TWITCH.tv™</option>
                                    <option value='Calibri' style='font-family:Calibri!important'>Calibri → TWITCH.tv™</option>
                                    <option value='Dyslexie' style='font-family:Dyslexie!important'>Dyslexie → TWITCH.tv™</option>
                                    <option value='Helvetica' style='font-family:Helvetica!important'>Helvetica → TWITCH.tv™</option>
                                    <option value='Monospace' style='font-family:Monospace!important'>Monospace → TWITCH.tv™</option>
                                    <option value='System-UI' style='font-family:System-UI!important'>System-UI → TWITCH.tv™</option>
                                    <option value='Tahoma' style='font-family:Tahoma!important'>Tahoma → TWITCH.tv™</option>
                                    <option value='Verdana' style='font-family:Verdana!important'>Verdana → TWITCH.tv™</option>
                                    <option value='Inter' style='font-family:Inter!important'>Inter → TWITCH.tv™</option>
                                    <option value='04b03' style='font-family:"04b03"!important'>04b03 → TWITCH.tv™</option>
                                </select>
                            </div>
                        </div>

                        <div disabled opt>
                            <div class='title' tr-id>Reverse Emotes</div>
                            <div class='summary'>
                                <div class='toggle'>
                                    <input id='simplify_chat_reverse_emotes' type='checkbox' disabled>
                                    <label for='simplify_chat_reverse_emotes'></label>
                                </div>
                                <p tr-id>
                                    Convert emotes back into their text, and display the emote (as a <code>tooltip</code>) only when <code>hovering</code> the text.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div sect>
                        <h2><span small gold glyph='video'></span> Twitch™</h2>

                        <div opt>
                            <div class='title' tr-id='simplify-look:options'>Marquee Long Text</div>

                            <div class='summary'>
                                <div class='toggle'>
                                    <input id='simplify_look_auto_marquee' type='checkbox'>
                                    <label for='simplify_look_auto_marquee'></label>
                                </div>
                                <p tr-id>
                                    Text that extends beyond a container's display will be turned into a marquee.
                                </p>
                            </div>
                        </div>

                        <div opt>
                            <div class='title' tr-id>Page Font</div>
                            <div class='summary'>
                                <p tr-id>
                                    Display Twitch™ (excluding chat) in the following font:
                                </p>

                                <select id='simplify_page_font'>
                                    <option value='Roobert' style='font-family:Roobert!important' selected>Roobert → TWITCH.tv™</option>
                                    <option value='Arial' style='font-family:Arial!important'>Arial → TWITCH.tv™</option>
                                    <option value='Calibri' style='font-family:Calibri!important'>Calibri → TWITCH.tv™</option>
                                    <option value='Dyslexie' style='font-family:Dyslexie!important'>Dyslexie → TWITCH.tv™</option>
                                    <option value='Helvetica' style='font-family:Helvetica!important'>Helvetica → TWITCH.tv™</option>
                                    <option value='Monospace' style='font-family:Monospace!important'>Monospace → TWITCH.tv™</option>
                                    <option value='System-UI' style='font-family:System-UI!important'>System-UI → TWITCH.tv™</option>
                                    <option value='Tahoma' style='font-family:Tahoma!important'>Tahoma → TWITCH.tv™</option>
                                    <option value='Verdana' style='font-family:Verdana!important'>Verdana → TWITCH.tv™</option>
                                    <option value='Inter' style='font-family:Inter!important'>Inter → TWITCH.tv™</option>
                                    <option value='04b03' style='font-family:"04b03"!important'>04b03 → TWITCH.tv™</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </details>`,
        },
    ],
    settings: {
        simplify_chat: {
            type: 'custom',
        },
        simplify_chat_monotone_usernames: {
            type: 'custom',
        },
        simplify_chat_font: {
            type: 'custom',
        },
        simplify_look_auto_marquee: {
            type: 'custom',
        },
        simplify_page_font: {
            type: 'custom',
        },
        simplify_chat_reverse_emotes: {
            type: 'custom',
            store: false,
        },
    },
};
