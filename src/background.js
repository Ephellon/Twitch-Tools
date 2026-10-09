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

/** @file Describes all background functionality for the extension.
 * <style>[pill]{font-weight:bold;white-space:nowrap;border-radius:1rem;padding:.25rem .75rem}[good]{background:#e8f0fe;color:#174ea6}[bad]{background:#fce8e6;color:#9f0e0e;}</style>
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

/** @typedef {object} enum
 * <dt class=details><blockquote class=tag-source>
 * An "enum" (short for "enumerated type") is a data type that consists of a set of named values.
 * It is used to represent a set of distinct, named values in a program, making it easier to read, maintain, and avoid bugs.
 * For example, in a program that tracks the days of the week, an enum could be used to represent the days of the week instead of using raw integers or strings.
 * </blockquote></dt>
 *
 * @see https://computersciencewiki.org/index.php/Enum
 * @example
 * enum DayOfWeek {
 *     Monday,
 *     Tuesday,
 *     Wednesday,
 *     Thursday,
 *     Friday,
 *     Saturday,
 *     Sunday,
 * }
 */

/** @typedef {object} MutedInfo
  * Find more information at "{@link https://developer.chrome.com/docs/extensions/reference/tabs/#type-MutedInfo MutedInfo}"
  * @property {string} [extensionId] - The ID of the extension that changed the muted state. Not set if an extension was not the reason the muted state last changed.
  * @property {boolean} muted - Whether the tab is muted (prevented from playing sound). The tab may be muted even if it has not played or is not currently playing sound. Equivalent to whether the 'muted' audio indicator is showing.
  * @property {MutedInfoReason} [reason] - The reason the tab was muted or unmuted. Not set if the tab's mute state has never been changed.
  */

/** @typedef {enum} MutedInfoReason
  * Find more information at "{@link https://developer.chrome.com/docs/extensions/reference/tabs/#type-MutedInfoReason MutedInfoReason}"
  * @property {string} user - A user input action set the muted state.
  * @property {string} capture - Tab capture was started, forcing a muted state change.
  * @property {string} extension - An extension, identified by the extensionId field, set the muted state.
  */

/** @typedef {object} Tab
  * Find more information at "{@link https://developer.chrome.com/docs/extensions/reference/tabs/#type-Tab Tab}"
  * @property {boolean} active - Whether the tab is active in its window. Does not necessarily mean the window is focused.
  * @property {boolean} [audible] - Whether the tab has produced sound over the past couple of seconds (but it might not be heard if also muted). Equivalent to whether the 'speaker audio' indicator is showing. <span good pill>Chrome 45+</span>
  * @property {boolean} autoDiscardable - Whether the tab can be discarded automatically by the browser when resources are low. <span good pill>Chrome 54+</span>
  * @property {boolean} discarded - Whether the tab is discarded. A discarded tab is one whose content has been unloaded from memory, but is still visible in the tab strip. Its content is reloaded the next time it is activated. <span good pill>Chrome 54+</span>
  * @property {string} [favIconUrl] - The URL of the tab's favicon. This property is only present if the extension's manifest includes the "tabs" permission. It may also be an empty string if the tab is loading.
  * @property {number} groupId - The ID of the group that the tab belongs to. <span good pill>Chrome 88+</span>
  * @property {number} [height] - The height of the tab in pixels.
  * @property {boolean} highlighted - Whether the tab is highlighted.
  * @property {number} [id] - The ID of the tab. Tab IDs are unique within a browser session. Under some circumstances a tab may not be assigned an ID; for example, when querying foreign tabs using the sessions API, in which case a session ID may be present. Tab ID can also be set to <b><code>chrome.tabs.TAB_ID_NONE</code></b> for apps and devtools windows.
  * @property {boolean} incognito - Whether the tab is in an incognito window.
  * @property {number} index - The zero-based index of the tab within its window.
  * @property {MutedInfo} [mutedInfo] - The tab's muted state and the reason for the last state change. <span good pill>Chrome 46+</span>
  * @property {number} [openerTabId] - The ID of the tab that opened this tab, if any. This property is only present if the opener tab still exists.
  * @property {string} [pendingUrl] - The URL the tab is navigating to, before it has committed. This property is only present if the extension's manifest includes the "tabs" permission and there is a pending navigation. <span good pill>Chrome 79+</span>
  * @property {boolean} pinned - Whether the tab is pinned.
  * @property {boolean} selected - Please use <b><code>tabs.Tab.highlighted</code></b>. <span bad pill>Deprecated</span>
  * @property {string} [sessionId] - The session ID used to uniquely identify a tab obtained from the sessions API.
  * @property {TabStatus} [status] - The tab's loading status.
  * @property {string} [title] - The title of the tab. This property is only present if the extension's manifest includes the "tabs" permission.
  * @property {string} [url] - The last committed URL of the main frame of the tab. This property is only present if the extension's manifest includes the "tabs" permission and may be an empty string if the tab has not yet committed. See also <b><code>Tab.pendingUrl</code></b>.
  * @property {number} [width] - The width of the tab in pixels.
  * @property {number} windowId - The ID of the window that contains the tab.
  */

/** @typedef {enum} TabStatus
  * Find more information at "{@link https://developer.chrome.com/docs/extensions/reference/tabs/#type-TabStatus TabStatus}"
  * @property {string} unloaded The tab has been unloaded (released from memory)
  * @property {string} loading The tab is currently loading content
  * @property {string} complete The tab has finished loading content
  */

