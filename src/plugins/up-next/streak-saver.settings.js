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
            text: "A live channel is added to the front of Up Next (watching it saves the streak). Otherwise, Twitch's own save page opens in a new tab; it plays a recent clip and closes itself once the streak is saved.",
        },
        {
            text: "Twitch sometimes says \"No Content Eligible\" even when a streak can be saved. The list shows what really happened.",
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
