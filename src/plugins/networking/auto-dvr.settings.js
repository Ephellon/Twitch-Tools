/*** /plugins/networking/auto-dvr.settings.js
 * Settings for "Video Clips" (Networking).
 */

export default {
    title: "Video Clips",
    tr: 'networking:video-clips',
    glyph: 'download',
    flags: ['small'],
    badges: {
        new: '5.32.4',
        beta: '5.28',
    },
    keywords: 'allocation,alt,avenue,bar,beginning,block,book,break,breathing space,carrier,case,channels,charge,chunk,citation,clips,collectibles,conclusion,crown,cup,current,data,dawn,decoration,default,delinquency,directory,dossier,dvr,excerpt,file,flood,flow,folder,fraction,fragment,gold,halt,handling,hesitation,hiatus,hitch,information,interlude,intermission,interruption,interval,keepsake,kickoff,lapse,layoff,letup,list,lot,lull,management,manipulation,means,medal,medium,memento,mow,nonpayment,notebook,opening,outset,oversight,part,pause,piece,plan,policy,portions,prize,prune,quantity,queue,recess,record,recording,respite,route,rush,section,segment,serving,shave,shear,snip,souvenir,spate,start,stoppage,strategy,streams,surge,suspension,televised,tide,torrent,transaction,treatment,tributary,trim,trophies,trophy,tunnel,video',
    rows: [
        {
            text: "Allows recording portions of streams. Use <code id='key:alt-z'>Alt + Z</code> to start/stop recording.",
        },
        {
            extras: {
                title: "Options",
                tr: 'options',
                subtitle: 'Adjust settings for "Video Clips"',
            },
            rows: [
                {
                    option: {
                        title: "File Type",
                        tr: 'video-clips:file-type',
                    },
                    rows: [
                        {
                            text: "What file type should <b>Video Clips</b> be?",
                        },
                        {
                            select: 'video_clips__file_type',
                        },
                    ],
                },
                {
                    option: {
                        title: "Quality",
                        tr: 'video-clips:quality',
                    },
                    rows: [
                        {
                            text: "What quality should <b>Video Clips</b> be?",
                        },
                        {
                            select: 'video_clips__quality',
                        },
                    ],
                },
                {
                    option: {
                        title: "Default Length",
                        tr: 'video-clips:length',
                    },
                    rows: [
                        {
                            text: "<b>Video Clips</b> should be {{video_clips__length}} by default.",
                        },
                    ],
                },
                {
                    option: {
                        title: "DVR",
                        tr: 'video-clips:dvr',
                    },
                    rows: [
                        {
                            toggle: 'video_clips__dvr',
                        },
                        {
                            text: "Automatically record (and save) certain streams. Channels marked as <b>DVR</b> will skip and pause the <b>First in Line</b> queue.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Trophies",
                        tr: 'video-clips:trophy',
                    },
                    attrs: {
                        'group-start': '',
                    },
                    rows: [
                        {
                            toggle: 'video_clips__trophy',
                        },
                        {
                            text: "Automatically record (and save) channel point redemption clips. Clips will be {{video_clips__trophy_length}} long.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Record Other Redemptions",
                        tr: 'video-clips:foreign-trophy',
                    },
                    attrs: {
                        'group-end': '',
                    },
                    rows: [
                        {
                            toggle: 'record_foreign_rewards',
                        },
                        {
                            text: "When another user redeems a channel point item you have saved to your \"Buy Later\" list, record their redemption.",
                        },
                    ],
                },
            ],
        },
    ],
    settings: {
        video_clips__file_type: {
            type: 'select',
            options: [
                {
                    default: true,
                    value: 'x-matroska',
                    label: "Easiest to share (MKV)",
                    attrs: {
                        'tr-id': 'video-clips:file-type-options',
                    },
                },
                {
                    value: 'webm;codecs=h264',
                    label: "Most compatible (MP4)",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'webm;codecs=vp8,vp9',
                    label: "Most supported (AVI)",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'webm;codecs=opus',
                    label: "Easiest to edit (OGV)",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'webm;codecs=3gpp',
                    label: "Most mobile-friendly (3GP)",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'webm',
                    label: "Most efficient (WebM)",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: 'mpeg',
                    label: "Most dynamic (MPEG)",
                    attrs: {
                        'tr-id': '',
                    },
                },
            ],
        },
        video_clips__quality: {
            type: 'select',
            options: [
                {
                    default: true,
                    value: 'auto',
                    label: "Auto",
                    attrs: {
                        'tr-id': 'video-clips:quality-options',
                    },
                },
                {
                    value: 'source',
                    label: "Source",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: '1080p',
                    label: "1080p",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: '720p',
                    label: "720p",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: '480p',
                    label: "480p",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: '360p',
                    label: "360p",
                    attrs: {
                        'tr-id': '',
                    },
                },
                {
                    value: '160p',
                    label: "160p",
                    attrs: {
                        'tr-id': '',
                    },
                },
            ],
        },
        video_clips__length: {
            type: 'number',
            default: 60,
            min: 15,
            max: 300,
            step: 15,
            wrap: {
                'fix-unit': 'sec',
            },
        },
        video_clips__dvr: {
            type: 'checkbox',
            default: false,
        },
        video_clips__trophy: {
            type: 'checkbox',
            default: false,
        },
        video_clips__trophy_length: {
            type: 'number',
            default: 60,
            min: 15,
            max: 1800,
            step: 15,
            wrap: {
                'fix-unit': 'sec',
            },
        },
        record_foreign_rewards: {
            type: 'checkbox',
            default: false,
        },
    },
};