/** @typedef {enum} WindowType
  * Find more information at "{@link https://developer.chrome.com/docs/extensions/reference/tabs/#type-WindowType WindowType}"
  * @property {string} normal The window is a normal window
  * @property {string} popup The window is a popup
  * @property {string} panel The window is a panel
  * @property {string} app The window is an instance of a {@link https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps Progressive Web App}
  * @property {string} devtools The window is a Devtool instance (console)
  */

/** @typedef {object} ZoomSettings
  * Find more information at "{@link https://developer.chrome.com/docs/extensions/reference/tabs/#type-ZoomSettings ZoomSettings}"
  * @property {number} [defaultZoomFactor] - Used to return the default zoom level for the current tab in calls to <b><code>tabs.getZoomSettings</code></b>. <span good pill>Chrome 43+</span>
  * @property {ZoomSettingsMode} [mode] - Defines how zoom changes are handled, i.e., which entity is responsible for the actual scaling of the page; defaults to automatic.
  * @property {ZoomSettingsScope} [scope] - Defines whether zoom changes persist for the page's origin, or only take effect in this tab; defaults to per-origin when in automatic mode, and per-tab otherwise.
  */

/** @typedef {enum} ZoomSettingsMode
  * Find more information at "{@link https://developer.chrome.com/docs/extensions/reference/tabs/#type-ZoomSettingsMode ZoomSettingsMode}"
  * @property {string} automatic - Zoom changes are handled automatically by the browser.
  * @property {string} manual - Overrides the automatic handling of zoom changes. The onZoomChange event will still be dispatched, and it is the extension's responsibility to listen for this event and manually scale the page. This mode does not support per-origin zooming, and thus ignores the scope zoom setting and assumes per-tab.
  * @property {string} disabled - Disables all zooming in the tab. The tab reverts to the default zoom level, and all attempted zoom changes are ignored.
  */

/** @typedef {enum} ZoomSettingsScope
  * Find more information at "{@link https://developer.chrome.com/docs/extensions/reference/tabs/#type-ZoomSettingsScope ZoomSettingsScope}"
  * @property {string} per-origin - Zoom changes persist in the zoomed page's origin, i.e., all other tabs navigated to that same origin are zoomed as well. Moreover, per-origin zoom changes are saved with the origin, meaning that when navigating to other pages in the same origin, they are all zoomed to the same zoom factor. The per-origin scope is only available in the automatic mode.
  * @property {string} per-tab - Zoom changes only take effect in this tab, and zoom changes in other tabs do not affect the zooming of this tab. Also, per-tab zoom changes are reset on navigation; navigating a tab always loads pages with their per-origin zoom factors.
  */

;

/**
 * Queries the DOM for elements matching a selector.
 * @param {string} selector - The CSS selector to search for
 * @param {boolean} [multiple=false] - Whether to return all matches as an array or just the first match
 * @param {Document|Element} [container=document] - The element to search within
 * @returns {Element|Element[]} The matching element or an array of matching elements
 */
const $ = (selector, multiple = false, container = document) => multiple ? [...container.querySelectorAll(selector)] : container.querySelector(selector);
/**
 * Checks if a value is null or undefined.
 * @param {*} value - The value to check
 * @returns {boolean} True if the value is nullish
 */
const nullish = value => (value === void null || value === null);
/**
 * Checks if a value is not null or undefined.
 * @param {*} value - The value to check
 * @returns {boolean} True if the value is defined
 */
const defined = value => !nullish(value);

/** @protected
 * @prop {array<string>} RESERVED_TWITCH_PATHNAMES      A list of Twitch-reserved pathnames (forbidden usernames).
 * @property {function} RESERVED_TWITCH_PATHNAMES.has   <div class="signature">(value:string<span class="signature-attributes">opt</span>) → boolean</div>
 *                                                      Determines whether the value clashes with a reserved pathname or not.
 */
const RESERVED_TWITCH_PATHNAMES = Object.defineProperties([
    'u',
    'p',
    'activate',
    'bits',
    'bits-checkout',
    'checkout',
    'clips',
    'collections',
    'communities',
    'dashboard',
    'directory',
    'download',
    'downloads?',
    'drops',
    'event',
    'following',
    'friend',
    'friends',
    'inventory',
    'job',
    'jobs',
    'luna',
    'moderator',
    'popout',
    'prime',
    'products',
    'schedule',
    'search',
    'settings',
    'store',
    'subs',
    'subscription',
    'subscriptions',
    'team',
    'turbo',
    'user',
    'video',
    'videos',
    'wallet',
    'watchparty'
], {
    has: { value(value) { return !!~this.indexOf(value?.toLowerCase()) } },
});

const SHARED_DATA = new Map;

// The only keys content scripts share (tools.js); every one is a string. Readers copy them onto `window`
// (clips.js, player.js), so nothing else may get in
const SHARED_DATA_KEYS = ['USERNAME', 'THEME', 'ANTITHEME', 'ACTIVITY'];

/**
 * Reloads the specified tab.
 * @simply ReloadTab(tab:object<Tab>, onlineOnly:boolean?, forced:boolean?) → undefined
 *
 * @param  {Tab} tab                      The tab to be removed
 * @param  {boolean} [onlineOnly = true]  Only reloads the tab if it has a working internet connection
 * @param  {boolean} [forced = false]     Force the tab to reload
 */
