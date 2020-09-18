/***
 *      ____             _                                   _   _
 *     |  _ \           | |                                 | | (_)
 *     | |_) | __ _  ___| | ____ _ _ __ ___  _   _ _ __   __| |  _ ___
 *     |  _ < / _` |/ __| |/ / _` | '__/ _ \| | | | '_ \ / _` | | / __|
 *     | |_) | (_| | (__|   < (_| | | | (_) | |_| | | | | (_| |_| \__ \
 *     |____/ \__,_|\___|_|\_\__, |_|  \___/ \__,_|_| |_|\__,_(_) |___/
 *                            __/ |                            _/ |
 *                           |___/                            |__/
 */
let $ = (selector, multiple = false, container = document) => multiple? [...container.querySelectorAll(selector)]: container.querySelector(selector);
let empty = value => (value === undefined || value === null),
    defined = value => !empty(value);

let browser, Storage, Runtime, Extension, Container, BrowserNamespace;

if(browser && browser.runtime)
    BrowserNamespace = 'browser';
else if(chrome && chrome.extension)
    BrowserNamespace = 'chrome';

Container = window[BrowserNamespace];

switch(BrowserNamespace) {
    case 'browser':
        Runtime = Container.runtime;
        Storage = Container.storage;
        Extension = Container.extension;

        Storage = Storage.sync || Storage.local;
        break;

    case 'chrome':
    default:
        Runtime = Container.runtime;
        Storage = Container.storage;
        Extension = Container.extension;

        Storage = Storage.sync || Storage.local;
        break;
}

// reason:string - install | update | chrome_update | shared_module_update
Runtime.onInstalled.addListener(({ reason, previousVersion, id }) => {
    Container.tabs.query({
        url: "*://www.twitch.tv/*",
    }, tabs => {
        if(!defined(tabs))
            return;

        for(let tab of tabs)
            Container.tabs.reload(tab.id);
    });
});
