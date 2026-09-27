/*** /settings/sections/version.js
 * Settings for "Version" (About TTV Tools).
 */

export default {
    title: "Version",
    tr: 'version',
    glyph: 'extensions',
    flags: ['small'],
    keywords: 'adaptation,advice,clue,data,form,history,information,instruction,intelligence,interpretation,knowledge,material,message,rendition,report,science,story,tale,tip,translation,variant,version,word',
    rows: [
        {
            html: "<a type='button' set='subtitle=version.installed'><span small glyph='extensions'></span> Installed</a>",
        },
        {
            html: "<a type='button' set='subtitle=version.github;from-github=origin.github' href='https://github.com/ephellon/twitch-tools' github><span small glyph='github'></span> GitHub </a>",
        },
        {
            html: "<a type='button' set='subtitle=version.chrome;from-chrome=origin.chrome' href='https://chrome.google.com/webstore/detail/twitch-tools/fcfodihfdbiiogppbnhabkigcdhkhdjd' chrome><span small glyph='chrome'></span> Chrome Web Store </a>",
        },
    ],
    settings: {},
};