function ReloadTab(tab, onlineOnly = true, forced = false) {
    if(tab.status == UNLOADED)
        console.warn(`[RELOAD] The tab #${ tab.id } was unloaded`);

    if(!MayRespawn(tab))
        return console.warn(`[RELOAD] Skipping tab #${ tab.id }: still loading, or reloaded less than ${ RESPAWN_COOLDOWN / 1000 }s ago`);

    // Tab is offline, do not reload
    if(onlineOnly && TabIsOffline(tab))
        return;

    console.warn(`Reloading tab #${ tab.id }... [forced=${ forced }] ${ tab.url }`);

    try {
        Container.tabs.sendMessage(tab.id, { action: 'reload', forced }, response => {
            // Only reload if not forced to already...
            if(response?.ok && !forced)
                Container.tabs.reload(tab.id);
        });

        if(forced) {
            setTimeout(() => Container.tabs.reload(tab.id), 100)

            // REPORTS.set(tab.id, +new Date);
            // GALLOWS.set(tab.id, +new Date);
        }
    } catch(error) {
        console.warn(`Failed to reload tab: ${ error }`);
    }
}

/**
 * Removes the specified tab.
 * @simply RemoveTab(tab:object<Tab>, duplicateTab:boolean?, forced:boolean?) → undefined
 *
 * @param  {Tab} tab                            The tab to be removed
 * @param  {boolean} [duplicateTab = false]     Should the tab be duplicated after removal?
 * @param  {boolean} [forced = true]            Force the tab to close
 *
 * @property {Map} duplicatedTabs               A map (<code>[key:string~URL, value:number~Date]</code>) of duplicated tabs
 */
function RemoveTab(tab, duplicateTab = false, forced = true) {
    if(tab.status == UNLOADED)
        console.warn(`[REMOVE] The tab #${ tab.id } was unloaded`);

    // Leave the tab alone rather than close it without a replacement
    if(duplicateTab && !MayRespawn(tab))
        return console.warn(`[REMOVE] Skipping tab #${ tab.id }: still loading, or respawned less than ${ RESPAWN_COOLDOWN / 1000 }s ago`);

    // Duplicate tab
    duplication: if(duplicateTab) {
        // Using `.duplicate` carries the frozen status to the new tab...

        const created = RemoveTab.duplicatedTabs.get(tab.url);

        // The tab was just duplicated (<15s ago)
        if(defined(created) && +(new Date) - created < 15e3)
            break duplication;

        console.warn(`Duplicating tab #${ tab.id }... [forced=${ forced }] ${ tab.url }`);

        Container.tabs.create({ active: tab.active, index: tab.index, url: tab.url, windowId: tab.windowId }, _ => {
            if(tab.groupId > -1)
                Container.tabs.group({ groupId: tab.groupId, tabIds: [_.id] });

            // The new tab replaces this one: Up Next stays with it, instead of going to whichever tab claims first (#68)
            Storage.get(['UP_NEXT_OWNER'], ({ UP_NEXT_OWNER = null }) => {
                if(UP_NEXT_OWNER == tab.id)
                    Storage.set({ UP_NEXT_OWNER: _.id });
            });
        });

        RemoveTab.duplicatedTabs.set(tab.url, +new Date);
    }

    console.warn(`Removing tab #${ tab.id }... [forced=${ forced }] ${ tab.url }`);

    try {
        Container.tabs.sendMessage(tab.id, { action: 'close', forced }, response => {
            // Only remove if not forced to already...
            if(response?.ok && !forced)
                Container.tabs.remove(tab.id);
        });

        if(forced)
            setTimeout(() => Container.tabs.remove(tab.id), 100);
    } catch(error) {
        console.warn(`Failed to close tab: ${ error }`);
    }
}

Object.defineProperties(RemoveTab, {
    duplicatedTabs: { value: new Map },
});

// Reloads and respawns, by tab ID and by URL. A tab that is still loading, or was handled recently, is
// left alone so a slow or overloaded machine doesn't spiral into reload loops (#18, #43)
const RECENT_RESPAWNS = new Map;
const RESPAWN_COOLDOWN = 120_000;

/**
 * Records a reload/respawn of the tab, unless one is still pending or happened within the cool-down.
 * @simply MayRespawn(tab:object<Tab>) → boolean
 *
 * @param  {Tab} tab    The tab about to be reloaded or respawned
 * @return {boolean}    Whether to go ahead
 */
function MayRespawn(tab) {
    const now = +new Date;

    for(const [key, when] of RECENT_RESPAWNS)
        if(now - when >= RESPAWN_COOLDOWN)
            RECENT_RESPAWNS.delete(key);

    if(tab.status == 'loading' || RECENT_RESPAWNS.has(tab.id) || RECENT_RESPAWNS.has(tab.url))
        return false;

    RECENT_RESPAWNS.set(tab.id, now).set(tab.url, now);

    return true;
}

/**
 * Determines the status of the tab's online connectivity.
 * @simply TabIsOffline(tab:object<Tab>) → boolean
 *
 * @param  {Tab} tab    The tab to test
 * @return {boolean}
 */
function TabIsOffline(tab) {
    return (false
        || tab.pendingUrl?.length
        || tab.url?.endsWith('.twitch.tv')
        || tab.status == UNLOADED
    );
}

let global, window, Storage, Runtime, Manifest, Extension, Container, BrowserNamespace, Alarms;

if(globalThis.chrome && globalThis.chrome.runtime)
    BrowserNamespace = 'chrome';
else if(globalThis.browser && globalThis.browser.runtime)
    BrowserNamespace = 'browser';

// Can NOT be done programmatically?
Container = globalThis[BrowserNamespace];

