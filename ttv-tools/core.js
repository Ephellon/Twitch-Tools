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

// Creates a Twitch-style tooltip
    // new Tooltip(parent:Element, text:string?, fineTuning:object<{ left:number<integer>, top:number<integer>, from:string<"up" | "right" | "down" | "left">, lean:string<"center" | "right" | "left"> }>?) → Element<Tooltip>
    // Tooltip.get(parent:Element) → Element<Tooltip>
class Tooltip {
    static #TOOLTIPS = new Map()
    static #CLEANER = setInterval(() => $.all('[tt-remove-me="true"i]').map(tooltip => tooltip.closest('.tooltip-layer').remove()), 100)

    constructor(parent, text = '', fineTuning = {}) {
        let existing = Tooltip.#TOOLTIPS.get(parent);

        fineTuning.top |= 0;
        fineTuning.left |= 0;

        fineTuning.from ??= '';
        fineTuning.from = ({ top: 'up', bottom: 'down', above: 'up', below: 'down' })[fineTuning.from] ?? fineTuning.from

        parent.setAttribute('fine-tuning', JSON.stringify(fineTuning));

        if(defined(existing))
            return existing;

        let uuid;
        let tooltip = furnish(`.tt-tooltip.tt-tooltip--align-${ fineTuning.lean || 'center' }.tt-tooltip--${ fineTuning.from || 'down' }`, { role: 'tooltip', innerHTML: text });

        let values = [parent.getAttribute('tt-tooltip-id'), parent.getAttribute('id'), UUID.from(parent.getPath(true)).value];
        for(let value, index = 0; nullish(value) && index < values.length; ++index) {
            value = values[index];
            uuid = value + (['', ':tooltip'][index] || '');
        }

        parent.setAttribute('tt-tooltip-id', tooltip.id = uuid);

        parent.addEventListener('mouseenter', (function(event) {
            let { currentTarget } = event,
                offset = getOffset(currentTarget),
                screen = getOffset(document.body),
                fineTuning = JSON.parse(currentTarget.getAttribute('fine-tuning'));

            let from = fineTuning.from.replace(/^[^]+--(up|down|left|right)$/i, '$1').toLowerCase();

            $.queryBy('div#root > *, body').first.append(
                furnish('.tt-tooltip-layer.tooltip-layer',
                    {
                        style: (() => {
                            let style = 'animation:.3s fade-in 1;';

                            switch(from) {
                                // case 'up':
                                //     style += `transform: translate(${ offset.left + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 9999;`;

                                case 'down':
                                    style += `transform: translate(${ offset.left + fineTuning.left }px, ${ (offset.bottom - screen.height - offset.height) + fineTuning.top }px); width: ${ offset.width }px; height: ${ 0 & offset.height }px; z-index: 9999;`;

                                // case 'left':
                                //     style += `transform: translate(${ offset.left + offset.width + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 9999;`;
                                //
                                // case 'right':
                                //     style += `transform: translate(${ (offset.right - screen.width - offset.width) + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 9999;`;

                                default:
                                    style += `transform: translate(${ offset.left + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ 0 & offset.height }px; z-index: 9999;`;
                            }

                            return style;
                        })()
                    },
                    furnish('.tt-inline-flex.tt-relative.tt-tooltip-wrapper', { 'aria-describedby': this.id, 'show': true },
                        furnish('div', { style: `width: ${ offset.width }px; height: ${ offset.height }px;` }),
                        this
                    )
                )
            );

            if(parseBool(fineTuning.fit))
                this.setAttribute('style', `max-width:${ offset.width }px`);
            this.modStyle(fineTuning.style);
        }).bind(tooltip));

        parent.addEventListener('mouseleave', ({ currentTarget }) => {
            let tooltip = $(`[id="${ currentTarget.getAttribute('tt-tooltip-id') }"i]`)?.closest('[show]');

            tooltip?.setAttribute('show', false);
            tooltip?.setAttribute('tt-remove-me', true);
        });

        Tooltip.#TOOLTIPS.set(parent, tooltip);

        return tooltip;
    }

    static get(container) {
        return Tooltip.#TOOLTIPS.get(container);
    }
};

// The following is just shared logic
    // $(selector:string, container:Node?, multiple:boolean?) → Array|Element
function $(selector, container = document, multiple = false) {
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

    defined: {
        value: (selector, container = document, multiple = false) => multiple? $(selector, container, true).length > 0: defined($(selector, container)),

        writable: false,
        enumerable: false,
        configurable: false,
    },

    nullish: {
        value: (selector, container = document, multiple = false) => multiple? $(selector, container, true).length < 1: nullish($(selector, container)),

        writable: false,
        enumerable: false,
        configurable: false,
    },

    all: {
        value: (selector, container = document) => $(selector, container, true),

        writable: false,
        enumerable: false,
        configurable: false,
    },
});

// Returns whether a value is nullish or not
    // nullish(value:any?) → boolean
function nullish(value) {
    return value === undefined || value === null || value instanceof Promise;
}

// Returns whether a value is nullish or not
    // defined(value:any?) → boolean
function defined(value) {
    return !nullish(value);
}

// Makes a Promised setInterval
    // when(callback:function<boolean>, ms:number<integer>?, ...args<any>) → Promise<any>
