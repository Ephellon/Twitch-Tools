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
    // parseURL(url:string) -> Object
function parseURL(url) {
    if(!defined(url))
        return {};

    url = url.toString();

    let data = url.match(/^((([^:\/?#]+):)?(?:\/{2})?)(?:([^:]+):([^@]+)@)?(([^:\/?#]*)?(?:\:(\d+))?)?([^?#]*)(\?[^#]*)?(#.*)?$/),
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
};

// Create elements
    // furnish(tagname:string[, attributes:object[, ...children]]) -> Element
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
    // getOffset(element:Element) -> Object={ left:number, top:number }
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
    // toTimeString([milliseconds:number[, format:string]]) -> String
function toTimeString(milliseconds = 0, format = 'natural') {
    let second = 1000,
        minute = 60 * second,
        hour   = 60 * minute,
        day    = 24 * hour,
        year   = 365 * day;

    let time = [],
        times = [
            ['year'  ,   year],
            ['day'   ,    day],
            ['hour'  ,   hour],
            ['minute', minute],
            ['second', second],
        ],
        result;

    let joining_symbol = ' ',
        sign = (milliseconds < 0? '-': '');

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

            times.push(['millisecond', milliseconds]);

            result = format.split(/\!(year|day|hour|minute|(?:milli)?second)s?\b/g)
                .map($1 => {
                    for(let [name, value] of times)
                        if($1 == 'millisecond')
                            return milliseconds;
                        else if($1 == name)
                            return time[name] ?? '00';

                    return $1;
                })
        } break;
    }

    return sign + result.join(joining_symbol);
}

// Convert a time-formatted string into its corresponding millisecond value
    // parseTime([time:string]) -> Number
function parseTime(time = '') {
    let units = [1000, 60, 60, 24, 365].map((unit, index, array) => (array.slice(0, index).map(u => unit *= u), unit)),
        ms = 0;

    for(let unit of time.split(':').reverse())
        ms += parseInt(unit) * units.splice(0,1)[0];

    return ms;
}

// Convert boolean values
    // parseBool(value:*) -> Boolean
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
    // Array..findLastIndex(predicate:function[, thisArg:object]) -> number#Integer
Array.prototype.findLastIndex ??= function findLastIndex(predicate, thisArg = null) {
    return (this.length - this.reverse().findIndex(predicate, thisArg)) - 1;
};

// Determines if the array contains any of the value(s)
    // Array..contains(...values:any) -> boolean
Array.prototype.contains ??= function contains(...values) {
    let has = false;

    for(let value of values)
        if(has ||= !!~this.indexOf(value))
            break;

    return has;
};

// https://stackoverflow.com/a/35859991/4211612
// Captures the current frame from a video element
    // HTMLVideoElement..captureFrame([imageType:string[, returnType:string]]) -> String#dataURL | Object | HTMLImageElement
        // imageType = "image/jpeg" | "image/png" | "image/webp"
        // returnType = "img" | "element" | "HTMLImageElement"
            // -> HTMLImageElement
        // returnType = "json" | "object"
            // -> Object#{ type=imageType, data:string, height:number#integer, width:number#integer }
        // returnType = "dataURI" | "dataURL" | ...
            // -> String#dataURL
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

// Returns a number formatted using unit suffixes
    // Number..suffix([unit:string[, decimalPlaces:boolean|number[, format:string]]]) -> string
        // decimalPlaces = true | false | *:number
            // true -> 123.456.suffix('m', true) => "123.456m"
            // false -> 123.456.suffix('m', false) => "123m"
            // 1 -> 123.456.suffix('m', 1) => "123.4m"
        // format = "metric" | "imperial" | "readable"
Number.prototype.suffix ??= function suffix(unit = '', decimalPlaces = true, format = "metric") {
    let number = parseFloat(this),
        sign = number < 0? '-': '',
        suffix = '';

    number = Math.abs(number);

    let system = {};

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

        case 'metric':
        default: {
            system.large = 'kMGTPEZY';
            system.small = 'mμnpfazy';
        } break;
    }

    if(number > 1) {
        for(let index = 0, units = system.large; index < units.length; ++index)
            if(number >= 1e3) {
                number /= 1e3;
                suffix = units[index];
            }
    } else if(number < 1 && number > 0) {
        for(let index = 0, units = system.small; index < units.length; ++index) {
            if(number < 1) {
                number *= 1e3;
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
    // Number..floorToNearest(number) -> Number
Number.prototype.floorToNearest ??= function floorToNearest(number) {
    return this - (this % number);
};

// Clamps (keeps) a number between two points
    // Number..clamp(min:number[, max:number]) -> Number
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
    // Math... -> Number...
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
        // Ends with a <consonant "y">, as in "century" -> "centuries"
        if(/([^aeiou])([y])$/i.test(string))
        EndsWith_Consonant_Y: {
            let { $1, $2 } = RegExp,
                $L = RegExp["$`"],
                $T = {
                    "y": "ies",
                };

            string = $L + $1 + $T[$2];
        }
        // Ends with <vowel "y">, as in "day" -> "days"
        else if(/([aeiou])([y])$/i.test(string))
        EndsWith_Vowel_Y: {
            let { $_ } = RegExp;

            string = $_ + tail;
        }
        // Ends with anything else
        else
        EndsWith_Normal: {
            let pattern = (
                /^[A-Z][a-z]+$/.test(string)?
                    'capped':
                /^[A-Z]+$/.test(string)?
                    'upper':
                /^[a-z]+$/.test(string)?
                    'lower':
                ''
            ) + (
                /^[a-z]\.[a-z\.]+$/i.test(string)?
                    '-dotted':
                /^[a-z]\-[a-z\-]+$/i.test(string)?
                    '-dashed':
                ''
            );

            function toFormat(string, patterns) {
                patterns = patterns.split('-');

                for(let pattern of patterns)
                    switch(pattern) {
                        case 'capped': {
                            string = string[0].toUpperCase() + string.slice(1, string.length).toLowerCase();
                        } break;

                        case 'upper': {
                            string = string.toUpperCase();
                        } break;

                        case 'lower': {
                            string = string.toLowerCase();
                        } break;

                        case 'dotted': {
                            string = string.split('').join('.');
                        } break;

                        case 'dashed': {
                            string = string.split('').join('-');
                        } break;
                    }

                return string;
            }

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
                    // "lunch" -> "lunches"
                    if(/([cs]h|[sxz])$/i.test(string))
                        string += toFormat('es', pattern);
                    // "ellipsis" -> "ellipses"
                    else if(/(is)$/i.test(string))
                        string = string.replace(RegExp.$1, toFormat('es', pattern));
                    // "criterion" -> "criteria"
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
    // isObj([object:*[, ...or:Function=Constructor]]) -> Boolean
function isObj(object, ...or) {
    return !![Object, Array, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, Map, Set, ...or]
        .find(constructor => object?.constructor === constructor || object instanceof constructor);
}

// Returns a number formatted with commas
function comify(number, locale = top.LANGUAGE) {
    return parseFloat(number).toLocaleString(locale);
}

// https://stackoverflow.com/a/19176790/4211612
// Returns the assumed operating system
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
        if(!!~userAgent.indexOf(OS))
            return OSs[OS].replace(/^Win/, 'Windows');

    return 'unknown';
}

// Logs messages (green)
    // LOG([...messages]) -> undefined
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
        toNativeStack() {
            console.log(...messages);
        }
    });
};

// Logs warnings (yellow)
    // WARN([...messages]) -> undefined
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
        toNativeStack() {
            console.warn(...messages);
        }
    });
};

// Logs errors (red)
    // ERROR([...messages]) -> undefined
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
        toNativeStack() {
            console.error(...messages);
        }
    });
};

// Logs comments (blue)
    // LOG([...messages]) -> undefined
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
        toNativeStack() {
            console.log(...messages);
        }
    });
};