switch(BrowserNamespace) {
    case 'browser': {
        Runtime = Container.runtime;
        Storage = Container.storage;
        Extension = Container.extension;
        Manifest = Runtime.getManifest();
        Alarms = Container.alarms;

        const _storage = {};

        Storage.sync.get().then(_sync => {
            Object.assign(_storage, _sync);

            (Storage?.local ?? Storage).get().then(_local => {
                Object.assign(_storage, _local);

                (Storage?.local ?? Storage).set(_storage);
            });
        });

        Storage = Storage.local ?? Storage.sync;
    } break;

    case 'chrome':
    default: {
        Runtime = Container.runtime;
        Storage = Container.storage;
        Extension = Container.extension;
        Manifest = Runtime.getManifest();
        Alarms = Container.alarms;

        const _storage = {};

        Storage.sync.get().then(_sync => {
            Object.assign(_storage, _sync);

            (Storage?.local ?? Storage).get().then(_local => {
                Object.assign(_storage, _local);

                (Storage?.local ?? Storage).set(_storage);
            });
        });

        Storage = Storage.local ?? Storage.sync;
    } break;
}

const { COMPLETE, LOADING, UNLOADED } = Container.tabs.TabStatus;

const {
    /** @protected
     * @prop {string} CHROME_UPDATE
     * Specifies the install-event reason as <i>a Chrome update</i>.
     */
    CHROME_UPDATE,

    /** @protected
     * @prop {string} INSTALL
     * Specifies the install-event reason as <i>an installation</i>.
     */
    INSTALL,

    /** @protected
     * @prop {string} SHARED_MODULE_UPDATE
     * Specifies the install-event reason as <i>an update to a shared module</i>.
     */
    SHARED_MODULE_UPDATE,

    /** @protected
     * @prop {string} UPDATE
     * Specifies the install-event reason as <i>an extension update</i>.
     */
    UPDATE,
} = Runtime.OnInstalledReason;

// Update the tab(s) when a new version is installed
    // ({ reason:string<"install" | "update" | "chrome_update" | "shared_module_update">, previousVersion:string?, id:string? }) → undefined
Runtime.onInstalled.addListener(({ reason, previousVersion, id }) => {
    Container.tabs.query({
        url: ['*://www.twitch.tv/*', '*://player.twitch.tv/*', '*://clips.twitch.tv/*'],
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
                    const [version, build] = (buildVersion ?? '').split('#');

                    Storage.set({ buildVersion: `${ Manifest.version }#${ (Manifest.version == version ? (build | 0) + 1 : 0) }` });
                });

                // Most settings will reload Twitch pages when needed
                for(const tab of tabs)
                    RemoveTab(tab, true);
            } break;
        }

        // Update the badge text when there's an update available
        Container.action.setBadgeText({ text: "" });

        // Memory Management
        Alarms.create('ttvMemoryAudit', { periodInMinutes: 5 });

        Storage.get(['ram_onhigh', 'ram_onmedium', 'ram_onlow', 'ram_timescale'], ({ ram_onhigh, ram_onmedium, ram_onlow, ram_timescale }) => {
            if(!ram_onhigh && !ram_onmedium && !ram_onlow)
                Storage.set({
                    // ignore | notify | respawn
                    ram_onlow: 'ignore',    // ≥500MB
                    ram_onmedium: 'ignore', // ≥1GB
                    ram_onhigh: 'ignore',   // ≥2GB
                    ram_timescale: false,   // Scale with tab age
                });
        });
    });
});

// A prerendered, discarded or restored tab comes back under a new ID: Up Next ownership follows it (#54)
Container.tabs.onReplaced?.addListener((addedTabId, removedTabId) => {
    Storage.get(['UP_NEXT_OWNER'], ({ UP_NEXT_OWNER = null }) => {
        if(UP_NEXT_OWNER == removedTabId)
            Storage.set({ UP_NEXT_OWNER: addedTabId });
    });
});

// After a browser restart, Edge/Chrome restore background tabs unloaded (no content script), so Up Next, Stay Live
// and Next Channel never resume until the viewer clicks the tab. Load the Up Next owner's tab (matched by channel
// name: restored tabs get new ids), or the first Twitch tab if there's no owner
Container.runtime.onStartup?.addListener(() => {
    Storage.get(['UP_NEXT_OWNER_NAME'], ({ UP_NEXT_OWNER_NAME = null }) => {
        Container.tabs.query({ url: '*://*.twitch.tv/*' }, (tabs = []) => {
            const channelOf = url => { try { return new URL(url).pathname.slice(1).split('/').shift().toLowerCase().trim() } catch(error) { return '' } };
            const asleep = tab => tab.discarded || tab.status == 'unloaded';
            const owner = tabs.find(tab => UP_NEXT_OWNER_NAME && channelOf(tab.url) == UP_NEXT_OWNER_NAME)
                , tab = owner ?? tabs[0];

            if(owner)
                Storage.set({ UP_NEXT_OWNER: owner.id });

            if(tab && asleep(tab))
                Container.tabs.reload(tab.id);
        });
    });
});

// Update the tab(s) when they unload
    // `Container.tabs.onUpdated.addListener(...)` does not support pages crashing...
const OfflineTabs = new Set();

// https://developer.mozilla.org/en-US/docs/Web/API/Compute_Pressure_API
/**
 * Monitors system pressure records and reloads or manages Twitch tabs to reduce resource usage.
 * @param {Array|null} records - System pressure state records
 */
