/*** /settings/sections/ram-alarms.js
 * Settings for "RAM Alarms" (Video Recovery).
 */

export default {
    title: "RAM Alarms",
    tr: 'ram-alarms',
    glyph: 'flag',
    flags: ['small', 'gold'],
    badges: {
        new: '5.35.1',
    },
    rows: [
        {
            text: "What should TTV Tools do when a tab's page memory gets high? (The browser's Task Manager shows more, because it counts the whole tab.)",
        },
        {
            extras: {
                title: "Alarms",
                tr: 'alarms',
                subtitle: 'Adjust settings for "RAM Alarms"',
            },
            rows: [
                {
                    html: `<div opt>
                            <div tr-id='ram-alarms:low'>When above <span unit='MB'><input disabled id='ram_low' type='number' value='500'></span> — LOW</div>
                            <select id='ram_onlow'>
                                <option value='ignore' tr-id set='textContent→\\Glyphs.utf8.ignore \\this.textContent'>Ignore</option>
                                <option value='notify' tr-id set='textContent→\\Glyphs.utf8.notify \\this.textContent'>Notify</option>
                                <option value='respawn' tr-id set='textContent→\\Glyphs.utf8.refresh \\this.textContent'>Respawn</option>
                            </select>
                        </div>`,
                },
                {
                    html: `<div opt>
                            <div tr-id='ram-alarms:medium'>When above <span unit='GB'><input disabled id='ram_medium' type='number' value='1'></span> — MEDIUM</div>
                            <select id='ram_onmedium'>
                                <option value='ignore' tr-id set='textContent→\\Glyphs.utf8.ignore \\this.textContent'>Ignore</option>
                                <option value='notify' tr-id set='textContent→\\Glyphs.utf8.notify \\this.textContent'>Notify</option>
                                <option value='respawn' tr-id set='textContent→\\Glyphs.utf8.refresh \\this.textContent'>Respawn</option>
                            </select>
                        </div>`,
                },
                {
                    html: `<div opt>
                            <div tr-id='ram-alarms:high'>When above <span unit='GB'><input disabled id='ram_high' type='number' value='2'></span> — HIGH</div>
                            <select id='ram_onhigh'>
                                <option value='ignore' tr-id set='textContent→\\Glyphs.utf8.ignore \\this.textContent'>Ignore</option>
                                <option value='notify' tr-id set='textContent→\\Glyphs.utf8.notify \\this.textContent'>Notify</option>
                                <option value='respawn' tr-id set='textContent→\\Glyphs.utf8.refresh \\this.textContent'>Respawn</option>
                            </select>
                        </div>`,
                },
                {
                    html: `<div opt>
                            <div tr-id='ram-alarms:high'>Scale RAM usage with tab age</div>
                            <div class='toggle'>
                                <input id='ram_timescale' type='checkbox'>
                                <label for='ram_timescale'></label>
                            </div>
                        </div>`,
                },
            ],
        },
    ],
    settings: {
        ram_onlow: {
            type: 'custom',
        },
        ram_onmedium: {
            type: 'custom',
        },
        ram_onhigh: {
            type: 'custom',
        },
        ram_timescale: {
            type: 'custom',
        },
        ram_low: {
            type: 'custom',
            store: false,
        },
        ram_medium: {
            type: 'custom',
            store: false,
        },
        ram_high: {
            type: 'custom',
            store: false,
        },
    },
};
