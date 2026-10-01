/*** /plugins/video-recovery/recover-pages.settings.js
 * Settings for "Recover Pages" (Video Recovery).
 */

export default {
    title: "Recover Pages",
    tr: 'recover-pages',
    glyph: 'extensions',
    flags: ['small'],
    keywords: 'act,archive,array,attack,attempt,bid,certificate,demonstration,diary,display,endeavor,evidence,example,exhibit,experiment,form,pages,paper,parade,presentation,pursuit,record,report,script,shot,struggle,testimony,try,webpage',
    rows: [
        {
            toggle: 'recover_pages',
        },
        {
            text: "If the page doesn't show, try to bring it back.",
        },
    ],
    settings: {
        recover_pages: {
            type: 'checkbox',
            default: false,
        },
    },
};
