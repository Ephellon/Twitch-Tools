/*** /plugins/automation/time-zones.settings.js
 * Settings for "Time Zones" (Automation).
 */

export default {
    title: "Time Zones",
    tr: 'time-zones',
    glyph: 'calendar',
    flags: ['small', 'gold'],
    badges: {
        new: '4.12.14',
    },
    keywords: 'area,belt,ground,page,region,section,sector,territory,time zone,zones',
    rows: [
        {
            toggle: 'time_zones',
        },
        {
            text: "Show times on the page in your own time zone.",
        },
    ],
    settings: {
        time_zones: {
            type: 'checkbox',
            default: false,
        },
    },
};
