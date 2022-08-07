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
    // new UUID() → object
    // UUID.BWT(string:string) → string
    // UUID.cyrb53(string:string, seed:number?) → string
    // UUID.ergo(key:string?) → <async>string
    // UUID.from(string:string, traceable:boolean?) → object
    // UUID.prototype.toString() → string
class UUID {
    static #BWT_SEED = new UUID()

    constructor() {
        let native = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, x => (x ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> x / 4).toString(16));

        this.native = this.value = native;

        this[Symbol.toPrimitive] = type => {
            switch(type) {
                case 'boolean':
                    return true;

                case 'bigint':
                case 'number':
                    return NaN;

                case 'default':
                case 'object':
                case 'string':
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

    toStamp() {
        let value = 0;

        this.native.split('-').map(hex => value ^= parseInt(hex, 16));

        return Math.abs(value).toString(16).padStart(8, '0');
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

    // https://stackoverflow.com/a/52171480/4211612
    static cyrb53(string, seed = 0) {
        let H1 = 0xDEADBEEF ^ seed,
            H2 = 0x41C6CE57 ^ seed;

        for(let i = 0, char; i < string.length; ++i) {
            char = string.charCodeAt(i);

            H1 = Math.imul(H1 ^ char, 2654435761);
            H2 = Math.imul(H2 ^ char, 1597334677);
        }

        H1 = Math.imul(H1 ^ (H1 >>> 16), 2246822507) ^ Math.imul(H2 ^ (H2 >>> 13), 3266489909);
        H2 = Math.imul(H2 ^ (H2 >>> 16), 2246822507) ^ Math.imul(H1 ^ (H1 >>> 13), 3266489909);

        return (4294967296 * (2097151 & H2) + (H1 >>> 0)).toString(16);
    }

    static from(key = '', traceable = false) {
        key = JSON.stringify(
            (null
                ?? key?.toJSON?.()
                ?? key
            )
            || null
        );

        let PRIVATE_KEY = (traceable? '': `private-key="${ UUID.#BWT_SEED }"`),
            CONTENT_KEY = `content="${ encodeURIComponent(key) }"`,
            PUBLIC_KEY = `public-key="${ Manifest.name }"`;

        let hash = Uint8Array.from(
                btoa(
                    [PRIVATE_KEY, CONTENT_KEY, PUBLIC_KEY]
                        .map(string => UUID.cyrb53(string, parseInt(UUID.#BWT_SEED, 16) * +!traceable))
                        .join('~')
                )
                    .split('')
                    .map(character => character.charCodeAt(0))
            ),
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
                case 'object':
                case 'string':
                case 'symbol':
                default:
                    return this.native;
            }
        };

        this.toString = () => this.native;
        this.toStamp = () => UUID.prototype.toStamp.apply(this);

        return this;
    }

    static async ergo(key = '') {
        key = (key ?? '').toString();

        // Privatize (pre-hash) the message a bit
        let PRIVATE_KEY = `private-key=${ UUID.#BWT_SEED }`,
            CONTENT_KEY = `content="${ encodeURIComponent(key) }"`,
            PUBLIC_KEY = `public-key=${ Manifest.version }`;

        key = btoa([PRIVATE_KEY, CONTENT_KEY, PUBLIC_KEY].map(UUID.BWT).join('~'));

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

// The LZW Library
class LZW {
    /** LZW (base64) codec functionality
     * @author      GitHub@antonylesuisse
     * @timestamp   05 APR 2021 21:15 MDT
     * @url         https://gist.github.com/revolunet/843889#gistcomment-3694417
     */
    static B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    constructor(string) {
        Object.defineProperties(this, {
            value: { value: string },

            encoded: {
                get() { return LZW.encode64(this.value) }
            },

            decoded: {
                get() {
                    let { value } = this;

                    try {
                        value = LZW.decode64(value);
                    } catch(error) {
                        /* Suppress the error? */
                        // throw error;
                    }

                    return value;
                }
            },
        });

        return this;
    }

    // A simple hashing algorithm
        // hash(input:string, salt:string?) → string
    static hash(input = '', salt = '') {
        let output = '';

        for(let char, index = 0, { length } = input; index < length; ++index) {
            let a = input.charCodeAt(index),
                b = salt.charCodeAt(index % salt.length);

            output += String.fromCharCode(a ^ b);
        }

        return output;
    }

    // Encodes a string to LZW format
        // encode(string:string?) → String<LZW>
    static encode(string = '') {
        if(!string.length)
            return '';

        string = unescape(encodeURIComponent(string)).split('');

        let dictionary = new Map,
            [word] = string,
            index = 256,
            output = [],
            key;

        function push(word) {
            output.push(word.length > 1? dictionary.get(word): word.charCodeAt(0));
        }

        for(let i = 1; i < string.length; ++i) {
            let char = string[i];

            if(dictionary.has(word + char)) {
                word += char;
            } else {
                dictionary.set(word + char, index++);

                push(word);

                word = char;
            }
        }

        push(word);

        return output.map(charCode => String.fromCharCode(charCode)).join('');
    }

    // Decodes an LZW string
        // decode(string:string<LZW>?) → string
    static decode(string = '') {
        let dictionary = new Map,
            [word] = string,
            index = 256,
            output = [word],
            last = word;

        for(let i = 1; i < string.length; ++i) {
            let key = string.charCodeAt(i);

            word = (
                key < 256?
                    String.fromCharCode(key):
                dictionary.has(key)?
                    dictionary.get(key):
                word + word.charAt(0)
            );

            output.push(word);
            dictionary.set(index++, last + (last = word).charAt(0));
        }

        return output.join('');
    }

    // Encodes a string to LZW-64 format
        // encode64(string:string?) → String<LZW-64>
    static encode64(string = '') {
        if(!string.length)
            return '';

        string = unescape(encodeURIComponent(string)).split('');

        let { B64 } = LZW;
        let dictionary = new Map,
            [word] = string,
            index = 256,
            output = [],
            key;

        function push(word) {
            let k = 0x3f;

            key = word.length > 1? dictionary.get(word): word.charCodeAt(0);

            output.push(B64[key & k]);
            output.push(B64[(key >> 6) & k]);
            output.push(B64[(key >> 12) & k]);
        }

        for(let i = 1; i < string.length; ++i) {
            let char = string[i];

            if(dictionary.has(word + char)) {
                word += char;
            } else {
                dictionary.set(word + char, index++);

                push(word);

                word = char;

                if(index == (1 << 18) - 1) {
                    dictionary.clear();
                    index = 256;
                }
            }
        }

        push(word);

        return output.join('');
    }

    // Decodes an LZW-64 string
        // decode64(string:string<LZW-64>?) → string
    static decode64(string = '') {
        let { B64 } = LZW,
            D64 = {};

        let chardex = 0;
        for(let char of B64)
            D64[char] = chardex++;

        let dictionary = new Map,
            word = String.fromCharCode((D64[string[0]]) + (D64[string[1]] << 6) + (D64[string[2]] << 12)),
            index = 256,
            output = [word],
            last = word;

        for(let i = 3; i < string.length; i += 3) {
            let key = ((D64[string[i + 0]]) + (D64[string[i + 1]] << 6) + (D64[string[i + 2]] << 12));

            word = (
                key < 256?
                    String.fromCharCode(key):
                dictionary.has(key)?
                    dictionary.get(key):
                word + word.charAt(0)
            );

            output.push(word);
            dictionary.set(index++, last + (last = word).charAt(0));

            if(index == (1 << 18) - 1) {
                dictionary.clear();
                index = 256;
            }
        }

        return decodeURIComponent(escape(output.join('')));
    }
};

// The following is just shared logic
    // $(selector:string, multiple:boolean?, container:Node?) → Array|Element
function $(selector, multiple = false, container = document) {
    return multiple?
        [...container?.querySelectorAll(selector)]:
    container?.querySelector(selector);
}

Object.defineProperties($, {
    html: {
        value: document.documentElement,

        writable: false,
        enumerable: false,
        configurable: false,
    },

    head: {
        value: document.head,

        writable: false,
        enumerable: false,
        configurable: false,
    },

    body: {
        value: document.body,

        writable: false,
        enumerable: false,
        configurable: false,
    },

    on: {
        value: function on(type, listener, options = null) {
            return document.addEventListener(type, listener, options);
        },

        writable: false,
        enumerable: false,
        configurable: false,
    },

    getElementByText: {
        value: Element.prototype.getElementByText.bind(document.documentElement),

        writable: false,
        enumerable: false,
        configurable: false,
    },

    getElementsByInnerText: {
        value: Element.prototype.getElementsByInnerText.bind(document.documentElement),

        writable: false,
        enumerable: false,
        configurable: false,
    },

    queryBy: {
        value: Element.prototype.queryBy.bind(document.documentElement),

        writable: false,
        enumerable: false,
        configurable: false,
    },
});

// Returns whether a value is nullish or not
    // nullish(value:any?) → boolean
function nullish(value) {
    return value === undefined || value === null;
}

// Returns whether a value is nullish or not
    // defined(value:any?) → boolean
function defined(value) {
    return !nullish(value);
}

// Makes a Promised setInterval
    // when(callback:function<boolean>, ms:number<milliseconds>?) → Promise<any>
async function when(callback, ms = 100) {
    return new Promise((resolve, reject) => {
        let interval = setInterval(async() => {
            let value = await callback();

            if(parseBool(value) !== false) {
                clearInterval(interval);
                resolve(
                    (value === when.false)?
                        false:
                    (value === when.true)?
                        true:
                    value
                );
            }
        }, ms);
    });
}

try {
    Object.defineProperties(when, {
        "false": { value: Symbol(false) },
        "true": { value: Symbol(true) },

        "null": { value: Symbol(null) },
        "void": { value: Symbol(void undefined) },
        "undefined": { value: Symbol(undefined) },

        "defined": {
            value:
            // https://levelup.gitconnected.com/how-to-turn-settimeout-and-setinterval-into-promises-6a4977f0ace3
            // Makes a Promised setInterval
                // when.defined(callback:function, ms:number<milliseconds>?) → Promise<any>
            async function(callback, ms = 100) {
                return new Promise((resolve, reject) => {
                    let interval = setInterval(async() => {
                        let value = await callback();

                        if(defined(value)) {
                            clearInterval(interval);
                            resolve(
                                (value === when.null)?
                                    null:
                                (value === when.void)?
                                    void undefined:
                                (value === when.undefined)?
                                    undefined:
                                value
                            );
                        }
                    }, ms);
                });
            },
        },
    });
} catch(error) {
    /* Ignore the error... */
}

// https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Recording_a_media_element#utility_functions
// Waits to execute a function
    // wait(delay:number<integer>?) → Promise
function wait(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
}

// https://stackoverflow.com/questions/1909441/how-to-delay-the-keyup-handler-until-the-user-stops-typing
// Delay callbacks until the user is done...
    // delay(fn:function, ms:number?) → undefined
function delay(fn, ms = 0) {
    let timer = -1;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(fn.bind(this, ...args), ms);
    }
}

// Fetches resources with automatic CORS-sense
    // fetchURL(url:string<URL>, options:object?) → Promise<fetch>
function fetchURL(url, options = {}) {
    let { href, domainPath, origin, protocol } = parseURL(url);
    let [domain, site, ...subDomain] = domainPath;

    let allowedSites = 'betterttv nightbot streamelements streamloots twitch twitchinsights'.split(' '),
        allowedDomains = 'gd'.split(' ');

    // No CORS required
    if(false
        || protocol.equals('chrome:')
        || origin.startsWith('.')
        || allowedDomains.contains(domain.toLowerCase())
        || allowedSites.contains(site.toLowerCase())
    ) {
        // Do nothing...
    }

    // CORS required
    else {
        options.mode = 'cors';
        href = `https://api.allorigins.win/raw?url=${ encodeURIComponent(href) }`;
    }

    return fetch(href, options);
}

// The following facilitates communication between pages
// Get the current settings
   // GetSettings() → object
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
    // SaveCache(keys:object, callback:function?) → undefined
async function SaveCache(keys = {}, callback = () => {}) {
    let set = (key, value) => StorageSpace.setItem(`ext.twitch-tools/${ encodeURI(key) }`, value);

    for(let key in keys)
        set(key, JSON.stringify(keys[key]));

    if(typeof callback == 'function')
        callback();
}

// Loads data from the page's storage
    // LoadCache(keys:string|array|object, callback:function?) → undefined
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
    // RemoveCache(keys:string|array, callback:function?)
async function RemoveCache(keys, callback = () => {}) {
    let remove = key => StorageSpace.removeItem(`ext.twitch-tools/${ encodeURI(key) }`);

    if(nullish(keys))
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
    // AsteriskFn symbols
        // `.`         - 1 character
        // `?`         - 0 or 1 character
        // `+`         - 1 or more characters
        // `*`         - 0 or more characters
        // `X#`        - X followed by any charactrer that is NOT: _
        // `X~Y`       - X NOT followed by Y
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
        // RegisterJob(JobName:string) → Number<IntervalID>
    function RegisterJob(JobName, JobReason = 'default') {
        RegisterJob.__reason__ = JobReason;

        return Jobs[JobName] ??= Timers[JobName] > 0?
            setInterval(Handlers[JobName], Timers[JobName]):
        -setTimeout(Handlers[JobName], -Timers[JobName]);
    }
    Handlers.__reasons__.set('RegisterJob', UUID.from(RegisterJob).value);

    // Unregisters a job
        // UnregisterJob(JobName:string) → undefined
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
        // RestartJob(JobName:string) → undefined
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
