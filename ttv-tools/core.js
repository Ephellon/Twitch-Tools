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

/**
 * @file Defines all required logic for the extension. Used on all pages.
 * <style>[\.pill]{font-weight:bold;white-space:nowrap;border-radius:1rem;padding:.25rem .75rem}[\.good]{background:#e8f0fe66;color:#174ea6}[\.bad]{background:#fce8e666;color:#9f0e0e;}</style>
 * @author Ephellon Grey (GitHub {@link https://github.io/ephellon @ephellon})
 */

;

/** Creates a random {@link https://developer.mozilla.org/en-US/docs/Glossary/UUID UUID}.
 * @author StackOverflow {@link https://stackoverflow.com/users/1480391/yves-m @Yves M.}
 * @author StackOverflow {@link https://stackoverflow.com/users/109538/broofa @broofa}
 * @author GitHub Gist {@link https://gist.github.com/jed @jed}
 * @author GitHub {@link https://github.com/ephellon @ephellon}
 *
 * @see https://stackoverflow.com/a/52171480/4211612
 * @see https://stackoverflow.com/a/2117523/4211612
 * @see https://gist.github.com/jed/982883
 *
 * @simply new UUID() → object
 * @example
 * let id = new UUID() // → UUID { native: "eabd8ed0-8aa6-43cd-88ec-dfd663b5f308", value: "eabd8ed0-8aa6-43cd-88ec-dfd663b5f308", Symbol(@@toPrimitive): ƒ [@@toPrimitive](type) }
 * id + ''      // "eabd8ed0-8aa6-43cd-88ec-dfd663b5f308"
 * id - 1       // NaN
 * Symbol(id)   // Symbol(eabd8ed0-8aa6-43cd-88ec-dfd663b5f308)
 */
class UUID {
    static #BWT_SEED = new UUID()

    /** @constructor
     * @return {object<string>} A UUID object
     */
    constructor() {
        let native = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, x => (x ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> x / 4).toString(16));

        return Object.assign(this, {
            native,
            value: native,

            [Symbol.toPrimitive](type) {
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
            },
        });
	}

    /**
     * Returns a "normalized" (32 character string) version of the UUID.
     *
     * @return {string} 32-character string
     */
    toString() {
        return this.native;
    }

    /**
     * Returns a shortened (8 character string) version of the UUID.
     *
     * @return {string} 8-character string
     */
    toStamp() {
        let value = 0;

        this.native.split('-').map(hex => value ^= parseInt(hex, 16));

        return Math.abs(value).toString(16).padStart(8, '0');
    }

    /**
     * Returns the {@link https://medium.com/@mr-easy/burrows-wheeler-transform-d475e0aacad6 Burrows-Wheeler Transform} version of the input.
     *
     * @param  {string} [string = ""]   The input to transform
     * @return {string}
     */
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

    /**
     * Returns a cyrb53 hash from the input.
     * @author {@link https://stackoverflow.com/users/1480391/yves-m @Yves M.}
     *
     * @param  {string} string              The input to hash
     * @param  {number<integer>} [seed = 0] The hasing seed
     * @return {string}                     53-bit hash
     */
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

    /**
     * Returns a UUID-like hash from the input.
     *
     * @param  {string} [key = ""]              The input to generate the hash from
     * @param  {boolean} [traceable = false]    Whether or not the UUID should be traceable (repeatable)
     * @return {UUID}
     */
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

        return Object.assign(new UUID, {
            native,
            value: native,
        });
    }

    /**
     * Returns a signed UUID-like hash from the input.
     * @requires crypto.subtle.digest
     *
     * @param  {string} [key = ""]              The input to generate the hash from
     * @param  {boolean} [traceable = false]    Whether or not the UUID should be traceable (repeatable)
     * @return {UUID}
     */
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

/** Adds LZW (base64) codec functionality.
 * @author      GitHub {@link https://github.com/antonylesuisse @antonylesuisse}
 * @author      GitHub {@link https://github.com/ephellon @ephellon}
 *
 * @since       05 APR 2021 21:15 MDT
 *
 * @see         https://gist.github.com/revolunet/843889#gistcomment-3694417
 *
 * @simply new LZW(string:string) → string
 * @example
 * let codec = new LZW("hello" × 30) // → LZW { get decoded: "hellohello…", get encoded: "oBAlBAsBAs…", value: "hellohello…" }
 */
class LZW {
    static B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    /** @constructor
     * @return {object<string>} An LZW object
     */
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

    /**
     * Returns a hased (and salted) form of the input.
     *
     * @param  {string} [input = ""]    The input to be hashed
     * @param  {string} [salt = ""]     The salt to be added to the input
     * @return {string}
     */
    static hash(input = '', salt = '') {
        let output = '';

        for(let char, index = 0, { length } = input; index < length; ++index) {
            let a = input.charCodeAt(index),
                b = salt.charCodeAt(index % salt.length);

            output += String.fromCharCode(a ^ b);
        }

        return output;
    }

    /**
     * Encodes a string to LZW format.
     * @author {@link https://github.com/antonylesuisse @antonylesuisse}
     *
     * @param  {string} [string = ""]   The input to be encoded
     * @return {string}
     */
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

    /**
     * Decodes an LZW formatted string.
     * @author {@link https://github.com/antonylesuisse @antonylesuisse}
     *
     * @param  {string} [string = ""]   The string to decode
     * @return {string}
     */
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

    /**
     * Encodes a string to LZW-64 format.
     *
     * @param  {string} [string = ""]   The input to be encoded
     * @return {string}
     */
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

    /**
     * Decodes an LZW-64 formatted string.
     *
     * @param  {string} [string = ""]   The string to decode
     * @return {string}
     */
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

/** An over-arching adjustment schema.
 * @typedef {object} TooltipAdjustment
 *
 * @property {number<integer>} [left] - Left (X-axis) adjustment
 * @property {number<integer>} [top] - Top (Y-axis) adjustment
 * @property {string} [from] - Determines where on the parent the tooltip protrudes from. Can be one of: <strong>up</strong>, <strong>down</strong>, <strong>left</strong>, or <strong>right</strong>
 * @property {string} [lean] - The tooltip's text justification. Can be one of: <strong>left</strong>, <strong>center</strong>, or <strong>right</strong>
 * @property {boolean} [fit = false] - Determines whether the tooltip overflows its parent
 * @property {string} [style] - Extra styling (CSS) for the tooltip
 */

/** Creates a Twitch-like tooltip.
 * @author GitHub {@link https://github.com/ephellon @ephellon}
 *
 * @simply Tooltip.get(parent:Element) → Element<Tooltip>
 * @simply new Tooltip(parent:Element, text:string?, fineTuning:object?<{ left:number<integer>, top:number<integer>, from:string<"up" | "right" | "down" | "left">, lean:string<"center" | "right" | "left">, fit:boolean?, style:string? }>) → Element<Tooltip>
 */
class Tooltip {
    static #TOOLTIPS = new Map()
    static #CLEANER = setInterval(() => $.all('[tt-remove-me="true"i]').map(tooltip => tooltip.closest('.tooltip-layer').remove()), 100)


    /** @constructor
     *
     * @param  {Element} parent                         The element that the tooltip should be attached to
     * @param  {string} [text = ""]                     The text of the tooltip
     * @param  {TooltipAdjustment} [fineTuning = {}]    Coordinate, text justification, fitting, and styling adjustments for the tooltip
     *
     * @return {Element}                                Returns the new tooltip element (attached to the parent)
     */
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

        let values = [parent.getAttribute('tt-tooltip-id'), parent.getAttribute('id'), UUID.from(parent.getPath(-1)).value];
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

