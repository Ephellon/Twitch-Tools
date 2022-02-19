/*** /polyfill.js
 *      _____      _        __ _ _ _   _
 *     |  __ \    | |      / _(_) | | (_)
 *     | |__) |__ | |_   _| |_ _| | |  _ ___
 *     |  ___/ _ \| | | | |  _| | | | | / __|
 *     | |  | (_) | | |_| | | | | | |_| \__ \
 *     |_|   \___/|_|\__, |_| |_|_|_(_) |___/
 *                    __/ |          _/ |
 *                   |___/          |__/
 */
/***
 *      ______                _   _
 *     |  ____|              | | (_)
 *     | |__ _   _ _ __   ___| |_ _  ___  _ __  ___
 *     |  __| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
 *     | |  | |_| | | | | (__| |_| | (_) | | | \__ \
 *     |_|   \__,_|_| |_|\___|\__|_|\___/|_| |_|___/
 *
 *
 */
// Parse a URL
    // parseURL(url:string) → Object
function parseURL(url) {
    if(!defined(url))
        return {};

    url = url.toString();

    let data = url.match(/^((([^:\/?#]+):)?(?:\/\/)?)(?:([^:]*):([^@]*)@)?(([^:\/?#]*)?(?:\:(\d+))?)?([^?#]*)(\?[^#]*)?(#.*)?$/),
        i    = 0,
        e    = "";

    data = data || e;

    return {
        href:            (data[i++] ?? e),
        origin:          (data[i++] ?? e) + (data[i + 4] ?? e),
        protocol:        (data[i++] ?? e),
        scheme:          (data[i++] ?? e),
        username:        (data[i++] ?? e),
        password:        (data[i++] ?? e),
        host:            (data[i++] ?? e),
        domainPath:      (data[i]   ?? e).split('.').reverse(),
        hostname:        (data[i++] ?? e),
        port:            (data[i++] ?? e),
        pathname:        (data[i++] ?? e),
        search:          (data[i]   ?? e),
        searchParameters: (sd => {
            parsing:
            for(var i = 0, s = {}, e = "", d = sd.slice(1, sd.length).split('&'), n, p, c; sd != e && i < d.length; i++) {
                c = d[i].split('=');
                n = c[0] || e;

                p = c.slice(1, c.length).join('=');

                s[n] = (s[n] != undefined)?
                    s[n] instanceof Array?
                s[n].concat(p):
                    [s[n], p]:
                p;
            }

            return s;
        })(data[i++] || e),
        hash:            (data[i++] || e),

        pushToSearch(parameters, overwrite = false) {
            if(typeof url == 'string')
                url = parseURL(url);

            let { origin, pathname, hash, searchParameters } = url;

            if(overwrite)
                searchParameters = Object.entries({ ...searchParameters, ...parameters });
            else
                searchParameters = [searchParameters, parameters].map(Object.entries).flat();

            searchParameters = '?' + searchParameters.map(parameter => parameter.join('=')).join('&');

            return parseURL(origin + pathname + searchParameters + hash);
        },
    };
}

// Create elements
    // furnish(tagname:string[, attributes:object[, ...children]]) → Element
function furnish(TAGNAME, ATTRIBUTES = {}, ...CHILDREN) {
    let u = v => v && v.length,
        R = RegExp,
        name = TAGNAME,
        attributes = ATTRIBUTES,
        children = CHILDREN;

    if( !u(name) )
        throw TypeError(`TAGNAME cannot be ${ (name === '')? 'unknown': name }`);

    let options = attributes.is === true? { is: true }: null;

    delete attributes.is;

    name = name.split(/([#\.][^#\.\[\]]+)/).filter( u );

    if(name.length <= 1)
        name = name[0].split(/^([^\[\]]+)(\[.+\])/).filter( u );

    if(name.length > 1)
        for(let n = name, i = 1, l = n.length, t, v; i < l; i++)
            if((v = n[i].slice(1, n[i].length)) && (t = n[i][0]) == '#')
                attributes.id = v;
            else if(t == '.')
                attributes.classList = [].slice.call(attributes.classList ?? []).concat(v);
            else if(/\[(.+)\]/.test(n[i]))
                R.$1.split('][').forEach(N => attributes[(N = N.replace(/\s*=\s*(?:("?)([^]*)\1)?/, '=$2').split('=', 2))[0]] = N[1] || '');
    name = name[0];

    let element = document.createElement(name, options);

    if(attributes.classList instanceof Array)
        attributes.classList = attributes.classList.join(' ');

    Object.entries(attributes).forEach(
        ([name, value]) => (/^(on|(?:(?:inner|outer)(?:HTML|Text)|textContent|class(?:List|Name)|value)$)/.test(name))?
            (/^on/.test(name))?
                element.addEventListener(name.replace(/^on/, ''), value):
            element[name] = value:
        element.setAttribute(name, value)
    );

    children
        .filter( defined )
        .forEach( child => element.append(child) );

    return element;
}

// Gets the X and Y offset (in pixels)
    // getOffset(element:Element) → Object={ height:number, width:number, left:number, top:number, right:number, bottom:number }
function getOffset(element) {
    let bounds = element.getBoundingClientRect(),
        { height, width } = bounds;

    return {
        height, width,

        left:   bounds.left + (top.pageXOffset ?? document.documentElement.scrollLeft ?? 0) | 0,
        top:    bounds.top  + (top.pageYOffset ?? document.documentElement.scrollTop  ?? 0) | 0,

        right:  bounds.right  + (top.pageXOffset ?? document.documentElement.scrollLeft ?? 0) | 0,
        bottom: bounds.bottom + (top.pageYOffset ?? document.documentElement.scrollTop  ?? 0) | 0,
    };
}

// Convert milliseconds into a human-readable string
    // toTimeString([milliseconds:number[, format:string]]) → String
function toTimeString(milliseconds = 0, format = 'natural') {
    let second = 1000,
        minute = 60 * second,
        hour   = 60 * minute,
        day    = 24 * hour,
        year   = 365 * day;

    let time = [],
        times = new Map([
            ['year'  ,   year],
            ['day'   ,    day],
            ['hour'  ,   hour],
            ['minute', minute],
            ['second', second],
        ]),
        result;

    let joining_symbol = ' ',
        sign = (milliseconds < 0? '-': ''),
        originalTime = milliseconds;

    milliseconds = Math.abs(milliseconds);

    switch(format) {
        case 'natural': {
            for(let [name, value] of times)
                if(milliseconds >= value) {
                    let amount = (milliseconds / value) | 0;

                    time.push(`${ amount } ${ name.pluralSuffix(amount) }`);

                    milliseconds -= amount * value;
                }

            if(time.length > 1)
                time.splice(-1, 0, 'and');

            result = time;
        } break;

        case 'clock':
            format = '!hour:!minute:!second';

        default: {
            joining_symbol = '';

            for(let [name, value] of times)
                if(milliseconds >= value) {
                    let amount = (milliseconds / value) | 0;

                    time.push(time[name] = (amount + '').padStart(2, '00'));

                    milliseconds -= amount * value;
                }

            times.set('millisecond', milliseconds);

            result = format
                // Replace the text
                .split(/([\!\?](?:year|day|hour|minute|(?:milli)?second))s?(?:\b|_)/g)
                .map($1 => {
                    let [command, ...argument] = $1;

                    argument = argument.join('');

                    switch(command) {
                        case '?': {
                            for(let [name, value] of times)
                                if(argument == 'millisecond')
                                    return milliseconds;
                                else if(argument == name)
                                    return Math.round(originalTime / times.get(name));
                        } break;

                        case '!': {
                            for(let [name, value] of times)
                                if(argument == 'millisecond')
                                    return milliseconds;
                                else if(argument == name)
                                    return time[name] ?? '00';
                        } break;
                    }

                    return $1;
                });
        } break;
    }

    return sign + result.join(joining_symbol);
}

// Convert a time-formatted string into its corresponding millisecond value
    // parseTime([time:string]) → Number
function parseTime(time = '') {
    let units = [1000, 60, 60, 24, 365].map((unit, index, array) => (array.slice(0, index).map(u => unit *= u), unit)),
        ms = 0;

    for(let unit of time.split(':').reverse())
        ms += parseInt(unit) * units.splice(0,1)[0];

    return ms;
}

// Convert boolean values
    // parseBool(value:*) → Boolean
function parseBool(value = null) {
    switch(value) {
        case "undefined":
        case undefined:
        case "false":
        case "null":
        case false:
        case null:
        case "[]":
        case "{}":
        case "0":
        case "":
        case []:
        case {}:
        case 0:
            return false;

        default:
            return (["bigint", "number"].contains(typeof value)? !Number.isNaN(value): true);
    }
}

// Encodes HTML to be HTML-embed friendly
    // encodeHTML([string:string]) → String
function encodeHTML(string = '') {
    for(let { char, html, dec, hex } of decodeHTML.table)
        string = string.replaceAll(char, html);

    return string;
}

// Decodes HTML-embedded text
    // decodeHTML([string:string]) → String
function decodeHTML(string = '') {
    return string.replace(/&(#x?\d+|[a-z]+);/ig, ($0, $1, $$, $_) => decodeHTML.table.find(({ html }) => html == $0)?.char ?? $0);
}

decodeHTML.table ??= [
    // Punctuation
    {
        "char": "&",
        "html": "&amp;",
        "dec": "&#38;",
        "hex": "&#x26;"
    },
    {
        "char": "\"",
        "html": "&quot;",
        "dec": "&#34;",
        "hex": "&#x22;"
    },
    {
        "char": "<",
        "html": "&lt;",
        "dec": "&#60;",
        "hex": "&#x3C;"
    },
    {
        "char": ">",
        "html": "&gt;",
        "dec": "&#62;",
        "hex": "&#x3E;"
    },
    {
        "char": "‘",
        "html": "&lsquo;",
        "dec": "&#8216;",
        "hex": "&#x2018;"
    },
    {
        "char": "’",
        "html": "&rsquo;",
        "dec": "&#8217;",
        "hex": "&#x2019;"
    },
    {
        "char": "“",
        "html": "&ldquo;",
        "dec": "&#8220;",
        "hex": "&#x201C;"
    },
    {
        "char": "”",
        "html": "&rdquo;",
        "dec": "&#8221;",
        "hex": "&#x201D;"
    },
    {
        "char": "‚",
        "html": "&sbquo;",
        "dec": "&#8218;",
        "hex": "&#x201A;"
    },
    {
        "char": "„",
        "html": "&bdquo;",
        "dec": "&#8222;",
        "hex": "&#x201E;"
    },
    {
        "char": "′",
        "html": "&prime;",
        "dec": "&#8242;",
        "hex": "&#x2032;"
    },
    {
        "char": "″",
        "html": "&Prime;",
        "dec": "&#8243;",
        "hex": "&#x2033;"
    },
    {
        "char": " ",
        "html": "&nbsp;",
        "dec": "&#160;",
        "hex": "&#xA0;"
    },
    {
        "char": "–",
        "html": "&ndash;",
        "dec": "&#8211;",
        "hex": "&#x2013;"
    },
    {
        "char": "—",
        "html": "&mdash;",
        "dec": "&#8212;",
        "hex": "&#x2014;"
    },
    {
        "char": " ",
        "html": "&ensp;",
        "dec": "&#8194;",
        "hex": "&#x2002;"
    },
    {
        "char": " ",
        "html": "&emsp;",
        "dec": "&#8195;",
        "hex": "&#x2003;"
    },
    {
        "char": " ",
        "html": "&thinsp;",
        "dec": "&#8201;",
        "hex": "&#x2009;"
    },
    {
        "char": "¦",
        "html": "&brvbar;",
        "dec": "&#166;",
        "hex": "&#xA6;"
    },
    {
        "char": "•",
        "html": "&bull;",
        "dec": "&#8226;",
        "hex": "&#x2022;"
    },
    {
        "char": "…",
        "html": "&hellip;",
        "dec": "&#8230;",
        "hex": "&#x2026;"
    },
    {
        "char": "ˆ",
        "html": "&circ;",
        "dec": "&#710;",
        "hex": "&#x2C6;"
    },
    {
        "char": "¨",
        "html": "&uml;",
        "dec": "&#168;",
        "hex": "&#xA8;"
    },
    {
        "char": "˜",
        "html": "&tilde;",
        "dec": "&#732;",
        "hex": "&#x2DC;"
    },
    {
        "char": "‹",
        "html": "&lsaquo;",
        "dec": "&#8249;",
        "hex": "&#x2039;"
    },
    {
        "char": "›",
        "html": "&rsaquo;",
        "dec": "&#8250;",
        "hex": "&#x203A;"
    },
    {
        "char": "«",
        "html": "&laquo;",
        "dec": "&#171;",
        "hex": "&#xAB;"
    },
    {
        "char": "»",
        "html": "&raquo;",
        "dec": "&#187;",
        "hex": "&#xBB;"
    },
    {
        "char": "‾",
        "html": "&oline;",
        "dec": "&#8254;",
        "hex": "&#x203E;"
    },
    {
        "char": "¿",
        "html": "&iquest;",
        "dec": "&#191;",
        "hex": "&#xBF;"
    },
    {
        "char": "¡",
        "html": "&iexcl;",
        "dec": "&#161;",
        "hex": "&#xA1;"
    },

    // Latin
    {
        "char": "À",
        "html": "&Agrave;",
        "dec": "&#192;",
        "hex": "&#xC0;"
    },
    {
        "char": "Á",
        "html": "&Aacute;",
        "dec": "&#193;",
        "hex": "&#xC1;"
    },
    {
        "char": "Â",
        "html": "&Acirc;",
        "dec": "&#194;",
        "hex": "&#xC2;"
    },
    {
        "char": "Ã",
        "html": "&Atilde;",
        "dec": "&#195;",
        "hex": "&#xC3;"
    },
    {
        "char": "Ä",
        "html": "&Auml;",
        "dec": "&#196;",
        "hex": "&#xC4;"
    },
    {
        "char": "Å",
        "html": "&Aring;",
        "dec": "&#197;",
        "hex": "&#xC5;"
    },
    {
        "char": "Æ",
        "html": "&AElig;",
        "dec": "&#198;",
        "hex": "&#xC6;"
    },
    {
        "char": "Ç",
        "html": "&Ccedil;",
        "dec": "&#199;",
        "hex": "&#xC7;"
    },
    {
        "char": "È",
        "html": "&Egrave;",
        "dec": "&#200;",
        "hex": "&#xC8;"
    },
    {
        "char": "É",
        "html": "&Eacute;",
        "dec": "&#201;",
        "hex": "&#xC9;"
    },
    {
        "char": "Ê",
        "html": "&Ecirc;",
        "dec": "&#202;",
        "hex": "&#xCA;"
    },
    {
        "char": "Ë",
        "html": "&Euml;",
        "dec": "&#203;",
        "hex": "&#xCB;"
    },
    {
        "char": "Ì",
        "html": "&Igrave;",
        "dec": "&#204;",
        "hex": "&#xCC;"
    },
    {
        "char": "Í",
        "html": "&Iacute;",
        "dec": "&#205;",
        "hex": "&#xCD;"
    },
    {
        "char": "Î",
        "html": "&Icirc;",
        "dec": "&#206;",
        "hex": "&#xCE;"
    },
    {
        "char": "Ï",
        "html": "&Iuml;",
        "dec": "&#207;",
        "hex": "&#xCF;"
    },
    {
        "char": "Ð",
        "html": "&ETH;",
        "dec": "&#208;",
        "hex": "&#xD0;"
    },
    {
        "char": "Ñ",
        "html": "&Ntilde;",
        "dec": "&#209;",
        "hex": "&#xD1;"
    },
    {
        "char": "Ò",
        "html": "&Ograve;",
        "dec": "&#210;",
        "hex": "&#xD2;"
    },
    {
        "char": "Ó",
        "html": "&Oacute;",
        "dec": "&#211;",
        "hex": "&#xD3;"
    },
    {
        "char": "Ô",
        "html": "&Ocirc;",
        "dec": "&#212;",
        "hex": "&#xD4;"
    },
    {
        "char": "Õ",
        "html": "&Otilde;",
        "dec": "&#213;",
        "hex": "&#xD5;"
    },
    {
        "char": "Ö",
        "html": "&Ouml;",
        "dec": "&#214;",
        "hex": "&#xD6;"
    },
    {
        "char": "Ø",
        "html": "&Oslash;",
        "dec": "&#216;",
        "hex": "&#xD8;"
    },
    {
        "char": "Œ",
        "html": "&OElig;",
        "dec": "&#338;",
        "hex": "&#x152;"
    },
    {
        "char": "Š",
        "html": "&Scaron;",
        "dec": "&#352;",
        "hex": "&#x160;"
    },
    {
        "char": "Ù",
        "html": "&Ugrave;",
        "dec": "&#217;",
        "hex": "&#xD9;"
    },
    {
        "char": "Ú",
        "html": "&Uacute;",
        "dec": "&#218;",
        "hex": "&#xDA;"
    },
    {
        "char": "Û",
        "html": "&Ucirc;",
        "dec": "&#219;",
        "hex": "&#xDB;"
    },
    {
        "char": "Ü",
        "html": "&Uuml;",
        "dec": "&#220;",
        "hex": "&#xDC;"
    },
    {
        "char": "Ý",
        "html": "&Yacute;",
        "dec": "&#221;",
        "hex": "&#xDD;"
    },
    {
        "char": "Þ",
        "html": "&THORN;",
        "dec": "&#222;",
        "hex": "&#xDE;"
    },
    {
        "char": "ß",
        "html": "&szlig;",
        "dec": "&#223;",
        "hex": "&#xDF;"
    },
    {
        "char": "à",
        "html": "&agrave;",
        "dec": "&#224;",
        "hex": "&#xE0;"
    },
    {
        "char": "á",
        "html": "&aacute;",
        "dec": "&#225;",
        "hex": "&#xE1;"
    },
    {
        "char": "â",
        "html": "&acirc;",
        "dec": "&#226;",
        "hex": "&#xE2;"
    },
    {
        "char": "ã",
        "html": "&atilde;",
        "dec": "&#227;",
        "hex": "&#xE3;"
    },
    {
        "char": "ä",
        "html": "&auml;",
        "dec": "&#228;",
        "hex": "&#xE4;"
    },
    {
        "char": "å",
        "html": "&aring;",
        "dec": "&#229;",
        "hex": "&#xE5;"
    },
    {
        "char": "æ",
        "html": "&aelig;",
        "dec": "&#230;",
        "hex": "&#xE6;"
    },
    {
        "char": "ç",
        "html": "&ccedil;",
        "dec": "&#231;",
        "hex": "&#xE7;"
    },
    {
        "char": "è",
        "html": "&egrave;",
        "dec": "&#232;",
        "hex": "&#xE8;"
    },
    {
        "char": "é",
        "html": "&eacute;",
        "dec": "&#233;",
        "hex": "&#xE9;"
    },
    {
        "char": "ê",
        "html": "&ecirc;",
        "dec": "&#234;",
        "hex": "&#xEA;"
    },
    {
        "char": "ë",
        "html": "&euml;",
        "dec": "&#235;",
        "hex": "&#xEB;"
    },
    {
        "char": "ì",
        "html": "&igrave;",
        "dec": "&#236;",
        "hex": "&#xEC;"
    },
    {
        "char": "í",
        "html": "&iacute;",
        "dec": "&#237;",
        "hex": "&#xED;"
    },
    {
        "char": "î",
        "html": "&icirc;",
        "dec": "&#238;",
        "hex": "&#xEE;"
    },
    {
        "char": "ï",
        "html": "&iuml;",
        "dec": "&#239;",
        "hex": "&#xEF;"
    },
    {
        "char": "ð",
        "html": "&eth;",
        "dec": "&#240;",
        "hex": "&#xF0;"
    },
    {
        "char": "ñ",
        "html": "&ntilde;",
        "dec": "&#241;",
        "hex": "&#xF1;"
    },
    {
        "char": "ò",
        "html": "&ograve;",
        "dec": "&#242;",
        "hex": "&#xF2;"
    },
    {
        "char": "ó",
        "html": "&oacute;",
        "dec": "&#243;",
        "hex": "&#xF3;"
    },
    {
        "char": "ô",
        "html": "&ocirc;",
        "dec": "&#244;",
        "hex": "&#xF4;"
    },
    {
        "char": "õ",
        "html": "&otilde;",
        "dec": "&#245;",
        "hex": "&#xF5;"
    },
    {
        "char": "ö",
        "html": "&ouml;",
        "dec": "&#246;",
        "hex": "&#xF6;"
    },
    {
        "char": "ø",
        "html": "&oslash;",
        "dec": "&#248;",
        "hex": "&#xF8;"
    },
    {
        "char": "œ",
        "html": "&oelig;",
        "dec": "&#339;",
        "hex": "&#x153;"
    },
    {
        "char": "š",
        "html": "&scaron;",
        "dec": "&#353;",
        "hex": "&#x161;"
    },
    {
        "char": "ù",
        "html": "&ugrave;",
        "dec": "&#249;",
        "hex": "&#xF9;"
    },
    {
        "char": "ú",
        "html": "&uacute;",
        "dec": "&#250;",
        "hex": "&#xFA;"
    },
    {
        "char": "û",
        "html": "&ucirc;",
        "dec": "&#251;",
        "hex": "&#xFB;"
    },
    {
        "char": "ü",
        "html": "&uuml;",
        "dec": "&#252;",
        "hex": "&#xFC;"
    },
    {
        "char": "ý",
        "html": "&yacute;",
        "dec": "&#253;",
        "hex": "&#xFD;"
    },
    {
        "char": "ÿ",
        "html": "&yuml;",
        "dec": "&#255;",
        "hex": "&#xFF;"
    },
    {
        "char": "þ",
        "html": "&thorn;",
        "dec": "&#254;",
        "hex": "&#xFE;"
    },

    {
        "char": "Œ",
        "html": "&OElig;",
        "dec": "&#338;",
        "hex": "&#x152;"
    },
    {
        "char": "œ",
        "html": "&oelig;",
        "dec": "&#339;",
        "hex": "&#x153;"
    },
    {
        "char": "Š",
        "html": "&Scaron;",
        "dec": "&#352;",
        "hex": "&#x160;"
    },
    {
        "char": "š",
        "html": "&scaron;",
        "dec": "&#353;",
        "hex": "&#x161;"
    },
    {
        "char": "Ÿ",
        "html": "&Yuml;",
        "dec": "&#376;",
        "hex": "&#x178;"
    },

    // Money
    {
        "char": "¢",
        "html": "&cent;",
        "dec": "&#162;",
        "hex": "&#xA2;"
    },
    {
        "char": "£",
        "html": "&pound;",
        "dec": "&#163;",
        "hex": "&#xA3;"
    },
    {
        "char": "¤",
        "html": "&curren;",
        "dec": "&#164;",
        "hex": "&#xA4;"
    },
    {
        "char": "¥",
        "html": "&yen;",
        "dec": "&#165;",
        "hex": "&#xA5;"
    },
    {
        "char": "€",
        "html": "&euro;",
        "dec": "&#8364;",
        "hex": "&#x20AC;"
    },

    // Symbols
    {
        "char": "§",
        "html": "&sect;",
        "dec": "&#167;",
        "hex": "&#xA7;"
    },
    {
        "char": "©",
        "html": "&copy;",
        "dec": "&#169;",
        "hex": "&#xA9;"
    },
    {
        "char": "®",
        "html": "&reg;",
        "dec": "&#174;",
        "hex": "&#xAE;"
    },
    {
        "char": "™",
        "html": "&trade;",
        "dec": "&#8482;",
        "hex": "&#x2122;"
    },
    {
        "char": "ª",
        "html": "&ordf;",
        "dec": "&#170;",
        "hex": "&#xAA;"
    },
    {
        "char": "º",
        "html": "&ordm;",
        "dec": "&#186;",
        "hex": "&#xBA;"
    },
    {
        "char": "¬",
        "html": "&not;",
        "dec": "&#172;",
        "hex": "&#xAC;"
    },
    {
        "char": "­",
        "html": "&shy;",
        "dec": "&#173;",
        "hex": "&#xAD;"
    },
    {
        "char": "¯",
        "html": "&macr;",
        "dec": "&#175;",
        "hex": "&#xAF;"
    },
    {
        "char": "°",
        "html": "&deg;",
        "dec": "&#176;",
        "hex": "&#xB0;"
    },
    {
        "char": "†",
        "html": "&dagger;",
        "dec": "&#8224;",
        "hex": "&#x2020;"
    },
    {
        "char": "‡",
        "html": "&Dagger;",
        "dec": "&#8225;",
        "hex": "&#x2021;"
    },
    {
        "char": "¹",
        "html": "&sup1;",
        "dec": "&#185;",
        "hex": "&#xB9;"
    },
    {
        "char": "²",
        "html": "&sup2;",
        "dec": "&#178;",
        "hex": "&#xB2;"
    },
    {
        "char": "³",
        "html": "&sup3;",
        "dec": "&#179;",
        "hex": "&#xB3;"
    },
    {
        "char": "´",
        "html": "&acute;",
        "dec": "&#180;",
        "hex": "&#xB4;"
    },
    {
        "char": "µ",
        "html": "&micro;",
        "dec": "&#181;",
        "hex": "&#xB5;"
    },
    {
        "char": "¶",
        "html": "&para;",
        "dec": "&#182;",
        "hex": "&#xB6;"
    },
    {
        "char": "·",
        "html": "&middot;",
        "dec": "&#183;",
        "hex": "&#xB7;"
    },
    {
        "char": "¸",
        "html": "&cedil;",
        "dec": "&#184;",
        "hex": "&#xB8;"
    },
    {
        "char": "‍",
        "html": "&zwj;",
        "dec": "&#8205;",
        "hex": "&#x200D;"
    },
    {
        "char": "‌",
        "html": "&zwnj;",
        "dec": "&#8204;",
        "hex": "&#x200C;"
    },

    // Fractions
    {
        "char": "¼",
        "html": "&frac14;",
        "dec": "&#188;",
        "hex": "&#xBC;"
    },
    {
        "char": "½",
        "html": "&frac12;",
        "dec": "&#189;",
        "hex": "&#xBD;"
    },
    {
        "char": "¾",
        "html": "&frac34;",
        "dec": "&#190;",
        "hex": "&#xBE;"
    },

    // Cards
    {
        "char": "♠",
        "html": "&spades;",
        "dec": "&#9824;",
        "hex": "&#x2660;"
    },
    {
        "char": "♣",
        "html": "&clubs;",
        "dec": "&#9827;",
        "hex": "&#x2663;"
    },
    {
        "char": "♥",
        "html": "&hearts;",
        "dec": "&#9829;",
        "hex": "&#x2665;"
    },
    {
        "char": "♦",
        "html": "&diams;",
        "dec": "&#9830;",
        "hex": "&#x2666;"
    },

    // Math & Logic
    {
        "char": "±",
        "html": "&plusmn;",
        "dec": "&#177;",
        "hex": "&#xB1;"
    },
    {
        "char": "×",
        "html": "&times;",
        "dec": "&#215;",
        "hex": "&#xD7;"
    },
    {
        "char": "÷",
        "html": "&divide;",
        "dec": "&#247;",
        "hex": "&#xF7;"
    },
    {
        "char": "∧",
        "html": "&and;",
        "dec": "&#8743;",
        "hex": "&#x2227;"
    },
    {
        "char": "∨",
        "html": "&or;",
        "dec": "&#8744;",
        "hex": "&#x2228;"
    },
    {
        "char": "∠",
        "html": "&ang;",
        "dec": "&#8736;",
        "hex": "&#x2220;"
    },
    {
        "char": "∪",
        "html": "&cup;",
        "dec": "&#8746;",
        "hex": "&#x222A;"
    },
    {
        "char": "∩",
        "html": "&cap;",
        "dec": "&#8745;",
        "hex": "&#x2229;"
    },
    {
        "char": "∅",
        "html": "&empty;",
        "dec": "&#8709;",
        "hex": "&#x2205;"
    },
    {
        "char": "∃",
        "html": "&exist;",
        "dec": "&#8707;",
        "hex": "&#x2203;"
    },
    {
        "char": "ƒ",
        "html": "&fnof;",
        "dec": "&#402;",
        "hex": "&#x192;"
    },
    {
        "char": "∀",
        "html": "&forall;",
        "dec": "&#8704;",
        "hex": "&#x2200;"
    },
    {
        "char": "⁄",
        "html": "&frasl;",
        "dec": "&#8260;",
        "hex": "&#x2044;"
    },
    {
        "char": "≤",
        "html": "&le;",
        "dec": "&#8804;",
        "hex": "&#x2264;"
    },
    {
        "char": "≥",
        "html": "&ge;",
        "dec": "&#8805;",
        "hex": "&#x2265;"
    },
    {
        "char": "≠",
        "html": "&ne;",
        "dec": "&#8800;",
        "hex": "&#x2260;"
    },
    {
        "char": "≅",
        "html": "&cong;",
        "dec": "&#8773;",
        "hex": "&#x2245;"
    },
    {
        "char": "≈",
        "html": "&asymp;",
        "dec": "&#8776;",
        "hex": "&#x2248;"
    },
    {
        "char": "≡",
        "html": "&equiv;",
        "dec": "&#8801;",
        "hex": "&#x2261;"
    },
    {
        "char": "∞",
        "html": "&infin;",
        "dec": "&#8734;",
        "hex": "&#x221E;"
    },
    {
        "char": "∫",
        "html": "&int;",
        "dec": "&#8747;",
        "hex": "&#x222B;"
    },
    {
        "char": "∈",
        "html": "&isin;",
        "dec": "&#8712;",
        "hex": "&#x2208;"
    },
    {
        "char": "∉",
        "html": "&notin;",
        "dec": "&#8713;",
        "hex": "&#x2209;"
    },
    {
        "char": "∋",
        "html": "&ni;",
        "dec": "&#8715;",
        "hex": "&#x220B;"
    },
    {
        "char": "⊂",
        "html": "&sub;",
        "dec": "&#8834;",
        "hex": "&#x2282;"
    },
    {
        "char": "⊄",
        "html": "&nsub;",
        "dec": "&#8836;",
        "hex": "&#x2284;"
    },
    {
        "char": "⊆",
        "html": "&sube;",
        "dec": "&#8838;",
        "hex": "&#x2286;"
    },
    {
        "char": "⊃",
        "html": "&sup;",
        "dec": "&#8835;",
        "hex": "&#x2283;"
    },
    {
        "char": "⊇",
        "html": "&supe;",
        "dec": "&#8839;",
        "hex": "&#x2287;"
    },
    {
        "char": "⟨",
        "html": "&lang;",
        "dec": "&#9001;",
        "hex": "&#x2329;"
    },
    {
        "char": "⟩",
        "html": "&rang;",
        "dec": "&#9002;",
        "hex": "&#x232A;"
    },
    {
        "char": "⌉",
        "html": "&rceil;",
        "dec": "&#8969;",
        "hex": "&#x2309;"
    },
    {
        "char": "⌋",
        "html": "&rfloor;",
        "dec": "&#8971;",
        "hex": "&#x230B;"
    },
    {
        "char": "⌈",
        "html": "&lceil;",
        "dec": "&#8968;",
        "hex": "&#x2308;"
    },
    {
        "char": "⌊",
        "html": "&lfloor;",
        "dec": "&#8970;",
        "hex": "&#x230A;"
    },
    {
        "char": "∗",
        "html": "&lowast;",
        "dec": "&#8727;",
        "hex": "&#x2217;"
    },
    {
        "char": "−",
        "html": "&minus;",
        "dec": "&#8722;",
        "hex": "&#x2212;"
    },
    {
        "char": "∇",
        "html": "&nabla;",
        "dec": "&#8711;",
        "hex": "&#x2207;"
    },
    {
        "char": "⊕",
        "html": "&oplus;",
        "dec": "&#8853;",
        "hex": "&#x2295;"
    },
    {
        "char": "⊗",
        "html": "&otimes;",
        "dec": "&#8855;",
        "hex": "&#x2297;"
    },
    {
        "char": "∂",
        "html": "&part;",
        "dec": "&#8706;",
        "hex": "&#x2202;"
    },
    {
        "char": "‰",
        "html": "&permil;",
        "dec": "&#8240;",
        "hex": "&#x2030;"
    },
    {
        "char": "⊥",
        "html": "&perp;",
        "dec": "&#8869;",
        "hex": "&#x22A5;"
    },
    {
        "char": "ϖ",
        "html": "&piv;",
        "dec": "&#982;",
        "hex": "&#x3D6;"
    },
    {
        "char": "∏",
        "html": "&prod;",
        "dec": "&#8719;",
        "hex": "&#x220F;"
    },
    {
        "char": "∑",
        "html": "&sum;",
        "dec": "&#8721;",
        "hex": "&#x2211;"
    },
    {
        "char": "∝",
        "html": "&prop;",
        "dec": "&#8733;",
        "hex": "&#x221D;"
    },
    {
        "char": "√",
        "html": "&radic;",
        "dec": "&#8730;",
        "hex": "&#x221A;"
    },
    {
        "char": "⋅",
        "html": "&sdot;",
        "dec": "&#8901;",
        "hex": "&#x22C5;"
    },
    {
        "char": "∼",
        "html": "&sim;",
        "dec": "&#8764;",
        "hex": "&#x223C;"
    },
    {
        "char": "∴",
        "html": "&there4;",
        "dec": "&#8756;",
        "hex": "&#x2234;"
    },
    {
        "char": "ϑ",
        "html": "&thetasym;",
        "dec": "&#977;",
        "hex": "&#x3D1;"
    },
    {
        "char": "ϒ",
        "html": "&upsih;",
        "dec": "&#978;",
        "hex": "&#x3D2;"
    },

    // Arrows
    {
        "char": "←",
        "html": "&larr;",
        "dec": "&#8592;",
        "hex": "&#x2190;"
    },
    {
        "char": "→",
        "html": "&rarr;",
        "dec": "&#8594;",
        "hex": "&#x2192;"
    },
    {
        "char": "↑",
        "html": "&uarr;",
        "dec": "&#8593;",
        "hex": "&#x2191;"
    },
    {
        "char": "↓",
        "html": "&darr;",
        "dec": "&#8595;",
        "hex": "&#x2193;"
    },
    {
        "char": "↔",
        "html": "&harr;",
        "dec": "&#8596;",
        "hex": "&#x2194;"
    },
    {
        "char": "⇐",
        "html": "&lArr;",
        "dec": "&#8656;",
        "hex": "&#x21D0;"
    },
    {
        "char": "⇒",
        "html": "&rArr;",
        "dec": "&#8658;",
        "hex": "&#x21D2;"
    },
    {
        "char": "⇑",
        "html": "&uArr;",
        "dec": "&#8657;",
        "hex": "&#x21D1;"
    },
    {
        "char": "⇓",
        "html": "&dArr;",
        "dec": "&#8659;",
        "hex": "&#x21D3;"
    },
    {
        "char": "⇔",
        "html": "&hArr;",
        "dec": "&#8660;",
        "hex": "&#x21D4;"
    },

    // Special
    {
        "char": "ℵ",
        "html": "&alefsym;",
        "dec": "&#8501;",
        "hex": "&#x2135;"
    },
    {
        "char": "↵",
        "html": "&crarr;",
        "dec": "&#8629;",
        "hex": "&#x21B5;"
    },
    {
        "char": "℘",
        "html": "&weierp;",
        "dec": "&#8472;",
        "hex": "&#x2118;"
    },
    {
        "char": "ℑ",
        "html": "&image;",
        "dec": "&#8465;",
        "hex": "&#x2111;"
    },
    {
        "char": "ℜ",
        "html": "&real;",
        "dec": "&#8476;",
        "hex": "&#x211C;"
    },
    {
        "char": "◊",
        "html": "&loz;",
        "dec": "&#9674;",
        "hex": "&#x25CA;"
    },
    {
        "char": "‎",
        "html": "&lrm;",
        "dec": "&#8206;",
        "hex": "&#x200E;"
    },
    {
        "char": "‏",
        "html": "&rlm;",
        "dec": "&#8207;",
        "hex": "&#x200F;"
    },

    // Greek
    {
        "char": "Α",
        "html": "&Alpha;",
        "dec": "&#913;",
        "hex": "&#x391;"
    },
    {
        "char": "Β",
        "html": "&Beta;",
        "dec": "&#914;",
        "hex": "&#x392;"
    },
    {
        "char": "Γ",
        "html": "&Gamma;",
        "dec": "&#915;",
        "hex": "&#x393;"
    },
    {
        "char": "Δ",
        "html": "&Delta;",
        "dec": "&#916;",
        "hex": "&#x394;"
    },
    {
        "char": "Ε",
        "html": "&Epsilon;",
        "dec": "&#917;",
        "hex": "&#x395;"
    },
    {
        "char": "Ζ",
        "html": "&Zeta;",
        "dec": "&#918;",
        "hex": "&#x396;"
    },
    {
        "char": "Η",
        "html": "&Eta;",
        "dec": "&#919;",
        "hex": "&#x397;"
    },
    {
        "char": "Θ",
        "html": "&Theta;",
        "dec": "&#920;",
        "hex": "&#x398;"
    },
    {
        "char": "Ι",
        "html": "&Iota;",
        "dec": "&#921;",
        "hex": "&#x399;"
    },
    {
        "char": "Κ",
        "html": "&Kappa;",
        "dec": "&#922;",
        "hex": "&#x39A;"
    },
    {
        "char": "Λ",
        "html": "&Lambda;",
        "dec": "&#923;",
        "hex": "&#x39B;"
    },
    {
        "char": "Μ",
        "html": "&Mu;",
        "dec": "&#924;",
        "hex": "&#x39C;"
    },
    {
        "char": "Ν",
        "html": "&Nu;",
        "dec": "&#925;",
        "hex": "&#x39D;"
    },
    {
        "char": "Ξ",
        "html": "&Xi;",
        "dec": "&#926;",
        "hex": "&#x39E;"
    },
    {
        "char": "Ο",
        "html": "&Omicron;",
        "dec": "&#927;",
        "hex": "&#x39F;"
    },
    {
        "char": "Π",
        "html": "&Pi;",
        "dec": "&#928;",
        "hex": "&#x3A0;"
    },
    {
        "char": "Ρ",
        "html": "&Rho;",
        "dec": "&#929;",
        "hex": "&#x3A1;"
    },
    {
        "char": "Σ",
        "html": "&Sigma;",
        "dec": "&#931;",
        "hex": "&#x3A3;"
    },
    {
        "char": "Τ",
        "html": "&Tau;",
        "dec": "&#932;",
        "hex": "&#x3A4;"
    },
    {
        "char": "Υ",
        "html": "&Upsilon;",
        "dec": "&#933;",
        "hex": "&#x3A5;"
    },
    {
        "char": "Φ",
        "html": "&Phi;",
        "dec": "&#934;",
        "hex": "&#x3A6;"
    },
    {
        "char": "Χ",
        "html": "&Chi;",
        "dec": "&#935;",
        "hex": "&#x3A7;"
    },
    {
        "char": "Ψ",
        "html": "&Psi;",
        "dec": "&#936;",
        "hex": "&#x3A8;"
    },
    {
        "char": "Ω",
        "html": "&Omega;",
        "dec": "&#937;",
        "hex": "&#x3A9;"
    },
    {
        "char": "α",
        "html": "&alpha;",
        "dec": "&#945;",
        "hex": "&#x3B1;"
    },
    {
        "char": "β",
        "html": "&beta;",
        "dec": "&#946;",
        "hex": "&#x3B2;"
    },
    {
        "char": "γ",
        "html": "&gamma;",
        "dec": "&#947;",
        "hex": "&#x3B3;"
    },
    {
        "char": "δ",
        "html": "&delta;",
        "dec": "&#948;",
        "hex": "&#x3B4;"
    },
    {
        "char": "ε",
        "html": "&epsilon;",
        "dec": "&#949;",
        "hex": "&#x3B5;"
    },
    {
        "char": "ζ",
        "html": "&zeta;",
        "dec": "&#950;",
        "hex": "&#x3B6;"
    },
    {
        "char": "η",
        "html": "&eta;",
        "dec": "&#951;",
        "hex": "&#x3B7;"
    },
    {
        "char": "θ",
        "html": "&theta;",
        "dec": "&#952;",
        "hex": "&#x3B8;"
    },
    {
        "char": "ι",
        "html": "&iota;",
        "dec": "&#953;",
        "hex": "&#x3B9;"
    },
    {
        "char": "κ",
        "html": "&kappa;",
        "dec": "&#954;",
        "hex": "&#x3BA;"
    },
    {
        "char": "λ",
        "html": "&lambda;",
        "dec": "&#955;",
        "hex": "&#x3BB;"
    },
    {
        "char": "μ",
        "html": "&mu;",
        "dec": "&#956;",
        "hex": "&#x3BC;"
    },
    {
        "char": "ν",
        "html": "&nu;",
        "dec": "&#957;",
        "hex": "&#x3BD;"
    },
    {
        "char": "ξ",
        "html": "&xi;",
        "dec": "&#958;",
        "hex": "&#x3BE;"
    },
    {
        "char": "ο",
        "html": "&omicron;",
        "dec": "&#959;",
        "hex": "&#x3BF;"
    },
    {
        "char": "π",
        "html": "&pi;",
        "dec": "&#960;",
        "hex": "&#x3C0;"
    },
    {
        "char": "ρ",
        "html": "&rho;",
        "dec": "&#961;",
        "hex": "&#x3C1;"
    },
    {
        "char": "σ",
        "html": "&sigma;",
        "dec": "&#963;",
        "hex": "&#x3C3;"
    },
    {
        "char": "ς",
        "html": "&sigmaf;",
        "dec": "&#962;",
        "hex": "&#x3C2;"
    },
    {
        "char": "τ",
        "html": "&tau;",
        "dec": "&#964;",
        "hex": "&#x3C4;"
    },
    {
        "char": "υ",
        "html": "&upsilon;",
        "dec": "&#965;",
        "hex": "&#x3C5;"
    },
    {
        "char": "φ",
        "html": "&phi;",
        "dec": "&#966;",
        "hex": "&#x3C6;"
    },
    {
        "char": "χ",
        "html": "&chi;",
        "dec": "&#967;",
        "hex": "&#x3C7;"
    },
    {
        "char": "ψ",
        "html": "&psi;",
        "dec": "&#968;",
        "hex": "&#x3C8;"
    },
    {
        "char": "ω",
        "html": "&omega;",
        "dec": "&#969;",
        "hex": "&#x3C9;"
    },

    // Dashes
    {
        "char": "–",
        "html": "&ndash;",
        "dec": "&#8211;",
        "hex": "&#x2013;"
    },
    {
        "char": "—",
        "html": "&mdash;",
        "dec": "&#8212;",
        "hex": "&#x2014;"
    },
    {
        "char": "−",
        "html": "&minus;",
        "dec": "&#8722;",
        "hex": "&#x2212;"
    }
];

/***
 *      _____           _        _
 *     |  __ \         | |      | |
 *     | |__) | __ ___ | |_ ___ | |_ _   _ _ __   ___  ___
 *     |  ___/ '__/ _ \| __/ _ \| __| | | | '_ \ / _ \/ __|
 *     | |   | | | (_) | || (_) | |_| |_| | |_) |  __/\__ \
 *     |_|   |_|  \___/ \__\___/ \__|\__, | .__/ \___||___/
 *                                    __/ | |
 *                                   |___/|_|
 */

// Finds the last index using the same format as `Array..findIndex`
    // Array..findLastIndex(predicate:function[, thisArg:object]) → number#Integer
Array.prototype.findLastIndex ??= function findLastIndex(predicate, thisArg = null) {
    return (this.length - this.reverse().findIndex(predicate, thisArg)) - 1;
};

// Determines if the array contains any of the value(s)
    // Array..contains(...values:any) → boolean
Array.prototype.contains ??= function contains(...values) {
    let has = false;

    for(let value of values)
        if(has ||= !!~this.indexOf(value))
            break;

    return has;
};

// https://stackoverflow.com/a/6117889/4211612
// Returns the current week of the year
    // Date..getWeek() → number:Integer
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

// Returns an element based upon its text content
    // Element..getElementByText(searchText:string|regexp[, flags:string]) → Element | null
Element.prototype.getElementByText ??= function getElementByText(searchText, flags = '') {
    let searchType = (searchText instanceof RegExp? 'regexp': typeof searchText);

    if(!(searchText?.length ?? searchText?.source))
        throw 'Can not search for empty text';

    let container = this,
        owner = null,
        thisIsOwner = true;

    switch(searchType) {
        case 'regexp': {
            searchText = RegExp(searchText.source, searchText.flags || flags);

            // See if the element contains the text...
            if(!searchText.test(this.textContent))
                return null;

            searching:
            while(nullish(owner)) {
                for(let child of container.children)
                    if([...child.children].filter(element => searchText.test(element.textContent)).length) {
                        // A sub-child is the text container
                        container = child;
                        thisIsOwner = false;

                        continue searching;
                    } else if(searchText.test(child.textContent)) {
                        // This is the text container
                        owner = child;
                        thisIsOwner = false;

                        break searching;
                    }

                // None of the children contain the text...
                if(thisIsOwner)
                    owner = this;
            }

            return owner;
        } break;

        default: {
            // Convert to a string...
            searchText += '';

            if(flags.contains('i')) {
                // Ignore-case mode
                searchText = searchText.toLowerCase();

                // See if the element contains the text...
                if(!this.textContent?.toLowerCase()?.contains(searchText))
                    return null;

                searching:
                while(nullish(owner)) {
                    for(let child of container.children)
                        if([...child.children].filter(element => element.textContent?.toLowerCase()?.contains(searchText)).length) {
                            // A sub-child is the text container
                            container = child;
                            thisIsOwner = false;

                            continue searching;
                        } else if(child.textContent?.toLowerCase()?.contains(searchText)) {
                            // This is the text container
                            owner = child;
                            thisIsOwner = false;

                            break searching;
                        }

                    // None of the children contain the text...
                    if(thisIsOwner)
                        owner = this;
                }
            } else {
                // Normal (perfect-match) mode
                // See if the element contains the text...
                if(!this.textContent?.contains(searchText))
                    return null;

                searching:
                while(nullish(owner)) {
                    for(let child of container.children)
                        if([...child.children].filter(element => element.textContent?.contains(searchText)).length) {
                            // A sub-child is the text container
                            container = child;
                            thisIsOwner = false;

                            continue searching;
                        } else if(child.textContent?.contains(searchText)) {
                            // This is the text container
                            owner = child;
                            thisIsOwner = false;

                            break searching;
                        }

                    // None of the children contain the text...
                    if(thisIsOwner)
                        owner = this;
                }
            }

            return owner;
        } break;
    }
};

// Returns an array of elements that contain the text content
    // Element..getElementsByTextContent(searchText:string|regexp[, flags:string]) → array
Element.prototype.getElementsByTextContent ??= function getElementsByTextContent(searchText, flags = '') {
    let searchType = (searchText instanceof RegExp? 'regexp': typeof searchText);

    if(!(searchText?.length ?? searchText?.source))
        throw 'Can not search for empty text';

    let containers = [];

    switch(searchType) {
        case 'regexp': {
            searchText = RegExp(searchText.source, searchText.flags || flags);

            // See if the element contains the text...
            if(!searchText.test(this.textContent))
                break;
            containers.push(this);

            let children = [...this.children],
                child;

            collecting:
            while(child = children.pop())
                if([...child.children].filter(element => searchText.test(element.textContent)).length) {
                    // A sub-child contains the text
                    containers.push(child);
                    children = [...new Set([...children, ...child.children])];
                } else if(searchText.test(child.textContent)) {
                    // This contains the text
                    containers.push(child);
                }
        } break;

        default: {
            // Convert to a string...
            searchText += '';

            if(flags.contains('i')) {
                // Ignore-case mode
                searchText = searchText.toLowerCase();

                // See if the element contains the text...
                if(!this.textContent?.toLowerCase()?.contains(searchText))
                    break;
                containers.push(this);

                let children = [...this.children],
                    child;

                collecting:
                while(child = children.pop())
                    if([...child.children].filter(element => element.textContent?.toLowerCase()?.contains(searchText)).length) {
                        // A sub-child contains the text
                        containers.push(child);
                        children = [...new Set([...children, ...child.children])];
                    } else if(child.textContent?.toLowerCase()?.contains(searchText)) {
                        // This contains the text
                        containers.push(child);
                    }
            } else {
                // Normal (perfect-match) mode
                // See if the element contains the text...
                if(!this.textContent?.contains(searchText))
                    break;
                containers.push(this);

                let children = [...this.children],
                    child;

                collecting:
                while(child = children.pop())
                    if([...child.children].filter(element => element.textContent?.contains(searchText)).length) {
                        // A sub-child contains the text
                        containers.push(child);
                        children = [...new Set([...children, ...child.children])];
                    } else if(child.textContent?.contains(searchText)) {
                        // This contains the text
                        containers.push(child);
                    }
            }
        } break;
    }

    return [...new Set(containers)];
};

// https://stackoverflow.com/a/35859991/4211612
// Captures the current frame from a video element
    // HTMLVideoElement..captureFrame([imageType:string[, returnType:string]]) → String#dataURL | Object | HTMLImageElement
        // imageType = "image/jpeg" | "image/png" | "image/webp"
        // returnType = "img" | "element" | "HTMLImageElement"
            // → HTMLImageElement
        // returnType = "json" | "object"
            // → Object#{ type=imageType, data:string, height:number#integer, width:number#integer }
        // returnType = "dataURI" | "dataURL" | ...
            // → String#dataURL
HTMLVideoElement.prototype.captureFrame ??= function captureFrame(imageType = "image/png", returnType = "dataURL") {
    let { height, width, videoHeight, videoWidth } = this;

    let canvas = furnish('canvas', { height: height ||= videoHeight, width: width ||= videoWidth }),
        context = canvas.getContext('2d');

    context.drawImage(this, 0, 0);

    let canvasData = canvas.toDataURL(imageType),
        data = canvasData;

    switch(returnType) {
        case 'img':
        case 'element':
        case 'HTMLImageElement': {
            data = document.createElement('img');

            data.src = canvasData;
        } break;

        case 'json':
        case 'object': {
            data = { type: imageType, height, width, data };
        } break;

        default: break;
    }

    canvas?.remove();

    return data;
};

// https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write#example_of_copying_canvas_contents_to_the_clipboard
// Copies the current frame from a video element to the clipboard
    // HTMLVideoElement..copyFrame() → undefined
HTMLVideoElement.prototype.copyFrame ??= function copyFrame() {
    let { height, width, videoHeight, videoWidth } = this;

    let canvas = furnish('canvas', { height: height ||= videoHeight, width: width ||= videoWidth }),
        context = canvas.getContext('2d');

    context.drawImage(this, 0, 0);

    let promise = new Promise((resolve, reject) => {
        canvas.toBlob(blob => navigator.clipboard.write([ new ClipboardItem({ [blob?.type]: blob }) ]).then(resolve).catch(reject));
    });

    canvas?.remove();

    return promise;
};

// Converts SVGs to images
    // SVGtoImage(SVG:HTMLSVGElement|string[, imageType:string[, returnType:string]]) → String#dataURL | Object | HTMLImageElement
        // imageType = "image/jpeg" | "image/png" | "image/webp"
        // returnType = "img" | "element" | "HTMLImageElement"
            // → HTMLImageElement
        // returnType = "json" | "object"
            // → Object#{ type=imageType, data:string, height:number#integer, width:number#integer }
        // returnType = "dataURI" | "dataURL" | ...
            // → String#dataURL
function SVGtoImage(SVG, imageType = "image/png", returnType = "dataURL") {
    if(typeof SVG == 'string' || SVG instanceof String)
        SVG = (SVGtoImage.DOMParser ??= new DOMParser).parseFromString(SVG + '', 'text/xml')?.querySelector('svg');

    let height, width;

    try {
        let offset = getOffset(SVG);

        height = offset.height;
        width = offset.width;
    } catch(e) {
        height = SVG?.height;
        width = SVG?.width;
    } finally {
        height ||= SVG?.getAttribute('height');
        width ||= SVG?.getAttribute('width');
    }

    height = parseFloat(height);
    width = parseFloat(width);

    if(!(height | 0) || !(width | 0))
        throw `Unable to make a canvas of size ${ width }x${ height }`;

    let canvas = furnish('canvas', { height, width }),
        context = canvas.getContext('2d');

    let path = new Path2D($('path', false, SVG)?.getAttribute('d') ?? '');

    context.stroke(path);

    let canvasData = canvas.toDataURL(imageType),
        data = canvasData;

    switch(returnType) {
        case 'img':
        case 'element':
        case 'HTMLImageElement': {
            data = document.createElement('img');

            data.src = canvasData;
        } break;

        case 'json':
        case 'object': {
            data = { type: imageType, height, width, data };
        } break;

        default: break;
    }

    canvas?.remove();

    return data;
};

// Returns a number formatted using unit suffixes
    // Number..suffix([unit:string[, decimalPlaces:boolean|number[, format:string]]]) → string
        // decimalPlaces = true | false | *:number
            // true → 123.456.suffix('m', true) => "123.456m"
            // false → 123.456.suffix('m', false) => "123m"
            // 1 → 123.456.suffix('m', 1) => "123.4m"
        // format = "metric" | "imperial" | "readable"
Number.prototype.suffix ??= function suffix(unit = '', decimalPlaces = true, format = "metric") {
    let number = parseFloat(this),
        sign = number < 0? '-': '',
        suffix = '';

    number = Math.abs(number);

    let system = {},
        capacity = 1_000;

    switch(format.toLowerCase()) {
        case 'imperial': {
            system.large = 'thous m b tr quadr qunit sext sept oct non'
                .split(' ')
                .map((suffix, index) => ' ' + suffix + ['and', 'illion'][+!!index]);
            system.small = system.large.map(suffix => suffix + 'ths');
        } break;

        // Common US shorthands (used on Twitch)
        case 'natural':
        case 'readable': {
            system.large = 'KMBTQ';
            system.small = '';
        } break;

        case 'data': {
            system.large = 'kMGTPEZY';
            system.small = 'mμnpfazy';

            capacity = 1_024;
        } break;

        case 'metric':
        default: {
            system.large = 'kMGTPEZY';
            system.small = 'mμnpfazy';
        } break;
    }

    if(number > 1) {
        for(let index = 0, units = system.large; index < units.length; ++index)
            if(number >= capacity) {
                number /= capacity;
                suffix = units[index];
            }
    } else if(number < 1 && number > 0) {
        for(let index = 0, units = system.small; index < units.length; ++index) {
            if(number < 1) {
                number *= capacity;
                suffix = units[index];
            }
        }
    }

    return sign + (
        decimalPlaces === true?
            number:
        decimalPlaces === false?
            Math.round(number):
        number.toFixed(decimalPlaces)
    ) + suffix + unit;
};

// Floors a number to the nearest X
    // Number..floorToNearest(number) → Number
Number.prototype.floorToNearest ??= function floorToNearest(number) {
    return this - (this % number);
};

// Clamps (keeps) a number between two points
    // Number..clamp(min:number[, max:number]) → Number
Number.prototype.clamp ??= function clamp(min, max) {
    if(Number.isNaN(min))
        throw TypeError('[min] must be a number');

    if(Number.isNaN(max))
        max = ((min < 0)? min - 1: min + 1);

    // Keep everything in order
    if(min > max) {
        let tmp = min;

        min = max;
        max = tmp;
    }

    // clamp.js - https://www.webtips.dev/webtips/javascript/how-to-clamp-numbers-in-javascript
    return Math.min(Math.max(this, min), max);
};

// Adds all Math prototypes to Numbers
    // Math... → Number...
Number.prototype.Math = (parent => {
    let methods = Object.getOwnPropertyNames(parent);

    for(let method of methods) {
        let func = parent[method];

        if(typeof func != 'function')
            continue;

        Number.prototype[method] = function(...args) {
            return func(this, ...args);
        };
    }

    return parent;
})(Math);

// Determines if the string contains any of the value(s)
    // String..contains(...values:any) → boolean
String.prototype.contains ??= function contains(...values) {
    let has = false;

    for(let value of values)
        if(has ||= !!~this.indexOf(value))
            break;

    return has;
};

// Returns a properly formatted string depending on the number given
    // String..properSuffix([numberOfItems:number[, tail:string]])
String.prototype.pluralSuffix ??= function pluralSuffix(numberOfItems = 0, tail = "s") {
    numberOfItems = parseFloat(numberOfItems) | 0;

    let suffix,
        string = this + "";

    ReplaceEnding:
    // There is exactly one (1) item
    if(numberOfItems === 1) {
        break ReplaceEnding;
    }
    // There are X number of items
    else {
        // Ends with a <consonant "y">, as in "century" → "centuries"
        if(/([^aeiou])([y])$/i.test(string))
        EndsWith_Consonant_Y: {
            let { $1, $2 } = RegExp,
                $L = RegExp["$`"],
                $T = {
                    "y": "ies",
                };

            string = $L + $1 + $T[$2];
        }
        // Ends with <vowel "y">, as in "day" → "days"
        else if(/([aeiou])([y])$/i.test(string))
        EndsWith_Vowel_Y: {
            let { $_ } = RegExp;

            string = $_ + tail;
        }
        // Ends with anything else
        else
        EndsWith_Normal: {
            let pattern = (
                /^[A-Z][a-z]/.test(string)?
                    'capped':
                /^[A-Z]/.test(string)?
                    'upper':
                /^[a-z]/.test(string)?
                    'lower':
                ''
            ) + (
                /[a-z]\.[a-z\.]/i.test(string)?
                    '-dotted':
                /[a-z]\-[a-z\-]/i.test(string)?
                    '-dashed':
                /[a-z]\s[a-z\-]/i.test(string)?
                    '-spaced':
                ''
            );

            switch(string.toLowerCase().trim()) {
                // alumnus / alumni
                case 'alumnus': {
                    string = toFormat('alumni', pattern);
                } break;

                case 'alumni': {
                    // "alumni" is plural of "alumnus"
                } break;

                // appendix / appendicies
                case 'appendix': {
                    string = toFormat('appendicies', pattern);
                } break;

                case 'appendicies': {
                    // "appendicies" is plural of "appendix"
                } break;

                // ax | axe | axis / axes
                case 'ax':
                case 'axe':
                case 'axis': {
                    string = toFormat('axes', pattern);
                } break;

                case 'axes': {
                    // "axes" is plural of "ax", "axe", and "axis"
                } break;

                // bacterium / bacteria
                case 'bacterium': {
                    string = toFormat('bacteria', pattern);
                } break;

                case 'bacteria': {
                    // "bacteria" is plural of "bacterium"
                } break;

                // cactus / cacti
                case 'cactus': {
                    string = toFormat('cacti', pattern);
                } break;

                case 'cacti': {
                    // "cacti" is plural of "cactus"
                } break;

                // calf / calves
                case 'calf': {
                    string = toFormat('calves', pattern);
                } break;

                case 'calves': {
                    // "calves" is plural of "calf"
                } break;

                // cello / celli
                case 'cello': {
                    string = toFormat('celli', pattern);
                } break;

                case 'celli': {
                    // "celli" is plural of "cello"
                } break;

                // child / children
                case 'child': {
                    string = toFormat('children', pattern);
                } break;

                case 'children': {
                    // "children" is plural of "child"
                } break;

                // curriculum / curricula
                case 'curriculum': {
                    string = toFormat('curricula', pattern);
                } break;

                case 'curricula': {
                    // "curricula" is plural of "curriculum"
                } break;

                // datum / data
                case 'datum': {
                    string = toFormat('data', pattern);
                } break;

                case 'data': {
                    // "data" is plural of "datum"
                } break;

                // die / dice
                case 'die': {
                    string = toFormat('dice', pattern);
                } break;

                case 'dice': {
                    // "dice" is plural of "die"
                } break;

                // focus / foci
                case 'focus': {
                    string = toFormat('foci', pattern);
                } break;

                case 'foci': {
                    // "foci" is plural of "focus"
                } break;

                // foot / feet
                case 'foot': {
                    string = toFormat('feet', pattern);
                } break;

                case 'feet': {
                    // "feet" is plural of "foot"
                } break;

                // fez / fezzes
                case 'fez': {
                    string = toFormat('fezzes', pattern);
                } break;

                case 'fezzes': {
                    // "fezzes" is plural of "fez"
                } break;

                // fungus / fungi
                case 'fungus': {
                    string = toFormat('fungi', pattern);
                } break;

                case 'fungi': {
                    // "fungi" is plural of "fungus"
                } break;

                // gas / gasses
                case 'gas': {
                    string = toFormat('gasses', pattern);
                } break;

                case 'gasses': {
                    // "gasses" is plural of "gas"
                } break;

                // goose / geese
                case 'goose': {
                    string = toFormat('geese', pattern);
                } break;

                case 'geese': {
                    // "geese" is plural of "goose"
                } break;

                // hero / heroes
                case 'hero': {
                    string = toFormat('heroes', pattern);
                } break;

                case 'heroes': {
                    // "heroes" is plural of "hero"
                } break;

                // hippopotamus / hippopotami
                case 'hippopotamus': {
                    string = toFormat('hippopotami', pattern);
                } break;

                case 'hippopotami': {
                    // "hippopotami" is plural of "hippopotamus"
                } break;

                // index / indices
                case 'index': {
                    string = toFormat('indices', pattern);
                } break;

                case 'indices': {
                    // "indices" is plural of "index"
                } break;

                // knife / knives
                case 'knife': {
                    string = toFormat('knives', pattern);
                } break;

                case 'knives': {
                    // "knives" is plural of "knife"
                } break;

                // leaf / leaves
                case 'leaf': {
                    string = toFormat('leaves', pattern);
                } break;

                case 'leaves': {
                    // "leaves" is plural of "leaf"
                } break;

                // life / lives
                case 'life': {
                    string = toFormat('lives', pattern);
                } break;

                case 'lives': {
                    // "lives" is plural of "life"
                } break;

                // man / men
                case 'man': {
                    string = toFormat('men', pattern);
                } break;

                case 'men': {
                    // "men" is plural of "man"
                } break;

                // memorandum / memoranda
                case 'memorandum': {
                    string = toFormat('memoranda', pattern);
                } break;

                case 'memoranda': {
                    // "memoranda" is plural of "memorandum"
                } break;

                // mouse / mice
                case 'mouse': {
                    string = toFormat('mice', pattern);
                } break;

                case 'mice': {
                    // "mice" is plural of "mouse"
                } break;

                // nucleus / nuclei
                case 'nucleus': {
                    string = toFormat('nuclei', pattern);
                } break;

                case 'nuclei': {
                    // "nuclei" is plural of "nucleus"
                } break;

                // octopus / octopi
                case 'octopus': {
                    string = toFormat('octopi', pattern);
                } break;

                case 'octopi': {
                    // "octopi" is plural of "octopus"
                } break;

                // ox / oxen
                case 'ox': {
                    string = toFormat('oxen', pattern);
                } break;

                case 'oxen': {
                    // "oxen" is plural of "ox"
                } break;

                // person / people
                case 'person': {
                    string = toFormat('people', pattern);
                } break;

                case 'people': {
                    // "people" is plural of "person"
                } break;

                // potato / potatoes
                case 'potato': {
                    string = toFormat('potatoes', pattern);
                } break;

                case 'potatoes': {
                    // "potatoes" is plural of "potato"
                } break;

                // radius / radii
                case 'radius': {
                    string = toFormat('radii', pattern);
                } break;

                case 'radii': {
                    // "radii" is plural of "radius"
                } break;

                // stratum / strata
                case 'stratum': {
                    string = toFormat('strata', pattern);
                } break;

                case 'strata': {
                    // "strata" is plural of "stratum"
                } break;

                // tomato / tomatoes
                case 'tomato': {
                    string = toFormat('tomatoes', pattern);
                } break;

                case 'tomatoes': {
                    // "tomatoes" is plural of "tomato"
                } break;

                // tooth / teeth
                case 'tooth': {
                    string = toFormat('teeth', pattern);
                } break;

                case 'teeth': {
                    // "teeth" is plural of "tooth"
                } break;

                // torpedo / torpedoes
                case 'torpedo': {
                    string = toFormat('torpedoes', pattern);
                } break;

                case 'torpedoes': {
                    // "torpedoes" is plural of "torpedo"
                } break;

                // veto / vetoes
                case 'veto': {
                    string = toFormat('vetoes', pattern);
                } break;

                case 'vetoes': {
                    // "vetoes" is plural of "veto"
                } break;

                // vortex / vortices
                case 'vortex': {
                    string = toFormat('vortices', pattern);
                } break;

                case 'vortices': {
                    // "vortices" is plural of "vortex"
                } break;

                // wife / wives
                case 'wife': {
                    string = toFormat('wives', pattern);
                } break;

                case 'wives': {
                    // "wives" is plural of "wife"
                } break;

                // wolf / wolves
                case 'wolf': {
                    string = toFormat('wolves', pattern);
                } break;

                case 'wolves': {
                    // "wolves" is plural of "wolf"
                } break;

                // woman / women
                case 'woman': {
                    string = toFormat('women', pattern);
                } break;

                case 'women': {
                    // "women" is plural of "woman"
                } break;

                // No change
                case 'aircraft':
                case 'buffalo':
                case 'deer':
                case 'fish':
                case 'hovercraft':
                case 'moose':
                case 'series':
                case 'sheep':
                case 'shrimp':
                case 'spacecraft':
                case 'species':
                case 'swine':
                case 'trout':
                case 'watercraft': {
                    // these words are already pluralized
                } break;

                // "Normal" operations
                default: {
                    // "lunch" → "lunches"
                    if(/([cs]h|[sxz])$/i.test(string))
                        string += toFormat('es', pattern);
                    // "ellipsis" → "ellipses"
                    else if(/(is)$/i.test(string))
                        string = string.replace(RegExp.$1, toFormat('es', pattern));
                    // "criterion" → "criteria"
                    else if(/(on)$/i.test(string))
                        string = string.replace(RegExp.$1, toFormat('a', pattern));
                    else
                        string += toFormat('s', pattern);
                } break;
            }
        }
    }

    return string;
};

/***
 *      __  __ _              _ _
 *     |  \/  (_)            | | |
 *     | \  / |_ ___  ___ ___| | | __ _ _ __   ___  ___  _   _ ___
 *     | |\/| | / __|/ __/ _ \ | |/ _` | '_ \ / _ \/ _ \| | | / __|
 *     | |  | | \__ \ (_|  __/ | | (_| | | | |  __/ (_) | |_| \__ \
 *     |_|  |_|_|___/\___\___|_|_|\__,_|_| |_|\___|\___/ \__,_|___/
 *
 *
 */
// Returns if an item is of an object class
    // isObj([object:*[, ...or:Function=Constructor]]) → Boolean
function isObj(object, ...or) {
    return !![Object, Array, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, Map, Set, ...or]
        .find(constructor => object?.constructor === constructor || object instanceof constructor);
}

// Returns a number formatted with commas
function comify(number, locale = top.LANGUAGE) {
    return parseFloat(number).toLocaleString(locale);
}

// Returns a string reformatted
    // toFormat(string:string, pattern:string)
function toFormat(string, patterns) {
    patterns = patterns.split('-');

    let nonWords = /[\s\-\+]+/;
    for(let pattern of patterns)
        switch(pattern) {
            case 'capped': {
                string = string.toLowerCase().replace(/(\w)/, ($0, $1, $$, $_) => $1.toUpperCase());
            } break;

            case 'upper': {
                string = string.toUpperCase();
            } break;

            case 'lower': {
                string = string.toLowerCase();
            } break;

            case 'dotted': {
                string = string.split(nonWords).join('.');
            } break;

            case 'dashed': {
                string = string.split(nonWords).join('-');
            } break;

            case 'spaced': {
                string = string.split(nonWords).join(' ');
            } break;
        }

    return string;
}

// https://stackoverflow.com/a/19176790/4211612
// Returns the assumed operating system
    // GetOS() → String
function GetOS() {
    let { userAgent } = top.navigator;
    let OSs = {
        'NT 10.0': 'Win 10',
        'NT 6.3': 'Win 8.1',
        'NT 6.2': 'Win 8',
        'NT 6.1': 'Win 7',
        'NT 6.0': 'Win Vista',
        'NT 5.1': 'Win XP',
        'NT 5.0': 'Win 2000',
        'Mac': 'Mac',
        'X11': 'UNIX',
        'Linux': 'Linux',
    };

    for(let OS in OSs)
        if(userAgent.contains(OS))
            return OSs[OS].replace(/^Win/, 'Windows');

    return 'Unknown';
}

// Returns the assumed key combination
    // GetMacro(keys:string) → string
function GetMacro(keys = '', OS = null) {
    keys = (keys ?? '').trim();
    OS ??= GetOS();

    let pattern = [
        /^[A-Z][a-z]/.test(keys)?
            'capped':
        /^[A-Z]/.test(keys)?
            'upper':
        /^[a-z]/.test(keys)?
            'lower':
        ''
    ,
        /[a-z]\.[a-z\.]/i.test(keys)?
            'dotted':
        /[a-z]\-[a-z\-]/i.test(keys)?
            'dashed':
        /[a-z]\s[a-z\-]/i.test(keys)?
            'spaced':
        ''
    ].filter(string => string.length).join('-');

    // Mouse buttons (emojis)
    let Mouse = {
        AClick: 'primary_mouse_button',
        BClick: 'secondary_mouse_button',
    };

    return keys
        .split(/([\s\-\+]+)/)
        .filter(string => !!string.length)
        .map(key => {
            switch(OS.slice(0, 7)) {
                /** MacOS Keys | Order of Precedence → Ctrl Opt Shift Cmd [Key(s)]
                 * Control (Ctrl)       ^
                 * Option/Alt (Opt/Alt) ⌥
                 * Shift                ⇧
                 * Command (Cmd)        ⌘
                 * Caps Lock            ⇪
                 */
                case 'Mac': {
                    key = (
                        /^(Win)$/i.test(key)?
                            '\u2318':
                        /^(Alt)$/i.test(key)?
                            '\u2325':
                        /^(Shift)$/i.test(key)?
                            '\u21e7':
                        /^([AB]Click)$/.test(key)?
                            Glyphs.utf8[Mouse[RegExp.$1]]:
                        key
                    );
                } break;

                // Windows Keys | Order of Precedence → Meta Ctrl Alt Shift [Key(s)]
                case 'Windows': {
                    key = (
                        /^(Cmd|\u2318)$/i.test(key)?
                            'Win':
                        /^(Alt|\u2325)$/i.test(key)?
                            'Alt':
                        /^(Shift|\u21e7)$/i.test(key)?
                            'Shift':
                        /^([AB]Click)$/.test(key)?
                            Glyphs.utf8[Mouse[RegExp.$1]]:
                        key
                    );
                } break;
            };

            return toFormat(key, pattern);
        })
        .join('');
}

// Logs messages (green)
    // LOG([...messages]) → undefined
function LOG(...messages) {
    let CSS = `
        background-color: #00332b;
        border-bottom: 1px solid #0000;
        border-top: 1px solid #065;
        box-sizing: border-box;
        clear: right;
        color: #f5f5f5;
        display: block !important;
        line-height: 2;
        user-select: text;

        flex-basis: 1;
        flex-shrink: 1;

        margin: 0;
        overflow-wrap: break-word;
        padding: 0 6px;
        position: fixed;
        z-index: -1;

        min-height: 0;
        min-width: 100%;
        height: 100%;
        width: 100%;
    `;

    console.group(`%c\u22b3 [LOG] \u2014 Twitch Tools`, CSS);

    for(let message of messages) {
        let type = 'c';

        if(!isObj(message, Boolean, Number, Promise))
            try {
                message = message.toString();
            } catch(error) {
                /* Can't convert to string */
            }
        else
            type = 'o';

        (type/* == 'o'*/)?
            console.log(message):
        console.log(
            `%${ type }\u22b3 ${ message } `,
            CSS
        );
    }

    console.groupEnd();

    return ({
        toNativeStack(stack = console.log) {
            stack(...messages);
        },

        toForeignStack(stack) {
            return stack(messages.join(' '));
        },
    });
};

// Logs warnings (yellow)
    // WARN([...messages]) → undefined
function WARN(...messages) {
    let CSS = `
        background-color: #332b00;
        border-bottom: 1px solid #0000;
        border-top: 1px solid #650;
        box-sizing: border-box;
        clear: right;
        color: #f5f5f5;
        display: block !important;
        line-height: 2;
        user-select: text;

        flex-basis: 1;
        flex-shrink: 1;

        margin: 0;
        overflow-wrap: break-word;
        padding: 0 6px;
        position: fixed;
        z-index: -1;

        min-height: 0;
        min-width: 100%;
        height: 100%;
        width: 100%;
    `;

    console.group(`%c\u26a0 [WARNING] \u2014 Twitch Tools`, CSS);

    for(let message of messages) {
        let type = 'c';

        if(!isObj(message, Boolean, Number, Promise))
            try {
                message = message.toString();
            } catch(error) {
                /* Can't convert to string */
            }
        else
            type = 'o';

        (type/* == 'o'*/)?
            console.log(message):
        console.log(
            `%${ type }\u26a0 ${ message } `,
            CSS
        );
    }

    console.groupEnd();

    return ({
        toNativeStack(stack = console.warn) {
            stack(...messages);
        },

        toForeignStack(stack) {
            return stack(messages.join(' '));
        },
    });
};

// Logs errors (red)
    // ERROR([...messages]) → undefined
function ERROR(...messages) {
    let CSS = `
        background-color: #290000;
        border-bottom: 1px solid #0000;
        border-top: 1px solid #5c0000;
        box-sizing: border-box;
        clear: right;
        color: #f5f5f5;
        display: block !important;
        line-height: 2;
        user-select: text;

        flex-basis: 1;
        flex-shrink: 1;

        margin: 0;
        overflow-wrap: break-word;
        padding: 0 6px;
        position: fixed;
        z-index: -1;

        min-height: 0;
        min-width: 100%;
        height: 100%;
        width: 100%;
    `;

    console.group(`%c\u2298 [ERROR] \u2014 Twitch Tools`, CSS);

    for(let message of messages) {
        let type = 'c';

        if(!isObj(message, Boolean, Number, Promise))
            try {
                message = message.toString();
            } catch(error) {
                /* Can't convert to string */
            }
        else
            type = 'o';

        (type/* == 'o'*/)?
            console.log(message):
        console.log(
            `%${ type }\u2298 ${ message } `,
            CSS
        );
    }

    console.groupEnd();

    return ({
        toNativeStack(stack = console.error) {
            stack(...messages);
        },

        toForeignStack(stack) {
            return stack(messages.join(' '));
        },
    });
};

// Logs comments (blue)
    // LOG([...messages]) → undefined
function REMARK(...messages) {
    let CSS = `
        background-color: #002b55;
        border-bottom: 1px solid #0000;
        border-top: 1px solid #057;
        box-sizing: border-box;
        clear: right;
        color: #f5f5f5;
        display: block !important;
        line-height: 2;
        user-select: text;

        flex-basis: 1;
        flex-shrink: 1;

        margin: 0;
        overflow-wrap: break-word;
        padding: 0 6px;
        position: fixed;
        z-index: -1;

        min-height: 0;
        min-width: 100%;
        height: 100%;
        width: 100%;
    `;

    console.group(`%c\u22b3 [COMMENT] \u2014 Twitch Tools`, CSS);

    for(let message of messages) {
        let type = 'c';

        if(!isObj(message, Boolean, Number, Promise))
            try {
                message = message.toString();
            } catch(error) {
                /* Can't convert to string */
            }
        else
            type = 'o';

        (type/* == 'o'*/)?
            console.log(message):
        console.log(
            `%${ type }\u22b3 ${ message } `,
            CSS
        );
    }

    console.groupEnd();

    return ({
        toNativeStack(stack = console.log) {
            stack(...messages);
        },

        toForeignStack(stack) {
            return stack(messages.join(' '));
        },
    });
};

// "Clicks" on elements
function phantomClick(...elements) {
    for(let element of elements) {
        let mousedown = new MouseEvent('mousedown', { bubbles: true }),
            mouseup = new MouseEvent('mouseup', { bubbles: true });

        element?.dispatchEvent(mousedown);
        setTimeout(() => element?.dispatchEvent(mouseup), 30);
    }
}

// Displays an alert message
    // alert([message:string]) → null
function alert(message = '') {
    if(defined($('.tt-alert')))
        return awaitOn(() => !defined($('.tt-alert'))? alert(message): null);

    let f = furnish;

    let container =
    f('div.tt-alert', {},
        f('div.tt-alert-container', {},
            f('div.tt-alert-header', { innerHTML: `TTV Tools &mdash; Please see...` }),
            f('div.tt-alert-body', { innerHTML: message }),
            f('div.tt-alert-footer', {},
                f('button.okay', {
                    onmousedown({ currentTarget }) {
                        let parent = currentTarget.closest('.tt-alert');

                        parent.setAttribute('value', true);
                    },
                    onmouseup({ currentTarget }) {
                        let parent = currentTarget.closest('.tt-alert'),
                            timedJobID = parseInt(parent.getAttribute('timedJobID') || -1);

                        parent.classList.add('tt-done');
                        setTimeout(() => parent.classList.remove('tt-veiled'), 500);
                        setTimeout(() => parent.remove(), 1_000);
                        clearInterval(timedJobID);
                    }
                }, 'OK')
            )
        )
    );

    document.body.append(container);

    return awaitOn(() => {
        let element = $('.tt-alert'),
            value = element?.getAttribute('value'),
            timedOut = parseBool($('.tt-alert-time')?.getAttribute('tt-done'));

        value &&= parseBool(value);

        if(timedOut) {
            let button = $('button.okay', false, element);

            phantomClick(button);

            return awaitOn.void;
        }

        return (value? awaitOn.void: null);
    });
}

// Displays an alert message (silently)
    // alert.silent([message:string]) → null
alert.silent ??= (message = '') => {
    if(defined($('.tt-alert')))
        return awaitOn(() => !defined($('.tt-alert'))? alert.silent(message): null);

    let response = alert(message),
        container = $('.tt-alert');

    if(container.classList.contains('tt-silent'))
        return response;

    container.classList.add('tt-silent');
    setTimeout(() => container.classList.add('tt-veiled'), 7_000);

    return response;
};

// Displays an alert message with a timer
    // alert.timed([message:string[, milliseconds:number[, pausable:boolean]]]) → null
alert.timed ??= (message = '', milliseconds = 60_000, pausable = false) => {
    if(defined($('.tt-alert')))
        return awaitOn(() => !defined($('.tt-alert'))? alert.timed(message, milliseconds, pausable): null);

    let response = alert.silent(message),
        container = $('.tt-alert');

    if(container.classList.contains('tt-timed'))
        return response;

    container.classList.add('tt-timed');
    $('.tt-alert-header').append(
        furnish('span.tt-alert-time', { due: (+new Date) + milliseconds }, toTimeString(milliseconds))
    );

    let timedJobID = setInterval(() => {
        let time = $('.tt-alert-time'),
            due = parseInt(time?.getAttribute('due')),
            milliseconds = (+new Date(due) - (+new Date));

        if(!defined(time))
            return clearInterval(timedJobID);

        if(pausable && $('*:is(:hover, :focus-within)', true).contains(time.closest('.tt-alert-container')))
            return time.setAttribute('due', due + 100);

        time.closest('.tt-alert-container').setAttribute('tt-time-left', time.textContent = toTimeString((milliseconds < 0? 0: milliseconds), '?seconds_s'));
        time.setAttribute('tt-done', milliseconds < 0);
    }, 100);

    container.setAttribute('timedJobID', timedJobID);

    return response;
};

// Displays a confirmation message
    // confirm([message:string]) → Boolean|null
function confirm(message = '') {
    if(defined($('.tt-confirm')))
        return awaitOn(() => !defined($('.tt-confirm'))? confirm(message): null);

    let f = furnish;

    let container =
    f('div.tt-confirm', {},
        f('div.tt-confirm-container', {},
            f('div.tt-confirm-header', { innerHTML: `TTV Tools &mdash; Please confirm...` }),
            f('div.tt-confirm-body', { innerHTML: message }),
            f('div.tt-confirm-footer', {},
                f('button.edit.deny', {
                    onmousedown({ currentTarget }) {
                        let parent = currentTarget.closest('.tt-confirm');

                        parent.setAttribute('value', false);
                    },
                    onmouseup({ currentTarget }) {
                        let parent = currentTarget.closest('.tt-confirm'),
                            timedJobID = parseInt(parent.getAttribute('timedJobID') || -1);

                        parent.classList.add('tt-done');
                        setTimeout(() => parent.classList.remove('tt-veiled'), 500);
                        setTimeout(() => parent.remove(), 1_000);
                        clearInterval(timedJobID);
                    },
                }, 'Cancel'),

                f('button.okay', {
                    onmousedown({ currentTarget }) {
                        let parent = currentTarget.closest('.tt-confirm');

                        parent.setAttribute('value', true);
                    },
                    onmouseup({ currentTarget }) {
                        let parent = currentTarget.closest('.tt-confirm'),
                            timedJobID = parseInt(parent.getAttribute('timedJobID') || -1);

                        parent.classList.add('tt-done');
                        setTimeout(() => parent.classList.remove('tt-veiled'), 500);
                        setTimeout(() => parent.remove(), 1_000);
                        clearInterval(timedJobID);
                    },
                }, 'OK')
            )
        )
    );

    document.body.append(container);

    return awaitOn(() => {
        let element = $('.tt-confirm'),
            value = element?.getAttribute('value'),
            timedOut = parseBool($('.tt-confirm-time')?.getAttribute('tt-done'));

        value &&= parseBool(value);

        if(timedOut) {
            let button = $('button.deny', false, element);

            phantomClick(button);

            return awaitOn.null;
        }

        return value;
    });
}

// Displays a confirmation message (silently)
    // confirm.silent([message:string]) → Boolean|null
confirm.silent ??= (message = '') => {
    if(defined($('.tt-confirm')))
        return awaitOn(() => !defined($('.tt-confirm'))? confirm.silent(message): null);

    let response = confirm(message),
        container = $('.tt-confirm');

    if(container.classList.contains('tt-silent'))
        return response;

    container.classList.add('tt-silent');
    setTimeout(() => container.classList.add('tt-veiled'), 7_000);

    return response;
};

// Displays a confirmation message with a timer
    // confirm.timed([message:string[, milliseconds:number[, pausable:boolean]]]) → Boolean|null
confirm.timed ??= (message = '', milliseconds = 60_000, pausable = false) => {
    if(defined($('.tt-confirm')))
        return awaitOn(() => !defined($('.tt-confirm'))? confirm.timed(message, milliseconds, pausable): null);

    let response = confirm.silent(message),
        container = $('.tt-confirm');

    if(container.classList.contains('tt-timed'))
        return response;

    container.classList.add('tt-timed');
    $('.tt-confirm-header').append(
        furnish('span.tt-confirm-time', { due: (+new Date) + milliseconds }, toTimeString(milliseconds))
    );

    let timedJobID = setInterval(() => {
        let time = $('.tt-confirm-time'),
            due = parseInt(time?.getAttribute('due')),
            milliseconds = (+new Date(due) - (+new Date));

        if(!defined(time))
            return clearInterval(timedJobID);

        if(pausable && $('*:is(:hover, :focus-within)', true).contains(time.closest('.tt-confirm-container')))
            return time.setAttribute('due', due + 100);

        time.closest('.tt-confirm-container').setAttribute('tt-time-left', time.textContent = toTimeString((milliseconds < 0? 0: milliseconds), '?seconds_s'));
        time.setAttribute('tt-done', milliseconds < 0);
    }, 100);

    container.setAttribute('timedJobID', timedJobID);

    return response;
};

// Prompts a message
    // prompt([message:string[, defaultValue:string]]) → String|null
function prompt(message = '', defaultValue = '') {
    if(defined($('.tt-prompt')))
        return awaitOn(() => !defined($('.tt-prompt'))? prompt(message, defaultValue): null);

    let f = furnish;

    let format = (null
        ?? $('[format]', false, (new DOMParser).parseFromString(message, 'text/html'))?.textContent
        ?? (
            parseBool(defaultValue)?
                `Default: ${ defaultValue }`:
            ''
        )
    );

    let container =
    f('div.tt-prompt', {},
        f('div.tt-prompt-container', {},
            f('div.tt-prompt-header', { innerHTML: `TTV Tools &mdash; Please provide input...` }),
            f('div.tt-prompt-body', { innerHTML: message }),
            f('div.tt-prompt-footer', {},
                f('input.tt-prompt-input', {
                    type: 'text', placeholder: format,

                    onkeydown({ target = null, isTrusted = false, keyCode = -1, altKey = false, ctrlKey = false, metaKey = false, shiftKey = false }) {
                        if(isTrusted && keyCode == 13 && !(altKey || ctrlKey || metaKey || shiftKey))
                            phantomClick($('.tt-prompt-footer button.okay'));
                    }
                }),

                f('button.edit.deny', {
                    onmousedown({ currentTarget }) {
                        let parent = currentTarget.closest('.tt-prompt');

                        parent.setAttribute('value', '\0');
                    },
                    onmouseup({ currentTarget }) {
                        let parent = currentTarget.closest('.tt-prompt'),
                            timedJobID = parseInt(parent.getAttribute('timedJobID') || -1);

                        parent.classList.add('tt-done');
                        setTimeout(() => parent.classList.remove('tt-veiled'), 500);
                        setTimeout(() => parent.remove(), 1_000);
                        clearInterval(timedJobID);
                    },
                }, 'Cancel'),

                f('button.okay', {
                    onmousedown({ currentTarget }) {
                        let parent = currentTarget.closest('.tt-prompt');

                        parent.setAttribute('value', $('.tt-prompt-input').value);
                    },
                    onmouseup({ currentTarget }) {
                        let parent = currentTarget.closest('.tt-prompt'),
                            timedJobID = parseInt(parent.getAttribute('timedJobID') || -1);

                        parent.classList.add('tt-done');
                        setTimeout(() => parent.classList.remove('tt-veiled'), 500);
                        setTimeout(() => parent.remove(), 1_000);
                        clearInterval(timedJobID);
                    },
                }, 'OK')
            )
        )
    );

    document.body.append(container);

    $('.tt-prompt-input').value = defaultValue;

    return awaitOn(() => {
        let element = $('.tt-prompt'),
            value = element?.getAttribute('value'),
            timedOut = parseBool($('.tt-prompt-time')?.getAttribute('tt-done'));

        if(timedOut) {
            let button = $('button.deny', false, element);

            phantomClick(button);

            return awaitOn.null;
        }

        return (value == '\0'? awaitOn.null: value);
    });
}

// Prompts a message (silently)
    // prompt.silent([message:string[, defaultValue:string]]) → String|null
prompt.silent ??= (message = '', defaultValue = '') => {
    if(defined($('.tt-prompt')))
        return awaitOn(() => !defined($('.tt-prompt'))? prompt.silent(message, defaultValue): null);

    let response = prompt(message, defaultValue),
        container = $('.tt-prompt');

    if(container.classList.contains('tt-silent'))
        return response;

    container.classList.add('tt-silent');
    setTimeout(() => container.classList.add('tt-veiled'), 7_000);

    return response;
};

// Prompts a message with a timer
    // prompt.timed([message:string[, milliseconds:number[, pausable:boolean]]]) → String|null
prompt.timed ??= (message = '', milliseconds = 60_000, pausable = true) => {
    if(defined($('.tt-prompt')))
        return awaitOn(() => !defined($('.tt-prompt'))? prompt.timed(message, milliseconds, pausable): null);

    let response = prompt.silent(message),
        container = $('.tt-prompt');

    if(container.classList.contains('tt-timed'))
        return response;

    container.classList.add('tt-timed');
    $('.tt-prompt-header').append(
        furnish('span.tt-prompt-time', { due: (+new Date) + milliseconds }, toTimeString(milliseconds))
    );

    let timedJobID = setInterval(() => {
        let time = $('.tt-prompt-time'),
            due = parseInt(time?.getAttribute('due')),
            milliseconds = (+new Date(due) - (+new Date));

        if(!defined(time))
            return clearInterval(timedJobID);

        if(pausable && $('*:is(:hover, :focus-within)', true).contains(time.closest('.tt-prompt-container')))
            return time.setAttribute('due', due + 100);

        time.closest('.tt-prompt-container').setAttribute('tt-time-left', time.textContent = toTimeString((milliseconds < 0? 0: milliseconds), '?seconds_s'));
        time.setAttribute('tt-done', milliseconds < 0);
    }, 100);

    container.setAttribute('timedJobID', timedJobID);

    return response;
};
