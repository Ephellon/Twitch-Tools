/*** /background.js
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

let browser, Storage, Runtime, Manifest, Extension, Container, BrowserNamespace;

if(browser && browser.runtime)
    BrowserNamespace = 'browser';
else if(chrome && chrome.extension)
    BrowserNamespace = 'chrome';

Container = window[BrowserNamespace];

switch(BrowserNamespace) {
    case 'browser': {
        Runtime = Container.runtime;
        Storage = Container.storage;
        Extension = Container.extension;
        Manifest = Runtime.getManifest();

        Storage = Storage.sync ?? Storage.local;
    } break;

    case 'chrome':
    default: {
        Runtime = Container.runtime;
        Storage = Container.storage;
        Extension = Container.extension;
        Manifest = Runtime.getManifest();

        Storage = Storage.sync ?? Storage.local;
    } break;
}

let { CHROME_UPDATE, INSTALL, SHARED_MODULE_UPDATE, UPDATE } = Runtime.OnInstalledReason;

// Update the tab(s) when a new version is installed
// reason:string - install | update | chrome_update | shared_module_update
Runtime.onInstalled.addListener(({ reason, previousVersion, id }) => {
    Container.tabs.query({
        url: ["*://www.twitch.tv/*", "*://player.twitch.tv/*"],
    }, tabs => {
        if(!defined(tabs))
            return;

        Storage.set({ onInstalledReason: reason, chromeUpdateAvailable: false, githubUpdateAvailable: false });

        switch(reason) {
            // Has the extension just been installed?
            // If so, open the settings page
            case INSTALL: {
                Container.tabs.create({ url: `settings.html?installed=${ reason }` });
            } break;

            // Has the extension been updated?
            // If so, but the version hasn't changed, change the build number
            case UPDATE: {
                Storage.get(['buildVersion'], ({ buildVersion }) => {
                    let [version, build] = (buildVersion ?? "").split('#');

                    Storage.set({ buildVersion: `${ Manifest.version }#${ (Manifest.version == version? (build | 0) + 1: 0) }` });
                });

                // Most settings will reload Twitch pages when needed
                for(let tab of tabs)
                    Container.tabs.reload(tab.id);
            } break;

        }

        // Update the badge text when there's an update available
        Container.browserAction.setBadgeText({ text: '' });
    });
});

// Update the tab(s) when they unload
// `Container.tabs.onUpdated.addListener(...)` does not support pages crashing...
let UnloadedTabs = new Set();

let TabWatcherInterval = setInterval(() => {
    try {
        Container.tabs.query({
            url: "*://www.twitch.tv/*",
            status: "unloaded",
        }, tabs => {
            if(!defined(tabs))
                return;

            for(let tab of tabs)
                if(UnloadedTabs.has(tab.id))
                    Container.tabs.reload(tab.id);
                else
                    UnloadedTabs.add(tab.id);
        });
    } catch(error) {
        // Suppress query errors...
        // console.warn(error);
    }
}, 1000);

// Update the badge text when there's an update available
Container.browserAction.setBadgeBackgroundColor({ color: '#9147ff' });

Storage.onChanged.addListener(changes => {
    // Use this to set the badge text when there's an update available
        // if installed from Chrome, update the badge text, and wait for an auto-update
        // if installed from GitHub, update the badge text
    let installedFromWebstore = (Runtime.id === "fcfodihfdbiiogppbnhabkigcdhkhdjd");

    updater:
    for(let key in changes) {
        let change = changes[key],
            { oldValue, newValue } = change;

        switch(key) {
            case 'chromeUpdateAvailable':
            case 'githubUpdateAvailable': {
                if(newValue === true)
                    Container.browserAction.setBadgeText({ text: '\u2191' });
            } break updater;

            default: continue updater;
        }
    }
});

// Set the Up Next owner
let UP_NEXT_OWNER = null;

Runtime.onMessage.addListener((request, sender, respond) => {
    let refresh,
        returningData;

    switch(request.action) {
        case 'CLAIM_UP_NEXT': {
            refresh = UP_NEXT_OWNER == null;

            Container.tabs.query({
                url: ["*://www.twitch.tv/*", "*://player.twitch.tv/*"],
            }, tabs => {
                if(!defined(tabs))
                    return;

                // An owner already exists and is active...
                let owner = null,
                    ownerAlive = false;

                for(let tab of tabs)
                    if(ownerAlive ||= tab.id == UP_NEXT_OWNER)
                        owner ??= tab.id;

                if(ownerAlive) {
                    respond({ owner: owner == sender.tab.id });
                } else {
                    UP_NEXT_OWNER = sender.tab.id;

                    respond({ owner: true });
                }
            });
        } break;

        case 'WAIVE_UP_NEXT': {
            refresh = UP_NEXT_OWNER != null;

            UP_NEXT_OWNER = null;
        } break;
    }

    if(refresh)
        Container.tabs.query({
            url: ["*://www.twitch.tv/*", "*://player.twitch.tv/*"],
        }, tabs => {
            if(!defined(tabs))
                return;

            // Reload Twitch pages
            for(let tab of tabs)
                Container.tabs.reload(tab.id);
        });

    return true;
});
