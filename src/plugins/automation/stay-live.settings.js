/*** /plugins/automation/stay-live.settings.js
 * Settings for "Stay Live" (Automation).
 */

export default {
    title: "Stay Live",
    tr: 'stay-live',
    glyph: 'stream',
    flags: ['small'],
    badges: {
        new: '4.5',
    },
    keywords: 'avenue,carrier,channel,current,deadline,edge,ends,flood,flow,holiday,means,medium,offline,point,route,rush,sojourn,spate,stay,stopover,streams,surge,term,tide,top,torrent,tributary,tributary,tunnel,vacation',
    rows: [
        {
            toggle: 'stay_live',
        },
        {
            text: "After the current stream ends, go to the <b>Next Channel</b>.",
        },
        {
            extras: {
                title: "Extras",
                tr: 'extras',
                subtitle: 'Adjust settings for "Stay Live"',
            },
            rows: [
                {
                    option: {
                        title: "<span class='offline'>Rerun</span> → <span class='offline'>Offline</span>",
                    },
                    rows: [
                        {
                            toggle: 'stay_live__ignore_channel_reruns',
                        },
                        {
                            tr: 'stay-live:vod-is-offline',
                            text: "Treat <a href='https://help.twitch.tv/s/article/video-on-demand#reruns' top-tooltip='Reruns'>reruns</a> as offline streams.",
                        },
                    ],
                },
            ],
        },
    ],
    settings: {
        stay_live: {
            type: 'checkbox',
            default: true,
        },
        stay_live__ignore_channel_reruns: {
            type: 'checkbox',
            default: false,
            attrs: {
                requires: '#stay_live',
            },
        },
    },
};