async function when(callback, ms = 100, ...args) {
    return new Promise((resolve, reject) => {
        let interval = setInterval(async args => {
            let value = await callback.apply(null, args);

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
        }, ms, Array.from(args));
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
                // when.defined(callback:function<any>, ms:number<integer>?) → Promise<any>
            async function(callback, ms = 100, ...args) {
                return new Promise((resolve, reject) => {
                    let interval = setInterval(async args => {
                        let value = await callback.apply(null, args);

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
                    }, ms, Array.from(args));
                });
            },
        },

        "nullish": {
            value:
            // https://levelup.gitconnected.com/how-to-turn-settimeout-and-setinterval-into-promises-6a4977f0ace3
            // Makes a Promised setInterval
                // when.nullish(callback:function<any>, ms:number<integer>?) → Promise<any>
            async function(callback, ms = 100, ...args) {
                return new Promise((resolve, reject) => {
                    let interval = setInterval(async args => {
                        let value = await callback.apply(null, args);

                        if(nullish(value)) {
                            clearInterval(interval);
                            resolve(value);
                        }
                    }, ms, Array.from(args));
                });
            },
        },

        "empty": {
            value:
            // https://levelup.gitconnected.com/how-to-turn-settimeout-and-setinterval-into-promises-6a4977f0ace3
            // Makes a Promised setInterval
                // when.empty(callback:function<@@iterable>, ms:number<integer>?) → Promise<any>
            async function(callback, ms = 100, ...args) {
                return new Promise((resolve, reject) => {
                    let interval = setInterval(async args => {
                        let array = await callback.apply(null, args);

                        if(array?.length < 1) {
                            clearInterval(interval);
                            resolve(array);
                        }
                    }, ms, Array.from(args));
                });
            },
        },

        "sated": {
            value:
            // https://levelup.gitconnected.com/how-to-turn-settimeout-and-setinterval-into-promises-6a4977f0ace3
            // Makes a Promised setInterval
                // when.sated(callback:function<@@iterable>, ms:number<integer>?) → Promise<any>
            async function(callback, ms = 100, ...args) {
                return new Promise((resolve, reject) => {
                    let interval = setInterval(async args => {
                        let array = await callback.apply(null, args);

                        if(array?.length > 0) {
                            clearInterval(interval);
                            resolve(array);
                        }
                    }, ms, Array.from(args));
                });
            },
        },
    });
} catch(error) {
    /* Ignore the error... */
}

// https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Recording_a_media_element#utility_functions
// Waits to execute a function
    // wait(delay:number<integer>?, value:<any>?) → Promise<number>
function wait(delay = 100, value) {
    return new Promise(resolve => setTimeout(resolve, delay, value));
}

// https://stackoverflow.com/questions/1909441/how-to-delay-the-keyup-handler-until-the-user-stops-typing
// Delay callbacks until the user is done...
    // delay(fn:function, ms:number<integer>?, ...args:<any>) → Function
function delay(fn, ms = 0, ...args) {
    let timer = -1;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(fn.bind(this, ...args), ms, ...args);
    }
}

// Fetches resources with automatic CORS-sense
    // fetchURL(url:string<URL>, options:object?) → Promise<fetch>
function fetchURL(url, options = {}) {
    let empty = {};

    empty.then = empty.catch = empty.finally = (function() { return this }).bind(empty);

    if(!url?.length)
        return empty;

    let unknown = Symbol('UNKNOWN');
    let { href, domainPath = [], host, protocol } = parseURL(url);
    let [domain = unknown, site = unknown, ...subDomain] = domainPath;

    if([domain, site].contains(unknown))
        return empty;

    let allowedSites = 'betterttv blerp githubusercontent nightbot streamelements streamloots twitch twitchinsights twitchtokengenerator'.split(' '),
        allowedDomains = 'gd'.split(' ');

    // No CORS required
    if(false
        || protocol.equals('chrome:')
        || protocol.equals('chrome-extension:')
        || host.startsWith('.')
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

Object.defineProperties(fetchURL, {
    requests: { value: new Map },

    // Reduce duplicates
    idempotent: {
        value: (url, options) => {
            return fetchURL.requests.set(url, fetchURL(url, options)).get(url);
        },
    },
});

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
        // `X(?=Y)`     - match X if before Y       → \d+(?=\$)     → 1 turkey costs 20$    → 20
        // `X(?!Y)`     - match X if not before Y   → \d+(?!\$)     → 3 turkeys costs 40$   → 3
        // `(?<=Y)X`    - match X if after Y        → (?<=\$)\d+    → 5 turkeys costs $60   → 60
        // `(?<!Y)X`    - match X if not after Y    → (?<!\$)\d+    → 7 turkeys costs $80   → 7
    // AsteriskFn symbols
        // `.`         - 1 character
        // `?`         - 0 or 1 character
        // `+`         - 1 or more characters
        // `*`         - 0 or more characters
        // `X#`        - X followed by any charactrer that is NOT: _
        // `X~Y`       - X NOT followed by Y
function AsteriskFn(feature) {
    return RegExp(`^${
        feature
            .replace(/\./g, '\\.')
            .replace(/(?<![#\+\*])\?/g, '([\\w-])?')
            .replace(/\+/g, '([\\w-]+)')
            .replace(/\*/g, '([\\w-]*)')
            .replace(/\#/g, '([^_]+)')
            .replace(/([^]+)~([^~]+)/, '($1)(?<!$2)')
    }$`, 'i');
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
