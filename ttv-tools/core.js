/*** /core.js
 *       _____                 _
 *      / ____|               (_)
 *     | |     ___  _ __ ___   _ ___
 *     | |    / _ \| '__/ _ \ | / __|
 *     | |___| (_) | | |  __/_| \__ \
 *      \_____\___/|_|  \___(_) |___/
 *                           _/ |
 *                          |__/
 */
// The following is required on all pages
// "Security & Sensitives"
// https://stackoverflow.com/a/2117523/4211612
// https://gist.github.com/jed/982883
// Creates a random UUID
    // new UUID() -> Object
    // UUID.from(string:string) -> Object
    // UUID.ergo(string;string) -> Promise#String
    // UUID.BWT(string:string) -> String
    // UUID.prototype.toString() -> String
class UUID {
    static #BWT_SEED = new UUID()

    constructor() {
        let native = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, x => (x ^ top.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> x / 4).toString(16));

        this.native = this.value = native;

        this[Symbol.toPrimitive] = type => {
            switch(type) {
                case 'boolean':
                    return true;

                case 'bigint':
                case 'number':
                    return NaN;

                case 'default':
                case 'string':
                case 'object':
                case 'symbol':
                default:
                    return native;
            }
        };

        return this;
	}

    toString() {
        return this.native;
    }

    /* BWT Sorting Algorithm */
    static BWT(string = '') {
        if(/^[\x32]*$/.test(string))
            return '';

        let _a = `\u0001${ string }`,
            _b = `\u0001${ string }\u0001${ string }`,
            p_ = [];

        for(let i = 0; i < _a.length; i++)
            p_.push(_b.slice(i, _a.length + i));

        p_ = p_.sort();

        return p_.map(P => P.slice(-1)[0]).join('');
    }

    static from(key = '') {
        key = (key ?? '').toString();

        let PRIVATE_KEY = `private-key=${ UUID.#BWT_SEED }`,
            CONTENT_KEY = `content="${ encodeURIComponent(key) }"`,
            PUBLIC_KEY = `public-key=${ Manifest.version }`;

        let hash = Uint8Array.from(btoa([PRIVATE_KEY, CONTENT_KEY, PUBLIC_KEY].map(UUID.BWT).join('<% PUB-BWT-KEY %>')).split('').map(character => character.charCodeAt(0))),
            l = hash.length,
            i = 0;

        hash = hash.map((n, i, a) => a[n & 255] ^ a[n | 170] ^ a[n ^ 85] ^ a[-~n] ^ n + i);

        let native = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, x => (x ^ hash[++i<l?i:i=0] & 15 >> x / 4).toString(16));

        this.native = this.value = native;

        this[Symbol.toPrimitive] = type => {
            switch(type) {
                case 'boolean':
                    return true;

                case 'bigint':
                case 'number':
                    return NaN;

                case 'default':
                case 'string':
                case 'object':
                case 'symbol':
                default:
                    return this.native;
            }
        };

        this.toString = () => this.native;

        return this;
    }

    static async ergo(key = '') {
        key = (key ?? '').toString();

        // Privatize (pre-hash) the message a bit
        let PRIVATE_KEY = `private-key=${ UUID.#BWT_SEED }`,
            CONTENT_KEY = `content="${ encodeURIComponent(key) }"`,
            PUBLIC_KEY = `public-key=${ Manifest.version }`;

        key = btoa([PRIVATE_KEY, CONTENT_KEY, PUBLIC_KEY].map(UUID.BWT).join('<% PUB-BWT-KEY %>'));

        // Digest the message
        // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
        const UTF8String = new TextEncoder().encode(key);                     // encode as (utf-8) Uint8Array
        const hashBuffer = await crypto.subtle.digest('SHA-256', UTF8String); // hash the message
        const hashString =
            [...new Uint8Array(hashBuffer)]                                   // convert buffer to byte array
                .map(B => B.toString(16).padStart(2, '0')).join('')           // convert bytes to hex string
                .replace(/(.{16})(.{8})(.{8})(.{8})/, '$1-$2-$3-$4-');        // format the string into a large UUID string

        return hashString;
    }
}

