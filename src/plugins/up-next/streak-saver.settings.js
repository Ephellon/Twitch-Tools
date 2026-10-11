/*** /plugins/up-next/streak-saver.settings.js
 * Settings for "Streak Saver" (Automation).
 */

export default {
    title: "Streak Saver",
    tr: 'streak-saver',
    glyph: 'trophy',
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
            text: "Missed a stream? Twitch lets you save your <b>Watch Streak</b> for 24 hours. Up Next gets a list of the streaks you can still save, with a <b>Save</b> button for each.",
        },
        {
            text: "A live channel is added to the front of Up Next (watching it saves the streak). Otherwise, Twitch's own save page plays a recent clip in a small popup, muted.",
        },
        {
            text: "Twitch needs a clip from the last day to save a streak (VODs don't count). Without one, watch the channel live before the streak resets.",
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
