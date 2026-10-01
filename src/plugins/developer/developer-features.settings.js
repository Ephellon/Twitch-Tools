/*** /plugins/developer/developer-features.settings.js
 * Settings for "Extra Keyboard Shortcuts" (Developer Features).
 */

export default {
    title: "Extra Keyboard Shortcuts",
    tr: '@keyboard-shortcuts',
    glyph: 'stats',
    flags: ['small'],
    badges: {
        new: '4.12.13',
    },
    keywords: 'console,delay,development,expansion,extension,increase,keyboard,manual,piano,postponement,shortcuts',
    rows: [
        {
            toggle: 'extra_keyboard_shortcuts',
        },
        {
            text: "Add extra keyboard shortcuts.",
        },
        {
            text: "Press <code id='key:?'>?</code> on any stream to see them.",
        },
    ],
    settings: {
        extra_keyboard_shortcuts: {
            type: 'checkbox',
            default: true,
        },
    },
};
