/*** /plugins/up-next/streak-saver.settings.js
 * Settings for "Streak Saver" (Automation).
 */

export default {
    title: "Streak Saver",
    tr: 'streak-saver',
    glyph: 'fire',
    flags: ['small'],
    badges: {
        new: '6.1',
    },
    keywords: 'chain,keep,miss,missed,recover,rescue,save,streak,streaks,watch',
    rows: [
        {
            toggle: 'streak_saver',
        },
        {
            text: "Lists the <b>Watch Streaks</b> you can still save in Up Next, each with a one-click <b>Save</b>.",
        },
        {
            text: "Twitch needs a clip from the last day to save a streak; without one, watch the channel live.",
            attrs: {
                'warning-text': '',
            },
        },
    ],
    settings: {
        streak_saver: {
            type: 'checkbox',
            default: false,
        },
    },
};
