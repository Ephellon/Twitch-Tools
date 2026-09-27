/*** /plugins/notifications/mention-audio.settings.js
 * Settings for "Notification Sounds" (Chat & Messaging).
 */

export default {
    title: "Notification Sounds",
    tr: 'notification-sounds',
    glyph: 'music',
    flags: ['small', 'gold'],
    badges: {
        new: '4.1',
    },
    keywords: 'accent,adoption,benefit,bulletin,buzz,character,climax,conditions,expression,feature,flawless,focal point,gossip,handling,harmony,help,highlight,hint,idiom,innuendo,intact,leader,melody,motto,murmur,music,need,noise,note,notice,notification,official,operation,phrases,phrasing,practice,proclamation,purpose,remark,robust,safe,sane,saying,service,sigh,slogan,solid,someone,sounds,stable,star,sturdy,terminology,thorough,tone,treatment,usage,uses,utterance,value,vibrant,vibration,vigorous,voice,warning,whispers,wording,wording',
    rows: [
        {
            text: "When one (or more) of the following conditions are met, play a notification sound.",
        },
        {
            html: `<div>
                    <!-- EMPTY OFFSET -->
                </div>`,
        },
        {
            extras: {
                title: "Options",
                tr: 'options',
                subtitle: 'Adjust options for "Notification Sounds"',
            },
            rows: [
                {
                    option: {
                        title: "Mentions",
                        tr: 'notification-sounds:include-mentions',
                    },
                    rows: [
                        {
                            toggle: 'mention_audio',
                        },
                        {
                            text: "When someone mentions you <code purple>@username</code>, play the <b>notification sound</b>.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Phrases",
                        tr: 'notification-sounds:include-phrases',
                    },
                    rows: [
                        {
                            toggle: 'phrase_audio',
                        },
                        {
                            text: "When someone uses a phrase from <b>Highlight Phrases</b>, play the <b>notification sound</b>.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Whispers",
                        tr: 'notification-sounds:include-whispers',
                    },
                    rows: [
                        {
                            toggle: 'whisper_audio',
                        },
                        {
                            text: "When someone sends you a whisper, play the <b>notification sound</b>.",
                        },
                    ],
                },
                {
                    html: '<hr>',
                },
                {
                    option: {
                        title: "Notification Sound",
                        tr: 'notification-sounds:options',
                    },
                    rows: [
                        {
                            select: 'whisper_audio_sound',
                        },
                        {
                            html: "<button id='whisper_audio_sound-test'>Test notification sound</button>",
                        },
                    ],
                },
                {
                    tr: false,
                    text: "",
                },
                {
                    html: `<div class='cc-container'>
                                <div class='cc-svg'><span black glyph='cc'></span></div>
                                <p class='cc-text' tr-id='cc-sound-notice'>
                                    <a id='sound-href' href='https://notificationsounds.com/notification-sounds/goes-without-saying-608' rel='nofollow'>This sound</a> is licensed under the Creative Commons Attribution license.
                                    <a id='sound-license' href='https://creativecommons.org/licenses/by/4.0/legalcode' rel='nofollow'>Find out more</a>.
                                </p>
                            </div>`,
                },
                {
                    tr: false,
                    text: "",
                },
            ],
        },
    ],
    settings: {
        mention_audio: {
            type: 'checkbox',
            default: false,
        },
        phrase_audio: {
            type: 'checkbox',
            default: false,
        },
        whisper_audio: {
            type: 'checkbox',
            default: false,
        },
        whisper_audio_sound: {
            type: 'select',
            options: [
                {
                    value: 'beyond-doubt-2-581',
                    label: "Beyond doubt 2",
                },
                {
                    value: 'consequence-544',
                    label: "Consequence",
                },
                {
                    value: 'definite-555',
                    label: "Definite",
                },
                {
                    default: true,
                    value: 'goes-without-saying-608',
                    label: "Goes without saying",
                },
                {
                    value: 'point-blank-589',
                    label: "Point blank",
                },
                {
                    value: 'slow-spring-board-570',
                    label: "Slow spring board",
                },
                {
                    value: 'to-the-point-568',
                    label: "To the point",
                },
            ],
        },
    },
};