function TabWatcher(records) {
    if(records?.length > 0)
        try {
            const lastRecord = records.at(-1);

            if(lastRecord.state == 'critical') {
                // The system is experiencing extremely high usage and should be put into some sort of rest-mode
                Container.tabs.query({ url: '*://*.twitch.tv/*' }, (tabs = []) => {
                    for(const tab of tabs)
                        ReloadTab(tab, tab.status != UNLOADED, true);
                })
            } else if(lastRecord.state == 'serious') {
                // The system's usage rate is in an elevated state and it may begin throttling processes
                Container.tabs.query({ url: '*://*.twitch.tv/*' }, (tabs = []) => {
                    for(const tab of tabs)
                        if(!TabIsOffline(tab))
                            continue;
                        else if(!OfflineTabs.has(tab.id))
                            OfflineTabs.add(tab.id);
                        else
                            ReloadTab(tab, tab.status != UNLOADED, true);
                })
            } else if(lastRecord.state == 'fair' || lastRecord.state == 'nominal') {
                // Everything is fine, and the system can take on more work
            }
        } catch(error) {
            // Suppress query errors...
            console.warn(`Failed to complete "(Pressured) Tab Watcher Interval": ${ error }`);
        }
    else
        try {
            Container.tabs.query({ url: '*://*.twitch.tv/*' }, (tabs = []) => {
                for(const tab of tabs)
                    if(!TabIsOffline(tab))
                        continue;
                    else if(!OfflineTabs.has(tab.id))
                        OfflineTabs.add(tab.id);
                    else
                        ReloadTab(tab, tab.status != UNLOADED, true);
            });
        } catch(error) {
            // Suppress query errors...
            console.warn(`Failed to complete "Tab Watcher Interval": ${ error }`);
        }
}

// Update the badge text when there's an update available
Container.action.setBadgeBackgroundColor({ color: '#9147ff' });

// Use this to set the badge text when there's an update available
    // if installed from Chrome, update the badge text, and wait for an auto-update
    // if installed from GitHub, update the badge text
Storage.onChanged.addListener(changes => {
    const installedFromWebstore = (Runtime.id === 'fcfodihfdbiiogppbnhabkigcdhkhdjd');

    updater:
    for(const key in changes) {
        const change = changes[key]
            , { oldValue, newValue } = change;

        switch(key) {
            case 'chromeUpdateAvailable':
            case 'githubUpdateAvailable': {
                if(newValue === true)
                    Container.action.setBadgeText({ text: "\u2191" });
                else
                    Container.action.setBadgeText({ text: "" });
            } break updater;

            default: { continue updater }
        }
    }
});

let FOCUSED_TAB = null;

Container.windows.onFocusChanged.addListener(async(windowId) => {
    if(windowId === Container.windows.WINDOW_ID_NONE) {
        FOCUSED_TAB = null
    } else {
        const [tab] = await Container.tabs.query({ active: true, windowId });

        if(tab)
            FOCUSED_TAB = tab.id;
    }
});

// Stuff that may be used globally...
let IGNORE_REPORTS = false;
let TabWatcherInterval;

