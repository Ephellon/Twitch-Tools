/*** /settings/sections/support.js
 * Settings for "Support" (About TTV Tools).
 */

export default {
    title: "Support",
    tr: 'support',
    glyph: 'info',
    flags: ['small'],
    keywords: 'backing,help,support',
    rows: [
        {
            html: `<a type='button' href='https://github.com/ephellon/twitch-tools' top-tooltip='Fastest communication method' github>
                    <span small glyph='github'></span>
                    GitHub
                </a>`,
        },
        {
            html: `<a type='button' href='https://chrome.google.com/webstore/detail/twitch-tools/fcfodihfdbiiogppbnhabkigcdhkhdjd' top-tooltip='Reasonable communication method'>
                    <span small glyph='chrome'></span>
                    Chrome Web Store
                </a>`,
        },
        {
            html: `<a disabled type='button' href='#mailto:minkcbos@gmail.com?subject=Twitch%20Tools' top-tooltip='Slowest communication method'>
                    <span small glyph='unread'></span>
                    e-mail
                </a>`,
        },
    ],
    settings: {},
};
