/*** /plugins/automation/auto-focus.settings.js
 * Settings for "Auto-Focus" (Experimental Features).
 */

export default {
    title: "Auto-Focus",
    tr: '@@auto-focus',
    glyph: 'show',
    flags: ['small'],
    keywords: 'action,activity,appearance,auto focus,bar,block,break,conclusion,copy,current,detection,disclosure,drawing,election,enterprise,exercise,figure,flood,flow,focal point,focus,form,hiatus,icon,illustration,image,infinitesimal,insignificant,intermission,interruption,interval,layoff,life,likeness,lull,microscopic,minimal,minuscule,minute,model,movement,pause,photograph,picture,plebiscite,polling,portrait,precise,referendum,rush,slate,spate,spell,spotlight,statue,stop,stream,surge,tally,target,ticket,tide,timer,tiny,torrent,tributary,tributary',
    rows: [
        {
            toggle: 'auto_focus',
        },
        {
            text: "Automatically adjust <b>Up Next</b> and <b>Easy Lurk</b> based upon stream activity.",
        },
        {
            text: "This will <b>not</b> stop the <b>Up Next / First in Line</b> one minute timer.",
            attrs: {
                'warning-text': '',
            },
        },
        {
            extras: {
                title: "Options",
                tr: 'options',
                subtitle: 'Adjust options for "Auto-Focus"',
            },
            rows: [
                {
                    html: `<div>
                            <div class='title' tr-id='@@auto-focus:options:detection-level'>Detection Level</div>
                            <div class='summary'>
                                <p tr-id>
                                    How much activity should activate <b>Auto-Focus</b>?
                                </p>

                                <select id='auto_focus_detection_threshold'>
                                    <option value='0' selected tr-id>Automatic</option>
                                    <option value='30' tr-id>High activity — FPS / IRL / Rhythm</option>
                                    <option value='20' tr-id>Modest activity — Action / Adventure / Platformer</option>
                                    <option value='10' tr-id>Seasonal activity — Horror / Puzzle / Trivia</option>
                                    <option value='5' tr-id>Low activity — Just Chatting / Simulation / Strategy</option>
                                </select>
                            </div>
                        </div>`,
                },
                {
                    html: `<div>
                            <div class='title' tr-id='@@auto-focus:options:polling-interval'>Polling Interval</div>
                            <div class='summary'>
                                <p tr-id>
                                    How often should the stream be <b attention-text left-tooltip='A screenshot of the stream will be taken to detect activity'>polled</b>?
                                </p>

                                <select id='auto_focus_poll_interval'>
                                    <option value='1' tr-id>Every second — CPU intensive, great detection</option>
                                    <option value='3' selected tr-id>Every 3 seconds — CPU friendly, good detection</option>
                                    <option value='5' tr-id>Every 5 seconds — CPU friendly, fair detection</option>
                                    <option value='10' tr-id>Every 10 seconds — CPU friendly, poor detection</option>
                                </select>
                            </div>
                        </div>`,
                },
                {
                    html: `<div>
                            <div class='title' tr-id='@@auto-focus:options:image-type'>Image Type</div>
                            <div class='summary'>
                                <p tr-id>
                                    What image type should be used for <b attention-text left-tooltip='A screenshot of the stream will be taken to detect activity'>polling</b>?
                                </p>

                                <select id='auto_focus_poll_image_type'>
                                    <option value='webp' selected tr-id>Automatic</option>
                                    <option value='jpeg' tr-id>JPG — CPU friendly, good detection</option>
                                    <option value='png' tr-id>PNG — CPU intensive, great detection</option>
                                    <option value='webp' tr-id>WebP — CPU friendly, great detection</option>
                                </select>
                            </div>
                        </div>`,
                },
            ],
        },
    ],
    settings: {
        auto_focus: {
            type: 'checkbox',
            default: false,
        },
        auto_focus_detection_threshold: {
            type: 'custom',
        },
        auto_focus_poll_interval: {
            type: 'custom',
        },
        auto_focus_poll_image_type: {
            type: 'custom',
        },
    },
};