// Listen for messages from the content page(s)
Runtime.onMessage.addListener((request, sender, respond) => {
    let reloadAll = false
        , returningData;

    /**
     * Reloads open Twitch-related tabs.
     * @param {boolean} [all=false] - Whether to reload all matching tabs
     */
    function reloadTabs(all = false) {
        if(!all)
            return;

        Container.tabs.query({
            url: ['*://www.twitch.tv/*', '*://player.twitch.tv/*', '*://clips.twitch.tv/*'],
        }, tabs => {
            if(nullish(tabs))
                return;

            // Reload Twitch pages
            for(const tab of tabs)
                ReloadTab(tab);
        });
    }

    switch(request.action) {
        case 'STEAL_UP_NEXT': {
            delete request.action;

            Container.tabs.query({
                url: ['*://*.twitch.tv/*'],
            }, (tabs = []) => {
                console.warn(`Consuming Up Next...`, request);
                for(const tab of tabs)
                    Container.tabs.sendMessage(tab.id, { action: 'consume-up-next', ...request });

                respond(request);
            });
        } break;

        case 'CLAIM_UP_NEXT': {
            Storage.get(['UP_NEXT_OWNER', 'UP_NEXT_OWNER_NAME'], ({ UP_NEXT_OWNER = null, UP_NEXT_OWNER_NAME = null }) => {
                reloadAll ||= UP_NEXT_OWNER == null;

                Container.tabs.query({
                    url: ['*://*.twitch.tv/*'],
                }, (tabs = []) => {
                    console.warn(`Claiming Up Next...`, tabs);

                    try {
                        /**
                         * Extracts the primary identifier from a URL's pathname.
                         * @param {string} url - The URL to parse
                         * @returns {string} The first segment of the pathname in lowercase
                         */
                        const getName = url => new URL(url).pathname.slice(1).split('/').shift().toLowerCase().trim();
                        /**
                         * Checks if a URL's hostname contains any of the specified domain strings.
                         * @param {string} url - The URL to check
                         * @param {...string} doms - The domain strings to look for
                         * @returns {boolean} True if any specified domain is found in the host
                         */
                        const hostHas = (url, ...doms) => {
                            for(const dom of doms)
                                if(~new URL(url).host.indexOf(dom))
                                    return true;
                            return false;
                        };

                        let name = null
                            , owner = null
                            , ownerAlive = false;

                        // Does the Tab ID match?
                        checking_tab_id: for(const tab of tabs)
                            if(hostHas(tab.url, 'player.', 'clips.', 'safety.', 'help.', 'blog.', 'dev.', 'api.', 'tmi.') || RESERVED_TWITCH_PATHNAMES.has(getName(tab.url))) {
                                continue checking_tab_id
                            } else if(ownerAlive ||= (tab.id == UP_NEXT_OWNER)) {
                                owner = tab.id;
                                name = getName(tab.url);

                                break checking_tab_id;
                            }

                        // An owner already exists and is active...
                        if(ownerAlive) {
                            UP_NEXT_OWNER = owner;
                            UP_NEXT_OWNER_NAME = name;

                            respond({ owner: owner == sender.tab.id });
                        } else {
                            // Does the streamer name match?
                            checking_streamer_name: for(const tab of tabs)
                                if(RESERVED_TWITCH_PATHNAMES.has(getName(tab.url))) {
                                    continue checking_streamer_name
                                } else if(ownerAlive ||= (getName(tab.url) == UP_NEXT_OWNER_NAME)) {
                                    owner = tab.id;
                                    name = getName(tab.url);

                                    break checking_streamer_name;
                                }

                            if(ownerAlive) {
                                UP_NEXT_OWNER = owner;
                                UP_NEXT_OWNER_NAME = name;

                                respond({ owner: owner == sender.tab.id });
                            } else {
                                // This Tab is the new owner
                                UP_NEXT_OWNER = sender.tab.id;
                                UP_NEXT_OWNER_NAME = getName(sender.tab.url);

                                respond({ owner: true });
                            }
                        }

                        Storage.set({ UP_NEXT_OWNER, UP_NEXT_OWNER_NAME });
                    } catch(error) {
                        console.warn(`Failed to Claim Up Next: ${ error }`);

                        const json = JSON.stringify(tabs);

                        REPORTS.delete(json);
                        GALLOWS.delete(json);
                    }
                });
            });
        } break; // switch request.action | 'CLAIM_UP_NEXT'

        case 'WAIVE_UP_NEXT': {
            Storage.get(['UP_NEXT_OWNER', 'UP_NEXT_OWNER_NAME'], ({ UP_NEXT_OWNER = null, UP_NEXT_OWNER_NAME = null }) => {
                reloadAll ||= UP_NEXT_OWNER != null;

                Storage.set({ UP_NEXT_OWNER: null, UP_NEXT_OWNER_NAME: null });
            });

            respond({ ok: true });
        } break;

        case 'GET_VERSION': {
            const { version } = Manifest;

            respond({ version });
        } break;

        case 'LOG_RAID_EVENT': {
            const { from, to } = request.data;

            Storage.get(['RaidEvents'], ({ RaidEvents = {} }) => {
                const date = (new Date)
                    , week = `${ date.getFullYear() }${ date.getWeek().toString().padStart(2, '00') }`;

                const events = ((RaidEvents[from] ??= {})[week] ??= []).push(to);

                for(const wk in RaidEvents[from])
                    if(parseInt(wk) < parseInt(week) - 4)
                        delete RaidEvents[from][wk];

                Storage.set({ RaidEvents });

                respond({ events });
            });
        } break;

        case 'FETCH_URL': {
            // Cross-origin reads for the content scripts, without a CORS proxy: only for sites the viewer allowed
            // (Settings → Networking → Site Access; `optional_host_permissions` in the manifest)
            const { url, init = {} } = request;
            const origin = (() => { try { return new URL(url).origin } catch(error) { return null } })();

            if(!origin || !/^https:/.test(origin)) {
                respond({ error: 'invalid-url' });
            } else {
                Container.permissions.contains({ origins: [`${ origin }/*`] })
                    .then(allowed => {
                        if(!allowed)
                            return respond({ error: 'not-permitted' });

                        return fetch(url, { method: init.method ?? 'GET', headers: init.headers, body: init.body, credentials: 'omit' })
                            .then(async response => respond({
                                ok: response.ok,
                                status: response.status,
                                statusText: response.statusText,
                                headers: [...response.headers],
                                body: await response.text(),
                            }));
                    })
                    .catch(error => respond({ error: String(error?.message ?? error) }));
            }
        } break;

        case 'OPEN_OPTIONS_PAGE': {
            Runtime.openOptionsPage();

            respond({ ok: true });
        } break;

        case 'BEGIN_REPORT': {
            const { tab } = sender;

            IGNORE_REPORTS = false;

            console.warn(`Beginning report for tab #${ tab.id }`);
            REPORTS.set(tab.id, +new Date);

            try {
                TabWatcherInterval = new PressureObserver(TabWatcher);
                TabWatcherInterval.observe('cpu', {
                    sampleInterval: 10e3,
                });
            } catch(error) {
                TabWatcherInterval = setInterval(TabWatcher, 2500);
            }

            respond({ ok: true });
        } break;

        case 'WAIVE_REPORT': {
            const { tab } = sender;

            IGNORE_REPORTS = true;

            console.warn(`Ignoring reports for tab #${ tab.id }`);

            respond({ ok: true });
        } break;

        case 'FETCH_SHARED_DATA': {
            const sData = {};

            for(const [key, value] of SHARED_DATA)
                sData[key] = value;

            respond(sData);
        } break;

        case 'POST_SHARED_DATA': {
            // Only this extension's own scripts, only known keys, only short strings (PR #59, CWE-20)
            const ok = (sender?.id == Runtime.id && typeof request.data == 'object' && request.data !== null);

            if(ok)
                for(const [key, value] of Object.entries(request.data))
                    if(SHARED_DATA_KEYS.includes(key) && typeof value == 'string')
                        SHARED_DATA.set(key, value.slice(0, 256));

            respond({ ok });
        } break;

        case 'RESPAWN_THIS_TAB': {
            if(!request.meta?.isActive)
                Container.tabs.get(sender.tab.id, tab => {
                    if(tab && !tab.discarded)
                        try {
                            logRamAlarm({ action: 'respawned', url: tab.url, note: (request.meta?.isOkay ? 'you chose Respawn' : 'no answer in time') });
                            RemoveTab(tab, true, true);
                            respond({ success: true });
                        } catch(e) {
                            console.debug(`Failed to self-respawn a tab: ${ tab.id }`, e);
                            respond({ success: false });
                        }
                });
            else
                console.debug(`Ignoring self-respawn, it is active still: ${ sender.tab.id }`), respond({ success: false });
        } break;

        default: {
            if(request.action?.length)
                Container.tabs.query({
                    url: ['*://*.twitch.tv/*'],
                }, (tabs = []) => {
                    const action = request.action.toLowerCase().replace(/_+/g, '-');

                    console.warn(`Sending "${ action }" to all (non-origin) tabs...`, request);

                    for(const tab of tabs)
                        if(tab.id != sender.tab.id)
                            Container.tabs.sendMessage(tab.id, { ...request, action });

                    respond(request);
                });
        } break;
    } // switch request.action

    reloadTabs(reloadAll);

    return true;
});