            $.queryBy('#root > *, body').first.append(
                furnish('.tt-tooltip-layer.tooltip-layer',
                    {
                        style: (() => {
                            let style = 'animation:.3s fade-in 1;';

                            switch(from) {
                                // case 'up':
                                //     style += `transform: translate(${ offset.left + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 99999;`;

                                case 'down':
                                    style += `transform: translate(${ offset.left + fineTuning.left }px, ${ (offset.bottom - screen.height - offset.height) + fineTuning.top }px); width: ${ offset.width }px; height: ${ 0 & offset.height }px; z-index: 99999;`;

                                // case 'left':
                                //     style += `transform: translate(${ offset.left + offset.width + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 99999;`;
                                //
                                // case 'right':
                                //     style += `transform: translate(${ (offset.right - screen.width - offset.width) + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ offset.height }px; z-index: 99999;`;

                                default:
                                    style += `transform: translate(${ offset.left + fineTuning.left }px, ${ offset.top + fineTuning.top }px); width: ${ offset.width }px; height: ${ 0 & offset.height }px; z-index: 99999;`;
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

    /**
     * Returns the tooltip of the specified container (parent), or <i>null</i> if no tooltip is found
     *
     * @param  {Element} container      The element to get the associated tooltip from
     * @return {(HTMLElement<Tooltip>|null)}
     */
    static get(container) {
        return Tooltip.#TOOLTIPS.get(container) ?? null;
    }
};

/** Creates an asynchronous construct similar to a Promise. The only difference is that it accepts a spread (array) of arguments for its resolver and/or rejector.
 * @simply new Async(ƒ (onResolve, onReject)) → Async<#Promise>
 *
 * @author Medium {@link https://medium.com/@manojsingh047/polyfill-for-javascript-promise-81053b284e37 @manojsingh047}
 * @see https://medium.com/@manojsingh047/polyfill-for-javascript-promise-81053b284e37
 */
class Async {
    /** @typedef {string} AsyncStatus
     * The status of an Async (Promise-like) object
     *
     * @property {string} PENDING - Denotes a pending (not resolved or rejected) Async
     * @property {string} FULFILLED - Denotes a fulfilled (resolved) Async
     * @property {string} REJECTED - Denotes a rejected (rejected) Async
     */
    static PENDING = 'pending';
    static FULFILLED = 'fulfilled';
    static REJECTED = 'rejected';

    #resolvers = [];
    #values;

    #rejectors = [];
    #errors;

    #chain = [];

    #status = Async.PENDING;
    #volley = Async.PENDING;
    #called = false;
    #settled = false;
    #fulfilled = false;
    #rejected = false;

    /** @constructor
     *
     * @param  {function} executor The same arguments for Promises: a resolver, and (optional) rejector.
     * @return {Async}             Returns a Promise-like object
     */
    constructor(executor) {
        return executor(this.#resolver.bind(this), this.#rejector.bind(this));
    }

    /**
     * A method to chain Promise-like resolutions.
     * Returns an {Async} object, allowing you to chain calls to other async methods.
     * Similar to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then Promise.prototype.then}.
     *
     * @param  {function} callback  The function to call when the previous {Async} or <b>then</b> fulfills
     * @return {Async}              The values that the {Async} or previous <b>then</b> was fulfilled with
     */
    then(callback) {
        this.#resolvers.push(callback);
        this.#chain.push(callback);

        Object.defineProperties(callback, { signal: { value: Async.FULFILLED } });

        return this;
    }

    /**
     * A method to chain Promise-like rejections.
     * Returns an {Async} object, allowing you to chain calls to other async methods.
     * Similar to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch Promise.prototype.catch}.
     *
     * @param  {function} callback  The function to call when the previous {Async} or <b>catch</b> rejects
     * @return {Async}              The errors that the {Async} or previous <b>catch</b> was rejected with
     */
    catch(callback) {
        this.#rejectors.push(callback);
        this.#chain.push(callback);

        Object.defineProperties(callback, { signal: { value: Async.REJECTED } });

        return this;
    }

    /**
     * A method to terminate Promise-like streams.
     * Returns an {Async} object, allowing you to chain calls to other async methods.
     * Similar to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally Promise.prototype.finally}.
     *
     * @param  {function} callback  The function to call when the previous {Async} or <b>then</b> fulfills
     * @return {Async}              The values that the {Async} or previous <b>then</b> was fulfilled with
     */
    finally(callback) {
        this.#chain.push(callback);

        return this;
    }

    /**
     * Returns the status of the Async
     *
     * @return {AsyncStatus}  Returns the pending status of the Async
     */
    status() {
        let pending = Symbol(Async.PENDING);

        return Async.race([this, pending]).then(response => response === pending? Async.PENDING: Async.FULFILLED, () => Async.REJECTED);
    }

    /**
     * Returns a resolved {Async} object.
     * Similar to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve Promise.resolve}.
     *
     * @param  {any} [...values] The values to pass to the following <b>then</b>
     * @return {any[]}      All of the values that were given
     */
    static resolve(...values) {
        return new Async(function(resolve, reject) {
            resolve.apply(this, values);
        });
    }

    /**
     * Returns a rejected {Async} object.
     * Similar to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject Promise.reject}.
     *
     * @param  {any} [...errors] The errors to pass to the following <b>catch</b>
     * @return {Error[]}    All of the errors that were caught
     */
    static reject(...errors) {
        return new Async(function(resolve, reject) {
            reject.apply(this, errors);
        });
    }

    /**
     * Returns an array once <strong>all</strong> Asyncs have fulfilled.
     * Similar to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all Promise.all}.
     *
     * @param  {Async} [...asyncs]  The Asyncs to iterate and wait for fulfillment
     * @return {(Async|Error)}      This will fulfill to a promise or the first rejection
     */
    static all(asyncs) {
        return new Async(function(resolve, reject) {
            let finished = 0;
            let responses = [];

            if(asyncs.length == 0)
                return resolve(asyncs);

            for(let index = 0; index < asyncs.length; ++index)
                asyncs[index]
                    .then((...values) => done(values, index))
                    .catch((...errors) => reject.apply(this, errors));

            function done(values, index) {
                ++finished;
                responses[index] = values;

                if(finished == asyncs.length)
                    resolve.apply(this, values);
            }
        });
    }

    /**
     * Returns an array of Async statuses.
     * Similar to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled Promise.allSettled}.
     *
     * @param  {Async} [...asyncs]  The Asyncs to iterate and retrieve statuses from
     * @return {object[]}      This will be an array of objects that describe each Async's status
     */
    static allSettled(asyncs) {
        return new Async(function(resolve, reject) {
            let settled = 0;
            let statuses = [];

            for(let index = 0; index < asyncs.length; ++index)
                asyncs[index]
                    .then((...values) => done(values, index))
                    .catch((...errors) => fail(errors, index));

            function done(values, index) {
                ++settled;
                statuses[index] = { status: 'fulfilled', values };

                if(settled == asyncs.length)
                    resolve.apply(this, statuses);
            }

            function fail(reasons, index) {
                ++settled;
                statuses[index] = { status: 'rejected', reasons };

                if(settled == asyncs.length)
                    resolve.apply(this, statuses);
            }
        });
    }

    /**
     * Returns the first fulfilled Async, or an array of rejections.
     * Similar to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any Promise.any}.
     *
     * @param  {Async} [...asyncs]      The Asyncs to iterate
     * @return {(any|AggregateError)}   This will be a fulfillment or AggregateError (array)
     */
    static any(asyncs) {
        return new Async(function(resolve, reject) {
            let failed = 0;
            let reasons = [];

            if(asyncs.length == 0)
                return resolve(asyncs);

            for(let index = 0; index < asyncs.length; ++index)
                asyncs[index]
                    .then((...values) => resolve.apply(this, values))
                    .catch((...errors) => fail(errors, index));

            function fail(errors, index) {
                ++failed;
                reasons[index] = errors;

                if(failed == asyncs.length)
                    reject.apply(this, new AggregateError(errors));
            }
        });
    }

    /**
     * Returns the first fulfilled Async, or an array of rejections.
     *
     * @param  {Async} [...asyncs]  The Asyncs to iterate
     * @return {(any|Error[])} This will be a fulfillment or array of rejections
     */
    static anySettled(asyncs) {
        let errors = new Array(asyncs.length);
        let errd = 0;

        return new Async((resolve, reject) => {
            asyncs.map((promise, index) => {
                Async.resolve(promise)
                    // Resolve the async to a non-empty value
                    .then(result => {
                        if(nullish(result))
                            throw result;
                        resolve(result);
                    })
                    // Reject the value, immediately
                    .catch(error => {
                        errors[index] = error;

                        // All asyncs rejected; reject parent
                        if(++errd == promises.length)
                            reject(errors);
                    });
            });
        });
    }

    /**
     * Returns the first fulfilled Async.
     * Similar to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race Promise.race}.
     *
     * @param  {Async} [...asyncs]  The Asyncs to iterate
     * @return {Async}              This will be a fulfillment or AggregateError (array)
     */
    static race(asyncs) {
        return new Async(function(resolve, reject) {
            for(let async of asyncs)
                async
                    .then((...values) => resolve.apply(this, values))
                    .catch((...errors) => reject.apply(this, errors));
        });
    }

    #resolver(...values) {
        this.#status = Async.FULFILLED;
        this.#volley = Async.FULFILLED;
        this.#fulfilled = true;
        this.#settled = true;
        this.#values = values;

        if(!this.#called) {
            this.#called = true;

            chaining: for(let callback of this.#chain)
                if(!callback.consumed) {
                    if(callback.signal && (this.#status != callback.signal) && (this.#volley != callback.signal))
                        continue chaining;

                    Object.defineProperties(callback, { consumed: { value: true } });

                    let values = this.#values;

                    if(!(values instanceof Array))
                        values = Array.of(values);

                    // If an error is raised within a `then` callback, raise the error and deviate to the `catch` chain
                    try {
                        this.#values = callback.apply(this, values);
                    } catch(error) {
                        this.#volley = Async.REJECTED;
                    }
                }
        }
    }

    #rejector(...errors) {
        this.#status = Async.REJECTED;
        this.#volley = Async.REJECTED;
        this.#rejected = true;
        this.#settled = true;
        this.#errors = errors;

        if(!this.#called) {
            this.#called = true;

            chaining: for(let callback of this.#chain)
                if(!callback.consumed) {
                    if(callback.signal && (this.#status != callback.signal) && (this.#volley != callback.signal))
                        continue chaining;

                    Object.defineProperties(callback, { consumed: { value: true } });

                    let errors = this.#errors;

                    if(!(errors instanceof Array))
                        errors = Array.of(errors);

                    // Errors cannot be volleyed back :P
                    this.#errors = callback.apply(this, errors);
                }
        }
    }
}

// The following is just shared logic

/** @typedef {string} CSSSelector
 * See {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors CSS selectors}
 */

;

/** Returns an element, array of elements, or null if nothing is found.
 * @simply $(selector:string, container:Node?, multiple:boolean?) → Array|Element
 *
 * @param  {CSSSelector} selector           The selector(s) for the element(s)
 * @param  {Element} [container = document] The container (parent) to search for the element(s)
 * @param  {boolean} [multiple = false]     Determines if a single element or multiple elements are returned
 *
 * @property {HTMLDocumentElement} html     A shortcut for the document
 * @property {HTMLHeadElement} head         A shortcut for the head element
 * @property {HTMLBodyElement} body         A shortcut for the body element
 * @property {function} on                  <div class="signature">(type:string, listener:(function|object), options:(object|boolean)<span class="signature-attributes">opt</span>) → void</div>
 *                                          <br>A shortcut for {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener addEventListener}
 * @property {function} all                 <div class="signature">(selector:(string|array|Element), container:Node<span class="signature-attributes">opt</span>) → Element[]</div>
 *                                          <br>Returns all queried elements, a shortcut for: <code class=prettyprint>$(selector, container, true)</code>
 * @property {function} getElementByText    <div class="signature">(search:(string|RegExp|array&lt;(string|RegExp)&gt;), flags:string<span class="signature-attributes">opt</span>) → Element|null</div>
 *                                          <br>Finds and returns an element based on its textual content
 * @property {function} getElementsByText   <div class="signature">(search:(string|RegExp|array&lt;(string|RegExp)&gt;), flags:string<span class="signature-attributes">opt</span>) → array&lt;Element&gt;</div>
 *                                          <br>Finds and returns multiple elements based on their textual content
 * @property {function} queryBy             <div class="signature">(selectors:(string|array|Element), container:Node<span class="signature-attributes">opt</span>) → Element|null</div>
 *                                          <br>Finds and returns an array of elements in their selector order
 * @property {function} defined             <div class="signature">(selector:(string|array|Element), container:Node<span class="signature-attributes">opt</span>, multiple:boolean<span class="signature-attributes">opt</span>) → boolean</div>
 *                                          <br>Returns whether or not a query selection is found or not. Returns <i>true</i> if any of the elements queried for exist.
 * @property {function} nullish             <div class="signature">(selector:(string|array|Element), container:Node<span class="signature-attributes">opt</span>, multiple:boolean<span class="signature-attributes">opt</span>) → boolean</div>
 *                                          <br>Returns whether or not a query selection is found or not. Returns <i>true</i> if none of the elements queried for exist.
 *
 * @return {(Element|Array|null)}
 */
function $(selector, container = document, multiple = false) {
    return multiple?
        [...(container?.querySelectorAll(selector) ?? [])]:
    (container?.querySelector(selector) ?? null);
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

/** Returns a boolean describing if the value is nullish or not.
 * <br>The definition of <i>nullish</i> is: <i><code>null</code></i>, <i><code>undefined</code></i>, <i><code>Promise</code></i>, and <i><code>NaN</code></i>.
 * @simply nullish(value:any?) → boolean
 *
 * @param  {any} value  The value to test
 * @return {boolean}    Returns <i>true</i> if the value is <i>null</i>
 */
function nullish(value) {
    return value === undefined || value === null || value instanceof Promise || Number.isNaN(value);
}

/** Returns a boolean describing if the value is nullish or not.
 * <br>The definition of <i>nullish</i> is: <i><code>null</code></i>, <i><code>undefined</code></i>, <i><code>Promise</code></i>, and <i><code>NaN</code></i>.
 * @simply defined(value:any?) → boolean
 *
 * @param  {any} value  The value to test
 * @return {boolean}    Returns <i>true</i> if the value is <b>not</b> <i>null</i>
 */
function defined(value) {
    return !nullish(value);
}

/** Returns a Promised <b><code>setInterval</code></b>.
 * @simply when(condition:function<boolean>, ms:number?<integer>, ...args<any>) → Promise~any
 *
 * @param  {function} condition             This should return a <i>boolean-like</i>: {@link https://developer.mozilla.org/en-US/docs/Glossary/Truthy <i>truthy</i>} if the condition(s) have been met, or {@link https://developer.mozilla.org/en-US/docs/Glossary/Falsy <i>falsy</i>} if not.
 *                                          If you would like to pass the literal values <i>true</i> or <i>false</i>, use <b><code>when.true</code></b> or <b><code>when.false</code></b>.
 * @param  {number<integer>} [ms = 100]     This changes how often the conditon is checked for compliance
 * @param  {...any} args                    These are the arguments that will be passed to the condition function
 *
 * @property {Symbol} true                  Represents the <i>true</i> value
 * @property {Symbol} false                 Represents the <i>false</i> value
 *
 * @property {Symbol} null                  Represents the <i>null</i> value
 * @property {Symbol} void                  Represents the <i>undefined</i> value
 * @property {Symbol} undefined             Represents the <i>undefined</i> value
 *
 * @property {function} all                 <div class="signature">(...conditions<span class="signature-attributes">repeatable</span>) → {array&lt;Promise~any[]&gt;}</div>
 *                                          <br>Takes an any number of conditions and fulfills when <b>all</b> conditions pass.
 *                                          <br>Also contains: <b><code>when.all.defined</code></b>, <b><code>when.all.nullish</code></b>, <b><code>when.all.empty</code></b>, and <b><code>when.all.sated</code></b>; each has the same argument signature as <code>when.all</code>
 * @property {function} any                 <div class="signature">(...conditions<span class="signature-attributes">repeatable</span>) → {array&lt;Promise~any[]&gt;}</div>
 *                                          <br>Takes an any number of conditions and fulfills when <b>any</b> condition passes.
 *                                          <br>Also contains: <b><code>when.any.defined</code></b>, <b><code>when.any.nullish</code></b>, <b><code>when.any.empty</code></b>, and <b><code>when.any.sated</code></b>; each has the same argument signature as <code>when.any</code>
 *
 * @property {function} pipe                <div class="signature">(condition:function, ms:number<span class="signature-attributes">opt</span>, ...args<span class="signature-attributes">repeatable</span>) → {Promise~any[]}</div>
 *                                          <br>Passes arguments (pipes) to a conditon function and the resolver (Promise)
 * @property {function} thru                <div class="signature">(condition:function, ms:number<span class="signature-attributes">opt</span>, ...args<span class="signature-attributes">repeatable</span>) → {Promise~any[]}</div>
 *                                          <br>Passes arguments (pipes) to the resolver (Promise)
 *
 * @property {function} defined             <div class="signature">(conditon:function, ms:number<span class="signature-attributes">opt</span>, ...conditions<span class="signature-attributes">repeatable</span>) → {Promise~any}</div>
 *                                          <br>Fulfills when the condition returns a <i>defined</i> value (<b>not</b> <i>null</i>).
 *                                          <br>The definition of <i>nullish</i> is: <i><code>null</code></i>, <i><code>undefined</code></i>, <i><code>Promise</code></i>, and <i><code>NaN</code></i>.
 *                                          <br>Also contains: <b><code>when.defined.pipe</code></b> and <b><code>when.defined.thru</code></b>; each has the same argument signature as <code>when</code>
 * @property {function} nullish             <div class="signature">(conditon:function, ms:number<span class="signature-attributes">opt</span>, ...conditions<span class="signature-attributes">repeatable</span>) → {Promise~any}</div>
 *                                          <br>Fulfills when the condition returns a <i>nullish</i> value.
 *                                          <br>The definition of <i>nullish</i> is: <i><code>null</code></i>, <i><code>undefined</code></i>, <i><code>Promise</code></i>, and <i><code>NaN</code></i>.
 *                                          <br>Also contains: <b><code>when.nullish.pipe</code></b> and <b><code>when.nullish.thru</code></b>; each has the same argument signature as <code>when</code>
 *
 * @property {function} empty               <div class="signature">(conditon:function~@@iterable, ms:number<span class="signature-attributes">opt</span>, ...conditions<span class="signature-attributes">repeatable</span>) → {Promise~any}</div>
 *                                          <br>Fulfills when the condition returns an empty array.
 *                                          <br>Also contains: <b><code>when.empty.pipe</code></b> and <b><code>when.empty.thru</code></b>; each has the same argument signature as <code>when</code>
 * @property {function} sated               <div class="signature">(conditon:function~@@iterable, ms:number<span class="signature-attributes">opt</span>, ...conditions<span class="signature-attributes">repeatable</span>) → {Promise~any}</div>
 *                                          <br>Fulfills when the condition returns a non-empty array.
 *                                          <br>Also contains: <b><code>when.sated.pipe</code></b> and <b><code>when.sated.thru</code></b>; each has the same argument signature as <code>when</code>
 *
 * @return {Promise~any}                    The Promise will fulfill to the value that caused the condition to pass
 *
 * @see https://levelup.gitconnected.com/how-to-turn-settimeout-and-setinterval-into-promises-6a4977f0ace3
 * @example // When `seconds` is greater than 5, write a `message` to the page
 * let message = "It's been more than 5 seconds since the page was loaded!";
 * let seconds = 0;
 *
 * when(
 *      ([seven, eight, nine]) => // `condition`
 *          {
 *              return ++seconds > 5?
 *                  "pass" + eight:
 *              false;
 *          }
 *      , 1000      // `ms`
 *      , 7, 8, 9   // `...args`
 * )
 *      .then(status => // "pass8"
 *          document.write(message) // After 5s, writes the message to the document
 *      );
 *
 * // Using `when.true` and `when.false`
 * // When `seconds` is 10, fulfill the Promise with the `when.false` symbol
 * // We use this since we can't satisfy the condition with a falsy value
 * when(() => seconds > 10? when.false: false)
 *      .then(status => // false
 *          console.log('The user is still active:', status) // After 10s, logs "The user is still active: false"
 *      );
 *
 */
async function when(condition, ms = 100, ...args) {
    return new Promise((resolve, reject) => {
        let interval = setInterval(async args => {
            let value = await condition.apply(null, args);

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
        }, ms, [].concat(args));
    });
}

try {
    Object.defineProperties(when, {
        "false": { value: Symbol(false) },
        "true": { value: Symbol(true) },

        "null": { value: Symbol(null) },
        "void": { value: Symbol(void undefined) },
        "undefined": { value: Symbol(undefined) },

        "all": {
            value:
            // Makes a Promised setInterval. Only executes if ALL conditions pass
                // when.all(...conditions:function) → array<Promise~any[]>
            async function(...conditions) {
                conditions = [].concat(conditions);

                let promises = [];

                for(let condition of conditions)
                    promises.push(new Promise((resolve, reject) => when(condition).then(resolve)));

                return Promise.all(promises);
            },
        },

        "any": {
            value:
            // Makes a Promised setInterval. Only executes if ANY conditions pass
                // when.any(...conditions:function) → Promise~any[]
            async function(...conditions) {
                conditions = [].concat(conditions);

                let promises = [];

                for(let condition of conditions)
                    promises.push(new Promise((resolve, reject) => when(condition).then(resolve)));

                return Promise.any(promises);
            },
        },

        "pipe": {
            value:
            // Makes a Promised setInterval. Pipes the arguments provided, applying them to both the condition and resolver
                // when.pipe(condition:function<any>, ms:number?<integer>, ...args<any>) → Promise~any[]
            async function(condition, ms = 100, ...args) {
                args = [].concat(args);

                return new Promise((resolve, reject) => {
                    return when(condition, ms, ...args).then(resolve.call(null, args));
                });
            },
        },

        "thru": {
            value:
            // Makes a Promised setInterval. Pipes the arguments provided, applying them only on the resolver
                // when.thru(condition:function<any>, ms:number?<integer>, ...args<any>) → Promise~any[]
            async function(condition, ms = 100, ...args) {
                args = [].concat(args);

                return new Promise((resolve, reject) => {
                    return when(condition, ms).then(resolve.call(null, args));
                });
            },
        },

        "defined": {
            value:
            // Makes a Promised setInterval
                // when.defined(condition:function<any>, ms:number?<integer>) → Promise~any
            async function(condition, ms = 100, ...args) {
                return new Promise((resolve, reject) => {
                    let interval = setInterval(async args => {
                        let value = await condition.apply(null, args);

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
                    }, ms, [].concat(args));
                });
            },
        },

        "nullish": {
            value:
            // Makes a Promised setInterval
                // when.nullish(condition:function<any>, ms:number?<integer>) → Promise~any
            async function(condition, ms = 100, ...args) {
                return new Promise((resolve, reject) => {
                    let interval = setInterval(async args => {
                        let value = await condition.apply(null, args);

                        if(nullish(value)) {
                            clearInterval(interval);
                            resolve(value);
                        }
                    }, ms, [].concat(args));
                });
            },
        },

        "empty": {
            value:
            // Makes a Promised setInterval
                // when.empty(condition:function<@@iterable>, ms:number?<integer>) → Promise~any
            async function(condition, ms = 100, ...args) {
                return new Promise((resolve, reject) => {
                    let interval = setInterval(async args => {
                        let array = await condition.apply(null, args);

                        if(array?.length < 1) {
                            clearInterval(interval);
                            resolve(array);
                        }
                    }, ms, [].concat(args));
                });
            },
        },

        "sated": {
            value:
            // Makes a Promised setInterval
                // when.sated(condition:function<@@iterable>, ms:number?<integer>) → Promise~any
            async function(condition, ms = 100, ...args) {
                return new Promise((resolve, reject) => {
                    let interval = setInterval(async args => {
                        let array = await condition.apply(null, args);

                        if(array?.length > 0) {
                            clearInterval(interval);
                            resolve(array);
                        }
                    }, ms, [].concat(args));
                });
            },
        },
    });

    Object.defineProperties(when.all, {
        "defined": {
            value:
            // Makes a Promised setInterval. Only executes if ALL conditions pass
                // when.all.defined(...conditions:function) → array<Promise~any[]>
            async function(...conditions) {
                conditions = [].concat(conditions);

                let promises = [];

                for(let condition of conditions)
                    promises.push(new Promise((resolve, reject) => when.defined(condition).then(resolve)));

                return Promise.all(promises);
            },
        },
        "nullish": {
            value:
            // Makes a Promised setInterval. Only executes if ALL conditions pass
                // when.all.nullish(...conditions:function) → array<Promise~any[]>
            async function(...conditions) {
                conditions = [].concat(conditions);

                let promises = [];

                for(let condition of conditions)
                    promises.push(new Promise((resolve, reject) => when.nullish(condition).then(resolve)));

                return Promise.all(promises);
            },
        },
        "empty": {
            value:
            // Makes a Promised setInterval. Only executes if ALL conditions pass
                // when.all.empty(...conditions:function) → array<Promise~any[]>
            async function(...conditions) {
                conditions = [].concat(conditions);

                let promises = [];

                for(let condition of conditions)
                    promises.push(new Promise((resolve, reject) => when.empty(condition).then(resolve)));

                return Promise.all(promises);
            },
        },
        "sated": {
            value:
            // Makes a Promised setInterval. Only executes if ALL conditions pass
                // when.all.sated(...conditions:function) → array<Promise~any[]>
            async function(...conditions) {
                conditions = [].concat(conditions);

                let promises = [];

                for(let condition of conditions)
                    promises.push(new Promise((resolve, reject) => when.sated(condition).then(resolve)));

                return Promise.all(promises);
            },
        },
    });

    Object.defineProperties(when.any, {
        "defined": {
            value:
            // Makes a Promised setInterval. Only executes if ALL conditions pass
                // when.any.defined(...conditions:function) → Promise~any[]
            async function(...conditions) {
                conditions = [].concat(conditions);

                let promises = [];

                for(let condition of conditions)
                    promises.push(new Promise((resolve, reject) => when.defined(condition).then(resolve)));

                return Promise.any(promises);
            },
        },
        "nullish": {
            value:
            // Makes a Promised setInterval. Only executes if ALL conditions pass
                // when.any.nullish(...conditions:function) → Promise~any[]
            async function(...conditions) {
                conditions = [].concat(conditions);

                let promises = [];

                for(let condition of conditions)
                    promises.push(new Promise((resolve, reject) => when.nullish(condition).then(resolve)));

                return Promise.any(promises);
            },
        },
        "empty": {
            value:
            // Makes a Promised setInterval. Only executes if ALL conditions pass
                // when.any.empty(...conditions:function) → Promise~any[]
            async function(...conditions) {
                conditions = [].concat(conditions);

                let promises = [];

                for(let condition of conditions)
                    promises.push(new Promise((resolve, reject) => when.empty(condition).then(resolve)));

                return Promise.any(promises);
            },
        },
        "sated": {
            value:
            // Makes a Promised setInterval. Only executes if ALL conditions pass
                // when.any.sated(...conditions:function) → Promise~any[]
            async function(...conditions) {
                conditions = [].concat(conditions);

                let promises = [];

                for(let condition of conditions)
                    promises.push(new Promise((resolve, reject) => when.sated(condition).then(resolve)));

                return Promise.any(promises);
            },
        },
    });

    Object.defineProperties(when.defined, {
        "pipe": {
            value:
            // Makes a Promised setInterval. Pipes the arguments provided, applying them to both the condition and resolver
                // when.defined.pipe(condition:function<any>, ms:number?<integer>, ...args<any>) → Promise~any[]
            async function(condition, ms = 100, ...args) {
                args = [].concat(args);

                return new Promise((resolve, reject) => {
                    when.defined(condition, ms, ...args).then(resolve.call(null, args));
                });
            },
        },

        "thru": {
            value:
            // Makes a Promised setInterval. Pipes the arguments provided, applying them only on the resolver
                // when.defined.thru(condition:function<any>, ms:number?<integer>, ...args<any>) → Promise~any[]
            async function(condition, ms = 100, ...args) {
                args = [].concat(args);

                return new Promise((resolve, reject) => {
                    when.defined(condition, ms).then(resolve.call(null, args));
                });
            },
        },
    });

    Object.defineProperties(when.nullish, {
        "pipe": {
            value:
            // Makes a Promised setInterval. Pipes the arguments provided, applying them to both the condition and resolver
                // when.nullish.pipe(condition:function<any>, ms:number?<integer>, ...args<any>) → Promise~any[]
            async function(condition, ms = 100, ...args) {
                args = [].concat(args);

                return new Promise((resolve, reject) => {
                    when.nullish(condition, ms, ...args).then(resolve.call(null, args));
                });
            },
        },

        "thru": {
            value:
            // Makes a Promised setInterval. Pipes the arguments provided, applying them only on the resolver
                // when.nullish.thru(condition:function<any>, ms:number?<integer>, ...args<any>) → Promise~any[]
            async function(condition, ms = 100, ...args) {
                args = [].concat(args);

                return new Promise((resolve, reject) => {
                    when.nullish(condition, ms).then(resolve.call(null, args));
                });
            },
        },
    });

    Object.defineProperties(when.empty, {
        "pipe": {
            value:
            // Makes a Promised setInterval. Pipes the arguments provided, applying them to both the condition and resolver
                // when.empty.pipe(condition:function<any>, ms:number?<integer>, ...args<any>) → Promise~any[]
            async function(condition, ms = 100, ...args) {
                args = [].concat(args);

                return new Promise((resolve, reject) => {
                    when.empty(condition, ms, ...args).then(resolve.call(null, args));
                });
            },
        },

        "thru": {
            value:
            // Makes a Promised setInterval. Pipes the arguments provided, applying them only on the resolver
                // when.empty.thru(condition:function<any>, ms:number?<integer>, ...args<any>) → Promise~any[]
            async function(condition, ms = 100, ...args) {
                args = [].concat(args);

                return new Promise((resolve, reject) => {
                    when.empty(condition, ms).then(resolve.call(null, args));
                });
            },
        },
    });

    Object.defineProperties(when.sated, {
        "pipe": {
            value:
            // Makes a Promised setInterval. Pipes the arguments provided, applying them to both the condition and resolver
                // when.sated.pipe(condition:function<any>, ms:number?<integer>, ...args<any>) → Promise~any[]
            async function(condition, ms = 100, ...args) {
                args = [].concat(args);

                return new Promise((resolve, reject) => {
                    when.sated(condition, ms, ...args).then(resolve.call(null, args));
                });
            },
        },

        "thru": {
            value:
            // Makes a Promised setInterval. Pipes the arguments provided, applying them only on the resolver
                // when.sated.thru(condition:function<any>, ms:number?<integer>, ...args<any>) → Promise~any[]
            async function(condition, ms = 100, ...args) {
                args = [].concat(args);

                return new Promise((resolve, reject) => {
                    when.sated(condition, ms).then(resolve.call(null, args));
                });
            },
        },
    });
} catch(error) {
    /* Ignore the error... */
}


/**
 * Waits a set amount of time, then fulfills to a Promise with an optional argument.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Recording_a_media_element#utility_functions
 *
 * @simply wait(delay:number?<integer>, value:any?) → Promise~number
 *
 * @param  {number<integer>} [delay = 100]  The delay to wait for (in milliseconds)
 * @param  {any} value                      The argument to pass to the Promise
 * @return {Promise~any}
 */
function wait(delay = 100, value) {
    return new Promise(resolve => setTimeout(resolve, delay, value));
}

/**
 * Executes a function after a set delay. Optionally, takes a spread of arguments to pass along to the function.
 * Used to delay callbacks to form input until the user is done.
 *
 * @see https://stackoverflow.com/questions/1909441/how-to-delay-the-keyup-handler-until-the-user-stops-typing
 *
 * @simply delay(fn:function, ms:number?<integer>, ...args:<any>) → Function
 *
 * @param  {function} executor          The function to execute after the delayed time
 * @param  {number<integer>} [ms = 0]   The amount of time to delay for (in milliseconds)
 * @param  {any} ...args                The arguments to pass onto the executor
 * @return {function}                   A bound function of the executor
 */
function delay(executor, ms = 0, ...args) {
    let timer = -1;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(executor.bind(this, ...args), ms, ...args);
    }
}

/**
 * Fetches resources with automatic CORS-sense and pathing.
 *
 * @see https://dmitripavlutin.com/timeout-fetch-request/
 *
 * @simply fetchURL(url:string<URL>, options:object?) → Promise~ReadableStream
 *
 * @param  {string<URL>} url        The resource destination
 * @param  {object} [options = {}]  Options to pass along to the fetch request, such as mode, type, body, etc.
 *
 * @property {Map} requests         A map of all requests made during the current session (page load)
 * @property {function} idempotent  <div class="signature">(url:string, options:object<span class="signature-attributes">opt</span>) → {Promise~ReadableStream}</div>
 *                                  <br>Simply returns a fetch but, the request is guaranteed to only execute once per minute.
 * @property {object} origins       A set of origins that can be chosen to proxy from.
 *
 * @return {Promise~ReadableStream}
 *
 * @example // Fetching a local (extension) resource
 * let mani = fetchURL('get:./manifest.json').then(r => r.json()); // JSON
 *
 * // Fetching a global resource
 * let goog = fetchURL('https://google.com').then(r => r.text()); // text/HTML
 *
 * // Fetching a resource but, timing out if not fetched within 5s
 * let fail = fetchURL('https://example.com/failure', { timeout: 5_000 }).then(r => r.text()); // AbortError | text/HTML
 *
 * // Force the fetch to act "natively"
 * let natv = fetchURL('x-moz://example.com/', { native: true }).then(r => r.text()); // text/HTML
 */
function fetchURL(url, options = {}) {
    let empty = Promise.resolve({});
    let { timeout = 0, native = false, foster = fetchURL.origins.BEST, as = 'text' } = options;

    if(!url?.length)
        return empty;

    // <https://www.site.com/path> | /path → https://www.site.com/path | ./path → https://www.site.com/path
    url = url.replace(/^(\.)?\/([^\/])/, location.origin + '/$2');

    // <https://www.site.com/path/to/file> | ../file → https://www.site.com/path/to
    url = url.replace(/^(\.\.)\//, location.origin + location.pathname.split('/').slice(0, -1).join('/'));

    let unknown = Symbol('UNKNOWN');
    let { href, domainPath = [], host, protocol, pathname } = parseURL(url);
    let [domain = unknown, site = unknown, ...subDomain] = domainPath;

    let allowedHosts = 'static-cdn.jtvnw.net'.split(' '),
        allowedSites = 'betterttv blerp githubusercontent nightbot streamelements streamloots twitch twitchinsights twitchtokengenerator'.split(' '),
        allowedDomains = 'gd'.split(' ');

    // No CORS required
    if(false
        || native
        || protocol?.startsWith?.('chrome')
        || protocol?.startsWith?.('get')
        || host?.startsWith?.('.')
        || allowedDomains.contains(domain?.toLowerCase?.())
        || allowedSites.contains(site?.toLowerCase?.())
        || allowedHosts.contains(host?.toLowerCase?.())
    )
        /* Do nothing... */;

    // The URL is malformed
    else if([domain, site].contains(unknown))
        return empty;

    // CORS required
    else {
        options.mode = 'cors';
        switch(foster) {
            // https://www.whateverorigin.org/get?url={ %URL }
            case fetchURL.origins.WHATEVER_ORIGIN: {
                href = `https://www.whateverorigin.org/get?url=${ encodeURIComponent(href) }`;
            } break;

            // https://api.allorigins.win/raw?url={ %URL }
            case fetchURL.origins.ALL_ORIGINS: {
                href = `https://api.allorigins.win/raw?url=${ encodeURIComponent(href) }`;
            } break;

            // https://cors-anywhere.herokuapp.com/{ URL }
            case fetchURL.origins.CORS_ANYWHERE: {
                href = `https://cors-anywhere.herokuapp.com/${ encodeURI(href) }`;
                Object.assign(options.headers ?? {}, { Origin: location.origin });
            } break;

            // https://api.codetabs.com/v1/proxy?quest={ URL }
            case fetchURL.origins.CODE_TABS:
            default: {
                href = `https://api.codetabs.com/v1/proxy?quest=${ encodeURI(href) }`;
            } break;
        }
    }

    if(protocol.startsWith('get'))
        href = Runtime.getURL(href.replace(protocol, ''));

    if(timeout > 0) {
        let controller = new AbortController();
        let timeoutID = setTimeout(() => controller.abort(), timeout);

        // Convert to TEXT/HTML
        if([fetchURL.origins.HTML, fetchURL.origins.HTML_2, fetchURL.origins.HTML_3].contains(foster)
            && as.equals('json')
        )
            return fetch(href, { ...options, signal: controller.signal }).then(async response => {
                clearTimeout(timeoutID);

                return response.text().then(text =>
                    ({
                        async arrayBuffer() {
                            return new Blob([JSON.stringify(text, null, 0)], { type: 'text/plain' }).arrayBuffer();
                        },

                        async blob() {
                            return new Blob([JSON.stringify(text, null, 4)], { type: 'text/plain' });
                        },

                        async json() {
                            return {
                                contents: text,
                                status: {
                                    content_type: `application/json`,
                                    http_code: response.status,
                                    url: response.url,
                                },
                            };
                        },

                        async text() {
                            return contents;
                        },
                    })
                );
            });

        // Convert to JSON
        if([fetchURL.origins.JSON, fetchURL.origins.JSON_2].contains(foster)
            && (false
                || as.equals('html')
                || as.equals('text')
            )
        )
            return fetch(href, { ...options, signal: controller.signal }).then(response => {
                clearTimeout(timeoutID);

                return response.json().then(json =>
                    ({
                        async arrayBuffer() {
                            return new Blob([JSON.stringify(json, null, 0)], { type: 'application/json' }).arrayBuffer();
                        },

                        async blob() {
                            return new Blob([JSON.stringify(json, null, 4)], { type: 'application/json' });
                        },

                        async json() {
                            return json;
                        },

                        async text() {
                            return (null
                                ?? json?.response
                                ?? json?.contents
                                ?? json?.content
                                ?? json?.html
                                ?? json?.text
                                ?? json
                            );
                        },
                    })
                );
            });

        return fetch(href, { ...options, signal: controller.signal }).then(response => {
            clearTimeout(timeoutID);

            return response;
        });
    }

    // Convert to TEXT/HTML
    if([fetchURL.origins.HTML, fetchURL.origins.HTML_2, fetchURL.origins.HTML_3].contains(foster)
        && as.equals('json')
    )
        return fetch(href, options).then(async response => {
            let contents = await response.text();
            let paraphrse = ({
                async arrayBuffer() {
                    return new Blob([contents], { type: 'text/plain' }).arrayBuffer();
                },

                async blob() {
                    return new Blob([contents], { type: 'text/plain' });
                },

                async json() {
                    return {
                        contents,
                        status: {
                            content_type: `application/json`,
                            http_code: response.status,
                            url: response.url,
                        },
                    };
                },

                async text() {
                    return contents;
                },
            });

            return paraphrse;
        });

    // Convert to JSON
    if([fetchURL.origins.JSON, fetchURL.origins.JSON_2].contains(foster)
        && (false
            || as.equals('html')
            || as.equals('text')
        )
    )
        return fetch(href, options).then(async response => {
            let json = await response.json();
            let paraphrse = ({
                async arrayBuffer() {
                    return new Blob([JSON.stringify(json, null, 0)], { type: 'application/json' }).arrayBuffer();
                },

                async blob() {
                    return new Blob([JSON.stringify(json, null, 4)], { type: 'application/json' });
                },

                async json() {
                    return json;
                },

                async text() {
                    return (null
                        ?? json?.response
                        ?? json?.contents
                        ?? json?.content
                        ?? json?.html
                        ?? json?.text
                        ?? json
                    );
                },
            });

            return paraphrse;
        });

    return fetch(href, options);
}

Object.defineProperties(fetchURL, {
    requests: { value: new Map },

    // Reduce duplicates
    idempotent: {
        value: (url, options) => {
            let [request, date] = fetchURL.requests.get(url) ?? [];

            if(nullish(request) || (+new Date - +date > 60_000)) {
                request = fetchURL(url, options);

                fetchURL.requests.set(url, [request, new Date]);
            }

            return request;
        },
    },

    origins: {
        value: {
            ALL_ORIGINS: Symbol('allorigins'),
            CODE_TABS: Symbol('codetabs'),
            CORS_ANYWHERE: Symbol('cors-anywhere'),
            WHATEVER_ORIGIN: Symbol('whateverorigin'),
        }
    },
});

Object.defineProperties(fetchURL.origins, {
    BEST: {
        value: Promise.any([
            fetchURL.origins.CODE_TABS,
            fetchURL.origins.CORS_ANYWHERE,
            fetchURL.origins.ALL_ORIGINS,
            fetchURL.origins.WHATEVER_ORIGIN,
        ].map(foster =>
            fetchURL('https://example.org/', { foster, as: 'native', timeout: 3_000 })
                .then(async r =>
                    r.ok && (r.status >= 100 && r.status < 300) && /\bexample\b/i.test(await r.text())?
                        foster:
                    Promise.reject(`Bad request @${ foster.toString() }`)
                )
            )
        ).catch(IGNORE)
    },

    JSON: { value: fetchURL.origins.WHATEVER_ORIGIN },

    HTML: { value: fetchURL.origins.CODE_TABS },
    HTML_2: { value: fetchURL.origins.ALL_ORIGINS },
    HTML_3: { value: fetchURL.origins.CORS_ANYWHERE },

    TEXT: { value: fetchURL.origins.CODE_TABS },
    TEXT_2: { value: fetchURL.origins.ALL_ORIGINS },
    TEXT_3: { value: fetchURL.origins.CORS_ANYWHERE },
});

Object.defineProperties(fetchURL.origins, {
    JSON_BEST: {
        value: Promise.any([
            fetchURL.origins.JSON,
        ].map(foster =>
            fetchURL('https://example.org/', { foster, as: 'json', timeout: 1_000 })
                .then(async r =>
                    r.ok && (r.status >= 100 && r.status < 300) && /\bexample\b/i.test(await r.text())?
                        foster:
                    Promise.reject(`Bad JSON request @${ foster.toString() }`)
                )
            )
        ).catch(IGNORE)
    },

    HTML_BEST: {
        value: Promise.any([
            fetchURL.origins.HTML,
            fetchURL.origins.HTML_2,
            fetchURL.origins.HTML_3,
        ].map(foster =>
            fetchURL('https://example.org/', { foster, as: 'html', timeout: 1_000 })
                .then(async r =>
                    r.ok && (r.status >= 100 && r.status < 300) && /\bexample\b/i.test(await r.text())?
                        foster:
                    Promise.reject(`Bad HTML request @${ foster.toString() }`)
                )
            )
        ).catch(IGNORE)
    },

    TEXT_BEST: {
        value: Promise.any([
            fetchURL.origins.TEXT,
            fetchURL.origins.TEXT_2,
            fetchURL.origins.TEXT_3,
        ].map(foster =>
            fetchURL('https://example.org/', { foster, as: 'text', timeout: 1_000 })
                .then(async r =>
                    r.ok && (r.status >= 100 && r.status < 300) && /\bexample\b/i.test(await r.text())?
                        foster:
                    Promise.reject(`Bad text request @${ foster.toString() }`)
                )
            )
        ).catch(IGNORE)
    },
});

/** Facilitates communication and storage between extension contexts (background vs. content).
 * @see https://developer.chrome.com/docs/extensions/reference/storage/
 *
 * @prop {function} get     <div class="signature">(properties:(string|array&lt;string&gt;)<span class="signature-attributes">opt, nullable</span>) → {Promise~object}</div>
 *                          <br>Fetches data from the extension's long-term storage
 *                          <br><ul>
 *                          <li><code class=prettyprint>properties <i>&rArr; null</i></code> &mdash; The properties (settings) to fetch. If <i>null</i>, all settings are fetched</li>
 *                          </ul>
 * @prop {function} set     <div class="signature">(properties:object<span class="signature-attributes">opt</span>) → {void}</div>
 *                          <br>Sets (writes) data to the extension's long-term storage
 *                          <br><ul>
 *                          <li><code class=prettyprint>properties <i>&rArr; {}</i></code> &mdash; A <i>key</i>:<i>value</i> object describing the data to be saved. The <i>key</i> is the name of the entry, and the <i>value</i> is the value (data)</li>
 *                          </ul>
 * @prop {function} remove  <div class="signature">(properties:(string|array&lt;string&gt;)<span class="signature-attributes">opt, nullable</span>) → {void}</div>
 *                          <br>Removes named entries from the extension's long-term storage
 *                          <br><ul>
 *                          <li><code class=prettyprint>properties <i>&rArr; []</i></code> &mdash; The properties (settings) to remove from storage</li>
 *                          </ul>
 */
let Settings = window.Settings = {
    get(properties = null) {
        return new Promise((resolve, reject) => {
            function ParseSettings(settings) {
                for(let setting in settings)
                    Settings[setting] = settings[setting] ?? null;

                resolve(Settings);
            }

            window.Storage.get(properties, settings =>
                window.Runtime.lastError?
                    window.Storage.get(null, ParseSettings):
                ParseSettings(settings)
            );
        });
    },

    set(properties = {}) {
        for(let key in properties)
            Settings[key] = properties[key];

        return Storage.set(properties);
    },

    remove(properties = []) {
        let removed = {};

        if(properties instanceof String)
            properties = [properties];

        for(let key of properties)
            removed[key] = Settings[key];

        return Storage.remove(properties);
    },
};


/** Used to manage page storage using {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage localStorage} and {@link https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API IndexedDB}.
 *
 * @prop {function} save            <div class="signature"><span class="signature-attributes">async</span>(properties:object<span class="signature-attributes">opt, non-nullable</span>, callback:function<span class="signature-attributes">opt, nullable</span>) → {void}</div>
 *                                  <br>Saves data to the page's storage
 *                                  <br><ul>
 *                                  <li><code class=prettyprint>properties <i>&rArr; {}</i></code> &mdash; The properties (settings) to save (<code class=prettyprint>{ key: value }</code>)</li>
 *                                  <li><code class=prettyprint>callback <i>&rArr; null</i></code> &mdash; The callback to execute after the save has completed</li>
 *                                  </ul>
 * @prop {function} load            <div class="signature"><span class="signature-attributes">async</span>(properties:({ ...names } | string[] | string)<span class="signature-attributes">opt, nullable</span>, callback:function<span class="signature-attributes">opt, nullable</span>) → {Promise~object}</div>
 *                                  <br>Loads data from the page's storage
 *                                  <br><ul>
 *                                  <li><code class=prettyprint>properties <i>&rArr; null</i></code> &mdash; The properties (settings) to load. If <i>null</i>, all entries are returned</li>
 *                                  <li><code class=prettyprint>callback <i>&rArr; null</i></code> &mdash; A promise of the properties (settings) loaded (<code class=prettyprint>{ key: value }</code>)</li>
 *                                  </ul>
 * @prop {function} remove          <div class="signature"><span class="signature-attributes">async</span>(properties:({ ...names } | string[] | string)<span class="signature-attributes">opt, nullable</span>, callback:function<span class="signature-attributes">opt, nullable</span>) → {Promise~object}</div>
 *                                  <br>Removes data from the page's storage
 *                                  <br><ul>
 *                                  <li><code class=prettyprint>properties <i>&rArr; null</i></code> &mdash; The properties (settings) to remove. If <i>null</i>, all entries are removed</li>
 *                                  <li><code class=prettyprint>callback <i>&rArr; null</i></code> &mdash; A promise of the properties (settings) removed (<code class=prettyprint>{ key: value }</code>)</li>
 *                                  </ul>
 * @prop {function} getBytesInUse   <div class="signature"><span class="signature-attributes">async</span>(properties:({ ...names } | string[] | string)<span class="signature-attributes">opt, nullable</span>) → {Promise~number}</div>
 *                                  <br>Returns the number of bytes in use
 *                                  <br><ul>
 *                                  <li><code class=prettyprint>properties <i>&rArr; null</i></code> &mdash; The properties (settings) to query. If <i>null</i>, all entries are queried</li>
 *                                  <li><code class=prettyprint>return <i>{Promise~number}</i></code> &mdash; The number of bytes in use</li>
 *                                  </ul>
 * @prop {function} keys            <div class="signature"><span class="signature-attributes">async</span>() → {Promise~array&lt;string&gt;}</div>
 *                                  <br>Returns the keys of the <b>Cache</b> storage
 *                                  <br><ul>
 *                                  <li><code class=prettyprint>return <i>{Promise~array&lt;string&gt;}</i></code> &mdash; The keys of <b>Cache</b></li>
 *                                  </ul>
 * @prop {object} large             Used to manage <b>large</b> (&gt; 5MiB) page storage using {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage localStorage} and {@link https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API IndexedDB}.
 *                                  <br>
 *                                  <br>Also contains: <b><code>Cache.large.save</code></b>, <b><code>Cache.large.load</code></b>, <b><code>Cache.large.remove</code></b>, <b><code>Cache.large.getBytesInUse</code></b>, <b><code>Cache.large.keys</code></b>; each has the same argument signature as <code>Cache</code>
 */
let Cache = window.Cache = {
    async save(properties = {}, callback = null) {
        let set = (key, value) => CacheStorageArea.setItem(`ext.twitch-tools/${ encodeURI(key) }`, value);

        for(let key in properties)
            set(key, JSON.stringify(properties[key]));

        if(typeof callback == 'function')
            callback();
    },

    async load(properties = null, callback = null) {
        let results = {};
        let get = key => {
                let value =
                    // New save name
                    CacheStorageArea.getItem(`ext.twitch-tools/${ encodeURI(key) }`);
                    // Old save name
                    // if (value === undefined)
                    //     value = CacheStorageArea.getItem(key);

                try {
                    value = JSON.parse(value);
                } catch(error) {
                    // Suppress
                }

                return value;
            };

        properties ??= await Cache.keys();

        switch(properties.constructor) {
            case String:
                results[properties] = get(properties);
                break;

            case Array:
                for(let key of properties)
                    results[key] = get(key);
                break;

            case Object:
                for(let key in properties)
                    results[key] = get(key) ?? properties[key];
                break;
        }

        if(typeof callback == 'function')
            callback(results);

        return new Promise((resolve, reject) => {
            try {
                resolve(results);
            } catch(error) {
                reject(error);
            }
        });
    },

    async remove(properties, callback = null) {
        let results = {};
        let remove = key => CacheStorageArea.removeItem(`ext.twitch-tools/${ encodeURI(key) }`),
            get = key => {
                let value = CacheStorageArea.getItem(`ext.twitch-tools/${ encodeURI(key) }`);

                try {
                    value = JSON.parse(value);
                } catch(error) {
                    // Suppress
                }

                return value;
            };

        if(nullish(properties))
            return;

        switch(properties.constructor) {
            case String:
                results[properties] = get(properties);
                remove(properties);
                break;

            case Array:
                for(let key of properties) {
                    results[key] = get(key);
                    remove(key);
                }
                break;

            case Object:
                for(let key in properties) {
                    results[key] = get(key);
                    remove(key);
                }
                break;
        }

        if(typeof callback == 'function')
            callback(results);

        return new Promise((resolve, reject) => {
            try {
                resolve(results);
            } catch(error) {
                reject(error);
            }
        });
    },

    async getBytesInUse(properties) {
        let bytesUsed = 0;
        let size = key => {
                let value =
                    // New save name
                    CacheStorageArea.getItem(`ext.twitch-tools/${ encodeURI(key) }`);
                    // Old save name
                    // if (value === undefined)
                    //     value = CacheStorageArea.getItem(key);

                try {
                    value = JSON.parse(value);
                } catch(error) {
                    // Suppress
                }

                return (key?.length | 0) + (JSON.stringify(value)?.length | 0);
            };

        properties ??= await Cache.keys();

        switch(properties.constructor) {
            case String:
                bytesUsed += size(properties);
                break;

            case Array:
                for(let key of properties)
                    bytesUsed += size(key);
                break;

            case Object:
                for(let key in properties)
                    bytesUsed += size(key) ?? ((key?.length | 0) + (JSON.stringify(properties[key])?.length | 0));
                break;
        }

        if(typeof callback == 'function')
            callback(bytesUsed);

        return new Promise((resolve, reject) => {
            try {
                resolve(bytesUsed);
            } catch(error) {
                reject(error);
            }
        });
    },

    async keys() {
        return [...Object.keys(CacheStorageArea)].filter(key => key.startsWith('ext.twitch-tools/')).map(key => key.replace('ext.twitch-tools/', ''));
    },

    large: {
        async save(keys = {}, callback = null) {
            let set = (key, value) => LargeCacheStorageArea.setItem(key, value);

            for(let key in keys)
                set(key, keys[key]);

            if(typeof callback == 'function')
                callback();
        },

        async load(keys = null, callback = null) {
            let results = {};
            let get = key => LargeCacheStorageArea.getItem(key);

            keys ??= await Cache.large.keys();

            switch(keys.constructor) {
                case String:
                    results[keys] = await get(keys);
                    break;

                case Array:
                    for(let key of keys)
                        results[key] = await get(key);
                    break;

                case Object:
                    for(let key in keys)
                        results[key] = await get(key) ?? keys[key];
                    break;
            }

            if(typeof callback == 'function')
                callback(results);

            return new Promise((resolve, reject) => {
                try {
                    resolve(results);
                } catch(error) {
                    reject(error);
                }
            });
        },

        async remove(keys, callback = null) {
            let results = {};
            let remove = key => LargeCacheStorageArea.removeItem(key),
                get = key => LargeCacheStorageArea.getItem(key);

            if(nullish(keys))
                return;

            switch(keys.constructor) {
                case String:
                    results[keys] = await get(keys);
                    remove(keys);
                    break;

                case Array:
                    for(let key of keys) {
                        results[key] = await get(key);
                        remove(key);
                    }
                    break;

                case Object:
                    for(let key in keys) {
                        results[key] = await get(key);
                        remove(key);
                    }
                    break;
            }

            if(typeof callback == 'function')
                callback(results);

            return new Promise((resolve, reject) => {
                try {
                    resolve(results);
                } catch(error) {
                    reject(error);
                }
            });
        },

        async getBytesInUse(keys) {
            let bytesUsed = 0;
            let size = async key => (key?.length | 0) + (JSON.stringify(await LargeCacheStorageArea.getItem(key))?.length | 0);

            keys ??= await Cache.large.keys();

            switch(keys.constructor) {
                case String:
                    bytesUsed += await size(keys);
                    break;

                case Array:
                    for(let key of keys)
                        bytesUsed += await size(key);
                    break;

                case Object:
                    for(let key in keys)
                        bytesUsed += await size(key);
                    break;
            }

            if(typeof callback == 'function')
                callback(bytesUsed);

            return new Promise((resolve, reject) => {
                try {
                    resolve(bytesUsed);
                } catch(error) {
                    reject(error);
                }
            });
        },

        async keys() {
            return LargeCacheStorageArea.keys();
        },
    },
};

/**
 * Converts strings into RegExps. Used for grouping similar function names.
 *
 * @param  {string} feature The expression to convert to RegExp
 * @return {RegExp}         The RegExp (pattern) that describes the function name(s)
 *
 *
 * @example // Simple expressions
 * // RegExp lookers
 *      // `X(?=Y)`     - match X if before Y       → \d+(?=\$)     → 1 turkey costs 20$    → 20
 *      // `X(?!Y)`     - match X if not before Y   → \d+(?!\$)     → 3 turkeys costs 40$   → 3
 *      // `(?<=Y)X`    - match X if after Y        → (?<=\$)\d+    → 5 turkeys costs $60   → 60
 *      // `(?<!Y)X`    - match X if not after Y    → (?<!\$)\d+    → 7 turkeys costs $80   → 7
 * // AsteriskFn symbols
 *      // `.`         - 1 character
 *      // `?`         - 0 or 1 character
 *      // `+`         - 1 or more (word) characters
 *      // `*`         - 0 or more (word) characters
 *      // `X#`        - 0 or more charactrers that are NOT "_"
 *      // `X~Y`       - X NOT followed by Y
 *
 * let SENSITIVE_FEATURES = ['away_mode*~schedule'                , 'fine_details'   , 'first_in_line*'          , 'prevent_#'         , '!up_next+'          ].map(AsteriskFn);
 * //                     → [/^(away_mode([\w-]*))(?<!schedule)$/i, /^fine_details$/i, /^first_in_line([\w-]*)$/i, /^prevent_([^_]+)$/i, /^!up_next([\w-]+)$/i]
 * //                                                                                                                                    ↑ Entry ignored (intentional)
 *
 * let NORMALIZED_FEATURES = ['away_mode*~schedule'                , 'auto_follow+'          , 'first_in_line*'          , 'prevent_#'         , 'kill+'          ].map(AsteriskFn);
 * //                      → [/^(away_mode([\w-]*))(?<!schedule)$/i, /^auto_follow([\w-]+)$/i, /^first_in_line([\w-]*)$/i, /^prevent_([^_]+)$/i, /^kill([\w-]+)$/i]
 */
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

/**
 * @namespace window
 * @desc These belong to the current window (occasionally a sub-frame).
 */
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

            Storage = Storage.local ?? Storage.sync;
        } break;

        case 'chrome':
        default: {
            Runtime = Container.runtime;
            Storage = Container.storage;
            Extension = Container.extension;
            Manifest = Runtime.getManifest();

            Storage = Storage.local ?? Storage.sync;
        } break;
    }

    /** @memberof window
     * @prop {object<Runtime>} Runtime - The extension runtime
     * @see https://developer.chrome.com/docs/extensions/reference/runtime/
     */
    window.Runtime = Runtime;

    /** @memberof window
    * @prop {object<Storage>} Storage - The extension storage
    * @see https://developer.chrome.com/docs/extensions/reference/storage/
    */
    window.Storage = Storage;

    /** @memberof window
    * @prop {object<Extension>} Extension - The extension context
    * @see https://developer.chrome.com/docs/extensions/reference/extension/
    */
    window.Extension = Extension;

    /** @memberof window
    * @prop {object<ExtensionContainer>} Container - The extension container (<code>chrome</code> or <code>browser</code>)
    * @see https://developer.chrome.com/docs/extensions/reference/
    */
    window.Container = Container;

    /** @memberof window
    * @prop {object<Manifest>} Manifest - The extension's manifest
    * @see https://developer.chrome.com/docs/extensions/mv3/intro/mv3-overview/
    */
    window.Manifest = Manifest;

    let { CHROME_UPDATE, INSTALL, SHARED_MODULE_UPDATE, UPDATE } = Runtime.OnInstalledReason;

    window.CHROME_UPDATE = CHROME_UPDATE;
    window.INSTALL = INSTALL;
    window.SHARED_MODULE_UPDATE = SHARED_MODULE_UPDATE;
    window.UPDATE = UPDATE;

    /** @memberof window
    * @prop {object<StorageArea>} CacheStorageArea - The extension's "small" (&le; 5MiB) storage area
    * @see https://developer.chrome.com/docs/extensions/reference/storage/
    */
    let CacheStorageArea = localStorage ?? sessionStorage;

    window.CacheStorageArea = CacheStorageArea;

    /** @memberof window
    * @prop {object<(IndexedDB|StorageArea)>} LargeCacheStorageArea - The extension's "large" (&gt; 5MiB) storage area
    * @see https://github.com/localForage/localForage#readme
    */
    let LargeCacheStorageArea = localforage;

    LargeCacheStorageArea.config({
        name: Manifest.name,
        storeName: Manifest.name,
        version: Manifest.version,
        description: Manifest.description,
        driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
    });

    window.LargeCacheStorageArea = LargeCacheStorageArea;

    // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //

    /** @memberof window
    * @prop {object} Jobs - All running or ran jobs
    */
    let Jobs = {};

    /** @memberof window
    * @prop {object} Jobs - All running or ran timers (with a corresponding job). A <b>positive</b> (&ge; 0) value creates an interval. A <b>negative</b> (&lt; 0) value creates a time-out
    */
    let Timers = {};

    /** @memberof window
    * @prop {object} Jobs - All handlers (functions) that may be run
    */
    let Handlers = { __reasons__: new Map() };

    /** @memberof window
    * @prop {object} Jobs - All unhandlers (destructing functions) that may be run
    */
    let Unhandlers = { __reasons__: new Map() };

    window.Jobs = Jobs;
    window.Timers = Timers;
    window.Handlers = Handlers;
    window.Unhandlers = Unhandlers;

    /** Registers a job to be run
     * @simply RegisterJob(JobName:string, JobReason:string?) → Number<IntervalID>
     *
     * @param  {function} JobName               The job (function) to register and run
     * @param  {string} [JobReason = "default"] The reason for the job's creation; used for debugging
     * @return {number}
     */
    function RegisterJob(JobName, JobReason = 'default') {
        RegisterJob.__reason__ = JobReason;

        return Jobs[JobName] ??= Timers[JobName] > 0?
            setInterval(Handlers[JobName], Timers[JobName]):
        -setTimeout(Handlers[JobName], -Timers[JobName]);
    }
    Handlers.__reasons__.set('RegisterJob', UUID.from(RegisterJob).value);

    /** Unregisters (stops) a job
     * @simply UnregisterJob(JobName:string, JobReason:string?) → undefined
     *
     * @param  {string} JobName                 The job's name to unregister
     * @param  {string} [JobReason = "default"] The reason for the job's destruction; used for debugging
     * @return {void}
     */
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

    /** Restarts (unregisters, then registers) a job
     * @simply RestartJob(JobName:string, JobReason:string?) → undefined
     *
     * @param  {string} JobName                 The job's name to restart
     * @param  {string} [JobReason = "default"] The reason for the job's restart; used for debugging
     * @return {void}
     */
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
