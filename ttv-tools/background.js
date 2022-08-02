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
let nullish = value => (value === undefined || value === null),
    defined = value => !nullish(value);

// Reloads the tab
    // ReloadTab(tab:object<Tab>, onlineOnly:boolean?) → undefined
function ReloadTab(tab, onlineOnly = true) {
    // Tab is offline, do not reload
    if(onlineOnly && TabIsOffline(tab))
        return;

    Container.tabs.reload(tab.id);
}

// Determines if a tab is offline
    // TabIsOffline(tab:object<Tab>) → boolean
function TabIsOffline(tab) {
    return (false
        || tab.pendingUrl?.length
        || tab.title.endsWith('.twitch.tv')
        || tab.status.toLowerCase() == 'unloaded'
    );
}

let browser, global, window, Storage, Runtime, Manifest, Extension, Container, BrowserNamespace;

if(browser && browser.runtime)
    BrowserNamespace = 'browser';
else if(chrome && chrome.extension)
    BrowserNamespace = 'chrome';

// Can NOT be done programmatically...
Container = chrome;

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
    // ({ reason:string<"install" | "update" | "chrome_update" | "shared_module_update">, previousVersion:string?, id:string? }) → undefined
Runtime.onInstalled.addListener(({ reason, previousVersion, id }) => {
    Container.tabs.query({
        url: ["*://www.twitch.tv/*", "*://player.twitch.tv/*"],
    }, (tabs = []) => {
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
                    ReloadTab(tab);
            } break;
        }

        // Update the badge text when there's an update available
        Container.action.setBadgeText({ text: '' });
    });
});

// Update the tab(s) when they unload
    // `Container.tabs.onUpdated.addListener(...)` does not support pages crashing...
let UnloadedTabs = new Set();

let TabWatcherInterval = setInterval(() => {
    try {
        Container.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs = []) => {
            for(let tab of tabs)
                if(!TabIsOffline(tab))
                    continue;
                else if(!UnloadedTabs.has(tab.id))
                    UnloadedTabs.add(tab.id);
                else
                    ReloadTab(tab);
        });
    } catch(error) {
        // Suppress query errors...
        // console.warn(error);
    }
}, 5000);

// Update the badge text when there's an update available
Container.action.setBadgeBackgroundColor({ color: '#9147ff' });

let REPORTS = new Map;

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
                    Container.action.setBadgeText({ text: '\u2191' });
            } break updater;

            default: continue updater;
        }
    }
});

Runtime.onMessage.addListener((request, sender, respond) => {
    let reloadAll,
        returningData;

    function reloadTabs(all = false) {
        if(!all)
            return;

        Container.tabs.query({
            url: ["*://www.twitch.tv/*", "*://player.twitch.tv/*"],
        }, tabs => {
            if(nullish(tabs))
                return;

            // Reload Twitch pages
            for(let tab of tabs)
                ReloadTab(tab);
        });
    }

    switch(request.action) {
        case 'CLAIM_UP_NEXT': {
            Storage.get(['UP_NEXT_OWNER'], ({ UP_NEXT_OWNER = null }) => {
                let reloadAll = UP_NEXT_OWNER == null;

                Container.tabs.query({
                    url: ["*://www.twitch.tv/*", "*://player.twitch.tv/*"],
                }, (tabs = []) => {
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

                    Storage.set({ UP_NEXT_OWNER });
                });

                reloadTabs(reloadAll);
            });
        } break;

        case 'WAIVE_UP_NEXT': {
            Storage.get(['UP_NEXT_OWNER'], ({ UP_NEXT_OWNER = null }) => {
                let reloadAll = UP_NEXT_OWNER != null;

                Storage.set({ UP_NEXT_OWNER: null });

                reloadTabs(reloadAll);
            });
        } break;

        case 'GET_VERSION': {
            let { version } = Manifest;

            respond({ version });
        } break;

        case 'LOG_RAID_EVENT': {
            let { from, to } = request.data;

            Storage.get(['RaidEvents'], ({ RaidEvents = {} }) => {
                let date = (new Date),
                    week = `${ date.getFullYear() }/${ date.getWeek() }`;

                let events = ((RaidEvents[from] ??= {})[week] ??= []).push(to);

                Storage.set({ RaidEvents });

                respond({ events });
            });
        } break;

        case 'OPEN_OPTIONS_PAGE': {
            Runtime.openOptionsPage();
        } break;

        case 'BEGIN_REPORT': {
            let { tab } = sender;

            REPORTS.set(tab.id, new Date);
        } break;
    }

    reloadTabs(reloadAll);

    return true;
});

let LAG_REPORTER = setInterval(() => {
    for(let [tabID, tabDOB] of REPORTS)
        Container.tabs.get(tabID)
            .then(tab => {
                Container.tabs.sendMessage(tab.id, { action: 'report-back' }, response => {
                    if(response?.ok || tab.discarded || tab.status == "loading")
                        return;

                    Container.tabs.sendMessage(tab.id, { action: 'report-back' }, response => {
                        if(response?.ok)
                            return;

                        let error = `Tab #${ tab.id } did not respond. Discarded`;

                        Container.tabs.duplicate(tab.id);
                        Container.tabs.discard(tab.id);
                        Container.tabs.remove(tab.id);

                        console.warn(error);
                    });
                });
            })
            .catch(error => {
                REPORTS.delete(tabID);
            });
}, 15_000);

// https://stackoverflow.com/a/6117889/4211612
// Returns the current week of the year
    // Date..getWeek() → number<integer>
Date.prototype.getWeek = function getWeek() {
    let now = new Date(Date.UTC(
        this.getFullYear(),
        this.getMonth(),
        this.getDate()
    ));

    let day = now.getUTCDay() || 7;

    now.setUTCDate(now.getUTCDate() + 4 - day);

    let year = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

    return Math.ceil((((now - year) / 86_400_000) + 1) / 7);
};
