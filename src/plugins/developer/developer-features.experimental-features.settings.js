/*** /plugins/developer/developer-features.experimental-features.settings.js
 * Settings for "Experimental Features" (Developer Features).
 */

export default {
    title: "Experimental Features",
    tr: '@experimental',
    glyph: 'stats',
    flags: ['small'],
    keywords: 'accident,act,array,casualty,catastrophe,cause,cost,damage,data,debt,defeat,deficit,delay,demonstration,destruction,development,disaster,display,dossier,element,evidence,example,exhibit,expansion,explanation,extension,failure,fall,goods,increase,info,injury,input,knowledge,loss,markdown,matter,motivation,motive,origin,parade,picture,postponement,presentation,principle,purpose,root,source,statistics,testimony,trouble',
    rows: [
        {
            toggle: 'experimental_mode',
        },
        {
            text: "Allow the extension to display, and use experimental features.",
        },
        {
            text: "Some features may cause data loss.",
            attrs: {
                'warning-text': '',
            },
        },
    ],
    settings: {
        experimental_mode: {
            type: 'checkbox',
            default: false,
        },
    },
};
