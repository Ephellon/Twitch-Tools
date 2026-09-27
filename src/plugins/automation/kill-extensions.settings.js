/*** /plugins/automation/kill-extensions.settings.js
 * Settings for "Kill Extensions" (Automation).
 */

export default {
    title: "Kill Extensions",
    tr: 'kill-extensions',
    glyph: 'extensions',
    flags: ['small', 'gold'],
    keywords: 'act,array,blink,current,delay,demonstration,development,display,example,exhibit,expansion,extensions,flood,flow,flutter,increase,jerk,jiggle,parade,postponement,presentation,rush,shudder,spate,stream,surge,tide,torrent,tremble,tributary,twitch',
    rows: [
        {
            toggle: 'kill_extensions',
        },
        {
            text: "Do not allow Twitch™ extensions to display over the stream.",
        },
    ],
    settings: {
        kill_extensions: {
            type: 'checkbox',
            default: false,
        },
    },
};
