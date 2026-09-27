/*** /settings/sections/data-usage.js
 * Settings for "Data Usage" (About TTV Tools).
 */

export default {
    title: "Data Usage",
    tr: 'data-usage--browser-storage',
    glyph: 'poll',
    flags: ['small'],
    keywords: 'data,dossier,evidence,goods,info,input,knowledge,management,picture,statistics,testimony,usage',
    rows: [
        {
            tr: false,
            text: "",
        },
        {
            html: `<table id='data-usage--browser-storage-itemized'>
                        <thead>
                            <tr>
                                <th colspan='999'><button id='data-usage--browser-storage-range' data-zoomed='false' visible style='margin:0;width:100%'></button></th>
                            </tr>
                        </thead>
                    </table>`,
        },
        {
            tr: false,
            text: "",
        },
    ],
    settings: {},
};