// The following is just shared logic
function $(selector, multiple = false, container = document) {
    return multiple?
        [...container?.querySelectorAll(selector)]:
    container?.querySelector(selector);
}

Object.defineProperties($, {
    html: {
        value: {
            getElementByText: Element.prototype.getElementByText.bind(document.firstElementChild),
            getElementsByTextContent: Element.prototype.getElementsByTextContent.bind(document.firstElementChild),
        },

        writable: false,
        enumerable: false,
        configurable: false,
    },

    head: {
        value: {
            getElementByText: Element.prototype.getElementByText.bind(document.head),
            getElementsByTextContent: Element.prototype.getElementsByTextContent.bind(document.head),
        },

        writable: false,
        enumerable: false,
        configurable: false,
    },

    body: {
        value: {
            getElementByText: Element.prototype.getElementByText.bind(document.body),
            getElementsByTextContent: Element.prototype.getElementsByTextContent.bind(document.body),
        },

        writable: false,
        enumerable: false,
        configurable: false,
    },

    getElementByText: {
        value: Element.prototype.getElementByText.bind(document.firstElementChild),

        writable: false,
        enumerable: false,
        configurable: false,
    },

    getElementsByTextContent: {
        value: Element.prototype.getElementsByTextContent.bind(document.firstElementChild),

        writable: false,
        enumerable: false,
        configurable: false,
    },
});

function unknown(value) {
    return value === undefined || value === null;
}

function defined(value) {
    return !unknown(value);
}

// Makes a Promised setInterval - https://levelup.gitconnected.com/how-to-turn-settimeout-and-setinterval-into-promises-6a4977f0ace3
    // awaitOn(callback:function[,ms:number~Integer:milliseconds]) -> Promise
async function awaitOn(callback, ms = 100) {
    return new Promise((resolve, reject) => {
        let interval = setInterval(async() => {
            let value = callback();

            if(defined(value)) {
                clearInterval(interval);
                resolve(value);
            }
        }, ms);
    });
}

// The following facilitates communication between pages
// Get the current settings
   // GetSettings() -> Object
function GetSettings() {
   return new Promise((resolve, reject) => {
       function ParseSettings(settings) {
           for(let setting in settings)
               settings[setting] ??= null;

           resolve(settings);
       }

       window.Storage.get(null, settings =>
           window.Runtime.lastError?
               window.Storage.get(null, ParseSettings):
           ParseSettings(settings)
       );
   });
}

// Saves data to the page's storage
    // SaveCache(keys:object[, callback:function]) -> undefined
async function SaveCache(keys = {}, callback = () => {}) {
    let set = (key, value) => StorageSpace.setItem(`ext.twitch-tools/${ encodeURI(key) }`, value);

    for(let key in keys)
        set(key, JSON.stringify(keys[key]));

    if(typeof callback == 'function')
        callback();
}

// Loads data from the page's storage
    // LoadCache(keys:string|array|object[, callback:function]) -> undefined
async function LoadCache(keys = null, callback = () => {}) {
    let results = {},
        get = key => {
            let value =
                // New save name
                StorageSpace.getItem(`ext.twitch-tools/${ encodeURI(key) }`);
                // Old save name
                // if (value === undefined)
                //     value = StorageSpace.getItem(key);

            try {
                value = JSON.parse(value);
            } catch(error) {
                value = value;
            }

            return value;
        };

    if(keys === null) {
        keys = {};

        for(let key in StorageSpace)
            keys[key] = null;
    }

    switch(keys.constructor) {
        case String:
            results[keys] = get(keys);
            break;

        case Array:
            for(let key of keys)
                results[key] = get(key);
            break;

        case Object:
            for(let key in keys)
                results[key] = get(key) ?? keys[key];
            break;

        default: return;
    }

    if(typeof callback == 'function')
        callback(results);
}

// Removes data from the page's storage
    // RemoveCache(keys:string|array[, callback:function])
