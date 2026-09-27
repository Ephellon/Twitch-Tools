/*** /plugins/automation/view-mode.settings.js
 * Settings for "View Mode" (Automation).
 */

export default {
    title: "View Mode",
    tr: 'view-mode',
    glyph: 'video',
    flags: ['small', 'gold'],
    badges: {
        new: '3.1.5',
    },
    keywords: 'approach,aspect,condition,fashion,form,glimpse,loading,look,mechanism,method,mode,outlook,packing,page,perspective,picture,posture,procedure,process,prospect,quality,scene,sight,situation,status,storing,style,system,technique,tone,view,vision,way',
    rows: [
        {
            text: "When the page is done loading, change the view to:",
        },
        {
            select: 'view_mode',
        },
    ],
    settings: {
        view_mode: {
            type: 'select',
            options: [
                {
                    default: true,
                    value: 'null',
                    label: "Nothing (do not change)",
                    attrs: {
                        'tr-id': 'view-mode:options',
                    },
                },
                {
                    value: 'default',
                    label: "Default Mode (banner + chat)",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'theatre',
                    label: "Theatre Mode (chat)",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'fullwidth',
                    label: "Fullwidth Mode (banner)",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'fullscreen',
                    label: "Fullscreen Mode",
                    attrs: {
                        'tr-id': '',
                    },
                },
            ],
        },
    },
};
