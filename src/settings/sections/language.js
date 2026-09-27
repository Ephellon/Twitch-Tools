/*** /settings/sections/language.js
 * Settings for "Language" (About TTV Tools).
 */

export default {
    title: "Language",
    tr: 'language',
    glyph: 'translate',
    flags: ['small'],
    badges: {
        dead: '5.30',
    },
    keywords: 'accent,dialect,expression,jargon,language,prose,sound,speech,style,terminology,vocabulary,voice,word,wording',
    rows: [
        {
            select: 'user_language_preference',
        },
    ],
    settings: {
        user_language_preference: {
            type: 'select',
            options: [
                {
                    default: true,
                    value: 'en',
                    label: "English (North American)",
                },
            ],
            attrs: {
                disabled: '',
            },
        },
    },
};
