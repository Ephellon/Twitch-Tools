/*** /settings/sections/export-settings.js
 * Settings for "Export Settings" (Networking).
 */

export default {
    title: "Export Settings",
    tr: 'networking:sync-settings',
    glyph: 'export',
    flags: ['small'],
    badges: {
        new: '5.32',
    },
    keywords: 'cloud,download,dump,export,id,load,log in,network,settings,ship,smuggle,transport,upload',
    summaryAttrs: {
        style: 'width:fit-content',
    },
    rows: [
        {
            text: "To <b attention-text top-tooltip='Save settings from somewhere else to this device'>download settings</b>, enter their <b attention-text top-tooltip='6 or more letters, numbers and/or dashes'>Upload ID</b>.",
        },
        {
            tr: false,
            text: "{{sync-token}}",
        },
        {
            html: "<div id='sync-status' class='subtitle' style='margin-left:0.5rem; transition: all .5s;;'>&nbsp;</div>",
        },
        {
            tr: false,
            text: "",
        },
        {
            html: `<button id='sync-settings--upload' style='margin-right:0.5rem' top-tooltip='Save settings from this device to another device'>
                    <span small glyph='upload'></span>
                    <span tr-id='networking:sync-settings:upload'>Upload</span>
                </button>`,
        },
        {
            html: `<button id='sync-settings--download' top-tooltip='Save settings from somewhere else to this device'>
                    <span small glyph='download'></span>
                    <span tr-id='networking:sync-settings:download'>Download</span>
                </button>`,
        },
        {
            html: `<button id='sync-settings--share' class='edit'>
                    <span small glyph='bolt'></span>
                    <span tr-id='networking:sync-settings:copy'>Copy</span>
                </button>`,
        },
        {
            html: '<hr>',
        },
        {
            html: "<input id='sync-settings--upload-json-input' type='file' accept='.json, application/json' style='display:none!important'>",
        },
        {
            html: `<label id='sync-settings--upload-json-label' for='sync-settings--upload-json-input' type='button' style='margin-right:0.5rem' top-tooltip='Restore settings from a file (JSON)'>
                    <span small glyph='rewind'></span>
                    <span tr-id='networking:sync-settings:upload-json'>Restore file</span>
                    <span small gold glyph='verified'></span>
                </label>`,
        },
        {
            html: `<button id='sync-settings--download-json' top-tooltip='Save settings to a file (JSON)'>
                    <span small glyph='download'></span>
                    <span tr-id='networking:sync-settings:download-json'>Export file</span>
                    <span small gold glyph='verified'></span>
                </button>`,
        },
    ],
    settings: {
        'sync-token': {
            type: 'text',
            default: 'TTV-TOOL',
            placeholder: "ABC123",
            attrs: {
                style: 'width:-webkit-fill-available; width:-moz-available; font-family: monospace; letter-spacing:1em; text-align:center; --text-transform:uppercase; text-overflow:clip',
                pattern: '[\\w\\-]{6,}',
            },
        },
        'sync-settings--upload-json-input': {
            type: 'custom',
            store: false,
        },
    },
};
