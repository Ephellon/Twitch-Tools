/*** /settings/sections/user-scripts.js
 * Settings for "User Scripts": the list of the viewer's `.ttv` scripts. Each script's own section follows this one
 * (see settings/user-scripts.js).
 */

export default {
    title: "User Scripts",
    tr: 'user-scripts',
    glyph: 'extensions',
    flags: ['small'],
    badges: {
        beta: '6.0',
    },
    keywords: 'dsl,script,scripts,ttv,automation,plugin,plugins,custom,bot,commands',
    rows: [
        {
            text: "Write your own chat helpers: reply to commands, greet raiders or post on a timer. Each script gets its own switch and settings below.",
        },
        {
            text: "Scripts run in chat. A script that asks for permissions waits until you approve them.",
        },
        {
            html: "<div id='user-scripts-manager'></div>",
        },
    ],
    settings: {},
};
