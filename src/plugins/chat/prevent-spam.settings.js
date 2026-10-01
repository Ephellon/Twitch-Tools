/*** /plugins/chat/prevent-spam.settings.js
 * Settings for "Prevent Spam" (Chat & Messaging).
 */

export default {
    title: "Prevent Spam",
    tr: 'prevent-spam',
    glyph: 'mod',
    flags: ['small', 'gold'],
    keywords: 'accident,breadth,chatter,circumstance,conversation,diameter,dimension,directive,duration,episode,existence,gossip,height,impression,imprint,incidence,incident,information,instance,length,letter,limit,line,magnitude,manifestation,mark,maximum,memorandum,messages,mileage,minimal,minimum,news,note,notice,occurrences,period,piece,point,portion,quantity,radius,range,record,report,scar,score,section,segment,signature,situation,space,spam,span,spot,stain,stamp,streak,stretch,symbol,talk,term,width,words,writing,writing',
    rows: [
        {
            toggle: 'prevent_spam',
        },
        {
            text: "Hide repeated messages in chat.",
        },
        {
            extras: {
                title: "Options",
                tr: 'options',
                subtitle: 'Adjust options for "Prevent Spam"',
            },
            rows: [
                {
                    option: {
                        title: "Message History",
                        tr: 'prevent-spam:options',
                    },
                    rows: [
                        {
                            text: "Compare each message with the last {{prevent_spam_look_back}} lines to find <b attention-text top-tooltip='This will look for messages that match word-for-word'>copies</b>.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Minimum Word Length",
                        tr: '',
                    },
                    rows: [
                        {
                            text: "Skip messages with no word longer than {{prevent_spam_minimum_length}} characters.",
                        },
                    ],
                },
                {
                    option: {
                        title: "Maximum Occurrences",
                        tr: '',
                    },
                    rows: [
                        {
                            text: "Treat a message as spam when one word appears {{prevent_spam_ignore_under}} or more times.",
                        },
                    ],
                },
            ],
        },
    ],
    settings: {
        prevent_spam: {
            type: 'checkbox',
            default: true,
        },
        prevent_spam_look_back: {
            type: 'number',
            default: 15,
            min: 1,
            max: 250,
            step: 1,
            unit: '¶',
        },
        prevent_spam_minimum_length: {
            type: 'number',
            default: 5,
            min: 3,
            max: 500,
            step: 1,
            unit: '🔣',
        },
        prevent_spam_ignore_under: {
            type: 'number',
            default: 5,
            min: 1,
            max: 150,
            step: 1,
            unit: '≥',
        },
    },
};
