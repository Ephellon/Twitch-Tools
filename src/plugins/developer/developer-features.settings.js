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
            text: "Allow the extension to add extra keyboard shortcuts.",
        },
        {
            text: "Keyboard shortcuts can be viewed by invoking <code id='key:?'>?</code> on any stream.",
        },
    ],
    settings: {
        extra_keyboard_shortcuts: {
            type: 'checkbox',
            default: true,
        },
    },
};
