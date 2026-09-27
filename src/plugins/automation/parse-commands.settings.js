/*** /plugins/automation/parse-commands.settings.js
 * Settings for "Parse Commands" (Automation).
 */

export default {
    title: "Parse Commands",
    tr: 'parse-commands',
    glyph: 'extensions',
    flags: ['small', 'gold'],
    badges: {
        new: '4.30',
    },
    keywords: 'angle,association,avenue,board,bulletin,bureau,button,cabinet,carrier,change,channels,charge,collectibles,commands,commission,contact,corner,current,curve,departure,direction,duty,element,extras,fairway,flood,flow,forum,group,handling,hookup,jury,knob,law,links,management,mandate,manipulation,means,medium,network,notice,notification,order,oversight,page,panel,plan,policy,proclamation,regulation,relationship,reminders,request,responsibility,reversal,round,route,rule,rush,shift,spate,spin,spiral,strategy,streams,surge,swing,tab,task force,tide,tie,torrent,transaction,treatment,trend,tribunal,tributary,tunnel,turn,twist,warning,wind,word,word',
    rows: [
        {
            toggle: 'parse_commands',
        },
        {
            text: "When a <b alert-text top-tooltip='!command'>command</b> has been found on the page, retrieve the contents of the command.",
        },
        {
            extras: {
                title: "Options",
                tr: 'options',
                subtitle: 'Adjust options for "Parse Commands"',
            },
            rows: [
                {
                    option: {
                        title: "Create Links",
                        tr: 'parse-commands:options',
                    },
                    rows: [
                        {
                            toggle: 'parse_commands__create_links',
                        },
                        {
                            text: "<b>Parse Commands</b> will turn commands that contain links into their <b attention-text top-tooltip='Most fulfilled (missing the least number of components)'>best</b> link.",
                        },
                    ],
                },
            ],
        },
    ],
    settings: {
        parse_commands: {
            type: 'checkbox',
            default: false,
        },
        parse_commands__create_links: {
            type: 'checkbox',
            default: true,
        },
    },
};
