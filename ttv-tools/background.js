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

    Container.tabs.sendMessage(id, { action: 'reload' }, response => {
        Container.tabs.reload(tab.id);
    });
}

// Removes the tab
    // RemoveTab(tab:object<Tab>, duplicateTab:boolean?) → undefined
function RemoveTab(tab, duplicateTab = false) {
    // Duplicate tab
    duplication: if(duplicateTab) {
        // Using `.duplicate` carries the frozen status to the new tab...

        let created = RemoveTab.duplicatedTabs.get(tab.url);

        if(defined(created) && +(new Date) - created < 5_000)
            break duplication;

        console.warn(`Duplicating tab #${ tab.id }... ${ tab.url }`);
        Container.tabs.create({ url: tab.url, windowId: tab.windowId });

        RemoveTab.duplicatedTabs.set(tab.url, +new Date);
    }

    console.warn(`Removing tab #${ tab.id }...`);
    Container.tabs.remove(tab.id);
}

Object.defineProperties(RemoveTab, {
    duplicatedTabs: { value: new Map },
});

// Determines if a tab is offline
    // TabIsOffline(tab:object<Tab>) → boolean
function TabIsOffline(tab) {
    return (false
        || tab.pendingUrl?.length
        || tab.title.endsWith('.twitch.tv')
        || tab.status == UNLOADED
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
                    RemoveTab(tab, true);
            } break;
        }

        // Update the badge text when there's an update available
        Container.action.setBadgeText({ text: '' });
    });
});

// Update the tab(s) when they unload
    // `Container.tabs.onUpdated.addListener(...)` does not support pages crashing...
let OfflineTabs = new Set();

let TabWatcherInterval = setInterval(() => {
    try {
        Container.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs = []) => {
            for(let tab of tabs)
                if(!TabIsOffline(tab))
                    continue;
                else if(!OfflineTabs.has(tab.id))
                    OfflineTabs.add(tab.id);
                else
                    ReloadTab(tab, tab.status != UNLOADED);
        });
    } catch(error) {
        // Suppress query errors...
        // console.warn(error);
    }
}, 2500);

// Update the badge text when there's an update available
Container.action.setBadgeBackgroundColor({ color: '#9147ff' });

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
    let reloadAll = false,
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
                reloadAll ||= UP_NEXT_OWNER == null;

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
            });
        } break;

        case 'WAIVE_UP_NEXT': {
            Storage.get(['UP_NEXT_OWNER'], ({ UP_NEXT_OWNER = null }) => {
                reloadAll ||= UP_NEXT_OWNER != null;

                Storage.set({ UP_NEXT_OWNER: null });
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

            REPORTS.set(tab.id, +new Date);
        } break;
    }

    reloadTabs(reloadAll);

    return true;
});

let REPORTS = new Map,
    GALLOWS = new Map,
    HANG_UP_CHECKER = new Map,
    MAX_TIME_ALLOWED = 15_000;

let { COMPLETE, LOADING, UNLOADED } = Container.tabs.TabStatus;
let LAG_REPORTER = setInterval(() => {
    for(let [ID, createdAt] of REPORTS) {
        HANG_UP_CHECKER.set(ID,
            setTimeout((id = ID) => {
                Container.tabs.get(id)
                    .then(tab => {
                        console.warn(`Tab "${ tab.title }" (#${ tab.id }) timed out. Removing...`);

                        GALLOWS.set(tab.id, +new Date);
                        REPORTS.delete(tab.id);
                        RemoveTab(tab, true);
                    });
            }, MAX_TIME_ALLOWED - 100)
        );

        try {
            if(GALLOWS.has(ID))
                continue;

            Container.tabs.get(ID)
                .then(tab => {
                    let { audible, discarded, id, mutedInfo, status, title } = tab;

                    Container.tabs.sendMessage(id, { action: 'report-back' }, response => {
                        let { ok = false, performance = 1, timestamp = +new Date - MAX_TIME_ALLOWED } = (response ?? {});

                        if(false
                            || ((+new Date - timestamp) > MAX_TIME_ALLOWED)
                            || (performance > 0.95)
                            || (!audible && !mutedInfo.muted)
                        ) {
                            /* Continue... */
                        } else if(ok || discarded || status == LOADING) {
                            clearTimeout(HANG_UP_CHECKER.get(id));

                            return REPORTS.set(id, +new Date);
                        }

                        console.warn(`Tab "${ title }" (#${ id }) did not respond. Contacting again... Response Time → ${ (+new Date - timestamp) }ms · Memory Usage → ${ (100 * performance).toFixed(2).replace('.00', '') }% · Bad Audio → ${ (!audible && !mutedInfo.muted) } { Audible=${ audible }; Muted=${ mutedInfo.muted } }`);

                        Container.tabs.sendMessage(id, { action: 'report-back' }, response => {
                            let { ok = false, performance = 1, timestamp = +new Date - MAX_TIME_ALLOWED } = (response ?? {});

                            if(false
                                || ((+new Date - timestamp) > MAX_TIME_ALLOWED * 1.5)
                                || (performance > 0.99)
                            ) {
                                /* Continue... */
                            } else if(ok || discarded || status == LOADING) {
                                clearTimeout(HANG_UP_CHECKER.get(id));

                                return REPORTS.set(id, +new Date);
                            }

                            console.warn(`Tab "${ title }" (#${ id }) did not respond. Removing... Response Time → ${ (+new Date - timestamp) }ms · Memory Usage → ${ (100 * performance).toFixed(2).replace('.00', '') }%`);

                            clearTimeout(HANG_UP_CHECKER.get(id));
                            REPORTS.delete(id);
                            RemoveTab(tab, true);
                        });
                    });
                })
                .catch(error => REPORTS.delete(ID));
        } catch(error) {
            // console.warn(error);
            REPORTS.delete(ID);
            GALLOWS.delete(ID);
        }
    }
}, MAX_TIME_ALLOWED);

let GALLOWS_CHECKER = setInterval(() => {
    for(let [ID, updated] of GALLOWS) {
        Container.tabs.sendMessage(ID, { action: 'close' }, response => {
            if(!response?.ok)
                Container.tabs.remove(ID);

            GALLOWS.set(ID, +new Date);
        });

        // More than 1.5s have passed since the last successful update...
        if((+new Date - updated) > 1_500) {
            REPORTS.delete(ID);
            GALLOWS.delete(ID);
        }
    }
}, 500);

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

// Get rid of the errors...
if(Runtime.lastError)
    console.warn(Runtime.lastError);

/*** @wOxxOm - https://stackoverflow.com/a/66618269/4211612
 *      _  __                          _ _
 *     | |/ /                    /\   | (_)
 *     | ' / ___  ___ _ __      /  \  | |___   _____
 *     |  < / _ \/ _ \ '_ \    / /\ \ | | \ \ / / _ \
 *     | . \  __/  __/ |_) |  / ____ \| | |\ V /  __/
 *     |_|\_\___|\___| .__/  /_/    \_\_|_| \_/ \___|
 *                   | |
 *                   |_|
 */
Runtime.onConnect.addListener(port => {
    // Keep Alive
    if(port.name == 'PING')
        port.onMessage.addListener(ping => port.postMessage('PONG'));
});