// Handle and manage dead or dying tabs
const REPORTS = new Map
    , GALLOWS = new Map
    , HANG_UP_CHECKER = new Map
    , MAX_TIME_ALLOWED = 35_000;

const LAG_REPORTER = setInterval(() => {
    if(IGNORE_REPORTS)
        return;

    for(const [ID, createdAt] of REPORTS) {
        HANG_UP_CHECKER.set(ID,
            setTimeout((id = ID) => {
                try {
                    Container.tabs.get(id)
                        .then(tab => {
                            console.warn(`Tab "${ tab.title }" (#${ tab.id }) timed out. Removing...`);

                            GALLOWS.set(tab.id, +new Date);
                            REPORTS.delete(tab.id);
                            RemoveTab(tab, true);
                        }).catch(error => {
                            console.warn(`Tab #${ id } no longer exists... Removing...`);

                            GALLOWS.delete(id);
                            REPORTS.delete(id);
                        });
                } catch(error) {
                    GALLOWS.delete(ID);
                    REPORTS.delete(ID);

                    console.error(error);
                }
            }, MAX_TIME_ALLOWED - 100)
        );

        try {
            if(GALLOWS.has(ID))
                continue;

            Container.tabs.get(ID)
                .then(tab => {
                    const { audible, discarded, id, mutedInfo, status, title } = tab;

                    Container.tabs.sendMessage(id, { action: 'report-back' }, response => {
                        const { ok = false, performance = 1, timestamp = +new Date - MAX_TIME_ALLOWED } = (response ?? {});

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
                            const { ok = false, performance = 1, timestamp = +new Date - MAX_TIME_ALLOWED } = (response ?? {});

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
            console.warn(`The lag reporter has failed: ${ error }`);

            REPORTS.delete(ID);
            GALLOWS.delete(ID);
        }
    }
}, MAX_TIME_ALLOWED);

const GALLOWS_CHECKER = setInterval(() => {
    for(const [ID, updated] of GALLOWS)
        try {
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
        } catch(error) {
            console.warn(`Failed to gallow-check tab #${ ID } → "${ error }"`);

            GALLOWS.delete(ID);
        }
}, 500);

// Handle memory audits (alarms)
Alarms.onAlarm.addListener(({ name }) => {
    if(name === 'ttvMemoryAudit')
        auditMemory();
});

// The tiers the RAM Alarms settings show (500 MB, 1 GB, 2 GB), compared with the page's JavaScript memory: the only
// number a page can read. It used to compare a guessed 400/600/800 MB, so "1 GB: Notify" fired at about 600 MB (#64).
// The browser's Task Manager counts the whole tab (video, images, the browser's own work), so it shows more.
const MEMORY_TIERS = {
    LOW:    500 * 1024 ** 2,
    MEDIUM: 1 * 1024 ** 3,
    HIGH:   2 * 1024 ** 3,
};

// A page this young that's already over its tier will be over it again right after a respawn: respawning it only
// loops (#67), so it gets a notice instead
const RAM_RESPAWN_MIN_AGE = 10 * 60_000;

/**
 * Adds an entry to the RAM Alarms log (shown in Settings), keeping the last day, so the reason for a reload can still
 * be read after the page is gone (#67).
 * @param {Object} entry - What happened: `{ action, url, ramUsed?, tier?, note? }`
 * @returns {Promise<void>}
 */
function logRamAlarm(entry) {
    const time = +new Date;

    // One write at a time: tabs answer the audit together, and parallel writes would drop entries
    return logRamAlarm.queue = (logRamAlarm.queue ?? Promise.resolve())
        .then(async() => {
            const { ramAlarmLog = [] } = await Storage.get(['ramAlarmLog']);

            await Storage.set({
                ramAlarmLog: [...ramAlarmLog.filter(entry => time - entry.time < 86_400_000), { time, ...entry }].slice(-100),
            });
        })
        .catch(error => console.warn(`Failed to log a RAM Alarm: ${ error }`));
}

/**
 * Audits RAM usage of Twitch tabs and triggers notifications or respawns based on configured memory tiers.
 * @returns {Promise<void>}
 */
async function auditMemory() {
    const tabs = await Container.tabs.query({ url: '*://*.twitch.tv/*', discarded: false });
    const memoryAudit = [];

    const { ram_onhigh = 'ignore', ram_onmedium = 'ignore', ram_onlow = 'ignore', ram_timescale = false, ram_low, ram_medium, ram_high } = await Storage.get(['ram_onhigh', 'ram_onmedium', 'ram_onlow', 'ram_timescale', 'ram_low', 'ram_medium', 'ram_high']);
    const ram_ = { ram_onhigh, ram_onmedium, ram_onlow };

    // The viewer's own tiers (#67): LOW in MB, MEDIUM and HIGH in GB; anything unset or invalid keeps the default
    const tierOf = (value, unit, fallback) => (parseFloat(value) > 0 ? parseFloat(value) * unit : fallback);
    const TIERS = {
        LOW:    tierOf(ram_low, 1024 ** 2, MEMORY_TIERS.LOW),
        MEDIUM: tierOf(ram_medium, 1024 ** 3, MEMORY_TIERS.MEDIUM),
        HIGH:   tierOf(ram_high, 1024 ** 3, MEMORY_TIERS.HIGH),
    };

    find_offenders: for(const { id, url, title, active, autoDiscardable, discarded, frozen } of tabs) {
        if(!url.startsWith('http'))
            continue /* Not a Twitch site */;

        if(frozen) {
            memoryAudit.push({
                id,
                title: title || "Twitch Stream",
                url,
                active,
                action: ram_.ram_onhigh ?? 'ignore',
                ramUsed: 0,
                tier: 'high',
                discarded,
                frozen,
            });

            continue;
        }

        try {
            Container.tabs.sendMessage(id, { action: 'heap-audit' }, response => {
                let [ramUsed, liveTime] = response?.results ?? [];

                if(discarded || !ramUsed)
                    return;

                // Scale the heap size with the tab's age
                if(ram_timescale)
                    ramUsed *= 1 + (liveTime / (60 * 60 * 1e3));

                const tier = (
                    ramUsed >= TIERS.HIGH
                        ? 'high'
                        : ramUsed >= TIERS.MEDIUM
                            ? 'medium'
                            : ramUsed >= TIERS.LOW
                                ? 'low'
                                : 'normal'
                );

                let act = ram_[`ram_on${ tier }`] ?? 'ignore';

                const MB = Math.round(ramUsed / 1024 ** 2);

                // Just (re)opened and already over: a respawn won't bring it down, so say so instead of looping (#67)
                if(act === 'respawn' && liveTime < RAM_RESPAWN_MIN_AGE) {
                    act = 'hold';

                    Container.tabs.sendMessage(id, {
                        action: 'notify',
                        message: `<div title="RAM Alarm - Respawn Skipped" okay="OK">This tab's page memory is at <strong style="color:var(--color-red)">${ MB }MB</strong>, but the page is only ${ Math.round(liveTime / 60_000) } min old. Respawning it would not help, so TTV Tools left it alone. If this keeps happening, raise the limit in Settings → RAM Alarms.</div>`,
                    });
                }

                if(['respawn', 'notify', 'hold'].includes(act))
                    logRamAlarm({ action: act, url, ramUsed, tier });

                const onAccept = 'RESPAWN_THIS_TAB'
                    , onIgnore = (true
                        && autoDiscardable
                        && FOCUSED_TAB !== id
                        ? 'RESPAWN_THIS_TAB'
                        : void null
                    );

                // Boomer Tabs — over 30, high resource usage, and inactive
                if(act === 'respawn') {
                    Container.tabs.sendMessage(id, {
                        action: 'notify',
                        message: `<div title="RAM Overage - Respawn Pending" okay="Respawn" deny="Cancel" data-on-okay="${ onAccept }" data-on-time="${ onAccept }">This tab's page memory is at <strong style="color:var(--color-red)">${ MB }MB</strong>. This tab will not be respawned if you are actively using it.</div>`,
                        onAccept, onIgnore,
                    })
                } else if(act === 'notify') {
                    Container.tabs.sendMessage(id, {
                        action: 'notify',
                        message: `<div title="RAM Warning" okay="Respawn" data-on-okay="${ onAccept }">This tab's page memory is at <strong style="color:var(--color-warn)">${ MB }MB</strong>.</div>`,
                        onAccept,
                    })
                }

                memoryAudit.push({
                    id,
                    title: title || "Twitch Stream",
                    url,
                    active,
                    action: act,
                    ramUsed,
                    tier,
                    discarded,
                    frozen,
                });
            });
        } catch(error) {
            console.debug(`Skipping tab during memory audit: ${ id }`, { id, url, title });
        }
    } // :find_offenders

    await Storage.set({ memoryAudit });
}

/**
 * Returns the current week of the year.
 * @simply Date..getWeek() → number<integer>
 *
 * @author StackOverflow {@link https://stackoverflow.com/users/468910/youp-bernoulli @Youp Bernoulli}
 *
 * @see https://stackoverflow.com/a/6117889/4211612
 *
 * @return {number<integer>}
 */
Date.prototype.getWeek = function getWeek() {
    const now = new Date(Date.UTC(
        this.getFullYear(),
        this.getMonth(),
        this.getDate()
    ));

    const day = now.getUTCDay() || 7;

    now.setUTCDate(now.getUTCDate() + 4 - day);

    const year = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

    return Math.ceil((((now - year) / 86_400_000) + 1) / 7);
};

// Get rid of the errors...
if(Runtime.lastError)
    console.warn(`Last error: ${ Runtime.lastError }`);

/***
 *      _  __                          _ _
 *     | |/ /                    /\   | (_)
 *     | ' / ___  ___ _ __      /  \  | |___   _____
 *     |  < / _ \/ _ \ '_ \    / /\ \ | | \ \ / / _ \
 *     | . \  __/  __/ |_) |  / ____ \| | |\ V /  __/
 *     |_|\_\___|\___| .__/  /_/    \_\_|_| \_/ \___|
 *                   | |
 *                   |_|
 */
/** @private
 * @event PING
 * @desc Keeps the background script alive.
 *
 * @author GitHub {@link https://github.io/wOxxOm @wOxxOm}
 *
 * @see https://stackoverflow.com/a/66618269/4211612
 */
Runtime.onConnect.addListener(port => {
    // Keep Alive
    if(port.name == 'PING')
        port.onMessage.addListener(ping => port.postMessage('PONG'));
});