async function RemoveCache(keys, callback = () => {}) {
    let remove = key => StorageSpace.removeItem(`ext.twitch-tools/${ encodeURI(key) }`);

    if(!defined(keys))
        return;

    switch(keys.constructor) {
        case String:
            remove(keys);
            break;

        case Array:
            for(let key of keys)
                remove(key);
            break;
    }

    if(typeof callback == 'function')
        callback();
}

// Convert strings to RegExps
    // RegExp lookers
        // `X(?=Y)`     - match X if before Y
        // `X(?!Y)`     - match X if not before Y
        // `(?<=Y)X`    - match X if after Y
        // `(?<!Y)X`    - match X if not after Y
function AsteriskFn(feature) {
    return RegExp(`^${ feature.replace(/\./g, '\\.').replace(/\?/g, '.?').replace(/\+/g, '(\\w+)?').replace(/\*/g, '(\\w*)?').replace(/\#/g, '([^_]+)?').replace(/([^]+)~([^~]+)/, '($1)(?<!$2)') }$`, 'i');
}

// The following needs to be run once per page
__STATIC__: {
    let browser, Storage, Runtime, Manifest, Extension, Container, BrowserNamespace;

    if(defined(browser?.runtime))
        BrowserNamespace = 'browser';
    else if(defined(chrome?.extension))
        BrowserNamespace = 'chrome';

    Container = top[BrowserNamespace];

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

    window.Runtime = Runtime;
    window.Storage = Storage;
    window.Extension = Extension;
    window.Manifest = Manifest;
    window.Storage = Storage;

    let { CHROME_UPDATE, INSTALL, SHARED_MODULE_UPDATE, UPDATE } = Runtime.OnInstalledReason;

    window.CHROME_UPDATE = CHROME_UPDATE;
    window.INSTALL = INSTALL;
    window.SHARED_MODULE_UPDATE = SHARED_MODULE_UPDATE;
    window.UPDATE = UPDATE;

    let StorageSpace = localStorage ?? sessionStorage;

    window.StorageSpace = StorageSpace;

    // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //

    let Settings = {},
        Jobs = {},
        Timers = {},
        Handlers = {
            __reasons__: new Map(),
        },
        Unhandlers = {
            __reasons__: new Map(),
        };

    window.Settings = Settings;
    window.Jobs = Jobs;
    window.Timers = Timers;
    window.Handlers = Handlers;
    window.Unhandlers = Unhandlers;

    // Registers a job
        // RegisterJob(JobName:string) -> Number=IntervalID
    function RegisterJob(JobName, JobReason = 'default') {
        RegisterJob.__reason__ = JobReason;

        return Jobs[JobName] ??= Timers[JobName] > 0?
            setInterval(Handlers[JobName], Timers[JobName]):
        -setTimeout(Handlers[JobName], -Timers[JobName]);
    }
    Handlers.__reasons__.set('RegisterJob', UUID.from(RegisterJob).value);

    // Unregisters a job
        // UnregisterJob(JobName:string) -> undefined
    function UnregisterJob(JobName, JobReason = 'default') {
        UnregisterJob.__reason__ = JobReason;

        let CurrentJob = Jobs[JobName];

        if(CurrentJob < 0)
            clearTimeout(-CurrentJob);
        else
            clearInterval(CurrentJob);

        Unhandlers?.[JobName]?.();

        // Remove the job
        Jobs[JobName] = null;
    }
    Unhandlers.__reasons__.set('UnregisterJob', UUID.from(UnregisterJob).value);

    // Restarts (unregisters, then registers) a job
        // RestartJob(JobName:string) -> undefined
    function RestartJob(JobName, JobReason = 'default') {
        RestartJob.__reason__ = JobReason;

        new Promise((resolve, reject) => {
            try {
                UnregisterJob(JobName, JobReason);

                resolve();
            } catch(error) {
                reject(error);
            }
        }).then(() => {
            RegisterJob(JobName, JobReason);
        });
    }
    Handlers.__reasons__.set('RestartJob', UUID.from(RestartJob).value);
    Unhandlers.__reasons__.set('RestartJob', UUID.from(RestartJob).value);
};
