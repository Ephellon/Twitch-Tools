/*** /plugins/automation/lurking.settings.js
 * Settings for "Easy Lurk" (Automation).
 */

export default {
    title: "Easy Lurk",
    tr: 'away-mode',
    glyph: 'show',
    flags: ['small'],
    badges: {
        new: '4.12',
    },
    keywords: 'agenda,amount,calendar,chart,chatter,conversation,figure,gossip,itinerary,lineup,list,number,program,quantity,record,roster,schedule,size,timetable,total,volume;sunday,monday,tuesday,wednesday,thursday,friday,saturday',
    rows: [
        {
            toggle: 'away_mode',
        },
        {
            text: "Add a button to turn <b attention-text top-tooltip='Watching (one or more) streams with little to no engagement'>lurking</b> on and off.",
        },
        {
            text: "You can also press <code id='key:alt-a'>Alt + A</code>.",
        },
        {
            extras: {
                title: "Extras",
                tr: 'extras',
                subtitle: 'Adjust settings for "Easy Lurk"',
            },
            rows: [
                {
                    option: {
                        title: "Hide Chat",
                        tr: 'away-mode:hide-chat',
                    },
                    rows: [
                        {
                            toggle: 'away_mode__hide_chat',
                        },
                        {
                            text: "Keep chat hidden while <b attention-text top-tooltip='Watching (one or more) streams with little to no engagement'>lurking</b>.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Lurking Volume",
                        tr: 'away-mode:volume',
                    },
                    rows: [
                        {
                            toggle: 'away_mode__volume_control',
                        },
                        {
                            text: "Set the volume to {{away_mode__volume}} when <b attention-text top-tooltip='Watching (one or more) streams with little to no engagement'>lurking</b>.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Schedule",
                        tr: 'away-mode:schedule',
                    },
                    rows: [
                        {
                            extras: {
                                title: "Times",
                                tr: 'away-mode:schedule:options',
                                subtitle: 'View, or remove times',
                            },
                            panelAttrs: {
                                type: 'list',
                                id: 'away_mode_schedule',
                            },
                            rows: [
                                {
                                    html: `<div day-of-week='0'>
                                            <h2 tr-id='day-of-week'>Sunday</h2>
                                        </div>`,
                                },
                                {
                                    html: `<div day-of-week='1'>
                                            <h2 tr-id='day-of-week'>Monday</h2>
                                        </div>`,
                                },
                                {
                                    html: `<div day-of-week='2'>
                                            <h2 tr-id='day-of-week'>Tuesday</h2>
                                        </div>`,
                                },
                                {
                                    html: `<div day-of-week='3'>
                                            <h2 tr-id='day-of-week'>Wednesday</h2>
                                        </div>`,
                                },
                                {
                                    html: `<div day-of-week='4'>
                                            <h2 tr-id='day-of-week'>Thursday</h2>
                                        </div>`,
                                },
                                {
                                    html: `<div day-of-week='5'>
                                            <h2 tr-id='day-of-week'>Friday</h2>
                                        </div>`,
                                },
                                {
                                    html: `<div day-of-week='6'>
                                            <h2 tr-id='day-of-week'>Saturday</h2>
                                        </div>`,
                                },
                                {
                                    html: "<div hr><button id='add-time'><span small glyph='add_to_calendar'></span> <span tr-id='new'>New</span></button></div>",
                                },
                                {
                                    html: `<div hidden>
                                            <!-- BUFFER -->
                                        </div>`,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
    settings: {
        away_mode: {
            type: 'checkbox',
            default: true,
        },
        away_mode__hide_chat: {
            type: 'checkbox',
            default: false,
        },
        away_mode__volume_control: {
            type: 'checkbox',
            default: false,
        },
        away_mode__volume: {
            type: 'number',
            default: 25,
            min: 1,
            max: 25,
            unit: '%',
            scale: 0.01,     // Saved as a fraction of full volume
        },
        away_mode_schedule: {
            type: 'custom',
        },
    },
};
